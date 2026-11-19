import type { ChainBattleDef, ChainState } from '../core';
import { buildMainChainBattle, createChainBattle, nextRandom, runChainRound } from '../core';
import { AREAS, CHAIN_AREA_SETUPS, CHAIN_RULES, PARTY } from '../data';
import { areaBattleOrder, areaLineup, grownParty } from './autoArea';
import { type ChainPolicy, planBy } from './chainAuto';
import { growthPreset } from './presets';

// 段階253（docs/milestones/M3_battle_tension.md）：戦闘の手触りを区画ごとに測る。使い方：npm run measure
// その区画に入る時点の控えめな育ち具合・区画の山札で、雑魚戦とぬしを何回か戦う。区画の中の HP の持ち越しはせず、毎戦全回復から

/** 測る区画（新しい戦闘にした物語の区画） */
export const MEASURE_AREAS = ['a11', 'a12', 'a21', 'a22', 'a23', 'a31', 'a32', 'a41', 'a42'];

export interface AreaMeasure {
  area: string;
  name: string;
  /** 雑魚戦の数 */
  battles: number;
  /** 雑魚戦の平均ラウンド（考える方針・でたらめ）と、でたらめの勝率 */
  smartRounds: number;
  randomRounds: number;
  randomWinRate: number;
  /** ぬしの平均ラウンド（考える方針）と勝率 */
  bossRounds: number;
  bossWinRate: number;
  /** 雑魚1戦で失う HP（最大 HP の合計に対する割合。考える方針） */
  hpLoss: number;
  /** 1ラウンドに並べた行動の数と、添えた札の数（考える方針） */
  actsPerRound: number;
  addonsPerRound: number;
  /** 1ラウンドに行動として使った札（アクション・クライマックス・スペシャル。添える札は含まない）と、ラウンドの終わりに手札に残った札（考える方針） */
  cardsPerRound: number;
  handLeft: number;
  /** 1戦で山札から見た札の割合（最初の手札＋引いた札 ÷ 山札の枚数） */
  deckSeen: number;
  /** 1戦あたり、押して予定をずらした回数・ラウンドの外へ押し出して消した回数（考える方針） */
  pushes: number;
  pushOuts: number;
}

interface OneRun {
  win: boolean;
  rounds: number;
  hpLoss: number;
  acts: number;
  addons: number;
  roundsPlayed: number;
  cards: number;
  handLeft: number;
  deckSeen: number;
  pushes: number;
  pushOuts: number;
}

function runOnce(def: ChainBattleDef, seed: number, policy: ChainPolicy): OneRun {
  let r = (seed ^ 0x9e3779b9) >>> 0;
  const pick = (n: number): number => {
    const [v, next] = nextRandom(r);
    r = next;
    return Math.floor(v * n);
  };
  let s: ChainState = createChainBattle(def, CHAIN_RULES, seed);
  const maxHp = s.allies.reduce((a, x) => a + x.maxHp, 0);
  const startHp = s.allies.reduce((a, x) => a + x.hp, 0);
  const out: OneRun = { win: false, rounds: 0, hpLoss: 0, acts: 0, addons: 0, roundsPlayed: 0, cards: 0, handLeft: 0, deckSeen: 0, pushes: 0, pushOuts: 0 };
  const deckSize = s.deck.length + s.hand.length;
  while (s.outcome === 'ongoing' && s.round <= 20) {
    const plan = planBy(policy, s, pick);
    out.acts += plan.length;
    out.addons += plan.reduce((a, p) => a + (p.addons?.length ?? 0), 0);
    out.cards += plan.filter((p) => p.source.kind === 'card').length;
    out.roundsPlayed++;
    const res = runChainRound(s, plan);
    out.handLeft += res.state.hand.length;
    for (const ev of res.frames.flatMap((f) => f.events)) {
      if (ev.type !== 'push') continue;
      if (ev.moved) out.pushes++;
      if (ev.out) out.pushOuts++;
    }
    s = res.state;
  }
  out.win = s.outcome === 'win';
  out.deckSeen = deckSize ? Math.min(1, (deckSize - s.deck.length) / deckSize) : 0;
  out.rounds = s.finishRound ?? s.round;
  out.hpLoss = (startHp - s.allies.reduce((a, x) => a + Math.max(0, x.hp), 0)) / maxHp;
  return out;
}

/** 区画の戦闘を、本番と同じ形の新しい戦闘にする（山札はアルバムでなく、区画の山札） */
function areaDef(battleId: string, areaId: string): ChainBattleDef | null {
  const setup = CHAIN_AREA_SETUPS[battleId];
  const battle = areaBattleOrder(areaId).find((b) => b.id === battleId);
  if (!setup || !battle) return null;
  const pre = growthPreset(`${areaId}_enter`, 'low');
  const ids = areaLineup(areaId).members;
  const members = ids.map((id) => PARTY.find((c) => c.id === id)).filter((c) => !!c);
  const party = grownParty(pre.carry.growth, pre.carry.armory, members, pre.carry.navi);
  return buildMainChainBattle({
    id: battleId,
    name: battleId,
    party,
    enemies: battle.enemies,
    chainEnemies: setup.enemies,
    variants: setup.variants,
    poi: setup.poi,
    sunset: setup.sunset,
    teeth: setup.teeth,
    clap: setup.clap,
    pitch: setup.pitch,
    watch: setup.watch,
    allyMoves: setup.allyMoves,
    repeat: setup.repeat,
    film: setup.film,
    word: setup.word,
    heat: setup.heat,
    broken: setup.broken,
    deck: setup.deck,
    cards: setup.cards,
    links: setup.links,
    boss: !!battle.boss,
    gradeAt: setup.gradeAt,
  });
}

const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);

/** 1つの区画を測る。seeds 回ずつ戦う */
export function measureArea(areaId: string, seeds = 3): AreaMeasure {
  const zako: OneRun[] = [];
  const random: OneRun[] = [];
  const boss: OneRun[] = [];
  let battles = 0;
  for (const b of areaBattleOrder(areaId)) {
    const def = areaDef(b.id, areaId);
    if (!def) continue;
    if (!b.boss) battles++;
    for (let k = 1; k <= seeds; k++) {
      if (b.boss) boss.push(runOnce(def, k, 'smart'));
      else {
        zako.push(runOnce(def, k, 'smart'));
        random.push(runOnce(def, k, 'random'));
      }
    }
  }
  const played = zako.reduce((a, x) => a + x.roundsPlayed, 0) || 1;
  return {
    area: areaId,
    name: AREAS[areaId]?.name ?? areaId,
    battles,
    smartRounds: avg(zako.filter((x) => x.win).map((x) => x.rounds)),
    randomRounds: avg(random.filter((x) => x.win).map((x) => x.rounds)),
    randomWinRate: random.length ? random.filter((x) => x.win).length / random.length : 0,
    bossRounds: avg(boss.filter((x) => x.win).map((x) => x.rounds)),
    bossWinRate: boss.length ? boss.filter((x) => x.win).length / boss.length : 0,
    hpLoss: avg(zako.map((x) => x.hpLoss)),
    actsPerRound: zako.reduce((a, x) => a + x.acts, 0) / played,
    addonsPerRound: zako.reduce((a, x) => a + x.addons, 0) / played,
    cardsPerRound: zako.reduce((a, x) => a + x.cards, 0) / played,
    handLeft: zako.reduce((a, x) => a + x.handLeft, 0) / played,
    deckSeen: avg(zako.map((x) => x.deckSeen)),
    pushes: avg(zako.map((x) => x.pushes)),
    pushOuts: avg(zako.map((x) => x.pushOuts)),
  };
}

/** 測った結果を Markdown の表に */
export function measureTable(rows: AreaMeasure[]): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const f = (x: number) => x.toFixed(1);
  const head = '| 区画 | 雑魚戦 | ラウンド（考える） | ラウンド（でたらめ） | でたらめの勝率 | ぬしのラウンド | ぬしの勝率 | 雑魚1戦で失う HP | 1ラウンドの行動 | うち札 | 1ラウンドの添える札 | ラウンドの終わりの手札 | 1戦で見た山札 | 押した（1戦） | 押して消した（1戦） |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const body = rows.map((r) => `| ${r.area} ${r.name} | ${r.battles} | ${f(r.smartRounds)} | ${f(r.randomRounds)} | ${pct(r.randomWinRate)} | ${f(r.bossRounds)} | ${pct(r.bossWinRate)} | ${pct(r.hpLoss)} | ${f(r.actsPerRound)} | ${f(r.cardsPerRound)} | ${f(r.addonsPerRound)} | ${f(r.handLeft)} | ${pct(r.deckSeen)} | ${f(r.pushes)} | ${f(r.pushOuts)} |`);
  return [head, ...body].join('\n');
}
