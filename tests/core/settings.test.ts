import { describe, expect, it } from 'vitest';
import { battleSpeedFor, DEFAULT_SETTINGS, nextBattleSpeed, nextVolume, parseSettings, serializeSettings } from '../../src/core';

describe('設定（段階19）', () => {
  it('保存がなければ初期値', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('保存した設定をそのまま読み戻せる', () => {
    const s = { bgmVolume: 0.25, seVolume: 1, typeSound: false, audioOut: 'wireless' as const, battleSpeed: 3 as const, autoTactic: 'weak', storyAuto: 'always' as const };
    expect(parseSettings(serializeSettings(s))).toEqual(s);
  });

  it('壊れた文字や足りない値は初期値で埋める', () => {
    expect(parseSettings('{壊れた')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{"bgmVolume":0}')).toEqual({ bgmVolume: 0, seVolume: DEFAULT_SETTINGS.seVolume, typeSound: true, audioOut: 'speaker', battleSpeed: 2, autoTactic: 'auto', storyAuto: 'won' });
    expect(parseSettings('{"bgmVolume":"大","seVolume":null}')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('[]')).toEqual(DEFAULT_SETTINGS);
  });

  it('段階にない音量は一番近い段階にそろえる（範囲の外も）', () => {
    expect(parseSettings('{"bgmVolume":0.3,"seVolume":7}')).toEqual({ bgmVolume: 0.25, seVolume: 1, typeSound: true, audioOut: 'speaker', battleSpeed: 2, autoTactic: 'auto', storyAuto: 'won' });
    expect(parseSettings('{"bgmVolume":-1,"seVolume":0.6}')).toEqual({ bgmVolume: 0, seVolume: 0.5, typeSound: true, audioOut: 'speaker', battleSpeed: 2, autoTactic: 'auto', storyAuto: 'won' });
  });

  it('音量は 0→25→50→75→100→0% の順に変わる', () => {
    expect([0, 0.25, 0.5, 0.75, 1].map(nextVolume)).toEqual([0.25, 0.5, 0.75, 1, 0]);
  });

  it('文字の音の入り切りは、真偽でなければ初期値（入）', () => {
    expect(parseSettings('{"typeSound": false}').typeSound).toBe(false);
    expect(parseSettings('{"typeSound": "no"}').typeSound).toBe(true);
    expect(parseSettings(null).typeSound).toBe(true);
  });

  it('物語の探索のオート（段階105）は always 以外なら、勝った敵から', () => {
    expect(parseSettings('{"storyAuto": "always"}').storyAuto).toBe('always');
    expect(parseSettings('{"storyAuto": "first"}').storyAuto).toBe('won');
    expect(parseSettings(null).storyAuto).toBe('won');
  });

  it('出力先は wireless 以外ならスピーカー', () => {
    expect(parseSettings('{"audioOut": "wireless"}').audioOut).toBe('wireless');
    expect(parseSettings('{"audioOut": "headphone"}').audioOut).toBe('speaker');
    expect(parseSettings(null).audioOut).toBe('speaker');
  });

  it('狩りの早送りの設定は2・3倍だけ。前の1倍や知らない値は2倍（段階109）', () => {
    expect(parseSettings('{"battleSpeed":3}').battleSpeed).toBe(3);
    expect(parseSettings('{"battleSpeed":1}').battleSpeed).toBe(2);
    expect(parseSettings('{"battleSpeed":5}').battleSpeed).toBe(2);
    expect([2, 3].map((v) => nextBattleSpeed(v as 2 | 3))).toEqual([3, 2]);
    expect(parseSettings('{"autoTactic":"defend"}').autoTactic).toBe('defend');
  });

  it('戦闘の速さ：ボス戦は1倍、狩りは設定の速さ、それ以外は2倍（段階109）', () => {
    expect(battleSpeedFor('boss', 3)).toBe(1);
    expect(battleSpeedFor('hunt', 3)).toBe(3);
    expect(battleSpeedFor('hunt', 2)).toBe(2);
    expect(battleSpeedFor('normal', 3)).toBe(2);
  });
});
