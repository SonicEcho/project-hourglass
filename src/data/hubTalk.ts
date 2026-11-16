import type { HubLineDef } from '../core/hubTalk';

// 拠点の仲間のひとこと（段階226・227。docs/milestones/M3_ui_polish.md の 9.）。右の立ち絵の吹き出しに出す。
// 物語の軸（docs/STORY.md の 2-0）に合わせる。まだ明かしていないこと（あかりの願い・ハルトの正体・みおの帰り道の理由）は伏線のひとことまで。
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

// ---- あかり（段階227。開発者に見てもらう最初の30個ほど） ----
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
  a.story('ふみさんの「おかえり」の顔、思い出すと、わたしまで泣きそうになる', { after: 'a12_return', before: 'chapter2_title', face: '泣き笑い' }),
  a.story('みおちゃん、いつも元気だよね。……ちょっと、元気すぎるくらい', { after: 'chapter2_title', before: 'a22_return', face: '考える' }),
  a.story('いさむさんの「いい仕事だ」、みおちゃん、きっとずっと覚えてるよ', { after: 'd6_library', before: 'chapter3_title', face: '微笑み' }),
  a.story('「終わるから、全力でやれた」……か。わたし、まだ、そう思えないかも', { after: 'a22_return', before: 'chapter3_title', face: '悲しい' }),
  a.story('持っていかれた砂時計、取り返そうね。……あきらめるの、まだ早いよ', { after: 'd7_taken', before: 'a23_return', face: '真剣' }),
  a.story('小夜子さんって、不思議な人だね。でも、なんだか好きだな', { after: 'chapter3_title', before: 'chapter4_title', face: '笑顔' }),
  a.story('あの白い子……どうして、わたしにだけ冷たいんだろ', { after: 'a3k_noa', before: 'chapter4_title', face: '困り笑い' }),
  a.story('言えなかった言葉って、時間がたつほど、重くなるんだね', { after: 'a32_return', before: 'chapter4_title', face: '悲しい' }),
  a.story('もうすぐ夏だね。……今年のお祭り、どうしよっか', { after: 'chapter4_title', face: '照れ' }),
  a.story('早瀬さん、ほんとは、ずっと見守ってくれてたんだね', { after: 'a42_return', face: '微笑み' }),
  // 絆（レベルが上がると、少しずつ心の中を話す）
  a.bond(1, '写真、また増えちゃった。……消せないんだよね、どれも', { face: '困り笑い' }),
  a.bond(2, 'ハルトといると、前にもこうしてた気がするの。……変だよね', { face: 'デジャヴ' }),
  a.bond(2, 'りくがいたら、今ごろ「計画」の話してるよ。三人目の分、まだ空けてあるからね', { face: '微笑み' }),
  a.bond(3, '終わるのって、こわいね。……でも、ハルトがいると、ちょっとだけ平気', { face: '照れ' }),
  // 出来事（絆の出来事・依頼の後）
  a.event('シャッター、今日もハルトが言ってね。一番いい瞬間、分かるみたいだから', { seen: 'd1_rooftop', face: '笑顔' }),
  a.event('たい焼き屋さん、今度は開いてるといいね。……三人で行こう', { seen: 'bond_akari3', face: '微笑み' }),
  a.event('次のホラー映画は、六分を目標にします', { seen: 'bond_akari4', face: 'むっ' }),
  a.event('近道、もうしません。……たぶん', { seen: 'bond_akari8', face: '困り笑い' }),
  a.event('ハルト、今日はちゃんと起きた？ 目覚まし、三つとも止めてない？', { seen: 'bond_akari9', face: 'むっ' }),
  a.event('撮らなかったもの、ノートに一つ増えたよ。……何かは、ひみつ', { seen: 'bond_akari10', face: '照れ' }),
  a.event('ひなのちゃんのヘアピン、今年のお祭りで買ってもらえるといいね', { lost: 'a11_hairpin', face: '笑顔' }),
  a.event('ちりん、ちりん。……「つかまれ」の合図、ちょっとうらやましいな', { lost: 'a12_bell', face: '照れ' }),
  // 状況
  a.idle('砂の底って、どこまで続いてるんだろうね。こわいけど、ちょっと見てみたい', { flag: 'dig:count', face: '考える' }),
  // いつも
  a.idle('今日はどこから見ていく？'),
  a.idle('ハルト、無理しないでね。わたしも手伝うから', { face: '心配' }),
  a.idle('おなか空いてない？ 終わったら、何か食べて帰ろ'),
  a.idle('方向音痴じゃないよ。ここが広すぎるだけ', { face: 'むっ' }),
];

// ---- ほかの4人（段階226 のひとこと。あかりの形が決まったら書き足す） ----
const h = make('hero');
const HERO: HubLineDef[] = [
  h.notice('lost', '落とし物、届けられるのがあったな'),
  h.notice('evolve', '武器、進化できそうだ'),
  h.notice('talk', 'ペトラさん、何か話があるらしい'),
  h.idle('……さて、どこから行くか'),
  h.idle('棚の砂時計、前より少し減った気がする'),
];
const m = make('mio');
const MIO: HubLineDef[] = [
  m.notice('lost', 'ねえねえ、落とし物の棚、まだ届けてないのがあるよ！'),
  m.notice('evolve', '武器、光ってるよ！ 進化できるんじゃない？'),
  m.notice('talk', '交換所のお姉さん、こっち見てたよ'),
  m.idle('よーし、今日も掘るぞー！'),
  m.idle('ねえねえ、砂の底ってどこまで続いてるのかな'),
  m.idle('手伝いなら任せて！ 何個目でも数えるから'),
];
const s = make('sayoko');
const SAYOKO: HubLineDef[] = [
  s.notice('lost', '落とし物が、持ち主を待っております'),
  s.notice('evolve', '武器が、次の形を望んでいるようでございます'),
  s.notice('talk', '交換所の方が、お話があるご様子です'),
  s.idle('本日は、どちらへ参りましょう'),
  s.idle('この棚の静けさ、嫌いではございません'),
  s.idle('砂の底へ参るなら、お供いたします'),
];
const y = make('hayase');
const HAYASE: HubLineDef[] = [
  y.notice('lost', '落とし物が届けられるぞ。待たせるな'),
  y.notice('evolve', '武器、進化できるぞ。見てやろうか'),
  y.notice('talk', '交換所の人が呼んでいる'),
  y.idle('……で、どこから行く'),
  y.idle('砂時計の音は、店の時計と同じだな'),
  y.idle('欠片が集まったら言え。写しなら組んでやる'),
];

export const HUB_TALK: HubLineDef[] = [...AKARI, ...HERO, ...MIO, ...SAYOKO, ...HAYASE];
