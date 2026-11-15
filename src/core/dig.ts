import { nextRandom } from './rng';

// 砂の底を掘る（段階207 試作1・段階208 試作2。docs/milestones/M3_sand_bottom.md）。Phaser に依存しない。
// 横から見た地面（横 width マス、深さは層の合計）を、上下左右に1マスずつ掘り進む。砂時計の砂は時間ではなく手数で減る。
// 地面はシードから作る（同じシードなら同じ地面）。
// 段階208：層の境目の番人（倒さないと下の層へ行けない）、動く砂嵐（近づくと追ってくる）、鉱脈・砂時計の砂粒・崩れる砂を足した

/**
 * マスの種類。clay は2回掘る（1回目で砂になる）。rock は掘れない。chest は宝箱、guard は層の境目の番人。
 * ore は鉱脈（掘ると素材）、grain は砂時計の砂粒（掘ると砂が戻る）、loose は崩れる砂（下が空くと落ちる）
 */
export type DigTile = 'air' | 'sand' | 'clay' | 'rock' | 'chest' | 'guard' | 'ore' | 'grain' | 'loose';

export type DigRarity = 'common' | 'uncommon' | 'rare';

/** 地層（上から順に並べる） */
export interface DigLayerDef {
  id: string;
  name: string;
  /** この層の深さ（マス） */
  rows: number;
  /** 岩・固い土・鉱脈・砂粒・崩れる砂の割合（0〜1） */
  rock: number;
  clay: number;
  ore: number;
  grain: number;
  loose: number;
  /** 空洞の数 */
  caves: number;
  /** 空洞に宝箱・動く砂嵐を置く割合 */
  chestRate: number;
  nestRate: number;
  /** 宝箱から出る物（珍しさごと）と、出る割合（common・uncommon・rare の重み）。鉱脈は common と uncommon から */
  items: Record<DigRarity, string[]>;
  weights: Record<DigRarity, number>;
  /** 砂嵐で戦う戦闘（区画の戦闘の id） */
  battles: string[];
  /** この層の入口（上の境目）の番人の戦闘。書かなければ battles の先頭。いちばん上の層には番人はいない */
  guard?: string;
}

export interface DigWorldDef {
  width: number;
  layers: DigLayerDef[];
  /** 入った時の砂時計の砂 */
  sand: number;
  /** 手数ごとに減る砂：歩く・掘る・戦う。戻る時は、深さ1マスごとに back */
  cost: { walk: number; dig: number; battle: number; back: number };
  /** 砂粒で戻る砂 */
  grainSand: number;
  /** 砂嵐が追ってくる距離（縦横のマスの数の合計） */
  chase: number;
  /** かばんに入る数 */
  bagMax: number;
}

/** 動く砂嵐 */
export interface DigRoamer {
  id: number;
  x: number;
  y: number;
  battle: string;
  /** 追っている（近くにいる） */
  chasing: boolean;
}

export interface DigState {
  seed: number;
  width: number;
  height: number;
  /** マス（行ごと。y * width + x） */
  tiles: DigTile[];
  /** 宝箱の中身（マスの番号 → 物の id） */
  chests: Record<number, string[]>;
  /** 番人の戦闘（マスの番号 → 戦闘の id） */
  guards: Record<number, string>;
  roamers: DigRoamer[];
  x: number;
  y: number;
  sand: number;
  /** いちばん深く潜った深さ（マス） */
  deepest: number;
  bag: string[];
  /** 進んだ手数（砂嵐の動きを決める） */
  steps: number;
  /** diving 潜っている・home 帰った・late 砂が足りないまま帰った・lost 戦闘に負けて戻された */
  outcome: 'diving' | 'home' | 'late' | 'lost';
}

/** 1手の結果 */
export type DigEvent =
  | { type: 'move' }
  | { type: 'dig'; through: boolean }
  | { type: 'ore'; item: string | null; kept: boolean }
  | { type: 'grain'; sand: number }
  | { type: 'blocked'; reason: 'rock' | 'edge' | 'sand' }
  | { type: 'chest'; cell: number; items: string[] }
  | { type: 'guard'; cell: number; battle: string }
  | { type: 'roamer'; id: number; battle: string };

/** 入口（地上の真ん中） */
export function digEntrance(def: DigWorldDef): number {
  return Math.floor(def.width / 2);
}

/** 深さ y の層（地上は先頭の層） */
export function digLayerAt(def: DigWorldDef, y: number): DigLayerDef {
  let top = 1;
  for (const l of def.layers) {
    if (y < top + l.rows) return l;
    top += l.rows;
  }
  return def.layers[def.layers.length - 1];
}

/** 層の始まりの深さ（地上の次の行が1） */
export function digLayerTop(def: DigWorldDef, layerId: string): number {
  let top = 1;
  for (const l of def.layers) {
    if (l.id === layerId) return top;
    top += l.rows;
  }
  return top;
}

const isOpen = (t: DigTile) => t === 'air';

/** 崩れる砂を落とす：下が空いていれば、空きがなくなるまで落ちる（自分や砂嵐のいるマスには落ちない） */
function settle(tiles: DigTile[], width: number, height: number, blocked: Set<number>): DigTile[] {
  const out = [...tiles];
  for (let y = height - 2; y >= 1; y--) {
    for (let x = 0; x < width; x++) {
      let at = y * width + x;
      if (out[at] !== 'loose') continue;
      while (at + width < height * width && out[at + width] === 'air' && !blocked.has(at + width)) {
        out[at + width] = 'loose';
        out[at] = 'air';
        at += width;
      }
    }
  }
  return out;
}

const occupied = (s: Pick<DigState, 'x' | 'y' | 'width' | 'roamers'>) => new Set([s.y * s.width + s.x, ...s.roamers.map((r) => r.y * s.width + r.x)]);

/** 地面を作る。地上（y=0）は空。入口の真下は必ず砂（最初の1手が岩でふさがれないように） */
export function createDig(def: DigWorldDef, seed: number): DigState {
  let r = seed >>> 0;
  const rand = (): number => {
    const [v, n] = nextRandom(r);
    r = n;
    return v;
  };
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];
  const height = 1 + def.layers.reduce((n, l) => n + l.rows, 0);
  const w = def.width;
  const tiles: DigTile[] = [];
  for (let x = 0; x < w; x++) tiles.push('air');
  for (let y = 1; y < height; y++) {
    const layer = digLayerAt(def, y);
    for (let x = 0; x < w; x++) {
      let v = rand();
      const kinds: [DigTile, number][] = [
        ['rock', layer.rock],
        ['clay', layer.clay],
        ['ore', layer.ore],
        ['grain', layer.grain],
        ['loose', layer.loose],
      ];
      let tile: DigTile = 'sand';
      for (const [k, rate] of kinds) {
        if (v < rate) {
          tile = k;
          break;
        }
        v -= rate;
      }
      tiles.push(tile);
    }
  }
  const chests: Record<number, string[]> = {};
  const guards: Record<number, string> = {};
  const roamers: DigRoamer[] = [];
  def.layers.forEach((layer, li) => {
    const top = digLayerTop(def, layer.id);
    for (let c = 0; c < layer.caves; c++) {
      // 空洞：横3〜5・縦2〜3。層の中に収める（境目の行は避ける）
      const cw = 3 + Math.floor(rand() * 3);
      const ch = 2 + Math.floor(rand() * 2);
      const cx = Math.floor(rand() * (w - cw));
      const cy = top + 1 + Math.floor(rand() * Math.max(1, layer.rows - ch - 1));
      for (let y = cy; y < cy + ch && y < height; y++) for (let x = cx; x < cx + cw; x++) tiles[y * w + x] = 'air';
      const floor = Math.min(cy + ch - 1, height - 1);
      const chestCell = floor * w + cx + Math.floor(rand() * cw);
      if (rand() < layer.chestRate) {
        tiles[chestCell] = 'chest';
        chests[chestCell] = rollChest(layer, rand, pick);
      }
      const rx = cx + Math.floor(rand() * cw);
      if (floor * w + rx !== chestCell && layer.battles.length > 0 && rand() < layer.nestRate) {
        roamers.push({ id: roamers.length, x: rx, y: floor, battle: pick(layer.battles), chasing: false });
      }
    }
    // 層の境目（いちばん上の層は除く）：岩の帯で、番人のいる1マスだけが通り道
    if (li > 0) {
      const gx = 1 + Math.floor(rand() * (w - 2));
      for (let x = 0; x < w; x++) {
        const cell = top * w + x;
        delete chests[cell];
        tiles[cell] = x === gx ? 'guard' : 'rock';
      }
      guards[top * w + gx] = layer.guard ?? layer.battles[0];
      // 番人の上と下は、たどり着けるように砂にする
      for (const cell of [(top - 1) * w + gx, (top + 1) * w + gx]) if (tiles[cell] === 'rock') tiles[cell] = 'sand';
    }
  });
  const ex = digEntrance(def);
  if (height > 1 && tiles[w + ex] !== 'air') {
    delete chests[w + ex];
    tiles[w + ex] = 'sand';
  }
  // 空洞が重なって宝箱が消えた所は、中身の記録も消す
  for (const cell of Object.keys(chests).map(Number)) if (tiles[cell] !== 'chest') delete chests[cell];
  const alive = roamers.filter((m) => tiles[m.y * w + m.x] === 'air');
  const settled = settle(tiles, w, height, new Set([ex, ...alive.map((m) => m.y * w + m.x)]));
  return { seed: seed >>> 0, width: w, height, tiles: settled, chests, guards, roamers: alive, x: ex, y: 0, sand: def.sand, deepest: 0, bag: [], steps: 0, outcome: 'diving' };
}

/** 重みで珍しさを決める（その珍しさの物がなければ一つ下） */
function rollItem(items: Record<DigRarity, string[]>, weights: Record<DigRarity, number>, rand: () => number, pick: <T>(l: readonly T[]) => T): string | null {
  const order: DigRarity[] = ['rare', 'uncommon', 'common'];
  const total = order.reduce((s, k) => s + weights[k], 0);
  let v = rand() * total;
  let kind: DigRarity = 'common';
  for (const k of order) {
    if (v < weights[k]) {
      kind = k;
      break;
    }
    v -= weights[k];
  }
  const from = order.slice(order.indexOf(kind)).find((k) => items[k].length > 0);
  return from ? pick(items[from]) : null;
}

/** 宝箱の中身：1〜2個 */
function rollChest(layer: DigLayerDef, rand: () => number, pick: <T>(l: readonly T[]) => T): string[] {
  const n = rand() < 0.35 ? 2 : 1;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = rollItem(layer.items, layer.weights, rand, pick);
    if (id) out.push(id);
  }
  return out;
}

/** その状態とマスから決まる乱数（鉱脈の中身・砂嵐の動き。同じ手なら同じ結果） */
function stepRand(s: DigState, salt: number): () => number {
  let r = (s.seed ^ Math.imul(s.steps + 1, 2654435761) ^ Math.imul(salt + 7, 40503)) >>> 0;
  return () => {
    const [v, n] = nextRandom(r);
    r = n;
    return v;
  };
}

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
export type DigDir = keyof typeof DIRS;

/**
 * 1手進む：空なら歩く（walk）、砂・崩れる砂なら掘って進む（dig）、固い土は1回掘って砂にする（dig。進まない）。
 * 鉱脈は掘って進み、素材をかばんへ（いっぱいなら砂に戻る）。砂粒は掘って進み、砂時計の砂が戻る。岩・画面の外は進めない。
 * 宝箱・番人・砂嵐は進まずに知らせる。進んだ後は、崩れる砂が落ち、砂嵐が1マス動く（追いつかれたら知らせる）
 */
export function stepDig(def: DigWorldDef, s: DigState, dir: DigDir): { state: DigState; event: DigEvent } {
  if (s.outcome !== 'diving') return { state: s, event: { type: 'blocked', reason: 'edge' } };
  const [dx, dy] = DIRS[dir];
  const nx = s.x + dx;
  const ny = s.y + dy;
  if (nx < 0 || nx >= s.width || ny < 0 || ny >= s.height) return { state: s, event: { type: 'blocked', reason: 'edge' } };
  const cell = ny * s.width + nx;
  const tile = s.tiles[cell];
  const foe = s.roamers.find((m) => m.x === nx && m.y === ny);
  if (foe) return { state: s, event: { type: 'roamer', id: foe.id, battle: foe.battle } };
  if (tile === 'rock') return { state: s, event: { type: 'blocked', reason: 'rock' } };
  if (tile === 'chest') return { state: s, event: { type: 'chest', cell, items: [...(s.chests[cell] ?? [])] } };
  if (tile === 'guard') return { state: s, event: { type: 'guard', cell, battle: s.guards[cell] } };
  const cost = tile === 'air' ? def.cost.walk : def.cost.dig;
  if (s.sand < cost) return { state: s, event: { type: 'blocked', reason: 'sand' } };
  const tiles = [...s.tiles];
  if (tile === 'clay') {
    tiles[cell] = 'sand';
    return afterStep(def, { ...s, tiles, sand: s.sand - cost }, { type: 'dig', through: false });
  }
  tiles[cell] = 'air';
  let next: DigState = { ...s, tiles, sand: s.sand - cost, x: nx, y: ny, deepest: Math.max(s.deepest, ny) };
  let event: DigEvent = tile === 'air' ? { type: 'move' } : { type: 'dig', through: true };
  if (tile === 'grain') {
    next = { ...next, sand: next.sand + def.grainSand };
    event = { type: 'grain', sand: def.grainSand };
  }
  if (tile === 'ore') {
    const layer = digLayerAt(def, ny);
    const rand = stepRand(s, cell);
    const item = rollItem(layer.items, { common: 3, uncommon: 1, rare: 0 }, rand, (l) => l[Math.floor(rand() * l.length)]);
    const kept = !!item && next.bag.length < def.bagMax;
    if (kept && item) next = { ...next, bag: [...next.bag, item] };
    event = { type: 'ore', item, kept };
  }
  return afterStep(def, next, event);
}

/** 進んだ後：崩れる砂が落ち、砂嵐が動く。追いつかれたら、その砂嵐との戦闘を知らせる */
function afterStep(def: DigWorldDef, s: DigState, event: DigEvent): { state: DigState; event: DigEvent } {
  const steps = s.steps + 1;
  let next: DigState = { ...s, steps, tiles: settle(s.tiles, s.width, s.height, occupied(s)) };
  next = moveRoamers(def, next);
  const caught = next.roamers.find((m) => m.x === next.x && m.y === next.y);
  if (caught) return { state: next, event: { type: 'roamer', id: caught.id, battle: caught.battle } };
  return { state: next, event };
}

/** 砂嵐が1マス動く：近くにいれば追う（空いたマスだけ通る。掘った道も通る）、遠ければうろうろする */
function moveRoamers(def: DigWorldDef, s: DigState): DigState {
  const taken = new Set(s.roamers.map((m) => m.y * s.width + m.x));
  const roamers = s.roamers.map((m) => {
    const rand = stepRand(s, 1000 + m.id);
    const dist = Math.abs(m.x - s.x) + Math.abs(m.y - s.y);
    const chasing = dist <= def.chase;
    const canGo = (x: number, y: number) => {
      if (x < 0 || x >= s.width || y < 1 || y >= s.height) return false;
      if (x === s.x && y === s.y) return true;
      const c = y * s.width + x;
      return isOpen(s.tiles[c]) && !taken.has(c);
    };
    let moves: [number, number][];
    if (chasing) {
      const sx = Math.sign(s.x - m.x);
      const sy = Math.sign(s.y - m.y);
      const first: [number, number] = Math.abs(s.x - m.x) >= Math.abs(s.y - m.y) ? [sx, 0] : [0, sy];
      const second: [number, number] = first[0] !== 0 ? [0, sy] : [sx, 0];
      moves = [first, second].filter(([a, b]) => a !== 0 || b !== 0);
    } else {
      const all: [number, number][] = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      // 半分は止まる。動く時は向きを1つ選ぶ
      moves = rand() < 0.5 ? [] : [all[Math.floor(rand() * 4)]];
    }
    for (const [ax, ay] of moves) {
      if (canGo(m.x + ax, m.y + ay)) {
        taken.delete(m.y * s.width + m.x);
        const moved = { ...m, x: m.x + ax, y: m.y + ay, chasing };
        taken.add(moved.y * s.width + moved.x);
        return moved;
      }
    }
    return { ...m, chasing };
  });
  return { ...s, roamers };
}

/** 宝箱を開ける：入る分だけかばんに入れ、入らなかった物は宝箱に残す（空になったら空洞に戻る） */
export function takeChest(def: DigWorldDef, s: DigState, cell: number): { state: DigState; left: string[] } {
  const items = s.chests[cell] ?? [];
  const room = Math.max(0, def.bagMax - s.bag.length);
  const taken = items.slice(0, room);
  const left = items.slice(room);
  const tiles = [...s.tiles];
  const chests = { ...s.chests };
  if (left.length === 0) {
    tiles[cell] = 'air';
    delete chests[cell];
  } else chests[cell] = left;
  return { state: { ...s, tiles, chests, bag: [...s.bag, ...taken] }, left };
}

/** かばんの1つを捨てて、宝箱の物と入れ替える（捨てた物は宝箱に残る） */
export function swapChest(s: DigState, cell: number, bagIndex: number, item: string): DigState {
  const items = s.chests[cell] ?? [];
  const at = items.indexOf(item);
  if (at < 0 || bagIndex < 0 || bagIndex >= s.bag.length) return s;
  const dropped = s.bag[bagIndex];
  const bag = [...s.bag];
  bag[bagIndex] = item;
  const rest = [...items];
  rest[at] = dropped;
  return { ...s, bag, chests: { ...s.chests, [cell]: rest } };
}

/** 番人に勝った：通り道が開き、戦った分の砂が減る */
export function clearGuard(def: DigWorldDef, s: DigState, cell: number): DigState {
  const tiles = [...s.tiles];
  tiles[cell] = 'air';
  const guards = { ...s.guards };
  delete guards[cell];
  return { ...s, tiles, guards, sand: Math.max(0, s.sand - def.cost.battle) };
}

/** 動く砂嵐に勝った：その砂嵐は消え、戦った分の砂が減る */
export function clearRoamer(def: DigWorldDef, s: DigState, id: number): DigState {
  return { ...s, roamers: s.roamers.filter((m) => m.id !== id), sand: Math.max(0, s.sand - def.cost.battle) };
}

/** かばんの半分を失う（失う物はシードで決める。多い方を残す） */
function halveBag(s: DigState): string[] {
  const keep = Math.ceil(s.bag.length / 2);
  let r = (s.seed ^ (s.sand * 2654435761) ^ s.y) >>> 0;
  const order = s.bag.map((item, i) => {
    const [v, n] = nextRandom(r);
    r = n;
    return { item, i, v };
  });
  const kept = new Set(order.sort((a, b) => a.v - b.v).slice(0, keep).map((o) => o.i));
  return s.bag.filter((_, i) => kept.has(i));
}

/** 帰るのに要る砂（今の深さ × back） */
export function digBackCost(def: DigWorldDef, s: DigState): number {
  return s.y * def.cost.back;
}

/** 上へ戻る：砂が足りれば全部持ち帰る（home）。足りなければ、かばんの半分を失う（late） */
export function goHome(def: DigWorldDef, s: DigState): DigState {
  const cost = digBackCost(def, s);
  if (s.sand >= cost) return { ...s, sand: s.sand - cost, x: digEntrance(def), y: 0, outcome: 'home' };
  return { ...s, sand: 0, bag: halveBag(s), x: digEntrance(def), y: 0, outcome: 'late' };
}

/** 戦闘に負けた：地上へ戻され、かばんの半分を失う */
export function loseDig(def: DigWorldDef, s: DigState): DigState {
  return { ...s, bag: halveBag(s), x: digEntrance(def), y: 0, outcome: 'lost' };
}
