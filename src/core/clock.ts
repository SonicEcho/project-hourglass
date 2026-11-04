import { nextRandom } from './rng';
import type { Element } from './types';

// 試し：文字盤の戦闘（段階154。docs/milestones/M3_battle_review.md の案1・案3）。今の戦闘（battle.ts）とは別の、試しの仕組み。
// ラウンドはない。仲間と敵は、それぞれ「次の番が来る時刻」（時間。文字盤の1周は12時間）を持ち、一番早い者から動く。
// 行動ごとに重さ（時間）があり、動いた後の次の番は「今 + 重さ × 基準の速さ ÷ 速さ」。
// 弱点を突くと、相手の次の番を後ろへ押し出す（敵も、こちらの弱点を突いてくる）。押し出された者は、自分が動くまで二度は押し出されない。
// 仲間は控えとバトンタッチで交代できる（入った仲間がそのまま今の番を使う。交代の分だけ、次の番が遅れる）。
// 時刻が刻限（24時間ごと。針が2周するたび）を越えるたび、敵の攻撃が強くなる

/** 仲間の技・スナップの効き目 */
export type ClockEffect =
  | { kind: 'damage'; element: Element; power: number; all?: boolean }
  | { kind: 'heal'; power: number }
  /** 敵1体の次の番を遅らせる（コマ送り） */
  | { kind: 'delay'; hours: number }
  /** 仲間1人の次の番を早める（早回し） */
  | { kind: 'hasten'; hours: number };

/** 仲間の行動（スナップ・その人の技・通常攻撃） */
export interface ClockMove {
  id: string;
  name: string;
  /** 重さ（時間） */
  hours: number;
  effect: ClockEffect;
}

/** 敵の行動。癖（pattern）の順に、くり返し使う */
export interface ClockEnemyMove {
  id: string;
  name: string;
  hours: number;
  /** hit：単体（その属性が弱点の仲間を先にねらう）／all：全体／twice：単体に2回／haste：ほかの敵の次の番を早める／bind：単体に当て、次の番を遅らせる */
  kind: 'hit' | 'all' | 'twice' | 'haste' | 'bind';
  element?: Element;
  power?: number;
  /** haste・bind の時間 */
  shift?: number;
}

export interface ClockAllyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  mag: number;
  def: number;
  spd: number;
  weak: Element[];
  moves: ClockMove[];
}

export interface ClockEnemyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  weak: Element[];
  resist: Element[];
  pattern: ClockEnemyMove[];
  /** 紙風船：たたかれるたびにふくらみ、この回数で、次の番に破裂（burst）を使う */
  swellMax?: number;
  burst?: ClockEnemyMove;
}

export interface ClockRules {
  /** 文字盤の1周（時間） */
  dial: number;
  /** 刻限の間隔（時間。1周の倍数にすると、刻限はいつも12時の所） */
  kokugenEvery: number;
  /** 弱点を突いた時に押し出す時間 */
  push: number;
  weakMult: number;
  resistMult: number;
  guardMult: number;
  /** 刻限を越えるたびに、敵の攻撃にかける倍率 */
  kokugenPower: number;
  /** 速さの基準（この速さで、重さどおりの時間） */
  baseSpd: number;
  handSize: number;
  /** 交代した時に、入った仲間の次の番に足す時間 */
  swapHours: number;
  guardHours: number;
  /** 回復の量 = 威力 × 魔力 ÷ この値 */
  healDiv: number;
}

export interface ClockBattleDef {
  id: string;
  name: string;
  allies: ClockAllyDef[];
  reserve: ClockAllyDef[];
  enemies: ClockEnemyDef[];
  /** 山札（スナップの id の並び） */
  deck: string[];
  cards: Record<string, ClockMove>;
}

export interface ClockUnit {
  uid: string;
  defId: string;
  name: string;
  side: 'ally' | 'enemy';
  hp: number;
  maxHp: number;
  atk: number;
  mag: number;
  def: number;
  spd: number;
  weak: Element[];
  resist: Element[];
  next: number;
  /** 押し出された（自分が動くまで、もう押し出されない） */
  staggered: boolean;
  guarding: boolean;
  /** 敵の癖の何番目か */
  step: number;
  swell: number;
}

export type ClockEvent =
  | { type: 'act'; uid: string; name: string }
  | { type: 'damage'; from: string; to: string; amount: number; weak: boolean; resist: boolean }
  | { type: 'heal'; to: string; amount: number }
  | { type: 'push'; to: string; hours: number }
  | { type: 'shift'; to: string; hours: number }
  | { type: 'defeat'; uid: string }
  | { type: 'swap'; out: string; in: string }
  | { type: 'kokugen'; phase: number }
  | { type: 'reveal'; uid: string; element: Element };

export interface ClockState {
  def: ClockBattleDef;
  rules: ClockRules;
  time: number;
  /** 次の刻限の時刻 */
  kokugen: number;
  /** 越えた刻限の数 */
  phase: number;
  allies: ClockUnit[];
  reserve: ClockUnit[];
  enemies: ClockUnit[];
  deck: string[];
  hand: string[];
  discard: string[];
  /** 見つけた敵の弱点 */
  revealed: Record<string, Element[]>;
  /** 今の番で交代した（同じ番に2回は交代しない） */
  swapped: boolean;
  rng: number;
  log: ClockEvent[];
  outcome: 'ongoing' | 'win' | 'lose';
}

export type ClockAction =
  | { kind: 'card'; index: number; target?: string }
  | { kind: 'move'; moveId: string; target?: string }
  | { kind: 'guard' }
  | { kind: 'swap'; reserve: string };

function rand(s: ClockState): number {
  const [v, n] = nextRandom(s.rng);
  s.rng = n;
  return v;
}

function shuffle(s: ClockState, list: string[]): string[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function allyUnit(d: ClockAllyDef, start: number, rules: ClockRules): ClockUnit {
  return { uid: d.id, defId: d.id, name: d.name, side: 'ally', hp: d.hp, maxHp: d.hp, atk: d.atk, mag: d.mag, def: d.def, spd: d.spd, weak: [...d.weak], resist: [], next: start * (rules.baseSpd / d.spd), staggered: false, guarding: false, step: 0, swell: 0 };
}

/** 戦闘を始める。最初の番は、速さの順に少しずつずらす */
export function createClockBattle(def: ClockBattleDef, rules: ClockRules, seed: number): ClockState {
  const s: ClockState = {
    def,
    rules,
    time: 0,
    kokugen: rules.kokugenEvery,
    phase: 0,
    allies: def.allies.map((d) => allyUnit(d, 1, rules)),
    reserve: def.reserve.map((d) => allyUnit(d, 1, rules)),
    enemies: def.enemies.map((d, i) => ({
      uid: `${d.id}#${i}`,
      defId: d.id,
      name: d.name,
      side: 'enemy',
      hp: d.hp,
      maxHp: d.hp,
      atk: d.atk,
      mag: d.atk,
      def: d.def,
      spd: d.spd,
      weak: [...d.weak],
      resist: [...d.resist],
      next: 2 * (rules.baseSpd / d.spd),
      staggered: false,
      guarding: false,
      step: 0,
      swell: 0,
    })),
    deck: [],
    hand: [],
    discard: [],
    revealed: {},
    swapped: false,
    rng: seed >>> 0,
    log: [],
    outcome: 'ongoing',
  };
  s.deck = shuffle(s, def.deck);
  for (let i = 0; i < rules.handSize; i++) draw(s);
  const first = currentActor(s);
  if (first) s.time = first.next;
  return s;
}

function clone(s: ClockState): ClockState {
  return {
    ...s,
    allies: s.allies.map((u) => ({ ...u, weak: [...u.weak], resist: [...u.resist] })),
    reserve: s.reserve.map((u) => ({ ...u, weak: [...u.weak], resist: [...u.resist] })),
    enemies: s.enemies.map((u) => ({ ...u, weak: [...u.weak], resist: [...u.resist] })),
    deck: [...s.deck],
    hand: [...s.hand],
    discard: [...s.discard],
    revealed: Object.fromEntries(Object.entries(s.revealed).map(([k, v]) => [k, [...v]])),
    log: [],
  };
}

function draw(s: ClockState): void {
  if (s.deck.length === 0) {
    s.deck = shuffle(s, s.discard);
    s.discard = [];
  }
  const c = s.deck.shift();
  if (c) s.hand.push(c);
}

const alive = (u: ClockUnit) => u.hp > 0;

/** 今動く者（一番早い次の番。同じなら仲間が先、その次は速さの高い順）。勝負がついていれば null */
export function currentActor(s: ClockState): ClockUnit | null {
  if (s.outcome !== 'ongoing') return null;
  const all = [...s.allies, ...s.enemies].filter(alive);
  all.sort((a, b) => a.next - b.next || (a.side === b.side ? b.spd - a.spd : a.side === 'ally' ? -1 : 1));
  return all[0] ?? null;
}

export function findClockUnit(s: ClockState, uid: string): ClockUnit | undefined {
  return [...s.allies, ...s.enemies, ...s.reserve].find((u) => u.uid === uid);
}

/** その者が、その重さの行動をした後の次の番の時刻 */
export function nextTurnAt(s: ClockState, u: ClockUnit, hours: number): number {
  return s.time + hours * (s.rules.baseSpd / u.spd);
}

/** 敵の次の行動（紙風船がふくらみきっていれば破裂） */
export function enemyIntent(s: ClockState, u: ClockUnit): ClockEnemyMove {
  const d = s.def.enemies.find((e) => e.id === u.defId)!;
  if (d.burst && d.swellMax !== undefined && u.swell >= d.swellMax) return d.burst;
  return d.pattern[u.step % d.pattern.length];
}

/** 仲間の行動の中身（スナップ・技・通常攻撃）。防御と交代は null */
export function clockMoveOf(s: ClockState, actor: ClockUnit, a: ClockAction): ClockMove | null {
  if (a.kind === 'card') return s.def.cards[s.hand[a.index]] ?? null;
  if (a.kind === 'move') return [...s.def.allies, ...s.def.reserve].find((d) => d.id === actor.defId)?.moves.find((m) => m.id === a.moveId) ?? null;
  return null;
}

/** 行動の重さ（時間） */
export function actionHours(s: ClockState, actor: ClockUnit, a: ClockAction): number {
  if (a.kind === 'guard') return s.rules.guardHours;
  if (a.kind === 'swap') return 0;
  return clockMoveOf(s, actor, a)?.hours ?? 1;
}

function damage(s: ClockState, from: ClockUnit, to: ClockUnit, element: Element, power: number, extra = 1): number {
  const weak = to.weak.includes(element);
  const resist = to.resist.includes(element);
  const stat = element === 'physical' ? from.atk : from.mag;
  const kokugen = from.side === 'enemy' ? Math.pow(s.rules.kokugenPower, s.phase) : 1;
  const mult = (weak ? s.rules.weakMult : 1) * (resist ? s.rules.resistMult : 1) * (to.guarding ? s.rules.guardMult : 1) * kokugen * extra;
  const amount = Math.max(1, Math.floor(((power * stat) / to.def) * (0.9 + rand(s) * 0.2) * mult));
  to.hp = Math.max(0, to.hp - amount);
  s.log.push({ type: 'damage', from: from.uid, to: to.uid, amount, weak, resist });
  if (to.side === 'enemy' && weak) {
    const known = (s.revealed[to.uid] ??= []);
    if (!known.includes(element)) {
      known.push(element);
      s.log.push({ type: 'reveal', uid: to.uid, element });
    }
  }
  // 弱点を突くと押し出す（倒れた者・押し出されたばかりの者は押し出さない）
  if (weak && to.hp > 0 && !to.staggered) {
    to.next += s.rules.push;
    to.staggered = true;
    s.log.push({ type: 'push', to: to.uid, hours: s.rules.push });
  }
  // 紙風船は、たたかれるたびにふくらむ
  if (to.side === 'enemy' && to.hp > 0) {
    const d = s.def.enemies.find((e) => e.id === to.defId);
    if (d?.swellMax !== undefined) to.swell += 1;
  }
  if (to.hp === 0) s.log.push({ type: 'defeat', uid: to.uid });
  return amount;
}

/** 敵がねらう仲間：その属性が弱点の仲間を先に（いなければ、でたらめ） */
function pickAlly(s: ClockState, element?: Element): ClockUnit | undefined {
  const live = s.allies.filter(alive);
  if (live.length === 0) return undefined;
  const weak = element ? live.filter((u) => u.weak.includes(element)) : [];
  const pool = weak.length > 0 ? weak : live;
  return pool[Math.floor(rand(s) * pool.length)];
}

/** 倒れた仲間の所へ、生きている控えを入れる */
function fillFallen(s: ClockState): void {
  s.allies.forEach((u, i) => {
    if (u.hp > 0) return;
    const j = s.reserve.findIndex(alive);
    if (j < 0) return;
    const incoming = s.reserve[j];
    incoming.next = s.time + s.rules.swapHours;
    incoming.staggered = false;
    s.reserve.splice(j, 1, u);
    s.allies[i] = incoming;
    s.log.push({ type: 'swap', out: u.uid, in: incoming.uid });
  });
}

/** 行動の後：勝ち負け・控えの入れ替え・刻限を見る */
function settle(s: ClockState): void {
  if (s.enemies.every((u) => !alive(u))) {
    s.outcome = 'win';
    return;
  }
  fillFallen(s);
  if (s.allies.every((u) => !alive(u))) {
    s.outcome = 'lose';
    return;
  }
  const next = currentActor(s);
  if (!next) return;
  while (next.next >= s.kokugen) {
    s.phase += 1;
    s.kokugen += s.rules.kokugenEvery;
    s.log.push({ type: 'kokugen', phase: s.phase });
  }
  s.time = Math.max(s.time, next.next);
  // 自分の番が来た者の防御と押し出しは解ける
  next.guarding = false;
  next.staggered = false;
}

/** 選んだ行動が使えない理由（使えるなら null） */
export function clockActionError(s: ClockState, a: ClockAction): string | null {
  const actor = currentActor(s);
  if (!actor || actor.side !== 'ally') return '仲間の番ではない';
  if (a.kind === 'swap') {
    if (s.swapped) return 'この番はもう交代した';
    const r = s.reserve.find((u) => u.uid === a.reserve);
    return r && alive(r) ? null : '交代できる控えがいない';
  }
  if (a.kind === 'guard') return null;
  const m = clockMoveOf(s, actor, a);
  if (!m) return '使えない行動';
  const e = m.effect;
  if ((e.kind === 'damage' && !e.all) || e.kind === 'delay') {
    const t = s.enemies.find((u) => u.uid === a.target);
    if (!t || !alive(t)) return '敵を選ぶ';
  }
  if (e.kind === 'heal' || e.kind === 'hasten') {
    const t = s.allies.find((u) => u.uid === a.target);
    if (!t || !alive(t)) return '仲間を選ぶ';
  }
  return null;
}

/** 仲間の番に行動する。新しい状態を返す（log はこの行動の分だけ） */
export function clockAllyAct(state: ClockState, a: ClockAction): ClockState {
  const err = clockActionError(state, a);
  if (err) throw new Error(err);
  const s = clone(state);
  const actor = currentActor(s)!;
  if (a.kind === 'swap') {
    // バトンタッチ：控えと入れ替わり、入った仲間がそのまま今の番を使う
    const i = s.allies.findIndex((u) => u.uid === actor.uid);
    const j = s.reserve.findIndex((u) => u.uid === a.reserve);
    const incoming = s.reserve[j];
    incoming.next = actor.next;
    incoming.staggered = false;
    incoming.guarding = false;
    actor.guarding = false;
    s.reserve.splice(j, 1, actor);
    s.allies[i] = incoming;
    s.swapped = true;
    s.log.push({ type: 'swap', out: actor.uid, in: incoming.uid });
    return s;
  }
  s.log.push({ type: 'act', uid: actor.uid, name: a.kind === 'guard' ? '防御' : clockMoveOf(s, actor, a)!.name });
  const hours = actionHours(s, actor, a) + (s.swapped ? s.rules.swapHours : 0);
  if (a.kind === 'guard') actor.guarding = true;
  else {
    const m = clockMoveOf(s, actor, a)!;
    const e = m.effect;
    if (e.kind === 'damage') {
      const targets = e.all ? s.enemies.filter(alive) : [s.enemies.find((u) => u.uid === a.target)!];
      for (const t of targets) damage(s, actor, t, e.element, e.power);
    } else if (e.kind === 'heal') {
      const t = s.allies.find((u) => u.uid === a.target)!;
      const amount = Math.min(t.maxHp - t.hp, Math.floor((e.power * actor.mag) / s.rules.healDiv));
      t.hp += amount;
      s.log.push({ type: 'heal', to: t.uid, amount });
    } else if (e.kind === 'delay') {
      const t = s.enemies.find((u) => u.uid === a.target)!;
      t.next += e.hours;
      s.log.push({ type: 'shift', to: t.uid, hours: e.hours });
    } else {
      const t = s.allies.find((u) => u.uid === a.target)!;
      if (t.uid !== actor.uid) {
        t.next = Math.max(s.time, t.next - e.hours);
        s.log.push({ type: 'shift', to: t.uid, hours: -e.hours });
      }
    }
    if (a.kind === 'card') {
      s.discard.push(...s.hand.splice(a.index, 1));
      draw(s);
    }
  }
  actor.next = nextTurnAt(s, actor, hours);
  s.swapped = false;
  settle(s);
  return s;
}

/** 敵の番に、癖の順の行動をする */
export function clockEnemyAct(state: ClockState): ClockState {
  const s = clone(state);
  const actor = currentActor(s);
  if (!actor || actor.side !== 'enemy') return s;
  const move = enemyIntent(s, actor);
  const d = s.def.enemies.find((e) => e.id === actor.defId)!;
  s.log.push({ type: 'act', uid: actor.uid, name: move.name });
  const element = move.element ?? 'physical';
  const power = move.power ?? 0;
  if (move.kind === 'hit' || move.kind === 'twice' || move.kind === 'bind') {
    const t = pickAlly(s, move.element);
    if (t) {
      damage(s, actor, t, element, power);
      if (move.kind === 'twice' && t.hp > 0) damage(s, actor, t, element, power);
      if (move.kind === 'bind' && t.hp > 0 && move.shift) {
        t.next += move.shift;
        s.log.push({ type: 'shift', to: t.uid, hours: move.shift });
      }
    }
  } else if (move.kind === 'all') {
    for (const t of s.allies.filter(alive)) damage(s, actor, t, element, power);
  } else if (move.kind === 'haste') {
    const others = s.enemies.filter((u) => alive(u) && u.uid !== actor.uid);
    const t = others.sort((a, b) => a.next - b.next)[others.length - 1];
    if (t && move.shift) {
      t.next = Math.max(s.time, t.next - move.shift);
      s.log.push({ type: 'shift', to: t.uid, hours: -move.shift });
    }
  }
  if (d.burst && move === d.burst) {
    // 破裂した紙風船は、しぼんで消える
    actor.hp = 0;
    s.log.push({ type: 'defeat', uid: actor.uid });
  } else actor.step += 1;
  actor.next = nextTurnAt(s, actor, move.hours);
  settle(s);
  return s;
}

/** 文字盤に並べる、これから来る番（生きている者の次の番を早い順に。今動く者が先頭） */
export function upcomingTurns(s: ClockState): { uid: string; at: number }[] {
  return [...s.allies, ...s.enemies]
    .filter(alive)
    .map((u) => ({ uid: u.uid, at: u.next, side: u.side, spd: u.spd }))
    .sort((a, b) => a.at - b.at || (a.side === b.side ? b.spd - a.spd : a.side === 'ally' ? -1 : 1))
    .map(({ uid, at }) => ({ uid, at }));
}
