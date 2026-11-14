import { describe, expect, it } from 'vitest';
import { createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPassive, type ChainPlanStep, type ChainState } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';

// 段階199（段階G5a）：ギアの効果の仕組み（対策・条件・両刃）

const BASE = CHAIN_TRIALS[0];
const foe = (over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id: 'foe', name: '的', hp: 9999, atk: 20, def: 10, weak: [], resist: [], pattern: [{ id: 'hit', name: 'たたく', at: 9, element: 'physical', power: 30 }], ...over });
const atk: ChainMove = { id: 'a', name: 'a', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40 }, text: '' };
const all: ChainMove = { id: 'all', name: 'all', type: 'attack', weight: 2, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 40 }, text: '' };
function solo(passives: ChainPassive[] = [], enemies: ChainEnemyDef[] = [foe()], over: Partial<ChainBattleDef> = {}): ChainState {
  const hero = BASE.allies.find((a) => a.id === 'hero')!;
  const def: ChainBattleDef = { ...BASE, allies: [{ ...hero, hp: 500, mp: 99, moves: [...hero.moves, atk, all], passives }], enemies, variants: undefined, ...over };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = [];
  return s;
}
const mv = (moveId: string, target?: string): ChainPlanStep => ({ ally: 'hero', source: { kind: 'move', moveId }, target, addons: [] });
const events = (r: { frames: { events: ChainEvent[] }[] }) => r.frames.flatMap((f) => f.events);
const dmg = (r: { frames: { events: ChainEvent[] }[] }, to?: string) =>
  events(r).filter((e): e is Extract<ChainEvent, { type: 'damage' }> => e.type === 'damage' && e.from === 'hero' && (!to || e.to === to)).reduce((a, e) => a + e.amount, 0);
const hit = (s: ChainState, moveId = 'a', t?: string) => runChainRound(s, [mv(moveId, t ?? s.enemies[0].uid)]);
const taken = (s: ChainState, plan: ChainPlanStep[] = []) => s.allies[0].hp - runChainRound(s, plan).state.allies[0].hp;

describe('対策のギア（段階199）', () => {
  it('シェルクラック：バリアを最初の1発で割って、そのまま当たる', () => {
    const shell = foe({ trait: 'shell', shellHits: 2 });
    expect(dmg(hit(solo([], [shell])))).toBe(0);
    expect(dmg(hit(solo([{ kind: 'shellCrack', count: 1 }], [shell])))).toBeGreaterThan(0);
  });
  it('アーマーピアス：かたいに減らされない', () => {
    const hard = foe({ trait: 'hard' });
    expect(dmg(hit(solo([{ kind: 'armorPierce', count: 1 }], [hard])))).toBeGreaterThan(dmg(hit(solo([], [hard]))));
  });
  it('ワイドショット：盾に吸われず、ねらった敵に当たる', () => {
    const enemies = [foe({ id: 'shield', trait: 'shield' }), foe({ id: 'back' })];
    const plain = solo([], enemies);
    const wide = solo([{ kind: 'wideShot', count: 1 }], enemies);
    expect(dmg(hit(plain, 'a', plain.enemies[1].uid), plain.enemies[1].uid)).toBe(0);
    expect(dmg(hit(wide, 'a', wide.enemies[1].uid), wide.enemies[1].uid)).toBeGreaterThan(0);
  });
  it('スプラッシュ：倒した敵の余ったダメージが、ほかの敵に飛ぶ', () => {
    const enemies = [foe({ id: 'weak1', hp: 5 }), foe({ id: 'next' })];
    const s = solo([{ kind: 'splash', count: 1 }], enemies);
    const r = hit(s);
    expect(r.state.enemies[0].hp).toBe(0);
    expect(dmg(r, s.enemies[1].uid)).toBeGreaterThan(0);
    expect(dmg(hit(solo([], enemies)), s.enemies[1].uid)).toBe(0);
  });
  it('ブラストシェルター：自爆のダメージが減る', () => {
    const bomb = foe({ trait: 'timer', timer: 1, timerPower: 40, pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 0 }] });
    expect(taken(solo([{ kind: 'blastGuard', rate: 0.7 }], [bomb]))).toBeLessThan(taken(solo([], [bomb])));
  });
  it('ミラーガード：反撃のダメージが減る', () => {
    const counter = foe({ trait: 'counter', pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 0 }] });
    expect(taken(solo([{ kind: 'counterGuard', rate: 0.5 }], [counter]), [mv('a', 'foe#0')])).toBeLessThan(taken(solo([], [counter]), [mv('a', 'foe#0')]));
  });
  it('タイムキーパー：ねばねばに当てても遅れない', () => {
    const sticky = foe({ trait: 'sticky' });
    expect(events(hit(solo([], [sticky]))).some((e) => e.type === 'sticky')).toBe(true);
    expect(events(hit(solo([{ kind: 'timeKeeper', count: 1 }], [sticky]))).some((e) => e.type === 'sticky')).toBe(false);
  });
  it('ブレイクタイム：自爆の敵と、全体攻撃を控えた敵に強く、予定を1マス後ろへ', () => {
    const big = foe({ pattern: [{ id: 'wave', name: '大波', at: 9, element: 'physical', power: 30, all: true }] });
    const s = solo([{ kind: 'breakTime', rate: 0.5 }], [big]);
    const r = hit(s);
    expect(dmg(r)).toBeGreaterThan(dmg(hit(solo([], [big]))));
    expect(events(r).some((e) => e.type === 'push' && e.by === 1)).toBe(true);
    expect(dmg(hit(solo([{ kind: 'breakTime', rate: 0.5 }])))).toBe(dmg(hit(solo())));
  });
  it('ハンター：回復役・リーダー・起こし役に強い', () => {
    const healer = foe({ trait: 'healer' });
    expect(dmg(hit(solo([{ kind: 'hunter', rate: 0.5 }], [healer])))).toBeGreaterThan(dmg(hit(solo([], [healer]))));
    expect(dmg(hit(solo([{ kind: 'hunter', rate: 0.5 }])))).toBe(dmg(hit(solo())));
  });
  it('ファインダー：予定隠しと弱点が、戦闘の始めから見える', () => {
    const veil = foe({ trait: 'veil', weak: ['ice'] });
    expect(solo([], [veil]).enemies[0].veiled).toBe(true);
    const s = solo([{ kind: 'finder', count: 1 }], [veil]);
    expect(s.enemies[0].veiled).toBe(false);
    expect(s.known.foe).toEqual(['ice']);
    expect(runChainRound(s, []).state.enemies[0].veiled).toBe(false);
  });
  it('ストップウォッチ：巻き戻しを、1戦に決まった回数まで止める', () => {
    const rewind = foe({ trait: 'rewind' });
    const plain = hit(solo([], [rewind]));
    expect(plain.state.enemies[0].hp).toBe(9999);
    const s = solo([{ kind: 'stopwatch', count: 1 }], [rewind]);
    const r1 = hit(s);
    expect(r1.state.enemies[0].hp).toBeLessThan(9999);
    expect(events(r1).some((e) => e.type === 'rewindStop')).toBe(true);
    const r2 = hit(r1.state);
    expect(r2.state.enemies[0].hp).toBe(r1.state.enemies[0].hp);
  });
});

describe('条件と両刃のギア（段階199）', () => {
  it('ボスキラー：ボス戦・ぬし戦だけ強い', () => {
    const g: ChainPassive[] = [{ kind: 'bossBoost', rate: 0.3 }];
    expect(dmg(hit(solo(g, [foe()], { boss: true })))).toBeGreaterThan(dmg(hit(solo([], [foe()], { boss: true }))));
    expect(dmg(hit(solo(g)))).toBe(dmg(hit(solo())));
  });
  it('群れ払い：敵が3体以上の時、全体攻撃が強い', () => {
    const three = [foe({ id: 'x' }), foe({ id: 'y' }), foe({ id: 'z' })];
    const g: ChainPassive[] = [{ kind: 'crowdBoost', rate: 0.3 }];
    expect(dmg(hit(solo(g, three), 'all'))).toBeGreaterThan(dmg(hit(solo([], three), 'all')));
    expect(dmg(hit(solo(g, three.slice(0, 2)), 'all'))).toBe(dmg(hit(solo([], three.slice(0, 2)), 'all')));
  });
  it('背水：HP が半分以下の時だけ強い', () => {
    const low = solo([{ kind: 'desperate', rate: 0.4 }]);
    low.allies[0].hp = Math.floor(low.allies[0].maxHp / 2);
    expect(dmg(hit(low))).toBeGreaterThan(dmg(hit(solo())));
    expect(dmg(hit(solo([{ kind: 'desperate', rate: 0.4 }])))).toBe(dmg(hit(solo())));
  });
  it('捨て身：威力が上がり、受けるダメージも増える', () => {
    const g: ChainPassive[] = [{ kind: 'reckless', rate: 0.3, taken: 0.2 }];
    expect(dmg(hit(solo(g)))).toBeGreaterThan(dmg(hit(solo())));
    expect(taken(solo(g))).toBeGreaterThan(taken(solo()));
  });
  it('一点集中：単体の攻撃は強く、全体の攻撃は弱い', () => {
    const g: ChainPassive[] = [{ kind: 'focus', rate: 0.4, spread: 0.5 }];
    expect(dmg(hit(solo(g)))).toBeGreaterThan(dmg(hit(solo())));
    expect(dmg(hit(solo(g), 'all'))).toBeLessThan(dmg(hit(solo(), 'all')));
  });
});

describe('絆のギアで3人のコンボを開く（段階200）', () => {
  it('3人のコンボは、bondLinks にある時だけ使える（2人のコンボはいつも）', async () => {
    const { buildMainChainBattle } = await import('../../src/core');
    const { A31_COMBOS, AKARI, HERO, MIO, GOLDFISH_NOISE } = await import('../../src/data');
    const make = (bondLinks?: string[]) =>
      buildMainChainBattle({ id: 'm', name: 'm', party: [HERO, AKARI, MIO], enemies: [GOLDFISH_NOISE], deck: BASE.deck, cards: BASE.cards, links: A31_COMBOS, bondLinks });
    expect(make().links.map((l) => l.id)).not.toContain('threeTimes');
    expect(make(['threeTimes']).links.map((l) => l.id)).toContain('threeTimes');
    expect(make().links.some((l) => l.members.length === 2)).toBe(true);
  });
});
