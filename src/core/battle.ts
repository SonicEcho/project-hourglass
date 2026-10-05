import {
  BASIC_ATTACK,
  BATON_MULTIPLIER,
  DEFAULT_ACTION_WEIGHT,
  GUARD,
  GUARD_DAMAGE_MULTIPLIER,
  MIN_DAMAGE,
  ONE_MORE_DRAW,
  PART_BODY_RATIO,
  RANDOM_MAX,
  RANDOM_MIN,
  SUPPORT_PER_ROUND,
} from '../data/constants';
import { affinityOf, attackStatOf, calcDamage, calcHeal, randomFactor } from './damage';
import { discardCards, drawCards, refillHand, takeFromDeck } from './deck';
import { actionSpeed, compareOrder, type OrderKey } from './order';
import { random, randomPick, shuffleInPlace } from './rng';
import type {
  ActionDef,
  Affinity,
  AllyUnit,
  BattleSetup,
  BattleState,
  CardInstance,
  ComboDef,
  DamageType,
  Effect,
  Element,
  EnemyActionDef,
  EnemyUnit,
  LinkDef,
  PassiveEffect,
  Plan,
  PlayerAction,
  QueueEntry,
  SkillDef,
  TargetRef,
  Unit,
} from './types';

// 公開している関数は、受け取った状態を書き換えず、新しい状態を返す。
// 内部では複製した状態 s を書き換えて組み立てる。
//
// 1ラウンドの流れ：
//   plan（3人の行動を選ぶ。サポートカードはその場で使う）
//   → startExecution → execute（step で1つずつ実行）
//     ↳ 敵をダウンさせたら extra（ワンモア・バトンの追加行動を選ぶ）→ execute に戻る
//   → 全員実行したら次のラウンドの plan へ（勝敗がついたら ended）

const clone = <T>(v: T): T => structuredClone(v);

// ---- 作成と参照 ----

/** 戦闘を作り、1ラウンド目の計画の状態にする */
export function createBattle(setup: BattleSetup): BattleState {
  const allies: AllyUnit[] = setup.allies.map((def) => ({
    uid: def.id,
    defId: def.id,
    name: def.name,
    side: 'ally',
    maxHp: def.stats.hp,
    hp: def.stats.hp,
    maxMp: def.stats.mp,
    mp: def.stats.mp,
    atk: def.stats.atk,
    mag: def.stats.mag,
    def: def.stats.def,
    spd: def.stats.spd,
    guarding: false,
    skills: clone(def.skills),
    passives: clone(def.passives ?? []),
    attackElement: def.attackElement ?? 'physical',
  }));
  const enemies: EnemyUnit[] = setup.enemies.map((def, i) => ({
    uid: `enemy${i}`,
    defId: def.id,
    name: def.name,
    side: 'enemy',
    maxHp: def.stats.hp,
    hp: def.stats.hp,
    atk: def.stats.atk,
    mag: def.stats.mag,
    def: def.stats.def,
    spd: def.stats.spd,
    guarding: false,
    weaknesses: [...def.weaknesses],
    resistances: [...def.resistances],
    knownWeaknesses: [],
    down: false,
    standUpGuard: false,
    charging: null,
    actions: clone(def.actions),
    parts: (def.parts ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      maxHp: p.hp,
      hp: p.hp,
      broken: false,
      material: p.material,
      revealsWeakness: [...(p.revealsWeakness ?? [])],
    })),
    ai: clone(def.ai),
    aiCounter: 0,
    drops: [...(def.drops ?? [])],
  }));
  const s: BattleState = {
    seed: setup.seed,
    rng: setup.seed >>> 0,
    allies,
    enemies,
    links: clone(setup.links ?? []),
    combos: clone(setup.combos ?? []),
    deck: setup.deck.map((card, uid) => ({ uid, card: clone(card) })),
    hand: [],
    discard: [],
    round: 0,
    phase: 'plan',
    plans: [],
    precedeIds: [],
    supportUsed: false,
    searchChoice: null,
    queue: [],
    extra: null,
    outcome: 'ongoing',
    log: [{ type: 'battleStart', seed: setup.seed }],
  };
  shuffleInPlace(s, s.deck);
  startRound(s);
  return s;
}

export function isAlive(u: Unit): boolean {
  return u.hp > 0;
}

export function livingAllies(s: BattleState): AllyUnit[] {
  return s.allies.filter(isAlive);
}

export function livingEnemies(s: BattleState): EnemyUnit[] {
  return s.enemies.filter(isAlive);
}

export function findUnit(s: BattleState, id: string): Unit | undefined {
  return s.allies.find((u) => u.uid === id) ?? s.enemies.find((u) => u.uid === id);
}

function findAlly(s: BattleState, id: string): AllyUnit | undefined {
  return s.allies.find((u) => u.uid === id);
}

function findEnemy(s: BattleState, id: string): EnemyUnit | undefined {
  return s.enemies.find((u) => u.uid === id);
}

// ---- 特性（ナビカス盤） ----

type PassiveOf<K extends PassiveEffect['kind']> = Extract<PassiveEffect, { kind: K }>;

function passivesOf<K extends PassiveEffect['kind']>(ally: { passives?: PassiveEffect[] }, kind: K): PassiveOf<K>[] {
  return (ally.passives ?? []).filter((p): p is PassiveOf<K> => p.kind === kind);
}

/** 割合の特性の合計（elementBoost は element を指定する） */
export function passiveRate(
  ally: { passives?: PassiveEffect[] },
  kind: 'partBoost' | 'batonBoost' | 'comboBoost' | 'regen' | 'bug' | 'elementBoost',
  element?: DamageType,
): number {
  return passivesOf(ally, kind)
    .filter((p) => p.kind !== 'elementBoost' || p.element === element)
    .reduce((sum, p) => sum + p.rate, 0);
}

/** その仲間の通常攻撃（武器の進化で属性が乗ると、魔力で計算する属性の攻撃になる） */
export function basicAttackFor(ally: { attackElement?: Element }): ActionDef {
  const el = ally.attackElement ?? 'physical';
  if (el === 'physical') return BASIC_ATTACK;
  return {
    ...BASIC_ATTACK,
    effects: BASIC_ATTACK.effects.map((e) => (e.kind === 'damage' ? { ...e, type: el } : e)),
  };
}

/** 魔法・スキルのMP消費（MPセーブで減る。最低1） */
export function skillMpCost(ally: { passives?: PassiveEffect[] }, skill: SkillDef): number {
  const save = passivesOf(ally, 'mpSave').reduce((sum, p) => sum + p.amount, 0);
  return save > 0 ? Math.max(1, skill.mp - save) : skill.mp;
}

/** ワンモアの時に引く枚数 */
export function oneMoreDrawCount(ally: { passives?: PassiveEffect[] }): number {
  return ONE_MORE_DRAW + passivesOf(ally, 'oneMoreDraw').reduce((sum, p) => sum + p.count, 0);
}

/** バトンを受けた時の倍率 */
export function batonMultiplier(ally: { passives?: PassiveEffect[] }): number {
  return BATON_MULTIPLIER + passiveRate(ally, 'batonBoost');
}

/** 特性による、与えるダメージの倍率（属性の割増しとコンボの割増し） */
function passiveDamageMultiplier(user: AllyUnit, type: DamageType, combo: boolean): number {
  return 1 + passiveRate(user, 'elementBoost', type) + (combo ? passiveRate(user, 'comboBoost') : 0);
}

/** 特性による、部位へのダメージ倍率 */
function passivePartMultiplier(user: AllyUnit, partMultiplier: number | undefined): number {
  return (partMultiplier ?? 1) * (1 + passiveRate(user, 'partBoost'));
}

/** ラウンドの始めの、特性によるHPの増減（バグで減り、ファーストエイドで回復する） */
function applyRoundStartPassives(s: BattleState): void {
  for (const a of livingAllies(s)) {
    const loss = Math.floor(a.maxHp * passiveRate(a, 'bug'));
    if (loss > 0) {
      const amount = Math.min(loss, a.hp - 1);
      a.hp -= amount;
      if (amount > 0) s.log.push({ type: 'passiveHp', allyId: a.uid, source: 'bug', amount: -amount, hpAfter: a.hp });
    }
    const heal = Math.floor(a.maxHp * passiveRate(a, 'regen'));
    if (heal > 0) {
      const amount = Math.min(heal, a.maxHp - a.hp);
      a.hp += amount;
      if (amount > 0) s.log.push({ type: 'passiveHp', allyId: a.uid, source: 'regen', amount, hpAfter: a.hp });
    }
  }
}

/** その仲間の（まだ実行していない）計画 */
export function planOf(s: BattleState, allyId: string): Plan | undefined {
  return s.plans.find((p) => !p.done && p.actorIds.includes(allyId));
}

/** 計画で確保されているカード。exceptAllyIds の仲間の分は除く */
export function reservedCardUids(s: BattleState, exceptAllyIds: string[] = []): Set<number> {
  const out = new Set<number>();
  for (const p of s.plans) {
    if (p.done || p.actorIds.some((id) => exceptAllyIds.includes(id))) continue;
    for (const uid of p.cardUids) out.add(uid);
  }
  return out;
}

/** まだ誰にも割り当てていない手札。exceptAllyIds の仲間が確保しているカードは使えるものとして数える */
export function availableHand(s: BattleState, exceptAllyIds: string[] = []): CardInstance[] {
  const reserved = reservedCardUids(s, exceptAllyIds);
  return s.hand.filter((c) => !reserved.has(c.uid));
}

/** まだ行動を選んでいない、生きている仲間 */
export function unplannedAllies(s: BattleState): AllyUnit[] {
  return livingAllies(s).filter((a) => !planOf(s, a.uid));
}

// ---- ラウンドの始めと終わり ----

function startRound(s: BattleState): void {
  s.round += 1;
  s.phase = 'plan';
  s.plans = [];
  s.precedeIds = [];
  s.supportUsed = false;
  s.searchChoice = null;
  s.queue = [];
  s.extra = null;
  s.log.push({ type: 'roundStart', round: s.round });
  applyRoundStartPassives(s);
  // スタートダッシュ：戦闘の最初のラウンドは先制
  if (s.round === 1) s.precedeIds = livingAllies(s).filter((a) => passivesOf(a, 'startDash').length > 0).map((a) => a.uid);
  refillHand(s);
}

function endRound(s: BattleState): void {
  for (const u of [...s.allies, ...s.enemies]) u.guarding = false;
  s.log.push({ type: 'roundEnd', round: s.round });
  startRound(s);
}

function updateOutcome(s: BattleState): void {
  if (s.outcome !== 'ongoing') return;
  if (livingEnemies(s).length === 0) s.outcome = 'victory';
  else if (livingAllies(s).length === 0) s.outcome = 'defeat';
  else return;
  s.phase = 'ended';
  s.queue = [];
  s.extra = null;
  s.log.push({ type: 'battleEnd', outcome: s.outcome });
}

// ---- 行動の解決 ----

interface Resolved {
  def: ActionDef;
  /** この行動で使うカード */
  cards: CardInstance[];
  skill?: SkillDef;
  link?: LinkDef;
}

/**
 * 行動の中身を決める。pool は使ってよい手札。
 * 行動できない時は理由の文字列を返す
 */
function resolveAction(s: BattleState, actor: AllyUnit, action: PlayerAction, pool: CardInstance[]): Resolved | string {
  switch (action.type) {
    case 'attack':
      return { def: basicAttackFor(actor), cards: [] };
    case 'guard':
      return { def: GUARD, cards: [] };
    case 'card': {
      const card = pool.find((c) => c.uid === action.cardUid);
      if (!card) return 'card is not available';
      if (card.card.support) return 'support cards are used during planning';
      return { def: card.card, cards: [card] };
    }
    case 'skill': {
      const skill = actor.skills.find((k) => k.id === action.skillId);
      if (!skill) return 'unknown skill';
      if (actor.mp < skillMpCost(actor, skill)) return 'not enough MP';
      return { def: skill, cards: [], skill };
    }
    case 'link': {
      const link = s.links.find((l) => l.id === action.linkId);
      if (!link) return 'unknown link';
      if (!link.members.includes(actor.uid)) return 'not a member of the link';
      if (link.members.some((id) => !findAlly(s, id) || !isAlive(findAlly(s, id)!))) return 'link members must be alive';
      return { def: link, cards: [], link };
    }
    case 'combo': {
      const combo = s.combos.find((c) => c.id === action.comboId);
      if (!combo) return 'unknown combo';
      const cards = comboCards(combo, pool);
      if (!cards) return 'combo cards are not available';
      return { def: combo, cards };
    }
  }
}

function targetError(s: BattleState, def: ActionDef, target: TargetRef | undefined): string | null {
  if (def.target === 'enemy') {
    if (target?.kind !== 'enemy') return 'an enemy target is required';
    const enemy = findEnemy(s, target.id);
    if (!enemy || !isAlive(enemy)) return 'target enemy is not available';
    if (target.partId !== undefined) {
      const part = enemy.parts.find((p) => p.id === target.partId);
      if (!part || part.broken) return 'target part is not available';
    }
  }
  if (def.target === 'ally') {
    if (target?.kind !== 'ally') return 'an ally target is required';
    const ally = findAlly(s, target.id);
    if (!ally || !isAlive(ally)) return 'target ally is not available';
  }
  return null;
}

function validate(s: BattleState, actor: AllyUnit, action: PlayerAction, pool: CardInstance[]): Resolved | string {
  const r = resolveAction(s, actor, action, pool);
  if (typeof r === 'string') return r;
  const target = 'target' in action ? action.target : undefined;
  const err = targetError(s, r.def, target);
  if (err) return err;
  if (r.def.effects.some((e) => e.kind === 'retrieve')) {
    const pick = 'pickCardUid' in action ? action.pickCardUid : undefined;
    if (pick === undefined || !s.discard.some((c) => c.uid === pick)) return 'pick a card from the discard pile';
  }
  return r;
}

// ---- コンボ ----

/** 手札（pool）からコンボに使うカードを選ぶ。そろっていなければ null */
export function comboCards(combo: ComboDef, pool: CardInstance[]): CardInstance[] | null {
  const rest = [...pool];
  const picked: CardInstance[] = [];
  for (const id of combo.cards) {
    const i = rest.findIndex((c) => c.card.id === id);
    if (i < 0) return null;
    picked.push(rest[i]);
    rest.splice(i, 1);
  }
  return picked;
}

/** その手札で使えるコンボ */
export function availableCombos(s: BattleState, pool: CardInstance[]): ComboDef[] {
  return s.combos.filter((c) => comboCards(c, pool) !== null);
}

/** コンボに必要なカードのうち、手札にそろっている枚数 */
export function comboProgress(combo: ComboDef, pool: CardInstance[]): { have: number; need: number } {
  const rest = [...pool];
  let have = 0;
  for (const id of combo.cards) {
    const i = rest.findIndex((c) => c.card.id === id);
    if (i >= 0) {
      have++;
      rest.splice(i, 1);
    }
  }
  return { have, need: combo.cards.length };
}

// ---- 計画 ----

/** 計画で使ってよい手札（自分（連携技なら2人）が確保しているカードは使える） */
export function planPool(s: BattleState, allyId: string, action?: PlayerAction): CardInstance[] {
  const ids = [allyId];
  if (action?.type === 'link') {
    const link = s.links.find((l) => l.id === action.linkId);
    if (link) ids.push(...link.members);
  }
  // 今の計画が連携技なら、相方の分も選び直しで空く
  const current = planOf(s, allyId);
  if (current) ids.push(...current.actorIds);
  return availableHand(s, ids);
}

/** この仲間にこの行動を計画できない理由。できるなら null */
export function getPlanError(s: BattleState, allyId: string, action: PlayerAction): string | null {
  if (s.phase !== 'plan') return 'not in the planning phase';
  if (s.searchChoice) return 'pick a card from the search first';
  const actor = findAlly(s, allyId);
  if (!actor || !isAlive(actor)) return 'that ally cannot act';
  const r = validate(s, actor, action, planPool(s, allyId, action));
  return typeof r === 'string' ? r : null;
}

/** 計画を決める（同じ仲間の前の計画は置き換える。連携技は2人分の計画をまとめて置き換える） */
export function setPlan(state: BattleState, allyId: string, action: PlayerAction): BattleState {
  const err = getPlanError(state, allyId, action);
  if (err) throw new Error(err);
  const s = clone(state);
  const actor = findAlly(s, allyId)!;
  const r = validate(s, actor, action, planPool(s, allyId, action)) as Resolved;
  const actorIds = r.link ? [...r.link.members] : [allyId];
  s.plans = s.plans.filter((p) => !p.actorIds.some((id) => actorIds.includes(id) || id === allyId));
  s.plans.push({ actorIds, action: clone(action), cardUids: r.cards.map((c) => c.uid), done: false });
  return s;
}

/** 計画を取り消す（連携技なら2人とも） */
export function clearPlan(state: BattleState, allyId: string): BattleState {
  const s = clone(state);
  s.plans = s.plans.filter((p) => p.done || !p.actorIds.includes(allyId));
  return s;
}

/** 生きている仲間全員の行動が決まっているか */
export function isPlanComplete(s: BattleState): boolean {
  return s.phase === 'plan' && !s.searchChoice && unplannedAllies(s).length === 0;
}

// ---- サポートカード ----

/** サポートカードを使えない理由。使えるなら null。クイックステップは targetAllyId が必要 */
export function getSupportError(s: BattleState, cardUid: number, targetAllyId?: string): string | null {
  if (s.phase !== 'plan') return 'support cards are used during planning';
  if (s.searchChoice) return 'pick a card from the search first';
  if (s.supportUsed && SUPPORT_PER_ROUND <= 1) return 'a support card was already used this round';
  const card = availableHand(s).find((c) => c.uid === cardUid);
  if (!card) return 'card is not available';
  if (!card.card.support) return 'not a support card';
  if (card.card.effects.some((e) => e.kind === 'precede')) {
    const ally = targetAllyId ? findAlly(s, targetAllyId) : undefined;
    if (!ally || !isAlive(ally)) return 'choose an ally to act first';
    if (s.precedeIds.includes(ally.uid)) return 'that ally already acts first';
  }
  return null;
}

/** サポートカードをその場で使う（行動枠を使わない） */
export function useSupport(state: BattleState, cardUid: number, targetAllyId?: string): BattleState {
  const err = getSupportError(state, cardUid, targetAllyId);
  if (err) throw new Error(err);
  const s = clone(state);
  const card = s.hand.find((c) => c.uid === cardUid)!;
  discardCards(s, [cardUid]);
  s.supportUsed = true;
  s.log.push({ type: 'support', cardUid, name: card.card.name, targetId: targetAllyId });
  for (const e of card.card.effects) {
    if (e.kind === 'draw') drawCards(s, e.count);
    if (e.kind === 'search') s.searchChoice = takeFromDeck(s, e.count);
    if (e.kind === 'precede' && targetAllyId) s.precedeIds.push(targetAllyId);
  }
  if (s.searchChoice && s.searchChoice.length === 0) s.searchChoice = null;
  return s;
}

/** サーチで見ているカードから1枚を手札に加える。残りは山札の一番下へ */
export function resolveSearch(state: BattleState, pickedUid: number): BattleState {
  if (!state.searchChoice) throw new Error('no search in progress');
  if (!state.searchChoice.some((c) => c.uid === pickedUid)) throw new Error('pick one of the shown cards');
  const s = clone(state);
  const shown = s.searchChoice!;
  s.hand.push(shown.find((c) => c.uid === pickedUid)!);
  s.deck.push(...shown.filter((c) => c.uid !== pickedUid));
  s.searchChoice = null;
  s.log.push({ type: 'search', shownUids: shown.map((c) => c.uid), pickedUid });
  return s;
}

// ---- 行動順 ----

export interface OrderEntry {
  kind: 'ally' | 'enemy';
  /** 行動する者（連携技は2人、敵は1体） */
  ids: string[];
  /** 計画の番号（味方で、計画が決まっている時） */
  planIndex?: number;
  /** 行動がまだ決まっていない（予告の仮の位置） */
  tentative: boolean;
  guard: boolean;
  precede: boolean;
}

/** 計画の行動の重さ */
function planWeight(s: BattleState, plan: Plan): number {
  const actor = findAlly(s, plan.actorIds[0]);
  if (!actor) return DEFAULT_ACTION_WEIGHT;
  const r = resolveAction(s, actor, plan.action, s.hand);
  return typeof r === 'string' ? DEFAULT_ACTION_WEIGHT : r.def.weight;
}

/**
 * このラウンドの行動順。計画中は、まだ決まっていない仲間を重さ1.0として並べる。
 * preview を渡すと、その仲間がその行動をした場合の並びになる（予告）
 */
export function getRoundOrder(s: BattleState, preview?: { allyId: string; action: PlayerAction }): OrderEntry[] {
  if (s.phase === 'execute' || s.phase === 'extra') return s.queue.map((q) => queueToEntry(s, q));
  if (s.phase !== 'plan') return [];

  let plans = s.plans.filter((p) => !p.done);
  if (preview) {
    const actor = findAlly(s, preview.allyId);
    const r = actor ? resolveAction(s, actor, preview.action, s.hand) : 'none';
    const ids = typeof r !== 'string' && r.link ? [...r.link.members] : [preview.allyId];
    plans = plans.filter((p) => !p.actorIds.some((id) => ids.includes(id) || id === preview.allyId));
    plans = [...plans, { actorIds: ids, action: preview.action, cardUids: [], done: false }];
  }
  const keyed: { key: OrderKey; entry: OrderEntry }[] = [];
  let index = 0;
  for (const ally of livingAllies(s)) {
    const plan = plans.find((p) => p.actorIds.includes(ally.uid));
    if (plan && plan.actorIds[0] !== ally.uid) continue; // 連携技は1つにまとめる
    const ids = plan ? plan.actorIds : [ally.uid];
    const weight = plan ? planWeight(s, plan) : DEFAULT_ACTION_WEIGHT;
    const members = ids.map((id) => findAlly(s, id)!).filter(Boolean);
    const spd = Math.min(...members.map((m) => m.spd));
    const guard = plan?.action.type === 'guard';
    const precede = ids.some((id) => s.precedeIds.includes(id));
    const planIndex = plan ? s.plans.indexOf(plan) : undefined;
    keyed.push({
      key: { tier: guard ? 0 : precede ? 1 : 2, speed: actionSpeed(spd, weight), side: 'ally', spd, index: index++ },
      entry: { kind: 'ally', ids, planIndex: planIndex !== undefined && planIndex >= 0 ? planIndex : undefined, tentative: !plan, guard, precede },
    });
  }
  for (const enemy of livingEnemies(s)) {
    keyed.push({
      key: { tier: 2, speed: actionSpeed(enemy.spd, DEFAULT_ACTION_WEIGHT), side: 'enemy', spd: enemy.spd, index: index++ },
      entry: { kind: 'enemy', ids: [enemy.uid], tentative: false, guard: false, precede: false },
    });
  }
  keyed.sort((a, b) => compareOrder(a.key, b.key));
  return keyed.map((k) => k.entry);
}

function queueToEntry(s: BattleState, q: QueueEntry): OrderEntry {
  if (q.kind === 'enemy') return { kind: 'enemy', ids: [q.enemyId], tentative: false, guard: false, precede: false };
  const plan = s.plans[q.planIndex];
  return {
    kind: 'ally',
    ids: plan.actorIds,
    planIndex: q.planIndex,
    tentative: false,
    guard: plan.action.type === 'guard',
    precede: plan.actorIds.some((id) => s.precedeIds.includes(id)),
  };
}

// ---- 実行 ----

/** 計画を確定して実行を始める */
export function startExecution(state: BattleState): BattleState {
  if (!isPlanComplete(state)) throw new Error('every living ally needs an action');
  const s = clone(state);
  s.queue = getRoundOrder(s).map((e): QueueEntry =>
    e.kind === 'enemy' ? { kind: 'enemy', enemyId: e.ids[0] } : { kind: 'ally', planIndex: e.planIndex! },
  );
  s.phase = 'execute';
  return s;
}

/**
 * 順番待ちの先頭を1つ実行する。全員実行したら次のラウンドの計画へ進む。
 * 敵をダウンさせたら extra（追加行動の選択）で止まる
 */
export function step(state: BattleState): BattleState {
  if (state.phase !== 'execute') throw new Error('not executing');
  const s = clone(state);
  const next = s.queue.shift();
  if (!next) {
    endRound(s);
    return s;
  }
  if (next.kind === 'enemy') runEnemy(s, next.enemyId);
  else runPlan(s, next.planIndex);
  updateOutcome(s);
  return s;
}

/** 入力が必要になるまで（計画・追加行動・勝敗）実行を進める */
export function runUntilInput(state: BattleState): BattleState {
  let s = state;
  for (let i = 0; i < 1000 && s.phase === 'execute'; i++) s = step(s);
  return s;
}

function runPlan(s: BattleState, planIndex: number): void {
  const plan = s.plans[planIndex];
  plan.done = true;
  const actors = plan.actorIds.map((id) => findAlly(s, id)!);
  if (actors.some((a) => !a || !isAlive(a))) {
    // 自分の番の前に倒れた。確保していたカードは手札に残る
    s.log.push({ type: 'cancel', actorIds: plan.actorIds, reason: 'dead' });
    return;
  }
  const pool = s.hand.filter((c) => plan.cardUids.includes(c.uid));
  const result = perform(s, actors[0], plan.action, pool, { extra: false, boost: false });
  if (result === 'mp') {
    s.log.push({ type: 'cancel', actorIds: plan.actorIds, reason: 'mp' });
    return;
  }
  if (result.downed) triggerOneMore(s, actors[0].uid, [actors[0].uid]);
}

function runEnemy(s: BattleState, enemyId: string): void {
  const e = findEnemy(s, enemyId);
  if (!e || !isAlive(e)) return;
  if (e.down) {
    // 割り込み：ダウンした敵は、次の自分の行動を立ち上がりに使う
    e.down = false;
    e.standUpGuard = true;
    s.log.push({ type: 'standUp', enemyId: e.uid });
    return;
  }
  e.standUpGuard = false;
  if (e.charging) {
    // ためていた大技を放つ（封じられていたら不発）
    const charged = usableEnemyActions(e).find((a) => a.id === e.charging);
    e.charging = null;
    if (!charged) {
      s.log.push({ type: 'chargeBroken', enemyId: e.uid, reason: 'sealed' });
      return;
    }
    enemyAttack(s, e, charged);
    return;
  }
  // 使える行動が残っていなければ何もしない
  if (usableEnemyActions(e).length === 0) return;
  const action = chooseEnemyAction(s, e);
  if (action.charge) {
    // 大技は、まず力をためる（このラウンドは攻撃しない）
    e.charging = action.id;
    s.log.push({ type: 'charge', enemyId: e.uid, actionId: action.id, name: action.name });
    return;
  }
  enemyAttack(s, e, action);
}

function enemyAttack(s: BattleState, e: EnemyUnit, action: EnemyActionDef): void {
  s.log.push({ type: 'action', actorIds: [e.uid], actionId: action.id, name: action.name, extra: false });
  const targets = action.target === 'ally' ? [randomPick(s, livingAllies(s))] : livingAllies(s);
  for (const t of targets) damageAlly(s, e, action, t);
}

/** 力をためている大技 */
export function chargingAction(enemy: EnemyUnit): EnemyActionDef | undefined {
  return enemy.charging ? enemy.actions.find((a) => a.id === enemy.charging) : undefined;
}

/** 敵の行動を選ぶ（s の乱数と aiCounter を進める） */
export function chooseEnemyAction(s: BattleState, enemy: EnemyUnit): EnemyActionDef {
  const available = usableEnemyActions(enemy);
  if (enemy.ai.type === 'boss' && enemy.hp < enemy.maxHp * enemy.ai.lowHpRatio) {
    const forceAll = enemy.aiCounter % enemy.ai.allTargetInterval === 0;
    enemy.aiCounter++;
    const allTargets = available.filter((a) => a.target === 'allies');
    if (forceAll && allTargets.length > 0) return randomPick(s, allTargets);
  }
  return randomPick(s, available);
}

/** 部位が壊れて封じられた行動を除いた、使える行動 */
export function usableEnemyActions(enemy: EnemyUnit): EnemyActionDef[] {
  return enemy.actions.filter((a) => !a.requiresPart || !enemy.parts.find((p) => p.id === a.requiresPart)?.broken);
}

/** 狙っていた敵が倒れていたら、残っている敵に向け直す（部位が壊れていたら本体へ） */
function retarget(s: BattleState, def: ActionDef, target: TargetRef | undefined): TargetRef | undefined {
  if (def.target !== 'enemy' || target?.kind !== 'enemy') return target;
  const enemy = findEnemy(s, target.id);
  if (!enemy || !isAlive(enemy)) {
    const other = livingEnemies(s)[0];
    return other ? { kind: 'enemy', id: other.uid } : undefined;
  }
  if (target.partId !== undefined && enemy.parts.find((p) => p.id === target.partId)?.broken) {
    return { kind: 'enemy', id: enemy.uid };
  }
  return target;
}

/** 行動を実行する（s を書き換える）。MPが足りなければ 'mp' */
function perform(
  s: BattleState,
  actor: AllyUnit,
  action: PlayerAction,
  pool: CardInstance[],
  opts: { extra: boolean; boost: boolean },
): { downed: boolean } | 'mp' {
  const r = resolveAction(s, actor, action, pool);
  if (typeof r === 'string') {
    if (r === 'not enough MP') return 'mp';
    throw new Error(r);
  }
  discardCards(s, r.cards.map((c) => c.uid));
  if (r.skill) actor.mp -= skillMpCost(actor, r.skill);
  const members = r.link ? r.link.members.map((id) => findAlly(s, id)!) : [actor];
  s.log.push({ type: 'action', actorIds: members.map((m) => m.uid), actionId: r.def.id, name: r.def.name, extra: opts.extra });

  const ctx: EffectContext = {
    s,
    user: actor,
    attacker: averageStats(members),
    multiplier: opts.boost ? batonMultiplier(actor) : 1,
    combo: action.type === 'combo',
    downed: false,
  };
  const target = retarget(s, r.def, 'target' in action ? action.target : undefined);
  const pick = 'pickCardUid' in action ? action.pickCardUid : undefined;
  for (const effect of r.def.effects) applyEffect(ctx, effect, r.def, target, pick);
  return { downed: ctx.downed };
}

// ---- ワンモア・バトン ----

function triggerOneMore(s: BattleState, actorId: string, chain: string[]): void {
  updateOutcome(s);
  if (s.outcome !== 'ongoing') return;
  s.log.push({ type: 'oneMore', actorId });
  drawCards(s, oneMoreDrawCount(findAlly(s, actorId)!));
  s.extra = { actorId, chain, boost: false };
  s.phase = 'extra';
}

/** 追加行動で使ってよい手札（これから実行する仲間が確保しているカードは使えない） */
export function extraPool(s: BattleState): CardInstance[] {
  return availableHand(s);
}

/** 追加行動ができない理由。できるなら null */
export function getExtraError(s: BattleState, action: PlayerAction): string | null {
  if (s.phase !== 'extra' || !s.extra) return 'no extra action now';
  if (action.type === 'link') return 'links cannot be used as an extra action';
  const actor = findAlly(s, s.extra.actorId)!;
  const r = validate(s, actor, action, extraPool(s));
  return typeof r === 'string' ? r : null;
}

/** ワンモア（またはバトンを受けた）追加行動をすぐに実行する */
export function applyExtra(state: BattleState, action: PlayerAction): BattleState {
  const err = getExtraError(state, action);
  if (err) throw new Error(err);
  const s = clone(state);
  const extra = s.extra!;
  const actor = findAlly(s, extra.actorId)!;
  const result = perform(s, actor, action, extraPool(s), { extra: true, boost: extra.boost });
  s.extra = null;
  s.phase = 'execute';
  updateOutcome(s);
  // 連鎖ワンモア：追加行動で、まだダウンしていない別の敵をダウンさせたら、さらにワンモア
  if (result !== 'mp' && result.downed) triggerOneMore(s, actor.uid, extra.chain);
  return s;
}

/** 追加行動を見送って、実行を続ける */
export function declineExtra(state: BattleState): BattleState {
  if (state.phase !== 'extra') throw new Error('no extra action now');
  const s = clone(state);
  s.extra = null;
  s.phase = 'execute';
  return s;
}

/** バトンタッチを渡せる仲間 */
export function batonTargets(s: BattleState): AllyUnit[] {
  if (s.phase !== 'extra' || !s.extra) return [];
  const extra = s.extra;
  return livingAllies(s).filter((a) => a.uid !== extra.actorId && !extra.chain.includes(a.uid));
}

/** 追加行動を仲間に渡す。受けた仲間の追加行動はダメージ・回復量が上がる */
export function passBaton(state: BattleState, toAllyId: string): BattleState {
  if (!batonTargets(state).some((a) => a.uid === toAllyId)) throw new Error('cannot pass the baton to that ally');
  const s = clone(state);
  const extra = s.extra!;
  s.log.push({ type: 'baton', fromId: extra.actorId, toId: toAllyId });
  s.extra = { actorId: toAllyId, chain: [...extra.chain, toAllyId], boost: true };
  return s;
}

// ---- 効果 ----

/** 連携技では参加者の能力値の平均で計算する */
function averageStats(units: AllyUnit[]): { atk: number; mag: number } {
  const n = units.length;
  return {
    atk: units.reduce((sum, u) => sum + u.atk, 0) / n,
    mag: units.reduce((sum, u) => sum + u.mag, 0) / n,
  };
}

interface EffectContext {
  s: BattleState;
  user: AllyUnit;
  attacker: { atk: number; mag: number };
  multiplier: number;
  /** コンボ（コンボブーストが効く） */
  combo: boolean;
  /** この行動で、まだダウンしていなかった敵をダウンさせた */
  downed: boolean;
}

function applyEffect(
  ctx: EffectContext,
  effect: Effect,
  def: ActionDef,
  target: TargetRef | undefined,
  pickCardUid: number | undefined,
): void {
  const { s } = ctx;
  switch (effect.kind) {
    case 'damage': {
      if (def.target === 'enemy') {
        if (target?.kind === 'enemy') damageEnemy(ctx, findEnemy(s, target.id)!, effect, target.partId);
      } else {
        for (const enemy of livingEnemies(s)) damageEnemy(ctx, enemy, effect, undefined);
      }
      return;
    }
    case 'heal': {
      const targets =
        def.target === 'ally' && target?.kind === 'ally'
          ? [findAlly(s, target.id)!]
          : def.target === 'allies'
            ? livingAllies(s)
            : [ctx.user];
      for (const t of targets) {
        // 自分の番が来るまでに倒れた仲間は回復できない
        if (!t || !isAlive(t)) continue;
        const amount = calcHeal(effect.power, ctx.attacker.mag, ctx.multiplier * (ctx.combo ? 1 + passiveRate(ctx.user, 'comboBoost') : 1));
        t.hp = Math.min(t.maxHp, t.hp + amount);
        s.log.push({ type: 'heal', sourceId: ctx.user.uid, targetId: t.uid, amount, hpAfter: t.hp });
      }
      return;
    }
    case 'draw':
      drawCards(s, effect.count);
      return;
    case 'redraw': {
      // まだ実行していない仲間が確保しているカードは残す
      const discard = availableHand(s).map((c) => c.uid);
      if (discard.length > 0) s.log.push({ type: 'discardHand', cardUids: discard });
      discardCards(s, discard);
      drawCards(s, effect.count);
      return;
    }
    case 'retrieve': {
      // 計画してから実行するまでに捨て札から消えていたら何もしない
      const card = s.discard.find((c) => c.uid === pickCardUid);
      if (!card) return;
      s.discard = s.discard.filter((c) => c !== card);
      s.hand.push(card);
      s.log.push({ type: 'retrieve', cardUid: card.uid });
      return;
    }
    case 'guard':
      ctx.user.guarding = true;
      s.log.push({ type: 'guard', actorId: ctx.user.uid });
      return;
    case 'search':
    case 'precede':
      // サポートカードの効果は useSupport で処理する
      return;
  }
}

/** 部位を狙った時の、部位と本体へのダメージの振り分け */
export function splitPartDamage(amount: number, partMultiplier: number): { body: number; part: number } {
  return {
    part: Math.floor(amount * partMultiplier),
    body: Math.max(MIN_DAMAGE, Math.floor(amount * PART_BODY_RATIO)),
  };
}

function revealWeakness(s: BattleState, enemy: EnemyUnit, element: Element): void {
  if (!enemy.weaknesses.includes(element)) enemy.weaknesses.push(element);
  if (enemy.knownWeaknesses.includes(element)) return;
  enemy.knownWeaknesses.push(element);
  s.log.push({ type: 'weaknessFound', enemyId: enemy.uid, element });
}

type DamageEffect = Extract<Effect, { kind: 'damage' }>;

/**
 * 対象に当てる属性と相性を決める。bestOf があれば弱点 → 耐性でない属性の順に選ぶ。
 * weaknesses を渡すと、その弱点だけを知っているものとして決める（プレビュー用）
 */
export function effectiveHit(
  enemy: EnemyUnit,
  effect: DamageEffect,
  weaknesses: readonly Element[] = enemy.weaknesses,
): { type: DamageType; affinity: Affinity } {
  let type: DamageType = effect.type;
  if (effect.bestOf && effect.bestOf.length > 0) {
    type =
      effect.bestOf.find((el) => weaknesses.includes(el)) ??
      effect.bestOf.find((el) => !enemy.resistances.includes(el)) ??
      effect.bestOf[0];
  }
  let affinity: Affinity = affinityOf(enemy, type);
  if (affinity === 'weak' && type !== 'magic' && !weaknesses.includes(type)) affinity = 'normal';
  if (affinity === 'resist' && effect.ignoreResist) affinity = 'normal';
  return { type, affinity };
}

/** 弱点を突いた時にダウンするか（ダウン中と、立ち上がってまだ行動していない敵はダウンしない） */
export function canBeDowned(enemy: EnemyUnit): boolean {
  return isAlive(enemy) && !enemy.down && !enemy.standUpGuard;
}

function damageEnemy(ctx: EffectContext, enemy: EnemyUnit, effect: DamageEffect, partId: string | undefined): void {
  const { s } = ctx;
  // 連続攻撃の途中で倒れた敵には当てない
  if (!isAlive(enemy)) return;
  const { type, affinity } = effectiveHit(enemy, effect);
  const amount = calcDamage({
    power: effect.power,
    attack: attackStatOf(ctx.attacker, type),
    defense: enemy.def,
    random: randomFactor(random(s)),
    affinity,
    multiplier: ctx.multiplier * passiveDamageMultiplier(ctx.user, type, ctx.combo) * (enemy.guarding ? GUARD_DAMAGE_MULTIPLIER : 1),
  });

  const found = partId !== undefined ? enemy.parts.find((p) => p.id === partId) : undefined;
  // 連続攻撃の途中で部位が壊れたら、残りは本体に当てる
  const part = found && !found.broken ? found : undefined;
  let body = amount;
  let partAmount: number | undefined;
  if (part) {
    const split = splitPartDamage(amount, passivePartMultiplier(ctx.user, effect.partMultiplier));
    body = split.body;
    partAmount = split.part;
    part.hp = Math.max(0, part.hp - partAmount);
  }
  enemy.hp = Math.max(0, enemy.hp - body);
  s.log.push({
    type: 'damage',
    sourceId: ctx.user.uid,
    targetId: enemy.uid,
    partId: part?.id,
    amount: body,
    partAmount,
    affinity,
    hpAfter: enemy.hp,
  });

  if (affinity === 'weak' && type !== 'magic') {
    revealWeakness(s, enemy, type);
    if (canBeDowned(enemy)) {
      enemy.down = true;
      ctx.downed = true;
      s.log.push({ type: 'down', enemyId: enemy.uid });
      if (enemy.charging) {
        // ダウンさせると、ためが解ける
        enemy.charging = null;
        s.log.push({ type: 'chargeBroken', enemyId: enemy.uid, reason: 'down' });
      }
    }
  }
  if (part && part.hp === 0 && !part.broken) {
    part.broken = true;
    s.log.push({ type: 'partBreak', enemyId: enemy.uid, partId: part.id });
    if (enemy.charging && enemy.actions.find((a) => a.id === enemy.charging)?.requiresPart === part.id) {
      // ためていた大技を使う部位が壊れた
      enemy.charging = null;
      s.log.push({ type: 'chargeBroken', enemyId: enemy.uid, reason: 'sealed' });
    }
    for (const el of part.revealsWeakness) revealWeakness(s, enemy, el);
  }
  if (!isAlive(enemy)) {
    enemy.down = false;
    s.log.push({ type: 'defeated', unitId: enemy.uid });
  }
}

function damageAlly(s: BattleState, enemy: EnemyUnit, action: EnemyActionDef, ally: AllyUnit): void {
  const affinity = affinityOf(ally, action.type);
  const amount = calcDamage({
    power: action.power,
    attack: attackStatOf(enemy, action.type),
    defense: ally.def,
    random: randomFactor(random(s)),
    affinity,
    multiplier: ally.guarding ? GUARD_DAMAGE_MULTIPLIER : 1,
  });
  ally.hp = Math.max(0, ally.hp - amount);
  s.log.push({ type: 'damage', sourceId: enemy.uid, targetId: ally.uid, amount, affinity, hpAfter: ally.hp });
  if (!isAlive(ally)) {
    ally.guarding = false;
    s.log.push({ type: 'defeated', unitId: ally.uid });
  }
}

// ---- プレビュー ----

export interface TargetPreview {
  unitId: string;
  partId?: string;
  kind: 'damage' | 'heal';
  /** 本体へのダメージ、または回復量の幅 */
  min: number;
  max: number;
  partMin?: number;
  partMax?: number;
  /** 判明している情報での相性。まだ判明していない弱点は normal として扱う */
  affinity: Affinity;
}

export interface ActionPreview {
  targets: TargetPreview[];
  /** 計画中：この行動をした場合の、このラウンドの行動順での位置（0から）。追加行動では -1 */
  orderIndex: number;
}

/**
 * 行動を選んで対象を指定した時のプレビュー。状態は変えない。
 * 計画中は allyId の仲間の行動として、追加行動中はその仲間の追加行動として計算する
 */
export function previewAction(s: BattleState, allyId: string, action: PlayerAction): ActionPreview {
  const isExtra = s.phase === 'extra';
  const err = isExtra ? getExtraError(s, action) : getPlanError(s, allyId, action);
  if (err) throw new Error(err);
  const actor = findAlly(s, isExtra ? s.extra!.actorId : allyId)!;
  const pool = isExtra ? extraPool(s) : planPool(s, allyId, action);
  const r = resolveAction(s, actor, action, pool) as Resolved;
  const members = r.link ? r.link.members.map((id) => findAlly(s, id)!) : [actor];
  const attacker = averageStats(members);
  const multiplier = isExtra && s.extra!.boost ? batonMultiplier(actor) : 1;
  const combo = action.type === 'combo';
  const target = 'target' in action ? action.target : undefined;
  const targets: TargetPreview[] = [];

  for (const effect of r.def.effects) {
    if (effect.kind === 'damage') {
      const enemies = r.def.target === 'enemy' && target?.kind === 'enemy' ? [findEnemy(s, target.id)!] : livingEnemies(s);
      for (const enemy of enemies) {
        const { type, affinity } = effectiveHit(enemy, effect, enemy.knownWeaknesses);
        const calc = (rand: number) =>
          calcDamage({
            power: effect.power,
            attack: attackStatOf(attacker, type),
            defense: enemy.def,
            random: rand,
            affinity,
            multiplier: multiplier * passiveDamageMultiplier(actor, type, combo) * (enemy.guarding ? GUARD_DAMAGE_MULTIPLIER : 1),
          });
        const lo = calc(RANDOM_MIN);
        const hi = calc(RANDOM_MAX);
        const partId = r.def.target === 'enemy' && target?.kind === 'enemy' ? target.partId : undefined;
        if (partId !== undefined) {
          const pm = passivePartMultiplier(actor, effect.partMultiplier);
          const a = splitPartDamage(lo, pm);
          const b = splitPartDamage(hi, pm);
          targets.push({ unitId: enemy.uid, partId, kind: 'damage', min: a.body, max: b.body, partMin: a.part, partMax: b.part, affinity });
        } else {
          targets.push({ unitId: enemy.uid, kind: 'damage', min: lo, max: hi, affinity });
        }
      }
    }
    if (effect.kind === 'heal') {
      const allies =
        r.def.target === 'ally' && target?.kind === 'ally'
          ? [findAlly(s, target.id)!]
          : r.def.target === 'allies'
            ? livingAllies(s)
            : [actor];
      for (const ally of allies) {
        const amount = calcHeal(effect.power, attacker.mag, multiplier * (combo ? 1 + passiveRate(actor, 'comboBoost') : 1));
        targets.push({ unitId: ally.uid, kind: 'heal', min: amount, max: amount, affinity: 'normal' });
      }
    }
  }

  const orderIndex = isExtra ? -1 : getRoundOrder(s, { allyId, action }).findIndex((e) => e.kind === 'ally' && e.ids.includes(allyId));
  return { targets, orderIndex };
}

// ---- 結果 ----

export interface BattleResult {
  outcome: BattleState['outcome'];
  brokenParts: { enemyId: string; enemyName: string; partId: string; partName: string; material: string }[];
  /** 倒した敵が落とした素材の id */
  drops: string[];
  /** 仲間ごとの行動の回数（防御は数えない。連携技は参加した2人とも数える） */
  actionCounts: Record<string, number>;
}

export function getBattleResult(s: BattleState): BattleResult {
  return {
    outcome: s.outcome,
    brokenParts: s.enemies.flatMap((e) =>
      e.parts
        .filter((p) => p.broken)
        .map((p) => ({ enemyId: e.uid, enemyName: e.name, partId: p.id, partName: p.name, material: p.material })),
    ),
    drops: s.enemies.filter((e) => !isAlive(e)).flatMap((e) => e.drops),
    actionCounts: countActions(s),
  };
}

function countActions(s: BattleState): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(s.allies.map((a) => [a.uid, 0]));
  for (const e of s.log) {
    if (e.type !== 'action' || e.actionId === GUARD.id) continue;
    for (const id of e.actorIds) if (id in out) out[id]++;
  }
  return out;
}
