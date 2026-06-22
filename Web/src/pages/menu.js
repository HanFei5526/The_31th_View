const bgImage = '/images/common/menu-bg.png';

/**
 * 《卅一景》 — 主菜单 / Main Menu
 *
 * 古典卷轴式菜单设计：
 * - 宣纸暖色背景 + subtle 纹理
 * - 中央卷轴面板展开效果
 * - 章节列表如书页排列
 * - 已解锁章节带朱砂印章标记
 * - 底部「开始游戏」主按钮
 */

/** 章节配置数据 */
const CHAPTERS = [
  {
    id: 'prologue',
    scene: 'prologue',
    name: '序章',
    subtitle: '残页',
    tagline: '画心完美，边缘却在讲另一件事。',
    unlockKey: 'prologue',
    alwaysUnlocked: true,
  },
  {
    id: 'chapter1',
    scene: 'chapter1',
    name: '第一章',
    subtitle: '东园 · 兰雪堂至芙蓉榭',
    tagline: '虚处，有时比实处藏着更多。',
    unlockKey: 'chapter1',
    alwaysUnlocked: false,
  },
  {
    id: 'chapter2',
    scene: 'chapter2',
    name: '第二章',
    subtitle: '中园 · 远香堂至小飞虹',
    tagline: '读过的字，未必是最初写下的那个。',
    unlockKey: 'chapter2',
    alwaysUnlocked: false,
  },
  {
    id: 'chapter3',
    scene: 'chapter3',
    name: '第三章',
    subtitle: '西园 · 卅六鸳鸯馆至留听阁',
    tagline: '不是消失了。是被封住了。',
    unlockKey: 'chapter3',
    alwaysUnlocked: false,
  },
  {
    id: 'finale',
    scene: 'finale',
    name: '终章',
    subtitle: '第三十一景',
    tagline: '还差最后一笔。怎么落，由你决定。',
    unlockKey: 'finale',
    alwaysUnlocked: false,
  },
];

export default class MenuScene {
  constructor(gameEngine) {
    this.engine = gameEngine;
    this._styleEl = null;
    this._transitionTimers = [];
    this._transitionKeyHandler = null;
    this._transitionOverlay = null;
    this._fullscreenHandler = null;
  }

  /* ==================== 生命周期 ==================== */

  enter(container) {
    this._injectStyles();
    this._hydrateRuntimeFromSaveIfEmpty();
    container.innerHTML = '';
    container.appendChild(this._buildDOM());
  }

  exit() {
    if (this._styleEl) this._styleEl.remove();
    this._clearIntroTransition();
    if (this._fullscreenHandler) {
      document.removeEventListener('fullscreenchange', this._fullscreenHandler);
      this._fullscreenHandler = null;
    }
  }

  /* ==================== DOM 构建 ==================== */

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'menu-scene';

    const hasSave = this._hasSaveData();
    const progress = this._getProgress();

    root.innerHTML = `
      <!-- SVG Filter for Torn Paper Effect -->
      <svg width="0" height="0" style="position: absolute; pointer-events: none;">
        <defs>
          <filter id="paper-tear" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feDropShadow dx="4" dy="8" stdDeviation="8" flood-color="rgba(44,36,22,0.4)" />
          </filter>
        </defs>
      </svg>

      <!-- 背景装饰 -->
      <div class="menu-bg">
        <div class="menu-mask"></div>
        <div class="menu-bg-mountain"></div>
        <div class="menu-bg-mist"></div>
      </div>

      <!-- 返回按钮 -->
      <button class="menu-back" id="btn-back">
        <span>返回</span>
      </button>

      <!-- 全屏按钮 -->
      <button class="menu-fullscreen-btn" id="menu-fullscreen" title="网页全屏">⤢</button>

      <!-- 主面板 -->
      <div class="menu-panel">
        <!-- 内容区 -->
        <div class="menu-content">
          <!-- 标题区 -->
          <header class="menu-header">
            <div class="menu-header-ink"></div>
            <h1 class="menu-title">卅一景</h1>
            <p class="menu-subtitle">选择你要进入的章节</p>
          </header>

          <!-- 章节列表 -->
          <nav class="chapter-list" aria-label="章节列表">
            ${CHAPTERS.map((ch, i) => {
              const unlocked = this._isChapterUnlocked(ch);
              const completed = progress[ch.unlockKey + '_completed'] || progress[ch.unlockKey + 'Complete'];
              const parts = ch.subtitle.split(' · ');
              const mainSubtitle = parts[0];
              return `
              <div class="chapter-item ${unlocked ? 'chapter-item--unlocked' : 'chapter-item--locked'}"
                   data-scene="${ch.scene}"
                   ${!unlocked ? 'data-locked="true"' : ''}
                   style="--delay: ${i * 0.1}s">
                <div class="chapter-info">
                  <div class="chapter-header">
                    <span class="chapter-name">${ch.name}</span>
                    <span class="chapter-sep">·</span>
                    <span class="chapter-subtitle">${mainSubtitle}</span>
                  </div>
                  <p class="chapter-tagline">${ch.tagline}</p>
                </div>
                <div class="chapter-side">
                  <div class="chapter-marker">
                    ${(() => {
                      const num = String(i + 1).padStart(2, '0');
                      if (completed) return '<div class="seal seal--done">已阅</div>';
                      if (unlocked) return '<div class="chapter-num">' + num + '</div>';
                      return '<div class="chapter-num chapter-num--dim">' + num + '</div>';
                    })()}
                  </div>
                  <div class="chapter-status-icon">
                    ${!unlocked ? `
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                      </svg>
                    ` : `
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="chapter-arrow">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    `}
                  </div>
                </div>
                <div class="chapter-ink-hover"></div>
              </div>`;
            }).join('')}
          </nav>

        </div>
      </div>

      <!-- 底部全局操作 -->
      <footer class="menu-footer-global">
        <button class="action-btn ${hasSave ? 'action-btn--secondary' : 'action-btn--primary'}" id="btn-new">
          ${hasSave ? '重新开始' : '新的旅程'}
        </button>
        <button class="action-btn ${hasSave ? 'action-btn--primary' : 'action-btn--secondary'}" id="btn-continue" ${hasSave ? '' : 'disabled'}>
          继续游戏
        </button>

      </footer>
    `;

    // === 绑定事件 ===

    // 返回
    root.querySelector('#btn-back').addEventListener('click', () => {
      root.classList.add('menu-scene--exiting');
      setTimeout(() => this.engine.switchScene('landing'), 1500);
    });

    // 新游戏
    root.querySelector('#btn-new').addEventListener('click', () => {
      this._startNewGame(root);
    });

    // 继续
    const continueBtn = root.querySelector('#btn-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this._continueGame(root);
      });
    }

    this._bindFullscreenButton(root);

    // 章节点击
    root.querySelectorAll('.chapter-item--unlocked').forEach((item) => {
      item.addEventListener('click', () => {
        const scene = item.dataset.scene;
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this._transitionToSceneWithOverlay(root, scene);
        }, 200);
      });
    });

    // 锁定章节提示
    root.querySelectorAll('.chapter-item--locked').forEach((item) => {
      item.addEventListener('click', () => {
        item.classList.add('shake');
        setTimeout(() => item.classList.remove('shake'), 400);
      });
    });

    return root;
  }

  _bindFullscreenButton(root) {
    const fsBtn = root.querySelector('#menu-fullscreen');
    if (!fsBtn) return;

    const syncFullscreenState = () => {
      if (document.fullscreenElement) {
        fsBtn.textContent = '⤡';
        fsBtn.title = '退出全屏';
      } else {
        fsBtn.textContent = '⤢';
        fsBtn.title = '网页全屏';
      }
    };

    syncFullscreenState();

    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        const request = document.documentElement.requestFullscreen?.();
        request?.catch?.(() => {});
      } else {
        document.exitFullscreen?.();
      }
    });

    this._fullscreenHandler = syncFullscreenState;
    document.addEventListener('fullscreenchange', this._fullscreenHandler);
  }

  /* ==================== 操作方法 ==================== */

  _startNewGame(root) {
    if (this.engine.saveSystem?.clear) {
      this.engine.saveSystem.clear();
    }
    this.engine.gameProgress = {};
    this.engine.inventory.items = [];
    this.engine.notebookRecords = [];
    this.engine.notebookChatsByChapter = {};
    this.engine.currentChapter = 0;
    this.engine.currentCheckpointId = null;
    this.engine.currentWorld = 'real';
    this._transitionToSceneWithOverlay(root, 'prologue');
  }

  _continueGame(root) {
    const save = this.engine.saveSystem?.load?.();
    if (save) {
      this.engine.restoreFromSave?.(save);
    }
    const lastScene = this._getContinueScene(save);
    this._transitionToSceneWithOverlay(root, lastScene);
  }

  _hydrateRuntimeFromSaveIfEmpty() {
    const hasRuntimeState =
      Object.keys(this.engine.gameProgress || {}).length > 0 ||
      this.engine.inventory?.getItems?.().length > 0 ||
      (this.engine.notebookRecords || []).length > 0 ||
      Object.keys(this.engine.notebookChatsByChapter || {}).length > 0;

    if (hasRuntimeState) return;
    const save = this.engine.saveSystem?.load?.();
    if (save) {
      this.engine.restoreFromSave?.(save);
    }
  }

  /* ==================== 辅助方法 ==================== */

  _transitionToSceneWithOverlay(root, scene) {
    this._clearIntroTransition();
    
    // 仅序章（prologue）保留原有的黄色开场引言过场
    if (scene === 'prologue') {
      const overlay = document.createElement('div');
      overlay.className = 'intro-transition-overlay intro-transition-overlay--prologue';
      this._transitionOverlay = overlay;
      
      const titleStr = '序章 · 残页';
      const lines = [
        "美术学院旧楼三层，导师的修复工作室。",
        "操作台上，一页泛黄的册页正在被逐寸扫描。",
        "这是第三十一景——整册中唯一没有任何修补痕迹的一页。",
        "没有修补痕迹，在五百年的册页上，意味着什么？"
      ];

      overlay.innerHTML = `
        <div class="prologue-transition-layout">
          <div class="intro-prologue-title">${titleStr}</div>
          <div class="intro-prologue-text" id="intro-prologue-text"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const textContainer = overlay.querySelector('#intro-prologue-text');
      let finished = false;

      const finish = (fast = false) => {
        if (finished) return;
        finished = true;
        this._clearTransitionTimers();
        document.removeEventListener('keydown', this._transitionKeyHandler);
        this._transitionKeyHandler = null;

        textContainer.querySelectorAll('span').forEach((p) => {
          p.style.opacity = '1';
          p.style.transform = 'translateY(0)';
        });

        if (this._transitionOverlay === overlay) {
          this._transitionOverlay = null;
        }

        this.engine.switchScene(scene, true);

        if (fast) {
          overlay.style.transition = 'opacity 0.4s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 450);
        } else {
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 3000);
        }
      };

      this._transitionKeyHandler = (e) => {
        if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
        e.preventDefault();
        finish(true);
      };
      document.addEventListener('keydown', this._transitionKeyHandler);

      this._transitionTimers.push(setTimeout(() => {
        overlay.classList.add('active');
        const title = overlay.querySelector('.intro-prologue-title');
        if (title) {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        }
      }, 50));

      root.classList.add('menu-scene--exiting-slow');

      textContainer.innerHTML = '';

      this._transitionTimers.push(setTimeout(() => {
        lines.forEach((line, index) => {
          const p = document.createElement('span');
          p.textContent = line;
          p.style.opacity = '0';
          p.style.transform = 'translateY(15px)';
          p.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
          p.style.display = 'block';
          textContainer.appendChild(p);

          this._transitionTimers.push(setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, index * 1200));
        });

        const totalDuration = (lines.length - 1) * 1200 + 1200 + 3000;
        this._transitionTimers.push(setTimeout(finish, totalDuration));

      }, 1500));
    } else if (scene === 'chapter1') {
      // 第一章：使用自己的 chapter1 类名
      const overlay = document.createElement('div');
      overlay.className = 'intro-transition-overlay intro-transition-overlay--chapter1';
      this._transitionOverlay = overlay;

      const titleStr = '第一章 · 东园';
      const lines = [
        "兰雪堂，拙政园东部的入口。",
        "在画册里它只是几笔墨线和一块匾额。",
        "但此刻你站在它面前，石板微温，竹叶在无风中摇动。",
        "这座园，比它画出来的样子要深。"
      ];

      overlay.innerHTML = `
        <div class="prologue-transition-layout">
          <div class="intro-prologue-title">${titleStr}</div>
          <div class="intro-prologue-text" id="intro-chapter1-text"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const textContainer = overlay.querySelector('#intro-chapter1-text');
      const chapter1Ready = this._preloadImage('/images/chapter1/chapter1-lanxuetang.png');
      let finished = false;

      const finish = async (fast = false) => {
        if (finished) return;
        finished = true;
        this._clearTransitionTimers();
        document.removeEventListener('keydown', this._transitionKeyHandler);
        this._transitionKeyHandler = null;

        textContainer.querySelectorAll('span').forEach((p) => {
          p.style.opacity = '1';
          p.style.transform = 'translateY(0)';
        });

        if (this._transitionOverlay === overlay) {
          this._transitionOverlay = null;
        }

        await chapter1Ready;
        await this.engine.switchScene(scene, true);
        await this._nextFrame();

        if (fast) {
          overlay.style.transition = 'opacity 0.4s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 450);
        } else {
          overlay.style.transition = 'opacity 1s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 1100);
        }
      };

      this._transitionKeyHandler = (e) => {
        if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
        e.preventDefault();
        finish(true);
      };
      document.addEventListener('keydown', this._transitionKeyHandler);

      this._transitionTimers.push(setTimeout(() => {
        overlay.classList.add('active');
        const title = overlay.querySelector('.intro-prologue-title');
        if (title) {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        }
      }, 50));

      root.classList.add('menu-scene--exiting-slow');

      textContainer.innerHTML = '';

      this._transitionTimers.push(setTimeout(() => {
        lines.forEach((line, index) => {
          const p = document.createElement('span');
          p.textContent = line;
          p.style.opacity = '0';
          p.style.transform = 'translateY(15px)';
          p.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
          p.style.display = 'block';
          textContainer.appendChild(p);

          this._transitionTimers.push(setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, index * 1200));
        });

        const totalDuration = (lines.length - 1) * 1200 + 1200 + 3000;
        this._transitionTimers.push(setTimeout(finish, totalDuration));

      }, 1500));
    } else if (scene === 'chapter2') {
      // 第二章：过渡页
      const overlay = document.createElement('div');
      overlay.className = 'intro-transition-overlay intro-transition-overlay--chapter2';
      this._transitionOverlay = overlay;

      const titleStr = '第二章 · 中园';
      const lines = [
        "远香堂。拙政园的中心，四面环水。",
        "堂内挂着几首题诗，你在文献里都读到过。",
        "但有几个字，和你记得的不一样。",
        "差异很小。小到像抄错。又太巧，巧到不像抄错。"
      ];

      overlay.innerHTML = `
        <div class="prologue-transition-layout">
          <div class="intro-prologue-title">${titleStr}</div>
          <div class="intro-prologue-text" id="intro-chapter2-text"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const textContainer = overlay.querySelector('#intro-chapter2-text');
      const chapter2Ready = this._preloadImage('/images/chapter2/chapter2-yuanxiangtang.png');
      let finished = false;

      const finish = async (fast = false) => {
        if (finished) return;
        finished = true;
        this._clearTransitionTimers();
        document.removeEventListener('keydown', this._transitionKeyHandler);
        this._transitionKeyHandler = null;

        textContainer.querySelectorAll('span').forEach((p) => {
          p.style.opacity = '1';
          p.style.transform = 'translateY(0)';
        });

        if (this._transitionOverlay === overlay) {
          this._transitionOverlay = null;
        }

        await chapter2Ready;
        await this.engine.switchScene(scene, true);
        await this._nextFrame();

        if (fast) {
          overlay.style.transition = 'opacity 0.4s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 450);
        } else {
          overlay.style.transition = 'opacity 1s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 1100);
        }
      };

      this._transitionKeyHandler = (e) => {
        if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
        e.preventDefault();
        finish(true);
      };
      document.addEventListener('keydown', this._transitionKeyHandler);

      this._transitionTimers.push(setTimeout(() => {
        overlay.classList.add('active');
        const title = overlay.querySelector('.intro-prologue-title');
        if (title) {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        }
      }, 50));

      root.classList.add('menu-scene--exiting-slow');

      textContainer.innerHTML = '';

      this._transitionTimers.push(setTimeout(() => {
        lines.forEach((line, index) => {
          const p = document.createElement('span');
          p.textContent = line;
          p.style.opacity = '0';
          p.style.transform = 'translateY(15px)';
          p.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
          p.style.display = 'block';
          textContainer.appendChild(p);

          this._transitionTimers.push(setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, index * 1200));
        });

        const totalDuration = (lines.length - 1) * 1200 + 1200 + 3000;
        this._transitionTimers.push(setTimeout(finish, totalDuration));

      }, 1500));
    } else if (scene === 'chapter3') {
      // 第三章：背景图过渡页（缓慢平移）
      const overlay = document.createElement('div');
      overlay.className = 'intro-transition-overlay intro-transition-overlay--chapter3';
      this._transitionOverlay = overlay;

      const titleStr = '第三章 · 西园';
      const lines = [
        "西园的光线不一样了。",
        "天色暗了，像黄昏，又像一场雨要来之前。",
        "空气变得潮湿。竹叶上凝着水珠。",
        "有人在画画。或者，曾经有人在这里画画。"
      ];
      const preloadImg = '/images/chapter3/chapter3-yuanyang-south.png';

      overlay.innerHTML = `
        <div class="ch3-transition-bg"></div>
        <div class="prologue-transition-layout">
          <div class="intro-title-group">
            <div class="intro-prologue-title">${titleStr}</div>
          </div>
          <div class="intro-prologue-text" id="intro-chapter3-text"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const textContainer = overlay.querySelector('#intro-chapter3-text');
      const sceneReady = this._preloadImage(preloadImg);
      let finished = false;

      const finish = async (fast = false) => {
        if (finished) return;
        finished = true;
        this._clearTransitionTimers();
        document.removeEventListener('keydown', this._transitionKeyHandler);
        this._transitionKeyHandler = null;

        textContainer.querySelectorAll('span').forEach((p) => {
          p.style.opacity = '1';
          p.style.transform = 'translateY(0)';
        });

        if (this._transitionOverlay === overlay) {
          this._transitionOverlay = null;
        }

        await sceneReady;
        await this.engine.switchScene(scene, true);
        await this._nextFrame();

        if (fast) {
          overlay.style.transition = 'opacity 0.4s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 450);
        } else {
          overlay.style.transition = 'opacity 1s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 1100);
        }
      };

      this._transitionKeyHandler = (e) => {
        if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
        e.preventDefault();
        finish(true);
      };
      document.addEventListener('keydown', this._transitionKeyHandler);

      this._transitionTimers.push(setTimeout(() => {
        overlay.classList.add('active');
        const title = overlay.querySelector('.intro-prologue-title');
        if (title) {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        }
      }, 50));

      root.classList.add('menu-scene--exiting-slow');

      textContainer.innerHTML = '';

      this._transitionTimers.push(setTimeout(() => {
        lines.forEach((line, index) => {
          const p = document.createElement('span');
          p.textContent = line;
          p.style.opacity = '0';
          p.style.transform = 'translateY(15px)';
          p.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
          p.style.display = 'block';
          textContainer.appendChild(p);

          this._transitionTimers.push(setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, index * 1200));
        });

        const totalDuration = (lines.length - 1) * 1200 + 1200 + 3000;
        this._transitionTimers.push(setTimeout(finish, totalDuration));

      }, 1500));
    } else if (scene === 'finale') {
      // 终章：背景图过渡页（缓慢平移），与第三章同结构
      const overlay = document.createElement('div');
      overlay.className = 'intro-transition-overlay intro-transition-overlay--finale';
      this._transitionOverlay = overlay;

      const titleStr = '终章 · 第三十一景';
      const lines = [
        "这一次进入画中，没有出现在任何一处景点。",
        "只有一片空白，像翻到一页还没有落墨的纸。",
        "断簪，残砚，一幅从墙上拓下来的草图。",
        "第三十一景还差最后一笔。这一笔该怎么落，由你决定。"
      ];
      const preloadImg = '/images/finale/finale-truth-space.png';

      overlay.innerHTML = `
        <div class="finale-transition-bg"></div>
        <div class="prologue-transition-layout">
          <div class="intro-title-group">
            <div class="intro-prologue-title">${titleStr}</div>
          </div>
          <div class="intro-prologue-text" id="intro-finale-text"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const textContainer = overlay.querySelector('#intro-finale-text');
      const sceneReady = this._preloadImage(preloadImg);
      let finished = false;

      const finish = async (fast = false) => {
        if (finished) return;
        finished = true;
        this._clearTransitionTimers();
        document.removeEventListener('keydown', this._transitionKeyHandler);
        this._transitionKeyHandler = null;

        textContainer.querySelectorAll('span').forEach((p) => {
          p.style.opacity = '1';
          p.style.transform = 'translateY(0)';
        });

        if (this._transitionOverlay === overlay) {
          this._transitionOverlay = null;
        }

        await sceneReady;
        await this.engine.switchScene(scene, true);
        await this._nextFrame();

        if (fast) {
          overlay.style.transition = 'opacity 0.4s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 450);
        } else {
          overlay.style.transition = 'opacity 1.2s ease';
          overlay.classList.remove('active');
          overlay.classList.add('fade-out');
          setTimeout(() => overlay.remove(), 1300);
        }
      };

      this._transitionKeyHandler = (e) => {
        if (!this._isFastForwardKey(e) || this._isTextInputActive()) return;
        e.preventDefault();
        finish(true);
      };
      document.addEventListener('keydown', this._transitionKeyHandler);

      this._transitionTimers.push(setTimeout(() => {
        overlay.classList.add('active');
        const title = overlay.querySelector('.intro-prologue-title');
        if (title) {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        }
      }, 50));

      root.classList.add('menu-scene--exiting-slow');

      textContainer.innerHTML = '';

      this._transitionTimers.push(setTimeout(() => {
        lines.forEach((line, index) => {
          const p = document.createElement('span');
          p.textContent = line;
          p.style.opacity = '0';
          p.style.transform = 'translateY(15px)';
          p.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
          p.style.display = 'block';
          textContainer.appendChild(p);

          this._transitionTimers.push(setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, index * 1200));
        });

        const totalDuration = (lines.length - 1) * 1200 + 1200 + 3000;
        this._transitionTimers.push(setTimeout(finish, totalDuration));

      }, 1500));
    } else {
      // 其余章节直接淡出菜单并柔和淡入目标场景
      root.classList.add('menu-scene--exiting');
      setTimeout(() => {
        this.engine.switchScene(scene, false);
      }, 1000);
    }
  }

  _clearIntroTransition() {
    this._clearTransitionTimers();
    if (this._transitionKeyHandler) {
      document.removeEventListener('keydown', this._transitionKeyHandler);
      this._transitionKeyHandler = null;
    }
    if (this._transitionOverlay) {
      this._transitionOverlay.remove();
      this._transitionOverlay = null;
    }
  }

  _clearTransitionTimers() {
    this._transitionTimers.forEach((timer) => clearTimeout(timer));
    this._transitionTimers = [];
  }

  _isFastForwardKey(e) {
    return e.key === ' ' || e.key?.toLowerCase() === 'z' || e.code === 'KeyZ';
  }

  _isTextInputActive() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  _preloadImage(src, timeout = 3000) {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, timeout);
      img.onload = done;
      img.onerror = done;
      img.src = src;
      if (img.complete) done();
    });
  }

  _nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  _hasSaveData() {
    if (this.engine.saveSystem?.hasSave) {
      return this.engine.saveSystem.hasSave();
    }
    try {
      return !!localStorage.getItem('sanyijing-save');
    } catch { return false; }
  }

  _getProgress() {
    if (this.engine.gameProgress) {
      return this.engine.gameProgress;
    }
    return { prologue: true };
  }

  _isChapterUnlocked(ch) {
    if (ch.alwaysUnlocked) return true;
    // 测试阶段保持章节全开，便于直接跳转验证各章节。
    // 上线前需改回按完成进度逐章解锁。
    return true;
  }

  _getContinueScene(save) {
    const savedScene = save?.scene;
    const checkpointScene = this._getSceneForCheckpoint(save?.checkpointId);
    if (checkpointScene) return checkpointScene;

    if (savedScene && savedScene !== 'menu' && savedScene !== 'landing') {
      return savedScene;
    }

    const progress = save?.progress || this._getProgress();
    if (progress.finaleComplete || progress.chapter3Complete || progress.chapter3_completed) return 'finale';
    if (progress.chapter2Complete || progress.chapter2_completed) return 'chapter3';
    if (progress.chapter1Complete || progress.chapter1_completed) return 'chapter2';
    if (progress.prologueComplete || progress.prologue_completed || progress.chapter1) return 'chapter1';
    return 'prologue';
  }

  _getSceneForCheckpoint(checkpointId) {
    const checkpointScenes = {
      prologue_start: 'prologue',
      prologue_scan_start: 'prologue',
      prologue_synthesis_start: 'prologue',
      chapter1_lanxue_start: 'chapter1',
      chapter1_zhuiyun_start: 'chapter1',
      chapter1_furong_start: 'chapter1',
      chapter1_workshop_start: 'chapter1-workshop',
      chapter2_yuanxiang_start: 'chapter2',
      chapter2_xiaofeihong_start: 'chapter2',
      chapter2_workshop_start: 'chapter2-workshop',
      chapter3_south_start: 'chapter3',
      chapter3_north_start: 'chapter3',
      chapter3_liuting_start: 'chapter3',
      chapter3_workshop_start: 'chapter3-workshop',
      finale_truth_start: 'finale',
      finale_questions_start: 'finale',
      finale_endings_start: 'finale',
      finale_complete: 'finale',
    };
    return checkpointScenes[checkpointId] || null;
  }

  /* ==================== 样式注入 ==================== */

  _injectStyles() {
    if (document.getElementById('menu-scene-styles')) return;

    const style = document.createElement('style');
    style.id = 'menu-scene-styles';
    style.textContent = /* css */ `

    /* ===========================
       Menu Scene — Root
       =========================== */
    .menu-scene {
      width: 100vw;
      min-height: 100vh;
      background-color: #ece9e1;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: flex-end; /* 卡片移到右侧 */
      padding: 2rem 8% 2rem 2rem; /* 右侧留白 */
      animation: menuEnter 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .menu-scene--exiting {
      animation: menuExit 1.5s cubic-bezier(0.2, 0, 0, 1) forwards;
    }

    .menu-scene--exiting-slow {
      animation: menuExit 2.5s cubic-bezier(0.2, 0, 0, 1) forwards;
    }

    @keyframes menuEnter {
      from { opacity: 0; transform: scale(0.95); filter: blur(10px); }
      to { opacity: 1; transform: scale(1); filter: blur(0); }
    }
    @keyframes menuExit {
      0% { opacity: 1; filter: blur(0) brightness(1); }
      50% { filter: blur(4px) brightness(0.8); }
      100% { opacity: 0; transform: scale(1.05); filter: blur(12px) brightness(0); }
    }

    /* 背景图片与滤镜 */
    .menu-scene::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("${bgImage}");
      background-size: cover;
      background-position: center;
      pointer-events: none;
      z-index: 0;
    }



    /* ===========================
       Background Decorations
       =========================== */
    .menu-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .menu-mask {
      display: none;
    }

    .menu-bg-mountain {
      display: none;
    }

    .menu-bg-mist {
      display: none;
    }

    /* 人物立绘 */
    .menu-character {
      position: absolute;
      left: 2%;
      bottom: 0%;
      height: 95vh;
      z-index: 5;
      pointer-events: none;
      filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2));
    }

    .menu-character img {
      height: 100%;
      width: auto;
      object-fit: contain;
      object-position: left bottom;
    }

    @keyframes charFloat {
      from { transform: translateY(0); }
      to { transform: translateY(-15px); }
    }

    /* ===========================
       Back Button
       =========================== */
    .menu-back {
      position: absolute;
      top: 1.5rem;
      left: 2rem;
      z-index: 20;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0.6rem 2.2rem;
      font-family: var(--font-serif);
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.25em; 
      cursor: pointer;
      transition: all 0.2s ease-out;
      border-radius: 0;
      color: #e0c296; 
      background: #713824;
      border: 2px solid #4a2417;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.2), 4px 4px 0px rgba(44, 36, 22, 0.85); 
    }

    .menu-back:hover {
      transform: translate(2px, 2px);
      background: #5c2d1b;
      box-shadow: inset 0 0 15px rgba(0,0,0,0.3), 2px 2px 0px rgba(44, 36, 22, 0.85);
    }

    .menu-fullscreen-btn {
      position: absolute;
      right: 2rem;
      bottom: 2rem;
      z-index: 50;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1px solid rgba(224, 194, 150, 0.28);
      background: rgba(62, 52, 39, 0.68);
      color: rgba(255, 248, 232, 0.92);
      font-size: 1.55rem;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 8px 22px rgba(42, 34, 23, 0.25);
      backdrop-filter: blur(4px);
      transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
    }

    .menu-fullscreen-btn:hover {
      transform: translateY(-1px);
      background: rgba(62, 52, 39, 0.78);
      border-color: rgba(224, 194, 150, 0.42);
    }

    /* ===========================
       Main Panel — 卷轴展开
       =========================== */
    .menu-panel {
      position: relative;
      z-index: 10;
      width: 400px; /* 宽度降至 400px，视觉占比更轻巧 */
      max-width: calc(100vw - 4rem);
      /* 限制高度上限在 440px，在各类屏幕上均具备优秀的小卡片纸笺感 */
      max-height: min(440px, calc(100vh - 14rem)); 
      display: flex;
      flex-direction: column;
      overflow: visible;
      background: transparent;
      padding: 0.9rem 1.2rem 1.0rem; /* 内边距微降 */
      animation: panelSlideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    /* 宣纸残页背景 */
    .menu-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background-color: rgba(226, 214, 192, 0.68); /* 吸收背景图片的古典熟宣茶黄色，使面板与画卷浑然一体 */
      background-image: 
        repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(100, 70, 40, 0.01) 1px, rgba(100, 70, 40, 0.01) 2px),
        repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(100, 70, 40, 0.01) 1px, rgba(100, 70, 40, 0.01) 2px),
        radial-gradient(circle at 50% 50%, transparent 60%, rgba(101, 60, 20, 0.015) 120%),
        radial-gradient(circle at 15% 85%, rgba(120, 80, 40, 0.005) 0%, transparent 20%),
        radial-gradient(circle at 85% 15%, rgba(120, 80, 40, 0.003) 0%, transparent 20%);
      filter: url(#paper-tear);
      box-shadow: 0 10px 40px rgba(90, 55, 30, 0.015);
      backdrop-filter: blur(8px);
    }

    @keyframes panelSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===========================
       Content Area
       =========================== */
    .menu-content {
      background: transparent;
      padding: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
      min-height: 0;
    }

    .menu-content::-webkit-scrollbar {
      width: 4px;
    }
    .menu-content::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 2px;
    }

    /* ===========================
       Header
       =========================== */
    .menu-header {
      text-align: left;
      position: relative;
      padding: 0.1rem 0.45rem 0.85rem;
      border-bottom: none;
    }

    .menu-header-ink {
      display: none;
    }

    .menu-title {
      font-family: 'Noto Serif SC', var(--font-serif);
      font-size: clamp(1.6rem, 3.1vw, 2.05rem); /* 字号降至 1.6rem ~ 2.05rem */
      font-weight: 600;
      color: rgba(92, 59, 36, 0.94);
      letter-spacing: 0.12em;
      margin: 0 0 0.25rem;
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
    }

    .menu-subtitle {
      font-family: var(--font-handwrite);
      font-size: 0.75rem; /* 降至 0.75rem */
      color: rgba(83, 67, 45, 0.72);
      letter-spacing: 0.15em;
      margin: 0;
    }

    /* ===========================
       Chapter List — 笺纸书页式
       =========================== */
    .chapter-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem; /* 间隙保持 0.35rem，或者根据实际列表压缩为 0.3rem */
      padding: 0.15rem 0.3rem;
      overflow: hidden auto;
      flex: 0 0 auto;
    }

    .chapter-item {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0.15rem 0.5rem;
      border-radius: 3px;
      border: none;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      cursor: pointer;
      overflow: hidden;
      min-height: 42px;
      background: rgba(255, 253, 248, 0.35); /* 微带暖黄本白，与茶黄色熟宣纸面更协调 */
    }

    .chapter-item:nth-child(odd) {
      transform: none;
    }
    
    .chapter-item:nth-child(even) {
      transform: none;
    }

    .chapter-item--unlocked {
      background: rgba(255, 255, 255, 0.35);
    }

    .chapter-item--unlocked:hover {
      background: rgba(255, 255, 255, 0.55);
      box-shadow: none;
      transform: translateX(4px);
      z-index: 2;
    }

    .chapter-item--locked {
      cursor: not-allowed;
      opacity: 0.85;
      background-color: #c0b2a2; /* Darker, more oxidized */
      filter: sepia(0.3) contrast(1.1);
    }

    .chapter-item--locked:hover {
      background-color: #c8baa9;
    }

    /* 笺纸右侧红栏（隐藏，改为极简风格） */
    .chapter-item::after {
      display: none;
    }

    .chapter-item--unlocked:hover::after {
      display: none;
    }

    /* 抖动动画（锁定点击） */
    .chapter-item.shake {
      animation: shake 0.4s ease;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0) rotate(0.5deg); }
      20% { transform: translateX(-4px) rotate(-1deg); }
      40% { transform: translateX(4px) rotate(1.5deg); }
      60% { transform: translateX(-2px) rotate(-0.5deg); }
      80% { transform: translateX(2px) rotate(1deg); }
    }

    /* ===========================
       Chapter Side & Marker
       =========================== */
    .chapter-side {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.5rem;
    }

    .chapter-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chapter-num {
      width: auto;
      height: auto;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-handwrite);
      font-size: 0.82rem; /* 降至 0.82rem */
      color: rgba(63, 49, 31, 0.75);
      background: transparent;
      border: none;
      letter-spacing: 0.05em;
    }

    .chapter-num--dim {
      color: rgba(78, 62, 39, 0.3);
      background: transparent;
      border: none;
    }

    .seal {
      width: 25px; /* 印章调至 25px * 25px */
      height: 25px;
      border-radius: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-serif);
      font-size: 0.58rem; /* 字号下调至 0.58rem，精致迷你 */
      font-weight: normal;
      color: rgba(179, 62, 45, 0.68);
      background: transparent;
      border: 1px solid rgba(179, 62, 45, 0.52);
      letter-spacing: 0.05em;
      transform: rotate(-3deg);
      box-sizing: border-box;
      opacity: 0.82;
      transition: all 0.3s ease;
    }
    
    .chapter-item--unlocked:hover .seal {
      color: rgba(166, 58, 43, 0.75);
      border-color: rgba(166, 58, 43, 0.65);
    }

    /* ===========================
       Chapter Info
       =========================== */
    .chapter-info {
      flex: 1;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 3px; /* 间隙调为 3px，梳理层级，防止挤在一块 */
      padding: 0 0.3rem;
    }

    .chapter-header {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      gap: 0.25rem;
      width: auto;
    }

    .chapter-name {
      font-family: var(--font-serif);
      font-size: 0.84rem; /* 降至 0.84rem */
      font-weight: 500;
      color: rgba(46, 35, 21, 0.92);
      letter-spacing: 0.05em;
    }

    .chapter-sep {
      display: inline-block;
      color: rgba(94, 76, 50, 0.3);
      font-size: 0.75rem;
    }

    .chapter-subtitle {
      font-family: var(--font-serif);
      font-size: 0.8rem; /* 降至 0.8rem */
      font-weight: 500;
      color: rgba(62, 48, 30, 0.85);
      letter-spacing: 0.05em;
    }

    .chapter-desc {
      font-family: var(--font-handwrite);
      font-size: 0.68rem; /* 细节旁注降至极其隽雅秀丽的 0.68rem */
      color: rgba(94, 76, 50, 0.62);
      margin: 0;
      letter-spacing: 0.05em;
      text-align: left;
      line-height: 1.05;
    }

    .chapter-item--unlocked:hover .chapter-desc {
      color: rgba(70, 55, 34, 0.8);
    }

    .chapter-tagline {
      font-family: var(--font-handwrite); /* 明确改用霞鹜文楷手写体，使菜单字体严格控制在思源宋体和霞鹜文楷两种以内 */
      font-size: 0.7rem; /* 字号微降，衬托第一级标题 */
      color: rgba(83, 67, 45, 0.62);
      letter-spacing: 0.03em;
      margin: 0; /* 统一由 flex 的 gap 间隙控制 */
      line-height: 1.3;
    }

    .chapter-item--unlocked:hover .chapter-tagline {
      color: rgba(70, 55, 34, 0.85);
    }

    .chapter-item--locked .chapter-tagline {
      opacity: 0.5;
    }

    /* ===========================
       Chapter Lock / Arrow
       =========================== */
    .chapter-status-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chapter-lock-icon,
    .chapter-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chapter-lock-icon {
      color: rgba(78, 62, 39, 0.32);
    }

    .chapter-arrow {
      color: rgba(78, 62, 39, 0.58);
      transition: all 0.3s ease;
    }

    .chapter-item--unlocked:hover .chapter-arrow {
      color: rgba(50, 39, 24, 0.86);
      transform: translateX(4px);
    }

    /* ===========================
       Global Footer Buttons
       =========================== */
    .menu-footer-global {
      position: absolute;
      bottom: 6.2rem; /* 再往上移 16px（升至 6.2rem），使其充分踩在画心地面，拉开与底轴木棍的距离 */
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      z-index: 20;
      width: max-content;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 180px;
      min-height: 48px;
      padding: 0.6rem 2.2rem;
      font-family: var(--font-serif);
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.25em; 
      cursor: pointer;
      transition: all 0.2s ease-out;
      border-radius: 0;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(1);
    }

    .action-btn--primary {
      color: #e0c296; 
      background: #713824;
      border: 2px solid #4a2417;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.2), 4px 4px 0px rgba(44, 36, 22, 0.85); 
    }
    .action-btn--primary:hover:not(:disabled) {
      transform: translate(2px, 2px);
      background: #5c2d1b;
      box-shadow: inset 0 0 15px rgba(0,0,0,0.3), 2px 2px 0px rgba(44, 36, 22, 0.85);
    }

    .action-btn--secondary {
      color: #713824;
      background: #d8be96;
      border: 2px solid #713824;
      box-shadow: 4px 4px 0px rgba(113, 56, 36, 0.35); 
    }
    .action-btn--secondary:hover:not(:disabled) {
      transform: translate(2px, 2px);
      background: #c8ab7d;
      box-shadow: 2px 2px 0px rgba(113, 56, 36, 0.35);
    }

    .action-btn--ghost {
      background: transparent;
      color: rgba(58, 45, 28, 0.5);
      font-size: 0.9rem;
      padding: 0.5rem;
    }
    .action-btn--ghost:hover {
      color: #9a3f31;
      background: rgba(200, 64, 50, 0.06);
    }

    /* ===========================
       Responsive
       =========================== */
    @media (max-width: 860px) {
      .menu-panel {
        width: 600px;
      }
      .chapter-list {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      .menu-scene {
        padding: 1rem;
      }

      .menu-content {
        padding: 1.5rem 1.25rem;
      }

      .menu-back {
        top: 1rem;
        left: 1rem;
      }

      .menu-fullscreen-btn {
        right: 1rem;
        bottom: 1rem;
      }

      .menu-title {
        font-size: 1.75rem;
      }

      .chapter-item {
        padding: 1.2rem;
      }

      .menu-footer {
        flex-wrap: wrap;
      }
    }
    `;

    document.head.appendChild(style);
    this._styleEl = style;
  }
}
