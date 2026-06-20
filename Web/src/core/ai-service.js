/**
 * 《卅一景》AI 服务
 *
 * 统一封装 AI 后端代理调用。
 * 作为引擎子系统，由 GameEngine 持有。
 *
 * 四个对外接口：
 *   chatWithZhou   — 周鹤年对话（方案 A）
 *   queryNotebook  — 笔记本查阅（方案 B）
 *   generateAnnotation — 批注生成（方案 B）
 *   generateReport — 修复报告（方案 C）
 */

import {
  buildZhouPrompt,
  buildNotebookQueryPrompt,
  buildAnnotationPrompt,
  buildReportPrompt,
  buildGateZhouPrompt,
} from './ai-prompts.js';

/**
 * API 配置。前端只请求本地/同源代理，不持有真实 DeepSeek Key。
 */
const AI_BACKEND_URL = (import.meta.env?.VITE_AI_BACKEND_URL || '').replace(/\/$/, '');
const HEALTH_ENDPOINT = `${AI_BACKEND_URL}/api/health`;
const CHAT_ENDPOINT = `${AI_BACKEND_URL}/api/chat`;

export class AIService {
  constructor(engine) {
    /** @type {import('./game-engine.js').GameEngine} */
    this.engine = engine;

    /** 后端是否可用（健康检查通过后置为 true） */
    this._available = false;
    this._configured = false;
    this._healthCheckPromise = null;

    /** 周鹤年对话历史（每次场景切换时清空） */
    this._zhouHistory = [];
  }

  /* ==========================
     配置
     ========================== */

  /**
   * 探测配置状态。
   * @returns {Promise<boolean>}
   */
  async configure() {
    if (this._healthCheckPromise) return this._healthCheckPromise;

    this._healthCheckPromise = fetch(HEALTH_ENDPOINT)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`health check failed: ${response.status}`);
        }
        const data = await response.json();
        this._available = Boolean(data.ok && data.configured);
        this._configured = true;

        if (this._available) {
          console.log(`[AIService] AI 后端代理已就绪，模型：${data.model || 'unknown'}`);
        } else {
          console.warn('[AIService] AI 后端未配置 DEEPSEEK_API_KEY，将走离线降级模式');
        }
        return this._available;
      })
      .catch((err) => {
        this._available = false;
        this._configured = true;
        console.warn('[AIService] AI 后端不可用，将走离线降级模式:', err);
        return false;
      })
      .finally(() => {
        this._healthCheckPromise = null;
      });

    return this._healthCheckPromise;
  }

  /** @returns {boolean} 后端是否可用 */
  get isAvailable() {
    return this._available;
  }

  /** 清空周鹤年对话历史（场景切换时调用） */
  clearZhouHistory() {
    this._zhouHistory = [];
  }

  /* ==========================
     方案 A · 周鹤年对话
     ========================== */

  /**
   * 与周鹤年进行多轮对话
   * @param {string} userMessage - 玩家输入
   * @returns {Promise<string>} 周鹤年的回复
   */
  async chatWithZhou(userMessage) {
    const ctx = this.engine.getAIContext();
    const systemPrompt = buildZhouPrompt(ctx);

    // 追加用户消息到历史
    this._zhouHistory.push({ role: 'user', content: userMessage });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this._zhouHistory,
    ];

    const reply = await this._callAPI(messages, {
      temperature: 0.7,
      max_tokens: 300,
    });

    // 追加 AI 回复到历史
    this._zhouHistory.push({ role: 'assistant', content: reply });

    return reply;
  }

  /* ==========================
     方案 A+ · 研讨门槛对话
     ========================== */

  /**
   * 研讨门槛中与周鹤年讨论
   * @param {string} gateId - 门槛ID
   * @param {string} userMessage - 玩家输入
   * @param {Array} history - 对话历史 [{role, content}, ...]
   * @param {string} systemHint - 系统提示（由前端关键词判定注入）
   * @returns {Promise<string>} 周鹤年的回复
   */
  async discussWithZhou(gateId, userMessage, history = [], systemHint = '') {
    const ctx = this.engine.getAIContext();
    const systemPrompt = buildGateZhouPrompt(ctx, gateId, systemHint);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    return this._callAPI(messages, {
      temperature: 0.7,
      max_tokens: 300,
    });
  }

  /* ==========================
     方案 B · 笔记本查阅
     ========================== */

  /**
   * 通过笔记本查阅信息（画中世界，单轮）
   * @param {string} question - 玩家问题
   * @returns {Promise<string>} 笔记本的回答
   */
  async queryNotebook(question) {
    const ctx = this.engine.getAIContext();
    const systemPrompt = buildNotebookQueryPrompt(ctx, this.engine.gameProgress);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ];

    return this._callAPI(messages, {
      temperature: 0.5,
      max_tokens: 200,
    });
  }

  /**
   * 根据游戏事件生成沈念的反思批注
   * @param {string} eventType - 事件类型
   * @param {string} eventDetail - 事件描述
   * @returns {Promise<string>} 批注文本
   */
  async generateAnnotation(eventType, eventDetail) {
    const ctx = this.engine.getAIContext();
    const systemPrompt = buildAnnotationPrompt(ctx, eventType, eventDetail);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请写下你的批注。' },
    ];

    const text = await this._callAPI(messages, {
      temperature: 0.6,
      max_tokens: 150,
    });

    // 通知其他模块
    this.engine.emit('ai-annotation-generated', {
      text,
      chapter: this.engine.currentChapter,
      eventType,
    });

    return text;
  }

  /* ==========================
     方案 C · 修复报告
     ========================== */

  /**
   * 生成个性化修复报告（终章，一次性调用）
   * @param {string} endingChoice - 'archive' | 'secret' | 'continue'
   * @returns {Promise<string>} 报告全文
   */
  async generateReport(endingChoice) {
    const ctx = this.engine.getAIContext();
    const systemPrompt = buildReportPrompt(ctx, endingChoice);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请撰写最终文本。' },
    ];

    const report = await this._callAPI(messages, {
      temperature: 0.4,
      max_tokens: 800,
    });

    this.engine.emit('ai-report-generated', { report, ending: endingChoice });

    return report;
  }

  /* ==========================
     内部方法
     ========================== */

  async _callAPI(messages, options = {}) {
    if (!this._configured) {
      await this.configure();
    }

    if (!this.isAvailable) {
      return '（AI 后端未启用。请启动 Web/server 并在服务端 .env 中配置 DEEPSEEK_API_KEY）';
    }

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 300,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[AIService] 请求失败:', response.status, errText);
        return '（大模型有些困惑，暂时无法辨认……）';
      }

      const data = await response.json();
      const content = data.content;

      if (!content) {
        console.error('[AIService] 返回格式异常:', data);
        return '（模型返回空文本……）';
      }

      return content.trim();
    } catch (err) {
      console.error('[AIService] 网络错误:', err);
      return '（连接中断，请稍后再试……）';
    }
  }
}
