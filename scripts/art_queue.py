"""絵の「そのまま貼る一覧」（docs/ART_QUEUE.md）を作る（2026-10-25。ChatGPT Plus で、待っている絵をまとめて作るため）。

使い方: python3 scripts/art_queue.py
  指示文の元は docs/ART.md（頭の文・決まり）。ここに、まだ指示文のなかった3章の人・敵・部屋・背景を足し、
  1枚ごとに「頭の文＋本文＋締めの文」をつないだ形で書き出す。ART.md を直したら、ここも合わせて作り直す
"""

STYLE = 'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.'
STYLE_ENEMY = 'Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.'

P = 'public/assets/portraits/'
REF_TEEN = P + 'akari_smile.webp'
REF_CHILD = P + 'young_akari_smile.webp'


def portrait(face, body, child=False):
    ref = 'the attached reference portrait of the little girl in the yukata, with the same childlike proportions' if child else 'the attached reference portrait of the girl in the cardigan'
    return f'''{STYLE}

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, {face}.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as {ref}.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
{body}'''


def background(scene):
    return f'''{STYLE}

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
{scene}
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.'''


def enemy(era, body, boss=False):
    big = 'A large boss monster, filling most of the image. ' if boss else ''
    return f'''{STYLE_ENEMY}

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era ({era}). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
{big}Body: {body}'''


EDGE = {'top': ('top', 'width'), 'bottom': ('bottom', 'width'), 'left': ('left', 'height'), 'right': ('right', 'height')}


def room(scene, exits, tall, closed='walls, buildings, fences or trees'):
    size = 'Vertical image (1024×1536).' if tall else 'Square 1:1 image (1024×1024).'
    edges = ' '.join(f'An opening at the center of the {s} edge, one sixth of the image {EDGE[s][1]} wide, leading out of the image.' for s in exits)
    return f'''{STYLE}

Top-down map illustration for a mobile RPG exploration scene. {size} A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
{scene}
{edges} All other edges are closed by {closed}.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.'''


ITEMS = []  # (章の見出し, [(番号, 名前, 添付, 保存名, 指示文, メモ)])

# 届いてゲームに入れた絵（保存名）。一覧では見出しに「済」を付ける
DONE = {'sayoko_sheet.png', 'sayoko_smile.png', 'chiyo_smile.png', 'noboru_smile.png', 'past_chiyo_smile.png', 'past_kiku_normal.png', 'past_noboru_smile.png', 'shiori_smile.png', 'toya_smile.png', 'past_shiori_smile.png', 'past_toya_smile.png', 'past_koji_normal.png', 'past_masaru_smile.png', 'masaru_smile.png', 'sumi_smile.png', 'past_sumi_smile.png', 'daichi_smile.png', 'saki_smile.png', 'gear_noise.png', 'screw_noise.png', 'tube_noise.png', 'abacus_noise.png', 'lathe_boss.png', 'flip_phone_noise.png', 'sticker_noise.png', 'boombox_noise.png', 'metronome_noise.png', 'amp_boss.png', 'ball_noise.png', 'pet_noise.png', 'megaphone_noise.png', 'jug_noise.png', 'scoreboard_boss.png', 'fan_noise.png', 'coil_noise.png', 'radio_noise.png', 'table_noise.png', 'postbox_noise.png', 'train_boss.png', 'lantern_noise.png', 'pinwheel_noise.png', 'candy_noise.png', 'phonograph_noise.png', 'yagura_boss.png', 'earphone_noise.png', 'selfie_noise.png', 'tapioca_noise.png', 'diploma_noise.png', 'yosegaki_noise.png', 'crossing_boss.png', 'map_fest_woods.png', 'map_fest_backyard.png', 'map_fest_east.png', 'map_fest_west.png', 'map_fest_gate.png', 'map_showa_alley.png', 'map_showa_lane.png', 'map_showa_hill.png', 'map_school_courtyard.png', 'map_school_bikes.png', 'map_school_classroom.png', 'map_school_corridor.png', 'map_school_gym.png', 'map_riverside_levee.png', 'map_riverside_bank.png', 'map_riverside_bench.png', 'map_riverside_diamond.png', 'map_riverside_shed.png', 'map_riverside_stand.png', 'map_archive_corridor.png', 'map_archive_reading.png', 'map_archive_vault.png', 'map_archive_stacks.png', 'map_village_station.png', 'map_village_paddy.png', 'map_village_shrine.png', 'map_village_house.png', 'map_village_river.png', 'map_village_platform.png', 'map_grad_slope.png', 'map_grad_gym_back.png', 'map_grad_street.png', 'map_grad_levee.png', 'map_grad_crossing.png', 'map_matsuri_torii.png', 'map_matsuri_stalls.png', 'map_matsuri_yagura.png', 'map_matsuri_edge.png', 'bg_home_tv_dark.png', 'bg_school_festival.png', 'bg_village_1966.png', 'bg_village_dusk.png', 'bg_care_home.png', 'bg_care_home_rain.png', 'bg_station_now.png', 'bg_school_fair.png', 'bg_taisho_festival.png', 'bg_taisho_edge.png', 'bg_shrine_now.png', 'bg_grad_2019.png', 'bg_grad_dusk.png', 'bg_crossing_now.png', 'cg_pinch_hit.png', 'snap_sword.png', 'snap_heavyBlow.png', 'snap_iceChip.png', 'snap_thunderChip.png', 'snap_wideShot.png', 'snap_recover.png', 'snap_quickStep.png', 'snap_search.png', 'snap_breakArm.png', 'snap_draw.png', 'snap_joker.png', 'snap_encore.png', 'snap_pinchHitter.png', 'snap_fireChip.png'}


def section(title, note=''):
    ITEMS.append((title, note, []))


def add(name, attach, save, prompt, memo=''):
    ITEMS[-1][2].append((name, attach, save, prompt, memo))


# ---- A. 小夜子 ----
section('A. 小夜子（ヒロイン）', '見た目はまだ決まっていない。下の設定画の文は、脚本（`docs/script/3-matsuri.md` の 2.：大正10年の夏、16歳、旧家の娘、浴衣に赤い鼻緒の下駄、月の形の簪）から書いたたたき台。設定画を見て、髪・浴衣の色・柄を決めてから、胸から上の1枚を作る')
add('小夜子の設定画', [REF_TEEN], 'sayoko_sheet.png', f'''{STYLE}

Character design sheet of an original anime-style girl for a mobile turn-based JRPG, full body front view, standing in a graceful pose, plain off-white background, clean lineart with soft cel shading, teenage proportions about 6.5 heads tall. Same art style as the attached reference portrait.
Character: Sayoko, a 16-year-old daughter of an old, strict family in a Japanese town in the summer of 1921 (Taisho era), who has secretly slipped out alone to the summer shrine festival on her first free night. Graceful and polite, with a slightly old-fashioned elegance, but bursting with curiosity, a playful sparkle in her eyes. Underneath, a quiet sadness, as if she has already accepted that her night will end.
Hair: long straight black hair, half-up and pinned with a small silver hairpin shaped like a crescent moon, the rest falling down her back, neat blunt bangs.
Eyes: large dark eyes with a soft reddish-brown tint, long lashes.
Outfit: a deep indigo summer yukata with a pattern of white bellflowers (kikyo) and a few pale glowing fireflies, a crimson obi, wooden geta sandals with bright red straps (hanao), a small drawstring pouch (kinchaku) on her wrist. Everything appropriate for the Taisho era, no modern items.
Color palette: hair #1E1A24, yukata #24305A, flowers #F2F0E6, obi #B8323C, red straps #D23A3A, moon hairpin #D8DCE8, skin #F6E0CF.
Additional views on the same sheet: back view, 4 facial expressions (gentle smile, curious wide-eyed delight, quiet lonely smile, surprised), close-up of the crescent moon hairpin.
Absolutely no letters, numbers or text anywhere.''', '気に入るまで作り直してよい。決まったら、この設定画を下の1枚に添付する')
add('小夜子の胸から上の基本の1枚（微笑み）', ['sayoko_sheet.png（上で決めた設定画）', REF_TEEN], 'sayoko_smile.png',
    portrait('a gentle, graceful smile', 'Character: Sayoko. Keep her design exactly as in the attached character sheet: long straight black hair half-up with a small silver crescent moon hairpin, blunt bangs, large dark eyes with a soft reddish-brown tint, a deep indigo yukata with white bellflowers and a crimson obi.'),
    '表情違い（笑顔・通常・考える・驚き・真剣・さみしげ・照れ・泣き笑い）は Gemini で（`docs/ART.md` の 5-3 の 14）')

# ---- B. 3章の人 ----
section('B. 3章の人', '「写し」の人は、ゲームの中でセピアに色を付けるので、ふつうの色で作る。見本は構図をそろえるため（大人・中高生はあかりの笑顔、子どもは子どものあかり）')
B = [
    ('ちよ（今75歳。ひだまり荘）', 'a gentle, refined smile', 'Character: Chiyo, a 75-year-old Japanese woman living in a small care home in a quiet regional town. Elegant and polite, a warm but slightly lonely smile. Short soft white hair neatly permed, small gold-rimmed glasses, a pale lavender knitted cardigan over a cream blouse, a thin silver chain. She once worked in a Tokyo electronics factory at fifteen; her hands are small and careful.', False, 'chiyo_smile.png'),
    ('のぼる（今68歳。ちよの弟）', 'an easygoing, warm grin', 'Character: Noboru, a 68-year-old Japanese man from a mountain farming village, Chiyo\'s younger brother, visiting the town. Sun-tanned, weathered face, short gray crew-cut hair, kind crinkled eyes, a slightly gap-toothed grin. A faded checked work shirt with rolled sleeves under a plain gray vest. Laid-back and unhurried, a simple countryman.', False, 'noboru_smile.png'),
    ('写しのちよ（昭和41年、15歳）', 'a bright, slightly forced cheerful smile', 'Character: young Chiyo, a 15-year-old Japanese girl in the summer of 1966, coming home to her mountain village for the first time after starting factory work in Tokyo. Keep a face that could grow into a gentle, refined old woman. Black hair in two short braids, a crisp white short-sleeve blouse, a navy skirt. She acts cheerful and grown-up, but her eyes are a little homesick.', False, 'past_chiyo_smile.png'),
    ('写しの菊（ちよとのぼるの母。昭和41年、40歳くらい）', 'a calm, quiet expression with her mouth firmly closed', 'Character: Kiku, a Japanese farming woman around 40 in the summer of 1966, a widow who works her mountain fields alone. Sun-tanned skin, strong hands, black hair tied back tightly under a faded indigo cotton head scarf (tenugui), a dark indigo work kimono top with tied-back sleeves. Few words and blunt manners, but deep, steady eyes that care.', False, 'past_kiku_normal.png'),
    ('写しののぼる（昭和41年、8歳）', 'a huge excited grin', 'Character: young Noboru, an 8-year-old Japanese village boy in the summer of 1966, overjoyed that his big sister is coming home. Very short buzz-cut black hair, sun-tanned skin, a scraped nose, a plain white sleeveless undershirt (running shirt) and a straw hat hanging on his back.', True, 'past_noboru_smile.png'),
    ('しおり（今22歳。印刷会社の一年目）', 'a bright, slightly flustered smile', 'Character: Shiori, a 22-year-old Japanese woman in her first year at a small local printing company in a quiet regional town. Short neat dark-brown bob with one side tucked behind her ear, lively eyes, a talkative, quick face. A light beige cardigan over a white collared blouse, a plain staff lanyard (blank card, no letters).', False, 'shiori_smile.png'),
    ('とうや（今22歳。鉄道の保線の仕事）', 'a calm, easygoing smile', 'Character: Toya, a 22-year-old Japanese man who works on railway track maintenance. Slightly messy black hair, sleepy relaxed eyes, a gentle, laid-back face. A dark navy work jacket with a reflective stripe over a gray T-shirt, no logos. The kind of person who listens to the end before he speaks.', False, 'toya_smile.png'),
    ('写しのしおり（平成31年3月、15歳）', 'a teasing smile, trying to hide that she is embarrassed', 'Character: young Shiori, a 15-year-old Japanese middle school girl on her graduation day in March 2019, the same person as the 22-year-old office worker. Short dark-brown hair, a navy sailor-style school uniform with a red scarf, a small corsage of paper flowers with a ribbon pinned on her chest (graduation). Sharp-tongued to hide her shyness.', False, 'past_shiori_smile.png'),
    ('写しのとうや（平成31年3月、15歳）', 'a soft, easygoing smile', 'Character: young Toya, a 15-year-old Japanese middle school boy on his graduation day in March 2019. Slightly messy black hair, relaxed eyes. A black gakuran school uniform whose buttons were almost all taken by younger students as keepsakes; only the second button from the top is still there. A corsage of paper flowers on his chest, one white earbud cable hanging from his collar.', False, 'past_toya_smile.png'),
]
for name, face, body, child, save in B:
    add(name, [REF_CHILD if child else REF_TEEN], save, portrait(face, body, child))

# ---- C. 2章の残りの人 ----
section('C. 2章の残りの人', '写しのこうじ・写しのまさるは、こうじの立ち絵も添付する（顔を似せるため）')
C = [
    ('写しのこうじ（平成10年、12歳）', [REF_CHILD, P + 'koji_smile.webp'], 'past_koji_normal.png', 'a nervous, unsure face, biting his lip', 'Character: young Koji, the same man as the attached adult portrait but 28 years earlier: a 12-year-old boy on a little league baseball team in the summer of 1998, always on the bench. Keep the same face features so he is clearly the same person. Short black hair, a slightly dirty white baseball uniform with navy trim that is a little too big for him, a baseball cap. No letters or numbers on the uniform or cap.', True),
    ('写しのまさる（平成10年、40代。こうじの父）', [REF_TEEN, P + 'koji_smile.webp'], 'past_masaru_smile.png', 'a big, warm, proud smile', 'Character: Masaru, Koji\'s father, a Japanese man in his 40s in the summer of 1998, a cheerful working dad watching his son\'s little league game. A face that resembles the attached portrait (his son as an adult), sun-tanned skin, short black hair, a faded polo shirt with a towel around his neck. No letters or logos.', False),
    ('まさる（今70歳くらい。こうじの父）', [REF_TEEN, 'past_masaru_smile.png（上で作った絵）'], 'masaru_smile.png', 'a loud, cheerful grin', 'Character: Masaru, the same man as the attached portrait but about 28 years later: a Japanese man around 70, retired, who still comes to the riverside little league field every day with a plastic megaphone. Keep the same face features so he is clearly the same person. Short white hair, deep laugh lines, sun-tanned skin, a faded baseball cap pushed back, a light windbreaker. No letters or logos.', False),
    ('すみ（今77歳。銭湯「松の湯」の女将）', [REF_TEEN], 'sumi_smile.png', 'a warm, cheerful smile', 'Character: Sumi, a 77-year-old Japanese woman who runs an old public bathhouse in a quiet regional town. Small and spry, gray hair tied in a low bun with a white hand towel (tenugui) over it, a white kappogi apron-smock over a dark kimono, bright energetic eyes.', False),
    ('写しのすみ（昭和44年、22歳。番台の娘）', [REF_TEEN, 'sumi_smile.png（上で作った絵）'], 'past_sumi_smile.png', 'a bright, lively smile', 'Character: young Sumi, the same woman as the attached portrait but 57 years earlier: a 22-year-old daughter of a public bathhouse in the winter of 1969. Keep the same face features so she is clearly the same person. Black hair tied back under a white hand towel, rosy cheeks from the cold, a simple striped kimono with a dark half-coat (hanten).', False),
    ('だいち（今37歳。けんたのバンドのドラム）', [REF_TEEN, P + 'kenta_smile.webp'], 'daichi_smile.png', 'a friendly, slightly awkward smile', 'Character: Daichi, a 37-year-old Japanese salesman, the former drummer of a high school band. Short neat black hair, a broad friendly face, a dark gray business suit with a loosened tie. Same art style and framing as the attached portrait of his old bandmate.', False),
    ('さき（今37歳。けんたのバンドのベース）', [REF_TEEN, P + 'kenta_smile.webp'], 'saki_smile.png', 'a confident, warm smile', 'Character: Saki, a 37-year-old Japanese woman, the former bassist of a high school band, now a working mother. Shoulder-length wavy dark-brown hair, sharp but kind eyes, a soft gray cardigan over a simple dark top, small earrings. Teasing and straightforward. Same art style and framing as the attached portrait of her old bandmate.', False),
]
for name, att, save, face, body, child in C:
    add(name, att, save, portrait(face, body, child))

# ---- D. 敵 ----
section('D. 敵', '毎回、ブリキノイズの絵（`public/assets/enemies/tin_noise.webp`）を絵柄の見本として添付する。白い背景のまま送ってくれればよい（抜くのは Claude が `scripts/cutout_white.py` で行う）。ぬしは、部位がはっきり見えるように頼んでいる')
SHOWA = 'sepia, faded green and orange'
HEISEI = 'bright pastel and light blue'
TAISHO = 'deep indigo night, lantern red and old gold'
D = [
    ('2-1 歯車ノイズ', SHOWA, 'a lump of gears and mainsprings grinding against each other without meshing, charging forward', False, 'gear_noise.png'),
    ('2-1 ネジノイズ', SHOWA, 'a fast swarm of screws, nuts and bolts', False, 'screw_noise.png'),
    ('2-1 真空管ノイズ', SHOWA, 'an old vacuum-tube radio collapsing into noise, glowing tubes crackling with electricity', False, 'tube_noise.png'),
    ('2-1 そろばんノイズ', SHOWA, 'a wooden abacus whose beads fly apart and float around it like a shield', False, 'abacus_noise.png'),
    ('2-1 旋盤のぬし（ボス）', SHOWA, 'a vortex of an old lathe, leather belts and metal shavings, a tool post like a blade, a small glowing brass gear at its center', True, 'lathe_boss.png'),
    ('2-2 ガラケーノイズ', HEISEI, 'a flock of old flip phones with antennas, screens flashing and ringing', False, 'flip_phone_noise.png'),
    ('2-2 写真シールノイズ', HEISEI, 'a swarm of small photo stickers peeling off and fluttering, decorated with sparkles and hearts (no faces, no letters)', False, 'sticker_noise.png'),
    ('2-2 ラジカセノイズ', HEISEI, 'a boombox with cassette tapes unspooling around it like ribbons, speakers blasting', False, 'boombox_noise.png'),
    ('2-2 メトロノームノイズ', HEISEI, 'a wooden metronome whose pendulum swings so fast it blurs', False, 'metronome_noise.png'),
    ('2-2 アンプのぬし（ボス）', HEISEI, 'a tower of guitar amplifiers and speakers wrapped in tangled cables, one broken guitar string whipping around', True, 'amp_boss.png'),
    ('2-3 ボールノイズ', HEISEI, 'a fast swarm of baseballs with red stitches', False, 'ball_noise.png'),
    ('2-3 電子ペットノイズ', HEISEI, 'a small egg-shaped handheld digital pet toy with a tiny pixel creature on its screen (no logos)', False, 'pet_noise.png'),
    ('2-3 メガホンノイズ', HEISEI, 'a cluster of plastic cheering megaphones whose cheers have turned into angry roars', False, 'megaphone_noise.png'),
    ('2-3 水筒ノイズ', HEISEI, 'a big sports water jug and ice water splashing around it', False, 'jug_noise.png'),
    ('2-3 スコアボードのぬし（ボス）', HEISEI, 'a giant made of a wooden scoreboard, a backstop net and hundreds of megaphones, its score panels spinning endlessly (blank panels, no numbers)', True, 'scoreboard_boss.png'),
    ('3-1 扇風機ノイズ', SHOWA, 'an old electric fan from the 1960s with chipped blades, spinning so fast it whips up wind', False, 'fan_noise.png'),
    ('3-1 蚊取り線香ノイズ', SHOWA, 'a large green mosquito coil smoldering in a pig-shaped ceramic holder, its smoke curling into a spiral body with glowing embers', False, 'coil_noise.png'),
    ('3-1 トランジスタラジオノイズ', SHOWA, 'a small 1960s transistor radio with a round speaker grille and a tuning dial, its telescopic antenna whipping around, crackling static spilling out', False, 'radio_noise.png'),
    ('3-1 ちゃぶ台ノイズ', SHOWA, 'a round low wooden dining table (chabudai) with one broken leg, flipped on its side, teacups and rice bowls flying around it', False, 'table_noise.png'),
    ('3-1 郵便ポストノイズ（番人）', SHOWA, 'a classic red cylindrical Japanese post box, its shape crumbling, envelopes of money sent home spilling out of its slot like a tongue (blank envelopes, no letters)', False, 'postbox_noise.png'),
    ('3-1 汽車のぬし（ボス）', SHOWA, 'a huge black steam locomotive turning into a shadow of smoke and iron wheels, blocking a country station platform. Two clearly visible parts: a tall smokestack (chimney) at the upper left billowing thick black smoke, and big red-spoked iron driving wheels at the lower right', True, 'train_boss.png'),
    ('祭りの夜 提灯ノイズ', TAISHO, 'a cluster of torn red paper lanterns, their flames flickering through the holes', False, 'lantern_noise.png'),
    ('祭りの夜 風車ノイズ', TAISHO, 'a bunch of colorful paper pinwheels on bamboo sticks, spinning endlessly into a whirlwind', False, 'pinwheel_noise.png'),
    ('祭りの夜 飴細工ノイズ', TAISHO, 'a delicate amber candy sculpture of a crane, half melted and dripping, on a wooden stick', False, 'candy_noise.png'),
    ('祭りの夜 蓄音機ノイズ', TAISHO, 'an old gramophone with a large brass horn, a record spinning and skipping, musical notes made of sand pouring out (no letters)', False, 'phonograph_noise.png'),
    ('祭りの夜 やぐらのぬし（ボス）', TAISHO, 'a giant tangle of a bon-odori festival tower (yagura), a big taiko drum and hundreds of paper lanterns, a hundred years of wear. Two clearly visible parts: a huge taiko drum at the upper center, and a thick rope strung with glowing lanterns across the lower right', True, 'yagura_boss.png'),
    ('3-2 イヤホンノイズ', HEISEI, 'a long tangle of white wired earphone cables coiling like snakes, two earbuds at the ends like heads', False, 'earphone_noise.png'),
    ('3-2 自撮り棒ノイズ', HEISEI, 'an extending selfie stick bending wildly, a smartphone with a cracked screen at its tip (blank screen, no logos)', False, 'selfie_noise.png'),
    ('3-2 タピオカノイズ', HEISEI, 'a big clear plastic cup of tapioca milk tea with a thick straw, wobbly black tapioca pearls bouncing out', False, 'tapioca_noise.png'),
    ('3-2 卒業証書の筒ノイズ', HEISEI, 'a black cylindrical diploma tube with its lid popped off, white paper sheets pouring out like a storm (blank paper, no letters)', False, 'diploma_noise.png'),
    ('3-2 寄せ書きの色紙ノイズ（番人）', HEISEI, 'dozens of square autograph boards (shikishi) swirling and overlapping, covered in colorful doodles and hearts (no readable letters)', False, 'yosegaki_noise.png'),
    ('3-2 踏切のぬし（ボス）', HEISEI, 'a giant made of railroad crossing signals, dozens of flashing red warning lights stacked on top of each other, and many black-and-yellow crossing gate arms stretching out and never rising. Two clearly visible parts: the cluster of warning lights with a crossing bell at the upper center, and the long crossing gate arms reaching out to the lower left', True, 'crossing_boss.png'),
]
for name, era, body, boss, save in D:
    add(name, ['public/assets/enemies/tin_noise.webp'], save, enemy(era, body, boss))

# ---- E. 部屋の地図 ----
section('E. 部屋の地図', '毎回、その部屋の配置の下絵（`docs/sketches/room_layouts/room_<部屋>.png`）と、絵柄の見本の地図を添付する。下絵の明るい所が歩ける所。1-1 は縁日の地図、1-2 は商店街の地図、2-2 以降は、その区画で最初にできた部屋の絵を見本にする（なければ縁日の地図）')
M = 'public/assets/maps/'
L = 'docs/sketches/room_layouts/'
FEST = 'at summer dusk in the late Heisei era, warm lantern light'
E = [
    ('1-1 参道の入口', 'fest_gate', M + 'festival.webp', f'Scene: the entrance approach of a small Japanese shrine festival {FEST}, a red torii gate at the bottom, festival stalls with striped awnings and paper lanterns along both sides of the stone-paved approach.', ['top', 'left'], False),
    ('1-1 屋台の裏', 'fest_backyard', M + 'festival.webp', f'Scene: the backyard behind festival stalls {FEST}: stacked lantern boxes, a small generator, cables on the ground, plastic crates and a water tank, a narrow dead end at the top left.', ['right'], False),
    ('1-1 屋台の裏通り', 'fest_west', M + 'festival.webp', f'Scene: narrow back alleys winding between the rear sides of festival stalls {FEST}, tarps, folding tables, coolers and stacked paper lanterns.', ['right'], False),
    ('1-1 射的と金魚すくいの通り', 'fest_east', M + 'festival.webp', f'Scene: a side street of a shrine festival {FEST}: a shooting gallery stall at the top, a long winding path, and a goldfish-scooping stall with a wide blue water tank at the bottom right dead end.', ['left'], False),
    ('1-1 社の裏の林', 'fest_woods', M + 'festival.webp', 'Scene: a small grove behind a Japanese shrine on a summer night, a narrow dirt path winding between tall cedar trees, stone lanterns and moss, festival lights glowing faintly through the trees.', ['bottom'], False),
    ('1-2 左の路地裏', 'showa_alley', M + 'showa_street.webp', 'Scene: narrow back alleys behind the shops of a small Japanese shopping street at summer dusk in 1988, warm sepia-tinted retro colors: wooden fences, stacked beer crates and empty ramune bottles, old bicycles, laundry poles, a stray cat on a wall.', ['right'], False),
    ('1-2 右の電器屋の裏通り', 'showa_lane', M + 'showa_street.webp', 'Scene: a winding back lane behind an old electronics shop at summer dusk in 1988, warm sepia-tinted retro colors: discarded CRT televisions and radios stacked by the back door, tangled antenna cables, a small storage shed, potted plants, and a dead end with a little vacant lot at the bottom right.', ['left'], False),
    ('1-2 坂の上の先', 'showa_hill', M + 'showa_street.webp', 'Scene: the top of a gentle slope above a small Japanese town at summer sunset in 1988, warm sepia-tinted retro colors: a narrow paved road winding between old houses with tiled roofs and stone walls, utility poles with wires, a small bus stop bench and a vending machine, the evening sun glowing over the rooftops.', ['bottom'], False),
]
SCHOOL = 'a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors'
E += [
    ('2-2 校門の前庭', 'school_gate', M + 'festival.webp', f'Scene: the front yard just inside the gate of {SCHOOL}.\nBottom center: the school gate with a hand-made decorated festival arch of paper flowers and balloons (blank, no letters), the path entering from the bottom edge. A wide paved front yard with flower beds at the upper corners and two small flower beds in the middle, bicycles and a few festival guide boards (blank). A path leaves the yard straight up through the top edge toward the courtyard.', ['top'], False),
    ('2-2 模擬店の中庭', 'school_courtyard', 'map_school_gate.png（上で作った絵）', f'Scene: the school courtyard of {SCHOOL}.\nRows of student food stalls with colorful tents and folding tables along both sides (four small tent blocks as in the sketch), paper lanterns and garlands strung overhead. In the middle, a big tree with a round bench around it, and a wooden bench just below-left of the tree. Paths lead out through the bottom edge (to the gate), the top edge (to the school building) and the left edge (to the bicycle parking).', ['bottom', 'top', 'left'], True),
    ('2-2 駐輪場', 'school_bikes', 'map_school_gate.png', 'Scene: the bicycle parking area behind a Japanese high school building on a bright autumn afternoon in 2006, bright pastel and light blue colors.\nFour long rows of student bicycles in metal racks under a thin roof, with small gaps between them so you can weave through, as in the sketch. A wide path comes in from the right edge through the middle. Fallen ginkgo leaves, a vending machine against the wall, a dead-end corner at the top left.', ['right'], False),
    ('2-2 渡り廊下と音楽室の前', 'school_corridor', 'map_school_gate.png', f'Scene: an open-air roofed walkway between school buildings of {SCHOOL}.\nA wide walkway crosses the lower half from the bottom edge and turns right toward the right edge. On the upper left, a corridor runs in front of the music room with its windows and sliding door (a few music stands and instrument cases by the door). A straight path leads up through the top edge to the gymnasium. Posters on the walls are blank.', ['bottom', 'top', 'right'], False),
    ('2-2 お化け屋敷の教室', 'school_classroom', 'map_school_gate.png', 'Scene: a classroom turned into a haunted house attraction for a Japanese high school festival in 2006, seen from above with the ceiling removed, dim purple and light blue lighting with pastel accents.\nDesks stacked and covered with black curtains form a winding maze (three long curtain walls as in the sketch), with paper ghosts, fake spider webs and a few glowing paper lanterns. The entrance comes in from the left edge. A dead-end corner at the top right.', ['left'], False),
    ('2-2 体育館', 'school_gym', 'map_school_gate.png', 'Scene: the inside of a Japanese high school gymnasium during its school festival in 2006, seen from above with the roof removed, bright pastel and light blue colors with warm stage lights.\nAt the top, a raised wooden stage with curtains pulled aside, a drum set, guitar amplifiers and speakers on it, cables on the floor. Below, a wide polished wooden floor with court lines and rows of folding chairs pushed to the sides, as in the sketch. The entrance comes in from the bottom edge.', ['bottom'], False),
]
RIVER = 'a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors'
E += [
    ('2-3 土手の道', 'riverside_levee', M + 'festival.webp', f'Scene: the bottom of a grassy river embankment next to {RIVER}.\nA wide dirt path runs along the foot of the embankment from the lower left to the right, then a gentle slope path climbs up along the right side and turns left to leave through the top edge. Tall summer grass and a few parked bicycles on the embankment, a small grassy hollow on the left with a wooden bench.', ['top'], False),
    ('2-3 ベンチの裏の木陰', 'riverside_bench', 'map_riverside_levee.png（上で作った絵）', f'Scene: the area behind the team bench of a riverside {RIVER}.\nIn the lower part, a long wooden team bench with a small roof (as in the sketch). In the middle, a big shady tree with dappled shadows and a cooler box under it. Paths lead out through the bottom edge (to the embankment), the top edge (to the concession tent) and the right edge (to the riverbank). Cicada-filled summer mood.', ['bottom', 'top', 'right'], True),
    ('2-3 川べり', 'riverside_bank', 'map_riverside_levee.png', f'Scene: a quiet riverbank next to {RIVER}.\nThe river runs along the whole right side (not walkable, sparkling water). A sandy and grassy bank with three clumps of tall reeds and summer grass (as in the sketch), a few stray baseballs in the grass, an old bucket. The entrance comes in from the left edge.', ['left'], False),
    ('2-3 売店のテント', 'riverside_stand', 'map_riverside_levee.png', f'Scene: a small white concession tent beside {RIVER}.\nThe tent with folding tables, a tub of ice water with floating ramune bottles (blank labels), shade umbrellas. An open dirt area in front of the tent. Paths lead out through the bottom edge, the top edge (toward the diamond) and the left edge (toward the equipment shed).', ['bottom', 'top', 'left'], False),
    ('2-3 用具小屋の裏', 'riverside_shed', 'map_riverside_levee.png', f'Scene: the back of a small wooden equipment shed beside {RIVER}.\nNarrow passages divided by a long practice net and stacks of bat boxes and base bags (two long dividers as in the sketch), a roller for the field, buckets of balls. The entrance comes in from the right edge. A dead-end corner at the top left.', ['right'], False),
    ('2-3 ダイヤモンド', 'riverside_diamond', 'map_riverside_levee.png', f'Scene: the infield of {RIVER}, seen from above.\nAt the top, home plate in front of a tall backstop net, with the ends of the net at the upper corners (as in the sketch). Below, the dirt infield with bases and white chalk lines, the pitcher\'s mound. A wooden scoreboard (blank panels, no numbers) is visible beyond the backstop. The entrance comes in from the bottom edge.', ['bottom'], False),
]
ARCH = 'a vast archive of the Time Archive Bureau, an office of the far future: endless tall shelves of flawless glass hourglasses with neat labels (blank, no letters), cold blue-white light, polished pale stone floors, beautiful and silent'
E += [
    ('2-3 4晩目 書庫の通用口の廊下', 'archive_corridor', M + 'festival.webp', f'Scene: a long service corridor entering {ARCH}. Rows of shelves form narrow aisles, a small checkpoint desk with a glowing lamp.', ['top'], False, 'walls of tall archive shelves'),
    ('2-3 4晩目 閲覧室', 'archive_reading', 'map_archive_corridor.png（上で作った絵）', f'Scene: a reading room in {ARCH}. Long reading tables with hourglasses left on them as if someone just stood up, open ledgers (blank pages), shelves along the walls.', ['bottom', 'top', 'right'], True, 'walls of tall archive shelves'),
    ('2-3 4晩目 奥の部屋（黒い扉）', 'archive_vault', 'map_archive_corridor.png', f'Scene: a quiet back room of {ARCH}. At the upper right, a heavy black door engraved with the emblem of several black hourglasses hanging from a bar (no letters). Dim light, dust in the air.', ['left'], False, 'walls of tall archive shelves'),
    ('2-3 4晩目 奥の書庫', 'archive_stacks', 'map_archive_corridor.png', f'Scene: the deepest stacks of {ARCH}. Very tall shelves in long rows, and at the top center one shelf where a single cracked hourglass glows warmly among the flawless ones.', ['bottom'], True, 'walls of tall archive shelves'),
]
VILLAGE = 'a mountain farming village in Japan during the Obon holidays in the summer of 1966, warm sepia-tinted retro colors with green rice fields'
E += [
    ('3-1 村の駅前', 'village_station', M + 'factory_alley.webp', f'Scene: the small square in front of a tiny wooden country train station in {VILLAGE}. A dirt road, a bus stop sign (blank), a bench, a red post box, summer cicada trees.', ['top'], False),
    ('3-1 田んぼ道', 'village_paddy', 'map_village_station.png（上で作った絵）', f'Scene: a narrow dirt path running between green rice paddies in {VILLAGE}. Irrigation channels, a small stone Jizo statue, utility poles, mountains in the distance. A side path to the right leads to stone steps of a village shrine forest.', ['bottom', 'top', 'right'], True),
    ('3-1 鎮守の森の石段', 'village_shrine', 'map_village_station.png', f'Scene: mossy stone steps and a small wooden village shrine under tall cedar trees in {VILLAGE}, dappled sunlight, stone lanterns.', ['left'], False),
    ('3-1 実家の庭', 'village_house', 'map_village_station.png', f'Scene: the front yard of an old thatched-roof farmhouse in {VILLAGE}: a wide wooden veranda (engawa), a vegetable garden, a well, laundry drying on a pole, a bicycle. A side path to the right leads down to the river.', ['bottom', 'top', 'right'], False),
    ('3-1 川べり', 'village_river', 'map_village_station.png', f'Scene: a clear shallow mountain river beside {VILLAGE}, smooth river stones, a small wooden footbridge, reeds, dragonflies, evening light starting.', ['left'], False),
    ('3-1 夕暮れの駅のホーム', 'village_platform', 'map_village_station.png', 'Scene: the single platform of a tiny wooden country train station at summer dusk in 1966, warm orange sunset light with sepia tones: a wooden waiting bench, a hanging station clock (no numbers needed), a long platform edge with railway tracks along the top, mountains glowing in the sunset.', ['bottom'], False),
]
GRAD = 'a quiet Japanese town on a mild afternoon in March 2019, the day of a middle school graduation ceremony, soft spring colors with early cherry blossoms'
E += [
    ('3-2 校門の坂', 'grad_slope', M + 'festival.webp', f'Scene: a gentle slope road leading down from the gate of a middle school in {GRAD}. A school gate with a blank graduation sign board at the bottom, cherry trees just starting to bloom along the road, guardrails. A side path to the right goes behind the gymnasium.', ['top', 'right'], True),
    ('3-2 体育館の裏', 'grad_gym_back', 'map_grad_slope.png（上で作った絵）', f'Scene: the quiet space behind a middle school gymnasium in {GRAD}: a concrete walkway, stacked folding chairs from the ceremony, a storage shed, a single cherry tree.', ['left'], False),
    ('3-2 商店街', 'grad_street', 'map_grad_slope.png', f'Scene: a small local shopping street in {GRAD}: a bakery, a musical instrument shop with a guitar in the window, a convenience store, banners and signs (all blank). A side path to the right leads to the river embankment.', ['bottom', 'top', 'right'], True),
    ('3-2 川の土手', 'grad_levee', 'map_grad_slope.png', f'Scene: a grassy river embankment in {GRAD}, a paved path along the top, the wide river below, dandelions and early spring grass.', ['left'], False),
    ('3-2 夕暮れの踏切', 'grad_crossing', 'map_grad_slope.png', 'Scene: a railroad crossing at the edge of a quiet Japanese town at dusk in March 2019, orange sunset light: railway tracks running across the top of the image, crossing signals with lights and gate arms (raised), a narrow road leading up to the crossing, small houses and utility poles.', ['bottom'], False),
]
MATSURI = 'a Japanese shrine summer festival on a night in 1921 (Taisho era), deep indigo night sky, warm red paper lanterns, old-fashioned wooden stalls'
E += [
    ('祭りの夜 鳥居と参道', 'matsuri_torii', M + 'festival.webp', f'Scene: a stone-paved shrine approach through a large red torii gate in {MATSURI}. Stone lanterns, rows of hanging lanterns leading up.', ['top'], False),
    ('祭りの夜 屋台の通り', 'matsuri_stalls', 'map_matsuri_torii.png（上で作った絵）', f'Scene: a street of old festival stalls in {MATSURI}: a goldfish seller with wooden tubs, a candy craftsman, a lottery stall, pinwheels, strings of lanterns overhead.', ['bottom', 'top'], False),
    ('祭りの夜 やぐらの広場', 'matsuri_yagura', 'map_matsuri_torii.png', f'Scene: an open square in front of the shrine with a tall wooden bon-odori dance tower (yagura) in {MATSURI}, a big taiko drum on the tower, ropes of lanterns stretching out from it in all directions.', ['bottom', 'top'], False),
    ('祭りの夜 夜の端', 'matsuri_edge', 'map_matsuri_torii.png', 'Scene: the far edge of a 1921 Japanese summer festival night, where the night has been cut off: the lantern-lit ground breaks off into a dark void, and the edge crumbles into falling grains of glowing sand and black-and-white TV static. A few broken lanterns and an old wooden bench near the edge. Eerie, sad and beautiful.', ['bottom'], False),
]
for row in E:
    name, rid, ref, scene, exits, tall = row[:6]
    closed = row[6] if len(row) > 6 else 'walls, buildings, fences or trees'
    add(name, [L + f'room_{rid}.png', ref], f'map_{rid}.png', room(scene, exits, tall, closed))

# ---- F. 背景 ----
section('F. 会話の背景', '見本は要らない（描きにくければ、施設の台所の背景 `public/assets/backgrounds/` のどれかを絵柄の見本に付ける）')
F = [
    ('施設の居間（夜、テレビの光だけ）', 'home_tv_dark', 'Scene: the shared living room of a small children\'s home at night in present-day Japan, lights off, lit only by the cold blue glow of an old television, low tables, cushions, children\'s drawings on the wall (blank), quiet and a little lonely.'),
    ('平成の高校の文化祭（秋の昼）', 'school_festival', 'Scene: a Japanese high school building decorated for its school festival on a bright autumn afternoon in 2006, paper flower arches, banners (blank), balloons, colorful student-made signs (blank), blue sky.'),
    ('昭和41年の夏、山あいの村（昼）', 'village_1966', 'Scene: a mountain farming village in Japan in the summer of 1966, green rice fields, thatched-roof farmhouses, a dirt road, utility poles, mountains and big summer clouds, warm sepia-tinted retro colors.'),
    ('昭和41年の夏、村の駅（夕暮れ）', 'village_dusk', 'Scene: the platform of a tiny wooden country train station at summer dusk in 1966, a long orange sunset, a wooden bench, a station clock, railway tracks leading into the mountains, warm sepia-tinted retro colors.'),
    ('ひだまり荘の部屋（窓辺）', 'care_home', 'Scene: a bright, cozy private room in a small Japanese care home, a bed with a quilt, a wheelchair by the window, a small table with a teacup and an old photo frame (no faces visible), lace curtains and soft afternoon sunlight.'),
    ('ひだまり荘の部屋（窓辺・雨）', 'care_home_rain', 'Scene: the same cozy private room in a small Japanese care home on a rainy afternoon, raindrops on the window, gray soft light, a wheelchair by the window, a small table with a teacup.'),
    ('町の駅のホーム（夕方の前）', 'station_now', 'Scene: the platform of a small local train station in a quiet present-day Japanese town in the late afternoon, a simple shelter, benches, a vending machine, rails stretching into the distance, warm light just before sunset.'),
    ('文化祭の学校の中庭（今）', 'school_fair', 'Scene: the courtyard of a present-day Japanese high school during its school festival, student food stalls with tents, decorated with paper flowers and garlands, a big tree in the center, bright autumn afternoon.'),
    ('大正十年の夏祭り（夜）', 'taisho_festival', 'Scene: a Japanese shrine summer festival on a night in 1921 (Taisho era), rows of old wooden stalls with red paper lanterns, a goldfish seller with wooden tubs, a bon-odori tower in the distance, deep indigo night sky, warm nostalgic lantern glow.'),
    ('祭りの夜の端（砂の落ちる縁）', 'taisho_edge', 'Scene: the far edge of a 1921 Japanese summer festival night, where the lantern-lit ground breaks off into a dark void and crumbles into falling grains of glowing sand and black-and-white static, a few broken lanterns at the edge, eerie, sad and beautiful.'),
    ('町の神社（今の昼）', 'shrine_now', 'Scene: a small shrine in a quiet present-day Japanese town on a calm afternoon, a red torii gate, stone lanterns, an old wooden shrine building, ema votive tablets hanging (blank), tall trees.'),
    ('平成31年3月、卒業式の帰り道（昼）', 'grad_2019', 'Scene: a residential road in a quiet Japanese town in March 2019, the afternoon after a middle school graduation ceremony, early cherry blossoms, a gentle slope, utility poles, soft spring light.'),
    ('平成31年3月、夕暮れの踏切', 'grad_dusk', 'Scene: a railroad crossing at the edge of a quiet Japanese town at dusk in March 2019, the crossing gate arms lowered and red warning lights glowing, a long orange sunset sky, power lines silhouetted.'),
    ('駅の近くの踏切（今の夕方の前）', 'crossing_now', 'Scene: a railroad crossing near a small station in a quiet present-day Japanese town in the late afternoon, gates raised, warm light just before sunset, a few houses and a bicycle leaning on a fence.'),
]
for name, bid, scene in F:
    add(name, [], f'bg_{bid}.png', background(scene))

# ---- G. 1枚絵 ----
section('G. 1枚絵')
add('代打の一打（2-3）', ['past_koji_normal.png（C で作った絵）', 'past_masaru_smile.png（C で作った絵）'], 'cg_pinch_hit.png', f'''{STYLE}

A single key visual (event CG). Vertical 9:16 image.
A riverside little league baseball field on a bright summer afternoon in 1998, bright pastel summer colors. The last inning, two outs. A 12-year-old pinch hitter in a slightly oversized white uniform swings the bat with all his strength, his arms trembling, his eyes shut tight, the ball just leaving the bat. Behind the backstop, his father in a polo shirt with a towel around his neck jumps up from the bench, shouting with joy (keep their designs as in the attached portraits). Teammates leaning out of the dugout, cumulonimbus clouds, sparkling light. No letters or numbers on uniforms or the scoreboard.
Keep the lower quarter of the image simple, because a text box may cover it. Absolutely no letters or text anywhere.''')

# ---- H. スナップ ----
section('H. スナップの写真', '`docs/ART.md` の 5-7 の表の本文を、下の頭と締めの間に入れて作る。人が写る物は、ハルト（`hero_smile.webp`）とあかり（`akari_smile.webp`）など、写る人の立ち絵を添付する')
SNAPS = [
    ('ソード', 'sword', 'Late 1990s Japan, a riverside embankment at sunset. A high school boy playfully holds up a long tree branch like a sword, striking a heroic pose; a high school girl beside him laughs. Silver-grey and gold light on the branch.'),
    ('ヘビーブロウ', 'heavyBlow', 'A high school classroom after school, preparing for the culture festival. The boy swings a big wooden mallet to nail a large plywood sign together while the girl steadies the board, wood shavings flying. Heavy grey tools in the foreground.'),
    ('ファイアボール', 'fireChip', 'A summer festival night in late 1990s Japan. The boy and the girl in yukata, seen from behind, look up at a huge red and orange firework blooming in the dark sky.'),
    ('アイスニードル', 'iceChip', 'A cold winter morning. The girl, seen from the side, draws a small picture with her fingertip on a frosted window; icicles hang outside, pale blue light everywhere.'),
    ('サンダーボルト', 'thunderChip', 'A sudden summer evening shower. The boy and the girl take shelter under the eaves of an old candy shop, seen from behind; a bright yellow lightning bolt lights up the dark sky in the distance.'),
    ('ワイドショット', 'wideShot', 'A shooting gallery stall at a summer festival. The girl aims a cork gun at a row of prizes while the boy watches beside her, seen from behind; warm lantern light.'),
    ('リカバー', 'recover', 'A quiet summer afternoon on a wooden veranda of an old Japanese house. The girl offers the boy a slice of watermelon; soft green garden light and wind chimes.'),
    ('クイックステップ', 'quickStep', 'A school sports day relay race. The moment the boy passes the baton to the girl, both mid-stride, seen from the side, motion lines and dust; violet-tinted late afternoon sky.'),
    ('サーチ', 'search', 'A quiet school library. The boy and the girl lean over one old book together, the girl holding a magnifying glass over a page; dust motes glowing in violet evening light.'),
    ('ブレイクアーム', 'breakArm', 'A narrow alley at dusk. The boy and the girl crouch beside an old bicycle and fix its broken chain together, a small grey toolbox open beside them.'),
    ('ドロー', 'draw', 'An empty classroom after school. Playing cards are spread out across two pushed-together desks; the boy and the girl\'s hands reach for the cards, faces out of frame. Violet evening light.'),
    ('ジョーカー', 'joker', 'A small 10-year-old girl with a confident grin, seen from the side, shows off a card trick, fanning playing cards and holding up the joker card toward the viewer; the card\'s face shows only a simple jester pattern. Soft golden light.'),
    ('アンコール', 'encore', 'A high school culture festival stage in the gym. A boy keeps singing into the microphone even though a guitar string has snapped, a girl playing beside him, seen from the side; a single spotlight and a few cheering hands in the foreground.'),
    ('ピンチヒッター', 'pinchHitter', 'A late 1990s riverside little league baseball field. A boy in a baseball uniform steps into the batter\'s box as a pinch hitter, seen from behind; in the stands, his father cups his hands and shouts. Bright summer afternoon.'),
]
SNAP_ATTACH = {'ジョーカー': [P + 'mio_smile.webp'], 'アンコール': [P + 'past_kenta_smile.webp'], 'ピンチヒッター': ['past_koji_normal.png（C で作った絵）', 'past_masaru_smile.png（C で作った絵）'], 'アイスニードル': [P + 'akari_smile.webp']}
for name, sid, scene in SNAPS:
    att = SNAP_ATTACH.get(name, [P + 'hero_smile.webp', P + 'akari_smile.webp'])
    add(f'スナップ：{name}', att, f'snap_{sid}.png', f'''{STYLE}

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
{scene}
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.''')


# ---- I〜K. 表情違いと 4-1 の人（2026-10-30。感情移入を優先して、台本で多く使う表情から） ----


def expression(face, keep, child=False):
    ref = 'the attached portrait, with the same childlike proportions' if child else 'the attached portrait'
    return f'''{STYLE}

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, {face}.
This is exactly the same character as {ref}: {keep}
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.'''


MIO = 'Mio, a petite, energetic 10-year-old girl with bright light-brown messy short hair, one tiny side tuft tied with a small orange hair tie, big warm brown eyes, a plain yellow T-shirt.'
SAYOKO = 'Sayoko, a graceful 16-year-old girl of the Taisho era with long straight black hair half-up with a small silver crescent moon hairpin, blunt bangs, large dark eyes with a soft reddish-brown tint, a deep indigo yukata with white bellflowers and a crimson obi.'
section('I. みお・小夜子の表情', '今の立ち絵は、みおは笑顔、小夜子は微笑みの1枚だけで、どの場面もその顔で話している。台本で多く使う順に並べた（回数は 1〜4章の台本の数）。毎回、基本の1枚を添付する。気に入らない時は「表情だけもっと強く」などと足して作り直してよい')
MIO_FACES = [
    ('真剣（93回）', 'a serious, determined look, eyebrows drawn together, mouth set firmly', 'mio_serious.png'),
    ('驚き（90回）', 'a surprised look, eyes wide open, mouth open in a small "oh"', 'mio_surprised.png'),
    ('考える（44回）', 'a thinking look, eyes glancing up to the side, lips slightly pursed', 'mio_thinking.png'),
    ('心配（28回）', 'a worried look, eyebrows raised in the middle, looking up anxiously', 'mio_worried.png'),
    ('大笑い（25回）', 'laughing out loud with her eyes squeezed shut and mouth wide open, showing her small snaggletooth', 'mio_laugh.png'),
    ('むっ（22回）', 'a pouting, sulky look, cheeks puffed out, lips pushed forward', 'mio_pout.png'),
    ('悔しい（18回）', 'a frustrated look, biting her lower lip, eyes watery but holding back tears, fists clenched below the frame', 'mio_frustrated.png'),
    ('困り笑い（10回）', 'an awkward, embarrassed smile, eyebrows lowered, as if apologizing', 'mio_wry.png'),
    ('照れ（8回）', 'a shy, blushing look, cheeks red, eyes looking away, a small bashful smile', 'mio_shy.png'),
    ('泣き笑い（3回）', 'smiling through tears, tears running down her cheeks but a brave grin', 'mio_teary.png'),
]
for label, face, save in MIO_FACES:
    add(f'みお：{label}', [P + 'mio_smile.webp'], save, expression(face, MIO, child=True))
SAYOKO_FACES = [
    ('考える（41回）', 'a thoughtful look, eyes lowered slightly to the side, one corner of her lips pressed in', 'sayoko_thinking.png'),
    ('驚き（22回）', 'a surprised look, eyes wide open, lips parted, a hint of curious delight', 'sayoko_surprised.png'),
    ('笑顔（21回）', 'a bright, open, happy smile, eyes curved into crescents', 'sayoko_laugh.png'),
    ('真剣（20回）', 'a serious, resolute look, calm but firm eyes, mouth closed', 'sayoko_serious.png'),
    ('通常（8回）', 'a calm, neutral expression with a composed, polite face, mouth closed', 'sayoko_normal.png'),
    ('照れ（7回）', 'a shy, blushing look, cheeks pink, eyes cast down, a small embarrassed smile', 'sayoko_shy.png'),
    ('さみしげ（5回）', 'a quiet, lonely smile, eyes a little sad and distant', 'sayoko_lonely.png'),
    ('泣き笑い（2回）', 'smiling through tears, tears on her cheeks, a gentle accepting smile', 'sayoko_teary.png'),
]
for label, face, save in SAYOKO_FACES:
    add(f'小夜子：{label}', [P + 'sayoko_smile.webp'], save, expression(face, SAYOKO))

section('J. 4-1「シロのいた夏」の人', '今は色の札で出している3人（`docs/script/4-1.md` の 2.）。まず基本の1枚（通常）を作り、できた絵を添付して表情違いを作る。写しの2人はゲームの中でセピアに色を付けるので、ふつうの色で作る')
TAICHI = 'Taichi, a 16-year-old Japanese boy, a first-year student at the same high school as the boy in the attached portrait, who quit the track team this summer. Slim, athletic build, short black hair a little grown out, sharp but tired eyes, a blunt, guarded face. The same school uniform as the attached portrait of the boy (white collared shirt and a mustard-yellow tie), but instead of his hoodie, a plain navy track jacket left open, a leftover from the track team. No letters or logos.'
add('たいち（今16歳。高校1年）：通常', [REF_TEEN, P + 'hero_normal.webp'], 'taichi_normal.png',
    portrait('a guarded, blunt neutral look, mouth closed', 'Character: ' + TAICHI), '一番先に作る。下の表情違いは、この絵を添付する')
TAICHI_KEEP = 'Taichi, a 16-year-old boy with short black hair a little grown out, sharp but tired eyes, a white collared shirt with a mustard-yellow tie and an open plain navy track jacket.'
for label, face, save in [
    ('不機嫌', 'a sullen, annoyed look, eyebrows drawn down, looking slightly away', 'taichi_sullen.png'),
    ('泣きそう', 'on the verge of tears, eyes glistening, lips pressed together, trying hard not to cry', 'taichi_tearful.png'),
    ('考える', 'a thinking look, eyes lowered, as if trying to remember something', 'taichi_thinking.png'),
    ('驚き', 'a surprised look, eyes wide open', 'taichi_surprised.png'),
    ('笑顔', 'a small, awkward but genuine smile, the first in a long time', 'taichi_smile.png'),
]:
    add(f'たいち：{label}', ['taichi_normal.png（上で作った絵）'], save, expression(face, TAICHI_KEEP))
PAST_TAICHI = 'Young Taichi, the same boy as the attached portrait of the teenager but six years earlier: a 10-year-old Japanese boy spending the summer of 2018 at his grandfather\'s house in the countryside. Keep the same face features so he is clearly the same person. Sun-tanned skin, short black hair, a big straw hat, a plain white T-shirt, a cheap child\'s digital wristwatch hanging from his neck on a cord.'
add('写しのたいち（平成30年の夏、10歳）：通常', [REF_CHILD, 'taichi_normal.png（上で作った絵）'], 'past_taichi_normal.png',
    portrait('a plain, quiet look, mouth closed', 'Character: ' + PAST_TAICHI, child=True), '下の表情違いは、この絵を添付する')
PAST_TAICHI_KEEP = 'young Taichi, a sun-tanned 10-year-old boy with short black hair, a big straw hat, a plain white T-shirt and a child\'s digital wristwatch hanging from his neck on a cord.'
for label, face, save in [
    ('笑顔', 'a big, happy, sunny grin', 'past_taichi_smile.png'),
    ('泣きそう', 'on the verge of tears, eyes glistening, lips trembling', 'past_taichi_tearful.png'),
    ('真剣', 'a serious, determined look, jaw set, eyes fixed forward', 'past_taichi_serious.png'),
    ('怒り', 'shouting in anger, eyebrows sharply drawn, mouth open, red-faced', 'past_taichi_angry.png'),
    ('驚き', 'a surprised look, eyes wide open, mouth open', 'past_taichi_surprised.png'),
    ('不機嫌', 'a sulky, stubborn look, lower lip pushed out', 'past_taichi_sullen.png'),
]:
    add(f'写しのたいち：{label}', ['past_taichi_normal.png（上で作った絵）'], save, expression(face, PAST_TAICHI_KEEP, child=True))
GRANDPA = 'Taichi\'s grandfather, a Japanese farmer around 72 in the summer of 2018, living alone in a countryside house. Sun-tanned, deeply wrinkled face, short white hair, thick eyebrows, a few words and gruff manners but kind eyes. A faded straw hat, a white towel around his neck, a light gray work shirt with rolled sleeves.'
add('写しのおじいちゃん（平成30年の夏）：通常', [REF_TEEN], 'past_grandpa_normal.png',
    portrait('a gruff, quiet look, mouth firmly closed', 'Character: ' + GRANDPA), '下の「怒り」は、この絵を添付する')
add('写しのおじいちゃん：怒り', ['past_grandpa_normal.png（上で作った絵）'], 'past_grandpa_angry.png',
    expression('shouting in anger and worry, eyebrows drawn together, mouth open', 'a sun-tanned Japanese farmer around 72 with short white hair, a faded straw hat, a white towel around his neck and a light gray work shirt.'))

section('K. ハルト・あかりの足りない表情', '4-1 の脚本で指定した表情。今はハルトの「困り」、あかりの「悲しい」で代わりにしている。届いたら脚本どおりに戻す')
add('ハルト：考える', [P + 'hero_normal.webp'], 'hero_thinking.png',
    expression('a thinking look, eyes lowered to the side, brow slightly furrowed, mouth closed', 'Haruto, the boy in the attached portrait, in his school uniform.'))
add('あかり：泣きそう', [P + 'akari_smile.webp'], 'akari_tearful.png',
    expression('on the verge of tears, eyes glistening with tears not yet falling, lips pressed together', 'Akari, the girl in the cardigan in the attached portrait.'))



# ---- L. 拠点のタイル（段階142。2026-10-30） ----


def tile(scene):
    return f'''{STYLE}

A menu tile illustration for the hub screen of a mobile RPG, shown like a framed painting in a dark memory gallery. Horizontal 3:2 image (1536×1024).
The main subject sits in the center of the image; the edges are simple, because the image will be cropped to a wide strip or to a square. Keep the bottom quarter darker and simple, because a white label will be placed over it.
Rich, glowing light against deep shadows, so the tile stands out on a near-black screen.
{scene}
Absolutely no letters, numbers or text anywhere.'''


LIB = 'public/assets/backgrounds/library.webp'
section('L. 拠点のタイル（思い出のギャラリー）', '段階142。拠点（レストピア）のメニューを、1枚絵のタイルにするための絵（`docs/ART.md` の 5-9）。開発者が「タイルの絵は新調したい」と言った（2026-10-30）。横 3:2 で作り、ゲームの中で横長や正方形に切り抜く。真ん中に大事な物を置き、下の4分の1は名前の文字が乗るので暗くすっきりさせる。蔵書の棚の背景を絵柄の見本に付ける。届くまでは、今までの1枚絵と背景で代わりに出す')
add('タイル：記憶をたどる', [LIB, P + 'hero_smile.webp', P + 'akari_smile.webp'], 'tile_hunt.png', tile(
    'Restopia, a vast library of memories where stolen happy hours are kept as glowing hourglasses on endless shelves. Seen from behind, a high school boy and a girl in a cardigan (keep their designs as in the attached portraits) walk toward a tall archway of swirling golden sand; through the archway, a faint, dreamlike summer festival night with lanterns and fireworks is visible, as if they are stepping back into a memory.'))
add('タイル：星図', [LIB], 'tile_growth.png', tile(
    'A deep indigo night sky full of stars above the library of memories. Several stars are linked by thin glowing golden lines into a constellation, and in the center stands a large antique hourglass whose falling sand glitters like stardust, slowly spilling up into the sky to become new stars.'))
add('タイル：武器', [LIB], 'tile_weapon.png', tile(
    'A single slender sword rests on dark crimson velvet in the library of memories, its blade faintly glowing with a crimson light, as if remembering the boy who wields it. Behind it, faint silver octagonal emblems linked by thin crimson lines float in the dark like a family tree. Floating grains of golden sand.'))
add('タイル：ムーブメント', [LIB], 'tile_navi.png', tile(
    'A close-up of the open back of an antique pocket watch: the beautiful clockwork movement with interlocking gears made of four metals (copper, blued steel, green bronze and yellow brass), tiny red ruby jewels, blued screws, and a golden balance wheel in motion. Warm light catching the metal edges, dark velvet around the watch.'))
add('タイル：アルバム', [LIB], 'tile_album.png', tile(
    'An open old photo album on a dark wooden desk, lit by a warm desk lamp. Several slightly faded instant photos are taped onto cream-colored pages; the photos show only soft blurry colors of everyday moments (a festival night, a riverside sunset, a classroom), with no clear faces. A few loose photos and a roll of masking tape beside the album.'))
add('タイル：並び', [LIB], 'tile_party.png', tile(
    'Hands of several people of different ages placed together one on top of another in the center, as a promise before setting out together, seen from above; soft golden light and drifting sand around them. Only hands and sleeves are visible, no faces.'))
add('タイル：交換所', [LIB, P + 'petra_normal.webp'], 'tile_exchange.png', tile(
    'A neat exchange counter tucked between the bookshelves of the library of memories: a brass balance scale, glass jars of glowing sand and small crystal memory fragments, a thick ledger and a rubber stamp, arranged in perfect order. Behind the counter, the clerk in the attached portrait is seen small and from the side, adjusting her glasses while checking the ledger.'))
add('タイル：落とし物の棚', [LIB], 'tile_lost.png', tile(
    'A small wooden shelf of lost things in a quiet corner of the library of memories, each item with a little paper tag tied by string (the tags are blank): a child\'s straw hat, a red umbrella, a wind-up tin toy, a music box, a single glove, an old cassette tape. A soft golden glow on each item, as if waiting for its owner.'))
add('タイル：町の小話', [], 'tile_talks.png', tile(
    'A small Japanese shopping street at dusk seen from a little distance: paper lanterns and shop lights coming on, a few townspeople chatting in front of a bakery and a candy shop, a cat on a bench, warm windows. A peaceful, everyday evening; people are small and seen from the side or behind.'))


def main():
    out = ['# 絵の「そのまま貼る一覧」（2026-10-25）', '',
           'ChatGPT Plus で、待っている絵をまとめて作るための一覧。**1つの枠が1枚**。上から順に作る。',
           '',
           '- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）',
           '- できた絵は「保存名」の名前で保存して、まとめて Claude に送る。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする',
           '- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい',
           '- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる',
           '- まだ一覧にない物：ひなののまばたき・口パク（Gemini。ART.md の 5-8 の 1）、昼の町の地図と2頭身の歩くハルト・カイ（5-8 の 2〜4）、ほかの人の表情違い（5-3 の 14。みお・小夜子・ハルト・あかりと 4-1 の人は下の I〜K）',
           '']
    n = 0
    toc = []
    body = []
    for title, note, items in ITEMS:
        done = sum(1 for it in items if it[2] in DONE)
        toc.append(f'- {title}（{len(items)}枚' + (f'。済 {done}' if done else '') + '）')
        body += [f'## {title}', '']
        if note:
            body += [note, '']
        for name, attach, save, prompt, memo in items:
            n += 1
            body += [f'### {n}. {name}' + ('（済）' if save in DONE else ''), '']
            body.append(f'- 添付：{"、".join(f"`{a}`" for a in attach) if attach else "なし"}')
            body.append(f'- 保存名：`{save}`')
            if memo:
                body.append(f'- メモ：{memo}')
            body += ['', '```', prompt, '```', '']
    out += [f'全部で {n} 枚。', ''] + toc + [''] + body
    with open('docs/ART_QUEUE.md', 'w') as f:
        f.write('\n'.join(out))
    print(f'docs/ART_QUEUE.md：{n} 枚')


if __name__ == '__main__':
    main()
