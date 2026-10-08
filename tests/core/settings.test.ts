import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, nextVolume, parseSettings, serializeSettings } from '../../src/core';

describe('設定（段階19）', () => {
  it('保存がなければ初期値', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('保存した設定をそのまま読み戻せる', () => {
    const s = { bgmVolume: 0.25, seVolume: 1, typeSound: false };
    expect(parseSettings(serializeSettings(s))).toEqual(s);
  });

  it('壊れた文字や足りない値は初期値で埋める', () => {
    expect(parseSettings('{壊れた')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{"bgmVolume":0}')).toEqual({ bgmVolume: 0, seVolume: DEFAULT_SETTINGS.seVolume, typeSound: true });
    expect(parseSettings('{"bgmVolume":"大","seVolume":null}')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('[]')).toEqual(DEFAULT_SETTINGS);
  });

  it('段階にない音量は一番近い段階にそろえる（範囲の外も）', () => {
    expect(parseSettings('{"bgmVolume":0.3,"seVolume":7}')).toEqual({ bgmVolume: 0.25, seVolume: 1, typeSound: true });
    expect(parseSettings('{"bgmVolume":-1,"seVolume":0.6}')).toEqual({ bgmVolume: 0, seVolume: 0.5, typeSound: true });
  });

  it('音量は 0→25→50→75→100→0% の順に変わる', () => {
    expect([0, 0.25, 0.5, 0.75, 1].map(nextVolume)).toEqual([0.25, 0.5, 0.75, 1, 0]);
  });

  it('文字の音の入り切りは、真偽でなければ初期値（入）', () => {
    expect(parseSettings('{"typeSound": false}').typeSound).toBe(false);
    expect(parseSettings('{"typeSound": "no"}').typeSound).toBe(true);
    expect(parseSettings(null).typeSound).toBe(true);
  });
});
