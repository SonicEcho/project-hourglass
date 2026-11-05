import { nextRandom } from './rng';
import type { Element } from './types';

// 試し：並べてつなぐ戦闘（段階156。docs/milestones/M3_battle_review.md の 12.）。今の戦闘（battle.ts）とは別の、試しの仕組み。
// - 敵の予定（行動・狙う相手・動く時刻）は、ラウンドの始めに決まり、計画の前から見えている
// - 仲間は、計画で並べた順に動く。1番目は時刻0に動き、次の仲間は「前の仲間の時刻 + 前の行動の重さ」に動く（時間の予算）。
//   同じ時刻なら仲間が先。ラウンドの長さ（roundLen）を過ぎる時刻には置けない
// - 札には型がある（置く・受ける・数える・締める）。前に動いた仲間の行動や、敵に付いた印で、効き目が変わる
// - 敵ごとに1つの特徴（かたい・予告・はじける・鏡）
// - 決まった2人が続けて動くと（間に敵が動かなければ）、後の人が連携技を使える
// - 生きている敵が全員ダウンしたら、シャッターで切り取って決着する（ダウンはラウンドの終わりに解ける）
// ダメージに乱数はない（組んだ計画が、思い通りに動くかを読めるように）。乱数は山札と、敵の狙う相手だけ

/** 敵に付く印：濡れ（雷が、濡れた敵みんなに伝わる）・油（火で爆発し、敵全体をよろけさせる） */
export type ChainMark = 'wet' | 'oil';

/** 敵の特徴 */
export type ChainTrait =
  /** かたい：弱点でも爆発でもダウンしない。1ラウンドに当たった回数が gearHits に届くとダウン */
  | 'gear'
  /** 予告：大きな全体攻撃を早い時刻に予告する（決まりは行動の表だけ。印として見せる） */
  | 'herald'
  /** はじける：弱点でダウンすると、破片が仲間全体に当たる */
  | 'pop'
  /** 鏡：濡れていない時に弱点の属性を受けると、ダメージをはね返す（自分は受けず、ダウンもしない） */
  | 'mirror';

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
  /** 印を付ける。power があれば、その属性で小さく当てる */
  | { kind: 'mark'; mark: ChainMark; element?: Element; power?: number }
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
}

export interface ChainAllyDef {
  id: string;
  name: string;
  /** 型の説明（画面に出す） */
  role: string;
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
  all?: boolean;
  element: Element;
  power: number;
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
}

/** 連携技：from の仲間が needs の属性で攻撃し、続けて（間に敵が動かずに）to の仲間が動く時、to が move を使える */
export interface ChainLinkDef {
  id: string;
  from: string;
  to: string;
  needs: Element[];
  move: ChainMove;
}

export interface ChainRules {
  roundLen: number;
  handSize: number;
  weakMult: number;
  resistMult: number;
  /** かたい敵がダウンする、1ラウンドに当たった回数 */
  gearHits: number;
  /** はじける敵の破片が、仲間1人に当たるダメージ */
  popDamage: number;
  /** 爆発の威力（火。使った仲間の魔力で計算） */
  blastPower: number;
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
  marks: ChainMark[];
  down: boolean;
  /** このラウンドに当たった回数（かたい敵） */
  hits: number;
  /** 行動の癖の何番目か */
  step: number;
}

/** 敵の予定（ラウンドの始めに決まる） */
export interface ChainIntent {
  enemy: string;
  move: ChainEnemyMove;
  at: number;
  /** 単体の時にねらう仲間 */
  target?: string;
}

export type ChainSource = { kind: 'card'; index: number } | { kind: 'move'; moveId: string } | { kind: 'link'; linkId: string };

/** 計画の1行（仲間1人の行動） */
export interface ChainPlanStep {
  ally: string;
  source: ChainSource;
  target?: string;
}

export type ChainEvent =
  | { type: 'act'; uid: string; name: string; at: number }
  | { type: 'cancel'; uid: string; reason: 'down' | 'dead' }
  | { type: 'damage'; from: string; to: string; amount: number; weak: boolean; resist: boolean }
  | { type: 'heal'; to: string; amount: number }
  | { type: 'mark'; to: string; mark: ChainMark }
  | { type: 'spread'; from: string }
  | { type: 'blast'; at: string }
  | { type: 'reflect'; from: string; to: string }
  | { type: 'pop'; uid: string }
  | { type: 'down'; uid: string; by: 'weak' | 'blast' | 'gear' }
  | { type: 'defeat'; uid: string }
  | { type: 'fizzle'; uid: string; reason: 'noPrev' | 'linkBroken' }
  | { type: 'link'; name: string; uids: string[] }
  | { type: 'shutterReady' }
  | { type: 'roundEnd'; round: number };

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
  /** 生きている敵が全員ダウンした（シャッターを押せば決着） */
  shutter: boolean;
  outcome: 'ongoing' | 'win' | 'lose';
  /** 決着の仕方 */
  finish?: 'shutter' | 'defeat';
  /** 決着したラウンド */
  finishRound?: number;
}

/** 実行の1コマ（仲間か敵の1回の行動）。画面はこの順に見せる */
export interface ChainFrame {
  /** 動く順番の何番目か（1から。chainOrder の並び） */
  order: number;
  /** ねらった相手（単体の行動だけ） */
  target?: string;
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

/** 敵の予定を決める（行動は癖の順。単体はねらう仲間を乱数で） */
function planIntents(s: ChainState): void {
  const living = s.allies.filter((a) => a.hp > 0);
  s.intents = s.enemies
    .filter((e) => e.hp > 0)
    .map((e) => {
      const d = s.def.enemies.find((x) => x.id === e.defId)!;
      const move = d.pattern[e.step % d.pattern.length];
      const target = move.all || living.length === 0 ? undefined : living[Math.floor(rand(s) * living.length)].uid;
      return { enemy: e.uid, move, at: move.at, target };
    });
}

export function createChainBattle(def: ChainBattleDef, rules: ChainRules, seed: number): ChainState {
  const s: ChainState = {
    def,
    rules,
    round: 1,
    allies: def.allies.map((d) => ({ uid: d.id, defId: d.id, name: d.name, side: 'ally', hp: d.hp, maxHp: d.hp, atk: d.atk, mag: d.mag, def: d.def, weak: [], resist: [], marks: [], down: false, hits: 0, step: 0 })),
    enemies: def.enemies.map((d, i) => ({ uid: `${d.id}#${i}`, defId: d.id, name: d.name, side: 'enemy', hp: d.hp, maxHp: d.hp, atk: d.atk, mag: d.atk, def: d.def, weak: [...d.weak], resist: [...d.resist], trait: d.trait, marks: [], down: false, hits: 0, step: 0 })),
    deck: [],
    hand: [],
    discard: [],
    intents: [],
    rng: seed >>> 0,
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

/** 攻撃の属性（ダメージの行動だけ。重ね撮り・追い風・連携技は、計画の時は分からないので null） */
function attackElement(m: ChainMove): Element | null {
  if (m.effect.kind === 'damage') return m.effect.element;
  if (m.effect.kind === 'mark' && m.effect.power && m.effect.element) return m.effect.element;
  return null;
}

/** その仲間が、計画の今の続きで使える連携技（前の行が組む相手で、属性が合う時） */
export function availableLinks(s: ChainState, plan: ChainPlanStep[], ally: string): ChainLinkDef[] {
  const prev = plan[plan.length - 1];
  if (!prev) return [];
  const prevMove = chainMoveOf(s, prev);
  const prevAlly = findChainUnit(s, prev.ally);
  const me = findChainUnit(s, ally);
  if (!prevMove || !prevAlly || !me) return [];
  const el = attackElement(prevMove);
  return s.def.links.filter((l) => l.from === prevAlly.defId && l.to === me.defId && el !== null && l.needs.includes(el));
}

/** 連携技の2人の間に入る敵の予定（前の時刻 ≦ 敵の時刻 ＜ 後の時刻。同じ時刻なら仲間が先なので、前の時刻と同じ敵は間に入る） */
export function intentsBetween(s: ChainState, from: number, to: number): ChainIntent[] {
  return s.intents.filter((i) => i.at >= from && i.at < to);
}

/** 計画の最後に step を足せない理由（足せれば null） */
export function chainPlanError(s: ChainState, plan: ChainPlanStep[], step: ChainPlanStep): string | null {
  if (s.outcome !== 'ongoing' || s.shutter) return '戦闘は終わっている';
  const ally = s.allies.find((a) => a.uid === step.ally);
  if (!ally || ally.hp <= 0) return '動ける仲間ではない';
  if (plan.some((p) => p.ally === step.ally)) return `${ally.name}は、もう並べた`;
  if (step.source.kind === 'card') {
    const idx = step.source.index;
    if (!s.hand[idx]) return 'その札は手札にない';
    if (plan.some((p) => p.source.kind === 'card' && p.source.index === idx)) return 'その札は、もう使う予定';
  }
  if (step.source.kind === 'link' && !availableLinks(s, plan, step.ally).some((l) => l.id === (step.source as { linkId: string }).linkId)) return '連携技は、組む相手の攻撃のすぐ後にしか置けない';
  const move = chainMoveOf(s, step);
  if (!move) return 'その行動は使えない';
  if (move.target === 'enemy') {
    const t = s.enemies.find((e) => e.uid === step.target);
    if (!t || t.hp <= 0) return '相手の敵を選ぶ';
  }
  const at = nextStart(s, plan);
  if (at >= s.rules.roundLen) return `時刻${at}は、このラウンドに入らない（${s.rules.roundLen - 1}まで）`;
  return null;
}

// ---------- 実行 ----------

function living(list: ChainUnit[]): ChainUnit[] {
  return list.filter((u) => u.hp > 0);
}

function affinity(s: ChainState, e: ChainUnit, el: Element, ignoreResist = false): { mult: number; weak: boolean; resist: boolean } {
  if (e.weak.includes(el)) return { mult: s.rules.weakMult, weak: true, resist: false };
  if (!ignoreResist && e.resist.includes(el)) return { mult: s.rules.resistMult, weak: false, resist: true };
  return { mult: 1, weak: false, resist: false };
}

function bestElement(s: ChainState, e: ChainUnit, list: Element[]): Element {
  return [...list].sort((a, b) => affinity(s, e, b).mult - affinity(s, e, a).mult)[0];
}

interface HitOpts {
  ignoreResist?: boolean;
  downMult?: number;
  /** 濡れの伝わり・爆発を起こさない（伝わった先・爆発の中） */
  noChain?: boolean;
}

/** 敵をダウンさせる（かたい敵は、当たった回数でだけ） */
function knockDown(s: ChainState, e: ChainUnit, by: 'weak' | 'blast' | 'gear', ev: ChainEvent[]): void {
  if (e.down || e.hp <= 0) return;
  if (e.trait === 'gear' && by !== 'gear') return;
  e.down = true;
  ev.push({ type: 'down', uid: e.uid, by });
  if (by === 'weak' && e.trait === 'pop') {
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

/** 仲間の攻撃を、敵1体に1回当てる */
function hitEnemy(s: ChainState, actor: ChainUnit, e: ChainUnit, el: Element, power: number, opts: HitOpts, ev: ChainEvent[]): void {
  if (e.hp <= 0) return;
  const stat = el === 'physical' ? actor.atk : actor.mag;
  const aff = affinity(s, e, el, opts.ignoreResist);
  // 鏡：濡れていない時に弱点を受けると、はね返す
  if (e.trait === 'mirror' && aff.weak && !e.marks.includes('wet')) {
    const amount = Math.max(1, Math.floor((power * stat) / Math.max(1, actor.def) / 2));
    ev.push({ type: 'reflect', from: e.uid, to: actor.uid });
    hurtAlly(e.uid, actor, amount, ev);
    return;
  }
  const mult = aff.mult * (e.down && opts.downMult ? opts.downMult : 1);
  const amount = Math.max(1, Math.floor(((power * stat) / Math.max(1, e.def)) * mult));
  e.hp = Math.max(0, e.hp - amount);
  e.hits++;
  ev.push({ type: 'damage', from: actor.uid, to: e.uid, amount, weak: aff.weak, resist: aff.resist });
  if (e.hp === 0) {
    e.down = false;
    e.marks = [];
    ev.push({ type: 'defeat', uid: e.uid });
  } else {
    if (aff.weak) knockDown(s, e, 'weak', ev);
    if (e.trait === 'gear' && e.hits >= s.rules.gearHits) knockDown(s, e, 'gear', ev);
  }
  if (opts.noChain) return;
  // 濡れた敵に雷：濡れた敵みんなに伝わる（濡れは乾く）
  if (el === 'thunder' && e.marks.includes('wet')) {
    const wet = living(s.enemies).filter((x) => x.marks.includes('wet'));
    ev.push({ type: 'spread', from: e.uid });
    e.marks = e.marks.filter((m) => m !== 'wet');
    for (const x of wet) {
      if (x.uid === e.uid) continue;
      x.marks = x.marks.filter((m) => m !== 'wet');
      hitEnemy(s, actor, x, el, power, { ...opts, noChain: true }, ev);
    }
  }
  // 油の敵に火：爆発。敵全体に火が当たり、まだ立っている敵はよろける（油は燃える）
  if (el === 'fire' && e.marks.includes('oil')) {
    e.marks = e.marks.filter((m) => m !== 'oil');
    ev.push({ type: 'blast', at: e.uid });
    for (const x of living(s.enemies)) {
      const reflected = x.trait === 'mirror' && x.weak.includes('fire') && !x.marks.includes('wet');
      hitEnemy(s, actor, x, 'fire', s.rules.blastPower, { noChain: true }, ev);
      if (!reflected) knockDown(s, x, 'blast', ev);
    }
  }
}

/** このラウンドに、直前に動いた仲間の行動 */
interface PrevAct {
  ally: string;
  element: Element | null;
  power: number;
}

function retarget(s: ChainState, target: string | undefined): ChainUnit | undefined {
  const t = s.enemies.find((e) => e.uid === target && e.hp > 0);
  return t ?? living(s.enemies)[0];
}

function doAllyMove(s: ChainState, actor: ChainUnit, move: ChainMove, target: string | undefined, prev: PrevAct | null, acted: number, ev: ChainEvent[]): PrevAct {
  const eff = move.effect;
  const targets = (): ChainUnit[] => (move.target === 'enemies' ? living(s.enemies) : [retarget(s, target)].filter((x): x is ChainUnit => !!x));
  if (eff.kind === 'heal') {
    for (const a of living(s.allies)) {
      const amount = Math.min(a.maxHp - a.hp, Math.floor((eff.power * actor.mag) / s.rules.healDiv));
      a.hp += amount;
      ev.push({ type: 'heal', to: a.uid, amount });
    }
    return { ally: actor.uid, element: null, power: 0 };
  }
  if (eff.kind === 'mark') {
    for (const e of targets()) {
      if (!e.marks.includes(eff.mark)) e.marks.push(eff.mark);
      ev.push({ type: 'mark', to: e.uid, mark: eff.mark });
      if (eff.power && eff.element) hitEnemy(s, actor, e, eff.element, eff.power, {}, ev);
    }
    return { ally: actor.uid, element: eff.power && eff.element ? eff.element : null, power: eff.power ?? 0 };
  }
  if (eff.kind === 'wind') {
    if (!prev || prev.element === null) {
      ev.push({ type: 'fizzle', uid: actor.uid, reason: 'noPrev' });
      return { ally: actor.uid, element: null, power: 0 };
    }
    const power = Math.max(1, Math.round(prev.power * eff.rate));
    for (const e of living(s.enemies)) hitEnemy(s, actor, e, prev.element, power, {}, ev);
    return { ally: actor.uid, element: prev.element, power };
  }
  if (eff.kind === 'layer') {
    const el = prev?.element ?? 'physical';
    const power = prev?.element ? eff.power * eff.mult : eff.power;
    for (const e of targets()) hitEnemy(s, actor, e, el, power, {}, ev);
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
    for (let k = 0; k < hits && e.hp > 0; k++) hitEnemy(s, actor, e, el, p, { ignoreResist: eff.ignoreResist, downMult: eff.downMult }, ev);
  }
  return { ally: actor.uid, element: eff.element, power };
}

function doEnemyMove(s: ChainState, e: ChainUnit, intent: ChainIntent, ev: ChainEvent[]): void {
  const m = intent.move;
  const targets = m.all ? living(s.allies) : [s.allies.find((a) => a.uid === intent.target && a.hp > 0) ?? living(s.allies)[0]].filter((x): x is ChainUnit => !!x);
  for (const a of targets) hurtAlly(e.uid, a, Math.max(1, Math.floor((m.power * e.atk) / Math.max(1, a.def))), ev);
}

function checkEnd(s: ChainState, ev: ChainEvent[]): boolean {
  if (living(s.allies).length === 0) {
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

/** 動く順番の1つ（仲間なら計画の何行目か、敵なら予定） */
export type ChainOrderEntry = { at: number; kind: 'ally'; i: number } | { at: number; kind: 'enemy'; intent: ChainIntent };

/** このラウンドに動く順番（早い時刻から。同じ時刻なら仲間が先、仲間どうしは並べた順）。画面の番号もこれで出す */
export function chainOrder(s: ChainState, plan: ChainPlanStep[]): ChainOrderEntry[] {
  const starts = planStarts(s, plan);
  const queue: ChainOrderEntry[] = [
    ...plan.map((_, i) => ({ at: starts[i], kind: 'ally' as const, i })),
    ...s.intents.map((intent) => ({ at: intent.at, kind: 'enemy' as const, intent })),
  ];
  return queue.sort((a, b) => a.at - b.at || (a.kind === b.kind ? 0 : a.kind === 'ally' ? -1 : 1));
}

/**
 * ラウンドを実行する。計画の順と敵の予定の時刻で1つずつ動き、コマ（frames）を返す。
 * 全員ダウン（シャッター）か決着で途中で止まる。最後まで動けば、ラウンドの終わり（ダウンが解け、手札を補充し、次の予定を決める）まで進めた状態を返す
 */
export function runChainRound(s0: ChainState, plan: ChainPlanStep[]): { state: ChainState; frames: ChainFrame[] } {
  const s = cloneChain(s0);
  const frames: ChainFrame[] = [];
  // 使う札は、手札から場へ（倒れて動けなかった仲間の札は、手札に戻す）
  const moves = plan.map((p) => chainMoveOf(s0, p));
  const cardIds = plan.map((p) => (p.source.kind === 'card' ? s0.hand[p.source.index] : null));
  const usedIdx = new Set(plan.flatMap((p) => (p.source.kind === 'card' ? [p.source.index] : [])));
  s.hand = s0.hand.filter((_, i) => !usedIdx.has(i));
  const queue = chainOrder(s0, plan);
  let prev: PrevAct | null = null;
  let acted = 0;
  let enemySincePrev = false;
  let stopped = false;
  for (const [qi, q] of queue.entries()) {
    const ev: ChainEvent[] = [];
    if (q.kind === 'ally') {
      const step = plan[q.i];
      const actor = s.allies.find((a) => a.uid === step.ally)!;
      const move = moves[q.i];
      if (actor.hp <= 0 || !move) {
        if (cardIds[q.i]) s.hand.push(cardIds[q.i]!);
        ev.push({ type: 'cancel', uid: actor.uid, reason: 'dead' });
        frames.push({ order: qi + 1, target: plan[q.i].target, at: q.at, uid: actor.uid, name: move?.name ?? '', events: ev, state: cloneChain(s) });
        continue;
      }
      if (cardIds[q.i]) s.discard.push(cardIds[q.i]!);
      ev.push({ type: 'act', uid: actor.uid, name: move.name, at: q.at });
      if (step.source.kind === 'link') {
        const link = s.def.links.find((l) => l.id === (step.source as { linkId: string }).linkId)!;
        const ok = prev !== null && !enemySincePrev && findChainUnit(s, prev.ally)?.defId === link.from && prev.element !== null && link.needs.includes(prev.element);
        if (!ok) {
          ev.push({ type: 'fizzle', uid: actor.uid, reason: 'linkBroken' });
          prev = { ally: actor.uid, element: null, power: 0 };
        } else {
          ev.push({ type: 'link', name: move.name, uids: [prev!.ally, actor.uid] });
          prev = doAllyMove(s, actor, move, step.target, prev, acted, ev);
        }
      } else prev = doAllyMove(s, actor, move, step.target, prev, acted, ev);
      acted++;
      enemySincePrev = false;
      frames.push({ order: qi + 1, target: plan[q.i].target, at: q.at, uid: actor.uid, name: move.name, events: ev, state: cloneChain(s) });
    } else {
      const e = s.enemies.find((x) => x.uid === q.intent.enemy)!;
      if (e.hp <= 0) continue;
      if (e.down) {
        ev.push({ type: 'cancel', uid: e.uid, reason: 'down' });
        frames.push({ order: qi + 1, target: q.intent.target, at: q.at, uid: e.uid, name: q.intent.move.name, events: ev, state: cloneChain(s) });
        continue;
      }
      ev.push({ type: 'act', uid: e.uid, name: q.intent.move.name, at: q.at });
      doEnemyMove(s, e, q.intent, ev);
      enemySincePrev = true;
      frames.push({ order: qi + 1, target: q.intent.target, at: q.at, uid: e.uid, name: q.intent.move.name, events: ev, state: cloneChain(s) });
    }
    if (checkEnd(s, frames[frames.length - 1].events)) {
      frames[frames.length - 1].state = cloneChain(s);
      stopped = true;
      break;
    }
  }
  if (!stopped) endRound(s);
  return { state: s, frames };
}

/** ラウンドの終わり：ダウンが解け、当たった回数を戻し、癖を1つ進め、手札を補充して、次の予定を決める */
function endRound(s: ChainState): void {
  for (const e of s.enemies) {
    e.down = false;
    e.hits = 0;
    e.step++;
  }
  s.round++;
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
