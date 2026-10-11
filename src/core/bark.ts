import type { AllyUnit, BattleState, LogEvent } from './types';

// 戦闘中のひとこと（段階46a）。1つの行動の出来事の列から、誰が・どの場面で・どの台詞を言うかを決める。
// 乱数は使わない（戦闘の乱数を進めると結果が変わるため）。どの台詞かは、ラウンドと出来事の数で決める。設計は docs/design/battle.md の 12-3

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

/** 1つの行動（prev → next）で出すひとことを決める */
export function pickBarks(prev: BattleState, next: BattleState, table: BarkTable, rules: BarkRules, memory: BarkMemory): BarkResult {
  const events = next.log.slice(prev.log.length);
  const seed = next.round + next.log.length;
  const ally = (uid: string): AllyUnit | undefined => next.allies.find((a) => a.uid === uid);
  const alive = (a: AllyUnit | undefined): a is AllyUnit => !!a && a.hp > 0;
  const say = (unit: AllyUnit, trigger: BarkTrigger, vars: Record<string, string> = {}, offset = 0): Bark | null => {
    const lines = table[unit.defId]?.[trigger];
    if (!lines || lines.length === 0) return null;
    const line = lines[(seed + offset) % lines.length];
    const text = line.text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
    return { trigger, allyId: unit.defId, name: unit.name, face: line.face, text };
  };

  // 連携技：2人のかけ合い（必ず出す）
  const link: Bark[] = [];
  const act = events.find((e): e is Extract<LogEvent, { type: 'action' }> => e.type === 'action');
  if (act && prev.links.some((l) => l.id === act.actionId) && act.actorIds.length >= 2) {
    const [a, b] = act.actorIds.map(ally);
    if (a && b) {
      const call = say(a, 'linkCall', { partner: b.name });
      const answer = say(b, 'linkAnswer', { partner: a.name }, 1);
      if (call) link.push(call);
      if (answer) link.push(answer);
    }
  }

  // 倒れた（必ず出す）→ 削られた → 弱点 の順に、1つだけ
  let after: Bark | null = null;
  const downed = events.find((e) => e.type === 'defeated' && !!ally(e.unitId));
  if (downed?.type === 'defeated') {
    const fallen = ally(downed.unitId);
    const speaker = next.allies.find((a) => a.uid !== downed.unitId && alive(a));
    if (fallen && speaker) after = say(speaker, 'allyDown', { name: fallen.name });
  }
  const minorOk = memory.cooldown === 0;
  if (!after && minorOk) {
    for (const e of events) {
      if (e.type !== 'damage') continue;
      const target = ally(e.targetId);
      if (!target || e.hpAfter <= 0) continue;
      const before = e.hpAfter + e.amount;
      const big = e.amount >= target.maxHp * rules.hurtRatio;
      const pinch = e.hpAfter < target.maxHp * rules.pinchRatio && before >= target.maxHp * rules.pinchRatio;
      if (big || pinch) {
        after = say(target, 'hurt');
        if (after) break;
      }
    }
  }
  if (!after && minorOk && link.length === 0) {
    const weak = events.find((e) => e.type === 'damage' && e.affinity === 'weak' && alive(ally(e.sourceId)));
    if (weak?.type === 'damage') after = say(ally(weak.sourceId)!, 'weak');
  }

  // 勝った：生きている仲間の1人（並びの順で、台詞のある人）
  let victory: Bark | null = null;
  if (events.some((e) => e.type === 'battleEnd' && e.outcome === 'victory')) {
    for (const a of next.allies.filter(alive)) {
      victory = say(a, 'victory');
      if (victory) break;
    }
  }

  const minorShown = after !== null && (after.trigger === 'hurt' || after.trigger === 'weak');
  const nextMemory = { cooldown: minorShown ? rules.cooldown : Math.max(0, memory.cooldown - (act ? 1 : 0)) };
  return { link, after, victory, memory: nextMemory };
}
