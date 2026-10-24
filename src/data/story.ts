import type { Flow, FlowEvent } from '../core/flow';
import type { Lineup } from '../core/lineup';
import type { Story } from '../core/progress';
import { V1_AREA_ID, V1_CHAPTER_ID } from '../core/save';
import type { CampaignBattle } from './campaign';
import { CAMPAIGN } from './campaign';
import { AKARI, HERO, MIO, SAYOKO } from './characters';

// 物語の章 → 区画 → 戦闘（段階13）。今は試作の1章・1区画に、今までの5戦だけ。
// 章・区画・戦闘の id はセーブが覚えるので、名前を変えても id は変えない

/** 試作の章と区画の id。版1のセーブ（段階11・12）を直す時に、この場所に置き換える */
export const PROTOTYPE_CHAPTER_ID = V1_CHAPTER_ID;
export const PROTOTYPE_AREA_ID = V1_AREA_ID;

export const STORY: Story<CampaignBattle> = [
  {
    id: PROTOTYPE_CHAPTER_ID,
    name: '試作',
    areas: [{ id: PROTOTYPE_AREA_ID, name: '試作の5戦', battles: CAMPAIGN }],
  },
];

// ---- パーティと育成の開放（段階26） ----

/** 試作の5戦（デバッグメニュー）：3人で戦い、育成をすべて開ける */
export const PROTOTYPE_LINEUP: Lineup = { members: [HERO.id, AKARI.id, MIO.id], unlocks: { growth: true, navi: true, weapon: true } };

/** 1章：ハルトとあかりの2人。育成は星図と武器だけ（みおの加入とムーブメントは2章。M2 で開ける） */
export const CHAPTER1_LINEUP: Lineup = { members: [HERO.id, AKARI.id], unlocks: { growth: true, navi: false, weapon: true }, chapter: 1 };

/** 2章（段階38）：みおが加わって3人。ムーブメントも開ける（どの育成も、探索のチェックポイントから開く。初めて開けるのは 2-1 の銭湯の前） */
export const CHAPTER2_LINEUP: Lineup = { members: [HERO.id, AKARI.id, MIO.id], unlocks: { growth: true, navi: true, weapon: true }, chapter: 2 };
/**
 * 2章の始め（8日目の朝・昼。段階108。テストプレイのメモ 1・21）：みおが加わる 5-C（d5_evening）より前は、1章と同じ2人で、ムーブメントもまだ開かない。
 * 8日目の昼に拠点（レストピア）を開けるようになったので、星図にみおが出て、ムーブメントのメニューが出ていた
 */
export const CHAPTER2_EARLY_LINEUP: Lineup = { members: [HERO.id, AKARI.id], unlocks: { growth: true, navi: false, weapon: true }, chapter: 2 };

/** 3章（段階88）：3-1 までは2章と同じ3人（小夜子の加入と、その後の戦闘の人数は段階89・90 で決める） */
export const CHAPTER3_LINEUP: Lineup = { members: [HERO.id, AKARI.id, MIO.id], unlocks: { growth: true, navi: true, weapon: true }, chapter: 3 };
/**
 * 小夜子が加わった後の3章（段階91。祭りの夜の2晩目から）。仲間は4人で、戦闘に出るのは3人。ハルトは外せない（docs/design/battle.md の決定の記録）。
 * 誰が出るかは、探索のチェックポイントの星図と、拠点の「並び」で選ぶ（PartyScene）
 */
export const CHAPTER3_SAYOKO_LINEUP: Lineup = {
  members: [HERO.id, AKARI.id, MIO.id, SAYOKO.id],
  size: 3,
  fixed: [HERO.id],
  unlocks: { growth: true, navi: true, weapon: true },
  chapter: 3,
};

// ---- 物語の流れ（段階23）：プロローグ → 1日目 → 1-1 → 時間を返す → 2日目 →（段階34）3日目〜8日目 → 2章の終わりの「つづく」 ----
// 会話の出来事の id は、台本（scriptM1.ts・scriptM2.ts）の場面の id と同じにする。セーブは出来事の id で覚えるので、名前を変えても id は変えない。
// 昼の日常は日常の画面（段階24）、探索は探索の画面（段階25）、時間を返すのは返す画面（段階28）。
// まだ中身のない出来事は仮の画面（段階34）：案内（note）を書く。中身を作る段階で案内を消す。
// 段階36：仮の探索・時間を返すにも区画の id（area）を書く（返した翌日の場面を出すため）。2-3 は返す直前にカイに持ち去られるので、返す出来事の代わりに物語の戦闘（battle）を置いた（段階40）。2章の終わりまで、仮の画面はもうない

const talk = (id: string, title: string): FlowEvent => ({ id, kind: 'dialogue', title });
const day = (n: number): FlowEvent => ({ id: `day${n}`, kind: 'day', title: `${n}日目`, day: n });

export const SLICE_FLOW: Flow = [
  {
    id: 'prologue',
    name: 'プロローグ「あの夏」',
    events: [
      talk('prologue_open', 'プロローグ：参道の入口'),
      // 屋台めぐり（段階24。屋台の場面は daily.ts の DAILY_HUBS）
      { id: 'prologue_stalls', kind: 'daily', title: 'プロローグ：屋台めぐり' },
      talk('prologue_end', 'プロローグ：石段の上と、花火'),
    ],
  },
  {
    id: 'ch1',
    name: '第1章「あっという間の夏」',
    lineup: CHAPTER1_LINEUP,
    events: [
      talk('chapter1_title', '第1章'),
      { id: 'day1', kind: 'day', title: '1日目', day: 1 },
      talk('d1_morning', '1日目：朝'),
      talk('d1_classroom', '1日目：朝の教室'),
      talk('d1_street', '1日目：放課後の商店街'),
      // 自由な時間（段階24。場所と印は daily.ts の DAILY_HUBS）
      { id: 'd1_free', kind: 'daily', title: '1日目：自由な時間' },
      talk('d1_clockshop', '1日目：夕暮れの時計屋'),
      talk('d1_library', '1日目：レストピアの蔵書の棚'),
      talk('a11_enter', '1-1：縁日に入る'),
      // 1-1 は3晩に分けて入る（段階63。脚本 docs/script/1-1_rework.md）。1晩目「しぶしぶの兄」
      { id: 'a11_explore', kind: 'explore', title: '1-1「金魚の名前」：縁日の1晩目', area: 'a11', night: 1 },
      talk('a11_night1_end', '1日目：夕暮れの時計屋に戻る'),
      day(2),
      talk('d2_classroom', '2日目：朝の教室'),
      talk('d2_rooftop', '2日目：昼休みの屋上'),
      // 2日目の昼（コンビニのゆうまは必ず見る。daily.ts の DAILY_HUBS）
      { id: 'd2_free', kind: 'daily', title: '2日目：昼' },
      talk('a11_night2_enter', '2日目：縁日の2晩目に入る'),
      // 2晩目「迷子」
      { id: 'a11_explore2', kind: 'explore', title: '1-1「金魚の名前」：縁日の2晩目', area: 'a11', night: 2 },
      talk('a11_night2_end', '2日目：すれ違い'),
      day(3),
      talk('d3_home', '3日目：朝の施設'),
      // 3日目の昼（ひなのに会うのは必ず見る）
      { id: 'a11_day3_free', kind: 'daily', title: '3日目：昼' },
      talk('d3_walk', '3日目：帰り道'),
      talk('d3_yuma', '3日目：コンビニの前'),
      talk('a11_night3_enter', '3日目：縁日の3晩目に入る'),
      // 3晩目「ふたりで、なつまつり」
      { id: 'a11_explore3', kind: 'explore', title: '1-1「金魚の名前」：縁日の3晩目', area: 'a11', night: 3 },
      // 時間を返す（段階28。集めたコマで、盗まれた時間を持ち主へ返す。画面は ReturnScene）
      { id: 'a11_return', kind: 'return', title: '1-1：時間を返す', area: 'a11' },
      talk('a11_returned', '3日目：時間を返した後'),
      day(4),
      talk('d4_yuma', '4日目：朝・ゆうまの電話'),
      talk('d4_rooftop', '4日目：昼休みの屋上'),
      // ---- 1章の残り（段階34。脚本 docs/script/M2.md の 3日目・4日目） ----
      // 3日目〜8日目の昼は、誰と過ごすか（段階35。場所と印は daily.ts の DAILY_HUBS、絆の出来事は BOND_EVENTS）
      // 1-2 は3晩に分けて入る（段階66。脚本 docs/script/1-2_rework.md）。出来事の id はセーブが覚えるので、前の d3_…・d4_… のまま
      { id: 'd3_free', kind: 'daily', title: '4日目：昼' },
      talk('d3_library', '4日目：夕暮れ・蔵書の棚'),
      talk('a12_enter', '1-2：商店街に入る'),
      // 1晩目「出迎えの支度」
      { id: 'a12_explore', kind: 'explore', area: 'a12', night: 1, title: '1-2「夕暮れの二人乗り」：商店街の1晩目' },
      talk('a12_night1_end', '4日目：夕暮れの時計屋に戻る'),
      day(5),
      talk('d3_classroom', '5日目：朝の教室'),
      { id: 'a12_day5_free', kind: 'daily', title: '5日目：昼' },
      talk('d5_fumi_house', '5日目：ふみさんの家の前'),
      talk('a12_night2_enter', '5日目：商店街の2晩目に入る'),
      // 2晩目「帰り道」
      { id: 'a12_explore2', kind: 'explore', area: 'a12', night: 2, title: '1-2「夕暮れの二人乗り」：商店街の2晩目' },
      talk('a12_night2_end', '5日目：砂時計のひび'),
      day(6),
      talk('d6_fumi_call', '6日目：朝・ふみさんからの電話'),
      talk('d6_slope', '6日目：今の商店街の坂'),
      talk('a12_night3_enter', '6日目：商店街の3晩目に入る'),
      // 3晩目「振り返った顔」
      { id: 'a12_explore3', kind: 'explore', area: 'a12', night: 3, title: '1-2「夕暮れの二人乗り」：商店街の3晩目' },
      { id: 'a12_return', kind: 'return', area: 'a12', title: '1-2：時間を返す' },
      talk('d3_return', '6日目：時間を返す'),
      day(7),
      talk('d4_fumi', '7日目：朝・来る日じゃないのに'),
      { id: 'd4_free', kind: 'daily', title: '7日目：昼' },
      talk('d4_evening', '7日目：夕暮れ・1章の終わり'),
    ],
  },
  {
    id: 'ch2',
    name: '第2章「背中を押す声」',
    // みおを入れた3人と、ムーブメントの開放（段階38）。みおが仲間になるのは 5-C（d5_evening）で、それより前に戦闘はない。
    // それより前（8日目の朝・昼）は2人で、ムーブメントも開かない（段階108）
    lineup: CHAPTER2_EARLY_LINEUP,
    lineupChanges: [{ from: 'd5_evening', lineup: CHAPTER2_LINEUP }],
    // 段階63・66で 1-1・1-2 を3晩に広げたので、2章は8日目から（出来事の id は d5_… のまま）。
    // 段階78：2-1 を3晩に分けて入る形にし（脚本 docs/script/2-1_rework.md）、8〜11日目にした。2-2・2-3 と2章の終わりは、中身は今のまま12〜14日目にずらした。
    // 段階82：2-2 を3晩に分け（12〜14日目）、返した翌日（15日目）を足した。
    // 段階85：2-3 を3晩に分け（16〜18日目）、4晩目に書庫から取り返して返す。段階103：19日目は手が出せない日、取り返すのは20日目、返した翌日の21日目が2章の終わり
    events: [
      talk('chapter2_title', '第2章'),
      day(8),
      talk('d5_morning', '8日目：朝の通学路'),
      { id: 'd5_free', kind: 'daily', title: '8日目：昼' },
      talk('d5_evening', '8日目：夕暮れ・みおの加入'),
      // 2-1 の区画（段階38・39。areas.ts の AREAS の a21）。みおの武器とムーブメントの開放、町工場の砂嵐と「旋盤のぬし」。1晩目「今日はお前がやれ」
      talk('a21_enter', '2-1：路地に入る'),
      { id: 'a21_explore', kind: 'explore', area: 'a21', night: 1, title: '2-1「親方の背中」：町工場の1晩目' },
      talk('a21_night1_end', '8日目：夕暮れの時計屋に戻る'),
      day(9),
      // 9日目の昼（工場の片付けと、松の湯のすみさんは必ず見る）
      { id: 'a21_day9_free', kind: 'daily', title: '9日目：昼' },
      talk('a21_night2_enter', '9日目：町工場の2晩目に入る'),
      // 2晩目「欠けた歯」
      { id: 'a21_explore2', kind: 'explore', area: 'a21', night: 2, title: '2-1「親方の背中」：町工場の2晩目' },
      talk('a21_night2_end', '9日目：夕暮れの時計屋に戻る'),
      day(10),
      talk('d10_rooftop', '10日目：昼休みの屋上'),
      // 10日目の昼（いさむの本音は必ず見る）
      { id: 'a21_day10_free', kind: 'daily', title: '10日目：昼' },
      talk('a21_night3_enter', '10日目：町工場の3晩目に入る'),
      // 3晩目「いい仕事だ」
      { id: 'a21_explore3', kind: 'explore', area: 'a21', night: 3, title: '2-1「親方の背中」：町工場の3晩目' },
      { id: 'a21_return', kind: 'return', area: 'a21', title: '2-1：時間を返す' },
      talk('d5_return', '10日目：時間を返す'),
      day(11),
      // 2-1 を返した翌日（いさむの工場は、返した翌日の印。daily.ts の RETURN_VISITS）。夜は記憶に入らない（話の間の日）
      { id: 'd6_free', kind: 'daily', title: '11日目：昼' },
      talk('d6_library', '11日目：夕暮れ・調査ノート'),
      day(12),
      { id: 'd12_free', kind: 'daily', title: '12日目：昼' },
      talk('d12_library', '12日目：夕暮れ・蔵書の棚'),
      // 2-2 の区画（段階39b。areas.ts の AREAS の a22）。段階82 で3晩に分けた（脚本 docs/script/2-2_rework.md）。
      // 第1夜「朝の音楽室」（校門・中庭・駐輪場）
      talk('a22_enter', '2-2：校門に入る'),
      { id: 'a22_explore', kind: 'explore', area: 'a22', night: 1, title: '2-2「最後の文化祭」：高校の1晩目' },
      talk('a22_night1_end', '12日目：夕暮れの時計屋に戻る'),
      day(13),
      // 13日目の昼（病院の帰り道のさきは必ず見る）
      { id: 'a22_day13_free', kind: 'daily', title: '13日目：昼' },
      talk('a22_night2_enter', '13日目：高校の2晩目に入る'),
      // 第2夜「ひどい一言」（渡り廊下・お化け屋敷の教室・番人）
      { id: 'a22_explore2', kind: 'explore', area: 'a22', night: 2, title: '2-2「最後の文化祭」：高校の2晩目' },
      talk('a22_night2_end', '13日目：夕暮れの時計屋に戻る'),
      day(14),
      // 14日目の昼（楽器店のけんたは必ず見る）
      { id: 'a22_day14_free', kind: 'daily', title: '14日目：昼' },
      talk('a22_night3_enter', '14日目：高校の3晩目に入る'),
      // 第3夜「最後の曲」（体育館の「アンプのぬし」）
      { id: 'a22_explore3', kind: 'explore', area: 'a22', night: 3, title: '2-2「最後の文化祭」：高校の3晩目' },
      { id: 'a22_return', kind: 'return', area: 'a22', title: '2-2：時間を返す' },
      talk('d6_return', '14日目：時間を返す'),
      day(15),
      // 2-2 を返した翌日（けんたの楽器店は、返した翌日の印。daily.ts の RETURN_VISITS）。夜は記憶に入らない（話の間の日）
      { id: 'd15_free', kind: 'daily', title: '15日目：昼' },
      talk('d15_petra', '15日目：夕暮れ・交換所の窓口'),
      day(16),
      // 2-3 の区画（段階40。areas.ts の AREAS の a23）。段階85 で3晩＋取り返す4晩目に分けた（脚本 docs/script/2-3_rework.md）。
      // 16日目（日曜）の昼：パン屋のこうじとそうたは必ず見る。第1夜「ベンチも試合のうち」
      { id: 'd7_free', kind: 'daily', title: '16日目：昼' },
      talk('d7_library', '16日目：夕暮れ・蔵書の棚'),
      talk('a23_enter', '2-3：河川敷に入る'),
      { id: 'a23_explore', kind: 'explore', area: 'a23', night: 1, title: '2-3「最後の打席」：河川敷の1晩目' },
      talk('a23_night1_end', '16日目：夕暮れの時計屋に戻る'),
      day(17),
      // 17日目の昼（河川敷のまさるさんは必ず見る）。第2夜「来んなよ」
      { id: 'a23_day17_free', kind: 'daily', title: '17日目：昼' },
      talk('a23_night2_enter', '17日目：河川敷の2晩目に入る'),
      { id: 'a23_explore2', kind: 'explore', area: 'a23', night: 2, title: '2-3「最後の打席」：河川敷の2晩目' },
      talk('a23_night2_end', '17日目：夕暮れの時計屋に戻る'),
      day(18),
      // 18日目の昼（こうじさんの本音は必ず見る）。第3夜「お前なら打てる」。ぬしに勝ってコマがそろった後、返す直前にカイが現れる（負け戦）
      { id: 'a23_day18_free', kind: 'daily', title: '18日目：昼' },
      talk('a23_night3_enter', '18日目：河川敷の3晩目に入る'),
      { id: 'a23_explore3', kind: 'explore', area: 'a23', night: 3, title: '2-3「最後の打席」：河川敷の3晩目' },
      talk('d7_kai', '18日目：返す直前にカイ'),
      { id: 'a23_kai', kind: 'battle', battle: 'a23_kai', title: '2-3：カイとの戦い（負け戦）' },
      talk('d7_taken', '18日目：持ち去られる'),
      day(19),
      talk('d8_classroom', '19日目：朝の教室'),
      // 19日目の昼（パン屋のこうじさんは必ず見る）。段階103：持ち去られた翌日は「手が出せない日」。夕暮れに棚へ行っても、書庫への道が分からない
      { id: 'd8_free', kind: 'daily', title: '19日目：昼' },
      talk('d19_noway', '19日目：夕暮れ・届かない棚'),
      day(20),
      // 20日目の昼（河川敷のまさるさんは必ず見る。段階103 で19日目から移した）。夕暮れに交換所のペトラが通用口を開ける
      { id: 'a23_day20_free', kind: 'daily', title: '20日目：昼' },
      talk('d19_petra', '20日目：夕暮れ・交換所の窓口'),
      // 第4夜「取り返す」：保管局の奥の書庫（areas.ts の a23x）。カイから逃げきって、棚の砂時計を取り返す
      talk('a23x_enter', '2-3：保管局の奥の書庫に入る'),
      { id: 'a23x_explore', kind: 'explore', area: 'a23x', logArea: 'a23', title: '2-3「最後の打席」：保管局の奥の書庫' },
      talk('a23_shelf', '20日目：正しい棚に戻す'),
      { id: 'a23_return', kind: 'return', area: 'a23', title: '2-3：時間を返す' },
      talk('d19_return', '20日目：時間を返す'),
      day(21),
      // 21日目（木曜・祝日）：返した翌日のこうじさん（daily.ts の RETURN_VISITS）。夕暮れに2章の終わり
      { id: 'd20_free', kind: 'daily', title: '21日目：昼' },
      talk('d8_evening', '21日目：夕暮れ・2章の終わり'),
    ],
  },
  {
    id: 'ch3',
    name: '第3章「さよならの言い方」',
    lineup: CHAPTER3_LINEUP,
    // 段階91：祭りの夜の2晩目に入る所で、小夜子が加わる
    lineupChanges: [{ from: 'a3s_night2_enter', lineup: CHAPTER3_SAYOKO_LINEUP }],
    // 段階88：3-1「はじめての仕送り」を3晩で（脚本 docs/script/3-1.md）。22〜25日目。25日目の夕暮れに、大正の祭りの夜の入口まで
    events: [
      talk('chapter3_title', '第3章'),
      day(22),
      talk('d21_classroom', '22日目：文化祭の前の日'),
      // 22日目（金曜）の昼：時計屋のちよさんとのぼるさんは必ず見る（daily.ts の DAILY_HUBS）。第1夜「ただいま」
      { id: 'd21_free', kind: 'daily', title: '22日目：昼' },
      talk('d21_library', '22日目：夕暮れ・蔵書の棚'),
      // 3-1 の区画（areas.ts の a31）
      talk('a31_enter', '3-1：村に着く'),
      { id: 'a31_explore', kind: 'explore', area: 'a31', night: 1, title: '3-1「はじめての仕送り」：村の1晩目' },
      talk('a31_night1_end', '22日目：蔵書の棚に戻る'),
      day(23),
      // 23日目（土曜）：文化祭の時計の博物館と、その後の中庭ののぼるさんは必ず見る。第2夜「ひびの手」
      { id: 'a31_day22_free', kind: 'daily', title: '23日目：文化祭' },
      talk('a31_night2_enter', '23日目：村の2晩目に入る'),
      { id: 'a31_explore2', kind: 'explore', area: 'a31', night: 2, title: '3-1「はじめての仕送り」：村の2晩目' },
      talk('a31_night2_end', '23日目：蔵書の棚・赤い鼻緒'),
      day(24),
      // 24日目（日曜）：ひだまり荘のちよさんの本音は必ず見る。第3夜「八時の約束」
      { id: 'a31_day23_free', kind: 'daily', title: '24日目：昼' },
      talk('a31_night3_enter', '24日目：村の3晩目に入る'),
      { id: 'a31_explore3', kind: 'explore', area: 'a31', night: 3, title: '3-1「はじめての仕送り」：村の3晩目' },
      { id: 'a31_return', kind: 'return', area: 'a31', title: '3-1：時間を返す' },
      talk('d23_return', '24日目：時間を返す'),
      day(25),
      // 25日目（月曜）：3-1 を返した翌日の駅のちよさん（daily.ts の RETURN_VISITS）。夕暮れに祭囃子の棚
      { id: 'd24_free', kind: 'daily', title: '25日目：昼' },
      talk('d24_evening', '25日目：夕暮れ・祭囃子'),
      // 段階91：大正の祭りの夜を2晩で（脚本 docs/script/3-matsuri.md）。1晩目は小夜子と歩いて、花火の前に夜が巻き戻る（areas.ts の a3s1）
      talk('a3s_enter', '祭りの夜：題のすり切れた棚'),
      { id: 'a3s_explore', kind: 'explore', area: 'a3s1', logArea: 'a3s', title: '祭りの夜「提灯の下の少女」：1晩目' },
      talk('a3s_night1_end', '25日目：時計屋の奥に戻る'),
      day(26),
      // 26日目（火曜）：町の神社の宮司さんは必ず見る。夕暮れに祭りの夜の2晩目（小夜子が加わる。areas.ts の a3s2）
      { id: 'd25_free', kind: 'daily', title: '26日目：昼' },
      talk('a3s_night2_enter', '26日目：祭りの夜の2晩目に入る'),
      { id: 'a3s_explore2', kind: 'explore', area: 'a3s2', logArea: 'a3s', title: '祭りの夜「百回目の夏」：2晩目' },
      talk('a3s_night2_end', '26日目：時計屋の奥に戻る'),
      day(27),
      // 27日目（水曜）：小夜子と今の町を歩くのと、のぼるさんの電話は必ず見る
      { id: 'd26_free', kind: 'daily', title: '27日目：昼' },
      talk('d26_evening', '27日目：夕暮れ・また明日'),
      // 段階94：3-2「言えなかった卒業式」を3晩で（脚本 docs/script/3-2.md）。28〜31日目。並びは4人から3人（小夜子が加わった後の形）
      day(28),
      // 28日目（木曜）：商店街の緩める話（しりとりと海水浴計画）と、時計屋のしおりさんは必ず見る。第1夜「校門」
      { id: 'd27_free', kind: 'daily', title: '28日目：昼' },
      talk('d27_library', '28日目：夕暮れ・蔵書の棚'),
      // 3-2 の区画（areas.ts の a32）
      talk('a32_enter', '3-2：校門の坂に入る'),
      { id: 'a32_explore', kind: 'explore', area: 'a32', night: 1, title: '3-2「言えなかった卒業式」：帰り道の1晩目' },
      talk('a32_night1_end', '28日目：蔵書の棚に戻る'),
      day(29),
      // 29日目（金曜）：楽器店のとうやさんと、その後の時計屋の前のしおりさんは必ず見る。第2夜「片耳ずつ」
      { id: 'a32_day28_free', kind: 'daily', title: '29日目：昼' },
      talk('a32_night2_enter', '29日目：帰り道の2晩目に入る'),
      { id: 'a32_explore2', kind: 'explore', area: 'a32', night: 2, title: '3-2「言えなかった卒業式」：帰り道の2晩目' },
      talk('a32_night2_end', '29日目：時計屋に戻る'),
      day(30),
      // 30日目（土曜）：川沿いの道のしおりさんの本音は必ず見る。第3夜「踏切」
      { id: 'a32_day29_free', kind: 'daily', title: '30日目：昼' },
      talk('a32_night3_enter', '30日目：帰り道の3晩目に入る'),
      { id: 'a32_explore3', kind: 'explore', area: 'a32', night: 3, title: '3-2「言えなかった卒業式」：帰り道の3晩目' },
      { id: 'a32_return', kind: 'return', area: 'a32', title: '3-2：時間を返す' },
      talk('d29_return', '30日目：時間を返す'),
      day(31),
      // 31日目（日曜）：3-2 を返した翌日の踏切のしおりさん（daily.ts の RETURN_VISITS）。夕暮れに、言えなかったこと
      { id: 'd30_free', kind: 'daily', title: '31日目：昼' },
      talk('d30_evening', '31日目：夕暮れ・言えなかったこと'),
      // 段階96：カイへのリベンジとノアの口論、3章の終わり（脚本 docs/script/3-kai.md）。32〜33日目
      day(32),
      talk('d31_classroom', '32日目：三回目'),
      // 32日目（月曜）：昼は選べる話だけ。夕暮れの蔵書の棚で、カイが小夜子を枠に入れている
      { id: 'd31_free', kind: 'daily', title: '32日目：昼' },
      talk('d31_library', '32日目：夕暮れ・棚から逃げた蔵書'),
      // 祭りの夜（カイ）。areas.ts の a3k。やぐらの裏の暗がりで、本気のカイと戦う（勝てる戦い）
      talk('a3k_enter', '祭りの夜（カイ）：止まった祭り'),
      { id: 'a3k_explore', kind: 'explore', area: 'a3k', title: '祭りの夜（カイ）「露出オーバー」' },
      talk('a3k_noa', '32日目：ノアとの口論'),
      talk('a3k_noa_alone', '32日目：ノアひとり'),
      talk('d31_return', '32日目：時計屋の奥に戻る'),
      day(33),
      talk('d32_classroom', '33日目：雨の教室'),
      // 33日目（火曜）：昼は選べる話だけ。夕暮れに3章の終わり
      { id: 'd32_free', kind: 'daily', title: '33日目：昼' },
      talk('d32_evening', '33日目：夕暮れ・3章の終わり'),
      // 今の流れの終わり（段階96。30日目の後の ch3_end_d30 から替えた。30日目の「つづく」にいたセーブは、31日目から続く。RENAMED_EVENTS。段階103 で日の数字が1つずれた）
      { id: 'ch3_end_d32', kind: 'end', title: 'つづく' },
    ],
  },
];

/** なくなった出来事 → セーブを読む時に代わりに続ける出来事（段階40。仮の画面だった「2-3：返す」は、段階85 で本当の返す出来事になったので、付け替えを外した） */
// 段階63：1-1 を3晩に分けた時に、なくなった出来事（1日目の返す会話・2日目のすれ違い）は、近い出来事から続ける
// 段階88：流れの終わり（つづく）を2章の終わりから3章の 3-1 の後へ伸ばした。2章の終わりの「つづく」にいたセーブは、3章の扉から続く
// 段階94：流れの終わりを26日目の後から 3-2 の後（30日目）へ伸ばした。26日目の「つづく」にいたセーブは、27日目から続く
// 段階96：流れの終わりを3章の終わり（32日目）の後へ伸ばした。30日目の「つづく」にいたセーブは、31日目から続く
// 段階103：2章が1日延び、3章の日の数字が1つずれた（日の変わり目の id `dayN` も1つずれる）。上の2つの続き先は、同じ所（今の28日目・32日目の始め）を指すように直した
export const RENAMED_EVENTS: Record<string, string> = { d1_return: 'a11_returned', d2_noa: 'a11_night2_end', ch2_end: 'chapter3_title', ch3_end: 'day28', ch3_end_d30: 'day32' };
