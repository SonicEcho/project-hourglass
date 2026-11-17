import Phaser from 'phaser';
import type { AlbumState, ChainLinkDef, ChainSnapTab, Element } from '../core';
import { addToAlbum, chainAlbumAddError, chainAlbumCounts, chainSnapMatches, countOf, isAlbumComplete, removeFromAlbum, sameAlbum } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { CHAIN_ALBUM, CHAIN_ENEMY_SNAPS, CHAIN_SNAPS, LIBRARY_COMBOS, SCREEN_COACH } from '../data';
import { chainSnapLook as chainLook, comboDetailLines, comboMaterialNames, isComboMaterial, snapArt, snapDetailLines, snapShortLine } from '../ui/chainSnapText';
import { frameHeader } from '../ui/frame';
import { addBand, addChip, addListRow, addRowName, addTabs, LIST_COLORS, ROW_GAP, ROW_H, SNAP_CATEGORY, type TabDef } from '../ui/listKit';
import { ScrollArea } from '../ui/scrollArea';
import { waitImages } from '../ui/waitImages';
import type { IconKind } from '../ui/icons';
import { foundChainCombos } from './chainEncounter';
import { addIcon } from '../ui/icons';
import { ELEMENT_LABEL } from '../ui/labels';
import { SIDE_PADDING } from '../ui/layout';
import { addWindow, enterScreen, screenBg } from '../ui/skin';
import { COLORS, RENDER_SCALE, STYLE } from '../ui/theme';
import { startScreenCoach } from '../ui/screenCoach';
import { addButton, addSlant, addText, makePressable } from '../ui/widgets';
import { hubBack, run, saveRun, setHubReturn } from './run';

// アルバムの編集（段階41。docs/design/battle.md の 2.）。探索のチェックポイントの星図から開く。
// 持っているスナップを1種類1行に並べ、「−」で外し「＋」で入れる。決まった枚数（CHAIN_ALBUM.size）ちょうどの時だけ星図へ戻れる。
// 名前をタップすると、下の窓にそのスナップの説明が出る。
// 段階204：古い戦闘のアルバム（run.album）の道は外した。新しい戦闘のアルバム（run.chainAlbum）だけ。
// 段階124（レビューの項目2・3）：画面の中では下書きを変え、run.chainAlbum（セーブされる編成）は「決めて戻る」まで変えない。
// 途中で保存されたり（画面が裏に回る時など）、やめて閉じたりしても、直前に決めた 決まった枚数（CHAIN_ALBUM.size）の編成が残る。「変更をやめる」で下書きを捨てて戻れる

/** 一覧の1行 */
interface SnapRow {
  id: string;
  name: string;
  look: { color: number; label: string; icon: IconKind };
}

/**
 * 段階166：上に分類のタブと属性の絞り込みを置くので、一覧は下から。
 * 段階231：ページ送りをやめ、一覧は指で上下にずらす。行は小さな絵と、効果の一行（見本 A）
 */
const COUNTS_Y = 60;
const TAB_Y = 84;
const FILTER_Y = 112;
const CHAIN_LIST_Y = 130;
const COMBO_LIST_Y = 104;
const DETAIL_H = 94;
const DETAIL_Y = 670;
const LIST_BOTTOM = DETAIL_Y - 8;
const SNAP_ROW_H = 46;
const SNAP_ROW_GAP = 4;
const THUMB = 38;

/** 分類のタブ（段階166）。コンボは見つけたコンボの一覧 */
const TABS: TabDef<ChainSnapTab | 'combo'>[] = [
  { id: 'all', label: 'すべて', color: COLORS.accent },
  { id: 'attack', label: 'アクション', color: SNAP_CATEGORY.attack.color },
  { id: 'support', label: 'エフェクト', color: SNAP_CATEGORY.support.color },
  { id: 'finish', label: 'クライマックス', color: SNAP_CATEGORY.finish.color },
  { id: 'enemy', label: '敵', color: LIST_COLORS.enemy },
  { id: 'combo', label: 'コンボ', color: LIST_COLORS.combo },
];
const ELEMENTS: Element[] = ['physical', 'fire', 'ice', 'thunder'];
const ENEMY_SNAP_IDS = Object.values(CHAIN_ENEMY_SNAPS);

export class AlbumScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private selected: string | null = null;
  private message = '';
  /** message が注意ではなく、やったことの知らせか（段階100。おまかせ） */
  private messageOk = false;
  /** 一覧のずらし（段階231） */
  private list!: ScrollArea;
  /** 編集中の下書き（段階124） */
  private draft!: AlbumState;
  /** 「変更をやめる」を1回押して、もう一度押すのを待っているか */
  private discardArmed = false;
  /** 分類のタブと属性の絞り込み（段階166） */
  private tab: ChainSnapTab | 'combo' = 'all';
  private element: Element | null = null;
  /** 見つけたコンボ（開いた時に読む） */
  private found: string[] = [];

  private get size(): number {
    return CHAIN_ALBUM.size;
  }

  private get copyMax(): number {
    return CHAIN_ALBUM.copyMax;
  }

  /** 周回の編成（決めた物） */
  private get saved(): AlbumState {
    return run.chainAlbum;
  }

  constructor() {
    super('Album');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
    this.selected = null;
    this.message = '';
    this.list = new ScrollArea(this);
    this.tab = 'all';
    this.element = null;
    this.found = foundChainCombos(true);
    this.draft = this.saved;
    this.discardArmed = false;
    // 段階231：一覧の小さな絵を待ってから描く
    const art = [...new Set(Object.keys(this.draft.owned).map(snapArt).filter((x): x is string => !!x))];
    waitImages(this, art, () => {
      this.render();
      // 段階236：照らす案内（戦闘と同じ形）
      startScreenCoach(this, 'growth_album', SCREEN_COACH.growth_album, (t) => this.coachRect(t));
    });
  }

  /** 照らす所（段階236） */
  private coachRect(t: string): { x: number; y: number; w: number; h: number } | null {
    const w = GAME_WIDTH - SIDE_PADDING * 2;
    if (t === 'counts') return { x: 4, y: COUNTS_Y - 11, w: GAME_WIDTH - 8, h: 22 };
    if (t === 'tabs') return { x: 4, y: TAB_Y - 15, w: GAME_WIDTH - 8, h: FILTER_Y + 14 - (TAB_Y - 15) };
    if (t === 'row') return { x: SIDE_PADDING - 3, y: CHAIN_LIST_Y - 3, w: w + 6, h: SNAP_ROW_H + 6 };
    if (t === 'detail') return { x: SIDE_PADDING - 3, y: DETAIL_Y - 3, w: w + 6, h: DETAIL_H + 6 };
    if (t === 'confirm') {
      const backW = w - 120 - 6;
      return { x: GAME_WIDTH - SIDE_PADDING - backW - 6, y: 800 - 32, w: backW + 12, h: 64 };
    }
    return null;
  }

  /** 持っているスナップ（スナップの一覧の順） */
  private ownedCards(): SnapRow[] {
    const tab = this.tab === 'combo' ? 'all' : this.tab;
    return Object.values(CHAIN_SNAPS)
      .filter((m) => (this.draft.owned[m.id] ?? 0) > 0 && chainSnapMatches(m, tab, this.element, ENEMY_SNAP_IDS))
      .map((m) => ({ id: m.id, name: m.name, look: chainLook(m) }));
  }

  private insert(id: string): void {
    this.discardArmed = false;
    this.messageOk = false;
    const err = chainAlbumAddError(this.draft, id, CHAIN_SNAPS, CHAIN_ALBUM);
    if (err) {
      this.message =
        err === 'album is full'
          ? `アルバムは${this.size}枚でいっぱいです。先にほかのスナップを外してください`
          : err === 'too many copies'
            ? `同じスナップは${this.copyMax}枚まで入れられます`
            : err === 'too many climaxes'
              ? `クライマックスは${CHAIN_ALBUM.climaxMax}枚まで入れられます`
              : '持っている分は、もう全部入っています';
    } else {
      this.draft = addToAlbum(this.draft, id, this.size, this.copyMax);
      this.message = '';
    }
    this.selected = id;
    this.render();
  }

  private remove(id: string): void {
    this.discardArmed = false;
    if ((this.draft.album[id] ?? 0) > 0) this.draft = removeFromAlbum(this.draft, id);
    this.selected = id;
    this.message = '';
    this.render();
  }

  private render(): void {
    this.root.removeAll(true);
    this.root.add(screenBg(this));
    const total = countOf(this.draft.album);
    const complete = isAlbumComplete(this.draft, this.size);
    const changed = !sameAlbum(this.draft, this.saved);
    const comboTab = this.tab === 'combo';

    // 一覧（段階231：ページ送りをやめ、指で上下にずらす。上に描く見出し・タブのボタンが優先して押せるよう、先に足す）
    const listTop = comboTab ? COMBO_LIST_Y : CHAIN_LIST_Y;
    const cards = this.ownedCards();
    const pitch = comboTab ? ROW_H + ROW_GAP : SNAP_ROW_H + SNAP_ROW_GAP;
    const count = comboTab ? LIBRARY_COMBOS.length : cards.length;
    const layer = this.list.build(this.root, listTop, LIST_BOTTOM, Math.max(0, count * pitch - (comboTab ? ROW_GAP : SNAP_ROW_GAP)));
    if (comboTab) LIBRARY_COMBOS.forEach((l, i) => this.drawComboRow(layer, l, listTop + i * pitch));
    else cards.forEach((card, i) => this.drawRow(layer, card, listTop + i * pitch));
    if (count === 0) {
      const empty = this.element ? `${ELEMENT_LABEL[this.element]}のスナップは、まだ持っていません` : 'この分類のスナップは、まだ持っていません';
      this.root.add(addText(this, GAME_WIDTH / 2, listTop + 40, empty, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    }

    // 上：見出しと入れた枚数（段階231：共通の見出し）
    const value = frameHeader(this, this.root, 'album', 'アルバム', { label: '入れる枚数', value: `${total}/${this.size}` });
    if (!complete) value?.setColor('#ffffff');
    this.drawCounts();
    this.drawTabs();

    // 説明の窓（段階231：窓の形。説明はルール説明の口調）
    const detailX = SIDE_PADDING;
    const detailW = GAME_WIDTH - SIDE_PADDING * 2;
    this.root.add(addWindow(this, detailX, DETAIL_Y, detailW, DETAIL_H, STYLE.red, STYLE.ink, 0.94));
    const chainSel = this.selected ? CHAIN_SNAPS[this.selected] : undefined;
    const comboSel = comboTab && this.selected ? LIBRARY_COMBOS.find((l) => l.id === this.selected) : undefined;
    const lines = comboTab
      ? comboSel
        ? comboDetailLines(comboSel, this.found)
        : ['名前をタップすると、コンボの説明が出ます。', `見つけたコンボは ${LIBRARY_COMBOS.filter((l) => this.found.includes(l.id)).length}/${LIBRARY_COMBOS.length} です。材料がそろうと、戦闘で見つかります。`]
      : chainSel
      ? snapDetailLines(chainSel, this.found)
      : [
          '名前をタップすると、スナップの説明が出ます。',
          `${this.size}枚を選んで戦います。同じスナップは${this.copyMax}枚、クライマックスは${CHAIN_ALBUM.climaxMax}枚まで入れられます。`,
          'スペシャルは、仲間ごとに2枚が加わります。★は、見つけたコンボの材料です。',
        ];
    const body = addText(this, detailX + 14, DETAIL_Y + 9, lines.join('\n'), { size: 12, wrap: detailW - 28 }).setLineSpacing(2);
    const bodyMax = DETAIL_H - 18 - (this.message ? 18 : 0);
    if (body.height > bodyMax) body.setScale(bodyMax / body.height);
    this.root.add(body);
    if (this.message) {
      this.root.add(addText(this, GAME_WIDTH / 2, DETAIL_Y + DETAIL_H - 14, this.message, { size: 12, bold: true, color: this.messageOk ? COLORS.accentText : STYLE.yellowText }).setOrigin(0.5));
    }

    // 下：変更をやめる・決めて戻る（段階124。決めて戻れるのは決まった枚数ちょうどの時だけ）。
    // 段階204：古い戦闘の「おまかせ」（段階100。新しい戦闘では使えなかった）は外した
    const y = 800;
    const gap = 6;
    const discardW = 120;
    const discardX = SIDE_PADDING + discardW / 2;
    addButton(
      this,
      this.root,
      discardX,
      y,
      discardW,
      52,
      this.discardArmed ? 'もう一度で\nやめる' : '変更を\nやめる',
      { onTap: () => this.discard() },
      changed ? { size: 13, fill: this.discardArmed ? 0x5a1a14 : undefined, stroke: this.discardArmed ? 0xff8a7a : undefined } : { enabled: false, size: 13 },
    );
    const backW = GAME_WIDTH - SIDE_PADDING * 2 - discardW - gap;
    const backLabel = hubBack()?.label ?? '星図へ戻る';
    addButton(
      this,
      this.root,
      GAME_WIDTH - SIDE_PADDING - backW / 2,
      y,
      backW,
      52,
      !complete ? `あと${this.size - total}枚入れると\n決められます` : changed ? `決めて\n${backLabel}` : backLabel,
      { onTap: () => this.confirm() },
      complete ? { fill: STYLE.red, stroke: 0xffffff, strokeWidth: 2, italic: true, size: changed ? 14 : 15, bold: true } : { enabled: false, size: 12 },
    );
  }

  /** 決めて戻る（段階124）：下書きを周回の編成にして保存する。決まった枚数（CHAIN_ALBUM.size）ちょうどの時だけ */
  private confirm(): void {
    if (!isAlbumComplete(this.draft, this.size)) return;
    run.chainAlbum = this.draft;
    saveRun();
    this.leave();
  }

  /** 変更をやめる（段階124）：下書きを捨てて、開いた時の編成のまま戻る。誤タップで消さないよう2回押す */
  private discard(): void {
    if (!this.discardArmed) {
      this.discardArmed = true;
      this.message = 'もう一度押すと、変更をやめて、開いた時の編成に戻ります';
      this.messageOk = false;
      this.render();
      return;
    }
    this.draft = this.saved;
    this.leave();
  }

  private leave(): void {
    // 拠点から開いた時は拠点へ戻る（段階45）
    const hub = hubBack();
    if (!hub) {
      this.scene.start('Growth');
      return;
    }
    setHubReturn(null);
    this.scene.start(hub.key, hub.data);
  }

  /** アルバムの中身の帯（段階166）：分類ごとの枚数（クライマックスは上限まで）と、敵のスナップの枚数 */
  private drawCounts(): void {
    const c = chainAlbumCounts(this.draft.album, CHAIN_SNAPS, ENEMY_SNAP_IDS);
    const parts: { label: string; color: number; full?: boolean }[] = [
      { label: `アクション ${c.attack}`, color: SNAP_CATEGORY.attack.color },
      { label: `エフェクト ${c.support}`, color: SNAP_CATEGORY.support.color },
      { label: `クライマックス ${c.finish}/${CHAIN_ALBUM.climaxMax}`, color: SNAP_CATEGORY.finish.color, full: c.finish >= CHAIN_ALBUM.climaxMax },
      { label: `敵 ${c.enemy}`, color: LIST_COLORS.enemy },
    ];
    let x = SIDE_PADDING;
    for (const p of parts) {
      this.root.add(addSlant(this, x + 4, COUNTS_Y, 8, 8, p.color));
      const t = addText(this, x + 11, COUNTS_Y, p.label, { size: 11, bold: !!p.full, color: p.full ? COLORS.accentText : COLORS.subText }).setOrigin(0, 0.5);
      this.root.add(t);
      x += 11 + t.width + 9;
    }
  }

  /** 分類のタブと、属性の絞り込み（段階166） */
  private drawTabs(): void {
    addTabs(this, this.root, TAB_Y, TABS, this.tab, (id) => {
      // コンボのタブとスナップのタブでは、選んでいる物の種類が違うので外す
      if (id === 'combo' || this.tab === 'combo') this.selected = null;
      this.tab = id;
      this.list.reset();
      this.message = '';
      this.render();
    });
    if (this.tab === 'combo') return;
    const opts: (Element | null)[] = [null, ...ELEMENTS];
    const fw = 50;
    opts.forEach((el, i) => {
      const x = SIDE_PADDING + fw / 2 + i * (fw + 4);
      addChip(this, this.root, x, FILTER_Y, fw, 22, el ? ELEMENT_LABEL[el] : '全属性', COLORS.accent, this.element === el, () => {
        if (this.element === el) return;
        this.element = el;
        this.list.reset();
        this.render();
      });
    });
  }

  /** コンボのタブの1行（段階166）：見つけたコンボは名前と材料、まだの物は「？？？」 */
  private drawComboRow(layer: Phaser.GameObjects.Container, l: ChainLinkDef, top: number): void {
    const known = this.found.includes(l.id);
    const cy = addListRow(this, layer, top, {
      dim: !known,
      selected: this.selected === l.id,
      onTap: this.list.guard(() => {
        this.selected = l.id;
        this.render();
      }),
    });
    addBand(this, layer, SIDE_PADDING + 4, cy, 88, LIST_COLORS.combo, '★ コンボ', null, !known);
    const nameX = SIDE_PADDING + 98;
    addRowName(this, layer, nameX, cy, known ? l.move.name : '？？？', 100, !known);
    const sub = addText(this, GAME_WIDTH - SIDE_PADDING - 8, cy, known ? comboMaterialNames(l) : 'まだ見つけていません', { size: 11, color: COLORS.subText }).setOrigin(1, 0.5);
    const maxW = GAME_WIDTH - SIDE_PADDING - 8 - (nameX + 100);
    if (sub.width > maxW) sub.setScale(maxW / sub.width);
    layer.add(sub);
  }

  /**
   * 1種類の行（段階231 の見本 A）：小さな絵、分類の札と名前、効果の一行、「−」入れる枚数「＋」、持っている枚数。
   * 入れているスナップは左に紅の帯
   */
  private drawRow(layer: Phaser.GameObjects.Container, card: SnapRow, top: number): void {
    const cy = top + SNAP_ROW_H / 2;
    const inAlbum = this.draft.album[card.id] ?? 0;
    const owned = this.draft.owned[card.id] ?? 0;
    const selected = this.selected === card.id;
    const look = card.look;
    const on = inAlbum > 0;
    const w = GAME_WIDTH - SIDE_PADDING * 2;
    const row = this.add.rectangle(SIDE_PADDING, top, w, SNAP_ROW_H, on ? 0x17151b : 0x0e0d10, 0.95).setOrigin(0);
    row.setStrokeStyle(selected ? 2 : 1, selected ? 0xffffff : 0x2e2c34);
    layer.add(row);
    makePressable(row, {
      onTap: this.list.guard(() => {
        this.selected = card.id;
        this.message = '';
        this.discardArmed = false;
        this.render();
      }),
    });
    if (on) layer.add(this.add.rectangle(SIDE_PADDING, top, 3, SNAP_ROW_H, STYLE.red).setOrigin(0));
    // 小さな絵（絵のない物は、分類の色にアイコン）
    const tx = SIDE_PADDING + 8 + THUMB / 2;
    const art = snapArt(card.id);
    if (art && this.textures.exists(art)) {
      layer.add(this.add.image(tx, cy, art).setDisplaySize(THUMB, THUMB).setAlpha(on ? 1 : 0.5));
    } else {
      layer.add(this.add.rectangle(tx, cy, THUMB, THUMB, look.color, on ? 0.85 : 0.4));
      layer.add(addIcon(this, look.icon, tx, cy, 18, 0x101820));
    }
    layer.add(this.add.rectangle(tx, cy, THUMB, THUMB).setStrokeStyle(1, 0xffffff, 0.35));
    // 分類の札と名前
    const textX = tx + THUMB / 2 + 8;
    const textMax = 222;
    const chipLabel = addText(this, 0, cy - 9, look.label, { size: 8, bold: true, color: '#101820' }).setOrigin(0.5);
    const chipW = chipLabel.width + 12;
    layer.add(addSlant(this, textX + chipW / 2, cy - 9, chipW, 13, look.color, on ? 1 : 0.5));
    chipLabel.setX(textX + chipW / 2);
    layer.add(chipLabel);
    const nameX = textX + chipW + 5;
    const nameT = addText(this, nameX, cy - 9, card.name, { size: 13, bold: true, color: on ? COLORS.text : COLORS.subText }).setOrigin(0, 0.5);
    // 見つけたコンボの材料には★（段階166）。名前の幅を少し詰める
    const material = isComboMaterial(card.id, this.found);
    const nameMax = textMax - (material ? 12 : 0) - nameX;
    if (nameT.width > nameMax) nameT.setScale(nameMax / nameT.width, 1);
    layer.add(nameT);
    if (material) layer.add(addText(this, nameX + nameT.displayWidth + 2, cy - 9, '★', { size: 11, bold: true, color: STYLE.yellowText }).setOrigin(0, 0.5));
    // 効果の一行
    // 説明の文が入りきらない時は、札の短い説明
    const move = CHAIN_SNAPS[card.id];
    const effect = addText(this, textX, cy + 10, move?.text ?? '', { size: 10, color: COLORS.subText }).setOrigin(0, 0.5);
    if (move && effect.width > textMax - textX) effect.setText(snapShortLine(move));
    if (effect.width > textMax - textX) effect.setScale((textMax - textX) / effect.width, 1);
    layer.add(effect);
    // 入れる枚数
    addButton(this, layer, 246, cy, 32, 28, '−', { onTap: this.list.guard(() => this.remove(card.id)) }, { enabled: on, size: 16 });
    const n = addText(this, 278, cy, `${inAlbum}`, { size: 19, bold: true, color: on ? STYLE.yellowText : COLORS.dimText }).setOrigin(0.5);
    n.setFontStyle('bold italic');
    layer.add(n);
    addButton(this, layer, 310, cy, 32, 28, '＋', { onTap: this.list.guard(() => this.insert(card.id)) }, { enabled: inAlbum < owned, size: 16 });
    layer.add(addText(this, GAME_WIDTH - SIDE_PADDING - 6, cy, `所持${owned}`, { size: 10, color: COLORS.subText }).setOrigin(1, 0.5));
  }
}
