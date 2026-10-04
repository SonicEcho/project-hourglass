import { describe, expect, it } from 'vitest';
import type { BattleState, PlayerAction } from '../../src/core';
import { advanceToPlayerTurn, applyAction, batonTargets, createBattle, currentAlly, getActionError } from '../../src/core';
import { createEncounterSetup } from '../../src/data';

/** 単純な方針で自動的に遊ぶ。使える行動の候補を順に試す */
function candidates(s: BattleState): PlayerAction[] {
  const actor = currentAlly(s)!;
  const enemies = s.enemies.filter((e) => e.hp > 0);
  const weakest = [...s.allies].filter((a) => a.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const enemyTargets = enemies.flatMap((e) => [
    { kind: 'enemy' as const, id: e.uid },
    ...e.parts.filter((p) => !p.broken).map((p) => ({ kind: 'enemy' as const, id: e.uid, partId: p.id })),
  ]);
  const list: PlayerAction[] = [];
  if (s.turn?.oneMoreActive && batonTargets(s).length > 0 && s.turn.batonChain.length === 0) {
    list.push({ type: 'baton', toAllyId: batonTargets(s)[0].uid });
  }
  list.push({ type: 'link', linkId: 'crossDrive' });
  for (const c of s.hand) {
    if (c.card.target === 'ally' && weakest.hp < weakest.maxHp / 2) list.push({ type: 'card', cardUid: c.uid, target: { kind: 'ally', id: weakest.uid } });
    for (const t of enemyTargets) list.push({ type: 'card', cardUid: c.uid, target: t });
  }
  for (const k of actor.skills) {
    if (k.target === 'ally') list.push({ type: 'skill', skillId: k.id, target: { kind: 'ally', id: weakest.uid } });
    for (const t of enemyTargets) list.push({ type: 'skill', skillId: k.id, target: t });
  }
  for (const t of enemyTargets) list.push({ type: 'attack', target: t });
  return list;
}

function autoPlay(s0: BattleState, pickSeed: number): BattleState {
  let s = advanceToPlayerTurn(s0);
  let r = pickSeed;
  for (let step = 0; step < 2000 && s.outcome === 'ongoing'; step++) {
    const valid = candidates(s).filter((a) => getActionError(s, a) === null);
    r = (r * 1103515245 + 12345) % 2147483648;
    const action = valid[r % Math.min(valid.length, 4)] ?? { type: 'guard' };
    s = applyAction(s, action);
    s = advanceToPlayerTurn(s);
  }
  return s;
}

describe('通しの自動対戦', () => {
  it.each([1, 2, 3, 42])('戦闘1（雑魚戦）が最後まで進み、勝敗がつく（seed %i）', (seed) => {
    const s = autoPlay(createBattle(createEncounterSetup('battle1', seed)), seed);
    expect(s.outcome).not.toBe('ongoing');
    // カードの総数は変わらない
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
