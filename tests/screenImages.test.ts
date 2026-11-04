import { describe, expect, it } from 'vitest';
import { battleImages, dailyImages, exploreImages, returnImages, screenImages } from '../src/assets/screenImages';
import { AREA_BATTLES, AREAS, ASSETS, DAILY_HUBS, ENEMY_ART } from '../src/data';

// 会話のほかの画面で使う絵（段階150）：探索・戦闘・日常・返す・拠点は、その画面で使う絵だけを待つ
const IMAGES = new Set(ASSETS.filter((a) => a.kind === 'image' && a.file && !a.id.endsWith('_src')).map((a) => a.id));

describe('会話のほかの画面で使う絵（段階150）', () => {
  it('探索は、区画の部屋の地図と、区画で出る敵の絵を待つ（ほかの区画の地図や、会話の立ち絵は待たない）', () => {
    const ids = exploreImages('a41');
    for (const room of AREAS.a41.rooms) if (room.image) expect(ids).toContain(room.image);
    expect(ids).toContain('enemy.bugcage_noise');
    expect(ids).toContain('enemy.river_boss');
    expect(ids).not.toContain('map.school_gate');
    expect(ids).not.toContain('portrait.taichi.normal');
    // 仲間の顔（顔のタブ・戦闘の丸）とタイルは入れる
    expect(ids).toContain('portrait.hero.normal');
    expect(ids).toContain('tile.hunt');
  });

  it('どの区画も、出る戦闘の敵の絵はすべて待つ（戦闘に入ってから図形が出ないように）', () => {
    for (const [id, area] of Object.entries(AREAS)) {
      const ids = new Set(exploreImages(id));
      const battles = [...(area.enemies ?? []).map((e) => e.battle), area.boss?.battle, ...Object.values(area.hunt?.tables ?? {}).flat()].filter((b): b is string => !!b);
      for (const b of battles) for (const e of AREA_BATTLES[b]?.enemies ?? []) if (ENEMY_ART[e.id]) expect(ids.has(ENEMY_ART[e.id]), `${id}：${b} の ${e.id}`).toBe(true);
    }
  });

  it('待つ絵は、全部の絵よりずっと少ない（探索で3割より少ない）', () => {
    for (const id of Object.keys(AREAS)) expect(exploreImages(id).filter((x) => IMAGES.has(x)).length).toBeLessThan(IMAGES.size * 0.3);
  });

  it('戦闘・日常・返すも、その画面の絵を集める', () => {
    expect(battleImages(['a41_boss'])).toContain('enemy.river_boss');
    const hub = Object.keys(DAILY_HUBS)[0];
    expect(dailyImages(hub)).toContain('bg.library');
    expect(returnImages('a41').length).toBeGreaterThan(0);
  });

  it('わからない画面（試作の5戦など）は、全部の絵を待つ', () => {
    const all: string[] = [];
    expect(screenImages('Battle', { progress: {} }, all)).toBe(all);
    expect(screenImages('Credits', {}, all)).toBe(all);
  });
});
