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
| AI の画像サービス | **無料枠を使い倒す**。キャラの基本の1枚は ChatGPT、表情違いは Gemini（基本の1枚を見本に渡して顔だけ変える）、背景とマップは ChatGPT（2026-10-08、開発者が作り比べて決めた）。量産で無料枠が足りない月だけ有料版を使う（キャラは NovelAI が第一候補）。有料版は、絵を見て「この方向で行ける」と思えてから決める |
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
| 2. 見下ろしのマップ | OpenAI系（無料） | 1-1「金魚の名前」の縁日（当時は平成のはじめ、神社の夏祭り。2026-10-08 に平成の終わりに変更。`docs/STORY.md` の 2-13） | 見下ろしで、通路と屋台の配置が分かる絵になるか（見えないマス目を重ねられるか） |

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

## 5-2. M1 の絵を作る順番と指示文（段階31a。2026-10-08 から毎日少しずつ）

ChatGPT の無料枠で、毎日少しずつ作る。上から順に作る（ゲームの中で目に入る時間が長く、ほかの絵の見本にもなるものから）。作った絵は、作ったままの大きさの PNG と、実際に使った指示文を一緒に渡してもらう（台帳に書くため）。表情違いは、基本の1枚ができてから Gemini で作る（下の「表情違い」）。

| 順 | 絵 | サービス | 一緒に渡す見本の絵 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | ハルトの胸から上の基本の1枚（あかりと同じ構図に作り直す） | ChatGPT（実際は Gemini で描き直した） | ハルトの設定画、あかりの胸から上の絵（構図の見本） | 済（2026-10-08。M0 の絵とあかりの絵を見本に、Gemini で描き直した。下の「ハルトの表情違い」） |
| 2 | りくの胸から上の基本の1枚（新しい見た目） | ChatGPT | あかりの胸から上の絵（構図の見本） | 済（2026-10-08。`portrait.riku.smile`。下の「りくの見た目（決まった）」） |
| 3 | 背景：夕暮れの神社の参道（プロローグの最初の場面） | ChatGPT | なし | 済（2026-10-08。`bg.shrine_approach`。屋台の並びの場面にも使う） |
| 4 | 背景：時計屋の店内（夕暮れ） | ChatGPT | なし | 済（2026-10-08。`bg.clock_shop`。夜の場面は、ゲームの側で青い色をかけて使い回す） |
| 4b | 背景：時計屋の奥の部屋（夕暮れ。柱時計と作業台） | ChatGPT | 時計屋の店内の絵（同じ店に見えるように。あれば） | 済（2026-10-09。`bg.clock_shop_back`） |
| 5 | 背景：レストピアの蔵書の棚 | ChatGPT | なし | 済（2026-10-09。`bg.library`。2枚作り、下の3分の1（床）がすっきりした方を使った） |
| 6 | 子どものころの3人の基本の1枚（7歳。1人ずつ） | ChatGPT | 高校生の3人の絵 | 済（2026-10-09。`portrait.young_hero.normal`・`young_akari.smile`・`young_riku.proud`。立ち絵の高さは 360（高校生は 450）。ほかの表情は、表情違いができるまでこの1枚で代わりに出す） |
| 7 | 地図：1-1「金魚の名前」の縁日（見下ろし。段階18b の仮の絵を作り直す） | ChatGPT | 段階18b の仮の地図の絵（配置の見本。あれば） | 済（2026-10-08。`map.festival` を差し替え、歩ける場所の文字の地図も書き直した。少し夜寄りの色なので、ゲームの側で明るさを寄せるか段階25で決める） |
| 8 | 背景：商店街（昼。奥に時計屋、真ん中に街の時計） | ChatGPT（実際は Gemini） | なし | 済（2026-10-09。`bg.shopping_street`。1-C・2-B と日常の商店街） |
| 9 | 背景：教室（朝） | ChatGPT（実際は Gemini） | なし | 済（2026-10-09。`bg.classroom`。1-B・2-A と日常の学校） |
| 10 | 1枚絵：ノアとのすれ違い（2-C） | ChatGPT | ハルトとあかりの立ち絵、ノアの設定画と立ち絵 | 済（2026-10-10。`cg.noa_passing`。先にノアの見た目を決めてから作った。下の「ノアの見た目（決まった）」） |
| ― | 表情違い（あかり・ハルトの足した5つずつ、りくなど） | Gemini | 基本の1枚 | りくの7つ、ハルトの8つ、あかりの足した5つは済（2026-10-08）。あかりの笑顔・心配のリボンの色の直し（デジャヴの絵を見本に作り直した）と、子どもの3人の M1 で使う表情違い（ハルトの笑顔、あかりの心配、りくの笑顔・真剣）は済（2026-10-09）。子どもの3人のほかの表情（台本の `CAST` にある物）は、後の章で使う時に作る |

**ノアの見た目（決まった。2026-10-10）**

すれ違いの1枚絵より先に、あかり・ハルトと同じ流れで見た目を決めた（ChatGPT で設定画 → 設定画を見本に胸から上の基本の1枚 → 3人の絵を見本に1枚絵）。脚本 `docs/script/M1.md` の提案と、2. の「未来」の色（白、青緑、冷たい光）から書いた。

- 髪：銀に青緑が混じる短いボブ、まっすぐの前髪。毛先が青緑に寄る
- 目：青緑。落ち着いて鋭い、光らない
- 服：白い詰め襟のロングコート（未来の制服。縫い目と袖口に青緑の細い線）、紺のインナー、白いズボン、白いブーツ。襟元に砂時計の形の留め具
- 表情：ふだんは無表情。設定画の表情は、無表情・小さな笑み・冷たいにらみ・驚き
- 武器：まだ描いていない（戦い方は「敵を解析して弱点を見抜く」だけ決まっている。戦闘の絵が要る6章の頃に決める）
- 設定画はリポジトリに入れていない（あかり・ハルトと同じ）。設定画の指示文は台帳（`src/data/assets.ts` の `NOA_SHEET_PROMPT`）に全文を書いた。立ち絵は `portrait.noa.normal`

**8〜10 の指示文**（2026-10-09。共通部分は下の指示文にもう付けてある。8・9 は Gemini で作った。台帳 `src/data/assets.ts` に全文がある）

- 8 商店街：放課後の商店街。左にコンビニ、パン屋・本屋・八百屋、通りの奥に小さな時計屋、真ん中に数字のない街の時計（1-C で秒針が止まる）。下の3分の1は石畳だけ
- 9 教室：朝の教室を後ろから黒板の方へ。窓と白いカーテン、黒板の上に数字のない丸い時計。下の3分の1は床と手前の机の背
- 10 ノアとのすれ違い：

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A single key visual (event CG). Vertical 9:16 image.
Inside an endless library whose towering shelves hold glowing hourglasses instead of books, dim indigo shadows and soft golden light. A boy and a girl in Japanese school uniforms (keep their designs exactly as in the attached reference portraits) stand in the aisle, seen from a slight side angle. A mysterious girl walks past them, very close, in the opposite direction. The passing girl: about 17, pale silver hair with a faint blue-green tint in a short bob, cool blue-green eyes, expressionless, a clean white long coat with thin blue-green lines like a futuristic uniform; she gives off a cold, faint white light that contrasts with the warm golden library. Her eyes are turned not toward the boy but toward the girl beside him, as if she recognizes her. The boy is looking at the passing girl in surprise. Grains of golden sand drift in the air between them, and time feels frozen for a moment.
Keep the lower quarter of the image simple, because a text box may cover it.
Absolutely no letters or text anywhere.
```

**立ち絵の共通の決まり**（全員同じ構図にする。段階18a で、構図が違うと背の高さがちぐはぐに見えたため）

- 縦長（2:3）。頭のてっぺんの少し上から胸の真ん中まで。頭は上から3分の1くらいの所。あかりの胸から上の絵と同じ大きさ・同じ距離
- 正面向き。腕は体の横に下ろし、手は画面の外
- 背景は真っ白（後で `scripts/cutout.py` で抜く）。小物・文字・魔法の光は入れない

**1. ハルトの胸から上の基本の1枚**（共通部分の後に付ける。見本の絵2枚を一緒に渡す）

```
Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, calm neutral expression with a hint of gentleness.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Character: Haruto. Keep his design exactly as in the attached character sheet: a 17-year-old Japanese high school boy, slim, approachable everyman face. Messy short black hair with a slight navy tint, spiky bangs, ONE single strand in the front bangs colored sand-gold, the rest fully black. Warm amber eyes with a very thin, faint golden ring inside the iris like the outer ring of a clock dial (subtle, not glowing). White school dress shirt, loose sand-gold necktie, open dark navy zip hoodie whose lining and hood interior are dusk orange and show at the front edges.
Color palette: hair #23222E, sand-gold #D9AE62, amber eyes #C98A3A, navy hoodie #2B3552, dusk orange #E07A4F, skin #F3D6C1.
```

**2. りくの胸から上の基本の1枚**（共通部分の後に付ける。あかりの絵を構図の見本として一緒に渡す。見た目は `docs/script/M1.md` の 5. の提案）

```
Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a big confident grin.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl.
Pose: both arms relaxed down at the sides, hands outside the frame. No props in hand.
Background: plain pure white, no shadow, no gradient.
Character: Riku, a 17-year-old Japanese high school boy, the protagonist's best friend. Cheerful, hot-blooded, a bit of a show-off. Short spiky dark-brown hair, slightly messy, a small black hair pin holding his bangs on one side, a pencil tucked behind his ear. Bright lively brown eyes. Same school uniform as the protagonist: white dress shirt with sleeves rolled up, no tie, collar open, a navy track jacket tied around his waist (may be cut off by the frame).
Color palette: hair #3A2A20, shirt #F5F2EA, track jacket #2B3552, skin #F1D2B8.
```

**りくの見た目（決まった。2026-10-08）**

開発者が3回作り比べて決めた。1回目（白シャツに紺のジャージを腰に巻いた絵）は顔つきがよかったが、髪型と服装がハルトに近く、ありきたりだった。眼鏡やヘアバンドを足した案は、別のキャラに見えた。そこで、1回目の顔を見本に添えて「顔はそのまま、髪型と服装だけ変える」形にし、案2に決めた。

- 顔つき：やんちゃで少年っぽいが、爽やか（1回目の顔のまま）。大きく口を開けた笑顔
- 髪：短く整えたこげ茶。横は短く、前髪を上げて少し横に流し、おでこを見せる。さっぱりして、はねすぎない
- 服：白いワイシャツの袖を肘までまくり、紺のニットのベスト、夕焼け色の赤いネクタイをゆるめて第一ボタンを外す
- 色：髪 #4A3222、ベスト #2B3552、ネクタイ #D9483B、シャツ #F5F2EA
- 使った指示文は台帳（`src/data/assets.ts` の `RIKU_BASE_PROMPT`）に全文を書いた

**りくの表情違い**（Gemini。りくの笑顔の絵を見本として渡す。M1 で使う順に）

あかりと同じ作り方（`docs/ART.md` の 4.「表情違いの作り方」）。毎回、次の頭の文に、表情の1行だけを替えて付ける。

```
Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, hair, navy knit vest, loose red necktie, rolled-up white sleeves, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no text, no effects.
Expression: <下の表の英語>
```

| 順 | 表情 | Expression の行 |
| --- | --- | --- |
| 1 | 得意げ | smug and proud, a confident closed-mouth grin, chin slightly raised, one eyebrow up |
| 2 | 真剣 | serious and focused, mouth closed, brows drawn together, eyes sharp and determined |
| 3 | あせり | flustered, an awkward nervous smile, eyebrows raised in a troubled way, eyes looking aside |
| 4 | 通常 | relaxed and friendly, a small natural smile with the mouth closed |
| 5 | 驚き | surprised, eyes wide open, mouth slightly open |
| 6 | にやり | a sly mischievous smirk, one corner of the mouth raised, eyes narrowed playfully |
| 7 | 悲しい | sad and quiet, eyes looking down, mouth closed, brows slightly lowered |

（1〜5 は M1 の台本で使う。6・7 は後の章でも使える）

**4. 背景：時計屋の店内（夕暮れ）**（共通部分の後に付ける。1-E・1-G。夜の場面は色の加工で使い回す）

```
Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
The interior of a small, old watch and clock shop at the edge of a shopping street in a quiet Japanese regional town, at summer dusk just before closing time. Dozens of wall clocks of different shapes and sizes cover the walls; a glass display counter full of wristwatches in the middle; wooden shelves with table clocks; a tall wooden grandfather clock near the back; a doorway to a back room at the far end, half hidden by a short noren curtain. Warm orange evening sunlight streams in through the front glass door and window, casting long shadows; dust glitters in the light. Nostalgic, quiet, a little mysterious.
Eye-level camera, looking from the entrance toward the back of the shop. Keep the lower third of the image simple (floor and the front of the counter), because a dialogue box will cover it.
Absolutely no letters or text anywhere: clock faces have simple marks instead of numbers, no signs, no labels, no price tags.
```

**4b. 背景：時計屋の奥の部屋（夕暮れ）**（共通部分の後に付ける。1-E・1-G・2-C。店内の絵ができていれば、同じ店に見えるよう見本に添える）

```
Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
The small back room of an old Japanese watch and clock shop, at summer dusk. A cluttered wooden workbench with a desk lamp, tiny screwdrivers, tweezers, a magnifying loupe and opened pocket watches; drawers full of small parts; a few wall clocks. Against the far wall stands a tall antique pendulum clock (grandfather clock), centered in the image, with plain empty wall space around it (a glowing door will appear on that wall later in the game). A small high window lets in orange evening light; the corners fall into soft indigo shadow. Quiet, nostalgic, the feeling that time is about to stop.
Eye-level camera, the pendulum clock in the center. Keep the lower third of the image simple (floor and the front edge of the workbench), because a dialogue box will cover it.
Absolutely no letters or text anywhere: clock faces have simple marks instead of numbers, no labels, no papers with writing.
```

**5. 背景：レストピアの蔵書の棚**（共通部分の後に付ける。1-F・1-G・2-C）

```
Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
A vast, fantastical library where time is stored instead of books. Towering dark-wood bookshelves rise so high that the ceiling cannot be seen, fading into a warm golden haze. On every shelf, hourglasses of many sizes stand in rows like books; inside each hourglass, softly glowing sand, and faint tiny scenes of everyday memories (a sports day, a summer festival, a birthday) shimmer in the glass. Each hourglass has a small blank paper tag tied to it. Fine golden sand particles drift slowly upward in the air. Light comes from the glowing hourglasses themselves: amber and soft gold, with deep indigo shadows between the shelves. Beautiful, quiet, nostalgic, a little lonely.
Eye-level camera, looking down a long aisle between two shelves. Keep the lower third of the image simple (the floor of the aisle), because a dialogue box will cover it.
Absolutely no letters or text anywhere: tags and book spines are blank.
```

**6. 子どものころの3人（7歳）**（共通部分の後に付ける。1人ずつ作る。その人の高校生の立ち絵を見本に添える。構図は高校生と同じにして、背の低さはゲームの側で小さく出して表す）

毎回、次の頭の文に、下の「人ごとの文」を1つ付ける。

```
Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
Draw the same character as the attached high school portrait, but as a 7-year-old child: round soft cheeks, bigger eyes, small shoulders, childlike proportions. Keep the same face features, hair color and eye color so that they are clearly the same person ten years earlier.
```

- 子どものハルト（通常の顔。表情違いは Gemini）：
  ```
  Character: young Haruto, 7 years old. Quiet, a little shy and distant, a calm neutral expression, looking slightly unsure. Messy short black hair with a slight navy tint, ONE single strand in the front bangs colored sand-gold. Warm amber eyes. Plain white short-sleeve T-shirt with no logo, and a dark navy zip hoodie with dusk-orange lining worn open (a little too big for him).
  ```
- 子どものあかり（笑顔。浴衣）：
  ```
  Character: young Akari, 7 years old. Bright, cheerful, a big warm smile. Soft chestnut-brown hair in a short bob with side-swept bangs, a small red goldfish hair clip on the left side (shiny and new). A summer yukata, white with a pattern of small red goldfish and light blue water ripples, with a red obi sash.
  ```
- 子どものりく（得意げ。甚平）：
  ```
  Character: young Riku, 7 years old. A mischievous little leader, a proud confident grin showing his teeth. Short dark-brown hair, a little spiky and messy (not yet styled). Bright lively brown eyes, a small bandage on his cheek. A navy blue jinbei (Japanese summer festival outfit) with a simple white pattern.
  ```

**ハルトの表情違い**（Gemini。ハルトの基本の1枚を見本として渡す。M1 で使う順に）

今のハルトの絵（M0 の4枚）は正方形で、あかり・りくと構図が違う。そのため、まず基本の1枚（通常）を作り直してから、表情違いを全部そろえる。基本の1枚は ChatGPT で作る予定だった（上の 1.）が、Gemini で次の指示文を試してもよい（見本の絵2枚を一緒に渡す。1枚目が今のハルトの絵、2枚目があかりの胸から上の絵）。

```
Redraw the boy from image 1 as a chest-up portrait with exactly the same framing, size and camera distance as image 2. Vertical 2:3 image. Keep his face, hair (black with ONE sand-gold strand in the front bangs), amber eyes, white shirt, loose sand-gold necktie and open navy hoodie with dusk-orange lining exactly as in image 1. Front view, calm neutral expression with a hint of gentleness. Both arms relaxed down at the sides, hands outside the frame. Plain pure white background. Same anime art style as image 2. No props, no text.
```

基本の1枚ができたら、毎回、次の頭の文に表情の1行だけを替えて付ける。

```
Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, hair with the single sand-gold strand, amber eyes, white shirt, loose sand-gold necktie, open navy hoodie with dusk-orange lining, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no text, no effects.
Expression: <下の表の英語>
```

| 順 | 表情 | Expression の行 |
| --- | --- | --- |
| 1 | 笑顔 | a gentle, slightly shy smile with the mouth closed, eyes soft |
| 2 | 驚き | surprised, eyes wide open, mouth slightly open |
| 3 | 決意 | determined, mouth firmly closed, brows set, eyes sharp and steady |
| 4 | あきれ | exasperated, half-closed eyes, mouth flat, one eyebrow slightly lowered |
| 5 | 困り | troubled, eyebrows raised in a worried way, mouth slightly open, eyes looking aside |
| 6 | 悲しい | sad and quiet, eyes looking down, mouth closed, brows slightly lowered |
| 7 | 照れ | embarrassed, light blush on the cheeks, eyes looking away, a small awkward closed-mouth smile |
| 8 | 苦笑い | a wry, strained smile, one corner of the mouth raised, eyebrows slightly troubled |

**あかりの足した表情**（Gemini。M1 の台本で足した5つ。見本は、リボンが赤いデジャヴの立ち絵 `akari_dejavu` を渡す。笑顔と心配の絵はリボンが橙なので見本にしない）

毎回、次の頭の文に、表情の1行だけを替えて付ける。

```
Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, hair, the small red goldfish hair clip, the thin red ribbon in the half-up hair (#D9483B), white shirt with red bow, cream knit cardigan, and art style. Plain pure white background. Change only the facial expression. No props, no staff, no sweat drops, no tears unless stated, no text, no effects.
Expression: <下の表の英語>
```

| 順 | 表情 | Expression の行 |
| --- | --- | --- |
| 1 | 驚き | surprised, eyes wide open, mouth slightly open, eyebrows raised |
| 2 | 照れ | embarrassed, light blush on the cheeks, eyes looking aside, a small shy smile with the mouth closed |
| 3 | 悲しい | sad and quiet, eyes looking down, brows slightly lowered, mouth closed, eyes a little moist |
| 4 | 真剣 | serious and focused, mouth firmly closed, brows set, eyes steady and determined |
| 5 | 困り笑い | a troubled smile, eyebrows raised in a worried way, a small awkward smile |
| 6 | 微笑み（静かな場面用。2026-10-08 に足した） | a gentle, soft smile with the mouth closed, eyes warm and slightly narrowed, calm and kind |

**7. 地図：1-1「金魚の名前」の縁日**（共通部分の後に付ける）

探索の地図は、絵の上に見えないマス目（1マス32、24×43マス）を重ねて、歩ける場所を文字の地図で決める（段階18b）。そのため、次のことを守ってもらう。

- 縦長（9:16）。真上に近い、少しだけ斜めの見下ろし。遠近で奥が小さくならない（マス目がずれるため）
- 歩ける所（参道・広場・石畳）と、歩けない所（屋台・木・灯籠・長椅子・柱）の境目がはっきり分かる
- 道は、仲間の小さな絵が通れる太さ（絵の横幅の8分の1くらい以上）
- 人は描かない（写しの人々や仲間は、ゲームの側で重ねる）。看板・のぼり・提灯に文字を入れない
- ゲームで使う場所：下の真ん中に入口の鳥居（出発点）、まっすぐ上へ参道、真ん中あたりに広場と大きな提灯（チェックポイント）、参道の左に金魚すくいの屋台（宝箱の場所）、右にラムネの屋台、広場から右へ抜ける石畳の小道、いちばん上に小さな社と、その前の開けた場所（区画の奥のボス）

```
Top-down map illustration for a mobile RPG exploration scene. Vertical 9:16 image. A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
Scene: a small Japanese shrine festival (ennichi) at summer dusk, about ten years ago, in a neighboring town's shrine.
Layout from bottom to top:
- Bottom center: a red torii gate at the entrance, with a short stone path leading in.
- A wide stone-paved approach path (sando) running straight up the middle of the image.
- Both sides of the path lined with festival stalls with striped cloth awnings: on the left side a goldfish-scooping stall with a shallow blue water tank full of small red goldfish; on the right side a ramune soda stall with a tub of ice and glass bottles; other stalls such as cotton candy, masks, shaved ice.
- Around the middle: an open round plaza with one large paper lantern on a wooden stand at its center and a few wooden benches at the edges.
- From the right edge of the plaza, a narrow stone path branches off to the right and leads out of the image.
- Top: a small wooden shrine building, with an open sandy space in front of it.
- Trees, stone lanterns and low fences around the outer edges.
Walkable areas (paths, plaza, sandy space) must be clearly distinguishable from non-walkable objects (stalls, trees, stone lanterns, benches, pillars). Paths are wide, at least one eighth of the image width.
Lighting: warm orange paper lanterns strung above the path, indigo and amber dusk sky tones reflected on the ground.
Absolutely no letters or text anywhere: signs, banners, lanterns and awnings are blank or have simple patterns only.
```

**3. 背景：夕暮れの神社の参道**（共通部分の後に付ける）

```
Background art for a visual novel dialogue scene. Vertical 9:16 image. No characters in the foreground.
A small Japanese shrine's approach path (sando) at summer dusk on a festival evening, in a quiet regional town. A stone-paved path leads to a red torii gate in the distance. Rows of festival food stalls with striped cloth awnings line both sides. Paper lanterns are being lit one by one, warm orange light against an indigo and amber sky. Only a few tiny blurred silhouettes of festival-goers far away.
Eye-level camera, the path centered. Keep the lower third of the image simple (ground and stone path), because a dialogue box will cover it.
Absolutely no letters or text anywhere: signs, lanterns, banners and awnings are blank or have simple patterns only.
```

## 5-3. M2 の絵を作る順番と指示文（1章の残りと2章。2026-10-10）

`docs/script/M2.md` の素材の一覧（5. と 12.）を、5-2 と同じ形の指示文にした。上から順に作る（ゲームの中で長く目に入るもの、ほかの絵の見本になるものから）。作った絵は、作ったままの大きさの PNG と実際に使った指示文を一緒に渡してもらう。

- 脚本のたたき台の指示文から直したところ：2-1 は昭和44年（1969年）なので「1960年代のはじめ」を「1969年」に直した。「切り取られるグラウンド」の手前の3人は、高校生2人と小学生（みお）にした。巾着・たばこ・腕時計など手に持つ・身に付ける小物は、立ち絵の決まり（小物なし、手は画面の外）に合わせて外した
- みお・カイは戦闘にも出るので、ノアと同じく **設定画（全身。武器も入れる）→ 胸から上の基本の1枚** の順で作る
- 敵の絵（砂嵐とボス）は、まだ M1 の分も作っていない。下の「敵の絵の共通部分」は**たたき台**で、最初の1体（1-2 のブリキノイズ）を作って、戦闘画面に置いてから決める

### 作る順番

| 順 | 絵 | サービス | 一緒に渡す見本の絵 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | みおの設定画 → 胸から上の基本の1枚 | ChatGPT | 子どものあかりの立ち絵（絵柄・構図・子どもの体つき） | 設定画は済（2026-10-11。下の「みおの見た目（決まった）」）。胸から上の基本の1枚（笑顔）も済（2026-10-13。`portrait.mio.smile`） |
| 2 | カイの設定画 → 胸から上の基本の1枚 | ChatGPT | ノアの設定画（同じ組織の制服）、あかりの笑顔の立ち絵（構図） | 設定画は済（2026-10-11。髪と目を直した。下の「カイの見た目（決まった）」）。胸から上の基本の1枚（余裕）と戦闘の絵も済（2026-10-13。`portrait.kai.smug`・`enemy.kai`） |
| 3 | 1枚絵：切り取られるグラウンド（2-3。2章の山場） | ChatGPT | ハルト・あかり・みお・カイの立ち絵 | まだ |
| 4 | いさむ（今）、写しのいさむ、写しの源三 | ChatGPT | あかりの笑顔の立ち絵（構図）。写しのいさむは、いさむとみおの立ち絵も | 済（2026-10-13。`portrait.isamu.normal`・`portrait.past_isamu.serious`・`portrait.past_genzo.normal`） |
| 5 | 背景：昭和44年の町工場の中、雪の町工場の路地 | ChatGPT | なし | 済（2026-10-13。`bg.factory_1969`・`bg.factory_alley`） |
| 6 | 地図：2-1 の雪の町工場の路地 | ChatGPT | 1-1 の縁日の地図（見下ろし方の見本） | 済（2026-10-13。`map.factory_alley`） |
| 7 | 1枚絵：親方の背中（2-1） | ChatGPT | 写しのいさむ・写しの源三の立ち絵 | 済（2026-10-14。`cg.master_back`） |
| 8 | こうじ（今）、けんた（今）、写しのけんた、写しのこうじ、写しのまさる | ChatGPT | あかりの笑顔の立ち絵（構図）。写しは、今の本人の立ち絵も | けんたは済（2026-10-14。`portrait.kenta.smile`）。ほかはまだ |
| 9 | 背景：パン屋の店内、楽器店の店内、体育館のステージ、河川敷のグラウンド | ChatGPT | なし | まだ |
| 10 | 地図：2-2 の文化祭の高校、2-3 の河川敷のグラウンド | ChatGPT | 1-1 の縁日の地図 | まだ |
| 11 | 1枚絵：代打の一打（2-3）、弦が切れても歌うステージ（2-2） | ChatGPT | 写しの人たちの立ち絵 | まだ |
| 12 | 1-2 の残り：背景（昭和の商店街、時計屋の店内（昼）、川沿いの帰り道）、地図、1枚絵（夕焼けの二人乗り） | ChatGPT | 下の各項 | 昭和の商店街の背景・地図・夕焼けの二人乗りは済（2026-10-11。`bg.showa_street`・`map.showa_street`・`cg.tandem_bicycle`）。時計屋の店内（昼）と川沿いの帰り道も済（2026-10-13。`bg.clock_shop_day`・`bg.riverside_path`） |
| 13 | 敵：1-2 の砂嵐4つとボス、2章の砂嵐12とボス3つ、カイの戦闘の絵 | ChatGPT（多い時は Gemini） | 最初に作った敵の絵（絵柄をそろえる） | ブリキノイズは済（2026-10-11。`enemy.tin_noise`。段階37で戦闘画面に置いた）。1-2 の残り4つも済（2026-10-13。`enemy.phone_noise`・`ramune_noise`・`menko_noise`・`bicycle_boss`） |
| ― | 表情違い（みお・カイ・ふみ・写しの人たち、ノアの悲しい、ハルトの悔しい・怒り、あかりの考える・泣き笑い） | Gemini | 基本の1枚 | 一部済（2026-10-11。ふみの5つ、写しのふみの3つ、写しのきよしの照れ、ノアの悲しい、ハルトの悔しい・怒り、あかりの考える・泣き笑い。残りは、みお・カイ・2章の人たちの基本の1枚ができてから） |
| 低 | だいち・さき（今。笑顔1つずつ）、教室（放課後） | ― | ― | なければ声だけ・色の加工で代わりにする |

### 共通部分

毎回、先頭に 3. の絵柄の共通部分を付ける（下の指示文には、もう付けてある所と、「頭」だけ書いた所がある）。

**立ち絵の頭**（人ごとの文の前に付ける。`<表情>` は人ごとに替える）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, <表情>.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the girl in the cardigan.
Pose: both arms relaxed down at the sides, hands outside the frame. No props.
Background: plain pure white, no shadow, no gradient.
```

**背景の頭**

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Background art for a visual novel dialogue scene. Vertical 9:16 image. No people.
```

（背景の文の最後に、毎回 `Keep the lower third of the image simple, because a dialogue box will cover it. Absolutely no letters or text anywhere: signs, posters and labels are blank or have simple patterns only.` を付ける）

**1枚絵の頭**

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

A single key visual (event CG). Vertical 9:16 image.
```

（1枚絵の文の最後に、毎回 `Keep the lower quarter of the image simple, because a text box may cover it. Absolutely no letters or text anywhere.` を付ける）

**地図の頭**（7. の縁日の地図と同じ決まり。見えないマス目 24×43 を重ねる）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Top-down map illustration for a mobile RPG exploration scene. Vertical 9:16 image. A nearly overhead view with only a slight tilt, flat projection without strong perspective, so a square grid can be laid over it. No people and no characters.
```

（地図の文の最後に、毎回 `Walkable areas must be clearly distinguishable from non-walkable objects. Paths are wide, at least one eighth of the image width. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.` を付ける）

**部屋の地図の頭**（段階47。区画を部屋に分けて作る時。地図の頭の「Vertical 9:16 image」を、部屋の形に合わせて替え、出入口を言葉で書く）

- 正方形の部屋（24×24マス）：`Square 1:1 image (1024×1024).` 縦長の部屋（24×43マス）：今の地図と同じ `Vertical image (1024×1536).`
- 出入口は辺の真ん中だけ、幅は絵の6分の1（4マス）。使う辺ごとに `An opening at the center of the <top/bottom/left/right> edge, one sixth of the image <width/height> wide, leading out of the image.`、使わない辺は `All other edges are closed by walls, buildings, fences or trees.` と書く
- 配置の下絵を付ける：文字の地図から `node scripts/room_sketch.mjs <部屋の id か、文字の地図のファイル> <出力.png>` で作る（通れる所は明るい色、通れない所は暗い色、出入口は青）。`Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings.` を足す。絵と歩ける場所がずれにくくなる

**敵の絵の共通部分（たたき台）**（`<姿>` と `<時代の色>` を敵ごとに替える。白い背景で作り、`scripts/cutout.py` で抜く）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (<時代の色>). Eerie but not gory, readable as a small silhouette on a phone screen.
Body: <姿>
```

時代の色（2. の色の決まり）：昭和 `sepia, faded green and orange`／平成 `bright pastel and light blue`。ボスは `Body:` の前に `A large boss monster, filling most of the image.` を足す。

2026-10-13 に足したこと：
- ブリキノイズを見本に添付し、`front three-quarter view, ... no ground.` の後に `Match the art style of the attached enemy art exactly.` を足す（絵柄をそろえる）
- 2-1 から、`Body:` の前（ボスは `A large boss monster...` の前）に `Use a few large, clearly recognizable objects rather than many small ones, so each object's shape reads clearly at a glance.` を足す（ラムネノイズで、小さな物がたくさん並んで、物の形が見えなかったため）。物の形は、`Body:` に形の特徴まで書く（ラムネの瓶なら、首のくぼみとビー玉）
- 白い背景の抜き方：砂とノイズでできた敵は、`scripts/cutout.py`（rembg）だと体の大部分が消える。`scripts/cutout_white.py`（広い白だけを抜き、小さな白い光りは残す）で抜く。人の形の絵（カイの戦闘の絵）は、今までどおり `scripts/cutout.py` で抜く

### 1. みお（設定画 → 胸から上の基本の1枚）

**みおの見た目（決まった。2026-10-11）**：下の設定画の指示文で、1回で決まった（子どものあかりの立ち絵を添付）。明るい茶色のくせのあるショートに、右の上で小さく結んだ一房（橙の髪ゴム）、大きな茶色の目、八重歯の見える大きな笑顔。黄色の無地のTシャツ、白い線の入った紺の半ズボン、右手首に白と橙のリストバンド、左ひざに絆創膏、白い靴下、すり切れた赤いスニーカー。武器は光るトランプの扇と、クレヨンで描いたピエロのジョーカー。設定画はリポジトリに入れていない（ノアと同じ。開発者が持っている。胸から上の基本の1枚を作る時に添付する）

**設定画**（子どものあかりの立ち絵を添付）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Character design sheet of an original anime-style girl for a mobile turn-based JRPG, full body front view, standing in a lively, confident pose, plain off-white background, clean lineart with soft cel shading, childlike proportions about 5 heads tall. Same art style as the attached reference portrait.
Character: Mio, a petite, energetic 10-year-old Japanese girl (4th grade of elementary school) from a shopping street in a quiet regional town. The neighborhood's cheerful "helper" who joins the little league team, the town festival and everything else. Sporty, loud, always running, loves giving names to everything. A wide confident grin, but a hint of something she cannot remember behind her bright eyes.
Hair: bright light-brown short hair, slightly messy from running, with one tiny side tuft tied up by a small orange hair tie.
Eyes: big, lively warm brown eyes.
Face: round cheeks, a slightly sunburnt nose.
Outfit: a plain sunny-yellow T-shirt with no logo or text, navy shorts, a white-and-orange sports wristband on her right wrist, white ankle socks and worn-out red sneakers, a small adhesive bandage on one knee.
Weapon: a deck of ordinary playing cards that has turned into glowing magic cards; she holds a fan of cards in one hand, the cards glowing with soft warm light and leaving thin light trails. Among them, one hand-drawn joker card drawn by a child with crayons (a smiling clown face, no letters).
Color palette: hair #B07A4A, T-shirt #F2C94C, shorts #2B3552, wristband orange #E07A4F, sneakers #D9483B, skin #F3D2B8, card light #FFE3A0.
Additional views on the same sheet: back view, 4 facial expressions (big grin, frustrated pout, surprised, serious), close-up of the hand-drawn joker card.
Absolutely no letters, numbers or text anywhere, including on the cards (use simple suit marks only).
```

**胸から上の基本の1枚**（決めた設定画と、子どものあかりの立ち絵を添付。立ち絵の高さは 360）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Chest-up character portrait for visual-novel style dialogue scenes. Vertical 2:3 image. Front view, facing the viewer, a wide, confident grin.
Framing: from just above the top of the head down to mid-chest. The head sits in the upper third of the image. Use exactly the same framing, size and camera distance as the attached reference portrait of the little girl in the yukata, with the same childlike proportions.
Pose: both arms relaxed down at the sides, hands outside the frame. No props, no cards.
Background: plain pure white, no shadow, no gradient.
Character: Mio. Keep her design exactly as in the attached character sheet: bright light-brown short hair with one tiny side tuft tied by a small orange hair tie, big lively brown eyes, round cheeks, a slightly sunburnt nose, a plain sunny-yellow T-shirt with no logo.
```

### 2. カイ（設定画 → 胸から上の基本の1枚）

**カイの見た目（決まった。2026-10-11）**：下の設定画の指示文で作り、髪と目だけを「設定画の髪と目の直し」で変えた（ノアの設定画を添付）。灰色がかった金髪を横に流したオールバック、前髪が少し垂れる。細く鋭い鋼色の灰色の目、薄笑い。白い詰め襟のロングコート（青緑の細い線）を前を開けて袖をまくる、黒いハイネック、砂時計の形のバックルの黒いベルト、黒いズボン、白いブーツ。武器「フレーム」は銀の四角い枠で、内側に青緑の光の線、枠の中の景色が灰色に止まる。設定画はリポジトリに入れていない（開発者が持っている。直した後の絵を、胸から上の基本の1枚と戦闘の絵に添付する）

髪と目は、ハルトから遠ざける（2026-10-11 に変えた）。はじめは「黒髪に青緑の一筋」をハルトの砂色の一筋と対にして、同じアーカイバーだった伏線にしていた。しかし設定画を作ると、髪型までハルトに似て、2章でハルトの正体に気づかれそうだった（開発者の判断）。そこで、灰色がかった金髪のオールバックと、鋼色の灰色の目に変えた（淡い金の目も、ハルトの琥珀の目と近かった）。同じ組織にいたことは、ノアと同じ白いコートと砂時計の留め具で伝える。最初の設定画（黒髪）のコート・武器・ポーズはそのまま使い、髪と目だけ直す

**設定画**（ノアの設定画を添付）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Character design sheet of an original anime-style rival character for a mobile turn-based JRPG, full body front view, standing in an arrogant, relaxed pose with his weight on one leg, plain off-white background, clean lineart with soft cel shading, about 7 heads tall. Same art style as the attached reference sheet.
Character: Kai, a young man around 20 from a cold, white future. A top-ranked time agent ("archiver") who steals people's happy memories, called the best archiver after a certain genius disappeared. Proud, sarcastic and cold, looks down on everyone; underneath, a rival who has been chasing someone he could never surpass.
Hair: ash-blond (a cool, dull champagne blond, NOT silver, NOT white, NOT black), neatly swept back from the forehead with one or two thin loose strands falling over the forehead, the sides cut short, slightly longer and smooth at the back. No colored streaks or highlights. A neat, cold, elite look.
Eyes: sharp, narrow, cold steel-gray eyes, a confident smirk.
Outfit: the same organization's uniform as the silver-haired girl in the attached sheet: a clean white long coat with a high collar and thin blue-green lines along the seams, but worn open and a little carelessly, sleeves slightly pushed up; a black high-neck inner top; slim black trousers; white boots; the same small hourglass-shaped clasp, worn on his belt instead of the collar.
Weapon: "Frame", a hollow square frame-shaped blade about the size of a large picture frame, its four edges are thin, razor-sharp white metal with blue-green light lines, like a camera viewfinder turned into a weapon. He holds it by one corner; the space inside the frame looks slightly frozen and drained of color.
Color palette: ash-blond hair #CDBF9E with shadows #9E9278, steel-gray eyes #8A939C, white coat #F4F7F8, accent lines #4CC2B8, black inner #15181F, skin #F1D9C8.
Additional views on the same sheet: back view, 4 facial expressions (smug smirk, looking down on someone, neutral, serious), close-up of the Frame blade.
Absolutely no letters or text anywhere.
```

**設定画の髪と目の直し**（2026-10-11。黒髪で作った最初の設定画を添付して、同じチャットで送る。うまく変わらなければ、上の設定画の指示文を新しいチャットで送る）

```
Edit the attached character sheet. Keep everything exactly the same: the white high-collared long coat with thin blue-green lines worn open, the rolled-up sleeves, the black high-neck inner top, the belt with the hourglass-shaped buckle, the black trousers, the white boots, the square frame-shaped blade "Frame", all the poses, the layout of the sheet and the art style.
Change ONLY his hair and eyes, on every view and every face on the sheet:
- Hair: ash-blond (a cool, dull champagne blond, NOT silver, NOT white, NOT black), neatly swept back from the forehead with one or two thin loose strands falling over the forehead, the sides cut short, slightly longer and smooth at the back. No colored streaks or highlights at all. A neat, cold, elite look, the opposite of messy hair.
- Eyes: sharp, narrow, cold steel-gray eyes (no gold, no amber).
Keep his arrogant, confident smirk and the same face shape. Color palette: hair #CDBF9E with shadows #9E9278, eyes #8A939C. Absolutely no letters or text anywhere.
```

**胸から上の基本の1枚**（決めた設定画と、あかりの笑顔の立ち絵を添付）

立ち絵の頭（`<表情>` は `a confident, condescending smirk`）の後に：

```
Character: Kai. Keep his design exactly as in the attached character sheet: swept-back ash-blond hair with one or two loose strands over the forehead, sharp narrow steel-gray eyes, white high-collared long coat with thin blue-green lines worn open over a black high-neck inner top. No weapon, no glowing light effects in this portrait.
```

**戦闘の絵**（決めた設定画を添付。敵の絵の共通部分は使わず、これだけで作る）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. Full body, centered, plain pure white background, no shadow, no ground.
Kai, keep his design exactly as in the attached character sheet, in a fighting stance: holding the square frame-shaped blade "Frame" up in front of him like a camera viewfinder, looking at the viewer through it with a cold smirk, his open white coat flaring. Thin blue-green light lines run along the blade.
```

### 3. 1枚絵：切り取られるグラウンド（2-3。2章の山場）

ハルト・あかり・みお・カイの立ち絵を添付。1枚絵の頭の後に：

```
A late 1990s Japanese riverside little league baseball field on a bright summer afternoon, pastel sky. A glowing rectangular frame of white light slices across the whole scene like a camera viewfinder; inside the frame the field, players and cheering parents are frozen and drained of color, as if being cut out like a photograph. On top of the backstop stands Kai, a young man in an open white long coat with thin blue-green lines (keep his design as in the attached portrait), holding a square frame-shaped blade, a tiny hourglass forming in his other hand with the frozen field inside it. In the foreground, a high school boy and a high school girl and a small 10-year-old girl (keep their designs exactly as in the attached reference portraits) reach out too late. Grains of golden sand scatter.
```

### 4. 2-1 の人たち（立ち絵）

いさむ（今。75歳）：立ち絵の頭（`<表情>` は `a calm, taciturn expression with gentle eyes behind his glasses`）の後に

```
Character: Isamu, a Japanese gear craftsman around 75 years old, Mio's grandfather, who runs a tiny old machine workshop in a quiet regional town. Small and wiry, short white hair, thin round glasses, deep wrinkles, a stubborn mouth but gentle eyes. An old brown cardigan over a faded factory work jacket. A man of few words.
```

写しのいさむ（昭和44年。18歳）：いさむとみおの立ち絵も添付。立ち絵の頭（`<表情>` は `a serious, determined face, cheeks red from the cold`）の後に

```
Character: young Isamu, the same man as the attached elderly portrait but 57 years earlier: an 18-year-old apprentice at a small machine workshop in the winter of 1969. Keep the same face features so he is clearly the same person, with lively eyes that look like the attached little girl's (his granddaughter). Very short buzz-cut black hair, cheeks red from the cold, an oil-stained gray work jacket.
```

写しの源三（親方。昭和44年。50代）：立ち絵の頭（`<表情>` は `a stern, intimidating face with thick brows`）の後に

```
Character: Genzo, the stern master of a small Japanese machine workshop in the winter of 1969, in his 50s. Thick eyebrows, a weathered face, a white hand towel tied around his head, a heavy dark navy work jacket. Intimidating, but you can trust him with your life.
```

### 5. 2-1 の背景

昭和44年の町工場の中（2-1-8。6-A は同じ絵を古びた今の色に加工して使い回す）：背景の頭の後に

```
Inside a small Japanese machine workshop on a winter night in 1969, sepia tones. A single bare light bulb hangs over a worn wooden workbench with files, calipers and a few tiny brass gears. Old lathes and drilling machines driven by long leather belts from a ceiling shaft stand in the shadows; metal shavings on the concrete floor; a small kerosene stove glowing orange; snow visible through a frosted window. Humble, hardworking, quiet.
Eye-level camera, the workbench and the bare bulb in the center.
```

昭和44年の雪の町工場の路地（2-1 の会話）：背景の頭の後に

```
A narrow alley in a small factory district of a Japanese town at snowy winter dusk in 1969, sepia tones with soft white snow. Small wooden machine workshops with sliding doors and warm lit windows on both sides, utility poles and sagging wires, a public bathhouse chimney with steam in the distance, snow piled at the edges of the alley.
Eye-level camera, the alley running straight into the distance.
```

### 6. 地図：2-1 の雪の町工場の路地

地図の頭の後に（場所は脚本の区画の並び：入口 → 銭湯の前の長いす → 工場の門 → 工場の中の旋盤）

```
Scene: a small factory district of a Japanese town at snowy winter dusk in 1969, sepia-tinted retro colors with white snow.
Layout from bottom to top:
- Bottom center: the entrance of a narrow alley.
- Narrow alleys winding upward between small wooden machine workshops with sliding doors and warm lit windows, with one or two short side alleys.
- Around the middle: a public bathhouse with steam rising and a long wooden bench in front of it, a small open space.
- Upper part: a small factory gate.
- Top: the inside of a small workshop seen from above with its roof removed, with a large old lathe in an open space in front of it.
- Utility poles, snow piles, barrels and stacked wood along the edges.
```

#### 6-2. 2-1 の手直しと寄り道の部屋（段階47。2026-10-15、開発者が手直しすると決めた）

今の 2-1 の地図は辺の真ん中に開いた所がないので、銭湯の前の広場の左右（行 19〜22。絵の高さの真ん中、幅は絵の6分の1）を開け、そこへ正方形の寄り道の部屋を2つつなぐ。下絵は `docs/sketches/`（`scripts/room_sketch.mjs` で作った）。

| 絵 | ChatGPT に付ける絵 | 台帳の id（届いたら） |
| --- | --- | --- |
| 2-1 の地図の手直し（左右の辺を開ける） | 今の地図 `public/assets/maps/factory_alley.webp` と、開ける所を青く塗った `docs/sketches/factory_alley_openings.jpg` | `map.factory_alley`（差し替え） |
| 寄り道1「雪の資材置き場」（左の辺の先。出入口は右の辺） | `docs/sketches/room_factory_yard.png`、今の 2-1 の地図（絵柄の見本） | `map.factory_yard` |
| 寄り道2「銭湯の裏の路地」（右の辺の先。出入口は左の辺） | `docs/sketches/room_bath_alley.png`、今の 2-1 の地図（絵柄の見本） | `map.bath_alley` |

2-1 の地図の手直し（今の地図を付けて、編集として頼む。地図の頭は付けない）

```
Edit the attached map illustration. Keep everything exactly the same (style, colors, buildings, layout, size 768x1376), except for the two areas painted blue in the second attached image.
In each blue area, replace the buildings with snowy ground so that a path opens from the open space in front of the bathhouse straight out to the left edge and to the right edge of the image. Each path is as wide as the blue area (one sixth of the image height) and leads out of the image. Line the new paths with low snow piles, a few barrels or a fence, so they look natural.
Absolutely no letters or text anywhere.
```

寄り道1「雪の資材置き場」：地図の頭の後に（`Vertical 9:16 image.` を `Square 1:1 image (1024x1024).` に替える）

```
Scene: a snowy materials yard behind a small machine workshop in a Japanese town at winter dusk in 1969, sepia-tinted retro colors with white snow, the same art style as the attached map.
An opening at the center of the right edge, one sixth of the image height wide, leading out of the image. All other edges are closed by wooden fences, sheds and snowy trees.
Inside: stacks of steel bars and pipes under snow, oil drums, a small shed, piles of wood crates, footprints in the snow. A small dead-end corner at the top left.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the opening.
Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs are blank.
```

寄り道2「銭湯の裏の路地」：地図の頭の後に（同じく正方形に替える）

```
Scene: a narrow winding back alley behind a public bathhouse in a Japanese town at winter dusk in 1969, sepia-tinted retro colors with white snow, the same art style as the attached map.
An opening at the center of the left edge, one sixth of the image height wide, leading out of the image. All other edges are closed by wooden walls, the bathhouse back wall and snowy trees.
Inside: a narrow path winding up, right and down between wooden walls, the bathhouse boiler with a tall chimney and rising steam, stacked firewood, buckets, a dead end at the bottom right.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the opening.
Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs are blank.
```

（届いたら：今の 2-1 の文字の地図の左右を開け、寄り道の部屋2つを `src/data/rooms.ts` に足して 2-1 の区画につなぐ。寄り道1には逃げる敵と宝箱、寄り道2には追ってくる敵と宝箱を置き、今の 2-1 の宝箱2つの一方を寄り道へ移す。勝率を測り直す）

#### 6-3. 2-2 の文化祭の高校の部屋（段階39b。2026-10-15）

2-2 は、10. の縦長の地図1枚の代わりに、部屋6つ（正方形5つ・縦長1つ）で作る。並びは 校門 → 中庭（左に寄り道の駐輪場）→ 渡り廊下と音楽室の前（右に寄り道のお化け屋敷の教室）→ 体育館。下絵は `docs/sketches/room_school_*.png`（`node scripts/room_sketch.mjs <部屋の id> <出力.png>` で作った）。どの部屋も、地図の頭の後に書き、正方形の部屋は `Vertical 9:16 image.` を `Square 1:1 image (1024x1024).` に、縦長の部屋は `Vertical image (1024x1536).` に替える。下絵と一緒に、1枚目ができたら2枚目からは1枚目の絵も「絵柄の見本」として付ける（6部屋の色と絵柄をそろえる）。

| 部屋 | 形 | 出入口 | 下絵 | 台帳の id（届いたら） |
| --- | --- | --- | --- | --- |
| 校門の前庭 | 正方形 | 上 | `room_school_gate.png` | `map.school_gate` |
| 模擬店の中庭 | 縦長 | 下・上・左 | `room_school_courtyard.png` | `map.school_courtyard` |
| 駐輪場（寄り道） | 正方形 | 右 | `room_school_bikes.png` | `map.school_bikes` |
| 渡り廊下と音楽室の前 | 正方形 | 下・上・右 | `room_school_corridor.png` | `map.school_corridor` |
| お化け屋敷の教室（寄り道） | 正方形 | 左 | `room_school_classroom.png` | `map.school_classroom` |
| 体育館 | 正方形 | 下 | `room_school_gym.png` | `map.school_gym` |

どの部屋にも、場面の文の後に次の共通の2文を付ける（`<edges>` は部屋ごとの出入口の文）。

```
<edges> All other edges are closed by school buildings, walls, fences, hedges or trees.
Follow the attached layout sketch exactly: light areas are walkable ground, dark areas are buildings and obstacles, blue marks the openings. Walkable areas must be clearly distinguishable from non-walkable objects. Absolutely no letters or text anywhere: signs, banners and posters are blank or have simple patterns only.
```

出入口の文：`An opening at the center of the <top/bottom/left/right> edge, one sixth of the image <width/height> wide, leading out of the image.`（使う辺の数だけ並べる）

校門の前庭（出入口：上）

```
Scene: the front yard just inside the gate of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.
Bottom center: the school gate with a hand-made decorated festival arch of paper flowers and balloons (blank, no letters), the path entering from the bottom edge. A wide paved front yard with flower beds at the upper corners and two small flower beds in the middle, bicycles and a few festival guide boards (blank). A path leaves the yard straight up through the top edge toward the courtyard.
```

模擬店の中庭（出入口：下・上・左）

```
Scene: the school courtyard of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.
Rows of student food stalls with colorful tents and folding tables along both sides (four small tent blocks as in the sketch), paper lanterns and garlands strung overhead. In the middle, a big tree with a round bench around it, and a wooden bench just below-left of the tree. Paths lead out through the bottom edge (to the gate), the top edge (to the school building) and the left edge (to the bicycle parking).
```

駐輪場（寄り道。出入口：右）

```
Scene: the bicycle parking area behind a Japanese high school building on a bright autumn afternoon in 2006, bright pastel and light blue colors.
Four long rows of student bicycles in metal racks under a thin roof, with small gaps between them so you can weave through, as in the sketch. A wide path comes in from the right edge through the middle. Fallen ginkgo leaves, a vending machine against the wall, a dead-end corner at the top left.
```

渡り廊下と音楽室の前（出入口：下・上・右）

```
Scene: an open-air roofed walkway between school buildings of a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.
A wide walkway crosses the lower half from the bottom edge and turns right toward the right edge. On the upper left, a corridor runs in front of the music room with its windows and sliding door (a few music stands and instrument cases by the door). A straight path leads up through the top edge to the gymnasium. Posters on the walls are blank.
```

お化け屋敷の教室（寄り道。出入口：左）

```
Scene: a classroom turned into a haunted house attraction for a Japanese high school festival in 2006, seen from above with the ceiling removed, dim purple and light blue lighting with pastel accents.
Desks stacked and covered with black curtains form a winding maze (three long curtain walls as in the sketch), with paper ghosts, fake spider webs and a few glowing paper lanterns. The entrance comes in from the left edge. A dead-end corner at the top right.
```

体育館（出入口：下）

```
Scene: the inside of a Japanese high school gymnasium during its school festival in 2006, seen from above with the roof removed, bright pastel and light blue colors with warm stage lights.
At the top, a raised wooden stage with curtains pulled aside, a drum set, guitar amplifiers and speakers on it, cables on the floor. Below, a wide polished wooden floor with court lines and rows of folding chairs pushed to the sides, as in the sketch. The entrance comes in from the bottom edge.
```

（届いたら：台帳に `map.school_*` を書き、`src/data/rooms.ts` の 2-2 の部屋に `image` を足す。絵と歩ける場所がずれていたら、文字の地図を絵に合わせて直す）

#### 6-4. 2-3 の河川敷のグラウンドの部屋（段階40。2026-10-15）

2-3 も、10. の縦長の地図1枚の代わりに、部屋6つ（正方形5つ・縦長1つ）で作る。並びは 土手の道 → ベンチの裏の木陰（右に寄り道の川べり）→ 売店のテント（左に寄り道の用具小屋の裏）→ ダイヤモンド。下絵は `docs/sketches/room_riverside_*.png`。頼み方（地図の頭、正方形・縦長の替え方、共通の2文、出入口の文、1枚目を絵柄の見本に付ける）は 6-3 と同じ。色は `bright summer colors, clear blue sky and light blue accents, 1998`。

| 部屋 | 形 | 出入口 | 下絵 | 台帳の id（届いたら） |
| --- | --- | --- | --- | --- |
| 土手の道 | 正方形 | 上 | `room_riverside_levee.png` | `map.riverside_levee` |
| ベンチの裏の木陰 | 縦長 | 下・上・右 | `room_riverside_bench.png` | `map.riverside_bench` |
| 川べり（寄り道） | 正方形 | 左 | `room_riverside_bank.png` | `map.riverside_bank` |
| 売店のテント | 正方形 | 下・上・左 | `room_riverside_stand.png` | `map.riverside_stand` |
| 用具小屋の裏（寄り道） | 正方形 | 右 | `room_riverside_shed.png` | `map.riverside_shed` |
| ダイヤモンド | 正方形 | 下 | `room_riverside_diamond.png` | `map.riverside_diamond` |

土手の道（出入口：上）

```
Scene: the bottom of a grassy river embankment next to a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
A wide dirt path runs along the foot of the embankment from the lower left to the right, then a gentle slope path climbs up along the right side and turns left to leave through the top edge. Tall summer grass and a few parked bicycles on the embankment, a small grassy hollow on the left with a wooden bench.
```

ベンチの裏の木陰（出入口：下・上・右）

```
Scene: the area behind the team bench of a riverside little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
In the lower part, a long wooden team bench with a small roof (as in the sketch). In the middle, a big shady tree with dappled shadows and a cooler box under it. Paths lead out through the bottom edge (to the embankment), the top edge (to the concession tent) and the right edge (to the riverbank). Cicada-filled summer mood.
```

川べり（寄り道。出入口：左）

```
Scene: a quiet riverbank next to a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
The river runs along the whole right side (not walkable, sparkling water). A sandy and grassy bank with three clumps of tall reeds and summer grass (as in the sketch), a few stray baseballs in the grass, an old bucket. The entrance comes in from the left edge.
```

売店のテント（出入口：下・上・左）

```
Scene: a small white concession tent beside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
The tent with folding tables, a tub of ice water with floating ramune bottles (blank labels), shade umbrellas. An open dirt area in front of the tent. Paths lead out through the bottom edge, the top edge (toward the diamond) and the left edge (toward the equipment shed).
```

用具小屋の裏（寄り道。出入口：右）

```
Scene: the back of a small wooden equipment shed beside a little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
Narrow passages divided by a long practice net and stacks of bat boxes and base bags (two long dividers as in the sketch), a roller for the field, buckets of balls. The entrance comes in from the right edge. A dead-end corner at the top left.
```

ダイヤモンド（出入口：下）

```
Scene: the infield of a little league baseball field by a river in a Japanese town on a bright summer afternoon in 1998, seen from above, bright summer colors.
At the top, home plate in front of a tall backstop net, with the ends of the net at the upper corners (as in the sketch). Below, the dirt infield with bases and white chalk lines, the pitcher's mound. A wooden scoreboard (blank panels, no numbers) is visible beyond the backstop. The entrance comes in from the bottom edge.
```

（届いたら：台帳に `map.riverside_*` を書き、`src/data/rooms.ts` の 2-3 の部屋に `image` を足す）

### 7. 1枚絵：親方の背中（2-1-8）

写しのいさむと写しの源三の立ち絵を添付。1枚絵の頭の後に

```
Inside a small Japanese machine workshop on a snowy winter night in 1969, sepia tones with warm light from a single bare bulb. On the workbench, a tiny brass clock gear glints. An old master craftsman with a white towel around his head walks away toward the back of the workshop, his broad back to the viewer, his ears slightly red. In the foreground, an 18-year-old apprentice in an oil-stained work jacket bows deeply, his face hidden, tears falling (keep their designs as in the attached portraits). Lathes and belts in the shadows, snow visible through the window.
```

### 8. 2-2・2-3 の人たち（立ち絵）

こうじ（今。40歳。パン屋）：立ち絵の頭（`<表情>` は `a kind, slightly self-deprecating smile`）の後に

```
Character: Koji, a 40-year-old Japanese bakery owner on a shopping street in a quiet regional town. A gentle, good-natured face, slightly tired eyes, short neat black hair, a white baker's coat and a white baker's cap. Friendly to everyone, but always puts himself down.
```

けんた（今。37歳。楽器店）：立ち絵の頭（`<表情>` は `a relaxed, easygoing grin`）の後に

```
Character: Kenta, a 37-year-old Japanese man who runs a small musical instrument shop on a shopping street. Slightly messy medium-length dark-brown hair, light stubble, a casual dark T-shirt under a canvas shop apron. A laid-back, chatty former high school band frontman who gave up music long ago.
```

写しのけんた（平成18年。17歳）：けんたの立ち絵も添付。立ち絵の頭（`<表情>` は `a bright, cocky grin full of energy`）の後に

```
Character: young Kenta, the same man as the attached adult portrait but 20 years earlier: a 17-year-old Japanese high school boy at his school festival in autumn 2006, the singer and guitarist of a three-piece band. Keep the same face features so he is clearly the same person. Spiky dark-brown hair, a black gakuran school uniform worn open over a white T-shirt.
```

写しのこうじ（平成10年。12歳）：こうじの立ち絵も添付。立ち絵の頭（`<表情>` は `a nervous, unsure face, biting his lip`）の後に

```
Character: young Koji, the same man as the attached adult portrait but 28 years earlier: a 12-year-old boy on a little league baseball team in the summer of 1998, always on the bench. Keep the same face features so he is clearly the same person. Short black hair, a slightly dirty white baseball uniform with navy trim that is a little too big for him, a baseball cap. No letters or numbers on the uniform or cap.
```

写しのまさる（平成10年。40代。こうじの父）：こうじの立ち絵も添付。立ち絵の頭（`<表情>` は `a big, warm, proud smile`）の後に

```
Character: Masaru, Koji's father, a Japanese man in his 40s in the summer of 1998, a cheerful working dad watching his son's little league game. A face that resembles the attached portrait (his son as an adult), sun-tanned skin, short black hair, a faded polo shirt with a towel around his neck. No letters or logos.
```

### 9. 2-2・2-3 と日常の背景

パン屋の店内（7-A、8-B）：背景の頭の後に

```
Inside a small, warm family bakery on a shopping street in a quiet Japanese regional town, late afternoon. Wooden shelves and baskets of freshly baked bread, a glass display case, a small counter with an old cash register, an oven glowing in the back kitchen visible through a doorway, warm orange light through the front window.
Eye-level camera, looking from the entrance toward the counter.
```

楽器店の店内（6-A、7-A。夜は色の加工）：背景の頭の後に

```
Inside a small, slightly cluttered musical instrument shop on a shopping street in a quiet Japanese regional town, at dusk. Electric and acoustic guitars hanging on the wall, a few amplifiers, a drum kit in the corner, racks of sheet music books with blank covers, a worn counter with guitar strings and picks. Warm light, a little dusty and nostalgic.
Eye-level camera, the guitar wall in the center.
```

体育館のステージ（2-2 の会話。平成18年の文化祭）：背景の頭の後に

```
A Japanese high school gymnasium decorated for the school festival on a bright autumn afternoon in 2006, bright pastel and light blue tones. A stage with curtains pulled open, amplifiers, a drum kit and microphone stands set up for a band, paper flower decorations and blank banners, rows of folding chairs on the gym floor, sunlight through the high windows.
Eye-level camera from the middle of the gym, the stage in the center.
```

河川敷のグラウンド（2-3 の会話。平成10年の夏。今の場面は色の加工で使い回す）：背景の頭の後に

```
A riverside little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer sky and light blue tones. A dirt diamond, a tall backstop net, a simple wooden scoreboard with blank panels, a grassy embankment where families sit, a small white concession tent, the river and an iron bridge in the distance, cumulonimbus clouds.
Eye-level camera from behind home plate, looking toward the outfield.
```

### 10. 地図：2-2 の文化祭の高校、2-3 の河川敷のグラウンド

（2-2 は段階39b、2-3 は段階40 で部屋6つに分けた。下の文ではなく 6-3・6-4 で頼む）

2-2（入口の校門のアーチ → 模擬店の中庭 → 音楽室の前の廊下 → 体育館のステージ）：地図の頭の後に

```
Scene: a Japanese high school during its school festival on a bright autumn afternoon in 2006, bright pastel and light blue colors.
Layout from bottom to top:
- Bottom center: the school gate with a decorated festival arch (blank, no letters).
- A wide path leading up into a courtyard lined with festival stalls with tents and tables.
- Around the middle: the courtyard with a few benches and a tree in the center.
- Upper part: a long open-air corridor along a school building, with the music room at one side.
- Top: the entrance of the gymnasium with its stage area visible inside (roof removed).
- Flower beds, bicycles in racks, and fences along the edges.
```

2-3（土手の入口 → ベンチの裏の木陰 → 売店のテント → ホームベース）：地図の頭の後に

```
Scene: a riverside little league baseball field in a Japanese town on a bright summer afternoon in 1998, bright summer colors.
Layout from bottom to top:
- Bottom center: a path coming down the grassy embankment from the levee road.
- A dirt path along the embankment, with a team bench and a big shady tree behind it.
- Around the middle: a small white concession tent with a few folding tables.
- Top: the baseball diamond with home plate and a tall backstop net, an open dirt space in front of home plate.
- The river along one side, tall summer grass, a few bicycles parked on the embankment.
```

### 11. 1枚絵：代打の一打（2-3）、弦が切れても歌うステージ（2-2）

代打の一打（写しのこうじと写しのまさるの立ち絵を添付）：1枚絵の頭の後に

```
A riverside little league baseball field on a bright summer afternoon in 1998, bright pastel summer colors. The last inning, two outs. A 12-year-old pinch hitter in a slightly oversized white uniform swings the bat with all his strength, his arms trembling, his eyes shut tight, the ball just leaving the bat. Behind the backstop, his father in a polo shirt with a towel around his neck jumps up from the bench, shouting with joy (keep their designs as in the attached portraits). Teammates leaning out of the dugout, cumulonimbus clouds, sparkling light. No letters or numbers on uniforms or the scoreboard.
```

弦が切れても歌うステージ（写しのけんたの立ち絵を添付）：1枚絵の頭の後に

```
A packed Japanese high school gymnasium during the school festival in autumn 2006. On the stage, a 17-year-old boy in an open black gakuran (keep his design as in the attached portrait) keeps singing into the microphone with his eyes closed, holding his electric guitar with one broken string curling loose. Behind him a girl on bass and a boy on drums smile and keep the rhythm. The audience claps along with raised hands, colorful stage lights and dust sparkling in the beams.
```

### 12. 1-2 の残り

昭和の商店街（1-2 の会話。夕焼け）：背景の頭の後に

```
A small covered shopping arcade street in a Japanese regional town in the summer of 1988, at sunset. Old storefronts line both sides: a greengrocer with wooden fruit crates, a tiny candy shop (dagashi-ya) with a wooden bench in front, an electronics shop with old CRT televisions in the window, a tobacco stand with a red public telephone, and a small clock shop with a warmly lit window. Faded cloth awnings; at the far end the arcade opens onto a gentle downhill slope glowing in golden evening light. Warm, slightly faded sepia-like colors, like an old photograph.
Eye-level camera, the street centered.
```

時計屋の店内（昼。3-B、4-A）：店内の絵（`bg.clock_shop`）を添付。背景の頭の後に

```
The same old watch and clock shop as the attached image, but at noon on a bright summer day. Soft white daylight through the front glass door and windows, the wall clocks and the glass display counter in clear, natural colors, a calm and cozy everyday atmosphere instead of the dusk mood.
Eye-level camera, the same angle as the attached image.
```

川沿いの帰り道（4-A。あかり3）：背景の頭の後に

```
A quiet path along a small river in a Japanese regional town at summer dusk. A low concrete embankment with summer grass, a narrow paved path, an old iron railing, a small bridge in the distance, the river reflecting the orange and indigo sky, dragonflies.
Eye-level camera, the path leading into the distance.
```

地図：1-2 の昭和の商店街（入口 → 駄菓子屋の前 → 時計屋の前 → 出口の坂）：地図の頭の後に。**見本の絵は付けない**（2026-10-11。縁日の地図を見本に付けたら、店が屋台のように離れて建ち、間に広場ができて、本物の商店街に見えなかった。壁を接して並ぶ2階建ての店を言葉で指定し、アーケードの屋根は真上から通りが隠れるので外した）

```
Scene: a real, lived-in Japanese shotengai (local shopping street) in a regional town in the summer of 1988, at sunset, in warm sepia-tinted retro colors. It must look like an actual old town shopping street, NOT a festival with separate stalls.
Structure:
- Both sides of the street are continuous rows of old two-story wooden and mortar shop-houses built wall to wall with no gaps between them: the shop on the ground floor, the family's living quarters upstairs with small windows, laundry poles and air-conditioner units. Tiled and tin roofs seen from above.
- Each shop opens directly onto the street with its goods spilling out in front: wooden fruit crates, racks and display cases, cloth or metal awnings, half-open roll-up shutters.
- The street is open to the sky (no arcade roof covering it), lined with old suzuran-shaped street lamps and small blank decorative flags hung between them.
- Everyday clutter along the shop fronts: parked bicycles, potted plants, plastic beer crates, a vending machine, a red public phone, a round red mailbox, utility poles and sagging wires.
Layout from bottom to top:
- Bottom center: the entrance of the shopping street, a simple steel gateway arch with a blank sign board.
- One wide straight street running up the middle of the image.
- Two or three narrow back alleys between the buildings, branching left and right, with walls and drainpipes on both sides.
- Shops along the street: a greengrocer with fruit crates, a small candy shop (dagashi-ya) with a wooden bench in front, an electronics shop with old CRT TVs in the window, a tobacco stand with a red public phone, and a small clock shop with a warmly lit window.
- Top: the end of the shopping street, opening onto a gentle downhill slope toward the town.
Walkable areas (the street, the back alleys, the slope) must be clearly distinguishable from non-walkable objects (buildings, goods, bicycles, poles).
```

1枚絵：夕焼けの二人乗り（1-2-9。1章の山場）：写しのふみ・写しのきよしの立ち絵を添付。1枚絵の頭の後に

```
A small Japanese shopping arcade street in the summer of 1988 at sunset, in warm, slightly faded sepia-like colors, the street opening onto a gentle downhill slope bathed in golden evening light. A middle-aged man pedals an old black utility bicycle down the slope, turning his head slightly back with a shy, awkward smile; his wife sits sideways on the rear rack, holding onto his back, laughing with teary eyes (keep their designs as in the attached reference portraits). Shopkeepers wave from the storefronts behind them, welcoming her home. Long shadows, warm backlight.
```

### 13. 敵の `Body:` の文（敵の絵の共通部分に入れる）

| 区画 | 敵 | 時代の色 | `Body:` |
| --- | --- | --- | --- |
| 1-2 | ブリキノイズ | 昭和 | `a broken tin toy robot tangled with wind-up springs and keys, heavy and stiff` |
| 1-2 | 黒電話ノイズ | 昭和 | `an old black rotary telephone tangled in its own coiled cords like tentacles, the bell ringing nonstop` |
| 1-2 | ラムネノイズ | 昭和 | `a quick, jittery swarm of about 10 classic Japanese ramune (Codd-neck) bottles made of pale aqua-green glass, each with a pinched neck with two dents and a clear glass marble trapped in the neck chamber (no caps, no corks), marbles rattling, fizzy bubbles inside`（2026-10-13 に直した。はじめの文ではキャップ付きの今の瓶になり、ビー玉が目玉に見えた。作った絵は、はじめの文の絵を直しの指示で作り直した物） |
| 1-2 | めんこノイズ | 昭和 | `a whirling flock of old paper menko cards and spinning beigoma tops (blank cards, no letters)` |
| 1-2 | 自転車のぬし（ボス） | 昭和 | `a swirling tangle of several old bicycles, wheels and bells knotted together by noise, a faint shadow of a rear carrier seat at its center` |
| 2-1 | 歯車ノイズ | 昭和 | `a lump of gears and mainsprings grinding against each other without meshing, charging forward` |
| 2-1 | ネジノイズ | 昭和 | `a fast swarm of screws, nuts and bolts` |
| 2-1 | 真空管ノイズ | 昭和 | `an old vacuum-tube radio collapsing into noise, glowing tubes crackling with electricity` |
| 2-1 | そろばんノイズ | 昭和 | `a wooden abacus whose beads fly apart and float around it like a shield` |
| 2-1 | 旋盤のぬし（ボス） | 昭和 | `a vortex of an old lathe, leather belts and metal shavings, a tool post like a blade, a small glowing brass gear at its center` |
| 2-2 | ガラケーノイズ | 平成 | `a flock of old flip phones with antennas, screens flashing and ringing` |
| 2-2 | ラジカセノイズ | 平成 | `a boombox with cassette tapes unspooling around it like ribbons, speakers blasting` |
| 2-2 | メトロノームノイズ | 平成 | `a wooden metronome whose pendulum swings so fast it blurs` |
| 2-2 | 写真シールノイズ | 平成 | `a swarm of small photo stickers peeling off and fluttering, decorated with sparkles and hearts (no faces, no letters)` |
| 2-2 | アンプのぬし（ボス） | 平成 | `a tower of guitar amplifiers and speakers wrapped in tangled cables, one broken guitar string whipping around` |
| 2-3 | ボールノイズ | 平成 | `a fast swarm of baseballs with red stitches` |
| 2-3 | メガホンノイズ | 平成 | `a cluster of plastic cheering megaphones whose cheers have turned into angry roars` |
| 2-3 | 水筒ノイズ | 平成 | `a big sports water jug and ice water splashing around it` |
| 2-3 | 電子ペットノイズ | 平成 | `a small egg-shaped handheld digital pet toy with a tiny pixel creature on its screen (no logos)` |
| 2-3 | スコアボードのぬし（ボス） | 平成 | `a giant made of a wooden scoreboard, a backstop net and hundreds of megaphones, its score panels spinning endlessly (blank panels, no numbers)` |

### 14. 表情違い（Gemini）

基本の1枚を見本に渡し、次の頭の文の `<その人の見た目>` と `<表情>` を替えて送る（あかり・りくと同じ作り方）。1回に1つの表情。

```
Use this image as the base. Keep everything exactly the same: framing, pose, arms down with hands outside the frame, <その人の見た目>, and art style. Plain pure white background. Change only the facial expression. No props, no sweat drops, no tears unless stated, no text, no effects.
Expression: <表情>
```

`<その人の見た目>` の例：みお `bright light-brown short hair with one tiny side tuft tied by an orange hair tie, sunny-yellow T-shirt, childlike proportions`／カイ `swept-back ash-blond hair, steel-gray eyes, open white long coat with thin blue-green lines over a black high-neck inner`／ノア `silver short bob with a blue-green tint, blue-green eyes, white high-collared coat with blue-green lines, hourglass collar clasp`／ふみ `thin white hair in a low bun, deep wrinkles, beige knitted cardigan`

| 表情 | `<表情>` | 使う人（`docs/script/M2.md` の 5.・12.） |
| --- | --- | --- |
| 通常 | `relaxed and natural, mouth closed` | みお、カイ、ふみ、いさむ、写しのいさむ、写しのきよし、こうじ、写しのこうじ |
| 笑顔 | `a bright, warm smile with the mouth slightly open` | みお、ふみ、いさむ、こうじ、けんた、写しのけんた |
| 大笑い | `laughing happily with the mouth wide open, eyes closed` | みお、けんた |
| 驚き | `surprised, eyes wide open, mouth slightly open` | みお、ふみ、写しのふみ、写しのいさむ、こうじ、写しのけんた、写しのこうじ |
| むっ | `pouting, cheeks puffed, frowning a little` | みお |
| 真剣 | `serious and focused, mouth firmly closed, brows set, eyes steady and determined` | みお、カイ、写しのいさむ |
| 泣き笑い | `smiling through tears, eyes wet and slightly narrowed, a trembling smile` | みお、ふみ、写しのふみ、いさむ、写しのいさむ、けんた、写しのけんた、写しのこうじ、あかり |
| 照れ | `embarrassed, light blush on the cheeks, eyes looking aside, a small awkward smile` | みお、写しのふみ、写しのきよし、けんた |
| 考える | `thoughtful, eyes looking up and aside, mouth slightly pursed` | みお、ふみ、いさむ、こうじ、けんた、あかり |
| 心配 | `gently worried, eyebrows raised in a troubled way, mouth slightly open` | みお |
| 悔しい | `frustrated and regretful, biting the lip, brows drawn together, eyes glistening` | みお、ハルト |
| 困り笑い | `a troubled smile, eyebrows raised in a worried way, a small awkward smile` | みお |
| さみしげ | `quietly lonely, a faint sad smile, eyes looking down` | ふみ、いさむ、こうじ、けんた |
| 苦笑い | `a wry, strained smile, one corner of the mouth raised, eyebrows slightly troubled` | こうじ、けんた |
| 余裕 | `a relaxed, arrogant smirk, eyes half-lidded` | カイ |
| 見下す | `looking down on someone with cold, narrowed eyes, chin slightly raised, a faint sneer` | カイ |
| 悲しい | `sad and quiet, eyes looking down, mouth closed, brows slightly lowered` | ノア |
| 怒り | `angry, brows sharply drawn together, teeth clenched, eyes blazing` | ハルト |

（ハルト・あかりは 5-2 の頭の文を使う。表情の名前は台本の〔 〕と同じにする）

## 5-4. まばたき・口パクの差分（段階46b。2026-10-11）

会話の立ち絵の、目を閉じた所・口を開けた所だけの透明な絵（`public/assets/portraits/parts/`）。同じ構図で作った別の表情の絵から、`python3 scripts/portrait_parts.py` で切り抜いて作る（切り抜く範囲はスクリプトに書いてある）。新しい表情の絵を足した時に、目・口がほぼ同じ位置なら、`src/data/dialogue.ts` の `PORTRAIT_PARTS` の表情の一覧に足すだけで使える。

| 差分 | 元の絵 | 状態 |
| --- | --- | --- |
| あかりの閉じた目 | 大笑い | 済 |
| あかりの開いた口 | 心配 | 済 |
| ハルトの開いた口 | 驚き | 済 |
| りくの開いた口 | 表情ごとに、Gemini でその表情から口だけ開けた絵（`riku_talk_<表情>_src`。下の指示文） | 済（2026-10-11。はじめは「驚き」の口を全部の表情に重ねたが、顔の傾きが違う表情で口の線や鼻がずれたので、表情ごとに作り直した） |
| ハルトの閉じた目 | 目を閉じた絵（Gemini で作った `hero_blink_src`） | 済（2026-10-11。全部の表情に重ねる） |
| りくの閉じた目 | 目を閉じた絵（Gemini で作った `riku_blink_src`。笑った目になった） | 済（2026-10-11。眉が上がった絵なので、眉の形が違う真剣・あせり・悲しいには重ねない） |

**口だけ開けた絵**（Gemini。その表情の絵を見本として渡す。1つの口をどの表情にも重ねるとずれる人だけ、表情ごとに作る。できた絵を `<人>_talk_<表情>_src.webp` として portraits に入れ、`scripts/portrait_parts.py` に口の範囲を足して切り抜き、`PORTRAIT_PARTS` の `byFace` に足す。id が `_src` で終わる絵は、起動の時に読み込まない）

```
Use this image as the base. Keep everything exactly the same: framing, pose, head angle, hair, eyes, eyebrows, nose, face shape, clothes, and art style. Plain pure white background. Change ONLY the mouth: open it slightly as if in the middle of saying a word, a small natural talking mouth, keeping the same mood of the expression. Do not move or change the nose, the eyes or the eyebrows. No text, no effects.
```

**目を閉じた絵**（Gemini。その人の「通常」の絵を見本として渡す。できた絵を `<人>_blink_src.webp` として portraits に入れ、`scripts/portrait_parts.py` に目の範囲を足して切り抜く）

```
Use this image as the base. Keep everything exactly the same: framing, pose, hair, clothes, mouth, eyebrows, and art style. Plain pure white background. Change ONLY the eyes: both eyes gently closed, as in the middle of a natural blink, relaxed eyelids with eyelashes visible. Do not change the face shape, the eyebrows or the mouth. No text, no effects.
```

## 5-5. ChatGPT で作る絵の残り（2026-10-11 に整理）

5-2・5-3 で「まだ」の絵のうち、ChatGPT で作るものだけを集めた（Gemini の表情違いは 5-2 と 5-3 の 14.）。要る段階の早い順に並べた（段階37 は 1-2、38 はみおの加入、39 は 2-1・2-2、40 は 2-3 とカイ）。指示文は、5-3 にあるものはそちらを使う。5-3 になかった M1 の残りは、この節の下に足した。

### 人物像（まだ絵のない人）

見た目を決める元になる設定。台本（`docs/script/M1.md` の 5.、`docs/script/M2.md` の 5.・12.）と物語（`docs/STORY.md`）から集めた。名前の書き方は `docs/NAMING.md`（今を生きている人はひらがな、昭和のうちに亡くなった人は漢字）。

| 人 | 年齢・時代 | 立場 | 人柄 | 見た目 | 要る表情 |
| --- | --- | --- | --- | --- | --- |
| みお | 10歳（小学4年）・今 | 3人目の仲間（2章の 5-C で加入）。商店街の「助っ人」で、少年野球にも祭りにも顔を出す。武器は切り札のトランプ（呼び名は「ジョーカーズ」） | 元気で声が大きく、いつも走っている。何にでも名前をつける。2年前の夏、遊びに誘った友だちを事故で亡くしたが、その日の楽しかった時間は盗まれていて、事故のことしか覚えていない（本人は気づいていない。7章で回収）。1〜6章は明るい子として過ごす | 明るい茶色のショート、横に小さな結び（橙の髪ゴム）、大きな茶色の目、丸いほお、少し日焼けした鼻。黄色の無地のTシャツ、紺の半ズボン、右手首に白と橙のリストバンド、ひざに絆創膏、赤いスニーカー。立ち絵の高さは 360（子どもの3人と同じ） | 通常・笑顔・大笑い・驚き・むっ・真剣・泣き笑い・照れ・考える・心配・悔しい・困り笑い |
| カイ | 20歳くらい・未来 | 時間保管局のアーカイバー。ハルトが消えた後「一番のアーカイバー」と呼ばれる。2-3 で負け戦の相手になり、時間を持ち去る。後半は味方につく | 傲慢で皮肉屋、冷たく、人を見下す。その裏で、越えられなかった「消えた天才」（ハルト）をずっと追ってきたライバル。戦い方は「切り取る」（音はカメラのシャッター） | 灰色がかった金髪のオールバック（前髪を1〜2本垂らす、横は短い）、細く鋭い鋼色の灰色の目（ハルトに似せない。5-3 の 2.）。ノアと同じ白い詰め襟のロングコート（青緑の細い線）を前を開けてだらしなく着る、黒いハイネック、黒いズボン、白いブーツ、砂時計の留め具はベルトに。武器は四角い枠の形の刃「フレーム」 | 余裕・見下す・通常・真剣 |
| ゆうま | 21歳（大学生）・今 | 1-1 の持ち主。商店街のコンビニでバイトしている。妹のひなのとは2年ほど話していない | 気だるそうだが優しい。人なつっこく、高校生にも軽口をたたく。返された後、妹に電話する | 寝ぐせの残る黒い短髪、眠たげな目、ひげなし。コンビニの制服（縦じまの半袖シャツ、ロゴのないエプロン、字の読めない名札） | 通常（だるそう）・笑顔・考える・泣き笑い・苦笑い・驚き |
| 写しのゆうま | 小学4年・平成の終わりの縁日（十年ちょっと前） | 1-1 の写し。妹と金魚すくいに走る | 面倒見のいいお兄ちゃん。妹をせかすが、ちゃんと待つ | ゆうまの面影。短い黒髪、紺の無地の浴衣（ノイズの加工はゲームの側でかける） | 笑顔 |
| 写しのひなの | 小学1年・同じ縁日 | ゆうまの妹。金魚に「なつ」と「まつり」と名付ける | 甘えん坊で、兄のあとを追いかける | ゆうまに似た目、短い二つ結び、薄い桃色の浴衣（朝顔の柄。子どものあかりの「白地に赤い金魚」と重ならないように） | 笑顔・泣き |
| いさむ | 75歳・今 | 2-1 の持ち主。みおの祖父で、小さな町工場の歯車職人 | 口数が少なく頑固だが、目は優しい | 小柄でやせている、白髪の短髪、細い丸眼鏡、深いしわ。色あせた作業着の上に古い茶色のカーディガン | 通常・笑顔・考える・さみしげ・泣き笑い |
| 写しのいさむ | 18歳・昭和44年（1969年）の冬 | 町工場の見習い。親方の源三に「いい仕事だ」と言われる日 | ひたむきで不器用 | 坊主に近い短髪、寒さで赤いほお、油で汚れた灰色の作業着。みおに似た目 | 真剣・驚き・泣き笑い・通常 |
| 源三 | 50代・昭和44年 | 町工場の親方（昭和のうちに亡くなった） | こわもてで厳しいが、命を預けられる。照れると耳が赤くなる（照れの顔は背中で見せる） | 太い眉、日に焼けたしわの顔、頭に白い手ぬぐい、厚手の紺の作業着 | 通常 |
| こうじ | 40歳・今 | 2-3 の持ち主。商店街のパン屋の店主。息子はそうた（声だけ） | 人がよく、誰にでも親切だが、すぐ自分を下げる | 人のよさそうな顔、少し疲れた目、短く整えた黒髪、白いコックコートと帽子 | 通常・笑顔・さみしげ・考える・苦笑い・驚き |
| 写しのこうじ | 12歳・平成10年（1998年）の夏 | 少年野球のベンチの子。最終回に代打で出る | 気弱で自信がない | 短い黒髪、少し大きすぎる白いユニフォーム（紺の線。番号と文字なし）、野球帽 | 通常・驚き・泣き笑い |
| まさる | 40代・平成10年 | こうじの父。土手から試合を見ている | 陽気で、息子を信じている | 大人のこうじに似た顔、日焼け、短い黒髪、色あせたポロシャツに首のタオル | 笑顔 |
| けんた | 37歳・今 | 2-2 の持ち主。商店街の楽器店の店主。高校のバンド「ラストチャイム」のボーカルとギターだった | 気さくでおしゃべり。音楽はとうにやめた | 少しぼさぼさの中くらいの長さのこげ茶の髪、無精ひげ、黒っぽいTシャツに帆布のエプロン | 笑顔・苦笑い・考える・さみしげ・泣き笑い・照れ・大笑い |
| 写しのけんた | 17歳・平成18年（2006年）の秋の文化祭 | 3人組のバンドのボーカルとギター。弦が切れても歌い切る | 自信家で元気 | けんたの面影。つんつんのこげ茶の髪、前を開けた学ランに白いTシャツ | 笑顔・驚き・泣き笑い |
| ペトラ | 20代後半・未来 | 時間保管局の取引の窓口の係。レストピアの拠点の交換所の番人（段階52）。「ここまで来られるのはアーカイバーだけ」と思い込んで取引する | 規則どおりで淡々としているが、帳簿の数字が合うと少しうれしそう。口癖は「規則ですので」。現場の話は「現場の課へどうぞ」 | 眼鏡（細い銀縁）、きっちりまとめた紺に近い黒髪のひとつ結び、白いシャツに紺のベスト、黒い腕カバー、胸に砂時計の小さな局の徽章。カウンターの奥に立つ（腰から上） | 通常・笑顔・困り・驚き・真剣 |
| だいち・さき（低） | 37歳くらい・今 | けんたのバンドの仲間（だいちはドラム、さきはベース）。7-A だけ | だいちはおおらか、さきはしっかり者（案） | だいちは大柄で短髪、さきは肩までの髪に眼鏡（案）。なければ声だけにする | 笑顔（1つずつ） |

### 作る順番（ChatGPT の分だけ）

| 順 | 要る段階 | 絵 | 指示文 | 一緒に渡す見本の絵 |
| --- | --- | --- | --- | --- |
| 1 | 37 | 地図：1-2 の昭和の商店街（済。2026-10-11） | 5-3 の 12. | 昭和の商店街の背景（縁日の地図は付けない。屋台の並びに引っ張られたため） |
| 2 | 37 | 背景：昭和の商店街（夕焼け）（済。2026-10-11） | 5-3 の 12. | なし |
| 3 | 37 | 1枚絵：夕焼けの二人乗り（済。2026-10-11） | 5-3 の 12. | 写しのふみ（笑顔）・写しのきよし（通常） |
| 4 | 37 | 敵：ブリキノイズ（済。2026-10-11。最初の1体。敵の絵の共通部分を、これを戦闘画面に置いて決める） | 5-3 の共通部分と 13. | なし |
| 5 | 38 | みおの設定画（済。2026-10-11） → 胸から上の基本の1枚（済。2026-10-13） | 5-3 の 1. | 子どものあかり（笑顔） |
| 6 | 40 | カイの設定画（済。2026-10-11） → 胸から上の基本の1枚 → 戦闘の絵（済。2026-10-13） | 5-3 の 2. | ノアの設定画、あかり（笑顔） |
| 7 | 37 | 敵：1-2 の残り（黒電話・ラムネ・めんこ・自転車のぬし）（済。2026-10-13） | 5-3 の 13. | ブリキノイズ |
| 8 | 37 | 背景：時計屋の店内（昼）、川沿いの帰り道（済。2026-10-13） | 5-3 の 12. | 時計屋の店内（夕暮れ） |
| 9 | 39 | いさむ、写しのいさむ、写しの源三（済。2026-10-13） | 5-3 の 4. | あかり（笑顔）。写しのいさむは、いさむ・みおも |
| 10 | 39 | 背景：昭和44年の町工場の中、雪の町工場の路地／地図：2-1（済。2026-10-13） | 5-3 の 5.・6. | 1-1 の縁日の地図 |
| 11 | 39 | 1枚絵：親方の背中（済。2026-10-14） | 5-3 の 7. | 写しのいさむ・写しの源三 |
| 12 | 39 | けんた（済。2026-10-14）、写しのけんた／背景：体育館のステージ、楽器店の店内／地図：2-2 | 5-3 の 8.〜10. | あかり（笑顔）、けんた |
| 13 | 39 | 1枚絵：弦が切れても歌うステージ | 5-3 の 11. | 写しのけんた |
| 14 | 39 | 敵：2-1・2-2 の砂嵐8とボス2 | 5-3 の 13. | ブリキノイズ |
| 15 | 40 | こうじ、写しのこうじ、まさる／背景：河川敷のグラウンド、パン屋の店内／地図：2-3 | 5-3 の 8.〜10. | あかり（笑顔）、こうじ |
| 16 | 40 | 1枚絵：切り取られるグラウンド、代打の一打 | 5-3 の 3.・11. | ハルト・あかり・みお・カイ／写しのこうじ・まさる |
| 17 | 40 | 敵：2-3 の砂嵐4とボス／1-1 の砂嵐4とボス（今は仮の絵） | 5-3 の 13.、下の 1-1 の敵 | ブリキノイズ |
| 18 | ― | M1 の残り：ゆうま、写しのゆうま・ひなの | 下 | あかり（笑顔）。写しは、ゆうまと子どものあかり |
| 19 | ― | M1 の残り：背景（金魚すくいの屋台、射的の屋台、石段の上、高台、施設の台所、学校の屋上、コンビニの店内、白い街）／1枚絵（花火、金魚の写真） | 下 | 下の各項 |
| 低 | ― | だいち・さき、教室（放課後） | 上の人物像から作る | ― |

M1 の残り（18・19）は、今は絵なしや色の加工で通せているので後ろにした。早く見たい場面があれば前に出してよい。

1章で足りない絵は、Gemini の表情違いも含めて 5-6 に全部まとめた（2026-10-15）。18・19 の中身と、作る順番はそちらを見る。

### M1 の残りの指示文（2026-10-11 に足した。頭は 5-3 の共通部分）

**ゆうま**：立ち絵の頭（`<表情>` は `a tired, laid-back expression with sleepy half-lidded eyes, but kind`）の後に

```
Character: Yuma, a 21-year-old Japanese university student working part-time at a convenience store on a shopping street in a quiet regional town. Laid-back and a little sleepy-looking, but kind and friendly. Messy short black hair with a bit of bed head, sleepy eyes, clean-shaven. A generic convenience store uniform: a vertically striped short-sleeve shirt and a plain apron with no logo, a name tag with no readable text.
```

**写しのゆうま**：ゆうまの立ち絵も添付。立ち絵の頭（`<表情>` は `a bright, big-brotherly grin`）の後に

```
Character: young Yuma, the same person as the attached adult portrait but about 11 years earlier: a 10-year-old boy (4th grade) at a summer shrine festival. Keep the same face features so he is clearly the same person, with childlike proportions. Short black hair, a plain navy summer yukata.
```

**写しのひなの**：写しのゆうまの立ち絵も添付。立ち絵の頭（`<表情>` は `a big happy smile`）の後に

```
Character: young Hinano, the 7-year-old little sister of the attached boy, at a summer shrine festival. Eyes that resemble her brother's, round cheeks, childlike proportions. Short black hair in two small pigtails. A pale pink summer yukata with a morning glory pattern and a yellow obi sash (no goldfish pattern).
```

（子どもの立ち絵は、子どものあかりの絵を構図の見本にする。立ち絵の頭の `the girl in the cardigan` を `the little girl in the yukata, with the same childlike proportions` に替える）

**背景**：背景の頭の後に、下の文を1つ付け、最後に背景の締めの文を付ける。

- 金魚すくいの屋台（P-3。遊びの水面にも使う）
  ```
  Close-up of a goldfish-scooping stall at a small Japanese shrine festival at summer dusk. A wide shallow blue water tank full of small red and black goldfish, paper scoops (poi) and small bowls on the edge, a striped cloth awning above, paper lanterns glowing warm orange, the indigo dusk sky behind.
  Eye-level camera, slightly looking down at the water tank in the center.
  ```
- 射的の屋台（P-3）
  ```
  A shooting gallery stall (shateki) at a small Japanese shrine festival at summer dusk. Tiered red shelves lined with small prizes (a toy robot, a plush bear, a box of caramel, small dolls), cork-gun rifles resting on the front counter, a striped cloth awning, paper lanterns glowing warm orange, the indigo dusk sky behind.
  Eye-level camera from in front of the counter, the prize shelves in the center.
  ```
- 神社の石段の上（P-4。夕暮れから夜へ）
  ```
  The top of a long stone stairway of a small Japanese shrine in a regional town, at the end of a summer festival evening, the sky fading from amber to deep indigo with the first stars. Worn stone steps leading down toward the festival lights far below, a small red torii and stone lanterns at the top, quiet summer trees around.
  Eye-level camera from the top step, looking out over the town and the festival lights.
  ```
- 神社の裏の高台（P-5。夜）
  ```
  A small grassy hill behind a Japanese shrine on a summer night, an old wooden fence at the edge, a view over the dark rooftops of a quiet regional town under a deep indigo starry sky, the open sky above left empty for fireworks.
  Eye-level camera, looking out from the hilltop toward the sky.
  ```
- 施設の台所（1-A・1-D。朝と夕方は色の加工）
  ```
  The homely kitchen and dining room of a small children's home in a Japanese regional town, in the morning. A long wooden dining table with many mismatched chairs, an old fridge with children's drawings (no letters), a stove with a frying pan. On the windowsill, an old glass fish tank with one big orange goldfish. On a shelf, a few faded festival prizes: a small toy robot, a plush bear, a caramel box. Soft morning light through the window.
  Eye-level camera, the window with the fish tank slightly off center.
  ```
- 学校の屋上（1-D。夕方の少し前）
  ```
  The rooftop of a Japanese high school in a quiet regional town, in the late afternoon before sunset. A tall green chain-link fence along the edge, a concrete floor, a water tank and the stairwell door, the town and distant mountains below, a wide sky with soft orange clouds.
  Eye-level camera, looking toward the fence and the town.
  ```
- コンビニの店内（1-C・2-B）
  ```
  Inside a small generic convenience store in a Japanese regional town, after school. Bright fluorescent light, shelves of snacks and drinks with blank packages, a drink refrigerator along the back wall, an ice cream freezer chest, a checkout counter with a register at one side, orange evening light through the glass front. No brand logos.
  Eye-level camera from the entrance, the counter on one side.
  ```
- 白い街（1-A の夢。ぼんやりでよい。共通部分の夕暮れの色は外す）
  ```
  A dreamlike, hazy vision of a pure white futuristic city: smooth white towers and bridges with thin blue-green light lines, empty and silent, no people, soft overexposed light as if seen through fog, edges fading into white. Cold, lonely and beautiful, like a half-forgotten memory.
  Eye-level camera, a long empty white street leading into the distance.
  ```

**1枚絵**：1枚絵の頭の後に。

- 高台で花火を見る3人の後ろ姿（P-5。子どもの3人の立ち絵を添付）
  ```
  A small grassy hill behind a Japanese shrine on a summer night. Three 7-year-old children seen from behind, sitting side by side on the grass, looking up at big colorful fireworks blooming in the deep indigo sky over a quiet town (keep their designs exactly as in the attached portraits): a quiet boy with black hair and one sand-gold strand in a navy hoodie on the left, a girl with a chestnut bob and a red goldfish hair clip in a white yukata with red goldfish in the middle, a spiky-haired boy in a navy jinbei on the right pointing at the sky. Three small white fox masks pushed up on the backs of their heads. The light of the fireworks colors their backs. Nostalgic, a moment that should never end.
  ```
- 金魚の写真（1-D。あかりのスマホの古い写真。子どものあかりの立ち絵を添付）
  ```
  An old, slightly faded snapshot photo taken about ten years ago at a shrine festival at night, warm and a little blurry like a phone photo. A 7-year-old girl with a chestnut bob and a red goldfish hair clip, in a white yukata with small red goldfish (keep her design as in the attached portrait), smiling proudly at the camera and holding up two small plastic bags of water, each with one red goldfish, one in each hand. Paper lanterns blurred in the background. Square 1:1 image instead of 9:16.
  ```

**1-1 の敵の `Body:`**（今の戦闘の仮の絵を替える時に。時代の色は平成 `bright pastel and light blue`。ボスは `A large boss monster, filling most of the image.` を足す）

| 敵 | `Body:` |
| --- | --- |
| 金魚ノイズ | `a big red goldfish swimming in the air, trailing torn festival water bags and splashes, its fins fraying into static` |
| 水風船ノイズ | `a bunch of bouncing festival water balloons on rubber strings, wobbling and splashing` |
| お面ノイズ | `a cluster of festival character masks (plain fox, oni and round-face masks, no famous characters) stacked like a totem, glaring` |
| わたあめノイズ | `a fluffy cloud of pink cotton candy on a wooden stick, sticky strands reaching out like arms` |
| 金魚鉢のぬし（ボス） | `a giant round glass goldfish bowl with swirling water inside and many goldfish circling, two arms made of paper goldfish scoops (poi), water overflowing as waves` |

## 5-6. 1章で足りない絵の一覧（2026-10-15）

1章（プロローグ、1日目〜4日目、1-1、1-2）で、まだ絵がない物を全部集めた。台本（`src/data/scriptM1.ts`、`docs/script/M1.md` の 5.、`docs/script/M2.md` の 5.）、会話の人の表情（`src/data/dialogue.ts` の `CAST`）、会話の背景と1枚絵（同じく `BACKDROPS`・`CGS`）、戦闘の敵（`src/data/enemies.ts`）を、台帳（`src/data/assets.ts`）と見比べた。今は、絵のない表情は基本の1枚で、絵のない背景・1枚絵は色と名前で代わりに出している。

上から順に作る（1章の通しで目に入る時間が長いもの、ほかの絵の見本になるものから）。指示文の場所は右の列。ChatGPT の分は 5-5 の作る順番にも同じ番号で並べた（18・19）。

### ChatGPT で作る物

| 順 | 絵 | 使う所 | 指示文 | 一緒に渡す見本の絵 |
| --- | --- | --- | --- | --- |
| 1 | 背景：施設の台所（朝。夕方は色の加工） | 1-A・1-D、日常の「施設」（2章でも使う） | 5-5 の「M1 の残りの指示文」 | なし |
| 2 | 背景：コンビニの店内 | 1-C、4日目の小話、日常の「コンビニ」 | 同上 | なし |
| 3 | 背景：学校の屋上 | 1-D、3日目 | 同上 | なし |
| 4 | 背景：金魚すくいの屋台 | P-3（金魚すくいの遊びの水面にも） | 同上 | なし |
| 5 | 背景：射的の屋台 | P-3 | 同上 | なし |
| 6 | 背景：神社の石段の上 | P-4 | 同上 | なし |
| 7 | 背景：神社の裏の高台（夜） | P-5 | 同上 | なし |
| 8 | 1枚絵：高台で花火を見る3人の後ろ姿 | P-5 | 同上 | 子どもの3人の立ち絵 |
| 9 | 1枚絵：金魚の写真 | 1-D | 同上 | 子どものあかり（笑顔） |
| 10 | 1枚絵：白い街（夢） | 1-A | 同上 | なし |
| 11 | ゆうま（通常）の基本の1枚 | 1-C・1-E・1-G・2-B | 同上 | あかり（笑顔） |
| 12 | 写しのゆうま（笑顔）、写しのひなの（笑顔） | 1-1 | 同上 | ゆうま、子どものあかり（構図）。ひなのは写しのゆうまも |
| 13 | 敵：1-1 の砂嵐4つ（金魚・水風船・お面・わたあめ）とボス（金魚鉢のぬし） | 1-1 の戦闘（今はゲームの側で描いた仮の姿） | 5-3 の敵の絵の共通部分（2026-10-13 に足した2文も）と、5-5 の「1-1 の敵の `Body:`」。時代の色は平成 | ブリキノイズ |
| 低 | 背景：教室（放課後） | 3日目の小話 | まだない（教室の絵の色の加工で代わりにしている） | 教室（朝） |
| 低 | 射的の景品3つ（ビー玉の袋・ブリキのロボット・紙ふうせん）の小さな絵 | P-3 の射的の遊び | まだない（今はゲームの側で図形で描いている） | ― |

### Gemini で作る物（表情違い）

5-3 の 14. の頭の文で、基本の1枚を見本に渡して、1回に1つの表情を作る。表情の文は、高校生の同じ表情と同じにした（台帳の `heroPortrait`・`akariPortrait`・`rikuFace`）。

| 順 | 人 | 足りない表情（台本の〔 〕の名前） | 見本の絵 | `<その人の見た目>` |
| --- | --- | --- | --- | --- |
| 1 | 子どものあかり | むっ・驚き・大笑い・照れ・悲しい・デジャヴ | 笑顔（`young_akari_smile`） | `soft chestnut-brown short bob, a small red goldfish hair clip on the left, white summer yukata with small red goldfish, childlike proportions` |
| 2 | 子どものりく | 通常・驚き・にやり・あせり・照れ | 得意げ（`young_riku_proud`） | `short spiky dark-brown hair, a small bandage on his cheek, navy jinbei with a simple white pattern, childlike proportions` |
| 3 | 子どものハルト | 驚き・照れ・困り | 通常（`young_hero_normal`） | `messy short black hair with one sand-gold strand in the bangs, amber eyes, white T-shirt and an open navy zip hoodie, childlike proportions` |
| 4 | ゆうま | 笑顔・考える・泣き笑い・苦笑い・驚き | 通常（ChatGPT の 11 ができてから） | `messy short black hair with a bit of bed head, sleepy eyes, vertically striped convenience store shirt and a plain apron` |
| 5 | 写しのひなの | 泣き | 笑顔（ChatGPT の 12 ができてから） | `short black hair in two small pigtails, pale pink yukata with a morning glory pattern, childlike proportions` |

| 表情 | `<表情>` |
| --- | --- |
| 通常 | `relaxed and friendly, a small natural smile with the mouth closed` |
| 驚き | `surprised, eyes wide open, mouth slightly open, eyebrows raised` |
| 大笑い | `laughing happily with open mouth, eyes closed` |
| むっ | `pouting, cheeks puffed, frowning a little` |
| 照れ | `embarrassed, light blush on the cheeks, eyes looking aside, a small shy smile with the mouth closed` |
| 悲しい | `sad and quiet, eyes looking down, brows slightly lowered, mouth closed, eyes a little moist` |
| デジャヴ | `lost in thought, eyes looking slightly off to the side into the distance, a faint wistful feeling of deja vu` |
| にやり | `a sly mischievous smirk, one corner of the mouth raised, eyes narrowed playfully` |
| あせり | `flustered, an awkward nervous smile, eyebrows raised in a troubled way, eyes looking aside` |
| 困り | `troubled, eyebrows raised in a worried way, mouth slightly open, eyes looking aside` |
| 笑顔 | `a bright, warm smile with the mouth slightly open` |
| 考える | `thoughtful, eyes looking up and aside, mouth slightly pursed` |
| 泣き笑い | `smiling through tears, eyes wet and slightly narrowed, a trembling smile` |
| 苦笑い | `a wry, strained smile, one corner of the mouth raised, eyebrows slightly troubled` |
| 泣き | `crying, tears streaming down the cheeks, mouth open in a sob, eyebrows drawn up` |

（泣きは、この節で足した文。1回だけ涙を描いてよい表情なので、頭の文の `no tears unless stated` はそのままでよい）

### あとで作る物（低）

- まばたき・口パクの差分（5-4）：子どもの3人、ふみ、写しのふみ、写しのきよし、ゆうま。今は止まった絵のまま出る。表情違いがそろってから作る

### 絵はあるが、まだ画面につないでいない物

作る物ではない。出す段階で台帳の id をつなぐ。

| 絵 | つなぐ所 | 段階 |
| --- | --- | --- |
| 川沿いの帰り道（`bg.riverside_path`） | 会話の背景 `river_path`（4日目のあかり3。今は色だけ） | 1章の昼の出来事の台本を入れる時 |
| 時計屋の店内（昼）（`bg.clock_shop_day`） | 3日目・4日目の時計屋（今は夕暮れの絵） | 36 |
| 昭和の商店街の背景・地図、夕焼けの二人乗り、1-2 の敵5つ | 1-2 の区画 | 37 |

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
- 段階19で、音を鳴らす仕組みを作った（`docs/design/tech.md`）。効果音ラボの効果音6つ（ボタン・斬る・打撃・回復・宝箱・遭遇）を入れた。BGM は本番の曲ができるまで、自作の仮の音（`scripts/placeholder_bgm.py`）で鳴らす。BGM のファイルは mp3 にし、くり返す区間を `src/data/sounds.ts` の `BGM_LOOPS` に書く（段階20。Suno の曲も同じ形で入れる）。BGM を Suno で作るので、上の「音のファイルに暗号をかける」仕組みは作らない
  - Suno の無料の版で作った曲は、売り物に使えない（後から有料にしても、さかのぼって使えるようにはならない）。商用に使える権利は、有料の期間にダウンロードした曲だけに付く（2026-09-03 から。Pro は月20曲、Premier は月60曲まで）。解約しても、ダウンロード済みの曲は使い続けられる
  - 使うなら、無料の版で曲調を試してから、有料の版を必要な月だけ契約して本番の曲を作る。ダウンロードした日の規約の控えを取る
  - Suno の曲はループ前提ではないので、つなぎ目を探して切る作業が要る（Claude が曲を解析して、つなぎ目を探す）
- **M1 の本番の BGM（段階31b。8曲）**：どの場面に何曲かは `docs/script/M1.md` の 5. の素材一覧。台本の名前（`@bgm`）との対応は `src/data/dialogue.ts` の `SCRIPT_BGM`。Pro の月20曲で、1曲あたり2回くらい作り直せる
- **作り方（2026-10-13、開発者と決めた）**：最初のたたき台（2026-10-09）で作り始めたら、「場面に合わない」「印象に残らない」曲になった。原因は、指示文がジャンルの説明（「JRPG の町の曲」など）で、場面の説明になっていなかったことと、曲どうしに共通の旋律がなかったこと。そこで、次の形で作る
  1. **先にメインテーマ（① タイトル）だけを作り込む**。条件は、1回聴いたら口ずさめる短い旋律があること。決まるまで、ほかの曲は作らない
  2. **メインテーマから派生させる曲**（①b 夕暮れ・⑤ ボス戦・⑦ 返す場面）は、Suno の Cover で ① の曲を元にして、Style of Music だけを替えて作る。同じ旋律が場面ごとに形を変えて出てくるので、ゲーム全体の曲が1つにまとまり、記憶に残る。Cover は元の曲の旋律をどこまで残すかを選べる（設定の名前は Suno の版で変わる）。旋律が消えたら元の曲に寄せ、元の曲のままなら離す
  3. ほかの曲（②③④⑥）は、何度も聴く曲なので別の旋律でよい
- **指示文の書き方**：Style of Music に書く（Instrumental はオン）。入れたくない音は Exclude styles（除外の欄）に書く（指示文に `no ○○` と書くより効く）
  - 先頭に**場面**を書く：何が起きている時に流れるか、プレイヤーにどう感じてほしいか（物語の中身。`docs/STORY.md`）。ジャンル名（JRPG など）は最小にする（入れると「よくある曲」になる）
  - 楽器は2〜3個まで。Suno は先頭のほうの言葉を強く拾うので、大事なものから書く
  - **会話の後ろで流れる曲**（①b・②⑥）は、`background music under dialogue, steady dynamics` を入れ、途中で大きく盛り上げない（Suno は放っておくと歌もののように盛り上げて、会話から浮く）
  - 調・テンポ・音色（`felt piano`、`mellow` など）は具体的に書く。開発者が選んだ仮の曲（魔王魂）は、タイトルと返す場面が短調のピアノで柔らかい音、日常がゆったりした速さだった（2026-10-13 に解析した）ので、それに寄せた
- **試し方**：1回で変えるのは1か所だけ（どの言葉が効いたか分かるように）。惜しい曲は作り直さず、Extend や Cover で寄せる。合うかどうかは、ゲームの背景の絵（`public/assets/backgrounds/`）を見ながら聴いて決める

| 番号 | 優先 | 曲 | 流れる所 | 台本の名前 | 作り方 |
| --- | --- | --- | --- | --- | --- |
| ① | 高 | タイトル（メインテーマ） | タイトル | `title` | 最初に作り込む |
| ①b | 中 | 夕暮れの時計屋 | 夕暮れの時計屋（1-E などは今の台本では BGM なし。使う場面は台本で決める） | （未定。`dusk` の予定） | ① の Cover |
| ② | 高 | 日常 | 朝・学校・商店街 | `daily` | 新しく作る |
| ③ | 高 | プロローグの祭り・縁日の探索 | プロローグ、1-1 の探索 | `prologue`、`festival` | プロローグを新しく作り、縁日はその Cover（2026-10-13） |
| ④ | 高 | ふだんの戦闘 | 雑魚戦 | （戦闘の画面） | 新しく作る |
| ⑤ | 高 | ボス戦 | 1-1 のボス | （戦闘の画面） | 新しく作る（テーマは使わない。2026-10-13） |
| ⑥ | 中 | レストピア（蔵書の棚） | 1-F、2-C | `library` | 新しく作る |
| ⑦ | 中 | 返す場面・泣き | 時間を返す、2日目の電話 | `return` | ① の Cover |

- 指示文（2026-10-13 に書き直した。上が Style of Music、下が Exclude styles）：
  - ① タイトル（メインテーマ）：魔王魂の「ピアノ41」（今の仮のタイトル曲）の雰囲気に寄せ、旋律を覚えやすくした
    - `solo piano, a simple memorable main theme built on a short five-note motif, G minor, slow 66 bpm, soft felt piano in the middle and low register, melancholic and mysterious like a half-forgotten summer memory, sparse at first, then the motif returns with octave bass and fuller chords showing quiet determination, then settles back into silence, instrumental`
    - `vocals, strings, drums, synth, music box, fade out`
  - ①b 夕暮れの時計屋（① の Cover）：
    - `warm gentle arrangement for piano and soft strings, a quiet old clock shop at sunset, many clocks ticking softly, golden evening light through the window, nostalgic and calm with a little sadness, slow 66 bpm, background music under dialogue, steady dynamics, instrumental`
    - `vocals, drums, big climax, fade out`
  - ② 日常：
    - `peaceful everyday life in a small Japanese town, acoustic guitar and light piano, school, shopping arcade, summer afternoon with best friends, ordinary days the player will miss later, relaxed 80 bpm, simple repeating melody, background music under dialogue, steady dynamics, instrumental`
    - `vocals, electric guitar, synth, build-up, fade out`
  - ③ 縁日の探索：
    - `a summer night festival inside a stolen memory, shinobue bamboo flute and light taiko, paper lanterns and goldfish scooping, children laughing in the distance, cheerful and nostalgic but slightly dreamlike like an old recording, 100 bpm, looping exploration music, steady dynamics, instrumental`
    - `vocals, rock drums, synth, fade out`
  - ④ ふだんの戦闘（砂嵐は、何度も再生されてすり切れた時間のノイズ。悪者ではない）：
    - `battle against monsters made of TV static and worn-out memories, driving drums and bass with a piano riff, ticking clock rhythm, tense but not evil, energetic and heroic, 140 bpm, loop-friendly game battle music, instrumental`
    - `vocals, dubstep, EDM drop, fade out`
  - ⑤ ボス戦（① の Cover。ボスは時間を盗むアーカイバー。ハルトの元の仲間）：
    - `boss battle against an agent who steals time, the main theme played fast and fierce in a minor key, driving drums, strings and piano, ticking clock rhythm, urgent and powerful with a hint of sorrow, 150 bpm, loop-friendly, instrumental`
    - `vocals, choir with lyrics, EDM drop, fade out`
  - ⑥ レストピア（蔵書の棚。盗まれた楽しい時間が、砂時計になって並ぶ所）：
    - `a vast silent library of hourglasses holding stolen happy moments, celesta and harp over soft pads, golden sand floating in the air, beautiful but empty, eternal stillness, quiet wonder with loneliness, slow 70 bpm, ambient, background music under dialogue, steady dynamics, instrumental`
    - `vocals, drums, fade out`
  - ⑦ 返す場面・泣き（① の Cover。景色が金色の砂になって昇り、持ち主に時間が戻る）：
    - `the main theme as a slow tender piano piece, returning a lost happy memory to its owner, the scene dissolves into golden sand, tears and a smile, solo piano with soft cello, fragile at first then warm, 60 bpm, instrumental`
    - `vocals, drums, fade out`
  - 最初のたたき台（2026-10-09。使わない）：① `nostalgic emotional JRPG title theme, solo piano and soft strings, music box accents, ...`、② `warm slice-of-life JRPG town theme, ...`、③ `cheerful Japanese summer festival music, ...`、④ `energetic JRPG battle theme, ...`、⑤ `intense JRPG boss battle theme, ...`、⑥ `mysterious and beautiful fantasy library theme, ...`、⑦ `heartbreaking emotional piano ballad, ...`（ジャンル名が先頭で、場面の説明がなかった）
- **メインテーマの候補（2026-10-13、開発者が Suno の Pro で作った）**：上の指示文で作ったたたき台は、どれも「かっこいいけど頭に残らない」になった。歌ありで作ると、Suno は歌詞のサビに合わせて覚えやすい旋律を作るので、まず歌ありで作ってから、Cover で歌を外すことにした
  - 開発者の好きな曲（自作の Dustline Rodeo）と、頭に残った候補（Paper Umbrella）を解析すると、共通点は「G minor、短い言葉を2回重ねるサビ（Ride it out, ride it out／Take me there, take me there）、隣り合った音を行き来する幅の狭い旋律、130〜150の勢い」だった。今後の曲づくりの軸にする
  - Paper Umbrella：和風ロックの指示文（`wafu rock, Japanese traditional rock fusion, fast shamisen riff, taiko drums, distorted guitar, shinobue flute hook, tight driving rhythm, powerful female vocal, G minor, 150 bpm, fierce and cool, festival energy with a dark edge`）で、歌詞は Suno が作った。約152、G minor
  - この曲を Cover して、タイトル・返す場面・ボス戦を作り、仮の BGM と入れ替えた（下の表。台帳の指示文は Claude が渡したもので、実際に使った文と違えば書き直す）。タイトルは、最初の指示文（`melancholic and mysterious`、66 bpm）では暗くなりすぎたので、`warm and nostalgic, bittersweet but hopeful`、84 bpm、`brighter major chords in the chorus` に直した
  - 切り出しは `scripts/suno_bgm.py`。ボス戦は曲の途中でテンポが少しずつ上がる（約154 → 158）ので、テンポの差が1%未満の2点（81.2秒 → 170.2秒）でつないだ
- **テーマの使い分け（2026-10-13、開発者と決めた）**：全部の曲をメインテーマのアレンジにすると、くどくなり、テーマが流れた時の特別感がなくなる。テーマを使うのは、物語の重みがある所だけにする：① タイトル、⑦ 返す場面、ラスボス・最後の山場（最初の版のボス戦。下）。ほかの曲は別の旋律で作り、G minor（または同じ音を使う B♭・E♭）、短いフレーズのくり返し、和の楽器、で同じゲームの曲としてまとめる
  - 最初の版のボス戦（Paper Umbrella を Cover した和風メタル、約155〜158、81.2秒 → 170.2秒でつないだ）は「ラスボスの曲っぽく、最初のボスには派手すぎる」ので、ゲームから外してラスボスの候補として取っておく（mp3 は開発者の Suno にある）
  - プロローグの祭りと 1-1 の縁日は、プロローグの曲を先に作り、それを Cover して「古い録画のようにすり切れた」縁日の曲にした。盗まれた時間は何度も再生されてすり切れている、という設定を音で伝える（6章のりくの時間の中身もプロローグの祭り）。プロローグの曲は、最初の指示文では楽しげすぎ・サビがうるさかったので、遠くから聞こえる祭り、88 bpm に直した。台本の `prologue` は、それまで縁日と同じ曲だったのを、2026-10-13 に別の曲（`bgm.prologue`）にした
- **今の BGM（2026-10-13、すべて開発者が Suno の Pro で作った曲。切り出しは `scripts/suno_bgm.py`）**：台帳の指示文は Claude が渡したもので、実際に使った文と違えば書き直す

| 番号 | 曲 | Suno の曲名 | テーマ | くり返し方 |
| --- | --- | --- | --- | --- |
| ① | タイトル（`title`） | NoTitle（Paper Umbrella の Cover。ピアノ） | 使う | 全体 |
| ② | 日常（`daily`） | Arcade Afternoon | 使わない | 67.2秒 → 153.5秒（1周 約86秒） |
| ③ | プロローグの祭り（`prologue`） | Time Passes Memory | 使わない | 35.6秒 → 120.4秒（1周 約85秒） |
| ③ | 縁日（`festival`。1-1） | Lost Fair（Time Passes Memory の Cover） | 使わない | 31.3秒 → 108.9秒（1周 約78秒） |
| ④ | ふだんの戦闘 | Attack And Strike | 使わない | 23.4秒 → 57.0秒（1周 約34秒） |
| ⑤ | ボス戦（1-1） | First Combat | 使わない | 97.3秒 → 161.5秒（1周 約64秒） |
| ⑥ | レストピア（`library`） | RESTOPIA | 使わない | 全体（拍のはっきりしない曲で、よく似た2点が見つからなかった） |
| ⑦ | 返す場面（`return`） | ReturnTheMemory（Paper Umbrella の Cover。ピアノとチェロ） | 使う | 全体 |

  - くり返し区間は、拍ごとの音の特徴（和音・音色・大きさ）が前後16拍で一番よく似た2点（テンポの差が1%未満、小節の頭どうし）を探し、つなぎ目の前後でリズムの規則正しさと音量が元の曲と変わらないことを確かめた
  - 大きさは、全曲を −17.4 LUFS にそろえた（2026-10-11 に決めた大きさ）
  - それまでの仮の BGM：2026-10-11 から魔王魂の曲（①ピアノ41、②アコースティック39、④ファンタジー12、⑤ファンタジー03、⑥オーケストラ14、⑦ピアノ24。CC BY 4.0、クレジット「音楽：魔王魂」が要った。規約の控えは `docs/licenses/maoudamashii.md`、切り出しは `scripts/maou_bgm.py`）と、自作の仮の縁日の曲（`scripts/placeholder_bgm.py`）。2026-10-13 にすべて Suno の曲に替え、クレジットの「音楽：魔王魂」もなくなった
  - 大きさの決め方（2026-10-11、開発者から「タイトルだけ小さく、他は大きい」）：魔王魂の曲は聞こえ方の大きさ（ラウドネス）が最大16dB 違ったので、全曲を −17.4 LUFS（タイトルを上げても音が割れない上限）にそろえた
- 渡し方：フェードアウトのない、作ったままの mp3 を、番号（①〜⑦、①b）と実際に使った指示文（Exclude styles も）と一緒に渡す（台帳に書くため）。ダウンロードした日に Suno の規約の画面の控えを取る。くり返しのつなぎ目は Claude が曲を調べて `BGM_LOOPS` に書く

