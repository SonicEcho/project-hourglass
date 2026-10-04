import type { CharacterDef } from '../core/types';
import { SKILLS } from './skills';

export const HERO: CharacterDef = {
  id: 'hero',
  name: '主人公',
  stats: { hp: 120, mp: 30, atk: 18, mag: 16, def: 12, spd: 12 },
  skills: [SKILLS.fire, SKILLS.breakSlash],
};

export const AKARI: CharacterDef = {
  id: 'akari',
  name: 'あかり',
  stats: { hp: 100, mp: 45, atk: 12, mag: 20, def: 10, spd: 10 },
  skills: [SKILLS.care, SKILLS.careAll, SKILLS.ice],
};

export const MIO: CharacterDef = {
  id: 'mio',
  name: 'みお',
  stats: { hp: 85, mp: 30, atk: 14, mag: 14, def: 8, spd: 16 },
  skills: [SKILLS.thunder, SKILLS.shuffle, SKILLS.swap],
};

export const PARTY: CharacterDef[] = [HERO, AKARI, MIO];
