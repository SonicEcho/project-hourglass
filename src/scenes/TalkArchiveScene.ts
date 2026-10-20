import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { ArchivedTalk } from '../core';
import { eventPassed, markArchived, talkArchive } from '../core';
import { BACKDROPS, BGM, DAILY_HUBS, SCENES, SLICE_FLOW } from '../data';
import { playBgm } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { enterScreen } from '../ui/skin';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import type { DialogueData } from './DialogueScene';
import { run, setStoryVars } from './run';

// 町の小話（段階82。docs/design/daily.md の 4-2）：拠点で、過ぎた日の小話を後から見る。
// 昼に2つしか選べないので、小話は必ずどれかを見逃す。周回して遊ぶ前提ではないので、ここで取りこぼしをなくす。
// 昼に選べる回数は使わず、時間も進まない。見た小話も並べる（見直せる）。
// 段階83：ここで見ても♥は増えない（その日に見た時だけ。昼に2つ選ぶ意味を残すため）

/** 1ページに並べる数 */
const PER_PAGE = 8;

export interface TalkArchiveData {
  /** 見終えた小話の印 */
  seen?: string;
  page?: number;
}

/** 拠点に出す小話の一覧（過ぎた日の分だけ） */
export function archivedTalks(): ArchivedTalk[] {
  return talkArchive(DAILY_HUBS, run.vars, (hubId) => eventPassed(SLICE_FLOW, run.event, hubId));
}

/** 一覧に出す題（台本の場面の題から「小話：」を外す） */
function talkTitle(t: ArchivedTalk): string {
  const title = SCENES.find((s) => s.id === t.scene)?.title ?? t.label;
  return title.replace(/^小話：/, '');
}

export class TalkArchiveScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private page = 0;

  constructor() {
    super('TalkArchive');
  }

  create(data: TalkArchiveData = {}): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    // 後から見たことは、その日に見たのとは別の値で覚える（段階83。♥に数えない）
    if (data.seen) setStoryVars(markArchived(run.vars, data.seen));
    this.page = data.page ?? 0;
    enterScreen(this);
    playBgm(this, BGM.library);
    this.root = this.add.container(0, 0);
    this.render();
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  private render(): void {
    this.root.removeAll(true);
    const root = this.root;
    const list = archivedTalks();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    drawBackdrop(this, root, BACKDROPS.library, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0));
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, 96, 0x000000, 0.55).setOrigin(0));
    root.add(addText(this, GAME_WIDTH / 2, 28, '町の小話', { size: 20, bold: true }).setOrigin(0.5));
    const unseen = list.filter((t) => !t.seen).length;
    root.add(addText(this, GAME_WIDTH / 2, 56, `過ぎた日の小話　まだ見ていない：${unseen}`, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    root.add(addText(this, GAME_WIDTH / 2, 76, 'ここで見ても♥は増えない（その日に見た時だけ）', { size: 11, color: COLORS.subText }).setOrigin(0.5));
    list.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE).forEach((t, i) => {
      const label = `${t.day}日目　${talkTitle(t)}${t.seen ? '' : '　（まだ）'}`;
      addButton(this, root, GAME_WIDTH / 2, 140 + i * 64, GAME_WIDTH - 40, 54, label, { onTap: () => this.open(t) }, {
        size: 13,
        fill: t.seen ? COLORS.panel : 0x24384a,
        stroke: t.seen ? COLORS.border : 0x6bc8ff,
        strokeWidth: t.seen ? 1 : 2,
        textColor: t.seen ? COLORS.dimText : COLORS.text,
      });
    });
    if (pages > 1) {
      const y = 680;
      addButton(this, root, 70, y, 100, 48, '← 前', { onTap: () => this.turn(-1) }, { size: 14, enabled: this.page > 0 });
      root.add(addText(this, GAME_WIDTH / 2, y, `${this.page + 1} / ${pages}`, { size: 14 }).setOrigin(0.5));
      addButton(this, root, GAME_WIDTH - 70, y, 100, 48, '次 →', { onTap: () => this.turn(1) }, { size: 14, enabled: this.page < pages - 1 });
    }
    addButton(this, root, GAME_WIDTH / 2, 780, GAME_WIDTH - 60, 56, 'レストピアへ戻る', { onTap: () => this.scene.start('Hub', { seen: undefined }) }, { size: 17, bold: true });
  }

  private turn(d: number): void {
    this.page += d;
    this.render();
  }

  /** 小話を見る。見終えたら、この一覧に戻って見たと覚える */
  private open(t: ArchivedTalk): void {
    const talk: DialogueData = {
      scene: t.scene,
      vars: run.vars,
      seed: run.seed,
      next: { key: 'TalkArchive', data: { seen: t.id, page: this.page } },
      onVars: (vars) => setStoryVars(vars),
    };
    this.scene.start('Dialogue', talk);
  }
}
