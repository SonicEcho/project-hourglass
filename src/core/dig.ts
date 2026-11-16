import { nextRandom } from './rng';

// 砂の底を掘る（段階207 試作1・段階208 試作2。docs/milestones/M3_sand_bottom.md）。Phaser に依存しない。
// 横から見た地面（横 width マス、深さは層の合計）を、上下左右に1マスずつ掘り進む。砂時計の砂は時間ではなく手数で減る。
// 地面はシードから作る（同じシードなら同じ地面）。
// 段階208：層の境目の番人（倒さないと下の層へ行けない）、動く砂嵐（近づくと追ってくる）、鉱脈・砂時計の砂粒・崩れる砂を足した。
// 段階209：空洞に砂嵐が稀に湧く（spawn）。段階213：帯の奥の光る物（relics）とぬしの巣（nests）。段階212：層のまとまり（group。章の層の中の区画ごとの帯）。段階211：掘る人の特徴（岩を割る rockCost・固い土を1回で clayOnce）

/**
 * マスの種類。clay は2回掘る（1回目で砂になる）。rock は掘れない。chest は宝箱、guard は層の境目の番人。
 * ore は鉱脈（掘ると素材）、grain は砂時計の砂粒（掘ると砂が戻る）、loose は崩れる砂（下が空くと落ちる）。
 * relic は光る物（段階213。記憶の宝箱・落とし物。中身は DigState の relics）、nest はぬしの巣（段階213。動かないぬし。戦闘は nests）。
 * 段階215：pit 落とし穴（掘って入ると落ちる）・poison 毒の砂（掘ると HP が減る。減らすのは呼ぶ側）・fossil 化石（素材が2つ）・
 * moss 光る苔（まわりを照らす。照らすのは呼ぶ側）は、どれも掘れるマス。spring ばね（空洞の床。乗ると跳ね上がる）・whirl 流砂の渦（空洞の中。隣に来ると引き込まれる）
 */
export type DigTile = 'air' | 'sand' | 'clay' | 'rock' | 'chest' | 'guard' | 'ore' | 'grain' | 'loose' | 'relic' | 'nest' | 'pit' | 'poison' | 'fossil' | 'moss' | 'spring' | 'whirl';

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
  /**
   * この層（まとまり）の下の境目の番人の戦闘（段階212：強い戦闘。どれか1つ）。書かなければ battles の先頭。
   * 番人は、まとまりが変わる所（章の層の間と、いちばん下の層とふつうの地面の間）に必ずいる
   */
  guards?: string[];
  /** 稀に番人として出る、その層の章のぬしの戦闘（段階212）。出る割合は DigWorldDef の lordRate */
  lords?: string[];
  /**
   * 光る物（段階213）：帯の奥の空洞に1つずつ置く。id は呼ぶ側が決める（記憶の宝箱 'gear:<採取の場所>'・落とし物 'lost:<落とし物>'）。
   * 深い空洞から順に置く
   */
  relics?: string[];
  /** ぬしの巣（段階213）：その層のいちばん深い空洞から順にいる、動かないぬしの戦闘（段階215 の続き：いくつでも） */
  nests?: string[];
  /** 仕掛けの割合（段階215）：落とし穴・毒の砂・化石・光る苔（マスの割合）、ばね・流砂の渦（空洞ごとの割合） */
  pit?: number;
  poison?: number;
  fossil?: number;
  moss?: number;
  springRate?: number;
  whirlRate?: number;
  /** 暗がり（段階215）：見える広さ（マス）。書かなければ全部見える。見せ方は呼ぶ側 */
  dark?: number;
  /** 層（まとまり）のいちばん下での、宝箱の中身の重み（段階212。上の端の weights から、深さに合わせて移る）。書かなければ weights のまま */
  deepWeights?: Record<DigRarity, number>;
  /**
   * まとまり（段階212。章の層の名前）。同じまとまりの層（区画ごとの帯）の境目には番人を置かない。
   * 書かなければ、層ごとに別のまとまり
   */
  group?: string;
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
  /**
   * 空洞に砂嵐が湧く（段階209）：1手ごとに rate の割合で、自分から min〜max マス離れた空いたマスに1体（同時に cap 体まで）。
   * 書かなければ湧かない
   */
  spawn?: { rate: number; min: number; max: number; cap: number };
  /** かばんに入る数 */
  bagMax: number;
  /** 岩を割れる時の砂（段階211。掘る人の特徴）。書かなければ割れない。層の境目の岩の帯は割れない（番人は避けられない） */
  rockCost?: number;
  /** 固い土を1回で掘れる（段階211。掘る人の特徴） */
  clayOnce?: boolean;
  /** 層の境目の番人が、その層の章のぬしになる割合（段階212）。書かなければ出ない */
  lordRate?: number;
  /** 道具袋に入る数（段階214）。書かなければ 3 */
  toolMax?: number;
  /** 空洞に落ちている道具の包み（段階214）：空洞ごとに toolRate の割合で、tools から1つ。光る物（'tool:<道具>'）として置く */
  toolRate?: number;
  tools?: string[];
  /** 1回潜るごとの技の回数（段階214）。書かなければ 0 */
  skillUses?: number;
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
  /** 光る物（マスの番号 → id。段階213） */
  relics: Record<number, string>;
  /** ぬしの巣（マスの番号 → 戦闘の id。段階213） */
  nests: Record<number, string>;
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
  /** 道具袋（段階214。持ち込んだ道具と拾った道具） */
  tools: string[];
  /** 残りの技の回数（段階214） */
  skillLeft: number;
  /** 縄ばしごを使った（段階214。帰り道の砂が半分） */
  ladder: boolean;
  /** 砂嵐が動かず湧かない、残りの手数（段階214。砂嵐よけの鈴・時を止める） */
  calm: number;
  /** ランタンで足した、見える広さ（段階215） */
  light: number;
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
  | { type: 'relic'; cell: number; id: string }
  | { type: 'nest'; cell: number; battle: string }
  /** 道具や技を使った（段階214）。dug は掘ったマス、items はかばんに入った素材 */
  | { type: 'used'; what: string; dug: number[]; items: string[] }
  /** 仕掛け（段階215）。fall は落とし穴で落ちた数、jump はばねで跳ねた数、items は化石から出てかばんに入った素材 */
  | { type: 'trap'; trap: 'pit' | 'poison' | 'whirl' | 'spring' | 'fossil'; fall?: number; jump?: number; items?: string[] }
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

const groupOf = (l: DigLayerDef) => l.group ?? l.id;

/** 宝箱の出やすさの、章の層の上の端での割合（段階215 の続き。下の端は 100%） */
const CHEST_TOP = 0.15;

/**
 * その層の上の境目に、岩の帯と番人を置くか（段階212）：まとまりが変わる所で、上のまとまりに戦う砂嵐がいる所。
 * 番人は、上の層（まとまり）の番人。いちばん下の層とふつうの地面の間にもいる
 */
function hasGate(def: DigWorldDef, index: number): boolean {
  if (index <= 0) return false;
  const prev = def.layers[index - 1];
  return groupOf(def.layers[index]) !== groupOf(prev) && (prev.guards?.length ?? 0) + prev.battles.length > 0;
}

/** 深さ y の、その層（まとまり）の中での深さの割合（上の端 0 〜 下の端 1。段階212） */
function depthInGroup(def: DigWorldDef, y: number): number {
  const group = groupOf(digLayerAt(def, y));
  let top = -1;
  let rows = 0;
  let at = 1;
  for (const l of def.layers) {
    if (groupOf(l) === group) {
      if (top < 0) top = at;
      rows += l.rows;
    }
    at += l.rows;
  }
  return rows <= 1 ? 0 : Math.min(1, Math.max(0, (y - top) / (rows - 1)));
}

const lerpWeights = (a: Record<DigRarity, number>, b: Record<DigRarity, number>, t: number): Record<DigRarity, number> => ({
  common: a.common + (b.common - a.common) * t,
  uncommon: a.uncommon + (b.uncommon - a.uncommon) * t,
  rare: a.rare + (b.rare - a.rare) * t,
});

/** 深さ y の宝箱の中身の重み（段階212：層の下の方ほど珍しい物が出やすい） */
export function digWeightsAt(def: DigWorldDef, y: number): Record<DigRarity, number> {
  const layer = digLayerAt(def, y);
  return lerpWeights(layer.weights, layer.deepWeights ?? layer.weights, depthInGroup(def, y));
}

/** 鉱脈の重み（上の端はいつもの物が多く、下の端は珍しい物も出る。段階212） */
const ORE_TOP: Record<DigRarity, number> = { common: 3, uncommon: 1, rare: 0 };
const ORE_BOTTOM: Record<DigRarity, number> = { common: 1, uncommon: 2, rare: 1 };

/** 層の境目の岩の帯の行か（いちばん上の層の上は帯がない） */
export function isDigGuardRow(def: DigWorldDef, y: number): boolean {
  return def.layers.some((l, i) => hasGate(def, i) && digLayerTop(def, l.id) === y);
}

/** そのマスの岩を割れるか（岩を割れる人で、境目の帯でない） */
function canBreakRock(def: DigWorldDef, y: number): boolean {
  return def.rockCost !== undefined && !isDigGuardRow(def, y);
}

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
        // 段階215：仕掛けと光る苔（書いていない層は 0）
        ['pit', layer.pit ?? 0],
        ['poison', layer.poison ?? 0],
        ['fossil', layer.fossil ?? 0],
        ['moss', layer.moss ?? 0],
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
  const relics: Record<number, string> = {};
  const nests: Record<number, string> = {};
  def.layers.forEach((layer, li) => {
    const top = digLayerTop(def, layer.id);
    const caves: { cx: number; cw: number; floor: number }[] = [];
    for (let c = 0; c < layer.caves; c++) {
      // 空洞：横3〜5・縦2〜3。層の中に収める（境目の行は避ける）。
      // 段階214 の続き（開発者の声：宝箱や敵がもう少しバラけるように）：層を空洞の数だけ上下に区切り、区切りごとに1つ。左右は交互に左寄り・右寄り
      const cw = 3 + Math.floor(rand() * 3);
      const ch = 2 + Math.floor(rand() * 2);
      const cx = Math.floor(((c % 2) * 0.5 + rand() * 0.5) * (w - cw + 1));
      const seg = (layer.rows - 1) / layer.caves;
      const cy = top + 1 + Math.min(layer.rows - ch - 1, Math.max(0, Math.floor(c * seg + rand() * Math.max(1, seg - ch))));
      for (let y = cy; y < cy + ch && y < height; y++) for (let x = cx; x < cx + cw; x++) tiles[y * w + x] = 'air';
      const floor = Math.min(cy + ch - 1, height - 1);
      caves.push({ cx, cw, floor });
      const chestCell = floor * w + cx + Math.floor(rand() * cw);
      // 段階215 の続き（開発者の声：宝箱はもっと深い所へ、少なめに）：章の層の中の深さに合わせて出やすく（上の端は 15%）
      if (rand() < layer.chestRate * (CHEST_TOP + (1 - CHEST_TOP) * depthInGroup(def, floor))) {
        tiles[chestCell] = 'chest';
        chests[chestCell] = rollChest(layer.items, digWeightsAt(def, floor), rand, pick);
      }
      const rx = cx + Math.floor(rand() * cw);
      if (floor * w + rx !== chestCell && layer.battles.length > 0 && rand() < layer.nestRate) {
        roamers.push({ id: roamers.length, x: rx, y: floor, battle: pick(layer.battles), chasing: false });
      }
      // ばね・流砂の渦（段階215）：空洞の床の空いたマス（宝箱・砂嵐と重ならない）。割合を書いた層だけ
      for (const [kind, rate] of [
        ['spring', layer.springRate ?? 0],
        ['whirl', layer.whirlRate ?? 0],
      ] as const) {
        if (rate <= 0 || rand() >= rate) continue;
        const sx = cx + Math.floor(rand() * cw);
        const cell = floor * w + sx;
        if (tiles[cell] === 'air' && !(floor === Math.floor(chestCell / w) && sx === chestCell % w) && sx !== rx) tiles[cell] = kind;
      }
      // 道具の包み（段階214）：空洞の天井の段（床の1つ上）に置く。宝箱・砂嵐と重ならない
      if ((def.tools?.length ?? 0) > 0 && ch >= 2 && rand() < (def.toolRate ?? 0)) {
        const tx = cx + Math.floor(rand() * cw);
        const cell = (floor - 1) * w + tx;
        if (tiles[cell] === 'air') {
          tiles[cell] = 'relic';
          relics[cell] = `tool:${pick(def.tools!)}`;
        }
      }
    }
    // ぬしの巣と光る物（段階213）：深い空洞の床から順に。空いたマス（宝箱のない所）に置く
    if (caves.length > 0 && ((layer.nests?.length ?? 0) > 0 || (layer.relics?.length ?? 0) > 0)) {
      const deep = [...caves].sort((a, b) => b.floor - a.floor);
      const place = (cave: (typeof deep)[number]): number | null => {
        for (let i = 0; i < cave.cw; i++) {
          const cell = cave.floor * w + cave.cx + ((Math.floor(cave.cw / 2) + i) % cave.cw);
          if (tiles[cell] === 'air') return cell;
        }
        return null;
      };
      let k = 0;
      for (const battle of layer.nests ?? []) {
        const cell = place(deep[k % deep.length]);
        k++;
        if (cell === null) continue;
        tiles[cell] = 'nest';
        nests[cell] = battle;
      }
      for (const id of layer.relics ?? []) {
        const cell = place(deep[k % deep.length]);
        k++;
        if (cell === null) continue;
        tiles[cell] = 'relic';
        relics[cell] = id;
      }
    }
    // 層の境目（いちばん上の層と、同じまとまりの帯の境目は除く）：岩の帯で、番人のいる1マスだけが通り道
    if (hasGate(def, li)) {
      const gx = 1 + Math.floor(rand() * (w - 2));
      for (let x = 0; x < w; x++) {
        const cell = top * w + x;
        delete chests[cell];
        tiles[cell] = x === gx ? 'guard' : 'rock';
      }
      // 番人は上の層（まとまり）の強い戦闘。稀に、その層の章のぬし
      const above = def.layers[li - 1];
      const lord = (above.lords?.length ?? 0) > 0 && rand() < (def.lordRate ?? 0);
      guards[top * w + gx] = lord ? pick(above.lords!) : pick(above.guards?.length ? above.guards : [above.battles[0]]);
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
  for (const cell of Object.keys(relics).map(Number)) if (tiles[cell] !== 'relic') delete relics[cell];
  for (const cell of Object.keys(nests).map(Number)) if (tiles[cell] !== 'nest') delete nests[cell];
  const alive = roamers.filter((m) => tiles[m.y * w + m.x] === 'air');
  const settled = settle(tiles, w, height, new Set([ex, ...alive.map((m) => m.y * w + m.x)]));
  return { seed: seed >>> 0, width: w, height, tiles: settled, chests, guards, relics, nests, roamers: alive, x: ex, y: 0, sand: def.sand, deepest: 0, bag: [], steps: 0, tools: [], skillLeft: def.skillUses ?? 0, ladder: false, calm: 0, light: 0, outcome: 'diving' };
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
/** 宝箱の中身（段階224。開発者の声：1つの宝箱に素材は1つまで） */
function rollChest(items: Record<DigRarity, string[]>, weights: Record<DigRarity, number>, rand: () => number, pick: <T>(l: readonly T[]) => T): string[] {
  const id = rollItem(items, weights, rand, pick);
  return id ? [id] : [];
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
 * 1手進む：空なら歩く（walk）、砂・崩れる砂なら掘って進む（dig）、固い土は1回掘って砂にする（dig。進まない。clayOnce なら1回で進む）。
 * 岩は、rockCost があれば割って進む（境目の帯は割れない）。
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
  if (tile === 'rock' && !canBreakRock(def, ny)) return { state: s, event: { type: 'blocked', reason: 'rock' } };
  if (tile === 'chest') return { state: s, event: { type: 'chest', cell, items: [...(s.chests[cell] ?? [])] } };
  if (tile === 'guard') return { state: s, event: { type: 'guard', cell, battle: s.guards[cell] } };
  if (tile === 'relic') return { state: s, event: { type: 'relic', cell, id: s.relics[cell] } };
  if (tile === 'nest') return { state: s, event: { type: 'nest', cell, battle: s.nests[cell] } };
  // 流砂の渦（段階215）：自分から入っても引き込まれる
  if (tile === 'whirl') return afterStep(def, pullInto(def, s, cell), { type: 'trap', trap: 'whirl' });
  const walk = tile === 'air' || tile === 'spring';
  const cost = walk ? def.cost.walk : tile === 'rock' ? (def.rockCost ?? def.cost.dig) : def.cost.dig;
  if (s.sand < cost) return { state: s, event: { type: 'blocked', reason: 'sand' } };
  const tiles = [...s.tiles];
  if (tile === 'clay' && !def.clayOnce) {
    tiles[cell] = 'sand';
    return afterStep(def, { ...s, tiles, sand: s.sand - cost }, { type: 'dig', through: false });
  }
  if (tile !== 'spring') tiles[cell] = 'air';
  let next: DigState = { ...s, tiles, sand: s.sand - cost, x: nx, y: ny, deepest: Math.max(s.deepest, ny) };
  let event: DigEvent = tile === 'air' ? { type: 'move' } : { type: 'dig', through: true };
  // 段階215：仕掛け
  if (tile === 'pit') {
    // 落とし穴：下へ3マスまで落ちる（下の砂も崩れる。岩・宝箱・砂嵐などで止まる）
    let fall = 0;
    const t2 = [...next.tiles];
    while (fall < 3) {
      const below = (next.y + fall + 1) * s.width + nx;
      if (next.y + fall + 1 >= s.height || s.roamers.some((m) => m.y * s.width + m.x === below)) break;
      const b = t2[below];
      if (b !== 'air' && b !== 'sand' && b !== 'loose' && b !== 'clay' && b !== 'poison' && b !== 'moss' && b !== 'pit') break;
      t2[below] = 'air';
      fall++;
    }
    next = { ...next, tiles: t2, y: next.y + fall, deepest: Math.max(next.deepest, next.y + fall) };
    event = { type: 'trap', trap: 'pit', fall };
  }
  if (tile === 'poison') event = { type: 'trap', trap: 'poison' };
  if (tile === 'fossil') {
    const got: string[] = [];
    next = fossilItems(def, next, cell, got);
    event = { type: 'trap', trap: 'fossil', items: got };
  }
  if (tile === 'spring') {
    // ばね：上の空いた所を4マスまで跳ね上がる
    let jump = 0;
    while (jump < 4 && ny - jump - 1 >= 0 && next.tiles[(ny - jump - 1) * s.width + nx] === 'air' && !s.roamers.some((m) => m.x === nx && m.y === ny - jump - 1)) jump++;
    next = { ...next, y: ny - jump };
    event = { type: 'trap', trap: 'spring', jump };
  }
  if (tile === 'grain') {
    next = { ...next, sand: next.sand + def.grainSand };
    event = { type: 'grain', sand: def.grainSand };
  }
  if (tile === 'ore') {
    const layer = digLayerAt(def, ny);
    const rand = stepRand(s, cell);
    const item = rollItem(layer.items, lerpWeights(ORE_TOP, ORE_BOTTOM, depthInGroup(def, ny)), rand, (l) => l[Math.floor(rand() * l.length)]);
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
  // 砂嵐よけの鈴・時を止める（段階214）：その間は、砂嵐が動かず湧かない
  if (next.calm > 0) next = { ...next, calm: next.calm - 1 };
  else {
    next = moveRoamers(def, next);
    next = spawnRoamer(def, next);
  }
  const caught = next.roamers.find((m) => m.x === next.x && m.y === next.y);
  if (caught) return { state: next, event: { type: 'roamer', id: caught.id, battle: caught.battle } };
  // 流砂の渦（段階215）：すぐ隣（上下左右）に来ると引き込まれる
  if (event.type !== 'trap' || event.trap !== 'whirl') {
    for (const [dx, dy] of Object.values(DIRS)) {
      const x = next.x + dx;
      const y = next.y + dy;
      if (x < 0 || x >= next.width || y < 0 || y >= next.height) continue;
      if (next.tiles[y * next.width + x] === 'whirl') return { state: pullInto(def, next, y * next.width + x), event: { type: 'trap', trap: 'whirl' } };
    }
  }
  return { state: next, event };
}

/** 流砂の渦に引き込まれる（段階215）：渦のマスへ動き、砂時計の砂 −8。渦は消える */
const WHIRL_SAND = 8;
function pullInto(def: DigWorldDef, s: DigState, cell: number): DigState {
  void def;
  const tiles = [...s.tiles];
  tiles[cell] = 'air';
  const y = Math.floor(cell / s.width);
  return { ...s, tiles, x: cell % s.width, y, deepest: Math.max(s.deepest, y), sand: Math.max(0, s.sand - WHIRL_SAND) };
}

/** 化石（段階215）：その層の素材が2つ（いつもの物か珍しい物）かばんへ。いっぱいなら入る分だけ */
function fossilItems(def: DigWorldDef, s: DigState, cell: number, got: string[]): DigState {
  const y = Math.floor(cell / s.width);
  const rand = stepRand(s, cell + 77);
  let next = s;
  for (let i = 0; i < 2; i++) {
    const item = rollItem(digLayerAt(def, y).items, { common: 1, uncommon: 1, rare: 0 }, rand, (l) => l[Math.floor(rand() * l.length)]);
    if (item && next.bag.length < def.bagMax) {
      next = { ...next, bag: [...next.bag, item] };
      got.push(item);
    }
  }
  return next;
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

/** 空洞に砂嵐が湧く（段階209）：自分から少し離れた空いたマスに、その深さの層の砂嵐が1体 */
function spawnRoamer(def: DigWorldDef, s: DigState): DigState {
  const sp = def.spawn;
  if (!sp || s.roamers.length >= sp.cap) return s;
  const rand = stepRand(s, 4242);
  if (rand() >= sp.rate) return s;
  const taken = occupied(s);
  const cells: number[] = [];
  for (let y = Math.max(1, s.y - sp.max); y <= Math.min(s.height - 1, s.y + sp.max); y++) {
    for (let x = 0; x < s.width; x++) {
      const d = Math.abs(x - s.x) + Math.abs(y - s.y);
      const c = y * s.width + x;
      if (d >= sp.min && d <= sp.max && s.tiles[c] === 'air' && !taken.has(c)) cells.push(c);
    }
  }
  if (cells.length === 0) return s;
  const c = cells[Math.floor(rand() * cells.length)];
  const y = Math.floor(c / s.width);
  const battles = digLayerAt(def, y).battles;
  if (battles.length === 0) return s;
  const id = s.roamers.reduce((m, r) => Math.max(m, r.id + 1), 0);
  return { ...s, roamers: [...s.roamers, { id, x: c % s.width, y, battle: battles[Math.floor(rand() * battles.length)], chasing: false }] };
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

/**
 * かばんの1つを捨てて、宝箱の物と入れ替える。段階224（開発者の声）：捨てた物は残さず、宝箱は消える（空洞に戻る。
 * 宝箱に残りがあれば、残りの分だけの宝箱のまま）
 */
export function swapChest(s: DigState, cell: number, bagIndex: number, item: string): DigState {
  const items = s.chests[cell] ?? [];
  const at = items.indexOf(item);
  if (at < 0 || bagIndex < 0 || bagIndex >= s.bag.length) return s;
  const bag = [...s.bag];
  bag[bagIndex] = item;
  const rest = items.filter((_, i) => i !== at);
  const chests = { ...s.chests };
  const tiles = [...s.tiles];
  if (rest.length === 0) {
    delete chests[cell];
    tiles[cell] = 'air';
  } else chests[cell] = rest;
  return { ...s, bag, tiles, chests };
}

/** 番人に勝った：通り道が開き、戦った分の砂が減る */
export function clearGuard(def: DigWorldDef, s: DigState, cell: number): DigState {
  const tiles = [...s.tiles];
  tiles[cell] = 'air';
  const guards = { ...s.guards };
  delete guards[cell];
  return { ...s, tiles, guards, sand: Math.max(0, s.sand - def.cost.battle) };
}

/** 光る物を手に入れた（段階213）：そのマスは空く */
export function takeRelic(s: DigState, cell: number): DigState {
  const tiles = [...s.tiles];
  tiles[cell] = 'air';
  const relics = { ...s.relics };
  delete relics[cell];
  return { ...s, tiles, relics };
}

/** ぬしの巣のぬしに勝った（段階213）：そのマスは空き、戦った分の砂が減る */
export function clearNest(def: DigWorldDef, s: DigState, cell: number): DigState {
  const tiles = [...s.tiles];
  tiles[cell] = 'air';
  const nests = { ...s.nests };
  delete nests[cell];
  return { ...s, tiles, nests, sand: Math.max(0, s.sand - def.cost.battle) };
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
  // 縄ばしご（段階214）：半分
  return s.ladder ? Math.ceil((s.y * def.cost.back) / 2) : s.y * def.cost.back;
}

/** 道具・技で掘れるマス（段階214）。岩は withRock の時だけ（境目の岩の帯は割れない） */
function breakable(def: DigWorldDef, tile: DigTile, y: number, withRock: boolean): boolean {
  if (tile === 'sand' || tile === 'clay' || tile === 'loose' || tile === 'ore' || tile === 'grain' || tile === 'pit' || tile === 'poison' || tile === 'fossil' || tile === 'moss') return true;
  return withRock && tile === 'rock' && !isDigGuardRow(def, y);
}

/** 1マスを掘りくずす（段階214）：鉱脈はその層の素材をかばんへ（いっぱいなら砂に戻る）、砂粒は砂が戻る */
function breakCell(def: DigWorldDef, s: DigState, cell: number, got: string[]): DigState {
  const tile = s.tiles[cell];
  const tiles = [...s.tiles];
  tiles[cell] = 'air';
  let next: DigState = { ...s, tiles };
  const y = Math.floor(cell / s.width);
  if (tile === 'grain') next = { ...next, sand: next.sand + def.grainSand };
  if (tile === 'fossil') next = fossilItems(def, next, cell, got);
  if (tile === 'ore') {
    const rand = stepRand(s, cell);
    const item = rollItem(digLayerAt(def, y).items, lerpWeights(ORE_TOP, ORE_BOTTOM, depthInGroup(def, y)), rand, (l) => l[Math.floor(rand() * l.length)]);
    if (item && next.bag.length < def.bagMax) {
      next = { ...next, bag: [...next.bag, item] };
      got.push(item);
    }
  }
  return next;
}

/** 道具の働き（段階214）。dir は向いている方（爆ぜる石・砂嵐よけの鈴などは使わない） */
export type DigToolId = 'blast' | 'ladder' | 'bell' | 'shard' | 'lantern' | 'needle';
/** 技の働き（段階214）。heal（応急手当）は HP を戻すので、呼ぶ側が戻す（ここでは回数だけ減らす） */
export type DigSkillId = 'stop' | 'heal' | 'rush' | 'slash' | 'rewind';

/** 道具や技の、掘る働き（掘ったマス・かばんに入った素材・砂を1回分使う。何も掘れなければ使わない） */
function digWith(def: DigWorldDef, s: DigState, cells: number[], what: string, move: number | null): { state: DigState; event: DigEvent } {
  if (cells.length === 0) return { state: s, event: { type: 'blocked', reason: 'edge' } };
  if (s.sand < def.cost.dig) return { state: s, event: { type: 'blocked', reason: 'sand' } };
  const got: string[] = [];
  let next: DigState = { ...s, sand: s.sand - def.cost.dig };
  for (const cell of cells) next = breakCell(def, next, cell, got);
  if (move !== null) next = { ...next, x: move % s.width, y: Math.floor(move / s.width), deepest: Math.max(next.deepest, Math.floor(move / s.width)) };
  return afterStep(def, next, { type: 'used', what, dug: cells, items: got });
}

/** 向いている方へ n マスのマス（画面の外は除く） */
function lineCells(s: DigState, dir: DigDir, n: number): number[] {
  const [dx, dy] = DIRS[dir];
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    const x = s.x + dx * i;
    const y = s.y + dy * i;
    if (x < 0 || x >= s.width || y < 1 || y >= s.height) break;
    out.push(y * s.width + x);
  }
  return out;
}

/** 道具を使う（段階214）。道具袋から1つ減る（使えなかった時は減らない） */
export function useDigTool(def: DigWorldDef, s: DigState, tool: DigToolId): { state: DigState; event: DigEvent } {
  const at = s.tools.indexOf(tool);
  if (s.outcome !== 'diving' || at < 0) return { state: s, event: { type: 'blocked', reason: 'edge' } };
  const rest = { ...s, tools: s.tools.filter((_, i) => i !== at) };
  if (tool === 'ladder') return { state: { ...rest, ladder: true }, event: { type: 'used', what: tool, dug: [], items: [] } };
  if (tool === 'bell') return { state: { ...rest, calm: Math.max(rest.calm, 10) }, event: { type: 'used', what: tool, dug: [], items: [] } };
  if (tool === 'shard') return { state: { ...rest, sand: rest.sand + 25 }, event: { type: 'used', what: tool, dug: [], items: [] } };
  // 段階215：ランタン（見える広さ +3）、探し針（照らすのは呼ぶ側）
  if (tool === 'lantern') return { state: { ...rest, light: rest.light + 3 }, event: { type: 'used', what: tool, dug: [], items: [] } };
  if (tool === 'needle') return { state: rest, event: { type: 'used', what: tool, dug: [], items: [] } };
  // 爆ぜる石：まわり8マス
  const cells: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const x = s.x + dx;
      const y = s.y + dy;
      if ((dx || dy) && x >= 0 && x < s.width && y >= 1 && y < s.height && breakable(def, s.tiles[y * s.width + x], y, false)) cells.push(y * s.width + x);
    }
  const r = digWith(def, rest, cells, tool, null);
  return r.event.type === 'blocked' ? { state: s, event: r.event } : r;
}

/** 技を使う（段階214）。残りの回数から1つ減る（使えなかった時は減らない） */
export function useDigSkill(def: DigWorldDef, s: DigState, skill: DigSkillId, dir: DigDir): { state: DigState; event: DigEvent } {
  if (s.outcome !== 'diving' || s.skillLeft <= 0) return { state: s, event: { type: 'blocked', reason: 'edge' } };
  const rest = { ...s, skillLeft: s.skillLeft - 1 };
  if (skill === 'stop') return { state: { ...rest, calm: Math.max(rest.calm, 3) }, event: { type: 'used', what: skill, dug: [], items: [] } };
  if (skill === 'heal') return { state: rest, event: { type: 'used', what: skill, dug: [], items: [] } };
  if (skill === 'rewind') return { state: { ...rest, sand: rest.sand + 30 }, event: { type: 'used', what: skill, dug: [], items: [] } };
  const occupiedBy = (cell: number) => s.roamers.some((m) => m.y * s.width + m.x === cell);
  if (skill === 'rush') {
    // 突進掘り：向いている方へ3マス。空洞と掘れるマスだけ（岩・宝箱・番人・砂嵐などの手前で止まる）
    const path: number[] = [];
    for (const cell of lineCells(s, dir, 3)) {
      const t = s.tiles[cell];
      if (occupiedBy(cell) || (t !== 'air' && !breakable(def, t, Math.floor(cell / s.width), false))) break;
      path.push(cell);
    }
    if (path.length === 0) return { state: s, event: { type: 'blocked', reason: 'edge' } };
    const dug = path.filter((c) => s.tiles[c] !== 'air');
    const r = dug.length > 0 ? digWith(def, rest, dug, skill, path[path.length - 1]) : afterStep(def, { ...rest, x: path[path.length - 1] % s.width, y: Math.floor(path[path.length - 1] / s.width), deepest: Math.max(s.deepest, Math.floor(path[path.length - 1] / s.width)) }, { type: 'used', what: skill, dug: [], items: [] });
    return r.event.type === 'blocked' ? { state: s, event: r.event } : r;
  }
  // 一閃：向いている方の4マスを、岩も含めて割る（進まない。宝箱・番人などは残る）
  const cells = lineCells(s, dir, 4).filter((c) => breakable(def, s.tiles[c], Math.floor(c / s.width), true));
  const r = digWith(def, rest, cells, skill, null);
  return r.event.type === 'blocked' ? { state: s, event: r.event } : r;
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
