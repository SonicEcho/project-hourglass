import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { findEvent, formatPlayTime, playLogPages, playLogSections, summarizePlayLog } from '../core';
import { SLICE_FLOW } from '../data';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { addWindow, enterScreen, screenBg } from '../ui/skin';
import { playRecord, resetPlayRecord, setPlayTracking } from './playRecord';

// 遊んだ記録の画面（段階32b）。試遊した人に、この画面のスクリーンショットを送ってもらう。
// 段階88：日・区画の表が1画面に入らなくなったので、PAGE_ROWS 行ずつの頁に分けて「前の頁・次の頁」で切り替える

export interface PlayLogData {
  /** 戻る画面（タイトル、または「つづく」の流れの画面） */
  back: 'Title' | 'Flow';
  /** 見せる頁（頁を切り替えた時。なければ今いる出来事の頁） */
  page?: number;
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
// 行の高さ（段階85：2章が20日になり、26行が1画面に入るよう 23 から詰めた）
const ROW_H = 20;
/** 1頁の行数（段階88） */
const PAGE_ROWS = 24;

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
      `記憶をたどる ${log.counts.hunt}回・交換 ${log.counts.exchange}回・落とし物 ${log.counts.lost}個・ポーチ ${log.counts.pouch}個`,
      `記録を始めた日時：${formatAt(log.startedAt)}`,
    ];
    root.add(addText(this, 24, 62, lines.join('\n'), { size: 13, color: COLORS.subText, wrap: GAME_WIDTH - 48 }).setLineSpacing(4));

    // 日ごと・区画ごとの表（流れの順。段階34で、出来事ごとからまとめた行にした）
    const paged = playLogPages(playLogSections(sum.rows, SLICE_FLOW), PAGE_ROWS, log.last);
    const page = Math.min(Math.max(data?.page ?? paged.start, 0), paged.pages.length - 1);
    const rows = paged.pages[page];
    root.add(addWindow(this, 12, ROW_TOP - 34, GAME_WIDTH - 24, PAGE_ROWS * ROW_H + 44));
    const colTime = GAME_WIDTH - 104;
    const colBattle = GAME_WIDTH - 30;
    root.add(addText(this, 26, ROW_TOP - 24, '日・区画', { size: 11, color: COLORS.dimText }));
    root.add(addText(this, colTime, ROW_TOP - 24, '時間', { size: 11, color: COLORS.dimText }).setOrigin(1, 0));
    root.add(addText(this, colBattle, ROW_TOP - 24, '勝ち・負け', { size: 11, color: COLORS.dimText }).setOrigin(1, 0));
    rows.forEach((r, i) => {
      const y = ROW_TOP + i * ROW_H;
      const here = log.last !== null && r.ids.includes(log.last);
      const color = here ? COLORS.accentText : r.reached ? COLORS.text : COLORS.dimText;
      if (here) root.add(this.add.rectangle(18, y - 2, GAME_WIDTH - 36, ROW_H - 2, COLORS.accent, 0.12).setOrigin(0).setRounded(4));
      // 区画の行は、話の題だけ（「1-1「金魚の名前」：縁日の探索」→「1-1「金魚の名前」」。時間の欄にかからないように）
      const title = r.explore ? r.title.split('：')[0] : r.title;
      root.add(addText(this, r.explore ? 42 : 26, y, `${here ? '▶ ' : ''}${title}`, { size: 12, color }));
      root.add(addText(this, colTime, y, r.ms > 0 ? formatPlayTime(r.ms) : '', { size: 12, color }).setOrigin(1, 0));
      const battles = r.wins + r.losses > 0 ? `${r.wins}・${r.losses}` : '';
      root.add(addText(this, colBattle, y, battles, { size: 12, color: r.losses > 0 ? COLORS.allyDamage : color }).setOrigin(1, 0));
    });

    // 頁が2つ以上ある時：前の頁・次の頁（段階88）
    const py = ROW_TOP + PAGE_ROWS * ROW_H + 30;
    if (paged.pages.length > 1) {
      root.add(addText(this, cx, py, `${page + 1} / ${paged.pages.length}`, { size: 12, color: COLORS.subText }).setOrigin(0.5));
      if (page > 0) addButton(this, root, cx - 104, py, 120, 34, '前の頁', { onTap: () => this.scene.restart({ back, page: page - 1 }) }, { size: 13 });
      if (page < paged.pages.length - 1) addButton(this, root, cx + 104, py, 120, 34, '次の頁', { onTap: () => this.scene.restart({ back, page: page + 1 }) }, { size: 13 });
    }

    // 下のボタン：戻る、記録を消す（2回押し）
    const by = py + 54;
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
