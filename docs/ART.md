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
| 1 | みおの設定画 → 胸から上の基本の1枚 | ChatGPT | 子どものあかりの立ち絵（絵柄・構図・子どもの体つき） | まだ |
| 2 | カイの設定画 → 胸から上の基本の1枚 | ChatGPT | ノアの設定画（同じ組織の制服）、あかりの笑顔の立ち絵（構図） | まだ |
| 3 | 1枚絵：切り取られるグラウンド（2-3。2章の山場） | ChatGPT | ハルト・あかり・みお・カイの立ち絵 | まだ |
| 4 | いさむ（今）、写しのいさむ、写しの源三 | ChatGPT | あかりの笑顔の立ち絵（構図）。写しのいさむは、いさむとみおの立ち絵も | まだ |
| 5 | 背景：昭和44年の町工場の中、雪の町工場の路地 | ChatGPT | なし | まだ |
| 6 | 地図：2-1 の雪の町工場の路地 | ChatGPT | 1-1 の縁日の地図（見下ろし方の見本） | まだ |
| 7 | 1枚絵：親方の背中（2-1） | ChatGPT | 写しのいさむ・写しの源三の立ち絵 | まだ |
| 8 | こうじ（今）、けんた（今）、写しのけんた、写しのこうじ、写しのまさる | ChatGPT | あかりの笑顔の立ち絵（構図）。写しは、今の本人の立ち絵も | まだ |
| 9 | 背景：パン屋の店内、楽器店の店内、体育館のステージ、河川敷のグラウンド | ChatGPT | なし | まだ |
| 10 | 地図：2-2 の文化祭の高校、2-3 の河川敷のグラウンド | ChatGPT | 1-1 の縁日の地図 | まだ |
| 11 | 1枚絵：代打の一打（2-3）、弦が切れても歌うステージ（2-2） | ChatGPT | 写しの人たちの立ち絵 | まだ |
| 12 | 1-2 の残り：背景（昭和の商店街、時計屋の店内（昼）、川沿いの帰り道）、地図、1枚絵（夕焼けの二人乗り） | ChatGPT | 下の各項 | まだ |
| 13 | 敵：1-2 の砂嵐4つとボス、2章の砂嵐12とボス3つ、カイの戦闘の絵 | ChatGPT（多い時は Gemini） | 最初に作った敵の絵（絵柄をそろえる） | まだ（共通部分がたたき台） |
| ― | 表情違い（みお・カイ・ふみ・写しの人たち、ノアの悲しい、ハルトの悔しい・怒り、あかりの考える・泣き笑い） | Gemini | 基本の1枚 | まだ |
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

**敵の絵の共通部分（たたき台）**（`<姿>` と `<時代の色>` を敵ごとに替える。白い背景で作り、`scripts/cutout.py` で抜く）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting. No text, no watermark, no signature.

Enemy art for a turn-based mobile JRPG battle screen. Square 1:1 image. A single creature, full body, centered, front three-quarter view, plain pure white background, no shadow, no ground.
It is a "sandstorm": a monster born from a stolen happy memory that is wearing away. Its body is made of the objects below, partly dissolving into black-and-white TV static noise and drifting grains of sand at the edges, with a few colors of its era (<時代の色>). Eerie but not gory, readable as a small silhouette on a phone screen.
Body: <姿>
```

時代の色（2. の色の決まり）：昭和 `sepia, faded green and orange`／平成 `bright pastel and light blue`。ボスは `Body:` の前に `A large boss monster, filling most of the image.` を足す。

### 1. みお（設定画 → 胸から上の基本の1枚）

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

黒髪に青緑の一筋は、ハルトの砂色の一筋と対（同じアーカイバーだった伏線。6章で回収）。

**設定画**（ノアの設定画を添付）

```
Anime-style illustration for a Japanese story-driven RPG. Clean line art, soft cel shading with gentle watercolor-like lighting, warm dusk-toned palette (amber orange and indigo), nostalgic and emotional mood. No text, no watermark, no signature.

Character design sheet of an original anime-style rival character for a mobile turn-based JRPG, full body front view, standing in an arrogant, relaxed pose with his weight on one leg, plain off-white background, clean lineart with soft cel shading, about 7 heads tall. Same art style as the attached reference sheet.
Character: Kai, a young man around 20 from a cold, white future. A top-ranked time agent ("archiver") who steals people's happy memories, called the best archiver after a certain genius disappeared. Proud, sarcastic and cold, looks down on everyone; underneath, a rival who has been chasing someone he could never surpass.
Hair: short black hair, slightly spiky, with ONE single streak of blue-green in the front.
Eyes: sharp, narrow pale-gold eyes, a confident smirk.
Outfit: the same organization's uniform as the silver-haired girl in the attached sheet: a clean white long coat with a high collar and thin blue-green lines along the seams, but worn open and a little carelessly, sleeves slightly pushed up; a black high-neck inner top; slim black trousers; white boots; the same small hourglass-shaped clasp, worn on his belt instead of the collar.
Weapon: "Frame", a hollow square frame-shaped blade about the size of a large picture frame, its four edges are thin, razor-sharp white metal with blue-green light lines, like a camera viewfinder turned into a weapon. He holds it by one corner; the space inside the frame looks slightly frozen and drained of color.
Color palette: black hair #1E2230, blue-green streak #4CC2B8, pale-gold eyes #D8C27A, white coat #F4F7F8, accent lines #4CC2B8, black inner #15181F, skin #F1D9C8.
Additional views on the same sheet: back view, 4 facial expressions (smug smirk, looking down on someone, neutral, serious), close-up of the Frame blade.
Absolutely no letters or text anywhere.
```

**胸から上の基本の1枚**（決めた設定画と、あかりの笑顔の立ち絵を添付）

立ち絵の頭（`<表情>` は `a confident, condescending smirk`）の後に：

```
Character: Kai. Keep his design exactly as in the attached character sheet: short black hair with one blue-green streak in the front, sharp narrow pale-gold eyes, white high-collared long coat with thin blue-green lines worn open over a black high-neck inner top. No weapon, no glowing light effects in this portrait.
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

地図：1-2 の昭和の商店街（入口 → 駄菓子屋の前 → 時計屋の前 → 出口の坂）：地図の頭の後に

```
Scene: a small covered shopping arcade street in a Japanese regional town in the summer of 1988, at sunset, in warm sepia-tinted retro colors.
Layout from bottom to top:
- Bottom center: the arcade entrance.
- A wide straight arcade street running up the middle of the image, with two or three narrow side alleys branching left and right.
- Storefronts along both sides: a greengrocer with fruit crates, a small candy shop with a wooden bench in front, an electronics shop with old CRT TVs, a tobacco stand with a red public phone, and a small clock shop with a lit window.
- Top: the arcade exit, opening onto a gentle downhill slope.
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
| 1-2 | ラムネノイズ | 昭和 | `a swarm of glass ramune soda bottles with marbles rattling inside, quick and jittery` |
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

`<その人の見た目>` の例：みお `bright light-brown short hair with one tiny side tuft tied by an orange hair tie, sunny-yellow T-shirt, childlike proportions`／カイ `short black hair with one blue-green streak, pale-gold eyes, open white long coat with thin blue-green lines over a black high-neck inner`／ノア `silver short bob with a blue-green tint, blue-green eyes, white high-collared coat with blue-green lines, hourglass collar clasp`／ふみ `thin white hair in a low bun, deep wrinkles, beige knitted cardigan`

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
- **M1 の本番の BGM（段階31b。7曲）**：どの場面に何曲かは `docs/script/M1.md` の 5. の素材一覧。台本の名前（`@bgm`）との対応は `src/data/dialogue.ts` の `SCRIPT_BGM`。Pro の月20曲で、1曲あたり2〜3回作り直せる
- 曲調の指示文（Instrumental をオンにして、Style of Music に書く。②⑤⑥は 2026-10-09 に足したたたき台）：

| 番号 | 優先 | 曲 | 流れる所 | 台本の名前 |
| --- | --- | --- | --- | --- |
| ① | 高 | タイトル・夕暮れの街 | タイトル、夕暮れの時計屋 | `title` |
| ② | 高 | 日常 | 朝・学校・商店街 | `daily` |
| ③ | 高 | 縁日の探索（プロローグの祭りと共用でもよい） | 1-1 の探索、プロローグ | `festival`、`prologue` |
| ④ | 高 | ふだんの戦闘 | 雑魚戦 | （戦闘の画面） |
| ⑤ | 高 | ボス戦 | 1-1 のボス | （戦闘の画面） |
| ⑥ | 中 | レストピア（蔵書の棚） | 1-F、2-C | `library` |
| ⑦ | 中 | 返す場面・泣き | 時間を返す、2日目の電話 | `return` |

  - ① タイトル・夕暮れの街：`nostalgic emotional JRPG title theme, solo piano and soft strings, music box accents, gentle warm melody with a hint of sadness, summer evening sunset atmosphere, slow tempo 76 bpm, cinematic, instrumental, no vocals, no fade out`
  - ② 日常：`warm slice-of-life JRPG town theme, acoustic guitar, light piano, soft woodwinds, gentle percussion, relaxed summer morning in a small Japanese town, carefree and nostalgic, medium tempo 100 bpm, loopable game background music, instrumental, no vocals, no fade out`
  - ③ 縁日・祭り：`cheerful Japanese summer festival music, shinobue bamboo flute, taiko drums, shamisen, light percussion, playful and nostalgic, dusk atmosphere with paper lanterns, medium tempo 110 bpm, loopable game background music, instrumental, no vocals, no fade out`
  - ④ ふだんの戦闘：`energetic JRPG battle theme, driving rock drums and bass, fast strings, bright synth lead, ticking clock percussion motif, heroic and tense, fast tempo 150 bpm, loopable game background music, instrumental, no vocals, no fade out`
  - ⑤ ボス戦：`intense JRPG boss battle theme, heavy taiko and rock drums, distorted guitar, dramatic strings and choir pads, shinobue flute melody twisted into a darker minor key, ticking clock motif, urgent and powerful, tempo 160 bpm, loopable game background music, instrumental, no vocals, no fade out`
  - ⑥ レストピア（蔵書の棚）：`mysterious and beautiful fantasy library theme, celesta, harp, soft choir pads, gentle strings, music box, floating golden sand atmosphere, quiet wonder with a touch of loneliness, slow tempo 70 bpm, loopable game background music, instrumental, no vocals, no fade out`
  - ⑦ 返す場面・泣き：`heartbreaking emotional piano ballad, solo piano with soft cello, slow and fragile, memories of a lost summer, quiet and tender, tempo 64 bpm, cinematic JRPG sad scene, instrumental, no vocals`
- 渡し方：フェードアウトのない、作ったままの mp3 を、番号（①〜⑦）と実際に使った指示文と一緒に渡す（台帳に書くため）。ダウンロードした日に Suno の規約の画面の控えを取る。くり返しのつなぎ目は Claude が曲を調べて `BGM_LOOPS` に書く

