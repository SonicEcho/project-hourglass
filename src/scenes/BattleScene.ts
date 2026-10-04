import Phaser from 'phaser';
import type { ActionDef, ActionPreview, BattleState, LogEvent, PlayerAction, TargetRef, TargetScope } from '../core';
import {
  applyAction,
  batonTargets,
  canUseLink,
  createBattle,
  currentAlly,
  findUnit,
  getActionError,
  getTurnForecast,
  previewAction,
  runEnemyTurn,
  startNextTurn,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BASIC_ATTACK, createEncounterSetup, GUARD } from '../data';
import { drawBattle, type Panel, unitPosition, type ViewHandlers, type ViewModel } from '../ui/battleViews';
import { LAYOUT } from '../ui/layout';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';

/** 選んでいる行動の元 */
type Pending =
  | { source: 'card'; cardUid: number }
  | { source: 'skill'; skillId: string }
  | { source: 'attack' }
  | { source: 'guard' }
  | { source: 'link'; linkId: string }
  | { source: 'baton' };

interface Selection {
  pending: Pending;
  target?: TargetRef;
  pickCardUid?: number;
}

export interface BattleSceneData {
  seed?: number;
}

/** 演出の待ち時間（ミリ秒） */
const FX = { banner: 550, popup: 260, settle: 380, turnStart: 300 };

export class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  private selection: Selection | null = null;
  private panel: Panel = 'none';
  private message = '';
  private busy = false;
  private root!: Phaser.GameObjects.Container;
  private fxLayer!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private skipping = false;
  private waits: { timer: Phaser.Time.TimerEvent; resolve: () => void }[] = [];

  constructor() {
    super('Battle');
  }

  create(data: BattleSceneData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const seed = data.seed ?? seedFromUrl() ?? Math.floor(Math.random() * 2 ** 31);
    console.log(`[battle] seed=${seed}`);
    this.state = createBattle(createEncounterSetup('battle1', seed));
    this.selection = null;
    this.panel = 'none';
    this.busy = false;
    this.root = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0).setDepth(100);
    void this.proceed();
  }

  // ---- 手番の進行 ----

  /** 味方の手番が来るまで（敵の手番は演出しながら）進める */
  private async proceed(): Promise<void> {
    this.busy = true;
    this.clearSelection();
    for (let guard = 0; guard < 1000; guard++) {
      const s = this.state;
      if (s.outcome !== 'ongoing') break;
      if (!s.turn) {
        const next = startNextTurn(s);
        this.state = next;
        logEvents(next.log.slice(s.log.length));
        const actor = findUnit(next, next.turn!.actorId)!;
        if (actor.side === 'ally') {
          this.message = `${actor.name}の番`;
          this.render();
          await this.wait(FX.turnStart);
        }
        continue;
      }
      if (currentAlly(s)) break;
      const next = runEnemyTurn(s);
      await this.play(s, next);
    }
    this.busy = false;
    this.skipping = false;
    if (this.state.outcome !== 'ongoing') {
      this.render();
      this.showEnd();
      return;
    }
    this.message = this.idleMessage();
    this.render();
  }

  private async execute(action: PlayerAction): Promise<void> {
    if (this.busy) return;
    const err = getActionError(this.state, action);
    if (err) {
      this.message = `この行動はできません（${err}）`;
      this.render();
      return;
    }
    this.busy = true;
    const before = this.state;
    this.clearSelection();
    const after = applyAction(before, action);
    await this.play(before, after);
    if (after.turn && after.outcome === 'ongoing') {
      // ワンモア、またはバトンを受けた仲間の手番
      this.busy = false;
      this.skipping = false;
      this.message = this.idleMessage();
      this.render();
      return;
    }
    await this.proceed();
  }

  // ---- 演出 ----

  /** prev → next で増えた出来事を短い演出で見せる。タップで早送り */
  private async play(prev: BattleState, next: BattleState): Promise<void> {
    const events = next.log.slice(prev.log.length);
    logEvents(events);
    const act = events.find((e) => e.type === 'action' || e.type === 'standUp' || e.type === 'baton');
    if (act) {
      this.message = this.describeHeadline(prev, act);
      this.render(prev);
      this.banner(this.message);
      await this.wait(FX.banner);
    }
    this.state = next;
    this.render(next);
    for (const e of events) {
      if (this.showEvent(next, e)) await this.wait(FX.popup);
    }
    await this.wait(FX.settle);
    this.fxLayer.removeAll(true);
  }

  private describeHeadline(s: BattleState, e: LogEvent): string {
    if (e.type === 'action') {
      const actor = findUnit(s, e.actorId);
      return `${actor?.name ?? ''}の ${e.name}`;
    }
    if (e.type === 'standUp') return `${findUnit(s, e.enemyId)?.name ?? ''}は立ち上がった`;
    if (e.type === 'baton') return `${findUnit(s, e.fromId)?.name}から${findUnit(s, e.toId)?.name}へバトンタッチ！`;
    return '';
  }

  /** 1つの出来事を文字で見せる。見せたら true */
  private showEvent(s: BattleState, e: LogEvent): boolean {
    switch (e.type) {
      case 'damage': {
        const p = unitPosition(s, e.targetId);
        const isAlly = s.allies.some((a) => a.uid === e.targetId);
        this.popup(p.x, p.y, String(e.amount), isAlly ? COLORS.allyDamage : COLORS.damage, 26);
        if (e.affinity === 'weak') this.popup(p.x, p.y - 34, 'WEAK!', COLORS.weak, 18);
        if (e.affinity === 'resist') this.popup(p.x, p.y - 34, '耐性', COLORS.subText, 14);
        return true;
      }
      case 'heal': {
        const p = unitPosition(s, e.targetId);
        this.popup(p.x, p.y, `+${e.amount}`, COLORS.heal, 24);
        return true;
      }
      case 'oneMore':
        this.bigText('ONE MORE!');
        return true;
      case 'baton':
        this.bigText('BATON TOUCH!');
        return true;
      case 'guard': {
        const p = unitPosition(s, e.actorId);
        this.popup(p.x, p.y, '防御', COLORS.subText, 16);
        return true;
      }
      case 'defeated': {
        const p = unitPosition(s, e.unitId);
        this.popup(p.x, p.y + 30, s.allies.some((a) => a.uid === e.unitId) ? '戦闘不能' : '撃破', COLORS.subText, 16);
        return true;
      }
      default:
        return false;
    }
  }

  private popup(x: number, y: number, text: string, color: string, size: number): void {
    if (this.skipping) return;
    const t = addText(this, x, y, text, { size, color, bold: true, align: 'center' }).setOrigin(0.5);
    t.setStroke('#000000', 4);
    this.fxLayer.add(t);
    this.tweens.add({ targets: t, y: y - 26, duration: 500, ease: 'Cubic.easeOut' });
  }

  private bigText(text: string): void {
    if (this.skipping) return;
    const y = LAYOUT.enemies.y + LAYOUT.enemies.h - 30;
    const t = addText(this, GAME_WIDTH / 2, y, text, { size: 34, color: COLORS.weak, bold: true, align: 'center' }).setOrigin(0.5);
    t.setStroke('#000000', 6);
    t.setScale(0.6);
    this.fxLayer.add(t);
    this.tweens.add({ targets: t, scale: 1, duration: 250, ease: 'Back.easeOut' });
  }

  private banner(text: string): void {
    if (this.skipping) return;
    const y = LAYOUT.message.y + LAYOUT.message.h / 2;
    const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, LAYOUT.message.h, 0x000000, 1);
    const t = addText(this, GAME_WIDTH / 2, y, text, { size: 16, bold: true, align: 'center' }).setOrigin(0.5);
    this.fxLayer.add([bg, t]);
  }

  /** 待つ。早送り中はすぐ終わる */
  private wait(ms: number): Promise<void> {
    if (this.skipping) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = this.time.delayedCall(ms, () => {
        this.waits = this.waits.filter((w) => w.timer !== timer);
        resolve();
      });
      this.waits.push({ timer, resolve });
    });
  }

  /** 演出中のタップで早送り */
  private skip(): void {
    if (!this.busy || this.skipping) return;
    this.skipping = true;
    this.tweens.killAll();
    this.fxLayer.removeAll(true);
    const pending = this.waits;
    this.waits = [];
    for (const w of pending) {
      w.timer.remove();
      w.resolve();
    }
  }

  // ---- 選択と操作 ----

  private clearSelection(): void {
    this.selection = null;
    this.panel = 'none';
  }

  private actionDef(p: Pending): ActionDef | undefined {
    const s = this.state;
    switch (p.source) {
      case 'card':
        return s.hand.find((c) => c.uid === p.cardUid)?.card;
      case 'skill':
        return currentAlly(s)?.skills.find((k) => k.id === p.skillId);
      case 'attack':
        return BASIC_ATTACK;
      case 'guard':
        return GUARD;
      case 'link':
        return s.links.find((l) => l.id === p.linkId);
      case 'baton':
        return undefined;
    }
  }

  private scopeOf(p: Pending): TargetScope | null {
    if (p.source === 'baton') return 'ally';
    return this.actionDef(p)?.target ?? null;
  }

  private needsPick(p: Pending): boolean {
    return !!this.actionDef(p)?.effects.some((e) => e.kind === 'retrieve');
  }

  /** 選択から行動を組み立てる。まだ足りなければ null */
  private buildAction(sel: Selection | null): PlayerAction | null {
    if (!sel) return null;
    const p = sel.pending;
    const scope = this.scopeOf(p);
    if ((scope === 'enemy' || scope === 'ally') && !sel.target) return null;
    if (this.needsPick(p) && sel.pickCardUid === undefined) return null;
    switch (p.source) {
      case 'card':
        return { type: 'card', cardUid: p.cardUid, target: sel.target, pickCardUid: sel.pickCardUid };
      case 'skill':
        return { type: 'skill', skillId: p.skillId, target: sel.target, pickCardUid: sel.pickCardUid };
      case 'attack':
        return { type: 'attack', target: sel.target! };
      case 'guard':
        return { type: 'guard' };
      case 'link':
        return { type: 'link', linkId: p.linkId };
      case 'baton':
        return { type: 'baton', toAllyId: sel.target!.id };
    }
  }

  private select(pending: Pending, keepPanel = false): void {
    this.selection = { pending };
    if (!keepPanel) this.panel = 'none';
    if (this.needsPick(pending)) {
      if (this.state.discard.length === 0) {
        this.selection = null;
        this.message = '捨て札がないので使えません';
        this.render();
        return;
      }
      this.panel = 'discard';
    }
    this.updatePreview();
  }

  /** 選択の状態に合わせて、案内とプレビューの文字を作り直す */
  private updatePreview(): void {
    const sel = this.selection;
    if (!sel) {
      this.message = this.idleMessage();
      this.render();
      return;
    }
    const scope = this.scopeOf(sel.pending);
    const name = sel.pending.source === 'baton' ? 'バトンタッチ' : (this.actionDef(sel.pending)?.name ?? '');
    const action = this.buildAction(sel);
    if (!action) {
      if (sel.pending.source === 'baton') this.message = 'バトンタッチ：渡す仲間をタップ';
      else if (this.needsPick(sel.pending) && sel.pickCardUid === undefined) this.message = `${name}：手札に加えるカードをタップ`;
      else this.message = `${name}：${scope === 'ally' ? '味方' : '敵'}をタップ`;
      this.render();
      return;
    }
    const err = getActionError(this.state, action);
    if (err) {
      this.message = `${name}：この対象は選べません`;
      sel.target = undefined;
      this.render();
      return;
    }
    const preview = previewAction(this.state, action);
    const confirmHint = scope === 'enemy' || scope === 'ally' ? 'もう一度タップか「実行」で決定' : '「実行」で決定';
    this.message = [`${name}　${this.previewText(preview)}`.trim(), confirmHint].join('\n');
    this.render();
  }

  private previewText(p: ActionPreview): string {
    const parts = p.targets.slice(0, 3).map((t) => {
      const unit = findUnit(this.state, t.unitId);
      const amount = t.min === t.max ? `${t.min}` : `${t.min}〜${t.max}`;
      const tag = t.affinity === 'weak' ? ' WEAK' : t.affinity === 'resist' ? ' 耐性' : '';
      return `${unit?.name ?? ''} ${t.kind === 'heal' ? '回復' : ''}${amount}${tag}`;
    });
    if (p.targets.length > 3) parts.push('…');
    if (this.selection?.pending.source === 'baton') return '';
    const next = p.nextTurnIndex > 0 ? `次の手番 ${p.nextTurnIndex + 1}番目` : p.nextTurnIndex === 0 ? '' : '次の手番 9番目以降';
    return [parts.join(' / '), next].filter(Boolean).join('　');
  }

  private idleMessage(): string {
    const actor = currentAlly(this.state);
    if (!actor) return '';
    if (this.state.turn?.oneMoreActive) return `ONE MORE! ${actor.name}はもう1回行動できる（バトンタッチも可）`;
    return `${actor.name}の番：カードかコマンドを選ぶ（長押しで詳細）`;
  }

  private tapTarget(target: TargetRef): void {
    const sel = this.selection;
    if (!sel) return;
    const scope = this.scopeOf(sel.pending);
    if (scope !== target.kind) {
      this.cancel();
      return;
    }
    if (sel.target && sel.target.kind === target.kind && sel.target.id === target.id) {
      const action = this.buildAction(sel);
      if (action) void this.execute(action);
      return;
    }
    sel.target = target;
    this.updatePreview();
  }

  private cancel(): void {
    this.clearSelection();
    this.message = this.idleMessage();
    this.render();
  }

  private handlers(): ViewHandlers {
    return {
      tapBackground: () => this.cancel(),
      tapEnemy: (id) => {
        if (!this.selection) return;
        this.tapTarget({ kind: 'enemy', id });
      },
      tapAlly: (id) => {
        if (!this.selection) return;
        this.tapTarget({ kind: 'ally', id });
      },
      tapCard: (uid) => {
        const cur = this.selection?.pending;
        if (cur?.source === 'card' && cur.cardUid === uid) {
          this.cancel();
          return;
        }
        this.select({ source: 'card', cardUid: uid });
      },
      tapSkill: (id) => this.select({ source: 'skill', skillId: id }, true),
      tapBasic: (kind) => this.select({ source: kind }, true),
      tapDiscard: (uid) => {
        if (!this.selection) return;
        this.selection.pickCardUid = uid;
        this.panel = 'none';
        this.updatePreview();
      },
      tapCommand: (kind) => {
        if (kind === 'skills' || kind === 'other') {
          const open = this.panel === kind;
          this.clearSelection();
          this.panel = open ? 'none' : kind;
          this.message = this.idleMessage();
          this.render();
          return;
        }
        if (kind === 'baton') {
          if (this.selection?.pending.source === 'baton') this.cancel();
          else if (batonTargets(this.state).length > 0) this.select({ source: 'baton' });
          return;
        }
        const link = this.state.links.find((l) => canUseLink(this.state, l.id));
        if (link) this.select({ source: 'link', linkId: link.id });
      },
      confirm: () => {
        const action = this.buildAction(this.selection);
        if (action) void this.execute(action);
      },
      cancel: () => this.cancel(),
      detail: (title, body) => this.showDetail(title, body),
    };
  }

  // ---- 描画 ----

  private render(s: BattleState = this.state): void {
    this.root.removeAll(true);
    const sel = this.selection;
    const interactive = !this.busy && s === this.state && s.outcome === 'ongoing' && !!currentAlly(s);
    const action = this.buildAction(sel);
    const valid = !!action && getActionError(s, action) === null;

    // 行動を選んでいれば、その重さで行動順を予告する
    let forecast = getTurnForecast(s);
    let predictedIndex = -1;
    if (interactive && sel && sel.pending.source !== 'baton') {
      const def = this.actionDef(sel.pending);
      const actor = currentAlly(s)!;
      if (def) {
        const members = 'members' in def ? (def.members as string[]) : [actor.uid];
        forecast = getTurnForecast(s, { pending: members.map((id) => ({ id, weight: def.weight })) });
        predictedIndex = forecast.findIndex((e, i) => i > 0 && e.id === actor.uid);
      }
    }

    const vm: ViewModel = {
      state: s,
      forecast,
      predictedIndex,
      scope: interactive && sel && sel.pending.source !== 'baton' ? this.scopeOf(sel.pending) : null,
      selectedCardUid: sel?.pending.source === 'card' ? sel.pending.cardUid : undefined,
      selectedSkillId: sel?.pending.source === 'skill' ? sel.pending.skillId : undefined,
      selectedTarget: sel?.target,
      batonMode: interactive && sel?.pending.source === 'baton',
      panel: interactive ? this.panel : 'none',
      message: this.message,
      showFooter: interactive && !!sel,
      canConfirm: valid,
      interactive,
    };
    drawBattle(this, this.root, vm, this.handlers());

    // 演出中は全面でタップを受けて早送りにする
    if (this.busy) {
      const blocker = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001).setOrigin(0);
      this.root.add(blocker);
      blocker.setInteractive();
      blocker.on('pointerdown', () => this.skip());
    }
  }

  private closeOverlay(): void {
    this.overlay?.destroy(true);
    this.overlay = undefined;
  }

  /** 長押しの詳細。どこかをタップすると閉じる */
  private showDetail(title: string, body: string): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(200);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);
    c.add(shade);
    const w = GAME_WIDTH - 40;
    const text = addText(this, 0, 0, body, { size: 14, wrap: w - 32 });
    const h = text.height + 90;
    const y = GAME_HEIGHT / 2 - h / 2 - 60;
    const panel = this.add.rectangle(20, y, w, h, COLORS.panel).setOrigin(0).setStrokeStyle(2, COLORS.accent);
    const titleText = addText(this, 36, y + 14, title, { size: 17, bold: true, color: COLORS.accentText });
    text.setPosition(36, y + 44);
    const hint = addText(this, GAME_WIDTH / 2, y + h - 16, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([panel, titleText, text, hint]);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    this.overlay = c;
  }

  private showEnd(): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(300);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0).setInteractive();
    const win = this.state.outcome === 'victory';
    const title = addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, win ? '勝利！' : '敗北…', {
      size: 44,
      bold: true,
      color: win ? COLORS.accentText : COLORS.allyDamage,
    }).setOrigin(0.5);
    const note = addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, `seed ${this.state.seed}`, { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([shade, title, note]);
    addButton(this, c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 220, 56, 'もう一度', { onTap: () => this.scene.restart({}) }, { size: 18, bold: true });
    this.overlay = c;
  }
}

function seedFromUrl(): number | undefined {
  const v = new URLSearchParams(window.location.search).get('seed');
  if (v === null || v === '' || Number.isNaN(Number(v))) return undefined;
  return Number(v) >>> 0;
}

/** デバッグ用に、出来事をコンソールへ出す（?debug=1 なら eruda で見られる） */
function logEvents(events: LogEvent[]): void {
  for (const e of events) console.log('[battle]', JSON.stringify(e));
}
