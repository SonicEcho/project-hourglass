import { nextRandom } from './rng';
import type { Element } from './types';

// 試し：並べてつなぐ戦闘（段階156。docs/milestones/M3_battle_review.md の 12.）。今の戦闘（battle.ts）とは別の、試しの仕組み。
// - 敵の予定（行動・狙う相手・動く時刻）は、ラウンドの始めに決まり、計画の前から見えている
// - 仲間は、計画で並べた順に動く。1番目は時刻0に動き、次の仲間は「前の仲間の時刻 + 前の行動の重さ」に動く（時間の予算）。
//   同じ時刻なら仲間が先。ラウンドの長さ（roundLen）を過ぎる時刻には置けない（ねばねばで押し出されて過ぎたら、時間切れで動けない）
// - 札には型がある（置く・受ける・数える・締める）。置く札は、敵に属性の色の印を付ける。
//   印と同じ属性の攻撃が当たると「共鳴」し、同じ印の付いた敵みんなに広がる（調整3。決まりは「同じ色を重ねると広がる」1つだけ）
// - 仲間ごとの専用の札（その人しか使えない）が山札に混ざる。組む2人の専用の札が手札にそろうと、連携技を使える（2人の手番を使う。調整3）
// - 敵ごとに1つの特徴（はじける・すばやい・盾・殻・ねばねば・起こし役・反撃・分裂・時限・逃げる。調整3）
// - 生きている敵が全員ダウンしたら、シャッターで切り取って決着する（ダウンはラウンドの終わりに解ける）
// ダメージに乱数はない（組んだ計画が、思い通りに動くかを読めるように）。乱数は山札と、敵の狙う相手だけ

/** 敵の特徴 */
export type ChainTrait =
  /** はじける：弱点でダウンさせると、破片が仲間全体に当たる */
  | 'pop'
  /** すばやい：1ラウンドに2回動く（行動の at2） */
  | 'swift'
  /** 盾：立っている間（ダウンしていない間）、ほかの敵への単体攻撃を代わりに受ける */
  | 'shield'
  /** 殻：最初の1回は殻が割れるだけで、ダメージもダウンもない */
  | 'shell'
  /** ねばねば：この敵に攻撃を当てた行動の後、まだ動いていない仲間の時刻が stickyDelay 遅れる */
  | 'sticky'
  /** 起こし役：動くと、ダウンしているほかの敵を起こす */
  | 'waker'
  /** 反撃：ダウンしていない時に攻撃を受けると、やり返す（1つの行動に1回） */
  | 'counter'
  /** 分裂：倒すと、小さい2体（splitInto）に分かれる */
  | 'split'
  /** 時限：ラウンドの終わりごとに数が1減り、0になると大爆発して消える */
  | 'timer'
  /** 逃げる：「逃げる」の行動（flee）が動くと、戦闘からいなくなる */
  | 'flee';

/** 札・技の型（表示と説明のため。効き目は effect で決まる） */
export type ChainMoveType = 'place' | 'receive' | 'count' | 'finish' | 'attack' | 'support' | 'link';

export type ChainEffect =
  /**
   * ダメージ。perActed：このラウンドにもう動いた仲間1人ごとに威力を足す。hitsPerActed：もう動いた仲間の数 + 1 回当てる。
   * downMult：ダウン中の敵への倍率。perMark：相手の印1つごとに威力を足し、印を消す。bestOf：敵ごとに一番効く属性を選ぶ
   */
  | { kind: 'damage'; element: Element; power: number; perActed?: number; hitsPerActed?: boolean; downMult?: number; perMark?: number; ignoreResist?: boolean; bestOf?: Element[] }
  /** 重ね撮り：直前に動いた仲間の攻撃と同じ属性で当てる。直前が攻撃なら威力 × mult（攻撃でなければ物理） */
  | { kind: 'layer'; power: number; mult: number }
  /** 追い風：直前に動いた仲間の攻撃（属性と威力）を、威力 × rate で敵全体にもう一度。直前が攻撃でなければ不発 */
  | { kind: 'wind'; rate: number }
  /** 印を付ける（属性の色）。power があれば、その属性で小さく当てる */
  | { kind: 'mark'; element: Element; power?: number }
  | { kind: 'heal'; power: number };

export interface ChainMove {
  id: string;
  name: string;
  type: ChainMoveType;
  /** 重さ（時刻の目盛りをいくつ使うか） */
  weight: number;
  target: 'enemy' | 'enemies' | 'allies';
  effect: ChainEffect;
  /** 短い説明（画面に出す） */
  text: string;
  /** 専用の札：この仲間（id）しか使えない */
  owner?: string;
}

export interface ChainAllyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  mag: number;
  def: number;
  moves: ChainMove[];
}

export interface ChainEnemyMove {
  id: string;
  name: string;
  /** 動く時刻 */
  at: number;
  /** すばやい敵の、2回目の時刻 */
  at2?: number;
  all?: boolean;
  element: Element;
  power: number;
  /** 逃げる：動くと戦闘からいなくなる（ダメージはない） */
  flee?: boolean;
}

export interface ChainEnemyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  weak: Element[];
  resist: Element[];
  trait?: ChainTrait;
  /** 行動の癖。ラウンドごとに順にくり返す */
  pattern: ChainEnemyMove[];
  /** 分裂：倒すと出てくる敵（2体） */
  splitInto?: ChainEnemyDef;
  /** 時限：始めの数（ラウンドの終わりごとに1減る） */
  timer?: number;
}

/** 連携技：組む2人（members）の専用の札（cards）が手札にそろうと使える。2人の手番を使う */
export interface ChainLinkDef {
  id: string;
  members: [string, string];
  cards: [string, string];
  move: ChainMove;
}

export interface ChainRules {
  roundLen: number;
  handSize: number;
  weakMult: number;
  resistMult: number;
  /** はじける敵の破片が、仲間1人に当たるダメージ */
  popDamage: number;
  /** ねばねば：まだ動いていない仲間の時刻が遅れる数 */
  stickyDelay: number;
  /** 反撃の威力（敵の攻撃で計算） */
  counterPower: number;
  /** 時限の大爆発が、仲間1人に当たるダメージ */
  timerDamage: number;
  /** 回復量 = 威力 × 魔力 ÷ この値 */
  healDiv: number;
}

export interface ChainBattleDef {
  id: string;
  name: string;
  allies: ChainAllyDef[];
  enemies: ChainEnemyDef[];
  /** 山札（札の id の並び） */
  deck: string[];
  cards: Record<string, ChainMove>;
  links: ChainLinkDef[];
}

export interface ChainUnit {
  uid: string;
  defId: string;
  name: string;
  side: 'ally' | 'enemy';
  hp: number;
  maxHp: number;
  atk: number;
  mag: number;
  def: number;
  weak: Element[];
  resist: Element[];
  trait?: ChainTrait;
  /** 付いている印（属性の色） */
  marks: Element[];
  down: boolean;
  /** 行動の癖の何番目か */
  step: number;
  /** 殻がまだ割れていない */
  shell?: boolean;
  /** 時限の残り */
  timer?: number;
  /** 逃げた（もう戦闘にいない） */
  gone?: boolean;
}

/** 敵の予定（ラウンドの始めに決まる） */
export interface ChainIntent {
  enemy: string;
  move: ChainEnemyMove;
  at: number;
  /** 単体の時にねらう仲間 */
  target?: string;
}

export type ChainSource =
  | { kind: 'card'; index: number }
  | { kind: 'move'; moveId: string }
  /** 連携技。cards は使う2枚の専用の札の、手札の位置 */
  | { kind: 'link'; linkId: string; cards: [number, number] };

/** 計画の1行（仲間1人の行動。連携技は、組む2人のうち1人目を ally に書く） */
export interface ChainPlanStep {
  ally: string;
  source: ChainSource;
  target?: string;
}

export type ChainEvent =
  | { type: 'act'; uid: string; name: string; at: number }
  | { type: 'cancel'; uid: string; reason: 'down' | 'dead' | 'time' }
  | { type: 'damage'; from: string; to: string; amount: number; weak: boolean; resist: boolean }
  | { type: 'heal'; to: string; amount: number }
  | { type: 'mark'; to: string; element: Element }
  /** 共鳴：印と同じ属性が当たり、同じ印の敵みんなに広がった */
  | { type: 'resonate'; element: Element; from: string; to: string[] }
  | { type: 'pop'; uid: string }
  | { type: 'cover'; shield: string; from: string }
  | { type: 'shellBreak'; uid: string }
  | { type: 'sticky'; uid: string; delay: number }
  | { type: 'wake'; uid: string; woke: string[] }
  | { type: 'counter'; uid: string; to: string }
  | { type: 'split'; uid: string; into: string[] }
  | { type: 'timerTick'; uid: string; left: number }
  | { type: 'timerBlast'; uid: string }
  | { type: 'flee'; uid: string }
  | { type: 'down'; uid: string }
  | { type: 'stand'; uid: string }
  | { type: 'defeat'; uid: string }
  | { type: 'fizzle'; uid: string }
  | { type: 'link'; name: string; uids: string[] }
  | { type: 'shutterReady' };

export interface ChainState {
  def: ChainBattleDef;
  rules: ChainRules;
  round: number;
  allies: ChainUnit[];
  enemies: ChainUnit[];
  deck: string[];
  hand: string[];
  discard: string[];
  intents: ChainIntent[];
  rng: number;
  /** このラウンドに、ねばねばで遅れた時刻の合計（まだ動いていない仲間に効く） */
  timeShift: number;
  /** このラウンドに動いた仲間の、本当に動いた時刻（計画の何行目か → 時刻） */
  actedAt: Record<number, number>;
  /** 生きている敵が全員ダウンした（シャッターを押せば決着） */
  shutter: boolean;
  outcome: 'ongoing' | 'win' | 'lose';
  /** 決着の仕方 */
  finish?: 'shutter' | 'defeat';
  /** 決着したラウンド */
  finishRound?: number;
}

/** 実行の1コマ（仲間か敵の1回の行動、ラウンドの終わりの時限）。画面はこの順に見せる */
export interface ChainFrame {
  /** 何番目のコマか（1から） */
  order: number;
  /** どの予定のコマか（chainOrder の key と同じ。ラウンドの終わりの時限は 'end:uid'） */
  key: string;
  /** ねらった相手（単体の行動だけ） */
  target?: string;
  all?: boolean;
  at: number;
  uid: string;
  name: string;
  events: ChainEvent[];
  state: ChainState;
}

// ---------- 作る・写す ----------

function rand(s: ChainState): number {
  const [v, n] = nextRandom(s.rng);
  s.rng = n;
  return v;
}

function shuffle(s: ChainState, list: string[]): string[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cloneUnit(u: ChainUnit): ChainUnit {
  return { ...u, marks: [...u.marks] };
}

export function cloneChain(s: ChainState): ChainState {
  return {
    ...s,
    allies: s.allies.map(cloneUnit),
    enemies: s.enemies.map(cloneUnit),
    deck: [...s.deck],
    hand: [...s.hand],
    discard: [...s.discard],
    intents: s.intents.map((i) => ({ ...i })),
    actedAt: { ...s.actedAt },
  };
}

function draw(s: ChainState): void {
  if (s.deck.length === 0) {
    if (s.discard.length === 0) return;
    s.deck = shuffle(s, s.discard);
    s.discard = [];
  }
  const c = s.deck.shift();
  if (c) s.hand.push(c);
}

/** 敵の定義から、戦闘の中の敵を作る */
function enemyUnit(d: ChainEnemyDef, uid: string): ChainUnit {
  return {
    uid,
    defId: d.id,
    name: d.name,
    side: 'enemy',
    hp: d.hp,
    maxHp: d.hp,
    atk: d.atk,
    mag: d.atk,
    def: d.def,
    weak: [...d.weak],
    resist: [...d.resist],
    trait: d.trait,
    marks: [],
    down: false,
    step: 0,
    shell: d.trait === 'shell' ? true : undefined,
    timer: d.trait === 'timer' ? (d.timer ?? 3) : undefined,
  };
}

/** 敵の定義（分裂で出てきた敵も探す） */
export function chainEnemyDef(s: ChainState, defId: string): ChainEnemyDef | undefined {
  for (const d of s.def.enemies) {
    if (d.id === defId) return d;
    if (d.splitInto?.id === defId) return d.splitInto;
  }
  return undefined;
}

/** 敵の予定を決める（行動は癖の順。単体はねらう仲間を乱数で。すばやい敵は2つ） */
function planIntents(s: ChainState): void {
  const allies = s.allies.filter((a) => a.hp > 0);
  s.intents = [];
  for (const e of living(s.enemies)) {
    const d = chainEnemyDef(s, e.defId);
    if (!d) continue;
    const move = d.pattern[e.step % d.pattern.length];
    const pick = () => (move.all || move.flee || allies.length === 0 ? undefined : allies[Math.floor(rand(s) * allies.length)].uid);
    s.intents.push({ enemy: e.uid, move, at: move.at, target: pick() });
    if (move.at2 !== undefined) s.intents.push({ enemy: e.uid, move, at: move.at2, target: pick() });
  }
}

export function createChainBattle(def: ChainBattleDef, rules: ChainRules, seed: number): ChainState {
  const s: ChainState = {
    def,
    rules,
    round: 1,
    allies: def.allies.map((d) => ({ uid: d.id, defId: d.id, name: d.name, side: 'ally', hp: d.hp, maxHp: d.hp, atk: d.atk, mag: d.mag, def: d.def, weak: [], resist: [], marks: [], down: false, step: 0 })),
    enemies: def.enemies.map((d, i) => enemyUnit(d, `${d.id}#${i}`)),
    deck: [],
    hand: [],
    discard: [],
    intents: [],
    rng: seed >>> 0,
    timeShift: 0,
    actedAt: {},
    shutter: false,
    outcome: 'ongoing',
  };
  s.deck = shuffle(s, def.deck);
  for (let i = 0; i < rules.handSize; i++) draw(s);
  planIntents(s);
  return s;
}

export function findChainUnit(s: ChainState, uid: string): ChainUnit | undefined {
  return s.allies.find((u) => u.uid === uid) ?? s.enemies.find((u) => u.uid === uid);
}

/** 戦闘にいる敵（倒れていない・逃げていない） */
function living(list: ChainUnit[]): ChainUnit[] {
  return list.filter((u) => u.hp > 0 && !u.gone);
}

// ---------- 計画 ----------

/** 計画の1行の行動。使えなければ null */
export function chainMoveOf(s: ChainState, step: ChainPlanStep): ChainMove | null {
  const src = step.source;
  if (src.kind === 'card') {
    const id = s.hand[src.index];
    return id ? (s.def.cards[id] ?? null) : null;
  }
  if (src.kind === 'link') return s.def.links.find((l) => l.id === src.linkId)?.move ?? null;
  const ally = s.def.allies.find((a) => a.id === findChainUnit(s, step.ally)?.defId);
  return ally?.moves.find((m) => m.id === src.moveId) ?? null;
}

/** 計画の1行で動く仲間（連携技は2人） */
export function stepAllies(s: ChainState, step: ChainPlanStep): string[] {
  if (step.source.kind !== 'link') return [step.ally];
  const link = s.def.links.find((l) => l.id === (step.source as { linkId: string }).linkId);
  return link ? link.members.map((m) => s.allies.find((a) => a.defId === m)?.uid ?? m) : [step.ally];
}

/** 計画の行で使う、手札の位置 */
function stepCards(step: ChainPlanStep): number[] {
  if (step.source.kind === 'card') return [step.source.index];
  if (step.source.kind === 'link') return [...step.source.cards];
  return [];
}

/** 計画の行ごとの動く時刻（1番目は0、次は前の時刻 + 前の行動の重さ） */
export function planStarts(s: ChainState, plan: ChainPlanStep[]): number[] {
  const out: number[] = [];
  let t = 0;
  for (const step of plan) {
    out.push(t);
    t += chainMoveOf(s, step)?.weight ?? 0;
  }
  return out;
}

/** 次に並べる仲間の時刻 */
export function nextStart(s: ChainState, plan: ChainPlanStep[]): number {
  if (plan.length === 0) return 0;
  const starts = planStarts(s, plan);
  return starts[starts.length - 1] + (chainMoveOf(s, plan[plan.length - 1])?.weight ?? 0);
}

/** 今の計画の続きで使える連携技（組む2人が生きていて、まだ並べておらず、2人の専用の札が手札にある） */
export function availableLinks(s: ChainState, plan: ChainPlanStep[]): { link: ChainLinkDef; cards: [number, number] }[] {
  const usedCards = new Set(plan.flatMap(stepCards));
  const usedAllies = new Set(plan.flatMap((p) => stepAllies(s, p)));
  const out: { link: ChainLinkDef; cards: [number, number] }[] = [];
  for (const link of s.def.links) {
    const uids = link.members.map((m) => s.allies.find((a) => a.defId === m));
    if (uids.some((u) => !u || u.hp <= 0 || usedAllies.has(u.uid))) continue;
    const a = s.hand.findIndex((c, i) => c === link.cards[0] && !usedCards.has(i));
    const b = s.hand.findIndex((c, i) => c === link.cards[1] && !usedCards.has(i) && i !== a);
    if (a >= 0 && b >= 0) out.push({ link, cards: [a, b] });
  }
  return out;
}

/** 計画の最後に step を足せない理由（足せれば null） */
export function chainPlanError(s: ChainState, plan: ChainPlanStep[], step: ChainPlanStep): string | null {
  if (s.outcome !== 'ongoing' || s.shutter) return '戦闘は終わっている';
  const usedAllies = new Set(plan.flatMap((p) => stepAllies(s, p)));
  for (const uid of stepAllies(s, step)) {
    const ally = s.allies.find((a) => a.uid === uid);
    if (!ally || ally.hp <= 0) return '動ける仲間ではない';
    if (usedAllies.has(uid)) return `${ally.name}は、もう並べた`;
  }
  const usedCards = new Set(plan.flatMap(stepCards));
  for (const idx of stepCards(step)) {
    if (!s.hand[idx]) return 'その札は手札にない';
    if (usedCards.has(idx)) return 'その札は、もう使う予定';
  }
  if (step.source.kind === 'link') {
    const src = step.source;
    const ok = availableLinks(s, plan).some((x) => x.link.id === src.linkId && x.cards[0] === src.cards[0] && x.cards[1] === src.cards[1]);
    if (!ok) return '連携技は、組む2人の専用の札がそろっている時だけ';
  }
  const move = chainMoveOf(s, step);
  if (!move) return 'その行動は使えない';
  const me = s.allies.find((a) => a.uid === step.ally);
  if (move.owner && step.source.kind === 'card' && me?.defId !== move.owner) return `${s.def.allies.find((a) => a.id === move.owner)?.name ?? ''}の専用の札`;
  if (move.target === 'enemy') {
    const t = s.enemies.find((e) => e.uid === step.target);
    if (!t || t.hp <= 0 || t.gone) return '相手の敵を選ぶ';
  }
  const at = nextStart(s, plan);
  if (at >= s.rules.roundLen) return `時刻${at}は、このラウンドに入らない（${s.rules.roundLen - 1}まで）`;
  return null;
}

/** 計画の置く札で付く予定の印（敵ごと。今付いている印は含まない） */
export function plannedMarks(s: ChainState, plan: ChainPlanStep[]): Record<string, Element[]> {
  const out: Record<string, Element[]> = {};
  for (const step of plan) {
    const m = chainMoveOf(s, step);
    if (!m || m.effect.kind !== 'mark') continue;
    const el = m.effect.element;
    const targets = m.target === 'enemies' ? living(s.enemies).map((e) => e.uid) : step.target ? [step.target] : [];
    for (const t of targets) (out[t] ??= []).includes(el) || out[t].push(el);
  }
  return out;
}

// ---------- 実行 ----------

function affinity(s: ChainState, e: ChainUnit, el: Element, ignoreResist = false): { mult: number; weak: boolean; resist: boolean } {
  if (e.weak.includes(el)) return { mult: s.rules.weakMult, weak: true, resist: false };
  if (!ignoreResist && e.resist.includes(el)) return { mult: s.rules.resistMult, weak: false, resist: true };
  return { mult: 1, weak: false, resist: false };
}

function bestElement(s: ChainState, e: ChainUnit, list: Element[]): Element {
  return [...list].sort((a, b) => affinity(s, e, b).mult - affinity(s, e, a).mult)[0];
}

/** 1つの行動の中で、1回だけ起きることの覚え（反撃・ねばねば） */
interface ActCtx {
  countered: Set<string>;
  stuck: boolean;
}

interface HitOpts {
  ignoreResist?: boolean;
  downMult?: number;
  /** 共鳴を起こさない（共鳴で広がった先） */
  noChain?: boolean;
}

function knockDown(s: ChainState, e: ChainUnit, ev: ChainEvent[]): void {
  if (e.down || e.hp <= 0) return;
  e.down = true;
  ev.push({ type: 'down', uid: e.uid });
  if (e.trait === 'pop') {
    ev.push({ type: 'pop', uid: e.uid });
    for (const a of living(s.allies)) hurtAlly(e.uid, a, s.rules.popDamage, ev);
  }
}

function hurtAlly(from: string, a: ChainUnit, amount: number, ev: ChainEvent[]): void {
  if (a.hp <= 0) return;
  a.hp = Math.max(0, a.hp - amount);
  ev.push({ type: 'damage', from, to: a.uid, amount, weak: false, resist: false });
  if (a.hp === 0) ev.push({ type: 'defeat', uid: a.uid });
}

/** 倒れた敵の後始末（分裂は2体に分かれる） */
function defeatEnemy(s: ChainState, e: ChainUnit, ev: ChainEvent[]): void {
  e.down = false;
  e.marks = [];
  ev.push({ type: 'defeat', uid: e.uid });
  const into = e.trait === 'split' ? chainEnemyDef(s, e.defId)?.splitInto : undefined;
  if (into) {
    const kids = [enemyUnit(into, `${e.uid}a`), enemyUnit(into, `${e.uid}b`)];
    s.enemies.splice(s.enemies.indexOf(e) + 1, 0, ...kids);
    ev.push({ type: 'split', uid: e.uid, into: kids.map((k) => k.uid) });
  }
}

/** 仲間の攻撃を、敵1体に1回当てる */
function hitEnemy(s: ChainState, actor: ChainUnit, e: ChainUnit, el: Element, power: number, opts: HitOpts, ctx: ActCtx, ev: ChainEvent[]): void {
  if (e.hp <= 0 || e.gone) return;
  // 殻：最初の1回は割れるだけ
  if (e.shell) {
    e.shell = false;
    ev.push({ type: 'shellBreak', uid: e.uid });
    return;
  }
  const stat = el === 'physical' ? actor.atk : actor.mag;
  const aff = affinity(s, e, el, opts.ignoreResist);
  const mult = aff.mult * (e.down && opts.downMult ? opts.downMult : 1);
  const amount = Math.max(1, Math.floor(((power * stat) / Math.max(1, e.def)) * mult));
  // 共鳴：印と同じ属性が当たると、同じ印の敵みんなに広がる（印は消える）
  const resonate = !opts.noChain && e.marks.includes(el);
  e.hp = Math.max(0, e.hp - amount);
  ev.push({ type: 'damage', from: actor.uid, to: e.uid, amount, weak: aff.weak, resist: aff.resist });
  if (e.hp === 0) defeatEnemy(s, e, ev);
  else if (aff.weak) knockDown(s, e, ev);
  // ねばねば：この行動の後、まだ動いていない仲間が遅れる
  if (e.trait === 'sticky' && !ctx.stuck) {
    ctx.stuck = true;
    s.timeShift += s.rules.stickyDelay;
    ev.push({ type: 'sticky', uid: e.uid, delay: s.rules.stickyDelay });
  }
  // 反撃：ダウンしていない時に受けると、やり返す
  if (e.trait === 'counter' && e.hp > 0 && !e.down && !ctx.countered.has(e.uid)) {
    ctx.countered.add(e.uid);
    ev.push({ type: 'counter', uid: e.uid, to: actor.uid });
    hurtAlly(e.uid, actor, Math.max(1, Math.floor((s.rules.counterPower * e.atk) / Math.max(1, actor.def))), ev);
  }
  if (resonate) {
    const others = living(s.enemies).filter((x) => x.uid !== e.uid && x.marks.includes(el));
    e.marks = e.marks.filter((m) => m !== el);
    for (const x of others) x.marks = x.marks.filter((m) => m !== el);
    ev.push({ type: 'resonate', element: el, from: e.uid, to: others.map((x) => x.uid) });
    for (const x of others) hitEnemy(s, actor, x, el, power, { ...opts, noChain: true }, ctx, ev);
  }
}

/** このラウンドに、直前に動いた仲間の行動 */
interface PrevAct {
  ally: string;
  element: Element | null;
  power: number;
}

/** 単体攻撃の相手（倒れていたら向け直す。盾が立っていれば盾が受ける） */
function singleTarget(s: ChainState, target: string | undefined, ev: ChainEvent[], actor: string): ChainUnit | undefined {
  const t = s.enemies.find((e) => e.uid === target && e.hp > 0 && !e.gone) ?? living(s.enemies)[0];
  if (!t) return undefined;
  const shield = living(s.enemies).find((e) => e.trait === 'shield' && !e.down && e.uid !== t.uid);
  if (shield) {
    ev.push({ type: 'cover', shield: shield.uid, from: actor });
    return shield;
  }
  return t;
}

function doAllyMove(s: ChainState, actor: ChainUnit, move: ChainMove, target: string | undefined, prev: PrevAct | null, acted: number, ev: ChainEvent[]): PrevAct {
  const eff = move.effect;
  const ctx: ActCtx = { countered: new Set(), stuck: false };
  const targets = (): ChainUnit[] => (move.target === 'enemies' ? living(s.enemies) : [singleTarget(s, target, ev, actor.uid)].filter((x): x is ChainUnit => !!x));
  if (eff.kind === 'heal') {
    for (const a of s.allies.filter((x) => x.hp > 0)) {
      const amount = Math.min(a.maxHp - a.hp, Math.floor((eff.power * actor.mag) / s.rules.healDiv));
      a.hp += amount;
      ev.push({ type: 'heal', to: a.uid, amount });
    }
    return { ally: actor.uid, element: null, power: 0 };
  }
  if (eff.kind === 'mark') {
    for (const e of targets()) {
      if (eff.power) hitEnemy(s, actor, e, eff.element, eff.power, { noChain: true }, ctx, ev);
      if (e.hp <= 0) continue;
      if (!e.marks.includes(eff.element)) e.marks.push(eff.element);
      ev.push({ type: 'mark', to: e.uid, element: eff.element });
    }
    return { ally: actor.uid, element: eff.power ? eff.element : null, power: eff.power ?? 0 };
  }
  if (eff.kind === 'wind') {
    if (!prev || prev.element === null) {
      ev.push({ type: 'fizzle', uid: actor.uid });
      return { ally: actor.uid, element: null, power: 0 };
    }
    const power = Math.max(1, Math.round(prev.power * eff.rate));
    for (const e of living(s.enemies)) hitEnemy(s, actor, e, prev.element, power, {}, ctx, ev);
    return { ally: actor.uid, element: prev.element, power };
  }
  if (eff.kind === 'layer') {
    const el = prev?.element ?? 'physical';
    const power = prev?.element ? eff.power * eff.mult : eff.power;
    for (const e of targets()) hitEnemy(s, actor, e, el, power, {}, ctx, ev);
    return { ally: actor.uid, element: el, power };
  }
  // damage
  const power = eff.power + (eff.perActed ?? 0) * acted;
  const hits = eff.hitsPerActed ? acted + 1 : 1;
  for (const e of targets()) {
    const el = eff.bestOf ? bestElement(s, e, eff.bestOf) : eff.element;
    let p = power;
    if (eff.perMark) {
      p += eff.perMark * e.marks.length;
      e.marks = [];
    }
    for (let k = 0; k < hits && e.hp > 0; k++) hitEnemy(s, actor, e, el, p, { ignoreResist: eff.ignoreResist, downMult: eff.downMult }, ctx, ev);
  }
  return { ally: actor.uid, element: eff.element, power };
}

function doEnemyMove(s: ChainState, e: ChainUnit, intent: ChainIntent, ev: ChainEvent[]): void {
  const m = intent.move;
  if (m.flee) {
    e.gone = true;
    e.down = false;
    ev.push({ type: 'flee', uid: e.uid });
    return;
  }
  const allies = s.allies.filter((a) => a.hp > 0);
  const targets = m.all ? allies : [s.allies.find((a) => a.uid === intent.target && a.hp > 0) ?? allies[0]].filter((x): x is ChainUnit => !!x);
  for (const a of targets) hurtAlly(e.uid, a, Math.max(1, Math.floor((m.power * e.atk) / Math.max(1, a.def))), ev);
  // 起こし役：ダウンしているほかの敵を起こす
  if (e.trait === 'waker') {
    const woke = living(s.enemies).filter((x) => x.down && x.uid !== e.uid);
    for (const x of woke) x.down = false;
    if (woke.length) ev.push({ type: 'wake', uid: e.uid, woke: woke.map((x) => x.uid) });
  }
}

function checkEnd(s: ChainState, ev: ChainEvent[]): boolean {
  if (s.allies.every((a) => a.hp <= 0)) {
    s.outcome = 'lose';
    s.finishRound = s.round;
    return true;
  }
  const foes = living(s.enemies);
  if (foes.length === 0) {
    s.outcome = 'win';
    s.finish = 'defeat';
    s.finishRound = s.round;
    return true;
  }
  if (foes.every((e) => e.down)) {
    s.shutter = true;
    ev.push({ type: 'shutterReady' });
    return true;
  }
  return false;
}

/** 動く順番の1つ（仲間なら計画の何行目か、敵なら予定）。key は実行のコマと同じ */
export type ChainOrderEntry = { at: number; key: string; kind: 'ally'; i: number } | { at: number; key: string; kind: 'enemy'; intent: ChainIntent };

/** 早い時刻から。同じ時刻なら仲間が先、仲間どうしは並べた順、敵どうしは予定の順 */
function byTime(a: ChainOrderEntry, b: ChainOrderEntry): number {
  return a.at - b.at || (a.kind === b.kind ? 0 : a.kind === 'ally' ? -1 : 1);
}

/** このラウンドに動く順番（計画の時の見込み。ねばねばで遅れると、実行の時に変わる）。画面の番号もこれで出す */
export function chainOrder(s: ChainState, plan: ChainPlanStep[]): ChainOrderEntry[] {
  const starts = planStarts(s, plan);
  const queue: ChainOrderEntry[] = [
    ...plan.map((_, i) => ({ at: starts[i], key: `a${i}`, kind: 'ally' as const, i })),
    ...s.intents.map((intent, k) => ({ at: intent.at, key: `e${k}`, kind: 'enemy' as const, intent })),
  ];
  return queue.sort(byTime);
}

/**
 * ラウンドを実行する。計画の順と敵の予定の時刻で1つずつ動き、コマ（frames）を返す。
 * 全員ダウン（シャッター）か決着で途中で止まる。最後まで動けば、時限を進め、ラウンドの終わり（ダウンが解け、手札を補充し、次の予定を決める）まで進めた状態を返す
 */
export function runChainRound(s0: ChainState, plan: ChainPlanStep[]): { state: ChainState; frames: ChainFrame[] } {
  const s = cloneChain(s0);
  s.timeShift = 0;
  s.actedAt = {};
  const frames: ChainFrame[] = [];
  // 使う札は、手札から場へ（倒れて動けなかった仲間の札は、手札に戻す）
  const moves = plan.map((p) => chainMoveOf(s0, p));
  const cardIds = plan.map((p) => stepCards(p).map((i) => s0.hand[i]));
  const usedIdx = new Set(plan.flatMap(stepCards));
  s.hand = s0.hand.filter((_, i) => !usedIdx.has(i));
  // 順番は、動くたびに選び直す（ねばねばで、まだ動いていない仲間の時刻が遅れるため）
  const pending = chainOrder(s0, plan);
  const allyAt = (q: ChainOrderEntry) => (q.kind === 'ally' ? q.at + s.timeShift : q.at);
  let prev: PrevAct | null = null;
  let acted = 0;
  let stopped = false;
  const push = (q: ChainOrderEntry | null, key: string, at: number, uid: string, name: string, ev: ChainEvent[], target?: string, all?: boolean) =>
    frames.push({ order: frames.length + 1, key: q?.key ?? key, target, all, at, uid, name, events: ev, state: cloneChain(s) });
  while (pending.length > 0) {
    pending.sort((a, b) => allyAt(a) - allyAt(b) || byTime(a, b));
    const q = pending.shift()!;
    const ev: ChainEvent[] = [];
    if (q.kind === 'ally') {
      const step = plan[q.i];
      const at = allyAt(q);
      const actors = stepAllies(s, step).map((u) => s.allies.find((a) => a.uid === u)!);
      const actor = actors[0];
      const move = moves[q.i];
      if (actors.some((a) => a.hp <= 0) || !move || at >= s.rules.roundLen) {
        s.hand.push(...cardIds[q.i]);
        ev.push({ type: 'cancel', uid: actor.uid, reason: at >= s.rules.roundLen ? 'time' : 'dead' });
        push(q, '', at, actor.uid, move?.name ?? '', ev, step.target, move?.target !== 'enemy');
        continue;
      }
      s.discard.push(...cardIds[q.i]);
      s.actedAt[q.i] = at;
      ev.push({ type: 'act', uid: actor.uid, name: move.name, at });
      if (step.source.kind === 'link') ev.push({ type: 'link', name: move.name, uids: actors.map((a) => a.uid) });
      // 連携技は2人の攻撃・魔力の平均で
      const doer = actors.length > 1 ? { ...actor, atk: Math.round((actors[0].atk + actors[1].atk) / 2), mag: Math.round((actors[0].mag + actors[1].mag) / 2) } : actor;
      prev = doAllyMove(s, doer, move, step.target, prev, acted, ev);
      // 連携技の計算用に写した仲間のダメージ（反撃・破片）は、1人目に戻す
      if (doer !== actor) actor.hp = Math.min(actor.hp, doer.hp);
      acted += actors.length;
      push(q, '', at, actor.uid, move.name, ev, step.target, move.target !== 'enemy');
    } else {
      const e = s.enemies.find((x) => x.uid === q.intent.enemy)!;
      if (e.hp <= 0 || e.gone) continue;
      if (e.down) {
        ev.push({ type: 'cancel', uid: e.uid, reason: 'down' });
        push(q, '', q.at, e.uid, q.intent.move.name, ev, q.intent.target, q.intent.move.all);
        continue;
      }
      ev.push({ type: 'act', uid: e.uid, name: q.intent.move.name, at: q.at });
      doEnemyMove(s, e, q.intent, ev);
      push(q, '', q.at, e.uid, q.intent.move.name, ev, q.intent.target, q.intent.move.all);
    }
    if (checkEnd(s, frames[frames.length - 1].events)) {
      frames[frames.length - 1].state = cloneChain(s);
      stopped = true;
      break;
    }
  }
  if (!stopped) {
    // 時限：ラウンドの終わりに1減り、0で大爆発
    for (const e of living(s.enemies).filter((x) => x.trait === 'timer' && x.timer !== undefined)) {
      const ev: ChainEvent[] = [];
      e.timer = e.timer! - 1;
      ev.push({ type: 'timerTick', uid: e.uid, left: e.timer });
      if (e.timer <= 0) {
        ev.push({ type: 'timerBlast', uid: e.uid });
        for (const a of s.allies.filter((x) => x.hp > 0)) hurtAlly(e.uid, a, s.rules.timerDamage, ev);
        e.gone = true;
      }
      push(null, `end:${e.uid}`, s.rules.roundLen - 1, e.uid, e.timer <= 0 ? '大爆発' : `あと${e.timer}`, ev, undefined, true);
      if (checkEnd(s, ev)) {
        frames[frames.length - 1].state = cloneChain(s);
        stopped = true;
        break;
      }
    }
  }
  if (!stopped) endRound(s);
  return { state: s, frames };
}

/** ラウンドの終わり：ダウンが解け、癖を1つ進め、手札を補充して、次の予定を決める */
function endRound(s: ChainState): void {
  for (const e of s.enemies) {
    e.down = false;
    e.step++;
  }
  s.round++;
  s.timeShift = 0;
  s.actedAt = {};
  while (s.hand.length < s.rules.handSize && (s.deck.length > 0 || s.discard.length > 0)) draw(s);
  planIntents(s);
}

/** シャッターを押す（全員ダウンの時だけ）：その瞬間を切り取って決着 */
export function takeShutter(s0: ChainState): ChainState {
  if (!s0.shutter || s0.outcome !== 'ongoing') return s0;
  const s = cloneChain(s0);
  s.shutter = false;
  s.outcome = 'win';
  s.finish = 'shutter';
  s.finishRound = s.round;
  return s;
}

/** シャッターで決着した時の撮れ高（1ラウンド目なら3、2ラウンド目なら2、それより後は1。全部倒した時は0） */
export function shutterGrade(s: ChainState): number {
  if (s.finish !== 'shutter' || !s.finishRound) return 0;
  return s.finishRound <= 1 ? 3 : s.finishRound === 2 ? 2 : 1;
}
