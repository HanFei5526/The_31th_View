/**
 * 《卅一景》研讨门槛管理器
 *
 * 核心改造：从"选对答案"改为"表达理解"
 * - 玩家自由输入，不做选择题
 * - 系统通过关键词匹配判定推理合理性
 * - AI / 离线预写回复只负责自然对话引导，不做通过判定
 */

import { getGateConfig, analyzePlayerInput } from './gate-config.js';

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
    this.uiCallback = null;
    this.fallbackState = {}; // 离线模式状态
    this.dialogueHistory = new Map(); // gateId -> [{role, content}]
    this.insightProgress = new Map(); // gateId -> Set(conceptIds)
    this.roundCount = new Map(); // gateId -> number
  }

  isGateCompleted(gateId) {
    return this.gatesCompleted.has(gateId);
  }

  markGateCompleted(gateId) {
    this.gatesCompleted.add(gateId);
    const completedId = this.activeGate;
    this.activeGate = null;
    this.uiCallback = null;

    // 清理状态
    this.dialogueHistory.delete(gateId);
    this.insightProgress.delete(gateId);
    this.roundCount.delete(gateId);

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
   * 处理玩家输入（统一入口）
   * @param {string} text 玩家输入的文本
   */
  async handlePlayerInput(text) {
    if (!this.activeGate || !text.trim()) return;

    const gateId = this.activeGate;
    const config = getGateConfig(gateId);
    if (!config) return;

    // 记录玩家消息到UI
    this.uiCallback.showPlayerMessage(text);

    // 增加轮数（玩家发消息算一轮）
    const currentRounds = (this.roundCount.get(gateId) || 0) + 1;
    this.roundCount.set(gateId, currentRounds);

    // 记录对话历史
    if (!this.dialogueHistory.has(gateId)) {
      this.dialogueHistory.set(gateId, []);
    }
    this.dialogueHistory.get(gateId).push({ role: 'user', content: text });

    // ===== 核心：关键词判定 =====
    const analysis = analyzePlayerInput(gateId, text);
    const understoodConcepts = this.insightProgress.get(gateId);

    // 记录新理解的概念
    let newConcepts = [];
    for (const conceptId of analysis.matchedConcepts) {
      if (!understoodConcepts.has(conceptId)) {
        understoodConcepts.add(conceptId);
        newConcepts.push(conceptId);
      }
    }

    // 检查是否达到通过条件
    let shouldShowConfirm = false;

    if (analysis.matched) {
      // 概念命中了，检查轮数
      if (currentRounds >= config.minRounds) {
        shouldShowConfirm = true;
      }
    }

    // 检查是否说反了（包含关键词但加了否定）
    const saidOpposite = analysis.matchedConcepts.length > 0 && _hasNegation(text);

    // ===== 根据模式生成NPC回复 =====
    this.uiCallback.setLoading(true);

    try {
      if (this.engine.aiService && this.engine.aiService.isAvailable) {
        // ==== 在线 AI 模式 ====
        await this._handleOnlineMode(gateId, config, text, analysis, newConcepts, shouldShowConfirm, saidOpposite);
      } else {
        // ==== 离线降级模式 ====
        await this._handleOfflineMode(gateId, config, analysis, newConcepts, shouldShowConfirm, saidOpposite);
      }
    } catch (err) {
      console.error('研讨处理错误:', err);
      this.uiCallback.showNPCMessage('（网络似乎有些不稳定，换个角度再想想？）');
    } finally {
      this.uiCallback.setLoading(false);
    }
  }

  /**
   * 在线AI模式处理
   */
  async _handleOnlineMode(gateId, config, text, analysis, newConcepts, shouldShowConfirm, saidOpposite) {
    // 如果应该通过了，先给AI一个系统提示让它给出确认式回复
    let systemHint = '';
    if (shouldShowConfirm) {
      systemHint = '【系统提示：玩家的推理已经到位，请给出肯定+总结的回复，并询问玩家是否确认这个推断。】';
    } else if (saidOpposite) {
      systemHint = '【系统提示：玩家说到了相关概念但方向反了（加了否定），请温和地纠正，不要直接说"你错了"。】';
    } else if (newConcepts.length > 0) {
      systemHint = '【系统提示：玩家的方向是对的，请给予简短肯定，然后继续追问引导到更深的理解。】';
    } else {
      systemHint = '【系统提示：玩家还没说到核心概念，请继续引导思考。】';
    }

    const response = await this.engine.aiService.discussWithZhou(
      gateId,
      text,
      this.dialogueHistory.get(gateId),
      systemHint
    );

    this.dialogueHistory.get(gateId).push({ role: 'assistant', content: response });
    this.uiCallback.showNPCMessage(response);

    if (shouldShowConfirm) {
      this.uiCallback.showConfirmButton(() => {
        this._onPlayerConfirmed(gateId);
      });
    }
  }

  /**
   * 离线降级模式处理
   */
  async _handleOfflineMode(gateId, config, analysis, newConcepts, shouldShowConfirm, saidOpposite) {
    // 模拟一点网络延迟，让体验更自然
    await this._delay(600 + Math.random() * 400);

    let response = '';

    if (shouldShowConfirm) {
      // 理解度达标 → 确认式回复
      response = config.passResponse;
      this.uiCallback.showNPCMessage(response);
      this.uiCallback.showConfirmButton(() => {
        this._onPlayerConfirmed(gateId);
      });
      return;
    }

    if (saidOpposite) {
      // 说反了 → 纠正回复
      const pool = config.correctionPool;
      const idx = this._getFallbackIndex(gateId, 'correction', pool.length);
      response = pool[idx];
    } else if (newConcepts.length > 0) {
      // 方向对但没达标 → 肯定+继续引导
      const affirmPool = config.affirmPool;
      const hintPool = config.hintPool;
      const affirmIdx = this._getFallbackIndex(gateId, 'affirm', affirmPool.length);
      const hintIdx = this._getFallbackIndex(gateId, 'hint', hintPool.length);
      response = affirmPool[affirmIdx] + '\n\n' + hintPool[hintIdx];
    } else {
      // 完全没命中 → 引导回复
      const pool = config.hintPool;
      const idx = this._getFallbackIndex(gateId, 'hint', pool.length);
      response = pool[idx];
    }

    this.uiCallback.showNPCMessage(response);
  }

  /**
   * 玩家点击"确认推断"按钮
   */
  _onPlayerConfirmed(gateId) {
    const config = getGateConfig(gateId);
    this.uiCallback.hideConfirmButton();

    // 展示通过动效
    this.uiCallback.showPassEffect(config.title);

    setTimeout(() => {
      this.markGateCompleted(gateId);
    }, 2500);
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
    await this.handlePlayerInput(text);
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
