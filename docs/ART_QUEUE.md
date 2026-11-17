# 絵の「そのまま貼る一覧」

**まだの絵：152 枚**（済んだ絵 245 枚は、いちばん下に名前だけ）。上から順に作る。**1つの枠が1枚**。

- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）
- できた絵は「保存名」の名前で保存して、まとめて Claude に送る。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする
- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい
- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる（届いた絵は DONE に足すと、下の「済んだ絵」に移る）
- まだ一覧にない物：探索の地図を歩く2頭身のハルト・カイ（`docs/ART.md` の 5-5b の 3〜4。試し）。

## まだの絵

- [AA. 早瀬（仲間）のまばたき・口パク](#aa-早瀬仲間のまばたき口パク)：2 枚
- [AB. 脇役の表情違い（台本で使う表情だけ）](#ab-脇役の表情違い台本で使う表情だけ)：94 枚
- [AC. 脇役のまばたき・口パク（基本の1枚）](#ac-脇役のまばたき口パク基本の1枚)：56 枚

### AA. 早瀬（仲間）のまばたき・口パク

5人目の仲間で台本の台詞が多い（122行）のに、まばたき・口パクがない。表情ごとに別に作った絵なので、みおと同じく、表情の絵をそのまま直して目だけ閉じた絵を作る（`scripts/portrait_parts.py`）。口パクは、口を閉じている表情だけ。毎回その表情の絵を添付する。構図が少しでも動いたら作り直す

#### 1. 早瀬：考える（口を開けた絵）

- 添付：`public/assets/portraits/hayase_thinking.webp`
- 保存名：`hayase_talk_src_thinking.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same thinking expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 2. 早瀬：苦笑い（口を開けた絵）

- 添付：`public/assets/portraits/hayase_wry.webp`
- 保存名：`hayase_talk_src_wry.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same wry smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

### AB. 脇役の表情違い（台本で使う表情だけ）

基本の1枚しかない人の、台本で使う表情。台詞の多い人から順に、1人の中は使う回数の多い表情から。今はどれも基本の1枚で代わりに出している。毎回その人の基本の1枚を添付する。届いたら `CAST` の表情に足す

#### 3. 勇夫：笑顔（台本で12回）

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

#### 4. 勇夫：さみしげ（台本で12回）

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

#### 5. 勇夫：考える（台本で11回）

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

#### 6. 勇夫：驚き（台本で3回）

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

#### 7. 勇夫：泣き笑い（台本で3回）

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

#### 8. ペトラ：真剣（台本で13回）

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

#### 9. ペトラ：困り（台本で10回）

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

#### 10. ペトラ：驚き（台本で7回）

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

#### 11. ペトラ：笑顔（台本で5回）

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

#### 12. しおり：通常（台本で14回）

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

#### 13. しおり：困り笑い（台本で12回）

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

#### 14. しおり：驚き（台本で9回）

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

#### 15. しおり：考える（台本で8回）

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

#### 16. しおり：苦笑い（台本で7回）

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

#### 17. しおり：微笑み（台本で4回）

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

#### 18. しおり：さみしげ（台本で3回）

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

#### 19. しおり：大笑い（台本で3回）

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

#### 20. しおり：困り（台本で1回）

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

#### 21. しおり：あせり（台本で1回）

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

#### 22. 浩二：苦笑い（台本で15回）

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

#### 23. 浩二：考える（台本で12回）

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

#### 24. 浩二：さみしげ（台本で11回）

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

#### 25. 浩二：通常（台本で9回）

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

#### 26. 浩二：驚き（台本で5回）

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

#### 27. 千代：微笑み（台本で15回）

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

#### 28. 千代：通常（台本で12回）

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

#### 29. 千代：さみしげ（台本で9回）

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

#### 30. 千代：考える（台本で8回）

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

#### 31. 千代：驚き（台本で7回）

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

#### 32. 千代：苦笑い（台本で2回）

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

#### 33. 千代：悲しい（台本で2回）

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

#### 34. 千代：泣き笑い（台本で2回）

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

#### 35. 千代：真剣（台本で1回）

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

#### 36. けんた：苦笑い（台本で14回）

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

#### 37. けんた：さみしげ（台本で8回）

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

#### 38. けんた：考える（台本で7回）

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

#### 39. けんた：照れ（台本で6回）

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

#### 40. けんた：驚き（台本で4回）

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

#### 41. けんた：泣き笑い（台本で2回）

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

#### 42. けんた：大笑い（台本で1回）

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

#### 43. カイ：通常（台本で20回）

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

#### 44. カイ：見下す（台本で11回）

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

#### 45. 写しのとうや：通常（台本で12回）

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

#### 46. 写しの千代：通常（台本で11回）

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

#### 47. 写しの千代：泣き（台本で6回）

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

#### 48. 写しの千代：むっ（台本で4回）

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

#### 49. 写しの千代：真剣（台本で2回）

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

#### 50. 写しの千代：驚き（台本で1回）

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

#### 51. 写しの菊：泣き笑い（台本で1回）

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

#### 52. 写しのしおり：通常（台本で14回）

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

#### 53. 写しのしおり：むっ（台本で9回）

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

#### 54. 写しのしおり：真剣（台本で3回）

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

#### 55. 写しのけんた：泣き笑い（台本で1回）

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

#### 56. 正雄：通常（台本で6回）

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

#### 57. 正雄：苦笑い（台本で5回）

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

#### 58. 正雄：驚き（台本で2回）

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

#### 59. 正雄：さみしげ（台本で2回）

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

#### 60. 昇平：通常（台本で4回）

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

#### 61. 昇平：考える（台本で4回）

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

#### 62. 昇平：さみしげ（台本で4回）

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

#### 63. 昇平：困り笑い（台本で3回）

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

#### 64. 昇平：苦笑い（台本で2回）

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

#### 65. 昇平：照れ（台本で1回）

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

#### 66. 昇平：驚き（台本で1回）

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

#### 67. とうや：通常（台本で7回）

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

#### 68. とうや：驚き（台本で4回）

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

#### 69. とうや：困り笑い（台本で3回）

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

#### 70. とうや：考える（台本で2回）

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

#### 71. とうや：苦笑い（台本で2回）

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

#### 72. とうや：微笑み（台本で1回）

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

#### 73. とうや：真剣（台本で1回）

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

#### 74. とうや：大笑い（台本で1回）

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

#### 75. 写しの浩二：驚き（台本で3回）

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

#### 76. 写しの浩二：泣き笑い（台本で1回）

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

#### 77. ひなの：さみしげ（台本で5回）

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

#### 78. ひなの：驚き（台本で3回）

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

#### 79. ひなの：むっ（台本で3回）

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

#### 80. ひなの：困り（台本で2回）

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

#### 81. ひなの：微笑み（台本で1回）

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

#### 82. 寿美：さみしげ（台本で7回）

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

#### 83. 寿美：考える（台本で3回）

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

#### 84. 寿美：驚き（台本で2回）

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

#### 85. 寿美：通常（台本で1回）

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

#### 86. 茂雄：通常（台本で3回）

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

#### 87. 茂雄：さみしげ（台本で3回）

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

#### 88. 茂雄：驚き（台本で2回）

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

#### 89. 茂雄：苦笑い（台本で2回）

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

#### 90. 茂雄：考える（台本で2回）

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

#### 91. さき：驚き（台本で3回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_surprised.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a surprised look, eyes wide open, lips slightly parted.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 92. さき：考える（台本で3回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_thinking.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a thoughtful look, eyes glancing slightly aside, mouth closed.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 93. さき：さみしげ（台本で3回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_lonely.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a lonely, wistful look with a faint, sad smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 94. さき：苦笑い（台本で1回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_wry.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wry, rueful smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 95. さき：微笑み（台本で1回）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_gentle.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a gentle, soft smile.
This is exactly the same character as the attached portrait: the same face, hairstyle and outfit.
Change only the facial expression (a small natural tilt of the head or shoulders is fine). Keep exactly the same character design, hairstyle, outfit, colors, art style, framing, size and camera distance as the attached portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

#### 96. 写しの勇夫：泣き笑い（台本で1回）

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

基本の1枚の絵をそのまま直して、目だけ閉じた絵と、口だけ開けた絵を作る（けんたと同じ作り方。`scripts/portrait_parts.py`）。台詞の多い人から順。目を閉じて笑っている絵（五郎・初江）は、まばたきが要らない。口を開けて笑っている絵は、口パクが要らない。表情違いが届いたら、その表情の分は後で足す。毎回その人の基本の1枚を添付する。構図が少しでも動いたら作り直す

#### 97. 勇夫：目を閉じた絵

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 98. 勇夫：口を開けた絵

- 添付：`public/assets/portraits/isamu_normal.webp`
- 保存名：`isamu_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 99. ペトラ：目を閉じた絵

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 100. ペトラ：口を開けた絵

- 添付：`public/assets/portraits/petra_normal.webp`
- 保存名：`petra_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 101. 浩二：目を閉じた絵

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 102. 浩二：口を開けた絵

- 添付：`public/assets/portraits/koji_smile.webp`
- 保存名：`koji_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 103. 千代：目を閉じた絵

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 104. 千代：口を開けた絵

- 添付：`public/assets/portraits/chiyo_smile.webp`
- 保存名：`chiyo_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 105. カイ：口を開けた絵

- 添付：`public/assets/portraits/kai_smug.webp`
- 保存名：`kai_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smug expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 106. たいち：目を閉じた絵

- 添付：`public/assets/portraits/taichi_normal.webp`
- 保存名：`taichi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 107. たいち：口を開けた絵

- 添付：`public/assets/portraits/taichi_normal.webp`
- 保存名：`taichi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 108. 写しのとうや：目を閉じた絵

- 添付：`public/assets/portraits/past_toya_smile.webp`
- 保存名：`past_toya_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 109. 写しのとうや：口を開けた絵

- 添付：`public/assets/portraits/past_toya_smile.webp`
- 保存名：`past_toya_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 110. 写しの千代：目を閉じた絵

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 111. 写しの千代：口を開けた絵

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 112. 写しの菊：目を閉じた絵

- 添付：`public/assets/portraits/past_kiku_normal.webp`
- 保存名：`past_kiku_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 113. 写しの菊：口を開けた絵

- 添付：`public/assets/portraits/past_kiku_normal.webp`
- 保存名：`past_kiku_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 114. 写しのしおり：目を閉じた絵

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 115. 写しのしおり：口を開けた絵

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 116. 写しのけんた：目を閉じた絵

- 添付：`public/assets/portraits/past_kenta_smile.webp`
- 保存名：`past_kenta_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 117. 写しのけんた：口を開けた絵

- 添付：`public/assets/portraits/past_kenta_smile.webp`
- 保存名：`past_kenta_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 118. 正雄：目を閉じた絵

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 119. 正雄：口を開けた絵

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 120. 昇平：目を閉じた絵

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 121. 昇平：口を開けた絵

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 122. 写しのたいち：目を閉じた絵

- 添付：`public/assets/portraits/past_taichi_normal.webp`
- 保存名：`past_taichi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 123. 写しのたいち：口を開けた絵

- 添付：`public/assets/portraits/past_taichi_normal.webp`
- 保存名：`past_taichi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 124. 写しの正雄：目を閉じた絵

- 添付：`public/assets/portraits/past_masaru_smile.webp`
- 保存名：`past_masaru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 125. 写しの正雄：口を開けた絵

- 添付：`public/assets/portraits/past_masaru_smile.webp`
- 保存名：`past_masaru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 126. 写しの浩二：目を閉じた絵

- 添付：`public/assets/portraits/past_koji_normal.webp`
- 保存名：`past_koji_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 127. 写しの浩二：口を開けた絵

- 添付：`public/assets/portraits/past_koji_normal.webp`
- 保存名：`past_koji_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 128. ひなの：目を閉じた絵

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 129. ひなの：口を開けた絵

- 添付：`public/assets/portraits/hinano_normal.webp`
- 保存名：`hinano_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 130. ノア：目を閉じた絵

- 添付：`public/assets/portraits/noa_normal.webp`
- 保存名：`noa_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 131. ノア：口を開けた絵

- 添付：`public/assets/portraits/noa_normal.webp`
- 保存名：`noa_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 132. 写しのひなの：口を開けた絵

- 添付：`public/assets/portraits/past_hinano_smile.webp`
- 保存名：`past_hinano_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 133. 寿美：目を閉じた絵

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 134. 寿美：口を開けた絵

- 添付：`public/assets/portraits/sumi_smile.webp`
- 保存名：`sumi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 135. 茂雄：目を閉じた絵

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 136. 茂雄：口を開けた絵

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 137. 写しの源三：目を閉じた絵

- 添付：`public/assets/portraits/past_genzo_normal.webp`
- 保存名：`past_genzo_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 138. 写しの源三：口を開けた絵

- 添付：`public/assets/portraits/past_genzo_normal.webp`
- 保存名：`past_genzo_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 139. さき：目を閉じた絵

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 140. さき：口を開けた絵

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 141. 写しの勇夫：目を閉じた絵

- 添付：`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_isamu_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same serious expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 142. 写しの勇夫：口を開けた絵

- 添付：`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_isamu_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same serious expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 143. 写しの昇平：目を閉じた絵

- 添付：`public/assets/portraits/past_noboru_smile.webp`
- 保存名：`past_noboru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 144. 写しの昇平：口を開けた絵

- 添付：`public/assets/portraits/past_noboru_smile.webp`
- 保存名：`past_noboru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 145. 善次：目を閉じた絵

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 146. 善次：口を開けた絵

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 147. 写しの寿美：目を閉じた絵

- 添付：`public/assets/portraits/past_sumi_smile.webp`
- 保存名：`past_sumi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 148. 写しの寿美：口を開けた絵

- 添付：`public/assets/portraits/past_sumi_smile.webp`
- 保存名：`past_sumi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 149. 写しのおじいちゃん：目を閉じた絵

- 添付：`public/assets/portraits/past_grandpa_normal.webp`
- 保存名：`past_grandpa_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 150. 写しのおじいちゃん：口を開けた絵

- 添付：`public/assets/portraits/past_grandpa_normal.webp`
- 保存名：`past_grandpa_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 151. だいち：目を閉じた絵

- 添付：`public/assets/portraits/daichi_smile.webp`
- 保存名：`daichi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 152. だいち：口を開けた絵

- 添付：`public/assets/portraits/daichi_smile.webp`
- 保存名：`daichi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

## 済んだ絵

届いてゲームに入れた絵（指示文は `scripts/art_queue.py` と台帳 `src/data/assets.ts`）。

- **A. 小夜子（ヒロイン）**（2 枚）：小夜子の設定画、小夜子の胸から上の基本の1枚（微笑み）
- **B. 3章の人**（9 枚）：千代（今75歳。ひだまり荘）、昇平（今68歳。千代の弟）、写しの千代（昭和41年、15歳）、写しの菊（千代と昇平の母。昭和41年、40歳くらい）、写しの昇平（昭和41年、8歳）、しおり（今22歳。印刷会社の一年目）、とうや（今22歳。鉄道の保線の仕事）、写しのしおり（平成31年3月、15歳）、写しのとうや（平成31年3月、15歳）
- **C. 2章の残りの人**（7 枚）：写しの浩二（平成10年、12歳）、写しの正雄（平成10年、40代。浩二の父）、正雄（今70歳くらい。浩二の父）、寿美（今77歳。銭湯「松の湯」の女将）、写しの寿美（昭和44年、22歳。番台の娘）、だいち（今37歳。けんたのバンドのドラム）、さき（今37歳。けんたのバンドのベース）
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
- **Q. だいち・さきの描き直し（けんたと見分けやすく）**（2 枚）：だいち（描き直し）、さき（描き直し）
- **R. 洋服の小夜子（試着室）**（3 枚）：洋服の小夜子：照れ（基本の1枚）、洋服の小夜子：驚き、洋服の小夜子：微笑み
- **S. とうや・しおりのまばたき・口パク用**（4 枚）：とうや：目を閉じた絵、とうや：口を開けた絵、しおり：目を閉じた絵、しおり：口を開けた絵
- **T. 砂の底を掘る、二頭身のハルト**（1 枚）：掘る二頭身のハルト（4行×3列）
- **U. 砂の底を掘る、二頭身の仲間（あかり・みお・小夜子・早瀬）**（4 枚）：掘る二頭身のあかり、掘る二頭身のみお、掘る二頭身の小夜子、掘る二頭身の早瀬
- **V. 砂の底のレアスナップ（段階219）**（3 枚）：スナップ「残像」（感覚記憶の層）、スナップ「うたかた」（短期記憶の層）、スナップ「回想」（エピソード記憶の層）
- **Y. 寄り道の町の人の表情違い（五郎・善次・初江）**（10 枚）：五郎：困り、五郎：驚き、五郎：照れ、五郎：泣き笑い、善次：微笑み、善次：照れ、善次：驚き、初江：微笑み、初江：困り、初江：驚き
- **Z. 立ち絵のない3人（写しの仁・写しの静江・写しの敏夫）**（13 枚）：写しの仁（平成9年の春、29歳。早瀬の若いころ）：通常、写しの静江（平成9年の春、27歳。早瀬の妻）：笑顔、写しの敏夫（昭和44年の冬、30代。工場の先輩の職人）：通常、写しの仁：驚き、写しの仁：真剣、写しの仁：困り、写しの静江：驚き、写しの静江：大笑い、写しの静江：考える、写しの静江：微笑み、写しの静江：泣き笑い、写しの静江：照れ、写しの静江：困り笑い
- **AA. 早瀬（仲間）のまばたき・口パク**（7 枚）：早瀬：通常（目を閉じた絵）、早瀬：考える（目を閉じた絵）、早瀬：苦笑い（目を閉じた絵）、早瀬：驚き（目を閉じた絵）、早瀬：怒り（目を閉じた絵）、早瀬：泣き笑い（目を閉じた絵）、早瀬：通常（口を開けた絵）
- **W. 拠点のメニューの絵（段階226・227）**（6 枚）：砂の底（横長の帯）、星図・武器・ライブラリ・交換所・落とし物（縦長）。ムーブメント・アルバム・編成・町の小話の縦長は、今の横長の絵を使い回すと決めたので作らない（2026-11-17 開発者と）
- **X. 寄り道の町の人と寄り道のタイル**（4 枚。2026-11-17）：五郎（八百屋の主人）、善次（時計屋の常連）、初江（駄菓子屋のおばあさん）、拠点のタイル「寄り道」（縦長）
