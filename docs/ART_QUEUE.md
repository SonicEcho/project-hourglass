# 絵の「そのまま貼る一覧」

**まだの絵：41 枚**（済んだ絵 156 枚は、いちばん下に名前だけ）。上から順に作る。**1つの枠が1枚**。

- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）
- できた絵は「保存名」の名前で保存して、まとめて Claude に送る。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする
- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい
- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる（届いた絵は DONE に足すと、下の「済んだ絵」に移る）
- まだ一覧にない物：ひなののまばたき・口パク（Gemini。ART.md の 5-8 の 1）、昼の町の地図と2頭身の歩くハルト・カイ（5-8 の 2〜4）、脇役の表情違い（5-3 の 14）、写しのしずえ・写しのじん・写しのとしおの立ち絵

## まだの絵

- [E. 部屋の地図](#e-部屋の地図)：1 枚
- [J. 4-1「シロのいた夏」の人](#j-4-1シロのいた夏の人)：15 枚
- [N. 早瀬（仲間）](#n-早瀬仲間)：7 枚
- [O. 4章の敵](#o-4章の敵)：12 枚
- [P. 4章の部屋の地図](#p-4章の部屋の地図)：6 枚

### E. 部屋の地図

毎回、その部屋の配置の下絵（`docs/sketches/room_layouts/room_<部屋>.png`）と、絵柄の見本の地図を添付する。下絵の明るい所が歩ける所。1-1 は縁日の地図、1-2 は商店街の地図、2-2 以降は、その区画で最初にできた部屋の絵を見本にする（なければ縁日の地図）

#### 1. 2-2 校門の前庭

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

### J. 4-1「シロのいた夏」の人

今は色の札で出している3人（`docs/script/4-1.md` の 2.）。まず基本の1枚（通常）を作り、できた絵を添付して表情違いを作る。写しの2人はゲームの中でセピアに色を付けるので、ふつうの色で作る

#### 2. たいち（今16歳。高校1年）：通常

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/hero_normal.webp`
- 保存名：`taichi_normal.png`
- メモ：一番先に作る。下の表情違いは、この絵を添付する

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a guarded, blunt neutral look, mouth closed.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Taichi, a 16-year-old Japanese boy, a first-year student at the same high school as the boy in the attached portrait, who quit the track team this summer. Slim, athletic build, short black hair a little grown out, sharp but tired eyes, a blunt, guarded face. The same school uniform as the attached portrait of the boy (white collared shirt and a mustard-yellow tie), but instead of his hoodie, a plain navy track jacket left open, a leftover from the track team. No letters or logos.
```

#### 3. たいち：不機嫌

- 添付：`taichi_normal.png（上で作った絵）`
- 保存名：`taichi_sullen.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a sullen, annoyed look, eyebrows drawn down, looking slightly away.
This is exactly the same character as the attached portrait: Taichi, a 16-year-old boy with short black hair a little grown out, sharp but tired eyes, a white collared shirt with a mustard-yellow tie and an open plain navy track jacket.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 4. たいち：泣きそう

- 添付：`taichi_normal.png（上で作った絵）`
- 保存名：`taichi_tearful.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, on the verge of tears, eyes glistening, lips pressed together, trying hard not to cry.
This is exactly the same character as the attached portrait: Taichi, a 16-year-old boy with short black hair a little grown out, sharp but tired eyes, a white collared shirt with a mustard-yellow tie and an open plain navy track jacket.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 5. たいち：考える

- 添付：`taichi_normal.png（上で作った絵）`
- 保存名：`taichi_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thinking look, eyes lowered, as if trying to remember something.
This is exactly the same character as the attached portrait: Taichi, a 16-year-old boy with short black hair a little grown out, sharp but tired eyes, a white collared shirt with a mustard-yellow tie and an open plain navy track jacket.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 6. たいち：驚き

- 添付：`taichi_normal.png（上で作った絵）`
- 保存名：`taichi_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open.
This is exactly the same character as the attached portrait: Taichi, a 16-year-old boy with short black hair a little grown out, sharp but tired eyes, a white collared shirt with a mustard-yellow tie and an open plain navy track jacket.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 7. たいち：笑顔

- 添付：`taichi_normal.png（上で作った絵）`
- 保存名：`taichi_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a small, awkward but genuine smile, the first in a long time.
This is exactly the same character as the attached portrait: Taichi, a 16-year-old boy with short black hair a little grown out, sharp but tired eyes, a white collared shirt with a mustard-yellow tie and an open plain navy track jacket.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 8. 写しのたいち（平成30年の夏、10歳）：通常

- 添付：`public/assets/portraits/young_akari_smile.webp`、`taichi_normal.png（上で作った絵）`
- 保存名：`past_taichi_normal.png`
- メモ：下の表情違いは、この絵を添付する

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a plain, quiet look, mouth closed.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the little girl in the yukata, with the same childlike proportions.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Young Taichi, the same boy as the attached portrait of the teenager but six years earlier: a 10-year-old Japanese boy spending the summer of 2018 at his grandfather's house in the countryside. Keep the same face features so he is clearly the same person. Sun-tanned skin, short black hair, a big straw hat, a plain white T-shirt, a cheap child's digital wristwatch hanging from his neck on a cord.
```

#### 9. 写しのたいち：笑顔

- 添付：`past_taichi_normal.png（上で作った絵）`
- 保存名：`past_taichi_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a big, happy, sunny grin.
This is exactly the same character as the attached portrait, with the same childlike proportions: young Taichi, a sun-tanned 10-year-old boy with short black hair, a big straw hat, a plain white T-shirt and a child's digital wristwatch hanging from his neck on a cord.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 10. 写しのたいち：泣きそう

- 添付：`past_taichi_normal.png（上で作った絵）`
- 保存名：`past_taichi_tearful.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, on the verge of tears, eyes glistening, lips trembling.
This is exactly the same character as the attached portrait, with the same childlike proportions: young Taichi, a sun-tanned 10-year-old boy with short black hair, a big straw hat, a plain white T-shirt and a child's digital wristwatch hanging from his neck on a cord.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 11. 写しのたいち：真剣

- 添付：`past_taichi_normal.png（上で作った絵）`
- 保存名：`past_taichi_serious.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a serious, determined look, jaw set, eyes fixed forward.
This is exactly the same character as the attached portrait, with the same childlike proportions: young Taichi, a sun-tanned 10-year-old boy with short black hair, a big straw hat, a plain white T-shirt and a child's digital wristwatch hanging from his neck on a cord.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 12. 写しのたいち：怒り

- 添付：`past_taichi_normal.png（上で作った絵）`
- 保存名：`past_taichi_angry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, shouting in anger, eyebrows sharply drawn, mouth open, red-faced.
This is exactly the same character as the attached portrait, with the same childlike proportions: young Taichi, a sun-tanned 10-year-old boy with short black hair, a big straw hat, a plain white T-shirt and a child's digital wristwatch hanging from his neck on a cord.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 13. 写しのたいち：驚き

- 添付：`past_taichi_normal.png（上で作った絵）`
- 保存名：`past_taichi_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, mouth open.
This is exactly the same character as the attached portrait, with the same childlike proportions: young Taichi, a sun-tanned 10-year-old boy with short black hair, a big straw hat, a plain white T-shirt and a child's digital wristwatch hanging from his neck on a cord.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 14. 写しのたいち：不機嫌

- 添付：`past_taichi_normal.png（上で作った絵）`
- 保存名：`past_taichi_sullen.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a sulky, stubborn look, lower lip pushed out.
This is exactly the same character as the attached portrait, with the same childlike proportions: young Taichi, a sun-tanned 10-year-old boy with short black hair, a big straw hat, a plain white T-shirt and a child's digital wristwatch hanging from his neck on a cord.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 15. 写しのおじいちゃん（平成30年の夏）：通常

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`past_grandpa_normal.png`
- メモ：下の「怒り」は、この絵を添付する

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gruff, quiet look, mouth firmly closed.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Taichi's grandfather, a Japanese farmer around 72 in the summer of 2018, living alone in a countryside house. Sun-tanned, deeply wrinkled face, short white hair, thick eyebrows, a few words and gruff manners but kind eyes. A faded straw hat, a white towel around his neck, a light gray work shirt with rolled sleeves.
```

#### 16. 写しのおじいちゃん：怒り

- 添付：`past_grandpa_normal.png（上で作った絵）`
- 保存名：`past_grandpa_angry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, shouting in anger and worry, eyebrows drawn together, mouth open.
This is exactly the same character as the attached portrait: a sun-tanned Japanese farmer around 72 with short white hair, a faded straw hat, a white towel around his neck and a light gray work shirt.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

### N. 早瀬（仲間）

4-2 で仲間に加わる時計屋の店長（`docs/script/4-2.md` の 2.：今75歳くらい、無口で皮肉屋、ルーペ、作業着）。見た目はまだ決まっていないので、下の設定画の文はたたき台。設定画を見て決めてから、胸から上の1枚と表情違いを作る。構図の見本は、同じお年寄りのふみさんの立ち絵

#### 17. 早瀬の設定画

- 添付：`public/assets/portraits/fumi_smile.webp`
- 保存名：`hayase_sheet.png`
- メモ：たたき台。気に入らない所（髪・服・小物）は「ここを直して」と足して作り直してよい

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Character design sheet of an original anime-style elderly man for a mobile turn-based JRPG, full body front view, standing, plain off-white background, clean lineart with soft cel shading. Same art style as the attached reference portrait.
Character: Jin Hayase, about 75, the owner of a small old watch and clock repair shop in a Japanese shopping street. A man of few words, gruff and sarcastic, but quietly kind. Small and wiry, slightly stooped from decades at the workbench. Short white hair, thick grey eyebrows, deep wrinkles, sharp narrow eyes. A watchmaker's loupe pushed up on his forehead. A faded navy work jacket over a plain grey shirt, black arm covers, a tiny screwdriver in the breast pocket.
```

#### 18. 早瀬の胸から上の基本の1枚（通常）

- 添付：`hayase_sheet.png（上で決めた設定画）`、`public/assets/portraits/fumi_smile.webp`
- 保存名：`hayase_normal.png`
- メモ：台本で72回（いちばん多い）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gruff, calm, neutral look, mouth closed.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the elderly woman.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Hayase, about 75, the owner of a small old watch and clock repair shop in a Japanese shopping street. A man of few words, gruff and sarcastic, but quietly kind. Small and wiry, slightly stooped from decades at the workbench. Short white hair, thick grey eyebrows, deep wrinkles, sharp narrow eyes. A watchmaker's loupe pushed up on his forehead. A faded navy work jacket over a plain grey shirt, black arm covers, a tiny screwdriver in the breast pocket. Keep his design exactly as in the attached character sheet.
```

#### 19. 早瀬：考える（8回）

- 添付：`hayase_normal.png（上で作った絵）`
- 保存名：`hayase_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thinking look, eyes narrowed and lowered, as if examining a tiny watch part.
This is exactly the same character as the attached portrait: Hayase, the elderly watchmaker in the attached portrait.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 20. 早瀬：苦笑い（5回）

- 添付：`hayase_normal.png（上で作った絵）`
- 保存名：`hayase_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, crooked half smile, one corner of his mouth up, eyebrows a little raised.
This is exactly the same character as the attached portrait: Hayase, the elderly watchmaker in the attached portrait.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 21. 早瀬：驚き（2回）

- 添付：`hayase_normal.png（上で作った絵）`
- 保存名：`hayase_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes opened wide under the thick eyebrows, mouth slightly open.
This is exactly the same character as the attached portrait: Hayase, the elderly watchmaker in the attached portrait.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 22. 早瀬：怒り（2回）

- 添付：`hayase_normal.png（上で作った絵）`
- 保存名：`hayase_angry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, an angry, stern scowl, eyebrows drawn together, mouth pressed in a hard line.
This is exactly the same character as the attached portrait: Hayase, the elderly watchmaker in the attached portrait.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 23. 早瀬：泣き笑い（1回）

- 添付：`hayase_normal.png（上で作った絵）`
- 保存名：`hayase_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet and crinkled, a gentle trembling smile.
This is exactly the same character as the attached portrait: Hayase, the elderly watchmaker in the attached portrait.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

### O. 4章の敵

D と同じ形。毎回、ブリキノイズの絵（`public/assets/enemies/tin_noise.webp`）を絵柄の見本として添付する。白い背景のまま送ってくれればよい

#### 24. 4-1 虫かごノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`bugcage_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright summer greens, sky blue and sunflower yellow). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a plastic insect cage with a green lid, the buzzing of insects inside shaking it, the lid snapping like a mouth
```

#### 25. 4-1 すいかノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`watermelon_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright summer greens, sky blue and sunflower yellow). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: half of a big watermelon, spitting black seeds like bullets, rolling heavily
```

#### 26. 4-1 花火の燃えかすノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`firework_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright summer greens, sky blue and sunflower yellow). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: burnt-out handheld fireworks stuck in a small metal bucket of water, sparks and smoke still drifting from the tips
```

#### 27. 4-1 水鉄砲ノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`watergun_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright summer greens, sky blue and sunflower yellow). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a big pump-action toy water gun, shooting jets of water, quick and light
```

#### 28. 4-1 お地蔵さまの前の砂嵐（番人）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`jizo_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright summer greens, sky blue and sunflower yellow). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: the offerings in front of a small roadside stone Jizo statue: many spinning paper pinwheels and a red bib, swirling into a guardian blocking the path (the stone statue itself stays calm and small at the center, not monstrous)
```

#### 29. 4-1 川のぬし（ボス）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`river_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (bright summer greens, sky blue and sunflower yellow). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: a giant straw hat riding on a rushing river current, water churning beneath it. Two clearly visible parts: the wide brim of the straw hat at the top, and the swirling river current with stones at the bottom
```

#### 30. 4-2 ルービックキューブノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`cube_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded orange and cream). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a colorful puzzle cube whose colors never line up, its layers twisting endlessly
```

#### 31. 4-2 テーブルゲームノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`gametable_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded orange and cream). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a coffee-shop table-style arcade game cabinet from around 1980, tiny glowing pixel bullets flying out of its glass screen (no logos, no letters)
```

#### 32. 4-2 紙風船ノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`paperballoon_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded orange and cream). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a cluster of colorful paper balloons given out on a shop opening day, bouncing and drifting lightly
```

#### 33. 4-2 鳩時計ノイズ

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`cuckoo_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded orange and cream). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: a wooden cuckoo clock whose little bird is stuck outside and keeps calling, its pendulum swinging wildly
```

#### 34. 4-2 開店祝いの花輪ノイズ（番人）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`wreath_noise.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded orange and cream). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
Body: tall congratulatory flower wreath stands for a shop opening, overlapping again and again into a wall of flowers, petals scattering like a storm (ribbons are blank, no letters)
```

#### 35. 4-2 シャッターのぬし（ボス）

- 添付：`public/assets/enemies/tin_noise.webp`
- 保存名：`shutter_boss.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground. Match the art style of the attached enemy art exactly.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (sepia, faded orange and cream). Eerie but not gory, readable as a small silhouette on a phone screen.
Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.
A large boss monster, filling most of the image. Body: dozens of rolling metal shop shutters stacked and overlapping, rattling down again and again. Two clearly visible parts: the stack of metal shutter slats in front, and the winding drum with a big gear at the top
```

### P. 4章の部屋の地図

E と同じ形。毎回、その部屋の配置の下絵（`docs/sketches/room_layouts/room_<部屋>.png`）と、絵柄の見本の地図を添付する。4-1 は最初の部屋（庭）の絵ができたら、それを残りの見本にする。4-2 の店内は、1-2 の商店街の地図を見本にする

#### 36. 4-1 おじいちゃんの家の庭

- 添付：`docs/sketches/room_layouts/room_summer_garden.png`、`public/assets/maps/village_paddy.webp`
- 保存名：`map_summer_garden.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the garden of an old wooden country house in the summer of 2018 (late Heisei era) in the Japanese countryside, bright summer greens, sky blue and sunflower yellow, cicada-filled afternoon. A small vegetable patch and a dog house (two small blocks as in the sketch), a watering can and a hose, morning glories on a bamboo fence, a wooden veranda on the right side. A path leaves through the top edge toward the rice fields, and another through the left edge toward the storage shed.
An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 37. 4-1 物置

- 添付：`docs/sketches/room_layouts/room_summer_shed.png`、`map_summer_garden.png（上で作った絵）`
- 保存名：`map_summer_shed.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the inside of an old wooden storage shed beside a country house in the summer of 2018 (late Heisei era) in the Japanese countryside, bright summer greens, sky blue and sunflower yellow, cicada-filled afternoon, seen from above with the roof removed. Shelves of old tools, a straw broom, a wooden cart for carrying a dog, boxes of fireworks and bug cages (four small blocks as in the sketch). Dust in the light. The entrance comes in from the right edge.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by walls, buildings, fences or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 38. 4-1 田んぼのあぜ道

- 添付：`docs/sketches/room_layouts/room_summer_ridge.png`、`map_summer_garden.png`
- 保存名：`map_summer_ridge.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical image (1024×1536). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: narrow raised paths between green rice paddies in the summer of 2018 (late Heisei era) in the Japanese countryside, bright summer greens, sky blue and sunflower yellow, cicada-filled afternoon. Bright green rice fields fill the dark areas of the sketch; the light areas are the earthen ridge paths winding between them. A small roadside stone Jizo statue with pinwheels near the top. Paths lead out through the bottom edge (to the house), the top edge (to the river) and the left edge (to the irrigation canal).
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. An opening at the center of the top edge, one sixth of the image width wide, leading out of the image. An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by rice paddies, trees and hedges.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 39. 4-1 用水路

- 添付：`docs/sketches/room_layouts/room_summer_canal.png`、`map_summer_garden.png`
- 保存名：`map_summer_canal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a concrete irrigation canal beside rice fields in the summer of 2018 (late Heisei era) in the Japanese countryside, bright summer greens, sky blue and sunflower yellow, cicada-filled afternoon. A narrow strip of clear running water (the dark vertical strip in the sketch, crossed by two small gaps you can step over) divides two grassy banks. Dragonflies, water plants, a small sluice gate. The entrance comes in from the right edge.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by rice paddies, trees and hedges.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 40. 4-1 川の浅瀬

- 添付：`docs/sketches/room_layouts/room_summer_shallows.png`、`map_summer_garden.png`
- 保存名：`map_summer_shallows.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a shallow, sparkling river bank in the summer of 2018 (late Heisei era) in the Japanese countryside, bright summer greens, sky blue and sunflower yellow, cicada-filled afternoon. A wide pebbly shallow where you can wade, with a few large river rocks (the small dark blocks in the sketch), deep water and trees beyond the edges. The path comes in from the bottom edge.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by deep river water, rocks and trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 41. 4-2 開店の日の店内

- 添付：`docs/sketches/room_layouts/room_opening_shop.png`、`public/assets/maps/showa_street.webp`
- 保存名：`map_opening_shop.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: the inside of a small Japanese watch and clock shop on its opening day in the spring of 1980, seen from above with the ceiling removed, warm sepia-tinted retro colors with fresh wood. A long glass display counter with wristwatches and two small glass cases (the dark blocks in the sketch), wall clocks and a tall antique pendulum clock against the top wall, a workbench with a desk lamp and tiny tools, congratulatory flowers by the door. The entrance (a rolling shutter, raised) comes in from the bottom edge.
An opening at the center of the bottom edge, one sixth of the image width wide, leading out of the image. All other edges are closed by shop walls.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

## 済んだ絵

届いてゲームに入れた絵（指示文は `scripts/art_queue.py` と台帳 `src/data/assets.ts`）。

- **A. 小夜子（ヒロイン）**（2 枚）：小夜子の設定画、小夜子の胸から上の基本の1枚（微笑み）
- **B. 3章の人**（9 枚）：ちよ（今75歳。ひだまり荘）、のぼる（今68歳。ちよの弟）、写しのちよ（昭和41年、15歳）、写しの菊（ちよとのぼるの母。昭和41年、40歳くらい）、写しののぼる（昭和41年、8歳）、しおり（今22歳。印刷会社の一年目）、とうや（今22歳。鉄道の保線の仕事）、写しのしおり（平成31年3月、15歳）、写しのとうや（平成31年3月、15歳）
- **C. 2章の残りの人**（7 枚）：写しのこうじ（平成10年、12歳）、写しのまさる（平成10年、40代。こうじの父）、まさる（今70歳くらい。こうじの父）、すみ（今77歳。銭湯「松の湯」の女将）、写しのすみ（昭和44年、22歳。番台の娘）、だいち（今37歳。けんたのバンドのドラム）、さき（今37歳。けんたのバンドのベース）
- **D. 敵**（32 枚）：2-1 歯車ノイズ、2-1 ネジノイズ、2-1 真空管ノイズ、2-1 そろばんノイズ、2-1 旋盤のぬし（ボス）、2-2 ガラケーノイズ、2-2 写真シールノイズ、2-2 ラジカセノイズ、2-2 メトロノームノイズ、2-2 アンプのぬし（ボス）、2-3 ボールノイズ、2-3 電子ペットノイズ、2-3 メガホンノイズ、2-3 水筒ノイズ、2-3 スコアボードのぬし（ボス）、3-1 扇風機ノイズ、3-1 蚊取り線香ノイズ、3-1 トランジスタラジオノイズ、3-1 ちゃぶ台ノイズ、3-1 郵便ポストノイズ（番人）、3-1 汽車のぬし（ボス）、祭りの夜 提灯ノイズ、祭りの夜 風車ノイズ、祭りの夜 飴細工ノイズ、祭りの夜 蓄音機ノイズ、祭りの夜 やぐらのぬし（ボス）、3-2 イヤホンノイズ、3-2 自撮り棒ノイズ、3-2 タピオカノイズ、3-2 卒業証書の筒ノイズ、3-2 寄せ書きの色紙ノイズ（番人）、3-2 踏切のぬし（ボス）
- **E. 部屋の地図**（38 枚）：1-1 参道の入口、1-1 屋台の裏、1-1 屋台の裏通り、1-1 射的と金魚すくいの通り、1-1 社の裏の林、1-2 左の路地裏、1-2 右の電器屋の裏通り、1-2 坂の上の先、2-2 模擬店の中庭、2-2 駐輪場、2-2 渡り廊下と音楽室の前、2-2 お化け屋敷の教室、2-2 体育館、2-3 土手の道、2-3 ベンチの裏の木陰、2-3 川べり、2-3 売店のテント、2-3 用具小屋の裏、2-3 ダイヤモンド、2-3 4晩目 書庫の通用口の廊下、2-3 4晩目 閲覧室、2-3 4晩目 奥の部屋（黒い扉）、2-3 4晩目 奥の書庫、3-1 村の駅前、3-1 田んぼ道、3-1 鎮守の森の石段、3-1 実家の庭、3-1 川べり、3-1 夕暮れの駅のホーム、3-2 校門の坂、3-2 体育館の裏、3-2 商店街、3-2 川の土手、3-2 夕暮れの踏切、祭りの夜 鳥居と参道、祭りの夜 屋台の通り、祭りの夜 やぐらの広場、祭りの夜 夜の端
- **F. 会話の背景**（14 枚）：施設の居間（夜、テレビの光だけ）、平成の高校の文化祭（秋の昼）、昭和41年の夏、山あいの村（昼）、昭和41年の夏、村の駅（夕暮れ）、ひだまり荘の部屋（窓辺）、ひだまり荘の部屋（窓辺・雨）、町の駅のホーム（夕方の前）、文化祭の学校の中庭（今）、大正十年の夏祭り（夜）、祭りの夜の端（砂の落ちる縁）、町の神社（今の昼）、平成31年3月、卒業式の帰り道（昼）、平成31年3月、夕暮れの踏切、駅の近くの踏切（今の夕方の前）
- **G. 1枚絵**（1 枚）：代打の一打（2-3）
- **H. スナップの写真**（14 枚）：スナップ：ソード、スナップ：ヘビーブロウ、スナップ：ファイアボール、スナップ：アイスニードル、スナップ：サンダーボルト、スナップ：ワイドショット、スナップ：リカバー、スナップ：クイックステップ、スナップ：サーチ、スナップ：ブレイクアーム、スナップ：ドロー、スナップ：ジョーカー、スナップ：アンコール、スナップ：ピンチヒッター
- **I. みお・小夜子の表情**（18 枚）：みお：真剣（93回）、みお：驚き（90回）、みお：考える（44回）、みお：心配（28回）、みお：大笑い（25回）、みお：むっ（22回）、みお：悔しい（18回）、みお：困り笑い（10回）、みお：照れ（8回）、みお：泣き笑い（3回）、小夜子：考える（41回）、小夜子：驚き（22回）、小夜子：笑顔（21回）、小夜子：真剣（20回）、小夜子：通常（8回）、小夜子：照れ（7回）、小夜子：さみしげ（5回）、小夜子：泣き笑い（2回）
- **K. ハルト・あかりの足りない表情**（2 枚）：ハルト：考える、あかり：泣きそう
- **L. 拠点のタイル（思い出のギャラリー）**（9 枚）：タイル：記憶をたどる、タイル：星図、タイル：武器、タイル：ムーブメント、タイル：アルバム、タイル：並び、タイル：交換所、タイル：落とし物の棚、タイル：町の小話
- **M. みおの目を閉じた絵（まばたき用）**（10 枚）：みお：笑顔（目を閉じた絵）、みお：真剣（目を閉じた絵）、みお：驚き（目を閉じた絵）、みお：考える（目を閉じた絵）、みお：心配（目を閉じた絵）、みお：むっ（目を閉じた絵）、みお：悔しい（目を閉じた絵）、みお：困り笑い（目を閉じた絵）、みお：照れ（目を閉じた絵）、みお：泣き笑い（目を閉じた絵）
