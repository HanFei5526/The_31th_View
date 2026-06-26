/**
 * 《卅一景》一体化服务端
 *
 * 同时提供：
 *   1. 前端静态文件（从 ../dist/ serve）
 *   2. DeepSeek API 代理（密钥留在服务端）
 *
 * 端点：
 *   GET  /                     → index.html（前端入口）
 *   GET  /assets/*             → 静态资源（JS/CSS/字体/图片）
 *   GET  /images/*             → 图片资源
 *   GET  /api/health           → 健康检查
 *   POST /api/notebook/message → 修复笔记本语义接口
 *   POST /api/chat             → 兼容转发 messages 到 DeepSeek
 *
 * 启动：
 *   cd Web && npm run build    # 先构建前端
 *   cd server && npm start     # 启动一体化服务
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

/* ---- CORS 白名单 ----
 * 只允许 CORS_ORIGIN 里列出的来源（逗号分隔）。
 * 不配置时默认本地开发端口（Vite 默认 5173）。
 */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // 无 origin（同源请求、curl、健康检查探针）放行
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS 拒绝: ${origin} 不在白名单内`));
  },
}));
app.use(express.json({ limit: '256kb' }));

// 信任反向代理的 X-Forwarded-For，让限流按真实客户端 IP 计数
app.set('trust proxy', 1);

/* ---- 前端静态文件 ---- */
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, {
    maxAge: '1d',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.woff2')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));
  console.log(`[server] 静态文件目录: ${DIST_DIR}`);
} else {
  console.warn(`[server] 警告: dist 目录不存在 (${DIST_DIR})，将不 serve 前端文件`);
}

/* ---- 限流：每 IP 每分钟最多 N 次 /api/chat ---- */
const chatLimiter = rateLimit({
  windowMs: Number(process.env.RATE_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});

const NOTEBOOK_KNOWLEDGE = [
  {
    id: 'prologue_garden_views',
    chapter: 0,
    unlock: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【拙政园三十一景基本信息】
《拙政园三十一景图》是围绕苏州拙政园空间展开的册页体系，共三十一幅，每幅对应园中一处景观或观看位置。第三十一景是最后一幅，画面仍在册页体系内，但构图视角与前三十幅存在微妙差异。`,
  },
  {
    id: 'prologue_wen_zhengming',
    chapter: 0,
    unlock: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【文徵明简介】
文徵明是吴门画派代表人物，长洲人，擅长山水、书法与题跋。他与拙政园相关的绘图、题诗传统，构成后世理解这套册页的重要依据。`,
  },
  {
    id: 'prologue_album_mounting',
    chapter: 0,
    unlock: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【册页装裱常识】
册页重装可能出于修复破损、统一尺幅、保护画心等目的。装裱、边框、题签和旁注都属于作品的物质信息，能帮助判断作品流转和整理过程。`,
  },
  {
    id: 'prologue_notebook_scope',
    chapter: 0,
    unlock: ({ progress }) => Boolean(progress.hasNotebook),
    content: `【修复笔记本当前内容】
当前笔记本已解锁的内容包括：《拙政园三十一景图》的公开信息、文徵明简介、册页装裱常识，以及后续由玩家亲自发现并记录的线索。它不是全知资料库；未发现的线索、后续章节内容和最终真相不会提前出现在笔记本里。`,
  },
  {
    id: 'clue_margin_label',
    chapter: 0,
    unlock: ({ cluesFound }) => cluesFound.has('clue_margin'),
    content: `【题签功能说明】
题签常用于标识册页、页次、题名或相关来源信息。若旧题签只剩被新装裱压住的一角，且边缘有裁切痕迹，说明它曾被保留过、又在后续整理中被大幅移除。`,
  },
  {
    id: 'clue_text_annotation',
    chapter: 0,
    unlock: ({ cluesFound }) => cluesFound.has('clue_text'),
    content: `【旁注惯例】
旁注通常记录观看、校勘、来源或制作相关的信息，不一定属于正式题跋。残留的“所见”二字指向一种观看记录，说明原本可能存在更完整的边注说明。`,
  },
  {
    id: 'clue_line_draft',
    chapter: 0,
    unlock: ({ cluesFound }) => cluesFound.has('clue_line'),
    content: `【底层细线异常】
画面下方的细线比裂纹规整，又不像装裱产生的痕迹。它更像是某种被保留下来的定位痕迹，但仅凭这一处还不能判断它的具体用途。`,
  },
  {
    id: 'synthesis_remounting_purpose',
    chapter: 0,
    unlock: ({ progress }) => Boolean(progress.synthesisPassed),
    content: `【二次装裱的目的】
二次装裱既可能为了保护画心，也可能在统一册页体例时改变边缘信息的可见性。若题签、旁注和底层细线同时被压住或忽略，重点不在画面是否缺失，而在来源说明被整理掉。`,
  },
  {
    id: 'synthesis_conceal_methods',
    chapter: 0,
    unlock: ({ progress }) => Boolean(progress.synthesisPassed),
    content: `【来源信息被遮蔽的常见手段】
来源信息可能通过裁切题签、覆盖旁注、重配边框、重新归档或忽略辅助痕迹等方式被遮蔽。这类处理不会必然改变画心，却会改变后来者理解作品来源的路径。`,
  },
  {
    id: 'ch1_entry_scope',
    chapter: 1,
    unlock: ({ chapter, progress }) => chapter >= 1 || Boolean(progress.prologueComplete || progress.prologue_completed),
    content: `【第一章记录范围】
进入第一章后，修复笔记本可以继续调用序章已记录的题签、旁注、底层细线和来源遮蔽判断。但第一章的新发现仍需玩家亲自触发后才会成为可引用资料。`,
  },
  {
    id: 'ch1_lanxue_observation',
    chapter: 1,
    unlock: ({ sceneState, progress }) => sceneState === 'lanxue' || Boolean(progress.plaqueNoted),
    content: `【兰雪堂观察批注】
兰雪堂阶段应优先观察匾额、廊柱、石板和竹影等场景元素。画中兰雪堂与照片或现实印象不完全一致时，暂不应判断为损坏；更可能是画中空间、观看位置、季节或图像表达造成的差异。重点是寻找“稳定却不合常规”的细节。`,
  },
  {
    id: 'ch1_plaque_extra_stroke',
    chapter: 1,
    unlock: ({ progress }) => Boolean(progress.plaqueNoted),
    content: `【兰雪堂匾额异常】
兰雪堂匾额“兰”字草字头下多出一道极细横笔，笔力稳定，墨色与周围一致，暂不能视作败笔或后人添改。它更像一处被放在正式文字内部的私人标记。`,
  },
  {
    id: 'ch1_low_viewpoint',
    chapter: 1,
    unlock: ({ progress, chapter }) => chapter >= 1 && Boolean(progress.zhuiyunExplored),
    content: `【低处观察】
缀云峰石缝处的观察记录提示：有些景物只有在蹲下、靠近或换到更低的位置时才显现。此时它只是观察方法，不是最终结论。`,
  },
  {
    id: 'ch1_reflection_puzzle',
    chapter: 1,
    unlock: ({ progress, sceneState, hairpinIdentified }) => Boolean(progress.hasHairpin) || sceneState === 'furong' || sceneState === 'puzzle' || Boolean(hairpinIdentified),
    content: `【芙蓉榭倒影记录】
芙蓉榭中，现实栏杆与水面倒影不一致：上方栏杆空无一物，倒影里却多出模糊物件。此时可提示玩家先观察倒影中的异常，再留意水面分界线；不要提前说明物件身份。这个谜题的关键是“现实看不到，换到倒影或水面关系中才看得到”。`,
  },
  {
    id: 'ch1_reflection_after_identified',
    chapter: 1,
    unlock: ({ sceneState, hairpinIdentified, progress }) => Boolean(hairpinIdentified) || Boolean(progress.hasHairpin) || sceneState === 'puzzle',
    content: `【芙蓉榭水面操作批注】
倒影中的物件被看清后，水面分界线成为值得尝试的交互点。若直接伸手够倒影，倒影只会散开；应把注意力放在真实与倒影之间的界线，以及“翻转观看方式”的可能性。`,
  },
  {
    id: 'ch1_hairpin_heng',
    chapter: 1,
    unlock: ({ progress }) => Boolean(progress.hasHairpin),
    content: `【断簪与“蘅”字】
断簪为银质，簪头残留半朵芙蓉，簪身背面刻有极小的“蘅”字。蘅，即杜衡，是香草名，古典语境中可指高洁之意。此时只能判断它可能与某个私人身份或记号有关，不能据此确认人物真相。`,
  },
  {
    id: 'ch1_workshop_method',
    chapter: 1,
    unlock: ({ progress }) => Boolean(progress.chapter1Complete || progress.chapter1_completed || progress.chapter1Choice),
    content: `【章末方法提示】
周老师在现实工作室提醒：一个字不能说明全部，只能作为继续追踪的线索。后续应关注题跋、匾额与边注，因为这些位置容易留下不够正式、却更接近来源的信息。`,
  },
  {
    id: 'ch2_yiwen',
    chapter: 2,
    unlock: ({ chapter }) => chapter >= 2,
    content: `【异文与版本比对】
异文指同一文本在不同版本中出现的字词差异。古籍校勘中，逐字对照不同抄本或刻本是发现隐藏信息的基础方法。单个差异可能是传抄讹误，但多处差异如果构成可读句式，则可能是有意嵌入。`,
  },
  {
    id: 'ch2_yuanxiang_observation',
    chapter: 2,
    unlock: ({ chapter, sceneState, chapterScene }) => chapter >= 2 &&
      (chapterScene === 'chapter2-paint' || !sceneState || ['yuanxiang', 'poem_compare', 'reveal'].includes(sceneState)),
    content: `【远香堂观察批注】
远香堂阶段的重点是题诗、竖轴和异文比对。若墙上题诗与记忆或版本记录不同，应先逐字对照，不凭印象判断；差异字需要单独记录，再看能否串读成句。`,
  },
  {
    id: 'ch2_huafeiyiren',
    chapter: 2,
    unlock: ({ progress }) => Boolean(progress.poemDiffsFound >= 4),
    content: `【“画非一人”】
五首拙政园题诗中，四处异文字组合为“画·非·一·人”。这不是随机讹误——四字分散在不同诗中，各处位置不统一，但串读后构成完整语义。异文串读法揭示了有人在题诗中刻意藏入一句断言。此阶段可理解为“另有参与者”，但不能提前确认其真实身份。`,
  },
  {
    id: 'ch2_old_comment',
    chapter: 2,
    unlock: ({ progress }) => Boolean(progress.foundOldComment),
    content: `【旧批注与规范化遮蔽】
旧批注提到“视点卑近，似非成稿”和“宜配边压覆”。这说明后人在整理画册时，将“不符合体例”的边旁痕迹用装裱边框覆盖。这不必然是恶意销毁，更像出于规范化的体例整理，但客观上遮蔽了来源信息。`,
  },
  {
    id: 'ch2_inkstone',
    chapter: 2,
    unlock: ({ progress }) => Boolean(progress.hasInkstone),
    content: `【残砚与朱砂】
朱砂在传统绘画中可用于底稿线、定位标记和辅助构图线。这类痕迹通常在最终成稿后被覆盖或洗去，但年代久远后可能部分残留。残砚属于随身私人工具，砚池中的朱砂残留说明其主人曾做过标记或打过底稿。`,
  },
  {
    id: 'ch2_voice',
    chapter: 2,
    unlock: ({ progress }) => Boolean(progress.heardVoice),
    content: `【水面回声】
小飞虹桥下浮现“知我者，唯有此园”。这句话暗示留下痕迹的人将园林本身视为理解者；她的观看未被正式记录，但园林空间保留了她的视角线索。`,
  },
  {
    id: 'ch2_workshop_method',
    chapter: 2,
    unlock: ({ progress, sceneState, chapterScene }) => Boolean(progress.chapter2Complete || progress.chapter2_completed) || sceneState === 'chapter2-workshop' || chapterScene === 'chapter2-workshop',
    content: `【第二章章末方法】
第二章章末的关键不是立刻确定“另一个人”是谁，而是把文本异文、旧批注和朱砂材料证据放在同一条证据链上。若文字说“画非一人”，材料证据就要继续追问：谁有能力、工具和理由留下这些痕迹。`,
  },
  {
    id: 'ch3_entry_scope',
    chapter: 3,
    unlock: ({ chapter, progress }) => chapter >= 3 || Boolean(progress.chapter2Complete || progress.chapter2_completed),
    content: `【第三章记录范围】
进入第三章后，修复笔记本可以引用此前已经记录的断簪“蘅”字、题诗异文“画非一人”、旧批注、残砚朱砂和水面回声。第三章的新痕迹仍须玩家亲自发现后才可查阅；在信件出现前，不能提前确认完整身份与动机。`,
  },
  {
    id: 'ch3_yuanyang_observation',
    chapter: 3,
    unlock: ({ chapter, sceneState, chapterScene }) => chapter >= 3 && (chapterScene === 'chapter3-paint' || ['yuanyang_south', 'yuanyang_north'].includes(sceneState)),
    content: `【鸳鸯馆观察批注】
鸳鸯馆阶段先不要急于寻找署名，应观察画纸、墙面、隔扇和视线高度。若痕迹反复出现在低处、偏处或非正式位置，它们更可能属于观看方法和练习过程，而不是正式题跋。`,
  },
  {
    id: 'ch3_scattered_sketches',
    chapter: 3,
    unlock: ({ progress }) => Boolean(progress.seenScatteredSketches),
    content: `【散落画纸】
北厅散落的画纸显示出反复试画和修正的痕迹，重点不在单张画是否完整，而在这些草稿共同证明有人持续练习一种不合常规的观看位置。它们不是正式成稿，却能说明观看方式的形成过程。`,
  },
  {
    id: 'ch3_bleeding_text',
    chapter: 3,
    unlock: ({ progress }) => Boolean(progress.seenBleedingText),
    content: `【渗字“看得到吗”】
“看得到吗”三个字像是被压在纸层或时间下面的询问。它不要求立刻回答身份问题，而是在提醒后来者：这些痕迹真正想确认的是“是否被看见”。`,
  },
  {
    id: 'ch3_wall_hidden_lines',
    chapter: 3,
    unlock: ({ progress, sceneState }) => Boolean(progress.redLinesRevealed || progress.sketchRevealed || progress.hasRubbing) || sceneState === 'liutingge',
    content: `【留听阁封墙线条】
留听阁墙面下的弧线与刻痕不像随手划痕，更像曾被覆盖的图形痕迹。若只看墙面表层会觉得无事发生，继续追踪材料反应和线条走向，才能判断它是否属于被压住的底层草图。`,
  },
  {
    id: 'ch3_red_lines',
    chapter: 3,
    unlock: ({ progress }) => Boolean(progress.redLinesRevealed),
    content: `【朱砂线显现】
墙面下显出的朱砂线与第二章残砚中的朱砂残留形成材料呼应。朱砂可用于底稿线和定位标记；当同类材料在不同地点互相指认时，它比单独一句文字更接近物质证据。`,
  },
  {
    id: 'ch3_sketch_revealed',
    chapter: 3,
    unlock: ({ progress }) => Boolean(progress.sketchRevealed || progress.hasRubbing),
    content: `【低位视角草图】
留听阁墙面的低位视角草图说明，留下痕迹的人不只是偶然看见，而是有能力把低而偏的观看位置转化为稳定图像。草图拓片可以作为空间观看能力的证据，但它仍需和断簪、异文、批注等线索合读。`,
  },
  {
    id: 'ch3_not_painter',
    chapter: 3,
    unlock: ({ progress }) => Boolean(progress.understoodNotPainter),
    content: `【“不是画工”的判断】
第三章的关键判断不是把留下痕迹的人简单归为画工，而是承认她可能参与了观看、定位、草图和证据留下的过程。正式成稿可以出自文徵明之笔，但观看来源未必只属于正式作者。`,
  },
  {
    id: 'ch3_letter_wangheng',
    chapter: 3,
    unlock: ({ progress }) => Boolean(progress.hasLetter),
    content: `【王蘅的信】
信中“不必有名，不必有形。只要有痕迹。”说明王蘅的核心动机不是争夺署名，也不是要求后人替她正名，而是希望自己的观看曾经存在这件事被确认。此后可以把王蘅理解为这些来源痕迹背后的私人观看者。`,
  },
  {
    id: 'ch3_plaque_recognition',
    chapter: 3,
    unlock: ({ progress }) => Boolean(progress.plaqueRecognized),
    content: `【匾额追认】
兰雪堂匾额多出的一笔、断簪上的“蘅”字和墙面题字可以被放在同一条笔迹与私人标记链条里理解。它们不是公开署名，而是分散在正式体系边缘的互相追认。`,
  },
  {
    id: 'ch3_workshop_summary',
    chapter: 3,
    unlock: ({ progress, sceneState, chapterScene }) => Boolean(progress.chapter3Complete || progress.chapter3_completed || progress.ch3DiscussionDone) || sceneState === 'chapter3-workshop' || chapterScene === 'chapter3-workshop',
    content: `【第三章章末整理】
第三章之后，证据链已经从“异常痕迹”推进到“观看来源”：断簪提供私人标记，异文提示非一人，旧批注说明遮蔽方式，残砚和朱砂线提供材料联系，草图拓片和信件说明王蘅的观看能力与动机。下一步应回到第三十一景，判断正式画心如何保存了她的眼睛。`,
  },
];

const GATE_TARGETS = {
  gate_prologue_margin: {
    target: '引导玩家理解：装裱接缝说明边缘可能被二次处理，旧题签或边缘信息被遮盖。',
    forbidden: '不要说画心是假的，不要说王蘅，不要透露后续章节。',
  },
  gate_prologue_text: {
    target: '引导玩家理解：“……所见”可能是被压住或裁切后的边注残片，和观看记录有关。',
    forbidden: '不要说这是署名，不要说具体是谁所见，不要透露王蘅。',
  },
  gate_prologue_line: {
    target: '引导玩家先把底层细线视为异常痕迹；只能提示它不同于裂纹和装裱折痕，不能提前定性为低位视角来源。',
    forbidden: '不要说出最终用途，不要说王蘅，不要替玩家完成终章结论。',
  },
  gate_prologue_synthesis: {
    target: '引导玩家综合三条线索，理解有人系统性地遮蔽了来源说明或证据痕迹。',
    forbidden: '不要说王蘅，不要透露画中世界，不要说具体是谁做的，不要说有失踪画作。',
  },
};

if (!API_KEY) {
  console.warn('[server] 警告：未配置 DEEPSEEK_API_KEY，AI 接口将返回 503');
}

function normalizeContext(body = {}) {
  const ctx = body.context || body.ctx || {};
  const progress = body.progress || ctx.progress || {};
  const cluesFound = new Set(Array.isArray(progress.cluesFound) ? progress.cluesFound : []);

  return {
    chapter: Number(body.chapter ?? ctx.chapter ?? progress.chapter ?? 0),
    world: body.world || ctx.world || 'real',
    sceneState: body.sceneState || ctx.sceneState || '',
    chapterScene: body.chapterScene || ctx.chapterScene || '',
    hairpinIdentified: Boolean(body.hairpinIdentified ?? ctx.hairpinIdentified),
    isFlipped: Boolean(body.isFlipped ?? ctx.isFlipped),
    isPresetQuestion: Boolean(body.isPresetQuestion ?? ctx.isPresetQuestion),
    presetSource: body.presetSource || ctx.presetSource || '',
    items: Array.isArray(body.items) ? body.items : Array.isArray(ctx.items) ? ctx.items : [],
    annotations: Array.isArray(ctx.annotations) ? ctx.annotations : [],
    progress,
    cluesFound,
  };
}

function getAvailableKnowledge(ctx) {
  const knowledge = NOTEBOOK_KNOWLEDGE.filter((snippet) => {
    if (snippet.chapter > ctx.chapter) return false;
    return snippet.unlock(ctx);
  });
  if (ctx.isPresetQuestion) {
    knowledge.push({
      id: 'preset_question_guidance',
      chapter: ctx.chapter,
      content: `【预设问题作答方式】
预设问题是周老师批注引导玩家梳理已见痕迹的入口。即使其中出现“谁”“有什么关系”“是什么意思”等问法，也不必给出确定答案；应先解释这个问题指向的观察层次，例如字迹、材料、视角、装裱、题诗、草图或私人标记，再说明目前笔记本中尚无更明确的身份指向或结论记录。`,
    });
  }
  return knowledge;
}

function formatKnowledge(snippets) {
  if (!snippets.length) return '（暂无已解锁资料）';
  return snippets.map((snippet) => `# ${snippet.id}\n${snippet.content}`).join('\n\n---\n\n');
}

function getChapterLabel(chapter) {
  const labels = {
    0: '序章·残页',
    1: '第一章·东园',
    2: '第二章·中园',
    3: '第三章·西园',
    4: '终章·第三十一景',
  };
  return labels[chapter] || `第${chapter}章`;
}

function formatContextSummary(ctx) {
  const itemNames = ctx.items.map((item) => item.name).filter(Boolean).join('、') || '无';
  const clues = Array.from(ctx.cluesFound).join('、') || '无';
  const progressFlags = Object.entries(ctx.progress)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .join('、') || '无';

  return [
    `当前章节：${getChapterLabel(ctx.chapter)}`,
    `当前世界：${ctx.world === 'paint' ? '画中世界' : '现实世界'}`,
    `当前子场景：${ctx.sceneState || '无'}`,
    `断簪倒影已辨认：${ctx.hairpinIdentified ? '是' : '否'}`,
    `水面已翻转：${ctx.isFlipped ? '是' : '否'}`,
    `已收集物件：${itemNames}`,
    `已发现线索：${clues}`,
    `已完成标记：${progressFlags}`,
  ].join('\n');
}

function getChapterBoundary(ctx) {
  if (ctx.chapter <= 0) {
    return '序章阶段不得透露“王蘅”、画中世界细节、终章真相，也不得暗示存在一幅失踪的画。';
  }
  if (ctx.chapter === 1) {
    return '第一章阶段不得透露第二章、第三章、终章真相；不得确认“蘅”字背后的具体人物；不得暗示存在一幅失踪的画。';
  }
  if (ctx.chapter === 2) {
    return '第二章阶段可以讨论“画非一人”、旧批注和朱砂材料证据，但不得确认王蘅完整身份、第三章信件内容或终章真相；不得暗示存在一幅失踪的画。';
  }
  if (ctx.chapter === 3) {
    return '第三章阶段只能在玩家已发现信件后确认王蘅相关内容；不得提前给出终章完整结论，不得替玩家断言最终立场或结局选择。';
  }
  return '终章阶段只能基于已收集证据回顾，不新增线索，不替玩家选择结局。';
}

function buildNotebookSystemPrompt({ mode, gateId, systemHint, ctx, knowledgeText }) {
  const gate = GATE_TARGETS[gateId] || null;
  const isDiscussion = mode === 'discussion' || mode === 'synthesis';
  const chapterBoundary = getChapterBoundary(ctx);
  const presetQuestionRule = ctx.isPresetQuestion
    ? `【预设问题规则】
本轮玩家点击的是游戏预先设计的笔记本问题，不是自由追问。必须给出“周老师批注：”开头的可用分析，不要只回复“翻了翻，没有找到相关记录”。
如果问题提到尚未明确解锁的身份、后续章节或最终结论，只能分析当前已发现痕迹的可能含义，并用“目前笔记本中还没有更明确的记录/身份指向/结论记录”一类句子收束。
仍然不得生成新剧情、不得补充未写入笔记本的事实、不得提前确认后续真相。`
    : '';

  return `你是沈念的修复笔记本，只能呈现周老师过去预先写下的批注、摘录和资料。
你不是实时对话对象，不能根据玩家的问题临场推理出新剧情或新证据。

所有回复必须以“周老师批注：”开头。
不要写动作描写，不要写“页面上出现”“字迹浮现”“沈念看到”等描述。
不要说“你刚才提到”“我看到”“我认为”等实时对话措辞。

${isDiscussion ? `当前是研讨或线索讨论。周老师预写批注的引导目标：${gate?.target || '引导玩家回到已发现证据。'}
绝对不可透露：${gate?.forbidden || '不要透露后续章节、王蘅或最终真相。'}` : '当前是普通笔记本查阅。回答必须像翻阅周老师预先留下的资料或批注。'}

【通用修复知识 · 笔记本中已有的基础资料，任何时候都可回答】
- 放大镜用途：观察边缘压痕、细小残字、笔触断续、纸面起伏和装裱交界处异常。
- 侧光照射用途：观察纸面凹凸、压痕、底层痕迹、装裱层下的隐约字迹或线痕。
- 纸质分析用途：判断纸张、背纸、纤维、重装痕迹和材料差异。
- 装裱、画心、题签、边注、题跋、册页等基础概念。
- 古画修复中的观察顺序：先观察，再记录；先区分画心、装裱、题跋、边注等层次，再判断证据关系。
- 画作与照片或现实园林不一致时的基础判断：先考虑视角、季节、画法、版本、修复和装裱差异，不直接判断为剧情真相。

【当前已解锁剧情知识 · 涉及剧情线索时只能基于以下内容回答】
${knowledgeText}

【当前进度摘要 · 只用于判断上下文，不可当作新资料扩写】
${formatContextSummary(ctx)}

${presetQuestionRule}

【回答规则】
1. 如果问题属于【通用修复知识】，可以回答，并仍以“周老师批注：”开头。
2. 如果问题涉及剧情线索，只能基于【当前已解锁剧情知识】回答。
3. 如果不是预设问题，且问题涉及未发现线索、后续章节、王蘅身份、最终真相，必须回复：“周老师批注：翻了翻，没有找到相关记录。”
4. 如果不是预设问题，且问题无法在【通用修复知识】或【当前已解锁剧情知识】中找到依据，也必须回复：“周老师批注：翻了翻，没有找到相关记录。”
5. 如果是预设问题，不得直接拒答；在不透露新事实的前提下，围绕已解锁资料解释它为什么值得注意，并指出目前笔记本中没有更明确记录。
6. 不生成新剧情，不补充未写入笔记本的内容，不改变谜题答案，不决定结局。
7. ${chapterBoundary}
8. 回复 1-3 句话，中文，克制；必须使用完整句子收束，不要在半句中结束。
${systemHint ? `\n【本次系统提示】\n${systemHint}` : ''}`;
}

function buildPresetQuestionFallback(message) {
  const text = String(message || '').trim();

  if (text.includes('三景同入一眼')) {
    return '周老师批注：这句话可以先按观看方法理解，重点不在三处景物本身，而在它们如何被同一个低而偏的视线同时组织起来。目前笔记本中还没有更明确的结论记录。';
  }
  if (text.includes('第三十一景') || text.includes('低位视角')) {
    return '周老师批注：低位视角提示的是一种不合常规的观看位置，第三十一景也存在构图视角上的异常；两者可以先并排观察，但目前笔记本中还没有更明确的直接对应记录。';
  }
  if (text.includes('看得到吗')) {
    return '周老师批注：“看得到吗”更像是在确认这些痕迹是否终于被后来者看见，而不是要求立刻说出一个身份答案。目前笔记本中还没有更明确的身份指向记录。';
  }
  if (text.includes('谁写') || text.includes('谁留下') || text.includes('问谁') || text.includes('是谁')) {
    return '周老师批注：这个问题可以先从字迹位置、材料痕迹和它出现的场景来分析；它指向某个留下痕迹的人，但目前笔记本中还没有更明确的身份记录。';
  }
  if (text.includes('草图')) {
    return '周老师批注：草图不像正式题跋，更像观看方法和构图练习留下的痕迹。它值得保留为证据，但目前笔记本中还没有更明确的结论记录。';
  }
  if (text.includes('蘅')) {
    return '周老师批注：“蘅”可以先作为私人标记来读，它和断簪、题字或笔画之间的关系需要继续互证。目前笔记本中还没有更明确的身份指向记录。';
  }

  return '周老师批注：这个问题可以先作为线索关系来分析，重点看它牵涉的是字迹、材料、视角、装裱还是题诗。就目前笔记本记录而言，还没有更明确的结论。';
}

function normalizeNotebookReply(content, { isPresetQuestion = false, message = '' } = {}) {
  const fallback = '周老师批注：翻了翻，没有找到相关记录。';
  const text = String(content || '').trim();
  if (!text) return isPresetQuestion ? buildPresetQuestionFallback(message) : fallback;

  const emptyPrefixPattern = /^周老师批注[:：]\s*$/;
  if (emptyPrefixPattern.test(text)) return isPresetQuestion ? buildPresetQuestionFallback(message) : fallback;
  if (isPresetQuestion && /没有找到相关记录/.test(text)) {
    return buildPresetQuestionFallback(message);
  }

  if (!text.startsWith('周老师批注：')) {
    return `周老师批注：${text.replace(/^周老师批注[:：]\s*/, '')}`;
  }

  return text;
}

async function callDeepSeek(messages, options = {}) {
  const upstream = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.max_tokens ?? 300,
      stream: false,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error('[server] 上游错误:', upstream.status, errText);
    const err = new Error('上游 API 调用失败');
    err.status = upstream.status;
    throw err;
  }

  const data = await upstream.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/* ---- 健康检查 ---- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, configured: Boolean(API_KEY), model: MODEL });
});

/* ---- 修复笔记本语义接口 ---- */
app.post('/api/notebook/message', chatLimiter, async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({ error: 'API Key 未配置' });
  }

  const {
    message = '',
    mode = 'query',
    gateId = '',
    history = [],
    systemHint = '',
    temperature,
    max_tokens,
  } = req.body || {};

  const userMessage = String(message || '').trim();
  if (!userMessage && (!Array.isArray(history) || history.length === 0)) {
    return res.status(400).json({ error: 'message 不能为空' });
  }

  const ctx = normalizeContext(req.body);
  const knowledge = getAvailableKnowledge(ctx);
  const systemPrompt = buildNotebookSystemPrompt({
    mode,
    gateId,
    systemHint,
    ctx,
    knowledgeText: formatKnowledge(knowledge),
  });

  const safeHistory = Array.isArray(history)
    ? history
      .filter((entry) => ['user', 'assistant'].includes(entry?.role) && typeof entry.content === 'string')
      .slice(-8)
    : [];

  const hasLatestMessage = safeHistory.some((entry) => entry.role === 'user' && entry.content === userMessage);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...safeHistory,
  ];
  if (userMessage && !hasLatestMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  try {
    const content = await callDeepSeek(messages, {
      temperature: temperature ?? (mode === 'query' ? 0.45 : 0.65),
      max_tokens: max_tokens ?? (mode === 'query' ? 360 : 360),
    });
    res.json({
      content: normalizeNotebookReply(content, {
        isPresetQuestion: ctx.isPresetQuestion,
        message: userMessage,
      }),
      knowledgeIds: knowledge.map((snippet) => snippet.id),
      model: MODEL,
    });
  } catch (err) {
    res.status(502).json({ error: err.message || '上游 API 调用失败', status: err.status || 500 });
  }
});

/* ---- 对话转发 ---- */
app.post('/api/chat', chatLimiter, async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({ error: 'API Key 未配置' });
  }

  const { messages, temperature, max_tokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages 不能为空' });
  }

  try {
    const content = await callDeepSeek(messages, { temperature, max_tokens });
    res.json({ content });
  } catch (err) {
    console.error('[server] 请求异常:', err);
    res.status(500).json({ error: err.message || '服务器内部错误' });
  }
});

/* ---- SPA 回退：所有非 API 路由返回 index.html ---- */
app.get('*', (req, res, next) => {
  // API 路由不拦截，留给 Express 路由处理（如果没命中就是 404）
  if (req.path.startsWith('/api')) return next();

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('前端未构建。请先运行: cd Web && npm run build');
  }
});

app.listen(PORT, () => {
  console.log(`[server] 一体化服务已启动 → http://localhost:${PORT}`);
  console.log(`[server] 模型: ${MODEL} | API Key: ${API_KEY ? '已配置' : '未配置'}`);
});
