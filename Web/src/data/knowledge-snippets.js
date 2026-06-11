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
    content: `【构图辅助线用途】
构图辅助线用于确定画面比例、位置和视角高度。低位辅助线意味着作画或观察时的视线位置偏低，和常规站立游观视点不同。`,
  },
  {
    id: 'synthesis_remounting_purpose',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.synthesisPassed),
    content: `【二次装裱的目的】
二次装裱既可能为了保护画心，也可能在统一册页体例时改变边缘信息的可见性。若题签、旁注和辅助线同时被压住或忽略，重点不在画面是否缺失，而在来源说明被整理掉。`,
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
    content: `【低位视角】
第一章的场景探索中，发现青石板等低视角的互动点，与序章中发现的低位构图辅助线相互呼应，进一步印证了第三十一景的画面原本是以一个极低的、甚至是贴近地面的视点进行观察的。`,
  },
];
