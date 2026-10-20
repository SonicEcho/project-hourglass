import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { ExchangeGood } from '../core';
import { addParts, eventPassed, exchange, exchangedKey, exchangeGoods, fragmentTotal, getExchangeError, isSeen, markSeen } from '../core';
import { BACKDROPS, BGM, EXCHANGE_GOODS, EXCHANGE_INTRO, EXCHANGE_KEEPER, FRAGMENTS, NAVI_PARTS, SE, SLICE_FLOW, WEAPON_DATA } from '../data';
import { playBgm, playSe } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { addWindow, enterScreen, popIn } from '../ui/skin';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import type { DialogueData } from './DialogueScene';
import { notePlayCount } from './playRecord';
import { run, saveRun, setStoryVars, storyLineup } from './run';

// 交換所（段階52。docs/design/economy.md の 5-2）：拠点の窓口で、記憶の欠片と品物を交換する。番人はペトラ（時間保管局の取引の窓口の係）。
// 初めて開いた時は、ペトラの会話（exchange_intro）を先に見る。日も昼の回数も使わない

const INTRO = EXCHANGE_INTRO.scene;
type Tab = 'pouch' | 'material' | 'gear';
const TABS: { id: Tab; label: string }[] = [
  { id: 'pouch', label: 'ポーチ' },
  { id: 'material', label: '素材' },
  { id: 'gear', label: 'ギア' },
];
const PER_PAGE = 7;
const FRAGMENT_ORDER = Object.keys(FRAGMENTS);

/** 品物の札 */
function tabOf(g: ExchangeGood): Tab {
  if (g.kind === 'gear') return 'gear';
  return WEAPON_DATA.items[g.ref]?.kind === 'item' ? 'pouch' : 'material';
}

function goodName(g: ExchangeGood): string {
  return g.kind === 'gear' ? (NAVI_PARTS[g.ref as keyof typeof NAVI_PARTS]?.name ?? g.ref) : (WEAPON_DATA.items[g.ref]?.name ?? g.ref);
}

/** 持てる数（ポーチの消費アイテムだけ） */
function maxOf(g: ExchangeGood): number | undefined {
  return g.kind === 'item' ? WEAPON_DATA.items[g.ref]?.max : undefined;
}

const ERROR_TEXT: Record<string, string> = {
  'already exchanged': 'この品物は、もう交換した（1回だけ）',
  'pouch is full': 'ポーチがいっぱい',
  'not enough fragments': '記憶の欠片が足りない（素材を時分解すると手に入る）',
};

export class ExchangeScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private tab: Tab = 'pouch';
  private page = 0;
  private message = '';

  constructor() {
    super('Exchange');
  }

  create(data: { seen?: string } = {}): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.overlay = undefined;
    if (data.seen) setStoryVars(markSeen(run.vars, data.seen));
    if (!isSeen(run.vars, INTRO)) {
      // カイに会う前なら、カイの話をしない会話（段階80）。どちらを見ても、見た印は INTRO
      const scene = eventPassed(SLICE_FLOW, run.event, EXCHANGE_INTRO.after) ? INTRO : EXCHANGE_INTRO.early;
      const talk: DialogueData = { scene, vars: run.vars, seed: run.seed, next: { key: 'Exchange', data: { seen: INTRO } }, onVars: (vars) => setStoryVars(vars) };
      this.scene.start('Dialogue', talk);
      return;
    }
    enterScreen(this);
    playBgm(this, BGM.library);
    this.tab = 'pouch';
    this.page = 0;
    this.message = `${EXCHANGE_KEEPER}「ご用の品をどうぞ。欠片は、どの種類でも一つは一つです」`;
    this.root = this.add.container(0, 0);
    this.render();
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  private goods(): ExchangeGood[] {
    return exchangeGoods(EXCHANGE_GOODS, { returned: run.returned, chapter: storyLineup().chapter }).filter((g) => g.kind !== 'gear' || storyLineup().unlocks.navi);
  }

  private render(): void {
    this.root.removeAll(true);
    const root = this.root;
    drawBackdrop(this, root, BACKDROPS.library, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0));
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, 96, 0x000000, 0.55).setOrigin(0));
    root.add(addText(this, GAME_WIDTH / 2, 28, `交換所　― ${EXCHANGE_KEEPER} ―`, { size: 20, bold: true }).setOrigin(0.5));
    const frags = FRAGMENT_ORDER.map((id) => `${FRAGMENTS[id as keyof typeof FRAGMENTS].name}${run.armory.fragments[id] ?? 0}`).join('・');
    root.add(addText(this, GAME_WIDTH / 2, 62, `記憶の欠片 ${fragmentTotal(run.armory.fragments)}（${frags}）`, { size: 12, color: COLORS.subText }).setOrigin(0.5));

    const all = this.goods();
    const tabs = TABS.filter((t) => all.some((g) => tabOf(g) === t.id));
    const tw = (GAME_WIDTH - 40 - 6 * (tabs.length - 1)) / Math.max(1, tabs.length);
    tabs.forEach((t, i) => {
      const active = this.tab === t.id;
      addButton(this, root, 20 + tw / 2 + i * (tw + 6), 124, tw, 40, t.label, {
        onTap: () => {
          this.tab = t.id;
          this.page = 0;
          this.render();
        },
      }, { size: 14, bold: active, fill: active ? COLORS.panelLight : COLORS.panel, stroke: active ? 0xffffff : COLORS.border, strokeWidth: active ? 2 : 1 });
    });

    const list = all.filter((g) => tabOf(g) === this.tab);
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    list.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE).forEach((g, i) => {
      const err = getExchangeError(g, run.armory, run.vars, maxOf(g));
      const have = g.kind === 'gear' ? '' : `　持っている ${run.armory.items[g.ref] ?? 0}${maxOf(g) !== undefined ? `/${maxOf(g)}` : ''}`;
      const note = g.once ? (run.vars[exchangedKey(g.id)] ? '　交換した' : '　1回だけ') : '';
      addButton(this, root, GAME_WIDTH / 2, 190 + i * 60, GAME_WIDTH - 40, 52, `${goodName(g)}　欠片 ${g.price}\n${have}${note}`.replace('\n　', '\n'), { onTap: () => this.confirm(g) }, {
        size: 13,
        fill: err ? COLORS.panel : 0x24384a,
        stroke: err ? COLORS.border : 0x6bc8ff,
        textColor: err ? COLORS.dimText : COLORS.text,
      });
    });
    if (pages > 1) {
      addButton(this, root, 80, 620, 110, 44, '前へ', { onTap: () => this.turn(-1) }, { size: 13, enabled: this.page > 0 });
      root.add(addText(this, GAME_WIDTH / 2, 620, `${this.page + 1}/${pages}`, { size: 13, color: COLORS.subText }).setOrigin(0.5));
      addButton(this, root, GAME_WIDTH - 80, 620, 110, 44, '次へ', { onTap: () => this.turn(1) }, { size: 13, enabled: this.page < pages - 1 });
    }
    // 台詞は絵の上でも読めるよう、暗い下地に（段階45）
    root.add(this.add.rectangle(GAME_WIDTH / 2, 690, GAME_WIDTH - 24, 60, 0x0b0f22, 0.85).setRounded(8).setStrokeStyle(1, COLORS.border));
    root.add(addText(this, GAME_WIDTH / 2, 690, this.message, { size: 13, align: 'center', wrap: GAME_WIDTH - 44 }).setOrigin(0.5));
    addButton(this, root, GAME_WIDTH / 2, 780, GAME_WIDTH - 60, 56, 'レストピアへ戻る', { onTap: () => this.scene.start('Hub', { seen: undefined }) }, { size: 17, bold: true });
  }

  private turn(d: number): void {
    this.page += d;
    this.render();
  }

  /** 交換するか確かめる窓 */
  private confirm(g: ExchangeGood): void {
    if (this.overlay) return;
    const err = getExchangeError(g, run.armory, run.vars, maxOf(g));
    if (err) {
      this.message = `${goodName(g)}：${ERROR_TEXT[err] ?? err}`;
      this.render();
      return;
    }
    const cx = GAME_WIDTH / 2;
    const top = 300;
    const panel = this.add.container(0, 0).setDepth(50);
    this.overlay = panel;
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(addWindow(this, cx - 160, top, 320, 190));
    panel.add(addText(this, cx, top + 50, `${goodName(g)}を\n記憶の欠片 ${g.price} と交換する？`, { size: 16, bold: true, align: 'center' }).setOrigin(0.5));
    panel.add(addText(this, cx, top + 96, '多く持っている種類の欠片から使う', { size: 11, color: COLORS.subText }).setOrigin(0.5));
    const close = () => {
      panel.destroy(true);
      this.overlay = undefined;
    };
    addButton(this, panel, cx - 72, top + 148, 130, 48, 'やめる', { onTap: close }, { size: 15 });
    addButton(this, panel, cx + 72, top + 148, 130, 48, '交換する', { onTap: () => { close(); this.buy(g); } }, { size: 15, bold: true, fill: 0x2f4f3a, stroke: 0x6fe0a0, strokeWidth: 2 });
    popIn(this, panel);
  }

  private buy(g: ExchangeGood): void {
    const r = exchange(g, run.armory, run.vars, FRAGMENT_ORDER, maxOf(g));
    run.armory = r.armory;
    if (r.vars !== run.vars) setStoryVars(r.vars);
    if (r.gear) run.navi = addParts(run.navi, [r.gear]);
    saveRun();
    notePlayCount('exchange');
    playSe(this, SE.chest);
    this.message = `${EXCHANGE_KEEPER}「${goodName(g)}、確かに。……帳簿も合いました」`;
    this.render();
  }
}
