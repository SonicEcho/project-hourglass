import type { HubLineDef } from '../core/hubTalk';

// 拠点の仲間のひとこと（段階226・227。docs/milestones/M3_ui_polish.md の 9.）。右の立ち絵の吹き出しに出す。
// 物語の軸（docs/STORY.md の 2-0）に合わせる。絆のひとことは伏線だけでなく、恋愛ゲームのように少しドキッとするものも混ぜる（あかり・小夜子。みおは小学4年なので、妹分・相棒の距離のまま）。
// まだ明かしていないこと（あかりの願い・ハルトの正体・みおの帰り道の理由）は伏線のひとことまで。
// 条件：after（その出来事から）・before（その出来事より前）・bond（絆のレベル）・seen（見た会話）・lost（届けた依頼）・flag（物語の変数）

/** その人のふつうの表情（ひとことに face がない時） */
export const HUB_TALK_FACE: Record<string, string> = { hero: '通常', akari: '笑顔', mio: '笑顔', sayoko: '微笑み', hayase: '通常' };

type Opt = Omit<HubLineDef, 'id' | 'who' | 'text' | 'kind'>;
const make = (who: string) => {
  let n = 0;
  const line = (kind: HubLineDef['kind'], text: string, opt: Opt = {}): HubLineDef => ({ id: `${who}${++n}`, who, text, kind, ...opt });
  return {
    notice: (notice: 'lost' | 'evolve' | 'talk', text: string, face?: string) => line('notice', text, { notice, face }),
    event: (text: string, opt: Opt) => line('event', text, opt),
    bond: (bond: number, text: string, opt: Opt = {}) => line('bond', text, { bond, ...opt }),
    story: (text: string, opt: Opt) => line('story', text, opt),
    idle: (text: string, opt: Opt = {}) => line('idle', text, opt),
  };
};

// ---- あかり（段階227。開発者の声で50個あまりに増やした） ----
const a = make('akari');
const AKARI: HubLineDef[] = [
  // 知らせ
  a.notice('lost', '落とし物、届けられるのがあるよ。持ち主さん、待ってるかも'),
  a.notice('lost', '落とし物の棚、光ってたよ。届けに行こ？', '微笑み'),
  a.notice('evolve', '武器、進化できるみたい。見てみよっか'),
  a.notice('evolve', 'ねえ、武器がそわそわしてる気がする。……進化、できるんじゃない？', '考える'),
  a.notice('talk', 'ペトラさん、何か話したそうだったよ'),
  // 物語（その時あかりが思っていること）
  a.story('ここの砂時計、ひとつずつ誰かの思い出なんだよね。……なんだか、あったかい', { after: 'chapter1_title', before: 'a11_returned', face: '微笑み' }),
  a.story('りく、どこにいるんだろう。……絶対、見つけようね', { after: 'chapter1_title', before: 'chapter2_title', face: '真剣' }),
  a.story('ゆうまさんとひなのちゃん、電話できてよかったね。金魚の名前、ちゃんと思い出せてた', { after: 'a11_returned', before: 'a12_return', face: '微笑み' }),
  a.story('富美さんの「おかえり」の顔、思い出すと、わたしまで泣きそうになる', { after: 'a12_return', before: 'chapter2_title', face: '泣き笑い' }),
  a.story('みおちゃん、いつも元気だよね。……ちょっと、元気すぎるくらい', { after: 'chapter2_title', before: 'a22_return', face: '考える' }),
  a.story('勇夫さんの「いい仕事だ」、みおちゃん、きっとずっと覚えてるよ', { after: 'd6_library', before: 'chapter3_title', face: '微笑み' }),
  a.story('「終わるから、全力でやれた」……か。わたし、まだ、そう思えないかも', { after: 'a22_return', before: 'chapter3_title', face: '悲しい' }),
  a.story('持っていかれた砂時計、取り返そうね。……あきらめるの、まだ早いよ', { after: 'd7_taken', before: 'a23_return', face: '真剣' }),
  a.story('小夜子さんって、不思議な人だね。でも、なんだか好きだな', { after: 'chapter3_title', before: 'chapter4_title', face: '笑顔' }),
  a.story('あの白い子……どうして、わたしにだけ冷たいんだろ', { after: 'a3k_noa', before: 'chapter4_title', face: '困り笑い' }),
  a.story('言えなかった言葉って、時間がたつほど、重くなるんだね', { after: 'a32_return', before: 'chapter4_title', face: '悲しい' }),
  a.story('もうすぐ夏だね。……今年のお祭り、どうしよっか', { after: 'chapter4_title', face: '照れ' }),
  a.story('早瀬さん、ほんとは、ずっと見守ってくれてたんだね', { after: 'a42_return', face: '微笑み' }),
  // 段階227 の直し（開発者の声：もっと欲しい）で足した物語のひとこと
  a.story('時計屋さんの奥に、こんな場所があったなんて。……まだ、夢みたい', { after: 'chapter1_title', before: 'a11_enter', face: '驚き' }),
  a.story('金魚の名前、思い出せるといいね。……わたしの金魚にも、名前、あったのかな', { after: 'a11_enter', before: 'a11_returned', face: '考える' }),
  a.story('二人乗りって、ちょっと憧れる。……ハルト、うしろ、ちゃんとこげる？', { after: 'a12_enter', before: 'a12_return', face: '照れ' }),
  a.story('町工場の音って、なんだか落ち着くね。カン、カン、って', { after: 'a21_enter', before: 'a21_return', face: '微笑み' }),
  a.story('文化祭、わたしたちの時はどうしよっか。……出し物、また決まらなそう', { after: 'a22_enter', before: 'a22_return', face: '困り笑い' }),
  a.story('最後の打席……浩二さん、打てるといいね', { after: 'a23_enter', before: 'd7_taken', face: '真剣' }),
  a.story('あの砂時計、ちゃんと持ち主に返せてよかった', { after: 'a23_return', before: 'chapter3_title', face: '泣き笑い' }),
  a.story('汽車の音って、遠くまで聞こえるんだね。待ってる人にも、届いたかな', { after: 'a31_enter', before: 'a31_return', face: '考える' }),
  a.story('浴衣の小夜子さん、すごくきれいだった。……わたしも、着てみたいな', { after: 'a3s_enter', before: 'chapter4_title', face: '照れ' }),
  a.story('川の音、ずっと聞いていられるね。……夏の匂いがする', { after: 'a41_enter', before: 'a41_return', face: '微笑み' }),
  a.story('早瀬さん、最近ちょっと元気ない気がする。……何か、できたらいいんだけど', { after: 'd38_hayase', before: 'a42_return', face: '心配' }),
  // 絆（段階227 の直し その3。開発者の声：もっとゆっくり段階を置いて親密に）。
  // 4章までであかりは Lv6 まで届く。Lv1〜2 は友だちの距離、Lv3〜4 で少し意識し始め、Lv5〜6 でドキッとする所まで。
  // 強いひとことは章でも区切る（Lv4 は2章から、Lv5 は3章から、Lv6 は4章から）。もっと近い言葉は5章より後に取っておく
  a.bond(1, '写真、また増えちゃった。……消せないんだよね、どれも', { face: '困り笑い' }),
  a.bond(1, 'シャッターのタイミング、どうしてハルトはいつも分かるんだろ。……ずるい', { face: 'むっ' }),
  a.bond(2, 'りくがいたら、今ごろ「計画」の話してるよ。三人目の分、まだ空けてあるからね', { face: '微笑み' }),
  a.bond(2, '小さいころの写真で、金魚の袋を二つ提げてるのがあるの。一つは、りくのおみやげ。……だったはず', { face: 'デジャヴ' }),
  a.bond(2, 'ハルト、髪に砂ついてるよ。……ほら、じっとして', { face: '笑顔' }),
  a.bond(3, 'ハルトといると、前にもこうしてた気がするの。……変だよね', { face: 'デジャヴ' }),
  a.bond(3, '今日のハルト、ちょっとかっこよかったよ。……ちょっとだけね', { face: '照れ' }),
  a.bond(3, '終わるのって、こわいね。……でも、ハルトがいると、ちょっとだけ平気', { face: '微笑み' }),
  a.bond(4, '三万枚の写真、気づいたら、ハルトが写ってるのばっかり。……数えてないよ？', { after: 'chapter2_title', face: '照れ' }),
  a.bond(4, '二人で砂の底に潜るのって、ちょっとデートみたいだね。……なんて', { after: 'chapter2_title', face: '照れ' }),
  a.bond(4, 'ねえ、ハルト。いなくなったりしないでね。……なんとなく、言いたくなっただけ', { after: 'chapter2_title', face: '悲しい' }),
  a.bond(5, 'ハルトの写真、待ち受けにしようかな。……うそ。ちょっとだけ、ほんと', { after: 'chapter3_title', face: '困り笑い' }),
  a.bond(5, 'ねえ、こっち向いて。……ううん、呼んでみただけ', { after: 'chapter3_title', face: '照れ' }),
  a.bond(6, 'ハルトの隣って、なんか落ち着くんだよね。……ずっと、ここがいいな', { after: 'chapter4_title', face: '照れ' }),
  a.bond(6, '今年のお祭り、浴衣、見てくれる？ ……感想、ちゃんと言ってよね', { after: 'chapter4_title', face: '照れ' }),
  a.bond(6, '……今、目が合ったの、気づいてた？', { after: 'chapter4_title', face: '照れ' }),
  // 出来事（絆の出来事・依頼の後）
  a.event('シャッター、今日もハルトが言ってね。一番いい瞬間、分かるみたいだから', { seen: 'd1_rooftop', face: '笑顔' }),
  a.event('たい焼き屋さん、今度は開いてるといいね。……三人で行こう', { seen: 'bond_akari3', face: '微笑み' }),
  a.event('次のホラー映画は、六分を目標にします', { seen: 'bond_akari4', face: 'むっ' }),
  a.event('近道、もうしません。……たぶん', { seen: 'bond_akari8', face: '困り笑い' }),
  a.event('ハルト、今日はちゃんと起きた？ 目覚まし、三つとも止めてない？', { seen: 'bond_akari9', face: 'むっ' }),
  a.event('撮らなかったもの、ノートに一つ増えたよ。……何かは、ひみつ', { seen: 'bond_akari10', face: '照れ' }),
  a.event('ひなのちゃんのヘアピン、今年のお祭りで買ってもらえるといいね', { lost: 'a11_hairpin', face: '笑顔' }),
  a.event('ちりん、ちりん。……「つかまれ」の合図、ちょっとうらやましいな', { lost: 'a12_bell', face: '照れ' }),
  a.event('消せない写真、結局ぜんぶ残しちゃった。……いいよね、別に', { seen: 'bond_akari2', face: '困り笑い' }),
  a.event('出し物、まだ決まらない。……ハルトも、ちゃんと考えてよね', { seen: 'bond_akari5', face: 'むっ' }),
  a.event('時計の博物館、また行こうね。今度は迷わないから', { seen: 'bond_akari6', face: '笑顔' }),
  a.event('お弁当、次はわたしが勝つからね。卵焼き、練習してるんだから', { seen: 'bond_akari7', face: 'むっ' }),
  a.event('勇夫さん、親方さんの言葉、ちゃんと受け取れたね', { lost: 'a21_words', face: '微笑み' }),
  a.event('「ラストチャイム」、三人で弾くところ、見てみたいな', { lost: 'a22_song', face: '笑顔' }),
  // 状況
  a.idle('砂の底って、どこまで続いてるんだろうね。こわいけど、ちょっと見てみたい', { flag: 'dig:count', face: '考える' }),
  a.idle('深いところ、真っ暗だったね。……次は、ランタン多めに持っていこ', { flag: 'dig:full', face: '心配' }),
  // いつも
  a.idle('今日はどこから見ていく？'),
  a.idle('ハルト、無理しないでね。わたしも手伝うから', { face: '心配' }),
  a.idle('おなか空いてない？ 終わったら、何か食べて帰ろ'),
  a.idle('方向音痴じゃないよ。ここが広すぎるだけ', { face: 'むっ' }),
  a.idle('ここ、時間が進まないんだって。……宿題も、進まないけど', { face: '困り笑い' }),
  a.idle('ハルト、ちゃんとご飯食べてる？ 顔色、ちょっと悪いよ', { face: '心配' }),
  a.idle('この棚、どこまで続いてるんだろうね。いつか、端まで歩いてみたいな', { face: '考える' }),
];

// ---- みお（段階227。小学4年なので恋愛寄りにはせず、妹分・相棒の距離。4章までに絆 Lv4 まで届く） ----
// 呼び方：ハルト＝せんぱい、あかり＝あかりちゃん、早瀬＝てんちょーさん、勇夫＝じいちゃん（師匠）。「決めた！」は1つのひとことに1回まで。
// 伏線：帰り道や交差点・踏切の前で一瞬止まる（7章まで理由は明かさない）
const m = make('mio');
const MIO: HubLineDef[] = [
  m.notice('lost', 'ねえねえ、落とし物の棚、まだ届けてないのがあるよ！'),
  m.notice('lost', 'せんぱい、落とし物！ 持ち主さん、きっと待ってます！', '真剣'),
  m.notice('evolve', '武器、光ってるよ！ 進化できるんじゃない？'),
  m.notice('evolve', '進化ですよ、進化！ 早く見に行きましょう！', '大笑い'),
  m.notice('talk', '交換所のお姉さん、こっち見てたよ'),
  m.notice('talk', 'ペトラさんが、なんか言いたそうでした！', '考える'),
  // 物語
  m.story('せんぱい！ ここ、名前ありますか？ ……ないなら、付けていいですか！', { after: 'chapter2_title', before: 'a21_return', face: '笑顔' }),
  m.story('砂時計の中に、じいちゃんの若いころがいるんですよね。……ちょっと、会ってみたい', { after: 'chapter2_title', before: 'a21_return', face: '考える' }),
  m.story('じいちゃんが「いい仕事だ」って言ってくれたんです！ ……一回だけですけど！', { after: 'd6_library', before: 'chapter3_title', face: '照れ' }),
  m.story('バンドって、かっこいいですね！ わたし、タンバリンなら任せてください', { after: 'a22_enter', before: 'a22_return', face: '笑顔' }),
  m.story('「また明日」って、いい言葉ですよね。……たぶん', { after: 'a22_return', before: 'chapter3_title', face: '考える' }),
  m.story('代打って、すっごく緊張するんですよ。わたし、知ってます', { after: 'a23_enter', before: 'd7_taken', face: '真剣' }),
  m.story('取られたまんまじゃ、終われません！ 取り返しましょう、せんぱい！', { after: 'd7_taken', before: 'a23_return', face: '悔しい' }),
  m.story('浩二さんのヒット、ちゃんと見てました！ ……泣いてないです！', { after: 'a23_return', before: 'chapter3_title', face: '泣き笑い' }),
  m.story('小夜子さん、ちょっと不思議でかわいいです。名前付けても……あ、もうあるんだった', { after: 'a3s_enter', before: 'chapter4_title', face: '困り笑い' }),
  m.story('お祭りの屋台、いくつ回れるか数えてました！ 十二です！', { after: 'a3s_enter', before: 'chapter4_title', face: '大笑い' }),
  m.story('あの白い子、ちょっとこわいけど……さみしそうでした', { after: 'a3k_noa', before: 'chapter4_title', face: '心配' }),
  m.story('踏切って、ちょっと苦手なんです。……なんでもないです！', { after: 'a32_enter', before: 'chapter4_title', face: '困り笑い' }),
  m.story('夏休み、もうすぐですね！ 宿題は……三分で終わらせます！', { after: 'chapter4_title', before: 'a41_return', face: '笑顔' }),
  m.story('川で泳いだら、気持ちいいだろうなあ。……せんぱい、泳げます？', { after: 'a41_return', face: '笑顔' }),
  m.story('てんちょーさん、最近ずっと、奥の柱時計を見てるんです', { after: 'd38_hayase', before: 'a42_return', face: '心配' }),
  m.story('てんちょーさんの柱時計、名前付けてあげたいんです。……動いたら、ですけど', { after: 'a42_return', face: '考える' }),
  // 絆（妹分の距離のまま、少しずつ頼る・本音を言う）
  m.bond(1, 'せんぱいの隣、運がいいんです！ 今日も当たる気がします！', { face: '大笑い' }),
  m.bond(1, '手伝い、今日で二十三個目です！ 新記録です！', { face: '笑顔' }),
  m.bond(2, '宿題の時計の問題、また教えてください。……本物の時計の方が、分かりやすいです', { face: '困り笑い' }),
  m.bond(2, 'じいちゃんには内緒ですけど、せんぱいの真似して早起きしてみました。……三日だけ', { face: '照れ' }),
  m.bond(3, 'せんぱいとあかりちゃんって、なんか、いいですよね。……何がって、なんとなくです！', { face: '照れ' }),
  m.bond(3, 'こわい夢見た時、せんぱいの「大丈夫」思い出すと、ちょっと平気になるんです', { after: 'chapter3_title', face: '照れ' }),
  m.bond(4, 'わたし、せんぱいの妹分ってことで、いいですか？ ……決めた！ 今日から妹分です！', { after: 'chapter3_title', face: '大笑い' }),
  m.bond(4, 'せんぱいがいると、帰り道、ちょっとだけ平気なんです。……なんでもないです！ 青です、行きましょう！', { after: 'chapter4_title', face: '困り笑い' }),
  // 出来事
  m.event('助っ人の依頼、また来ないかなあ。次はドッジボールで、リベンジです！', { seen: 'bond_mio1', face: '笑顔' }),
  m.event('当たりのアイス、取ってあります。あとで一緒に食べましょう！', { seen: 'bond_mio2', face: '笑顔' }),
  m.event('師匠に弟子入りして、何日目だっけ……。そうか星人には、まだ勝ててません', { seen: 'bond_mio3', face: 'むっ' }),
  m.event('そうたくん、今日も百回振ってました。……わたし、ちゃんと見てます', { seen: 'bond_mio4', face: '真剣' }),
  m.event('宿題、三分で終わる方法、まだ研究中です！', { seen: 'bond_mio5', face: '困り笑い' }),
  m.event('大食い大会、また出たいです！ 次は胃袋、鍛えてきます', { seen: 'bond_mio6', face: '大笑い' }),
  m.event('ハヤテ号、ちゃんと名前で呼んでますか？ 五十号は、まだ取ってありますからね', { seen: 'bond_mio7', face: '笑顔' }),
  m.event('走ってる時だけ、忘れられることがあるんです。……あ、変な話してごめんなさい！', { seen: 'bond_mio8', face: '困り笑い' }),
  m.event('じいちゃん、「褒められても止まるな」って。……止まりませんよ、わたし！', { lost: 'a21_words', face: '大笑い' }),
  m.event('「ラストチャイム」、完成したら、一番前で聞きます！', { lost: 'a22_song', face: '笑顔' }),
  // 状況
  m.idle('砂の底、何マス掘ったか数えてます！ ……途中で分かんなくなりました', { flag: 'dig:count', face: '困り笑い' }),
  m.idle('真っ暗なところ、ちょっとだけこわかったです。……ちょっとだけですよ！', { flag: 'dig:full', face: 'むっ' }),
  // いつも
  m.idle('よーし、今日も掘るぞー！'),
  m.idle('ねえねえ、砂の底ってどこまで続いてるのかな', { face: '考える' }),
  m.idle('手伝いなら任せてください！ 何個目でも数えますから'),
  m.idle('おなか空きました……。せんぱい、何か持ってません？', { face: '困り笑い' }),
  m.idle('この棚の砂時計、全部に名前付けたら、何年かかるかなあ', { face: '考える' }),
  m.idle('算数より、こっちの方が得意です！', { face: '大笑い' }),
];

// ---- 小夜子（段階227。大正の祭りの夜の写し。言葉づかいは「ハルトさま」「〜でございます」「〜ですのね」） ----
// 恋愛寄りのひとことは、あかりより遅く、ゆっくり。4章までの絆は Lv1 まで（それより上は5章より後の分を先に書いておく）。
// 伏線：返すと消える写しであること（8章「消えたくない」）は、はっきり言わない
const s = make('sayoko');
const SAYOKO: HubLineDef[] = [
  s.notice('lost', '落とし物が、持ち主を待っております'),
  s.notice('lost', '棚の落とし物、届けて差し上げませんか。……待つのは、つらいものですから', 'さみしげ'),
  s.notice('evolve', '武器が、次の形を望んでいるようでございます'),
  s.notice('evolve', 'ハルトさま、武器が光っております。……進化、というのでしたね', '驚き'),
  s.notice('talk', '交換所の方が、お話があるご様子です'),
  // 物語
  s.story('百年ぶりに、違う景色を見ております。……棚の砂時計、どれも違う夜ですのね', { after: 'a3s_enter', before: 'a32_enter', face: '驚き' }),
  s.story('あの白い方……どこか、さみしい目をしておられました', { after: 'a3k_noa', before: 'chapter4_title', face: '考える' }),
  s.story('言えなかった言葉は、わたくしにも、少しございます', { after: 'a32_return', before: 'chapter4_title', face: 'さみしげ' }),
  s.story('現代の夏は、ずいぶんと暑いのですね。……あいすくりんの季節でございます', { after: 'chapter4_title', face: '笑顔' }),
  s.story('川の音は、百年前と同じでございました。……少し、安心いたしました', { after: 'a41_return', face: '微笑み' }),
  s.story('早瀬さまの柱時計、動かぬままでも、よい音がしそうでございますね', { after: 'a42_return', face: '微笑み' }),
  s.story('終わりがあるから、楽しい。……百年かかって、やっと分かりました', { after: 'a3s_enter', face: '微笑み' }),
  s.story('ハルトさまたちが、わたくしの夜に来てくださった。百年で、初めてのお客さまです', { after: 'a3s_enter', before: 'a32_enter', face: '笑顔' }),
  s.story('現代の街は、夜でも明るいのですね。星が少し、遠く見えます', { after: 'a3s_enter', before: 'chapter4_title', face: '考える' }),
  s.story('早瀬さまと、昭和の歌謡曲のお話をいたしました。……大正の歌は、ご存じありませんでした', { after: 'a42_return', face: '照れ' }),
  // 絆（ゆっくり。Lv1 は好奇心と、少しのとまどい）
  s.bond(1, 'ハルトさまといると、知らないことばかりで、少し胸がさわがしいのです', { face: '照れ' }),
  s.bond(1, '「また明日」と言える相手がいるのは、うれしいものですね', { face: '微笑み' }),
  s.bond(1, '浴衣でない服にも、少しずつ慣れてまいりました。……似合っておりますか', { face: '照れ' }),
  s.bond(2, 'ハルトさまは、どなたにでもお優しいのですね。……少し、ずるいと思います', { face: '照れ' }),
  s.bond(2, 'ハルトさまの帳面に、わたくしの名前もございますか。……いえ、聞いてみただけです', { face: '照れ' }),
  s.bond(3, '今夜の月は、ハルトさまと見ると、少しだけ違って見えます', { face: '照れ' }),
  // 出来事
  s.event('日記に「昨日」を書くのが、楽しみになりました。今日は何を書きましょう', { seen: 'bond_sayoko1', face: '笑顔' }),
  s.event('試着室の鏡、やはり三人に見えます。……慣れませんわ', { seen: 'bond_sayoko2', face: '照れ' }),
  s.event('雨の日は、明日は晴れるかもしれない日。……覚えました', { seen: 'bond_sayoko3', face: '微笑み' }),
  s.event('みおさまは、二つの年号を生きておられる。……すごいお方です', { seen: 'bond_sayoko4', face: '笑顔' }),
  // 状況
  s.idle('砂の底は、静かでございますね。祭りの音が、少しも届かない', { flag: 'dig:count', face: '考える' }),
  s.idle('暗い所は、少し苦手でございます。……祭りの夜は、いつも明るかったので', { flag: 'dig:full', face: 'さみしげ' }),
  // いつも（現代の街にとまどう、ちょっと笑えるひとことも）
  s.idle('本日は、どちらへ参りましょう'),
  s.idle('この棚の静けさ、嫌いではございません'),
  s.idle('砂の底へ参るなら、お供いたします', { face: '真剣' }),
  s.idle('「すまーとほん」に、また話しかけられてしまいました。……返事をすべきでしたか', { face: '驚き' }),
  s.idle('かたかなの言葉は、まだ少し苦手でございます。「こんびに」……「こんびにえんす」', { face: '考える' }),
  s.idle('同じ日が来ないのは、少しこわいですね。……でも、少し楽しみでもあります', { face: 'さみしげ' }),
  s.idle('あかりさまと、写真を撮っていただきました。わたくし、ちゃんと写っておりましたか', { face: '照れ' }),
  s.idle('祭りのくじなら、百年分の経験がございます。……全部、当ててしまいました', { face: '笑顔' }),
  s.idle('みおさまに「すまほ」の使い方を教わっております。わたくしが年上のはずですのに', { face: '照れ' }),
  s.idle('はじめての「あいす」、頭がきーんといたしました。あれは、何なのでしょう', { face: '驚き' }),
  s.idle('ここの砂時計の中にも、誰かの祭りの夜があるのでしょうか', { face: '考える' }),
];

// ---- 早瀬（段階227。4-2 の後から。口数は少なく、ぶっきらぼうで、面倒見がいい） ----
// 伏線：10年前の祭りの夜（ハルトを見つけた）・記憶の砂時計・「知らないままでいい時間もある」。はっきりは言わない
const y = make('hayase');
const HAYASE: HubLineDef[] = [
  y.notice('lost', '落とし物が届けられるぞ。待たせるな'),
  y.notice('lost', '棚の落とし物、光ってる。……持ち主は、待ってるもんだ', '考える'),
  y.notice('evolve', '武器、進化できるぞ。見てやろうか'),
  y.notice('evolve', '刃の具合がいい。進化させてやれ', '苦笑い'),
  y.notice('talk', '交換所の人が呼んでいる'),
  y.story('静江の見ていた景色を、もう一度見られるとはな。……礼を言う', { after: 'a42_return', face: '泣き笑い' }),
  y.story('柱時計は、まだ動かん。……それでいい。急ぐもんじゃない', { after: 'a42_return', face: '考える' }),
  y.story('返せなかった時間の砂は、どこへ行くんだろうな', { after: 'a42_after', face: '考える' }),
  y.story('店の時計が止まって見えることが、少し減った。……お前らのおかげかもな', { after: 'a42_return', face: '苦笑い' }),
  y.story('仁坊、か。……そう呼ばれてたこともあった', { after: 'a42_return', face: '苦笑い' }),
  y.event('ベルの油さしなら、覚えがある。……昔の話だ', { lost: 'a12_bell', face: '苦笑い' }),
  y.event('親方ってのは、どこもそういうもんだ。褒めるのが下手でな', { lost: 'a21_words', face: '苦笑い' }),
  y.idle('……で、どこから行く'),
  y.idle('砂時計の音は、店の時計と同じだな'),
  y.idle('欠片が集まったら言え。写しなら組んでやる'),
  y.idle('無理はするな。時計も人も、巻きすぎると切れる'),
  y.idle('お前、祭りは好きか。……いや、なんでもない', { face: '考える' }),
  y.idle('知らないままでいい時間もある。……と、前は思っていた', { face: '考える' }),
  y.idle('砂の底か。……深く潜るなら、帰り道を忘れるなよ', { flag: 'dig:count' }),
  y.idle('飯は食ったか。……食ってないなら、店に何かある', { face: '苦笑い' }),
  y.idle('時計は、止まって見えても、中では動いてる。人も同じだ'),
  y.idle('ハルト。……背が伸びたな。いや、こっちの話だ', { face: '考える' }),
  y.idle('みおが名前を付けた時計が、店に二十はある。……全部、ちゃんと動く', { face: '苦笑い' }),
  y.idle('小夜子と話すと、昔の歌を思い出す'),
  y.idle('あかりは、写真を撮る時、いい顔をする'),
  y.idle('欠片は、思い出のかけらだ。粗末にするな'),
  y.idle('ルーペがないと落ち着かん。……職人の癖だ', { face: '苦笑い' }),
  y.idle('深い所の砂は、古い時計の油の匂いがする', { flag: 'dig:full', face: '考える' }),
  y.idle('腹が減ったら言え。店にどら焼きがある'),
];

// ---- ハルト（立つのは、並びにほかの仲間がいない時だけ。ひとりごと） ----
const h = make('hero');
const HERO: HubLineDef[] = [
  h.notice('lost', '落とし物、届けられるのがあったな'),
  h.notice('evolve', '武器、進化できそうだ'),
  h.notice('talk', 'ペトラさん、何か話があるらしい'),
  h.story('りく……どこにいるんだ', { after: 'chapter1_title', before: 'chapter2_title', face: '決意' }),
  h.idle('……さて、どこから行くか'),
  h.idle('棚の砂時計、前より少し減った気がする', { face: '考える' }),
  h.idle('ここにいると、なんでか落ち着く。……変だな', { face: '考える' }),
  h.idle('砂の底、もう一回だけ潜ってみるか', { flag: 'dig:count' }),
];

export const HUB_TALK: HubLineDef[] = [...AKARI, ...HERO, ...MIO, ...SAYOKO, ...HAYASE];
