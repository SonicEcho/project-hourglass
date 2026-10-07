import type { BattleSetup, CharacterDef, EnemyDef } from '../core/types';
import { buildFolder } from './cards';
import { COMBOS } from './combos';
import { ARMOR_DOG, DISTORTED_BEAST, FROST_BAT, SLIME } from './enemies';
import { LINKS } from './links';
import type { NaviPartId } from './navi';
import { NAVI_REWARD_CANDIDATES } from './navi';
import { ITEMS } from './weapons';

// 周回の構成（段階7）：戦闘 → 星図 → 戦闘…の5戦。数値はすべて仮

/** 敵を強くした版（HP・攻撃・魔力を rate 倍）。extraDrops の素材も落とす */
export function strengthen(enemy: EnemyDef, rate: number, extraDrops: string[] = []): EnemyDef {
  return {
    ...enemy,
    drops: [...(enemy.drops ?? []), ...extraDrops],
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
  /** 変わらない名前。セーブはこの名前で覚える（段階13） */
  id: string;
  name: string;
  enemies: EnemyDef[];
  /** 勝った時の星の砂 */
  reward: number;
  /** 勝った時にもらえる通常アイテム（段階9） */
  item?: string;
  boss?: boolean;
  /** 勝った時に選べるギアの候補（段階8。この中から NAVI_REWARD_PICKS 個） */
  naviReward?: NaviPartId[];
}

export const CAMPAIGN: CampaignBattle[] = [
  { id: 'battle1', name: '戦闘1', enemies: [SLIME, SLIME], reward: 4, item: ITEMS.potion.id, naviReward: NAVI_REWARD_CANDIDATES[0] },
  { id: 'battle2', name: '戦闘2', enemies: [SLIME, FROST_BAT], reward: 5, item: ITEMS.ether.id, naviReward: NAVI_REWARD_CANDIDATES[1] },
  { id: 'battle3', name: '戦闘3', enemies: [SLIME, FROST_BAT, ARMOR_DOG], reward: 6, item: ITEMS.potion.id, naviReward: NAVI_REWARD_CANDIDATES[2] },
  {
    id: 'battle4',
    name: '戦闘4',
    enemies: [SLIME, FROST_BAT, ARMOR_DOG].map((e) => strengthen(e, 1.3, [ITEMS.steelClaw.id])),
    reward: 7,
    item: ITEMS.hiPotion.id,
    naviReward: NAVI_REWARD_CANDIDATES[3],
  },
  { id: 'battle5', name: '戦闘5（ボス）', enemies: [DISTORTED_BEAST], reward: 0, boss: true },
];

/** 戦闘の設定。allies は成長を反映したキャラ */
export function createCampaignSetup(battle: CampaignBattle, seed: number, allies: CharacterDef[]): BattleSetup {
  return {
    allies,
    enemies: battle.enemies,
    deck: buildFolder(),
    links: LINKS,
    combos: COMBOS,
    seed,
  };
}
