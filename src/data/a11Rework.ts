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
  '#########......#########',
  '#########......#########',
  '#########......#########',
  '#########......#########',
  '#########......#########',
  '#########......##.....##',
  '#########......##.....##',
  '#########......##::#####',
  '#########......##::#####',
  '#########......##::#####',
  '..#######........::#####',
  '.................::#####',
  '.................::#####',
  '..#####.#......#.::#####',
  '#######.#......#.::..###',
  '#######.#......#.::..###',
  '#####::..........::..###',
  '#####::...#..#...::..###',
  '#####::..........::..###',
  '###..................###',
  '###........S.........###',
  '###..................###',
  '#########......#########',
  '########################',
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
  '####################..##',
  '####################..##',
  '###...##############..##',
  '###..........#####....##',
  '##..###.##########...###',
  '##..###.##########...###',
  '##..###.###########..###',
  '##..###.###########..###',
  '##..###.###########..###',
  '##..###.:::########..###',
  '##..###.##:########..###',
  '##..##..:::#######...###',
  '##..##.############.....',
  '#...##.############.....',
  '#...##.############.....',
  '#......###########......',
  '#......###########....##',
  '###................#####',
  '####.........###########',
  '######.......###########',
  '######...###############',
  '#####....###############',
  '#####....###############',
];

const PLAZA_LAYOUT = [
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##:::..............#####',
  '##:::......P.......#####',
  '##:::..............#####',
  '##:::..............#####',
  '##:::#####....##########',
  '##########....##########',
  '.......###....###.......',
  '.......###....###.......',
  '........................',
  '........:......:........',
  '#####...:######:...#####',
  '#####...:######:...#####',
  '#####...:######:.......#',
  '#####...:......:.......#',
  '#####..................#',
  '##########.P..#####....#',
  '##########....#####....#',
  '##########....##########',
  '##########....##########',
  '##########....##########',
];

const EAST_LAYOUT = [
  '########################',
  '########################',
  '########################',
  '########################',
  '########################',
  '####.................###',
  '####...#########....####',
  '####..###########...####',
  '####..###########...####',
  '####..###########...####',
  '####..###########...####',
  '......##:::######...####',
  '........:::######...####',
  '......###########...####',
  '..###...#########...####',
  '#####...#########...####',
  '#####...............####',
  '#####..............#####',
  '##############.....#####',
  '###############.......##',
  '################......##',
  '################......##',
  '########################',
  '########################',
];

const WOODS_LAYOUT = [
  '########################',
  '########################',
  '########################',
  '####................####',
  '####...#........#...####',
  '####..#####.#####...####',
  '####..#####.#####...####',
  '####..#####.#####...####',
  '##::..#####.#####...####',
  '##::..#####.#####...####',
  '#.::...................#',
  '#.::..#####.#####......#',
  '##::..#####.#####...####',
  '##::..#####.#####...####',
  '##::..#####.#####...####',
  '##::..#####.#####...####',
  '####..##.......##...####',
  '####...#........#...####',
  '####................####',
  '####................####',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
];

const room = (id: string, layout: string[], exits: RoomDef['exits'], exitAt?: RoomDef['exitAt'], image?: string): RoomDef => ({ id, layout, exits, era: 'heisei_late', ...(exitAt ? { exitAt } : {}), ...(image ? { image } : {}) });

/** 新しい1-1の部屋（6つ。屋台の裏通りは新しい部屋） */
export const A11_REWORK_ROOMS = {
  gate: room('fest2_gate', GATE_LAYOUT, ['top', 'left'], { left: 10 }, 'map.fest2_gate'),
  backyard: { ...room('fest2_backyard', composeLayout(BACKYARD_GROUND, BACKYARD_PARTS), ['right', 'top'], { right: 7, top: 14 }, 'map.fest2_backyard_ground'), parts: BACKYARD_PARTS },
  lane: room('fest2_lane', LANE_LAYOUT, ['bottom', 'right'], { bottom: 5, right: 13 }, 'map.fest2_lane'),
  plaza: room('fest2_plaza', PLAZA_LAYOUT, ['bottom', 'left', 'right', 'top']),
  east: room('fest2_east', EAST_LAYOUT, ['left'], { left: 11 }, 'map.fest2_east'),
  woods: room('fest2_woods', WOODS_LAYOUT, ['bottom'], undefined, 'map.fest2_woods'),
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
    { id: 'a11_wall_plaza', room: 'fest2_plaza', cells: box(10, 13, 9, 9), opens: 2 },
    { id: 'a11_wall_east', room: 'fest2_plaza', cells: box(19, 19, 10, 13), opens: 2 },
    { id: 'a11_wall_shrine', room: 'fest2_plaza', cells: box(10, 13, 3, 3), opens: 3 },
    // 屋台の裏通りの両側の出入口の手前（2晩目から）
    { id: 'a11_wall_lane_bottom', room: 'fest2_lane', cells: box(6, 8, 21, 21), opens: 2 },
    { id: 'a11_wall_lane_right', room: 'fest2_lane', cells: box(21, 21, 13, 16), opens: 2 },
  ],
  hunt: {
    gathers: [
      { id: 'a11_gather_goldfish', room: 'fest2_east', cell: [10, 11], items: [ITEMS.goldfishScale.id, ITEMS.goldfishScale.id] },
      { id: 'a11_gather_ramune', room: 'fest2_plaza', cell: [3, 5], items: [ITEMS.balloonShard.id, ITEMS.cottonThread.id] },
      { id: 'a11_gather_yukata', room: 'fest2_gate', cell: [20, 5], items: [ITEMS.maskShard.id] },
      { id: 'a11_gather_back', room: 'fest2_backyard', cell: [19, 21], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
    ],
  },
  // 宝箱は6つ（入口の脇道の奥・停電の路地の奥・射的の裏・射的の裏の行き止まり・やぐらの前・森の右のほこら）
  chests: [
    { id: 'a11_chest_gate', room: 'fest2_gate', cell: [20, 5], items: [ITEMS.cottonThread.id] },
    { id: 'a11_chest_back', room: 'fest2_backyard', cell: [19, 21], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
    { id: 'a11_chest_goldfish', room: 'fest2_east', cell: [10, 11], night: 2, items: [ITEMS.goldfishScale.id] },
    { id: 'a11_chest_new2', room: 'fest2_plaza', cell: [3, 5], night: 3, items: [ITEMS.goldfishFin.id, ITEMS.cottonThread.id] },
    // 提灯を思い出の順に灯すと、やぐらの前に出る。中身は、思い出を返した時からここへ移したリカバリー
    { id: 'a11_chest_new1', room: 'fest2_plaza', cell: [11, 13], night: 3, needs: 'p_lanterns', items: [ITEMS.balloonShard.id], chainSnaps: ['a11_recovery'] },
    { id: 'a11_chest_woods', room: 'fest2_woods', cell: [22, 10], night: 3, items: [ITEMS.goldfishFin.id, ITEMS.maskShard.id] },
  ],
  enemies: [
    // ---- 1晩目 ----
    { id: 'a11_e_gate', room: 'fest2_gate', patrol: [[11, 4], [11, 16]], battle: 'a11_n1_gate' },
    // 入口の待ち伏せ（参道を上ると、屋台の陰から飛び出してくる。地図の出来事 ev_gate_ambush）
    { id: 'a11_e_gate_chase', room: 'fest2_gate', move: 'chase', hidden: true, patrol: [[16, 11], [16, 12]], battle: 'a11_n1_chaser' },
    { id: 'a11_e_back', room: 'fest2_backyard', patrol: [[7, 9], [13, 9], [13, 13], [7, 13]], battle: 'a11_n1_back' },
    // 発電機を直して明かりがつくと、暗がりから現れて逃げる（地図の出来事 ev_generator）
    { id: 'a11_e_runner', room: 'fest2_backyard', move: 'flee', hidden: true, patrol: [[12, 21]], battle: 'a11_runner' },
    { id: 'a11_e_road', room: 'fest2_gate', patrol: [[1, 11], [8, 11]], battle: 'a11_n1_road' },
    { id: 'a11_e_plaza', room: 'fest2_plaza', move: 'chase', patrol: [[5, 13], [5, 17]], battle: 'a11_n1_plaza' },
    // ---- 2晩目 ----
    { id: 'a11_e_corridor', room: 'fest2_plaza', night: 2, patrol: [[5, 4], [5, 7]], battle: 'a11_n2_corridor' },
    { id: 'a11_e_west1', room: 'fest2_lane', night: 2, move: 'chase', patrol: [[19, 5], [19, 15]], battle: 'a11_n2_west1' },
    { id: 'a11_e_west2', room: 'fest2_lane', night: 2, patrol: [[7, 4], [12, 4]], battle: 'a11_n2_west2' },
    // 金魚すくいの水槽が割れて、あふれ出す（地図の出来事 ev_tank）
    { id: 'a11_e_east1', room: 'fest2_east', night: 2, hidden: true, patrol: [[13, 17], [8, 17]], battle: 'a11_n2_east1' },
    { id: 'a11_e_east2', room: 'fest2_east', night: 2, move: 'chase', hidden: true, patrol: [[18, 11], [18, 6]], battle: 'a11_n2_east2' },
    // 金魚すくいの屋台の前の番人（2晩目の山場。戦う前の会話）
    { id: 'a11_e_guard', room: 'fest2_east', night: 2, move: 'guard', patrol: [[20, 20]], battle: 'a11_n2_guard', scene: 'a11_guard' },
    // ---- 3晩目 ----
    { id: 'a11_e_steps', room: 'fest2_plaza', night: 3, patrol: [[15, 7], [18, 7]], battle: 'a11_n3_steps' },
    { id: 'a11_e_right', room: 'fest2_plaza', night: 3, move: 'chase', patrol: [[18, 13], [18, 17]], battle: 'a11_n3_right' },
    { id: 'a11_e_woods1', room: 'fest2_woods', night: 3, move: 'chase', patrol: [[18, 13], [18, 16]], battle: 'a11_n3_woods1' },
    { id: 'a11_e_woods2', room: 'fest2_woods', night: 3, patrol: [[13, 3], [19, 3]], battle: 'a11_n3_woods2' },
  ],
  boss: { ...base.boss, room: 'fest2_woods', cell: [11, 3] },
  // 写しの人（段階265 のくれる物つき）：1つの部屋の1つの晩に1人まで（広場の1晩目と社の森は2人）
  talkers: [
    { id: 'a11_voice_yukata', room: 'fest2_gate', cell: [5, 16], until: 1, scene: 'a11_voice_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_knob', text: '浴衣の女の人「発電機のつまみ？ 赤いテントの横の箱に入れたって、誰かが言ってたわ」\n（地図に印が付いた）' } },
    { id: 'a11_voice_cotton', room: 'fest2_plaza', cell: [16, 12], until: 1, scene: 'a11_voice_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「甘いの食べて、ひと休みしな」\n（HP・MP が少し回復した）' } },
    { id: 'a11_voice_goldfish', room: 'fest2_plaza', cell: [7, 18], until: 1, scene: 'a11_voice_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'goldfishNoise', element: 'ice', text: '金魚すくいのおじさん「さっきの金魚みたいな砂嵐、冷たいのが苦手みたいだったよ」\n（金魚ノイズの弱点：氷 が分かった）' } },
    { id: 'a11_voice2_cotton', room: 'fest2_plaza', cell: [18, 4], night: 2, until: 2, scene: 'a11_voice2_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「疲れた顔してるね。ほら、ひと口」\n（HP・MP が少し回復した）' } },
    { id: 'a11_voice2_yukata', room: 'fest2_lane', cell: [10, 12], night: 2, until: 2, scene: 'a11_voice2_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_mask', text: '浴衣の女の人「東の屋台のお面屋さん、白い狐のお面をなくして困ってたわ」\n（地図に印が付いた）' } },
    { id: 'a11_voice2_goldfish', room: 'fest2_east', cell: [6, 15], night: 2, until: 2, scene: 'a11_voice2_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'maskNoise', element: 'fire', text: '金魚すくいのおじさん「お面の砂嵐は、火に弱いらしいぜ」\n（お面ノイズの弱点：火 が分かった）' } },
    { id: 'a11_voice3_yukata', room: 'fest2_plaza', cell: [8, 7], night: 3, scene: 'a11_voice3_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_lantern1', text: '浴衣の女の人「やぐらの提灯？ ……思い出した順に灯すといいわ。あの夜の順番に」\n（地図に印が付いた）' } },
    { id: 'a11_voice3_goldfish', room: 'fest2_woods', cell: [7, 18], night: 3, scene: 'a11_voice3_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'cottonNoise', element: 'thunder', text: '金魚すくいのおじさん「わたあめの砂嵐は、ビリッとくるのが苦手でな」\n（わたあめノイズの弱点：雷 が分かった）' } },
    { id: 'a11_voice3_cotton', room: 'fest2_woods', cell: [17, 17], night: 3, scene: 'a11_voice3_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「ここまで来たんだ、もうひと踏ん張り」\n（HP・MP が少し回復した）' } },
  ],
  // 仕掛けの扉（段階264）：仕掛けを解くまで通れない
  gates: [
    { id: 'g_dark', room: 'fest2_backyard', cells: box(7, 20, 20, 22), by: 'p_generator', look: 'dark', label: '停電で真っ暗' },
    { id: 'g_fence', room: 'fest2_lane', cells: box(1, 3, 16, 16), by: 'p_cart', look: 'fence', label: '板のかべ' },
    { id: 'g_crowd', room: 'fest2_plaza', cells: box(19, 19, 16, 20), by: 'p_song', look: 'crowd', label: '人混み' },
    { id: 'g_gap', room: 'fest2_east', cells: box(6, 7, 12, 12), by: 'p_mask', look: 'fence', label: '射的の裏の板' },
    { id: 'g_stones', room: 'fest2_woods', cells: [...box(11, 11, 6, 15), ...box(6, 10, 10, 10), ...box(12, 16, 10, 10)], by: 'p_camera', look: 'water', label: '池の霧' },
  ],
  // 仕掛けと仲間の力（段階264・268）。1部屋に1つまで。考える所：木箱はテントの色、お面は店の狐の色、提灯は思い出の一枚の順
  gadgets: [
    // 屋台の裏：木箱が3つ。赤いテントの横の箱に、発電機のつまみ（浴衣の女の人の手がかり）
    { id: 'p_crate_blue', room: 'fest2_backyard', cell: [5, 6], kind: 'look', mark: '青', label: '青いテントの横の木箱', done: '青いテントの横の木箱。……からっぽだ' },
    { id: 'p_knob', room: 'fest2_backyard', cell: [8, 6], kind: 'item', mark: '赤', label: '赤いテントの横の木箱', done: '赤いテントの横の木箱に、発電機のつまみが入っていた！' },
    { id: 'p_crate_yellow', room: 'fest2_backyard', cell: [11, 6], kind: 'look', mark: '黄', label: '黄色いテントの横の木箱', done: '黄色いテントの横の木箱。……ラムネの空き瓶しか入っていない' },
    { id: 'p_generator', room: 'fest2_backyard', cell: [10, 11], kind: 'use', needs: 'p_knob', mark: '発', label: '発電機', need: '止まった発電機。つまみが外れている', done: 'つまみを付けると、発電機がうなりを上げた！' },
    { id: 'l_door', room: 'fest2_backyard', cell: [20, 20], kind: 'later', ally: 'hayase', mark: '直', label: '壊れた木戸', need: '壊れた木戸。……直せる人がいれば', done: '早瀬が木戸を直した（この先は、また今度）' },
    // 屋台の裏通り：坂の上の荷車を、上から押す（2晩目）。転がり落ちて板のかべを突き破る
    { id: 'p_cart', room: 'fest2_lane', night: 2, cell: [3, 5], kind: 'push', from: [3, 4], mark: '車', label: '荷車', need: '坂の途中の荷車。坂の上から押せば、転がりそう', done: '荷車を押した！' },
    { id: 'p_mask_item', room: 'fest2_lane', night: 2, cell: [21, 2], kind: 'item', mark: '面', label: '白い狐のお面', done: '白い狐のお面を拾った。どこかのお面屋の物みたい' },
    // 東の屋台：お面屋が3軒。白い狐の店に届ける（2晩目）
    { id: 'p_mask', room: 'fest2_east', night: 2, cell: [7, 4], kind: 'use', needs: 'p_mask_item', mark: '白', label: '白い狐のお面屋', need: '白い狐のお面屋「白い狐のお面がひとつ、見当たらなくてねえ」', done: '白い狐のお面屋「おお、それそれ！ ありがとよ。お礼に、射的の裏を通っていいよ」' },
    { id: 'p_shop_black', room: 'fest2_east', night: 2, cell: [11, 4], kind: 'look', mark: '黒', label: '黒い狐のお面屋', done: '黒い狐のお面屋「うちは黒い狐だけだよ。白いのは、うちのじゃないね」' },
    { id: 'p_shop_gold', room: 'fest2_east', night: 2, cell: [15, 4], kind: 'look', mark: '金', label: '金の狐のお面屋', done: '金の狐のお面屋「うちのは金ぴかの狐さ。ほかを当たっておくれ」' },
    { id: 'l_vending', room: 'fest2_east', cell: [19, 4], kind: 'later', ally: 'mio', mark: '雷', label: '止まった自販機', need: '止まった自販機。……電気を流せる人がいれば', done: 'みおが自販機を動かした（この先は、また今度）' },
    // 縁日の広場：あかりが歌う（人混みが道をあける）
    { id: 'p_song', room: 'fest2_plaza', cell: [19, 18], kind: 'ability', ally: 'akari', mark: '歌', label: '人混み', need: '人混みで通れない', done: 'あかりが小さく歌うと、写しの人たちが振り向いて、道をあけた' },
    // 縁日の広場：提灯を思い出の一枚の順（赤 → 白 → 青）に灯す（3晩目）
    { id: 'p_lantern1', room: 'fest2_plaza', night: 3, cell: [6, 12], kind: 'order', group: 'p_lanterns', index: 0, mark: '赤', label: '赤い提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろった！' },
    { id: 'p_lantern2', room: 'fest2_plaza', night: 3, cell: [17, 12], kind: 'order', group: 'p_lanterns', index: 1, mark: '白', label: '白い提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろった！' },
    { id: 'p_lantern3', room: 'fest2_plaza', night: 3, cell: [11, 18], kind: 'order', group: 'p_lanterns', index: 2, mark: '青', label: '青い提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろった！' },
    // 社の森：ハルトのカメラで写す（3晩目）
    { id: 'p_camera', room: 'fest2_woods', night: 3, cell: [11, 16], kind: 'ability', ally: 'hero', mark: 'カ', label: '池の霧', need: '池に霧が立ちこめている', done: 'ハルトがカメラを向けると、霧の中に飛び石が写った！' },
    { id: 'l_bamboo', room: 'fest2_woods', night: 3, cell: [1, 10], kind: 'later', ally: 'sayoko', mark: '刀', label: '竹やぶ', need: '竹やぶで通れない。……切れる人がいれば', done: '小夜子が竹やぶを切った（この先は、また今度）' },
    // 思い出の一枚（段階265）：4枚。3枚に、あの夜の提灯の色が出てくる（赤 → 白 → 青。広場の提灯の答え）
    { id: 'm_gate', room: 'fest2_gate', cell: [13, 11], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（鳥居の前）\n赤い提灯の下で、浴衣の女の子が、兄の袖を引っぱっている。「お兄ちゃん、はやく！」' },
    { id: 'm_yagura', room: 'fest2_plaza', cell: [21, 18], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（やぐらの陰）\n白い提灯の明かりで、男の子が小さな財布の中身を数えている。……金魚すくい、一回分' },
    { id: 'm_shooting', room: 'fest2_east', cell: [8, 11], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（射的の裏）\n青い提灯の下、金魚の袋を抱えた女の子が、泣きべそで兄を呼んでいる' },
    { id: 'm_pond', room: 'fest2_woods', night: 3, cell: [13, 9], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（池のほとり）\n二人で金魚の袋をのぞきこむ。「この子の名前、なんにする？」' },
  ],
  // 地図の出来事（段階266・268）：1部屋に1つの見せ場
  events: [
    {
      id: 'ev_gate_ambush',
      room: 'fest2_gate',
      when: { on: 'enter', cells: [[10, 15], [11, 15], [12, 15], [13, 15]] },
      steps: [
        { do: 'shake' },
        { do: 'say', name: 'ハルト', text: '……今、屋台の陰で何か動いた' },
        { do: 'spawn', enemy: 'a11_e_gate_chase' },
        { do: 'camera', to: [16, 11], ms: 350 },
        { do: 'say', name: 'あかり', text: '砂嵐！ 待ち伏せしてたんだ' },
        { do: 'battle', enemy: 'a11_e_gate_chase' },
      ],
    },
    {
      id: 'ev_generator',
      room: 'fest2_backyard',
      when: { on: 'solved', flag: 'p_generator' },
      steps: [
        { do: 'shake' },
        { do: 'camera', to: [12, 21], ms: 450 },
        { do: 'light', cells: [[16, 19], [18, 20], [19, 21], [16, 22], [13, 22], [10, 21], [8, 20]] },
        { do: 'say', name: 'ハルト', text: '明かりがついた……路地の奥まで見える' },
        { do: 'spawn', enemy: 'a11_e_runner' },
        { do: 'camera', to: [12, 21], ms: 400 },
        { do: 'say', name: 'あかり', text: 'あっ、何か逃げてく！ 追いかけよう' },
        { do: 'camera', to: 'hero', ms: 400 },
      ],
    },
    {
      id: 'ev_cart',
      room: 'fest2_lane',
      when: { on: 'solved', flag: 'p_cart' },
      steps: [
        { do: 'slide', mark: '車', from: [3, 5], to: [3, 15] },
        { do: 'shake' },
        { do: 'say', name: 'ハルト', text: '板のかべが……破れた。屋台の裏まで、まっすぐ抜けられる' },
      ],
    },
    {
      id: 'ev_tank',
      room: 'fest2_east',
      night: 2,
      when: { on: 'enter', cells: [[17, 16], [18, 16], [19, 16], [17, 17], [18, 17]] },
      steps: [
        { do: 'say', name: 'ハルト', text: '……水の音？' },
        { do: 'shake' },
        { do: 'camera', to: [12, 15], ms: 350 },
        { do: 'say', name: 'あかり', text: '金魚すくいの水槽が割れた！ 金魚の砂嵐が、あふれてくる！' },
        { do: 'spawn', enemy: 'a11_e_east2' },
        { do: 'spawn', enemy: 'a11_e_east1' },
        { do: 'camera', to: 'hero', ms: 350 },
      ],
    },
    {
      id: 'ev_lanterns',
      room: 'fest2_plaza',
      when: { on: 'solved', flag: 'p_lanterns' },
      steps: [
        { do: 'camera', to: [11, 15], ms: 450 },
        { do: 'shake' },
        { do: 'say', name: 'ハルト', text: 'ドン、ドン……やぐらの太鼓が鳴ってる' },
        { do: 'light', cells: [[6, 12], [17, 12], [11, 18], [11, 13]] },
        { do: 'say', name: 'あかり', text: 'やぐらの前で、何か光ってる！' },
        { do: 'camera', to: 'hero', ms: 400 },
      ],
    },
    {
      id: 'ev_fireworks',
      room: 'fest2_woods',
      night: 3,
      when: { on: 'enter', cells: [[10, 17], [11, 17], [12, 17], [13, 17]] },
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
  p_crate_blue: { off: 'prop.crate_blue', w: 1.15 },
  p_knob: { off: 'prop.crate_red', w: 1.15 },
  p_crate_yellow: { off: 'prop.crate_yellow', w: 1.15 },
  p_generator: { off: 'prop.generator_off', on: 'prop.generator_on', w: 1.4 },
  l_door: { off: 'prop.door_broken', w: 1.4 },
  p_cart: { off: 'prop.cart', w: 1.4 },
  p_mask_item: { off: 'prop.mask_white', w: 0.8 },
  p_mask: { off: 'prop.stall_white', w: 2.6 },
  p_shop_black: { off: 'prop.stall_black', w: 2.6 },
  p_shop_gold: { off: 'prop.stall_gold', w: 2.6 },
  l_vending: { off: 'prop.vending', w: 1.1 },
  p_lantern1: { off: 'prop.lantern_red_off', on: 'prop.lantern_red_on', w: 1.1 },
  p_lantern2: { off: 'prop.lantern_white_off', on: 'prop.lantern_white_on', w: 1.1 },
  p_lantern3: { off: 'prop.lantern_blue_off', on: 'prop.lantern_blue_on', w: 1.1 },
  l_bamboo: { off: 'prop.bamboo', w: 1.6 },
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
export const A11_DECOR: { room: string; image: string; x: number; y: number; w: number }[] = [{ room: 'fest2_gate', image: 'prop.torii', x: 8.9, y: 12.3, w: 6.2 }];

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
    ...A11_REWORK.rooms.flatMap((r) => (r.parts ?? []).map((p) => `part.${p.part}`)),
  ]),
];
