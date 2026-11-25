// 段階292（docs/milestones/M3_explore_feel.md の 14.）：地面も部品で組む試し。裏通りを、地面の一枚絵を使わず部品だけで組む。
// 地面は、下敷きの模様（art/kit_lane/tex_*）と地面に貼る物（art/kit_lane/d_*）を scripts/kit_compose.py で1枚に合成する。
// 家・かべ・柵・木などの縁は、ゲームの中で置く部品（足もとが通れないマスになる）。
import { composeLayout, type RoomDef, type RoomPart } from '../core';
import { LANE_LAYOUT, LANE_PARTS } from './a11Rework';

/** 合成する地面（マスの単位。x・y は貼る物の真ん中） */
export interface KitGround {
  /** 書き出す絵（public/ の下） */
  file: string;
  /** 下敷きの模様と、その1枚が何マス分か */
  base: string;
  tile: number;
  /** 模様を塗る範囲（[左, 上, 右, 下] のマス。縁はぼかす） */
  fills: { tex: string; boxes: [number, number, number, number][] }[];
  /** 明かりのたまり（灯りのそばを暖かく明るく。r は半径のマス）。縁は少し暗くする */
  lights?: { x: number; y: number; r: number; a: number }[];
  /** 貼る物（h を書くと、その高さに伸ばす） */
  decals: { image: string; x: number; y: number; w: number; h?: number; flip?: boolean; alpha?: number }[];
}

// ---- 縁の部品（3つの版で共通の所） ----
const TOP: RoomPart[] = [
  { part: 'e_houses2', cell: [2, 3], w: 8, d: 2, sw: 8.4 },
  { part: 'e_house1', cell: [10, 3], w: 5, d: 2, sw: 5.2 },
  { part: 'e_houses2', cell: [15, 3], w: 7, d: 2, sw: 7.8, flip: true },
  { part: 'e_trees', cell: [21, 3], w: 3, d: 2, sw: 3.6 },
  { part: 'e_trees', cell: [0, 3], w: 2, d: 2, sw: 3.2, flip: true },
];
const SIDES: RoomPart[] = [
  { part: 'e_wall_v', cell: [1, 7], w: 1, d: 4, sw: 0.9 },
  { part: 'e_wall_v', cell: [1, 11], w: 1, d: 4, sw: 0.9 },
  { part: 'e_trees', cell: [0, 15], w: 2, d: 2, sw: 3, flip: true },
  { part: 'e_wall_v', cell: [22, 7], w: 1, d: 4, sw: 0.9 },
  { part: 'e_wall_v', cell: [22, 9], w: 1, d: 2, sw: 0.9 },
  { part: 'e_trees', cell: [20, 15], w: 3, d: 3, sw: 3.6 },
  { part: 'e_trees', cell: [21, 18], w: 3, d: 3, sw: 3.6, flip: true },
  // かべの外は木と茂み（土がむき出しにならないように）
  { part: 'e_trees', cell: [0, 9], w: 1, d: 2, sw: 2.4, flip: true },
  { part: 'e_trees', cell: [0, 13], w: 1, d: 2, sw: 2.4 },
  { part: 'e_trees', cell: [23, 6], w: 1, d: 2, sw: 2.4 },
  { part: 'e_trees', cell: [23, 9], w: 1, d: 2, sw: 2.4, flip: true },
  { part: 'e_trees', cell: [0, 18], w: 1, d: 2, sw: 2, flip: true },
];
const BOTTOM: RoomPart[] = [
  { part: 'e_wall_v', cell: [0, 18], w: 1, d: 3, sw: 0.9 },
  { part: 'e_wall_h', cell: [0, 19], w: 4, sw: 4 },
  { part: 'e_trees', cell: [0, 22], w: 3, d: 3, sw: 3.6 },
  { part: 'e_trees', cell: [0, 23], w: 4, sw: 3.8, flip: true },
  { part: 'e_hedge', cell: [8, 21], w: 1, d: 2, sw: 1.8 },
  { part: 'e_trees', cell: [8, 23], w: 2, d: 2, sw: 3 },
  { part: 'e_roofs', cell: [9, 23], w: 7, d: 3, sw: 7.4 },
  { part: 'e_roofs', cell: [16, 23], w: 8, d: 3, sw: 8, flip: true },
];

/** A：今の裏通りと同じ形（柵の右端のすき間から奥の隅へ） */
const FENCE_A: RoomPart[] = [
  { part: 'e_wall_v', cell: [9, 19], w: 1, d: 4, sw: 0.9 },
  { part: 'fence_h', cell: [10, 17], w: 3, d: 2, sw: 3.1 },
  { part: 'fence_h', cell: [13, 17], w: 3, d: 2, sw: 3.1 },
  { part: 'e_fence_gap', cell: [16, 17], w: 3, d: 2, sw: 4.3 },
  { part: 'e_hedge', cell: [10, 20], w: 4, sw: 4.2 },
  { part: 'e_hedge', cell: [14, 20], w: 4, sw: 4.2 },
  { part: 'e_hedge', cell: [18, 20], w: 3, sw: 3.6, flip: true },
  { part: 'e_trees', cell: [9, 20], w: 1, d: 2, sw: 2 },
];

const GROUND_A: KitGround = {
  file: 'assets/maps/kit_lane_a.webp',
  base: 'tex_earth',
  tile: 8,
  fills: [
    { tex: 'tex_gravel', boxes: [[1, 14, 9, 19], [4, 19, 8, 24]] },
    { tex: 'tex_moss', boxes: [[10, 17, 21, 20], [22, 3, 24, 10], [0, 3, 2, 16], [19, 13, 24, 19], [8, 20, 24, 24], [0, 19, 4, 24]] },
  ],
  lights: [
    // 家の勝手口の灯り・窓
    { x: 4, y: 4.2, r: 4, a: 0.35 },
    { x: 12.5, y: 4.2, r: 3, a: 0.25 },
    { x: 20, y: 4.2, r: 4, a: 0.35 },
    // 屋台の提灯（下の通りへこぼれる）
    { x: 7.5, y: 9.5, r: 6, a: 0.4 },
    { x: 17, y: 9.5, r: 5, a: 0.35 },
    // 広場の明かりが右の出入口からさしこむ
    { x: 24, y: 11.5, r: 7, a: 0.35 },
  ],
  decals: [
    { image: 'd_eaves', x: 6, y: 4.3, w: 8.5, h: 0.9, alpha: 0.4 },
    { image: 'd_eaves', x: 12.5, y: 4.3, w: 5.5, h: 0.9, alpha: 0.4 },
    { image: 'd_eaves', x: 18.5, y: 4.3, w: 7.5, h: 0.9, flip: true, alpha: 0.4 },
    { image: 'd_weeds', x: 4, y: 3.95, w: 4 },
    { image: 'd_weeds', x: 16, y: 3.95, w: 4, flip: true },
    { image: 'd_curb', x: 5, y: 13.7, w: 6 },
    { image: 'd_curb', x: 11, y: 13.7, w: 6 },
    { image: 'd_curb', x: 17, y: 13.7, w: 6, flip: true },
    { image: 'd_ruts', x: 5, y: 17.3, w: 6 },
    { image: 'd_puddle', x: 14.5, y: 11.6, w: 2.2 },
    { image: 'd_manhole', x: 8.5, y: 10.6, w: 1.1 },
    { image: 'd_pebbles', x: 19, y: 6.6, w: 2 },
    { image: 'd_pebbles', x: 3, y: 15.8, w: 2 },
    { image: 'd_paving', x: 21.4, y: 11.4, w: 3.4 },
    { image: 'd_pebbles', x: 22.6, y: 9.6, w: 1.6 },
    { image: 'd_moss', x: 15, y: 18.8, w: 3 },
    { image: 'd_moss', x: 2.6, y: 9.5, w: 1.8 },
    { image: 'd_weeds', x: 12, y: 17.95, w: 4 },
    { image: 'd_weeds', x: 17.5, y: 17.95, w: 3, flip: true },
  ],
};

/**
 * B：形を変えた版（新しい絵を頼まずに、部品の置き直しだけで）。
 * 家を1マス上へ下げて家の裏の路地を広くし、奥の隅への入り口を柵の左の端へ移し、柵の手前の荷置きを右へ寄せる。
 * 右上のかべの切れ目には、自転車置き場
 */
const FENCE_B: RoomPart[] = [
  { part: 'e_wall_v', cell: [9, 19], w: 1, d: 4, sw: 0.9 },
  { part: 'e_fence_gap', cell: [11, 17], w: 3, d: 2, sw: 4.3, flip: true },
  { part: 'fence_h', cell: [14, 17], w: 3, d: 2, sw: 3.1 },
  { part: 'fence_h', cell: [17, 17], w: 3, d: 2, sw: 3.1 },
  { part: 'e_hedge', cell: [10, 20], w: 4, sw: 4.2 },
  { part: 'e_hedge', cell: [14, 20], w: 4, sw: 4.2 },
  { part: 'e_hedge', cell: [18, 20], w: 3, sw: 3.6, flip: true },
  { part: 'e_trees', cell: [9, 20], w: 1, d: 2, sw: 2 },
];
const TOP_B: RoomPart[] = TOP.map((p) => ({ ...p, cell: [p.cell[0], p.cell[1] - 1] }));
const GROUND_B: KitGround = {
  ...GROUND_A,
  file: 'assets/maps/kit_lane_b.webp',
  decals: GROUND_A.decals.map((d) => (d.image === 'd_eaves' || (d.image === 'd_weeds' && d.y < 5) ? { ...d, y: d.y - 1 } : d)),
};

export const LANE_KIT_GROUNDS = { a: GROUND_A, b: GROUND_B };

const laneKitRoom = (id: string, layout: string[], parts: RoomPart[], image: string): RoomDef & { parts: RoomPart[] } => ({
  id,
  layout: composeLayout(layout, parts),
  exits: ['bottom', 'right'],
  exitAt: { bottom: 4, right: 10 },
  exitWidth: { right: 3 },
  era: 'heisei_late',
  image,
  parts,
});

const PARTS_A = [...LANE_PARTS, ...TOP, ...SIDES, ...BOTTOM, ...FENCE_A];

/** B の荷置き：柵のすき間（左の端）をあけて、右へ寄せる */
const STORAGE_B: RoomPart[] = [
  { part: 'folding_stack', cell: [12, 15], w: 2, sw: 1.8 },
  { part: 'lantern_boxes', cell: [14, 15], w: 2, sw: 1.6 },
  { part: 'cooler', cell: [16, 15], w: 1, sw: 1.1 },
  { part: 'kegs', cell: [17, 15], w: 2, sw: 1.7 },
  { part: 'bicycles', cell: [20, 6], w: 2, sw: 2 },
];
const STALLS = LANE_PARTS.filter((p) => p.part.startsWith('s_'));
const YARD = LANE_PARTS.filter((p) => ['food_cart', 'generator2', 'crates_tarp', 'box_stack', 'trash'].includes(p.part));
const PARTS_B = [...STALLS, ...YARD.filter((p) => p.part !== 'trash'), ...STORAGE_B, ...TOP_B, ...SIDES, ...BOTTOM, ...FENCE_B];
const LAYOUT_B = LANE_LAYOUT.map((row, r) => (r === 3 ? '##' + '.'.repeat(20) + '##' : r === 16 || r === 17 ? row.slice(0, 10) + '.' + row.slice(11, 19) + '#' + row.slice(20) : row));

/** C：3晩目の版。屋台は片付いてシートがかかり、荷さばき場の荷車も帰った（部品の入れ替えだけ） */
const CLOSED: RoomPart[] = [
  { part: 'tarp_pile', cell: [3, 8], w: 6, d: 2, sw: 6.3 },
  { part: 'tarp_table', cell: [9, 8], w: 2, sw: 2 },
  { part: 'crates_tarp', cell: [11, 8], w: 1, sw: 1.4 },
  { part: 'tarp_pile', cell: [14, 8], w: 6, d: 2, sw: 6.3 },
];
const PARTS_C = [...CLOSED, ...YARD.filter((p) => p.part !== 'food_cart'), ...LANE_PARTS.filter((p) => ['folding_stack', 'lantern_boxes', 'cooler', 'kegs', 'crates_red'].includes(p.part)), ...TOP, ...SIDES, ...BOTTOM, ...FENCE_A];

/** 裏通りを部品だけで組んだ版（デバッグメニューで、今の版と切り替えて見比べる） */
export const LANE_KIT_ROOMS = {
  a: laneKitRoom('fest2_lane', LANE_LAYOUT, PARTS_A, 'map.kit_lane_a'),
  b: laneKitRoom('fest2_lane', LAYOUT_B, PARTS_B, 'map.kit_lane_b'),
  c: laneKitRoom('fest2_lane', LANE_LAYOUT, PARTS_C, 'map.kit_lane_a'),
};

/** 部品の版の絵（新しい1-1 の絵と一緒に読む） */
export const LANE_KIT_IMAGES: string[] = [...new Set(Object.values(LANE_KIT_ROOMS).flatMap((r) => [r.image ?? '', ...r.parts.map((p) => `part.${p.part}`)]).filter((x) => !!x))];

/** 部品の版に切り替えた区画（裏通りの部屋だけ差し替える） */
export function withLaneKit<T extends { rooms: RoomDef[] }>(area: T, kit: keyof typeof LANE_KIT_ROOMS | null): T {
  if (!kit) return area;
  return { ...area, rooms: area.rooms.map((r) => (r.id === 'fest2_lane' ? LANE_KIT_ROOMS[kit] : r)) };
}
