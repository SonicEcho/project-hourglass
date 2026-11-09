import Phaser from 'phaser';
import type { AlbumState, CardDef, ChainLinkDef, ChainSnapTab, Element } from '../core';
import { addToAlbum, chainAlbumAddError, chainAlbumCounts, chainSnapMatches, countOf, getAddError, isAlbumComplete, recommendAlbum, removeFromAlbum, sameAlbum } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ALBUM_COPY_MAX, ALBUM_RECOMMEND, ALBUM_SIZE, CARDS, CHAIN_ALBUM, CHAIN_ENEMY_SNAPS, CHAIN_SNAPS, LIBRARY_COMBOS } from '../data';
import { chainSnapLook as chainLook, comboDetailLines, comboMaterialNames, isComboMaterial, snapDetailLines } from '../ui/chainSnapText';
import { addBand, addChip, addListRow, addPager, addRowName, addTabs, LIST_COLORS, ROW_GAP, ROW_H, SNAP_CATEGORY, type TabDef } from '../ui/listKit';
import type { IconKind } from '../ui/icons';
import { chainAlbumActive, foundChainCombos } from './chainEncounter';
import { snapLook } from '../ui/battleViews';
import { describeAction } from '../ui/describe';
import { addIcon } from '../ui/icons';
import { ELEMENT_LABEL, weightLabel } from '../ui/labels';
import { SIDE_PADDING } from '../ui/layout';
import { enterScreen, screenBg } from '../ui/skin';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { maybeShowTip } from '../ui/tipPanel';
import { addButton, addText, makePressable } from '../ui/widgets';
import { hubBack, run, saveRun, setHubReturn } from './run';

// アルバムの編集（段階41。docs/design/battle.md の 2.）。探索のチェックポイントの星図から開く。
// 持っているスナップを1種類1行に並べ、「−」で外し「＋」で入れる。ALBUM_SIZE 枚ちょうどの時だけ星図へ戻れる。
// 名前をタップすると、下の窓にそのスナップの説明が出る。
// 段階124（レビューの項目2・3）：画面の中では下書きを変え、run.album（セーブされる編成）は「決めて戻る」まで変えない。
// 途中で保存されたり（画面が裏に回る時など）、やめて閉じたりしても、直前に決めた ALBUM_SIZE 枚の編成が残る。「変更をやめる」で下書きを捨てて戻れる

/** 一覧の1行（今の戦闘のスナップと、新しい戦闘のスナップの両方を同じ形で並べる） */
interface SnapRow {
  id: string;
  name: string;
  look: { color: number; label: string; icon: IconKind };
}

/** 1ページに並べる行の数（種類がこれより多い時は、ページを切り替える） */
const ROWS = 14;
const LIST_Y = 82;
/** 新しい戦闘のアルバム（段階166）：上に分類のタブと属性の絞り込みを置くので、一覧は下から。1ページ12行 */
const CHAIN_ROWS = 12;
const CHAIN_LIST_Y = 138;
const TAB_Y = 76;
const FILTER_Y = 106;
const DETAIL_H = 104;

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
  private page = 0;
  /** 編集中の下書き（段階124） */
  private draft!: AlbumState;
  /** 「変更をやめる」を1回押して、もう一度押すのを待っているか */
  private discardArmed = false;
  /** 新しい戦闘のアルバムを編集しているか（段階163。今いる区画が新しい戦闘の区画の時） */
  private chain = false;
  /** 分類のタブと属性の絞り込み（段階166。新しい戦闘のアルバムだけ） */
  private tab: ChainSnapTab | 'combo' = 'all';
  private element: Element | null = null;
  /** 見つけたコンボ（開いた時に読む） */
  private found: string[] = [];

  private get size(): number {
    return this.chain ? CHAIN_ALBUM.size : ALBUM_SIZE;
  }

  private get copyMax(): number {
    return this.chain ? CHAIN_ALBUM.copyMax : ALBUM_COPY_MAX;
  }

  /** 周回の編成（決めた物） */
  private get saved(): AlbumState {
    return this.chain ? run.chainAlbum : run.album;
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
    this.page = 0;
    this.chain = chainAlbumActive();
    this.tab = 'all';
    this.element = null;
    this.found = this.chain ? foundChainCombos(true) : [];
    this.draft = this.saved;
    this.discardArmed = false;
    this.render();
    maybeShowTip(this, ['growth_album']);
  }

  /** 持っているスナップ（スナップの一覧の順） */
  private ownedCards(): SnapRow[] {
    if (this.chain) {
      const tab = this.tab === 'combo' ? 'all' : this.tab;
      return Object.values(CHAIN_SNAPS)
        .filter((m) => (this.draft.owned[m.id] ?? 0) > 0 && chainSnapMatches(m, tab, this.element, ENEMY_SNAP_IDS))
        .map((m) => ({ id: m.id, name: m.name, look: chainLook(m) }));
    }
    return Object.values(CARDS as Record<string, CardDef>).filter((c) => (this.draft.owned[c.id] ?? 0) > 0).map((c) => ({ id: c.id, name: c.name, look: snapLook(c) }));
  }

  private insert(id: string): void {
    this.discardArmed = false;
    this.messageOk = false;
    const err = this.chain ? chainAlbumAddError(this.draft, id, CHAIN_SNAPS, CHAIN_ALBUM) : getAddError(this.draft, id);
    if (err) {
      this.message =
        err === 'album is full'
          ? `アルバムは${this.size}枚でいっぱい。先にほかのスナップを外す`
          : err === 'too many copies'
            ? `同じスナップは${this.copyMax}枚まで`
            : err === 'too many climaxes'
              ? `クライマックスは${CHAIN_ALBUM.climaxMax}枚まで`
              : '持っている分は、もう全部入っている';
    } else {
      this.draft = addToAlbum(this.draft, id, this.size, this.copyMax);
      this.message = '';
    }
    this.selected = id;
    this.render();
  }

  /** おまかせ（段階100）：持っているスナップから、コンボを組める形の20枚に入れ直す */
  private recommend(): void {
    if (this.chain) return;
    this.discardArmed = false;
    const next = recommendAlbum(this.draft, ALBUM_RECOMMEND);
    this.message = sameAlbum(next, this.draft) ? 'もう、おまかせと同じ組み方' : 'おまかせで組んだ（コンボを組める形）';
    this.messageOk = true;
    this.draft = next;
    this.selected = null;
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

    // 上：見出しと枚数
    this.root.add(addIcon(this, 'support', SIDE_PADDING + 9, 20, 18, COLORS.accent));
    this.root.add(addText(this, SIDE_PADDING + 24, 8, 'アルバム', { size: 17, bold: true }));
    if (this.chain) this.drawCounts();
    else this.root.add(addText(this, SIDE_PADDING, 34, `${ALBUM_SIZE}枚を選んで戦う（同じスナップは${ALBUM_COPY_MAX}枚まで）`, { size: 11, color: COLORS.subText, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 70 }));
    if (this.chain) this.drawTabs();
    const listY = this.chain ? CHAIN_LIST_Y : LIST_Y;
    const rowsPerPage = this.chain ? CHAIN_ROWS : ROWS;
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING, 6, 'アルバム', { size: 10, color: COLORS.subText }).setOrigin(1, 0));
    this.root.add(
      addText(this, GAME_WIDTH - SIDE_PADDING, 18, `${total}/${this.size}`, { size: 22, bold: true, color: complete ? COLORS.accentText : COLORS.allyDamage }).setOrigin(1, 0),
    );
    const comboTab = this.chain && this.tab === 'combo';
    if (!comboTab) {
      this.root.add(addText(this, 266, listY - 12, '入れる枚数', { size: 10, color: COLORS.subText }).setOrigin(0.5));
      this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING, listY - 12, '持っている', { size: 10, color: COLORS.subText }).setOrigin(1, 0.5));
    }

    // 一覧（コンボのタブは、見つけたコンボの一覧）
    const cards = this.ownedCards();
    const count = comboTab ? LIBRARY_COMBOS.length : cards.length;
    const pages = Math.max(1, Math.ceil(count / rowsPerPage));
    this.page = Math.min(this.page, pages - 1);
    if (comboTab) LIBRARY_COMBOS.slice(this.page * rowsPerPage, (this.page + 1) * rowsPerPage).forEach((l, i) => this.drawComboRow(l, listY + i * (ROW_H + ROW_GAP)));
    else cards.slice(this.page * rowsPerPage, (this.page + 1) * rowsPerPage).forEach((card, i) => this.drawRow(card, listY + i * (ROW_H + ROW_GAP)));
    if (count === 0) {
      const empty = this.element ? `${ELEMENT_LABEL[this.element]}のスナップは、まだ持っていない` : 'この分類のスナップは、まだ持っていない';
      this.root.add(addText(this, GAME_WIDTH / 2, listY + 40, empty, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    }
    const detailTop = listY + rowsPerPage * (ROW_H + ROW_GAP) + 4;
    addPager(this, this.root, detailTop + 12, this.page, pages, (d) => this.turn(d));

    // 説明の窓
    const detailY = detailTop + (pages > 1 ? 30 : 0);
    this.root.add(this.add.rectangle(SIDE_PADDING, detailY, GAME_WIDTH - SIDE_PADDING * 2, DETAIL_H, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(1, COLORS.border));
    const sel = this.selected && !this.chain ? (CARDS as Record<string, CardDef>)[this.selected] : undefined;
    const chainSel = this.selected && this.chain ? CHAIN_SNAPS[this.selected] : undefined;
    const comboSel = comboTab && this.selected ? LIBRARY_COMBOS.find((l) => l.id === this.selected) : undefined;
    const lines = comboTab
      ? comboSel
        ? comboDetailLines(comboSel, this.found)
        : ['名前をタップすると、コンボの説明が出る', `見つけたコンボ ${LIBRARY_COMBOS.filter((l) => this.found.includes(l.id)).length}/${LIBRARY_COMBOS.length}。材料がそろうと、戦闘で見つかる`]
      : chainSel
      ? snapDetailLines(chainSel, this.found)
      : this.chain
        ? ['名前をタップすると、スナップの説明が出る', `${this.size}枚を選んで戦う（同じスナップは${this.copyMax}枚・クライマックスは${CHAIN_ALBUM.climaxMax}枚まで。スペシャルは仲間ごとに2枚加わる）。★は見つけたコンボの材料`]
      : sel
        ? [`${sel.name}（${sel.support ? 'サポート・行動枠を使わない' : `重さ：${weightLabel(sel.weight)}`}）`, describeAction(sel)]
        : ['名前をタップすると、スナップの説明が出る', '宝箱・ボス・時間を返した時に、新しいスナップが手に入る'];
    this.root.add(addText(this, SIDE_PADDING + 10, detailY + 8, lines.join('\n'), { size: 12, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 20 }));
    if (this.message) {
      this.root.add(addText(this, GAME_WIDTH / 2, detailY + DETAIL_H - 14, this.message, { size: 12, bold: true, color: this.messageOk ? COLORS.accentText : COLORS.allyDamage }).setOrigin(0.5));
    }

    // 下：おまかせ（段階100）と、変更をやめる・決めて戻る（段階124。決めて戻れるのは ALBUM_SIZE 枚ちょうどの時だけ）
    const y = 800;
    const gap = 6;
    const autoW = 92;
    const discardW = 100;
    // おまかせは、今の戦闘のスナップの組み方（コンボの材料）で組むので、新しい戦闘のアルバムではまだ使えない
    addButton(this, this.root, SIDE_PADDING + autoW / 2, y, autoW, 52, 'おまかせ', { onTap: () => this.recommend() }, this.chain ? { enabled: false, size: 15 } : { size: 15, bold: true });
    const discardX = SIDE_PADDING + autoW + gap + discardW / 2;
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
    const backW = GAME_WIDTH - SIDE_PADDING * 2 - autoW - discardW - gap * 2;
    const backLabel = hubBack()?.label ?? '星図へ戻る';
    addButton(
      this,
      this.root,
      GAME_WIDTH - SIDE_PADDING - backW / 2,
      y,
      backW,
      52,
      !complete ? `あと${this.size - total}枚入れると\n決められる` : changed ? `決めて\n${backLabel}` : backLabel,
      { onTap: () => this.confirm() },
      complete ? { fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2, size: changed ? 14 : 15, bold: true } : { enabled: false, size: 12 },
    );
  }

  /** 決めて戻る（段階124）：下書きを周回の編成にして保存する。ALBUM_SIZE 枚ちょうどの時だけ */
  private confirm(): void {
    if (!isAlbumComplete(this.draft, this.size)) return;
    if (this.chain) run.chainAlbum = this.draft;
    else run.album = this.draft;
    saveRun();
    this.leave();
  }

  /** 変更をやめる（段階124）：下書きを捨てて、開いた時の編成のまま戻る。誤タップで消さないよう2回押す */
  private discard(): void {
    if (!this.discardArmed) {
      this.discardArmed = true;
      this.message = 'もう一度押すと、変更をやめて開いた時の編成に戻る';
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

  private turn(d: number): void {
    this.page += d;
    this.render();
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
      this.root.add(this.add.rectangle(x + 4, 52, 8, 8, p.color).setRounded(2));
      const t = addText(this, x + 11, 52, p.label, { size: 11, bold: !!p.full, color: p.full ? COLORS.accentText : COLORS.subText }).setOrigin(0, 0.5);
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
      this.page = 0;
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
        this.page = 0;
        this.render();
      });
    });
  }

  /** コンボのタブの1行（段階166）：見つけたコンボは名前と材料、まだの物は「？？？」 */
  private drawComboRow(l: ChainLinkDef, top: number): void {
    const known = this.found.includes(l.id);
    const cy = addListRow(this, this.root, top, {
      dim: !known,
      selected: this.selected === l.id,
      onTap: () => {
        this.selected = l.id;
        this.render();
      },
    });
    addBand(this, this.root, SIDE_PADDING + 4, cy, 88, LIST_COLORS.combo, '★ コンボ', null, !known);
    const nameX = SIDE_PADDING + 98;
    addRowName(this, this.root, nameX, cy, known ? l.move.name : '？？？', 100, !known);
    const sub = addText(this, GAME_WIDTH - SIDE_PADDING - 8, cy, known ? comboMaterialNames(l) : 'まだ見つけていない', { size: 11, color: COLORS.subText }).setOrigin(1, 0.5);
    const maxW = GAME_WIDTH - SIDE_PADDING - 8 - (nameX + 100);
    if (sub.width > maxW) sub.setScale(maxW / sub.width);
    this.root.add(sub);
  }

  /** 1種類の行：属性の帯・名前、「−」入れる枚数「＋」、持っている枚数 */
  private drawRow(card: SnapRow, top: number): void {
    const cy = top + ROW_H / 2;
    const inAlbum = this.draft.album[card.id] ?? 0;
    const owned = this.draft.owned[card.id] ?? 0;
    const selected = this.selected === card.id;
    const look = card.look;
    const row = this.add.rectangle(SIDE_PADDING, top, GAME_WIDTH - SIDE_PADDING * 2, ROW_H, inAlbum > 0 ? COLORS.panel : 0x141c25).setRounded(8).setOrigin(0);
    row.setStrokeStyle(selected ? 3 : 1, selected ? COLORS.select : COLORS.border);
    this.root.add(row);
    makePressable(row, {
      onTap: () => {
        this.selected = card.id;
        this.message = '';
        this.discardArmed = false;
        this.render();
      },
    });
    // 属性の帯（手札のスナップと同じ色・アイコン）
    // 新しい戦闘のスナップは、分類の名前（アクション・エフェクト・クライマックス）が長いので札を広く（段階163）
    const bandW = this.chain ? 88 : 58;
    const bandX = SIDE_PADDING + 4 + bandW / 2;
    this.root.add(this.add.rectangle(bandX, cy, bandW, 22, look.color, inAlbum > 0 ? 0.9 : 0.45).setRounded(6));
    const label = addText(this, bandX, cy, look.label, { size: this.chain ? 9 : 10, bold: true, color: '#101820' }).setOrigin(0.5);
    const left = bandX - (12 + 2 + label.width) / 2;
    this.root.add(addIcon(this, look.icon, left + 6, cy, 11, 0x101820));
    label.setX(left + 14 + label.width / 2);
    this.root.add(label);
    const nameX = SIDE_PADDING + 10 + bandW;
    const nameT = addText(this, nameX, cy, card.name, { size: 13, bold: true, color: inAlbum > 0 ? COLORS.text : COLORS.subText }).setOrigin(0, 0.5);
    // 見つけたコンボの材料には★（段階166）。名前の幅を少し詰める
    const material = this.chain && isComboMaterial(card.id, this.found);
    const nameMax = material ? 188 : 200;
    if (nameT.width > nameMax - nameX) nameT.setScale((nameMax - nameX) / nameT.width);
    this.root.add(nameT);
    if (material) this.root.add(addText(this, nameX + nameT.displayWidth + 2, cy, '★', { size: 11, bold: true, color: '#ffcf5a' }).setOrigin(0, 0.5));
    // 入れる枚数
    addButton(this, this.root, 226, cy, 40, 28, '−', { onTap: () => this.remove(card.id) }, { enabled: inAlbum > 0, size: 16 });
    this.root.add(addText(this, 266, cy, `${inAlbum}`, { size: 17, bold: true, color: inAlbum > 0 ? COLORS.accentText : COLORS.dimText }).setOrigin(0.5));
    addButton(this, this.root, 306, cy, 40, 28, '＋', { onTap: () => this.insert(card.id) }, { enabled: inAlbum < owned, size: 16 });
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING - 8, cy, `${owned}`, { size: 13, color: COLORS.subText }).setOrigin(1, 0.5));
  }
}
