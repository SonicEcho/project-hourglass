import type { AreaDef, RoomDef, RoomPart } from '../core/explore';
import { composeLayout } from '../core/explore';
import { AREAS } from './areas';

// 段階312（docs/milestones/M3_explore_feel.md の 16-9）：新しい1-2「夕暮れの二人乗り」の試し。デバッグメニューの「新しい1-2」で、今の 1-2 の代わりに使う。
// 今は入口の部屋だけ。商店街は横に走る通りで、上に正面向きの店、手前に背の高い店の裏を並べる（写し docs/sketches/a12_v1/gate_h_backs.png）。
// 敵・宝箱・写しの人・会話のきっかけは、ほかの部屋ができてから置く

/**
 * 入口の地面（map.a12h_gate_ground。開発者が作った屋根のない絵）の歩ける所。
 * 0〜4行は上の店の帯、5〜17行は通り（左右の端まで）、18行から下は手前の建物の帯で、9〜13列だけ下の端へ抜ける脇道
 */
const GATE_GROUND = [
  ...Array.from({ length: 5 }, () => '#'.repeat(24)),
  ...Array.from({ length: 13 }, (_, i) => (i === 6 ? '.S' + '.'.repeat(22) : '.'.repeat(24))),
  ...Array.from({ length: 6 }, () => '#'.repeat(9) + '.'.repeat(5) + '#'.repeat(10)),
];

/** 入口の部品。cell は足もとの左下、w・d は足もとの幅・奥行き、sw は絵の幅（マス） */
export const A12_GATE_PARTS: RoomPart[] = [
  // 上：正面を向いた店（通りを向く）。幅5マスずつ、すき間なく
  { part: 'a12f_yaoya', cell: [0, 4], w: 5, d: 2, sw: 5.2 },
  { part: 'a12f_fish', cell: [5, 4], w: 5, d: 2, sw: 5.2 },
  { part: 'a12f_candy', cell: [10, 4], w: 5, d: 2, sw: 5.2 },
  { part: 'a12f_rice', cell: [15, 4], w: 5, d: 2, sw: 5.2 },
  { part: 'a12f_books', cell: [20, 4], w: 5, d: 2, sw: 5.2 },
  // 手前：背の高い店の裏（裏の壁と屋根がこちらを向く）。絵の高さが7.4マスほどになる幅で、屋根が通りの下の2マスほどにかかる。
  // 足もとは 20〜22 行なので、通りの下の方を歩くと屋根の後ろに隠れる（2026-11-28 開発者）。脇道（9〜13列）はあける
  { part: 'a12b_mortar', cell: [-2, 22], w: 3, d: 3, sw: 3.68 },
  { part: 'a12b_tin', cell: [1, 22], w: 4, d: 3, sw: 4.53 },
  { part: 'a12b_wood', cell: [5, 22], w: 4, d: 3, sw: 4.46 },
  { part: 'a12b_stairs', cell: [14, 22], w: 3, d: 3, sw: 3.68 },
  { part: 'a12b_balcony', cell: [17, 22], w: 4, d: 3, sw: 3.75 },
  { part: 'a12b_persimmon', cell: [20, 22], w: 4, d: 3, sw: 4.82 },
  // 左の端（外への出口）の仮の目印：アーチの部品が届くまで、のぼりを2本
  { part: 'a12_nobori_red', cell: [0, 5], w: 1, sw: 0.9 },
  { part: 'a12_nobori_blue', cell: [0, 17], w: 1, sw: 0.9 },
];

/** 頭の上の飾り（仲間の上に重ねる。x・y は絵の左上のマス、w は絵の幅。1-1 の A11_DECOR と同じ形） */
export const A12_DECOR: { room: string; image: string; x: number; y: number; w: number }[] = [
  { room: 'a12h_gate', image: 'part.a12_lanterns_red', x: 5.5, y: 7.2, w: 13 },
  { room: 'a12h_gate', image: 'part.a12_lanterns_white', x: 5.5, y: 12.8, w: 13 },
];

const gate: RoomDef = { id: 'a12h_gate', layout: composeLayout(GATE_GROUND, A12_GATE_PARTS), exits: [], era: 'showa_late', image: 'map.a12h_gate_ground', parts: A12_GATE_PARTS };

const base = AREAS.a12;

/**
 * 新しい1-2（区画の id は a12 のまま）。今は入口の部屋だけの試しなので、敵・宝箱・写しの人・会話のきっかけ・晩の区切りは置かない。
 * ぬしは仮に通りの右の端（中ほどの部屋ができたら、坂の上へ移す）
 */
export const A12_REWORK: AreaDef = {
  ...base,
  rooms: [gate],
  links: [],
  nights: undefined,
  walls: [],
  hunt: undefined,
  chests: [],
  enemies: [],
  talkers: [],
  triggers: [],
  boss: { ...base.boss, room: 'a12h_gate', cell: [22, 11] },
};

/** 新しい1-2 で読む絵 */
export const A12_REWORK_IMAGES: string[] = [
  ...new Set([
    ...A12_REWORK.rooms.map((r) => r.image).filter((x): x is string => !!x),
    ...A12_REWORK.rooms.flatMap((r) => (r.parts ?? []).map((p) => `part.${p.part}`)),
    ...A12_DECOR.map((d) => d.image),
  ]),
];
