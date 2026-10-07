import Phaser from 'phaser';
import type { EvolutionDef, PartColor, WeaponParamKey, WeaponState } from '../core';
import { canEvolveAny, evolutionChecks, evolveWeapon, feedFragment, fragmentItem, getEvolveError, getFeedError, getFragmentError, tendencyOf, weaponLevel, weaponName } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ARMOR_DOG, CAMPAIGN, FROST_BAT, FRAGMENTS, ITEMS, PARTY, SLIME, WEAPON_DATA } from '../data';
import { SIDE_PADDING } from '../ui/layout';
import { PART_COLOR_LABEL } from '../ui/naviText';
import { PART_COLOR } from '../ui/naviViews';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, RENDER_SCALE, toCss } from '../ui/theme';
import { describeCondition, describeEvolution, describeFragment, describeItemFragments, itemGains, PARAM_LABEL } from '../ui/weaponText';
import { addBar, addButton, addText, makePressable } from '../ui/widgets';
import { run } from './run';

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
  /** 選んでいる素材・アイテム、または記憶の欠片 */
  private selected: string | null = null;
  private message = '';
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Weapon');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.selected = null;
    this.message = '';
    this.render();
  }

  /** デバッグメニューから記憶の欠片や経験値が変わった時に描き直す */
  refresh(): void {
    if (this.scene.isActive()) this.render();
  }

  private weapon(): WeaponState {
    return run.armory.weapons[this.charId];
  }

  // ---- 操作 ----

  private fragment(): void {
    const id = this.selected;
    if (!id || getFragmentError(D, run.armory, id)) return;
    const it = D.items[id];
    run.armory = fragmentItem(D, run.armory, id);
    this.message = `${it.name}を時分解した → 記憶の欠片（${describeItemFragments(D, it)}）（「記憶の欠片」のタブで吸わせる）`;
    console.log('[weapon] fragment', id, JSON.stringify(run.armory.fragments));
    if ((run.armory.items[id] ?? 0) <= 0) this.selected = null;
    this.render();
  }

  private feed(): void {
    const id = this.selected;
    if (!id || getFeedError(D, run.armory, this.charId, id)) return;
    const before = weaponName(D, this.weapon());
    run.armory = feedFragment(D, run.armory, this.charId, id);
    this.message = `${before}に記憶の欠片（${D.fragments[id].name}）を吸わせた（${describeFragment(D.fragments[id])}）`;
    console.log('[weapon] feed', this.charId, id, JSON.stringify(this.weapon().params));
    if ((run.armory.fragments[id] ?? 0) <= 0) this.selected = null;
    this.render();
  }

  private confirmEvolve(evo: EvolutionDef): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0).setInteractive());
    const top = 270;
    c.add(this.add.rectangle(20, top, GAME_WIDTH - 40, 250, COLORS.panel).setOrigin(0).setStrokeStyle(2, COLORS.accent));
    c.add(addText(this, GAME_WIDTH / 2, top + 18, `${evo.name}に進化する？`, { size: 18, bold: true, color: COLORS.accentText }).setOrigin(0.5, 0));
    c.add(
      addText(this, 40, top + 56, `${describeEvolution(evo, D.boardExtension)}\n\n進化は1回だけ。戻せない`, { size: 13, wrap: GAME_WIDTH - 80 }),
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
    const close = () => c.destroy(true);
    this.time.delayedCall(2200, close);
    makePressable(shade, { onTap: close });
  }

  // ---- 描画 ----

  private render(): void {
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0));
    this.root.add(addText(this, SIDE_PADDING, 8, '武器', { size: 17, bold: true }));
    this.root.add(
      addText(this, GAME_WIDTH - SIDE_PADDING, 12, `Lv${D.evolveLevel}で条件を満たすと進化`, { size: 11, color: COLORS.accentText }).setOrigin(1, 0),
    );
    this.drawTabs();
    this.drawWeapon();
    this.drawEvolutions();
    this.drawInventory();
    addButton(this, this.root, GAME_WIDTH / 2, 800, GAME_WIDTH - SIDE_PADDING * 2, 52, '星図へ戻る', { onTap: () => this.scene.start('Growth') }, {
      size: 16,
      bold: true,
    });
  }

  private drawTabs(): void {
    const top = 36;
    const n = PARTY.length;
    const gap = 6;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
    PARTY.forEach((c, i) => {
      const x = SIDE_PADDING + i * (w + gap);
      const active = c.id === this.charId;
      const ws = run.armory.weapons[c.id];
      const rect = this.add.rectangle(x, top, w, 46, active ? COLORS.panelLight : COLORS.panel).setOrigin(0);
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
    const owner = PARTY.find((c) => c.id === this.charId)!;
    const x0 = SIDE_PADDING;
    const width = GAME_WIDTH - SIDE_PADDING * 2;
    this.root.add(this.add.rectangle(x0, CARD_TOP, width, 136, COLORS.panel).setOrigin(0).setStrokeStyle(w.evolvedTo ? 2 : 1, w.evolvedTo ? COLORS.accent : COLORS.border));
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
      this.root.add(this.add.rectangle(x, y, cw - 6, 36, COLORS.panelLight).setOrigin(0).setStrokeStyle(1, PARAM_COLOR[k]));
      this.root.add(addText(this, x + 6, y + 3, PARAM_LABEL[k], { size: 10, color: toCss(PARAM_COLOR[k]) }));
      const v = w.params[k];
      const extra = k === 'atk' ? '' : v > 0 ? ` +${Math.round(v * D.elementRate * 100)}%` : '';
      this.root.add(addText(this, x + 6, y + 16, `${v}${extra}`, { size: 14, bold: true }));
    });

    // 傾向
    const t = tendencyOf(w);
    const totals = (Object.entries(w.tendency) as [PartColor, number][]).filter(([, n]) => n > 0);
    this.root.add(
      addText(this, x0 + 10, CARD_TOP + 110, `ギアの傾向：${t ? PART_COLOR_LABEL[t] : 'なし'}`, { size: 12, bold: true, color: t ? toCss(PART_COLOR[t]) : COLORS.subText }),
    );
    this.root.add(
      addText(
        this,
        x0 + 140,
        CARD_TOP + 112,
        totals.length > 0 ? totals.map(([c, n]) => `${PART_COLOR_LABEL[c]}${n}`).join(' ') : '（勝つたびに、ムーブメントのギアの色が貯まる）',
        { size: 10, color: COLORS.subText },
      ),
    );
  }

  /** 進化先の3つ。条件を ✓／✗ で見せ、全部 ✓ なら「進化」 */
  private drawEvolutions(): void {
    const w = this.weapon();
    const def = D.weapons[w.defId];
    this.root.add(addText(this, SIDE_PADDING, EVO_TOP - 4, '進化先（長押しで詳細）', { size: 11, color: COLORS.subText }));
    def.evolutions.forEach((evo, i) => {
      const y = EVO_TOP + 14 + i * (EVO_H + 4);
      const x0 = SIDE_PADDING;
      const width = GAME_WIDTH - SIDE_PADDING * 2;
      const chosen = w.evolvedTo === evo.id;
      const locked = !!w.evolvedTo && !chosen;
      const checks = evolutionChecks(D, w, evo);
      const ok = !w.evolvedTo && checks.every((c) => c.ok);
      const rect = this.add.rectangle(x0, y, width, EVO_H, chosen ? 0x3a3214 : COLORS.panel, locked ? 0.5 : 1).setOrigin(0);
      rect.setStrokeStyle(chosen || ok ? 2 : 1, chosen || ok ? COLORS.accent : COLORS.border);
      this.root.add(rect);
      this.root.add(
        addText(this, x0 + 10, y + 6, `${chosen ? '★ ' : ''}${evo.name}`, { size: 15, bold: true, color: locked ? COLORS.dimText : chosen ? COLORS.accentText : COLORS.text }),
      );
      this.root.add(addText(this, x0 + 10, y + 28, describeEvolution(evo, D.boardExtension), { size: 10, wrap: width - 120, color: locked ? COLORS.dimText : COLORS.text }));
      if (!w.evolvedTo) {
        const line = checks.map((c) => `${c.ok ? '✓' : '✗'}${describeCondition(c.condition)}`).join('　');
        this.root.add(addText(this, x0 + 10, y + EVO_H - 20, line, { size: 11, bold: true, color: ok ? '#6dff9e' : COLORS.subText }));
      }
      makePressable(rect, {
        onLongPress: () =>
          this.showDetail(
            evo.name,
            [
              describeEvolution(evo, D.boardExtension),
              '',
              '条件：',
              ...checks.map((c) => `${c.ok ? '✓' : '✗'} ${describeCondition(c.condition)}`),
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

  /** 下の段：「素材・アイテム」（時分解）と「記憶の欠片」（吸わせる）の2つのタブ */
  private drawInventory(): void {
    const itemTotal = Object.values(run.armory.items).reduce((a, n) => a + n, 0);
    const fragTotal = Object.values(run.armory.fragments).reduce((a, n) => a + n, 0);
    const tabW = (GAME_WIDTH - SIDE_PADDING * 2 - 6) / 2;
    (['items', 'fragments'] as const).forEach((tab, i) => {
      const active = this.tab === tab;
      const label = tab === 'items' ? `素材・アイテム（${itemTotal}）` : `記憶の欠片（${fragTotal}）`;
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
            this.message = '';
            this.render();
          },
        },
        { fill: active ? COLORS.panelLight : COLORS.panel, stroke: active ? 0xffffff : COLORS.border, strokeWidth: active ? 2 : 1, size: 12, bold: active },
      );
    });

    const isItems = this.tab === 'items';
    const ids = isItems ? Object.keys(ITEMS) : Object.keys(FRAGMENTS);
    const cols = 4;
    const gap = 6;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (cols - 1)) / cols;
    const h = 56;
    ids.forEach((id, i) => {
      const n = (isItems ? run.armory.items[id] : run.armory.fragments[id]) ?? 0;
      const gains = isItems ? itemGains(D, D.items[id]) : D.fragments[id].gains;
      const color = gainColor(gains);
      const name = isItems ? D.items[id].name : D.fragments[id].name;
      const x = SIDE_PADDING + (i % cols) * (w + gap);
      const y = FRAG_TOP + 38 + Math.floor(i / cols) * (h + gap);
      const selected = this.selected === id;
      const rect = this.add.rectangle(x, y, w, h, n > 0 ? COLORS.panelLight : COLORS.panel).setOrigin(0);
      rect.setStrokeStyle(selected ? 3 : 1, selected ? COLORS.select : n > 0 ? color : COLORS.border);
      this.root.add(rect);
      const alpha = n > 0 ? 1 : 0.3;
      if (!isItems) this.root.add(this.add.star(x + 12, y + 13, 4, 3.5, 8, color, alpha));
      else if (D.items[id].kind === 'material') this.root.add(this.add.circle(x + 12, y + 13, 7, color, alpha));
      else this.root.add(this.add.rectangle(x + 6, y + 7, 12, 12, color, alpha).setOrigin(0).setStrokeStyle(1, 0xffffff, alpha));
      this.root.add(addText(this, x + w - 6, y + 4, `×${n}`, { size: 14, bold: true, color: n > 0 ? COLORS.text : COLORS.dimText }).setOrigin(1, 0));
      this.root.add(addText(this, x + 5, y + 24, name, { size: 10, bold: true, color: n > 0 ? COLORS.text : COLORS.dimText }));
      const sub = isItems
        ? Object.entries(D.items[id].fragments).map(([f, k]) => `${D.fragments[f].name}${k}`).join(' ')
        : describeFragment(D.fragments[id]);
      this.root.add(addText(this, x + 5, y + 39, sub, { size: 8, color: COLORS.subText, wrap: w - 6 }));
      makePressable(rect, {
        onTap: () => {
          this.selected = selected ? null : id;
          this.message = '';
          this.render();
        },
        onLongPress: () => (isItems ? this.showDetail(D.items[id].name, itemDetail(id)) : this.showDetail(D.fragments[id].name, fragmentDetail(id))),
      });
    });

    const sel = this.selected;
    const err = sel ? (isItems ? getFragmentError(D, run.armory, sel) : getFeedError(D, run.armory, this.charId, sel)) : 'none';
    const weapon = weaponName(D, this.weapon());
    let text = this.message;
    if (!text) {
      if (!sel) text = isItems ? '素材・アイテムを選んで「時分解」。記憶の欠片は「記憶の欠片」のタブで武器に吸わせる' : '記憶の欠片を選んで「吸わせる」。どの武器に使うかは3人で取り合い';
      else if (err) text = `${isItems ? D.items[sel].name : `記憶の欠片（${D.fragments[sel].name}）`}を持っていない`;
      else if (isItems) {
        const it = D.items[sel];
        text = `${it.name}を時分解する → 記憶の欠片（${describeItemFragments(D, it)}）。戻せない`;
      } else text = `${weapon}に記憶の欠片（${D.fragments[sel].name}）を吸わせる（${describeFragment(D.fragments[sel])}）。戻せない`;
    }
    const top = FRAG_TOP + 38 + 2 * (h + gap) + 2;
    this.root.add(addText(this, SIDE_PADDING + 2, top, text, { size: 11, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 128 }));
    addButton(this, this.root, GAME_WIDTH - SIDE_PADDING - 58, top + 26, 112, 50, isItems ? '時分解' : '吸わせる', { onTap: () => (isItems ? this.fragment() : this.feed()) }, {
      enabled: !err,
      fill: isItems ? 0x3a2a5a : 0x2f6b3f,
      stroke: isItems ? 0xc58bff : 0x6dff9e,
      size: 15,
      bold: true,
    });
  }

  private closeOverlay(): void {
    this.overlay?.destroy(true);
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
    const panel = this.add.rectangle(20, y, w, h, COLORS.panel).setOrigin(0).setStrokeStyle(2, COLORS.accent);
    const titleText = addText(this, 36, y + 14, title, { size: 17, bold: true, color: COLORS.accentText });
    text.setPosition(36, y + 44);
    const hint = addText(this, GAME_WIDTH / 2, y + h - 16, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([panel, titleText, text, hint]);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    this.overlay = c;
  }
}

/** 記憶の欠片の効果の中で一番大きい属性の色（属性がなければ灰色） */
function gainColor(gains: Partial<Record<WeaponParamKey, number>>): number {
  const els = (['fire', 'ice', 'thunder'] as const).filter((k) => (gains[k] ?? 0) > 0).sort((a, b) => (gains[b] ?? 0) - (gains[a] ?? 0));
  if (els.length === 0) return 0xb0b8c0;
  if (els.length === 3 && gains.fire === gains.ice && gains.ice === gains.thunder) return 0xc58bff;
  return PARAM_COLOR[els[0]];
}

/** その素材・アイテムの手に入れ方 */
function itemSource(itemId: string): string {
  const enemies = [SLIME, FROST_BAT, ARMOR_DOG].filter((e) => e.drops?.includes(itemId)).map((e) => `${e.name}が落とす`);
  if (itemId === ITEMS.steelClaw.id) enemies.push('戦闘4の強化版の敵が落とす');
  const battles = CAMPAIGN.filter((b) => b.item === itemId).map((b) => b.name);
  if (battles.length > 0) enemies.push(`${battles.join('・')}の勝利でもらえる`);
  return enemies.length > 0 ? enemies.join('\n') : '―';
}

function itemDetail(itemId: string): string {
  const it = D.items[itemId];
  return [
    it.kind === 'material' ? '素材' : '通常アイテム（この試作では戦闘で使えない）',
    `時分解すると：記憶の欠片（${describeItemFragments(D, it)}）`,
    ...Object.keys(it.fragments).map((id) => `・${D.fragments[id].name}1つにつき：${describeFragment(D.fragments[id])}`),
    '',
    `手に入れ方：\n${itemSource(itemId)}`,
  ].join('\n');
}

function fragmentDetail(fragmentId: string): string {
  const sources = Object.values(D.items).filter((it) => (it.fragments[fragmentId] ?? 0) > 0).map((it) => it.name);
  return [
    '記憶の欠片。記憶に宿る感情ごとに種類が分かれる',
    `1つにつき：${describeFragment(D.fragments[fragmentId])}`,
    '',
    `時分解すると出る素材・アイテム：${sources.join('、') || '―'}`,
  ].join('\n');
}
