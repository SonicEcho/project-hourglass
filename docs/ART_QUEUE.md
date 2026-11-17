# 絵の「そのまま貼る一覧」

**まだの絵：12 枚**（済んだ絵 203 枚は、いちばん下に名前だけ）。上から順に作る。**1つの枠が1枚**。

- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）
- できた絵は「保存名」の名前で保存して、まとめて Claude に送る。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする
- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい
- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる（届いた絵は DONE に足すと、下の「済んだ絵」に移る）
- まだ一覧にない物：ひなののまばたき・口パク（Gemini。ART.md の 5-8 の 1）、昼の町の地図と2頭身の歩くハルト・カイ（5-8 の 2〜4）、脇役の表情違い（5-3 の 14）、写しのしずえ・写しのじん・写しのとしおの立ち絵

## まだの絵

- [Q. だいち・さきの描き直し（けんたと見分けやすく）](#q-だいちさきの描き直しけんたと見分けやすく)：2 枚
- [R. 洋服の小夜子（試着室）](#r-洋服の小夜子試着室)：3 枚
- [S. とうや・しおりのまばたき・口パク用](#s-とうやしおりのまばたき口パク用)：4 枚
- [V. 砂の底のレアスナップ（段階219）](#v-砂の底のレアスナップ段階219)：3 枚
- [X. 寄り道の町の人（段階239）と寄り道のタイル（段階240）](#x-寄り道の町の人段階239)：3 枚（表情違いは、基本の1枚の後に）

### Q. だいち・さきの描き直し（けんたと見分けやすく）

テストプレイのメモ 2 の 1：15日目のけんた・だいち・さきの顔が似すぎている（3人とも同じ輪郭・目・笑い方だった）。絵柄と構図はそのままで、顔のつくり・髪型・体つきを、けんたとはっきり変える。けんたの絵は「この人と似せない」ために添付する。できた絵は、今の daichi_smile・saki_smile と差し替える

#### 1. だいち（描き直し）

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/kenta_smile.webp`
- 保存名：`daichi_smile_v2.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a friendly, slightly awkward smile with his eyes narrowed into thin happy arcs.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Daichi, a 37-year-old Japanese salesman, the former drummer of a high school band. He must look clearly different from the man in the second attached portrait: a stocky, broad-shouldered build, a round full face with a wide jaw and slightly chubby cheeks, thick straight eyebrows, small narrow eyes, very short cropped black hair (a neat crew cut, forehead fully visible), clean-shaven, black rectangular-framed glasses. A dark navy business suit with a white shirt and a loosened plain dark red tie. Same art style as the first attached portrait.
```

#### 2. さき（描き直し）

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/kenta_smile.webp`
- 保存名：`saki_smile_v2.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a confident, teasing smile with one corner of her mouth raised.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Saki, a 37-year-old Japanese woman, the former bassist of a high school band, now a working mother. She must look clearly different from the man in the second attached portrait: a slim oval face with a sharp chin, upturned almond-shaped cat-like eyes with long lashes, a small beauty mark under her left eye, glossy jet-black hair in a short chin-length bob with blunt side-swept bangs, small silver hoop earrings. A mustard-yellow knit sweater over a white collared shirt. Straightforward and a little mischievous. Same art style as the first attached portrait.
```

### R. 洋服の小夜子（試着室）

テストプレイのメモ 2 の 25：29日目の絆の出来事「試着室」（`bond_sayoko2`）で、カーテンが開いた後に出す洋服の小夜子。今の小夜子の「微笑み」の絵を添付する。台本で使う表情（照れ・驚き）と、あとで使えるように微笑み

#### 3. 洋服の小夜子：照れ（基本の1枚）

- 添付：`public/assets/portraits/sayoko_smile.webp`
- 保存名：`sayoko_western_shy.png`
- メモ：一番先に作る。下の2枚は、この絵を添付する

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a shy, blushing look, cheeks pink, eyes cast down a little, a small embarrassed smile.
This is exactly the same character as the attached portrait: Sayoko, the girl in the attached portrait, the same face, long straight black hair and silver crescent moon hairpin, but now wearing modern clothes for the first time: a plain white blouse with a soft round collar and a navy knee-length skirt (the skirt may be outside the frame). Keep the crescent moon hairpin.
Change the outfit to the modern clothes described above and the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same face, hairstyle, hairpin, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 4. 洋服の小夜子：驚き

- 添付：`sayoko_western_shy.png（上で作った絵）`
- 保存名：`sayoko_western_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips parted, then frozen as if she cannot answer.
This is exactly the same character as the attached portrait: Sayoko, the girl in the attached portrait, the same face, long straight black hair and silver crescent moon hairpin, but now wearing modern clothes for the first time: a plain white blouse with a soft round collar and a navy knee-length skirt (the skirt may be outside the frame). Keep the crescent moon hairpin.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 5. 洋服の小夜子：微笑み

- 添付：`sayoko_western_shy.png（上で作った絵）`
- 保存名：`sayoko_western_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, happy smile.
This is exactly the same character as the attached portrait: Sayoko, the girl in the attached portrait, the same face, long straight black hair and silver crescent moon hairpin, but now wearing modern clothes for the first time: a plain white blouse with a soft round collar and a navy knee-length skirt (the skirt may be outside the frame). Keep the crescent moon hairpin.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

### S. とうや・しおりのまばたき・口パク用

テストプレイのメモ 2 の 27：とうやとしおりは、まばたき・口パクがない。表情が笑顔の1枚だけなので、その絵をそのまま直して、目だけ閉じた絵と、口だけ開けた絵を作る（けんたと同じ作り方。scripts/portrait_parts.py）。毎回その人の絵を添付する。構図が少しでも動いたら作り直す

#### 6. とうや：目を閉じた絵

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 7. とうや：口を開けた絵

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 8. しおり：目を閉じた絵

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 9. しおり：口を開けた絵

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

### V. 砂の底のレアスナップ（段階219）

砂の底の珍品で手に入る、新しい戦闘の札の写真（`src/data/chainDig.ts`）。今は近い雰囲気の今ある絵を仮に使っている。毎回、絵柄の見本として今あるスナップの写真を添付する。届いたら 768×768 の WebP にして、台帳に足し、`DIG_CARD_ART` をつなぎ替える

#### 10. スナップ「残像」（感覚記憶の層）

- 添付：`public/assets/snaps/encore.webp`
- 保存名：`snap_digZanzo.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces. Match the art style of the attached snapshot.
A child running through a summer festival at dusk between paper lanterns, caught with soft motion blur, so a faint transparent afterimage of the child trails a step behind. The feeling of a moment that stays in the eyes for just a second.
Absolutely no letters or text anywhere.
```

#### 11. スナップ「うたかた」（短期記憶の層）

- 添付：`public/assets/snaps/encore.webp`
- 保存名：`snap_digUtakata.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces. Match the art style of the attached snapshot.
Soap bubbles drifting over an old shopping street at dusk, catching the orange light; one bubble is just about to pop. A small child's hand with a bubble wand at the edge of the frame. Fleeting and gentle.
Absolutely no letters or text anywhere.
```

#### 12. スナップ「回想」（エピソード記憶の層）

- 添付：`public/assets/snaps/encore.webp`
- 保存名：`snap_digKaiso.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A candid snapshot, like a slightly faded instant photo of a precious everyday moment. Square 1:1 image. The main subject is in the center of the image; the outer edges are simple, because the image will be cropped tightly. Do not draw a photo border or frame. People are shown from behind, from the side, or small in the scene; no large close-up faces. Match the art style of the attached snapshot.
An old photo album lying open on a wooden table in warm evening light, a few faded photographs of festivals and school days slightly out of focus, a cup of tea beside it. The quiet feeling of remembering many days at once.
Absolutely no letters or text anywhere.
```

### W. 拠点のメニューの絵（段階226・227。開発者が先に全部用意する）

拠点のメニュー（`addSlantTile`）は縦長の斜めのカード（4列）と、横長の「砂の底へ」の帯。今の絵は横長（3:2）で、縦に切ると端が切れるので、全部頼み直す。
毎回、絵柄の見本として添付の絵（今のタイルの絵）を付ける。届いたら：縦長は 512×768、砂の底は 768×512 の WebP にして `public/assets/tiles/<名前>_tall.webp`（砂の底は `sandBottom.webp`）に置き、
台帳（`src/data/assets.ts` の `tileArt`）に足す。拠点（縦長）は新しい絵、休憩所（横長のタイル）は今の絵のまま使い分ける

#### 13. 砂の底（横長の帯）

- cg.cut_ground の代わり。添付：`public/assets/tiles/navi.webp`
- 保存名：`tile_sandBottom.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A large banner illustration for the hub screen of a mobile RPG. Horizontal 3:2 image (1536×1024). The banner will be cut into a wide slanted strip (about 2.3:1), so keep the main subject in the middle band of the image, with the top and bottom simple. Keep the lower-left corner darker and simple, because a red label will be placed over it. Rich, glowing light against deep shadows. Match the art style of the attached tile illustration.
A deep cross-section of sand strata beneath the library of memories, like the bottom of a giant hourglass: layers of sand in different warm colors with small glowing keepsakes and tiny lights buried in them. On the left, a small figure with a shovel stands at the mouth of a dug tunnel leading down and to the right into the glowing depths; golden sand trickles down from far above like a waterfall of time.
Absolutely no letters, numbers or text anywhere.
```

#### 14. 星図

- 添付：`public/assets/tiles/growth.webp`（今の絵。同じ題材で縦長に）
- 保存名：`tile_growth_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A deep indigo night sky full of stars above the library of memories. Near the bottom stands a large antique hourglass whose falling sand glitters like stardust and rises upward into the sky, becoming new stars; above it, several stars are linked by thin glowing golden lines into a tall constellation that climbs toward the top of the image.
Absolutely no letters, numbers or text anywhere.
```

#### 15. 武器

- 添付：`public/assets/tiles/weapon.webp`
- 保存名：`tile_weapon_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A single slender sword standing upright, point down, on dark crimson velvet in the library of memories, its blade faintly glowing with a crimson light, as if remembering the boy who wields it. Above and behind it, faint silver octagonal emblems linked by thin crimson lines float in the dark like a family tree. Floating grains of golden sand.
Absolutely no letters, numbers or text anywhere.
```

#### 16. ムーブメント

- 添付：`public/assets/tiles/navi.webp`
- 保存名：`tile_navi_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
An antique pocket watch hanging by its chain from the top of the image, its back cover open, showing the beautiful clockwork movement: interlocking gears made of four metals (copper, blued steel, green bronze and yellow brass), tiny red ruby jewels, blued screws, and a golden balance wheel in motion. Warm light catching the metal edges, dark velvet background.
Absolutely no letters, numbers or text anywhere.
```

#### 17. アルバム

- 添付：`public/assets/tiles/album.webp`
- 保存名：`tile_album_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
An old photo album lying open on a dark wooden desk, seen from above, lit by a warm desk lamp. Several slightly faded instant photos are taped onto cream-colored pages in a vertical column; the photos show only soft blurry colors of everyday moments (a festival night, a riverside sunset, a classroom), with no clear faces. A roll of masking tape and a few loose photos at the edge.
Absolutely no letters, numbers or text anywhere.
```

#### 18. 並び

- 添付：`public/assets/tiles/party.webp`
- 保存名：`tile_party_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A narrow country path at night running straight away from the viewer into soft mist, seen from the middle of the path. Small old-fashioned oil lanterns stand on both sides; only the nearest few are lit with a warm golden glow, the rest stand unlit and fade into the deep mist. A quiet feeling of choosing who will walk the road together tonight. No people, no hands, no silhouettes, no footprints.
Absolutely no letters, numbers or text anywhere.
```

#### 19. ライブラリ

- 今は蔵書の棚の背景で代わり。添付：`public/assets/tiles/navi.webp`
- 保存名：`tile_library_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A tall wooden card catalog cabinet in a quiet corner of the library of memories, seen from the front, its many small drawers rising up to the top of the image. One drawer in the middle is pulled open, filled with neat rows of record cards; a few cards are lifted out, each with a tiny glowing picture of a snapshot, a monster silhouette or a small material, like a collector's index. Warm desk-lamp light, floating grains of golden sand.
Absolutely no letters, numbers or text anywhere.
```

#### 20. 交換所

- 添付：`public/assets/tiles/exchange.webp` と、ペトラの立ち絵
- 保存名：`tile_exchange_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A neat exchange counter between tall bookshelves in the library of memories, seen from the front: a brass balance scale in the center, glass jars of glowing sand and small crystal memory fragments on the shelves above, a thick ledger and a rubber stamp on the counter. Behind the counter, the clerk in the attached portrait is seen small, adjusting her glasses while checking the ledger.
Absolutely no letters, numbers or text anywhere.
```

#### 21. 落とし物

- 添付：`public/assets/tiles/lost.webp`
- 保存名：`tile_lost_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A tall narrow wooden shelf of lost things in a quiet corner of the library of memories, each item with a little paper tag tied by string (the tags are blank), arranged from top to bottom: a child's straw hat, a red umbrella, a wind-up tin toy, a music box, a single glove, an old cassette tape. A soft golden glow on each item, as if waiting for its owner.
Absolutely no letters, numbers or text anywhere.
```

#### 22. 町の小話

- 添付：`public/assets/tiles/talks.webp`
- 保存名：`tile_talks_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A narrow Japanese shopping street at dusk seen straight down its length, with paper lanterns and shop lights coming on and receding into the distance. In the lower middle, a few townspeople chatting in front of a bakery and a candy shop, a cat on a bench, warm windows. People are small and seen from the side or behind. A peaceful, everyday evening.
Absolutely no letters, numbers or text anywhere.
```

### X. 寄り道の町の人（段階239）

寄り道（`docs/milestones/M3_side_events.md`）に出る、現代の商店街の人。今は図形で出している（`src/data/dialogue.ts` の `CAST`）。絵が届いたら、`portrait.goro`・`portrait.zenji` として台帳に足し、`CAST` に `portrait` と表情を書く。表情違い（困り・驚き・照れ・泣き笑い／微笑み・照れ・驚き）は、基本の1枚を見てから頼む。

#### 1. 五郎（八百屋の主人。商店街の福引の係）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`goro_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a big, hearty open-mouthed grin.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Goro, a 58-year-old Japanese greengrocer in a small local shopping street, cheerful and loud. Stocky build, sun-tanned round face, short graying crew cut, a twisted towel tied around his forehead as a headband, a dark green apron with a front pocket over a white T-shirt. Present-day Japan.
Keep the face and body proportions natural for his age. Absolutely no letters or text anywhere.
```

#### 2. 善次（時計屋の常連。毎週火曜に、壊れていない腕時計を見せに来る）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`zenji_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a soft, gentle smile with kind, slightly watery eyes.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Zenji, an 82-year-old Japanese widower, quiet and polite. Slim, slightly stooped, neatly combed thin white hair, small round glasses, a tidy gray cardigan over a white collared shirt. Present-day Japan.
Absolutely no letters or text anywhere.
```

#### 3. 拠点のタイル「寄り道」（段階240。縦長。今は手品の1枚絵で代わりに出している）

- 添付：`public/assets/tiles/lost.webp`
- 保存名：`tile_side_tall.png`（台帳の id は `tile.side`）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
An open, well-worn notebook lying on a small wooden desk in the library of memories, its pages filled with small pasted snapshots and pressed keepsakes from a small town: a lottery ticket stub, a playing card (the joker, with only a simple jester pattern), a wristwatch strap, a pressed flower. A warm desk lamp glow and drifting golden dust. The writing on the pages is only wavy lines.
Absolutely no letters, numbers or text anywhere.
```

## 済んだ絵

届いてゲームに入れた絵（指示文は `scripts/art_queue.py` と台帳 `src/data/assets.ts`）。

- **A. 小夜子（ヒロイン）**（2 枚）：小夜子の設定画、小夜子の胸から上の基本の1枚（微笑み）
- **B. 3章の人**（9 枚）：ちよ（今75歳。ひだまり荘）、のぼる（今68歳。ちよの弟）、写しのちよ（昭和41年、15歳）、写しの菊（ちよとのぼるの母。昭和41年、40歳くらい）、写しののぼる（昭和41年、8歳）、しおり（今22歳。印刷会社の一年目）、とうや（今22歳。鉄道の保線の仕事）、写しのしおり（平成31年3月、15歳）、写しのとうや（平成31年3月、15歳）
- **C. 2章の残りの人**（7 枚）：写しのこうじ（平成10年、12歳）、写しのまさる（平成10年、40代。こうじの父）、まさる（今70歳くらい。こうじの父）、すみ（今77歳。銭湯「松の湯」の女将）、写しのすみ（昭和44年、22歳。番台の娘）、だいち（今37歳。けんたのバンドのドラム）、さき（今37歳。けんたのバンドのベース）
- **D. 敵**（32 枚）：2-1 歯車ノイズ、2-1 ネジノイズ、2-1 真空管ノイズ、2-1 そろばんノイズ、2-1 旋盤のぬし（ボス）、2-2 ガラケーノイズ、2-2 写真シールノイズ、2-2 ラジカセノイズ、2-2 メトロノームノイズ、2-2 アンプのぬし（ボス）、2-3 ボールノイズ、2-3 電子ペットノイズ、2-3 メガホンノイズ、2-3 水筒ノイズ、2-3 スコアボードのぬし（ボス）、3-1 扇風機ノイズ、3-1 蚊取り線香ノイズ、3-1 トランジスタラジオノイズ、3-1 ちゃぶ台ノイズ、3-1 郵便ポストノイズ（番人）、3-1 汽車のぬし（ボス）、祭りの夜 提灯ノイズ、祭りの夜 風車ノイズ、祭りの夜 飴細工ノイズ、祭りの夜 蓄音機ノイズ、祭りの夜 やぐらのぬし（ボス）、3-2 イヤホンノイズ、3-2 自撮り棒ノイズ、3-2 タピオカノイズ、3-2 卒業証書の筒ノイズ、3-2 寄せ書きの色紙ノイズ（番人）、3-2 踏切のぬし（ボス）
- **E. 部屋の地図**（39 枚）：1-1 参道の入口、1-1 屋台の裏、1-1 屋台の裏通り、1-1 射的と金魚すくいの通り、1-1 社の裏の林、1-2 左の路地裏、1-2 右の電器屋の裏通り、1-2 坂の上の先、2-2 校門の前庭、2-2 模擬店の中庭、2-2 駐輪場、2-2 渡り廊下と音楽室の前、2-2 お化け屋敷の教室、2-2 体育館、2-3 土手の道、2-3 ベンチの裏の木陰、2-3 川べり、2-3 売店のテント、2-3 用具小屋の裏、2-3 ダイヤモンド、2-3 4晩目 書庫の通用口の廊下、2-3 4晩目 閲覧室、2-3 4晩目 奥の部屋（黒い扉）、2-3 4晩目 奥の書庫、3-1 村の駅前、3-1 田んぼ道、3-1 鎮守の森の石段、3-1 実家の庭、3-1 川べり、3-1 夕暮れの駅のホーム、3-2 校門の坂、3-2 体育館の裏、3-2 商店街、3-2 川の土手、3-2 夕暮れの踏切、祭りの夜 鳥居と参道、祭りの夜 屋台の通り、祭りの夜 やぐらの広場、祭りの夜 夜の端
- **F. 会話の背景**（14 枚）：施設の居間（夜、テレビの光だけ）、平成の高校の文化祭（秋の昼）、昭和41年の夏、山あいの村（昼）、昭和41年の夏、村の駅（夕暮れ）、ひだまり荘の部屋（窓辺）、ひだまり荘の部屋（窓辺・雨）、町の駅のホーム（夕方の前）、文化祭の学校の中庭（今）、大正十年の夏祭り（夜）、祭りの夜の端（砂の落ちる縁）、町の神社（今の昼）、平成31年3月、卒業式の帰り道（昼）、平成31年3月、夕暮れの踏切、駅の近くの踏切（今の夕方の前）
- **G. 1枚絵**（1 枚）：代打の一打（2-3）
- **H. スナップの写真**（14 枚）：スナップ：ソード、スナップ：ヘビーブロウ、スナップ：ファイアボール、スナップ：アイスニードル、スナップ：サンダーボルト、スナップ：ワイドショット、スナップ：リカバー、スナップ：クイックステップ、スナップ：サーチ、スナップ：ブレイクアーム、スナップ：ドロー、スナップ：ジョーカー、スナップ：アンコール、スナップ：ピンチヒッター
- **I. みお・小夜子の表情**（18 枚）：みお：真剣（93回）、みお：驚き（90回）、みお：考える（44回）、みお：心配（28回）、みお：大笑い（25回）、みお：むっ（22回）、みお：悔しい（18回）、みお：困り笑い（10回）、みお：照れ（8回）、みお：泣き笑い（3回）、小夜子：考える（41回）、小夜子：驚き（22回）、小夜子：笑顔（21回）、小夜子：真剣（20回）、小夜子：通常（8回）、小夜子：照れ（7回）、小夜子：さみしげ（5回）、小夜子：泣き笑い（2回）
- **J. 4-1「シロのいた夏」の人**（15 枚）：たいち（今16歳。高校1年）：通常、たいち：不機嫌、たいち：泣きそう、たいち：考える、たいち：驚き、たいち：笑顔、写しのたいち（平成30年の夏、10歳）：通常、写しのたいち：笑顔、写しのたいち：泣きそう、写しのたいち：真剣、写しのたいち：怒り、写しのたいち：驚き、写しのたいち：不機嫌、写しのおじいちゃん（平成30年の夏）：通常、写しのおじいちゃん：怒り
- **K. ハルト・あかりの足りない表情**（2 枚）：ハルト：考える、あかり：泣きそう
- **L. 拠点のタイル（思い出のギャラリー）**（9 枚）：タイル：記憶をたどる、タイル：星図、タイル：武器、タイル：ムーブメント、タイル：アルバム、タイル：並び、タイル：交換所、タイル：落とし物の棚、タイル：町の小話
- **M. みおの目を閉じた絵（まばたき用）**（10 枚）：みお：笑顔（目を閉じた絵）、みお：真剣（目を閉じた絵）、みお：驚き（目を閉じた絵）、みお：考える（目を閉じた絵）、みお：心配（目を閉じた絵）、みお：むっ（目を閉じた絵）、みお：悔しい（目を閉じた絵）、みお：困り笑い（目を閉じた絵）、みお：照れ（目を閉じた絵）、みお：泣き笑い（目を閉じた絵）
- **N. 早瀬（仲間）**（8 枚）：早瀬の設定画、早瀬の設定画（1枚目を直す）、早瀬の胸から上の基本の1枚（通常）、早瀬：考える（8回）、早瀬：苦笑い（5回）、早瀬：驚き（2回）、早瀬：怒り（2回）、早瀬：泣き笑い（1回）
- **O. 4章の敵**（12 枚）：4-1 虫かごノイズ、4-1 すいかノイズ、4-1 花火の燃えかすノイズ、4-1 水鉄砲ノイズ、4-1 お地蔵さまの前の砂嵐（番人）、4-1 川のぬし（ボス）、4-2 ハイパーヨーヨーノイズ、4-2 ポケベルノイズ、4-2 紙風船ノイズ、4-2 鳩時計ノイズ、4-2 開店祝いの花輪ノイズ（番人）、4-2 シャッターのぬし（ボス）
- **P. 4章の部屋の地図**（6 枚）：4-1 おじいちゃんの家の庭、4-1 物置、4-1 田んぼのあぜ道、4-1 用水路、4-1 川の浅瀬、4-2 開店の日の店内
- **T. 砂の底を掘る、二頭身のハルト**（1 枚）：掘る二頭身のハルト（4行×3列）
- **U. 砂の底を掘る、二頭身の仲間（あかり・みお・小夜子・早瀬）**（4 枚）：掘る二頭身のあかり、掘る二頭身のみお、掘る二頭身の小夜子、掘る二頭身の早瀬
