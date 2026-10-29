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
  /** 中身の印（BGM だけ。sha256 の頭12文字）。URL の ?v= に付け、端末にしまった古い曲と見分ける。テストがファイルと合うか確かめる */
  version?: string;
  /** ファイルの大きさ（バイト。BGM だけ。読み込みの進み具合を出すのに使う） */
  bytes?: number;
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
function heroPortrait(face: string, title: string, expression?: string, acquiredAt = '2026-10-08'): AssetEntry {
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
    acquiredAt,
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

/** 胸から上の立ち絵の構図の決まり（docs/ART.md の 5-2「立ち絵の共通の決まり」）。人ごとの文の前に付ける */
const PORTRAIT_FRAMING =
  'Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl. ' +
  'Pose: both arms relaxed down at the sides, hands outside the frame. No props. ' +
  'Background: plain pure white, no shadow, no gradient. ';

/** ノアの設定画（全身）の ChatGPT の指示文（2026-10-10。docs/ART.md の「ノアの見た目（決まった）」）。胸から上の絵と1枚絵は、この設定画を見本にした */
const NOA_SHEET_PROMPT =
  'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. ' +
  'Character design sheet of an original anime-style heroine for a mobile turn-based JRPG, full body front view, standing upright in a calm, composed pose with arms at her sides, plain off-white background, clean lineart with soft cel shading, about 6 heads tall. Same art style as the attached reference portrait. ' +
  'Character: Noa, a 17-year-old girl from several decades in the future, a former time agent (an "archiver" who collected people\'s happy memories) since childhood. Rational, cool and expressionless, a little detached, but with a quiet loneliness and a strong sense of right and wrong hidden inside. ' +
  'Hair: pale silver hair with a faint blue-green tint, a neat short bob with straight bangs, one thin lock slightly longer on one side. ' +
  'Eyes: cool blue-green eyes, calm and sharp, not glowing. ' +
  'Outfit: a clean white long coat with a high collar, designed like a futuristic uniform, with thin blue-green lines running along the seams and cuffs; a fitted dark navy inner top; slim white trousers or a short pleated skirt with dark tights; simple white boots. Minimal, functional, no decorations except a small hourglass-shaped clasp at the collar. ' +
  'Aura: she gives off a faint, cold white light, contrasting with the warm dusk colors of the present-day characters. ' +
  'Color palette: silver hair #D8E2E6 with blue-green tint #7FC8C2, blue-green eyes #3FA6A0, white coat #F4F7F8, accent lines #4CC2B8, navy inner #22304A, skin #F4E1D6. ' +
  'Additional views on the same sheet: back view, 4 facial expressions (expressionless, a tiny reluctant smile, cold glare, surprised), close-up of the hourglass collar clasp.';

/** ChatGPT で作った胸から上の基本の1枚（2026-10-10。ノアと、M2 の 1-2 の人たち。表情違いは Gemini で作る） */
function chatgptPortrait(who: string, name: string, face: string, title: string, prompt: string, reference: string, notes: string, acquiredAt = '2026-10-10', plan = '無料'): AssetEntry {
  return {
    id: `portrait.${who}.${face}`,
    kind: 'image',
    title: `${name}の立ち絵（${title}）`,
    file: `assets/portraits/${who}_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'ChatGPT',
      plan,
      prompt,
      settings: `見本の絵：${reference}。1024×1536 で出てきた。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた`,
    },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt,
    termsCopy: 'docs/licenses/ai-openai.md',
    notes,
  };
}

/** ChatGPT で作った背景・地図・1枚絵・敵の絵（2026-10-11 から。M2 の分） */
function chatgptArt(id: string, title: string, file: string, prompt: string, settings: string, notes: string, acquiredAt = '2026-10-11', plan = '無料'): AssetEntry {
  return {
    id,
    kind: 'image',
    title,
    file,
    status: 'placeholder',
    source: { type: 'ai', service: 'ChatGPT', plan, prompt, settings },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt,
    termsCopy: 'docs/licenses/ai-openai.md',
    notes,
  };
}

/** 表情違いの指示文の頭（Gemini。基本の1枚を見本にして顔だけ変えた。docs/ART.md の 5-3 の 14）。look は「その人の見た目」 */
const faceHead = (look: string) =>
  `Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, ${look}, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no tears unless stated, no text, no effects.`;

/** ChatGPT の基本の1枚から Gemini で作った表情違い（2026-10-11。ノアと、M2 の 1-2 の人たち） */
function geminiFace(who: string, name: string, face: string, title: string, look: string, expression: string, base: string, notes: string): AssetEntry {
  return {
    id: `portrait.${who}.${face}`,
    kind: 'image',
    title: `${name}の立ち絵（${title}）`,
    file: `assets/portraits/${who}_${face}.webp`,
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'Google Gemini（Gemini アプリ）',
      plan: '無料',
      prompt: `${faceHead(look)}\nExpression: ${expression}`,
      settings: `見本の絵：${name}の${base}の立ち絵（ChatGPT で作った基本の1枚。指示文はその台帳）。843×1264 で出てきた（基本の1枚は 1024×1536。縦横の比は同じで、画面では高さをそろえて出す）。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた`,
    },
    author: 'RESTOPIA 開発（Google Gemini と ChatGPT で作成）',
    license: 'Google 利用規約（生成した内容の所有権を主張しない）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-11',
    termsCopy: 'docs/licenses/ai-gemini.md',
    notes: `${notes}。ChatGPT の規約の控えは docs/licenses/ai-openai.md`,
  };
}

/** 口だけ開けた絵の指示文（Gemini。りくの口パク。docs/ART.md の 5-4） */
const TALK_SRC_PROMPT =
  'Use this image as the base. Keep everything exactly the same: framing, pose, head angle, hair, eyes, eyebrows, nose, face shape, clothes, and art style. Plain pure white background. Change ONLY the mouth: open it slightly as if in the middle of saying a word, a small natural talking mouth, keeping the same mood of the expression. Do not move or change the nose, the eyes or the eyebrows. No text, no effects.';

/** りくの表情の名前（台帳の表示名に使う） */
const RIKU_FACE_TITLES = { normal: '通常', proud: '得意げ', serious: '真剣', sad: '悲しい', smirk: 'にやり', flustered: 'あせり' } as const;

/** 目を閉じた絵の指示文（Gemini。段階46b。docs/ART.md の 5-4） */
const BLINK_SRC_PROMPT =
  'Use this image as the base. Keep everything exactly the same: framing, pose, hair, clothes, mouth, eyebrows, and art style. Plain pure white background. Change ONLY the eyes: both eyes gently closed, as in the middle of a natural blink, relaxed eyelids with eyelashes visible. Do not change the face shape, the eyebrows or the mouth. No text, no effects.';

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

/** M2 の指示文の決まった部分（docs/ART.md の 5-3 の共通部分）。2026-10-13 から */
const portraitHead = (expression: string, reference = 'the girl in the cardigan') =>
  STYLE_PREFIX +
  `Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, ${expression}. ` +
  `Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of ${reference}. ` +
  'Pose: both arms relaxed down at the sides, hands outside the frame. No props. ' +
  'Background: plain pure white, no shadow, no gradient. ';
const BG_HEAD = STYLE_PREFIX + 'Background art for a visual novel dialogue scene. Vertical 9:16 image. No people. ';
const BG_TAIL =
  'Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.';
const CG_HEAD = STYLE_PREFIX + 'A single key visual (event CG). Vertical 9:16 image. ';
const CG_TAIL = 'Keep the lower quarter of the image simple, because a text box may cover it. Absolutely no letters or text anywhere.';
/** 敵の絵の頭。era は時代の色。2026-10-13 から、ブリキノイズの絵柄にそろえる1文と、大きく少なく描く1文（ラムネノイズの直しから）を足した */
const enemyHead = (era: string, few = false) =>
  'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature. ' +
  'Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. ' +
  `It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (${era}). Eerie but not gory, readable as a small silhouette on a phone screen. ` +
  (few ? "Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. " : '');
const SHOWA_COLORS = 'sepia, faded green and orange';
const HEISEI_COLORS = 'bright pastel and light blue';
/** 白い背景を抜いた敵の絵の設定（rembg は砂とノイズの体を背景とみなして消すので、白を抜く道具を使った） */
const ENEMY_CUT = '元の絵は 1254×1254。白い背景は scripts/cutout_white.py（広い白を抜き、小さな白い光りは残す）で抜き、640×640 に縮めた。見本の絵：ブリキノイズ';

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
    source: { type: 'free', site: '効果音ラボ', url: `https://soundeffect-lab.info/sound/${page}${page.endsWith('.html') ? '' : '/'}` },
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

/** Paper Umbrella（開発者が Suno で作ったボーカル入りの曲。メインテーマ）を Cover して作った曲の指示文の元（docs/ART.md の 6.） */
const SUNO_MAIN_THEME = 'Paper Umbrella（wafu rock, Japanese traditional rock fusion, fast shamisen riff, taiko drums, distorted guitar, shinobue flute hook, tight driving rhythm, powerful female vocal, G minor, 150 bpm, fierce and cool, festival energy with a dark edge）';

/**
 * Suno で作った BGM（2026-10-13、開発者が Pro（有料の版）で作った）。長さを切ってつなぎ目を整えた（scripts/suno_bgm.py）。
 * Pro で作った曲は、権利が開発者に移る（docs/licenses/ai-suno.md）。coverOf は、元にした曲（Cover で作った時）
 */
function sunoBgm(id: string, title: string, file: string, prompt: string, edit: string, version: string, bytes: number, coverOf?: string, acquiredAt = '2026-10-13'): AssetEntry {
  return {
    id,
    kind: 'audio',
    title: `BGM：${title}`,
    file: `assets/bgm/${file}`,
    status: 'placeholder',
    source: { type: 'ai', service: 'Suno', plan: 'Pro（有料）', prompt, ...(coverOf ? { settings: `${coverOf} を Cover した` } : {}) },
    author: 'RESTOPIA 開発（Suno で作曲）',
    license: '自作（Suno の Pro で作った曲。権利は開発者）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt,
    termsCopy: 'docs/licenses/ai-suno.md',
    version,
    bytes,
    notes: `手を入れた所：${edit}、96kbps の mp3 にした。prompt は Claude が渡した指示文（実際に使った文と違えば書き直す）`,
  };
}

const SUNO_LOOP_EDIT = '前後の音が一番よく似た2点（テンポの差が1%未満）でくり返すように切り（終わりは使わない）、つなぎ目の直前60ms をなめらかにした';
const SUNO_WHOLE_EDIT = '頭と終わりの無音を切り、終わりを0.8秒で消した（曲の全体をくり返す）';

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
  // 段階68：玄関のチャイムを光る場面で鳴らしていたのを替え、自転車のベルを扉のベルの代わりから本物にした
  soundEffectLab('se.awaken', '武器に変わる', 'awaken.mp3', 'battle', 'magic-circle1.mp3（魔法陣を展開）', { acquiredAt: '2026-10-19' }),
  soundEffectLab('se.sparkle', '小さく光る', 'sparkle.mp3', 'battle', 'magic-stick1.mp3（魔法のステッキ）', { acquiredAt: '2026-10-19' }),
  // 段階114（2026-10-25。テストプレイのメモ 20・30）：レストピアに切り替わる時の音と、演奏の後の歓声と拍手
  soundEffectLab('se.restopia', 'レストピアに切り替わる', 'restopia.mp3', 'battle', 'magic-worp1.mp3（ワープ）', { acquiredAt: '2026-10-25' }),
  soundEffectLab('se.applause', '歓声と拍手', 'applause.mp3', 'voice/people.html', 'people-performance-cheer1.mp3（歓声と拍手1）', { acquiredAt: '2026-10-25' }),
  {
    id: 'se.handclap',
    kind: 'audio',
    title: '効果音：そろった手拍子',
    file: 'assets/se/handclap.mp3',
    status: 'final',
    source: { type: 'free', site: 'ポケットサウンド', url: 'https://pocket-se.info/archives/1257/' },
    author: 'ポケットサウンド',
    license: 'ポケットサウンド 利用規約（商用利用無料、クレジット表記が必要）',
    commercialUse: true,
    creditRequired: true,
    credit: '効果音：ポケットサウンド – https://pocket-se.info/',
    modifyAllowed: true,
    acquiredAt: '2026-10-25',
    termsCopy: 'docs/licenses/pocket-sound.md',
    notes: '元のファイル名：hakusyuone.mp3（拍手単音）。scripts/make_handclap.py で、音の高さ・大きさ・ずれを変えながら48人分を拍に重ねて、そろった手拍子にした（段階114。効果音ラボにそろった手拍子がなく、雑音から作った音は電子音のように聞こえた）',
  },
  soundEffectLab('se.bicycle_bell', '自転車のベル', 'bicycle_bell.mp3', 'machine/machine2.html', 'bicycle-bell1.mp3（自転車チリン）', { acquiredAt: '2026-10-19' }),
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
  {
    id: 'font.hand',
    kind: 'font',
    title: '子どもの手書き風の書体（Hachi Maru Pop）',
    file: 'assets/fonts/hand.woff2',
    status: 'final',
    source: { type: 'free', site: 'Google Fonts', url: 'https://fonts.google.com/specimen/Hachi+Maru+Pop' },
    author: 'The Hachi Maru Pop Project Authors',
    license: 'SIL Open Font License 1.1',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-10',
    termsCopy: 'docs/licenses/hachi-maru-pop-OFL.txt',
    notes:
      '屋台めぐりの「けいかくひょう」（子どものりくの字）に使う。かな・英数字と src/data/daily.ts の字だけに絞った（scripts/font-subset.py）。ゲームの中では RestopiaHand の名前で読み込む。書体だけを売ることはしない（配布物に入れるのは可）',
  },
  sunoBgm(
    'bgm.title',
    'タイトル',
    'suno_title.mp3',
    'solo piano, the main theme melody played clearly with gentle momentum, warm and nostalgic, bittersweet but hopeful, quiet determination, flowing left hand arpeggios, brighter major chords in the chorus, G minor, 84 bpm, felt piano, instrumental',
    SUNO_WHOLE_EDIT,
    'f9dd63739456',
    2337586,
    SUNO_MAIN_THEME,
  ),
  sunoBgm(
    'bgm.daily',
    '日常',
    'suno_daily.mp3',
    'mellow city pop slice-of-life theme, warm Rhodes electric piano, groovy bass, light drums with soft hi-hat, clean guitar cutting, lazy summer afternoon in a shopping arcade, nostalgic and cozy, B-flat major, 88 bpm, catchy but gentle two-bar phrase, background music under dialogue, steady dynamics, loop-friendly, instrumental',
    SUNO_LOOP_EDIT,
    'b6428559ff56',
    1854216,
  ),
  sunoBgm(
    'bgm.prologue',
    'プロローグの祭り',
    'suno_prologue.mp3',
    'nostalgic Japanese summer festival at dusk, festival music drifting from a distance, soft shinobue bamboo flute melody, gentle koto and harp, warm strings, faint taiko far away, wind chimes, paper lanterns glowing in the evening, a childhood summer remembered years later, warm and wistful, happy but bittersweet, B-flat major with gentle minor chord touches, 88 bpm, simple repeating melody, background music under dialogue, steady dynamics, loop-friendly, instrumental',
    SUNO_LOOP_EDIT,
    'd82d134a6d36',
    1457364,
  ),
  sunoBgm(
    'bgm.festival',
    '縁日（1-1）',
    'suno_festival.mp3',
    'the same festival melody heard inside a replayed memory, like a worn VHS recording, slightly detuned and wobbly tape, soft lo-fi texture, shinobue and light taiko, distant festival bells, dreamlike and a little uncanny but still warm and playful, B-flat major, 100 bpm, looping exploration music, steady dynamics, instrumental',
    SUNO_LOOP_EDIT,
    '88c613139ac7',
    1319437,
    'TimePassesMemory（プロローグの祭りの曲）',
  ),
  sunoBgm(
    'bgm.library',
    'レストピア',
    'suno_library.mp3',
    'majestic otherworldly library theme, an endless library of glowing hourglasses with towering shelves rising beyond sight, pipe organ and deep strings, slow swelling wordless choir, celesta sparkles on top, cathedral reverb, unexpected chord shifts to distant keys, awe and mystery, grand and mysterious, E-flat lydian, slow 72 bpm, background music under dialogue, steady dynamics, loop-friendly, instrumental',
    SUNO_WHOLE_EDIT,
    'c1e64b63ab39',
    1536671,
  ),
  sunoBgm(
    'bgm.return',
    '返す場面',
    'suno_return.mp3',
    'the main theme as a slow tender piece, solo piano with soft cello, G minor, 60 bpm, fragile then warm, tears and a smile, instrumental',
    SUNO_WHOLE_EDIT,
    '0cfdb1a30efd',
    2319718,
    SUNO_MAIN_THEME,
  ),
  sunoBgm(
    'bgm.battle',
    'ふだんの戦闘',
    'suno_battle.mp3',
    'glitchy rock battle theme, driving drums and distorted bass, catchy guitar riff, static noise stutters and tape-stop effects, VHS tape wobble, ticking clock rhythm, short punchy intro then straight into the main riff, repeated two-bar hook, tense and cool, G minor, 145 bpm, loop-friendly game battle music, consistent energy, instrumental',
    SUNO_LOOP_EDIT,
    'a8ed33277d64',
    696260,
  ),
  sunoBgm(
    'bgm.boss',
    'ボス戦（1-1）',
    'suno_boss_1_1.mp3',
    'first boss battle in a summer festival memory, tense but playful, taiko and shamisen with light rock drums and bass, shinobue flute hook, catchy riff, mischievous and quirky, a giant goldfish bowl monster, energetic but not epic, G minor, 140 bpm, loop-friendly game battle music, instrumental',
    SUNO_LOOP_EDIT,
    'c9bb1cff44cc',
    1951078,
  ),
  // 段階75（2026-10-19）。prompt は開発者が実際に使った指示文
  sunoBgm(
    'bgm.somber',
    'しんみり・教室の知らせ',
    'suno_somber.mp3',
    'quiet melancholic slice-of-life underscore, soft felt piano and warm cello, sparse slow chords with gentle silences, a missing friend and an empty seat in a summer classroom, uneasy but tender, D minor, 66 bpm, simple repeating motif, background music under dialogue, steady dynamics, loop-friendly, instrumental',
    SUNO_LOOP_EDIT,
    '34c4d63ea831',
    1177749,
    undefined,
    '2026-10-19',
  ),
  sunoBgm(
    'bgm.uneasy',
    'しんみり・帰り道や電話',
    'suno_uneasy.mp3',
    'quiet uneasy ambient underscore, warm Rhodes electric piano with soft airy synth pad, faint cicada-like texture, slow sparse chords with long gentle silences, a hazy summer afternoon where something feels wrong, melancholic but tender, C minor, 62 bpm, simple repeating motif, background music under dialogue, steady dynamics, loop-friendly, instrumental',
    SUNO_LOOP_EDIT,
    '8dc2d67b6859',
    1366771,
    undefined,
    '2026-10-19',
  ),
  sunoBgm(
    'bgm.showa',
    '昭和の商店街の記憶（1-2）',
    'suno_showa.mp3',
    'the same shopping street theme remembered from the summer of 1988, played back like a worn cassette tape, slightly detuned and wobbly, warm analog synth and soft electric piano, gentle acoustic guitar, light shuffle rhythm, bittersweet and dreamy, a little mysterious, looping exploration music, steady dynamics, instrumental, slow tempo, relaxed pace, down-tempo, laid-back feel',
    SUNO_LOOP_EDIT,
    'd32a4368724b',
    2153579,
    'ArcadeAfternoon（日常の曲）',
    '2026-10-19',
  ),
  sunoBgm(
    'bgm.dusk',
    '夕暮れの時計屋',
    'suno_dusk.mp3',
    'gentle instrumental variation of the theme, string quartet and soft celesta, harp arpeggios, a quiet old clock shop at sunset, soft clock ticking, golden evening light, nostalgic and calm with a little sadness, 72 bpm, background music under dialogue, steady dynamics, instrumental',
    SUNO_LOOP_EDIT,
    'f372543f4ed6',
    1644818,
    SUNO_MAIN_THEME,
    '2026-10-19',
  ),
  sunoBgm(
    'bgm.factory',
    '昭和44年の町工場（2-1）',
    'suno_factory.mp3',
    'a snowy winter evening in a small Japanese machine workshop in 1969, remembered like an old 8mm film, warm sepia mood, gentle accordion and soft brass, plucked strings and quiet metallic percussion like turning gears, a stubborn master and his young apprentice, hardworking and warm with quiet sadness, A minor, 84 bpm, looping exploration music, steady dynamics, instrumental',
    SUNO_LOOP_EDIT,
    '5fd145e05e8f',
    877759,
    undefined,
    '2026-10-19',
  ),
  sunoBgm(
    'bgm.culture_festival',
    '平成18年の文化祭（2-2）',
    'suno_culture_festival.mp3',
    'a high school culture festival in autumn 2006, remembered like a faded camcorder video, nostalgic J-rock band sound with clean electric guitar arpeggios, warm bass and light drums, hallways full of laughter, a band that will break up after graduation, youthful and bittersweet, E major, 120 bpm, looping exploration music, steady dynamics, instrumental',
    SUNO_LOOP_EDIT,
    '47e4cf43f441',
    1132296,
    undefined,
    '2026-10-19',
  ),
  sunoBgm(
    'bgm.kai',
    'カイとの戦い',
    'suno_kai.mp3',
    'Glitchy rock game battle theme; static-noise stutters, tape-stop hits, and VHS wobble; instrumental; distorted bass, driving drums, ticking-clock pulse, catchy guitar riff with a repeated two-bar hook; 145 BPM, G minor, short punchy intro straight into the main riff, consistent energy and loop-friendly ending.',
    SUNO_LOOP_EDIT,
    'deadebfe1c1b',
    655823,
    undefined,
    '2026-10-19',
  ),
  sunoBgm(
    'bgm.riverside',
    '平成10年の河川敷（2-3）',
    'suno_riverside.mp3',
    'small and laid-back summer afternoon tune, a riverside baseball field in 1998, remembered like a sun-faded photograph, just acoustic guitar strumming, light whistling melody, simple bass and soft brushed snare, lo-fi warm tape sound, relaxed and a little nostalgic, D major, 96 bpm, looping exploration music, steady dynamics, instrumental',
    SUNO_LOOP_EDIT,
    '2010e06c0f79',
    1321005,
    undefined,
    '2026-10-20',
  ),
  // 段階86：決意の曲（2-3 の4晩目、保管局の奥の書庫の探索）。指示文は控えていない（届いた時の説明は docs/ART.md の曲の表の決意の曲）
  sunoBgm(
    'bgm.resolve',
    '決意の曲（2-3 の4晩目）',
    'suno_resolve.mp3',
    '（指示文は控えていない。On My Way Home を Cover した、明るく盛り上がるポップロック）',
    SUNO_LOOP_EDIT,
    'a23e71602ff4',
    1369279,
    'On My Way Home（しんみり・帰り道の曲）',
    '2026-10-21',
  ),
  sunoBgm(
    'bgm.fumi',
    'ふみさんの思い出（4日目）',
    'suno_fumi.mp3',
    'solo felt piano and a soft music box, sparse and tender, an elderly woman remembering her late husband, riding on the back of his bicycle through a shopping street at sunset, bittersweet and warm, gentle sadness without despair, quiet clock ticking far away, D major with minor colors, 66 bpm, background music under dialogue, steady dynamics, instrumental',
    SUNO_WHOLE_EDIT,
    'c1e926ac7e99',
    2127248,
    undefined,
    '2026-10-25',
  ),
  sunoBgm(
    'bgm.archive',
    '保管局の奥の書庫（2-3 の4晩目）',
    'suno_archive.mp3',
    'sneaking through a vast silent archive of endless shelves filled with hourglasses, mysterious and tense but not horror, low cello pulse and pizzicato strings, soft celesta and glassy bell tones, distant clock ticking, a cold blue-white light, a powerful guardian patrolling somewhere nearby, E minor, 96 bpm, looping exploration music, steady dynamics, instrumental',
    SUNO_WHOLE_EDIT,
    '84581908a7dd',
    1676165,
    undefined,
    '2026-10-25',
  ),
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
  heroPortrait('frustrated', '悔しい', 'frustrated and regretful, biting the lip, brows drawn together, eyes glistening', '2026-10-11'),
  heroPortrait('angry', '怒り', 'angry, brows sharply drawn together, teeth clenched, eyes blazing', '2026-10-11'),
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
  // 子どもの3人の表情の残り（2026-10-19。docs/ART.md の 6-7 の Gemini の 6。プロローグの台本で使う表情）
  ...(
    [
      ['hero', 'ハルト', 'surprised', '驚き', 'surprised, eyes wide open, mouth slightly open, eyebrows raised', '通常'],
      ['hero', 'ハルト', 'shy', '照れ', 'embarrassed and quietly happy, light blush on the cheeks, eyes looking down and aside, a tiny shy smile with the mouth closed, a quiet child who is not used to being included', '通常'],
      ['akari', 'あかり', 'laugh', '大笑い', 'laughing happily with the mouth wide open, eyes closed', '笑顔'],
      ['akari', 'あかり', 'pout', 'むっ', 'pouting, cheeks puffed, frowning a little', '笑顔'],
      ['akari', 'あかり', 'surprised', '驚き', 'surprised, eyes wide open, mouth slightly open, eyebrows raised', '笑顔'],
      ['akari', 'あかり', 'dejavu', 'デジャヴ', 'a puzzled, faraway look as if she has seen this moment before, eyes slightly unfocused and gazing past the viewer, lips slightly parted, a faint wondering frown', '笑顔'],
      ['akari', 'あかり', 'sad', '悲しい', 'sad and quiet, eyes looking down, mouth closed, brows slightly lowered, holding back tears', '笑顔'],
      ['riku', 'りく', 'flustered', 'あせり', 'flustered and caught off guard, eyes darting aside, an awkward forced grin, eyebrows raised, a boy whose plan just went wrong', '得意げ'],
      ['riku', 'りく', 'smirk', 'にやり', 'a mischievous smirk, one corner of the mouth raised, eyes narrowed playfully, like a boy hiding a fun secret', '得意げ'],
      ['riku', 'りく', 'normal', '通常', 'relaxed and natural, mouth closed, a lively, confident look in the eyes', '得意げ'],
      ['riku', 'りく', 'surprised', '驚き', 'surprised, eyes wide open, mouth slightly open, eyebrows raised', '得意げ'],
      ['riku', 'りく', 'shy', '照れ', 'embarrassed, light blush on the cheeks, eyes looking aside, a small awkward grin, rubbing it off as if it is nothing', '得意げ'],
    ] as const
  ).map(([who, name, face, title, expression, base]): AssetEntry => ({ ...youngFace(who, name, face, title, expression, base), acquiredAt: '2026-10-19' })),
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
  chatgptPortrait(
    'noa',
    'ノア',
    'normal',
    '通常',
    STYLE_PREFIX +
      'Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm expressionless face. ' +
      PORTRAIT_FRAMING.replace('the girl', 'the girl in the cardigan') +
      'Character: Noa. Keep her design exactly as in the attached character sheet: pale silver hair with a faint blue-green tint in a short bob, cool blue-green eyes, white high-collared futuristic long coat with thin blue-green lines, dark navy inner top, small hourglass-shaped collar clasp. No glowing light effects in this portrait.',
    `ノアの設定画（ChatGPT で作った全身の絵。その指示文：${NOA_SHEET_PROMPT}）と、あかりの笑顔の立ち絵（構図の見本）`,
    'ノアの見た目を決めた基本の1枚（docs/ART.md の「ノアの見た目（決まった）」）。M1 では 2-C の1枚絵だけに出る',
  ),
  chatgptPortrait(
    'fumi',
    'ふみ',
    'normal',
    '通常',
    STYLE_PREFIX +
      'Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, gentle expression with a soft, slightly lonely smile. ' +
      PORTRAIT_FRAMING +
      'Character: Fumi, a very old Japanese grandmother, clearly in her mid-80s. She must look truly elderly, like a real old granny, NOT a young or middle-aged woman with gray hair. ' +
      'Face: a small, rounded face with many deep wrinkles (crow\'s feet, laugh lines, forehead lines), sagging cheeks and a softened jawline, thin lips, slightly drooping eyelids, small narrow kind eyes, a few faint age spots on the cheeks. ' +
      'Hair: thin, pure white hair, pulled back into a small low bun, a little sparse at the hairline. ' +
      'Body: very small and frail, rounded shoulders, a slightly hunched upper back, a short thin neck with wrinkles. ' +
      'Clothes: a soft, old-fashioned beige knitted cardigan buttoned over a plain pale blouse with a small round collar, like a typical Japanese grandmother in a quiet regional town. ' +
      'Mood: gentle and warm, a person who has quietly lived a long life alone after losing her husband. ' +
      'Make her look older: deeper wrinkles, more hunched posture, thinner white hair. Do not beautify or make her look young.',
    'あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 1-2 の持ち主（docs/script/M2.md の 5.）。開発者の希望で、脚本のたたき台より年を取った見た目にした。最初の指示文で若く見えたので、最後の1文を足して作り直した',
  ),
  chatgptPortrait(
    'past_fumi',
    '写しのふみ',
    'smile',
    '笑顔',
    STYLE_PREFIX +
      'Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lively, strong-willed smile. ' +
      PORTRAIT_FRAMING +
      'Character: young Fumi, the same woman as the attached elderly portrait but about 40 years earlier: a Japanese woman in her early 40s in the summer of 1988. Keep the same face features and kind eyes so she is clearly the same person. Short permed black hair, slightly thin after a month in hospital but cheerful. A modest 1980s blouse with a small round collar and a light summer cardigan, her going-out clothes for the day she leaves the hospital.',
    'ふみ（今）の立ち絵（同じ人に見せるため）と、あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 1-2 の写し（昭和63年の夏、40代）。ノイズとセピアの加工はゲームの側でかける',
  ),
  chatgptPortrait(
    'past_kiyoshi',
    '写しのきよし',
    'normal',
    '通常',
    STYLE_PREFIX +
      'Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a blunt, taciturn expression, mouth closed, but kind eyes. ' +
      PORTRAIT_FRAMING +
      'Character: Kiyoshi, a Japanese man in his mid 40s in the summer of 1988, a quiet, stubborn craftsman who is bad at showing his feelings. Short cropped black hair, sun-tanned face, stern brows. A faded navy work jacket over a white undershirt.',
    'あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 1-2 の写し（昭和63年の夏、40代。ふみの夫）。ノイズとセピアの加工はゲームの側でかける',
  ),
  {
    id: 'cg.noa_passing',
    kind: 'image',
    title: '1枚絵（ノアとのすれ違い）',
    file: 'assets/cg/noa_passing.webp',
    status: 'placeholder',
    source: {
      type: 'ai',
      service: 'ChatGPT',
      plan: '無料',
      prompt:
        STYLE_PREFIX +
        'A single key visual (event CG). Vertical 9:16 image. ' +
        'Inside an endless library whose towering shelves hold glowing hourglasses instead of books, dim indigo shadows and soft golden light. A boy and a girl in Japanese school uniforms (keep their designs exactly as in the attached reference portraits) stand in the aisle, seen from a slight side angle. A mysterious girl walks past them, very close, in the opposite direction. The passing girl: about 17, pale silver hair with a faint blue-green tint in a short bob, cool blue-green eyes, expressionless, a clean white long coat with thin blue-green lines like a futuristic uniform; she gives off a cold, faint white light that contrasts with the warm golden library. Her eyes are turned not toward the boy but toward the girl beside him, as if she recognizes her. The boy is looking at the passing girl in surprise. Grains of golden sand drift in the air between them, and time feels frozen for a moment. ' +
        'Keep the lower quarter of the image simple, because a text box may cover it. ' +
        'Absolutely no letters or text anywhere.',
      settings: '見本の絵：ハルトとあかりの立ち絵、ノアの設定画と胸から上の絵。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    },
    author: 'RESTOPIA 開発（ChatGPT で作成）',
    license: 'OpenAI 利用規約（出力の権利は利用者に渡す）',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-10',
    termsCopy: 'docs/licenses/ai-openai.md',
    notes: 'M1 の 2-C（docs/ART.md の 5-2 の 10）。ノアの目線はハルトの隣（あかり）に向く（docs/STORY.md の伏線）',
  },
  // M2 の 1-2 の地図・背景・1枚絵と、最初の敵の絵（2026-10-11。docs/ART.md の 5-3 の 12・13）
  chatgptArt(
    'map.showa_street',
    '昭和の商店街の見下ろしの地図（1-2「夕暮れの二人乗り」）',
    'assets/maps/showa_street.webp',
    STYLE_PREFIX +
      'Top-down map illustration for a mobile RPG exploration scene. Vertical 9:16 image. A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. ' +
      'Scene: a real, lived-in Japanese shotengai (local shopping street) in a regional town in the summer of 1988, at sunset, in warm sepia-tinted retro colors. It must look like an actual old town shopping street, NOT a festival with separate stalls. ' +
      "Structure: Both sides of the street are continuous rows of old two-story wooden and mortar shop-houses built wall to wall with no gaps between them: the shop on the ground floor, the family's living quarters upstairs with small windows, laundry poles and air-conditioner units. Tiled and tin roofs seen from above. " +
      'Each shop opens directly onto the street with its goods spilling out in front: wooden fruit crates, racks and display cases, cloth or metal awnings, half-open roll-up shutters. ' +
      'The street is open to the sky (no arcade roof covering it), lined with old suzuran-shaped street lamps and small blank decorative flags hung between them. ' +
      'Everyday clutter along the shop fronts: parked bicycles, potted plants, plastic beer crates, a vending machine, a red public phone, a round red mailbox, utility poles and sagging wires. ' +
      'Layout from bottom to top: Bottom center: the entrance of the shopping street, a simple steel gateway arch with a blank sign board. One wide straight street running up the middle of the image. ' +
      'Two or three narrow back alleys between the buildings, branching left and right, with walls and drainpipes on both sides. ' +
      'Shops along the street: a greengrocer with fruit crates, a small candy shop (dagashi-ya) with a wooden bench in front, an electronics shop with old CRT TVs in the window, a tobacco stand with a red public phone, and a small clock shop with a warmly lit window. ' +
      'Top: the end of the shopping street, opening onto a gentle downhill slope toward the town. ' +
      'Walkable areas (the street, the back alleys, the slope) must be clearly distinguishable from non-walkable objects (buildings, goods, bicycles, poles). The main street is wide, at least one eighth of the image width. ' +
      'Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.',
    '見本の絵：昭和の商店街の背景（bg.showa_street。店の並びをそろえるため）。元の絵は 941×1672。768×1376（24×43マス）に縮めて WebP にした（縦が 0.8% 伸びる）',
    'M2 の 1-2 の地図（docs/ART.md の 5-3 の 12）。はじめは縁日の地図を見本に付けたら、店が屋台のように離れて建ったので、見本を外して指示文を書き直した。歩ける場所の文字の地図は、段階37で書いた（rooms.ts の SHOWA_STREET_LAYOUT）。2026-10-26：開発者が ChatGPT Plus で手直しした絵に差し替えた（左は17〜20マス目、右は28〜31マス目に横道を開けた。出入口もそこへずらした）',
  ),
  chatgptArt(
    'bg.showa_street',
    '背景（昭和の商店街・夕焼け）',
    'assets/backgrounds/showa_street.webp',
    STYLE_PREFIX +
      'Background art for a visual novel dialogue scene. Vertical 9:16 image. No people. ' +
      'A small covered shopping arcade street in a Japanese regional town in the summer of 1988, at sunset. Old storefronts line both sides: a greengrocer with wooden fruit crates, a tiny candy shop (dagashi-ya) with a wooden bench in front, an electronics shop with old CRT televisions in the window, a tobacco stand with a red public telephone, and a small clock shop with a warmly lit window. Faded cloth awnings; at the far end the arcade opens onto a gentle downhill slope glowing in golden evening light. Warm, slightly faded sepia-like colors, like an old photograph. ' +
      'Eye-level camera, the street centered. ' +
      'Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.',
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M2 の 1-2 の会話の背景（docs/ART.md の 5-3 の 12）',
  ),
  chatgptArt(
    'cg.tandem_bicycle',
    '1枚絵（夕焼けの二人乗り）',
    'assets/cg/tandem_bicycle.webp',
    STYLE_PREFIX +
      'A single key visual (event CG). Vertical 9:16 image. ' +
      'A small Japanese shopping arcade street in the summer of 1988 at sunset, in warm, slightly faded sepia-like colors, the street opening onto a gentle downhill slope bathed in golden evening light. A middle-aged man pedals an old black utility bicycle down the slope, turning his head slightly back with a shy, awkward smile; his wife sits sideways on the rear rack, holding onto his back, laughing with teary eyes (keep their designs as in the attached reference portraits). Shopkeepers wave from the storefronts behind them, welcoming her home. Long shadows, warm backlight. ' +
      'Keep the lower quarter of the image simple, because a text box may cover it. Absolutely no letters or text anywhere.',
    '見本の絵：写しのふみ（笑顔）・写しのきよし（通常）の立ち絵。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M2 の 1-2-9（1章の山場。docs/ART.md の 5-3 の 12）',
  ),
  chatgptArt(
    'enemy.tin_noise',
    '敵の絵（ブリキノイズ）',
    'assets/enemies/tin_noise.webp',
    'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature. ' +
      'Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. ' +
      'It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. ' +
      'Body: a broken tin toy robot tangled with wind-up springs and keys, heavy and stiff',
    '見本の絵なし。元の絵は 1254×1254。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜き、640×640 に縮めた（まわりの薄い砂の渦は、抜く時にほとんど消えた）',
    'M2 の 1-2 の砂嵐（docs/ART.md の 5-3 の 13）。最初に作った敵の絵。段階37で戦闘画面に出した（enemyArt.ts の ENEMY_ART）',
  ),
  // M2 のみお・カイ・2-1 の人たちと背景・地図・1枚絵、1-2 の残りの背景と敵（2026-10-13〜14。docs/ART.md の 5-5 の作る順番の 5〜11）
  chatgptPortrait(
    'mio',
    'みお',
    'smile',
    '笑顔',
    portraitHead('a wide, confident grin', 'the little girl in the yukata, with the same childlike proportions').replace('No props. ', 'No props, no cards. ') +
      'Character: Mio. Keep her design exactly as in the attached character sheet: bright light-brown short hair with one tiny side tuft tied by a small orange hair tie, big lively brown eyes, round cheeks, a slightly sunburnt nose, a plain sunny-yellow T-shirt with no logo.',
    'みおの設定画（開発者が持っている）と、子どものあかりの笑顔の立ち絵（構図の見本）',
    '3人目の仲間（docs/ART.md の 5-3 の 1）。表情違いは Gemini で作る（5-3 の 14）',
    '2026-10-13',
  ),
  chatgptPortrait(
    'kai',
    'カイ',
    'smug',
    '余裕',
    portraitHead('a confident, condescending smirk') +
      'Character: Kai. Keep his design exactly as in the attached character sheet: swept-back ash-blond hair with one or two loose strands over the forehead, sharp narrow steel-gray eyes, white high-collared long coat with thin blue-green lines worn open over a black high-neck inner top. No weapon, no glowing light effects in this portrait.',
    'カイの設定画（髪と目を直した後。開発者が持っている）と、あかりの笑顔の立ち絵（構図の見本）',
    '2-3 の相手（docs/ART.md の 5-3 の 2）。表情違いは Gemini で作る（5-3 の 14）',
    '2026-10-13',
  ),
  chatgptArt(
    'enemy.kai',
    '敵の絵（カイ）',
    'assets/enemies/kai.webp',
    'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading. No text, no watermark, no signature. ' +
      'Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. Full body, centered, plain pure white background, no shadow, no ground. ' +
      'Kai, keep his design exactly as in the attached character sheet, in a fighting stance: holding the square frame-shaped blade "Frame" up in front of him like a camera viewfinder, looking at the viewer through it with a cold smirk, his open white coat flaring. Thin blue-green light lines run along the blade.',
    '見本の絵：カイの設定画（髪と目を直した後）。元の絵は 1254×1254。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜き、640×640 に縮めた',
    '2-3 の負け戦の相手（docs/ART.md の 5-3 の 2）。戦闘画面に敵の絵を出す仕組みは段階37で作った（enemyArt.ts の ENEMY_ART。カイは段階40で足す）',
    '2026-10-13',
  ),
  chatgptArt(
    'enemy.phone_noise',
    '敵の絵（黒電話ノイズ）',
    'assets/enemies/phone_noise.webp',
    enemyHead(SHOWA_COLORS) + 'Body: an old black rotary telephone tangled in its own coiled cords like tentacles, the bell ringing nonstop',
    ENEMY_CUT,
    'M2 の 1-2 の砂嵐（docs/ART.md の 5-3 の 13）',
    '2026-10-13',
  ),
  chatgptArt(
    'enemy.ramune_noise',
    '敵の絵（ラムネノイズ）',
    'assets/enemies/ramune_noise.webp',
    enemyHead(SHOWA_COLORS) +
      'Body: a swarm of glass ramune soda bottles with marbles rattling inside, quick and jittery' +
      ' / 直しの指示（同じチャットで、できた絵を添付）: Edit the attached enemy art. Keep the overall concept, the art style, the black-and-white static noise and the drifting sand, the plain pure white background. ' +
      'Fix the bottles: every bottle must be a classic Japanese ramune bottle (Codd-neck bottle), NOT a modern bottle: Made entirely of thick, pale aqua-green glass (light blue-green tint), slightly bubbly old glass. ' +
      'A slim body with a distinctive pinched neck: two small dents (pressed-in pockets) in the middle of the neck, and above them a narrow chamber. ' +
      'One clear glass marble (a round transparent ball) trapped in that narrow neck chamber, above the dents, NOT floating in the body of the bottle. The marble must not look like an eye. ' +
      'The mouth is sealed by the marble from inside: no screw cap, no cork, no orange or red caps. At most a thin plain blue plastic ring at the very top. Some bottles have fizzy clear soda with small bubbles inside. ' +
      'Make it fewer, larger bottles (about 8 to 12) so each ramune shape reads clearly as a small silhouette on a phone screen. The creature is a quick, jittery swarm: the bottles bump and rattle together, marbles clinking, with a few loose glass marbles bouncing around it. ' +
      'Colors of its era: sepia, faded green and orange (orange only in the sand and light, not on the bottles).',
    ENEMY_CUT,
    'M2 の 1-2 の砂嵐（docs/ART.md の 5-3 の 13）。最初の絵はキャップ付きの今の瓶になり、ビー玉が目玉に見えたので、直しの指示で作り直した（直しの指示は Claude が渡した文。開発者が実際に送った文と違えば直す）',
    '2026-10-13',
  ),
  chatgptArt(
    'enemy.menko_noise',
    '敵の絵（めんこノイズ）',
    'assets/enemies/menko_noise.webp',
    enemyHead(SHOWA_COLORS) + 'Body: a whirling flock of old paper menko cards and spinning beigoma tops (blank cards, no letters)',
    ENEMY_CUT,
    'M2 の 1-2 の砂嵐（docs/ART.md の 5-3 の 13）',
    '2026-10-13',
  ),
  chatgptArt(
    'enemy.bicycle_boss',
    '敵の絵（自転車のぬし）',
    'assets/enemies/bicycle_boss.webp',
    enemyHead(SHOWA_COLORS) +
      'A large boss monster, filling most of the image. ' +
      'Body: a swirling tangle of several old bicycles, wheels and bells knotted together by noise, a faint shadow of a rear carrier seat at its center',
    ENEMY_CUT,
    'M2 の 1-2 のボス（docs/ART.md の 5-3 の 13）',
    '2026-10-13',
  ),
  chatgptArt(
    'bg.clock_shop_day',
    '背景（時計屋の店内・昼）',
    'assets/backgrounds/clock_shop_day.webp',
    BG_HEAD +
      'The same old watch and clock shop as the attached image, but at noon on a bright summer day. Soft white daylight through the front glass door and windows, the wall clocks and the glass display counter in clear, natural colors, a calm and cozy everyday atmosphere instead of the dusk mood. ' +
      'Eye-level camera, the same angle as the attached image. ' +
      BG_TAIL,
    '見本の絵：時計屋の店内（夕暮れ。bg.clock_shop）。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M2 の 3-B・4-A（docs/ART.md の 5-3 の 12）',
    '2026-10-13',
  ),
  chatgptArt(
    'bg.riverside_path',
    '背景（川沿いの帰り道・夕暮れ）',
    'assets/backgrounds/riverside_path.webp',
    BG_HEAD +
      'A quiet path along a small river in a Japanese regional town at summer dusk. A low concrete embankment with summer grass, a narrow paved path, an old iron railing, a small bridge in the distance, the river reflecting the orange and indigo sky, dragonflies. ' +
      'Eye-level camera, the path leading into the distance. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M2 の 4-A（あかり3。docs/ART.md の 5-3 の 12）',
    '2026-10-13',
  ),
  chatgptArt(
    'map.factory_alley',
    '昭和44年の雪の町工場の路地の見下ろしの地図（2-1）',
    'assets/maps/factory_alley.webp',
    STYLE_PREFIX +
      'Top-down map illustration for a mobile RPG exploration scene. Vertical 9:16 image. A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. ' +
      'Scene: a small factory district of a Japanese town at snowy winter dusk in 1969, sepia-tinted retro colors with white snow. ' +
      'Layout from bottom to top: Bottom center: the entrance of a narrow alley. Narrow alleys winding upward between small wooden machine workshops with sliding doors and warm lit windows, with one or two short side alleys. ' +
      'Around the middle: a public bathhouse with steam rising and a long wooden bench in front of it, a small open space. Upper part: a small factory gate. ' +
      'Top: the inside of a small workshop seen from above with its roof removed, with a large old lathe in an open space in front of it. Utility poles, snow piles, barrels and stacked wood along the edges. ' +
      'Walkable areas must be clearly distinguishable from non-walkable objects. Paths are wide, at least one eighth of the image width. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.',
    '見本の絵：1-1 の縁日の地図（見下ろし方の見本として渡す指示）。元の絵は 941×1672。768×1376（24×43マス）に縮めて WebP にした（縦が 0.8% 伸びる）。' +
      '2026-10-17 に、銭湯の前の広場の左右を辺まで開けた絵に差し替えた（今の地図と、開ける所を青く塗った docs/sketches/factory_alley_openings.jpg を付けて、docs/ART.md の 6-2 の編集の指示文で頼んだ。元の絵は 937×1679）',
    'M2 の 2-1 の地図（docs/ART.md の 5-3 の 6）。入口 → 銭湯の前の長いす → 工場の門 → 工場の中の旋盤。歩ける場所の文字の地図は段階38で書いた（rooms.ts の FACTORY_ALLEY_LAYOUT）。左右の開いた所に寄り道の部屋2つ（map.factory_yard・map.bath_alley）がつながる',
    '2026-10-13',
  ),
  chatgptPortrait(
    'isamu',
    'いさむ',
    'normal',
    '通常',
    portraitHead('a calm, taciturn expression with gentle eyes behind his glasses') +
      "Character: Isamu, a Japanese gear craftsman around 75 years old, Mio's grandfather, who runs a tiny old machine workshop in a quiet regional town. Small and wiry, short white hair, thin round glasses, deep wrinkles, a stubborn mouth but gentle eyes. An old brown cardigan over a faded factory work jacket. A man of few words.",
    'あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 2-1 の持ち主（docs/ART.md の 5-3 の 4）',
    '2026-10-13',
  ),
  chatgptPortrait(
    'past_isamu',
    '写しのいさむ',
    'serious',
    '真剣',
    portraitHead('a serious, determined face, cheeks red from the cold') +
      "Character: young Isamu, the same man as the attached elderly portrait but 57 years earlier: an 18-year-old apprentice at a small machine workshop in the winter of 1969. Keep the same face features so he is clearly the same person, with lively eyes that look like the attached little girl's (his granddaughter). Very short buzz-cut black hair, cheeks red from the cold, an oil-stained gray work jacket.",
    'いさむ（今）とみおの立ち絵（同じ人・孫に見せるため）と、あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 2-1 の写し（昭和44年の冬、18歳。docs/ART.md の 5-3 の 4）。ノイズとセピアの加工はゲームの側でかける',
    '2026-10-13',
  ),
  chatgptPortrait(
    'past_genzo',
    '写しの源三',
    'normal',
    '通常',
    portraitHead('a stern, intimidating face with thick brows') +
      'Character: Genzo, the stern master of a small Japanese machine workshop in the winter of 1969, in his 50s. Thick eyebrows, a weathered face, a white hand towel tied around his head, a heavy dark navy work jacket. Intimidating, but you can trust him with your life.',
    'あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 2-1 の写し（昭和44年の冬。町工場の親方。docs/ART.md の 5-3 の 4）。ノイズとセピアの加工はゲームの側でかける',
    '2026-10-13',
  ),
  chatgptArt(
    'bg.factory_1969',
    '背景（昭和44年の町工場の中・冬の夜）',
    'assets/backgrounds/factory_1969.webp',
    BG_HEAD +
      'Inside a small Japanese machine workshop on a winter night in 1969, sepia tones. A single bare light bulb hangs over a worn wooden workbench with files, calipers and a few tiny brass gears. Old lathes and drilling machines driven by long leather belts from a ceiling shaft stand in the shadows; metal shavings on the concrete floor; a small kerosene stove glowing orange; snow visible through a frosted window. Humble, hardworking, quiet. ' +
      'Eye-level camera, the workbench and the bare bulb in the center. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M2 の 2-1-8（docs/ART.md の 5-3 の 5）。6-A は同じ絵を古びた今の色に加工して使い回す',
    '2026-10-13',
  ),
  chatgptArt(
    'bg.factory_alley',
    '背景（昭和44年の雪の町工場の路地・夕暮れ）',
    'assets/backgrounds/factory_alley.webp',
    BG_HEAD +
      'A narrow alley in a small factory district of a Japanese town at snowy winter dusk in 1969, sepia tones with soft white snow. Small wooden machine workshops with sliding doors and warm lit windows on both sides, utility poles and sagging wires, a public bathhouse chimney with steam in the distance, snow piled at the edges of the alley. ' +
      'Eye-level camera, the alley running straight into the distance. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M2 の 2-1 の会話（docs/ART.md の 5-3 の 5）',
    '2026-10-13',
  ),
  // 1章・2章の1枚絵と、ひなの・しげるの立ち絵（2026-10-20。docs/ART.md の 5-3 の 3.・5-5・6-5・6-6・11-2）
  chatgptArt(
    'cg.awaken_weapons',
    '1枚絵（長針の剣と、金魚の灯籠の杖）',
    'assets/cg/awaken_weapons.webp',
    CG_HEAD +
      "A summer shrine festival at dusk, broken by black-and-white TV static noise: parts of the stalls and lanterns are missing like torn film. In the foreground, a 17-year-old boy (keep his design as in the attached portrait) raises his left arm in surprise as his wristwatch bursts into golden light; the watch's long minute hand stretches out of the light and becomes a slender sword shaped like a clock's minute hand, with a small clock-face guard. Beside him, a 17-year-old girl (keep her design as in the attached portrait) holds her red goldfish hair clip as it glows and unfolds into a staff with a small glowing goldfish-shaped paper lantern hanging from its tip. Both look astonished. Golden sparks and grains of sand swirl around them. In the background, a shadowy creature made of goldfish and water balloons crawls out of the static. " +
      CG_TAIL,
    '見本の絵：ハルト・あかりの立ち絵。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    '1-1 で持ち物が武器に変わる瞬間（docs/ART.md の 11-2）',
    '2026-10-20',
  ),
  chatgptArt(
    'cg.mio_cards',
    '1枚絵（光るトランプ）',
    'assets/cg/mio_cards.webp',
    CG_HEAD +
      "A snowy factory alley in a Japanese town at winter dusk in 1969, sepia tones, partly broken by black-and-white TV static noise. A 12-year-old girl in a winter coat (keep her design as in the attached portrait) holds out her hand in surprise as a deck of playing cards bursts out of its small box in her coat pocket. The cards swirl around her in a ring, each card's edge glowing like a thin blade, and fan out in her hand. Among them, one hand-drawn joker card stands out. Warm golden light on her face, snowflakes and grains of sand in the air. No letters or numbers readable on the cards. " +
      CG_TAIL,
    '見本の絵：みおの立ち絵。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    '2-1 でみおのトランプが武器に変わる瞬間（docs/ART.md の 11-2）',
    '2026-10-20',
  ),
  chatgptArt(
    'cg.cut_ground',
    '1枚絵（四角い枠に切り取られるグラウンド）',
    'assets/cg/cut_ground.webp',
    CG_HEAD +
      'A late 1990s Japanese riverside little league baseball field on a bright summer afternoon, pastel sky. A glowing rectangular frame of white light slices across the whole scene like a camera viewfinder; inside the frame the field, players and cheering parents are frozen and drained of color, as if being cut out like a photograph. On top of the backstop stands Kai, a young man in an open white long coat with thin blue-green lines (keep his design as in the attached portrait), holding a square frame-shaped blade, a tiny hourglass forming in his other hand with the frozen field inside it. In the foreground, a high school boy and a high school girl and a small 10-year-old girl (keep their designs exactly as in the attached reference portraits) reach out too late. Grains of golden sand scatter. ' +
      CG_TAIL,
    '見本の絵：ハルト・あかり・みお・カイの立ち絵。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    '2-3 でカイに持ち去られる場面（2章の山場。docs/ART.md の 5-3 の 3.）',
    '2026-10-20',
  ),
  chatgptArt(
    'cg.fireworks',
    '1枚絵（高台で花火を見る3人の後ろ姿）',
    'assets/cg/fireworks.webp',
    CG_HEAD +
      'A small grassy hill behind a Japanese shrine on a summer night. Three 7-year-old children seen from behind, sitting side by side on the grass, looking up at big colorful fireworks blooming in the deep indigo sky over a quiet town (keep their designs exactly as in the attached portraits): a quiet boy with black hair and one sand-gold strand in a navy hoodie on the left, a girl with a chestnut bob and a red goldfish hair clip in a white yukata with red goldfish in the middle, a spiky-haired boy in a navy jinbei on the right pointing at the sky. Three small white fox masks pushed up on the backs of their heads. The light of the fireworks colors their backs. Nostalgic, a moment that should never end. ' +
      CG_TAIL,
    '見本の絵：子どものハルト・あかり・りくの立ち絵。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'プロローグの終わり（P-5。docs/ART.md の 5-5）',
    '2026-10-20',
  ),
  chatgptArt(
    'cg.photo_goldfish',
    '写真（浴衣の小さなあかりと、金魚の袋ふたつ）',
    'assets/cg/photo_goldfish.webp',
    CG_HEAD +
      'An old, slightly faded snapshot photo taken about ten years ago at a shrine festival at night, warm and a little blurry like a phone photo. A 7-year-old girl with a chestnut bob and a red goldfish hair clip, in a white yukata with small red goldfish (keep her design as in the attached portrait), smiling proudly at the camera and holding up two small plastic bags of water, each with one red goldfish, one in each hand. Paper lanterns blurred in the background. Square 1:1 image instead of 9:16. ' +
      CG_TAIL,
    '見本の絵：子どものあかりの立ち絵。元の絵は正方形 1254×1254。画面いっぱいに出すと左右が切れるので、同じ絵をぼかした縦長の台紙（720×1280）の真ん中に、白い縁を付けて少し傾けて置いた',
    'あかりのスマホの古い写真（1-D。docs/ART.md の 5-5）',
    '2026-10-20',
  ),
  chatgptArt(
    'cg.white_city',
    '1枚絵（白い街・夢）',
    'assets/cg/white_city.webp',
    BG_HEAD +
      'A dreamlike, hazy vision of a pure white futuristic city: smooth white towers and bridges with thin blue-green light lines, empty and silent, no people, soft overexposed light as if seen through fog, edges fading into white. Cold, lonely and beautiful, like a half-forgotten memory. Eye-level camera, a long empty white street leading into the distance. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    '1日目の朝の夢（1-A。docs/ART.md の 5-5）',
    '2026-10-20',
  ),
  chatgptPortrait(
    'hinano',
    'ひなの',
    'normal',
    '通常',
    portraitHead('a guarded, slightly sulky expression') +
      'Character: Hinano, an 18-year-old Japanese high school senior from a neighboring town, the younger sister of a laid-back university student. Straight black hair to the shoulders with blunt bangs, sharp but kind eyes, a strong-willed, stubborn look. A summer school uniform (white short-sleeve blouse, navy ribbon), a school bag with a faded red goldfish keychain.',
    'あかりの笑顔の立ち絵（構図の見本）',
    '1-1 のゆうまの妹（今。docs/ART.md の 6-5）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す',
    '2026-10-20',
  ),
  chatgptPortrait(
    'shigeru',
    'しげる',
    'smile',
    '笑顔',
    portraitHead('a friendly, slightly nostalgic smile') +
      'Character: Shigeru, a 45-year-old Japanese man who runs a small old-fashioned electronics shop on a shopping street in a quiet regional town. Short graying hair, kind tired eyes, a work apron over a plain polo shirt, a pencil behind his ear, a small screwdriver in the apron pocket. Friendly and talkative, the kind of shopkeeper who has known the neighborhood since he was a child.',
    'あかりの笑顔の立ち絵（構図の見本）',
    '1-2 の電器屋の主人（docs/ART.md の 6-6）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す',
    '2026-10-20',
  ),
  chatgptArt(
    'cg.master_back',
    '1枚絵（親方の背中）',
    'assets/cg/master_back.webp',
    CG_HEAD +
      'Inside a small Japanese machine workshop on a snowy winter night in 1969, sepia tones with warm light from a single bare bulb. On the workbench, a tiny brass clock gear glints. An old master craftsman with a white towel around his head walks away toward the back of the workshop, his broad back to the viewer, his ears slightly red. In the foreground, an 18-year-old apprentice in an oil-stained work jacket bows deeply, his face hidden, tears falling (keep their designs as in the attached portraits). Lathes and belts in the shadows, snow visible through the window. ' +
      CG_TAIL,
    '見本の絵：写しのいさむ（真剣）・写しの源三（通常）の立ち絵。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M2 の 2-1-8（2-1 の山場。docs/ART.md の 5-3 の 7）',
    '2026-10-14',
  ),
  chatgptPortrait(
    'kenta',
    'けんた',
    'smile',
    '笑顔',
    portraitHead('a relaxed, easygoing grin') +
      'Character: Kenta, a 37-year-old Japanese man who runs a small musical instrument shop on a shopping street. Slightly messy medium-length dark-brown hair, light stubble, a casual dark T-shirt under a canvas shop apron. A laid-back, chatty former high school band frontman who gave up music long ago.',
    'あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 2-2 の持ち主（docs/ART.md の 5-3 の 8）',
    '2026-10-14',
  ),
  // 2-2・2-3 の人と背景、2-2 の1枚絵、交換所のペトラ（2026-10-17。docs/ART.md の 5-3 の 8・9・11）
  chatgptPortrait(
    'koji',
    'こうじ',
    'smile',
    '笑顔',
    portraitHead('a kind, slightly self-deprecating smile') +
      "Character: Koji, a 40-year-old Japanese bakery owner on a shopping street in a quiet regional town. A gentle, good-natured face, slightly tired eyes, short neat black hair, a white baker's coat and a white baker's cap. Friendly to everyone, but always puts himself down.",
    'あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 2-3 の持ち主（docs/ART.md の 5-3 の 8）',
    '2026-10-17',
  ),
  // 2026-10-25〜26：ChatGPT Plus で作った、3章と2章の残りの人（docs/ART_QUEUE.md の A〜C。白い背景は scripts/cutout.py で抜いた）
  chatgptPortrait("sayoko", "小夜子", "smile", "微笑み", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, graceful smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Sayoko. Keep her design exactly as in the attached character sheet: long straight black hair half-up with a small silver crescent moon hairpin, blunt bangs, large dark eyes with a soft reddish-brown tint, a deep indigo yukata with white bellflowers and a crimson obi.", "sayoko_sheet.png（上で決めた設定画）、akari_smile.webp", "3章の大正の祭りの夜のヒロイン（docs/script/3-matsuri.md）。見た目は設定画（sayoko_sheet。開発者が持っている）で決めた。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("chiyo", "ちよ", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, refined smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Chiyo, a 75-year-old Japanese woman living in a small care home in a quiet regional town. Elegant and polite, a warm but slightly lonely smile. Short soft white hair neatly permed, small gold-rimmed glasses, a pale lavender knitted cardigan over a cream blouse, a thin silver chain. She once worked in a Tokyo electronics factory at fifteen; her hands are small and careful.", "akari_smile.webp", "ちよ（今75歳。ひだまり荘）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("noboru", "のぼる", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, an easygoing, warm grin. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Noboru, a 68-year-old Japanese man from a mountain farming village, Chiyo's younger brother, visiting the town. Sun-tanned, weathered face, short gray crew-cut hair, kind crinkled eyes, a slightly gap-toothed grin. A faded checked work shirt with rolled sleeves under a plain gray vest. Laid-back and unhurried, a simple countryman.", "akari_smile.webp", "のぼる（今68歳。ちよの弟）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_chiyo", "写しのちよ", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a bright, slightly forced cheerful smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: young Chiyo, a 15-year-old Japanese girl in the summer of 1966, coming home to her mountain village for the first time after starting factory work in Tokyo. Keep a face that could grow into a gentle, refined old woman. Black hair in two short braids, a crisp white short-sleeve blouse, a navy skirt. She acts cheerful and grown-up, but her eyes are a little homesick.", "akari_smile.webp", "写しのちよ（昭和41年、15歳）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_kiku", "写しの菊", "normal", "通常", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, quiet expression with her mouth firmly closed. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Kiku, a Japanese farming woman around 40 in the summer of 1966, a widow who works her mountain fields alone. Sun-tanned skin, strong hands, black hair tied back tightly under a faded indigo cotton head scarf (tenugui), a dark indigo work kimono top with tied-back sleeves. Few words and blunt manners, but deep, steady eyes that care.", "akari_smile.webp", "写しの菊（ちよとのぼるの母。昭和41年、40歳くらい）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_noboru", "写しののぼる", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a huge excited grin. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the little girl in the yukata, with the same childlike proportions. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: young Noboru, an 8-year-old Japanese village boy in the summer of 1966, overjoyed that his big sister is coming home. Very short buzz-cut black hair, sun-tanned skin, a scraped nose, a plain white sleeveless undershirt (running shirt) and a straw hat hanging on his back.", "young_akari_smile.webp", "写しののぼる（昭和41年、8歳）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("shiori", "しおり", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a bright, slightly flustered smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Shiori, a 22-year-old Japanese woman in her first year at a small local printing company in a quiet regional town. Short neat dark-brown bob with one side tucked behind her ear, lively eyes, a talkative, quick face. A light beige cardigan over a white collared blouse, a plain staff lanyard (blank card, no letters).", "akari_smile.webp", "しおり（今22歳。印刷会社の一年目）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("toya", "とうや", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, easygoing smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Toya, a 22-year-old Japanese man who works on railway track maintenance. Slightly messy black hair, sleepy relaxed eyes, a gentle, laid-back face. A dark navy work jacket with a reflective stripe over a gray T-shirt, no logos. The kind of person who listens to the end before he speaks.", "akari_smile.webp", "とうや（今22歳。鉄道の保線の仕事）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_shiori", "写しのしおり", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a teasing smile, trying to hide that she is embarrassed. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: young Shiori, a 15-year-old Japanese middle school girl on her graduation day in March 2019, the same person as the 22-year-old office worker. Short dark-brown hair, a navy sailor-style school uniform with a red scarf, a small corsage of paper flowers with a ribbon pinned on her chest (graduation). Sharp-tongued to hide her shyness.", "akari_smile.webp", "写しのしおり（平成31年3月、15歳）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_toya", "写しのとうや", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a soft, easygoing smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: young Toya, a 15-year-old Japanese middle school boy on his graduation day in March 2019. Slightly messy black hair, relaxed eyes. A black gakuran school uniform whose buttons were almost all taken by younger students as keepsakes; only the second button from the top is still there. A corsage of paper flowers on his chest, one white earbud cable hanging from his collar.", "akari_smile.webp", "写しのとうや（平成31年3月、15歳）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_koji", "写しのこうじ", "normal", "通常", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a nervous, unsure face, biting his lip. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the little girl in the yukata, with the same childlike proportions. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: young Koji, the same man as the attached adult portrait but 28 years earlier: a 12-year-old boy on a little league baseball team in the summer of 1998, always on the bench. Keep the same face features so he is clearly the same person. Short black hair, a slightly dirty white baseball uniform with navy trim that is a little too big for him, a baseball cap. No letters or numbers on the uniform or cap.", "young_akari_smile.webp、koji_smile.webp", "写しのこうじ（平成10年、12歳）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_masaru", "写しのまさる", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a big, warm, proud smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Masaru, Koji's father, a Japanese man in his 40s in the summer of 1998, a cheerful working dad watching his son's little league game. A face that resembles the attached portrait (his son as an adult), sun-tanned skin, short black hair, a faded polo shirt with a towel around his neck. No letters or logos.", "akari_smile.webp、koji_smile.webp", "写しのまさる（平成10年、40代。こうじの父）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("masaru", "まさる", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a loud, cheerful grin. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Masaru, the same man as the attached portrait but about 28 years later: a Japanese man around 70, retired, who still comes to the riverside little league field every day with a plastic megaphone. Keep the same face features so he is clearly the same person. Short white hair, deep laugh lines, sun-tanned skin, a faded baseball cap pushed back, a light windbreaker. No letters or logos.", "akari_smile.webp、past_masaru_smile.png（上で作った絵）", "まさる（今70歳くらい。こうじの父）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("sumi", "すみ", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a warm, cheerful smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Sumi, a 77-year-old Japanese woman who runs an old public bathhouse in a quiet regional town. Small and spry, gray hair tied in a low bun with a white hand towel (tenugui) over it, a white kappogi apron-smock over a dark kimono, bright energetic eyes.", "akari_smile.webp", "すみ（今77歳。銭湯「松の湯」の女将）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("past_sumi", "写しのすみ", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a bright, lively smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: young Sumi, the same woman as the attached portrait but 57 years earlier: a 22-year-old daughter of a public bathhouse in the winter of 1969. Keep the same face features so she is clearly the same person. Black hair tied back under a white hand towel, rosy cheeks from the cold, a simple striped kimono with a dark half-coat (hanten).", "akari_smile.webp、sumi_smile.png（上で作った絵）", "写しのすみ（昭和44年、22歳。番台の娘）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("daichi", "だいち", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a friendly, slightly awkward smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Daichi, a 37-year-old Japanese salesman, the former drummer of a high school band. Short neat black hair, a broad friendly face, a dark gray business suit with a loosened tie. Same art style and framing as the attached portrait of his old bandmate.", "akari_smile.webp、kenta_smile.webp", "だいち（今37歳。けんたのバンドのドラム）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait("saki", "さき", "smile", "笑顔", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature. Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a confident, warm smile. Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan. Pose: both arms relaxed down at the sides, hands outside the frame. No props. Background: plain pure white, no shadow, no gradient. Character: Saki, a 37-year-old Japanese woman, the former bassist of a high school band, now a working mother. Shoulder-length wavy dark-brown hair, sharp but kind eyes, a soft gray cardigan over a simple dark top, small earrings. Teasing and straightforward. Same art style and framing as the attached portrait of her old bandmate.", "akari_smile.webp、kenta_smile.webp", "さき（今37歳。けんたのバンドのベース）（docs/ART_QUEUE.md）。ほかの表情は、Gemini で作るまでこの絵で代わりに出す", '2026-10-26', 'Plus（有料）'),
  // 2026-10-26：ChatGPT Plus で作った敵（docs/ART_QUEUE.md の D）
  { ...chatgptArt("enemy.gear_noise", "敵の絵（歯車ノイズ）", "assets/enemies/gear_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a lump of gears and mainsprings grinding against each other without meshing, charging forward", ENEMY_CUT, "2-1 歯車ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a lump of gears and mainsprings grinding against each other without meshing, charging forward", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.screw_noise", "敵の絵（ネジノイズ）", "assets/enemies/screw_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a fast swarm of screws, nuts and bolts", ENEMY_CUT, "2-1 ネジノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a fast swarm of screws, nuts and bolts", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.tube_noise", "敵の絵（真空管ノイズ）", "assets/enemies/tube_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an old vacuum-tube radio collapsing into noise, glowing tubes crackling with electricity", ENEMY_CUT, "2-1 真空管ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an old vacuum-tube radio collapsing into noise, glowing tubes crackling with electricity", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.abacus_noise", "敵の絵（そろばんノイズ）", "assets/enemies/abacus_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a wooden abacus whose beads fly apart and float around it like a shield", ENEMY_CUT, "2-1 そろばんノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a wooden abacus whose beads fly apart and float around it like a shield", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.lathe_boss", "敵の絵（旋盤のぬし）", "assets/enemies/lathe_boss.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a vortex of an old lathe, leather belts and metal shavings, a tool post like a blade, a small glowing brass gear at its center", ENEMY_CUT, "2-1 旋盤のぬし（ボス）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a vortex of an old lathe, leather belts and metal shavings, a tool post like a blade, a small glowing brass gear at its center", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.flip_phone_noise", "敵の絵（ガラケーノイズ）", "assets/enemies/flip_phone_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a flock of old flip phones with antennas, screens flashing and ringing", ENEMY_CUT, "2-2 ガラケーノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a flock of old flip phones with antennas, screens flashing and ringing", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.sticker_noise", "敵の絵（写真シールノイズ）", "assets/enemies/sticker_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a swarm of small photo stickers peeling off and fluttering, decorated with sparkles and hearts (no faces, no letters)", ENEMY_CUT, "2-2 写真シールノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a swarm of small photo stickers peeling off and fluttering, decorated with sparkles and hearts (no faces, no letters)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.boombox_noise", "敵の絵（ラジカセノイズ）", "assets/enemies/boombox_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a boombox with cassette tapes unspooling around it like ribbons, speakers blasting", ENEMY_CUT, "2-2 ラジカセノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a boombox with cassette tapes unspooling around it like ribbons, speakers blasting", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.metronome_noise", "敵の絵（メトロノームノイズ）", "assets/enemies/metronome_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a wooden metronome whose pendulum swings so fast it blurs", ENEMY_CUT, "2-2 メトロノームノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a wooden metronome whose pendulum swings so fast it blurs", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.amp_boss", "敵の絵（アンプのぬし）", "assets/enemies/amp_boss.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a tower of guitar amplifiers and speakers wrapped in tangled cables, one broken guitar string whipping around", ENEMY_CUT, "2-2 アンプのぬし（ボス）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a tower of guitar amplifiers and speakers wrapped in tangled cables, one broken guitar string whipping around", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.ball_noise", "敵の絵（ボールノイズ）", "assets/enemies/ball_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a fast swarm of baseballs with red stitches", ENEMY_CUT, "2-3 ボールノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a fast swarm of baseballs with red stitches", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.pet_noise", "敵の絵（電子ペットノイズ）", "assets/enemies/pet_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a small egg-shaped handheld digital pet toy with a tiny pixel creature on its screen (no logos)", ENEMY_CUT, "2-3 電子ペットノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a small egg-shaped handheld digital pet toy with a tiny pixel creature on its screen (no logos)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.megaphone_noise", "敵の絵（メガホンノイズ）", "assets/enemies/megaphone_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a cluster of plastic cheering megaphones whose cheers have turned into angry roars", ENEMY_CUT, "2-3 メガホンノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a cluster of plastic cheering megaphones whose cheers have turned into angry roars", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.jug_noise", "敵の絵（水筒ノイズ）", "assets/enemies/jug_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a big sports water jug and ice water splashing around it", ENEMY_CUT, "2-3 水筒ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a big sports water jug and ice water splashing around it", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.scoreboard_boss", "敵の絵（スコアボードのぬし）", "assets/enemies/scoreboard_boss.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a giant made of a wooden scoreboard, a backstop net and hundreds of megaphones, its score panels spinning endlessly (blank panels, no numbers)", ENEMY_CUT, "2-3 スコアボードのぬし（ボス）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a giant made of a wooden scoreboard, a backstop net and hundreds of megaphones, its score panels spinning endlessly (blank panels, no numbers)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.fan_noise", "敵の絵（扇風機ノイズ）", "assets/enemies/fan_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an old electric fan from the 1960s with chipped blades, spinning so fast it whips up wind", ENEMY_CUT, "3-1 扇風機ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an old electric fan from the 1960s with chipped blades, spinning so fast it whips up wind", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.coil_noise", "敵の絵（蚊取り線香ノイズ）", "assets/enemies/coil_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a large green mosquito coil smoldering in a pig-shaped ceramic holder, its smoke curling into a spiral body with glowing embers", ENEMY_CUT, "3-1 蚊取り線香ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a large green mosquito coil smoldering in a pig-shaped ceramic holder, its smoke curling into a spiral body with glowing embers", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.radio_noise", "敵の絵（トランジスタラジオノイズ）", "assets/enemies/radio_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a small 1960s transistor radio with a round speaker grille and a tuning dial, its telescopic antenna whipping around, crackling static spilling out", ENEMY_CUT, "3-1 トランジスタラジオノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a small 1960s transistor radio with a round speaker grille and a tuning dial, its telescopic antenna whipping around, crackling static spilling out", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.table_noise", "敵の絵（ちゃぶ台ノイズ）", "assets/enemies/table_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a round low wooden dining table (chabudai) with one broken leg, flipped on its side, teacups and rice bowls flying around it", ENEMY_CUT, "3-1 ちゃぶ台ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a round low wooden dining table (chabudai) with one broken leg, flipped on its side, teacups and rice bowls flying around it", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.postbox_noise", "敵の絵（郵便ポストノイズ）", "assets/enemies/postbox_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a classic red cylindrical Japanese post box, its shape crumbling, envelopes of money sent home spilling out of its slot like a tongue (blank envelopes, no letters)", ENEMY_CUT, "3-1 郵便ポストノイズ（番人）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a classic red cylindrical Japanese post box, its shape crumbling, envelopes of money sent home spilling out of its slot like a tongue (blank envelopes, no letters)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.train_boss", "敵の絵（汽車のぬし）", "assets/enemies/train_boss.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a huge black steam locomotive turning into a shadow of smoke and iron wheels, blocking a country station platform. Two clearly visible parts: a tall smokestack (chimney) at the upper left billowing thick black smoke, and big red-spoked iron driving wheels at the lower right", ENEMY_CUT, "3-1 汽車のぬし（ボス）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a huge black steam locomotive turning into a shadow of smoke and iron wheels, blocking a country station platform. Two clearly visible parts: a tall smokestack (chimney) at the upper left billowing thick black smoke, and big red-spoked iron driving wheels at the lower right", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.lantern_noise", "敵の絵（提灯ノイズ）", "assets/enemies/lantern_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a cluster of torn red paper lanterns, their flames flickering through the holes", ENEMY_CUT, "祭りの夜 提灯ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a cluster of torn red paper lanterns, their flames flickering through the holes", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.pinwheel_noise", "敵の絵（風車ノイズ）", "assets/enemies/pinwheel_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a bunch of colorful paper pinwheels on bamboo sticks, spinning endlessly into a whirlwind", ENEMY_CUT, "祭りの夜 風車ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a bunch of colorful paper pinwheels on bamboo sticks, spinning endlessly into a whirlwind", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.candy_noise", "敵の絵（飴細工ノイズ）", "assets/enemies/candy_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a delicate amber candy sculpture of a crane, half melted and dripping, on a wooden stick", ENEMY_CUT, "祭りの夜 飴細工ノイズ（docs/ART_QUEUE.md）。頼んだのは溶けかけた飴の鶴だったが、りんご飴になった（開発者が採用）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a delicate amber candy sculpture of a crane, half melted and dripping, on a wooden stick", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.phonograph_noise", "敵の絵（蓄音機ノイズ）", "assets/enemies/phonograph_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an old gramophone with a large brass horn, a record spinning and skipping, musical notes made of sand pouring out (no letters)", ENEMY_CUT, "祭りの夜 蓄音機ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an old gramophone with a large brass horn, a record spinning and skipping, musical notes made of sand pouring out (no letters)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.yagura_boss", "敵の絵（やぐらのぬし）", "assets/enemies/yagura_boss.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a giant tangle of a bon-odori festival tower (yagura), a big taiko drum and hundreds of paper lanterns, a hundred years of wear. Two clearly visible parts: a huge taiko drum at the upper center, and a thick rope strung with glowing lanterns across the lower right", ENEMY_CUT, "祭りの夜 やぐらのぬし（ボス）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a giant tangle of a bon-odori festival tower (yagura), a big taiko drum and hundreds of paper lanterns, a hundred years of wear. Two clearly visible parts: a huge taiko drum at the upper center, and a thick rope strung with glowing lanterns across the lower right", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.earphone_noise", "敵の絵（イヤホンノイズ）", "assets/enemies/earphone_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a long tangle of white wired earphone cables coiling like snakes, two earbuds at the ends like heads", ENEMY_CUT, "3-2 イヤホンノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a long tangle of white wired earphone cables coiling like snakes, two earbuds at the ends like heads", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.selfie_noise", "敵の絵（自撮り棒ノイズ）", "assets/enemies/selfie_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an extending selfie stick bending wildly, a smartphone with a cracked screen at its tip (blank screen, no logos)", ENEMY_CUT, "3-2 自撮り棒ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: an extending selfie stick bending wildly, a smartphone with a cracked screen at its tip (blank screen, no logos)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.tapioca_noise", "敵の絵（タピオカノイズ）", "assets/enemies/tapioca_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a big clear plastic cup of tapioca milk tea with a thick straw, wobbly black tapioca pearls bouncing out", ENEMY_CUT, "3-2 タピオカノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a big clear plastic cup of tapioca milk tea with a thick straw, wobbly black tapioca pearls bouncing out", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.diploma_noise", "敵の絵（卒業証書の筒ノイズ）", "assets/enemies/diploma_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a black cylindrical diploma tube with its lid popped off, white paper sheets pouring out like a storm (blank paper, no letters)", ENEMY_CUT, "3-2 卒業証書の筒ノイズ（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: a black cylindrical diploma tube with its lid popped off, white paper sheets pouring out like a storm (blank paper, no letters)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.yosegaki_noise", "敵の絵（寄せ書きの色紙ノイズ）", "assets/enemies/yosegaki_noise.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: dozens of square autograph boards (shikishi) swirling and overlapping, covered in colorful doodles and hearts (no readable letters)", ENEMY_CUT, "3-2 寄せ書きの色紙ノイズ（番人）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. Body: dozens of square autograph boards (shikishi) swirling and overlapping, covered in colorful doodles and hearts (no readable letters)", settings: ENEMY_CUT } },
  { ...chatgptArt("enemy.crossing_boss", "敵の絵（踏切のぬし）", "assets/enemies/crossing_boss.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a giant made of railroad crossing signals, dozens of flashing red warning lights stacked on top of each other, and many black-and-yellow crossing gate arms stretching out and never rising. Two clearly visible parts: the cluster of warning lights with a crossing bell at the upper center, and the long crossing gate arms reaching out to the lower left", ENEMY_CUT, "3-2 踏切のぬし（ボス）（docs/ART_QUEUE.md）", '2026-10-26'), source: { type: 'ai', service: 'ChatGPT', plan: 'Plus（有料）', prompt: "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.  Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly. It is a \"sandstorm\": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen. Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance. A large boss monster, filling most of the image. Body: a giant made of railroad crossing signals, dozens of flashing red warning lights stacked on top of each other, and many black-and-yellow crossing gate arms stretching out and never rising. Two clearly visible parts: the cluster of warning lights with a crossing bell at the upper center, and the long crossing gate arms reaching out to the lower left", settings: ENEMY_CUT } },
  // 2026-10-26：ChatGPT Plus で作った部屋の地図（docs/ART_QUEUE.md の E。絵の道に合わせて文字の地図を書き直した）
  chatgptArt("map.fest_woods", "1-1 社の裏の林の地図", "assets/maps/fest_woods.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: a small grove behind a Japanese shrine on a summer night, a narrow dirt path winding between tall cedar trees, stone lanterns and moss, festival lights glowing faintly through the trees.\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_fest_woods.png、public/assets/maps/festival.webp。768×768（24×24マス）に縮めて WebP にした", "1-1 の「社の裏の林」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_FEST_WOODS_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.fest_backyard", "1-1 屋台の裏の地図", "assets/maps/fest_backyard.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the backyard behind festival stalls at summer dusk in the late Heisei era, warm lantern light: stacked lantern boxes, a small generator, cables on the ground, plastic crates and a water tank, a narrow dead end at the top left.\nAn opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_fest_backyard.png、public/assets/maps/festival.webp。768×768（24×24マス）に縮めて WebP にした", "1-1 の「屋台の裏」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_FEST_BACKYARD_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.fest_east", "1-1 射的と金魚すくいの通りの地図", "assets/maps/fest_east.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: a side street of a shrine festival at summer dusk in the late Heisei era, warm lantern light: a shooting gallery stall at the top, a long winding path, and a goldfish-scooping stall with a wide blue water tank at the bottom right dead end.\nAn opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_fest_east.png、public/assets/maps/festival.webp。768×768（24×24マス）に縮めて WebP にした", "1-1 の「射的と金魚すくいの通り」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_FEST_EAST_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.festival_plaza", "1-1 縁日の広場（やぐらの広場）の地図", "assets/maps/festival_plaza.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: narrow back alleys winding between the rear sides of festival stalls at summer dusk in the late Heisei era, warm lantern light, tarps, folding tables, coolers and stacked paper lanterns.\nAn opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_fest_west.png、public/assets/maps/festival.webp。768×1152（24×36マス）に縮めて WebP にした", "1-1 の「屋台の裏通り」として頼んだが、やぐらのある広場の絵が届いた（docs/ART_QUEUE.md の E）。2026-10-29 段階120：開発者が縁日の広場に使うと決め、festival_plaza に名前を替えた。歩ける場所の文字の地図は rooms.ts の FESTIVAL_NIGHT_LAYOUT", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.fest_gate", "1-1 参道の入口の地図", "assets/maps/fest_gate.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the entrance approach of a small Japanese shrine festival at summer dusk in the late Heisei era, warm lantern light, a red torii gate at the bottom, festival stalls with striped awnings and paper lanterns along both sides of the stone-paved approach.\nAn opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_fest_gate.png、public/assets/maps/festival.webp。768×768（24×24マス）に縮めて WebP にした", "1-1 の「参道の入口」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_FEST_GATE_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.showa_alley", "1-2 左の路地裏の地図", "assets/maps/showa_alley.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: narrow back alleys behind the shops of a small Japanese shopping street at summer dusk in 1988, warm sepia-tinted retro colors: wooden fences, stacked beer crates and empty ramune bottles, old bicycles, laundry poles, a stray cat on a wall.\nAn opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_showa_alley.png、public/assets/maps/showa_street.webp。768×768（24×24マス）に縮めて WebP にした", "1-2 の「左の路地裏」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SHOWA_ALLEY_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.showa_lane", "1-2 右の電器屋の裏通りの地図", "assets/maps/showa_lane.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: a winding back lane behind an old electronics shop at summer dusk in 1988, warm sepia-tinted retro colors: discarded CRT televisions and radios stacked by the back door, tangled antenna cables, a small storage shed, potted plants, and a dead end with a little vacant lot at the bottom right.\nAn opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_showa_lane.png、public/assets/maps/showa_street.webp。768×768（24×24マス）に縮めて WebP にした", "1-2 の「右の電器屋の裏通り」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SHOWA_LANE_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.showa_hill", "1-2 坂の上の先の地図", "assets/maps/showa_hill.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the top of a gentle slope above a small Japanese town at summer sunset in 1988, warm sepia-tinted retro colors: a narrow paved road winding between old houses with tiled roofs and stone walls, utility poles with wires, a small bus stop bench and a vending machine, the evening sun glowing over the rooftops.\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_showa_hill.png、public/assets/maps/showa_street.webp。768×768（24×24マス）に縮めて WebP にした", "1-2 の「坂の上の先」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SHOWA_HILL_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.school_courtyard", "2-2 模擬店の中庭の地図", "assets/maps/school_courtyard.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the school courtyard of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.\nRows of student food stalls with colorful tents and folding tables along both sides (four small tent blocks as in the sketch), paper lanterns and garlands strung overhead. In the middle, a big tree with a round bench around it, and a wooden bench just below-left of the tree. Paths lead out through the bottom edge (to the gate), the top edge (to the school building) and the left edge (to the bicycle parking).\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_school_courtyard.png、map_school_gate.png（上で作った絵）。768×1152（24×36マス）に縮めて WebP にした", "2-2 の「模擬店の中庭」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SCHOOL_COURTYARD_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.school_bikes", "2-2 駐輪場の地図", "assets/maps/school_bikes.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the bicycle parking area behind a Japanese high school building on a bright autumn afternoon in 2006, bright pastel and light blue colors.\nFour long rows of student bicycles in metal racks under a thin roof, with small gaps between them so you can weave through, as in the sketch. A wide path comes in from the right edge through the middle. Fallen ginkgo leaves, a vending machine against the wall, a dead-end corner at the top left.\nAn opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_school_bikes.png、map_school_gate.png。768×768（24×24マス）に縮めて WebP にした", "2-2 の「駐輪場」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SCHOOL_BIKES_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.school_classroom", "2-2 お化け屋敷の教室の地図", "assets/maps/school_classroom.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: a classroom turned into a haunted house attraction for a Japanese high school festival in 2006, seen from above with the ceiling removed, dim purple and light blue lighting with pastel accents.\nDesks stacked and covered with black curtains form a winding maze (three long curtain walls as in the sketch), with paper ghosts, fake spider webs and a few glowing paper lanterns. The entrance comes in from the left edge. A dead-end corner at the top right.\nAn opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_school_classroom.png、map_school_gate.png。768×768（24×24マス）に縮めて WebP にした", "2-2 の「お化け屋敷の教室」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SCHOOL_CLASSROOM_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.school_corridor", "2-2 渡り廊下と音楽室の前の地図", "assets/maps/school_corridor.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: an open-air roofed walkway between school buildings of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.\nA wide walkway crosses the lower half from the bottom edge and turns right toward the right edge. On the upper left, a corridor runs in front of the music room with its windows and sliding door (a few music stands and instrument cases by the door). A straight path leads up through the top edge to the gymnasium. Posters on the walls are blank.\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_school_corridor.png、map_school_gate.png。768×768（24×24マス）に縮めて WebP にした", "2-2 の「渡り廊下と音楽室の前」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SCHOOL_CORRIDOR_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.school_gym", "2-2 体育館の地図", "assets/maps/school_gym.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the inside of a Japanese high school gymnasium during its school festival in 2006, seen from above with the roof removed, bright pastel and light blue colors with warm stage lights.\nAt the top, a raised wooden stage with curtains pulled aside, a drum set, guitar amplifiers and speakers on it, cables on the floor. Below, a wide polished wooden floor with court lines and rows of folding chairs pushed to the sides, as in the sketch. The entrance comes in from the bottom edge.\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_school_gym.png、map_school_gate.png。768×768（24×24マス）に縮めて WebP にした", "2-2 の「体育館」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_SCHOOL_GYM_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.riverside_levee", "2-3 土手の道の地図", "assets/maps/riverside_levee.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the bottom of a grassy river embankment next to a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.\nA wide dirt path runs along the foot of the embankment from the lower left to the right, then a gentle slope path climbs up along the right side and turns left to leave through the top edge. Tall summer grass and a few parked bicycles on the embankment, a small grassy hollow on the left with a wooden bench.\nAn opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_riverside_levee.png、public/assets/maps/festival.webp。768×768（24×24マス）に縮めて WebP にした", "2-3 の「土手の道」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_RIVERSIDE_LEVEE_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.riverside_bank", "2-3 川べりの地図", "assets/maps/riverside_bank.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: a quiet riverbank next to a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.\nThe river runs along the whole right side (not walkable, sparkling water). A sandy and grassy bank with three clumps of tall reeds and summer grass (as in the sketch), a few stray baseballs in the grass, an old bucket. The entrance comes in from the left edge.\nAn opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_riverside_bank.png、map_riverside_levee.png。768×768（24×24マス）に縮めて WebP にした", "2-3 の「川べり」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_RIVERSIDE_BANK_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.riverside_bench", "2-3 ベンチの裏の木陰の地図", "assets/maps/riverside_bench.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the area behind the team bench of a riverside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.\nIn the lower part, a long wooden team bench with a small roof (as in the sketch). In the middle, a big shady tree with dappled shadows and a cooler box under it. Paths lead out through the bottom edge (to the embankment), the top edge (to the concession tent) and the right edge (to the riverbank). Cicada-filled summer mood.\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_riverside_bench.png、map_riverside_levee.png（上で作った絵）。768×1152（24×36マス）に縮めて WebP にした", "2-3 の「ベンチの裏の木陰」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_RIVERSIDE_BENCH_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.riverside_diamond", "2-3 ダイヤモンドの地図", "assets/maps/riverside_diamond.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the infield of a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors, seen from above.\nAt the top, home plate in front of a tall backstop net, with the ends of the net at the upper corners (as in the sketch). Below, the dirt infield with bases and white chalk lines, the pitcher's mound. A wooden scoreboard (blank panels, no numbers) is visible beyond the backstop. The entrance comes in from the bottom edge.\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_riverside_diamond.png、map_riverside_levee.png。768×768（24×24マス）に縮めて WebP にした", "2-3 の「ダイヤモンド」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_RIVERSIDE_DIAMOND_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.riverside_shed", "2-3 用具小屋の裏の地図", "assets/maps/riverside_shed.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: the back of a small wooden equipment shed beside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.\nNarrow passages divided by a long practice net and stacks of bat boxes and base bags (two long dividers as in the sketch), a roller for the field, buckets of balls. The entrance comes in from the right edge. A dead-end corner at the top left.\nAn opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_riverside_shed.png、map_riverside_levee.png。768×768（24×24マス）に縮めて WebP にした", "2-3 の「用具小屋の裏」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_RIVERSIDE_SHED_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptArt("map.riverside_stand", "2-3 売店のテントの地図", "assets/maps/riverside_stand.webp", "Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.\n\nTop-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.\nScene: a small white concession tent beside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.\nThe tent with folding tables, a tub of ice water with floating ramune bottles (blank labels), shade umbrellas. An open dirt area in front of the tent. Paths lead out through the bottom edge, the top edge (toward the diamond) and the left edge (toward the equipment shed).\nAn opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.\nFollow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.", "見本の絵：docs/sketches/room_layouts/room_riverside_stand.png、map_riverside_levee.png。768×768（24×24マス）に縮めて WebP にした", "2-3 の「売店のテント」の地図（docs/ART_QUEUE.md の E）。絵の道に合わせて、歩ける場所の文字の地図（rooms.ts の ART_RIVERSIDE_STAND_LAYOUT）を書き直した（2026-10-26）", '2026-10-26', 'Plus（有料）'),
  chatgptPortrait(
    'petra',
    'ペトラ',
    'normal',
    '通常',
    portraitHead('a calm, businesslike expression with a faint polite smile') +
      'Character: Petra, a woman in her late twenties who works at the trading counter of the Time Archive Bureau, an office of the far future. Neat dark navy-black hair tied in a single low ponytail, thin silver-rimmed glasses, calm intelligent eyes. A crisp white shirt with a dark navy vest, black sleeve covers on her forearms, and a small hourglass-shaped bureau badge on her chest. Tidy and rule-abiding, a quiet clerk who is secretly pleased when the numbers in her ledger add up. No text or letters on the badge.',
    'あかりの笑顔の立ち絵（構図の見本）',
    '拠点の交換所の番人（段階52。docs/ART.md の 5-3 の 8 の後ろ）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.riverside_1998',
    '背景（平成10年の夏の河川敷のグラウンド）',
    'assets/backgrounds/riverside_1998.webp',
    BG_HEAD +
      'A riverside little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer sky and light blue tones. A dirt diamond, a tall backstop net, a simple wooden scoreboard with blank panels, a grassy embankment where families sit, a small white concession tent, the river and an iron bridge in the distance, cumulonimbus clouds. ' +
      'Eye-level camera from behind home plate, looking toward the outfield. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M2 の 2-3 の会話（docs/ART.md の 5-3 の 9）。今の河川敷（riverside_ground）は同じ絵を色の加工で使い回す',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.bakery',
    '背景（商店街のパン屋の店内）',
    'assets/backgrounds/bakery.webp',
    BG_HEAD +
      'Inside a small, warm family bakery on a shopping street in a quiet Japanese regional town, late afternoon. Wooden shelves and baskets of freshly baked bread, a glass display case, a small counter with an old cash register, an oven glowing in the back kitchen visible through a doorway, warm orange light through the front window. ' +
      'Eye-level camera, looking from the entrance toward the counter. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M2 のこうじの店（7-A・8-B、docs/ART.md の 5-3 の 9）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.music_shop',
    '背景（商店街の楽器店の店内）',
    'assets/backgrounds/music_shop.webp',
    BG_HEAD +
      'Inside a small, slightly cluttered musical instrument shop on a shopping street in a quiet Japanese regional town, at dusk. Electric and acoustic guitars hanging on the wall, a few amplifiers, a drum kit in the corner, racks of sheet music books with blank covers, a worn counter with guitar strings and picks. Warm light, a little dusty and nostalgic. ' +
      'Eye-level camera, the guitar wall in the center. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。アンプに実在のメーカーの文字が描かれていたので、その所をぼかした。720×1280 に縮めて WebP にした',
    'M2 のけんたの店（6-A・7-A。夜は色の加工。docs/ART.md の 5-3 の 9）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.school_gym',
    '背景（平成18年の文化祭の体育館のステージ）',
    'assets/backgrounds/school_gym.webp',
    BG_HEAD +
      'A Japanese high school gymnasium decorated for the school festival on a bright autumn afternoon in 2006, bright pastel and light blue tones. A stage with curtains pulled open, amplifiers, a drum kit and microphone stands set up for a band, paper flower decorations and blank banners, rows of folding chairs on the gym floor, sunlight through the high windows. ' +
      'Eye-level camera from the middle of the gym, the stage in the center. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M2 の 2-2 の会話（docs/ART.md の 5-3 の 9）',
    '2026-10-17',
  ),
  chatgptArt(
    'cg.string_stage',
    '1枚絵（弦が切れても歌うステージ）',
    'assets/cg/string_stage.webp',
    CG_HEAD +
      'A packed Japanese high school gymnasium during the school festival in autumn 2006. On the stage, a 17-year-old boy in an open black gakuran (keep his design as in the attached portrait) keeps singing into the microphone with his eyes closed, holding his electric guitar with one broken string curling loose. Behind him a girl on bass and a boy on drums smile and keep the rhythm. The audience claps along with raised hands, colorful stage lights and dust sparkling in the beams. ' +
      CG_TAIL,
    '見本の絵：写しのけんたの立ち絵（portrait.past_kenta.smile。絵を作った時はまだ台帳になかった）。元の絵は 941×1672。ギターの頭の飾り文字を軽くぼかした。720×1280 に縮めて WebP にした',
    'M2 の 2-2-7（2-2 の山場。docs/ART.md の 5-3 の 11）',
    '2026-10-17',
  ),
  // 写しのけんた、1章の背景7つ、2-1 の地図の手直しと寄り道の部屋2つ（2026-10-17。docs/ART.md の 5-3 の 8、5-5 の「M1 の残りの指示文」、6-2）
  chatgptPortrait(
    'past_kenta',
    '写しのけんた',
    'smile',
    '笑顔',
    portraitHead('a bright, cocky grin full of energy') +
      'Character: young Kenta, the same man as the attached adult portrait but 20 years earlier: a 17-year-old Japanese high school boy at his school festival in autumn 2006, the singer and guitarist of a three-piece band. Keep the same face features so he is clearly the same person. Spiky dark-brown hair, a black gakuran school uniform worn open over a white T-shirt.',
    'けんた（今）の立ち絵（同じ人に見せるため）と、あかりの笑顔の立ち絵（構図の見本）',
    'M2 の 2-2 の写し（平成18年の秋、17歳。docs/ART.md の 5-3 の 8）。ノイズとセピアの加工はゲームの側でかける',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.goldfish_stall',
    '背景（金魚すくいの屋台）',
    'assets/backgrounds/goldfish_stall.webp',
    BG_HEAD +
      'Close-up of a goldfish-scooping stall at a small Japanese shrine festival at summer dusk. A wide shallow blue water tank full of small red and black goldfish, paper scoops (poi) and small bowls on the edge, a striped cloth awning above, paper lanterns glowing warm orange, the indigo dusk sky behind. ' +
      'Eye-level camera, slightly looking down at the water tank in the center. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M1 の P-3（docs/ART.md の 5-6 の 4）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.shooting_stall',
    '背景（射的の屋台）',
    'assets/backgrounds/shooting_stall.webp',
    BG_HEAD +
      'A shooting gallery stall (shateki) at a small Japanese shrine festival at summer dusk. Tiered red shelves lined with small prizes (a toy robot, a plush bear, a box of caramel, small dolls), cork-gun rifles resting on the front counter, a striped cloth awning, paper lanterns glowing warm orange, the indigo dusk sky behind. ' +
      'Eye-level camera from in front of the counter, the prize shelves in the center. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M1 の P-3（docs/ART.md の 5-6 の 5）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.shrine_steps',
    '背景（神社の石段の上）',
    'assets/backgrounds/shrine_steps.webp',
    BG_HEAD +
      'The top of a long stone stairway of a small Japanese shrine in a regional town, at the end of a summer festival evening, the sky fading from amber to deep indigo with the first stars. Worn stone steps leading down toward the festival lights far below, a small red torii and stone lanterns at the top, quiet summer trees around. ' +
      'Eye-level camera from the top step, looking out over the town and the festival lights. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M1 の P-4（docs/ART.md の 5-6 の 6）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.shrine_hill',
    '背景（神社の裏の高台・夜）',
    'assets/backgrounds/shrine_hill.webp',
    BG_HEAD +
      'A small grassy hill behind a Japanese shrine on a summer night, an old wooden fence at the edge, a view over the dark rooftops of a quiet regional town under a deep indigo starry sky, the open sky above left empty for fireworks. ' +
      'Eye-level camera, looking out from the hilltop toward the sky. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 940×1672。720×1280 に縮めて WebP にした',
    'M1 の P-5（docs/ART.md の 5-6 の 7）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.home_kitchen',
    '背景（施設の台所）',
    'assets/backgrounds/home_kitchen.webp',
    BG_HEAD +
      'The homely kitchen and dining room of a small children\'s home in a Japanese regional town, in the morning. A long wooden dining table with many mismatched chairs, an old fridge with children\'s drawings (no letters), a stove with a frying pan. On the windowsill, an old glass fish tank with one big orange goldfish. On a shelf, a few faded festival prizes: a small toy robot, a plush bear, a caramel box. Soft morning light through the window. ' +
      'Eye-level camera, the window with the fish tank slightly off center. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M1 の 1-A・1-D、日常の「施設」（docs/ART.md の 5-6 の 1）。夕方（home_kitchen_evening）は同じ絵に色をかけて使い回す',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.rooftop',
    '背景（学校の屋上）',
    'assets/backgrounds/rooftop.webp',
    BG_HEAD +
      'The rooftop of a Japanese high school in a quiet regional town, in the late afternoon before sunset. A tall green chain-link fence along the edge, a concrete floor, a water tank and the stairwell door, the town and distant mountains below, a wide sky with soft orange clouds. ' +
      'Eye-level camera, looking toward the fence and the town. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M1 の 1-D と3日目（docs/ART.md の 5-6 の 3）',
    '2026-10-17',
  ),
  chatgptArt(
    'bg.convenience_store',
    '背景（コンビニの店内）',
    'assets/backgrounds/convenience_store.webp',
    BG_HEAD +
      'Inside a small generic convenience store in a Japanese regional town, after school. Bright fluorescent light, shelves of snacks and drinks with blank packages, a drink refrigerator along the back wall, an ice cream freezer chest, a checkout counter with a register at one side, orange evening light through the glass front. No brand logos. ' +
      'Eye-level camera from the entrance, the counter on one side. ' +
      BG_TAIL,
    '見本の絵なし。元の絵は 941×1672。720×1280 に縮めて WebP にした',
    'M1 の 1-C、4日目の小話、日常の「コンビニ」（docs/ART.md の 5-6 の 2）',
    '2026-10-17',
  ),
  chatgptArt(
    'map.factory_yard',
    '2-1 の寄り道1「雪の資材置き場」の見下ろしの地図（正方形）',
    'assets/maps/factory_yard.webp',
    STYLE_PREFIX +
      'Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024x1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. ' +
      'Scene: a snowy materials yard behind a small machine workshop in a Japanese town at winter dusk in 1969, sepia-tinted retro colors with white snow, the same art style as the attached map. ' +
      'An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by wooden fences, sheds and snowy trees. ' +
      'Inside: stacks of steel bars and pipes under snow, oil drums, a small shed, piles of wood crates, footprints in the snow. A small dead-end corner at the top left. ' +
      'Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the opening. ' +
      'Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs are blank.',
    '見本の絵：今の 2-1 の地図（絵柄の見本）と、下絵 docs/sketches/room_factory_yard.png。元の絵は 1254×1254。1024×1024（24×24マス）に縮めて WebP にした。絵は下絵どおりではないので、歩ける場所の文字の地図は絵に合わせて書いた（rooms.ts の FACTORY_YARD_LAYOUT）',
    'M2 の 2-1 の寄り道の部屋（docs/ART.md の 6-2）。2-1 の路地の左の辺につながる。逃げる砂嵐と宝箱',
    '2026-10-17',
  ),
  chatgptArt(
    'map.bath_alley',
    '2-1 の寄り道2「銭湯の裏の路地」の見下ろしの地図（正方形）',
    'assets/maps/bath_alley.webp',
    STYLE_PREFIX +
      'Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024x1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. ' +
      'Scene: a narrow winding back alley behind a public bathhouse in a Japanese town at winter dusk in 1969, sepia-tinted retro colors with white snow, the same art style as the attached map. ' +
      'An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by wooden walls, the bathhouse back wall and snowy trees. ' +
      'Inside: a narrow path winding up, right and down between wooden walls, the bathhouse boiler with a tall chimney and rising steam, stacked firewood, buckets, a dead end at the bottom right. ' +
      'Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the opening. ' +
      'Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs are blank.',
    '見本の絵：今の 2-1 の地図（絵柄の見本）と、下絵 docs/sketches/room_bath_alley.png。元の絵は 1254×1254。1024×1024（24×24マス）に縮めて WebP にした。絵は下絵どおりではないので、歩ける場所の文字の地図は絵に合わせて書いた（rooms.ts の BATH_ALLEY_LAYOUT）',
    'M2 の 2-1 の寄り道の部屋（docs/ART.md の 6-2）。2-1 の路地の右の辺につながる。追ってくる砂嵐と宝箱',
    '2026-10-17',
  ),
  // 1-1 の人たちと敵（2026-10-19。docs/ART.md の 6-7 の作る順番の 1〜3。ゆうまは、最初の絵がハルトに似たので髪と目元を替えて作り直した）
  chatgptPortrait(
    'yuma',
    'ゆうま',
    'smile',
    '笑顔',
    portraitHead('a relaxed, easygoing half-smile with sleepy droopy eyes, but kind') +
      'Character: Yuma, a 21-year-old Japanese university student working part-time at a convenience store on a shopping street in a quiet regional town. Laid-back and easygoing, but kind and friendly. Hair dyed a light ash-brown, grown a little long, loosely tied back in a small low ponytail at the nape, with a few loose strands framing his face and the forehead mostly visible (no heavy bangs over the eyes). Gentle droopy eyes (tareme) with light brown irises, a small beauty mark under his left eye, a small silver stud earring in his left ear, clean-shaven, a slightly lanky build. A generic convenience store uniform: a vertically striped short-sleeve shirt and a plain apron with no logo, a name tag with no readable text. He must look clearly different from the attached black-haired boy with messy bangs.',
    'あかりの笑顔の立ち絵（構図の見本）と、ハルトの立ち絵（似せないため）',
    '1-1 の持ち主（docs/ART.md の 6-7 の 2）。口を開けた笑顔で出てきたので、笑顔の絵にした（ほかの表情は、絵が届くまで笑顔で代わりに出す）',
    '2026-10-19',
  ),
  chatgptPortrait(
    'past_yuma',
    '写しのゆうま',
    'smile',
    '笑顔',
    portraitHead('a bright, big-brotherly grin', 'the little girl in the yukata, with the same childlike proportions') +
      'Character: young Yuma, the same person as the attached adult portrait but about 11 years earlier: a 10-year-old boy (4th grade) at a summer shrine festival. Keep the same gentle droopy eyes and the small beauty mark under his left eye so he is clearly the same person, with childlike proportions. Natural black short hair (he dyes it only later), a plain navy summer yukata.',
    'ゆうまの立ち絵と、子どものあかりの笑顔の立ち絵（構図の見本）',
    '1-1 の写し（docs/ART.md の 6-7 の 3）',
    '2026-10-19',
  ),
  chatgptPortrait(
    'past_hinano',
    '写しのひなの',
    'smile',
    '笑顔',
    portraitHead('a big happy smile', 'the little girl in the yukata, with the same childlike proportions') +
      "Character: young Hinano, the 7-year-old little sister of the attached boy, at a summer shrine festival. Eyes that resemble her brother's, round cheeks, childlike proportions. Short black hair in two small pigtails. A pale pink summer yukata with a morning glory pattern and a yellow obi sash (no goldfish pattern).",
    '写しのゆうまの立ち絵と、子どものあかりの笑顔の立ち絵（構図の見本）',
    '1-1 の写し（docs/ART.md の 6-7 の 3）',
    '2026-10-19',
  ),
  chatgptArt(
    'enemy.goldfish_noise',
    '敵の絵（金魚ノイズ）',
    'assets/enemies/goldfish_noise.webp',
    enemyHead(HEISEI_COLORS, true) + 'Body: a big red goldfish swimming in the air, trailing torn festival water bags and splashes, its fins fraying into static',
    ENEMY_CUT,
    '1-1 の砂嵐（docs/ART.md の 6-7 の 1）',
    '2026-10-19',
  ),
  chatgptArt(
    'enemy.balloon_noise',
    '敵の絵（水風船ノイズ）',
    'assets/enemies/balloon_noise.webp',
    enemyHead(HEISEI_COLORS, true) +
      'Body: a bunch of bouncing festival water balloons (yo-yo balloons) on rubber strings, wobbling and splashing, each balloon round with simple colorful stripes',
    ENEMY_CUT,
    '1-1 の砂嵐（docs/ART.md の 6-7 の 1）',
    '2026-10-19',
  ),
  chatgptArt(
    'enemy.mask_noise',
    '敵の絵（お面ノイズ）',
    'assets/enemies/mask_noise.webp',
    enemyHead(HEISEI_COLORS, true) +
      'Body: a cluster of three festival character masks (a plain white fox mask, a red oni mask and a round-face mask, no famous characters) stacked like a totem, glaring',
    ENEMY_CUT,
    '1-1 の砂嵐（docs/ART.md の 6-7 の 1）',
    '2026-10-19',
  ),
  chatgptArt(
    'enemy.cotton_noise',
    '敵の絵（わたあめノイズ）',
    'assets/enemies/cotton_noise.webp',
    enemyHead(HEISEI_COLORS, true) + 'Body: a fluffy cloud of pink cotton candy on a wooden stick, sticky strands reaching out like arms',
    ENEMY_CUT,
    '1-1 の砂嵐（docs/ART.md の 6-7 の 1）',
    '2026-10-19',
  ),
  chatgptArt(
    'enemy.goldfish_bowl_boss',
    '敵の絵（金魚鉢のぬし）',
    'assets/enemies/goldfish_bowl_boss.webp',
    enemyHead(HEISEI_COLORS, true) +
      'A large boss monster, filling most of the image. ' +
      'Body: a giant round glass goldfish bowl with swirling water inside and many goldfish circling, two arms made of paper goldfish scoops (poi), water overflowing as waves',
    ENEMY_CUT,
    '1-1 のボス（docs/ART.md の 6-7 の 1）',
    '2026-10-19',
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
  // M2 で足した表情（2026-10-11。docs/ART.md の 5-3 の 14）
  ...(
    [
      ['thinking', '考える', 'thoughtful, eyes looking up and aside, mouth slightly pursed'],
      ['teary', '泣き笑い', 'smiling through tears, eyes wet and slightly narrowed, a trembling smile'],
    ] as const
  ).map(([face, title, expression]) => ({
    ...akariPortrait(face, title, expression, 'Gemini で作ったデジャヴの立ち絵（リボンが赤い物）。843×1264 で出てきた', AKARI_ADDED_HEAD),
    acquiredAt: '2026-10-11',
  })),
  geminiFace(
    'noa',
    'ノア',
    'sad',
    '悲しい',
    'silver short bob with a blue-green tint, blue-green eyes, white high-collared coat with blue-green lines, hourglass collar clasp',
    'sad and quiet, eyes looking down, mouth closed, brows slightly lowered',
    '通常',
    'M2 で使う（docs/script/M2.md の 12.）',
  ),
  ...(
    [
      ['smile', '笑顔', 'a bright, warm smile with the mouth slightly open'],
      ['lonely', 'さみしげ', 'quietly lonely, a faint sad smile, eyes looking down'],
      ['thinking', '考える', 'thoughtful, eyes looking up and aside, mouth slightly pursed'],
      ['surprised', '驚き', 'surprised, eyes wide open, mouth slightly open'],
      ['teary', '泣き笑い', 'smiling through tears, eyes wet and slightly narrowed, a trembling smile'],
    ] as const
  ).map(([face, title, expression]) =>
    geminiFace('fumi', 'ふみ', face, title, 'thin white hair in a low bun, deep wrinkles, beige knitted cardigan', expression, '通常', 'M2 の 1-2 の持ち主（docs/script/M2.md の 5.）'),
  ),
  ...(
    [
      ['surprised', '驚き', 'surprised, eyes wide open, mouth slightly open'],
      ['shy', '照れ', 'embarrassed, light blush on the cheeks, eyes looking aside, a small awkward smile'],
      ['teary', '泣き笑い', 'smiling through tears, eyes wet and slightly narrowed, a trembling smile'],
    ] as const
  ).map(([face, title, expression]) =>
    geminiFace(
      'past_fumi',
      '写しのふみ',
      face,
      title,
      'short permed black hair, modest 1980s blouse with a small round collar and a light summer cardigan',
      expression,
      '笑顔',
      'M2 の 1-2 の写し（昭和63年の夏）。ノイズとセピアの加工はゲームの側でかける',
    ),
  ),
  geminiFace(
    'past_kiyoshi',
    '写しのきよし',
    'shy',
    '照れ',
    'short cropped black hair, sun-tanned face, stern brows, faded navy work jacket over a white undershirt',
    'gruffly hiding his embarrassment: face turned slightly away and eyes looking off to the side, mouth pressed into a stubborn straight line, brows slightly drawn together as if annoyed, no smile and no teeth showing. Only a faint blush on the cheeks and reddened ear tips give away that he is embarrassed. A quiet, awkward middle-aged man who is bad at showing his feelings.',
    '通常',
    'M2 の 1-2 の写し（昭和63年の夏）。ノイズとセピアの加工はゲームの側でかける。2026-10-19 に作り直した（最初の照れは歯を見せて大きく赤くなり、口数の少ない頑固な人に合わなかった）',
  ),
  // 1-1 の人たちの表情違い（2026-10-19。docs/ART.md の 6-7 の Gemini の 1〜3）
  ...(
    [
      ['normal', '通常', 'relaxed and a little sleepy, droopy half-lidded eyes, mouth closed in a faint lazy smile'],
      ['thinking', '考える', 'thoughtful, eyes looking up and aside, mouth slightly pursed'],
      ['wry', '苦笑い', 'a wry, strained smile, one corner of the mouth raised, eyebrows slightly troubled'],
      ['surprised', '驚き', 'surprised, eyes wide open, mouth slightly open'],
      ['teary', '泣き笑い', 'smiling through tears, eyes wet and slightly narrowed, a trembling smile'],
      ['lonely', 'さみしげ', 'quietly lonely, a faint sad smile, eyes looking down'],
      ['serious', '真剣', 'serious and focused, mouth firmly closed, brows set, eyes steady and determined'],
    ] as const
  ).map(
    ([face, title, expression]): AssetEntry => ({
      ...geminiFace(
        'yuma',
        'ゆうま',
        face,
        title,
        'light ash-brown hair tied back in a small low ponytail, droopy eyes, a small beauty mark under his left eye, a small silver stud earring, vertically striped convenience store shirt and a navy apron with a blank name tag',
        expression,
        '笑顔',
        '1-1 の持ち主',
      ),
      acquiredAt: '2026-10-19',
    }),
  ),
  ...(
    [
      ['normal', '通常', 'relaxed and natural, mouth closed'],
      ['shy', '照れ', 'embarrassed, light blush on the cheeks, eyes looking aside, a small awkward smile'],
      ['pout', 'ふくれ', 'sulking, cheeks puffed, frowning a little, eyes looking aside'],
      ['surprised', '驚き', 'surprised, eyes wide open, mouth slightly open'],
      ['angry', '怒り', 'an irritated little boy snapping at someone, brows sharply drawn together, mouth open as if shouting, cheeks slightly flushed'],
    ] as const
  ).map(
    ([face, title, expression]): AssetEntry => ({
      ...geminiFace(
        'past_yuma',
        '写しのゆうま',
        face,
        title,
        'short black hair, droopy eyes, a small beauty mark under his left eye, navy striped summer yukata, childlike proportions',
        expression,
        '笑顔',
        '1-1 の写し。ノイズとセピアの加工はゲームの側でかける',
      ),
      acquiredAt: '2026-10-19',
    }),
  ),
  {
    ...geminiFace(
      'past_hinano',
      '写しのひなの',
      'cry',
      '泣き',
      'short dark hair in two small pigtails with pink flower hair ties, pale pink yukata with a morning glory pattern and a yellow obi, childlike proportions',
      'crying like a hurt little child, tears running down her cheeks, eyes squeezed half shut, mouth open and trembling, brows drawn up in sadness',
      '笑顔',
      '1-1 の写し。ノイズとセピアの加工はゲームの側でかける',
    ),
    acquiredAt: '2026-10-19',
  },
  // りくの口パクの元の絵（2026-10-11。docs/ART.md の 5-4）。表情ごとに、口だけ開けた絵。会話には出さず、口のまわりだけ切り抜く
  ...(['normal', 'proud', 'serious', 'sad', 'smirk', 'flustered'] as const).map(
    (f): AssetEntry => ({
      ...rikuFace(f, RIKU_FACE_TITLES[f], ''),
      id: `portrait.riku.talk_${f}_src`,
      title: `りくの立ち絵（${RIKU_FACE_TITLES[f]}で口を開けた絵。口パクの元）`,
      file: `assets/portraits/riku_talk_${f}_src.webp`,
      source: {
        type: 'ai',
        service: 'Google Gemini（Gemini アプリ）',
        plan: '無料',
        prompt: TALK_SRC_PROMPT,
        settings: `見本の絵：りくの${RIKU_FACE_TITLES[f]}の立ち絵。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた`,
      },
      acquiredAt: '2026-10-11',
      notes: '会話には出さない（起動の時も読み込まない）。口のまわりだけを切り抜いて、口パクの差分にする（scripts/portrait_parts.py）。ChatGPT の規約の控えは docs/licenses/ai-openai.md',
    }),
  ),
  // まばたきの差分の元の絵（段階46b。docs/ART.md の 5-4）。会話には出さず、scripts/portrait_parts.py で目だけ切り抜く
  ...(
    [
      ['hero', 'ハルト', heroPortrait('normal', '通常')],
      ['riku', 'りく', rikuFace('normal', '通常', '')],
    ] as const
  ).map(([who, name, base]): AssetEntry => ({
    ...base,
    id: `portrait.${who}.blink_src`,
    title: `${name}の立ち絵（目を閉じた絵。まばたきの元）`,
    file: `assets/portraits/${who}_blink_src.webp`,
    source: {
      type: 'ai',
      service: 'Google Gemini（Gemini アプリ）',
      plan: '無料',
      prompt: BLINK_SRC_PROMPT,
      settings: `見本の絵：${name}の通常の立ち絵。白い背景は scripts/cutout.py（rembg の isnet-anime）で抜いた`,
    },
    acquiredAt: '2026-10-11',
    notes: '会話には出さない（起動の時も読み込まない）。目のまわりだけを切り抜いて、まばたきの差分にする（scripts/portrait_parts.py）。ChatGPT の規約の控えは docs/licenses/ai-openai.md',
  })),
  // 1章の人たちと、けんた・カイのまばたき・口パクの元の絵（2026-10-19。docs/ART.md の 5-4）。Gemini で、その人の基本の絵から目だけ閉じた絵・口だけ開けた絵
  ...(
    [
      ['yuma', 'ゆうま'],
      ['fumi', 'ふみ'],
      ['young_riku', '子どものりく'],
      ['past_yuma', '写しのゆうま'],
      ['past_kiyoshi', '写しのきよし'],
      ['young_akari', '子どものあかり'],
      ['young_hero', '子どものハルト'],
      ['past_fumi', '写しのふみ'],
      ['past_hinano', '写しのひなの', 'blink'],
      ['kenta', 'けんた'],
      ['kai', 'カイ', 'blink'],
    ] as const
  ).flatMap(([who, name, only]: readonly [string, string, string?]) =>
    (
      [
        ['blink_src', '目を閉じた絵。まばたきの元', BLINK_SRC_PROMPT, '目'],
        ['talk_src', '口を開けた絵。口パクの元', TALK_SRC_PROMPT, '口'],
      ] as const
    ).filter(([face]) => !only || face.startsWith(only)).map(([face, title, prompt, part]): AssetEntry => {
      const base = geminiFace(who, name, face, title, '', '', '通常', '');
      return {
        ...base,
        source: { ...base.source, prompt } as AssetEntry['source'],
        acquiredAt: '2026-10-19',
        notes: `会話には出さない（起動の時も読み込まない）。${part}のまわりだけを切り抜いて、差分にする（scripts/portrait_parts.py）。ChatGPT の規約の控えは docs/licenses/ai-openai.md`,
      };
    }),
  ),
];

/**
 * 立ち絵のまばたき・口パクの差分（段階46b）。元の表情の絵から目・口のまわりだけを切り抜いた透明な絵（scripts/portrait_parts.py）。
 * 入手元・ライセンスは元の絵と同じ。会話の画面で表情の絵に重ねる（src/data/dialogue.ts の PORTRAIT_PARTS）
 */
const PORTRAIT_PART_FILES: [file: string, from: string, title: string][] = [
  ['akari_blink', 'portrait.akari.laugh', 'あかりの閉じた目（まばたき）'],
  ['akari_talk', 'portrait.akari.worried', 'あかりの開いた口（口パク）'],
  ['hero_talk', 'portrait.hero.surprised', 'ハルトの開いた口（口パク）'],
  ...(['normal', 'proud', 'serious', 'sad', 'smirk', 'flustered'] as const).map(
    (f): [string, string, string] => [`riku_talk_${f}`, `portrait.riku.talk_${f}_src`, `りくの開いた口（口パク。${RIKU_FACE_TITLES[f]}）`],
  ),
  ['hero_blink', 'portrait.hero.blink_src', 'ハルトの閉じた目（まばたき）'],
  ['riku_blink', 'portrait.riku.blink_src', 'りくの閉じた目（まばたき）'],
  // 1-1・1-2 の人たち（2026-10-19）。_l は基本の1枚（1024×1536）に重ねる大きさに広げたもの
  ...(
    [
      ['yuma', 'ゆうま', ['blink', 'blink_l', 'talk']],
      ['fumi', 'ふみ', ['blink', 'blink_l', 'talk', 'talk_l']],
      ['young_riku', '子どものりく', ['blink', 'blink_l', 'talk']],
      ['past_yuma', '写しのゆうま', ['blink', 'blink_l', 'talk']],
      ['past_kiyoshi', '写しのきよし', ['blink', 'blink_l', 'talk', 'talk_l']],
      ['young_akari', '子どものあかり', ['blink', 'blink_l', 'talk']],
      ['young_hero', '子どものハルト', ['blink', 'blink_l', 'talk', 'talk_l']],
      ['past_fumi', '写しのふみ', ['blink', 'blink_l', 'talk']],
      ['past_hinano', '写しのひなの', ['blink_l']],
      ['kenta', 'けんた', ['blink_l', 'talk_l']],
      ['kai', 'カイ', ['blink_l']],
    ] as const
  ).flatMap(([who, name, files]) =>
    files.map((f): [string, string, string] => [
      `${who}_${f}`,
      `portrait.${who}.${f.startsWith('blink') ? 'blink' : 'talk'}_src`,
      `${name}の${f.startsWith('blink') ? '閉じた目（まばたき）' : '開いた口（口パク）'}${f.endsWith('_l') ? '（基本の1枚の大きさ）' : ''}`,
    ]),
  ),
];
for (const [file, from, title] of PORTRAIT_PART_FILES) {
  const src = ASSETS.find((a) => a.id === from);
  if (!src) throw new Error(`立ち絵の差分の元の絵がない：${from}`);
  ASSETS.push({
    ...src,
    id: `portrait.part.${file}`,
    title,
    file: `assets/portraits/parts/${file}.webp`,
    // 2026-10-19 からの差分は、元の絵を入れた日
    acquiredAt: src.acquiredAt > '2026-10-11' ? src.acquiredAt : '2026-10-11',
    notes: `${src.title}から切り抜いた（scripts/portrait_parts.py。段階46b）。${src.notes ?? ''}`,
  });
}
