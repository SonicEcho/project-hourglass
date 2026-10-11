// M2 の台本（段階34〜）。脚本 docs/script/M2.md の場面を、src/core/script.ts の書き方で写したもの。
// 台詞を直す時は、脚本とこの台本の両方を直す。書き方は scriptM1.ts と同じ。まだ台本のない場面は、物語の流れ（story.ts）で仮の画面にしている
import type { ScriptScene } from '../core/script';
import { parseScript } from '../core/script';
import { M1_SCENES } from './scriptM1';

export const SCRIPT_M2 = `
# chapter2_title 章の扉（2章）
@bg black
@cast
@fade in
@logo RESTOPIA　思い出だけの理想郷
@caption 第2章　背中を押す声
`;

/** 読み取った M2 の台本 */
export const M2_SCENES = parseScript(SCRIPT_M2);

/** 会話の画面で読む、すべての台本の場面（M1 と M2） */
export const SCENES: ScriptScene[] = [...M1_SCENES, ...M2_SCENES];
