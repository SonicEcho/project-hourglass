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
  /** 物語の何章か（段階49。星図の章の鍵と、武器のレベルの上限に使う。試作の5戦は書かない＝制限なし） */
  chapter?: number;
  /**
   * 戦闘に出る人数（段階91a）。書かなければ members の全員。members の方が多い時は、遊ぶ人が「並び」で選ぶ（chooseParty）。
   * 選ばなかった仲間も、星図・武器・ムーブメントは育てられる（育成の画面は members の全員）
   */
  size?: number;
  /** 並びから外せない仲間（段階91a。ハルトなど） */
  fixed?: string[];
}

/**
 * 戦闘に出る仲間の並び（段階91a）。chosen は遊ぶ人が選んだ並び（セーブの party）、extraFixed は物語でその時だけ外せない仲間（晩の fixed）。
 * 外せない仲間を先に（members の順で）、残りを chosen の順で入れ、size に届かなければ members の順で足す
 */
export function chooseParty(lineup: Lineup, chosen: readonly string[], extraFixed: readonly string[] = []): string[] {
  const size = Math.min(lineup.size ?? lineup.members.length, lineup.members.length);
  const fixedIds = new Set([...(lineup.fixed ?? []), ...extraFixed]);
  const out = lineup.members.filter((id) => fixedIds.has(id)).slice(0, size);
  for (const id of [...chosen, ...lineup.members]) {
    if (out.length >= size) break;
    if (lineup.members.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** 戦闘に出るパーティ（段階91a）：members を chooseParty の並びにしたもの。size がなければ、そのまま */
export function battleLineup(lineup: Lineup, chosen: readonly string[], extraFixed: readonly string[] = []): Lineup {
  if (lineup.size === undefined || lineup.size >= lineup.members.length) return lineup;
  return { ...lineup, members: chooseParty(lineup, chosen, extraFixed) };
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
