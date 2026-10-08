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

describe('M1 の台本（段階22）', () => {
  it('行き先がそろっていて、通しで見る順番の場面が全部ある', async () => {
    const { M1_SCENES, M1_SCENE_ORDER } = await import('../src/data');
    const { checkScript } = await import('../src/core');
    expect(checkScript(M1_SCENES)).toEqual([]);
    const ids = new Set(M1_SCENES.map((s) => s.id));
    for (const id of M1_SCENE_ORDER) expect(ids.has(id), id).toBe(true);
  });

  it('立ち絵のある人は台帳に表情の絵があり、台詞の人と表情は一覧にある', async () => {
    const { ASSETS, CAST, M1_SCENES } = await import('../src/data');
    const ids = new Set(ASSETS.map((a) => a.id));
    for (const [name, def] of Object.entries(CAST)) {
      expect(def.faces[def.firstFace], name).toBeDefined();
      if (!def.portrait) continue;
      // 絵のある表情か、まだ絵がなければ代わりの表情（fallback）に絵がある
      for (const [face, id] of Object.entries(def.faces)) {
        const alt = def.fallback?.[face];
        const ok = ids.has(`${def.portrait}.${id}`) || (alt !== undefined && ids.has(`${def.portrait}.${def.faces[alt]}`));
        expect(ok, `${name} ${face}`).toBe(true);
      }
      for (const [face, alt] of Object.entries(def.fallback ?? {})) {
        expect(def.faces[face], `${name} ${face}`).toBeDefined();
        expect(def.faces[alt], `${name} ${face} → ${alt}`).toBeDefined();
      }
    }
    for (const scene of M1_SCENES) {
      for (const step of scene.steps) {
        if (step.kind !== 'line' || step.style !== 'talk') continue;
        const where = `${scene.id}（${step.src}行目）`;
        const def = CAST[step.speaker!];
        expect(def, `${where} ${step.speaker}`).toBeDefined();
        if (step.face) expect(Object.keys(def.faces), `${where} ${step.face}`).toContain(step.face);
      }
    }
  });

  it('演出の命令は、ある背景・1枚絵・音・人だけを使う', async () => {
    const { ACTOR_MOTIONS, BACKDROPS, CAST, CGS, EMOTES, FACE_EMOTES, FACE_MOTIONS, M1_SCENES, SCRIPT_BGM, SCRIPT_SE, ASSETS } = await import('../src/data');
    for (const m of Object.values(FACE_MOTIONS)) expect(ACTOR_MOTIONS as readonly string[]).toContain(m);
    for (const e of Object.values(FACE_EMOTES)) expect(EMOTES as readonly string[]).toContain(e);
    const assetIds = new Set(ASSETS.map((a) => a.id));
    for (const def of [...Object.values(BACKDROPS), ...Object.values(CGS)]) if (def.image) expect(assetIds.has(def.image), def.title).toBe(true);
    for (const id of [...Object.values(SCRIPT_BGM), ...Object.values(SCRIPT_SE)]) if (id) expect(assetIds.has(id), id).toBe(true);
    for (const scene of M1_SCENES) {
      for (const step of scene.steps) {
        if (step.kind !== 'command') continue;
        const where = `${scene.id}（${step.src}行目）`;
        const [a] = step.args;
        if (step.name === 'bg') expect(a === 'none' || a in BACKDROPS, where).toBe(true);
        if (step.name === 'cg') expect(a === 'off' || a in CGS, where).toBe(true);
        if (step.name === 'bgm') expect(a === 'stop' || a in SCRIPT_BGM, where).toBe(true);
        if (step.name === 'se') expect(a in SCRIPT_SE, `${where} ${a}`).toBe(true);
        if (step.name === 'cast') {
          expect(step.args.length, where).toBeLessThanOrEqual(3);
          for (const n of step.args) expect(n in CAST, `${where} ${n}`).toBe(true);
        }
        if (step.name === 'fade') expect(['out', 'in', 'white'], where).toContain(a);
        if (step.name === 'wait') expect(Number(a), where).toBeGreaterThan(0);
        if (step.name === 'set') expect(step.args.length, where).toBeGreaterThanOrEqual(2);
        if (step.name === 'act') {
          expect(step.args[0] in CAST, `${where} ${step.args[0]}`).toBe(true);
          expect(ACTOR_MOTIONS as readonly string[], where).toContain(step.args[1]);
        }
        if (step.name === 'emote') {
          expect(step.args[0] in CAST, `${where} ${step.args[0]}`).toBe(true);
          expect(EMOTES as readonly string[], where).toContain(step.args[1]);
        }
        if (step.name === 'zoom') expect(Number(a) >= 1 && Number(a) <= 1.5, where).toBe(true);
        if (step.name === 'mono') expect(['on', 'off'], where).toContain(a);
        if (step.name === 'noise') expect(Number(a), where).toBeGreaterThan(0);
      }
    }
  });

  it('文字の音の高さは、スマホのスピーカーで聞こえる範囲にある', async () => {
    const { CAST, VOICE_DEFAULT, VOICE_ONLY, VOICE_PITCH_RANGE } = await import('../src/data');
    const voices = [...Object.entries(CAST).map(([n, c]) => [n, c.voice] as const), ...Object.entries(VOICE_ONLY), ['（ほかの人）', VOICE_DEFAULT] as const];
    for (const [name, v] of voices) {
      expect(v.pitch, name).toBeGreaterThanOrEqual(VOICE_PITCH_RANGE.min);
      expect(v.pitch, name).toBeLessThanOrEqual(VOICE_PITCH_RANGE.max);
    }
  });

  it('本文はスマホの会話の枠に収まる長さ（60文字まで）', async () => {
    const { M1_SCENES } = await import('../src/data');
    for (const scene of M1_SCENES) {
      for (const step of scene.steps) {
        if (step.kind === 'line' && step.style !== 'note') expect(step.text.length, `${scene.id}（${step.src}行目）${step.text}`).toBeLessThanOrEqual(60);
      }
    }
  });

  it('どの台詞にも、どれかの選択肢を選べばたどり着ける（読まれない行がない）', async () => {
    const { M1_SCENES } = await import('../src/data');
    const { chooseOption, runScript } = await import('../src/core');
    for (const scene of M1_SCENES) {
      const seen = new Set<number>();
      const visit = (pos: { scene: string; index: number }, depth: number) => {
        expect(depth, scene.id).toBeLessThan(50);
        for (;;) {
          const r = runScript(M1_SCENES, pos, {});
          if (r.stop.type === 'end') return;
          if (r.stop.type === 'choice') {
            r.stop.choice.options.forEach((_, i) => visit(chooseOption(M1_SCENES, r.pos, i), depth + 1));
            return;
          }
          seen.add(r.stop.line.src);
          pos = r.pos;
        }
      };
      visit({ scene: scene.id, index: 0 }, 0);
      for (const step of scene.steps) if (step.kind === 'line') expect(seen.has(step.src), `${scene.id}（${step.src}行目）`).toBe(true);
    }
  });
});

describe('探索の試作の地図（段階16・18b）', () => {
  it('どの地図も、出発点から宝箱・チェックポイント・ボスの印・敵の道へ歩いて行ける', async () => {
    const { PROTO_MAPS, ASSETS } = await import('../src/data');
    const { findPath, isWalkable, parseGrid } = await import('../src/core');
    for (const [key, def] of Object.entries(PROTO_MAPS)) {
      const map = parseGrid(def.layout);
      expect(new Set(def.layout.map((l) => l.length)).size, key).toBe(1);
      const cells = def.layout.flatMap((line, r) => [...line].map((ch, c) => ({ ch, cell: [c, r] as [number, number] })));
      const start = cells.filter((x) => x.ch === 'S');
      expect(start.length, key).toBe(1);
      for (const x of cells.filter((x) => 'CPB'.includes(x.ch))) {
        expect(findPath(map, start[0].cell, x.cell), `${key} ${x.ch} ${x.cell}`).not.toBeNull();
      }
      for (const points of def.patrols) {
        for (const p of points) {
          expect(isWalkable(map, p), `${key} ${p}`).toBe(true);
          expect(findPath(map, start[0].cell, p), `${key} ${p}`).not.toBeNull();
        }
      }
      if ('image' in def) expect(ASSETS.some((a) => a.id === def.image), key).toBe(true);
    }
  });
});
