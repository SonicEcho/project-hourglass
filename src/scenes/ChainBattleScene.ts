import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  availableLinks,
  chainEnemyDef,
  chainMoveOf,
  chainOrder,
  chainPlanError,
  chainPlanSyncs,
  chainPlanTeethHits,
  chainPlanClaps,
  chainPlanPitch,
  createChainBattle,
  isWeakKnown,
  findChainUnit,
  nextStart,
  plannedEffects,
  planStarts,
  runChainRound,
  chainGrade,
  stepAllies,
  stepCards,
  shootShutter,
  type ChainEvent,
  chainCardCategory,
  type ChainCardCategory,
  type ChainFrame,
  type ChainMove,
  type ChainPlanStep,
  type ChainSource,
  type ChainStatusKind,
  type ChainTrick,
  type ChainState,
  type ChainUnit,
} from '../core';
import { ENEMY_PART_SPOTS, CHAIN_COACH, CHAIN_COACH_ORDER, CHAIN_TUTORIAL_HAND, CHAIN_TUTORIAL_HAND2, type ChainCoachTarget, CHAIN_MAIN_CARD_ART, CHAIN_MAIN_SHORT_TEXT, CHAIN_ALBUM, CHAIN_ALLY_SPECIALS, CHAIN_ENEMY_SNAPS, CHAIN_ENEMY_SNAP_RATE, CHAIN_SNAPS, AKARI, AREA_BATTLES, CHAIN_AREA_SETUPS, BATTLE_BGM, BGM, HERO, MIO, type CampaignBattle, ALLY_FACE, CHAIN17_CARD_ART, CHAIN17_MOVE_ART, CHAIN17_SHORT_TEXT, CHAIN_CARD_ART as CHAIN_CARD_ART_16, CHAIN_MOVE_ART as CHAIN_MOVE_ART_16, CHAIN_REWARDS, CHAIN_RULES, CHAIN_SHORT_TEXT as CHAIN_SHORT_TEXT_16, CHAIN_TRAIT_TEXT, CHAIN_TRIAL_BG, CHAIN_TRIALS, chainTrialDef, type ChainStage, ENEMY_ART, FACE_CROP, FACE_CROPS, SE } from '../data';
import { buildMainChainBattle, chainAlbumDeck, chainEncounterResult, chainTipTriggers, isChainFinish, nextRandom, type ChainBattleDef, type Lineup, type CharacterDef } from '../core';
import { currentParty, partyChoice, run, setBattleMark, storyBattleLineup } from './run';
import type { BattleSceneData } from './BattleScene';
import { SNAP_CATEGORY } from '../ui/listKit';
import { addFoundChainCombo, foundChainCombos, keepChainWeak, knownChainWeak, recordChainBattle, settleChainWin, type ChainWinReward } from './chainEncounter';
import { markTipSeenNow, seenTips } from '../ui/tipPanel';
import { smartChainPlan } from '../sim/chainAuto';
import { isDebugEnabled } from '../debug/debugFlag';
import { browserStorage } from '../save/storage';
import { hasImage } from '../assets/loader';
import { playBgm, playSe } from '../audio/sound';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, RENDER_SCALE } from '../ui/theme';
import { addText, makePressable } from '../ui/widgets';
import { waitImages } from '../ui/waitImages';

// 試し：並べてつなぐ戦闘の画面（段階156。docs/milestones/M3_battle_review.md の 12.）。
// デバッグメニューから開く。今の戦闘の画面（BattleScene）とは別。仕組みは src/core/chain.ts、数値は src/data/chainTrial.ts

export interface ChainBattleData {
  trial: string;
  seed?: number;
  /** 序盤（技を覚える前）か中盤か（調整14。省くと中盤） */
  stage?: ChainStage;
  /** 段階158：本番の仲間（育成を反映した今の並び）と、1-1 の砂嵐の敵で戦う */
  main?: boolean;
  /** 段階159：探索から来た戦闘（今の戦闘の BattleSceneData と同じ形）。区画の戦闘の敵と今の並びで戦い、報酬を受け取って戻る */
  encounter?: BattleSceneData['encounter'];
}

/** 手札を決める（山札と手札をまとめ、ids の札を手札へ。足りない分は山札の上から） */
function forceHand(s: ChainState, ids: string[]): void {
  const pool = [...s.hand, ...s.deck];
  const hand: string[] = [];
  for (const id of ids) {
    const i = pool.indexOf(id);
    if (i >= 0) hand.push(...pool.splice(i, 1));
  }
  while (hand.length < s.rules.handSize && pool.length) hand.push(pool.shift()!);
  s.hand = hand;
  s.deck = pool;
}

/** 警戒の印（残りのラウンドの数を＋で。1：警戒、2：警戒+、3：警戒++） */
function guardLabel(left: number): string {
  return `警戒${'+'.repeat(Math.max(0, left - 1))}`;
}

/** 文字から作る、ずらしの数（今の戦闘と同じ。探索の戦闘のシードを、戦闘ごとに変えるため） */
function textHash(text: string): number {
  let h = 0;
  for (const ch of text) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** 速さ（×1・×2）を覚える所（端末ごと） */
const SPEED_KEY = 'hourglass.chainSpeed';

/** 段階158：本番の仲間（今の並び。育成を反映）と 1-1 の砂嵐の敵。札は調整17の試しのアルバム */
function mainTrialDef(): ChainBattleDef {
  let party: CharacterDef[];
  try {
    const { lineup, chosen } = partyChoice();
    const all = currentParty(lineup);
    party = all.filter((c) => chosen.includes(c.id));
    if (!party.length) party = all;
  } catch {
    party = [HERO, AKARI, MIO];
  }
  const base = CHAIN_TRIALS[0];
  return buildMainChainBattle({ id: base.id, name: '本番の仲間で', party: party.slice(0, 3), enemies: AREA_BATTLES.a11_n1_road.enemies, deck: base.deck, cards: base.cards, links: base.links, gradeAt: base.gradeAt });
}

/** 画面の割り付け（調整9：今の戦闘のイメージ docs/sketches/battle/chain に合わせた） */
const STAGE_Y = 44;
const FILM_Y_BASE = 308;
const STAGE_H = 262;
const ART_Y = STAGE_Y + 112;
/** 案内の帯（敵の HP の帯の下から、フィルムの上まで） */
const MSG_TOP = STAGE_Y + 198;
const MSG_H = FILM_Y_BASE - MSG_TOP;
const FILM_Y = 308;
const FILM_H = 126;
const FILM_X = 22;
const CELL = (GAME_WIDTH - FILM_X - 12) / CHAIN_RULES.roundLen;
/** フィルムの中：敵の予定の段と、並べた行動の帯（動画の編集ソフトのクリップのように、札の絵を並べる） */
const FOE_TRACK = FILM_Y + 44;
const CLIP_TOP = FILM_Y + 68;
const CLIP_H = 38;
const ALLY_Y = 440;
const ALLY_H = 58;
const TAB_Y = 518;
const LINK_Y = 552;
const CARD_W = 70;
const CARD_H = 170;
/** コンボがそろった時の札の高さ（帯と札の間に、材料をつなぐ木を描く場所を空ける） */
const CARD_H_LINK = 156;
/** コンボの木の線の色（1つ目・2つ目・3つ目） */
const LINK_COLORS = [0xffcf5a, 0x7fe0ff, 0xff8ac8];
/** 敵ごとの色（上の予定の札・敵の足元・時間の帯の印を同じ色でつなぐ） */
const FOE_COLORS = [0xff6b8a, 0x5ac8ff, 0xb98aff, 0x7ee08a, 0xffa860];
/** 下のボタンの上の端（右下のビルド日時の上に収める） */
const CMD_Y = 778;
/** 実行中、再生位置が1マス進む時間（ms） */
const TICK_MS = 140;
/** 実行中の待ち時間（ms）：誰が・何をの帯 → 結果 → 次へ（調整4で、半分以下に縮めた） */
const WAIT = { announce: 350, result: 750, big: 1100, cancel: 600, end: 150 } as const;
/** 分かった弱点を、試しの戦闘をまたいで覚えておく所（セーブとは別。調整9） */

/** 札・技の絵と短い効果（調整17の札も） */
const CHAIN_CARD_ART: Record<string, string> = { ...CHAIN_CARD_ART_16, ...CHAIN17_CARD_ART, ...CHAIN_MAIN_CARD_ART };
const CHAIN_MOVE_ART: Record<string, string> = { ...CHAIN_MOVE_ART_16, ...CHAIN17_MOVE_ART };
const CHAIN_SHORT_TEXT: Record<string, string> = { ...CHAIN_SHORT_TEXT_16, ...CHAIN17_SHORT_TEXT, ...CHAIN_MAIN_SHORT_TEXT };
/** 見つけたコンボ（調整17。端末に覚える） */
const RED = 0xff2d55;
const YELLOW = 0xffd23f;
const GOLD = 0xffcf5a;
/** 札の分類（調整11：よくあるゲームの言葉で3つに。付与系もサポート。調整13：専用の札は「スペシャル」に分ける） */
/** 分類の名前（2026-11-07：映像の言葉に。アタック＋回復 → アクション、サポート → エフェクト、フィニッシュ → クライマックス） */
// 段階167：色は一覧の画面と同じ物（src/ui/listKit.ts の SNAP_CATEGORY）
const CATEGORY_LABEL = Object.fromEntries(Object.entries(SNAP_CATEGORY).map(([k, v]) => [k, v.label])) as Record<ChainCardCategory, string>;
const CATEGORY_COLOR = Object.fromEntries(Object.entries(SNAP_CATEGORY).map(([k, v]) => [k, v.color])) as Record<ChainCardCategory, number>;
/** 敵に付いた効果のシールの色（一度で消える物は紫、ラウンドの間続く物は青緑） */
const CHIP_ONCE = 0xb36bff;
const CHIP_LASTING = 0x19d3c5;
/** フォーカスの名前（敵の上に「◎」付きで出す。次の攻撃で使い切る。調整8で写真の言葉に） */
const TRICK_LABEL: Record<ChainTrick, string> = { spread: 'パノラマ', expose: 'ハイライト', opening: 'ピンポイント' };
/** フィルターの名前（敵の上に、残りのラウンドと出す） */
const STATUS_LABEL: Record<ChainStatusKind, string> = { slow: 'スロー', burn: 'ヒート', stack: 'クラック', weak: 'ピンぼけ', seal: 'ポーズ', confuse: 'ハレーション', drain: 'リワインド' };
/** 分裂で出てきた敵の絵（元の敵の絵を小さく使う） */
const SPLIT_ART: Record<string, string> = { miniBalloon: 'balloonNoise' };
/** ぬし戦の並べ方（段階162 調整4）：真ん中にぬしの絵（BOSS_ART）、左右の柱（幅 BOSS_COL）に、ポイ（左）と予定の札（右） */
const BOSS_ART = 192;
const BOSS_COL = (GAME_WIDTH - BOSS_ART) / 2 - 2;

/** 敵の絵（分裂した子は親の絵、部位（段階162。「本体の id_部位」）は本体の絵） */
function artOfEnemy(defId: string): string | undefined {
  return ENEMY_ART[SPLIT_ART[defId] ?? defId] ?? ENEMY_ART[defId.split('_')[0]];
}

type Pending = { source: ChainSource; move: ChainMove } | null;

export class ChainBattleScene extends Phaser.Scene {
  private s!: ChainState;
  private trial = '';
  private stage: ChainStage = 'mid';
  private root!: Phaser.GameObjects.Container;
  private plan: ChainPlanStep[] = [];
  /** サポートを添える先（計画の何行目か。null は最後の行。調整17） */
  private addonAt: number | null = null;
  private ally = '';
  private pending: Pending = null;
  private tab: 'cards' | 'moves' = 'cards';
  private message = '';
  private busy = false;
  /** 実行中の再生位置（フィルムの上を左から右へ動く線。描き直しても消えないよう、root の外に置く） */
  private head: Phaser.GameObjects.Container | null = null;
  private enemyImages = new Map<string, Phaser.GameObjects.Image>();
  /** 実行中：このラウンドのコマと、済んだコマの結果（コマの番号ごと） */
  private runFrames: ChainFrame[] = [];
  /** 夕日の、前に描いた残り（段階169 の後。日が傾いた時に沈む動きを付ける） */
  private sunShown: number | null = null;
  private runResults = new Map<number, string>();
  /** 実行中：今のコマの番号（0 は実行していない） */
  private currentOrder = 0;
  /** 実行中：今動いている者と、ねらわれた相手（光らせる） */
  private actorUid = '';
  private targetUid = '';
  /** 実行中：タップで次へ進める（待ちを飛ばす） */
  private advance: (() => void) | null = null;
  /** 探索から来た戦闘（段階159） */
  private encounter?: BattleSceneData['encounter'];
  private areaBattle?: CampaignBattle;
  private lineup?: Lineup;
  private seed = 0;
  /** 演出の速さ（×1・×2） */
  private speed: 1 | 2 = 1;
  /** 気をつける案内（赤く出す。案内が変わると、ふつうの見た目に戻る） */
  private warnMsg = '';
  /** クライマックスの確かめ：1回目のタップで知らせた札 */
  private climaxOk: string | null = null;
  /** コンボのカットイン（出ている物と、このラウンドで出したコマ） */
  private cutInBox: Phaser.GameObjects.Container | null = null;
  private cutInMasks: Phaser.GameObjects.Graphics[] = [];
  private cutInShown = new Set<number>();
  /** 切り取りで抜き取られた、このラウンドの計画の番号（段階176 の後。帯から消す） */
  private cutSteps = new Set<number>();

  private warn(text: string): void {
    this.message = text;
    this.warnMsg = text;
    this.render();
  }

  constructor() {
    super('ChainBattle');
  }

  create(data: ChainBattleData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f22).setOrigin(0);
    this.trial = data.trial;
    this.stage = data.stage ?? 'mid';
    this.encounter = data.encounter;
    this.firstTutorialBattle = false;
    this.speed = browserStorage().read(SPEED_KEY) === '2' ? 2 : 1;
    const area = data.encounter ? AREA_BATTLES[data.encounter.battle] : undefined;
    if (data.encounter && !area) throw new Error(`unknown area battle ${data.encounter.battle}`);
    this.areaBattle = area;
    if (data.encounter && area) {
      // 探索から来た戦闘（段階159）：今の並び（育成を反映）・区画の中の HP と MP・区画の戦闘の敵。
      // 区画ごとに書いた新しい戦闘の中身（段階160。1-1 の敵の予定の癖と型・山札・コンボ）があれば、それで。なければ試しの札と、今の敵から仮に作る
      this.lineup = storyBattleLineup();
      const base = CHAIN_TRIALS[0];
      const setup = CHAIN_AREA_SETUPS[area.id];
      const party = currentParty(this.lineup);
      // 山札（段階163）：区画を作り直した戦闘は、新しい戦闘のアルバム＋並びの仲間ごとのスペシャル
      const albumDeck = setup ? chainAlbumDeck(run.chainAlbum, CHAIN_SNAPS, CHAIN_ALLY_SPECIALS, party.map((c) => c.id)) : undefined;
      const def = buildMainChainBattle({
        id: area.id,
        name: area.name,
        party,
        enemies: area.enemies,
        chainEnemies: setup?.enemies,
        variants: setup?.variants,
        poi: setup?.poi,
        sunset: setup?.sunset,
        teeth: setup?.teeth,
        clap: setup?.clap,
        pitch: setup?.pitch,
        deck: albumDeck ?? base.deck,
        cards: setup?.cards ?? base.cards,
        links: setup?.links ?? base.links,
        cutoffRounds: area.cutoff?.rounds,
        gradeAt: setup?.gradeAt ?? (area.boss ? { high: 35, mid: 50 } : { high: 13, mid: 20 }),
      });
      this.seed = (run.seed + textHash(area.id) + (data.encounter.seedShift ?? 0) * 104729) >>> 0;
      const vitals = data.encounter.hunt ? run.hunt?.state.vitals : run.explore?.vitals;
      this.s = createChainBattle(def, CHAIN_RULES, this.seed, knownChainWeak(true), vitals ?? {});
      // チュートリアル（段階161）：最初の戦闘は手札を決めておく（2ラウンド目にエフェクトとクライマックスの説明が出るように）
      // 2戦目（最初の戦闘を終えて、スペシャルとコンボをまだ見ていない）は、コンボがそろう手札にする
      const seenNow = seenTips();
      this.firstTutorialBattle = !seenNow.includes('chain_plan');
      if (this.firstTutorialBattle) forceHand(this.s, CHAIN_TUTORIAL_HAND);
      else if (!seenNow.includes('chain_combo')) forceHand(this.s, CHAIN_TUTORIAL_HAND2);
      playBgm(this, BATTLE_BGM[area.id] ?? (area.boss ? BGM.boss : BGM.battle));
      // 戦闘中の印（今の戦闘と同じ）：閉じたら「つづきから」で、この戦闘の始めから
      if (!data.encounter.hunt) {
        const target = (t: { key: string; data: object }) => ({ key: t.key, data: { ...t.data } as Record<string, unknown> });
        setBattleMark({ battle: data.encounter.battle, win: target(data.encounter.win), lose: target(data.encounter.lose) });
      }
    } else {
      const def = data.main ? mainTrialDef() : chainTrialDef(data.trial, this.stage);
      this.seed = data.seed ?? Date.now() % 100000;
      this.s = createChainBattle(def, CHAIN_RULES, this.seed, knownChainWeak(false));
    }
    this.root = this.add.container(0, 0);
    this.plan = [];
    this.pending = null;
    this.climaxOk = null;
    this.warnMsg = '';
    this.coach = null;
    this.coachLayer = null;
    this.tab = 'cards';
    this.busy = false;
    this.head = null;
    this.ally = this.firstFreeAlly();
    this.runFrames = [];
    this.sunShown = null;
    this.runResults = new Map();
    this.currentOrder = 0;
    this.actorUid = '';
    this.targetUid = '';
    this.advance = null;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // 「結果まで飛ばす」のボタンの上は、次へ進めない（描き直すと、ボタンが押せなくなるため）
      if (p.worldY > CMD_Y - 10 && p.worldX > GAME_WIDTH - 220) return;
      if (this.busy && this.advance) this.advance();
    });
    this.message = `${this.stage === 'early' ? '序盤（技はまだ通常攻撃だけ）。' : this.stage === 'multi' ? '連続（時間の許す限り、同じ仲間が何回でも動ける。同じ技は1ラウンドに1回）。' : ''}${this.s.variant ? `型「${this.s.variant}」。` : ''}${this.s.def.finishLast ? 'エフェクトは並べた行動に添える（時間を使わない。2枚まで）。クライマックスは最後に。' : '上の札は敵の予定。並べた行動は、重さの分だけかかって終わった時に効く。'}弱点は当てると分かる`;
    const ids = [CHAIN_TRIAL_BG[this.s.def.id], ...this.s.def.enemies.map((e) => ENEMY_ART[e.id]), ...this.s.def.allies.map((a) => ALLY_FACE[a.id]), ...Object.values(CHAIN_CARD_ART), ...Object.values(CHAIN_MOVE_ART)].filter((x): x is string => !!x);
    waitImages(this, ids, () => this.render());
  }

  /** 計画で、もう並べた仲間（連携技は2人） */
  private plannedAllies(): Set<string> {
    return new Set(this.plan.flatMap((p) => stepAllies(this.s, p)));
  }

  private firstFreeAlly(): string {
    // 1人1回をやめた試し（調整16）：今の仲間のまま続けて並べられる
    if (this.s.def.multiAct) return this.s.allies.find((a) => a.uid === this.ally && a.hp > 0)?.uid ?? this.s.allies.find((a) => a.hp > 0)?.uid ?? '';
    const used = this.plannedAllies();
    return this.s.allies.find((a) => a.hp > 0 && !used.has(a.uid))?.uid ?? '';
  }

  private allyName(defId: string): string {
    return this.s.def.allies.find((a) => a.id === defId)?.name ?? '';
  }

  // ---------- 描く ----------
  // 調整9：今の戦闘と同じ派手な見た目（黒と赤と黄、斜めの札、フィルムの穴、写真の札）。イメージは docs/sketches/battle/chain

  /** 斜めの四角（左下へ傾く。slant は上の辺のずれ） */
  private para(x: number, y: number, w: number, h: number, color: number, alpha = 1, slant = 8, stroke?: { w: number; color: number }): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const pts = [new Phaser.Math.Vector2(x + slant, y), new Phaser.Math.Vector2(x + w, y), new Phaser.Math.Vector2(x + w - slant, y + h), new Phaser.Math.Vector2(x, y + h)];
    g.fillStyle(color, alpha).fillPoints(pts, true);
    if (stroke) g.lineStyle(stroke.w, stroke.color, 1).strokePoints(pts, true);
    return g;
  }

  /** 傾いたシール（特徴・WEAK!・DOWN など） */
  private sticker(x: number, y: number, text: string, bg: number, fg: string, angle: number, size = 10, depth = 0): Phaser.GameObjects.Container {
    const t = addText(this, 0, 0, text, { size, bold: true, color: fg }).setOrigin(0.5);
    const box = this.add.rectangle(2, 2, t.width + 12, t.height + 4, 0x000000, 0.8);
    const face = this.add.rectangle(0, 0, t.width + 12, t.height + 4, bg);
    return this.add.container(x, y, [box, face, t]).setAngle(angle).setDepth(depth);
  }

  /** 絵を、w×h の枠いっぱいに中央で切り出す（cx, cy は枠の中心） */
  private cropImage(key: string, cx: number, cy: number, w: number, h: number): Phaser.GameObjects.Image {
    const img = this.add.image(cx, cy, key);
    const src = this.textures.get(key).getSourceImage() as { width: number; height: number };
    const sc = Math.max(w / src.width, h / src.height);
    img.setScale(sc).setCrop((src.width - w / sc) / 2, (src.height - h / sc) / 2, w / sc, h / sc);
    return img;
  }

  /** 立ち絵から顔を四角く切り出す（回した札の中でも使えるよう、丸い型抜きはしない） */
  private faceSquare(defId: string, cx: number, cy: number, size: number): Phaser.GameObjects.Image | null {
    const id = ALLY_FACE[defId];
    if (!id || !hasImage(this, id)) return null;
    const crop = FACE_CROPS[defId] ?? FACE_CROP;
    const src = this.textures.get(id).getSourceImage() as { width: number; height: number };
    const side = src.width * crop.size;
    const sx = src.width * crop.x;
    const sy = src.height * crop.y;
    const img = this.add.image(cx, cy, id).setCrop(sx, sy, side, side);
    img.setOrigin((sx + side / 2) / src.width, (sy + side / 2) / src.height).setScale(size / side);
    return img;
  }

  /** 動画の編集ソフトのクリップのように、絵を正方形のコマにして横に並べる */
  private tileArt(key: string, x: number, y: number, w: number, h: number): void {
    const src = this.textures.get(key).getSourceImage() as { width: number; height: number };
    const side = Math.min(src.width, src.height);
    const sx = (src.width - side) / 2;
    const sy = (src.height - side) / 2;
    const sc = h / side;
    for (let tx = 0; tx < w - 1; tx += h) {
      const dw = Math.min(h, w - tx);
      this.root.add(this.add.image(x + tx - sx * sc, y - sy * sc, key).setOrigin(0).setScale(sc).setCrop(sx, sy, dw / sc, side));
      if (tx > 0) this.root.add(this.add.rectangle(x + tx, y, 1, h, 0x000000, 0.6).setOrigin(0));
    }
  }

  /** 斜めのボタン */
  private slantButton(x: number, y: number, w: number, h: number, label: string, onTap: () => void, opt: { go?: boolean; enabled?: boolean; size?: number; into?: Phaser.GameObjects.Container } = {}): void {
    const on = opt.enabled !== false;
    const r = opt.into ?? this.root;
    if (opt.go && on) r.add(this.para(x - 2, y - 2, w + 4, h + 4, RED, 0.35, 12));
    r.add(this.para(x + 4, y + 4, w, h, 0x000000, 0.7, 12));
    r.add(this.para(x, y, w, h, opt.go ? (on ? RED : 0x5a2030) : 0x1a2040, on ? 1 : 0.6, 12));
    const t = addText(this, x + w / 2, y + h / 2, label, { size: opt.size ?? 14, bold: true, color: on ? (opt.go ? '#ffffff' : '#c9d0ea') : '#5a6280' }).setOrigin(0.5);
    if (opt.go) t.setFontStyle('bold italic');
    r.add(t);
    if (!on) return;
    const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001);
    r.add(hit);
    makePressable(hit, { onTap });
  }

  private render(view: ChainState = this.s): void {
    this.root.removeAll(true);
    this.enemyImages.clear();
    this.drawTop(view);
    this.drawEnemies(view);
    this.drawPoi(view);
    this.drawSunset(view);
    this.drawTeeth(view);
    this.drawClap(view);
    this.drawPitch(view);
    this.drawMessage();
    this.drawFilm(view);
    this.drawAllies(view);
    if (!this.busy && view.outcome === 'ongoing' && !view.shutter) {
      this.drawTabs();
      this.drawOptions();
      this.drawCommands();
    } else if (this.currentOrder > 0) this.drawRunList();
    // チュートリアル（段階161）：探索から来た戦闘で、その場面になった時に、画面の一部を照らして説明する（見た物は出さない）
    this.updateCoach();
  }

  // ---------- チュートリアル（段階161） ----------

  /** 今の説明の組と、何番目か。照らす覆い */
  private coach: { id: string; i: number } | null = null;
  /** この戦闘が、チュートリアルの最初の戦闘か（始めた時に、まだ最初の説明を見ていなかった） */
  private firstTutorialBattle = false;
  /** 今の手順を出し始めた時刻（出た直後のタップは受け付けない。実行中の「タップで次へ」の続きで、うっかり閉じないように） */
  private coachSince = { key: '', at: 0 };
  private coachLayer: Phaser.GameObjects.Container | null = null;

  private updateCoach(): void {
    this.coachLayer?.destroy(true);
    this.coachLayer = null;
    if (!this.encounter || this.busy || this.s.outcome !== 'ongoing' || this.s.shutter) return;
    if (!this.coach) {
      const seen = seenTips();
      // スペシャルとコンボは、1戦目では出さない（2戦目にまとめて）
      const want = chainTipTriggers(this.s).filter((x) => !(this.firstTutorialBattle && x === 'chain_combo'));
      const id = CHAIN_COACH_ORDER.find((x) => want.includes(x) && !seen.includes(x));
      if (!id) return;
      this.coach = { id, i: 0 };
    }
    const steps = CHAIN_COACH[this.coach.id];
    // 押してもらう手順は、押し終えたら次へ（札を選んだ・敵を選んで並んだ）
    for (;;) {
      const st = steps[this.coach.i];
      if (!st) break;
      const placed = this.plan.length >= (st.placed ?? 1);
      // 2人目がいない（倒れている・並びに1人）時は、2人目の手順を飛ばす
      const noSecond = !!st.second && !this.s.allies.some((a) => a.hp > 0 && a.uid !== this.s.allies[0]?.uid);
      const done =
        noSecond ||
        (st.target === 'card' || st.target === 'move'
          ? !!this.pending || placed
          : st.target === 'enemy'
            ? placed
            : st.target === 'movesTab'
              ? this.tab === 'moves' || placed
              : false);
      if (!done) break;
      this.coach.i++;
    }
    const step = steps[this.coach.i];
    if (!step) {
      this.endCoach();
      return;
    }
    // 照らす札が手札になければ（最初の手順は、技の「通常攻撃」で代わりにする）
    if (step.target === 'card' && this.coachCardIndex() < 0 && this.tab === 'cards') {
      this.tab = 'moves';
      this.render();
      return;
    }
    if ((step.target === 'addonCard' || step.target === 'climaxCard' || step.target === 'specialCard' || step.target === 'comboBar') && this.tab !== 'cards') {
      this.tab = 'cards';
      this.render();
      return;
    }
    const hole = step.target === 'intro' ? null : this.coachRect(step.target);
    if (!hole && step.target !== 'intro') {
      this.endCoach();
      return;
    }
    const key = `${this.coach.id}:${this.coach.i}`;
    if (this.coachSince.key !== key) this.coachSince = { key, at: this.time.now };
    this.drawCoach(hole, step.text, !!step.guide);
  }

  private endCoach(): void {
    if (this.coach) markTipSeenNow(this.coach.id);
    this.coach = null;
    this.coachLayer?.destroy(true);
    this.coachLayer = null;
  }

  /** 最初の手順で照らす札：手札の、敵1体を攻撃するアクション（スペシャルは、選んでいる仲間の物だけ） */
  private coachCardIndex(): number {
    const me = findChainUnit(this.s, this.ally);
    return this.s.hand.findIndex((id) => {
      const m = this.s.def.cards[id];
      return !!m && m.type === 'attack' && m.target === 'enemy' && (!m.owner || m.owner === me?.defId);
    });
  }

  private coachRect(t: ChainCoachTarget): { x: number; y: number; w: number; h: number } | null {
    const links = this.tab === 'cards' ? availableLinks(this.s, this.plan) : [];
    const top = links.length ? LINK_Y + 64 : LINK_Y + 4;
    const cardH = links.length ? CARD_H_LINK : CARD_H;
    const step = (GAME_WIDTH - 8) / 5;
    const card = (i: number) => (i < 0 || i > 4 ? null : { x: 4 + step * i + step / 2 - CARD_W / 2 - 8, y: top - 8, w: CARD_W + 16, h: cardH + 16 });
    const foes = this.shownEnemies(this.s);
    const colW = GAME_WIDTH / Math.max(1, foes.length);
    switch (t) {
      case 'intent': {
        if (this.bossLayout(this.s)) return { x: GAME_WIDTH - BOSS_COL - 4, y: STAGE_Y + 2, w: BOSS_COL + 2, h: 114 };
        const k = Math.max(0, foes.findIndex((e) => e.hp > 0 && !e.gone));
        return { x: colW * k + 6, y: STAGE_Y + 2, w: colW - 6, h: 42 };
      }
      case 'film':
        return { x: 0, y: FILM_Y, w: GAME_WIDTH, h: FILM_H };
      case 'card':
        return card(this.tab === 'cards' ? this.coachCardIndex() : 0);
      case 'enemy':
        return { x: 0, y: STAGE_Y + 46, w: GAME_WIDTH, h: 150 };
      case 'exec':
        return { x: 204, y: CMD_Y - 4, w: 184, h: 54 };
      case 'ally2': {
        const n = this.s.allies.length;
        const w = (GAME_WIDTH - 16) / n;
        const k = Math.max(0, this.s.allies.findIndex((a) => a.uid === this.ally));
        return { x: 8 + w * k - 4, y: ALLY_Y - 6, w: w, h: ALLY_H + 12 };
      }
      case 'movesTab':
        return { x: 136, y: TAB_Y - 18, w: 68, h: 32 };
      case 'move': {
        const me = findChainUnit(this.s, this.ally);
        const moves = this.s.def.allies.find((a) => a.id === me?.defId)?.moves ?? [];
        const k = moves.findIndex((m) => !!m.mp && m.target === 'enemy' && (me?.mp ?? 0) >= (m.mp ?? 0));
        return card(k >= 0 ? k : 0);
      }
      case 'intro':
        return null;
      case 'trait_sticky':
      case 'trait_counter':
      case 'trait_hard':
      case 'trait_shell':
      case 'trait_shield':
      case 'trait_flee':
      case 'trait_split':
      case 'trait_pop': {
        // 敵の性質の札（敵の列の上の黄色のシール）と、その敵の名前のあたり
        const k = foes.findIndex((e) => e.hp > 0 && !e.gone && e.trait === t.slice(6));
        if (k < 0) return null;
        return { x: colW * k + 4, y: STAGE_Y + 42, w: Math.min(colW - 8, 150), h: 28 };
      }
      case 'guard': {
        // 警戒の印（敵の絵の下寄り。ぬし戦は絵の上の端）
        const k = foes.findIndex((e) => e.hp > 0 && !e.gone && (e.guard ?? 0) > 0);
        if (k < 0) return null;
        const art = this.bossArt(this.s, foes[k], colW * k + colW / 2);
        const x = art ? art.x + 6 : colW * k + colW / 2 + 6;
        const y = art ? art.y - art.size / 2 + 16 : ART_Y + 34;
        return { x: x - 56, y: y - 18, w: 112, h: 36 };
      }
      case 'poiBar':
        return this.bossLayout(this.s) ? { x: 2, y: STAGE_Y + 2, w: BOSS_COL + 2, h: 166 } : { x: 4, y: STAGE_Y + 36, w: GAME_WIDTH - 8, h: 30 };
      case 'parts': {
        // 部位の印と、名前の札（札が出る向きの側だけ）を囲む
        const parts = this.s.enemies.filter((e) => !!chainEnemyDef(this.s, e.defId)?.part && e.hp > 0);
        const boxes = parts.flatMap((e) => {
          const p = this.partSpot(this.s, e);
          if (!p) return [];
          if (p.side === 'below') return [{ l: p.x - 44, r: p.x + 44, t: p.y - 26, b: p.y + 56 }];
          const labelLeft = p.side === 'left' && p.x - 110 > (this.bossLayout(this.s) ? BOSS_COL : 0);
          return [{ l: p.x - 26 - (labelLeft ? 104 : 0), r: p.x + 26 + (labelLeft ? 0 : 104), t: p.y - 30, b: p.y + 28 }];
        });
        if (!boxes.length) return null;
        const l = Math.max(2, Math.min(...boxes.map((b) => b.l)));
        const rr = Math.min(GAME_WIDTH - 2, Math.max(...boxes.map((b) => b.r)));
        const t = Math.min(...boxes.map((b) => b.t));
        const b = Math.max(...boxes.map((x) => x.b));
        return { x: l, y: t, w: rr - l, h: b - t };
      }
      case 'weak':
        return { x: 0, y: STAGE_Y + 158, w: GAME_WIDTH, h: 32 };
      case 'specialCard':
        return card(this.s.hand.findIndex((id) => !!this.s.def.cards[id]?.owner));
      case 'addonCard':
        return card(this.s.hand.findIndex((id) => this.s.def.cards[id]?.effect.kind === 'addon'));
      case 'climaxCard':
        return card(this.s.hand.findIndex((id) => isChainFinish(this.s.def.cards[id])));
      case 'comboBar':
        return links.length ? { x: 4, y: LINK_Y - 6, w: GAME_WIDTH - 8, h: 40 } : null;
    }
  }

  /**
   * 照らす覆い：照らす所のまわりを暗くし、黄色の枠を点滅させ、吹き出しに説明。
   * guide：照らした所だけ押せる（まわりの暗い所は押せない）。それ以外は、画面のどこかをタップで次へ
   */
  private drawCoach(hole: { x: number; y: number; w: number; h: number } | null, text: string, guide: boolean): void {
    // 照らす所がない手順（はじめのあいさつ）は、画面のまん中に吹き出しだけ
    const h = hole ?? { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 - 120, w: 0, h: 0 };
    const o = this.add.container(0, 0).setDepth(120);
    this.coachLayer = o;
    const dim = 0x000000;
    const a = 0.62;
    const parts = [
      this.add.rectangle(0, 0, GAME_WIDTH, h.y, dim, a),
      this.add.rectangle(0, h.y + h.h, GAME_WIDTH, GAME_HEIGHT - h.y - h.h, dim, a),
      this.add.rectangle(0, h.y, h.x, h.h, dim, a),
      this.add.rectangle(h.x + h.w, h.y, GAME_WIDTH - h.x - h.w, h.h, dim, a),
    ].map((r) => r.setOrigin(0));
    for (const r of parts) {
      if (guide) r.setInteractive();
      o.add(r);
    }
    if (hole) {
      const frame = this.add.rectangle(h.x, h.y, h.w, h.h).setOrigin(0).setStrokeStyle(3, YELLOW);
      o.add(frame);
      this.tweens.add({ targets: frame, alpha: 0.35, duration: 520, yoyo: true, repeat: -1 });
    }
    // 吹き出し：照らした所が上半分なら下に、下半分なら上に
    const below = h.y + h.h / 2 < GAME_HEIGHT / 2;
    const bw = GAME_WIDTH - 32;
    const t = addText(this, 0, 0, text, { size: 14, bold: true, color: '#1a1300', wrap: bw - 28, ja: true }).setLineSpacing(4);
    const hint = guide ? '' : 'タップで次へ ▶';
    const bh = t.height + (hint ? 40 : 24);
    const by = below ? Math.min(h.y + h.h + 14, GAME_HEIGHT - bh - 12) : Math.max(h.y - bh - 14, 12);
    const box = this.add.container(16, by);
    box.add(this.add.rectangle(4, 5, bw, bh, 0x000000, 0.5).setOrigin(0));
    box.add(this.add.rectangle(0, 0, bw, bh, 0xfff6d8).setOrigin(0).setStrokeStyle(3, YELLOW));
    const tip = below ? [h.x + h.w / 2 - 16 - 10, 0, h.x + h.w / 2 - 16 + 10, 0, h.x + h.w / 2 - 16, -12] : [h.x + h.w / 2 - 16 - 10, bh, h.x + h.w / 2 - 16 + 10, bh, h.x + h.w / 2 - 16, bh + 12];
    if (hole) box.add(this.add.triangle(0, 0, tip[0], tip[1], tip[2], tip[3], tip[4], tip[5], 0xfff6d8).setOrigin(0));
    else box.add(addText(this, bw / 2, -2, 'TUTORIAL', { size: 12, bold: true, color: '#ffffff' }).setOrigin(0.5, 1).setFontStyle('bold italic').setShadow(2, 2, '#ff2d55', 0, false, true));
    t.setPosition(14, 12);
    box.add(t);
    if (hint) box.add(addText(this, bw - 14, bh - 14, hint, { size: 11, bold: true, color: '#a06a00' }).setOrigin(1, 0.5));
    o.add(box);
    if (!guide) {
      // 説明だけの手順：画面のどこをタップしても次へ（下の物は押せない）
      const all = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.001).setOrigin(0).setInteractive();
      all.on('pointerup', () => {
        if (!this.coach || this.time.now - this.coachSince.at < 600) return;
        this.coach.i++;
        if (!CHAIN_COACH[this.coach.id][this.coach.i]) this.endCoach();
        this.render();
      });
      o.add(all);
    }
  }

  /** 上の帯：● REC・ROUND・組み合わせと型 */
  private drawTop(view: ChainState): void {
    const r = this.root;
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x10162c, 0x000000, 0x10162c, 1).fillRect(0, 0, GAME_WIDTH, STAGE_Y);
    g.fillStyle(RED, 1).fillRect(0, STAGE_Y - 2, GAME_WIDTH, 2);
    r.add(g);
    r.add(this.add.circle(16, 21, 5, RED));
    r.add(addText(this, 25, 21, 'REC', { size: 11, bold: true }).setOrigin(0, 0.5));
    // 斜体の字は右の端が文字の箱からはみ出して切れるので、右に余白を足す
    const round = addText(this, 58, 21, `ROUND ${String(view.round).padStart(2, '0')}`, { size: 22, bold: true }).setOrigin(0, 0.5).setFontStyle('bold italic').setPadding(0, 0, 10, 0);
    round.setShadow(3, 3, '#ff2d55', 0, false, true);
    r.add(round);
    const name = `${this.stage === 'early' ? '序盤：' : this.stage === 'multi' ? '連続：' : ''}${this.s.def.name.replace(/（.*）/, '')}${view.variant ? ` ／ ${view.variant}` : ''}`;
    // 速さ（×1・×2）と、デバッグの時だけオート（考える方針で1ラウンド並べて実行）
    const small = (x: number, w: number, label: string, on: boolean, tap: () => void) => {
      r.add(this.para(x, 11, w, 20, on ? YELLOW : 0x1a2040, 1, 6));
      r.add(addText(this, x + w / 2, 21, label, { size: 10, bold: true, color: on ? '#000000' : '#c9d0ea' }).setOrigin(0.5));
      const hit = this.add.rectangle(x + w / 2, 21, w + 6, 30, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, { onTap: tap });
    };
    small(208, 32, `×${this.speed}`, this.speed === 2, () => this.toggleSpeed());
    const debug = isDebugEnabled(window.location.search);
    if (debug) small(246, 42, 'AUTO', false, () => this.autoRound());
    const t = addText(this, GAME_WIDTH - 18, 21, name, { size: 10, bold: true }).setOrigin(1, 0.5);
    const room = GAME_WIDTH - (debug ? 312 : 270);
    if (t.width > room) t.setScale(room / t.width);
    r.add(this.para(GAME_WIDTH - 28 - t.displayWidth, 10, t.displayWidth + 20, 22, RED, 1, 8));
    r.add(t);
  }

  /** 敵の場の下の、案内の帯 */
  private drawMessage(): void {
    const r = this.root;
    // 敵の HP の帯の下から、フィルムの上まで（3行まで読める大きさ。それより長い時だけ縮める）
    // 置けなかった時・気をつける時は、赤い帯と字で（ふつうの案内と見分ける）
    const warn = this.warnMsg === this.message;
    r.add(this.add.rectangle(0, MSG_TOP, GAME_WIDTH, MSG_H, warn ? 0x3a0612 : 0x05060a, 0.9).setOrigin(0));
    r.add(this.add.rectangle(0, MSG_TOP, warn ? 6 : 4, MSG_H, warn ? 0xff2d55 : RED).setOrigin(0));
    const t = addText(this, 12, MSG_TOP + MSG_H / 2, `${warn ? '⚠ ' : ''}${this.message}`, { size: 12, bold: warn, color: warn ? '#ffb3c1' : '#ffffff', wrap: GAME_WIDTH - 24, ja: true }).setOrigin(0, 0.5);
    if (t.height > MSG_H - 6) t.setScale((MSG_H - 6) / t.height);
    r.add(t);
  }

  /** コマを1行の言葉で（「ハルト：斬る → 金魚」） */
  private frameLabel(f: ChainFrame): string {
    const nm = (uid?: string) => (uid ? ((findChainUnit(f.state, uid) ?? findChainUnit(this.s, uid))?.name.replace('ノイズ', '') ?? '') : '');
    const link = f.events.find((e) => e.type === 'link') as { uids: string[] } | undefined;
    const who = link ? link.uids.map(nm).join('＋') : nm(f.uid);
    if (f.key === 'end:sunset') return '夕日';
    if (isRoundEnd(f.key)) return `${who}：${f.name}`;
    return `${who}：${f.name}${f.target && !f.all ? ` → ${nm(f.target)}` : f.all ? '（全体）' : ''}`;
  }

  /** 実行中の、動く順の一覧（済んだコマは薄く、今のコマは黄色、この後のコマは白） */
  private drawRunList(): void {
    const r = this.root;
    const top = ALLY_Y + ALLY_H + 8;
    const bottom = CMD_Y - 32;
    r.add(this.add.rectangle(8, top, GAME_WIDTH - 16, bottom - top, 0x05060a, 0.88).setOrigin(0));
    r.add(this.add.rectangle(8, top, 3, bottom - top, RED).setOrigin(0));
    const rowH = 30;
    const room = Math.floor((bottom - top - 8) / rowH);
    // 今のコマが見えるように、はみ出す時は先へ送る
    const nowIdx = Math.max(0, this.runFrames.findIndex((f) => f.order === this.currentOrder));
    const from = Math.max(0, Math.min(nowIdx - 2, this.runFrames.length - room));
    this.runFrames.slice(from, from + room).forEach((f, k) => {
      const n = f.order;
      const y = top + 8 + k * rowH;
      const done = n < this.currentOrder;
      const now = n === this.currentOrder;
      const ally = findChainUnit(this.s, f.uid)?.side === 'ally';
      const a = done ? 0.4 : 1;
      r.add(this.para(18, y + 2, 28, 18, now ? YELLOW : RED, a, 5));
      r.add(addText(this, 32, y + 11, isRoundEnd(f.key) ? '終' : ally ? String(n) : '敵', { size: 10, bold: true, color: now ? '#000000' : '#ffffff' }).setOrigin(0.5).setAlpha(a));
      const t = addText(this, 54, y + (done || now ? 1 : 11), this.frameLabel(f), { size: 12, bold: true, color: now ? '#ffd23f' : '#eef2ff' }).setOrigin(0, done || now ? 0 : 0.5).setAlpha(a);
      if (t.width > GAME_WIDTH - 76) t.setScale((GAME_WIDTH - 76) / t.width);
      r.add(t);
      const res = this.runResults.get(n);
      if ((done || now) && res) {
        const rt = addText(this, 54, y + 16, res, { size: 9, color: now ? '#ffd23f' : '#c8d0ec' }).setAlpha(a);
        if (rt.width > GAME_WIDTH - 76) rt.setScale((GAME_WIDTH - 76) / rt.width);
        r.add(rt);
      }
    });
    r.add(addText(this, 14, CMD_Y + 23, 'タップで次へ', { size: 10, color: '#7f88a8' }).setOrigin(0, 0.5));
    this.slantButton(GAME_WIDTH - 8 - 200, CMD_Y, 200, 46, '結果まで飛ばす ▶▶', () => this.skipToEnd(), { size: 14 });
  }

  /** ポイの残り（段階162。1-1 のぬしの思い出の再演）。並べた行動の重さの分を、薄く「減る見込み」に */
  private drawPoi(view: ChainState): void {
    const poi = view.def.poi;
    if (!poi) return;
    const r = this.root;
    const left = view.poi ?? poi.total;
    const planned = this.busy ? 0 : this.plan.reduce((a, p) => a + (chainMoveOf(this.s, p)?.weight ?? 0), 0);
    const after = Math.max(0, left - planned);
    const lay = this.bossLayout(view);
    if (lay) {
      // 左の柱：縦向きのゲージ（下から減る）。並べた分の見込みは薄く
      const cx = BOSS_COL / 2 + 2;
      const top = STAGE_Y + 30;
      const h = 110;
      const gw = 18;
      r.add(this.add.rectangle(cx, STAGE_Y + 6, BOSS_COL - 6, 156, 0x000000, 0.55).setOrigin(0.5, 0));
      r.add(addText(this, cx, STAGE_Y + 18, 'ポイ', { size: 13, bold: true, color: '#9ad0ff' }).setOrigin(0.5));
      r.add(this.add.rectangle(cx, top, gw, h, 0x1a2a40).setOrigin(0.5, 0).setStrokeStyle(1, 0x9ad0ff));
      const hl = (h * left) / poi.total;
      const ha = (h * after) / poi.total;
      r.add(this.add.rectangle(cx, top + h - hl, gw, hl, 0x6bc8ff, 0.35).setOrigin(0.5, 0));
      r.add(this.add.rectangle(cx, top + h - ha, gw, ha, after <= 6 ? 0xff6b8a : 0x6bc8ff).setOrigin(0.5, 0));
      const col = after <= 6 ? '#ff9db0' : '#c9e6ff';
      r.add(addText(this, cx, top + h + 12, `${after}/${poi.total}`, { size: 12, bold: true, color: col }).setOrigin(0.5));
      if (planned) r.add(addText(this, cx, top + h + 26, `（−${planned}）`, { size: 10, bold: true, color: col }).setOrigin(0.5));
      return;
    }
    const bx = 8;
    const x = bx + 40;
    const y = STAGE_Y + 50;
    const w = GAME_WIDTH - x - 70;
    r.add(this.para(bx, y - 9, GAME_WIDTH - bx - 8, 22, 0x000000, 0.65, 6));
    r.add(addText(this, bx + 8, y + 2, 'ポイ', { size: 12, bold: true, color: '#9ad0ff' }).setOrigin(0, 0.5));
    r.add(this.add.rectangle(x, y - 3, w, 10, 0x1a2a40).setOrigin(0).setStrokeStyle(1, 0x9ad0ff));
    r.add(this.add.rectangle(x, y - 3, (w * left) / poi.total, 10, 0x6bc8ff, 0.35).setOrigin(0));
    r.add(this.add.rectangle(x, y - 3, (w * after) / poi.total, 10, after <= 6 ? 0xff6b8a : 0x6bc8ff).setOrigin(0));
    r.add(addText(this, GAME_WIDTH - 16, y + 2, `${after}${planned ? `（−${planned}）` : ''}/${poi.total}`, { size: 11, bold: true, color: after <= 6 ? '#ff9db0' : '#c9e6ff' }).setOrigin(1, 0.5));
  }

  /**
   * 夕日（段階169。1-2 のぬしの思い出の再演「日が沈む前に」）：残りのラウンドを夕日の丸で。
   * 並べている間は、並べた予定で息が合う見込み（2人の行動の間に敵の行動がない）を出す
   */
  private drawSunset(view: ChainState): void {
    const sun = view.def.sunset;
    if (!sun) return;
    const r = this.root;
    const left = Math.max(0, view.sunset ?? sun.rounds);
    const syncs = !this.busy && this.plan.length >= 2 ? chainPlanSyncs(this.s, this.plan) : null;
    const synced = this.busy && !!view.roundSynced;
    if (this.bossLayout(view)) {
      // 段階169 の後の直し（開発者：ゲージっぽくせず、丸い日が沈んでいくように）：空と地平線を描き、日が残りに合わせて地平線へ下がる
      const cx = BOSS_COL / 2 + 2;
      const w = BOSS_COL - 14;
      const skyTop = STAGE_Y + 30;
      const horizon = STAGE_Y + 112;
      r.add(this.add.rectangle(cx, STAGE_Y + 6, BOSS_COL - 6, 156, 0x000000, 0.55).setOrigin(0.5, 0));
      r.add(addText(this, cx, STAGE_Y + 18, '夕日', { size: 13, bold: true, color: '#ffc27a' }).setOrigin(0.5));
      const t = left / sun.rounds;
      const sky = this.add.graphics();
      // 日が低いほど、空が赤く暗くなる
      const topCol = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x1a1030), Phaser.Display.Color.ValueToColor(0x2a4a8a), 100, Math.round(t * 100));
      const lowCol = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x5a1a2a), Phaser.Display.Color.ValueToColor(0xff9a5a), 100, Math.round(t * 100));
      const tc = Phaser.Display.Color.GetColor(topCol.r, topCol.g, topCol.b);
      const lc = Phaser.Display.Color.GetColor(lowCol.r, lowCol.g, lowCol.b);
      sky.fillGradientStyle(tc, tc, lc, lc, 1).fillRect(cx - w / 2, skyTop, w, horizon - skyTop);
      r.add(sky);
      const sunY = (n: number) => horizon - (n / sun.rounds) * (horizon - skyTop - 16);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xff4a2a), Phaser.Display.Color.ValueToColor(0xffe070), 100, Math.round(t * 100));
      const sunCol = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
      const glow = this.add.circle(cx, sunY(left), 19, sunCol, 0.3);
      const disc = this.add.circle(cx, sunY(left), 12, sunCol);
      r.add([glow, disc]);
      // 日が傾いた時は、前の高さから沈ませる
      if (this.sunShown !== null && this.sunShown !== left) {
        const from = sunY(this.sunShown);
        glow.setY(from);
        disc.setY(from);
        this.tweens.add({ targets: [glow, disc], y: sunY(left), duration: 900, ease: 'Sine.easeInOut' });
      }
      this.sunShown = left;
      // 地平線と、その下の町（日の下の部分を隠す）
      r.add(this.add.rectangle(cx, horizon, w, 24, 0x140c1c).setOrigin(0.5, 0));
      r.add(this.add.rectangle(cx, horizon, w, 2, 0xffc27a));
      const col = left <= 1 ? '#ff9db0' : '#ffc27a';
      r.add(addText(this, cx, horizon + 12, left > 0 ? `あと${left}` : '日が沈んだ', { size: 12, bold: true, color: col }).setOrigin(0.5));
      const hint = synced ? '息を\n合わせた！' : syncs === null ? '' : syncs ? '息が\n合う ◎' : '間に敵が\n入る';
      if (hint) r.add(addText(this, cx, STAGE_Y + 142, hint, { size: 10, bold: true, align: 'center', color: synced || syncs ? '#8fffc0' : '#c9d0ea' }).setOrigin(0.5));
      return;
    }
    const y = STAGE_Y + 50;
    r.add(this.para(8, y - 9, GAME_WIDTH - 16, 22, 0x000000, 0.65, 6));
    r.add(addText(this, 16, y + 2, `夕日 あと${left}ラウンド${synced ? '（息を合わせた！）' : syncs === null ? '' : syncs ? '（息が合う ◎）' : ''}`, { size: 12, bold: true, color: '#ffc27a' }).setOrigin(0, 0.5));
  }

  /**
   * 歯をそろえる（段階171。2-1 のぬしの思い出の再演）：歯車の絵の歯を、このラウンドにぬしへ当てた回数だけ光らせる。
   * 並べている間は、並べた予定で当たる見込みの回数を薄く
   */
  private drawTeeth(view: ChainState): void {
    const t = view.def.teeth;
    if (!t) return;
    const r = this.root;
    const body = view.enemies.find((e) => e.defId === t.target);
    const now = this.busy ? Math.min(t.need, body?.roundTaken ?? 0) : 0;
    const plan = this.busy ? 0 : Math.min(t.need, chainPlanTeethHits(this.s, this.plan));
    const done = this.busy ? now >= t.need : plan >= t.need;
    const lay = this.bossLayout(view);
    const cx = lay ? BOSS_COL / 2 + 2 : 40;
    const cy = lay ? STAGE_Y + 76 : STAGE_Y + 60;
    if (lay) {
      r.add(this.add.rectangle(cx, STAGE_Y + 6, BOSS_COL - 6, 156, 0x000000, 0.55).setOrigin(0.5, 0));
      r.add(addText(this, cx, STAGE_Y + 18, '歯をそろえる', { size: 11, bold: true, color: '#ffd23f' }).setOrigin(0.5));
    }
    // 歯車：外の歯（need 枚）を、当てた回数だけ黄色に。見込みは薄い黄色
    const R = 26;
    for (let k = 0; k < t.need; k++) {
      const a = -Math.PI / 2 + (k / t.need) * Math.PI * 2;
      const x = cx + Math.cos(a) * R;
      const y = cy + Math.sin(a) * R;
      const lit = k < now;
      const ghost = !lit && k < plan;
      const tooth = this.add.rectangle(x, y, 11, 11, lit ? 0xffd23f : ghost ? 0x8a7a30 : 0x2a2a38).setRotation(a).setStrokeStyle(1, lit ? 0xfff0b0 : 0x5a5a70);
      r.add(tooth);
    }
    r.add(this.add.circle(cx, cy, R - 6, done ? 0xffd23f : 0x3a3a4a).setStrokeStyle(2, 0x9aa3c0));
    r.add(this.add.circle(cx, cy, 6, 0x101820));
    const count = this.busy ? now : plan;
    r.add(addText(this, cx, cy + R + 16, `${count}/${t.need}`, { size: 13, bold: true, color: done ? '#ffd23f' : '#c9d0ea' }).setOrigin(0.5));
    if (lay) r.add(addText(this, cx, STAGE_Y + 144, done ? (this.busy ? 'そろった！' : 'そろう ◎') : this.busy ? '' : '当てる回数\nの見込み', { size: 9, bold: true, align: 'center', color: done ? '#8fffc0' : '#9aa3c0' }).setOrigin(0.5));
  }

  /**
   * 手拍子（段階173。2-2 のぬしの思い出の再演）：貯まった手拍子を丸で（満タンで客席が歌う）。並べている間は、増える見込みを薄く
   */
  private drawClap(view: ChainState): void {
    const c = view.def.clap;
    if (!c) return;
    const r = this.root;
    const have = Math.min(c.need, view.claps ?? 0);
    const plan = this.busy ? 0 : chainPlanClaps(this.s, this.plan);
    const lay = this.bossLayout(view);
    const cx = lay ? BOSS_COL / 2 + 2 : 60;
    if (lay) {
      r.add(this.add.rectangle(cx, STAGE_Y + 6, BOSS_COL - 6, 156, 0x000000, 0.55).setOrigin(0.5, 0));
      r.add(addText(this, cx, STAGE_Y + 18, '手拍子', { size: 13, bold: true, color: '#ffd23f' }).setOrigin(0.5));
    }
    // 2列に丸を並べる（下から貯まる）
    const cols = 2;
    const rows = Math.ceil(c.need / cols);
    for (let k = 0; k < c.need; k++) {
      const row = rows - 1 - Math.floor(k / cols);
      const x = cx + (k % cols === 0 ? -14 : 14);
      const y = STAGE_Y + 40 + row * 22;
      const lit = k < have;
      const ghost = !lit && k < have + plan;
      r.add(this.add.circle(x, y, 9, lit ? 0xffd23f : ghost ? 0x8a7a30 : 0x2a2a38).setStrokeStyle(1.5, lit ? 0xfff0b0 : 0x5a5a70));
      if (lit) r.add(addText(this, x, y, '♪', { size: 10, bold: true, color: '#3a2a00' }).setOrigin(0.5));
    }
    const full = have + plan >= c.need;
    r.add(addText(this, cx, STAGE_Y + 40 + rows * 22 + 2, `${have}${plan ? `（+${plan}）` : ''}/${c.need}`, { size: 12, bold: true, color: full ? '#8fffc0' : '#c9d0ea' }).setOrigin(0.5));
    if (lay) r.add(addText(this, cx, STAGE_Y + 146, full && !this.busy ? '客席が\n歌う ◎' : '♪の時刻で\n終わると＋1', { size: 9, bold: true, align: 'center', color: full && !this.busy ? '#8fffc0' : '#9aa3c0' }).setOrigin(0.5));
  }

  /**
   * 打ち返す（段階175。2-3 のぬしの思い出の再演）：ストライクの数（3つで三振）と、このラウンドの投球の時刻。
   * 並べている間は、打ち返す見込みとストライクになる見込み
   */
  private drawPitch(view: ChainState): void {
    const p = view.def.pitch;
    if (!p) return;
    const r = this.root;
    const strikes = Math.min(p.out, view.strikes ?? 0);
    const look = this.busy ? null : chainPlanPitch(this.s, this.plan);
    const lay = this.bossLayout(view);
    const cx = lay ? BOSS_COL / 2 + 2 : 60;
    if (lay) {
      r.add(this.add.rectangle(cx, STAGE_Y + 6, BOSS_COL - 6, 156, 0x000000, 0.55).setOrigin(0.5, 0));
      r.add(addText(this, cx, STAGE_Y + 18, '打席', { size: 13, bold: true, color: '#ffd23f' }).setOrigin(0.5));
    }
    r.add(addText(this, cx, STAGE_Y + 38, 'ストライク', { size: 9, bold: true, color: '#ff9db0' }).setOrigin(0.5));
    for (let k = 0; k < p.out; k++) {
      const x = cx + (k - (p.out - 1) / 2) * 22;
      const on = k < strikes;
      const ghost = !on && look !== null && k < strikes + look.strikes;
      r.add(this.add.circle(x, STAGE_Y + 56, 8, on ? 0xff4a5a : ghost ? 0x7a3040 : 0x2a2a38).setStrokeStyle(1.5, on ? 0xffb0b8 : 0x5a5a70));
    }
    // このラウンドの投球の時刻
    const times = view.intents.filter((it) => it.move.pitch && view.enemies.some((e) => e.uid === it.enemy && e.hp > 0 && !e.down)).map((it) => it.at);
    r.add(addText(this, cx, STAGE_Y + 82, `投球\n${times.length ? times.map((t) => `時刻${t}`).join('・') : 'なし'}`, { size: 10, bold: true, align: 'center', color: '#c9d0ea' }).setOrigin(0.5));
    if (look && this.plan.length) {
      const ok = look.strikes === 0;
      r.add(addText(this, cx, STAGE_Y + 126, `打ち返す ${look.hits}\nストライク ${look.strikes}`, { size: 10, bold: true, align: 'center', color: ok ? '#8fffc0' : '#ff9db0' }).setOrigin(0.5));
    } else if (lay) r.add(addText(this, cx, STAGE_Y + 130, '同じ時刻に\n終わると打ち返す', { size: 9, bold: true, align: 'center', color: '#9aa3c0' }).setOrigin(0.5));
  }

  private foeColor(s: ChainState, uid: string): number {
    const i = s.enemies.findIndex((e) => e.uid === uid);
    return FOE_COLORS[(i < 0 ? 0 : i) % FOE_COLORS.length];
  }

  private shownEnemies(s: ChainState): ChainUnit[] {
    // 部位（段階162）は列に並べず、本体の絵の上に印で出す（前の本番の戦闘と同じ見せ方。開発者の好み）
    return s.enemies.filter((e) => !chainEnemyDef(s, e.defId)?.part && !(e.hp <= 0 && e.trait === 'split' && s.enemies.some((x) => x.uid.startsWith(e.uid) && x.uid !== e.uid)));
  }

  /** 本体の部位（段階162） */
  private partsOf(s: ChainState, body: ChainUnit): ChainUnit[] {
    return s.enemies.filter((x) => chainEnemyDef(s, x.defId)?.part?.of === body.defId && !x.gone);
  }

  /** ぬし戦の並べ方（段階162 調整3）：場に出る敵が部位のある本体1体だけ */
  private bossLayout(s: ChainState): boolean {
    const list = this.shownEnemies(s);
    // 段階176 の後の直し（開発者：カイの絵が小さい）：部位のない敵でも、場に1体だけなら同じ並べ方（絵を真ん中に大きく）
    return list.length === 1 && (this.partsOf(s, list[0]).length > 0 || s.def.enemies.filter((d) => !d.part).length === 1);
  }

  /** 部位がある本体（ぬし）の絵の大きさと中心 */
  private bossArt(s: ChainState, e: ChainUnit, cx: number): { x: number; y: number; size: number } | null {
    if (!(this.partsOf(s, e).length > 0 || chainEnemyDef(s, e.defId)?.part || this.bossLayout(s))) return null;
    // ぬしが1体の時（段階162 調整4）：真ん中に、敵の場の高さいっぱいで（ポイは左の柱、予定の札は右の柱。名前と HP は下に重ねる）
    if (this.bossLayout(s)) return { x: GAME_WIDTH / 2, y: (STAGE_Y + MSG_TOP) / 2, size: BOSS_ART };
    const size = 120;
    return { x: cx, y: MSG_TOP - size / 2 - 2, size };
  }

  /** 部位の印の位置（ぬしの絵の中の割合 ENEMY_PART_SPOTS。書いていなければ絵の上のほうに横に並べる） */
  private partSpot(s: ChainState, part: ChainUnit): { x: number; y: number; side: 'left' | 'right' | 'below' } | null {
    const bodyId = chainEnemyDef(s, part.defId)?.part?.of;
    const list = this.shownEnemies(s);
    const k = list.findIndex((x) => x.defId === bodyId);
    if (k < 0) return null;
    const body = list[k];
    const colW = GAME_WIDTH / list.length;
    const art = this.bossArt(s, body, colW * k + colW / 2);
    if (!art) return null;
    const key = part.defId.split('_')[1] ?? '';
    const spot = ENEMY_PART_SPOTS[body.defId]?.[key];
    const parts = this.partsOf(s, body);
    const [fx, fy, side] = spot ?? [0.3 + 0.4 * parts.indexOf(part), 0.25, 'right'];
    return { x: art.x - art.size / 2 + fx * art.size, y: art.y - art.size / 2 + fy * art.size, side: side ?? 'right' };
  }

  /** 部位の印（丸い枠・名前の札・HP）。タップで狙う、長押しで説明 */
  private drawPart(s: ChainState, part: ChainUnit): void {
    const r = this.root;
    const p = this.partSpot(s, part);
    if (!p) return;
    const alive = part.hp > 0;
    const targetable = alive && this.pending?.move.target === 'enemy';
    const lit = this.busy && part.uid === this.targetUid;
    const ring = this.add.circle(p.x, p.y, 20, 0x000000, alive ? 0.25 : 0.5).setStrokeStyle(3, !alive ? 0x606060 : lit ? YELLOW : targetable ? YELLOW : 0xffffff);
    r.add(ring);
    if (targetable) this.tweens.add({ targets: ring, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    if (!alive) r.add(addText(this, p.x, p.y, '×', { size: 26, bold: true, color: '#9aa3c0' }).setOrigin(0.5));
    // 札を印の下に出す部位（段階169 の後の直し）：名前の札と HP を、印の真下に
    if (p.side === 'below') {
      r.add(this.sticker(p.x, p.y + 32, alive ? part.name : `${part.name} BREAK`, alive ? YELLOW : 0x808080, '#000000', -4, 10));
      if (alive) {
        const bw = 52;
        r.add(this.add.rectangle(p.x - bw / 2, p.y + 47, bw, 6, 0x2a0a12).setOrigin(0, 0.5));
        r.add(this.add.rectangle(p.x - bw / 2, p.y + 47, Math.max(3, (bw * part.hp) / part.maxHp), 6, YELLOW).setOrigin(0, 0.5));
      }
      const hitB = this.add.circle(p.x, p.y, 28, 0xffffff, 0.001);
      r.add(hitB);
      makePressable(hitB, { onTap: () => this.pickEnemy(part.uid), onLongPress: () => this.explainEnemy(part) });
      return;
    }
    const left = p.side === 'left' && p.x - 110 > (this.bossLayout(s) ? BOSS_COL : 0);
    const lx = left ? p.x - 26 : p.x + 26;
    const label = this.sticker(lx + (left ? -34 : 34), p.y - 10, alive ? part.name : `${part.name} BREAK`, alive ? YELLOW : 0x808080, '#000000', left ? 4 : -4, 10);
    r.add(label);
    if (alive) {
      const bw = 64;
      const bx = left ? lx - bw : lx;
      r.add(this.add.rectangle(bx, p.y + 6, bw, 6, 0x2a0a12).setOrigin(0, 0.5));
      r.add(this.add.rectangle(bx, p.y + 6, Math.max(3, (bw * part.hp) / part.maxHp), 6, YELLOW).setOrigin(0, 0.5));
    }
    const hit = this.add.circle(p.x, p.y, 28, 0xffffff, 0.001);
    r.add(hit);
    makePressable(hit, { onTap: () => this.pickEnemy(part.uid), onLongPress: () => this.explainEnemy(part) });
  }

  private drawEnemies(s: ChainState): void {
    const r = this.root;
    // 背景：その時代の場所の絵を、暗く・少しセピアにして敷く
    const bg = CHAIN_TRIAL_BG[this.trial];
    if (bg && hasImage(this, bg)) r.add(this.cropImage(bg, GAME_WIDTH / 2, STAGE_Y + STAGE_H / 2, GAME_WIDTH, STAGE_H).setTint(0xc89070).setAlpha(0.55));
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x0b1020, 0x0b1020, 0x0b1020, 0x0b1020, 0.75, 0.75, 0.2, 0.2).fillRect(0, STAGE_Y, GAME_WIDTH, STAGE_H / 2);
    shade.fillGradientStyle(0x0b1020, 0x0b1020, 0x0b1020, 0x0b1020, 0.2, 0.2, 0.85, 0.85).fillRect(0, STAGE_Y + STAGE_H / 2, GAME_WIDTH, STAGE_H / 2);
    for (let y = STAGE_Y; y < STAGE_Y + STAGE_H; y += 3) shade.fillStyle(0xffffff, 0.025).fillRect(0, y, GAME_WIDTH, 1);
    r.add(shade);
    const list = this.shownEnemies(s);
    const n = list.length;
    const colW = GAME_WIDTH / n;
    const ghost = this.busy ? {} : plannedEffects(this.s, this.plan);
    list.forEach((e, i) => {
      const cx = colW * i + colW / 2;
      const alive = e.hp > 0 && !e.gone;
      const boss = this.bossArt(s, e, cx);
      const size = boss ? boss.size : Math.min(100, colW - 20) * (SPLIT_ART[e.defId] ? 0.7 : 1);
      const artY = boss ? boss.y : ART_Y;
      const artX = boss ? boss.x : cx;
      // ぬし戦は右半分に、予定の札・ポイ・名前と HP（段階162 調整3）
      const lay = this.bossLayout(s);
      const x0 = colW * i;
      const panelW = colW;
      const isTarget = this.pending?.move.target === 'enemy' && alive;
      if (this.busy && e.uid === this.actorUid) r.add(this.add.rectangle(cx, STAGE_Y + 126, colW - 6, 236, RED, 0.12).setStrokeStyle(3, RED));
      if (this.busy && e.uid === this.targetUid) r.add(this.add.rectangle(cx, STAGE_Y + 126, colW - 6, 236, YELLOW, 0.08).setStrokeStyle(3, YELLOW));
      if (isTarget) {
        const sel = this.add.rectangle(cx, STAGE_Y + 126, colW - 6, 236, 0xffffff, 0.05).setStrokeStyle(2, YELLOW);
        this.tweens.add({ targets: sel, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
        r.add(sel);
      }
      // 敵の後ろの赤い光
      if (alive) r.add(this.add.circle(artX, artY, size * 0.55, 0xff3040, 0.18));
      const art = artOfEnemy(e.defId);
      if (art && hasImage(this, art)) {
        const img = this.add.image(artX, artY, art);
        img.setScale(size / Math.max(img.width, img.height));
        if (!alive) img.setAlpha(0.15).setTint(0x606060);
        else if (e.down) img.setAngle(-14).setTint(0xb0b0ff);
        r.add(img);
        this.enemyImages.set(e.uid, img);
      } else r.add(this.add.circle(artX, artY, size / 2.4, COLORS.enemy, alive ? 1 : 0.2));
      // 名前・弱点（分かるまで「？」。調整9）・HP
      const ny = STAGE_Y + 172;
      const name = addText(this, x0 + 8, ny, e.name, { size: 12, bold: true, color: alive ? '#ffffff' : COLORS.dimText }).setOrigin(0, 0.5).setStroke('#000000', 3);
      // 属性チェンジの敵は、今の弱点がいつも見える（調整12）
      const known = e.trait === 'shift' ? e.weak : e.weak.filter((w) => isWeakKnown(s, e.defId, w));
      const wx = x0 + panelW - 16;
      // 弱点は「弱点」と言葉を添える（分かるまで「弱点？」）
      const shownWeak = known.slice(0, 2);
      const nameRoom = panelW - (shownWeak.length ? 46 + shownWeak.length * 20 : 56);
      if (name.width > nameRoom) name.setScale(nameRoom / name.width);
      r.add(name);
      if (shownWeak.length) {
        shownWeak.forEach((w, k) => {
          r.add(this.add.circle(wx - k * 20, ny, 10, ELEMENT_COLOR[w]).setStrokeStyle(2, 0xffffff));
          r.add(addText(this, wx - k * 20, ny, ELEMENT_LABEL[w].slice(0, 1), { size: 10, bold: true, color: '#101010' }).setOrigin(0.5));
        });
        r.add(addText(this, wx - (shownWeak.length - 1) * 20 - 13, ny, '弱点', { size: 9, bold: true, color: '#ffffff' }).setOrigin(1, 0.5).setStroke('#000000', 3));
      } else {
        r.add(this.add.rectangle(wx - 10, ny, 42, 17, 0x2a3050).setStrokeStyle(1.5, 0x9aa3c0));
        r.add(addText(this, wx - 10, ny, '弱点？', { size: 9, bold: true, color: '#c9d0ea' }).setOrigin(0.5));
      }
      // 敵の足元に、その敵の色の線（上の予定の札・時間の帯の印と同じ色）
      if (alive) r.add(this.add.rectangle(x0 + 8 + (panelW - 18) / 2, ny + 25, panelW - 18, 3, this.foeColor(s, e.uid), 1));
      const bw = panelW - 18;
      r.add(this.para(x0 + 8, ny + 13, bw, 7, 0x2a0a12, 1, 3));
      if (e.hp > 0) r.add(this.para(x0 + 8, ny + 13, Math.max(6, bw * (e.hp / e.maxHp)), 7, RED, 1, 3));
      // 特徴：黄色の傾いたシール
      if (e.trait) {
        const t = CHAIN_TRAIT_TEXT[e.trait];
        const extra = e.trait === 'timer' && alive ? ` あと${e.timer}` : e.trait === 'shell' && alive ? (e.shell ? '' : '（割れた）') : '';
        // ぬし戦（段階171 の後の直し）：左の柱（ポイ・夕日・歯車）に重ならないよう、ぬしの絵の左上に
        const sx = boss ? boss.x - boss.size / 2 + 30 : x0 + 30;
        const sy = boss ? boss.y - boss.size / 2 + 14 : STAGE_Y + 56;
        r.add(this.sticker(sx, sy, t.name + extra, e.trait === 'timer' ? 0xff8a5a : YELLOW, '#000000', -8, 10));
      }
      if (e.gone) {
        r.add(this.sticker(cx, ART_Y, e.trait === 'timer' ? '消えた' : '逃げた', 0xffffff, '#ff2d55', -6, 14));
        return;
      }
      if (!alive) return;
      if (e.trait === 'shell' && e.shell) r.add(this.add.circle(cx, ART_Y, size / 2 + 2).setStrokeStyle(3, 0xd0c8b0, 0.9));
      // フォーカスとフィルター（今付いている物と、計画で付く予定の物。予定は薄い枠だけ）
      const plannedFx = (ghost as Record<string, { trick?: ChainTrick; status?: ChainStatusKind }>)[e.uid] ?? {};
      const chips: { text: string; color: number; planned: boolean }[] = [];
      const st = plannedFx.status ?? e.status?.kind;
      if (st) chips.push({ text: plannedFx.status ? STATUS_LABEL[st] : `${STATUS_LABEL[st]}${e.status?.kind === 'stack' && e.status.stacks ? `×${e.status.stacks}` : ''} あと${e.status?.left}`, color: CHIP_LASTING, planned: !!plannedFx.status });
      const trick = plannedFx.trick ?? e.trick;
      if (trick) chips.push({ text: `◎${TRICK_LABEL[trick]}`, color: CHIP_ONCE, planned: !!plannedFx.trick });
      chips.forEach((c, k) => {
        const cy = (lay ? STAGE_Y + 118 : STAGE_Y + 78) + k * 19;
        const cxL = lay ? GAME_WIDTH - BOSS_COL : x0;
        const t = addText(this, cxL + 14, cy, c.text, { size: 10, bold: true, color: c.planned ? '#ffffff' : '#06201e' }).setOrigin(0, 0.5);
        if (t.width > (lay ? BOSS_COL : panelW) - 24) t.setScale(((lay ? BOSS_COL : panelW) - 24) / t.width);
        const box = this.add.rectangle(cxL + 8, cy, t.displayWidth + 12, 16, c.color, c.planned ? 0.25 : 1).setOrigin(0, 0.5).setAngle(k === 0 ? -2 : 2);
        if (c.planned) box.setStrokeStyle(1.5, c.color);
        else if (c.color === CHIP_ONCE) t.setColor('#ffffff');
        r.add(box);
        r.add(t);
      });
      if (e.down) r.add(this.sticker(artX + 10, boss ? artY - size / 2 + 18 : artY + 30, 'DOWN', RED, '#ffffff', 8, 14));
      // 警戒（段階162 調整6）：ダウンから起きた敵は、しばらくダウンしない
      else if (alive && (e.guard ?? 0) > 0) r.add(this.sticker(artX + 6, boss ? artY - size / 2 + 16 : artY + 34, guardLabel(e.guard!), 0x6bc8ff, '#06203a', -6, 11));
      // 予定：黒い斜めの札に、赤い丸の時刻（大技・全体・逃げるは黄色）。すばやい敵は2つの時刻
      // 投球（段階175）は左の「打席」の欄とタイムラインの「球」の札で見せるので、予定の札にはぬしの行動だけ
      const own = s.intents.filter((it) => it.enemy === e.uid);
      const intents = own.some((it) => !it.move.pitch) ? own.filter((it) => !it.move.pitch) : own;
      if (intents.length) {
        const it = intents[0];
        const tgt = it.target ? findChainUnit(s, it.target)?.name : '';
        const foe = it.confused ? findChainUnit(s, it.confused)?.name.replace('ノイズ', '') : '';
        const big = it.move.all || it.move.flee || it.move.power >= CHAIN_RULES.sealBig;
        const veiled = !!e.veiled;
        const detail = veiled ? '予定が見えない' : it.move.flee ? '逃げる' : `${it.move.all ? '全体' : foe ? `→ ${foe}（ハレーション）` : `→ ${tgt}`} ${it.move.power}`;
        const a = e.down ? 0.35 : 1;
        if (lay) {
          // 右の柱：縦長の札に、時刻・行動の名前・誰に・威力
          const cx2 = GAME_WIDTH - BOSS_COL / 2 - 2;
          const top = STAGE_Y + 6;
          const ch = 104;
          r.add(this.add.rectangle(cx2 + 3, top + ch / 2 + 3, BOSS_COL - 6, ch, RED, 0.45 * a));
          r.add(this.add.rectangle(cx2, top + ch / 2, BOSS_COL - 6, ch, big ? 0x3a0010 : 0x000000, a).setStrokeStyle(2, this.foeColor(s, e.uid)));
          const times = veiled ? '？' : intents.map((x) => x.at).join('・');
          r.add(this.add.circle(cx2, top + 22, 17, big ? YELLOW : RED, a));
          r.add(addText(this, cx2, top + 13, '時刻', { size: 7, bold: true, color: big ? '#000000' : '#ffffff' }).setOrigin(0.5).setAlpha(a));
          r.add(addText(this, cx2, top + 26, times, { size: times.length > 2 ? 9 : 15, bold: true, color: big ? '#000000' : '#ffffff' }).setOrigin(0.5).setAlpha(a));
          const lines = [
            { t: veiled ? '？？？' : it.move.name, size: 11, color: '#ffffff', y: top + 52 },
            { t: veiled ? '予定が見えない' : it.move.flee ? '逃げる' : it.move.all ? '全体' : foe ? `→ ${foe}` : `→ ${tgt}`, size: 10, color: big ? '#ffe08a' : '#ff9db0', y: top + 70 },
            { t: veiled || it.move.flee ? '' : `威力 ${it.move.power}`, size: 10, color: big ? '#ffe08a' : '#ff9db0', y: top + 88 },
          ];
          for (const l of lines) {
            if (!l.t) continue;
            const tt = addText(this, cx2, l.y, l.t, { size: l.size, bold: true, color: l.color }).setOrigin(0.5).setAlpha(a);
            if (tt.width > BOSS_COL - 14) tt.setScale((BOSS_COL - 14) / tt.width);
            r.add(tt);
          }
        }
        const px = x0 + 12;
        const pw = panelW - 18;
        if (!lay) {
        r.add(this.para(px + 3, STAGE_Y + 9, pw, 34, RED, 0.45 * a, 8));
        r.add(this.para(px, STAGE_Y + 6, pw, 34, big ? 0x3a0010 : 0x000000, a, 8, { w: 2, color: this.foeColor(s, e.uid) }));
        r.add(this.add.rectangle(px + 4, STAGE_Y + 6, 4, 34, big ? YELLOW : RED, a).setOrigin(0));
        const times = veiled ? '？' : intents.map((x) => x.at).join('・');
        r.add(this.add.circle(px + 2, STAGE_Y + 23, 16, big ? YELLOW : RED, a));
        r.add(addText(this, px + 2, STAGE_Y + 15, '時刻', { size: 7, bold: true, color: big ? '#000000' : '#ffffff' }).setOrigin(0.5).setAlpha(a));
        r.add(addText(this, px + 2, STAGE_Y + 27, times, { size: times.length > 2 ? 9 : 14, bold: true, color: big ? '#000000' : '#ffffff' }).setOrigin(0.5).setAlpha(a));
        const t1 = addText(this, px + 20, STAGE_Y + 15, veiled ? '？？？' : it.move.name, { size: 11, bold: true }).setOrigin(0, 0.5).setAlpha(a);
        const t2 = addText(this, px + 20, STAGE_Y + 31, detail, { size: 9, bold: true, color: big ? '#ffe08a' : '#ff9db0' }).setOrigin(0, 0.5).setAlpha(a);
        for (const t of [t1, t2]) if (t.width > pw - 26) t.setScale((pw - 26) / t.width);
        r.add([t1, t2]);
        }
      }
      const hit = this.add.rectangle(cx, STAGE_Y + 120, colW - 4, 220, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, {
        onTap: () => this.pickEnemy(e.uid),
        onLongPress: () => this.explainEnemy(e),
      });
      // 部位の印は、本体の絵と押す所の上に（段階162）
      if (alive) for (const part of this.partsOf(s, e)) this.drawPart(s, part);
    });
  }

  private explainEnemy(e: ChainUnit): void {
    const d = chainEnemyDef(this.s, e.defId);
    const t = e.trait ? CHAIN_TRAIT_TEXT[e.trait] : null;
    const known = e.trait === 'shift' ? e.weak : e.weak.filter((w) => isWeakKnown(this.s, e.defId, w));
    const weak = known.length ? known.map((x) => ELEMENT_LABEL[x]).join('・') : '？（その属性で当てると分かる）';
    const resist = e.resist.length ? `・耐性 ${e.resist.map((x) => ELEMENT_LABEL[x]).join('・')}` : '';
    const pattern = e.veiled ? '？（攻撃を当てると見える）' : (e.pattern ?? d?.pattern ?? []).map((p) => `${p.name}（時刻${p.at}${p.at2 !== undefined ? `・${p.at2}` : ''}${p.all ? '・全体' : ''}）`).join(' → ');
    this.message = `${e.name}：弱点 ${weak}${resist}。${t ? `【${t.name}】${t.text}。` : ''}癖：${pattern}`;
    this.render();
  }

  /** フィルム：穴の空いた帯に時刻の目盛り。上の段に敵の予定、下の段に並べた行動のクリップ */
  private drawFilm(s: ChainState): void {
    const r = this.root;
    const x0 = FILM_X;
    const len = CHAIN_RULES.roundLen;
    const top = FILM_Y;
    const g = this.add.graphics();
    g.fillStyle(0x050608, 1).fillRect(0, top, GAME_WIDTH, FILM_H);
    g.fillStyle(0x222630, 1).fillRect(0, top, GAME_WIDTH, 2).fillRect(0, top + FILM_H - 2, GAME_WIDTH, 2);
    // フィルムの穴
    g.fillStyle(0x2b2f3a, 1);
    for (let x = 6; x < GAME_WIDTH; x += 20) {
      g.fillRect(x, top + 4, 8, 6);
      g.fillRect(x, top + FILM_H - 10, 8, 6);
    }
    // 段の線
    g.fillStyle(0x1e2230, 1).fillRect(x0, FOE_TRACK, CELL * len, 1).fillRect(x0, CLIP_TOP + CLIP_H / 2, CELL * len, 1);
    r.add(g);
    // 時刻はマスの境目（調整8。味方の帯の右端・敵の丸・再生位置の線が、同じ所にそろう）
    // 手拍子の拍（段階173）：拍の時刻は黄色の線と数字
    const beats = s.def.clap?.beats ?? [];
    for (let t = 0; t <= len; t++) {
      const beat = beats.includes(t);
      r.add(this.add.rectangle(x0 + CELL * t, top + 26, beat ? 2 : 1, FILM_H - 38, beat ? 0xffd23f : 0x8a93ad, beat ? 0.45 : 0.12).setOrigin(0.5, 0));
      r.add(addText(this, x0 + CELL * t, top + 13, beat ? `♪${t}` : String(t), { size: 10, bold: true, color: beat ? '#ffd23f' : '#8a93ad' }).setOrigin(0.5, 0));
    }
    r.add(addText(this, 4, FOE_TRACK, '敵', { size: 9, bold: true, color: '#ff9db0' }).setOrigin(0, 0.5));
    r.add(addText(this, 2, CLIP_TOP + CLIP_H / 2, '味方', { size: 8, bold: true, color: '#9ad0ff' }).setOrigin(0, 0.5));
    // 動く順の番号（同じ時刻なら味方が先）。計画の時は見込み、実行中は本当のコマの番号。済んだ番号は薄く、今の番号を赤く
    const planOrder = chainOrder(this.s, this.plan);
    const numOf = (key: string): number => (this.busy && this.runFrames.length ? (this.runFrames.find((f) => f.key === key)?.order ?? 0) : planOrder.findIndex((o) => o.key === key) + 1);
    const badge = (x: number, y: number, n: number) => {
      if (n <= 0) return;
      const now = n === this.currentOrder;
      const done = this.currentOrder > 0 && n < this.currentOrder;
      r.add(this.add.circle(x, y, now ? 9 : 7, now ? RED : 0xffffff, done ? 0.35 : 1).setStrokeStyle(1, 0x000000));
      r.add(addText(this, x, y, String(n), { size: now ? 11 : 9, bold: true, color: now ? '#ffffff' : '#101010' }).setOrigin(0.5).setAlpha(done ? 0.5 : 1));
    };
    // 上の段：敵の予定（敵の絵の丸。大技は黄色の縁）
    const slots: Record<number, number> = {};
    s.intents.forEach((it, k) => {
      const e = s.enemies.find((x) => x.uid === it.enemy);
      if (!e || e.hp <= 0 || e.gone || e.veiled) return;
      const row = (slots[it.at] = (slots[it.at] ?? 0) + 1) - 1;
      const cx = x0 + CELL * it.at + row * 9;
      const cy = FOE_TRACK + row * 7 - (slots[it.at] > 1 ? 3 : 0);
      const big = it.move.all || it.move.flee || it.move.power >= CHAIN_RULES.sealBig;
      const a = e.down ? 0.3 : 1;
      if (big && !e.down) r.add(this.add.circle(cx, cy, 21, YELLOW, 0.3));
      r.add(this.add.circle(cx, cy, 17, 0x1a0008, a).setStrokeStyle(3, this.foeColor(s, e.uid)));
      const art = artOfEnemy(e.defId);
      if (art && hasImage(this, art)) {
        const img = this.add.image(cx, cy, art).setAlpha(a);
        img.setScale(30 / Math.max(img.width, img.height));
        r.add(img);
      }
      if (e.down) r.add(addText(this, cx, cy, '×', { size: 26, bold: true, color: '#ff2d55' }).setOrigin(0.5));
      // 投球（段階175）：「球」の札
      if (it.move.pitch && !e.down) r.add(this.sticker(cx + 12, cy + 13, '球', 0xffffff, '#c0303a', 0, 9));
      badge(cx - 15, cy - 14, numOf(`e${k}`));
    });
    // 下の段：並べた行動のクリップ（重さの分の長さ。札・技の絵を正方形のコマにして並べる。調整9）
    const starts = planStarts(this.s, this.plan);
    // 邪魔されなければ強い札の「中断のおそれ」：今の計画を実際に動かして見る（押す・ダウンで敵の予定が動くのも入る。調整17）
    const fragileIdx = this.plan.map((p, i) => ({ m: chainMoveOf(this.s, p), i })).filter((x) => x.m?.effect.kind === 'damage' && x.m.effect.fragile).map((x) => x.i);
    const interrupted = new Set<number>();
    if (!this.busy && fragileIdx.length) {
      for (const f of runChainRound(this.s, this.plan).frames) if (f.events.some((e) => e.type === 'cancel' && e.reason === 'interrupted')) interrupted.add(Number(f.key.slice(1)));
    }
    const target = this.s.def.finishLast && this.plan.length ? this.addonIndex() : -1;
    this.plan.forEach((step, i) => {
      const move = chainMoveOf(this.s, step);
      if (!move) return;
      // 切り取りで抜き取られた行動（段階176 の後）は、帯から消す
      if (this.busy && this.cutSteps.has(i)) return;
      const members = stepAllies(this.s, step).map((u) => findChainUnit(s, u)!);
      // 帯は動き始めから終わり（効く時刻）まで。実行中は、本当に効いた時刻・ねばねばで遅れた時刻に
      const at = this.busy ? (s.actedAt[i] !== undefined ? s.actedAt[i] - move.weight : starts[i] + s.timeShift) : starts[i];
      if (at + move.weight > len) {
        r.add(this.sticker(x0 + CELL * len - 40, CLIP_TOP + CLIP_H / 2, `${members[0].name} 時間切れ`, RED, '#ffffff', -4, 9));
        return;
      }
      const w = Math.min(move.weight, len - at);
      const bx = x0 + CELL * at + 1;
      const bw = CELL * w - 2;
      const isLink = step.source.kind === 'link';
      const color = isLink ? GOLD : (ALLY_COLOR[members[0].defId] ?? COLORS.ally);
      if (isLink) r.add(this.add.rectangle(bx - 2, CLIP_TOP - 2, bw + 4, CLIP_H + 4, GOLD, 0.35).setOrigin(0));
      r.add(this.add.rectangle(bx, CLIP_TOP, bw, CLIP_H, 0x10131c).setOrigin(0));
      // コンボは、材料のスナップの絵を等分に並べる（コンボ専用の絵はまだない）
      const arts = this.artsOfStep(step).filter((a) => hasImage(this, a));
      arts.forEach((a, k) => {
        const segW = bw / arts.length;
        this.tileArt(a, bx + segW * k, CLIP_TOP + 5, segW - (k < arts.length - 1 ? 1 : 0), CLIP_H - 5);
      });
      // 上の色の帯（誰の行動か）と、両端のつまみ
      r.add(this.add.rectangle(bx, CLIP_TOP, bw, 5, color).setOrigin(0));
      r.add(this.add.rectangle(bx, CLIP_TOP, bw, CLIP_H).setOrigin(0).setStrokeStyle(isLink ? 2.5 : 1.5, color));
      r.add(this.add.rectangle(bx + 1, CLIP_TOP + 10, 2, CLIP_H - 16, 0xffffff, 0.8).setOrigin(0));
      r.add(this.add.rectangle(bx + bw - 3, CLIP_TOP + 10, 2, CLIP_H - 16, 0xffffff, 0.8).setOrigin(0));
      // 名前（下の暗い帯に）
      r.add(this.add.rectangle(bx, CLIP_TOP + CLIP_H - 13, bw, 13, 0x000000, 0.65).setOrigin(0));
      const label = w >= 2 ? `${members.map((m) => m.name).join('＋')}・${move.name}` : move.name;
      const nm = addText(this, bx + 4, CLIP_TOP + CLIP_H - 6.5, label, { size: 9, bold: true }).setOrigin(0, 0.5);
      if (nm.width > bw - 6) nm.setScale(Math.max(0.3, (bw - 6) / nm.width));
      r.add(nm);
      // 添えた札（調整17）：帯の上に「＋名前」
      const adds = (step.addons ?? []).map((a) => this.s.def.cards[this.s.hand[a]]?.name).filter(Boolean);
      if (adds.length) {
        const tag = addText(this, bx + 3, CLIP_TOP + 14, `＋${adds.join('＋')}`, { size: 8, bold: true, color: '#000000' }).setOrigin(0, 0.5);
        if (tag.width > bw - 18) tag.setScale(Math.max(0.4, (bw - 18) / tag.width));
        r.add(this.add.rectangle(bx + 1, CLIP_TOP + 8, Math.min(bw - 16, tag.displayWidth + 4), 12, YELLOW, 0.95).setOrigin(0));
        r.add(tag);
      }
      if (!this.busy && interrupted.has(i)) r.add(this.sticker(bx + bw / 2, CLIP_TOP + CLIP_H / 2, '中断のおそれ', RED, '#ffffff', -6, 9));
      // サポートを添える先（黄色の枠）。帯の上の行動をタップすると選べる
      if (!this.busy && i === target) r.add(this.add.rectangle(bx - 1, CLIP_TOP - 1, bw + 2, CLIP_H + 2).setOrigin(0).setStrokeStyle(2, YELLOW));
      if (!this.busy && this.s.def.finishLast) {
        const clipHit = this.add.rectangle(bx + bw / 2, CLIP_TOP + CLIP_H / 2, bw, CLIP_H, 0xffffff, 0.001);
        r.add(clipHit);
        makePressable(clipHit, { onTap: () => this.pickClip(i) });
      }
      // 効く時刻の印（帯の右端の上）と番号
      r.add(this.add.triangle(bx + bw + 1, CLIP_TOP - 4, -5, -4, 5, -4, 0, 3, 0xffffff));
      badge(bx + bw - 8, CLIP_TOP + 14, numOf(`a${i}`));
    });
    // 次に並べる時刻
    if (!this.busy && s.outcome === 'ongoing' && !s.shutter) {
      const at = nextStart(this.s, this.plan);
      if (at < len && this.ally) {
        const cur = this.add.rectangle(x0 + CELL * at + 1, CLIP_TOP - 2, 3, CLIP_H + 4, YELLOW).setOrigin(0);
        this.tweens.add({ targets: cur, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
        r.add(cur);
      } else if (at >= len) r.add(addText(this, GAME_WIDTH - 6, FILM_Y + FILM_H - 16, '時間はいっぱい', { size: 9, color: '#ff9db0' }).setOrigin(1, 0.5));
    }
  }

  /** 並べた行動の絵（札は札の絵、技・連携技は技の絵） */
  /** 帯のクリップの絵：札・技は1枚、コンボは材料のスナップの絵（並べた順） */
  private artsOfStep(step: ChainPlanStep): string[] {
    const src = step.source;
    if (src.kind === 'card') return [CHAIN_CARD_ART[this.s.hand[src.index]]].filter((x): x is string => !!x);
    if (src.kind === 'move') return [CHAIN_MOVE_ART[src.moveId]].filter((x): x is string => !!x);
    return src.cards.map((i) => CHAIN_CARD_ART[this.s.hand[i]]).filter((x): x is string => !!x);
  }

  private drawAllies(s: ChainState): void {
    const r = this.root;
    const colW = (GAME_WIDTH - 16) / s.allies.length;
    s.allies.forEach((u, i) => {
      const x = 8 + colW * i;
      const w = colW - 8;
      const color = ALLY_COLOR[u.defId] ?? COLORS.ally;
      const sel = !this.busy && this.ally === u.uid;
      const acting = this.busy && this.actorUid === u.uid;
      const aimed = this.busy && this.targetUid === u.uid;
      const edge = acting ? RED : aimed ? YELLOW : sel ? YELLOW : undefined;
      r.add(this.para(x + 4, ALLY_Y + 4, w, ALLY_H, 0x000000, 0.7, 10));
      r.add(this.para(x, ALLY_Y, w, ALLY_H, sel ? 0x232c55 : 0x151b33, 1, 10, edge ? { w: 2.5, color: edge } : undefined));
      r.add(this.para(x + 6, ALLY_Y, 5, ALLY_H, color, 1, 2));
      const face = this.faceSquare(u.defId, x + 34, ALLY_Y + ALLY_H / 2, ALLY_H - 8);
      if (face) r.add(face.setAlpha(u.hp > 0 ? 1 : 0.3));
      r.add(addText(this, x + 62, ALLY_Y + 12, u.name, { size: 13, bold: true, color: u.hp > 0 ? '#ffffff' : COLORS.dimText }).setOrigin(0, 0.5));
      const bw = w - 70;
      r.add(this.para(x + 60, ALLY_Y + 24, bw, 6, 0x222838, 1, 3));
      if (u.hp > 0) r.add(this.para(x + 60, ALLY_Y + 24, Math.max(4, bw * (u.hp / u.maxHp)), 6, u.hp < u.maxHp * 0.3 ? COLORS.hpLow : color, 1, 3));
      // 段階158：MP のある仲間（本番の仲間）は MP も
      const hpText = addText(this, x + 62, ALLY_Y + 39, `HP ${u.hp}/${u.maxHp}`, { size: 11, bold: true, color: '#c9d0ea' }).setOrigin(0, 0.5);
      if (hpText.width > w - 66) hpText.setScale((w - 66) / hpText.width);
      r.add(hpText);
      if (u.maxMp) {
        const mpText = addText(this, x + 62, ALLY_Y + 52, `MP ${u.mp ?? 0}/${u.maxMp}`, { size: 11, bold: true, color: '#8ab4ff' }).setOrigin(0, 0.5);
        if (mpText.width > w - 66) mpText.setScale((w - 66) / mpText.width);
        r.add(mpText);
      }
      const times = this.plan.filter((p) => stepAllies(this.s, p).includes(u.uid)).length;
      const multi = !!this.s.def.multiAct;
      // 印は「選択中」だけ（開発者：時刻の表記は要らない。並べた順はフィルムの番号で分かる）
      const state = u.hp <= 0 ? '倒れている' : sel ? `選択中${multi && times ? `（${times}回）` : ''}` : multi && times ? `${times}回` : '';
      if (state) r.add(this.sticker(x + w - 30, ALLY_Y - 2, state, !sel && times > 0 ? 0xffffff : YELLOW, '#000000', 5, 9));
      const hit = this.add.rectangle(x + w / 2, ALLY_Y + ALLY_H / 2, w, ALLY_H, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, { onTap: () => this.pickAlly(u.uid) });
    });
  }

  private drawTabs(): void {
    const r = this.root;
    const links = availableLinks(this.s, this.plan);
    const tabs: { label: string; on: boolean; w: number; tap: () => void }[] = [
      { label: links.length ? (this.s.def.finishLast ? '手札・コンボ ★' : '手札・連携技 ★') : `手札（${this.s.hand.length}枚）`, on: this.tab === 'cards', w: 128, tap: () => this.switchTab('cards') },
      { label: '技', on: this.tab === 'moves', w: 56, tap: () => this.switchTab('moves') },
    ];
    let x = 8;
    for (const t of tabs) {
      if (t.on) r.add(this.para(x + 3, TAB_Y - 11, t.w, 24, RED, 1, 8));
      r.add(this.para(x, TAB_Y - 14, t.w, 24, t.on ? 0xffffff : 0x1a2040, 1, 8));
      r.add(addText(this, x + t.w / 2, TAB_Y - 2, t.label, { size: 12, bold: true, color: t.on ? '#000000' : '#9aa3c0' }).setOrigin(0.5));
      const hit = this.add.rectangle(x + t.w / 2, TAB_Y - 2, t.w, 26, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, { onTap: t.tap });
      x += t.w + 6;
    }
    const name = this.ally ? findChainUnit(this.s, this.ally)?.name : '';
    r.add(addText(this, GAME_WIDTH - 10, TAB_Y - 2, name ? `${name}の行動` : this.s.def.finishLast && this.plan.some((p) => isChainFinish(chainMoveOf(this.s, p))) ? 'このラウンドはここまで' : '全員並べた', { size: 11, bold: true, color: '#ffd23f' }).setOrigin(1, 0.5));
  }

  private switchTab(tab: 'cards' | 'moves'): void {
    this.tab = tab;
    this.pending = null;
    this.render();
  }

  /** 選べる札・技を並べる（長押しで説明）。手札のタブは、そろった連携技を金色の帯で上に */
  private drawOptions(): void {
    const s = this.s;
    const r = this.root;
    const items: { source: ChainSource; move: ChainMove; art?: string; used?: boolean; added?: boolean; key?: string }[] = [];
    const links = this.tab === 'cards' ? availableLinks(s, this.plan) : [];
    /** コンボの帯の位置と材料の札（段階158の後の直し：帯と材料の札を線でつなぐ） */
    const linkSpots: { x: number; w: number; cards: number[]; sel: boolean }[] = [];
    links.forEach((x, k) => {
      const lw = (GAME_WIDTH - 16 - (links.length - 1) * 6) / links.length;
      const lx = 8 + k * (lw + 6);
      linkSpots.push({ x: lx, w: lw, cards: x.cards, sel: !!this.pending && sameSource(this.pending.source, { kind: 'link', linkId: x.link.id, cards: x.cards }) });
      const source: ChainSource = { kind: 'link', linkId: x.link.id, cards: x.cards };
      const sel = !!this.pending && sameSource(this.pending.source, source);
      r.add(this.para(lx - 2, LINK_Y - 2, lw + 4, 32, GOLD, sel ? 0.7 : 0.3, 10));
      r.add(this.para(lx + 3, LINK_Y + 3, lw, 28, 0x000000, 0.7, 10));
      r.add(this.para(lx, LINK_Y, lw, 28, sel ? 0xfff0b0 : GOLD, 1, 10));
      // 線の色の印（コンボが2つ以上の時、どの線がどのコンボか）
      if (links.length > 1) r.add(this.add.rectangle(lx + lw / 2, LINK_Y + 28, 22, 5, LINK_COLORS[k % LINK_COLORS.length]));
      const who = x.link.members.map((m) => this.allyName(m)).join('＋');
      // 初めてそろったコンボは「NEW」（調整17：レシピは最初は見えず、そろうと分かる）
      const fresh = !!s.def.finishLast && !foundChainCombos(!!this.encounter).includes(x.link.id);
      if (fresh) addFoundChainCombo(!!this.encounter, x.link.id);
      const t = addText(this, lx + 14, LINK_Y + 14, `★ ${s.def.finishLast ? 'コンボ' : '連携技'} ${x.link.move.name}${who ? `　${who}` : ''}`, { size: 12, bold: true, color: '#2a1300' }).setOrigin(0, 0.5);
      if (fresh) r.add(this.sticker(lx + lw - 20, LINK_Y - 2, 'NEW!', RED, '#ffffff', 8, 10));
      if (t.width > lw - 24) t.setScale((lw - 24) / t.width);
      r.add(t);
      const hit = this.add.rectangle(lx + lw / 2, LINK_Y + 14, lw, 30, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, {
        onTap: () => this.pickOption(source, x.link.move),
        onLongPress: () => {
          this.message = `【コンボ】${x.link.move.name}（重さ${x.link.move.weight}${x.link.members.length > 1 ? `・${x.link.members.length}人の手番を使う` : ''}。最後の行動だけ）：${x.link.move.text}`;
          this.render();
        },
      });
    });
    if (this.tab === 'cards') {
      const usedCards = new Set(this.plan.flatMap(stepCards));
      const lastAddons = new Set(this.plan[this.addonIndex()]?.addons ?? []);
      // 添えた札は、もう一度タップで外せるよう、押せるまま（「添えた」の印）
      s.hand.forEach((id, index) => items.push({ source: { kind: 'card', index }, move: s.def.cards[id], art: CHAIN_CARD_ART[id], used: usedCards.has(index) && !lastAddons.has(index), added: lastAddons.has(index), key: id }));
    } else if (this.ally) {
      const me = findChainUnit(s, this.ally);
      const def = s.def.allies.find((a) => a.id === me?.defId);
      // 1人1回をやめた試し：同じ技は1ラウンドに1回まで（並べた技は「置いた」）
      const usedMove = (id: string) => !!s.def.multiAct && this.plan.some((p) => p.ally === this.ally && p.source.kind === 'move' && p.source.moveId === id);
      for (const m of def?.moves ?? []) items.push({ source: { kind: 'move', moveId: m.id }, move: m, art: CHAIN_MOVE_ART[m.id], key: m.id, used: usedMove(m.id) });
    }
    const me = this.ally ? findChainUnit(s, this.ally) : undefined;
    const shown = items.slice(0, 5);
    // コンボがある時は、木を描く場所を空けて札を下げ、少し低くする（下のボタンにかからないように）
    const cardH = links.length ? CARD_H_LINK : CARD_H;
    const top = links.length ? LINK_Y + 64 : LINK_Y + 4;
    const step = (GAME_WIDTH - 8) / 5;
    // コンボの帯から、材料の札へトーナメント表のような木（帯の真ん中から1本下ろし、横に分かれて、札へ縦に下りる。札の下に描く）。
    // コンボが2つ以上なら、横の線の高さと色を分ける。選んだコンボは太く
    if (this.tab === 'cards' && linkSpots.length) {
      const g = this.add.graphics();
      const barBottom = LINK_Y + 30;
      const gap = (top - 8 - barBottom) / (linkSpots.length + 1);
      linkSpots.forEach((sp, k) => {
        const xs = sp.cards.map((idx) => shown.findIndex((it) => it.source.kind === 'card' && it.source.index === idx)).filter((i) => i >= 0).map((i) => 4 + step * i + step / 2);
        if (!xs.length) return;
        const color = LINK_COLORS[k % LINK_COLORS.length];
        const stemX = sp.x + sp.w / 2;
        const levelY = barBottom + gap * (k + 1);
        const width = sp.sel ? 4.5 : 3;
        g.lineStyle(width + 3, 0x000000, 0.6);
        g.lineBetween(stemX, barBottom, stemX, levelY);
        g.lineBetween(Math.min(stemX, ...xs), levelY, Math.max(stemX, ...xs), levelY);
        for (const x of xs) g.lineBetween(x, levelY, x, top - 6);
        g.lineStyle(width, color, 1);
        g.lineBetween(stemX, barBottom, stemX, levelY);
        g.lineBetween(Math.min(stemX, ...xs), levelY, Math.max(stemX, ...xs), levelY);
        g.fillStyle(color, 1);
        g.fillCircle(stemX, levelY, width);
        for (const x of xs) {
          g.lineBetween(x, levelY, x, top - 8);
          // 札の上に、下向きの三角
          g.fillTriangle(x - 6, top - 10, x + 6, top - 10, x, top - 3);
        }
      });
      r.add(g);
    }
    const linkedIdx = new Set(this.tab === 'cards' ? linkSpots.flatMap((sp) => sp.cards) : []);
    shown.forEach((it, i) => {
      const cx = 4 + step * i + step / 2;
      const sel = !!this.pending && sameSource(this.pending.source, it.source);
      const cy = top + cardH / 2 - (sel ? 10 : 0);
      // コンボの材料の札は、後ろを金色に光らせる
      if (it.source.kind === 'card' && linkedIdx.has(it.source.index)) r.add(this.add.rectangle(cx, cy, CARD_W + 16, cardH + 16, GOLD, 0.55));
      this.drawCard(cx, cy, it, (i - (shown.length - 1) / 2) * 2.5, sel, !!it.move.owner && me?.defId !== it.move.owner, cardH);
      const hit = this.add.rectangle(cx, cy, CARD_W, cardH, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, {
        onTap: () => !it.used && this.pickOption(it.source, it.move),
        onLongPress: () => {
          this.message = `【${this.categoryLabel(it.move)}】${it.move.name}（重さ${it.move.weight}）：${it.move.text}`;
          this.render();
        },
      });
    });
    if (items.length === 0) r.add(addText(this, GAME_WIDTH / 2, top + 60, this.tab === 'cards' ? '手札がない' : '仲間を選ぶ', { size: 12, color: COLORS.subText }).setOrigin(0.5));
  }

  /** 写真の札（上に種類の色の帯、絵、名前、重さの四角、押す） */
  private drawCard(cx: number, cy: number, it: { move: ChainMove; art?: string; used?: boolean; added?: boolean; key?: string }, angle: number, sel: boolean, notMine: boolean, h = CARD_H): void {
    const m = it.move;
    const color = CATEGORY_COLOR[chainCardCategory(m)];
    const parts: Phaser.GameObjects.GameObject[] = [];
    const w = CARD_W;
    if (sel) parts.push(this.add.rectangle(0, 0, w + 14, h + 14, color, 0.35));
    parts.push(this.add.rectangle(4, 6, w + 6, h + 6, 0x000000, 0.6));
    parts.push(this.add.rectangle(0, 0, w + 6, h + 6, sel ? YELLOW : color));
    parts.push(this.add.rectangle(0, 0, w, h, m.owner ? 0xffe6a8 : 0xf4efe4));
    parts.push(this.add.rectangle(0, -h / 2 + 10, w + 6, 20, color));
    const label = CATEGORY_LABEL[chainCardCategory(m)];
    parts.push(addText(this, 0, -h / 2 + 10, label, { size: 10, bold: true, color: '#ffffff' }).setOrigin(0.5));
    if (it.art && hasImage(this, it.art)) parts.push(this.cropImage(it.art, 0, -h / 2 + 54, w - 8, 60));
    else parts.push(this.add.rectangle(0, -h / 2 + 54, w - 8, 60, 0x2b3560));
    if (m.owner) {
      const f = this.faceSquare(m.owner, w / 2 - 14, -h / 2 + 72, 22);
      if (f) parts.push(this.add.rectangle(w / 2 - 14, -h / 2 + 72, 25, 25, 0xffffff), f);
    }
    // 効果をひと言で（調整10）
    // 段階158：本番の技は、短い説明がないので説明の文をそのまま
    const short = CHAIN_SHORT_TEXT[it.key ?? ''] ?? (m.mp ? m.text : undefined);
    if (short) {
      // 札の幅で折り返す（2行まで。それより長い時だけ縮める）
      const ef = addText(this, 0, h / 2 - 38, short, { size: 10, bold: true, color: '#4a4a4a', align: 'center', wrap: w - 6, ja: true }).setOrigin(0.5);
      if (ef.width > w - 4) ef.setScale((w - 4) / ef.width);
      if (ef.displayHeight > 24) ef.setScale(Math.min(ef.scaleX, 24 / ef.height));
      parts.push(ef);
    }
    // 名前は1行に縮めて収める。縮めすぎる時だけ2行に
    let title = addText(this, 0, -h / 2 + 96, m.name, { size: 12, bold: true, color: '#111111' }).setOrigin(0.5);
    if (title.width > w - 6) {
      if ((w - 6) / title.width >= 0.72) title.setScale((w - 6) / title.width);
      else {
        title.destroy();
        title = addText(this, 0, -h / 2 + 96, m.name, { size: 12, bold: true, color: '#111111', align: 'center', wrap: w - 4, ja: true }).setOrigin(0.5);
        if (title.height > 24) title.setScale(24 / title.height);
      }
    }
    parts.push(title);
    // 重さ（時間の帯を何マス使うか）を言葉と四角で
    parts.push(addText(this, -w / 2 + 5, h / 2 - 16, `重さ${m.weight}`, { size: 10, bold: true, color: '#111111' }).setOrigin(0, 0.5));
    const side = !!m.mp || (m.effect.kind === 'status' && !!m.effect.rounds);
    if (!side) for (let k = 0; k < m.weight; k++) parts.push(this.add.rectangle(-w / 2 + 39 + k * 6, h / 2 - 16, 4, 8, 0x111111).setAngle(-12));
    // 段階158：技の MP（右下）
    if (m.mp) parts.push(addText(this, w / 2 - 4, h / 2 - 16, `MP${m.mp}`, { size: 10, bold: true, color: '#2a5bd7' }).setOrigin(1, 0.5));
    // 続く効果は、ラウンドの数を右下に（行動を遅らせる技は、文に書いたので印は出さない。調整11）
    const rounds = m.effect.kind === 'status' ? m.effect.rounds : undefined;
    if (rounds) {
      parts.push(this.add.rectangle(w / 2 - 15, h / 2 - 16, 26, 13, CHIP_LASTING));
      parts.push(addText(this, w / 2 - 15, h / 2 - 16, `${rounds}R`, { size: 9, bold: true, color: '#06201e' }).setOrigin(0.5));
    }
    if (it.used || notMine) parts.push(this.add.rectangle(0, 0, w + 6, h + 6, 0x000000, 0.55));
    if (it.used) parts.push(this.sticker(0, -10, '置いた', 0xffffff, '#000000', -10, 12));
    if (it.added) parts.push(this.sticker(0, -10, '添えた', YELLOW, '#000000', -10, 12));
    this.root.add(this.add.container(cx, cy, parts).setAngle(angle));
  }

  /** 長押しの説明の分類（スペシャルは、誰の専用かも） */
  private categoryLabel(m: ChainMove): string {
    const c = chainCardCategory(m);
    return c === 'special' && m.owner ? `スペシャル・${this.allyName(m.owner)}専用` : CATEGORY_LABEL[c];
  }


  private drawCommands(): void {
    const on = this.plan.length > 0;
    this.slantButton(8, CMD_Y, 92, 46, '1つ戻す', () => this.undo(), { enabled: on, size: 13 });
    this.slantButton(108, CMD_Y, 92, 46, '全部やめる', () => this.clearPlan(), { enabled: on, size: 13 });
    this.slantButton(210, CMD_Y, 172, 46, '● REC 実行', () => this.execute(), { go: true, enabled: on, size: 19 });
  }

  // ---------- 選ぶ ----------

  private pickAlly(uid: string): void {
    if (this.busy) return;
    const u = this.s.allies.find((a) => a.uid === uid);
    if (!u || u.hp <= 0) return;
    if (this.plannedAllies().has(uid) && !this.s.def.multiAct) {
      this.message = `${u.name}は並べてある。外すなら「1つ戻す」で後ろから外す`;
      this.render();
      return;
    }
    this.ally = uid;
    this.pending = null;
    this.message = `${u.name}の行動を選ぶ。次の時刻は${nextStart(this.s, this.plan)}`;
    this.render();
  }

  private pickOption(source: ChainSource, move: ChainMove): void {
    if (this.busy) return;
    // 添える札（調整17）：直前に並べた行動に重ねる。もう一度タップで外す
    if (move.effect.kind === 'addon' && source.kind === 'card') {
      this.toggleAddon(source.index, move);
      return;
    }
    // 連携技は、組む仲間の1人目が動く（今選んでいる仲間によらない）。持ち主のいないコンボ（調整17）は、今選んでいる仲間が動く
    const owner = source.kind === 'link' ? this.s.def.links.find((l) => l.id === source.linkId)?.members[0] : undefined;
    const actor = source.kind === 'link' && owner ? (this.s.allies.find((a) => a.defId === owner)?.uid ?? '') : this.ally;
    if (!actor) return;
    let actor2 = actor;
    if (move.owner && source.kind === 'card' && findChainUnit(this.s, actor)?.defId !== move.owner) {
      // ほかの仲間のスペシャル：その仲間がまだ並べていなければ、その仲間に切り替えて使う
      const owner = this.s.allies.find((a) => a.defId === move.owner);
      const free = owner && owner.hp > 0 && (!!this.s.def.multiAct || !this.plannedAllies().has(owner.uid));
      if (!owner || !free) {
        this.warn(`${move.name}は${this.allyName(move.owner)}の専用の札。${this.allyName(move.owner)}はこのラウンドもう並べたか、動けない`);
        return;
      }
      this.ally = owner.uid;
      actor2 = owner.uid;
    }
    // クライマックス（コンボも）は最後の行動。まだ並べていない仲間がいる時は、1回目のタップで知らせる
    if (this.s.def.finishLast && isChainFinish(move) && !this.s.def.multiAct) {
      const used = this.plannedAllies();
      const left = this.s.allies.filter((a) => a.hp > 0 && a.uid !== actor2 && !used.has(a.uid) && !(source.kind === 'link' && (this.s.def.links.find((l) => l.id === source.linkId)?.members ?? []).includes(a.defId)));
      const key = JSON.stringify(source);
      if (left.length && this.climaxOk !== key) {
        this.climaxOk = key;
        this.warn(`${move.name}はクライマックス（ラウンドの最後の行動）。置くと、${left.map((a) => a.name).join('と')}はこのラウンド並べられない。もう一度タップで置く`);
        return;
      }
    }
    this.climaxOk = null;
    // 敵1体を選ばない札・技は、1回のタップで並べる（調整4。説明は長押しと、並べた後の案内で）
    if (move.target !== 'enemy') {
      this.place({ ally: actor2, source });
      return;
    }
    if (this.pending && sameSource(this.pending.source, source)) {
      this.message = `${move.name}：相手の敵をタップ`;
      this.render();
      return;
    }
    this.pending = { source, move };
    const at = nextStart(this.s, this.plan);
    this.message = `【${this.categoryLabel(move)}】${move.name}（重さ${move.weight}・時刻${at}〜）：${move.text}　→ 敵をタップ`;
    this.render();
  }

  /** サポートを添える先の行（帯の上でタップして選ぶ。選んでいなければ最後の行） */
  private addonIndex(): number {
    return this.addonAt !== null && this.addonAt < this.plan.length ? this.addonAt : this.plan.length - 1;
  }

  private toggleAddon(index: number, move: ChainMove): void {
    const at = this.addonIndex();
    const step = this.plan[at];
    if (!step) {
      this.warn(`${move.name}はエフェクト。先に行動を並べてから、タップして添える（帯の上の行動をタップすると、添える先を選べる）`);
      return;
    }
    const mine = (step.addons ?? []).includes(index);
    const next: ChainPlanStep = { ...step, addons: mine ? (step.addons ?? []).filter((a) => a !== index) : [...(step.addons ?? []), index] };
    // ほかの行で使う札は添えられない（前の行は chainPlanError が、後ろの行はここで見る）
    const later = this.plan.slice(at + 1).some((p) => stepCards(p).includes(index));
    const err = later ? 'その札は、もう使う予定' : chainPlanError(this.s, this.plan.slice(0, at), next);
    if (err && !mine) {
      this.warn(err);
      this.render();
      return;
    }
    if (!mine) playSe(this, SE.tap);
    this.plan[at] = next;
    const who = stepAllies(this.s, step).map((u) => findChainUnit(this.s, u)?.name).join('と');
    const names = (next.addons ?? []).map((a) => this.s.def.cards[this.s.hand[a]]?.name);
    this.message = `${who}の${chainMoveOf(this.s, step)?.name}に、${names.length ? `「${names.join('・')}」を添えた` : '何も添えていない'}（${this.s.rules.addonMax}枚まで）`;
    this.render();
  }

  /** 帯の上の行動をタップ：サポートを添える先にする（調整17） */
  private pickClip(i: number): void {
    if (this.busy || !this.plan[i]) return;
    this.addonAt = i;
    const step = this.plan[i];
    const who = stepAllies(this.s, step).map((u) => findChainUnit(this.s, u)?.name).join('と');
    this.message = `${who}の${chainMoveOf(this.s, step)?.name}を選んだ。手札のエフェクトをタップすると、ここに添える`;
    this.render();
  }

  private pickEnemy(uid: string): void {
    if (this.busy || !this.pending || !this.ally) return;
    if (this.pending.move.target !== 'enemy') return;
    // 連携技は、組む仲間の1人目が動く
    const src = this.pending.source;
    const owner = src.kind === 'link' ? this.s.def.links.find((l) => l.id === src.linkId)?.members[0] : undefined;
    const ally = owner ? (this.s.allies.find((a) => a.defId === owner)?.uid ?? this.ally) : this.ally;
    this.place({ ally, source: src, target: uid });
  }

  private place(step: ChainPlanStep): void {
    const err = chainPlanError(this.s, this.plan, step);
    if (err) {
      this.warn(err);
      this.render();
      return;
    }
    playSe(this, SE.tap);
    this.plan.push(step);
    this.addonAt = null;
    const move = chainMoveOf(this.s, step)!;
    this.pending = null;
    // クライマックスの後は並べられないので、次の仲間を選ばない
    const climaxPlaced = !!this.s.def.finishLast && isChainFinish(move);
    this.ally = climaxPlaced ? '' : this.firstFreeAlly();
    const next = nextStart(this.s, this.plan);
    const who = stepAllies(this.s, step).map((u) => findChainUnit(this.s, u)?.name).join('と');
    this.message = this.s.def.multiAct
      ? `${who}：${move.name}を並べた。時刻${next}まで使った。続けて並べるか、仲間を替えるか、「実行」`
      : climaxPlaced
        ? `${who}：${move.name}（クライマックス）を並べた。このラウンドはここまで。「実行」で動き出す`
        : `${who}：${move.name}（${move.text}）を並べた。${this.ally ? `次は${findChainUnit(this.s, this.ally)?.name}（時刻${next}から）` : '全員並べた。「実行」で動き出す'}`;
    if (availableLinks(this.s, this.plan).length) this.message += this.s.def.finishLast ? '。コンボがそろっている（手札の上の ★。最後の行動に）' : '。連携技が使える（手札の先頭 ★）';
    this.render();
  }

  private undo(): void {
    if (this.busy || this.plan.length === 0) return;
    const last = this.plan.pop()!;
    this.addonAt = null;
    this.ally = last.ally;
    this.pending = null;
    this.message = `${stepAllies(this.s, last).map((u) => findChainUnit(this.s, u)?.name).join('と')}の行動を外した`;
    this.render();
  }

  private clearPlan(): void {
    if (this.busy) return;
    this.plan = [];
    this.addonAt = null;
    this.pending = null;
    this.ally = this.firstFreeAlly();
    this.message = '並べた行動を全部外した';
    this.render();
  }

  // ---------- 動かす ----------

  /** 実行中のラウンドの、最後の状態（結果まで飛ばす時に使う） */
  private runFinal: ChainState | null = null;

  /** 結果まで飛ばす：残りのコマの結果を一覧に書き、ラウンドの終わりへ */
  private skipToEnd(): void {
    if (!this.busy || !this.runFinal) return;
    const final = this.runFinal;
    this.runFinal = null;
    this.advance = null;
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.cutInBox?.destroy(true);
    this.cutInBox = null;
    for (const m of this.cutInMasks) m.destroy();
    this.cutInMasks = [];
    let before = this.s;
    for (const f of this.runFrames) {
      if (!this.runResults.has(f.order)) this.runResults.set(f.order, describe(f, before));
      before = f.state;
    }
    this.currentOrder = 0;
    this.actorUid = '';
    this.targetUid = '';
    this.finishRound(final);
  }

  private toggleSpeed(): void {
    this.speed = this.speed === 1 ? 2 : 1;
    browserStorage().write(SPEED_KEY, String(this.speed));
    if (!this.busy) this.render();
  }

  /** デバッグ用のオート：考える方針（自動対戦と同じ）で、このラウンドを並べて実行する */
  private autoRound(): void {
    if (this.busy || this.s.outcome !== 'ongoing' || this.s.shutter) return;
    let r = (this.seed + this.s.round * 7919) >>> 0;
    this.plan = smartChainPlan(this.s, (n) => {
      const [v, next] = nextRandom(r);
      r = next;
      return Math.floor(v * n);
    });
    this.addonAt = null;
    this.execute();
  }

  private execute(): void {
    if (this.busy || this.plan.length === 0) return;
    // チュートリアルの「REC 実行」の手順は、押したら終わり
    if (this.coach && CHAIN_COACH[this.coach.id][this.coach.i]?.target === 'exec') this.endCoach();
    this.coachLayer?.destroy(true);
    this.coachLayer = null;
    this.cutInShown = new Set();
    this.cutSteps = new Set();
    const { state, frames } = runChainRound(this.s, this.plan);
    this.runFinal = state;
    this.runFrames = frames;
    this.runResults = new Map();
    this.busy = true;
    this.pending = null;
    this.head?.destroy();
    // 再生の線：赤く光る線と「PLAY」の札
    this.head = this.add.container(FILM_X, 0, [
      this.add.rectangle(0, FILM_Y + 2, 10, FILM_H - 4, RED, 0.25).setOrigin(0.5, 0),
      this.add.rectangle(0, FILM_Y + 2, 3, FILM_H - 4, RED).setOrigin(0.5, 0),
      this.add.rectangle(0, FILM_Y - 4, 34, 13, RED),
      addText(this, 0, FILM_Y - 4, 'PLAY', { size: 9, bold: true }).setOrigin(0.5),
    ]).setDepth(5);
    this.playFrames(frames, 0, state, this.s);
  }

  /** 再生位置を、時刻 t のマスの真ん中まで、左から右へなめらかに動かす（1マス TICK_MS）。タップで飛ばす */
  private moveHead(t: number, next: () => void): void {
    const head = this.head;
    if (!head) {
      next();
      return;
    }
    const x = FILM_X + CELL * t;
    const ms = Math.max(0, ((x - head.x) / CELL) * TICK_MS) / this.speed;
    if (ms < 30) {
      head.x = Math.max(head.x, x);
      next();
      return;
    }
    let fired = false;
    const tween = this.tweens.add({ targets: head, x, duration: ms, ease: 'Linear', onComplete: () => run() });
    const run = () => {
      if (fired) return;
      fired = true;
      tween.stop();
      head.x = x;
      this.advance = null;
      next();
    };
    this.advance = run;
  }

  /** 攻撃・回復の、元から相手へ飛ぶ光（元が光り、玉が飛び、相手が光る）。1つの行動に1組だけ。画面は揺らさない */
  private flyEffects(f: ChainFrame, view: ChainState): void {
    const pairs: { from: string; to: string; heal: boolean }[] = [];
    for (const ev of f.events) {
      if (ev.type === 'damage' && !pairs.some((p) => p.from === ev.from && p.to === ev.to)) pairs.push({ from: ev.from, to: ev.to, heal: false });
      if (ev.type === 'heal' && !pairs.some((p) => p.to === ev.to)) pairs.push({ from: f.uid, to: ev.to, heal: true });
    }
    const src = this.posOf(view, f.uid);
    const actor = findChainUnit(view, f.uid);
    const color = actor?.side === 'enemy' ? 0xff5a5a : (ALLY_COLOR[actor?.defId ?? ''] ?? 0x9ad0ff);
    if (src) {
      const ring = this.add.circle(src.x, src.y, 14, color, 0.35).setStrokeStyle(3, color).setDepth(40);
      this.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
    }
    pairs.forEach((p, k) => {
      const a = this.posOf(view, p.from) ?? src;
      const b = this.posOf(f.state, p.to) ?? this.posOf(view, p.to);
      if (!a || !b) return;
      const c = p.heal ? 0x6dff9e : p.from === f.uid ? YELLOW : 0xffd84a;
      // 攻撃元から相手へ、光の筋が走る（調整9：イメージの軌跡）
      const line = this.add.graphics().setDepth(41);
      const prog = { t: 0 };
      this.tweens.add({
        targets: prog,
        t: 1,
        delay: 60 + k * 60,
        duration: 200,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          const x = a.x + (b.x - a.x) * prog.t;
          const y = a.y + (b.y - a.y) * prog.t;
          line.clear();
          line.lineStyle(10, c, 0.25).lineBetween(a.x, a.y, x, y);
          line.lineStyle(4, c, 0.9).lineBetween(a.x, a.y, x, y);
          line.lineStyle(1.5, 0xffffff, 1).lineBetween(a.x + (x - a.x) * 0.5, a.y + (y - a.y) * 0.5, x, y);
        },
        onComplete: () => {
          this.tweens.add({ targets: line, alpha: 0, duration: 260, onComplete: () => line.destroy() });
          const glow = this.add.circle(b.x, b.y, 18, c, 0.6).setDepth(41);
          const core = this.add.circle(b.x, b.y, 8, 0xffffff, 1).setDepth(42);
          this.tweens.add({ targets: [glow, core], scale: 2.6, alpha: 0, duration: 340, onComplete: () => (glow.destroy(), core.destroy()) });
        },
      });
    });
  }

  /**
   * コンボのカットイン（本番の連携技のカットインと同じ形。段階158 調整5）：画面を暗くし、動く仲間の数だけ斜めの帯を重ね、
   * 帯ごとに仲間の色と顔を大きく（横から滑り込む）。真ん中の黒い箱に技名と「COMBO」。終わりに白く光って揺れる。画面のタップで先へ
   */
  private comboCutIn(name: string, defIds: string[], next: () => void): void {
    const ids = defIds.length ? defIds.slice(0, 3) : [''];
    const c = this.add.container(0, 0).setDepth(90);
    this.cutInBox = c;
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82).setOrigin(0));
    const rad = Phaser.Math.DegToRad(-12);
    const n = ids.length;
    const bandH = n === 1 ? 330 : n === 2 ? 300 : 190;
    const bandW = GAME_WIDTH + 260;
    const gap = 8;
    const total = n * bandH + (n - 1) * gap;
    // 技名の箱の場所：2人は帯の間（真ん中）、1人と3人は帯の下（顔に重ねない）。帯はその分だけ上へ
    const shift = n === 2 ? 0 : 50;
    const at = (cy: number, lx: number, ly: number) => new Phaser.Math.Vector2(GAME_WIDTH / 2 + lx * Math.cos(rad) - ly * Math.sin(rad), cy + lx * Math.sin(rad) + ly * Math.cos(rad));
    ids.forEach((id, i) => {
      const cy = GAME_HEIGHT / 2 - shift - total / 2 + bandH / 2 + i * (bandH + gap);
      const color = ALLY_COLOR[id] ?? GOLD;
      const corners = [at(cy, -bandW / 2, -bandH / 2), at(cy, bandW / 2, -bandH / 2), at(cy, bandW / 2, bandH / 2), at(cy, -bandW / 2, bandH / 2)];
      const mask = this.make.graphics({}, false).fillStyle(0xffffff).fillPoints(corners, true);
      this.cutInMasks.push(mask);
      const inner = this.add.container(0, 0);
      inner.setMask(mask.createGeometryMask());
      c.add(inner);
      inner.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, color).setOrigin(0));
      const lines = this.add.graphics().lineStyle(2, 0xffffff, 0.14);
      for (let x = -200; x < GAME_WIDTH + 200; x += 22) lines.lineBetween(x, cy - bandH, x + 60, cy + bandH);
      inner.add(lines);
      // 顔：互い違いに右・左へ置き、横から滑り込む
      const pid = ALLY_FACE[id];
      if (pid && hasImage(this, pid)) {
        const img = this.add.image(0, 0, pid).setOrigin(0.5, 0);
        img.setScale((bandH * 1.45) / img.height);
        const right = i % 2 === 0;
        const px = right ? GAME_WIDTH * 0.66 : GAME_WIDTH * 0.34;
        img.setPosition(px + (right ? 90 : -90), cy - bandH / 2 - 30).setAlpha(0);
        inner.add(img);
        this.tweens.add({ targets: img, x: px, alpha: 1, duration: 280, delay: i * 160, ease: 'Cubic.easeOut' });
      }
      c.add(this.add.graphics().lineStyle(10, 0x000000).strokePoints(corners, true).lineStyle(4, 0xffffff).strokePoints(corners, true));
      if (id) {
        const right = i % 2 === 0;
        const np = right ? at(cy, -GAME_WIDTH / 2 + 30, -bandH / 2 + 50) : at(cy, GAME_WIDTH / 2 - 30, bandH / 2 - 50);
        const nm = addText(this, np.x, np.y, this.allyName(id), { size: 24, bold: true }).setOrigin(right ? 0 : 1, 0.5).setAngle(-12);
        nm.setFontStyle('bold italic').setShadow(3, 3, '#000000', 0, false, true);
        c.add(nm);
      }
    });
    // 真ん中の技名
    const title = this.add.container(GAME_WIDTH / 2, n === 2 ? GAME_HEIGHT / 2 : GAME_HEIGHT / 2 - shift + total / 2 + 64).setAngle(-8);
    const label = addText(this, 0, 0, name, { size: 32, bold: true }).setOrigin(0.5);
    label.setFontStyle('bold italic').setShadow(4, 4, '#ff2d55', 0, false, true);
    if (label.width > GAME_WIDTH - 60) label.setScale((GAME_WIDTH - 60) / label.width);
    const boxW = Math.max(240, label.displayWidth + 48);
    title.add(this.add.rectangle(0, 4, boxW, 66, 0x000000).setStrokeStyle(2, 0xffffff, 0.5));
    title.add(label);
    const tag = addText(this, -boxW / 2 + 12, -46, n > 1 && defIds.length > 1 ? 'C O M B O   ×   L I N K' : 'C O M B O', { size: 13, bold: true, color: '#ffd700' });
    tag.setFontStyle('bold italic').setShadow(2, 2, '#000000', 0, false, true);
    title.add(tag);
    title.setScale(2.2).setAlpha(0);
    c.add(title);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, delay: 420, duration: 280, ease: 'Back.easeOut' });
    playSe(this, SE.tap);
    const finish = () => {
      if (this.cutInBox !== c) return;
      const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1).setOrigin(0).setDepth(95);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
      this.cameras.main.shake(260, 0.012);
      c.destroy(true);
      for (const m of this.cutInMasks) m.destroy();
      this.cutInMasks = [];
      this.cutInBox = null;
      next();
    };
    this.wait(1400, finish);
  }

  /**
   * 敵の大技の全画面のカットイン（段階176 の後。カイの切り取り）：仲間のコンボと同じく、斜めの帯に敵の絵を大きく、真ん中に技名
   */
  private enemyCutIn(name: string, tag: string, who: string, art: string | undefined, next: () => void): void {
    const c = this.add.container(0, 0).setDepth(90);
    this.cutInBox = c;
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82).setOrigin(0));
    const rad = Phaser.Math.DegToRad(-12);
    const bandH = 330;
    const bandW = GAME_WIDTH + 260;
    const cy = GAME_HEIGHT / 2 - 50;
    const at = (lx: number, ly: number) => new Phaser.Math.Vector2(GAME_WIDTH / 2 + lx * Math.cos(rad) - ly * Math.sin(rad), cy + lx * Math.sin(rad) + ly * Math.cos(rad));
    const corners = [at(-bandW / 2, -bandH / 2), at(bandW / 2, -bandH / 2), at(bandW / 2, bandH / 2), at(-bandW / 2, bandH / 2)];
    const mask = this.make.graphics({}, false).fillStyle(0xffffff).fillPoints(corners, true);
    this.cutInMasks.push(mask);
    const inner = this.add.container(0, 0);
    inner.setMask(mask.createGeometryMask());
    c.add(inner);
    inner.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a4a9a).setOrigin(0));
    const lines = this.add.graphics().lineStyle(2, 0xffffff, 0.14);
    for (let x = -200; x < GAME_WIDTH + 200; x += 22) lines.lineBetween(x, cy - bandH, x + 60, cy + bandH);
    inner.add(lines);
    if (art && hasImage(this, art)) {
      const img = this.add.image(0, 0, art).setOrigin(0.5, 0);
      img.setScale((bandH * 1.45) / img.height);
      const px = GAME_WIDTH * 0.62;
      img.setPosition(px + 90, cy - bandH / 2 - 30).setAlpha(0);
      inner.add(img);
      this.tweens.add({ targets: img, x: px, alpha: 1, duration: 280, ease: 'Cubic.easeOut' });
    }
    c.add(this.add.graphics().lineStyle(10, 0x000000).strokePoints(corners, true).lineStyle(4, 0xffffff).strokePoints(corners, true));
    const np = at(-GAME_WIDTH / 2 + 30, -bandH / 2 + 50);
    const nm = addText(this, np.x, np.y, who, { size: 24, bold: true }).setOrigin(0, 0.5).setAngle(-12);
    nm.setFontStyle('bold italic').setShadow(3, 3, '#000000', 0, false, true);
    c.add(nm);
    const title = this.add.container(GAME_WIDTH / 2, cy + bandH / 2 + 64).setAngle(-8);
    const label = addText(this, 0, 0, name, { size: 40, bold: true }).setOrigin(0.5);
    label.setFontStyle('bold italic').setShadow(4, 4, '#3a8dff', 0, false, true);
    const boxW = Math.max(240, label.displayWidth + 48);
    title.add(this.add.rectangle(0, 4, boxW, 70, 0x000000).setStrokeStyle(2, 0xffffff, 0.5));
    title.add(label);
    const tg = addText(this, -boxW / 2 + 12, -48, tag, { size: 13, bold: true, color: '#9ad0ff' });
    tg.setFontStyle('bold italic').setShadow(2, 2, '#000000', 0, false, true);
    title.add(tg);
    title.setScale(2.2).setAlpha(0);
    c.add(title);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, delay: 380, duration: 260, ease: 'Back.easeOut' });
    playSe(this, SE.slash);
    this.wait(1300, () => {
      if (this.cutInBox !== c) return;
      c.destroy(true);
      for (const m of this.cutInMasks) m.destroy();
      this.cutInMasks = [];
      this.cutInBox = null;
      next();
    });
  }

  /**
   * 時間の帯ごと切り取る（段階176 の後。カイの切り取り）：今の画面のタイムラインを写し取り、抜き取られた行動の所で2か所切って、
   * 真ん中の切れ端を飛ばし、右側を左へ寄せて切り口をくっつける（メタ的な演出）。終わったら next
   */
  private filmCut(stepIndex: number, next: () => void): void {
    const move = stepIndex >= 0 ? chainMoveOf(this.s, this.plan[stepIndex]) : null;
    if (!move) {
      next();
      return;
    }
    const start = planStarts(this.s, this.plan)[stepIndex];
    const x1 = FILM_X + CELL * start;
    const x2 = Math.min(GAME_WIDTH, x1 + CELL * Math.max(1, move.weight));
    const canvas = this.game.canvas;
    const z = canvas.width / GAME_WIDTH;
    const key = '__filmCut';
    this.game.renderer.snapshotArea(0, Math.round(FILM_Y * z), canvas.width, Math.round(FILM_H * z), (img) => {
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addImage(key, img as HTMLImageElement);
      const layer = this.add.container(0, 0).setDepth(85);
      layer.add(this.add.rectangle(0, FILM_Y, GAME_WIDTH, FILM_H, 0x0b1020).setOrigin(0));
      const piece = (from: number, to: number) => {
        const im = this.add.image(0, FILM_Y, key).setOrigin(0).setScale(1 / z);
        im.setCrop(from * z, 0, Math.max(1, (to - from) * z), FILM_H * z);
        layer.add(im);
        return im;
      };
      piece(0, x1);
      const mid = piece(x1, x2);
      const right = piece(x2, GAME_WIDTH);
      // 切る線（2本が赤く走る）
      const blades = this.add.graphics().lineStyle(4, 0xff2d55, 1);
      for (const x of [x1, x2]) blades.lineBetween(x, FILM_Y - 6, x, FILM_Y + FILM_H + 6);
      layer.add(blades);
      this.tweens.add({ targets: blades, alpha: 0.2, duration: 90, yoyo: true, repeat: 2 });
      playSe(this, SE.slash);
      // 切れ端は回りながら上へ飛んで消える
      this.tweens.add({ targets: mid, y: FILM_Y - 160, x: 40, angle: -24, alpha: 0, delay: 300, duration: 520, ease: 'Cubic.easeIn' });
      // 右側を左へ寄せて、切り口をくっつける
      this.tweens.add({
        targets: right,
        x: -(x2 - x1),
        delay: 560,
        duration: 320,
        ease: 'Back.easeIn',
        onComplete: () => {
          blades.clear();
          const seam = this.add.rectangle(x1, FILM_Y + FILM_H / 2, 6, FILM_H + 14, 0xffffff, 1);
          layer.add(seam);
          this.tweens.add({ targets: seam, alpha: 0, scaleX: 3, duration: 260 });
          this.cameras.main.shake(220, 0.01);
          this.wait(420, () => {
            layer.destroy(true);
            if (this.textures.exists(key)) this.textures.remove(key);
            next();
          });
        },
      });
    });
  }

  /** 差し込みの帯（パノラマ・連携技など。斜めの帯が右から入って、少しして消える） */
  private cutIn(text: string, sub: string, color: number, faces: string[]): void {
    const y = STAGE_Y + 196;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillPoints([new Phaser.Math.Vector2(-20, y - 4), new Phaser.Math.Vector2(GAME_WIDTH + 20, y - 26), new Phaser.Math.Vector2(GAME_WIDTH + 20, y + 40), new Phaser.Math.Vector2(-20, y + 62)], true);
    g.fillStyle(color, 0.96).fillPoints([new Phaser.Math.Vector2(-20, y), new Phaser.Math.Vector2(GAME_WIDTH + 20, y - 22), new Phaser.Math.Vector2(GAME_WIDTH + 20, y + 36), new Phaser.Math.Vector2(-20, y + 58)], true);
    parts.push(g);
    faces.forEach((d, k) => {
      const f = this.faceSquare(d, 52 + k * 46, y + 22, 64);
      if (f) parts.push(f);
    });
    const t = addText(this, 60 + faces.length * 46, y + 14, text, { size: 28, bold: true }).setOrigin(0, 0.5).setFontStyle('bold italic');
    t.setShadow(3, 3, '#000000', 0, false, true);
    if (t.width > GAME_WIDTH - t.x - 10) t.setScale((GAME_WIDTH - t.x - 10) / t.width);
    parts.push(t, addText(this, 62 + faces.length * 46, y + 40, sub, { size: 10, bold: true, color: '#ffffff' }).setOrigin(0, 0.5));
    const box = this.add.container(GAME_WIDTH, 0, parts).setDepth(60);
    this.tweens.add({ targets: box, x: 0, duration: 160, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: box, alpha: 0, delay: 820, duration: 220, onComplete: () => box.destroy() });
  }

  /** ms 待ってから next。画面をタップすると、待たずに next */
  private wait(ms: number, next: () => void): void {
    let fired = false;
    const run = () => {
      if (fired) return;
      fired = true;
      timer.remove();
      this.advance = null;
      next();
    };
    const timer = this.time.delayedCall(ms / this.speed, run);
    this.advance = run;
  }

  /** 1つの行動を、2段で見せる：まず「誰が・何を・誰に」（動く者とねらう相手を光らせる）、次に結果 */
  private playFrames(frames: ChainFrame[], i: number, final: ChainState, before: ChainState): void {
    if (i >= frames.length) {
      const done = () => {
        this.currentOrder = 0;
        this.actorUid = '';
        this.targetUid = '';
        this.finishRound(final);
      };
      // シャッターや決着で止まった時は、そこで終わる。最後まで動いた時は、ラウンドの終わりまで線を進める
      if (final.shutter || final.outcome !== 'ongoing') done();
      else this.moveHead(CHAIN_RULES.roundLen, () => this.wait(WAIT.end, done));
      return;
    }
    const f = frames[i];
    // 再生位置がその行動の時刻に来るまで、線を進める
    if (this.head && this.head.x < FILM_X + CELL * f.at - 1) {
      this.moveHead(f.at, () => this.playFrames(frames, i, final, before));
      return;
    }
    const label = this.frameLabel(f);
    const when = isRoundEnd(f.key) ? 'ラウンドの終わり' : `${f.order}番目（時刻${f.at}）`;
    this.currentOrder = f.order;
    this.actorUid = f.uid;
    this.targetUid = f.target && !f.all ? f.target : '';
    const canceled = f.events.some((e) => e.type === 'cancel');
    const result = describe(f, before);
    if (canceled) {
      this.runResults.set(f.order, result);
      this.message = `${when}　${label}\n${result}`;
      this.render(f.state);
      this.wait(WAIT.cancel, () => this.playFrames(frames, i + 1, final, f.state));
      return;
    }
    // コンボ：行動の前に、本番の連携技と同じ全画面のカットイン（動く仲間の顔を斜めの帯で大きく、真ん中に技名）
    const link = f.events.find((e) => e.type === 'link');
    if (link && link.type === 'link' && !this.cutInShown.has(f.order)) {
      this.cutInShown.add(f.order);
      this.message = `${when}　${label}`;
      this.render(before);
      const ids = link.uids.map((u) => findChainUnit(before, u)?.defId ?? '').filter(Boolean);
      this.comboCutIn(link.name, ids, () => this.playFrames(frames, i, final, before));
      return;
    }
    // カイの切り取り（段階176 の後の直し）：全画面のカットイン → 時間の帯ごと切り抜いて、切り口をくっつける。その後で結果を見せる
    const cutEv = f.events.find((e) => e.type === 'frameCut');
    if (cutEv && cutEv.type === 'frameCut' && !this.cutInShown.has(f.order)) {
      this.cutInShown.add(f.order);
      this.message = `${when}　${label}`;
      this.render(before);
      const enemyArt = artOfEnemy(findChainUnit(before, cutEv.uid)?.defId ?? '');
      this.enemyCutIn('CUT!', 'F R A M E   C U T', findChainUnit(before, cutEv.uid)?.name ?? '', enemyArt, () => {
        const idx = this.plan.findIndex((p) => stepAllies(this.s, p).includes(cutEv.to));
        this.filmCut(idx, () => {
          if (idx >= 0) this.cutSteps.add(idx);
          this.playFrames(frames, i, final, before);
        });
      });
      return;
    }
    this.message = `${when}　${label}`;
    this.render(before);
    this.flyEffects(f, before);
    this.wait(WAIT.announce, () => {
      this.runResults.set(f.order, result);
      this.message = `${when}　${label}\n${result}`;
      this.render(f.state);
      this.popNumbers(f.events, f.state);
      this.cutInFor(f, before);
      if (f.events.some((e) => e.type === 'damage')) playSe(this, f.events.some((e) => e.type === 'damage' && e.weak) ? SE.slash : SE.hit);
      if (f.events.some((e) => e.type === 'heal')) playSe(this, SE.heal);
      if (f.events.some((e) => (e.type === 'trickUse' && e.trick === 'spread') || e.type === 'timerBlast')) playSe(this, SE.firework);
      const big = f.events.some((e) => ['link', 'trickUse', 'status', 'pop', 'split', 'counter', 'wake', 'sticky', 'flee', 'timerBlast', 'cover', 'shellBreak', 'allyCover', 'scatter', 'blast', 'sync', 'teeth', 'allyRiposte', 'chorus', 'hitBack', 'frameCut'].includes(e.type));
      this.wait(big ? WAIT.big : WAIT.result, () => this.playFrames(frames, i + 1, final, f.state));
    });
  }

  /** そのコマに、差し込みの帯を出す出来事があれば出す */
  private cutInFor(f: ChainFrame, before: ChainState): void {
    const actor = findChainUnit(before, f.uid);
    const link = f.events.find((e) => e.type === 'link');
    // コンボは、行動の前に全画面のカットイン（comboCutIn）を出すので、ここでは出さない
    if (link && link.type === 'link') return;
    const spread = f.events.find((e) => e.type === 'trickUse' && e.trick === 'spread');
    if (spread && spread.type === 'trickUse' && spread.to?.length) {
      this.cutIn('パノラマ！', `${f.name}の一撃が、ほかの敵みんなに広がった`, 0x7a3ad8, actor?.side === 'ally' ? [actor.defId] : []);
      return;
    }
    if (f.events.some((e) => e.type === 'panic')) {
      this.cutIn('動揺！', 'リーダーを倒した。ほかの敵がダウン', 0xc88a10, actor?.side === 'ally' ? [actor.defId] : []);
      return;
    }
    if (f.events.some((e) => e.type === 'shutterReady')) this.cutIn('ALL DOWN!', '全員ダウン。シャッターのチャンス', RED, []);
    const broke = f.events.find((e) => e.type === 'partBreak');
    if (broke && broke.type === 'partBreak') this.cutIn('BREAK!', `${findChainUnit(before, broke.uid)?.name ?? ''}を壊した！ その大技はもう来ない`, 0xc88a10, actor?.side === 'ally' ? [actor.defId] : []);
  }

  private finishRound(final: ChainState): void {
    this.s = final;
    keepChainWeak(!!this.encounter, final.known);
    this.runFinal = null;
    this.head?.destroy();
    this.head = null;
    this.plan = [];
    this.ally = this.firstFreeAlly();
    if (final.shutter) {
      this.message = '敵が全員ダウンした。今だ、シャッターで総攻撃！';
      this.render();
      this.showShutter();
      return;
    }
    this.busy = false;
    if (final.outcome !== 'ongoing') {
      this.render();
      this.showEnd();
      return;
    }
    this.message = `ラウンド${final.round}。ダウンが解けた。敵の新しい予定を見て並べる`;
    this.render();
  }

  /** シャッターのボタン。押すと総攻撃（調整15。前は、その瞬間を切り取って決着） */
  private showShutter(): void {
    const o = this.add.container(0, 0).setDepth(90);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0).setInteractive());
    const cy = 600;
    const ring = this.add.circle(GAME_WIDTH / 2, cy, 78, RED, 0.18).setStrokeStyle(4, 0xffffff);
    const btn = this.add.circle(GAME_WIDTH / 2, cy, 60, RED).setStrokeStyle(5, 0xffffff);
    const t = addText(this, GAME_WIDTH / 2, cy, 'SHUTTER', { size: 22, bold: true }).setOrigin(0.5).setFontStyle('bold italic');
    o.add([ring, btn, t]);
    o.add(this.sticker(GAME_WIDTH / 2, cy - 98, '全員の動きが止まった！ 総攻撃のチャンス', YELLOW, '#000000', -4, 13));
    this.tweens.add({ targets: ring, scale: 1.18, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    makePressable(btn, {
      onTap: () => {
        o.destroy();
        this.snap();
      },
    });
  }

  /** シャッター（調整15：総攻撃）。敵みんなに大きなダメージ。倒し切れば決着、残ればダウンが解けて次のラウンドへ */
  private snap(): void {
    playSe(this, SE.shutter);
    const before = this.s;
    const r = shootShutter(this.s);
    this.s = r.state;
    keepChainWeak(!!this.encounter, this.s.known);
    // 白く光って、敵がセピアに止まり、総攻撃の数字が出る
    const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1).setOrigin(0).setDepth(95);
    this.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
    for (const img of this.enemyImages.values()) if (img.alpha >= 0.5) img.setTint(0xc8a878);
    this.popNumbers(r.events, before);
    const win = this.s.outcome !== 'ongoing';
    this.time.delayedCall(win ? 1000 : 1500, () => {
      this.busy = false;
      for (const img of this.enemyImages.values()) img.clearTint();
      if (win) {
        this.render();
        this.showEnd();
        return;
      }
      const left = this.s.enemies.filter((e) => e.hp > 0 && !e.gone).length;
      this.message = `総攻撃！ ${left}体が持ちこたえて起き上がった。ラウンド${this.s.round}。敵の新しい予定を見て並べる`;
      this.render();
    });
  }

  /** 大きな数字と、WEAK!・DOWN・弱点判明のシール */
  private popNumbers(events: ChainEvent[], s: ChainState): void {
    let k = 0;
    for (const ev of events) {
      if (ev.type === 'damage' || ev.type === 'heal') {
        const p = this.posOf(s, ev.to);
        if (!p) continue;
        const enemy = findChainUnit(s, ev.to)?.side === 'enemy';
        const heal = ev.type === 'heal';
        const big = enemy && !heal;
        const t = addText(this, p.x - 6, p.y - 10, heal ? `+${ev.amount}` : String(ev.amount), { size: big ? (ev.type === 'damage' && ev.weak ? 40 : 30) : 20, bold: true, color: heal ? '#6dff9e' : enemy ? '#ffffff' : '#ff8a8a' })
          .setOrigin(0.5)
          .setDepth(50)
          .setStroke('#000000', 5)
          .setFontStyle('bold italic');
        if (big) t.setShadow(4, 4, '#ff2d55', 0, false, true);
        this.tweens.add({ targets: t, y: p.y - 40, alpha: 0, delay: 300 + k * 90, duration: 900, onComplete: () => t.destroy() });
        if (ev.type === 'damage' && ev.weak && enemy) this.popSticker(p.x + 26, p.y - 46, 'WEAK!', YELLOW, '#000000', -10, k);
        k++;
      } else if (ev.type === 'down') {
        const p = this.posOf(s, ev.uid);
        if (p) this.popSticker(p.x + 12, p.y + 34, 'DOWN', RED, '#ffffff', 8, k++);
      } else if (ev.type === 'rewind') {
        const p = this.posOf(s, ev.uid);
        if (p) this.popSticker(p.x, p.y - 30, `巻き戻し +${ev.amount}`, 0x6dff9e, '#000000', -6, k++);
      } else if (ev.type === 'interrupt') {
        const p = this.posOf(s, ev.uid);
        if (p) this.popSticker(p.x, p.y - 40, '割り込み！', 0xffffff, '#ff2d55', -8, k++);
      } else if (ev.type === 'reveal') {
        const p = this.posOf(s, ev.uid);
        if (p) this.popSticker(p.x, p.y + 52, `弱点判明！ ${ELEMENT_LABEL[ev.element]}`, ELEMENT_COLOR[ev.element], '#000000', -4, k++);
      }
    }
  }

  private popSticker(x: number, y: number, text: string, bg: number, fg: string, angle: number, k: number): void {
    const st = this.sticker(x, y, text, bg, fg, angle, 14, 51).setScale(1.6).setAlpha(0);
    this.tweens.add({ targets: st, scale: 1, alpha: 1, delay: k * 90, duration: 140, ease: 'Back.easeOut' });
    this.tweens.add({ targets: st, alpha: 0, delay: 1000 + k * 90, duration: 250, onComplete: () => st.destroy() });
  }

  private posOf(s: ChainState, uid: string): { x: number; y: number } | null {
    const list = this.shownEnemies(s);
    const ei = list.findIndex((u) => u.uid === uid);
    if (ei >= 0) return { x: (GAME_WIDTH / list.length) * (ei + 0.5), y: ART_Y };
    const part = s.enemies.find((u) => u.uid === uid);
    if (part && chainEnemyDef(s, part.defId)?.part) return this.partSpot(s, part);
    const ai = s.allies.findIndex((u) => u.uid === uid);
    if (ai >= 0) return { x: 8 + ((GAME_WIDTH - 16) / s.allies.length) * ai + 34, y: ALLY_Y + ALLY_H / 2 };
    return null;
  }

  /** 決着の画面：撮った写真・評価の星・早撮りの報酬（調整9：イメージ 3_shutter） */
  private showEnd(): void {
    const s = this.s;
    // 探索から来た戦闘（段階159）：結果を出して報酬を受け取る。見た目は試しの結果画面と同じ（写真・★・決着のマス・報酬の段）
    let encReward: ChainWinReward | null = null;
    if (this.encounter) {
      if (run.battle) setBattleMark(null);
      // ライブラリ（段階167）：会った敵・倒した敵・分かった弱点
      recordChainBattle(s);
      // 敵のスナップ（段階165）：区画を作り直した戦闘だけ。★3 の時に確率で
      const snapRule = CHAIN_AREA_SETUPS[this.areaBattle!.id]
        ? { snaps: CHAIN_ENEMY_SNAPS, rate: CHAIN_ENEMY_SNAP_RATE, owned: run.chainAlbum.owned, copyMax: CHAIN_ALBUM.copyMax, boss: !!this.areaBattle!.boss }
        : undefined;
      const result = chainEncounterResult(s, this.areaBattle!.enemies, this.seed + 7 + (this.encounter.seedShift ?? 0), snapRule);
      if (result.outcome === 'cutoff') {
        this.showCutoff();
        return;
      }
      if (result.outcome === 'victory') encReward = settleChainWin(this.encounter, this.areaBattle!, result, this.lineup!, this.seed);
    }
    const win = s.outcome === 'win';
    const o = this.add.container(0, 0).setDepth(100);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b1020, 0.97).setOrigin(0).setInteractive());
    o.add(this.add.circle(GAME_WIDTH / 2, 260, 240, 0x5a1028, 0.35));
    o.add(this.add.circle(16, 21, 5, RED));
    o.add(addText(this, 25, 21, `REC　ROUND ${String(s.finishRound ?? s.round).padStart(2, '0')} ／ ${s.def.name.replace(/（.*）/, '')}`, { size: 11, bold: true }).setOrigin(0, 0.5));
    const title = addText(this, GAME_WIDTH / 2, 72, !win ? 'GAME OVER' : s.finish === 'shutter' ? 'SHUTTER!!' : 'CLEAR!', { size: 44, bold: true }).setOrigin(0.5).setFontStyle('bold italic').setStroke('#000000', 4);
    title.setShadow(5, 5, '#ff2d55', 0, false, true);
    o.add(title);
    if (!win) {
      o.add(addText(this, GAME_WIDTH / 2, 300, s.finish === 'poi' ? 'ポイが破れた… すくえなかった' : s.finish === 'sunset' ? '日が沈んだ… 坂を上りきれなかった' : s.finish === 'strikeout' ? '三振… 打ち返せなかった' : `${s.finishRound ?? s.round}ラウンド目で倒れた…`, { size: 16, bold: true, color: '#ff9db0' }).setOrigin(0.5));
      if (this.encounter) {
        const keep = [this.encounter.hunt ? '倒した敵・集めた素材は、そのまま' : '倒した敵・開けた宝箱・集めたコマは、そのまま', 'HP・MP は全回復して戻る'];
        o.add(addText(this, GAME_WIDTH / 2, 340, `最後に記録したチェックポイントから、やり直す\n\n${keep.map((t) => `・${t}`).join('\n')}`, { size: 14, align: 'center', color: '#e6e9f5', wrap: GAME_WIDTH - 48, ja: true }).setOrigin(0.5, 0).setLineSpacing(6));
      }
      this.endButtons(o);
      return;
    }
    // 撮った写真（白い枠・日付の焼き込み・テープ）
    const photo: Phaser.GameObjects.GameObject[] = [];
    const pw = 322;
    const ph = 296;
    photo.push(this.add.rectangle(8, 12, pw, ph, 0x000000, 0.6), this.add.rectangle(0, 0, pw, ph, 0xf7f3ea));
    const iw = pw - 24;
    const ih = ph - 64;
    const iy = -ph / 2 + 12 + ih / 2;
    const bg = CHAIN_TRIAL_BG[this.trial];
    if (bg && hasImage(this, bg)) photo.push(this.cropImage(bg, 0, iy, iw, ih).setTint(0xd8b080));
    else photo.push(this.add.rectangle(0, iy, iw, ih, 0x6b4a20));
    const foes = this.shownEnemies(s).filter((e) => !e.gone);
    foes.forEach((e, i) => {
      const fx = -iw / 2 + (iw / foes.length) * (i + 0.5);
      const art = artOfEnemy(e.defId);
      if (art && hasImage(this, art)) {
        const img = this.add.image(fx, iy + 18, art).setTint(0xb8b0a0).setAngle((i - 1) * 8);
        img.setScale(Math.min(96, iw / foes.length - 4) / Math.max(img.width, img.height));
        photo.push(img);
      }
      if (s.finish === 'shutter' && e.hp > 0) photo.push(this.sticker(fx, iy - 50, 'DOWN', RED, '#ffffff', (i - 1) * 7, 12));
    });
    const d = new Date();
    photo.push(addText(this, pw / 2 - 18, ph / 2 - 62, `'${String(d.getFullYear()).slice(2)} ${d.getMonth() + 1} ${d.getDate()}`, { size: 15, bold: true, color: '#ff8a1a' }).setOrigin(1, 0.5));
    photo.push(addText(this, -pw / 2 + 16, ph / 2 - 24, s.finish === 'shutter' ? `${foes.length}体まとめて、はい チーズ。` : '全部倒した。', { size: 17, hand: true, color: '#333333' }).setOrigin(0, 0.5));
    o.add(this.add.container(GAME_WIDTH / 2, 260, photo).setAngle(-4));
    o.add(this.add.rectangle(GAME_WIDTH / 2, 112, 90, 22, YELLOW, 0.75).setAngle(-8));
    // 評価の星と決着の時刻
    const g = chainGrade(s);
    const grade = gradeStars(g);
    const stars = addText(this, GAME_WIDTH / 2, 440, '★'.repeat(grade) + '☆'.repeat(3 - grade), { size: 44, bold: true, color: '#ffd23f' }).setOrigin(0.5).setStroke('#000000', 4);
    o.add(stars);
    this.tweens.add({ targets: stars, scale: { from: 1.6, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    o.add(this.para(50, 470, 290, 36, 0x000000, 1, 10));
    o.add(this.add.rectangle(58, 470, 4, 36, YELLOW).setOrigin(0));
    o.add(addText(this, GAME_WIDTH / 2, 488, `決着 合計 ${s.finishTime} マス（${s.finishRound}ラウンド目）`, { size: 15, bold: true }).setOrigin(0.5));
    // 探索から来た戦闘：受け取った報酬（コマ・星の砂・素材）を、試しの報酬の枠と同じ形で
    if (encReward) {
      const ry = 526;
      o.add(this.para(26, ry + 5, 346, 140, 0x000000, 0.7, 12));
      o.add(this.para(20, ry, 346, 140, g === 'high' ? 0x2b1a00 : 0x141a30, 1, 12, { w: 2, color: g === 'high' ? GOLD : 0x6b7fc0 }));
      o.add(this.sticker(110, ry, g === 'high' ? 'RARE ★★★ 早撮りボーナス' : g === 'mid' ? '★★' : '★', g === 'high' ? GOLD : g === 'mid' ? 0x6bc8ff : 0xc9d0ea, '#2a1300', -4, 11));
      if (encReward.rare) o.add(this.sticker(300, ry + 4, '★ レア！', RED, '#ffffff', 6, 12));
      const lines = `${encReward.koma ? `コマ +${encReward.koma}\n` : ''}星の砂 +${encReward.gained}（合計 ${run.growth.points}）\n${encReward.dropText}`;
      const t = addText(this, 38, ry + 74, lines, { size: 13, bold: true, color: '#ffffff', wrap: 320, ja: true }).setOrigin(0, 0.5).setLineSpacing(4);
      if (t.height > 112) t.setScale(112 / t.height);
      o.add(t);
      if (encReward.rare) playSe(this, SE.chest);
    }
    // 早く終えるほど報酬のレア度が上がる（試しでは表示だけ）
    const reward = g && !this.encounter ? CHAIN_REWARDS[this.trial]?.[g] : undefined;
    if (reward) {
      const ry = 526;
      o.add(this.para(26, ry + 5, 346, 140, 0x000000, 0.7, 12));
      o.add(this.para(20, ry, 346, 140, g === 'high' ? 0x2b1a00 : 0x141a30, 1, 12, { w: 2, color: g === 'high' ? GOLD : 0x6b7fc0 }));
      o.add(this.sticker(110, ry, g === 'high' ? 'RARE ★★★ 早撮りボーナス' : g === 'mid' ? 'RARE ★★' : '★', g === 'high' ? GOLD : g === 'mid' ? 0x6bc8ff : 0xc9d0ea, '#2a1300', -4, 11));
      const who = reward.match(/（(.+?)）/)?.[1];
      const owner = s.enemies.find((e) => e.name === who) ?? s.enemies[0];
      const art = owner ? ENEMY_ART[owner.defId] : undefined;
      const pol: Phaser.GameObjects.GameObject[] = [this.add.rectangle(3, 3, 88, 108, 0x000000, 0.6), this.add.rectangle(0, 0, 88, 108, 0xffffff), this.add.rectangle(0, -9, 76, 76, 0x3a2a18)];
      if (art && hasImage(this, art)) {
        const img = this.add.image(0, -9, art).setTint(g === 'high' ? 0xffd890 : 0xc0c0c0);
        img.setScale(70 / Math.max(img.width, img.height));
        pol.push(img);
      }
      o.add(this.add.container(84, ry + 72, pol).setAngle(-6));
      const name = reward.replace(/（.*）/, '');
      o.add(addText(this, 144, ry + 34, `${name.match(/^[^「]*/)?.[0] ?? ''} GET!`, { size: 13, bold: true, color: g === 'high' ? '#ffcf5a' : '#9ad0ff' }).setOrigin(0, 0.5));
      const t2 = addText(this, 144, ry + 64, name.match(/「.*」/)?.[0] ?? name, { size: 20, bold: true }).setOrigin(0, 0.5);
      if (t2.width > 210) t2.setScale(210 / t2.width);
      o.add(t2);
      o.add(addText(this, 144, ry + 100, g === 'high' ? `${who ?? ''}が持っていた1枚。\n早く決着した時だけ手に入る。` : '早く決着するほど、良い報酬になる。', { size: 10, color: '#e6d7b0' }).setOrigin(0, 0.5));
    }
    // 報酬の段（どこまで届いたか）
    const at = s.def.gradeAt;
    const tiers: { g: string; label: string }[] = this.encounter
      ? [
          { g: 'low', label: '★\n素材' },
          { g: 'mid', label: `★★ ${at?.mid ?? ''}マス以内\n素材` },
          { g: 'high', label: `★★★ ${at?.high ?? ''}マス以内\nレア・敵のスナップ` },
        ]
      : [
          { g: 'low', label: '★\n素材' },
          { g: 'mid', label: `★★ ${at?.mid ?? ''}マス以内\nレア` },
          { g: 'high', label: `★★★ ${at?.high ?? ''}マス以内\n固有スナップ` },
        ];
    tiers.forEach((t, i) => {
      const on = t.g === g;
      const x = 26 + i * 114;
      o.add(this.para(x, 682, 106, 38, on ? GOLD : 0x1a2040, 1, 8));
      o.add(addText(this, x + 53, 701, t.label, { size: 9, bold: true, color: on ? '#2a1300' : '#7f88a8', align: 'center' }).setOrigin(0.5));
    });
    const fled = s.enemies.filter((e) => e.gone && e.trait === 'flee').length;
    if (fled) o.add(addText(this, GAME_WIDTH / 2, 730, `逃げられた敵：${fled}体`, { size: 11, color: '#ff9db0' }).setOrigin(0.5));
    this.endButtons(o);
  }

  /** 負け戦の打ち切り（段階159）：報酬はなく、話の続きへ（見つかったら戻される負け戦はチェックポイントへ） */
  private showCutoff(): void {
    const enc = this.encounter!;
    const def = this.areaBattle!;
    const o = this.add.container(0, 0).setDepth(100);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b1020, 0.97).setOrigin(0).setInteractive());
    const title = addText(this, GAME_WIDTH / 2, 72, '……', { size: 44, bold: true }).setOrigin(0.5).setFontStyle('bold italic').setStroke('#000000', 4);
    o.add(title);
    o.add(addText(this, GAME_WIDTH / 2, 300, `${this.s.enemies[0]?.name ?? ''}の動きが、見えない……${def.cutoffBack ? '\n最後に記録したチェックポイントへ戻される' : ''}`, { size: 15, align: 'center', color: '#e6e9f5', wrap: GAME_WIDTH - 48, ja: true }).setOrigin(0.5));
    const to = def.cutoffBack ? enc.lose : enc.win;
    this.slantButton(GAME_WIDTH / 2 - 130, 744, 260, 46, def.cutoffBack ? 'チェックポイントへ' : '次へ ▶', () => this.scene.start(to.key, to.data), { into: o, go: true, size: 15 });
  }

  private endButtons(o: Phaser.GameObjects.Container): void {
    // 探索から来た戦闘：勝てば探索へ、負ければチェックポイントへ（もう一度・次の試しは出さない）
    if (this.encounter) {
      const win = this.s.outcome === 'win';
      const to = win ? this.encounter.win : this.encounter.lose;
      this.slantButton(GAME_WIDTH / 2 - 130, 744, 260, 46, win ? '探索へ戻る ▶' : 'チェックポイントへ', () => this.scene.start(to.key, to.data), { into: o, go: true, size: 15 });
      return;
    }
    const idx = CHAIN_TRIALS.findIndex((t) => t.id === this.trial);
    const next = CHAIN_TRIALS[(idx + 1) % CHAIN_TRIALS.length];
    this.slantButton(8, 744, 150, 46, 'もう一度', () => this.scene.restart({ trial: this.trial, stage: this.stage }), { into: o, size: 14 });
    this.slantButton(168, 744, 214, 46, `次：${next.name.replace(/（.*）/, '')} ▶`, () => this.scene.restart({ trial: next.id, stage: this.stage }), { into: o, go: true, size: 13 });
    const back = addText(this, GAME_WIDTH / 2, 808, 'タイトルへ', { size: 12, color: '#9aa3c0' }).setOrigin(0.5);
    o.add(back);
    o.add(this.add.rectangle(GAME_WIDTH / 2, 808, 120, 28, 0xffffff, 0.001));
    makePressable(o.list[o.list.length - 1] as Phaser.GameObjects.Rectangle, { onTap: () => this.scene.start('Title') });
  }
}

/** 分かった弱点を読む（試しの戦闘の間だけ使う。読めなければ空） */

/** 評価の段を星の数に（高3・中2・低1） */
function gradeStars(g: string | null): number {
  return g === 'high' ? 3 : g === 'mid' ? 2 : g === 'low' ? 1 : 0;
}

/** ラウンドの終わりのコマ（時限・ヒート） */
function isRoundEnd(key: string): boolean {
  return key.startsWith('end:') || key.startsWith('burn:') || key.startsWith('rewind:');
}

function sameSource(a: ChainSource, b: ChainSource): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'card' && b.kind === 'card') return a.index === b.index;
  if (a.kind === 'move' && b.kind === 'move') return a.moveId === b.moveId;
  if (a.kind === 'link' && b.kind === 'link') return a.linkId === b.linkId;
  return false;
}

/** そのコマで起きたことを、1〜2行で */
function describe(f: ChainFrame, before: ChainState): string {
  const name = (uid: string) => (findChainUnit(f.state, uid) ?? findChainUnit(before, uid))?.name.replace('ノイズ', '') ?? uid;
  const parts: string[] = [];
  for (const ev of f.events) {
    if (ev.type === 'act') continue;
    else if (ev.type === 'cancel') parts.push(ev.reason === 'down' ? `${name(ev.uid)}はダウンしていて、${f.name}は起きなかった` : ev.reason === 'time' ? `${name(ev.uid)}は時間切れで動けなかった` : ev.reason === 'interrupted' ? `${name(ev.uid)}の${f.name}は、敵に邪魔されて不発（札は手札に戻った）` : `${name(ev.uid)}は倒れていて動けない`);
    else if (ev.type === 'addon') parts.push(`＋${ev.names.join('＋')}`);
    else if (ev.type === 'exposure') parts.push(`露出補正：この後の攻撃は1発ごとに+${ev.total}`);
    else if (ev.type === 'damage') parts.push(`${name(ev.to)}に${ev.amount}${ev.weak ? '（弱点）' : ev.resist ? '（耐性）' : ''}`);
    else if (ev.type === 'heal') parts.push(`${name(ev.to)}+${ev.amount}`);
    else if (ev.type === 'trick') parts.push(`${name(ev.to)}に「${TRICK_LABEL[ev.trick]}」を付与`);
    else if (ev.type === 'trickUse') parts.push(ev.trick === 'spread' ? `パノラマ！${ev.to?.length ? `${ev.to.map(name).join('・')}にも広がる` : '（ほかに敵がいない）'}` : ev.trick === 'expose' ? 'ハイライト！ 弱点になった' : 'ピンポイント！ フィニッシュが2倍');
    else if (ev.type === 'status') parts.push(`${name(ev.to)}に${STATUS_LABEL[ev.status]}（${ev.left}ラウンド）`);
    else if (ev.type === 'burn') parts.push(`${name(ev.uid)}にヒートで${ev.amount}`);
    else if (ev.type === 'drain') parts.push(`${name(ev.to)}がリワインドで${ev.amount}回復`);
    else if (ev.type === 'pop') parts.push(`${name(ev.uid)}がはじけた！`);
    else if (ev.type === 'cover') parts.push(`${name(ev.shield)}が盾になって受けた！`);
    else if (ev.type === 'shellBreak') parts.push(`${name(ev.uid)}の殻が割れた（効かなかった）`);
    else if (ev.type === 'push') parts.push(!ev.moved ? '' : ev.out ? `${name(ev.uid)}の予定をラウンドの外へ押し出した！` : `${name(ev.uid)}の予定を${ev.by}マス押した`);
    else if (ev.type === 'sticky') parts.push(`ねばねば！ まだ動いていない仲間が${ev.delay}遅れる`);
    else if (ev.type === 'revive') parts.push(`${name(ev.to)}が起き上がった！（HP ${ev.amount}）`);
    else if (ev.type === 'mpGain') parts.push(`${name(ev.to)}の MP +${ev.amount}`);
    else if (ev.type === 'frameCut') parts.push(`切り取り！ ${name(ev.to)}の「${ev.name}」が抜き取られた（札は手札に戻る）`);
    else if (ev.type === 'hitBack') parts.push(`打ち返した！（${ev.name}が消えて、威力2倍）`);
    else if (ev.type === 'strike') parts.push(`ストライク！（${ev.total}つ目）`);
    else if (ev.type === 'clap') parts.push(`手拍子！（${ev.total}）`);
    else if (ev.type === 'chorus') parts.push(`客席が歌い出した！${ev.uid ? ` ${name(ev.uid)}の手が止まる` : ''}`);
    else if (ev.type === 'teeth') parts.push(`歯がそろった！ ${name(ev.uid)}の手が止まる`);
    else if (ev.type === 'sync') parts.push(`${ev.uids.map(name).join('と')}が息を合わせた！`);
    else if (ev.type === 'sunset') parts.push(ev.synced ? `息を合わせて、日が持ちこたえた（あと${ev.left}ラウンド）` : ev.left > 0 ? `日が傾いた…（あと${ev.left}ラウンド）` : '日が沈んだ…');
    else if (ev.type === 'allyRiposteReady') parts.push(`${name(ev.uid)}が反撃の構え`);
    else if (ev.type === 'allyRiposte') parts.push(`${name(ev.uid)}が${name(ev.to)}にやり返した！`);
    else if (ev.type === 'allyArmor') parts.push(`${name(ev.uid)}が守りを固めた（${[ev.armor ? `受けるダメージ −${Math.round(ev.armor * 100)}%` : '', ev.wall ? `攻撃を${ev.wall}回まで消す` : ''].filter(Boolean).join('・')}）`);
    else if (ev.type === 'allyWall') parts.push(`珠の壁が攻撃を消した！（あと${ev.left}回）`);
    else if (ev.type === 'allyGuard') parts.push(`${name(ev.uid)}が盾の構え（ラウンドの終わりまで、仲間をかばう）`);
    else if (ev.type === 'allyCover') parts.push(`${name(ev.uid)}が${name(ev.for)}をかばった！`);
    else if (ev.type === 'haste') parts.push(`この後の仲間が${ev.by}マス早まる！`);
    else if (ev.type === 'scatter') parts.push(`欠片が${ev.to.map(name).join('・')}に散った！`);
    else if (ev.type === 'blast') parts.push(`非常ベル！ ${ev.to.map(name).join('・')}に鳴り響く`);
    else if (ev.type === 'wake') parts.push(`${name(ev.uid)}が${ev.woke.map(name).join('・')}を起こした！`);
    else if (ev.type === 'counter') parts.push(`${name(ev.uid)}の反撃！`);
    else if (ev.type === 'split') parts.push(`${name(ev.uid)}が2つに分かれた！`);
    else if (ev.type === 'timerTick') parts.push(ev.left > 0 ? `${name(ev.uid)}：爆発まで あと${ev.left}` : '');
    else if (ev.type === 'timerBlast') parts.push(`${name(ev.uid)}が大爆発！`);
    else if (ev.type === 'flee') parts.push(`${name(ev.uid)}が逃げた！`);
    else if (ev.type === 'down') parts.push(`${name(ev.uid)}ダウン`);
    else if (ev.type === 'handDraw') parts.push(ev.kind === 'draw' ? `スナップを${ev.count}枚引いた（次のラウンドの手札に）` : ev.kind === 'cycle' ? `手札を${ev.count}枚引き直した` : ev.count ? '使ったスナップを1枚、手札に戻した' : '戻すスナップがなかった');
    else if (ev.type === 'guarded') parts.push(`${name(ev.uid)}は${guardLabel(ev.left)}中（ダウンしない）`);
    else if (ev.type === 'defeat') parts.push(`${name(ev.uid)}を倒した`);
    else if (ev.type === 'fizzle') parts.push('直前の攻撃がなくて不発');
    else if (ev.type === 'link') parts.push(`連携技「${ev.name}」！`);
    else if (ev.type === 'shutterReady') parts.push('全員ダウン！');
    else if (ev.type === 'shutterShot') parts.push('シャッターで総攻撃！');
    else if (ev.type === 'interrupt') parts.push(`${name(ev.uid)}が割り込んだ！`);
    else if (ev.type === 'unveil') parts.push(`${name(ev.uid)}の予定が見えた`);
    else if (ev.type === 'rewind') parts.push(`${name(ev.uid)}が巻き戻しで${ev.amount}回復`);
    else if (ev.type === 'panic') parts.push(`リーダーを倒した！ ${ev.downed.map(name).join('・')}が動揺してダウン`);
    else if (ev.type === 'reveal') parts.push(`弱点判明！ ${name(ev.uid)}は${ELEMENT_LABEL[ev.element]}に弱い`);
    else if (ev.type === 'partBreak') parts.push(`${name(ev.uid)}を壊した！ それを使う大技はもう来ない${ev.reveals.length ? `。${name(ev.of)}の弱点「${ev.reveals.map((w) => ELEMENT_LABEL[w]).join('・')}」が見えた` : ''}`);
    else if (ev.type === 'poi') parts.push(ev.left > 0 ? `ポイが濡れた（残り${ev.left}）` : 'ポイが破れた！');
  }
  const out = parts.filter(Boolean);
  return out.length ? out.join(' ') : '（何も起きなかった）';
}
