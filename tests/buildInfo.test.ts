import { describe, expect, it } from 'vitest';
import { formatBuildInfo } from '../src/debug/buildInfo';

describe('formatBuildInfo', () => {
  it('UTC の日時を JST で表示し、コミットIDを添える', () => {
    expect(formatBuildInfo('2026-10-04T14:05:00.000Z', 'abc1234')).toBe('2026-10-04 23:05 JST (abc1234)');
  });

  it('JST で日付をまたぐ', () => {
    expect(formatBuildInfo('2026-12-31T15:30:00.000Z', 'abc1234')).toBe('2027-01-01 00:30 JST (abc1234)');
  });

  it('日時が不正でも落ちない', () => {
    expect(formatBuildInfo('not-a-date', 'abc1234')).toBe('build ? (abc1234)');
  });
});
