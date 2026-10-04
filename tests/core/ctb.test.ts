import { describe, expect, it } from 'vitest';
import {
  applyAction,
  compareTurnOrder,
  createBattle,
  ctDelay,
  getTurnForecast,
  previewAction,
  startNextTurn,
} from '../../src/core';
import { SKILLS } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

describe('待ち時間', () => {
  it('ceil(100 ÷ 速さ × 重さ)', () => {
    expect(ctDelay(12, 1.0)).toBe(9);
    expect(ctDelay(10, 1.0)).toBe(10);
    expect(ctDelay(10, 1.2)).toBe(12);
    expect(ctDelay(10, 1.1)).toBe(11);
    expect(ctDelay(16, 0.5)).toBe(4);
    expect(ctDelay(10, 0.6)).toBe(6);
  });

  it('戦闘開始時は重さ1.0の待ち時間から始まる', () => {
    const s = createBattle(setup({ allies: [ally('hero', { spd: 12 })], enemies: [enemy('e', { spd: 8 })] }));
    expect(s.allies[0].ct).toBe(9);
    expect(s.enemies[0].ct).toBe(13);
  });

  it('行動すると、行動の重さに応じた待ち時間が加算される', () => {
    let s = startNextTurn(createBattle(setup({ allies: [ally('hero', { spd: 10 })] })));
    expect(s.turn?.actorId).toBe('hero');
    expect(s.allies[0].ct).toBe(10);
    s = applyAction(s, { type: 'guard' }); // 重さ0.6
    expect(s.allies[0].ct).toBe(16);
    const ev = eventsOf(s, 'action')[0];
    expect(ev.ct).toEqual([{ unitId: 'hero', before: 10, after: 16 }]);
  });
});

describe('行動順の優先', () => {
  it('CTが小さい者が先', () => {
    expect(compareTurnOrder({ id: 'a', side: 'enemy', spd: 1, ct: 5 }, { id: 'b', side: 'ally', spd: 99, ct: 6 })).toBeLessThan(0);
  });

  it('同じCTなら味方優先', () => {
    expect(compareTurnOrder({ id: 'a', side: 'ally', spd: 1, ct: 10 }, { id: 'b', side: 'enemy', spd: 99, ct: 10 })).toBeLessThan(0);
  });

  it('同じCTで同じ陣営なら速さの高い順', () => {
    expect(compareTurnOrder({ id: 'a', side: 'ally', spd: 20, ct: 10 }, { id: 'b', side: 'ally', spd: 10, ct: 10 })).toBeLessThan(0);
  });

  it('戦闘でも、同じCTなら味方が先に手番を得る', () => {
    // 速さ10の味方と速さ10の敵はどちらも ct 10
    const s = startNextTurn(createBattle(setup({ allies: [ally('hero', { spd: 10 })], enemies: [enemy('e', { spd: 10 })] })));
    expect(s.turn?.actorId).toBe('hero');
  });
});

describe('行動順の予測', () => {
  it('8手番先まで予測する', () => {
    // 味方: 速さ10 (ct10)、敵: 速さ20 (ct5)
    const s = createBattle(setup({ allies: [ally('hero', { spd: 10 })], enemies: [enemy('e', { spd: 20 })] }));
    const ids = getTurnForecast(s).map((e) => e.id);
    expect(ids).toEqual(['enemy0', 'hero', 'enemy0', 'enemy0', 'hero', 'enemy0', 'enemy0', 'hero']);
  });

  it('手番中は先頭が今の行動者で、選んだ行動の重さで自分の次の位置が変わる', () => {
    const s = startNextTurn(
      createBattle(setup({ allies: [ally('hero', { spd: 10 })], enemies: [enemy('e', { spd: 10 })] })),
    );
    expect(getTurnForecast(s)[0].id).toBe('hero');
    // 軽い行動(防御0.6): hero 16, enemy 10 → enemy, hero
    expect(getTurnForecast(s, { pending: [{ id: 'hero', weight: 0.6 }] }).map((e) => e.id).slice(0, 3)).toEqual([
      'hero',
      'enemy0',
      'hero',
    ]);
    // 重い行動(2.5): hero 35 → enemy 10, 20, 30 の後
    expect(getTurnForecast(s, { pending: [{ id: 'hero', weight: 2.5 }] }).map((e) => e.id).slice(0, 5)).toEqual([
      'hero',
      'enemy0',
      'enemy0',
      'enemy0',
      'hero',
    ]);
  });

  it('プレビューで行動後の自分の次の位置がわかる', () => {
    // 味方: 速さ20 (ct5)、敵: 速さ10 (ct10)
    const s = startNextTurn(
      createBattle(
        setup({ allies: [ally('hero', { spd: 20 }, [SKILLS.breakSlash])], enemies: [enemy('e', { spd: 10 })] }),
      ),
    );
    // 防御(0.6): 5+3=8 → 敵より先
    expect(previewAction(s, { type: 'guard' }).nextTurnIndex).toBe(1);
    // ブレイクスラッシュ(1.2): 5+6=11 → 敵(10)の後
    expect(
      previewAction(s, { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0' } }).nextTurnIndex,
    ).toBe(2);
  });
});
