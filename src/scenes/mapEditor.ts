import Phaser from 'phaser';
import type { AreaDef, GridCell, MapEdits, PlacedThing, RoomDef } from '../core';
import { applyMapEdits, checkArea, emptyMapEdits, exitAtTap, exitCells, moveExit, moveMark, moveThing, paintCells, patchRoom, placedThings } from '../core';
import { AREA_TILE, ROOM_NAMES } from '../data';
import { saveMapEdits, showMapEditPanel } from '../debug/mapEdits';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';

// 地図の調整（段階117。?debug=1 の時だけ）：探索の画面の上で、今いる部屋の歩ける場所・出入口・置いた物の位置を指で直す。
// 直すたびに区画の書き間違いの検査をして、上の帯に出す。直した中身は端末に覚え、「終わる」で探索を開き直すと歩いて試せる

const T = AREA_TILE;

type Tool = 'look' | 'open' | 'block' | 'move' | 'exit';
const TOOLS: [Tool, string][] = [
  ['look', '見る'],
  ['open', '歩ける'],
  ['block', '通れない'],
  ['move', '動かす'],
  ['exit', '出入口'],
];

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
  say(text: string): void;
  /** 終わる：探索を開き直す */
  close(): void;
}

export class MapEditor {
  private edits: MapEdits;
  private undo: MapEdits[] = [];
  private tool: Tool = 'look';
  private selected: Selected | null = null;
  private grid: Phaser.GameObjects.Graphics;
  private marks: Phaser.GameObjects.Container;
  private bar: Phaser.GameObjects.Container;
  /** なぞって塗っている途中（始めた時の直しと、塗ったマス） */
  private stroke: { before: MapEdits; done: Set<string> } | null = null;
  private dragFrom: { x: number; y: number; sx: number; sy: number } | null = null;
  private readonly barTop: number;

  constructor(private host: MapEditorHost) {
    const scene = host.scene;
    this.edits = host.edits;
    this.grid = scene.add.graphics();
    this.marks = scene.add.container(0, 0);
    host.world.add([this.grid, this.marks]);
    this.bar = scene.add.container(0, 0);
    host.ui.add(this.bar);
    this.barTop = GAME_HEIGHT - host.bottomBand - 100;
    // 下の道具の帯の分だけ、地図を上まで動かせるようにする（下の端のマスも直せるように）
    const room = this.room;
    host.cam.stopFollow().setBounds(0, -host.topBand, (room.layout[0]?.length ?? 0) * T, room.layout.length * T + host.topBand + host.bottomBand + 110);
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

  private down(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    const cell = this.cellAt(p, over);
    if (!cell) return;
    if (this.tool === 'look') {
      this.dragFrom = { x: p.x, y: p.y, sx: this.host.cam.scrollX, sy: this.host.cam.scrollY };
      return;
    }
    if (this.tool === 'open' || this.tool === 'block') {
      this.stroke = { before: this.edits, done: new Set() };
      this.paint(cell);
    }
  }

  private drag(p: Phaser.Input.Pointer): void {
    if (!p.isDown) return;
    if (this.dragFrom) {
      const cam = this.host.cam;
      cam.setScroll(this.dragFrom.sx - (p.x - this.dragFrom.x) / cam.zoom, this.dragFrom.sy - (p.y - this.dragFrom.y) / cam.zoom);
      return;
    }
    if (this.stroke) {
      const cell = this.cellAt(p, []);
      if (cell) this.paint(cell);
    }
  }

  private up(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (this.dragFrom) {
      this.dragFrom = null;
      return;
    }
    if (this.stroke) {
      const before = this.stroke.before;
      this.stroke = null;
      if (before !== this.edits) this.commit(before, this.tool === 'open' ? '歩ける所にした' : '通れない所にした');
      return;
    }
    if (p.getDistance() > 12) return;
    const cell = this.cellAt(p, over);
    if (!cell) return;
    if (this.tool === 'move') this.tapMove(cell);
    else if (this.tool === 'exit') this.tapExit(cell);
  }

  private paint(cell: GridCell): void {
    const key = `${cell[0]},${cell[1]}`;
    if (!this.stroke || this.stroke.done.has(key)) return;
    this.stroke.done.add(key);
    this.edits = paintCells(this.edits, this.originalRoom, [cell], this.tool === 'open');
    this.drawGrid();
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
    this.edits =
      sel.kind === 'thing'
        ? moveThing(this.edits, this.host.original, sel.thing, cell)
        : moveMark(this.edits, this.host.original, this.originalRoom, sel.cell, cell);
    this.selected = null;
    this.commit(before, `${this.describe(sel)}を動かした`);
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

  private check(what: string): void {
    const errors = checkArea(this.area);
    this.host.say(`${what}\n${errors.length === 0 ? '検査：OK' : `検査：${errors.length}件　${errors[0].replace(/^[^：]+：/, '')}`}`);
  }

  private redraw(): void {
    this.drawGrid();
    this.drawMarks();
  }

  /** マス目：歩ける所は薄い緑、通れない所は薄い赤、出入口は青、ノイズの壁は灰色 */
  private drawGrid(): void {
    const g = this.grid.clear();
    const room = this.room;
    room.layout.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        g.fillStyle(ch === '#' ? 0xff3030 : 0x40ff80, ch === '#' ? 0.3 : 0.08).fillRect(c * T, r * T, T, T);
        g.lineStyle(1, 0xffffff, 0.22).strokeRect(c * T, r * T, T, T);
      }),
    );
    for (const side of room.exits) for (const [c, r] of exitCells(room, side)) g.fillStyle(0x3a8aff, 0.55).fillRect(c * T, r * T, T, T);
    for (const w of this.host.original.walls ?? []) {
      if ((w.room ?? this.host.original.rooms[0].id) !== room.id) continue;
      for (const [c, r] of w.cells) g.fillStyle(0x808080, 0.5).fillRect(c * T + 4, r * T + 4, T - 8, T - 8);
    }
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
    this.bar.add(scene.add.rectangle(0, top, GAME_WIDTH, 100, 0x000000, 0.75).setOrigin(0).setInteractive());
    const w = (GAME_WIDTH - 12) / TOOLS.length;
    TOOLS.forEach(([tool, name], i) => {
      const on = this.tool === tool;
      addButton(scene, this.bar, 6 + w * i + w / 2, top + 26, w - 4, 40, name, { onTap: () => this.pick(tool) }, {
        size: 13,
        fill: on ? 0x5a4a1e : COLORS.panelLight,
        stroke: on ? 0xffd84a : COLORS.border,
        strokeWidth: on ? 2 : 1,
      });
    });
    const actions: [string, () => void][] = [
      ['戻す', () => this.back()],
      ['部屋を元に', () => this.resetRoom()],
      ['書き出し', () => showMapEditPanel(this.edits, () => this.clearAll())],
      ['終わる', () => this.host.close()],
    ];
    const w2 = (GAME_WIDTH - 12) / actions.length;
    actions.forEach(([name, onTap], i) => addButton(scene, this.bar, 6 + w2 * i + w2 / 2, top + 74, w2 - 4, 40, name, { onTap }, { size: 13 }));
    this.bar.add(addText(scene, GAME_WIDTH - 8, top - 4, ROOM_NAMES[this.host.room] ?? this.host.room, { size: 11, color: COLORS.subText }).setOrigin(1, 1));
  }

  private pick(tool: Tool): void {
    this.tool = tool;
    this.selected = null;
    this.drawBar();
    this.drawMarks();
    const help: Record<Tool, string> = {
      look: '見る：なぞると地図が動く',
      open: '歩ける：なぞったマスを歩ける所にする',
      block: '通れない：なぞったマスを通れない所にする（S・P はそのまま）',
      move: '動かす：物をタップして選び、行き先をタップ（敵は見回りの道ごと動く）',
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
    this.edits = { rooms, things };
    this.selected = null;
    this.commit(before, 'この部屋を元の地図に戻した');
  }

  private clearAll(): void {
    const before = this.edits;
    this.edits = emptyMapEdits();
    this.selected = null;
    this.commit(before, '直したものを全部消した');
  }
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
