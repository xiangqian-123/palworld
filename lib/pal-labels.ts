// Pal 详情页用到的术语映射（游戏官方英文 → 中文名）。
// 数据来自 palworld-db API（英文），这里只做显示层的中文对照，不改变数据本身。

export const ELEMENT_ZH: Record<string, string> = {
  Neutral: "无属性",
  Fire: "火",
  Water: "水",
  Grass: "草",
  Electric: "电",
  Ice: "冰",
  Ground: "地",
  Dark: "暗",
  Dragon: "龙",
};

// 12 种工作适应性（Palworld 1.0 固定职种）。
export const WORK_ZH: Record<string, string> = {
  Kindling: "生火",
  Watering: "浇水",
  Planting: "种植",
  Handiwork: "手工作业",
  Lumbering: "伐木",
  Mining: "采矿",
  "Medicine Production": "制药",
  MedicineProduction: "制药",
  Cooling: "冷却",
  Transporting: "搬运",
  Farming: "畜牧",
  Electricity: "发电",
  GeneratingElectricity: "发电",
  Gathering: "采集",
};

// Palworld 元素克制表（游戏常量，palworld.gg / game8 同口径）：属性 → 被什么克制。
export const ELEMENT_WEAKNESS: Record<string, string[]> = {
  Neutral: ["Dark"],
  Fire: ["Water"],
  Water: ["Electric"],
  Electric: ["Ground"],
  Grass: ["Fire"],
  Ice: ["Fire"],
  Ground: ["Grass"],
  Dark: ["Dragon"],
  Dragon: ["Ice"],
};

/** 组合弱点：多元素取并集去重（Palworld 规则）。 */
export function getElementWeaknesses(elements: string[]): string[] {
  const out: string[] = [];
  for (const e of elements) {
    for (const w of ELEMENT_WEAKNESS[e] ?? []) {
      if (!out.includes(w)) out.push(w);
    }
  }
  return out;
}

// 元素英文 → 中文（用于 zh 显示「中文 英文」双显）。
export function elementLabel(en: string): string {
  const zh = ELEMENT_ZH[en];
  return zh ? `${zh} ${en}` : en;
}

// 工作适应性英文 → 中文双显。
export function workLabel(en: string): string {
  const zh = WORK_ZH[en];
  return zh ? `${zh} ${en}` : en;
}
