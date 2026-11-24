import type { AreaDef, RoomDef, RoomPart } from '../core/explore';
import { composeLayout } from '../core/explore';
import { AREAS } from './areas';
import { box } from './rooms';
import { ITEMS } from './weapons';

// 段階262（docs/milestones/M3_explore_feel.md の 5.・5-7）：1-1 の新しい配置の試し。デバッグメニューの「新しい1-1」で、今の 1-1 の代わりに使う。
// 部屋の絵はまだないので、マス目で描く（部屋の絵がない時の描き方）。文字の地図は scripts/a11_rework_layouts.py が作った
// docs/sketches/a11_rework/<部屋>.txt と同じ（見取り図は docs/sketches/a11_rework/overview.png）。
// 敵の戦闘・コマ・写しの人の台詞・途中の会話・ぬしは今の 1-1 のまま使い、置く所だけ変える。
// 見つかる範囲（段階263）は、この区画の時だけ探索の画面が入れる。仕掛けと仲間の力（段階264）は A11_REWORK の gates・gadgets

const GATE_LAYOUT = [
  '##########....##########',
  '#........#....#.......##',
  '#........#....#.......##',
  '#........#....#.......##',
  '#........#....#.......##',
  '#.....................##',
  '#.....................##',
  '......................##',
  '......................##',
  '......................##',
  '......................##',
  '#.....................##',
  '#.....................##',
  '#########......#########',
  '#########......#########',
  '#########......#########',
  '#########......#########',
  '##........#..#........##',
  '##....................##',
  '##....................##',
  '##.........S..........##',
  '##....................##',
  '##########....##########',
  '##########....##########',
];

/** gate の部品（段階276 で案3に作り直した）。鳥居（A11_DECOR）の柱の根もと (10,17)・(13,17) は GATE_LAYOUT で通れないマスにしてある */
export const GATE_PARTS: RoomPart[] = [
  // 段階276（案3）：屋台は横に走る通りに並べる。通りの上は表（下を向く）、下は裏（上を向く屋台の裏側）。
  // 焼きそばとおもちゃの間は、奥の物置へ抜ける2マスのすき間。通りの右の突き当たりはふさぐ（開発者：右にも道が続いて見えた）
  // 2026-11-24（開発者：屋台の大きさがそろっていない）：正面の屋台はどれも幅3マス
  { part: 's_takoyaki', cell: [1, 6], w: 3, d: 2, sw: 3.1 },
  { part: 's_ringo', cell: [4, 6], w: 3, d: 2, sw: 3.1 },
  { part: 's_wataame', cell: [7, 6], w: 3, d: 2, sw: 3.1 },
  { part: 's_yakisoba', cell: [14, 6], w: 3, d: 2, sw: 3.1 },
  { part: 's_toys', cell: [19, 6], w: 3, d: 2, sw: 3.1 },
  // 突き当たり：通りの方（左）を向いた横向きのりんご飴の屋台でふさぐ（L字の角の屋台は不自然なので使わない。2026-11-24 開発者）
  { part: 'side_ringo_l', cell: [21, 10], w: 2, d: 3, sw: 2.2 },
  { part: 'crates_tarp', cell: [21, 7], w: 2, sw: 1.6 },
  { part: 'cedar', cell: [23, 8], w: 1, d: 2, sw: 2.4 },
  { part: 'bush', cell: [23, 10], w: 1, sw: 1.4 },
  { part: 'ramune_tub', cell: [9, 8], w: 1, sw: 1.1 },
  { part: 'b_small_red', cell: [1, 12], w: 2, d: 2, sw: 2.1 },
  { part: 'b_wide_stripe', cell: [3, 12], w: 4, d: 2, sw: 4.1 },
  { part: 'b_tent', cell: [7, 12], w: 3, d: 2, sw: 3 },
  { part: 'b_wood', cell: [14, 12], w: 3, d: 2, sw: 3.1 },
  { part: 'b_blue', cell: [17, 12], w: 3, d: 2, sw: 3.1 },
  { part: 'b_green', cell: [20, 12], w: 2, d: 2, sw: 2.1 },
  { part: 'tree', cell: [1, 15], w: 3, sw: 3 },
  { part: 'tsukubai', cell: [5, 15], w: 2, sw: 1.6 },
  { part: 'bonsai', cell: [7, 14], w: 1, sw: 1.1 },
  { part: 'stone_lantern', cell: [8, 16], w: 1, sw: 1 },
  { part: 'stone_lantern', cell: [15, 16], w: 1, sw: 1 },
  { part: 'hydrangea', cell: [16, 14], w: 1, sw: 1.3 },
  { part: 'tree', cell: [18, 16], w: 3, sw: 3 },
  // 着いた広場：鳥居の両わきに狛犬とお供えの酒だる。左は休み処（床几と赤い傘・ラムネの氷水・ごみ箱）、右は自転車置き場
  { part: 'komainu_r', cell: [9, 18], w: 1, sw: 1.2 },
  { part: 'komainu_l', cell: [14, 18], w: 1, sw: 1.2 },
  { part: 'sake_barrels', cell: [7, 18], w: 2, sw: 1.6 },
  { part: 'sake_barrels', cell: [15, 18], w: 2, sw: 1.6 },
  { part: 'lantern_stand', cell: [2, 18], w: 2, sw: 1.8 },
  { part: 'tea_bench', cell: [2, 21], w: 2, sw: 1.9 },
  { part: 'tea_bench', cell: [4, 21], w: 2, sw: 1.9 },
  { part: 'ramune_tub', cell: [6, 21], w: 1, sw: 1.1 },
  { part: 'trash', cell: [8, 21], w: 1, sw: 1.2 },
  { part: 'lantern_stand', cell: [20, 18], w: 2, sw: 1.8 },
  { part: 'bicycles', cell: [15, 21], w: 2, sw: 2 },
  { part: 'bicycles', cell: [17, 21], w: 2, sw: 2 },
  { part: 'bicycles', cell: [19, 21], w: 2, sw: 2 },
  { part: 'crates_tarp', cell: [2, 2], w: 2, sw: 1.7 },
  { part: 'firewood', cell: [4, 2], w: 1, sw: 1.2 },
  { part: 'lantern_boxes', cell: [5, 2], w: 2, sw: 1.6 },
  { part: 'sake_barrels', cell: [16, 2], w: 2, sw: 1.6 },
  { part: 'generator2', cell: [18, 2], w: 1, sw: 1.1 },
  { part: 'crates_red', cell: [19, 2], w: 1, sw: 0.9 },
  { part: 'nobori', cell: [0, 6], w: 1, sw: 0.9 },
];

/**
 * 屋台の裏（段階273：地面の絵と部品で組む試し）。BACKYARD_GROUND は物のない地面の絵の歩ける所（縁の木・木の囲い・石垣と石段だけ）。
 * 部品の足もとは composeLayout で通れないマスにする
 */
const BACKYARD_GROUND = [
  '##############....######',
  '##############....######',
  '###############..#######',
  '####.................###',
  '###:..................##',
  '###:..................##',
  '###:..................##',
  '##......................',
  '##......................',
  '##......................',
  '##......................',
  '###...................##',
  '###...................##',
  '###...................##',
  '###...................##',
  '###...................##',
  '###...................##',
  '###...................##',
  '###############...######',
  '###############...######',
  '#######..............###',
  '#########...........####',
  '##########.........#####',
  '########################',
];

/** 屋台の裏の部品（段階273）。cell は足もとの左下、w・d は足もとの幅・奥行き、sw は絵の幅（マス） */
export const BACKYARD_PARTS: RoomPart[] = [
  { part: 'tent_blue', cell: [4, 5], w: 3, d: 2, sw: 3.2 },
  { part: 'tent_red', cell: [7, 5], w: 3, d: 2, sw: 3.2 },
  { part: 'tent_yellow', cell: [10, 5], w: 3, d: 2, sw: 3.2 },
  { part: 'poles', cell: [13, 5], w: 1, sw: 1 },
  { part: 'crates_red', cell: [17, 5], w: 1, sw: 1 },
  { part: 'shed', cell: [18, 5], w: 3, d: 2, sw: 3.1 },
  { part: 'bush', cell: [20, 3], w: 1, sw: 1.3 },
  { part: 'folding_stack', cell: [3, 9], w: 2, sw: 1.9 },
  { part: 'box_stack', cell: [3, 12], w: 2, sw: 1.9 },
  { part: 'drum', cell: [5, 12], w: 1, sw: 0.9 },
  { part: 'buckets', cell: [5, 13], w: 1, sw: 1.1 },
  { part: 'cooler', cell: [18, 11], w: 1, sw: 1.1 },
  { part: 'rope', cell: [12, 13], w: 1, sw: 1.2, walk: true },
  { part: 'kegs', cell: [15, 13], w: 2, sw: 1.7 },
  { part: 'tarp_pile', cell: [4, 16], w: 6, d: 2, sw: 6.3 },
  { part: 'crates_yellow', cell: [12, 16], w: 1, sw: 1 },
  { part: 'tarp_table', cell: [14, 16], w: 2, sw: 2 },
  { part: 'rock', cell: [19, 17], w: 1, sw: 1 },
  { part: 'house_corner', cell: [20, 16], w: 4, d: 3, sw: 4 },
];

const LANE_LAYOUT = [
  '########################',
  '########################',
  '##################...###',
  '###...................##',
  '###...................##',
  '###..#..###########...##',
  '###..#..###########...##',
  '###..#..###########...##',
  '###..#..###########...##',
  '###..#..###########...##',
  '###..#..:::########...##',
  '###..#..:::########.....',
  '###..#..:::########.....',
  '###..#..###########.....',
  '###..#..###########.....',
  '###..#..###########...##',
  '###..#..###########...##',
  '###..#..###########...##',
  '#.....................##',
  '#.....................##',
  '#####...............####',
  '######....##############',
  '######....##############',
  '######....##############',
];

/** lane の部品（段階274） */
export const LANE_PARTS: RoomPart[] = [
  // 段階275：真ん中のかたまりは、屋台の裏（外向き）でふちを囲み、中に荷物を詰める
  { part: 'stall_back', cell: [8, 7], w: 3, d: 2, sw: 3.2 },
  { part: 'stall_back', cell: [11, 7], w: 3, d: 2, sw: 3.2 },
  { part: 'stall_back', cell: [14, 7], w: 3, d: 2, sw: 3.2 },
  { part: 'kegs', cell: [17, 7], w: 2, sw: 1.7 },
  { part: 'water_barrel', cell: [10, 10], w: 1, sw: 0.9 },
  { part: 'tarp_pile', cell: [11, 11], w: 6, d: 2, sw: 6.3 },
  { part: 'crates_red', cell: [17, 10], w: 1, sw: 1 },
  { part: 'cooler', cell: [18, 11], w: 1, sw: 1 },
  { part: 'chairs', cell: [8, 12], w: 2, sw: 1.8 },
  { part: 'lantern_boxes', cell: [11, 14], w: 2, sw: 1.9 },
  { part: 'box_stack', cell: [13, 14], w: 2, sw: 1.9 },
  { part: 'drum', cell: [15, 14], w: 1, sw: 0.9 },
  { part: 'buckets', cell: [16, 14], w: 1, sw: 1 },
  { part: 'folding_stack', cell: [8, 15], w: 2, sw: 1.8 },
  { part: 'stall_back', cell: [8, 17], w: 3, d: 2, sw: 3.2 },
  { part: 'stall_back', cell: [11, 17], w: 3, d: 2, sw: 3.2 },
  { part: 'stall_back', cell: [14, 17], w: 3, d: 2, sw: 3.2 },
  { part: 'tarp_table', cell: [17, 17], w: 2, sw: 2 },
  { part: 'drum', cell: [21, 9], w: 1, sw: 0.9 },
  { part: 'grass', cell: [1, 19], w: 1, sw: 1.2 },
];

const PLAZA_LAYOUT = [
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##....................##',
  '##....................##',
  '##.........P..........##',
  '##....................##',
  '##....................##',
  '##....................##',
  '##....................##',
  '........................',
  '........................',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '###........P........####',
  '###.................####',
  '##########....##########',
  '##########....##########',
  '##########....##########',
];

/** plaza の部品（段階274） */
export const PLAZA_PARTS: RoomPart[] = [
  // 段階282（案3）：真ん中にやぐら。屋台は広場のふちに、広場を向いて（上は表・左右は横向き・下は裏）
  { part: 'yagura', cell: [10, 14], w: 4, d: 3, sw: 4 },
  { part: 's_takoyaki', cell: [2, 5], w: 3, d: 2, sw: 3.1 },
  { part: 's_wanage', cell: [5, 5], w: 3, d: 2, sw: 3.1 },
  { part: 'lantern_boxes', cell: [8, 4], w: 1, sw: 1.3 },
  { part: 's_kakigori', cell: [14, 5], w: 3, d: 2, sw: 3.1 },
  { part: 's_wataame', cell: [17, 5], w: 3, d: 2, sw: 3.1 },
  { part: 'crates_tarp', cell: [20, 4], w: 2, sw: 1.6 },
  { part: 'side_takoyaki_r', cell: [1, 15], w: 2, d: 3, sw: 2.2 },
  { part: 'side_yakisoba_r', cell: [1, 18], w: 2, d: 3, sw: 2.2 },
  { part: 'side_ringo_l', cell: [21, 15], w: 2, d: 3, sw: 2.2 },
  { part: 'side_takoyaki_l', cell: [21, 18], w: 2, d: 3, sw: 2.2 },
  { part: 'b_blue', cell: [3, 20], w: 3, d: 2, sw: 3.1 },
  { part: 'b_tent', cell: [6, 20], w: 3, d: 2, sw: 3.1 },
  { part: 'b_wood', cell: [14, 20], w: 3, d: 2, sw: 3.1 },
  { part: 'b_green', cell: [17, 20], w: 3, d: 2, sw: 3.1 },
  // 石段の下の休み処
  { part: 'tea_bench', cell: [7, 8], w: 2, sw: 1.9 },
  { part: 'tea_bench', cell: [15, 8], w: 2, sw: 1.9 },
  { part: 'ramune_tub', cell: [17, 8], w: 1, sw: 1.1 },
  { part: 'stone_lantern', cell: [9, 3], w: 1, sw: 1 },
  { part: 'stone_lantern', cell: [14, 3], w: 1, sw: 1 },
  { part: 'trash', cell: [20, 9], w: 1, sw: 1.2 },
];

const EAST_LAYOUT = [
  '########################',
  '########################',
  '########################',
  '##################...###',
  '##...................###',
  '##.#################.###',
  '##.#################.###',
  '##...................###',
  '......................##',
  '......................##',
  '#.....................##',
  '#.########....#######.##',
  '#.########....#######.##',
  '#.########....#######.##',
  '#.########....#######.##',
  '#.###################.##',
  '#.....................##',
  '#.....................##',
  '#.....................##',
  '################....####',
  '################....####',
  '################....####',
  '########################',
  '########################',
];

/** east の部品（段階274） */
export const EAST_PARTS: RoomPart[] = [
  // 段階281：黒い狐・金の狐のお面屋は、仕掛けでなく飾り（白い狐の店だけが落とし物に困っている）
  { part: 'mask_black', cell: [6, 6], w: 3, d: 2, sw: 3.1 },
  { part: 'mask_gold', cell: [9, 6], w: 3, d: 2, sw: 3.1 },
  // 段階279（案3）：上の屋台の列（お面屋3軒は仕掛けの絵・射的・おもちゃ・のぼり）は表の通りを向く。その裏の1マスの道が隠し通路
  // （入口は左の端の、屋台と家の壁のすき間。誘導しない。家の壁の上を歩かないよう、すき間は3列目）。真ん中は屋台の裏の列と、板でふさいだ囲い。下の通りの左に金魚すくい
  { part: 'shateki', cell: [12, 6], w: 5, d: 2, sw: 5.2 },
  { part: 's_toys', cell: [17, 6], w: 3, d: 2, sw: 3.2 },
  // 隠し通路の右の端は、荷物でふさぐ。その先の奥（右上）は、止まった自販機の向こう（みおが動かすと通れる。2026-11-24 開発者）
  { part: 'crates_red', cell: [18, 4], w: 1, sw: 0.9 },
  { part: 'b_small_red', cell: [2, 12], w: 2, d: 2, sw: 2.1 },
  { part: 'b_wide_stripe', cell: [4, 12], w: 4, d: 2, sw: 4.1 },
  { part: 'lantern_boxes', cell: [8, 12], w: 1, d: 2, sw: 1.3 },
  // 屋台の裏の物置き：一つずつぽつんと置かず、かたまりで（2026-11-24 開発者）
  { part: 'tarp_pile', cell: [2, 13], w: 5, d: 2, sw: 4.6 },
  { part: 'crates_tarp', cell: [7, 13], w: 1, sw: 1.2 },
  { part: 'b_wood', cell: [15, 12], w: 3, d: 2, sw: 3.1 },
  { part: 'b_blue', cell: [18, 12], w: 3, d: 2, sw: 3.1 },
  { part: 'folding_stack', cell: [15, 13], w: 2, d: 2, sw: 1.6 },
  { part: 'box_stack', cell: [17, 13], w: 2, d: 2, sw: 1.6 },
  { part: 'generator2', cell: [19, 13], w: 1, d: 2, sw: 1 },
  { part: 'kingyo', cell: [2, 17], w: 5, d: 2, sw: 5.2 },
  { part: 'tea_bench', cell: [12, 16], w: 2, sw: 1.9 },
  { part: 'ramune_tub', cell: [14, 16], w: 1, sw: 1.1 },
  { part: 'trash', cell: [20, 16], w: 1, sw: 1.2 },
  { part: 'lantern_stand', cell: [16, 19], w: 1, sw: 1.6 },
];

const WOODS_LAYOUT = [
  '########################',
  '########################',
  '########################',
  '####....##....##....####',
  '##....................##',
  '##....................##',
  '##......###.####......##',
  '#....######.#######....#',
  '#....######.#######....#',
  '#....######.#######....#',
  '.....######..######.....',
  '........................',
  '.....######.#######.....',
  '#....######.#######....#',
  '#....######.#######....#',
  '##......###.####......##',
  '##......###.####......##',
  '##......###.####......##',
  '###..................###',
  '###..................###',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
];

/** woods の部品（段階274） */
export const WOODS_PARTS: RoomPart[] = [
  { part: 'stone_lantern', cell: [8, 4], w: 1, sw: 1 },
  { part: 'stone_lantern', cell: [16, 4], w: 1, sw: 1 },
  { part: 'grass', cell: [6, 16], w: 1, sw: 1.2 },
  { part: 'hydrangea', cell: [17, 16], w: 1, sw: 1.3 },
  { part: 'big_rock', cell: [20, 18], w: 1, sw: 1.4 },
];

const room = (id: string, layout: string[], exits: RoomDef['exits'], exitAt?: RoomDef['exitAt'], image?: string): RoomDef => ({ id, layout, exits, era: 'heisei_late', ...(exitAt ? { exitAt } : {}), ...(image ? { image } : {}) });

/** 新しい1-1の部屋（6つ。屋台の裏通りは新しい部屋） */
export const A11_REWORK_ROOMS = {
  gate: { ...room('fest2_gate', composeLayout(GATE_LAYOUT, GATE_PARTS), ['top', 'left'], { left: 7 }, 'map.fest3_gate_ground'), parts: GATE_PARTS },
  backyard: { ...room('fest2_backyard', composeLayout(BACKYARD_GROUND, BACKYARD_PARTS), ['right', 'top'], { right: 7, top: 14 }, 'map.fest2_backyard_ground'), parts: BACKYARD_PARTS },
  lane: { ...room('fest2_lane', composeLayout(LANE_LAYOUT, LANE_PARTS), ['bottom', 'right'], { bottom: 6, right: 11 }, 'map.fest2_lane_ground'), parts: LANE_PARTS },
  plaza: { ...room('fest2_plaza', composeLayout(PLAZA_LAYOUT, PLAZA_PARTS), ['bottom', 'left', 'right', 'top'], { left: 10, right: 10 }, 'map.fest3_plaza_ground'), exitWidth: { left: 2, right: 2 }, parts: PLAZA_PARTS },
  east: { ...room('fest2_east', composeLayout(EAST_LAYOUT, EAST_PARTS), ['left'], { left: 8 }, 'map.fest3_east_ground'), exitWidth: { left: 2 }, parts: EAST_PARTS },
  woods: { ...room('fest2_woods', composeLayout(WOODS_LAYOUT, WOODS_PARTS), ['bottom'], undefined, 'map.fest2_woods_ground'), parts: WOODS_PARTS },
};

/** 部屋の名前（全体の地図と、部屋に入った時の帯） */
export const A11_REWORK_ROOM_NAMES: Record<string, string> = {
  fest2_gate: '縁日の入口',
  fest2_backyard: '屋台の裏',
  fest2_lane: '屋台の裏通り',
  fest2_plaza: '縁日の広場',
  fest2_east: '東の屋台',
  fest2_woods: '社の森',
};

const R = A11_REWORK_ROOMS;
const base = AREAS.a11;

/**
 * 新しい1-1（区画の id は a11 のまま。物語の流れ・セーブ・会話のきっかけを同じに使うため）。
 * 部屋が輪になる：入口 → 屋台の裏 → 裏通り → 広場 → 入口。裏通りは2晩目から（両側の出入口の手前にノイズの壁）
 */
export const A11_REWORK: AreaDef = {
  ...base,
  rooms: [R.gate, R.backyard, R.lane, R.plaza, R.east, R.woods],
  links: [
    { a: { room: 'fest2_gate', side: 'top' }, b: { room: 'fest2_plaza', side: 'bottom' } },
    { a: { room: 'fest2_gate', side: 'left' }, b: { room: 'fest2_backyard', side: 'right' } },
    { a: { room: 'fest2_backyard', side: 'top' }, b: { room: 'fest2_lane', side: 'bottom' } },
    { a: { room: 'fest2_lane', side: 'right' }, b: { room: 'fest2_plaza', side: 'left' } },
    { a: { room: 'fest2_plaza', side: 'right' }, b: { room: 'fest2_east', side: 'left' } },
    { a: { room: 'fest2_plaza', side: 'top' }, b: { room: 'fest2_woods', side: 'bottom' } },
  ],
  // 段階268：思い出を返した時の札（リカバリー）は、広場の提灯の仕掛けのごほうびへ移した（スナップの数は変えない）
  chainReturnSnaps: [],
  // 2晩目は広場の下のチェックポイントから、3晩目は石段の下のチェックポイントから
  nights: [{ koma: 3 }, { koma: 6, start: { room: 'fest2_plaza', cell: [11, 19] } }, { start: { room: 'fest2_plaza', cell: [11, 5] } }],
  walls: [
    // 広場の下から石段の下へ（2晩目から）・広場の右の出入口（東の屋台。2晩目から）・石段（3晩目から）
    { id: 'a11_wall_east', room: 'fest2_plaza', cells: box(22, 22, 10, 11), opens: 2 },
    { id: 'a11_wall_shrine', room: 'fest2_plaza', cells: box(10, 13, 2, 2), opens: 3 },
    // 屋台の裏通りの両側の出入口の手前（2晩目から）
    { id: 'a11_wall_lane_bottom', room: 'fest2_lane', cells: box(6, 9, 21, 21), opens: 2 },
    { id: 'a11_wall_lane_right', room: 'fest2_lane', cells: box(22, 22, 11, 14), opens: 2 },
  ],
  hunt: {
    gathers: [
      { id: 'a11_gather_goldfish', room: 'fest2_east', cell: [12, 14], items: [ITEMS.goldfishScale.id, ITEMS.goldfishScale.id] },
      { id: 'a11_gather_ramune', room: 'fest2_plaza', cell: [21, 8], items: [ITEMS.balloonShard.id, ITEMS.cottonThread.id] },
      { id: 'a11_gather_yukata', room: 'fest2_gate', cell: [20, 2], items: [ITEMS.maskShard.id] },
      { id: 'a11_gather_back', room: 'fest2_backyard', cell: [19, 21], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
    ],
  },
  // 宝箱は7つ（隠し通路の奥を足した。入口の脇道の奥・停電の路地の奥・射的の裏・射的の裏の行き止まり・やぐらの前・森の右のほこら）
  chests: [
    { id: 'a11_chest_gate', room: 'fest2_gate', cell: [20, 2], items: [ITEMS.cottonThread.id] },
    { id: 'a11_chest_back', room: 'fest2_backyard', cell: [19, 21], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
    { id: 'a11_chest_goldfish', room: 'fest2_east', cell: [12, 14], night: 2, items: [ITEMS.goldfishScale.id] },
    // 段階279：屋台の裏の隠し通路の奥（誘導しない。たまたま気づいた人へ）
    // 止まった自販機の向こうの奥（みおが仲間になってから、また来た時に）
    { id: 'a11_chest_vending', room: 'fest2_east', cell: [19, 3], night: 2, items: [ITEMS.goldfishScale.id, ITEMS.balloonShard.id] },
    { id: 'a11_chest_hidden', room: 'fest2_east', cell: [17, 4], night: 2, items: [ITEMS.goldfishFin.id, ITEMS.maskShard.id] },
    { id: 'a11_chest_new2', room: 'fest2_plaza', cell: [21, 8], night: 3, items: [ITEMS.goldfishFin.id, ITEMS.cottonThread.id] },
    // 段階281：池の真ん中の石の上（霧が晴れると渡れる）。中身は、思い出を返した時からここへ移したリカバリー
    { id: 'a11_chest_new1', room: 'fest2_woods', cell: [12, 10], night: 3, items: [ITEMS.balloonShard.id], chainSnaps: ['a11_recovery'] },
    { id: 'a11_chest_woods', room: 'fest2_woods', cell: [22, 11], night: 3, items: [ITEMS.goldfishFin.id, ITEMS.maskShard.id] },
  ],
  enemies: [
    // ---- 1晩目 ----
    { id: 'a11_e_gate', room: 'fest2_gate', patrol: [[11, 4], [11, 16]], battle: 'a11_n1_gate' },
    // 段階281：入口の待ち伏せの出来事はやめた。屋台通りを見回る（地図の出来事 ev_gate_ambush）
    { id: 'a11_e_gate_chase', room: 'fest2_gate', move: 'chase', patrol: [[14, 9], [19, 9]], battle: 'a11_n1_chaser' },
    { id: 'a11_e_back', room: 'fest2_backyard', patrol: [[7, 9], [13, 9], [13, 13], [7, 13]], battle: 'a11_n1_back' },
    // 発電機を直して明かりがつくと、暗がりから現れて逃げる（地図の出来事 ev_generator）
    { id: 'a11_e_runner', room: 'fest2_backyard', move: 'flee', hidden: true, patrol: [[12, 21]], battle: 'a11_runner' },
    { id: 'a11_e_road', room: 'fest2_gate', patrol: [[1, 8], [8, 8]], battle: 'a11_n1_road' },
    { id: 'a11_e_plaza', room: 'fest2_plaza', move: 'chase', patrol: [[5, 13], [5, 17]], battle: 'a11_n1_plaza' },
    // ---- 2晩目 ----
    { id: 'a11_e_corridor', room: 'fest2_plaza', night: 2, patrol: [[3, 8], [6, 8]], battle: 'a11_n2_corridor' },
    { id: 'a11_e_west1', room: 'fest2_lane', night: 2, move: 'chase', patrol: [[20, 5], [20, 17]], battle: 'a11_n2_west1' },
    { id: 'a11_e_west2', room: 'fest2_lane', night: 2, patrol: [[8, 3], [16, 3]], battle: 'a11_n2_west2' },
    // 金魚すくいの水槽が割れて、あふれ出す（地図の出来事 ev_tank）
    { id: 'a11_e_east1', room: 'fest2_east', night: 2, hidden: true, patrol: [[13, 17], [8, 17]], battle: 'a11_n2_east1' },
    { id: 'a11_e_east2', room: 'fest2_east', night: 2, move: 'chase', hidden: true, patrol: [[21, 11], [21, 17]], battle: 'a11_n2_east2' },
    // 金魚すくいの屋台の前の番人（2晩目の山場。戦う前の会話）
    { id: 'a11_e_guard', room: 'fest2_east', night: 2, move: 'guard', patrol: [[17, 20]], battle: 'a11_n2_guard', scene: 'a11_guard' },
    // ---- 3晩目 ----
    { id: 'a11_e_steps', room: 'fest2_plaza', night: 3, patrol: [[15, 7], [18, 7]], battle: 'a11_n3_steps' },
    { id: 'a11_e_right', room: 'fest2_plaza', night: 3, move: 'chase', patrol: [[18, 13], [18, 17]], battle: 'a11_n3_right' },
    { id: 'a11_e_woods1', room: 'fest2_woods', night: 3, move: 'chase', patrol: [[16, 15], [20, 15]], battle: 'a11_n3_woods1' },
    { id: 'a11_e_woods2', room: 'fest2_woods', night: 3, patrol: [[14, 4], [20, 4]], battle: 'a11_n3_woods2' },
  ],
  boss: { ...base.boss, room: 'fest2_woods', cell: [12, 3] },
  // 写しの人（段階265 のくれる物つき）：1つの部屋の1つの晩に1人まで（広場の1晩目と社の森は2人）
  talkers: [
    { id: 'a11_voice_yukata', room: 'fest2_gate', cell: [6, 18], until: 1, scene: 'a11_voice_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_fuel', text: '浴衣の女の人「さっき小さな女の子が、屋台の裏の暗がりへ走っていったの。発電機が止まって、裏は真っ暗よ。燃料なら物置の木箱にあるって、屋台の人が言ってたわ」\n（右上の地図に印が付いた）' } },
    { id: 'a11_voice_cotton', room: 'fest2_plaza', cell: [19, 7], until: 1, scene: 'a11_voice_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「甘いの食べて、ひと休みしな」\n（HP・MP が少し回復した）' } },
    { id: 'a11_voice_goldfish', room: 'fest2_plaza', cell: [6, 17], until: 1, scene: 'a11_voice_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'goldfishNoise', element: 'ice', text: '金魚すくいのおじさん「さっきの金魚みたいな砂嵐、冷たいのが苦手みたいだったよ」\n（金魚ノイズの弱点：氷 が分かった）' } },
    { id: 'a11_voice2_cotton', room: 'fest2_plaza', cell: [18, 7], night: 2, until: 2, scene: 'a11_voice2_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「疲れた顔してるね。ほら、ひと口」\n（HP・MP が少し回復した）' } },
    { id: 'a11_voice2_yukata', room: 'fest2_lane', cell: [9, 11], night: 2, until: 2, scene: 'a11_voice2_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_mask', text: '浴衣の女の人「東の屋台のお面屋さん、白い狐のお面をなくして困ってたわ」\n（右上の地図に印が付いた）' } },
    { id: 'a11_voice2_goldfish', room: 'fest2_east', cell: [8, 18], night: 2, until: 2, scene: 'a11_voice2_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'maskNoise', element: 'fire', text: '金魚すくいのおじさん「お面の砂嵐は、火に弱いらしいぜ」\n（お面ノイズの弱点：火 が分かった）' } },
    { id: 'a11_voice3_yukata', room: 'fest2_plaza', cell: [8, 7], night: 3, scene: 'a11_voice3_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'm_pond', text: '浴衣の女の人「社の森の池？ 霧の近くに、いやな砂嵐がうろついてたわ。あの霧、あれのせいじゃないかしら」\n（右上の地図に印が付いた）' } },
    { id: 'a11_voice3_goldfish', room: 'fest2_woods', cell: [7, 18], night: 3, scene: 'a11_voice3_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'cottonNoise', element: 'thunder', text: '金魚すくいのおじさん「わたあめの砂嵐は、ビリッとくるのが苦手でな」\n（わたあめノイズの弱点：雷 が分かった）' } },
    { id: 'a11_voice3_cotton', room: 'fest2_woods', cell: [17, 17], night: 3, scene: 'a11_voice3_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「ここまで来たんだ、もうひと踏ん張り」\n（HP・MP が少し回復した）' } },
  ],
  // 仕掛けの扉（段階264）：仕掛けを解くまで通れない
  gates: [
    { id: 'g_dark', room: 'fest2_backyard', cells: box(7, 20, 20, 22), by: 'p_generator', look: 'dark', label: '停電で真っ暗' },
    { id: 'g_gap', room: 'fest2_east', cells: box(10, 13, 11, 11), by: 'p_mask', look: 'fence', label: '屋台の裏の囲いの板' },
    // 段階281：池の霧は、池の思い出を食べている砂嵐（a11_e_woods1）。倒すと晴れる（扉の by は、仕掛けの flag か、倒した敵の id）
    { id: 'g_stones', room: 'fest2_woods', cells: [...box(11, 11, 6, 17), ...box(4, 10, 11, 11), ...box(12, 19, 11, 11)], by: 'a11_e_woods1', look: 'water', label: '池の霧' },
  ],
  // 仕掛けと仲間の力（段階264・268）。1部屋に1つまで。考える所：木箱はテントの色、お面は店の狐の色、提灯は思い出の一枚の順
  gadgets: [
    // 屋台の裏：木箱が3つ。赤いテントの横の箱に、発電機のつまみ（浴衣の女の人の手がかり）
    // 段階281：物置の木箱に、発電機の燃料の缶（浴衣の女の人が教えてくれる）
    { id: 'p_fuel', room: 'fest2_backyard', cell: [8, 6], kind: 'item', mark: '缶', label: '物置の木箱', done: '物置の木箱の中に、発電機の燃料の缶があった！' },
    { id: 'p_generator', room: 'fest2_backyard', cell: [10, 11], kind: 'use', needs: 'p_fuel', mark: '発', label: '発電機', need: '止まった発電機。……燃料が切れている', done: '燃料を入れて紐を引くと、発電機がうなりを上げた！' },
    // 屋台の裏通り：坂の上の荷車を、上から押す（2晩目）。転がり落ちて板のかべを突き破る
    { id: 'p_mask_item', room: 'fest2_lane', night: 2, cell: [20, 2], kind: 'item', mark: '面', label: '白い狐のお面', done: '白い狐のお面を拾った。どこかのお面屋の売り物みたい' },
    // 東の屋台：お面屋が3軒。白い狐の店に届ける（2晩目）
    { id: 'p_mask', room: 'fest2_east', night: 2, cell: [4, 6], kind: 'use', needs: 'p_mask_item', mark: '白', label: '白い狐のお面屋', need: '白い狐のお面屋「売り物のお面を、どこかで一つ落としちまってね。白い狐のやつだ」', done: '白い狐のお面屋「おお、それそれ！ ありがとよ。お礼に、裏の囲いを通っていいよ」' },
    // 2026-11-24：止まった自販機が、右上の奥への細い道をふさぐ。みおが編成にいれば電気を流して動かし、通れる（1-1 の時はまだいないので、後で来る所）
    { id: 'l_vending', room: 'fest2_east', night: 2, cell: [20, 6], kind: 'ability', ally: 'mio', mark: '雷', label: '止まった自販機', need: '止まった自販機が、奥への細い道をふさいでいる。……電気を流せる人がいれば', done: 'みおが自販機に電気を流すと、ガタンと動いて、奥への道があいた！' },
    // 縁日の広場：あかりが歌う（人混みが道をあける）
    // 縁日の広場：提灯を思い出の一枚の順（赤 → 白 → 青）に灯す（3晩目）
    // 社の森：ハルトのカメラで写す（3晩目）
    // 思い出の一枚（段階265）：4枚。3枚に、あの夜の提灯の色が出てくる（赤 → 白 → 青。広場の提灯の答え）
    { id: 'm_gate', room: 'fest2_gate', cell: [13, 11], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（鳥居の前）\n赤い提灯の下で、浴衣の女の子が、兄の袖を引っぱっている。「お兄ちゃん、はやく！」' },
    { id: 'm_yagura', room: 'fest2_plaza', cell: [14, 16], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（やぐらの陰）\n白い提灯の明かりで、男の子が小さな財布の中身を数えている。……金魚すくい、一回分' },
    { id: 'm_shooting', room: 'fest2_east', cell: [10, 13], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（屋台の裏の囲い）\n青い提灯の下、金魚の袋を抱えた女の子が、泣きべそで兄を呼んでいる' },
    { id: 'm_pond', room: 'fest2_woods', night: 3, cell: [10, 10], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（池のほとり）\n二人で金魚の袋をのぞきこむ。「この子の名前、なんにする？」' },
  ],
  // 地図の出来事（段階266・268）：1部屋に1つの見せ場
  events: [
    {
      id: 'ev_generator',
      room: 'fest2_backyard',
      when: { on: 'solved', flag: 'p_generator' },
      steps: [
        { do: 'shake' },
        { do: 'camera', to: [12, 21], ms: 450 },
        { do: 'light', cells: [[16, 19], [18, 20], [19, 21], [16, 22], [13, 22], [10, 21], [8, 20]] },
        { do: 'say', name: 'ハルト', text: '明かりがついた……路地の奥まで見える' },
        { do: 'say', name: '？？？', text: '……おにいちゃん……どこ……' },
        { do: 'say', name: 'あかり', text: '今の、女の子の声……！ 浴衣の人が言ってた子だ' },
        { do: 'spawn', enemy: 'a11_e_runner' },
        { do: 'camera', to: [12, 21], ms: 400 },
        { do: 'say', name: 'ハルト', text: '砂嵐が、あの子の声を抱えて逃げていく。追いかけるぞ' },
        { do: 'camera', to: 'hero', ms: 400 },
      ],
    },
    {
      id: 'ev_tank',
      room: 'fest2_east',
      night: 2,
      when: { on: 'enter', cells: [[8, 16], [8, 17], [8, 18], [1, 15], [1, 16]] },
      steps: [
        { do: 'say', name: '金魚すくいのおじさん', text: '水槽のポンプの音が、さっきから変なんだ……近づかないほうがいい' },
        { do: 'say', name: 'ハルト', text: '……水の音？' },
        { do: 'shake' },
        { do: 'camera', to: [4, 17], ms: 350 },
        { do: 'say', name: 'あかり', text: '金魚すくいの水槽が割れた！ 金魚の砂嵐が、あふれてくる！' },
        { do: 'spawn', enemy: 'a11_e_east2' },
        { do: 'spawn', enemy: 'a11_e_east1' },
        { do: 'camera', to: 'hero', ms: 350 },
      ],
    },
    {
      // 段階281：池の霧の砂嵐を倒すと、霧が晴れて飛び石が見える。池の真ん中は、兄妹が金魚に名前を付けた場所
      id: 'ev_pond',
      room: 'fest2_woods',
      night: 3,
      when: { on: 'solved', flag: 'a11_e_woods1' },
      steps: [
        { do: 'camera', to: [11, 11], ms: 500 },
        { do: 'flash', times: 1 },
        { do: 'say', name: 'ハルト', text: '霧が……晴れていく' },
        { do: 'say', name: 'あかり', text: 'あの砂嵐が、池の思い出を食べてたんだね。……飛び石の先、池の真ん中に何かある' },
        { do: 'camera', to: 'hero', ms: 500 },
      ],
    },
    {
      id: 'ev_fireworks',
      room: 'fest2_woods',
      night: 3,
      when: { on: 'enter', cells: [[10, 20], [11, 20], [12, 20], [13, 20]] },
      steps: [
        { do: 'flash', times: 3 },
        { do: 'say', name: 'ハルト', text: '花火……。森の奥まで照らしてる' },
        { do: 'camera', to: [11, 3], ms: 600 },
        { do: 'say', name: 'あかり', text: 'あの社……。あの子たちも、ここで花火を見てたのかな' },
        { do: 'camera', to: 'hero', ms: 500 },
      ],
    },
  ],
  // 途中の会話は今のまま（東の屋台に入った時の会話だけ、部屋の id を新しい部屋に）
  triggers: base.triggers.map((t) => (t.on === 'room' && t.room === 'fest_east' ? { ...t, room: 'fest2_east' } : t)),
};

/**
 * 段階271（docs/milestones/M3_explore_feel.md の 7.）：仕掛けの小物の絵（台帳の id）。off は解く前、on は解いた後（なければ同じ絵）。
 * w は絵の幅（マス）。絵はマスの下の端にそろえて置く。絵がまだ読めない時は、今までの仮の印（ひし形）で描く
 */
export const A11_PROP_ART: Record<string, { off: string; on?: string; w: number }> = {
  p_fuel: { off: 'prop.crate_red', w: 1.15 },
  p_generator: { off: 'prop.generator_off', on: 'prop.generator_on', w: 1.4 },
  p_mask_item: { off: 'prop.mask_white', w: 0.8 },
  p_mask: { off: 'prop.stall_white', w: 3.1 },
  l_vending: { off: 'prop.vending', w: 1.1 },
  m_gate: { off: 'prop.photo', w: 0.8 },
  m_yagura: { off: 'prop.photo', w: 0.8 },
  m_shooting: { off: 'prop.photo', w: 0.8 },
  m_pond: { off: 'prop.photo', w: 0.8 },
};

/** 仕掛けの扉の絵（段階271）：板のかべは、解く前は板・解いた後は壊れた板。人混みは、セピアの人の固まりをマスごとに */
export const A11_GATE_ART = { boards: 'prop.boards', broken: 'prop.boards_broken', crowd: ['prop.crowd1', 'prop.crowd2', 'prop.crowd3', 'prop.crowd4'] };

/** 宝箱の絵（段階271） */
export const A11_CHEST_ART = { closed: 'prop.chest_closed', open: 'prop.chest_open' };

/**
 * 下をくぐる物（段階272）：部屋の絵に描かず、仲間と敵の上に重ねる絵。x・y は絵の左上（マス）、w は幅（マス）。
 * 鳥居の柱の根もと（10,17）・（13,17）は、文字の地図で通れないマスにしてある
 */
export const A11_DECOR: { room: string; image: string; x: number; y: number; w: number; when?: string; to?: [number, number] }[] = [
  // 段階281：発電機が動くと灯る、屋台の裏の路地の電球の列（when の flag が付くまで出さない。地図の出来事の「光らせる」で順に灯る）
  { room: 'fest2_backyard', image: 'part.string_lanterns', x: 7.5, y: 19.4, w: 6.6, when: 'p_generator' },
  { room: 'fest2_backyard', image: 'part.string_lanterns', x: 13.6, y: 19.4, w: 6.6, when: 'p_generator' },
  { room: 'fest2_gate', image: 'prop.torii', x: 8.9, y: 12.3, w: 6.2 },
  // 段階275：頭の上の提灯のひも・旗（屋台から屋台へ張り渡す。仲間の上に重ねる）。長く張ると提灯が大きくなるので、10マスほどに分ける
  { room: 'fest2_gate', image: 'part.string_lanterns', x: 0.8, y: 6.6, w: 9 },
  { room: 'fest2_gate', image: 'part.string_lanterns', x: 10.6, y: 6.6, w: 9 },
  { room: 'fest2_gate', image: 'part.string_flags', x: 1.8, y: 17.2, w: 7.6 },
  { room: 'fest2_gate', image: 'part.string_flags', x: 14.6, y: 17.2, w: 7.6 },
  // 段階283：やぐらのてっぺんから、広場のふちの屋台へ放射状に張る（to まで。w は使わない）
  { room: 'fest2_plaza', image: 'part.string_lanterns', x: 12, y: 9.8, w: 0, to: [3.5, 5.2] },
  { room: 'fest2_plaza', image: 'part.string_lanterns', x: 12, y: 9.8, w: 0, to: [20.5, 5.2] },
  { room: 'fest2_plaza', image: 'part.string_mixed', x: 12, y: 9.8, w: 0, to: [2.5, 13.2] },
  { room: 'fest2_plaza', image: 'part.string_mixed', x: 12, y: 9.8, w: 0, to: [21.5, 13.2] },
  { room: 'fest2_east', image: 'part.string_lanterns', x: 1.2, y: 7.3, w: 9.4 },
  { room: 'fest2_east', image: 'part.string_lanterns', x: 11, y: 7.3, w: 9.4 },
  { room: 'fest2_east', image: 'part.string_flags', x: 7.5, y: 15.6, w: 6.6 },
  { room: 'fest2_east', image: 'part.string_flags', x: 14.4, y: 15.6, w: 6.6 },
  { room: 'fest2_lane', image: 'part.string_flags', x: 3, y: 2.6, w: 9 },
  { room: 'fest2_lane', image: 'part.string_flags', x: 12, y: 2.6, w: 9 },
];

/** 新しい1-1 で読む絵（部屋の絵・小物・下をくぐる物） */
export const A11_REWORK_IMAGES: string[] = [
  ...new Set([
    ...A11_REWORK.rooms.map((r) => r.image).filter((x): x is string => !!x),
    ...Object.values(A11_PROP_ART).flatMap((a) => [a.off, ...(a.on ? [a.on] : [])]),
    A11_GATE_ART.boards,
    A11_GATE_ART.broken,
    ...A11_GATE_ART.crowd,
    A11_CHEST_ART.closed,
    A11_CHEST_ART.open,
    ...A11_DECOR.map((d) => d.image),
    'person.c_girls', 'person.c_father', 'person.c_couple', 'person.c_oldman', 'person.c_goldfishgirl', 'person.c_foxboy', 'person.c_mother', 'person.c_boys', 'person.c_icewoman', 'person.c_pinwheel', 'person.c_porter', 'person.c_elders',
    'person.d_l1', 'person.d_l2', 'person.d_l3', 'person.d_l4', 'person.d_r1', 'person.d_r2', 'person.d_r3', 'person.d_r4',
    'person.yukata',
    'person.cotton',
    'person.goldfish',
    ...A11_REWORK.rooms.flatMap((r) => (r.parts ?? []).map((p) => `part.${p.part}`)),
  ]),
];

/** 写しの人の二頭身（段階280。話せる人の label から台帳の id）。下の3人（boy・grandma・student）は通行人に使う */
export const TALKER_ART: Record<string, string> = {
  浴衣の女の人: 'person.yukata',
  わたあめ屋: 'person.cotton',
  金魚すくいのおじさん: 'person.goldfish',
};

/**
 * 段階283（開発者：本物の祭りっぽくない）：通り抜けられる写しの人々（通行人）。cell は足もと、walk は横に歩く範囲（列）。
 * left は、絵が左を向いているか（横を向いた絵だけ。歩く向きに合わせて左右を返す）
 */
/** 通行人の絵の向き。左右に歩けるのは横向き（left/right）の絵だけ（段階283b） */
export type CrowdFace = 'left' | 'right' | 'front' | 'back';

export const A11_CROWD: { room: string; image: string; cell: [number, number]; face: CrowdFace; walk?: [number, number] }[] = [
  { room: 'fest2_gate', image: 'person.c_girls', cell: [5, 8], face: 'front' },
  { room: 'fest2_gate', image: 'person.c_oldman', cell: [15, 8], face: 'front' },
  { room: 'fest2_gate', image: 'person.c_father', cell: [12, 9], face: 'front' },
  { room: 'fest2_gate', image: 'person.c_couple', cell: [8, 10], face: 'back' },
  { room: 'fest2_gate', image: 'person.c_elders', cell: [6, 20], face: 'left', walk: [3, 8] },
  { room: 'fest2_gate', image: 'person.c_pinwheel', cell: [17, 19], face: 'back' },
  { room: 'fest2_plaza', image: 'person.c_foxboy', cell: [6, 7], face: 'front' },
  { room: 'fest2_plaza', image: 'person.c_icewoman', cell: [15, 7], face: 'front' },
  { room: 'fest2_plaza', image: 'person.c_goldfishgirl', cell: [6, 11], face: 'left', walk: [2, 9] },
  { room: 'fest2_plaza', image: 'person.c_mother', cell: [16, 17], face: 'left', walk: [15, 19] },
  { room: 'fest2_plaza', image: 'person.c_boys', cell: [5, 15], face: 'front' },
  { room: 'fest2_plaza', image: 'person.c_porter', cell: [18, 19], face: 'right', walk: [14, 18] },
  { room: 'fest2_east', image: 'person.c_girls', cell: [8, 7], face: 'front' },
  { room: 'fest2_east', image: 'person.c_foxboy', cell: [14, 8], face: 'front' },
  { room: 'fest2_east', image: 'person.c_couple', cell: [17, 9], face: 'back' },
  { room: 'fest2_east', image: 'person.c_icewoman', cell: [14, 17], face: 'front' },
];

/** 段階283：広場のやぐらのまわりを回る盆踊りの輪（中心と半径はマス。left は左を向いた絵） */
export const A11_BON = {
  room: 'fest2_plaza',
  cx: 12,
  cy: 13.4,
  rx: 4.6,
  ry: 3.2,
  dancers: [
    { image: 'person.d_l1', left: true },
    { image: 'person.d_r1', left: false },
    { image: 'person.d_l2', left: true },
    { image: 'person.d_r2', left: false },
    { image: 'person.d_l3', left: true },
    { image: 'person.d_r3', left: false },
    { image: 'person.d_l4', left: true },
    { image: 'person.d_r4', left: false },
  ],
};
