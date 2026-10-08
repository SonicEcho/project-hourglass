// 素材台帳（段階15）。絵・音・フォントの素材と、配布物に入るライブラリを1つずつ書く。
// クレジットの画面とテスト（tests/assets.test.ts）がこの台帳を読む。決まりは docs/ASSETS.md

export type AssetKind = 'image' | 'svg' | 'audio' | 'font' | 'library';

/** 入手元 */
export type AssetSource =
  /** 自分で作った */
  | { type: 'self' }
  /** フリー素材のサイト */
  | { type: 'free'; site: string; url: string }
  /** AI で作った。plan は使った版（無料／有料のプラン名）。prompt と settings は見た目をそろえるために残す */
  | { type: 'ai'; service: string; plan: string; prompt: string; settings?: string }
  /** npm のライブラリ */
  | { type: 'library'; npm: string; url: string };

export interface AssetEntry {
  /** 画面から使う名前。ファイルを差し替えても変えない */
  id: string;
  kind: AssetKind;
  /** 表示名（クレジットの画面に出す） */
  title: string;
  /** public/ からの場所（ライブラリはなし）。読み込みは src/assets/ */
  file?: string;
  /** 仮（試作用。公開前に差し替える）か、本番か */
  status: 'placeholder' | 'final';
  source: AssetSource;
  /** 作者（クレジットの画面に出す） */
  author: string;
  /** ライセンスの名前（自作なら「自作」） */
  license: string;
  /** 売り物（買い切りのアプリ）に使えるか */
  commercialUse: boolean;
  /** 作者名などの表示が要るか。要るなら credit にその文を書く */
  creditRequired: boolean;
  credit?: string;
  /** 改変してよいか */
  modifyAllowed: boolean;
  /** 手に入れた日（YYYY-MM-DD） */
  acquiredAt: string;
  /** 手に入れた時の利用規約・ライセンス文の控え（リポジトリの中の場所）。フリー素材とライブラリは必須 */
  termsCopy?: string;
  notes?: string;
}


/** あかりの基本の1枚（全身）を作った ChatGPT の指示文（docs/ART.md）。表情違いはこの絵を見本にして Gemini で作った */
const AKARI_BASE_PROMPT =
  'Character design sheet of an original anime-style heroine for a mobile turn-based JRPG, full body front view, standing in a natural friendly pose with hands holding a staff in front of her, plain off-white background, clean lineart with soft cel shading, about 6 heads tall. ' +
  "Character: Akari, a 17-year-old Japanese high school girl, the protagonist's childhood friend. Warm, kind, cheerful face with a hint of wistfulness, soft gentle smile, the kind of girl who is always nearby. " +
  'Hair: shoulder-length soft chestnut-brown hair with light inward curls at the ends, side-swept bangs, a small half-up section tied at the back with a thin red ribbon. ' +
  'Hair accessory: one small red goldfish-shaped hair clip on the left side, slightly old and worn, like something she has had since childhood. ' +
  'Eyes: warm brown eyes, round and gentle, natural, not glowing. ' +
  'Outfit: same school uniform style as the protagonist: white dress shirt, dusk-red neck ribbon, a soft cream-colored knit cardigan worn over the shirt with sleeves slightly long covering part of her hands, navy pleated school skirt above the knee, navy knee socks, brown loafers. ' +
  'Weapon: a slender wooden prayer staff, about her height, with a small glowing glass lantern at the top shaped like a red goldfish (like a Japanese goldfish paper lantern), a short red-and-white tassel and a tiny bell hanging from it. The lantern emits a soft warm light with a few faint pale-blue frost sparkles around it (she uses healing and ice magic). ' +
  'Color palette: chestnut hair #8A5A3C, goldfish red #D9483B, cream cardigan #F1E6D2, navy skirt #2B3552, warm lantern light #FFC979, frost blue #BFE3F2, skin #F6DCC8. ' +
  'Additional views on the same sheet: back view, 4 facial expressions (bright smile, gentle worried look, lost-in-thought deja vu look gazing into the distance, determined while casting), close-up of the goldfish lantern staff.';

/** あかりの胸から上の立ち絵（表情違い）。段階18a の仮の素材 */
function akariPortrait(face: string, title: string, expression: string, base: string): AssetEntry {
  return {
    id: `portrait.akari.${face}`,
    kind: 'image',
    title: `あかりの立ち絵（${title}）`,
    file: `assets/portraits/akari_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'Google Gemini（Gemini アプリ）',
      plan: '無料',
      prompt:
        `Use this image as the base. Keep everything exactly the same: framing, pose, hands hidden at the sides, hair, red goldfish hair clip, ribbon, cardigan, and art style. Change only the facial expression. No props, no text, no magic effects. Expression: ${expression}`,
      settings: `見本の絵：${base}。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた。元の全身の絵は ChatGPT（無料）で作った。その指示文：${AKARI_BASE_PROMPT}`,
    },
    author: 'RESTOPIA 開発（Google Gemini と ChatGPT で作成）',
    license: 'Google 利用規約（生成した内容の所有権を主張しない）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/ai-gemini.md',
    notes: '絵柄を確かめるための仮の素材（docs/ART.md）。ChatGPT の規約の控えは docs/licenses/ai-openai.md',
  };
}

/** ハルトの胸から上の立ち絵（表情違い）。段階18a の仮の素材 */
function heroPortrait(face: string, title: string): AssetEntry {
  return {
    id: `portrait.hero.${face}`,
    kind: 'image',
    title: `ハルトの立ち絵（${title}）`,
    file: `assets/portraits/hero_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'ChatGPT',
      plan: '無料',
      prompt: '（開発者が ChatGPT で作った、表情4つを並べた一覧の絵。指示文はまだ記録していない。開発者に聞いて書き足す）',
      settings: '一覧の絵（透明な背景）を白い背景に重ね、表情ごとに切り出して、scripts/cutout.py（rembg の isnet-anime）で背景を抜いた',
    },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/ai-openai.md',
    notes: '絵柄を確かめるための仮の素材（docs/ART.md のハルトの見た目）',
  };
}

export const ASSETS: AssetEntry[] = [
  {
    id: 'title.hourglass',
    kind: 'svg',
    title: 'タイトルの砂時計',
    file: 'assets/ui/hourglass.svg',
    status: 'placeholder',
    source: { type: 'self' },
    author: 'RESTOPIA 開発',
    license: '自作',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-07',
    notes: '素材を読み込む部品を確かめるための仮の絵。今までの図形と同じ見た目',
  },
  {
    id: 'lib.phaser',
    kind: 'library',
    title: 'Phaser',
    status: 'final',
    source: { type: 'library', npm: 'phaser', url: 'https://phaser.io' },
    author: 'Richard Davey, Phaser Studio Inc.',
    license: 'MIT License',
    commercialUse: true,
    creditRequired: true,
    credit: 'Phaser — Copyright (c) 2024 Richard Davey, Phaser Studio Inc. — MIT License',
    modifyAllowed: true,
    acquiredAt: '2026-10-04',
    termsCopy: 'docs/licenses/phaser.txt',
    notes: 'ゲームの描画。MIT は売り物でも使えるが、著作権表示とライセンス文を載せる',
  },
  {
    id: 'lib.eruda',
    kind: 'library',
    title: 'eruda',
    status: 'final',
    source: { type: 'library', npm: 'eruda', url: 'https://github.com/liriliri/eruda' },
    author: 'liriliri',
    license: 'MIT License',
    commercialUse: true,
    creditRequired: true,
    credit: 'eruda — Copyright (c) 2016-present liriliri — MIT License',
    modifyAllowed: true,
    acquiredAt: '2026-10-04',
    termsCopy: 'docs/licenses/eruda.txt',
    notes: '?debug=1 の時だけ読み込むスマホ用のログ。配布物にはファイルとして入る',
  },
  akariPortrait('smile', '笑顔', 'bright smile', 'ChatGPT の全身の絵を Gemini で白い背景に描き直した絵'),
  heroPortrait('normal', '通常'),
  heroPortrait('smile', 'やさしい笑顔'),
  heroPortrait('surprised', '驚き'),
  heroPortrait('determined', '決意'),
  akariPortrait('laugh', '大笑い', 'laughing happily with open mouth, eyes closed', 'Gemini で作った笑顔の立ち絵'),
  akariPortrait('worried', '心配', 'gentle worried look', 'ChatGPT の全身の絵を Gemini で白い背景に描き直した絵'),
  akariPortrait(
    'pout',
    'むっ',
    'determined and serious, eyes focused forward, lips pressed together',
    'Gemini で作った笑顔の立ち絵',
  ),
  akariPortrait(
    'dejavu',
    'デジャヴ',
    'lost in thought, eyes looking slightly off to the side into the distance, a faint wistful feeling of deja vu',
    'Gemini で作った笑顔の立ち絵',
  ),
];
