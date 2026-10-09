import Phaser from 'phaser';
import { getSettings, playSe, setSettings } from '../audio/sound';
import { autoExtra, autoPlan, lcg } from '../sim/autoBattle';
import { extraByTactic, isTactic, planByTactic, type Tactic, TACTICS } from '../sim/tactics';
import type { ActionDef, ActionPreview, AllyUnit, BattleState, CardInstance, ComboDef, LinkDef, LogEvent, PlayerAction, Progress, TargetRef, TargetScope } from '../core';
import {
  advance,
  applyExtra,
  battleReward,
  batonTargets,
  chargingAction,
  comboCards,
  createBattle,
  declineExtra,
  extraPool,
  findUnit,
  getBattleResult,
  getExtraError,
  getPlanError,
  getRoundOrder,
  getSupportError,
  isOffBalance,
  isPlanComplete,
  linkReady,
  passBaton,
  planOf,
  planPool,
  previewAction,
  resolveSearch,
  setPlan,
  startExecution,
  step,
  unplannedAllies,
  useSupport,
  basicAttackFor,
  boardColorCells,
  recordVictory,
  weaponLevel,
  weaponName,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { CampaignBattle } from '../data';
import { AREA_BATTLES, BASIC_ATTACK, createCampaignSetup, GUARD, NAVI_REWARD_PICKS, PART_BREAK_POINTS, PROTOTYPE_LINEUP, SE, STORY, WEAPON_DATA } from '../data';
import { actorLinks, chargeCounterText, drawBattle, type FooterMode, resetShownValues, type Panel, unitPosition, type ViewHandlers, type ViewModel } from '../ui/battleViews';
import { LAYOUT } from '../ui/layout';
import { ALLY_COLOR, COLORS, ELEMENT_LABEL, RENDER_SCALE } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { maybeShowTip, seenTips } from '../ui/tipPanel';
import type { ResultSceneData } from './ResultScene';
import type { Lineup } from '../core';
import { battleTipTriggers, nextBattleSpeed } from '../core';
import { battleAt, battleSeed, currentNaviData, currentParty, finishRun, lineupBase, run, saveRun, setActiveBattle, setStoryLinkGauge, storyLineup, storyLinkGauge } from './run';
import { addWindow, enterScreen, fadeOutAndDestroy, popIn } from '../ui/skin';

/** 選んでいる行動の元 */
type Pending =
  | { source: 'card'; cardUid: number }
  | { source: 'skill'; skillId: string }
  | { source: 'attack' }
  | { source: 'guard' }
  | { source: 'link'; linkId: string }
  | { source: 'combo'; comboId: string }
  | { source: 'support'; cardUid: number }
  | { source: 'baton' };

interface Selection {
  pending: Pending;
  target?: TargetRef;
  pickCardUid?: number;
}

export interface BattleSceneData {
  /** 戦う場所（なければ周回の次の場所） */
  progress?: Progress;
  /**
   * 探索から来た戦闘（段階25）。battle は区画の戦闘（AREA_BATTLES）の id。
   * 勝ったら報酬を受け取って win の画面へ、負けたら lose の画面へ（試作の5戦の進み具合は変えない）
   */
  encounter?: { battle: string; win: { key: string; data: object }; lose: { key: string; data: object } };
}

/** 文字から作る、ずらしの数（探索の戦闘のシードを、戦闘ごとに変えるため） */
function textHash(text: string): number {
  let h = 0;
  for (const ch of text) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** 演出の待ち時間（ミリ秒） */
const FX = { banner: 550, popup: 260, settle: 380, round: 600 };

export class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  /** 戦っている場所と、その戦闘 */
  private progress!: Progress;
  private encounter?: BattleSceneData['encounter'];
  private battle!: CampaignBattle;
  /** 戦う仲間（探索から来た戦闘は物語の章のパーティ、試作の5戦は3人。段階26） */
  private lineup!: Lineup;
  /** 計画中に行動を選んでいる仲間 */
  private planner: string | null = null;
  private selection: Selection | null = null;
  private panel: Panel = 'none';
  /** 魔法・スキルの一覧のページ（誰の一覧か、何ページ目か） */
  private skillPage = { actorId: '', page: 0 };
  private message = '';
  private busy = false;
  private root!: Phaser.GameObjects.Container;
  private fxLayer!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private skipping = false;
  /** 連携技・コンボの演出中（数値を大きく、画面を揺らす） */
  private special = false;
  private waits: { timer: Phaser.Time.TimerEvent; resolve: () => void }[] = [];
  /** オートの作戦（オート中だけ。段階29） */
  private auto: Tactic | null = null;
  /** 初めての人向けの説明を出している（段階30） */
  private tipOpen = false;
  /** この戦闘でオートの説明を出してよいか（雑魚戦で、最初の戦闘の説明を前の戦闘までに見ている） */
  private autoTipOk = false;

  constructor() {
    super('Battle');
  }

  create(data: BattleSceneData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    resetShownValues();
    this.progress = data.progress ?? run.progress;
    this.encounter = data.encounter;
    const areaBattle = data.encounter ? AREA_BATTLES[data.encounter.battle] : undefined;
    if (data.encounter && !areaBattle) throw new Error(`unknown area battle ${data.encounter.battle}`);
    this.battle = areaBattle ?? battleAt(this.progress);
    const seed = areaBattle ? (run.seed + textHash(areaBattle.id)) >>> 0 : battleSeed(this.progress);
    console.log(`[battle] ${this.battle.id} seed=${seed}`, this.progress);
    this.lineup = areaBattle ? storyLineup() : PROTOTYPE_LINEUP;
    // 毎戦闘、HPとMPは全回復した状態で始まる。星図の成長を反映した仲間で戦う
    this.state = createBattle(createCampaignSetup(this.battle, seed, currentParty(this.lineup)));
    // 探索から来た戦闘は、章の中で貯めたつながりゲージを引き継いで始める（段階26の調整3）
    if (areaBattle && this.state.links.length > 0) this.state = { ...this.state, linkGauge: storyLinkGauge() };
    logEvents(this.state.log);
    this.selection = null;
    this.panel = 'none';
    this.busy = false;
    this.skipping = false;
    this.special = false;
    this.waits = [];
    this.overlay = undefined;
    // 戦闘はいつも手動で始まる。早送りの速さは設定に覚えておいたもの（段階29）
    this.auto = null;
    this.applySpeed();
    this.tipOpen = false;
    this.autoTipOk = this.autoAvailable() && seenTips().includes('battle_plan');
    this.planner = this.nextPlanner(null);
    this.root = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0).setDepth(100);
    setActiveBattle({
      progress: this.progress,
      getState: () => this.state,
      replaceState: (s) => this.replaceState(s),
      autoRound: () => this.autoRound(),
    });
    this.events.once('shutdown', () => setActiveBattle(null));
    this.message = this.idleMessage();
    this.render();
    this.maybeTip();
    // 1ラウンド目の始めの、狂い・ファーストエイドによるHPの増減を見せる
    this.time.delayedCall(300, () => {
      for (const e of this.state.log) if (e.type === 'passiveHp') this.showEvent(this.state, e);
    });
  }

  /** デバッグメニューから状態を差し替える。演出中は受け付けない */
  private replaceState(s: BattleState): boolean {
    if (this.busy || (s.phase !== 'plan' && s.phase !== 'extra')) return false;
    this.state = s;
    this.clearSelection();
    if (this.planner && (findUnit(s, this.planner)?.hp ?? 0) <= 0) this.planner = this.nextPlanner(null);
    this.message = this.idleMessage();
    this.render();
    return true;
  }

  /** デバッグメニューから：自動対戦の方針で行動を決めて進める（段階20。通しの自動確認でも使う） */
  private autoRound(): boolean {
    if (this.busy) return false;
    const pick = lcg(this.state.seed + this.state.log.length);
    if (this.state.phase === 'plan') {
      this.clearSelection();
      this.state = autoPlan(this.state, pick);
      this.startRound();
      return true;
    }
    if (this.state.phase !== 'extra') return false;
    const before = this.state;
    const r = autoExtra(before, pick);
    this.clearSelection();
    if (r.kind === 'decline') {
      this.state = r.state;
      void this.runExecution();
      return true;
    }
    this.busy = true;
    void this.play(before, r.state).then(async () => {
      if (this.state.phase === 'execute') await this.runExecution();
      else this.finishPlayerStep();
    });
    return true;
  }

  /** 追加行動・バトンタッチを見せ終わった後、次の入力を待つ */
  private finishPlayerStep(): void {
    this.busy = false;
    this.skipping = false;
    if (this.state.phase === 'ended') {
      this.render();
      this.showEnd();
      return;
    }
    this.message = this.idleMessage();
    this.render();
    this.maybeTip();
    this.queueAuto();
  }

  // ---- オートと早送り（段階29） ----

  /** 設定の速さで、演出の時間（待ち・動き）を縮める */
  private applySpeed(): void {
    const speed = getSettings().battleSpeed;
    this.time.timeScale = speed;
    this.tweens.timeScale = speed;
  }

  private toggleSpeed(): void {
    const settings = getSettings();
    setSettings({ ...settings, battleSpeed: nextBattleSpeed(settings.battleSpeed) });
    this.applySpeed();
    this.render();
  }

  /** 操作を待つ時に、今の場面の初めての説明があれば出す（段階30。オート中は出さない） */
  private maybeTip(): void {
    if (this.auto || this.busy || this.tipOpen || this.state.phase === 'ended') return;
    this.tipOpen = maybeShowTip(this, battleTipTriggers(this.state, { autoAvailable: this.autoTipOk }), () => {
      this.tipOpen = false;
    });
  }

  /** オートを使える戦闘か。ボス戦では使えない */
  private autoAvailable(): boolean {
    return !this.battle.boss;
  }

  /** オートの作戦を選ぶ画面。選ぶと覚えて、すぐオートで進める */
  private showAutoMenu(): void {
    if (!this.autoAvailable() || this.busy) return;
    this.closeOverlay();
    const saved = getSettings().autoTactic;
    const current = isTactic(saved) ? saved : 'auto';
    const c = this.add.container(0, 0).setDepth(200);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0);
    c.add(shade);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    const w = GAME_WIDTH - 40;
    const rowH = 76;
    const h = 70 + TACTICS.length * (rowH + 8) + 56;
    const y = GAME_HEIGHT / 2 - h / 2;
    c.add(addWindow(this, 20, y, w, h));
    // 窓の中のすき間を押しても閉じない
    c.add(this.add.rectangle(20, y, w, h, 0x000000, 0.001).setOrigin(0).setInteractive());
    c.add(addText(this, 36, y + 14, 'オートの作戦', { size: 17, bold: true, color: COLORS.accentText }));
    c.add(addText(this, 36, y + 40, '選ぶとオートで進む。どこかをタップすると手動に戻る', { size: 12, color: COLORS.subText }));
    TACTICS.forEach((t, i) => {
      const ry = y + 70 + i * (rowH + 8);
      const on = t.id === current;
      addButton(this, c, GAME_WIDTH / 2, ry + rowH / 2, w - 32, rowH, '', { onTap: () => this.startAuto(t.id) }, on ? { fill: 0x2f6b3f, stroke: 0x6dff9e } : {});
      c.add(addText(this, 44, ry + 10, `${on ? '▶ ' : ''}${t.name}`, { size: 16, bold: true }));
      c.add(addText(this, 44, ry + 34, t.desc, { size: 12, wrap: w - 64, color: COLORS.subText }));
    });
    addButton(this, c, GAME_WIDTH / 2, y + h - 32, 140, 40, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
    this.overlay = c;
    popIn(this, c);
  }

  private startAuto(tactic: Tactic): void {
    this.closeOverlay();
    if (!this.autoAvailable() || this.busy) return;
    setSettings({ ...getSettings(), autoTactic: tactic });
    this.auto = tactic;
    this.clearSelection();
    this.message = this.idleMessage();
    this.render();
    this.maybeTip();
    this.queueAuto();
  }

  private stopAuto(): void {
    if (!this.auto) return;
    this.auto = null;
    if (!this.busy) {
      this.message = this.idleMessage();
      this.render();
    }
  }

  /** オート中なら、少し間をおいて次の行動を作戦で決める */
  private queueAuto(): void {
    if (!this.auto) return;
    this.time.delayedCall(250, () => this.autoStep());
  }

  private autoStep(): void {
    const tactic = this.auto;
    if (!tactic || this.busy || this.overlay || this.tipOpen) return;
    const s = this.state;
    if (s.phase === 'plan' && !s.searchChoice) {
      this.clearSelection();
      this.state = planByTactic(s, tactic);
      this.startRound();
      return;
    }
    if (s.phase !== 'extra') return;
    this.clearSelection();
    this.busy = true;
    const after = extraByTactic(s, tactic);
    void this.play(s, after).then(async () => {
      if (this.state.phase === 'execute') await this.runExecution();
      else this.finishPlayerStep();
    });
  }

  // ---- 局面ごとの進行 ----

  /** 次に行動を選ぶ仲間（まだ決めていない仲間。after の後ろから探す） */
  private nextPlanner(after: string | null): string | null {
    const s = this.state;
    const allies = s.allies;
    const start = after ? allies.findIndex((a) => a.uid === after) + 1 : 0;
    const order = [...allies.slice(start), ...allies.slice(0, start)];
    const next = order.find((a) => a.hp > 0 && !planOf(s, a.uid));
    return next ? next.uid : null;
  }

  /** 行動を選んでいる仲間 */
  private actor(s: BattleState = this.state): AllyUnit | undefined {
    if (s.phase === 'extra' && s.extra) return s.allies.find((a) => a.uid === s.extra!.actorId);
    if (s.phase === 'plan' && this.planner) return s.allies.find((a) => a.uid === this.planner);
    return undefined;
  }

  /** 今の仲間が使ってよい手札 */
  private pool(s: BattleState = this.state): CardInstance[] {
    if (s.phase === 'extra') return extraPool(s);
    const actor = this.actor(s);
    if (s.phase === 'plan' && actor) return planPool(s, actor.uid);
    return [];
  }

  /** 計画を確定し、ラウンドの行動を速さ順に演出しながら実行する */
  private async runExecution(): Promise<void> {
    this.busy = true;
    this.clearSelection();
    for (let guard = 0; guard < 200 && this.state.phase === 'execute'; guard++) {
      const before = this.state;
      const after = step(before);
      await this.play(before, after);
      if (after.round !== before.round) {
        this.banner(`ラウンド ${after.round}`);
        await this.wait(FX.round);
        this.fxLayer.removeAll(true);
      }
    }
    this.busy = false;
    this.skipping = false;
    if (this.state.phase === 'ended') {
      this.render();
      this.showEnd();
      return;
    }
    if (this.state.phase === 'plan') this.planner = this.nextPlanner(null);
    this.message = this.idleMessage();
    this.render();
    this.maybeTip();
    this.queueAuto();
  }

  private startRound(): void {
    if (this.busy || !isPlanComplete(this.state)) return;
    this.state = startExecution(this.state);
    void this.runExecution();
  }

  /** 選んだ行動を決める */
  private async confirmSelection(): Promise<void> {
    const sel = this.selection;
    if (!sel || this.busy) return;
    const s = this.state;
    const err = this.validate(sel);
    if (err) {
      this.message = `この行動はできません（${err}）`;
      this.render();
      return;
    }
    const p = sel.pending;
    if (p.source === 'support') {
      const before = s;
      this.state = useSupport(s, p.cardUid, sel.target?.id);
      logEvents(this.state.log.slice(before.log.length));
      this.clearSelection();
      if (this.state.searchChoice) this.panel = 'search';
      this.message = this.state.searchChoice ? 'サーチ：手札に加えるスナップを1枚選ぶ' : `${this.supportName(p.cardUid, before)}を使った。${this.idleMessage()}`;
      this.render();
      return;
    }
    if (p.source === 'baton') {
      const before = s;
      this.state = passBaton(s, sel.target!.id);
      this.clearSelection();
      this.busy = true;
      await this.play(before, this.state);
      this.busy = false;
      this.skipping = false;
      this.message = this.idleMessage();
      this.render();
      return;
    }
    const action = this.buildAction(sel)!;
    if (s.phase === 'plan') {
      const actorId = this.actor()!.uid;
      this.state = setPlan(s, actorId, action);
      this.clearSelection();
      this.planner = this.nextPlanner(actorId);
      this.message = this.idleMessage();
      this.render();
      return;
    }
    // 追加行動：すぐに実行して、ラウンドの残りを続ける
    this.busy = true;
    this.clearSelection();
    const before = this.state;
    const after = applyExtra(before, action);
    await this.play(before, after);
    if (this.state.phase === 'execute') await this.runExecution();
    else this.finishPlayerStep();
  }

  private supportName(uid: number, s: BattleState): string {
    return s.hand.find((c) => c.uid === uid)?.card.name ?? 'サポートスナップ';
  }

  // ---- 演出 ----

  /** prev → next で増えた出来事を短い演出で見せる。タップで早送り */
  private async play(prev: BattleState, next: BattleState): Promise<void> {
    const events = next.log.slice(prev.log.length);
    logEvents(events);
    const act = events.find(
      (e) => e.type === 'action' || e.type === 'standUp' || e.type === 'baton' || e.type === 'cancel' || e.type === 'charge' || e.type === 'chargeBroken',
    );
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
    const names = (ids: string[]) => ids.map((id) => findUnit(s, id)?.name ?? '').join('と');
    if (e.type === 'action') return `${e.extra ? '追加行動：' : ''}${names(e.actorIds)}の ${e.name}`;
    if (e.type === 'standUp') return `${findUnit(s, e.enemyId)?.name ?? ''}は立ち上がった（行動できない）`;
    if (e.type === 'baton') return `${findUnit(s, e.fromId)?.name}から${findUnit(s, e.toId)?.name}へバトンタッチ！`;
    if (e.type === 'cancel') return `${names(e.actorIds)}は行動できなかった`;
    if (e.type === 'charge') return `${findUnit(s, e.enemyId)?.name ?? ''}は力をためている…（次の行動で${e.name}！）`;
    if (e.type === 'chargeBroken') return `${findUnit(s, e.enemyId)?.name ?? ''}のためが解けた！`;
    return '';
  }

  /** 1つの出来事を文字で見せる。見せたら true */
  private showEvent(s: BattleState, e: LogEvent): boolean {
    switch (e.type) {
      case 'damage': {
        const p = unitPosition(s, e.targetId);
        const isAlly = s.allies.some((a) => a.uid === e.targetId);
        // 弱点を突いた時は、黄色で大きく（段階32a 調整1）
        const weak = e.affinity === 'weak';
        this.popup(p.x, p.y, String(e.amount), weak ? COLORS.weak : isAlly ? COLORS.allyDamage : COLORS.damage, (this.special ? 34 : 26) + (weak ? 6 : 0));
        this.impact(p.x, p.y, weak ? COLORS.accent : isAlly ? 0xff8a7a : 0xffffff);
        if (weak && !this.special && !this.skipping) this.cameras.main.shake(90, 0.004);
        if (!this.skipping) playSe(this, isAlly ? SE.hit : SE.slash);
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
        if (!this.skipping) playSe(this, SE.heal);
        return true;
      }
      case 'passiveHp': {
        const p = unitPosition(s, e.allyId);
        if (e.source === 'bug') this.popup(p.x, p.y, `狂い ${e.amount}`, COLORS.allyDamage, 18);
        else this.popup(p.x, p.y, `+${e.amount}`, COLORS.heal, 20);
        return true;
      }
      case 'oneMore':
        this.bigText('Extend!');
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
      case 'cancel': {
        const p = unitPosition(s, e.actorIds[0]);
        this.popup(p.x, p.y, e.reason === 'dead' ? '行動できない' : 'MPが足りない', COLORS.subText, 14);
        return true;
      }
      case 'charge': {
        const p = unitPosition(s, e.enemyId);
        this.popup(p.x, p.y, '力をためている…', '#ffb070', 18);
        return true;
      }
      case 'chargeBroken': {
        const p = unitPosition(s, e.enemyId);
        this.popup(p.x, p.y - 20, 'ためが解けた！', COLORS.weak, 18);
        return true;
      }
      case 'standUp': {
        const p = unitPosition(s, e.enemyId);
        this.popup(p.x, p.y, '立ち上がった', COLORS.subText, 14);
        return true;
      }
      case 'drop': {
        // 珍しい素材・部位の素材・レアが出た時だけ知らせる（いつもの素材は勝利の表示で。段階27b）
        if (e.kind === 'common' || e.kind === 'fixed') return false;
        const p = unitPosition(s, e.enemyId);
        const name = WEAPON_DATA.items[e.itemId]?.name ?? e.itemId;
        if (e.kind === 'rare') {
          playSe(this, SE.chest);
          this.popup(p.x, p.y - 50, `レア！ ${name}`, COLORS.accentText, 22);
        } else this.popup(p.x, p.y - 40, name, '#6dd0ff', 15);
        return true;
      }
      case 'linkReady': {
        this.popup(GAME_WIDTH / 2, LAYOUT.message.y + 10, '連携技 READY!', COLORS.accentText, 24);
        return true;
      }
      case 'enraged': {
        const p = unitPosition(s, e.enemyId);
        this.popup(p.x, p.y - 20, '怒り！ためずに攻撃', COLORS.allyDamage, 18);
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

  /** 数字や短い文字を出す。大きめに出て、はねるように縮み、少し上がってから消える（段階32a 調整1） */
  private popup(x: number, y: number, text: string, color: string, size: number): void {
    if (this.skipping) return;
    const t = addText(this, x, y, text, { size, color, bold: true, align: 'center' }).setOrigin(0.5);
    t.setStroke('#0a0e1e', Math.max(4, Math.round(size / 5)));
    t.setShadow(0, 3, '#000000', 4, true, true);
    t.setScale(1.5);
    this.fxLayer.add(t);
    this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 30, duration: 700, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 300, onComplete: () => t.active && t.destroy() });
  }

  /** 当たった所に、輪が広がって消える（段階32a 調整1） */
  private impact(x: number, y: number, color: number): void {
    if (this.skipping) return;
    // 図形の丸を拡大する形だと描かれないことがあったので、線を描き直して広げる
    const ring = this.add.graphics();
    this.fxLayer.add(ring);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 320,
      ease: 'Cubic.easeOut',
      onUpdate: (t) => {
        const v = t.getValue() ?? 1;
        if (ring.active) ring.clear().lineStyle(3 * (1 - v) + 1, color, 0.9 * (1 - v)).strokeCircle(x, y, 10 + 24 * v);
      },
      onComplete: () => ring.active && ring.destroy(),
    });
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

  private actionDef(p: Pending, s: BattleState = this.state): ActionDef | undefined {
    switch (p.source) {
      case 'card':
      case 'support':
        return s.hand.find((c) => c.uid === p.cardUid)?.card;
      case 'skill':
        return this.actor(s)?.skills.find((k) => k.id === p.skillId);
      case 'attack': {
        const actor = this.actor(s);
        return actor ? basicAttackFor(actor) : BASIC_ATTACK;
      }
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

  /** 選択から行動を組み立てる。incomplete なら対象がまだなくても組み立てる（行動順の予告用） */
  private buildAction(sel: Selection | null, incomplete = false): PlayerAction | null {
    if (!sel) return null;
    const p = sel.pending;
    if (p.source === 'support' || p.source === 'baton') return null;
    const scope = this.scopeOf(p);
    if (!incomplete) {
      if ((scope === 'enemy' || scope === 'ally') && !sel.target) return null;
      if (this.needsPick(p) && sel.pickCardUid === undefined) return null;
    }
    switch (p.source) {
      case 'card':
        return { type: 'card', cardUid: p.cardUid, target: sel.target, pickCardUid: sel.pickCardUid };
      case 'skill':
        return { type: 'skill', skillId: p.skillId, target: sel.target, pickCardUid: sel.pickCardUid };
      case 'attack':
        return { type: 'attack', target: sel.target as TargetRef };
      case 'guard':
        return { type: 'guard' };
      case 'link':
        return { type: 'link', linkId: p.linkId };
      case 'combo':
        return { type: 'combo', comboId: p.comboId, target: sel.target };
    }
  }

  /** 選択が決められない理由。決められるなら null。まだ足りなければ 'incomplete' */
  private validate(sel: Selection): string | null {
    const s = this.state;
    const p = sel.pending;
    if (p.source === 'support') {
      if (this.scopeOf(p) === 'ally' && !sel.target) return 'incomplete';
      return getSupportError(s, p.cardUid, sel.target?.id);
    }
    if (p.source === 'baton') {
      if (!sel.target) return 'incomplete';
      return batonTargets(s).some((a) => a.uid === sel.target!.id) ? null : 'その仲間には渡せない';
    }
    const action = this.buildAction(sel);
    if (!action) return 'incomplete';
    const actor = this.actor();
    if (!actor) return 'no actor';
    return s.phase === 'extra' ? getExtraError(s, action) : getPlanError(s, actor.uid, action);
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
    const p = sel.pending;
    const scope = this.scopeOf(p);
    const name = p.source === 'baton' ? 'バトンタッチ' : (this.actionDef(p)?.name ?? '');
    const err = this.validate(sel);
    if (err === 'incomplete') {
      if (p.source === 'baton') this.message = 'バトンタッチ：渡す仲間をタップ';
      else if (p.source === 'support' && scope === 'ally') this.message = `${name}：先に動かす仲間をタップ`;
      else if (this.needsPick(p) && sel.pickCardUid === undefined) this.message = `${name}：手札に加えるスナップをタップ`;
      else this.message = `${name}：${scope === 'ally' ? '味方' : '敵'}をタップ`;
      this.render();
      return;
    }
    if (err) {
      this.message = `${name}：選べません（${err}）`;
      sel.target = undefined;
      this.render();
      return;
    }
    const hint = scope === 'enemy' || scope === 'ally' ? 'もう一度タップか「決定」で決める' : '「決定」で決める';
    if (p.source === 'support' || p.source === 'baton') {
      this.message = `${name}\n${hint}`;
      this.render();
      return;
    }
    const action = this.buildAction(sel)!;
    const preview = previewAction(this.state, this.actor()!.uid, action);
    this.message = [`${name}　${this.previewText(preview)}`.trim(), hint].join('\n');
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
    const order = p.orderIndex >= 0 ? `行動順 ${p.orderIndex + 1}番目` : '';
    return [parts.join(' / '), order].filter(Boolean).join('　');
  }

  private idleMessage(): string {
    const s = this.state;
    const actor = this.actor();
    if (this.auto) return `オートで進めている（作戦：${TACTICS.find((t) => t.id === this.auto)?.name ?? ''}）\nどこかをタップすると手動に戻る`;
    if (s.phase === 'extra' && actor) {
      return s.extra?.boost
        ? `バトンを受けた${actor.name}の追加行動（ダメージ・回復1.25倍）`
        : `Extend! ${actor.name}の追加行動（1枚引いた。バトンタッチ・見送りも可）`;
    }
    if (s.phase !== 'plan') return '';
    const warn = this.chargeWarning() || this.linkChance();
    const base = this.planMessage();
    return warn ? `${warn}\n${base}` : base;
  }

  /** 力をためている敵がいれば、大技の予告を返す */
  /** 連携技が撃てて、ダウン中の敵がいれば、狙い目を知らせる（段階26の調整4） */
  private linkChance(): string {
    const s = this.state;
    if (s.phase !== 'plan' || !linkReady(s)) return '';
    const downed = s.enemies.filter((e) => isOffBalance(e));
    if (downed.length === 0) return '';
    return `★ 連携技のチャンス！ ${downed.map((e) => e.name).join('・')}は体勢が崩れている（連携技は最初に動き、大ダメージ）`;
  }

  private chargeWarning(): string {
    // ためを崩されて怒っている敵は、次の行動でためずに攻撃してくる（段階26の調整）
    const angry = this.state.enemies.find((x) => x.hp > 0 && x.enraged);
    if (angry) return `⚠ ${angry.name}は怒っている！ 立ち上がった次の行動で、ためずにすぐ攻撃してくる（その攻撃まではダウンしない。防御でしのぐ）`;
    const e = this.state.enemies.find((x) => x.hp > 0 && chargingAction(x));
    if (!e) return '';
    const a = chargingAction(e)!;
    return `⚠ ${e.name}が「${a.name}」${a.target === 'allies' ? '（全体）' : ''}の構え！ ${chargeCounterText(e)}`;
  }

  private planMessage(): string {
    const s = this.state;
    const actor = this.actor();
    if (s.searchChoice) return 'サーチ：手札に加えるスナップを1枚選ぶ';
    if (isPlanComplete(s)) return `ラウンド${s.round}：全員の行動が決まった。「実行」で開始（仲間をタップで選び直し）`;
    const left = unplannedAllies(s).length;
    return actor ? `ラウンド${s.round}：${actor.name}の行動を選ぶ（あと${left}人・長押しで詳細）` : `ラウンド${s.round}：行動を選ぶ仲間をタップ`;
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
      void this.confirmSelection();
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
        const sel = this.selection;
        if (sel && (this.scopeOf(sel.pending) === 'ally' || sel.pending.source === 'baton')) {
          this.tapTarget({ kind: 'ally', id });
          return;
        }
        // 計画中は、仲間をタップするとその仲間の行動を選び直せる
        const ally = this.state.allies.find((a) => a.uid === id);
        if (this.state.phase === 'plan' && !this.state.searchChoice && ally && ally.hp > 0) {
          this.planner = id;
          this.clearSelection();
          const plan = planOf(this.state, id);
          this.message = plan ? `${ally.name}の行動を選び直す（今は「${this.planLabel(plan.action, id)}」）` : this.idleMessage();
          this.render();
        }
      },
      tapCard: (uid) => {
        const s = this.state;
        const card = s.hand.find((c) => c.uid === uid);
        if (!card) return;
        const cur = this.selection?.pending;
        if ((cur?.source === 'card' || cur?.source === 'support') && cur.cardUid === uid) {
          this.cancel();
          return;
        }
        if (card.card.support) {
          if (s.phase !== 'plan') {
            this.message = 'サポートスナップは計画の時に使う';
            this.render();
            return;
          }
          if (s.supportUsed) {
            this.message = 'サポートスナップはこのラウンドもう使った（1ラウンドに1枚まで）';
            this.render();
            return;
          }
          this.select({ source: 'support', cardUid: uid });
          return;
        }
        if (!this.pool().some((c) => c.uid === uid)) {
          const owner = s.plans.find((p) => !p.done && p.cardUids.includes(uid));
          const name = owner ? owner.actorIds.map((id) => findUnit(s, id)?.name).join('と') : '仲間';
          this.message = `${card.card.name}は${name}が使う予定（${s.phase === 'plan' ? 'その仲間をタップすると選び直せる' : '追加行動には使えない'}）`;
          this.render();
          return;
        }
        this.select({ source: 'card', cardUid: uid });
      },
      tapCombo: (id) => {
        const cur = this.selection?.pending;
        if (cur?.source === 'combo' && cur.comboId === id) this.cancel();
        else this.select({ source: 'combo', comboId: id });
      },
      tapSkill: (id) => this.select({ source: 'skill', skillId: id }, true),
      nextSkillPage: () => {
        const actorId = this.actor(this.state)?.uid ?? '';
        const page = this.skillPage.actorId === actorId ? this.skillPage.page : 0;
        this.skillPage = { actorId, page: page + 1 };
        this.render();
      },
      tapBasic: (kind) => {
        if (kind === 'decline') {
          if (this.state.phase !== 'extra' || this.busy) return;
          this.state = declineExtra(this.state);
          this.clearSelection();
          void this.runExecution();
          return;
        }
        this.select({ source: kind }, true);
      },
      tapDiscard: (uid) => {
        if (!this.selection) return;
        this.selection.pickCardUid = uid;
        this.panel = 'none';
        this.updatePreview();
      },
      tapSearch: (uid) => {
        if (!this.state.searchChoice) return;
        const before = this.state;
        this.state = resolveSearch(before, uid);
        logEvents(this.state.log.slice(before.log.length));
        this.panel = 'none';
        const picked = this.state.hand.find((c) => c.uid === uid);
        this.message = `サーチ：${picked?.card.name ?? ''}を手札に加えた。${this.idleMessage()}`;
        this.render();
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
        // 組める連携技が2つある時は、押すたびに切り替える（段階26の調整2）
        const mine = this.actor() ? actorLinks(this.state, this.actor()!.uid) : [];
        const cur = this.selection?.pending.source === 'link' ? this.selection.pending.linkId : undefined;
        const i = mine.findIndex((l) => l.id === cur);
        const link = mine[(i + 1) % mine.length];
        if (link) this.select({ source: 'link', linkId: link.id });
      },
      confirm: () => void this.confirmSelection(),
      cancel: () => this.cancel(),
      execute: () => this.startRound(),
      openAuto: () => this.showAutoMenu(),
      toggleSpeed: () => this.toggleSpeed(),
      detail: (title, body) => this.showDetail(title, body),
    };
  }

  /** 仲間の枠に出す、決めた行動の短い説明 */
  private planLabel(action: PlayerAction, allyId: string): string {
    const s = this.state;
    const target = 'target' in action ? action.target : undefined;
    let to = '';
    if (target?.kind === 'enemy') {
      const e = s.enemies.find((x) => x.uid === target.id);
      const part = target.partId ? e?.parts.find((p) => p.id === target.partId)?.name : undefined;
      to = e ? `→${e.name}${part ? `の${part}` : ''}` : '';
    } else if (target?.kind === 'ally') {
      to = `→${findUnit(s, target.id)?.name ?? ''}`;
    }
    switch (action.type) {
      case 'attack':
        return `通常攻撃${to}`;
      case 'guard':
        return '防御';
      case 'card':
        return `${s.hand.find((c) => c.uid === action.cardUid)?.card.name ?? 'スナップ'}${to}`;
      case 'skill':
        return `${s.allies.find((a) => a.uid === allyId)?.skills.find((k) => k.id === action.skillId)?.name ?? ''}${to}`;
      case 'link':
        return `連携：${s.links.find((l) => l.id === action.linkId)?.name ?? ''}`;
      case 'combo':
        return `${s.combos.find((c) => c.id === action.comboId)?.name ?? ''}${to}`;
    }
  }

  // ---- 描画 ----

  private render(s: BattleState = this.state): void {
    this.root.removeAll(true);
    const sel = this.selection;
    const interactive = !this.busy && !this.auto && s === this.state && (s.phase === 'plan' || s.phase === 'extra');
    const actor = interactive ? this.actor(s) : undefined;
    const valid = !!sel && this.validate(sel) === null;

    // 計画中に行動を選んでいれば、その重さで行動順を予告する
    let order = getRoundOrder(s);
    let predictedIndex = -1;
    const previewAct = this.buildAction(sel, true);
    if (interactive && s.phase === 'plan' && actor && previewAct) {
      try {
        order = getRoundOrder(s, { allyId: actor.uid, action: previewAct });
        predictedIndex = order.findIndex((e) => e.kind === 'ally' && e.ids.includes(actor.uid));
      } catch {
        // 予告できない行動はそのままの順番を出す
      }
    }

    const reservedBy = new Map<number, string>();
    const planLabels: Record<string, string> = {};
    for (const p of s.plans) {
      if (p.done) continue;
      const names = p.actorIds.map((id) => findUnit(s, id)?.name ?? '').join('と');
      for (const uid of p.cardUids) reservedBy.set(uid, names);
      for (const id of p.actorIds) planLabels[id] = this.planLabel(p.action, p.actorIds[0]);
    }

    const footer: FooterMode = this.auto && s.phase !== 'ended' ? 'auto' : !interactive ? 'none' : sel ? 'select' : s.phase === 'plan' && !s.searchChoice ? 'execute' : 'none';
    const vm: ViewModel = {
      state: s,
      order,
      predictedIndex,
      actor,
      pool: interactive ? this.pool(s) : [],
      reservedBy,
      planLabels,
      scope: interactive && sel && sel.pending.source !== 'baton' ? this.scopeOf(sel.pending) : null,
      selectedCardUid: sel?.pending.source === 'card' || sel?.pending.source === 'support' ? sel.pending.cardUid : undefined,
      selectedSkillId: sel?.pending.source === 'skill' ? sel.pending.skillId : undefined,
      skillPage: actor && this.skillPage.actorId === actor.uid ? this.skillPage.page : 0,
      selectedComboId: sel?.pending.source === 'combo' ? sel.pending.comboId : undefined,
      selectedLinkId: sel?.pending.source === 'link' ? sel.pending.linkId : undefined,
      comboCardUids: this.selectedComboCards(s),
      selectedTarget: sel?.target,
      batonMode: interactive && sel?.pending.source === 'baton',
      panel: interactive ? (s.searchChoice ? 'search' : this.panel) : 'none',
      message: this.message,
      footer,
      canConfirm: valid,
      planComplete: isPlanComplete(s),
      interactive,
      autoAvailable: this.autoAvailable(),
      speed: getSettings().battleSpeed,
      autoName: TACTICS.find((t) => t.id === this.auto)?.name ?? '',
    };
    drawBattle(this, this.root, vm, this.handlers());

    // 演出中は全面でタップを受けて早送りにする。オート中は、タップで手動に戻す（段階29）
    if (this.busy || this.auto) {
      const blocker = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001).setOrigin(0);
      this.root.add(blocker);
      blocker.setInteractive();
      blocker.on('pointerdown', () => (this.auto ? this.stopAuto() : this.skip()));
    }
  }

  private selectedComboCards(s: BattleState): number[] {
    const p = this.selection?.pending;
    if (p?.source !== 'combo') return [];
    const combo = s.combos.find((c) => c.id === p.comboId);
    return combo ? (comboCards(combo, this.pool(s)) ?? []).map((c) => c.uid) : [];
  }

  private closeOverlay(): void {
    fadeOutAndDestroy(this, this.overlay);
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
    const panel = addWindow(this, 20, y, w, h);
    const titleText = addText(this, 36, y + 14, title, { size: 17, bold: true, color: COLORS.accentText });
    text.setPosition(36, y + 44);
    const hint = addText(this, GAME_WIDTH / 2, y + h - 16, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([panel, titleText, text, hint]);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    this.overlay = c;
    popIn(this, c);
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
    const result = getBattleResult(this.state);
    const def = this.battle;
    if (this.encounter) {
      this.showEncounterEnd(c, win, result);
      this.overlay = c;
      popIn(this, c);
      return;
    }
    // 勝った後に進む場所。最後まで終わった時（今はボス）は結果画面へ。次の区画・章へ進む時の画面は、今は星図に戻るだけ（段階13）
    const next = advance(STORY, this.progress);
    if (win && next.event !== 'storyClear') {
      // 星の砂を受け取って星図へ（ボスは報酬なし）
      const gained = def.boss ? 0 : battleReward(def.reward, result.brokenParts.length, PART_BREAK_POINTS);
      run.growth = { ...run.growth, points: run.growth.points + gained };
      run.progress = next.progress;
      // ギアの報酬は星図の画面で選ぶ
      const hasReward = !def.boss && !!def.naviReward;
      if (hasReward) run.pendingReward = def.id;
      // 武器：素材とアイテムを受け取り、経験値とギアの傾向を貯める
      const naviData = currentNaviData();
      const members = lineupBase(this.lineup);
      const levelsBefore = Object.fromEntries(members.map((p) => [p.id, weaponLevel(WEAPON_DATA, run.armory.weapons[p.id].exp)]));
      run.armory = recordVictory(run.armory, {
        actions: result.actionCounts,
        colorCells: Object.fromEntries(members.map((p) => [p.id, boardColorCells(naviData, run.navi, p.id)])),
        items: [...result.drops, ...(def.item ? [def.item] : [])],
      });
      const levelUps = members.filter((p) => weaponLevel(WEAPON_DATA, run.armory.weapons[p.id].exp) > levelsBefore[p.id]).map(
        (p) => `${weaponName(WEAPON_DATA, run.armory.weapons[p.id])} Lv${weaponLevel(WEAPON_DATA, run.armory.weapons[p.id].exp)}`,
      );
      // 「星図へ」を押す前に閉じても消えないように
      saveRun();
      const reward = def.item;
      const dropText = `素材：${result.drops.length > 0 ? summarizeItems(result.drops) : 'なし'}${reward ? `　アイテム：${summarizeItems([reward])}` : ''}`;
      const nextBattle = battleAt(run.progress);
      c.add(
        addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 52, `星の砂 +${gained}（合計 ${run.growth.points}）\n${dropText}${levelUps.length > 0 ? `\nレベルアップ：${levelUps.join('、')}` : ''}${hasReward ? `\nギアを${NAVI_REWARD_PICKS}つ選べる` : ''}\n次は${nextBattle.name}`, {
          size: 15,
          align: 'center',
          color: COLORS.subText,
        }).setOrigin(0.5, 0),
      );
      addButton(this, c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 240, 60, '星図へ', { onTap: () => this.scene.start('Growth') }, {
        size: 18,
        bold: true,
        fill: 0x5a4a10,
        stroke: COLORS.accent,
        strokeWidth: 2,
      });
    } else {
      const data: ResultSceneData = { outcome: result.outcome === 'victory' ? 'victory' : 'defeat', progress: this.progress, brokenParts: result.brokenParts, seed: this.state.seed };
      // ボスに勝ったら周回はおしまい。セーブを消す（負けた時は、この戦闘の前のセーブが残る）
      if (data.outcome === 'victory') finishRun();
      addButton(this, c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 240, 60, '結果へ', { onTap: () => this.scene.start('Result', data) }, { size: 18, bold: true });
    }
    this.overlay = c;
    popIn(this, c);
  }

  /** 探索から来た戦闘の終わり（段階25）。勝てば報酬を受け取って探索へ、負ければチェックポイントへ */
  private showEncounterEnd(c: Phaser.GameObjects.Container, win: boolean, result: ReturnType<typeof getBattleResult>): void {
    const enc = this.encounter!;
    const def = this.battle;
    if (!win) {
      c.add(addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '最後に記録したチェックポイントから、やり直す', { size: 15, align: 'center', color: COLORS.subText, wrap: GAME_WIDTH - 40 }).setOrigin(0.5));
      addButton(this, c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 260, 60, 'チェックポイントへ', { onTap: () => this.scene.start(enc.lose.key, enc.lose.data) }, { size: 18, bold: true });
      return;
    }
    const gained = battleReward(def.reward, result.brokenParts.length, PART_BREAK_POINTS);
    run.growth = { ...run.growth, points: run.growth.points + gained };
    // 残ったつながりゲージは、章の中の次の戦闘へ引き継ぐ（負けた時は、戦う前の量のまま。段階26の調整3）
    if (this.state.links.length > 0) setStoryLinkGauge(this.state.linkGauge);
    // ギアの報酬は出さない。ムーブメントが閉じている間は、盤の色（傾向）も貯めない（段階26）
    const naviData = currentNaviData();
    const colorMembers = this.lineup.unlocks.navi ? lineupBase(this.lineup) : [];
    run.armory = recordVictory(run.armory, {
      actions: result.actionCounts,
      colorCells: Object.fromEntries(colorMembers.map((p) => [p.id, boardColorCells(naviData, run.navi, p.id)])),
      items: [...result.drops, ...(def.item ? [def.item] : [])],
    });
    saveRun();
    // 落とした素材を種類ごとに（珍しい素材は ◆、レアは ★。段階27b）
    const drops = this.state.log.flatMap((e) => (e.type === 'drop' ? [e] : []));
    const mark = (kind: string) => (kind === 'rare' ? '★' : kind === 'uncommon' || kind === 'part' ? '◆' : '');
    const counts = new Map<string, number>();
    for (const d of drops) counts.set(`${mark(d.kind)}${WEAPON_DATA.items[d.itemId]?.name ?? d.itemId}`, (counts.get(`${mark(d.kind)}${WEAPON_DATA.items[d.itemId]?.name ?? d.itemId}`) ?? 0) + 1);
    const dropList = [...counts].map(([name, n]) => `${name}${n > 1 ? `×${n}` : ''}`).join('、');
    const dropText = `素材：${dropList || 'なし'}${def.item ? `　アイテム：${summarizeItems([def.item])}` : ''}`;
    if (drops.some((d) => d.kind === 'rare')) {
      const rare = addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, '★ レア！', { size: 30, bold: true, color: COLORS.accentText }).setOrigin(0.5);
      rare.setStroke('#5a3a00', 6);
      c.add(rare);
      this.tweens.add({ targets: rare, scale: { from: 1.6, to: 1 }, duration: 400, ease: 'Back.easeOut' });
      playSe(this, SE.chest);
    }
    // コマ（盗まれた時間を返すのに使う。段階28。探索の画面に戻った時に数える）
    const komaText = def.koma ? `コマ +${def.koma}\n` : '';
    c.add(addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 52, `${komaText}星の砂 +${gained}（合計 ${run.growth.points}）\n${dropText}`, { size: 15, align: 'center', color: COLORS.subText, wrap: GAME_WIDTH - 40 }).setOrigin(0.5, 0));
    addButton(this, c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 240, 60, '探索へ戻る', { onTap: () => this.scene.start(enc.win.key, enc.win.data) }, {
      size: 18,
      bold: true,
      fill: 0x5a4a10,
      stroke: COLORS.accent,
      strokeWidth: 2,
    });
  }
}

/** 素材・アイテムの一覧を「スライムゼリー×2、硬い毛皮」のようにまとめる */
function summarizeItems(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${WEAPON_DATA.items[id]?.name ?? id}${n > 1 ? `×${n}` : ''}`).join('、');
}

/** デバッグ用に、出来事をコンソールへ出す（?debug=1 なら eruda で見られる） */
function logEvents(events: LogEvent[]): void {
  for (const e of events) console.log('[battle]', JSON.stringify(e));
}
