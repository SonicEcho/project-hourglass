import type { DailyHub } from '../core/daily';

// 昼の日常（段階24）。物語の流れ（story.ts の SLICE_FLOW）の daily の出来事ごとに、場所と印を書く。
// 印の id は、会話の場面がある時は場面の id と同じにする（見たかどうかを、この id でセーブに覚える）。
// 位置は 390×844 の座標（場所の絵の上の印、地図の上の場所）

export const DAILY_HUBS: Record<string, DailyHub> = {
  // プロローグの屋台めぐり（docs/script/M1.md の P-3）。4つ全部回ると、石段の上へ
  prologue_stalls: {
    id: 'prologue_stalls',
    time: 'あの夏　夕方の参道',
    plan: 'けいかくひょう',
    finishWhenRequiredSeen: true,
    places: [
      {
        id: 'sando',
        name: '参道（屋台の並び）',
        backdrop: 'shrine_stalls',
        mapX: 195,
        mapY: 300,
        spots: [
          { id: 'prologue_apple', scene: 'prologue_apple', label: 'りんご飴', mark: 'stall', x: 92, y: 250, required: true },
          { id: 'prologue_shooting', scene: 'prologue_shooting', label: '射的', mark: 'stall', x: 300, y: 300, required: true },
          { id: 'prologue_mask', scene: 'prologue_mask', label: 'お面', mark: 'stall', x: 84, y: 420, required: true },
          { id: 'prologue_goldfish', scene: 'prologue_goldfish', label: '金魚すくい', mark: 'stall', x: 304, y: 470, required: true },
        ],
      },
    ],
  },
  // 1日目の自由な時間（1-D）。屋上（絆の出来事・あかり）と施設（小話）はどちらも見なくてよい。時計屋へ行くと夕暮れになる
  d1_free: {
    id: 'd1_free',
    time: '1日目　放課後',
    places: [
      {
        id: 'school',
        name: '学校',
        backdrop: 'classroom',
        mapX: 112,
        mapY: 250,
        spots: [{ id: 'd1_rooftop', scene: 'd1_rooftop', label: '屋上へ（あかり）', mark: 'bond', x: 195, y: 330 }],
      },
      {
        id: 'home',
        name: '施設',
        backdrop: 'home_kitchen',
        mapX: 282,
        mapY: 330,
        spots: [{ id: 'd1_home', scene: 'd1_home', label: '台所（小話）', mark: 'talk', x: 195, y: 360 }],
      },
      {
        id: 'clockshop',
        name: '時計屋',
        backdrop: 'clock_shop',
        mapX: 250,
        mapY: 560,
        spots: [
          {
            id: 'd1_to_dusk',
            label: 'アルバイトへ（夕暮れになる）',
            mark: 'go',
            x: 195,
            y: 400,
            ends: true,
            confirm: '時計屋のアルバイトへ行くと、夕暮れになります。\n行きますか？',
          },
        ],
      },
    ],
  },
  // 2日目の昼（2-B）。商店街のコンビニは必ず見る。見たら、時計屋へ行ける
  d2_free: {
    id: 'd2_free',
    time: '2日目　放課後',
    places: [
      {
        id: 'street',
        name: '商店街',
        backdrop: 'shopping_street',
        mapX: 120,
        mapY: 430,
        spots: [{ id: 'd2_store', scene: 'd2_store', label: 'コンビニの前', mark: 'main', x: 195, y: 360, required: true }],
      },
      {
        id: 'clockshop',
        name: '時計屋',
        backdrop: 'clock_shop',
        mapX: 250,
        mapY: 560,
        spots: [
          {
            id: 'd2_to_dusk',
            label: '時計屋の奥へ（夕暮れになる）',
            mark: 'go',
            x: 195,
            y: 400,
            ends: true,
            confirm: '時計屋へ行くと、夕暮れになります。\n行きますか？',
          },
        ],
      },
    ],
  },
};
