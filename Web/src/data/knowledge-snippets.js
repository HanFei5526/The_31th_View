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
册页后来重新装裱，可能是为了修补破损、统一大小，或保护画本身。边框、旧标签和边上的小字也很重要，因为它们常常能说明一页画曾经怎样被整理过。`,
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
放大镜用来看清肉眼容易错过的小痕迹。它适合检查边框接缝、旧标签残角、细小裂纹，以及有没有东西被新边框压住。`,
  },
  {
    id: 'tool_fiber',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【纸质分析】
纸质分析用来看纸张和背纸是否一致。如果这一页背后的纸和其他页不同，说明它可能后来被单独重新装裱过。它能帮助区分画本身和后来加上的装裱层。`,
  },
  {
    id: 'tool_sidelight',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【侧光照射】
侧光照射就是从侧面打光，让纸面上很浅的凹凸和压痕显出来。它适合寻找被边框压住的旧字、压印、刻痕或很淡的底层线。`,
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
题签可以理解成贴在册页边上的旧标签，常用来写页次、题名或来源信息。现在它只剩被新边框压住的一角，边缘还有裁切痕迹，说明它曾经在这里，后来整理时被裁掉了大部分。`,
  },
  {
    id: 'clue_text_annotation',
    chapter: 0,
    unlockCondition: ({ cluesFound }) => cluesFound.has('clue_text'),
    content: `【旁注惯例】
旁注就是写在边上的小字，不一定是正式题字。残留的“所见”二字和“看见”有关，说明这里原本可能有一段更完整的边上说明。`,
  },
  {
    id: 'clue_line_draft',
    chapter: 0,
    unlockCondition: ({ cluesFound }) => cluesFound.has('clue_line'),
    content: `【底层细线异常】
画面下方的细线比裂纹更直，也不像普通折痕。它像是很早以前留下的一条辅助痕迹，但只凭这一条线，还不能判断它具体用来做什么。`,
  },
  {
    id: 'synthesis_remounting_purpose',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.synthesisPassed),
    content: `【二次装裱的目的】
后来重新装裱，可能会保护画本身，也可能把边上的旧标签、小字和细线压住。三处痕迹一起看，重点是：画还在，但说明这页画来历的痕迹被整理掉了。`,
  },
  {
    id: 'synthesis_conceal_methods',
    chapter: 0,
    unlockCondition: ({ progress }) => Boolean(progress.synthesisPassed),
    content: `【来源信息被遮蔽的常见手段】
一页画的来历说明，可能被裁掉旧标签、盖住边上的小字、重配边框或忽略辅助线。这样做不一定改变画本身，却会让后来的人更难知道这些痕迹原本在说明什么。`,
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
远香堂是拙政园中部的核心建筑，四面环水。堂内悬挂有多首题诗，与园中景观相互呼应——诗里写的景，往往就是窗外能望见的那一处。题诗属于题跋范畴，是画面之外的重要文本信息。`,
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
    unlockCondition: ({ progress }) => Boolean(progress.poemCompareStarted),
    content: `【异文与版本比对】
异文指同一文本在不同版本中出现的字词差异。古籍校勘中，逐字对照不同抄本或刻本是发现隐藏信息的基础方法。单个差异可能是传抄讹误，但多处差异如果构成可读句式，则可能是有意嵌入。`,
  },
  {
    id: 'ch2_huafeiyiren',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.poemDiffsFound >= 4),
    content: `【"画非一人"】
五首拙政园题诗中，四处异文字组合为"画·非·一·人"。这不是随机讹误——四字分散在不同诗中，各处位置不统一，但串读后构成完整语义。每处差异都是完全不同的字（如"画"与"锁"、"非"与"自"），而非一笔一划的细微区别，因此单看某一首诗时不容易察觉藏了字。异文串读法揭示了有人在题诗中刻意藏入一句断言。此时它只能说明作品来源或观看来源存在疑问，不能直接证明画心成稿归属发生改变。`,
  },
  {
    id: 'ch2_old_comment',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.foundOldComment),
    content: `【旧批注与规范化遮蔽】
旧批注提到"视点卑近，似非成稿"和"宜配边压覆"。这说明后人在整理画册时，将"不符合体例"的边旁痕迹（杂线、残字、旧签）用装裱边框覆盖。这不是恶意销毁，而是出于规范化的体例整理——但客观上遮蔽了来源信息。`,
  },
  {
    id: 'ch2_concealment_chain',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.foundOldComment),
    content: `【遮蔽链条：从批注到接缝】
旧批注中"宜配边压覆"是一条整理指令——后人据此用装裱边框将画面边旁的杂线、残字、旧签压住。第一章在芙蓉榭画面上发现的装裱接缝残角，正是这一指令的执行痕迹：旧题签被刻意裁去只留被覆盖的一角，装裱层下的陌生笔迹旁注也被边框压住。批注是指令，接缝残角是结果——两处证据互为因果，共同指向同一次系统性的规范化遮蔽。`,
  },
  {
    id: 'ch2_inkstone',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.hasInkstone),
    content: `【残砚与朱砂】
朱砂（辰砂）在传统绘画中用于底稿线、定位标记和辅助构图线。这些朱砂线通常在最终成稿后被覆盖或洗去，但在年代久远的作品中可能部分残留。残砚是随身私人工具，砚池中的朱砂残留表明其主人曾在画面上做过标记或打过底稿。`,
  },
  {
    id: 'ch2_three_traces',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.hasInkstone),
    content: `【三处痕迹的汇聚】
断簪背面的"蘅"字是私人记号，题诗中四处异文拼出"画非一人"是刻意藏入的断言，残砚是随身作画工具且砚背刻词带有深重寄托。三样东西性质不同——私人物件、文字暗语、创作工具——但都指向同一个方向：有一个人深度参与了这套画的创作过程，并在不同位置留下了自己的痕迹。目前能确定的是这些痕迹高度关联，但还不能直接断定它们一定出自同一人之手。`,
  },
  {
    id: 'ch2_voice',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.heardVoice),
    content: `【水面回声】
小飞虹桥下浮现文字"知我者，唯有此园"。这句话暗示留下痕迹的人将园林本身视为唯一的理解者——此人的观看不被他人所知，但园林的空间结构保存了这个视角。`,
  },
  {
    id: 'ch2_evidence_gap',
    chapter: 2,
    unlockCondition: ({ progress }) => Boolean(progress.hasInkstone),
    content: `【证据链的缺口与下一步方向】
目前掌握的断簪、题诗异文、残砚只能证明有人存在过并留下了痕迹，但还不能证明这个人做了什么——也就是说，还缺少她实际参与作画的物质证据。周老师指出：残砚砚池中有朱砂残留，朱砂在传统绘画中用于打底稿线、定位标记和辅助构图线，成稿后通常被覆盖或洗去。如果这个人确实用残砚在画面上作过画，那么年代久远后部分朱砂线可能重新透出纸面，呈现极淡的红色残留痕迹。下一步应在画面上寻找这种底稿线或辅助线的物质痕迹。`,
  },
  {
    id: 'ch3_inkstone_and_sketches',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.seenScatteredSketches),
    content: `【残砚与草图的关联】
残砚砚池中残留朱砂，朱砂用于打底稿线和辅助构图线。北厅散落的草图是反复试画园中景物的练习痕迹。两者共同指向一个推论：持有这方残砚的人曾在园中反复练习作画，用朱砂打底稿、做标记。草图是练习过程的痕迹，残砚是作画工具的痕迹——它们从不同角度印证了同一个人的创作活动。`,
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
    content: `【渗字”看得到吗”】
画纸上渗出的”看得到吗”不是对当下某个人的直接指认，而像一句长期悬置的询问：留下这句话的人希望有人确认这些痕迹确实存在。这里的重点是”被见证”，不是被召唤或被正名。`,
  },
  {
    id: 'ch3_concealment_methods',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.seenBleedingText),
    content: `【遮蔽的多种手段】
旧批注中"宜配边压覆"是用装裱边框覆盖画面边旁的杂线、残字、旧签——这是针对纸面作品的遮蔽。留听阁那面被重新抹过灰泥的墙则是另一种遮蔽手段：用灰泥覆盖墙面上的痕迹。两者的逻辑相同——都是后人整理时将"不符合体例"或不便公开的内容用物理覆盖的方式隐藏，而非销毁。手段不同（边框/灰泥），目的一致（规范化遮蔽）。`,
  },
  {
    id: 'ch3_two_voices',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.seenBleedingText),
    content: `【两处声音的关联】
水面回声”知我者，唯有此园”和渗字”看得到吗”语气不同但指向同一个人。前者是对园林的倾诉——将园林视为唯一的理解者；后者是对未来观看者的试探——不确定自己留下的痕迹是否还能被辨认。两句话共同勾勒出这个人的处境：她的观看不被同时代的人所知，只能寄望于空间本身和未来的发现者。`,
  },
  {
    id: 'ch3_sealed_wall_line',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.seenBleedingText),
    content: `【封墙下的弧线与朱砂底稿线】
留听阁封墙灰泥下触摸到的弧线刻痕有方向、有弧度，不像随手划痕。结合残砚砚池中的朱砂残留，这条弧线很可能就是朱砂画出的底稿线或辅助构图线——周老师说的那种被覆盖后年久透出的物质痕迹。如果灰泥完全剥开后能看到完整的朱砂线条，那就是证据链中一直缺少的"她实际参与作画"的物质证据。`,
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
    id: 'ch3_viewpoint_connection',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.hasRubbing),
    content: `【"视点卑近"与草图拓片的低位视角】
旧批注说画的"视点卑近，似非成稿"——整理者认为视角太低不像正式作品。草图拓片恰好证实了这个低位视角的来源：留下草图的人确实从一个很低的位置观看园林，这不是失误，而是一个刻意选择的观看位置。旧批注中的"视点卑近"和草图拓片的低位视角是同一回事——只是整理者把它当成了缺陷，而画面保留了这个视角。`,
  },
  {
    id: 'ch3_low_viewpoint_confirmed',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.understoodNotPainter || progress.hasRubbing),
    content: `【画得不好，但看得很准】
蹲下到墙面低位线的高度后，草图中原本”不对”的比例关系变得合理：远香堂倒影、小飞虹弧线、梧竹幽居竹影可以同入一眼。留下草图的人的贡献不是成熟笔墨，也不是正式构图方案，而是发现并留下了一个观看位置。`,
  },
  {
    id: 'ch3_material_tracing',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.hasLetter || progress.hasRubbing),
    content: `【材料溯源方法】
周老师的批注提到”朱砂认朱砂，刻痕认刻痕”——这是修复学中的”材料溯源”方法：通过物质材料的同源性追溯痕迹归属。与第二章的”版本比对”不同：版本比对是通过文字差异发现隐藏信息（如题诗异文拼出”画非一人”），材料溯源是通过物理材料的一致性建立关联（如残砚朱砂与封墙朱砂底稿线属于同一条材料线索）。两种方法互补——文字可以被改写或讹传，但材料的物理特征更难伪造。`,
  },
  {
    id: 'ch3_letter',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.hasLetter),
    content: `【王蘅的信】
信中写到”不必有名，不必有形。只要有痕迹。”这说明她的核心愿望不是进入正式署名体系，也不是要求后人为她塑造身份，而是希望自己的观看曾经存在这件事能留下痕迹。`,
  },
  {
    id: 'ch3_letter_and_bleeding',
    chapter: 3,
    unlockCondition: ({ progress }) => Boolean(progress.hasLetter),
    content: `【信与渗字的呼应】
信中”不必有名，不必有形。只要有痕迹”和渗字”看得到吗”表达的是同一个核心愿望——被见证。渗字是对未来观看者的试探，不确定痕迹是否还能被辨认；信则把这个愿望说得更明确：她不求署名、不求身份，只求有人发现她曾在这些位置看过、记过、留下过痕迹。两者语气不同——渗字是不确定的询问，信是确定的表白——但指向同一件事。`,
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
