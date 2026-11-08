// 段階161：新しい戦闘のチュートリアル（画面の一部を照らして、横に短い説明を出す）。
// 文はよくあるゲームのチュートリアルの言い回しにする（開発者の頼み）。どこを照らすかは画面（ChainBattleScene）が決める

/** 照らす場所 */
export type ChainCoachTarget = 'specialCard' | 'intro' | 'intent' | 'film' | 'card' | 'enemy' | 'ally2' | 'movesTab' | 'move' | 'exec' | 'weak' | 'addonCard' | 'climaxCard' | 'comboBar';

export interface ChainCoachStep {
  target: ChainCoachTarget;
  text: string;
  /** 照らした所を押してもらう（その間、ほかの所は押せない）。書かなければ、画面のどこかをタップで次へ */
  guide?: boolean;
  /** 押す手順が終わる目安：並べた行動がこの数になった（札・技を選んだだけでも、選んだ時点で次へ） */
  placed?: number;
  /** 2人目の仲間がいる時だけ出す手順 */
  second?: boolean;
}

/**
 * 説明の組（id は説明の窓と同じ。見たら、タイトルの「説明」から読み返せる）。
 * chain_plan は最初の戦闘の最初のラウンドで、照らした所を押して1回遊んでもらう（ハルトはスナップ、あかりは技）。
 * chain_weak は2ラウンド目の始めに。最初の戦闘は手札を決めておき（CHAIN_TUTORIAL_HAND）、2ラウンド目にエフェクトとクライマックスの説明が続けて出るようにする
 */
export const CHAIN_COACH: Record<string, ChainCoachStep[]> = {
  chain_plan: [
    { target: 'intro', text: 'ここからは、バトルの説明をします！\nまずは画面の見かたと、行動の並べかたを覚えましょう。' },
    { target: 'intent', text: 'これは敵の行動予定です。\n左の数字の「時刻」になると、矢印の相手を攻撃してきます。' },
    { target: 'film', text: 'ここがタイムラインです。\n行動は左から順に並び、スナップの「重さ」のぶんだけ時間が進みます。' },
    { target: 'card', text: 'さっそくスナップを使ってみましょう！\nこのスナップをタップしてください。', guide: true, placed: 1 },
    { target: 'enemy', text: '攻撃する敵をタップしてください。', guide: true, placed: 1 },
    { target: 'ally2', text: 'ハルトの行動が並びました！\n次はあかりの番です。仲間はそれぞれ、1ラウンドに1回行動できます。', second: true },
    { target: 'movesTab', text: '今度は「技」を使ってみましょう。\n「技」のタブをタップ！', guide: true, second: true, placed: 2 },
    { target: 'move', text: '技は、MP を使って放つ仲間ごとの得意技です。\nこの技をタップしてください。', guide: true, second: true, placed: 2 },
    { target: 'enemy', text: '攻撃する敵をタップしてください。', guide: true, second: true, placed: 2 },
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
  // スペシャルとコンボは、1戦目では出さず、2戦目にまとめて（開発者と決めた。最初に詰め込みすぎないように。2戦目は手札を決めて必ずそろえる）
  chain_combo: [
    {
      target: 'intro',
      text: '今回は「スペシャル」と「コンボ」を覚えましょう！',
    },
    {
      target: 'specialCard',
      text: '顔マークのついたオレンジのスナップは「スペシャル」。\nその仲間だけが使える、専用のスナップです。',
    },
    {
      target: 'comboBar',
      text: '決まったスナップがそろうと「コンボ」発動のチャンス！\n線でつながったスナップが材料で、まとめて大技を放てます。\nコンボはラウンドの最後の行動に選びましょう。',
    },
  ],
};

/** 説明を出す順（同じ時に出せる物は、上ほど先） */
export const CHAIN_COACH_ORDER = ['chain_plan', 'chain_weak', 'chain_addon', 'chain_climax', 'chain_combo'];

/** 最初の戦闘の最初の手札（1ラウンド目にハルトがクローズアップを使い、押すと決めの一枚が2ラウンド目に残る。スペシャルとコンボの材料は入れない） */
export const CHAIN_TUTORIAL_HAND = ['c17_closeUp', 'c17_push', 'c17_decisive', 'c17_strobe', 'c17_blueHour'];

/** 2戦目の最初の手札（スペシャル2枚で、コンボ「息ぴったり」がそろう） */
export const CHAIN_TUTORIAL_HAND2 = ['c17_swing', 'c17_snow', 'c17_closeUp', 'c17_backlight', 'c17_quick'];
