import type { ChainEvent, ChainState, ChainUnit } from './chain';

// 戦闘中のひとこと（段階46a。段階206 で新しい戦闘に移した）。1つの行動の出来事の列から、誰が・どの場面で・どの台詞を言うかを決める。
// 乱数は使わない（戦闘の乱数を進めると結果が変わるため）。どの台詞かは、ラウンドと出来事の数で決める。設計は docs/design/battle.md の 0-9

/** ひとことを言う場面 */
export type BarkTrigger = 'weak' | 'hurt' | 'allyDown' | 'linkCall' | 'linkAnswer' | 'victory';

/** 台詞。text の {name} は倒れた仲間、{partner} は連携技の相手の名前に替える */
export interface BarkLine {
  /** 表情（会話の表情の名前。docs/design/dialogue.md） */
  face: string;
  text: string;
}

/** 仲間の id（defId）→ 場面 → 台詞の候補 */
export type BarkTable = Record<string, Partial<Record<BarkTrigger, BarkLine[]>>>;

export interface BarkRules {
  /** 1回で最大 HP のこの割合以上削られたら「削られた」 */
  hurtRatio: number;
  /** 残りがこの割合を切ったら「削られた」 */
  pinchRatio: number;
  /** 弱点・削られた時のひとことを出した後、出さない行動の数 */
  cooldown: number;
}

export interface Bark {
  trigger: BarkTrigger;
  /** 言う仲間の defId と名前 */
  allyId: string;
  name: string;
  face: string;
  text: string;
}

/** 戦闘の間、覚えておくこと（ひとことを出しすぎないため） */
export interface BarkMemory {
  /** あと何回の行動、弱点・削られた時のひとことを出さないか */
  cooldown: number;
}

export const NEW_BARK_MEMORY: BarkMemory = { cooldown: 0 };

export interface BarkResult {
  /** 連携技のかけ合い（呼ぶ人 → 答える人の順）。連携技の帯に出す */
  link: Bark[];
  /** 出来事を見せた後に出す1つ（倒れた・削られた・弱点のうち、いちばん大事なもの） */
  after: Bark | null;
  /** 勝った時の1つ */
  victory: Bark | null;
  memory: BarkMemory;
}

/**
 * 1つの行動（before → after。events はその行動で起きた出来事）で出すひとことを決める（段階206。新しい戦闘）。
 * 倒れた → 削られた → 弱点 の順に1つだけ。コンボは2人のかけ合い、勝った時は1人
 */
export function pickChainBarks(before: ChainState, after: ChainState, events: ChainEvent[], table: BarkTable, rules: BarkRules, memory: BarkMemory): BarkResult {
  const seed = after.round + events.length;
  const unitIn = (s: ChainState, uid: string): ChainUnit | undefined => s.allies.find((a) => a.uid === uid);
  const ally = (uid: string) => unitIn(after, uid);
  const alive = (a: ChainUnit | undefined): a is ChainUnit => !!a && a.hp > 0;
  const say = (unit: ChainUnit, trigger: BarkTrigger, vars: Record<string, string> = {}, offset = 0): Bark | null => {
    const lines = table[unit.defId]?.[trigger];
    if (!lines || lines.length === 0) return null;
    const line = lines[(seed + offset) % lines.length];
    const text = line.text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
    return { trigger, allyId: unit.defId, name: unit.name, face: line.face, text };
  };

  // コンボ：動いた仲間の1人目が呼び、2人目が答える（必ず出す）
  const link: Bark[] = [];
  const combo = events.find((e): e is Extract<ChainEvent, { type: 'link' }> => e.type === 'link');
  if (combo) {
    const [a, b] = combo.uids.map((u) => unitIn(before, u)).filter((u): u is ChainUnit => !!u);
    if (a && b) {
      const call = say(a, 'linkCall', { partner: b.name });
      const answer = say(b, 'linkAnswer', { partner: a.name }, 1);
      if (call) link.push(call);
      if (answer) link.push(answer);
    }
  }

  // 倒れた（必ず出す）→ 削られた → 弱点 の順に、1つだけ
  let said: Bark | null = null;
  const downed = events.find((e) => e.type === 'defeat' && !!unitIn(before, e.uid));
  if (downed?.type === 'defeat') {
    const fallen = unitIn(before, downed.uid);
    const speaker = after.allies.find((a) => a.uid !== downed.uid && alive(a));
    if (fallen && speaker) said = say(speaker, 'allyDown', { name: fallen.name });
  }
  const minorOk = memory.cooldown === 0;
  if (!said && minorOk) {
    for (const e of events) {
      if (e.type !== 'damage') continue;
      const was = unitIn(before, e.to);
      const now = ally(e.to);
      if (!was || !alive(now)) continue;
      const big = e.amount >= now.maxHp * rules.hurtRatio;
      const pinch = now.hp < now.maxHp * rules.pinchRatio && was.hp >= now.maxHp * rules.pinchRatio;
      if (big || pinch) {
        said = say(now, 'hurt');
        if (said) break;
      }
    }
  }
  if (!said && minorOk && link.length === 0) {
    const weak = events.find((e) => e.type === 'damage' && e.weak && alive(ally(e.from)));
    if (weak?.type === 'damage') said = say(ally(weak.from)!, 'weak');
  }

  // 勝った：生きている仲間の1人（並びの順で、台詞のある人。ラウンドで順に替える）
  const victory = after.outcome === 'win' && before.outcome !== 'win' ? victoryBark(after, table) : null;

  const minorShown = said !== null && (said.trigger === 'hurt' || said.trigger === 'weak');
  const acted = events.some((e) => e.type === 'act');
  const nextMemory = { cooldown: minorShown ? rules.cooldown : Math.max(0, memory.cooldown - (acted ? 1 : 0)) };
  return { link, after: said, victory, memory: nextMemory };
}

/** 勝った時のひとこと（段階206）：生きている仲間の1人（並びの順で、台詞のある人。ラウンドで順に替える）。シャッターの決着からも呼ぶ */
export function victoryBark(state: ChainState, table: BarkTable): Bark | null {
  const living = state.allies.filter((a) => a.hp > 0);
  for (let k = 0; k < living.length; k++) {
    const unit = living[(state.round + k) % living.length];
    const lines = table[unit.defId]?.victory;
    if (!lines?.length) continue;
    const line = lines[state.round % lines.length];
    return { trigger: 'victory', allyId: unit.defId, name: unit.name, face: line.face, text: line.text };
  }
  return null;
}
