import type { DamageType } from '../core';

/**
 * 描画の倍率。高解像度のスマホで文字がにじまないよう、キャンバスを端末の画素密度に合わせて大きく作り、
 * カメラのズームで 390×844 の座標系のまま描く。
 */
export const RENDER_SCALE = Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1)));

export const FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif';

/** 見出しとボタンの書体（段階32a。Zen Maru Gothic の太字を、ゲームで使う字だけに絞ったもの。読み込みは assets/fonts.ts） */
export const HEADING_FONT_NAME = 'RestopiaHeading';
export const FONT_HEADING = `"${HEADING_FONT_NAME}", ${FONT}`;

// 画面の部品の色（段階32a で藍寄りに整えた。docs/ART.md の 2.「全体・画面の部品：茜色と藍色、砂色」）
export const COLORS = {
  bg: 0x121831,
  panel: 0x1d2544,
  panelLight: 0x2b3560,
  border: 0x4a5888,
  text: '#ffffff',
  subText: '#aab4d4',
  dimText: '#646f94',
  accent: 0xf2c45a,
  accentText: '#f2c45a',
  select: 0xff5a5a,
  hp: 0x4cd07d,
  hpLow: 0xff6b4a,
  mp: 0x5aa8ff,
  barBg: 0x0a0e1e,
  disabled: 0x232a44,
  ally: 0x3f7fbf,
  enemy: 0xbf4f4f,
  heal: '#6dff9e',
  damage: '#ffffff',
  allyDamage: '#ff8a7a',
  weak: '#ffd84a',
};

export { ELEMENT_LABEL } from './labels';

export const ELEMENT_COLOR: Record<DamageType, number> = {
  physical: 0x9aa5b1,
  fire: 0xff6b4a,
  ice: 0x6bc8ff,
  thunder: 0xffc83a,
  magic: 0xc58bff,
};

/** 仮素材の敵の色 */
export const ENEMY_COLOR: Record<string, number> = {
  slime: 0x5ccf6a,
  frostBat: 0x7fa8ff,
  armorDog: 0xa08060,
  distortedBeast: 0x9a5cd0,
  goldfishNoise: 0xff7a4a,
  balloonNoise: 0x5ab8e8,
  maskNoise: 0xe8d8b0,
  cottonNoise: 0xf5b8d8,
  goldfishBowlLord: 0x4a9ad0,
};

export const ALLY_COLOR: Record<string, number> = {
  hero: 0x4a90e2,
  akari: 0xe27a9a,
  mio: 0xf0b040,
};

export const toCss = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

/** 画面の部品の形（段階32a） */
export const SKIN = {
  /** ボタンの角の丸み */
  buttonRadius: 10,
  /** 枠（パネル）の角の丸み */
  panelRadius: 10,
  /** ボタンの影のずれ */
  shadowOffset: 3,
  /** 押した時の縮み */
  pressScale: 0.95,
  /** 背景の色の移り変わり（上・真ん中・下）と、地平の夕焼けの色 */
  bgTop: 0x1f2752,
  bgMiddle: 0x121831,
  bgBottom: 0x1d1830,
  bgGlow: 0xe07a4f,
  /** 砂の粒の色（砂色。docs/STORY.md の暗い金より明るい、画面の部品用） */
  sand: 0xe8c784,
} as const;

/** 動きの長さ（ミリ秒。段階32a 調整1） */
export const MOTION = {
  /** 画面に入る時の明転 */
  enterMs: 320,
  /** 窓が出る */
  popMs: 220,
  /** 窓が消える */
  closeMs: 130,
  /** 数を数える・ゲージが動く */
  countMs: 450,
} as const;

/** 戦闘で敵のいる場所の地面の色（段階32a 調整1。奥が明るめ、手前が暗い） */
export const STAGE = {
  floorTop: 0x2a2f5a,
  floorBottom: 0x0c0f22,
} as const;
