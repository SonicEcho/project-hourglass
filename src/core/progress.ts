// 周回の進み具合（段階13）：章 → 区画 → 戦闘。Phaser に依存しない。
// 戦闘の中身（敵や報酬）は data 側が決めるので、ここでは名前（id）と並び順だけを扱う

export interface StoryBattle {
  id: string;
}

export interface StoryArea<B extends StoryBattle = StoryBattle> {
  id: string;
  name: string;
  battles: B[];
}

export interface StoryChapter<B extends StoryBattle = StoryBattle> {
  id: string;
  name: string;
  areas: StoryArea<B>[];
}

export type Story<B extends StoryBattle = StoryBattle> = StoryChapter<B>[];

/** 次に戦う場所と、何日目か */
export interface Progress {
  chapterId: string;
  areaId: string;
  /** 区画の中の何戦目か（0から） */
  battle: number;
  /** 何日目か（1から。今は増えない。M2 で日常と潜入の枠を入れる時に進める） */
  day: number;
}

/** 勝った後の出来事 */
export type AdvanceEvent = 'nextBattle' | 'nextArea' | 'nextChapter' | 'storyClear';

export interface Place<B extends StoryBattle> {
  chapter: StoryChapter<B>;
  area: StoryArea<B>;
  battle: B;
  chapterIndex: number;
  areaIndex: number;
}

/** 最初の章の、最初の区画の、最初の戦闘 */
export function startProgress(story: Story): Progress {
  const chapter = story[0];
  if (!chapter || !chapter.areas[0]) throw new Error('empty story');
  return { chapterId: chapter.id, areaId: chapter.areas[0].id, battle: 0, day: 1 };
}

/** 進み具合が指す場所。物語にない場所なら null */
export function placeOf<B extends StoryBattle>(story: Story<B>, p: Progress): Place<B> | null {
  const chapterIndex = story.findIndex((c) => c.id === p.chapterId);
  if (chapterIndex < 0) return null;
  const chapter = story[chapterIndex];
  const areaIndex = chapter.areas.findIndex((a) => a.id === p.areaId);
  if (areaIndex < 0) return null;
  const area = chapter.areas[areaIndex];
  const battle = area.battles[p.battle];
  if (!battle) return null;
  return { chapter, area, battle, chapterIndex, areaIndex };
}

/** 物語のすべての戦闘を、最初から順に並べたもの */
export function allBattles<B extends StoryBattle>(story: Story<B>): B[] {
  return story.flatMap((c) => c.areas.flatMap((a) => a.battles));
}

/** 最初から数えて何戦目か（0から）。戦闘のシードや「1/5」の表示に使う */
export function battleNumber(story: Story, p: Progress): number {
  const place = placeOf(story, p);
  if (!place) throw new Error('unknown place');
  let n = 0;
  for (let c = 0; c < place.chapterIndex; c++) for (const a of story[c].areas) n += a.battles.length;
  for (let a = 0; a < place.areaIndex; a++) n += place.chapter.areas[a].battles.length;
  return n + p.battle;
}

/** 最初から数えて n 戦目（0から）の場所 */
export function progressAt(story: Story, n: number, day = 1): Progress {
  let rest = n;
  for (const c of story) {
    for (const a of c.areas) {
      if (rest < a.battles.length) return { chapterId: c.id, areaId: a.id, battle: rest, day };
      rest -= a.battles.length;
    }
  }
  throw new Error(`no battle #${n}`);
}

/** 戦闘の名前から場所を探す（見つからなければ null） */
export function findBattle<B extends StoryBattle>(story: Story<B>, battleId: string): B | null {
  return allBattles(story).find((b) => b.id === battleId) ?? null;
}

/**
 * 今の場所の戦闘に勝った後、次の場所へ進める。
 * 最後の戦闘に勝った時は storyClear で、場所はそのまま
 */
export function advance(story: Story, p: Progress): { progress: Progress; event: AdvanceEvent } {
  const place = placeOf(story, p);
  if (!place) throw new Error('unknown place');
  if (p.battle + 1 < place.area.battles.length) return { progress: { ...p, battle: p.battle + 1 }, event: 'nextBattle' };
  const nextArea = place.chapter.areas.slice(place.areaIndex + 1).find((a) => a.battles.length > 0);
  if (nextArea) return { progress: { ...p, areaId: nextArea.id, battle: 0 }, event: 'nextArea' };
  for (const c of story.slice(place.chapterIndex + 1)) {
    const area = c.areas.find((a) => a.battles.length > 0);
    if (area) return { progress: { ...p, chapterId: c.id, areaId: area.id, battle: 0 }, event: 'nextChapter' };
  }
  return { progress: p, event: 'storyClear' };
}

/**
 * セーブから読んだ進み具合を、今の物語に合わせて整える。
 * 知らない章・区画は最初の章・区画に、何戦目は区画の範囲に、何日目は1以上に収める
 */
export function normalizeProgress(story: Story, raw: Partial<Progress>): Progress {
  const start = startProgress(story);
  const chapter = story.find((c) => c.id === raw.chapterId) ?? story[0];
  const area = chapter.areas.find((a) => a.id === raw.areaId && a.battles.length > 0) ?? chapter.areas.find((a) => a.battles.length > 0);
  if (!area) return start;
  const battle = Number.isInteger(raw.battle) ? Math.min(Math.max(0, raw.battle!), area.battles.length - 1) : 0;
  const day = Number.isInteger(raw.day) && raw.day! >= 1 ? raw.day! : 1;
  return { chapterId: chapter.id, areaId: area.id, battle, day };
}
