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

// ---- 斜めにも歩く道（段階269。docs/milestones/M3_explore_feel.md の 6.。仲間が歩く道だけ。砂嵐の見回りは上下左右のまま） ----

const DIRS8: GridCell[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

/** その向きへ1歩進めるか。斜めは、角を削らない（横と縦の両方のマスが通れる時だけ） */
export function canStep(map: GridMap, from: GridCell, dir: GridCell): boolean {
  const to: GridCell = [from[0] + dir[0], from[1] + dir[1]];
  if (!isWalkable(map, to)) return false;
  if (dir[0] !== 0 && dir[1] !== 0) return isWalkable(map, [from[0] + dir[0], from[1]]) && isWalkable(map, [from[0], from[1] + dir[1]]);
  return true;
}

/**
 * 斜めにも歩く最短の道（段階269）。上下左右は1、斜めは1.4の重さ。角は削らない。from は含まず、to を含む。
 * 同じマスなら空の配列。たどり着けない・どちらかが通れない時は null。同じ重さの道が複数あれば、毎回同じ道（DIRS8 の順）
 */
export function findPathDiag(map: GridMap, from: GridCell, to: GridCell): GridCell[] | null {
  if (!isWalkable(map, from) || !isWalkable(map, to)) return null;
  const key = ([c, r]: GridCell) => r * map.cols + c;
  if (key(from) === key(to)) return [];
  const dist = new Map<number, number>([[key(from), 0]]);
  const prev = new Map<number, number>();
  const done = new Set<number>();
  const open: GridCell[] = [from];
  while (open.length) {
    // 小さな地図なので、いちばん近いマスを順に探す
    let bi = 0;
    for (let i = 1; i < open.length; i++) if ((dist.get(key(open[i])) ?? Infinity) < (dist.get(key(open[bi])) ?? Infinity)) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur);
    if (done.has(ck)) continue;
    done.add(ck);
    if (ck === key(to)) break;
    for (const d of DIRS8) {
      if (!canStep(map, cur, d)) continue;
      const next: GridCell = [cur[0] + d[0], cur[1] + d[1]];
      const nk = key(next);
      const nd = (dist.get(ck) ?? 0) + (d[0] !== 0 && d[1] !== 0 ? 1.4 : 1);
      if (nd < (dist.get(nk) ?? Infinity) - 1e-9) {
        dist.set(nk, nd);
        prev.set(nk, ck);
        open.push(next);
      }
    }
  }
  if (!prev.has(key(to))) return null;
  const path: GridCell[] = [];
  for (let k = key(to); k !== key(from); k = prev.get(k)!) path.push([k % map.cols, Math.floor(k / map.cols)]);
  return path.reverse();
}

/**
 * 押したまま引っ張って歩く（段階269）：dir の向きへ1歩。進めなければ、近い向き（斜めなら縦か横、縦横なら斜めの両どなり）を試す。
 * 壁に沿って、すべるように歩ける。どこへも進めなければ null
 */
export function dragStep(map: GridMap, from: GridCell, dir: GridCell): GridCell | null {
  const tries: GridCell[] = [dir];
  if (dir[0] !== 0 && dir[1] !== 0) tries.push([dir[0], 0], [0, dir[1]]);
  else if (dir[0] !== 0) tries.push([dir[0], -1], [dir[0], 1]);
  else tries.push([-1, dir[1]], [1, dir[1]]);
  for (const d of tries) if (canStep(map, from, d)) return [from[0] + d[0], from[1] + d[1]];
  return null;
}

/** 引っ張った向き（画面の dx・dy）を、8方向の1マスの向きに */
export function dirOfDrag(dx: number, dy: number): GridCell {
  const a = Math.atan2(dy, dx);
  const k = Math.round(a / (Math.PI / 4));
  const dirs: GridCell[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  return dirs[((k % 8) + 8) % 8];
}
