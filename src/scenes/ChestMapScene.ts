import Phaser from 'phaser';
import type { AreaDef, GridCell, MapEdits, OverviewLayout } from '../core';
import { addChest, allPlacedThings, applyMapEdits, checkArea, chestKeys, emptyMapEdits, isWalkable, overviewCell, overviewLayout, parseGrid, placeChestInOrder, removeChest } from '../core';
import { AREAS, AREA_TILE, ROOM_NAMES } from '../data';
import { loadMapEdits, saveMapEdits, showMapEditPanel } from '../debug/mapEdits';
import { hasImage } from '../assets/loader';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';

// 全体地図で宝箱を置く（段階123。?debug=1 の地図直しの「全体で宝箱」から）：区画の全部の部屋の絵を、つながりの向きどおりに1枚に並べ、
// 宝箱をどの部屋のどのマスへでも置く。宝箱を動かすと、同じマスにあった周回の採取の場所も一緒に動く。直した中身は地図直しと同じ所に覚える

const T = AREA_TILE;
const TOP_BAND = 92;
const BAR_HEIGHT = 108;
/** 手を止めてから検査するまでの間（ミリ秒。地図直しと同じ） */
const CHECK_DELAY_MS = 700;
/** 指をこれより動かしたら、タップではなく地図を動かす */
const DRAG_PX = 12;

export interface ChestMapData {
  area: string;
  /** 地図直しを開いていた晩（足した宝箱は、この晩から出す。晩に分けていなければ 0） */
  night: number;
  /** 戻る時に開く部屋 */
  room: string;
}

export class ChestMapScene extends Phaser.Scene {
  private data0!: ChestMapData;
  private original!: AreaDef;
  private edits: MapEdits = emptyMapEdits();
  private undo: MapEdits[] = [];
  private layout!: OverviewLayout;
  /** 持ち上げている宝箱の key（置く順） */
  private lifted: string[] = [];
  /** 「消す」を選んでいるか */
  private erasing = false;
  private zoom = 1;
  private fit = 1;
  private world!: Phaser.GameObjects.Container;
  private marks!: Phaser.GameObjects.Container;
  /** 部屋の名前（縮小している時は大きく出す） */
  private names: Phaser.GameObjects.Text[] = [];
  private ui!: Phaser.GameObjects.Container;
  private bar!: Phaser.GameObjects.Container;
  private message!: Phaser.GameObjects.Text;
  private press: { x: number; y: number; sx: number; sy: number; moved: boolean } | null = null;
  private checkTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('ChestMap');
  }

  create(data: ChestMapData): void {
    this.data0 = data;
    const original = AREAS[data.area];
    if (!original) throw new Error(`unknown area ${data.area}`);
    this.original = original;
    this.edits = loadMapEdits();
    this.undo = [];
    this.lifted = [];
    this.erasing = false;
    this.press = null;
    this.layout = overviewLayout(this.area);

    this.world = this.add.container(0, 0);
    this.names = [];
    this.drawRooms();
    this.marks = this.add.container(0, 0);
    this.world.add(this.marks);
    this.ui = this.add.container(0, 0);

    // カメラ：全体地図用は指で動かし、拡大・縮小する。帯とボタン用は別のカメラで動かさない
    const w = this.layout.cols * T;
    const h = this.layout.rows * T;
    this.fit = Math.min(1, GAME_WIDTH / w, (GAME_HEIGHT - TOP_BAND - BAR_HEIGHT) / h);
    this.zoom = this.fit;
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x0b1118);
    this.applyZoom();
    const roomOff = this.layout.offsets[data.room] ?? [0, 0];
    cam.centerOn((roomOff[0] + 12) * T, (roomOff[1] + 12) * T);
    const uiCam = this.cameras.add(0, 0, cam.width, cam.height).setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    cam.ignore(this.ui);
    uiCam.ignore(this.world);

    this.ui.add(this.add.rectangle(0, 0, GAME_WIDTH, TOP_BAND, 0x000000, 0.82).setOrigin(0));
    this.ui.add(addText(this, GAME_WIDTH / 2, 6, `全体で宝箱：${original.name}`, { size: 13, bold: true }).setOrigin(0.5, 0));
    this.message = addText(this, GAME_WIDTH / 2, 28, '', { size: 11, color: '#9fe8ff', wrap: GAME_WIDTH - 16, align: 'center' }).setOrigin(0.5, 0);
    this.ui.add(this.message);
    this.bar = this.add.container(0, 0);
    this.ui.add(this.bar);
    this.drawBar();
    this.drawMarks();

    this.input.on('pointerdown', this.down, this);
    this.input.on('pointermove', this.move, this);
    this.input.on('pointerup', this.up, this);
    this.check(
      '宝箱をタップして持ち上げ、置きたいマスをタップ（どの部屋でもよい）。「全部持ち上げる」で区画の宝箱を全部持ち上げ、タップした順に置ける。何も持っていない時は、歩けるマスのタップで新しい宝箱を足す',
    );
  }

  private get area(): AreaDef {
    return applyMapEdits(this.original, this.edits);
  }

  private applyZoom(): void {
    const cam = this.cameras.main;
    const pad = 4 * T;
    const w = this.layout.cols * T;
    const h = this.layout.rows * T;
    const viewW = GAME_WIDTH / this.zoom;
    const viewH = GAME_HEIGHT / this.zoom;
    // 地図が画面より小さい時も、上下の帯に隠れずに動かせるよう、まわりに余白をとる
    const extraX = Math.max(0, (viewW - w) / 2);
    const top = TOP_BAND / this.zoom;
    const bottom = BAR_HEIGHT / this.zoom;
    cam.setZoom(RENDER_SCALE * this.zoom).setBounds(-pad - extraX, -pad - top, w + 2 * pad + 2 * extraX, Math.max(h + 2 * pad + top + bottom, viewH));
  }

  /** 部屋の絵と、通れないマスの薄い赤、部屋の名前 */
  private drawRooms(): void {
    const area = this.area;
    for (const room of area.rooms) {
      const o = this.layout.offsets[room.id];
      if (!o) continue;
      const cols = room.layout[0]?.length ?? 0;
      const rows = room.layout.length;
      const [x, y] = [o[0] * T, o[1] * T];
      if (room.image && hasImage(this, room.image)) this.world.add(this.add.image(x, y, room.image).setOrigin(0).setDisplaySize(cols * T, rows * T));
      else this.world.add(this.add.rectangle(x, y, cols * T, rows * T, 0x22303e).setOrigin(0));
      const g = this.add.graphics();
      g.fillStyle(0xff3030, 0.2);
      room.layout.forEach((line, r) => [...line].forEach((ch, c) => ch === '#' && g.fillRect(x + c * T, y + r * T, T, T)));
      g.lineStyle(4, 0xffffff, 0.5).strokeRect(x, y, cols * T, rows * T);
      this.world.add(g);
      const name = addText(this, x + 8, y - 4, ROOM_NAMES[room.id] ?? room.id, { size: 24, bold: true, color: '#ffffff' }).setOrigin(0, 1);
      this.names.push(name);
      this.world.add(name);
    }
  }

  /** 宝箱（箱。晩に分けた区画は何晩目からか）と、周回の採取の場所（採） */
  private drawMarks(): void {
    this.marks.removeAll(true);
    const next = this.lifted[0];
    // 縮小している時も、印が指で押せる大きさに見えるよう大きくする
    const k = this.markScale();
    this.names.forEach((n) => n.setScale(k));
    for (const t of allPlacedThings(this.area)) {
      if (t.kind !== 'chest' && t.kind !== 'gather') continue;
      const o = this.layout.offsets[t.room];
      if (!o) continue;
      const cx = (o[0] + t.cell[0]) * T + T / 2;
      const cy = (o[1] + t.cell[1]) * T + T / 2;
      if (t.kind === 'gather') {
        const g = this.add.container(cx + T * 0.55 * k, cy + T * 0.55 * k).setScale(k);
        g.add(this.add.circle(0, 0, T * 0.45, 0x2f9a5a).setStrokeStyle(2, 0xffffff));
        g.add(addText(this, 0, 0, '採', { size: 16, bold: true }).setOrigin(0.5));
        this.marks.add(g);
        continue;
      }
      const box = this.add.container(cx, cy).setScale(k);
      box.add(this.add.circle(0, 0, T * 0.8, 0xa0702a).setStrokeStyle(t.key === next ? 6 : 2, t.key === next ? 0xffe040 : 0xffffff));
      box.add(addText(this, 0, 0, `箱${t.night ?? ''}`, { size: 22, bold: true }).setOrigin(0.5));
      if (this.lifted.includes(t.key)) box.setAlpha(0.4);
      this.marks.add(box);
    }
  }

  private drawBar(): void {
    this.bar.removeAll(true);
    const top = GAME_HEIGHT - BAR_HEIGHT;
    this.bar.add(this.add.rectangle(0, top, GAME_WIDTH, BAR_HEIGHT, 0x000000, 0.8).setOrigin(0).setInteractive());
    const buttons: [string, () => void, boolean][] = [
      ['拡大', () => this.setZoom(2), false],
      ['縮小', () => this.setZoom(0.5), false],
      [this.lifted.length > 0 ? '持つのをやめる' : '全部持ち上げる', () => this.toggleLiftAll(), this.lifted.length > 0],
      ['消す', () => this.toggleErase(), this.erasing],
      ['戻す', () => this.back(), false],
      ['書き出し', () => showMapEditPanel(this.edits, () => this.clearAll()), false],
      ['地図直しへ', () => this.close(), false],
    ];
    const perRow = 4;
    const w = (GAME_WIDTH - 12) / perRow;
    buttons.forEach(([name, onTap, on], i) => {
      const x = 6 + w * (i % perRow) + w / 2;
      const y = top + 26 + Math.floor(i / perRow) * 48;
      addButton(this, this.bar, x, y, w - 4, 40, name, { onTap }, { size: 11, fill: on ? 0x5a4a1e : 0x1e3a32, stroke: on ? 0xffd84a : 0x6dbf9e, strokeWidth: on ? 2 : 1 });
    });
  }

  private setZoom(by: number): void {
    const cam = this.cameras.main;
    const mid = cam.midPoint.clone();
    this.zoom = Phaser.Math.Clamp(this.zoom * by, this.fit, 2);
    this.applyZoom();
    cam.centerOn(mid.x, mid.y);
    this.drawMarks();
  }

  /** 印の大きさの倍率（画面の上で、宝箱の印が直径およそ14ドットより小さくならないように） */
  private markScale(): number {
    return Math.max(1, 0.45 / this.zoom);
  }

  private down(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    const y = p.y / RENDER_SCALE;
    if (over.length > 0 || y < TOP_BAND || y > GAME_HEIGHT - BAR_HEIGHT) return;
    this.press = { x: p.x, y: p.y, sx: this.cameras.main.scrollX, sy: this.cameras.main.scrollY, moved: false };
  }

  private move(p: Phaser.Input.Pointer): void {
    const press = this.press;
    if (!press || !p.isDown) return;
    if (!press.moved && Math.hypot(p.x - press.x, p.y - press.y) < DRAG_PX * RENDER_SCALE) return;
    press.moved = true;
    const cam = this.cameras.main;
    cam.setScroll(press.sx - (p.x - press.x) / cam.zoom, press.sy - (p.y - press.y) / cam.zoom);
  }

  private up(p: Phaser.Input.Pointer): void {
    const press = this.press;
    this.press = null;
    if (!press || press.moved) return;
    const pt = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    const hit = overviewCell(this.area, this.layout, [Math.floor(pt.x / T), Math.floor(pt.y / T)]);
    if (hit) this.tap(hit.room, hit.cell);
  }

  /** タップしたマス：宝箱なら持ち上げる（消す時は消す）。歩けるマスなら、持ち上げた宝箱を置くか、新しい宝箱を足す */
  private tap(room: string, cell: GridCell): void {
    const area = this.area;
    const chest = allPlacedThings(area).find((t) => t.kind === 'chest' && t.room === room && t.cell[0] === cell[0] && t.cell[1] === cell[1]);
    const before = this.edits;
    if (chest && this.erasing) {
      this.lifted = this.lifted.filter((k) => k !== chest.key);
      this.edits = removeChest(this.edits, chest);
      this.commit(before, `宝箱（${chest.id}）を消した`);
      return;
    }
    if (chest) {
      // 持ち上げている宝箱は、元のマスに残す。持ち上げていない宝箱は、次に置く宝箱にする
      if (this.lifted.includes(chest.key)) {
        this.lifted = this.lifted.filter((k) => k !== chest.key);
        this.say(`宝箱（${chest.id}）は元のマスに残す。${this.left()}`);
      } else {
        this.lifted = [chest.key, ...this.lifted];
        this.say(`宝箱（${chest.id}）を持ち上げた。置きたいマスをタップ（どの部屋でもよい）`);
      }
      this.drawBar();
      this.drawMarks();
      return;
    }
    const roomDef = area.rooms.find((r) => r.id === room);
    if (!roomDef || !isWalkable(parseGrid(roomDef.layout), cell)) {
      this.say('宝箱は歩けるマス（赤くない所）に置く');
      return;
    }
    if (this.erasing) {
      this.say('消す：宝箱をタップすると消す');
      return;
    }
    const where = ROOM_NAMES[room] ?? room;
    if (this.lifted.length > 0) {
      const id = this.lifted[0].split('/')[2];
      const placed = placeChestInOrder(this.edits, this.original, this.lifted, room, cell, this.data0.night);
      this.edits = placed.edits;
      this.lifted = placed.waiting;
      this.commit(before, `宝箱（${id}）を${where}に置いた。${this.left()}`);
      return;
    }
    this.edits = addChest(this.edits, this.original, room, cell, this.data0.night);
    this.commit(before, `${where}に宝箱を足した${this.data0.night > 0 ? `（${this.data0.night}晩目から）` : ''}。中身は書き出しの後に決める`);
  }

  private left(): string {
    return this.lifted.length > 0 ? `持ち上げた宝箱の残り${this.lifted.length}個（次をタップ）` : '持ち上げた宝箱は全部置いた';
  }

  private toggleLiftAll(): void {
    if (this.lifted.length > 0) {
      this.lifted = [];
      this.say('持つのをやめた（置かなかった宝箱は元のマスのまま）');
    } else {
      this.erasing = false;
      this.lifted = chestKeys(this.area);
      this.say(
        this.lifted.length > 0
          ? `区画の宝箱${this.lifted.length}個を持ち上げた（薄い札。黄色の枠が次に置く宝箱）。置きたいマスを続けてタップ。持ち上げた宝箱をタップすると元のマスに残す`
          : 'この区画に宝箱はない。歩けるマスをタップすると足せる',
      );
    }
    this.drawBar();
    this.drawMarks();
  }

  private toggleErase(): void {
    this.erasing = !this.erasing;
    if (this.erasing) this.lifted = [];
    this.drawBar();
    this.drawMarks();
    this.say(this.erasing ? '消す：宝箱をタップすると消す（もう一度押すとやめる）' : '消すのをやめた');
  }

  private commit(before: MapEdits, what: string): void {
    this.undo.push(before);
    if (this.undo.length > 60) this.undo.shift();
    saveMapEdits(this.edits);
    this.drawBar();
    this.drawMarks();
    this.check(what);
  }

  private back(): void {
    const prev = this.undo.pop();
    if (!prev) {
      this.say('これより前には戻せない');
      return;
    }
    this.edits = prev;
    this.lifted = [];
    saveMapEdits(this.edits);
    this.drawBar();
    this.drawMarks();
    this.check('1手前に戻した（持ち上げていた宝箱は下ろした）');
  }

  private clearAll(): void {
    const before = this.edits;
    this.edits = emptyMapEdits();
    this.lifted = [];
    this.commit(before, '直したものを全部消した');
  }

  private say(text: string): void {
    this.message.setText(text);
  }

  /** 区画の検査は、手を止めてから少し後に1回だけ（地図直しと同じ） */
  private check(what: string): void {
    this.say(`${what}\n検査中…`);
    this.checkTimer?.remove();
    this.checkTimer = this.time.delayedCall(CHECK_DELAY_MS, () => {
      const errors = checkArea(this.area);
      this.say(`${what}\n${errors.length === 0 ? '検査：OK' : `検査：${errors.length}件　${errors[0].replace(/^[^：]+：/, '')}`}`);
    });
  }

  /** 地図直しへ戻る（開いていた部屋の地図直しを開き直す） */
  private close(): void {
    const { area, night, room } = this.data0;
    this.scene.start('Explore', { area, won: undefined, lost: undefined, seen: undefined, hunt: undefined, night: night || undefined, tune: { room, edit: true } });
  }
}

