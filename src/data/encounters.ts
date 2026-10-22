import type { BattleSetup, EnemyDef } from '../core/types';
import { buildFolder } from './cards';
import { AKARI, HERO, MIO } from './characters';
import { ARMOR_DOG, DISTORTED_BEAST, FROST_BAT, SLIME } from './enemies';
import { COMBOS } from './combos';
import { LINKS } from './links';

export type EncounterId = 'battle1' | 'battle2';

/** 戦闘の構成。戦闘1（雑魚戦）→ 戦闘2（ボス戦）の連戦 */
export const ENCOUNTERS: Record<EncounterId, { name: string; enemies: EnemyDef[] }> = {
  battle1: { name: '戦闘1（雑魚戦）', enemies: [SLIME, FROST_BAT, ARMOR_DOG] },
  battle2: { name: '戦闘2（ボス戦）', enemies: [DISTORTED_BEAST] },
};

/** 戦闘開始時の設定を作る。HPとMPは毎戦闘全回復した状態で始まる */
export function createEncounterSetup(id: EncounterId, seed: number): BattleSetup {
  return {
    // 試作の5戦は、今までどおり3人（段階91a で小夜子が仲間に加わっても変えない）
    allies: [HERO, AKARI, MIO],
    enemies: ENCOUNTERS[id].enemies,
    deck: buildFolder(),
    links: LINKS,
    combos: COMBOS,
    seed,
  };
}
