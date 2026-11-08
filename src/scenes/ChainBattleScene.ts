import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  availableLinks,
  chainEnemyDef,
  chainMoveOf,
  chainOrder,
  chainPlanError,
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
import { AKARI, AREA_BATTLES, HERO, MIO, ALLY_FACE, CHAIN17_CARD_ART, CHAIN17_COMBO_HINT, CHAIN17_MOVE_ART, CHAIN17_SHORT_TEXT, CHAIN_CARD_ART as CHAIN_CARD_ART_16, CHAIN_MOVE_ART as CHAIN_MOVE_ART_16, CHAIN_REWARDS, CHAIN_RULES, CHAIN_SHORT_TEXT as CHAIN_SHORT_TEXT_16, CHAIN_TRAIT_TEXT, CHAIN_TRIAL_BG, CHAIN_TRIALS, chainTrialDef, type ChainStage, ENEMY_ART, FACE_CROP, FACE_CROPS, SE } from '../data';
import { buildMainChainBattle, type ChainBattleDef, type CharacterDef, type Element } from '../core';
import { currentParty, partyChoice } from './run';
import { browserStorage } from '../save/storage';
import { hasImage } from '../assets/loader';
import { playSe } from '../audio/sound';
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
}

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
/** 下のボタンの上の端（右下のビルド日時の上に収める） */
const CMD_Y = 778;
/** 実行中、再生位置が1マス進む時間（ms） */
const TICK_MS = 140;
/** 実行中の待ち時間（ms）：誰が・何をの帯 → 結果 → 次へ（調整4で、半分以下に縮めた） */
const WAIT = { announce: 350, result: 750, big: 1100, cancel: 600, end: 150 } as const;
/** 分かった弱点を、試しの戦闘をまたいで覚えておく所（セーブとは別。調整9） */
const KNOWN_KEY = 'hourglass.chainTrial.knownWeak';

/** 札・技の絵と短い効果（調整17の札も） */
const CHAIN_CARD_ART: Record<string, string> = { ...CHAIN_CARD_ART_16, ...CHAIN17_CARD_ART };
const CHAIN_MOVE_ART: Record<string, string> = { ...CHAIN_MOVE_ART_16, ...CHAIN17_MOVE_ART };
const CHAIN_SHORT_TEXT: Record<string, string> = { ...CHAIN_SHORT_TEXT_16, ...CHAIN17_SHORT_TEXT };
/** 見つけたコンボ（調整17。端末に覚える） */
const COMBO_KEY = 'hourglass.chainTrial.combos';
function loadCombos(): string[] {
  try {
    const raw = browserStorage().read(COMBO_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function saveCombos(ids: string[]): void {
  try {
    browserStorage().write(COMBO_KEY, JSON.stringify(ids));
  } catch {
    // 覚えられなくても遊べる
  }
}
const RED = 0xff2d55;
const YELLOW = 0xffd23f;
const GOLD = 0xffcf5a;
/** 札の分類（調整11：よくあるゲームの言葉で3つに。付与系もサポート。調整13：専用の札は「スペシャル」に分ける） */
/** 分類の名前（2026-11-07：映像の言葉に。アタック＋回復 → アクション、サポート → エフェクト、フィニッシュ → クライマックス） */
const CATEGORY_LABEL: Record<ChainCardCategory, string> = { attack: 'アクション', support: 'エフェクト', finish: 'クライマックス', special: 'スペシャル', link: 'コンボ' };
const CATEGORY_COLOR: Record<ChainCardCategory, number> = { attack: 0x3a8dff, support: 0x19b37a, finish: RED, special: 0xff8a1f, link: GOLD };
/** 敵に付いた効果のシールの色（一度で消える物は紫、ラウンドの間続く物は青緑） */
const CHIP_ONCE = 0xb36bff;
const CHIP_LASTING = 0x19d3c5;
/** フォーカスの名前（敵の上に「◎」付きで出す。次の攻撃で使い切る。調整8で写真の言葉に） */
const TRICK_LABEL: Record<ChainTrick, string> = { spread: 'パノラマ', expose: 'ハイライト', opening: 'ピンポイント' };
/** フィルターの名前（敵の上に、残りのラウンドと出す） */
const STATUS_LABEL: Record<ChainStatusKind, string> = { slow: 'スロー', burn: 'ヒート', stack: 'クラック', weak: 'ピンぼけ', seal: 'ポーズ', confuse: 'ハレーション', drain: 'リワインド' };
/** 分裂で出てきた敵の絵（元の敵の絵を小さく使う） */
const SPLIT_ART: Record<string, string> = { miniBalloon: 'balloonNoise' };

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
  private runResults = new Map<number, string>();
  /** 実行中：今のコマの番号（0 は実行していない） */
  private currentOrder = 0;
  /** 実行中：今動いている者と、ねらわれた相手（光らせる） */
  private actorUid = '';
  private targetUid = '';
  /** 実行中：タップで次へ進める（待ちを飛ばす） */
  private advance: (() => void) | null = null;

  constructor() {
    super('ChainBattle');
  }

  create(data: ChainBattleData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f22).setOrigin(0);
    this.trial = data.trial;
    this.stage = data.stage ?? 'mid';
    const def = data.main ? mainTrialDef() : chainTrialDef(data.trial, this.stage);
    this.s = createChainBattle(def, CHAIN_RULES, data.seed ?? Date.now() % 100000, loadKnown());
    this.root = this.add.container(0, 0);
    this.plan = [];
    this.pending = null;
    this.tab = 'cards';
    this.busy = false;
    this.head = null;
    this.ally = this.firstFreeAlly();
    this.runFrames = [];
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
    const ids = [CHAIN_TRIAL_BG[def.id], ...def.enemies.map((e) => ENEMY_ART[e.id]), ...def.allies.map((a) => ALLY_FACE[a.id]), ...Object.values(CHAIN_CARD_ART), ...Object.values(CHAIN_MOVE_ART)].filter((x): x is string => !!x);
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
    this.drawMessage();
    this.drawFilm(view);
    this.drawAllies(view);
    if (!this.busy && view.outcome === 'ongoing' && !view.shutter) {
      this.drawTabs();
      this.drawOptions();
      this.drawCommands();
    } else if (this.currentOrder > 0) this.drawRunList();
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
    const round = addText(this, 58, 21, `ROUND ${String(view.round).padStart(2, '0')}`, { size: 22, bold: true }).setOrigin(0, 0.5).setFontStyle('bold italic');
    round.setShadow(3, 3, '#ff2d55', 0, false, true);
    r.add(round);
    const name = `${this.stage === 'early' ? '序盤：' : this.stage === 'multi' ? '連続：' : ''}${this.s.def.name.replace(/（.*）/, '')}${view.variant ? ` ／ ${view.variant}` : ''}`;
    const t = addText(this, GAME_WIDTH - 18, 21, name, { size: 10, bold: true }).setOrigin(1, 0.5);
    const room = GAME_WIDTH - 190;
    if (t.width > room) t.setScale(room / t.width);
    r.add(this.para(GAME_WIDTH - 28 - t.displayWidth, 10, t.displayWidth + 20, 22, RED, 1, 8));
    r.add(t);
  }

  /** 敵の場の下の、案内の帯 */
  private drawMessage(): void {
    const r = this.root;
    // 敵の HP の帯の下から、フィルムの上まで（3行まで読める大きさ。それより長い時だけ縮める）
    r.add(this.add.rectangle(0, MSG_TOP, GAME_WIDTH, MSG_H, 0x05060a, 0.86).setOrigin(0));
    r.add(this.add.rectangle(0, MSG_TOP, 4, MSG_H, RED).setOrigin(0));
    const t = addText(this, 12, MSG_TOP + MSG_H / 2, this.message, { size: 12, wrap: GAME_WIDTH - 24, ja: true }).setOrigin(0, 0.5);
    if (t.height > MSG_H - 6) t.setScale((MSG_H - 6) / t.height);
    r.add(t);
  }

  /** コマを1行の言葉で（「ハルト：斬る → 金魚」） */
  private frameLabel(f: ChainFrame): string {
    const nm = (uid?: string) => (uid ? ((findChainUnit(f.state, uid) ?? findChainUnit(this.s, uid))?.name.replace('ノイズ', '') ?? '') : '');
    const link = f.events.find((e) => e.type === 'link') as { uids: string[] } | undefined;
    const who = link ? link.uids.map(nm).join('＋') : nm(f.uid);
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

  /** 画面に出す敵（分裂して倒れた元の敵は出さない） */
  private shownEnemies(s: ChainState): ChainUnit[] {
    return s.enemies.filter((e) => !(e.hp <= 0 && e.trait === 'split' && s.enemies.some((x) => x.uid.startsWith(e.uid) && x.uid !== e.uid)));
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
      const x0 = colW * i;
      const alive = e.hp > 0 && !e.gone;
      const size = Math.min(100, colW - 20) * (SPLIT_ART[e.defId] ? 0.7 : 1);
      const isTarget = this.pending?.move.target === 'enemy' && alive;
      if (this.busy && e.uid === this.actorUid) r.add(this.add.rectangle(cx, STAGE_Y + 126, colW - 6, 236, RED, 0.12).setStrokeStyle(3, RED));
      if (this.busy && e.uid === this.targetUid) r.add(this.add.rectangle(cx, STAGE_Y + 126, colW - 6, 236, YELLOW, 0.08).setStrokeStyle(3, YELLOW));
      if (isTarget) {
        const sel = this.add.rectangle(cx, STAGE_Y + 126, colW - 6, 236, 0xffffff, 0.05).setStrokeStyle(2, YELLOW);
        this.tweens.add({ targets: sel, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
        r.add(sel);
      }
      // 敵の後ろの赤い光
      if (alive) r.add(this.add.circle(cx, ART_Y, size * 0.55, 0xff3040, 0.18));
      const art = ENEMY_ART[SPLIT_ART[e.defId] ?? e.defId];
      if (art && hasImage(this, art)) {
        const img = this.add.image(cx, ART_Y, art);
        img.setScale(size / Math.max(img.width, img.height));
        if (!alive) img.setAlpha(0.15).setTint(0x606060);
        else if (e.down) img.setAngle(-14).setTint(0xb0b0ff);
        r.add(img);
        this.enemyImages.set(e.uid, img);
      } else r.add(this.add.circle(cx, ART_Y, size / 2.4, COLORS.enemy, alive ? 1 : 0.2));
      // 名前・弱点（分かるまで「？」。調整9）・HP
      const ny = STAGE_Y + 172;
      const name = addText(this, x0 + 8, ny, e.name, { size: 12, bold: true, color: alive ? '#ffffff' : COLORS.dimText }).setOrigin(0, 0.5).setStroke('#000000', 3);
      const nameRoom = colW - 36;
      if (name.width > nameRoom) name.setScale(nameRoom / name.width);
      r.add(name);
      // 属性チェンジの敵は、今の弱点がいつも見える（調整12）
      const known = e.trait === 'shift' ? e.weak : e.weak.filter((w) => isWeakKnown(s, e.defId, w));
      const wx = x0 + colW - 16;
      if (known.length) {
        known.slice(0, 2).forEach((w, k) => {
          r.add(this.add.circle(wx - k * 20, ny, 10, ELEMENT_COLOR[w]).setStrokeStyle(2, 0xffffff));
          r.add(addText(this, wx - k * 20, ny, ELEMENT_LABEL[w].slice(0, 1), { size: 10, bold: true, color: '#101010' }).setOrigin(0.5));
        });
      } else {
        r.add(this.add.circle(wx, ny, 10, 0x2a3050).setStrokeStyle(2, 0x9aa3c0));
        r.add(addText(this, wx, ny, '？', { size: 11, bold: true, color: '#c9d0ea' }).setOrigin(0.5));
      }
      const bw = colW - 18;
      r.add(this.para(x0 + 8, ny + 13, bw, 7, 0x2a0a12, 1, 3));
      if (e.hp > 0) r.add(this.para(x0 + 8, ny + 13, Math.max(6, bw * (e.hp / e.maxHp)), 7, RED, 1, 3));
      // 特徴：黄色の傾いたシール
      if (e.trait) {
        const t = CHAIN_TRAIT_TEXT[e.trait];
        const extra = e.trait === 'timer' && alive ? ` あと${e.timer}` : e.trait === 'shell' && alive ? (e.shell ? '' : '（割れた）') : '';
        r.add(this.sticker(x0 + 30, STAGE_Y + 56, t.name + extra, e.trait === 'timer' ? 0xff8a5a : YELLOW, '#000000', -8, 10));
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
        const cy = STAGE_Y + 206 + k * 19;
        const t = addText(this, x0 + 14, cy, c.text, { size: 10, bold: true, color: c.planned ? '#ffffff' : '#06201e' }).setOrigin(0, 0.5);
        if (t.width > colW - 24) t.setScale((colW - 24) / t.width);
        const box = this.add.rectangle(x0 + 8, cy, t.displayWidth + 12, 16, c.color, c.planned ? 0.25 : 1).setOrigin(0, 0.5).setAngle(k === 0 ? -2 : 2);
        if (c.planned) box.setStrokeStyle(1.5, c.color);
        else if (c.color === CHIP_ONCE) t.setColor('#ffffff');
        r.add(box);
        r.add(t);
      });
      if (e.down) r.add(this.sticker(cx + 10, ART_Y + 30, 'DOWN', RED, '#ffffff', 8, 14));
      // 予定：黒い斜めの札に、赤い丸の時刻（大技・全体・逃げるは黄色）。すばやい敵は2つの時刻
      const intents = s.intents.filter((it) => it.enemy === e.uid);
      if (intents.length) {
        const it = intents[0];
        const tgt = it.target ? findChainUnit(s, it.target)?.name : '';
        const foe = it.confused ? findChainUnit(s, it.confused)?.name.replace('ノイズ', '') : '';
        const big = it.move.all || it.move.flee || it.move.power >= CHAIN_RULES.sealBig;
        const veiled = !!e.veiled;
        const detail = veiled ? '予定が見えない' : it.move.flee ? '逃げる' : `${it.move.all ? '全体' : foe ? `→ ${foe}（ハレーション）` : `→ ${tgt}`} ${it.move.power}`;
        const px = x0 + 12;
        const pw = colW - 18;
        const a = e.down ? 0.35 : 1;
        r.add(this.para(px + 3, STAGE_Y + 9, pw, 34, RED, 0.45 * a, 8));
        r.add(this.para(px, STAGE_Y + 6, pw, 34, big ? 0x3a0010 : 0x000000, a, 8));
        r.add(this.add.rectangle(px + 4, STAGE_Y + 6, 4, 34, big ? YELLOW : RED, a).setOrigin(0));
        const times = veiled ? '？' : intents.map((x) => x.at).join('・');
        r.add(this.add.circle(px + 2, STAGE_Y + 23, 14, big ? YELLOW : RED, a));
        r.add(addText(this, px + 2, STAGE_Y + 23, times, { size: times.length > 2 ? 10 : 15, bold: true, color: big ? '#000000' : '#ffffff' }).setOrigin(0.5).setAlpha(a));
        const t1 = addText(this, px + 20, STAGE_Y + 15, veiled ? '？？？' : it.move.name, { size: 11, bold: true }).setOrigin(0, 0.5).setAlpha(a);
        const t2 = addText(this, px + 20, STAGE_Y + 31, detail, { size: 9, bold: true, color: big ? '#ffe08a' : '#ff9db0' }).setOrigin(0, 0.5).setAlpha(a);
        for (const t of [t1, t2]) if (t.width > pw - 26) t.setScale((pw - 26) / t.width);
        r.add([t1, t2]);
      }
      const hit = this.add.rectangle(cx, STAGE_Y + 120, colW - 4, 220, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, {
        onTap: () => this.pickEnemy(e.uid),
        onLongPress: () => this.explainEnemy(e),
      });
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
    for (let t = 0; t <= len; t++) {
      r.add(this.add.rectangle(x0 + CELL * t, top + 26, 1, FILM_H - 38, 0x8a93ad, 0.12).setOrigin(0.5, 0));
      r.add(addText(this, x0 + CELL * t, top + 13, String(t), { size: 10, bold: true, color: '#8a93ad' }).setOrigin(0.5, 0));
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
      const cx = x0 + CELL * it.at + row * 7;
      const cy = FOE_TRACK + row * 6 - (slots[it.at] > 1 ? 3 : 0);
      const big = it.move.all || it.move.flee || it.move.power >= CHAIN_RULES.sealBig;
      const a = e.down ? 0.3 : 1;
      if (big && !e.down) r.add(this.add.circle(cx, cy, 16, YELLOW, 0.25));
      r.add(this.add.circle(cx, cy, 13, 0x1a0008, a).setStrokeStyle(2, big ? YELLOW : RED));
      const art = ENEMY_ART[SPLIT_ART[e.defId] ?? e.defId];
      if (art && hasImage(this, art)) {
        const img = this.add.image(cx, cy, art).setAlpha(a);
        img.setScale(22 / Math.max(img.width, img.height));
        r.add(img);
      }
      if (e.down) r.add(addText(this, cx, cy, '×', { size: 22, bold: true, color: '#ff2d55' }).setOrigin(0.5));
      badge(cx - 12, cy - 11, numOf(`e${k}`));
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
      const art = this.artOfStep(step);
      if (art && hasImage(this, art)) this.tileArt(art, bx, CLIP_TOP + 5, bw, CLIP_H - 5);
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
  private artOfStep(step: ChainPlanStep): string | undefined {
    const src = step.source;
    if (src.kind === 'card') return CHAIN_CARD_ART[this.s.hand[src.index]];
    if (src.kind === 'move') return CHAIN_MOVE_ART[src.moveId];
    const link = this.s.def.links.find((l) => l.id === src.linkId);
    return link ? CHAIN_MOVE_ART[link.move.id] : undefined;
  }

  private drawAllies(s: ChainState): void {
    const r = this.root;
    const colW = (GAME_WIDTH - 16) / s.allies.length;
    const starts = planStarts(this.s, this.plan);
    const order = chainOrder(this.s, this.plan);
    const used = (this.plan.length ? starts[starts.length - 1] + (chainMoveOf(this.s, this.plan[this.plan.length - 1])?.weight ?? 0) : 0);
    s.allies.forEach((u, i) => {
      const x = 8 + colW * i;
      const w = colW - 8;
      const color = ALLY_COLOR[u.defId] ?? COLORS.ally;
      const planned = this.plan.findIndex((p) => stepAllies(this.s, p).includes(u.uid));
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
      r.add(addText(this, x + 62, ALLY_Y + 38, `HP ${u.hp}/${u.maxHp}${u.maxMp ? `　MP ${u.mp ?? 0}/${u.maxMp}` : ''}`, { size: 9, color: '#9aa3c0' }).setOrigin(0, 0.5));
      const turn = planned >= 0 ? order.findIndex((o) => o.kind === 'ally' && o.i === planned) + 1 : 0;
      const times = this.plan.filter((p) => stepAllies(this.s, p).includes(u.uid)).length;
      const multi = !!this.s.def.multiAct;
      const state = u.hp <= 0 ? '倒れている' : multi ? (sel ? `選択中・時刻${used}から${times ? `（${times}回）` : ''}` : times ? `${times}回` : '') : planned >= 0 ? `${turn}番目に動く（時刻${starts[planned]}から）` : sel ? `選択中・時刻${used}から` : '';
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
      { label: '？', on: false, w: 40, tap: () => this.showRules() },
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
    r.add(addText(this, GAME_WIDTH - 10, TAB_Y - 2, name ? `${name}の行動` : '全員並べた', { size: 11, bold: true, color: '#ffd23f' }).setOrigin(1, 0.5));
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
      const who = x.link.members.map((m) => this.allyName(m)).join('＋');
      // 初めてそろったコンボは「NEW」（調整17：レシピは最初は見えず、そろうと分かる）
      const found = loadCombos();
      const fresh = !!s.def.finishLast && !found.includes(x.link.id);
      if (fresh) saveCombos([...found, x.link.id]);
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
    const top = links.length ? LINK_Y + 42 : LINK_Y + 4;
    const step = (GAME_WIDTH - 8) / 5;
    // コンボの帯から、材料の札の上の端へ線を引く（札の下に描く。選んだコンボは太く）
    if (this.tab === 'cards' && linkSpots.length) {
      const g = this.add.graphics();
      linkSpots.forEach((sp, k) => {
        const n = sp.cards.length;
        sp.cards.forEach((idx, j) => {
          const shownAt = shown.findIndex((it) => it.source.kind === 'card' && it.source.index === idx);
          if (shownAt < 0) return;
          const fromX = sp.x + (sp.w * (j + 1)) / (n + 1);
          const toX = 4 + step * shownAt + step / 2;
          const color = k % 2 === 0 ? GOLD : 0xffffff;
          g.lineStyle(sp.sel ? 4 : 2.5, color, sp.sel ? 1 : 0.85);
          g.lineBetween(fromX, LINK_Y + 30, toX, top - 6);
          g.fillStyle(color, 1);
          g.fillCircle(fromX, LINK_Y + 30, 3.5);
          g.fillCircle(toX, top - 6, 4);
        });
      });
      r.add(g);
    }
    const linkedIdx = new Set(this.tab === 'cards' ? linkSpots.flatMap((sp) => sp.cards) : []);
    shown.forEach((it, i) => {
      const cx = 4 + step * i + step / 2;
      const sel = !!this.pending && sameSource(this.pending.source, it.source);
      const cy = top + CARD_H / 2 - (sel ? 10 : 0);
      // コンボの材料の札は、後ろを金色に光らせる
      if (it.source.kind === 'card' && linkedIdx.has(it.source.index)) r.add(this.add.rectangle(cx, cy, CARD_W + 16, CARD_H + 16, GOLD, 0.55));
      this.drawCard(cx, cy, it, (i - (shown.length - 1) / 2) * 2.5, sel, !!it.move.owner && me?.defId !== it.move.owner);
      const hit = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0xffffff, 0.001);
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
  private drawCard(cx: number, cy: number, it: { move: ChainMove; art?: string; used?: boolean; added?: boolean; key?: string }, angle: number, sel: boolean, notMine: boolean): void {
    const m = it.move;
    const color = CATEGORY_COLOR[chainCardCategory(m)];
    const parts: Phaser.GameObjects.GameObject[] = [];
    const w = CARD_W;
    const h = CARD_H;
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
      const ef = addText(this, 0, -h / 2 + 130, short, { size: 9, bold: true, color: '#4a4a4a', align: 'center', wrap: w - 6, ja: true }).setOrigin(0.5);
      if (ef.width > w - 4) ef.setScale((w - 4) / ef.width);
      if (ef.displayHeight > 26) ef.setScale(Math.min(ef.scaleX, 26 / ef.height));
      parts.push(ef);
    }
    // 名前は1行に縮めて収める。縮めすぎる時だけ2行に
    let title = addText(this, 0, -h / 2 + 100, m.name, { size: 12, bold: true, color: '#111111' }).setOrigin(0.5);
    if (title.width > w - 6) {
      if ((w - 6) / title.width >= 0.72) title.setScale((w - 6) / title.width);
      else {
        title.destroy();
        title = addText(this, 0, -h / 2 + 100, m.name, { size: 12, bold: true, color: '#111111', align: 'center', wrap: w - 4, ja: true }).setOrigin(0.5);
        if (title.height > 26) title.setScale(26 / title.height);
      }
    }
    parts.push(title);
    for (let k = 0; k < 4; k++) parts.push(this.add.rectangle(-w / 2 + 10 + k * 11, h / 2 - 16, 8, 8, k < m.weight ? 0x111111 : 0xcccccc).setAngle(-12));
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

  /** 決まりの早見（「？」で案内の帯に出す。調整5で、常に出す早見をやめた） */
  private showRules(): void {
    if (this.s.def.finishLast) {
      const found = loadCombos();
      const all = this.s.def.links;
      const names = all.filter((l) => found.includes(l.id)).map((l) => l.move.name);
      const hints = all.filter((l) => !found.includes(l.id)).slice(0, 2).map((l) => `？？？（${CHAIN17_COMBO_HINT[l.id] ?? ''}）`);
      this.message = `アクション（攻撃・回復）と技を時間の帯に並べ、エフェクトは直前に並べた行動に添える（時間を使わない・2枚まで・もう一度タップで外す。帯の上の行動をタップすると添える先を選べる）。連続攻撃は全段当たる。長回しは帯の幅の中に敵の行動が来ると不発。クライマックスとコンボは最後の行動だけ（添えられない）／見つけたコンボ ${names.length}/${all.length}：${names.join('・') || 'まだない'}${hints.length ? `　${hints.join('　')}` : ''}`;
      this.render();
      return;
    }
    this.message = `札は4種類：アタック（ダメージ）・サポート（敵に効果を付与）・フィニッシュ（とどめ）・スペシャル（顔の仲間だけが使える。2人の札がそろうと連携技）。敵を全員ダウンさせるとシャッター：押すと敵みんなに最大HPの${Math.round(CHAIN_RULES.shutterRate * 10)}割の総攻撃（倒し切れなければ、そのラウンドはそこで終わる）。紫の効果は次の攻撃で消え、青緑の効果は右下のラウンド数だけ続く（R＝ラウンド）／弱点は「？」。その属性で当てると判明し、次の戦闘でも見える／敵を長押しで特徴と行動`;
    this.render();
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
    if (move.owner && source.kind === 'card' && findChainUnit(this.s, actor)?.defId !== move.owner) {
      this.message = `${move.name}は${this.allyName(move.owner)}の専用の札。${this.allyName(move.owner)}を選んでから使う`;
      this.render();
      return;
    }
    // 敵1体を選ばない札・技は、1回のタップで並べる（調整4。説明は長押しと、並べた後の案内で）
    if (move.target !== 'enemy') {
      this.place({ ally: actor, source });
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
      this.message = `${move.name}はエフェクト。先に行動を並べてから、タップして添える（帯の上の行動をタップすると、添える先を選べる）`;
      this.render();
      return;
    }
    const mine = (step.addons ?? []).includes(index);
    const next: ChainPlanStep = { ...step, addons: mine ? (step.addons ?? []).filter((a) => a !== index) : [...(step.addons ?? []), index] };
    // ほかの行で使う札は添えられない（前の行は chainPlanError が、後ろの行はここで見る）
    const later = this.plan.slice(at + 1).some((p) => stepCards(p).includes(index));
    const err = later ? 'その札は、もう使う予定' : chainPlanError(this.s, this.plan.slice(0, at), next);
    if (err && !mine) {
      this.message = err;
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
      this.message = err;
      this.render();
      return;
    }
    playSe(this, SE.tap);
    this.plan.push(step);
    this.addonAt = null;
    const move = chainMoveOf(this.s, step)!;
    this.pending = null;
    this.ally = this.firstFreeAlly();
    const next = nextStart(this.s, this.plan);
    const who = stepAllies(this.s, step).map((u) => findChainUnit(this.s, u)?.name).join('と');
    this.message = this.s.def.multiAct
      ? `${who}：${move.name}を並べた。時刻${next}まで使った。続けて並べるか、仲間を替えるか、「実行」`
      : `${who}：${move.name}（${move.text}）を並べた。${this.ally ? `次は${findChainUnit(this.s, this.ally)?.name}（時刻${next}）` : '全員並べた。「実行」で動き出す'}`;
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

  private execute(): void {
    if (this.busy || this.plan.length === 0) return;
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
    const ms = Math.max(0, ((x - head.x) / CELL) * TICK_MS);
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
    const timer = this.time.delayedCall(ms, run);
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
      const big = f.events.some((e) => ['link', 'trickUse', 'status', 'pop', 'split', 'counter', 'wake', 'sticky', 'flee', 'timerBlast', 'cover', 'shellBreak'].includes(e.type));
      this.wait(big ? WAIT.big : WAIT.result, () => this.playFrames(frames, i + 1, final, f.state));
    });
  }

  /** そのコマに、差し込みの帯を出す出来事があれば出す */
  private cutInFor(f: ChainFrame, before: ChainState): void {
    const actor = findChainUnit(before, f.uid);
    const link = f.events.find((e) => e.type === 'link');
    if (link && link.type === 'link') {
      const ids = link.uids.map((u) => findChainUnit(before, u)?.defId ?? '').filter(Boolean);
      this.cutIn(`${link.name}！`, '連携技', 0xc88a10, ids);
      return;
    }
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
  }

  private finishRound(final: ChainState): void {
    this.s = final;
    saveKnown(final.known);
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
    saveKnown(this.s.known);
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
    const ai = s.allies.findIndex((u) => u.uid === uid);
    if (ai >= 0) return { x: 8 + ((GAME_WIDTH - 16) / s.allies.length) * ai + 34, y: ALLY_Y + ALLY_H / 2 };
    return null;
  }

  /** 決着の画面：撮った写真・評価の星・早撮りの報酬（調整9：イメージ 3_shutter） */
  private showEnd(): void {
    const s = this.s;
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
      o.add(addText(this, GAME_WIDTH / 2, 300, `${s.finishRound ?? s.round}ラウンド目で倒れた…`, { size: 16, bold: true, color: '#ff9db0' }).setOrigin(0.5));
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
      const art = ENEMY_ART[SPLIT_ART[e.defId] ?? e.defId];
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
    // 早く終えるほど報酬のレア度が上がる（試しでは表示だけ）
    const reward = g ? CHAIN_REWARDS[this.trial]?.[g] : undefined;
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
    const tiers: { g: string; label: string }[] = [
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

  private endButtons(o: Phaser.GameObjects.Container): void {
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
function loadKnown(): Record<string, Element[]> {
  try {
    const v = JSON.parse(browserStorage().read(KNOWN_KEY) ?? '{}') as unknown;
    if (!v || typeof v !== 'object') return {};
    const out: Record<string, Element[]> = {};
    for (const [k, list] of Object.entries(v as Record<string, unknown>)) if (Array.isArray(list)) out[k] = list.filter((x): x is Element => typeof x === 'string') as Element[];
    return out;
  } catch {
    return {};
  }
}

function saveKnown(known: Record<string, Element[]>): void {
  browserStorage().write(KNOWN_KEY, JSON.stringify(known));
}

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
    else if (ev.type === 'wake') parts.push(`${name(ev.uid)}が${ev.woke.map(name).join('・')}を起こした！`);
    else if (ev.type === 'counter') parts.push(`${name(ev.uid)}の反撃！`);
    else if (ev.type === 'split') parts.push(`${name(ev.uid)}が2つに分かれた！`);
    else if (ev.type === 'timerTick') parts.push(ev.left > 0 ? `${name(ev.uid)}：爆発まで あと${ev.left}` : '');
    else if (ev.type === 'timerBlast') parts.push(`${name(ev.uid)}が大爆発！`);
    else if (ev.type === 'flee') parts.push(`${name(ev.uid)}が逃げた！`);
    else if (ev.type === 'down') parts.push(`${name(ev.uid)}ダウン`);
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
  }
  const out = parts.filter(Boolean);
  return out.length ? out.join(' ') : '（何も起きなかった）';
}
