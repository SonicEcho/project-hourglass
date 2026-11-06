import { nextRandom } from './rng';
import type { Element } from './types';

// 試し：並べてつなぐ戦闘（段階156。docs/milestones/M3_battle_review.md の 12.）。今の戦闘（battle.ts）とは別の、試しの仕組み。
// - 敵の予定（行動・狙う相手・動く時刻）は、ラウンドの始めに決まり、計画の前から見えている
// - 仲間は、計画で並べた順に動く。1番目は時刻0に動き始め、次の仲間は前の仲間が終わった時刻から動き始める（時間の予算）。
//   行動は、重さの分だけかかって、終わった時刻に効く（詠唱。調整6）。同じ時刻なら仲間が先。
//   ラウンドの長さ（roundLen）までに終わらない行動は置けない（ねばねばで遅れて間に合わなくなったら、時間切れで動けない）
// - 軽い技には「押す」がある。当てると、その敵のまだ動いていない予定が後ろへずれる。ラウンドの外へ押し出すと、その予定は起きない（調整6）
// - 敵の組み合わせには、エグゼのウイルスの編成のように、いくつかの型（variants）がある。戦闘ごとに1つを選ぶ（調整6）
// - 決着した時刻の合計（elapsed + 決着の時刻）が早いほど、評価が高い（調整6。報酬のレア度に使う）
// - 札には型がある（仕掛け・状態・攻撃・締める。調整7）。
//   仕掛け：敵に仕掛けておき、次に当たった攻撃で使い切る（目印＝ほかの敵みんなに広がる、むき出し＝弱点になる、すき＝締めの札が2倍）。
//   状態：数ラウンド続く（鈍足・やけど・刻み・弱り・封印・混乱・吸い取り）。1体に仕掛けと状態は1つずつ（新しく付けると上書き）
// - 仲間ごとの専用の札（その人しか使えない）が山札に混ざる。組む2人の専用の札が手札にそろうと、連携技を使える（2人の手番を使う。調整3）
// - 敵ごとに1つの特徴（はじける・すばやい・盾・殻・ねばねば・起こし役・反撃・分裂・時限・逃げる。調整3。
//   調整12で、計画を揺さぶる 割り込み・予定隠し・巻き戻し・属性チェンジ・リーダー を足した。画面の名前は src/data の CHAIN_TRAIT_TEXT）
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
  | 'flee'
  /** 割り込み：仲間の単体の行動に狙われると、その行動の前に、まだ動いていない自分の予定を1つ先に動かす */
  | 'interrupt'
  /** 予定隠し：ラウンドの始めは予定が隠れている（画面で「？」）。攻撃が当たると見える */
  | 'veil'
  /** 巻き戻し：ラウンドの終わりに、そのラウンドに受けたダメージを回復する（ダウン中なら回復しない） */
  | 'rewind'
  /** 属性チェンジ：ラウンドごとに弱点が変わる（weakCycle の順。今の弱点は画面に出る） */
  | 'shift'
  /** リーダー：生きている間、ほかの敵の攻撃が強くなる（leaderRate 倍）。倒すと、ほかの敵が動揺してダウンする */
  | 'leader';

/** 仕掛け（次に当たった攻撃で使い切る）：spread 目印（ほかの敵みんなに広がる。広がった先ではダウンしない）・expose むき出し（属性に関係なく弱点になる）・opening すき（締めの札が2倍） */
export type ChainTrick = 'spread' | 'expose' | 'opening';

/**
 * 状態（数ラウンド続く）：slow 鈍足（予定が1マス遅れる）・burn やけど（ラウンドの終わりに小さなダメージ）・stack 刻み（当たるたびに受けるダメージが上がる）・
 * weak 弱り（攻撃が半分）・seal 封印（全体攻撃と大技が、ふつうの攻撃に変わる）・confuse 混乱（単体攻撃が、ほかの敵に向く）・drain 吸い取り（攻撃した仲間が回復）
 */
export type ChainStatusKind = 'slow' | 'burn' | 'stack' | 'weak' | 'seal' | 'confuse' | 'drain';

export interface ChainStatus {
  kind: ChainStatusKind;
  /** 残りのラウンド */
  left: number;
  /** 刻みの重なり */
  stacks: number;
}

/** 札・技の型（表示と説明のため。効き目は effect で決まる） */
export type ChainMoveType = 'place' | 'trick' | 'status' | 'receive' | 'count' | 'finish' | 'attack' | 'support' | 'link';

export type ChainEffect =
  /**
   * ダメージ。perActed：このラウンドにもう動いた仲間1人ごとに威力を足す。hitsPerActed：もう動いた仲間の数 + 1 回当てる。
   * downMult：ダウン中の敵への倍率。perMark：相手の仕掛けと状態1つごとに威力を足す。bestOf：敵ごとに一番効く属性を選ぶ。
   * push：当てた敵の、まだ動いていない予定を、この数だけ後ろへずらす
   */
  | { kind: 'damage'; element: Element; power: number; perActed?: number; hitsPerActed?: boolean; downMult?: number; perMark?: number; ignoreResist?: boolean; bestOf?: Element[]; push?: number }
  /** 重ね撮り：直前に動いた仲間の攻撃と同じ属性で当てる。直前が攻撃なら威力 × mult（攻撃でなければ物理） */
  | { kind: 'layer'; power: number; mult: number }
  /** 追い風：直前に動いた仲間の攻撃（属性と威力）を、威力 × rate で敵全体にもう一度。直前が攻撃でなければ不発 */
  | { kind: 'wind'; rate: number }
  /** 仕掛け：次に当たった攻撃で使い切る。power があれば、その属性で小さく当ててから仕掛ける */
  | { kind: 'trick'; trick: ChainTrick; element?: Element; power?: number }
  /** 状態：rounds ラウンド続く。power があれば、その属性で小さく当ててから付ける */
  | { kind: 'status'; status: ChainStatusKind; rounds: number; element?: Element; power?: number }
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
  /** 属性チェンジ：ラウンドごとの弱点の順（1ラウンド目は先頭） */
  weakCycle?: Element[];
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
  /** やけど：ラウンドの終わりのダメージ */
  burnDamage: number;
  /** 刻み：重なり1つごとに受けるダメージに足す割合 */
  stackRate: number;
  /** 弱り：敵の攻撃の倍率 */
  weakenRate: number;
  /** 吸い取り：与えたダメージのこの割合だけ回復 */
  drainRate: number;
  /** 封印：大技の代わりのふつうの攻撃の威力。この威力以上の行動は大技とみなす */
  sealPower: number;
  sealBig: number;
  /** リーダー：生きている間、ほかの敵の攻撃の倍率（調整12） */
  leaderRate: number;
}

/** 組み合わせの型（エグゼのウイルスの編成のように、同じ顔ぶれでも行動の並びが違う）。patterns は enemies と同じ並びで、書かない敵は敵の定義の癖のまま */
export interface ChainVariant {
  id: string;
  name: string;
  patterns: (ChainEnemyMove[] | undefined)[];
}

/** 評価の段（決着した時刻の合計が早いほど上） */
export type ChainGrade = 'high' | 'mid' | 'low';

export interface ChainBattleDef {
  id: string;
  name: string;
  allies: ChainAllyDef[];
  enemies: ChainEnemyDef[];
  /** 組み合わせの型。戦闘ごとに1つを乱数で選ぶ */
  variants?: ChainVariant[];
  /** 評価の境目：決着した時刻の合計がこの値以下なら高・中（それより遅ければ低） */
  gradeAt?: { high: number; mid: number };
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
  /** 仕掛け（次に当たった攻撃で使い切る） */
  trick?: ChainTrick;
  /** 状態（数ラウンド続く） */
  status?: ChainStatus;
  down: boolean;
  /** 行動の癖の何番目か */
  step: number;
  /** 殻がまだ割れていない */
  shell?: boolean;
  /** 時限の残り */
  timer?: number;
  /** 逃げた（もう戦闘にいない） */
  gone?: boolean;
  /** 組み合わせの型で決まった癖（なければ敵の定義の癖） */
  pattern?: ChainEnemyMove[];
  /** 予定隠し：今のラウンドの予定が、まだ隠れている */
  veiled?: boolean;
  /** 巻き戻し：ラウンドの始めの HP */
  roundHp?: number;
}

/** 敵の予定（ラウンドの始めに決まる） */
export interface ChainIntent {
  enemy: string;
  move: ChainEnemyMove;
  at: number;
  /** 単体の時にねらう仲間 */
  target?: string;
  /** 混乱：代わりにねらうほかの敵 */
  confused?: string;
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
  | { type: 'trick'; to: string; trick: ChainTrick }
  /** 仕掛けを使った（目印は to に広がった先） */
  | { type: 'trickUse'; uid: string; trick: ChainTrick; to?: string[] }
  | { type: 'status'; to: string; status: ChainStatusKind; left: number }
  | { type: 'burn'; uid: string; amount: number }
  | { type: 'drain'; to: string; amount: number }
  | { type: 'pop'; uid: string }
  | { type: 'cover'; shield: string; from: string }
  | { type: 'shellBreak'; uid: string }
  | { type: 'sticky'; uid: string; delay: number }
  /** 押す：まだ動いていない予定を by だけ後ろへ。out はラウンドの外へ押し出して止めた。moved は動かせる予定があった */
  | { type: 'push'; uid: string; by: number; out: boolean; moved: boolean }
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
  | { type: 'shutterReady' }
  /** 割り込み：狙われて、先に動いた */
  | { type: 'interrupt'; uid: string; by: string }
  /** 予定隠し：攻撃が当たって、予定が見えた */
  | { type: 'unveil'; uid: string }
  /** 巻き戻し：ラウンドの終わりに、受けたダメージを回復した */
  | { type: 'rewind'; uid: string; amount: number }
  /** リーダーを倒した：ほかの敵が動揺してダウンした */
  | { type: 'panic'; uid: string; downed: string[] }
  /** 弱点が分かった（その属性で初めて当てた。ハイライトで弱点扱いになっただけでは分からない） */
  | { type: 'reveal'; uid: string; defId: string; element: Element };

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
  /** 選ばれた組み合わせの型の名前 */
  variant?: string;
  /** 終わったラウンドの時刻の合計 */
  elapsed: number;
  /** 決着した時刻の合計（終わったラウンドの時刻 + 決着した時刻） */
  finishTime?: number;
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
  /**
   * 分かっている弱点（敵の定義の id → 属性。調整9）。弱点は最初は見えず、その属性で当てた時に分かる。
   * 戦闘をまたいで引き継ぐ時は、createChainBattle に前の戦闘の known を渡す
   */
  known: Record<string, Element[]>;
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
  return { ...u, status: u.status ? { ...u.status } : undefined };
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
    known: Object.fromEntries(Object.entries(s.known).map(([k, v]) => [k, [...v]])),
  };
}

/** その敵の弱点が、もう分かっているか（調整9） */
export function isWeakKnown(s: ChainState, defId: string, el: Element): boolean {
  return s.known[defId]?.includes(el) ?? false;
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
    weak: d.trait === 'shift' && d.weakCycle?.length ? [d.weakCycle[0]] : [...d.weak],
    resist: [...d.resist],
    trait: d.trait,
    down: false,
    step: 0,
    shell: d.trait === 'shell' ? true : undefined,
    timer: d.trait === 'timer' ? (d.timer ?? 3) : undefined,
    veiled: d.trait === 'veil' ? true : undefined,
    roundHp: d.hp,
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
    const pattern = e.pattern ?? d.pattern;
    const move = pattern[e.step % pattern.length];
    const pick = () => (move.all || move.flee || allies.length === 0 ? undefined : allies[Math.floor(rand(s) * allies.length)].uid);
    const add = (at: number) => {
      let it: ChainIntent = { enemy: e.uid, move, at, target: pick() };
      if (e.status) it = statusIntent(s, e, it, e.status.kind);
      s.intents.push(it);
    };
    add(move.at);
    if (move.at2 !== undefined) add(move.at2);
  }
}

/** 状態が敵の予定に効く（鈍足は1マス遅れる・封印は大技がふつうの攻撃に・混乱は単体攻撃がほかの敵へ） */
function statusIntent(s: ChainState, e: ChainUnit, it: ChainIntent, kind: ChainStatusKind): ChainIntent {
  const m = it.move;
  if (kind === 'slow') return { ...it, at: Math.min(s.rules.roundLen - 1, it.at + 1) };
  if (kind === 'seal' && !m.flee && (m.all || m.power >= s.rules.sealBig))
    return { ...it, move: { id: 'sealed', name: `${m.name}（封印）`, at: m.at, at2: m.at2, element: 'physical', power: s.rules.sealPower }, target: it.target ?? s.allies.find((a) => a.hp > 0)?.uid };
  if (kind === 'confuse' && !m.flee && !m.all) {
    const other = living(s.enemies).find((x) => x.uid !== e.uid);
    if (other) return { ...it, confused: other.uid };
  }
  return it;
}

export function createChainBattle(def: ChainBattleDef, rules: ChainRules, seed: number, known: Record<string, Element[]> = {}): ChainState {
  const s: ChainState = {
    def,
    rules,
    round: 1,
    allies: def.allies.map((d) => ({ uid: d.id, defId: d.id, name: d.name, side: 'ally', hp: d.hp, maxHp: d.hp, atk: d.atk, mag: d.mag, def: d.def, weak: [], resist: [], down: false, step: 0 })),
    enemies: def.enemies.map((d, i) => enemyUnit(d, `${d.id}#${i}`)),
    deck: [],
    hand: [],
    discard: [],
    intents: [],
    rng: seed >>> 0,
    elapsed: 0,
    timeShift: 0,
    actedAt: {},
    shutter: false,
    outcome: 'ongoing',
    known: Object.fromEntries(Object.entries(known).map(([k, v]) => [k, [...v]])),
  };
  // 組み合わせの型を1つ選ぶ
  if (def.variants?.length) {
    const v = def.variants[Math.floor(rand(s) * def.variants.length)];
    s.variant = v.name;
    v.patterns.forEach((p, i) => {
      if (p && s.enemies[i]) s.enemies[i].pattern = p;
    });
  }
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
  if (at + move.weight > s.rules.roundLen) return `時刻${at}から重さ${move.weight}では、このラウンドに終わらない（時刻${s.rules.roundLen}まで）`;
  return null;
}

/** 計画の仕掛け・状態の札で、付く予定の物（敵ごと） */
export function plannedEffects(s: ChainState, plan: ChainPlanStep[]): Record<string, { trick?: ChainTrick; status?: ChainStatusKind }> {
  const out: Record<string, { trick?: ChainTrick; status?: ChainStatusKind }> = {};
  for (const step of plan) {
    const m = chainMoveOf(s, step);
    if (!m || (m.effect.kind !== 'trick' && m.effect.kind !== 'status')) continue;
    // 単体は、盾が立っていれば盾に付く（実行の時と同じ）
    const shield = living(s.enemies).find((e) => e.trait === 'shield' && !e.down);
    const single = step.target && shield && shield.uid !== step.target ? shield.uid : step.target;
    const targets = m.target === 'enemies' ? living(s.enemies).map((e) => e.uid) : single ? [single] : [];
    for (const t of targets) {
      const o = (out[t] ??= {});
      if (m.effect.kind === 'trick') o.trick = m.effect.trick;
      else o.status = m.effect.status;
    }
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
  /** 目印で広がった先（もう広がらない・ダウンしない・仕掛けを使わない） */
  noChain?: boolean;
  /** 締めの札（すきで2倍） */
  finish?: boolean;
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
  e.trick = undefined;
  e.status = undefined;
  ev.push({ type: 'defeat', uid: e.uid });
  // リーダー：倒すと、ほかの敵が動揺してダウンする（調整12）
  if (e.trait === 'leader') {
    const others = living(s.enemies).filter((x) => x.uid !== e.uid && !x.down);
    for (const x of others) knockDown(s, x, ev);
    if (others.length) ev.push({ type: 'panic', uid: e.uid, downed: others.map((x) => x.uid) });
  }
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
  // 仕掛け：むき出しは弱点になる、すきは締めの札が2倍、目印はほかの敵みんなに広がる（どれも1回で消える。広がった先では使わない）
  const trick = opts.noChain ? undefined : e.trick;
  const useTrick = trick === 'expose' || trick === 'spread' || (trick === 'opening' && opts.finish);
  if (useTrick) e.trick = undefined;
  const real = affinity(s, e, el, opts.ignoreResist);
  const aff = trick === 'expose' ? { mult: s.rules.weakMult, weak: true, resist: false } : real;
  let mult = aff.mult * (e.down && opts.downMult ? opts.downMult : 1);
  if (trick === 'opening' && opts.finish) mult *= 2;
  // 刻み：重なるほど受けるダメージが上がる
  if (e.status?.kind === 'stack') {
    mult *= 1 + s.rules.stackRate * e.status.stacks;
    e.status.stacks++;
  }
  const amount = Math.max(1, Math.floor(((power * stat) / Math.max(1, e.def)) * mult));
  e.hp = Math.max(0, e.hp - amount);
  ev.push({ type: 'damage', from: actor.uid, to: e.uid, amount, weak: aff.weak, resist: aff.resist });
  // 予定隠し：当たると、このラウンドの予定が見える（調整12）
  if (e.veiled) {
    e.veiled = false;
    ev.push({ type: 'unveil', uid: e.uid });
  }
  // 本当の弱点で当てた時だけ、弱点が分かる（調整9）
  if (real.weak && !isWeakKnown(s, e.defId, el)) {
    (s.known[e.defId] ??= []).push(el);
    ev.push({ type: 'reveal', uid: e.uid, defId: e.defId, element: el });
  }
  if (useTrick && trick !== 'spread') ev.push({ type: 'trickUse', uid: e.uid, trick: trick! });
  // 吸い取り：攻撃した仲間が回復
  if (e.status?.kind === 'drain' && actor.hp > 0) {
    const heal = Math.min(actor.maxHp - actor.hp, Math.floor(amount * s.rules.drainRate));
    if (heal > 0) {
      actor.hp += heal;
      ev.push({ type: 'drain', to: actor.uid, amount: heal });
    }
  }
  if (e.hp === 0) defeatEnemy(s, e, ev);
  else if (aff.weak && !opts.noChain) knockDown(s, e, ev);
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
  // 目印：ほかの敵みんなに、同じ威力で広がる（広がった先ではダウンしない）
  if (trick === 'spread') {
    const others = living(s.enemies).filter((x) => x.uid !== e.uid);
    ev.push({ type: 'trickUse', uid: e.uid, trick: 'spread', to: others.map((x) => x.uid) });
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
  if (eff.kind === 'trick' || eff.kind === 'status') {
    for (const e of targets()) {
      if (eff.power && eff.element) hitEnemy(s, actor, e, eff.element, eff.power, {}, ctx, ev);
      if (e.hp <= 0 || e.gone) continue;
      if (eff.kind === 'trick') {
        e.trick = eff.trick;
        ev.push({ type: 'trick', to: e.uid, trick: eff.trick });
      } else {
        e.status = { kind: eff.status, left: eff.rounds, stacks: 0 };
        ev.push({ type: 'status', to: e.uid, status: eff.status, left: eff.rounds });
      }
    }
    return { ally: actor.uid, element: eff.power && eff.element ? eff.element : null, power: eff.power ?? 0 };
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
    if (eff.perMark) p += eff.perMark * ((e.trick ? 1 : 0) + (e.status ? 1 : 0));
    for (let k = 0; k < hits && e.hp > 0; k++) hitEnemy(s, actor, e, el, p, { ignoreResist: eff.ignoreResist, downMult: eff.downMult, finish: move.type === 'finish' }, ctx, ev);
    // 押す：実際にずらすのは runChainRound（まだ動いていない予定を知っている）
    if (eff.push && e.hp > 0 && !e.gone) ev.push({ type: 'push', uid: e.uid, by: eff.push, out: false, moved: false });
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
  // リーダーが生きている間、ほかの敵の攻撃が強くなる（調整12）
  const led = living(s.enemies).some((x) => x.trait === 'leader' && x.uid !== e.uid);
  const rate = (e.status?.kind === 'weak' ? s.rules.weakenRate : 1) * (led ? s.rules.leaderRate : 1);
  // 混乱：単体攻撃が、ほかの敵に向く
  const foe = intent.confused ? s.enemies.find((x) => x.uid === intent.confused && x.hp > 0 && !x.gone) : undefined;
  if (foe && !m.all) {
    const amount = Math.max(1, Math.floor(((m.power * e.atk) / Math.max(1, foe.def)) * rate));
    foe.hp = Math.max(0, foe.hp - amount);
    ev.push({ type: 'damage', from: e.uid, to: foe.uid, amount, weak: false, resist: false });
    if (foe.hp === 0) defeatEnemy(s, foe, ev);
    return;
  }
  const allies = s.allies.filter((a) => a.hp > 0);
  const targets = m.all ? allies : [s.allies.find((a) => a.uid === intent.target && a.hp > 0) ?? allies[0]].filter((x): x is ChainUnit => !!x);
  for (const a of targets) hurtAlly(e.uid, a, Math.max(1, Math.floor(((m.power * e.atk) / Math.max(1, a.def)) * rate)), ev);
  // 起こし役：ダウンしているほかの敵を起こす
  if (e.trait === 'waker') {
    const woke = living(s.enemies).filter((x) => x.down && x.uid !== e.uid);
    for (const x of woke) x.down = false;
    if (woke.length) ev.push({ type: 'wake', uid: e.uid, woke: woke.map((x) => x.uid) });
  }
}

function checkEnd(s: ChainState, ev: ChainEvent[], at: number): boolean {
  const done = () => (s.finishTime = s.elapsed + at);
  if (s.allies.every((a) => a.hp <= 0)) {
    done();
    s.outcome = 'lose';
    s.finishRound = s.round;
    return true;
  }
  const foes = living(s.enemies);
  if (foes.length === 0) {
    s.outcome = 'win';
    s.finish = 'defeat';
    s.finishRound = s.round;
    done();
    return true;
  }
  if (foes.every((e) => e.down)) {
    done();
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

/** このラウンドに動く順番（計画の時の見込み。ねばねば・押すで、実行の時に変わる）。仲間の時刻は、行動が終わって効く時刻。画面の番号もこれで出す */
export function chainOrder(s: ChainState, plan: ChainPlanStep[]): ChainOrderEntry[] {
  const starts = planStarts(s, plan);
  const queue: ChainOrderEntry[] = [
    ...plan.map((p, i) => ({ at: starts[i] + (chainMoveOf(s, p)?.weight ?? 0), key: `a${i}`, kind: 'ally' as const, i })),
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
      // 割り込み：単体の行動に狙われた敵は、まだ動いていない自分の予定を1つ、その前に動かす（調整12）
      const aimed = move?.target === 'enemy' ? s.enemies.find((x) => x.uid === step.target) : undefined;
      if (aimed && aimed.trait === 'interrupt' && aimed.hp > 0 && !aimed.gone && !aimed.down && at <= s.rules.roundLen && actors.every((a) => a.hp > 0)) {
        const qi = pending.findIndex((x) => x.kind === 'enemy' && x.intent.enemy === aimed.uid);
        const eq = qi >= 0 ? pending[qi] : undefined;
        if (eq && eq.kind === 'enemy') {
          pending.splice(qi, 1);
          const iev: ChainEvent[] = [{ type: 'interrupt', uid: aimed.uid, by: actor.uid }, { type: 'act', uid: aimed.uid, name: eq.intent.move.name, at }];
          doEnemyMove(s, aimed, eq.intent, iev);
          push(eq, '', at, aimed.uid, eq.intent.move.name, iev, eq.intent.target, eq.intent.move.all);
          if (checkEnd(s, iev, at)) {
            frames[frames.length - 1].state = cloneChain(s);
            stopped = true;
            break;
          }
        }
      }
      if (actors.some((a) => a.hp <= 0) || !move || at > s.rules.roundLen) {
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
      // 押す：その敵のまだ動いていない予定を後ろへ。ラウンドの外へ出たら、その予定は起きない
      for (const pe of ev) {
        if (pe.type !== 'push') continue;
        for (const e of pending.filter((x) => x.kind === 'enemy' && x.intent.enemy === pe.uid)) {
          pe.moved = true;
          e.at += pe.by;
          const k = Number(e.key.slice(1));
          if (s.intents[k]) s.intents[k] = { ...s.intents[k], at: e.at };
          if (e.at > s.rules.roundLen - 1) {
            pe.out = true;
            pending.splice(pending.indexOf(e), 1);
          }
        }
      }
      // 状態：付いた敵のまだ動いていない予定に、すぐ効く（鈍足・封印・混乱）
      for (const se of ev) {
        if (se.type !== 'status') continue;
        const target = s.enemies.find((x) => x.uid === se.to);
        if (!target) continue;
        for (const e of pending.filter((x) => x.kind === 'enemy' && x.intent.enemy === se.to)) {
          if (e.kind !== 'enemy') continue;
          const next = statusIntent(s, target, e.intent, se.status);
          e.intent = next;
          e.at = next.at;
          const k = Number(e.key.slice(1));
          if (s.intents[k]) s.intents[k] = next;
        }
      }
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
    if (checkEnd(s, frames[frames.length - 1].events, frames[frames.length - 1].at)) {
      frames[frames.length - 1].state = cloneChain(s);
      stopped = true;
      break;
    }
  }
  if (!stopped) {
    // やけど：ラウンドの終わりに小さなダメージ
    for (const e of living(s.enemies).filter((x) => x.status?.kind === 'burn')) {
      const ev: ChainEvent[] = [];
      const amount = Math.min(e.hp, s.rules.burnDamage);
      e.hp -= amount;
      ev.push({ type: 'burn', uid: e.uid, amount });
      if (e.hp === 0) defeatEnemy(s, e, ev);
      push(null, `burn:${e.uid}`, s.rules.roundLen, e.uid, 'ヒート', ev, undefined, true);
      if (checkEnd(s, ev, s.rules.roundLen)) {
        frames[frames.length - 1].state = cloneChain(s);
        stopped = true;
        break;
      }
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
      push(null, `end:${e.uid}`, s.rules.roundLen, e.uid, e.timer <= 0 ? '大爆発' : `あと${e.timer}`, ev, undefined, true);
      if (checkEnd(s, ev, s.rules.roundLen)) {
        frames[frames.length - 1].state = cloneChain(s);
        stopped = true;
        break;
      }
    }
  }
  if (!stopped) {
    // 巻き戻し：ダウンしていなければ、このラウンドに受けたダメージを回復する（調整12）
    for (const e of living(s.enemies).filter((x) => x.trait === 'rewind' && !x.down && x.roundHp !== undefined && x.hp < x.roundHp)) {
      const amount = e.roundHp! - e.hp;
      e.hp = e.roundHp!;
      push(null, `rewind:${e.uid}`, s.rules.roundLen, e.uid, '巻き戻し', [{ type: 'rewind', uid: e.uid, amount }], undefined, true);
    }
    endRound(s);
  }
  return { state: s, frames };
}

/** ラウンドの終わり：ダウンが解け、癖を1つ進め、手札を補充して、次の予定を決める */
function endRound(s: ChainState): void {
  for (const e of s.enemies) {
    e.down = false;
    e.step++;
    // 状態は、ラウンドの終わりごとに1つ減り、0で消える
    if (e.status && --e.status.left <= 0) e.status = undefined;
    // 予定隠し：次のラウンドの予定はまた隠れる。巻き戻し：次のラウンドの始めの HP を覚える（調整12）
    if (e.trait === 'veil' && e.hp > 0) e.veiled = true;
    e.roundHp = e.hp;
    // 属性チェンジ：弱点が次の属性に変わる（調整12）
    const cycle = e.trait === 'shift' ? chainEnemyDef(s, e.defId)?.weakCycle : undefined;
    if (cycle?.length) e.weak = [cycle[e.step % cycle.length]];
  }
  s.round++;
  s.elapsed += s.rules.roundLen;
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

/** 評価：決着した時刻の合計が早いほど上（負けは null）。境目は組み合わせの gradeAt（なければ1ラウンド目なら高、2ラウンド目までなら中） */
export function chainGrade(s: ChainState): ChainGrade | null {
  if (s.outcome !== 'win' || s.finishTime === undefined) return null;
  const at = s.def.gradeAt ?? { high: s.rules.roundLen, mid: s.rules.roundLen * 2 };
  return s.finishTime <= at.high ? 'high' : s.finishTime <= at.mid ? 'mid' : 'low';
}
