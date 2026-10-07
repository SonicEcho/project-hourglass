import { describe, expect, it } from 'vitest';
import type { BattleState, PlayerAction } from '../../src/core';
import {
  applyExtra,
  availableCombos,
  availableHand,
  batonTargets,
  createBattle,
  declineExtra,
  extraPool,
  getExtraError,
  getPlanError,
  getSupportError,
  livingAllies,
  passBaton,
  resolveSearch,
  runUntilInput,
  setPlan,
  startExecution,
  useSupport,
} from '../../src/core';
import { createEncounterSetup } from '../../src/data';

/** 擬似乱数（テストの操作の選び方用） */
function lcg(seed: number) {
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
  list.push({ type: 'link', linkId: 'crossDrive' });
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

function autoPlay(s0: BattleState, seed: number): BattleState {
  const pick = lcg(seed);
  let s = s0;
  for (let guard = 0; guard < 3000 && s.phase !== 'ended'; guard++) {
    if (s.phase === 'plan') {
      // サポートスナップがあれば使う
      const support = s.hand.find((c) => c.card.support && getSupportError(s, c.uid, livingAllies(s)[0].uid) === null);
      if (support && pick(2) === 0) {
        s = useSupport(s, support.uid, livingAllies(s)[0].uid);
        if (s.searchChoice) s = resolveSearch(s, s.searchChoice[0].uid);
      }
      for (const a of livingAllies(s)) {
        if (s.plans.some((p) => !p.done && p.actorIds.includes(a.uid))) continue;
        const valid = candidates(s, availableHand(s, [a.uid]), a.uid).filter((x) => getPlanError(s, a.uid, x) === null);
        s = setPlan(s, a.uid, valid[pick(Math.min(valid.length, 5))]);
      }
      s = runUntilInput(startExecution(s));
    } else if (s.phase === 'extra') {
      const targets = batonTargets(s);
      if (targets.length > 0 && pick(3) === 0) {
        s = passBaton(s, targets[0].uid);
        continue;
      }
      const valid = candidates(s, extraPool(s), s.extra!.actorId).filter((x) => getExtraError(s, x) === null);
      s = valid.length > 0 ? applyExtra(s, valid[pick(Math.min(valid.length, 5))]) : declineExtra(s);
      s = runUntilInput(s);
    }
  }
  return s;
}

describe('通しの自動対戦', () => {
  it.each([1, 2, 3, 42])('戦闘1（雑魚戦）が最後まで進み、勝敗がつく（seed %i）', (seed) => {
    const s = autoPlay(createBattle(createEncounterSetup('battle1', seed)), seed);
    expect(s.outcome).not.toBe('ongoing');
    expect(s.deck.length + s.hand.length + s.discard.length).toBe(20);
  });

  it.each([1, 2, 3, 42])('戦闘2（ボス戦）が最後まで進み、勝敗がつく（seed %i）', (seed) => {
    const s = autoPlay(createBattle(createEncounterSetup('battle2', seed)), seed);
    expect(s.outcome).not.toBe('ongoing');
    expect(s.deck.length + s.hand.length + s.discard.length).toBe(20);
  });

  it('同じシードなら同じ展開になる', () => {
    const a = autoPlay(createBattle(createEncounterSetup('battle2', 5)), 5);
    const b = autoPlay(createBattle(createEncounterSetup('battle2', 5)), 5);
    expect(a.log).toEqual(b.log);
  });
});
