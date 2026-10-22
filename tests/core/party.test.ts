import { describe, expect, it } from 'vitest';
import { battleLineup, checkFlow, chooseParty, lineupAt } from '../../src/core';
import type { Flow, Lineup } from '../../src/core';
import { AREAS, PROTOTYPE_LINEUP, SLICE_FLOW } from '../../src/data';

// 戦闘の並び（段階91a）：仲間が4人以上の章で、戦闘に出る3人を選ぶ
const unlocks = { growth: true, navi: true, weapon: true };
const four: Lineup = { members: ['hero', 'akari', 'mio', 'sayoko'], unlocks, size: 3, fixed: ['hero'] };

describe('戦闘の並び（段階91a）', () => {
  it('選んでいなければ、章の仲間の順に size 人', () => {
    expect(chooseParty(four, [])).toEqual(['hero', 'akari', 'mio']);
  });

  it('選んだ並びの順で、外せない仲間は先頭に必ず入る', () => {
    expect(chooseParty(four, ['sayoko', 'mio'])).toEqual(['hero', 'sayoko', 'mio']);
    expect(chooseParty(four, ['sayoko', 'akari', 'mio'])).toEqual(['hero', 'sayoko', 'akari']);
  });

  it('その時だけ外せない仲間（晩の fixed）も入る。知らない仲間と重なりは捨てる', () => {
    expect(chooseParty(four, ['akari', 'mio'], ['sayoko'])).toEqual(['hero', 'sayoko', 'akari']);
    expect(chooseParty(four, ['nobody', 'mio', 'mio'])).toEqual(['hero', 'mio', 'akari']);
  });

  it('size のない章（全員出る）は、そのまま', () => {
    const three: Lineup = { members: ['hero', 'akari', 'mio'], unlocks };
    expect(battleLineup(three, ['mio'])).toBe(three);
    expect(battleLineup(four, ['sayoko']).members).toEqual(['hero', 'sayoko', 'akari']);
  });

  it('章の途中で仲間が変わる（lineupChanges）', () => {
    const before: Lineup = { members: ['hero', 'akari', 'mio'], unlocks };
    const flow: Flow = [
      {
        id: 'c',
        name: '章',
        lineup: before,
        lineupChanges: [{ from: 'b', lineup: four }],
        events: [
          { id: 'a', kind: 'dialogue', title: 'a' },
          { id: 'b', kind: 'dialogue', title: 'b' },
          { id: 'z', kind: 'end', title: 'つづく' },
        ],
      },
    ];
    expect(lineupAt(flow, 'a', before)).toBe(before);
    expect(lineupAt(flow, 'b', before)).toBe(four);
    expect(lineupAt(flow, 'z', before)).toBe(four);
    expect(checkFlow(flow)).toEqual([]);
    expect(checkFlow([{ ...flow[0], lineupChanges: [{ from: 'x', lineup: four }] }])).toEqual(['仲間の切り替えの出来事が章にない：x']);
  });
});

describe('祭りの夜で小夜子が加わる（段階91b）', () => {
  it('1晩目までは3人、2晩目に入る所から4人で、戦闘に出るのは3人', () => {
    expect(lineupAt(SLICE_FLOW, 'a3s_explore', PROTOTYPE_LINEUP).members).toEqual(['hero', 'akari', 'mio']);
    const after = lineupAt(SLICE_FLOW, 'a3s_explore2', PROTOTYPE_LINEUP);
    expect(after.members).toEqual(['hero', 'akari', 'mio', 'sayoko']);
    expect(after.size).toBe(3);
  });

  it('2晩目の区画は小夜子が外せない', () => {
    const after = lineupAt(SLICE_FLOW, 'a3s_explore2', PROTOTYPE_LINEUP);
    expect(battleLineup(after, ['akari', 'mio'], AREAS.a3s2.partyFixed).members).toEqual(['hero', 'sayoko', 'akari']);
    expect(checkFlow(SLICE_FLOW)).toEqual([]);
  });
});
