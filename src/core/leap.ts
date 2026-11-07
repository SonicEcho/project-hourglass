import { nextRandom } from './rng';
import type { Element } from './types';

// 試し：組んで跳ねる戦闘（段階157。docs/milestones/M3_battle_rethink.md の 10.・12.）。今の戦闘・並べてつなぐ戦闘とは別。
// ダメージ ＝（元の威力 ＋ 添える分）× 当たった回数 × 倍率。札はそれぞれ1つの軸だけを伸ばし、そろうと跳ね上がる。
// 1ラウンドの流れ：先制の敵 → 仲間（並べた順）→ ほかの敵。敵の行動（何を・誰に・何発）は前もって見えている

/** 札・技の種類 */
export type LeapKind =
  /** ダメージ（hits 回。全体なら敵ごとに hits 回） */
  | 'attack'
  /** 添える札：行動に添えて使う。手番は使わない */
  | 'addon'
  /** 敵を濡らす（全体か1体） */
  | 'wet'
  /** 回復 */
  | 'heal'
  /** 砂時計を返す：その敵の砂1粒につき perSand のダメージ */
  | 'hourglass'
  /** 見切り：このラウンド、敵の単体攻撃を引き受け、受けるたびに反撃する */
  | 'counter';

export interface LeapMove {
  id: string;
  name: string;
  kind: LeapKind;
  target: 'enemy' | 'enemies' | 'allies' | 'self';
  element?: Element;
  power?: number;
  hits?: number;
  /** 添える：1発ごとに足す */
  addPerHit?: number;
  /** 露出補正：この行動から後、このラウンドの味方の攻撃すべてに、1発ごとに足す */
  exposure?: number;
  /** 当てた敵を凍らせる（凍り × 物理 ＝ 2倍） */
  freeze?: boolean;
  /** 当てた敵をよろけさせる（止まる。重い敵には効かない） */
  stagger?: boolean;
  /** 砂時計：砂1粒あたりの威力 */
  perSand?: number;
  /** 見切り：反撃の威力 */
  counter?: number;
  /** 回復の威力 */
  heal?: number;
  /** 説明（長押し） */
  text: string;
  /** 札の上の短い効果 */
  short: string;
  /** 誰の技か（技の時だけ） */
  owner?: string;
}

export interface LeapAllyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  mag: number;
  moves: LeapMove[];
}

export interface LeapEnemyMove {
  id: string;
  name: string;
  power: number;
  hits?: number;
  all?: boolean;
  /** 先制：仲間より先に動く */
  first?: boolean;
}

export interface LeapEnemyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  weak: Element[];
  /** 重い：よろけない */
  heavy?: boolean;
  pattern: LeapEnemyMove[];
}

export interface LeapRules {
  handSize: number;
  weakMult: number;
  reactionMult: number;
  /** 連続攻撃が、動いている敵に当たる発数 */
  movingHits: number;
  /** 1つの行動に添えられる札の数 */
  addonMax: number;
  maxRounds: number;
}

export interface LeapBattleDef {
  id: string;
  name: string;
  allies: LeapAllyDef[];
  enemies: LeapEnemyDef[];
  cards: Record<string, LeapMove>;
  deck: string[];
}

export interface LeapUnit {
  uid: string;
  defId: string;
  name: string;
  side: 'ally' | 'enemy';
  hp: number;
  maxHp: number;
  atk: number;
  mag: number;
  weak: Element[];
  heavy?: boolean;
  /** 濡れ（雷で反応） */
  wet?: boolean;
  /** 凍り（物理で反応） */
  frozen?: boolean;
  /** 止まっている（しびれ・よろけ・ダウン）。次の行動が起きず、その時に解ける */
  stopped?: 'stun' | 'stagger' | 'down';
  /** 砂（味方の攻撃が1発当たるたびに1粒。ラウンドをまたいで残る） */
  sand: number;
  /** 敵の癖の何番目か */
  step: number;
  /** 見切り：このラウンドの反撃 */
  guard?: { power: number; add: number };
}

export interface LeapIntent {
  enemy: string;
  move: LeapEnemyMove;
  /** 単体攻撃の狙い */
  target?: string;
}

export type LeapSource = { kind: 'move'; moveId: string } | { kind: 'card'; index: number };

export interface LeapPlanStep {
  ally: string;
  source: LeapSource;
  target?: string;
  /** 添える札（手札の位置） */
  addons: number[];
}

export type LeapEvent =
  | { type: 'act'; uid: string; name: string }
  | { type: 'cancel'; uid: string; reason: 'stopped' | 'dead' }
  | { type: 'recover'; uid: string }
  | { type: 'hit'; from: string; to: string; amount: number; n: number; weak: boolean; reaction?: 'shock' | 'shatter'; formula: string }
  | { type: 'miss'; from: string; to: string; n: number }
  | { type: 'stop'; uid: string; why: 'stun' | 'stagger' | 'down' }
  | { type: 'wet'; uid: string }
  | { type: 'freeze'; uid: string }
  | { type: 'sand'; uid: string; spent: number }
  | { type: 'guard'; uid: string }
  | { type: 'counter'; uid: string; to: string }
  | { type: 'heal'; to: string; amount: number }
  | { type: 'exposure'; total: number }
  | { type: 'defeat'; uid: string }
  | { type: 'total'; uid: string; amount: number; hits: number };

export interface LeapFrame {
  uid: string;
  name: string;
  events: LeapEvent[];
  state: LeapState;
}

export interface LeapState {
  def: LeapBattleDef;
  rules: LeapRules;
  rng: number;
  round: number;
  allies: LeapUnit[];
  enemies: LeapUnit[];
  deck: string[];
  hand: string[];
  discard: string[];
  intents: LeapIntent[];
  outcome: 'ongoing' | 'win' | 'lose';
  /** 1つの行動で与えた最大のダメージ（爽快感の目安） */
  bestHit: number;
  /** 露出補正：このラウンドの、これから後の味方の攻撃に1発ごとに足す分（ラウンドの終わりに0） */
  exposure: number;
}

// ---------- 作る ----------

function rand(s: LeapState, n: number): number {
  const [v, next] = nextRandom(s.rng);
  s.rng = next;
  return Math.floor(v * n);
}

function shuffle(s: LeapState, list: string[]): string[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(s, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function draw(s: LeapState): void {
  if (s.deck.length === 0) {
    s.deck = shuffle(s, s.discard);
    s.discard = [];
  }
  const c = s.deck.shift();
  if (c) s.hand.push(c);
}

export const living = (list: LeapUnit[]): LeapUnit[] => list.filter((u) => u.hp > 0);

function planIntents(s: LeapState): void {
  s.intents = [];
  const allies = living(s.allies);
  for (const e of living(s.enemies)) {
    const def = s.def.enemies.find((d) => d.id === e.defId)!;
    const move = def.pattern[e.step % def.pattern.length];
    const target = move.all || allies.length === 0 ? undefined : allies[rand(s, allies.length)].uid;
    s.intents.push({ enemy: e.uid, move, target });
  }
}

export function createLeapBattle(def: LeapBattleDef, rules: LeapRules, seed: number): LeapState {
  const s: LeapState = {
    def,
    rules,
    rng: seed >>> 0 || 1,
    round: 1,
    allies: def.allies.map((a) => ({ uid: a.id, defId: a.id, name: a.name, side: 'ally', hp: a.hp, maxHp: a.hp, atk: a.atk, mag: a.mag, weak: [], sand: 0, step: 0 })),
    enemies: def.enemies.map((e, i) => {
      const twin = def.enemies.filter((x) => x.id === e.id).length > 1;
      const nth = def.enemies.slice(0, i).filter((x) => x.id === e.id).length;
      return { uid: `e${i}`, defId: e.id, name: twin ? `${e.name}${'ABC'[nth]}` : e.name, side: 'enemy', hp: e.hp, maxHp: e.hp, atk: e.atk, mag: 0, weak: [...e.weak], heavy: e.heavy, sand: 0, step: 0 };
    }),
    deck: [],
    hand: [],
    discard: [],
    intents: [],
    outcome: 'ongoing',
    bestHit: 0,
    exposure: 0,
  };
  s.deck = shuffle(s, def.deck);
  for (let i = 0; i < rules.handSize; i++) draw(s);
  planIntents(s);
  return s;
}

export function cloneLeap(s: LeapState): LeapState {
  return {
    ...s,
    allies: s.allies.map((u) => ({ ...u, guard: u.guard ? { ...u.guard } : undefined })),
    enemies: s.enemies.map((u) => ({ ...u })),
    deck: [...s.deck],
    hand: [...s.hand],
    discard: [...s.discard],
    intents: s.intents.map((i) => ({ ...i })),
  };
}

// ---------- 計画 ----------

export function leapMoveOf(s: LeapState, step: Pick<LeapPlanStep, 'ally' | 'source'>): LeapMove | null {
  if (step.source.kind === 'card') {
    const id = s.hand[step.source.index];
    return id ? (s.def.cards[id] ?? null) : null;
  }
  const src = step.source;
  const me = s.allies.find((a) => a.uid === step.ally);
  return s.def.allies.find((a) => a.id === me?.defId)?.moves.find((m) => m.id === src.moveId) ?? null;
}

/** 計画で使う手札の位置（行動と添える札） */
export function usedCards(plan: LeapPlanStep[]): Set<number> {
  const out = new Set<number>();
  for (const p of plan) {
    if (p.source.kind === 'card') out.add(p.source.index);
    for (const a of p.addons) out.add(a);
  }
  return out;
}

/** 計画の最後に step を足せない理由（足せれば null） */
export function leapPlanError(s: LeapState, plan: LeapPlanStep[], step: LeapPlanStep): string | null {
  if (s.outcome !== 'ongoing') return '戦闘は終わっている';
  const ally = s.allies.find((a) => a.uid === step.ally);
  if (!ally || ally.hp <= 0) return '動ける仲間ではない';
  if (plan.some((p) => p.ally === step.ally)) return `${ally.name}は、もう並べた`;
  const used = usedCards(plan);
  const move = leapMoveOf(s, step);
  if (!move) return 'その行動は使えない';
  if (move.kind === 'addon') return '添える札は、行動に添えて使う';
  if (step.source.kind === 'card' && used.has(step.source.index)) return 'その札は、もう使う予定';
  if (step.addons.length > s.rules.addonMax) return `添える札は${s.rules.addonMax}枚まで`;
  const mine = new Set<number>();
  for (const a of step.addons) {
    const c = s.def.cards[s.hand[a]];
    if (!c || c.kind !== 'addon') return '添えられるのは、添える札だけ';
    if (used.has(a) || mine.has(a) || (step.source.kind === 'card' && step.source.index === a)) return 'その札は、もう使う予定';
    mine.add(a);
  }
  if (move.target === 'enemy') {
    const t = s.enemies.find((e) => e.uid === step.target);
    if (!t || t.hp <= 0) return '相手の敵を選ぶ';
  }
  return null;
}

/** 動く順：先制の敵 → 仲間（並べた順）→ ほかの敵 */
export type LeapOrderEntry = { kind: 'enemy'; intent: LeapIntent } | { kind: 'ally'; i: number };
export function leapOrder(s: LeapState, plan: LeapPlanStep[]): LeapOrderEntry[] {
  const first = s.intents.filter((i) => i.move.first).map((intent) => ({ kind: 'enemy' as const, intent }));
  const later = s.intents.filter((i) => !i.move.first).map((intent) => ({ kind: 'enemy' as const, intent }));
  return [...first, ...plan.map((_, i) => ({ kind: 'ally' as const, i })), ...later];
}

// ---------- 実行 ----------

const statOf = (u: LeapUnit, el: Element | undefined): number => (el === 'physical' || !el ? u.atk : u.mag);

function defeat(e: LeapUnit, ev: LeapEvent[]): void {
  e.stopped = undefined;
  e.wet = undefined;
  e.frozen = undefined;
  ev.push({ type: 'defeat', uid: e.uid });
}

/** 味方の攻撃を敵1体に。1発ずつ当て、連続攻撃は止まっていなければ movingHits 発まで */
function strike(s: LeapState, actor: LeapUnit, e: LeapUnit, move: LeapMove, add: number, ev: LeapEvent[]): number {
  const el = move.element ?? 'physical';
  const hits = move.hits ?? 1;
  const base = Math.round(((move.power ?? 0) * statOf(actor, el)) / 10);
  // 反応はこの行動の間ずっと効き、行動の後で消える
  const shock = !!e.wet && el === 'thunder';
  const shatter = !!e.frozen && el === 'physical';
  let total = 0;
  let landed = 0;
  for (let n = 0; n < hits && e.hp > 0; n++) {
    if (n >= s.rules.movingHits && !e.stopped) {
      ev.push({ type: 'miss', from: actor.uid, to: e.uid, n: n + 1 });
      continue;
    }
    const weak = e.weak.includes(el);
    const mult = (weak ? s.rules.weakMult : 1) * (shock || shatter ? s.rules.reactionMult : 1);
    const per = base + add + s.exposure;
    const amount = Math.max(1, Math.floor(per * mult));
    e.hp = Math.max(0, e.hp - amount);
    e.sand++;
    total += amount;
    landed++;
    const formula = `(${base}${add + s.exposure ? `+${add + s.exposure}` : ''})${mult !== 1 ? `×${mult}` : ''}`;
    ev.push({ type: 'hit', from: actor.uid, to: e.uid, amount, n: n + 1, weak, reaction: shock ? 'shock' : shatter ? 'shatter' : undefined, formula });
    if (e.hp === 0) {
      defeat(e, ev);
      break;
    }
    // 濡れ × 雷：しびれ。弱点：ダウン（どちらも止まる）
    if (shock && !e.stopped) {
      e.stopped = 'stun';
      ev.push({ type: 'stop', uid: e.uid, why: 'stun' });
    } else if (weak && !e.stopped) {
      e.stopped = 'down';
      ev.push({ type: 'stop', uid: e.uid, why: 'down' });
    }
  }
  if (e.hp > 0) {
    if (shock) e.wet = undefined;
    if (shatter) e.frozen = undefined;
    if (move.freeze && !e.frozen) {
      e.frozen = true;
      ev.push({ type: 'freeze', uid: e.uid });
    }
    if (move.stagger && !e.heavy && !e.stopped) {
      e.stopped = 'stagger';
      ev.push({ type: 'stop', uid: e.uid, why: 'stagger' });
    }
  }
  if (landed > 1) ev.push({ type: 'total', uid: e.uid, amount: total, hits: landed });
  return total;
}

function doAllyAction(s: LeapState, actor: LeapUnit, move: LeapMove, target: string | undefined, add: number, ev: LeapEvent[]): void {
  const foes = (): LeapUnit[] => (move.target === 'enemies' ? living(s.enemies) : [s.enemies.find((e) => e.uid === target && e.hp > 0) ?? living(s.enemies)[0]].filter((x): x is LeapUnit => !!x));
  if (move.kind === 'attack') {
    let sum = 0;
    for (const e of foes()) sum += strike(s, actor, e, move, add, ev);
    s.bestHit = Math.max(s.bestHit, sum);
    return;
  }
  if (move.kind === 'wet') {
    for (const e of foes()) {
      e.wet = true;
      ev.push({ type: 'wet', uid: e.uid });
    }
    return;
  }
  if (move.kind === 'heal') {
    for (const a of living(s.allies)) {
      const amount = Math.min(a.maxHp - a.hp, Math.round(((move.heal ?? 0) * actor.mag) / 10));
      a.hp += amount;
      ev.push({ type: 'heal', to: a.uid, amount });
    }
    return;
  }
  if (move.kind === 'hourglass') {
    const e = foes()[0];
    if (!e) return;
    const spent = e.sand;
    e.sand = 0;
    ev.push({ type: 'sand', uid: e.uid, spent });
    const amount = Math.max(spent > 0 ? 1 : 0, spent * (move.perSand ?? 0) + (spent > 0 ? add + s.exposure : 0));
    if (amount > 0) {
      e.hp = Math.max(0, e.hp - amount);
      ev.push({ type: 'hit', from: actor.uid, to: e.uid, amount, n: 1, weak: false, formula: `${spent}粒×${move.perSand ?? 0}${add + s.exposure ? `+${add + s.exposure}` : ''}` });
      s.bestHit = Math.max(s.bestHit, amount);
      if (e.hp === 0) defeat(e, ev);
    }
  }
}

/** 敵の行動。見切りの仲間がいれば、単体攻撃はそちらへ。1発受けるたびに反撃 */
function doEnemyAction(s: LeapState, e: LeapUnit, intent: LeapIntent, ev: LeapEvent[]): void {
  const allies = living(s.allies);
  if (allies.length === 0) return;
  const guard = allies.find((a) => a.guard);
  const targets = intent.move.all ? allies : [guard ?? allies.find((a) => a.uid === intent.target) ?? allies[0]];
  const hits = intent.move.hits ?? 1;
  for (const a of targets) {
    for (let n = 0; n < hits && a.hp > 0 && e.hp > 0; n++) {
      const amount = Math.max(1, Math.round((intent.move.power * e.atk) / 10));
      a.hp = Math.max(0, a.hp - amount);
      ev.push({ type: 'hit', from: e.uid, to: a.uid, amount, n: n + 1, weak: false, formula: '' });
      if (a.hp === 0) {
        ev.push({ type: 'defeat', uid: a.uid });
        break;
      }
      if (a.guard) {
        ev.push({ type: 'counter', uid: a.uid, to: e.uid });
        strike(s, a, e, { id: 'counter', name: '見切り', kind: 'attack', target: 'enemy', element: 'physical', power: a.guard.power, text: '', short: '' }, a.guard.add, ev);
      }
    }
  }
}

function ended(s: LeapState): boolean {
  if (living(s.enemies).length === 0) s.outcome = 'win';
  else if (living(s.allies).length === 0) s.outcome = 'lose';
  return s.outcome !== 'ongoing';
}

/** 1ラウンドを動かす。コマ（1つの行動ごと）と、最後の状態を返す */
export function runLeapRound(s0: LeapState, plan: LeapPlanStep[]): { state: LeapState; frames: LeapFrame[] } {
  const s = cloneLeap(s0);
  const frames: LeapFrame[] = [];
  const used = usedCards(plan);
  const ids = s.hand.map((id) => id);
  s.hand = s.hand.filter((_, i) => !used.has(i));
  s.discard.push(...[...used].map((i) => ids[i]));
  const push = (uid: string, name: string, events: LeapEvent[]) => frames.push({ uid, name, events, state: cloneLeap(s) });
  s.exposure = 0;
  // 見切りは、ラウンドの始めから効く（先制の敵の攻撃も引き受ける）
  for (const step of plan) {
    const move = leapMoveOf(s0, step);
    const a = s.allies.find((x) => x.uid === step.ally);
    if (move?.kind === 'counter' && a && a.hp > 0) {
      const add = step.addons.reduce((sum, i) => sum + (s0.def.cards[ids[i]]?.addPerHit ?? 0), 0);
      a.guard = { power: move.counter ?? 0, add };
    }
  }
  for (const q of leapOrder(s0, plan)) {
    if (s.outcome !== 'ongoing') break;
    const ev: LeapEvent[] = [];
    if (q.kind === 'enemy') {
      const e = s.enemies.find((x) => x.uid === q.intent.enemy);
      if (!e || e.hp <= 0) continue;
      if (e.stopped) {
        ev.push({ type: 'cancel', uid: e.uid, reason: 'stopped' }, { type: 'recover', uid: e.uid });
        e.stopped = undefined;
        push(e.uid, q.intent.move.name, ev);
        continue;
      }
      ev.push({ type: 'act', uid: e.uid, name: q.intent.move.name });
      doEnemyAction(s, e, q.intent, ev);
      push(e.uid, q.intent.move.name, ev);
    } else {
      const step = plan[q.i];
      const actor = s.allies.find((a) => a.uid === step.ally)!;
      const move = leapMoveOf(s0, step)!;
      if (actor.hp <= 0) {
        ev.push({ type: 'cancel', uid: actor.uid, reason: 'dead' });
        push(actor.uid, move.name, ev);
        continue;
      }
      const addons = step.addons.map((i) => s0.def.cards[ids[i]]).filter((c): c is LeapMove => !!c);
      const add = addons.reduce((sum, c) => sum + (c.addPerHit ?? 0), 0);
      const exp = addons.reduce((sum, c) => sum + (c.exposure ?? 0), 0);
      ev.push({ type: 'act', uid: actor.uid, name: move.name });
      if (exp) {
        s.exposure += exp;
        ev.push({ type: 'exposure', total: s.exposure });
      }
      if (move.kind === 'counter') ev.push({ type: 'guard', uid: actor.uid });
      else doAllyAction(s, actor, move, step.target, add, ev);
      push(actor.uid, move.name, ev);
    }
    ended(s);
  }
  s.exposure = 0;
  if (s.outcome === 'ongoing') {
    // ラウンドの終わり：見切りが解け、癖が1つ進み、手札を補充して、次の予定を決める（止まり・濡れ・凍り・砂は残る）
    for (const a of s.allies) a.guard = undefined;
    for (const e of s.enemies) e.step++;
    s.round++;
    if (s.round > s.rules.maxRounds) s.outcome = 'lose';
    while (s.hand.length < s.rules.handSize && (s.deck.length > 0 || s.discard.length > 0)) draw(s);
    planIntents(s);
  }
  return { state: s, frames };
}
