import type { LostItemDef } from '../core/lost';
import { ITEMS } from './weapons';

// 落とし物（段階53。docs/design/economy.md の 5-3、物語の意味は docs/STORY.md の 2-2）。
// ハルトたちの記憶の中で、あの時は気づかなかった小さなこと。見つけて（または砂嵐の名残から取り出して）、今の持ち主に届ける（伝える）

/** 同時に受けられる数 */
export const LOST_ACTIVE_MAX = 3;

export const LOST_ITEMS: LostItemDef[] = [
  {
    id: 'a11_hairpin',
    name: '金魚のヘアピン',
    area: 'a11',
    owner: 'ゆうま',
    text: '縁日の記憶。屋台の並びの外れで、何か小さな物が光っている。ひなのちゃんの髪に、同じ色があった気がする',
    kind: 'find',
    spot: { room: 'festival_night', cell: [16, 12] },
    deliverScene: 'lost_a11_deliver',
    reward: { fragments: ['elation', 'elation', 'relief'], snaps: ['quickStep'] },
  },
  {
    id: 'a12_bell',
    name: '二度鳴るベル',
    area: 'a12',
    owner: 'ふみ',
    text: '商店街の記憶。坂の手前で、自転車のベルが二度鳴っていた。その音を、ブリキの砂嵐が飲みこんでいる（ブリキのぜんまいを3つ集める）',
    kind: 'bring',
    bring: { item: ITEMS.tinSpring.id, count: 3 },
    deliverScene: 'lost_a12_deliver',
    reward: { gears: ['hpMemory'], items: [ITEMS.hiPotion.id] },
  },
  {
    id: 'a21_words',
    name: '親方のひとこと',
    area: 'a21',
    owner: 'いさむ',
    text: '町工場の記憶。路地の奥の物陰に、だれかの声が残っている',
    kind: 'find',
    spot: { cell: [19, 16] },
    findScene: 'lost_a21_found',
    deliverScene: 'lost_a21_deliver',
    reward: { gears: ['mpSave'], points: 5 },
  },
  {
    id: 'a22_song',
    name: '書きかけの四曲目',
    area: 'a22',
    owner: 'けんた',
    text: '文化祭の記憶。セットリストの四曲目が、カセットの砂嵐に飲みこまれている（のびたカセットテープを3つ集める）',
    kind: 'bring',
    bring: { item: ITEMS.cassetteTape.id, count: 3 },
    deliverScene: 'lost_a22_deliver',
    reward: { snaps: ['encore'], items: [ITEMS.ether.id] },
  },
];
