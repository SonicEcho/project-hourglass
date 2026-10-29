# 絵の「そのまま貼る一覧」（2026-10-25）

ChatGPT Plus で、待っている絵をまとめて作るための一覧。**1つの枠が1枚**。上から順に作る。

- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）
- できた絵は「保存名」の名前で保存して、まとめて Claude に送る。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする
- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい
- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる
- まだ一覧にない物：ひなののまばたき・口パク（Gemini。ART.md の 5-8 の 1）、昼の町の地図と2頭身の歩くハルト・カイ（5-8 の 2〜4）、表情違い（Gemini。5-3 の 14）

全部で 118 枚。

- A. 小夜子（ヒロイン）（2枚。済 2）
- B. 3章の人（9枚。済 9）
- C. 2章の残りの人（7枚。済 7）
- D. 敵（32枚。済 32）
- E. 部屋の地図（39枚。済 38）
- F. 会話の背景（14枚）
- G. 1枚絵（1枚）
- H. スナップの写真（14枚）

## A. 小夜子（ヒロイン）

見た目はまだ決まっていない。下の設定画の文は、脚本（`docs/script/3-matsuri.md` の 2.：大正10年の夏、16歳、旧家の娘、浴衣に赤い鼻緒の下駄、月の形の簪）から書いたたたき台。設定画を見て、髪・浴衣の色・柄を決めてから、胸から上の1枚を作る

### 1. 小夜子の設定画（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`sayoko_sheet.png`
- メモ：気に入るまで作り直してよい。決まったら、この設定画を下の1枚に添付する

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Character design sheet of an original anime-style girl for a mobile turn-based JRPG, full body front view, standing in a graceful pose, plain off-white background, clean lineart with soft cel shading, teenage proportions about 6.5 heads tall. Same art style as the attached reference portrait.
Character: Sayoko, a 16-year-old daughter of an old, strict family in a Japanese town in the summer of 1921 (Taisho era), who has secretly slipped out alone to the summer shrine festival on her first free night. Graceful and polite, with a slightly old-fashioned elegance, but bursting with curiosity, a playful sparkle in her eyes. Underneath, a quiet sadness, as if she has already accepted that her night will end.
Hair: long straight black hair, half-up and pinned with a small silver hairpin shaped like a crescent moon, the rest falling down her back, neat blunt bangs.
Eyes: large dark eyes with a soft reddish-brown tint, long lashes.
Outfit: a deep indigo summer yukata with a pattern of white bellflowers (kikyo) and a few pale glowing fireflies, a crimson obi, wooden geta sandals with bright red straps (hanao), a small drawstring pouch (kinchaku) on her wrist. Everything appropriate for the Taisho era, no modern items.
Color palette: hair #1E1A24, yukata #24305A, flowers #F2F0E6, obi #B8323C, red straps #D23A3A, moon hairpin #D8DCE8, skin #F6E0CF.
Additional views on the same sheet: back view, 4 facial expressions (gentle smile, curious wide-eyed delight, quiet lonely smile, surprised), close-up of the crescent moon hairpin.
Absolutely no letters, numbers or text anywhere.
```

### 2. 小夜子の胸から上の基本の1枚（微笑み）（済）

- 添付：`sayoko_sheet.png（上で決めた設定画）`、`public/assets/portraits/akari_smile.webp`
- 保存名：`sayoko_smile.png`
- メモ：表情違い（笑顔・通常・考える・驚き・真剣・さみしげ・照れ・泣き笑い）は Gemini で（`docs/ART.md` の 5-3 の 14）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, graceful smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Sayoko. Keep her design exactly as in the attached character sheet: long straight black hair half-up with a small silver crescent moon hairpin, blunt bangs, large dark eyes with a soft reddish-brown tint, a deep indigo yukata with white bellflowers and a crimson obi.
```

## B. 3章の人

「写し」の人は、ゲームの中でセピアに色を付けるので、ふつうの色で作る。見本は構図をそろえるため（大人・中高生はあかりの笑顔、子どもは子どものあかり）

### 3. ちよ（今75歳。ひだまり荘）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`chiyo_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, refined smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Chiyo, a 75-year-old Japanese woman living in a small care home in a quiet regional town. Elegant and polite, a warm but slightly lonely smile. Short soft white hair neatly permed, small gold-rimmed glasses, a pale lavender knitted cardigan over a cream blouse, a thin silver chain. She once worked in a Tokyo electronics factory at fifteen; her hands are small and careful.
```

### 4. のぼる（今68歳。ちよの弟）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`noboru_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, an easygoing, warm grin.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Noboru, a 68-year-old Japanese man from a mountain farming village, Chiyo's younger brother, visiting the town. Sun-tanned, weathered face, short gray crew-cut hair, kind crinkled eyes, a slightly gap-toothed grin. A faded checked work shirt with rolled sleeves under a plain gray vest. Laid-back and unhurried, a simple countryman.
```

### 5. 写しのちよ（昭和41年、15歳）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`past_chiyo_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a bright, slightly forced cheerful smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: young Chiyo, a 15-year-old Japanese girl in the summer of 1966, coming home to her mountain village for the first time after starting factory work in Tokyo. Keep a face that could grow into a gentle, refined old woman. Black hair in two short braids, a crisp white short-sleeve blouse, a navy skirt. She acts cheerful and grown-up, but her eyes are a little homesick.
```

### 6. 写しの菊（ちよとのぼるの母。昭和41年、40歳くらい）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`past_kiku_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, quiet expression with her mouth firmly closed.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Kiku, a Japanese farming woman around 40 in the summer of 1966, a widow who works her mountain fields alone. Sun-tanned skin, strong hands, black hair tied back tightly under a faded indigo cotton head scarf (tenugui), a dark indigo work kimono top with tied-back sleeves. Few words and blunt manners, but deep, steady eyes that care.
```

### 7. 写しののぼる（昭和41年、8歳）（済）

- 添付：`public/assets/portraits/young_akari_smile.webp`
- 保存名：`past_noboru_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a huge excited grin.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the little girl in the yukata, with the same childlike proportions.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: young Noboru, an 8-year-old Japanese village boy in the summer of 1966, overjoyed that his big sister is coming home. Very short buzz-cut black hair, sun-tanned skin, a scraped nose, a plain white sleeveless undershirt (running shirt) and a straw hat hanging on his back.
```

### 8. しおり（今22歳。印刷会社の一年目）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`shiori_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a bright, slightly flustered smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Shiori, a 22-year-old Japanese woman in her first year at a small local printing company in a quiet regional town. Short neat dark-brown bob with one side tucked behind her ear, lively eyes, a talkative, quick face. A light beige cardigan over a white collared blouse, a plain staff lanyard (blank card, no letters).
```

### 9. とうや（今22歳。鉄道の保線の仕事）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`toya_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, easygoing smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Toya, a 22-year-old Japanese man who works on railway track maintenance. Slightly messy black hair, sleepy relaxed eyes, a gentle, laid-back face. A dark navy work jacket with a reflective stripe over a gray T-shirt, no logos. The kind of person who listens to the end before he speaks.
```

### 10. 写しのしおり（平成31年3月、15歳）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`past_shiori_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a teasing smile, trying to hide that she is embarrassed.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: young Shiori, a 15-year-old Japanese middle school girl on her graduation day in March 2019, the same person as the 22-year-old office worker. Short dark-brown hair, a navy sailor-style school uniform with a red scarf, a small corsage of paper flowers with a ribbon pinned on her chest (graduation). Sharp-tongued to hide her shyness.
```

### 11. 写しのとうや（平成31年3月、15歳）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`past_toya_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a soft, easygoing smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: young Toya, a 15-year-old Japanese middle school boy on his graduation day in March 2019. Slightly messy black hair, relaxed eyes. A black gakuran school uniform whose buttons were almost all taken by younger students as keepsakes; only the second button from the top is still there. A corsage of paper flowers on his chest, one white earbud cable hanging from his collar.
```

## C. 2章の残りの人

写しのこうじ・写しのまさるは、こうじの立ち絵も添付する（顔を似せるため）

### 12. 写しのこうじ（平成10年、12歳）（済）

- 添付：`public/assets/portraits/young_akari_smile.webp`、`public/assets/portraits/koji_smile.webp`
- 保存名：`past_koji_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a nervous, unsure face, biting his lip.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the little girl in the yukata, with the same childlike proportions.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: young Koji, the same man as the attached adult portrait but 28 years earlier: a 12-year-old boy on a little league baseball team in the summer of 1998, always on the bench. Keep the same face features so he is clearly the same person. Short black hair, a slightly dirty white baseball uniform with navy trim that is a little too big for him, a baseball cap. No letters or numbers on the uniform or cap.
```

### 13. 写しのまさる（平成10年、40代。こうじの父）（済）

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/koji_smile.webp`
- 保存名：`past_masaru_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a big, warm, proud smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Masaru, Koji's father, a Japanese man in his 40s in the summer of 1998, a cheerful working dad watching his son's little league game. A face that resembles the attached portrait (his son as an adult), sun-tanned skin, short black hair, a faded polo shirt with a towel around his neck. No letters or logos.
```

### 14. まさる（今70歳くらい。こうじの父）（済）

- 添付：`public/assets/portraits/akari_smile.webp`、`past_masaru_smile.png（上で作った絵）`
- 保存名：`masaru_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a loud, cheerful grin.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Masaru, the same man as the attached portrait but about 28 years later: a Japanese man around 70, retired, who still comes to the riverside little league field every day with a plastic megaphone. Keep the same face features so he is clearly the same person. Short white hair, deep laugh lines, sun-tanned skin, a faded baseball cap pushed back, a light windbreaker. No letters or logos.
```

### 15. すみ（今77歳。銭湯「松の湯」の女将）（済）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`sumi_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a warm, cheerful smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Sumi, a 77-year-old Japanese woman who runs an old public bathhouse in a quiet regional town. Small and spry, gray hair tied in a low bun with a white hand towel (tenugui) over it, a white kappogi apron-smock over a dark kimono, bright energetic eyes.
```

### 16. 写しのすみ（昭和44年、22歳。番台の娘）（済）

- 添付：`public/assets/portraits/akari_smile.webp`、`sumi_smile.png（上で作った絵）`
- 保存名：`past_sumi_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a bright, lively smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: young Sumi, the same woman as the attached portrait but 57 years earlier: a 22-year-old daughter of a public bathhouse in the winter of 1969. Keep the same face features so she is clearly the same person. Black hair tied back under a white hand towel, rosy cheeks from the cold, a simple striped kimono with a dark half-coat (hanten).
```

### 17. だいち（今37歳。けんたのバンドのドラム）（済）

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/kenta_smile.webp`
- 保存名：`daichi_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a friendly, slightly awkward smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Daichi, a 37-year-old Japanese salesman, the former drummer of a high school band. Short neat black hair, a broad friendly face, a dark gray business suit with a loosened tie. Same art style and framing as the attached portrait of his old bandmate.
```

### 18. さき（今37歳。けんたのバンドのベース）（済）

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/kenta_smile.webp`
- 保存名：`saki_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a confident, warm smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Saki, a 37-year-old Japanese woman, the former bassist of a high school band, now a working mother. Shoulder-length wavy dark-brown hair, sharp but kind eyes, a soft gray cardigan over a simple dark top, small earrings. Teasing and straightforward. Same art style and framing as the attached portrait of her old bandmate.
```

## D. 敵

毎回、ブリキノイズの絵（`public/assets/enemies/tin_noise.webp`）を絵柄の見本として添付する。白い背景のまま送ってくれればよい（抜くのは Claude が `scripts/cutout_white.py` で行う）。ぬしは、部位がはっきり見えるように頼んでいる

### 19. 2-1 歯車ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`gear_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a lump of gears and mainsprings grinding against each other without meshing, charging forward
```

### 20. 2-1 ネジノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`screw_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a fast swarm of screws, nuts and bolts
```

### 21. 2-1 真空管ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`tube_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: an old vacuum-tube radio collapsing into noise, glowing tubes crackling with electricity
```

### 22. 2-1 そろばんノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`abacus_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a wooden abacus whose beads fly apart and float around it like a shield
```

### 23. 2-1 旋盤のぬし（ボス）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`lathe_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: a vortex of an old lathe, leather belts and metal shavings, a tool post like a blade, a small glowing brass gear at its center
```

### 24. 2-2 ガラケーノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`flip_phone_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a flock of old flip phones with antennas, screens flashing and ringing
```

### 25. 2-2 写真シールノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`sticker_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a swarm of small photo stickers peeling off and fluttering, decorated with sparkles and hearts (no faces, no letters)
```

### 26. 2-2 ラジカセノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`boombox_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a boombox with cassette tapes unspooling around it like ribbons, speakers blasting
```

### 27. 2-2 メトロノームノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`metronome_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a wooden metronome whose pendulum swings so fast it blurs
```

### 28. 2-2 アンプのぬし（ボス）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`amp_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: a tower of guitar amplifiers and speakers wrapped in tangled cables, one broken guitar string whipping around
```

### 29. 2-3 ボールノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`ball_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a fast swarm of baseballs with red stitches
```

### 30. 2-3 電子ペットノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`pet_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a small egg-shaped handheld digital pet toy with a tiny pixel creature on its screen (no logos)
```

### 31. 2-3 メガホンノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`megaphone_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a cluster of plastic cheering megaphones whose cheers have turned into angry roars
```

### 32. 2-3 水筒ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`jug_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a big sports water jug and ice water splashing around it
```

### 33. 2-3 スコアボードのぬし（ボス）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`scoreboard_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: a giant made of a wooden scoreboard, a backstop net and hundreds of megaphones, its score panels spinning endlessly (blank panels, no numbers)
```

### 34. 3-1 扇風機ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`fan_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: an old electric fan from the 1960s with chipped blades, spinning so fast it whips up wind
```

### 35. 3-1 蚊取り線香ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`coil_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a large green mosquito coil smoldering in a pig-shaped ceramic holder, its smoke curling into a spiral body with glowing embers
```

### 36. 3-1 トランジスタラジオノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`radio_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a small 1960s transistor radio with a round speaker grille and a tuning dial, its telescopic antenna whipping around, crackling static spilling out
```

### 37. 3-1 ちゃぶ台ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`table_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a round low wooden dining table (chabudai) with one broken leg, flipped on its side, teacups and rice bowls flying around it
```

### 38. 3-1 郵便ポストノイズ（番人）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`postbox_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a classic red cylindrical Japanese post box, its shape crumbling, envelopes of money sent home spilling out of its slot like a tongue (blank envelopes, no letters)
```

### 39. 3-1 汽車のぬし（ボス）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`train_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded green and orange). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: a huge black steam locomotive turning into a shadow of smoke and iron wheels, blocking a country station platform. Two clearly visible parts: a tall smokestack (chimney) at the upper left billowing thick black smoke, and big red-spoked iron driving wheels at the lower right
```

### 40. 祭りの夜 提灯ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`lantern_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a cluster of torn red paper lanterns, their flames flickering through the holes
```

### 41. 祭りの夜 風車ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`pinwheel_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a bunch of colorful paper pinwheels on bamboo sticks, spinning endlessly into a whirlwind
```

### 42. 祭りの夜 飴細工ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`candy_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a delicate amber candy sculpture of a crane, half melted and dripping, on a wooden stick
```

### 43. 祭りの夜 蓄音機ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`phonograph_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: an old gramophone with a large brass horn, a record spinning and skipping, musical notes made of sand pouring out (no letters)
```

### 44. 祭りの夜 やぐらのぬし（ボス）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`yagura_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (deep indigo night, lantern red and old gold). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: a giant tangle of a bon-odori festival tower (yagura), a big taiko drum and hundreds of paper lanterns, a hundred years of wear. Two clearly visible parts: a huge taiko drum at the upper center, and a thick rope strung with glowing lanterns across the lower right
```

### 45. 3-2 イヤホンノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`earphone_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a long tangle of white wired earphone cables coiling like snakes, two earbuds at the ends like heads
```

### 46. 3-2 自撮り棒ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`selfie_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: an extending selfie stick bending wildly, a smartphone with a cracked screen at its tip (blank screen, no logos)
```

### 47. 3-2 タピオカノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`tapioca_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a big clear plastic cup of tapioca milk tea with a thick straw, wobbly black tapioca pearls bouncing out
```

### 48. 3-2 卒業証書の筒ノイズ（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`diploma_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a black cylindrical diploma tube with its lid popped off, white paper sheets pouring out like a storm (blank paper, no letters)
```

### 49. 3-2 寄せ書きの色紙ノイズ（番人）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`yosegaki_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: dozens of square autograph boards (shikishi) swirling and overlapping, covered in colorful doodles and hearts (no readable letters)
```

### 50. 3-2 踏切のぬし（ボス）（済）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`crossing_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright pastel and light blue). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: a giant made of railroad crossing signals, dozens of flashing red warning lights stacked on top of each other, and many black-and-yellow crossing gate arms stretching out and never rising. Two clearly visible parts: the cluster of warning lights with a crossing bell at the upper center, and the long crossing gate arms reaching out to the lower left
```

## E. 部屋の地図

毎回、その部屋の配置の下絵（`docs/sketches/room_layouts/room_<部屋>.png`）と、絵柄の見本の地図を添付する。下絵の明るい所が歩ける所。1-1 は縁日の地図、1-2 は商店街の地図、2-2 以降は、その区画で最初にできた部屋の絵を見本にする（なければ縁日の地図）

### 51. 1-1 参道の入口（済）

- 添付：`docs/sketches/room_layouts/room_fest_gate.png`、`public/assets/maps/festival.webp`
- 保存名：`map_fest_gate.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the entrance approach of a small Japanese shrine festival at summer dusk in the late Heisei era, warm lantern light, a red torii gate at the bottom, festival stalls with striped awnings and paper lanterns along both sides of the stone-paved approach.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 52. 1-1 屋台の裏（済）

- 添付：`docs/sketches/room_layouts/room_fest_backyard.png`、`public/assets/maps/festival.webp`
- 保存名：`map_fest_backyard.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the backyard behind festival stalls at summer dusk in the late Heisei era, warm lantern light: stacked lantern boxes, a small generator, cables on the ground, plastic crates and a water tank, a narrow dead end at the top left.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 53. 1-1 屋台の裏通り（済）

- 添付：`docs/sketches/room_layouts/room_fest_west.png`、`public/assets/maps/festival.webp`
- 保存名：`map_fest_west.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: narrow back alleys winding between the rear sides of festival stalls at summer dusk in the late Heisei era, warm lantern light, tarps, folding tables, coolers and stacked paper lanterns.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 54. 1-1 射的と金魚すくいの通り（済）

- 添付：`docs/sketches/room_layouts/room_fest_east.png`、`public/assets/maps/festival.webp`
- 保存名：`map_fest_east.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a side street of a shrine festival at summer dusk in the late Heisei era, warm lantern light: a shooting gallery stall at the top, a long winding path, and a goldfish-scooping stall with a wide blue water tank at the bottom right dead end.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 55. 1-1 社の裏の林（済）

- 添付：`docs/sketches/room_layouts/room_fest_woods.png`、`public/assets/maps/festival.webp`
- 保存名：`map_fest_woods.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a small grove behind a Japanese shrine on a summer night, a narrow dirt path winding between tall cedar trees, stone lanterns and moss, festival lights glowing faintly through the trees.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 56. 1-2 左の路地裏（済）

- 添付：`docs/sketches/room_layouts/room_showa_alley.png`、`public/assets/maps/showa_street.webp`
- 保存名：`map_showa_alley.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: narrow back alleys behind the shops of a small Japanese shopping street at summer dusk in 1988, warm sepia-tinted retro colors: wooden fences, stacked beer crates and empty ramune bottles, old bicycles, laundry poles, a stray cat on a wall.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 57. 1-2 右の電器屋の裏通り（済）

- 添付：`docs/sketches/room_layouts/room_showa_lane.png`、`public/assets/maps/showa_street.webp`
- 保存名：`map_showa_lane.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a winding back lane behind an old electronics shop at summer dusk in 1988, warm sepia-tinted retro colors: discarded CRT televisions and radios stacked by the back door, tangled antenna cables, a small storage shed, potted plants, and a dead end with a little vacant lot at the bottom right.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 58. 1-2 坂の上の先（済）

- 添付：`docs/sketches/room_layouts/room_showa_hill.png`、`public/assets/maps/showa_street.webp`
- 保存名：`map_showa_hill.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the top of a gentle slope above a small Japanese town at summer sunset in 1988, warm sepia-tinted retro colors: a narrow paved road winding between old houses with tiled roofs and stone walls, utility poles with wires, a small bus stop bench and a vending machine, the evening sun glowing over the rooftops.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 59. 2-2 校門の前庭

- 添付：`docs/sketches/room_layouts/room_school_gate.png`、`public/assets/maps/festival.webp`
- 保存名：`map_school_gate.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the front yard just inside the gate of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.
Bottom center: the school gate with a hand-made decorated festival arch of paper flowers and balloons (blank, no letters), the path entering from the bottom edge. A wide paved front yard with flower beds at the upper corners and two small flower beds in the middle, bicycles and a few festival guide boards (blank). A path leaves the yard straight up through the top edge toward the courtyard.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 60. 2-2 模擬店の中庭（済）

- 添付：`docs/sketches/room_layouts/room_school_courtyard.png`、`map_school_gate.png（上で作った絵）`
- 保存名：`map_school_courtyard.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the school courtyard of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.
Rows of student food stalls with colorful tents and folding tables along both sides (four small tent blocks as in the sketch), paper lanterns and garlands strung overhead. In the middle, a big tree with a round bench around it, and a wooden bench just below-left of the tree. Paths lead out through the bottom edge (to the gate), the top edge (to the school building) and the left edge (to the bicycle parking).
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 61. 2-2 駐輪場（済）

- 添付：`docs/sketches/room_layouts/room_school_bikes.png`、`map_school_gate.png`
- 保存名：`map_school_bikes.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the bicycle parking area behind a Japanese high school building on a bright autumn afternoon in 2006, bright pastel and light blue colors.
Four long rows of student bicycles in metal racks under a thin roof, with small gaps between them so you can weave through, as in the sketch. A wide path comes in from the right edge through the middle. Fallen ginkgo leaves, a vending machine against the wall, a dead-end corner at the top left.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 62. 2-2 渡り廊下と音楽室の前（済）

- 添付：`docs/sketches/room_layouts/room_school_corridor.png`、`map_school_gate.png`
- 保存名：`map_school_corridor.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: an open-air roofed walkway between school buildings of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.
A wide walkway crosses the lower half from the bottom edge and turns right toward the right edge. On the upper left, a corridor runs in front of the music room with its windows and sliding door (a few music stands and instrument cases by the door). A straight path leads up through the top edge to the gymnasium. Posters on the walls are blank.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 63. 2-2 お化け屋敷の教室（済）

- 添付：`docs/sketches/room_layouts/room_school_classroom.png`、`map_school_gate.png`
- 保存名：`map_school_classroom.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a classroom turned into a haunted house attraction for a Japanese high school festival in 2006, seen from above with the ceiling removed, dim purple and light blue lighting with pastel accents.
Desks stacked and covered with black curtains form a winding maze (three long curtain walls as in the sketch), with paper ghosts, fake spider webs and a few glowing paper lanterns. The entrance comes in from the left edge. A dead-end corner at the top right.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 64. 2-2 体育館（済）

- 添付：`docs/sketches/room_layouts/room_school_gym.png`、`map_school_gate.png`
- 保存名：`map_school_gym.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the inside of a Japanese high school gymnasium during its school festival in 2006, seen from above with the roof removed, bright pastel and light blue colors with warm stage lights.
At the top, a raised wooden stage with curtains pulled aside, a drum set, guitar amplifiers and speakers on it, cables on the floor. Below, a wide polished wooden floor with court lines and rows of folding chairs pushed to the sides, as in the sketch. The entrance comes in from the bottom edge.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 65. 2-3 土手の道（済）

- 添付：`docs/sketches/room_layouts/room_riverside_levee.png`、`public/assets/maps/festival.webp`
- 保存名：`map_riverside_levee.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the bottom of a grassy river embankment next to a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
A wide dirt path runs along the foot of the embankment from the lower left to the right, then a gentle slope path climbs up along the right side and turns left to leave through the top edge. Tall summer grass and a few parked bicycles on the embankment, a small grassy hollow on the left with a wooden bench.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 66. 2-3 ベンチの裏の木陰（済）

- 添付：`docs/sketches/room_layouts/room_riverside_bench.png`、`map_riverside_levee.png（上で作った絵）`
- 保存名：`map_riverside_bench.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the area behind the team bench of a riverside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
In the lower part, a long wooden team bench with a small roof (as in the sketch). In the middle, a big shady tree with dappled shadows and a cooler box under it. Paths lead out through the bottom edge (to the embankment), the top edge (to the concession tent) and the right edge (to the riverbank). Cicada-filled summer mood.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 67. 2-3 川べり（済）

- 添付：`docs/sketches/room_layouts/room_riverside_bank.png`、`map_riverside_levee.png`
- 保存名：`map_riverside_bank.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a quiet riverbank next to a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
The river runs along the whole right side (not walkable, sparkling water). A sandy and grassy bank with three clumps of tall reeds and summer grass (as in the sketch), a few stray baseballs in the grass, an old bucket. The entrance comes in from the left edge.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 68. 2-3 売店のテント（済）

- 添付：`docs/sketches/room_layouts/room_riverside_stand.png`、`map_riverside_levee.png`
- 保存名：`map_riverside_stand.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a small white concession tent beside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
The tent with folding tables, a tub of ice water with floating ramune bottles (blank labels), shade umbrellas. An open dirt area in front of the tent. Paths lead out through the bottom edge, the top edge (toward the diamond) and the left edge (toward the equipment shed).
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 69. 2-3 用具小屋の裏（済）

- 添付：`docs/sketches/room_layouts/room_riverside_shed.png`、`map_riverside_levee.png`
- 保存名：`map_riverside_shed.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the back of a small wooden equipment shed beside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
Narrow passages divided by a long practice net and stacks of bat boxes and base bags (two long dividers as in the sketch), a roller for the field, buckets of balls. The entrance comes in from the right edge. A dead-end corner at the top left.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 70. 2-3 ダイヤモンド（済）

- 添付：`docs/sketches/room_layouts/room_riverside_diamond.png`、`map_riverside_levee.png`
- 保存名：`map_riverside_diamond.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the infield of a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors, seen from above.
At the top, home plate in front of a tall backstop net, with the ends of the net at the upper corners (as in the sketch). Below, the dirt infield with bases and white chalk lines, the pitcher's mound. A wooden scoreboard (blank panels, no numbers) is visible beyond the backstop. The entrance comes in from the bottom edge.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 71. 2-3 4晩目 書庫の通用口の廊下（済）

- 添付：`docs/sketches/room_layouts/room_archive_corridor.png`、`public/assets/maps/festival.webp`
- 保存名：`map_archive_corridor.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a long service corridor entering a vast archive of the Time Archive Bureau, an office of the far future: endless tall shelves of flawless glass hourglasses with neat labels (blank, no letters), cold blue-white light, polished pale stone floors, beautiful and silent. Rows of shelves form narrow aisles, a small checkpoint desk with a glowing lamp.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls of tall archive shelves.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 72. 2-3 4晩目 閲覧室（済）

- 添付：`docs/sketches/room_layouts/room_archive_reading.png`、`map_archive_corridor.png（上で作った絵）`
- 保存名：`map_archive_reading.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a reading room in a vast archive of the Time Archive Bureau, an office of the far future: endless tall shelves of flawless glass hourglasses with neat labels (blank, no letters), cold blue-white light, polished pale stone floors, beautiful and silent. Long reading tables with hourglasses left on them as if someone just stood up, open ledgers (blank pages), shelves along the walls.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls of tall archive shelves.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 73. 2-3 4晩目 奥の部屋（黒い扉）（済）

- 添付：`docs/sketches/room_layouts/room_archive_vault.png`、`map_archive_corridor.png`
- 保存名：`map_archive_vault.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a quiet back room of a vast archive of the Time Archive Bureau, an office of the far future: endless tall shelves of flawless glass hourglasses with neat labels (blank, no letters), cold blue-white light, polished pale stone floors, beautiful and silent. At the upper right, a heavy black door engraved with the emblem of several black hourglasses hanging from a bar (no letters). Dim light, dust in the air.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls of tall archive shelves.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 74. 2-3 4晩目 奥の書庫（済）

- 添付：`docs/sketches/room_layouts/room_archive_stacks.png`、`map_archive_corridor.png`
- 保存名：`map_archive_stacks.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the deepest stacks of a vast archive of the Time Archive Bureau, an office of the far future: endless tall shelves of flawless glass hourglasses with neat labels (blank, no letters), cold blue-white light, polished pale stone floors, beautiful and silent. Very tall shelves in long rows, and at the top center one shelf where a single cracked hourglass glows warmly among the flawless ones.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls of tall archive shelves.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 75. 3-1 村の駅前（済）

- 添付：`docs/sketches/room_layouts/room_village_station.png`、`public/assets/maps/factory_alley.webp`
- 保存名：`map_village_station.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the small square in front of a tiny wooden country train station in a mountain farming village in Japan during the Obon holidays in the summer of 1966, warm sepia-tinted retro colors with green rice fields. A dirt road, a bus stop sign (blank), a bench, a red post box, summer cicada trees.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 76. 3-1 田んぼ道（済）

- 添付：`docs/sketches/room_layouts/room_village_paddy.png`、`map_village_station.png（上で作った絵）`
- 保存名：`map_village_paddy.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a narrow dirt path running between green rice paddies in a mountain farming village in Japan during the Obon holidays in the summer of 1966, warm sepia-tinted retro colors with green rice fields. Irrigation channels, a small stone Jizo statue, utility poles, mountains in the distance. A side path to the right leads to stone steps of a village shrine forest.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 77. 3-1 鎮守の森の石段（済）

- 添付：`docs/sketches/room_layouts/room_village_shrine.png`、`map_village_station.png`
- 保存名：`map_village_shrine.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: mossy stone steps and a small wooden village shrine under tall cedar trees in a mountain farming village in Japan during the Obon holidays in the summer of 1966, warm sepia-tinted retro colors with green rice fields, dappled sunlight, stone lanterns.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 78. 3-1 実家の庭（済）

- 添付：`docs/sketches/room_layouts/room_village_house.png`、`map_village_station.png`
- 保存名：`map_village_house.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the front yard of an old thatched-roof farmhouse in a mountain farming village in Japan during the Obon holidays in the summer of 1966, warm sepia-tinted retro colors with green rice fields: a wide wooden veranda (engawa), a vegetable garden, a well, laundry drying on a pole, a bicycle. A side path to the right leads down to the river.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 79. 3-1 川べり（済）

- 添付：`docs/sketches/room_layouts/room_village_river.png`、`map_village_station.png`
- 保存名：`map_village_river.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a clear shallow mountain river beside a mountain farming village in Japan during the Obon holidays in the summer of 1966, warm sepia-tinted retro colors with green rice fields, smooth river stones, a small wooden footbridge, reeds, dragonflies, evening light starting.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 80. 3-1 夕暮れの駅のホーム（済）

- 添付：`docs/sketches/room_layouts/room_village_platform.png`、`map_village_station.png`
- 保存名：`map_village_platform.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the single platform of a tiny wooden country train station at summer dusk in 1966, warm orange sunset light with sepia tones: a wooden waiting bench, a hanging station clock (no numbers needed), a long platform edge with railway tracks along the top, mountains glowing in the sunset.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 81. 3-2 校門の坂（済）

- 添付：`docs/sketches/room_layouts/room_grad_slope.png`、`public/assets/maps/festival.webp`
- 保存名：`map_grad_slope.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a gentle slope road leading down from the gate of a middle school in a quiet Japanese town on a mild afternoon in March 2019, the day of a middle school graduation ceremony, soft spring colors with early cherry blossoms. A school gate with a blank graduation sign board at the bottom, cherry trees just starting to bloom along the road, guardrails. A side path to the right goes behind the gymnasium.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 82. 3-2 体育館の裏（済）

- 添付：`docs/sketches/room_layouts/room_grad_gym_back.png`、`map_grad_slope.png（上で作った絵）`
- 保存名：`map_grad_gym_back.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the quiet space behind a middle school gymnasium in a quiet Japanese town on a mild afternoon in March 2019, the day of a middle school graduation ceremony, soft spring colors with early cherry blossoms: a concrete walkway, stacked folding chairs from the ceremony, a storage shed, a single cherry tree.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 83. 3-2 商店街（済）

- 添付：`docs/sketches/room_layouts/room_grad_street.png`、`map_grad_slope.png`
- 保存名：`map_grad_street.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a small local shopping street in a quiet Japanese town on a mild afternoon in March 2019, the day of a middle school graduation ceremony, soft spring colors with early cherry blossoms: a bakery, a musical instrument shop with a guitar in the window, a convenience store, banners and signs (all blank). A side path to the right leads to the river embankment.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 84. 3-2 川の土手（済）

- 添付：`docs/sketches/room_layouts/room_grad_levee.png`、`map_grad_slope.png`
- 保存名：`map_grad_levee.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a grassy river embankment in a quiet Japanese town on a mild afternoon in March 2019, the day of a middle school graduation ceremony, soft spring colors with early cherry blossoms, a paved path along the top, the wide river below, dandelions and early spring grass.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 85. 3-2 夕暮れの踏切（済）

- 添付：`docs/sketches/room_layouts/room_grad_crossing.png`、`map_grad_slope.png`
- 保存名：`map_grad_crossing.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a railroad crossing at the edge of a quiet Japanese town at dusk in March 2019, orange sunset light: railway tracks running across the top of the image, crossing signals with lights and gate arms (raised), a narrow road leading up to the crossing, small houses and utility poles.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 86. 祭りの夜 鳥居と参道（済）

- 添付：`docs/sketches/room_layouts/room_matsuri_torii.png`、`public/assets/maps/festival.webp`
- 保存名：`map_matsuri_torii.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a stone-paved shrine approach through a large red torii gate in a Japanese shrine summer festival on a night in 1921 (Taisho era), deep indigo night sky, warm red paper lanterns, old-fashioned wooden stalls. Stone lanterns, rows of hanging lanterns leading up.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 87. 祭りの夜 屋台の通り（済）

- 添付：`docs/sketches/room_layouts/room_matsuri_stalls.png`、`map_matsuri_torii.png（上で作った絵）`
- 保存名：`map_matsuri_stalls.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a street of old festival stalls in a Japanese shrine summer festival on a night in 1921 (Taisho era), deep indigo night sky, warm red paper lanterns, old-fashioned wooden stalls: a goldfish seller with wooden tubs, a candy craftsman, a lottery stall, pinwheels, strings of lanterns overhead.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 88. 祭りの夜 やぐらの広場（済）

- 添付：`docs/sketches/room_layouts/room_matsuri_yagura.png`、`map_matsuri_torii.png`
- 保存名：`map_matsuri_yagura.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: an open square in front of the shrine with a tall wooden bon-odori dance tower (yagura) in a Japanese shrine summer festival on a night in 1921 (Taisho era), deep indigo night sky, warm red paper lanterns, old-fashioned wooden stalls, a big taiko drum on the tower, ropes of lanterns stretching out from it in all directions.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### 89. 祭りの夜 夜の端（済）

- 添付：`docs/sketches/room_layouts/room_matsuri_edge.png`、`map_matsuri_torii.png`
- 保存名：`map_matsuri_edge.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the far edge of a 1921 Japanese summer festival night, where the night has been cut off: the lantern-lit ground breaks off into a dark void, and the edge crumbles into falling grains of glowing sand and black-and-white TV static. A few broken lanterns and an old wooden bench near the edge. Eerie, sad and beautiful.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

## F. 会話の背景

見本は要らない（描きにくければ、施設の台所の背景 `public/assets/backgrounds/` のどれかを絵柄の見本に付ける）

### 90. 施設の居間（夜、テレビの光だけ）

- 添付：なし
- 保存名：`bg_home_tv_dark.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: the shared living room of a small children's home at night in present-day Japan, lights off, lit only by the cold blue glow of an old television, low tables, cushions, children's drawings on the wall (blank), quiet and a little lonely.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 91. 平成の高校の文化祭（秋の昼）

- 添付：なし
- 保存名：`bg_school_festival.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a Japanese high school building decorated for its school festival on a bright autumn afternoon in 2006, paper flower arches, banners (blank), balloons, colorful student-made signs (blank), blue sky.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 92. 昭和41年の夏、山あいの村（昼）

- 添付：なし
- 保存名：`bg_village_1966.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a mountain farming village in Japan in the summer of 1966, green rice fields, thatched-roof farmhouses, a dirt road, utility poles, mountains and big summer clouds, warm sepia-tinted retro colors.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 93. 昭和41年の夏、村の駅（夕暮れ）

- 添付：なし
- 保存名：`bg_village_dusk.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: the platform of a tiny wooden country train station at summer dusk in 1966, a long orange sunset, a wooden bench, a station clock, railway tracks leading into the mountains, warm sepia-tinted retro colors.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 94. ひだまり荘の部屋（窓辺）

- 添付：なし
- 保存名：`bg_care_home.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a bright, cozy private room in a small Japanese care home, a bed with a quilt, a wheelchair by the window, a small table with a teacup and an old photo frame (no faces visible), lace curtains and soft afternoon sunlight.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 95. ひだまり荘の部屋（窓辺・雨）

- 添付：なし
- 保存名：`bg_care_home_rain.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: the same cozy private room in a small Japanese care home on a rainy afternoon, raindrops on the window, gray soft light, a wheelchair by the window, a small table with a teacup.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 96. 町の駅のホーム（夕方の前）

- 添付：なし
- 保存名：`bg_station_now.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: the platform of a small local train station in a quiet present-day Japanese town in the late afternoon, a simple shelter, benches, a vending machine, rails stretching into the distance, warm light just before sunset.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 97. 文化祭の学校の中庭（今）

- 添付：なし
- 保存名：`bg_school_fair.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: the courtyard of a present-day Japanese high school during its school festival, student food stalls with tents, decorated with paper flowers and garlands, a big tree in the center, bright autumn afternoon.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 98. 大正十年の夏祭り（夜）

- 添付：なし
- 保存名：`bg_taisho_festival.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a Japanese shrine summer festival on a night in 1921 (Taisho era), rows of old wooden stalls with red paper lanterns, a goldfish seller with wooden tubs, a bon-odori tower in the distance, deep indigo night sky, warm nostalgic lantern glow.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 99. 祭りの夜の端（砂の落ちる縁）

- 添付：なし
- 保存名：`bg_taisho_edge.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: the far edge of a 1921 Japanese summer festival night, where the lantern-lit ground breaks off into a dark void and crumbles into falling grains of glowing sand and black-and-white static, a few broken lanterns at the edge, eerie, sad and beautiful.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 100. 町の神社（今の昼）

- 添付：なし
- 保存名：`bg_shrine_now.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a small shrine in a quiet present-day Japanese town on a calm afternoon, a red torii gate, stone lanterns, an old wooden shrine building, ema votive tablets hanging (blank), tall trees.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 101. 平成31年3月、卒業式の帰り道（昼）

- 添付：なし
- 保存名：`bg_grad_2019.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a residential road in a quiet Japanese town in March 2019, the afternoon after a middle school graduation ceremony, early cherry blossoms, a gentle slope, utility poles, soft spring light.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 102. 平成31年3月、夕暮れの踏切

- 添付：なし
- 保存名：`bg_grad_dusk.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a railroad crossing at the edge of a quiet Japanese town at dusk in March 2019, the crossing gate arms lowered and red warning lights glowing, a long orange sunset sky, power lines silhouetted.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

### 103. 駅の近くの踏切（今の夕方の前）

- 添付：なし
- 保存名：`bg_crossing_now.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
Scene: a railroad crossing near a small station in a quiet present-day Japanese town in the late afternoon, gates raised, warm light just before sunset, a few houses and a bicycle leaning on a fence.
Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.
```

## G. 1枚絵

### 104. 代打の一打（2-3）

- 添付：`past_koji_normal.png（C で作った絵）`、`past_masaru_smile.png（C で作った絵）`
- 保存名：`cg_pinch_hit.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A single key visual (event CG). Vertical 9:16 image.
A riverside little league baseball field on a bright summer afternoon in 1998, bright pastel summer colors. The last inning, two outs. A 12-year-old pinch hitter in a slightly oversized white uniform swings the bat with all his strength, his arms trembling, his eyes shut tight, the ball just leaving the bat. Behind the backstop, his father in a polo shirt with a towel around his neck jumps up from the bench, shouting with joy (keep their designs as in the attached portraits). Teammates leaning out of the dugout, cumulonimbus clouds, sparkling light. No letters or numbers on uniforms or the scoreboard.
Keep the lower quarter of the image simple, because a text box may cover it. Absolutely no letters or text anywhere.
```

## H. スナップの写真

`docs/ART.md` の 5-7 の表の本文を、下の頭と締めの間に入れて作る。人が写る物は、ハルト（`hero_smile.webp`）とあかり（`akari_smile.webp`）など、写る人の立ち絵を添付する

### 105. スナップ：ソード

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_sword.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
Late 1990s Japan, a riverside embankment at sunset. A high school boy playfully holds up a long tree branch like a sword, striking a heroic pose; a high school girl beside him laughs. Silver-grey and gold light on the branch.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 106. スナップ：ヘビーブロウ

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_heavyBlow.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A high school classroom after school, preparing for the culture festival. The boy swings a big wooden mallet to nail a large plywood sign together while the girl steadies the board, wood shavings flying. Heavy grey tools in the foreground.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 107. スナップ：ファイアボール

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_fireChip.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A summer festival night in late 1990s Japan. The boy and the girl in yukata, seen from behind, look up at a huge red and orange firework blooming in the dark sky.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 108. スナップ：アイスニードル

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_iceChip.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A cold winter morning. The girl, seen from the side, draws a small picture with her fingertip on a frosted window; icicles hang outside, pale blue light everywhere.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 109. スナップ：サンダーボルト

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_thunderChip.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A sudden summer evening shower. The boy and the girl take shelter under the eaves of an old candy shop, seen from behind; a bright yellow lightning bolt lights up the dark sky in the distance.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 110. スナップ：ワイドショット

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_wideShot.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A shooting gallery stall at a summer festival. The girl aims a cork gun at a row of prizes while the boy watches beside her, seen from behind; warm lantern light.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 111. スナップ：リカバー

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_recover.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A quiet summer afternoon on a wooden veranda of an old Japanese house. The girl offers the boy a slice of watermelon; soft green garden light and wind chimes.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 112. スナップ：クイックステップ

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_quickStep.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A school sports day relay race. The moment the boy passes the baton to the girl, both mid-stride, seen from the side, motion lines and dust; violet-tinted late afternoon sky.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 113. スナップ：サーチ

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_search.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A quiet school library. The boy and the girl lean over one old book together, the girl holding a magnifying glass over a page; dust motes glowing in violet evening light.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 114. スナップ：ブレイクアーム

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_breakArm.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A narrow alley at dusk. The boy and the girl crouch beside an old bicycle and fix its broken chain together, a small grey toolbox open beside them.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 115. スナップ：ドロー

- 添付：`public/assets/portraits/hero_smile.webp`、`public/assets/portraits/akari_smile.webp`
- 保存名：`snap_draw.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
An empty classroom after school. Playing cards are spread out across two pushed-together desks; the boy and the girl's hands reach for the cards, faces out of frame. Violet evening light.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 116. スナップ：ジョーカー

- 添付：`public/assets/portraits/mio_smile.webp`
- 保存名：`snap_joker.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A small 10-year-old girl with a confident grin, seen from the side, shows off a card trick, fanning playing cards and holding up the joker card toward the viewer; the card's face shows only a simple jester pattern. Soft golden light.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 117. スナップ：アンコール

- 添付：`public/assets/portraits/past_kenta_smile.webp`
- 保存名：`snap_encore.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A high school culture festival stage in the gym. A boy keeps singing into the microphone even though a guitar string has snapped, a girl playing beside him, seen from the side; a single spotlight and a few cheering hands in the foreground.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```

### 118. スナップ：ピンチヒッター

- 添付：`past_koji_normal.png（C で作った絵）`、`past_masaru_smile.png（C で作った絵）`
- 保存名：`snap_pinchHitter.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces.
A late 1990s riverside little league baseball field. A boy in a baseball uniform steps into the batter's box as a pinch hitter, seen from behind; in the stands, his father cups his hands and shouts. Bright summer afternoon.
Keep their designs exactly as in the attached reference portraits. Absolutely no letters or text anywhere.
```
