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
/** あかりの足した5つの表情の指示文の頭（2026-10-08。docs/ART.md の 5-2） */
const AKARI_ADDED_HEAD =
  'Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, hair, the small red goldfish hair clip, the thin red ribbon in the half-up hair (#D9483B), white shirt with red bow, cream knit cardigan, and art style. Plain pure white background. Change only the facial expression. No props, no staff, no sweat drops, no tears unless stated, no text, no effects.';

function akariPortrait(face: string, title: string, expression: string, base: string, head?: string): AssetEntry {
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
      prompt: head
        ? `${head}\nExpression: ${expression}`
        : `Use this image as the base. Keep everything exactly the same: framing, pose, hands hidden at the sides, hair, red goldfish hair clip, ribbon, cardigan, and art style. Change only the facial expression. No props, no text, no magic effects. Expression: ${expression}`,
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

/** ハルトの胸から上の基本の1枚を Gemini で描き直した指示文（docs/ART.md の 5-2。見本：M0 のハルトの絵とあかりの胸から上の絵） */
const HERO_REDRAW_PROMPT =
  'Redraw the boy from image 1 as a chest-up portrait with exactly the same framing, size and camera distance as image 2. Vertical 2:3 image. Keep his face, hair (black with ONE sand-gold strand in the front bangs), amber eyes, white shirt, loose sand-gold necktie and open navy hoodie with dusk-orange lining exactly as in image 1. Front view, calm neutral expression with a hint of gentleness. Both arms relaxed down at the sides, hands outside the frame. Plain pure white background. Same anime art style as image 2. No props, no text.';

/** ハルトの胸から上の立ち絵（2026-10-08 に Gemini で作り直した。expression がない物は基本の1枚） */
function heroPortrait(face: string, title: string, expression?: string): AssetEntry {
  return {
    id: `portrait.hero.${face}`,
    kind: 'image',
    title: `ハルトの立ち絵（${title}）`,
    file: `assets/portraits/hero_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'Google Gemini（Gemini アプリ）',
      plan: '無料',
      prompt: expression
        ? 'Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, hair with the single sand-gold strand, amber eyes, white shirt, loose sand-gold necktie, open navy hoodie with dusk-orange lining, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no text, no effects. ' +
          `Expression: ${expression}`
        : HERO_REDRAW_PROMPT,
      settings: expression
        ? `見本の絵：ハルトの通常の立ち絵（Gemini で描き直した基本の1枚）。848×1264 で出てきた。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた。基本の1枚の指示文：${HERO_REDRAW_PROMPT}`
        : `見本の絵：M0 のハルトの絵（ChatGPT。元の指示文：${HERO_BASE_PROMPT}）と、あかりの胸から上の絵。848×1264 で出てきた。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた`,
    },
    author: 'RESTOPIA 開発（Google Gemini と ChatGPT で作成）',
    license: 'Google 利用規約（生成した内容の所有権を主張しない）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-08',
    termsCopy: 'docs/licenses/ai-gemini.md',
    notes: 'ChatGPT の規約の控えは docs/licenses/ai-openai.md。見た目は docs/ART.md のハルトの見た目',
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

/** 会話の背景（段階31a）。ChatGPT か Gemini で作った1枚絵 */
function backdrop(id: string, title: string, file: string, prompt: string, settings: string, acquiredAt = '2026-10-08', service: 'chatgpt' | 'gemini' = 'chatgpt'): AssetEntry {
  const gemini = service === 'gemini';
  return {
    id: `bg.${id}`,
    kind: 'image',
    title: `会話の背景（${title}）`,
    file: `assets/backgrounds/${file}`,
    status: 'placeholder',
    source: { type: 'ai', service: gemini ? 'Google Gemini（Gemini アプリ）' : 'ChatGPT', plan: '無料', prompt, settings },
    author: gemini ? 'RESTOPIA 開発（Google Gemini で作成）' : 'RESTOPIA 開発（ChatGPT で作成）',
    license: gemini ? 'Google 利用規約（生成した内容の所有権を主張しない）' : 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt,
    termsCopy: gemini ? 'docs/licenses/ai-gemini.md' : 'docs/licenses/ai-openai.md',
    notes: 'docs/ART.md の 5-2',
  };
}

/** 子どものころの3人（7歳）の指示文の頭（docs/ART.md の 5-2 の 6） */
const YOUNG_HEAD =
  'Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer. ' +
  'Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait. ' +
  'Pose: both arms relaxed down at the sides, hands outside the frame. No props. ' +
  'Background: plain pure white, no shadow, no gradient. ' +
  'Draw the same character as the attached high school portrait, but as a 7-year-old child: round soft cheeks, bigger eyes, small shoulders, childlike proportions. Keep the same face features, hair color and eye color so that they are clearly the same person ten years earlier. ';

/** 子どものころの3人の表情違いの指示文の頭（Gemini。基本の1枚を見本にして顔だけ変えた。docs/ART.md の 5-2 の 6） */
const YOUNG_FACE_HEAD: Record<'hero' | 'akari' | 'riku', string> = {
  hero: 'Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, hair with the single sand-gold strand, amber eyes, white T-shirt, open navy hoodie with dusk-orange lining, childlike proportions, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no text, no effects.',
  akari:
    'Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, short chestnut bob, the small red goldfish hair clip, the small red ribbon in the hair, white goldfish yukata with red obi, childlike proportions, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no tears, no text, no effects.',
  riku: 'Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, messy dark-brown hair, the small bandage on his cheek, navy jinbei with white pattern, childlike proportions, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no text, no effects.',
};

/** 子どものころの3人の表情違い（Gemini で、基本の1枚を見本にして顔だけ変えた） */
function youngFace(who: 'hero' | 'akari' | 'riku', name: string, face: string, title: string, expression: string, base: string): AssetEntry {
  return {
    id: `portrait.young_${who}.${face}`,
    kind: 'image',
    title: `子どもの${name}の立ち絵（${title}）`,
    file: `assets/portraits/young_${who}_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'Google Gemini（Gemini アプリ）',
      plan: '無料',
      prompt: `${YOUNG_FACE_HEAD[who]}\nExpression: ${expression}`,
      settings: `見本の絵：子どもの${name}の${base}の立ち絵（ChatGPT で作った基本の1枚。指示文はその台帳）。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた`,
    },
    author: 'RESTOPIA 開発（Google Gemini と ChatGPT で作成）',
    license: 'Google 利用規約（生成した内容の所有権を主張しない）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-09',
    termsCopy: 'docs/licenses/ai-gemini.md',
    notes: 'docs/ART.md の 5-2 の 6。ChatGPT の規約の控えは docs/licenses/ai-openai.md',
  };
}

/** 子どものころの3人の立ち絵（段階31a。ChatGPT で、高校生の立ち絵を見本にして作った基本の1枚。表情違いは Gemini で作る予定） */
function youngPortrait(who: 'hero' | 'akari' | 'riku', name: string, face: string, title: string, character: string, reference: string): AssetEntry {
  return {
    id: `portrait.young_${who}.${face}`,
    kind: 'image',
    title: `子どもの${name}の立ち絵（${title}）`,
    file: `assets/portraits/young_${who}_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'ChatGPT',
      plan: '無料',
      prompt: STYLE_PREFIX + YOUNG_HEAD + character,
      settings: `見本の絵：${reference}。1024×1536 で出てきた。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた`,
    },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-09',
    termsCopy: 'docs/licenses/ai-openai.md',
    notes: 'docs/ART.md の 5-2 の 6。背の低さはゲームの側で小さく出して表す（src/data/dialogue.ts の CAST の height）',
  };
}

const STYLE_PREFIX =
  'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. ';

/**
 * 効果音ラボの効果音（段階19）。page は効果音ラボのページ、file はそこの mp3 の名前。
 * 段階31c で足した音は acquiredAt を付ける。edit は手を入れた内容（長い環境音を数秒に切る、音を大きくする、など。規約で改変は可）
 */
function soundEffectLab(
  id: string,
  title: string,
  file: string,
  page: string,
  original: string,
  opts: { acquiredAt?: string; edit?: string } = {},
): AssetEntry {
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
    acquiredAt: opts.acquiredAt ?? '2026-10-08',
    termsCopy: 'docs/licenses/soundeffect-lab.md',
    notes:
      `元のファイル名：${original}。アプリへの組み込みは規約で許可されている（音源ファイルむき出しでも可）` +
      (opts.edit ? `。手を入れた所：${opts.edit}` : ''),
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
  akariPortrait('smile', '笑顔', 'a bright, warm smile with the mouth slightly open, eyes soft and happy', 'あかりのデジャヴの立ち絵（リボンが赤い版）。2026-10-09 に、リボンの色が違った絵を作り直した', AKARI_ADDED_HEAD),
  soundEffectLab('se.tap', 'ボタンを押す', 'tap.mp3', 'button', 'decision3.mp3（決定ボタンを押す3）'),
  soundEffectLab('se.slash', '斬る', 'slash.mp3', 'battle', 'sword-slash2.mp3（剣で斬る2）'),
  soundEffectLab('se.hit', '打撃', 'hit.mp3', 'battle', 'blow2.mp3（打撃2）'),
  soundEffectLab('se.heal', '回復', 'heal.mp3', 'battle', 'magic-cure1.mp3（回復魔法1）'),
  soundEffectLab('se.chest', '宝箱', 'chest.mp3', 'button', 'decision24.mp3（決定ボタンを押す24）'),
  soundEffectLab('se.encounter', '遭遇', 'encounter.mp3', 'button', 'decision20.mp3（決定ボタンを押す20）'),
  // 段階31c：台本の効果音（src/data/dialogue.ts の SCRIPT_SE）
  soundEffectLab('se.crowd', '祭りの人混み', 'crowd.mp3', 'environment', 'downtown-night1.mp3（夜の繁華街）', { acquiredAt: '2026-10-09', edit: '1秒目から4秒を切り出し、終わりを1.5秒で消した' }),
  soundEffectLab('se.classroom', '教室のざわめき', 'classroom.mp3', 'environment', 'high-school-class-room1.mp3（騒がしい高校の教室）', { acquiredAt: '2026-10-09', edit: '0.5秒目から3秒を切り出し、終わりを1.2秒で消した' }),
  soundEffectLab('se.paper', '紙を広げる', 'paper.mp3', 'various', 'paper-take2.mp3（紙を広げる2）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.shot', '射的のコルク', 'shot.mp3', 'various', 'cork-plug1.mp3（コルク栓を抜く1）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.miss', '外れる', 'miss.mp3', 'battle', 'knife-throw1.mp3（ナイフを投げる）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.water', '水の音', 'water.mp3', 'environment', 'creek1.mp3（小川）', { acquiredAt: '2026-10-09', edit: '1秒目から3秒を切り出し、終わりを1.2秒で消した' }),
  soundEffectLab('se.splash', '水がはねる', 'splash.mp3', 'various', 'lure-drop-down1.mp3（ルアー着水）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.poi_break', 'ポイが破れる', 'poi_break.mp3', 'various', 'paper-tear3.mp3（紙を破く3）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.firework', '打ち上げ花火', 'firework.mp3', 'various', 'fireworks1.mp3（打ち上げ花火1）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.drum', '和太鼓', 'drum.mp3', 'anime', 'drum-japanese1.mp3（和太鼓でドン）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.footsteps', '足音', 'footsteps.mp3', 'various', 'walk-asphalt1.mp3（アスファルトの上を歩く1）', { acquiredAt: '2026-10-09', edit: '0.3秒目から3秒を切り出し、終わりを0.8秒で消し、6dB 大きくした' }),
  soundEffectLab('se.alarm', '目覚まし時計', 'alarm.mp3', 'machine', 'alerm1.mp3（目覚まし時計のアラーム）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.pan', 'フライパン', 'pan.mp3', 'various', 'fried-egg1.mp3（目玉焼きを焼く）', { acquiredAt: '2026-10-09', edit: '0.5秒目から3秒を切り出し、終わりを1秒で消し、3dB 大きくした' }),
  soundEffectLab('se.chime', '玄関のチャイム', 'chime.mp3', 'various', 'doorchime1.mp3（ドアチャイム1）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.door_slam', '教室の戸を勢いよく開ける', 'door_slam.mp3', 'various', 'classroom-door-open1.mp3（教室の戸を開ける）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.store_enter', 'コンビニの入店', 'store_enter.mp3', 'various', 'shop-chime1.mp3（入店チャイム）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.bag_open', 'お菓子の袋を開ける', 'bag_open.mp3', 'various', 'sweet-bag-open1.mp3（お菓子の袋を開ける）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.shutter', 'スマホのシャッター', 'shutter.mp3', 'machine', 'camera-shutter2.mp3（カメラのシャッター2）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.send', '送信', 'send.mp3', 'button', 'decision40.mp3（決定ボタンを押す40）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.bell', '扉のベル', 'bell.mp3', 'various', 'bell1.mp3（鈴が鳴る）', { acquiredAt: '2026-10-09', edit: '6dB 大きくした' }),
  soundEffectLab('se.phone', 'スマホの着信', 'phone.mp3', 'machine', 'mobile-phone-ringtone1.mp3（携帯電話の着信音1）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.noise', 'ノイズ', 'noise.mp3', 'machine', 'snow-noise1.mp3（トランシーバーのノイズ）', { acquiredAt: '2026-10-09', edit: '0.5秒目から0.8秒を切り出し、終わりを0.2秒で消した' }),
  soundEffectLab('se.hang_up', '電話が切れる', 'hang_up.mp3', 'machine', 'phone-cut1.mp3（電話が切れる1）', { acquiredAt: '2026-10-09' }),
  soundEffectLab('se.door_open', '扉が開く（砂が吹き上がる）', 'door_open.mp3', 'animal', 'gust-wind1.mp3（突風が吹く）', { acquiredAt: '2026-10-09' }),
  {
    id: 'font.heading',
    kind: 'font',
    title: '見出しとボタンの書体（Zen Maru Gothic Bold）',
    file: 'assets/fonts/heading.woff2',
    status: 'final',
    source: { type: 'free', site: 'Google Fonts', url: 'https://fonts.google.com/specimen/Zen+Maru+Gothic' },
    author: 'The Zen Maru Gothic Project Authors',
    license: 'SIL Open Font License 1.1',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-09',
    termsCopy: 'docs/licenses/zen-maru-gothic-OFL.txt',
    notes:
      'ゲームで使う字だけに絞った（scripts/font-subset.py。絞るのはライセンスで許された改変）。予約された書体名（Reserved Font Name）はないが、ゲームの中では RestopiaHeading の名前で読み込む。書体だけを売ることはしない（配布物に入れるのは可）',
  },
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
  heroPortrait('smile', '笑顔', 'a gentle, slightly shy smile with the mouth closed, eyes soft'),
  heroPortrait('surprised', '驚き', 'surprised, eyes wide open, mouth slightly open'),
  heroPortrait('determined', '決意', 'determined, mouth firmly closed, brows set, eyes sharp and steady'),
  heroPortrait('exasperated', 'あきれ', 'exasperated, half-closed eyes, mouth flat, one eyebrow slightly lowered'),
  heroPortrait('troubled', '困り', 'troubled, eyebrows raised in a worried way, mouth slightly open, eyes looking aside'),
  heroPortrait('sad', '悲しい', 'sad and quiet, eyes looking down, mouth closed, brows slightly lowered'),
  heroPortrait('shy', '照れ', 'embarrassed, light blush on the cheeks, eyes looking away, a small awkward closed-mouth smile'),
  heroPortrait('wry', '苦笑い', 'a wry, strained smile, one corner of the mouth raised, eyebrows slightly troubled'),
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
  backdrop(
    'clock_shop',
    '時計屋の店内',
    'clock_shop.webp',
    STYLE_PREFIX +
      'Background art for a visual novel dialogue scene. Vertical 9:16 image. No people. ' +
      'The interior of a small, old watch and clock shop at the edge of a shopping street in a quiet Japanese regional town, at summer dusk just before closing time. Dozens of wall clocks of different shapes and sizes cover the walls; a glass display counter full of wristwatches in the middle; wooden shelves with table clocks; a tall wooden grandfather clock near the back; a doorway to a back room at the far end, half hidden by a short noren curtain. Warm orange evening sunlight streams in through the front glass door and window, casting long shadows; dust glitters in the light. Nostalgic, quiet, a little mysterious. ' +
      'Eye-level camera, looking from the entrance toward the back of the shop. Keep the lower third of the image simple (floor and the front of the counter), because a dialogue box will cover it. ' +
      'Absolutely no letters or text anywhere: clock faces have simple marks instead of numbers, no signs, no labels, no price tags.',
    '元の絵は 941×1672。720×1280 に縮めて WebP にした。夜の場面（1-G）は、ゲームの側で青い色をかけて使い回す',
  ),
  backdrop(
    'clock_shop_back',
    '時計屋の奥の部屋',
    'clock_shop_back.webp',
    STYLE_PREFIX +
      'Background art for a visual novel dialogue scene. Vertical 9:16 image. No people. ' +
      'The small back room of an old Japanese watch and clock shop, at summer dusk. Make it look like the back room of the same shop as the attached reference image. A cluttered wooden workbench with a desk lamp, tiny screwdrivers, tweezers, a magnifying loupe and opened pocket watches; drawers full of small parts; a few wall clocks. Against the far wall stands a tall antique pendulum clock (grandfather clock), centered in the image, with plain empty wall space around it (a glowing door will appear on that wall later in the game). A small high window lets in orange evening light; the corners fall into soft indigo shadow. Quiet, nostalgic, the feeling that time is about to stop. ' +
      'Eye-level camera, the pendulum clock in the center. Keep the lower third of the image simple (floor and the front edge of the workbench), because a dialogue box will cover it. ' +
      'Absolutely no letters or text anywhere: clock faces have simple marks instead of numbers, no labels, no papers with writing.',
    '見本の絵：時計屋の店内の背景（bg.clock_shop）。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    '2026-10-09',
  ),
  backdrop(
    'library',
    'レストピアの蔵書の棚',
    'library.webp',
    STYLE_PREFIX +
      'Background art for a visual novel dialogue scene. Vertical 9:16 image. No people. ' +
      'A vast, fantastical library where time is stored instead of books. Towering dark-wood bookshelves rise so high that the ceiling cannot be seen, fading into a warm golden haze. On every shelf, hourglasses of many sizes stand in rows like books; inside each hourglass, softly glowing sand, and faint tiny scenes of everyday memories (a sports day, a summer festival, a birthday) shimmer in the glass. Each hourglass has a small blank paper tag tied to it. Fine golden sand particles drift slowly upward in the air. Light comes from the glowing hourglasses themselves: amber and soft gold, with deep indigo shadows between the shelves. Beautiful, quiet, nostalgic, a little lonely. ' +
      'Eye-level camera, looking down a long aisle between two shelves. Keep the lower third of the image simple (the floor of the aisle), because a dialogue box will cover it. ' +
      'Absolutely no letters or text anywhere: tags and book spines are blank.',
    '元の絵は 941×1672。720×1280 に縮めて WebP にした。2枚作り、下の3分の1（床）がすっきりした方を使った',
    '2026-10-09',
  ),
  backdrop(
    'shopping_street',
    '商店街',
    'shopping_street.webp',
    STYLE_PREFIX +
      'Background art for a visual novel dialogue scene. Vertical 9:16 image. No people in the foreground. ' +
      'A small covered shopping street (shotengai) in a quiet Japanese regional town, on a summer afternoon after school. A long, straight street under a translucent arcade roof, with small family-run shops on both sides: a convenience store with bright glass doors on the left, a bakery, a bookshop, a small vegetable shop with crates outside. Far down the street, at the very end, a small old watch and clock shop with warm light inside. A tall round street clock on a post stands in the middle distance; its face has simple marks and two clear hands, no numbers. Bicycles parked along the shop fronts, potted plants, a few tiny blurred figures far away. Soft afternoon sunlight with a hint of early-evening amber; calm, lived-in, nostalgic. ' +
      'Eye-level camera, the street centered and receding into the distance. Keep the lower third of the image simple (the paved street), because a dialogue box will cover it. ' +
      'Absolutely no letters or text anywhere: shop signs, banners, posters and windows are blank or have simple patterns only.',
    '元の絵は 941×1672。720×1280 に縮めて WebP にした。1-C・2-B と、日常の商店街で使う',
    '2026-10-09',
    'gemini',
  ),
  backdrop(
    'classroom',
    '教室（朝）',
    'classroom.webp',
    STYLE_PREFIX +
      'Background art for a visual novel dialogue scene. Vertical 9:16 image. No people. ' +
      "An ordinary Japanese high school classroom on a summer morning before homeroom. Rows of wooden desks and chairs, a few school bags hanging on desk hooks, a green chalkboard at the front wiped mostly clean, a teacher's podium, a round wall clock above the chalkboard with simple marks instead of numbers. Large windows along one side with white curtains moving in a light breeze, bright morning sunlight falling across the desks, blue summer sky and green trees outside. Fresh, peaceful, slightly nostalgic. " +
      'Eye-level camera from the back of the room looking toward the chalkboard. Keep the lower third of the image simple (the floor and the backs of the nearest desks), because a dialogue box will cover it. ' +
      'Absolutely no letters or text anywhere: the chalkboard, posters and notices are blank.',
    '元の絵は 940×1672。720×1280 に縮めて WebP にした。1-B・2-A と、日常の学校で使う',
    '2026-10-09',
    'gemini',
  ),
  youngPortrait(
    'hero',
    'ハルト',
    'normal',
    '通常',
    'Character: young Haruto, 7 years old. Quiet, a little shy and distant, a calm neutral expression, looking slightly unsure. Messy short black hair with a slight navy tint, ONE single strand in the front bangs colored sand-gold. Warm amber eyes. Plain white short-sleeve T-shirt with no logo, and a dark navy zip hoodie with dusk-orange lining worn open (a little too big for him).',
    'ハルトの通常の立ち絵',
  ),
  youngPortrait(
    'akari',
    'あかり',
    'smile',
    '笑顔',
    'Character: young Akari, 7 years old. Bright, cheerful, a big warm smile. Soft chestnut-brown hair in a short bob with side-swept bangs, a small red goldfish hair clip on the left side (shiny and new). A summer yukata, white with a pattern of small red goldfish and light blue water ripples, with a red obi sash.',
    'あかりのデジャヴの立ち絵（リボンが赤い版）',
  ),
  youngPortrait(
    'riku',
    'りく',
    'proud',
    '得意げ',
    'Character: young Riku, 7 years old. A mischievous little leader, a proud confident grin showing his teeth. Short dark-brown hair, a little spiky and messy (not yet styled). Bright lively brown eyes, a small bandage on his cheek. A navy blue jinbei (Japanese summer festival outfit) with a simple white pattern.',
    'りくの笑顔の立ち絵',
  ),
  youngFace('hero', 'ハルト', 'smile', '笑顔', 'a small, shy but happy smile with the mouth closed, eyes soft, a child who is just starting to open up', '通常'),
  youngFace('akari', 'あかり', 'worried', '心配', 'gently worried, eyebrows raised in a troubled way, mouth slightly open, eyes looking at someone with concern', '笑顔'),
  youngFace('riku', 'りく', 'smile', '笑顔', 'a big, bright, carefree open-mouthed smile, eyes happily narrowed', '得意げ'),
  youngFace(
    'riku',
    'りく',
    'serious',
    '真剣',
    'serious and focused, mouth firmly closed, brows drawn together, eyes sharp and determined, like a little leader making a decision',
    '得意げ',
  ),
  akariPortrait('laugh', '大笑い', 'laughing happily with open mouth, eyes closed', 'Gemini で作った笑顔の立ち絵'),
  akariPortrait(
    'worried',
    '心配',
    'gently worried, eyebrows raised in a troubled way, mouth slightly open, eyes looking at someone with concern',
    'あかりのデジャヴの立ち絵（リボンが赤い版）。2026-10-09 に、リボンの色が違った絵を作り直した',
    AKARI_ADDED_HEAD,
  ),
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
  ...(
    [
      ['surprised', '驚き', 'surprised, eyes wide open, mouth slightly open, eyebrows raised'],
      ['shy', '照れ', 'embarrassed, light blush on the cheeks, eyes looking aside, a small shy smile with the mouth closed'],
      ['sad', '悲しい', 'sad and quiet, eyes looking down, brows slightly lowered, mouth closed, eyes a little moist'],
      ['serious', '真剣', 'serious and focused, mouth firmly closed, brows set, eyes steady and determined'],
      ['wry', '困り笑い', 'a troubled smile, eyebrows raised in a worried way, a small awkward smile'],
      ['gentle', '微笑み', 'a gentle, soft smile with the mouth closed, eyes warm and slightly narrowed, calm and kind'],
    ] as const
  ).map(([face, title, expression]) => akariPortrait(face, title, expression, 'Gemini で作ったデジャヴの立ち絵（リボンが赤い物）。843×1264 で出てきた', AKARI_ADDED_HEAD)),
];
