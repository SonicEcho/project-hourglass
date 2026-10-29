import Phaser from 'phaser';
import type { AreaDef, GridCell, MapEdits, PlacedThing, RoomDef } from '../core';
import { ROOF_SPLIT, SHADE, addChest, moveChestTo, paintRoofFine, roofMask, applyMapEdits, checkArea, emptyMapEdits, isWalkable, parseGrid, removeChest, exitAtTap, exitCells, moveExit, moveMark, moveThing, paintCells, patchRoom, placedThings, setPatrol } from '../core';
import { AREA_TILE, ROOM_NAMES } from '../data';
import { saveMapEdits, showMapEditPanel } from '../debug/mapEdits';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';

// 地図の調整（段階117。?debug=1 の時だけ）：探索の画面の上で、今いる部屋の歩ける場所・出入口・置いた物の位置を指で直す。
// 直すたびに区画の書き間違いの検査をして、上の帯に出す。直した中身は端末に覚え、「終わる」で探索を開き直すと歩いて試せる

const T = AREA_TILE;

type Tool = 'look' | 'open' | 'block' | 'roof' | 'fineRoof' | 'shade' | 'move' | 'route' | 'chest' | 'exit';
const TOOLS: [Tool, string][] = [
  ['look', '見る'],
  ['open', '歩ける'],
  ['block', '通れない'],
  ['roof', '屋根'],
  ['fineRoof', '細屋根'],
  ['shade', '陰'],
  ['move', '動かす'],
  ['route', '道'],
  ['chest', '宝箱'],
  ['exit', '出入口'],
];
/** 道具の帯の高さ（段階121：道具10と決める操作5つを、6つずつ3段に並べる。段階123 で決める操作が6つに） */
const BAR_HEIGHT = 148;
/** なぞって塗る道具 */
const PAINTS = ['open', 'block', 'roof', 'shade'] as const;
type PaintTool = (typeof PAINTS)[number];
const isPaint = (t: Tool): t is PaintTool => (PAINTS as readonly string[]).includes(t);
/** マス目を描いておく画像の名前（段階120。前は図形で毎フレーム描いていて重かった） */
const GRID_TEXTURE = 'mapEditGrid';
/** 手を止めてから検査するまでの間（ミリ秒） */
const CHECK_DELAY_MS = 700;

/** 印の字（敵・宝箱など） */
const THING_MARKS: Record<PlacedThing['kind'], { text: string; color: number }> = {
  enemy: { text: '敵', color: 0xd04040 },
  chest: { text: '箱', color: 0xa0702a },
  talker: { text: '人', color: 0x8090b0 },
  gather: { text: '採', color: 0x2f9a5a },
  boss: { text: 'ぬし', color: 0x8a4fbf },
  start: { text: '始', color: 0x2a7aa0 },
  exit: { text: '帰', color: 0xb08a20 },
  trigger: { text: '会', color: 0x506070 },
};

/** 選んでいる物：置いた物か、文字の地図の S・P */
type Selected = { kind: 'thing'; thing: PlacedThing } | { kind: 'mark'; cell: GridCell; mark: string };

export interface MapEditorHost {
  scene: Phaser.Scene;
  /** 地図の入れ物（地図用のカメラに映る） */
  world: Phaser.GameObjects.Container;
  /** 画面の文字とボタンの入れ物（動かないカメラに映る） */
  ui: Phaser.GameObjects.Container;
  cam: Phaser.Cameras.Scene2D.Camera;
  /** 直しを重ねる前の区画（src/data のまま） */
  original: AreaDef;
  room: string;
  edits: MapEdits;
  /** 上の帯の高さ（ここより上はタップしても塗らない） */
  topBand: number;
  /** 下の帯の高さ */
  bottomBand: number;
  /** 晩に分けた区画の、今何晩目か（足した宝箱は、この晩から出す。晩に分けていなければ 0） */
  night: number;
  say(text: string): void;
  /** 終わる：探索を開き直す */
  close(): void;
  /** 全体地図で宝箱を置く画面を開く（段階123） */
  openChestMap(): void;
}

export class MapEditor {
  private edits: MapEdits;
  private undo: MapEdits[] = [];
  private tool: Tool = 'look';
  private selected: Selected | null = null;
  /** 見回りの道を引き直している敵と、折り返しの点（段階119）。fresh は、まだ点を足していない（最初の点で道を引き直す） */
  private routing: { thing: PlacedThing; points: GridCell[]; fresh: boolean } | null = null;
  private grid: Phaser.Textures.CanvasTexture;
  private marks: Phaser.GameObjects.Container;
  private bar: Phaser.GameObjects.Container;
  /** なぞって塗っている途中（始めた時の直しと、塗ったマス） */
  private stroke: { before: MapEdits; done: Set<string>; fineOn?: boolean; last?: GridCell } | null = null;
  /** 地図を2倍に拡大しているか（段階121） */
  private zoomed = false;
  private dragFrom: { x: number; y: number; sx: number; sy: number } | null = null;
  private readonly barTop: number;
  /** 後でする検査（段階120） */
  private checkTimer?: Phaser.Time.TimerEvent;

  constructor(private host: MapEditorHost) {
    const scene = host.scene;
    this.edits = host.edits;
    // マス目は1枚の画像に描いておき、塗ったマスだけ描き直す（段階120。図形で毎フレーム描くと、スマホで重かった）
    const room = this.room;
    if (scene.textures.exists(GRID_TEXTURE)) scene.textures.remove(GRID_TEXTURE);
    const tex = scene.textures.createCanvas(GRID_TEXTURE, (room.layout[0]?.length ?? 0) * T, room.layout.length * T);
    if (!tex) throw new Error('地図直しのマス目の画像を作れない');
    this.grid = tex;
    this.marks = scene.add.container(0, 0);
    host.world.add([scene.add.image(0, 0, GRID_TEXTURE).setOrigin(0), this.marks]);
    this.bar = scene.add.container(0, 0);
    host.ui.add(this.bar);
    this.barTop = GAME_HEIGHT - host.bottomBand - BAR_HEIGHT;
    // 下の道具の帯の分だけ、地図を上まで動かせるようにする（下の端のマスも直せるように）
    host.cam.stopFollow().setBounds(0, -host.topBand, (room.layout[0]?.length ?? 0) * T, room.layout.length * T + host.topBand + host.bottomBand + BAR_HEIGHT + 10);
    scene.input.on('pointerdown', this.down, this);
    scene.input.on('pointermove', this.drag, this);
    scene.input.on('pointerup', this.up, this);
    this.redraw();
    this.drawBar();
    this.check('地図直し：下の道具を選んで、地図を指で直す');
  }

  private get originalRoom(): RoomDef {
    return this.host.original.rooms.find((r) => r.id === this.host.room) ?? this.host.original.rooms[0];
  }

  private get area(): AreaDef {
    return applyMapEdits(this.host.original, this.edits);
  }

  private get room(): RoomDef {
    return patchRoom(this.originalRoom, this.edits);
  }

  /** 画面のどこを押したか（ボタンの上や上下の帯なら null）。地図のマスで返す */
  private cellAt(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): GridCell | null {
    if (over.length > 0) return null;
    const y = p.y / RENDER_SCALE;
    if (y < this.host.topBand || y > this.barTop) return null;
    const pt = p.positionToCamera(this.host.cam) as Phaser.Math.Vector2;
    const cell: GridCell = [Math.floor(pt.x / T), Math.floor(pt.y / T)];
    const room = this.room;
    if (cell[1] < 0 || cell[1] >= room.layout.length || cell[0] < 0 || cell[0] >= (room.layout[0]?.length ?? 0)) return null;
    return cell;
  }

  /** 押した所の、細かい屋根の小さな四角（段階121。マスの列 × 4 + マスの中の位置） */
  private subAt(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): GridCell | null {
    if (!this.cellAt(p, over)) return null;
    const pt = p.positionToCamera(this.host.cam) as Phaser.Math.Vector2;
    const q = T / ROOF_SPLIT;
    return [Math.floor(pt.x / q), Math.floor(pt.y / q)];
  }

  private down(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    const cell = this.cellAt(p, over);
    if (!cell) return;
    if (this.tool === 'look') {
      this.dragFrom = { x: p.x, y: p.y, sx: this.host.cam.scrollX, sy: this.host.cam.scrollY };
      return;
    }
    if (isPaint(this.tool)) {
      this.stroke = { before: this.edits, done: new Set() };
      this.paint(cell);
    }
    if (this.tool === 'fineRoof') {
      // 最初に触れた小さな四角が屋根なら外していき、屋根でなければ塗っていく
      const sub = this.subAt(p, over);
      if (!sub) return;
      const n = ROOF_SPLIT;
      const bit = 1 << ((sub[1] % n) * n + (sub[0] % n));
      this.stroke = { before: this.edits, done: new Set(), fineOn: (roofMask(this.room, Math.floor(sub[0] / n), Math.floor(sub[1] / n)) & bit) === 0 };
      this.paintFine(sub);
    }
  }

  private drag(p: Phaser.Input.Pointer): void {
    if (!p.isDown) return;
    if (this.dragFrom) {
      const cam = this.host.cam;
      cam.setScroll(this.dragFrom.sx - (p.x - this.dragFrom.x) / cam.zoom, this.dragFrom.sy - (p.y - this.dragFrom.y) / cam.zoom);
      return;
    }
    // 指を速く動かすと間のマスを飛ばすので、前に塗った所から今の所までを線でつないで塗る（段階121）
    if (this.stroke?.fineOn !== undefined) {
      const sub = this.subAt(p, []);
      if (sub) for (const q of between(this.stroke.last ?? sub, sub)) this.paintFine(q);
      return;
    }
    if (this.stroke) {
      const cell = this.cellAt(p, []);
      if (cell) for (const q of between(this.stroke.last ?? cell, cell)) this.paint(q);
    }
  }

  private up(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (this.dragFrom) {
      this.dragFrom = null;
      return;
    }
    if (this.stroke) {
      const { before, fineOn } = this.stroke;
      this.stroke = null;
      const done: Record<Tool, string> = {
        look: '',
        open: '歩ける所にした',
        block: '通れない所にした',
        roof: '屋根の下にした',
        fineRoof: fineOn ? '細かい屋根を塗った' : '細かい屋根を外した',
        shade: '陰にした',
        move: '',
        route: '',
        chest: '',
        exit: '',
      };
      if (before !== this.edits) this.commit(before, done[this.tool]);
      return;
    }
    if (p.getDistance() > 12) return;
    const cell = this.cellAt(p, over);
    if (!cell) return;
    if (this.tool === 'move') this.tapMove(cell);
    else if (this.tool === 'route') this.tapRoute(cell);
    else if (this.tool === 'chest') this.tapChest(cell);
    else if (this.tool === 'exit') this.tapExit(cell);
  }

  private paint(cell: GridCell): void {
    const key = `${cell[0]},${cell[1]}`;
    if (!this.stroke) return;
    this.stroke.last = cell;
    if (this.stroke.done.has(key)) return;
    this.stroke.done.add(key);
    if (!isPaint(this.tool)) return;
    this.edits = paintCells(this.edits, this.originalRoom, [cell], this.tool);
    this.drawGrid([cell]);
  }

  /** 細かい屋根を1つ塗る・外す（段階121） */
  private paintFine(sub: GridCell): void {
    const key = `${sub[0]},${sub[1]}`;
    if (!this.stroke || this.stroke.fineOn === undefined) return;
    this.stroke.last = sub;
    if (this.stroke.done.has(key)) return;
    this.stroke.done.add(key);
    this.edits = paintRoofFine(this.edits, this.originalRoom, [sub], this.stroke.fineOn);
    this.drawGrid([[Math.floor(sub[0] / ROOF_SPLIT), Math.floor(sub[1] / ROOF_SPLIT)]]);
  }

  /** 地図を2倍に拡大する・戻す（段階121。細かい屋根を塗りやすく）。真ん中に見えている所を保つ */
  private toggleZoom(): void {
    const cam = this.host.cam;
    const mid = cam.midPoint.clone();
    this.zoomed = !this.zoomed;
    cam.setZoom(RENDER_SCALE * (this.zoomed ? 2 : 1));
    cam.centerOn(mid.x, mid.y);
    this.drawBar();
    this.host.say(this.zoomed ? '拡大した（もう一度押すと戻す）' : '拡大を戻した');
  }

  /** 動かす：物を選び、行き先をタップ。同じマスをもう一度タップすると、そのマスの次の物を選ぶ */
  private tapMove(cell: GridCell): void {
    const here = this.candidates(cell);
    const sel = this.selected;
    if (sel && same(selCell(sel), cell)) {
      const i = here.findIndex((h) => key(h) === key(sel));
      this.selected = here.length > 1 ? here[(i + 1) % here.length] : null;
      this.drawMarks();
      this.host.say(this.selected ? `選んだ：${this.describe(this.selected)}。行き先をタップ` : '選ぶのをやめた');
      return;
    }
    if (!sel) {
      if (here.length === 0) {
        this.host.say('ここには動かせる物がない（敵・宝箱・人・採取・ぬし・始・帰・会・S・P を選べる）');
        return;
      }
      this.selected = here[0];
      this.drawMarks();
      this.host.say(`選んだ：${this.describe(here[0])}${here.length > 1 ? `（このマスにほかに${here.length - 1}つ。もう一度タップで次）` : ''}。行き先をタップ`);
      return;
    }
    const before = this.edits;
    // 宝箱は、同じマスにあった採取の場所も一緒に動かす（段階123）
    this.edits =
      sel.kind === 'mark'
        ? moveMark(this.edits, this.host.original, this.originalRoom, sel.cell, cell)
        : sel.thing.kind === 'chest'
          ? moveChestTo(this.edits, this.host.original, sel.thing.key, this.host.room, cell)
          : moveThing(this.edits, this.host.original, sel.thing, cell);
    this.selected = null;
    this.commit(before, `${this.describe(sel)}を動かした`);
  }

  /**
   * 道（段階119）：敵をタップして選び、折り返しの点を順にタップする（最初の点で前の道は消える）。
   * 最後の点をもう一度タップすると取り消し、敵をもう一度タップすると決める。2点なら行き来、3点以上なら輪
   */
  private tapRoute(cell: GridCell): void {
    const r = this.routing;
    if (!r) {
      const enemy = placedThings(this.area, this.host.room).find((t) => t.kind === 'enemy' && same(t.cell, cell));
      if (!enemy) {
        this.host.say('道：まず敵（赤い「敵」の札）をタップする');
        return;
      }
      this.routing = { thing: enemy, points: enemy.patrol ?? [enemy.cell], fresh: true };
      this.drawMarks();
      this.host.say(`${this.describe({ kind: 'thing', thing: enemy })}の道を引き直す：折り返しの点を順にタップ。最後の点をもう一度タップで取り消し、敵をタップで決める`);
      return;
    }
    if (same(cell, r.points[0])) {
      this.routing = null;
      this.drawMarks();
      this.check(`道を決めた（${r.points.length < 2 ? '動かない' : r.points.length === 2 ? '行き来する' : `${r.points.length}点を回る`}）`);
      return;
    }
    const last = r.points[r.points.length - 1];
    if (!r.fresh && r.points.length > 1 && same(cell, last)) r.points = r.points.slice(0, -1);
    else r.points = r.fresh ? [r.points[0], cell] : [...r.points, cell];
    r.fresh = false;
    const before = this.edits;
    this.edits = setPatrol(this.edits, this.host.original, r.thing, r.points);
    this.commit(before, `道：折り返しの点 ${r.points.length - 1}つ`);
  }

  /** 宝箱（段階120）：宝箱をタップすると消し、何もない歩けるマスをタップすると足す（中身は Claude が src/data に入れる時に決める） */
  private tapChest(cell: GridCell): void {
    const chest = placedThings(this.area, this.host.room).find((t) => t.kind === 'chest' && same(t.cell, cell));
    const before = this.edits;
    if (chest) {
      this.edits = removeChest(this.edits, chest);
      this.commit(before, `宝箱（${chest.id}）を消した`);
      return;
    }
    if (!isWalkable(parseGrid(this.room.layout), cell)) {
      this.host.say('宝箱は歩けるマスに置く');
      return;
    }
    this.edits = addChest(this.edits, this.host.original, this.host.room, cell, this.host.night);
    this.commit(before, `宝箱を足した${this.host.night > 0 ? `（${this.host.night}晩目から）` : ''}。中身は書き出しの後に決める`);
  }

  /** 出入口：辺の近くをタップすると、そこへずらす */
  private tapExit(cell: GridCell): void {
    const at = exitAtTap(this.room, cell);
    if (!at) {
      this.host.say(`使える出入口の辺の近く（3マス以内）をタップする。この部屋の出入口：${this.room.exits.map(sideName).join('・') || 'なし'}`);
      return;
    }
    const before = this.edits;
    this.edits = moveExit(this.edits, this.originalRoom, at.side, at.first);
    this.commit(before, `${sideName(at.side)}の出入口をずらした`);
  }

  /** そのマスで選べる物 */
  private candidates(cell: GridCell): Selected[] {
    const things: Selected[] = placedThings(this.area, this.host.room)
      .filter((t) => same(t.cell, cell))
      .map((thing) => ({ kind: 'thing', thing }));
    const ch = this.room.layout[cell[1]]?.[cell[0]];
    if (ch === 'S' || ch === 'P') things.push({ kind: 'mark', cell, mark: ch });
    return things;
  }

  private describe(s: Selected): string {
    if (s.kind === 'mark') return s.mark === 'S' ? '出発点 S' : 'チェックポイント P';
    const t = s.thing;
    return `${THING_MARKS[t.kind].text}（${t.id}）`;
  }

  /** 直しを決める：1手前を覚え、端末に書き、検査する */
  private commit(before: MapEdits, what: string): void {
    this.undo.push(before);
    if (this.undo.length > 60) this.undo.shift();
    saveMapEdits(this.edits);
    this.redraw();
    this.check(what);
  }

  /**
   * 区画の検査（checkArea）は、手を止めてから少し後に1回だけする（段階120。1回に0.3秒ほどかかり、塗るたびにすると止まって重かった）。
   * 直した事はすぐに出し、検査の結果は後から足す
   */
  private check(what: string): void {
    this.host.say(`${what}\n検査中…`);
    this.checkTimer?.remove();
    this.checkTimer = this.host.scene.time.delayedCall(CHECK_DELAY_MS, () => {
      const errors = checkArea(this.area);
      this.host.say(`${what}\n${errors.length === 0 ? '検査：OK' : `検査：${errors.length}件　${errors[0].replace(/^[^：]+：/, '')}`}`);
    });
  }

  private redraw(): void {
    this.drawGrid();
    this.drawMarks();
  }

  /**
   * マス目：歩ける所は薄い緑、通れない所は薄い赤、屋根の下（段階118）は紫、出入口は青、ノイズの壁は灰色。
   * cells を渡すと、そのマスだけ描き直す（なぞって塗っている間）
   */
  private drawGrid(cells?: GridCell[]): void {
    const ctx = this.grid.context;
    const room = this.room;
    const exits = new Set(room.exits.flatMap((side) => exitCells(room, side)).map(([c, r]) => `${c},${r}`));
    const walls = new Set(
      (this.host.original.walls ?? [])
        .filter((w) => (w.room ?? this.host.original.rooms[0].id) === room.id)
        .flatMap((w) => w.cells)
        .map(([c, r]) => `${c},${r}`),
    );
    const all: GridCell[] = cells ?? room.layout.flatMap((line, r) => [...line].map((_, c): GridCell => [c, r]));
    if (!cells) ctx.clearRect(0, 0, this.grid.width, this.grid.height);
    ctx.lineWidth = 1;
    for (const [c, r] of all) {
      const ch = room.layout[r]?.[c];
      if (ch === undefined) continue;
      const [x, y] = [c * T, r * T];
      ctx.clearRect(x, y, T, T);
      // 屋根の下（段階118）は紫、陰（段階121）は濃い青。細かい屋根は小さな四角ごとに紫
      ctx.fillStyle = ch === SHADE ? 'rgba(40,40,140,0.4)' : ch === '#' ? 'rgba(255,48,48,0.3)' : 'rgba(64,255,128,0.08)';
      ctx.fillRect(x, y, T, T);
      const bits = roofMask(room, c, r);
      if (bits) {
        const n = ROOF_SPLIT;
        const q = T / n;
        ctx.fillStyle = 'rgba(176,96,255,0.45)';
        for (let i = 0; i < n * n; i++) if (bits & (1 << i)) ctx.fillRect(x + (i % n) * q, y + Math.floor(i / n) * q, q, q);
      }
      const k = `${c},${r}`;
      if (exits.has(k)) {
        ctx.fillStyle = 'rgba(58,138,255,0.55)';
        ctx.fillRect(x, y, T, T);
      }
      if (walls.has(k)) {
        ctx.fillStyle = 'rgba(128,128,128,0.5)';
        ctx.fillRect(x + 4, y + 4, T - 8, T - 8);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
    }
    this.grid.refresh();
  }

  /** 物の印と S・P。選んでいる物は黄色の枠 */
  private drawMarks(): void {
    const scene = this.host.scene;
    this.marks.removeAll(true);
    const room = this.room;
    room.layout.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        if (ch === 'S' || ch === 'P') this.marks.add(this.label(c, r, ch, ch === 'S' ? 0x2a7a2a : 0x2a6aaa, 0));
      }),
    );
    const offsets = new Map<string, number>();
    for (const t of placedThings(this.area, room.id)) {
      if (t.patrol && t.patrol.length > 1) {
        const line = scene.add.graphics().lineStyle(2, 0xff6060, 0.8);
        const pts = t.patrol.length > 2 ? [...t.patrol, t.patrol[0]] : t.patrol;
        for (let i = 1; i < pts.length; i++) line.lineBetween(pts[i - 1][0] * T + T / 2, pts[i - 1][1] * T + T / 2, pts[i][0] * T + T / 2, pts[i][1] * T + T / 2);
        for (const p of t.patrol.slice(1)) line.fillStyle(0xff6060, 0.9).fillCircle(p[0] * T + T / 2, p[1] * T + T / 2, 4);
        this.marks.add(line);
      }
      const k = `${t.cell[0]},${t.cell[1]}`;
      const n = offsets.get(k) ?? 0;
      offsets.set(k, n + 1);
      const mark = THING_MARKS[t.kind];
      const night = t.kind === 'start' || t.kind === 'exit' ? t.id : t.night ? String(t.night) : '';
      this.marks.add(this.label(t.cell[0], t.cell[1], mark.text + night, mark.color, n));
    }
    const sel = this.selected;
    if (sel) {
      const [c, r] = selCell(sel);
      this.marks.add(scene.add.rectangle(c * T + T / 2, r * T + T / 2, T, T).setStrokeStyle(3, 0xffe040));
    }
    // 引き直している道（段階119）：黄色の線と、折り返しの点の番号
    const route = this.routing?.points;
    if (route) {
      const g = scene.add.graphics().lineStyle(4, 0xffe040, 0.95);
      const pts = route.length > 2 ? [...route, route[0]] : route;
      for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1][0] * T + T / 2, pts[i - 1][1] * T + T / 2, pts[i][0] * T + T / 2, pts[i][1] * T + T / 2);
      g.strokeRect(route[0][0] * T, route[0][1] * T, T, T);
      this.marks.add(g);
      route.slice(1).forEach(([c, r], i) => {
        this.marks.add(scene.add.circle(c * T + T / 2, r * T + T / 2, 9, 0xffe040).setStrokeStyle(1, 0x000000));
        this.marks.add(addText(scene, c * T + T / 2, r * T + T / 2, String(i + 1), { size: 11, bold: true, color: '#000000' }).setOrigin(0.5));
      });
    }
  }

  /** マスの上の小さな札（同じマスに重なる時は少しずらす） */
  private label(c: number, r: number, text: string, color: number, n: number): Phaser.GameObjects.Container {
    const scene = this.host.scene;
    const box = scene.add.container(c * T + T / 2 + n * 6, r * T + T / 2 - n * 6);
    box.add(scene.add.rectangle(0, 0, T - 4, T * 0.6, color, 0.9).setStrokeStyle(1, 0xffffff));
    box.add(addText(scene, 0, 0, text, { size: 10, bold: true, color: '#ffffff' }).setOrigin(0.5));
    return box;
  }

  /** 下の道具の帯 */
  private drawBar(): void {
    const scene = this.host.scene;
    this.bar.removeAll(true);
    const top = this.barTop;
    // 帯の裏はタップを受け止める（地図を塗らないように）
    this.bar.add(scene.add.rectangle(0, top, GAME_WIDTH, BAR_HEIGHT, 0x000000, 0.75).setOrigin(0).setInteractive());
    // 道具10（選んでいるものは金色）と、決める操作6つ（緑がかった色）を、6つずつ3段に
    const actions: [string, () => void][] = [
      [this.zoomed ? '縮小' : '拡大', () => this.toggleZoom()],
      ['戻す', () => this.back()],
      ['部屋を元に', () => this.resetRoom()],
      ['書き出し', () => showMapEditPanel(this.edits, () => this.clearAll())],
      ['全体で宝箱', () => this.host.openChestMap()],
      ['終わる', () => this.host.close()],
    ];
    const buttons: { name: string; onTap: () => void; on: boolean; action: boolean }[] = [
      ...TOOLS.map(([tool, name]) => ({ name, onTap: () => this.pick(tool), on: this.tool === tool, action: false })),
      ...actions.map(([name, onTap]) => ({ name, onTap, on: false, action: true })),
    ];
    const perRow = 6;
    const w = (GAME_WIDTH - 12) / perRow;
    buttons.forEach((b, i) => {
      const x = 6 + w * (i % perRow) + w / 2;
      const y = top + 26 + Math.floor(i / perRow) * 48;
      addButton(scene, this.bar, x, y, w - 4, 40, b.name, { onTap: b.onTap }, {
        size: 11,
        fill: b.on ? 0x5a4a1e : b.action ? 0x1e3a32 : COLORS.panelLight,
        stroke: b.on ? 0xffd84a : b.action ? 0x6dbf9e : COLORS.border,
        strokeWidth: b.on ? 2 : 1,
      });
    });
    this.bar.add(addText(scene, GAME_WIDTH - 8, top - 4, ROOM_NAMES[this.host.room] ?? this.host.room, { size: 11, color: COLORS.subText }).setOrigin(1, 1));
  }

  private pick(tool: Tool): void {
    this.tool = tool;
    this.selected = null;
    this.routing = null;
    this.drawBar();
    this.drawMarks();
    const help: Record<Tool, string> = {
      look: '見る：なぞると地図が動く',
      open: '歩ける：なぞったマスを歩ける所にする（屋根の下・陰も外す）',
      fineRoof: '細屋根：1マスを16に割った細かさで屋根を塗る（最初に触れた所が屋根なら外していく）。「拡大」で塗りやすくなる',
      shade: '陰：なぞったマスを、地面に影が落ちているだけの所にする（濃い青。上に重ねず、入ると少し暗くなる）',
      roof: '屋根：なぞったマスを、歩ける屋根や木の下にする（紫。歩くと絵の下に隠れる）',
      block: '通れない：なぞったマスを通れない所にする（S・P はそのまま）',
      move: '動かす：物をタップして選び、行き先をタップ（敵は見回りの道ごと動く）',
      chest: '宝箱：何もない歩けるマスをタップすると足し、宝箱をタップすると消す（中身は書き出しの後に Claude が決める）。区画全体に置くなら「全体で宝箱」',
      route: '道：敵をタップして選び、見回りの折り返しの点を順にタップ（2点なら行き来、3点以上なら輪）。敵をもう一度タップで決める',
      exit: '出入口：出入口の辺の近くをタップすると、そこへずらす（青いマス）',
    };
    this.host.say(help[tool]);
  }

  private back(): void {
    const prev = this.undo.pop();
    if (!prev) {
      this.host.say('これより前には戻せない');
      return;
    }
    this.edits = prev;
    this.selected = null;
    this.routing = null;
    saveMapEdits(this.edits);
    this.redraw();
    this.check('1手前に戻した');
  }

  /** この部屋の直し（文字の地図・出入口と、この部屋に置いた物の位置）を外す */
  private resetRoom(): void {
    const before = this.edits;
    const rooms = { ...this.edits.rooms };
    delete rooms[this.host.room];
    const inRoom = new Set(placedThings(this.host.original, this.host.room).map((t) => t.key));
    const things = Object.fromEntries(Object.entries(this.edits.things).filter(([k]) => !inRoom.has(k)));
    const patrols = Object.fromEntries(Object.entries(this.edits.patrols ?? {}).filter(([k]) => !inRoom.has(k)));
    const newChests = Object.fromEntries(Object.entries(this.edits.newChests ?? {}).filter(([, c]) => c.room !== this.host.room));
    const removedChests = (this.edits.removedChests ?? []).filter((k) => !inRoom.has(k));
    const thingRooms = Object.fromEntries(Object.entries(this.edits.thingRooms ?? {}).filter(([k]) => !inRoom.has(k)));
    this.edits = {
      rooms,
      things,
      ...(Object.keys(patrols).length > 0 ? { patrols } : {}),
      ...(Object.keys(newChests).length > 0 ? { newChests } : {}),
      ...(removedChests.length > 0 ? { removedChests } : {}),
      ...(Object.keys(thingRooms).length > 0 ? { thingRooms } : {}),
    };
    this.selected = null;
    this.routing = null;
    this.commit(before, 'この部屋を元の地図に戻した');
  }

  private clearAll(): void {
    const before = this.edits;
    this.edits = emptyMapEdits();
    this.selected = null;
    this.routing = null;
    this.commit(before, '直したものを全部消した');
  }
}

/** 2つのマスの間を、1マスずつたどった並び（両端を含む） */
function between(a: GridCell, b: GridCell): GridCell[] {
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  if (n === 0) return [b];
  return Array.from({ length: n + 1 }, (_, i): GridCell => [Math.round(a[0] + ((b[0] - a[0]) * i) / n), Math.round(a[1] + ((b[1] - a[1]) * i) / n)]);
}

function same(a: GridCell, b: GridCell): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function selCell(s: Selected): GridCell {
  return s.kind === 'thing' ? s.thing.cell : s.cell;
}

function key(s: Selected): string {
  return s.kind === 'thing' ? s.thing.key : `mark:${s.cell[0]},${s.cell[1]}`;
}

function sideName(side: string): string {
  return { top: '上', bottom: '下', left: '左', right: '右' }[side] ?? side;
}
