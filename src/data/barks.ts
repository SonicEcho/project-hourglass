import type { BarkRules, BarkTable } from '../core/bark';

// 戦闘中のひとこと（段階46a）。誰が・どの場面で言うかは src/core/bark.ts が決める。設計は docs/design/battle.md の 12-3
// 表情は会話の表情の名前（src/data/dialogue.ts の CAST）。{name} は倒れた仲間、{partner} は連携技の相手の名前

export const BARK_RULES: BarkRules = {
  hurtRatio: 0.4,
  pinchRatio: 0.3,
  cooldown: 2,
};

/** 仲間の id → その仲間の名前（会話の CAST の名前。顔の絵を引くのに使う） */
export const BARK_CAST: Record<string, string> = {
  hero: 'ハルト',
  akari: 'あかり',
  mio: 'みお',
};

/** 顔の帯を出しておく時間（ミリ秒。×2・×3 ではほかの演出と同じく速くなる） */
export const BARK_SHOW_MS = 1300;

export const BARKS: BarkTable = {
  hero: {
    weak: [
      { face: '決意', text: 'そこだ！' },
      { face: '決意', text: '見えた、弱いところ！' },
      { face: '笑顔', text: '効いてる！' },
    ],
    hurt: [
      { face: '困り', text: 'くっ……まだだ！' },
      { face: '決意', text: 'これくらいで……！' },
    ],
    allyDown: [
      { face: '驚き', text: '{name}！' },
      { face: '悲しい', text: '{name}、しっかりしろ！' },
    ],
    linkCall: [{ face: '決意', text: '合わせろ、{partner}！' }],
    linkAnswer: [{ face: '決意', text: 'ああ、いくぞ！' }],
    victory: [
      { face: '笑顔', text: 'なんとかなったな。' },
      { face: '決意', text: 'よし、先へ進もう。' },
    ],
  },
  akari: {
    weak: [
      { face: '笑顔', text: '当たった！ そこが弱いんだね' },
      { face: '真剣', text: '今のうちに！' },
    ],
    hurt: [
      { face: '真剣', text: 'っ……まだ、いける！' },
      { face: '心配', text: 'いたた……でも、平気！' },
    ],
    allyDown: [
      { face: '驚き', text: '{name}！？' },
      { face: '心配', text: '{name}、待ってて！' },
    ],
    linkCall: [{ face: '真剣', text: '{partner}、いっしょに！' }],
    linkAnswer: [{ face: '笑顔', text: 'うん、いくよ！' }],
    victory: [
      { face: '笑顔', text: 'やった！ うまくいったね' },
      { face: '微笑み', text: 'ふう……みんな、無事でよかった。' },
    ],
  },
  // みおは絵がまだないので、顔の帯は色と名前で出す（絵が届いたら台帳に足すだけ）
  mio: {
    weak: [
      { face: '大笑い', text: '決めた！ そこが弱いとこ！' },
      { face: '真剣', text: 'えいっ、もういっかい！' },
    ],
    hurt: [
      { face: '悔しい', text: 'いったぁ……でも負けない！' },
      { face: '真剣', text: 'まだまだ！' },
    ],
    allyDown: [
      { face: '驚き', text: '{name}！ しっかりして！' },
    ],
    linkCall: [{ face: '真剣', text: '{partner}、いっしょにいくよ！' }],
    linkAnswer: [{ face: '笑顔', text: 'まかせて！' }],
    victory: [{ face: '大笑い', text: '決めた！ わたしたちの勝ち！' }],
  },
};
