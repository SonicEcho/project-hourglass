import Phaser from 'phaser';
import type { DigDir, DigEvent, DigState } from '../core';
import { addItems, chapterOfEvent, clearGuard, clearRoamer, createDig, digBackCost, digEntrance, digLayerAt, goHome, loseDig, recordLibraryFinds, stepDig, swapChest, takeChest } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ALLY_FACE, FACE_CROP, FACE_CROPS, SAND_BOTTOM, SAND_BOTTOM_COLORS, SAND_BOTTOM_DEEPEST_VAR, SAND_BOTTOM_METERS_PER_ROW, sandBottomFor, SLICE_FLOW, WEAPON_DATA } from '../data';
import { faceTexture } from '../ui/portrait';
import { hasImage } from '../assets/loader';
import { battleImages, commonImages } from '../assets/screenImages';
import { waitImages } from '../ui/waitImages';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { currentParty, run, saveRun, setStoryVars, storyBattleLineup } from './run';

// 砂の底を掘る（段階207 試作1・段階208 試作2・段階209 本編の入口。docs/milestones/M3_sand_bottom.md）。横から見た地面を、1マスずつ掘り進む。
// 動かし方は、下の大きな十字のボタン（長押しで続けて進む）か、自分の上下左右のマス（枠が出る）をタップ。自分と砂嵐はマスの間をなめらかに動く。
// 砂時計の砂は掘る手数で減る（空洞を歩くのは減らない）。宝箱・鉱脈の素材はかばん（10個）へ。層の境目の番人と、動く砂嵐（空洞に稀に湧く）はいつもの戦闘。
// 「上へ戻る」で持ち帰る。試作なので絵は色の四角。潜っている途中はセーブしない（閉じたら潜る前から）

export interface SandBottomData {
  /** 番人に勝って戻った（番人のマス） */
  wonGuard?: number;
  /** 動く砂嵐に勝って戻った（砂嵐の番号） */
  wonRoamer?: number;
  /** 戦闘に負けて戻った */
  lost?: boolean;
}

const T = 26;
const COLS = 15;
const GRID_Y = 96;
const ROWS = 18;
const PANEL_Y = GRID_Y + ROWS * T;
/** 十字のボタン（段階209：大きく）。真ん中の位置と、1つの大きさ */
const PAD = { x: GAME_WIDTH - 118, y: PANEL_Y + 176, w: 72, h: 58, gap: 6 };
/** 1マス動くのにかける時間（ミリ秒）と、長押しで次へ進むまでの間 */
const MOVE_MS = 130;
const REPEAT_MS = 60;

/** 潜った回数を覚える、物語で覚えた値の名前（段階209） */
const DIVE_COUNT_VAR = 'dig:count';

const itemName = (id: string) => WEAPON_DATA.items[id]?.name ?? id;
const rarityMark = (id: string) => {
  const r = WEAPON_DATA.items[id]?.rarity;
  return r === 'rare' ? '★' : r === 'uncommon' ? '◆' : '・';
};
const DIR_STEP: Record<DigDir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** 今の章の砂の底（砂時計の砂が章で変わる） */
function currentDef() {
  return sandBottomFor(chapterOfEvent(SLICE_FLOW, run.event)?.id);
}

export class SandBottomScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private message = '';
  /** なめらかに動いている間（次の手を受け付けない） */
  private moving = false;
  /** 長押ししている向き */
  private held: DigDir | null = null;
  private holdTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('SandBottom');
  }

  private get s(): DigState {
    return run.dig!.state;
  }

  private set s(v: DigState) {
    run.dig = { ...run.dig!, state: v };
  }

  /** 入った時の砂時計の砂（砂の棒の長さの元） */
  private get sandMax(): number {
    return run.dig?.max ?? SAND_BOTTOM.sand;
  }

  create(data: SandBottomData = {}): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f22).setOrigin(0);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.message = '';
    this.moving = false;
    this.held = null;
    this.holdTimer = undefined;
    this.input.on('pointerup', () => this.release());
    if (!run.dig || run.dig.state.outcome !== 'diving') {
      // 潜った回数はセーブに残す（シードをずらす。開き直しても同じ地面にならないように。乱数はシードから決まる）
      const count = Number(run.vars[DIVE_COUNT_VAR] ?? 0) + 1;
      setStoryVars({ ...run.vars, [DIVE_COUNT_VAR]: String(count) });
      const def = currentDef();
      run.dig = { state: createDig(def, (run.seed + count * 7919) >>> 0), vitals: {}, count, max: def.sand };
      this.message = '十字のボタン（長押しで続けて）か、まわりの枠をタップして掘る。空洞を歩くのは砂を使わない';
    }
    if (data.wonGuard !== undefined) {
      this.s = clearGuard(SAND_BOTTOM, this.s, data.wonGuard);
      this.message = `番人を倒した！ 下の層へ進める（砂時計 −${SAND_BOTTOM.cost.battle}）`;
    }
    if (data.wonRoamer !== undefined) {
      this.s = clearRoamer(SAND_BOTTOM, this.s, data.wonRoamer);
      this.message = `砂嵐を倒した！（砂時計 −${SAND_BOTTOM.cost.battle}）`;
    }
    if (data.lost) {
      this.s = loseDig(SAND_BOTTOM, this.s);
      run.dig = { ...run.dig!, vitals: {} };
    }
    this.render();
    if (this.s.outcome !== 'diving') this.showResult();
  }

  /** 描き直す。before を渡すと、自分と砂嵐を前の位置から今の位置へ動かす（見える範囲がずれる時は、地面ごとずらして戻す） */
  private render(before?: DigState): void {
    this.root.removeAll(true);
    this.drawGrid(before);
    this.drawHud();
    this.drawPanel();
  }

  /** 見える範囲の上の行（自分が上から7行目あたりに来るように） */
  private viewTopOf(s: DigState): number {
    return Phaser.Math.Clamp(s.y - 6, 0, Math.max(0, s.height - ROWS));
  }

  private drawGrid(before?: DigState): void {
    const s = this.s;
    const top = this.viewTopOf(s);
    // 地面と動く物は1つの入れ物に入れる（見える範囲がずれた時に、まとめてずらす）
    const layer = this.add.container(0, 0);
    this.root.add(layer);
    const g = this.add.graphics();
    layer.add(g);
    // 見える範囲の上下に1行ずつ余分に描く（ずらしている間の隙間を埋める）
    for (let r = -1; r <= ROWS && top + r < s.height; r++) {
      const y = top + r;
      if (y < 0) continue;
      const lay = digLayerAt(SAND_BOTTOM, Math.max(1, y));
      const c = SAND_BOTTOM_COLORS[lay.id];
      for (let x = 0; x < COLS; x++) {
        const tile = s.tiles[y * s.width + x];
        const px = x * T;
        const py = GRID_Y + r * T;
        if (y === 0) {
          g.fillStyle(0x2a3a5a, 1).fillRect(px, py, T, T);
          continue;
        }
        const base = tile === 'clay' ? c.clay : tile === 'loose' ? c.loose : tile === 'sand' || tile === 'ore' || tile === 'grain' ? c.sand : c.air;
        g.fillStyle(base, 1).fillRect(px, py, T, T);
        if (tile === 'sand' || tile === 'clay' || tile === 'ore' || tile === 'grain') g.lineStyle(1, 0x000000, 0.18).strokeRect(px, py, T, T);
        if (tile === 'loose') {
          g.fillStyle(0x000000, 0.22);
          for (const [ox, oy] of [[5, 6], [15, 4], [10, 12], [20, 14], [6, 19], [17, 21]]) g.fillCircle(px + ox, py + oy, 1.4);
        }
        if (tile === 'ore') {
          g.lineStyle(3, 0xffd76a, 0.95).lineBetween(px + 4, py + 20, px + 12, py + 9).lineBetween(px + 12, py + 9, px + 22, py + 6);
          g.lineStyle(2, 0xfff2b8, 0.9).lineBetween(px + 9, py + 23, px + 18, py + 16);
        }
        if (tile === 'grain') {
          g.fillStyle(0xfff2b8, 0.35).fillCircle(px + T / 2, py + T / 2, 10);
          g.fillStyle(0xffe08a, 1).fillCircle(px + T / 2, py + T / 2, 5);
        }
        if (tile === 'rock') g.fillStyle(c.rock, 1).fillRoundedRect(px + 1, py + 1, T - 2, T - 2, 5);
        if (tile === 'chest') {
          g.fillStyle(0xc8902a, 1).fillRect(px + 4, py + 7, T - 8, T - 11);
          g.lineStyle(2, 0xffd76a, 1).strokeRect(px + 4, py + 7, T - 8, T - 11);
        }
        if (tile === 'guard') {
          g.fillStyle(0x6a0f1a, 1).fillRect(px, py, T, T);
          g.fillStyle(0xff4d4d, 1).fillCircle(px + T / 2, py + T / 2, T / 2 - 3);
          layer.add(addText(this, px + T / 2, py + T / 2, '番', { size: 13, bold: true, color: '#ffffff' }).setOrigin(0.5));
        }
      }
      if (r >= 0 && r < ROWS && y > 0 && (r === 0 || digLayerAt(SAND_BOTTOM, y - 1).id !== lay.id || y === 1)) {
        layer.add(this.add.rectangle(4, GRID_Y + r * T + 3, 64, 16, 0x000000, 0.55).setOrigin(0));
        layer.add(addText(this, 8, GRID_Y + r * T + 11, lay.name, { size: 10, bold: true }).setOrigin(0, 0.5));
      }
    }
    if (top === 0) layer.add(addText(this, digEntrance(SAND_BOTTOM) * T + T / 2, GRID_Y + 2, '入口', { size: 9, bold: true, color: '#ffd76a' }).setOrigin(0.5, 0));
    const cellX = (x: number) => x * T + T / 2;
    const cellY = (y: number) => GRID_Y + (y - top) * T + T / 2;
    // 動く砂嵐（追っている時は「！」）。前の位置からなめらかに
    for (const m of s.roamers) {
      if (m.y - top < -1 || m.y - top > ROWS) continue;
      const foe = this.add.container(cellX(m.x), cellY(m.y));
      foe.add(this.add.circle(0, 0, T / 2, 0xff4d4d, 0.3));
      foe.add(this.add.circle(0, 0, T / 2 - 4, 0xd8323a));
      foe.add(this.add.circle(-4, -2, 2, 0x200000));
      foe.add(this.add.circle(4, -2, 2, 0x200000));
      if (m.chasing) foe.add(addText(this, 0, -T / 2 - 2, '！', { size: 14, bold: true, color: '#ff8a7a' }).setOrigin(0.5, 1));
      layer.add(foe);
      const was = before?.roamers.find((o) => o.id === m.id);
      if (before && was && (was.x !== m.x || was.y !== m.y)) {
        foe.setPosition(cellX(was.x), cellY(was.y));
        this.tweens.add({ targets: foe, x: cellX(m.x), y: cellY(m.y), duration: MOVE_MS });
      } else if (before && !was) {
        // 湧いた砂嵐は、ふわっと出る
        foe.setScale(0.2).setAlpha(0);
        this.tweens.add({ targets: foe, scale: 1, alpha: 1, duration: MOVE_MS * 2 });
      }
    }
    // 自分
    const me = this.add.container(cellX(s.x), cellY(s.y));
    const id = ALLY_FACE.hero;
    const faceKey = id && hasImage(this, id) ? faceTexture(this, id, FACE_CROPS.hero ?? FACE_CROP, T - 2) : '';
    if (faceKey) me.add(this.add.image(0, 0, faceKey).setDisplaySize(T - 2, T - 2));
    else me.add(this.add.circle(0, 0, T / 2 - 2, COLORS.ally));
    me.add(this.add.circle(0, 0, T / 2 - 1).setStrokeStyle(2, 0xffffff));
    layer.add(me);
    if (before && (before.x !== s.x || before.y !== s.y)) {
      me.setPosition(cellX(before.x), cellY(before.y));
      this.tweens.add({ targets: me, x: cellX(s.x), y: cellY(s.y), duration: MOVE_MS });
    }
    // 見える範囲がずれた時：地面ごと前の位置に置いて、今の位置へずらす
    if (before) {
      const was = this.viewTopOf(before);
      if (was !== top) {
        layer.y = (top - was) * T;
        this.tweens.add({ targets: layer, y: 0, duration: MOVE_MS });
      }
    }
    // 動ける上下左右のマスに枠（タップで、そのマスへ）
    if (s.outcome === 'diving') {
      for (const dir of Object.keys(DIR_STEP) as DigDir[]) {
        const [dx, dy] = DIR_STEP[dir];
        const nx = s.x + dx;
        const ny = s.y + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= s.height || ny - top < 0 || ny - top >= ROWS) continue;
        if (s.tiles[ny * s.width + nx] === 'rock') continue;
        const frame = this.add.rectangle(nx * T + 1, GRID_Y + (ny - top) * T + 1, T - 2, T - 2, 0xffffff, 0.08).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.75);
        frame.setInteractive();
        frame.on('pointerup', () => this.tryStep(dir));
        this.root.add(frame);
      }
    }
  }

  private drawHud(): void {
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GRID_Y, 0x0b0f22).setOrigin(0));
    this.root.add(this.add.rectangle(0, GRID_Y - 2, GAME_WIDTH, 2, 0xffd76a, 0.4).setOrigin(0));
    const s = this.s;
    this.root.add(addText(this, 14, 12, '⏳', { size: 26 }));
    this.root.add(addText(this, 50, 12, `砂 ${s.sand}`, { size: 20, bold: true }));
    const bw = 150;
    this.root.add(this.add.rectangle(50, 44, bw, 10, 0x333333).setOrigin(0));
    const rate = Phaser.Math.Clamp(s.sand / this.sandMax, 0, 1);
    this.root.add(this.add.rectangle(50, 44, bw * rate, 10, rate < 0.25 ? 0xff6a5a : 0xffd76a).setOrigin(0));
    const back = digBackCost(SAND_BOTTOM, s);
    const short = s.sand < back;
    this.root.add(addText(this, 50, 62, `帰り道に要る砂 ${back}${short ? '（足りない！）' : ''}`, { size: 11, bold: true, color: short ? '#ff8a7a' : '#ffd76a' }));
    const record = Number(run.vars[SAND_BOTTOM_DEEPEST_VAR] ?? 0);
    this.root.add(addText(this, GAME_WIDTH - 14, 10, '深さ', { size: 10, bold: true, color: '#ffd76a' }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 24, `${s.y * SAND_BOTTOM_METERS_PER_ROW} m`, { size: 22, bold: true }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 54, s.y > 0 ? digLayerAt(SAND_BOTTOM, s.y).name : '地上', { size: 11, color: COLORS.subText }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 70, `今回 ${s.deepest * SAND_BOTTOM_METERS_PER_ROW} m・記録 ${record * SAND_BOTTOM_METERS_PER_ROW} m`, { size: 10, color: COLORS.subText }).setOrigin(1, 0));
  }

  private drawPanel(): void {
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, GAME_HEIGHT - PANEL_Y, 0x0b0f22).setOrigin(0));
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, 2, 0xffd76a, 0.4).setOrigin(0));
    const s = this.s;
    // かばん
    this.root.add(addText(this, 12, PANEL_Y + 10, `かばん\n${s.bag.length}/${SAND_BOTTOM.bagMax}`, { size: 10, bold: true }));
    for (let i = 0; i < SAND_BOTTOM.bagMax; i++) {
      const x = 58 + i * 32;
      this.root.add(this.add.rectangle(x, PANEL_Y + 10, 28, 28, 0x1d2440).setOrigin(0).setStrokeStyle(1, 0x3a4470));
      const id = s.bag[i];
      if (id) this.root.add(addText(this, x + 14, PANEL_Y + 24, rarityMark(id), { size: 14, bold: true, color: rarityMark(id) === '★' ? '#ffd76a' : rarityMark(id) === '◆' ? '#9fd0ff' : '#ffffff' }).setOrigin(0.5));
    }
    // 左の列：仲間の HP・知らせ・上へ戻る。右：十字のボタン
    const leftW = PAD.x - PAD.w * 1.5 - PAD.gap - 20;
    const party = currentParty(storyBattleLineup());
    const hp = party.map((c) => `${c.name} ${Math.round(run.dig?.vitals[c.id]?.hp ?? c.stats.hp)}/${c.stats.hp}`).join('\n');
    this.root.add(addText(this, 12, PANEL_Y + 48, hp, { size: 11, color: COLORS.subText }).setLineSpacing(2));
    if (this.message) this.root.add(addText(this, 12, PANEL_Y + 52 + party.length * 15, this.message, { size: 11, bold: true, color: '#ffe9a8', wrap: leftW, ja: true }));
    this.drawPad(s.outcome === 'diving');
    const back = digBackCost(SAND_BOTTOM, s);
    addButton(this, this.root, 12 + leftW / 2, GAME_HEIGHT - 36, leftW, 50, s.y === 0 ? '地上へ出る\n（持ち帰る）' : `上へ戻る\n（砂 −${back}）`, { onTap: () => this.goBack() }, { fill: 0xc21f4a, size: 13 });
  }

  /** 大きな十字のボタン（段階209）。押すと1マス、押したままだと続けて進む */
  private drawPad(enabled: boolean): void {
    const pads: [DigDir, number, number, string][] = [
      ['up', 0, -1, '▲'],
      ['left', -1, 0, '◀'],
      ['right', 1, 0, '▶'],
      ['down', 0, 1, '▼'],
    ];
    for (const [dir, ox, oy, label] of pads) {
      const x = PAD.x + ox * (PAD.w + PAD.gap);
      const y = PAD.y + oy * (PAD.h + PAD.gap);
      const pressed = this.held === dir;
      const rect = this.add.rectangle(x, y, PAD.w, PAD.h, pressed ? 0x4a5a8a : 0x2b3350, enabled ? 1 : 0.4).setRounded(10).setStrokeStyle(2, 0x6a7ab0, enabled ? 1 : 0.4);
      this.root.add(rect);
      this.root.add(addText(this, x, y, label, { size: 24, bold: true, color: enabled ? '#ffffff' : '#667' }).setOrigin(0.5));
      if (!enabled) continue;
      rect.setInteractive();
      rect.on('pointerdown', () => this.press(dir));
    }
  }

  private press(dir: DigDir): void {
    if (this.overlay) return;
    this.held = dir;
    this.holdTimer?.remove();
    this.tryStep(dir);
  }

  private release(): void {
    this.held = null;
    this.holdTimer?.remove();
    this.holdTimer = undefined;
  }

  /** 動いている間は受け付けない（動き終わったら moving を戻す。押したままなら update が次へ進める） */
  private tryStep(dir: DigDir): void {
    if (this.overlay || this.moving || this.s.outcome !== 'diving') return;
    this.step(dir);
    if (!this.moving) return;
    this.time.delayedCall(MOVE_MS + REPEAT_MS, () => (this.moving = false));
  }

  update(): void {
    if (this.held && !this.moving && !this.overlay) this.tryStep(this.held);
  }

  private step(dir: DigDir): void {
    const before = this.s;
    const r = stepDig(SAND_BOTTOM, before, dir);
    const e = r.event;
    if (e.type === 'chest') {
      this.release();
      this.showChest(e.cell);
      return;
    }
    if (e.type === 'guard') {
      this.release();
      this.showFoe('guard', e.cell, e.battle, false);
      return;
    }
    if (e.type === 'roamer') {
      this.release();
      // 自分から入った時は戻れる。追いつかれた時（動いた後）は戦うしかない
      const caught = r.state !== before;
      this.s = r.state;
      this.render(before);
      this.moving = true;
      this.time.delayedCall(MOVE_MS + 40, () => {
        this.moving = false;
        this.showFoe('roamer', e.id, e.battle, caught);
      });
      return;
    }
    this.s = r.state;
    this.message = this.eventText(e);
    if (e.type === 'blocked') {
      this.release();
      this.render();
      return;
    }
    this.moving = true;
    this.render(before);
  }

  private eventText(e: DigEvent): string {
    if (e.type === 'blocked') return e.reason === 'rock' ? '岩だ。掘れない（ほかの道を探す）' : e.reason === 'sand' ? '砂時計の砂が足りない。上へ戻ろう' : '';
    if (e.type === 'dig' && !e.through) return '固い土だ。もう一度掘る';
    if (e.type === 'ore') return e.item ? (e.kept ? `鉱脈から ${itemName(e.item)} を掘り出した` : `かばんがいっぱいで、${itemName(e.item)} は砂に戻った`) : '鉱脈は空だった';
    if (e.type === 'grain') return `砂時計の砂粒！ 砂 +${e.sand}`;
    const chasing = this.s.roamers.some((m) => m.chasing);
    return chasing ? '砂嵐がこちらに気づいた！' : '';
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

  /** 番人・砂嵐：戦うか、やめるか（追いつかれた時は戦うしかない） */
  private showFoe(kind: 'guard' | 'roamer', ref: number, battle: string, forced: boolean): void {
    const o = this.openOverlay();
    const title = kind === 'guard' ? '層の番人だ' : forced ? '砂嵐に追いつかれた！' : '砂嵐だ';
    const note = kind === 'guard' ? 'この番人を倒さないと、下の層へは行けない。\n' : '';
    o.add(addText(this, GAME_WIDTH / 2, 200, title, { size: 22, bold: true, color: '#ff8a7a' }).setOrigin(0.5));
    o.add(
      addText(this, GAME_WIDTH / 2, 240, `${note}戦うと、砂時計の砂が ${SAND_BOTTOM.cost.battle} 減る。\nHP・MP は、潜っている間ずっと持ち越す。\n負けると地上へ戻され、かばんの半分を失う`, { size: 13, align: 'center', wrap: GAME_WIDTH - 60, ja: true }).setOrigin(0.5, 0),
    );
    addButton(this, o, GAME_WIDTH / 2, 400, 240, 52, '戦う', { onTap: () => this.fight(kind, ref, battle) }, { fill: 0xc21f4a, size: 16 });
    if (!forced) addButton(this, o, GAME_WIDTH / 2, 464, 240, 44, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
  }

  private fight(kind: 'guard' | 'roamer', ref: number, battle: string): void {
    const won = kind === 'guard' ? { wonGuard: ref } : { wonRoamer: ref };
    const data = {
      encounter: { battle, win: { key: 'SandBottom', data: won }, lose: { key: 'SandBottom', data: { lost: true } }, hunt: true, dig: true, seedShift: (run.dig?.count ?? 0) * 31 + this.s.steps },
    };
    // 敵の絵を読んでから戦闘へ
    this.cameras.main.flash(250, 255, 255, 255);
    waitImages(this, [...battleImages([battle]), ...commonImages()], () => this.scene.start('ChainBattle', data));
  }

  private goBack(): void {
    if (this.overlay || this.moving) return;
    this.release();
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

  /** 帰った：持ち帰った物を受け取る。いちばん深い記録を超えたら「新記録」 */
  private showResult(): void {
    const s = this.s;
    const o = this.openOverlay(0.85);
    const record = Number(run.vars[SAND_BOTTOM_DEEPEST_VAR] ?? 0);
    const newRecord = s.deepest > record;
    const title = s.outcome === 'home' ? '砂の底から帰った' : s.outcome === 'late' ? '砂が落ちきった……' : '砂嵐に負けて、戻された';
    o.add(addText(this, GAME_WIDTH / 2, 120, title, { size: 22, bold: true, color: s.outcome === 'home' ? '#ffffff' : '#ff8a7a' }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 156, `いちばん深く：${s.deepest * SAND_BOTTOM_METERS_PER_ROW} m${newRecord ? '（新記録！）' : `（記録 ${record * SAND_BOTTOM_METERS_PER_ROW} m）`}`, { size: 13, bold: newRecord, color: newRecord ? '#ffd76a' : COLORS.subText }).setOrigin(0.5));
    if (s.outcome !== 'home') o.add(addText(this, GAME_WIDTH / 2, 176, 'かばんの半分は、砂に戻った', { size: 12, color: '#ff8a7a' }).setOrigin(0.5));
    const counts = new Map<string, number>();
    for (const id of s.bag) counts.set(id, (counts.get(id) ?? 0) + 1);
    const lines = [...counts].map(([id, n]) => `${rarityMark(id)} ${itemName(id)}${n > 1 ? ` ×${n}` : ''}`);
    o.add(addText(this, GAME_WIDTH / 2, 206, lines.length ? lines.join('\n') : '（何も持ち帰れなかった）', { size: 15, bold: true, align: 'center' }).setOrigin(0.5, 0).setLineSpacing(6));
    addButton(this, o, GAME_WIDTH / 2, GAME_HEIGHT - 120, 260, 52, '受け取る', { onTap: () => this.receive() }, { fill: 0x2e5a3e, stroke: 0x6ad38a, strokeWidth: 2, size: 16 });
  }

  private receive(): void {
    const s = this.s;
    run.armory = addItems(run.armory, s.bag);
    run.library = recordLibraryFinds(run.library, { items: s.bag });
    const record = Number(run.vars[SAND_BOTTOM_DEEPEST_VAR] ?? 0);
    run.dig = null;
    // いちばん深い記録をセーブに残す（段階209）
    if (s.deepest > record) setStoryVars({ ...run.vars, [SAND_BOTTOM_DEEPEST_VAR]: String(s.deepest) });
    saveRun();
    this.scene.start(run.active ? 'Hub' : 'Title');
  }

  private openOverlay(alpha = 0.7): Phaser.GameObjects.Container {
    this.closeOverlay(false);
    const o = this.add.container(0, 0).setDepth(50);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, alpha).setOrigin(0).setInteractive());
    this.overlay = o;
    return o;
  }

  private closeOverlay(redraw = true): void {
    const had = !!this.overlay;
    this.overlay?.destroy();
    this.overlay = undefined;
    if (had && redraw) this.render();
  }
}
