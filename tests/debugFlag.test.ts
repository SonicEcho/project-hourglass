import { describe, expect, it } from 'vitest';
import { isDebugEnabled } from '../src/debug/debugFlag';

describe('isDebugEnabled', () => {
  it('debug=1 の時だけ有効', () => {
    expect(isDebugEnabled('?debug=1')).toBe(true);
    expect(isDebugEnabled('?foo=bar&debug=1')).toBe(true);
  });

  it('それ以外は無効', () => {
    expect(isDebugEnabled('')).toBe(false);
    expect(isDebugEnabled('?debug=0')).toBe(false);
    expect(isDebugEnabled('?debug=true')).toBe(false);
    expect(isDebugEnabled('?debug')).toBe(false);
  });
});
