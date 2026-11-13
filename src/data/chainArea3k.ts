import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainVariant } from '../core';
import { AREA_BATTLES } from './areas';
import type { ChainAreaSetup } from './chainArea11';
import { A3S_COMBOS, A3S_DECK, a3sChainEnemy } from './chainArea3s';
import { CHAIN17_CARDS as C } from './chainTrial17';

// 段階183（段取りの段階F7a）：祭りの夜（カイ）「露出オーバー」の砂嵐を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 14-4）。
// カイの枠で切り取られかけた景色から湧く砂嵐。祭りの夜の敵が、祭りの夜で決めた性質（割り込み・足止め・ダウン時爆発）のまま出る（2-3x と同じ作り）。
// 段階184（F7b）：本気のカイ。勝ち筋は「フィルムを使い切らせる」（開発者と決めた。カイは6章でハルトとの一騎打ちの再戦があるので、3章は、勝つがカイが自分から引く終わり方）

/**
 * 砂嵐の HP の倍率（今の区画の戦闘の HP にかける）。祭りの夜（カイ）に入る時点の控えめな育ち具合（ハルト・小夜子・あかり）で自動対戦して測った（段階183）：
 * 0.9 で 1.9〜2.4 ラウンド、1.1 で 2.3〜2.9 ラウンド（どれも20戦中20勝）
 */
export const A3K_CHAIN_HP_RATE = 1;

/** 祭りの夜（カイ）で渡す札（段階184：本気のカイの ★3 の報酬の現像）。アルバムに入れられる札の一覧に足す */
export const A3K_NEW_SNAPS: ChainMove[] = [C.develop];

/**
 * 本気のカイの HP・攻撃の倍率と、フィルムの枚数。部位（枠の刃）の HP の倍率。
 * 自動対戦（考える方針・祭りの夜（カイ）に入る時点の控えめな育ち具合・ハルト・小夜子・あかり・宝箱の札入り・20戦）で測った（段階184）：
 * 20勝（フィルム切れ13・HP 7）・7.1ラウンド。フィルム切れの勝ちは 63〜64マスにそろう。攻撃を上げても回復が追いつき負けにくい（×2 で20勝）ので、
 * 手ごわさは行動を抜かれる・手札を焼かれる所に置いた。部位を ×0.3 にするとすぐ壊れて、切り取り・シャッターが早々に止まるので ×0.8
 */
export const A3K_KAI = { body: 1.04, part: 0.8, atk: 1.28, film: 8 };

function a3kKai(): ChainEnemyDef[] {
  const kai = AREA_BATTLES.a3k_kai.enemies[0];
  const act = (id: string) => kai.actions.find((a) => a.id === id)!;
  const blade = `${kai.id}_frameBlade`;
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: 'physical', power: a.power, ...extra };
  };
  // 撮る行動：切り取り（行動を抜く。1枚）・フレームの雨（全体。1枚）・露出（手札を焼く。1枚）・シャッター（全体の大技。2枚）。切り取りとシャッターは枠の刃を使う
  const cut = (at: number, extra: Partial<ChainEnemyMove> = {}) => move('frameCut', at, { cutsFrame: true, film: 1, requiresPart: blade, ...extra });
  const expose = (at: number) => move('expose', at, { erasesCard: true, film: 1 });
  const shutter = (at: number) => move('shutter', at, { film: 2, requiresPart: blade });
  const rain = (at: number) => move('frameRain', at, { film: 1 });
  const part = kai.parts!.find((p) => p.id === 'frameBlade')!;
  return [
    {
      id: kai.id,
      name: kai.name,
      hp: Math.round(kai.stats.hp * A3K_KAI.body),
      atk: Math.round(Math.max(kai.stats.atk, kai.stats.mag) * A3K_KAI.atk),
      def: kai.stats.def,
      weak: [],
      resist: [],
      // 予定の癖は、枠の刃が壊れて切り取り・シャッターが使えなくなっても、ほかの撮る行動が残るように並べる（本体の行動が部位を使う物なら、癖の次の行動にする。一緒に入る行動は、部位を使う物だけ外れる）
      // 型1「構図」：切り取りとフレームの雨を、1ラウンドに2つ
      phaseName: '構図',
      pattern: [{ ...cut(4), with: [rain(7)] }, { ...rain(5), with: [cut(8)] }],
      // HP が 2/3・1/3 を切ると、次のラウンドから型が変わる
      phases: [
        // 型2「露出」：露出（手札を焼く）が加わる。割り込み（ねらわれると先に動く）
        { below: 2 / 3, name: '露出', trait: 'interrupt', pattern: [{ ...expose(3), with: [cut(7)] }, { ...cut(4), with: [expose(8)] }] },
        // 型3「連写」：2回行動。シャッター（全体の大技）
        { below: 1 / 3, name: '連写', trait: 'swift', pattern: [{ ...cut(2, { at2: 6 }), with: [rain(9)] }, { ...expose(4), with: [shutter(8)] }] },
      ],
    },
    {
      id: blade,
      name: part.name,
      hp: Math.round(part.hp * A3K_KAI.part),
      atk: 0,
      def: kai.stats.def,
      weak: [],
      resist: [],
      pattern: [],
      part: { of: kai.id, ...(part.revealsWeakness ? { reveals: [...part.revealsWeakness] } : {}) },
      ...(part.drop ? { drop: part.drop } : {}),
    },
  ];
}

/** 祭りの夜（カイ）の砂嵐 */
const A3K_IDS = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a3k_') && !AREA_BATTLES[id].boss);

/** 祭りの夜（カイ）の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A3K_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  // 本気のカイ（段階184）。★3 の報酬：現像
  ['a3k_kai', { enemies: a3kKai(), variants: [], deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 35, mid: 50 }, film: { total: A3K_KAI.film }, snaps: [C.develop.id] }],
  ...A3K_IDS.map((id) => {
    const enemies = AREA_BATTLES[id].enemies.map((e) => a3sChainEnemy(e, A3K_CHAIN_HP_RATE));
    const variants: ChainVariant[] = [{ id: 'normal', name: 'ふつう', patterns: enemies.map((e) => e.pattern) }];
    return [id, { enemies, variants, deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
