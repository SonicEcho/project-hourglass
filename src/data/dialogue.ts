// 会話の画面で使う、人・背景・1枚絵・音の一覧（段階22）。台本（scriptM1.ts）はここにある名前だけを使う（テストで確かめる）。
// 絵がまだない物は、色と名前で仮に描く（段階15の決まり：素材がなくても止まらない）
import { BGM, SE } from './sounds';

/**
 * 会話の文字の音の声色（段階22の試し。高さは Hz）。
 * スマホの小さいスピーカーは低い音（およそ 250Hz より下）がほとんど出ないので、高さは 250〜800Hz にする（テストで確かめる）。
 * 音色ごとの聞こえ方の差は、鳴らす時に WAVE_GAIN で補正する
 */
export interface BlipVoice {
  pitch: number;
  wave: OscillatorType;
  /** 電話の声：高い音と低い音を削って、こもった音にする */
  phone?: boolean;
}

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
  /** 文字の音の声色（段階22の試し） */
  voice: BlipVoice;
  /**
   * まだ絵のない表情 → 代わりに出す、絵のある表情（段階22の調整6）。台本は増やした表情で書いておき、絵が届いたら差し替えるだけで済むように
   */
  fallback?: Record<string, string>;
}

// 表情（段階18a の5つ・4つに、段階22の調整6で足した表情。足した表情の絵は段階31a で作る。id は台帳の portrait.<人>.<id>）
const AKARI_FACES = {
  笑顔: 'smile',
  大笑い: 'laugh',
  心配: 'worried',
  むっ: 'pout',
  デジャヴ: 'dejavu',
  驚き: 'surprised',
  照れ: 'shy',
  悲しい: 'sad',
  真剣: 'serious',
  困り笑い: 'wry',
  微笑み: 'gentle',
};
const HERO_FACES = {
  通常: 'normal',
  笑顔: 'smile',
  驚き: 'surprised',
  決意: 'determined',
  あきれ: 'exasperated',
  困り: 'troubled',
  悲しい: 'sad',
  照れ: 'shy',
  苦笑い: 'wry',
};
const RIKU_FACES = {
  通常: 'normal',
  笑顔: 'smile',
  得意げ: 'proud',
  真剣: 'serious',
  あせり: 'flustered',
  驚き: 'surprised',
  にやり: 'smirk',
  悲しい: 'sad',
};
/** 絵のない人の表情（名前だけ。絵ができたら台帳の id に替える） */
const names = (...faces: string[]) => Object.fromEntries(faces.map((f) => [f, f]));

/** 子どものころの3人の立ち絵の高さ。高校生（450）より小さく出して、背の低さを表す（docs/ART.md の 5-2 の 6） */
const YOUNG_HEIGHT = 360;
/**
 * 子どものころの3人の表情。drawn は絵のある表情 → 台帳の id、base は最初の表情（絵のある表情の1つ）。
 * 絵のない表情は、絵が届くまで base の絵で代わりに出す。絵が届いたら drawn に足す
 */
function young(faces: string[], drawn: Record<string, string>, base: string): Pick<CastMember, 'faces' | 'firstFace' | 'fallback'> {
  return {
    faces: Object.fromEntries(faces.map((f) => [f, drawn[f] ?? f])),
    firstFace: base,
    fallback: Object.fromEntries(faces.filter((f) => !(f in drawn)).map((f) => [f, base])),
  };
}

export const CAST: Record<string, CastMember> = {
  ハルト: { portrait: 'portrait.hero', faces: HERO_FACES, firstFace: '通常', color: 0x4a7fb5, height: 450, voice: { pitch: 300, wave: 'sawtooth' } },
  あかり: { portrait: 'portrait.akari', faces: AKARI_FACES, firstFace: '笑顔', color: 0xd06b8a, height: 450, voice: { pitch: 600, wave: 'triangle' } },
  りく: { portrait: 'portrait.riku', faces: RIKU_FACES, height: 450, firstFace: '通常', color: 0x6a9a4a, voice: { pitch: 370, wave: 'square' } },
  子ハルト: { portrait: 'portrait.young_hero', ...young(['通常', '笑顔', '驚き', '照れ', '困り'], { 通常: 'normal', 笑顔: 'smile' }, '通常'), color: 0x4a7fb5, height: YOUNG_HEIGHT, voice: { pitch: 440, wave: 'sawtooth' } },
  子あかり: {
    portrait: 'portrait.young_akari',
    ...young(['笑顔', 'むっ', '心配', 'デジャヴ', '驚き', '大笑い', '照れ', '悲しい'], { 笑顔: 'smile', 心配: 'worried' }, '笑顔'),
    color: 0xd06b8a,
    height: YOUNG_HEIGHT,
    voice: { pitch: 760, wave: 'triangle' },
  },
  子りく: {
    portrait: 'portrait.young_riku',
    ...young(['通常', '得意げ', '笑顔', 'あせり', '驚き', 'にやり', '照れ', '真剣'], { 得意げ: 'proud', 笑顔: 'smile', 真剣: 'serious' }, '得意げ'),
    color: 0x6a9a4a,
    height: YOUNG_HEIGHT,
    voice: { pitch: 500, wave: 'square' },
  },
  ゆうま: { faces: names('通常', '笑顔', '考える', '泣き笑い', '苦笑い', '驚き'), firstFace: '通常', color: 0x8a7a5a, voice: { pitch: 290, wave: 'square' } },
  写しのゆうま: { faces: names('笑顔'), firstFace: '笑顔', color: 0x9aa0b0, voice: { pitch: 540, wave: 'square' } },
  写しのひなの: { faces: names('笑顔', '泣き'), firstFace: '笑顔', color: 0xb0a0b8, voice: { pitch: 700, wave: 'square' } },
};

/** 立ち絵を出さない人（声だけ・電話）の文字の音の声色。ここにない人は VOICE_DEFAULT */
export const VOICE_ONLY: Record<string, BlipVoice> = {
  担任: { pitch: 270, wave: 'square' },
  施設の子ども: { pitch: 720, wave: 'triangle' },
  屋台のおじさん: { pitch: 260, wave: 'sawtooth' },
  金魚すくいのおじさん: { pitch: 260, wave: 'sawtooth' },
  わたあめ屋: { pitch: 280, wave: 'sawtooth' },
  浴衣の女の人: { pitch: 640, wave: 'sine' },
  ひなの: { pitch: 620, wave: 'triangle' },
  '？？？': { pitch: 700, wave: 'sine' },
};
export const VOICE_DEFAULT: BlipVoice = { pitch: 400, wave: 'triangle' };
/**
 * 音色ごとの大きさの補正。四角い波（square）は倍音が多くてよく響き、三角の波（triangle）やなめらかな波（sine）は小さく聞こえるので、
 * どの音色でも同じくらいの大きさに聞こえるようにそろえる
 */
export const WAVE_GAIN: Record<OscillatorType, number> = { square: 0.55, sawtooth: 0.75, triangle: 1.6, sine: 1.9, custom: 1 };
/** 文字の音の高さの範囲（Hz。スマホのスピーカーで聞こえる高さ） */
export const VOICE_PITCH_RANGE = { min: 250, max: 800 };

/** 文字の音を鳴らす間隔（何文字ごとか）。句読点や記号では鳴らさない */
export const BLIP_EVERY = 2;

/** 背景に流す空気（提灯の灯り、星、舞う砂） */
export type Ambient = 'lanterns' | 'stars' | 'dust';

/** 背景。image は台帳の id（なければ上から下への色の帯と名前で仮に描く） */
export interface Backdrop {
  title: string;
  top: number;
  bottom: number;
  image?: string;
  /** 絵に重ねる色（同じ絵を夜などに使い回す時） */
  tint?: number;
  ambient?: Ambient;
  /** 出ている間、小さく鳴り続ける環境音（効果音の台帳の id。段階32b 調整3） */
  ambienceSe?: string;
}

export const BACKDROPS: Record<string, Backdrop> = {
  black: { title: '黒', top: 0x000000, bottom: 0x000000 },
  white: { title: '白', top: 0xf4f4f0, bottom: 0xdcdcd6 },
  shrine_approach: { title: '夕暮れの神社の参道', top: 0x3a3060, bottom: 0xd07a4a, image: 'bg.shrine_approach', ambient: 'lanterns' },
  shrine_stalls: { title: '参道（屋台の並び）', top: 0x2e2a58, bottom: 0xc0603a, image: 'bg.shrine_approach', ambient: 'lanterns', ambienceSe: SE.crowd },
  goldfish_stall: { title: '金魚すくいの屋台', top: 0x2a3a60, bottom: 0x3a8ab0, ambient: 'lanterns', ambienceSe: SE.crowd },
  shooting_stall: { title: '射的の屋台', top: 0x3a2a50, bottom: 0xb05a3a, ambient: 'lanterns', ambienceSe: SE.crowd },
  shrine_steps: { title: '神社の石段の上', top: 0x1a1e40, bottom: 0x6a4a6a, ambient: 'stars' },
  shrine_hill: { title: '神社の裏の高台（夜）', top: 0x0a0e24, bottom: 0x2a2a50, ambient: 'stars' },
  home_kitchen: { title: '施設の台所（朝）', top: 0xf0e2c0, bottom: 0xb8a080 },
  home_kitchen_evening: { title: '施設の台所（夕方）', top: 0xe0a070, bottom: 0x8a6050 },
  classroom: { title: '教室', top: 0xd8e4ec, bottom: 0x9aa8a0, image: 'bg.classroom' },
  rooftop: { title: '学校の屋上', top: 0x7ab0e0, bottom: 0xe0b080 },
  shopping_street: { title: '商店街', top: 0xa8c8e0, bottom: 0xb09a80, image: 'bg.shopping_street' },
  convenience_store: { title: 'コンビニの店内', top: 0xf0f4f4, bottom: 0xc0c8c8 },
  clock_shop: { title: '時計屋の店内（夕暮れ）', top: 0xd07040, bottom: 0x5a3a30, image: 'bg.clock_shop', ambient: 'dust' },
  clock_shop_night: { title: '時計屋の店内（夜）', top: 0x202840, bottom: 0x3a2a30, image: 'bg.clock_shop', tint: 0x5a6aa8, ambient: 'dust' },
  clock_shop_back: { title: '時計屋の奥の部屋', top: 0xb05a3a, bottom: 0x3a2420, image: 'bg.clock_shop_back', ambient: 'dust' },
  library: { title: 'レストピアの蔵書の棚', top: 0x0e1430, bottom: 0x3a3020, image: 'bg.library', ambient: 'dust' },
  festival: { title: '縁日（1-1）', top: 0x2a3060, bottom: 0xc06a40, image: 'map.festival', ambient: 'lanterns' },
};

/** 立ち絵の芝居の動き（@act で使う。表情が替わった時にも FACE_MOTIONS で自動で動く） */
export const ACTOR_MOTIONS = ['hop', 'bounce', 'shake', 'sink', 'rise', 'step', 'sway', 'nod'] as const;
export type ActorMotion = (typeof ACTOR_MOTIONS)[number];

/** 表情が替わった時の動き（驚き → 跳ねる、大笑い → 弾む、むっ → ぷるっと震える、心配 → 少し沈む など） */
export const FACE_MOTIONS: Record<string, ActorMotion> = {
  驚き: 'hop',
  大笑い: 'bounce',
  得意げ: 'nod',
  むっ: 'shake',
  あせり: 'shake',
  心配: 'sink',
  泣き: 'sink',
  泣き笑い: 'sink',
  考える: 'sink',
  決意: 'step',
  真剣: 'step',
  悲しい: 'sink',
  デジャヴ: 'sway',
  照れ: 'nod',
  にやり: 'nod',
  困り笑い: 'nod',
};

/** 頭の上の感情のふきだしの印（@emote で使う） */
export const EMOTES = ['！', '？', '！？', '…', '♪', '汗'] as const;
export type Emote = (typeof EMOTES)[number];

/** 表情が替わった時に、自動で出すふきだし */
export const FACE_EMOTES: Record<string, Emote> = {
  驚き: '！',
  あせり: '汗',
  困り: '汗',
  あきれ: '…',
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
 * 台本の効果音の名前 → 台帳の id（段階31c で効果音ラボの音を入れた）。
 * null は音のファイルを使わない音：sand（語りの文の砂がさらさら落ちる音）は audio/sound.ts の playSand でその場で作る（効果音ラボに合う音がなかった）
 */
export const SCRIPT_SE: Record<string, string | null> = {
  tap: SE.tap,
  hit: SE.hit,
  chest: SE.chest,
  encounter: SE.encounter,
  sand: null,
  crowd: SE.crowd,
  murmur: SE.classroom,
  paper: SE.paper,
  shot: SE.shot,
  miss: SE.miss,
  water: SE.water,
  splash: SE.splash,
  poi_break: SE.poiBreak,
  firework: SE.firework,
  drum: SE.drum,
  footsteps: SE.footsteps,
  alarm: SE.alarm,
  pan: SE.pan,
  chime: SE.chime,
  door_slam: SE.doorSlam,
  class_laugh: SE.classroom,
  store_enter: SE.storeEnter,
  bag_open: SE.bagOpen,
  shutter: SE.shutter,
  send: SE.send,
  bell: SE.bell,
  phone: SE.phone,
  noise: SE.noise,
  hang_up: SE.hangUp,
  door_open: SE.doorOpen,
};

/**
 * 時計の演出（@clock。段階22 調整12）。秒針の音は音のファイルを使わず、その場で作る（audio/sound.ts の playTick）
 * many は店じゅうの時計：本物の秒針の音に、ずれた音を重ねる。止まる時は、重ねた音が1つずつ消えていく
 */
export const CLOCK = {
  /** 秒針が1つ進む間（ミリ秒） */
  tickMs: 1000,
  /** 店じゅうの時計の時に重ねる音の数（本物の1つを含む。多いと何の音か分かりにくい。調整12の直し） */
  manyLayers: 3,
  /** 重ねる音の大きさ（本物の音を1として、1つめ・2つめ…） */
  manyGains: [0.35, 0.2],
  /** 店じゅうの時計が1つずつ止まる間（ミリ秒） */
  stopStepMs: 400,
  /** 時計の寄りの大きさと位置 */
  radius: 120,
  centerY: 270,
  /** 秒針の最初の位置（秒）。止まる前に少し動いて見えるよう、12時の手前から */
  startSecond: 52,
} as const;

/** 語りの文に流れる砂の色（ヴィクトの鎖の砂時計と同じ暗い金。docs/STORY.md の 2-11） */
export const NARRATION_SAND_COLOR = 0xb08a3a;

/**
 * 会話の途中で背景の絵が替わった時に、文字の窓と立ち絵を下げて、背景だけを見せる長さ（ミリ秒。段階32b）。
 * タップで先へ進める。同じ絵は、ゲームを開いている間は最初の1回だけ見せる（探索の途中の短い会話で毎回止まらないように）
 */
export const BG_VIEW_MS = 2000;

/** 背景だけを見せる長さを、絵ごとに変える（初めて来るレストピアの図書館は、ゆっくり見せる。段階32b 調整3） */
export const BG_VIEW_MS_BY_IMAGE: Record<string, number> = { 'bg.library': 3500 };
