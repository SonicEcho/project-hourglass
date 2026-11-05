import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  availableLinks,
  chainMoveOf,
  chainOrder,
  chainPlanError,
  createChainBattle,
  findChainUnit,
  intentsBetween,
  nextStart,
  planStarts,
  runChainRound,
  shutterGrade,
  takeShutter,
  type ChainEvent,
  type ChainFrame,
  type ChainOrderEntry,
  type ChainMove,
  type ChainPlanStep,
  type ChainSource,
  type ChainState,
  type ChainUnit,
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
const TICK_MS = 380;

/** 敵の印の色（フィルムの上の段と、敵の名前の横） */
const ENEMY_COLORS = [0xff8a5a, 0x6bc8ff, 0xc89aff, 0x7ad98a];
const MARK_LABEL: Record<string, string> = { wet: '濡れ', oil: '油' };
const MARK_COLOR: Record<string, number> = { wet: 0x4aa8ff, oil: 0xd9a440 };
const TYPE_LABEL: Record<string, string> = { place: '置く', receive: '受ける', count: '数える', finish: '締める', attack: '攻撃', support: '支援', link: '連携' };
const TYPE_COLOR: Record<string, number> = { place: 0x4aa8ff, receive: 0x6ad0b0, count: 0xf2c45a, finish: 0xff7a5a, attack: 0x9aa5b1, support: 0x6dff9e, link: 0xffd700 };

type Pending = { source: ChainSource; move: ChainMove } | null;

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
  /** 実行中に見せている時刻（フィルムの再生位置） */
  /** 実行中の再生位置（フィルムの上を左から右へ動く線。描き直しても消えないよう、root の外に置く） */
  private head: Phaser.GameObjects.Rectangle | null = null;
  private enemyImages = new Map<string, Phaser.GameObjects.Image>();
  /** 実行中：このラウンドに動く順番と、済んだ行動の結果（順番の番号ごと） */
  private runOrder: ChainOrderEntry[] = [];
  private runResults = new Map<number, string>();
  /** 実行中：今動いている順番の番号（0 は実行していない） */
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
    this.runOrder = [];
    this.runResults = new Map();
    this.currentOrder = 0;
    this.actorUid = '';
    this.targetUid = '';
    this.advance = null;
    this.input.on('pointerdown', () => {
      if (this.busy && this.advance) this.advance();
    });
    this.message = '上の段は敵の予定（時刻と行動）。仲間を選んで札か技を並べると、下の段に入る。全員ダウンさせるとシャッターで決着';
    const ids = [...def.enemies.map((e) => ENEMY_ART[e.id]), ...def.allies.map((a) => ALLY_FACE[a.id]), ...Object.values(CHAIN_CARD_ART)].filter((x): x is string => !!x);
    waitImages(this, ids, () => this.render());
  }

  private firstFreeAlly(): string {
    return this.s.allies.find((a) => a.hp > 0 && !this.plan.some((p) => p.ally === a.uid))?.uid ?? '';
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
    } else if (this.currentOrder > 0) this.drawRunList(view);
  }

  /** 計画の行・敵の予定を、1行の言葉で（「ハルト：斬る → 黒電話」） */
  private orderLabel(view: ChainState, o: ChainOrderEntry): string {
    const nm = (uid?: string) => (uid ? (findChainUnit(view, uid)?.name.replace('ノイズ', '') ?? '') : '');
    if (o.kind === 'ally') {
      const step = this.plan[o.i];
      const move = step ? chainMoveOf(this.s, step) : null;
      if (!step || !move) return '';
      return `${nm(step.ally)}：${move.name}${move.target === 'enemy' ? ` → ${nm(step.target)}` : move.target === 'enemies' ? '（敵全体）' : '（仲間全体）'}`;
    }
    return `${nm(o.intent.enemy)}：${o.intent.move.name}${o.intent.move.all ? '（全体）' : ` → ${nm(o.intent.target)}`}`;
  }

  /** 実行中の、動く順の一覧（済んだ行動は結果、今の行動は光らせ、この後の行動は薄く） */
  private drawRunList(view: ChainState): void {
    const top = TAB_Y - 10;
    this.root.add(addText(this, 12, top, '動く順（番号の順。同じ時刻なら味方が先）', { size: 11, bold: true, color: COLORS.accentText }));
    const rowH = 30;
    this.runOrder.forEach((o, k) => {
      const n = k + 1;
      const y = top + 26 + k * rowH;
      if (y > GAME_HEIGHT - 60) return;
      const done = n < this.currentOrder;
      const now = n === this.currentOrder;
      const ally = o.kind === 'ally';
      const box = this.add.rectangle(GAME_WIDTH / 2, y + 10, GAME_WIDTH - 16, rowH - 4, now ? 0x3a2a10 : 0x141a30, now ? 1 : 0.9).setRounded(6);
      if (now) box.setStrokeStyle(2, COLORS.accent);
      this.root.add(box);
      this.root.add(this.add.circle(24, y + 10, 10, ally ? 0x3f7fbf : 0xbf4f4f, done ? 0.5 : 1));
      this.root.add(addText(this, 24, y + 10, String(n), { size: 11, bold: true }).setOrigin(0.5));
      const head = `時刻${o.at}　${this.orderLabel(view, o)}`;
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
    this.root.add(addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 50, '画面をタップすると次へ進む', { size: 10, color: COLORS.dimText }).setOrigin(0.5));
  }

  private drawEnemies(s: ChainState): void {
    const n = s.enemies.length;
    const colW = GAME_WIDTH / n;
    s.enemies.forEach((e, i) => {
      const cx = colW * i + colW / 2;
      const alive = e.hp > 0;
      const size = Math.min(66, colW - 12);
      const top = ENEMY_TOP;
      const color = ENEMY_COLORS[i % ENEMY_COLORS.length];
      const isTarget = this.pending?.move.target === 'enemy' && alive;
      if (this.busy && e.uid === this.actorUid) this.root.add(this.add.rectangle(cx, top + 66, colW - 6, 134, 0xff3b5c, 0.12).setStrokeStyle(3, 0xff3b5c).setRounded(8));
      if (this.busy && e.uid === this.targetUid) this.root.add(this.add.rectangle(cx, top + 66, colW - 6, 134, 0xffd84a, 0.08).setStrokeStyle(3, 0xffd84a).setRounded(8));
      if (isTarget) this.root.add(this.add.rectangle(cx, top + 66, colW - 6, 134, 0xffffff, 0.04).setStrokeStyle(2, COLORS.select).setRounded(8));
      const art = ENEMY_ART[e.defId];
      if (art && hasImage(this, art)) {
        const img = this.add.image(cx, top + size / 2 + 2, art);
        img.setScale(size / Math.max(img.width, img.height));
        if (!alive) img.setAlpha(0.15).setTint(0x606060);
        else if (e.down) img.setAngle(-14).setTint(0xb0b0ff);
        this.root.add(img);
        this.enemyImages.set(e.uid, img);
      } else this.root.add(this.add.circle(cx, top + size / 2, size / 2.4, COLORS.enemy, alive ? 1 : 0.2));
      // 名前の前に、フィルムの印と同じ色の丸と文字
      const y = top + size + 4;
      this.root.add(this.add.circle(cx - colW / 2 + 10, y + 7, 7, color));
      this.root.add(addText(this, cx - colW / 2 + 10, y + 7, String.fromCharCode(65 + i), { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      const name = addText(this, cx + 6, y, e.name.replace('ノイズ', ''), { size: 11, bold: true, color: alive ? COLORS.text : COLORS.dimText }).setOrigin(0.5, 0);
      if (name.width > colW - 26) name.setScale((colW - 26) / name.width);
      this.root.add(name);
      const bw = colW - 14;
      this.root.add(this.add.rectangle(cx - bw / 2, y + 20, bw, 4, COLORS.barBg).setOrigin(0, 0.5));
      this.root.add(this.add.rectangle(cx - bw / 2, y + 20, bw * (e.hp / e.maxHp), 4, COLORS.hp).setOrigin(0, 0.5));
      this.root.add(addText(this, cx - bw / 2, y + 24, `${e.hp}`, { size: 9, color: COLORS.subText }));
      // 弱点と特徴
      const w = e.weak[0];
      let tx = cx - bw / 2 + 26;
      if (w) {
        this.root.add(this.add.rectangle(tx + 12, y + 31, 26, 13, ELEMENT_COLOR[w]).setRounded(6));
        this.root.add(addText(this, tx + 12, y + 31, `弱${ELEMENT_LABEL[w]}`, { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
        tx += 28;
      }
      if (e.trait) {
        const t = CHAIN_TRAIT_TEXT[e.trait];
        const tag = addText(this, tx + 2, y + 31, t.name + (e.trait === 'gear' && alive ? ` ${e.hits}/${CHAIN_RULES.gearHits}` : ''), { size: 9, bold: true, color: '#ffe0a0' }).setOrigin(0, 0.5);
        const room = cx + colW / 2 - 4 - (tx + 2);
        if (tag.width > room) tag.setScale(room / tag.width);
        this.root.add(tag);
      }
      if (!alive) return;
      // 印
      e.marks.forEach((m, k) => {
        const mx = cx + size / 2 - 4 - k * 28;
        this.root.add(this.add.rectangle(mx, top + 8, 26, 14, MARK_COLOR[m]).setRounded(7));
        this.root.add(addText(this, mx, top + 8, MARK_LABEL[m], { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      });
      if (e.down) this.root.add(addText(this, cx, top + size / 2, 'ダウン', { size: 14, bold: true, color: COLORS.weak }).setOrigin(0.5).setAngle(-10).setStroke('#000000', 3));
      // 予定
      const intent = s.intents.find((it) => it.enemy === e.uid);
      if (intent) {
        const tgt = intent.target ? findChainUnit(s, intent.target)?.name : '';
        const label = `${intent.at}：${intent.move.name}${intent.move.all ? '（全体）' : ` → ${tgt}`}`;
        const tag = addText(this, cx, y + 46, label, { size: 10, bold: true, color: intent.move.all ? '#ffd0a0' : '#dfe6ff' }).setOrigin(0.5);
        if (tag.width > colW - 8) tag.setScale((colW - 8) / tag.width);
        const canceled = e.down;
        this.root.add(this.add.rectangle(cx, y + 46, Math.min(colW - 4, tag.displayWidth + 10), 16, intent.move.all ? 0x7a2a10 : 0x24305a, canceled ? 0.3 : 1).setStrokeStyle(1, intent.move.all ? 0xff9a5a : 0x6b7fc0).setRounded(8));
        if (canceled) tag.setAlpha(0.4);
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
    const d = this.s.def.enemies.find((x) => x.id === e.defId);
    const t = e.trait ? CHAIN_TRAIT_TEXT[e.trait] : null;
    const resist = e.resist.length ? `・耐性 ${e.resist.map((x) => ELEMENT_LABEL[x]).join('・')}` : '';
    this.message = `${e.name}：弱点 ${e.weak.map((x) => ELEMENT_LABEL[x]).join('・')}${resist}。${t ? `【${t.name}】${t.text}。` : ''}癖：${(d?.pattern ?? []).map((p) => `${p.name}（時刻${p.at}${p.all ? '・全体' : ''}）`).join(' → ')}`;
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
    // 動く順の番号（同じ時刻なら味方が先）。実行中は、済んだ番号を薄く、今の番号を光らせる
    const order = this.busy && this.runOrder.length ? this.runOrder : chainOrder(this.s, this.plan);
    const numOf = (pred: (o: ChainOrderEntry) => boolean) => order.findIndex(pred) + 1;
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
    s.intents.forEach((it) => {
      const i = s.enemies.findIndex((e) => e.uid === it.enemy);
      const e = s.enemies[i];
      if (!e || e.hp <= 0) return;
      const k = (slots[it.at] = (slots[it.at] ?? 0) + 1) - 1;
      const cx = x0 + CELL * it.at + CELL / 2;
      const cy = top + 38 + k * 15 - 4;
      const color = ENEMY_COLORS[i % ENEMY_COLORS.length];
      const c = this.add.circle(cx, cy, 9, color, e.down ? 0.25 : 1).setStrokeStyle(it.move.all ? 2.5 : 1, it.move.all ? 0xff5a3a : 0x000000);
      r.add(c);
      r.add(addText(this, cx, cy, String.fromCharCode(65 + i), { size: 10, bold: true, color: '#101010' }).setOrigin(0.5).setAlpha(e.down ? 0.4 : 1));
      if (it.move.all) r.add(addText(this, cx + 9, cy - 9, '全', { size: 8, bold: true, color: '#ff9a7a' }).setOrigin(0.5));
      if (e.down) r.add(addText(this, cx, cy, '×', { size: 16, bold: true, color: COLORS.weak }).setOrigin(0.5));
      badge(cx - 11, cy - 9, numOf((o) => o.kind === 'enemy' && o.intent.enemy === it.enemy));
    });
    // 下の段：並べた行動（重さの分の長さ）
    const starts = planStarts(s, this.plan);
    this.plan.forEach((step, i) => {
      const move = chainMoveOf(this.s, step);
      if (!move) return;
      const u = findChainUnit(s, step.ally)!;
      const at = starts[i];
      const w = Math.min(move.weight, len - at);
      const bx = x0 + CELL * at + 1;
      const color = ALLY_COLOR[u.defId] ?? COLORS.ally;
      const isLink = step.source.kind === 'link';
      const bar = this.add.rectangle(bx, top + 80, CELL * w - 2, 34, color, 0.85).setOrigin(0, 0.5).setRounded(5);
      if (isLink) bar.setStrokeStyle(2.5, 0xffd700);
      r.add(bar);
      r.add(addText(this, bx + 14, top + 70, u.name, { size: 9, bold: true, color: '#101010' }));
      badge(bx + 7, top + 70 + 6, numOf((o) => o.kind === 'ally' && o.i === i));
      const nm = addText(this, bx + 3, top + 84, move.name, { size: 10, bold: true, color: '#101010' });
      if (nm.width > CELL * w - 6) nm.setScale((CELL * w - 6) / nm.width);
      r.add(nm);
    });
    // 次に並べる時刻
    if (!this.busy && s.outcome === 'ongoing' && !s.shutter) {
      const at = nextStart(this.s, this.plan);
      if (at < len && this.ally) {
        const cx = x0 + CELL * at;
        r.add(this.add.rectangle(cx + 1, top + 80, 3, 36, COLORS.accent).setOrigin(0, 0.5));
      } else if (at >= len) r.add(addText(this, x0, top + 104, '時間はいっぱい', { size: 9, color: '#ff9a7a' }).setOrigin(0, 0.5));
    }
  }

  private drawAllies(s: ChainState): void {
    const colW = (GAME_WIDTH - 16) / s.allies.length;
    const starts = planStarts(this.s, this.plan);
    s.allies.forEach((u, i) => {
      const x = 8 + colW * i + colW / 2;
      const y = ALLY_Y + 38;
      const planned = this.plan.findIndex((p) => p.ally === u.uid);
      const sel = !this.busy && this.ally === u.uid;
      const box = this.add.rectangle(x, y, colW - 6, 76, 0x1d2544, 0.95).setRounded(8);
      const acting = this.busy && this.actorUid === u.uid;
      const aimed = this.busy && this.targetUid === u.uid;
      box.setStrokeStyle(sel || acting || aimed ? 3 : 1, acting ? 0xff3b5c : aimed ? 0xffd84a : sel ? COLORS.accent : COLORS.border);
      this.root.add(box);
      const id = ALLY_FACE[u.defId];
      if (id && hasImage(this, id)) this.root.add(faceImage(this, id, x - colW / 2 + 24, y - 14, 15, FACE_CROPS[u.defId]).setAlpha(u.hp > 0 ? 1 : 0.3));
      this.root.add(addText(this, x - colW / 2 + 44, y - 30, u.name, { size: 12, bold: true, color: u.hp > 0 ? toCss(ALLY_COLOR[u.defId] ?? COLORS.ally) : COLORS.dimText }));
      const role = s.def.allies.find((a) => a.id === u.defId)?.role ?? '';
      this.root.add(addText(this, x - colW / 2 + 44, y - 13, role, { size: 9, color: COLORS.subText }));
      const bw = colW - 20;
      this.root.add(this.add.rectangle(x - bw / 2, y + 8, bw, 5, COLORS.barBg).setOrigin(0, 0.5));
      this.root.add(this.add.rectangle(x - bw / 2, y + 8, bw * (u.hp / u.maxHp), 5, u.hp < u.maxHp * 0.3 ? COLORS.hpLow : COLORS.hp).setOrigin(0, 0.5));
      this.root.add(addText(this, x - bw / 2, y + 12, `${u.hp}/${u.maxHp}`, { size: 9 }));
      const turn = planned >= 0 ? chainOrder(this.s, this.plan).findIndex((o) => o.kind === 'ally' && o.i === planned) + 1 : 0;
      const state = u.hp <= 0 ? '倒れている' : planned >= 0 ? `動く順 ${turn}・時刻${starts[planned]}` : sel ? '← 並べる人' : 'タップで選ぶ';
      this.root.add(addText(this, x, y + 30, state, { size: 9, bold: planned >= 0 || sel, color: planned >= 0 ? '#9ad0ff' : sel ? COLORS.accentText : COLORS.dimText }).setOrigin(0.5));
      const hit = this.add.rectangle(x, y, colW - 6, 76, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, { onTap: () => this.pickAlly(u.uid) });
    });
  }

  private drawTabs(): void {
    const w = 110;
    const links = this.ally ? availableLinks(this.s, this.plan, this.ally) : [];
    addButton(this, this.root, 8 + w / 2, TAB_Y, w, 28, `手札（${this.s.hand.length}枚）`, { onTap: () => this.switchTab('cards') }, { size: 12, fill: this.tab === 'cards' ? 0x2f4f8f : 0x1d2544 });
    addButton(this, this.root, 16 + w * 1.5, TAB_Y, w, 28, links.length ? '技・連携技 ★' : '技', { onTap: () => this.switchTab('moves') }, { size: 12, fill: this.tab === 'moves' ? 0x2f4f8f : 0x1d2544, stroke: links.length ? 0xffd700 : undefined });
    const name = this.ally ? findChainUnit(this.s, this.ally)?.name : '';
    this.root.add(addText(this, GAME_WIDTH - 10, TAB_Y, name ? `${name}の行動` : '全員並べた', { size: 11, bold: true, color: COLORS.accentText }).setOrigin(1, 0.5));
  }

  private switchTab(tab: 'cards' | 'moves'): void {
    this.tab = tab;
    this.pending = null;
    this.render();
  }

  /** 選べる札・技を並べる（長押しで説明） */
  private drawOptions(): void {
    const s = this.s;
    const items: { source: ChainSource; move: ChainMove; art?: string; used?: boolean }[] = [];
    if (this.tab === 'cards') {
      s.hand.forEach((id, index) => {
        const used = this.plan.some((p) => p.source.kind === 'card' && p.source.index === index);
        items.push({ source: { kind: 'card', index }, move: s.def.cards[id], art: CHAIN_CARD_ART[id], used });
      });
    } else if (this.ally) {
      const me = findChainUnit(s, this.ally);
      const def = s.def.allies.find((a) => a.id === me?.defId);
      for (const m of def?.moves ?? []) items.push({ source: { kind: 'move', moveId: m.id }, move: m });
      for (const l of availableLinks(s, this.plan, this.ally)) items.push({ source: { kind: 'link', linkId: l.id }, move: l.move });
    }
    const w = 70;
    const h = 150;
    const gap = (GAME_WIDTH - 16 - w * 5) / 4;
    items.slice(0, 5).forEach((it, i) => {
      const x = 8 + i * (w + gap) + w / 2;
      const sel = this.pending && sameSource(this.pending.source, it.source);
      const y = HAND_Y + h / 2 - (sel ? 8 : 0);
      const isLink = it.move.type === 'link';
      const c = this.add.rectangle(x, y, w, h, it.used ? 0x55565c : isLink ? 0xfff4c2 : 0xfdfbf6).setRounded(6);
      if (sel) c.setStrokeStyle(3, COLORS.select);
      else if (isLink) c.setStrokeStyle(2, 0xffd700);
      this.root.add(c);
      const top = y - h / 2;
      if (it.art && hasImage(this, it.art)) {
        const img = this.add.image(x, top + 26, it.art);
        const src = this.textures.get(it.art).getSourceImage();
        const sc = Math.max(w / src.width, 50 / src.height);
        img.setScale(sc).setCrop((src.width - w / sc) / 2, (src.height - 50 / sc) / 2, w / sc, 50 / sc);
        if (it.used) img.setAlpha(0.4);
        this.root.add(img);
      } else this.root.add(this.add.rectangle(x, top + 26, w, 50, isLink ? 0xd9a440 : 0x2b3560));
      this.root.add(this.add.rectangle(x - w / 2 + 18, top + 8, 34, 14, TYPE_COLOR[it.move.type]).setRounded(4));
      this.root.add(addText(this, x - w / 2 + 18, top + 8, TYPE_LABEL[it.move.type], { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      this.root.add(addText(this, x, top + 62, it.move.name, { size: 11, bold: true, color: '#222222', align: 'center', wrap: w - 4 }).setOrigin(0.5));
      this.root.add(addText(this, x, top + 80, `重さ ${it.move.weight}`, { size: 10, bold: true, color: '#7a4a10' }).setOrigin(0.5));
      this.root.add(addText(this, x, top + 92, shortText(it.move), { size: 9, color: '#334', align: 'center', wrap: w - 6 }).setOrigin(0.5, 0));
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
    this.root.add(addText(this, GAME_WIDTH / 2, HAND_Y + h + 14, '札・技は1回タップで説明、もう1回（敵の技は敵をタップ）で並べる。長押しでも説明', { size: 9, color: COLORS.dimText }).setOrigin(0.5));
    this.drawHelp();
  }

  /** 札のつながり方の早見 */
  private drawHelp(): void {
    const y = HAND_Y + 190;
    const lines = [
      '濡れ ＋ 雷 → 濡れた敵みんなに伝わる　／　油 ＋ 火 → 爆発して敵全体がよろける',
      '受ける札は直前の仲間の攻撃を使う　／　数える札は、先に動いた仲間が多いほど強い',
      '連携技：あかりの火・氷のすぐ後にハルト、ハルトの物理のすぐ後にみお（間に敵が動くと切れる）',
    ];
    this.root.add(this.add.rectangle(GAME_WIDTH / 2, y + 26, GAME_WIDTH - 16, 62, 0x141a30, 0.9).setRounded(6));
    lines.forEach((l, i) => this.root.add(addText(this, 14, y + 4 + i * 18, l, { size: 9, color: '#c8d0ec', wrap: GAME_WIDTH - 28 })));
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
    if (this.plan.some((p) => p.ally === uid)) {
      this.message = `${u.name}は並べてある。外すなら「1つ戻す」で後ろから外す`;
      this.render();
      return;
    }
    this.ally = uid;
    this.pending = null;
    const links = availableLinks(this.s, this.plan, uid);
    this.message = links.length ? `${u.name}：連携技「${links.map((l) => l.move.name).join('・')}」が使える（技のタブ）` : `${u.name}の行動を選ぶ。次の時刻は${nextStart(this.s, this.plan)}`;
    this.render();
  }

  private pickOption(source: ChainSource, move: ChainMove): void {
    if (this.busy || !this.ally) return;
    if (this.pending && sameSource(this.pending.source, source)) {
      if (move.target !== 'enemy') this.place({ ally: this.ally, source });
      else {
        this.message = `${move.name}：相手の敵をタップ`;
        this.render();
      }
      return;
    }
    this.pending = { source, move };
    const at = nextStart(this.s, this.plan);
    const between = this.linkWarning(source, at);
    this.message = `【${TYPE_LABEL[move.type]}】${move.name}（重さ${move.weight}・時刻${at}〜）：${move.text}${move.target === 'enemy' ? '　→ 敵をタップ' : '　→ もう1回タップで並べる'}${between}`;
    this.render();
  }

  /** 連携技の2人の間に、敵の予定が入る時の注意 */
  private linkWarning(source: ChainSource, at: number): string {
    if (source.kind !== 'link' || this.plan.length === 0) return '';
    const from = planStarts(this.s, this.plan)[this.plan.length - 1];
    const mid = intentsBetween(this.s, from, at).filter((i) => !findChainUnit(this.s, i.enemy)?.down);
    return mid.length ? `　※間に${mid.map((i) => findChainUnit(this.s, i.enemy)?.name.replace('ノイズ', '')).join('・')}が動く予定。先にダウンさせないと切れる` : '';
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
    this.message = `${findChainUnit(this.s, step.ally)?.name}：${move.name}を並べた。${this.ally ? `次は${findChainUnit(this.s, this.ally)?.name}（時刻${next}）` : '全員並べた。「実行」で動き出す'}`;
    if (this.ally && availableLinks(this.s, this.plan, this.ally).length) this.message += '。連携技が使える（技のタブ ★）';
    this.render();
  }

  private undo(): void {
    if (this.busy || this.plan.length === 0) return;
    const last = this.plan.pop()!;
    this.ally = last.ally;
    this.pending = null;
    this.message = `${findChainUnit(this.s, last.ally)?.name}の行動を外した`;
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

  private execute(): void {
    if (this.busy || this.plan.length === 0) return;
    const { state, frames } = runChainRound(this.s, this.plan);
    this.runOrder = chainOrder(this.s, this.plan);
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
      const b = this.posOf(view, p.to);
      if (!a || !b) return;
      const c = p.heal ? 0x6dff9e : p.from === f.uid ? color : 0xffd84a;
      const dot = this.add.circle(a.x, a.y, 7, c, 1).setStrokeStyle(2, 0xffffff).setDepth(41);
      this.tweens.add({
        targets: dot,
        x: b.x,
        y: b.y,
        delay: 200 + k * 90,
        duration: 380,
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
      else this.moveHead(CHAIN_RULES.roundLen - 0.5, () => this.wait(300, done));
      return;
    }
    const f = frames[i];
    // 再生位置がその行動の時刻に来るまで、線を進める
    if (this.head && this.head.x < FILM_X + CELL * f.at + CELL / 2 - 1) {
      this.moveHead(f.at, () => this.playFrames(frames, i, final, before));
      return;
    }
    const entry = this.runOrder[f.order - 1];
    const label = entry ? this.orderLabel(before, entry) : `${f.name}`;
    this.currentOrder = f.order;
    this.actorUid = f.uid;
    this.targetUid = f.target ?? '';
    const canceled = f.events.some((e) => e.type === 'cancel');
    const result = describe(f, before);
    if (canceled) {
      this.runResults.set(f.order, result);
      this.message = `${f.order}番目（時刻${f.at}）　${label}\n${result}`;
      this.render(f.state);
      this.wait(1300, () => this.playFrames(frames, i + 1, final, f.state));
      return;
    }
    this.message = `${f.order}番目（時刻${f.at}）　${label}`;
    this.render(before);
    this.flyEffects(f, before);
    this.wait(800, () => {
      this.runResults.set(f.order, result);
      this.message = `${f.order}番目（時刻${f.at}）　${label}\n${result}`;
      this.render(f.state);
      this.popNumbers(f.events, f.state);
      if (f.events.some((e) => e.type === 'damage')) playSe(this, f.events.some((e) => e.type === 'damage' && e.weak) ? SE.slash : SE.hit);
      if (f.events.some((e) => e.type === 'heal')) playSe(this, SE.heal);
      if (f.events.some((e) => e.type === 'blast')) playSe(this, SE.firework);
      const big = f.events.some((e) => e.type === 'link' || e.type === 'blast' || e.type === 'spread' || e.type === 'reflect' || e.type === 'pop');
      this.wait(big ? 2000 : 1500, () => this.playFrames(frames, i + 1, final, f.state));
    });
  }

  private finishRound(final: ChainState): void {
    this.s = final;
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
    const ei = s.enemies.findIndex((u) => u.uid === uid);
    if (ei >= 0) return { x: (GAME_WIDTH / s.enemies.length) * (ei + 0.5), y: ENEMY_TOP + 36 };
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
    o.add(addText(this, GAME_WIDTH / 2, 250, title, { size: 30, bold: true, color: win ? COLORS.accentText : '#ff8a7a' }).setOrigin(0.5));
    const grade = shutterGrade(s);
    const sub = !win ? `${s.finishRound}ラウンド目で倒れた` : s.finish === 'shutter' ? `撮れ高 ${'★'.repeat(grade)}${'☆'.repeat(3 - grade)}（${s.finishRound}ラウンド目・シャッターで決着）` : `${s.finishRound}ラウンド目に全部倒した（シャッターなし）`;
    o.add(addText(this, GAME_WIDTH / 2, 300, sub, { size: 13, color: COLORS.subText }).setOrigin(0.5));
    addButton(this, o, GAME_WIDTH / 2, 400, 280, 50, 'もう一度（同じ敵・別の手札）', { onTap: () => this.scene.restart({ trial: this.trial }) }, { size: 14 });
    CHAIN_TRIALS.filter((t) => t.id !== this.trial).forEach((t, i) => {
      addButton(this, o, GAME_WIDTH / 2, 462 + i * 58, 280, 50, `ほかの試し：${t.name}`, { onTap: () => this.scene.restart({ trial: t.id }) }, { size: 13 });
    });
    addButton(this, o, GAME_WIDTH / 2, 462 + (CHAIN_TRIALS.length - 1) * 58, 280, 50, 'タイトルへ', { onTap: () => this.scene.start('Title') }, { size: 14 });
  }
}

function sameSource(a: ChainSource, b: ChainSource): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'card' && b.kind === 'card') return a.index === b.index;
  if (a.kind === 'move' && b.kind === 'move') return a.moveId === b.moveId;
  if (a.kind === 'link' && b.kind === 'link') return a.linkId === b.linkId;
  return false;
}

/** 札の小さい説明（2〜3行） */
function shortText(m: ChainMove): string {
  const e = m.effect;
  const where = m.target === 'enemies' ? '敵全体' : m.target === 'allies' ? '仲間全体' : '敵1体';
  if (e.kind === 'mark') return `${where}に${MARK_LABEL[e.mark]}`;
  if (e.kind === 'wind') return '直前の攻撃を全体に';
  if (e.kind === 'layer') return '直前と同じ属性で2倍';
  if (e.kind === 'heal') return '仲間全体を回復';
  const el = e.bestOf ? e.bestOf.map((x) => ELEMENT_LABEL[x]).join('か') : ELEMENT_LABEL[e.element];
  if (e.hitsPerActed) return `${where}に${el}。動いた数+1回`;
  if (e.perActed) return `${where}に${el}。動いた数で強く`;
  if (e.perMark) return `${where}に${el}。印で強く`;
  if (e.downMult) return `${where}に${el}。ダウンに2倍`;
  return `${where}に${el}`;
}

/** そのコマで起きたことを、1〜2行で */
function describe(f: ChainFrame, before: ChainState): string {
  const name = (uid: string) => (findChainUnit(f.state, uid) ?? findChainUnit(before, uid))?.name.replace('ノイズ', '') ?? uid;
  const parts: string[] = [];
  for (const ev of f.events) {
    if (ev.type === 'act') continue;
    else if (ev.type === 'cancel') parts.push(ev.reason === 'down' ? `${name(ev.uid)}はダウンしていて、${f.name}は起きなかった` : `${name(ev.uid)}は倒れていて動けない`);
    else if (ev.type === 'damage') parts.push(`${name(ev.to)}に${ev.amount}${ev.weak ? '（弱点）' : ev.resist ? '（耐性）' : ''}`);
    else if (ev.type === 'heal') parts.push(`${name(ev.to)}+${ev.amount}`);
    else if (ev.type === 'mark') parts.push(`${name(ev.to)}に${MARK_LABEL[ev.mark]}`);
    else if (ev.type === 'spread') parts.push('濡れた敵に雷が伝わる！');
    else if (ev.type === 'blast') parts.push('油に火がついて爆発！');
    else if (ev.type === 'reflect') parts.push(`${name(ev.from)}の鏡がはね返した！`);
    else if (ev.type === 'pop') parts.push(`${name(ev.uid)}がはじけた！`);
    else if (ev.type === 'down') parts.push(`${name(ev.uid)}ダウン`);
    else if (ev.type === 'defeat') parts.push(`${name(ev.uid)}を倒した`);
    else if (ev.type === 'fizzle') parts.push(ev.reason === 'linkBroken' ? '間に敵が動いて、連携が切れた' : '直前の攻撃がなくて不発');
    else if (ev.type === 'link') parts.push(`連携技「${ev.name}」！`);
    else if (ev.type === 'shutterReady') parts.push('全員ダウン！');
  }
  return parts.length ? parts.join(' ') : '（何も起きなかった）';
}
