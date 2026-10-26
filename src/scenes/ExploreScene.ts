import Phaser from 'phaser';
import type { AreaDef, AreaTrigger, EnemyMind, EnemyMove, ExploreState, GridCell, GridMap, RoomDef } from '../core';
import {
  closedWalls,
  unvisitedDoors,
  inNight,
  nightArea,
  nightDone,
  nightExit,
  nightGoal,
  startNight,
  gainSnaps,
  addParts,
  enemyNext,
  exploreTipTriggers,
  inRoom,
  passDoor,
  roomOf,
  roomPositions,
  startMind,
  addItems,
  capItems,
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
  triggerGears,
  startExplore,
  usableLinks,
  findLost,
  huntArea,
  lostOfSpot,
  lostSpots,
  thinItems,
  areaChapter,
  huntRewardRate,
  applyMapEdits,
  isEmptyMapEdits,
  ROOF,
  roofCells,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { hasImage } from '../assets/loader';
import { playBgm, playKoma, playSe, prefetchBgm, stopAmbience } from '../audio/sound';
import { AREA_BATTLES, BGM, HUNT_OLD_AREA_RATE, ROOM_NAMES, SLICE_FLOW, AREA_GRACE_MS, AREA_STEP_MS, AREA_TILE, AREAS, ENEMY_ART, ENEMY_MOVES, ITEMS, LINK_GAUGE_MAX, LINKS, LOST_ITEMS, MEMORY_FADE_LABELS, MEMORY_FADE_RATES, NAVI_DATA, SE, snapNames, TRIAL_AREAS, WEAPON_DATA } from '../data';
import { isDebugEnabled } from '../debug/debugFlag';
import { loadMapEdits } from '../debug/mapEdits';
import { MapEditor } from './mapEditor';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { maybeShowTip } from '../ui/tipPanel';
import type { BattleSceneData } from './BattleScene';
import type { DialogueData } from './DialogueScene';
import { currentParty, nextHuntCount, run, setExplore, setHubReturn, setHuntState, setStoryVars, storyBattleLineup, storyLineup, storyLinkGauge } from './run';
import { notePlayBattle } from './playRecord';

// 探索（段階25）：区画の地図を歩く。タップした所まで最短の道で歩き、宝箱を開け、敵の印に触れると戦闘になる。
// 戦闘・会話から戻る時は、この画面をもう一度開く（いる場所や倒した敵は、セーブした探索の状態から戻す）。
// 区画のボスに勝ち、その後の会話を見たら、物語の流れへ done で戻る。
// 段階47：区画は部屋を出入口でつないだもの。出入口のマスに着くと、短く暗転して、つながった部屋の出入口の内側に出る（画面を開き直す）。
// 敵の印は、動き方の種類ごとに1歩ずつ行き先を決める（core/explore.ts の enemyNext）
// 段階43：狩り（hunt）の時は、返し終えた区画を狩りの区画（core/hunt.ts の huntArea）にして歩く。状態はセーブしない run.hunt に置く。
// コマ・会話はなく、ぬしはいつでも挑めて、勝っても区画は終わらない。左上の「レストピアへ戻る」で拠点に戻る（段階50）

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
  /** 狩り（段階43。返し終えた区画に入り直している） */
  hunt?: boolean;
  /** 晩に分けた区画の、何晩目か（段階63。物語の流れの探索の出来事が決める） */
  night?: number;
}

interface Enemy {
  id: string;
  battle: string;
  move: EnemyMove;
  sprite: Phaser.GameObjects.Container;
  route: GridCell[];
  mind: EnemyMind;
  /** 追ってくる途中の「！」 */
  alert?: Phaser.GameObjects.Text;
}

export class ExploreScene extends Phaser.Scene {
  private area!: AreaDef;
  /** 今いる部屋（段階47） */
  private room!: RoomDef;
  /** デバッグメニューの試しの区画（段階47。物語の流れには戻らない） */
  private trial = false;
  /** 狩りの途中（段階43） */
  private hunting = false;
  /** 晩に分けた区画の、何晩目か（段階63。晩に分けていない区画と狩りは 0） */
  private night = 0;
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
  /** 地図（仲間について動くカメラで映すもの） */
  private world?: Phaser.GameObjects.Container;
  /** 説明を出している間だけ止めている、地図の上の動き */
  private pausedTweens: Phaser.Tweens.Tween[] = [];
  /** 別の画面へ移る途中（重ねて移らないように） */
  private leaving = false;
  private chestSprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private marker!: Phaser.GameObjects.Arc;
  private message!: Phaser.GameObjects.Text;
  private messageTimer?: Phaser.Time.TimerEvent;
  /** 案内が消えた後に、帯に出す「もう一度見る」（段階98） */
  private messageHint?: Phaser.GameObjects.Text;
  /** 最後に出した案内（帯をタップすると、もう一度出す） */
  private lastMessage = '';
  /** チェックポイントに立っている時だけ出す、育成の画面への入口（段階26） */
  private hubButton!: Phaser.GameObjects.Container;
  /** 下の帯の、仲間の今の HP・MP（段階32b 調整3） */
  private vitalsTexts: Phaser.GameObjects.Text[] = [];
  /** 直しを重ねる前の区画（地図の調整。段階117） */
  private rawArea!: AreaDef;
  /** 画面の文字とボタンの入れ物 */
  private ui?: Phaser.GameObjects.Container;
  /** 地図の調整の途中（段階117。?debug=1 の時だけ） */
  private editor: MapEditor | null = null;
  /** 屋根や木の下（段階118）に重ねる、地図の絵の切り抜き */
  private roof?: Phaser.GameObjects.Container;

  constructor() {
    super('Explore');
  }

  create(data: ExploreData): void {
    const raw = AREAS[data.area] ?? TRIAL_AREAS[data.area];
    if (!raw) throw new Error(`unknown area ${data.area}`);
    // 地図の調整（段階117）：?debug=1 の時だけ、端末に覚えた直しを重ねる
    this.rawArea = raw;
    this.editor = null;
    const base = isDebugEnabled(window.location.search) ? applyMapEdits(raw, loadMapEdits()) : raw;
    this.hunting = data.hunt === true;
    const hunt = run.hunt;
    if (this.hunting && (!hunt || !base.hunt)) {
      // 狩りの状態がない（ふつうは起きない）：物語の流れへ戻る（前に開いた時の仲間や敵が update で動かないよう、移る途中にする）
      this.leaving = true;
      this.scene.start('Flow', { done: false });
      return;
    }
    // 記憶をたどる時は、受けている探し物（落とし物。段階53）の光る所も置く
    // 晩に分けた区画（段階63）：その晩の壁と、その晩に出るものだけ
    this.night = !this.hunting && base.nights ? (data.night ?? 1) : 0;
    const area =
      this.hunting && hunt && base.hunt
        ? huntArea({ ...base, hunt: { ...base.hunt, gathers: [...base.hunt.gathers, ...lostSpots(LOST_ITEMS, run.vars, base.id)] } }, hunt.salt)
        : this.night > 0
          ? nightArea(base, this.night)
          : base;
    this.area = area;
    this.trial = !AREAS[data.area];
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
    this.world = undefined;
    this.pausedTweens = [];

    let state = this.hunting && hunt ? hunt.state : run.explore?.area === area.id ? run.explore : startExplore(area);
    // 新しい晩なら、その晩を始める所から（段階63）
    if (this.night > 0) state = startNight(base, state, this.night);
    let note = '';
    let komaGot = 0;
    // 遊んだ記録（段階32b）：探索の戦闘の勝ち負けを、今の出来事のものとして数える
    if (data.won && !this.trial && !this.hunting) notePlayBattle(run.event, true);
    if (data.lost && !this.trial && !this.hunting) notePlayBattle(run.event, false);
    if (data.won) {
      // 倒した印の戦闘のコマを手に入れる（段階28。同じ印で2回もらわないよう、まだ倒していなかった時だけ）
      const battleId = data.won === area.boss.id ? area.boss.battle : area.enemies.find((e) => e.id === data.won)?.battle;
      // 狩りでは、コマは手に入らず、ぬしに勝っても区画は終わらない（段階43）
      if (!state.defeated.includes(data.won) && !this.hunting) komaGot = AREA_BATTLES[battleId ?? '']?.koma ?? 0;
      state = addKoma(defeatEnemy(state, data.won), komaGot);
      if (data.won === area.boss.id && !this.hunting) state = { ...state, cleared: true };
    }
    if (data.lost) {
      state = loseBattle(state);
      note = 'チェックポイントへ戻った';
    }
    // 会話のごほうびのギア（段階38。2-1 の銭湯の前で、みおが拾った歯車など）
    const gears = data.seen ? triggerGears(area, state, data.seen) : [];
    if (gears.length > 0) {
      run.navi = addParts(run.navi, gears);
      note = `ギアを手に入れた！　${gearNames(gears)}`;
    }
    if (data.seen) state = markTrigger(state, data.seen);
    this.state = state;
    this.room = roomOf(area, state.room);
    this.map = areaGrid(area, state.room);
    this.keep(state);

    // 戻ってきた時の続き：ボスの前の会話を見たらボス戦、ボスの後の会話を見たら区画を出る
    const bossTrigger = area.triggers.find((t) => t.on === 'boss');
    const clearedTrigger = area.triggers.find((t) => t.on === 'cleared');
    if (data.seen && data.seen === bossTrigger?.scene && !state.cleared) {
      this.startBattle(area.boss.battle, area.boss.id);
      return;
    }
    // 戦う前の会話（番人の前など。段階63）を見たら、その敵と戦う
    const before = data.seen ? area.enemies.find((e) => e.scene === data.seen && !state.defeated.includes(e.id)) : undefined;
    if (before) {
      this.startBattle(before.battle, before.id);
      return;
    }
    if (state.cleared && (!clearedTrigger || state.seen.includes(clearedTrigger.scene))) {
      this.finishArea();
      return;
    }
    // 区画の曲に戻す。戦闘から戻ってすぐ途中の会話を開く時も、戦闘の曲のままにしない（2026-10-13）
    if (area.bgm) playBgm(this, area.bgm);
    // まだ見ていない途中の会話（勝った回数、ボスに勝った後）
    const pending =
      (state.cleared ? pendingTrigger(area, state, 'cleared') : null) ??
      pendingTrigger(area, state, 'koma') ??
      pendingTrigger(area, state, 'wins') ??
      pendingTrigger(area, state, 'komaLeft') ??
      pendingTrigger(area, state, 'room');
    if (pending) {
      this.openTrigger(pending);
      return;
    }
    // その晩のコマがそろい、途中の会話も見終えても、自動では終わらない。帰り口（光る砂時計）から自分で帰る（段階67）

    this.draw();
    // 戦闘に入った時にすぐ曲が変わるよう、戦闘の曲を先に読んでおく
    prefetchBgm([BGM.battle, BGM.boss]);
    const left = komaLeft(area, state);
    this.say(
      note ||
        (data.won
          ? `${data.won === area.boss.id ? 'ぬし' : '砂嵐'}を倒した。${komaGot > 0 ? `コマを${komaGot}つ手に入れた（${this.komaNote()}）` : this.hunting || data.won === area.boss.id ? '' : '（コマは持っていなかった）'}`
          : this.hunting
            ? '記憶をたどる：砂嵐の名残とぬしから素材を集める。光る所をタップすると素材を拾える'
            : this.night > 0
              ? this.nightGuide()
              : (area.goal?.guide ?? 'タップした場所まで歩く。宝箱はタップで開ける。敵の印に触れると戦闘')),
    );
    this.cameras.main.fadeIn(300, 0, 0, 0);
    // コマを手に入れた音。画面が明るくなってから（段階31c の残り。そろった時は3音）
    if (komaGot > 0) this.time.delayedCall(300, () => playKoma(this, left <= 0));
    this.showTip(false);
  }

  /** 今の場面の初めての説明があれば出す。出している間は動きを止め、閉じたら少しの間は敵に触れても戦闘にしない */
  private showTip(atCheckpoint: boolean): void {
    if (this.tipOpen || this.leaving) return;
    const before = new Set(this.children.list);
    const shown = maybeShowTip(this, exploreTipTriggers(this.state, { atCheckpoint, hunting: this.hunting }), () => {
      this.tipOpen = false;
      for (const t of this.pausedTweens) t.resume();
      this.pausedTweens = [];
      this.graceUntil = this.time.now + AREA_GRACE_MS;
      // 同じ場面で当てはまる次の説明を続けて出す（段階32b）
      this.showTip(atCheckpoint);
    });
    if (!shown) return;
    this.tipOpen = true;
    // 説明の窓は画面の文字用のカメラだけに映す（地図用のカメラにも映ると、地図の左上に暗い幕がもう1枚重なる）
    this.cameras.main.ignore(this.children.list.filter((o) => !before.has(o)));
    // 止めるのは地図の上の動きだけ。tweens.pauseAll() は説明の窓が出る動きまで止めてしまい、
    // 見えない窓が残って後ろを押せなくなる（音は鳴っているのに固まる。段階32a で窓に動きを付けてから）
    this.pausedTweens = this.tweens.getTweens().filter((t) => !t.isPaused() && t.targets.some((o) => this.inWorld(o)));
    for (const t of this.pausedTweens) t.pause();
  }

  /** 地図の中のもの（地図の入れ物の中に、入れ子でも入っている）か */
  private inWorld(o: unknown): boolean {
    let p = (o as Phaser.GameObjects.GameObject | null)?.parentContainer;
    while (p) {
      if (p === this.world) return true;
      p = p.parentContainer;
    }
    return false;
  }

  private draw(): void {
    const area = this.area;
    const world = this.add.container(0, 0);
    this.world = world;
    const ui = this.add.container(0, 0);
    this.ui = ui;
    const room = this.room;
    if (room.image && hasImage(this, room.image)) {
      world.add(this.add.image(0, 0, room.image).setOrigin(0).setDisplaySize(this.map.cols * T, this.map.rows * T));
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x0b1118, 1).fillRect(0, 0, this.map.cols * T, this.map.rows * T);
      room.layout.forEach((line, r) =>
        [...line].forEach((ch, c) => {
          if (ch !== '#') g.fillStyle((c + r) % 2 === 0 ? 0x22303f : 0x1f2c3a, 1).fillRect(c * T, r * T, T, T);
        }),
      );
      world.add(g);
    }
    // 見えないマス目（デバッグの時だけ「マス目」のボタンで見せる）
    const gridView = this.add.graphics().setVisible(false);
    room.layout.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        gridView.lineStyle(1, 0xffffff, 0.15).strokeRect(c * T, r * T, T, T);
        if (ch === '#') gridView.fillStyle(0xff3030, 0.3).fillRect(c * T, r * T, T, T);
      }),
    );
    // 宝箱のマスも通れない
    for (const c of area.chests) if (this.here(c)) gridView.fillStyle(0xff3030, 0.3).fillRect(c.cell[0] * T, c.cell[1] * T, T, T);
    world.add(gridView);
    // ノイズの壁（段階63）：まだ開いていない壁のマスに、ざらざらした砂嵐をかける
    if (this.night > 0) {
      for (const w of closedWalls(area, this.night, room.id)) {
        for (const [c, r] of w.cells) {
          const noise = this.add.graphics();
          for (let i = 0; i < 10; i++) {
            const shade = 0x60 + Math.floor(Math.random() * 0x90);
            noise.fillStyle((shade << 16) | (shade << 8) | shade, 0.85).fillRect(c * T + Math.random() * T * 0.8, r * T + Math.random() * T * 0.8, T * 0.3, T * 0.12);
          }
          const base = this.add.rectangle(c * T + T / 2, r * T + T / 2, T, T, 0x2a2a30, 0.75);
          world.add(base);
          world.add(noise);
          this.tweens.add({ targets: noise, alpha: 0.35, yoyo: true, repeat: -1, duration: 160 + Math.random() * 200 });
        }
      }
    }

    // まだ入っていない部屋への出入口（段階112）：光る矢印と、その部屋の名前。狩りでは出さない
    if (!this.hunting) {
      for (const door of unvisitedDoors(area, this.state, room.id)) {
        const [dx, dy] = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[door.side];
        const nx = door.cells.reduce((n, c) => n + c[0], 0) / door.cells.length;
        const ny = door.cells.reduce((n, c) => n + c[1], 0) / door.cells.length;
        // 出入口の1マス内側に置き、外へ向けて動かす
        const ax = (nx - dx) * T + T / 2;
        const ay = (ny - dy) * T + T / 2;
        const arrow = this.add.container(ax, ay);
        const tri = this.add.triangle(0, 0, 0, -T * 0.4, T * 0.45, T * 0.35, -T * 0.45, T * 0.35, 0xffe08a, 0.95).setStrokeStyle(2, 0x5a4a10);
        tri.setAngle(door.side === 'top' ? 0 : door.side === 'bottom' ? 180 : door.side === 'left' ? -90 : 90);
        arrow.add(tri);
        const label = addText(this, -dx * T * 1.1, -dy * T * 1.1 + (dx !== 0 ? -T * 0.8 : 0), `${ROOM_NAMES[door.toRoom] ?? ''}へ`, { size: 11, bold: true, color: '#ffe08a' }).setOrigin(0.5);
        label.setStroke('#000000', 3);
        arrow.add(label);
        world.add(arrow);
        this.tweens.add({ targets: tri, x: dx * T * 0.3, y: dy * T * 0.3, alpha: 0.5, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
      }
    }
    // チェックポイント（大きな提灯の手前）
    room.layout.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        if (ch !== 'P') return;
        const ring = this.add.circle(c * T + T / 2, r * T + T / 2, T * 0.45).setStrokeStyle(3, 0x6bc8ff);
        world.add(ring);
        this.tweens.add({ targets: ring, alpha: 0.4, yoyo: true, repeat: -1, duration: 900 });
      }),
    );
    // 宝箱（狩りでは採取の場所：光る緑のひし形。段階43）
    for (const chest of area.chests) {
      if (!this.here(chest)) continue;
      const opened = this.state.openedChests.includes(chest.id);
      const [x, y] = [chest.cell[0] * T + T / 2, chest.cell[1] * T + T / 2];
      if (this.hunting) {
        // 落とし物の光る所（段階53）は金色
        const lost = lostOfSpot(chest.id) !== null;
        const spot = this.add.rectangle(x, y, T * 0.5, T * 0.5, opened ? 0x3a4a3a : lost ? 0xffd84a : 0x6fe0a0).setAngle(45).setStrokeStyle(2, opened ? 0x5a6a5a : 0xffffff);
        if (!opened) this.tweens.add({ targets: spot, alpha: 0.45, scale: 1.2, yoyo: true, repeat: -1, duration: 700 });
        this.chestSprites.set(chest.id, spot);
        world.add(spot);
        continue;
      }
      const box = this.add.rectangle(x, y, T * 0.7, T * 0.55, opened ? 0x4a3a28 : 0x9a6a2f).setStrokeStyle(2, opened ? 0x6b5a40 : 0xffd84a);
      this.chestSprites.set(chest.id, box);
      world.add(box);
    }
    // 話せる人（写しの人々）。半分すけた人影と、吹き出し
    for (const t of area.talkers) {
      if (!this.here(t)) continue;
      const x = t.cell[0] * T + T / 2;
      const y = t.cell[1] * T + T / 2;
      world.add(this.add.ellipse(x, y, T * 0.6, T * 0.8, 0xc8d0e0, 0.55));
      const bubble = addText(this, x, y - T * 0.75, '…', { size: 14, bold: true, color: '#ffffff' }).setOrigin(0.5);
      world.add(bubble);
      this.tweens.add({ targets: bubble, y: bubble.y - 4, yoyo: true, repeat: -1, duration: 700 });
    }
    // ボスの印
    if (this.bossHere()) {
      const [bc, br] = area.boss.cell;
      const boss = this.add.container(bc * T + T / 2, br * T + T / 2);
      // コマがそろうまでは眠っている（暗く、ゆっくり息をする。段階32b 調整3）
      const awake = this.bossReady();
      boss.add(this.add.circle(0, 0, T * 0.75, awake ? 0x8a4fbf : 0x4a3a60).setStrokeStyle(2, awake ? 0xffffff : 0x8a80a0));
      boss.add(addText(this, 0, 0, area.boss.label ?? 'ぬし', { size: 13, bold: true, color: awake ? COLORS.text : COLORS.subText }).setOrigin(0.5));
      if (!awake) {
        const z = addText(this, T * 0.6, -T * 0.8, 'z z', { size: 12, bold: true, color: COLORS.subText }).setOrigin(0.5);
        boss.add(z);
        this.tweens.add({ targets: z, y: z.y - 6, alpha: 0.3, yoyo: true, repeat: -1, duration: 1200 });
      }
      world.add(boss);
      this.tweens.add({ targets: boss, scale: awake ? 1.1 : 1.04, yoyo: true, repeat: -1, duration: awake ? 800 : 1600 });
    }
    // 帰り口（段階67）：今夜のコマがそろったら、次の晩を始めるチェックポイントに光る砂時計
    const exit = this.nightOver() ? nightExit(area, this.night) : null;
    if (exit && exit.room === room.id) {
      const [ec, er] = exit.cell;
      const glow = this.add.circle(ec * T + T / 2, er * T + T / 2, T * 0.9, 0xffd84a, 0.35);
      world.add(glow);
      this.tweens.add({ targets: glow, alpha: 0.1, scale: 1.5, yoyo: true, repeat: -1, duration: 900 });
      const mark = this.komaMark(ec * T + T / 2, er * T + T / 2 - T * 0.2, 2.2);
      world.add(mark);
      this.tweens.add({ targets: mark, y: mark.y - 5, yoyo: true, repeat: -1, duration: 800 });
    }
    // タップした所の印
    this.marker = this.add.circle(0, 0, 6, 0xffd84a, 0.8).setVisible(false);
    world.add(this.marker);
    // 敵の印（倒したものは出さない）
    for (const e of area.enemies) {
      if (!enemyActive(this.state, e.id) || !this.here(e)) continue;
      const move = e.move ?? 'patrol';
      const route = e.patrol.length >= 2 ? patrolRoute(this.map, e.patrol) : [e.patrol[0]];
      const sprite = this.enemySprite(e.battle, move, route[0]);
      // コマを持つ砂嵐の印（段階67。物語の探索だけ。狩りではコマは手に入らない）
      if (!this.hunting && (AREA_BATTLES[e.battle]?.koma ?? 0) > 0) sprite.add(this.komaMark(T * 0.45, -T * 0.6));
      world.add(sprite);
      const enemy: Enemy = { id: e.id, battle: e.battle, move, sprite, route, mind: startMind(route) };
      if (move === 'chase') {
        enemy.alert = addText(this, 0, -T * 0.95, '！', { size: 16, bold: true, color: '#ffd84a' }).setOrigin(0.5).setVisible(false);
        enemy.alert.setStroke('#5a1a00', 4);
        sprite.add(enemy.alert);
      }
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
    this.roof = this.drawRoof(room);
    if (this.roof) world.add(this.roof);
    this.updateRoof(this.state.cell, false);

    // カメラ：地図用は仲間について動く。画面の文字とボタン用は別のカメラで、動かさない。
    // 動ける範囲は、地図の上と下に帯の高さの分だけ広げる（地図の上の端と下の端が、帯に隠れたままにならないように。段階58）
    const cam = this.cameras.main;
    const bottomBand = vitalsBandHeight(currentParty(storyBattleLineup()).length);
    cam
      .setZoom(RENDER_SCALE)
      .setBounds(0, -TOP_BAND, this.map.cols * T, this.map.rows * T + TOP_BAND + bottomBand)
      .startFollow(this.player, true, 0.2, 0.2);
    cam.centerOn(this.player.x, this.player.y);
    const uiCam = this.cameras.add(0, 0, cam.width, cam.height).setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    cam.ignore(ui);
    uiCam.ignore(world);

    // 上の帯は、地図の絵が透けて文字が読みにくくならないよう、濃くする（段階98。レビューの F3）
    ui.add(this.add.rectangle(0, 0, GAME_WIDTH, 80, 0x000000, 0.8).setOrigin(0));
    ui.add(addText(this, GAME_WIDTH / 2, 8, area.name, { size: 15, bold: true }).setOrigin(0.5, 0));
    // コマ：あと何コマで返せるか（段階28）。狩りではコマはないので、狩りの案内（段階43）
    const left = komaLeft(area, this.state);
    if (this.hunting) {
      // その回の記憶の濃さ（段階57）
      const fade = run.hunt?.fade ?? 1;
      const level = MEMORY_FADE_RATES.indexOf(fade);
      const label = fade < 1 ? `（${MEMORY_FADE_LABELS[level] ?? '薄い'}・${Math.round(fade * 10)}割）` : '';
      ui.add(addText(this, GAME_WIDTH / 2, 31, `記憶をたどる：素材を集める${label}`, { size: 13, bold: true, color: COLORS.accentText }).setOrigin(0.5, 0));
    }
    else if (this.night > 0) {
      // 晩に分けた区画（段階67）：今夜の目標（何晩目と、今夜のコマ）
      const goal = nightGoal(area, this.state, this.night);
      const done = this.nightOver();
      // 左右のボタンの間に入る長さ（16字ほど）にする。くわしくは下の案内で
      const rest = goal.last ? (left > this.bossKoma() ? '最後はぬし' : 'あとは、ぬし') : done ? 'そろった！' : `今夜あと${goal.need - goal.have}つ`;
      ui.add(
        addText(this, GAME_WIDTH / 2, 31, `${this.night}晩目　コマ ${goal.have}/${goal.need}（${rest}）`, {
          size: 13,
          bold: true,
          color: done || left <= this.bossKoma() ? COLORS.accentText : COLORS.text,
        }).setOrigin(0.5, 0),
      );
    } else if (area.goal) {
      // コマのいらない区画（段階85。書庫）：目当てだけを出す
      ui.add(addText(this, GAME_WIDTH / 2, 31, area.goal.band, { size: 13, bold: true, color: COLORS.accentText }).setOrigin(0.5, 0));
    } else ui.add(
      addText(this, GAME_WIDTH / 2, 31, left > 0 ? `コマ ${this.state.koma}/${area.komaNeed}（あと${left}つで返せる）` : `コマ ${this.state.koma}/${area.komaNeed}（そろった！）`, {
        size: 13,
        bold: true,
        color: left > 0 ? COLORS.text : COLORS.accentText,
      }).setOrigin(0.5, 0),
    );
    // 章の中で引き継いでいる、連携技のつながりゲージ（段階26の調整3）
    if (usableLinks(LINKS, storyBattleLineup().members).length > 0) {
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
    if (this.hunting) addButton(this, ui, 46, 32, 76, 44, 'レストピア\nへ戻る', { onTap: () => this.leaveHunt() }, { size: 11 });
    else addButton(this, ui, 46, 32, 76, 44, 'タイトル', { onTap: () => this.scene.start('Title') }, { size: 13 });
    if (isDebugEnabled(window.location.search)) {
      addButton(this, ui, GAME_WIDTH - 46, 28, 76, 34, 'マス目', { onTap: () => gridView.setVisible(!gridView.visible) }, { size: 13 });
      // 地図の調整（段階117）。直しがあれば ＊ を付ける
      addButton(this, ui, GAME_WIDTH - 46, 64, 76, 26, isEmptyMapEdits(loadMapEdits()) ? '地図直し' : '地図直し＊', { onTap: () => this.openEditor() }, { size: 11 });
    }
    // 案内は上の帯の下に（下に出すと、地図の下の端にいる仲間が隠れる）。
    // 段階98（レビューの F3）：帯を濃くし、案内は数秒で消す。帯をタップすると、もう一度出す（帯のタップでは歩かない）
    const messageBand = this.add.rectangle(0, 80, GAME_WIDTH, TOP_BAND - 80, 0x000000, 0.8).setOrigin(0);
    ui.add(messageBand);
    makePressable(messageBand, { onTap: () => this.say(this.lastMessage) });
    this.messageHint = addText(this, GAME_WIDTH / 2, 106, '案内をもう一度見る（タップ）', { size: 11, color: COLORS.subText }).setOrigin(0.5).setAlpha(0);
    ui.add(this.messageHint);
    this.message = addText(this, GAME_WIDTH / 2, 106, '', { size: 14, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5);
    ui.add(this.message);
    this.hubButton = this.add.container(0, 0);
    ui.add(this.hubButton);
    this.updateHubButton();
    // 仲間の今の HP・MP（区画の中では戦闘をまたいで持ち越す。段階32b 調整3）
    // 仲間ごとの列に名前と HP・MP の2行で出す（段階38で3人の時、段階47で2人の時も。1行だと左右がはみ出していた）
    const members = currentParty(storyBattleLineup());
    const band = vitalsBandHeight(members.length);
    ui.add(this.add.rectangle(0, GAME_HEIGHT - band, GAME_WIDTH, band, 0x000000, 0.55).setOrigin(0));
    // 下の端のビルド日時と右下の設定のボタンにかからないよう、その上と左に並べる
    this.vitalsTexts =
      members.length > 1
        ? members.map((_, i) => addText(this, 8 + (VITALS_WIDTH * (i + 0.5)) / members.length, GAME_HEIGHT - band + 17, '', { size: 11, align: 'center' }).setOrigin(0.5))
        : [addText(this, GAME_WIDTH / 2, GAME_HEIGHT - band / 2, '', { size: 12 }).setOrigin(0.5)];
    ui.add(this.vitalsTexts);
    this.refreshVitals();
    // 全体の地図（段階47a）：部屋が2つ以上の区画だけ。入った部屋とつながりを、右上に小さく出す
    if (area.rooms.length > 1) ui.add(this.drawRoomMap());

    this.input.on('pointerup', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.leaving || this.editor) return;
      if (p.getDistance() > 12) return; // ドラッグは無視
      const pt = p.positionToCamera(cam) as Phaser.Math.Vector2;
      this.tapCell([Math.floor(pt.x / T), Math.floor(pt.y / T)]);
    });
  }

  update(): void {
    if (this.leaving || !this.player || this.tipOpen || this.editor) return;
    if (this.time.now < this.graceUntil) return;
    for (const e of this.enemies) {
      if (Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, this.player.x, this.player.y) < T * 0.6) {
        playSe(this, SE.encounter);
        // 戦う前の会話がある敵（番人の前など。段階63）は、会話を見てから戦う
        const scene = this.area.enemies.find((x) => x.id === e.id)?.scene;
        if (scene && !this.state.seen.includes(scene)) this.openScene(scene, this.back({ seen: scene }));
        else this.startBattle(e.battle, e.id);
        return;
      }
    }
  }

  /**
   * 屋根や木の下（段階118）：文字の地図の ^ のマスに、地図の絵の同じ所を切り抜いて、仲間と敵の上にもう一度重ねる
   * （横に続くマスは1枚にまとめる）。絵のない部屋は暗い四角
   */
  private drawRoof(room: RoomDef): Phaser.GameObjects.Container | undefined {
    const cells = roofCells(room);
    if (cells.length === 0) return undefined;
    const box = this.add.container(0, 0);
    const [w, h] = [this.map.cols * T, this.map.rows * T];
    const image = room.image && hasImage(this, room.image) ? room.image : null;
    const src = image ? this.textures.get(image).getSourceImage() : null;
    const [sx, sy] = src ? [src.width / w, src.height / h] : [1, 1];
    const runs: [number, number, number][] = [];
    for (const [c, r] of cells) {
      const last = runs[runs.length - 1];
      if (last && last[2] === r && last[1] === c - 1) last[1] = c;
      else runs.push([c, c, r]);
    }
    for (const [c0, c1, r] of runs) {
      if (image) box.add(this.add.image(0, 0, image).setOrigin(0).setDisplaySize(w, h).setCrop(c0 * T * sx, r * T * sy, (c1 - c0 + 1) * T * sx, T * sy));
      else box.add(this.add.rectangle(c0 * T, r * T, (c1 - c0 + 1) * T, T, 0x0b1118, 0.85).setOrigin(0));
    }
    return box;
  }

  /** 仲間が屋根の下のマスにいる間は、重ねた絵を半分すかす（自分の位置が分かるように。段階118） */
  private updateRoof(cell: GridCell, animate: boolean): void {
    if (!this.roof) return;
    const alpha = this.room.layout[cell[1]]?.[cell[0]] === ROOF ? 0.45 : 1;
    if (this.roof.alpha === alpha) return;
    this.tweens.killTweensOf(this.roof);
    if (animate) this.tweens.add({ targets: this.roof, alpha, duration: 200 });
    else this.roof.setAlpha(alpha);
  }

  /** 地図の調整を始める（段階117）：歩くのと敵を止め、地図の上の物を隠して、マス目と道具を出す */
  private openEditor(): void {
    if (this.editor || this.leaving || !this.world || !this.ui || this.tipOpen) return;
    this.route = [];
    this.goal = null;
    this.tweens.pauseAll();
    this.world.list.forEach((o, i) => i > 0 && (o as Phaser.GameObjects.Image).setVisible(false));
    this.editor = new MapEditor({
      scene: this,
      world: this.world,
      ui: this.ui,
      cam: this.cameras.main,
      original: this.rawArea,
      room: this.state.room,
      edits: loadMapEdits(),
      topBand: TOP_BAND,
      bottomBand: vitalsBandHeight(currentParty(storyBattleLineup()).length),
      say: (text) => this.say(text),
      close: () => {
        // 直した地図で開き直す（今いるマスが通れなくなっていても、タップすると近くの歩ける所へ歩く）
        this.leaving = true;
        this.scene.restart(this.back());
      },
    });
  }

  /** タップしたマス：話せる人・ボスなら隣まで歩いてから。それ以外はそこまで歩く */
  private tapCell(cell: GridCell): void {
    // ノイズの壁（段階63）
    const wall = this.night > 0 ? closedWalls(this.area, this.night, this.state.room).find((w) => w.cells.some((c) => c[0] === cell[0] && c[1] === cell[1])) : undefined;
    if (wall) {
      // 何晩目に開くかも言う（段階67）
      this.say(`厚いノイズの壁で、ふさがっている\n……${wall.opens}晩目、持ち主がもう少し思い出せば、ほどけそう`);
      return;
    }
    const talker = this.area.talkers.find((t) => this.here(t) && near(t.cell, cell, 0));
    // まだ開けていない宝箱は、タップした時だけ開ける（通っただけでは開かない）
    const chest = talker ? null : chestAt(this.area, this.state, cell);
    const boss = !talker && !chest && this.bossHere() && near(this.area.boss.cell, cell, 1);
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
    this.updateRoof(next, true);
    const walk = this.tweens.add({
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
    // チェックポイントで説明が出た直後の一歩は、説明を閉じるまで待つ
    if (this.tipOpen) {
      walk.pause();
      this.pausedTweens.push(walk);
    }
  }

  /** マスに着いた：チェックポイント（宝箱は通っただけでは開かない） */
  private arriveAt(cell: GridCell): void {
    const r = arrive(this.area, this.state, cell);
    this.state = r.state;
    // 出入口（段階47a）：つながった部屋へ移る。閉じていれば止まる
    const door = passDoor(this.area, this.state, cell);
    if (door?.type === 'moved') {
      this.changeRoom(door.state);
      return;
    }
    if (door?.type === 'locked') {
      this.route = [];
      this.goal = null;
      this.say(`この先は、まだ通れない。${this.lockHint(door.link.opensWhen)}`);
    }
    if (r.event.type === 'checkpoint') {
      playSe(this, SE.heal);
      this.say(`チェックポイント：${r.event.healed ? 'HP・MP が全回復した。' : ''}ここまでを記録した。下のボタンで${hubLabel()}を開ける`);
      if (r.event.healed) this.refreshVitals();
    }
    if (this.atExit(cell)) this.say('光る砂時計：今夜はここまで\n下のボタンで時計屋へ帰る');
    this.keep(this.state);
    if (r.event.type === 'checkpoint') {
      const t = pendingTrigger(this.area, this.state, 'checkpoint');
      if (t) {
        this.route = [];
        this.openTrigger(t);
      } else this.showTip(true);
    }
    // ボスの隣まで来たら
    if (this.bossHere() && near(this.area.boss.cell, cell, 1) && this.goal?.kind !== 'talk' && (this.bossReady() || this.goal?.kind === 'boss')) {
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
    const members = currentParty(storyBattleLineup());
    const lines = members.map((c) => {
      const v = vitals?.[c.id];
      const hp = `${Math.min(v?.hp ?? c.stats.hp, c.stats.hp)}/${c.stats.hp}`;
      const mp = `${Math.min(v?.mp ?? c.stats.mp, c.stats.mp)}/${c.stats.mp}`;
      return members.length > 1 ? `${c.name} HP ${hp}\nMP ${mp}` : `${c.name} HP ${hp}  MP ${mp}`;
    });
    const texts = this.vitalsTexts.length === lines.length ? lines : [lines.join('　')];
    this.vitalsTexts.forEach((t, i) => t.setText(texts[i] ?? '').setColor(vitals ? COLORS.text : COLORS.subText));
  }

  /** ボスが抱えているコマの数 */
  private bossKoma(): number {
    return AREA_BATTLES[this.area.boss.battle]?.koma ?? 0;
  }

  /** ボスに挑めるか（ボスのコマを足せば返せる数になっている。狩りでは、いつでも。段階43） */
  private bossReady(): boolean {
    return this.hunting || bossReady(this.area, this.state, this.bossKoma());
  }

  /** ボスの印が今の部屋にいるか（狩りでは、勝つとその回は消える） */
  private bossHere(): boolean {
    return !this.state.cleared && enemyActive(this.state, this.area.boss.id) && this.here(this.area.boss) && (this.night === 0 || inNight(this.area.boss, this.night));
  }

  /** 探索の状態を覚える（狩りはセーブしない run.hunt に。段階43） */
  private keep(state: ExploreState): void {
    if (this.hunting) setHuntState(state);
    else setExplore(state);
  }

  /** この画面を開き直す時のデータ（区画と、狩りかどうか） */
  private back(extra: Partial<ExploreData> = {}): ExploreData {
    return { area: this.area.id, won: undefined, lost: undefined, seen: undefined, hunt: this.hunting || undefined, night: this.night || undefined, ...extra };
  }

  /** 狩りを終えて、レストピアの拠点へ戻る（段階43。段階50から、昼の時計屋ではなく拠点へ） */
  private leaveHunt(): void {
    if (this.leaving) return;
    this.leaving = true;
    run.hunt = null;
    this.scene.start('Hub', { seen: undefined });
  }

  /** 宝箱を開けて、中身を持ち物に入れる */
  private openChestNow(chestId: string): void {
    const r = openChest(this.area, this.state, chestId);
    if (!r) return;
    this.state = r.state;
    // 落とし物の光る所（段階53）：見つけた印を付け、声が残っていれば会話を見る
    const lostId = lostOfSpot(chestId);
    if (lostId) {
      const def = LOST_ITEMS.find((d) => d.id === lostId);
      setStoryVars(findLost(run.vars, lostId));
      this.chestSprites.get(chestId)?.setFillStyle(0x3a4a3a).setStrokeStyle(2, 0x5a6a5a);
      this.tweens.killTweensOf(this.chestSprites.get(chestId) ?? []);
      playSe(this, SE.chest);
      this.say(`落とし物を見つけた！　${def?.name ?? ''}（拠点の落とし物の棚から、${def?.owner ?? ''}さんに届けられる）`);
      this.keep(this.state);
      if (def?.findScene) this.openScene(def.findScene, this.back());
      return;
    }
    // 記憶をたどる時の採取の場所は、記憶の薄れ（段階57）の割合の分だけ残る
    const fade = this.hunting ? (run.hunt?.fade ?? 1) : 1;
    const got = thinItems(r.chest.items, fade, (run.hunt?.salt ?? 0) + [...chestId].reduce((a, ch) => a + ch.charCodeAt(0), 0));
    const lostByFade = r.chest.items.length - got.length;
    // ポーチの消費アイテムは1種類 POUCH_MAX 個まで（段階51。入らなかった分は捨てる）
    const capped = capItems(WEAPON_DATA, addItems(run.armory, got));
    run.armory = capped.armory;
    const gears = r.chest.gears ?? [];
    if (gears.length > 0) run.navi = addParts(run.navi, gears);
    // スナップは持ち物に入る（段階41。チェックポイントのアルバムで入れ替える）
    const snaps = r.chest.snaps ?? [];
    if (snaps.length > 0) run.album = gainSnaps(run.album, snaps);
    const sprite = this.chestSprites.get(r.chest.id);
    if (sprite && this.hunting) {
      this.tweens.killTweensOf(sprite);
      sprite.setAlpha(1).setScale(1).setFillStyle(0x3a4a3a).setStrokeStyle(2, 0x5a6a5a);
    } else sprite?.setFillStyle(0x4a3a28).setStrokeStyle(2, 0x6b5a40);
    playSe(this, SE.chest);
    this.say(
      `${this.hunting ? '素材を拾った！' : '宝箱を開けた！'}　${[got.length > 0 ? summarize(got) : '（記憶がかすれて、何も残っていなかった）', lostByFade > 0 && got.length > 0 ? `（記憶が薄れて、${lostByFade}つは砂に戻った）` : '', gears.length > 0 ? `ギア：${gearNames(gears)}` : '', snaps.length > 0 ? `スナップ：${snapNames(snaps)}` : '', capped.overflow.length > 0 ? `（ポーチがいっぱい：${summarize(capped.overflow)}は入らなかった）` : ''].filter(Boolean).join('　')}`,
    );
    this.keep(this.state);
  }

  /** チェックポイントに立ち止まっている時だけ、育成の画面への入口を出す（段階26） */
  private updateHubButton(): void {
    if (!this.hubButton) return;
    this.hubButton.removeAll(true);
    const unlocks = storyLineup().unlocks;
    const target = unlocks.growth ? 'Growth' : unlocks.weapon ? 'Weapon' : null;
    if (this.walking || this.route.length > 0) return;
    const y = GAME_HEIGHT - 30 - vitalsBandHeight(currentParty(storyBattleLineup()).length);
    // 帰り口（段階67）に立っている：時計屋へ帰って、今夜を終える
    if (this.atExit(this.state.cell)) {
      addButton(this, this.hubButton, GAME_WIDTH / 2, target ? y - 70 : y, 240, 60, '時計屋へ帰る\n（今夜はおわり）', { onTap: () => this.finishArea() }, {
        size: 16,
        bold: true,
        fill: 0x5a4a1e,
        stroke: 0xffd84a,
        strokeWidth: 2,
      });
    }
    if (!target || !isCheckpoint(this.area, this.state.cell, this.state.room)) return;
    addButton(this, this.hubButton, GAME_WIDTH / 2, y, 240, 60, hubLabel(), { onTap: () => this.openHub(target) }, {
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
    this.keep(this.state);
    setHubReturn({ key: 'Explore', data: this.back() });
    this.scene.start(target);
  }

  /** 途中の会話を見る。見終えたら、この画面に seen を付けて戻る */
  private openTrigger(t: AreaTrigger): void {
    this.openScene(t.scene, { area: this.area.id, seen: t.scene });
  }

  private openScene(scene: string, back: ExploreData): void {
    if (this.leaving) return;
    this.leaving = true;
    this.keep(this.state);
    const data: DialogueData = {
      scene,
      // コマの値（台本の {komaHave} {komaNeed} {komaLeft}）を足して渡す。物語の値としては覚えない（段階28）
      vars: { ...run.vars, ...komaVars(this.area, this.state) },
      seed: run.seed,
      next: { key: 'Explore', data: this.back(back) },
      onVars: (vars) => setStoryVars(Object.fromEntries(Object.entries(vars).filter(([k]) => !k.startsWith('koma')))),
    };
    this.scene.start('Dialogue', data);
  }

  private startBattle(battle: string, enemyId: string): void {
    if (this.leaving) return;
    this.leaving = true;
    this.keep(this.state);
    const data: BattleSceneData = {
      encounter: {
        battle,
        win: { key: 'Explore', data: this.back({ won: enemyId }) },
        lose: { key: 'Explore', data: this.back({ lost: true }) },
        // 狩り（段階43）：同じ砂嵐と何度戦っても落とす物が変わるよう、狩りの戦闘の回数でシードをずらす
        // 段階49：前の章の区画なら、星の砂と経験値は半分
        // 記憶の薄れ（段階57）：星の砂・経験値に割合をかけ（前の章の区画の半分と重ねる）、落とした素材も割合の分だけ残す
        ...(this.hunting
          ? {
              hunt: true,
              seedShift: nextHuntCount(),
              rewardRate: huntRewardRate(areaChapter(SLICE_FLOW, this.area.id), storyLineup().chapter, HUNT_OLD_AREA_RATE) * (run.hunt?.fade ?? 1),
              dropRate: run.hunt?.fade ?? 1,
            }
          : {}),
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
    // 試しの区画は、物語の流れに戻らずタイトルへ（段階47）
    if (this.trial) {
      setExplore(null);
      this.scene.start('Title');
      return;
    }
    // 晩の終わり（段階63）も同じ：探索の状態を残して、物語の次の出来事へ（次の晩は startNight で始める所へ移る）
    setExplore(this.state);
    this.scene.start('Flow', { done: true });
  }

  /** 部屋に置いたものが、今いる部屋にあるか（段階47） */
  private here(thing: { room?: string }): boolean {
    return inRoom(this.area, thing, this.state.room);
  }

  /** つながった部屋へ移る：短く暗転して、画面を開き直す（入った直後は、戻ってきた時と同じ間だけ敵に触れても戦闘にしない） */
  private changeRoom(state: ExploreState): void {
    if (this.leaving) return;
    this.leaving = true;
    this.state = state;
    this.keep(state);
    playSe(this, SE.footsteps);
    const data = this.back();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(240, () => this.scene.restart(data));
  }

  /** 晩に分けた区画で、今夜のコマがそろったか（段階67。最後の晩は、ぬしに勝つまで終わらない） */
  private nightOver(): boolean {
    return this.night > 0 && nightDone(this.area, this.state, this.night);
  }

  /** 帰り口（段階67）のマスか */
  private atExit(cell: GridCell): boolean {
    const exit = this.nightOver() ? nightExit(this.area, this.night) : null;
    return !!exit && exit.room === this.state.room && exit.cell[0] === cell[0] && exit.cell[1] === cell[1];
  }

  /** 晩の始めの案内（段階67）：今夜の目標と、コマを持つ敵の印 */
  private nightGuide(): string {
    if (this.nightOver()) {
      const exit = nightExit(this.area, this.night);
      const where = exit && exit.room !== this.state.room ? '（右上の地図の、金色の縁の部屋）' : '';
      return `今夜のコマはそろった\n光る砂時計${where}まで歩くと、時計屋へ帰れる`;
    }
    const goal = nightGoal(this.area, this.state, this.night);
    const mark = '金色の砂時計の印の砂嵐が、コマを持っている';
    if (goal.last) return `${this.night}晩目（最後の晩）：コマを集めて、ぬしを起こそう\n${mark}`;
    return `${this.night}晩目：今夜はコマを${goal.need - goal.have}つ集める\n${mark}`;
  }

  /** コマを手に入れた時の、残りの言い方 */
  private komaNote(): string {
    const left = komaLeft(this.area, this.state);
    if (this.night === 0) return left > 0 ? `あと${left}つで返せる` : 'そろった';
    const goal = nightGoal(this.area, this.state, this.night);
    if (this.nightOver()) return '今夜の分がそろった。光る砂時計から帰れる';
    if (goal.last) return left > this.bossKoma() ? `あと${left}つで返せる` : 'あとは、ぬし';
    return `今夜 ${goal.have}/${goal.need}`;
  }

  /** 金色の小さな砂時計（コマを持つ敵の印と、帰り口。段階67） */
  private komaMark(x: number, y: number, scale = 1): Phaser.GameObjects.Graphics {
    const w = 7 * scale;
    const h = 9 * scale;
    const g = this.add.graphics({ x, y });
    g.fillStyle(0xffd84a, 1).lineStyle(Math.max(1.5, scale), 0x5a3a00, 1);
    g.fillTriangle(-w, -h, w, -h, 0, 0).strokeTriangle(-w, -h, w, -h, 0, 0);
    g.fillTriangle(-w, h, w, h, 0, 0).strokeTriangle(-w, h, w, h, 0, 0);
    return g;
  }

  /** 閉じた出入口の手がかり（開ける印が敵なら「◯◯の番人を倒すと開く」） */
  private lockHint(opensWhen: string | undefined): string {
    if (opensWhen === this.area.boss.id) return 'ぬしを倒すと開く';
    const e = this.area.enemies.find((x) => x.id === opensWhen);
    if (!e) return '';
    return e.move === 'guard' ? '近くの番人を倒すと開く' : 'どこかの砂嵐を倒すと開く';
  }

  /** 敵の印：敵の絵（ENEMY_ART）を小さく。絵のない敵は赤い菱形。番人は少し大きく、逃げる敵は光らせる（段階47b） */
  private enemySprite(battle: string, move: EnemyMove, at: GridCell): Phaser.GameObjects.Container {
    const sprite = this.add.container(at[0] * T + T / 2, at[1] * T + T / 2);
    const size = move === 'guard' ? 1.35 : 1;
    if (move === 'flee') {
      const glow = this.add.circle(0, 0, T * 0.6, 0xffe08a, 0.45);
      sprite.add(glow);
      this.tweens.add({ targets: glow, alpha: 0.1, scale: 1.3, yoyo: true, repeat: -1, duration: 600 });
    }
    const art = ENEMY_ART[AREA_BATTLES[battle]?.enemies[0]?.id ?? ''];
    if (art && hasImage(this, art)) {
      const img = this.add.image(0, 0, art);
      img.setScale((T * 1.1 * size) / Math.max(img.width, img.height));
      sprite.add(img);
      // 同じポーズのまま止まって見えないよう、少し上下に揺らす（段階115。テストプレイのメモ 35）。歩く向きは stepEnemy で左右を返す
      this.tweens.add({ targets: img, y: -T * 0.08, yoyo: true, repeat: -1, duration: 520 + Math.floor(Math.random() * 160), ease: 'Sine.easeInOut' });
      sprite.setData('art', img);
    } else {
      sprite.add(this.add.rectangle(0, 0, T * 0.62 * size, T * 0.62 * size, COLORS.enemy).setAngle(45).setStrokeStyle(2, move === 'flee' ? 0xffe08a : 0xffffff));
    }
    if (move === 'guard') sprite.add(addText(this, 0, T * 0.7, '番人', { size: 10, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    return sprite;
  }

  /** 敵の印の次の1歩（動き方ごと。core/explore.ts の enemyNext）。番人は動かない */
  private stepEnemy(e: Enemy): void {
    const tuning = ENEMY_MOVES[e.move];
    if (e.move === 'guard' || tuning.stepMs <= 0) return;
    const player = this.nextCell ?? this.state.cell;
    e.mind = enemyNext(this.map, e.move, e.route, e.mind, player, tuning);
    e.alert?.setVisible(e.mind.chasing);
    const [c, r] = e.mind.cell;
    // 歩く向きに絵を向ける（左へ歩く時は左右を返す。上下に歩く時は今の向きのまま）
    const img = e.sprite.getData('art') as Phaser.GameObjects.Image | undefined;
    const dx = c * T + T / 2 - e.sprite.x;
    if (img && dx !== 0) img.setFlipX(dx < 0);
    this.tweens.add({ targets: e.sprite, x: c * T + T / 2, y: r * T + T / 2, duration: tuning.stepMs, onComplete: () => this.stepEnemy(e) });
  }

  /** 全体の地図（段階47a）：入った部屋とつながり。今いる部屋は明るく */
  private drawRoomMap(): Phaser.GameObjects.Container {
    const pos = roomPositions(this.area);
    const seen = this.state.visited.filter((id) => pos[id]);
    const xs = seen.map((id) => pos[id][0]);
    const ys = seen.map((id) => pos[id][1]);
    const w = 18;
    const h = 14;
    const gap = 8;
    const cols = Math.max(...xs) - Math.min(...xs) + 1;
    const rows = Math.max(...ys) - Math.min(...ys) + 1;
    const box = this.add.container(GAME_WIDTH - 12 - cols * (w + gap), 140);
    box.add(this.add.rectangle(-6, -6, cols * (w + gap) + 4, rows * (h + gap) + 4, 0x000000, 0.5).setOrigin(0));
    const at = (id: string): [number, number] => [(pos[id][0] - Math.min(...xs)) * (w + gap) + w / 2, (pos[id][1] - Math.min(...ys)) * (h + gap) + h / 2];
    const g = this.add.graphics().lineStyle(2, 0x8a9aaa, 1);
    for (const link of this.area.links ?? []) {
      if (!seen.includes(link.a.room) || !seen.includes(link.b.room)) continue;
      const [x1, y1] = at(link.a.room);
      const [x2, y2] = at(link.b.room);
      g.lineBetween(x1, y1, x2, y2);
    }
    box.add(g);
    // 帰り口（段階67）のある部屋は、金色の縁
    const exitRoom = this.nightOver() ? nightExit(this.area, this.night)?.room : undefined;
    for (const id of seen) {
      const [x, y] = at(id);
      const now = id === this.state.room;
      const exit = id === exitRoom;
      box.add(this.add.rectangle(x, y, w, h, now ? 0xffd84a : 0x3a4a5a).setStrokeStyle(exit ? 3 : 1, exit ? 0xffb020 : now ? 0xffffff : 0x8a9aaa));
    }
    return box;
  }

  private say(text: string): void {
    if (!this.message) return;
    this.lastMessage = text;
    this.message.setText(text).setAlpha(1);
    this.messageHint?.setAlpha(0);
    this.messageTimer?.remove();
    // 段階98：5秒で消し、帯に「もう一度見る」を出す（前は 2.8秒で薄くするだけで、地図の絵と重なって読みにくかった）
    this.messageTimer = this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: this.message, alpha: 0, duration: 400 });
      if (this.messageHint) this.tweens.add({ targets: this.messageHint, alpha: 0.8, duration: 400 });
    });
  }
}

/** 上の帯（区画の名前・コマ・連携技と、その下の案内）の高さ */
const TOP_BAND = 132;

/** 下の帯（仲間の HP・MP）の高さ。2人以上の時は2行で、下の端のビルド日時の分だけ高い */
function vitalsBandHeight(members: number): number {
  return members > 1 ? 48 : 26;
}
/** HP・MP を仲間ごとの列に並べる幅（右下の設定のボタンの左まで） */
const VITALS_WIDTH = GAME_WIDTH - 56;

/** 育成の入口のボタンの名前（開いている育成だけ。「星図・武器」など） */
function hubLabel(): string {
  const u = storyLineup().unlocks;
  return [u.growth && '星図', u.navi && 'ムーブメント', u.weapon && '武器'].filter(Boolean).join('・');
}

/** 2つのマスが、range マス以内（縦横斜め）か */
function near(a: GridCell, b: GridCell, range: number): boolean {
  return Math.abs(a[0] - b[0]) <= range && Math.abs(a[1] - b[1]) <= range;
}

/** ギアの名前を「、」でつなぐ */
function gearNames(ids: string[]): string {
  return ids.map((id) => NAVI_DATA.parts[id]?.name ?? id).join('、');
}

/** 「スライムゼリー×2、ポーション」のようにまとめる */
function summarize(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${(ITEMS as Record<string, { name: string }>)[id]?.name ?? id}${n > 1 ? `×${n}` : ''}`).join('、');
}
