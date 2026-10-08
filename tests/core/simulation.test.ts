import { describe, expect, it } from 'vitest';
import { createBattle, isPlanComplete } from '../../src/core';
import { createEncounterSetup } from '../../src/data';
import { autoPlan, autoPlay, lcg } from '../../src/sim/autoBattle';

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

  it('自動の計画（戦闘画面の「自動で1ラウンド戦う」）で、生きている仲間全員の行動が決まる', () => {
    const s = autoPlan(createBattle(createEncounterSetup('battle1', 1)), lcg(1));
    expect(isPlanComplete(s)).toBe(true);
  });
});
