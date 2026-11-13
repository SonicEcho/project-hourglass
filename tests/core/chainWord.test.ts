import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainEncounterResult, chainTipTriggers, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep, type ChainState } from '../../src/core';
import { AKARI, CHAIN_RULES, CHAIN_TRIALS, HERO } from '../../src/data';

// 段階186：3-2 の踏切のぬし「言えなかった言葉」
const BASE = CHAIN_TRIALS[0];
const WORD: ChainMove = { id: 'word', name: 'あのね', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, perRound: 30 }, text: '' };
const lord = (hp = 99999): ChainEnemyDef => ({ id: 'lord', name: 'ぬし', hp, atk: 1, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 1 }] });
const alarm: ChainEnemyDef = { id: 'alarm', name: '警報機', hp: 1, atk: 0, def: 10, weak: [], resist: [], pattern: [], part: { of: 'lord' } };
const make = (withAlarm = true, hp = 99999): ChainState =>
  createChainBattle({ ...BASE, enemies: withAlarm ? [lord(hp), alarm] : [lord(hp)], variants: undefined, cards: { ...BASE.cards, word: WORD }, word: { card: 'word', part: 'alarm' } } as ChainBattleDef, CHAIN_RULES, 3);
const play = (s: ChainState): ChainPlanStep[] => [{ ally: s.allies[0].uid, source: { kind: 'card', index: s.hand.indexOf('word') }, target: s.enemies.find((e) => e.defId === 'lord')!.uid, addons: [] }];
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('言えなかった言葉（段階186）', () => {
  it('戦闘の始めに、手札に「あのね」が1枚入る（山札にはない）', () => {
    const s = make();
    expect(s.hand.filter((c) => c === 'word')).toHaveLength(1);
    expect(s.deck).not.toContain('word');
  });
  it('警報機が立っている間に出すと、警報にのまれて不発。札は手札に戻る', () => {
    const s = make();
    const r = runChainRound(s, play(s));
    expect(events(r).some((e) => e.type === 'wordSwallowed')).toBe(true);
    expect(r.state.hand).toContain('word');
    expect(r.state.wordSaid).toBeFalsy();
  });
  it('警報機がなければ言える。言った札はこの戦闘から消える。ラウンドが進むほど強い', () => {
    const s1 = make(false);
    const r1 = runChainRound(s1, play(s1));
    expect(events(r1).some((e) => e.type === 'wordSaid')).toBe(true);
    expect(r1.state.wordSaid).toBe(true);
    const all = [...r1.state.hand, ...r1.state.deck, ...r1.state.discard];
    expect(all).not.toContain('word');
    const dmg = (r: { frames: { events: ChainEvent[] }[] }) => (events(r).find((e) => e.type === 'damage' && e.from === s1.allies[0].uid) as Extract<ChainEvent, { type: 'damage' }>).amount;
    // 3ラウンド目に言うと、威力は 20 + 30×2 = 80（1ラウンド目は 20）
    let s3 = make(false);
    s3 = runChainRound(s3, []).state;
    s3 = runChainRound(s3, []).state;
    const r3 = runChainRound(s3, play(s3));
    expect(dmg(r3)).toBeGreaterThan(dmg(r1) * 3);
  });
  it('最後まで言わずに勝つと「なんでもない」（quiet）。言って勝つと quiet でない', () => {
    const quiet = make(false, 1);
    const rq = runChainRound(quiet, [{ ally: quiet.allies[0].uid, source: { kind: 'move', moveId: 'basic' }, target: quiet.enemies[0].uid, addons: [] }]);
    expect(rq.state.outcome).toBe('win');
    expect(chainEncounterResult(rq.state, [], 1).quiet).toBe(true);
    const said = make(false, 1);
    const rs = runChainRound(said, play(said));
    expect(rs.state.outcome).toBe('win');
    expect(chainEncounterResult(rs.state, [], 1).quiet).toBeUndefined();
  });
  it('本番の戦闘：言えなかった言葉の説明', () => {
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: [], chainEnemies: [lord(), alarm], deck: [], cards: { word: WORD }, word: { card: 'word', part: 'alarm' } });
    const s = createChainBattle(def, CHAIN_RULES, 1);
    expect(s.hand).toContain('word');
    expect(chainTipTriggers(s)).toContain('chain_word');
  });
});
