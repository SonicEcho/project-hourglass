import type { ChainMove } from '../core';

// 砂の底だけのレアスナップ（段階219。S8b。docs/milestones/M3_sand_bottom.md）。珍品として深い所に埋まっている。
// 今の新しい戦闘の仕組み（ChainEffect）の組み合わせで作る。名前は、その章の層の記憶の種類にちなむ。数値は仮

export const DIG_SNAP = {
  /** 感覚記憶の層：一瞬だけ残る像。当てた後、同じ所へ弱い一撃が追いかける */
  zanzo: {
    id: 'dig_zanzo',
    name: '残像',
    type: 'attack',
    weight: 2,
    target: 'enemy',
    effect: { kind: 'damage', element: 'physical', power: 28, extra: [{ element: 'physical', power: 16 }] },
    text: '敵1体に物理28。続けて、残像が物理16で追いかける',
  },
  /** 短期記憶の層：すぐ消える泡。当てた敵の予定を大きく後ろへ */
  utakata: {
    id: 'dig_utakata',
    name: 'うたかた',
    type: 'attack',
    weight: 1,
    target: 'enemy',
    effect: { kind: 'damage', element: 'ice', power: 12, push: 2 },
    text: '敵1体に氷12。当たった敵の予定を2マス後ろへ（行動を遅らせる）',
  },
  /** エピソード記憶の層：思い出が重なるほど強い。このラウンドにもう動いた仲間が多いほど威力が上がる */
  kaiso: {
    id: 'dig_kaiso',
    name: '回想',
    type: 'attack',
    weight: 2,
    target: 'enemy',
    effect: { kind: 'damage', element: 'fire', power: 20, perActed: 12 },
    text: '敵1体に火20。このラウンドにもう動いた仲間1人ごとに+12',
  },
} satisfies Record<string, ChainMove>;

export const DIG_SNAPS: ChainMove[] = Object.values(DIG_SNAP);

/** 札の絵（段階219：絵を頼んでいる。届くまでは、近い雰囲気の今ある絵を仮に使う） */
export const DIG_CARD_ART: Record<string, string> = {
  // 2026-11-17：専用の写真が届いた（docs/ART_QUEUE.md の V）
  dig_zanzo: 'snap.digZanzo',
  dig_utakata: 'snap.digUtakata',
  dig_kaiso: 'snap.digKaiso',
};

export const DIG_SHORT_TEXT: Record<string, string> = {
  dig_zanzo: '物理28\n残像が物理16',
  dig_utakata: '氷12\n予定を2マス後へ',
  dig_kaiso: '火20\n動いた仲間ごとに+12',
};
