import type { DamageType } from '../core';

// 画面に依存しない表示用の文字（テストからも使う）

export const ELEMENT_LABEL: Record<DamageType, string> = {
  physical: '物理',
  fire: '火',
  ice: '氷',
  thunder: '雷',
  magic: '魔法',
};
