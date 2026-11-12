// 段階161：新しい戦闘のチュートリアル（画面の一部を照らして、横に短い説明を出す）。
// 文はよくあるゲームのチュートリアルの言い回しにする（開発者の頼み）。どこを照らすかは画面（ChainBattleScene）が決める

/** 照らす場所 */
export type ChainCoachTarget = 'trait_hard' | 'trait_shell' | 'trait_shield' | 'trait_flee' | 'trait_split' | 'trait_pop' | 'guard' | 'poiBar' | 'parts' | 'specialCard' | 'intro' | 'intent' | 'film' | 'card' | 'enemy' | 'ally2' | 'movesTab' | 'move' | 'exec' | 'weak' | 'addonCard' | 'climaxCard' | 'comboBar';

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
  // ぬし（段階162）：思い出の再演「ポイが破れる前に」。最初のぬし戦の始めに
  chain_boss: [
    { target: 'intro', text: 'ぬし戦！\n思い出の再演「ポイが破れる前に」がはじまります。\nいつもの戦いとは、少しルールが違います。' },
    { target: 'poiBar', text: 'これは「ポイ」のゲージです。\n行動するたびに、重さのぶんだけポイが濡れて減ります。\nぬしの「水鉄砲」を受けても減るので注意！\n0になる前に、ぬしを倒しましょう。' },
    {
      target: 'parts',
      text: 'ポイの腕と金魚鉢は「部位」です。\n壊すと、その部位を使う大技が使えなくなります。\nでも、ポイには限りがあるので、壊すかどうかはよく考えて！',
    },
  ],
  // 段階169：1-2 のぬし「日が沈む前に」
  chain_sunset: [
    { target: 'intro', text: 'ぬし戦！\n思い出の再演「日が沈む前に」がはじまります。\n夕暮れの坂を、二人乗りで上りきりましょう。' },
    { target: 'poiBar', text: 'これは「夕日」のゲージです。\nラウンドが終わるたびに、日が傾いていきます。\n沈みきる前に、ぬしを倒しましょう！' },
    { target: 'film', text: 'ハルトとあかりの行動が続けて終わり、\nその間に敵の行動が入らなければ「息を合わせた」！\nそのラウンドは、日が傾きません。\n重さや順番、「押す」で隙間を作りましょう。' },
    { target: 'parts', text: '前輪とベルは「部位」です。\n壊すと、その部位を使う大技が来なくなります。\nベルを壊すと、隠れた弱点も見えるかも？' },
  ],
  chain_weak: [
    {
      target: 'weak',
      text: '敵の弱点を突くと「ダウン」させられます。\nダウンした敵の予定はキャンセル！\n「弱点？」の敵には、いろいろな属性を試してみましょう。',
    },
  ],
  // 警戒（段階162 調整8）：初めて敵に警戒が付いた時に、その印を照らす
  chain_guard: [
    {
      target: 'guard',
      text: 'ダウンから起きた敵は「警戒」状態！\n警戒中は、弱点を突いてもダウンしません。\nダウンさせるたびに、警戒 → 警戒+ → 警戒++ と長くなります。',
    },
  ],
  // 段階168：1-2 の敵の性質（初めて出た戦闘で、その敵の性質の札を照らす）
  chain_shield: [
    { target: 'trait_shield', text: 'この敵は「かばう」！\nほかの敵への単体攻撃を、代わりに受けてしまいます。\n全体攻撃か、先にダウンさせて崩しましょう。' },
  ],
  chain_flee: [
    { target: 'trait_flee', text: '「逃げ足」の敵は、予定の時刻になると逃げてしまいます！\n逃げられると、素材は手に入りません。\n押して時刻をずらすか、先に倒しましょう。' },
  ],
  chain_split: [
    { target: 'trait_split', text: '「分裂」の敵は、倒すと小さな2体に分かれます。\n全体攻撃やパノラマで、まとめて片付けましょう。' },
  ],
  chain_pop: [
    { target: 'trait_pop', text: '「ダウン時爆発」の敵は、弱点でダウンさせると爆発！\n味方全体にダメージが来ます。\n弱点以外で倒すか、回復を用意しておきましょう。' },
  ],
  // 段階170：2-1 の敵の性質
  chain_hard: [
    { target: 'trait_hard', text: 'この敵は「かたい」！\n1発ごとに、受けるダメージを減らしてしまいます。\n連続攻撃より、重い一撃や大きな1発が効きます。' },
  ],
  chain_shell: [
    { target: 'trait_shell', text: '「バリア」の敵は、最初の2発を消してしまいます。\n連続攻撃や複数攻撃化で割ってから、本命を当てましょう。\n重い一撃なら、1発で割れます！' },
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
export const CHAIN_COACH_ORDER = ['chain_plan', 'chain_boss', 'chain_sunset', 'chain_weak', 'chain_guard', 'chain_flee', 'chain_shield', 'chain_split', 'chain_pop', 'chain_hard', 'chain_shell', 'chain_addon', 'chain_climax', 'chain_combo'];

/** 最初の戦闘の最初の手札（1ラウンド目にハルトがクローズアップを使い、押すと決めの一枚が2ラウンド目に残る。スペシャルとコンボの材料は入れない） */
export const CHAIN_TUTORIAL_HAND = ['c17_closeUp', 'c17_push', 'c17_decisive', 'c17_strobe', 'c17_blueHour'];

/** 2戦目の最初の手札（スペシャル2枚で、コンボ「息ぴったり」がそろう） */
export const CHAIN_TUTORIAL_HAND2 = ['c17_swing', 'c17_snow', 'c17_closeUp', 'c17_backlight', 'c17_quick'];
