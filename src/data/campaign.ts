import type { BattleSetup, CharacterDef, EnemyDef } from '../core/types';
import { buildFolder } from './cards';
import { COMBOS } from './combos';
import { ARMOR_DOG, DISTORTED_BEAST, FROST_BAT, SLIME } from './enemies';
import { LINKS } from './links';

// 周回の構成（段階7）：戦闘 → 成長マップ → 戦闘…の5戦。数値はすべて仮

/** 敵を強くした版（HP・攻撃・魔力を rate 倍） */
export function strengthen(enemy: EnemyDef, rate: number): EnemyDef {
  return {
    ...enemy,
    name: `${enemy.name}+`,
    stats: {
      ...enemy.stats,
      hp: Math.round(enemy.stats.hp * rate),
      atk: Math.round(enemy.stats.atk * rate),
      mag: Math.round(enemy.stats.mag * rate),
    },
  };
}

export interface CampaignBattle {
  name: string;
  enemies: EnemyDef[];
  /** 勝った時の記憶ポイント */
  reward: number;
  boss?: boolean;
}

export const CAMPAIGN: CampaignBattle[] = [
  { name: '戦闘1', enemies: [SLIME, SLIME], reward: 4 },
  { name: '戦闘2', enemies: [SLIME, FROST_BAT], reward: 5 },
  { name: '戦闘3', enemies: [SLIME, FROST_BAT, ARMOR_DOG], reward: 6 },
  { name: '戦闘4', enemies: [SLIME, FROST_BAT, ARMOR_DOG].map((e) => strengthen(e, 1.2)), reward: 7 },
  { name: '戦闘5（ボス）', enemies: [DISTORTED_BEAST], reward: 0, boss: true },
];

/** 周回の戦闘の設定。allies は成長を反映したキャラ */
export function createCampaignSetup(index: number, seed: number, allies: CharacterDef[]): BattleSetup {
  return {
    allies,
    enemies: CAMPAIGN[index].enemies,
    deck: buildFolder(),
    links: LINKS,
    combos: COMBOS,
    seed,
  };
}
