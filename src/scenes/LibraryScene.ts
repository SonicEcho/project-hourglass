import Phaser from 'phaser';
import { hasImage } from '../assets/loader';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { CHAIN_SNAPS, CHAIN_TRAIT_TEXT, ENEMY_ART, LIBRARY_COMBOS, LIBRARY_ENEMIES, LIBRARY_ENEMY_SNAP, LIBRARY_ITEMS, LIBRARY_SNAPS, WEAPON_DATA, type LibraryEnemy, type LibraryItem } from '../data';
import type { ChainLinkDef, ChainMove } from '../core';
import { chainSnapLook, comboDetailLines, comboMaterialNames, ENEMY_OF_SNAP, snapDetailLines } from '../ui/chainSnapText';
import { addIcon } from '../ui/icons';
import { ELEMENT_LABEL } from '../ui/labels';
import { SIDE_PADDING } from '../ui/layout';
import { addBand, addDetailBox, addListRow, addPager, addRowName, addTabs, LIST_COLORS, ROW_GAP, ROW_H, ROW_W, SNAP_CATEGORY, type TabDef } from '../ui/listKit';
import { enterScreen, screenBg } from '../ui/skin';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { waitImages } from '../ui/waitImages';
import { RARITY_LABEL } from '../ui/weaponText';
import { addButton, addText } from '../ui/widgets';
import { isFound, libraryProgress, libraryView, type LibraryView } from './libraryView';
import { hubBack, setHubReturn } from './run';

// ライブラリ（段階167。docs/design/run.md）：見つけたスナップ・コンボ・会った敵・素材の記録。
// アルバム（20枚を組む道具）とは別の、読むだけの画面。まだ見つけていない物も「？？？」で並べ、手がかりを見せる。
// 育成のメニュー（拠点・休憩所）と、タイトルのオプションから開く

type LibraryTab = 'snap' | 'combo' | 'enemy' | 'item';

const TABS: TabDef<LibraryTab>[] = [
  { id: 'snap', label: 'スナップ', color: SNAP_CATEGORY.attack.color },
  { id: 'combo', label: 'コンボ', color: LIST_COLORS.combo },
  { id: 'enemy', label: '敵', color: LIST_COLORS.enemy },
  { id: 'item', label: '素材', color: LIST_COLORS.item },
];

const TAB_Y = 56;
const LIST_Y = 100;
const ROWS = 10;
const DETAIL_Y = LIST_Y + ROWS * (ROW_H + ROW_GAP) + 30;
const DETAIL_H = 220;
/** 敵の説明の窓の絵の大きさ */
const ART = 84;

export interface LibrarySceneData {
  /** タイトルから開いた時（戻る先） */
  back?: 'Title';
}

export class LibraryScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private tab: LibraryTab = 'snap';
  private page = 0;
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
    this.page = 0;
    this.selected = null;
    this.view = libraryView();
    const art = LIBRARY_ENEMIES.map((e) => ENEMY_ART[e.id]).filter((x): x is string => !!x);
    this.render();
    // 敵の絵は、届いてから描き直す
    waitImages(this, art, () => this.render());
  }

  private render(): void {
    this.root.removeAll(true);
    this.root.add(screenBg(this));
    const progress = libraryProgress(this.view);
    this.root.add(addIcon(this, 'star', SIDE_PADDING + 9, 20, 18, COLORS.accent));
    this.root.add(addText(this, SIDE_PADDING + 24, 8, 'ライブラリ', { size: 17, bold: true }));
    const all = Object.values(progress);
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING, 6, '記録', { size: 10, color: COLORS.subText }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING, 18, `${all.reduce((a, x) => a + x[0], 0)}/${all.reduce((a, x) => a + x[1], 0)}`, { size: 20, bold: true, color: COLORS.accentText }).setOrigin(1, 0));
    addTabs(this, this.root, TAB_Y, TABS, this.tab, (id) => {
      this.tab = id;
      this.page = 0;
      this.selected = null;
      this.render();
    });
    const [found, total] = progress[this.tab];
    const what = { snap: '見つけたスナップ', combo: '見つけたコンボ', enemy: '会った敵', item: '手に入れた素材' }[this.tab];
    this.root.add(addText(this, SIDE_PADDING, 82, `${what} ${found}/${total}`, { size: 11, color: COLORS.subText }).setOrigin(0, 0.5));

    const ids = this.ids();
    const pages = Math.max(1, Math.ceil(ids.length / ROWS));
    this.page = Math.min(this.page, pages - 1);
    ids.slice(this.page * ROWS, (this.page + 1) * ROWS).forEach((id, i) => this.drawRow(id, LIST_Y + i * (ROW_H + ROW_GAP)));
    addPager(this, this.root, LIST_Y + ROWS * (ROW_H + ROW_GAP) + 12, this.page, pages, (d) => {
      this.page += d;
      this.render();
    });
    this.drawDetail();

    addButton(this, this.root, GAME_WIDTH / 2, 800, ROW_W, 52, this.back === 'Title' ? 'タイトルへ戻る' : (hubBack()?.label ?? '戻る'), { onTap: () => this.leave() }, { size: 15, bold: true });
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

  private drawRow(id: string, top: number): void {
    const v = this.view;
    const known = isFound[this.tab](v, id);
    const cy = addListRow(this, this.root, top, { dim: !known, selected: this.selected === id, onTap: () => this.pick(id) });
    const bandW = 88;
    const nameX = SIDE_PADDING + bandW + 10;
    let name = '？？？';
    let right = '';
    let tagW = 0;
    if (this.tab === 'snap') {
      const m = CHAIN_SNAPS[id];
      const look = chainSnapLook(m);
      addBand(this, this.root, SIDE_PADDING + 4, cy, bandW, look.color, look.label, look.icon, !known);
      if (known) name = m.name;
      right = known ? `持っている ${v.snapOwned[id] ?? 0}` : '';
      // 敵のスナップは、名前の前に紫の「敵」の印
      if (ENEMY_OF_SNAP[id]) {
        this.root.add(this.add.rectangle(nameX + 9, cy, 18, 18, LIST_COLORS.enemy, known ? 0.9 : 0.4).setRounded(4));
        this.root.add(addText(this, nameX + 9, cy, '敵', { size: 10, bold: true, color: '#101820' }).setOrigin(0.5));
        tagW = 22;
      }
    } else if (this.tab === 'combo') {
      const l = LIBRARY_COMBOS.find((x) => x.id === id)!;
      addBand(this, this.root, SIDE_PADDING + 4, cy, bandW, LIST_COLORS.combo, '★ コンボ', null, !known);
      if (known) name = l.move.name;
      right = known ? comboMaterialNames(l) : '';
    } else if (this.tab === 'enemy') {
      const e = LIBRARY_ENEMIES.find((x) => x.id === id)!;
      addBand(this, this.root, SIDE_PADDING + 4, cy, bandW, LIST_COLORS.enemy, e.boss ? 'ぬし' : 'ノイズ', null, !known);
      if (known) name = e.base.name;
      right = known ? `倒した ${v.lib.defeated[id] ?? 0}` : '';
    } else {
      const it = WEAPON_DATA.items[id];
      addBand(this, this.root, SIDE_PADDING + 4, cy, bandW, LIST_COLORS.item, `素材・${RARITY_LABEL[it.rarity ?? 'common']}`, null, !known);
      if (known) name = it.name;
      right = known ? `持っている ${v.items[id] ?? 0}` : '';
    }
    const sub = right ? addText(this, GAME_WIDTH - SIDE_PADDING - 8, cy, right, { size: 11, color: COLORS.subText }).setOrigin(1, 0.5) : null;
    const subW = sub ? Math.min(sub.width, 130) : 0;
    if (sub && sub.width > subW) sub.setScale(subW / sub.width);
    if (sub) this.root.add(sub);
    addRowName(this, this.root, nameX + tagW, cy, name, GAME_WIDTH - SIDE_PADDING - 16 - subW - nameX - tagW, !known);
  }

  private drawDetail(): void {
    const id = this.selected;
    if (!id) {
      const hint = {
        snap: ['名前をタップすると、スナップの説明が出る', '区画のぬしを倒した時や、敵に★3で早く勝った時に手に入る'],
        combo: ['名前をタップすると、コンボの説明が出る', 'まだのコンボは手がかりが読める。材料が手札にそろうと、戦闘で見つかる'],
        enemy: ['名前をタップすると、敵の説明が出る', '弱点は、その属性で当てると分かる。落とす素材は、倒すと分かる'],
        item: ['名前をタップすると、素材の説明が出る', '素材は敵が落とす。武器の進化の鍵になる物もある'],
      }[this.tab];
      addDetailBox(this, this.root, DETAIL_Y, DETAIL_H, hint);
      return;
    }
    if (this.tab === 'snap') addDetailBox(this, this.root, DETAIL_Y, DETAIL_H, this.snapLines(CHAIN_SNAPS[id]));
    else if (this.tab === 'combo') addDetailBox(this, this.root, DETAIL_Y, DETAIL_H, this.comboLines(LIBRARY_COMBOS.find((l) => l.id === id)!));
    else if (this.tab === 'enemy') this.drawEnemyDetail(LIBRARY_ENEMIES.find((e) => e.id === id)!);
    else addDetailBox(this, this.root, DETAIL_Y, DETAIL_H, this.itemLines(LIBRARY_ITEMS.find((i) => i.id === id)!));
  }

  private snapLines(m: ChainMove): string[] {
    const v = this.view;
    if (!isFound.snap(v, m.id)) {
      const foe = ENEMY_OF_SNAP[m.id];
      return ['？？？（まだ手に入れていないスナップ）', `分類：${chainSnapLook(m).label}`, foe && isFound.enemy(v, LIBRARY_ENEMIES.find((e) => e.base.name === foe)?.id ?? '') ? `手がかり：${foe}に★3で早く勝つと、ときどき手に入る` : '手がかり：区画のぬしや、まだ会っていない敵が持っている'];
    }
    return [...snapDetailLines(m, v.lib.combos), `持っている：${v.snapOwned[m.id] ?? 0}枚`];
  }

  private comboLines(l: ChainLinkDef): string[] {
    const lines = comboDetailLines(l, this.view.lib.combos);
    if (!this.view.lib.combos.includes(l.id)) lines.push('材料がそろった手札で、コンボの帯が出ると見つかる');
    return lines;
  }

  private itemLines(it: LibraryItem): string[] {
    const v = this.view;
    const def = WEAPON_DATA.items[it.id];
    // 落とす敵は、会った敵なら名前、まだなら「？？？」
    const sources = it.sources.map((s) => (LIBRARY_ENEMIES.some((e) => s.startsWith(e.base.name) && isFound.enemy(v, e.id)) ? s : '？？？'));
    if (!isFound.item(v, it.id)) return ['？？？（まだ手に入れていない素材）', `手がかり：${[...new Set(sources)].join('、')}が落とす`];
    return [
      `${def.name}（素材・${RARITY_LABEL[def.rarity ?? 'common']}）`,
      `落とす：${[...new Set(sources)].join('、')}`,
      it.keys.length ? `進化の鍵：${it.keys.join('、')}` : '進化の鍵：なし（武器に刻んで能力を上げる）',
      `持っている：${v.items[it.id] ?? 0}`,
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
      const weak = weakKnown.length ? `${el(weakKnown)}${weakKnown.length < allWeak.length ? '・？' : ''}` : allWeak.length === 0 && defeated > 0 ? 'なし' : '？（その属性で当てると分かる）';
      const resist = defeated > 0 ? (e.chain.resist.length ? el(e.chain.resist) : 'なし') : '？（倒すと分かる）';
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
        `予定の癖：${plan}`,
        ...e.parts.map((p) => {
          const stops = e.chain.pattern.filter((m) => m.requiresPart === p.id).map((m) => `「${m.name}」が来ない`);
          const rev = p.part?.reveals?.length ? `弱点「${el(p.part.reveals)}」が出る` : '';
          return `部位 ${p.name}：壊すと${[...stops, rev].filter(Boolean).join('・') || '素材を落とす'}`;
        }),
        `落とす素材：${defeated > 0 ? drops.join('、') || 'なし' : '？（倒すと分かる）'}`,
        `スナップ：${snap ? (isFound.snap(v, snap) ? CHAIN_SNAPS[snap]?.name : '？？？') : 'なし'}`,
        `出てくる区画：${e.areas.join('、')}`,
      ];
    }
    this.root.add(this.add.rectangle(SIDE_PADDING, DETAIL_Y, ROW_W, DETAIL_H, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(1, COLORS.border));
    const art = ENEMY_ART[e.id];
    if (art && hasImage(this, art)) {
      const img = this.add.image(GAME_WIDTH - SIDE_PADDING - 8 - ART / 2, DETAIL_Y + 8 + ART / 2, art);
      img.setScale(ART / Math.max(img.width, img.height));
      // 会っていない敵は影だけ
      if (met === 0) img.setTintFill(0x0b1020).setAlpha(0.8);
      this.root.add(img);
    }
    // 上の2行は絵の左に、残りは窓の幅いっぱいに
    const headW = ROW_W - 20 - ART - 8;
    const head = addText(this, SIDE_PADDING + 10, DETAIL_Y + 8, lines.slice(0, 2).join('\n'), { size: 12, wrap: headW });
    this.root.add(head);
    const rest = addText(this, SIDE_PADDING + 10, DETAIL_Y + 8 + Math.max(head.height + 4, met === 0 ? 0 : 36), lines.slice(2).join('\n'), { size: 11, wrap: ROW_W - 20 }).setLineSpacing(2);
    if (rest.y + rest.height > DETAIL_Y + DETAIL_H - 6) rest.setScale((DETAIL_Y + DETAIL_H - 6 - rest.y) / rest.height);
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
