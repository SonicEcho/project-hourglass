import type { BattleSetup, BattleState, CardDef, CharacterDef, EnemyDef, LogEvent, PlayerAction, SkillDef, Stats } from '../../src/core';
import { createBattle, runUntilInput, setPlan, startExecution } from '../../src/core';
import { buildFolder, COMBOS, LINKS } from '../../src/data';

/** テスト用の味方。能力値は上書きできる */
export function ally(id: string, stats: Partial<Stats> = {}, skills: SkillDef[] = []): CharacterDef {
  return {
    id,
    name: id,
    stats: { hp: 100, mp: 50, atk: 10, mag: 10, def: 10, spd: 10, ...stats },
    skills,
  };
}

/** テスト用の敵。HPは多め、速さは遅めにしてある */
export function enemy(id: string, stats: Partial<EnemyDef['stats']> = {}, extra: Partial<EnemyDef> = {}): EnemyDef {
  return {
    id,
    name: id,
    stats: { hp: 9999, atk: 10, mag: 10, def: 10, spd: 1, ...stats },
    weaknesses: [],
    resistances: [],
    actions: [{ id: 'hit', name: 'hit', target: 'ally', type: 'physical', power: 10, weight: 1.0 }],
    ai: { type: 'random' },
    ...extra,
  };
}

export function setup(partial: Partial<BattleSetup>): BattleSetup {
  return {
    allies: [ally('hero')],
    enemies: [enemy('dummy')],
    deck: buildFolder(),
    links: LINKS,
    combos: COMBOS,
    seed: 1,
    ...partial,
  };
}

/** 戦闘を作る（1ラウンド目の計画の状態） */
export function battle(partial: Partial<BattleSetup> = {}): BattleState {
  return createBattle(setup(partial));
}

/** 手札を指定したスナップに入れ替える（テスト用に状態を書き換える） */
export function withHand(state: BattleState, cards: CardDef[]): BattleState {
  const s = structuredClone(state);
  s.discard.push(...s.hand);
  s.hand = cards.map((card, i) => ({ uid: 1000 + i, card: structuredClone(card) }));
  return s;
}

/** 何人分かの計画をまとめて決める */
export function planAll(s: BattleState, plans: Record<string, PlayerAction>): BattleState {
  let out = s;
  for (const [id, action] of Object.entries(plans)) out = setPlan(out, id, action);
  return out;
}

/** 計画を確定して、入力が必要になるまで実行する */
export function execute(s: BattleState): BattleState {
  return runUntilInput(startExecution(s));
}

export function eventsOf<T extends LogEvent['type']>(s: BattleState, type: T, from = 0): Extract<LogEvent, { type: T }>[] {
  return s.log.slice(from).filter((e): e is Extract<LogEvent, { type: T }> => e.type === type);
}

export const attackOn = (id: string, partId?: string): PlayerAction => ({ type: 'attack', target: { kind: 'enemy', id, partId } });
export const guard: PlayerAction = { type: 'guard' };
