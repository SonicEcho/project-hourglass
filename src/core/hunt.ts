// 周回・狩り（段階43）：返し終えた区画に入り直して、砂嵐と戦って素材を集める。Phaser に依存しない。
// 区画の1回目の中身から、狩りの区画（入るたびに新しい中身）を作る。歩き方・戦闘・チェックポイントは探索（explore.ts）と同じ
import type { AreaChest, AreaDef, AreaEnemy } from './explore';
import type { GridCell } from './grid';
import { checkArea, isCheckpoint, startRoom } from './explore';
import { isWalkable, parseGrid } from './grid';
import { nextRandom } from './rng';
import type { StoryAuto } from './settings';

/** 採取の場所：タップすると素材が手に入る（入るたびに1回ずつ。宝箱の代わり） */
export interface AreaGather {
  id: string;
  room?: string;
  cell: GridCell;
  items: string[];
}

/** 区画の狩りの中身（段階47で形だけ決め、段階43で作った） */
export interface AreaHunt {
  /** 採取の場所 */
  gathers: AreaGather[];
  /** 部屋ごとの敵の表（区画の戦闘の id。同じ id を重ねると出やすい）。書いた部屋の砂嵐は、入るたびにこの表から戦闘を選ぶ */
  tables?: Record<string, string[]>;
}

/** 狩りの区画を持つ区画 */
export type HuntableArea = AreaDef & { hunt: AreaHunt };

/** 狩りに入れる区画：返した記録にあり、狩りの中身を書いた区画（区画の並びの順） */
export function huntableAreas(areas: Readonly<Record<string, AreaDef>>, returned: readonly string[]): HuntableArea[] {
  return Object.values(areas).filter((a): a is HuntableArea => a.hunt !== undefined && returned.includes(a.id));
}

/**
 * 狩りの区画を作る（入るたびに salt を変える）。1回目の区画から：
 * 番人・話せる人・途中の会話・宝箱を除き、閉じた出入口を開け、砂嵐の戦闘を部屋ごとの敵の表から選び、採取の場所を宝箱の形で置く。
 * ぬしはそのまま（狩りではいつでも挑める。呼ぶ側が bossReady を見ない）
 */
export function huntArea(area: HuntableArea, salt: number): AreaDef {
  let rng = salt >>> 0;
  const pick = (list: readonly string[]): string => {
    const [v, next] = nextRandom(rng);
    rng = next;
    return list[Math.floor(v * list.length)];
  };
  // 逃げる敵は、レアの素材の戦闘のまま（表から選び直さない。段階59）
  const enemies: AreaEnemy[] = area.enemies
    .filter((e) => e.move !== 'guard')
    .map((e) => {
      if (e.move === 'flee') return e;
      const table = area.hunt.tables?.[e.room ?? startRoom(area)];
      return table && table.length > 0 ? { ...e, battle: pick(table) } : e;
    });
  const chests: AreaChest[] = area.hunt.gathers.map((g) => ({ id: g.id, ...(g.room ? { room: g.room } : {}), cell: g.cell, items: g.items }));
  // 晩に分けた区画（段階63）も、記憶をたどる時は壁のない1つの区画（どの晩の敵も出る）
  const { hunt: _, nights: _n, walls: _w, ...rest } = area;
  return {
    ...rest,
    links: (area.links ?? []).map(({ opensWhen: _, ...link }) => link),
    enemies,
    chests,
    talkers: [],
    triggers: [],
  };
}

/** 狩りの中身の書き間違い（採取の場所が通れない・チェックポイントの上、知らない部屋の表、空の表、知らない戦闘）を、全部まとめて返す（テストで使う） */
export function checkHunt(area: HuntableArea, battles: Readonly<Record<string, unknown>>): string[] {
  const errors: string[] = [];
  const roomIds = area.rooms.map((r) => r.id);
  const ids = area.hunt.gathers.map((g) => g.id);
  if (new Set(ids).size !== ids.length) errors.push(`${area.id}：採取の場所の id が重なっている`);
  for (const g of area.hunt.gathers) {
    const room = g.room ?? startRoom(area);
    if (!roomIds.includes(room)) {
      errors.push(`${area.id}：採取の場所 ${g.id} の部屋 ${room} がない`);
      continue;
    }
    const layout = area.rooms.find((r) => r.id === room)!.layout;
    if (!isWalkable(parseGrid(layout), g.cell)) errors.push(`${area.id}：採取の場所 ${g.id} が通れないマス（${g.cell}）にある`);
    if (isCheckpoint(area, g.cell, room) || layout[g.cell[1]]?.[g.cell[0]] === 'S') errors.push(`${area.id}：採取の場所 ${g.id} がチェックポイントか出発点の上にある`);
    if (g.items.length === 0) errors.push(`${area.id}：採取の場所 ${g.id} に何もない`);
  }
  for (const [room, table] of Object.entries(area.hunt.tables ?? {})) {
    if (!roomIds.includes(room)) errors.push(`${area.id}：敵の表の部屋 ${room} がない`);
    if (table.length === 0) errors.push(`${area.id}：部屋 ${room} の敵の表が空`);
    for (const b of table) if (!(b in battles)) errors.push(`${area.id}：部屋 ${room} の敵の表に、ない戦闘 ${b}`);
  }
  // 作った狩りの区画も、区画の決まりを満たす（採取の場所の隣に立てる、など）
  errors.push(...checkArea(huntArea(area, 0)).map((e) => `記憶をたどる：${e}`));
  return errors;
}

/**
 * 狩りの報酬（星の砂と武器の経験値）の割合（段階49。docs/design/economy.md の 2.）。
 * 今の章の区画は全部、前の章の区画は oldRate（格下の砂嵐からは伸びにくい）。章が分からなければ全部。素材は割合をかけない
 */
export function huntRewardRate(areaChapter: number | undefined, nowChapter: number | undefined, oldRate: number): number {
  if (areaChapter === undefined || nowChapter === undefined) return 1;
  return areaChapter < nowChapter ? oldRate : 1;
}

/**
 * 戦闘でオートを出してよいか（段階64。開発者と決めた。段階105で物語の探索にも広げた）。
 * 物語の探索では、一度勝った敵の組み合わせ（wonBefore）から出す（初めての敵は自分で読んで戦う）。設定の storyAuto が always なら、初めての敵でも出す。
 * 記憶をたどる時（くり返しの素材集め）と、試作の戦闘では、いつでも出す。ボス戦は、どれでも出さない。
 * debugStory はデバッグの時の切り替え（物語の探索でも出す）
 */
export function autoAllowed(o: { boss: boolean; kind: 'trial' | 'story' | 'hunt'; debugStory?: boolean; storyAuto?: StoryAuto; wonBefore?: boolean }): boolean {
  if (o.boss) return false;
  if (o.kind !== 'story') return true;
  return o.debugStory === true || o.storyAuto === 'always' || o.wonBefore === true;
}

/** 敵の組み合わせの印（段階105）。並び順によらず、同じ敵の顔ぶれなら同じ（晩ごとの強さの倍率では id は変わらない） */
export function formationKey(enemyIds: readonly string[]): string {
  return [...enemyIds].sort().join('+');
}
