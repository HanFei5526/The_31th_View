/**
 * 《卅一景》AI 服务
 *
 * 统一封装 DeepSeek V4 Pro API 调用。
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
} from './ai-prompts.js';

const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-v4-pro';

export class AIService {
  constructor(engine) {
    /** @type {import('./game-engine.js').GameEngine} */
    this.engine = engine;

    /** DeepSeek API Key */
    this._apiKey = '';

    /** 周鹤年对话历史（每次场景切换时清空） */
    this._zhouHistory = [];
  }

  /* ==========================
     配置
     ========================== */

  /**
   * 配置 API Key
   * @param {string} key
   */
  configure(key) {
    this._apiKey = key || '';
    if (this._apiKey) {
      console.log('[AIService] API Key 已配置');
    } else {
      console.warn('[AIService] 未配置 API Key，AI 功能将不可用');
    }
  }

  /** @returns {boolean} API Key 是否已配置 */
  get isAvailable() {
    return this._apiKey.length > 0;
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
     方案 B · 笔记本查阅
     ========================== */

  /**
   * 通过笔记本查阅信息（画中世界，单轮）
   * @param {string} question - 玩家问题
   * @returns {Promise<string>} 笔记本的回答
   */
  async queryNotebook(question) {
    const ctx = this.engine.getAIContext();
    const systemPrompt = buildNotebookQueryPrompt(ctx);

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

  /**
   * 调用 DeepSeek API
   * @private
   * @param {Array} messages - 消息数组
   * @param {object} options - temperature, max_tokens
   * @returns {Promise<string>} AI 回复文本
   */
  async _callAPI(messages, options = {}) {
    if (!this.isAvailable) {
      return '（AI 功能未启用，请在 .env 文件中配置 VITE_DEEPSEEK_API_KEY）';
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 300,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[AIService] API 请求失败:', response.status, errText);
        return '（笔记本页面有些模糊，暂时无法辨认……）';
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('[AIService] API 返回格式异常:', data);
        return '（墨迹尚未干透……）';
      }

      return content.trim();
    } catch (err) {
      console.error('[AIService] 网络错误:', err);
      return '（连接中断，请稍后再试……）';
    }
  }
}
