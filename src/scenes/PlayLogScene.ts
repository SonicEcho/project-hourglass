import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { findEvent, formatPlayTime, summarizePlayLog } from '../core';
import { SLICE_FLOW } from '../data';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { addWindow, enterScreen, screenBg } from '../ui/skin';
import { playRecord, resetPlayRecord, setPlayTracking } from './playRecord';

// 遊んだ記録の画面（段階32b）。試遊した人に、この画面のスクリーンショットを送ってもらう。全部を1画面に入れる

export interface PlayLogData {
  /** 戻る画面（タイトル、または「つづく」の流れの画面） */
  back: 'Title' | 'Flow';
}

/** 日時を「10/9 21:05」の形にする */
function formatAt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const titleOf = (id: string | null): string => (id ? findEvent(SLICE_FLOW, id)?.title ?? '—' : '—');

const ROW_TOP = 214;
const ROW_H = 23;

export class PlayLogScene extends Phaser.Scene {
  constructor() {
    super('PlayLog');
  }

  create(data: PlayLogData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    // この画面にいる間は時間を数えない
    setPlayTracking(false);
    const back = data?.back ?? 'Title';
    const root = this.add.container(0, 0);
    root.add(screenBg(this));
    const cx = GAME_WIDTH / 2;
    const log = playRecord();
    const sum = summarizePlayLog(log, SLICE_FLOW);

    root.add(addText(this, cx, 34, '遊んだ記録', { size: 20, bold: true }).setOrigin(0.5));
    const lines = [
      `遊んだ時間　${formatPlayTime(sum.totalMs)}　　負けた回数　${sum.totalLosses}`,
      `はじめから　${log.starts}回　　「つづく」まで　${log.finished}回`,
      `一番先：${titleOf(log.furthest)}`,
      `最後：${titleOf(log.last)}（${formatAt(log.lastAt)}）`,
      `記録を始めた日時：${formatAt(log.startedAt)}`,
    ];
    root.add(addText(this, 24, 62, lines.join('\n'), { size: 13, color: COLORS.subText, wrap: GAME_WIDTH - 48 }).setLineSpacing(4));

    // 出来事ごとの表（流れの順）
    root.add(addWindow(this, 12, ROW_TOP - 34, GAME_WIDTH - 24, sum.rows.length * ROW_H + 44));
    const colTime = GAME_WIDTH - 104;
    const colBattle = GAME_WIDTH - 30;
    root.add(addText(this, 26, ROW_TOP - 24, '出来事', { size: 11, color: COLORS.dimText }));
    root.add(addText(this, colTime, ROW_TOP - 24, '時間', { size: 11, color: COLORS.dimText }).setOrigin(1, 0));
    root.add(addText(this, colBattle, ROW_TOP - 24, '勝ち・負け', { size: 11, color: COLORS.dimText }).setOrigin(1, 0));
    sum.rows.forEach((r, i) => {
      const y = ROW_TOP + i * ROW_H;
      const here = r.id === log.last;
      const color = here ? COLORS.accentText : r.reached ? COLORS.text : COLORS.dimText;
      if (here) root.add(this.add.rectangle(18, y - 2, GAME_WIDTH - 36, ROW_H - 2, COLORS.accent, 0.12).setOrigin(0).setRounded(4));
      root.add(addText(this, 26, y, `${here ? '▶ ' : ''}${r.title}`, { size: 12, color }));
      root.add(addText(this, colTime, y, r.ms > 0 ? formatPlayTime(r.ms) : '', { size: 12, color }).setOrigin(1, 0));
      const battles = r.wins + r.losses > 0 ? `${r.wins}・${r.losses}` : '';
      root.add(addText(this, colBattle, y, battles, { size: 12, color: r.losses > 0 ? COLORS.allyDamage : color }).setOrigin(1, 0));
    });

    // 下のボタン：戻る、記録を消す（2回押し）
    const by = ROW_TOP + sum.rows.length * ROW_H + 56;
    addButton(this, root, cx - 84, by, 150, 48, '戻る', {
      onTap: () => this.scene.start(back, back === 'Flow' ? { done: false } : {}),
    }, { size: 16 });
    let armed = false;
    const warn = addText(this, cx, by + 40, '', { size: 11, color: COLORS.allyDamage, align: 'center' }).setOrigin(0.5, 0);
    root.add(warn);
    addButton(this, root, cx + 84, by, 150, 48, '記録を消す', {
      onTap: () => {
        if (!armed) {
          armed = true;
          warn.setText('記録をすべて消します。もう一度押してください');
          return;
        }
        resetPlayRecord();
        this.scene.restart({ back });
      },
    }, { size: 14 });
  }
}
