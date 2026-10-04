import { describe, expect, it } from 'vitest';
import { applyAction, canUseLink, createBattle, ctDelay, getActionError, startNextTurn } from '../../src/core';
import { CROSS_DRIVE, SKILLS } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

const link = { type: 'link' as const, linkId: 'crossDrive' };

function battle(spd: { hero: number; akari: number; mio: number; enemy: number }) {
  return startNextTurn(
    createBattle(
      setup({
        allies: [
          ally('hero', { spd: spd.hero, atk: 20 }, [SKILLS.fire]),
          ally('akari', { spd: spd.akari }),
          ally('mio', { spd: spd.mio, atk: 10 }),
        ],
        enemies: [enemy('a', { spd: spd.enemy }), enemy('b', { spd: spd.enemy }, { weaknesses: ['fire'] })],
      }),
    ),
  );
}

describe('連携技（クロスドライブ）', () => {
  it('主人公とみおの手番が連続している時に使える', () => {
    // hero ct5 → (hero 10) / mio ct6 / akari ct20 / 敵 ct10
    const s = battle({ hero: 20, akari: 5, mio: 18, enemy: 10 });
    expect(s.turn?.actorId).toBe('hero');
    expect(canUseLink(s, 'crossDrive')).toBe(true);
    expect(getActionError(s, link)).toBeNull();
  });

  it('間に敵の手番が挟まると使えない', () => {
    // hero ct5 / 敵 ct6 / mio ct10
    const s = battle({ hero: 20, akari: 5, mio: 10, enemy: 18 });
    expect(s.turn?.actorId).toBe('hero');
    expect(canUseLink(s, 'crossDrive')).toBe(false);
    expect(getActionError(s, link)).not.toBeNull();
    expect(() => applyAction(s, link)).toThrow();
  });

  it('間に挟まるのが仲間（あかり）なら使える', () => {
    // hero ct5 / akari ct6 / mio ct7 / 敵 ct10
    const s = battle({ hero: 20, akari: 18, mio: 15, enemy: 10 });
    expect(canUseLink(s, 'crossDrive')).toBe(true);
  });

  it('みおの手番からでも使える', () => {
    const s = battle({ hero: 18, akari: 5, mio: 20, enemy: 10 });
    expect(s.turn?.actorId).toBe('mio');
    expect(canUseLink(s, 'crossDrive')).toBe(true);
  });

  it('参加者でない仲間の手番では使えない', () => {
    const s = battle({ hero: 18, akari: 20, mio: 16, enemy: 10 });
    expect(s.turn?.actorId).toBe('akari');
    expect(canUseLink(s, 'crossDrive')).toBe(false);
  });

  it('相方のHPが0なら使えない', () => {
    const s = battle({ hero: 20, akari: 5, mio: 18, enemy: 10 });
    s.allies[2].hp = 0;
    expect(canUseLink(s, 'crossDrive')).toBe(false);
  });

  it('ワンモア中は使えない', () => {
    let s = battle({ hero: 20, akari: 5, mio: 18, enemy: 10 });
    s = applyAction(s, { type: 'skill', skillId: 'fire', target: { kind: 'enemy', id: 'enemy1' } });
    expect(s.turn?.oneMoreActive).toBe(true);
    expect(canUseLink(s, 'crossDrive')).toBe(false);
  });

  it('敵全体にダメージ、手札を2枚引き、2人とも重さ1.5の待ち時間を加算する', () => {
    const s0 = battle({ hero: 20, akari: 5, mio: 18, enemy: 10 });
    const hand = s0.hand.length;
    const s = applyAction(s0, link);
    expect(eventsOf(s, 'damage').map((e) => e.targetId)).toEqual(['enemy0', 'enemy1']);
    expect(s.hand).toHaveLength(hand + 2);
    expect(s.allies[0].ct).toBe(s0.allies[0].ct + ctDelay(20, CROSS_DRIVE.weight));
    expect(s.allies[2].ct).toBe(s0.allies[2].ct + ctDelay(18, CROSS_DRIVE.weight));
    expect(s.allies[1].ct).toBe(s0.allies[1].ct);
    expect(s.turn).toBeNull();
    // 2人の手番をまとめて消費するので、次はみおではない
    const next = startNextTurn(s);
    expect(next.turn?.actorId).not.toBe('mio');
  });
});
