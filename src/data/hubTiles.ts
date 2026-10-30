// 拠点（レストピア）の「思い出のギャラリー」のタイルの絵（段階142。docs/ART.md の 5-9）。
// 台帳の id を、使いたい順に並べる。先頭は新しく頼んだタイルの絵（docs/ART_QUEUE.md の L）、届くまでは次の絵で代わりに出す。
// 代わりの1枚絵は、そのタイルが開くより前の物語で見る絵だけにする（まだ見ていない場面が先に見えないように）。合う1枚絵がない所は背景の絵

export type HubTileId = 'hunt' | 'growth' | 'navi' | 'weapon' | 'album' | 'party' | 'exchange' | 'lost' | 'talks';

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
