// 会話の画面で使う、人・背景・1枚絵・音の一覧（段階22）。台本（scriptM1.ts）はここにある名前だけを使う（テストで確かめる）。
// 絵がまだない物は、色と名前で仮に描く（段階15の決まり：素材がなくても止まらない）
import { BGM, SE } from './sounds';

/** 会話に出る人 */
export interface CastMember {
  /** 立ち絵の台帳の id の頭（portrait.akari なら portrait.akari.smile）。絵がなければ図形で描く */
  portrait?: string;
  /** 台本で使う表情の名前 → 立ち絵の表情の id（絵がない人は、使える表情の一覧として書く） */
  faces: Record<string, string>;
  /** 最初の表情 */
  firstFace: string;
  /** 絵がない時の図形の色 */
  color: number;
  /** 立ち絵の高さ（画面の座標）。構図の違う絵をそろえるため */
  height?: number;
}

const AKARI_FACES = { 笑顔: 'smile', 大笑い: 'laugh', 心配: 'worried', むっ: 'pout', デジャヴ: 'dejavu' };
const HERO_FACES = { 通常: 'normal', 笑顔: 'smile', 驚き: 'surprised', 決意: 'determined' };
/** 絵のない人の表情（名前だけ。絵ができたら台帳の id に替える） */
const names = (...faces: string[]) => Object.fromEntries(faces.map((f) => [f, f]));

export const CAST: Record<string, CastMember> = {
  ハルト: { portrait: 'portrait.hero', faces: HERO_FACES, firstFace: '通常', color: 0x4a7fb5, height: 300 },
  あかり: { portrait: 'portrait.akari', faces: AKARI_FACES, firstFace: '笑顔', color: 0xd06b8a, height: 450 },
  りく: { faces: names('通常', '笑顔', '得意げ', '真剣', 'あせり'), firstFace: '通常', color: 0x6a9a4a },
  子ハルト: { faces: names('通常', '笑顔', '驚き'), firstFace: '通常', color: 0x4a7fb5 },
  子あかり: { faces: names('笑顔', 'むっ', '心配', 'デジャヴ'), firstFace: '笑顔', color: 0xd06b8a },
  子りく: { faces: names('通常', '得意げ', '笑顔', 'あせり'), firstFace: '得意げ', color: 0x6a9a4a },
  ゆうま: { faces: names('通常', '笑顔', '考える', '泣き笑い'), firstFace: '通常', color: 0x8a7a5a },
  写しのゆうま: { faces: names('笑顔'), firstFace: '笑顔', color: 0x9aa0b0 },
  写しのひなの: { faces: names('笑顔', '泣き'), firstFace: '笑顔', color: 0xb0a0b8 },
};

/** 背景。image は台帳の id（なければ上から下への色の帯と名前で仮に描く） */
export interface Backdrop {
  title: string;
  top: number;
  bottom: number;
  image?: string;
}

export const BACKDROPS: Record<string, Backdrop> = {
  black: { title: '黒', top: 0x000000, bottom: 0x000000 },
  white: { title: '白', top: 0xf4f4f0, bottom: 0xdcdcd6 },
  shrine_approach: { title: '夕暮れの神社の参道', top: 0x3a3060, bottom: 0xd07a4a },
  shrine_stalls: { title: '参道（屋台の並び）', top: 0x2e2a58, bottom: 0xc0603a },
  goldfish_stall: { title: '金魚すくいの屋台', top: 0x2a3a60, bottom: 0x3a8ab0 },
  shooting_stall: { title: '射的の屋台', top: 0x3a2a50, bottom: 0xb05a3a },
  shrine_steps: { title: '神社の石段の上', top: 0x1a1e40, bottom: 0x6a4a6a },
  shrine_hill: { title: '神社の裏の高台（夜）', top: 0x0a0e24, bottom: 0x2a2a50 },
  home_kitchen: { title: '施設の台所（朝）', top: 0xf0e2c0, bottom: 0xb8a080 },
  home_kitchen_evening: { title: '施設の台所（夕方）', top: 0xe0a070, bottom: 0x8a6050 },
  classroom: { title: '教室', top: 0xd8e4ec, bottom: 0x9aa8a0 },
  rooftop: { title: '学校の屋上', top: 0x7ab0e0, bottom: 0xe0b080 },
  shopping_street: { title: '商店街', top: 0xa8c8e0, bottom: 0xb09a80 },
  convenience_store: { title: 'コンビニの店内', top: 0xf0f4f4, bottom: 0xc0c8c8 },
  clock_shop: { title: '時計屋の店内（夕暮れ）', top: 0xd07040, bottom: 0x5a3a30 },
  clock_shop_night: { title: '時計屋の店内（夜）', top: 0x202840, bottom: 0x3a2a30 },
  clock_shop_back: { title: '時計屋の奥の部屋', top: 0xb05a3a, bottom: 0x3a2420 },
  library: { title: 'レストピアの蔵書の棚', top: 0x0e1430, bottom: 0x3a3020 },
  festival: { title: '縁日（1-1）', top: 0x2a3060, bottom: 0xc06a40, image: 'map.festival' },
};

/** 1枚絵（なければ色と名前で仮に描く） */
export const CGS: Record<string, Backdrop> = {
  white_city: { title: '1枚絵：白い街（夢）', top: 0xffffff, bottom: 0xd8e0e8 },
  fireworks: { title: '1枚絵：高台で花火を見る3人の後ろ姿', top: 0x0a0e30, bottom: 0x40305a },
  photo_goldfish: { title: '写真：浴衣の小さなあかりが、金魚の袋をふたつ提げている', top: 0x3a3060, bottom: 0xd07a4a },
  noa_passing: { title: '1枚絵：蔵書の棚で、白い服の少女とすれ違う', top: 0x0e1430, bottom: 0x6a8a90 },
};

/**
 * 台本の BGM の名前 → 台帳の id。本番の曲（段階31b）ができるまで、今ある仮の2曲で代わりに流す
 */
export const SCRIPT_BGM: Record<string, string> = {
  title: BGM.title,
  daily: BGM.title,
  prologue: BGM.festival,
  festival: BGM.festival,
  library: BGM.title,
  return: BGM.title,
};

/**
 * 台本の効果音の名前 → 台帳の id。まだ入れていない音は null（鳴らさない。段階31b で効果音ラボから足す）
 */
export const SCRIPT_SE: Record<string, string | null> = {
  tap: SE.tap,
  hit: SE.hit,
  chest: SE.chest,
  encounter: SE.encounter,
  sand: null,
  crowd: null,
  paper: null,
  shot: null,
  miss: null,
  water: null,
  splash: null,
  poi_break: null,
  firework: null,
  drum: null,
  footsteps: null,
  tick: null,
  tick_stop: null,
  alarm: null,
  pan: null,
  chime: null,
  door_slam: null,
  class_laugh: null,
  store_enter: null,
  bag_open: null,
  shutter: null,
  send: null,
  bell: null,
  phone: null,
  noise: null,
  hang_up: null,
  door_open: null,
};

/** 語りの文に流れる砂の色（ヴィクトの鎖の砂時計と同じ暗い金。docs/STORY.md の 2-11） */
export const NARRATION_SAND_COLOR = 0xb08a3a;
