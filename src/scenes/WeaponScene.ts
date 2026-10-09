import Phaser from 'phaser';
import type { EvolutionDef, PartColor, WeaponParamKey, WeaponState } from '../core';
import {
  absorbMaterial,
  canEvolveAny,
  evolutionChecks,
  evolveWeapon,
  feedFragment,
  fragmentItem,
  getAbsorbError,
  getEvolveError,
  getFeedError,
  getFragmentError,
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
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, RENDER_SCALE, toCss } from '../ui/theme';
import { describeCondition, describeDecompose, describeEvolution, describeFragment, describeGains, PARAM_LABEL, RARITY_LABEL } from '../ui/weaponText';
import { addBar, addButton, addText, makePressable } from '../ui/widgets';
import { maybeShowTip } from '../ui/tipPanel';
import { getHubReturn, hubLineup, lineupBase, run, saveRun, setHubReturn } from './run';
import { addWindow, ensureSandTexture, enterScreen, fadeOutAndDestroy, popIn, screenBg, sparkAt } from '../ui/skin';
import { addIcon } from '../ui/icons';

// 武器の画面（段階9）。縦持ち 390×844 に、武器・進化先・記憶の欠片を1画面で収める
//
// 記憶の欠片をタップで選び「吸わせる」。Lv3 で条件を全部満たした進化先に「進化」ボタンが出る（確認してから進化）

const D = WEAPON_DATA;
const PARAM_KEYS: WeaponParamKey[] = ['atk', 'fire', 'ice', 'thunder'];
const PARAM_COLOR: Record<WeaponParamKey, number> = { atk: ELEMENT_COLOR.physical, fire: ELEMENT_COLOR.fire, ice: ELEMENT_COLOR.ice, thunder: ELEMENT_COLOR.thunder };

const CARD_TOP = 92;
const EVO_TOP = 234;
const EVO_H = 84;
const FRAG_TOP = 518;

export class WeaponScene extends Phaser.Scene {
  private charId = 'hero';
  /** 下の段のタブ */
  private tab: 'items' | 'fragments' = 'items';
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

  private confirmEvolve(evo: EvolutionDef): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0).setInteractive());
    const top = 270;
    c.add(addWindow(this, 20, top, GAME_WIDTH - 40, 250));
    c.add(addText(this, GAME_WIDTH / 2, top + 18, `${evo.name}に進化する？`, { size: 18, bold: true, color: COLORS.accentText }).setOrigin(0.5, 0));
    c.add(
      addText(this, 40, top + 56, `${describeEvolution(evo, hubLineup().unlocks.navi ? D.boardExtension : 0)}\n\n進化は1回だけ。戻せない`, { size: 13, wrap: GAME_WIDTH - 80 }),
    );
    const w = (GAME_WIDTH - 40 - 36) / 2;
    addButton(this, c, 32 + w / 2, top + 210, w, 52, 'やめる', { onTap: () => this.closeOverlay() }, { size: 15 });
    addButton(this, c, GAME_WIDTH - 32 - w / 2, top + 210, w, 52, '進化する', { onTap: () => this.evolve(evo) }, {
      fill: 0x5a4a10,
      stroke: COLORS.accent,
      strokeWidth: 2,
      size: 16,
      bold: true,
    });
    this.overlay = c;
    popIn(this, c);
  }

  private evolve(evo: EvolutionDef): void {
    this.closeOverlay();
    if (getEvolveError(D, run.armory, this.charId, evo.id)) return;
    const before = weaponName(D, this.weapon());
    run.armory = evolveWeapon(D, run.armory, this.charId, evo.id);
    console.log('[weapon] evolve', this.charId, evo.id);
    this.message = `${before}が${evo.name}に進化した！`;
    this.render();
    this.playEvolution(before, evo.name);
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
      addText(this, GAME_WIDTH - SIDE_PADDING, 12, `Lv${D.evolveLevel}で条件を満たすと進化`, { size: 11, color: COLORS.accentText }).setOrigin(1, 0),
    );
    this.drawTabs();
    this.drawWeapon();
    this.drawEvolutions();
    this.drawInventory();
    // 星図が閉じている時は、探索へ直接戻る（段階26）
    const back = hubLineup().unlocks.growth ? null : getHubReturn();
    const leave = () => {
      if (!back) {
        this.scene.start('Growth');
        return;
      }
      setHubReturn(null);
      this.scene.start(back.key, back.data);
    };
    addButton(this, this.root, GAME_WIDTH / 2, 800, GAME_WIDTH - SIDE_PADDING * 2, 52, back ? '探索へ戻る' : '星図へ戻る', { onTap: leave }, {
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
        addText(this, x + 8, top + 26, ready ? '進化できる！' : `Lv${weaponLevel(D, ws.exp)}${ws.evolvedTo ? '・進化済み' : ''}`, {
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
    this.root.add(this.add.rectangle(x0, CARD_TOP, width, 136, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(w.evolvedTo ? 2 : 1, w.evolvedTo ? COLORS.accent : COLORS.border));
    this.root.add(addText(this, x0 + 10, CARD_TOP + 8, weaponName(D, w), { size: 18, bold: true, color: w.evolvedTo ? COLORS.accentText : COLORS.text }));
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

  /** 進化先の3つ。条件を ✓／✗ で見せ、全部 ✓ なら「進化」 */
  private drawEvolutions(): void {
    const w = this.weapon();
    const def = D.weapons[w.defId];
    this.root.add(addText(this, SIDE_PADDING, EVO_TOP - 4, '進化先（長押しで詳細）', { size: 11, color: COLORS.subText }));
    // ムーブメントが閉じている間は、ギアの傾向が条件の進化先と、ブリッジが伸びる話を出さない（段階26）
    const navi = hubLineup().unlocks.navi;
    const ext = navi ? D.boardExtension : 0;
    const evolutions = def.evolutions.filter((e) => navi || w.evolvedTo === e.id || !e.conditions.some((c) => c.kind === 'tendency'));
    evolutions.forEach((evo, i) => {
      const y = EVO_TOP + 14 + i * (EVO_H + 4);
      const x0 = SIDE_PADDING;
      const width = GAME_WIDTH - SIDE_PADDING * 2;
      const chosen = w.evolvedTo === evo.id;
      const locked = !!w.evolvedTo && !chosen;
      const checks = evolutionChecks(D, w, evo, run.armory.items);
      const ok = !w.evolvedTo && checks.every((c) => c.ok);
      const rect = this.add.rectangle(x0, y, width, EVO_H, chosen ? 0x3a3214 : COLORS.panel, locked ? 0.5 : 1).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(chosen || ok ? 2 : 1, chosen || ok ? COLORS.accent : COLORS.border);
      this.root.add(rect);
      this.root.add(
        addText(this, x0 + 10, y + 6, `${chosen ? '★ ' : ''}${evo.name}`, { size: 15, bold: true, color: locked ? COLORS.dimText : chosen ? COLORS.accentText : COLORS.text }),
      );
      this.root.add(addText(this, x0 + 10, y + 28, describeEvolution(evo, ext), { size: 10, wrap: width - 120, color: locked ? COLORS.dimText : COLORS.text }));
      if (!w.evolvedTo) {
        const line = checks.map((c) => `${c.ok ? '✓' : '✗'}${describeCondition(c.condition, D)}`).join('　');
        this.root.add(addText(this, x0 + 10, y + EVO_H - 20, line, { size: 11, bold: true, color: ok ? '#6dff9e' : COLORS.subText }));
      }
      makePressable(rect, {
        onLongPress: () =>
          this.showDetail(
            evo.name,
            [
              describeEvolution(evo, ext),
              '',
              '条件：',
              ...checks.map((c) => `${c.ok ? '✓' : '✗'} ${describeCondition(c.condition, D)}`),
              // 鍵の素材の手に入れ方（狩りの目的。段階27b）
              ...evo.conditions.flatMap((c) =>
                c.kind === 'key' ? ['', `鍵「${D.items[c.item]?.name ?? c.item}」（持っている：${run.armory.items[c.item] ?? 0}。進化すると1つ使う）`, `手に入れ方：${itemSources(c.item).join('、') || '―'}`] : [],
              ),
              ...(evo.conditions.some((c) => c.kind === 'tendency') ? ['', '傾向：勝った戦闘で、このキャラのムーブメントにはめていたギアの色のうち、いちばん多い色'] : []),
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
      } else if (chosen) {
        this.root.add(addText(this, x0 + width - 52, y + EVO_H / 2, '進化済み', { size: 12, bold: true, color: COLORS.accentText }).setOrigin(0.5));
      }
    });
  }

  /** 下の段：「素材」（吸わせる・時分解）と「記憶の欠片」（吸わせる。枠を使わない）の2つのタブ（段階27b） */
  private drawInventory(): void {
    const itemTotal = Object.values(run.armory.items).reduce((a, n) => a + n, 0);
    const fragTotal = Object.values(run.armory.fragments).reduce((a, n) => a + n, 0);
    const tabW = (GAME_WIDTH - SIDE_PADDING * 2 - 6) / 2;
    (['items', 'fragments'] as const).forEach((tab, i) => {
      const active = this.tab === tab;
      const label = tab === 'items' ? `素材（${itemTotal}）` : `記憶の欠片（${fragTotal}）`;
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
    // 素材は持っているものだけ（多い時はページを切り替える）。記憶の欠片は4種類とも出す
    const ids = isItems ? Object.keys(ITEMS).filter((id) => (run.armory.items[id] ?? 0) > 0) : Object.keys(FRAGMENTS);
    const recommended = isItems ? recommendedItems(this.weapon()) : new Set<string>();
    const cols = 4;
    const rows = 3;
    const perPage = cols * rows;
    const pages = Math.max(1, Math.ceil(ids.length / perPage));
    if (this.page >= pages) this.page = 0;
    const gap = 5;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (cols - 1)) / cols;
    const h = 46;
    if (isItems && ids.length === 0) {
      this.root.add(addText(this, SIDE_PADDING + 4, FRAG_TOP + 44, '素材を持っていない。砂嵐を倒すと落とす', { size: 12, color: COLORS.subText }));
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
      rect.setStrokeStyle(selected ? 3 : it?.rarity === 'rare' ? 2 : 1, selected ? COLORS.select : n > 0 ? color : COLORS.border);
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
      this.root.add(addText(this, x + 4, y + 31, sub, { size: 10, color: COLORS.subText, wrap: w - 6 }));
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
      if (!sel) text = isItems ? '素材を選ぶと、吸わせた時の変化が出る。★は進化先に近づく素材。長押しで詳細' : '記憶の欠片を選んで「吸わせる」。枠を使わず +1（時分解でできる）';
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
function recommendedItems(w: WeaponState): Set<string> {
  const out = new Set<string>();
  if (w.evolvedTo) return out;
  let best: { lack: number; params: WeaponParamKey[] } | null = null;
  for (const evo of D.weapons[w.defId].evolutions) {
    const conds = evo.conditions.filter((c) => c.kind === 'param');
    if (conds.length === 0) continue;
    const lack = conds.reduce((sum, c) => sum + Math.max(0, c.min - w.params[c.param]), 0);
    if (lack === 0) continue;
    if (!best || lack < best.lack) best = { lack, params: conds.map((c) => c.param) };
  }
  if (!best) return out;
  for (const it of Object.values(D.items)) {
    if (it.kind !== 'material' || (run.armory.items[it.id] ?? 0) <= 0) continue;
    const helps = best.params.some((k) => (it.gains[k] ?? 0) > 0);
    const hurts = best.params.some((k) => (it.gains[k] ?? 0) < 0);
    if (helps && !hurts) out.add(it.id);
  }
  return out;
}

/** その武器の、まだしていない進化の鍵になる素材 */
function keyItems(w: WeaponState): Set<string> {
  if (w.evolvedTo) return new Set();
  return new Set(D.weapons[w.defId].evolutions.flatMap((e) => e.conditions.flatMap((c) => (c.kind === 'key' ? [c.item] : []))));
}

function itemDetail(itemId: string): string {
  const it = D.items[itemId];
  return [
    it.kind === 'material' ? `素材（${RARITY_LABEL[it.rarity ?? 'common']}）` : '通常アイテム（今は戦闘で使えない。時分解して記憶の欠片にする）',
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
