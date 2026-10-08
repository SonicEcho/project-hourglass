# 絵と音の方向性

M0 の「絵と音の方向性」の決まり（2026-10-08、開発者と相談）。素材を手に入れる時の決まりと台帳の書き方は `docs/ASSETS.md`。

## 1. 決まったこと

| 項目 | 決まったこと |
| --- | --- |
| 絵柄 | **すべてイラスト**（アニメ調）。探索のマップ、戦闘、会話の立ち絵、山場の1枚絵 |
| 探索の形 | **見下ろしの1枚絵のマップ ＋ 見えないマス目**（歩ける場所は `src/core/grid.ts` の文字の地図で決める。今の「タップして歩く」手触りを残す）。段階18bの試作を開発者がスマホで確かめ、「とても良い感じ」だったので、この形に決めた（2026-10-08） |
| 日常の街 | 学校・商店街・時計屋などの場面を選んで移動する形（1枚絵の場面） |
| 仲間の動き | 歩くアニメーションは作らない。マップ上の仲間は小さなイラストにして、歩く時は揺らす動きで表す |
| 背景の枚数を減らす工夫 | 同じ背景を、夕暮れ・夜・砂嵐のノイズなど、ゲームの中の色の加工で使い回す |
| 立ち絵 | 1人につき基本の1枚を決め、そこから表情だけ作り変える。表情は1人6種類くらい |
| 山場の1枚絵 | 山場だけに絞る（全体で20〜30枚くらい） |
| AI の画像サービス | **無料枠を使い倒す**。キャラ（立ち絵・表情・1枚絵・敵）は Gemini系、背景とマップは OpenAI系（ChatGPT）。量産で無料枠が足りない月だけ有料版を使う（キャラは NovelAI が第一候補）。有料版は、絵を見て「この方向で行ける」と思えてから決める |
| 使わないサービス | Bing Image Creator（以前の規約が「個人の非商用に限る」）、Midjourney（作った画像が公開される設定が基本で、発売前の物語の場面が見えてしまう） |

## 2. 色の決まり（たたき台）

ゲーム全体の色は「夕暮れ」。時代ごとに色を変えて、どの時間にいるかが一目で分かるようにする。

| 場所 | 色 | 雰囲気 |
| --- | --- | --- |
| 全体・画面の部品 | 茜色（夕焼けの橙）と藍色、砂色 | 夕暮れ、砂時計 |
| 現代の街 | 自然な色。夕方は茜色に染まる | 日常 |
| 平成 | 明るいパステル、水色 | 少し懐かしい夏 |
| 昭和 | セピア、くすんだ緑と橙 | 古い写真 |
| 大正 | 朱、藍、提灯の金 | 祭りの夜 |
| 未来 | 白、青緑、冷たい光 | 時間の速い、無機質な世界 |
| レストピア | 深い紺と金、砂の色 | 図書館、星空 |
| 砂嵐 | 白黒のノイズに、その時代の色が少し混ざる | すり切れた時間 |

## 3. 絵柄の指示文（共通）

画像の AI は英語の指示が一番安定するので、指示文は英語で書く。毎回、この共通部分を先頭に付けて、絵柄をそろえる。作家名や作品名は入れない（`docs/ASSETS.md`）。

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.
```

## 4. 最初の試作（M0）

| 試作 | サービス | 中身 | 確かめること |
| --- | --- | --- | --- |
| 1. あかりの立ち絵 | 基本の1枚は OpenAI系、表情違いは Gemini系（どちらも無料） | 基本の1枚と、表情違い4つ | 同じ顔・同じ服のまま、表情だけ変えられるか |
| 2. 見下ろしのマップ | OpenAI系（無料） | 1-1「金魚の名前」の縁日（平成のはじめ、神社の夏祭り） | 見下ろしで、通路と屋台の配置が分かる絵になるか（見えないマス目を重ねられるか） |

結果を見て、探索の形（見下ろしのマップか、場面をつなぐ形か）と、絵柄の指示文を決める。

**試作2の結果（2026-10-08）**：ChatGPT の無料枠を使い切ったので、同じ指示文を Gemini で試した。参道・広場・屋台・鳥居が分かれた、マス目を重ねやすい少し斜めの見下ろしの絵になった（看板の文字はところどころ崩れる。本番では「看板に文字を書かない」を指示文に入れ、文字はゲームの側で載せる）。ただし開発者の好みのデザインではなかったので、本番用は ChatGPT で作り直す。段階18bの試作には、この絵を仮に使う。段階18bで、この絵を 24×43 マスに分けて歩ける場所を文字で書き、タップで歩けることを確かめた（絵1枚につき、マス目を書く手間は数分）。使うと決めた絵は、台帳（`src/data/assets.ts`）に、サービス名・無料か有料か・指示文・作った日・規約の控えの場所を書いて入れる。

**試作1の結果（2026-10-08）**：Gemini で作った立ち絵は、思っていたのと違う印象だった。開発者が ChatGPT で下の指示文から作った立ち絵（杖を持っている絵）のほうが、思っていた姿に近かった。そこで、**キャラの基本の1枚は ChatGPT で作り、その絵を見本として Gemini に渡して、表情違いを作る**形を試す（2つの無料枠を分けて使える）。

**あかりの見た目（決まった）**：ChatGPT で使った指示文のとおり。

- 17歳。あたたかく、やさしく、少しだけ切なさのある顔。いつもそばにいる子
- 肩くらいのやわらかい栗色の髪、毛先が内巻き、横に流した前髪。後ろの一部を細い赤いリボンでハーフアップ
- 左側に小さな赤い金魚の髪留め（少し古びている。子どものころから持っている物）
- 白いシャツに夕焼け色の赤いリボン、クリーム色のニットのカーディガン（袖が少し長く、手が半分隠れる）、紺のプリーツスカート、紺のハイソックス、茶色のローファー（制服は主人公と同じ学校のもの）
- 武器：背丈ほどの細い木の杖。先に、赤い金魚の形の小さなガラスの灯籠（金魚ちょうちんのような形）。赤と白の房と小さな鈴。灯籠はあたたかく光り、まわりに淡い青の霜のきらめき（回復と氷の魔法。試作のデータのケア・アイスと同じ）
- 色：髪 #8A5A3C、金魚の赤 #D9483B、カーディガン #F1E6D2、スカート #2B3552、灯籠の光 #FFC979、霜の青 #BFE3F2、肌 #F6DCC8

ChatGPT で使った指示文（台帳に入れる時は、この全文を書く）：

```
Character design sheet of an original anime-style heroine for a mobile turn-based JRPG, full body front view, standing in a natural friendly pose with hands holding a staff in front of her, plain off-white background, clean lineart with soft cel shading, about 6 heads tall.

Character: Akari, a 17-year-old Japanese high school girl, the protagonist's childhood friend. Warm, kind, cheerful face with a hint of wistfulness, soft gentle smile, the kind of girl who is always nearby.
Hair: shoulder-length soft chestnut-brown hair with light inward curls at the ends, side-swept bangs, a small half-up section tied at the back with a thin red ribbon.
Hair accessory: one small red goldfish-shaped hair clip on the left side, slightly old and worn, like something she has had since childhood.
Eyes: warm brown eyes, round and gentle, natural, not glowing.
Outfit: same school uniform style as the protagonist: white dress shirt, dusk-red neck ribbon, a soft cream-colored knit cardigan worn over the shirt with sleeves slightly long covering part of her hands, navy pleated school skirt above the knee, navy knee socks, brown loafers.
Weapon: a slender wooden prayer staff, about her height, with a small glowing glass lantern at the top shaped like a red goldfish (like a Japanese goldfish paper lantern), a short red-and-white tassel and a tiny bell hanging from it. The lantern emits a soft warm light with a few faint pale-blue frost sparkles around it (she uses healing and ice magic).

Color palette: chestnut hair #8A5A3C, goldfish red #D9483B, cream cardigan #F1E6D2, navy skirt #2B3552, warm lantern light #FFC979, frost blue #BFE3F2, skin #F6DCC8.
Additional views on the same sheet: back view, 4 facial expressions (bright smile, gentle worried look, lost-in-thought deja vu look gazing into the distance, determined while casting), close-up of the goldfish lantern staff.
```

- この指示文の書き方（髪・髪飾り・目・服・武器・色の番号を分けて書く）を、ほかのキャラの指示文のひな形にする
- 気になった点：背景が白ではなく暗い光の背景になった。ゲームで使う立ち絵は、白か透明の背景が要る

**表情違いの試作の結果（Gemini、2026-10-08）**：ChatGPT の絵を見本に渡すと、**顔・髪・金魚の髪留め・リボンは、表情を変えてもそろった**（この作り方で行ける）。直すところ：

- 頼んでいない小物が足される（方位磁石）。魔法陣の中に、読めない漢字のような文字が入る
- 構図が表情ごとに変わる（手の位置）。会話で表情だけ差し替えるには、全部同じ構図が要る
- 首のリボンが、見本の赤から橙に変わり、大きくなった
- 全身の絵で、杖の金魚の灯籠が赤く光らず、透明なガラスになった

**表情違いの作り方（決まった）**：まず胸から上の基本の1枚（笑顔など）を決め、**その1枚を見本にして「顔だけ変える」**。指示文に、手の位置・小物なし・文字なし・リボンの色（#D9483B）を毎回書く。魔法を使う姿は会話の表情とは分け、戦闘用の絵として別に作る。

**直した後の結果（2026-10-08）**：全身の絵は、杖の金魚の灯籠が赤く光り、霜のきらめきも付いた。デジャヴの顔と決意の顔は、笑顔と同じ構図で、リボンも赤に戻った（決意の顔は「むっとした顔」に近いので、笑いの場面でも使える）。開発者が口を開けた大笑いの顔も作った（表情は5つ：笑顔・大笑い・心配・むっ・デジャヴ）。最初に作った笑顔と心配する顔はリボンが橙のまま。開発者はそこまで気にならないので、無料枠を節約して後回しにする（本番の素材を作る時に直す）。


**開発者が ChatGPT で作った設定画（2026-10-08、共有）**

- **あかりの設定画**：正面・背面・表情4つ（明るい笑顔、心配そう、遠い目（デジャヴ）、魔法を放つ（決意））・金魚の提灯の杖・金魚の髪留めの拡大。プロフィール：17歳、身長158cm、誕生日4月12日、高校2年生。性格「優しくて明るい、少しだけ寂しがり屋」。台詞「ずっと、そばにいるよ。どんな時も……」
- **ハルトの見た目**：はねた黒髪に、一筋だけ砂金色のメッシュ（砂時計の砂の色。未来から来た伏線にもなる）。琥珀色の目。紺のパーカー（裏地・フード・袖口は夕焼けの橙）を前を開けて羽織り、白いシャツにゆるめた砂金色のネクタイ、灰色のズボン、白いスニーカー（底は橙）。左手首に茶色の革の腕時計。17歳・高校生
  - 色：髪 #23222E、砂金・ネクタイ #D9AE62、瞳 #C98A3A、パーカー #2B3552、裏地・フード・袖 #E07A4F、肌 #F3D6C1
  - 武器：時計の長針をかたどった、細く長い剣。鍔は時計の歯車、グリップはこげ茶、柄頭は真鍮
  - 表情：通常（無表情）、やさしい笑顔、驚き、決意
  - 目：琥珀色の瞳の中に、時計の文字盤の外枠のような、ごく細い金の輪（光らない）。正体の伏線として使える
  - 服の差分（設定画の2枚目）：私服風（放課後。パーカーにリュック）、制服（紺のブレザー）、休日のカジュアル（灰色のパーカー）
  - 一枚絵の言葉：「あの時の、あの瞬間を もう一度——」「あの時の時間を、取り戻すために——」
  - 設定画の指示文（ChatGPT）は台帳（`src/data/assets.ts` の `HERO_BASE_PROMPT`）に全文を書いた
  - 設定画の一言「特別じゃないけど、ちゃんと前を向いてる。そんな普通の少年」は、外から見た印象として使える。物語の始まりの心（居場所に自信がなく、流されるように生きている。`docs/STORY.md` の 2-10）とは少し違うので、台詞や紹介文に使う時は合わせる
- **キービジュアルの案**：レストピアの、時計と砂時計の棚が並ぶ図書館で、ハルトが剣を構え、祭りの道具（狐の面・提灯・金魚）が崩れて混ざった砂嵐と向き合う。後ろの大きな砂時計の中に、盗まれた夏祭りの夜が見える。物語の設定（砂嵐の見た目、蔵書の砂時計）とよく合っている。タイトル画面やストアの紹介の絵の方向にできる
- **気づいたこと**：ChatGPT に透明な背景で作ってもらった表情の一覧は、髪のまわりに赤や黄色のふちが大きく残った（透明の処理がうまくいっていない）。立ち絵は、白い背景で作ってもらい、こちらの背景を抜く AI（`scripts/cutout.py`）で抜く方がきれい

## 5. ゲームに入れる時の決まり（段階18a）

- 立ち絵は、白い背景で作ってもらい、`python3 scripts/cutout.py 入力.jpg public/assets/portraits/<キャラ>_<表情>.webp` で背景を透明に抜く。アニメ調の絵に向いた背景を抜く AI（rembg の isnet-anime。無料、この開発の環境で動く）を使う。髪のすき間の背景も抜け、白いシャツや歯は残る
  - 最初は色の近さで抜く自前の処理にしたが、髪のまわりに白いふちや白い点が残り、開発者がスマホで見て気になった（2026-10-08）。AI で抜く形に変えたら、ふちがきれいになった
- 元の絵は、できるだけ**作ったままの大きさの PNG**で渡してもらう（縮めたり JPEG にしたりすると、ふちが荒れる）
- 立ち絵は、全員を**同じ構図**（胸から上、縦長、同じくらいの顔の大きさ）で作る。違う構図の絵を並べると、背の高さがちぐはぐに見える（段階18aで、顔と肩だけのハルトの絵を並べた時に分かった）
- 立ち絵を作ってもらったら、指示文も一緒に教えてもらい、台帳に書く
- 台帳（`src/data/assets.ts`）に、サービス名・無料か有料か・指示文・見本にした絵・作った日・規約の控え（`docs/licenses/ai-gemini.md`・`ai-openai.md`）を書く。最初は `placeholder`（仮）

## 6. 音

BGM と効果音も、フリー素材を中心にする。2026-10-08 に、各サイトの規約を調べた（公式ページを読めたものは「公式」、読めなかったものは解説サイトから）。

| サイト | 種類 | 売り物に使えるか | クレジット | ゲームへの組み込み | 調べ方 |
| --- | --- | --- | --- | --- | --- |
| OpenTracks（旧 DOVA-SYNDROME。2026-09-15 に名前が変わった） | BGM（作曲者がたくさんいる） | 可（有償のゲームも利用例に入っている） | 不要（作曲者が別に条件を書いていれば、そちらが優先） | 可。ただし**遊ぶ人が音のファイルを簡単に取り出して複製できる状態は禁止** | 公式 https://opentracks.com/help/articles/license/ |
| 魔王魂 | BGM・効果音 | 可 | **必要**（「音楽：魔王魂」など。場所は自由） | ゲーム制作のための暗号化は許可。同梱そのものの条文はない | 公式 https://maou.audio/rule/ |
| 甘茶の音楽工房 | BGM | 可 | 任意 | 「音楽だけを販売したり、2次配布することは禁止」。ゲームに同梱するのが2次配布に当たるかは書いていない（使うなら作者に聞く） | 公式 https://amachamusic.chagasi.com/terms.html |
| 効果音ラボ | 効果音 | 可 | 不要（任意） | 「アプリに操作音として効果音を組み込む（音源ファイルむき出しでも可）」が許可の例に入っている | 公式 https://soundeffect-lab.info/agreement/ |
| OtoLogic | 効果音・短い BGM | 可 | 必要（CC BY 4.0。有料のライセンスなら不要） | CC BY 4.0 なら可 | 解説サイト（公式ページは読み込めなかった） |

- どのサイトも「AI の学習に使う」「音だけを配る・売る」「著作権管理団体や Content ID への登録」は禁止
- **技術の決まり（OpenTracks や魔王魂の曲を使うことになった時だけ作る）**：Web のゲームは、音のファイルがブラウザから見えてしまう。OpenTracks の「簡単に取り出せる状態は禁止」と、魔王魂の「暗号化は許可」に合わせて、音のファイルは公開する時に簡単な暗号をかけ、ゲームの中で戻して鳴らす形にする（効果音ラボの効果音は、そのままでもよい）
- 使う時は、その日の規約の文を `docs/licenses/` に保存し、台帳に書く（`docs/ASSETS.md`）

**決まったこと（2026-10-08、開発者と相談）**

- **BGM は Suno で自作する**（2026-10-08、開発者が試しに聴いて決めた）。理由：完成度が高い、探す手間がない、サイトごとの規約に縛られない、他のゲームと曲が重ならない、曲に一番こだわりたいので自分で細かく調整できる方がよい
  - 曲調の試しは無料の版で行い、本番の曲は有料の版の期間に作ってダウンロードする（下の注意）
  - 合う曲がどうしても作れない場面だけ、OpenTracks や魔王魂で補う
- **効果音は効果音ラボ**（クレジット不要、アプリへの組み込みが明記されている）
- 段階19で、音を鳴らす仕組みを作った（`docs/design/tech.md`）。効果音ラボの効果音6つ（ボタン・斬る・打撃・回復・宝箱・遭遇）を入れた。BGM は本番の曲ができるまで、自作の仮の音（`scripts/placeholder_bgm.py`）で鳴らす。BGM を Suno で作るので、上の「音のファイルに暗号をかける」仕組みは作らない
  - Suno の無料の版で作った曲は、売り物に使えない（後から有料にしても、さかのぼって使えるようにはならない）。商用に使える権利は、有料の期間にダウンロードした曲だけに付く（2026-09-03 から。Pro は月20曲、Premier は月60曲まで）。解約しても、ダウンロード済みの曲は使い続けられる
  - 使うなら、無料の版で曲調を試してから、有料の版を必要な月だけ契約して本番の曲を作る。ダウンロードした日の規約の控えを取る
  - Suno の曲はループ前提ではないので、つなぎ目を探して切る作業が要る（Claude が曲を解析して、つなぎ目を探す）
- 曲調の指示文の例（Instrumental をオンにして、Style of Music に書く）：
  - タイトル・夕暮れの街：`nostalgic emotional JRPG title theme, solo piano and soft strings, music box accents, gentle warm melody with a hint of sadness, summer evening sunset atmosphere, slow tempo 76 bpm, cinematic, instrumental, no vocals, no fade out`
  - 縁日・祭り：`cheerful Japanese summer festival music, shinobue bamboo flute, taiko drums, shamisen, light percussion, playful and nostalgic, dusk atmosphere with paper lanterns, medium tempo 110 bpm, loopable game background music, instrumental, no vocals, no fade out`
  - ふだんの戦闘：`energetic JRPG battle theme, driving rock drums and bass, fast strings, bright synth lead, ticking clock percussion motif, heroic and tense, fast tempo 150 bpm, loopable game background music, instrumental, no vocals, no fade out`
  - 泣きの場面：`heartbreaking emotional piano ballad, solo piano with soft cello, slow and fragile, memories of a lost summer, quiet and tender, tempo 64 bpm, cinematic JRPG sad scene, instrumental, no vocals`

