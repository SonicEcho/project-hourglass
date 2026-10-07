// マス目の地図と、道を探す処理（段階16。探索の画面で使う）。Phaser に依存しない

export type GridCell = [col: number, row: number];

export interface GridMap {
  cols: number;
  rows: number;
  /** 通れないマス（row * cols + col） */
  blocked: boolean[];
}

/** 文字の絵から地図を作る。blockChars に含まれる文字のマスは通れない。行の長さが足りない所も通れない */
export function parseGrid(layout: string[], blockChars = '#'): GridMap {
  const rows = layout.length;
  const cols = Math.max(0, ...layout.map((l) => l.length));
  const blocked: boolean[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = layout[r][c];
      blocked.push(ch === undefined || blockChars.includes(ch));
    }
  }
  return { cols, rows, blocked };
}

export function inGrid(map: GridMap, [c, r]: GridCell): boolean {
  return c >= 0 && r >= 0 && c < map.cols && r < map.rows;
}

export function isWalkable(map: GridMap, cell: GridCell): boolean {
  return inGrid(map, cell) && !map.blocked[cell[1] * map.cols + cell[0]];
}

const DIRS: GridCell[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/**
 * from から to までの最短の道（上下左右に1マスずつ）。from は含まず、to を含む。
 * 同じマスなら空の配列。たどり着けない・どちらかが通れない時は null。
 * 長さが同じ道が複数あれば、上・右・下・左の順に先に見つかった方（同じ地図なら毎回同じ道）
 */
export function findPath(map: GridMap, from: GridCell, to: GridCell): GridCell[] | null {
  if (!isWalkable(map, from) || !isWalkable(map, to)) return null;
  const key = ([c, r]: GridCell) => r * map.cols + c;
  if (key(from) === key(to)) return [];
  // 重みが全部同じなので、幅優先で最短になる
  const prev = new Map<number, number>([[key(from), -1]]);
  const queue: GridCell[] = [from];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    for (const [dc, dr] of DIRS) {
      const next: GridCell = [cur[0] + dc, cur[1] + dr];
      if (!isWalkable(map, next) || prev.has(key(next))) continue;
      prev.set(key(next), key(cur));
      if (key(next) === key(to)) {
        const path: GridCell[] = [];
        for (let k = key(to); k !== key(from); k = prev.get(k)!) path.push([k % map.cols, Math.floor(k / map.cols)]);
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

/**
 * タップした所が壁などで通れない時に、代わりに向かうマス。
 * 通れるならそのまま。通れなければ、近い順（マス目の距離）に通れるマスを探す。maxDistance より遠ければ null
 */
export function nearestWalkable(map: GridMap, cell: GridCell, maxDistance = 2): GridCell | null {
  if (isWalkable(map, cell)) return cell;
  for (let d = 1; d <= maxDistance; d++) {
    for (let dr = -d; dr <= d; dr++) {
      const rest = d - Math.abs(dr);
      for (const dc of rest === 0 ? [0] : [-rest, rest]) {
        const c: GridCell = [cell[0] + dc, cell[1] + dr];
        if (isWalkable(map, c)) return c;
      }
    }
  }
  return null;
}
