import Phaser from 'phaser';
import type { DigDir, DigEvent, DigState, DigTile } from '../core';
import { addItems, chapterOfEvent, isDigGuardRow, clearGuard, clearRoamer, createDig, digBackCost, digEntrance, digLayerAt, goHome, loseDig, recordLibraryFinds, stepDig, swapChest, takeChest } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { AREA_BATTLES, PARTY, SAND_BOTTOM_COLORS, SAND_BOTTOM_DEEPEST_VAR, SAND_BOTTOM_DIGGER_VAR, SAND_BOTTOM_DIGGERS, SAND_BOTTOM_METERS_PER_ROW, sandBottomFor, SLICE_FLOW, WEAPON_DATA, withDigger } from '../data';
import { battleImages, commonImages } from '../assets/screenImages';
import { waitImages } from '../ui/waitImages';
import { isSettled } from '../assets/loader';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import type { DigHeroSprite } from './digArt';
import { digArtId, DIG_CRACK_FRAME, DIG_SURFACE_FRAME, DIG_TILE, ensureDigHero, ensureDigRoamer, ensureDigTiles, isSolid, ROAMER_ANIM, ROAMER_TEXTURE, tileFrame } from './digArt';
import { currentParty, run, saveRun, setStoryVars, storyBattleLineup, storyLineup } from './run';

// 砂の底を掘る（段階207 試作1・段階208 試作2・段階209 本編の入口。docs/milestones/M3_sand_bottom.md）。横から見た地面を、1マスずつ掘り進む。
// 動かし方は、下の大きな十字のボタン（長押しで続けて進む）か、自分の上下左右のマス（枠が出る）をタップ。自分と砂嵐はマスの間をなめらかに動く。
// 砂時計の砂は掘る手数で減る（空洞を歩くのは減らない）。宝箱・鉱脈の素材はかばん（10個）へ。層の境目の番人と、動く砂嵐（空洞に稀に湧く）はいつもの戦闘。
// 「上へ戻る」で持ち帰る。潜っている途中はセーブしない（閉じたら潜る前から）
// 段階210（S2）：ブロック・宝箱・番人・砂嵐をコードで描いた絵にし、自分は二頭身のハルト（スコップで掘ってから歩いて進む。絵は digArt.ts）

export interface SandBottomData {
  /** 番人に勝って戻った（番人のマス） */
  wonGuard?: number;
  /** 動く砂嵐に勝って戻った（砂嵐の番号） */
  wonRoamer?: number;
  /** 戦闘に負けて戻った */
  lost?: boolean;
}

const T = DIG_TILE;
const COLS = 15;
const GRID_Y = 96;
const ROWS = 18;
const PANEL_Y = GRID_Y + ROWS * T;
/** 十字のボタン（段階209：大きく）。真ん中の位置と、1つの大きさ */
const PAD = { x: GAME_WIDTH - 118, y: PANEL_Y + 176, w: 72, h: 58, gap: 6 };
/** 1マス動くのにかける時間（ミリ秒）と、長押しで次へ進むまでの間 */
const MOVE_MS = 130;
const REPEAT_MS = 60;
/** 掘る時に、その場でスコップを振る時間（段階210。振り終わってから歩いて進む） */
const DIG_MS = 150;

/** 掘ったブロック（崩れる動きを出す） */
interface DigAnim {
  x: number;
  y: number;
  tile: DigTile;
  dir: DigDir;
}

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
  /** 掘る人の向き（左右。上下に動いても変えない） */
  private facing: 'left' | 'right' = 'right';
  private hero!: DigHeroSprite;

  constructor() {
    super('SandBottom');
  }

  private get s(): DigState {
    return run.dig!.state;
  }

  private set s(v: DigState) {
    run.dig = { ...run.dig!, state: v };
  }

  /** 掘る人の特徴を入れた砂の底（段階211） */
  private get def() {
    return withDigger(currentDef(), run.dig?.digger ?? 'hero');
  }

  /** 入った時の砂時計の砂（砂の棒の長さの元） */
  private get sandMax(): number {
    return run.dig?.max ?? this.def.sand;
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
    this.facing = 'right';
    ensureDigTiles(this);
    ensureDigRoamer(this);
    this.input.on('pointerup', () => this.release());
    if (!run.dig || run.dig.state.outcome !== 'diving') {
      // 潜る前に、掘る人を選ぶ（段階211）
      this.showPicker();
      return;
    }
    this.hero = ensureDigHero(this, run.dig.digger);
    if (data.wonGuard !== undefined) {
      this.s = clearGuard(this.def, this.s, data.wonGuard);
      this.message = `番人を倒した！ 下の層へ進める（砂時計 −${this.def.cost.battle}）`;
    }
    if (data.wonRoamer !== undefined) {
      this.s = clearRoamer(this.def, this.s, data.wonRoamer);
      this.message = `砂嵐を倒した！（砂時計 −${this.def.cost.battle}）`;
    }
    if (data.wonGuard !== undefined || data.wonRoamer !== undefined) this.healAfterWin();
    if (data.lost) {
      this.s = loseDig(this.def, this.s);
      run.dig = { ...run.dig!, vitals: {} };
    }
    this.render();
    if (this.s.outcome !== 'diving') this.showResult();
    this.waitDiggerArt();
  }

  /**
   * 掘る人の絵がまだ読めていなければ（デバッグの入口から入った時・裏の読み込みが間に合わない時）、ここで待って描き直す。
   * 待つ間は、読み込みの画面が上に出る（段階210。開発者の声：はじめに仮の絵が出た）。まだ届いていない人の絵は、待たずに仮の絵
   */
  private waitDiggerArt(): void {
    const who = run.dig?.digger ?? 'hero';
    const art = digArtId(who);
    if (isSettled(this, art)) return;
    waitImages(this, [art], () => {
      this.hero = ensureDigHero(this, who);
      if (!this.overlay) this.render();
    });
  }

  /** 今の章の仲間（掘る人に選べる人）。特徴のある人だけ */
  private diggers(): string[] {
    return storyLineup().members.filter((id) => SAND_BOTTOM_DIGGERS[id]);
  }

  /** 潜る前に「誰が掘る？」（段階211）。前に選んだ人が、はじめから選ばれている */
  private showPicker(): void {
    const o = this.openOverlay(0.92);
    const list = this.diggers();
    const last = run.vars[SAND_BOTTOM_DIGGER_VAR];
    const chosen = last && list.includes(last) ? last : list[0];
    o.add(addText(this, GAME_WIDTH / 2, 120, '誰が掘る？', { size: 22, bold: true, color: '#ffd76a' }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 152, '人によって掘り方の得手がある。戦うのは、いつもの並び', { size: 12, color: COLORS.subText }).setOrigin(0.5));
    list.forEach((id, i) => {
      const name = PARTY.find((c) => c.id === id)?.name ?? id;
      const y = 214 + i * 74;
      const mark = id === chosen ? '▶ ' : '';
      addButton(this, o, GAME_WIDTH / 2, y, 320, 62, `${mark}${name}\n${SAND_BOTTOM_DIGGERS[id].note}`, { onTap: () => this.startDive(id) }, id === chosen ? { fill: 0xc21f4a, size: 13 } : { size: 13 });
    });
    addButton(this, o, GAME_WIDTH / 2, 214 + list.length * 74 + 20, 200, 44, 'やめる', { onTap: () => this.scene.start(run.active ? 'Hub' : 'Title') }, { size: 14 });
  }

  /** 選んだ人で潜り始める */
  private startDive(digger: string): void {
    // 潜った回数はセーブに残す（シードをずらす。開き直しても同じ地面にならないように。乱数はシードから決まる）
    const count = Number(run.vars[DIVE_COUNT_VAR] ?? 0) + 1;
    setStoryVars({ ...run.vars, [DIVE_COUNT_VAR]: String(count), [SAND_BOTTOM_DIGGER_VAR]: digger });
    const def = currentDef();
    run.dig = { state: createDig(def, (run.seed + count * 7919) >>> 0), vitals: {}, count, max: def.sand, digger };
    this.hero = ensureDigHero(this, digger);
    this.message = '十字のボタン（長押しで続けて）か、まわりの枠をタップして掘る。空洞を歩くのは砂を使わない';
    this.closeOverlay();
    this.waitDiggerArt();
  }

  /** あかりが掘る時：砂嵐に勝つたびに、みんなの HP が戻る（段階211） */
  private healAfterWin(): void {
    const heal = SAND_BOTTOM_DIGGERS[run.dig?.digger ?? '']?.heal;
    if (!heal || !run.dig) return;
    const vitals = { ...run.dig.vitals };
    for (const c of currentParty(storyBattleLineup())) {
      const v = vitals[c.id];
      if (v) vitals[c.id] = { ...v, hp: Math.min(c.stats.hp, v.hp + Math.round(c.stats.hp * heal)) };
    }
    run.dig = { ...run.dig, vitals };
    this.message += `　あかりの手当てで、HP が ${Math.round(heal * 100)}% 戻った`;
  }

  /**
   * 描き直す。before を渡すと、自分と砂嵐を前の位置から今の位置へ動かす（見える範囲がずれる時は、地面ごとずらして戻す）。
   * dig を渡すと、先にその場でブロックを掘る動きを出す。動きにかかる時間（ミリ秒）を返す
   */
  private render(before?: DigState, dig?: DigAnim): number {
    this.tweens.killAll();
    this.root.removeAll(true);
    const ms = this.drawGrid(before, dig);
    this.drawHud();
    this.drawPanel();
    return ms;
  }

  /** 見える範囲の上の行（自分が上から7行目あたりに来るように） */
  private viewTopOf(s: DigState): number {
    return Phaser.Math.Clamp(s.y - 6, 0, Math.max(0, s.height - ROWS));
  }

  private drawGrid(before?: DigState, dig?: DigAnim): number {
    const s = this.s;
    const top = this.viewTopOf(s);
    // 地面と動く物は1つの入れ物に入れる（見える範囲がずれた時に、まとめてずらす）
    const layer = this.add.container(0, 0);
    this.root.add(layer);
    const tileAt = (x: number, y: number) => (x < 0 || x >= s.width || y < 1 || y >= s.height ? undefined : s.tiles[y * s.width + x]);
    const img = (f: { key: string; frame: string }, px: number, py: number) => this.add.image(px, py, f.key, f.frame).setOrigin(0).setScale(1 / RENDER_SCALE);
    // 境目の影（空洞の天井の下は暗く、土の上の面は明るい縁）
    const g = this.add.graphics();
    const labels: Phaser.GameObjects.Text[] = [];
    // 見える範囲の上下に1行ずつ余分に描く（ずらしている間の隙間を埋める）
    for (let r = -1; r <= ROWS && top + r < s.height; r++) {
      const y = top + r;
      if (y < 0) continue;
      const lay = digLayerAt(this.def, Math.max(1, y));
      for (let x = 0; x < COLS; x++) {
        const px = x * T;
        const py = GRID_Y + r * T;
        if (y === 0) {
          layer.add(img(DIG_SURFACE_FRAME, px, py));
          continue;
        }
        const tile = s.tiles[y * s.width + x];
        layer.add(img(tileFrame(lay.id, tile, x, y), px, py));
        const above = y === 1 ? 'air' : tileAt(x, y - 1);
        if (isSolid(tile)) {
          if (!isSolid(above)) g.fillStyle(0xffffff, 0.16).fillRect(px, py, T, 2);
          if (!isSolid(tileAt(x, y + 1)) && y + 1 < s.height) g.fillStyle(0x000000, 0.3).fillRect(px, py + T - 2, T, 2);
        } else {
          if (isSolid(above)) g.fillStyle(0x000000, 0.4).fillRect(px, py, T, 3).fillStyle(0x000000, 0.18).fillRect(px, py + 3, T, 4);
          if (isSolid(tileAt(x - 1, y))) g.fillStyle(0x000000, 0.22).fillRect(px, py, 3, T);
          if (isSolid(tileAt(x + 1, y))) g.fillStyle(0x000000, 0.22).fillRect(px + T - 3, py, 3, T);
        }
      }
      // 層の始まり（と見える範囲のいちばん上）に層の名前（段階212。帯の名前は出さない）
      const prevLay = y > 1 ? digLayerAt(this.def, y - 1) : undefined;
      if (r >= 0 && r < ROWS && y > 0 && (r === 0 || prevLay?.group !== lay.group)) {
        const t = addText(this, 8, GRID_Y + r * T + 11, lay.name, { size: 10, bold: true, color: '#ffd76a' }).setOrigin(0, 0.5);
        g.fillStyle(0x000000, 0.55).fillRoundedRect(4, GRID_Y + r * T + 3, t.width + 8, 16, 4);
        labels.push(t);
      }
    }
    layer.add(g);
    layer.add(labels);
    if (top === 0) layer.add(addText(this, digEntrance(this.def) * T + T / 2, GRID_Y + 2, '入口', { size: 9, bold: true, color: '#ffd76a' }).setOrigin(0.5, 0));
    const cellX = (x: number) => x * T + T / 2;
    const cellY = (y: number) => GRID_Y + (y - top) * T + T / 2;
    // 掘っている間（DIG_MS）はその場でスコップを振り、それから歩いて進む。砂嵐と見える範囲も、歩き出すのに合わせて動く
    const delay = dig ? DIG_MS : 0;
    const moved = !!before && (before.x !== s.x || before.y !== s.y);
    // 掘ったブロック：前の絵を揺らして崩し、かけらを飛ばす
    if (dig) {
      const lay = digLayerAt(this.def, Math.max(1, dig.y));
      const bx = cellX(dig.x);
      const by = cellY(dig.y);
      const f = tileFrame(lay.id, dig.tile, dig.x, dig.y);
      const block = this.add.container(bx, by);
      block.add(this.add.image(0, 0, f.key, f.frame).setScale(1 / RENDER_SCALE));
      block.add(this.add.image(0, 0, DIG_CRACK_FRAME.key, DIG_CRACK_FRAME.frame).setScale(1 / RENDER_SCALE).setAlpha(0));
      layer.add(block);
      const crack = block.list[1] as Phaser.GameObjects.Image;
      this.tweens.add({ targets: crack, alpha: 1, duration: DIG_MS * 0.5, delay: DIG_MS * 0.3 });
      this.tweens.add({ targets: block, x: bx + 1.5, duration: 30, yoyo: true, repeat: 2, delay: DIG_MS * 0.4 });
      this.tweens.add({ targets: block, scale: 0.5, alpha: 0, duration: 110, delay: DIG_MS });
      const color = SAND_BOTTOM_COLORS[lay.id];
      const chip = dig.tile === 'rock' ? color.rock : dig.tile === 'clay' ? color.clay : dig.tile === 'loose' ? color.loose : dig.tile === 'ore' || dig.tile === 'grain' ? 0xffd76a : color.sand;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const piece = this.add.rectangle(bx, by, 3, 3, chip).setAlpha(0);
        layer.add(piece);
        this.tweens.add({ targets: piece, alpha: { from: 1, to: 0 }, x: bx + Math.cos(a) * 12, y: by + Math.sin(a) * 8 + 8, angle: 180, duration: 320, delay: DIG_MS * 0.8, ease: 'Quad.easeOut' });
      }
    }
    // 動く砂嵐（渦巻く砂。追っている時は「！」）。前の位置からなめらかに
    for (const m of s.roamers) {
      if (m.y - top < -1 || m.y - top > ROWS) continue;
      const foe = this.add.container(cellX(m.x), cellY(m.y));
      foe.add(this.add.sprite(0, 0, ROAMER_TEXTURE, 'r0').setScale(1 / RENDER_SCALE).play(ROAMER_ANIM));
      if (m.chasing) foe.add(addText(this, 0, -T / 2 - 2, '！', { size: 14, bold: true, color: '#ff8a7a' }).setOrigin(0.5, 1));
      layer.add(foe);
      const was = before?.roamers.find((o) => o.id === m.id);
      if (before && was && (was.x !== m.x || was.y !== m.y)) {
        foe.setPosition(cellX(was.x), cellY(was.y));
        this.tweens.add({ targets: foe, x: cellX(m.x), y: cellY(m.y), duration: MOVE_MS, delay });
      } else if (before && !was) {
        // 湧いた砂嵐は、ふわっと出る
        foe.setScale(0.2).setAlpha(0);
        this.tweens.add({ targets: foe, scale: 1, alpha: 1, duration: MOVE_MS * 2, delay });
      }
    }
    // 自分（二頭身のハルト。右向きの絵を、左へ行く時は左右を返す）。足もとをマスの下の端に
    const hero = this.hero;
    const footY = (y: number) => cellY(y) + T / 2 - 1;
    const me = this.add.sprite(cellX(s.x), footY(s.y), hero.key, hero.idleFrame).setOrigin(hero.originX, hero.originY).setScale(hero.scale).setFlipX(this.facing === 'left');
    layer.add(me);
    if (dig) {
      me.setPosition(cellX(before?.x ?? s.x), footY(before?.y ?? s.y)).play(hero.anim(dig.dir === 'down' ? 'digDown' : dig.dir === 'up' ? 'climb' : 'digSide'));
      if (!moved) me.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => me.setFrame(hero.idleFrame));
    }
    if (before && moved) {
      me.setPosition(cellX(before.x), footY(before.y));
      this.tweens.add({
        targets: me,
        x: cellX(s.x),
        y: footY(s.y),
        duration: MOVE_MS,
        delay,
        onStart: () => me.play(hero.anim(s.y < before.y ? 'climb' : 'walk')),
        onComplete: () => me.stop().setFrame(hero.idleFrame),
      });
    }
    // 見える範囲がずれた時：地面ごと前の位置に置いて、今の位置へずらす
    if (before) {
      const was = this.viewTopOf(before);
      if (was !== top) {
        layer.y = (top - was) * T;
        this.tweens.add({ targets: layer, y: 0, duration: MOVE_MS, delay });
      }
    }
    // 動ける上下左右のマスに枠（タップで、そのマスへ）
    if (s.outcome === 'diving') {
      for (const dir of Object.keys(DIR_STEP) as DigDir[]) {
        const [dx, dy] = DIR_STEP[dir];
        const nx = s.x + dx;
        const ny = s.y + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= s.height || ny - top < 0 || ny - top >= ROWS) continue;
        if (s.tiles[ny * s.width + nx] === 'rock' && (this.def.rockCost === undefined || isDigGuardRow(this.def, ny))) continue;
        const frame = this.add.rectangle(nx * T + 1, GRID_Y + (ny - top) * T + 1, T - 2, T - 2, 0xffffff, 0.08).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.75);
        frame.setInteractive();
        frame.on('pointerup', () => this.tryStep(dir));
        this.root.add(frame);
      }
    }
    return delay + (moved ? MOVE_MS : 0);
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
    const back = digBackCost(this.def, s);
    const short = s.sand < back;
    this.root.add(addText(this, 50, 62, `帰り道に要る砂 ${back}${short ? '（足りない！）' : ''}`, { size: 11, bold: true, color: short ? '#ff8a7a' : '#ffd76a' }));
    const record = Number(run.vars[SAND_BOTTOM_DEEPEST_VAR] ?? 0);
    this.root.add(addText(this, GAME_WIDTH - 14, 10, '深さ', { size: 10, bold: true, color: '#ffd76a' }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 24, `${s.y * SAND_BOTTOM_METERS_PER_ROW} m`, { size: 22, bold: true }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 54, s.y > 0 ? digLayerAt(this.def, s.y).name : '地上', { size: 11, color: COLORS.subText }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - 14, 70, `今回 ${s.deepest * SAND_BOTTOM_METERS_PER_ROW} m・記録 ${record * SAND_BOTTOM_METERS_PER_ROW} m`, { size: 10, color: COLORS.subText }).setOrigin(1, 0));
  }

  private drawPanel(): void {
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, GAME_HEIGHT - PANEL_Y, 0x0b0f22).setOrigin(0));
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, 2, 0xffd76a, 0.4).setOrigin(0));
    const s = this.s;
    // かばん
    this.root.add(addText(this, 12, PANEL_Y + 10, `かばん\n${s.bag.length}/${this.def.bagMax}`, { size: 10, bold: true }));
    for (let i = 0; i < this.def.bagMax; i++) {
      const x = 58 + i * 32;
      this.root.add(this.add.rectangle(x, PANEL_Y + 10, 28, 28, 0x1d2440).setOrigin(0).setStrokeStyle(1, 0x3a4470));
      const id = s.bag[i];
      if (id) this.root.add(addText(this, x + 14, PANEL_Y + 24, rarityMark(id), { size: 14, bold: true, color: rarityMark(id) === '★' ? '#ffd76a' : rarityMark(id) === '◆' ? '#9fd0ff' : '#ffffff' }).setOrigin(0.5));
    }
    // 左の列：仲間の HP・知らせ・上へ戻る。右：十字のボタン
    const leftW = PAD.x - PAD.w * 1.5 - PAD.gap - 20;
    const party = currentParty(storyBattleLineup());
    const hp = party.map((c) => `${c.name} ${Math.round(run.dig?.vitals[c.id]?.hp ?? c.stats.hp)}/${c.stats.hp}`).join('\n');
    // 掘る人と特徴（段階211）
    const digger = run.dig?.digger ?? 'hero';
    const diggerName = PARTY.find((c) => c.id === digger)?.name ?? digger;
    this.root.add(addText(this, 12, PANEL_Y + 46, `掘る人：${diggerName}（${SAND_BOTTOM_DIGGERS[digger]?.note ?? ''}）`, { size: 10, bold: true, color: '#9fd0ff', wrap: GAME_WIDTH - 24, ja: true }));
    const hpY = PANEL_Y + 66;
    this.root.add(addText(this, 12, hpY, hp, { size: 11, color: COLORS.subText }).setLineSpacing(2));
    if (this.message) this.root.add(addText(this, 12, hpY + 4 + party.length * 15, this.message, { size: 11, bold: true, color: '#ffe9a8', wrap: leftW, ja: true }));
    this.drawPad(s.outcome === 'diving');
    const back = digBackCost(this.def, s);
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
    const ms = this.step(dir);
    if (!this.moving) return;
    this.time.delayedCall(ms + REPEAT_MS, () => (this.moving = false));
  }

  update(): void {
    if (this.held && !this.moving && !this.overlay) this.tryStep(this.held);
  }

  /** 1手進める。動きにかかる時間（ミリ秒）を返す（動かない時は 0） */
  private step(dir: DigDir): number {
    const before = this.s;
    if (dir === 'left' || dir === 'right') this.facing = dir;
    const r = stepDig(this.def, before, dir);
    const e = r.event;
    if (e.type === 'chest') {
      this.release();
      this.render();
      this.showChest(e.cell);
      return 0;
    }
    if (e.type === 'guard') {
      this.release();
      this.render();
      this.showFoe('guard', e.cell, e.battle, false);
      return 0;
    }
    // 掘ったか（行き先のブロックが、この手で変わった）
    const [dx, dy] = DIR_STEP[dir];
    const tx = before.x + dx;
    const ty = before.y + dy;
    const cell = ty * before.width + tx;
    const was = before.tiles[cell];
    const dig: DigAnim | undefined = r.state !== before && isSolid(was) && r.state.tiles[cell] !== was ? { x: tx, y: ty, tile: was, dir } : undefined;
    if (e.type === 'roamer') {
      this.release();
      // 自分から入った時は戻れる。追いつかれた時（動いた後）は戦うしかない
      const caught = r.state !== before;
      this.s = r.state;
      const ms = this.render(before, dig);
      this.moving = true;
      this.time.delayedCall(ms + 40, () => {
        this.moving = false;
        this.showFoe('roamer', e.id, e.battle, caught);
      });
      return ms + 40;
    }
    this.s = r.state;
    this.message = this.eventText(e);
    if (e.type === 'blocked') {
      this.release();
      this.render();
      return 0;
    }
    this.moving = true;
    return this.render(before, dig);
  }

  private eventText(e: DigEvent): string {
    if (e.type === 'blocked') return e.reason === 'rock' ? (this.def.rockCost !== undefined ? '層の境目の岩は割れない。番人の所から下りる' : '岩だ。掘れない（ほかの道を探す）') : e.reason === 'sand' ? '砂時計の砂が足りない。上へ戻ろう' : '';
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
    const room = this.def.bagMax - this.s.bag.length;
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
    this.s = takeChest(this.def, this.s, cell).state;
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
    // 段階212：番人は稀に、その層の章のぬし
    const lord = kind === 'guard' && !!AREA_BATTLES[battle]?.boss;
    const title = lord ? `${AREA_BATTLES[battle].name}が、番人として現れた！` : kind === 'guard' ? '層の番人だ' : forced ? '砂嵐に追いつかれた！' : '砂嵐だ';
    const note = kind === 'guard' ? 'この番人を倒さないと、下へは行けない。\n' : '';
    o.add(addText(this, GAME_WIDTH / 2, 200, title, { size: 22, bold: true, color: '#ff8a7a' }).setOrigin(0.5));
    o.add(
      addText(this, GAME_WIDTH / 2, 240, `${note}戦うと、砂時計の砂が ${this.def.cost.battle} 減る。\nHP・MP は、潜っている間ずっと持ち越す。\n負けると地上へ戻され、かばんの半分を失う`, { size: 13, align: 'center', wrap: GAME_WIDTH - 60, ja: true }).setOrigin(0.5, 0),
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
    const back = digBackCost(this.def, this.s);
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
    this.s = goHome(this.def, this.s);
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
