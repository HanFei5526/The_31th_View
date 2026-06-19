export const KNOWLEDGE_SNIPPETS = [
  {
    id: 'prologue_garden_views',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【拙政园三十一景基本信息】
《拙政园三十一景图》是围绕苏州拙政园空间展开的册页体系，共三十一幅，每幅对应园中一处景观或观看位置。第三十一景是最后一幅，画面仍在册页体系内，但构图视角与前三十幅存在微妙差异。`,
  },
  {
    id: 'prologue_wen_zhengming',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【文徵明简介】
文徵明是吴门画派代表人物，长洲人，擅长山水、书法与题跋。他与拙政园相关的绘图、题诗传统，构成后世理解这套册页的重要依据。`,
  },
  {
    id: 'prologue_album_mounting',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【册页装裱常识】
册页重装可能出于修复破损、统一尺幅、保护画心等目的。装裱、边框、题签和旁注都属于作品的物质信息，能帮助判断作品流转和整理过程。`,
  },
  {
    id: 'prologue_notebook_scope',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【修复笔记本当前内容】
当前笔记本已解锁的内容包括：《拙政园三十一景图》的公开信息、文徵明简介、册页装裱常识，以及后续由玩家亲自发现并记录的线索。它不是全知资料库；未发现的线索、后续章节内容和最终真相不会提前出现在笔记本里。`,
  },
  {
    id: 'clue_margin_label',
    chapter: 0,
    unlockCondition: ({ cluesFound }) => cluesFound.has('clue_margin'),
    content: `【题签功能说明】
题签常用于标识册页、页次、题名或相关来源信息。若旧题签只剩被新装裱压住的一角，且边缘有裁切痕迹，说明它曾被保留过、又在后续整理中被大幅移除。`,
  },
  {
    id: 'clue_text_annotation',
    chapter: 0,
    unlockCondition: ({ cluesFound }) => cluesFound.has('clue_text'),
    content: `【旁注惯例】
旁注通常记录观看、校勘、来源或制作相关的信息，不一定属于正式题跋。残留的“所见”二字指向一种观看记录，说明原本可能存在更完整的边注说明。`,
  },
  {
    id: 'clue_line_draft',
    chapter: 0,
    unlockCondition: ({ cluesFound }) => cluesFound.has('clue_line'),
    content: `【底层细线异常】
画面下方的细线比裂纹规整，又不像装裱产生的痕迹。它更像是某种被保留下来的定位痕迹，但仅凭这一处还不能判断它的具体用途。`,
  },
  {
    id: 'synthesis_remounting_purpose',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.synthesisPassed),
    content: `【二次装裱的目的】
二次装裱既可能为了保护画心，也可能在统一册页体例时改变边缘信息的可见性。若题签、旁注和底层细线同时被压住或忽略，重点不在画面是否缺失，而在来源说明被整理掉。`,
  },
  {
    id: 'synthesis_conceal_methods',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.synthesisPassed),
    content: `【来源信息被遮蔽的常见手段】
来源信息可能通过裁切题签、覆盖旁注、重配边框、重新归档或忽略辅助痕迹等方式被遮蔽。这类处理不会必然改变画心，却会改变后来者理解作品来源的路径。`,
  },
  {
    id: 'ch1_heng',
    chapter: 1,
    unlockCondition: ({ chapter }) => chapter >= 1,
    content: `【“蘅”字的含义】
蘅，即杜衡，一种香草名。《楚辞》中有云：“芷葺兮荷屋，缭之兮杜衡。”在中国古典意象中，常用来指代高洁的女子。在三十一景的线索中，它可能是留下这些痕迹的主人名字。`,
  },
  {
    id: 'ch1_low_viewpoint',
    chapter: 1,
    unlockCondition: ({ chapter }) => chapter >= 1,
    content: `【低处观察】
第一章的场景探索会反复出现“站着看不到、低下来才看得到”的瞬间。它暂时不是结论，而是一种观察方法：有些痕迹需要换到更低、更偏、更不正式的位置才会显现。`,
  },
  {
    id: 'ch2_yiwen',
    chapter: 2,
    unlockCondition: ({ chapter }) => chapter >= 2,
    content: `【异文与版本比对】
异文指同一文本在不同版本中出现的字词差异。古籍校勘中，逐字对照不同抄本或刻本是发现隐藏信息的基础方法。单个差异可能是传抄讹误，但多处差异如果构成可读句式，则可能是有意嵌入。`,
  },
  {
    id: 'ch2_huafeiyiren',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.poemDiffsFound >= 4),
    content: `【"画非一人"】
五首拙政园题诗中，四处异文字组合为"画·非·一·人"。这不是随机讹误——四字分散在不同诗中，各处位置不统一，但串读后构成完整语义。异文串读法揭示了有人在题诗中刻意藏入一句断言。`,
  },
  {
    id: 'ch2_old_comment',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.foundOldComment),
    content: `【旧批注与规范化遮蔽】
旧批注提到"视点卑近，似非成稿"和"宜配边压覆"。这说明后人在整理画册时，将"不符合体例"的边旁痕迹（杂线、残字、旧签）用装裱边框覆盖。这不是恶意销毁，而是出于规范化的体例整理——但客观上遮蔽了来源信息。`,
  },
  {
    id: 'ch2_inkstone',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.hasInkstone),
    content: `【残砚与朱砂】
朱砂（辰砂）在传统绘画中用于底稿线、定位标记和辅助构图线。这些朱砂线通常在最终成稿后被覆盖或洗去，但在年代久远的作品中可能部分残留。残砚是随身私人工具，砚池中的朱砂残留表明其主人曾在画面上做过标记或打过底稿。`,
  },
  {
    id: 'ch2_voice',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.heardVoice),
    content: `【水面回声】
小飞虹桥下浮现文字"知我者，唯有此园"。这句话暗示留下痕迹的人将园林本身视为唯一的理解者——她的观看不被他人所知，但园林的空间结构保存了她的视角。`,
  },
];
