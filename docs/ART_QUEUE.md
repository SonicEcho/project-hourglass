# 絵の「そのまま貼る一覧」

**まだの絵：9 枚**（済んだ絵 198 枚は、いちばん下に名前だけ）。上から順に作る。**1つの枠が1枚**。

- 枠の中の文を全部コピーして、ChatGPT に貼る。「添付」に書いたファイルを一緒に送る（リポジトリの中の場所。スマホなら GitHub の画面から保存して添付）
- できた絵は「保存名」の名前で保存して、まとめて Claude に送る。切り抜き・縮小・台帳への記入・ゲームへのつなぎは Claude がする
- 気に入らない時は、同じ文でもう一度作るか、「ここを直して」と一言足して作り直してよい
- 元の決まりは `docs/ART.md`（絵柄の共通部分・頭の文）。この一覧は `python3 scripts/art_queue.py` で作り直せる（届いた絵は DONE に足すと、下の「済んだ絵」に移る）
- まだ一覧にない物：ひなののまばたき・口パク（Gemini。ART.md の 5-8 の 1）、昼の町の地図と2頭身の歩くハルト・カイ（5-8 の 2〜4）、脇役の表情違い（5-3 の 14）、写しのしずえ・写しのじん・写しのとしおの立ち絵

## まだの絵

- [Q. だいち・さきの描き直し（けんたと見分けやすく）](#q-だいちさきの描き直しけんたと見分けやすく)：2 枚
- [R. 洋服の小夜子（試着室）](#r-洋服の小夜子試着室)：3 枚
- [S. とうや・しおりのまばたき・口パク用](#s-とうやしおりのまばたき口パク用)：4 枚

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
