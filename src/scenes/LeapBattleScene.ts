import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  createLeapBattle,
  leapMoveOf,
  leapOrder,
  leapPlanError,
  living,
  runLeapRound,
  usedCards,
  type LeapEvent,
  type LeapFrame,
  type LeapMove,
  type LeapPlanStep,
  type LeapSource,
  type LeapState,
} from '../core';
import { ALLY_FACE, ENEMY_ART, FACE_CROP, FACE_CROPS, LEAP_RULES, LEAP_TRIALS, SE } from '../data';
import { hasImage } from '../assets/loader';
import { playSe } from '../audio/sound';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, RENDER_SCALE } from '../ui/theme';
import { addText, makePressable } from '../ui/widgets';
import { waitImages } from '../ui/waitImages';

// 試し：組んで跳ねる戦闘の画面（段階157。docs/milestones/M3_battle_rethink.md の 10.・12.）。
// デバッグメニューから開く。仕組みは src/core/leap.ts、数値は src/data/leapTrial.ts

export interface LeapBattleData {
  trial: string;
  seed?: number;
}

const RED = 0xff2d55;
const YELLOW = 0xffd23f;
const GOLD = 0xffcf5a;
const KIND_COLOR: Record<string, number> = { attack: 0x3a8dff, addon: GOLD, wet: 0x19b37a, heal: 0x19b37a, hourglass: 0x19b37a, counter: 0x19b37a };
const KIND_LABEL: Record<string, string> = { attack: 'アタック', addon: '添える', wet: 'サポート', heal: 'サポート', hourglass: 'サポート', counter: 'サポート' };

/** 画面の割り付け */
const STAGE_Y = 40;
const ART_Y = 150;
const MSG_Y = 262;
const ORDER_Y = 304;
const ALLY_Y = 336;
const ALLY_H = 78;
const TAB_Y = 428;
const CARD_Y = 460;
const CARD_W = 72;
const CARD_H = 150;
const CMD_Y = 772;

type Pending = { source: LeapSource; move: LeapMove } | null;

export class LeapBattleScene extends Phaser.Scene {
  private s!: LeapState;
  private trial = '';
  private root!: Phaser.GameObjects.Container;
  private fx!: Phaser.GameObjects.Container;
  private plan: LeapPlanStep[] = [];
  private ally = '';
  private pending: Pending = null;
  private tab: 'cards' | 'moves' = 'cards';
  private message = '';
  private busy = false;
  private advance: (() => void) | null = null;
  private actorUid = '';

  constructor() {
    super('LeapBattle');
  }

  create(data: LeapBattleData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f22).setOrigin(0);
    this.trial = data.trial;
    const def = LEAP_TRIALS.find((t) => t.id === data.trial) ?? LEAP_TRIALS[0];
    this.s = createLeapBattle(def, LEAP_RULES, data.seed ?? Date.now() % 100000);
    this.root = this.add.container(0, 0);
    this.fx = this.add.container(0, 0).setDepth(50);
    this.plan = [];
    this.pending = null;
    this.tab = 'cards';
    this.busy = false;
    this.advance = null;
    this.actorUid = '';
    this.ally = this.nextFreeAlly();
    this.message = '仲間を選び、技か札を選ぶ。添える札は、選んだ仲間の行動に重ねる（手番は使わない）。連続攻撃は止まっている敵に全段当たる';
    this.input.on('pointerdown', () => {
      if (this.busy && this.advance) this.advance();
    });
    const ids = [...def.enemies.map((e) => ENEMY_ART[e.id]), ...def.allies.map((a) => ALLY_FACE[a.id])].filter((x): x is string => !!x);
    waitImages(this, ids, () => this.render());
  }

  // ---------- 小さな部品 ----------

  private para(x: number, y: number, w: number, h: number, color: number, alpha = 1, slant = 8, stroke?: { w: number; color: number }): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const pts = [new Phaser.Math.Vector2(x + slant, y), new Phaser.Math.Vector2(x + w, y), new Phaser.Math.Vector2(x + w - slant, y + h), new Phaser.Math.Vector2(x, y + h)];
    g.fillStyle(color, alpha).fillPoints(pts, true);
    if (stroke) g.lineStyle(stroke.w, stroke.color, 1).strokePoints(pts, true);
    return g;
  }

  private sticker(x: number, y: number, text: string, bg: number, fg: string, angle: number, size = 10): Phaser.GameObjects.Container {
    const t = addText(this, 0, 0, text, { size, bold: true, color: fg }).setOrigin(0.5);
    const box = this.add.rectangle(2, 2, t.width + 10, t.height + 4, 0x000000, 0.8);
    const face = this.add.rectangle(0, 0, t.width + 10, t.height + 4, bg);
    return this.add.container(x, y, [box, face, t]).setAngle(angle);
  }

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

  private button(x: number, y: number, w: number, h: number, label: string, onTap: () => void, opt: { go?: boolean; enabled?: boolean; size?: number; into?: Phaser.GameObjects.Container } = {}): void {
    const on = opt.enabled !== false;
    const r = opt.into ?? this.root;
    r.add(this.para(x + 4, y + 4, w, h, 0x000000, 0.7, 12));
    r.add(this.para(x, y, w, h, opt.go ? (on ? RED : 0x5a2030) : 0x1a2040, on ? 1 : 0.6, 12));
    const t = addText(this, x + w / 2, y + h / 2, label, { size: opt.size ?? 14, bold: true, color: on ? '#ffffff' : '#5a6280' }).setOrigin(0.5);
    r.add(t);
    if (!on) return;
    const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001);
    r.add(hit);
    makePressable(hit, { onTap });
  }

  private allyName(uid: string): string {
    return this.s.allies.find((a) => a.uid === uid)?.name ?? '';
  }

  private unitName(s: LeapState, uid: string): string {
    return [...s.allies, ...s.enemies].find((u) => u.uid === uid)?.name ?? '';
  }

  private nextFreeAlly(): string {
    return living(this.s.allies).find((a) => !this.plan.some((p) => p.ally === a.uid))?.uid ?? '';
  }

  private enemyX(s: LeapState, uid: string): number {
    const list = s.enemies;
    const i = list.findIndex((e) => e.uid === uid);
    return (GAME_WIDTH / list.length) * (i + 0.5);
  }

  private allyX(uid: string): number {
    const i = this.s.allies.findIndex((a) => a.uid === uid);
    const colW = (GAME_WIDTH - 16) / this.s.allies.length;
    return 8 + colW * i + colW / 2;
  }

  // ---------- 描く ----------

  private render(view: LeapState = this.s): void {
    this.root.removeAll(true);
    this.root.add(addText(this, 12, 18, `● ROUND ${String(view.round).padStart(2, '0')}`, { size: 15, bold: true, color: '#ff6b81' }).setOrigin(0, 0.5));
    this.root.add(addText(this, GAME_WIDTH - 12, 18, view.def.name, { size: 12, bold: true, color: '#c9d0ea' }).setOrigin(1, 0.5));
    this.drawEnemies(view);
    this.drawMessage();
    this.drawOrder(view);
    this.drawAllies(view);
    if (!this.busy && view.outcome === 'ongoing') {
      this.drawTabs();
      this.drawOptions();
      this.drawCommands();
    }
  }

  /** 今の計画を最後の仲間の行動まで動かした時の、敵の様子（全段・反応・弱点の印に使う。数字は出さない） */
  private previewState(): LeapState {
    if (this.plan.length === 0) return this.s;
    const r = runLeapRound(this.s, this.plan);
    const lastAlly = [...r.frames].reverse().find((f) => this.s.allies.some((a) => a.uid === f.uid));
    return lastAlly?.state ?? this.s;
  }

  private drawEnemies(view: LeapState): void {
    const r = this.root;
    r.add(this.add.rectangle(0, STAGE_Y, GAME_WIDTH, MSG_Y - STAGE_Y - 8, 0x141a35).setOrigin(0));
    const pre = !this.busy && this.pending ? this.previewState() : null;
    const foes = view.enemies;
    const colW = GAME_WIDTH / foes.length;
    foes.forEach((e, i) => {
      const cx = colW * (i + 0.5);
      const alive = e.hp > 0;
      const art = ENEMY_ART[e.defId];
      const size = foes.length === 1 ? 150 : 96;
      if (art && hasImage(this, art)) {
        const img = this.add.image(cx, ART_Y, art);
        const src = this.textures.get(art).getSourceImage() as { width: number; height: number };
        img.setScale(size / Math.max(src.width, src.height)).setAlpha(alive ? 1 : 0.15);
        if (e.stopped && alive) img.setTint(0x9aa7ff);
        r.add(img);
      } else r.add(this.add.circle(cx, ART_Y, size / 2.4, 0x6a5acd, alive ? 1 : 0.2));
      if (this.actorUid === e.uid) r.add(this.add.circle(cx, ART_Y, size / 2, RED, 0.18));
      // 名前・HP
      r.add(addText(this, cx, ART_Y + size / 2 + 6, e.name, { size: 11, bold: true, color: alive ? '#ffffff' : '#5a6280' }).setOrigin(0.5, 0));
      const bw = Math.min(colW - 16, 120);
      r.add(this.add.rectangle(cx - bw / 2, ART_Y + size / 2 + 24, bw, 5, 0x222838).setOrigin(0, 0.5));
      if (alive) r.add(this.add.rectangle(cx - bw / 2, ART_Y + size / 2 + 24, Math.max(2, bw * (e.hp / e.maxHp)), 5, 0xff5470).setOrigin(0, 0.5));
      r.add(addText(this, cx, ART_Y + size / 2 + 32, `${e.hp}/${e.maxHp}${e.weak.length ? `　弱点 ${e.weak.map((w) => ELEMENT_LABEL[w]).join('')}` : ''}${e.heavy ? '　重い' : ''}`, { size: 9, color: '#9aa3c0' }).setOrigin(0.5, 0));
      if (!alive) return;
      // 予告（何を・誰に・何発。先制は赤）
      const intent = view.intents.find((x) => x.enemy === e.uid);
      if (intent) {
        const mv = intent.move;
        const label = `${mv.first ? '先制 ' : ''}${mv.name} ${mv.power}${mv.hits ? `×${mv.hits}` : ''} → ${mv.all ? '全員' : this.unitName(view, intent.target ?? '')}`;
        r.add(this.sticker(cx, STAGE_Y + 14, label, mv.first ? RED : 0xffffff, mv.first ? '#ffffff' : '#000000', -2, 9));
      }
      // 状態のシール
      const chips: [string, number][] = [];
      if (e.stopped) chips.push([e.stopped === 'stun' ? 'しびれ' : e.stopped === 'stagger' ? 'よろけ' : 'ダウン', YELLOW]);
      if (e.wet) chips.push(['濡れ', 0x6bc8ff]);
      if (e.frozen) chips.push(['凍り', 0xbfe9ff]);
      if (e.sand) chips.push([`砂 ${e.sand}`, 0xe8c27a]);
      chips.forEach(([t, c], k) => r.add(this.sticker(cx - colW / 2 + 30, STAGE_Y + 40 + k * 18, t, c, '#000000', -4, 9)));
      // 選んでいる行動の印（数字は出さない）
      if (pre && this.pending) {
        const p = pre.enemies.find((x) => x.uid === e.uid);
        const mv = this.pending.move;
        const marks: string[] = [];
        if (p && p.hp > 0 && mv.kind === 'attack') {
          if ((mv.hits ?? 1) > LEAP_RULES.movingHits) marks.push(p.stopped ? '全段！' : `${LEAP_RULES.movingHits}発だけ`);
          if (p.wet && mv.element === 'thunder') marks.push('×2 しびれ');
          if (p.frozen && (mv.element ?? 'physical') === 'physical') marks.push('×2 割る');
          if (p.weak.includes(mv.element ?? 'physical')) marks.push('×1.5 弱点');
        }
        if (p && mv.kind === 'hourglass') marks.push(`砂 ${p.sand}粒`);
        marks.forEach((t, k) => r.add(this.sticker(cx, ART_Y - 20 + k * 20, t, t.includes('だけ') ? 0x5a6280 : YELLOW, '#000000', -6, 12)));
      }
      const hit = this.add.rectangle(cx, ART_Y, colW, size + 30, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, {
        onTap: () => this.pickEnemy(e.uid),
        onLongPress: () => {
          const d = view.def.enemies.find((x) => x.id === e.defId);
          this.message = `${e.name}：HP ${e.hp}/${e.maxHp}。${e.weak.length ? `弱点 ${e.weak.map((w) => ELEMENT_LABEL[w]).join('・')}。` : '弱点なし。'}${e.heavy ? '重い（よろけない）。' : ''}行動：${d?.pattern.map((p) => `${p.first ? '先制 ' : ''}${p.name}${p.hits ? `${p.power}×${p.hits}` : p.power}${p.all ? '（全体）' : ''}`).join(' → ')}`;
          this.render();
        },
      });
    });
  }

  private drawMessage(): void {
    this.root.add(this.para(6, MSG_Y - 4, GAME_WIDTH - 12, 38, 0x000000, 0.75, 6));
    const t = addText(this, 14, MSG_Y + 15, this.message, { size: 11, color: '#ffffff', wrap: GAME_WIDTH - 32, ja: true }).setOrigin(0, 0.5);
    if (t.height > 36) t.setScale(36 / t.height);
    this.root.add(t);
  }

  /** 動く順の1列：先制の敵 → 仲間（並べた順）→ ほかの敵 */
  private drawOrder(view: LeapState): void {
    const order = leapOrder(view, this.plan);
    let x = 10;
    this.root.add(addText(this, x, ORDER_Y + 12, '順', { size: 10, color: '#9aa3c0' }).setOrigin(0, 0.5));
    x += 18;
    order.forEach((o) => {
      const name = o.kind === 'ally' ? this.allyName(this.plan[o.i].ally) : this.unitName(view, o.intent.enemy);
      const enemy = o.kind === 'enemy';
      const t = addText(this, 0, 0, name, { size: 10, bold: true, color: enemy ? '#ffffff' : '#000000' });
      const w = Math.min(t.width + 12, 84);
      t.destroy();
      if (x + w > GAME_WIDTH - 6) return;
      this.root.add(this.para(x, ORDER_Y + 2, w, 20, enemy ? (o.intent.move.first ? RED : 0x6a2a3a) : YELLOW, 1, 5));
      const label = addText(this, x + w / 2, ORDER_Y + 12, name, { size: 10, bold: true, color: enemy ? '#ffffff' : '#000000' }).setOrigin(0.5);
      if (label.width > w - 6) label.setScale((w - 6) / label.width);
      this.root.add(label);
      x += w + 4;
    });
  }

  private drawAllies(view: LeapState): void {
    const r = this.root;
    const colW = (GAME_WIDTH - 16) / view.allies.length;
    view.allies.forEach((u, i) => {
      const x = 8 + colW * i;
      const w = colW - 6;
      const sel = !this.busy && this.ally === u.uid;
      const color = ALLY_COLOR[u.defId] ?? COLORS.ally;
      r.add(this.para(x, ALLY_Y, w, ALLY_H, sel ? 0x232c55 : 0x151b33, 1, 8, sel ? { w: 2.5, color: YELLOW } : this.actorUid === u.uid ? { w: 2.5, color: RED } : undefined));
      r.add(this.para(x + 4, ALLY_Y, 5, ALLY_H, color, 1, 2));
      const face = this.faceSquare(u.defId, x + 30, ALLY_Y + 24, 38);
      if (face) r.add(face.setAlpha(u.hp > 0 ? 1 : 0.3));
      r.add(addText(this, x + 54, ALLY_Y + 12, u.name, { size: 12, bold: true, color: u.hp > 0 ? '#ffffff' : COLORS.dimText }).setOrigin(0, 0.5));
      const bw = w - 60;
      r.add(this.add.rectangle(x + 54, ALLY_Y + 28, bw, 5, 0x222838).setOrigin(0, 0.5));
      if (u.hp > 0) r.add(this.add.rectangle(x + 54, ALLY_Y + 28, Math.max(2, bw * (u.hp / u.maxHp)), 5, u.hp < u.maxHp * 0.3 ? COLORS.hpLow : color).setOrigin(0, 0.5));
      r.add(addText(this, x + 54, ALLY_Y + 38, `${u.hp}/${u.maxHp}`, { size: 9, color: '#9aa3c0' }).setOrigin(0, 0.5));
      // 並べた行動と、添えた札
      const pi = this.plan.findIndex((p) => p.ally === u.uid);
      if (pi >= 0) {
        const p = this.plan[pi];
        const mv = leapMoveOf(this.s, p);
        const adds = p.addons.map((a) => this.s.def.cards[this.s.hand[a]]?.name).filter(Boolean);
        const tx = addText(this, x + 10, ALLY_Y + 60, `${pi + 1}. ${mv?.name ?? ''}${p.target ? `→${this.unitName(this.s, p.target)}` : ''}${adds.length ? `\n＋${adds.join('＋')}` : ''}`, { size: 9, bold: true, color: '#ffd23f' }).setOrigin(0, 0.5);
        if (tx.width > w - 14) tx.setScale((w - 14) / tx.width);
        r.add(tx);
      } else if (u.hp > 0) r.add(addText(this, x + 10, ALLY_Y + 60, sel ? '← 行動を選ぶ' : '', { size: 9, color: '#9aa3c0' }).setOrigin(0, 0.5));
      if (u.guard) r.add(this.sticker(x + w - 26, ALLY_Y - 2, '見切り', YELLOW, '#000000', 5, 9));
      const hit = this.add.rectangle(x + w / 2, ALLY_Y + ALLY_H / 2, w, ALLY_H, 0xffffff, 0.001);
      r.add(hit);
      makePressable(hit, { onTap: () => this.pickAlly(u.uid) });
    });
  }

  private drawTabs(): void {
    const tabs: { label: string; on: boolean; tap: () => void }[] = [
      { label: `手札（${this.s.hand.length}枚）`, on: this.tab === 'cards', tap: () => ((this.tab = 'cards'), this.render()) },
      { label: `${this.ally ? this.allyName(this.ally) : ''}の技`, on: this.tab === 'moves', tap: () => ((this.tab = 'moves'), this.render()) },
      { label: '？', on: false, tap: () => this.showRules() },
    ];
    let x = 8;
    for (const t of tabs) {
      const w = t.label === '？' ? 40 : 150;
      this.root.add(this.para(x, TAB_Y, w, 26, t.on ? RED : 0x1a2040, 1, 8));
      this.root.add(addText(this, x + w / 2, TAB_Y + 13, t.label, { size: 12, bold: true, color: t.on ? '#ffffff' : '#9aa3c0' }).setOrigin(0.5));
      const hit = this.add.rectangle(x + w / 2, TAB_Y + 13, w, 26, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, { onTap: t.tap });
      x += w + 6;
    }
  }

  private drawOptions(): void {
    const s = this.s;
    const used = usedCards(this.plan);
    const items: { source: LeapSource; move: LeapMove; used: boolean; mine: boolean }[] = [];
    const myStep = this.plan.find((p) => p.ally === this.ally);
    if (this.tab === 'cards') {
      s.hand.forEach((id, index) => {
        const mine = !!myStep && (myStep.addons.includes(index) || (myStep.source.kind === 'card' && myStep.source.index === index));
        items.push({ source: { kind: 'card', index }, move: s.def.cards[id], used: used.has(index), mine });
      });
    } else if (this.ally) {
      const me = s.allies.find((a) => a.uid === this.ally);
      for (const mv of s.def.allies.find((a) => a.id === me?.defId)?.moves ?? []) items.push({ source: { kind: 'move', moveId: mv.id }, move: mv, used: false, mine: !!myStep && myStep.source.kind === 'move' && myStep.source.moveId === mv.id });
    }
    const step = (GAME_WIDTH - 8) / 5;
    items.slice(0, 5).forEach((it, i) => {
      const cx = 4 + step * i + step / 2;
      const sel = !!this.pending && JSON.stringify(this.pending.source) === JSON.stringify(it.source);
      const cy = CARD_Y + CARD_H / 2 - (sel ? 8 : 0);
      this.drawCard(cx, cy, it.move, sel, it.used && !it.mine, it.mine);
      const hit = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, {
        onTap: () => this.pickOption(it.source, it.move, it.used, it.mine),
        onLongPress: () => {
          this.message = `【${KIND_LABEL[it.move.kind]}】${it.move.name}：${it.move.text}`;
          this.render();
        },
      });
    });
    if (items.length === 0) this.root.add(addText(this, GAME_WIDTH / 2, CARD_Y + 60, this.tab === 'cards' ? '手札がない' : '仲間を選ぶ', { size: 12, color: COLORS.subText }).setOrigin(0.5));
  }

  private drawCard(cx: number, cy: number, mv: LeapMove, sel: boolean, used: boolean, mine: boolean): void {
    const color = KIND_COLOR[mv.kind] ?? 0x3a8dff;
    const w = CARD_W;
    const h = CARD_H;
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (sel) parts.push(this.add.rectangle(0, 0, w + 12, h + 12, color, 0.4));
    parts.push(this.add.rectangle(3, 5, w + 4, h + 4, 0x000000, 0.6));
    parts.push(this.add.rectangle(0, 0, w + 4, h + 4, sel || mine ? YELLOW : color));
    parts.push(this.add.rectangle(0, 0, w, h, mv.kind === 'addon' ? 0xfff3cf : 0xf4efe4));
    parts.push(this.add.rectangle(0, -h / 2 + 10, w + 4, 20, color));
    parts.push(addText(this, 0, -h / 2 + 10, KIND_LABEL[mv.kind], { size: 10, bold: true, color: mv.kind === 'addon' ? '#000000' : '#ffffff' }).setOrigin(0.5));
    // 回数・属性の大きな表示
    const big = mv.kind === 'addon' ? `+${mv.addPerHit ?? mv.exposure ?? 0}` : mv.hits ? `×${mv.hits}` : mv.kind === 'attack' ? `${mv.power}` : mv.kind === 'hourglass' ? '砂' : mv.kind === 'counter' ? '返' : mv.kind === 'wet' ? '濡' : '癒';
    parts.push(addText(this, 0, -h / 2 + 46, big, { size: 26, bold: true, color: '#222222' }).setOrigin(0.5).setFontStyle('bold italic'));
    if (mv.element && mv.kind === 'attack') parts.push(this.add.rectangle(0, -h / 2 + 70, w - 14, 4, ELEMENT_COLOR[mv.element]));
    let title = addText(this, 0, -h / 2 + 88, mv.name, { size: 12, bold: true, color: '#111111' }).setOrigin(0.5);
    if (title.width > w - 6) title.setScale((w - 6) / title.width);
    parts.push(title);
    const short = addText(this, 0, -h / 2 + 118, mv.short, { size: 9, bold: true, color: '#4a4a4a', align: 'center' }).setOrigin(0.5);
    if (short.width > w - 6) short.setScale((w - 6) / short.width);
    parts.push(short);
    if (used) parts.push(this.add.rectangle(0, 0, w + 4, h + 4, 0x000000, 0.55));
    if (mine) parts.push(this.sticker(0, h / 2 - 12, mv.kind === 'addon' ? '添えた' : '選んだ', YELLOW, '#000000', -6, 10));
    else if (used) parts.push(this.sticker(0, -6, '使う予定', 0xffffff, '#000000', -10, 11));
    this.root.add(this.add.container(cx, cy, parts));
  }

  private drawCommands(): void {
    const on = this.plan.length > 0;
    this.button(8, CMD_Y, 92, 44, '1つ戻す', () => this.undo(), { enabled: on, size: 13 });
    this.button(108, CMD_Y, 92, 44, '全部やめる', () => this.clearPlan(), { enabled: on, size: 13 });
    this.button(210, CMD_Y, 172, 44, '● 実行', () => this.execute(), { go: true, enabled: on, size: 18 });
  }

  private showRules(): void {
    this.message = `連続攻撃は、動いている敵には${LEAP_RULES.movingHits}発だけ、止まっている敵（しびれ・よろけ・ダウン）には全段。添える札は手番を使わず、1発ごとに足す（${LEAP_RULES.addonMax}枚まで）。濡れ×雷＝2倍でしびれ、凍り×物理＝2倍、弱点＝1.5倍でダウン。順は 先制の敵→仲間（並べた順）→ほかの敵`;
    this.render();
  }

  // ---------- 選ぶ ----------

  private pickAlly(uid: string): void {
    if (this.busy) return;
    const u = this.s.allies.find((a) => a.uid === uid);
    if (!u || u.hp <= 0) return;
    this.ally = uid;
    this.pending = null;
    const placed = this.plan.find((p) => p.ally === uid);
    this.message = placed ? `${u.name}の行動は並べてある。添える札をタップすると重ねる。やり直すなら「1つ戻す」` : `${u.name}の行動を選ぶ（${this.plan.length + 1}番目に動く）`;
    this.render();
  }

  private pickOption(source: LeapSource, move: LeapMove, used: boolean, mine: boolean): void {
    if (this.busy || !this.ally) return;
    const step = this.plan.find((p) => p.ally === this.ally);
    // 添える札：並べた行動に重ねる・外す
    if (move.kind === 'addon' && source.kind === 'card') {
      if (!step) {
        this.message = `${move.name}は添える札。先に${this.allyName(this.ally)}の行動を選んでから、タップして重ねる`;
        this.render();
        return;
      }
      if (mine) step.addons = step.addons.filter((a) => a !== source.index);
      else if (used) {
        this.message = 'その札は、ほかの行動で使う予定';
        this.render();
        return;
      } else {
        const next = { ...step, addons: [...step.addons, source.index] };
        const rest = this.plan.filter((p) => p !== step);
        const err = leapPlanError(this.s, rest, next);
        if (err) {
          this.message = err;
          this.render();
          return;
        }
        step.addons = next.addons;
        playSe(this, SE.tap);
      }
      this.message = `${this.allyName(this.ally)}の行動に${step.addons.length ? `「${step.addons.map((a) => this.s.def.cards[this.s.hand[a]].name).join('・')}」を添えた` : '何も添えていない'}`;
      this.render();
      return;
    }
    if (step) {
      this.message = `${this.allyName(this.ally)}はもう並べた。替えるなら「1つ戻す」。ほかの仲間をタップ`;
      this.render();
      return;
    }
    if (used) return;
    if (move.target !== 'enemy') {
      this.place({ ally: this.ally, source, addons: [] });
      return;
    }
    this.pending = { source, move };
    this.message = `${move.name}：${move.text}　→ 敵をタップ`;
    this.render();
  }

  private pickEnemy(uid: string): void {
    if (this.busy || !this.pending || !this.ally) return;
    this.place({ ally: this.ally, source: this.pending.source, target: uid, addons: [] });
  }

  private place(step: LeapPlanStep): void {
    const err = leapPlanError(this.s, this.plan, step);
    if (err) {
      this.message = err;
      this.render();
      return;
    }
    playSe(this, SE.tap);
    this.plan.push(step);
    this.pending = null;
    const mv = leapMoveOf(this.s, step)!;
    const hasAddon = this.s.hand.some((id, i) => this.s.def.cards[id].kind === 'addon' && !usedCards(this.plan).has(i));
    const next = this.nextFreeAlly();
    this.message = `${this.allyName(step.ally)}：${mv.name}を並べた。${hasAddon ? '添える札をタップすると、この行動に重ねる。' : ''}${next ? `次は${this.allyName(next)}をタップ` : '全員並べた。「実行」'}`;
    this.render();
  }

  private undo(): void {
    if (this.busy || this.plan.length === 0) return;
    const last = this.plan.pop()!;
    this.ally = last.ally;
    this.pending = null;
    this.message = `${this.allyName(last.ally)}の行動を外した`;
    this.render();
  }

  private clearPlan(): void {
    if (this.busy) return;
    this.plan = [];
    this.pending = null;
    this.ally = this.nextFreeAlly();
    this.message = '並べた行動を全部外した';
    this.render();
  }

  // ---------- 動かす ----------

  private execute(): void {
    if (this.busy || this.plan.length === 0) return;
    const { state, frames } = runLeapRound(this.s, this.plan);
    this.busy = true;
    this.pending = null;
    this.play(frames, 0, state);
  }

  private wait(ms: number, next: () => void): void {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      timer.remove();
      this.advance = null;
      next();
    };
    const timer = this.time.delayedCall(ms, run);
    this.advance = run;
  }

  private play(frames: LeapFrame[], i: number, final: LeapState): void {
    if (i >= frames.length) {
      this.actorUid = '';
      this.finishRound(final);
      return;
    }
    const f = frames[i];
    const before = i > 0 ? frames[i - 1].state : this.s;
    this.actorUid = f.uid;
    this.message = this.describe(f, before);
    this.render(before);
    const hits = f.events.filter((e) => e.type === 'hit').length;
    this.popEvents(f.events, before);
    this.wait(650 + Math.min(hits, 12) * 110, () => {
      this.render(f.state);
      this.wait(250, () => this.play(frames, i + 1, final));
    });
  }

  private describe(f: LeapFrame, s: LeapState): string {
    const name = (uid: string) => this.unitName(s, uid);
    const parts: string[] = [];
    for (const e of f.events) {
      if (e.type === 'cancel') parts.push(e.reason === 'stopped' ? `${name(e.uid)}は止まっていて動けない（${f.name}は起きなかった）` : `${name(e.uid)}は倒れている`);
      else if (e.type === 'stop') parts.push(`${name(e.uid)}が${e.why === 'stun' ? 'しびれた' : e.why === 'stagger' ? 'よろけた' : 'ダウンした'}`);
      else if (e.type === 'wet') parts.push(`${name(e.uid)}が濡れた`);
      else if (e.type === 'freeze') parts.push(`${name(e.uid)}が凍った`);
      else if (e.type === 'guard') parts.push('見切りの構え');
      else if (e.type === 'exposure') parts.push(`露出補正：この後の攻撃は1発ごとに+${e.total}`);
      else if (e.type === 'sand') parts.push(`砂時計を返す（砂${e.spent}粒）`);
      else if (e.type === 'total') parts.push(`${name(e.uid)}に${e.hits}発で合計${e.amount}！`);
      else if (e.type === 'defeat') parts.push(`${name(e.uid)}を倒した`);
    }
    return `${name(f.uid)}：${f.name}。${parts.join('。')}`;
  }

  /** 1発ずつ数字を出し、連続攻撃は最後に合計と式を大きく */
  private popEvents(events: LeapEvent[], s: LeapState): void {
    let k = 0;
    const posOf = (uid: string): { x: number; y: number } => (s.enemies.some((e) => e.uid === uid) ? { x: this.enemyX(s, uid), y: ART_Y } : { x: this.allyX(uid), y: ALLY_Y + 20 });
    let lastFormula = '';
    for (const ev of events) {
      if (ev.type === 'hit') {
        const p = posOf(ev.to);
        const enemy = s.enemies.some((e) => e.uid === ev.to);
        const delay = k * 110;
        const t = addText(this, p.x + ((k % 3) - 1) * 18, p.y - 6, String(ev.amount), { size: enemy ? 26 : 18, bold: true, color: enemy ? (ev.reaction ? '#ffd23f' : '#ffffff') : '#ff8a8a' })
          .setOrigin(0.5)
          .setStroke('#000000', 5)
          .setFontStyle('bold italic')
          .setAlpha(0);
        this.fx.add(t);
        this.tweens.add({ targets: t, alpha: 1, y: p.y - 30, delay, duration: 160, onStart: () => enemy && playSe(this, ev.weak || ev.reaction ? SE.slash : SE.hit) });
        this.tweens.add({ targets: t, alpha: 0, delay: delay + 650, duration: 250, onComplete: () => t.destroy() });
        if (ev.formula) lastFormula = ev.formula;
        k++;
      } else if (ev.type === 'miss') {
        const p = posOf(ev.to);
        const t = addText(this, p.x + 30, p.y + 20, 'MISS', { size: 12, bold: true, color: '#9aa3c0' }).setOrigin(0.5).setAlpha(0);
        this.fx.add(t);
        this.tweens.add({ targets: t, alpha: 1, delay: k * 110, duration: 120, yoyo: true, hold: 300, onComplete: () => t.destroy() });
        k++;
      } else if (ev.type === 'total') {
        const p = posOf(ev.uid);
        const box = this.add.container(p.x, p.y - 64).setAlpha(0).setScale(1.6);
        const big = addText(this, 0, 0, `${ev.amount}!!`, { size: 40, bold: true, color: '#ffd23f' }).setOrigin(0.5).setStroke('#000000', 7).setFontStyle('bold italic');
        const f = addText(this, 0, 30, `${lastFormula}×${ev.hits}発`, { size: 13, bold: true, color: '#ffffff' }).setOrigin(0.5).setStroke('#000000', 4);
        box.add([big, f]);
        this.fx.add(box);
        this.tweens.add({ targets: box, alpha: 1, scale: 1, delay: k * 110 + 80, duration: 200, ease: 'Back.easeOut', onStart: () => playSe(this, SE.firework) });
        this.tweens.add({ targets: box, alpha: 0, delay: k * 110 + 1100, duration: 300, onComplete: () => box.destroy() });
      } else if (ev.type === 'heal') {
        const p = posOf(ev.to);
        const t = addText(this, p.x, p.y, `+${ev.amount}`, { size: 18, bold: true, color: '#6dff9e' }).setOrigin(0.5).setStroke('#000000', 4);
        this.fx.add(t);
        this.tweens.add({ targets: t, y: p.y - 26, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      }
    }
  }

  private finishRound(final: LeapState): void {
    this.s = final;
    this.plan = [];
    this.pending = null;
    this.busy = false;
    this.ally = this.nextFreeAlly();
    if (final.outcome !== 'ongoing') {
      this.render();
      this.showEnd();
      return;
    }
    this.message = `ラウンド${final.round}。敵の新しい予定を見て並べる。止まり・濡れ・凍り・砂は残っている`;
    this.render();
  }

  private showEnd(): void {
    const s = this.s;
    const win = s.outcome === 'win';
    const o = this.add.container(0, 0).setDepth(100);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0).setInteractive());
    o.add(addText(this, GAME_WIDTH / 2, 230, win ? 'CLEAR!' : 'GAME OVER', { size: 44, bold: true, color: win ? '#ffd23f' : '#ff6b81' }).setOrigin(0.5).setFontStyle('bold italic'));
    o.add(addText(this, GAME_WIDTH / 2, 300, `${win ? s.round : s.round - 1}ラウンド${win ? 'で決着' : ''}`, { size: 18, bold: true }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 336, `1回の行動の最大ダメージ：${s.bestHit}`, { size: 15, color: '#ffd23f' }).setOrigin(0.5));
    const idx = LEAP_TRIALS.findIndex((t) => t.id === this.trial);
    const next = LEAP_TRIALS[(idx + 1) % LEAP_TRIALS.length];
    this.button(8, 744, 150, 44, 'もう一度', () => this.scene.restart({ trial: this.trial }), { into: o, size: 14 });
    this.button(168, 744, 214, 44, `次：${next.name} ▶`, () => this.scene.restart({ trial: next.id }), { into: o, go: true, size: 12 });
    const back = addText(this, GAME_WIDTH / 2, 808, 'タイトルへ', { size: 12, color: '#9aa3c0' }).setOrigin(0.5);
    o.add(back);
    const hit = this.add.rectangle(GAME_WIDTH / 2, 808, 120, 28, 0xffffff, 0.001);
    o.add(hit);
    makePressable(hit, { onTap: () => this.scene.start('Title') });
  }
}

