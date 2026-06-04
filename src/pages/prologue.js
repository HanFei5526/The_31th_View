/**
 * 《卅一景》序章 — 残页
 *
 * 场景设定：古画修复工作室，白天
 * 主角周鹤年在修复一幅明代园林画时，发现了隐藏的第三十一景……
 *
 * 流程：
 *   1. 章节标题淡入淡出「序章 · 残页」
 *   2. 旁白引子依次显示
 *   3. 热点交互：点击修复台上的古画碎片、放大镜、笔记本
 *   4. 触发对话
 *   5. 章节完成 → 自动保存 → 返回菜单
 */

import GameSceneBase from './game-scene.js';
import prologueBg from '../../图片/prologue_bg.png';

/** 序章旁白文本（占位） */
const NARRATIONS_INTRO = [
  '苏州博物馆，古画修复室。',
  '周鹤年已经在这间屋子里工作了十二年。每天的日程几乎一成不变——戴上手套，打开冷光灯，然后和一幅幅残破的古画对坐。',
  '今天送来的是一幅明代园林画——拙政园全景长卷，绢本设色，保存状况糟糕。',
  '他小心地展开画卷，逐寸检查断裂与剥落的痕迹。',
  '然而……在画卷的最末端，他发现了异样。',
];

const NARRATIONS_DISCOVERY = [
  '画面的最后一段，原本应该是画家的落款与钤印。',
  '可是这里……有一层覆盖。仿佛有人刻意在原画之上，又覆了一层薄绢。',
  '他拿起放大镜，凑近那个位置。透过覆盖的薄绢，依稀能看到底层隐藏着什么。',
  '那是……第三十一景？',
  '拙政园的历代图录中，从没有记载过"第三十一景"的存在。',
];

export default class PrologueScene extends GameSceneBase {
  constructor(engine) {
    super(engine);
    this._phase = 0; // 当前场景阶段
  }

  /* ==================== 生命周期 ==================== */

  async enter(container) {
    const root = this._buildSceneShell({
      bgImage: prologueBg,
      theme: 'light',
      chapterTitle: '序章',
      chapterSubtitle: '残页',
    });

    container.innerHTML = '';
    container.appendChild(root);

    // 1. 章节标题动画
    await this._showChapterTitle(2500);

    // 2. 第一段旁白
    await this._showNarrationSequence(NARRATIONS_INTRO);
    this._hideNarration();

    // 3. 显示交互热点
    await this._showExplorationPhase();
  }

  /* ==================== 探索阶段 ==================== */

  async _showExplorationPhase() {
    // 短暂停顿后显示热点
    await this._delay(500);

    // 添加示例热点
    this._addHotspot({
      id: 'scroll',
      x: '38%',
      y: '45%',
      w: '180px',
      h: '100px',
      label: '画卷残片',
      onClick: () => this._onScrollClick(),
    });

    this._addHotspot({
      id: 'magnifier',
      x: '62%',
      y: '50%',
      w: '80px',
      h: '80px',
      label: '放大镜',
      onClick: () => this._onMagnifierClick(),
    });

    this._addHotspot({
      id: 'notebook',
      x: '20%',
      y: '55%',
      w: '100px',
      h: '70px',
      label: '修复笔记',
      onClick: () => this._onNotebookClick(),
    });

    // 提示玩家可以探索
    await this._showNarration('（点击场景中发光的区域来探索……）');
    this._hideNarration();
  }

  /* ==================== 热点回调 ==================== */

  async _onScrollClick() {
    this._clearHotspots();

    // 发现旁白
    await this._showNarrationSequence(NARRATIONS_DISCOVERY);
    this._hideNarration();

    // 标记进度并保存
    this.engine.gameProgress.prologue = true;
    this.engine.gameProgress.chapter1 = true; // 解锁第一章
    this.engine.saveProgress();

    // 短暂停顿后显示完成提示
    await this._delay(800);
    await this._showNarration('序章完成。第一章已解锁。');
    this._hideNarration();

    // 返回菜单
    await this._delay(500);
    this._root.classList.add('game-scene--exiting');
    setTimeout(() => this.engine.switchScene('menu'), 600);
  }

  async _onMagnifierClick() {
    await this._showNarration('一柄老式铜框放大镜，镜片擦拭得一尘不染。这是周鹤年最常用的工具。');
    this._hideNarration();
  }

  async _onNotebookClick() {
    await this._showNarration('笔记本上密密麻麻记满了修复记录。最后一页写着：「绢面覆层异常，待进一步检测。」');

    // 收集物品
    this.engine.collectItem({
      id: 'notebook',
      name: '修复笔记本',
      description: '周鹤年随身携带的笔记本，记录着修复过程中的种种发现。',
      icon: '📓',
    });

    this._hideNarration();
  }

  /* ==================== 工具方法 ==================== */

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
