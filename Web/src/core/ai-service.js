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
 *   generateFinalNote — 终章后结案笔记（方案 C）
 */

import {
  buildZhouPrompt,
  buildNotebookQueryPrompt,
  buildAnnotationPrompt,
  buildFinalNotePrompt,
  buildGateZhouPrompt,
} from './ai-prompts.js';

/**
 * API 配置。
 * 开发环境：连接独立后端 (localhost:8787)
 * 生产环境：前后端同容器，使用空字符串走同源请求
 */
const AI_BACKEND_URL = (import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8787')
).replace(/\/$/, '');
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
      max_tokens: 220,
      retryOnShort: true,
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
    const contextualFallback = this._getNotebookQueryFallback(question, ctx);
    const genericFallback = '（翻了翻，相关记录没有形成清晰答复。可以换个线索名再问一次。）';

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ];

    const reply = await this._callAPI(messages, {
      temperature: 0.2,
      max_tokens: 280,
      retryOnEmpty: true,
      retryOnShort: true,
      fallbackText: contextualFallback || genericFallback,
      unavailableText: contextualFallback,
      networkFallbackText: contextualFallback,
    });

    const sanitized = this._sanitizeNotebookReply(reply);
    if (
      contextualFallback
      && /没有找到相关记录|没有形成清晰答复|暂时没有回应/.test(sanitized)
    ) {
      return contextualFallback;
    }

    return sanitized;
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
     方案 C · 结案笔记
     ========================== */

  /**
   * 生成结局后的沈念结案笔记（终章后可选调用）
   * @param {string} endingChoice - 'archive' | 'secret' | 'continue'
   * @returns {Promise<string>} 结案笔记全文
   */
  async generateFinalNote(endingChoice) {
    const ctx = this.engine.getAIContext();
    const systemPrompt = buildFinalNotePrompt(ctx, endingChoice);
    const fallbackText = this._getFinalNoteFallback(endingChoice);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请写下这页结案笔记。' },
    ];

    const note = await this._callAPI(messages, {
      temperature: 0.35,
      max_tokens: 520,
      retryOnEmpty: true,
      retryOnShort: true,
      fallbackText,
      unavailableText: fallbackText,
      networkFallbackText: fallbackText,
    });

    const finalNote = this._isInvalidFinalNote(note) ? fallbackText : note;

    this.engine.emit('ai-final-note-generated', { note: finalNote, ending: endingChoice });

    return finalNote;
  }

  /**
   * 兼容旧接口：当前终章不再让 AI 生成结局正文或正式修复报告。
   * @param {string} endingChoice
   * @returns {Promise<string>}
   */
  async generateReport(endingChoice) {
    return this.generateFinalNote(endingChoice);
  }

  /* ==========================
     内部方法
     ========================== */

  async _callAPI(messages, options = {}) {
    if (!this._configured) {
      await this.configure();
    }

    if (!this.isAvailable) {
      return options.unavailableText
        || '（笔记本暂时没有回应。可以先继续查看记录，稍后再试。）';
    }

    const maxAttempts = (options.retryOnEmpty || options.retryOnShort) ? 2 : 1;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
          return options.fallbackText || '（笔记本页边的字迹暂时散开了，稍后再试。）';
        }

        const data = await response.json();
        const content = typeof data.content === 'string' ? data.content.trim() : '';

        if (!content) {
          console.error('[AIService] 返回格式异常:', data);
          if (attempt < maxAttempts && options.retryOnEmpty) continue;
          return options.fallbackText || '（笔记本页边没有浮现新的记录。）';
        }

        if (options.retryOnShort && this._isLikelyIncompleteReply(content)) {
          console.warn('[AIService] 回复疑似截断，准备重试:', content);
          if (attempt < maxAttempts) continue;
          return options.fallbackText || content;
        }

        return content;
      }
    } catch (err) {
      console.error('[AIService] 网络错误:', err);
      return options.networkFallbackText || '（笔记本暂时没有回应。可以先继续查看记录，稍后再试。）';
    }

    return options.fallbackText || '（笔记本页边的字迹暂时散开了，稍后再试。）';
  }

  _isLikelyIncompleteReply(content) {
    const text = String(content || '').trim();
    if (!text) return true;

    const totalLength = Array.from(text).length;
    if (totalLength <= 3) return true;

    const closingIndex = text.indexOf('）');
    if (text.startsWith('（') && closingIndex >= 0) {
      const afterPrefix = text.slice(closingIndex + 1).trim();
      if (afterPrefix && Array.from(afterPrefix).length <= 2) {
        return true;
      }
    }

    return !/[。！？.!?”"）】]$/.test(text);
  }

  _sanitizeNotebookReply(content) {
    return String(content || '')
      .replace(/ch\d+_[A-Za-z0-9_]+/g, '相关记录')
      .replace(/prologue_[A-Za-z0-9_]+/g, '相关记录')
      .replace(/clue_[A-Za-z0-9_]+/g, '相关线索')
      .replace(/finale_[A-Za-z0-9_]+/g, '相关记录')
      .replace(/不能直接等同于并非一人独绘/g, '不能直接当作成稿归属的定论')
      .replace(/不能直接证明并非一人独绘/g, '只能提示作品来源或观看来源存在疑问')
      .replace(/并非一人独绘/g, '作品来源或观看来源存在疑问')
      .replace(/多人执笔/g, '作品来源或观看来源存在疑问')
      .replace(/共同成稿/g, '作品来源或观看来源存在疑问')
      .replace(/作品来源或观看来源存在疑问，也可能是作品来源或观看来源存在疑问或作品来源或观看来源存在疑问/g, '作品来源或观看来源存在疑问')
      .replace(/作品来源或观看来源存在疑问，也可能是作品来源或观看来源存在疑问/g, '作品来源或观看来源存在疑问')
      .replace(/作品来源或观看来源存在疑问或作品来源或观看来源存在疑问/g, '作品来源或观看来源存在疑问');
  }

  _getNotebookQueryFallback(question, ctx = {}) {
    const text = String(question || '');
    const progress = ctx.progress || {};

    if (!progress.zhuiyunExplored) return '';

    if (text.includes('站着看不到') || text.includes('蹲下来')) {
      return '（笔记本边注）这一处更像是在提示观察高度。低下来之后出现的微光，说明画中有些痕迹需要换到更低的位置才会显现；此时它还不是结论，只是一种观察方法。';
    }

    if (
      progress.plaqueNoted
      && text.includes('低处微光')
      && text.includes('匾额')
    ) {
      return '（修复记录）可以先并列记录：它们都不是普通游览视线里最先注意到的内容，也都像正式画面之外的异常痕迹。但现在还不能把它们直接连成来源判断。';
    }

    if (text.includes('有些景') && text.includes('低处')) {
      return '（笔记本边注）它目前说明的是一种看法：有些痕迹需要从低处、偏处、不那么正式的位置才会显现。它提醒继续换角度观察，还不能直接推出是谁留下了这些痕迹。';
    }

    return '';
  }

  _isInvalidFinalNote(content) {
    const text = String(content || '').trim();
    if (!text) return true;
    const forbidden = [
      '足够构成学术定论',
      '这个视角不属于文徵明',
      '应被正式署名',
      '正式档案已更新',
      '报告已提交',
      '正式报告已归档',
      '档案已封存',
      '绝非文徵明',
      '不属于文徵明',
      '不是文徵明的',
      '无法归于文徵明',
      '不能归于文徵明',
      '这幅画里不止文徵明',
      '不是画者的位置',
      '不是成稿之手',
      '仅仅归于文徵明',
      '视角不属于文徵明',
      '观看位置不属于文徵明',
      '观看位置不属于他',
      '视角不属于他',
      '不是文徵明之眼',
      '仅由一人之眼',
      '仅由一人之眼完成',
      '文徵明其他画稿',
      '文徵明的其他画稿',
      '落笔习惯与文徵明',
      '笔迹鉴定',
      '画稿风格',
      '技法风格无异常',
      '不该出现在文徵明视线高度',
      '并非一人独绘',
      '共同成稿',
      '多人执笔',
      '别人成稿',
      '他不是在要求署名',
      '他用观看留下痕迹',
      '摹手',
      '附会',
      '足够确认',
      '不值得被',
    ];
    if (forbidden.some((phrase) => text.includes(phrase))) return true;

    const body = text.replace(/^【修复记录终页】\s*/, '').trim();
    const bodyLength = Array.from(body).length;
    const paragraphCount = body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean).length;
    if (paragraphCount > 2) return true;

    return bodyLength < 120 || bodyLength > 220;
  }

  _getFinalNoteFallback(endingChoice) {
    const fallbackByEnding = {
      archive: '【修复记录终页】\n\n我把这个可能性写进了正式报告，但仍只能用谨慎的语气。旧题签残角、残字旁注与低位草图彼此照应，足以让我相信这里曾有另一种观看。画心仍是文徵明完成，王蘅留下的是视角的来源痕迹。我不能替她正名，也不能把推想写成定论；能做的，只是让这条痕迹从此有处可查。',
      secret: '【修复记录终页】\n\n正式档案仍保持平静，我把没有提交的部分留在这里。旧题签、残字、细线、断簪与残砚，已经足以让我看见她曾经看见。这个选择不是否认，也不是遗忘；只是承认有些痕迹不必被公开命名，仍然可以被认真保存。我知道答案会停在暗处，但暗处并不等于消失；这页笔记会替我记住。',
      continue: '【修复记录终页】\n\n我没有把这件事写成定论，而是铺开新纸。第三十一景保存了她看见的园，我想记录的是那个曾经蹲下去观看的人。新画不是证据，也不能替她正名；它只是我对那些痕迹的回应。有人看见过，也终于有人记住了这种观看。我不把它当作结论，只当作迟来的回应，也把这一刻留在笔记里。',
    };

    return fallbackByEnding[endingChoice] || '【修复记录终页】\n\n那些线索仍然留在笔记本里：旧题签、残字、细线、物件与草图彼此照应。它们不能把一切变成无可争议的定论，却足以让沈念知道，曾经有一种观看被保存下来。无需替她正名，只要让痕迹继续被看见。';
  }
}
