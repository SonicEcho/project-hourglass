import { availableLinks, chainGrade, chainMoveOf, chainPlanError, createChainBattle, nextRandom, runChainRound, stepCards, takeShutter, type ChainBattleDef, type ChainPlanStep, type ChainRules, type ChainState } from '../core';

// 試し：並べてつなぐ戦闘（段階156）の自動対戦。手応えの目安を測るためだけに使う。
// random：並べる順・行動・相手をでたらめに選ぶ。smart：でたらめな計画をたくさん作って、1ラウンド先まで動かし、一番よい物を選ぶ（読み切る人の目安）。
// deep（調整15）：smart の上位の計画ごとに、次のラウンドの計画も探して、2ラウンド先までで一番よい物を選ぶ（数ラウンド続くサポートの値打ちを測るため）

/** 計画の続きに置ける行（仲間1人分の候補。同じ札は1枚にまとめる） */
export function chainCandidates(s: ChainState, plan: ChainPlanStep[], ally: string): ChainPlanStep[] {
  const out: ChainPlanStep[] = [];
  const seen = new Set<string>();
  const sources: ChainPlanStep['source'][] = [];
  s.hand.forEach((id, index) => {
    if (seen.has(id)) return;
    // 添える札は、行動としては置けない（調整17）
    if (s.def.cards[id]?.effect.kind === 'addon') return;
    if (plan.some((p) => p.source.kind === 'card' && p.source.index === index)) return;
    seen.add(id);
    sources.push({ kind: 'card', index });
  });
  const me = s.allies.find((a) => a.uid === ally);
  const def = s.def.allies.find((a) => a.id === me?.defId);
  for (const m of def?.moves ?? []) sources.push({ kind: 'move', moveId: m.id });
  for (const x of availableLinks(s, plan)) if (x.link.members.length === 0 || x.link.members[0] === me?.defId) sources.push({ kind: 'link', linkId: x.link.id, cards: x.cards });
  for (const source of sources) {
    const base: ChainPlanStep = { ally, source };
    const move = chainMoveOf(s, base);
    if (!move) continue;
    const targets = move.target === 'enemy' ? s.enemies.filter((e) => e.hp > 0).map((e) => e.uid) : [undefined];
    for (const target of targets) {
      const step = { ...base, target };
      if (chainPlanError(s, plan, step) === null) out.push(step);
    }
  }
  return out;
}

/** でたらめな計画（生きている仲間を、でたらめな順で、置ける限り）。1人1回をやめた試しでは、置ける仲間をでたらめに選び続ける（時々、途中でやめる） */
/** 置いた行に、でたらめに添える札を0〜2枚（調整17。置けない組み合わせなら添えない） */
function withAddons(s: ChainState, plan: ChainPlanStep[], step: ChainPlanStep, pick: (n: number) => number): ChainPlanStep {
  const used = new Set(plan.flatMap(stepCards).concat(stepCards(step)));
  const free = s.hand.map((id, i) => ({ id, i })).filter((x) => !used.has(x.i) && s.def.cards[x.id]?.effect.kind === 'addon').map((x) => x.i);
  if (free.length === 0) return step;
  const n = pick(s.rules.addonMax + 1);
  const chosen: number[] = [];
  while (chosen.length < n && free.length) chosen.push(free.splice(pick(free.length), 1)[0]);
  const next = { ...step, addons: chosen };
  return chosen.length && chainPlanError(s, plan, next) === null ? next : step;
}

export function randomChainPlan(s: ChainState, pick: (n: number) => number): ChainPlanStep[] {
  const plan: ChainPlanStep[] = [];
  if (s.def.multiAct) {
    for (let k = 0; k < 12; k++) {
      const options = s.allies.filter((a) => a.hp > 0).map((a) => chainCandidates(s, plan, a.uid)).filter((c) => c.length > 0);
      if (options.length === 0 || (plan.length > 0 && pick(10) === 0)) break;
      const c = options[pick(options.length)];
      plan.push(withAddons(s, plan, c[pick(c.length)], pick));
    }
    return plan;
  }
  const order = s.allies.filter((a) => a.hp > 0).map((a) => a.uid);
  for (let i = order.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (const ally of order) {
    const c = chainCandidates(s, plan, ally);
    if (c.length === 0) continue;
    plan.push(withAddons(s, plan, c[pick(c.length)], pick));
  }
  return plan;
}

/** 1ラウンド動かした後の良さ（シャッター・勝ち > ダウン・与えたダメージ > 受けたダメージ） */
function score(before: ChainState, after: ChainState): number {
  if (after.outcome === 'lose') return -1e6;
  // 早く決着するほど良い（評価と報酬が上がるため。調整6）
  if (after.outcome === 'win') return 1e6 - (after.finishTime ?? 0) * 1000;
  const foeHp = (s: ChainState) => s.enemies.reduce((a, e) => a + e.hp, 0);
  const allyHp = (s: ChainState) => s.allies.reduce((a, u) => a + u.hp, 0);
  const kills = after.enemies.filter((e) => e.hp <= 0).length - before.enemies.filter((e) => e.hp <= 0).length;
  const deadAllies = after.allies.filter((a) => a.hp <= 0).length;
  // 腕時計を守る（段階179）：腕時計の HP の増減を重く見る。残りが少ない時は、次のラウンドにそらせること（ねじを巻いた）も買う
  const watch = before.def.watch ? ((after.watch ?? 0) - (before.watch ?? 0)) * 4 + (after.intents.some((i) => i.eased) && (after.watch ?? 0) < before.def.watch.hp * 0.6 ? 40 : 0) : 0;
  // くり返しを越える（段階182）：戻されたラウンドの削りは点にならない（HP が戻るため）。花火を1つ上げるのを重く見る
  const fire = ((after.fireworks ?? 0) - (before.fireworks ?? 0)) * 800;
  return (foeHp(before) - foeHp(after)) * 2 + kills * 150 - (allyHp(before) - allyHp(after)) - deadAllies * 300 + watch + fire;
}

/** 1ラウンド動かす（シャッターが光ったら押す。調整15：シャッターは総攻撃なので、押した後も続くことがある） */
function step(s: ChainState, plan: ChainPlanStep[]): ChainState {
  const r = runChainRound(s, plan).state;
  return r.shutter ? takeShutter(r) : r;
}

/** 1ラウンド先までで一番よい計画（と、その後の状態と点） */
function bestOne(s: ChainState, pick: (n: number) => number, tries: number, keep = 1): { plan: ChainPlanStep[]; after: ChainState; v: number }[] {
  const out: { plan: ChainPlanStep[]; after: ChainState; v: number }[] = [];
  for (let k = 0; k < tries; k++) {
    const plan = randomChainPlan(s, pick);
    const after = step(s, plan);
    out.push({ plan, after, v: score(s, after) });
  }
  return out.sort((a, b) => b.v - a.v).slice(0, keep);
}

export function smartChainPlan(s: ChainState, pick: (n: number) => number, tries = 600): ChainPlanStep[] {
  return bestOne(s, pick, tries)[0]?.plan ?? [];
}

/** 2ラウンド先まで読む（調整15）。1ラウンド目の上位 top 個それぞれに、次のラウンドの計画を inner 個試す */
export function deepChainPlan(s: ChainState, pick: (n: number) => number, tries = 600, top = 12, inner = 120): ChainPlanStep[] {
  let best: ChainPlanStep[] = [];
  let bestScore = -Infinity;
  for (const c of bestOne(s, pick, tries, top)) {
    let v = c.v;
    if (c.after.outcome === 'ongoing') {
      const next = bestOne(c.after, pick, inner)[0];
      if (next) v = score(s, next.after);
    }
    if (v > bestScore) {
      bestScore = v;
      best = c.plan;
    }
  }
  return best;
}

export type ChainPolicy = 'random' | 'smart' | 'deep';
export const planBy = (policy: ChainPolicy, s: ChainState, pick: (n: number) => number): ChainPlanStep[] =>
  policy === 'deep' ? deepChainPlan(s, pick) : policy === 'smart' ? smartChainPlan(s, pick) : randomChainPlan(s, pick);

export interface ChainAutoResult {
  outcome: ChainState['outcome'];
  finish?: ChainState['finish'];
  rounds: number;
}

/** 測った数（段階156の調整5。考える方針が何を使って勝っているかを見る） */
export interface ChainStats {
  battles: number;
  wins: number;
  rounds: number;
  shutters: number;
  /** 1ラウンド目にシャッターで決着した数 */
  firstRoundShutters: number;
  /** 共鳴が起きた回数・連携技を使った回数・弱点でダウンさせた回数 */
  resonances: number;
  links: number;
  weakDowns: number;
  /** 使った札・技（名前ごとの回数） */
  used: Record<string, number>;
  /** 評価の段ごとの勝ち数（調整6） */
  grades: Record<string, number>;
  /** 決着した時刻の合計（勝った戦闘の合計） */
  finishTime: number;
  /** 押すで、敵の予定をラウンドの外へ押し出して止めた回数・押した回数 */
  pushOuts: number;
  pushes: number;
  /** 敵の行動をダウンで止めた回数 */
  interrupts: number;
  /** シャッター（総攻撃）を撮った回数（調整15。決着しなかった分も数える） */
  shutterShots: number;
}

/** 1つの組み合わせを runs 回戦い、使った札・技と勝ち方を数える */
export function measureChain(def: ChainBattleDef, rules: ChainRules, runs: number, policy: ChainPolicy, seed = 100): ChainStats {
  const st: ChainStats = { battles: 0, wins: 0, rounds: 0, shutters: 0, firstRoundShutters: 0, resonances: 0, links: 0, weakDowns: 0, used: {}, grades: {}, finishTime: 0, pushOuts: 0, pushes: 0, interrupts: 0, shutterShots: 0 };
  for (let k = 0; k < runs; k++) {
    let r = ((seed + k) ^ 0x9e3779b9) >>> 0;
    const pick = (n: number): number => {
      const [v, next] = nextRandom(r);
      r = next;
      return Math.floor(v * n);
    };
    let s = createChainBattle(def, rules, seed + k);
    while (s.outcome === 'ongoing' && s.round <= 20) {
      const plan = planBy(policy, s, pick);
      const res = runChainRound(s, plan);
      for (const f of res.frames) {
        const ev = f.events;
        if (ev.some((e) => e.type === 'act') && s.allies.some((a) => a.uid === f.uid)) st.used[f.name] = (st.used[f.name] ?? 0) + 1;
        // 目印で広がった回数（調整7で共鳴の代わり）
        st.resonances += ev.filter((e) => e.type === 'trickUse' && e.trick === 'spread' && (e.to?.length ?? 0) > 0).length;
        st.links += ev.filter((e) => e.type === 'link').length;
        st.pushes += ev.filter((e) => e.type === 'push' && e.moved).length;
        st.pushOuts += ev.filter((e) => e.type === 'push' && e.out).length;
        st.interrupts += ev.filter((e) => e.type === 'cancel' && e.reason === 'down').length;
      }
      // 弱点のダウン：弱点で当たった直後のダウン
      for (const f of res.frames) {
        f.events.forEach((e, i) => {
          if (e.type === 'down' && f.events.slice(0, i).some((d) => d.type === 'damage' && d.weak && d.to === e.uid)) st.weakDowns++;
        });
      }
      s = res.state;
      if (s.shutter) {
        st.shutterShots++;
        s = takeShutter(s);
      }
    }
    st.battles++;
    if (s.outcome === 'win') {
      st.wins++;
      st.finishTime += s.finishTime ?? 0;
      const g = chainGrade(s);
      if (g) st.grades[g] = (st.grades[g] ?? 0) + 1;
      st.rounds += s.finishRound ?? s.round;
      if (s.finish === 'shutter') {
        st.shutters++;
        if (s.finishRound === 1) st.firstRoundShutters++;
      }
    }
  }
  return st;
}

/** 1戦を最後まで（シャッターが光ったら押す）。maxRounds で打ち切り（負け） */
export function autoChainBattle(def: ChainBattleDef, rules: ChainRules, seed: number, policy: ChainPolicy, maxRounds = 20): ChainAutoResult {
  let r = (seed ^ 0x9e3779b9) >>> 0;
  const pick = (n: number): number => {
    const [v, next] = nextRandom(r);
    r = next;
    return Math.floor(v * n);
  };
  let s = createChainBattle(def, rules, seed);
  while (s.outcome === 'ongoing' && s.round <= maxRounds) {
    const plan = planBy(policy, s, pick);
    s = runChainRound(s, plan).state;
    if (s.shutter) s = takeShutter(s);
  }
  return { outcome: s.outcome === 'ongoing' ? 'lose' : s.outcome, finish: s.finish, rounds: s.finishRound ?? s.round };
}
