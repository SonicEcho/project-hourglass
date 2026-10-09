import type { BattleState, PlayerAction } from '../core';
import {
  applyExtra,
  availableCombos,
  availableHand,
  batonTargets,
  declineExtra,
  extraPool,
  getExtraError,
  getPlanError,
  getSupportError,
  isOffBalance,
  livingAllies,
  passBaton,
  resolveSearch,
  runUntilInput,
  setPlan,
  startExecution,
  useSupport,
} from '../core';

// 自動対戦（段階12）。数値を決める時の測定用。Phaser に依存しない。
// 方針は「手をほぼでたらめに選ぶ」：候補の先頭5つからでたらめに選ぶ。サポートは半分の確率で使い、追加行動は3回に1回バトンタッチする

/** 擬似乱数（自動の操作の選び方用）。0〜n-1 を返す関数を作る */
export function lcg(seed: number): (n: number) => number {
  let r = seed;
  return (n: number) => {
    r = (r * 1103515245 + 12345) % 2147483648;
    return r % n;
  };
}

/** 単純な方針で選べる行動の候補 */
function candidates(s: BattleState, pool: ReturnType<typeof availableHand>, actorId: string): PlayerAction[] {
  const actor = s.allies.find((a) => a.uid === actorId)!;
  const enemies = s.enemies.filter((e) => e.hp > 0);
  const weakest = livingAllies(s).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const targets = enemies.flatMap((e) => [
    { kind: 'enemy' as const, id: e.uid },
    ...e.parts.filter((p) => !p.broken).map((p) => ({ kind: 'enemy' as const, id: e.uid, partId: p.id })),
  ]);
  const list: PlayerAction[] = [];
  for (const c of availableCombos(s, pool)) list.push({ type: 'combo', comboId: c.id, target: targets[0] });
  for (const l of s.links) list.push({ type: 'link', linkId: l.id });
  for (const c of pool) {
    if (c.card.target === 'ally') list.push({ type: 'card', cardUid: c.uid, target: { kind: 'ally', id: weakest.uid } });
    for (const t of targets) list.push({ type: 'card', cardUid: c.uid, target: t });
    list.push({ type: 'card', cardUid: c.uid });
  }
  for (const k of actor.skills) {
    if (k.target === 'ally') list.push({ type: 'skill', skillId: k.id, target: { kind: 'ally', id: weakest.uid } });
    for (const t of targets) list.push({ type: 'skill', skillId: k.id, target: t });
  }
  for (const t of targets) list.push({ type: 'attack', target: t });
  list.push({ type: 'guard' });
  return list;
}

/** 計画の局面：サポートを使うか決め、まだ行動を決めていない仲間の行動を決める（段階20で autoPlay から切り出し、戦闘画面の「自動で1ラウンド戦う」でも使う） */
export function autoPlan(s0: BattleState, pick: (n: number) => number): BattleState {
  let s = s0;
  // サポートスナップがあれば使う
  const support = s.hand.find((c) => c.card.support && getSupportError(s, c.uid, livingAllies(s)[0].uid) === null);
  if (support && pick(2) === 0) {
    s = useSupport(s, support.uid, livingAllies(s)[0].uid);
    if (s.searchChoice) s = resolveSearch(s, s.searchChoice[0].uid);
  }
  for (const a of livingAllies(s)) {
    if (s.plans.some((p) => !p.done && p.actorIds.includes(a.uid))) continue;
    // 相方の行動がもう決まっている連携技は選ばない（選ぶと相方の計画を上書きしてしまう）
    const partnerFree = (x: PlayerAction) =>
      x.type !== 'link' || (s.links.find((l) => l.id === x.linkId)?.members ?? []).every((id) => id === a.uid || !s.plans.some((p) => !p.done && p.actorIds.includes(id)));
    const valid = candidates(s, availableHand(s, [a.uid]), a.uid).filter((x) => partnerFree(x) && getPlanError(s, a.uid, x) === null);
    s = setPlan(s, a.uid, valid[pick(Math.min(valid.length, 5))]);
  }
  return s;
}

/** 追加行動の局面：バトンタッチ・行動・見送りのどれかを選ぶ。返す状態は、選んだ直後（続きの実行はしない） */
export function autoExtra(s: BattleState, pick: (n: number) => number): { kind: 'baton' | 'act' | 'decline'; state: BattleState } {
  const targets = batonTargets(s);
  if (targets.length > 0 && pick(3) === 0) return { kind: 'baton', state: passBaton(s, targets[0].uid) };
  const valid = candidates(s, extraPool(s), s.extra!.actorId).filter((x) => getExtraError(s, x) === null);
  return valid.length > 0
    ? { kind: 'act', state: applyExtra(s, valid[pick(Math.min(valid.length, 5))]) }
    : { kind: 'decline', state: declineExtra(s) };
}

/** 戦闘を最後まで自動で遊ぶ（手をほぼでたらめに選ぶ）。同じシードなら同じ展開になる */
export function autoPlay(s0: BattleState, seed: number): BattleState {
  const pick = lcg(seed);
  let s = s0;
  for (let guard = 0; guard < 3000 && s.phase !== 'ended'; guard++) {
    if (s.phase === 'plan') {
      s = runUntilInput(startExecution(autoPlan(s, pick)));
    } else if (s.phase === 'extra') {
      const r = autoExtra(s, pick);
      s = r.kind === 'baton' ? r.state : runUntilInput(r.state);
    }
  }
  return s;
}

// ---- 弱点をねらう方針（段階27。1-1 の数値を決める測定用。段階29のオートの作戦の土台にもする） ----
// 敵の本当の弱点を知っている遊び手として：弱点を突く行動を最優先、なければ「弱点が隠れた部位」を狙い、
// 連携技は体勢が崩れた敵がいる時だけ使う。力をためている敵がいて弱点を突けない仲間は防御する

/** その行動が、対象の敵の弱点を突くか（敵の本当の弱点で判定する） */
function hitsWeakness(s: BattleState, actorId: string, x: PlayerAction): boolean {
  const actor = s.allies.find((a) => a.uid === actorId);
  const target = 'target' in x && x.target?.kind === 'enemy' ? s.enemies.find((e) => e.uid === x.target!.id) : undefined;
  if (!actor || !target || x.type === 'link') return false;
  if (x.type === 'attack') return target.weaknesses.includes(actor.attackElement);
  const def = x.type === 'skill' ? actor.skills.find((k) => k.id === x.skillId) : x.type === 'card' ? s.hand.find((c) => c.uid === x.cardUid)?.card : undefined;
  const dmg = def?.effects.find((e) => e.kind === 'damage');
  return !!dmg && dmg.kind === 'damage' && dmg.type !== 'magic' && target.weaknesses.includes(dmg.type);
}

/** 弱点が隠れている部位（壊すと弱点が出る、まだ壊れていない部位）を狙う行動か */
function hitsHiddenWeakPart(s: BattleState, x: PlayerAction): boolean {
  const t = 'target' in x ? x.target : undefined;
  if (t?.kind !== 'enemy' || !t.partId) return false;
  const part = s.enemies.find((e) => e.uid === t.id)?.parts.find((p) => p.id === t.partId);
  return !!part && !part.broken && part.revealsWeakness.length > 0;
}

function smartChoice(s: BattleState, valid: PlayerAction[], actorId: string, pick: (n: number) => number): PlayerAction {
  const link = valid.find((x) => x.type === 'link');
  if (link && s.enemies.some((e) => isOffBalance(e))) return link;
  const rest = valid.filter((x) => x.type !== 'link');
  const weak = rest.filter((x) => hitsWeakness(s, actorId, x));
  if (weak.length > 0) return weak[pick(weak.length)];
  if (s.phase === 'plan' && s.enemies.some((e) => e.hp > 0 && e.charging) && rest.some((x) => x.type === 'guard')) return { type: 'guard' };
  const part = rest.filter((x) => hitsHiddenWeakPart(s, x));
  if (part.length > 0) return part[pick(part.length)];
  const attacks = rest.filter((x) => x.type !== 'guard');
  return attacks[pick(Math.min(attacks.length, 5))] ?? rest[0];
}

/** 弱点をねらう方針の計画 */
export function smartPlan(s0: BattleState, pick: (n: number) => number): BattleState {
  let s = s0;
  for (const a of livingAllies(s)) {
    if (s.plans.some((p) => !p.done && p.actorIds.includes(a.uid))) continue;
    const partnerFree = (x: PlayerAction) =>
      x.type !== 'link' || (s.links.find((l) => l.id === x.linkId)?.members ?? []).every((id) => id === a.uid || !s.plans.some((p) => !p.done && p.actorIds.includes(id)));
    const valid = candidates(s, availableHand(s, [a.uid]), a.uid).filter((x) => partnerFree(x) && getPlanError(s, a.uid, x) === null);
    s = setPlan(s, a.uid, smartChoice(s, valid, a.uid, pick));
  }
  return s;
}

/** 弱点をねらう方針の追加行動：弱点を突ければ突く、なければバトンタッチか、ほかの行動 */
export function smartExtra(s: BattleState, pick: (n: number) => number): { kind: 'baton' | 'act' | 'decline'; state: BattleState } {
  const valid = candidates(s, extraPool(s), s.extra!.actorId).filter((x) => getExtraError(s, x) === null);
  const weak = valid.filter((x) => hitsWeakness(s, s.extra!.actorId, x));
  if (weak.length > 0) return { kind: 'act', state: applyExtra(s, weak[pick(weak.length)]) };
  const targets = batonTargets(s);
  if (targets.length > 0 && pick(2) === 0) return { kind: 'baton', state: passBaton(s, targets[0].uid) };
  const choice = valid.length > 0 ? smartChoice(s, valid, s.extra!.actorId, pick) : undefined;
  return choice ? { kind: 'act', state: applyExtra(s, choice) } : { kind: 'decline', state: declineExtra(s) };
}

/** 戦闘を最後まで、弱点をねらう方針で遊ぶ。同じシードなら同じ展開になる */
export function smartPlay(s0: BattleState, seed: number): BattleState {
  const pick = lcg(seed);
  let s = s0;
  for (let guard = 0; guard < 3000 && s.phase !== 'ended'; guard++) {
    if (s.phase === 'plan') {
      s = runUntilInput(startExecution(smartPlan(s, pick)));
    } else if (s.phase === 'extra') {
      const r = smartExtra(s, pick);
      s = r.kind === 'baton' ? r.state : runUntilInput(r.state);
    }
  }
  return s;
}
