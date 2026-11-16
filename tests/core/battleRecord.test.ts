import { describe, expect, it } from 'vitest';
import type { ArmoryState, ChainBattleDef, ChainFrame, ChainState } from '../../src/core';
import { battleRecord, battleRecordKey, brokeAllParts, createArmory, createChainBattle, evolutionChecks, getEvolveError, recordBattleStyle, runChainRound, tallyFrames } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS_16, WEAPON_DATA } from '../../src/data';

// 戦い方の記録と武器の寄り道④（段階222。docs/milestones/M3_detours.md）
const BASE = CHAIN_TRIALS_16[0];

function state(): ChainState {
  return createChainBattle({ ...BASE, variants: undefined } as ChainBattleDef, CHAIN_RULES, 7);
}

const frame = (s: ChainState, uid: string, events: ChainFrame['events']): ChainFrame => ({ order: 1, key: 'a0', at: 1, uid, name: '', events, state: s });

describe('戦い方の記録（段階222）', () => {
  it('コマから、仲間ごとの押した数・空振り・倒れたかを足す', () => {
    const s = state();
    const [a, b] = s.allies;
    const e = s.enemies[0];
    const t1 = tallyFrames(undefined, [frame(s, a.uid, [{ type: 'push', uid: e.uid, by: 2, out: false, moved: true }, { type: 'push', uid: e.uid, by: 3, out: false, moved: false }])], s);
    expect(t1).toEqual({ push: { [a.defId]: 2 }, whiffs: 0, allyFell: false });
    const t2 = tallyFrames(
      t1,
      [
        frame(s, b.uid, [{ type: 'push', uid: e.uid, by: 1, out: true, moved: true }]),
        frame(s, e.uid, [{ type: 'cancel', uid: e.uid, reason: 'down' }]),
        frame(s, a.uid, [{ type: 'cancel', uid: a.uid, reason: 'down' }]),
        frame(s, e.uid, [{ type: 'defeat', uid: b.uid }]),
      ],
      s,
    );
    expect(t2.push).toEqual({ [a.defId]: 2, [b.defId]: 1 });
    // 押し出し1つと、敵のダウンの空振り1つ（仲間の打ち消しは数えない）
    expect(t2.whiffs).toBe(2);
    expect(t2.allyFell).toBe(true);
  });

  it('勝った戦闘だけ、出ていた仲間ごとに足す（回数は足し、一番多い記録は上書き）', () => {
    const s = state();
    const id = s.allies[0].defId;
    s.tally = { push: { [id]: 4 }, whiffs: 2, allyFell: false };
    expect(recordBattleStyle({}, { ...s, outcome: 'lose' })).toEqual({});
    let vars = recordBattleStyle({}, { ...s, outcome: 'win' });
    expect(battleRecord(vars, 'noFall', id)).toBe(1);
    expect(battleRecord(vars, 'pushMax', id)).toBe(4);
    expect(battleRecord(vars, 'whiffMax', id)).toBe(2);
    expect(battleRecord(vars, 'bossParts', id)).toBe(0);
    vars = recordBattleStyle(vars, { ...s, outcome: 'win', tally: { push: { [id]: 1 }, whiffs: 5, allyFell: true } });
    expect(battleRecord(vars, 'noFall', id)).toBe(1);
    expect(battleRecord(vars, 'pushMax', id)).toBe(4);
    expect(battleRecord(vars, 'whiffMax', id)).toBe(5);
  });

  it('ラウンドを進めると、記録が state に残る', () => {
    const r = runChainRound(state(), []);
    expect(r.state.tally).toEqual({ push: {}, whiffs: expect.any(Number), allyFell: expect.any(Boolean) });
  });

  it('部位を全部壊したか：部位のない戦闘はならない。部位が全部 HP 0 ならなる（本体が先に倒れて消えた部位は数えない）', () => {
    const s = state();
    expect(brokeAllParts(s)).toBe(false);
    const partId = s.enemies[0].defId;
    const withPart: ChainState = { ...s, def: { ...s.def, enemies: s.def.enemies.map((e) => (e.id === partId ? { ...e, part: { of: 'body' } } : e)) } };
    expect(brokeAllParts(withPart)).toBe(false);
    const broken: ChainState = { ...withPart, enemies: withPart.enemies.map((e) => (e.defId === partId ? { ...e, hp: 0 } : e)) };
    expect(brokeAllParts(broken)).toBe(true);
    expect(brokeAllParts({ ...broken, enemies: broken.enemies.map((e) => (e.defId === partId ? { ...e, gone: true } : e)) })).toBe(false);
  });
});

describe('武器の寄り道④は戦い方の記録で開く（段階222）', () => {
  it('雪だるまの杖：あかりが出ていて、誰も倒れずに10回勝つ', () => {
    const base = createArmory(WEAPON_DATA);
    const a: ArmoryState = { ...base, weapons: { ...base.weapons, akari: { ...base.weapons.akari, exp: 99999, path: ['healingRod', 'mercyRod', 'blessRod'].map((id) => ({ id, style: 0 })) } } };
    const evo = WEAPON_DATA.weapons.prayerRod.evolutions.find((e) => e.id === 'snowmanRod')!;
    expect(evo.detour && !evo.sealed).toBe(true);
    expect(evolutionChecks(WEAPON_DATA, a.weapons.akari, evo, {}, { [battleRecordKey('noFall', 'akari')]: '9' }).map((c) => c.ok)).toEqual([true, false]);
    // ほかの仲間の記録では開かない
    expect(getEvolveError(WEAPON_DATA, a, 'akari', 'snowmanRod', 0, { [battleRecordKey('noFall', 'hero')]: '10' })).toBe('conditions are not met');
    expect(getEvolveError(WEAPON_DATA, a, 'akari', 'snowmanRod', 0, { [battleRecordKey('noFall', 'akari')]: '10' })).toBeNull();
  });

  it('5人とも、寄り道④が作ってあり、条件は戦い方の記録だけ', () => {
    for (const w of Object.values(WEAPON_DATA.weapons)) {
      const four = w.evolutions.filter((e) => e.detour && e.conditions.some((c) => c.kind === 'record'));
      expect(four, w.id).toHaveLength(1);
      expect(four[0].sealed, w.id).toBeFalsy();
      expect(four[0].conditions.every((c) => c.kind === 'record'), w.id).toBe(true);
    }
  });
});
