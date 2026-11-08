// 段階161：新しい戦闘のチュートリアル（画面の一部を照らして、横に短い説明を出す）。
// 文はよくあるゲームのチュートリアルの言い回しにする（開発者の頼み）。どこを照らすかは画面（ChainBattleScene）が決める

/** 照らす場所 */
export type ChainCoachTarget = 'intent' | 'film' | 'card' | 'enemy' | 'exec' | 'weak' | 'addonCard' | 'climaxCard' | 'comboBar';

export interface ChainCoachStep {
  target: ChainCoachTarget;
  text: string;
  /** 照らした所を押してもらう（その間、ほかの所は押せない）。書かなければ、画面のどこかをタップで次へ */
  guide?: boolean;
}

/**
 * 説明の組（id は説明の窓と同じ。見たら、タイトルの「説明」から読み返せる）。
 * chain_plan は最初の戦闘の最初のラウンドで、照らした所を押して1回遊んでもらう。chain_weak は2ラウンド目の始めに
 */
export const CHAIN_COACH: Record<string, ChainCoachStep[]> = {
  chain_plan: [
    { target: 'intent', text: 'これは敵の行動予定です。\n左の数字の「時刻」になると、矢印の相手を攻撃してきます。' },
    { target: 'film', text: 'ここがタイムラインです。\n行動は左から順に並び、スナップの「重さ」のぶんだけ時間が進みます。' },
    { target: 'card', text: 'さっそくスナップを使ってみましょう！\nこのスナップをタップしてください。', guide: true },
    { target: 'enemy', text: '攻撃する敵をタップしてください。', guide: true },
    { target: 'exec', text: '行動がタイムラインに並びました！\n「REC 実行」をタップして、行動開始です！', guide: true },
  ],
  chain_weak: [
    {
      target: 'weak',
      text: '敵の弱点を突くと「ダウン」させられます。\nダウンした敵の予定はキャンセル！\n「弱点？」の敵には、いろいろな属性を試してみましょう。',
    },
  ],
  chain_addon: [
    {
      target: 'addonCard',
      text: '緑のスナップは「エフェクト」です。\n時間を使わずに、直前の行動に添えて効果をアップ！\n先に行動を並べてから、タップして添えましょう。',
    },
  ],
  chain_climax: [
    {
      target: 'climaxCard',
      text: '赤のスナップは「クライマックス」！\nラウンドの最後にだけ置ける大技です。\n攻撃をたくさん当てたあとに使うほど強くなります。',
    },
  ],
  chain_combo: [
    {
      target: 'comboBar',
      text: 'コンボ発動のチャンス！\n線でつながったスナップがそろうと、まとめて大技を放てます。\nラウンドの最後の行動に選びましょう。',
    },
  ],
};

/** 説明を出す順（同じ時に出せる物は、上ほど先） */
export const CHAIN_COACH_ORDER = ['chain_plan', 'chain_weak', 'chain_addon', 'chain_climax', 'chain_combo'];
