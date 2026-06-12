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

  // 门槛 3：底层细线
  gate_prologue_line: {
    title: '底层细线',
    speaker: '周鹤年',
    world: 'real',
    concepts: [
      {
        id: 'underlayer_trace',
        keywords: ['底层', '下面', '压住', '覆盖', '装裱层', '藏着', '被盖住'],
        description: '细线位于画面或装裱层下方',
      },
      {
        id: 'regular_line',
        keywords: ['线', '细线', '规整', '横贯', '很直', '不是裂纹', '不像裂纹', '墨线'],
        description: '细线不同于自然裂纹',
      },
      {
        id: 'unusual',
        keywords: ['不寻常', '不正常', '奇怪', '少见', '不对', '不同', '异常', '特殊'],
        description: '这处痕迹不寻常',
      },
    ],
    // 需要 underlayer_trace + (regular_line 或 unusual)
    requiredConcepts: ['underlayer_trace'],
    requireAny: false,
    alsoRequires: ['regular_line', 'unusual'],
    minRounds: 2,
    opening: '周鹤年：「先别急着判断它是什么。它比裂纹规整，又不像装裱时留下的折痕。先把它当作一处底层痕迹记录下来。」',
    passResponse: '周鹤年：「对。现在只能确认它不是普通破损，更像被正式记录忽略掉的底层痕迹。它的用途，要等更多证据来说明。」',
    hintPool: [
      '周鹤年：「先看它和裂纹、折痕有什么不同。」',
      '周鹤年：「如果它不是画面内容，为什么会被留在画面下方？」',
      '周鹤年：「它暂时不是答案，但它能证明这里有一层正式记录没有解释的东西。」',
    ],
    affirmPool: [
      '周鹤年：「嗯。」',
      '周鹤年：「你注意到它不像普通损伤。」',
      '周鹤年：「继续。」',
    ],
    correctionPool: [
      '周鹤年：「现在不要直接把它解释成某个结论。先记录它和其他痕迹之间的关系。」',
      '周鹤年：「重点不是它好不好看，而是它为什么没有出现在正式记录里。」',
      '周鹤年：「如果一处细线也被忽略，可能说明被忽略的不只是文字。」',
    ],
    quickThoughts: [
      '这条线不像裂纹',
      '它可能是被压住的底层痕迹',
      '先把它和题签、残字放在一起看',
    ],
  },

  // 综合门槛：三处痕迹之间的关系
  gate_prologue_synthesis: {
    title: '三处痕迹的联系',
    speaker: '周鹤年',
    world: 'real',
    concepts: [
      {
        id: 'systematic',
        keywords: ['系统', '有组织', '有计划', '统一', '一起', '全部', '所有', '连在一起', '共同', '整体', '都是', '三处', '三个', '一套', '配合', '协调', '不是偶然'],
        description: '三处痕迹呈现系统性关联',
      },
      {
        id: 'conceal_origin',
        keywords: ['遮蔽来源', '隐藏出处', '掩盖来源', '来源', '出处', '来历', '身份', '谁画', '作者', '归属', '从哪来', '来路', '出自', '信息', '记录'],
        description: '被遮蔽的是来源信息',
      },
      {
        id: 'intentional_act',
        keywords: ['有人', '刻意', '故意', '蓄意', '不是巧合', '人为', '计划', '目的', '想要', '不想让', '不让'],
        description: '这是有人刻意为之',
      },
      {
        id: 'erase_evidence',
        keywords: ['抹去', '消除', '销毁', '清除', '擦掉', '去掉', '不让人看', '不让人知道', '遮蔽', '隐藏', '掩盖', '毁掉', '删掉', '证据', '痕迹'],
        description: '证据或痕迹被抹除',
      },
    ],
    requiredConcepts: {
      anyOfGroups: [
        ['systematic', 'intentional_act'],
        ['conceal_origin', 'erase_evidence'],
      ],
    },
    minRounds: 2,
    opening: '三处痕迹你都看到了。装裱接缝的旧题签、被压住的"所见"残字、画面下方的底层细线。它们之间有什么联系？',
    passResponse: '对。不是时间磨损，不是偶然遗漏。是有人系统性地抹去了这幅画的来源信息。',
    hintPool: [
      '周鹤年：「先别把三处痕迹分开看。旧题签、残字、底层细线，都指向同一个问题：有人不想让后来者知道什么？」',
      '周鹤年：「如果只是保存不善，痕迹会散乱；但这三处都和说明来源有关。你再把它们连起来。」',
      '周鹤年：「题签、边注和底层细线都不是画面装饰。它们原本都可能在说明这幅画的来源。」',
    ],
    affirmPool: [
      '周鹤年：「方向对。继续把‘谁不想让人看见’和‘不想让人看见什么’说清楚。」',
      '周鹤年：「嗯，你已经把它们连起来了，再往来源信息上想一步。」',
      '周鹤年：「对，不像自然损坏。还要说明它被处理掉的对象是什么。」',
    ],
    correctionPool: [
      '周鹤年：「不是画心失踪，也不是新画替换。画还在，消失的是解释这幅画来源的东西。」',
      '周鹤年：「不要急着找一个具体姓名。现在证据只能说明：有人处理过来源痕迹。」',
      '周鹤年：「如果三处痕迹都被动过，问题就不只是单个破损，而是一组被整理过的证据。」',
    ],
    quickThoughts: [
      '这些痕迹是被故意去除的吗？',
      '有人在系统性地隐藏什么',
      '来源信息被刻意遮蔽了',
    ],
    fallbackQuickThoughts: [
      '有人故意把这幅画的来源信息遮蔽了',
      '三处痕迹不是偶然，是系统性处理',
      '旧题签、残字和底层细线都在指向被抹去的来源证据',
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
 * 分析综合门槛输入，支持跨多轮累积概念命中
 * @param {string} playerInput - 玩家原始输入
 * @param {Iterable<string>} accumulated - 已命中的概念集合
 * @returns {Object} { matchedConcepts: string[], accumulatedConcepts: string[] }
 */
export function analyzePlayerInputAccumulated(playerInput, accumulated = []) {
  const config = GATE_CONFIG.gate_prologue_synthesis;
  const input = playerInput.toLowerCase().trim();
  const accumulatedSet = new Set(accumulated);
  const matchedConcepts = [];

  for (const concept of config.concepts) {
    if (_matchConcept(input, concept)) {
      matchedConcepts.push(concept.id);
      accumulatedSet.add(concept.id);
    }
  }

  return {
    matchedConcepts,
    accumulatedConcepts: Array.from(accumulatedSet),
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
