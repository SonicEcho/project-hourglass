import type { Flow, FlowEvent } from '../core/flow';
import type { Lineup } from '../core/lineup';
import type { Story } from '../core/progress';
import { V1_AREA_ID, V1_CHAPTER_ID } from '../core/save';
import type { CampaignBattle } from './campaign';
import { CAMPAIGN } from './campaign';
import { AKARI, HERO, MIO } from './characters';

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
export const CHAPTER1_LINEUP: Lineup = { members: [HERO.id, AKARI.id], unlocks: { growth: true, navi: false, weapon: true } };

/** 2章（段階38）：みおが加わって3人。ムーブメントも開ける（どの育成も、探索のチェックポイントから開く。初めて開けるのは 2-1 の銭湯の前） */
export const CHAPTER2_LINEUP: Lineup = { members: [HERO.id, AKARI.id, MIO.id], unlocks: { growth: true, navi: true, weapon: true } };

// ---- 物語の流れ（段階23）：プロローグ → 1日目 → 1-1 → 時間を返す → 2日目 →（段階34）3日目〜8日目 → 2章の終わりの「つづく」 ----
// 会話の出来事の id は、台本（scriptM1.ts・scriptM2.ts）の場面の id と同じにする。セーブは出来事の id で覚えるので、名前を変えても id は変えない。
// 昼の日常は日常の画面（段階24）、探索は探索の画面（段階25）、時間を返すのは返す画面（段階28）。
// まだ中身のない出来事は仮の画面（段階34）：案内（note）を書く。中身を作る段階で案内を消す。
// 段階36：仮の探索・時間を返すにも区画の id（area）を書く（返した翌日の場面を出すため）。2-3 の返す出来事は負け戦なので書かない（段階40で決める）

const talk = (id: string, title: string): FlowEvent => ({ id, kind: 'dialogue', title });
/** 仮の画面の会話（台本はまだない） */
const talkTodo = (id: string, title: string, note: string): FlowEvent => ({ id, kind: 'dialogue', title, note });
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
      // 縁日の探索（段階25。区画は areas.ts の AREAS。探索の途中の会話も、区画のきっかけから出す）
      { id: 'a11_explore', kind: 'explore', title: '1-1「金魚の名前」：縁日の探索', area: 'a11' },
      // 時間を返す（段階28。集めたコマで、盗まれた時間を持ち主へ返す。画面は ReturnScene）
      { id: 'a11_return', kind: 'return', title: '1-1：時間を返す', area: 'a11' },
      talk('d1_return', '1日目：時間を返す'),
      { id: 'day2', kind: 'day', title: '2日目', day: 2 },
      talk('d2_classroom', '2日目：朝の教室'),
      // 2日目の昼（段階24。商店街のコンビニの場面は daily.ts の DAILY_HUBS）
      { id: 'd2_free', kind: 'daily', title: '2日目：昼' },
      talk('d2_noa', '2日目：すれ違い'),
      // ---- 1章の残り（段階34。脚本 docs/script/M2.md の 3日目・4日目） ----
      day(3),
      // 3日目〜8日目の昼は、誰と過ごすか（段階35。場所と印は daily.ts の DAILY_HUBS、絆の出来事は BOND_EVENTS）
      talk('d3_classroom', '3日目：朝の教室'),
      { id: 'd3_free', kind: 'daily', title: '3日目：昼' },
      talk('d3_library', '3日目：夕暮れ・蔵書の棚'),
      // 1-2 の区画（段階37。areas.ts の AREAS の a12。探索の途中の会話は区画のきっかけから出す）
      talk('a12_enter', '1-2：商店街に入る'),
      { id: 'a12_explore', kind: 'explore', area: 'a12', title: '1-2「夕暮れの二人乗り」：商店街の探索' },
      { id: 'a12_return', kind: 'return', area: 'a12', title: '1-2：時間を返す' },
      talk('d3_return', '3日目：時間を返す'),
      day(4),
      { id: 'd4_free', kind: 'daily', title: '4日目：昼' },
      talk('d4_evening', '4日目：夕暮れ・1章の終わり'),
    ],
  },
  {
    id: 'ch2',
    name: '第2章「背中を押す声」',
    // みおを入れた3人と、ムーブメントの開放（段階38）。みおが仲間になるのは 5-C（d5_evening）で、それより前に戦闘はない
    lineup: CHAPTER2_LINEUP,
    events: [
      talk('chapter2_title', '第2章'),
      day(5),
      talk('d5_morning', '5日目：朝の通学路'),
      { id: 'd5_free', kind: 'daily', title: '5日目：昼' },
      talk('d5_evening', '5日目：夕暮れ・みおの加入'),
      // 2-1 の区画（段階38。areas.ts の AREAS の a21）。みおの武器（2-1-1）とムーブメントの開放（2-1-4）まで。2-1 の砂嵐とボス「旋盤のぬし」は段階39
      talk('a21_enter', '2-1：路地に入る'),
      { id: 'a21_explore', kind: 'explore', area: 'a21', title: '2-1「親方の背中」：町工場の探索' },
      { id: 'a21_return', kind: 'return', area: 'a21', title: '2-1：時間を返す', note: 'いさむに、親方の「いい仕事だ」を返す。\n段階39で作る。' },
      talkTodo('d5_return', '5日目：夕暮れの時計屋', '5-D。返した後の時計屋。最後に「5日目　おわり」。\n台本は段階39で入れる。'),
      day(6),
      { id: 'd6_free', kind: 'daily', title: '6日目：昼' },
      talkTodo('d6_library', '6日目：夕暮れ・調査ノート', '6-B。蔵書の棚で、りくの調査ノートの破れたページを見つける。「最後の文化祭」。\n台本は段階39で入れる。'),
      { id: 'a22_explore', kind: 'explore', area: 'a22', title: '2-2「最後の文化祭」：高校の探索', note: '平成18年の秋の高校。体育館の「アンプのぬし」。\n段階39で作る。' },
      { id: 'a22_return', kind: 'return', area: 'a22', title: '2-2：時間を返す', note: 'けんたに、最後の文化祭のステージを返す。\n段階39で作る。' },
      talkTodo('d6_return', '6日目：返した後', '6-C。最後に「6日目　おわり」。\n台本は段階39で入れる。'),
      day(7),
      { id: 'd7_free', kind: 'daily', title: '7日目：昼' },
      talkTodo('d7_library', '7日目：夕暮れ・蔵書の棚', '7-B。「最後の打席」の砂時計。\n台本は段階40で入れる。'),
      { id: 'a23_explore', kind: 'explore', area: 'a23', title: '2-3「最後の打席」：河川敷の探索', note: '平成10年の夏の河川敷のグラウンド。ホームベースの「スコアボードのぬし」。\n段階40で作る。' },
      { id: 'a23_return', kind: 'return', title: '2-3：返す直前にカイ（負け戦）', note: '返す直前にカイが現れる。負けても話は進み、「最後の打席」は持ち去られる。\n段階40で作る。' },
      talkTodo('d7_taken', '7日目：持ち去られる', '7-C。カイとノア（ハルトたちのいない場面）、空いた棚。最後に「7日目　おわり」。\n台本は段階40で入れる。'),
      day(8),
      talkTodo('d8_classroom', '8日目：朝の教室', '8-A。時計の秒針が、また三秒止まる。\n台本は段階40で入れる。'),
      { id: 'd8_free', kind: 'daily', title: '8日目：昼' },
      talkTodo('d8_evening', '8日目：夕暮れ・2章の終わり', '8-C。棚は空いたまま。遠くに白い人影、奥から祭囃子。最後に「第2章　おわり」。\n台本は段階40で入れる。'),
      // 2章の終わり（段階34）。M1 の「つづく」（to_be_continued）から替えた。版7のセーブで M1 の「つづく」にいたものは、3日目から続く
      { id: 'ch2_end', kind: 'end', title: 'つづく' },
    ],
  },
];
