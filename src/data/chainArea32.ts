import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import type { ChainAreaSetup } from './chainArea11';
import { A3S_COMBOS, A3S_DECK } from './chainArea3s';
import { CHAIN17_CARDS as C } from './chainTrial17';

// 段階185（段取りの段階F8a）：3-2「言えなかった卒業式」の雑魚の戦闘を、段階186（F8b）で踏切のぬしを、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 14-5）。
// 3章の4つの性質（割り込み・ダウン解除・自爆・2回行動）の組み合わせ。敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、
// 性質・予定の癖と型だけをここで書く。敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/** 3-2 の敵のスナップ：4つの性質はもう札になっているので、全部、技から */
export const A32_ENEMY_SNAP = {
  // 自撮り棒ノイズ（技「のびる」）：みんなで写る。先に動いた仲間が多いほど強い
  selfie: { id: 'a32_selfie', name: 'みんなで自撮り', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 15, perActed: 15 }, text: '敵1体に物理15。このラウンドに、もう動いた仲間1人につき+15' },
  // イヤホンノイズ（技「からまる」）：からめて遅らせる
  tangle: { id: 'a32_tangle', name: 'からまるコード', type: 'support', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'slow', rounds: 2, element: 'physical', power: 10 }, text: '敵1体に物理10。2ラウンドの間、その敵の予定が1マス遅れる（鈍足）' },
  // タピオカノイズ（技「粒とばし」）：全体に細かく何回も
  pearls: { id: 'a32_pearls', name: '粒とばし', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 8, hits: 4 }, text: '敵全体に物理8を4回' },
  // 卒業証書の筒ノイズ（技「紙吹雪」）：全体にヒート
  confetti: { id: 'a32_confetti', name: '紙吹雪', type: 'support', weight: 2, target: 'enemies', effect: { kind: 'status', status: 'burn', rounds: 3, element: 'fire', power: 10 }, text: '敵全体に火10。3ラウンドの間、ラウンドの終わりに小さなダメージ（ヒート）' },
} satisfies Record<string, ChainMove>;

export const A32_ENEMY_SNAPS: Record<string, string> = {
  selfieNoise: A32_ENEMY_SNAP.selfie.id,
  earphoneNoise: A32_ENEMY_SNAP.tangle.id,
  tapiocaNoise: A32_ENEMY_SNAP.pearls.id,
  diplomaNoise: A32_ENEMY_SNAP.confetti.id,
};

export const A32_CARD_ART: Record<string, string> = {
  a32_selfie: 'snap.joker',
  a32_tangle: 'snap.thunderChip',
  a32_pearls: 'snap.quickStep',
  a32_confetti: 'snap.fireChip',
  a32_anone: 'snap.encore',
  a32_nothing: 'snap.recover',
};
export const A32_SHORT_TEXT: Record<string, string> = {
  a32_selfie: '物理15\n動いた仲間で+15',
  a32_tangle: '物理10\n2ラウンド鈍足',
  a32_pearls: '全体に\n物理8×4回',
  a32_confetti: '全体に火10\nヒート3ラウンド',
  a32_anone: '物理30\nラウンドごとに+30',
  a32_nothing: '全体を回復\nMP+1',
};

// ---- 段階186（段階F8b）：踏切のぬし。思い出の再演「言えなかった言葉」 ----

/** 言えなかった言葉の札「あのね」（ぬし戦だけ、始めに手札へ。アルバムには入らない）。持っているラウンドが長いほど強い */
export const A32_WORD: ChainMove = { id: 'a32_anone', name: 'あのね', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, perRound: 30 }, text: 'とうや。……あのね。敵1体に物理30。ラウンドが進むほど+30。警報機が鳴っている間は、警報にのまれて言えない' };
/** 最後まで言わずに勝った時のスナップ「なんでもない」（言わないことを選んでもいい） */
export const A32_QUIET: ChainMove = { id: 'a32_nothing', name: 'なんでもない', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 25, mp: 1 }, text: '……なんでもない。味方全体を回復し、MP を1戻す' };

/** 3-2 で渡す札（宝箱の虹・ピンポイント・青フィルター。段階186 のぬしの報酬のズームイン・なんでもない、返した時の巻き上げ） */
export const A32_NEW_SNAPS: ChainMove[] = [C.rainbow, C.pinpoint, C.filterBlue, C.zoom, C.reel, A32_QUIET];
/** アルバムに入れない、ぬし戦だけの札 */
export const A32_BATTLE_ONLY: ChainMove[] = [A32_WORD];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。at2 は2回行動の2回目の時刻。magic はその敵の魔法の属性 */
const GRAD: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; at2?: number; all?: boolean }[]; magic: Element; hp?: number; timer?: number; timerPower?: number }> = {
  // 割り込み：棒がのびて、先に届く
  selfieNoise: { trait: 'interrupt', pattern: [{ action: 'extend', at: 6 }, { action: 'flash', at: 7, all: true }], magic: 'thunder' },
  // ダウン解除：音もれで、ほかの敵を起こす
  earphoneNoise: { trait: 'waker', pattern: [{ action: 'tangle', at: 4 }, { action: 'feedback', at: 6, all: true }], magic: 'thunder' },
  // 自爆：2ラウンド目の終わりに、粒がはじける
  tapiocaNoise: { trait: 'timer', timer: 2, timerPower: 40, pattern: [{ action: 'slurp', at: 5 }, { action: 'pearlShot', at: 7, all: true }], magic: 'physical' },
  // 2回行動：ぽこっ、ぽこっ
  diplomaNoise: { trait: 'swift', pattern: [{ action: 'pokon', at: 3, at2: 7 }, { action: 'paperStorm', at: 4, at2: 8, all: true }], magic: 'physical' },
  // 2晩目の番人：性質なし。寄せ書き（全体）
  yosegakiNoise: { pattern: [{ action: 'messages', at: 5, all: true }, { action: 'cardEdge', at: 3 }], magic: 'fire' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = GRAD[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  const clamp = (n: number) => Math.max(1, Math.min(9, n + shift));
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return {
      id: a.id,
      name: a.name,
      at: clamp(p.at),
      ...(p.at2 !== undefined ? { at2: clamp(p.at2) } : {}),
      ...(p.all || a.target === 'allies' ? { all: true } : {}),
      element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type,
      power: a.power,
    };
  });
}

/**
 * 3-2 の敵の HP の倍率（今の区画の戦闘の HP にかける）。3-2 に入る時点の控えめな育ち具合（ハルト・あかり・みお）で自動対戦して測った（段階185）：
 * 1晩目 1.6〜2.1 ラウンド、2晩目から 2.0〜2.1 ラウンド、番人 4.0 ラウンド（20戦中20勝）。自爆のタピオカがいる戦闘は、2ラウンド目の終わりに決着しやすい
 */
export const A32_CHAIN_HP_RATE = { night1: 1.4, later: 1.2 };

export function a32ChainEnemy(e: EnemyDef, rate: number = A32_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = GRAD[e.id];
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
    ...(f?.timer ? { timer: f.timer } : {}),
    ...(f?.timerPower ? { timerPower: f.timerPower } : {}),
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
 * ぬしと部位の HP・攻撃の倍率。自動対戦（考える方針・3-2 に入る時点の控えめな育ち具合・ハルト・あかり・みお・宝箱の札入り・20戦）で測った（段階186）：
 * 17勝（負け2・打ち切り1）・決着 69〜192マス（中ほど 74）。考える方針は、どの勝ちも「あのね」を言って勝った（言わずに勝つのは、遊ぶ人が選ぶ道）
 */
export const A32_LORD = { body: 1.0, part: 0.5, atk: 1.17 };

function a32Lord(): ChainEnemyDef[] {
  const lord = AREA_BATTLES.a32_boss.enemies[0];
  const act = (id: string) => lord.actions.find((a) => a.id === id)!;
  const partId = (id: string) => `${lord.id}_${id}`;
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'physical' : a.type, power: a.power, ...(a.requiresPart ? { requiresPart: partId(a.requiresPart) } : {}), ...extra };
  };
  const body: ChainEnemyDef = {
    id: lord.id,
    name: lord.name,
    hp: Math.round(lord.stats.hp * A32_LORD.body),
    atk: Math.round(Math.max(lord.stats.atk, lord.stats.mag) * A32_LORD.atk),
    def: lord.stats.def,
    weak: [],
    resist: [],
    // 予定の癖：風圧（単体）を挟みながら、警報（警報機。全体）・遮断（遮断機。重い単体）・通過電車（全体の大技）
    pattern: [
      move('whistleWind', 4, { with: [move('alarmBell', 7)] }),
      move('shut', 5, { with: [move('whistleWind', 8)] }),
      move('whistleWind', 3, { with: [move('alarmBell', 6)] }),
      move('passingTrain', 8),
    ],
  };
  const parts = (['alarm', 'barrier'] as const).map((id): ChainEnemyDef => {
    const p = lord.parts!.find((x) => x.id === id)!;
    return {
      id: partId(id),
      name: p.name,
      hp: Math.round(p.hp * A32_LORD.part),
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

/** 3-2 の雑魚の戦闘 */
const A32_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a32_n') || id === 'a32_runner') && !AREA_BATTLES[id].boss);

/** 3-2 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A32_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  // ぬしの報酬：★3 でズームイン。最後まで「あのね」を言わずに勝つと、なんでもない
  ['a32_boss', { enemies: a32Lord(), variants: [], deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 35, mid: 50 }, word: { card: A32_WORD.id, part: 'crossingLord_alarm' }, snaps: [C.zoom.id], quietSnaps: [A32_QUIET.id] }],
  ...A32_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a32_n1_') ? A32_CHAIN_HP_RATE.night1 : A32_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a32ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
