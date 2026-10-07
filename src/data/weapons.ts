import type { FragmentDef, ItemDef, WeaponData, WeaponDef } from '../core/weapon';

// 武器ビルドアップ（段階9）。数値・名前はすべて仮

/**
 * 記憶の欠片（段階10）。記憶に宿る感情ごとの種類。盗まれるのは楽しい時間だけなので、前向きな感情だけ。
 * 1つで、その感情に対応するパラメータが1上がる
 */
export const FRAGMENTS = {
  courage: { id: 'courage', name: '勇気', gains: { atk: 1 } },
  elation: { id: 'elation', name: '高揚', gains: { fire: 1 } },
  relief: { id: 'relief', name: '安堵', gains: { ice: 1 } },
  wonder: { id: 'wonder', name: '驚嘆', gains: { thunder: 1 } },
} satisfies Record<string, FragmentDef>;

/**
 * 素材（敵が落とす）と通常アイテム（勝利の報酬）。この試作では、通常アイテムは戦闘で使えない。
 * 時分解した時の記憶の欠片の合計は、段階9（調整1回目）の断片と同じ上がり幅にしてある
 */
export const ITEMS = {
  slimeJelly: { id: 'slimeJelly', name: 'スライムゼリー', kind: 'material', fragments: { elation: 3, courage: 1 } },
  frostFeather: { id: 'frostFeather', name: '霜の羽', kind: 'material', fragments: { wonder: 3, relief: 1 } },
  hardFur: { id: 'hardFur', name: '硬い毛皮', kind: 'material', fragments: { relief: 3, courage: 2 } },
  steelClaw: { id: 'steelClaw', name: '鋼の爪', kind: 'material', fragments: { courage: 3 } },
  potion: { id: 'potion', name: 'ポーション', kind: 'item', fragments: { courage: 2 } },
  ether: { id: 'ether', name: 'エーテル', kind: 'item', fragments: { elation: 2, relief: 2, wonder: 2 } },
  hiPotion: { id: 'hiPotion', name: 'ハイポーション', kind: 'item', fragments: { courage: 4 } },
} satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

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
  items: ITEMS,
  // 経験値 4 で Lv2、8 で Lv3（1人が戦闘1回で行動するのは3回前後なので、だいたい戦闘3つで Lv3）
  levelExp: [4, 8],
  evolveLevel: 3,
  elementRate: 0.02,
  boardExtension: 2,
};
