import Phaser from 'phaser';
import type { DigDir, DigState } from '../core';
import { addItems, clearNest, createDig, digBackCost, digEntrance, digLayerAt, goHome, loseDig, recordLibraryFinds, stepDig, swapChest, takeChest } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ALLY_FACE, SAND_BOTTOM, SAND_BOTTOM_COLORS, SAND_BOTTOM_METERS_PER_ROW, WEAPON_DATA } from '../data';
import { faceImage } from '../ui/portrait';
import { hasImage } from '../assets/loader';
import { battleImages, commonImages } from '../assets/screenImages';
import { waitImages } from '../ui/waitImages';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { currentParty, run, saveRun, storyBattleLineup } from './run';

// 砂の底を掘る（段階207。試作1。docs/milestones/M3_sand_bottom.md）。横から見た地面を、タップした方へ1マスずつ掘り進む。
// 砂時計の砂は手数で減る。宝箱はかばん（10個）へ、砂嵐の巣はいつもの戦闘（HP・MP は持ち越し）。「上へ戻る」で持ち帰る。
// 試作なので絵は色の四角。潜っている途中はセーブしない（閉じたら潜る前から）

export interface SandBottomData {
  /** 砂嵐の巣に勝って戻った（巣のマス） */
  won?: number;
  /** 戦闘に負けて戻った */
  lost?: boolean;
}

const T = 26;
const COLS = 15;
const GRID_Y = 96;
const ROWS = 21;
const PANEL_Y = GRID_Y + ROWS * T;

/** 潜った回数（シードをずらす。周回の中だけ） */
let diveCount = 0;

const itemName = (id: string) => WEAPON_DATA.items[id]?.name ?? id;
const rarityMark = (id: string) => {
  const r = WEAPON_DATA.items[id]?.rarity;
  return r === 'rare' ? '★' : r === 'uncommon' ? '◆' : '・';
};

export class SandBottomScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private message = '';

  constructor() {
    super('SandBottom');
  }

  private get s(): DigState {
    return run.dig!.state;
  }

  private set s(v: DigState) {
    run.dig = { ...run.dig!, state: v };
  }

  create(data: SandBottomData = {}): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f22).setOrigin(0);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.message = '';
    if (!run.dig || run.dig.state.outcome !== 'diving') {
      diveCount++;
      run.dig = { state: createDig(SAND_BOTTOM, (run.seed + diveCount * 7919) >>> 0), vitals: {}, count: diveCount };
      this.message = '砂時計の砂が落ちきる前に、上へ戻ろう。タップした方へ掘り進む';
    }
    if (data.won !== undefined) {
      this.s = clearNest(SAND_BOTTOM, this.s, data.won);
      this.message = '砂嵐を倒した！（砂時計 −' + SAND_BOTTOM.cost.battle + '）';
    }
    if (data.lost) {
      this.s = loseDig(SAND_BOTTOM, this.s);
      run.dig = { ...run.dig!, vitals: {} };
    }
    this.render();
    if (this.s.outcome !== 'diving') this.showResult();
  }

  private render(): void {
    this.root.removeAll(true);
    this.drawGrid();
    this.drawHud();
    this.drawPanel();
  }

  /** 見える範囲の上の行（自分が上から7行目あたりに来るように） */
  private viewTop(): number {
    return Phaser.Math.Clamp(this.s.y - 6, 0, Math.max(0, this.s.height - ROWS));
  }

  private drawGrid(): void {
    const top = this.viewTop();
    const g = this.add.graphics();
    this.root.add(g);
    let lastLayer = '';
    for (let r = 0; r < ROWS && top + r < this.s.height; r++) {
      const y = top + r;
      const layer = digLayerAt(SAND_BOTTOM, Math.max(1, y));
      const c = SAND_BOTTOM_COLORS[layer.id];
      for (let x = 0; x < COLS; x++) {
        const tile = this.s.tiles[y * this.s.width + x];
        const px = x * T;
        const py = GRID_Y + r * T;
        if (y === 0) {
          g.fillStyle(0x2a3a5a, 1).fillRect(px, py, T, T);
          continue;
        }
        g.fillStyle(tile === 'sand' ? c.sand : tile === 'clay' ? c.clay : c.air, 1).fillRect(px, py, T, T);
        if (tile === 'sand' || tile === 'clay') g.lineStyle(1, 0x000000, 0.18).strokeRect(px, py, T, T);
        if (tile === 'rock') {
          g.fillStyle(c.air, 1).fillRect(px, py, T, T);
          g.fillStyle(c.rock, 1).fillRoundedRect(px + 1, py + 1, T - 2, T - 2, 5);
        }
        if (tile === 'chest') {
          g.fillStyle(0xc8902a, 1).fillRect(px + 4, py + 7, T - 8, T - 11);
          g.lineStyle(2, 0xffd76a, 1).strokeRect(px + 4, py + 7, T - 8, T - 11);
        }
        if (tile === 'nest') {
          g.fillStyle(0xff4d4d, 0.35).fillCircle(px + T / 2, py + T / 2, T / 2);
          g.fillStyle(0xd8323a, 1).fillCircle(px + T / 2, py + T / 2, T / 4);
        }
      }
      // 層の境目に名前
      if (y > 0 && layer.id !== lastLayer && (r === 0 || digLayerAt(SAND_BOTTOM, y - 1).id !== layer.id || y === 1)) {
        this.root.add(this.add.rectangle(4, GRID_Y + r * T + 3, 64, 16, 0x000000, 0.55).setOrigin(0));
        this.root.add(addText(this, 8, GRID_Y + r * T + 11, layer.name, { size: 10, bold: true }).setOrigin(0, 0.5));
      }
      lastLayer = layer.id;
    }
    if (top === 0) {
      this.root.add(addText(this, digEntrance(SAND_BOTTOM) * T + T / 2, GRID_Y + 2, '入口', { size: 9, bold: true, color: '#ffd76a' }).setOrigin(0.5, 0));
    }
    // 自分
    const px = this.s.x * T + T / 2;
    const py = GRID_Y + (this.s.y - top) * T + T / 2;
    const id = ALLY_FACE.hero;
    if (id && hasImage(this, id)) this.root.add(faceImage(this, id, px, py, T / 2 - 1));
    else this.root.add(this.add.circle(px, py, T / 2 - 2, COLORS.ally));
    this.root.add(this.add.circle(px, py, T / 2 - 1).setStrokeStyle(2, 0xffffff));
    // 地面をタップ：その方へ1マス
    const hit = this.add.rectangle(0, GRID_Y, GAME_WIDTH, ROWS * T, 0xffffff, 0.001).setOrigin(0);
    this.root.add(hit);
    hit.setInteractive();
    hit.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.overlay) return;
      const dx = p.worldX - px;
      const dy = p.worldY - py;
      if (Math.abs(dx) < T / 2 && Math.abs(dy) < T / 2) return;
      const dir: DigDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      this.step(dir);
    });
  }

  private drawHud(): void {
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GRID_Y, 0x0b0f22).setOrigin(0));
    this.root.add(this.add.rectangle(0, GRID_Y - 2, GAME_WIDTH, 2, 0xffd76a, 0.4).setOrigin(0));
    const s = this.s;
    this.root.add(addText(this, 14, 12, '⏳', { size: 26 }));
    this.root.add(addText(this, 50, 12, `砂 ${s.sand}`, { size: 20, bold: true }));
    const bw = 150;
    this.root.add(this.add.rectangle(50, 44, bw, 10, 0x333333).setOrigin(0));
    const rate = Math.max(0, s.sand / SAND_BOTTOM.sand);
    this.root.add(this.add.rectangle(50, 44, bw * rate, 10, rate < 0.25 ? 0xff6a5a : 0xffd76a).setOrigin(0));
    const back = digBackCost(SAND_BOTTOM, s);
    const short = s.sand < back;
    this.root.add(addText(this, 50, 62, `帰り道に要る砂 ${back}${short ? '（足りない！）' : ''}`, { size: 11, bold: true, color: short ? '#ff8a7a' : '#ffd76a' }));
    this.root.add(addText(this, GAME_WIDTH - 14, 10, '深さ', { size: 10, bold: true, color: '#ffd76a' }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 24, `${s.y * SAND_BOTTOM_METERS_PER_ROW} m`, { size: 22, bold: true }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 54, s.y > 0 ? digLayerAt(SAND_BOTTOM, s.y).name : '地上', { size: 11, color: COLORS.subText }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 70, `いちばん深く ${s.deepest * SAND_BOTTOM_METERS_PER_ROW} m`, { size: 10, color: COLORS.subText }).setOrigin(1, 0));
  }

  private drawPanel(): void {
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, GAME_HEIGHT - PANEL_Y, 0x0b0f22).setOrigin(0));
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, 2, 0xffd76a, 0.4).setOrigin(0));
    const s = this.s;
    // かばん
    this.root.add(addText(this, 12, PANEL_Y + 12, `かばん\n${s.bag.length}/${SAND_BOTTOM.bagMax}`, { size: 10, bold: true }));
    for (let i = 0; i < SAND_BOTTOM.bagMax; i++) {
      const x = 58 + i * 32;
      this.root.add(this.add.rectangle(x, PANEL_Y + 12, 28, 28, 0x1d2440).setOrigin(0).setStrokeStyle(1, 0x3a4470));
      const id = s.bag[i];
      if (id) this.root.add(addText(this, x + 14, PANEL_Y + 26, rarityMark(id), { size: 14, bold: true, color: rarityMark(id) === '★' ? '#ffd76a' : rarityMark(id) === '◆' ? '#9fd0ff' : '#ffffff' }).setOrigin(0.5));
    }
    // 仲間の HP（潜っている間ずっと持ち越す）
    const party = currentParty(storyBattleLineup());
    const hp = party.map((c) => `${c.name} ${Math.round(run.dig?.vitals[c.id]?.hp ?? c.stats.hp)}/${c.stats.hp}`).join('　');
    this.root.add(addText(this, 12, PANEL_Y + 50, `HP　${hp}`, { size: 11, color: COLORS.subText, wrap: GAME_WIDTH - 24 }));
    if (this.message) this.root.add(addText(this, 12, PANEL_Y + 70, this.message, { size: 12, bold: true, color: '#ffe9a8', wrap: GAME_WIDTH - 24, ja: true }));
    const back = digBackCost(SAND_BOTTOM, s);
    addButton(this, this.root, GAME_WIDTH / 2, GAME_HEIGHT - 40, GAME_WIDTH - 32, 52, s.y === 0 ? '地上へ出る（持ち帰る）' : `上へ戻る（砂 −${back}）`, { onTap: () => this.goBack() }, { fill: 0xc21f4a, size: 16 });
  }

  private step(dir: DigDir): void {
    const r = stepDig(SAND_BOTTOM, this.s, dir);
    const e = r.event;
    if (e.type === 'chest') {
      this.showChest(e.cell);
      return;
    }
    if (e.type === 'nest') {
      this.showNest(e.cell, e.battle);
      return;
    }
    this.s = r.state;
    this.message =
      e.type === 'blocked'
        ? e.reason === 'rock'
          ? '岩だ。掘れない（ほかの道を探す）'
          : e.reason === 'sand'
            ? '砂時計の砂が足りない。上へ戻ろう'
            : ''
        : e.type === 'dig' && !e.through
          ? '固い土だ。もう一度掘る'
          : '';
    this.render();
  }

  /** 宝箱：中身を見せて、かばんに入れる。いっぱいなら、かばんの1つと入れ替えるか、持たない */
  private showChest(cell: number): void {
    const o = this.openOverlay();
    const items = this.s.chests[cell] ?? [];
    const room = SAND_BOTTOM.bagMax - this.s.bag.length;
    o.add(addText(this, GAME_WIDTH / 2, 150, '宝箱を見つけた', { size: 20, bold: true, color: '#ffd76a' }).setOrigin(0.5));
    items.forEach((id, i) => o.add(addText(this, GAME_WIDTH / 2, 190 + i * 24, `${rarityMark(id)} ${itemName(id)}`, { size: 16, bold: true }).setOrigin(0.5)));
    if (room >= items.length) {
      addButton(this, o, GAME_WIDTH / 2, 300, 240, 52, 'かばんに入れる', { onTap: () => this.take(cell) }, { fill: 0xc21f4a, size: 16 });
      return;
    }
    if (room > 0) addButton(this, o, GAME_WIDTH / 2, 290, 260, 48, `入るだけ入れる（あと${room}個）`, { onTap: () => this.take(cell) }, { fill: 0xc21f4a, size: 14 });
    o.add(addText(this, GAME_WIDTH / 2, 330, room > 0 ? '全部は入らない。入れ替えるなら、捨てる物を選ぶ' : 'かばんがいっぱい。入れ替えるなら、捨てる物を選ぶ', { size: 12, color: '#ff8a7a', bold: true }).setOrigin(0.5));
    const want = items[0];
    o.add(addText(this, GAME_WIDTH / 2, 352, `（${itemName(want)} と入れ替える）`, { size: 11, color: COLORS.subText }).setOrigin(0.5));
    this.s.bag.forEach((id, i) => {
      const y = 380 + i * 34;
      addButton(this, o, GAME_WIDTH / 2, y, 300, 30, `${rarityMark(id)} ${itemName(id)} を捨てる`, { onTap: () => this.swap(cell, i, want) }, { size: 12 });
    });
    addButton(this, o, GAME_WIDTH / 2, 380 + this.s.bag.length * 34 + 16, 200, 44, '今は持たない', { onTap: () => this.closeOverlay() }, { size: 14 });
  }

  private take(cell: number): void {
    this.s = takeChest(SAND_BOTTOM, this.s, cell).state;
    this.message = 'かばんに入れた';
    this.closeOverlay();
  }

  private swap(cell: number, bagIndex: number, item: string): void {
    const dropped = this.s.bag[bagIndex];
    this.s = swapChest(this.s, cell, bagIndex, item);
    this.message = `${itemName(dropped)} を捨てて、${itemName(item)} を入れた（捨てた物は宝箱に残る）`;
    this.closeOverlay();
  }

  /** 砂嵐の巣：戦うか、やめるか */
  private showNest(cell: number, battle: string): void {
    const o = this.openOverlay();
    o.add(addText(this, GAME_WIDTH / 2, 200, '砂嵐の巣だ', { size: 22, bold: true, color: '#ff8a7a' }).setOrigin(0.5));
    o.add(
      addText(this, GAME_WIDTH / 2, 240, `戦うと、砂時計の砂が ${SAND_BOTTOM.cost.battle} 減る。\nHP・MP は、潜っている間ずっと持ち越す。\n負けると地上へ戻され、かばんの半分を失う`, { size: 13, align: 'center', wrap: GAME_WIDTH - 60, ja: true }).setOrigin(0.5, 0),
    );
    addButton(this, o, GAME_WIDTH / 2, 380, 240, 52, '戦う', { onTap: () => this.fight(cell, battle) }, { fill: 0xc21f4a, size: 16 });
    addButton(this, o, GAME_WIDTH / 2, 444, 240, 44, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
  }

  private fight(cell: number, battle: string): void {
    const data = {
      encounter: { battle, win: { key: 'SandBottom', data: { won: cell } }, lose: { key: 'SandBottom', data: { lost: true } }, hunt: true, dig: true, seedShift: (run.dig?.count ?? 0) * 31 + cell },
    };
    // 敵の絵を読んでから戦闘へ
    this.cameras.main.flash(250, 255, 255, 255);
    waitImages(this, [...battleImages([battle]), ...commonImages()], () => this.scene.start('ChainBattle', data));
  }

  private goBack(): void {
    if (this.overlay) return;
    const back = digBackCost(SAND_BOTTOM, this.s);
    if (this.s.sand < back) {
      const o = this.openOverlay();
      o.add(addText(this, GAME_WIDTH / 2, 220, `帰り道に要る砂（${back}）が足りない。\n戻ると、かばんの半分を失う`, { size: 15, bold: true, align: 'center', color: '#ff8a7a' }).setOrigin(0.5));
      addButton(this, o, GAME_WIDTH / 2, 320, 240, 52, 'それでも戻る', { onTap: () => this.finishDive() }, { fill: 0xc21f4a, size: 15 });
      addButton(this, o, GAME_WIDTH / 2, 384, 240, 44, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
      return;
    }
    this.finishDive();
  }

  private finishDive(): void {
    this.closeOverlay();
    this.s = goHome(SAND_BOTTOM, this.s);
    this.render();
    this.showResult();
  }

  /** 帰った：持ち帰った物を受け取る */
  private showResult(): void {
    const s = this.s;
    const o = this.openOverlay(0.85);
    const title = s.outcome === 'home' ? '砂の底から帰った' : s.outcome === 'late' ? '砂が落ちきった……' : '砂嵐に負けて、戻された';
    o.add(addText(this, GAME_WIDTH / 2, 120, title, { size: 22, bold: true, color: s.outcome === 'home' ? '#ffffff' : '#ff8a7a' }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 156, `いちばん深く：${s.deepest * SAND_BOTTOM_METERS_PER_ROW} m${s.outcome !== 'home' ? '　かばんの半分は、砂に戻った' : ''}`, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    const counts = new Map<string, number>();
    for (const id of s.bag) counts.set(id, (counts.get(id) ?? 0) + 1);
    const lines = [...counts].map(([id, n]) => `${rarityMark(id)} ${itemName(id)}${n > 1 ? ` ×${n}` : ''}`);
    o.add(addText(this, GAME_WIDTH / 2, 196, lines.length ? lines.join('\n') : '（何も持ち帰れなかった）', { size: 15, bold: true, align: 'center' }).setOrigin(0.5, 0).setLineSpacing(6));
    addButton(this, o, GAME_WIDTH / 2, GAME_HEIGHT - 120, 260, 52, '受け取る', { onTap: () => this.receive() }, { fill: 0x2e5a3e, stroke: 0x6ad38a, strokeWidth: 2, size: 16 });
  }

  private receive(): void {
    const bag = this.s.bag;
    run.armory = addItems(run.armory, bag);
    run.library = recordLibraryFinds(run.library, { items: bag });
    run.dig = null;
    saveRun();
    this.scene.start(run.active ? 'Hub' : 'Title');
  }

  private openOverlay(alpha = 0.7): Phaser.GameObjects.Container {
    this.closeOverlay();
    const o = this.add.container(0, 0).setDepth(50);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, alpha).setOrigin(0).setInteractive());
    this.overlay = o;
    return o;
  }

  private closeOverlay(): void {
    const had = !!this.overlay;
    this.overlay?.destroy();
    this.overlay = undefined;
    if (had) this.render();
  }
}
