import { describe, expect, it } from 'vitest';
import { ENEMY_ART, LIBRARY_ART_NOTES, LIBRARY_ENEMIES, LIBRARY_SNAPS, snapArt } from '../src/data';


// 段階232：ライブラリの大きな絵に添える説明文が、絵のある物すべてにあるか
describe('ライブラリの絵の説明文', () => {
  it('敵の絵には、すべて説明文がある', () => {
    const missing = LIBRARY_ENEMIES.map((e) => ENEMY_ART[e.id]).filter((a): a is string => !!a && !LIBRARY_ART_NOTES[a]);
    expect(missing).toEqual([]);
  });
  it('スナップの絵には、すべて説明文がある', () => {
    const missing = LIBRARY_SNAPS.map((m) => snapArt(m.id)).filter((a): a is string => !!a && !LIBRARY_ART_NOTES[a]);
    expect(missing).toEqual([]);
  });
  it('説明文に、体の時間が減る書き方をしない（物語の軸 2-0）', () => {
    const bad = Object.entries(LIBRARY_ART_NOTES).filter(([, t]) => /残り時間|寿命|年老い/.test(t));
    expect(bad).toEqual([]);
  });
});
