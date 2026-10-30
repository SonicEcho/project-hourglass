import Phaser from 'phaser';
import type { EvolutionDef, PartColor, WeaponParamKey, WeaponParams, WeaponState } from '../core';
import {
  absorbPicked,
  anySlotsFull,
  canEvolveAny,
  cappedPassives,
  evolutionChecks,
  evolutionVisibility,
  evolveWeapon,
  feedFragment,
  fragmentItem,
  getAbsorbPickedError,
  getEvolveError,
  getFragmentError,
  nearestEvolution,
  paramsAfterPicked,
  recommendMaterials,
  tendencyOf,
  upcomingKeys,
  weaponLevel,
  weaponName,
  weaponSlots,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { DECOMPOSE_VAR, FRAGMENTS, ITEMS, itemSources, WEAPON_DATA } from '../data';
import { SIDE_PADDING } from '../ui/layout';
import { PART_COLOR_LABEL } from '../ui/naviText';
import { COLORS, ELEMENT_COLOR, ELEMENT_LABEL, FONT_HEADING, RENDER_SCALE, toCss } from '../ui/theme';
import { describeCondition, describeDecompose, describeEvolution, describeFragment, describeGains, describeStyle, PARAM_LABEL, PARAM_SHORT, RARITY_LABEL } from '../ui/weaponText';
import { addButton, addText, makePressable } from '../ui/widgets';
import { maybeShowTip } from '../ui/tipPanel';
import { currentParty, getHubReturn, hubBack, hubLineup, lineupBase, run, saveRun, setHubReturn, setStoryVars } from './run';
import { addWindow, ensureSandTexture, enterScreen, fadeOutAndDestroy, popIn, sparkAt } from '../ui/skin';
import { backButton, faceTabs, FRAME, FRAME_COLORS, frameBg, frameHeader, GOLD_BUTTON, PLAIN_BUTTON } from '../ui/frame';
import { CRIMSON, currentNode, drawTree, layoutTree, TREE, type TreeNode, treeDetail, treeSize } from '../ui/weaponTree';

// 武器の画面（段階9）。段階145：見た目は「紅の系譜」（docs/ART.md の 5-9）。
// 上に武器の名前・レベル・能力値の4本の棒・刻印の目盛り、まん中の全面に進化の木（ドラッグで動かす）、下に素材の引き出し。
// - 次の姿の紋章をタップすると、条件と得るもの・型を選ぶ窓が出て、そこから進化する（段階42 の進化。前の「ツリーを見る」の画面はなくした）
// - 素材は引き出しを上げて選ぶ。押すたびに数が増え（持っている数か刻印の残りまで。その次でゼロに戻る）、「刻む（N）」でまとめて刻む。
//   選ぶと上の棒に増える分が白く光り、進化の条件に届けば一言出る。「欠片」では記憶の欠片を刻む（刻印を使わない）

const D = WEAPON_DATA;
const PARAM_KEYS: WeaponParamKey[] = ['atk', 'fire', 'ice', 'thunder'];
const PARAM_COLOR: Record<WeaponParamKey, number> = { atk: 0xe8e2d4, fire: ELEMENT_COLOR.fire, ice: ELEMENT_COLOR.ice, thunder: ELEMENT_COLOR.thunder };

/** 上の能力値の場所 */
const STATUS_TOP = FRAME.contentTop;
/** 進化の木を見せる枠 */
const TREE_TOP = STATUS_TOP + 92;
const TREE_BOTTOM = 690;
/** 引き出しを閉じている時の帯と、開いた時の上の端 */
const DRAWER_BAR = TREE_BOTTOM;
const DRAWER_TOP = 318;
/** 引き出しの石の並び */
const STONE = { cols: 5, rows: 3, h: 70, gap: 6 } as const;
/** これより指が動いたら、タップではなくドラッグ */
const DRAG_SLOP = 10;

type Filter = 'all' | WeaponParamKey | 'key' | 'fragments';

export class WeaponScene extends Phaser.Scene {
  private charId = 'hero';
  /** 引き出しを開いているか */
  private drawer = false;
  /** 素材の絞り込み（段階72。145 で「鍵」と「欠片」も足した） */
  private filter: Filter = 'all';
  /** 素材の一覧のページ（多い時） */
  private page = 0;
  /** 選んでいる素材（または記憶の欠片）と数 */
  private picks: Record<string, number> = {};
  /** 素材・欠片の並びの場所（刻む演出の出どころ。描くたびに覚え直す） */
  private itemSpots = new Map<string, { x: number; y: number; color: number }>();
  private message = '';
  /** 時分解を出しているか（段階100c。どれかの武器の刻印が初めていっぱいになってから） */
  private decompose = false;
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  /** 進化の木（ドラッグで動かす）と、その並び */
  private tree?: Phaser.GameObjects.Container;
  private laid: TreeNode[] = [];
  /** 木をずらした量（仲間ごと。描き直しても同じ所を見せる） */
  private treePos = new Map<string, { x: number; y: number }>();

  constructor() {
    super('Weapon');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.tree = undefined;
    this.drawer = false;
    this.picks = {};
    this.message = '';
    this.treePos.clear();
    // パーティにいない仲間を選んでいたら、先頭の仲間にする（段階26）
    const members = lineupBase(hubLineup());
    if (!members.some((c) => c.id === this.charId)) this.charId = members[0].id;
    this.render();
    this.setupPan();
    maybeShowTip(this, ['growth_weapon', 'growth_tree', ...(this.decompose ? ['growth_decompose'] : [])]);
  }

  /**
   * 時分解を出すか（段階100c）：どれかの武器の刻印が初めていっぱいになったら、物語の変数に覚えて、その後はずっと出す
   * （1章では枠が埋まらず、時分解を使う理由がないため）。初めて出た時は説明の窓も出す。交換所を初めて開いた時にも覚える（ExchangeScene）
   */
  private updateDecompose(): void {
    if (run.vars[DECOMPOSE_VAR]) {
      this.decompose = true;
      return;
    }
    this.decompose = anySlotsFull(D, run.armory);
    if (!this.decompose) return;
    setStoryVars({ ...run.vars, [DECOMPOSE_VAR]: '1' });
    if (this.root.list.length > 0) this.time.delayedCall(600, () => maybeShowTip(this, ['growth_decompose']));
  }

  /** デバッグメニューから記憶の欠片や経験値が変わった時に描き直す */
  refresh(): void {
    if (this.scene.isActive()) this.render();
  }

  private weapon(): WeaponState {
    return run.armory.weapons[this.charId];
  }

  private picking(): 'items' | 'fragments' {
    return this.filter === 'fragments' ? 'fragments' : 'items';
  }

  private pickedCount(): number {
    return Object.values(this.picks).reduce((a, n) => a + n, 0);
  }

  // ---- 操作 ----

  /** 石を押す：1つ足す。持っている数（素材は刻印の残りも）まで足したら、次はゼロに戻る */
  private pick(id: string): void {
    const w = this.weapon();
    const now = this.picks[id] ?? 0;
    const owned = this.picking() === 'items' ? (run.armory.items[id] ?? 0) : (run.armory.fragments[id] ?? 0);
    const room = this.picking() === 'items' ? weaponSlots(D, w) - w.absorbed - this.pickedCount() : Infinity;
    if (now === 0 && room <= 0) {
      this.message = '刻印がいっぱい（武器のレベルが上がると増える）';
      this.render();
      return;
    }
    const next = now < owned && room > 0 ? now + 1 : 0;
    this.picks = { ...this.picks, [id]: next };
    if (next === 0) delete this.picks[id];
    this.message = '';
    this.render();
  }

  /** 選んだ素材（欠片）をまとめて刻む（素材は段階27b、欠片は刻印を使わない） */
  private absorb(): void {
    const picks = this.picks;
    const before = weaponName(D, this.weapon());
    const spots = Object.keys(picks).map((id) => this.itemSpots.get(id)).filter((s): s is { x: number; y: number; color: number } => !!s);
    if (this.picking() === 'items') {
      if (getAbsorbPickedError(D, run.armory, this.charId, picks)) return;
      run.armory = absorbPicked(D, run.armory, this.charId, picks);
    } else {
      for (const [id, n] of Object.entries(picks)) for (let i = 0; i < n; i++) run.armory = feedFragment(D, run.armory, this.charId, id);
    }
    const names = Object.entries(picks).map(([id, n]) => `${(D.items[id] ?? D.fragments[id]).name}${n > 1 ? `×${n}` : ''}`);
    this.message = `${before}に${names.join('・')}を刻んだ`;
    console.log('[weapon] absorb', this.charId, JSON.stringify(picks), JSON.stringify(this.weapon().params));
    this.picks = {};
    this.render();
    spots.forEach((s, i) => this.time.delayedCall(i * 90, () => this.playAbsorb(s)));
  }

  /** 選んだ素材を時分解して、記憶の欠片にする（素材ごとに、選んだ数でできるだけ） */
  private fragment(): void {
    let made = 0;
    for (const [id, n] of Object.entries(this.picks)) {
      for (let i = 0; i < Math.floor(n / D.decomposeCost); i++) {
        if (getFragmentError(D, run.armory, id)) break;
        run.armory = fragmentItem(D, run.armory, id);
        made++;
      }
    }
    if (made === 0) return;
    this.message = `時分解して、記憶の欠片が ${made} つできた（「欠片」で刻む）`;
    console.log('[weapon] fragment', JSON.stringify(this.picks), JSON.stringify(run.armory.fragments));
    this.picks = {};
    this.render();
  }

  /** 時分解でできる欠片の数（選んだ数から） */
  private fragmentYield(): number {
    if (this.picking() !== 'items') return 0;
    return Object.entries(this.picks).reduce((a, [id, n]) => a + (getFragmentError(D, { ...run.armory, items: { ...run.armory.items } }, id) ? 0 : Math.floor(n / D.decomposeCost)), 0);
  }

  /** 次の姿の紋章をタップ：条件 ✓ と得るもの、型を選んで進化する窓（段階42 の進化の確認） */
  private confirmEvolve(evo: EvolutionDef, style: number | null = null): void {
    this.closeOverlay();
    const w = this.weapon();
    const ext = hubLineup().unlocks.navi ? D.boardExtension : 0;
    const checks = evolutionChecks(D, w, evo, run.armory.items);
    const ok = checks.every((c) => c.ok);
    const styles = ok ? (evo.styles ?? []) : [];
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72).setOrigin(0).setInteractive());
    const keys = evo.conditions.flatMap((cd) => (cd.kind === 'key' ? [cd.item] : []));
    const h = 200 + styles.length * 74 + (ok ? 50 : keys.length * 34);
    const top = Math.round((GAME_HEIGHT - h) / 2);
    c.add(addWindow(this, 18, top, GAME_WIDTH - 36, h, CRIMSON, 0x0c0a0b));
    c.add(addText(this, 36, top + 16, `${weaponName(D, w)} ▶`, { size: 11, color: COLORS.subText }));
    c.add(addText(this, 36, top + 32, evo.name, { size: 21, bold: true }).setFontFamily(FONT_HEADING));
    c.add(addText(this, 36, top + 66, checks.map((ch) => `${ch.ok ? '✓' : '✗'} ${describeCondition(ch.condition, D)}`).join('　'), { size: 12, bold: true, color: ok ? '#6dff9e' : '#ff8a8a', wrap: GAME_WIDTH - 72 }));
    c.add(this.add.rectangle(36, top + 92, GAME_WIDTH - 72, 1, 0xffffff, 0.15).setOrigin(0));
    c.add(addText(this, 36, top + 100, describeEvolution(evo) || '―', { size: 13, wrap: GAME_WIDTH - 72 }));
    let y = top + 136;
    if (ok) {
      c.add(addText(this, 36, y, '型を1つ選ぶ（効果は次の進化にも引き継ぐ）', { size: 11, color: COLORS.subText }));
      y += 20;
      styles.forEach((st, i) => {
        const chosen = style === i;
        const rect = this.add.rectangle(32, y, GAME_WIDTH - 64, 66, chosen ? 0x2a2010 : 0x141214).setRounded(10).setOrigin(0);
        rect.setStrokeStyle(chosen ? 2 : 1, chosen ? FRAME_COLORS.gold : FRAME_COLORS.line);
        c.add(rect);
        c.add(addText(this, 44, y + 8, `${evo.name}・${st.name}`, { size: 14, bold: true, color: chosen ? FRAME_COLORS.goldText : COLORS.text }));
        c.add(addText(this, 44, y + 30, describeStyle(st, ext).replace(/^[^：]*：/, ''), { size: 11, wrap: GAME_WIDTH - 88 }));
        makePressable(rect, { onTap: () => this.confirmEvolve(evo, i) });
        y += 74;
      });
      c.add(addText(this, GAME_WIDTH / 2, y + 2, '進化と型は戻せない', { size: 11, color: COLORS.subText }).setOrigin(0.5, 0));
    } else {
      // 鍵の素材の手に入れ方（狩りの目的。段階27b）
      for (const id of keys) {
        c.add(addText(this, 36, y, `鍵「${D.items[id]?.name ?? id}」（持っている：${run.armory.items[id] ?? 0}）\n手に入れ方：${itemSources(id).join('、') || '―'}`, { size: 11, color: COLORS.subText, wrap: GAME_WIDTH - 72 }));
        y += 34;
      }
    }
    const bw = (GAME_WIDTH - 36 - 40) / 2;
    if (ok) {
      addButton(this, c, 30 + bw / 2, top + h - 36, bw, 48, '進化する', { onTap: () => style !== null && this.evolve(evo, style) }, { ...GOLD_BUTTON, enabled: style !== null });
      addButton(this, c, GAME_WIDTH - 30 - bw / 2, top + h - 36, bw, 48, 'やめる', { onTap: () => this.closeOverlay() }, { ...PLAIN_BUTTON, size: 15 });
    } else addButton(this, c, GAME_WIDTH / 2, top + h - 36, bw, 48, '閉じる', { onTap: () => this.closeOverlay() }, { ...PLAIN_BUTTON, size: 15 });
    this.overlay = c;
    // 型を選び直した時は、窓をはじき出さずにそのまま描き替える
    if (style === null) popIn(this, c);
  }

  private evolve(evo: EvolutionDef, style: number): void {
    this.closeOverlay();
    if (getEvolveError(D, run.armory, this.charId, evo.id, style)) return;
    const before = weaponName(D, this.weapon());
    run.armory = evolveWeapon(D, run.armory, this.charId, evo.id, style);
    const after = weaponName(D, this.weapon());
    console.log('[weapon] evolve', this.charId, evo.id, style);
    this.message = `${before}が${after}に進化した！`;
    // 新しい今の姿が見えるように、木の位置を戻す
    this.treePos.delete(this.charId);
    this.render();
    this.playEvolution(before, after);
  }

  /** 刻む演出（段階32a 調整2）：素材の場所から光の粒が上の能力値へ吸い込まれ、能力値が光る */
  private playAbsorb(from: { x: number; y: number; color: number }): void {
    const tx = GAME_WIDTH / 2;
    const ty = STATUS_TOP + 50;
    ensureSandTexture(this);
    const flow = (tint: number, scale: number) =>
      this.add
        .particles(from.x, from.y, 'ui-sand', {
          x: { min: -18, max: 18 },
          y: { min: -10, max: 10 },
          // 行き先は、粒を出す場所（素材）からの相対の位置で書く
          moveToX: { min: tx - from.x - 80, max: tx - from.x + 80 },
          moveToY: { min: ty - from.y - 14, max: ty - from.y + 14 },
          scale: { start: scale, end: scale * 0.4 },
          tint,
          alpha: { start: 1, end: 0.6 },
          lifespan: 480,
          frequency: 18,
          quantity: 2,
          duration: 300,
        })
        .setDepth(150);
    const glowDots = flow(from.color, 3);
    const coreDots = flow(0xffffff, 1.6);
    this.time.delayedCall(1000, () => {
      glowDots.destroy();
      coreDots.destroy();
    });
    this.time.delayedCall(700, () => {
      const glow = this.add.rectangle(SIDE_PADDING, STATUS_TOP, GAME_WIDTH - SIDE_PADDING * 2, 88, from.color, 0.3).setOrigin(0).setRounded(10).setDepth(140);
      this.tweens.add({ targets: glow, alpha: 0, duration: 420, onComplete: () => glow.active && glow.destroy() });
      sparkAt(this, tx, ty);
    });
  }

  /** 進化の演出：画面が紅く光り、武器の名前が変わる */
  private playEvolution(before: string, after: string): void {
    const c = this.add.container(0, 0).setDepth(300);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setOrigin(0).setInteractive();
    const old = addText(this, GAME_WIDTH / 2, 380, before, { size: 22, bold: true, color: COLORS.subText }).setOrigin(0.5);
    const name = addText(this, GAME_WIDTH / 2, 410, after, { size: 32, bold: true, color: '#ffffff' }).setOrigin(0.5);
    name.setFontFamily(FONT_HEADING).setStroke('#8a0a1a', 8).setAlpha(0).setScale(2.2);
    const label = addText(this, GAME_WIDTH / 2, 470, '進化！', { size: 18, bold: true, color: FRAME_COLORS.goldText }).setOrigin(0.5).setAlpha(0);
    const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, CRIMSON, 0).setOrigin(0);
    c.add([shade, old, name, label, flash]);
    this.tweens.add({ targets: old, alpha: 0, y: 360, delay: 400, duration: 300 });
    this.tweens.add({ targets: flash, alpha: { from: 0, to: 0.8 }, delay: 650, duration: 120, yoyo: true });
    this.tweens.add({ targets: name, alpha: 1, scale: 1, delay: 800, duration: 320, ease: 'Back.easeOut' });
    this.tweens.add({ targets: label, alpha: 1, delay: 1000, duration: 200 });
    this.time.delayedCall(800, () => this.cameras.main.shake(220, 0.01));
    // 光る瞬間に、紅と金の粒が大きく弾ける
    this.time.delayedCall(700, () => {
      ensureSandTexture(this);
      for (const tint of [CRIMSON, FRAME_COLORS.gold]) {
        const burst = this.add.particles(0, 0, 'ui-sand', {
          speed: { min: 120, max: 360 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.6, end: 0.2 },
          tint,
          alpha: { start: 1, end: 0 },
          lifespan: 900,
          emitting: false,
        });
        c.add(burst);
        burst.explode(40, GAME_WIDTH / 2, 410);
      }
    });
    const close = () => c.destroy(true);
    this.time.delayedCall(2200, close);
    makePressable(shade, { onTap: close });
  }

  // ---- 描画 ----

  private render(): void {
    this.updateDecompose();
    // 変えたら描き直すので、ここで自動セーブする（中身が同じなら書き込まない）
    saveRun();
    this.root.removeAll(true);
    this.root.add(frameBg(this, 0x1a1418, 0x060406));
    this.drawTree();
    // 見出し（段階141：共通の枠）
    frameHeader(this, this.root, 'weapon', '武器');
    this.drawTabs();
    this.drawStatus();
    if (this.drawer) this.drawDrawer();
    else this.drawDrawerBar();
    // 星図が閉じている時は、探索へ直接戻る（段階26）
    // 拠点から開いた時は拠点へ戻る（段階45）
    const back = hubBack() ?? (hubLineup().unlocks.growth ? null : getHubReturn());
    const leave = () => {
      if (!back) {
        this.scene.start('Growth');
        return;
      }
      setHubReturn(null);
      this.scene.start(back.key, back.data);
    };
    backButton(this, this.root, back ? (back.label ?? '探索へ戻る') : '星図へ戻る', leave);
  }

  /** 仲間の顔のタブ（段階141：共通の枠） */
  private drawTabs(): void {
    const tabs = lineupBase(hubLineup()).map((c) => {
      const ws = run.armory.weapons[c.id];
      const ready = canEvolveAny(D, run.armory, c.id);
      return {
        id: c.id,
        name: c.name,
        sub: ready ? '進化できる！' : `Lv${weaponLevel(D, ws.exp)}${ws.path.length > 0 ? `・進化${ws.path.length}` : ''}`,
        subColor: ready ? FRAME_COLORS.goldText : undefined,
      };
    });
    faceTabs(this, this.root, tabs, this.charId, {
      onTap: (id) => {
        this.charId = id;
        this.message = '';
        this.picks = {};
        this.render();
      },
    });
  }

  /** 上：名前とレベル、攻火氷雷の4本の棒（選んだ素材で増える分は白く光る）、刻印の目盛り。長押しで詳しく */
  private drawStatus(): void {
    const w = this.weapon();
    const x0 = SIDE_PADDING + 6;
    const width = GAME_WIDTH - x0 * 2;
    const top = STATUS_TOP;
    // 下の木が透けすぎないよう、うっすら暗くする
    const hit = this.add.rectangle(0, top - 4, GAME_WIDTH, TREE_TOP - top + 2, 0x060406, 0.55).setOrigin(0);
    this.root.add(hit);
    const lv = weaponLevel(D, w.exp);
    const next = D.levelExp[lv - 1];
    const name = addText(this, x0, top, weaponName(D, w), { size: 19, bold: true });
    this.root.add(name.setFontFamily(FONT_HEADING).setLetterSpacing(1));
    this.root.add(addText(this, x0 + name.width + 8, top + 6, `LV ${lv}　${next === undefined ? '経験値 最大' : `経験値 ${w.exp}/${next}`}`, { size: 10, color: COLORS.subText }));
    // 4本の棒（2列×2段）
    const after = this.picking() === 'items' || this.pickedCount() > 0 ? paramsAfterPicked(D, w.params, this.picks) : w.params;
    const near = nearestEvolution(D, run.armory, this.charId);
    const mins = near?.evolution.conditions.flatMap((c) => (c.kind === 'param' ? [c.min] : [])) ?? [];
    const scale = Math.max(48, ...PARAM_KEYS.map((k) => Math.max(w.params[k], after[k])), ...mins);
    const colW = (width - 14) / 2;
    PARAM_KEYS.forEach((k, i) => {
      const x = x0 + (i % 2) * (colW + 14);
      const y = top + 30 + Math.floor(i / 2) * 20;
      this.drawBar(k, x, y, colW, w.params[k], after[k], scale);
    });
    // 刻印の目盛り（使った分は紅、選んでいる分は白、残りは暗い）
    const slots = weaponSlots(D, w);
    const used = w.absorbed;
    const picked = this.picking() === 'items' ? this.pickedCount() : 0;
    const gy = top + 76;
    this.root.add(addText(this, x0, gy, '刻印', { size: 10, color: COLORS.subText }).setOrigin(0, 0.5));
    const gx = x0 + 30;
    const gw = width - 30 - 52;
    const seg = gw / Math.max(1, slots);
    const g = this.add.graphics();
    for (let i = 0; i < slots; i++) {
      const color = i < used ? CRIMSON : i < used + picked ? 0xffffff : 0x2a2e34;
      g.fillStyle(color, 1).fillRect(gx + i * seg, gy - 3, Math.max(1, seg - 1.5), 6);
    }
    this.root.add(g);
    this.root.add(addText(this, x0 + width, gy, `${used + picked}/${slots}`, { size: 11, bold: true, color: used >= slots ? '#ff8a8a' : COLORS.text }).setOrigin(1, 0.5));
    makePressable(hit, { onLongPress: () => this.showDetail(weaponName(D, w), this.statusDetail()) });
  }

  /** 能力値の棒1本（ラベル・棒・数）。after が大きければ増える分を白く、小さければ減る分を暗く */
  private drawBar(k: WeaponParamKey, x: number, y: number, w: number, now: number, after: number, scale: number): void {
    const color = PARAM_COLOR[k];
    this.root.add(addText(this, x, y, PARAM_SHORT[k], { size: 12, bold: true, color: toCss(color) }).setOrigin(0, 0.5));
    const bx = x + 18;
    const bw = w - 18 - 34;
    const g = this.add.graphics();
    const skew = (px: number, pw: number, c: number, a = 1) => {
      if (pw <= 0) return;
      g.fillStyle(c, a).fillPoints([new Phaser.Math.Vector2(px + 2, y - 3), new Phaser.Math.Vector2(px + pw + 2, y - 3), new Phaser.Math.Vector2(px + pw - 2, y + 3), new Phaser.Math.Vector2(px - 2, y + 3)], true);
    };
    skew(bx, bw, 0x22262c);
    const lo = Math.min(now, after);
    skew(bx, (bw * lo) / scale, color);
    if (after > now) skew(bx + (bw * now) / scale, (bw * (after - now)) / scale, 0xffffff);
    if (after < now) skew(bx + (bw * after) / scale, (bw * (now - after)) / scale, color, 0.3);
    this.root.add(g);
    const diff = after - now;
    this.root.add(addText(this, x + w, y, diff !== 0 ? `${after}` : `${now}`, { size: 12, bold: true, color: diff > 0 ? '#ffffff' : diff < 0 ? '#ff8a8a' : COLORS.text }).setOrigin(1, 0.5));
  }

  /** 能力値の長押し：属性の効き、刻印、傾向、上限 */
  private statusDetail(): string {
    const w = this.weapon();
    const lines = PARAM_KEYS.map((k) => `${PARAM_LABEL[k]} ${w.params[k]}${k === 'atk' ? '' : w.params[k] > 0 ? `（${PARAM_LABEL[k]}のダメージ +${Math.round(w.params[k] * D.elementRate * 100)}%）` : ''}`);
    lines.push(`刻印 ${w.absorbed}/${weaponSlots(D, w)}（素材を刻める数。レベルが上がると増える）`);
    // 傾向（ムーブメントが閉じている間は出さない。段階26）
    if (hubLineup().unlocks.navi) {
      const t = tendencyOf(w);
      const totals = (Object.entries(w.tendency) as [PartColor, number][]).filter(([, n]) => n > 0);
      lines.push(`傾向：${t ? PART_COLOR_LABEL[t] : 'なし'}${totals.length > 0 ? `（${totals.map(([c, n]) => `${PART_COLOR_LABEL[c]}${n}`).join(' ')}）` : ''}`);
    }
    // 割合の効果の上限（段階54）：武器・型・ギア・星図を合わせて上限に届いた効果（超えた分は効かない）
    const grown = currentParty(hubLineup()).find((c) => c.id === this.charId);
    const capped = grown ? cappedPassives(grown) : [];
    if (capped.length > 0) {
      const label = (c: (typeof capped)[number]): string =>
        c.kind === 'elementBoost'
          ? `${ELEMENT_LABEL[c.element!]} +${Math.round(c.value * 100)}%`
          : ({ partBoost: `部位 +${Math.round(c.value * 100)}%`, comboBoost: `コンボ +${Math.round(c.value * 100)}%`, regen: `回復 ${Math.round(c.value * 100)}%`, batonBoost: `バトン ×${1.25 + c.value}`, mpSave: `MP消費 −${c.value}`, oneMoreDraw: `延長 +${c.value}枚` } as Record<string, string>)[c.kind];
      lines.push(`上限：${capped.map(label).join('・')}（超えた分は効かない）`);
    }
    return lines.join('\n');
  }

  /** まん中：紅の系譜（進化の木）。枠の中をドラッグで動かす。次の姿をタップで進化の窓、ほかは説明 */
  private drawTree(): void {
    const w = this.weapon();
    this.laid = layoutTree(D, w, hubLineup().unlocks.navi);
    const tree = this.add.container(0, 0);
    // 木の左右の銀の細い柱（額縁のように）
    const frame = this.add.graphics();
    frame.lineStyle(1, 0xb8bcc4, 0.25).lineBetween(SIDE_PADDING + 18, TREE_TOP + 6, SIDE_PADDING + 18, TREE_BOTTOM - 6);
    frame.lineBetween(GAME_WIDTH - SIDE_PADDING - 18, TREE_TOP + 6, GAME_WIDTH - SIDE_PADDING - 18, TREE_BOTTOM - 6);
    this.root.add(frame);
    drawTree(this, tree, D, w, this.laid, run.armory.items, D.weapons[w.defId].name);
    const mask = this.make.graphics({}, false).fillRect(0, TREE_TOP, GAME_WIDTH, TREE_BOTTOM - TREE_TOP);
    tree.setMask(mask.createGeometryMask());
    tree.once(Phaser.GameObjects.Events.DESTROY, () => mask.destroy());
    this.root.add(tree);
    this.tree = tree;
    const pos = this.treePos.get(this.charId) ?? this.centerTree();
    tree.setPosition(pos.x, pos.y);
  }

  /** 木の動かせる範囲（x・y の最小と最大） */
  private treeBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const size = treeSize(this.laid);
    const pad = 44;
    // 横：木が幅より狭ければ真ん中に固定。広ければ、どの紋章も真ん中まで寄せられる
    const fitX = (GAME_WIDTH - size.w) / 2;
    const [minX, maxX] = size.w + pad * 2 <= GAME_WIDTH ? [fitX, fitX] : [GAME_WIDTH / 2 - size.w, GAME_WIDTH / 2];
    // 縦：てっぺんが枠の上の少し下に、根元が枠の下の少し上に来るまで
    const maxY = TREE_TOP + 50;
    const minY = Math.min(maxY, TREE_BOTTOM - 40 - size.h);
    return { minX, maxX, minY, maxY };
  }

  /** 今の姿が枠の真ん中より少し下に来る位置 */
  private centerTree(): { x: number; y: number } {
    const cur = currentNode(this.laid, this.weapon());
    const b = this.treeBounds();
    return {
      x: Phaser.Math.Clamp(GAME_WIDTH / 2 - cur.x, b.minX, b.maxX),
      y: Phaser.Math.Clamp(TREE_TOP + (TREE_BOTTOM - TREE_TOP) * 0.62 - cur.y, b.minY, b.maxY),
    };
  }

  /** 木の枠の中のドラッグで動かし、ほとんど動かさずに離したらタップ（紋章を選ぶ）。長押しは説明 */
  private setupPan(): void {
    let start: { x: number; y: number; tx: number; ty: number; at: number } | null = null;
    let moved = false;
    const toWorld = (p: Phaser.Input.Pointer) => this.cameras.main.getWorldPoint(p.x, p.y);
    const bottom = () => (this.drawer ? DRAWER_TOP : TREE_BOTTOM);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const at = toWorld(p);
      if (this.overlay || !this.tree || at.y < TREE_TOP || at.y > bottom()) return;
      start = { x: at.x, y: at.y, tx: this.tree.x, ty: this.tree.y, at: this.time.now };
      moved = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!start || !p.isDown || !this.tree) return;
      const at = toWorld(p);
      const dx = at.x - start.x;
      const dy = at.y - start.y;
      if (Math.hypot(dx, dy) > DRAG_SLOP) moved = true;
      if (!moved) return;
      const b = this.treeBounds();
      this.tree.x = Phaser.Math.Clamp(start.tx + dx, b.minX, b.maxX);
      this.tree.y = Phaser.Math.Clamp(start.ty + dy, b.minY, b.maxY);
      this.treePos.set(this.charId, { x: this.tree.x, y: this.tree.y });
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!start || !this.tree) return;
      const was = start;
      start = null;
      if (moved || this.overlay) return;
      const at = toWorld(p);
      const lx = at.x - was.tx;
      const ly = at.y - was.ty;
      const hit = this.laid.find((n) => Math.hypot(lx - n.x, ly - n.y) <= TREE.currentR + 6);
      if (!hit) return;
      this.tapEmblem(hit, this.time.now - was.at >= 500);
    });
  }

  /** 紋章を押した：次の姿なら進化の窓（長押しは説明）、ほかは説明 */
  private tapEmblem(n: TreeNode, long: boolean): void {
    const w = this.weapon();
    if (n.evo && !long && evolutionVisibility(D, w, n.evo.id) === 'next') {
      this.confirmEvolve(n.evo);
      return;
    }
    const ext = hubLineup().unlocks.navi ? D.boardExtension : 0;
    const { title, body } = treeDetail(D, w, n.evo?.id ?? '', run.armory.items, ext);
    if (title) this.showDetail(title, body);
  }

  /** 引き出しを閉じている時：素材の数と、一番近い進化先まであと何か。下に「素材を選ぶ」 */
  private drawDrawerBar(): void {
    const y = DRAWER_BAR;
    this.root.add(this.add.rectangle(0, y, GAME_WIDTH, 32, 0x0a0b0e, 0.92).setOrigin(0));
    this.root.add(this.add.rectangle(0, y, GAME_WIDTH, 1, CRIMSON, 0.6).setOrigin(0));
    this.root.add(this.add.rectangle(GAME_WIDTH / 2, y + 5, 36, 3, 0xffffff, 0.3).setRounded(1.5));
    const total = Object.entries(run.armory.items).reduce((a, [id, n]) => a + (D.items[id]?.kind === 'material' ? n : 0), 0);
    this.root.add(addText(this, SIDE_PADDING + 6, y + 18, `素材 ${total}　▲`, { size: 12, bold: true }).setOrigin(0, 0.5));
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING - 6, y + 18, this.message || this.nextHint(), { size: 11, color: this.message ? COLORS.text : '#ff8a9a' }).setOrigin(1, 0.5));
    const bar = this.add.rectangle(0, y, GAME_WIDTH, 32, 0x000000, 0.001).setOrigin(0);
    this.root.add(bar);
    const open = () => {
      this.drawer = true;
      this.message = '';
      this.render();
    };
    makePressable(bar, { onTap: open });
    addButton(this, this.root, GAME_WIDTH / 2, FRAME.mainY, GAME_WIDTH - SIDE_PADDING * 2 - 8, 46, '素材を選ぶ', { onTap: open }, GOLD_BUTTON);
  }

  /** 一番近い進化先まで（「次：○○　氷 あと8・鍵 ✓」）。今すぐ進化できる時はそう言う */
  private nextHint(): string {
    const w = this.weapon();
    if (canEvolveAny(D, run.armory, this.charId)) return '金に光る紋章をタップで進化';
    const near = nearestEvolution(D, run.armory, this.charId);
    if (!near) return '';
    const parts = evolutionChecks(D, w, near.evolution, run.armory.items).map((c) => {
      const cd = c.condition;
      if (cd.kind === 'param') return c.ok ? '' : `${PARAM_SHORT[cd.param]} あと${cd.min - w.params[cd.param]}`;
      if (cd.kind === 'key') return `鍵 ${c.ok ? '✓' : '✗'}`;
      return c.ok ? '' : describeCondition(cd, D);
    });
    return `次：${near.evolution.name}　${parts.filter(Boolean).join('・')}`;
  }

  /** 引き出しを開いた時：絞り込み、ひし形の石（5列）、選んだものの合計、「刻む（N）」「時分解」 */
  private drawDrawer(): void {
    const top = DRAWER_TOP;
    this.root.add(this.add.rectangle(0, top, GAME_WIDTH, GAME_HEIGHT - top, 0x0a0b0e, 0.97).setOrigin(0).setInteractive());
    this.root.add(this.add.rectangle(0, top, GAME_WIDTH, 1, CRIMSON, 0.7).setOrigin(0));
    this.root.add(this.add.rectangle(GAME_WIDTH / 2, top + 6, 36, 3, 0xffffff, 0.3).setRounded(1.5));
    const close = this.add.rectangle(0, top, GAME_WIDTH, 22, 0x000000, 0.001).setOrigin(0);
    this.root.add(close);
    makePressable(close, {
      onTap: () => {
        this.drawer = false;
        this.picks = {};
        this.message = '';
        this.render();
      },
    });
    // 絞り込み（すべて・攻・火・氷・雷・鍵・欠片）。欠片は、時分解が出てからか、欠片を持っている時だけ（段階100c）
    const fragTotal = Object.values(run.armory.fragments).reduce((a, n) => a + n, 0);
    const itemTotal = Object.entries(run.armory.items).reduce((a, [id, n]) => a + (D.items[id]?.kind === 'material' ? n : 0), 0);
    const filters: Filter[] = ['all', 'atk', 'fire', 'ice', 'thunder', 'key', ...(this.decompose || fragTotal > 0 ? (['fragments'] as const) : [])];
    if (!filters.includes(this.filter)) this.filter = 'all';
    const fy = top + 30;
    const fw = (GAME_WIDTH - SIDE_PADDING * 2 - 4 * (filters.length - 1)) / filters.length;
    filters.forEach((f, i) => {
      const on = this.filter === f;
      const label = f === 'all' ? `すべて\n${itemTotal}` : f === 'key' ? '鍵' : f === 'fragments' ? `欠片\n${fragTotal}` : PARAM_SHORT[f];
      const color = f === 'all' || f === 'key' || f === 'fragments' ? FRAME_COLORS.gold : PARAM_COLOR[f];
      addButton(this, this.root, SIDE_PADDING + fw / 2 + i * (fw + 4), fy + 14, fw, 34, label, {
        onTap: () => {
          // 素材と欠片をまたいだら、選んだものは消す
          if ((f === 'fragments') !== (this.filter === 'fragments')) this.picks = {};
          this.filter = f;
          this.page = 0;
          this.message = '';
          this.render();
        },
      }, { fill: on ? 0x2a1418 : 0x121316, stroke: on ? CRIMSON : color, strokeWidth: on ? 2 : 1, size: f === 'all' || f === 'fragments' ? 10 : 13, bold: true, textColor: on ? '#ffffff' : toCss(color) });
    });
    // 石を並べる
    const ids = this.stoneIds();
    const perPage = STONE.cols * STONE.rows;
    const pages = Math.max(1, Math.ceil(ids.length / perPage));
    if (this.page >= pages) this.page = 0;
    const gridTop = fy + 40;
    const sw = (GAME_WIDTH - SIDE_PADDING * 2 - STONE.gap * (STONE.cols - 1)) / STONE.cols;
    if (ids.length === 0) {
      const none = this.filter === 'key' ? '進化の鍵になる素材を持っていない' : this.filter === 'all' ? '素材を持っていない。砂嵐を倒すと落とす' : 'この絞り込みの素材を持っていない';
      this.root.add(addText(this, SIDE_PADDING + 4, gridTop + 8, none, { size: 12, color: COLORS.subText }));
    }
    const { recommended, best } = this.recommendation();
    ids.slice(this.page * perPage, (this.page + 1) * perPage).forEach((id, i) => {
      const x = SIDE_PADDING + (i % STONE.cols) * (sw + STONE.gap);
      const y = gridTop + Math.floor(i / STONE.cols) * (STONE.h + STONE.gap);
      this.drawStone(id, x, y, sw, recommended.has(id), best === id);
    });
    if (pages > 1) {
      addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - 40, gridTop + STONE.rows * (STONE.h + STONE.gap) + 10, 80, 24, `次へ ${this.page + 1}/${pages}`, {
        onTap: () => {
          this.page = (this.page + 1) % pages;
          this.render();
        },
      }, { ...PLAIN_BUTTON, size: 11 });
    }
    // 選んだものの合計と、ボタン
    const sy = gridTop + STONE.rows * (STONE.h + STONE.gap) + (pages > 1 ? 28 : 6);
    this.root.add(this.add.rectangle(SIDE_PADDING, sy, GAME_WIDTH - SIDE_PADDING * 2, 48, 0x121316).setOrigin(0).setRounded(8).setStrokeStyle(1, FRAME_COLORS.line));
    this.root.add(addText(this, SIDE_PADDING + 10, sy + 24, this.message || this.pickSummary(), { size: 11, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 20 }).setOrigin(0, 0.5));
    const n = this.pickedCount();
    const isItems = this.picking() === 'items';
    const err = n === 0 ? 'nothing picked' : isItems ? getAbsorbPickedError(D, run.armory, this.charId, this.picks) : null;
    const showDecompose = isItems && this.decompose;
    const fullW = GAME_WIDTH - SIDE_PADDING * 2 - 8;
    const absorbW = showDecompose ? fullW * 0.64 : fullW;
    addButton(this, this.root, SIDE_PADDING + 4 + absorbW / 2, FRAME.mainY, absorbW, 46, n > 0 ? `刻む（${n}）` : '刻む', { onTap: () => this.absorb() }, { ...GOLD_BUTTON, enabled: !err });
    if (showDecompose) {
      const dw = fullW - absorbW - 6;
      addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - 4 - dw / 2, FRAME.mainY, dw, 46, '時分解', { onTap: () => this.fragment() }, { ...PLAIN_BUTTON, size: 15, bold: true, enabled: this.fragmentYield() > 0 });
    }
  }

  /** 引き出しに並べる素材（欠片）の id。絞り込みと、おすすめの順 */
  private stoneIds(): string[] {
    if (this.filter === 'fragments') return Object.keys(FRAGMENTS);
    // ポーチの消費アイテム（段階51）は素材の一覧に出さない（刻めず、時分解もできない）
    const owned = Object.keys(ITEMS).filter((id) => D.items[id]?.kind === 'material' && (run.armory.items[id] ?? 0) > 0);
    const f = this.filter;
    if (f === 'key') return owned.filter((id) => keyItems(this.weapon()).has(id));
    // 絞り込み（段階72）：その能力値を上げる素材だけを、上げ幅の大きい順（同じなら数の多い順）に
    if (f !== 'all') {
      return owned
        .filter((id) => (D.items[id].gains[f] ?? 0) > 0)
        .sort((a, b) => (D.items[b].gains[f] ?? 0) - (D.items[a].gains[f] ?? 0) || (run.armory.items[b] ?? 0) - (run.armory.items[a] ?? 0));
    }
    // 絞り込んでいない時は、★の素材を先頭に
    const { list } = this.recommendation();
    const rank = (id: string): number => (list.includes(id) ? list.indexOf(id) : list.length);
    return owned.sort((a, b) => rank(a) - rank(b));
  }

  /**
   * おすすめ（段階100。選び方は core/recommend.ts）：一番近い進化先に近づく素材に★、一番よいものは金の枠。
   * これから使う進化の鍵の素材（誰の武器でも）は勧めない。進化先の能力値が足りない時の★は、その能力値を上げる素材だけ
   */
  private recommendation(): { list: string[]; recommended: Set<string>; best: string | undefined } {
    if (this.picking() !== 'items') return { list: [], recommended: new Set(), best: undefined };
    const w = this.weapon();
    const near = nearestEvolution(D, run.armory, this.charId);
    const lack = near && near.evolution.conditions.some((c) => c.kind === 'param' && w.params[c.param] < c.min) ? near : null;
    const list = recommendMaterials(D, run.armory, this.charId, undefined, upcomingKeys(D, run.armory)).filter((id) => !lack || lack.params.some((k) => (D.items[id].gains[k] ?? 0) > 0));
    return { list, recommended: new Set(list), best: list[0] };
  }

  /** ひし形の石1つ：色が属性、ふちが珍しさ、点線の枠が鍵。選んだ数は右下に */
  private drawStone(id: string, x: number, y: number, w: number, recommended: boolean, best: boolean): void {
    const isItems = this.picking() === 'items';
    const it = isItems ? D.items[id] : undefined;
    const n = (isItems ? run.armory.items[id] : run.armory.fragments[id]) ?? 0;
    const gains = it ? it.gains : D.fragments[id].gains;
    const color = gainColor(gains);
    const rim = it?.rarity === 'rare' ? 0xffd84a : it?.rarity === 'uncommon' ? 0x6dd0ff : it?.rarity === 'part' || it?.rarity === 'boss' ? 0xc58bff : 0x5a5e66;
    const picked = this.picks[id] ?? 0;
    const key = it ? keyItems(this.weapon()).has(id) : false;
    const h = STONE.h;
    this.itemSpots.set(id, { x: x + w / 2, y: y + h / 2, color });
    const rect = this.add.rectangle(x, y, w, h, picked > 0 ? 0x2a1418 : 0x121316).setOrigin(0).setRounded(6);
    rect.setStrokeStyle(picked > 0 ? 2 : 1, picked > 0 ? CRIMSON : best ? FRAME_COLORS.gold : 0x2a2e34);
    this.root.add(rect);
    if (key) {
      const d = this.add.graphics();
      d.lineStyle(1.5, FRAME_COLORS.gold, 0.9);
      for (let px = x + 3; px < x + w - 3; px += 6) {
        d.lineBetween(px, y + 2, Math.min(px + 3, x + w - 3), y + 2);
        d.lineBetween(px, y + h - 2, Math.min(px + 3, x + w - 3), y + h - 2);
      }
      for (let py = y + 3; py < y + h - 3; py += 6) {
        d.lineBetween(x + 2, py, x + 2, Math.min(py + 3, y + h - 3));
        d.lineBetween(x + w - 2, py, x + w - 2, Math.min(py + 3, y + h - 3));
      }
      this.root.add(d);
    }
    // ひし形の石（光の面と影の面）
    const cx = x + w / 2;
    const cy = y + 26;
    const s = 15;
    const alpha = n > 0 ? 1 : 0.3;
    const g = this.add.graphics();
    g.fillStyle(color, 0.25 * alpha).fillCircle(cx, cy, s + 4);
    g.fillStyle(color, alpha).fillPoints([new Phaser.Math.Vector2(cx, cy - s), new Phaser.Math.Vector2(cx + s * 0.8, cy), new Phaser.Math.Vector2(cx, cy + s), new Phaser.Math.Vector2(cx - s * 0.8, cy)], true);
    g.fillStyle(0xffffff, 0.45 * alpha).fillPoints([new Phaser.Math.Vector2(cx, cy - s), new Phaser.Math.Vector2(cx + s * 0.8, cy), new Phaser.Math.Vector2(cx, cy)], true);
    g.lineStyle(1.5, rim, alpha).strokePoints([new Phaser.Math.Vector2(cx, cy - s), new Phaser.Math.Vector2(cx + s * 0.8, cy), new Phaser.Math.Vector2(cx, cy + s), new Phaser.Math.Vector2(cx - s * 0.8, cy)], true);
    this.root.add(g);
    // 上の角：属性の1文字と数
    const main = (Object.entries(gains) as [WeaponParamKey, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (main) this.root.add(addText(this, x + 4, y + 3, PARAM_SHORT[main], { size: 9, bold: true, color: toCss(PARAM_COLOR[main]) }));
    if (recommended) this.root.add(addText(this, x + 4, y + 14, '★', { size: 10, bold: true, color: FRAME_COLORS.goldText }));
    this.root.add(addText(this, x + w - 4, y + 3, `×${n}`, { size: 10, bold: true, color: n > 0 ? COLORS.text : COLORS.dimText }).setOrigin(1, 0));
    // 名前（下）
    const name = it ? it.name : D.fragments[id].name;
    this.root.add(addText(this, cx, y + h - 13, name, { size: name.length > 6 ? 8 : 9, bold: true, color: n > 0 ? COLORS.text : COLORS.dimText }).setOrigin(0.5));
    // 選んだ数
    if (picked > 0) {
      const t = addText(this, 0, 0, `×${picked}`, { size: 10, bold: true });
      const bw = t.width + 8;
      this.root.add(this.add.rectangle(x + w - bw, y + h - 30, bw, 15, CRIMSON).setOrigin(0));
      this.root.add(t.setPosition(x + w - bw / 2, y + h - 22.5).setOrigin(0.5));
    }
    makePressable(rect, {
      onTap: () => n > 0 && this.pick(id),
      onLongPress: () => (it ? this.showDetail(it.name, itemDetail(id, this.decompose)) : this.showDetail(D.fragments[id].name, fragmentDetail(id))),
    });
  }

  /** 選んだものの合計（「選んだ 3つ：氷 +9（金魚のひれ ×2、キューブの芯 ×1）」）。進化の条件に届くなら一言 */
  private pickSummary(): string {
    const n = this.pickedCount();
    if (n === 0) {
      return this.picking() === 'items' ? '石を押すと選ぶ（押すたびに +1、最後まで押すと 0 に戻る）。★は進化先に近づく素材' : '記憶の欠片を選んで「刻む」。刻印を使わず +1（時分解でできる）';
    }
    const w = this.weapon();
    const after = paramsAfterPicked(D, w.params, this.picks);
    const diff = PARAM_KEYS.filter((k) => after[k] !== w.params[k]).map((k) => `${PARAM_SHORT[k]} ${after[k] > w.params[k] ? '+' : ''}${after[k] - w.params[k]}`);
    const names = Object.entries(this.picks).map(([id, k]) => `${(D.items[id] ?? D.fragments[id]).name} ×${k}`);
    const reach = this.reachesEvolution(after);
    const frag = this.fragmentYield();
    return [
      `選んだ ${n}つ：${diff.join('・') || '変化なし'}（${names.join('、')}）`,
      reach ? `→ 刻むと「${reach}」の能力値の条件に届く` : frag > 0 && this.decompose ? `時分解すると、記憶の欠片が ${frag} つ` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /** 刻んだ後の能力値で、能力値の条件がまだ足りていない次の姿が、条件に届くなら、その名前 */
  private reachesEvolution(after: WeaponParams): string | null {
    const w = this.weapon();
    for (const n of this.laid) {
      if (!n.evo || evolutionVisibility(D, w, n.evo.id) !== 'next') continue;
      const params = n.evo.conditions.flatMap((c) => (c.kind === 'param' ? [c] : []));
      if (params.length === 0) continue;
      const before = params.every((c) => w.params[c.param] >= c.min);
      const now = params.every((c) => after[c.param] >= c.min);
      if (!before && now) return n.evo.name;
    }
    return null;
  }

  private closeOverlay(): void {
    fadeOutAndDestroy(this, this.overlay);
    this.overlay = undefined;
  }

  private showDetail(title: string, body: string): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(200);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);
    c.add(shade);
    const w = GAME_WIDTH - 40;
    const text = addText(this, 0, 0, body, { size: 14, wrap: w - 32 });
    const h = text.height + 90;
    const y = GAME_HEIGHT / 2 - h / 2;
    const panel = addWindow(this, 20, y, w, h, CRIMSON, 0x0c0a0b);
    const titleText = addText(this, 36, y + 14, title, { size: 17, bold: true, color: '#ff8a9a' });
    text.setPosition(36, y + 44);
    const hint = addText(this, GAME_WIDTH / 2, y + h - 16, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([panel, titleText, text, hint]);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    this.overlay = c;
    popIn(this, c);
  }
}

/** 一番大きく上がる属性の色（属性がなければ攻撃の色。全部同じなら紫） */
function gainColor(gains: Partial<Record<WeaponParamKey, number>>): number {
  const els = (['fire', 'ice', 'thunder'] as const).filter((k) => (gains[k] ?? 0) > 0).sort((a, b) => (gains[b] ?? 0) - (gains[a] ?? 0));
  if (els.length === 0) return PARAM_COLOR.atk;
  if (els.length === 3 && gains.fire === gains.ice && gains.ice === gains.thunder) return 0xc58bff;
  return PARAM_COLOR[els[0]];
}

/** その武器の、これから先の進化の鍵になる素材（段階42：次の進化先だけでなく、今の武器から行ける先の全部） */
function keyItems(w: WeaponState): Set<string> {
  const ahead = D.weapons[w.defId].evolutions.filter((e) => !['passed', 'unreachable'].includes(evolutionVisibility(D, w, e.id)));
  return new Set(ahead.flatMap((e) => e.conditions.flatMap((c) => (c.kind === 'key' ? [c.item] : []))));
}

/** 素材の長押しの説明。時分解がまだ出ていなければ（段階100c）、時分解の行は出さない */
function itemDetail(itemId: string, decompose: boolean): string {
  const it = D.items[itemId];
  return [
    it.kind === 'material' ? `素材（${RARITY_LABEL[it.rarity ?? 'common']}）` : 'ポーチの消費アイテム（戦闘の「その他」から使う）',
    it.kind === 'material' ? `刻むと：${describeGains(it.gains)}（刻印を1つ使う）` : '',
    decompose ? `時分解すると：${describeDecompose(D, it)}` : '',
    '',
    `手に入れ方：${itemSources(itemId).join('、') || '―'}`,
  ]
    .filter((l, i) => l !== '' || i === 3)
    .join('\n');
}

function fragmentDetail(fragmentId: string): string {
  return [
    '記憶の欠片。記憶に宿る感情ごとに種類が分かれる',
    `1つにつき：${describeFragment(D.fragments[fragmentId])}（刻印を使わない）`,
    '',
    `要らない素材・アイテムを${D.decomposeCost}つ時分解すると1つできる（その素材が一番大きく上げる能力値の欠片）`,
  ].join('\n');
}
