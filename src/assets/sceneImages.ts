import type { ScriptScene } from '../core';
import { castEntry } from '../core';
import type { Backdrop, CastMember, PortraitPart } from '../data';

// 会話の場面で使う絵の id（段階148）。遊び始める・場面が替わる時に、この絵だけを先に読んで待つ（残りは裏で読む）

export interface SceneImageData {
  cast: Record<string, CastMember>;
  backdrops: Record<string, Backdrop>;
  cgs: Record<string, Backdrop>;
  parts: Record<string, { blink?: PortraitPart; talk?: PortraitPart }>;
}

/**
 * その場面に出る人の立ち絵（全部の表情とまばたき・口パク）、背景、1枚絵の id。
 * まだ描いていない表情の id（台帳にない）も入るが、待つ時に台帳にある絵だけに絞る（loader.ts の unsettled）
 */
export function sceneImageIds(scene: ScriptScene, d: SceneImageData): string[] {
  const people = new Set<string>();
  const ids = new Set<string>();
  for (const step of scene.steps) {
    if (step.kind === 'line' && step.speaker) people.add(step.speaker);
    if (step.kind !== 'command') continue;
    if (step.name === 'cast') for (const a of step.args) people.add(castEntry(a).name);
    const [a] = step.args;
    if (step.name === 'bg' && a) addImage(ids, d.backdrops[a]);
    if (step.name === 'cg' && a) addImage(ids, d.cgs[a]);
  }
  for (const name of people) {
    const def = d.cast[name];
    if (def?.portrait) for (const file of Object.values(def.faces)) ids.add(`${def.portrait}.${file}`);
    for (const part of [d.parts[name]?.blink, d.parts[name]?.talk]) {
      if (!part) continue;
      ids.add(part.image);
      for (const id of Object.values(part.byFace ?? {})) ids.add(id);
    }
  }
  return [...ids];
}

function addImage(ids: Set<string>, b: Backdrop | undefined): void {
  if (b?.image) ids.add(b.image);
}
