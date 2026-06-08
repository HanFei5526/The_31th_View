/**
 * 第一章 · 东园 — 画中世界（UI 占位框架）
 *
 * 基于 GameSceneBase 的完整 UI 占位场景。
 * 后续逐步替换为：兰雪堂探索 → 芙蓉榭倒影谜题 → 断簪收集。
 */

import GameSceneBase from './game-scene.js';

/** 占位背景（用暗色渐变覆盖，不依赖具体图片资源） */
const CHAPTER1_BG = '/images/menu-gate.png';

/** 第一章占位旁白文本（取自剧情文档） */
const NARRATION_LINES = [
  '你睁开眼。',
  '脚下是青石板路，两侧翠竹如墙。',
  '空气中有一股说不出的香——不是花香，更像是旧纸和松烟墨混在一起的味道。',
  '前方是一座敞厅，匾额上写着三个字——「兰雪堂」。',
  '你知道这个名字。它是拙政园东部的入口建筑。',
  '但面前这座并非你在现实中见过的样子，它更旧，更轻，像一笔还没有干透的线。',
  '你站在一幅五百年前的画里。',
  '（第一章画中世界正在搭建中……）',
];

export default class Chapter1PaintScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
  }

  async enter(container) {
    const root = this._buildSceneShell({
      bgImage: CHAPTER1_BG,
      theme: 'dark',
      chapterTitle: '第一章',
      chapterSubtitle: '东园 · 兰雪堂至芙蓉榭',
    });

    container.innerHTML = '';
    container.appendChild(root);

    // 用暗色渐变覆盖背景，避免占位图片破坏画中世界氛围
    const bgEl = root.querySelector('.gs-bg');
    if (bgEl) {
      bgEl.style.background =
        'linear-gradient(160deg, #0f0c08 0%, #1a1510 30%, #2d2418 60%, #1e1812 100%)';
    }

    // 1. 章节标题淡入 → 停留 → 淡出
    await this._showChapterTitle(3000);

    // 2. 逐条播放旁白（打字机效果，点击继续）
    await this._showNarrationSequence(NARRATION_LINES);

    // 3. 添加占位热点：兰雪堂探索点
    this._addHotspot({
      id: 'lanxuetang',
      x: '50%',
      y: '40%',
      w: '140px',
      h: '100px',
      label: '兰雪堂（即将开放）',
      onClick: () => {
        this._showNarration(
          '匾额写着「兰雪堂」三字，落款是文徵明。但你盯着看了一会儿，总觉得哪里不对……（此区域即将开放）'
        );
      },
    });

    // 4. 添加占位热点：返回章节目录
    this._addHotspot({
      id: 'back-to-menu',
      x: '50%',
      y: '88%',
      w: '160px',
      h: '48px',
      label: '返回章节目录',
      onClick: () => {
        this._root.classList.add('game-scene--exiting');
        setTimeout(() => this.engine.switchScene('menu'), 600);
      },
    });
  }
}
