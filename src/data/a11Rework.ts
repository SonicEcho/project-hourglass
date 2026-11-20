import type { AreaDef, RoomDef } from '../core/explore';
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
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....###.....##',
  '##########....###.....##',
  '##########....###.....##',
  '##########....###::#####',
  '##########....###::#####',
  '##########....###::#####',
  '..............###::#####',
  '..............###::#####',
  '..............###::#####',
  '.................::#####',
  '#####::###.......::#####',
  '#####::###....###::#####',
  '#####::###....###::#####',
  '#####::###....###::#####',
  '#####::###....###::#####',
  '###..................###',
  '###........S.........###',
  '###..................###',
  '########################',
  '########################',
];

const BACKYARD_LAYOUT = [
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '###..................###',
  '###..................###',
  '###...........##.....###',
  '###:::#####:::##########',
  '###:::#####:::#####...##',
  '###:::#####:::#####...##',
  '###:::#####:::#####...##',
  '###:::#####:::#####...##',
  '###:::#####...........##',
  '###:::#####...........##',
  '###......##...#####...##',
  '###......##...#####...##',
  '###......##...#####...##',
  '#######.........########',
  '#######.........########',
  '#######.................',
  '#######.................',
  '#######.................',
  '#######.................',
  '#######.........########',
  '#######.............####',
  '#######.............####',
  '#######...#####.....####',
  '#######...#######...####',
  '#######...#######...####',
  '#######...#######...####',
  '#######...#######...####',
  '##........#######...####',
  '##........#######...####',
  '##........#######...####',
  '##........#######...####',
  '#######.............####',
  '#######.............####',
  '#######.............####',
  '########################',
  '########################',
  '########################',
  '########################',
  '########################',
];

const LANE_LAYOUT = [
  '########################',
  '########################',
  '#######.............####',
  '#######.............####',
  '#######.............####',
  '#######...#######:::####',
  '#######...#######:::####',
  '#######...#######:::####',
  '###.............#:::####',
  '###.............#:::####',
  '###..........:::#.......',
  '###...#######:::#.......',
  '###...#######:::#.......',
  '###...#######:::#.......',
  '###...#######.......####',
  '###...#######.......####',
  '###...#######.......####',
  '###...........##########',
  '###...........##########',
  '###...........##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
];

const PLAZA_LAYOUT = [
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '########........########',
  '##:::###........########',
  '##:::###........########',
  '##:::###........########',
  '##:::###...P....########',
  '##:::###........########',
  '##:::###........########',
  '##....................##',
  '##....................##',
  '##....................##',
  '##....................##',
  '##########....###.......',
  '##########....###.......',
  '##########....###.......',
  '##########....###.......',
  '.......###....##########',
  '.......###....##########',
  '.......###....##########',
  '.......###....##########',
  '####................####',
  '####................####',
  '####....:......:....####',
  '####....:######:....####',
  '####....:######:.......#',
  '####....:######:.......#',
  '####....:######:.......#',
  '####....:..P...:.......#',
  '#######..........#######',
  '#######..........#######',
  '#######..........#######',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
];

const EAST_LAYOUT = [
  '########################',
  '########################',
  '########################',
  '####.................###',
  '####.................###',
  '####.................###',
  '####:::###########:::###',
  '####:::###########:::###',
  '####:::###########:::###',
  '####:::###.....###...###',
  '.......###.....###...###',
  '...............###...###',
  '...............###...###',
  '.......###.....###...###',
  '####...###.....###...###',
  '####...###########...###',
  '####...###########...###',
  '####...###########...###',
  '####...................#',
  '####...................#',
  '####...................#',
  '####################...#',
  '####################...#',
  '########################',
];

const WOODS_LAYOUT = [
  '########################',
  '########################',
  '######............######',
  '######............######',
  '######............######',
  '######............######',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....######...#',
  '##########....######...#',
  '##########....######...#',
  '##########....######...#',
  '##########....######...#',
  '####.........::::......#',
  '####.........::::......#',
  '####.........::::......#',
  '####:::####..####......#',
  '####:::####..####......#',
  '####:::####..####...####',
  '#...:::####..####...####',
  '#...:::##......##...####',
  '#...:::##......##...####',
  '#...:::##......##...####',
  '####...####..####...####',
  '####...####..####...####',
  '####...####..####...####',
  '####...####..####...####',
  '####................####',
  '####................####',
  '####................####',
  '####................####',
  '####................####',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
  '##########....##########',
];

const room = (id: string, layout: string[], exits: RoomDef['exits'], exitAt?: RoomDef['exitAt']): RoomDef => ({ id, layout, exits, era: 'heisei_late', ...(exitAt ? { exitAt } : {}) });

/** 新しい1-1の部屋（6つ。屋台の裏通りは新しい部屋） */
export const A11_REWORK_ROOMS = {
  gate: room('fest2_gate', GATE_LAYOUT, ['top', 'left']),
  backyard: room('fest2_backyard', BACKYARD_LAYOUT, ['right', 'top']),
  lane: room('fest2_lane', LANE_LAYOUT, ['bottom', 'right']),
  plaza: room('fest2_plaza', PLAZA_LAYOUT, ['bottom', 'left', 'right', 'top'], { right: 15 }),
  east: room('fest2_east', EAST_LAYOUT, ['left']),
  woods: room('fest2_woods', WOODS_LAYOUT, ['bottom']),
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
  // 2晩目は広場の下のチェックポイントから、3晩目は石段の下のチェックポイントから
  nights: [{ koma: 3 }, { koma: 6, start: { room: 'fest2_plaza', cell: [11, 30] } }, { start: { room: 'fest2_plaza', cell: [11, 8] } }],
  walls: [
    // 広場の下から上の通りへ（2晩目から）と、石段（3晩目から）
    { id: 'a11_wall_plaza', room: 'fest2_plaza', cells: box(10, 13, 20, 20), opens: 2 },
    { id: 'a11_wall_shrine', room: 'fest2_plaza', cells: box(10, 13, 3, 3), opens: 3 },
    // 屋台の裏通りの両側の出入口の手前（2晩目から）
    { id: 'a11_wall_lane_bottom', room: 'fest2_lane', cells: box(10, 13, 21, 21), opens: 2 },
    { id: 'a11_wall_lane_right', room: 'fest2_lane', cells: box(21, 21, 10, 13), opens: 2 },
  ],
  hunt: {
    gathers: [
      { id: 'a11_gather_goldfish', room: 'fest2_east', cell: [12, 11], items: [ITEMS.goldfishScale.id, ITEMS.goldfishScale.id] },
      { id: 'a11_gather_ramune', room: 'fest2_plaza', cell: [11, 25], items: [ITEMS.balloonShard.id, ITEMS.cottonThread.id] },
      { id: 'a11_gather_yukata', room: 'fest2_gate', cell: [20, 5], items: [ITEMS.maskShard.id] },
      { id: 'a11_gather_back', room: 'fest2_backyard', cell: [13, 36], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
    ],
  },
  // 宝箱は 6 → 8（入口の脇道の奥・裏通りの行き止まりを足した）
  chests: [
    { id: 'a11_chest_gate', room: 'fest2_gate', cell: [20, 5], items: [ITEMS.cottonThread.id] },
    { id: 'a11_chest_back', room: 'fest2_backyard', cell: [13, 36], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
    { id: 'a11_chest_west', room: 'fest2_backyard', cell: [20, 9], night: 2, items: [ITEMS.goldfishScale.id] },
    { id: 'a11_chest_lane', room: 'fest2_lane', cell: [18, 3], night: 2, items: [ITEMS.balloonShard.id] },
    { id: 'a11_chest_goldfish', room: 'fest2_east', cell: [12, 11], night: 2, items: [ITEMS.goldfishScale.id] },
    { id: 'a11_chest_new2', room: 'fest2_plaza', cell: [3, 6], night: 3, items: [ITEMS.goldfishFin.id, ITEMS.cottonThread.id] },
    // 提灯を順に灯すと、やぐらの前に出る（段階264）
    { id: 'a11_chest_new1', room: 'fest2_plaza', cell: [11, 25], night: 3, needs: 'p_lanterns', items: [ITEMS.balloonShard.id, ITEMS.maskShard.id] },
    { id: 'a11_chest_woods', room: 'fest2_woods', cell: [21, 10], night: 3, items: [ITEMS.goldfishFin.id, ITEMS.maskShard.id] },
  ],
  enemies: [
    // ---- 1晩目 ----
    { id: 'a11_e_gate', room: 'fest2_gate', patrol: [[11, 4], [11, 16]], battle: 'a11_n1_gate' },
    { id: 'a11_e_gate_chase', room: 'fest2_gate', move: 'chase', patrol: [[20, 20], [16, 20]], battle: 'a11_n1_chaser' },
    { id: 'a11_e_back', room: 'fest2_backyard', patrol: [[8, 18], [14, 18], [14, 24], [8, 24]], battle: 'a11_n1_back' },
    { id: 'a11_e_runner', room: 'fest2_backyard', move: 'flee', patrol: [[4, 32]], battle: 'a11_runner' },
    { id: 'a11_e_road', room: 'fest2_plaza', patrol: [[11, 35], [11, 40]], battle: 'a11_n1_road' },
    { id: 'a11_e_plaza', room: 'fest2_plaza', move: 'chase', patrol: [[5, 24], [5, 30]], battle: 'a11_n1_plaza' },
    // ---- 2晩目 ----
    { id: 'a11_e_corridor', room: 'fest2_plaza', night: 2, patrol: [[3, 12], [20, 12]], battle: 'a11_n2_corridor' },
    { id: 'a11_e_east1', room: 'fest2_plaza', night: 2, patrol: [[20, 15], [20, 17]], battle: 'a11_n2_east1' },
    { id: 'a11_e_west1', room: 'fest2_lane', night: 2, move: 'chase', patrol: [[4, 9], [4, 12]], battle: 'a11_n2_west1' },
    { id: 'a11_e_west2', room: 'fest2_lane', night: 2, patrol: [[8, 3], [16, 3]], battle: 'a11_n2_west2' },
    { id: 'a11_e_east2', room: 'fest2_east', night: 2, move: 'chase', patrol: [[19, 11], [19, 17]], battle: 'a11_n2_east2' },
    // 金魚すくいの屋台の前の番人（2晩目の山場。戦う前の会話）
    { id: 'a11_e_guard', room: 'fest2_east', night: 2, move: 'guard', patrol: [[21, 20]], battle: 'a11_n2_guard', scene: 'a11_guard' },
    // ---- 3晩目 ----
    { id: 'a11_e_steps', room: 'fest2_plaza', night: 3, patrol: [[9, 5], [14, 5]], battle: 'a11_n3_steps' },
    { id: 'a11_e_right', room: 'fest2_plaza', night: 3, move: 'chase', patrol: [[20, 13], [20, 17]], battle: 'a11_n3_right' },
    { id: 'a11_e_woods1', room: 'fest2_woods', night: 3, move: 'chase', patrol: [[18, 20], [18, 27]], battle: 'a11_n3_woods1' },
    { id: 'a11_e_woods2', room: 'fest2_woods', night: 3, patrol: [[11, 7], [11, 13]], battle: 'a11_n3_woods2' },
  ],
  boss: { ...base.boss, room: 'fest2_woods', cell: [11, 3] },
  // 写しの人：1つの部屋の1つの晩に1人まで（広場の1晩目だけ2人）
  talkers: [
    { id: 'a11_voice_yukata', room: 'fest2_gate', cell: [3, 11], until: 1, scene: 'a11_voice_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_knob', text: '浴衣の女の人「そういえば、屋台の裏の左の奥で、何か光ってたわ」\n（地図に印が付いた）' } },
    { id: 'a11_voice_cotton', room: 'fest2_plaza', cell: [18, 24], until: 1, scene: 'a11_voice_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「甘いの食べて、ひと休みしな」\n（HP・MP が少し回復した）' } },
    { id: 'a11_voice_goldfish', room: 'fest2_plaza', cell: [8, 32], until: 1, scene: 'a11_voice_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'goldfishNoise', element: 'ice', text: '金魚すくいのおじさん「さっきの金魚みたいな砂嵐、冷たいのが苦手みたいだったよ」\n（金魚ノイズの弱点：氷 が分かった）' } },
    { id: 'a11_voice2_cotton', room: 'fest2_plaza', cell: [19, 12], night: 2, until: 2, scene: 'a11_voice2_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「疲れた顔してるね。ほら、ひと口」\n（HP・MP が少し回復した）' } },
    { id: 'a11_voice2_yukata', room: 'fest2_lane', cell: [14, 15], night: 2, until: 2, scene: 'a11_voice2_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_mask', text: '浴衣の女の人「東の屋台のお面屋さん、お面をひとつなくして困ってたわ」\n（地図に印が付いた）' } },
    { id: 'a11_voice2_goldfish', room: 'fest2_east', cell: [8, 19], night: 2, until: 2, scene: 'a11_voice2_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'maskNoise', element: 'fire', text: '金魚すくいのおじさん「お面の砂嵐は、火に弱いらしいぜ」\n（お面ノイズの弱点：火 が分かった）' } },
    { id: 'a11_voice3_yukata', room: 'fest2_plaza', cell: [9, 13], night: 3, scene: 'a11_voice3_yukata', label: '浴衣の女の人', gift: { kind: 'hint', target: 'p_lantern1', text: '浴衣の女の人「やぐらの提灯はね、右から灯して、次は左、最後に下よ」\n（地図に印が付いた）' } },
    { id: 'a11_voice3_goldfish', room: 'fest2_woods', cell: [7, 30], night: 3, scene: 'a11_voice3_goldfish', label: '金魚すくいのおじさん', gift: { kind: 'weak', enemy: 'cottonNoise', element: 'thunder', text: '金魚すくいのおじさん「わたあめの砂嵐は、ビリッとくるのが苦手でな」\n（わたあめノイズの弱点：雷 が分かった）' } },
    { id: 'a11_voice3_cotton', room: 'fest2_woods', cell: [17, 15], night: 3, scene: 'a11_voice3_cotton', label: 'わたあめ屋', gift: { kind: 'rest', rate: 0.3, text: 'わたあめ屋「ここまで来たんだ、もうひと踏ん張り」\n（HP・MP が少し回復した）' } },
  ],
  // 仕掛けの扉（段階264）：仕掛けを解くまで通れない
  gates: [
    { id: 'g_dark', room: 'fest2_backyard', cells: box(7, 19, 27, 37), by: 'p_generator', look: 'dark', label: '停電で真っ暗' },
    { id: 'g_cart', room: 'fest2_lane', cells: box(3, 5, 16, 16), by: 'p_cart', look: 'cart', label: '荷車' },
    { id: 'g_crowd', room: 'fest2_plaza', cells: box(20, 20, 27, 30), by: 'p_song', look: 'crowd', label: '人混み' },
    { id: 'g_gap', room: 'fest2_east', cells: box(7, 9, 11, 12), by: 'p_mask', look: 'fence', label: '射的の裏の板' },
    { id: 'g_stones', room: 'fest2_woods', cells: [...box(11, 12, 17, 27), ...box(9, 14, 21, 23)], by: 'p_camera', look: 'water', label: '池の霧' },
  ],
  // 仕掛けと仲間の力（段階264。docs/milestones/M3_explore_feel.md の 5-7）。1部屋に1つまで
  gadgets: [
    // 屋台の裏：発電機を直す（左上の行き止まりで、つまみを拾う）
    { id: 'p_knob', room: 'fest2_backyard', cell: [4, 5], kind: 'item', mark: '品', label: 'つまみ', done: '発電機のつまみを拾った。どこかで使えそう' },
    { id: 'p_generator', room: 'fest2_backyard', cell: [11, 21], kind: 'use', needs: 'p_knob', mark: '発', label: '発電機', need: '止まった発電機。つまみが外れている', done: 'つまみを付けると、発電機がうなりを上げた！\n下の路地の提灯が灯った' },
    // 屋台の裏の、後で来る所（早瀬が直す）
    { id: 'l_door', room: 'fest2_backyard', cell: [2, 31], kind: 'later', ally: 'hayase', mark: '直', label: '壊れた木戸', need: '壊れた木戸。……直せる人がいれば', done: '早瀬が木戸を直した（この先は、また今度）' },
    // 屋台の裏通り：荷車を上から押す（2晩目）。行き止まりで、お面を拾う
    { id: 'p_cart', room: 'fest2_lane', night: 2, cell: [4, 16], kind: 'push', from: [4, 15], mark: '車', label: '荷車', need: '荷車が道をふさいでいる。反対の側から押せば動きそう', done: '荷車を押した！ 下の道へ抜けられる' },
    { id: 'p_mask_item', room: 'fest2_lane', night: 2, cell: [8, 6], kind: 'item', mark: '品', label: '狐のお面', done: '狐のお面を拾った。どこかの屋台の物みたい' },
    // 東の屋台：お面を届ける（2晩目）
    { id: 'p_mask', room: 'fest2_east', night: 2, cell: [12, 4], kind: 'use', needs: 'p_mask_item', mark: '屋', label: 'お面屋', need: 'お面屋「狐のお面がひとつ、見当たらなくてねえ」', done: 'お面屋「おお、それそれ！ ありがとよ。お礼に、射的の裏を通っていいよ」' },
    // 東の屋台の、後で来る所（みおが動かす）
    { id: 'l_vending', room: 'fest2_east', cell: [20, 3], kind: 'later', ally: 'mio', mark: '雷', label: '止まった自販機', need: '止まった自販機。……電気を流せる人がいれば', done: 'みおが自販機を動かした（この先は、また今度）' },
    // 縁日の広場：あかりが歌う（人混みが道をあける）
    { id: 'p_song', room: 'fest2_plaza', cell: [20, 28], kind: 'ability', ally: 'akari', mark: '歌', label: '人混み', need: '人混みで通れない', done: 'あかりが小さく歌うと、写しの人たちが振り向いて、道をあけた' },
    // 縁日の広場：提灯を順に灯す（3晩目。右 → 左 → 下）
    { id: 'p_lantern1', room: 'fest2_plaza', night: 3, cell: [17, 24], kind: 'order', group: 'p_lanterns', index: 0, mark: '灯', label: '提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろうと、やぐらの太鼓が鳴った！\nやぐらの前で、何か光っている' },
    { id: 'p_lantern2', room: 'fest2_plaza', night: 3, cell: [6, 24], kind: 'order', group: 'p_lanterns', index: 1, mark: '灯', label: '提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろうと、やぐらの太鼓が鳴った！\nやぐらの前で、何か光っている' },
    { id: 'p_lantern3', room: 'fest2_plaza', night: 3, cell: [11, 32], kind: 'order', group: 'p_lanterns', index: 2, mark: '灯', label: '提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろうと、やぐらの太鼓が鳴った！\nやぐらの前で、何か光っている' },
    // 社の森：ハルトのカメラで写す（3晩目。池の霧に隠れた飛び石が写る）
    { id: 'p_camera', room: 'fest2_woods', night: 3, cell: [11, 16], kind: 'ability', ally: 'hero', mark: 'カ', label: '池の霧', need: '池に霧が立ちこめている', done: 'ハルトがカメラを向けると、霧の中に飛び石が写った！' },
    // 思い出の一枚（段階265。ハルトのカメラで撮ると、その場所の昔の一場面）。1-1 に4枚。入口のほかは、仕掛けを解いた先
    { id: 'm_gate', room: 'fest2_gate', cell: [13, 11], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（鳥居の前）\n浴衣の女の子が、兄の袖を引っぱっている。「お兄ちゃん、はやく！」' },
    { id: 'm_yagura', room: 'fest2_plaza', cell: [21, 29], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（やぐらの陰）\n男の子が、小さな財布の中身を数えている。……金魚すくい、一回分' },
    { id: 'm_shooting', room: 'fest2_east', cell: [11, 13], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（射的の裏）\n金魚の袋を抱えた女の子が、泣きべそで兄を呼んでいる' },
    { id: 'm_pond', room: 'fest2_woods', night: 3, cell: [11, 22], kind: 'photo', mark: '写', label: '思い出の一枚', done: '思い出の一枚（池のほとり）\n二人で金魚の袋をのぞきこむ。「この子の名前、なんにする？」' },
    // 社の森の、後で来る所（小夜子が切る）
    { id: 'l_bamboo', room: 'fest2_woods', night: 3, cell: [2, 22], kind: 'later', ally: 'sayoko', mark: '刀', label: '竹やぶ', need: '竹やぶで通れない。……切れる人がいれば', done: '小夜子が竹やぶを切った（この先は、また今度）' },
  ],
  // 仕掛けの扉（段階264）：仕掛けを解くまで通れない
  gates: [
    { id: 'g_dark', room: 'fest2_backyard', cells: box(7, 19, 27, 37), by: 'p_generator', look: 'dark', label: '停電で真っ暗' },
    { id: 'g_cart', room: 'fest2_lane', cells: box(3, 5, 16, 16), by: 'p_cart', look: 'cart', label: '荷車' },
    { id: 'g_crowd', room: 'fest2_plaza', cells: box(20, 20, 27, 30), by: 'p_song', look: 'crowd', label: '人混み' },
    { id: 'g_gap', room: 'fest2_east', cells: box(7, 9, 11, 12), by: 'p_mask', look: 'fence', label: '射的の裏の板' },
    { id: 'g_stones', room: 'fest2_woods', cells: [...box(11, 12, 17, 27), ...box(9, 14, 21, 23)], by: 'p_camera', look: 'water', label: '池の霧' },
  ],
  // 仕掛けと仲間の力（段階264。docs/milestones/M3_explore_feel.md の 5-7）。1部屋に1つまで
  gadgets: [
    // 屋台の裏：発電機を直す（左上の行き止まりで、つまみを拾う）
    { id: 'p_knob', room: 'fest2_backyard', cell: [4, 5], kind: 'item', mark: '品', label: 'つまみ', done: '発電機のつまみを拾った。どこかで使えそう' },
    { id: 'p_generator', room: 'fest2_backyard', cell: [11, 21], kind: 'use', needs: 'p_knob', mark: '発', label: '発電機', need: '止まった発電機。つまみが外れている', done: 'つまみを付けると、発電機がうなりを上げた！\n下の路地の提灯が灯った' },
    // 屋台の裏の、後で来る所（早瀬が直す）
    { id: 'l_door', room: 'fest2_backyard', cell: [2, 31], kind: 'later', ally: 'hayase', mark: '直', label: '壊れた木戸', need: '壊れた木戸。……直せる人がいれば', done: '早瀬が木戸を直した（この先は、また今度）' },
    // 屋台の裏通り：荷車を上から押す（2晩目）。行き止まりで、お面を拾う
    { id: 'p_cart', room: 'fest2_lane', night: 2, cell: [4, 16], kind: 'push', from: [4, 15], mark: '車', label: '荷車', need: '荷車が道をふさいでいる。反対の側から押せば動きそう', done: '荷車を押した！ 下の道へ抜けられる' },
    { id: 'p_mask_item', room: 'fest2_lane', night: 2, cell: [8, 6], kind: 'item', mark: '品', label: '狐のお面', done: '狐のお面を拾った。どこかの屋台の物みたい' },
    // 東の屋台：お面を届ける（2晩目）
    { id: 'p_mask', room: 'fest2_east', night: 2, cell: [12, 4], kind: 'use', needs: 'p_mask_item', mark: '屋', label: 'お面屋', need: 'お面屋「狐のお面がひとつ、見当たらなくてねえ」', done: 'お面屋「おお、それそれ！ ありがとよ。お礼に、射的の裏を通っていいよ」' },
    // 東の屋台の、後で来る所（みおが動かす）
    { id: 'l_vending', room: 'fest2_east', cell: [20, 3], kind: 'later', ally: 'mio', mark: '雷', label: '止まった自販機', need: '止まった自販機。……電気を流せる人がいれば', done: 'みおが自販機を動かした（この先は、また今度）' },
    // 縁日の広場：あかりが歌う（人混みが道をあける）
    { id: 'p_song', room: 'fest2_plaza', cell: [20, 28], kind: 'ability', ally: 'akari', mark: '歌', label: '人混み', need: '人混みで通れない', done: 'あかりが小さく歌うと、写しの人たちが振り向いて、道をあけた' },
    // 縁日の広場：提灯を順に灯す（3晩目。右 → 左 → 下）
    { id: 'p_lantern1', room: 'fest2_plaza', night: 3, cell: [17, 24], kind: 'order', group: 'p_lanterns', index: 0, mark: '灯', label: '提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろうと、やぐらの太鼓が鳴った！\nやぐらの前で、何か光っている' },
    { id: 'p_lantern2', room: 'fest2_plaza', night: 3, cell: [6, 24], kind: 'order', group: 'p_lanterns', index: 1, mark: '灯', label: '提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろうと、やぐらの太鼓が鳴った！\nやぐらの前で、何か光っている' },
    { id: 'p_lantern3', room: 'fest2_plaza', night: 3, cell: [11, 32], kind: 'order', group: 'p_lanterns', index: 2, mark: '灯', label: '提灯', need: '提灯がふっと消えた……順番がちがうみたい', done: '3つの提灯がそろうと、やぐらの太鼓が鳴った！\nやぐらの前で、何か光っている' },
    // 社の森：ハルトのカメラで写す（3晩目。池の霧に隠れた飛び石が写る）
    { id: 'p_camera', room: 'fest2_woods', night: 3, cell: [11, 16], kind: 'ability', ally: 'hero', mark: 'カ', label: '池の霧', need: '池に霧が立ちこめている', done: 'ハルトがカメラを向けると、霧の中に飛び石が写った！' },
    // 社の森の、後で来る所（小夜子が切る）
    { id: 'l_bamboo', room: 'fest2_woods', night: 3, cell: [2, 22], kind: 'later', ally: 'sayoko', mark: '刀', label: '竹やぶ', need: '竹やぶで通れない。……切れる人がいれば', done: '小夜子が竹やぶを切った（この先は、また今度）' },
  ],
  // 途中の会話は今のまま（東の屋台に入った時の会話だけ、部屋の id を新しい部屋に）
  triggers: base.triggers.map((t) => (t.on === 'room' && t.room === 'fest_east' ? { ...t, room: 'fest2_east' } : t)),
};
