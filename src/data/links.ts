import type { LinkDef } from '../core/types';

/** ハルトとみおの2人技 */
export const CROSS_DRIVE: LinkDef = {
  id: 'crossDrive',
  name: 'クロスドライブ',
  members: ['hero', 'mio'],
  weight: 1.5,
  target: 'enemies',
  effects: [
    // 連携技は耐性を無視する
    { kind: 'damage', type: 'physical', power: 50, ignoreResist: true },
    { kind: 'draw', count: 2 },
  ],
};

export const LINKS: LinkDef[] = [CROSS_DRIVE];
