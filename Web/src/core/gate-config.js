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
    opening: '你发现了装裱接缝。正常的装裱修复不会在边缘留下这种压痕。',
    // 理解度达标后的确认式回复
    passResponse: '你抓住了关键——这不是自然老化，是有人刻意处理过边缘。接缝痕迹说明这一页被二次揭裱过，边缘的某些内容被人为遮盖了。你确认这是你的推断吗？',
    // 离线模式引导回复池（玩家没说到点子上时轮询）
    hintPool: [
      '（翻到一页批注）画心无损时仍动装裱，通常意味着装裱层下有需要遮盖的内容。',
      '（此处有一段红笔批注）重装时为统一全册体例，裁切或遮盖边缘不规整部分是常见做法。',
      '（夹着一张便签）核心问题不在于"有没有处理过"，而在于"为什么处理"——被遮盖的是残损，还是不想被看到的痕迹？',
    ],
    affirmPool: [
      '（页边有一行小字）这个方向是对的。继续往下想。',
      '（页边标注）观察正确。',
      '（页边有一行小字）边缘处理方式值得深究。',
    ],
    correctionPool: [
      '（翻到另一页批注）画心本身没有问题。需要关注的是边缘的处理方式。',
      '（此处有一段红笔批注）规则的压痕不同于自然老化——这不是时间造成的，是人为处理。',
      '（页角折过，翻开看）接缝、压痕、遮盖——三件事连在一起，指向同一个判断。',
    ],
    // 快捷想法按钮（降低输入门槛）
    quickThoughts: [
      '边缘是不是被什么东西遮住了？',
      '这页是不是被重新装裱过？',
      '有人刻意处理过边缘吗？',
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
    opening: '你发现了残字"……所见"。这个字在边注区域，不是画心的一部分。',
    passResponse: `嗯。边注区域的'所见'二字，说明原本有一段完整的题记，记录了某种观看位置。但在重装时被裁掉了大部分，只漏出了边缘的残字。你确认这个判断吗？`,
    hintPool: [
      '（翻到一页批注）古画边注通常记录创作信息——谁画的、画的是什么、从哪里看的。',
      '（夹着一张便签）不是正式题跋——正式题跋不会藏在这种位置。更像是后人觉得不需要保留的标注。',
      `（此处有一段红笔批注）"所见"——谁所见？看见什么？两个字本身就在提问。`,
    ],
    affirmPool: [
      '（页边有一行小字）思路正确。',
      '（页边标注）这个判断方向可以。',
      '（页边有一行小字）边注的性质值得继续追问。',
    ],
    correctionPool: [
      '（翻到另一页批注）文徵明的署名不会这么不规整，也不会藏在这种位置。',
      '（此处有一段红笔批注）后人如果修补，只会遮盖，不会留半句没头没尾的话。',
      `（页角折过，翻开看）"所见"——关键在于这是关于"看"的记录。`,
    ],
    quickThoughts: [
      '这是被裁掉的题记残片吗？',
      '"所见"这两个字可能是什么意思？',
      '边注区域原本有完整说明文字吗？',
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
    opening: '先别急着判断它是什么。它比裂纹规整，又不像装裱时留下的折痕。先把它当作一处底层痕迹记录下来。',
    passResponse: '对。现在只能确认它不是普通破损，更像被正式记录忽略掉的底层痕迹。它的用途，要等更多证据来说明。',
    hintPool: [
      '（翻到一页批注）先看它和裂纹、折痕有什么不同——规整程度是关键区分。',
      '（夹着一张便签）如果不是画面内容，为什么会被留在画面下方？',
      '（此处有一段红笔批注）它暂时不是答案，但能证明这里有一层正式记录没有解释的东西。',
    ],
    affirmPool: [
      '（页边有一行小字）观察正确——不像普通损伤。',
      '（页边标注）底层痕迹这个判断方向是对的。',
      '（页边有一行小字）可以先记录下来，和其他痕迹对照。',
    ],
    correctionPool: [
      '（翻到另一页批注）不宜直接解释成某个结论。先记录它和其他痕迹之间的关系。',
      '（此处有一段红笔批注）重点不是它好不好看，而是它为什么没出现在正式记录里。',
      '（页角折过，翻开看）一处细线也被忽略，可能说明被忽略的不只是文字。',
    ],
    quickThoughts: [
      '这条线不像裂纹吧？',
      '它是不是被压住的底层痕迹？',
      '它为什么没出现在正式记录里？',
    ],
  },

  // 综合门槛：三处痕迹之间的关系
  gate_prologue_synthesis: {
    title: '三处痕迹的联系',
    speaker: '周鹤年',
    world: 'real',
    concepts: [
      {
        id: 'human_obscure',
        keywords: [
          '人为遮蔽', '人为遮盖', '人为遮住', '人为压住', '人为处理', '人为排除',
          '刻意遮蔽', '刻意遮盖', '刻意遮住', '刻意压住', '刻意处理',
          '故意遮蔽', '故意遮盖', '故意遮住', '故意压住', '故意处理',
          '有人遮蔽', '有人遮盖', '有人遮住', '有人压住', '有人故意',
          '后人遮蔽', '后人遮盖', '后人遮住', '后人压住', '后人裁去', '后人处理', '后人排除',
          '后来遮蔽', '后来遮盖', '后来遮住', '后来压住', '后来裁去', '后来处理', '后来排除',
          '装裱遮蔽', '装裱遮盖', '装裱压住', '装裱裁去', '装裱处理',
          '重装遮蔽', '重装遮盖', '重装压住', '重装裁去', '重装处理',
          '整理遮蔽', '整理遮盖', '整理压住', '整理裁去', '整理排除',
          '被挡住', '被盖住', '被压住', '藏起来', '看不见了',
          '后来弄过', '后来处理过', '重新裱过', '重新装过',
          '边框压住', '装裱压住', '整理时压住',
          '有人处理过', '不是自然坏的', '不是单纯老化',
          '说明被藏', '说明被挡', '说明被压住',
          '线索被遮', '线索被挡', '来源被挡', '来源被藏', '来源被遮住',
        ],
        patterns: [
          /(?:人为|刻意|故意|有人|后人|后来).{0,12}(?:遮蔽|遮盖|遮住|压住|裁去|处理|排除)/,
          /(?:装裱|重装|整理|配边|归档|边框).{0,12}(?:遮蔽|遮盖|遮住|压住|裁去|处理|排除|挡住|盖住)/,
          /(?:遮蔽|遮盖|遮住|压住|裁去|排除|挡住|盖住|藏起来).{0,12}(?:来源|说明|边注|题签|残字|辅助线|痕迹|线索)/,
          /(?:来源|说明|线索|痕迹).{0,12}(?:被|给).{0,4}(?:遮|盖|挡|压|藏)/,
        ],
        description: '三处痕迹指向人为或后期整理造成的遮蔽',
      },
      {
        id: 'source_explanation',
        keywords: [
          '来源说明', '来源信息', '来源记录', '来源痕迹',
          '出处说明', '出处记录', '来历说明', '来历记录',
          '旁注说明', '边注说明', '题签说明', '说明文字',
          '观看记录', '所见记录', '谁所见', '从哪里看',
          '画外说明', '边上的说明', '小字说明', '这页画的来历',
          '说明被藏起来', '说明被压住', '说明被挡住',
        ],
        description: '被处理的可能是来源或说明类痕迹',
      },
      {
        id: 'not_paint_loss',
        keywords: [
          '不是画心', '画心没丢', '画没有丢', '画还在',
          '不是重画', '不是换画', '不是假画', '不是画本身',
          '不是画面本身', '不是画被换了',
          '不是画坏了', '画本身没坏', '画本身还在', '画面主体还在',
          '不是画丢了', '不是少了一幅',
        ],
        description: '问题不在画心丢失、重画或替换',
      },
      {
        id: 'shared_pattern',
        keywords: [
          '同一种处理', '同一类处理', '共同指向', '共同说明',
          '互相关联', '有关联', '连在一起', '不是孤立',
          '不是单个破损', '不是各坏各的', '都在边缘', '都在装裱层', '都在底层',
          '都被压住', '都被挡住', '都在画外', '都不在画面主体',
          '放在一起看', '一起看', '三处放一起',
        ],
        description: '三处痕迹之间存在共同模式',
      },
    ],
    requiredConcepts: {
      anyOfGroups: [
        ['human_obscure'],
      ],
    },
    minRounds: 2,
    opening: '三处痕迹你都看到了。边上的旧标签只剩一角，"所见"残字被压在装裱层下，画面下方还有一条淡线。它们之间有什么联系？',
    passResponse: '对。现在能确认的是：画本身还在，问题集中在画面之外的说明痕迹。这些痕迹被后来的整理和装裱处理压住了，三处共同指向这一点。',
    hintPool: [
      '（翻到一页批注）旧标签、残字、淡线先放在一起看。它们都不在画面主体里。',
      '（夹着一张便签）普通破损往往散在各处；这三处都贴着边缘、装裱层或画面下方。',
      '（此处有一段红笔批注）这些更像说明这页画来历的小痕迹。先判断它们是自然坏掉，还是被后来整理时挡住了。',
    ],
    affirmPool: [
      '（页边有一行小字）方向接近。再看一步：这些痕迹像自然坏掉，还是像被后来压住？',
      '（页边标注）可以这样并起来看。继续看三处痕迹都在什么位置。',
      '（页边有一行小字）不像普通破损，这一点很重要。还要说清是谁让它们看不见了。',
    ],
    correctionPool: [
      '（翻到另一页批注）画本身还在，先不要往丢画或换画上走。问题集中在画外那些小说明。',
      '（此处有一段红笔批注）暂时不要找具体姓名。现有证据只能支持对痕迹处理方式的判断。',
      '（页角折过，翻开看）如果只是自然破损，就很难解释三处痕迹为什么都集中在边缘、装裱层和画面下方。',
    ],
    quickThoughts: [
      '旧标签、残字和细线的位置有什么共同点？',
      '这些边上的痕迹可能在说明什么？',
      '装裱边框和这些痕迹的位置有什么关系？',
    ],
    fallbackQuickThoughts: [
      '这些痕迹更像自然坏掉，还是后来被处理过？',
      '装裱和整理会不会把画面之外的说明压住？',
      '先不找具体姓名，只判断这些痕迹是不是被人挡住了。',
    ],
    quickThoughtReplies: {
      '旧标签、残字和细线的位置有什么共同点？': '（周老师批注）三处都不在画面主体里：旧标签在边上，残字压在装裱层下，细线在画面下方。先记住这个共同点，再判断它们为什么会留在这些位置。',
      '这些边上的痕迹可能在说明什么？': '（周老师批注）旧标签和残字像是在说明这页画的来历，细线像一条辅助痕迹。现在只能说：它们都属于画面之外的线索，还不能说出它们来自谁。',
      '装裱边框和这些痕迹的位置有什么关系？': '（周老师批注）边框会压住边缘，小字和旧标签最容易被盖住。这里可以先问：这些痕迹是自然留下，还是后来整理时变得看不见？',
      '这些痕迹更像自然坏掉，还是后来被处理过？': '（周老师批注）自然坏掉通常更散乱。这里旧标签、残字、细线都集中在边缘或下方，更值得追问后来整理和装裱的作用。',
      '装裱和整理会不会把画面之外的说明压住？': '（周老师批注）会。边框和装裱层可能盖住旧标签、边上的小字或辅助线。但这一步仍要回到三处证据本身来判断。',
      '先不找具体姓名，只判断这些痕迹是不是被人挡住了。': '（周老师批注）这个问题只到处理方式为止：旧标签被裁，残字被压，细线没进正式记录。先判断它们是不是被后来整理挡住。',
    },
    assistedFallback: {
      timeoutMs: 150000,
      finalAfterFailedRounds: 7,
      finalAfterWrongDirection: {
        failedRounds: 5,
        count: 2,
      },
      round3Message: '（周老师批注）先不要分开看。旧标签、残字和细线都在画面边缘或下方，都不像画面主体的一部分。它们是不是都在说明“画外还有东西”？',
      round5Message: '（周老师批注）这三处不像各坏各的。旧标签被裁，残字被压住，细线没有被正式记录。重点可以先放在：这些说明痕迹是不是被后来整理时挡住了？',
      finalMessage: '（周老师批注）先把三处放在一行看。旧标签被裁掉，只剩边角；“所见”残字被压在装裱层下；那条细线留在画面下方，却没有进入正式记录。它们都不像画本身坏了，更像是画外的说明被后来整理时压住了。',
    },
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
  if (concept.patterns?.some((pattern) => pattern.test(input))) {
    return true;
  }
  return false;
}

function _blocksSynthesisAccumulation(input) {
  const text = input.toLowerCase().trim();
  const blockingPatterns = [
    /(?:不是|并非|没有|不算).{0,8}(?:人为|有人|后人|后来|刻意|故意).{0,8}(?:遮|盖|压|裁|处理|排除)/,
    /(?:不是|并非|没有|不算).{0,8}(?:遮蔽|遮盖|遮住|压住|裁去|人为处理|后人处理)/,
    /(?:只是|就是|应该是|可能是).{0,6}(?:自然|老化|破损|磨损|扫描误差|巧合)/,
    /(?:画心|画|画面).{0,8}(?:丢失|丢了|没了|不见了|被换|换了|重画|假画)/,
    /(?:应该是|可能是|就是).{0,8}(?:丢画|换画|重画|假画)/,
  ];

  return blockingPatterns.some((pattern) => pattern.test(text));
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

  const wrongDirection = _blocksSynthesisAccumulation(input);
  if (wrongDirection) {
    return {
      matchedConcepts,
      accumulatedConcepts: Array.from(accumulatedSet),
      blockedByNegation: true,
      wrongDirection,
    };
  }

  for (const concept of config.concepts) {
    if (_matchConcept(input, concept)) {
      matchedConcepts.push(concept.id);
      accumulatedSet.add(concept.id);
    }
  }

  return {
    matchedConcepts,
    accumulatedConcepts: Array.from(accumulatedSet),
    blockedByNegation: false,
    wrongDirection: false,
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
