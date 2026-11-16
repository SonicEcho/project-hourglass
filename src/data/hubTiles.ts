// 拠点（レストピア）の「思い出のギャラリー」のタイルの絵（段階142。docs/ART.md の 5-9）。
// 台帳の id を、使いたい順に並べる。先頭は新しく頼んだタイルの絵（docs/ART_QUEUE.md の L）、届くまでは次の絵で代わりに出す。
// 代わりの1枚絵は、そのタイルが開くより前の物語で見る絵だけにする（まだ見ていない場面が先に見えないように）。合う1枚絵がない所は背景の絵

export type HubTileId = 'hunt' | 'growth' | 'navi' | 'weapon' | 'album' | 'party' | 'exchange' | 'lost' | 'talks' | 'library' | 'sandBottom';

export const HUB_TILE_ART: Record<HubTileId, string[]> = {
  hunt: ['tile.hunt', 'cg.fireworks'],
  growth: ['tile.growth', 'cg.tandem_bicycle'],
  navi: ['tile.navi', 'bg.clock_shop_back'],
  weapon: ['tile.weapon', 'cg.awaken_weapons'],
  album: ['tile.album', 'cg.photo_goldfish'],
  party: ['tile.party', 'cg.mio_cards'],
  exchange: ['tile.exchange', 'bg.library'],
  lost: ['tile.lost', 'bg.clock_shop'],
  talks: ['tile.talks', 'bg.shopping_street'],
  // 段階167：ライブラリ。専用のタイルの絵はまだないので、図書館の背景
  library: ['bg.library'],
  // 段階209：砂の底。専用のタイルの絵はまだないので、地面の切り取りの絵
  sandBottom: ['tile.sandBottom', 'cg.cut_ground'],
};

/** 絵の中で見せたい所の高さ（0 が上の端、1 が下の端。切り抜く時の中心）。書いていない絵は真ん中 */
export const HUB_TILE_FOCUS: Record<string, number> = {
  'cg.fireworks': 0.35,
  'cg.tandem_bicycle': 0.45,
  'cg.photo_goldfish': 0.4,
  'cg.mio_cards': 0.4,
  'bg.clock_shop_back': 0.4,
  'bg.library': 0.4,
  'bg.clock_shop': 0.4,
  'bg.shopping_street': 0.4,
};

/**
 * 拠点の仲間のひとこと（段階226。docs/milestones/M3_ui_polish.md の 8.）：右の立ち絵の吹き出し。
 * 知らせがある時はそれを先に（落とし物を届けられる → 武器が進化できる → 交換所の話）、なければ idle から日ごとに1つ。
 * face は立ち絵の表情（会話の表情の名前）
 */
export interface HubLines {
  face: string;
  idle: string[];
  lost: string;
  evolve: string;
  talk: string;
}

export const HUB_LINES: Record<string, HubLines> = {
  hero: {
    face: '通常',
    idle: ['……さて、どこから行くか', '棚の砂時計、前より少し減った気がする'],
    lost: '落とし物、届けられるのがあったな',
    evolve: '武器、進化できそうだ',
    talk: 'ペトラさん、何か話があるらしい',
  },
  akari: {
    face: '笑顔',
    idle: ['今日はどこから見ていく？', 'ここの砂時計、ひとつずつ誰かの思い出なんだよね', 'ハルト、無理しないでね。わたしも手伝うから'],
    lost: '落とし物、届けられるのがあるよ。持ち主さん、待ってるかも',
    evolve: '武器、進化できるみたい。見てみよっか',
    talk: 'ペトラさん、何か話したそうだったよ',
  },
  mio: {
    face: '笑顔',
    idle: ['よーし、今日も掘るぞー！', 'ねえねえ、砂の底ってどこまで続いてるのかな', '手伝いなら任せて！ 何個目でも数えるから'],
    lost: 'ねえねえ、落とし物の棚、まだ届けてないのがあるよ！',
    evolve: '武器、光ってるよ！ 進化できるんじゃない？',
    talk: '交換所のお姉さん、こっち見てたよ',
  },
  sayoko: {
    face: '微笑み',
    idle: ['本日は、どちらへ参りましょう', 'この棚の静けさ、嫌いではございません', '砂の底へ参るなら、お供いたします'],
    lost: '落とし物が、持ち主を待っております',
    evolve: '武器が、次の形を望んでいるようでございます',
    talk: '交換所の方が、お話があるご様子です',
  },
  hayase: {
    face: '通常',
    idle: ['……で、どこから行く', '砂時計の音は、店の時計と同じだな', '欠片が集まったら言え。写しなら組んでやる'],
    lost: '落とし物が届けられるぞ。待たせるな',
    evolve: '武器、進化できるぞ。見てやろうか',
    talk: '交換所の人が呼んでいる',
  },
};
