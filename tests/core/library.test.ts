import { describe, expect, it } from 'vitest';
import { createLibrary, recordLibraryBattle, recordLibraryFinds, sanitizeLibrary } from '../../src/core';
import { LIBRARY_COMBOS, LIBRARY_CONTEXT, LIBRARY_ENEMIES, LIBRARY_ITEMS, LIBRARY_SNAPS, WEAPON_DATA } from '../../src/data';

describe('ライブラリの記録（段階167）', () => {
  it('戦闘：会った数・倒した数を1体ごとに数え、弱点は今までの物に足す', () => {
    let lib = recordLibraryBattle(createLibrary(), { met: ['a', 'a', 'b'], defeated: ['a'], weak: { a: ['fire'] } });
    lib = recordLibraryBattle(lib, { met: ['a'], defeated: ['a', 'b'], weak: { a: ['fire', 'ice'], b: [] } });
    expect(lib.met).toEqual({ a: 3, b: 1 });
    expect(lib.defeated).toEqual({ a: 2, b: 1 });
    expect(lib.weak).toEqual({ a: ['fire', 'ice'] });
  });
  it('手に入れた物：重なりは足さず、手に入れた順', () => {
    const lib = recordLibraryFinds(recordLibraryFinds(createLibrary(), { snaps: ['x', 'y'], items: ['m'] }), { snaps: ['y', 'z'], combos: ['c'], items: ['m'] });
    expect(lib.snaps).toEqual(['x', 'y', 'z']);
    expect(lib.combos).toEqual(['c']);
    expect(lib.items).toEqual(['m']);
  });
  it('読む時：形の違う物・知らない id・おかしな数は捨てる', () => {
    const ctx = { enemies: ['a'], snaps: ['s'], combos: ['c'], items: ['m'] };
    expect(sanitizeLibrary('x', ctx)).toEqual(createLibrary());
    const lib = sanitizeLibrary({ met: { a: 2.7, b: 1, }, defeated: { a: -1 }, weak: { a: ['fire', 'fire', 'wind'], b: ['ice'] }, snaps: ['s', 's', 't', 3], combos: 'c', items: ['m'] }, ctx);
    expect(lib).toEqual({ met: { a: 2 }, defeated: {}, weak: { a: ['fire'] }, snaps: ['s'], combos: [], items: ['m'] });
  });
});

describe('ライブラリに載る物（1-1・1-2）', () => {
  it('敵：1-1 の4種類の雑魚とぬし（部位はぬしの項目に）、1-2 の4種類の雑魚（段階168）とぬし（段階169）、2-1 の4種類の雑魚（段階170）とぬし（段階171）、2-2 の4種類の雑魚（段階172）とぬし（段階173）、2-3 の4種類の雑魚（段階174）とぬし・カイ（段階175）、3-1 の5種類の雑魚（段階178）とぬし（段階179）、祭りの夜の4種類の雑魚（段階181）とやぐらのぬし（段階182）、本気のカイ（段階184）、3-2 の5種類の雑魚（段階185）とぬし（段階186）、4-1 の5種類の雑魚（段階187）とぬし（段階188）。ぬしは後ろ', () => {
    expect(LIBRARY_ENEMIES.map((e) => e.id).sort()).toEqual(['abacusNoise', 'ampLord', 'ballNoise', 'balloonNoise', 'jugNoise', 'kai', 'megaphoneNoise', 'petNoise', 'scoreboardLord', 'bicycleLord', 'cottonNoise', 'gearNoise', 'goldfishBowlLord', 'boomboxNoise', 'flipPhoneNoise', 'goldfishNoise', 'latheLord', 'maskNoise', 'menkoNoise', 'metronomeNoise', 'phoneNoise', 'ramuneNoise', 'screwNoise', 'stickerNoise', 'tinNoise', 'tubeNoise', 'fanNoise', 'coilNoise', 'radioNoise', 'tableNoise', 'postboxNoise', 'trainLord', 'pinwheelNoise', 'candyNoise', 'lanternNoise', 'phonographNoise', 'yaguraLord', 'kaiRevenge', 'selfieNoise', 'earphoneNoise', 'tapiocaNoise', 'diplomaNoise', 'yosegakiNoise', 'crossingLord', 'bugcageNoise', 'watermelonNoise', 'watergunNoise', 'fireworkNoise', 'jizoNoise', 'riverLord'].sort());
    expect(LIBRARY_ENEMIES[LIBRARY_ENEMIES.length - 1].boss).toBe(true);
    const lord = LIBRARY_ENEMIES.find((e) => e.id === 'goldfishBowlLord')!;
    expect(lord.boss).toBe(true);
    expect(lord.parts).toHaveLength(2);
    expect(LIBRARY_ENEMIES.every((e) => e.areas.length > 0)).toBe(true);
  });
  it('素材：落とす敵が分かり、すべて素材の一覧にある', () => {
    expect(LIBRARY_ITEMS.length).toBeGreaterThan(0);
    for (const it of LIBRARY_ITEMS) {
      expect(WEAPON_DATA.items[it.id]).toBeDefined();
      expect(it.sources.length).toBeGreaterThan(0);
    }
  });
  it('セーブの材料が、載る物とそろっている', () => {
    expect(LIBRARY_CONTEXT.snaps).toEqual(LIBRARY_SNAPS.map((m) => m.id));
    expect(LIBRARY_CONTEXT.combos).toEqual(LIBRARY_COMBOS.map((l) => l.id));
    expect(LIBRARY_COMBOS.map((l) => l.id).sort()).toEqual(['biribiri', 'crossDrive', 'flashback', 'iceFlower', 'inSync', 'thunderRain', 'threeTimes', 'dejaVu'].sort());
  });
});
