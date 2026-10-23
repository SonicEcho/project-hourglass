import Phaser from 'phaser';
import type { EvolutionDef, PartColor, WeaponParamKey, WeaponState } from '../core';
import {
  cappedPassives,
  absorbMaterial,
  canEvolveAny,
  evolutionChecks,
  evolutionVisibility,
  evolveWeapon,
  feedFragment,
  fragmentItem,
  getAbsorbError,
  getEvolveError,
  getFeedError,
  getFragmentError,
  nearestEvolution,
  nextEvolutions,
  recommendMaterials,
  upcomingKeys,
  paramsAfter,
  tendencyOf,
  weaponLevel,
  weaponName,
  weaponSlots,
} from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { FRAGMENTS, ITEMS, itemSources, WEAPON_DATA } from '../data';
import { SIDE_PADDING } from '../ui/layout';
import { PART_COLOR_LABEL } from '../ui/naviText';
import { PART_COLOR } from '../ui/naviViews';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, RENDER_SCALE, toCss } from '../ui/theme';
import { describeCondition, describeDecompose, describeEvolution, describeFragment, describeGains, describeStyle, PARAM_LABEL, PARAM_SHORT, RARITY_LABEL } from '../ui/weaponText';
import { addBar, addButton, addText, makePressable } from '../ui/widgets';
import { maybeShowTip } from '../ui/tipPanel';
import { currentParty, getHubReturn, hubBack, hubLineup, lineupBase, run, saveRun, setHubReturn } from './run';
import { addWindow, ensureSandTexture, enterScreen, fadeOutAndDestroy, popIn, screenBg, sparkAt } from '../ui/skin';
import { addIcon } from '../ui/icons';

// 武器の画面（段階9）。縦持ち 390×844 に、武器・進化先・記憶の欠片を1画面で収める
//
// 記憶の欠片をタップで選び「吸わせる」。条件を全部満たした次の進化先に「進化」ボタンが出る（型を選んで、確認してから進化）。
// 段階42：進化は何度もできる（進化ツリー）。ここには次の進化先だけを出し、ツリー全体は「ツリーを見る」（WeaponTreeScene）で

const D = WEAPON_DATA;
const PARAM_KEYS: WeaponParamKey[] = ['atk', 'fire', 'ice', 'thunder'];
const PARAM_COLOR: Record<WeaponParamKey, number> = { atk: ELEMENT_COLOR.physical, fire: ELEMENT_COLOR.fire, ice: ELEMENT_COLOR.ice, thunder: ELEMENT_COLOR.thunder };

const CARD_TOP = 92;
const EVO_TOP = 234;
const EVO_H = 78;
const FRAG_TOP = 518;

export class WeaponScene extends Phaser.Scene {
  private charId = 'hero';
  /** 下の段のタブ */
  private tab: 'items' | 'fragments' = 'items';
  /** 素材の絞り込み（段階72）：選んだ能力値を上げる素材だけを、上げ幅の大きい順に並べる。null なら全部 */
  private filter: WeaponParamKey | null = null;
  /** 素材の一覧のページ（多い時） */
  private page = 0;
  /** 選んでいる素材・アイテム、または記憶の欠片 */
  private selected: string | null = null;
  /** 素材・欠片の並びの場所（吸わせる演出の出どころ。描くたびに覚え直す） */
  private itemSpots = new Map<string, { x: number; y: number; color: number }>();
  private message = '';
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Weapon');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.selected = null;
    this.message = '';
    // パーティにいない仲間を選んでいたら、先頭の仲間にする（段階26）
    const members = lineupBase(hubLineup());
    if (!members.some((c) => c.id === this.charId)) this.charId = members[0].id;
    this.render();
    maybeShowTip(this, ['growth_weapon']);
  }

  /** デバッグメニューから記憶の欠片や経験値が変わった時に描き直す */
  refresh(): void {
    if (this.scene.isActive()) this.render();
  }

  private weapon(): WeaponState {
    return run.armory.weapons[this.charId];
  }

  // ---- 操作 ----

  /** 素材を武器に吸わせる（段階27b） */
  private absorb(): void {
    const id = this.selected;
    if (!id || getAbsorbError(D, run.armory, this.charId, id)) return;
    const before = weaponName(D, this.weapon());
    run.armory = absorbMaterial(D, run.armory, this.charId, id);
    this.message = `${before}に${D.items[id].name}を吸わせた（${describeGains(D.items[id].gains)}）`;
    console.log('[weapon] absorb', this.charId, id, JSON.stringify(this.weapon().params));
    if ((run.armory.items[id] ?? 0) <= 0) this.selected = null;
    const spot = this.itemSpots.get(id);
    this.render();
    if (spot) this.playAbsorb(spot);
  }

  /** 要らない素材を時分解して、記憶の欠片にする */
  private fragment(): void {
    const id = this.selected;
    if (!id || getFragmentError(D, run.armory, id)) return;
    const it = D.items[id];
    run.armory = fragmentItem(D, run.armory, id);
    this.message = `${it.name}を時分解した（${describeDecompose(D, it)}）。「記憶の欠片」のタブで吸わせる`;
    console.log('[weapon] fragment', id, JSON.stringify(run.armory.fragments));
    if ((run.armory.items[id] ?? 0) < D.decomposeCost) this.selected = null;
    this.render();
  }

  private feed(): void {
    const id = this.selected;
    if (!id || getFeedError(D, run.armory, this.charId, id)) return;
    const before = weaponName(D, this.weapon());
    run.armory = feedFragment(D, run.armory, this.charId, id);
    this.message = `${before}に記憶の欠片（${D.fragments[id].name}）を吸わせた（${describeFragment(D.fragments[id])}。枠は使わない）`;
    console.log('[weapon] feed', this.charId, id, JSON.stringify(this.weapon().params));
    if ((run.armory.fragments[id] ?? 0) <= 0) this.selected = null;
    const spot = this.itemSpots.get(id);
    this.render();
    if (spot) this.playAbsorb(spot);
  }

  /** 進化の確認：型を2つから1つ選んでから「進化する」（段階42） */
  private confirmEvolve(evo: EvolutionDef, style: number | null = null): void {
    this.closeOverlay();
    const ext = hubLineup().unlocks.navi ? D.boardExtension : 0;
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0).setInteractive());
    const top = 190;
    const h = 380;
    c.add(addWindow(this, 20, top, GAME_WIDTH - 40, h));
    c.add(addText(this, GAME_WIDTH / 2, top + 18, `${evo.name}に進化する？`, { size: 18, bold: true, color: COLORS.accentText }).setOrigin(0.5, 0));
    c.add(addText(this, 40, top + 52, describeEvolution(evo) || '―', { size: 13, wrap: GAME_WIDTH - 80 }));
    c.add(addText(this, 40, top + 96, '型を1つ選ぶ（効果は次の進化にも引き継ぐ）', { size: 12, bold: true, color: COLORS.subText }));
    (evo.styles ?? []).forEach((st, i) => {
      const y = top + 120 + i * 76;
      const chosen = style === i;
      const rect = this.add.rectangle(36, y, GAME_WIDTH - 72, 68, chosen ? 0x3a3214 : COLORS.panel).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(chosen ? 3 : 1, chosen ? COLORS.accent : COLORS.border);
      c.add(rect);
      c.add(addText(this, 48, y + 8, `${evo.name}・${st.name}`, { size: 15, bold: true, color: chosen ? COLORS.accentText : COLORS.text }));
      c.add(addText(this, 48, y + 32, describeStyle(st, ext).replace(/^[^：]*：/, ''), { size: 11, wrap: GAME_WIDTH - 96 }));
      makePressable(rect, { onTap: () => this.confirmEvolve(evo, i) });
    });
    c.add(addText(this, GAME_WIDTH / 2, top + h - 92, '進化と型は戻せない', { size: 12, color: COLORS.subText }).setOrigin(0.5, 0));
    const w = (GAME_WIDTH - 40 - 36) / 2;
    addButton(this, c, 32 + w / 2, top + h - 40, w, 52, 'やめる', { onTap: () => this.closeOverlay() }, { size: 15 });
    addButton(this, c, GAME_WIDTH - 32 - w / 2, top + h - 40, w, 52, '進化する', { onTap: () => style !== null && this.evolve(evo, style) }, {
      enabled: style !== null,
      fill: 0x5a4a10,
      stroke: COLORS.accent,
      strokeWidth: 2,
      size: 16,
      bold: true,
    });
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
    this.render();
    this.playEvolution(before, after);
  }

  /**
   * 吸わせる演出（段階32a 調整2）：素材の場所から光の粒が武器の枠へ吸い込まれ、武器が光る
   */
  private playAbsorb(from: { x: number; y: number; color: number }): void {
    const width = GAME_WIDTH - SIDE_PADDING * 2;
    const tx = SIDE_PADDING + width / 2;
    const ty = CARD_TOP + 68;
    ensureSandTexture(this);
    // 素材の場所から武器の枠へ飛んでいく光の粒（白い芯と、素材の色の粒）
    const flow = (tint: number, scale: number) =>
      this.add
        .particles(from.x, from.y, 'ui-sand', {
          x: { min: -18, max: 18 },
          y: { min: -10, max: 10 },
          // 行き先は、粒を出す場所（素材）からの相対の位置で書く
          moveToX: { min: tx - from.x - 50, max: tx - from.x + 50 },
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
    // 粒が届いたら、武器の枠が光る
    this.time.delayedCall(700, () => {
      const glow = this.add.rectangle(SIDE_PADDING, CARD_TOP, width, 136, from.color, 0.35).setOrigin(0).setRounded(8).setDepth(140);
      this.tweens.add({ targets: glow, alpha: 0, duration: 420, onComplete: () => glow.active && glow.destroy() });
      sparkAt(this, tx, ty);
    });
  }


  /** 進化の演出：画面が光り、武器の名前が変わる */
  private playEvolution(before: string, after: string): void {
    const c = this.add.container(0, 0).setDepth(300);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0).setInteractive();
    const old = addText(this, GAME_WIDTH / 2, 380, before, { size: 24, bold: true, color: COLORS.subText }).setOrigin(0.5);
    const name = addText(this, GAME_WIDTH / 2, 410, after, { size: 34, bold: true, color: '#ffffff' }).setOrigin(0.5);
    name.setStroke('#c08000', 8).setAlpha(0).setScale(2.2);
    const label = addText(this, GAME_WIDTH / 2, 470, '進化！', { size: 18, bold: true, color: COLORS.accentText }).setOrigin(0.5).setAlpha(0);
    const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0).setOrigin(0);
    c.add([shade, old, name, label, flash]);
    this.tweens.add({ targets: old, alpha: 0, y: 360, delay: 400, duration: 300 });
    this.tweens.add({ targets: flash, alpha: { from: 0, to: 1 }, delay: 650, duration: 120, yoyo: true });
    this.tweens.add({ targets: name, alpha: 1, scale: 1, delay: 800, duration: 320, ease: 'Back.easeOut' });
    this.tweens.add({ targets: label, alpha: 1, delay: 1000, duration: 200 });
    this.time.delayedCall(800, () => this.cameras.main.shake(220, 0.01));
    // 光る瞬間に、砂の粒が大きく弾ける（段階32a 調整2）
    this.time.delayedCall(700, () => {
      ensureSandTexture(this);
      const burst = this.add.particles(0, 0, 'ui-sand', {
        speed: { min: 120, max: 360 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.6, end: 0.2 },
        tint: COLORS.accent,
        alpha: { start: 1, end: 0 },
        lifespan: 900,
        emitting: false,
      });
      c.add(burst);
      burst.explode(70, GAME_WIDTH / 2, 410);
    });
    const close = () => c.destroy(true);
    this.time.delayedCall(2200, close);
    makePressable(shade, { onTap: close });
  }

  // ---- 描画 ----

  private render(): void {
    // 変えたら描き直すので、ここで自動セーブする（中身が同じなら書き込まない）
    saveRun();
    this.root.removeAll(true);
    this.root.add(screenBg(this));
    // 見出しのアイコン（段階32a 調整2）
    this.root.add(addIcon(this, 'weapon', SIDE_PADDING + 9, 20, 18, COLORS.accent));
    this.root.add(addText(this, SIDE_PADDING + 24, 8, '武器', { size: 17, bold: true }));
    this.root.add(
      addText(this, GAME_WIDTH - SIDE_PADDING, 12, '条件を満たすと進化。何度も進化する', { size: 11, color: COLORS.accentText }).setOrigin(1, 0),
    );
    this.drawTabs();
    this.drawWeapon();
    this.drawEvolutions();
    this.drawInventory();
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
    addButton(this, this.root, GAME_WIDTH / 2, 800, GAME_WIDTH - SIDE_PADDING * 2, 52, back ? (back.label ?? '探索へ戻る') : '星図へ戻る', { onTap: leave }, {
      size: 16,
      bold: true,
    });
  }

  private drawTabs(): void {
    const top = 36;
    const members = lineupBase(hubLineup());
    const n = members.length;
    const gap = 6;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
    members.forEach((c, i) => {
      const x = SIDE_PADDING + i * (w + gap);
      const active = c.id === this.charId;
      const ws = run.armory.weapons[c.id];
      const rect = this.add.rectangle(x, top, w, 46, active ? COLORS.panelLight : COLORS.panel).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(active ? 3 : 1, active ? 0xffffff : COLORS.border);
      this.root.add(rect);
      this.root.add(addText(this, x + 8, top + 5, c.name, { size: 14, bold: true, color: toCss(ALLY_COLOR[c.id] ?? COLORS.ally) }));
      const ready = canEvolveAny(D, run.armory, c.id);
      this.root.add(
        addText(this, x + 8, top + 26, ready ? '進化できる！' : `Lv${weaponLevel(D, ws.exp)}${ws.path.length > 0 ? `・進化${ws.path.length}回` : ''}`, {
          size: 10,
          color: ready ? COLORS.accentText : COLORS.subText,
        }),
      );
      makePressable(rect, {
        onTap: () => {
          this.charId = c.id;
          this.message = '';
          this.render();
        },
      });
    });
  }

  /** 武器のスナップ：名前、レベルと経験値、パラメータ、傾向 */
  private drawWeapon(): void {
    const w = this.weapon();
    const owner = lineupBase(hubLineup()).find((c) => c.id === this.charId)!;
    const x0 = SIDE_PADDING;
    const width = GAME_WIDTH - SIDE_PADDING * 2;
    const evolved = w.path.length > 0;
    this.root.add(this.add.rectangle(x0, CARD_TOP, width, 136, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(evolved ? 2 : 1, evolved ? COLORS.accent : COLORS.border));
    this.root.add(addText(this, x0 + 10, CARD_TOP + 8, weaponName(D, w), { size: 18, bold: true, color: evolved ? COLORS.accentText : COLORS.text }));
    this.root.add(addText(this, x0 + width - 10, CARD_TOP + 12, `${owner.name}の武器`, { size: 11, color: COLORS.subText }).setOrigin(1, 0));

    // レベルと経験値
    const lv = weaponLevel(D, w.exp);
    const prev = lv >= 2 ? D.levelExp[lv - 2] : 0;
    const next = D.levelExp[lv - 1];
    const ratio = next === undefined ? 1 : (w.exp - prev) / (next - prev);
    this.root.add(addText(this, x0 + 10, CARD_TOP + 38, `Lv${lv}`, { size: 15, bold: true }));
    addBar(this, this.root, x0 + 56, CARD_TOP + 48, 180, 8, ratio, 0xffc83a);
    this.root.add(
      addText(this, x0 + 244, CARD_TOP + 40, next === undefined ? `経験値 ${w.exp}（最大）` : `経験値 ${w.exp}/${next}`, { size: 11, color: COLORS.subText }),
    );

    // パラメータ（4つ並べる）
    const cw = (width - 20) / 4;
    PARAM_KEYS.forEach((k, i) => {
      const x = x0 + 10 + i * cw;
      const y = CARD_TOP + 66;
      this.root.add(this.add.rectangle(x, y, cw - 6, 36, COLORS.panelLight).setRounded(8).setOrigin(0).setStrokeStyle(1, PARAM_COLOR[k]));
      this.root.add(addIcon(this, k === 'atk' ? 'physical' : k, x + 11, y + 10, 10, PARAM_COLOR[k]));
      this.root.add(addText(this, x + 19, y + 3, PARAM_LABEL[k], { size: 10, color: toCss(PARAM_COLOR[k]) }));
      const v = w.params[k];
      const extra = k === 'atk' ? '' : v > 0 ? ` +${Math.round(v * D.elementRate * 100)}%` : '';
      this.root.add(addText(this, x + 6, y + 16, `${v}${extra}`, { size: 14, bold: true }));
    });

    // 吸わせ枠（段階27b）
    const slots = weaponSlots(D, w);
    this.root.add(
      addText(this, x0 + 10, CARD_TOP + 110, `吸わせ枠 ${w.absorbed}/${slots}${w.absorbed >= slots ? '（いっぱい。レベルが上がると増える）' : ''}`, {
        size: 12,
        bold: true,
        color: w.absorbed >= slots ? COLORS.allyDamage : COLORS.text,
      }),
    );
    // 割合の効果の上限（段階54）：武器・型・ギア・星図を合わせて上限に届いた効果（超えた分は効かない）
    const grown = currentParty(hubLineup()).find((c) => c.id === this.charId);
    const capped = grown ? cappedPassives(grown) : [];
    if (capped.length > 0) {
      const label = (c: (typeof capped)[number]): string =>
        c.kind === 'elementBoost'
          ? `${ELEMENT_LABEL[c.element!]} +${Math.round(c.value * 100)}%`
          : ({ partBoost: `部位 +${Math.round(c.value * 100)}%`, comboBoost: `コンボ +${Math.round(c.value * 100)}%`, regen: `回復 ${Math.round(c.value * 100)}%`, batonBoost: `バトン ×${1.25 + c.value}`, mpSave: `MP消費 −${c.value}`, oneMoreDraw: `延長 +${c.value}枚` } as Record<string, string>)[c.kind];
      this.root.add(addText(this, x0 + 10, CARD_TOP + 124, `上限：${capped.map(label).join('・')}（超えた分は効かない）`, { size: 10, bold: true, color: COLORS.accentText }));
    }
    // 傾向（ムーブメントが閉じている間は出さない。段階26）
    if (!hubLineup().unlocks.navi) return;
    const t = tendencyOf(w);
    const totals = (Object.entries(w.tendency) as [PartColor, number][]).filter(([, n]) => n > 0);
    this.root.add(
      addText(this, x0 + 200, CARD_TOP + 110, `傾向：${t ? PART_COLOR_LABEL[t] : 'なし'}`, { size: 12, bold: true, color: t ? toCss(PART_COLOR[t]) : COLORS.subText }),
    );
    this.root.add(
      addText(this, x0 + 290, CARD_TOP + 112, totals.map(([c, n]) => `${PART_COLOR_LABEL[c]}${n}`).join(' '), { size: 10, color: COLORS.subText }),
    );
  }

  /** 次の進化先（段階42。ツリーの1段先だけ）。条件を ✓／✗ で見せ、全部 ✓ なら「進化」。ツリー全体は「ツリーを見る」 */
  private drawEvolutions(): void {
    const w = this.weapon();
    const tier = w.path.length + 1;
    this.root.add(addText(this, SIDE_PADDING, EVO_TOP - 4, `${tier}回目の進化先（長押しで詳細）`, { size: 11, color: COLORS.subText }));
    addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - 56, EVO_TOP + 4, 112, 26, 'ツリーを見る', { onTap: () => this.scene.start('WeaponTree', { charId: this.charId }) }, {
      size: 12,
      bold: true,
      stroke: COLORS.accent,
      textColor: COLORS.accentText,
    });
    // ムーブメントが閉じている間は、ギアの傾向が条件の進化先と、盤が広がる話を出さない（段階26）
    const navi = hubLineup().unlocks.navi;
    const ext = navi ? D.boardExtension : 0;
    const evolutions = nextEvolutions(D, w).filter((e) => !e.sealed && (navi || !e.conditions.some((c) => c.kind === 'tendency')));
    if (evolutions.length === 0) {
      this.root.add(
        addText(this, SIDE_PADDING + 4, EVO_TOP + 30, 'この先の進化は、まだ見えない。\n（ツリーで、先に続く影と言い伝えを見られる）', { size: 12, color: COLORS.subText, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 8 }),
      );
      return;
    }
    evolutions.forEach((evo, i) => {
      const y = EVO_TOP + 22 + i * (EVO_H + 4);
      const x0 = SIDE_PADDING;
      const width = GAME_WIDTH - SIDE_PADDING * 2;
      const checks = evolutionChecks(D, w, evo, run.armory.items);
      const ok = checks.every((c) => c.ok);
      const rect = this.add.rectangle(x0, y, width, EVO_H, COLORS.panel).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(ok ? 2 : 1, ok ? COLORS.accent : COLORS.border);
      this.root.add(rect);
      this.root.add(addText(this, x0 + 10, y + 6, evo.name, { size: 15, bold: true }));
      if (evo.detour) this.root.add(addText(this, x0 + 16 + evo.name.length * 15, y + 9, '寄り道', { size: 10, bold: true, color: '#ffb070' }));
      this.root.add(addText(this, x0 + 10, y + 27, describeEvolution(evo), { size: 10, wrap: width - 120 }));
      const line = checks.map((c) => `${c.ok ? '✓' : '✗'}${describeCondition(c.condition, D)}`).join('　');
      this.root.add(addText(this, x0 + 10, y + EVO_H - 20, line, { size: 11, bold: true, color: ok ? '#6dff9e' : COLORS.subText }));
      makePressable(rect, {
        onLongPress: () =>
          this.showDetail(
            evo.name,
            [
              describeEvolution(evo),
              '',
              '型（進化する時にどちらか1つ）：',
              ...(evo.styles ?? []).map((st) => `・${describeStyle(st, ext)}`),
              '',
              '条件：',
              ...checks.map((c) => `${c.ok ? '✓' : '✗'} ${describeCondition(c.condition, D)}`),
              // 鍵の素材の手に入れ方（狩りの目的。段階27b）
              ...evo.conditions.flatMap((c) =>
                c.kind === 'key' ? ['', `鍵「${D.items[c.item]?.name ?? c.item}」（持っている：${run.armory.items[c.item] ?? 0}。進化すると1つ使う）`, `手に入れ方：${itemSources(c.item).join('、') || '―'}`] : [],
              ),
              ...(evo.conditions.some((c) => c.kind === 'tendency') ? ['', '傾向：勝った戦闘で、このキャラのムーブメントにはめていたギアの色のうち、いちばん多い色'] : []),
              ...(evo.detour ? ['', '寄り道：短い枝。この先へは進化しない'] : []),
            ].join('\n'),
          ),
      });
      if (ok) {
        addButton(this, this.root, x0 + width - 52, y + EVO_H / 2, 88, 44, '進化', { onTap: () => this.confirmEvolve(evo) }, {
          fill: 0x5a4a10,
          stroke: COLORS.accent,
          strokeWidth: 2,
          size: 15,
          bold: true,
          textColor: COLORS.accentText,
        });
      }
    });
  }

  /** 一番近い進化先で、条件の能力値がまだ足りない時だけ、その進化先（段階100） */
  private nearLack(): ReturnType<typeof nearestEvolution> {
    const w = this.weapon();
    const near = nearestEvolution(D, run.armory, this.charId);
    return near && near.evolution.conditions.some((c) => c.kind === 'param' && w.params[c.param] < c.min) ? near : null;
  }

  /** 下の段：「素材」（吸わせる・時分解）と「記憶の欠片」（吸わせる。枠を使わない）の2つのタブ（段階27b） */
  private drawInventory(): void {
    // ポーチの消費アイテム（段階51）は素材の一覧に出さない（吸わせられず、時分解もできない）
    const itemTotal = Object.entries(run.armory.items).reduce((a, [id, n]) => a + (D.items[id]?.kind === 'material' ? n : 0), 0);
    const fragTotal = Object.values(run.armory.fragments).reduce((a, n) => a + n, 0);
    // タブは左に寄せ、右に素材の絞り込み（攻・火・氷・雷。段階72）を並べる
    const tabW = 96;
    (['items', 'fragments'] as const).forEach((tab, i) => {
      const active = this.tab === tab;
      const label = tab === 'items' ? `素材（${itemTotal}）` : `欠片（${fragTotal}）`;
      addButton(
        this,
        this.root,
        SIDE_PADDING + tabW / 2 + i * (tabW + 6),
        FRAG_TOP + 15,
        tabW,
        30,
        label,
        {
          onTap: () => {
            this.tab = tab;
            this.selected = null;
            this.page = 0;
            this.message = '';
            this.render();
          },
        },
        { fill: active ? COLORS.panelLight : COLORS.panel, stroke: active ? 0xffffff : COLORS.border, strokeWidth: active ? 2 : 1, size: 12, bold: active },
      );
    });

    const isItems = this.tab === 'items';
    if (isItems) {
      const chipW = 38;
      const chipX = SIDE_PADDING + tabW * 2 + 6 + 8;
      (['atk', 'fire', 'ice', 'thunder'] as const).forEach((k, i) => {
        const on = this.filter === k;
        addButton(this, this.root, chipX + chipW / 2 + i * (chipW + 4), FRAG_TOP + 15, chipW, 30, PARAM_SHORT[k], {
          onTap: () => {
            this.filter = on ? null : k;
            this.selected = null;
            this.page = 0;
            this.message = '';
            this.render();
          },
        }, { fill: on ? PARAM_COLOR[k] : COLORS.panel, stroke: PARAM_COLOR[k], strokeWidth: on ? 2 : 1, size: 13, bold: true });
      });
    }
    // 素材は持っているものだけ（多い時はページを切り替える）。記憶の欠片は4種類とも出す
    // 絞り込み（段階72）：その能力値を上げる素材だけを、上げ幅の大きい順（同じなら数の多い順）に
    const filter = isItems ? this.filter : null;
    const owned = isItems ? Object.keys(ITEMS).filter((id) => D.items[id]?.kind === 'material' && (run.armory.items[id] ?? 0) > 0) : Object.keys(FRAGMENTS);
    const ids = filter
      ? owned
          .filter((id) => (D.items[id].gains[filter] ?? 0) > 0)
          .sort((a, b) => (D.items[b].gains[filter] ?? 0) - (D.items[a].gains[filter] ?? 0) || (run.armory.items[b] ?? 0) - (run.armory.items[a] ?? 0))
      : owned;
    // おすすめ（段階100。選び方は core/recommend.ts）：一番近い進化先に近づく素材に★、一番よいものは金の枠。
    // これから使う進化の鍵の素材（誰の武器でも）は勧めない。絞り込んでいない時は、★の素材を先頭に並べる
    // 進化先の能力値が足りない時の★は、その能力値を上げる素材だけ（上がる合計だけで勧めた素材には付けない）
    const near = this.nearLack();
    const recList = (isItems ? recommendMaterials(D, run.armory, this.charId, undefined, upcomingKeys(D, run.armory)) : []).filter(
      (id) => !near || near.params.some((k) => (D.items[id].gains[k] ?? 0) > 0),
    );
    const recommended = new Set(recList);
    const rank = (id: string): number => (recommended.has(id) ? recList.indexOf(id) : recList.length);
    if (!filter) ids.sort((a, b) => rank(a) - rank(b));
    const cols = 4;
    const rows = 3;
    const perPage = cols * rows;
    const pages = Math.max(1, Math.ceil(ids.length / perPage));
    if (this.page >= pages) this.page = 0;
    const gap = 5;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (cols - 1)) / cols;
    const h = 46;
    if (isItems && ids.length === 0) {
      const none = filter ? `${PARAM_LABEL[filter]}を上げる素材を持っていない。もう一度押すと全部に戻る` : '素材を持っていない。砂嵐を倒すと落とす';
      this.root.add(addText(this, SIDE_PADDING + 4, FRAG_TOP + 44, none, { size: 12, color: COLORS.subText }));
    }
    ids.slice(this.page * perPage, (this.page + 1) * perPage).forEach((id, i) => {
      const n = (isItems ? run.armory.items[id] : run.armory.fragments[id]) ?? 0;
      const it = isItems ? D.items[id] : undefined;
      const gains = it ? it.gains : D.fragments[id].gains;
      const color = it?.rarity === 'rare' ? 0xffd84a : it?.rarity === 'uncommon' ? 0x6dd0ff : it?.rarity === 'part' || it?.rarity === 'boss' ? 0xc58bff : gainColor(gains);
      const name = it ? it.name : D.fragments[id].name;
      const x = SIDE_PADDING + (i % cols) * (w + gap);
      const y = FRAG_TOP + 36 + Math.floor(i / cols) * (h + gap);
      const selected = this.selected === id;
      this.itemSpots.set(id, { x: x + w / 2, y: y + h / 2, color });
      const rect = this.add.rectangle(x, y, w, h, n > 0 ? COLORS.panelLight : COLORS.panel).setRounded(8).setOrigin(0);
      const best = recList[0] === id;
      rect.setStrokeStyle(selected ? 3 : best || it?.rarity === 'rare' ? 2 : 1, selected ? COLORS.select : best ? COLORS.accent : n > 0 ? color : COLORS.border);
      this.root.add(rect);
      const alpha = n > 0 ? 1 : 0.3;
      if (!it) this.root.add(this.add.star(x + 10, y + 10, 4, 3.5, 8, color, alpha));
      else if (it.kind === 'material') this.root.add(this.add.circle(x + 10, y + 10, 6, color, alpha));
      else this.root.add(this.add.rectangle(x + 4, y + 4, 11, 11, color, alpha).setOrigin(0).setStrokeStyle(1, 0xffffff, alpha));
      if (recommended.has(id)) this.root.add(addText(this, x + 20, y + 2, '★', { size: 11, bold: true, color: COLORS.accentText }));
      // この武器の進化の鍵になる素材（吸わせると鍵が減る）
      if (keyItems(this.weapon()).has(id)) this.root.add(addText(this, x + (recommended.has(id) ? 34 : 20), y + 3, '鍵', { size: 10, bold: true, color: '#ffb070' }));
      this.root.add(addText(this, x + w - 4, y + 2, `×${n}`, { size: 12, bold: true, color: n > 0 ? COLORS.text : COLORS.dimText }).setOrigin(1, 0));
      this.root.add(addText(this, x + 4, y + 18, name, { size: 10, bold: true, color: n > 0 ? COLORS.text : COLORS.dimText }));
      const sub = it ? (it.kind === 'material' ? describeGains(it.gains, true) : 'アイテム') : describeFragment(D.fragments[id]);
      if (filter && it) {
        // 絞り込んでいる能力値の上げ幅を、その色で先に出す（段階72）
        const rest = describeGains(Object.fromEntries(Object.entries(it.gains).filter(([k]) => k !== filter)), true);
        const head = addText(this, x + 4, y + 30, `${PARAM_SHORT[filter]}+${it.gains[filter]}`, { size: 11, bold: true, color: toCss(PARAM_COLOR[filter]) });
        this.root.add(head);
        this.root.add(addText(this, x + 8 + head.width, y + 31, rest, { size: 10, color: COLORS.subText }));
      } else this.root.add(addText(this, x + 4, y + 31, sub, { size: 10, color: COLORS.subText, wrap: w - 6 }));
      makePressable(rect, {
        onTap: () => {
          this.selected = selected ? null : id;
          this.message = '';
          this.render();
        },
        onLongPress: () => (it ? this.showDetail(it.name, itemDetail(id)) : this.showDetail(D.fragments[id].name, fragmentDetail(id))),
      });
    });
    if (pages > 1) {
      addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - 40, FRAG_TOP + 36 + rows * (h + gap) + 12, 80, 26, `次へ ${this.page + 1}/${pages}`, {
        onTap: () => {
          this.page = (this.page + 1) % pages;
          this.render();
        },
      }, { size: 11 });
    }

    // 選んだもののプレビューとボタン
    const sel = this.selected;
    const weapon = this.weapon();
    const top = FRAG_TOP + 36 + rows * (h + gap) + (pages > 1 ? 28 : 4);
    let text = this.message;
    if (!text) {
      if (!sel) text = isItems ? '素材を選ぶと、吸わせた時の変化が出る。★は進化先に近づく素材。攻・火・氷・雷で絞れる' : '記憶の欠片を選んで「吸わせる」。枠を使わず +1（時分解でできる）';
      else if (isItems) {
        const it = D.items[sel];
        if (it.kind !== 'material') text = `${it.name}：吸わせられない（${describeDecompose(D, it)}）`;
        else {
          const after = paramsAfter(weapon.params, it.gains);
          const diff = (Object.keys(after) as WeaponParamKey[]).filter((k) => after[k] !== weapon.params[k]).map((k) => `${PARAM_LABEL[k]} ${weapon.params[k]}→${after[k]}`);
          text = `${it.name}：${diff.join('、') || '変化なし'}（枠 ${weapon.absorbed}→${weapon.absorbed + 1}/${weaponSlots(D, weapon)}）${keyItems(weapon).has(sel) ? '。進化の鍵にもなる素材' : ''}`;
        }
      } else text = `${weaponName(D, weapon)}に記憶の欠片（${D.fragments[sel].name}）を吸わせる（${describeFragment(D.fragments[sel])}。枠は使わない）`;
    }
    const btnW = 92;
    this.root.add(addText(this, SIDE_PADDING + 2, top, text, { size: 11, wrap: GAME_WIDTH - SIDE_PADDING * 2 - (isItems ? btnW * 2 + 12 : btnW + 8) }));
    if (isItems) {
      const absorbErr = sel ? getAbsorbError(D, run.armory, this.charId, sel) : 'none';
      const fragErr = sel ? getFragmentError(D, run.armory, sel) : 'none';
      addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - btnW * 1.5 - 6, top + 22, btnW, 44, '吸わせる', { onTap: () => this.absorb() }, {
        enabled: !absorbErr,
        fill: 0x2f6b3f,
        stroke: 0x6dff9e,
        size: 14,
        bold: true,
      });
      addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - btnW / 2, top + 22, btnW, 44, '時分解', { onTap: () => this.fragment() }, {
        enabled: !fragErr,
        fill: 0x3a2a5a,
        stroke: 0xc58bff,
        size: 14,
        bold: true,
      });
    } else {
      const err = sel ? getFeedError(D, run.armory, this.charId, sel) : 'none';
      addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - btnW / 2, top + 22, btnW, 44, '吸わせる', { onTap: () => this.feed() }, {
        enabled: !err,
        fill: 0x2f6b3f,
        stroke: 0x6dff9e,
        size: 14,
        bold: true,
      });
    }
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
    const panel = addWindow(this, 20, y, w, h);
    const titleText = addText(this, 36, y + 14, title, { size: 17, bold: true, color: COLORS.accentText });
    text.setPosition(36, y + 44);
    const hint = addText(this, GAME_WIDTH / 2, y + h - 16, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([panel, titleText, text, hint]);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    this.overlay = c;
    popIn(this, c);
  }
}

/** 記憶の欠片の効果の中で一番大きい属性の色（属性がなければ灰色） */
function gainColor(gains: Partial<Record<WeaponParamKey, number>>): number {
  const els = (['fire', 'ice', 'thunder'] as const).filter((k) => (gains[k] ?? 0) > 0).sort((a, b) => (gains[b] ?? 0) - (gains[a] ?? 0));
  if (els.length === 0) return 0xb0b8c0;
  if (els.length === 3 && gains.fire === gains.ice && gains.ice === gains.thunder) return 0xc58bff;
  return PARAM_COLOR[els[0]];
}

/**
 * おすすめの素材（★）：まだ進化していなければ、能力値の条件に一番近い進化先を選び、その足りない能力値を上げて、
 * 条件の能力値を下げない素材（段階27b）
 */
/** その武器の、これから先の進化の鍵になる素材（段階42：次の進化先だけでなく、今の武器から行ける先の全部） */
function keyItems(w: WeaponState): Set<string> {
  const ahead = D.weapons[w.defId].evolutions.filter((e) => !['passed', 'unreachable'].includes(evolutionVisibility(D, w, e.id)));
  return new Set(ahead.flatMap((e) => e.conditions.flatMap((c) => (c.kind === 'key' ? [c.item] : []))));
}

function itemDetail(itemId: string): string {
  const it = D.items[itemId];
  return [
    it.kind === 'material' ? `素材（${RARITY_LABEL[it.rarity ?? 'common']}）` : 'ポーチの消費アイテム（戦闘の「その他」から使う）',
    it.kind === 'material' ? `吸わせると：${describeGains(it.gains)}（吸わせ枠を1つ使う）` : '',
    `時分解すると：${describeDecompose(D, it)}`,
    '',
    `手に入れ方：${itemSources(itemId).join('、') || '―'}`,
  ]
    .filter((l, i) => l !== '' || i === 3)
    .join('\n');
}

function fragmentDetail(fragmentId: string): string {
  return [
    '記憶の欠片。記憶に宿る感情ごとに種類が分かれる',
    `1つにつき：${describeFragment(D.fragments[fragmentId])}（吸わせ枠を使わない）`,
    '',
    `要らない素材・アイテムを${D.decomposeCost}つ時分解すると1つできる（その素材が一番大きく上げる能力値の欠片）`,
  ].join('\n');
}
