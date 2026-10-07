import type { CharacterDef, PassiveEffect, Stats } from './types';

// ムーブメント（段階8）。Phaser に依存しない。
// 公開している関数は、受け取った状態を書き換えず、新しい状態を返す。
//
// 座標は [列, 行]（左上が [0, 0]）。ギアの形も同じ向きで書き、回転は時計回りに90度ずつ。

export type Cell = [number, number];

export type PartColor = 'red' | 'blue' | 'green' | 'yellow';

/** 回転（時計回りに 90度 × rotation） */
export type Rotation = 0 | 1 | 2 | 3;

export type NaviPartDef =
  /** 能力値ギア：盤のどこに置いても効く */
  | { id: string; name: string; color: PartColor; cells: Cell[]; kind: 'stat'; stats: Partial<Stats> }
  /** 効果ギア：ブリッジに1マス以上乗っている時だけ効く */
  | { id: string; name: string; color: PartColor; cells: Cell[]; kind: 'effect'; effect: PassiveEffect };

export interface NaviBoardDef {
  cols: number;
  rows: number;
  /** ギアを置けるマス */
  cells: Cell[];
  /** ブリッジの行 */
  commandRow: number;
  /** 狂い1つにつき付く特性（キャラごとに差し替えられるようにしておく） */
  bugEffect: PassiveEffect;
}

export interface Placement {
  charId: string;
  col: number;
  row: number;
  rotation: Rotation;
}

/** 持っているギア1つ。placement が null なら、どの盤にもはめていない */
export interface OwnedPart {
  uid: number;
  partId: string;
  placement: Placement | null;
}

export interface NaviState {
  parts: OwnedPart[];
  nextUid: number;
}

export interface NaviData {
  parts: Record<string, NaviPartDef>;
  boards: Record<string, NaviBoardDef>;
}

/** 文字の絵（'#' が置けるマス）から盤のマスを作る */
export function parseBoardCells(layout: string[]): Cell[] {
  const cells: Cell[] = [];
  layout.forEach((line, row) => [...line].forEach((ch, col) => ch === '#' && cells.push([col, row])));
  return cells;
}

export function createNavi(partIds: string[]): NaviState {
  return addParts({ parts: [], nextUid: 0 }, partIds);
}

/** ギアを手に入れる（どの盤にもはめていない状態で加わる） */
export function addParts(navi: NaviState, partIds: string[]): NaviState {
  const added = partIds.map((partId, i) => ({ uid: navi.nextUid + i, partId, placement: null }));
  return { parts: [...navi.parts, ...added], nextUid: navi.nextUid + partIds.length };
}

/** 形を回転し、左上が [0, 0] になるようにそろえる */
export function rotateCells(cells: Cell[], rotation: Rotation): Cell[] {
  let out = cells.map(([c, r]) => [c, r] as Cell);
  for (let i = 0; i < rotation; i++) out = out.map(([c, r]) => [-r, c] as Cell);
  const minC = Math.min(...out.map(([c]) => c));
  const minR = Math.min(...out.map(([, r]) => r));
  return out.map(([c, r]) => [c - minC + 0, r - minR + 0] as Cell);
}

/** 盤の上で、そのギアが占めるマス */
export function placedCells(def: NaviPartDef, p: Pick<Placement, 'col' | 'row' | 'rotation'>): Cell[] {
  return rotateCells(def.cells, p.rotation).map(([c, r]) => [c + p.col, r + p.row] as Cell);
}

const key = ([c, r]: Cell) => `${c},${r}`;

/** そのキャラの盤にはまっているギア */
export function boardParts(navi: NaviState, charId: string): OwnedPart[] {
  return navi.parts.filter((p) => p.placement?.charId === charId);
}

/** ギアをそこに置けない理由。置けるなら null（同じギアの今の位置は空いているものとして扱う） */
export function getPlaceError(data: NaviData, navi: NaviState, uid: number, placement: Placement): string | null {
  const owned = navi.parts.find((p) => p.uid === uid);
  if (!owned) return 'unknown part';
  const def = data.parts[owned.partId];
  const board = data.boards[placement.charId];
  if (!def || !board) return 'unknown part or board';
  const boardCells = new Set(board.cells.map(key));
  const used = new Set(
    boardParts(navi, placement.charId)
      .filter((p) => p.uid !== uid)
      .flatMap((p) => placedCells(data.parts[p.partId], p.placement!).map(key)),
  );
  for (const cell of placedCells(def, placement)) {
    if (!boardCells.has(key(cell))) return 'out of the board';
    if (used.has(key(cell))) return 'overlaps another part';
  }
  return null;
}

/** ギアを盤にはめる（他の盤や別の位置にはまっていたら、そこから移す） */
export function placePart(data: NaviData, navi: NaviState, uid: number, placement: Placement): NaviState {
  const err = getPlaceError(data, navi, uid, placement);
  if (err) throw new Error(err);
  return { ...navi, parts: navi.parts.map((p) => (p.uid === uid ? { ...p, placement: { ...placement } } : p)) };
}

/** ギアを盤から外す */
export function removePart(navi: NaviState, uid: number): NaviState {
  return { ...navi, parts: navi.parts.map((p) => (p.uid === uid ? { ...p, placement: null } : p)) };
}

/** はまっているギアが効いているか（能力値ギアはいつも。効果ギアはブリッジに乗っている時だけ） */
export function isPartActive(data: NaviData, part: OwnedPart): boolean {
  if (!part.placement) return false;
  const def = data.parts[part.partId];
  if (def.kind === 'stat') return true;
  const board = data.boards[part.placement.charId];
  return placedCells(def, part.placement).some(([, r]) => r === board.commandRow);
}

/** 狂い：同じ色の別々のギアが辺で接している組。uid の組で返す */
export function findBugs(data: NaviData, navi: NaviState, charId: string): [number, number][] {
  const parts = boardParts(navi, charId);
  const bugs: [number, number][] = [];
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i];
      const b = parts[j];
      const da = data.parts[a.partId];
      const db = data.parts[b.partId];
      if (da.color !== db.color) continue;
      const bCells = new Set(placedCells(db, b.placement!).map(key));
      const touching = placedCells(da, a.placement!).some(([c, r]) =>
        [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].some((n) => bCells.has(key(n as Cell))),
      );
      if (touching) bugs.push([a.uid, b.uid]);
    }
  }
  return bugs;
}

/** そのキャラの盤で効いている特性（効いている効果ギアと、狂いの数だけの狂いの効果） */
export function boardPassives(data: NaviData, navi: NaviState, charId: string): PassiveEffect[] {
  const out: PassiveEffect[] = [];
  for (const p of boardParts(navi, charId)) {
    const def = data.parts[p.partId];
    if (def.kind === 'effect' && isPartActive(data, p)) out.push(def.effect);
  }
  const board = data.boards[charId];
  if (board) for (let i = 0; i < findBugs(data, navi, charId).length; i++) out.push(board.bugEffect);
  return out;
}

/** そのキャラの盤による能力値の上がり幅 */
export function boardStats(data: NaviData, navi: NaviState, charId: string): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const p of boardParts(navi, charId)) {
    const def = data.parts[p.partId];
    if (def.kind !== 'stat') continue;
    for (const [k, v] of Object.entries(def.stats) as [keyof Stats, number][]) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

/** ムーブメントを反映したキャラ（能力値を足し、特性を加える） */
export function applyNavi(data: NaviData, navi: NaviState, chars: CharacterDef[]): CharacterDef[] {
  return chars.map((c) => {
    const stats = { ...c.stats };
    for (const [k, v] of Object.entries(boardStats(data, navi, c.id)) as [keyof Stats, number][]) stats[k] += v;
    return { ...c, stats, passives: [...(c.passives ?? []), ...boardPassives(data, navi, c.id)] };
  });
}

/** 勝利の報酬：候補から picks 個を選んで受け取る（chosen は候補の番号。重ならないこと） */
export function claimRewardParts(navi: NaviState, candidates: string[], chosen: number[], picks: number): NaviState {
  const unique = new Set(chosen);
  if (unique.size !== chosen.length) throw new Error('the same candidate was chosen twice');
  if (chosen.length !== Math.min(picks, candidates.length)) throw new Error(`choose ${picks} parts`);
  if (chosen.some((i) => i < 0 || i >= candidates.length)) throw new Error('unknown candidate');
  return addParts(navi, chosen.map((i) => candidates[i]));
}

/** 盤を拡張する：ブリッジの行の右端に count マス足す（武器の進化で増える） */
export function extendBoard(board: NaviBoardDef, count: number): NaviBoardDef {
  if (count <= 0) return board;
  const rowCells = board.cells.filter(([, r]) => r === board.commandRow).map(([c]) => c);
  const start = Math.max(-1, ...rowCells) + 1;
  const added: Cell[] = Array.from({ length: count }, (_, i) => [start + i, board.commandRow]);
  return { ...board, cols: Math.max(board.cols, start + count), cells: [...board.cells, ...added] };
}

/** そのキャラの盤にはまっているギアの、色ごとのマス数 */
export function boardColorCells(data: NaviData, navi: NaviState, charId: string): Record<PartColor, number> {
  const out: Record<PartColor, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const p of boardParts(navi, charId)) {
    const def = data.parts[p.partId];
    out[def.color] += def.cells.length;
  }
  return out;
}
