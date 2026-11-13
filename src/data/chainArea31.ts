import type { ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { A11_DECK, type ChainAreaSetup } from './chainArea11';
import { A21_COMBOS } from './chainArea21';
import { CHAIN17_CARDS as C, CHAIN17_COMBOS } from './chainTrial17';

// 段階178（段取りの段階F5a）：3-1「はじめての仕送り」の雑魚の戦闘を、段階179（F5b）でぬしを、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 14-1）。
// 3章の新しい性質（2回行動・自爆・ダウン解除）が初めて出る。敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、
// 性質・予定の癖と型だけをここで書く。敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/** 3-1 の敵のスナップ：性質をこちら向けにした札（性質のないちゃぶ台は技から） */
export const A31_ENEMY_SNAP = {
  quickTurn: { id: 'a31_quickTurn', name: '早回し', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 15, hits: 2, haste: 1 }, text: '敵1体に物理15を2回。当てると、この後に動く仲間の時刻が1マス早まる' },
  timedSmoke: { id: 'a31_timedSmoke', name: '時限の煙', type: 'attack', weight: 2, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 40, delayed: true }, text: '次のラウンドの始めに、敵全体に火40（今は当たらない）' },
  alarm: { id: 'a31_alarm', name: '目覚まし', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', unguard: true }, text: '添えた攻撃が当たった敵の「警戒」を解く（またダウンさせられる）' },
  tableFlip: { id: 'a31_tableFlip', name: 'ちゃぶ台返し', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40, heavy: true, unsplittable: true, push: 1 }, text: '敵1体に物理40の重い一撃。当たった敵の予定を1マス後ろへ' },
} satisfies Record<string, ChainMove>;

export const A31_ENEMY_SNAPS: Record<string, string> = {
  fanNoise: A31_ENEMY_SNAP.quickTurn.id,
  coilNoise: A31_ENEMY_SNAP.timedSmoke.id,
  radioNoise: A31_ENEMY_SNAP.alarm.id,
  tableNoise: A31_ENEMY_SNAP.tableFlip.id,
};

export const A31_CARD_ART: Record<string, string> = {
  a31_quickTurn: 'snap.quickStep',
  a31_timedSmoke: 'snap.fireChip',
  a31_alarm: 'snap.thunderChip',
  a31_tableFlip: 'snap.heavyBlow',
  // 段階179：ぬし戦の技「ねじを巻く」
  a31_wind: 'snap.recover',
};
export const A31_SHORT_TEXT: Record<string, string> = {
  a31_quickTurn: '物理15×2\n次の仲間が早まる',
  a31_timedSmoke: '次のラウンドに\n全体に火40',
  a31_alarm: '添える\n警戒を解く',
  a31_tableFlip: '物理40\n重い一撃＋押す',
  a31_wind: '腕時計+35\n次の急かすがそれる',
};

/** 3-1 で渡す札（宝箱の3枚と、段階179 のぬしの報酬のポーズ・返した時の余白。アルバムに入れられる札の一覧に足す） */
export const A31_NEW_SNAPS: ChainMove[] = [C.longTake, C.firstCut, C.exposure, C.pause, C.margin];

/** 3-1 のコンボ（2章までに足す）：3人のコンボ「三人の時間」（3人が戦闘に出ていれば使える。段階G で絆のギアの条件に変える） */
export const A31_COMBOS: ChainLinkDef[] = [...A21_COMBOS, ...CHAIN17_COMBOS.filter((l) => l.id === 'threeTimes')];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。at2 は2回行動の2回目の時刻。magic はその敵の魔法の属性 */
const VILLAGE: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; at2?: number; all?: boolean }[]; magic: Element; hp?: number; timer?: number; timerPower?: number }> = {
  // 2回行動：1ラウンドに2回動く（1回目の前にダウン・押す）
  fanNoise: { trait: 'swift', pattern: [{ action: 'blade', at: 3, at2: 7 }, { action: 'gust', at: 4, at2: 8, all: true }], magic: 'physical' },
  // 自爆：2ラウンド目の終わりに大爆発（ラウンドの終わりごとに1減り、0で大爆発して消える）。先に倒す・回復を用意
  coilNoise: { trait: 'timer', timer: 2, timerPower: 40, pattern: [{ action: 'ember', at: 5 }, { action: 'smoke', at: 7, all: true }], magic: 'fire' },
  // ダウン解除：動くと、ダウンしているほかの敵を起こす（先に倒す・押す・ダウン）
  radioNoise: { trait: 'waker', pattern: [{ action: 'tuning', at: 4 }, { action: 'static', at: 6, all: true }], magic: 'thunder' },
  // 性質なし：打たれ強い壁役
  tableNoise: { pattern: [{ action: 'teacup', at: 5 }, { action: 'flip', at: 7, all: true }], magic: 'physical', hp: 0.8 },
  // 実家の門の番人（2晩目）：性質なし。手紙の雨（全体）
  postboxNoise: { pattern: [{ action: 'letterRain', at: 5, all: true }, { action: 'stamp', at: 3 }], magic: 'ice' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = VILLAGE[e.id];
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

/** 3-1 の敵の HP の倍率（今の区画の戦闘の HP にかける）。3-1 に入る時点の控えめな育ち具合で自動対戦して測った（段階178） */
export const A31_CHAIN_HP_RATE = { night1: 1.3, later: 0.9 };

export function a31ChainEnemy(e: EnemyDef, rate: number = A31_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = VILLAGE[e.id];
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

// ---- 段階179（段階F5b）：ぬし「汽車のぬし」。思い出の再演「腕時計を守る」 ----

/**
 * ぬしと部位の HP・攻撃の倍率と、腕時計の決まり（HP・巻いた時に戻る量・そらす数・急かすの威力）。
 * 自動対戦（考える方針・3-1 に入る時点の控えめな育ち具合・宝箱の札を入れた山札・20戦）で、16勝（負けは全部腕時計）・6.6ラウンド・1戦にねじを2.5回巻いた（段階179）。
 * 攻撃を ×1.25 にすると 8勝（守りに手番を取られる）、急かすを 45 にすると 6〜12勝と、急に難しくなる
 */
export const A31_LORD = { body: 0.88, part: 0.3, atk: 0.8, watchHp: 100, wind: 35, ease: 1, hurry: 40 };

/** 仲間の技「ねじを巻く」（ぬし戦だけ、全員に足す） */
export const A31_WIND: ChainMove = { id: 'a31_wind', name: 'ねじを巻く', type: 'support', weight: 2, target: 'allies', effect: { kind: 'heal', power: 0, watch: A31_LORD.wind }, text: `母の腕時計のねじを巻く。腕時計の HP が${A31_LORD.wind}戻り、次のラウンドの最初の「急かす」が仲間へそれる` };

function a31Lord(): ChainEnemyDef[] {
  const lord = AREA_BATTLES.a31_boss.enemies[0];
  const act = (id: string) => lord.actions.find((a) => a.id === id)!;
  const hurry = (at: number): ChainEnemyMove => ({ id: 'hurry', name: '急かす', at, element: 'physical', power: A31_LORD.hurry, watch: true });
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'thunder' : a.type, power: a.power, ...extra };
  };
  const partId = (id: string) => `${lord.id}_${id}`;
  const body: ChainEnemyDef = {
    id: lord.id,
    name: lord.name,
    hp: Math.round(lord.stats.hp * A31_LORD.body),
    atk: Math.round(Math.max(lord.stats.atk, lord.stats.mag) * A31_LORD.atk),
    def: lord.stats.def,
    weak: [],
    resist: [],
    // 予定の癖：毎ラウンド、ほかの行動と一緒に「急かす」（腕時計をねらう）が1〜2つ。with は時刻の順に書く（ねじを巻いた次のラウンドは、先の物からそれる）
    pattern: [
      move('whistle', 3, { with: [hurry(6)] }),
      move('charge', 4, { requiresPart: partId('wheel'), with: [hurry(2), hurry(7)] }),
      move('blackSmoke', 5, { requiresPart: partId('chimney'), with: [hurry(8)] }),
      move('departBell', 8, { with: [hurry(4), hurry(6)] }),
    ],
  };
  const parts = (['chimney', 'wheel'] as const).map((id): ChainEnemyDef => {
    const p = lord.parts!.find((x) => x.id === id)!;
    return {
      id: partId(id),
      name: p.name,
      hp: Math.round(p.hp * A31_LORD.part),
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

/** 3-1 の雑魚の戦闘 */
const A31_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a31_n') || id === 'a31_runner') && !AREA_BATTLES[id].boss);

/** 3-1 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A31_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  // ぬしの報酬（部位を壊した時）：ポーズ（大技・全体攻撃をふつうの単体攻撃に）
  ['a31_boss', { enemies: a31Lord(), variants: [], deck: A11_DECK, cards: {}, links: A31_COMBOS, gradeAt: { high: 35, mid: 50 }, watch: { hp: A31_LORD.watchHp, ease: A31_LORD.ease }, allyMoves: [A31_WIND], snaps: [C.pause.id] }],
  ...A31_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a31_n1_') ? A31_CHAIN_HP_RATE.night1 : A31_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a31ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: {}, links: A31_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
