/**
 * 《卅一景》研讨门槛配置
 *
 * 每个门槛定义：
 *   - 关键概念（concepts）：玩家需要理解的核心概念，含同义词关键词
 *   - 通过条件：命中几个概念 + 最少对话轮数
 *   - NPC 开场白、确认回复、引导回复池
 *   - 快捷想法按钮文本
 */

export const GATE_CONFIG = {
  /* ========== 序章 · 残页 ========== */

  // 门槛 1：装裱接缝残角
  gate_prologue_margin: {
    title: '装裱接缝残角',
    speaker: '周鹤年',
    world: 'real', // 现实世界
    // 关键概念：玩家需要表达出的理解
    concepts: [
      {
        id: 'conceal',
        keywords: ['遮盖', '隐藏', '遮住', '盖住', '掩盖', '遮蔽', '被挡', '被遮', '压住', '压住了', '遮掉', '遮了', '遮起来'],
        description: '边缘被刻意遮盖',
      },
      {
        id: 'rebind',
        keywords: ['重装', '二次', '揭裱', '重新装裱', '换过', '改装', '后来装', '裱过', '再装', '重新裱'],
        description: '被二次处理过',
      },
      {
        id: 'intentional',
        keywords: ['刻意', '故意', '有意', '人为', '不是意外', '不是自然', '有人做', '人做的', '不是老化'],
        description: '是刻意的而非自然老化',
      },
    ],
    // 通过条件：命中 conceal 或 rebind 任意一个概念，且对话 ≥ 2 轮（开场白不算）
    requiredConcepts: ['conceal', 'rebind'],
    requireAny: true, // 命中任意一个即可
    minRounds: 2,
    // NPC 开场白
    opening: '周鹤年：「你发现了装裱接缝。正常的装裱修复不会在边缘留下这种压痕。」',
    // 理解度达标后的确认式回复
    passResponse: '周鹤年点了点头：「你抓住了关键——这不是自然老化，是有人刻意处理过边缘。接缝痕迹说明这一页被二次揭裱过，边缘的某些内容被人为遮盖了。你确认这是你的推断吗？」',
    // 离线模式引导回复池（玩家没说到点子上时轮询）
    hintPool: [
      '周鹤年：「如果画心没问题，为什么要动装裱？除非……装裱下面藏着什么。」',
      '周鹤年：「后人在重装时，往往为了统一全册体例，而裁切或遮盖边缘不规整的部分。」',
      `周鹤年：「关键不是'有没有处理过'，而是'为什么处理'。被遮盖的是无用残损，还是有人不想让人看到的痕迹？」`,
    ],
    // 离线模式肯定回复池（玩家说对方向但没达标时）
    affirmPool: [
      '周鹤年：「对，继续。」',
      '周鹤年点了点头：「嗯。」',
      '周鹤年：「你这个方向是对的。」',
    ],
    // 离线模式纠正回复池（玩家说反了或偏离时）
    correctionPool: [
      '周鹤年摇了摇头：「画心本身没有问题。问题在边缘的处理方式上。」',
      '周鹤年：「你再想想。正常的老化不会留下这种规则的压痕。这不是时间问题，是人的问题。」',
      '周鹤年：「不要急着下结论。先看证据：接缝、压痕、遮盖——这三件事连在一起，说明什么？」',
    ],
    // 快捷想法按钮（降低输入门槛）
    quickThoughts: [
      '边缘好像被什么东西遮住了',
      '这页被重新装裱过',
      '有人刻意处理过边缘',
    ],
  },

  // 门槛 2："……所见"残字
  gate_prologue_text: {
    title: '"……所见"残字',
    speaker: '周鹤年',
    world: 'real',
    concepts: [
      {
        id: 'inscription',
        keywords: ['题记', '题跋', '边注', '说明', '记录', '文字', '写了字', '题字', '题写', '写的字', '写的'],
        description: '是一段文字记录',
      },
      {
        id: 'truncated',
        keywords: ['裁掉', '切掉', '截掉', '剩下一半', '不完整', '残片', '只剩', '漏出', '裁去', '裁切', '裁过', '被裁'],
        description: '被裁切后剩下的残片',
      },
      {
        id: 'viewpoint',
        keywords: ['所见', '看到', '视角', '看', '观看', '视点', '视线', '看到的', '望着'],
        description: '与"观看"有关',
      },
    ],
    // 需要 inscription + (truncated 或 viewpoint)
    requiredConcepts: ['inscription'],
    requireAny: false, // 需要 inscription，再加上后面任意一个
    alsoRequires: ['truncated', 'viewpoint'],
    minRounds: 2,
    opening: '周鹤年：「你发现了残字"……所见"。这个字在边注区域，不是画心的一部分。」',
    passResponse: `周鹤年：「嗯。边注区域的'所见'二字，说明原本有一段完整的题记，记录了某种观看位置。但在重装时被裁掉了大部分，只漏出了边缘的残字。你确认这个判断吗？」`,
    hintPool: [
      '周鹤年：「古画的边注通常记录创作信息——谁画的、画的是什么、从哪里看的。」',
      '周鹤年：「如果是正式题跋，不会藏在这种位置。这更像是某种标注——后人觉得不需要保留的标注。」',
      `周鹤年：「'所见'——谁所见？看见什么？这两个字本身就在问问题。」`,
    ],
    affirmPool: [
      '周鹤年：「对。」',
      '周鹤年：「嗯，继续。」',
      '周鹤年：「你这个思路可以。」',
    ],
    correctionPool: [
      '周鹤年：「文徵明的署名不会这么不规整，也不会藏在这里。」',
      '周鹤年：「后人如果修补，只会遮盖，不会写半句没头没尾的话。」',
      `周鹤年：「再想想'所见'两个字——这是关于'看'的记录。」`,
    ],
    quickThoughts: [
      '这是一段被裁掉的题记残片',
      '"所见"说明和观看视角有关',
      '边注区域原本有完整的说明文字',
    ],
  },

  // 门槛 3：低位构图辅助线
  gate_prologue_line: {
    title: '低位构图辅助线',
    speaker: '周鹤年',
    world: 'real',
    concepts: [
      {
        id: 'low_viewpoint',
        keywords: ['低', '蹲下', '坐下', '蹲着', '趴着', '矮', '不高', '视线低', '位置低', '很低', '趴', '跪着', '蹲'],
        description: '观看位置很低',
      },
      {
        id: 'draft_line',
        keywords: ['辅助线', '起稿线', '草稿线', '构图线', '定位线', '铅笔线', '墨线', '打稿', '起稿'],
        description: '是画家起稿时画的',
      },
      {
        id: 'unusual',
        keywords: ['不寻常', '不正常', '奇怪', '少见', '不对', '不同', '异常', '少见', '特殊'],
        description: '这个视角不寻常',
      },
    ],
    // 需要 low_viewpoint + (draft_line 或 unusual)
    requiredConcepts: ['low_viewpoint'],
    requireAny: false,
    alsoRequires: ['draft_line', 'unusual'],
    minRounds: 2,
    opening: '周鹤年：「这是一条极淡的构图辅助线。辅助线是打草稿时用来定位的。」',
    passResponse: '周鹤年：「对。辅助线意味着画家的观看位置。这条线画得很低——留下这根线的人，当时是蹲下、或者坐在很低的地方看园子的。这不是正常的游观视点。你确认这个推断吗？」',
    hintPool: [
      '周鹤年：「关键在于它的位置。这条线的位置非常低。」',
      '周鹤年：「按照中国画正常的游观视点，几乎不会取这么低的角度。」',
      '周鹤年：「任何辅助线都代表着观看者的位置。你站得高，线就高；你蹲得低，线就低。」',
    ],
    affirmPool: [
      '周鹤年：「嗯。」',
      '周鹤年：「你注意到了位置。」',
      '周鹤年：「继续。」',
    ],
    correctionPool: [
      '周鹤年：「裁切线一般在最外边缘，不会穿插在构图附近。」',
      '周鹤年：「这是用很淡的墨画的起稿线，不是装裱的折痕。」',
      '周鹤年：「不是画错。是画家故意留下的定位标记——标记他自己的观看位置。」',
    ],
    quickThoughts: [
      '这条线位置很低，作画的人视角很低',
      '这不是正常的站立视角',
      '辅助线意味着画家是蹲着或坐着画的',
    ],
  },
};

/**
 * 检查玩家输入是否命中了某个概念的关键词
 * @param {string} input - 玩家输入（已转小写）
 * @param {Object} concept - 概念配置
 * @returns {boolean}
 */
function _matchConcept(input, concept) {
  for (const keyword of concept.keywords) {
    if (input.includes(keyword)) {
      return true;
    }
  }
  return false;
}

/**
 * 分析玩家输入，返回匹配到的概念和判定结果
 * @param {string} gateId - 门槛ID
 * @param {string} playerInput - 玩家原始输入
 * @returns {Object} { matched: boolean, matchedConcepts: string[], allConcepts: string[] }
 */
export function analyzePlayerInput(gateId, playerInput) {
  const config = GATE_CONFIG[gateId];
  if (!config) {
    console.error(`未找到门槛 ${gateId} 的配置`);
    return { matched: false, matchedConcepts: [], allConcepts: [] };
  }

  const input = playerInput.toLowerCase().trim();
  const matchedConcepts = [];
  const allConceptIds = config.concepts.map((c) => c.id);

  for (const concept of config.concepts) {
    if (_matchConcept(input, concept)) {
      matchedConcepts.push(concept.id);
    }
  }

  // 判定是否通过
  let matched = false;

  if (config.requireAny) {
    // 命中 requiredConcepts 中任意一个即可
    matched = matchedConcepts.some((id) => config.requiredConcepts.includes(id));
  } else {
    // 需要命中所有 requiredConcepts
    const hasRequired = config.requiredConcepts.every((id) => matchedConcepts.includes(id));
    // 并且命中 alsoRequires 中任意一个（如果有的话）
    const hasAlso = config.alsoRequires
      ? config.alsoRequires.some((id) => matchedConcepts.includes(id))
      : true;
    matched = hasRequired && hasAlso;
  }

  return {
    matched,
    matchedConcepts,
    allConcepts: allConceptIds,
  };
}

/**
 * 获取门槛配置
 * @param {string} gateId
 * @returns {Object|null}
 */
export function getGateConfig(gateId) {
  return GATE_CONFIG[gateId] || null;
}

/**
 * 获取所有已定义的门槛ID
 * @returns {string[]}
 */
export function getAllGateIds() {
  return Object.keys(GATE_CONFIG);
}
