import type { LinkDef } from '../core/types';

/** 主人公とみおの2人技 */
export const CROSS_DRIVE: LinkDef = {
  id: 'crossDrive',
  name: 'クロスドライブ',
  members: ['hero', 'mio'],
  weight: 1.5,
  target: 'enemies',
  effects: [
    { kind: 'damage', type: 'physical', power: 50 },
    { kind: 'draw', count: 2 },
  ],
};

export const LINKS: LinkDef[] = [CROSS_DRIVE];
