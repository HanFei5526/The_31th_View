/**
 * 《卅一景》研讨门槛管理器
 *
 * 核心改造：从"选对答案"改为"表达理解"
 * - 玩家自由输入，不做选择题
 * - 系统通过关键词匹配判定推理合理性
 * - AI / 离线预写回复只负责自然对话引导，不做通过判定
 */

import { getGateConfig, analyzePlayerInput, analyzePlayerInputAccumulated } from './gate-config.js';

// 简单否定词检测——用于识别玩家说反了的情况
const NEGATION_PATTERNS = ['没有', '不是', '不对', '不', '没', '无', '并非', '决不', '绝不'];

function _hasNegation(input) {
  const lower = input.toLowerCase();
  return NEGATION_PATTERNS.some((p) => lower.includes(p));
}

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
  }

  isGateCompleted(gateId) {
    return this.gatesCompleted.has(gateId);
  }

  markGateCompleted(gateId) {
    this.gatesCompleted.add(gateId);
    const completedId = this.activeGate;
    this.activeGate = null;
    this.activeGateMode = null;
    this.uiCallback = null;
    this.synthesisCallbacks = null;

    // 清理状态
    this.dialogueHistory.delete(gateId);
    this.insightProgress.delete(gateId);
    this.roundCount.delete(gateId);
    this.failedRoundCount.delete(gateId);

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
   * @param {Object} container NotebookFloating / GatePanel 或同等 UI 回调接口
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
   */
  async handleSynthesisInput(text) {
    if (!this.activeGate || this.activeGateMode !== 'synthesis' || !text.trim()) return;

    const gateId = this.activeGate;
    const config = getGateConfig(gateId);
    if (!config) return;

    if (!this.dialogueHistory.has(gateId)) {
      this.dialogueHistory.set(gateId, []);
    }
    if (!this.insightProgress.has(gateId)) {
      this.insightProgress.set(gateId, new Set());
    }

    this.dialogueHistory.get(gateId).push({ role: 'user', content: text });

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

    this.uiCallback.setLoading(true);
    try {
      if (this.engine.aiService && this.engine.aiService.isAvailable) {
        await this._handleSynthesisAI(gateId, config, text, analysis);
      } else {
        await this._handleSynthesisOffline(gateId, config, text, analysis);
      }
    } catch (err) {
      console.error('综合研讨处理错误:', err);
      this.uiCallback.showNPCMessage('（网络似乎有些不稳定。先回到证据：三处痕迹都和来源说明有关。）');
    } finally {
      this.uiCallback.setLoading(false);
    }

    if (failedRounds >= 5 && config.fallbackQuickThoughts) {
      this.uiCallback.showQuickThoughts(config.fallbackQuickThoughts);
    }
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
    const systemHint = this._buildSynthesisHint(config, concepts, analysis.matchedConcepts);
    const response = await this.engine.aiService.discussWithZhou(
      gateId,
      text,
      this.dialogueHistory.get(gateId),
      systemHint
    );

    this.dialogueHistory.get(gateId).push({ role: 'assistant', content: response });
    this.uiCallback.showNPCMessage(response);
  }

  async _handleSynthesisOffline(gateId, config, text, analysis) {
    await this._delay(400 + Math.random() * 200);

    const concepts = this.insightProgress.get(gateId) || new Set();
    let pool = config.hintPool;

    if (_hasNegation(text)) {
      pool = config.correctionPool;
    } else if (analysis.matchedConcepts.length > 0 || concepts.size > 0) {
      pool = config.affirmPool;
    }

    const poolType = pool === config.correctionPool ? 'correction' : pool === config.affirmPool ? 'affirm' : 'hint';
    const idx = this._getFallbackIndex(gateId, poolType, pool.length);
    this.uiCallback.showNPCMessage(pool[idx]);
  }

  _handleSynthesisPass(gateId, config) {
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

  _buildSynthesisHint(config, concepts, matchedConcepts) {
    const hasActorOrSystem = concepts.has('systematic') || concepts.has('intentional_act');
    const hasOriginOrEvidence = concepts.has('conceal_origin') || concepts.has('erase_evidence');

    if (hasActorOrSystem && !hasOriginOrEvidence) {
      return '玩家已经意识到不是偶然或有人为处理。请继续引导其说出：被处理的是来源信息、出处记录或证据痕迹。不要直接给出最终结论。';
    }
    if (!hasActorOrSystem && hasOriginOrEvidence) {
      return '玩家已经提到来源信息或证据痕迹。请继续引导其判断这不是自然磨损，而是有人系统性或刻意处理。不要直接给出最终结论。';
    }
    if (matchedConcepts.length > 0) {
      return '玩家方向部分正确。请简短肯定，并用问题引导其把三处痕迹综合起来。不要直接给出最终结论。';
    }
    return '玩家尚未抓住核心。请把注意力拉回旧题签、残字、辅助线三者都和来源说明有关。不要直接给出最终结论。';
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
    if (this.activeGateMode === 'synthesis') {
      await this.handleSynthesisInput(text);
    } else {
      await this.handlePlayerInput(text);
    }
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
