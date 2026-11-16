import { describe, expect, it } from 'vitest';
import type { HubLineDef, HubTalkContext } from '../src/core';
import { firstHubLine, hubLineOpen, hubLines, markHubLine } from '../src/core';
import { BOND_EVENTS, CAST, HUB_TALK, HUB_TALK_FACE, LOST_ITEMS, SCENES, SLICE_FLOW } from '../src/data';

// 拠点の仲間のひとこと（段階226・227。docs/milestones/M3_ui_polish.md の 9.）
const NAMES: Record<string, string> = { hero: 'ハルト', akari: 'あかり', mio: 'みお', sayoko: '小夜子', hayase: '早瀬' };

describe('拠点の仲間のひとこと：データ（段階227）', () => {
  it('5人とも知らせ3種類といつものひとことがあり、表情・出来事・会話・依頼は実在する。id は重ならない', () => {
    const ids = HUB_TALK.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    const events = new Set(SLICE_FLOW.flatMap((c) => c.events.map((e) => e.id)));
    const scenes = new Set(SCENES.map((s) => s.id));
    for (const [who, name] of Object.entries(NAMES)) {
      const mine = HUB_TALK.filter((l) => l.who === who);
      for (const n of ['lost', 'evolve', 'talk']) expect(mine.some((l) => l.kind === 'notice' && l.notice === n), `${who} ${n}`).toBe(true);
      expect(mine.some((l) => l.kind === 'idle' && !l.flag), who).toBe(true);
      expect(Object.keys(CAST[name].faces), who).toContain(HUB_TALK_FACE[who]);
      for (const l of mine) {
        expect(l.text.length, l.id).toBeGreaterThan(0);
        if (l.face) expect(Object.keys(CAST[name].faces), l.id).toContain(l.face);
        for (const e of [l.after, l.before]) if (e) expect(events.has(e), `${l.id} ${e}`).toBe(true);
        if (l.seen) expect(scenes.has(l.seen), `${l.id} ${l.seen}`).toBe(true);
        if (l.lost) expect(LOST_ITEMS.some((d) => d.id === l.lost), `${l.id} ${l.lost}`).toBe(true);
        if (l.bond !== undefined) expect(BOND_EVENTS[who], `${l.id} 絆の相手でない`).toBeDefined();
      }
    }
  });

  it('あかりは30個以上', () => {
    expect(HUB_TALK.filter((l) => l.who === 'akari').length).toBeGreaterThanOrEqual(30);
  });
});

describe('拠点の仲間のひとこと：選び方（段階227）', () => {
  const defs: HubLineDef[] = [
    { id: 'n1', who: 'a', text: '', kind: 'notice', notice: 'evolve' },
    { id: 'n2', who: 'a', text: '', kind: 'notice', notice: 'lost' },
    { id: 's1', who: 'a', text: '', kind: 'story', after: 'e2', before: 'e4' },
    { id: 'b1', who: 'a', text: '', kind: 'bond', bond: 2 },
    { id: 'v1', who: 'a', text: '', kind: 'event', seen: 'x' },
    { id: 'i1', who: 'a', text: '', kind: 'idle' },
    { id: 'i2', who: 'a', text: '', kind: 'idle' },
    { id: 'o1', who: 'b', text: '', kind: 'idle' },
  ];
  const order = ['e1', 'e2', 'e3', 'e4'];
  const ctx = (now: string, extra: Partial<HubTalkContext> = {}): HubTalkContext => ({
    who: 'a',
    passed: (id) => order.indexOf(id) < order.indexOf(now),
    isNow: (id) => id === now,
    bond: 0,
    vars: {},
    notices: new Set(),
    ...extra,
  });

  it('条件：物語の時期・絆・見た会話・その人だけ', () => {
    expect(hubLineOpen(defs[2], ctx('e1'))).toBe(false);
    expect(hubLineOpen(defs[2], ctx('e2'))).toBe(true);
    expect(hubLineOpen(defs[2], ctx('e4'))).toBe(false);
    expect(hubLineOpen(defs[3], ctx('e1', { bond: 1 }))).toBe(false);
    expect(hubLineOpen(defs[3], ctx('e1', { bond: 2 }))).toBe(true);
    expect(hubLineOpen(defs[4], ctx('e1'))).toBe(false);
    expect(hubLineOpen(defs[4], ctx('e1', { vars: { '見た:x': '1' } }))).toBe(true);
    expect(hubLineOpen(defs[7], ctx('e1'))).toBe(false);
  });

  it('並び：知らせ（落とし物 → 進化）→ まだ見ていない物（出来事 → 絆 → 物語 → いつも）→ 見た物', () => {
    const c = ctx('e3', { bond: 2, vars: { '見た:x': '1' }, notices: new Set(['evolve', 'lost']) });
    expect(hubLines(defs, c, 0).map((l) => l.id)).toEqual(['n2', 'n1', 'v1', 'b1', 's1', 'i1', 'i2']);
    // 見たひとことは後ろへ
    let vars = { ...c.vars };
    vars = markHubLine(vars, defs[4]);
    vars = markHubLine(vars, defs[3]);
    expect(hubLines(defs, { ...c, vars }, 0).map((l) => l.id)).toEqual(['n2', 'n1', 's1', 'i1', 'i2', 'v1', 'b1']);
    // いつものひとことは日ごとに回る
    expect(hubLines(defs, { ...c, notices: new Set() }, 1).slice(-2).map((l) => l.id)).toEqual(['i2', 'i1']);
  });

  it('開いた時：前に出した物が先頭なら次から。知らせは毎回出す', () => {
    const list = hubLines(defs, ctx('e3'), 0);
    expect(firstHubLine(list, list[0].id)).toBe(1);
    expect(firstHubLine(list, 'zz')).toBe(0);
    const withNotice = hubLines(defs, ctx('e3', { notices: new Set(['lost']) }), 0);
    expect(firstHubLine(withNotice, 'n2')).toBe(0);
  });
});
