import { describe, expect, it } from 'vitest';
import type { ActionDef } from '../src/core';
import { CARDS, SKILLS } from '../src/data';
import { targetNote } from '../src/ui/describe';

// 段階125（レビューの項目19）：相手が先に倒れた時の説明を、core の動き（向け直し・回復の不発）と合わせる

describe('相手が先に倒れた時の説明', () => {
  const all = [...Object.values(CARDS), ...Object.values(SKILLS)] as ActionDef[];

  it('敵単体の攻撃は向け直し、味方単体の回復は不発と書く', () => {
    const attack = all.find((d) => d.target === 'enemy' && d.effects.some((e) => e.kind === 'damage'))!;
    expect(targetNote(attack)).toContain('向け直す');
    const heal = all.find((d) => d.target === 'ally' && d.effects.some((e) => e.kind === 'heal' && !e.allies));
    if (heal) expect(targetNote(heal)).toContain('回復しない');
  });

  it('全体・自分の行動には何も足さない', () => {
    for (const d of all.filter((d) => d.target === 'enemies' || d.target === 'allies' || d.target === 'self')) expect(targetNote(d)).toBe('');
  });
});
