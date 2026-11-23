# 絵の「そのまま貼る一覧」

**まだの絵：44 枚**（済んだ絵 387 枚は、いちばん下に名前だけ）。上から順に作る。**1つの枠が1枚**。

- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）
- できた絵は「保存名」の名前で保存して、まとめて Claude に送る（Claude は、立ち絵の背景を抜いた後に `scripts/shrink_portraits.py` で縮め、差分は `scripts/portrait_parts.py` で作る）。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする
- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい
- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる（届いた絵は DONE に足すと、下の「済んだ絵」に移る）
- まだ一覧にない物：探索の地図を見回る2頭身のカイ（`docs/ART.md` の 5-8 の 4.。歩く二頭身のハルトがうまくいってから）。

## まだの絵

- [AE. 新しい1-1 の仕掛け・宝箱の小物と部屋の絵（段階270）](#ae-新しい1-1-の仕掛け宝箱の小物と部屋の絵段階270)：9 枚
- [AC. 脇役のまばたき・口パク（基本の1枚）](#ac-脇役のまばたき口パク基本の1枚)：13 枚
- [AD. 口を開けた顔の、口を閉じた絵（口パク用）](#ad-口を開けた顔の口を閉じた絵口パク用)：22 枚

### AE. 新しい1-1 の仕掛け・宝箱の小物と部屋の絵（段階270）

新しい1-1（デバッグメニューの「試しの切り替え」の「新しい1-1」）は、部屋の絵がなく、仕掛けと宝箱も仮の印（ひし形・四角）で、良さが伝わりにくかった（2026-11-23 開発者）。`docs/milestones/M3_explore_feel.md` の 7.。**先に小物の3枚**（届けばマス目の部屋のままでも絵に替わる）、**次に部屋の6枚**。小物は白い背景のまま送ってくれればよい（Claude が1つずつ切り出す）。部屋の絵は、毎回その部屋の下絵（`docs/sketches/a11_art/room_<部屋>.png`）と、絵柄の見本の今の入口の地図（`public/assets/maps/fest_gate.webp`）を添付する

#### 1. 小物1：宝箱と屋台の裏の物

- 添付：`public/assets/maps/fest_gate.webp`
- 保存名：`a11_props1.png`
- メモ：1枚目。うまくいけば、同じ形で2枚目・3枚目

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A sheet of small map objects (props) for a top-down 2D RPG exploration map on mobile, seen from the same nearly overhead view with a slight tilt as the attached map illustration, and matching its art style, colors and lighting exactly (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light).
Layout: a grid of 3 rows by 4 columns on a plain pure white background, every cell exactly the same size (square), one object centered in each cell, with clear white space around each object so they can be cut out one by one. Objects must not touch each other or the cell edges.
- Row 1, column 1: a festival treasure box, CLOSED: a small sturdy wooden chest with a dark lacquered red lid, gold metal corners and a gold clasp, tied with a thick red-and-white festival cord. It must look precious and inviting.
- Row 1, column 2: the SAME treasure box, OPENED and empty: the lid tilted back, a soft warm golden glow fading inside.
- Row 1, column 3: a wooden fruit crate with a BLUE cloth thrown over half of it.
- Row 1, column 4: the same kind of wooden crate with a bright RED cloth thrown over half of it.
- Row 2, column 1: the same kind of wooden crate with a bright YELLOW cloth thrown over half of it.
- Row 2, column 2: a small portable gasoline generator, STOPPED: dull grey-green metal, a black cable coiled beside it, one knob clearly missing (an empty socket), no light.
- Row 2, column 3: the SAME generator, RUNNING: a small warm lamp on top glowing, faint exhaust puffs, the cable lit with tiny warm bulbs.
- Row 2, column 4: a small two-wheeled wooden hand cart loaded with a few sake barrels and rope, seen from above.
- Row 3, column 1: a short wall of old wooden boards nailed together, standing upright, wide and low (as wide as about three of the other objects together, so let it fill the cell width).
- Row 3, column 2: the SAME board wall, smashed open in the middle, broken planks and splinters scattered.
- Row 3, column 3: a single white fox festival mask (kitsune mask) with red markings, lying flat, seen from the front.
- Row 3, column 4: an old faded photograph lying on the ground, softly glowing with a sepia light and a few floating sparkles, the picture on it too blurry to see.
Each object must read clearly as a small icon on a phone screen (about one or two fingertips wide): bold simple shapes, a clear dark outline, strong color differences between similar objects. A small soft shadow directly under each object is fine. No ground, no grid lines, no people unless stated, no letters or numbers anywhere.
```

#### 2. 小物2：提灯とお面屋

- 添付：`public/assets/maps/fest_gate.webp`、`a11_props1.png（上で作った絵）`
- 保存名：`a11_props2.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A sheet of small map objects (props) for a top-down 2D RPG exploration map on mobile, seen from the same nearly overhead view with a slight tilt as the attached map illustration, and matching its art style, colors and lighting exactly (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light).
Layout: a grid of 3 rows by 4 columns on a plain pure white background, every cell exactly the same size (square), one object centered in each cell, with clear white space around each object so they can be cut out one by one. Objects must not touch each other or the cell edges.
- Row 1, column 1: a round RED paper festival lantern on a short wooden post, UNLIT: dull dark red paper, no glow.
- Row 1, column 2: the SAME red lantern, LIT: glowing bright warm red with a soft halo of light around it.
- Row 1, column 3: a round WHITE paper festival lantern on a short wooden post, UNLIT: dull grey-white paper, no glow.
- Row 1, column 4: the SAME white lantern, LIT: glowing bright warm white with a soft halo.
- Row 2, column 1: a round BLUE paper festival lantern on a short wooden post, UNLIT: dull dark blue paper, no glow.
- Row 2, column 2: the SAME blue lantern, LIT: glowing bright cool blue with a soft halo.
- Row 2, column 3: the front counter of a small festival mask stall with a display board of WHITE fox masks (one empty hook in the middle where a mask is missing), a small white awning.
- Row 2, column 4: the same kind of mask stall counter with a display board of BLACK fox masks, a black awning.
- Row 3, column 1: the same kind of mask stall counter with a display board of shiny GOLD fox masks, a gold-yellow awning.
- Row 3, column 2: an old drink vending machine, switched OFF: dark screen, dark buttons, slightly rusty, blank front panel with only simple color stripes (no letters, no logos).
- Row 3, column 3: a small old wooden garden gate door, broken: one hinge off, hanging crooked.
- Row 3, column 4: a dense thicket of green bamboo stalks blocking a path, a few stalks leaning.
Each object must read clearly as a small icon on a phone screen (about one or two fingertips wide): bold simple shapes, a clear dark outline, strong color differences between similar objects. A small soft shadow directly under each object is fine. No ground, no grid lines, no people unless stated, no letters or numbers anywhere. Match the attached prop sheet exactly in size, view and style.
```

#### 3. 小物3：人混み

- 添付：`public/assets/maps/fest_gate.webp`、`a11_props1.png（上で作った絵）`
- 保存名：`a11_props3.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A sheet of small map objects (props) for a top-down 2D RPG exploration map on mobile, seen from the same nearly overhead view with a slight tilt as the attached map illustration, and matching its art style, colors and lighting exactly (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light).
Layout: a grid of 2 rows by 2 columns on a plain pure white background, every cell exactly the same size (square), one object centered in each cell, with clear white space around each object so they can be cut out one by one. Objects must not touch each other or the cell edges.
- Row 1, column 1: a tight cluster of three festival-goers seen from above at a slight tilt, standing shoulder to shoulder with their backs to the viewer, in yukata and summer clothes, drawn as soft semi-transparent sepia figures like faded memories (faces not visible).
- Row 1, column 2: another tight cluster of three different festival-goers, the same style, one holding a cotton candy, one a paper fan.
- Row 2, column 1: another tight cluster of two festival-goers and a child, the same style.
- Row 2, column 2: another tight cluster of three festival-goers, the same style, one wearing a fox mask pushed up on the head.
Each object must read clearly as a small icon on a phone screen (about one or two fingertips wide): bold simple shapes, a clear dark outline, strong color differences between similar objects. A small soft shadow directly under each object is fine. No ground, no grid lines, no people unless stated, no letters or numbers anywhere. The four clusters will be placed side by side to form one crowd blocking a path, so keep them the same size and density.
```

#### 4. 部屋1：縁日の入口

- 添付：`docs/sketches/a11_art/room_fest2_gate.png`、`public/assets/maps/fest_gate.webp`
- 保存名：`map_fest2_gate.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. Match the art style, colors and lighting of the attached map illustration (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light strung overhead).
Scene: the entrance of a shrine festival. At the bottom, a wide stone-paved forecourt where you arrive (closed at the bottom by a low stone wall and shrubs). A straight stone-paved approach runs up the middle to the opening at the top edge. Across the approach, just above the forecourt (about 9 squares from the bottom), a big red torii gate: its two pillars stand on the dark squares on both sides of the approach and its crossbeam spans over the path. Festival stalls with striped awnings line both sides of the approach; the hatched strips are the shade under their awnings. A side path branches off to the left edge, toward the back of the stalls. At the upper right, a small dead-end nook behind the stalls.
Follow the attached layout sketch exactly (a 24 by 24 grid, one square = one step): light sand areas are walkable ground, dark brown areas are buildings, stalls, trees and other things you cannot walk through, blue marks the openings at the edges (the blue is only a guide: do not paint blue squares, just let the path continue out through the edge there). Sand areas with diagonal hatching are walkable ground under stall awnings or tree canopies (in partial shadow, where you could hide). Walkable areas must be clearly distinguishable from non-walkable objects at a glance: keep walkable ground open and plain (stone paving, packed earth, gravel), and give every non-walkable object a solid, readable shape. Do not draw the hatching or grid lines themselves.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, crates, lanterns on posts, a generator, a hand cart, masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 5. 部屋2：屋台の裏

- 添付：`docs/sketches/a11_art/room_fest2_backyard.png`、`public/assets/maps/fest_gate.webp`
- 保存名：`map_fest2_backyard.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. Match the art style, colors and lighting of the attached map illustration (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light strung overhead).
Scene: the cramped backyard behind the festival stalls. At the top left, a small storage area with the backs of three tents along the top wall: a BLUE tent, a RED tent and a YELLOW tent, side by side from left to right. In the middle, an open square of packed earth surrounded by stacked boxes and tarps (where a generator will sit in the middle). At the bottom, a narrow loop of passage around a long block of piled stall equipment covered with tarps, where the lights are out. Thick power cables run along the ground from the middle square to the bottom loop. The hatched area at the left is under a hanging blue tarp. An opening at the right edge leads back to the entrance, an opening at the top leads to the back alley.
Follow the attached layout sketch exactly (a 24 by 24 grid, one square = one step): light sand areas are walkable ground, dark brown areas are buildings, stalls, trees and other things you cannot walk through, blue marks the openings at the edges (the blue is only a guide: do not paint blue squares, just let the path continue out through the edge there). Sand areas with diagonal hatching are walkable ground under stall awnings or tree canopies (in partial shadow, where you could hide). Walkable areas must be clearly distinguishable from non-walkable objects at a glance: keep walkable ground open and plain (stone paving, packed earth, gravel), and give every non-walkable object a solid, readable shape. Do not draw the hatching or grid lines themselves.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, crates, lanterns on posts, a generator, a hand cart, masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 6. 部屋3：屋台の裏通り

- 添付：`docs/sketches/a11_art/room_fest2_lane.png`、`public/assets/maps/fest_gate.webp`
- 保存名：`map_fest2_lane.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. Match the art style, colors and lighting of the attached map illustration (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light strung overhead).
Scene: narrow winding back alleys behind festival stalls, tarps, folding tables, coolers and stacked paper lanterns on the dark squares. The long walkway down the left side is a gentle downhill slope paved with old stones, going down toward the bottom (show the slope with a few low steps or a ramp). A covered rest area with a tarp roof in the middle (the hatched area). The way out at the bottom edge leads back toward the stalls, the opening at the right edge leads to the festival plaza.
Follow the attached layout sketch exactly (a 24 by 24 grid, one square = one step): light sand areas are walkable ground, dark brown areas are buildings, stalls, trees and other things you cannot walk through, blue marks the openings at the edges (the blue is only a guide: do not paint blue squares, just let the path continue out through the edge there). Sand areas with diagonal hatching are walkable ground under stall awnings or tree canopies (in partial shadow, where you could hide). Walkable areas must be clearly distinguishable from non-walkable objects at a glance: keep walkable ground open and plain (stone paving, packed earth, gravel), and give every non-walkable object a solid, readable shape. Do not draw the hatching or grid lines themselves.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, crates, lanterns on posts, a generator, a hand cart, masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 7. 部屋4：縁日の広場

- 添付：`docs/sketches/a11_art/room_fest2_plaza.png`、`public/assets/maps/fest_gate.webp`
- 保存名：`map_fest2_plaza.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. Match the art style, colors and lighting of the attached map illustration (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light strung overhead).
Scene: the central plaza of the shrine festival, the most festive place. In the middle of the lower half, a tall wooden yagura (festival drum tower) wrapped in red-and-white cloth stands on the dark block, with strings of paper lanterns stretching from its top to the stalls around the plaza. Stone steps lead up through the opening at the top edge toward the shrine woods. Stalls with awnings around the edges (the hatched areas are under their awnings). Openings at the left edge, the right edge and the bottom edge. Two small round stone circles in the paving mark resting spots (about 6 squares from the top and 5 squares from the bottom, in the center column).
Follow the attached layout sketch exactly (a 24 by 24 grid, one square = one step): light sand areas are walkable ground, dark brown areas are buildings, stalls, trees and other things you cannot walk through, blue marks the openings at the edges (the blue is only a guide: do not paint blue squares, just let the path continue out through the edge there). Sand areas with diagonal hatching are walkable ground under stall awnings or tree canopies (in partial shadow, where you could hide). Walkable areas must be clearly distinguishable from non-walkable objects at a glance: keep walkable ground open and plain (stone paving, packed earth, gravel), and give every non-walkable object a solid, readable shape. Do not draw the hatching or grid lines themselves.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, crates, lanterns on posts, a generator, a hand cart, masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 8. 部屋5：東の屋台

- 添付：`docs/sketches/a11_art/room_fest2_east.png`、`public/assets/maps/fest_gate.webp`
- 保存名：`map_fest2_east.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. Match the art style, colors and lighting of the attached map illustration (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light strung overhead).
Scene: a busy side street of the shrine festival. Along the top wall, the roofs and back walls of a row of four small stalls facing down onto the street (the game places their front counters in front of them). In the middle, a shooting gallery stall (the dark block above the center) and a goldfish-scooping stall with a wide blue water tank (the dark block below the center). Between the two stalls, hidden behind them, a small enclosed backyard (the light square in the very middle) that you enter through a narrow gap on its left side. The long street loops around the stalls; the bottom right corner is a quiet dead end. The hatched areas are under stall awnings. The opening at the left edge leads back to the plaza.
Follow the attached layout sketch exactly (a 24 by 24 grid, one square = one step): light sand areas are walkable ground, dark brown areas are buildings, stalls, trees and other things you cannot walk through, blue marks the openings at the edges (the blue is only a guide: do not paint blue squares, just let the path continue out through the edge there). Sand areas with diagonal hatching are walkable ground under stall awnings or tree canopies (in partial shadow, where you could hide). Walkable areas must be clearly distinguishable from non-walkable objects at a glance: keep walkable ground open and plain (stone paving, packed earth, gravel), and give every non-walkable object a solid, readable shape. Do not draw the hatching or grid lines themselves.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, crates, lanterns on posts, a generator, a hand cart, masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

#### 9. 部屋6：社の森

- 添付：`docs/sketches/a11_art/room_fest2_woods.png`、`public/assets/maps/fest_gate.webp`
- 保存名：`map_fest2_woods.png`

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Square 1:1 image (1024×1024). A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters. Match the art style, colors and lighting of the attached map illustration (a Japanese summer shrine festival at dusk in the late Heisei era, warm lantern light strung overhead).
Scene: the quiet woods behind a small Japanese shrine on a summer night. At the very top edge, the front of a small wooden shrine building (partly cut off by the top edge) with a little offering box and a rope, in front of it a small open yard of gravel. In the center, a cross-shaped pond (the light-blue squares in the sketch) with STEPPING STONES running through it in a cross shape, surrounded by moss and stone. A gravel path loops around the pond between tall cedar trees and stone lanterns. Small side nooks at the left edge and the right edge (keep them open ground). The hatched strip at the left is under the tree canopy. The festival lights glow faintly through the trees from the bottom, where the path leads down to the plaza.
Follow the attached layout sketch exactly (a 24 by 24 grid, one square = one step): light sand areas are walkable ground, dark brown areas are buildings, stalls, trees and other things you cannot walk through, blue marks the openings at the edges (the blue is only a guide: do not paint blue squares, just let the path continue out through the edge there). Sand areas with diagonal hatching are walkable ground under stall awnings or tree canopies (in partial shadow, where you could hide). Walkable areas must be clearly distinguishable from non-walkable objects at a glance: keep walkable ground open and plain (stone paving, packed earth, gravel), and give every non-walkable object a solid, readable shape. Do not draw the hatching or grid lines themselves.
Do NOT draw any of these, because the game places them as separate small pictures: treasure boxes, crates, lanterns on posts, a generator, a hand cart, masks or mask display boards, a vending machine, a bamboo thicket, a broken wooden gate, wooden board walls across the paths, people or crowds.
Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

### AC. 脇役のまばたき・口パク（基本の1枚）

基本の1枚の絵をそのまま直して、目だけ閉じた絵と、口だけ開けた絵を作る（けんたと同じ作り方。`scripts/portrait_parts.py`）。台詞の多い人から順。目を閉じて笑っている絵（五郎・初江）は、まばたきが要らない。口を開けて笑っている絵は、口パクが要らない。表情違いが届いたら、その表情の分は後で足す。毎回その人の基本の1枚を添付する。構図が少しでも動いたら作り直す

#### 10. 写しのしおり：口を開けた絵（作り直し）

- 添付：`public/assets/portraits/past_shiori_normal.webp`
- 保存名：`past_shiori_talk_src.png`
- メモ：1回目は顔の向きと髪が元の絵からずれて使えなかった。「通常」の絵を添付して、顔と髪を動かさずに口だけ開けてもらう

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm, gently smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 11. 写しの勇夫：目を閉じた絵

- 添付：`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_isamu_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same serious expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 12. 写しの勇夫：口を開けた絵

- 添付：`public/assets/portraits/past_isamu_serious.webp`
- 保存名：`past_isamu_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same serious expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 13. 写しの昇平：目を閉じた絵

- 添付：`public/assets/portraits/past_noboru_smile.webp`
- 保存名：`past_noboru_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 14. 写しの昇平：口を開けた絵

- 添付：`public/assets/portraits/past_noboru_smile.webp`
- 保存名：`past_noboru_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 15. 善次：目を閉じた絵

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 16. 善次：口を開けた絵

- 添付：`public/assets/portraits/zenji_smile.webp`
- 保存名：`zenji_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 17. 写しの寿美：目を閉じた絵

- 添付：`public/assets/portraits/past_sumi_smile.webp`
- 保存名：`past_sumi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 18. 写しの寿美：口を開けた絵

- 添付：`public/assets/portraits/past_sumi_smile.webp`
- 保存名：`past_sumi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 19. 写しのおじいちゃん：目を閉じた絵

- 添付：`public/assets/portraits/past_grandpa_normal.webp`
- 保存名：`past_grandpa_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 20. 写しのおじいちゃん：口を開けた絵

- 添付：`public/assets/portraits/past_grandpa_normal.webp`
- 保存名：`past_grandpa_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same calm expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

#### 21. だいち：目を閉じた絵

- 添付：`public/assets/portraits/daichi_smile.webp`
- 保存名：`daichi_blink_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the eyes: gently close both eyes, as in the middle of a natural blink (soft curved eyelid lines with eyelashes, the same eyebrows as now). Do not move or resize the face, do not change the mouth.
```

#### 22. だいち：口を開けた絵

- 添付：`public/assets/portraits/daichi_smile.webp`
- 保存名：`daichi_talk_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: open it slightly, as in the middle of speaking a word (a small natural opening, teeth barely visible). Do not move or resize the face, do not change the eyes.
```

### AD. 口を開けた顔の、口を閉じた絵（口パク用）

元の絵が口を開けている表情は、話していても口が止まって見える（開発者と決めた：口を閉じた絵を足す）。ゲームは、話していない時にこの絵を重ね、話す間は重ねたり外したりして開け閉めする。台詞の多い順。大笑い・泣き顔のように、開いているのが自然な顔は頼まない。毎回その表情の絵を添付する。構図が少しでも動いたら作り直す

#### 23. みお：smileの口を閉じた絵（台本で204行）

- 添付：`public/assets/portraits/mio_smile.webp`
- 保存名：`mio_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 24. あかり：smileの口を閉じた絵（台本で85行）

- 添付：`public/assets/portraits/akari_smile.webp`
- 保存名：`akari_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same laughing with eyes closed expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 25. 富美：smileの口を閉じた絵（台本で35行）

- 添付：`public/assets/portraits/fumi_smile.webp`
- 保存名：`fumi_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 26. ゆうま：smileの口を閉じた絵（台本で32行）

- 添付：`public/assets/portraits/yuma_smile.webp`
- 保存名：`yuma_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 27. 写しの正雄：smileの口を閉じた絵（台本で26行）

- 添付：`public/assets/portraits/past_masaru_smile.webp`
- 保存名：`past_masaru_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same big proud smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 28. 写しのゆうま：smileの口を閉じた絵（台本で18行）

- 添付：`public/assets/portraits/past_yuma_smile.webp`
- 保存名：`past_yuma_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 29. 写しの静江：smileの口を閉じた絵（台本で18行）

- 添付：`public/assets/portraits/past_shizue_smile.webp`
- 保存名：`past_shizue_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same bright smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 30. 子りく：proudの口を閉じた絵（台本で16行）

- 添付：`public/assets/portraits/young_riku_proud.webp`
- 保存名：`young_riku_proud_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same proud grinning expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 31. 写しのひなの：smileの口を閉じた絵（台本で16行）

- 添付：`public/assets/portraits/past_hinano_smile.webp`
- 保存名：`past_hinano_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 32. 正雄：smileの口を閉じた絵（台本で15行）

- 添付：`public/assets/portraits/masaru_smile.webp`
- 保存名：`masaru_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 33. 子あかり：smileの口を閉じた絵（台本で14行）

- 添付：`public/assets/portraits/young_akari_smile.webp`
- 保存名：`young_akari_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 34. 写しの富美：smileの口を閉じた絵（台本で14行）

- 添付：`public/assets/portraits/past_fumi_smile.webp`
- 保存名：`past_fumi_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 35. 勇夫：smileの口を閉じた絵（台本で12行）

- 添付：`public/assets/portraits/isamu_smile.webp`
- 保存名：`isamu_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 36. 昇平：smileの口を閉じた絵（台本で11行）

- 添付：`public/assets/portraits/noboru_smile.webp`
- 保存名：`noboru_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 37. さき：smileの口を閉じた絵（台本で9行）

- 添付：`public/assets/portraits/saki_smile.webp`
- 保存名：`saki_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 38. しおり：smileの口を閉じた絵（台本で9行）

- 添付：`public/assets/portraits/shiori_smile.webp`
- 保存名：`shiori_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 39. 茂雄：smileの口を閉じた絵（台本で8行）

- 添付：`public/assets/portraits/shigeru_smile.webp`
- 保存名：`shigeru_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 40. 写しの千代：smileの口を閉じた絵（台本で8行）

- 添付：`public/assets/portraits/past_chiyo_smile.webp`
- 保存名：`past_chiyo_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 41. 写しの昇平：smileの口を閉じた絵（台本で8行）

- 添付：`public/assets/portraits/past_noboru_smile.webp`
- 保存名：`past_noboru_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same grinning expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 42. 写しのたいち：smileの口を閉じた絵（台本で8行）

- 添付：`public/assets/portraits/past_taichi_smile.webp`
- 保存名：`past_taichi_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same grinning expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 43. ペトラ：smileの口を閉じた絵（台本で5行）

- 添付：`public/assets/portraits/petra_smile.webp`
- 保存名：`petra_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
```

#### 44. 写しのしおり：smileの口を閉じた絵（台本で5行）

- 添付：`public/assets/portraits/past_shiori_smile.webp`
- 保存名：`past_shiori_smile_closed_src.png`

```
Edit the attached image. Keep everything exactly the same: the same character, the same teasing smiling expression, the same pose, framing, size, camera distance, hair, clothes, colors, line art and plain white background.
Change only the mouth: close it gently into a soft closed-lip smile that keeps the same mood. Do not move or resize the face, do not change the eyes.
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
- **W. 探索を一緒に歩く二頭身（段階267）**（5 枚）：歩く二頭身のハルト、歩く二頭身のあかり、歩く二頭身のみお、歩く二頭身の小夜子、歩く二頭身の早瀬
- **V. 砂の底のレアスナップ（段階219）**（3 枚）：スナップ「残像」（感覚記憶の層）、スナップ「うたかた」（短期記憶の層）、スナップ「回想」（エピソード記憶の層）
- **Y. 寄り道の町の人の表情違い（五郎・善次・初江）**（10 枚）：五郎：困り、五郎：驚き、五郎：照れ、五郎：泣き笑い、善次：微笑み、善次：照れ、善次：驚き、初江：微笑み、初江：困り、初江：驚き
- **Z. 立ち絵のない3人（写しの仁・写しの静江・写しの敏夫）**（13 枚）：写しの仁（平成9年の春、29歳。早瀬の若いころ）：通常、写しの静江（平成9年の春、27歳。早瀬の妻）：笑顔、写しの敏夫（昭和44年の冬、30代。工場の先輩の職人）：通常、写しの仁：驚き、写しの仁：真剣、写しの仁：困り、写しの静江：驚き、写しの静江：大笑い、写しの静江：考える、写しの静江：微笑み、写しの静江：泣き笑い、写しの静江：照れ、写しの静江：困り笑い
- **AA. 早瀬（仲間）のまばたき・口パク**（9 枚）：早瀬：通常（目を閉じた絵）、早瀬：考える（目を閉じた絵）、早瀬：苦笑い（目を閉じた絵）、早瀬：驚き（目を閉じた絵）、早瀬：怒り（目を閉じた絵）、早瀬：泣き笑い（目を閉じた絵）、早瀬：通常（口を開けた絵）、早瀬：考える（口を開けた絵）、早瀬：苦笑い（口を開けた絵）
- **AB. 脇役の表情違い（台本で使う表情だけ）**（94 枚）：勇夫：笑顔（台本で12回）、勇夫：さみしげ（台本で12回）、勇夫：考える（台本で11回）、勇夫：驚き（台本で3回）、勇夫：泣き笑い（台本で3回）、ペトラ：真剣（台本で13回）、ペトラ：困り（台本で10回）、ペトラ：驚き（台本で7回）、ペトラ：笑顔（台本で5回）、しおり：通常（台本で14回）、しおり：困り笑い（台本で12回）、しおり：驚き（台本で9回）、しおり：考える（台本で8回）、しおり：苦笑い（台本で7回）、しおり：微笑み（台本で4回）、しおり：さみしげ（台本で3回）、しおり：大笑い（台本で3回）、しおり：困り（台本で1回）、しおり：あせり（台本で1回）、浩二：苦笑い（台本で15回）、浩二：考える（台本で12回）、浩二：さみしげ（台本で11回）、浩二：通常（台本で9回）、浩二：驚き（台本で5回）、千代：微笑み（台本で15回）、千代：通常（台本で12回）、千代：さみしげ（台本で9回）、千代：考える（台本で8回）、千代：驚き（台本で7回）、千代：苦笑い（台本で2回）、千代：悲しい（台本で2回）、千代：泣き笑い（台本で2回）、千代：真剣（台本で1回）、けんた：苦笑い（台本で14回）、けんた：さみしげ（台本で8回）、けんた：考える（台本で7回）、けんた：照れ（台本で6回）、けんた：驚き（台本で4回）、けんた：泣き笑い（台本で2回）、けんた：大笑い（台本で1回）、カイ：通常（台本で20回）、カイ：見下す（台本で11回）、写しのとうや：通常（台本で12回）、写しの千代：通常（台本で11回）、写しの千代：泣き（台本で6回）、写しの千代：むっ（台本で4回）、写しの千代：真剣（台本で2回）、写しの千代：驚き（台本で1回）、写しの菊：泣き笑い（台本で1回）、写しのしおり：通常（台本で14回）、写しのしおり：むっ（台本で9回）、写しのしおり：真剣（台本で3回）、写しのけんた：泣き笑い（台本で1回）、正雄：通常（台本で6回）、正雄：苦笑い（台本で5回）、正雄：驚き（台本で2回）、正雄：さみしげ（台本で2回）、昇平：通常（台本で4回）、昇平：考える（台本で4回）、昇平：さみしげ（台本で4回）、昇平：困り笑い（台本で3回）、昇平：苦笑い（台本で2回）、昇平：照れ（台本で1回）、昇平：驚き（台本で1回）、とうや：通常（台本で7回）、とうや：驚き（台本で4回）、とうや：困り笑い（台本で3回）、とうや：考える（台本で2回）、とうや：苦笑い（台本で2回）、とうや：微笑み（台本で1回）、とうや：真剣（台本で1回）、とうや：大笑い（台本で1回）、写しの浩二：驚き（台本で3回）、写しの浩二：泣き笑い（台本で1回）、ひなの：さみしげ（台本で5回）、ひなの：驚き（台本で3回）、ひなの：むっ（台本で3回）、ひなの：困り（台本で2回）、ひなの：微笑み（台本で1回）、寿美：さみしげ（台本で7回）、寿美：考える（台本で3回）、寿美：驚き（台本で2回）、寿美：通常（台本で1回）、茂雄：通常（台本で3回）、茂雄：さみしげ（台本で3回）、茂雄：驚き（台本で2回）、茂雄：苦笑い（台本で2回）、茂雄：考える（台本で2回）、さき：驚き（台本で3回）、さき：考える（台本で3回）、さき：さみしげ（台本で3回）、さき：苦笑い（台本で1回）、さき：微笑み（台本で1回）、写しの勇夫：泣き笑い（台本で1回）
- **AC. 脇役のまばたき・口パク（基本の1枚）**（41 枚）：勇夫：目を閉じた絵、勇夫：口を開けた絵、ペトラ：目を閉じた絵、ペトラ：口を開けた絵、浩二：目を閉じた絵、浩二：口を開けた絵、千代：目を閉じた絵、千代：口を開けた絵、カイ：口を開けた絵、たいち：目を閉じた絵、たいち：口を開けた絵、写しのとうや：目を閉じた絵、写しのとうや：口を開けた絵、写しの千代：目を閉じた絵、写しの千代：口を開けた絵、写しの菊：目を閉じた絵、写しの菊：口を開けた絵、写しのしおり：目を閉じた絵、写しのけんた：目を閉じた絵、写しのけんた：口を開けた絵、正雄：目を閉じた絵、正雄：口を開けた絵、昇平：目を閉じた絵、昇平：口を開けた絵、写しのたいち：目を閉じた絵、写しのたいち：口を開けた絵、写しの正雄：目を閉じた絵、写しの浩二：目を閉じた絵、写しの浩二：口を開けた絵、ひなの：目を閉じた絵、ひなの：口を開けた絵、ノア：目を閉じた絵、ノア：口を開けた絵、寿美：目を閉じた絵、寿美：口を開けた絵、茂雄：目を閉じた絵、茂雄：口を開けた絵、写しの源三：目を閉じた絵、写しの源三：口を開けた絵、さき：目を閉じた絵、さき：口を開けた絵
- **W. 拠点のメニューの絵（段階226・227）**（6 枚）：砂の底（横長の帯）、星図・武器・ライブラリ・交換所・落とし物（縦長）。ムーブメント・アルバム・編成・町の小話の縦長は、今の横長の絵を使い回すと決めたので作らない（2026-11-17 開発者と）
- **X. 寄り道の町の人と寄り道のタイル**（4 枚。2026-11-17）：五郎（八百屋の主人）、善次（時計屋の常連）、初江（駄菓子屋のおばあさん）、拠点のタイル「寄り道」（縦長）
