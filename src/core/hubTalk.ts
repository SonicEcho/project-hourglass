// 拠点の仲間のひとこと（段階227。docs/milestones/M3_ui_polish.md の 9.）。Phaser に依存しない。
// ひとことには「出る条件」（物語の進み具合・絆の深さ・見た出来事・届けた依頼・物語の変数）があり、
// 条件に合うものを、知らせ → 出来事 → 絆 → 物語 → いつものひとこと の順に、まだ見ていない物を先に並べる。
// 拠点を開くと先頭（前に出した物は後ろへ回す）、立ち絵をタップすると次へ

/** 知らせの種類：落とし物を届けられる・武器が進化できる・交換所に話がある */
export type HubNotice = 'lost' | 'evolve' | 'talk';

export type HubLineKind = 'notice' | 'event' | 'bond' | 'story' | 'idle';

export interface HubLineDef {
  id: string;
  /** 誰のひとことか（仲間の id） */
  who: string;
  text: string;
  /** 立ち絵の表情（会話の表情の名前。なければその人のふつうの表情） */
  face?: string;
  kind: HubLineKind;
  /** 知らせ（kind が notice の時） */
  notice?: HubNotice;
  /** この出来事を過ぎてから（物語の流れの id） */
  after?: string;
  /** この出来事より前だけ */
  before?: string;
  /** 絆のレベルがこれ以上 */
  bond?: number;
  /** この会話（絆の出来事・小話など）を見てから */
  seen?: string;
  /** この依頼（落とし物）を届けてから */
  lost?: string;
  /** 物語の変数のこの名前に値がある時（砂の底に潜った、など） */
  flag?: string;
}

export interface HubTalkContext {
  who: string;
  /** その出来事を過ぎたか（今の出来事そのものは過ぎていない） */
  passed: (eventId: string) => boolean;
  /** 今がその出来事か */
  isNow: (eventId: string) => boolean;
  bond: number;
  vars: Readonly<Record<string, string>>;
  notices: ReadonlySet<HubNotice>;
}

const KIND_ORDER: HubLineKind[] = ['notice', 'event', 'bond', 'story', 'idle'];
const NOTICE_ORDER: HubNotice[] = ['lost', 'evolve', 'talk'];

/** 見たひとことを覚える、物語の変数の名前 */
export const hubLineSeenKey = (id: string) => `拠点のひとこと:${id}`;
/** その人の、前に出したひとことを覚える、物語の変数の名前 */
export const hubLineLastKey = (who: string) => `拠点のひとこと前:${who}`;

/** そのひとことが、今出せるか */
export function hubLineOpen(def: HubLineDef, ctx: HubTalkContext): boolean {
  if (def.who !== ctx.who) return false;
  if (def.kind === 'notice') return !!def.notice && ctx.notices.has(def.notice);
  if (def.after && !(ctx.passed(def.after) || ctx.isNow(def.after))) return false;
  if (def.before && (ctx.passed(def.before) || ctx.isNow(def.before))) return false;
  if (def.bond !== undefined && ctx.bond < def.bond) return false;
  if (def.seen && ctx.vars[`見た:${def.seen}`] !== '1') return false;
  if (def.lost && ctx.vars[`落とし物:${def.lost}`] !== 'delivered') return false;
  if (def.flag && !ctx.vars[def.flag]) return false;
  return true;
}

/**
 * 今出せるひとことを、出す順に並べる。知らせ（落とし物 → 進化 → 交換所）が先、その後は まだ見ていない物 → 見た物。
 * それぞれの中は 出来事 → 絆 → 物語 → いつも の順で、同じ種類の中は day で回す（日ごとに先頭が変わる）
 */
export function hubLines(defs: readonly HubLineDef[], ctx: HubTalkContext, day: number): HubLineDef[] {
  const open = defs.filter((d) => hubLineOpen(d, ctx));
  const notices = NOTICE_ORDER.flatMap((n) => open.filter((d) => d.kind === 'notice' && d.notice === n));
  const rest = open.filter((d) => d.kind !== 'notice');
  const ordered = (list: HubLineDef[]) =>
    KIND_ORDER.flatMap((k) => {
      const same = list.filter((d) => d.kind === k);
      if (same.length === 0) return [];
      const s = ((day % same.length) + same.length) % same.length;
      return [...same.slice(s), ...same.slice(0, s)];
    });
  const unseen = rest.filter((d) => ctx.vars[hubLineSeenKey(d.id)] !== '1');
  const seen = rest.filter((d) => ctx.vars[hubLineSeenKey(d.id)] === '1');
  // 知らせは1つの種類につき1つ（日ごとに言い方を変える）
  const noticeOne = NOTICE_ORDER.flatMap((n) => {
    const same = notices.filter((d) => d.notice === n);
    return same.length ? [same[((day % same.length) + same.length) % same.length]] : [];
  });
  return [...noticeOne, ...ordered(unseen), ...ordered(seen)];
}

/** 拠点を開いた時に出す番号：前に出した物が先頭なら、次の物（知らせは毎回出す） */
export function firstHubLine(list: readonly HubLineDef[], lastId: string | undefined): number {
  if (list.length <= 1 || !lastId) return 0;
  return list[0].id === lastId && list[0].kind !== 'notice' ? 1 : 0;
}

/** 出したひとことを覚える */
export function markHubLine(vars: Record<string, string>, def: HubLineDef): Record<string, string> {
  return { ...vars, [hubLineSeenKey(def.id)]: '1', [hubLineLastKey(def.who)]: def.id };
}
