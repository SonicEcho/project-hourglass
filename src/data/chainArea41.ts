import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import type { ChainAreaSetup } from './chainArea11';
import { A3S_COMBOS, A3S_DECK } from './chainArea3s';
import { CHAIN17_CARDS as C } from './chainTrial17';

// 段階187（段取りの段階F9a）：4-1「シロのいた夏」の雑魚の戦闘を、段階188（F9b）で川のぬしを、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 16-1）。
// 4章の新しい性質のうち3つ（予定隠し・回復役・速い）が初めて出る。敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、
// 性質・予定の癖と型だけをここで書く。敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/** 4-1 の敵のスナップ：性質をこちら向けにした札（性質のない花火の燃えかすは技から） */
export const A41_ENEMY_SNAP = {
  // 虫かごノイズ（予定隠し）：ふたを開けて、中を見る
  peek: { id: 'a41_peek', name: 'のぞき見', type: 'support', weight: 1, target: 'enemies', effect: { kind: 'trick', trick: 'expose' }, text: '敵全体に「ハイライト」（次に当たった攻撃が、弱点を突いた扱いになる）' },
  // すいかノイズ（回復役）：分け合う
  share: { id: 'a41_share', name: '分け合い', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, healAll: 20 }, text: '敵1体に物理20。味方全体を少し回復' },
  // 水鉄砲ノイズ（速い）：すぐ効く軽い一撃
  squirt: { id: 'a41_squirt', name: 'ぴゅっ', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 22 }, text: '敵1体に氷22（重さ1。すぐ効く）' },
  // 花火の燃えかすノイズ（技「火の粉」）：全体に2回
  sparks: { id: 'a41_sparks', name: '火の粉', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 12, hits: 2 }, text: '敵全体に火12を2回' },
} satisfies Record<string, ChainMove>;

export const A41_ENEMY_SNAPS: Record<string, string> = {
  bugcageNoise: A41_ENEMY_SNAP.peek.id,
  watermelonNoise: A41_ENEMY_SNAP.share.id,
  watergunNoise: A41_ENEMY_SNAP.squirt.id,
  fireworkNoise: A41_ENEMY_SNAP.sparks.id,
};

export const A41_CARD_ART: Record<string, string> = {
  a41_peek: 'snap.search',
  a41_share: 'snap.recover',
  a41_squirt: 'snap.iceChip',
  a41_sparks: 'snap.fireChip',
  a41_splash: 'snap.iceChip',
  a41_eternalSummer: 'snap.encore',
};
export const A41_SHORT_TEXT: Record<string, string> = {
  a41_peek: '敵全体に\nハイライト',
  a41_share: '物理20\n味方を回復',
  a41_squirt: '氷22\n重さ1',
  a41_sparks: '全体に\n火12×2回',
  a41_splash: '仲間全員の\n暑さ−1',
  a41_eternalSummer: '添える\nずっと重さ−1',
};

// ---- 段階188（段階F9b）：川のぬし。思い出の再演「夏の照り返し」 ----

/** みんなが使える技「水をかける」（ぬし戦だけ、全員に足す） */
export const A41_SPLASH: ChainMove = { id: 'a41_splash', name: '水をかける', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 0, cool: 1 }, text: 'たいちがシロの背中にかけたように。仲間全員の暑さを1下げる' };
/** ★3 の報酬「永遠の夏」（一覧の 8. で、このぬしの ★3 と決めた札） */
export const A41_ETERNAL: ChainMove = { id: 'a41_eternalSummer', name: '永遠の夏', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', lighten: true }, text: '添えた行動から、この戦闘の終わりまで、味方全員の行動の重さ −1（1より下がらない）' };

/** 4-1 で渡す札（宝箱の赤フィルター。ほかの2つは3章の札をもう1枚ずつ。段階188 のぬしの報酬の永遠の夏） */
export const A41_NEW_SNAPS: ChainMove[] = [C.filterRed, A41_ETERNAL];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic はその敵の魔法の属性 */
const SUMMER: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; hp?: number; healRate?: number }> = {
  // 予定隠し：ふたの中が見えない
  bugcageNoise: { trait: 'veil', pattern: [{ action: 'lidSnap', at: 5 }, { action: 'buzz', at: 7, all: true }], magic: 'physical' },
  // 回復役：ほかの敵を回復する
  watermelonNoise: { trait: 'healer', healRate: 0.15, pattern: [{ action: 'roll', at: 5 }, { action: 'seedShot', at: 7, all: true }], magic: 'physical' },
  // 速い：予定がいつも時刻1〜2
  watergunNoise: { trait: 'fast', pattern: [{ action: 'squirt', at: 1 }, { action: 'pump', at: 2, all: true }], magic: 'ice' },
  // 性質なし
  fireworkNoise: { pattern: [{ action: 'smoke', at: 4 }, { action: 'sparks', at: 6, all: true }], magic: 'fire' },
  // 2晩目の番人：性質なし
  jizoNoise: { pattern: [{ action: 'windmills', at: 5, all: true }, { action: 'bibSlap', at: 3 }], magic: 'thunder' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = SUMMER[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  // 速い敵は、型が変わっても時刻1〜2のまま
  const clamp = (n: number) => (f?.trait === 'fast' ? n : Math.max(1, Math.min(9, n + shift)));
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: clamp(p.at), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 4-1 の敵の HP の倍率（今の区画の戦闘の HP にかける）。4-1 に入る時点の控えめな育ち具合（ハルト・あかり・みお）で自動対戦して測った（段階187）：
 * 1.2 で1晩目 1.7〜2.8 ラウンド、0.8 で2晩目から 1.4〜2.4 ラウンド・1.2 で 2.0〜3.5（どれも20戦中20勝。番人は 3.4〜5.0）
 */
export const A41_CHAIN_HP_RATE = { night1: 1.2, later: 1 };

export function a41ChainEnemy(e: EnemyDef, rate: number = A41_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = SUMMER[e.id];
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
    ...(f?.healRate ? { healRate: f.healRate } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/**
 * ぬしと部位の HP・攻撃の倍率と、暑さの上限。自動対戦（考える方針・4-1 に入る時点の控えめな育ち具合・ハルト・あかり・みお・宝箱の札入り・20戦）で測った（段階188）：
 * 16勝・決着 53〜143マス（中ほど 67）・暑さは平均 1.4。HP と攻撃を両方上げると急に勝てなくなる（×1.3 ずつで7勝）ので、HP を下げて攻撃を上げた。
 * 考える方針は「水をかける」をほとんど使わず、氷の攻撃で冷やしていた。つば（照り返しを使う部位）は、暑さから抜け出す道なので固めにする
 */
export const A41_LORD = { body: 0.64, brim: 0.8, current: 0.3, atk: 1.17, heatMax: 3 };

function a41Lord(): ChainEnemyDef[] {
  const lord = AREA_BATTLES.a41_boss.enemies[0];
  const act = (id: string) => lord.actions.find((a) => a.id === id)!;
  const partId = (id: string) => `${lord.id}_${id}`;
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'physical' : a.type, power: a.power, ...(a.requiresPart ? { requiresPart: partId(a.requiresPart) } : {}), ...extra };
  };
  // 照り返し（つば）：当たった仲間の暑さ+1。水しぶき：痛いが、暑さ−1
  const glare = (at: number) => move('glare', at, { heats: 1 });
  const splash = (at: number) => move('riverSplash', at, { cools: 1 });
  const body: ChainEnemyDef = {
    id: lord.id,
    name: lord.name,
    hp: Math.round(lord.stats.hp * A41_LORD.body),
    atk: Math.round(Math.max(lord.stats.atk, lord.stats.mag) * A41_LORD.atk),
    def: lord.stats.def,
    weak: [],
    resist: [],
    // 予定の癖：照り返しで暑くし、水しぶき・鉄砲水（流れ）・夏の大水（全体の大技）を順に。つばが壊れると照り返しのラウンドは次の行動に
    pattern: [{ ...glare(3), with: [splash(7)] }, { ...splash(4), with: [move('flashFlood', 7)] }, { ...glare(2), with: [glare(6)] }, move('summerFlood', 8)],
  };
  const parts = (['brim', 'current'] as const).map((id): ChainEnemyDef => {
    const p = lord.parts!.find((x) => x.id === id)!;
    return {
      id: partId(id),
      name: p.name,
      hp: Math.round(p.hp * (id === 'brim' ? A41_LORD.brim : A41_LORD.current)),
      atk: 0,
      def: lord.stats.def,
      weak: [],
      resist: [],
      pattern: [],
      part: { of: lord.id, ...(p.revealsWeakness ? { reveals: [...p.revealsWeakness] } : {}) },
      ...(p.drop ? { drop: p.drop } : {}),
    };
  });
  return [parts[0], body, parts[1]];
}

/** 4-1 の雑魚の戦闘 */
const A41_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a41_n') || id === 'a41_runner') && !AREA_BATTLES[id].boss);

/** 4-1 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A41_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  // ぬしの報酬（★3）：永遠の夏
  ['a41_boss', { enemies: a41Lord(), variants: [], deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 35, mid: 50 }, heat: { max: A41_LORD.heatMax }, allyMoves: [A41_SPLASH], snaps: [A41_ETERNAL.id] }],
  ...A41_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a41_n1_') ? A41_CHAIN_HP_RATE.night1 : A41_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a41ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
