/**
 * 离线降级引导回复数据（序章）
 *
 * 注意：此文件保留用于向后兼容，但所有门槛数据已迁移到 gate-config.js。
 * 离线模式的回复内容现在从 gate-config.js 的 hintPool / affirmPool / correctionPool 获取。
 *
 * 如需为离线模式添加新的门槛回复，请在 gate-config.js 中配置对应字段。
 */

/**
 * 导出一个空对象，保持 import 兼容性。
 * 实际使用请从 gate-config.js 导入 getGateConfig。
 */
export const FALLBACK_DIALOGUES = {};
