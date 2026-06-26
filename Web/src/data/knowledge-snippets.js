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
    id: 'tool_magnifier',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【放大镜检查】
放大镜用于对画面进行高倍率目视检查。在古画修复中，放大镜能看清装裱接缝处是否有重叠痕迹、边框是否压住了旧有标记、纸面是否有细微的裂纹或修补痕迹。它是最基础的检查工具，适合观察画面表层的物理状态。`,
  },
  {
    id: 'tool_fiber',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【纸质分析】
纸质分析通过观察纸张纤维结构来判断用纸类型和年代。在册页修复中，如果某一页的背纸纤维与其他页不一致，说明该页可能经历过单独重装。纸质分析能区分画心本身与后来添加的装裱层，帮助判断作品是否经过二次处理。`,
  },
  {
    id: 'tool_sidelight',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【侧光照射】
侧光照射是将光源从侧面低角度打在画面上的检查方法。侧光能让纸面上肉眼不易察觉的凹凸变得明显，比如被覆盖的旧字痕迹、压印、刻痕或底层墨线。它特别适合检查装裱层下方是否隐藏着被遮盖的文字或标记。`,
  },
  {
    id: 'prologue_exploration',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【画面线索探索】
三种检查工具全部使用完毕后，进入线索探索阶段。此时需要在画面上不同位置点击，寻找隐藏的异常痕迹。画面中共有三处异常线索，点击到正确位置会触发反馈。找齐三处线索后即可进入综合研讨。点击画面是为了定位异常痕迹，不是再使用工具。`,
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
    id: 'ch1_painting_world',
    chapter: 1,
    unlockCondition: ({ progress }) => Boolean(progress.prologueComplete || progress.prologue_completed || progress.prologue),
    content: `【画中世界与兰雪堂】
你现在看到的场景来自《拙政园三十一景图》第三十一景的画面内部。兰雪堂是拙政园东部的入口建筑，画中的样貌是文徵明绘制时的呈现，与后世照片中的实景不同——视角、比例和细节都经过了画家的取舍。在画中世界探索时，留意建筑构件、铭文、地面物件等细节，它们可能藏有正式画面之外的痕迹。`,
  },
  {
    id: 'ch1_zhuiyun',
    chapter: 1,
    unlockCondition: ({ progress }) => Boolean(progress.plaqueNoted),
    content: `【缀云峰与太湖石】
缀云峰是拙政园东部的一座太湖石峰，以"瘦、漏、透、皱"著称。文徵明笔下的石纹极细致，每条纹理都经画家精心勾勒。太湖石的观赏讲究多角度——正面看是一种形态，绕到背后、从低处看可能发现不同的纹路和细节。画中的峰石周围可能藏有不属于正式画面内容的痕迹。`,
  },
  {
    id: 'ch1_furong',
    chapter: 1,
    unlockCondition: ({ progress }) => Boolean(progress.plaqueNoted),
    content: `【芙蓉榭与水面倒影】
芙蓉榭是拙政园东部临水建筑，栏杆探入水面，倒影极清晰。在传统绘画中，倒影有时会保留不在实景中出现的物件。水面倒影是观察画面隐藏信息的重要角度——实物与倒影之间的差异可能指向某种被刻意留下的痕迹。`,
  },
  {
    id: 'ch2_yuanxiang_scene',
    chapter: 2,
    unlockCondition: () => true,
    content: `【远香堂与堂内题诗】
远香堂是拙政园中部的核心建筑，四面环水。堂内悬挂有多首题诗，与园中景观相互呼应。这些题诗在流传中可能出现异文——不同版本之间的字词差异可能是传抄讹误，也可能隐含刻意留下的信息。逐字比对画中题诗与参考版本是发现异文的基本方法。`,
  },
  {
    id: 'ch3_yuanyang_scene',
    chapter: 3,
    unlockCondition: () => true,
    content: `【鸳鸯馆南北厅】
鸳鸯馆是拙政园西部的主要建筑，分南北两厅。南厅正式、规整；北厅偏私密，常用于日常起居。画中世界里两厅的陈设差异可能反映不同的使用者或用途。留意墙面和案台上的痕迹——正式画作之外的私人记号往往出现在不起眼的位置。`,
  },
  {
    id: 'ch3_liuting_scene',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.seenBleedingText || progress.seenScatteredSketches),
    content: `【留听阁与封墙】
留听阁位于拙政园西部。画中世界里，阁内一面墙被重新抹过灰泥。重新抹灰在建筑维护中常见，但如果抹灰范围精确到只覆盖某个区域，可能是为了遮盖墙面上原有的内容。之前发现的朱砂残留（残砚）可以用于检验灰泥下方是否有被掩盖的朱砂线痕迹。`,
  },
  {
    id: 'ch1_heng',
    chapter: 1,
    unlockCondition: ({ progress }) => Boolean(progress.hasHairpin),
    content: `【“蘅”字的含义】
蘅，即杜衡，一种香草名。《楚辞》中有云：“芷葺兮荷屋，缭之兮杜衡。”在中国古典意象中，常用来指代高洁的女子。断簪背面刻有这个字，说明它更像私人的物主记号，而不是正式题名或工匠标记；此时只能判断它可能指向某位留下痕迹的人，不能确认身份。`,
  },
  {
    id: 'ch1_low_viewpoint',
    chapter: 1,
    unlockCondition: ({ progress }) => Boolean(progress.zhuiyunExplored),
    content: `【低处观察】
第一章的场景探索会出现“站着看不到、低下来才看得到”的瞬间。它暂时不是结论，而是一种观察方法：有些痕迹需要换到更低、更偏、更不正式的位置才会显现。此时可以把低处微光与匾额多余笔画并列记录为异常痕迹，但不能说匾额多余笔画也是低处才看见，也不能把二者直接合并成来源判断。`,
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
五首拙政园题诗中，四处异文字组合为"画·非·一·人"。这不是随机讹误——四字分散在不同诗中，各处位置不统一，但串读后构成完整语义。异文串读法揭示了有人在题诗中刻意藏入一句断言。此时它只能说明作品来源或观看来源存在疑问，不能直接证明画心成稿归属发生改变。`,
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
小飞虹桥下浮现文字"知我者，唯有此园"。这句话暗示留下痕迹的人将园林本身视为唯一的理解者——此人的观看不被他人所知，但园林的空间结构保存了这个视角。`,
  },
  {
    id: 'ch3_scattered_sketches',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.seenScatteredSketches),
    content: `【北厅散落草图】
鸳鸯馆北厅的散落草图笔力弱、比例失准，水面过重，桥线过弯，亭阁被压得很低。它们说明留下痕迹的人曾反复尝试画园中景物，但这些草图还不能证明此人完成了正式画心，也不能直接说明第三十一景的来源。`,
  },
  {
    id: 'ch3_bleeding_text',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.seenBleedingText),
    content: `【“看得到吗”】
画纸上渗出的”看得到吗”不是对当下某个人的直接指认，而像一句长期悬置的询问：留下这句话的人希望有人确认这些痕迹确实存在。这里的重点是”被见证”，不是被召唤或被正名。`,
  },
  {
    id: 'ch3_red_lines',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.redLinesRevealed),
    content: `【墙面朱砂线】
残砚中的朱砂与墙面红线产生呼应，说明两者属于同一条材料线索。朱砂线更像底稿线、定位线或辅助构图线，能帮助追溯观看位置，但此时仍不能把它等同于正式成稿。`,
  },
  {
    id: 'ch3_sketch_revealed',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.sketchRevealed),
    content: `【留听阁墙面草图】
灰泥下露出的不是成熟画作，而是一幅被保留下来的低位视角草图。它与北厅散落草图一样拙，但这一次没有被撕掉或放弃，而是被藏在墙面里，说明留下者希望这个观看位置能被保存。`,
  },
  {
    id: 'ch3_low_viewpoint_confirmed',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.understoodNotPainter || progress.hasRubbing),
    content: `【画得不好，但看得很准】
蹲下到墙面低位线的高度后，草图中原本”不对”的比例关系变得合理：远香堂倒影、小飞虹弧线、梧竹幽居竹影可以同入一眼。留下草图的人的贡献不是成熟笔墨，也不是正式构图方案，而是发现并留下了一个观看位置。`,
  },
  {
    id: 'ch3_letter',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.hasLetter),
    content: `【王蘅的信】
信中写到“不必有名，不必有形。只要有痕迹。”这说明她的核心愿望不是进入正式署名体系，也不是要求后人为她塑造身份，而是希望自己的观看曾经存在这件事能留下痕迹。`,
  },
  {
    id: 'ch3_plaque_recognized',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.plaqueRecognized),
    content: `【匾额追认】
兰雪堂匾额上多余的一笔、断簪背面的“蘅”、墙面题字和信件互相呼应，指向同一只手、同一种心思。它们构成的是痕迹链，而不是正式署名链；它们让人看见王蘅曾在园中观看过。`,
  },
  {
    id: 'finale_records_only',
    chapter: 4,
    unlockCondition: ({ progress }) => Boolean(progress.chapter3Complete || progress.hasLetter || progress.hasRubbing),
    content: `【终章笔记本边界】
终章只应回顾已经获得的记录和证据链，不替玩家回答四问，不推荐结局，也不判断哪一种选择更正确。四问和三结局属于玩家的价值判断，修复笔记本只能提醒证据已经在哪里。`,
  },
];
