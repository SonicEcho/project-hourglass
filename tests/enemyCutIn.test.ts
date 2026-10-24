import { describe, expect, it } from 'vitest';
import { CAST, ENEMY_CUT_INS, KAI, KAI_REVENGE } from '../src/data';

// 敵の固有技のカットイン（段階107c）：敵と技と立ち絵が、データにあること
describe('敵の固有技のカットイン', () => {
  const enemies = [KAI, KAI_REVENGE];
  it('敵の id と技の id が、敵のデータにある', () => {
    for (const [enemyId, byAction] of Object.entries(ENEMY_CUT_INS)) {
      const def = enemies.find((e) => e.id === enemyId);
      expect(def, enemyId).toBeDefined();
      for (const actionId of Object.keys(byAction)) expect(def?.actions.some((a) => a.id === actionId), `${enemyId} ${actionId}`).toBe(true);
    }
  });
  it('立ち絵の人と表情が、会話の立ち絵にある', () => {
    for (const byAction of Object.values(ENEMY_CUT_INS)) {
      for (const c of Object.values(byAction)) {
        expect(CAST[c.cast]?.portrait, c.cast).toBeTruthy();
        expect(CAST[c.cast]?.faces[c.face], `${c.cast} ${c.face}`).toBeTruthy();
      }
    }
  });
});
