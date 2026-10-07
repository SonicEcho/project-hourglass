import type { Story } from '../core/progress';
import { V1_AREA_ID, V1_CHAPTER_ID } from '../core/save';
import type { CampaignBattle } from './campaign';
import { CAMPAIGN } from './campaign';

// 物語の章 → 区画 → 戦闘（段階13）。今は試作の1章・1区画に、今までの5戦だけ。
// 章・区画・戦闘の id はセーブが覚えるので、名前を変えても id は変えない

/** 試作の章と区画の id。版1のセーブ（段階11・12）を直す時に、この場所に置き換える */
export const PROTOTYPE_CHAPTER_ID = V1_CHAPTER_ID;
export const PROTOTYPE_AREA_ID = V1_AREA_ID;

export const STORY: Story<CampaignBattle> = [
  {
    id: PROTOTYPE_CHAPTER_ID,
    name: '試作',
    areas: [{ id: PROTOTYPE_AREA_ID, name: '試作の5戦', battles: CAMPAIGN }],
  },
];
