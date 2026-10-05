import { describe, expect, it } from 'vitest';
import { applyExtra, batonTargets, declineExtra, getExtraError, passBaton, runUntilInput } from '../../src/core';
import type { BattleState } from '../../src/core';
import { CARDS, SKILLS } from '../../src/data';
import { ally, attackOn, battle, enemy, eventsOf, execute, guard, planAll, withHand } from './helpers';

const fire = (id: string) => ({ type: 'skill' as const, skillId: 'fire', target: { kind: 'enemy' as const, id } });
const ice = (id: string) => ({ type: 'skill' as const, skillId: 'ice', target: { kind: 'enemy' as const, id } });

/** 主人公（速い）が火を使う。あかり・みおは防御。敵2体は火が弱点で遅い */
function setupBattle(enemies = [enemy('a', {}, { weaknesses: ['fire'] }), enemy('b', {}, { weaknesses: ['fire'] })]): BattleState {
  return battle({
    allies: [ally('hero', { spd: 50 }, [SKILLS.fire, SKILLS.ice]), ally('akari', { mag: 20 }, [SKILLS.care]), ally('mio')],
    enemies,
  });
}

function toOneMore(s0 = setupBattle()): BattleState {
  return execute(planAll(s0, { hero: fire('enemy0'), akari: guard, mio: guard }));
}

describe('ワンモア', () => {
  it('弱点を突いて敵をダウンさせると、その場で追加行動を選ぶ', () => {
    const s = toOneMore();
    expect(s.phase).toBe('extra');
    expect(s.extra).toMatchObject({ actorId: 'hero', boost: false });
    expect(s.enemies[0].down).toBe(true);
    expect(eventsOf(s, 'oneMore')).toEqual([{ type: 'oneMore', actorId: 'hero' }]);
  });

  it('ワンモアになると手札を1枚引く', () => {
    const s0 = setupBattle();
    const s = toOneMore(s0);
    expect(s.hand).toHaveLength(s0.hand.length + 1);
  });

  it('追加行動はすぐに実行し、その後ラウンドの残りを続ける', () => {
    let s = toOneMore();
    s = applyExtra(s, ice('enemy1'));
    expect(s.phase).toBe('execute');
    expect(eventsOf(s, 'action').at(-1)).toMatchObject({ actionId: 'ice', extra: true });
    s = runUntilInput(s);
    expect(s.round).toBe(2);
  });

  it('追加行動とは別に、計画していた本来の行動も後で行う', () => {
    // あかりは遅く、追加行動の後に本来の行動（防御ではなく通常攻撃）をする
    let s = execute(planAll(setupBattle(), { hero: fire('enemy0'), akari: attackOn('enemy1'), mio: guard }));
    s = applyExtra(s, { type: 'guard' });
    s = runUntilInput(s);
    const actions = eventsOf(s, 'action').filter((e) => e.actorIds[0] === 'akari');
    expect(actions.map((a) => a.actionId)).toEqual(['attack']);
  });

  it('1回の行動で何体ダウンさせても、ワンモアは1回', () => {
    let s = withHand(setupBattle(), [CARDS.wideShot]);
    s.enemies.forEach((e) => (e.weaknesses = ['physical']));
    s = execute(planAll(s, { hero: { type: 'card', cardUid: s.hand[0].uid }, akari: guard, mio: guard }));
    expect(s.enemies.every((e) => e.down)).toBe(true);
    expect(eventsOf(s, 'oneMore')).toHaveLength(1);
  });

  it('連鎖：追加行動で別の敵をダウンさせると、さらにワンモア', () => {
    let s = toOneMore();
    s = applyExtra(s, fire('enemy1'));
    expect(s.phase).toBe('extra');
    expect(eventsOf(s, 'oneMore')).toHaveLength(2);
  });

  it('ダウン中の敵の弱点を突いてもワンモアにならない（連鎖は敵の数まで）', () => {
    let s = toOneMore();
    s = applyExtra(s, fire('enemy0'));
    expect(s.phase).toBe('execute');
    expect(eventsOf(s, 'oneMore')).toHaveLength(1);
  });

  it('弱点で倒した敵はダウンせず、ワンモアにならない', () => {
    const s0 = setupBattle();
    s0.enemies[0].hp = 1;
    const s = toOneMore(s0);
    expect(s.enemies[0].down).toBe(false);
    expect(eventsOf(s, 'oneMore')).toHaveLength(0);
  });

  it('連携技は追加行動に使えない', () => {
    const s = toOneMore();
    expect(getExtraError(s, { type: 'link', linkId: 'crossDrive' })).not.toBeNull();
  });

  it('見送ることもできる', () => {
    const s = declineExtra(toOneMore());
    expect(s.phase).toBe('execute');
    expect(s.extra).toBeNull();
  });

  it('これから行動する仲間が確保しているカードは、追加行動に使えない', () => {
    let s = withHand(setupBattle(), [CARDS.sword, CARDS.fireChip]);
    const [swordCard, chip] = s.hand;
    s = execute(
      planAll(s, {
        hero: { type: 'card', cardUid: chip.uid, target: { kind: 'enemy', id: 'enemy0' } },
        akari: { type: 'card', cardUid: swordCard.uid, target: { kind: 'enemy', id: 'enemy1' } },
        mio: guard,
      }),
    );
    expect(s.phase).toBe('extra');
    expect(getExtraError(s, { type: 'card', cardUid: swordCard.uid, target: { kind: 'enemy', id: 'enemy1' } })).not.toBeNull();
  });
});

describe('割り込み', () => {
  it('まだ動いていない敵をダウンさせると、その敵はこのラウンド行動しない', () => {
    let s = toOneMore();
    s = runUntilInput(declineExtra(s));
    expect(eventsOf(s, 'standUp').map((e) => e.enemyId)).toEqual(['enemy0']);
    expect(eventsOf(s, 'action').some((e) => e.actorIds[0] === 'enemy0')).toBe(false);
    expect(s.enemies[0].down).toBe(false);
  });

  it('立ち上がった敵は、次に自分が行動するまでダウンしない', () => {
    let s = runUntilInput(declineExtra(toOneMore()));
    expect(s.enemies[0].standUpGuard).toBe(true);
    // 2ラウンド目：また先に火で弱点を突くが、ダウンしない
    s = execute(planAll(s, { hero: fire('enemy0'), akari: guard, mio: guard }));
    expect(s.phase).toBe('plan');
    expect(eventsOf(s, 'oneMore')).toHaveLength(1);
    // 敵0はこのラウンド行動した → 次はまたダウンする
    expect(s.enemies[0].standUpGuard).toBe(false);
  });

  it('すでに動いた敵をダウンさせると、次のラウンドの行動を立ち上がりに使う', () => {
    // 主人公を遅くして、敵の後に火を当てる
    const s0 = battle({
      allies: [ally('hero', { spd: 1 }, [SKILLS.fire])],
      enemies: [enemy('a', { spd: 50 }, { weaknesses: ['fire'] })],
    });
    let s = execute(planAll(s0, { hero: fire('enemy0') }));
    expect(eventsOf(s, 'action').map((e) => e.actorIds[0])).toEqual(['enemy0', 'hero']);
    s = runUntilInput(declineExtra(s));
    s = execute(planAll(s, { hero: guard }));
    expect(eventsOf(s, 'standUp')).toHaveLength(1);
    expect(eventsOf(s, 'action').filter((e) => e.actorIds[0] === 'enemy0')).toHaveLength(1);
  });
});

describe('バトンタッチ', () => {
  it('ワンモア中だけ選べる', () => {
    expect(batonTargets(setupBattle())).toEqual([]);
    expect(batonTargets(toOneMore()).map((a) => a.uid)).toEqual(['akari', 'mio']);
  });

  it('渡した仲間がその場で追加行動を選び、回復量が1.25倍', () => {
    let s = passBaton(toOneMore(), 'akari');
    expect(s.extra).toMatchObject({ actorId: 'akari', boost: true, chain: ['hero', 'akari'] });
    s.allies[2].hp = 10;
    s = applyExtra(s, { type: 'skill', skillId: 'care', target: { kind: 'ally', id: 'mio' } });
    // 50 × 20 ÷ 20 = 50 → ×1.25 = 62
    expect(eventsOf(s, 'heal')[0].amount).toBe(62);
  });

  it('渡してきた仲間には渡し返せない', () => {
    let s = passBaton(toOneMore(), 'akari');
    s.allies[1].skills = [SKILLS.fire];
    s = applyExtra(s, fire('enemy1'));
    expect(s.phase).toBe('extra');
    expect(batonTargets(s).map((a) => a.uid)).toEqual(['mio']);
  });

  it('HPが0の仲間には渡せない', () => {
    const s = toOneMore();
    s.allies[2].hp = 0;
    expect(() => passBaton(s, 'mio')).toThrow();
  });

  it('バトンでは手札を引かない（引くのはワンモアになった時だけ）', () => {
    const s = toOneMore();
    expect(passBaton(s, 'akari').hand).toHaveLength(s.hand.length);
  });
});

