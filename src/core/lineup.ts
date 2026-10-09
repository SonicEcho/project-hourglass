// パーティと育成の開放（段階26）：章ごとに、戦う仲間と、開けている育成の画面を持つ。Phaser に依存しない。
// 誰が・何が開いているかは data 側（物語の流れの章）が決める。ここでは、その読み方だけを扱う
import type { LinkDef } from './types';

/** 開けている育成の画面（星図・ムーブメント・武器） */
export interface Unlocks {
  growth: boolean;
  navi: boolean;
  weapon: boolean;
}

/** 戦う仲間（並びの順に戦闘の枠に並ぶ）と、開けている育成 */
export interface Lineup {
  members: string[];
  unlocks: Unlocks;
}

/** 仲間の一覧から、パーティにいる人だけを、パーティの並びの順に取り出す */
export function lineupMembers<T extends { id: string }>(chars: T[], lineup: Lineup): T[] {
  return lineup.members.map((id) => chars.find((c) => c.id === id)).filter((c): c is T => !!c);
}

/** パーティで使える連携技（組む全員がパーティにいるものだけ） */
export function usableLinks(links: LinkDef[], members: string[]): LinkDef[] {
  return links.filter((l) => l.members.every((id) => members.includes(id)));
}

/** パーティのデータの書き間違い（知らない仲間、重なり、空）を返す（テストで使う） */
export function checkLineup(lineup: Lineup, characterIds: string[]): string[] {
  const errors: string[] = [];
  if (lineup.members.length === 0) errors.push('パーティが空');
  for (const id of lineup.members) if (!characterIds.includes(id)) errors.push(`知らない仲間 ${id}`);
  const dup = lineup.members.filter((id, i) => lineup.members.indexOf(id) !== i);
  if (dup.length > 0) errors.push(`仲間が重なっている：${dup.join('、')}`);
  return errors;
}

/** 戦闘をまたいで引き継ぐ、連携技のつながりゲージ（章の中だけ。段階26の調整3） */
export interface ChapterGauge {
  /** 貯めた章（物語の流れの章の id） */
  chapter: string;
  value: number;
}

/** 今の章で使えるゲージの量。別の章で貯めたもの・なければ0（章が変わると0に戻る） */
export function gaugeInChapter(g: ChapterGauge | null, chapter: string | undefined): number {
  return g && chapter !== undefined && g.chapter === chapter ? g.value : 0;
}
