import { describe, expect, it } from 'vitest';
import type { BattleState } from '../src/core';
import { createBattle } from '../src/core';
import { AREA_BATTLES, CHAPTER1_LINEUP, createCampaignSetup, PARTY } from '../src/data';
import { areaBattleOrder } from '../src/sim/autoArea';
import { chooseByTactic, isTactic, planByTactic, tacticPlay, TACTICS, type Tactic } from '../src/sim/tactics';
import { candidates } from '../src/sim/autoBattle';
import { availableHand, getPlanError, lineupMembers, livingAllies } from '../src/core';

// 雑魚戦のオートの作戦（段階29）

const members = lineupMembers(PARTY, CHAPTER1_LINEUP);
const storms = areaBattleOrder().filter((b) => !b.boss);
const start = (seed: number, def = storms[0]): BattleState => ({ ...createBattle(createCampaignSetup(def, seed, members)), linkGauge: 100 });

/** 戦闘中に使われた行動の id（仲間のもの） */
function allyActions(s: BattleState): string[] {
  const allies = new Set(s.allies.map((a) => a.uid));
  return s.log.flatMap((e) => (e.type === 'action' && e.actorIds.some((id) => allies.has(id)) ? [e.actionId] : []));
}

describe('オートの作戦（段階29）', () => {
  it('作戦は4つ。id で見分けられる', () => {
    expect(TACTICS.map((t) => t.id)).toEqual(['auto', 'weak', 'defend', 'noMp']);
    expect(isTactic('weak')).toBe(true);
    expect(isTactic('x')).toBe(false);
  });

  it.each(TACTICS.map((t) => t.id))('「%s」で 1-1 の雑魚戦を最後まで戦える。連携技は使わない（ゲージは満タンのまま）', (tactic) => {
    for (const def of storms) {
      const s = tacticPlay(start(3, def), tactic as Tactic);
      expect(s.phase).toBe('ended');
      expect(allyActions(s).some((id) => s.links.some((l) => l.id === id))).toBe(false);
    }
  });

  it('同じ状態なら同じ結果になる', () => {
    expect(tacticPlay(start(7), 'auto')).toEqual(tacticPlay(start(7), 'auto'));
  });

  it('「MPを使わない」は、MPのいる魔法・スキルを使わない', () => {
    for (const seed of [1, 2, 3]) {
      const s = tacticPlay(start(seed), 'noMp');
      const mpSkills = new Set(members.flatMap((c) => c.skills.filter((k) => k.mp > 0).map((k) => k.id)));
      expect(allyActions(s).filter((id) => mpSkills.has(id))).toEqual([]);
    }
  });

  it('おまかせは、HPが4割を切った仲間がいれば回復を選ぶ。弱点を突くは回復しない', () => {
    const s0 = start(1);
    const hurt = { ...s0, allies: s0.allies.map((a) => ({ ...a, hp: Math.floor(a.maxHp * 0.3) })) };
    const healing = (tactic: Tactic) =>
      livingAllies(hurt).filter((a) => {
        const valid = candidates(hurt, availableHand(hurt, [a.uid]), a.uid).filter((x) => getPlanError(hurt, a.uid, x) === null);
        const x = chooseByTactic(hurt, a.uid, valid, tactic);
        const def = x?.type === 'skill' ? a.skills.find((k) => k.id === x.skillId) : x?.type === 'card' ? hurt.hand.find((c) => c.uid === x.cardUid)?.card : undefined;
        return !!def?.effects.some((e) => e.kind === 'heal');
      }).length;
    expect(healing('auto')).toBeGreaterThan(0);
    expect(healing('weak')).toBe(0);
  });

  it('守りを固めるは、敵が力をためている時に必ず防御する', () => {
    const s0 = start(1);
    const charging = { ...s0, enemies: s0.enemies.map((e, i) => (i === 0 ? { ...e, charging: 'x' } : e)) };
    const p = planByTactic(charging, 'defend');
    expect(p.plans.length).toBe(livingAllies(charging).length);
    for (const plan of p.plans) expect(plan.action.type).toBe('guard');
  });

  it('ボス戦のデータには boss の印がある（オートはボス戦で使えない）', () => {
    expect(AREA_BATTLES[areaBattleOrder().at(-1)!.id].boss).toBeTruthy();
    expect(storms.every((b) => !b.boss)).toBe(true);
  });
});
