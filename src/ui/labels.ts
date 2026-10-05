import type { DamageType } from '../core';
import { WEIGHT_LABELS } from '../data/constants';

// 画面に依存しない表示用の文字（テストからも使う）

export const ELEMENT_LABEL: Record<DamageType, string> = {
  physical: '物理',
  fire: '火',
  ice: '氷',
  thunder: '雷',
  magic: '魔法',
};

/** 重さを「軽い／普通／重い／超重い」で表す */
export function weightLabel(weight: number): string {
  return (WEIGHT_LABELS.find((w) => weight <= w.max + 1e-9) ?? WEIGHT_LABELS[WEIGHT_LABELS.length - 1]).label;
}
