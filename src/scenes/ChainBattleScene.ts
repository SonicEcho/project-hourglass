import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  availableLinks,
  chainEnemyDef,
  chainMoveOf,
  chainOrder,
  chainPlanError,
  createChainBattle,
  findChainUnit,
  nextStart,
  plannedMarks,
  planStarts,
  runChainRound,
  shutterGrade,
  stepAllies,
  takeShutter,
  type ChainEvent,
  type ChainFrame,
  type ChainLinkDef,
  type ChainMove,
  type ChainPlanStep,
  type ChainSource,
  type ChainState,
  type ChainUnit,
  type Element,
} from '../core';
import { ALLY_FACE, CHAIN_CARD_ART, CHAIN_RULES, CHAIN_TRAIT_TEXT, CHAIN_TRIALS, ENEMY_ART, FACE_CROPS, SE } from '../data';
import { hasImage } from '../assets/loader';
import { playSe } from '../audio/sound';
import { faceImage } from '../ui/portrait';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, RENDER_SCALE, toCss } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { waitImages } from '../ui/waitImages';

// 試し：並べてつなぐ戦闘の画面（段階156。docs/milestones/M3_battle_review.md の 12.）。
// デバッグメニューから開く。今の戦闘の画面（BattleScene）とは別。仕組みは src/core/chain.ts、数値は src/data/chainTrial.ts

export interface ChainBattleData {
  trial: string;
  seed?: number;
}

const ENEMY_TOP = 30;
const FILM_Y = 186;
const FILM_X = 22;
const CELL = (GAME_WIDTH - FILM_X - 12) / CHAIN_RULES.roundLen;
const MSG_Y = 330;
const ALLY_Y = 368;
const TAB_Y = 458;
const HAND_Y = 480;
const CMD_Y = 768;
/** 実行中、再生位置が1マス進む時間（ms） */
const TICK_MS = 140;
/** 実行中の待ち時間（ms）：誰が・何をの帯 → 結果 → 次へ（調整4で、半分以下に縮めた） */
const WAIT = { announce: 350, result: 750, big: 1100, cancel: 600, end: 150 } as const;

/** 敵の印の色（フィルムの上の段と、敵の名前の横） */
const ENEMY_COLORS = [0xff8a5a, 0x6bc8ff, 0xc89aff, 0x7ad98a, 0xf2c45a];
const TYPE_LABEL: Record<string, string> = { place: '置く', receive: '受ける', count: '数える', finish: '締める', attack: '攻撃', support: '支援', link: '連携' };
const TYPE_COLOR: Record<string, number> = { place: 0x4aa8ff, receive: 0x6ad0b0, count: 0xf2c45a, finish: 0xff7a5a, attack: 0x9aa5b1, support: 0x6dff9e, link: 0xffd700 };
/** 分裂で出てきた敵の絵（元の敵の絵を小さく使う） */
const SPLIT_ART: Record<string, string> = { miniBalloon: 'balloonNoise' };

type Pending = { source: ChainSource; move: ChainMove } | null;

/** 行動の攻撃の属性（共鳴の予告に使う。受ける札は直前で決まるので null） */
function moveElement(m: ChainMove): Element | null {
  if (m.effect.kind === 'damage' && !m.effect.bestOf) return m.effect.element;
  if (m.effect.kind === 'mark' && m.effect.power) return m.effect.element;
  return null;
}

export class ChainBattleScene extends Phaser.Scene {
  private s!: ChainState;
  private trial = '';
  private root!: Phaser.GameObjects.Container;
  private plan: ChainPlanStep[] = [];
  private ally = '';
  private pending: Pending = null;
  private tab: 'cards' | 'moves' = 'cards';
  private message = '';
  private busy = false;
  /** 実行中の再生位置（フィルムの上を左から右へ動く線。描き直しても消えないよう、root の外に置く） */
  private head: Phaser.GameObjects.Rectangle | null = null;
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
    const def = CHAIN_TRIALS.find((t) => t.id === data.trial) ?? CHAIN_TRIALS[0];
    this.s = createChainBattle(def, CHAIN_RULES, data.seed ?? Date.now() % 100000);
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
      if (p.worldY > CMD_Y - 30 && p.worldX > GAME_WIDTH - 200) return;
      if (this.busy && this.advance) this.advance();
    });
    this.message = '上の段は敵の予定（時刻と行動）。仲間を選んで札か技を並べると、下の段に入る。全員ダウンさせるとシャッターで決着';
    const ids = [...def.enemies.map((e) => ENEMY_ART[e.id]), ...def.allies.map((a) => ALLY_FACE[a.id]), ...Object.values(CHAIN_CARD_ART)].filter((x): x is string => !!x);
    waitImages(this, ids, () => this.render());
  }

  /** 計画で、もう並べた仲間（連携技は2人） */
  private plannedAllies(): Set<string> {
    return new Set(this.plan.flatMap((p) => stepAllies(this.s, p)));
  }

  private firstFreeAlly(): string {
    const used = this.plannedAllies();
    return this.s.allies.find((a) => a.hp > 0 && !used.has(a.uid))?.uid ?? '';
  }

  private allyName(defId: string): string {
    return this.s.def.allies.find((a) => a.id === defId)?.name ?? '';
  }

  // ---------- 描く ----------

  private render(view: ChainState = this.s): void {
    this.root.removeAll(true);
    this.enemyImages.clear();
    const r = this.root;
    r.add(addText(this, 12, 8, '● REC', { size: 12, bold: true, color: '#ff3b5c' }));
    r.add(addText(this, 70, 8, '試し：並べてつなぐ戦闘', { size: 12, bold: true }));
    r.add(addText(this, GAME_WIDTH - 12, 8, `ラウンド ${view.round}`, { size: 12, bold: true, color: COLORS.accentText }).setOrigin(1, 0));
    this.drawEnemies(view);
    this.drawFilm(view);
    r.add(this.add.rectangle(GAME_WIDTH / 2, MSG_Y, GAME_WIDTH - 16, 46, 0x0b0f22, 0.92).setStrokeStyle(1, COLORS.border).setRounded(6));
    r.add(addText(this, 16, MSG_Y, this.message, { size: 11, wrap: GAME_WIDTH - 32 }).setOrigin(0, 0.5));
    this.drawAllies(view);
    if (!this.busy && view.outcome === 'ongoing' && !view.shutter) {
      this.drawTabs();
      this.drawOptions();
      this.drawCommands();
    } else if (this.currentOrder > 0) this.drawRunList();
  }

  /** コマを1行の言葉で（「ハルト：斬る → 金魚」） */
  private frameLabel(f: ChainFrame): string {
    const nm = (uid?: string) => (uid ? ((findChainUnit(f.state, uid) ?? findChainUnit(this.s, uid))?.name.replace('ノイズ', '') ?? '') : '');
    const link = f.events.find((e) => e.type === 'link') as { uids: string[] } | undefined;
    const who = link ? link.uids.map(nm).join('＋') : nm(f.uid);
    if (f.key.startsWith('end:')) return `${who}：${f.name}`;
    return `${who}：${f.name}${f.target && !f.all ? ` → ${nm(f.target)}` : f.all ? '（全体）' : ''}`;
  }

  /** 実行中の、動く順の一覧（済んだコマは結果、今のコマは光らせ、この後のコマは薄く） */
  private drawRunList(): void {
    const top = TAB_Y - 10;
    this.root.add(addText(this, 12, top, '動く順（番号の順。同じ時刻なら味方が先）', { size: 11, bold: true, color: COLORS.accentText }));
    const rowH = 30;
    this.runFrames.forEach((f, k) => {
      const n = f.order;
      const y = top + 26 + k * rowH;
      if (y > GAME_HEIGHT - 60) return;
      const done = n < this.currentOrder;
      const now = n === this.currentOrder;
      const ally = findChainUnit(this.s, f.uid)?.side === 'ally';
      const box = this.add.rectangle(GAME_WIDTH / 2, y + 10, GAME_WIDTH - 16, rowH - 4, now ? 0x3a2a10 : 0x141a30, now ? 1 : 0.9).setRounded(6);
      if (now) box.setStrokeStyle(2, COLORS.accent);
      this.root.add(box);
      this.root.add(this.add.circle(24, y + 10, 10, ally ? 0x3f7fbf : 0xbf4f4f, done ? 0.5 : 1));
      this.root.add(addText(this, 24, y + 10, String(n), { size: 11, bold: true }).setOrigin(0.5));
      const head = `${f.key.startsWith('end:') ? 'ラウンドの終わり' : `時刻${f.at}`}　${this.frameLabel(f)}`;
      const t = addText(this, 40, y + (done || now ? 2 : 10), head, { size: 11, bold: now, color: done ? COLORS.subText : now ? '#ffffff' : COLORS.dimText }).setOrigin(0, done || now ? 0 : 0.5);
      if (t.width > GAME_WIDTH - 60) t.setScale((GAME_WIDTH - 60) / t.width);
      this.root.add(t);
      const res = this.runResults.get(n);
      if ((done || now) && res) {
        const rt = addText(this, 40, y + 16, res, { size: 9, color: now ? COLORS.weak : '#c8d0ec' });
        if (rt.width > GAME_WIDTH - 60) rt.setScale((GAME_WIDTH - 60) / rt.width);
        this.root.add(rt);
      }
    });
    this.root.add(addText(this, 12, CMD_Y, 'タップで次へ', { size: 10, color: COLORS.dimText }).setOrigin(0, 0.5));
    addButton(this, this.root, GAME_WIDTH - 8 - 90, CMD_Y, 180, 46, '結果まで飛ばす ▶▶', { onTap: () => this.skipToEnd() }, { size: 14, bold: true, fill: 0x2f4f8f });
  }

  /** 画面に出す敵（分裂して倒れた元の敵は出さない） */
  private shownEnemies(s: ChainState): ChainUnit[] {
    return s.enemies.filter((e) => !(e.hp <= 0 && e.trait === 'split' && s.enemies.some((x) => x.uid.startsWith(e.uid) && x.uid !== e.uid)));
  }

  private drawEnemies(s: ChainState): void {
    const list = this.shownEnemies(s);
    const n = list.length;
    const colW = GAME_WIDTH / n;
    const ghost = this.busy ? {} : plannedMarks(this.s, this.plan);
    list.forEach((e, i) => {
      const cx = colW * i + colW / 2;
      const alive = e.hp > 0 && !e.gone;
      const size = Math.min(66, colW - 12) * (SPLIT_ART[e.defId] ? 0.7 : 1);
      const top = ENEMY_TOP;
      const color = ENEMY_COLORS[s.enemies.indexOf(e) % ENEMY_COLORS.length];
      const isTarget = this.pending?.move.target === 'enemy' && alive;
      if (this.busy && e.uid === this.actorUid) this.root.add(this.add.rectangle(cx, top + 66, colW - 6, 134, 0xff3b5c, 0.12).setStrokeStyle(3, 0xff3b5c).setRounded(8));
      if (this.busy && e.uid === this.targetUid) this.root.add(this.add.rectangle(cx, top + 66, colW - 6, 134, 0xffd84a, 0.08).setStrokeStyle(3, 0xffd84a).setRounded(8));
      if (isTarget) this.root.add(this.add.rectangle(cx, top + 66, colW - 6, 134, 0xffffff, 0.04).setStrokeStyle(2, COLORS.select).setRounded(8));
      const art = ENEMY_ART[SPLIT_ART[e.defId] ?? e.defId];
      const imgY = top + 35;
      if (art && hasImage(this, art)) {
        const img = this.add.image(cx, imgY, art);
        img.setScale(size / Math.max(img.width, img.height));
        if (!alive) img.setAlpha(0.15).setTint(0x606060);
        else if (e.down) img.setAngle(-14).setTint(0xb0b0ff);
        this.root.add(img);
        this.enemyImages.set(e.uid, img);
      } else this.root.add(this.add.circle(cx, imgY, size / 2.4, COLORS.enemy, alive ? 1 : 0.2));
      // 名前の前に、フィルムの印と同じ色の丸と文字
      const y = top + 70;
      const letter = String.fromCharCode(65 + s.enemies.indexOf(e));
      this.root.add(this.add.circle(cx - colW / 2 + 10, y + 7, 7, color));
      this.root.add(addText(this, cx - colW / 2 + 10, y + 7, letter, { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      const name = addText(this, cx + 6, y, e.name.replace('ノイズ', ''), { size: 11, bold: true, color: alive ? COLORS.text : COLORS.dimText }).setOrigin(0.5, 0);
      if (name.width > colW - 26) name.setScale((colW - 26) / name.width);
      this.root.add(name);
      const bw = colW - 14;
      this.root.add(this.add.rectangle(cx - bw / 2, y + 20, bw, 4, COLORS.barBg).setOrigin(0, 0.5));
      this.root.add(this.add.rectangle(cx - bw / 2, y + 20, bw * (Math.max(0, e.hp) / e.maxHp), 4, COLORS.hp).setOrigin(0, 0.5));
      // 弱点（1文字の色の丸）と特徴。細かい数字は長押しで（調整5）
      const w = e.weak[0];
      let tx = cx - bw / 2;
      if (w) {
        this.root.add(this.add.circle(tx + 8, y + 31, 8, ELEMENT_COLOR[w]).setStrokeStyle(1, 0xffffff));
        this.root.add(addText(this, tx + 8, y + 31, ELEMENT_LABEL[w].slice(0, 1), { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
        tx += 18;
      }
      if (e.trait) {
        const t = CHAIN_TRAIT_TEXT[e.trait];
        const extra = e.trait === 'timer' && alive ? ` あと${e.timer}` : e.trait === 'shell' && alive ? (e.shell ? '' : '（割れた）') : '';
        const tag = addText(this, tx + 2, y + 31, t.name + extra, { size: 9, bold: true, color: e.trait === 'timer' ? '#ff9a7a' : '#ffe0a0' }).setOrigin(0, 0.5);
        const room = cx + colW / 2 - 4 - (tx + 2);
        if (tag.width > room) tag.setScale(room / tag.width);
        this.root.add(tag);
      }
      if (e.gone) {
        this.root.add(addText(this, cx, imgY, e.trait === 'timer' ? '消えた' : '逃げた', { size: 14, bold: true, color: COLORS.subText }).setOrigin(0.5).setStroke('#000000', 3));
        return;
      }
      if (!alive) return;
      if (e.trait === 'shell' && e.shell) this.root.add(this.add.circle(cx, imgY, size / 2 + 2).setStrokeStyle(3, 0xd0c8b0, 0.9));
      // 印（今付いている印と、計画で付く予定の印。予定は点線のように薄く）
      const marks: { el: Element; planned: boolean }[] = [...e.marks.map((el) => ({ el, planned: false })), ...((ghost as Record<string, Element[]>)[e.uid] ?? []).filter((el) => !e.marks.includes(el)).map((el) => ({ el, planned: true }))];
      marks.forEach((m, k) => {
        const mx = cx + colW / 2 - 18 - k * 28;
        const chip = this.add.rectangle(mx, top + 8, 26, 14, ELEMENT_COLOR[m.el], m.planned ? 0.35 : 1).setRounded(7);
        if (m.planned) chip.setStrokeStyle(1.5, ELEMENT_COLOR[m.el]);
        this.root.add(chip);
        this.root.add(addText(this, mx, top + 8, `${ELEMENT_LABEL[m.el]}印`, { size: 9, bold: true, color: m.planned ? '#ffffff' : '#101010' }).setOrigin(0.5));
      });
      if (e.down) this.root.add(addText(this, cx, imgY, 'ダウン', { size: 14, bold: true, color: COLORS.weak }).setOrigin(0.5).setAngle(-10).setStroke('#000000', 3));
      // 予定（すばやい敵は2つ）
      const intents = s.intents.filter((it) => it.enemy === e.uid);
      if (intents.length) {
        const it = intents[0];
        const tgt = it.target ? findChainUnit(s, it.target)?.name : '';
        const times = intents.map((x) => x.at).join('・');
        const label = `${times}：${it.move.name}${it.move.flee ? '' : it.move.all ? '（全体）' : ` → ${tgt}`}`;
        const big = it.move.all || it.move.flee;
        const tag = addText(this, cx, y + 46, label, { size: 10, bold: true, color: big ? '#ffd0a0' : '#dfe6ff' }).setOrigin(0.5);
        if (tag.width > colW - 8) tag.setScale((colW - 8) / tag.width);
        this.root.add(this.add.rectangle(cx, y + 46, Math.min(colW - 4, tag.displayWidth + 10), 16, big ? 0x7a2a10 : 0x24305a, e.down ? 0.3 : 1).setStrokeStyle(1, big ? 0xff9a5a : 0x6b7fc0).setRounded(8));
        if (e.down) tag.setAlpha(0.4);
        this.root.add(tag);
      }
      const hit = this.add.rectangle(cx, top + 70, colW - 4, 140, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, {
        onTap: () => this.pickEnemy(e.uid),
        onLongPress: () => this.explainEnemy(e),
      });
    });
  }

  private explainEnemy(e: ChainUnit): void {
    const d = chainEnemyDef(this.s, e.defId);
    const t = e.trait ? CHAIN_TRAIT_TEXT[e.trait] : null;
    const resist = e.resist.length ? `・耐性 ${e.resist.map((x) => ELEMENT_LABEL[x]).join('・')}` : '';
    const pattern = (d?.pattern ?? []).map((p) => `${p.name}（時刻${p.at}${p.at2 !== undefined ? `・${p.at2}` : ''}${p.all ? '・全体' : ''}）`).join(' → ');
    this.message = `${e.name}：弱点 ${e.weak.map((x) => ELEMENT_LABEL[x]).join('・')}${resist}。${t ? `【${t.name}】${t.text}。` : ''}癖：${pattern}`;
    this.render();
  }

  /** フィルム：時刻の目盛り、上の段に敵の予定、下の段に並べた仲間の行動 */
  private drawFilm(s: ChainState): void {
    const r = this.root;
    const x0 = FILM_X;
    const len = CHAIN_RULES.roundLen;
    const top = FILM_Y;
    const g = this.add.graphics();
    g.fillStyle(0x16110a, 1).fillRoundedRect(4, top - 6, GAME_WIDTH - 8, 124, 8);
    // フィルムの穴
    g.fillStyle(0x0b0f22, 1);
    for (let k = 0; k < 22; k++) {
      g.fillRect(10 + k * 17.4, top - 3, 9, 5);
      g.fillRect(10 + k * 17.4, top + 111, 9, 5);
    }
    // 目盛り
    for (let t = 0; t < len; t++) g.fillStyle(t % 2 === 0 ? 0x2a2214 : 0x221b10, 1).fillRect(x0 + CELL * t, top + 6, CELL, 100);
    r.add(g);
    for (let t = 0; t < len; t++) r.add(addText(this, x0 + CELL * t + CELL / 2, top + 10, String(t), { size: 10, bold: true, color: '#d9a440' }).setOrigin(0.5, 0));
    r.add(addText(this, 8, top + 38, '敵', { size: 10, bold: true, color: '#ff9a7a' }).setOrigin(0, 0.5));
    r.add(addText(this, 8, top + 80, '味方', { size: 9, bold: true, color: '#9ad0ff' }).setOrigin(0, 0.5));
    // 動く順の番号（同じ時刻なら味方が先）。計画の時は見込み、実行中は本当のコマの番号。済んだ番号は薄く、今の番号を光らせる
    const planOrder = chainOrder(this.s, this.plan);
    const numOf = (key: string): number => (this.busy && this.runFrames.length ? (this.runFrames.find((f) => f.key === key)?.order ?? 0) : planOrder.findIndex((o) => o.key === key) + 1);
    const badge = (x: number, y: number, n: number) => {
      if (n <= 0) return;
      const now = n === this.currentOrder;
      const done = this.currentOrder > 0 && n < this.currentOrder;
      r.add(this.add.circle(x, y, now ? 9 : 7, now ? 0xff3b5c : 0xffffff, done ? 0.35 : 1).setStrokeStyle(1, 0x000000));
      r.add(addText(this, x, y, String(n), { size: now ? 11 : 9, bold: true, color: now ? '#ffffff' : '#101010' }).setOrigin(0.5).setAlpha(done ? 0.5 : 1));
    };
    r.add(addText(this, GAME_WIDTH - 10, top + 104, '番号の順に動く（同じ時刻なら味方が先）', { size: 9, color: '#d9a440' }).setOrigin(1, 0.5));
    // 上の段：敵の予定
    const slots: Record<number, number> = {};
    s.intents.forEach((it, k) => {
      const i = s.enemies.findIndex((e) => e.uid === it.enemy);
      const e = s.enemies[i];
      if (!e || e.hp <= 0 || e.gone) return;
      const row = (slots[it.at] = (slots[it.at] ?? 0) + 1) - 1;
      const cx = x0 + CELL * it.at + CELL / 2;
      const cy = top + 38 + row * 15 - 4;
      const color = ENEMY_COLORS[i % ENEMY_COLORS.length];
      const big = it.move.all || it.move.flee;
      r.add(this.add.circle(cx, cy, 9, color, e.down ? 0.25 : 1).setStrokeStyle(big ? 2.5 : 1, big ? 0xff5a3a : 0x000000));
      r.add(addText(this, cx, cy, String.fromCharCode(65 + i), { size: 10, bold: true, color: '#101010' }).setOrigin(0.5).setAlpha(e.down ? 0.4 : 1));
      if (it.move.all) r.add(addText(this, cx + 9, cy - 9, '全', { size: 8, bold: true, color: '#ff9a7a' }).setOrigin(0.5));
      if (it.move.flee) r.add(addText(this, cx + 9, cy - 9, '逃', { size: 8, bold: true, color: '#ff9a7a' }).setOrigin(0.5));
      if (e.down) r.add(addText(this, cx, cy, '×', { size: 16, bold: true, color: COLORS.weak }).setOrigin(0.5));
      badge(cx - 11, cy - 9, numOf(`e${k}`));
    });
    // 下の段：並べた行動（重さの分の長さ。ねばねばで遅れたら、遅れた所に）
    const starts = planStarts(this.s, this.plan);
    this.plan.forEach((step, i) => {
      const move = chainMoveOf(this.s, step);
      if (!move) return;
      const members = stepAllies(this.s, step).map((u) => findChainUnit(s, u)!);
      const at = this.busy ? (s.actedAt[i] ?? starts[i] + s.timeShift) : starts[i];
      if (at >= len) {
        r.add(addText(this, x0 + CELL * len - 4, top + 80, `${members[0].name} 時間切れ`, { size: 9, bold: true, color: '#ff9a7a' }).setOrigin(1, 0.5));
        return;
      }
      const w = Math.min(move.weight, len - at);
      const bx = x0 + CELL * at + 1;
      const color = ALLY_COLOR[members[0].defId] ?? COLORS.ally;
      const isLink = step.source.kind === 'link';
      const bar = this.add.rectangle(bx, top + 80, CELL * w - 2, 34, isLink ? 0xd9a440 : color, 0.88).setOrigin(0, 0.5).setRounded(5);
      if (isLink) bar.setStrokeStyle(2.5, 0xffd700);
      r.add(bar);
      const nmText = addText(this, bx + 14, top + 70, members.map((m) => m.name).join('＋'), { size: 9, bold: true, color: '#101010' });
      if (nmText.width > CELL * w - 18) nmText.setScale((CELL * w - 18) / nmText.width);
      r.add(nmText);
      badge(bx + 7, top + 70 + 6, numOf(`a${i}`));
      const nm = addText(this, bx + 3, top + 84, move.name, { size: 10, bold: true, color: '#101010' });
      if (nm.width > CELL * w - 6) nm.setScale((CELL * w - 6) / nm.width);
      r.add(nm);
    });
    // 次に並べる時刻
    if (!this.busy && s.outcome === 'ongoing' && !s.shutter) {
      const at = nextStart(this.s, this.plan);
      if (at < len && this.ally) r.add(this.add.rectangle(x0 + CELL * at + 1, top + 80, 3, 36, COLORS.accent).setOrigin(0, 0.5));
      else if (at >= len) r.add(addText(this, x0, top + 104, '時間はいっぱい', { size: 9, color: '#ff9a7a' }).setOrigin(0, 0.5));
    }
  }

  private drawAllies(s: ChainState): void {
    const colW = (GAME_WIDTH - 16) / s.allies.length;
    const starts = planStarts(this.s, this.plan);
    const order = chainOrder(this.s, this.plan);
    s.allies.forEach((u, i) => {
      const x = 8 + colW * i + colW / 2;
      const y = ALLY_Y + 38;
      const planned = this.plan.findIndex((p) => stepAllies(this.s, p).includes(u.uid));
      const sel = !this.busy && this.ally === u.uid;
      const box = this.add.rectangle(x, y, colW - 6, 76, 0x1d2544, 0.95).setRounded(8);
      const acting = this.busy && this.actorUid === u.uid;
      const aimed = this.busy && this.targetUid === u.uid;
      box.setStrokeStyle(sel || acting || aimed ? 3 : 1, acting ? 0xff3b5c : aimed ? 0xffd84a : sel ? COLORS.accent : COLORS.border);
      this.root.add(box);
      const id = ALLY_FACE[u.defId];
      if (id && hasImage(this, id)) this.root.add(faceImage(this, id, x - colW / 2 + 24, y - 14, 15, FACE_CROPS[u.defId]).setAlpha(u.hp > 0 ? 1 : 0.3));
      this.root.add(addText(this, x - colW / 2 + 44, y - 30, u.name, { size: 12, bold: true, color: u.hp > 0 ? toCss(ALLY_COLOR[u.defId] ?? COLORS.ally) : COLORS.dimText }));
      const bw = colW - 20;
      this.root.add(this.add.rectangle(x - bw / 2, y + 8, bw, 5, COLORS.barBg).setOrigin(0, 0.5));
      this.root.add(this.add.rectangle(x - bw / 2, y + 8, bw * (u.hp / u.maxHp), 5, u.hp < u.maxHp * 0.3 ? COLORS.hpLow : COLORS.hp).setOrigin(0, 0.5));
      this.root.add(addText(this, x - bw / 2, y + 12, `${u.hp}/${u.maxHp}`, { size: 9 }));
      const turn = planned >= 0 ? order.findIndex((o) => o.kind === 'ally' && o.i === planned) + 1 : 0;
      const state = u.hp <= 0 ? '倒れている' : planned >= 0 ? `動く順 ${turn}・時刻${starts[planned]}` : sel ? '← 並べる人' : 'タップで選ぶ';
      this.root.add(addText(this, x, y + 30, state, { size: 9, bold: planned >= 0 || sel, color: planned >= 0 ? '#9ad0ff' : sel ? COLORS.accentText : COLORS.dimText }).setOrigin(0.5));
      const hit = this.add.rectangle(x, y, colW - 6, 76, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, { onTap: () => this.pickAlly(u.uid) });
    });
  }

  private drawTabs(): void {
    const w = 110;
    const links = availableLinks(this.s, this.plan);
    addButton(this, this.root, 8 + w / 2, TAB_Y, w, 28, links.length ? `手札・連携技 ★` : `手札（${this.s.hand.length}枚）`, { onTap: () => this.switchTab('cards') }, { size: 12, fill: this.tab === 'cards' ? 0x2f4f8f : 0x1d2544, stroke: links.length ? 0xffd700 : undefined });
    addButton(this, this.root, 16 + w * 1.5, TAB_Y, w, 28, '技', { onTap: () => this.switchTab('moves') }, { size: 12, fill: this.tab === 'moves' ? 0x2f4f8f : 0x1d2544 });
    const name = this.ally ? findChainUnit(this.s, this.ally)?.name : '';
    this.root.add(addText(this, GAME_WIDTH - 52, TAB_Y, name ? `${name}の行動` : '全員並べた', { size: 11, bold: true, color: COLORS.accentText }).setOrigin(1, 0.5));
    addButton(this, this.root, GAME_WIDTH - 24, TAB_Y, 36, 28, '？', { onTap: () => this.showRules() }, { size: 14, bold: true });
  }

  private switchTab(tab: 'cards' | 'moves'): void {
    this.tab = tab;
    this.pending = null;
    this.render();
  }

  /** 共鳴の予告：その行動の属性と同じ印が付いている（付く予定の）敵の数 */
  private resonanceCount(m: ChainMove): number {
    const el = moveElement(m);
    if (!el) return 0;
    const ghost = plannedMarks(this.s, this.plan);
    return this.s.enemies.filter((e) => e.hp > 0 && !e.gone && (e.marks.includes(el) || (ghost[e.uid] ?? []).includes(el))).length;
  }

  /** 選べる札・技を並べる（長押しで説明）。手札のタブは、そろった連携技を先頭に */
  private drawOptions(): void {
    const s = this.s;
    const items: { source: ChainSource; move: ChainMove; art?: string; used?: boolean; link?: ChainLinkDef }[] = [];
    // そろった連携技は、手札の上に金色の帯で（手札は5枚のまま並べる）
    const links = this.tab === 'cards' ? availableLinks(s, this.plan) : [];
    const linkH = links.length ? 36 : 0;
    links.forEach((x, k) => {
      const lw = (GAME_WIDTH - 16 - (links.length - 1) * 6) / links.length;
      const lx = 8 + k * (lw + 6) + lw / 2;
      const ly = HAND_Y + 14;
      const source: ChainSource = { kind: 'link', linkId: x.link.id, cards: x.cards };
      const sel = this.pending && sameSource(this.pending.source, source);
      this.root.add(this.add.rectangle(lx, ly, lw, 30, 0xfff4c2).setRounded(8).setStrokeStyle(sel ? 3 : 2, sel ? COLORS.select : 0xffd700));
      x.link.members.forEach((m, j) => {
        const fid = ALLY_FACE[m];
        if (fid && hasImage(this, fid)) this.root.add(faceImage(this, fid, lx - lw / 2 + 14 + j * 18, ly, 10, FACE_CROPS[m]));
      });
      const t = addText(this, lx - lw / 2 + 50, ly, `★${x.link.move.name}`, { size: 11, bold: true, color: '#5a3a00' }).setOrigin(0, 0.5);
      if (t.width > lw - 56) t.setScale((lw - 56) / t.width);
      this.root.add(t);
      const hit = this.add.rectangle(lx, ly, lw, 30, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, {
        onTap: () => this.pickOption(source, x.link.move),
        onLongPress: () => {
          this.message = `【連携】${x.link.move.name}（重さ${x.link.move.weight}・2人の手番を使う）：${x.link.move.text}`;
          this.render();
        },
      });
    });
    if (this.tab === 'cards') {
      const usedCards = new Set(this.plan.flatMap((p) => (p.source.kind === 'card' ? [p.source.index] : p.source.kind === 'link' ? p.source.cards : [])));
      s.hand.forEach((id, index) => items.push({ source: { kind: 'card', index }, move: s.def.cards[id], art: CHAIN_CARD_ART[id], used: usedCards.has(index) }));
    } else if (this.ally) {
      const me = findChainUnit(s, this.ally);
      const def = s.def.allies.find((a) => a.id === me?.defId);
      for (const m of def?.moves ?? []) items.push({ source: { kind: 'move', moveId: m.id }, move: m });
    }
    const me = this.ally ? findChainUnit(s, this.ally) : undefined;
    const shown = items.slice(0, 7);
    const w = shown.length > 5 ? 52 : 70;
    const h = 118 - Math.min(linkH, 10);
    const gap = Math.max(2, (GAME_WIDTH - 16 - w * Math.max(5, shown.length)) / Math.max(4, shown.length - 1));
    shown.forEach((it, i) => {
      const x = 8 + i * (w + gap) + w / 2;
      const sel = this.pending && sameSource(this.pending.source, it.source);
      const y = HAND_Y + linkH + h / 2 - (sel ? 8 : 0);
      const isLink = !!it.link;
      const notMine = !!it.move.owner && me?.defId !== it.move.owner;
      const dim = it.used || notMine;
      const c = this.add.rectangle(x, y, w, h, it.used ? 0x55565c : isLink ? 0xfff4c2 : notMine ? 0xc9c6bd : 0xfdfbf6).setRounded(6);
      if (sel) c.setStrokeStyle(3, COLORS.select);
      else if (isLink) c.setStrokeStyle(2.5, 0xffd700);
      else if (it.move.owner) c.setStrokeStyle(2, ALLY_COLOR[it.move.owner] ?? COLORS.accent);
      this.root.add(c);
      const top = y - h / 2;
      if (isLink) {
        // 連携技：組む2人の顔
        it.link!.members.forEach((m, k) => {
          const fid = ALLY_FACE[m];
          if (fid && hasImage(this, fid)) this.root.add(faceImage(this, fid, x - 12 + k * 24, top + 26, 13, FACE_CROPS[m]));
        });
      } else if (it.art && hasImage(this, it.art)) {
        const img = this.add.image(x, top + 26, it.art);
        const src = this.textures.get(it.art).getSourceImage();
        const sc = Math.max(w / src.width, 50 / src.height);
        img.setScale(sc).setCrop((src.width - w / sc) / 2, (src.height - 50 / sc) / 2, w / sc, 50 / sc);
        if (dim) img.setAlpha(0.45);
        this.root.add(img);
      } else this.root.add(this.add.rectangle(x, top + 26, w, 50, 0x2b3560));
      // 専用の札は、持ち主の顔を小さく
      if (it.move.owner) {
        const fid = ALLY_FACE[it.move.owner];
        if (fid && hasImage(this, fid)) this.root.add(faceImage(this, fid, x + w / 2 - 11, top + 40, 9, FACE_CROPS[it.move.owner]));
      }
      this.root.add(this.add.rectangle(x - w / 2 + 18, top + 8, 34, 14, TYPE_COLOR[it.move.type]).setRounded(4));
      this.root.add(addText(this, x - w / 2 + 18, top + 8, TYPE_LABEL[it.move.type], { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      const title = addText(this, x, top + 62, it.move.name, { size: 11, bold: true, color: '#222222', align: 'center', wrap: w - 4 }).setOrigin(0.5);
      this.root.add(title);
      this.root.add(addText(this, x, top + 80, `重さ ${it.move.weight}`, { size: 10, bold: true, color: '#7a4a10' }).setOrigin(0.5));
      // 共鳴の予告
      const res = this.resonanceCount(it.move);
      if (res > 0 && !it.used) {
        this.root.add(this.add.rectangle(x, top + h - 10, w - 6, 16, ELEMENT_COLOR[moveElement(it.move)!]).setRounded(6));
        this.root.add(addText(this, x, top + h - 10, `共鳴 ${res}体`, { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      }
      if (it.used) this.root.add(addText(this, x, y, '並べた', { size: 12, bold: true, color: '#ffffff' }).setOrigin(0.5).setStroke('#000000', 3));
      const hit = this.add.rectangle(x, y, w, h, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, {
        onTap: () => !it.used && this.pickOption(it.source, it.move),
        onLongPress: () => {
          this.message = `【${TYPE_LABEL[it.move.type]}】${it.move.name}（重さ${it.move.weight}）：${it.move.text}`;
          this.render();
        },
      });
    });
    if (items.length === 0) this.root.add(addText(this, GAME_WIDTH / 2, HAND_Y + 60, this.tab === 'cards' ? '手札がない' : '仲間を選ぶ', { size: 12, color: COLORS.subText }).setOrigin(0.5));
    const hint = addText(this, GAME_WIDTH / 2, HAND_Y + linkH + h + 14, 'タップで並べる（敵1体の札は、続けて敵をタップ）。長押しで説明。間違えたら「1つ戻す」', { size: 9, color: COLORS.dimText }).setOrigin(0.5);
    if (hint.width > GAME_WIDTH - 16) hint.setScale((GAME_WIDTH - 16) / hint.width);
    this.root.add(hint);
  }

  /** 決まりの早見（「？」で案内の窓に出す。調整5で、常に出す早見をやめた） */
  private showRules(): void {
    this.message = '同じ色を重ねると広がる：置く札の印と同じ属性が当たると、同じ印の敵みんなに広がる／顔付きの札はその人専用。2人の専用の札がそろうと連携技／敵を長押しで特徴と癖';
    this.render();
  }

  private drawCommands(): void {
    const w = (GAME_WIDTH - 16 - 12) / 3;
    const xs = [0, 1, 2].map((i) => 8 + w / 2 + i * (w + 6));
    addButton(this, this.root, xs[0], CMD_Y, w, 52, '1つ戻す', { onTap: () => this.undo() }, { size: 14, enabled: this.plan.length > 0 });
    addButton(this, this.root, xs[1], CMD_Y, w, 52, '全部やめる', { onTap: () => this.clearPlan() }, { size: 14, enabled: this.plan.length > 0 });
    addButton(this, this.root, xs[2], CMD_Y, w, 52, '実行', { onTap: () => this.execute() }, { size: 18, bold: true, enabled: this.plan.length > 0, fill: 0x2f6b3f });
  }

  // ---------- 選ぶ ----------

  private pickAlly(uid: string): void {
    if (this.busy) return;
    const u = this.s.allies.find((a) => a.uid === uid);
    if (!u || u.hp <= 0) return;
    if (this.plannedAllies().has(uid)) {
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
    // 連携技は、組む2人のうち1人目が動く（今選んでいる仲間によらない）
    const actor = source.kind === 'link' ? (this.s.allies.find((a) => a.defId === this.s.def.links.find((l) => l.id === source.linkId)?.members[0])?.uid ?? '') : this.ally;
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
    const res = this.resonanceCount(move);
    this.message = `【${TYPE_LABEL[move.type]}】${move.name}（重さ${move.weight}・時刻${at}〜）：${move.text}${res ? `。印の敵に当たると${res}体に共鳴` : ''}　→ 敵をタップ`;
    this.render();
  }

  private pickEnemy(uid: string): void {
    if (this.busy || !this.pending || !this.ally) return;
    if (this.pending.move.target !== 'enemy') return;
    this.place({ ally: this.ally, source: this.pending.source, target: uid });
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
    const move = chainMoveOf(this.s, step)!;
    this.pending = null;
    this.ally = this.firstFreeAlly();
    const next = nextStart(this.s, this.plan);
    const who = stepAllies(this.s, step).map((u) => findChainUnit(this.s, u)?.name).join('と');
    this.message = `${who}：${move.name}（${move.text}）を並べた。${this.ally ? `次は${findChainUnit(this.s, this.ally)?.name}（時刻${next}）` : '全員並べた。「実行」で動き出す'}`;
    if (availableLinks(this.s, this.plan).length) this.message += '。連携技が使える（手札の先頭 ★）';
    this.render();
  }

  private undo(): void {
    if (this.busy || this.plan.length === 0) return;
    const last = this.plan.pop()!;
    this.ally = last.ally;
    this.pending = null;
    this.message = `${stepAllies(this.s, last).map((u) => findChainUnit(this.s, u)?.name).join('と')}の行動を外した`;
    this.render();
  }

  private clearPlan(): void {
    if (this.busy) return;
    this.plan = [];
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
    this.head = this.add.rectangle(FILM_X, FILM_Y + 56, 3, 104, 0xff3b5c, 0.95).setDepth(5);
    this.playFrames(frames, 0, state, this.s);
  }

  /** 再生位置を、時刻 t のマスの真ん中まで、左から右へなめらかに動かす（1マス TICK_MS）。タップで飛ばす */
  private moveHead(t: number, next: () => void): void {
    const head = this.head;
    if (!head) {
      next();
      return;
    }
    const x = FILM_X + CELL * t + CELL / 2;
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
      const c = p.heal ? 0x6dff9e : p.from === f.uid ? color : 0xffd84a;
      const dot = this.add.circle(a.x, a.y, 7, c, 1).setStrokeStyle(2, 0xffffff).setDepth(41);
      this.tweens.add({
        targets: dot,
        x: b.x,
        y: b.y,
        delay: 80 + k * 60,
        duration: 240,
        ease: 'Quad.easeIn',
        onComplete: () => {
          dot.destroy();
          const hit = this.add.circle(b.x, b.y, 12, 0xffffff, 0.7).setDepth(41);
          this.tweens.add({ targets: hit, scale: 2.4, alpha: 0, duration: 320, onComplete: () => hit.destroy() });
        },
      });
    });
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
      else this.moveHead(CHAIN_RULES.roundLen - 0.5, () => this.wait(WAIT.end, done));
      return;
    }
    const f = frames[i];
    // 再生位置がその行動の時刻に来るまで、線を進める
    if (this.head && this.head.x < FILM_X + CELL * f.at + CELL / 2 - 1) {
      this.moveHead(f.at, () => this.playFrames(frames, i, final, before));
      return;
    }
    const label = this.frameLabel(f);
    const when = f.key.startsWith('end:') ? 'ラウンドの終わり' : `${f.order}番目（時刻${f.at}）`;
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
      if (f.events.some((e) => e.type === 'damage')) playSe(this, f.events.some((e) => e.type === 'damage' && e.weak) ? SE.slash : SE.hit);
      if (f.events.some((e) => e.type === 'heal')) playSe(this, SE.heal);
      if (f.events.some((e) => e.type === 'resonate' || e.type === 'timerBlast')) playSe(this, SE.firework);
      const big = f.events.some((e) => ['link', 'resonate', 'pop', 'split', 'counter', 'wake', 'sticky', 'flee', 'timerBlast', 'cover', 'shellBreak'].includes(e.type));
      this.wait(big ? WAIT.big : WAIT.result, () => this.playFrames(frames, i + 1, final, f.state));
    });
  }

  private finishRound(final: ChainState): void {
    this.s = final;
    this.runFinal = null;
    this.head?.destroy();
    this.head = null;
    this.plan = [];
    this.ally = this.firstFreeAlly();
    if (final.shutter) {
      this.message = '敵が全員ダウンした。今だ、シャッター！';
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

  /** シャッターのボタン。押すと、その瞬間を切り取って決着 */
  private showShutter(): void {
    const o = this.add.container(0, 0).setDepth(90);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0).setInteractive());
    const cy = 560;
    const ring = this.add.circle(GAME_WIDTH / 2, cy, 70, 0xffffff, 0.12).setStrokeStyle(4, 0xffffff);
    const btn = this.add.circle(GAME_WIDTH / 2, cy, 54, 0xff3b5c).setStrokeStyle(4, 0xffffff);
    o.add([ring, btn, addText(this, GAME_WIDTH / 2, cy, 'シャッター', { size: 18, bold: true }).setOrigin(0.5)]);
    o.add(addText(this, GAME_WIDTH / 2, cy + 96, '全員の動きが止まった瞬間を、切り取る', { size: 12, color: '#ffffff' }).setOrigin(0.5));
    this.tweens.add({ targets: ring, scale: 1.15, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    makePressable(btn, {
      onTap: () => {
        o.destroy();
        this.snap();
      },
    });
  }

  private snap(): void {
    playSe(this, SE.shutter);
    this.s = takeShutter(this.s);
    // 白く光って、写真の枠になる。敵は砂になって崩れる
    const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1).setOrigin(0).setDepth(95);
    this.tweens.add({ targets: flash, alpha: 0, duration: 700, onComplete: () => flash.destroy() });
    const photo = this.add.container(0, 0).setDepth(92);
    photo.add(this.add.rectangle(GAME_WIDTH / 2, ENEMY_TOP + 64, GAME_WIDTH - 10, 140, 0x6b4a20, 0.28));
    const frame = this.add.graphics();
    frame.lineStyle(10, 0xf6f1e6, 1).strokeRect(8, ENEMY_TOP - 6, GAME_WIDTH - 16, 146);
    photo.add(frame);
    const grade = shutterGrade(this.s);
    const d = new Date();
    const stamp = `'${String(d.getFullYear()).slice(2)} ${d.getMonth() + 1} ${d.getDate()}`;
    photo.add(addText(this, GAME_WIDTH - 20, ENEMY_TOP + 122, stamp, { size: 13, bold: true, color: '#ff9a3a' }).setOrigin(1, 0.5));
    for (const img of this.enemyImages.values()) {
      if (img.alpha < 0.5) continue;
      img.setTint(0xc8a878);
      this.tweens.add({ targets: img, y: img.y + 16, alpha: 0, delay: 900, duration: 1100 });
    }
    this.time.delayedCall(2200, () => {
      this.message = `切り取った！ 撮れ高 ${'★'.repeat(grade)}${'☆'.repeat(3 - grade)}（${this.s.finishRound}ラウンド目）`;
      this.busy = false;
      photo.destroy();
      this.render();
      this.showEnd();
    });
  }

  private popNumbers(events: ChainEvent[], s: ChainState): void {
    let k = 0;
    for (const ev of events) {
      if (ev.type !== 'damage' && ev.type !== 'heal') continue;
      const p = this.posOf(s, ev.to);
      if (!p) continue;
      const text = ev.type === 'heal' ? `+${ev.amount}` : `${ev.amount}${ev.weak ? ' 弱点!' : ''}`;
      const color = ev.type === 'heal' ? COLORS.heal : ev.weak ? COLORS.weak : findChainUnit(s, ev.to)?.side === 'ally' ? COLORS.allyDamage : COLORS.damage;
      const t = addText(this, p.x, p.y, text, { size: 17, bold: true, color }).setOrigin(0.5).setDepth(50).setStroke('#000000', 4);
      this.tweens.add({ targets: t, y: p.y - 28, alpha: 0, delay: k++ * 90, duration: 900, onComplete: () => t.destroy() });
    }
  }

  private posOf(s: ChainState, uid: string): { x: number; y: number } | null {
    const list = this.shownEnemies(s);
    const ei = list.findIndex((u) => u.uid === uid);
    if (ei >= 0) return { x: (GAME_WIDTH / list.length) * (ei + 0.5), y: ENEMY_TOP + 36 };
    const ai = s.allies.findIndex((u) => u.uid === uid);
    if (ai >= 0) return { x: 8 + ((GAME_WIDTH - 16) / s.allies.length) * (ai + 0.5), y: ALLY_Y + 24 };
    return null;
  }

  private showEnd(): void {
    const s = this.s;
    const win = s.outcome === 'win';
    const o = this.add.container(0, 0).setDepth(100);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05070f, 0.88).setOrigin(0).setInteractive());
    const title = !win ? '全滅…' : s.finish === 'shutter' ? '切り取った！' : '勝利！';
    o.add(addText(this, GAME_WIDTH / 2, 230, title, { size: 30, bold: true, color: win ? COLORS.accentText : '#ff8a7a' }).setOrigin(0.5));
    const grade = shutterGrade(s);
    const fled = s.enemies.filter((e) => e.gone && e.trait === 'flee').length;
    const sub = !win ? `${s.finishRound}ラウンド目で倒れた` : s.finish === 'shutter' ? `撮れ高 ${'★'.repeat(grade)}${'☆'.repeat(3 - grade)}（${s.finishRound}ラウンド目・シャッターで決着）` : `${s.finishRound}ラウンド目に全部倒した（シャッターなし）`;
    o.add(addText(this, GAME_WIDTH / 2, 276, sub, { size: 13, color: COLORS.subText }).setOrigin(0.5));
    if (fled) o.add(addText(this, GAME_WIDTH / 2, 300, `逃げられた敵：${fled}体`, { size: 12, color: '#ff9a7a' }).setOrigin(0.5));
    addButton(this, o, GAME_WIDTH / 2, 350, 300, 46, 'もう一度（同じ敵・別の手札）', { onTap: () => this.scene.restart({ trial: this.trial }) }, { size: 14 });
    const others = CHAIN_TRIALS.filter((t) => t.id !== this.trial);
    others.forEach((t, i) => {
      addButton(this, o, GAME_WIDTH / 2, 404 + i * 54, 300, 46, `ほかの試し：${t.name.replace(/（.*）/, '')}`, { onTap: () => this.scene.restart({ trial: t.id }) }, { size: 13 });
    });
    addButton(this, o, GAME_WIDTH / 2, 404 + others.length * 54, 300, 46, 'タイトルへ', { onTap: () => this.scene.start('Title') }, { size: 14 });
  }
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
    else if (ev.type === 'cancel') parts.push(ev.reason === 'down' ? `${name(ev.uid)}はダウンしていて、${f.name}は起きなかった` : ev.reason === 'time' ? `${name(ev.uid)}は時間切れで動けなかった` : `${name(ev.uid)}は倒れていて動けない`);
    else if (ev.type === 'damage') parts.push(`${name(ev.to)}に${ev.amount}${ev.weak ? '（弱点）' : ev.resist ? '（耐性）' : ''}`);
    else if (ev.type === 'heal') parts.push(`${name(ev.to)}+${ev.amount}`);
    else if (ev.type === 'mark') parts.push(`${name(ev.to)}に${ELEMENT_LABEL[ev.element]}の印`);
    else if (ev.type === 'resonate') parts.push(`${ELEMENT_LABEL[ev.element]}の印が共鳴！${ev.to.length ? `${ev.to.map(name).join('・')}にも広がる` : ''}`);
    else if (ev.type === 'pop') parts.push(`${name(ev.uid)}がはじけた！`);
    else if (ev.type === 'cover') parts.push(`${name(ev.shield)}が盾になって受けた！`);
    else if (ev.type === 'shellBreak') parts.push(`${name(ev.uid)}の殻が割れた（効かなかった）`);
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
  }
  const out = parts.filter(Boolean);
  return out.length ? out.join(' ') : '（何も起きなかった）';
}
