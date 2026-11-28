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
  // 2026-11-28（開発者：商店街らしい電灯や小物がない）：店先（5行）に、すずらん灯と昭和の商店街の小物。
  // 手前の建物の側は、屋根が通りの下の方にかかるので、電灯や小物を置いても屋根に隠れる。置くのは上の店の側だけ
  { part: 'a12p_lamp_flower', cell: [4, 5], w: 1, sw: 2.45 },
  { part: 'a12p_lamp_flower', cell: [12, 5], w: 1, sw: 2.45 },
  { part: 'a12p_lamp_flower', cell: [20, 5], w: 1, sw: 2.45 },
  { part: 'a12p_pots', cell: [1, 5], w: 2, sw: 2.2 },
  { part: 'a12p_sign_bench', cell: [5, 5], w: 3, sw: 3 },
  { part: 'a12p_phone', cell: [9, 5], w: 1, sw: 0.95 },
  { part: 'a12p_kakigori', cell: [10, 5], w: 2, sw: 1.9 },
  { part: 'a12p_vending', cell: [13, 5], w: 2, sw: 1.4 },
  { part: 'a12p_post', cell: [15, 5], w: 1, sw: 1 },
  { part: 'a12p_bikes', cell: [16, 5], w: 3, sw: 3.2 },
  { part: 'a12p_crates', cell: [21, 5], w: 2, sw: 2.2 },
];

/** 頭の上の飾り（仲間の上に重ねる。x・y は絵の左上のマス、w は絵の幅。1-1 の A11_DECOR と同じ形） */
export const A12_DECOR: { room: string; image: string; x: number; y: number; w: number }[] = [
  // 2026-11-28（開発者：提灯は違う）：すずらん灯のてっぺんから隣の灯へ、三角の旗と夏の紙飾りを張る
  { room: 'a12h_gate', image: 'part.a12p_pennants', x: -3.5, y: 2.5, w: 8 },
  { room: 'a12h_gate', image: 'part.a12p_streamers', x: 4.5, y: 2.5, w: 8 },
  { room: 'a12h_gate', image: 'part.a12p_pennants', x: 12.5, y: 2.5, w: 8 },
  { room: 'a12h_gate', image: 'part.a12p_streamers', x: 20.5, y: 2.5, w: 8 },
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
