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
DONE = {'ground_fest2_backyard.png', 'parts_backyard1.png', 'parts_backyard2.png', 'a11_props1.png', 'a11_props2.png', 'a11_props3.png', 'a11_torii.png', 'map_fest2_gate.png', 'map_fest2_woods.png', 'map_fest2_backyard.png', 'map_fest2_lane.png', 'map_fest2_east.png', 'walk_hero.png', 'walk_akari.png', 'walk_mio.png', 'walk_sayoko.png', 'walk_hayase.png', 'dig_hero.png', 'dig_akari.png', 'dig_mio.png', 'dig_sayoko.png', 'dig_hayase.png', 'sayoko_sheet.png', 'sayoko_smile.png', 'chiyo_smile.png', 'noboru_smile.png', 'past_chiyo_smile.png', 'past_kiku_normal.png', 'past_noboru_smile.png', 'shiori_smile.png', 'toya_smile.png', 'past_shiori_smile.png', 'past_toya_smile.png', 'past_koji_normal.png', 'past_masaru_smile.png', 'masaru_smile.png', 'sumi_smile.png', 'past_sumi_smile.png', 'daichi_smile.png', 'saki_smile.png', 'gear_noise.png', 'screw_noise.png', 'tube_noise.png', 'abacus_noise.png', 'lathe_boss.png', 'flip_phone_noise.png', 'sticker_noise.png', 'boombox_noise.png', 'metronome_noise.png', 'amp_boss.png', 'ball_noise.png', 'pet_noise.png', 'megaphone_noise.png', 'jug_noise.png', 'scoreboard_boss.png', 'fan_noise.png', 'coil_noise.png', 'radio_noise.png', 'table_noise.png', 'postbox_noise.png', 'train_boss.png', 'lantern_noise.png', 'pinwheel_noise.png', 'candy_noise.png', 'phonograph_noise.png', 'yagura_boss.png', 'earphone_noise.png', 'selfie_noise.png', 'tapioca_noise.png', 'diploma_noise.png', 'yosegaki_noise.png', 'crossing_boss.png', 'map_fest_woods.png', 'map_fest_backyard.png', 'map_fest_east.png', 'map_fest_west.png', 'map_fest_gate.png', 'map_showa_alley.png', 'map_showa_lane.png', 'map_showa_hill.png', 'map_school_courtyard.png', 'map_school_bikes.png', 'map_school_classroom.png', 'map_school_corridor.png', 'map_school_gym.png', 'map_riverside_levee.png', 'map_riverside_bank.png', 'map_riverside_bench.png', 'map_riverside_diamond.png', 'map_riverside_shed.png', 'map_riverside_stand.png', 'map_archive_corridor.png', 'map_archive_reading.png', 'map_archive_vault.png', 'map_archive_stacks.png', 'map_village_station.png', 'map_village_paddy.png', 'map_village_shrine.png', 'map_village_house.png', 'map_village_river.png', 'map_village_platform.png', 'map_grad_slope.png', 'map_grad_gym_back.png', 'map_grad_street.png', 'map_grad_levee.png', 'map_grad_crossing.png', 'map_matsuri_torii.png', 'map_matsuri_stalls.png', 'map_matsuri_yagura.png', 'map_matsuri_edge.png', 'bg_home_tv_dark.png', 'bg_school_festival.png', 'bg_village_1966.png', 'bg_village_dusk.png', 'bg_care_home.png', 'bg_care_home_rain.png', 'bg_station_now.png', 'bg_school_fair.png', 'bg_taisho_festival.png', 'bg_taisho_edge.png', 'bg_shrine_now.png', 'bg_grad_2019.png', 'bg_grad_dusk.png', 'bg_crossing_now.png', 'cg_pinch_hit.png', 'snap_sword.png', 'snap_heavyBlow.png', 'snap_iceChip.png', 'snap_thunderChip.png', 'snap_wideShot.png', 'snap_recover.png', 'snap_quickStep.png', 'snap_search.png', 'snap_breakArm.png', 'snap_draw.png', 'snap_joker.png', 'snap_encore.png', 'snap_pinchHitter.png', 'snap_fireChip.png', 'mio_serious.png', 'mio_surprised.png', 'mio_thinking.png', 'mio_worried.png', 'mio_laugh.png', 'mio_pout.png', 'mio_frustrated.png', 'mio_wry.png', 'mio_shy.png', 'mio_teary.png', 'sayoko_thinking.png', 'sayoko_surprised.png', 'sayoko_serious.png', 'sayoko_laugh.png', 'sayoko_normal.png', 'sayoko_shy.png', 'sayoko_lonely.png', 'sayoko_teary.png', 'akari_tearful.png', 'hero_thinking.png', 'hayase_sheet.png', 'hayase_sheet_draft.png', 'tile_hunt.png', 'tile_growth.png', 'tile_weapon.png', 'tile_navi.png', 'tile_album.png', 'tile_party.png', 'tile_exchange.png', 'tile_lost.png', 'tile_talks.png', 'mio_blink_src_smile.png', 'mio_blink_src_serious.png', 'mio_blink_src_surprised.png', 'mio_blink_src_thinking.png', 'mio_blink_src_worried.png', 'mio_blink_src_pout.png', 'mio_blink_src_frustrated.png', 'mio_blink_src_wry.png', 'mio_blink_src_shy.png', 'mio_blink_src_teary.png', 'map_school_gate.png', 'taichi_normal.png', 'taichi_sullen.png', 'taichi_tearful.png', 'taichi_thinking.png', 'taichi_surprised.png', 'taichi_smile.png', 'past_taichi_normal.png', 'past_taichi_smile.png', 'past_taichi_tearful.png', 'past_taichi_serious.png', 'past_taichi_angry.png', 'past_taichi_surprised.png', 'past_taichi_sullen.png', 'past_grandpa_normal.png', 'past_grandpa_angry.png', 'hayase_normal.png', 'hayase_thinking.png', 'hayase_wry.png', 'hayase_surprised.png', 'hayase_angry.png', 'hayase_teary.png', 'bugcage_noise.png', 'watermelon_noise.png', 'firework_noise.png', 'watergun_noise.png', 'jizo_noise.png', 'river_boss.png', 'yoyo_noise.png', 'pager_noise.png', 'paperballoon_noise.png', 'cuckoo_noise.png', 'wreath_noise.png', 'shutter_boss.png', 'map_summer_garden.png', 'map_summer_shed.png', 'map_summer_ridge.png', 'map_summer_canal.png', 'map_summer_shallows.png', 'map_opening_shop.png', 'goro_smile.png', 'zenji_smile.png', 'tome_smile.png', 'tile_side_tall.png', 'daichi_smile_v2.png', 'saki_smile_v2.png', 'sayoko_western_shy.png', 'sayoko_western_surprised.png', 'sayoko_western_smile.png', 'toya_blink_src.png', 'toya_talk_src.png', 'shiori_blink_src.png', 'shiori_talk_src.png', 'snap_digZanzo.png', 'snap_digUtakata.png', 'snap_digKaiso.png', 'goro_troubled.png', 'goro_surprised.png', 'goro_shy.png', 'goro_teary.png', 'zenji_shy.png', 'zenji_surprised.png', 'tome_gentle.png', 'tome_troubled.png', 'tome_surprised.png', 'zenji_gentle.png', 'past_jin_normal.png', 'past_shizue_smile.png', 'past_toshio_normal.png', 'past_jin_surprised.png', 'past_jin_serious.png', 'past_jin_troubled.png', 'past_shizue_surprised.png', 'past_shizue_laugh.png', 'past_shizue_thinking.png', 'past_shizue_gentle.png', 'past_shizue_teary.png', 'past_shizue_shy.png', 'past_shizue_awkward.png', 'hayase_blink_src_normal.png', 'hayase_blink_src_thinking.png', 'hayase_blink_src_wry.png', 'hayase_blink_src_surprised.png', 'hayase_blink_src_angry.png', 'hayase_blink_src_teary.png', 'hayase_talk_src_normal.png', 'hayase_talk_src_thinking.png', 'hayase_talk_src_wry.png', 'isamu_smile.png', 'isamu_lonely.png', 'isamu_thinking.png', 'isamu_surprised.png', 'isamu_teary.png', 'petra_serious.png', 'petra_troubled.png', 'petra_surprised.png', 'petra_smile.png', 'shiori_normal.png', 'shiori_awkward.png', 'shiori_surprised.png', 'shiori_thinking.png', 'shiori_wry.png', 'shiori_gentle.png', 'shiori_lonely.png', 'shiori_laugh.png', 'shiori_troubled.png', 'shiori_flustered.png', 'koji_wry.png', 'koji_thinking.png', 'koji_lonely.png', 'koji_normal.png', 'koji_surprised.png', 'chiyo_gentle.png', 'chiyo_normal.png', 'chiyo_lonely.png', 'chiyo_thinking.png', 'chiyo_surprised.png', 'chiyo_wry.png', 'chiyo_sad.png', 'chiyo_teary.png', 'chiyo_serious.png', 'kenta_wry.png', 'kenta_lonely.png', 'kenta_thinking.png', 'kenta_shy.png', 'kenta_surprised.png', 'kenta_teary.png', 'kenta_laugh.png', 'kai_normal.png', 'kai_scornful.png', 'past_toya_normal.png', 'past_chiyo_normal.png', 'past_chiyo_crying.png', 'past_chiyo_pout.png', 'past_chiyo_serious.png', 'past_chiyo_surprised.png', 'past_kiku_teary.png', 'past_shiori_normal.png', 'past_shiori_pout.png', 'past_shiori_serious.png', 'past_kenta_teary.png', 'masaru_normal.png', 'masaru_wry.png', 'masaru_surprised.png', 'masaru_lonely.png', 'noboru_normal.png', 'noboru_thinking.png', 'noboru_lonely.png', 'noboru_awkward.png', 'noboru_wry.png', 'noboru_shy.png', 'noboru_surprised.png', 'toya_normal.png', 'toya_surprised.png', 'toya_awkward.png', 'toya_thinking.png', 'toya_wry.png', 'toya_gentle.png', 'toya_serious.png', 'toya_laugh.png', 'past_koji_surprised.png', 'past_koji_teary.png', 'hinano_lonely.png', 'hinano_surprised.png', 'hinano_pout.png', 'hinano_troubled.png', 'hinano_gentle.png', 'sumi_lonely.png', 'sumi_thinking.png', 'sumi_surprised.png', 'sumi_normal.png', 'shigeru_normal.png', 'shigeru_lonely.png', 'shigeru_surprised.png', 'shigeru_wry.png', 'shigeru_thinking.png', 'saki_surprised.png', 'saki_thinking.png', 'saki_lonely.png', 'saki_wry.png', 'saki_gentle.png', 'past_isamu_teary.png', 'isamu_blink_src.png', 'isamu_talk_src.png', 'petra_blink_src.png', 'petra_talk_src.png', 'koji_blink_src.png', 'koji_talk_src.png', 'chiyo_blink_src.png', 'chiyo_talk_src.png', 'kai_talk_src.png', 'taichi_blink_src.png', 'taichi_talk_src.png', 'past_toya_blink_src.png', 'past_toya_talk_src.png', 'past_chiyo_blink_src.png', 'past_chiyo_talk_src.png', 'past_kiku_blink_src.png', 'past_kiku_talk_src.png', 'past_shiori_blink_src.png', 'past_kenta_blink_src.png', 'saki_blink_src.png', 'saki_talk_src.png', 'past_kenta_talk_src.png', 'masaru_blink_src.png', 'masaru_talk_src.png', 'noboru_blink_src.png', 'noboru_talk_src.png', 'past_taichi_blink_src.png', 'past_taichi_talk_src.png', 'past_masaru_blink_src.png', 'past_koji_blink_src.png', 'past_koji_talk_src.png', 'hinano_blink_src.png', 'hinano_talk_src.png', 'noa_blink_src.png', 'noa_talk_src.png', 'sumi_blink_src.png', 'sumi_talk_src.png', 'shigeru_blink_src.png', 'shigeru_talk_src.png', 'past_genzo_blink_src.png', 'past_genzo_talk_src.png'}


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
    ('千代（今75歳。ひだまり荘）', 'a gentle, refined smile', 'Character: Chiyo, a 75-year-old Japanese woman living in a small care home in a quiet regional town. Elegant and polite, a warm but slightly lonely smile. Short soft white hair neatly permed, small gold-rimmed glasses, a pale lavender knitted cardigan over a cream blouse, a thin silver chain. She once worked in a Tokyo electronics factory at fifteen; her hands are small and careful.', False, 'chiyo_smile.png'),
    ('昇平（今68歳。千代の弟）', 'an easygoing, warm grin', 'Character: Noboru, a 68-year-old Japanese man from a mountain farming village, Chiyo\'s younger brother, visiting the town. Sun-tanned, weathered face, short gray crew-cut hair, kind crinkled eyes, a slightly gap-toothed grin. A faded checked work shirt with rolled sleeves under a plain gray vest. Laid-back and unhurried, a simple countryman.', False, 'noboru_smile.png'),
    ('写しの千代（昭和41年、15歳）', 'a bright, slightly forced cheerful smile', 'Character: young Chiyo, a 15-year-old Japanese girl in the summer of 1966, coming home to her mountain village for the first time after starting factory work in Tokyo. Keep a face that could grow into a gentle, refined old woman. Black hair in two short braids, a crisp white short-sleeve blouse, a navy skirt. She acts cheerful and grown-up, but her eyes are a little homesick.', False, 'past_chiyo_smile.png'),
    ('写しの菊（千代と昇平の母。昭和41年、40歳くらい）', 'a calm, quiet expression with her mouth firmly closed', 'Character: Kiku, a Japanese farming woman around 40 in the summer of 1966, a widow who works her mountain fields alone. Sun-tanned skin, strong hands, black hair tied back tightly under a faded indigo cotton head scarf (tenugui), a dark indigo work kimono top with tied-back sleeves. Few words and blunt manners, but deep, steady eyes that care.', False, 'past_kiku_normal.png'),
    ('写しの昇平（昭和41年、8歳）', 'a huge excited grin', 'Character: young Noboru, an 8-year-old Japanese village boy in the summer of 1966, overjoyed that his big sister is coming home. Very short buzz-cut black hair, sun-tanned skin, a scraped nose, a plain white sleeveless undershirt (running shirt) and a straw hat hanging on his back.', True, 'past_noboru_smile.png'),
    ('しおり（今22歳。印刷会社の一年目）', 'a bright, slightly flustered smile', 'Character: Shiori, a 22-year-old Japanese woman in her first year at a small local printing company in a quiet regional town. Short neat dark-brown bob with one side tucked behind her ear, lively eyes, a talkative, quick face. A light beige cardigan over a white collared blouse, a plain staff lanyard (blank card, no letters).', False, 'shiori_smile.png'),
    ('とうや（今22歳。鉄道の保線の仕事）', 'a calm, easygoing smile', 'Character: Toya, a 22-year-old Japanese man who works on railway track maintenance. Slightly messy black hair, sleepy relaxed eyes, a gentle, laid-back face. A dark navy work jacket with a reflective stripe over a gray T-shirt, no logos. The kind of person who listens to the end before he speaks.', False, 'toya_smile.png'),
    ('写しのしおり（平成31年3月、15歳）', 'a teasing smile, trying to hide that she is embarrassed', 'Character: young Shiori, a 15-year-old Japanese middle school girl on her graduation day in March 2019, the same person as the 22-year-old office worker. Short dark-brown hair, a navy sailor-style school uniform with a red scarf, a small corsage of paper flowers with a ribbon pinned on her chest (graduation). Sharp-tongued to hide her shyness.', False, 'past_shiori_smile.png'),
    ('写しのとうや（平成31年3月、15歳）', 'a soft, easygoing smile', 'Character: young Toya, a 15-year-old Japanese middle school boy on his graduation day in March 2019. Slightly messy black hair, relaxed eyes. A black gakuran school uniform whose buttons were almost all taken by younger students as keepsakes; only the second button from the top is still there. A corsage of paper flowers on his chest, one white earbud cable hanging from his collar.', False, 'past_toya_smile.png'),
]
for name, face, body, child, save in B:
    add(name, [REF_CHILD if child else REF_TEEN], save, portrait(face, body, child))

# ---- C. 2章の残りの人 ----
section('C. 2章の残りの人', '写しの浩二・写しの正雄は、浩二の立ち絵も添付する（顔を似せるため）')
C = [
    ('写しの浩二（平成10年、12歳）', [REF_CHILD, P + 'koji_smile.webp'], 'past_koji_normal.png', 'a nervous, unsure face, biting his lip', 'Character: young Koji, the same man as the attached adult portrait but 28 years earlier: a 12-year-old boy on a little league baseball team in the summer of 1998, always on the bench. Keep the same face features so he is clearly the same person. Short black hair, a slightly dirty white baseball uniform with navy trim that is a little too big for him, a baseball cap. No letters or numbers on the uniform or cap.', True),
    ('写しの正雄（平成10年、40代。浩二の父）', [REF_TEEN, P + 'koji_smile.webp'], 'past_masaru_smile.png', 'a big, warm, proud smile', 'Character: Masaru, Koji\'s father, a Japanese man in his 40s in the summer of 1998, a cheerful working dad watching his son\'s little league game. A face that resembles the attached portrait (his son as an adult), sun-tanned skin, short black hair, a faded polo shirt with a towel around his neck. No letters or logos.', False),
    ('正雄（今70歳くらい。浩二の父）', [REF_TEEN, 'past_masaru_smile.png（上で作った絵）'], 'masaru_smile.png', 'a loud, cheerful grin', 'Character: Masaru, the same man as the attached portrait but about 28 years later: a Japanese man around 70, retired, who still comes to the riverside little league field every day with a plastic megaphone. Keep the same face features so he is clearly the same person. Short white hair, deep laugh lines, sun-tanned skin, a faded baseball cap pushed back, a light windbreaker. No letters or logos.', False),
    ('寿美（今77歳。銭湯「松の湯」の女将）', [REF_TEEN], 'sumi_smile.png', 'a warm, cheerful smile', 'Character: Sumi, a 77-year-old Japanese woman who runs an old public bathhouse in a quiet regional town. Small and spry, gray hair tied in a low bun with a white hand towel (tenugui) over it, a white kappogi apron-smock over a dark kimono, bright energetic eyes.', False),
    ('写しの寿美（昭和44年、22歳。番台の娘）', [REF_TEEN, 'sumi_smile.png（上で作った絵）'], 'past_sumi_smile.png', 'a bright, lively smile', 'Character: young Sumi, the same woman as the attached portrait but 57 years earlier: a 22-year-old daughter of a public bathhouse in the winter of 1969. Keep the same face features so she is clearly the same person. Black hair tied back under a white hand towel, rosy cheeks from the cold, a simple striped kimono with a dark half-coat (hanten).', False),
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
    'A close-up of many old-fashioned thick cardboard train tickets on a dark wooden desk, spread out in a loose fan and overlapping so much that it is impossible to count them. A few of the tickets glow with a soft warm golden light, as if they have just been chosen; the others are faded and dim. Drifting grains of golden sand in the lamplight. No people, no hands.').replace('Absolutely no letters, numbers or text anywhere.', 'Absolutely no letters, numbers or text anywhere: the tickets are blank, with only simple border patterns.'),
    'ネタバレを避けるため、人・手・服を描かない（2026-10-31 開発者の指摘：手の数や服装で仲間の人数や顔ぶれが分かる。いくつかの案から、開発者が「重なった古い切符」を選んだ）')
add('タイル：交換所', [LIB, P + 'petra_normal.webp'], 'tile_exchange.png', tile(
    'A neat exchange counter tucked between the bookshelves of the library of memories: a brass balance scale, glass jars of glowing sand and small crystal memory fragments, a thick ledger and a rubber stamp, arranged in perfect order. Behind the counter, the clerk in the attached portrait is seen small and from the side, adjusting her glasses while checking the ledger.'))
add('タイル：落とし物の棚', [LIB], 'tile_lost.png', tile(
    'A small wooden shelf of lost things in a quiet corner of the library of memories, each item with a little paper tag tied by string (the tags are blank): a child\'s straw hat, a red umbrella, a wind-up tin toy, a music box, a single glove, an old cassette tape. A soft golden glow on each item, as if waiting for its owner.'))
add('タイル：町の小話', [], 'tile_talks.png', tile(
    'A small Japanese shopping street at dusk seen from a little distance: paper lanterns and shop lights coming on, a few townspeople chatting in front of a bakery and a candy shop, a cat on a bench, warm windows. A peaceful, everyday evening; people are small and seen from the side or behind.'))



# ---- M. みおの目を閉じた絵（2026-10-31） ----
def close_eyes(face):
    return f'''Edit the attached image. Keep everything exactly the same: the same character, the same {face} expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only her eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.'''


section('M. みおの目を閉じた絵（まばたき用）', 'みおの表情は1枚ずつ別に作ったので、顔の傾きや大きさが表情ごとに違う。別の表情の閉じた目を重ねると顔がゆがんだ（2026-10-31 開発者の指摘）。そこで、表情の絵をそのまま直して目だけ閉じた絵を作る。毎回その表情の絵を添付する（ChatGPT でも Gemini でもよい。構図が少しでも動いたら作り直す）。台本で多く使う順')
for label, face, src in [('笑顔', 'wide confident grin', 'smile'), ('真剣', 'serious, determined', 'serious'), ('驚き', 'surprised, mouth open', 'surprised'), ('考える', 'thinking', 'thinking'), ('心配', 'worried', 'worried'), ('むっ', 'pouting, cheeks puffed', 'pout'), ('悔しい', 'frustrated, biting her lip', 'frustrated'), ('困り笑い', 'awkward smile', 'wry'), ('照れ', 'shy, blushing', 'shy'), ('泣き笑い', 'smiling through tears', 'teary')]:
    add(f'みお：{label}（目を閉じた絵）', [P + f'mio_{src}.webp'], f'mio_blink_src_{src}.png', close_eyes(face))



# ---- N〜P. 4章（2026-11-04）：早瀬、4-1・4-2 の敵、4-1・4-2 の部屋の地図 ----
section('N. 早瀬（仲間）', '4-2 で仲間に加わる時計屋の店長（`docs/script/4-2.md` の 2.：無口で皮肉屋、ルーペ、作業着）。見た目はたたき台。2026-11-04 開発者の指摘「おじいさん過ぎる。50代のダンディな感じ」で、今58歳にし（段階149）、白髪まじりのダンディに直した。設定画を見て決めてから、胸から上の1枚と表情違いを作る。絵柄と構図の見本はハルトの立ち絵（お年寄りの絵を見本にすると、老けて出たため）')
HAYASE = ('Character: Jin Hayase, the owner of a small old watch and clock repair shop in a Japanese shopping street. A man of few words, gruff and sarcastic, but quietly kind. '
          'A dandy, handsome man in his late fifties: tall, lean and fit, straight confident posture, broad shoulders, the calm sharp presence of a veteran craftsman who can still move fast in a fight. '
          'Dark hair with streaks of grey at the temples, swept back with a few loose strands, a neatly trimmed short salt-and-pepper beard, sharp narrow eyes with a hint of a smirk, a few handsome lines around his eyes. '
          'A watchmaker\'s loupe pushed up on his forehead. A dark navy work jacket worn open over a black henley shirt, sleeves rolled up to show strong forearms, a leather tool roll of tiny screwdrivers on his belt.')
add('早瀬の設定画', [P + 'hero_normal.webp'], 'hayase_sheet.png', f'''{STYLE}

Character design sheet of an original anime-style dandy man in his late fifties for a mobile turn-based JRPG, full body front view, standing in a confident pose, plain off-white background, clean lineart with soft cel shading. Same art style as the attached reference portrait.
{HAYASE}''', 'たたき台。気に入らない所（髪・服・小物）は「ここを直して」と足して作り直してよい')
add('早瀬の設定画（1枚目を直す）', ['hayase_sheet_draft.png（1枚目にできた設定画）'], 'hayase_sheet.png', '''Edit the attached character design sheet. Keep the same character, the same age (late fifties), the same tall, lean and fit build, the same clothes and colors (the open navy work jacket with rolled-up sleeves, the dark henley shirt, the brown leather belt and tool roll of tiny screwdrivers, the pocket watch chain, the brown boots), the same art style and the same plain background. Change only the following:
1. Expression: a gruff, closed-mouth, slightly grumpy neutral face. A man of few words who does not smile at strangers. At most, one corner of his mouth is raised a little in a dry, sarcastic way. Eyes calm and sharp, not narrowed in a smile.
2. Pose: a natural, unposed stance with his weight on both feet. One hand holds a small precision screwdriver loosely at his side, the other hand hangs relaxed. No hands in pockets, no model-like pose.
3. Hair and beard: a little more rumpled and lived-in, as if he hasn't looked in a mirror today. Rough salt-and-pepper stubble instead of a neatly groomed beard. He is a widower who has run his shop alone for years, so he looks a little tired and lonely, but still handsome.
4. Loupe: remove the strap around his head. Instead, a small cylindrical watchmaker's eye loupe (a single short tube lens) is pushed up and resting on his forehead, held by nothing.''', '開発者の指摘（2026-11-04）：1枚目は愛想がよすぎた（脚本の早瀬は無口で皮肉屋、妻を亡くして一人で店を続けてきた人）。服・体つき・年齢は1枚目のまま、表情・立ち方・髪とひげ・ルーペだけ直す。1枚目は hayase_sheet_draft.png として保存して添付')
add('早瀬の胸から上の基本の1枚（通常）', ['docs/sketches/characters/hayase_sheet.webp（決まった設定画。2026-11-04）', P + 'hero_normal.webp'], 'hayase_normal.png',
    portrait('a gruff, calm, cool look, mouth closed', HAYASE.replace('Character: Jin Hayase', 'Character: Hayase') + ' Keep his design exactly as in the attached character sheet.').replace('the girl in the cardigan', 'the boy in the hoodie'),
    '台本で72回（いちばん多い）')
for label, face, save in [
    ('考える（8回）', 'a thinking look, eyes narrowed and lowered, as if examining a tiny watch part', 'hayase_thinking.png'),
    ('苦笑い（5回）', 'a wry, crooked half smile, one corner of his mouth up, eyebrows a little raised', 'hayase_wry.png'),
    ('驚き（2回）', 'a surprised look, eyes opened wide under the thick eyebrows, mouth slightly open', 'hayase_surprised.png'),
    ('怒り（2回）', 'an angry, stern scowl, eyebrows drawn together, mouth pressed in a hard line', 'hayase_angry.png'),
    ('泣き笑い（1回）', 'smiling through tears, eyes wet and crinkled, a gentle trembling smile', 'hayase_teary.png'),
]:
    add(f'早瀬：{label}', ['hayase_normal.png（上で作った絵）'], save, expression(face, 'Hayase, the dandy watchmaker in the attached portrait.'))

section('O. 4章の敵', 'D と同じ形。毎回、ブリキノイズの絵（`public/assets/enemies/tin_noise.webp`）を絵柄の見本として添付する。白い背景のまま送ってくれればよい')
SUMMER = 'bright summer greens, sky blue and sunflower yellow'
OPENING = 'bright late-1990s colors, light blue and orange'
for name, era, body, boss, save in [
    ('4-1 虫かごノイズ', SUMMER, 'a plastic insect cage with a green lid, the buzzing of insects inside shaking it, the lid snapping like a mouth', False, 'bugcage_noise.png'),
    ('4-1 すいかノイズ', SUMMER, 'half of a big watermelon, spitting black seeds like bullets, rolling heavily', False, 'watermelon_noise.png'),
    ('4-1 花火の燃えかすノイズ', SUMMER, 'burnt-out handheld fireworks stuck in a small metal bucket of water, sparks and smoke still drifting from the tips', False, 'firework_noise.png'),
    ('4-1 水鉄砲ノイズ', SUMMER, 'a big pump-action toy water gun, shooting jets of water, quick and light', False, 'watergun_noise.png'),
    ('4-1 お地蔵さまの前の砂嵐（番人）', SUMMER, 'the offerings in front of a small roadside stone Jizo statue: many spinning paper pinwheels and a red bib, swirling into a guardian blocking the path (the stone statue itself stays calm and small at the center, not monstrous)', False, 'jizo_noise.png'),
    ('4-1 川のぬし（ボス）', SUMMER, 'a giant straw hat riding on a rushing river current, water churning beneath it. Two clearly visible parts: the wide brim of the straw hat at the top, and the swirling river current with stones at the bottom', True, 'river_boss.png'),
    ('4-2 ハイパーヨーヨーノイズ', OPENING, 'a glowing toy yo-yo from 1997, spinning endlessly at the end of its stretched string, swinging around in loops and tricks (no logos)', False, 'yoyo_noise.png'),
    ('4-2 ポケベルノイズ', OPENING, 'a cluster of 1990s pagers (pocket bells) beeping nonstop, their tiny screens flashing, glowing beeps flying out like bullets (no letters or numbers on the screens)', False, 'pager_noise.png'),
    ('4-2 紙風船ノイズ', OPENING, 'a cluster of colorful paper balloons given out on a shop opening day, bouncing and drifting lightly', False, 'paperballoon_noise.png'),
    ('4-2 鳩時計ノイズ', OPENING, 'a wooden cuckoo clock whose little bird is stuck outside and keeps calling, its pendulum swinging wildly', False, 'cuckoo_noise.png'),
    ('4-2 開店祝いの花輪ノイズ（番人）', OPENING, 'tall congratulatory flower wreath stands for a shop opening, overlapping again and again into a wall of flowers, petals scattering like a storm (ribbons are blank, no letters)', False, 'wreath_noise.png'),
    ('4-2 シャッターのぬし（ボス）', OPENING, 'dozens of rolling metal shop shutters stacked and overlapping, rattling down again and again. Two clearly visible parts: the stack of metal shutter slats in front, and the winding drum with a big gear at the top', True, 'shutter_boss.png'),
]:
    add(name, ['public/assets/enemies/tin_noise.webp'], save, enemy(era, body, boss))

section('P. 4章の部屋の地図', 'E と同じ形。毎回、その部屋の配置の下絵（`docs/sketches/room_layouts/room_<部屋>.png`）と、絵柄の見本の地図を添付する。4-1 は最初の部屋（庭）の絵ができたら、それを残りの見本にする。4-2 の店内（平成9年の春）は、1-2 の商店街の地図を見本にする')
SUMMER_ROOM = 'in the summer of 2018 (late Heisei era) in the Japanese countryside, bright summer greens, sky blue and sunflower yellow, cicada-filled afternoon'
for name, rid, ref, scene, exits, tall, *closed in [
    ('4-1 おじいちゃんの家の庭', 'summer_garden', M + 'village_paddy.webp', f'Scene: the garden of an old wooden country house {SUMMER_ROOM}. A small vegetable patch and a dog house (two small blocks as in the sketch), a watering can and a hose, morning glories on a bamboo fence, a wooden veranda on the right side. A path leaves through the top edge toward the rice fields, and another through the left edge toward the storage shed.', ['top', 'left'], False),
    ('4-1 物置', 'summer_shed', 'map_summer_garden.png（上で作った絵）', f'Scene: the inside of an old wooden storage shed beside a country house {SUMMER_ROOM}, seen from above with the roof removed. Shelves of old tools, a straw broom, a wooden cart for carrying a dog, boxes of fireworks and bug cages (four small blocks as in the sketch). Dust in the light. The entrance comes in from the right edge.', ['right'], False),
    ('4-1 田んぼのあぜ道', 'summer_ridge', 'map_summer_garden.png', f'Scene: narrow raised paths between green rice paddies {SUMMER_ROOM}. Bright green rice fields fill the dark areas of the sketch; the light areas are the earthen ridge paths winding between them. A small roadside stone Jizo statue with pinwheels near the top. Paths lead out through the bottom edge (to the house), the top edge (to the river) and the left edge (to the irrigation canal).', ['bottom', 'top', 'left'], True, 'rice paddies, trees and hedges'),
    ('4-1 用水路', 'summer_canal', 'map_summer_garden.png', f'Scene: a concrete irrigation canal beside rice fields {SUMMER_ROOM}. A narrow strip of clear running water (the dark vertical strip in the sketch, crossed by two small gaps you can step over) divides two grassy banks. Dragonflies, water plants, a small sluice gate. The entrance comes in from the right edge.', ['right'], False, 'rice paddies, trees and hedges'),
    ('4-1 川の浅瀬', 'summer_shallows', 'map_summer_garden.png', f'Scene: a shallow, sparkling river bank {SUMMER_ROOM}. A wide pebbly shallow where you can wade, with a few large river rocks (the small dark blocks in the sketch), deep water and trees beyond the edges. The path comes in from the bottom edge.', ['bottom'], False, 'deep river water, rocks and trees'),
    ('4-2 開店の日の店内', 'opening_shop', M + 'showa_street.webp', 'Scene: the inside of a small Japanese watch and clock shop on its reopening day in the spring of 1997, seen from above with the ceiling removed, bright late-1990s colors with fresh wood and new glass. A long glass display counter with wristwatches and two small glass cases (the dark blocks in the sketch), wall clocks and a tall antique pendulum clock against the top wall, a workbench with a desk lamp and tiny tools, congratulatory flowers by the door. The entrance (a rolling shutter, raised) comes in from the bottom edge.', ['bottom'], False, 'shop walls'),
]:
    add(name, [L + f'room_{rid}.png', ref], f'map_{rid}.png', room(scene, exits, tall, *closed))



# ---- Q〜S. テストプレイのメモ 2（2026-11-04） ----
section('Q. だいち・さきの描き直し（けんたと見分けやすく）', 'テストプレイのメモ 2 の 1：15日目のけんた・だいち・さきの顔が似すぎている（3人とも同じ輪郭・目・笑い方だった）。絵柄と構図はそのままで、顔のつくり・髪型・体つきを、けんたとはっきり変える。けんたの絵は「この人と似せない」ために添付する。できた絵は、今の daichi_smile・saki_smile と差し替える')
add('だいち（描き直し）', [REF_TEEN, P + 'kenta_smile.webp'], 'daichi_smile_v2.png', portrait('a friendly, slightly awkward smile with his eyes narrowed into thin happy arcs',
    'Character: Daichi, a 37-year-old Japanese salesman, the former drummer of a high school band. He must look clearly different from the man in the second attached portrait: '
    'a stocky, broad-shouldered build, a round full face with a wide jaw and slightly chubby cheeks, thick straight eyebrows, small narrow eyes, '
    'very short cropped black hair (a neat crew cut, forehead fully visible), clean-shaven, black rectangular-framed glasses. '
    'A dark navy business suit with a white shirt and a loosened plain dark red tie. Same art style as the first attached portrait.'))
add('さき（描き直し）', [REF_TEEN, P + 'kenta_smile.webp'], 'saki_smile_v2.png', portrait('a confident, teasing smile with one corner of her mouth raised',
    'Character: Saki, a 37-year-old Japanese woman, the former bassist of a high school band, now a working mother. She must look clearly different from the man in the second attached portrait: '
    'a slim oval face with a sharp chin, upturned almond-shaped cat-like eyes with long lashes, a small beauty mark under her left eye, '
    'glossy jet-black hair in a short chin-length bob with blunt side-swept bangs, small silver hoop earrings. '
    'A mustard-yellow knit sweater over a white collared shirt. Straightforward and a little mischievous. Same art style as the first attached portrait.'))

SAYOKO_WEST = 'Sayoko, the girl in the attached portrait, the same face, long straight black hair and silver crescent moon hairpin, but now wearing modern clothes for the first time: a plain white blouse with a soft round collar and a navy knee-length skirt (the skirt may be outside the frame). Keep the crescent moon hairpin.'
section('R. 洋服の小夜子（試着室）', 'テストプレイのメモ 2 の 25：29日目の絆の出来事「試着室」（`bond_sayoko2`）で、カーテンが開いた後に出す洋服の小夜子。今の小夜子の「微笑み」の絵を添付する。台本で使う表情（照れ・驚き）と、あとで使えるように微笑み')
add('洋服の小夜子：照れ（基本の1枚）', [P + 'sayoko_smile.webp'], 'sayoko_western_shy.png', expression('a shy, blushing look, cheeks pink, eyes cast down a little, a small embarrassed smile', SAYOKO_WEST).replace('Change only the facial expression', 'Change the outfit to the modern clothes described above and the facial expression').replace('Keep exactly the same character design, hairstyle, outfit, colors, art style', 'Keep exactly the same face, hairstyle, hairpin, art style'), '一番先に作る。下の2枚は、この絵を添付する')
for label, face, save in [('驚き', 'a surprised look, eyes wide open, lips parted, then frozen as if she cannot answer', 'sayoko_western_surprised.png'), ('微笑み', 'a gentle, happy smile', 'sayoko_western_smile.png')]:
    add(f'洋服の小夜子：{label}', ['sayoko_western_shy.png（上で作った絵）'], save, expression(face, SAYOKO_WEST))


def open_mouth(face):
    return f'''Edit the attached image. Keep everything exactly the same: the same character, the same {face} expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.'''


section('S. とうや・しおりのまばたき・口パク用', 'テストプレイのメモ 2 の 27：とうやとしおりは、まばたき・口パクがない。表情が笑顔の1枚だけなので、その絵をそのまま直して、目だけ閉じた絵と、口だけ開けた絵を作る（けんたと同じ作り方。scripts/portrait_parts.py）。毎回その人の絵を添付する。構図が少しでも動いたら作り直す')
for who, name in [('toya', 'とうや'), ('shiori', 'しおり')]:
    add(f'{name}：目を閉じた絵', [P + f'{who}_smile.webp'], f'{who}_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
    add(f'{name}：口を開けた絵', [P + f'{who}_smile.webp'], f'{who}_talk_src.png', open_mouth('smiling'))

section('T. 砂の底を掘る、二頭身のハルト', '砂の底（段階210。`docs/milestones/M3_sand_bottom.md` の S2）で、地面を横から見て掘り進む二頭身のハルト。今はコードで描いた仮の絵（`src/scenes/digArt.ts`）。届いたら白い背景を抜き、`public/assets/sprites/dig_hero.webp` にして台帳に id `sprite.dig_hero` で足し、砂の底に入る前に読む（マス目どおり4行×3列に切るのはゲームがする）。うまくそろわなければ、行ごとに1枚ずつ作る')
add('掘る二頭身のハルト（4行×3列）', [P + 'hero_smile.webp'], 'dig_hero.png', f'''{STYLE}

A chibi sprite sheet for a side-view 2D digging game on mobile, the same boy as in the attached reference portrait (Haruto: messy short black hair with ONE single sand-gold strand in the front bangs, warm amber eyes, white school dress shirt with a loose sand-gold necktie, open dark navy zip hoodie with dusk-orange lining, dark school trousers, white sneakers). Super-deformed proportions, about two heads tall, big head, small body, cute but not babyish. He always holds a small wooden-handled steel shovel.
Side view, ALWAYS FACING RIGHT in every cell (the game flips it for the left).
Layout: a grid of 4 rows by 3 columns on a plain pure white background, every cell exactly the same size (square), the character at exactly the same scale in each cell, his feet on the same baseline about three quarters down the cell, leaving empty space around him so the shovel never touches the cell edges.
- Row 1: walking to the right with the shovel resting on his shoulder (left foot forward, standing, right foot forward).
- Row 2: digging sideways to the right (shovel swung back, swinging forward, shovel thrust horizontally forward hitting the ground in front).
- Row 3: digging straight down (shovel raised in front of him, swinging down, shovel blade stabbing into the ground at his feet).
- Row 4: climbing up while digging upward (crouching with the shovel pointed up, jumping up with the shovel thrust overhead, landing).
Soft cel shading, clear dark outline so it reads at a very small size. No ground, no dirt effects, no shadow, no text, no grid lines.''', '1枚で12コマがそろわない時は、行ごとに「1 row of 3 cells」で4枚に分けて作る')


section('U. 砂の底を掘る、二頭身の仲間（あかり・みお・小夜子・早瀬）', '砂の底で掘る人を選べる（段階211。`docs/milestones/M3_sand_bottom.md` の S3）。ハルトの掘る絵（`public/assets/sprites/dig_hero.webp`）と同じ形・同じ絵柄・同じ大きさで作る。毎回、ハルトの掘る絵と、その人の立ち絵を添付する。今はコードで描いた色違いの仮の絵。届いたら `scripts/dig_sprite.py` で背景を抜いてコマの位置をそろえ、台帳に id `sprite.dig_<人>` で足す')


def dig_buddy(name, look, extra=''):
    return f'''{STYLE}

A chibi sprite sheet for a side-view 2D digging game on mobile. Match the attached chibi sprite sheet of the boy EXACTLY: the same layout, the same art style, the same two-heads-tall proportions, the same size and baseline in each cell, the same small wooden-handled steel shovel, the same 12 poses in the same order. Only the character is different: {name}, the same person as in the attached portrait ({look}). {extra}
Side view, ALWAYS FACING RIGHT in every cell (the game flips it for the left).
Layout: a grid of 4 rows by 3 columns on a plain pure white background, every cell exactly the same size (square), the character at exactly the same scale in each cell, feet on the same baseline about three quarters down the cell, leaving empty space around so the shovel never touches the cell edges.
- Row 1: walking to the right with the shovel resting on the shoulder (standing, left foot forward, right foot forward).
- Row 2: digging sideways to the right (shovel swung back, swinging forward, shovel thrust horizontally forward hitting the ground in front).
- Row 3: digging straight down (shovel raised in front, swinging down, shovel blade stabbing into the ground at the feet).
- Row 4: climbing up while digging upward (crouching with the shovel pointed up, jumping up with the shovel thrust overhead, landing).
Soft cel shading, clear dark outline so it reads at a very small size. No ground, no dirt effects, no shadow, no text, no grid lines.'''


DIG_REF = 'public/assets/sprites/dig_hero.webp'
add('掘る二頭身のあかり', [DIG_REF, P + 'akari_smile.webp'], 'dig_akari.png', dig_buddy('Akari, a cheerful 17-year-old girl', 'shoulder-length soft chestnut-brown hair with light inward curls, side-swept bangs, a thin red ribbon at the back, a small red goldfish hair clip on the left, warm brown eyes, white dress shirt with a dusk-red neck ribbon, a cream knit cardigan with slightly long sleeves, a navy pleated skirt, navy knee socks, brown loafers', 'She digs with cheerful energy, a little clumsy but determined.'))
add('掘る二頭身のみお', [DIG_REF, P + 'mio_smile.webp'], 'dig_mio.png', dig_buddy('Mio, a lively 10-year-old girl', 'bright light-brown short hair with one tiny side tuft tied by a small orange hair tie, big lively brown eyes, round cheeks, a slightly sunburnt nose, a plain sunny-yellow T-shirt with no logo, shorts, sneakers', 'She is smaller than the boy (a child), and digs fast and eagerly, full of energy.'))
add('掘る二頭身の小夜子', [DIG_REF, P + 'sayoko_smile.webp'], 'dig_sayoko.png', dig_buddy('Sayoko, a graceful 16-year-old girl of the Taisho era', 'long straight black hair half-up with a small silver crescent moon hairpin, blunt bangs, large dark eyes with a soft reddish-brown tint, a deep indigo yukata with white bellflowers and a crimson obi, the yukata sleeves tied back with a cord for work, wooden geta sandals with red straps', 'Graceful but surprisingly strong: her shovel strikes are sharp and powerful, as if she could split rock.'))
add('掘る二頭身の早瀬', [DIG_REF, P + 'hayase_normal.webp'], 'dig_hayase.png', dig_buddy('Hayase, a dandy watchmaker in his late fifties', 'dark hair with grey at the temples swept back, a neatly trimmed short salt-and-pepper beard, sharp narrow eyes, a watchmaker\'s loupe pushed up on his forehead, a dark navy work jacket open over a black henley shirt, sleeves rolled up, a leather tool roll on his belt, brown boots', 'He is a little taller than the boy, and digs calmly and efficiently with economical, precise movements.'))


section('W. 探索を一緒に歩く二頭身（段階267）', '探索の地図で、編成の仲間が一緒に歩く2頭身の絵（`docs/milestones/M3_explore_feel.md` の 6.）。届くまでは、砂の底の掘る二頭身の歩く行を仮に使っている。絵柄と大きさは、砂の底の掘る二頭身（`public/assets/sprites/dig_*.webp`）にそろえる。届いたら背景を抜いて `public/assets/sprites/walk_<人>.webp` にし、台帳に `sprite.walk_<人>` で足す（Claude がする）')


def walk_sheet(name, look, extra=''):
    return f'''{STYLE}

A chibi sprite sheet for a top-down 2D RPG on mobile. Match the attached chibi digging sprite sheet EXACTLY in art style, two-heads-tall proportions, outline thickness and the size of the character in each cell, but this sheet has NO shovel and NO tools: the character simply walks. The character is {name}, the same person as in the attached portrait ({look}). {extra}
Layout: a grid of 4 rows by 3 columns on a plain pure white background, every cell exactly the same size (square), the character at exactly the same scale in each cell, feet on the same baseline about three quarters down the cell.
- Row 1: walking toward the viewer (front view).
- Row 2: walking to the left (side view).
- Row 3: walking to the right (side view).
- Row 4: walking away from the viewer (back view).
- Columns: standing, left foot forward, right foot forward.
Soft cel shading, clear dark outline so it reads at a very small size. No ground, no shadow, no text, no grid lines.'''


WALK_REF = 'public/assets/sprites/dig_hero.webp'
add('歩く二頭身のハルト', [WALK_REF, P + 'hero_normal.webp'], 'walk_hero.png', walk_sheet('Haruto, a 17-year-old boy', 'messy short black hair with ONE single sand-gold strand in the front bangs, warm amber eyes, white school dress shirt with a loose sand-gold necktie, open dark navy zip hoodie with dusk-orange lining, dark school trousers, sneakers', 'He walks with an easy, slightly lazy stride.'), 'まず1枚で試す。うまくいけば下の4人も同じ形で')
add('歩く二頭身のあかり', [WALK_REF, P + 'akari_smile.webp'], 'walk_akari.png', walk_sheet('Akari, a cheerful 17-year-old girl', 'shoulder-length soft chestnut-brown hair with light inward curls, side-swept bangs, a thin red ribbon at the back, a small red goldfish hair clip on the left, warm brown eyes, white dress shirt with a dusk-red neck ribbon, a cream knit cardigan with slightly long sleeves, a navy pleated skirt, navy knee socks, brown loafers', 'She walks with a light, bouncy step.'))
add('歩く二頭身のみお', [WALK_REF, P + 'mio_smile.webp'], 'walk_mio.png', walk_sheet('Mio, a lively 10-year-old girl', 'bright light-brown short hair with one tiny side tuft tied by a small orange hair tie, big lively brown eyes, round cheeks, a slightly sunburnt nose, a plain sunny-yellow T-shirt with no logo, shorts, sneakers', 'She is smaller than the boy (a child) and walks briskly, full of energy.'))
add('歩く二頭身の小夜子', [WALK_REF, P + 'sayoko_smile.webp'], 'walk_sayoko.png', walk_sheet('Sayoko, a graceful 16-year-old girl of the Taisho era', 'long straight black hair half-up with a small silver crescent moon hairpin, blunt bangs, large dark eyes with a soft reddish-brown tint, a deep indigo yukata with white bellflowers and a crimson obi, wooden geta sandals with red straps', 'She walks gracefully with small steps.'))
add('歩く二頭身の早瀬', [WALK_REF, P + 'hayase_normal.webp'], 'walk_hayase.png', walk_sheet('Hayase, a dandy watchmaker in his late fifties', "dark hair with grey at the temples swept back, a neatly trimmed short salt-and-pepper beard, sharp narrow eyes, a watchmaker's loupe pushed up on his forehead, a dark navy work jacket over a black henley shirt, sleeves rolled up, a leather tool roll on his belt, brown boots", 'He is a little taller than the boy and walks calmly with his hands in his pockets.'))


section('V. 砂の底のレアスナップ（段階219）', '砂の底の珍品で手に入る、新しい戦闘の札の写真（`src/data/chainDig.ts`）。今は近い雰囲気の今ある絵を仮に使っている。毎回、絵柄の見本として今あるスナップの写真を添付する。届いたら 768×768 の WebP にして、台帳に足し、`DIG_CARD_ART` をつなぎ替える')


def dig_snap(scene):
    return f'''{STYLE}

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces. Match the art style of the attached snapshot.
{scene}
Absolutely no letters or text anywhere.'''


SNAP_REF = 'public/assets/snaps/encore.webp'
add('スナップ「残像」（感覚記憶の層）', [SNAP_REF], 'snap_digZanzo.png', dig_snap('A child running through a summer festival at dusk between paper lanterns, caught with soft motion blur, so a faint transparent afterimage of the child trails a step behind. The feeling of a moment that stays in the eyes for just a second.'))
add('スナップ「うたかた」（短期記憶の層）', [SNAP_REF], 'snap_digUtakata.png', dig_snap('Soap bubbles drifting over an old shopping street at dusk, catching the orange light; one bubble is just about to pop. A small child\'s hand with a bubble wand at the edge of the frame. Fleeting and gentle.'))
add('スナップ「回想」（エピソード記憶の層）', [SNAP_REF], 'snap_digKaiso.png', dig_snap('An old photo album lying open on a wooden table in warm evening light, a few faded photographs of festivals and school days slightly out of focus, a cup of tea beside it. The quiet feeling of remembering many days at once.'))



# ---- Y〜AC. まだ絵のない物の総まとめ（2026-11-17。開発者の頼み：表情違い・まばたき・口パクも含めて全部） ----
FACE_EN = {"笑顔": ["smile", "a warm, happy smile"], "考える": ["thinking", "a thoughtful look, eyes glancing slightly aside, mouth closed"], "さみしげ": ["lonely", "a lonely, wistful look with a faint, sad smile"], "驚き": ["surprised", "a surprised look, eyes wide open, lips slightly parted"], "泣き笑い": ["teary", "smiling through tears, eyes wet with tears"], "真剣": ["serious", "a serious, earnest look, mouth firmly closed"], "困り": ["troubled", "a troubled, worried look, eyebrows drawn together"], "困り笑い": ["awkward", "an awkward, troubled little smile"], "苦笑い": ["wry", "a wry, rueful smile"], "通常": ["normal", "a calm, natural expression"], "微笑み": ["gentle", "a gentle, soft smile"], "大笑い": ["laugh", "laughing heartily, eyes squeezed shut, mouth wide open"], "あせり": ["flustered", "a flustered, panicked look with a drop of sweat"], "照れ": ["shy", "a shy, embarrassed look, cheeks blushing"], "見下す": ["scornful", "a cold, condescending look, chin slightly raised, looking down at the viewer"], "むっ": ["pout", "a sulky, pouting look"], "泣き": ["crying", "crying, tears running down the cheeks"], "悲しい": ["sad", "a sad look, eyes cast down"]}


def expr_of(who, base, jp, child=False, keep='the same face, hairstyle and outfit.', attach=None):
    en, desc = FACE_EN[jp]
    return (attach or [P + f'{who}_{base}.webp']), f'{who}_{en}.png', expression(desc, keep, child)

section('Y. 寄り道の町の人の表情違い（五郎・善次・初江）', '笑顔の絵が届いた3人の、台本で使う表情（`src/data/scriptSide.ts`）。毎回その人の笑顔の絵を添付する。届いたら `CAST` の表情に足す（今は笑顔で代わりに出している）')
att, save, pr = expr_of('goro', 'smile', '困り')
add('五郎：困り', att, save, pr)
att, save, pr = expr_of('goro', 'smile', '驚き')
add('五郎：驚き', att, save, pr)
att, save, pr = expr_of('goro', 'smile', '照れ')
add('五郎：照れ', att, save, pr)
att, save, pr = expr_of('goro', 'smile', '泣き笑い')
add('五郎：泣き笑い', att, save, pr)
att, save, pr = expr_of('zenji', 'smile', '微笑み')
add('善次：微笑み', att, save, pr)
att, save, pr = expr_of('zenji', 'smile', '照れ')
add('善次：照れ', att, save, pr)
att, save, pr = expr_of('zenji', 'smile', '驚き')
add('善次：驚き', att, save, pr)
att, save, pr = expr_of('tome', 'smile', '微笑み')
add('初江：微笑み', att, save, pr)
att, save, pr = expr_of('tome', 'smile', '困り')
add('初江：困り', att, save, pr)
att, save, pr = expr_of('tome', 'smile', '驚き')
add('初江：驚き', att, save, pr)
section('Z. 立ち絵のない3人（写しの仁・写しの静江・写しの敏夫）', '台本で話すのに、まだ色の札で出している3人。写しの人なので、ゲームの側でセピアに染める。まず基本の1枚を作り、表情違いは、その絵を添付して作る')
add('写しの仁（平成9年の春、29歳。早瀬の若いころ）：通常', [P + 'hayase_normal.webp'], 'past_jin_normal.png', portrait('a calm, quiet expression, a little stiff and nervous', "Character: young Jin Hayase, the same man as the attached portrait but 29 years earlier: a 29-year-old Japanese watchmaker in the spring of 1997, on the opening day of his own small watch and clock shop. Keep the same face features so he is clearly the same person, but young, with smooth skin and no beard. Short dark hair neatly combed, a watchmaker's loupe pushed up on his forehead, a clean white shirt with the sleeves rolled up and a plain dark apron. Even quieter than he is now.").replace('the attached reference portrait of the girl in the cardigan', 'the attached portrait'), '見本は今の早瀬（同じ人の若いころ）')
add('写しの静江（平成9年の春、27歳。早瀬の妻）：笑顔', [REF_TEEN, P + 'hayase_normal.webp'], 'past_shizue_smile.png', portrait('a bright, cheerful open smile', 'Character: Shizue, a 27-year-old Japanese woman in the spring of 1997, the wife of the young watchmaker (the man in the second attached portrait, 29 years younger), on the opening day of their small shop. Bright, talkative and always laughing. Shoulder-length dark brown hair loosely tied back with a pale yellow scarf, a few loose strands, a soft cream cardigan over a simple blouse and a plain shop apron, a tiny smudge of ink on one finger from writing the opening-day sign with a brush.'), '構図と大きさの見本は、カーディガンの女の子（1枚目）。2枚目は夫の見た目の参考')
add('写しの敏夫（昭和44年の冬、30代。工場の先輩の職人）：通常', [REF_TEEN, P + 'past_isamu_serious.webp'], 'past_toshio_normal.png', portrait('a stern, quiet look, but warm eyes', 'Character: Toshio, a Japanese lathe craftsman in his late thirties in the winter of 1969, the senior craftsman of a small town factory and the mentor of the young man in the second attached portrait. A strong, lean build, short cropped black hair under a faded work cap, a gray work uniform with a towel around the neck, a small pencil behind one ear, a faint smudge of machine oil on one cheek. Few words, strict at work, quietly kind.'), '構図の見本はカーディガンの女の子（1枚目）。2枚目は同じ工場の後輩（写しの勇夫）の見た目の参考')
att, save, pr = expr_of('past_jin', 'normal', '驚き', attach=['past_jin_normal.png（上で作った絵）'])
add('写しの仁：驚き', att, save, pr)
att, save, pr = expr_of('past_jin', 'normal', '真剣', attach=['past_jin_normal.png（上で作った絵）'])
add('写しの仁：真剣', att, save, pr)
att, save, pr = expr_of('past_jin', 'normal', '困り', attach=['past_jin_normal.png（上で作った絵）'])
add('写しの仁：困り', att, save, pr)
att, save, pr = expr_of('past_shizue', 'smile', '驚き', attach=['past_shizue_smile.png（上で作った絵）'])
add('写しの静江：驚き', att, save, pr)
att, save, pr = expr_of('past_shizue', 'smile', '大笑い', attach=['past_shizue_smile.png（上で作った絵）'])
add('写しの静江：大笑い', att, save, pr)
att, save, pr = expr_of('past_shizue', 'smile', '考える', attach=['past_shizue_smile.png（上で作った絵）'])
add('写しの静江：考える', att, save, pr)
att, save, pr = expr_of('past_shizue', 'smile', '微笑み', attach=['past_shizue_smile.png（上で作った絵）'])
add('写しの静江：微笑み', att, save, pr)
att, save, pr = expr_of('past_shizue', 'smile', '泣き笑い', attach=['past_shizue_smile.png（上で作った絵）'])
add('写しの静江：泣き笑い', att, save, pr)
att, save, pr = expr_of('past_shizue', 'smile', '照れ', attach=['past_shizue_smile.png（上で作った絵）'])
add('写しの静江：照れ', att, save, pr)
att, save, pr = expr_of('past_shizue', 'smile', '困り笑い', attach=['past_shizue_smile.png（上で作った絵）'])
add('写しの静江：困り笑い', att, save, pr)
section('AA. 早瀬（仲間）のまばたき・口パク', '5人目の仲間で台本の台詞が多い（122行）のに、まばたき・口パクがない。表情ごとに別に作った絵なので、みおと同じく、表情の絵をそのまま直して目だけ閉じた絵を作る（`scripts/portrait_parts.py`）。口パクは、口を閉じている表情だけ。毎回その表情の絵を添付する。構図が少しでも動いたら作り直す')
add('早瀬：通常（目を閉じた絵）', [P + 'hayase_normal.webp'], 'hayase_blink_src_normal.png', close_eyes('calm').replace('her eyes', 'his eyes'))
add('早瀬：考える（目を閉じた絵）', [P + 'hayase_thinking.webp'], 'hayase_blink_src_thinking.png', close_eyes('thinking').replace('her eyes', 'his eyes'))
add('早瀬：苦笑い（目を閉じた絵）', [P + 'hayase_wry.webp'], 'hayase_blink_src_wry.png', close_eyes('wry smiling').replace('her eyes', 'his eyes'))
add('早瀬：驚き（目を閉じた絵）', [P + 'hayase_surprised.webp'], 'hayase_blink_src_surprised.png', close_eyes('surprised').replace('her eyes', 'his eyes'))
add('早瀬：怒り（目を閉じた絵）', [P + 'hayase_angry.webp'], 'hayase_blink_src_angry.png', close_eyes('angry').replace('her eyes', 'his eyes'))
add('早瀬：泣き笑い（目を閉じた絵）', [P + 'hayase_teary.webp'], 'hayase_blink_src_teary.png', close_eyes('smiling-through-tears').replace('her eyes', 'his eyes'))
add('早瀬：通常（口を開けた絵）', [P + 'hayase_normal.webp'], 'hayase_talk_src_normal.png', open_mouth('calm'))
add('早瀬：考える（口を開けた絵）', [P + 'hayase_thinking.webp'], 'hayase_talk_src_thinking.png', open_mouth('thinking'))
add('早瀬：苦笑い（口を開けた絵）', [P + 'hayase_wry.webp'], 'hayase_talk_src_wry.png', open_mouth('wry smiling'))
section('AB. 脇役の表情違い（台本で使う表情だけ）', '基本の1枚しかない人の、台本で使う表情。台詞の多い人から順に、1人の中は使う回数の多い表情から。今はどれも基本の1枚で代わりに出している。毎回その人の基本の1枚を添付する。届いたら `CAST` の表情に足す')
att, save, pr = expr_of('isamu', 'normal', '笑顔', child=False)
add('勇夫：笑顔（台本で12回）', att, save, pr)
att, save, pr = expr_of('isamu', 'normal', 'さみしげ', child=False)
add('勇夫：さみしげ（台本で12回）', att, save, pr)
att, save, pr = expr_of('isamu', 'normal', '考える', child=False)
add('勇夫：考える（台本で11回）', att, save, pr)
att, save, pr = expr_of('isamu', 'normal', '驚き', child=False)
add('勇夫：驚き（台本で3回）', att, save, pr)
att, save, pr = expr_of('isamu', 'normal', '泣き笑い', child=False)
add('勇夫：泣き笑い（台本で3回）', att, save, pr)
att, save, pr = expr_of('petra', 'normal', '真剣', child=False)
add('ペトラ：真剣（台本で13回）', att, save, pr)
att, save, pr = expr_of('petra', 'normal', '困り', child=False)
add('ペトラ：困り（台本で10回）', att, save, pr)
att, save, pr = expr_of('petra', 'normal', '驚き', child=False)
add('ペトラ：驚き（台本で7回）', att, save, pr)
att, save, pr = expr_of('petra', 'normal', '笑顔', child=False)
add('ペトラ：笑顔（台本で5回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '通常', child=False)
add('しおり：通常（台本で14回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '困り笑い', child=False)
add('しおり：困り笑い（台本で12回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '驚き', child=False)
add('しおり：驚き（台本で9回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '考える', child=False)
add('しおり：考える（台本で8回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '苦笑い', child=False)
add('しおり：苦笑い（台本で7回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '微笑み', child=False)
add('しおり：微笑み（台本で4回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', 'さみしげ', child=False)
add('しおり：さみしげ（台本で3回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '大笑い', child=False)
add('しおり：大笑い（台本で3回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', '困り', child=False)
add('しおり：困り（台本で1回）', att, save, pr)
att, save, pr = expr_of('shiori', 'smile', 'あせり', child=False)
add('しおり：あせり（台本で1回）', att, save, pr)
att, save, pr = expr_of('koji', 'smile', '苦笑い', child=False)
add('浩二：苦笑い（台本で15回）', att, save, pr)
att, save, pr = expr_of('koji', 'smile', '考える', child=False)
add('浩二：考える（台本で12回）', att, save, pr)
att, save, pr = expr_of('koji', 'smile', 'さみしげ', child=False)
add('浩二：さみしげ（台本で11回）', att, save, pr)
att, save, pr = expr_of('koji', 'smile', '通常', child=False)
add('浩二：通常（台本で9回）', att, save, pr)
att, save, pr = expr_of('koji', 'smile', '驚き', child=False)
add('浩二：驚き（台本で5回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '微笑み', child=False)
add('千代：微笑み（台本で15回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '通常', child=False)
add('千代：通常（台本で12回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', 'さみしげ', child=False)
add('千代：さみしげ（台本で9回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '考える', child=False)
add('千代：考える（台本で8回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '驚き', child=False)
add('千代：驚き（台本で7回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '苦笑い', child=False)
add('千代：苦笑い（台本で2回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '悲しい', child=False)
add('千代：悲しい（台本で2回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '泣き笑い', child=False)
add('千代：泣き笑い（台本で2回）', att, save, pr)
att, save, pr = expr_of('chiyo', 'smile', '真剣', child=False)
add('千代：真剣（台本で1回）', att, save, pr)
att, save, pr = expr_of('kenta', 'smile', '苦笑い', child=False)
add('けんた：苦笑い（台本で14回）', att, save, pr)
att, save, pr = expr_of('kenta', 'smile', 'さみしげ', child=False)
add('けんた：さみしげ（台本で8回）', att, save, pr)
att, save, pr = expr_of('kenta', 'smile', '考える', child=False)
add('けんた：考える（台本で7回）', att, save, pr)
att, save, pr = expr_of('kenta', 'smile', '照れ', child=False)
add('けんた：照れ（台本で6回）', att, save, pr)
att, save, pr = expr_of('kenta', 'smile', '驚き', child=False)
add('けんた：驚き（台本で4回）', att, save, pr)
att, save, pr = expr_of('kenta', 'smile', '泣き笑い', child=False)
add('けんた：泣き笑い（台本で2回）', att, save, pr)
att, save, pr = expr_of('kenta', 'smile', '大笑い', child=False)
add('けんた：大笑い（台本で1回）', att, save, pr)
att, save, pr = expr_of('kai', 'smug', '通常', child=False)
add('カイ：通常（台本で20回）', att, save, pr)
att, save, pr = expr_of('kai', 'smug', '見下す', child=False)
add('カイ：見下す（台本で11回）', att, save, pr)
att, save, pr = expr_of('past_toya', 'smile', '通常', child=False)
add('写しのとうや：通常（台本で12回）', att, save, pr)
att, save, pr = expr_of('past_chiyo', 'smile', '通常', child=False)
add('写しの千代：通常（台本で11回）', att, save, pr)
att, save, pr = expr_of('past_chiyo', 'smile', '泣き', child=False)
add('写しの千代：泣き（台本で6回）', att, save, pr)
att, save, pr = expr_of('past_chiyo', 'smile', 'むっ', child=False)
add('写しの千代：むっ（台本で4回）', att, save, pr)
att, save, pr = expr_of('past_chiyo', 'smile', '真剣', child=False)
add('写しの千代：真剣（台本で2回）', att, save, pr)
att, save, pr = expr_of('past_chiyo', 'smile', '驚き', child=False)
add('写しの千代：驚き（台本で1回）', att, save, pr)
att, save, pr = expr_of('past_kiku', 'normal', '泣き笑い', child=False)
add('写しの菊：泣き笑い（台本で1回）', att, save, pr)
att, save, pr = expr_of('past_shiori', 'smile', '通常', child=False)
add('写しのしおり：通常（台本で14回）', att, save, pr)
att, save, pr = expr_of('past_shiori', 'smile', 'むっ', child=False)
add('写しのしおり：むっ（台本で9回）', att, save, pr)
att, save, pr = expr_of('past_shiori', 'smile', '真剣', child=False)
add('写しのしおり：真剣（台本で3回）', att, save, pr)
att, save, pr = expr_of('past_kenta', 'smile', '泣き笑い', child=False)
add('写しのけんた：泣き笑い（台本で1回）', att, save, pr)
att, save, pr = expr_of('masaru', 'smile', '通常', child=False)
add('正雄：通常（台本で6回）', att, save, pr)
att, save, pr = expr_of('masaru', 'smile', '苦笑い', child=False)
add('正雄：苦笑い（台本で5回）', att, save, pr)
att, save, pr = expr_of('masaru', 'smile', '驚き', child=False)
add('正雄：驚き（台本で2回）', att, save, pr)
att, save, pr = expr_of('masaru', 'smile', 'さみしげ', child=False)
add('正雄：さみしげ（台本で2回）', att, save, pr)
att, save, pr = expr_of('noboru', 'smile', '通常', child=False)
add('昇平：通常（台本で4回）', att, save, pr)
att, save, pr = expr_of('noboru', 'smile', '考える', child=False)
add('昇平：考える（台本で4回）', att, save, pr)
att, save, pr = expr_of('noboru', 'smile', 'さみしげ', child=False)
add('昇平：さみしげ（台本で4回）', att, save, pr)
att, save, pr = expr_of('noboru', 'smile', '困り笑い', child=False)
add('昇平：困り笑い（台本で3回）', att, save, pr)
att, save, pr = expr_of('noboru', 'smile', '苦笑い', child=False)
add('昇平：苦笑い（台本で2回）', att, save, pr)
att, save, pr = expr_of('noboru', 'smile', '照れ', child=False)
add('昇平：照れ（台本で1回）', att, save, pr)
att, save, pr = expr_of('noboru', 'smile', '驚き', child=False)
add('昇平：驚き（台本で1回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '通常', child=False)
add('とうや：通常（台本で7回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '驚き', child=False)
add('とうや：驚き（台本で4回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '困り笑い', child=False)
add('とうや：困り笑い（台本で3回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '考える', child=False)
add('とうや：考える（台本で2回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '苦笑い', child=False)
add('とうや：苦笑い（台本で2回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '微笑み', child=False)
add('とうや：微笑み（台本で1回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '真剣', child=False)
add('とうや：真剣（台本で1回）', att, save, pr)
att, save, pr = expr_of('toya', 'smile', '大笑い', child=False)
add('とうや：大笑い（台本で1回）', att, save, pr)
att, save, pr = expr_of('past_koji', 'normal', '驚き', child=True)
add('写しの浩二：驚き（台本で3回）', att, save, pr)
att, save, pr = expr_of('past_koji', 'normal', '泣き笑い', child=True)
add('写しの浩二：泣き笑い（台本で1回）', att, save, pr)
att, save, pr = expr_of('hinano', 'normal', 'さみしげ', child=False)
add('ひなの：さみしげ（台本で5回）', att, save, pr)
att, save, pr = expr_of('hinano', 'normal', '驚き', child=False)
add('ひなの：驚き（台本で3回）', att, save, pr)
att, save, pr = expr_of('hinano', 'normal', 'むっ', child=False)
add('ひなの：むっ（台本で3回）', att, save, pr)
att, save, pr = expr_of('hinano', 'normal', '困り', child=False)
add('ひなの：困り（台本で2回）', att, save, pr)
att, save, pr = expr_of('hinano', 'normal', '微笑み', child=False)
add('ひなの：微笑み（台本で1回）', att, save, pr)
att, save, pr = expr_of('sumi', 'smile', 'さみしげ', child=False)
add('寿美：さみしげ（台本で7回）', att, save, pr)
att, save, pr = expr_of('sumi', 'smile', '考える', child=False)
add('寿美：考える（台本で3回）', att, save, pr)
att, save, pr = expr_of('sumi', 'smile', '驚き', child=False)
add('寿美：驚き（台本で2回）', att, save, pr)
att, save, pr = expr_of('sumi', 'smile', '通常', child=False)
add('寿美：通常（台本で1回）', att, save, pr)
att, save, pr = expr_of('shigeru', 'smile', '通常', child=False)
add('茂雄：通常（台本で3回）', att, save, pr)
att, save, pr = expr_of('shigeru', 'smile', 'さみしげ', child=False)
add('茂雄：さみしげ（台本で3回）', att, save, pr)
att, save, pr = expr_of('shigeru', 'smile', '驚き', child=False)
add('茂雄：驚き（台本で2回）', att, save, pr)
att, save, pr = expr_of('shigeru', 'smile', '苦笑い', child=False)
add('茂雄：苦笑い（台本で2回）', att, save, pr)
att, save, pr = expr_of('shigeru', 'smile', '考える', child=False)
add('茂雄：考える（台本で2回）', att, save, pr)
att, save, pr = expr_of('saki', 'smile', '驚き', child=False)
add('さき：驚き（台本で3回）', att, save, pr)
att, save, pr = expr_of('saki', 'smile', '考える', child=False)
add('さき：考える（台本で3回）', att, save, pr)
att, save, pr = expr_of('saki', 'smile', 'さみしげ', child=False)
add('さき：さみしげ（台本で3回）', att, save, pr)
att, save, pr = expr_of('saki', 'smile', '苦笑い', child=False)
add('さき：苦笑い（台本で1回）', att, save, pr)
att, save, pr = expr_of('saki', 'smile', '微笑み', child=False)
add('さき：微笑み（台本で1回）', att, save, pr)
att, save, pr = expr_of('past_isamu', 'serious', '泣き笑い', child=False)
add('写しの勇夫：泣き笑い（台本で1回）', att, save, pr)
section('AC. 脇役のまばたき・口パク（基本の1枚）', '基本の1枚の絵をそのまま直して、目だけ閉じた絵と、口だけ開けた絵を作る（けんたと同じ作り方。`scripts/portrait_parts.py`）。台詞の多い人から順。目を閉じて笑っている絵（五郎・初江）は、まばたきが要らない。口を開けて笑っている絵は、口パクが要らない。表情違いが届いたら、その表情の分は後で足す。毎回その人の基本の1枚を添付する。構図が少しでも動いたら作り直す')
add('勇夫：目を閉じた絵', [P + 'isamu_normal.webp'], 'isamu_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('勇夫：口を開けた絵', [P + 'isamu_normal.webp'], 'isamu_talk_src.png', open_mouth('calm'))
add('ペトラ：目を閉じた絵', [P + 'petra_normal.webp'], 'petra_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('ペトラ：口を開けた絵', [P + 'petra_normal.webp'], 'petra_talk_src.png', open_mouth('calm'))
add('浩二：目を閉じた絵', [P + 'koji_smile.webp'], 'koji_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('浩二：口を開けた絵', [P + 'koji_smile.webp'], 'koji_talk_src.png', open_mouth('smiling'))
add('千代：目を閉じた絵', [P + 'chiyo_smile.webp'], 'chiyo_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('千代：口を開けた絵', [P + 'chiyo_smile.webp'], 'chiyo_talk_src.png', open_mouth('smiling'))
add('カイ：口を開けた絵', [P + 'kai_smug.webp'], 'kai_talk_src.png', open_mouth('smug'))
add('たいち：目を閉じた絵', [P + 'taichi_normal.webp'], 'taichi_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('たいち：口を開けた絵', [P + 'taichi_normal.webp'], 'taichi_talk_src.png', open_mouth('calm'))
add('写しのとうや：目を閉じた絵', [P + 'past_toya_smile.webp'], 'past_toya_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('写しのとうや：口を開けた絵', [P + 'past_toya_smile.webp'], 'past_toya_talk_src.png', open_mouth('smiling'))
add('写しの千代：目を閉じた絵', [P + 'past_chiyo_smile.webp'], 'past_chiyo_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('写しの千代：口を開けた絵', [P + 'past_chiyo_smile.webp'], 'past_chiyo_talk_src.png', open_mouth('smiling'))
add('写しの菊：目を閉じた絵', [P + 'past_kiku_normal.webp'], 'past_kiku_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('写しの菊：口を開けた絵', [P + 'past_kiku_normal.webp'], 'past_kiku_talk_src.png', open_mouth('calm'))
add('写しのしおり：目を閉じた絵', [P + 'past_shiori_smile.webp'], 'past_shiori_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('写しのしおり：口を開けた絵（作り直し）', [P + 'past_shiori_normal.webp'], 'past_shiori_talk_src.png', open_mouth('calm, gently smiling'), '1回目は顔の向きと髪が元の絵からずれて使えなかった。「通常」の絵を添付して、顔と髪を動かさずに口だけ開けてもらう')
add('写しのけんた：目を閉じた絵', [P + 'past_kenta_smile.webp'], 'past_kenta_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('写しのけんた：口を開けた絵', [P + 'past_kenta_smile.webp'], 'past_kenta_talk_src.png', open_mouth('smiling'))
add('正雄：目を閉じた絵', [P + 'masaru_smile.webp'], 'masaru_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('正雄：口を開けた絵', [P + 'masaru_smile.webp'], 'masaru_talk_src.png', open_mouth('smiling'))
add('昇平：目を閉じた絵', [P + 'noboru_smile.webp'], 'noboru_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('昇平：口を開けた絵', [P + 'noboru_smile.webp'], 'noboru_talk_src.png', open_mouth('smiling'))
add('写しのたいち：目を閉じた絵', [P + 'past_taichi_normal.webp'], 'past_taichi_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('写しのたいち：口を開けた絵', [P + 'past_taichi_normal.webp'], 'past_taichi_talk_src.png', open_mouth('calm'))
add('写しの正雄：目を閉じた絵', [P + 'past_masaru_smile.webp'], 'past_masaru_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('写しの浩二：目を閉じた絵', [P + 'past_koji_normal.webp'], 'past_koji_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('写しの浩二：口を開けた絵', [P + 'past_koji_normal.webp'], 'past_koji_talk_src.png', open_mouth('calm'))
add('ひなの：目を閉じた絵', [P + 'hinano_normal.webp'], 'hinano_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('ひなの：口を開けた絵', [P + 'hinano_normal.webp'], 'hinano_talk_src.png', open_mouth('calm'))
add('ノア：目を閉じた絵', [P + 'noa_normal.webp'], 'noa_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('ノア：口を開けた絵', [P + 'noa_normal.webp'], 'noa_talk_src.png', open_mouth('calm'))
add('寿美：目を閉じた絵', [P + 'sumi_smile.webp'], 'sumi_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('寿美：口を開けた絵', [P + 'sumi_smile.webp'], 'sumi_talk_src.png', open_mouth('smiling'))
add('茂雄：目を閉じた絵', [P + 'shigeru_smile.webp'], 'shigeru_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('茂雄：口を開けた絵', [P + 'shigeru_smile.webp'], 'shigeru_talk_src.png', open_mouth('smiling'))
add('写しの源三：目を閉じた絵', [P + 'past_genzo_normal.webp'], 'past_genzo_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('写しの源三：口を開けた絵', [P + 'past_genzo_normal.webp'], 'past_genzo_talk_src.png', open_mouth('calm'))
add('さき：目を閉じた絵', [P + 'saki_smile.webp'], 'saki_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('さき：口を開けた絵', [P + 'saki_smile.webp'], 'saki_talk_src.png', open_mouth('smiling'))
add('写しの勇夫：目を閉じた絵', [P + 'past_isamu_serious.webp'], 'past_isamu_blink_src.png', close_eyes('serious').replace('her eyes', 'the eyes'))
add('写しの勇夫：口を開けた絵', [P + 'past_isamu_serious.webp'], 'past_isamu_talk_src.png', open_mouth('serious'))
add('写しの昇平：目を閉じた絵', [P + 'past_noboru_smile.webp'], 'past_noboru_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('写しの昇平：口を開けた絵', [P + 'past_noboru_smile.webp'], 'past_noboru_talk_src.png', open_mouth('smiling'))
add('善次：目を閉じた絵', [P + 'zenji_smile.webp'], 'zenji_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('善次：口を開けた絵', [P + 'zenji_smile.webp'], 'zenji_talk_src.png', open_mouth('smiling'))
add('写しの寿美：目を閉じた絵', [P + 'past_sumi_smile.webp'], 'past_sumi_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('写しの寿美：口を開けた絵', [P + 'past_sumi_smile.webp'], 'past_sumi_talk_src.png', open_mouth('smiling'))
add('写しのおじいちゃん：目を閉じた絵', [P + 'past_grandpa_normal.webp'], 'past_grandpa_blink_src.png', close_eyes('calm').replace('her eyes', 'the eyes'))
add('写しのおじいちゃん：口を開けた絵', [P + 'past_grandpa_normal.webp'], 'past_grandpa_talk_src.png', open_mouth('calm'))
add('だいち：目を閉じた絵', [P + 'daichi_smile.webp'], 'daichi_blink_src.png', close_eyes('smiling').replace('her eyes', 'the eyes'))
add('だいち：口を開けた絵', [P + 'daichi_smile.webp'], 'daichi_talk_src.png', open_mouth('smiling'))



# ---- AD. 口を開けた顔の、口を閉じた絵（段階249。2026-11-17 開発者と決めた） ----
def close_mouth(face):
    return f'''Edit the attached image. Keep everything exactly the same: the same character, the same {face} expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.'''


section('AD. 口を開けた顔の、口を閉じた絵（口パク用）', '元の絵が口を開けている表情は、話していても口が止まって見える（開発者と決めた：口を閉じた絵を足す）。ゲームは、話していない時にこの絵を重ね、話す間は重ねたり外したりして開け閉めする。台詞の多い順。大笑い・泣き顔のように、開いているのが自然な顔は頼まない。毎回その表情の絵を添付する。構図が少しでも動いたら作り直す')
add('みお：smileの口を閉じた絵（台本で204行）', [P + 'mio_smile.webp'], 'mio_smile_closed_src.png', close_mouth('smiling'))
add('あかり：smileの口を閉じた絵（台本で85行）', [P + 'akari_smile.webp'], 'akari_smile_closed_src.png', close_mouth('laughing with eyes closed'))
add('富美：smileの口を閉じた絵（台本で35行）', [P + 'fumi_smile.webp'], 'fumi_smile_closed_src.png', close_mouth('smiling'))
add('ゆうま：smileの口を閉じた絵（台本で32行）', [P + 'yuma_smile.webp'], 'yuma_smile_closed_src.png', close_mouth('smiling'))
add('写しの正雄：smileの口を閉じた絵（台本で26行）', [P + 'past_masaru_smile.webp'], 'past_masaru_smile_closed_src.png', close_mouth('big proud smiling'))
add('写しのゆうま：smileの口を閉じた絵（台本で18行）', [P + 'past_yuma_smile.webp'], 'past_yuma_smile_closed_src.png', close_mouth('smiling'))
add('写しの静江：smileの口を閉じた絵（台本で18行）', [P + 'past_shizue_smile.webp'], 'past_shizue_smile_closed_src.png', close_mouth('bright smiling'))
add('子りく：proudの口を閉じた絵（台本で16行）', [P + 'young_riku_proud.webp'], 'young_riku_proud_closed_src.png', close_mouth('proud grinning'))
add('写しのひなの：smileの口を閉じた絵（台本で16行）', [P + 'past_hinano_smile.webp'], 'past_hinano_smile_closed_src.png', close_mouth('smiling'))
add('正雄：smileの口を閉じた絵（台本で15行）', [P + 'masaru_smile.webp'], 'masaru_smile_closed_src.png', close_mouth('smiling'))
add('子あかり：smileの口を閉じた絵（台本で14行）', [P + 'young_akari_smile.webp'], 'young_akari_smile_closed_src.png', close_mouth('smiling'))
add('写しの富美：smileの口を閉じた絵（台本で14行）', [P + 'past_fumi_smile.webp'], 'past_fumi_smile_closed_src.png', close_mouth('smiling'))
add('勇夫：smileの口を閉じた絵（台本で12行）', [P + 'isamu_smile.webp'], 'isamu_smile_closed_src.png', close_mouth('smiling'))
add('昇平：smileの口を閉じた絵（台本で11行）', [P + 'noboru_smile.webp'], 'noboru_smile_closed_src.png', close_mouth('smiling'))
add('さき：smileの口を閉じた絵（台本で9行）', [P + 'saki_smile.webp'], 'saki_smile_closed_src.png', close_mouth('smiling'))
add('しおり：smileの口を閉じた絵（台本で9行）', [P + 'shiori_smile.webp'], 'shiori_smile_closed_src.png', close_mouth('smiling'))
add('茂雄：smileの口を閉じた絵（台本で8行）', [P + 'shigeru_smile.webp'], 'shigeru_smile_closed_src.png', close_mouth('smiling'))
add('写しの千代：smileの口を閉じた絵（台本で8行）', [P + 'past_chiyo_smile.webp'], 'past_chiyo_smile_closed_src.png', close_mouth('smiling'))
add('写しの昇平：smileの口を閉じた絵（台本で8行）', [P + 'past_noboru_smile.webp'], 'past_noboru_smile_closed_src.png', close_mouth('grinning'))
add('写しのたいち：smileの口を閉じた絵（台本で8行）', [P + 'past_taichi_smile.webp'], 'past_taichi_smile_closed_src.png', close_mouth('grinning'))
add('ペトラ：smileの口を閉じた絵（台本で5行）', [P + 'petra_smile.webp'], 'petra_smile_closed_src.png', close_mouth('smiling'))
add('写しのしおり：smileの口を閉じた絵（台本で5行）', [P + 'past_shiori_smile.webp'], 'past_shiori_smile_closed_src.png', close_mouth('teasing smiling'))

# ---- AE. 新しい1-1 の絵（段階270） ----
section('AE. 新しい1-1 の仕掛け・宝箱の小物と部屋の絵（段階270）', '新しい1-1（デバッグメニューの「試しの切り替え」の「新しい1-1」）は、部屋の絵がなく、仕掛けと宝箱も仮の印（ひし形・四角）で、良さが伝わりにくかった（2026-11-23 開発者）。`docs/milestones/M3_explore_feel.md` の 7.。**先に小物の3枚**（届けばマス目の部屋のままでも絵に替わる）、**次に部屋の6枚**。小物は白い背景のまま送ってくれればよい（Claude が1つずつ切り出す）。部屋の絵は、毎回その部屋の下絵（`docs/sketches/a11_art/room_<部屋>.png`）と、絵柄の見本の今の入口の地図（`public/assets/maps/fest_gate.webp`）を添付する')
AE_MAP = 'public/assets/maps/fest_gate.webp'
AE_SK = 'docs/sketches/a11_art/'


def prop_sheet(cols, rows, cells, extra=''):
    lines = '\n'.join(f'- Row {i // cols + 1}, column {i % cols + 1}: {c}' for i, c in enumerate(cells))
    return f"""{STYLE}

A sheet of small map objects (props) for a top-down 2D RPG exploration map on mobile, seen from the same nearly overhead view with a slight tilt as the attached map illustration, and matching its art style, colors and lighting exactly (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light).
Layout: a grid of {rows} rows by {cols} columns on a plain pure white background, every cell exactly the same size (square), one object centered in each cell, with clear white space around each object so they can be cut out one by one. Objects must not touch each other or the cell edges.
{lines}
Each object must read clearly as a small icon on a phone screen (about one or two fingertips wide): bold simple shapes, a clear dark outline, strong color differences between similar objects. A small soft shadow directly under each object is fine. No ground, no grid lines, no people unless stated, no letters or numbers anywhere.{extra}"""


add('小物1：宝箱と屋台の裏の物', [AE_MAP], 'a11_props1.png', prop_sheet(4, 3, [
    'a festival treasure box, CLOSED: a small sturdy wooden chest with a dark lacquered red lid, gold metal corners and a gold clasp, tied with a thick red-and-white festival cord. It must look precious and inviting.',
    'the SAME treasure box, OPENED and empty: the lid tilted back, a soft warm golden glow fading inside.',
    'a wooden fruit crate with a BLUE cloth thrown over half of it.',
    'the same kind of wooden crate with a bright RED cloth thrown over half of it.',
    'the same kind of wooden crate with a bright YELLOW cloth thrown over half of it.',
    'a small portable gasoline generator, STOPPED: dull grey-green metal, a black cable coiled beside it, one knob clearly missing (an empty socket), no light.',
    'the SAME generator, RUNNING: a small warm lamp on top glowing, faint exhaust puffs, the cable lit with tiny warm bulbs.',
    'a small two-wheeled wooden hand cart loaded with a few sake barrels and rope, seen from above.',
    'a short wall of old wooden boards nailed together, standing upright, wide and low (as wide as about three of the other objects together, so let it fill the cell width).',
    'the SAME board wall, smashed open in the middle, broken planks and splinters scattered.',
    'a single white fox festival mask (kitsune mask) with red markings, lying flat, seen from the front.',
    'an old faded photograph lying on the ground, softly glowing with a sepia light and a few floating sparkles, the picture on it too blurry to see.',
]), '1枚目。うまくいけば、同じ形で2枚目・3枚目')
add('小物2：提灯とお面屋', [AE_MAP, 'a11_props1.png（上で作った絵）'], 'a11_props2.png', prop_sheet(4, 3, [
    'a round RED paper festival lantern on a short wooden post, UNLIT: dull dark red paper, no glow.',
    'the SAME red lantern, LIT: glowing bright warm red with a soft halo of light around it.',
    'a round WHITE paper festival lantern on a short wooden post, UNLIT: dull grey-white paper, no glow.',
    'the SAME white lantern, LIT: glowing bright warm white with a soft halo.',
    'a round BLUE paper festival lantern on a short wooden post, UNLIT: dull dark blue paper, no glow.',
    'the SAME blue lantern, LIT: glowing bright cool blue with a soft halo.',
    'the front counter of a small festival mask stall with a display board of WHITE fox masks (one empty hook in the middle where a mask is missing), a small white awning.',
    'the same kind of mask stall counter with a display board of BLACK fox masks, a black awning.',
    'the same kind of mask stall counter with a display board of shiny GOLD fox masks, a gold-yellow awning.',
    'an old drink vending machine, switched OFF: dark screen, dark buttons, slightly rusty, blank front panel with only simple color stripes (no letters, no logos).',
    'a small old wooden garden gate door, broken: one hinge off, hanging crooked.',
    'a dense thicket of green bamboo stalks blocking a path, a few stalks leaning.',
], ' Match the attached prop sheet exactly in size, view and style.'))
add('小物3：人混み', [AE_MAP, 'a11_props1.png（上で作った絵）'], 'a11_props3.png', prop_sheet(2, 2, [
    'a tight cluster of three festival-goers seen from above at a slight tilt, standing shoulder to shoulder with their backs to the viewer, in yukata and summer clothes, drawn as soft semi-transparent sepia figures like faded memories (faces not visible).',
    'another tight cluster of three different festival-goers, the same style, one holding a cotton candy, one a paper fan.',
    'another tight cluster of two festival-goers and a child, the same style.',
    'another tight cluster of three festival-goers, the same style, one wearing a fox mask pushed up on the head.',
], ' The four clusters will be placed side by side to form one crowd blocking a path, so keep them the same size and density.'))
add('小物4：鳥居（下をくぐる物）', [AE_MAP, 'map_fest2_gate.png（下の部屋1の絵。先に作っていればでよい）'], 'a11_torii.png', f"""{STYLE}

A single map object for a top-down 2D RPG exploration map on mobile: a big red Japanese torii gate, seen from the same nearly overhead view with a slight tilt as the attached map illustration, matching its art style, colors and lighting exactly (a summer shrine festival at dusk, warm lantern light from below).
The torii stands upright facing the viewer: two round vermilion pillars with black bases, a black curved top beam (kasagi) and a red tie beam (nuki), a thick straw shimenawa rope with white paper zigzags hanging between the pillars. The whole torii fills about 80% of the image width.
Square 1:1 image, plain pure white background, nothing else: no ground, no paving, no shadow on the ground, no lions, no lanterns, no people, no letters anywhere.""", '下をくぐる物は、部屋の絵に描きこまず別の絵にする（ゲームが仲間の上に重ねる）。白い背景のまま送ってくれればよい')

AE_TAIL = """Follow the attached layout sketch exactly (a 24 by 24 grid, one square = one step): light sand areas are walkable ground, dark brown areas are buildings, stalls, trees and other things you cannot walk through, blue marks the openings at the edges (the blue is only a guide: do not paint blue squares, just let the path continue out through the edge there). Sand areas with diagonal hatching are walkable ground lying in the deep shadow cast by the stalls or trees right beside it (only a shadow on the ground, nothing overhead; a place where you could hide). Walkable areas must be clearly distinguishable from non-walkable objects at a glance: keep walkable ground open and plain (stone paving, packed earth, gravel), and give every non-walkable object a solid, readable shape. Do not draw the hatching or grid lines themselves.
Nothing may hang over the walkable ground: no awnings, roofs, tree branches, cables or lantern strings above the light areas. Tall things stay entirely inside the dark areas, so characters walking on the light areas are never hidden by anything.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, crates, lanterns on posts, a generator, a hand cart, masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only."""


def a11_room(scene):
    return f"""{STYLE}

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. Match the art style, colors and lighting of the attached map illustration (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light).
{scene}
{AE_TAIL}"""


AE_ROOMS = [
    ('部屋1：縁日の入口', 'fest2_gate', 'Scene: the entrance of a shrine festival. At the bottom, a wide stone-paved forecourt where you arrive (closed at the bottom by a low stone wall and shrubs). A straight stone-paved approach runs up the middle to the opening at the top edge. Do NOT draw a torii gate: the game places the torii as a separate picture over the approach just above the forecourt, so keep that part of the approach plain stone paving (a pair of stone komainu guardian lions may sit on the dark squares on both sides). Festival stalls with striped awnings line both sides of the approach; the hatched strips are the deep shadow beside them. A side path branches off to the left edge, toward the back of the stalls. At the upper right, a small dead-end nook behind the stalls.'),
    ('部屋6：社の森', 'fest2_woods', 'Scene: the quiet woods behind a small Japanese shrine on a summer night. At the very top edge, the front of a small wooden shrine building (partly cut off by the top edge) with a little offering box and a rope, in front of it a small open yard of gravel. In the center, a cross-shaped pond (the light-blue squares in the sketch) with STEPPING STONES running through it in a cross shape, surrounded by moss and stone. A gravel path loops around the pond between tall cedar trees and stone lanterns. Small side nooks at the left edge and the right edge (keep them open ground). The hatched strip at the left is in the deep shadow of the trees beside it. The festival lights glow faintly through the trees from the bottom, where the path leads down to the plaza.'),
]
for name, rid, scene in AE_ROOMS:
    add(name + '（届いた。このまま使う）', [AE_SK + f'room_{rid}.png', AE_MAP], f'map_{rid}.png', a11_room(scene))

# 2026-11-23：届いた屋台の裏・裏通り・広場・東の屋台は、マス目の下絵に合わせようとして、道を四角い生け垣で囲んだ迷路のような絵になり、
# しかも下絵からずれた（屋台が歩ける所に乗った）。「絵が先、マス目は後」に変えた：下絵を付けず、自然な風景として頼み、
# 届いた絵に Claude がマス目を合わせ、仕掛け・宝箱・敵を置き直す（docs/milestones/M3_explore_feel.md の 7.）
AE_REF = 'map_fest2_gate.png（届いた縁日の入口の絵）'
AE_FREE_TAIL = """Compose it as a believable, lived-in real place first, like a carefully hand-crafted map of a classic console JRPG, painted in this anime style. The walkable ground is simply the open ground between things: its edges are irregular and its width changes naturally (wider in front of stalls, narrow between crates or trees). Paths are shaped by stalls, tents, trees, fences, buildings, slopes and low stone retaining walls, NOT by neat hedges or curbs. Do not outline the paths with trimmed hedge walls, stone curbs or straight borders, and avoid a symmetrical, grid-like or maze-like layout. Add a little height variety (a few stone steps, a slope, a low wall) and small natural details on the non-walkable parts (grass tufts, roots, stones, cables, buckets, cardboard boxes).
Still keep it readable as a game map: walkable ground must be clearly distinguishable from non-walkable things at a glance, and every non-walkable thing has a solid, readable shape.
Nothing may hang over the walkable ground: no awnings, roofs, tree branches, cables or lantern strings above it, so characters walking there are never hidden.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, wooden crates with cloths, lanterns on posts, a generator, a hand cart, fox masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds. Leave plain open ground where the text says one of them will stand.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only."""


def a11_room_free(scene, exits):
    return f"""{STYLE}

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). No people and no characters. Match the art style, colors and lighting of the attached map illustration exactly (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light).
Camera: ONE consistent three-quarter top-down view for everything in the image, like a classic console JRPG map: the camera looks down at about 50 degrees from the bottom of the image, so every object shows its top and its front side (the side facing the bottom of the image). Every tent, building, wall, stair, fence and crate is drawn from exactly this same angle and direction; nothing is seen from the side, from a different angle or in a different perspective. Vertical edges stay vertical, no wide-angle distortion.
Scale: a square grid of 24 by 24 steps will be laid over the image later. One step is about one person's shoulder width, about the size of one beer crate; a stall tent is about 3 steps wide, a door about 1 step wide. Keep every object at this one consistent scale.
Density: a real place is cramped and cluttered. Open ground is mostly 2 to 4 steps wide, with at most one small open space; things stand along the paths and in clusters, not only pushed against the edges of the image, and no large empty areas. Every thing has a reason to be where it is (stacked where the stall keepers would put it, cables running from a stall to where power is needed).
{scene}
Exits: {exits} Every other edge of the image is closed (trees, fences, stalls or buildings), with no other way out.
{AE_FREE_TAIL}"""


AE_FREE = [
    ('部屋2：屋台の裏（作り直し）', 'fest2_backyard',
     'Scene: the cramped, messy backyard behind the festival stalls, where the stall keepers store their things. Packed earth, puddles, cables on the ground, piles of folding tables, beer crates and tarps.\n'
     'Upper left: a small storage corner with the backs of three small tents in a row against the trees: a BLUE tent, a RED tent and a YELLOW tent (left to right). In front of each tent, leave a small patch of open ground (the game puts a wooden crate beside each tent).\n'
     'Center: an open clearing where the stall keepers work, with open ground in its middle (the game puts a small generator there). Thick power cables run from the clearing down toward the bottom part.\n'
     'Bottom: a dark, quiet side area beyond the clearing, a path that loops around a big pile of stall equipment under tarps (the festival lights do not reach here). At the far left end of this loop, a short dead end against an old wooden fence (the game puts a broken garden gate there).\n'
     'Left side: a strip in the deep shadow of a hanging tarp wall, where you could hide.',
     'one opening at the middle of the right edge (back to the festival entrance) and one opening at the top edge a little right of the center (to the back alley).'),
    ('部屋3：屋台の裏通り（作り直し）', 'fest2_lane',
     'Scene: narrow, winding back alleys behind the festival stalls, between the rear walls of stalls, stacked paper lantern boxes, coolers, folding chairs and tarps, with trees in the gaps.\n'
     'The alleys form ONE big loop around a block of stalls in the middle, so you can walk around it either way.\n'
     'Left side of the loop: a long, gentle downhill slope paved with old stones, going down from the top left toward the bottom (show the slope with a ramp and a few low steps). The top of the slope is a small flat spot (the game puts a hand cart there). At the foot of the slope, the alley is closed by a wall of old boards (the game draws it), so at first you must walk around the long way.\n'
     'Upper right: a short dead-end alley, ending in a quiet corner (the game puts a fox mask on the ground there).\n'
     'Middle: a small shadowy rest corner tucked into the block of stalls, open to the left part of the loop, with a few folding chairs.',
     'one opening at the bottom edge a little left of the center (down to the backyard) and one opening at the right edge a little below the center (to the festival plaza). No opening at the top edge.'),
    ('部屋4：縁日の広場（作り直し）', 'fest2_plaza',
     'Scene: the lively central plaza of the shrine festival, the most festive place in the area. A wide, roughly round open plaza of old stone paving and packed earth, its edges shaped by festival stalls, trees and a low stone wall, not by straight borders.\n'
     'Lower center: a tall wooden yagura (festival drum tower) wrapped in red-and-white cloth, with a big drum and paper lanterns hanging on the tower itself. Leave open ground on its left, on its right and just below it (the game puts three lanterns on posts there).\n'
     'Top center: old stone steps climbing up through the trees toward the shrine woods, with a small open space at their foot (a resting spot).\n'
     'Lower right: a narrow side passage between a stall and the trees, leading to a small hidden nook behind the yagura (the game blocks the passage with a crowd of people at first).\n'
     'Upper left: a quiet corner in the deep shadow of a stall, where you could hide. Stalls stand around the edge of the plaza, never in the middle of the open ground.',
     'one opening at the bottom edge in the center (to the entrance), the stone steps at the top edge in the center (to the woods), one opening at the left edge a little below the middle (to the back alley) and one opening at the right edge a little below the middle (to the east stalls).'),
    ('部屋5：東の屋台（作り直し）', 'fest2_east',
     'Scene: a busy, crooked side street of the shrine festival, lined with stalls, with trees and the backs of old houses behind them.\n'
     'Top: a row of four small stalls along the top, facing down onto the street (draw only their roofs and back walls; the game puts their front counters at the street side). In front of them, the street is wide open ground.\n'
     'Center: a shooting gallery stall with targets, and below it a goldfish-scooping stall with a wide blue water tank. Between and behind these two stalls, a small hidden backyard of packed earth, reached only through a narrow gap from the left (the game closes the gap with boards at first).\n'
     'The street loops all the way around the two middle stalls. At the bottom right, the street ends in a quiet dead end with a little open space (a strong guardian waits there).\n'
     'A strip in the deep shadow of a stall on the left of the street and another on the right, where you could hide.',
     'only one opening, at the left edge a little below the middle (back to the plaza). No opening at the top, the right or the bottom edge.'),
]
for name, rid, scene, exits in AE_FREE:
    add(name, [AE_REF], f'map_{rid}.png', a11_room_free(scene, exits), '下絵は付けない。添付は、届いた縁日の入口の絵（絵柄をそろえるため）')


# ---- AF. 地面の絵と部品（段階273 の試し） ----
section('AF. 地面の絵と部品で組む部屋（段階273 の試し：屋台の裏）', '1枚絵に歩ける所を後から合わせると、細かい所で物の上を歩けてしまった（2026-11-23 開発者）。部屋を「物のない地面の絵」と「1つずつの部品（白い背景）」に分け、Claude が組み立てる。通れない所は部品の足もとから決まり、奥・手前の重なりも正しくなる。まず屋台の裏の1部屋で試す（`docs/milestones/M3_explore_feel.md` の 8.）。添付は、届いた屋台の裏の絵（`map_fest2_backyard.png`。絵柄と色をそろえるため）')
AF_REF = 'map_fest2_backyard.png（届いた屋台の裏の絵）'
AF_CAM = """Camera: ONE consistent three-quarter top-down view, exactly the same as the attached map illustration: the camera looks down at about 50 degrees from the bottom of the image, every object shows its top and its front side (the side facing the bottom of the image), vertical edges stay vertical, no wide-angle distortion. Match the attached illustration's art style, colors and dusk lighting exactly (warm lantern light, soft shadows falling toward the bottom right)."""


def af_parts(rows, cols, cells, extra=''):
    lines = '\n'.join(f'- Row {i // cols + 1}, column {i % cols + 1}: {c}' for i, c in enumerate(cells))
    return f"""{STYLE}

A sheet of separate map objects (parts) for a top-down 2D RPG map on mobile. The game places each part one by one on top of a ground illustration, so every part is drawn alone, complete and uncropped.
{AF_CAM}
Layout: a grid of {rows} rows by {cols} columns on a plain pure white background, every cell the same size, one object centered in each cell with clear white space around it. Objects never touch each other or the cell edges. No ground under the objects except a small soft contact shadow directly beneath each one. No people, no letters or numbers anywhere.
Scale: all objects on this sheet share one consistent scale: one step (one grid square of the map) is about one person's shoulder width, about the size of one beer crate.
{lines}{extra}"""


add('地面の絵：屋台の裏（物を置かない地面だけ）', [AF_REF], 'ground_fest2_backyard.png', f"""{STYLE}

Ground illustration for a top-down 2D RPG map on mobile. Square 1:1 image (1024×1024). This is ONLY the ground layer: the game will place all the objects (tents, crates, sheds, piles, barrels) on top of it later as separate pictures.
{AF_CAM}
Scene: the ground of a cramped backyard behind the festival stalls of a Japanese summer shrine festival at dusk. Packed earth with small gravel, a few shallow puddles reflecting the dusk sky, tufts of grass along the edges, two thick black power cables lying on the ground and curving from the upper middle down to the lower part.
Across the lower third of the image, a low old stone retaining wall (about knee high) runs from the left edge to the right edge, with a short flight of stone steps in it a little right of the center, so the bottom part of the ground is one step lower and darker.
Edges: the image is framed by dense trees and bushes along the top, the left and the bottom edges, and an old wooden fence along the right edge, EXCEPT two openings: a narrow dirt path leaving through the top edge a little right of the center, and a dirt path leaving through the right edge just above the middle.
Keep everything inside the frame open, flat ground: absolutely NO tents, stalls, crates, boxes, tables, chairs, sheds, buildings, barrels, coolers, tarps, fences inside the area, people or lanterns. Absolutely no letters or text anywhere.""", '試しの1枚目。地面と、縁の木・塀だけ')
add('部品1：屋台の裏の大きな物', [AF_REF], 'parts_backyard1.png', af_parts(3, 3, [
    'the back of a small BLUE festival tent (a pop-up canopy tent with blue sheet walls, seen from behind), about 3 steps wide.',
    'the same kind of tent in RED, the same size.',
    'the same kind of tent in YELLOW, the same size.',
    'a big pile of stall equipment covered with a blue tarp tied with rope, with folding tables, a barrel and a cooler at its sides, about 7 steps wide and 3 steps deep (let it fill the cell width).',
    'a small old wooden storage shed with a grey tiled roof and a closed wooden door, about 3 steps wide.',
    'a corner of an old Japanese wooden house with a tiled roof and one warmly lit window, about 4 steps wide.',
    'a stack of folding tables and folded metal chairs leaning together, about 2 steps wide.',
    'a stack of cardboard boxes and wooden crates, about 2 steps wide.',
    'a blue tarp thrown over a small table, about 2 steps wide.',
]), '地面の絵がうまくいったら')
add('部品2：屋台の裏の小さな物', [AF_REF, 'parts_backyard1.png（上で作った絵）'], 'parts_backyard2.png', af_parts(3, 4, [
    'a stack of red plastic beer crates (two high).',
    'a stack of yellow plastic beer crates (two high).',
    'two metal beer kegs side by side.',
    'a blue-and-white picnic cooler box.',
    'a metal drum barrel.',
    'two metal buckets.',
    'a coil of rope.',
    'a few bamboo poles and long wooden boards leaning against nothing, standing upright in a small bundle.',
    'a short section of old wooden fence, horizontal, about 3 steps wide.',
    'a short section of old wooden fence seen from the side (running from top to bottom of the cell), about 3 steps long.',
    'a small low bush with a few yellow-green leaves.',
    'a moss-covered rock.',
], ' Match the attached parts sheet exactly in scale, view and style.'))

# ---- AG. 残りの5部屋の地面の絵と部品（段階274） ----
section('AG. 残りの5部屋の地面の絵と部品（段階274）', '屋台の裏の試し（段階273）が「とてもいい感じ」だった（2026-11-23 開発者）ので、残りの5部屋も地面の絵と部品で組む。添付は、どれも届いた屋台の裏の地面の絵（`ground_fest2_backyard.png`）と部品の絵（`parts_backyard1.png`）。絵柄・角度・大きさをそろえるため。部品は白い背景のまま送ってくれればよい。屋台の裏の部品（テント・箱・樽など）は使い回すので、ここには新しい物だけ')
AG_REF = ['ground_fest2_backyard.png（届いた屋台の裏の地面の絵）', 'parts_backyard1.png（届いた屋台の裏の部品の絵）']


def ag_ground(scene):
    return f"""{STYLE}

Ground illustration for a top-down 2D RPG map on mobile. Square 1:1 image (1024×1024). This is ONLY the ground layer: the game will place all the objects (stalls, tents, trees, lanterns, people) on top of it later as separate pictures. Match the attached ground illustration exactly in art style, camera angle, scale, colors and dusk lighting.
{AF_CAM}
{scene}
Keep everything inside the frame open ground: absolutely NO stalls, tents, crates, boxes, tables, benches, lanterns on posts, stone lanterns, guardian statues, free-standing trees inside the area, buildings inside the area, people or text. Absolutely no letters or text anywhere."""


add('地面の絵：縁日の入口', AG_REF, 'ground_fest2_gate.png', ag_ground(
    'Scene: the entrance of a summer shrine festival at dusk. A straight stone-paved approach (about 6 steps wide) runs from a wide stone-paved forecourt at the bottom up through the middle to the top edge, where it leaves the image. About 9 steps from the bottom, a side path of packed earth branches off to the LEFT and leaves through the left edge. Along both sides of the approach, strips of packed earth (about 3 steps wide) where the stalls will stand. A small dead-end nook of packed earth at the upper right. The forecourt at the bottom is closed by a low stone wall with shrubs along the bottom edge. The rest of the edges are dense trees and bushes.'))
add('地面の絵：屋台の裏通り', AG_REF, 'ground_fest2_lane.png', ag_ground(
    'Scene: narrow winding back alleys of packed earth behind the festival stalls at dusk. The alleys make ONE big loop around a large empty block of packed earth in the middle (where the stalls will stand). The left side of the loop is a long gentle downhill slope paved with old stones with a few low steps, running from the top left down to the bottom left, between a low mossy stone wall on its left and a strip of packed earth on its right. Exits: a path leaves through the bottom edge a little left of the center, and another through the right edge a little below the middle. The top edge, the left edge and the rest of the edges are dense trees and old wooden fences. A short dead-end alley at the upper right.'))
add('地面の絵：縁日の広場', AG_REF, 'ground_fest2_plaza.png', ag_ground(
    'Scene: the central plaza of a summer shrine festival at dusk: a wide, roughly round open plaza of old stone paving and packed earth, its edge irregular. At the top center, old stone steps (about 4 steps wide) climb up and leave through the top edge toward the shrine woods. Paths leave through the bottom edge in the center, the left edge a little below the middle and the right edge a little below the middle. Around the plaza, strips of packed earth where the stalls will stand. The corners and the rest of the edges are dense trees and bushes.'))
add('地面の絵：東の屋台', AG_REF, 'ground_fest2_east.png', ag_ground(
    'Scene: a crooked side street of packed earth at a summer shrine festival at dusk. The street makes ONE loop around a large empty block of packed earth in the middle (where two big stalls will stand), with a wide part along the top. At the bottom right, the street ends in a small quiet open dead end. Only one exit: a path leaves through the left edge a little below the middle. Along the top edge, a strip of packed earth where a row of stalls will stand, and behind it, the dark tiled roofs of old houses along the very top edge. The bottom edge is the tiled roofs of old houses and bushes; the right edge is trees and an old wooden fence.'))
add('地面の絵：社の森', AG_REF, 'ground_fest2_woods.png', ag_ground(
    'Scene: the quiet grove behind a small Japanese shrine on a summer night, the ground of gravel and moss. At the very top center, the front of a small wooden shrine building with an offering box and a straw rope, partly cut off by the top edge (this building IS part of the ground picture). In front of it, a gravel yard. In the center, a cross-shaped pond with STEPPING STONES running through it in a cross (part of the ground picture), with mossy stones along its banks. A gravel path loops around the pond. A small side nook at the left edge and one at the right edge, both open gravel. The path leaves through the bottom edge in the center, down toward the festival. The rest of the edges are the dark trunks and roots of tall cedar trees and bushes (but no free-standing trees inside the area).'))
add('部品3：屋台と石の物', AG_REF, 'parts_fest_a.png', af_parts(3, 3, [
    'a festival food stall seen from the FRONT (its counter facing the viewer), with a RED-and-white striped awning, a wooden counter, a few blank paper lanterns hanging from the awning (no letters), about 3 steps wide.',
    'the same kind of stall with a BLUE-and-white striped awning, the same size.',
    'the same kind of stall with a GREEN-and-white striped awning, the same size.',
    'the BACK of a festival stall (seen from behind): a plain tarp back wall, wooden frame, a few boxes stacked against it, about 3 steps wide.',
    'a stone komainu guardian lion on a stone pedestal, facing RIGHT, about 1 step wide.',
    'the same stone komainu guardian lion facing LEFT (mirror pose, mouth closed).',
    'a traditional stone lantern (ishidoro) with a warm light glowing inside, about 1 step wide and 2 steps tall.',
    'a tall cedar tree with a thick trunk and dark green layered foliage, about 3 steps wide (let it fill the cell height).',
    'a round leafy deciduous tree with yellow-green leaves lit by dusk light, about 3 steps wide (let it fill the cell height).',
]), '地面の絵がそろってからでよい')
add('部品4：大きな屋台とやぐら', AG_REF, 'parts_fest_b.png', af_parts(2, 2, [
    'a tall wooden yagura festival drum tower wrapped in red-and-white cloth, with a big taiko drum on its upper stage and paper lanterns hanging on the tower itself, about 4 steps wide (let it fill the cell height).',
    'a shooting gallery stall (shateki) seen from the front: a red-and-white striped awning, a shelf of small prizes and targets at the back, a counter with toy cork guns, about 5 steps wide (let it fill the cell width).',
    'a goldfish-scooping stall (kingyo-sukui) seen from the front: a blue awning and a wide shallow blue water tank with small red goldfish, about 5 steps wide (let it fill the cell width).',
    'a row of two old Japanese wooden houses with dark tiled roofs and warmly lit windows, seen from the front, about 6 steps wide (let it fill the cell width).',
], ' Match the attached parts sheet exactly in scale, view and style.'))
add('部品5：小さな物と草木', AG_REF, 'parts_fest_c.png', af_parts(3, 4, [
    'a stack of wooden boxes for paper lanterns, with a few folded paper lanterns on top.',
    'a simple wooden bench.',
    'a blank wooden signboard on two legs (no letters).',
    'a low bush of blue hydrangea flowers.',
    'a short section of low mossy stone wall, horizontal, about 3 steps wide.',
    'a short section of bamboo fence, horizontal, about 3 steps wide.',
    'a small wooden offering box with a straw rope above it, about 1 step wide.',
    'a tall bundle of bamboo stalks with leaves (a small bamboo thicket), about 2 steps wide.',
    'a big moss-covered rock, about 2 steps wide.',
    'a cluster of tall grass and fern.',
    'a wooden water barrel with a ladle.',
    'two folding chairs and a small folding table.',
], ' Match the attached parts sheet exactly in scale, view and style.'))

# 一覧に手で書いて頼んだ絵（指示文は台帳 src/data/assets.ts と、git の履歴の docs/ART_QUEUE.md に残っている）
MANUAL_DONE = [
    '- **W. 拠点のメニューの絵（段階226・227）**（6 枚）：砂の底（横長の帯）、星図・武器・ライブラリ・交換所・落とし物（縦長）。ムーブメント・アルバム・編成・町の小話の縦長は、今の横長の絵を使い回すと決めたので作らない（2026-11-17 開発者と）',
    '- **X. 寄り道の町の人と寄り道のタイル**（4 枚。2026-11-17）：五郎（八百屋の主人）、善次（時計屋の常連）、初江（駄菓子屋のおばあさん）、拠点のタイル「寄り道」（縦長）',
]


def main():
    """未対応の絵を上に、指示文つきで並べる。済んだ絵は下に名前だけ（指示文はこのファイルと台帳 src/data/assets.ts に残っている）"""
    pending = [(title, note, [it for it in items if it[2] not in DONE]) for title, note, items in ITEMS]
    pending = [p for p in pending if p[2]]
    # 今いちばん急ぐ章を上に（段階270：新しい1-1 の絵）
    pending.sort(key=lambda p: 0 if p[0].startswith('AG.') else 1 if p[0].startswith('AF.') else 2 if p[0].startswith('AE.') else 3)
    n_left = sum(len(items) for _, _, items in pending)
    n_done = sum(1 for _, _, items in ITEMS for it in items if it[2] in DONE)
    out = ['# 絵の「そのまま貼る一覧」', '',
           f'**まだの絵：{n_left} 枚**（済んだ絵 {n_done} 枚は、いちばん下に名前だけ）。上から順に作る。**1つの枠が1枚**。', '',
           '- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）',
           '- できた絵は「保存名」の名前で保存して、まとめて Claude に送る（Claude は、立ち絵の背景を抜いた後に `scripts/shrink_portraits.py` で縮め、差分は `scripts/portrait_parts.py` で作る）。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする',
           '- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい',
           '- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる（届いた絵は DONE に足すと、下の「済んだ絵」に移る）',
           '- まだ一覧にない物：探索の地図を見回る2頭身のカイ（`docs/ART.md` の 5-8 の 4.。歩く二頭身のハルトがうまくいってから）。',
           '', '## まだの絵', '']
    for title, _, items in pending:
        out.append(f'- [{title}](#{anchor(title)})：{len(items)} 枚')
    out.append('')
    n = 0
    for title, note, items in pending:
        out += [f'### {title}', '']
        if note:
            out += [note, '']
        for name, attach, save, prompt, memo in items:
            n += 1
            out += [f'#### {n}. {name}', '']
            out.append(f'- 添付：{"、".join(f"`{a}`" for a in attach) if attach else "なし"}')
            out.append(f'- 保存名：`{save}`')
            if memo:
                out.append(f'- メモ：{memo}')
            out += ['', '```', prompt, '```', '']
    out += ['## 済んだ絵', '', '届いてゲームに入れた絵（指示文は `scripts/art_queue.py` と台帳 `src/data/assets.ts`）。', '']
    for title, _, items in ITEMS:
        done = [it for it in items if it[2] in DONE]
        if done:
            out.append(f'- **{title}**（{len(done)} 枚）：' + '、'.join(it[0] for it in done))
    out += MANUAL_DONE
    out.append('')
    with open('docs/ART_QUEUE.md', 'w') as f:
        f.write('\n'.join(out))
    print(f'docs/ART_QUEUE.md：まだ {n_left} 枚、済 {n_done} 枚')


def anchor(title):
    """GitHub の見出しの飛び先（英数字・かな漢字はそのまま、記号は消し、空白は -）"""
    import re
    return re.sub(r'[\s]+', '-', re.sub(r'[^\w\s\-ぁ-んァ-ヶー一-龠々〜]', '', title.lower()))


if __name__ == '__main__':
    main()
