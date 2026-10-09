import type { ActionDef, BattleState, PlayerAction } from '../core';
import {
  applyExtra,
  availableHand,
  basicAttackFor,
  declineExtra,
  extraPool,
  getExtraError,
  getPlanError,
  livingAllies,
  previewAction,
  runUntilInput,
  setPlan,
  startExecution,
} from '../core';
import { candidates } from './autoBattle';

// 雑魚戦のオートの作戦（段階29）。Phaser に依存しない。戦闘画面の「オート」と、テストから使う。
// どの作戦も、出せる行動の候補をプレビューのダメージで比べて選ぶ（乱数は使わない。同じ状態なら同じ行動）。
// 連携技とサポートのスナップは使わない（ゲージは章の中で引き継ぐので、雑魚戦で勝手に使わない）

export type Tactic = 'auto' | 'weak' | 'defend' | 'noMp';

export const TACTICS: { id: Tactic; name: string; desc: string }[] = [
  { id: 'auto', name: 'おまかせ', desc: '弱点を突きつつ、HPが4割を切ったら回復。大技のためには、弱点を突けなければ防御' },
  { id: 'weak', name: '弱点を突く', desc: '弱点を突くことを一番に。回復も防御もしない' },
  { id: 'defend', name: '守りを固める', desc: 'HPが6割を切ったら回復。大技のためには必ず防御' },
  { id: 'noMp', name: 'MPを使わない', desc: 'スナップと通常攻撃だけで戦う（魔法・スキルを使わない）' },
];

/** 作戦ごとの、回復する HP の割合（これを下回る仲間がいたら回復を選ぶ）。0 は回復しない */
const HEAL_BELOW: Record<Tactic, number> = { auto: 0.4, weak: 0, defend: 0.6, noMp: 0.4 };

/** その行動の中身（スナップ・魔法・スキル・コンボ・通常攻撃） */
function defOf(s: BattleState, actorId: string, x: PlayerAction): ActionDef | undefined {
  const actor = s.allies.find((a) => a.uid === actorId);
  if (!actor) return undefined;
  switch (x.type) {
    case 'card':
      return s.hand.find((c) => c.uid === x.cardUid)?.card;
    case 'skill':
      return actor.skills.find((k) => k.id === x.skillId);
    case 'combo':
      return s.combos.find((c) => c.id === x.comboId);
    case 'attack':
      return basicAttackFor(actor);
    default:
      return undefined;
  }
}

const heals = (d: ActionDef | undefined) => !!d?.effects.some((e) => e.kind === 'heal');

/** 行動の点数：敵へのダメージの見込み（弱点を突けば、作戦によって上乗せ）。弱点は、オートの仲間は知っているものとする */
function attackScore(s: BattleState, actorId: string, x: PlayerAction, tactic: Tactic): number {
  let p;
  try {
    p = previewAction(s, actorId, x);
  } catch {
    return -1;
  }
  let score = 0;
  for (const t of p.targets) {
    if (t.kind !== 'damage') continue;
    const enemy = s.enemies.find((e) => e.uid === t.unitId);
    if (!enemy) continue;
    let dmg = Math.min((t.min + t.max) / 2, enemy.hp);
    const d = defOf(s, actorId, x);
    const type = d?.effects.find((e) => e.kind === 'damage');
    const weak = type?.kind === 'damage' && type.type !== 'magic' && enemy.weaknesses.includes(type.type) && !enemy.down && !enemy.standUpGuard;
    if (weak) dmg *= tactic === 'weak' ? 3 : 1.6;
    score += dmg;
  }
  return score;
}

/** 候補から、作戦で1つ選ぶ。選べる行動がなければ null */
export function chooseByTactic(s: BattleState, actorId: string, valid: PlayerAction[], tactic: Tactic): PlayerAction | null {
  let list = valid.filter((x) => x.type !== 'link');
  if (tactic === 'noMp') list = list.filter((x) => x.type !== 'skill' || (defOf(s, actorId, x) as { mp?: number } | undefined)?.mp === 0);
  if (list.length === 0) return null;
  // 回復
  const healBelow = HEAL_BELOW[tactic];
  const hurt = livingAllies(s).filter((a) => a.hp / a.maxHp < healBelow);
  if (hurt.length > 0) {
    const healers = list.filter((x) => heals(defOf(s, actorId, x)));
    if (healers.length > 0) {
      // 2人以上が危ないなら全体の回復を優先する
      const all = healers.find((x) => defOf(s, actorId, x)?.target === 'allies');
      return hurt.length >= 2 && all ? all : healers[0];
    }
  }
  // 大技のため：守りを固めるなら必ず防御。おまかせ等は、弱点を突けない時だけ防御
  const charging = s.phase === 'plan' && s.enemies.some((e) => e.hp > 0 && e.charging);
  const guard = list.find((x) => x.type === 'guard');
  if (charging && guard && tactic === 'defend') return guard;
  let best: PlayerAction | null = null;
  let bestScore = 0;
  for (const x of list) {
    if (x.type === 'guard' || heals(defOf(s, actorId, x))) continue;
    const sc = attackScore(s, actorId, x, tactic);
    if (sc > bestScore) {
      best = x;
      bestScore = sc;
    }
  }
  if (charging && guard && tactic !== 'weak') {
    const canDown = best && attackScore(s, actorId, best, 'weak') > attackScore(s, actorId, best, 'noMp') + 0.5;
    if (!canDown) return guard;
  }
  return best ?? guard ?? list[0];
}

/** 計画の局面：まだ決めていない仲間の行動を、作戦で決める */
export function planByTactic(s0: BattleState, tactic: Tactic): BattleState {
  let s = s0;
  for (const a of livingAllies(s)) {
    if (s.plans.some((p) => !p.done && p.actorIds.includes(a.uid))) continue;
    const valid = candidates(s, availableHand(s, [a.uid]), a.uid).filter((x) => getPlanError(s, a.uid, x) === null);
    const choice = chooseByTactic(s, a.uid, valid, tactic) ?? { type: 'guard' };
    s = setPlan(s, a.uid, choice);
  }
  return s;
}

/** 追加行動の局面：作戦で行動を選ぶ（なければ見送る）。返す状態は、選んだ直後 */
export function extraByTactic(s: BattleState, tactic: Tactic): BattleState {
  const actorId = s.extra!.actorId;
  const valid = candidates(s, extraPool(s), actorId).filter((x) => x.type !== 'guard' && getExtraError(s, x) === null);
  const choice = chooseByTactic(s, actorId, valid, tactic);
  return choice ? applyExtra(s, choice) : declineExtra(s);
}

export function isTactic(v: unknown): v is Tactic {
  return TACTICS.some((t) => t.id === v);
}

/** 作戦だけで戦闘を最後まで進める（テストと測定用） */
export function tacticPlay(s0: BattleState, tactic: Tactic): BattleState {
  let s = s0;
  for (let guard = 0; guard < 3000 && s.phase !== 'ended'; guard++) {
    if (s.phase === 'plan') s = runUntilInput(startExecution(planByTactic(s, tactic)));
    else if (s.phase === 'extra') s = runUntilInput(extraByTactic(s, tactic));
  }
  return s;
}
