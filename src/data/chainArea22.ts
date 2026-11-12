import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { A11_DECK, type ChainAreaSetup } from './chainArea11';
import { A21_COMBOS } from './chainArea21';
import { CHAIN17_CARDS as C } from './chainTrial17';

// 段階172（段取りの段階F3a）：2-2「最後の文化祭」の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 13-7）。
// 2章の新しい性質（足止め・カウンター）が初めて出る。かばう（1章）も組み合わせを変えて出す。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、性質・予定の癖と型だけをここで書く。
// 敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/**
 * 2-2 の敵のスナップ：性質をこちら向けにした札。前の区画で札にした性質（かばう）と、性質のない敵は、技から作る
 */
export const A22_ENEMY_SNAP = {
  sticker: { id: 'a22_sticker', name: 'シール貼り', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'slow', rounds: 2, element: 'fire', power: 20 }, text: '敵1体に火20。2ラウンドの間、その敵の予定が1マス遅れる' },
  riposte: { id: 'a22_riposte', name: '振り子返し', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', riposte: 25 }, text: '添えた行動の後、ラウンドの終わりまで、この仲間が攻撃を受けると物理25でやり返す' },
  bass: { id: 'a22_bass', name: '重低音', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 18, scale: { by: 'hits', per: 3 } }, text: '敵全体に物理18。このラウンドに味方が当てた回数1回につき+3' },
  ringtone: { id: 'a22_ringtone', name: '着信音', type: 'attack', weight: 1, target: 'enemies', effect: { kind: 'damage', element: 'ice', power: 10 }, text: '重さ1で、敵全体に氷10' },
} satisfies Record<string, ChainMove>;

export const A22_ENEMY_SNAPS: Record<string, string> = {
  stickerNoise: A22_ENEMY_SNAP.sticker.id,
  metronomeNoise: A22_ENEMY_SNAP.riposte.id,
  boomboxNoise: A22_ENEMY_SNAP.bass.id,
  flipPhoneNoise: A22_ENEMY_SNAP.ringtone.id,
};

export const A22_CARD_ART: Record<string, string> = {
  a22_sticker: 'snap.fireChip',
  a22_riposte: 'snap.encore',
  a22_bass: 'snap.wideShot',
  a22_ringtone: 'snap.iceChip',
  a22_snowscape: 'snap.iceChip',
};
export const A22_SHORT_TEXT: Record<string, string> = {
  a22_sticker: '火20\n予定を遅らせる',
  a22_riposte: '添える\n受けたら反撃',
  a22_bass: '全体に物理18\n当てた回数×3',
  a22_ringtone: '重さ1\n全体に氷10',
  a22_snowscape: '敵全体に\n氷20',
};

/** 雪景色（2-2 の宝箱。一覧の 2.）：全体に氷20 */
const SNOWSCAPE: ChainMove = { id: 'a22_snowscape', name: '雪景色', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'ice', power: 20 }, text: '敵全体に氷20（弱点ならダウン）' };

/** 2-2 の宝箱で渡す札（アルバムに入れられる札の一覧に足す） */
export const A22_NEW_SNAPS: ChainMove[] = [C.highlight, C.flash, SNOWSCAPE];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic は、その敵の魔法の属性 */
const SCHOOL: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; hp?: number; shellHits?: number }> = {
  // 足止め：攻撃を受けると、まだ動いていない仲間が遅れる（最後の方で当てる・軽い札・先に倒す）
  stickerNoise: { trait: 'sticky', pattern: [{ action: 'stickOn', at: 3 }, { action: 'flash', at: 6, all: true }], magic: 'fire' },
  // カウンター：ダウンしていない時に受けると反撃（先にダウン・1回で大きく）
  metronomeNoise: { trait: 'counter', pattern: [{ action: 'tick', at: 2 }, { action: 'tempoUp', at: 5 }], magic: 'physical' },
  // かばう（1章）：ほかの敵への単体攻撃を代わりに受ける。並ぶとかばい合って長引くので HP は低め
  boomboxNoise: { trait: 'shield', pattern: [{ action: 'bassBlast', at: 7, all: true }, { action: 'tapeWhip', at: 4 }], magic: 'thunder', hp: 0.7 },
  // 性質なし：全体に着信音を撃つ係
  flipPhoneNoise: { pattern: [{ action: 'ringtone', at: 5, all: true }, { action: 'flipSnap', at: 3 }], magic: 'ice' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = SCHOOL[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: Math.max(1, Math.min(9, p.at + shift)), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 2-2 の敵の HP の倍率（今の区画の戦闘の HP にかける）。2-1 と同じく、2-2 に入る時点の控えめな育ち具合（growthPreset('a22_enter', 'low')）の
 * ハルト・あかり・みおで自動対戦して測った（考える方針・30戦ずつ）。2-1 を通すと仲間がかなり育つので、2-1 より高い。
 * 1晩目は 1.2〜1.5 ラウンド、2晩目から 1.6〜3.1 ラウンド（30戦中29〜30勝）（段階172）
 */
export const A22_CHAIN_HP_RATE = { night1: 1.2, later: 0.95 };

export function a22ChainEnemy(e: EnemyDef, rate: number = A22_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = SCHOOL[e.id];
  return {
    id: e.id,
    name: e.name,
    hp: Math.round(e.stats.hp * rate * (f?.hp ?? 1)),
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: e.stats.def,
    weak: [...e.weaknesses],
    resist: e.resistances.filter((r): r is ChainEnemyDef['weak'][number] => r !== 'magic'),
    pattern: patternOf(e, 0),
    ...(f?.trait ? { trait: f.trait } : {}),
    ...(f?.shellHits ? { shellHits: f.shellHits } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 2-2 の雑魚の戦闘（ぬしは段階F3b） */
const A22_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a22_n') || id === 'a22_runner') && !AREA_BATTLES[id].boss);

/** 2-2 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A22_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A22_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a22_n1_') ? A22_CHAIN_HP_RATE.night1 : A22_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a22ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);
