// 拠点（レストピア）の「思い出のギャラリー」のタイルの絵（段階142。docs/ART.md の 5-9）。
// 台帳の id を、使いたい順に並べる。先頭は新しく頼んだタイルの絵（docs/ART_QUEUE.md の L）、届くまでは次の絵で代わりに出す。
// 代わりの1枚絵は、そのタイルが開くより前の物語で見る絵だけにする（まだ見ていない場面が先に見えないように）。合う1枚絵がない所は背景の絵

export type HubTileId = 'growth' | 'navi' | 'weapon' | 'album' | 'party' | 'exchange' | 'lost' | 'talks' | 'library' | 'sandBottom';

export const HUB_TILE_ART: Record<HubTileId, string[]> = {
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

/**
 * 拠点の斜めのタイル（段階226）で、絵を下へずらす量（タイルの高さに対する割合。開発者の声：武器・交換所・落とし物の絵を少し下へ）。
 * 大きさは変えない（大きくすると横がはみ出す）。上に空いた所は暗くぼかす
 */
export const HUB_TILE_SHIFT: Record<string, number> = {
  'tile.weapon': 0.14,
  'tile.exchange': 0.14,
  'tile.lost': 0.14,
};

/**
 * 拠点の斜めのタイルで、絵の下を切り落とす割合（段階227 の直し。開発者の声：ライブラリの下半分が切れて見える）。
 * ライブラリの絵は下の方が暗い空の引き出しなので、下を少し落として、上の明るい所を大きく見せる（左右も同じ割合で狭まる）
 */
export const HUB_TILE_CROP_BOTTOM: Record<string, number> = {
  'tile.library_tall': 0.2,
};

/** 拠点の立ち絵の大きさ（高さ）と上の端（段階227 の直し。開発者の声：みおが少し大きい。みおは小学4年なので小さめに） */
export const HUB_PORTRAIT_FIT: Record<string, { height: number; top: number }> = {
  mio: { height: 370, top: 140 },
};

/** 拠点の斜めのタイル（縦長）で先に使う絵（段階227。届いた物だけ。休憩所の横長のタイルは HUB_TILE_ART のまま） */
export const HUB_TILE_TALL: Partial<Record<HubTileId, string>> = {
  growth: 'tile.growth_tall',
  weapon: 'tile.weapon_tall',
  library: 'tile.library_tall',
  exchange: 'tile.exchange_tall',
  lost: 'tile.lost_tall',
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

