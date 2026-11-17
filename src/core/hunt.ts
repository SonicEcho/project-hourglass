// 区画の採取の場所（段階43 の狩りで作った。Phaser に依存しない）。
// 狩り（記憶をたどる）は段階213 で砂の底に置き換え、段階237 で探索の画面の狩りを外した。採取の場所の素材とギアは、砂の底がその区画の帯で使う
import type { AreaDef } from './explore';
import type { GridCell } from './grid';
import { isCheckpoint, startRoom } from './explore';
import { isWalkable, parseGrid } from './grid';

/** 採取の場所：タップすると素材が手に入る（入るたびに1回ずつ。宝箱の代わり） */
export interface AreaGather {
  id: string;
  room?: string;
  cell: GridCell;
  items: string[];
  /** 初めて開けた時だけ手に入るギア（段階200。宝箱に入りきらなかったギア。手に入れたかは物語の変数 huntGearKey に覚える） */
  gears?: string[];
}

/** 採取の場所のギアを手に入れたことを覚える物語の変数の名前（段階200） */
export function huntGearKey(gatherId: string): string {
  return `狩りのギア:${gatherId}`;
}

/** 区画の採取の場所の一覧（段階43。砂の底の帯で使う） */
export interface AreaHunt {
  /** 採取の場所 */
  gathers: AreaGather[];
}

/** 採取の場所の書き間違い（id の重なり・知らない部屋・通れないマス・チェックポイントの上・空）を、全部まとめて返す（テストで使う） */
export function checkHunt(area: AreaDef & { hunt: AreaHunt }): string[] {
  const errors: string[] = [];
  const roomIds = area.rooms.map((r) => r.id);
  const ids = area.hunt.gathers.map((g) => g.id);
  if (new Set(ids).size !== ids.length) errors.push(`${area.id}：採取の場所の id が重なっている`);
  for (const g of area.hunt.gathers) {
    const room = g.room ?? startRoom(area);
    if (!roomIds.includes(room)) {
      errors.push(`${area.id}：採取の場所 ${g.id} の部屋 ${room} がない`);
      continue;
    }
    const layout = area.rooms.find((r) => r.id === room)!.layout;
    if (!isWalkable(parseGrid(layout), g.cell)) errors.push(`${area.id}：採取の場所 ${g.id} が通れないマス（${g.cell}）にある`);
    if (isCheckpoint(area, g.cell, room) || layout[g.cell[1]]?.[g.cell[0]] === 'S') errors.push(`${area.id}：採取の場所 ${g.id} がチェックポイントか出発点の上にある`);
    if (g.items.length === 0) errors.push(`${area.id}：採取の場所 ${g.id} に何もない`);
  }
  return errors;
}

/** 敵の組み合わせの印（段階105）。並び順によらず、同じ敵の顔ぶれなら同じ（晩ごとの強さの倍率では id は変わらない） */
export function formationKey(enemyIds: readonly string[]): string {
  return [...enemyIds].sort().join('+');
}
