import { nextRandom } from './rng';

// 砂の底を掘る（段階207。試作1。docs/milestones/M3_sand_bottom.md）。Phaser に依存しない。
// 横から見た地面（横 width マス、深さは層の合計）を、上下左右に1マスずつ掘り進む。砂時計の砂は時間ではなく手数で減る。
// 地面はシードから作る（同じシードなら同じ地面）

/** マスの種類。clay は2回掘る（1回目で砂になる）。rock は掘れない。chest は宝箱、nest は砂嵐の巣 */
export type DigTile = 'air' | 'sand' | 'clay' | 'rock' | 'chest' | 'nest';

export type DigRarity = 'common' | 'uncommon' | 'rare';

/** 地層（上から順に並べる） */
export interface DigLayerDef {
  id: string;
  name: string;
  /** この層の深さ（マス） */
  rows: number;
  /** 岩・固い土の割合（0〜1） */
  rock: number;
  clay: number;
  /** 空洞の数 */
  caves: number;
  /** 空洞に宝箱・砂嵐の巣を置く割合 */
  chestRate: number;
  nestRate: number;
  /** 宝箱から出る物（珍しさごと）と、出る割合（common・uncommon・rare の重み） */
  items: Record<DigRarity, string[]>;
  weights: Record<DigRarity, number>;
  /** 砂嵐の巣で戦う戦闘（区画の戦闘の id） */
  battles: string[];
}

export interface DigWorldDef {
  width: number;
  layers: DigLayerDef[];
  /** 入った時の砂時計の砂 */
  sand: number;
  /** 手数ごとに減る砂：歩く・掘る・戦う。戻る時は、深さ1マスごとに back */
  cost: { walk: number; dig: number; battle: number; back: number };
  /** かばんに入る数 */
  bagMax: number;
}

export interface DigState {
  seed: number;
  width: number;
  height: number;
  /** マス（行ごと。y * width + x） */
  tiles: DigTile[];
  /** 宝箱の中身（マスの番号 → 物の id） */
  chests: Record<number, string[]>;
  /** 砂嵐の巣の戦闘（マスの番号 → 戦闘の id） */
  nests: Record<number, string>;
  x: number;
  y: number;
  sand: number;
  /** いちばん深く潜った深さ（マス） */
  deepest: number;
  bag: string[];
  /** diving 潜っている・home 帰った・late 砂が足りないまま帰った・lost 戦闘に負けて戻された */
  outcome: 'diving' | 'home' | 'late' | 'lost';
}

/** 1手の結果 */
export type DigEvent =
  | { type: 'move' }
  | { type: 'dig'; through: boolean }
  | { type: 'blocked'; reason: 'rock' | 'edge' | 'sand' }
  | { type: 'chest'; cell: number; items: string[] }
  | { type: 'nest'; cell: number; battle: string };

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
      const v = rand();
      tiles.push(v < layer.rock ? 'rock' : v < layer.rock + layer.clay ? 'clay' : 'sand');
    }
  }
  const chests: Record<number, string[]> = {};
  const nests: Record<number, string> = {};
  for (const layer of def.layers) {
    const top = digLayerTop(def, layer.id);
    for (let c = 0; c < layer.caves; c++) {
      // 空洞：横3〜5・縦2〜3。層の中に収める
      const cw = 3 + Math.floor(rand() * 3);
      const ch = 2 + Math.floor(rand() * 2);
      const cx = Math.floor(rand() * (w - cw));
      const cy = top + Math.floor(rand() * Math.max(1, layer.rows - ch));
      for (let y = cy; y < cy + ch && y < height; y++) for (let x = cx; x < cx + cw; x++) tiles[y * w + x] = 'air';
      // 床（空洞の一番下の行）に、宝箱か砂嵐の巣
      const floor = Math.min(cy + ch - 1, height - 1);
      const chestCell = floor * w + cx + Math.floor(rand() * cw);
      if (rand() < layer.chestRate) {
        tiles[chestCell] = 'chest';
        chests[chestCell] = rollChest(layer, rand, pick);
      }
      const nestCell = floor * w + cx + Math.floor(rand() * cw);
      if (nestCell !== chestCell && layer.battles.length > 0 && rand() < layer.nestRate) {
        tiles[nestCell] = 'nest';
        nests[nestCell] = pick(layer.battles);
      }
    }
  }
  const ex = digEntrance(def);
  if (height > 1 && tiles[w + ex] !== 'air') {
    delete chests[w + ex];
    delete nests[w + ex];
    tiles[w + ex] = 'sand';
  }
  return { seed: seed >>> 0, width: w, height, tiles, chests, nests, x: ex, y: 0, sand: def.sand, deepest: 0, bag: [], outcome: 'diving' };
}

/** 宝箱の中身：1〜2個。重みで珍しさを決め、その珍しさの物から1つ（なければ一つ下の珍しさ） */
function rollChest(layer: DigLayerDef, rand: () => number, pick: <T>(l: readonly T[]) => T): string[] {
  const n = rand() < 0.35 ? 2 : 1;
  const out: string[] = [];
  const order: DigRarity[] = ['rare', 'uncommon', 'common'];
  const total = order.reduce((s, k) => s + layer.weights[k], 0);
  for (let i = 0; i < n; i++) {
    let v = rand() * total;
    let kind: DigRarity = 'common';
    for (const k of order) {
      if (v < layer.weights[k]) {
        kind = k;
        break;
      }
      v -= layer.weights[k];
    }
    const from = order.slice(order.indexOf(kind)).find((k) => layer.items[k].length > 0);
    if (from) out.push(pick(layer.items[from]));
  }
  return out;
}

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
export type DigDir = keyof typeof DIRS;

/**
 * 1手進む：空なら歩く（walk）、砂なら掘って進む（dig）、固い土は1回掘って砂にする（dig。進まない）。岩・画面の外は進めない。
 * 宝箱・砂嵐の巣は進まずに知らせる（宝箱は takeChest、巣は戦闘の後 clearNest か loseDig）。砂が足りなければ進めない
 */
export function stepDig(def: DigWorldDef, s: DigState, dir: DigDir): { state: DigState; event: DigEvent } {
  if (s.outcome !== 'diving') return { state: s, event: { type: 'blocked', reason: 'edge' } };
  const [dx, dy] = DIRS[dir];
  const nx = s.x + dx;
  const ny = s.y + dy;
  if (nx < 0 || nx >= s.width || ny < 0 || ny >= s.height) return { state: s, event: { type: 'blocked', reason: 'edge' } };
  const cell = ny * s.width + nx;
  const tile = s.tiles[cell];
  if (tile === 'rock') return { state: s, event: { type: 'blocked', reason: 'rock' } };
  if (tile === 'chest') return { state: s, event: { type: 'chest', cell, items: [...(s.chests[cell] ?? [])] } };
  if (tile === 'nest') return { state: s, event: { type: 'nest', cell, battle: s.nests[cell] } };
  const cost = tile === 'air' ? def.cost.walk : def.cost.dig;
  if (s.sand < cost) return { state: s, event: { type: 'blocked', reason: 'sand' } };
  const tiles = [...s.tiles];
  if (tile === 'clay') {
    tiles[cell] = 'sand';
    return { state: { ...s, tiles, sand: s.sand - cost }, event: { type: 'dig', through: false } };
  }
  tiles[cell] = 'air';
  const next = { ...s, tiles, sand: s.sand - cost, x: nx, y: ny, deepest: Math.max(s.deepest, ny) };
  return { state: next, event: tile === 'air' ? { type: 'move' } : { type: 'dig', through: true } };
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

/** 砂嵐の巣に勝った：巣は空洞に戻り、戦った分の砂が減る */
export function clearNest(def: DigWorldDef, s: DigState, cell: number): DigState {
  const tiles = [...s.tiles];
  tiles[cell] = 'air';
  const nests = { ...s.nests };
  delete nests[cell];
  return { ...s, tiles, nests, sand: Math.max(0, s.sand - def.cost.battle) };
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
