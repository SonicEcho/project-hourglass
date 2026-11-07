import { createLeapBattle, leapMoveOf, leapPlanError, living, nextRandom, runLeapRound, usedCards, type LeapBattleDef, type LeapPlanStep, type LeapRules, type LeapState } from '../core';

// 試し：組んで跳ねる戦闘（段階157）の自動対戦。手応えの目安を測るためだけに使う。
// random：でたらめ。smart：でたらめな計画をたくさん作って1ラウンド動かし、一番よい物を選ぶ。
// simple：smart と同じだが、添える札・砂時計・見切りを使わない（組まずに単体で戦う人の目安）

export type LeapPolicy = 'random' | 'smart' | 'simple';

/** でたらめな計画（生きている仲間を、でたらめな順で） */
export function randomLeapPlan(s: LeapState, pick: (n: number) => number, simple = false): LeapPlanStep[] {
  const order = living(s.allies).map((a) => a.uid);
  for (let i = order.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const plan: LeapPlanStep[] = [];
  for (const ally of order) {
    const me = s.allies.find((a) => a.uid === ally)!;
    const used = usedCards(plan);
    const sources: LeapPlanStep['source'][] = [];
    for (const mv of s.def.allies.find((a) => a.id === me.defId)?.moves ?? []) sources.push({ kind: 'move', moveId: mv.id });
    s.hand.forEach((id, index) => {
      const c = s.def.cards[id];
      if (used.has(index) || c.kind === 'addon') return;
      if (simple && (c.kind === 'hourglass' || c.kind === 'counter')) return;
      sources.push({ kind: 'card', index });
    });
    const source = sources[pick(sources.length)];
    const move = leapMoveOf(s, { ally, source })!;
    const foes = living(s.enemies);
    const target = move.target === 'enemy' ? foes[pick(foes.length)]?.uid : undefined;
    const addons: number[] = [];
    if (!simple) {
      s.hand.forEach((id, index) => {
        if (addons.length >= s.rules.addonMax || used.has(index) || (source.kind === 'card' && source.index === index)) return;
        if (s.def.cards[id].kind === 'addon' && pick(2) === 0) addons.push(index);
      });
    }
    const step = { ally, source, target, addons };
    if (leapPlanError(s, plan, step) === null) plan.push(step);
  }
  return plan;
}

function score(before: LeapState, after: LeapState): number {
  if (after.outcome === 'lose') return -1e6;
  if (after.outcome === 'win') return 1e6 - after.round * 1000;
  const hp = (l: LeapState['allies']) => l.reduce((a, u) => a + u.hp, 0);
  const kills = living(before.enemies).length - living(after.enemies).length;
  const deaths = living(before.allies).length - living(after.allies).length;
  // 砂と止まりにも少し値打ち（次のラウンドに効くため）
  const setup = after.enemies.reduce((a, e) => a + (e.hp > 0 ? e.sand * 3 + (e.stopped ? 20 : 0) + (e.wet ? 8 : 0) : 0), 0);
  return (hp(before.enemies) - hp(after.enemies)) * 2 + kills * 150 - (hp(before.allies) - hp(after.allies)) - deaths * 300 + setup;
}

export function smartLeapPlan(s: LeapState, pick: (n: number) => number, tries = 400, simple = false): LeapPlanStep[] {
  let best: LeapPlanStep[] = [];
  let bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    const plan = randomLeapPlan(s, pick, simple);
    const v = score(s, runLeapRound(s, plan).state);
    if (v > bestScore) {
      bestScore = v;
      best = plan;
    }
  }
  return best;
}

export interface LeapAutoResult {
  outcome: LeapState['outcome'];
  rounds: number;
  bestHit: number;
  used: Record<string, number>;
}

/** 1戦を最後まで */
export function autoLeapBattle(def: LeapBattleDef, rules: LeapRules, seed: number, policy: LeapPolicy): LeapAutoResult {
  let r = (seed ^ 0x9e3779b9) >>> 0;
  const pick = (n: number): number => {
    const [v, next] = nextRandom(r);
    r = next;
    return Math.floor(v * n);
  };
  let s = createLeapBattle(def, rules, seed);
  const used: Record<string, number> = {};
  while (s.outcome === 'ongoing') {
    const plan = policy === 'random' ? randomLeapPlan(s, pick) : smartLeapPlan(s, pick, 400, policy === 'simple');
    for (const p of plan) {
      const mv = leapMoveOf(s, p);
      if (mv) used[mv.name] = (used[mv.name] ?? 0) + 1;
      for (const a of p.addons) used[s.def.cards[s.hand[a]].name] = (used[s.def.cards[s.hand[a]].name] ?? 0) + 1;
    }
    s = runLeapRound(s, plan).state;
  }
  return { outcome: s.outcome, rounds: s.round, bestHit: s.bestHit, used };
}
