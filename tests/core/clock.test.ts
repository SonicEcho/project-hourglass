import { describe, expect, it } from 'vitest';
import {
  clockActionError,
  clockAllyAct,
  clockEnemyAct,
  clockMoveOf,
  createClockBattle,
  currentActor,
  enemyIntent,
  type ClockAction,
  type ClockBattleDef,
  type ClockState,
  upcomingTurns,
} from '../../src/core';
import { CLOCK_RULES, CLOCK_TRIALS } from '../../src/data';

// 試し：文字盤の戦闘（段階154）
const T3 = CLOCK_TRIALS[0];

/** 仲間の番まで、敵を動かす */
function toAlly(s: ClockState): ClockState {
  let x = s;
  for (let i = 0; i < 50 && x.outcome === 'ongoing' && currentActor(x)?.side === 'enemy'; i++) x = clockEnemyAct(x);
  return x;
}

describe('文字盤の戦闘（段階154）', () => {
  it('一番早い次の番の者から動き、動いた後の次の番は重さ × 基準の速さ ÷ 速さだけ先', () => {
    let s = toAlly(createClockBattle(T3, CLOCK_RULES, 1));
    const actor = currentActor(s)!;
    expect(actor.side).toBe('ally');
    const t = s.time;
    const target = s.enemies[0].uid;
    s = clockAllyAct(s, { kind: 'move', moveId: 'attack', target });
    const after = [...s.allies, ...s.reserve].find((u) => u.uid === actor.uid)!;
    const attackHours = T3.allies[0].moves.find((m) => m.id === 'attack')!.hours;
    expect(after.next).toBeCloseTo(t + attackHours * (CLOCK_RULES.baseSpd / actor.spd));
    // 今動く者は、次の番が一番早い
    const turns = upcomingTurns(s);
    expect(turns[0].uid).toBe(currentActor(s)!.uid);
  });

  it('弱点を突くと、敵の次の番を押し出し、弱点が見つかる。押し出された敵は、動くまでもう押し出されない', () => {
    let s = toAlly(createClockBattle(T3, CLOCK_RULES, 2));
    const cuckoo = s.enemies.find((u) => u.defId === 'cuckooNoise')!;
    const before = cuckoo.next;
    // 早瀬のサンダーを使えるように、早瀬の番を作る（ほかの仲間の番なら、早瀬と入れ替えずに、サンダーボルトの札を使う）
    const actor = currentActor(s)!;
    const card = s.hand.indexOf('thunderChip');
    const action: ClockAction = actor.defId === 'hayase' ? { kind: 'move', moveId: 'thunder', target: cuckoo.uid } : card >= 0 ? { kind: 'card', index: card, target: cuckoo.uid } : { kind: 'move', moveId: 'attack', target: cuckoo.uid };
    s = clockAllyAct(s, action);
    const c2 = s.enemies.find((u) => u.uid === cuckoo.uid)!;
    if (clockMoveOf(s, actor, action) === null || action.kind === 'move' && action.moveId === 'attack') return;
    expect(c2.next).toBeCloseTo(before + CLOCK_RULES.push);
    expect(s.revealed[cuckoo.uid]).toContain('thunder');
    expect(s.log.some((e) => e.type === 'push')).toBe(true);
  });

  it('敵は、技の属性が弱点の仲間を先にねらう（雷の電波は、雷が弱点のあかりに）', () => {
    const def: ClockBattleDef = { ...T3, enemies: [{ ...T3.enemies[2], pattern: [T3.enemies[2].pattern[1]] }] };
    let s = createClockBattle(def, CLOCK_RULES, 3);
    // 仲間はみな防御して、敵の番を待つ
    for (let i = 0; i < 10 && currentActor(s)?.side === 'ally'; i++) s = clockAllyAct(s, { kind: 'guard' });
    s = clockEnemyAct(s);
    const hit = s.log.find((e) => e.type === 'damage');
    expect(hit && 'to' in hit ? hit.to : '').toBe('akari');
  });

  it('バトンタッチで控えと交代すると、入った仲間がそのまま今の番を使い、交代の分だけ次の番が遅れる。同じ番に2回は交代しない', () => {
    let s = toAlly(createClockBattle(T3, CLOCK_RULES, 4));
    const out = currentActor(s)!;
    const t = s.time;
    s = clockAllyAct(s, { kind: 'swap', reserve: 'mio' });
    expect(currentActor(s)!.uid).toBe('mio');
    expect(s.reserve.map((u) => u.uid)).toContain(out.uid);
    expect(clockActionError(s, { kind: 'swap', reserve: 'sayoko' })).not.toBeNull();
    s = clockAllyAct(s, { kind: 'move', moveId: 'attack', target: s.enemies[0].uid });
    const mio = s.allies.find((u) => u.uid === 'mio')!;
    const attackHours = T3.allies[0].moves.find((m) => m.id === 'attack')!.hours;
    expect(mio.next).toBeCloseTo(t + (attackHours + CLOCK_RULES.swapHours) * (CLOCK_RULES.baseSpd / mio.spd));
  });

  it('時刻が刻限を越えると、刻限の数が増え、次の刻限はその先', () => {
    let s = createClockBattle(T3, CLOCK_RULES, 5);
    for (let i = 0; i < 200 && s.outcome === 'ongoing' && s.phase === 0; i++) {
      s = currentActor(s)!.side === 'enemy' ? clockEnemyAct(s) : clockAllyAct(s, { kind: 'guard' });
    }
    expect(s.phase).toBeGreaterThanOrEqual(1);
    expect(s.kokugen).toBe(CLOCK_RULES.kokugenEvery * (s.phase + 1));
  });

  it('紙風船は、たたかれるたびにふくらみ、ふくらみきると破裂（全体）して消える', () => {
    const balloon = CLOCK_TRIALS[1].enemies[0];
    let s = createClockBattle({ ...T3, enemies: [balloon, T3.enemies[0]] }, CLOCK_RULES, 6);
    const b = s.enemies[0];
    b.swell = balloon.swellMax!;
    expect(enemyIntent(s, b).id).toBe('burst');
    b.next = -1;
    s.time = -1;
    s = clockEnemyAct(s);
    expect(s.enemies[0].hp).toBe(0);
    expect(s.log.filter((e) => e.type === 'damage').length).toBe(3);
  });
});

/** 自動で1戦（でたらめ／考える）。勝ったか */
function play(def: ClockBattleDef, seed: number, smart: boolean): boolean {
  let s = createClockBattle(def, CLOCK_RULES, seed);
  let r = seed;
  const pick = <T,>(a: T[]): T => {
    r = (r * 1103515245 + 12345) >>> 0;
    return a[r % a.length];
  };
  for (let i = 0; i < 400 && s.outcome === 'ongoing'; i++) {
    const actor = currentActor(s)!;
    if (actor.side === 'enemy') {
      s = clockEnemyAct(s);
      continue;
    }
    const foes = s.enemies.filter((u) => u.hp > 0);
    const moves = [...s.def.allies, ...s.def.reserve].find((d) => d.id === actor.defId)!.moves;
    const options: ClockAction[] = [
      ...moves.map((m) => ({ kind: 'move' as const, moveId: m.id, target: m.effect.kind === 'heal' ? actor.uid : pick(foes).uid })),
      ...s.hand.map((c, index) => {
        const e = s.def.cards[c].effect;
        return { kind: 'card' as const, index, target: e.kind === 'heal' || e.kind === 'hasten' ? actor.uid : pick(foes).uid };
      }),
    ].filter((a) => clockActionError(s, a) === null);
    if (!smart) {
      s = clockAllyAct(s, pick(options));
      continue;
    }
    // 考える方針：次の敵の技が自分の弱点なら交代、HP が4割を切った仲間がいれば回復、弱点を突ける行動を先に
    const nextFoe = upcomingTurns(s).map((t) => s.enemies.find((u) => u.uid === t.uid)).find((u) => u && u.hp > 0);
    const threat = nextFoe ? enemyIntent(s, nextFoe).element : undefined;
    const spare = s.reserve.find((u) => u.hp > 0 && (!threat || !u.weak.includes(threat)));
    if (!s.swapped && threat && actor.weak.includes(threat) && spare) {
      s = clockAllyAct(s, { kind: 'swap', reserve: spare.uid });
      continue;
    }
    const hurt = s.allies.filter((u) => u.hp > 0 && u.hp < u.maxHp * 0.4).sort((a, b) => a.hp - b.hp)[0];
    const heal = options.find((a) => clockMoveOf(s, actor, a)?.effect.kind === 'heal');
    if (hurt && heal) {
      s = clockAllyAct(s, { ...heal, target: hurt.uid } as ClockAction);
      continue;
    }
    let best: ClockAction | null = null;
    let bestScore = -1;
    for (const a of options) {
      const m = clockMoveOf(s, actor, a);
      if (!m || m.effect.kind !== 'damage') continue;
      for (const f of foes) {
        const e = m.effect;
        const weak = f.weak.includes(e.element) ? 2 : f.resist.includes(e.element) ? 0.4 : 1;
        const score = (e.power * weak * (e.all ? foes.length : 1)) / m.hours;
        if (score > bestScore) {
          bestScore = score;
          best = { ...a, target: f.uid } as ClockAction;
        }
      }
    }
    s = clockAllyAct(s, best ?? options[0]);
  }
  return s.outcome === 'win';
}

describe('文字盤の戦闘の手応えの目安（段階154。自動で 60 戦）', () => {
  for (const def of CLOCK_TRIALS) {
    it(`${def.name}：考えればほぼ勝ち、でたらめだとたまに負ける`, () => {
      const rate = (smart: boolean) => Array.from({ length: 60 }, (_, i) => play(def, 1000 + i, smart)).filter(Boolean).length / 60;
      const smart = rate(true);
      const random = rate(false);
      console.log(`${def.id}: 考える ${Math.round(smart * 100)}% でたらめ ${Math.round(random * 100)}%`);
      expect(smart).toBeGreaterThanOrEqual(0.85);
      expect(random).toBeLessThan(0.95);
    });
  }
});
