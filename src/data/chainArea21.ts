import type { ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { A11_COMBOS, A11_DECK, type ChainAreaSetup } from './chainArea11';
import { CHAIN17_CARDS as C, CHAIN17_COMBOS } from './chainTrial17';

// 段階170（段取りの段階F2a）：2-1「親方の背中」の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 13.）。
// 2章の新しい性質（かたい・バリア）が初めて出る。分裂（1章）も組み合わせを変えて出す。仲間にみおが加わり3人。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、性質・予定の癖と型だけをここで書く。
// 敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/** 2-1 の敵のスナップ（★3 で早く勝つと、ときどき）：その敵の性質を、こちら向けにした札（性質のない真空管ノイズは技から） */
export const A21_ENEMY_SNAP = {
  gearArmor: { id: 'a21_gearArmor', name: '歯車の鎧', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', armor: 0.4 }, text: '添えた行動の後、ラウンドの終わりまで、この仲間が受けるダメージを4割減らす' },
  beadWall: { id: 'a21_beadWall', name: '珠の壁', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', wall: 2 }, text: '添えた行動の後、ラウンドの終わりまで、この仲間が受ける攻撃を2回まで消す' },
  scatter: { id: 'a21_scatter', name: 'ばらまき', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, extra: [{ element: 'physical', power: 15, hits: 2 }] }, text: '敵1体に物理30、さらに物理15を2回（ネジとナットに分かれて当たる）' },
  // 段階171：旋盤のぬし（思い出の再演「歯をそろえる」の決まりを、こちら向けに）
  finishGear: { id: 'a21_finishGear', name: '歯車の仕上げ', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12, hitsByRoundHits: true }, text: '敵1体に物理12を、このラウンドに味方が当てた回数と同じ回数（12回まで。クライマックス）' },
  discharge: { id: 'a21_discharge', name: '放電', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'thunder', power: 15, downMult: 2 }, text: '敵全体に雷15。ダウンしている敵には2倍' },
} satisfies Record<string, ChainMove>;

export const A21_ENEMY_SNAPS: Record<string, string> = {
  gearNoise: A21_ENEMY_SNAP.gearArmor.id,
  abacusNoise: A21_ENEMY_SNAP.beadWall.id,
  screwNoise: A21_ENEMY_SNAP.scatter.id,
  tubeNoise: A21_ENEMY_SNAP.discharge.id,
  latheLord: A21_ENEMY_SNAP.finishGear.id,
};

export const A21_CARD_ART: Record<string, string> = {
  a21_gearArmor: 'snap.pinchHitter',
  a21_beadWall: 'snap.encore',
  a21_scatter: 'snap.quickStep',
  a21_discharge: 'snap.thunderChip',
  a21_finishGear: 'snap.joker',
};
export const A21_SHORT_TEXT: Record<string, string> = {
  a21_gearArmor: '添える\n受けるダメ−4割',
  a21_beadWall: '添える\n攻撃を2回消す',
  a21_scatter: '物理30\n＋15×2',
  a21_discharge: '全体に雷15\nダウンに2倍',
  a21_finishGear: '物理12を\n当てた回数だけ',
};

/** 2-1 で増えるコンボ（1-1 の3つに足す）：クロスドライブ（ハルトとみお）・ビリビリ（みお）・雷の雨 */
export const A21_COMBOS: ChainLinkDef[] = [...A11_COMBOS, ...CHAIN17_COMBOS.filter((l) => ['crossDrive', 'biribiri', 'thunderRain'].includes(l.id))];

/** 2-1 の宝箱と、ぬしの報酬で渡す札（2-1 の答えになる札）。アルバムに入れられる札の一覧に足す */
export const A21_NEW_SNAPS: ChainMove[] = [C.bigShot, C.burst, C.split, C.plus20];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic は、その敵の魔法の属性 */
const FACTORY: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; hp?: number; shellHits?: number }> = {
  // かたい：1発ごとにダメージを減らす（重い一撃・1発の大きな攻撃・弱点の雷）
  gearNoise: { trait: 'hard', pattern: [{ action: 'gearRush', at: 5 }, { action: 'gearGrind', at: 3 }], magic: 'physical' },
  // バリア：最初の2発を消す（連続攻撃・複数攻撃化で割る・重い一撃）
  abacusNoise: { trait: 'shell', shellHits: 2, pattern: [{ action: 'beadShot', at: 4 }, { action: 'beadStorm', at: 7, all: true }], magic: 'physical' },
  // 分裂（1章）：倒すとネジとナットに分かれる
  screwNoise: { trait: 'split', pattern: [{ action: 'screwShot', at: 2 }, { action: 'boltRain', at: 6, all: true }], magic: 'physical' },
  // 性質なし：全体に雷を撃つ係
  tubeNoise: { pattern: [{ action: 'discharge', at: 6, all: true }, { action: 'tubeGlow', at: 4 }], magic: 'thunder' },
};

/** 分裂した小さなネジ（id は「本体_mini」。絵は本体の絵を小さく使う） */
function miniScrew(e: EnemyDef, rate: number): ChainEnemyDef {
  return {
    id: `${e.id}_mini`,
    name: 'ナット',
    hp: Math.round(e.stats.hp * rate * 0.3),
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: Math.round(e.stats.def * 0.7),
    weak: [...e.weaknesses],
    resist: [],
    pattern: [{ id: 'nutHit', name: 'ナットの体当たり', at: 5, element: 'physical', power: 18 }],
  };
}

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = FACTORY[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: Math.max(1, Math.min(9, p.at + shift)), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 2-1 の敵の HP の倍率（今の区画の戦闘の HP にかける）。2章の敵は攻撃も守りも強い（1章を通した育ち具合が前提）ので、
 * 自動対戦は 2-1 に入る時点の控えめな育ち具合（src/sim/presets.ts の growthPreset('a21_enter', 'low')）のハルト・あかり・みおで測った（考える方針・30戦ずつ）。
 * ほとんどの戦闘が 1.5〜2.5 ラウンド、2晩目の山場と3晩目の強い組み合わせが 2.5〜3.1 ラウンド（全部 30戦中30勝）（段階170）
 */
export const A21_CHAIN_HP_RATE = { night1: 0.3, later: 0.24 };

export function a21ChainEnemy(e: EnemyDef, rate: number = A21_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = FACTORY[e.id];
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
    ...(f?.shellHits ? { shellHits: f.shellHits } : {}),
    ...(f?.trait === 'split' ? { splitInto: miniScrew(e, rate) } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 2-1 の雑魚の戦闘（ぬしは段階F2b） */
const A21_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a21_n') || id === 'a21_runner' || id === 'a21_alley') && !AREA_BATTLES[id].boss);

/** 1晩目の HP の戦闘（寄り道の銭湯の裏の路地も1晩目） */
const NIGHT1 = (id: string) => id.startsWith('a21_n1_') || id === 'a21_alley';

// ---- 段階171（段階F2b）：ぬし「旋盤のぬし」。思い出の再演「歯をそろえる」 ----

/**
 * ぬしと部位の HP の倍率と、ぬしの攻撃の倍率（今の区画の戦闘の値にかける）と、歯をそろえる回数（1ラウンドに、ぬしに当てる回数）。
 * 自動対戦（考える方針・2-1 に入る時点の控えめ／ふつうの育ち具合・宝箱の連写と複数攻撃化を入れた山札・40戦）で、
 * 36〜38勝・中ほど4〜5ラウンド。8回は、狙わなければ約3%のラウンドでしか届かず、連写＋紙鉄砲・複数攻撃化を組めば届く回数（段階171）
 */
export const A21_LORD = { body: 0.55, part: 0.3, atk: 0.64, teeth: 8 };

function a21Lord(): ChainEnemyDef[] {
  const lord = AREA_BATTLES.a21_boss.enemies[0];
  const act = (id: string) => lord.actions.find((a) => a.id === id)!;
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'physical' : a.type, power: a.power, ...extra };
  };
  const partId = (id: string) => `${lord.id}_${id}`;
  const body: ChainEnemyDef = {
    id: lord.id,
    name: lord.name,
    hp: Math.round(lord.stats.hp * A21_LORD.body),
    atk: Math.round(Math.max(lord.stats.atk, lord.stats.mag) * A21_LORD.atk),
    def: lord.stats.def,
    weak: [],
    resist: [],
    // かたい：1発ごとのダメージは減るが、歯をそろえる回数は数える
    trait: 'hard',
    // 予定の癖：削りくず飛ばし（2回）→ 削り出し（刃物台）→ 削りくずの嵐（全体）→ 空回り（全体・ベルト）。大技は遅めにして、歯をそろえて止める間を作る
    pattern: [move('shavings', 3, { at2: 7 }), move('carveOut', 6, { requiresPart: partId('toolPost') }), move('shavingStorm', 8), move('spinOut', 7, { requiresPart: partId('belt') })],
  };
  const parts = (['toolPost', 'belt'] as const).map((id): ChainEnemyDef => {
    const p = lord.parts!.find((x) => x.id === id)!;
    return {
      id: partId(id),
      name: p.name,
      hp: Math.round(p.hp * A21_LORD.part),
      atk: 0,
      def: lord.stats.def,
      weak: [],
      resist: [],
      pattern: [],
      part: { of: lord.id, ...(p.revealsWeakness ? { reveals: [...p.revealsWeakness] } : {}) },
      ...(p.drop ? { drop: p.drop } : {}),
    };
  });
  return [parts[1], body, parts[0]];
}

/** 2-1 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A21_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  // ぬしの報酬：渾身の一枚と、アタック+20（2章の札）
  ['a21_boss', { enemies: a21Lord(), variants: [], deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 35, mid: 50 }, teeth: { target: 'latheLord', need: A21_LORD.teeth }, snaps: [C.bigShot.id] }],
  ...A21_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = NIGHT1(id) ? A21_CHAIN_HP_RATE.night1 : A21_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a21ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
