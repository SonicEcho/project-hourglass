import type Phaser from 'phaser';
import { hasImage } from '../assets/loader';
import { CAST } from '../data';

/** 会話の人と表情 → 使える立ち絵の台帳の id（その表情の絵、なければ代わりの表情の絵。どちらもなければ ''） */
export function portraitImageId(scene: Phaser.Scene, castName: string, face: string): string {
  const def = CAST[castName];
  if (!def?.portrait) return '';
  const idOf = (f: string) => `${def.portrait}.${def.faces[f] ?? f}`;
  return [face, def.fallback?.[face]].map((f) => (f ? idOf(f) : '')).find((x) => x && hasImage(scene, x)) ?? '';
}
