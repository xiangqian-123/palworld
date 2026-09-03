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
