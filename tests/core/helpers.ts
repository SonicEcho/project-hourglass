import type { BattleSetup, BattleState, CharacterDef, EnemyDef, LogEvent, SkillDef, Stats } from '../../src/core';
import { buildFolder, LINKS } from '../../src/data';

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
    seed: 1,
    ...partial,
  };
}

export function eventsOf<T extends LogEvent['type']>(s: BattleState, type: T, from = 0): Extract<LogEvent, { type: T }>[] {
  return s.log.slice(from).filter((e): e is Extract<LogEvent, { type: T }> => e.type === type);
}
