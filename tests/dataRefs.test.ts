import { describe, expect, it } from 'vitest';
import type { EnemyDef, NaviPartDef } from '../src/core';
import { allBattles, CLOCK_ACTIONS, parseClockTime } from '../src/core';
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

  it('素材・アイテムを時分解してできる記憶の欠片は、本当にある欠片。敵の落とし物と部位の素材は、本当にある素材（段階27b）', async () => {
    const { decomposeFragment } = await import('../src/core');
    const { WEAPON_DATA, knownEnemies } = await import('../src/data');
    for (const it of Object.values(ITEMS)) expect(has(FRAGMENTS, decomposeFragment(WEAPON_DATA, it.id)), it.name).toBe(true);
    for (const e of knownEnemies()) {
      const ids = [...(e.drops ?? []), ...Object.values(e.dropTable ?? {}), ...(e.parts ?? []).flatMap((p) => (p.drop ? [p.drop] : []))];
      for (const id of ids) expect(ITEMS[id as keyof typeof ITEMS]?.kind, `${e.name}：${id}`).toBe('material');
    }
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

describe('敵の絵（段階37）', () => {
  it('敵の絵の対応は、区画の敵の id と、台帳の絵を指す', async () => {
    const { AREA_BATTLES, ASSETS, ENEMY_ART } = await import('../src/data');
    const enemyIds = new Set(Object.values(AREA_BATTLES).flatMap((b) => b.enemies.map((e) => e.id)));
    for (const [id, art] of Object.entries(ENEMY_ART)) {
      expect(enemyIds.has(id), id).toBe(true);
      expect(ASSETS.find((a) => a.id === art)?.kind, art).toBe('image');
    }
  });
});

describe('物語の流れ（段階23・34）', () => {
  it('書き間違いがなく、会話の出来事と日常の印の場面は台本にあり、通しで見る場面は全部どこかで読める', async () => {
    const { AREA_BATTLES, AREAS, ASSETS, BACKDROPS, BOND_EVENTS, BOND_PARTNER_NAMES, DAILY_HUBS, ITEMS, RETURN_VISITS, SCENES, M1_SCENE_ORDER, SLICE_FLOW, TOWN } = await import('../src/data');
    const { checkArea, checkBonds, checkDailyHub, checkFlow, checkVisits, flowEvents, isPlaceholder, returnDays, visitsFor } = await import('../src/core');
    const shownVisits = new Set<string>();
    expect(checkFlow(SLICE_FLOW)).toEqual([]);
    const sceneIds = new Set(SCENES.map((s) => s.id));
    const reachable = new Set<string>();
    for (const e of flowEvents(SLICE_FLOW)) {
      // 仮の画面の出来事（段階34）は、中身を作る段階で確かめる。会話の場面は、まだ台本にない
      if (isPlaceholder(e)) {
        if (e.kind === 'dialogue') expect(sceneIds.has(e.id), e.id).toBe(false);
        continue;
      }
      if (e.kind === 'dialogue') {
        expect(sceneIds.has(e.id), e.id).toBe(true);
        reachable.add(e.id);
      }
      if (e.kind === 'daily') {
        const hub = DAILY_HUBS[e.id];
        expect(hub, e.id).toBeDefined();
        expect(checkDailyHub(hub)).toEqual([]);
        // 誰と過ごすか（段階35）：会える相手には絆の出来事があり、その場面は台本にある
        for (const partner of hub.partners ?? []) {
          expect(BOND_EVENTS[partner], `${e.id} ${partner}`).toBeDefined();
          expect(BOND_PARTNER_NAMES[partner], partner).toBeDefined();
          for (const b of BOND_EVENTS[partner]) {
            expect(sceneIds.has(b.id), `${e.id} ${b.id}`).toBe(true);
            if (b.from <= (hub.day ?? 0)) reachable.add(b.id);
          }
        }
        // 返した翌日の出来事（段階36）：通しで遊んで全部返した時に、その日に出るもの
        for (const v of visitsFor(hub, RETURN_VISITS, returnDays(SLICE_FLOW, e.id, Object.keys(AREAS)))) {
          expect(sceneIds.has(v.id), `${e.id} ${v.id}`).toBe(true);
          shownVisits.add(v.id);
          reachable.add(v.id);
        }
        for (const p of hub.places) {
          expect(p.backdrop in BACKDROPS, `${e.id} ${p.backdrop}`).toBe(true);
          for (const spot of p.spots) {
            if (spot.scene) {
              expect(sceneIds.has(spot.scene), `${e.id} ${spot.scene}`).toBe(true);
              expect(spot.id, spot.scene).toBe(spot.scene);
              reachable.add(spot.scene);
            }
          }
        }
      }
      if (e.kind === 'explore') {
        const area = AREAS[e.area ?? ''];
        expect(area, e.id).toBeDefined();
        expect(checkArea(area)).toEqual([]);
        for (const x of [...area.enemies, area.boss]) expect(x.battle in AREA_BATTLES, `${area.id} ${x.battle}`).toBe(true);
        // コマ（段階28）：全部集めると返すのに足り、雑魚戦だけでは足りない（最後のコマはボスから）
        const stormKoma = area.enemies.reduce((n, x) => n + (AREA_BATTLES[x.battle]?.koma ?? 0), 0);
        expect(stormKoma + (AREA_BATTLES[area.boss.battle]?.koma ?? 0), area.id).toBeGreaterThanOrEqual(area.komaNeed);
        expect(stormKoma, area.id).toBeLessThan(area.komaNeed);
        for (const b of Object.values(AREA_BATTLES)) for (const e of b.enemies) for (const d of e.drops ?? []) expect(d in ITEMS, `${e.id} ${d}`).toBe(true);
        for (const c of area.chests) for (const item of c.items) expect(item in ITEMS, `${c.id} ${item}`).toBe(true);
        for (const scene of [...area.talkers.map((t) => t.scene), ...area.triggers.map((t) => t.scene)]) {
          expect(sceneIds.has(scene), `${area.id} ${scene}`).toBe(true);
          reachable.add(scene);
        }
        for (const room of area.rooms) if (room.image) expect(ASSETS.some((a) => a.id === room.image), room.image).toBe(true);
      }
      if (e.kind === 'return') expect(AREAS[e.area ?? ''], e.id).toBeDefined();
    }
    for (const id of M1_SCENE_ORDER) expect(reachable.has(id), id).toBe(true);
    // 町の地図と絆の出来事（段階35）
    expect(checkBonds(BOND_EVENTS, TOWN)).toEqual([]);
    for (const p of Object.values(TOWN)) expect(p.backdrop in BACKDROPS, p.id).toBe(true);
    // 返す画面の記憶の景色（段階46d）
    for (const area of Object.values(AREAS)) if (area.memory) expect(area.memory in BACKDROPS, area.id).toBe(true);
    for (const events of Object.values(BOND_EVENTS)) for (const b of events) expect(reachable.has(b.id), b.id).toBe(true);
    // 返した翌日の出来事（段階36）：書き間違いがなく、どれも返した次の日の昼に出る
    expect(checkVisits(RETURN_VISITS, TOWN)).toEqual([]);
    for (const v of RETURN_VISITS) expect(shownVisits.has(v.id), v.id).toBe(true);
  });
});

describe('部屋と試しの区画（段階47）', () => {
  it('部屋の一覧に書き間違いがなく、試しの区画は区画の決まりを満たし、戦闘と絵がある', async () => {
    const { AREA_BATTLES, ASSETS, ENEMY_MOVES, ROOMS, TRIAL_AREAS } = await import('../src/data');
    const { checkArea, checkRoom } = await import('../src/core');
    for (const room of Object.values(ROOMS) as import('../src/core').RoomDef[]) {
      expect(checkRoom(room), room.id).toEqual([]);
      if (room.image) expect(ASSETS.some((a) => a.id === room.image), room.image).toBe(true);
    }
    for (const area of Object.values(TRIAL_AREAS)) {
      expect(checkArea(area)).toEqual([]);
      for (const e of [...area.enemies, area.boss]) expect(AREA_BATTLES[e.battle], e.id).toBeDefined();
      // 4種類の動きを全部置いている
      expect(new Set(area.enemies.map((e) => e.move ?? 'patrol'))).toEqual(new Set(Object.keys(ENEMY_MOVES)));
      expect(area.rooms.length).toBeGreaterThan(1);
    }
  });
});

describe('パーティと育成の開放（段階26）', () => {
  it('どの章のパーティも書き間違いがなく、探索の章には自分のパーティがある。1章はハルトとあかりで、ムーブメントは閉じている', async () => {
    const { CHAPTER1_LINEUP, PARTY, PROTOTYPE_LINEUP, SLICE_FLOW } = await import('../src/data');
    const { checkLineup, isPlaceholder } = await import('../src/core');
    const ids = PARTY.map((c) => c.id);
    expect(checkLineup(PROTOTYPE_LINEUP, ids)).toEqual([]);
    for (const c of SLICE_FLOW) {
      if (c.lineup) expect(checkLineup(c.lineup, ids), c.id).toEqual([]);
      if (c.events.some((e) => e.kind === 'explore' && !isPlaceholder(e))) expect(c.lineup, c.id).toBeDefined();
    }
    expect(SLICE_FLOW.find((c) => c.id === 'ch1')?.lineup).toBe(CHAPTER1_LINEUP);
    expect(CHAPTER1_LINEUP.members).toEqual(['hero', 'akari']);
    expect(CHAPTER1_LINEUP.unlocks).toEqual({ growth: true, navi: false, weapon: true });
  });

  it('2章（段階38）はみおが加わって3人で、ムーブメントも開く。みおが仲間になる 5-C より前の2章に戦闘はない', async () => {
    const { CHAPTER1_LINEUP, CHAPTER2_LINEUP, SLICE_FLOW } = await import('../src/data');
    const { lineupAt } = await import('../src/core');
    expect(SLICE_FLOW.find((c) => c.id === 'ch2')?.lineup).toBe(CHAPTER2_LINEUP);
    expect(CHAPTER2_LINEUP.members).toEqual(['hero', 'akari', 'mio']);
    expect(CHAPTER2_LINEUP.unlocks).toEqual({ growth: true, navi: true, weapon: true });
    expect(lineupAt(SLICE_FLOW, 'a21_explore', CHAPTER1_LINEUP)).toBe(CHAPTER2_LINEUP);
    expect(lineupAt(SLICE_FLOW, 'a12_explore', CHAPTER1_LINEUP)).toBe(CHAPTER1_LINEUP);
    const ch2 = SLICE_FLOW.find((c) => c.id === 'ch2')!.events;
    const join = ch2.findIndex((e) => e.id === 'd5_evening');
    expect(join).toBeGreaterThan(0);
    expect(ch2.slice(0, join).some((e) => e.kind === 'explore')).toBe(false);
  });

  it('ギア（段階38）は戦闘では落とさず、ムーブメントが開いている章の区画の、宝箱と会話のごほうびで手に入る', async () => {
    const { AREAS, NAVI_PARTS, SLICE_FLOW } = await import('../src/data');
    const naviAreas = new Set(SLICE_FLOW.filter((c) => c.lineup?.unlocks.navi).flatMap((c) => c.events.flatMap((e) => (e.kind === 'explore' && e.area ? [e.area] : []))));
    for (const area of Object.values(AREAS)) {
      const gears = [...area.chests.flatMap((c) => c.gears ?? []), ...area.triggers.flatMap((t) => t.gears ?? [])];
      for (const g of gears) expect(NAVI_PARTS[g as keyof typeof NAVI_PARTS], `${area.id} ${g}`).toBeDefined();
      if (gears.length > 0) expect(naviAreas.has(area.id), area.id).toBe(true);
    }
    // 2-1-4 で、みおが拾った歯車を渡す
    expect(AREAS.a21.triggers.find((t) => t.scene === 'a21_checkpoint')?.gears?.length).toBeGreaterThan(0);
  });

  it('2-2（段階39b）は部屋をつなぐ形：6部屋すべてに行け、体育館へは渡り廊下の番人を倒すと入れる。コマを持つ砂嵐は、ボスを起こすのにちょうど足りる', async () => {
    const { AREAS, AREA_BATTLES } = await import('../src/data');
    const { passDoor, startExplore, exitCells, roomOf, reachableCells } = await import('../src/core');
    const area = AREAS.a22;
    expect(area.rooms).toHaveLength(6);
    expect(Object.keys(reachableCells(area)).sort()).toEqual(area.rooms.map((r) => r.id).sort());
    const atCorridor = { ...startExplore(area), room: 'school_corridor' };
    const door = exitCells(roomOf(area, 'school_corridor'), 'top')[1];
    expect(passDoor(area, atCorridor, door)?.type).toBe('locked');
    const opened = passDoor(area, { ...atCorridor, defeated: ['a22_e_stage'] }, door);
    expect(opened?.type === 'moved' && opened.state.room).toBe('school_gym');
    // 番人は渡り廊下の印。逃げる敵はコマを持たない寄り道
    expect(area.enemies.find((e) => e.id === 'a22_e_stage')?.move).toBe('guard');
    expect(AREA_BATTLES[area.enemies.find((e) => e.move === 'flee')!.battle].koma ?? 0).toBe(0);
    const storms = area.enemies.reduce((n, e) => n + (AREA_BATTLES[e.battle].koma ?? 0), 0);
    const boss = AREA_BATTLES[area.boss.battle].koma ?? 0;
    expect(storms).toBeLessThan(area.komaNeed);
    expect(storms + boss).toBeGreaterThanOrEqual(area.komaNeed);
  });

  it('2-3（段階40）は部屋をつなぐ形で、ダイヤモンドへは番人を倒すと入れる。返す出来事の代わりに、カイの負け戦（物語の戦闘）が続く', async () => {
    const { AREAS, AREA_BATTLES, SLICE_FLOW } = await import('../src/data');
    const { flowEvents, reachableCells } = await import('../src/core');
    const area = AREAS.a23;
    expect(area.rooms).toHaveLength(6);
    expect(Object.keys(reachableCells(area)).sort()).toEqual(area.rooms.map((r) => r.id).sort());
    expect(area.links?.find((l) => l.b.room === 'riverside_diamond')?.opensWhen).toBe('a23_e_gate');
    const events = flowEvents(SLICE_FLOW);
    // 物語の戦闘は区画の戦闘を指し、打ち切り（負け戦）がある
    for (const e of events.filter((x) => x.kind === 'battle')) expect(AREA_BATTLES[e.battle ?? '']?.cutoff, e.id).toBeDefined();
    const i = events.findIndex((e) => e.id === 'a23_explore');
    expect(events.slice(i + 1, i + 4).map((e) => e.kind)).toEqual(['dialogue', 'battle', 'dialogue']);
    expect(events.some((e) => e.kind === 'return' && e.area === 'a23')).toBe(false);
    // 2章の終わりまで、仮の画面はない
    const { isPlaceholder } = await import('../src/core');
    expect(events.filter((e) => isPlaceholder(e)).map((e) => e.id)).toEqual([]);
  });

  it('1章の2人で、区画の戦闘が最後まで進み、勝敗がつく', async () => {
    const { AREA_BATTLES, CHAPTER1_LINEUP, PARTY, createCampaignSetup } = await import('../src/data');
    const { createBattle, lineupMembers } = await import('../src/core');
    const { autoPlay } = await import('../src/sim/autoBattle');
    const two = lineupMembers(PARTY, CHAPTER1_LINEUP);
    for (const battle of Object.values(AREA_BATTLES)) {
      for (const seed of [1, 2, 3]) {
        const s = autoPlay(createBattle(createCampaignSetup(battle, seed, two)), seed);
        expect(s.allies.map((a) => a.uid), battle.id).toEqual(['hero', 'akari']);
        expect(s.links.map((l) => l.id), battle.id).toEqual(['afterglow']);
        expect(s.outcome, `${battle.id} ${seed}`).not.toBe('ongoing');
      }
    }
  });
});

describe('台本（段階22。M1・M2）', () => {
  it('行き先がそろっていて、通しで見る順番の場面が全部ある', async () => {
    const { SCENES, M1_SCENE_ORDER } = await import('../src/data');
    const { checkScript } = await import('../src/core');
    expect(checkScript(SCENES)).toEqual([]);
    const ids = new Set(SCENES.map((s) => s.id));
    for (const id of M1_SCENE_ORDER) expect(ids.has(id), id).toBe(true);
  });

  it('立ち絵のある人は台帳に表情の絵があり、台詞の人と表情は一覧にある', async () => {
    const { ASSETS, CAST, SCENES } = await import('../src/data');
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
    for (const scene of SCENES) {
      for (const step of scene.steps) {
        if (step.kind !== 'line' || step.style !== 'talk') continue;
        const where = `${scene.id}（${step.src}行目）`;
        const def = CAST[step.speaker!];
        expect(def, `${where} ${step.speaker}`).toBeDefined();
        if (step.face) expect(Object.keys(def.faces), `${where} ${step.face}`).toContain(step.face);
      }
    }
  });

  it('台本の効果音は、その場で作る砂の音のほかは、すべて台帳の音が鳴る（段階31c）', async () => {
    const { SCRIPT_SE, SAND_SOUND, ASSETS } = await import('../src/data');
    for (const [name, id] of Object.entries(SCRIPT_SE)) {
      if (name === 'sand') expect(id, name).toBeNull();
      else expect(ASSETS.find((a) => a.id === id)?.kind, name).toBe('audio');
    }
    expect(SAND_SOUND.fadeInSec + SAND_SOUND.fadeOutSec).toBeLessThan(SAND_SOUND.durationSec);
  });

  it('行動順の顔は、台帳にある立ち絵を使う（段階32a 調整1）', async () => {
    const { ALLY_FACE, ASSETS, PARTY } = await import('../src/data');
    for (const [id, face] of Object.entries(ALLY_FACE)) {
      expect(PARTY.some((c) => c.id === id), id).toBe(true);
      expect(ASSETS.find((a) => a.id === face)?.kind, face).toBe('image');
    }
  });

  it('演出の命令は、ある背景・1枚絵・音・人だけを使う', async () => {
    const { ACTOR_MOTIONS, BACKDROPS, CAST, CGS, EMOTES, FACE_EMOTES, FACE_MOTIONS, SCENES, SCRIPT_BGM, SCRIPT_SE, ASSETS } = await import('../src/data');
    for (const m of Object.values(FACE_MOTIONS)) expect(ACTOR_MOTIONS as readonly string[]).toContain(m);
    for (const e of Object.values(FACE_EMOTES)) expect(EMOTES as readonly string[]).toContain(e);
    const assetIds = new Set(ASSETS.map((a) => a.id));
    for (const def of [...Object.values(BACKDROPS), ...Object.values(CGS)]) if (def.image) expect(assetIds.has(def.image), def.title).toBe(true);
    for (const id of [...Object.values(SCRIPT_BGM), ...Object.values(SCRIPT_SE)]) if (id) expect(assetIds.has(id), id).toBe(true);
    for (const scene of SCENES) {
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
        if (step.name === 'clock') {
          expect(CLOCK_ACTIONS as readonly string[], where).toContain(a);
          if (a === 'show') expect(parseClockTime(step.args[1] ?? ''), where).not.toBeNull();
          if (a === 'tick' && step.args[1] !== undefined) expect(step.args[1], where).toBe('many');
        }
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
    const { SCENES } = await import('../src/data');
    for (const scene of SCENES) {
      for (const step of scene.steps) {
        if (step.kind === 'line' && step.style !== 'note') expect(step.text.length, `${scene.id}（${step.src}行目）${step.text}`).toBeLessThanOrEqual(60);
      }
    }
  });

  it('どの台詞にも、どれかの選択肢を選べばたどり着ける（読まれない行がない）', async () => {
    const { SCENES } = await import('../src/data');
    const { chooseOption, runScript } = await import('../src/core');
    for (const scene of SCENES) {
      const seen = new Set<number>();
      const visit = (pos: { scene: string; index: number }, depth: number) => {
        expect(depth, scene.id).toBeLessThan(50);
        for (;;) {
          const r = runScript(SCENES, pos, {});
          if (r.stop.type === 'end') return;
          if (r.stop.type === 'choice') {
            r.stop.choice.options.forEach((_, i) => visit(chooseOption(SCENES, r.pos, i), depth + 1));
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
