/**
 * 《卅一景》研讨门槛管理器
 *
 * 核心改造：从"选对答案"改为"表达理解"
 * - 玩家自由输入，不做选择题
 * - 系统通过关键词匹配判定推理合理性
 * - AI / 离线预写回复只负责自然对话引导，不做通过判定
 */

import { getGateConfig, analyzePlayerInput, analyzePlayerInputAccumulated } from './gate-config.js';

export class DiscussionGateManager {
  constructor(engine) {
    this.engine = engine;
    this.gatesCompleted = new Set();
    this.activeGate = null;
    this.activeGateMode = null;
    this.uiCallback = null;
    this.synthesisCallbacks = null;
    this.fallbackState = {}; // 离线模式状态
    this.dialogueHistory = new Map(); // gateId -> [{role, content}]
    this.insightProgress = new Map(); // gateId -> Set(conceptIds)
    this.roundCount = new Map(); // gateId -> number
    this.failedRoundCount = new Map(); // gateId -> number
    this.synthesisPromptStages = new Map(); // gateId -> Set(stageId)
    this.synthesisWrongDirectionCount = new Map(); // gateId -> number
    this.synthesisTimerIds = new Map(); // gateId -> number
    this.synthesisAssistedPassTriggered = new Set();
    this.synthesisInfoProgress = new Map(); // gateId -> Set(infoTag)
    this.lastSynthesisQuickThought = new Map(); // gateId -> quick thought text
  }

  isGateCompleted(gateId) {
    return this.gatesCompleted.has(gateId);
  }

  markGateCompleted(gateId) {
    this.gatesCompleted.add(gateId);
    const completedId = this.activeGate;
    this._clearSynthesisTimer(gateId);
    this.activeGate = null;
    this.activeGateMode = null;
    this.uiCallback = null;
    this.synthesisCallbacks = null;

    // 清理状态
    this.dialogueHistory.delete(gateId);
    this.insightProgress.delete(gateId);
    this.roundCount.delete(gateId);
    this.failedRoundCount.delete(gateId);
    this.synthesisPromptStages.delete(gateId);
    this.synthesisWrongDirectionCount.delete(gateId);
    this.synthesisAssistedPassTriggered.delete(gateId);
    this.synthesisInfoProgress.delete(gateId);
    this.lastSynthesisQuickThought.delete(gateId);

    // 通知外部
    this.engine.emit('gate-completed', { gateId: completedId });
  }

  /**
   * 启动一个研讨门槛
   * @param {string} gateId 门槛ID
   * @param {Object} uiCallback UI回调接口
   */
  startGate(gateId, uiCallback) {
    if (this.isGateCompleted(gateId)) {
      console.warn(`Gate ${gateId} 已经完成，跳过。`);
      return;
    }

    const config = getGateConfig(gateId);
    if (!config) {
      console.error(`未找到门槛 ${gateId} 的配置数据`);
      this.markGateCompleted(gateId);
      return;
    }

    this.activeGate = gateId;
    this.activeGateMode = 'discussion';
    this.uiCallback = uiCallback;

    // 初始化状态
    if (!this.insightProgress.has(gateId)) {
      this.insightProgress.set(gateId, new Set());
    }
    if (!this.roundCount.has(gateId)) {
      this.roundCount.set(gateId, 0);
    }

    // 展示开场白和快捷按钮
    this.uiCallback.showOpening(config.title, config.opening);
    this.uiCallback.showQuickThoughts(config.quickThoughts);

    // 如果AI不可用，隐藏输入框？不，离线也保留输入框
    if (!this.engine.aiService || !this.engine.aiService.isAvailable) {
      this.uiCallback.setOfflineMode(true);
    }
  }

  /**
   * 启动综合研讨门槛
   * @param {string} gateId 门槛ID
   * @param {Object} container NotebookFloating 或同等研讨 UI 回调接口
   * @param {Object} callbacks 生命周期回调
   */
  startSynthesisGate(gateId, container, callbacks = {}) {
    if (this.isGateCompleted(gateId)) {
      callbacks.onCompleted?.({ gateId });
      return;
    }

    const config = getGateConfig(gateId);
    if (!config) {
      console.error(`未找到综合门槛 ${gateId} 的配置数据`);
      this.markGateCompleted(gateId);
      return;
    }

    this.activeGate = gateId;
    this.activeGateMode = 'synthesis';
    this.uiCallback = container;
    this.synthesisCallbacks = callbacks;

    this.dialogueHistory.set(gateId, []);
    this.insightProgress.set(gateId, new Set());
    this.roundCount.set(gateId, 0);
    this.failedRoundCount.set(gateId, 0);
    this.synthesisPromptStages.set(gateId, new Set());
    this.synthesisWrongDirectionCount.set(gateId, 0);
    this.synthesisAssistedPassTriggered.delete(gateId);
    this.synthesisInfoProgress.set(gateId, new Set());
    this.lastSynthesisQuickThought.delete(gateId);
    this._startSynthesisTimer(gateId, config);

    if (container.mount) {
      container.mount(
        config.title,
        (text) => this.handleSynthesisInput(text),
        (text) => this.handleQuickThought(text)
      );
    }

    this.uiCallback.showOpening(config.title, config.opening);
    this.uiCallback.showQuickThoughts(config.quickThoughts);

    if (!this.engine.aiService || !this.engine.aiService.isAvailable) {
      this.uiCallback.setOfflineMode(true);
    }
  }

  /**
   * 处理玩家输入（统一入口）
   * 研讨已降级为辅助讨论：不设通过条件，自由交流即可
   * @param {string} text 玩家输入的文本
   */
  async handlePlayerInput(text) {
    if (!this.activeGate || !text.trim()) return;

    const gateId = this.activeGate;
    const config = getGateConfig(gateId);
    if (!config) return;

    // 记录玩家消息到UI
    this.uiCallback.showPlayerMessage(text);

    // 记录对话历史
    if (!this.dialogueHistory.has(gateId)) {
      this.dialogueHistory.set(gateId, []);
    }
    this.dialogueHistory.get(gateId).push({ role: 'user', content: text });

    // ===== 辅助讨论模式：不设通过条件，只生成回复 =====
    this.uiCallback.setLoading(true);

    try {
      if (this.engine.aiService && this.engine.aiService.isAvailable) {
        await this._handleDiscussionMode(gateId, config, text);
      } else {
        await this._handleOfflineDiscussion(gateId, config);
      }
    } catch (err) {
      console.error('讨论处理错误:', err);
      this.uiCallback.showNPCMessage('（网络似乎有些不稳定，稍后再试？）');
    } finally {
      this.uiCallback.setLoading(false);
    }
  }

  /**
   * 处理综合门槛输入：关键词跨轮累积，AI/离线回复只负责引导
   * @param {string} text 玩家输入的文本
   * @param {Object} options 输入来源配置
   */
  async handleSynthesisInput(text, options = {}) {
    if (!this.activeGate || this.activeGateMode !== 'synthesis' || !text.trim()) return;

    const gateId = this.activeGate;
    const config = getGateConfig(gateId);
    if (!config) return;
    const isQuickThought = options.source === 'quick-thought';

    // 显示玩家消息
    this.uiCallback.showPlayerMessage(text);

    if (!this.dialogueHistory.has(gateId)) {
      this.dialogueHistory.set(gateId, []);
    }
    if (!this.insightProgress.has(gateId)) {
      this.insightProgress.set(gateId, new Set());
    }

    this.dialogueHistory.get(gateId).push({ role: 'user', content: text });

    if (isQuickThought) {
      this._recordSynthesisInfoFromQuickThought(gateId, config, text);
      const presetReply = config.quickThoughtReplies?.[text];
      if (presetReply) {
        this.dialogueHistory.get(gateId).push({ role: 'assistant', content: presetReply });
        this.uiCallback.showNPCMessage(presetReply);
        return;
      }

      this.uiCallback.setLoading(true);
      try {
        if (this.engine.aiService && this.engine.aiService.isAvailable) {
          await this._handleSynthesisAI(gateId, config, text, {
            matchedConcepts: [],
            accumulatedConcepts: Array.from(this.insightProgress.get(gateId) || []),
            blockedByNegation: false,
            wrongDirection: false,
            fromQuickThought: true,
          });
        } else {
          await this._handleSynthesisOffline(gateId, config, text, {
            matchedConcepts: [],
            accumulatedConcepts: Array.from(this.insightProgress.get(gateId) || []),
            blockedByNegation: false,
            wrongDirection: false,
            fromQuickThought: true,
          });
        }
      } catch (err) {
        console.error('综合研讨快捷提示处理错误:', err);
        this.uiCallback.showNPCMessage('（笔记本页边的墨迹暂时模糊了。先回到三处痕迹本身。）');
      } finally {
        this.uiCallback.setLoading(false);
      }
      return;
    }

    const currentRounds = (this.roundCount.get(gateId) || 0) + 1;
    this.roundCount.set(gateId, currentRounds);

    const analysis = analyzePlayerInputAccumulated(text, this.insightProgress.get(gateId));
    this.insightProgress.set(gateId, new Set(analysis.accumulatedConcepts));

    if (this._isSynthesisPassed(config, analysis.accumulatedConcepts, currentRounds)) {
      this.failedRoundCount.set(gateId, 0);
      this._handleSynthesisPass(gateId, config);
      return;
    }

    const failedRounds = (this.failedRoundCount.get(gateId) || 0) + 1;
    this.failedRoundCount.set(gateId, failedRounds);
    if (analysis.blockedByNegation || analysis.wrongDirection) {
      const wrongCount = (this.synthesisWrongDirectionCount.get(gateId) || 0) + 1;
      this.synthesisWrongDirectionCount.set(gateId, wrongCount);
    }

    if (this._shouldTriggerFinalFallback(gateId, config, failedRounds)) {
      this._handleSynthesisAssistedPass(gateId, config);
      return;
    }

    const guidedReply = this._getSynthesisGuidedReply(gateId, config, text, analysis);
    if (guidedReply) {
      this.dialogueHistory.get(gateId).push({ role: 'assistant', content: guidedReply });
      this.uiCallback.showNPCMessage(guidedReply);
      if (failedRounds >= 5 && config.fallbackQuickThoughts) {
        this.uiCallback.showQuickThoughts(config.fallbackQuickThoughts);
      }
      this._maybeShowSynthesisStageCue(gateId, config, failedRounds);
      return;
    }

    this.uiCallback.setLoading(true);
    try {
      if (this.engine.aiService && this.engine.aiService.isAvailable) {
        await this._handleSynthesisAI(gateId, config, text, analysis);
      } else {
        await this._handleSynthesisOffline(gateId, config, text, analysis);
      }
    } catch (err) {
      console.error('综合研讨处理错误:', err);
      const fallbackReply = this._getSynthesisGuidedReply(gateId, config, text, analysis, { force: true })
        || '（周老师批注）先回到三处证据：旧标签被裁，残字被压，细线没进正式记录。它们为什么会同时变得不容易看见？';
      this.dialogueHistory.get(gateId)?.push({ role: 'assistant', content: fallbackReply });
      this.uiCallback.showNPCMessage(fallbackReply);
    } finally {
      this.uiCallback.setLoading(false);
    }

    if (failedRounds >= 5 && config.fallbackQuickThoughts) {
      this.uiCallback.showQuickThoughts(config.fallbackQuickThoughts);
    }
    this._maybeShowSynthesisStageCue(gateId, config, failedRounds);
  }

  /**
   * 辅助讨论模式：AI自由回复，不设通过条件
   */
  async _handleDiscussionMode(gateId, config, text) {
    const response = await this.engine.aiService.discussWithZhou(
      gateId,
      text,
      this.dialogueHistory.get(gateId),
      '【系统提示：这是辅助讨论，不设通过条件。玩家已经发现了线索，现在是在自由交流。请简短回复，1-3句话，保持学者口吻。】'
    );

    this.dialogueHistory.get(gateId).push({ role: 'assistant', content: response });
    this.uiCallback.showNPCMessage(response);
  }

  /**
   * 离线辅助讨论模式
   */
  async _handleOfflineDiscussion(gateId, config) {
    // 模拟一点网络延迟
    await this._delay(400 + Math.random() * 200);

    // 随机选一条简短的引导回复
    const pool = config.affirmPool;
    const idx = this._getFallbackIndex(gateId, 'affirm', pool.length);
    const response = pool[idx];

    this.uiCallback.showNPCMessage(response);
  }

  async _handleSynthesisAI(gateId, config, text, analysis) {
    const concepts = this.insightProgress.get(gateId) || new Set();
    const systemHint = this._buildSynthesisHint(config, concepts, analysis);
    let response = await this.engine.aiService.discussWithZhou(
      gateId,
      text,
      this.dialogueHistory.get(gateId),
      systemHint
    );

    if (this.activeGate !== gateId || this.activeGateMode !== 'synthesis') return;
    if (this._isLowValueSynthesisReply(response)) {
      response = this._getSynthesisGuidedReply(gateId, config, text, analysis, { force: true }) || response;
    }
    this.dialogueHistory.get(gateId).push({ role: 'assistant', content: response });
    this.uiCallback.showNPCMessage(response);
  }

  async _handleSynthesisOffline(gateId, config, text, analysis) {
    await this._delay(400 + Math.random() * 200);

    const guidedReply = this._getSynthesisGuidedReply(gateId, config, text, analysis, { force: true });
    if (guidedReply) {
      if (this.activeGate !== gateId || this.activeGateMode !== 'synthesis') return;
      this.dialogueHistory.get(gateId)?.push({ role: 'assistant', content: guidedReply });
      this.uiCallback.showNPCMessage(guidedReply);
      return;
    }

    const concepts = this.insightProgress.get(gateId) || new Set();
    let pool = config.hintPool;

    if (analysis.blockedByNegation) {
      pool = config.correctionPool;
    } else if (analysis.matchedConcepts.length > 0 || concepts.size > 0) {
      pool = config.affirmPool;
    }

    const poolType = pool === config.correctionPool ? 'correction' : pool === config.affirmPool ? 'affirm' : 'hint';
    const idx = this._getFallbackIndex(gateId, poolType, pool.length);
    if (this.activeGate !== gateId || this.activeGateMode !== 'synthesis') return;
    this.uiCallback.showNPCMessage(pool[idx]);
  }

  _recordSynthesisInfoFromQuickThought(gateId, config, text) {
    const tags = config.quickThoughtInfoTags?.[text] || [];
    if (!this.synthesisInfoProgress.has(gateId)) {
      this.synthesisInfoProgress.set(gateId, new Set());
    }
    const progress = this.synthesisInfoProgress.get(gateId);
    tags.forEach((tag) => progress.add(tag));
    this.lastSynthesisQuickThought.set(gateId, text);
  }

  _recordSynthesisInfoTags(gateId, tags = []) {
    if (!tags.length) return;
    if (!this.synthesisInfoProgress.has(gateId)) {
      this.synthesisInfoProgress.set(gateId, new Set());
    }
    const progress = this.synthesisInfoProgress.get(gateId);
    tags.forEach((tag) => progress.add(tag));
  }

  _getSynthesisGuidedReply(gateId, config, text, analysis = {}, options = {}) {
    if (gateId !== 'gate_prologue_synthesis') return '';
    const replyConfig = config.synthesisGuidedReplies;
    if (!replyConfig) return '';

    const input = String(text || '').toLowerCase().trim();
    const progress = this.synthesisInfoProgress.get(gateId) || new Set();
    const wrongDirection = this._matchSynthesisReplyRule(input, replyConfig.wrongDirectionRules || []);
    if (wrongDirection) {
      this._recordSynthesisInfoTags(gateId, wrongDirection.tags);
      return wrongDirection.reply;
    }

    const matched = this._matchSynthesisReplyRule(input, replyConfig.rules || []);

    if (matched) {
      this._recordSynthesisInfoTags(gateId, matched.tags);
      return matched.reply;
    }

    const lastQuickThought = this.lastSynthesisQuickThought.get(gateId);
    const followUp = this._matchSynthesisReplyRule(input, replyConfig.followUps?.[lastQuickThought] || []);
    if (followUp) {
      this._recordSynthesisInfoTags(gateId, followUp.tags);
      return followUp.reply;
    }

    if (replyConfig.vaguePatterns?.some((pattern) => pattern.test(input))) {
      const next = this._getNextSynthesisInfoReply(replyConfig.nextByMissingTag || [], progress);
      if (next) {
        this._recordSynthesisInfoTags(gateId, next.tags);
        return next.reply;
      }
    }

    if (analysis.blockedByNegation || analysis.wrongDirection) {
      return replyConfig.correctionReply || '';
    }

    if (options.force) {
      const next = this._getNextSynthesisInfoReply(replyConfig.nextByMissingTag || [], progress);
      if (next) {
        this._recordSynthesisInfoTags(gateId, next.tags);
        return next.reply;
      }
      return replyConfig.defaultReply || '';
    }

    return '';
  }

  _matchSynthesisReplyRule(input, rules) {
    return rules.find((rule) => {
      const keywordMatched = rule.keywords?.some((keyword) => input.includes(keyword));
      const patternMatched = rule.patterns?.some((pattern) => pattern.test(input));
      return keywordMatched || patternMatched;
    });
  }

  _getNextSynthesisInfoReply(candidates, progress) {
    return candidates.find((candidate) =>
      candidate.tags?.some((tag) => !progress.has(tag))
    ) || candidates[candidates.length - 1] || null;
  }

  _isLowValueSynthesisReply(response) {
    const text = String(response || '').trim();
    if (!text) return true;
    return /暂时没有回应|稍后再试|没有形成清晰答复|没有找到相关记录|字迹暂时散开|墨迹暂时模糊/.test(text);
  }

  _handleSynthesisPass(gateId, config) {
    this._clearSynthesisTimer(gateId);
    this.activeGateMode = 'synthesis-passed';
    this.dialogueHistory.get(gateId)?.push({ role: 'assistant', content: config.passResponse });
    this.uiCallback.showNPCMessage(config.passResponse);
    this.uiCallback.hideConfirmButton?.();
    this.uiCallback.showConfirmButton(() => {
      this.uiCallback.showPassEffect?.(config.title);
      const callbacks = this.synthesisCallbacks;
      setTimeout(() => {
        this.markGateCompleted(gateId);
        callbacks?.onCompleted?.({ gateId });
      }, 650);
    });
  }

  _handleSynthesisAssistedPass(gateId, config) {
    if (this.synthesisAssistedPassTriggered.has(gateId)) return;
    if (this.activeGate !== gateId || this.activeGateMode !== 'synthesis') return;

    this.synthesisAssistedPassTriggered.add(gateId);
    const message = config.assistedFallback?.finalMessage;
    if (message) {
      this.dialogueHistory.get(gateId)?.push({ role: 'assistant', content: message });
      this.uiCallback.showNPCMessage(message);
    }
    this._handleSynthesisPass(gateId, config);
  }

  _buildSynthesisHint(config, concepts, analysis = {}) {
    const matchedConcepts = analysis.matchedConcepts || [];
    if (analysis.fromQuickThought) {
      return '玩家点击的是笔记本提供的快捷问题，不代表玩家已经自己得出结论。请只把它当成一个思考方向，用白话解释相关证据，并提醒需要玩家自己写下判断；不要总结为已经通过。';
    }

    const hasHumanObscure = concepts.has('human_obscure');
    const hasSourceExplanation = concepts.has('source_explanation');
    const hasSharedPattern = concepts.has('shared_pattern');
    const hasNotPaintLoss = concepts.has('not_paint_loss');

    if (hasHumanObscure) {
      return '玩家已经接近"后来处理造成遮蔽"这一方向。请回到旧题签、残字、底层细线三处证据做确认；白话优先，不要说出人物、地点、低位视角或完整结论。';
    }
    if (hasSourceExplanation) {
      return '玩家已经注意到这些痕迹像是在说明这页画的来历。请引导其判断这些痕迹是自然坏掉，还是被后续装裱压住；不要直接给出完整结论。';
    }
    if (hasSharedPattern || hasNotPaintLoss) {
      return '玩家已经注意到三处痕迹的共同点，或已经排除画本身丢失。请继续引导其观察旧题签、残字、细线为什么都在画面边缘、装裱层或下方；不要替玩家下结论。';
    }
    if (matchedConcepts.length > 0) {
      return '玩家方向部分正确。请简短肯定，并用问题引导其把三处痕迹综合起来。不要直接给出最终结论。';
    }
    return '玩家尚未抓住核心。请把注意力拉回旧题签、残字、底层细线的位置共同点：它们都不在画面主体里。不要直接断言这是后来处理造成的，只能用问题引导。';
  }

  _maybeShowSynthesisStageCue(gateId, config, failedRounds) {
    const fallback = config.assistedFallback;
    if (!fallback) return;

    const shown = this.synthesisPromptStages.get(gateId) || new Set();
    let stageId = null;
    let message = '';

    if (failedRounds >= 5 && fallback.round5Message) {
      stageId = 'round5';
      message = fallback.round5Message;
    } else if (failedRounds >= 3 && fallback.round3Message) {
      stageId = 'round3';
      message = fallback.round3Message;
    }

    if (!stageId || shown.has(stageId) || !message) return;
    shown.add(stageId);
    this.synthesisPromptStages.set(gateId, shown);
    this.dialogueHistory.get(gateId)?.push({ role: 'assistant', content: message });
    this.uiCallback.showNPCMessage(message);
  }

  _shouldTriggerFinalFallback(gateId, config, failedRounds) {
    const fallback = config.assistedFallback;
    if (!fallback) return false;

    if (failedRounds >= (fallback.finalAfterFailedRounds || Infinity)) {
      return true;
    }

    const wrongCount = this.synthesisWrongDirectionCount.get(gateId) || 0;
    const wrongConfig = fallback.finalAfterWrongDirection || {};
    return failedRounds >= (wrongConfig.failedRounds || Infinity)
      && wrongCount >= (wrongConfig.count || Infinity);
  }

  _startSynthesisTimer(gateId, config) {
    this._clearSynthesisTimer(gateId);
    const timeoutMs = config.assistedFallback?.timeoutMs;
    if (!timeoutMs || typeof window === 'undefined') return;

    const timerId = window.setTimeout(() => {
      if (this.activeGate !== gateId || this.activeGateMode !== 'synthesis') return;
      const latestConfig = getGateConfig(gateId);
      if (!latestConfig) return;
      this._handleSynthesisAssistedPass(gateId, latestConfig);
    }, timeoutMs);

    this.synthesisTimerIds.set(gateId, timerId);
  }

  _clearSynthesisTimer(gateId) {
    const timerId = this.synthesisTimerIds.get(gateId);
    if (timerId && typeof window !== 'undefined') {
      window.clearTimeout(timerId);
    }
    this.synthesisTimerIds.delete(gateId);
  }

  _isSynthesisPassed(config, concepts, rounds) {
    if (rounds < config.minRounds) return false;
    const conceptSet = new Set(concepts);
    return config.requiredConcepts.anyOfGroups.every((group) =>
      group.some((id) => conceptSet.has(id))
    );
  }

  /**
   * 辅助讨论完成后自动关闭（由外部在切换场景时调用）
   */
  closeDiscussion(gateId) {
    if (this.activeGate === gateId) {
      this.markGateCompleted(gateId);
    }
  }

  /**
   * 离线模式：获取下一个回复的索引（轮询）
   */
  _getFallbackIndex(gateId, poolType, poolLength) {
    if (!this.fallbackState[gateId]) {
      this.fallbackState[gateId] = {};
    }
    if (!this.fallbackState[gateId][poolType]) {
      this.fallbackState[gateId][poolType] = 0;
    }
    const idx = this.fallbackState[gateId][poolType] % poolLength;
    this.fallbackState[gateId][poolType]++;
    return idx;
  }

  /**
   * 快捷想法按钮被点击
   * @param {string} text 快捷按钮文本
   */
  async handleQuickThought(text) {
    if (this.activeGateMode === 'synthesis-passed') return;
    if (this.activeGateMode === 'synthesis') {
      await this.handleSynthesisInput(text, { source: 'quick-thought' });
    } else {
      await this.handlePlayerInput(text);
    }
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
