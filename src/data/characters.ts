import type { CharacterDef } from '../core/types';
import { SKILLS } from './skills';

// 段階5（調整3回目）：HPを1.2倍にした（元は 120 / 100 / 85）
export const HERO: CharacterDef = {
  id: 'hero',
  name: 'ハルト',
  stats: { hp: 144, mp: 24, atk: 18, mag: 16, def: 12, spd: 12 },
  skills: [SKILLS.fire, SKILLS.breakSlash],
};

export const AKARI: CharacterDef = {
  id: 'akari',
  name: 'あかり',
  stats: { hp: 120, mp: 36, atk: 12, mag: 20, def: 10, spd: 10 },
  skills: [SKILLS.care, SKILLS.careAll, SKILLS.ice],
};

export const MIO: CharacterDef = {
  id: 'mio',
  name: 'みお',
  stats: { hp: 102, mp: 24, atk: 14, mag: 14, def: 8, spd: 16 },
  skills: [SKILLS.thunder, SKILLS.shuffle, SKILLS.swap],
};

/**
 * 小夜子（段階91a。3章の祭りの夜の2晩目から戦う）。物理と部位破壊が得意（docs/CONCEPT.md の仲間の表）。
 * 3章の途中から加わるので、星図の分を見こんで、元の能力値を少し高くした（数値は npm run measure の「3章の祭りの夜」で測った）
 */
export const SAYOKO: CharacterDef = {
  id: 'sayoko',
  name: '小夜子',
  stats: { hp: 190, mp: 30, atk: 30, mag: 14, def: 16, spd: 16 },
  skills: [SKILLS.kabutoWari, SKILLS.tsukiBarai],
};

export const PARTY: CharacterDef[] = [HERO, AKARI, MIO, SAYOKO];
