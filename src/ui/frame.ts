import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ALLY_FACE, FACE_CROPS } from '../data';
import { hasImage } from '../assets/loader';
import { addIcon, type IconKind } from './icons';
import { SIDE_PADDING } from './layout';
import { faceImage } from './portrait';
import { ensureSandTexture } from './skin';
import { ALLY_COLOR, COLORS, FONT, STYLE } from './theme';
import { addButton, addSlant, addText, type ButtonOptions, makePressable } from './widgets';

// 育成の5つの画面（拠点・並び・星図・武器・ムーブメント）に共通の枠（段階141。docs/ART.md の 5-9「そろえ方の決まり」）。
// 上の見出し、仲間の顔のタブ、下の戻るボタン、金のボタン、暗い背景を、どの画面でも同じ形と場所で描く。
// 色は金を1つだけの差し色にする（選んでいる物と、押してほしいボタン）。中身（各画面の絵）は画面ごとに描く。
// 段階225（docs/milestones/M3_ui_polish.md の 6.）：テーマ「スタイリッシュ」に。差し色は紅、知らせ（進化できる等）は黄（gold の名前のまま）

/** 枠の場所と大きさ（390×844 の座標） */
export const FRAME = {
  /** 見出しの高さ */
  headerH: 48,
  /** 顔のタブの上の端と高さ */
  tabsTop: 52,
  tabsH: 58,
  /** タブの下から中身を描き始める所 */
  contentTop: 116,
  /** 戻るボタンの真ん中と高さ */
  backY: 800,
  backH: 48,
  /** 金のボタンの真ん中（戻るボタンのすぐ上） */
  mainY: 744,
} as const;

/** 枠の色 */
export const FRAME_COLORS = {
  /** 知らせの色（段階225 から黄。進化できる・開けられる・選んでいる物の字） */
  gold: STYLE.yellow,
  goldText: STYLE.yellowText,
  /** 背景の暗い色（上・下） */
  bgTop: 0x1a0a0e,
  bgBottom: 0x050405,
  /** タブ・戻るボタンの地 */
  panel: STYLE.ink,
  /** 選んでいない物のふち */
  line: STYLE.line,
  /** 押してほしいボタンの地と字（段階225 から紅に白い斜体） */
  goldFill: STYLE.red,
  goldInk: '#ffffff',
} as const;

/** 押してほしい大事なボタン（段階225 から紅に白い斜体。名前は前のまま）。addButton にそのまま渡す */
export const GOLD_BUTTON: ButtonOptions = { fill: FRAME_COLORS.goldFill, stroke: 0xffffff, strokeWidth: 2, textColor: FRAME_COLORS.goldInk, bold: true, italic: true, size: 16 };

/** ふつうのボタン（黒い地に白いふち）。addButton にそのまま渡す */
export const PLAIN_BUTTON: ButtonOptions = { fill: FRAME_COLORS.panel, stroke: 0xffffff, strokeWidth: 1.5 };

const backdrops = new WeakMap<Phaser.Scene, Phaser.GameObjects.GameObject>();

/**
 * 枠の背景：上が少し明るい暗い地と、ゆっくり舞う金の粒。画面の一番下に1回だけ作る（skin.ts の screenBg と同じ使い方）。
 * top・bottom で色を替えられる（星図は夜空の色）。返すのは透明の四角（タップを受けたい時に使う）
 */
export function frameBg(scene: Phaser.Scene, top: number = FRAME_COLORS.bgTop, bottom: number = FRAME_COLORS.bgBottom): Phaser.GameObjects.Rectangle {
  const made = backdrops.get(scene);
  if (!made || !made.active || !scene.children.exists(made)) {
    const g = scene.add.graphics().setDepth(-100);
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // 段階225：紅の細い斜めの線をうっすら
    g.lineStyle(2, STYLE.red, 0.07);
    for (let x = -GAME_HEIGHT; x < GAME_WIDTH; x += 16) g.lineBetween(x, GAME_HEIGHT, x + GAME_HEIGHT * 0.58, 0);
    ensureSandTexture(scene);
    const dust = scene.add.particles(0, 0, 'ui-sand', {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      speedY: { min: -10, max: -4 },
      speedX: { min: -3, max: 3 },
      scale: { min: 0.25, max: 0.7 },
      alpha: { start: 0.3, end: 0 },
      tint: STYLE.red,
      lifespan: { min: 6000, max: 11000 },
      frequency: 520,
    });
    dust.setDepth(-99);
    dust.fastForward(9000);
    g.once(Phaser.GameObjects.Events.DESTROY, () => dust.destroy());
    backdrops.set(scene, g);
  }
  return scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001).setOrigin(0);
}

/** 見出しの右上に出す、その画面で大事な数（1つだけ。value が空なら label を一言として出す） */
export interface HeaderValue {
  label: string;
  value: string;
}

/**
 * 見出し：左上に金の丸に入れたアイコンと画面の名前。右上に大事な数を1つ（なくてもよい）。
 * 返すのは右上の数の文字（数を数えるように動かしたい時に使う）
 */
export function frameHeader(scene: Phaser.Scene, root: Phaser.GameObjects.Container, icon: IconKind | 'hourglass' | 'album', title: string, right?: HeaderValue): Phaser.GameObjects.Text | undefined {
  const cy = FRAME.headerH / 2 + 2;
  const g = scene.add.graphics();
  g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85, 0.85, 0, 0);
  g.fillRect(0, 0, GAME_WIDTH, FRAME.headerH + 6);
  root.add(g);
  // 段階225：紅の斜めの箱にアイコン、太い斜体の名前と紅の影、下に紅の斜めの帯
  const ix = SIDE_PADDING + 16;
  root.add(addSlant(scene, ix, cy, 30, 28, STYLE.red));
  root.add(drawHeaderIcon(scene, icon, ix, cy));
  const t = addText(scene, ix + 24, cy, title, { size: 21, bold: true }).setOrigin(0, 0.5);
  t.setFontFamily(FONT).setFontStyle('bold italic').setLetterSpacing(2).setShadow(3, 3, STYLE.redText, 0, false, true);
  root.add(t);
  const left = ix - 16;
  const lineW = t.x + t.width + 30 - left;
  root.add(addSlant(scene, left + lineW / 2, cy + 19, lineW, 4, STYLE.red));
  if (!right) return undefined;
  const rx = GAME_WIDTH - SIDE_PADDING - 4;
  // 数がない時は、右上に小さな一言だけ
  if (right.value === '') {
    root.add(addText(scene, rx, cy, right.label, { size: 11, color: COLORS.subText }).setOrigin(1, 0.5));
    return undefined;
  }
  root.add(addText(scene, rx, cy - 16, right.label, { size: 10, color: COLORS.subText }).setOrigin(1, 0));
  const v = addText(scene, rx, cy - 3, right.value, { size: 20, bold: true, color: FRAME_COLORS.goldText }).setOrigin(1, 0);
  root.add(v);
  return v;
}

function drawHeaderIcon(scene: Phaser.Scene, icon: IconKind | 'hourglass' | 'album', x: number, y: number): Phaser.GameObjects.Graphics {
  if (icon !== 'hourglass' && icon !== 'album') return addIcon(scene, icon, x, y, 15, 0xffffff);
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0xffffff, 1).lineStyle(1.6, 0xffffff, 1);
  if (icon === 'hourglass') {
    // 砂時計：上下の板と、2つの三角
    g.fillRect(-6, -8, 12, 2).fillRect(-6, 6, 12, 2);
    g.fillTriangle(-5, -6, 5, -6, 0, 0).fillTriangle(-5, 6, 5, 6, 0, 0);
  } else {
    // アルバム：重ねた2枚の写真
    g.strokeRect(-6, -5, 10, 10);
    g.fillRect(-3, -8, 10, 10);
  }
  return g;
}

/** 顔のタブの1人分 */
export interface FaceTab {
  id: string;
  name: string;
  /** 名前の下の小さな一言（Lv・ギアの数など） */
  sub?: string;
  /** 一言の色（知らせたい時。進化できる・狂いがある） */
  subColor?: string;
}

/**
 * 仲間の顔のタブ（星図・武器・ムーブメントで同じ形と場所）。今の人は金のふちで光る。
 * 顔は立ち絵から丸く切り出す（絵がない人は、その人の色の丸に名前の1文字）
 */
export function faceTabs(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  tabs: FaceTab[],
  current: string,
  handlers: { onTap: (id: string) => void; onLongPress?: (id: string) => void },
): void {
  const top = FRAME.tabsTop;
  const h = FRAME.tabsH;
  const gap = 5;
  const n = tabs.length;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  tabs.forEach((tab, i) => {
    const x = SIDE_PADDING + i * (w + gap);
    const cx = x + w / 2;
    const on = tab.id === current;
    // 段階225：斜めの板。今の人は紅に白いふち
    root.add(addSlant(scene, cx + 3, top + h / 2 + 3, w, h, 0x000000, 0.7));
    const face = addSlant(scene, cx, top + h / 2, w, h, on ? STYLE.red : FRAME_COLORS.panel, on ? 1 : 0.9);
    face.setStrokeStyle(on ? 2 : 1.5, on ? 0xffffff : FRAME_COLORS.line);
    root.add(face);
    const rect = scene.add.rectangle(x, top, w, h, 0xffffff, 0.001).setOrigin(0);
    root.add(rect);
    // 顔（ふちはその人の色）
    const fy = top + 18;
    const r = 13;
    const color = ALLY_COLOR[tab.id] ?? COLORS.ally;
    const faceId = ALLY_FACE[tab.id];
    if (faceId && hasImage(scene, faceId)) {
      root.add(scene.add.circle(cx, fy, r + 1, 0x000000));
      root.add(faceImage(scene, faceId, cx, fy, r, FACE_CROPS[tab.id]));
    } else {
      root.add(scene.add.circle(cx, fy, r, color, 0.85));
      root.add(addText(scene, cx, fy, tab.name.slice(0, 1), { size: 13, bold: true }).setOrigin(0.5));
    }
    root.add(scene.add.circle(cx, fy, r + 1).setStrokeStyle(1.5, on ? 0xffffff : color));
    root.add(addText(scene, cx, top + 39, tab.name, { size: 11, bold: true, color: COLORS.text }).setOrigin(0.5).setFontStyle('bold italic'));
    if (tab.sub) root.add(addText(scene, cx, top + 51, tab.sub, { size: 9, color: tab.subColor ?? COLORS.subText }).setOrigin(0.5));
    makePressable(rect, {
      onTap: () => handlers.onTap(tab.id),
      onLongPress: handlers.onLongPress && (() => handlers.onLongPress!(tab.id)),
    });
  });
}

/** 下の戻るボタン（どの画面も同じ場所と形） */
export function backButton(scene: Phaser.Scene, root: Phaser.GameObjects.Container, label: string, onTap: () => void): Phaser.GameObjects.Rectangle {
  return addButton(scene, root, GAME_WIDTH / 2, FRAME.backY, GAME_WIDTH - SIDE_PADDING * 2 - 8, FRAME.backH, label, { onTap }, {
    ...PLAIN_BUTTON,
    strokeWidth: 2,
    size: 15,
    bold: true,
  });
}

/**
 * 照らす案内（段階236）で使う、共通の枠の場所：見出しの右の数（points）・顔のタブ（tabs）・戻るボタン（back）。
 * ほかの名前は null（画面が自分で返す）
 */
export function frameCoachRect(target: string): { x: number; y: number; w: number; h: number } | null {
  if (target === 'points') return { x: GAME_WIDTH - 124, y: 2, w: 120, h: FRAME.headerH };
  if (target === 'tabs') return { x: 4, y: FRAME.tabsTop - 2, w: GAME_WIDTH - 8, h: FRAME.tabsH + 4 };
  if (target === 'back') return { x: 4, y: FRAME.backY - FRAME.backH / 2 - 4, w: GAME_WIDTH - 8, h: FRAME.backH + 8 };
  return null;
}
