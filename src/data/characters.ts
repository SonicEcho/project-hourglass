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

export const PARTY: CharacterDef[] = [HERO, AKARI, MIO];
