import {
  BASIC_ATTACK,
  BATON_MULTIPLIER,
  FORECAST_ACTION_WEIGHT,
  FORECAST_LENGTH,
  GUARD,
  GUARD_DAMAGE_MULTIPLIER,
  INITIAL_ACTION_WEIGHT,
  MIN_DAMAGE,
  PART_BODY_RATIO,
  RANDOM_MAX,
  RANDOM_MIN,
  STAND_UP_WEIGHT,
} from '../data/constants';
import { type CtEntry, ctDelay, pickNext } from './ctb';
import { affinityOf, attackStatOf, calcDamage, calcHeal, randomFactor } from './damage';
import { discardHand, drawCards, refillHand } from './deck';
import { random, randomPick, shuffleInPlace } from './rng';
import type {
  ActionDef,
  Affinity,
  AllyUnit,
  BattleSetup,
  BattleState,
  CardInstance,
  CtChange,
  Effect,
  Element,
  EnemyActionDef,
  EnemyUnit,
  LinkDef,
  PlayerAction,
  SkillDef,
  TargetRef,
  Unit,
} from './types';

// 公開している関数は、受け取った状態を書き換えず、新しい状態を返す。
// 内部では複製した状態 s を書き換えて組み立てる。

const clone = <T>(v: T): T => structuredClone(v);

// ---- 作成と参照 ----

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
    ct: ctDelay(def.stats.spd, INITIAL_ACTION_WEIGHT),
    guarding: false,
    batonBoost: false,
    skills: clone(def.skills),
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
    ct: ctDelay(def.stats.spd, INITIAL_ACTION_WEIGHT),
    guarding: false,
    weaknesses: [...def.weaknesses],
    resistances: [...def.resistances],
    knownWeaknesses: [],
    down: false,
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
  }));
  const s: BattleState = {
    seed: setup.seed,
    rng: setup.seed >>> 0,
    allies,
    enemies,
    links: clone(setup.links ?? []),
    deck: setup.deck.map((card, uid) => ({ uid, card: clone(card) })),
    hand: [],
    discard: [],
    turn: null,
    outcome: 'ongoing',
    log: [{ type: 'battleStart', seed: setup.seed }],
  };
  shuffleInPlace(s, s.deck);
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

/** 今の手番の味方。味方の手番でなければ undefined */
export function currentAlly(s: BattleState): AllyUnit | undefined {
  return s.turn ? findAlly(s, s.turn.actorId) : undefined;
}

// ---- 行動順 ----

export interface ForecastEntry {
  id: string;
  side: 'ally' | 'enemy';
}

export interface ForecastOptions {
  count?: number;
  /**
   * 今の手番の行動で待ち時間が加算される者と、その行動の重さ。
   * 省略時は今の行動者が重さ1.0の行動をするとみなす。ワンモア中の行動者には加算しない。
   */
  pending?: { id: string; weight: number }[];
}

/**
 * 行動順の予測。手番中なら先頭は今の行動者。
 * その後の行動は重さ1.0（ダウン中の敵の立ち上がりは STAND_UP_WEIGHT）とみなして並べる。
 */
export function getTurnForecast(s: BattleState, opts: ForecastOptions = {}): ForecastEntry[] {
  const count = opts.count ?? FORECAST_LENGTH;
  const entries: (CtEntry & { down: boolean })[] = [...s.allies, ...s.enemies].filter(isAlive).map((u) => ({
    id: u.uid,
    side: u.side,
    spd: u.spd,
    ct: u.ct,
    down: u.side === 'enemy' && u.down,
  }));
  const result: ForecastEntry[] = [];
  if (s.outcome !== 'ongoing') return result;

  if (s.turn) {
    const turn = s.turn;
    const actor = entries.find((e) => e.id === turn.actorId);
    if (actor) result.push({ id: actor.id, side: actor.side });
    const pending = opts.pending ?? [{ id: turn.actorId, weight: FORECAST_ACTION_WEIGHT }];
    for (const p of pending) {
      if (p.id === turn.actorId && turn.oneMoreActive) continue;
      const e = entries.find((x) => x.id === p.id);
      if (e) e.ct += ctDelay(e.spd, p.weight);
    }
  }

  while (result.length < count) {
    const next = pickNext(entries);
    if (!next) break;
    result.push({ id: next.id, side: next.side });
    next.ct += ctDelay(next.spd, next.down ? STAND_UP_WEIGHT : FORECAST_ACTION_WEIGHT);
    next.down = false;
  }
  return result;
}

// ---- 手番の進行 ----

/** 次の行動者の手番を始める。味方なら手札を補充し、防御を解く */
export function startNextTurn(state: BattleState): BattleState {
  if (state.outcome !== 'ongoing') throw new Error('battle is over');
  if (state.turn) throw new Error('a turn is already in progress');
  const s = clone(state);
  const units = [...s.allies, ...s.enemies].filter(isAlive);
  const next = pickNext(units.map((u) => ({ id: u.uid, side: u.side, spd: u.spd, ct: u.ct })));
  if (!next) throw new Error('no one can act');
  beginTurn(s, next.id, []);
  return s;
}

function beginTurn(s: BattleState, actorId: string, batonChain: string[]): void {
  const unit = findUnit(s, actorId)!;
  s.turn = { actorId, oneMoreActive: false, oneMoreUsed: false, batonChain };
  unit.guarding = false;
  s.log.push({ type: 'turnStart', actorId, ct: unit.ct });
  if (unit.side === 'ally') refillHand(s);
}

/** 敵の手番を実行する。ダウン中なら立ち上がりに使い、行動しない */
export function runEnemyTurn(state: BattleState): BattleState {
  const enemy = state.turn ? findEnemy(state, state.turn.actorId) : undefined;
  if (!enemy) throw new Error("not an enemy's turn");
  const s = clone(state);
  const e = findEnemy(s, enemy.uid)!;
  const before = e.ct;
  if (e.down) {
    e.down = false;
    e.ct += ctDelay(e.spd, STAND_UP_WEIGHT);
    s.log.push({ type: 'standUp', enemyId: e.uid, ct: [{ unitId: e.uid, before, after: e.ct }] });
  } else {
    const action = chooseEnemyAction(s, e);
    e.ct += ctDelay(e.spd, action.weight);
    s.log.push({
      type: 'action',
      actorId: e.uid,
      actionId: action.id,
      name: action.name,
      ct: [{ unitId: e.uid, before, after: e.ct }],
    });
    const targets = action.target === 'ally' ? [randomPick(s, livingAllies(s))] : livingAllies(s);
    for (const t of targets) damageAlly(s, e, action, t);
  }
  s.turn = null;
  updateOutcome(s);
  return s;
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

/** 味方の手番が来るか、戦闘が終わるまで進める（敵の手番はすべて実行する） */
export function advanceToPlayerTurn(state: BattleState): BattleState {
  let s = state;
  for (let guard = 0; guard < 10000; guard++) {
    if (s.outcome !== 'ongoing') return s;
    if (!s.turn) {
      s = startNextTurn(s);
      continue;
    }
    if (findAlly(s, s.turn.actorId)) return s;
    s = runEnemyTurn(s);
  }
  throw new Error('advanceToPlayerTurn: too many iterations');
}

function updateOutcome(s: BattleState): void {
  if (s.outcome !== 'ongoing') return;
  if (livingEnemies(s).length === 0) s.outcome = 'victory';
  else if (livingAllies(s).length === 0) s.outcome = 'defeat';
  else return;
  s.turn = null;
  s.log.push({ type: 'battleEnd', outcome: s.outcome });
}

// ---- 味方の行動 ----

interface Resolved {
  def: ActionDef;
  card?: CardInstance;
  skill?: SkillDef;
  link?: LinkDef;
}

function resolveAction(s: BattleState, actor: AllyUnit, action: PlayerAction): Resolved | string {
  switch (action.type) {
    case 'attack':
      return { def: BASIC_ATTACK };
    case 'guard':
      return { def: GUARD };
    case 'card': {
      const card = s.hand.find((c) => c.uid === action.cardUid);
      if (!card) return 'card is not in hand';
      return { def: card.card, card };
    }
    case 'skill': {
      const skill = actor.skills.find((k) => k.id === action.skillId);
      if (!skill) return 'unknown skill';
      if (actor.mp < skill.mp) return 'not enough MP';
      return { def: skill, skill };
    }
    case 'link': {
      const link = s.links.find((l) => l.id === action.linkId);
      if (!link) return 'unknown link';
      return { def: link, link };
    }
    case 'baton':
      return 'baton is not a regular action';
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

/** 連携技が使えるか。参加者の一方の手番で、もう一方の次の手番までに敵の手番が挟まらないこと */
export function canUseLink(s: BattleState, linkId: string): boolean {
  const link = s.links.find((l) => l.id === linkId);
  if (!link || s.outcome !== 'ongoing' || !s.turn || s.turn.oneMoreActive) return false;
  const actorId = s.turn.actorId;
  if (!link.members.includes(actorId)) return false;
  const partnerId = link.members[0] === actorId ? link.members[1] : link.members[0];
  const partner = findAlly(s, partnerId);
  if (!partner || !isAlive(partner)) return false;
  const forecast = getTurnForecast(s);
  for (let i = 1; i < forecast.length; i++) {
    if (forecast[i].id === partnerId) return true;
    if (forecast[i].side === 'enemy') return false;
  }
  return false;
}

/** バトンタッチを渡せる仲間 */
export function batonTargets(s: BattleState): AllyUnit[] {
  if (s.outcome !== 'ongoing' || !s.turn?.oneMoreActive) return [];
  const turn = s.turn;
  return livingAllies(s).filter((a) => a.uid !== turn.actorId && !turn.batonChain.includes(a.uid));
}

/** 行動できない理由。できるなら null */
export function getActionError(s: BattleState, action: PlayerAction): string | null {
  if (s.outcome !== 'ongoing') return 'battle is over';
  const actor = currentAlly(s);
  if (!actor) return "not an ally's turn";
  if (action.type === 'baton') {
    if (!s.turn!.oneMoreActive) return 'baton touch is only available during one more';
    if (!batonTargets(s).some((a) => a.uid === action.toAllyId)) return 'cannot pass the baton to that ally';
    return null;
  }
  const r = resolveAction(s, actor, action);
  if (typeof r === 'string') return r;
  if (r.link && !canUseLink(s, r.link.id)) return 'link conditions are not met';
  const target = 'target' in action ? action.target : undefined;
  const err = targetError(s, r.def, target);
  if (err) return err;
  if (r.def.effects.some((e) => e.kind === 'retrieve')) {
    const pick = 'pickCardUid' in action ? action.pickCardUid : undefined;
    if (pick === undefined || !s.discard.some((c) => c.uid === pick)) return 'pick a card from the discard pile';
  }
  return null;
}

/** 味方の行動を適用する。行動できない時は例外 */
export function applyAction(state: BattleState, action: PlayerAction): BattleState {
  const err = getActionError(state, action);
  if (err) throw new Error(err);
  const s = clone(state);
  const turn = s.turn!;
  const actor = currentAlly(s)!;

  if (action.type === 'baton') {
    const to = findAlly(s, action.toAllyId)!;
    s.log.push({ type: 'baton', fromId: actor.uid, toId: to.uid });
    to.batonBoost = true;
    beginTurn(s, to.uid, [...turn.batonChain, actor.uid]);
    return s;
  }

  const r = resolveAction(s, actor, action) as Resolved;
  if (r.card) {
    s.hand = s.hand.filter((c) => c.uid !== r.card!.uid);
    s.discard.push(r.card);
  }
  if (r.skill) actor.mp -= r.skill.mp;

  const members = r.link ? r.link.members.map((id) => findAlly(s, id)!) : [actor];
  const ct: CtChange[] = [];
  if (!turn.oneMoreActive) {
    for (const m of members) {
      const before = m.ct;
      m.ct += ctDelay(m.spd, r.def.weight);
      ct.push({ unitId: m.uid, before, after: m.ct });
    }
  }
  s.log.push({ type: 'action', actorId: actor.uid, actionId: r.def.id, name: r.def.name, ct });

  const ctx: EffectContext = {
    s,
    user: actor,
    attacker: averageStats(members),
    multiplier: actor.batonBoost ? BATON_MULTIPLIER : 1,
    downed: false,
  };
  actor.batonBoost = false;
  for (const effect of r.def.effects) {
    applyEffect(ctx, effect, r.def, 'target' in action ? action.target : undefined, 'pickCardUid' in action ? action.pickCardUid : undefined);
  }

  updateOutcome(s);
  if (s.outcome !== 'ongoing') return s;
  if (ctx.downed && !turn.oneMoreUsed) {
    turn.oneMoreActive = true;
    turn.oneMoreUsed = true;
    s.log.push({ type: 'oneMore', actorId: actor.uid });
  } else {
    s.turn = null;
  }
  return s;
}

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
  /** この行動で敵をダウンさせた */
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
      if (def.target === 'enemy' && target?.kind === 'enemy') {
        damageEnemy(ctx, findEnemy(s, target.id)!, effect, target.partId);
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
        const amount = calcHeal(effect.power, ctx.attacker.mag, ctx.multiplier);
        t.hp = Math.min(t.maxHp, t.hp + amount);
        s.log.push({ type: 'heal', sourceId: ctx.user.uid, targetId: t.uid, amount, hpAfter: t.hp });
      }
      return;
    }
    case 'draw':
      drawCards(s, effect.count);
      return;
    case 'redraw':
      discardHand(s);
      drawCards(s, effect.count);
      return;
    case 'retrieve': {
      const card = s.discard.find((c) => c.uid === pickCardUid)!;
      s.discard = s.discard.filter((c) => c !== card);
      s.hand.push(card);
      s.log.push({ type: 'retrieve', cardUid: card.uid });
      return;
    }
    case 'guard':
      ctx.user.guarding = true;
      s.log.push({ type: 'guard', actorId: ctx.user.uid });
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

function damageEnemy(
  ctx: EffectContext,
  enemy: EnemyUnit,
  effect: Extract<Effect, { kind: 'damage' }>,
  partId: string | undefined,
): void {
  const { s } = ctx;
  const affinity = affinityOf(enemy, effect.type);
  const amount = calcDamage({
    power: effect.power,
    attack: attackStatOf(ctx.attacker, effect.type),
    defense: enemy.def,
    random: randomFactor(random(s)),
    affinity,
    multiplier: ctx.multiplier * (enemy.guarding ? GUARD_DAMAGE_MULTIPLIER : 1),
  });

  const part = partId !== undefined ? enemy.parts.find((p) => p.id === partId) : undefined;
  let body = amount;
  let partAmount: number | undefined;
  if (part) {
    const split = splitPartDamage(amount, effect.partMultiplier ?? 1);
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

  if (affinity === 'weak' && effect.type !== 'magic') {
    revealWeakness(s, enemy, effect.type);
    if (isAlive(enemy) && !enemy.down) {
      enemy.down = true;
      ctx.downed = true;
      s.log.push({ type: 'down', enemyId: enemy.uid });
    }
  }
  if (part && part.hp === 0 && !part.broken) {
    part.broken = true;
    s.log.push({ type: 'partBreak', enemyId: enemy.uid, partId: part.id });
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
    ally.batonBoost = false;
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
  /** 行動後に行動者の手番が次に来る位置（行動順の予測の添字）。8手番内に来なければ -1 */
  nextTurnIndex: number;
}

/** 行動を選んで対象を指定した時のプレビュー。状態は変えない */
export function previewAction(s: BattleState, action: PlayerAction): ActionPreview {
  const err = getActionError(s, action);
  if (err) throw new Error(err);
  const actor = currentAlly(s)!;
  if (action.type === 'baton') return { targets: [], nextTurnIndex: -1 };
  const r = resolveAction(s, actor, action) as Resolved;
  const members = r.link ? r.link.members.map((id) => findAlly(s, id)!) : [actor];
  const attacker = averageStats(members);
  const multiplier = actor.batonBoost ? BATON_MULTIPLIER : 1;
  const target = 'target' in action ? action.target : undefined;
  const targets: TargetPreview[] = [];

  for (const effect of r.def.effects) {
    if (effect.kind === 'damage') {
      const enemies =
        r.def.target === 'enemy' && target?.kind === 'enemy' ? [findEnemy(s, target.id)!] : livingEnemies(s);
      for (const enemy of enemies) {
        let affinity = affinityOf(enemy, effect.type);
        if (affinity === 'weak' && !enemy.knownWeaknesses.includes(effect.type as Element)) affinity = 'normal';
        const calc = (rand: number) =>
          calcDamage({
            power: effect.power,
            attack: attackStatOf(attacker, effect.type),
            defense: enemy.def,
            random: rand,
            affinity,
            multiplier: multiplier * (enemy.guarding ? GUARD_DAMAGE_MULTIPLIER : 1),
          });
        const lo = calc(RANDOM_MIN);
        const hi = calc(RANDOM_MAX);
        const partId = r.def.target === 'enemy' && target?.kind === 'enemy' ? target.partId : undefined;
        if (partId !== undefined) {
          const pm = effect.partMultiplier ?? 1;
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
        const amount = calcHeal(effect.power, attacker.mag, multiplier);
        targets.push({ unitId: ally.uid, kind: 'heal', min: amount, max: amount, affinity: 'normal' });
      }
    }
  }

  const forecast = getTurnForecast(s, { pending: members.map((m) => ({ id: m.uid, weight: r.def.weight })) });
  const nextTurnIndex = forecast.findIndex((e, i) => i > 0 && e.id === actor.uid);
  return { targets, nextTurnIndex };
}

// ---- 結果 ----

export interface BattleResult {
  outcome: BattleState['outcome'];
  brokenParts: { enemyId: string; enemyName: string; partId: string; partName: string; material: string }[];
}

export function getBattleResult(s: BattleState): BattleResult {
  return {
    outcome: s.outcome,
    brokenParts: s.enemies.flatMap((e) =>
      e.parts
        .filter((p) => p.broken)
        .map((p) => ({ enemyId: e.uid, enemyName: e.name, partId: p.id, partName: p.name, material: p.material })),
    ),
  };
}
