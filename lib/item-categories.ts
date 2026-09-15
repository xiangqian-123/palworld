/**
 * Item 分类显示映射（纯数据，无 fs 依赖）——client 组件（ItemsBrowser）与 server 端共用。
 */

/** 分类中文名（zh-CN/zh-TW 显示用）。 */
export const CATEGORY_ZH: Record<string, string> = {
  Blueprint: "蓝图",
  Weapon: "武器",
  Armor: "防具",
  Essential: "基础",
  Consume: "消耗品",
  Material: "材料",
  Food: "食物",
  Accessory: "饰品",
  Ammo: "弹药",
  SpecialWeapon: "特殊武器",
  CaptureItemModifier: "捕获物改造",
  Glider: "滑翔翼",
};

/** 分类显示名（zh 分支用中文，其余用原文）。 */
export function categoryDisplayName(cat: string, zh: boolean): string {
  return zh ? CATEGORY_ZH[cat] ?? cat : cat;
}
