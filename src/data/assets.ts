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

/** ハルトの設定画を作った ChatGPT の指示文（docs/ART.md） */
const HERO_BASE_PROMPT =
  'Character design sheet of an original anime-style protagonist for a mobile turn-based JRPG, full body front view, standing in a neutral relaxed pose, plain off-white background, clean lineart with soft cel shading, accurate proportions about 6 heads tall. ' +
  'Character: Haruto, a 17-year-old Japanese high school boy, slim average build, gentle and understated face, calm neutral expression, not overly handsome, approachable "everyman" look. ' +
  'Hair: messy short black hair with a slight navy tint, spiky bangs, a few cowlicks on top, ONE single strand in the front bangs colored sand-gold (like hourglass sand), the rest of the hair fully black. ' +
  'Eyes: warm amber eyes with a very thin, faint golden ring inside the iris, like the outer ring of a clock dial, subtle not glowing. ' +
  "Outfit: white school dress shirt, loose sand-gold necktie, open dark navy zip hoodie jacket worn over the uniform, the jacket's inner lining and hood interior are dusk orange (sunset color) and show at the front edges and cuffs, charcoal gray school trousers, white sneakers with orange soles. " +
  'Accessories: an old analog wristwatch with a brass case on his left wrist. ' +
  'Weapon: holding a one-handed sword pointing down in his right hand; the blade is shaped like the minute hand of a clock (long, slim, tapering to a sharp point, with a small hollow ring near the base), the crossguard is a round brass clock gear, dark brown grip, small brass pommel. ' +
  'Color palette: black hair #23222E, sand-gold #D9AE62, amber eyes #C98A3A, navy jacket #2B3552, dusk orange #E07A4F, skin #F3D6C1. ' +
  'Additional views on the same sheet: back view, 4 facial expressions (neutral, gentle smile, surprised, determined), close-up of the sword.';

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
      prompt: HERO_BASE_PROMPT,
      settings:
        '同じ指示文の設定画の表情4つを、ChatGPT が透明な背景の一覧にした絵から切り出した。白い背景に重ねて、scripts/cutout.py（rembg の isnet-anime）で背景を抜いた',
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

/** りくの胸から上の基本の1枚を作った ChatGPT の指示文（docs/ART.md の 5-2。案2。共通部分の後に付けた） */
const RIKU_BASE_PROMPT =
  'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. ' +
  'Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer. ' +
  "Keep the face exactly the same as the attached boy's portrait: same face shape, eyes, eyebrows, cheerful open-mouthed grin, skin tone and art style. Change only his hairstyle and outfit. " +
  'Framing: from just above the top of the head down to mid-chest, the head in the upper third. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl. ' +
  'Pose: both arms relaxed down at the sides, hands outside the frame. No props in hand. Background: plain pure white, no shadow, no gradient. ' +
  'Hair: short, neat dark-brown hair with the sides trimmed short and the front bangs swept up and slightly to one side, showing his forehead. Clean and sporty, not spiky. ' +
  'Outfit (same school as the protagonist): white dress shirt with sleeves rolled up to the elbows, a navy knit school vest over it, a dusk-red necktie worn loose with the top button undone. ' +
  'Mood: boyish and a little mischievous, but refreshing and popular in class, the reliable friend who drags everyone into his plans. ' +
  'Color palette: hair #4A3222, vest #2B3552, necktie #D9483B, shirt #F5F2EA, skin like the reference.';

/** りくの胸から上の立ち絵（段階31a。表情違いは Gemini で作る予定） */
function rikuPortrait(face: string, title: string): AssetEntry {
  return {
    id: `portrait.riku.${face}`,
    kind: 'image',
    title: `りくの立ち絵（${title}）`,
    file: `assets/portraits/riku_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'ChatGPT',
      plan: '無料',
      prompt: RIKU_BASE_PROMPT,
      settings:
        '見本の絵：顔は1回目に作ったりくの絵（白シャツに紺のジャージを腰に巻いた絵）、構図はあかりの胸から上の絵。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた',
    },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/ai-openai.md',
    notes: 'りくの見た目を決めた基本の1枚（docs/ART.md の 5-2）。開発者が案を3つ試して、この形に決めた',
  };
}

/** りくの表情違い（Gemini で、笑顔の絵を見本にして顔だけ変えた。docs/ART.md の 5-2「りくの表情違い」） */
function rikuFace(face: string, title: string, expression: string): AssetEntry {
  return {
    id: `portrait.riku.${face}`,
    kind: 'image',
    title: `りくの立ち絵（${title}）`,
    file: `assets/portraits/riku_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'Google Gemini（Gemini アプリ）',
      plan: '無料',
      prompt:
        'Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, hair, navy knit vest, loose red necktie, rolled-up white sleeves, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no text, no effects. ' +
        `Expression: ${expression}`,
      settings: `見本の絵：りくの笑顔の立ち絵（ChatGPT で作った基本の1枚）。843×1264 で出てきた。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた。基本の1枚の指示文：${RIKU_BASE_PROMPT}`,
    },
    author: 'RESTOPIA 開発（Google Gemini と ChatGPT で作成）',
    license: 'Google 利用規約（生成した内容の所有権を主張しない）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/ai-gemini.md',
    notes: 'ChatGPT の規約の控えは docs/licenses/ai-openai.md',
  };
}

/** 会話の背景（段階31a）。ChatGPT で作った1枚絵 */
function backdrop(id: string, title: string, file: string, prompt: string, settings: string): AssetEntry {
  return {
    id: `bg.${id}`,
    kind: 'image',
    title: `会話の背景（${title}）`,
    file: `assets/backgrounds/${file}`,
    status: 'placeholder',
    source: { type: 'ai', service: 'ChatGPT', plan: '無料', prompt, settings },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/ai-openai.md',
    notes: 'docs/ART.md の 5-2',
  };
}

const STYLE_PREFIX =
  'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. ';

/** 効果音ラボの効果音（段階19）。page は効果音ラボのページ、file はそこの mp3 の名前 */
function soundEffectLab(id: string, title: string, file: string, page: string, original: string): AssetEntry {
  return {
    id,
    kind: 'audio',
    title: `効果音：${title}`,
    file: `assets/se/${file}`,
    status: 'final',
    source: { type: 'free', site: '効果音ラボ', url: `https://soundeffect-lab.info/sound/${page}/` },
    author: '効果音ラボ',
    license: '効果音ラボ 利用規約（商用利用無料、クレジット表記は任意）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/soundeffect-lab.md',
    notes: `元のファイル名：${original}。アプリへの組み込みは規約で許可されている（音源ファイルむき出しでも可）`,
  };
}

/** 自作の仮の BGM（段階19。ループの仕組みを確かめるための音。本番は Suno で作った曲に替える） */
function placeholderBgm(id: string, title: string, file: string): AssetEntry {
  return {
    id,
    kind: 'audio',
    title: `BGM：${title}（仮）`,
    file: `assets/bgm/${file}`,
    status: 'placeholder',
    source: { type: 'self' },
    author: 'RESTOPIA 開発',
    license: '自作',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    notes: 'scripts/placeholder_bgm.py でプログラムで合成した音。本番では Suno の有料の版で作った曲に替える（docs/ART.md）',
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
  soundEffectLab('se.tap', 'ボタンを押す', 'tap.mp3', 'button', 'decision3.mp3（決定ボタンを押す3）'),
  soundEffectLab('se.slash', '斬る', 'slash.mp3', 'battle', 'sword-slash2.mp3（剣で斬る2）'),
  soundEffectLab('se.hit', '打撃', 'hit.mp3', 'battle', 'blow2.mp3（打撃2）'),
  soundEffectLab('se.heal', '回復', 'heal.mp3', 'battle', 'magic-cure1.mp3（回復魔法1）'),
  soundEffectLab('se.chest', '宝箱', 'chest.mp3', 'button', 'decision24.mp3（決定ボタンを押す24）'),
  soundEffectLab('se.encounter', '遭遇', 'encounter.mp3', 'button', 'decision20.mp3（決定ボタンを押す20）'),
  placeholderBgm('bgm.title', 'タイトル', 'title.mp3'),
  placeholderBgm('bgm.festival', '縁日', 'festival.mp3'),
  {
    id: 'map.festival',
    kind: 'image',
    title: '縁日の見下ろしの地図（1-1「金魚の名前」）',
    file: 'assets/maps/festival.webp',
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'ChatGPT',
      plan: '無料',
      prompt:
        'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. ' +
        'Top-down map illustration for a mobile RPG exploration scene. Vertical 9:16 image. A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. ' +
        "Scene: a small Japanese shrine festival (ennichi) at summer dusk, about ten years ago, in a neighboring town's shrine. " +
        'Layout from bottom to top: Bottom center: a red torii gate at the entrance, with a short stone path leading in. A wide stone-paved approach path (sando) running straight up the middle of the image. ' +
        'Both sides of the path lined with festival stalls with striped cloth awnings: on the left side a goldfish-scooping stall with a shallow blue water tank full of small red goldfish; on the right side a ramune soda stall with a tub of ice and glass bottles; other stalls such as cotton candy, masks, shaved ice. ' +
        'Around the middle: an open round plaza with one large paper lantern on a wooden stand at its center and a few wooden benches at the edges. From the right edge of the plaza, a narrow stone path branches off to the right and leads out of the image. ' +
        'Top: a small wooden shrine building, with an open sandy space in front of it. Trees, stone lanterns and low fences around the outer edges. ' +
        'Walkable areas (paths, plaza, sandy space) must be clearly distinguishable from non-walkable objects (stalls, trees, stone lanterns, benches, pillars). Paths are wide, at least one eighth of the image width. ' +
        'Lighting: warm orange paper lanterns strung above the path, indigo and amber dusk sky tones reflected on the ground. ' +
        'Absolutely no letters or text anywhere: signs, banners, lanterns and awnings are blank or have simple patterns only.',
      settings: '元の絵は 941×1672。768×1376（24×43マス）に縮めて WebP にした（縦が 0.8% 伸びる）。ほかの加工はしていない',
    },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/ai-openai.md',
    notes: '1-1「金魚の名前」の地図（docs/ART.md の 5-2 の 7）。段階18b の Gemini の仮の地図を、ChatGPT で作り直した絵に差し替えた。歩ける場所は src/data/prototypes.ts の PROTO_FESTIVAL_LAYOUT',
  },
  heroPortrait('normal', '通常'),
  heroPortrait('smile', 'やさしい笑顔'),
  heroPortrait('surprised', '驚き'),
  heroPortrait('determined', '決意'),
  rikuPortrait('smile', '笑顔'),
  rikuFace('normal', '通常', 'relaxed and friendly, a small natural smile with the mouth closed'),
  rikuFace('proud', '得意げ', 'smug and proud, a confident closed-mouth grin, chin slightly raised, one eyebrow up'),
  rikuFace('serious', '真剣', 'serious and focused, mouth closed, brows drawn together, eyes sharp and determined'),
  rikuFace('flustered', 'あせり', 'flustered, an awkward nervous smile, eyebrows raised in a troubled way, eyes looking aside'),
  rikuFace('surprised', '驚き', 'surprised, eyes wide open, mouth slightly open'),
  rikuFace('smirk', 'にやり', 'a sly mischievous smirk, one corner of the mouth raised, eyes narrowed playfully'),
  rikuFace('sad', '悲しい', 'sad and quiet, eyes looking down, mouth closed, brows slightly lowered'),
  backdrop(
    'shrine_approach',
    '夕暮れの神社の参道',
    'shrine_approach.webp',
    STYLE_PREFIX +
      'Background art for a visual novel dialogue scene. Vertical 9:16 image. No characters in the foreground. ' +
      "A small Japanese shrine's approach path (sando) at summer dusk on a festival evening, in a quiet regional town. A stone-paved path leads to a red torii gate in the distance. Rows of festival food stalls with striped cloth awnings line both sides. Paper lanterns are being lit one by one, warm orange light against an indigo and amber sky. Only a few tiny blurred silhouettes of festival-goers far away. " +
      'Eye-level camera, the path centered. Keep the lower third of the image simple (ground and stone path), because a dialogue box will cover it. ' +
      'Absolutely no letters or text anywhere: signs, lanterns, banners and awnings are blank or have simple patterns only.',
    '元の絵は 941×1672。720×1280 に縮めて WebP にした。プロローグの参道の入口と、屋台の並びの両方で使う',
  ),
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
