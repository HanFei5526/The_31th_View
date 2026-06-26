import { KNOWLEDGE_SNIPPETS } from '../data/knowledge-snippets.js';

function normalizeProgress(gameProgress = {}) {
  const progress = gameProgress.progress || gameProgress;
  const cluesFound = new Set(progress.cluesFound || []);

  return {
    chapter: gameProgress.chapter ?? progress.chapter ?? 0,
    progress,
    cluesFound,
  };
}

/**
 * 根据当前进度返回已解锁知识片段。
 * @param {Object} gameProgress GameEngine 进度或 AI 上下文
 * @returns {Array<{id: string, chapter: number, content: string}>}
 */
export function getAvailableKnowledge(gameProgress = {}) {
  const state = normalizeProgress(gameProgress);

  return KNOWLEDGE_SNIPPETS.filter((snippet) => {
    if (snippet.chapter > state.chapter) return false;
    return snippet.unlockCondition(state);
  });
}

/**
 * 将知识片段格式化为 prompt 文本。
 * @param {Object} gameProgress GameEngine 进度或 AI 上下文
 * @returns {string}
 */
export function formatAvailableKnowledge(gameProgress = {}) {
  const snippets = getAvailableKnowledge(gameProgress);

  if (snippets.length === 0) {
    return '（暂无已解锁资料）';
  }

  return snippets
    .map((snippet, index) => `# 已解锁资料 ${index + 1}\n${snippet.content}`)
    .join('\n\n---\n\n');
}
