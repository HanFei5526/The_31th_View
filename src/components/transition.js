/**
 * 转场动画组件
 * 管理游戏中的各种场景转场效果
 */
export class TransitionManager {
  constructor() {
    this.overlay = null;
    this.isPlaying = false;
  }

  /**
   * 墨迹扩散转场 — 从现实世界跌入画中
   * @param {number} duration - 动画时长(ms)
   * @returns {Promise}
   */
  async inkSpread(duration = 2000) {
    return new Promise(resolve => {
      this.isPlaying = true;
      const overlay = document.createElement('div');
      overlay.className = 'transition-ink-spread';

      // 创建多个墨滴
      const drops = [
        { x: 50, y: 50, delay: 0, size: 30 },
        { x: 45, y: 55, delay: 100, size: 20 },
        { x: 55, y: 45, delay: 200, size: 25 },
        { x: 48, y: 52, delay: 50, size: 15 },
      ];

      drops.forEach(drop => {
        const el = document.createElement('div');
        el.className = 'ink-drop';
        el.style.cssText = `
          left: ${drop.x}%;
          top: ${drop.y}%;
          width: ${drop.size}px;
          height: ${drop.size}px;
          animation-delay: ${drop.delay}ms;
        `;
        overlay.appendChild(el);
      });

      document.body.appendChild(overlay);
      this.overlay = overlay;

      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });

      setTimeout(() => {
        this.isPlaying = false;
        resolve();
      }, duration);
    });
  }

  /**
   * 清除墨迹转场
   */
  async clearInk(duration = 1500) {
    return new Promise(resolve => {
      if (this.overlay) {
        this.overlay.style.transition = `opacity ${duration}ms ease`;
        this.overlay.style.opacity = '0';
        setTimeout(() => {
          this.overlay?.remove();
          this.overlay = null;
          resolve();
        }, duration);
      } else {
        resolve();
      }
    });
  }

  /**
   * 褪色转场 — 从画中返回现实
   */
  async fadeWash(duration = 2500) {
    return new Promise(resolve => {
      this.isPlaying = true;
      const overlay = document.createElement('div');
      overlay.className = 'transition-fade-wash';
      document.body.appendChild(overlay);
      this.overlay = overlay;

      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });

      setTimeout(() => {
        this.isPlaying = false;
        resolve();
      }, duration);
    });
  }

  /**
   * 卷轴转场 — 章节切换
   * @param {Object} chapterInfo - {number, name, subtitle}
   */
  async scrollTransition(chapterInfo, duration = 3500) {
    return new Promise(resolve => {
      this.isPlaying = true;

      // 卷轴
      const scroll = document.createElement('div');
      scroll.className = 'transition-scroll';
      scroll.innerHTML = `
        <div class="scroll-half scroll-left"></div>
        <div class="scroll-half scroll-right"></div>
      `;
      document.body.appendChild(scroll);

      // 章节标题卡
      const card = document.createElement('div');
      card.className = 'transition-chapter-card';
      card.innerHTML = `
        <div class="chapter-number">${chapterInfo.number || ''}</div>
        <div class="chapter-name">${chapterInfo.name}</div>
        ${chapterInfo.subtitle ? `<div class="chapter-subtitle">${chapterInfo.subtitle}</div>` : ''}
      `;
      document.body.appendChild(card);

      // 1. 卷轴合拢
      requestAnimationFrame(() => {
        scroll.classList.add('closing');
      });

      // 2. 显示章节标题
      setTimeout(() => {
        card.classList.add('visible');
      }, 1000);

      // 3. 卷轴打开
      setTimeout(() => {
        scroll.classList.remove('closing');
        scroll.classList.add('opening');
      }, duration - 1200);

      // 4. 清理
      setTimeout(() => {
        scroll.remove();
        card.remove();
        this.isPlaying = false;
        resolve();
      }, duration);
    });
  }

  /**
   * 简单淡入淡出
   */
  async fade(type = 'in', duration = 800) {
    return new Promise(resolve => {
      this.isPlaying = true;
      const overlay = document.createElement('div');
      overlay.className = 'transition-fade';
      document.body.appendChild(overlay);
      this.overlay = overlay;

      requestAnimationFrame(() => {
        overlay.classList.add(type === 'in' ? 'fade-in' : 'fade-out');
      });

      setTimeout(() => {
        if (type === 'out') {
          overlay.remove();
          this.overlay = null;
        }
        this.isPlaying = false;
        resolve();
      }, duration);
    });
  }

  /**
   * 清除当前转场覆盖层
   */
  async clear(duration = 800) {
    return new Promise(resolve => {
      if (this.overlay) {
        this.overlay.style.transition = `opacity ${duration}ms ease`;
        this.overlay.style.opacity = '0';
        setTimeout(() => {
          this.overlay?.remove();
          this.overlay = null;
          resolve();
        }, duration);
      } else {
        resolve();
      }
    });
  }
}
