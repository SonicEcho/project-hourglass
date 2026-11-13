import type { ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import type { ChainAreaSetup } from './chainArea11';
import { A3S_COMBOS, A3S_DECK } from './chainArea3s';
import { CHAIN17_CARDS as C, CHAIN17_COMBOS } from './chainTrial17';

// 段階189（段取りの段階F10a）：4-2「早瀬の時間」の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 16-2）。
// 4章の性質の残り1つ（巻き戻し）が初めて出て、4-1 の予定隠し・速いと組み合わせる。早瀬が5人目の仲間に（専用の札「修理の火」、ハルトとのコンボ「時計屋の二人」）。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、性質・予定の癖と型だけをここで書く。
// 敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/** 4-2 の敵のスナップ：巻き戻しは性質から。予定隠し・速いはもう札になっているので技から、性質のない紙風船も技から */
export const A42_ENEMY_SNAP = {
  // ハイパーヨーヨーノイズ（巻き戻し）：戻ってきて、もう一度
  loop: { id: 'a42_loop', name: 'ループ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12, hits: 3 }, text: '敵1体に物理12を3回（戻ってきて、もう一度）' },
  // ポケベルノイズ（技「呼び出し」）：呼び出して、よそを向かせる
  page: { id: 'a42_page', name: '呼び出し', type: 'support', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'confuse', rounds: 1, element: 'thunder', power: 10 }, text: '敵1体に雷10。1ラウンドの間、その敵の単体攻撃がほかの敵へ向く（混乱）' },
  // 鳩時計ノイズ（技「ぽっぽう」）：時報ちょうどに
  chime: { id: 'a42_chime', name: '時報', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 20, beatMult: 2 }, text: '敵1体に雷20。拍の時刻（2・4・6・8）でちょうど終わると2倍' },
  // 紙風船ノイズ（技「ふわり」）：ふわりと、ひと息
  drift: { id: 'a42_drift', name: 'ふわり', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 12, mp: 2 }, text: '味方全体を少し回復し、MP を2戻す' },
} satisfies Record<string, ChainMove>;

export const A42_ENEMY_SNAPS: Record<string, string> = {
  yoyoNoise: A42_ENEMY_SNAP.loop.id,
  pagerNoise: A42_ENEMY_SNAP.page.id,
  cuckooNoise: A42_ENEMY_SNAP.chime.id,
  paperballoonNoise: A42_ENEMY_SNAP.drift.id,
};

export const A42_CARD_ART: Record<string, string> = {
  a42_loop: 'snap.quickStep',
  a42_page: 'snap.thunderChip',
  a42_chime: 'snap.thunderChip',
  a42_drift: 'snap.recover',
};
export const A42_SHORT_TEXT: Record<string, string> = {
  a42_loop: '物理12×3回',
  a42_page: '雷10\n混乱1ラウンド',
  a42_chime: '雷20\n拍で2倍',
  a42_drift: '全体を回復\nMP+2',
};

/** 4-2 で渡す札（早瀬の専用の札。アルバムに入れられる札の一覧に足す。専用の札は除かれる） */
export const A42_NEW_SNAPS: ChainMove[] = [C.repairFire];

/** 4-2 のコンボ：祭りの夜までに足して、ハルトと早瀬の「時計屋の二人」 */
export const A42_COMBOS: ChainLinkDef[] = [...A3S_COMBOS, ...CHAIN17_COMBOS.filter((l) => l.id === 'clockShop')];

/** 山札（アルバムがない時と測る時）：祭りの夜の山札に、早瀬の専用の札（並びにいなければ外れる） */
export const A42_DECK: string[] = [...A3S_DECK, C.repairFire.id, C.repairFire.id];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic はその敵の魔法の属性 */
const OPENING: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; hp?: number }> = {
  // 巻き戻し（新）：投げても戻ってくる
  yoyoNoise: { trait: 'rewind', pattern: [{ action: 'loop', at: 5 }, { action: 'colorScatter', at: 7, all: true }], magic: 'ice' },
  // 予定隠し：数字だけの呼び出し
  pagerNoise: { trait: 'veil', pattern: [{ action: 'gameOver', at: 5 }, { action: 'pixelShot', at: 6, all: true }], magic: 'thunder' },
  // 速い：時報は時刻ちょうど
  cuckooNoise: { trait: 'fast', pattern: [{ action: 'pendulum', at: 1 }, { action: 'cuckoo', at: 2, all: true }], magic: 'thunder' },
  // 性質なし
  paperballoonNoise: { pattern: [{ action: 'bounce', at: 4 }, { action: 'drift', at: 6, all: true }], magic: 'ice' },
  // 2晩目の番人：性質なし
  wreathNoise: { pattern: [{ action: 'petalStorm', at: 5, all: true }, { action: 'wreathStand', at: 3 }], magic: 'fire' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = OPENING[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  const clamp = (n: number) => (f?.trait === 'fast' ? n : Math.max(1, Math.min(9, n + shift)));
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: clamp(p.at), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 4-2 の敵の HP の倍率（今の区画の戦闘の HP にかける）。4-2 に入る時点の控えめな育ち具合（ハルト・早瀬・あかり）で自動対戦して測った（段階189）：
 * 1晩目は 1.2 で 1.8〜2.6 ラウンド、2晩目からは 0.8 で 1.4〜2.3・1.2 で 2.2〜3.4 ラウンド（どれも20戦中20勝。番人は 2.5〜4.0）
 */
export const A42_CHAIN_HP_RATE = { night1: 1.3, later: 1 };

export function a42ChainEnemy(e: EnemyDef, rate: number = A42_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = OPENING[e.id];
  return {
    id: e.id,
    name: e.name,
    hp: Math.round(e.stats.hp * rate * (f?.hp ?? 1)),
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: e.stats.def,
    weak: [...e.weaknesses],
    resist: e.resistances.filter((r): r is ChainEnemyDef['weak'][number] => r !== 'magic'),
    pattern: patternOf(e, 0),
    ...(f?.trait ? { trait: f.trait } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 4-2 の雑魚の戦闘（シャッターのぬしは段階F10b） */
const A42_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a42_n') || id === 'a42_runner') && !AREA_BATTLES[id].boss);

/** 4-2 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A42_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A42_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a42_n1_') ? A42_CHAIN_HP_RATE.night1 : A42_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a42ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A42_DECK, cards: {}, links: A42_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);
