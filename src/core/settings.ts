// 遊ぶ人の設定（段階19）。音量と、会話の文字の音（段階22）。セーブとは別に保存する（はじめからやり直しても消えない）

/** 音量（0〜1） */
export interface Settings {
  bgmVolume: number;
  seVolume: number;
  /** 会話で、文字が出るたびに短い音を鳴らす（声の代わりに、しゃべっている感じを出す。段階22の試し） */
  typeSound: boolean;
}

/** 選べる音量の段階 */
export const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

export const DEFAULT_SETTINGS: Settings = { bgmVolume: 0.5, seVolume: 0.75, typeSound: true };

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
