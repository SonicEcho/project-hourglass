// プレイ時間の記録（段階63。?debug=1 の時だけ main.ts から動かす）。足し算と読める文は core/playtime.ts。
// 1秒ごとに、今いる場所（物語の出来事・画面・場面）へ1秒を足す。画面を隠している間と、しばらく触っていない間は数えない。
// 記録はこの端末のブラウザに残る（セーブとは別。デバッグメニューで消せる）
import type Phaser from 'phaser';
import type { PlaytimeLabel, PlaytimeLog } from '../core';
import { addPlaytime, breakPlaytime, emptyPlaytime, flowEvents, formatPlaytime, normalizePlaytime } from '../core';
import { SLICE_FLOW } from '../data';
import { run } from '../scenes/run';

const STORAGE_KEY = 'restopia.playtime';
const TICK_MS = 1000;
/** これより長く触っていなければ、置きっぱなしとして数えない */
const IDLE_MS = 120_000;
/** 数える画面の優先順（同時に動いている画面があれば、前のものを数える） */
const PRIORITY = ['Dialogue', 'Battle', 'Explore', 'Daily', 'Return', 'Hub', 'Exchange', 'Lost', 'Growth', 'Weapon', 'WeaponTree', 'Navi', 'Album', 'Flow', 'Title'];

let log: PlaytimeLog = emptyPlaytime();
let lastInput = Date.now();
let unsaved = 0;

function load(): void {
  try {
    log = normalizePlaytime(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    log = emptyPlaytime();
  }
}

function save(): void {
  unsaved = 0;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // 保存できない時（プライベートな窓など）は、開いている間だけ覚える
  }
}

/** 画面ごとの場面：会話は読んでいる場面、戦闘は戦闘の id、探索は区画と晩と部屋、日常は出来事 */
function detailOf(scene: Phaser.Scene): string {
  const s = scene as unknown as Record<string, unknown>;
  switch (scene.scene.key) {
    case 'Dialogue':
      return (s.pos as { scene?: string } | undefined)?.scene ?? '';
    case 'Battle':
      return (s.battle as { id?: string } | undefined)?.id ?? '';
    case 'Explore': {
      const area = (s.area as { id?: string } | undefined)?.id ?? '';
      const night = typeof s.night === 'number' && s.night > 0 ? ` ${s.night}晩目` : '';
      const hunt = s.hunting === true ? ' 記憶をたどる' : '';
      return `${area}${night}${hunt} ${(s.state as { room?: string } | undefined)?.room ?? ''}`.trim();
    }
    case 'Daily':
      return typeof s.eventId === 'string' ? s.eventId : '';
    default:
      return '';
  }
}

function currentLabel(game: Phaser.Game): PlaytimeLabel | null {
  const active = game.scene.getScenes(true);
  const scene = PRIORITY.map((key) => active.find((x) => x.scene.key === key)).find(Boolean) ?? active[0];
  if (!scene) return null;
  return { event: run.active ? run.event : '（物語の外）', scene: scene.scene.key, detail: detailOf(scene) };
}

/** 記録を始める（デバッグの時だけ呼ぶ） */
export function installPlaytime(game: Phaser.Game): void {
  load();
  window.addEventListener('pointerdown', () => (lastInput = Date.now()), { capture: true });
  window.setInterval(() => {
    const visible = document.visibilityState === 'visible';
    const idle = Date.now() - lastInput > IDLE_MS;
    if (!visible || idle) {
      log = breakPlaytime(log);
      return;
    }
    const label = currentLabel(game);
    if (!label) return;
    log = addPlaytime(log, label, TICK_MS);
    if (++unsaved >= 10) save();
  }, TICK_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
}

/** デバッグメニューに出す、読める文 */
export function playtimeReport(): string {
  save();
  return `${formatPlaytime(log, flowEvents(SLICE_FLOW))}\n\n（画面が表に出ていて、${IDLE_MS / 60000}分以内に触っている間だけ数える）`;
}

export function resetPlaytime(): void {
  log = emptyPlaytime();
  save();
}
