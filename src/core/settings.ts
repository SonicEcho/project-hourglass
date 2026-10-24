// 遊ぶ人の設定（段階19）。音量と、会話の文字の音（段階22）、戦闘の早送りとオートの作戦（段階29）。セーブとは別に保存する（はじめからやり直しても消えない）

/** 音量（0〜1） */
export interface Settings {
  bgmVolume: number;
  seVolume: number;
  /** 会話で、文字が出るたびに短い音を鳴らす（声の代わりに、しゃべっている感じを出す。段階22の試し） */
  typeSound: boolean;
  /**
   * 出力先。ワイヤレスイヤホン（Bluetooth）は音が遅れて届くので、会話の文字の音を、ブラウザが教えてくれる遅れの分だけ早めに鳴らす。
   * スピーカーでは早めない（どちらを使っているかはブラウザから分からないので、遊ぶ人が選ぶ）
   */
  audioOut: AudioOut;
  /** 戦闘の演出の速さ（1・2・3倍。段階29） */
  battleSpeed: BattleSpeed;
  /** 雑魚戦のオートの作戦（段階29。src/sim/tactics.ts の id） */
  autoTactic: string;
  /** 物語の探索の雑魚戦で、オートを出す時（段階105）：won は一度勝った敵の組み合わせから、always は初めての敵から */
  storyAuto: StoryAuto;
}

export type StoryAuto = 'won' | 'always';

export type BattleSpeed = 1 | 2 | 3;

/** 狩りの戦闘の早送りを切り替える（段階109：×2 と ×3 だけ。×1 はなくした） */
export function nextBattleSpeed(v: BattleSpeed): BattleSpeed {
  return v === 3 ? 2 : 3;
}

/**
 * 戦闘の速さ（段階109。テストプレイのメモ 15・16。手で戦う時もオートの時も同じ）：
 * ボス戦は ×1 に固定（早送りのボタンを出さない）。狩りは設定の速さ（×2 か ×3）。それ以外は ×2 に固定
 */
export function battleSpeedFor(kind: 'boss' | 'hunt' | 'normal', setting: BattleSpeed): BattleSpeed {
  if (kind === 'boss') return 1;
  if (kind === 'hunt') return setting === 3 ? 3 : 2;
  return 2;
}

export type AudioOut = 'speaker' | 'wireless';

/** 選べる音量の段階 */
export const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

export const DEFAULT_SETTINGS: Settings = { bgmVolume: 0.5, seVolume: 0.75, typeSound: true, audioOut: 'speaker', battleSpeed: 2, autoTactic: 'auto', storyAuto: 'won' };

/** 0〜1 の段階のうち、一番近いものにそろえる。数でなければ fallback */
function toStep(v: unknown, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return VOLUME_STEPS.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), VOLUME_STEPS[0]);
}

/** 保存された文字から設定を読む。壊れていても、足りない所は初期値で埋めて必ず使える形にする */
export function parseSettings(text: string | null): Settings {
  if (!text) return { ...DEFAULT_SETTINGS };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    bgmVolume: toStep(o.bgmVolume, DEFAULT_SETTINGS.bgmVolume),
    seVolume: toStep(o.seVolume, DEFAULT_SETTINGS.seVolume),
    typeSound: typeof o.typeSound === 'boolean' ? o.typeSound : DEFAULT_SETTINGS.typeSound,
    audioOut: o.audioOut === 'wireless' ? 'wireless' : 'speaker',
    // 狩りの早送りの設定（段階109：×2 か ×3。前の ×1 は ×2 として読む）
    battleSpeed: o.battleSpeed === 3 ? 3 : 2,
    autoTactic: typeof o.autoTactic === 'string' && o.autoTactic !== '' ? o.autoTactic : DEFAULT_SETTINGS.autoTactic,
    storyAuto: o.storyAuto === 'always' ? 'always' : 'won',
  };
}

export function serializeSettings(s: Settings): string {
  return JSON.stringify(s);
}

/** 音量を次の段階へ（100% の次は 0%） */
export function nextVolume(v: number): number {
  const i = VOLUME_STEPS.indexOf(toStep(v, 0) as (typeof VOLUME_STEPS)[number]);
  return VOLUME_STEPS[(i + 1) % VOLUME_STEPS.length];
}
