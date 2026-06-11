/**
 * 未完成章节的占位场景。
 *
 * 用于避免菜单解锁后切换到未注册场景导致流程卡死。
 */

const DEFAULT_COPY = {
  title: '章节筹备中',
  subtitle: '新的园林视角尚在修复',
  description: '这一段空间已经在目录中显影，但完整的场景、谜题与叙事还没有装配完成。你可以先返回菜单，继续从已开放的章节进入。',
};

export function createChapterPlaceholderScene(config = {}) {
  return class ChapterPlaceholderScene {
    constructor(engine) {
      this.engine = engine;
      this._styleEl = null;
    }

    enter(container) {
      this._injectStyles();
      container.innerHTML = '';
      container.appendChild(this._buildDOM());
    }

    exit() {
      if (this._styleEl) {
        this._styleEl.remove();
        this._styleEl = null;
      }
    }

    _buildDOM() {
      const copy = { ...DEFAULT_COPY, ...config };
      const root = document.createElement('div');
      root.className = 'chapter-placeholder';
      root.innerHTML = `
        <div class="chapter-placeholder__wash"></div>
        <main class="chapter-placeholder__content" aria-labelledby="chapter-placeholder-title">
          <p class="chapter-placeholder__kicker">${copy.eyebrow || '未完成章节'}</p>
          <h1 id="chapter-placeholder-title">${copy.title}</h1>
          <p class="chapter-placeholder__subtitle">${copy.subtitle}</p>
          <p class="chapter-placeholder__description">${copy.description}</p>
          <button class="chapter-placeholder__back" type="button">返回章节目录</button>
        </main>
      `;

      root.querySelector('.chapter-placeholder__back').addEventListener('click', () => {
        root.classList.add('chapter-placeholder--leaving');
        setTimeout(() => this.engine.switchScene('menu'), 350);
      });

      return root;
    }

    _injectStyles() {
      if (document.getElementById('chapter-placeholder-styles')) return;

      const style = document.createElement('style');
      style.id = 'chapter-placeholder-styles';
      style.textContent = `
        .chapter-placeholder {
          position: relative;
          width: 100vw;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background:
            linear-gradient(135deg, rgba(245, 240, 232, 0.96), rgba(232, 213, 168, 0.88)),
            var(--paint-bg);
          color: var(--paint-ink);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        .chapter-placeholder--leaving {
          opacity: 0;
          transform: scale(0.985);
        }

        .chapter-placeholder__wash {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 70% 25%, rgba(139, 69, 19, 0.14), transparent 42%),
            radial-gradient(ellipse at 25% 70%, rgba(74, 109, 124, 0.14), transparent 38%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(61, 43, 31, 0.025) 3px,
              rgba(61, 43, 31, 0.025) 6px
            );
          pointer-events: none;
        }

        .chapter-placeholder__content {
          position: relative;
          width: min(680px, 100%);
          padding: 2.5rem;
          border: 1px solid rgba(139, 69, 19, 0.2);
          border-radius: var(--radius-md);
          background: rgba(253, 250, 242, 0.78);
          box-shadow: 0 18px 60px rgba(61, 43, 31, 0.14);
        }

        .chapter-placeholder__kicker {
          margin: 0 0 0.75rem;
          color: var(--paint-vermillion);
          font-family: var(--font-handwrite);
          font-size: var(--font-size-sm);
          letter-spacing: 0.08em;
        }

        .chapter-placeholder h1 {
          margin: 0;
          font-family: var(--font-serif);
          font-size: clamp(2rem, 5vw, 3.25rem);
          line-height: 1.25;
          letter-spacing: 0.05em;
          color: var(--paint-ink);
        }

        .chapter-placeholder__subtitle {
          margin: 0.75rem 0 0;
          font-family: var(--font-handwrite);
          font-size: var(--font-size-xl);
          color: var(--paint-accent);
          line-height: 1.7;
        }

        .chapter-placeholder__description {
          margin: 1.5rem 0 0;
          max-width: 58ch;
          font-size: var(--font-size-base);
          line-height: 2;
          color: var(--paint-text);
        }

        .chapter-placeholder__back {
          margin-top: 2rem;
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

        .chapter-placeholder__back:hover {
          transform: translate(2px, 2px);
          background: #5c2d1b;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.3), 2px 2px 0px rgba(44, 36, 22, 0.85);
        }

        .chapter-placeholder__back:focus-visible {
          outline: 3px solid rgba(200, 64, 50, 0.45);
          outline-offset: 3px;
        }

        @media (max-width: 640px) {
          .chapter-placeholder {
            padding: 1rem;
          }

          .chapter-placeholder__content {
            padding: 1.5rem;
          }
        }
      `;

      document.head.appendChild(style);
      this._styleEl = style;
    }
  };
}
