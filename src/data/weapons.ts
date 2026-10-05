import type { FragmentDef, WeaponData, WeaponDef } from '../core/weapon';

// 武器ビルドアップ（段階9）。数値・名前はすべて仮

/** 記憶の断片（素材）。倒した敵が落とす。どの断片かは、その敵の弱点の属性 */
export const FRAGMENTS = {
  red: { id: 'red', name: '赤の断片', gains: { fire: 3, atk: 1 } },
  yellow: { id: 'yellow', name: '黄の断片', gains: { thunder: 3, atk: 1 } },
  blue: { id: 'blue', name: '青の断片', gains: { ice: 3, atk: 1 } },
  steel: { id: 'steel', name: '鋼の断片', gains: { atk: 3 } },
} satisfies Record<string, FragmentDef>;

export type FragmentId = keyof typeof FRAGMENTS;

const sword: WeaponDef = {
  id: 'recordSword',
  name: '記録の剣',
  owner: 'hero',
  evolutions: [
    { id: 'flameBlade', name: 'フレイムブレード', conditions: [{ kind: 'param', param: 'fire', min: 6 }], attackElement: 'fire', stats: { atk: 3 } },
    {
      id: 'breakEdge',
      name: 'ブレイクエッジ',
      conditions: [
        { kind: 'param', param: 'atk', min: 4 },
        { kind: 'tendency', color: 'red' },
      ],
      stats: { atk: 4 },
      passives: [{ kind: 'partBoost', rate: 0.3 }],
    },
    { id: 'frostBlade', name: 'フロストブレード', conditions: [{ kind: 'param', param: 'ice', min: 6 }], attackElement: 'ice', stats: { atk: 3 } },
  ],
};

const rod: WeaponDef = {
  id: 'prayerRod',
  name: '祈りの杖',
  owner: 'akari',
  evolutions: [
    { id: 'iceRod', name: 'アイスロッド', conditions: [{ kind: 'param', param: 'ice', min: 6 }], attackElement: 'ice', stats: { mag: 3 } },
    {
      id: 'healingRod',
      name: '癒しの杖',
      conditions: [{ kind: 'tendency', color: 'green' }],
      stats: { mp: 10 },
      passives: [{ kind: 'regen', rate: 0.05 }],
    },
    { id: 'flameRod', name: 'フレイムロッド', conditions: [{ kind: 'param', param: 'fire', min: 6 }], attackElement: 'fire', stats: { mag: 3 } },
  ],
};

const cards: WeaponDef = {
  id: 'throwCards',
  name: '投げカード',
  owner: 'mio',
  evolutions: [
    { id: 'thunderCards', name: 'サンダーカード', conditions: [{ kind: 'param', param: 'thunder', min: 6 }], attackElement: 'thunder', stats: { spd: 2 } },
    {
      id: 'trickCards',
      name: 'トリックカード',
      conditions: [{ kind: 'tendency', color: 'yellow' }],
      stats: { spd: 1 },
      passives: [{ kind: 'oneMoreDraw', count: 1 }],
    },
    { id: 'flameCards', name: 'フレイムカード', conditions: [{ kind: 'param', param: 'fire', min: 6 }], attackElement: 'fire', stats: { spd: 1 } },
  ],
};

export const WEAPON_DATA: WeaponData = {
  weapons: { [sword.id]: sword, [rod.id]: rod, [cards.id]: cards },
  fragments: FRAGMENTS,
  // 経験値 4 で Lv2、8 で Lv3（1人が戦闘1回で行動するのは3回前後なので、だいたい戦闘3つで Lv3）
  levelExp: [4, 8],
  evolveLevel: 3,
  elementRate: 0.02,
  boardExtension: 2,
};
