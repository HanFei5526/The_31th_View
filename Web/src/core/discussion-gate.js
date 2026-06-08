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
    await this.handlePlayerInput(text);
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
