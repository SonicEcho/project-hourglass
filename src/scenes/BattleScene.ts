import Phaser from 'phaser';
import type { ActionDef, ActionPreview, BattleState, ComboDef, LinkDef, LogEvent, PlayerAction, TargetRef, TargetScope } from '../core';
import {
  applyAction,
  batonTargets,
  canUseLink,
  comboCards,
  createBattle,
  currentAlly,
  findUnit,
  getActionError,
  getBattleResult,
  getTurnForecast,
  previewAction,
  runEnemyTurn,
  startNextTurn,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BASIC_ATTACK, createEncounterSetup, type EncounterId, GUARD } from '../data';
import { drawBattle, type Panel, unitPosition, type ViewHandlers, type ViewModel } from '../ui/battleViews';
import { LAYOUT } from '../ui/layout';
import { ALLY_COLOR, COLORS, ELEMENT_LABEL, RENDER_SCALE } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import type { ResultSceneData } from './ResultScene';
import { battleSeed, setActiveBattle } from './run';

/** 選んでいる行動の元 */
type Pending =
  | { source: 'card'; cardUid: number }
  | { source: 'skill'; skillId: string }
  | { source: 'attack' }
  | { source: 'guard' }
  | { source: 'link'; linkId: string }
  | { source: 'combo'; comboId: string }
  | { source: 'baton' };

interface Selection {
  pending: Pending;
  target?: TargetRef;
  pickCardUid?: number;
}

export interface BattleSceneData {
  encounter?: EncounterId;
}

/** 演出の待ち時間（ミリ秒） */
const FX = { banner: 550, popup: 260, settle: 380, turnStart: 300 };

export class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  private encounter: EncounterId = 'battle1';
  private selection: Selection | null = null;
  private panel: Panel = 'none';
  private message = '';
  private busy = false;
  private root!: Phaser.GameObjects.Container;
  private fxLayer!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private skipping = false;
  /** 連携技・コンボの演出中（数値を大きく、画面を揺らす） */
  private special = false;
  private waits: { timer: Phaser.Time.TimerEvent; resolve: () => void }[] = [];

  constructor() {
    super('Battle');
  }

  create(data: BattleSceneData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.encounter = data.encounter ?? 'battle1';
    const seed = battleSeed(this.encounter);
    console.log(`[battle] ${this.encounter} seed=${seed}`);
    // 毎戦闘、HPとMPは全回復した状態で始まる
    this.state = createBattle(createEncounterSetup(this.encounter, seed));
    this.selection = null;
    this.panel = 'none';
    this.busy = false;
    this.skipping = false;
    this.waits = [];
    this.overlay = undefined;
    this.message = '';
    setActiveBattle({
      encounter: this.encounter,
      getState: () => this.state,
      replaceState: (s) => this.replaceState(s),
    });
    this.events.once('shutdown', () => setActiveBattle(null));
    this.root = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0).setDepth(100);
    void this.proceed();
  }

  /** デバッグメニューから状態を差し替える。演出中は受け付けない */
  private replaceState(s: BattleState): boolean {
    if (this.busy || this.state.outcome !== 'ongoing') return false;
    this.state = s;
    this.clearSelection();
    this.message = this.idleMessage();
    this.render();
    return true;
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
          const events = next.log.slice(s.log.length);
          const swapped = events.some((e) => e.type === 'discardHand');
          const drew = events.find((e) => e.type === 'draw');
          const handNote = swapped ? '（手札を入れ替えた）' : drew && drew.type === 'draw' && s.hand.length > 0 ? `（手札を残して+${drew.cardUids.length}枚）` : '';
          this.message = `${actor.name}の番${handNote}`;
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
    const link = act?.type === 'action' ? prev.links.find((l) => l.id === act.actionId) : undefined;
    const combo = act?.type === 'action' ? prev.combos.find((c) => c.id === act.actionId) : undefined;
    this.special = !!(link || combo);
    if (act) {
      this.message = this.describeHeadline(prev, act);
      this.render(prev);
      if (link) await this.linkCutIn(prev, link);
      else if (combo) await this.comboCutIn(combo);
      else {
        this.banner(this.message);
        await this.wait(FX.banner);
      }
    }
    this.state = next;
    this.render(next);
    for (const e of events) {
      if (this.showEvent(next, e)) await this.wait(FX.popup);
    }
    await this.wait(FX.settle);
    this.fxLayer.removeAll(true);
    this.special = false;
  }

  /** 連携技のカットイン：2人の帯が左右から入り、技名を大きく出す */
  private async linkCutIn(s: BattleState, link: LinkDef): Promise<void> {
    if (this.skipping) return;
    const c = this.add.container(0, 0);
    this.fxLayer.add(c);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0));
    link.members.forEach((id, i) => {
      const unit = findUnit(s, id);
      const y = 250 + i * 90;
      const band = this.add.container(i === 0 ? -GAME_WIDTH : GAME_WIDTH, y);
      band.add(this.add.rectangle(0, 0, GAME_WIDTH, 72, ALLY_COLOR[id] ?? COLORS.ally).setOrigin(0, 0.5));
      const name = addText(this, GAME_WIDTH / 2, 0, unit?.name ?? id, { size: 30, bold: true, align: 'center' }).setOrigin(0.5);
      name.setStroke('#000000', 5);
      band.add(name);
      c.add(band);
      this.tweens.add({ targets: band, x: 0, duration: 260, delay: i * 120, ease: 'Cubic.easeOut' });
    });
    const cross = addText(this, GAME_WIDTH / 2, 295, '×', { size: 28, bold: true, color: COLORS.accentText }).setOrigin(0.5);
    cross.setAlpha(0);
    c.add(cross);
    this.tweens.add({ targets: cross, alpha: 1, delay: 380, duration: 120 });
    const label = addText(this, GAME_WIDTH / 2, 410, '連携技', { size: 16, bold: true, color: COLORS.accentText }).setOrigin(0.5).setAlpha(0);
    const title = addText(this, GAME_WIDTH / 2, 455, `${link.name}！`, { size: 40, bold: true, color: '#ffffff', align: 'center' }).setOrigin(0.5);
    title.setStroke('#c08000', 8).setScale(2.4).setAlpha(0);
    c.add([label, title]);
    this.tweens.add({ targets: label, alpha: 1, delay: 450, duration: 150 });
    this.tweens.add({ targets: title, scale: 1, alpha: 1, delay: 450, duration: 280, ease: 'Back.easeOut' });
    await this.wait(1150);
    if (!this.skipping) {
      const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1).setOrigin(0);
      this.fxLayer.add(flash);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300 });
      this.cameras.main.shake(260, 0.012);
    }
    c.destroy(true);
  }

  /** コンボのカットイン：金色の帯に技名 */
  private async comboCutIn(combo: ComboDef): Promise<void> {
    if (this.skipping) return;
    const c = this.add.container(0, 0);
    this.fxLayer.add(c);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0));
    const band = this.add.rectangle(GAME_WIDTH / 2, 330, GAME_WIDTH, 96, 0x5a4a10, 0.95).setStrokeStyle(2, COLORS.accent);
    band.setScale(1, 0);
    c.add(band);
    this.tweens.add({ targets: band, scaleY: 1, duration: 160, ease: 'Cubic.easeOut' });
    const tag = addText(this, GAME_WIDTH / 2, 305, 'COMBO!', { size: 16, bold: true, color: COLORS.accentText }).setOrigin(0.5);
    const title = addText(this, GAME_WIDTH / 2, 342, combo.name, { size: 32, bold: true }).setOrigin(0.5);
    title.setStroke('#000000', 6).setScale(1.8).setAlpha(0);
    c.add([tag, title]);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, delay: 120, duration: 220, ease: 'Back.easeOut' });
    await this.wait(850);
    c.destroy(true);
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
        this.popup(p.x, p.y, String(e.amount), isAlly ? COLORS.allyDamage : COLORS.damage, this.special ? 34 : 26);
        if (this.special && !this.skipping) this.cameras.main.shake(120, 0.006);
        if (e.partId !== undefined && e.partAmount !== undefined) {
          const pp = unitPosition(s, e.targetId, e.partId);
          this.popup(pp.x, pp.y, String(e.partAmount), '#ffc070', 22);
        }
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
      case 'partBreak': {
        const p = unitPosition(s, e.enemyId, e.partId);
        this.popup(p.x, p.y - 10, '部位破壊！', COLORS.weak, 18);
        return true;
      }
      case 'weaknessFound': {
        // 弱点を突いて判明した時は WEAK! が出るので、部位破壊で露出した時だけ見せる
        const enemy = s.enemies.find((x) => x.uid === e.enemyId);
        const viaBreak = !!enemy?.parts.some((p) => p.broken && p.revealsWeakness.includes(e.element));
        if (!viaBreak) return false;
        const p = unitPosition(s, e.enemyId);
        this.popup(p.x, p.y - 40, `弱点露出：${ELEMENT_LABEL[e.element]}`, COLORS.weak, 16);
        return true;
      }
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
      case 'combo':
        return s.combos.find((c) => c.id === p.comboId);
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
      case 'combo':
        return { type: 'combo', comboId: p.comboId, target: sel.target };
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
    // 連続攻撃は同じ対象への予想を足し合わせる
    const merged: ActionPreview['targets'] = [];
    for (const t of p.targets) {
      const m = merged.find((x) => x.unitId === t.unitId && x.partId === t.partId && x.kind === t.kind);
      if (!m) merged.push({ ...t });
      else {
        m.min += t.min;
        m.max += t.max;
        if (t.partMin !== undefined) m.partMin = (m.partMin ?? 0) + t.partMin;
        if (t.partMax !== undefined) m.partMax = (m.partMax ?? 0) + t.partMax;
      }
    }
    const parts = merged.slice(0, 3).map((t) => {
      const unit = findUnit(this.state, t.unitId);
      const range = (a: number, b: number) => (a === b ? `${a}` : `${a}〜${b}`);
      const tag = t.affinity === 'weak' ? ' WEAK' : t.affinity === 'resist' ? ' 耐性' : '';
      if (t.partId !== undefined && unit?.side === 'enemy') {
        const part = unit.parts.find((x) => x.id === t.partId);
        return `${part?.name ?? ''} ${range(t.partMin!, t.partMax!)}／本体 ${range(t.min, t.max)}${tag}`;
      }
      return `${unit?.name ?? ''} ${t.kind === 'heal' ? '回復' : ''}${range(t.min, t.max)}${tag}`;
    });
    if (merged.length > 3) parts.push('…');
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
    const same =
      sel.target &&
      sel.target.kind === target.kind &&
      sel.target.id === target.id &&
      (sel.target.kind === 'enemy' ? sel.target.partId : undefined) === (target.kind === 'enemy' ? target.partId : undefined);
    if (same) {
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
      tapEnemy: (id, partId) => {
        if (!this.selection) return;
        this.tapTarget({ kind: 'enemy', id, partId });
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
      tapCombo: (id) => {
        const cur = this.selection?.pending;
        if (cur?.source === 'combo' && cur.comboId === id) this.cancel();
        else this.select({ source: 'combo', comboId: id });
      },
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
      selectedComboId: sel?.pending.source === 'combo' ? sel.pending.comboId : undefined,
      comboCardUids: this.selectedComboCards(s),
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

  private selectedComboCards(s: BattleState): number[] {
    const p = this.selection?.pending;
    if (p?.source !== 'combo') return [];
    const combo = s.combos.find((c) => c.id === p.comboId);
    return combo ? (comboCards(s, combo) ?? []).map((c) => c.uid) : [];
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

  /** 勝敗がついた時。戦闘1の勝利ならボス戦へ、それ以外は結果画面へ */
  private showEnd(): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(300);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0).setInteractive();
    const win = this.state.outcome === 'victory';
    const title = addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, win ? '勝利！' : '敗北…', {
      size: 44,
      bold: true,
      color: win ? COLORS.accentText : COLORS.allyDamage,
    }).setOrigin(0.5);
    c.add([shade, title]);
    if (win && this.encounter === 'battle1') {
      c.add(
        addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, '次はボス戦\n（HPとMPは全回復する）', {
          size: 15,
          align: 'center',
          color: COLORS.subText,
        }).setOrigin(0.5),
      );
      addButton(this, c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 240, 60, 'ボス戦へ', { onTap: () => this.scene.start('Battle', { encounter: 'battle2' }) }, {
        size: 18,
        bold: true,
        fill: 0x5a4a10,
        stroke: COLORS.accent,
        strokeWidth: 2,
      });
    } else {
      const result = getBattleResult(this.state);
      const data: ResultSceneData = { outcome: result.outcome === 'victory' ? 'victory' : 'defeat', encounter: this.encounter, brokenParts: result.brokenParts, seed: this.state.seed };
      addButton(this, c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 240, 60, '結果へ', { onTap: () => this.scene.start('Result', data) }, { size: 18, bold: true });
    }
    this.overlay = c;
  }
}

/** デバッグ用に、出来事をコンソールへ出す（?debug=1 なら eruda で見られる） */
function logEvents(events: LogEvent[]): void {
  for (const e of events) console.log('[battle]', JSON.stringify(e));
}
