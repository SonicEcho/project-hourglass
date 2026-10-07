import { describe, expect, it } from 'vitest';
import type { EnemyDef, NaviPartDef } from '../src/core';
import { allBattles } from '../src/core';
import {
  BOSS_PART_REWARDS,
  CARDS,
  COMBOS,
  FOLDER,
  FRAGMENTS,
  GROWTH_MAP,
  ITEMS,
  LINKS,
  NAVI_BOARDS,
  NAVI_PARTS,
  NAVI_REWARD_CANDIDATES,
  PARTY,
  SKILLS,
  START_NAVI_PARTS,
  STORY,
  WEAPON_DATA,
} from '../src/data';

// データのつながりの確認（段階17）。参照している名前（id）が本当にあるかを確かめる

const has = (record: Record<string, unknown>, id: string) => Object.prototype.hasOwnProperty.call(record, id);
const partyIds = PARTY.map((c) => c.id);
const battles = allBattles(STORY);
const enemies: EnemyDef[] = battles.flatMap((b) => b.enemies);

describe('名前（id）がそろっている', () => {
  it.each([
    ['スナップ', CARDS],
    ['魔法・スキル', SKILLS],
    ['ギア', NAVI_PARTS],
    ['素材・アイテム', ITEMS],
    ['記憶の欠片', FRAGMENTS],
    ['武器', WEAPON_DATA.weapons],
  ] as [string, Record<string, { id: string }>][])('%s：表のキーと中身の id が同じ', (_label, record) => {
    for (const [key, v] of Object.entries(record)) expect(v.id).toBe(key);
  });

  it('仲間・コンボ・連携技・戦闘・章・区画の id が重ならない', () => {
    for (const ids of [
      partyIds,
      COMBOS.map((c) => c.id),
      LINKS.map((l) => l.id),
      battles.map((b) => b.id),
      STORY.map((c) => c.id),
      STORY.flatMap((c) => c.areas.map((a) => a.id)),
    ]) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('参照している名前が本当にある', () => {
  it('敵が落とす素材は素材（material）', () => {
    for (const e of enemies) for (const d of e.drops ?? []) expect(ITEMS[d as keyof typeof ITEMS]?.kind, `${e.name}：${d}`).toBe('material');
  });

  it('戦闘でもらえるアイテムはアイテム（item）、ギアの候補はギア', () => {
    for (const b of battles) {
      if (b.item) expect(ITEMS[b.item as keyof typeof ITEMS]?.kind, b.id).toBe('item');
      for (const p of b.naviReward ?? []) expect(has(NAVI_PARTS, p), `${b.id}：${p}`).toBe(true);
    }
    for (const p of [...START_NAVI_PARTS, ...NAVI_REWARD_CANDIDATES.flat()]) expect(has(NAVI_PARTS, p), p).toBe(true);
  });

  it('ボスの部位のギアは、本当にある部位とギア', () => {
    const partIds = enemies.flatMap((e) => (e.parts ?? []).map((p) => p.id));
    for (const [part, gear] of Object.entries(BOSS_PART_REWARDS)) {
      expect(partIds, part).toContain(part);
      expect(has(NAVI_PARTS, gear), gear).toBe(true);
    }
  });

  it('敵の行動が使う部位は、その敵の部位', () => {
    for (const e of enemies) for (const a of e.actions) if (a.requiresPart) expect(e.parts?.map((p) => p.id), `${e.name}：${a.name}`).toContain(a.requiresPart);
  });

  it('アルバムのスナップとコンボの材料は、本当にあるスナップ', () => {
    for (const f of FOLDER) expect(CARDS[f.card.id as keyof typeof CARDS], f.card.id).toBe(f.card);
    for (const c of COMBOS) for (const id of c.cards) expect(has(CARDS, id), `${c.name}：${id}`).toBe(true);
  });

  it('連携技の2人は、本当にいる仲間', () => {
    for (const l of LINKS) for (const m of l.members) expect(partyIds, `${l.name}：${m}`).toContain(m);
  });

  it('仲間の最初の魔法・スキルと、星図のマスの魔法・スキル・出発点', () => {
    for (const c of PARTY) for (const s of c.skills) expect(SKILLS[s.id as keyof typeof SKILLS], `${c.name}：${s.id}`).toBe(s);
    for (const n of GROWTH_MAP.nodes) {
      if (n.kind === 'skill') expect(has(SKILLS, n.skillId), n.id).toBe(true);
      if (n.kind === 'start') expect(partyIds, n.id).toContain(n.owner);
    }
    // 出発点は仲間1人に1つ
    expect(GROWTH_MAP.nodes.filter((n) => n.kind === 'start').map((n) => (n.kind === 'start' ? n.owner : '')).sort()).toEqual([...partyIds].sort());
  });

  it('素材・アイテムから出る記憶の欠片は、本当にある欠片', () => {
    for (const it of Object.values(ITEMS)) for (const id of Object.keys(it.fragments)) expect(has(FRAGMENTS, id), `${it.name}：${id}`).toBe(true);
  });
});

describe('仲間ごとに1つずつ', () => {
  it('仲間1人に武器1本。進化先の id は重ならない', () => {
    const owners = Object.values(WEAPON_DATA.weapons).map((w) => w.owner).sort();
    expect(owners).toEqual([...partyIds].sort());
    const evo = Object.values(WEAPON_DATA.weapons).flatMap((w) => w.evolutions.map((e) => e.id));
    expect(new Set(evo).size).toBe(evo.length);
  });

  it('仲間1人に盤1枚', () => {
    expect(Object.keys(NAVI_BOARDS).sort()).toEqual([...partyIds].sort());
  });

  it('ギアの形は1〜4マスで、重なっていない', () => {
    for (const p of Object.values(NAVI_PARTS as Record<string, NaviPartDef>)) {
      expect(p.cells.length, p.id).toBeGreaterThanOrEqual(1);
      expect(p.cells.length, p.id).toBeLessThanOrEqual(4);
      expect(new Set(p.cells.map(([c, r]) => `${c},${r}`)).size, p.id).toBe(p.cells.length);
    }
  });
});
