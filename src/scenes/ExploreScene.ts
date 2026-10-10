import Phaser from 'phaser';
import type { AreaDef, AreaTrigger, ExploreState, GridCell, GridMap } from '../core';
import {
  exploreTipTriggers,
  addItems,
  addKoma,
  areaGrid,
  arrive,
  bossReady,
  chestAt,
  defeatEnemy,
  enemyActive,
  findPath,
  isCheckpoint,
  komaLeft,
  komaVars,
  loseBattle,
  markTrigger,
  nearestWalkable,
  openChest,
  patrolRoute,
  pendingTrigger,
  startExplore,
  usableLinks,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { hasImage } from '../assets/loader';
import { playBgm, playSe, stopAmbience } from '../audio/sound';
import { AREA_BATTLES, AREA_ENEMY_STEP_MS, AREA_GRACE_MS, AREA_STEP_MS, AREA_TILE, AREAS, ITEMS, LINK_GAUGE_MAX, LINKS, SE } from '../data';
import { isDebugEnabled } from '../debug/debugFlag';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { maybeShowTip } from '../ui/tipPanel';
import type { BattleSceneData } from './BattleScene';
import type { DialogueData } from './DialogueScene';
import { currentParty, run, setExplore, setHubReturn, setStoryVars, storyLineup, storyLinkGauge } from './run';
import { notePlayBattle } from './playRecord';

// 探索（段階25）：区画の地図を歩く。タップした所まで最短の道で歩き、宝箱を開け、敵の印に触れると戦闘になる。
// 戦闘・会話から戻る時は、この画面をもう一度開く（いる場所や倒した敵は、セーブした探索の状態から戻す）。
// 区画のボスに勝ち、その後の会話を見たら、物語の流れへ done で戻る

const T = AREA_TILE;

/** Phaser はデータを渡さずに開くと前のデータを使い回すので、この画面を開く時は必ず全部渡す（なければ undefined を書く） */
export interface ExploreData {
  /** 区画（AREAS の id） */
  area: string;
  /** 勝って戻ってきた敵の印（ボスの id のこともある） */
  won?: string;
  /** 負けて戻ってきた */
  lost?: boolean;
  /** 見終えて戻ってきた、途中の会話（場面の id） */
  seen?: string;
}

interface Enemy {
  id: string;
  battle: string;
  sprite: Phaser.GameObjects.Container;
  route: GridCell[];
  index: number;
}

export class ExploreScene extends Phaser.Scene {
  private area!: AreaDef;
  private map!: GridMap;
  private state!: ExploreState;
  private player!: Phaser.GameObjects.Container;
  private route: GridCell[] = [];
  private nextCell: GridCell | null = null;
  private walking = false;
  /** 道の終わりで話す人・開ける宝箱・ボス */
  private goal: { kind: 'talk'; id: string } | { kind: 'chest'; id: string } | { kind: 'boss' } | null = null;
  private enemies: Enemy[] = [];
  /** この時刻までは、敵の印に触れても戦闘にしない（戻ってきた直後など） */
  private graceUntil = 0;
  /** 初めての人向けの説明を出している間は、敵も自分も止める（段階30） */
  private tipOpen = false;
  /** 別の画面へ移る途中（重ねて移らないように） */
  private leaving = false;
  private chestSprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private marker!: Phaser.GameObjects.Arc;
  private message!: Phaser.GameObjects.Text;
  private messageTimer?: Phaser.Time.TimerEvent;
  /** チェックポイントに立っている時だけ出す、育成の画面への入口（段階26） */
  private hubButton!: Phaser.GameObjects.Container;
  /** 下の帯の、仲間の今の HP・MP（段階32b 調整3） */
  private vitalsText!: Phaser.GameObjects.Text;

  constructor() {
    super('Explore');
  }

  create(data: ExploreData): void {
    const area = AREAS[data.area];
    if (!area) throw new Error(`unknown area ${data.area}`);
    this.area = area;
    this.map = areaGrid(area);
    stopAmbience();
    this.route = [];
    this.nextCell = null;
    this.walking = false;
    this.goal = null;
    this.enemies = [];
    this.leaving = false;
    this.chestSprites = new Map();
    // 育成の画面から戻ってきた（または別の道で来た）ので、育成の画面の戻り先は忘れる
    setHubReturn(null);
    this.graceUntil = this.time.now + AREA_GRACE_MS;
    this.tipOpen = false;

    let state = run.explore?.area === area.id ? run.explore : startExplore(area);
    let note = '';
    let komaGot = 0;
    // 遊んだ記録（段階32b）：探索の戦闘の勝ち負けを、今の出来事のものとして数える
    if (data.won) notePlayBattle(run.event, true);
    if (data.lost) notePlayBattle(run.event, false);
    if (data.won) {
      // 倒した印の戦闘のコマを手に入れる（段階28。同じ印で2回もらわないよう、まだ倒していなかった時だけ）
      const battleId = data.won === area.boss.id ? area.boss.battle : area.enemies.find((e) => e.id === data.won)?.battle;
      if (!state.defeated.includes(data.won)) komaGot = AREA_BATTLES[battleId ?? '']?.koma ?? 0;
      state = addKoma(defeatEnemy(state, data.won), komaGot);
      if (data.won === area.boss.id) state = { ...state, cleared: true };
    }
    if (data.lost) {
      state = loseBattle(state);
      note = 'チェックポイントへ戻った';
    }
    if (data.seen) state = markTrigger(state, data.seen);
    this.state = state;
    setExplore(state);

    // 戻ってきた時の続き：ボスの前の会話を見たらボス戦、ボスの後の会話を見たら区画を出る
    const bossTrigger = area.triggers.find((t) => t.on === 'boss');
    const clearedTrigger = area.triggers.find((t) => t.on === 'cleared');
    if (data.seen && data.seen === bossTrigger?.scene && !state.cleared) {
      this.startBattle(area.boss.battle, area.boss.id);
      return;
    }
    if (state.cleared && (!clearedTrigger || state.seen.includes(clearedTrigger.scene))) {
      this.finishArea();
      return;
    }
    // まだ見ていない途中の会話（勝った回数、ボスに勝った後）
    const pending =
      (state.cleared ? pendingTrigger(area, state, 'cleared') : null) ?? pendingTrigger(area, state, 'wins') ?? pendingTrigger(area, state, 'komaLeft');
    if (pending) {
      this.openTrigger(pending);
      return;
    }

    this.draw();
    if (area.bgm) playBgm(this, area.bgm);
    const left = komaLeft(area, state);
    this.say(
      note ||
        (data.won
          ? `砂嵐を倒した。${komaGot > 0 ? `コマを${komaGot}つ手に入れた（${left > 0 ? `あと${left}つで返せる` : 'そろった'}）` : ''}`
          : 'タップした場所まで歩く。宝箱はタップで開ける。敵の印に触れると戦闘'),
    );
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.showTip(false);
  }

  /** 今の場面の初めての説明があれば出す。出している間は動きを止め、閉じたら少しの間は敵に触れても戦闘にしない */
  private showTip(atCheckpoint: boolean): void {
    if (this.tipOpen || this.leaving) return;
    const shown = maybeShowTip(this, exploreTipTriggers(this.state, { atCheckpoint }), () => {
      this.tipOpen = false;
      this.tweens.resumeAll();
      this.graceUntil = this.time.now + AREA_GRACE_MS;
      // 同じ場面で当てはまる次の説明を続けて出す（段階32b）
      this.showTip(atCheckpoint);
    });
    if (!shown) return;
    this.tipOpen = true;
    this.tweens.pauseAll();
  }

  private draw(): void {
    const area = this.area;
    const world = this.add.container(0, 0);
    const ui = this.add.container(0, 0);
    if (area.image && hasImage(this, area.image)) {
      world.add(this.add.image(0, 0, area.image).setOrigin(0).setDisplaySize(this.map.cols * T, this.map.rows * T));
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x0b1118, 1).fillRect(0, 0, this.map.cols * T, this.map.rows * T);
      area.layout.forEach((line, r) =>
        [...line].forEach((ch, c) => {
          if (ch !== '#') g.fillStyle((c + r) % 2 === 0 ? 0x22303f : 0x1f2c3a, 1).fillRect(c * T, r * T, T, T);
        }),
      );
      world.add(g);
    }
    // 見えないマス目（デバッグの時だけ「マス目」のボタンで見せる）
    const gridView = this.add.graphics().setVisible(false);
    area.layout.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        gridView.lineStyle(1, 0xffffff, 0.15).strokeRect(c * T, r * T, T, T);
        if (ch === '#') gridView.fillStyle(0xff3030, 0.3).fillRect(c * T, r * T, T, T);
      }),
    );
    // 宝箱のマスも通れない
    for (const c of area.chests) gridView.fillStyle(0xff3030, 0.3).fillRect(c.cell[0] * T, c.cell[1] * T, T, T);
    world.add(gridView);

    // チェックポイント（大きな提灯の手前）
    area.layout.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        if (ch !== 'P') return;
        const ring = this.add.circle(c * T + T / 2, r * T + T / 2, T * 0.45).setStrokeStyle(3, 0x6bc8ff);
        world.add(ring);
        this.tweens.add({ targets: ring, alpha: 0.4, yoyo: true, repeat: -1, duration: 900 });
      }),
    );
    // 宝箱
    for (const chest of area.chests) {
      const opened = this.state.openedChests.includes(chest.id);
      const box = this.add
        .rectangle(chest.cell[0] * T + T / 2, chest.cell[1] * T + T / 2, T * 0.7, T * 0.55, opened ? 0x4a3a28 : 0x9a6a2f)
        .setStrokeStyle(2, opened ? 0x6b5a40 : 0xffd84a);
      this.chestSprites.set(chest.id, box);
      world.add(box);
    }
    // 話せる人（写しの人々）。半分すけた人影と、吹き出し
    for (const t of area.talkers) {
      const x = t.cell[0] * T + T / 2;
      const y = t.cell[1] * T + T / 2;
      world.add(this.add.ellipse(x, y, T * 0.6, T * 0.8, 0xc8d0e0, 0.55));
      const bubble = addText(this, x, y - T * 0.75, '…', { size: 14, bold: true, color: '#ffffff' }).setOrigin(0.5);
      world.add(bubble);
      this.tweens.add({ targets: bubble, y: bubble.y - 4, yoyo: true, repeat: -1, duration: 700 });
    }
    // ボスの印
    if (!this.state.cleared) {
      const [bc, br] = area.boss.cell;
      const boss = this.add.container(bc * T + T / 2, br * T + T / 2);
      // コマがそろうまでは眠っている（暗く、ゆっくり息をする。段階32b 調整3）
      const awake = this.bossReady();
      boss.add(this.add.circle(0, 0, T * 0.75, awake ? 0x8a4fbf : 0x4a3a60).setStrokeStyle(2, awake ? 0xffffff : 0x8a80a0));
      boss.add(addText(this, 0, 0, 'ぬし', { size: 13, bold: true, color: awake ? COLORS.text : COLORS.subText }).setOrigin(0.5));
      if (!awake) {
        const z = addText(this, T * 0.6, -T * 0.8, 'z z', { size: 12, bold: true, color: COLORS.subText }).setOrigin(0.5);
        boss.add(z);
        this.tweens.add({ targets: z, y: z.y - 6, alpha: 0.3, yoyo: true, repeat: -1, duration: 1200 });
      }
      world.add(boss);
      this.tweens.add({ targets: boss, scale: awake ? 1.1 : 1.04, yoyo: true, repeat: -1, duration: awake ? 800 : 1600 });
    }
    // タップした所の印
    this.marker = this.add.circle(0, 0, 6, 0xffd84a, 0.8).setVisible(false);
    world.add(this.marker);
    // 敵の印（倒したものは出さない）
    for (const e of area.enemies) {
      if (!enemyActive(this.state, e.id)) continue;
      const route = patrolRoute(this.map, e.patrol);
      const sprite = this.add.container(route[0][0] * T + T / 2, route[0][1] * T + T / 2);
      sprite.add(this.add.rectangle(0, 0, T * 0.62, T * 0.62, COLORS.enemy).setAngle(45).setStrokeStyle(2, 0xffffff));
      world.add(sprite);
      const enemy: Enemy = { id: e.id, battle: e.battle, sprite, route, index: 0 };
      this.enemies.push(enemy);
      this.stepEnemy(enemy);
    }
    // 仲間（ハルト）：小さくした立ち絵を足元の影の上に（歩くアニメーションは作らない。docs/ART.md）
    const [pc, pr] = this.state.cell;
    this.player = this.add.container(pc * T + T / 2, pr * T + T / 2);
    if (hasImage(this, 'portrait.hero.normal')) {
      this.player.add(this.add.ellipse(0, T * 0.35, T * 0.8, T * 0.3, 0x000000, 0.35));
      const face = this.add.image(0, T * 0.4, 'portrait.hero.normal').setOrigin(0.5, 1);
      face.setScale((T * 1.5) / face.height);
      this.player.add(face);
    } else {
      this.player.add(this.add.circle(0, 0, T * 0.42, COLORS.ally).setStrokeStyle(2, 0xffffff));
      this.player.add(addText(this, 0, 0, 'ハ', { size: 14, bold: true }).setOrigin(0.5));
    }
    world.add(this.player);

    // カメラ：地図用は仲間について動く。画面の文字とボタン用は別のカメラで、動かさない
    const cam = this.cameras.main;
    cam.setZoom(RENDER_SCALE).setBounds(0, 0, this.map.cols * T, this.map.rows * T).startFollow(this.player, true, 0.2, 0.2);
    cam.centerOn(this.player.x, this.player.y);
    const uiCam = this.cameras.add(0, 0, cam.width, cam.height).setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    cam.ignore(ui);
    uiCam.ignore(world);

    ui.add(this.add.rectangle(0, 0, GAME_WIDTH, 80, 0x000000, 0.55).setOrigin(0));
    ui.add(addText(this, GAME_WIDTH / 2, 8, area.name, { size: 15, bold: true }).setOrigin(0.5, 0));
    // コマ：あと何コマで返せるか（段階28）
    const left = komaLeft(area, this.state);
    ui.add(
      addText(this, GAME_WIDTH / 2, 31, left > 0 ? `コマ ${this.state.koma}/${area.komaNeed}（あと${left}つで返せる）` : `コマ ${this.state.koma}/${area.komaNeed}（そろった！）`, {
        size: 13,
        bold: true,
        color: left > 0 ? COLORS.text : COLORS.accentText,
      }).setOrigin(0.5, 0),
    );
    // 章の中で引き継いでいる、連携技のつながりゲージ（段階26の調整3）
    if (usableLinks(LINKS, storyLineup().members).length > 0) {
      const g = storyLinkGauge();
      const full = g >= LINK_GAUGE_MAX;
      ui.add(
        addText(this, GAME_WIDTH / 2, 54, full ? '連携技：準備OK' : `連携技：つながり ${Math.round((g / LINK_GAUGE_MAX) * 100)}%`, {
          size: 12,
          bold: full,
          color: full ? COLORS.accentText : COLORS.subText,
        }).setOrigin(0.5, 0),
      );
    }
    addButton(this, ui, 46, 32, 76, 44, 'タイトル', { onTap: () => this.scene.start('Title') }, { size: 13 });
    if (isDebugEnabled(window.location.search)) {
      addButton(this, ui, GAME_WIDTH - 46, 32, 76, 40, 'マス目', { onTap: () => gridView.setVisible(!gridView.visible) }, { size: 13 });
    }
    // 案内は上の帯の下に（下に出すと、地図の下の端にいる仲間が隠れる）
    ui.add(this.add.rectangle(0, 80, GAME_WIDTH, 52, 0x000000, 0.4).setOrigin(0));
    this.message = addText(this, GAME_WIDTH / 2, 106, '', { size: 14, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5);
    ui.add(this.message);
    this.hubButton = this.add.container(0, 0);
    ui.add(this.hubButton);
    this.updateHubButton();
    // 仲間の今の HP・MP（区画の中では戦闘をまたいで持ち越す。段階32b 調整3）
    ui.add(this.add.rectangle(0, GAME_HEIGHT - 26, GAME_WIDTH, 26, 0x000000, 0.55).setOrigin(0));
    this.vitalsText = addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 13, '', { size: 12 }).setOrigin(0.5);
    ui.add(this.vitalsText);
    this.refreshVitals();

    this.input.on('pointerup', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.leaving) return;
      if (p.getDistance() > 12) return; // ドラッグは無視
      const pt = p.positionToCamera(cam) as Phaser.Math.Vector2;
      this.tapCell([Math.floor(pt.x / T), Math.floor(pt.y / T)]);
    });
  }

  update(): void {
    if (this.leaving || !this.player || this.tipOpen) return;
    if (this.time.now < this.graceUntil) return;
    for (const e of this.enemies) {
      if (Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, this.player.x, this.player.y) < T * 0.6) {
        playSe(this, SE.encounter);
        this.startBattle(e.battle, e.id);
        return;
      }
    }
  }

  /** タップしたマス：話せる人・ボスなら隣まで歩いてから。それ以外はそこまで歩く */
  private tapCell(cell: GridCell): void {
    const talker = this.area.talkers.find((t) => near(t.cell, cell, 0));
    // まだ開けていない宝箱は、タップした時だけ開ける（通っただけでは開かない）
    const chest = talker ? null : chestAt(this.area, this.state, cell);
    const boss = !talker && !chest && !this.state.cleared && near(this.area.boss.cell, cell, 1);
    const from = this.nextCell ?? this.state.cell;
    let target: GridCell | null;
    let path: GridCell[] | null;
    if (chest) {
      // 宝箱のマスは通れないので、隣の立てるマスのうち一番近い所まで歩いてから開ける
      const sides: GridCell[] = [[chest.cell[0], chest.cell[1] - 1], [chest.cell[0] + 1, chest.cell[1]], [chest.cell[0], chest.cell[1] + 1], [chest.cell[0] - 1, chest.cell[1]]];
      const options = sides.map((c) => ({ c, p: findPath(this.map, from, c) })).filter((o) => o.p !== null) as { c: GridCell; p: GridCell[] }[];
      options.sort((a, b) => a.p.length - b.p.length);
      target = options[0]?.c ?? null;
      path = options[0]?.p ?? null;
    } else {
      const goal = talker ? talker.cell : boss ? this.area.boss.cell : cell;
      target = nearestWalkable(this.map, goal);
      path = target ? findPath(this.map, from, target) : null;
    }
    if (!target || !path) return;
    if (talker || boss) {
      path.pop(); // 相手のマスの手前で止まる
      this.goal = talker ? { kind: 'talk', id: talker.id } : { kind: 'boss' };
    } else if (chest) {
      this.goal = { kind: 'chest', id: chest.id };
    } else {
      this.goal = null;
    }
    this.marker.setPosition(target[0] * T + T / 2, target[1] * T + T / 2).setVisible(true);
    this.route = path;
    if (!this.walking) this.step();
    this.updateHubButton();
  }

  private step(): void {
    if (this.leaving) return;
    const next = this.route.shift();
    if (!next) {
      this.walking = false;
      this.nextCell = null;
      this.marker.setVisible(false);
      this.updateHubButton();
      this.reachGoal();
      return;
    }
    this.walking = true;
    this.nextCell = next;
    this.tweens.add({
      targets: this.player,
      x: next[0] * T + T / 2,
      y: next[1] * T + T / 2,
      duration: AREA_STEP_MS,
      onComplete: () => {
        this.nextCell = null;
        this.arriveAt(next);
        this.step();
      },
    });
  }

  /** マスに着いた：チェックポイント（宝箱は通っただけでは開かない） */
  private arriveAt(cell: GridCell): void {
    const r = arrive(this.area, this.state, cell);
    this.state = r.state;
    if (r.event.type === 'checkpoint') {
      playSe(this, SE.heal);
      this.say(`チェックポイント：${r.event.healed ? 'HP・MP が全回復した。' : ''}ここまでを記録した。下のボタンで${hubLabel()}を開ける`);
      if (r.event.healed) this.refreshVitals();
    }
    setExplore(this.state);
    if (r.event.type === 'checkpoint') {
      const t = pendingTrigger(this.area, this.state, 'checkpoint');
      if (t) {
        this.route = [];
        this.openTrigger(t);
      } else this.showTip(true);
    }
    // ボスの隣まで来たら
    if (!this.state.cleared && near(this.area.boss.cell, cell, 1) && this.goal?.kind !== 'talk' && (this.bossReady() || this.goal?.kind === 'boss')) {
      this.route = [];
      this.goal = { kind: 'boss' };
    }
  }

  private reachGoal(): void {
    const goal = this.goal;
    this.goal = null;
    if (!goal || this.leaving) return;
    if (goal.kind === 'talk') {
      const talker = this.area.talkers.find((t) => t.id === goal.id);
      if (talker) this.openScene(talker.scene, { area: this.area.id });
      return;
    }
    if (goal.kind === 'chest') {
      this.openChestNow(goal.id);
      return;
    }
    if (!this.bossReady()) {
      // コマがそろうまでは戦えない（雑魚を飛ばしてボスに勝ち、コマが足りないまま区画を出ないように。段階32b 調整3）
      const need = komaLeft(this.area, this.state) - this.bossKoma();
      this.say(`ぬしは、まだ眠っている。先にほかの砂嵐からコマを集めよう（あと${need}つ）`);
      return;
    }
    const t = pendingTrigger(this.area, this.state, 'boss');
    if (t) this.openTrigger(t);
    else this.startBattle(this.area.boss.battle, this.area.boss.id);
  }

  /** 下の帯の、仲間の今の HP・MP（全回復の時は薄い色） */
  private refreshVitals(): void {
    const vitals = this.state.vitals;
    const line = currentParty(storyLineup())
      .map((c) => {
        const v = vitals?.[c.id];
        return `${c.name} HP ${Math.min(v?.hp ?? c.stats.hp, c.stats.hp)}/${c.stats.hp}  MP ${Math.min(v?.mp ?? c.stats.mp, c.stats.mp)}/${c.stats.mp}`;
      })
      .join('　');
    this.vitalsText.setText(line).setColor(vitals ? COLORS.text : COLORS.subText);
  }

  /** ボスが抱えているコマの数 */
  private bossKoma(): number {
    return AREA_BATTLES[this.area.boss.battle]?.koma ?? 0;
  }

  /** ボスに挑めるか（ボスのコマを足せば返せる数になっている） */
  private bossReady(): boolean {
    return bossReady(this.area, this.state, this.bossKoma());
  }

  /** 宝箱を開けて、中身を持ち物に入れる */
  private openChestNow(chestId: string): void {
    const r = openChest(this.area, this.state, chestId);
    if (!r) return;
    this.state = r.state;
    run.armory = addItems(run.armory, r.chest.items);
    this.chestSprites.get(r.chest.id)?.setFillStyle(0x4a3a28).setStrokeStyle(2, 0x6b5a40);
    playSe(this, SE.chest);
    this.say(`宝箱を開けた！　${summarize(r.chest.items)}`);
    setExplore(this.state);
  }

  /** チェックポイントに立ち止まっている時だけ、育成の画面への入口を出す（段階26） */
  private updateHubButton(): void {
    if (!this.hubButton) return;
    this.hubButton.removeAll(true);
    const unlocks = storyLineup().unlocks;
    const target = unlocks.growth ? 'Growth' : unlocks.weapon ? 'Weapon' : null;
    if (!target || this.walking || this.route.length > 0 || !isCheckpoint(this.area, this.state.cell)) return;
    addButton(this, this.hubButton, GAME_WIDTH / 2, GAME_HEIGHT - 56, 240, 60, hubLabel(), { onTap: () => this.openHub(target) }, {
      size: 17,
      bold: true,
      fill: 0x1e3a5a,
      stroke: 0x6bc8ff,
      strokeWidth: 2,
    });
  }

  /** 育成の画面（星図・武器）を開く。閉じると、この画面のチェックポイントに戻る */
  private openHub(target: string): void {
    if (this.leaving) return;
    this.leaving = true;
    setExplore(this.state);
    setHubReturn({ key: 'Explore', data: { area: this.area.id, won: undefined, lost: undefined, seen: undefined } satisfies ExploreData });
    this.scene.start(target);
  }

  /** 途中の会話を見る。見終えたら、この画面に seen を付けて戻る */
  private openTrigger(t: AreaTrigger): void {
    this.openScene(t.scene, { area: this.area.id, seen: t.scene });
  }

  private openScene(scene: string, back: ExploreData): void {
    if (this.leaving) return;
    this.leaving = true;
    setExplore(this.state);
    const data: DialogueData = {
      scene,
      // コマの値（台本の {komaHave} {komaNeed} {komaLeft}）を足して渡す。物語の値としては覚えない（段階28）
      vars: { ...run.vars, ...komaVars(this.area, this.state) },
      seed: run.seed,
      next: { key: 'Explore', data: { won: undefined, lost: undefined, seen: undefined, ...back } satisfies ExploreData },
      onVars: (vars) => setStoryVars(Object.fromEntries(Object.entries(vars).filter(([k]) => !k.startsWith('koma')))),
    };
    this.scene.start('Dialogue', data);
  }

  private startBattle(battle: string, enemyId: string): void {
    if (this.leaving) return;
    this.leaving = true;
    setExplore(this.state);
    const data: BattleSceneData = {
      encounter: {
        battle,
        win: { key: 'Explore', data: { area: this.area.id, won: enemyId, lost: undefined, seen: undefined } satisfies ExploreData },
        lose: { key: 'Explore', data: { area: this.area.id, won: undefined, lost: true, seen: undefined } satisfies ExploreData },
      },
    };
    const cam = this.cameras.main;
    if (!cam) {
      this.scene.start('Battle', data);
      return;
    }
    cam.shake(200, 0.006);
    cam.flash(250, 255, 255, 255);
    this.time.delayedCall(320, () => this.scene.start('Battle', data));
  }

  /** 区画を出て、物語の次の出来事（時間を返す）へ。集めたコマは返す画面で使うので、探索の状態は返し終えるまで残す（段階28） */
  private finishArea(): void {
    this.leaving = true;
    setExplore(this.state);
    this.scene.start('Flow', { done: true });
  }

  private stepEnemy(e: Enemy): void {
    e.index = (e.index + 1) % e.route.length;
    const [c, r] = e.route[e.index];
    this.tweens.add({ targets: e.sprite, x: c * T + T / 2, y: r * T + T / 2, duration: AREA_ENEMY_STEP_MS, onComplete: () => this.stepEnemy(e) });
  }

  private say(text: string): void {
    if (!this.message) return;
    this.message.setText(text).setAlpha(1);
    this.messageTimer?.remove();
    this.messageTimer = this.time.delayedCall(2800, () => this.tweens.add({ targets: this.message, alpha: 0.4, duration: 300 }));
  }
}

/** 育成の入口のボタンの名前（開いている育成だけ。「星図・武器」など） */
function hubLabel(): string {
  const u = storyLineup().unlocks;
  return [u.growth && '星図', u.navi && 'ムーブメント', u.weapon && '武器'].filter(Boolean).join('・');
}

/** 2つのマスが、range マス以内（縦横斜め）か */
function near(a: GridCell, b: GridCell, range: number): boolean {
  return Math.abs(a[0] - b[0]) <= range && Math.abs(a[1] - b[1]) <= range;
}

/** 「スライムゼリー×2、ポーション」のようにまとめる */
function summarize(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${(ITEMS as Record<string, { name: string }>)[id]?.name ?? id}${n > 1 ? `×${n}` : ''}`).join('、');
}
