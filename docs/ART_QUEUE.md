# 絵の「そのまま貼る一覧」

**まだの絵：194 枚**（済んだ絵 203 枚は、いちばん下に名前だけ）。上から順に作る。**1つの枠が1枚**。

- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）
- できた絵は「保存名」の名前で保存して、まとめて Claude に送る。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする
- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい
- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる（届いた絵は DONE に足すと、下の「済んだ絵」に移る）
- まだ一覧にない物：探索の地図を歩く2頭身のハルト・カイ（`docs/ART.md` の 5-5b の 3〜4。試し）。拠点のメニューの絵のうち、ムーブメント・アルバム・編成・町の小話の縦長（W。今の横長の絵を使い回すと決めたので、作らなくてよい）

## まだの絵

- [Q. だいち・さきの描き直し（けんたと見分けやすく）](#q-だいちさきの描き直しけんたと見分けやすく)：2 枚
- [R. 洋服の小夜子（試着室）](#r-洋服の小夜子試着室)：3 枚
- [S. とうや・しおりのまばたき・口パク用](#s-とうやしおりのまばたき口パク用)：4 枚
- [V. 砂の底のレアスナップ（段階219）](#v-砂の底のレアスナップ段階219)：3 枚
- [Y. 寄り道の町の人の表情違い（五郎・善次・トメ）](#y-寄り道の町の人の表情違い五郎善次トメ)：10 枚
- [Z. 立ち絵のない3人（写しのじん・写しのしずえ・写しのとしお）](#z-立ち絵のない3人写しのじん写しのしずえ写しのとしお)：13 枚
- [AA. 早瀬（仲間）のまばたき・口パク](#aa-早瀬仲間のまばたき口パク)：9 枚
- [AB. 脇役の表情違い（台本で使う表情だけ）](#ab-脇役の表情違い台本で使う表情だけ)：94 枚
- [AC. 脇役のまばたき・口パク（基本の1枚）](#ac-脇役のまばたき口パク基本の1枚)：56 枚

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

#### W-13. 砂の底（横長の帯）（済）

- cg.cut_ground の代わり。添付：`public/assets/tiles/navi.webp`
- 保存名：`tile_sandBottom.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A large banner illustration for the hub screen of a mobile RPG. Horizontal 3:2 image (1536×1024). The banner will be cut into a wide slanted strip (about 2.3:1), so keep the main subject in the middle band of the image, with the top and bottom simple. Keep the lower-left corner darker and simple, because a red label will be placed over it. Rich, glowing light against deep shadows. Match the art style of the attached tile illustration.
A deep cross-section of sand strata beneath the library of memories, like the bottom of a giant hourglass: layers of sand in different warm colors with small glowing keepsakes and tiny lights buried in them. On the left, a small figure with a shovel stands at the mouth of a dug tunnel leading down and to the right into the glowing depths; golden sand trickles down from far above like a waterfall of time.
Absolutely no letters, numbers or text anywhere.
```

#### W-14. 星図（済）

- 添付：`public/assets/tiles/growth.webp`（今の絵。同じ題材で縦長に）
- 保存名：`tile_growth_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A deep indigo night sky full of stars above the library of memories. Near the bottom stands a large antique hourglass whose falling sand glitters like stardust and rises upward into the sky, becoming new stars; above it, several stars are linked by thin glowing golden lines into a tall constellation that climbs toward the top of the image.
Absolutely no letters, numbers or text anywhere.
```

#### W-15. 武器（済）

- 添付：`public/assets/tiles/weapon.webp`
- 保存名：`tile_weapon_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A single slender sword standing upright, point down, on dark crimson velvet in the library of memories, its blade faintly glowing with a crimson light, as if remembering the boy who wields it. Above and behind it, faint silver octagonal emblems linked by thin crimson lines float in the dark like a family tree. Floating grains of golden sand.
Absolutely no letters, numbers or text anywhere.
```

#### W-16. ムーブメント（作らなくてよい：今の絵を使い回す）

- 添付：`public/assets/tiles/navi.webp`
- 保存名：`tile_navi_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
An antique pocket watch hanging by its chain from the top of the image, its back cover open, showing the beautiful clockwork movement: interlocking gears made of four metals (copper, blued steel, green bronze and yellow brass), tiny red ruby jewels, blued screws, and a golden balance wheel in motion. Warm light catching the metal edges, dark velvet background.
Absolutely no letters, numbers or text anywhere.
```

#### W-17. アルバム（作らなくてよい：今の絵を使い回す）

- 添付：`public/assets/tiles/album.webp`
- 保存名：`tile_album_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
An old photo album lying open on a dark wooden desk, seen from above, lit by a warm desk lamp. Several slightly faded instant photos are taped onto cream-colored pages in a vertical column; the photos show only soft blurry colors of everyday moments (a festival night, a riverside sunset, a classroom), with no clear faces. A roll of masking tape and a few loose photos at the edge.
Absolutely no letters, numbers or text anywhere.
```

#### W-18. 並び（作らなくてよい：今の絵を使い回す）

- 添付：`public/assets/tiles/party.webp`
- 保存名：`tile_party_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A narrow country path at night running straight away from the viewer into soft mist, seen from the middle of the path. Small old-fashioned oil lanterns stand on both sides; only the nearest few are lit with a warm golden glow, the rest stand unlit and fade into the deep mist. A quiet feeling of choosing who will walk the road together tonight. No people, no hands, no silhouettes, no footprints.
Absolutely no letters, numbers or text anywhere.
```

#### W-19. ライブラリ（済）

- 今は蔵書の棚の背景で代わり。添付：`public/assets/tiles/navi.webp`
- 保存名：`tile_library_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A tall wooden card catalog cabinet in a quiet corner of the library of memories, seen from the front, its many small drawers rising up to the top of the image. One drawer in the middle is pulled open, filled with neat rows of record cards; a few cards are lifted out, each with a tiny glowing picture of a snapshot, a monster silhouette or a small material, like a collector's index. Warm desk-lamp light, floating grains of golden sand.
Absolutely no letters, numbers or text anywhere.
```

#### W-20. 交換所（済）

- 添付：`public/assets/tiles/exchange.webp` と、ペトラの立ち絵
- 保存名：`tile_exchange_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A neat exchange counter between tall bookshelves in the library of memories, seen from the front: a brass balance scale in the center, glass jars of glowing sand and small crystal memory fragments on the shelves above, a thick ledger and a rubber stamp on the counter. Behind the counter, the clerk in the attached portrait is seen small, adjusting her glasses while checking the ledger.
Absolutely no letters, numbers or text anywhere.
```

#### W-21. 落とし物（済）

- 添付：`public/assets/tiles/lost.webp`
- 保存名：`tile_lost_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A tall narrow wooden shelf of lost things in a quiet corner of the library of memories, each item with a little paper tag tied by string (the tags are blank), arranged from top to bottom: a child's straw hat, a red umbrella, a wind-up tin toy, a music box, a single glove, an old cassette tape. A soft golden glow on each item, as if waiting for its owner.
Absolutely no letters, numbers or text anywhere.
```

#### W-22. 町の小話（作らなくてよい：今の絵を使い回す）

- 添付：`public/assets/tiles/talks.webp`
- 保存名：`tile_talks_tall.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A menu card illustration for the hub screen of a mobile RPG. Vertical 2:3 image (1024×1536). The card will be cut into a narrow slanted parallelogram, so keep the main subject in the center column of the image (the middle 60% of the width), with the left and right edges simple and dark. Keep the bottom fifth darker and simple, because a white label will be placed over it. Rich, glowing light against deep shadows, so the card stands out on a near-black screen. Match the art style of the attached tile illustration.
A narrow Japanese shopping street at dusk seen straight down its length, with paper lanterns and shop lights coming on and receding into the distance. In the lower middle, a few townspeople chatting in front of a bakery and a candy shop, a cat on a bench, warm windows. People are small and seen from the side or behind. A peaceful, everyday evening.
Absolutely no letters, numbers or text anywhere.
```

### Y. 寄り道の町の人の表情違い（五郎・善次・トメ）

笑顔の絵が届いた3人の、台本で使う表情（`src/data/scriptSide.ts`）。毎回その人の笑顔の絵を添付する。届いたら `CAST` の表情に足す（今は笑顔で代わりに出している）

#### 13. 五郎：困り

- 添付：`public/assets/portraits/goro_smile.webp`
- 保存名：`goro_troubled.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a troubled, worried look, eyebrows drawn together.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 14. 五郎：驚き

- 添付：`public/assets/portraits/goro_smile.webp`
- 保存名：`goro_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 15. 五郎：照れ

- 添付：`public/assets/portraits/goro_smile.webp`
- 保存名：`goro_shy.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a shy, embarrassed look, cheeks blushing.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 16. 五郎：泣き笑い

- 添付：`public/assets/portraits/goro_smile.webp`
- 保存名：`goro_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 17. 善次：微笑み

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 18. 善次：照れ

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_shy.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a shy, embarrassed look, cheeks blushing.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 19. 善次：驚き

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 20. トメ：微笑み

- 添付：`public/assets/portraits/tome_smile.webp`
- 保存名：`tome_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 21. トメ：困り

- 添付：`public/assets/portraits/tome_smile.webp`
- 保存名：`tome_troubled.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a troubled, worried look, eyebrows drawn together.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 22. トメ：驚き

- 添付：`public/assets/portraits/tome_smile.webp`
- 保存名：`tome_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

### Z. 立ち絵のない3人（写しのじん・写しのしずえ・写しのとしお）

台本で話すのに、まだ色の札で出している3人。写しの人なので、ゲームの側でセピアに染める。まず基本の1枚を作り、表情違いは、その絵を添付して作る

#### 23. 写しのじん（平成9年の春、29歳。早瀬の若いころ）：通常

- 添付：`public/assets/portraits/hayase_normal.webp`
- 保存名：`past_jin_normal.png`
- メモ：見本は今の早瀬（同じ人の若いころ）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, quiet expression, a little stiff and nervous.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: young Jin Hayase, the same man as the attached portrait but 29 years earlier: a 29-year-old Japanese watchmaker in the spring of 1997, on the opening day of his own small watch and clock shop. Keep the same face features so he is clearly the same person, but young, with smooth skin and no beard. Short dark hair neatly combed, a watchmaker's loupe pushed up on his forehead, a clean white shirt with the sleeves rolled up and a plain dark apron. Even quieter than he is now.
```

#### 24. 写しのしずえ（平成9年の春、27歳。早瀬の妻）：笑顔

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/hayase_normal.webp`
- 保存名：`past_shizue_smile.png`
- メモ：構図と大きさの見本は、カーディガンの女の子（1枚目）。2枚目は夫の見た目の参考

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a bright, cheerful open smile.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Shizue, a 27-year-old Japanese woman in the spring of 1997, the wife of the young watchmaker (the man in the second attached portrait, 29 years younger), on the opening day of their small shop. Bright, talkative and always laughing. Shoulder-length dark brown hair loosely tied back with a pale yellow scarf, a few loose strands, a soft cream cardigan over a simple blouse and a plain shop apron, a tiny smudge of ink on one finger from writing the opening-day sign with a brush.
```

#### 25. 写しのとしお（昭和44年の冬、30代。工場の先輩の職人）：通常

- 添付：`public/assets/portraits/akari_smile.webp`、`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_toshio_normal.png`
- メモ：構図の見本はカーディガンの女の子（1枚目）。2枚目は同じ工場の後輩（写しのいさむ）の見た目の参考

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a stern, quiet look, but warm eyes.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Toshio, a Japanese lathe craftsman in his late thirties in the winter of 1969, the senior craftsman of a small town factory and the mentor of the young man in the second attached portrait. A strong, lean build, short cropped black hair under a faded work cap, a gray work uniform with a towel around the neck, a small pencil behind one ear, a faint smudge of machine oil on one cheek. Few words, strict at work, quietly kind.
```

#### 26. 写しのじん：驚き

- 添付：`past_jin_normal.png（上で作った絵）`
- 保存名：`past_jin_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 27. 写しのじん：真剣

- 添付：`past_jin_normal.png（上で作った絵）`
- 保存名：`past_jin_serious.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a serious, earnest look, mouth firmly closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 28. 写しのじん：困り

- 添付：`past_jin_normal.png（上で作った絵）`
- 保存名：`past_jin_troubled.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a troubled, worried look, eyebrows drawn together.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 29. 写しのしずえ：驚き

- 添付：`past_shizue_smile.png（上で作った絵）`
- 保存名：`past_shizue_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 30. 写しのしずえ：大笑い

- 添付：`past_shizue_smile.png（上で作った絵）`
- 保存名：`past_shizue_laugh.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, laughing heartily, eyes squeezed shut, mouth wide open.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 31. 写しのしずえ：考える

- 添付：`past_shizue_smile.png（上で作った絵）`
- 保存名：`past_shizue_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 32. 写しのしずえ：微笑み

- 添付：`past_shizue_smile.png（上で作った絵）`
- 保存名：`past_shizue_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 33. 写しのしずえ：泣き笑い

- 添付：`past_shizue_smile.png（上で作った絵）`
- 保存名：`past_shizue_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 34. 写しのしずえ：照れ

- 添付：`past_shizue_smile.png（上で作った絵）`
- 保存名：`past_shizue_shy.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a shy, embarrassed look, cheeks blushing.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 35. 写しのしずえ：困り笑い

- 添付：`past_shizue_smile.png（上で作った絵）`
- 保存名：`past_shizue_awkward.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, an awkward, troubled little smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

### AA. 早瀬（仲間）のまばたき・口パク

5人目の仲間で台本の台詞が多い（122行）のに、まばたき・口パクがない。表情ごとに別に作った絵なので、みおと同じく、表情の絵をそのまま直して目だけ閉じた絵を作る（`scripts/portrait_parts.py`）。口パクは、口を閉じている表情だけ。毎回その表情の絵を添付する。構図が少しでも動いたら作り直す

#### 36. 早瀬：通常（目を閉じた絵）

- 添付：`public/assets/portraits/hayase_normal.webp`
- 保存名：`hayase_blink_src_normal.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only his eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 37. 早瀬：考える（目を閉じた絵）

- 添付：`public/assets/portraits/hayase_thinking.webp`
- 保存名：`hayase_blink_src_thinking.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same thinking expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only his eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 38. 早瀬：苦笑い（目を閉じた絵）

- 添付：`public/assets/portraits/hayase_wry.webp`
- 保存名：`hayase_blink_src_wry.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same wry smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only his eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 39. 早瀬：驚き（目を閉じた絵）

- 添付：`public/assets/portraits/hayase_surprised.webp`
- 保存名：`hayase_blink_src_surprised.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same surprised expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only his eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 40. 早瀬：怒り（目を閉じた絵）

- 添付：`public/assets/portraits/hayase_angry.webp`
- 保存名：`hayase_blink_src_angry.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same angry expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only his eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 41. 早瀬：泣き笑い（目を閉じた絵）

- 添付：`public/assets/portraits/hayase_teary.webp`
- 保存名：`hayase_blink_src_teary.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling-through-tears expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only his eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 42. 早瀬：通常（口を開けた絵）

- 添付：`public/assets/portraits/hayase_normal.webp`
- 保存名：`hayase_talk_src_normal.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 43. 早瀬：考える（口を開けた絵）

- 添付：`public/assets/portraits/hayase_thinking.webp`
- 保存名：`hayase_talk_src_thinking.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same thinking expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 44. 早瀬：苦笑い（口を開けた絵）

- 添付：`public/assets/portraits/hayase_wry.webp`
- 保存名：`hayase_talk_src_wry.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same wry smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

### AB. 脇役の表情違い（台本で使う表情だけ）

基本の1枚しかない人の、台本で使う表情。台詞の多い人から順に、1人の中は使う回数の多い表情から。今はどれも基本の1枚で代わりに出している。毎回その人の基本の1枚を添付する。届いたら `CAST` の表情に足す

#### 45. いさむ：笑顔（台本で12回）

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a warm, happy smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 46. いさむ：さみしげ（台本で12回）

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 47. いさむ：考える（台本で11回）

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 48. いさむ：驚き（台本で3回）

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 49. いさむ：泣き笑い（台本で3回）

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 50. ペトラ：真剣（台本で13回）

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_serious.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a serious, earnest look, mouth firmly closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 51. ペトラ：困り（台本で10回）

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_troubled.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a troubled, worried look, eyebrows drawn together.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 52. ペトラ：驚き（台本で7回）

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 53. ペトラ：笑顔（台本で5回）

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_smile.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a warm, happy smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 54. しおり：通常（台本で14回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 55. しおり：困り笑い（台本で12回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_awkward.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, an awkward, troubled little smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 56. しおり：驚き（台本で9回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 57. しおり：考える（台本で8回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 58. しおり：苦笑い（台本で7回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 59. しおり：微笑み（台本で4回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 60. しおり：さみしげ（台本で3回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 61. しおり：大笑い（台本で3回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_laugh.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, laughing heartily, eyes squeezed shut, mouth wide open.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 62. しおり：困り（台本で1回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_troubled.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a troubled, worried look, eyebrows drawn together.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 63. しおり：あせり（台本で1回）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_flustered.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a flustered, panicked look with a drop of sweat.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 64. こうじ：苦笑い（台本で15回）

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 65. こうじ：考える（台本で12回）

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 66. こうじ：さみしげ（台本で11回）

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 67. こうじ：通常（台本で9回）

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 68. こうじ：驚き（台本で5回）

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 69. ちよ：微笑み（台本で15回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 70. ちよ：通常（台本で12回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 71. ちよ：さみしげ（台本で9回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 72. ちよ：考える（台本で8回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 73. ちよ：驚き（台本で7回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 74. ちよ：苦笑い（台本で2回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 75. ちよ：悲しい（台本で2回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_sad.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a sad look, eyes cast down.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 76. ちよ：泣き笑い（台本で2回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 77. ちよ：真剣（台本で1回）

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_serious.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a serious, earnest look, mouth firmly closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 78. けんた：苦笑い（台本で14回）

- 添付：`public/assets/portraits/kenta_smile.webp`
- 保存名：`kenta_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 79. けんた：さみしげ（台本で8回）

- 添付：`public/assets/portraits/kenta_smile.webp`
- 保存名：`kenta_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 80. けんた：考える（台本で7回）

- 添付：`public/assets/portraits/kenta_smile.webp`
- 保存名：`kenta_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 81. けんた：照れ（台本で6回）

- 添付：`public/assets/portraits/kenta_smile.webp`
- 保存名：`kenta_shy.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a shy, embarrassed look, cheeks blushing.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 82. けんた：驚き（台本で4回）

- 添付：`public/assets/portraits/kenta_smile.webp`
- 保存名：`kenta_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 83. けんた：泣き笑い（台本で2回）

- 添付：`public/assets/portraits/kenta_smile.webp`
- 保存名：`kenta_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 84. けんた：大笑い（台本で1回）

- 添付：`public/assets/portraits/kenta_smile.webp`
- 保存名：`kenta_laugh.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, laughing heartily, eyes squeezed shut, mouth wide open.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 85. カイ：通常（台本で20回）

- 添付：`public/assets/portraits/kai_smug.webp`
- 保存名：`kai_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 86. カイ：見下す（台本で11回）

- 添付：`public/assets/portraits/kai_smug.webp`
- 保存名：`kai_scornful.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a cold, condescending look, chin slightly raised, looking down at the viewer.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 87. 写しのとうや：通常（台本で12回）

- 添付：`public/assets/portraits/past_toya_smile.webp`
- 保存名：`past_toya_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 88. 写しのちよ：通常（台本で11回）

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 89. 写しのちよ：泣き（台本で6回）

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_crying.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, crying, tears running down the cheeks.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 90. 写しのちよ：むっ（台本で4回）

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_pout.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a sulky, pouting look.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 91. 写しのちよ：真剣（台本で2回）

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_serious.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a serious, earnest look, mouth firmly closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 92. 写しのちよ：驚き（台本で1回）

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 93. 写しの菊：泣き笑い（台本で1回）

- 添付：`public/assets/portraits/past_kiku_normal.webp`
- 保存名：`past_kiku_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 94. 写しのしおり：通常（台本で14回）

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 95. 写しのしおり：むっ（台本で9回）

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_pout.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a sulky, pouting look.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 96. 写しのしおり：真剣（台本で3回）

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_serious.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a serious, earnest look, mouth firmly closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 97. 写しのけんた：泣き笑い（台本で1回）

- 添付：`public/assets/portraits/past_kenta_smile.webp`
- 保存名：`past_kenta_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 98. まさる：通常（台本で6回）

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 99. まさる：苦笑い（台本で5回）

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 100. まさる：驚き（台本で2回）

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 101. まさる：さみしげ（台本で2回）

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 102. のぼる：通常（台本で4回）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 103. のぼる：考える（台本で4回）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 104. のぼる：さみしげ（台本で4回）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 105. のぼる：困り笑い（台本で3回）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_awkward.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, an awkward, troubled little smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 106. のぼる：苦笑い（台本で2回）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 107. のぼる：照れ（台本で1回）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_shy.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a shy, embarrassed look, cheeks blushing.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 108. のぼる：驚き（台本で1回）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 109. とうや：通常（台本で7回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 110. とうや：驚き（台本で4回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 111. とうや：困り笑い（台本で3回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_awkward.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, an awkward, troubled little smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 112. とうや：考える（台本で2回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 113. とうや：苦笑い（台本で2回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 114. とうや：微笑み（台本で1回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 115. とうや：真剣（台本で1回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_serious.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a serious, earnest look, mouth firmly closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 116. とうや：大笑い（台本で1回）

- 添付：`public/assets/portraits/toya_smile.webp`
- 保存名：`toya_laugh.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, laughing heartily, eyes squeezed shut, mouth wide open.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 117. 写しのこうじ：驚き（台本で3回）

- 添付：`public/assets/portraits/past_koji_normal.webp`
- 保存名：`past_koji_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait, with the same childlike proportions: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 118. 写しのこうじ：泣き笑い（台本で1回）

- 添付：`public/assets/portraits/past_koji_normal.webp`
- 保存名：`past_koji_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait, with the same childlike proportions: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 119. ひなの：さみしげ（台本で5回）

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 120. ひなの：驚き（台本で3回）

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 121. ひなの：むっ（台本で3回）

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_pout.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a sulky, pouting look.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 122. ひなの：困り（台本で2回）

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_troubled.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a troubled, worried look, eyebrows drawn together.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 123. ひなの：微笑み（台本で1回）

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 124. すみ：さみしげ（台本で7回）

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 125. すみ：考える（台本で3回）

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 126. すみ：驚き（台本で2回）

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 127. すみ：通常（台本で1回）

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 128. しげる：通常（台本で3回）

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_normal.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a calm, natural expression.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 129. しげる：さみしげ（台本で3回）

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 130. しげる：驚き（台本で2回）

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 131. しげる：苦笑い（台本で2回）

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 132. しげる：考える（台本で2回）

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 133. さき：驚き（台本で3回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_surprised.png`
- メモ：Q の描き直し（saki_smile.png）が届いてから、その絵を添付して作る

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 134. さき：考える（台本で3回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_thinking.png`
- メモ：Q の描き直し（saki_smile.png）が届いてから、その絵を添付して作る

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 135. さき：さみしげ（台本で3回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_lonely.png`
- メモ：Q の描き直し（saki_smile.png）が届いてから、その絵を添付して作る

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 136. さき：苦笑い（台本で1回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_wry.png`
- メモ：Q の描き直し（saki_smile.png）が届いてから、その絵を添付して作る

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 137. さき：微笑み（台本で1回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_gentle.png`
- メモ：Q の描き直し（saki_smile.png）が届いてから、その絵を添付して作る

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 138. 写しのいさむ：泣き笑い（台本で1回）

- 添付：`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_isamu_teary.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, smiling through tears, eyes wet with tears.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

### AC. 脇役のまばたき・口パク（基本の1枚）

基本の1枚の絵をそのまま直して、目だけ閉じた絵と、口だけ開けた絵を作る（けんたと同じ作り方。`scripts/portrait_parts.py`）。台詞の多い人から順。目を閉じて笑っている絵（五郎・トメ）は、まばたきが要らない。口を開けて笑っている絵は、口パクが要らない。表情違いが届いたら、その表情の分は後で足す。毎回その人の基本の1枚を添付する。構図が少しでも動いたら作り直す

#### 139. いさむ：目を閉じた絵

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 140. いさむ：口を開けた絵

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 141. ペトラ：目を閉じた絵

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 142. ペトラ：口を開けた絵

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 143. こうじ：目を閉じた絵

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 144. こうじ：口を開けた絵

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 145. ちよ：目を閉じた絵

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 146. ちよ：口を開けた絵

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 147. カイ：口を開けた絵

- 添付：`public/assets/portraits/kai_smug.webp`
- 保存名：`kai_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smug expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 148. たいち：目を閉じた絵

- 添付：`public/assets/portraits/taichi_normal.webp`
- 保存名：`taichi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 149. たいち：口を開けた絵

- 添付：`public/assets/portraits/taichi_normal.webp`
- 保存名：`taichi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 150. 写しのとうや：目を閉じた絵

- 添付：`public/assets/portraits/past_toya_smile.webp`
- 保存名：`past_toya_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 151. 写しのとうや：口を開けた絵

- 添付：`public/assets/portraits/past_toya_smile.webp`
- 保存名：`past_toya_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 152. 写しのちよ：目を閉じた絵

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 153. 写しのちよ：口を開けた絵

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 154. 写しの菊：目を閉じた絵

- 添付：`public/assets/portraits/past_kiku_normal.webp`
- 保存名：`past_kiku_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 155. 写しの菊：口を開けた絵

- 添付：`public/assets/portraits/past_kiku_normal.webp`
- 保存名：`past_kiku_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 156. 写しのしおり：目を閉じた絵

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 157. 写しのしおり：口を開けた絵

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 158. 写しのけんた：目を閉じた絵

- 添付：`public/assets/portraits/past_kenta_smile.webp`
- 保存名：`past_kenta_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 159. 写しのけんた：口を開けた絵

- 添付：`public/assets/portraits/past_kenta_smile.webp`
- 保存名：`past_kenta_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 160. まさる：目を閉じた絵

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 161. まさる：口を開けた絵

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 162. のぼる：目を閉じた絵

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 163. のぼる：口を開けた絵

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 164. 写しのたいち：目を閉じた絵

- 添付：`public/assets/portraits/past_taichi_normal.webp`
- 保存名：`past_taichi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 165. 写しのたいち：口を開けた絵

- 添付：`public/assets/portraits/past_taichi_normal.webp`
- 保存名：`past_taichi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 166. 写しのまさる：目を閉じた絵

- 添付：`public/assets/portraits/past_masaru_smile.webp`
- 保存名：`past_masaru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 167. 写しのまさる：口を開けた絵

- 添付：`public/assets/portraits/past_masaru_smile.webp`
- 保存名：`past_masaru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 168. 写しのこうじ：目を閉じた絵

- 添付：`public/assets/portraits/past_koji_normal.webp`
- 保存名：`past_koji_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 169. 写しのこうじ：口を開けた絵

- 添付：`public/assets/portraits/past_koji_normal.webp`
- 保存名：`past_koji_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 170. ひなの：目を閉じた絵

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 171. ひなの：口を開けた絵

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 172. ノア：目を閉じた絵

- 添付：`public/assets/portraits/noa_normal.webp`
- 保存名：`noa_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 173. ノア：口を開けた絵

- 添付：`public/assets/portraits/noa_normal.webp`
- 保存名：`noa_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 174. 写しのひなの：口を開けた絵

- 添付：`public/assets/portraits/past_hinano_smile.webp`
- 保存名：`past_hinano_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 175. すみ：目を閉じた絵

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 176. すみ：口を開けた絵

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 177. しげる：目を閉じた絵

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 178. しげる：口を開けた絵

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 179. 写しの源三：目を閉じた絵

- 添付：`public/assets/portraits/past_genzo_normal.webp`
- 保存名：`past_genzo_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 180. 写しの源三：口を開けた絵

- 添付：`public/assets/portraits/past_genzo_normal.webp`
- 保存名：`past_genzo_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 181. さき：目を閉じた絵

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_blink_src.png`
- メモ：Q の描き直しが届いてから、その絵を添付して作る

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 182. さき：口を開けた絵

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_talk_src.png`
- メモ：Q の描き直しが届いてから、その絵を添付して作る

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 183. 写しのいさむ：目を閉じた絵

- 添付：`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_isamu_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same serious expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 184. 写しのいさむ：口を開けた絵

- 添付：`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_isamu_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same serious expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 185. 写しののぼる：目を閉じた絵

- 添付：`public/assets/portraits/past_noboru_smile.webp`
- 保存名：`past_noboru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 186. 写しののぼる：口を開けた絵

- 添付：`public/assets/portraits/past_noboru_smile.webp`
- 保存名：`past_noboru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 187. 善次：目を閉じた絵

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 188. 善次：口を開けた絵

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 189. 写しのすみ：目を閉じた絵

- 添付：`public/assets/portraits/past_sumi_smile.webp`
- 保存名：`past_sumi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 190. 写しのすみ：口を開けた絵

- 添付：`public/assets/portraits/past_sumi_smile.webp`
- 保存名：`past_sumi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 191. 写しのおじいちゃん：目を閉じた絵

- 添付：`public/assets/portraits/past_grandpa_normal.webp`
- 保存名：`past_grandpa_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 192. 写しのおじいちゃん：口を開けた絵

- 添付：`public/assets/portraits/past_grandpa_normal.webp`
- 保存名：`past_grandpa_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 193. だいち：目を閉じた絵

- 添付：`public/assets/portraits/daichi_smile.webp`
- 保存名：`daichi_blink_src.png`
- メモ：Q の描き直しが届いてから、その絵を添付して作る

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 194. だいち：口を開けた絵

- 添付：`public/assets/portraits/daichi_smile.webp`
- 保存名：`daichi_talk_src.png`
- メモ：Q の描き直しが届いてから、その絵を添付して作る

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
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
