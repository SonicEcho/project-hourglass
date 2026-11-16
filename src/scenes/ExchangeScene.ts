import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { DigToolId, ExchangeGood } from '../core';
import { addParts, eventPassed, exchange, gainSnaps, recordLibraryFinds, exchangedKey, exchangeGoods, fragmentTotal, getExchangeError, isSeen, markSeen, nextKeeperTalk } from '../core';
import { BACKDROPS, BGM, CHAIN_ALBUM, CHAIN_SNAPS, DECOMPOSE_VAR, DIG_TOOL_OWN_MAX, DIG_TOOLS, digToolVar, EXCHANGE_GOODS, EXCHANGE_INTRO, EXCHANGE_KEEPER, KEEPER_TALKS, FRAGMENTS, NAVI_PARTS, SE, SLICE_FLOW, WEAPON_DATA } from '../data';
import { playBgm, playSe } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { addWindow, enterScreen, popIn } from '../ui/skin';
import { COLORS, RENDER_SCALE, STYLE } from '../ui/theme';
import { maybeShowTip } from '../ui/tipPanel';
import { addButton, addSlant, addText, makePressable } from '../ui/widgets';
import { snapShortLine } from '../ui/chainSnapText';
import { backButton, frameHeader } from '../ui/frame';
import { SIDE_PADDING } from '../ui/layout';
import { describePart } from '../ui/naviText';
import { ScrollArea } from '../ui/scrollArea';
import { describeGains } from '../ui/weaponText';
import type { DialogueData } from './DialogueScene';
import { notePlayCount } from './playRecord';
import { run, saveRun, setStoryVars, storyLineup } from './run';

// 交換所（段階52。docs/design/economy.md の 5-2）：拠点の窓口で、記憶の欠片と品物を交換する。番人はペトラ（時間保管局の取引の窓口の係）。
// 初めて開いた時は、ペトラの会話（exchange_intro）を先に見る。日も昼の回数も使わない

const INTRO = EXCHANGE_INTRO.scene;
type Tab = 'material' | 'gear' | 'snap' | 'dig';
const TABS: { id: Tab; label: string }[] = [
  { id: 'material', label: '素材' },
  { id: 'gear', label: 'ギア' },
  { id: 'snap', label: 'スナップ' },
  { id: 'dig', label: '砂の底' },
];
/** 段階231：品物の一覧の範囲と、下のペトラの窓 */
const TAB_Y = 84;
const LIST_TOP = 108;
const MSG_Y = 702;
const MSG_H = 62;
const LIST_BOTTOM = MSG_Y - 8;
const ROW_H = 54;
const ROW_GAP = 5;
const FRAGMENT_ORDER = Object.keys(FRAGMENTS);

/** 品物の札 */
function tabOf(g: ExchangeGood): Tab {
  if (g.kind === 'gear') return 'gear';
  if (g.kind === 'snap') return 'snap';
  if (g.kind === 'digTool') return 'dig';
  return 'material';
}

function goodName(g: ExchangeGood): string {
  if (g.kind === 'snap') return CHAIN_SNAPS[g.ref]?.name ?? g.ref;
  if (g.kind === 'digTool') return DIG_TOOLS[g.ref as DigToolId]?.name ?? g.ref;
  return g.kind === 'gear' ? (NAVI_PARTS[g.ref as keyof typeof NAVI_PARTS]?.name ?? g.ref) : (WEAPON_DATA.items[g.ref]?.name ?? g.ref);
}

/** その品物でできること（段階231。タブで種類を選ぶので、行には種類の札の代わりにこれを出す） */
function goodEffect(g: ExchangeGood): string {
  if (g.kind === 'snap') {
    const m = CHAIN_SNAPS[g.ref];
    return m ? snapShortLine(m) : '';
  }
  if (g.kind === 'digTool') return DIG_TOOLS[g.ref as DigToolId]?.note ?? '';
  if (g.kind === 'gear') {
    const def = NAVI_PARTS[g.ref as keyof typeof NAVI_PARTS];
    return def ? describePart(def) : '';
  }
  const item = WEAPON_DATA.items[g.ref];
  if (!item) return '';
  const gains = describeGains(item.gains, true);
  return item.kind === 'material' && gains ? `武器に刻むと ${gains}` : gains;
}

/** 持てる数（スナップ・持てる数のある物） */
function maxOf(g: ExchangeGood): number | undefined {
  if (g.kind === 'snap') return CHAIN_ALBUM.copyMax;
  if (g.kind === 'digTool') return DIG_TOOL_OWN_MAX;
  return g.kind === 'item' ? WEAPON_DATA.items[g.ref]?.max : undefined;
}

/** 今持っている数（素材・アイテム・スナップ） */
function haveOf(g: ExchangeGood): number {
  if (g.kind === 'digTool') return Number(run.vars[digToolVar(g.ref)] ?? 0);
  return g.kind === 'snap' ? (run.chainAlbum.owned[g.ref] ?? 0) : (run.armory.items[g.ref] ?? 0);
}

const ERROR_TEXT: Record<string, string> = {
  'already exchanged': 'この品物は、もう交換しました（1回だけです）',
  'pouch is full': 'これ以上は持てません',
  'too many copies': 'これ以上は持てません（スナップは4枚、砂の底の道具は9個までです）',
  'not enough fragments': '記憶の欠片が足りません（素材を時分解すると手に入ります）',
};

export class ExchangeScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private tab: Tab = 'material';
  private message = '';
  /** message がペトラの台詞か（段階231：名前を紅で出す） */
  private keeperSays = true;
  private list!: ScrollArea;

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
    this.tab = 'material';
    this.message = '「ご用の品をどうぞ。欠片は、どの種類でも一つは一つです」';
    this.keeperSays = true;
    this.root = this.add.container(0, 0);
    this.list = new ScrollArea(this, () => !!this.overlay);
    this.render();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    // 段階100c：ペトラから時分解を教わったので、武器の画面に時分解を出す（それまでは、刻印が初めていっぱいになるまで出さない）
    if (!run.vars[DECOMPOSE_VAR]) {
      setStoryVars({ ...run.vars, [DECOMPOSE_VAR]: '1' });
      this.time.delayedCall(400, () => maybeShowTip(this, ['growth_decompose']));
    }
  }

  private goods(): ExchangeGood[] {
    return exchangeGoods(EXCHANGE_GOODS, { returned: run.returned, chapter: storyLineup().chapter }).filter((g) => g.kind !== 'gear' || storyLineup().unlocks.navi);
  }

  private render(): void {
    this.root.removeAll(true);
    const root = this.root;
    drawBackdrop(this, root, BACKDROPS.library, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0));

    // 品物の行（段階231：ページ送りをやめ、指で上下にずらす。上に描くタブが優先して押せるよう、先に足す）
    const all = this.goods();
    const tabs = TABS.filter((t) => all.some((g) => tabOf(g) === t.id));
    if (!tabs.some((t) => t.id === this.tab) && tabs.length) this.tab = tabs[0].id;
    const list = all.filter((g) => tabOf(g) === this.tab);
    const layer = this.list.build(root, LIST_TOP, LIST_BOTTOM, Math.max(0, list.length * (ROW_H + ROW_GAP) - ROW_GAP));
    list.forEach((g, i) => this.drawRow(layer, g, LIST_TOP + i * (ROW_H + ROW_GAP)));

    // 見出しと記憶の欠片の数（段階231：共通の見出し。種類ごとの数はその下に小さく）
    frameHeader(this, root, 'star', '交換所', { label: '記憶の欠片', value: `${fragmentTotal(run.armory.fragments)}` });
    const frags = FRAGMENT_ORDER.map((id) => `${FRAGMENTS[id as keyof typeof FRAGMENTS].name}${run.armory.fragments[id] ?? 0}`).join('・');
    root.add(addText(this, GAME_WIDTH - SIDE_PADDING - 4, 58, frags, { size: 10, color: COLORS.subText }).setOrigin(1, 0.5));

    // 種類のタブ（紅が選んでいる物）
    const gap = 6;
    const tw = (GAME_WIDTH - SIDE_PADDING * 2 - 8 - gap * (tabs.length - 1)) / Math.max(1, tabs.length);
    tabs.forEach((t, i) => {
      const active = this.tab === t.id;
      const x = SIDE_PADDING + 4 + tw / 2 + i * (tw + gap);
      const face = addSlant(this, x, TAB_Y, tw, 30, active ? STYLE.red : STYLE.ink, active ? 1 : 0.9);
      face.setStrokeStyle(1.5, 0xffffff, active ? 1 : 0.6);
      root.add(face);
      root.add(addText(this, x, TAB_Y, t.label, { size: 13, bold: true, color: active ? '#ffffff' : COLORS.subText }).setOrigin(0.5));
      makePressable(face, {
        onTap: () => {
          if (this.tab === t.id) return;
          this.tab = t.id;
          this.list.reset();
          this.render();
        },
      });
    });

    // ペトラの台詞の窓（段階231：窓の形。名前は紅）
    const mx = SIDE_PADDING;
    const mw = GAME_WIDTH - SIDE_PADDING * 2;
    root.add(addWindow(this, mx, MSG_Y, mw, MSG_H, STYLE.red, STYLE.ink, 0.92));
    // 話せる会話がある時（段階116）は、ペトラの一言と「話す」。見なくても物語は進む
    const talk = this.talk();
    const keeper = talk ? true : this.keeperSays;
    const text = talk ? `「${talk.teaser}」` : this.message;
    const textW = mw - 28 - (talk ? 104 : 0);
    if (keeper) root.add(addText(this, mx + 14, MSG_Y + 13, EXCHANGE_KEEPER, { size: 11, bold: true, color: STYLE.redText }).setOrigin(0, 0.5));
    const body = addText(this, mx + 14, keeper ? MSG_Y + 36 : MSG_Y + MSG_H / 2, text, { size: 12, wrap: textW }).setOrigin(0, 0.5);
    const bodyMax = keeper ? MSG_H - 28 : MSG_H - 10;
    if (body.height > bodyMax) body.setScale(bodyMax / body.height);
    root.add(body);
    if (talk) {
      addButton(this, root, GAME_WIDTH - SIDE_PADDING - 56, MSG_Y + MSG_H / 2, 88, 40, '話す', { onTap: () => this.startTalk(talk.scene) }, { size: 15, bold: true, fill: STYLE.red, stroke: 0xffffff, strokeWidth: 2, italic: true });
      // 段階151（テストプレイのメモ 2 の 5）：「！」は字に混ぜず、日常の印と同じ赤い丸にして、ボタンの右上の角に付ける
      root.add(this.add.circle(GAME_WIDTH - SIDE_PADDING - 14, MSG_Y + 8, 10, STYLE.yellow).setStrokeStyle(2, 0x0b0a0c));
      root.add(addText(this, GAME_WIDTH - SIDE_PADDING - 14, MSG_Y + 8, '！', { size: 12, bold: true, color: '#0b0a0c' }).setOrigin(0.5));
    }
    backButton(this, root, 'レストピアへ戻る', () => this.scene.start('Hub', { seen: undefined }));
  }

  /**
   * 品物の1行（段階231 の見本）：名前と持っている数、その品物でできること（タブで種類を選ぶので、種類の札は出さない）、紅の値段の札。
   * 交換できない時（欠片が足りない・もう持てない・交換した）は、値段の札を灰色に
   */
  private drawRow(layer: Phaser.GameObjects.Container, g: ExchangeGood, top: number): void {
    const err = getExchangeError(g, run.armory, run.vars, maxOf(g), haveOf(g));
    const x = SIDE_PADDING;
    const w = GAME_WIDTH - SIDE_PADDING * 2;
    const row = this.add.rectangle(x, top, w, ROW_H, STYLE.ink, 0.93).setOrigin(0);
    row.setStrokeStyle(1, 0x2e2c34);
    layer.add(row);
    makePressable(row, { onTap: this.list.guard(() => this.confirm(g)) });
    layer.add(this.add.rectangle(x, top, 3, ROW_H, err ? 0x3a3840 : STYLE.red).setOrigin(0));
    // 値段の札
    const px = x + w - 46;
    const cy = top + ROW_H / 2;
    const price = addSlant(this, px, cy, 76, 30, err ? 0x3a3840 : STYLE.red);
    price.setStrokeStyle(1.5, 0xffffff, err ? 0.3 : 0.9);
    layer.add(price);
    const pt = addText(this, px, cy, `欠片 ${g.price}`, { size: 13, bold: true, color: err ? '#8a8890' : '#ffffff' }).setOrigin(0.5);
    pt.setFontStyle('bold italic');
    layer.add(pt);
    // 名前と、持っている数（または1回だけ）
    const name = addText(this, x + 14, top + 17, goodName(g), { size: 14, bold: true, color: err ? COLORS.subText : COLORS.text }).setOrigin(0, 0.5);
    const textMax = px - 38 - 10 - (x + 14);
    layer.add(name);
    const once = g.once ? (run.vars[exchangedKey(g.id)] ? '交換しました' : '1回だけ') : '';
    const have = g.kind === 'gear' ? once : `所持 ${haveOf(g)}${maxOf(g) !== undefined ? `/${maxOf(g)}` : ''}${once ? `・${once}` : ''}`;
    const sub = addText(this, 0, top + 18, have, { size: 9, color: COLORS.subText }).setOrigin(0, 0.5);
    const nameMax = textMax - sub.width - 8;
    if (name.width > nameMax) name.setScale(nameMax / name.width, 1);
    sub.setX(x + 14 + name.displayWidth + 8);
    layer.add(sub);
    // その品物でできること
    const effect = addText(this, x + 14, top + 39, goodEffect(g), { size: 10, color: err ? COLORS.dimText : STYLE.yellowText }).setOrigin(0, 0.5);
    if (effect.width > textMax) effect.setScale(textMax / effect.width, 1);
    layer.add(effect);
  }

  /** 今話せるペトラとの会話（段階116） */
  private talk() {
    return nextKeeperTalk(KEEPER_TALKS, (id) => eventPassed(SLICE_FLOW, run.event, id), (scene) => isSeen(run.vars, scene));
  }

  /** ペトラとの会話を見て、交換所に戻る（見た印は会話の id） */
  private startTalk(scene: string): void {
    const talk: DialogueData = { scene, vars: run.vars, seed: run.seed, next: { key: 'Exchange', data: { seen: scene } }, onVars: (vars) => setStoryVars(vars) };
    this.scene.start('Dialogue', talk);
  }

  /** 交換するか確かめる窓 */
  private confirm(g: ExchangeGood): void {
    if (this.overlay) return;
    const err = getExchangeError(g, run.armory, run.vars, maxOf(g));
    if (err) {
      this.message = `${goodName(g)}：${ERROR_TEXT[err] ?? err}`;
      this.keeperSays = false;
      this.render();
      return;
    }
    const cx = GAME_WIDTH / 2;
    const top = 300;
    const panel = this.add.container(0, 0).setDepth(50);
    this.overlay = panel;
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(addWindow(this, cx - 160, top, 320, 190));
    panel.add(addText(this, cx, top + 50, `${goodName(g)}を\n記憶の欠片 ${g.price} と交換しますか？`, { size: 16, bold: true, align: 'center' }).setOrigin(0.5));
    panel.add(addText(this, cx, top + 96, '多く持っている種類の欠片から使います', { size: 11, color: COLORS.subText }).setOrigin(0.5));
    const close = () => {
      panel.destroy(true);
      this.overlay = undefined;
    };
    addButton(this, panel, cx - 72, top + 148, 130, 48, 'やめる', { onTap: close }, { size: 15 });
    addButton(this, panel, cx + 72, top + 148, 130, 48, '交換する', { onTap: () => { close(); this.buy(g); } }, { size: 15, bold: true, fill: STYLE.red, stroke: 0xffffff, strokeWidth: 2, italic: true });
    popIn(this, panel);
  }

  private buy(g: ExchangeGood): void {
    const r = exchange(g, run.armory, run.vars, FRAGMENT_ORDER, maxOf(g), haveOf(g));
    run.armory = r.armory;
    if (r.vars !== run.vars) setStoryVars(r.vars);
    // 砂の底の道具（段階214）：持っている数は物語の値に
    if (r.digTool) setStoryVars({ ...run.vars, [digToolVar(r.digTool)]: String(haveOf(g) + 1) });
    if (r.gear) run.navi = addParts(run.navi, [r.gear]);
    // スナップ（段階177）：新しい戦闘のアルバムの持ち物に足す（ライブラリにも記録）
    if (r.snap) {
      run.chainAlbum = gainSnaps(run.chainAlbum, [r.snap]);
      run.library = recordLibraryFinds(run.library, { snaps: [r.snap] });
    }
    saveRun();
    notePlayCount('exchange');
    playSe(this, SE.chest);
    this.message = `「${goodName(g)}、確かに。……帳簿も合いました」`;
    this.keeperSays = true;
    this.render();
  }
}
