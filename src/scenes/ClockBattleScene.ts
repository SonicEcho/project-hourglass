import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  actionHours,
  clockActionError,
  clockAllyAct,
  clockEnemyAct,
  createClockBattle,
  currentActor,
  enemyIntent,
  findClockUnit,
  nextTurnAt,
  type ClockAction,
  type ClockEvent,
  type ClockMove,
  type ClockState,
  type ClockUnit,
  type Element,
} from '../core';
import { ALLY_FACE, CLOCK_CARD_ART, CLOCK_RULES, CLOCK_TRIALS, ENEMY_ART, FACE_CROPS } from '../data';
import { hasImage } from '../assets/loader';
import { faceImage } from '../ui/portrait';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, RENDER_SCALE, toCss } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { waitImages } from '../ui/waitImages';

// 試し：文字盤の戦闘の画面（段階154。docs/milestones/M3_battle_review.md の案1・案3）。
// デバッグメニューから開く。今の戦闘の画面（BattleScene）とは別。仕組みは src/core/clock.ts、数値は src/data/clockTrial.ts

export interface ClockBattleData {
  trial: string;
  seed?: number;
}

const DIAL = { cx: GAME_WIDTH / 2, cy: 372, r: 112 } as const;
const ENEMY_TOP = 46;
const MSG_Y = 524;
const ALLY_Y = 566;
const HAND_Y = 650;
const CMD_Y = 800;

type Selected = { action: ClockAction; move: ClockMove | null } | null;

export class ClockBattleScene extends Phaser.Scene {
  private s!: ClockState;
  private trial = '';
  private root!: Phaser.GameObjects.Container;
  private selected: Selected = null;
  private tab: 'cards' | 'moves' = 'cards';
  private swapMode = false;
  private message = '';
  private busy = false;
  private lastEnemy = '';

  constructor() {
    super('ClockBattle');
  }

  create(data: ClockBattleData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f22).setOrigin(0);
    this.trial = data.trial;
    const def = CLOCK_TRIALS.find((t) => t.id === data.trial) ?? CLOCK_TRIALS[0];
    this.s = createClockBattle(def, CLOCK_RULES, data.seed ?? Date.now() % 100000);
    this.root = this.add.container(0, 0);
    this.selected = null;
    this.tab = 'cards';
    this.swapMode = false;
    this.busy = false;
    this.message = '敵の次の番と技は、文字盤と敵の下に出る。弱点を突くと、敵の番を押し出す';
    const ids = [
      ...def.enemies.map((e) => ENEMY_ART[e.id]),
      ...[...def.allies, ...def.reserve].map((a) => ALLY_FACE[a.id]),
      ...Object.values(CLOCK_CARD_ART),
    ].filter((x): x is string => !!x);
    waitImages(this, ids, () => this.step());
  }

  /** 敵の番なら少しずつ動かし、仲間の番で止まる */
  private step(): void {
    this.render();
    if (this.s.outcome !== 'ongoing') {
      this.showEnd();
      return;
    }
    const actor = currentActor(this.s);
    if (actor?.side !== 'enemy') return;
    this.busy = true;
    this.time.delayedCall(650, () => {
      const prev = this.s;
      this.s = clockEnemyAct(this.s);
      this.message = describe(prev, this.s, this.s.log);
      this.busy = false;
      this.popNumbers(this.s.log);
      this.time.delayedCall(450, () => this.step());
    });
  }

  private act(a: ClockAction): void {
    const err = clockActionError(this.s, a);
    if (err) {
      this.message = err;
      this.render();
      return;
    }
    const prev = this.s;
    this.s = clockAllyAct(this.s, a);
    this.message = describe(prev, this.s, this.s.log);
    this.selected = null;
    this.swapMode = false;
    this.popNumbers(this.s.log);
    this.step();
  }

  private render(): void {
    this.root.removeAll(true);
    const s = this.s;
    const actor = currentActor(s);
    const r = this.root;
    // 上の帯：題と刻限までの残り
    r.add(addText(this, 12, 12, '● REC', { size: 12, bold: true, color: '#ff3b5c' }));
    r.add(addText(this, 70, 12, '試し：文字盤の戦闘', { size: 12, bold: true }));
    const left = Math.max(0, s.kokugen - s.time);
    r.add(addText(this, GAME_WIDTH - 12, 6, `刻限まで あと${left.toFixed(1)}時間`, { size: 12, bold: true, color: COLORS.accentText }).setOrigin(1, 0));
    if (s.phase > 0) r.add(addText(this, GAME_WIDTH - 12, 22, `刻限 ${s.phase}回（敵の攻撃 ×${Math.pow(CLOCK_RULES.kokugenPower, s.phase).toFixed(2)}）`, { size: 10, color: '#ff9a7a' }).setOrigin(1, 0));
    this.drawEnemies(actor);
    this.drawDial(actor);
    // 案内
    r.add(this.add.rectangle(GAME_WIDTH / 2, MSG_Y, GAME_WIDTH - 20, 52, 0x0b0f22, 0.92).setStrokeStyle(1, COLORS.border).setRounded(6));
    r.add(addText(this, 20, MSG_Y, this.message, { size: 12, wrap: GAME_WIDTH - 40 }).setOrigin(0, 0.5));
    this.drawAllies(actor);
    if (actor?.side === 'ally' && !this.busy) {
      this.drawHand(actor);
      this.drawCommands(actor);
    }
  }

  private drawEnemies(actor: ClockUnit | null): void {
    const s = this.s;
    const n = s.enemies.length;
    const colW = GAME_WIDTH / n;
    s.enemies.forEach((e, i) => {
      const cx = colW * i + colW / 2;
      const alive = e.hp > 0;
      const art = ENEMY_ART[e.defId];
      const size = Math.min(84, colW - 8);
      const selTarget = this.selected?.action && 'target' in this.selected.action && this.selected.action.target === e.uid;
      if (selTarget) this.root.add(this.add.ellipse(cx, ENEMY_TOP + size - 4, size, 16, 0x000000, 0).setStrokeStyle(3, COLORS.select));
      if (art && hasImage(this, art)) {
        const img = this.add.image(cx, ENEMY_TOP + size / 2, art);
        img.setScale(size / Math.max(img.width, img.height));
        if (!alive) img.setAlpha(0.2).setTint(0x606060);
        if (actor?.uid === e.uid) this.root.add(this.add.circle(cx, ENEMY_TOP + size / 2, size / 2 + 4, 0xff5a5a, 0.25));
        this.root.add(img);
      } else this.root.add(this.add.circle(cx, ENEMY_TOP + size / 2, size / 2.4, COLORS.enemy, alive ? 1 : 0.2));
      const y = ENEMY_TOP + size + 4;
      const name = addText(this, cx, y, e.name, { size: 11, color: alive ? COLORS.text : COLORS.dimText }).setOrigin(0.5, 0);
      if (name.width > colW - 4) name.setScale((colW - 4) / name.width);
      this.root.add(name);
      const bw = colW - 18;
      this.root.add(this.add.rectangle(cx - bw / 2, y + 18, bw, 4, COLORS.barBg).setOrigin(0, 0.5));
      this.root.add(this.add.rectangle(cx - bw / 2, y + 18, bw * (e.hp / e.maxHp), 4, COLORS.hp).setOrigin(0, 0.5));
      this.root.add(addText(this, cx, y + 23, `${e.hp}/${e.maxHp}`, { size: 10, color: COLORS.subText }).setOrigin(0.5, 0));
      // 見つけた弱点
      const known = s.revealed[e.uid] ?? [];
      known.forEach((el, k) => {
        const bx = cx + size / 2 - 8 - k * 22;
        this.root.add(this.add.rectangle(bx, ENEMY_TOP + 6, 30, 15, 0xffd700).setRounded(7));
        this.root.add(addText(this, bx, ENEMY_TOP + 6, `弱${ELEMENT_LABEL[el]}`, { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      });
      if (!alive) return;
      // 次の番と、次の行動（読める癖）
      const m = enemyIntent(s, e);
      const big = m.kind === 'all';
      const label = `${clockTime(e.next)} ${m.name}${m.element && m.kind !== 'haste' ? `（${ELEMENT_LABEL[m.element]}${big ? '・全体' : ''}）` : big ? '（全体）' : ''}`;
      const tag = addText(this, cx, y + 40, label, { size: 10, bold: true, color: big ? '#ffd0a0' : '#dfe6ff' }).setOrigin(0.5);
      if (tag.width > colW - 6) tag.setScale((colW - 6) / tag.width);
      this.root.add(this.add.rectangle(cx, y + 40, Math.min(colW - 4, tag.displayWidth + 10), 16, big ? 0x7a2a10 : 0x24305a).setStrokeStyle(1, big ? 0xff9a5a : 0x6b7fc0).setRounded(8));
      this.root.add(tag);
      if (e.staggered) this.root.add(addText(this, cx, ENEMY_TOP + size / 2, '押し出し', { size: 13, bold: true, color: COLORS.weak }).setOrigin(0.5).setAngle(-10));
      // 敵をタップ：選んでいる技の相手。長押し：詳しく
      const hit = this.add.rectangle(cx, ENEMY_TOP + 60, colW - 4, 130, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, {
        onTap: () => this.pickEnemy(e.uid),
        onLongPress: () => {
          this.message = `${e.name}：癖は ${(this.s.def.enemies.find((d) => d.id === e.defId)?.pattern ?? []).map((p) => p.name).join(' → ')}。弱点 ${known.map((k) => ELEMENT_LABEL[k]).join('・') || '？'}`;
          this.render();
        },
      });
    });
  }

  private drawDial(actor: ClockUnit | null): void {
    const s = this.s;
    const { cx, cy, r } = DIAL;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillCircle(cx, cy + 4, r + 22);
    g.fillStyle(0x1a130b, 1).fillCircle(cx, cy, r + 16);
    g.lineStyle(3, 0xd9a440, 1).strokeCircle(cx, cy, r + 16);
    g.lineStyle(1, 0xffd77a, 0.25).strokeCircle(cx, cy, r - 24);
    // 刻限までの残りの弧（今から刻限まで）
    const ang = (t: number) => ((t % CLOCK_RULES.dial) / CLOCK_RULES.dial) * Math.PI * 2 - Math.PI / 2;
    const a0 = ang(s.time);
    // 刻限が1周より先なら、1周ぶん（今から）だけ描く
    const span = Math.min(s.kokugen - s.time, CLOCK_RULES.dial - 0.01);
    const a1 = a0 + (span / CLOCK_RULES.dial) * Math.PI * 2;
    g.lineStyle(5, 0xffd77a, 0.9).beginPath().arc(cx, cy, r + 16, a0, a1, false).strokePath();
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
      const w = h % 3 === 0 ? 3 : 1.5;
      g.lineStyle(w, 0xffd77a, 1).lineBetween(cx + Math.cos(a) * (r + 2), cy + Math.sin(a) * (r + 2), cx + Math.cos(a) * (r + 10), cy + Math.sin(a) * (r + 10));
      this.root.add(g);
      this.root.add(addText(this, cx + Math.cos(a) * (r - 36), cy + Math.sin(a) * (r - 36), String(h === 0 ? 12 : h), { size: 11, color: '#a99a7a' }).setOrigin(0.5));
    }
    // 刻限の印
    const ka = ang(s.kokugen);
    const kx = cx + Math.cos(ka) * (r + 28);
    const ky = cy + Math.sin(ka) * (r + 28);
    this.root.add(addText(this, kx, ky, '刻限', { size: 10, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    // 針（今の時刻）
    const na = ang(s.time);
    const needle = this.add.graphics().lineStyle(4, 0xfff3c8, 1).lineBetween(cx, cy, cx + Math.cos(na) * (r - 14), cy + Math.sin(na) * (r - 14));
    this.root.add(needle);
    // 番の印：仲間は顔、敵は絵。同じ所に重なる時は、内側へずらす
    const used: { a: number; ring: number }[] = [];
    const place = (t: number) => {
      const a = ang(t);
      let ring = 0;
      while (used.some((u) => u.ring === ring && Math.abs(Math.atan2(Math.sin(u.a - a), Math.cos(u.a - a))) < 0.36)) ring += 1;
      used.push({ a, ring });
      const rr = r - ring * 34;
      return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
    };
    const units = [...s.allies, ...s.enemies].filter((u) => u.hp > 0 && u.uid !== actor?.uid).sort((a, b) => a.next - b.next);
    for (const u of units) {
      const p = place(u.next);
      this.token(u, p.x, p.y, 16, false, u.next - s.time >= CLOCK_RULES.dial);
    }
    // 選んでいる行動を使った時の、今の人の次の番（点線）
    if (actor?.side === 'ally' && this.selected) {
      const t = nextTurnAt(s, actor, actionHours(s, actor, this.selected.action) + (s.swapped ? CLOCK_RULES.swapHours : 0));
      const p = place(t);
      this.token(actor, p.x, p.y, 15, true, false);
      this.root.add(addText(this, p.x, p.y + 22, '次', { size: 10, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    }
    // 真ん中：今動く人
    if (actor) {
      this.root.add(this.add.circle(cx, cy, 40, actor.side === 'ally' ? 0xffd77a : 0xff6a5a));
      this.token(actor, cx, cy, 36, false, false);
      this.root.add(addText(this, cx, cy + 50, `${actor.name}の番（${clockTime(s.time)}）`, { size: 12, bold: true, color: actor.side === 'ally' ? COLORS.accentText : '#ff9a7a' }).setOrigin(0.5));
    }
  }

  /** 番の印（仲間は顔、敵は絵） */
  private token(u: ClockUnit, x: number, y: number, rad: number, dashed: boolean, far: boolean): void {
    const color = u.side === 'ally' ? (ALLY_COLOR[u.defId] ?? COLORS.ally) : 0x5a2a2a;
    this.root.add(this.add.circle(x, y, rad + 2, 0x000000, 0.6));
    const id = u.side === 'ally' ? ALLY_FACE[u.defId] : ENEMY_ART[u.defId];
    if (id && hasImage(this, id)) {
      if (u.side === 'ally') this.root.add(faceImage(this, id, x, y, rad, FACE_CROPS[u.defId]).setAlpha(dashed || far ? 0.55 : 1));
      else {
        const img = this.add.image(x, y, id);
        img.setScale((rad * 2.2) / Math.max(img.width, img.height)).setAlpha(dashed || far ? 0.55 : 1);
        this.root.add(img);
      }
    } else this.root.add(addText(this, x, y, u.name.slice(0, 1), { size: 13, bold: true }).setOrigin(0.5));
    const ring = this.add.circle(x, y, rad + 1).setStrokeStyle(dashed ? 2 : 2.5, dashed ? 0xffd77a : u.side === 'ally' ? color : 0xff7a5a);
    this.root.add(ring);
    if (u.staggered && !dashed) this.root.add(addText(this, x, y - rad - 6, '押', { size: 10, bold: true, color: COLORS.weak }).setOrigin(0.5));
  }

  private drawAllies(actor: ClockUnit | null): void {
    const s = this.s;
    const colW = (GAME_WIDTH - 16) / 5;
    const all = [...s.allies.map((u) => ({ u, reserve: false })), ...s.reserve.map((u) => ({ u, reserve: true }))];
    all.forEach(({ u, reserve }, i) => {
      const x = 8 + colW * i + colW / 2;
      const y = ALLY_Y + 30;
      const isActor = actor?.uid === u.uid;
      const canSwap = this.swapMode && reserve && u.hp > 0;
      const selHeal = this.selected?.action && 'target' in this.selected.action && this.selected.action.target === u.uid;
      const box = this.add.rectangle(x, y, colW - 4, 66, reserve ? 0x141a30 : 0x1d2544, 0.95).setRounded(8);
      box.setStrokeStyle(isActor || canSwap || selHeal ? 2.5 : 1, canSwap ? 0x6dff9e : selHeal ? COLORS.select : isActor ? COLORS.accent : COLORS.border);
      this.root.add(box);
      if (i === 3) this.root.add(addText(this, x - colW / 2 + 2, ALLY_Y - 6, '控え', { size: 10, color: COLORS.subText }));
      const id = ALLY_FACE[u.defId];
      if (id && hasImage(this, id)) this.root.add(faceImage(this, id, x, y - 14, 13, FACE_CROPS[u.defId]).setAlpha(u.hp > 0 ? 1 : 0.3));
      this.root.add(addText(this, x, y + 4, u.name, { size: 11, bold: true, color: u.hp > 0 ? toCss(ALLY_COLOR[u.defId] ?? COLORS.ally) : COLORS.dimText }).setOrigin(0.5, 0));
      const bw = colW - 16;
      this.root.add(this.add.rectangle(x - bw / 2, y + 21, bw, 4, COLORS.barBg).setOrigin(0, 0.5));
      this.root.add(this.add.rectangle(x - bw / 2, y + 21, bw * (u.hp / u.maxHp), 4, u.hp < u.maxHp * 0.3 ? COLORS.hpLow : COLORS.hp).setOrigin(0, 0.5));
      this.root.add(addText(this, x - bw / 2, y + 24, `${u.hp}`, { size: 10 }));
      // 弱点（敵にも知られている）
      const w = u.weak[0];
      if (w) {
        this.root.add(this.add.rectangle(x + bw / 2 - 12, y + 30, 26, 13, ELEMENT_COLOR[w]).setRounded(6));
        this.root.add(addText(this, x + bw / 2 - 12, y + 30, `弱${ELEMENT_LABEL[w]}`, { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      }
      const hit = this.add.rectangle(x, y, colW - 4, 66, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, { onTap: () => (reserve ? this.pickReserve(u.uid) : this.pickAlly(u.uid)) });
    });
  }

  private drawHand(actor: ClockUnit): void {
    const s = this.s;
    const moves = [...s.def.allies, ...s.def.reserve].find((d) => d.id === actor.defId)?.moves ?? [];
    const items: { label: string; move: ClockMove; action: ClockAction; art?: string }[] =
      this.tab === 'cards'
        ? s.hand.map((c, index) => ({ label: s.def.cards[c].name, move: s.def.cards[c], action: { kind: 'card', index } as ClockAction, art: CLOCK_CARD_ART[c] }))
        : moves.map((m) => ({ label: m.name, move: m, action: { kind: 'move', moveId: m.id } as ClockAction }));
    const w = 68;
    const gap = (GAME_WIDTH - 16 - w * 5) / 4;
    items.slice(0, 6).forEach((it, i) => {
      const x = 8 + i * (w + gap) + w / 2;
      const y = HAND_Y + 52;
      const sel = this.selected?.move === it.move && this.sameKind(this.selected.action, it.action);
      const c = this.add.rectangle(x, y - (sel ? 6 : 0), w, 100, 0xfdfbf6).setRounded(6);
      if (sel) c.setStrokeStyle(3, COLORS.accent);
      this.root.add(c);
      const top = y - 50 - (sel ? 6 : 0);
      if (it.art && hasImage(this, it.art)) {
        const img = this.add.image(x, top + 28, it.art);
        const src = this.textures.get(it.art).getSourceImage();
        const sc = Math.max(w / src.width, 56 / src.height);
        img.setScale(sc).setCrop((src.width - w / sc) / 2, (src.height - 56 / sc) / 2, w / sc, 56 / sc);
        this.root.add(img);
      } else this.root.add(this.add.rectangle(x, top + 28, w, 56, 0x2b3560));
      const e = it.move.effect;
      const tagText = e.kind === 'damage' ? ELEMENT_LABEL[e.element] + (e.all ? '全' : '') : e.kind === 'heal' ? '回復' : '時';
      const tagColor = e.kind === 'damage' ? ELEMENT_COLOR[e.element] : e.kind === 'heal' ? 0x4cd07d : 0x9a6ad0;
      this.root.add(this.add.rectangle(x - w / 2 + 14, top + 8, 26, 13, tagColor).setRounded(4));
      this.root.add(addText(this, x - w / 2 + 14, top + 8, tagText, { size: 9, bold: true, color: '#101010' }).setOrigin(0.5));
      const name = addText(this, x, top + 66, it.label, { size: 11, bold: true, color: '#222222', align: 'center', wrap: w - 4 }).setOrigin(0.5);
      this.root.add(name);
      this.root.add(addText(this, x, top + 90, `⏱ ${it.move.hours}時間`, { size: 10, color: '#345' }).setOrigin(0.5));
      const hit = this.add.rectangle(x, y, w, 100, 0xffffff, 0.001);
      this.root.add(hit);
      makePressable(hit, { onTap: () => this.pick(it.action, it.move, actor) });
    });
  }

  private sameKind(a: ClockAction, b: ClockAction): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'card' && b.kind === 'card') return a.index === b.index;
    if (a.kind === 'move' && b.kind === 'move') return a.moveId === b.moveId;
    return true;
  }

  private drawCommands(actor: ClockUnit): void {
    const s = this.s;
    const w = (GAME_WIDTH - 16 - 18) / 4;
    const xs = [0, 1, 2, 3].map((i) => 8 + w / 2 + i * (w + 6));
    addButton(this, this.root, xs[0], CMD_Y, w, 52, this.tab === 'cards' ? 'スナップ\n→ 技へ' : '技\n→ スナップへ', { onTap: () => this.switchTab() }, { size: 12 });
    addButton(this, this.root, xs[1], CMD_Y, w, 52, `防御\n⏱ ${CLOCK_RULES.guardHours}時間`, { onTap: () => this.pick({ kind: 'guard' }, null, actor) }, { size: 12 });
    const canSwap = !s.swapped && s.reserve.some((u) => u.hp > 0);
    addButton(this, this.root, xs[2], CMD_Y, w, 52, this.swapMode ? '交代を\nやめる' : 'バトン\n（控えと交代）', { onTap: () => this.toggleSwap() }, { size: 11, enabled: canSwap, fill: canSwap ? 0x5a4a10 : undefined, stroke: COLORS.accent });
    const ok = this.selected && clockActionError(s, this.selected.action) === null;
    addButton(this, this.root, xs[3], CMD_Y, w, 52, '決定', { onTap: () => this.selected && this.act(this.selected.action) }, { size: 16, bold: true, enabled: !!ok, fill: 0x2f6b3f });
  }

  private switchTab(): void {
    this.tab = this.tab === 'cards' ? 'moves' : 'cards';
    this.selected = null;
    this.render();
  }

  private toggleSwap(): void {
    this.swapMode = !this.swapMode;
    this.selected = null;
    this.message = this.swapMode ? `交代する控えをタップ。入った仲間が、そのまま今の番を使う（次の番は${CLOCK_RULES.swapHours}時間遅れる）` : this.message;
    this.render();
  }

  private pick(action: ClockAction, move: ClockMove | null, actor: ClockUnit): void {
    if (this.busy) return;
    this.swapMode = false;
    const e = move?.effect;
    // 相手が要る技は、前に選んだ敵（いなければ一番左の生きている敵）を先に選んでおく
    if (e && ((e.kind === 'damage' && !e.all) || e.kind === 'delay')) {
      const t = this.s.enemies.find((u) => u.uid === this.lastEnemy && u.hp > 0) ?? this.s.enemies.find((u) => u.hp > 0);
      action = { ...action, target: t?.uid } as ClockAction;
    } else if (e && (e.kind === 'heal' || e.kind === 'hasten')) {
      const t = [...this.s.allies].filter((u) => u.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      action = { ...action, target: e.kind === 'heal' ? t?.uid : this.s.allies.find((u) => u.hp > 0 && u.uid !== actor.uid)?.uid } as ClockAction;
    }
    this.selected = { action, move };
    this.message = this.hint(actor, action, move);
    this.render();
  }

  private hint(actor: ClockUnit, action: ClockAction, move: ClockMove | null): string {
    const s = this.s;
    const at = clockTime(nextTurnAt(s, actor, actionHours(s, actor, action) + (s.swapped ? CLOCK_RULES.swapHours : 0)));
    if (!move) return `防御：次の自分の番まで、受けるダメージ半分。次の番は ${at}`;
    const e = move.effect;
    const target = 'target' in action && action.target ? findClockUnit(s, action.target) : undefined;
    if (e.kind === 'damage') {
      const weak = target && (s.revealed[target.uid] ?? []).includes(e.element);
      return `${move.name}（${ELEMENT_LABEL[e.element]}${e.all ? '・全体' : ''}）${target && !e.all ? ` → ${target.name}` : ''}${weak ? '：弱点。番を押し出す' : ''}。次の番は ${at}${e.all ? '' : '（敵をタップで相手を替える）'}`;
    }
    if (e.kind === 'heal') return `${move.name} → ${target?.name ?? ''}（仲間をタップで替える）。次の番は ${at}`;
    if (e.kind === 'delay') return `${move.name}：${target?.name ?? ''}の番を${e.hours}時間遅らせる（敵をタップで替える）。次の番は ${at}`;
    return `${move.name}：${target?.name ?? ''}の番を${e.hours}時間早める（仲間をタップで替える）。次の番は ${at}`;
  }

  private pickEnemy(uid: string): void {
    this.lastEnemy = uid;
    const sel = this.selected;
    const actor = currentActor(this.s);
    if (!sel || !actor || actor.side !== 'ally') return;
    const e = sel.move?.effect;
    if (!e || !((e.kind === 'damage' && !e.all) || e.kind === 'delay')) return;
    this.selected = { ...sel, action: { ...sel.action, target: uid } as ClockAction };
    this.message = this.hint(actor, this.selected.action, sel.move);
    this.render();
  }

  private pickAlly(uid: string): void {
    const sel = this.selected;
    const actor = currentActor(this.s);
    if (!sel || !actor || actor.side !== 'ally') return;
    const e = sel.move?.effect;
    if (!e || !(e.kind === 'heal' || e.kind === 'hasten')) return;
    this.selected = { ...sel, action: { ...sel.action, target: uid } as ClockAction };
    this.message = this.hint(actor, this.selected.action, sel.move);
    this.render();
  }

  private pickReserve(uid: string): void {
    if (!this.swapMode || this.busy) return;
    this.act({ kind: 'swap', reserve: uid });
  }

  /** ダメージ・回復の数を、相手の所に少し出す */
  private popNumbers(log: ClockEvent[]): void {
    log.forEach((ev, i) => {
      if (ev.type !== 'damage' && ev.type !== 'heal') return;
      const p = this.posOf(ev.to);
      if (!p) return;
      const text = ev.type === 'heal' ? `+${ev.amount}` : `${ev.amount}${ev.weak ? ' 弱点!' : ''}`;
      const color = ev.type === 'heal' ? COLORS.heal : ev.weak ? COLORS.weak : findClockUnit(this.s, ev.to)?.side === 'ally' ? COLORS.allyDamage : COLORS.damage;
      const t = addText(this, p.x, p.y, text, { size: 18, bold: true, color }).setOrigin(0.5).setDepth(50).setStroke('#000000', 4);
      this.tweens.add({ targets: t, y: p.y - 30, alpha: 0, delay: i * 120, duration: 900, onComplete: () => t.destroy() });
    });
  }

  private posOf(uid: string): { x: number; y: number } | null {
    const ei = this.s.enemies.findIndex((u) => u.uid === uid);
    if (ei >= 0) return { x: (GAME_WIDTH / this.s.enemies.length) * (ei + 0.5), y: ENEMY_TOP + 40 };
    const ai = this.s.allies.findIndex((u) => u.uid === uid);
    if (ai >= 0) return { x: 8 + ((GAME_WIDTH - 16) / 5) * (ai + 0.5), y: ALLY_Y + 10 };
    return null;
  }

  private showEnd(): void {
    const win = this.s.outcome === 'win';
    const o = this.add.container(0, 0).setDepth(100);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    o.add(addText(this, GAME_WIDTH / 2, 300, win ? '勝利！' : '全滅…', { size: 30, bold: true, color: win ? COLORS.accentText : '#ff8a7a' }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 344, `かかった時間 ${this.s.time.toFixed(1)}時間・刻限 ${this.s.phase}回`, { size: 13, color: COLORS.subText }).setOrigin(0.5));
    addButton(this, o, GAME_WIDTH / 2, 420, 260, 52, 'もう一度（同じ敵）', { onTap: () => this.scene.restart({ trial: this.trial }) }, { size: 15 });
    const other = CLOCK_TRIALS.find((t) => t.id !== this.trial);
    if (other) addButton(this, o, GAME_WIDTH / 2, 484, 260, 52, `ほかの試し：${other.enemies.length}体`, { onTap: () => this.scene.restart({ trial: other.id }) }, { size: 15 });
    addButton(this, o, GAME_WIDTH / 2, 548, 260, 52, 'タイトルへ', { onTap: () => this.scene.start('Title') }, { size: 15 });
  }
}

/** 時刻を「◯時」で（1周12時間。小数は「半」） */
export function clockTime(t: number): string {
  const h = ((t % 12) + 12) % 12;
  const whole = Math.floor(h + 1e-6);
  const half = h - whole >= 0.5 - 1e-6;
  return `${whole === 0 ? 12 : whole}時${half ? '半' : ''}`;
}

const elementName = (e: Element) => ELEMENT_LABEL[e];

/** その行動で何が起きたかを、1〜2行で */
function describe(prev: ClockState, s: ClockState, log: ClockEvent[]): string {
  const name = (uid: string) => findClockUnit(s, uid)?.name ?? findClockUnit(prev, uid)?.name ?? uid;
  const parts: string[] = [];
  for (const ev of log) {
    if (ev.type === 'act') parts.push(`${name(ev.uid)}の${ev.name}！`);
    else if (ev.type === 'damage') parts.push(`${name(ev.to)}に${ev.amount}${ev.weak ? '（弱点）' : ev.resist ? '（耐性）' : ''}`);
    else if (ev.type === 'heal') parts.push(`${name(ev.to)}が${ev.amount}回復`);
    else if (ev.type === 'push') parts.push(`${name(ev.to)}の番を${ev.hours}時間押し出した`);
    else if (ev.type === 'shift') parts.push(`${name(ev.to)}の番が${Math.abs(ev.hours)}時間${ev.hours > 0 ? '遅れた' : '早まった'}`);
    else if (ev.type === 'defeat') parts.push(`${name(ev.uid)}を倒した`);
    else if (ev.type === 'swap') parts.push(`${name(ev.out)}→${name(ev.in)}にバトンタッチ`);
    else if (ev.type === 'kokugen') parts.push(`刻限！ 敵の攻撃が強くなった（${ev.phase}回目）`);
    else if (ev.type === 'reveal') parts.push(`弱点：${elementName(ev.element)}`);
  }
  return parts.join(' ');
}
