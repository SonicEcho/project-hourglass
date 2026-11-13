import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { A11_DECK, a11ChainEnemy, type ChainAreaSetup } from './chainArea11';
import { a12ChainEnemy } from './chainArea12';
import { a22ChainEnemy } from './chainArea22';
import { A21_COMBOS, a21ChainEnemy } from './chainArea21';
import { CHAIN17_CARDS as C } from './chainTrial17';

// 段階174（段取りの段階F4a）：2-3「最後の打席」の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 13-10）。
// 2章の性質（かたい・カウンター）と1章の性質（逃げ足）を組み合わせる。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、性質・予定の癖と型だけをここで書く。
// 敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/**
 * 2-3 の敵のスナップ：性質はどれも前の区画で札にしたので、4種類とも技から作る（段階172 の決まり）
 */
export const A23_ENEMY_SNAP = {
  iceWater: { id: 'a23_iceWater', name: '氷水かけ', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'status', status: 'stack', rounds: 2, element: 'ice', power: 10 }, text: '敵全体に氷10。2ラウンドの間「刻み」：当たるたびに受けるダメージが上がる' },
  jeer: { id: 'a23_jeer', name: 'やじ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'weak', rounds: 1, element: 'thunder', power: 20 }, text: '敵1体に雷20。このラウンドの終わりまで、その敵の攻撃が半分' },
  irregular: { id: 'a23_irregular', name: 'イレギュラー', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 25, scatter: { power: 25, hits: 1 } }, text: '敵1体に物理25。もう1発が、ほかの敵へ跳ねる' },
  // 段階175：スコアボードのぬし（思い出の再演「打ち返す」を、こちら向けに）
  justMeet: { id: 'a23_justMeet', name: 'ジャストミート', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, parry: 2 }, text: '敵1体に物理30。敵の行動（まだ動いていない物）と同じ時刻にちょうど終わると、その行動を打ち返して消し、威力2倍' },
  beep: { id: 'a23_beep', name: 'ピコピコ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'confuse', rounds: 1, element: 'thunder', power: 15 }, text: '敵1体に雷15。このラウンドの終わりまで、その敵の単体攻撃が、ほかの敵に向く' },
} satisfies Record<string, ChainMove>;

export const A23_ENEMY_SNAPS: Record<string, string> = {
  jugNoise: A23_ENEMY_SNAP.iceWater.id,
  megaphoneNoise: A23_ENEMY_SNAP.jeer.id,
  ballNoise: A23_ENEMY_SNAP.irregular.id,
  petNoise: A23_ENEMY_SNAP.beep.id,
  scoreboardLord: A23_ENEMY_SNAP.justMeet.id,
};

export const A23_CARD_ART: Record<string, string> = {
  a23_iceWater: 'snap.iceChip',
  a23_jeer: 'snap.thunderChip',
  a23_irregular: 'snap.quickStep',
  a23_beep: 'snap.thunderChip',
  a23_kitsuke: 'snap.recover',
  a23_hitoiki: 'snap.recover',
  a23_justMeet: 'snap.breakArm',
};
export const A23_SHORT_TEXT: Record<string, string> = {
  a23_iceWater: '全体に氷10\n刻み2ラウンド',
  a23_jeer: '雷20\n攻撃を半分に',
  a23_irregular: '物理25\nほかへ跳ねる',
  a23_beep: '雷15\n同士討ち',
  a23_kitsuke: '倒れた仲間を\n起こす',
  a23_hitoiki: '味方全体の\nMP +6',
  a23_justMeet: '物理30\n同じ時刻で打ち返す',
};

/** 2-3 の宝箱の札（一覧の 2.）：気付け（倒れた仲間を起こす）・一息（MP を戻す） */
const KITSUKE: ChainMove = { id: 'a23_kitsuke', name: '気付け', type: 'support', weight: 2, target: 'allies', effect: { kind: 'heal', power: 0, revive: 0.3 }, text: '倒れた仲間を、HP 3割で起こす' };
const HITOIKI: ChainMove = { id: 'a23_hitoiki', name: '一息', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 0, mp: 6 }, text: '味方全体の MP を6戻す' };

/** 2-3 の宝箱で渡す札（アルバムに入れられる札の一覧に足す） */
export const A23_NEW_SNAPS: ChainMove[] = [C.imprint, KITSUKE, HITOIKI];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic は、その敵の魔法の属性 */
const RIVERSIDE: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; hp?: number; shellHits?: number }> = {
  // かたい（2-1）：1発ごとにダメージを減らす
  jugNoise: { trait: 'hard', pattern: [{ action: 'jugSwing', at: 5 }, { action: 'iceWater', at: 7, all: true }], magic: 'ice', hp: 0.8 },
  // カウンター（2-2）：ダウンしていない時に受けると反撃
  megaphoneNoise: { trait: 'counter', pattern: [{ action: 'jeer', at: 4 }, { action: 'roar', at: 6, all: true }], magic: 'thunder' },
  // 逃げ足（1章）：2ラウンド目の時刻8に逃げる
  ballNoise: { trait: 'flee', pattern: [{ action: 'fastball', at: 2 }, { action: 'escape', at: 8 }], magic: 'physical' },
  // 性質なし
  petNoise: { pattern: [{ action: 'beep', at: 6, all: true }, { action: 'tantrum', at: 3 }], magic: 'thunder' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = RIVERSIDE[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  return list.map((p) => {
    if (p.action === 'escape') return { id: 'escape', name: '逃げる', at: Math.max(1, Math.min(9, p.at + shift)), element: 'physical', power: 0, flee: true };
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: Math.max(1, Math.min(9, p.at + shift)), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 2-3 の敵の HP の倍率（今の区画の戦闘の HP にかける）。2-3 に入る時点の控えめな育ち具合（growthPreset('a23_enter', 'low')）で自動対戦して測った。
 * 1晩目は「かたい＋カウンター」でどちらも1回で大きく当てる組なので長引きやすく、低め。ほとんどが 2.0〜2.8 ラウンド（30戦中30勝）（段階174）
 */
export const A23_CHAIN_HP_RATE = { night1: 0.45, later: 0.5 };

export function a23ChainEnemy(e: EnemyDef, rate: number = A23_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = RIVERSIDE[e.id];
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
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 2-3 の雑魚の戦闘（ぬしとカイは段階F4b） */
const A23_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a23_n') || id === 'a23_runner') && !AREA_BATTLES[id].boss);

// ---- 段階175（段階F4b）：ぬし「スコアボードのぬし」。思い出の再演「打ち返す」。とカイの負け戦 ----

/**
 * ぬしと部位の HP・攻撃の倍率と、打ち返す決まり（三振の数・打ち返した攻撃の倍率）と、投球の威力。
 * 自動対戦（考える方針・2-3 に入る時点の控えめ／ふつうの育ち具合・宝箱の札を入れた山札・40戦）で、控えめ 32勝（三振3）・ふつう 39勝、中ほど4〜5ラウンド（段階175）
 */
export const A23_LORD = { body: 0.87, part: 0.3, atk: 1, out: 3, mult: 2, pitchPower: 30 };

function a23Lord(): ChainEnemyDef[] {
  const lord = AREA_BATTLES.a23_boss.enemies[0];
  const act = (id: string) => lord.actions.find((a) => a.id === id)!;
  const pitch = (at: number): ChainEnemyMove => ({ id: 'pitch', name: '投球', at, element: 'physical', power: A23_LORD.pitchPower, pitch: true });
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'physical' : a.type, power: a.power, ...extra };
  };
  const partId = (id: string) => `${lord.id}_${id}`;
  const body: ChainEnemyDef = {
    id: lord.id,
    name: lord.name,
    hp: Math.round(lord.stats.hp * A23_LORD.body),
    atk: Math.round(Math.max(lord.stats.atk, lord.stats.mag) * A23_LORD.atk),
    def: lord.stats.def,
    weak: [],
    resist: [],
    // 予定の癖：毎ラウンド、ほかの行動と一緒に投球が1〜2球
    // 投球は奇数の時刻（重さ2の行動を並べるだけでは偶数の時刻で終わるので、重さ1・3の札や押すで合わせる）
    pattern: [
      move('cheerBlast', 6, { with: [pitch(3)] }),
      move('bigInning', 6, { requiresPart: partId('scoreboard'), with: [pitch(5), pitch(7)] }),
      move('doublePlay', 8, { requiresPart: partId('backstop'), with: [pitch(3)] }),
      move('sayonara', 8, { with: [pitch(5), pitch(9)] }),
    ],
  };
  const parts = (['scoreboard', 'backstop'] as const).map((id): ChainEnemyDef => {
    const p = lord.parts!.find((x) => x.id === id)!;
    return {
      id: partId(id),
      name: p.name,
      hp: Math.round(p.hp * A23_LORD.part),
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

/** カイの負け戦（2-3 の返す直前）：決まったラウンドで打ち切る（区画の戦闘の cutoff）。倒しきれないよう HP は多め */
export const A23_KAI = { hp: 2, atk: 0.7 };

function a23Kai(): ChainEnemyDef[] {
  const kai = AREA_BATTLES.a23_kai.enemies[0];
  const act = (id: string) => kai.actions.find((a) => a.id === id)!;
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'physical' : a.type, power: a.power, ...extra };
  };
  return [
    {
      id: kai.id,
      name: kai.name,
      hp: Math.round(kai.stats.hp * A23_KAI.hp),
      atk: Math.round(Math.max(kai.stats.atk, kai.stats.mag) * A23_KAI.atk),
      def: kai.stats.def,
      weak: [],
      resist: [],
      // 速く、手ごわい：切り取り（1人に重い一撃）→ フレームの雨（全体）→ シャッター（全体）を、1ラウンドに2回ずつ
      // 切り取り（段階176）：ねらった仲間の、まだ終わっていない行動を抜き取る
      pattern: [move('frameCut', 2, { at2: 6, cutsFrame: true }), move('frameRain', 3, { at2: 7 }), move('shutter', 4, { at2: 8 })],
    },
  ];
}

/** 2-3x の砂嵐（段階176） */
const A23X_IDS = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a23x_') && !AREA_BATTLES[id].boss);

/**
 * 2-3x の砂嵐の HP の倍率（今の区画の戦闘の HP にかける）。2-3x に入る時点の控えめな育ち具合で自動対戦して測った：
 * 1.4〜3.1 ラウンド（30戦中30勝）。カイの2つの戦闘は、どれも倒れずに打ち切りまで耐えられた（段階176）
 */
export const A23X_HP_RATE = 1.2;

/** 過去の区画の敵を、その区画の新しい戦闘の敵の作り（性質・予定の癖）で作る（段階176） */
function pastChainEnemy(e: EnemyDef, rate: number): ChainEnemyDef {
  if (['goldfishNoise', 'balloonNoise', 'maskNoise', 'cottonNoise'].includes(e.id)) return a11ChainEnemy(e, rate);
  if (['tinNoise', 'phoneNoise', 'ramuneNoise', 'menkoNoise'].includes(e.id)) return a12ChainEnemy(e, rate);
  if (['gearNoise', 'screwNoise', 'tubeNoise', 'abacusNoise'].includes(e.id)) return a21ChainEnemy(e, rate);
  if (['flipPhoneNoise', 'boomboxNoise', 'metronomeNoise', 'stickerNoise'].includes(e.id)) return a22ChainEnemy(e, rate);
  return a23ChainEnemy(e, rate);
}

/** 2-3 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A23_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  // ぬしの報酬：渾身の一枚とクローズアップ（打ち返しに使える重さ2の札）
  ['a23_boss', { enemies: a23Lord(), variants: [], deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 35, mid: 50 }, pitch: { out: A23_LORD.out, mult: A23_LORD.mult }, snaps: [C.bigShot.id, C.closeUp.id] }],
  ['a23_kai', { enemies: a23Kai(), variants: [], deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 35, mid: 50 } }],
  // 2-3x（段階176）：書庫を見回るカイ（2ラウンドで打ち切り、チェックポイントへ）と、棚の砂時計を取った後のカイ（3ラウンド耐えると逃げきる）
  ['a23x_kai_patrol', { enemies: a23Kai(), variants: [], deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 35, mid: 50 } }],
  ['a23x_kai', { enemies: a23Kai(), variants: [], deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 35, mid: 50 } }],
  // 2-3x の砂嵐（段階176）：過去の区画の敵が、その区画で決めた性質・予定の癖のまま出る
  ...A23X_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const enemies = b.enemies.map((e) => pastChainEnemy(e, A23X_HP_RATE));
    return [id, { enemies, variants: [{ id: 'normal', name: 'ふつう', patterns: enemies.map((e) => e.pattern) }], deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
  ...A23_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a23_n1_') ? A23_CHAIN_HP_RATE.night1 : A23_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a23ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
