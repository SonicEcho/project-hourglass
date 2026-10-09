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

// ---- 物語の流れ（段階23）：M1 のスライス（プロローグ → 1日目 → 1-1 → 時間を返す → 2日目 → つづく） ----
// 会話の出来事の id は、台本（scriptM1.ts）の場面の id と同じにする。セーブは出来事の id で覚えるので、名前を変えても id は変えない。
// 昼の日常は日常の画面（段階24）、探索は探索の画面（段階25）。まだ作っていない遊び（時間を返す）は、仮の画面で案内して「次へ」で通す（段階28で本物に置き換える）

const talk = (id: string, title: string): FlowEvent => ({ id, kind: 'dialogue', title });

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
      {
        id: 'a11_return',
        kind: 'return',
        title: '1-1：時間を返す',
        note: 'ここで時間を返す（段階28で作る）。そろったコマで、盗まれた夏の夜を持ち主へ返す。今は「次へ」で、返す場面の会話に進む',
      },
      talk('d1_return', '1日目：時間を返す'),
      { id: 'day2', kind: 'day', title: '2日目', day: 2 },
      talk('d2_classroom', '2日目：朝の教室'),
      // 2日目の昼（段階24。商店街のコンビニの場面は daily.ts の DAILY_HUBS）
      { id: 'd2_free', kind: 'daily', title: '2日目：昼' },
      talk('d2_noa', '2日目：すれ違い'),
      { id: 'to_be_continued', kind: 'end', title: 'つづく' },
    ],
  },
];
