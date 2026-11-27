import Phaser from 'phaser';
import { hasImage } from '../assets/loader';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { MEMORY_PHOTOS, AREAS, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, ENEMY_ART, LIBRARY_ART_NOTES, LIBRARY_ITEM_SOURCES, LIBRARY_SNAP_SOURCES, SCREEN_COACH, sourceTexts, type LibrarySource, GEAR_COUNTERS, NAVI_DATA, LIBRARY_COMBOS, LIBRARY_ENEMIES, LIBRARY_ENEMY_SNAP, LIBRARY_ITEMS, LIBRARY_SNAPS, WEAPON_DATA, type LibraryEnemy, type LibraryItem } from '../data';
import type { ChainLinkDef, ChainMove } from '../core';
import { chainSnapLook, comboDetailLines, comboMaterialNames, ENEMY_OF_SNAP, snapArt, snapDetailLines, snapShortLine } from '../ui/chainSnapText';
import { frameCoachRect, frameHeader } from '../ui/frame';
import { startScreenCoach } from '../ui/screenCoach';
import { ScrollArea } from '../ui/scrollArea';
import { addIcon, type IconKind } from '../ui/icons';
import { ELEMENT_LABEL } from '../ui/labels';
import { SIDE_PADDING } from '../ui/layout';
import { addBand, addDetailBox, addListRow, addRowName, addTabs, LIST_COLORS, ROW_GAP, ROW_H, ROW_W, SNAP_CATEGORY, type TabDef } from '../ui/listKit';
import { addWindow, enterScreen, screenBg } from '../ui/skin';
import { COLORS, RENDER_SCALE, STYLE } from '../ui/theme';
import { waitImages } from '../ui/waitImages';
import { RARITY_LABEL } from '../ui/weaponText';
import { addButton, addSlant, addText, makePressable } from '../ui/widgets';
import { isFound, libraryProgress, libraryView, type LibraryView } from './libraryView';
import { hubBack, setHubReturn } from './run';

// ライブラリ（段階167。docs/design/run.md）：見つけたスナップ・コンボ・会った敵・素材の記録。
// アルバム（20枚を組む道具）とは別の、読むだけの画面。まだ見つけていない物も「？？？」で並べ、手がかりを見せる。
// 育成のメニュー（拠点・休憩所）と、タイトルのオプションから開く

type LibraryTab = 'snap' | 'combo' | 'enemy' | 'item' | 'photo';

const TABS: TabDef<LibraryTab>[] = [
  { id: 'snap', label: 'スナップ', color: SNAP_CATEGORY.attack.color },
  { id: 'combo', label: 'コンボ', color: LIST_COLORS.combo },
  { id: 'enemy', label: '敵', color: LIST_COLORS.enemy },
  { id: 'item', label: '素材', color: LIST_COLORS.item },
  // 段階302：探索で拾った思い出の一枚
  { id: 'photo', label: '思い出', color: 0xd8a868 },
];

/** 段階231：共通の見出しの下にタブ。一覧は指で上下にずらす（ページ送りはやめた）。説明の窓は下に */
const TAB_Y = 70;
const COUNT_Y = 96;
const LIST_Y = 108;
/** 説明の窓：選んだ時は大きく（敵の説明は長い）、選んでいない時は小さくして、一覧を広げる */
const DETAIL_BOTTOM = 774 - 8;
/** 段階232：スナップと敵は、大きな絵と絵の説明文を添えるので、窓を高く */
const DETAIL_H_OPEN = 220;
const DETAIL_H_ART = 272;
/** 敵は分かったことの行が多い（ぬしは部位の行も）ので、もっと高く */
const DETAIL_H_ENEMY = 340;
const DETAIL_H_HINT = 78;
/** 絵のある行（スナップ・敵）の高さと、小さな絵 */
const ART_ROW_H = 46;
const ART_ROW_GAP = 4;
const THUMB = 38;
/** 説明の窓の大きな絵の大きさ（段階232） */
const ART = 124;
/** 思い出の一枚のカード（段階302） */
const PHOTO_GAP = 10;
const PHOTO_W = (ROW_W - PHOTO_GAP) / 2;
const PHOTO_H = Math.round(((PHOTO_W - 12) * 3) / 4) + 40;

export interface LibrarySceneData {
  /** タイトルから開いた時（戻る先） */
  back?: 'Title';
}

export class LibraryScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private tab: LibraryTab = 'snap';
  private list!: ScrollArea;
  private selected: string | null = null;
  private view!: LibraryView;
  private back: LibrarySceneData['back'];

  constructor() {
    super('Library');
  }

  create(data?: LibrarySceneData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.back = data?.back;
    this.root = this.add.container(0, 0);
    this.tab = 'snap';
    this.list = new ScrollArea(this);
    this.selected = null;
    this.view = libraryView();
    const art = [...new Set([...LIBRARY_ENEMIES.map((e) => ENEMY_ART[e.id]), ...LIBRARY_SNAPS.map((m) => snapArt(m.id)), ...MEMORY_PHOTOS.map((p) => p.image)].filter((x): x is string => !!x))];
    this.render();
    // 敵とスナップの絵は、届いてから描き直す。段階236：その後、初めての時は照らす案内（戦闘と同じ形）
    waitImages(this, art, () => {
      this.render();
      startScreenCoach(this, 'library_intro', SCREEN_COACH.library_intro, (t) =>
        t === 'tabs'
          ? { x: 4, y: TAB_Y - 16, w: GAME_WIDTH - 8, h: 32 }
          : t === 'list'
            ? { x: 4, y: LIST_Y - 4, w: GAME_WIDTH - 8, h: 3 * (ART_ROW_H + ART_ROW_GAP) + 4 }
            : t === 'detail'
              ? { x: SIDE_PADDING - 3, y: this.detailY() - 3, w: ROW_W + 6, h: DETAIL_BOTTOM - this.detailY() + 6 }
              : frameCoachRect(t),
      );
    });
  }

  private render(): void {
    this.root.removeAll(true);
    this.root.add(screenBg(this));
    const progress = libraryProgress(this.view);

    // 段階302：思い出のタブは、写真を2列のカードで
    if (this.tab === 'photo') {
      const rows = Math.ceil(MEMORY_PHOTOS.length / 2);
      const layer = this.list.build(this.root, LIST_Y, DETAIL_BOTTOM, Math.max(0, rows * (PHOTO_H + PHOTO_GAP) - PHOTO_GAP));
      MEMORY_PHOTOS.forEach((p, i) => this.drawPhotoCard(layer, p.id, SIDE_PADDING + (i % 2) * (PHOTO_W + PHOTO_GAP), LIST_Y + Math.floor(i / 2) * (PHOTO_H + PHOTO_GAP)));
    }
    // 一覧（上に描くタブが優先して押せるよう、先に足す）。思い出のタブは上でカードを描いた（作り直すと消える）
    if (this.tab !== 'photo') {
      const ids = this.ids();
      const art = this.tab === 'snap' || this.tab === 'enemy';
      const pitch = art ? ART_ROW_H + ART_ROW_GAP : ROW_H + ROW_GAP;
      const layer = this.list.build(this.root, LIST_Y, this.detailY() - 8, Math.max(0, ids.length * pitch - (art ? ART_ROW_GAP : ROW_GAP)));
      ids.forEach((id, i) => (art ? this.drawArtRow(layer, id, LIST_Y + i * pitch) : this.drawRow(layer, id, LIST_Y + i * pitch)));
      // 選んだ行が、大きくなった説明の窓に隠れないようにずらす
      const at = this.selected ? ids.indexOf(this.selected) : -1;
      if (at >= 0) this.list.reveal(LIST_Y + at * pitch, pitch);
    }

    // 見出しと、記録の数（段階231：共通の見出し）
    const all = Object.values(progress);
    frameHeader(this, this.root, 'star', 'ライブラリ', { label: '記録', value: `${all.reduce((a, x) => a + x[0], 0)}/${all.reduce((a, x) => a + x[1], 0)}` });
    addTabs(this, this.root, TAB_Y, TABS, this.tab, (id) => {
      this.tab = id;
      this.list.reset();
      this.selected = null;
      this.render();
    });
    const [found, total] = progress[this.tab];
    const what = { snap: '見つけたスナップ', combo: '見つけたコンボ', enemy: '会った敵', item: '手に入れた素材', photo: '見つけた思い出' }[this.tab];
    this.root.add(addText(this, SIDE_PADDING, COUNT_Y, `${what} ${found}/${total}`, { size: 11, color: COLORS.subText }).setOrigin(0, 0.5));
    if (this.tab !== 'photo') this.drawDetail();

    addButton(this, this.root, GAME_WIDTH / 2, 800, ROW_W, 52, this.back === 'Title' ? 'タイトルへ戻る' : (hubBack()?.label ?? '戻る'), { onTap: () => this.leave() }, { size: 15, bold: true });
  }

  private detailY(): number {
    if (!this.selected) return DETAIL_BOTTOM - DETAIL_H_HINT;
    return DETAIL_BOTTOM - (this.tab === 'enemy' ? DETAIL_H_ENEMY : this.tab === 'snap' ? DETAIL_H_ART : DETAIL_H_OPEN);
  }

  /** 思い出の一枚のカード（段階302）。まだの写真は「？？？」と、どこで見つかるかの手がかり */
  private drawPhotoCard(layer: Phaser.GameObjects.Container, id: string, x: number, top: number): void {
    const p = MEMORY_PHOTOS.find((m) => m.id === id)!;
    const known = isFound.photo(this.view, id);
    const card = this.add.rectangle(x, top, PHOTO_W, PHOTO_H, known ? 0xf4ecd8 : 0x17151b, known ? 1 : 0.95).setOrigin(0).setStrokeStyle(1, known ? 0xc8b898 : 0x2e2c34);
    layer.add(card);
    const iw = PHOTO_W - 12;
    const ih = Math.round((iw * 3) / 4);
    const cx = x + PHOTO_W / 2;
    const iy = top + 6 + ih / 2;
    if (known && p.image && hasImage(this, p.image)) layer.add(this.add.image(cx, iy, p.image).setDisplaySize(iw, ih));
    else {
      layer.add(this.add.rectangle(cx, iy, iw, ih, known ? 0x8a6a48 : 0x0e0d10, 1));
      layer.add(addText(this, cx, iy, known ? p.caption : '？？？', { size: known ? 10 : 18, bold: !known, color: known ? '#fff4dc' : '#5a5866', align: 'center', wrap: iw - 12, ja: true }).setOrigin(0.5));
    }
    const area = AREAS[p.area]?.name ?? p.area;
    const label = known ? p.title : p.secret ? '4枚そろえると……' : `${area}のどこか`;
    layer.add(addText(this, cx, top + PHOTO_H - 16, label, { size: 11, bold: known, color: known ? '#5a4630' : COLORS.subText, align: 'center', wrap: PHOTO_W - 8, ja: true }).setOrigin(0.5));
    if (known) makePressable(card, { onTap: this.list.guard(() => this.openPhoto(id)) });
  }

  /** 思い出の一枚を大きく見せ、その夜のことを読む（段階302）。タップで閉じる */
  private openPhoto(id: string): void {
    const p = MEMORY_PHOTOS.find((m) => m.id === id)!;
    const box = this.add.container(0, 0);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05060a, 0.92).setOrigin(0).setInteractive();
    box.add(shade);
    const w = GAME_WIDTH - 2 * SIDE_PADDING;
    const h = Math.round((w * 3) / 4);
    const top = 90;
    box.add(this.add.rectangle(GAME_WIDTH / 2, top + h / 2 + 4, w + 16, h + 16, 0xf4ecd8).setAngle(-1.5));
    if (p.image && hasImage(this, p.image)) box.add(this.add.image(GAME_WIDTH / 2, top + h / 2 + 4, p.image).setDisplaySize(w, h).setAngle(-1.5));
    else box.add(addText(this, GAME_WIDTH / 2, top + h / 2 + 4, p.caption, { size: 14, color: '#5a4630', align: 'center', wrap: w - 30, ja: true }).setOrigin(0.5).setAngle(-1.5));
    const area = AREAS[p.area]?.name ?? p.area;
    box.add(addText(this, SIDE_PADDING, top + h + 30, `${p.title}　（${area}）`, { size: 15, bold: true, color: '#ffd84a' }));
    const story = addText(this, SIDE_PADDING, top + h + 60, p.story, { size: 14, color: '#e6e9f5', wrap: w, ja: true }).setLineSpacing(8);
    box.add(story);
    // 段階303（裏設定：拾った写真をライブラリにまとめているのは、あかり。画面ではそのことに触れず、だれのとも書かない）：
    // ところどころの写真に、書き添えたようなひと言
    if (p.comment) {
      const cy = story.y + story.height + 22;
      box.add(this.add.rectangle(SIDE_PADDING, cy, w, 1, 0xffb8c8, 0.3).setOrigin(0));
      box.add(addText(this, SIDE_PADDING + 8, cy + 14, p.comment, { size: 13, color: '#ffd6e0', wrap: w - 8, ja: true }).setLineSpacing(6));
    }
    box.add(addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 40, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5));
    box.setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 200 });
    shade.once('pointerup', () => box.destroy());
  }

  /** 今のタブに並ぶ物の id（データの順） */
  private ids(): string[] {
    if (this.tab === 'snap') return LIBRARY_SNAPS.map((m) => m.id);
    if (this.tab === 'combo') return LIBRARY_COMBOS.map((l) => l.id);
    if (this.tab === 'enemy') return LIBRARY_ENEMIES.map((e) => e.id);
    return LIBRARY_ITEMS.map((i) => i.id);
  }

  private pick(id: string): void {
    this.selected = id;
    this.render();
  }

  private drawRow(layer: Phaser.GameObjects.Container, id: string, top: number): void {
    const v = this.view;
    const known = isFound[this.tab](v, id);
    const cy = addListRow(this, layer, top, { dim: !known, selected: this.selected === id, onTap: this.list.guard(() => this.pick(id)) });
    const bandW = 88;
    const nameX = SIDE_PADDING + bandW + 10;
    let name = '？？？';
    let right = '';
    const tagW = 0;
    if (this.tab === 'combo') {
      const l = LIBRARY_COMBOS.find((x) => x.id === id)!;
      addBand(this, layer, SIDE_PADDING + 4, cy, bandW, LIST_COLORS.combo, '★ コンボ', null, !known);
      if (known) name = l.move.name;
      right = known ? comboMaterialNames(l) : '';
    } else {
      const it = WEAPON_DATA.items[id];
      addBand(this, layer, SIDE_PADDING + 4, cy, bandW, LIST_COLORS.item, `素材・${RARITY_LABEL[it.rarity ?? 'common']}`, null, !known);
      if (known) name = it.name;
      right = known ? `所持${v.items[id] ?? 0}` : '';
    }
    const sub = right ? addText(this, GAME_WIDTH - SIDE_PADDING - 8, cy, right, { size: 11, color: COLORS.subText }).setOrigin(1, 0.5) : null;
    const subW = sub ? Math.min(sub.width, 130) : 0;
    if (sub && sub.width > subW) sub.setScale(subW / sub.width);
    if (sub) layer.add(sub);
    addRowName(this, layer, nameX + tagW, cy, name, GAME_WIDTH - SIDE_PADDING - 16 - subW - nameX - tagW, !known);
  }

  /**
   * 絵のある行（段階231。スナップと敵）：小さな絵、分類の札と名前、ひとことの説明、右に持っている数・倒した数。
   * まだの物は、絵を影にして名前を「？？？」に
   */
  private drawArtRow(layer: Phaser.GameObjects.Container, id: string, top: number): void {
    const v = this.view;
    const known = isFound[this.tab](v, id);
    const cy = top + ART_ROW_H / 2;
    const selected = this.selected === id;
    let art: string | undefined;
    let chip: { label: string; color: number };
    let name = '？？？';
    let sub = '';
    let right = '';
    let fallback: { color: number; icon: IconKind | null };
    if (this.tab === 'snap') {
      const m = CHAIN_SNAPS[id];
      const look = chainSnapLook(m);
      art = snapArt(id);
      // 敵のスナップは、分類の札を紫の「敵」に
      chip = ENEMY_OF_SNAP[id] ? { label: `敵・${look.label}`, color: LIST_COLORS.enemy } : { label: look.label, color: look.color };
      fallback = { color: look.color, icon: look.icon };
      if (known) {
        name = m.name;
        sub = snapShortLine(m);
        right = `所持${v.snapOwned[id] ?? 0}`;
      } else sub = 'まだ手に入れていません';
    } else {
      const e = LIBRARY_ENEMIES.find((x) => x.id === id)!;
      art = ENEMY_ART[id];
      chip = { label: e.boss ? 'ぬし' : 'ノイズ', color: e.boss ? STYLE.red : LIST_COLORS.enemy };
      fallback = { color: LIST_COLORS.enemy, icon: null };
      if (known) {
        name = e.base.name;
        sub = `出てくる区画：${e.areas.join('、')}`;
        right = `倒した${v.lib.defeated[id] ?? 0}`;
      } else sub = 'まだ会っていません';
    }
    const x = SIDE_PADDING;
    const w = ROW_W;
    const row = this.add.rectangle(x, top, w, ART_ROW_H, known ? 0x17151b : 0x0e0d10, 0.95).setOrigin(0);
    row.setStrokeStyle(selected ? 2 : 1, selected ? 0xffffff : 0x2e2c34);
    layer.add(row);
    makePressable(row, { onTap: this.list.guard(() => this.pick(id)) });
    if (known) layer.add(this.add.rectangle(x, top, 3, ART_ROW_H, STYLE.red).setOrigin(0));
    // 小さな絵（まだの物は影だけ）
    const tx = x + 8 + THUMB / 2;
    if (art && hasImage(this, art)) {
      const img = this.add.image(tx, cy, art);
      if (this.tab === 'enemy') img.setScale(THUMB / Math.max(img.width, img.height));
      else img.setDisplaySize(THUMB, THUMB);
      if (!known) img.setTintFill(0x1a1820).setAlpha(0.9);
      layer.add(img);
    } else {
      layer.add(this.add.rectangle(tx, cy, THUMB, THUMB, fallback.color, known ? 0.85 : 0.3));
      if (fallback.icon) layer.add(addIcon(this, fallback.icon, tx, cy, 18, 0x101820));
    }
    layer.add(this.add.rectangle(tx, cy, THUMB, THUMB).setStrokeStyle(1, 0xffffff, 0.35));
    // 分類の札と名前・ひとことの説明
    const textX = tx + THUMB / 2 + 8;
    const rightT = right ? addText(this, x + w - 8, cy, right, { size: 10, color: COLORS.subText }).setOrigin(1, 0.5) : null;
    const textMax = x + w - 8 - (rightT ? rightT.width + 10 : 0);
    const chipT = addText(this, 0, cy - 9, chip.label, { size: 8, bold: true, color: '#101820' }).setOrigin(0.5);
    const chipW = chipT.width + 12;
    layer.add(addSlant(this, textX + chipW / 2, cy - 9, chipW, 13, chip.color, known ? 1 : 0.45));
    chipT.setX(textX + chipW / 2);
    layer.add(chipT);
    const nameX = textX + chipW + 5;
    const nameT = addText(this, nameX, cy - 9, name, { size: 13, bold: true, color: known ? COLORS.text : COLORS.dimText }).setOrigin(0, 0.5);
    if (nameT.width > textMax - nameX) nameT.setScale((textMax - nameX) / nameT.width, 1);
    layer.add(nameT);
    const subT = addText(this, textX, cy + 10, sub, { size: 10, color: known ? COLORS.subText : COLORS.dimText }).setOrigin(0, 0.5);
    if (subT.width > textMax - textX) subT.setScale((textMax - textX) / subT.width, 1);
    layer.add(subT);
    if (rightT) layer.add(rightT);
  }

  private drawDetail(): void {
    const id = this.selected;
    if (!id) {
      const hint = {
        snap: ['名前をタップすると、スナップの説明が出ます。', 'どこで手に入るかは、説明の「手に入る所」に出ます。'],
        combo: ['名前をタップすると、コンボの説明が出ます。', 'まだのコンボも、手がかりが読めます。材料が手札にそろうと、戦闘で見つかります。'],
        enemy: ['名前をタップすると、敵の説明が出ます。', '弱点は、その属性で当てると分かります。落とす素材は、倒すと分かります。'],
        item: ['名前をタップすると、素材の説明が出ます。', 'どこで手に入るかは「手に入る所」に出ます。武器の進化の鍵になる素材もあります。'],
        photo: ['写真をタップすると、大きく見られます。'],
      }[this.tab];
      addDetailBox(this, this.root, this.detailY(), DETAIL_BOTTOM - this.detailY(), hint);
      return;
    }
    if (this.tab === 'snap') this.drawSnapDetail(CHAIN_SNAPS[id]);
    else if (this.tab === 'combo') addDetailBox(this, this.root, this.detailY(), DETAIL_BOTTOM - this.detailY(), this.comboLines(LIBRARY_COMBOS.find((l) => l.id === id)!));
    else if (this.tab === 'enemy') this.drawEnemyDetail(LIBRARY_ENEMIES.find((e) => e.id === id)!);
    else addDetailBox(this, this.root, this.detailY(), DETAIL_BOTTOM - this.detailY(), this.itemLines(LIBRARY_ITEMS.find((i) => i.id === id)!));
  }

  /** 手に入る所の1行（段階233）：まだ会っていない敵・知らない区画の名前は伏せる */
  private sourceLine(list: readonly LibrarySource[] | undefined): string {
    const v = this.view;
    const areas = new Set([...v.returned.map((id) => AREAS[id]?.name ?? id), ...LIBRARY_ENEMIES.filter((e) => isFound.enemy(v, e.id)).flatMap((e) => e.areas)]);
    const texts = sourceTexts(list, { enemy: (id) => isFound.enemy(v, id), area: (name) => areas.has(name) });
    return `手に入る所：${texts.length ? texts.join('、') : '？？？'}`;
  }

  private snapLines(m: ChainMove): string[] {
    const v = this.view;
    const where = this.sourceLine(LIBRARY_SNAP_SOURCES[m.id]);
    if (!isFound.snap(v, m.id)) return ['？？？（まだ手に入れていないスナップ）', `分類：${chainSnapLook(m).label}`, where];
    return [...snapDetailLines(m, v.lib.combos), where, `所持：${v.snapOwned[m.id] ?? 0}枚`];
  }

  private comboLines(l: ChainLinkDef): string[] {
    const lines = comboDetailLines(l, this.view.lib.combos);
    if (!this.view.lib.combos.includes(l.id)) lines.push('材料がそろった手札で、コンボの帯が出ると見つかる');
    return lines;
  }

  private itemLines(it: LibraryItem): string[] {
    const v = this.view;
    const def = WEAPON_DATA.items[it.id];
    // 段階233：落とす敵だけでなく、宝箱・交換所・依頼・砂の底も「手に入る所」に
    const where = this.sourceLine(LIBRARY_ITEM_SOURCES[it.id]);
    if (!isFound.item(v, it.id)) return ['？？？（まだ手に入れていない素材）', where];
    return [
      `${def.name}（素材・${RARITY_LABEL[def.rarity ?? 'common']}）`,
      where,
      it.keys.length ? `進化の鍵：${it.keys.join('、')}` : '進化の鍵：なし（武器に刻んで能力を上げます）',
      `所持：${v.items[it.id] ?? 0}`,
    ];
  }

  /** 敵の説明：絵と、分かったこと（弱点は当てると・耐性と落とす素材は倒すと分かる） */
  private drawEnemyDetail(e: LibraryEnemy): void {
    const v = this.view;
    const met = v.lib.met[e.id] ?? 0;
    const defeated = v.lib.defeated[e.id] ?? 0;
    const el = (list: readonly string[]) => list.map((x) => ELEMENT_LABEL[x as keyof typeof ELEMENT_LABEL]).join('・');
    let lines: string[];
    if (met === 0) {
      lines = ['？？？（まだ会っていない敵）', `出てくる区画：${e.areas.join('、')}`];
    } else {
      const weakKnown = v.lib.weak[e.id] ?? [];
      const reveals = e.parts.flatMap((p) => p.part?.reveals ?? []);
      const allWeak = [...e.chain.weak, ...reveals];
      const weak = weakKnown.length ? `${el(weakKnown)}${weakKnown.length < allWeak.length ? '・？' : ''}` : allWeak.length === 0 && defeated > 0 ? 'なし' : '？（その属性で当てると分かります）';
      const resist = defeated > 0 ? (e.chain.resist.length ? el(e.chain.resist) : 'なし') : '？（倒すと分かります）';
      const trait = e.chain.trait ? `${CHAIN_TRAIT_TEXT[e.chain.trait]?.name ?? e.chain.trait}：${CHAIN_TRAIT_TEXT[e.chain.trait]?.text ?? ''}` : 'なし';
      const plan = e.chain.pattern.map((m) => `${m.name}（時刻${m.at}${m.all ? '・全体' : ''}）`).join(' → ');
      const t = e.base.dropTable;
      const drops = [t?.common, t?.uncommon, t?.rare, ...(e.base.drops ?? []), ...e.parts.map((p) => p.drop)].filter((x): x is string => !!x).map((id) => WEAPON_DATA.items[id]?.name ?? id);
      const snap = LIBRARY_ENEMY_SNAP[e.id];
      lines = [
        `${e.base.name}${e.boss ? '（ぬし）' : ''}`,
        `会った ${met}・倒した ${defeated}`,
        `弱点：${weak}`,
        `耐性：${resist}`,
        `特徴：${trait}`,
        // 効くギア（段階201）
        ...(e.chain.trait && GEAR_COUNTERS[e.chain.trait]?.length ? [`効くギア：${GEAR_COUNTERS[e.chain.trait]!.map((g) => NAVI_DATA.parts[g]?.name ?? g).join('・')}`] : []),
        `予定の癖：${plan}`,
        ...e.parts.map((p) => {
          const stops = e.chain.pattern.filter((m) => m.requiresPart === p.id).map((m) => `「${m.name}」が来ない`);
          const rev = p.part?.reveals?.length ? `弱点「${el(p.part.reveals)}」が出る` : '';
          return `部位 ${p.name}：壊すと${[...stops, rev].filter(Boolean).join('・') || '素材を落とす'}`;
        }),
        `落とす素材：${defeated > 0 ? drops.join('、') || 'なし' : '？（倒すと分かります）'}`,
        `スナップ：${snap ? (isFound.snap(v, snap) ? CHAIN_SNAPS[snap]?.name : '？？？') : 'なし'}`,
        `出てくる区画：${e.areas.join('、')}`,
      ];
    }
    // 段階232：上に大きな絵と絵の説明文、下に分かったこと
    const title = met === 0 ? '？？？' : lines[0];
    const sub = met === 0 ? '' : lines[1];
    this.drawArtDetail(ENEMY_ART[e.id], met > 0, title, sub, met === 0 ? lines.slice(1) : lines.slice(2), true);
  }

  /** スナップの説明（段階232）：大きな絵と絵の説明文、下に効果とコンボ */
  private drawSnapDetail(m: ChainMove): void {
    const known = isFound.snap(this.view, m.id);
    const lines = this.snapLines(m);
    const look = chainSnapLook(m);
    this.drawArtDetail(snapArt(m.id), known, known ? m.name : '？？？', `${ENEMY_OF_SNAP[m.id] ? '敵のスナップ・' : ''}${look.label}・重さ${m.weight}`, lines.slice(1), false);
  }

  /**
   * 大きな絵の説明の窓（段階232。開発者の声：大きな絵と、絵の説明文）。
   * 左上に大きな絵、その右に名前と絵の説明文（`LIBRARY_ART_NOTES`）、下にルールの説明。まだの物は絵を影にして、説明文を伏せる
   */
  private drawArtDetail(art: string | undefined, known: boolean, title: string, sub: string, rules: readonly string[], enemy: boolean): void {
    const y = this.detailY();
    const h = DETAIL_BOTTOM - y;
    const x = SIDE_PADDING;
    this.root.add(addWindow(this, x, y, ROW_W, h, STYLE.red, STYLE.ink, 0.95));
    // 大きな絵（敵は縦横を保って枠に収める）
    const ax = x + 14 + ART / 2;
    const ay = y + 14 + ART / 2;
    this.root.add(this.add.rectangle(ax, ay, ART, ART, 0x1c1a22));
    if (art && hasImage(this, art)) {
      const img = this.add.image(ax, ay, art);
      if (enemy) img.setScale((ART - 6) / Math.max(img.width, img.height));
      else img.setDisplaySize(ART, ART);
      if (!known) img.setTintFill(0x2a2832).setAlpha(0.9);
      this.root.add(img);
    }
    this.root.add(this.add.rectangle(ax, ay, ART, ART).setStrokeStyle(1.5, 0xffffff, 0.5));
    // 名前・小さな見出し・絵の説明文
    const tx = x + 14 + ART + 12;
    const tw = x + ROW_W - 16 - tx;
    const name = addText(this, tx, y + 14, title, { size: 15, bold: true, color: known ? COLORS.text : COLORS.dimText });
    name.setFontStyle('bold italic');
    if (name.width > tw) name.setScale(tw / name.width, 1);
    this.root.add(name);
    let ny = y + 38;
    if (sub) {
      const subT = addText(this, tx, ny, sub, { size: 10, color: STYLE.redText, bold: true });
      if (subT.width > tw) subT.setScale(tw / subT.width, 1);
      this.root.add(subT);
      ny += 18;
    }
    const noteText = known ? (art ? LIBRARY_ART_NOTES[art] : undefined) ?? '' : enemy ? 'まだ会っていない敵です。会うと、絵と説明がはっきりします。' : 'まだ手に入れていない写真です。手に入れると、絵と説明がはっきりします。';
    const note = addText(this, tx, ny, noteText, { size: 11, wrap: tw, color: known ? '#e9e1cf' : COLORS.dimText }).setLineSpacing(3);
    const noteMax = y + 14 + ART - ny;
    if (note.height > noteMax) note.setScale(noteMax / note.height);
    this.root.add(note);
    // 下：ルールの説明
    const ry = y + 14 + ART + 10;
    this.root.add(this.add.rectangle(x + 14, ry - 5, ROW_W - 28, 1, 0xffffff, 0.15).setOrigin(0));
    const rest = addText(this, x + 14, ry, rules.join('\n'), { size: 11, wrap: ROW_W - 28 }).setLineSpacing(2);
    const restMax = y + h - 8 - ry;
    if (rest.height > restMax) rest.setScale(restMax / rest.height);
    this.root.add(rest);
  }

  private leave(): void {
    if (this.back === 'Title') {
      this.scene.start('Title');
      return;
    }
    const hub = hubBack();
    if (!hub) {
      this.scene.start('Growth');
      return;
    }
    setHubReturn(null);
    this.scene.start(hub.key, hub.data);
  }
}
