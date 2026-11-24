import Phaser from 'phaser';
import { battleSceneFor, keepChainWeak, knownChainWeak } from './chainEncounter';
import { ensureDigHero, type DigHeroSprite } from './digArt';
import type { AreaDef, AreaEnemy, AreaEvent, AreaTrigger, EnemyMind, EnemyMove, ExploreState, GridCell, GridMap, RoomDef } from '../core';
import {
  closedWalls,
  unvisitedDoors,
  inNight,
  nightArea,
  nightDone,
  nightExit,
  nightGoal,
  memoryRestored,
  startNight,
  gainSnaps,
  recordLibraryFinds,
  addParts,
  enemyNext,
  enemyShown,
  markEvent,
  pendingEvent,
  restVitals,
  takeGift,
  closedGates,
  gadgetArea,
  gadgetAt,
  gadgetsShown,
  useGadget,
  ambushKind,
  facingOf,
  sightFan,
  SHADE,
  spotted,
  startFacing,
  exploreTipTriggers,
  nextTip,
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
  findPathDiag,
  dragStep,
  dirOfDrag,
  normalizeExplore,
  isCheckpoint,
  komaLeft,
  komaVars,
  loseBattle,
  markTrigger,
  nearestWalkable,
  reachableNear,
  openChest,
  patrolRoute,
  pendingTrigger,
  triggerGears,
  startExplore,
  applyMapEdits,
  isEmptyMapEdits,
  roofCells,
  entryCells,
  roofMask,
  isShade,
  ROOF_SPLIT,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { hasImage } from '../assets/loader';
import { getSettings, playBgm, playKoma, playSe, prefetchBgm, stopAmbience } from '../audio/sound';
import { A11_BON, A11_CHEST_ART, A11_CROWD, CROWD_LOOK, A11_DECOR, SCENES, TALKER_ART, A11_GATE_ART, A11_PROP_ART, A11_REWORK, AREA_BATTLES, EXPLORE_TENSION, SCREEN_COACH, TIPS, areaTraitHints, BGM, CHAIN_SNAPS, ROOM_NAMES, AREA_GRACE_MS, AREA_STEP_MS, AREA_TILE, AREAS, ENEMY_ART, ENEMY_MOVES, ITEMS, NAVI_DATA, SE, traitHintLine, TRIAL_AREAS, WEAPON_DATA } from '../data';
import { isDebugEnabled, trialOff, trialOn } from '../debug/debugFlag';

/** 回復と負けの重み（段階255）。デバッグメニューで切った時は前の形 */
const tensionRules = () => (trialOff('tension') ? undefined : EXPLORE_TENSION);
import { loadMapEdits } from '../debug/mapEdits';
import { MapEditor } from './mapEditor';
import { COLORS, RENDER_SCALE, STYLE } from '../ui/theme';
import { GOLD_BUTTON } from '../ui/frame';
import { addButton, addText, makePressable } from '../ui/widgets';
import { maybeShowTip, seenTips } from '../ui/tipPanel';
import { startScreenCoach } from '../ui/screenCoach';
import type { BattleSceneData } from './chainEncounter';
import type { DialogueData } from './DialogueScene';
import { currentParty, run, setCampReturn, setExplore, setHubReturn, setStoryVars, storyBattleLineup, storyLineup } from './run';
import { notePlayBattle } from './playRecord';

// 探索（段階25）：区画の地図を歩く。タップした所まで最短の道で歩き、宝箱を開け、敵の印に触れると戦闘になる。
// 戦闘・会話から戻る時は、この画面をもう一度開く（いる場所や倒した敵は、セーブした探索の状態から戻す）。
// 区画のボスに勝ち、その後の会話を見たら、物語の流れへ done で戻る。
// 段階47：区画は部屋を出入口でつないだもの。出入口のマスに着くと、短く暗転して、つながった部屋の出入口の内側に出る（画面を開き直す）。
// 敵の印は、動き方の種類ごとに1歩ずつ行き先を決める（core/explore.ts の enemyNext）
// 段階43 の狩り（記憶をたどる）は、段階213 で砂の底に置き換えて外した（段階237 でコードも片付けた）

const T = AREA_TILE;
/** 出し抜くの案内（段階263）を、この起動の間に出したか */
let stealthGuideShown = false;

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
  /** 開き直した後に、上の帯に出す言葉（段階264：仕掛けが解けて地図を作り直した時） */
  notice?: string;
  /** 話し終えて戻ってきた写しの人（段階265。くれる物を渡す） */
  talked?: string;
  /** 開き直した後に起こす地図の出来事（段階266：仕掛けが解けた時の地図の出来事） */
  event?: string;
  /** 晩に分けた区画の、何晩目か（段階63。物語の流れの探索の出来事が決める） */
  night?: number;
  /**
   * 地図直しの試し歩き（段階121。デバッグメニューから区画・晩・部屋を選んで開く）：セーブに書かず、敵に触れても戦闘にならず、
   * 人・宝箱・ぬし・チェックポイントにも反応しない。room・cell はいる所、edit は開いてすぐ地図直しを出すか
   */
  tune?: { room: string; cell?: GridCell; edit?: boolean };
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
  /** 出し抜く（段階263）：向いている向きと、仲間を見つけたか */
  facing: GridCell;
  spotted: boolean;
}

export class ExploreScene extends Phaser.Scene {
  private area!: AreaDef;
  /** 今いる部屋（段階47） */
  private room!: RoomDef;
  /** デバッグメニューの試しの区画（段階47。物語の流れには戻らない） */
  private trial = false;
  /** 狩りの途中（段階43） */
  /** 晩に分けた区画の、何晩目か（段階63。晩に分けていない区画と狩りは 0） */
  private night = 0;
  private map!: GridMap;
  private state!: ExploreState;
  private player!: Phaser.GameObjects.Container;
  private route: GridCell[] = [];
  private nextCell: GridCell | null = null;
  private walking = false;
  /** 道の終わりで話す人・開ける宝箱・ボス */
  private goal: { kind: 'talk'; id: string } | { kind: 'chest'; id: string } | { kind: 'gadget'; id: string } | { kind: 'boss' } | null = null;
  private enemies: Enemy[] = [];
  /** この時刻までは、敵の印に触れても戦闘にしない（戻ってきた直後など） */
  private graceUntil = 0;
  /** 出し抜く（段階263。新しい1-1 の試しだけ）：見つかる範囲・陰・不意打ち */
  private stealth = false;
  /** 地図の出来事（段階266）の途中（歩く・タップ・砂嵐を止める） */
  private eventRunning = false;
  /** 一緒に歩く仲間（段階267。新しい1-1 の試しだけ）：先頭と、後ろをついて歩く仲間の2頭身の絵。trail は先頭が歩いてきたマス（新しい順） */
  private walkers = false;
  private party: { id: string; box: Phaser.GameObjects.Container; img: Phaser.GameObjects.Sprite; art: DigHeroSprite; walk?: string }[] = [];
  private trail: GridCell[] = [];
  private sightView?: Phaser.GameObjects.Graphics;
  /** 初めての人向けの説明を出している間は、敵も自分も止める（段階30） */
  private tipOpen = false;
  /** 地図（仲間について動くカメラで映すもの） */
  private world?: Phaser.GameObjects.Container;
  /** 説明を出している間だけ止めている、地図の上の動き */
  private pausedTweens: Phaser.Tweens.Tween[] = [];
  /** 別の画面へ移る途中（重ねて移らないように） */
  private leaving = false;
  /** 盆踊りの輪の踊り手（段階283） */
  private dancers: { im: Phaser.GameObjects.Image; a: number; left: boolean }[] = [];
  /** 段階284：通行人と踊り手（思い出の戻り具合で色を変える）と、この部屋に戻る前の戻り具合（コマを手に入れて戻った時だけ） */
  private crowdIms: Phaser.GameObjects.Image[] = [];
  private restoreFrom: number | null = null;

  /** 盆踊りの輪を少し回す（角度が増える向き。下を歩く人は左へ、上を歩く人は右へ） */
  private moveDancers(dt: number): void {
    for (const d of this.dancers) {
      d.a += dt * 0.00018;
      const x = (A11_BON.cx + A11_BON.rx * Math.cos(d.a)) * T;
      const y = (A11_BON.cy + A11_BON.ry * Math.sin(d.a)) * T;
      const goLeft = -Math.sin(d.a) < 0;
      d.im.setPosition(x, y + Math.sin(d.a * 9) * 1.5);
      d.im.setFlipX(goLeft !== d.left);
    }
  }

  /** 地図の出来事の「光らせる」で灯す電球の列（段階281）と、それを待っているか */
  private litDecor: Phaser.GameObjects.Image[] = [];
  private pendingLight = false;
  /** 停電の暗がり（物の上にかぶせる） */
  private darkLayer?: Phaser.GameObjects.Container;
  /** 全体の地図（印を付け直す時に描き直す） */
  private roomMapBox?: Phaser.GameObjects.Container;
  /** 仕掛けの上の吹き出し（2026-11-24。仲間や屋台の絵より上） */
  private bubbleLayer?: Phaser.GameObjects.Container;
  /** 足もとの高さの順に重ねる物（段階273） */
  private sortLayer?: Phaser.GameObjects.Container;
  /** 小物の絵のうち、足もとの順に重ねている物（仕掛けを描き直す時に消す） */
  private sortedProps: Phaser.GameObjects.GameObject[] = [];
  /** 調べるボタン（段階278）と、調べる物の上の「！」 */
  private actionButton?: Phaser.GameObjects.Container;
  private actionMark?: Phaser.GameObjects.Text;
  /** 先頭が最後に歩いた向き（調べる物を選ぶ時、向いている方を先に見る） */
  private lastDir: GridCell = [0, 1];
  private chestSprites = new Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>();
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
  /** 地図直しの試し歩き（段階121） */
  private tune: ExploreData['tune'] | null = null;
  /** 地図の調整の途中（段階117。?debug=1 の時だけ） */
  private editor: MapEditor | null = null;
  /** 屋根や木の下（段階118）に重ねる、地図の絵の切り抜き */
  private roof?: Phaser.GameObjects.Image;

  constructor() {
    super('Explore');
  }

  create(data: ExploreData): void {
    // 段階262：デバッグの切り替えで、新しい1-1（マス目の試し）
    const raw = data.area === 'a11' && trialOn('a11rework') ? A11_REWORK : (AREAS[data.area] ?? TRIAL_AREAS[data.area]);
    if (!raw) throw new Error(`unknown area ${data.area}`);
    // 地図の調整（段階117）：?debug=1 の時だけ、端末に覚えた直しを重ねる
    this.rawArea = raw;
    this.editor = null;
    const base = isDebugEnabled(window.location.search) ? applyMapEdits(raw, loadMapEdits()) : raw;
    // 晩に分けた区画（段階63）：その晩の壁と、その晩に出るものだけ
    this.night = base.nights ? (data.night ?? 1) : 0;
    const area = this.night > 0 ? nightArea(base, this.night) : base;
    this.area = area;
    this.trial = !AREAS[data.area];
    this.stealth = raw === A11_REWORK;
    this.walkers = raw === A11_REWORK;
    this.tune = data.tune ?? null;
    stopAmbience();
    this.route = [];
    this.nextCell = null;
    this.walking = false;
    this.goal = null;
    this.enemies = [];
    this.leaving = false;
    this.chestSprites = new Map();
    this.dancers = [];
    this.talkerBubbles = new Map();
    // 育成の画面から戻ってきた（または別の道で来た）ので、育成の画面の戻り先は忘れる
    setHubReturn(null);
    this.graceUntil = this.time.now + AREA_GRACE_MS;
    this.tipOpen = false;
    this.eventRunning = false;
    this.world = undefined;
    this.pausedTweens = [];

    let state = run.explore?.area === area.id ? run.explore : startExplore(area);
    // 段階262：今の1-1 と新しい1-1 を切り替えた時、部屋が合わなければ、残せる物（倒した敵・開けた宝箱・コマ）を残して最初の部屋から
    if (!area.rooms.some((r) => r.id === state.room)) state = normalizeExplore(base, state) ?? startExplore(area);
    // 新しい晩なら、その晩を始める所から（段階63）
    if (this.night > 0) state = startNight(base, state, this.night);
    // 地図直しの試し歩き（段階121）：選んだ部屋の、選んだマス（なければ S・P か、出入口の内側）から。全部の部屋に入ったことにする
    if (this.tune) {
      const room = roomOf(area, this.tune.room);
      state = { ...startExplore(area), room: room.id, cell: this.tune.cell ?? tuneStart(room), visited: area.rooms.map((r) => r.id) };
    }
    let note = data.notice ?? '';
    let komaGot = 0;
    // 遊んだ記録（段階32b）：探索の戦闘の勝ち負けを、今の出来事のものとして数える
    if (data.won && !this.trial) notePlayBattle(run.event, true);
    if (data.lost && !this.trial) notePlayBattle(run.event, false);
    if (data.won) {
      // 倒した印の戦闘のコマを手に入れる（段階28。同じ印で2回もらわないよう、まだ倒していなかった時だけ）
      const battleId = data.won === area.boss.id ? area.boss.battle : area.enemies.find((e) => e.id === data.won)?.battle;
      if (!state.defeated.includes(data.won)) komaGot = AREA_BATTLES[battleId ?? '']?.koma ?? 0;
      const before = memoryRestored(area, state);
      state = addKoma(defeatEnemy(state, data.won), komaGot);
      this.restoreFrom = komaGot > 0 ? before : null;
      if (data.won === area.boss.id) state = { ...state, cleared: true };
    }
    if (data.lost) {
      // 段階255：最後に記録した後に倒した砂嵐が戻る（コマを持つ砂嵐は戻さない。同じ印でコマを2回もらわないため）
      const keep = (id: string) => (AREA_BATTLES[area.enemies.find((e) => e.id === id)?.battle ?? '']?.koma ?? 0) > 0;
      const back = loseBattle(state, tensionRules(), keep);
      const revived = back.revived?.length ?? 0;
      const { revived: _r, ...rest } = back;
      state = rest;
      note = revived > 0 ? `チェックポイントへ戻った。倒した砂嵐が ${revived} 体、戻ってきた` : 'チェックポイントへ戻った';
    }
    // 会話のごほうびのギア（段階38。2-1 の銭湯の前で、みおが拾った歯車など）
    const gears = data.seen ? triggerGears(area, state, data.seen) : [];
    if (gears.length > 0) {
      run.navi = addParts(run.navi, gears);
      note = `ギアを手に入れた！　${gearNames(gears)}`;
    }
    if (data.seen) state = markTrigger(state, data.seen);
    // 写しの人がくれる物（段階265）：話し終えて戻ってきた時に、1人1回
    const talked = data.talked ? area.talkers.find((t) => t.id === data.talked) : undefined;
    const got = talked ? takeGift(state, talked) : null;
    if (got) {
      state = got.state;
      if (got.gift.kind === 'weak') {
        const known = knownChainWeak(true);
        const list = known[got.gift.enemy] ?? [];
        if (!list.includes(got.gift.element)) keepChainWeak(true, { ...known, [got.gift.enemy]: [...list, got.gift.element] });
      }
      if (got.gift.kind === 'rest') {
        const max = Object.fromEntries(currentParty(storyBattleLineup()).map((c) => [c.id, { hp: c.stats.hp, mp: c.stats.mp }]));
        state = restVitals(state, got.gift.rate, max);
      }
      note = got.gift.text;
    }
    this.state = state;
    // 仕掛けの扉と仕掛け（段階264）：まだ解いていない扉と、出ている仕掛けのマスは通れない
    if (area.gates?.length || area.gadgets?.length) this.area = gadgetArea(area, state, this.night);
    this.room = roomOf(this.area, state.room);
    this.map = areaGrid(this.area, state.room);
    this.keep(state);
    if (this.tune) {
      if (area.bgm) playBgm(this, area.bgm);
      this.draw();
      this.say('地図直しの試し歩き：セーブせず、敵・人・宝箱にも反応しない。出入口から隣の部屋へ移れる');
      this.cameras.main.fadeIn(200, 0, 0, 0);
      if (this.tune.edit) this.openEditor();
      return;
    }

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

    // 段階281：これから起きる地図の出来事に「光らせる」があれば、灯す物は隠しておく
    const queuedEv = data.event ? (this.area.events ?? []).find((x) => x.id === data.event && !(this.state.flags ?? []).includes(`event:${x.id}`)) : undefined;
    this.pendingLight = !!queuedEv?.steps.some((st) => st.do === 'light');
    this.draw();
    // 戦闘に入った時にすぐ曲が変わるよう、戦闘の曲を先に読んでおく
    prefetchBgm([BGM.battle, BGM.boss]);
    const left = komaLeft(area, state);
    this.say(
      note ||
        (data.won
          ? `${data.won === area.boss.id ? 'ぬし' : '砂嵐'}を倒した。${komaGot > 0 ? `コマを${komaGot}つ手に入れた（${this.komaNote()}）` : data.won === area.boss.id ? '' : '（コマは持っていなかった）'}`
          : this.night > 0
            ? this.nightGuide()
            : (area.goal?.guide ?? 'タップした場所まで歩く。宝箱はタップで開ける。敵の印に触れると戦闘')) +
        // 区画の予告（段階201）：入った時に、この先に多い性質と効くギア
        (note || data.won || data.lost ? '' : this.traitForecast(false)) +
        // 出し抜くの案内（段階263。新しい1-1 の試しで、最初の1回だけ）
        (this.stealth && !stealthGuideShown && !note && !data.won ? ((stealthGuideShown = true), '\n砂嵐の前の砂色のマスに入ると見つかる。緑の陰にいる間は見つからない。見つかる前に触れると不意打ち！') : ''),
    );
    this.cameras.main.fadeIn(300, 0, 0, 0);
    // 地図の出来事（段階266）：仕掛けが解けた時の地図の出来事と、部屋に入った時の地図の出来事
    const queued = data.event ? (this.area.events ?? []).find((x) => x.id === data.event && !(this.state.flags ?? []).includes(`event:${x.id}`)) : undefined;
    // 段階281：倒した敵がきっかけの地図の出来事（池の霧の砂嵐を倒すと、霧が晴れる）
    const onWon = data.won ? pendingEvent(this.area, this.state, this.night, this.state.room, { on: 'solved', flag: data.won }) : null;
    const onRoom = queued ?? onWon ?? pendingEvent(this.area, this.state, this.night, this.state.room, { on: 'room' });
    if (onRoom) this.time.delayedCall(420, () => void this.runEvent(onRoom));
    // コマを手に入れた音。画面が明るくなってから（段階31c の残り。そろった時は3音）
    if (komaGot > 0) this.time.delayedCall(300, () => playKoma(this, left <= 0));
    this.showTip(false);
  }

  /** 照らす所（段階236）：上のコマの数・「休憩する」のボタン */
  private coachRect(t: string): { x: number; y: number; w: number; h: number } | null {
    if (t === 'koma') return { x: 16, y: 24, w: GAME_WIDTH - 32, h: 30 };
    if (t === 'rest') {
      const y = GAME_HEIGHT - 30 - vitalsBandHeight(currentParty(storyBattleLineup()).length);
      return { x: GAME_WIDTH / 2 - 130, y: y - 36, w: 260, h: 72 };
    }
    return null;
  }

  /** 今の場面の初めての説明があれば出す。出している間は動きを止め、閉じたら少しの間は敵に触れても戦闘にしない */
  private showTip(atCheckpoint: boolean): void {
    if (this.tipOpen || this.leaving) return;
    const before = new Set(this.children.list);
    const onClose = () => {
      this.tipOpen = false;
      for (const t of this.pausedTweens) t.resume();
      this.pausedTweens = [];
      this.graceUntil = this.time.now + AREA_GRACE_MS;
      // 同じ場面で当てはまる次の説明を続けて出す（段階32b）
      this.showTip(atCheckpoint);
    };
    const triggers = exploreTipTriggers(this.state, { atCheckpoint });
    const tip = nextTip(TIPS, seenTips(), triggers);
    if (!tip) return;
    // 段階236：照らす案内（戦闘と同じ形）。案内の手順がない説明は、今までどおり説明の窓
    // 案内は画面の文字用のカメラだけに映す（地図用のカメラにも映ると、地図の左上に暗い幕がもう1枚重なる）
    const steps = SCREEN_COACH[tip.id];
    const shown = steps
      ? startScreenCoach(this, tip.id, steps, (t) => this.coachRect(t), onClose, (layer) => this.cameras.main.ignore(layer))
      : maybeShowTip(this, triggers, onClose);
    if (!shown) return;
    this.tipOpen = true;
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
          // 陰（段階263：隠れられる所）は、暗い緑に草の点
          if (ch === SHADE) {
            g.fillStyle(0x16301f, 1).fillRect(c * T, r * T, T, T);
            g.fillStyle(0x2f5a3a, 1).fillRect(c * T + 6, r * T + 8, 4, 4).fillRect(c * T + 20, r * T + 18, 4, 4).fillRect(c * T + 12, r * T + 24, 3, 3);
          }
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

    // まだ入っていない部屋への出入口（段階112）：光る矢印と、その部屋の名前
    {
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
    // 足もとの高さの順に重ねる物（段階273）：部品・小物・宝箱・仲間・敵。毎フレーム並べ直す（手前の物ほど上）
    const sortLayer = this.add.container(0, 0);
    this.sortLayer = sortLayer;
    this.sortedProps = [];
    for (const p of room.parts ?? []) {
      const key = `part.${p.part}`;
      if (!hasImage(this, key)) continue;
      const w = (p.sw ?? p.w) * T;
      const im = this.add.image((p.cell[0] + p.w / 2) * T, (p.cell[1] + 1) * T, key).setOrigin(0.5, 1);
      im.setDisplaySize(w, (w * im.height) / im.width);
      // 歩ける飾り（縄など）は、いつも仲間の下
      im.setData('foot', p.walk ? -1 : (p.cell[1] + 1) * T);
      im.setData('fade', true);
      sortLayer.add(im);
    }
    // 宝箱
    for (const chest of area.chests) {
      if (!this.here(chest)) continue;
      const opened = this.state.openedChests.includes(chest.id);
      const [x, y] = [chest.cell[0] * T + T / 2, chest.cell[1] * T + T / 2];
      // 段階271：宝箱の絵が読めていれば、絵で（新しい1-1）
      const art = this.propArt(opened ? A11_CHEST_ART.open : A11_CHEST_ART.closed);
      const box = art ? this.propImage(art, chest.cell, 1.1) : this.add.rectangle(x, y, T * 0.7, T * 0.55, opened ? 0x4a3a28 : 0x9a6a2f).setStrokeStyle(2, opened ? 0x6b5a40 : 0xffd84a);
      this.chestSprites.set(chest.id, box);
      if (art) sortLayer.add(box);
      else world.add(box);
    }
    // 仕掛けの扉と仕掛け（段階264。絵が届くまでの仮の印）
    this.bubbleLayer = this.add.container(0, 0);
    this.darkLayer = this.add.container(0, 0);
    this.drawGadgets(world);
    world.add(sortLayer);
    // 停電の暗がりは、宝箱や小物の上にかぶせる（2026-11-24 開発者：暗がりに宝箱が浮いて見えた）
    world.add(this.darkLayer);
    world.add(this.bubbleLayer);
    // 話せる人（写しの人々）。半分すけた人影と、吹き出し
    for (const t of area.talkers) {
      if (!this.here(t)) continue;
      const x = t.cell[0] * T + T / 2;
      const y = t.cell[1] * T + T / 2;
      // 段階280：写しの人の二頭身の絵（label から）。少しセピア色にして、すこし透かす（写し）。絵がなければ今までの灰色の人影
      const art = TALKER_ART[t.label ?? ''];
      const figure = art && hasImage(this, art) ? this.add.image(x, (t.cell[1] + 1) * T - 2, art).setOrigin(0.5, 1) : null;
      if (figure) {
        // 段階284：話せる写しの人は、セピアにせずはっきり描き、足元にうすい光の輪（色の戻りかけの通行人と見分ける）
        figure.setScale((T * 1.55) / figure.height);
        figure.setData('foot', (t.cell[1] + 1) * T);
        const glow = this.add.ellipse(x, (t.cell[1] + 1) * T - 4, T * 1.1, T * 0.42, CROWD_LOOK.talkerGlow.color, CROWD_LOOK.talkerGlow.alpha);
        glow.setStrokeStyle(2, CROWD_LOOK.talkerGlow.ring, 0.9).setData('foot', (t.cell[1] + 1) * T - 1);
        sortLayer.add(glow);
        this.tweens.add({ targets: glow, alpha: 0.55, scaleX: 1.08, scaleY: 1.08, yoyo: true, repeat: -1, duration: 1300 });
        sortLayer.add(figure);
        this.tweens.add({ targets: figure, scaleY: figure.scaleY * 1.02, yoyo: true, repeat: -1, duration: 1100 + (t.cell[0] % 5) * 90 });
      } else world.add(this.add.ellipse(x, y, T * 0.6, T * 0.8, 0xc8d0e0, 0.55));
      // 段階265：くれる物がある人は、吹き出しを、くれる物の印に（弱点＝弱・一息＝休・場所の手がかり＝地）。もらった後は薄く
      const giftMark = t.gift ? { weak: '弱', rest: '休', hint: '地' }[t.gift.kind] : '…';
      const given = !!t.gift && (this.state.flags ?? []).includes(`gift:${t.id}`);
      // 段階280（開発者：くれる物の中身は話してからのお楽しみ）：二頭身の絵の人には、場所が分かる吹き出しだけ
      if (figure && this.bubbleLayer) {
        const b = this.addGadgetBubble(this.bubbleLayer, x, (t.cell[1] + 1) * T - T * 1.75, '…');
        if (given) b.setAlpha(0.35);
        this.talkerBubbles.set(t.id, b);
        continue;
      }
      const bubble = addText(this, x, y - (figure ? T * 1.45 : T * 0.75), giftMark, { size: 14, bold: true, color: t.gift ? '#ffd84a' : '#ffffff' }).setOrigin(0.5).setAlpha(given ? 0.35 : 1);
      if (t.gift && !given) bubble.setStroke('#3a2a00', 4);
      if (figure && this.bubbleLayer) this.bubbleLayer.add(bubble);
      else world.add(bubble);
      this.tweens.add({ targets: bubble, y: bubble.y - 4, yoyo: true, repeat: -1, duration: 700 });
    }
    // 段階283：通り抜けられる写しの人々と、盆踊りの輪（セピア色で少し透かす）
    this.dancers = [];
    this.crowdIms = [];
    for (const c of A11_CROWD) {
      if (c.room !== room.id || !hasImage(this, c.image)) continue;
      const im = this.add.image((c.cell[0] + 0.5) * T, (c.cell[1] + 1) * T - 2, c.image).setOrigin(0.5, 1);
      this.crowdIms.push(im);
      im.setScale((T * 1.5) / im.height);
      sortLayer.add(im);
      if (c.walk) {
        const [a, b] = c.walk;
        // 行ったり来たり。歩く向きに合わせて左右を返す（face は、絵がもともと向いている側。段階283b）
        const go = (to: number, toRight: boolean, next: () => void) => {
          im.setFlipX(toRight === (c.face === 'left'));
          this.tweens.add({ targets: im, x: (to + 0.5) * T, duration: Math.max(400, Math.abs((to + 0.5) * T - im.x) * 28), ease: 'Linear', onComplete: next });
        };
        const loop = (): void => go(b, true, () => go(a, false, loop));
        loop();
      }
      this.tweens.add({ targets: im, y: im.y - 1.5, yoyo: true, repeat: -1, duration: 420 + (c.cell[0] % 4) * 60 });
    }
    if (A11_BON.room === room.id) {
      A11_BON.dancers.forEach((d, k) => {
        if (!hasImage(this, d.image)) return;
        const im = this.add.image(0, 0, d.image).setOrigin(0.5, 1);
        this.crowdIms.push(im);
        im.setScale((T * 1.5) / im.height);
        sortLayer.add(im);
        this.dancers.push({ im, a: (k / A11_BON.dancers.length) * Math.PI * 2, left: d.left });
      });
      this.moveDancers(0);
    }
    this.paintCrowd();
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
    // 見つかる範囲（段階263）：砂嵐の前の、薄い砂の色のマス。見つかったら赤
    if (this.stealth) {
      this.sightView = this.add.graphics();
      world.add(this.sightView);
    }
    // タップした所の印
    this.marker = this.add.circle(0, 0, 6, 0xffd84a, 0.8).setVisible(false);
    world.add(this.marker);
    // 敵の印（倒したものは出さない）
    for (const e of area.enemies) {
      // 地図の出来事（段階266）で湧くまで隠れている砂嵐は出さない
      if (!enemyActive(this.state, e.id) || !this.here(e) || !enemyShown(this.state, e)) continue;
      this.addEnemy(e, sortLayer);
    }
    // 仲間（ハルト）：小さくした立ち絵を足元の影の上に（歩くアニメーションは作らない。docs/ART.md）
    const [pc, pr] = this.state.cell;
    this.party = [];
    this.trail = [];
    // 一緒に歩く仲間（段階267）：編成の仲間を、後ろの人から先に置く（先頭が一番手前に重なる）
    if (this.walkers) {
      const ids = currentParty(storyBattleLineup()).map((c) => c.id);
      for (const id of [...ids].reverse()) {
        // 歩く二頭身（sprite.walk_<人>。4行×3列：前・左・右・後ろ × 立ち・左足・右足）が届いていれば、それを。なければ砂の底の掘る絵を仮に
        const walk = this.walkSheet(id);
        // 足もとの位置は scripts/walk_sprite.py でそろえた所（HEAD_X 0.5・FOOT_Y 0.92）
        const art = walk ? { key: walk, originX: 0.5, originY: 0.92, scale: 1, anim: () => `${walk}:down`, idleFrame: 'w0-0' } : ensureDigHero(this, id);
        const box = this.add.container(pc * T + T / 2, pr * T + T / 2);
        box.add(this.add.ellipse(0, T * 0.38, T * 0.7, T * 0.26, 0x000000, 0.35));
        const img = this.add.sprite(0, T * 0.45, art.key, art.idleFrame).setOrigin(art.originX, art.originY);
        img.setScale((T * 1.55) / img.height);
        box.add(img);
        sortLayer.add(box);
        this.party.unshift({ id, box, img, art, walk });
      }
    }
    this.player = this.walkers && this.party[0] ? this.party[0].box : this.add.container(pc * T + T / 2, pr * T + T / 2);
    if (this.walkers && this.party[0]) {
      // 先頭は上で置いた（仲間の絵の箱が、そのまま先頭の印）
    } else if (hasImage(this, 'portrait.hero.normal')) {
      this.player.add(this.add.ellipse(0, T * 0.35, T * 0.8, T * 0.3, 0x000000, 0.35));
      const face = this.add.image(0, T * 0.4, 'portrait.hero.normal').setOrigin(0.5, 1);
      face.setScale((T * 1.5) / face.height);
      this.player.add(face);
    } else {
      this.player.add(this.add.circle(0, 0, T * 0.42, COLORS.ally).setStrokeStyle(2, 0xffffff));
      this.player.add(addText(this, 0, 0, 'ハ', { size: 14, bold: true }).setOrigin(0.5));
    }
    if (!this.walkers) sortLayer.add(this.player);
    this.shadeSprite(this.player, isShade(room, this.state.cell));
    this.roof = this.drawRoof(room);
    if (this.roof) world.add(this.roof);
    // 下をくぐる物（段階272。鳥居）：仲間と敵の上に重ねる
    this.litDecor = [];
    for (const d of A11_DECOR) {
      if (d.room !== room.id || !hasImage(this, d.image)) continue;
      if (d.when && !(this.state.flags ?? []).includes(d.when)) continue;
      const im = this.add.image(d.x * T, d.y * T, d.image).setOrigin(0);
      if (d.to) {
        // 段階283：2点の間に張る（提灯が逆さにならないよう、左の点から右の点へ）
        const [ax, ay, bx, by] = d.to[0] < d.x ? [d.to[0], d.to[1], d.x, d.y] : [d.x, d.y, d.to[0], d.to[1]];
        const len = Math.hypot(bx - ax, by - ay) * T;
        im.setOrigin(0, 0.1).setPosition(ax * T, ay * T).setDisplaySize(len, (len * im.height) / im.width).setRotation(Math.atan2(by - ay, bx - ax));
      } else im.setDisplaySize(d.w * T, (d.w * T * im.height) / im.width);
      // 地図の出来事でこれから灯す電球は、灯るまで隠しておく
      if (d.when && this.pendingLight) {
        im.setAlpha(0);
        this.litDecor.push(im);
      }
      world.add(im);
    }

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
    // コマ：あと何コマで返せるか（段階28）
    const left = komaLeft(area, this.state);
    const nightGoalText = this.night > 0 ? area.nights?.[this.night - 1]?.goal : undefined;
    if (this.night > 0 && nightGoalText) {
      // 段階284：2行目は今夜の目的（物語の言葉）、3行目は何晩目と、今夜のコマを砂時計の印で（取った数だけ金色）
      const goal = nightGoal(area, this.state, this.night);
      const done = this.nightOver();
      ui.add(addText(this, GAME_WIDTH / 2, 30, nightGoalText, { size: 14, bold: true, color: COLORS.accentText }).setOrigin(0.5, 0));
      const rest = goal.last ? (left > this.bossKoma() ? '' : 'あとは、ぬし') : done ? 'そろった！' : '';
      const label = addText(this, 0, 60, `${this.night}晩目`, { size: 12, bold: true }).setOrigin(0, 0.5);
      const marks = Math.min(goal.need, 8);
      const restText = rest ? addText(this, 0, 60, rest, { size: 12, bold: true, color: COLORS.accentText }).setOrigin(0, 0.5) : null;
      const width = label.width + 8 + marks * 15 + (restText ? 6 + restText.width : 0);
      let x = GAME_WIDTH / 2 - width / 2;
      label.setX(x);
      ui.add(label);
      x += label.width + 8 + 7;
      for (let i = 0; i < marks; i++) {
        ui.add(this.komaMark(x + i * 15, 60, 0.8).setAlpha(i < goal.have ? 1 : 0.28));
      }
      if (restText) ui.add(restText.setX(x + marks * 15 - 1));
    } else if (this.night > 0) {
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
    addButton(this, ui, 46, 32, 76, 44, 'タイトル', { onTap: () => this.scene.start('Title') }, { size: 13 });
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
    // 段階278：調べられる物の前に立つと出る「調べる」ボタン（オプションで右か左か）
    this.actionButton = this.add.container(0, 0);
    ui.add(this.actionButton);
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
    if (area.rooms.length > 1) {
      this.roomMapBox = this.drawRoomMap();
      ui.add(this.roomMapBox);
    }

    // 段階269：押したまま引っ張ると、その向きへ歩き続ける（見えないスティック。指の下に小さな輪）
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.leaving || this.editor || this.eventRunning || this.tune) return;
      this.drag = { x: p.x, y: p.y, dir: null };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      const dx = p.x - this.drag.x;
      const dy = p.y - this.drag.y;
      if (Math.hypot(dx, dy) < 18) return;
      const ui = this.cameras.cameras[1];
      const at = ui ? (p.positionToCamera(ui) as Phaser.Math.Vector2) : { x: p.x, y: p.y };
      const start = ui ? ui.getWorldPoint(this.drag.x, this.drag.y) : { x: this.drag.x, y: this.drag.y };
      this.drawStick(start.x, start.y, at.x - start.x, at.y - start.y);
      const first = !this.drag.dir;
      this.drag.dir = dirOfDrag(dx, dy);
      if (first) {
        // 引っ張り始めたら、タップで決めた道と行き先はやめる
        this.route = [];
        this.goal = null;
        this.marker.setVisible(false);
        this.drawRoute();
      }
      if (!this.walking) this.step();
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      const dragged = !!this.drag?.dir;
      this.drag?.ring?.destroy();
      this.drag = null;
      if (dragged) return;
      if (over.length > 0 || this.leaving || this.editor || this.eventRunning) return;
      if (p.getDistance() > 12) return; // ドラッグは無視
      const pt = p.positionToCamera(cam) as Phaser.Math.Vector2;
      this.tapCell([Math.floor(pt.x / T), Math.floor(pt.y / T)]);
    });
  }

  update(): void {
    // 段階273：手前の物ほど上に（足もとの高さの順）
    if (this.dancers.length > 0) this.moveDancers(this.game.loop.delta);
    if (this.sortLayer) {
      this.sortLayer.list.sort((a, b) => footOf(a) - footOf(b));
      this.fadeCovers();
    }
    if (this.leaving || !this.player || this.tipOpen || this.editor || this.tune || this.eventRunning) return;
    if (this.time.now < this.graceUntil) return;
    if (this.stealth) this.updateSight();
    for (const e of this.enemies) {
      if (Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, this.player.x, this.player.y) < T * 0.6) {
        // 段階263：見つかる前に触れたら不意打ち
        if (this.stealth && this.ambush(e)) return;
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
   * 屋根や木の下（段階118）：屋根のかかるマスの絵を切り抜いて、仲間と敵の上にもう一度重ねる。真下にいてもすかさない。
   * 段階121：細かい屋根（1マスを縦横4つに割った形）に沿って切り抜き、縁は数ドットかけて少しずつすけさせる（マス目に合わない屋根や
   * 木の葉が、四角く浮いて見えないように）。小さな四角1つを1ドットにした型紙をなめらかに引きのばして、地図の絵をくり抜く。
   * 絵のない部屋は暗い色
   */
  private drawRoof(room: RoomDef): Phaser.GameObjects.Image | undefined {
    const cells = roofCells(room);
    if (cells.length === 0) return undefined;
    const n = ROOF_SPLIT;
    const [w, h] = [this.map.cols * T, this.map.rows * T];
    const mask = document.createElement('canvas');
    mask.width = this.map.cols * n;
    mask.height = this.map.rows * n;
    const m = mask.getContext('2d');
    if (!m) return undefined;
    m.fillStyle = '#ffffff';
    for (const [c, r] of cells) {
      const bits = roofMask(room, c, r);
      for (let i = 0; i < n * n; i++) if (bits & (1 << i)) m.fillRect(c * n + (i % n), r * n + Math.floor(i / n), 1, 1);
    }
    if (this.textures.exists(ROOF_TEXTURE)) this.textures.remove(ROOF_TEXTURE);
    const tex = this.textures.createCanvas(ROOF_TEXTURE, w, h);
    if (!tex) return undefined;
    const ctx = tex.context;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(mask, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-in';
    if (room.image && hasImage(this, room.image)) ctx.drawImage(this.textures.get(room.image).getSourceImage() as CanvasImageSource, 0, 0, w, h);
    else {
      ctx.fillStyle = 'rgba(11,17,24,0.85)';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    tex.refresh();
    return this.add.image(0, 0, ROOF_TEXTURE).setOrigin(0);
  }

  /** 陰のマス（段階121）にいる仲間・敵の絵を少し暗くする（絵のない印は、そのまま） */
  private shadeSprite(sprite: Phaser.GameObjects.Container, on: boolean): void {
    for (const o of sprite.list) {
      if (!(o instanceof Phaser.GameObjects.Image)) continue;
      if (on) o.setTint(SHADE_TINT);
      else o.clearTint();
    }
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
      night: this.night,
      say: (text) => this.say(text),
      close: () => {
        // 直した地図で開き直す（今いるマスが通れなくなっていても、タップすると近くの歩ける所へ歩く）
        this.leaving = true;
        this.scene.restart(this.back());
      },
      openChestMap: () => {
        this.leaving = true;
        this.scene.start('ChestMap', { area: this.rawArea.id, night: this.night, room: this.state.room });
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
    // 仕掛けの扉（段階264）：仕掛けの載っていない所をタップしたら、なぜ通れないかを言う
    const gate = closedGates(this.area, this.state, this.state.room).find((g) => g.cells.some((c) => c[0] === cell[0] && c[1] === cell[1]));
    if (gate && !gadgetAt(this.area, this.state, this.night, this.state.room, cell)) {
      const why: Record<string, string> = { dark: '停電で真っ暗で、進めない。……明かりがつけば', fence: '板でふさがれている。屋台の人に頼めば通してくれるかも', water: '池に霧が立ちこめていて、渡れない', crowd: '人混みで通れない', cart: '荷車が道をふさいでいる' };
      this.say(why[gate.look] ?? gate.label);
      return;
    }
    // 地図直しの試し歩き（段階121）では、歩くだけ
    const plain = !!this.tune;
    // 段階280：二頭身の絵の人は、頭（1つ上のマス）をタップしても話せる（仲間と重なっていても）
    const talker = plain
      ? undefined
      : this.area.talkers.find((t) => this.here(t) && (near(t.cell, cell, 0) || (!!TALKER_ART[t.label ?? ''] && near([t.cell[0], t.cell[1] - 1], cell, 0))));
    // まだ開けていない宝箱は、タップした時だけ開ける（通っただけでは開かない）
    const chest = talker || plain ? null : chestAt(this.area, this.state, cell);
    // 仕掛け（段階264）：隣まで歩いてから。押す物は、押すマス（from）まで
    const gadget = talker || chest || plain ? null : gadgetAt(this.area, this.state, this.night, this.state.room, cell);
    const boss = !plain && !talker && !chest && !gadget && this.bossHere() && near(this.area.boss.cell, cell, 1);
    const from = this.nextCell ?? this.state.cell;
    let target: GridCell | null;
    let path: GridCell[] | null;
    if (chest || gadget) {
      // 宝箱のマスは通れないので、隣の立てるマスのうち一番近い所まで歩いてから開ける（仕掛けも同じ。押す物は、まず押すマスへ）
      const at = (chest ?? gadget)!.cell;
      const sides: GridCell[] = gadget?.from && findPathDiag(this.map, from, gadget.from) ? [gadget.from] : [[at[0], at[1] - 1], [at[0] + 1, at[1]], [at[0], at[1] + 1], [at[0] - 1, at[1]]];
      const options = sides.map((c) => ({ c, p: findPathDiag(this.map, from, c) })).filter((o) => o.p !== null) as { c: GridCell; p: GridCell[] }[];
      options.sort((a, b) => a.p.length - b.p.length);
      target = options[0]?.c ?? null;
      path = options[0]?.p ?? null;
    } else {
      const goal = talker ? talker.cell : boss ? this.area.boss.cell : cell;
      // 段階269：少しずれたタップは近くの歩ける所へ。2026-11-23：歩けない物の上をタップしても、3マス以内の行ける所まで歩く（それより遠い所は「×」）
      target = talker || boss ? nearestWalkable(this.map, goal, 2) : reachableNear(this.map, from, goal, 3);
      path = target ? findPathDiag(this.map, from, target) : null;
    }
    if (!target || !path) {
      this.showNoWay(cell);
      return;
    }
    if (talker || boss) {
      path.pop(); // 相手のマスの手前で止まる
      this.goal = talker ? { kind: 'talk', id: talker.id } : { kind: 'boss' };
    } else if (chest) {
      this.goal = { kind: 'chest', id: chest.id };
    } else if (gadget) {
      this.goal = { kind: 'gadget', id: gadget.id };
    } else {
      this.goal = null;
    }
    this.marker.setPosition(target[0] * T + T / 2, target[1] * T + T / 2).setVisible(true);
    this.route = path;
    // 段階269：行き先に波紋、歩く道に点
    this.ripple(target);
    this.drawRoute();
    if (!this.walking) this.step();
    this.updateHubButton();
  }

  // ---- 歩きやすく（段階269。docs/milestones/M3_explore_feel.md の 6.） ----

  private routeView?: Phaser.GameObjects.Graphics;
  /** 押したまま引っ張って歩く：指を置いた所（画面の座標）と、今の向き。見えないスティックの輪 */
  private drag: { x: number; y: number; dir: GridCell | null; ring?: Phaser.GameObjects.Container } | null = null;

  /** 歩く道に、小さな点（残りの道だけ） */
  private drawRoute(): void {
    if (!this.world) return;
    if (!this.routeView || !this.routeView.active) {
      this.routeView = this.add.graphics();
      this.world.addAt(this.routeView, 1);
    }
    const g = this.routeView;
    g.clear();
    if (this.drag) return;
    g.fillStyle(0xffd84a, 0.6);
    for (const [c, r] of this.route) g.fillCircle(c * T + T / 2, r * T + T / 2, 3);
  }

  /** 行き先の波紋 */
  private ripple([c, r]: GridCell): void {
    if (!this.world) return;
    const ring = this.add.circle(c * T + T / 2, r * T + T / 2, T * 0.35).setStrokeStyle(2, 0xffd84a, 0.9);
    this.world.add(ring);
    this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
  }

  /** 行けない所をタップした：その所に「×」 */
  private showNoWay([c, r]: GridCell): void {
    if (!this.world) return;
    const x = addText(this, c * T + T / 2, r * T + T / 2, '×', { size: 22, bold: true, color: '#ff5a6a' }).setOrigin(0.5).setStroke('#000000', 4);
    this.world.add(x);
    this.tweens.add({ targets: x, alpha: 0, y: x.y - 8, delay: 250, duration: 400, onComplete: () => x.destroy() });
  }

  /** 引っ張って歩く時の、次の1歩（向きへ進めなければ、近い向きにすべる） */
  private dragNext(): GridCell | null {
    if (!this.drag?.dir) return null;
    const from = this.state.cell;
    return dragStep(this.map, from, this.drag.dir);
  }

  /** 見えないスティックの輪（指を置いた所に小さく） */
  private drawStick(px: number, py: number, dx: number, dy: number): void {
    if (!this.ui || !this.drag) return;
    if (!this.drag.ring) {
      const ring = this.add.container(px, py);
      ring.add(this.add.circle(0, 0, 34, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.35));
      ring.add(this.add.circle(0, 0, 13, 0xffd84a, 0.6).setName('knob'));
      this.ui.add(ring);
      this.drag.ring = ring;
    }
    const len = Math.min(34, Math.hypot(dx, dy));
    const a = Math.atan2(dy, dx);
    const knob = this.drag.ring.getByName('knob') as Phaser.GameObjects.Arc;
    knob.setPosition(Math.cos(a) * len, Math.sin(a) * len);
  }

  private step(): void {
    if (this.leaving) return;
    // 段階269：引っ張っている間は、道が尽きたら向きへ次の1歩
    if (this.route.length === 0 && this.drag?.dir && !this.eventRunning && !this.tipOpen) {
      const n = this.dragNext();
      if (n) this.route = [n];
    }
    const next = this.route.shift();
    this.drawRoute();
    if (!next) {
      this.walking = false;
      this.nextCell = null;
      for (const m of this.party) m.img.stop().setFrame(m.art.idleFrame);
      this.marker.setVisible(false);
      this.updateHubButton();
      this.reachGoal();
      return;
    }
    this.walking = true;
    this.nextCell = next;
    if (this.actionMark || this.actionButton?.length) this.updateActionButton();
    this.lastDir = [Math.sign(next[0] - this.state.cell[0]), Math.sign(next[1] - this.state.cell[1])];
    this.shadeSprite(this.player, isShade(this.room, next));
    // 斜めの1歩は、少し長く（同じ速さに見えるように）
    const diag = next[0] !== this.state.cell[0] && next[1] !== this.state.cell[1];
    if (this.walkers) this.walkParty(this.state.cell, next, diag ? AREA_STEP_MS * 1.4 : AREA_STEP_MS);
    const walk = this.tweens.add({
      targets: this.player,
      x: next[0] * T + T / 2,
      y: next[1] * T + T / 2,
      duration: diag ? AREA_STEP_MS * 1.4 : AREA_STEP_MS,
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
    if (this.tune) {
      // 地図直しの試し歩き（段階121）：閉じた出入口も通れる（開ける印を全部倒したことにして通る）
      const all = [...this.area.enemies.map((e) => e.id), this.area.boss.id];
      const door = passDoor(this.area, { ...this.state, cell, defeated: all }, cell);
      this.state = { ...this.state, cell };
      if (door?.type === 'moved') this.changeRoom(door.state);
      return;
    }
    const r = arrive(this.area, this.state, cell, tensionRules());
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
      // 段階255：この晩の回復を使ったチェックポイントでは、記録だけ
      this.say(`チェックポイント：${r.event.healed ? (tensionRules() ? 'HP・MP が全回復した（ここでの回復は、この晩はもう使った）。' : 'HP・MP が全回復した。') : r.event.spent ? 'この晩の回復は使った。HP・MP はそのまま。' : ''}ここまでを記録した。${storyLineup().unlocks.growth || storyLineup().unlocks.weapon ? '「休憩する」で育成できる' : ''}${this.traitForecast(true)}`);
      if (r.event.healed) this.refreshVitals();
    }
    if (this.atExit(cell)) this.say('光る砂時計：今夜はここまで\n下のボタンで時計屋へ帰る');
    this.keep(this.state);
    // 地図の出来事（段階266）：そのマスに着いたら
    const ev = pendingEvent(this.area, this.state, this.night, this.state.room, { on: 'enter', cell });
    if (ev) {
      void this.runEvent(ev);
      return;
    }
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
      if (!talker) return;
      // 段階280（開発者：立ち絵がないのに画面が切り替わる）：二頭身の絵がある写しの人は、画面を切り替えず地図の上の帯で話す
      if (TALKER_ART[talker.label ?? '']) void this.talkOnMap(talker);
      else this.openScene(talker.scene, { area: this.area.id, talked: talker.id });
      return;
    }
    if (goal.kind === 'chest') {
      this.openChestNow(goal.id);
      return;
    }
    if (goal.kind === 'gadget') {
      this.useGadgetNow(goal.id);
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

  /** ボスに挑めるか（ボスのコマを足せば返せる数になっている） */
  private bossReady(): boolean {
    return bossReady(this.area, this.state, this.bossKoma());
  }

  /** ボスの印が今の部屋にいるか */
  private bossHere(): boolean {
    return !this.state.cleared && enemyActive(this.state, this.area.boss.id) && this.here(this.area.boss) && (this.night === 0 || inNight(this.area.boss, this.night));
  }

  /** 探索の状態を覚える */
  private keep(state: ExploreState): void {
    // 地図直しの試し歩き（段階121）はセーブに書かない（いる所は開き直す時のデータで渡す）
    if (this.tune) return;
    setExplore(state);
  }

  /** この画面を開き直す時のデータ */
  private back(extra: Partial<ExploreData> = {}): ExploreData {
    const tune = this.tune ? { room: this.state.room, cell: this.state.cell } : undefined;
    return { area: this.area.id, won: undefined, lost: undefined, seen: undefined, night: this.night || undefined, tune, ...extra };
  }

  /** 仕掛けを使う（段階264）。解けて扉が開いた・宝箱が出た時は、地図を作り直す（部屋を移る時と同じく開き直す） */
  private useGadgetNow(id: string): void {
    const gadget = this.area.gadgets?.find((g) => g.id === id);
    if (!gadget) return;
    const party = currentParty(storyBattleLineup()).map((c) => c.id);
    const r = useGadget(this.area, this.state, gadget, party, this.state.cell);
    this.state = r.state;
    this.keep(this.state);
    const rebuild = r.solved.length > 0 || gadget.kind === 'item';
    if (r.solved.length > 0) playSe(this, SE.heal);
    if (gadget.kind === 'photo') {
      // 思い出の一枚（段階265）：撮った時は白く光る。何枚目か
      this.cameras.main.flash(200, 255, 250, 235);
      const photos = (this.area.gadgets ?? []).filter((g) => g.kind === 'photo');
      const taken = photos.filter((g) => (this.state.flags ?? []).includes(g.id)).length;
      this.say(`思い出の一枚を撮った（${taken}/${photos.length}）`);
      this.redrawGadgets();
      this.showPhoto(r.text, `${taken}/${photos.length}`);
      return;
    }
    if (!rebuild) {
      this.say(r.text);
      // 提灯の灯り（順番の途中）を描き直す
      this.redrawGadgets();
      return;
    }
    this.leaving = true;
    this.cameras.main.flash(260, 255, 240, 200);
    // 地図の出来事（段階266）：仕掛けが解けた時の地図の出来事は、開き直した後に起こす
    const ev = r.solved.map((flag) => pendingEvent(this.area, this.state, this.night, this.state.room, { on: 'solved', flag })).find((x) => !!x);
    this.time.delayedCall(280, () => this.scene.restart(this.back({ notice: r.text, ...(ev ? { event: ev.id } : {}) })));
  }

  /** 思い出の一枚（段階265）：セピアの写真の札を画面の真ん中に。タップで閉じる（絵が届くまでは、場面を言葉で） */
  private showPhoto(text: string, count: string): void {
    if (!this.ui) return;
    const [head, ...body] = text.split('\n');
    const box = this.add.container(0, 0);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 20;
    box.add(shade);
    box.add(this.add.rectangle(cx + 4, cy + 4, 300, 330, 0x000000, 0.5));
    box.add(this.add.rectangle(cx, cy, 300, 330, 0xf4ecd8).setStrokeStyle(1, 0xc8b898).setAngle(-2));
    box.add(this.add.rectangle(cx, cy - 30, 264, 230, 0x8a6a48).setAngle(-2));
    box.add(this.add.rectangle(cx, cy - 30, 264, 230, 0x3a2a18, 0.35).setAngle(-2));
    box.add(addText(this, cx, cy - 30, body.join('\n'), { size: 15, bold: true, color: '#fff4dc', align: 'center', wrap: 236, ja: true }).setOrigin(0.5).setAngle(-2).setLineSpacing(6));
    box.add(addText(this, cx, cy + 118, head.replace('思い出の一枚', '').replace(/[（）]/g, ''), { size: 14, bold: true, color: '#5a4630' }).setOrigin(0.5).setAngle(-2));
    box.add(addText(this, cx, cy + 186, `思い出の一枚 ${count}　タップで閉じる`, { size: 12, color: '#e6e9f5' }).setOrigin(0.5));
    box.setAlpha(0);
    this.ui.add(box);
    this.tweens.add({ targets: box, alpha: 1, duration: 220 });
    this.tipOpen = true;
    shade.on('pointerup', () => {
      this.tipOpen = false;
      box.destroy();
    });
  }

  private gadgetLayer?: Phaser.GameObjects.Container;

  /** 仕掛けの扉と仕掛けを描く（絵が届くまでの仮の印） */
  private drawGadgets(world: Phaser.GameObjects.Container): void {
    const layer = this.add.container(0, 0);
    this.gadgetLayer = layer;
    world.add(layer);
    this.redrawGadgets();
  }

  private redrawGadgets(): void {
    const layer = this.gadgetLayer;
    if (!layer) return;
    layer.removeAll(true);
    for (const o of this.sortedProps) o.destroy();
    this.bubbleLayer?.removeAll(true);
    this.darkLayer?.removeAll(true);
    this.sortedProps = [];
    // 小物の絵は、足もとの順に仲間と重ねる（段階273。重ねる入れ物がまだなければ仕掛けの入れ物へ）
    const front = (o: Phaser.GameObjects.Image): void => {
      if (this.sortLayer) {
        this.sortLayer.add(o);
        this.sortedProps.push(o);
      } else layer.add(o);
    };
    const look: Record<string, { fill: number; alpha: number; text: string }> = {
      dark: { fill: 0x000000, alpha: 0.85, text: '真っ暗' },
      cart: { fill: 0x6b4a2a, alpha: 1, text: '' },
      crowd: { fill: 0x7a7f90, alpha: 0.9, text: '' },
      fence: { fill: 0x5a4030, alpha: 1, text: '' },
      water: { fill: 0x2a4a7a, alpha: 0.9, text: '' },
    };
    // 扉を描くのは、もとの部屋で歩けるマスだけ（扉の四角の中の壁は描かない）
    const plainRoom = this.rawArea.rooms.find((x) => x.id === this.state.room) ?? this.room;
    const closed = closedGates(this.area, this.state, this.state.room);
    // 段階271：板のかべは、解いた後は壊れた板の絵を残す
    for (const gate of (this.area.gates ?? []).filter((g) => g.room === this.state.room && g.look === 'fence' && !closed.includes(g))) {
      const broken = this.propArt(A11_GATE_ART.broken);
      if (broken) front(this.gateBoards(broken, gate.cells));
    }
    for (const gate of closed) {
      const st = look[gate.look];
      // 段階271：小物の絵が読めていれば、絵で（板のかべ・人混み・池の霧）
      const boards = gate.look === 'fence' ? this.propArt(A11_GATE_ART.boards) : undefined;
      if (boards) {
        front(this.gateBoards(boards, gate.cells));
        continue;
      }
      const crowd = gate.look === 'crowd' ? A11_GATE_ART.crowd.map((k) => this.propArt(k)).filter((k): k is string => !!k) : [];
      if (crowd.length > 0) {
        gate.cells.forEach(([c, r], i) => {
          if (plainRoom.layout[r]?.[c] === '#') return;
          const im = this.propImage(crowd[i % crowd.length], [c, r], 1.5).setTint(0xe8d2b0).setAlpha(0.85);
          front(im);
          this.tweens.add({ targets: im, y: im.y - 1.5, yoyo: true, repeat: -1, duration: 900 + i * 130 });
        });
        continue;
      }
      if (gate.look === 'dark' && this.room.image) {
        // 停電の暗がり：絵の上では、扉の四角を丸ごと暗くする（歩けない物の山も一緒に）
        // 段階281（開発者：「真っ暗」の字だけで作り途中に見えた）：字は出さず、縁をぼかした夜の暗がりにする
        const dark = this.darkOverlay(gate.cells);
        if (dark) (this.darkLayer ?? layer).add(dark);
        continue;
      }
      if (gate.look === 'water' && this.room.image) {
        // 池の霧：絵の飛び石を、白い霧で隠す（ハルトのカメラで写すと晴れる）
        for (const [c, r] of gate.cells) {
          const fog = this.add.ellipse(c * T + T / 2, r * T + T / 2, T * 1.6, T * 1.2, 0xdfe8f0, 0.82);
          layer.add(fog);
          this.tweens.add({ targets: fog, alpha: 0.6, scaleX: 1.15, yoyo: true, repeat: -1, duration: 1400 + ((c * 7 + r * 3) % 5) * 200 });
        }
        continue;
      }
      for (const [c, r] of gate.cells) {
        const ch = plainRoom.layout[r]?.[c];
        if (ch === undefined || ch === '#') continue;
        layer.add(this.add.rectangle(c * T + T / 2, r * T + T / 2, T, T, st.fill, st.alpha));
        if (gate.look === 'crowd') layer.add(this.add.circle(c * T + T / 2, r * T + T / 2, T * 0.3, 0xc8ccd8, 0.8));
        if (gate.look === 'water') layer.add(this.add.rectangle(c * T + T / 2, r * T + T / 2, T * 0.8, 3, 0x8ab4e8, 0.6));
      }
      const [c0, r0] = gate.cells[0];
      if (st.text) layer.add(addText(this, c0 * T + 4, r0 * T + 4, st.text, { size: 10, bold: true, color: '#8a93ad' }));
    }
    const flags = this.state.flags ?? [];
    for (const g of gadgetsShown(this.area, this.state, this.night, this.state.room)) {
      const [x, y] = [g.cell[0] * T + T / 2, g.cell[1] * T + T / 2];
      const lit = g.kind === 'order' ? flags.includes(g.group ?? '') || flags.includes(`${g.group}:${g.index}`) : flags.includes(g.id);
      const later = g.kind === 'later';
      // 場所の手がかり（段階265）：まだ解いていない物に、金の輪
      if (!lit && flags.includes(`hint:${g.id}`)) {
        const ring = this.add.circle(x, y, T * 0.85).setStrokeStyle(3, 0xffd84a, 0.9);
        layer.add(ring);
        this.tweens.add({ targets: ring, scale: 1.25, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });
      }
      const photo = g.kind === 'photo';
      // 段階271：小物の絵が読めていれば、絵で（解いた後の絵があれば替える。撮った思い出の一枚は薄く）
      const art = A11_PROP_ART[g.id];
      const key = art ? this.propArt(lit && art.on ? art.on : art.off) : undefined;
      if (art && key) {
        const im = this.propImage(key, g.cell, art.w);
        // 屋台のような大きい小物（お面屋）も、裏を歩く間は透かす
        if (!photo && !later && art.w >= 2) im.setData('fade', true);
        if (photo) {
          im.setAlpha(lit ? 0.35 : 1);
          if (!lit) this.tweens.add({ targets: im, alpha: 0.6, yoyo: true, repeat: -1, duration: 800 });
        }
        if (later) im.setAlpha(0.9);
        front(im);
        // 2026-11-24（開発者：お面屋など、調べられる所に印がなくて分かりにくい）：まだ解いていない、見えている仕掛けの上に小さな吹き出し
        if (!lit && !photo) this.addGadgetBubble(this.bubbleLayer ?? layer, g.cell[0] * T + T / 2, im.y - im.displayHeight - 4, g.kind === 'item' ? '！' : '…');
        continue;
      }
      const color = later ? 0x5a5f70 : photo ? (lit ? 0x8a8070 : 0xfff4d8) : lit ? 0xffd84a : g.kind === 'item' ? 0xff9a3c : 0x6bc8ff;
      layer.add(this.add.rectangle(x, y, T * 0.72, T * 0.72, color, 1).setAngle(45).setStrokeStyle(2, 0x000000));
      layer.add(addText(this, x, y, g.mark, { size: 13, bold: true, color: '#101010' }).setOrigin(0.5));
    }
  }

  /**
   * 段階279：屋台の裏など、手前の部品の絵に隠れて歩いている間は、その絵を少し透かす（仲間の位置が分かるように）。
   * 誘導ではないので、隠れた所に入った後だけ（入口を知らせる印は出さない）
   */
  private fadeCovers(): void {
    if (!this.sortLayer || !this.player) return;
    const px = this.player.x;
    const py = this.player.y;
    for (const o of this.sortLayer.list) {
      const im = o as Phaser.GameObjects.Image;
      if (!im.getData?.('fade')) continue;
      const foot = im.getData('foot') as number;
      const b = im.getBounds();
      const behind = foot > py + T / 2 && px > b.left + 4 && px < b.right - 4 && py > b.top && py < b.bottom;
      const target = behind ? 0.45 : 1;
      if (im.alpha !== target) im.setAlpha(Math.abs(target - im.alpha) < 0.03 ? target : Phaser.Math.Linear(im.alpha, target, 0.25));
    }
  }

  /** 写しの人の上の吹き出し（話したら薄く） */
  private talkerBubbles = new Map<string, Phaser.GameObjects.Container>();

  /** 停電の暗がり（段階281）：扉のマスの四角を、縁を少しずつぼかした濃い紺で覆う */
  private darkOverlay(cells: GridCell[]): Phaser.GameObjects.Container | null {
    if (cells.length === 0) return null;
    const cs = cells.map((c) => c[0]);
    const rs = cells.map((c) => c[1]);
    const [x0, x1, y0, y1] = [Math.min(...cs) * T, (Math.max(...cs) + 1) * T, Math.min(...rs) * T, (Math.max(...rs) + 1) * T];
    const box = this.add.container(0, 0);
    // 外へ広げた薄い層を重ねて、縁をぼかす（真ん中ほど暗い）
    for (const [pad, alpha] of [[T * 0.9, 0.12], [T * 0.6, 0.14], [T * 0.3, 0.16], [0, 0.5]] as const) {
      box.add(this.add.rectangle(x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2, 0x04060e, alpha).setOrigin(0));
    }
    return box;
  }

  /** 仕掛けの上の小さな吹き出し（2026-11-24）。ゆっくり上下する */
  private addGadgetBubble(layer: Phaser.GameObjects.Container, x: number, y: number, text: string): Phaser.GameObjects.Container {
    const box = this.add.container(x, y);
    box.add(this.add.ellipse(0, 0, 22, 17, 0xffffff, 0.92).setStrokeStyle(1.5, 0x3a2a20));
    box.add(this.add.triangle(0, 9, -4, 0, 4, 0, 0, 5, 0xffffff, 0.92));
    box.add(addText(this, 0, -1, text, { size: 11, bold: true, color: '#3a2a20' }).setOrigin(0.5));
    layer.add(box);
    this.tweens.add({ targets: box, y: y - 3, yoyo: true, repeat: -1, duration: 900 });
    return box;
  }

  /** 小物の絵（段階271）：読めていれば台帳の id、なければ undefined（仮の印で描く） */
  private propArt(key: string): string | undefined {
    return hasImage(this, key) ? key : undefined;
  }

  /** 小物の絵を、マスの下の端にそろえて置く（幅 w マス） */
  private propImage(key: string, cell: GridCell, w: number): Phaser.GameObjects.Image {
    const im = this.add.image(cell[0] * T + T / 2, cell[1] * T + T * 0.95, key).setOrigin(0.5, 1);
    im.setDisplaySize(T * w, (T * w * im.height) / im.width);
    im.setData('foot', (cell[1] + 1) * T);
    return im;
  }

  /** 板のかべの絵：扉のマスの横の広がりに合わせ、一番下のマスにそろえる */
  private gateBoards(key: string, cells: GridCell[]): Phaser.GameObjects.Image {
    const cs = cells.map((c) => c[0]);
    const rs = cells.map((c) => c[1]);
    const [c0, c1, r1] = [Math.min(...cs), Math.max(...cs), Math.max(...rs)];
    const wide = c1 - c0 + 1;
    // 2026-11-24（開発者：板が周りに比べて大きすぎる）：幅は扉のマスに合わせ、高さは人の背くらい（1.4マス）までにおさえる
    const im = this.propImage(key, [(c0 + c1) / 2, r1], Math.max(1.2, wide + 0.2));
    im.setDisplaySize(im.displayWidth, Math.min(im.displayHeight, T * 1.4));
    return im;
  }

  /** 宝箱を開けて、中身を持ち物に入れる */
  private openChestNow(chestId: string): void {
    const r = openChest(this.area, this.state, chestId);
    if (!r) return;
    this.state = r.state;
    const got = r.chest.items;
    // 持てる数のある物は、超えた分を捨てる（段階204 で消費アイテムをなくしたので、今は持てる数のある物はない）
    const capped = capItems(WEAPON_DATA, addItems(run.armory, got));
    run.armory = capped.armory;
    const gears = r.chest.gears ?? [];
    if (gears.length > 0) run.navi = addParts(run.navi, gears);
    // スナップは新しい戦闘のアルバムへ（段階168。ライブラリにも記録。段階204 で古いスナップはなくした）
    const chainSnaps = r.chest.chainSnaps ?? [];
    if (chainSnaps.length > 0) {
      run.chainAlbum = gainSnaps(run.chainAlbum, chainSnaps);
      run.library = recordLibraryFinds(run.library, { snaps: chainSnaps });
    }
    const sprite = this.chestSprites.get(r.chest.id);
    if (sprite instanceof Phaser.GameObjects.Image) {
      const open = this.propArt(A11_CHEST_ART.open);
      if (open) sprite.setTexture(open);
    } else sprite?.setFillStyle(0x4a3a28).setStrokeStyle(2, 0x6b5a40);
    playSe(this, SE.chest);
    this.updateActionButton();
    this.say(
      `宝箱を開けた！　${[got.length > 0 ? summarize(got) : '（空っぽだった）', gears.length > 0 ? `ギア：${gearNames(gears)}` : '', chainSnaps.length > 0 ? `スナップ：${chainSnaps.map((id) => CHAIN_SNAPS[id]?.name ?? id).join('、')}` : ''].filter(Boolean).join('　')}`,
    );
    this.keep(this.state);
  }

  /** チェックポイントに立ち止まっている時だけ、育成の画面への入口を出す（段階26） */
  private updateHubButton(): void {
    this.updateActionButton();
    if (!this.hubButton) return;
    this.hubButton.removeAll(true);
    if (this.tune) return;
    const unlocks = storyLineup().unlocks;
    const target = unlocks.growth ? 'Growth' : unlocks.weapon ? 'Weapon' : null;
    if (this.walking || this.route.length > 0) return;
    const y = GAME_HEIGHT - 30 - vitalsBandHeight(currentParty(storyBattleLineup()).length);
    // 帰り口（段階67）に立っている：時計屋へ帰って、今夜を終える
    if (this.atExit(this.state.cell)) {
      addButton(this, this.hubButton, GAME_WIDTH / 2, target ? y - 70 : y, 240, 60, '時計屋へ帰る\n（今夜はおわり）', { onTap: () => this.finishArea() }, {
        size: 16,
        bold: true,
        fill: STYLE.red,
        stroke: 0xffffff,
        strokeWidth: 2,
        italic: true,
      });
    }
    if (!target || !isCheckpoint(this.area, this.state.cell, this.state.room)) return;
    // 段階147：育成の画面へは、休憩所のメニュー（拠点と同じ形）から入る
    addButton(this, this.hubButton, GAME_WIDTH / 2, y, 240, 60, '休憩する', { onTap: () => this.openCamp() }, { ...GOLD_BUTTON, size: 18 });
  }

  /**
   * 調べるボタン（段階278）：止まっている時、となり（斜めも）に話せる人・宝箱・仕掛け・ぬしがあれば、その上に「！」、
   * 画面の下の右か左（オプション）にボタンを出す。向いている方を先に見る。押すと、その物をタップしたのと同じ。
   * 隠し場所は誘導しない決まり（docs/design/explore.md）なので、見えている物だけ
   */
  private actionTarget(): { cell: GridCell; label: string } | null {
    if (this.tune || this.leaving || this.walking || this.route.length > 0 || this.eventRunning) return null;
    const [x, y] = this.state.cell;
    const [fx, fy] = this.lastDir;
    const around: GridCell[] = [[x + fx, y + fy], [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y], [x - 1, y - 1], [x + 1, y - 1], [x + 1, y + 1], [x - 1, y + 1]];
    for (const c of around) {
      if (this.area.talkers.some((t) => this.here(t) && near(t.cell, c, 0))) return { cell: c, label: '話す' };
      if (chestAt(this.area, this.state, c)) return { cell: c, label: '開ける' };
      const g = gadgetAt(this.area, this.state, this.night, this.state.room, c);
      if (g) return { cell: c, label: g.kind === 'item' ? '拾う' : g.kind === 'push' ? '押す' : g.kind === 'photo' ? '撮る' : '調べる' };
    }
    if (this.bossHere() && near(this.area.boss.cell, this.state.cell, 1)) return { cell: this.area.boss.cell, label: '調べる' };
    return null;
  }

  private updateActionButton(): void {
    const box = this.actionButton;
    if (!box) return;
    box.removeAll(true);
    if (this.actionMark) this.tweens.killTweensOf(this.actionMark);
    this.actionMark?.destroy();
    this.actionMark = undefined;
    const t = this.actionTarget();
    if (!t) return;
    const left = getSettings().actionSide === 'left';
    const y = GAME_HEIGHT - 30 - vitalsBandHeight(currentParty(storyBattleLineup()).length);
    addButton(this, box, left ? 70 : GAME_WIDTH - 70, y, 112, 60, t.label, { onTap: () => this.tapCell(t.cell) }, { ...GOLD_BUTTON, size: 18 });
    const mark = addText(this, t.cell[0] * T + T / 2, t.cell[1] * T - T * 0.35, '！', { size: 18, bold: true, color: '#ffd84a' }).setOrigin(0.5).setStroke('#5a1a00', 4);
    this.world?.add(mark);
    this.tweens.add({ targets: mark, y: mark.y - 5, yoyo: true, repeat: -1, duration: 450 });
    this.actionMark = mark;
  }

  /** 休憩所（段階147）を開く。休憩所の「探索へ戻る」で、この画面のチェックポイントに戻る */
  private openCamp(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.keep(this.state);
    setCampReturn({ key: 'Explore', data: this.back() });
    setHubReturn(null);
    this.scene.start('Camp');
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

  private startBattle(battle: string, enemyId: string, ambush = false): void {
    if (this.leaving) return;
    this.leaving = true;
    this.keep(this.state);
    const data: BattleSceneData = {
      encounter: {
        ...(ambush ? { ambush: true } : {}),
        battle,
        win: { key: 'Explore', data: this.back({ won: enemyId }) },
        lose: { key: 'Explore', data: this.back({ lost: true }) },
      },
    };
    // 段階159：新しい戦闘にした区画の戦闘（と、デバッグの切り替え）は、並べてつなぐ戦闘の画面へ
    const key = battleSceneFor(data);
    const cam = this.cameras.main;
    if (!cam) {
      this.scene.start(key, data);
      return;
    }
    cam.shake(200, 0.006);
    cam.flash(250, 255, 255, 255);
    this.time.delayedCall(320, () => this.scene.start(key, data));
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
    const story = this.area.nights?.[this.night - 1]?.goal;
    if (story) {
      // 段階284：目的の言葉から。コマは、砂嵐が食べた思い出のかけら
      const want = goal.last ? 'コマを集めて、ぬしを起こそう' : `コマをあと${goal.need - goal.have}つ`;
      return `${this.night}晩目：${story}\n砂嵐が持つ思い出のかけら（コマ）。${want}`;
    }
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

  /**
   * 段階284：通行人と踊り手の色。思い出が戻った割合だけ、セピアの透けた姿から色のある姿へ。
   * コマを手に入れて戻った時は、前の色から少しずつ戻していく
   */
  private paintCrowd(): void {
    const from = this.restoreFrom;
    this.restoreFrom = null;
    if (this.crowdIms.length === 0) return;
    const to = memoryRestored(this.area, this.state);
    const apply = (level: number) => {
      const a = Phaser.Display.Color.ValueToColor(CROWD_LOOK.faded.tint);
      const b = Phaser.Display.Color.ValueToColor(CROWD_LOOK.restored.tint);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 1000, Math.round(level * 1000));
      const tint = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
      const alpha = CROWD_LOOK.faded.alpha + (CROWD_LOOK.restored.alpha - CROWD_LOOK.faded.alpha) * level;
      for (const im of this.crowdIms) im.setTint(tint).setAlpha(alpha);
    };
    if (from === null || from >= to) {
      apply(to);
      return;
    }
    apply(from);
    const v = { level: from };
    this.tweens.add({ targets: v, level: to, delay: 500, duration: CROWD_LOOK.restoreMs, ease: 'Sine.easeInOut', onUpdate: () => apply(v.level) });
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
    const before = e.mind.cell;
    if (this.stealth && (e.move === 'patrol' || e.move === 'chase')) {
      // 段階263：見つかるまでは見回るだけ（近づいただけでは気づかない）。見つかったら追ってくる。離れすぎると、あきらめて見回りに戻る
      const chase = ENEMY_MOVES.chase;
      e.mind = e.spotted ? enemyNext(this.map, 'chase', e.route, { ...e.mind, chasing: true }, player, chase) : enemyNext(this.map, 'patrol', e.route, e.mind, player, tuning);
      if (e.spotted && !e.mind.chasing) e.spotted = false;
    } else e.mind = enemyNext(this.map, e.move, e.route, e.mind, player, tuning);
    e.facing = facingOf(before, e.mind.cell) ?? e.facing;
    e.alert?.setVisible(this.stealth ? e.spotted : e.mind.chasing);
    const [c, r] = e.mind.cell;
    this.shadeSprite(e.sprite, isShade(this.room, e.mind.cell));
    // 歩く向きに絵を向ける（左へ歩く時は左右を返す。上下に歩く時は今の向きのまま）
    const img = e.sprite.getData('art') as Phaser.GameObjects.Image | undefined;
    const dx = c * T + T / 2 - e.sprite.x;
    if (img && dx !== 0) img.setFlipX(dx < 0);
    const ms = this.stealth && e.spotted ? ENEMY_MOVES.chase.stepMs : tuning.stepMs;
    this.tweens.add({ targets: e.sprite, x: c * T + T / 2, y: r * T + T / 2, duration: ms, onComplete: () => this.stepEnemy(e) });
  }

  /** 仲間を、x・y へ歩く向きに向けて歩かせる（歩く二頭身は向きの行。仮の掘る絵は左右を返す）。止まった時の向きも覚える */
  private faceMember(m: { box: Phaser.GameObjects.Container; img: Phaser.GameObjects.Sprite; art: DigHeroSprite; walk?: string }, x: number, y: number): void {
    if (m.walk) {
      const dir = x < m.box.x ? 'left' : x > m.box.x ? 'right' : y < m.box.y ? 'up' : 'down';
      const key = `${m.walk}:${dir}`;
      if (m.img.anims.currentAnim?.key !== key || !m.img.anims.isPlaying) m.img.play(key);
      m.art = { ...m.art, idleFrame: `w${['down', 'left', 'right', 'up'].indexOf(dir)}-0` };
      return;
    }
    if (x !== m.box.x) m.img.setFlipX(x < m.box.x);
    if (!m.img.anims.isPlaying) m.img.play(m.art.anim('walk'));
  }

  /** 歩く二頭身の絵（段階267）があれば、切り分けて向きごとの歩きを作り、その絵の id を返す。なければ undefined */
  private walkSheet(id: string): string | undefined {
    const key = `sprite.walk_${id}`;
    if (!hasImage(this, key)) return undefined;
    const tex = this.textures.get(key);
    const src = tex.getSourceImage() as HTMLImageElement;
    const cw = Math.floor(src.width / 3);
    const ch = Math.floor(src.height / 4);
    if (!tex.has('w0-0')) for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) tex.add(`w${row}-${col}`, 0, col * cw, row * ch, cw, ch);
    (['down', 'left', 'right', 'up'] as const).forEach((dir, row) => {
      const anim = `${key}:${dir}`;
      if (!this.anims.exists(anim)) this.anims.create({ key: anim, frames: [1, 0, 2, 0].map((col) => ({ key, frame: `w${row}-${col}` })), frameRate: 9, repeat: -1 });
    });
    return key;
  }

  /** 一緒に歩く仲間（段階267）：先頭が from から to へ1歩。後ろの仲間は、先頭が歩いてきたマスを1つずつたどる */
  private walkParty(from: GridCell, to: GridCell, ms = AREA_STEP_MS): void {
    this.trail.unshift(from);
    this.trail.length = Math.min(this.trail.length, this.party.length);
    this.party.forEach((m, k) => {
      const dest = k === 0 ? to : this.trail[k - 1];
      if (!dest) return;
      const x = dest[0] * T + T / 2;
      const y = dest[1] * T + T / 2;
      this.faceMember(m, x, y);
      if (k > 0) this.tweens.add({ targets: m.box, x, y, duration: ms });
      this.shadeSprite(m.box, isShade(this.room, dest));
    });
  }

  /** 敵の印を置く（段階266：地図の出来事で湧かせる時にも使う） */
  private addEnemy(e: AreaEnemy, world: Phaser.GameObjects.Container): Enemy {
    const room = this.room;
    const move = e.move ?? 'patrol';
    const route = e.patrol.length >= 2 ? patrolRoute(this.map, e.patrol) : [e.patrol[0]];
    const sprite = this.enemySprite(e.battle, move, route[0]);
    this.shadeSprite(sprite, isShade(room, route[0]));
    // コマを持つ砂嵐の印（段階67。物語の探索だけ。狩りではコマは手に入らない）
    if ((AREA_BATTLES[e.battle]?.koma ?? 0) > 0) sprite.add(this.komaMark(T * 0.45, -T * 0.6));
    world.add(sprite);
    const enemy: Enemy = { id: e.id, battle: e.battle, move, sprite, route, mind: startMind(route), facing: startFacing(route), spotted: false };
    if (move === 'chase' || (this.stealth && move === 'patrol')) {
      enemy.alert = addText(this, 0, -T * 0.95, '！', { size: 16, bold: true, color: '#ffd84a' }).setOrigin(0.5).setVisible(false);
      enemy.alert.setStroke('#5a1a00', 4);
      sprite.add(enemy.alert);
    }
    this.enemies.push(enemy);
    this.stepEnemy(enemy);
    return enemy;
  }

  // ---- 地図の出来事（段階266。docs/milestones/M3_explore_feel.md の 6.） ----

  /** 地図の出来事を始める。歩くのと砂嵐を止め、手順を順に動かす。最後に戦闘があれば、そのまま戦闘へ */
  private async runEvent(ev: AreaEvent): Promise<void> {
    if (this.eventRunning || this.leaving) return;
    this.eventRunning = true;
    this.route = [];
    this.goal = null;
    this.marker?.setVisible(false);
    // 起きたことを先に覚える（地図の出来事の途中で戦闘に入っても、もう一度起きない）
    this.state = markEvent(this.state, ev);
    this.keep(this.state);
    const paused = this.tweens.getTweens().filter((t) => !t.isPaused() && this.enemies.some((e) => t.targets.includes(e.sprite)));
    for (const t of paused) t.pause();
    const cam = this.cameras.main;
    const wait = (ms: number) => new Promise<void>((done) => this.time.delayedCall(ms, () => done()));
    for (const step of ev.steps) {
      if (this.leaving) return;
      if (step.do === 'wait') await wait(step.ms);
      else if (step.do === 'shake') {
        cam.shake(320, 0.008);
        await wait(360);
      } else if (step.do === 'camera') {
        cam.stopFollow();
        const [x, y] = step.to === 'hero' ? [this.player.x, this.player.y] : [step.to[0] * T + T / 2, step.to[1] * T + T / 2];
        cam.pan(x, y, step.ms ?? 400, 'Sine.easeInOut');
        await wait((step.ms ?? 400) + 60);
        if (step.to === 'hero') cam.startFollow(this.player, true, 0.2, 0.2);
      } else if (step.do === 'say') await this.eventLine(step.name, step.text);
      else if (step.do === 'spawn') {
        const def = this.area.enemies.find((e) => e.id === step.enemy);
        if (def && this.world && enemyActive(this.state, def.id)) {
          const e = this.addEnemy(def, this.sortLayer ?? this.world);
          this.tweens.getTweensOf(e.sprite).forEach((t) => t.pause());
          paused.push(...this.tweens.getTweensOf(e.sprite));
          // 砂が渦を巻いて、砂嵐が現れる
          e.sprite.setScale(0.2).setAlpha(0);
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            const dot = this.add.circle(e.sprite.x + Math.cos(a) * T, e.sprite.y + Math.sin(a) * T, 3, 0xd8c8a0, 0.9);
            this.world.add(dot);
            this.tweens.add({ targets: dot, x: e.sprite.x, y: e.sprite.y, alpha: 0, duration: 420, onComplete: () => dot.destroy() });
          }
          this.tweens.add({ targets: e.sprite, scale: 1, alpha: 1, duration: 420, ease: 'Back.easeOut' });
          playSe(this, SE.encounter);
          await wait(460);
        }
      } else if (step.do === 'light') {
        // 段階281（開発者：明かりが不自然）：宙に光の玉を出さず、暗がりを残したまま電球の列を順に灯し、暗がりをゆっくり晴らす
        const dark = this.darkOverlay(this.area.gates?.find((g) => g.room === this.state.room && g.look === 'dark')?.cells ?? []);
        if (dark) (this.darkLayer ?? this.world)?.add(dark);
        await wait(300);
        for (const im of this.litDecor) {
          this.tweens.add({ targets: im, alpha: 1, duration: 260 });
          playSe(this, SE.heal);
          await wait(260);
        }
        this.litDecor = [];
        if (dark) await new Promise<void>((done) => this.tweens.add({ targets: dark, alpha: 0, duration: 900, onComplete: () => (dark.destroy(), done()) }));
        await wait(150);
      } else if (step.do === 'flash') {
        // 花火：色を変えて光らせる
        const colors: [number, number, number][] = [[255, 200, 120], [160, 210, 255], [255, 150, 200]];
        for (let k = 0; k < (step.times ?? 1); k++) {
          const [r, g, b] = colors[k % colors.length];
          cam.flash(320, r, g, b);
          playSe(this, SE.encounter);
          await wait(650);
        }
      } else if (step.do === 'slide') {
        // 物を動かす（転がる荷車）
        const [fx, fy] = [step.from[0] * T + T / 2, step.from[1] * T + T / 2];
        const box = this.add.container(fx, fy);
        const cart = this.propArt('prop.cart');
        if (cart) {
          const im = this.add.image(0, 0, cart);
          im.setDisplaySize(T * 1.4, (T * 1.4 * im.height) / im.width);
          box.add(im);
        } else {
          box.add(this.add.rectangle(0, 0, T * 0.8, T * 0.8, 0x6b4a2a).setStrokeStyle(2, 0x000000));
          box.add(addText(this, 0, 0, step.mark, { size: 13, bold: true, color: '#ffffff' }).setOrigin(0.5));
        }
        this.world?.add(box);
        const dist = Math.abs(step.to[0] - step.from[0]) + Math.abs(step.to[1] - step.from[1]);
        await new Promise<void>((done) => this.tweens.add({ targets: box, x: step.to[0] * T + T / 2, y: step.to[1] * T + T / 2, angle: 360, duration: 90 * dist, ease: 'Quad.easeIn', onComplete: () => done() }));
        this.tweens.add({ targets: box, alpha: 0, duration: 400, onComplete: () => box.destroy() });
      } else if (step.do === 'walk') {
        await this.eventWalk(step.who, step.to);
      } else if (step.do === 'battle') {
        const e = this.area.enemies.find((x) => x.id === step.enemy);
        if (e) {
          this.eventRunning = false;
          this.startBattle(e.battle, e.id);
          return;
        }
      }
    }
    if (cam.panEffect.isRunning) await wait(400);
    cam.startFollow(this.player, true, 0.2, 0.2);
    for (const t of paused) t.resume();
    this.graceUntil = this.time.now + AREA_GRACE_MS;
    this.eventRunning = false;
  }

  /** 地図の出来事の台詞：地図の下に、名前と台詞の帯。タップで次へ */
  private eventLine(name: string, text: string, art?: string): Promise<void> {
    return new Promise((done) => {
      if (!this.ui) return done();
      const box = this.add.container(0, 0);
      const hit = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001).setOrigin(0).setInteractive();
      box.add(hit);
      // 段階280：話している写しの人の二頭身を、帯の左に小さく
      const left = art && hasImage(this, art) ? 84 : 26;
      // 2026-11-24（開発者：文が帯からはみ出した）：文の高さに合わせて帯をのばす
      const body = addText(this, left, 0, text, { size: 15, color: '#ffffff', wrap: GAME_WIDTH - left - 34, ja: true }).setLineSpacing(4);
      const h = Math.max(96, body.height + 52);
      const y = GAME_HEIGHT - 134 - h;
      box.add(this.add.rectangle(12, y, GAME_WIDTH - 24, h, 0x0b1020, 0.92).setOrigin(0).setStrokeStyle(2, 0xffd84a));
      if (left > 26) {
        const face = this.add.image(50, y + h - 4, art!).setOrigin(0.5, 1).setTint(0xf0d8b8);
        face.setScale(Math.min(64 / face.width, 88 / face.height));
        box.add(face);
      }
      if (name) box.add(addText(this, left, y + 10, name, { size: 13, bold: true, color: '#ffd84a' }));
      body.setY(y + (name ? 34 : 16));
      box.add(body);
      box.add(addText(this, GAME_WIDTH - 24, y + h - 12, '▼', { size: 11, color: '#ffd84a' }).setOrigin(1, 1));
      box.setAlpha(0);
      this.ui.add(box);
      this.tweens.add({ targets: box, alpha: 1, duration: 140 });
      hit.once('pointerup', () => {
        box.destroy();
        done();
      });
    });
  }

  /** 写しの人と地図の上で話す（段階280）：台本の台詞を帯で出し、くれる物があれば受け取る */
  private async talkOnMap(talker: AreaDef['talkers'][number]): Promise<void> {
    if (this.eventRunning) return;
    this.eventRunning = true;
    this.updateActionButton();
    const scene = SCENES.find((x) => x.id === talker.scene);
    const art = TALKER_ART[talker.label ?? ''];
    for (const step of scene?.steps ?? []) {
      if (step.kind !== 'line') continue;
      await this.eventLine(talker.label ?? step.speaker ?? '', step.text, art);
    }
    const got = takeGift(this.state, talker);
    if (got) {
      let state = got.state;
      if (got.gift.kind === 'weak') {
        const known = knownChainWeak(true);
        const list = known[got.gift.enemy] ?? [];
        if (!list.includes(got.gift.element)) keepChainWeak(true, { ...known, [got.gift.enemy]: [...list, got.gift.element] });
      }
      if (got.gift.kind === 'rest') {
        const max = Object.fromEntries(currentParty(storyBattleLineup()).map((c) => [c.id, { hp: c.stats.hp, mp: c.stats.mp }]));
        state = restVitals(state, got.gift.rate, max);
      }
      this.state = state;
      this.keep(state);
      this.refreshVitals();
      if (got.gift.kind === 'hint') {
        this.redrawGadgets();
        if (this.roomMapBox && this.ui) {
          this.roomMapBox.destroy();
          this.roomMapBox = this.drawRoomMap();
          this.ui.add(this.roomMapBox);
        }
      }
      this.talkerBubbles.get(talker.id)?.setAlpha(0.35);
      playSe(this, SE.heal);
      for (const line of got.gift.text.split('\n')) {
        const said = /^(.+?)「(.*)」$/.exec(line);
        if (said) await this.eventLine(said[1], said[2], art);
        else await this.eventLine('', line.replace(/^（|）$/g, ''));
      }
    } else this.talkerBubbles.get(talker.id)?.setAlpha(0.35);
    this.eventRunning = false;
    this.updateHubButton();
  }

  /** 地図の出来事で歩かせる：'hero' は先頭の仲間、ほかは敵の印 */
  private async eventWalk(who: string, to: GridCell): Promise<void> {
    const member = this.party.find((m) => m.id === who && who !== 'hero');
    const enemy = who === 'hero' || member ? undefined : this.enemies.find((e) => e.id === who);
    const sprite = who === 'hero' ? this.player : (member?.box ?? enemy?.sprite);
    if (!sprite) return;
    const from: GridCell = who === 'hero' ? this.state.cell : member ? [Math.floor(member.box.x / T), Math.floor(member.box.y / T)] : enemy!.mind.cell;
    const path = findPath(this.map, from, to) ?? [];
    let at = from;
    for (const [c, r] of path) {
      // 先頭が歩く時は、後ろの仲間もついて来る
      if (who === 'hero' && this.walkers) this.walkParty(at, [c, r], AREA_STEP_MS * 1.4);
      else if (member) this.faceMember(member, c * T + T / 2, r * T + T / 2);
      await new Promise<void>((done) => this.tweens.add({ targets: sprite, x: c * T + T / 2, y: r * T + T / 2, duration: who === 'hero' || member ? AREA_STEP_MS * 1.4 : ENEMY_MOVES.patrol.stepMs, onComplete: () => done() }));
      at = [c, r];
    }
    for (const m of this.party) m.img.stop().setFrame(m.art.idleFrame);
    if (who === 'hero') this.state = { ...this.state, cell: to };
    else if (enemy) enemy.mind = { ...enemy.mind, cell: to };
  }

  /** 出し抜く（段階263）：見つかる範囲を描き、範囲の中にいる（陰でない）仲間を見つける */
  private updateSight(): void {
    const g = this.sightView;
    if (!g) return;
    g.clear();
    const player = this.state.cell;
    for (const e of this.enemies) {
      if (e.move !== 'patrol' && e.move !== 'chase') continue;
      if (!e.spotted && spotted(this.map, this.room, e.mind.cell, e.facing, player)) {
        e.spotted = true;
        e.alert?.setVisible(true);
        playSe(this, SE.encounter);
      }
      // 段階278：マスの四角でなく、放射状の扇で描く（壁でさえぎる）。外へいくほど薄く
      const fan = sightFan(this.map, e.mind.cell, e.facing);
      const ox = e.mind.cell[0] * T + T / 2;
      const oy = e.mind.cell[1] * T + T / 2;
      const color = e.spotted ? 0xff3040 : 0xffd890;
      for (const [k, alpha] of [[1, e.spotted ? 0.14 : 0.1], [0.72, e.spotted ? 0.12 : 0.08], [0.45, e.spotted ? 0.12 : 0.08]] as const) {
        g.fillStyle(color, alpha);
        g.beginPath();
        g.moveTo(ox, oy);
        for (const p of fan) g.lineTo(ox + (p.x * T - ox) * k, oy + (p.y * T - oy) * k);
        g.closePath();
        g.fillPath();
      }
    }
  }

  /** 不意打ち（段階263）：見つかる前に触れた。コマを持たない砂嵐はその場で散らす（素材を1つ）。コマを持つ砂嵐・番人は先手の戦闘 */
  private ambush(e: Enemy): boolean {
    const battle = AREA_BATTLES[e.battle];
    const kind = ambushKind(e.move, battle?.koma ?? 0);
    if (kind === 'none' || e.spotted) return false;
    if (kind === 'first') {
      this.startBattle(e.battle, e.id, true);
      return true;
    }
    this.state = defeatEnemy(this.state, e.id);
    this.enemies = this.enemies.filter((x) => x !== e);
    this.tweens.killTweensOf(e.sprite);
    this.tweens.add({ targets: e.sprite, scale: 1.6, alpha: 0, duration: 380, onComplete: () => e.sprite.destroy() });
    const drop = battle?.enemies.flatMap((x) => x.drops ?? [])[0];
    if (drop) run.armory = capItems(WEAPON_DATA, addItems(run.armory, [drop])).armory;
    playSe(this, SE.heal);
    this.say(`不意打ち！ 砂嵐を散らした${drop ? `\n${WEAPON_DATA.items[drop]?.name ?? drop}を手に入れた` : ''}`);
    this.keep(this.state);
    return true;
  }

  /** 全体の地図（段階47a）：入った部屋とつながり。今いる部屋は明るく */
  private drawRoomMap(): Phaser.GameObjects.Container {
    const pos = roomPositions(this.area);
    // 段階281：場所の手がかりをもらった、まだ解いていない仕掛けのある部屋（まだ入っていない部屋でも出す）
    const flags = this.state.flags ?? [];
    const hinted = new Set((this.area.gadgets ?? []).filter((g) => flags.includes(`hint:${g.id}`) && !flags.includes(g.id) && g.room && pos[g.room]).map((g) => g.room!));
    const seen = [...new Set([...this.state.visited, ...hinted])].filter((id) => pos[id]);
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
      if (hinted.has(id)) {
        const mark = addText(this, x, y, '！', { size: 12, bold: true, color: '#ffd84a' }).setOrigin(0.5).setStroke('#3a2a00', 3);
        box.add(mark);
        this.tweens.add({ targets: mark, scale: 1.3, yoyo: true, repeat: -1, duration: 500 });
      }
    }
    return box;
  }

  /**
   * 区画の予告（段階201。一覧の 18-3）：この区画の砂嵐に多い性質と、効くギア。withBoss ならぬしの性質も。
   * ムーブメントが開く前（1章）は出さない
   */
  private traitForecast(withBoss: boolean): string {
    if (!storyLineup().unlocks.navi) return '';
    const hints = areaTraitHints(this.area.id);
    const name = (id: string) => NAVI_DATA.parts[id]?.name ?? id;
    const lines = [traitHintLine('この先', hints.field, name), withBoss ? traitHintLine('ぬし', hints.boss, name) : ''].filter((x) => x);
    return lines.length ? `\n${lines.join('\n')}` : '';
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

/** 屋根を重ねる絵の名前（段階121。開くたびに作り直す） */
const ROOF_TEXTURE = 'exploreRoof';
/** 陰に入った仲間・敵の色（段階121） */
const SHADE_TINT = 0x8088a0;

/** 足もとの高さ（段階273）：絵には foot を書いてある。仲間と敵の入れ物は、真ん中から半マス下 */
function footOf(o: Phaser.GameObjects.GameObject): number {
  const f = (o as Phaser.GameObjects.Image).getData?.('foot') as number | undefined;
  return typeof f === 'number' ? f : (o as Phaser.GameObjects.Container).y + T / 2;
}

/** 上の帯（区画の名前・コマ・連携技と、その下の案内）の高さ */
const TOP_BAND = 132;

/** 下の帯（仲間の HP・MP）の高さ。2人以上の時は2行で、下の端のビルド日時の分だけ高い */
function vitalsBandHeight(members: number): number {
  return members > 1 ? 48 : 26;
}
/** HP・MP を仲間ごとの列に並べる幅（右下の設定のボタンの左まで） */
const VITALS_WIDTH = GAME_WIDTH - 56;

/** 地図直しの試し歩き（段階121）で、部屋に入って立つマス：S か P、なければ最初の出入口の内側、なければ最初の歩けるマス */
function tuneStart(room: RoomDef): GridCell {
  let found: GridCell | null = null;
  room.layout.forEach((line, r) => [...line].forEach((ch, c) => !found && (ch === 'S' || ch === 'P') && (found = [c, r])));
  if (found) return found;
  if (room.exits[0]) return entryCells(room, room.exits[0])[0];
  room.layout.forEach((line, r) => [...line].forEach((ch, c) => !found && ch !== '#' && (found = [c, r])));
  return found ?? [0, 0];
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
