/**
 * 《卅一景》物品系统
 *
 * 管理游戏中可收集的物品。每件物品有唯一 id、名称、描述和图标。
 * 物品操作会通过引擎事件系统发出通知。
 */

/**
 * 预定义物品模板
 * 场景代码可直接引用这些模板，也可传入自定义物品
 */
export const ITEM_TEMPLATES = {
  notebook: {
    id: 'notebook',
    name: '修复笔记本',
    description: '周鹤年随身携带的笔记本，记录着修复过程中的种种发现。封面已经磨损，但内页整洁。',
    icon: '📓',
  },
  hairpin: {
    id: 'hairpin',
    name: '断簪',
    description: '银质断簪，簪头为半朵芙蓉。簪身背面刻有一个极小的"蘅"字。不像正式题名，也不像工匠标记，用途不明。',
    icon: '',
  },
  inkstone: {
    id: 'inkstone',
    name: '残砚',
    description: '小型端砚，砚池残留朱砂。砚背刻有小词，像是随身携带的私人用砚。',
    icon: '🪨',
  },
  rubbing: {
    id: 'rubbing',
    name: '草图拓片',
    description: '留听阁墙面低位视角草图的拓片，证实王蘅的空间观看能力。',
    icon: '',
  },
  letter: {
    id: 'letter',
    name: '王蘅的信',
    description: '"不必有名，不必有形。只要有痕迹。"',
    icon: '',
  },
};

export class Inventory {
  constructor(engine) {
    /** @type {import('./game-engine.js').GameEngine} */
    this.engine = engine;

    /** @type {Array<{id: string, name: string, description: string, icon: string, used?: boolean}>} */
    this.items = [];
  }

  /**
   * 添加物品
   * @param {object} item - 物品对象 { id, name, description, icon }
   */
  addItem(item, options = {}) {
    // 避免重复添加
    if (this.hasItem(item.id)) {
      console.warn(`[Inventory] 物品 "${item.id}" 已存在，跳过添加`);
      return;
    }

    const newItem = { ...item, used: false };
    this.items.push(newItem);
    if (!options.silent) {
      this.engine.emit('item-collected', newItem);
      console.log(`[Inventory] 获得物品: ${item.name}`);
    }
  }

  /**
   * 检查是否拥有某物品
   * @param {string} id
   * @returns {boolean}
   */
  hasItem(id) {
    return this.items.some((item) => item.id === id);
  }

  /**
   * 使用物品（标记为已使用）
   * @param {string} id
   * @returns {boolean} 是否成功使用
   */
  useItem(id) {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      console.warn(`[Inventory] 物品 "${id}" 不存在`);
      return false;
    }
    if (item.used) {
      console.warn(`[Inventory] 物品 "${id}" 已被使用`);
      return false;
    }

    item.used = true;
    this.engine.emit('item-used', item);
    console.log(`[Inventory] 使用物品: ${item.name}`);
    return true;
  }

  /**
   * 获取所有物品
   * @returns {Array}
   */
  getItems() {
    return [...this.items];
  }

  /**
   * 从存档数据恢复物品列表
   * @param {Array} savedItems
   */
  restore(savedItems) {
    if (Array.isArray(savedItems)) {
      this.items = savedItems.map((item) => ({ ...item }));
    }
  }
}
