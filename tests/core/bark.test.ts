import { describe, expect, it } from 'vitest';
import { NEW_BARK_MEMORY, pickBarks } from '../../src/core';
import type { BarkTable, BattleState, LogEvent } from '../../src/core';
import { BARK_CAST, BARK_RULES, BARKS, CAST, LINKS } from '../../src/data';
import { ally, battle, enemy } from './helpers';

const TABLE: BarkTable = {
  hero: {
    weak: [{ face: '決意', text: 'そこだ！' }],
    hurt: [{ face: '困り', text: 'くっ' }],
    allyDown: [{ face: '驚き', text: '{name}！' }],
    linkCall: [{ face: '決意', text: '合わせろ、{partner}！' }],
    victory: [{ face: '笑顔', text: '勝った' }],
  },
  akari: {
    hurt: [{ face: '真剣', text: 'まだ' }],
    allyDown: [{ face: '驚き', text: '{name}！？' }],
    linkAnswer: [{ face: '笑顔', text: 'うん' }],
    victory: [{ face: '笑顔', text: 'やった' }],
  },
};

function start(): BattleState {
  return battle({ allies: [ally('hero', { hp: 100 }), ally('akari', { hp: 100 })], enemies: [enemy('a')], links: LINKS });
}

/** prev に出来事を足し、HP を書き換えた次の状態 */
function after(prev: BattleState, events: LogEvent[], hp: Record<string, number> = {}): BattleState {
  const next = structuredClone(prev);
  next.log.push(...events);
  for (const a of next.allies) if (a.defId in hp) a.hp = hp[a.defId];
  return next;
}

const uid = (s: BattleState, id: string) => s.allies.find((a) => a.defId === id)!.uid;
const enemyUid = (s: BattleState) => s.enemies[0].uid;
const act = (actorIds: string[], actionId = 'attack'): LogEvent => ({ type: 'action', actorIds, actionId, name: 'x', extra: false });

describe('戦闘中のひとこと（段階46a）', () => {
  it('弱点を突いた仲間が言う', () => {
    const s = start();
    const n = after(s, [act([uid(s, 'hero')]), { type: 'damage', sourceId: uid(s, 'hero'), targetId: enemyUid(s), amount: 30, affinity: 'weak', hpAfter: 9000 }]);
    const r = pickBarks(s, n, TABLE, BARK_RULES, NEW_BARK_MEMORY);
    expect(r.after).toMatchObject({ trigger: 'weak', allyId: 'hero', name: 'hero', text: 'そこだ！', face: '決意' });
    expect(r.memory.cooldown).toBe(BARK_RULES.cooldown);
  });

  it('1回で最大 HP の4割以上削られると、削られた仲間が言う。4割より少なければ言わない', () => {
    const s = start();
    const hit = (amount: number) => after(s, [act([enemyUid(s)]), { type: 'damage', sourceId: enemyUid(s), targetId: uid(s, 'akari'), amount, affinity: 'normal', hpAfter: 100 - amount }], { akari: 100 - amount });
    expect(pickBarks(s, hit(40), TABLE, BARK_RULES, NEW_BARK_MEMORY).after).toMatchObject({ trigger: 'hurt', allyId: 'akari' });
    expect(pickBarks(s, hit(20), TABLE, BARK_RULES, NEW_BARK_MEMORY).after).toBeNull();
  });

  it('残りが3割を切った時も言う（もう切っていた時は言わない）', () => {
    const s = start();
    const n = after(s, [{ type: 'damage', sourceId: enemyUid(s), targetId: uid(s, 'hero'), amount: 10, affinity: 'normal', hpAfter: 25 }], { hero: 25 });
    expect(pickBarks(s, n, TABLE, BARK_RULES, NEW_BARK_MEMORY).after?.trigger).toBe('hurt');
    const n2 = after(s, [{ type: 'damage', sourceId: enemyUid(s), targetId: uid(s, 'hero'), amount: 5, affinity: 'normal', hpAfter: 20 }], { hero: 20 });
    expect(pickBarks(s, n2, TABLE, BARK_RULES, NEW_BARK_MEMORY).after).toBeNull();
  });

  it('弱点・削られた時は、出した後の2回の行動では言わない', () => {
    const s = start();
    const weak = after(s, [act([uid(s, 'hero')]), { type: 'damage', sourceId: uid(s, 'hero'), targetId: enemyUid(s), amount: 30, affinity: 'weak', hpAfter: 9000 }]);
    let memory = { cooldown: 2 };
    let r = pickBarks(s, weak, TABLE, BARK_RULES, memory);
    expect(r.after).toBeNull();
    expect(r.memory.cooldown).toBe(1);
    memory = r.memory;
    r = pickBarks(s, weak, TABLE, BARK_RULES, memory);
    expect(r.after).toBeNull();
    r = pickBarks(s, weak, TABLE, BARK_RULES, r.memory);
    expect(r.after?.trigger).toBe('weak');
  });

  it('仲間が倒れたら、ほかの生きている仲間が名前を呼ぶ（待たずに必ず出す）', () => {
    const s = start();
    const n = after(s, [act([enemyUid(s)]), { type: 'damage', sourceId: enemyUid(s), targetId: uid(s, 'hero'), amount: 100, affinity: 'normal', hpAfter: 0 }, { type: 'defeated', unitId: uid(s, 'hero') }], { hero: 0 });
    const r = pickBarks(s, n, TABLE, BARK_RULES, { cooldown: 2 });
    expect(r.after).toMatchObject({ trigger: 'allyDown', allyId: 'akari', text: 'hero！？' });
  });

  it('連携技は2人がかけ合う（呼ぶ人 → 答える人）', () => {
    const s = start();
    const n = after(s, [act([uid(s, 'hero'), uid(s, 'akari')], LINKS[0].id), { type: 'damage', sourceId: uid(s, 'hero'), targetId: enemyUid(s), amount: 99, affinity: 'weak', hpAfter: 9000 }]);
    const r = pickBarks(s, n, TABLE, BARK_RULES, { cooldown: 2 });
    expect(r.link.map((b) => b.text)).toEqual(['合わせろ、akari！', 'うん']);
    // 連携技の時は、弱点のひとことは重ねない
    expect(r.after).toBeNull();
  });

  it('勝った時は、生きている仲間の1人が言う', () => {
    const s = start();
    const n = after(s, [{ type: 'battleEnd', outcome: 'victory' }], { hero: 0 });
    expect(pickBarks(s, n, TABLE, BARK_RULES, NEW_BARK_MEMORY).victory).toMatchObject({ allyId: 'akari', text: 'やった' });
  });

  it('台詞のない仲間・場面では何も出さない', () => {
    const s = start();
    const n = after(s, [act([uid(s, 'akari')]), { type: 'damage', sourceId: uid(s, 'akari'), targetId: enemyUid(s), amount: 30, affinity: 'weak', hpAfter: 9000 }]);
    expect(pickBarks(s, n, TABLE, BARK_RULES, NEW_BARK_MEMORY).after).toBeNull();
  });

  it('同じ状態からは同じ台詞を選ぶ（乱数を使わない）', () => {
    const s = start();
    const n = after(s, [act([uid(s, 'hero')]), { type: 'damage', sourceId: uid(s, 'hero'), targetId: enemyUid(s), amount: 30, affinity: 'weak', hpAfter: 9000 }]);
    const a = pickBarks(s, n, BARKS, BARK_RULES, NEW_BARK_MEMORY);
    const b = pickBarks(s, n, BARKS, BARK_RULES, NEW_BARK_MEMORY);
    expect(a).toEqual(b);
    expect(n.rng).toBe(s.rng);
  });
});

describe('ひとことのデータ', () => {
  it('どの台詞の表情も、その人の会話の表情にある', () => {
    for (const [id, triggers] of Object.entries(BARKS)) {
      const cast = CAST[BARK_CAST[id]];
      expect(cast, id).toBeDefined();
      for (const lines of Object.values(triggers)) for (const l of lines ?? []) expect(Object.keys(cast.faces), `${id} ${l.text}`).toContain(l.face);
    }
  });

  it('連携技の2人には、呼ぶ台詞と答える台詞がある', () => {
    for (const link of LINKS) for (const id of link.members) {
      expect(BARKS[id]?.linkCall?.length, id).toBeGreaterThan(0);
      expect(BARKS[id]?.linkAnswer?.length, id).toBeGreaterThan(0);
    }
  });
});
