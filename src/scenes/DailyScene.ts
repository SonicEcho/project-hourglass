import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { DailyHub, DailyPlace, DailySpot, SpotMark } from '../core';
import { finishesAfter, isSeen, markSeen, requiredLeft, spotState } from '../core';
import { BACKDROPS, DAILY_HUBS } from '../data';
import { drawBackdrop } from '../ui/backdrop';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { startAmbience, stopAmbience } from '../audio/sound';
import { openOptions } from '../ui/options';
import type { DialogueData } from './DialogueScene';
import { run, setStoryVars } from './run';

// 昼の日常（段階24）：地図から場所を選び、場所の絵に出ている印をタップして出来事を見る。
// プロローグの屋台めぐりも同じ画面（場所が1つ、画面の下に「けいかくひょう」、4つ見ると次へ）。
// 見た印は、物語で覚えた値（run.vars）に入れてセーブする。日常を終えたら、物語の流れへ done で戻る

/** Phaser はデータを渡さずに開くと前のデータを使い回すので、この画面を開く時は必ず全部渡す（なければ undefined を書く） */
export interface DailyData {
  /** 物語の流れの出来事の id（DAILY_HUBS の id） */
  event: string;
  /** 開く場所（なければ地図。場所が1つの時は、その場所） */
  place?: string;
  /** 見終えて戻ってきた印 */
  finished?: string;
}

/** 印の色と、中に書く字 */
const MARK_STYLE: Record<SpotMark, { color: number; icon: string }> = {
  main: { color: 0xe0563e, icon: '！' },
  bond: { color: 0xe07aa0, icon: '♥' },
  talk: { color: 0x5aa8ff, icon: '…' },
  stall: { color: 0xf0a040, icon: '★' },
  go: { color: 0xd9ae62, icon: '→' },
};

export class DailyScene extends Phaser.Scene {
  private hub!: DailyHub;
  private eventId = '';

  constructor() {
    super('Daily');
  }

  create(data: DailyData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.eventId = data.event;
    const hub = DAILY_HUBS[data.event];
    if (!hub) throw new Error(`no daily hub ${data.event}`);
    this.hub = hub;
    if (data.finished) {
      const spot = hub.places.flatMap((p) => p.spots).find((s) => s.id === data.finished);
      if (spot) {
        const end = finishesAfter(hub, run.vars, spot);
        setStoryVars(markSeen(run.vars, spot.id));
        if (end) {
          this.finish();
          return;
        }
      }
    }
    const place = hub.places.find((p) => p.id === data.place) ?? (hub.places.length === 1 ? hub.places[0] : null);
    if (place) this.showPlace(place);
    else this.showMap();
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  /** 日常を終えて、物語の次の出来事へ */
  private finish(): void {
    this.scene.start('Flow', { done: true });
  }

  private reopen(place?: string): void {
    const data: DailyData = { event: this.eventId, place, finished: undefined };
    this.scene.restart(data);
  }

  private header(root: Phaser.GameObjects.Container, title: string): void {
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, 96, 0x000000, 0.55).setOrigin(0));
    // 左上はオプション（音の設定と「タイトルへ戻る」。段階32b 調整4）。題は画面の真ん中に
    addButton(this, root, 52, 36, 84, 44, 'オプション', {
      onTap: () => openOptions(this, { depth: 100, links: [{ label: 'タイトルへ戻る', onTap: () => this.scene.start('Title') }] }),
    }, { size: 12 });
    root.add(addText(this, GAME_WIDTH / 2, 26, this.hub.time, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    root.add(addText(this, GAME_WIDTH / 2, 56, title, { size: 18, bold: true }).setOrigin(0.5));
  }

  /** 地図：場所を選ぶ。まだ見ていない印がある場所には、その印を添える */
  private showMap(): void {
    stopAmbience();
    const root = this.add.container(0, 0);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1712).setOrigin(0));
    // 町の地図（仮）：道と、場所の円
    const g = this.add.graphics();
    g.fillStyle(0x2a241c, 1).fillRoundedRect(20, 120, GAME_WIDTH - 40, 560, 16);
    g.lineStyle(14, 0x4a4030, 1);
    const places = this.hub.places;
    for (let i = 1; i < places.length; i++) g.lineBetween(places[i - 1].mapX, places[i - 1].mapY, places[i].mapX, places[i].mapY);
    root.add(g);
    this.header(root, 'どこへ行く？');
    for (const place of places) {
      const open = place.spots.filter((s) => spotState(this.hub, run.vars, s) === 'open' && !s.ends);
      const fill = place.spots.some((s) => s.ends) ? 0x6a5420 : 0x30465c;
      const circle = this.add.circle(place.mapX, place.mapY, 46, fill).setStrokeStyle(3, COLORS.accent);
      root.add(circle);
      root.add(addText(this, place.mapX, place.mapY, place.name, { size: 16, bold: true }).setOrigin(0.5));
      makePressable(circle, { onTap: () => this.reopen(place.id) });
      open.forEach((s, i) => {
        const st = MARK_STYLE[s.mark];
        const bx = place.mapX + 34 + i * 22;
        root.add(this.add.circle(bx, place.mapY - 38, 13, st.color).setStrokeStyle(2, 0xffffff));
        root.add(addText(this, bx, place.mapY - 38, st.icon, { size: 13, bold: true }).setOrigin(0.5));
      });
    }
    const left = requiredLeft(this.hub, run.vars);
    const hint = left.length > 0 ? `必ず見る：${left.map((s) => s.label).join('、')}` : '印のある場所で出来事が見られる。\n時計屋へ行くと、夕暮れになる';
    root.add(addText(this, GAME_WIDTH / 2, 730, hint, { size: 13, color: COLORS.subText, align: 'center', wrap: GAME_WIDTH - 50 }).setOrigin(0.5));
  }

  /** 場所の絵と、そこに出ている印 */
  private showPlace(place: DailyPlace): void {
    const root = this.add.container(0, 0);
    const def = BACKDROPS[place.backdrop] ?? BACKDROPS.black;
    // 屋台の並ぶ参道などは、人混みの音を小さく鳴らし続ける（段階32b 調整3）
    if (def.ambienceSe) startAmbience(this, def.ambienceSe);
    else stopAmbience();
    drawBackdrop(this, root, def, 0, GAME_HEIGHT, true);
    this.header(root, place.name);
    for (const spot of place.spots) this.drawSpot(root, place, spot);
    if (this.hub.places.length > 1) {
      addButton(this, root, GAME_WIDTH / 2, 780, 200, 52, '地図へ戻る', { onTap: () => this.reopen(undefined) }, { size: 15 });
    }
    if (this.hub.plan) this.drawPlan(root);
  }

  private drawSpot(root: Phaser.GameObjects.Container, place: DailyPlace, spot: DailySpot): void {
    const state = spotState(this.hub, run.vars, spot);
    const st = MARK_STYLE[spot.mark];
    const holder = this.add.container(spot.x, spot.y);
    const color = state === 'open' ? st.color : 0x55606a;
    const circle = this.add.circle(0, 0, 30, color).setStrokeStyle(3, state === 'open' ? 0xffffff : 0x8090a0);
    holder.add(circle);
    holder.add(addText(this, 0, 0, state === 'seen' ? '✓' : st.icon, { size: 22, bold: true }).setOrigin(0.5));
    const label = addText(this, 0, 46, spot.label, { size: 14, bold: true, align: 'center', wrap: 300 }).setOrigin(0.5);
    holder.add(this.add.rectangle(0, 46, label.width + 16, label.height + 8, 0x000000, 0.6));
    holder.add(label);
    root.add(holder);
    if (state === 'open') {
      // 見られる印は、ゆっくり脈打つ
      this.tweens.add({ targets: circle, scale: 1.12, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    }
    makePressable(circle, { onTap: () => this.tapSpot(place, spot) });
  }

  private tapSpot(place: DailyPlace, spot: DailySpot): void {
    const state = spotState(this.hub, run.vars, spot);
    if (state === 'locked') {
      this.toast(`先に見ておきたい出来事がある：${requiredLeft(this.hub, run.vars).map((s) => s.label).join('、')}`);
      return;
    }
    if (state === 'seen') {
      this.toast('ここは、もう見た');
      return;
    }
    const go = () => {
      if (!spot.scene) {
        this.finish();
        return;
      }
      const data: DialogueData = {
        scene: spot.scene,
        vars: run.vars,
        seed: run.seed,
        next: { key: 'Daily', data: { event: this.eventId, place: place.id, finished: spot.id } satisfies DailyData },
        onVars: (vars) => setStoryVars(vars),
      };
      this.scene.start('Dialogue', data);
    };
    if (spot.confirm) this.confirm(spot.confirm, go);
    else go();
  }

  /**
   * 屋台めぐりの「けいかくひょう」：子どものりくの字で、回る屋台の一覧。回った屋台に赤い丸。
   * 子どもの手書き風の書体で、1文字ずつ少し傾け、大きさと高さをそろえずに書く（段階32b 調整3）
   */
  private drawPlan(root: Phaser.GameObjects.Container): void {
    const spots = this.hub.places.flatMap((p) => p.spots).filter((s) => s.required);
    const w = GAME_WIDTH - 48;
    const h = 200;
    // 紙ごと少し傾ける（中の字も一緒に傾く）
    const paper = this.add.container(GAME_WIDTH / 2, 590 + h / 2).setAngle(-1.5);
    root.add(paper);
    const left = -w / 2;
    const top = -h / 2;
    paper.add(this.add.rectangle(0, 0, w, h, 0xf4ecd8, 0.95).setStrokeStyle(2, 0x8a6a2a));
    this.scribble(paper, left + 18, top + 28, this.hub.plan ?? '', 24, 1);
    // 右の列は、長い名前（きんぎょすくい）のために少し広く
    const cols = [
      { left, w: w * 0.46 },
      { left: left + w * 0.46, w: w * 0.54 },
    ];
    spots.forEach((s, i) => {
      const { left: colLeft, w: colW } = cols[i % 2];
      const cy = top + 84 + Math.floor(i / 2) * 58;
      const boxX = colLeft + 20;
      const textX = boxX + 22;
      // 長い名前は、赤い丸ごと列に収まるよう、字を小さくする
      const room = colLeft + colW - 26 - textX;
      let size = 18;
      let written = this.scribble(paper, textX, cy, s.planLabel ?? s.label, size, i + 2);
      while (written.width > room && size > 12) {
        written.holder.destroy();
        size -= 1;
        written = this.scribble(paper, textX, cy, s.planLabel ?? s.label, size, i + 2);
      }
      const textW = written.width;
      if (isSeen(run.vars, s.id)) {
        // 回った屋台に、赤い丸（りくの字）。丸は字の幅に合わせ、紙（その列）からはみ出さないように収める
        const ringW = Math.min(textW + 22, colLeft + colW - 12 - (boxX + 12));
        const ringX = Math.min(textX + textW / 2, colLeft + colW - 12 - ringW / 2);
        paper.add(this.add.ellipse(ringX, cy, ringW, 42).setStrokeStyle(3, 0xc8402f).setAngle(-5));
        paper.add(addText(this, boxX, cy, '✓', { size: 22, bold: true, color: '#c8402f' }).setOrigin(0.5));
      } else {
        paper.add(addText(this, boxX, cy, '□', { size: 20, color: '#3a2a20' }).setOrigin(0.5));
      }
    });
  }

  /**
   * 子どもの字で1行書く（左の端 x、行の真ん中 y）。1文字ずつ、傾き・大きさ・高さ・字間を少しずつ変える。
   * 揺れ方は seed で決まる（開くたびに字が変わらないように）。字を入れた入れ物と、書いた幅を返す
   */
  private scribble(parent: Phaser.GameObjects.Container, x: number, y: number, text: string, size: number, seed: number): { holder: Phaser.GameObjects.Container; width: number } {
    // 1文字ずつ置くので、全文は入れ物に書いておく（通しの自動確認が文で探せるように）
    const holder = this.add.container(0, 0).setData('text', text);
    parent.add(holder);
    let cx = x;
    [...text].forEach((ch, i) => {
      // 小さな決まった乱数（-1〜1）
      const r = (k: number) => Math.sin((seed * 31 + i * 7 + k) * 12.9898) % 1;
      const t = addText(this, 0, 0, ch, { size: Math.round(size * (1 + r(1) * 0.1)), color: '#3a2a20', hand: true }).setOrigin(0, 0.5);
      t.setPosition(cx, y + r(2) * 2.5).setAngle(r(3) * 7);
      holder.add(t);
      cx += t.width * 0.94 + r(4) * 1.5;
    });
    return { holder, width: cx - x };
  }

  private confirm(text: string, onYes: () => void): void {
    const cx = GAME_WIDTH / 2;
    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(this.add.rectangle(cx, 420, 320, 220, COLORS.panel).setRounded(8).setStrokeStyle(1, COLORS.border));
    panel.add(addText(this, cx, 370, text, { size: 15, align: 'center', wrap: 280 }).setOrigin(0.5));
    addButton(this, panel, cx - 75, 470, 130, 52, 'はい', { onTap: onYes }, { size: 16, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 });
    addButton(this, panel, cx + 75, 470, 130, 52, 'いいえ', { onTap: () => panel.destroy(true) }, { size: 16 });
  }

  private toast(text: string): void {
    const t = addText(this, GAME_WIDTH / 2, 130, text, { size: 13, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5).setDepth(60);
    const bg = this.add.rectangle(GAME_WIDTH / 2, 130, t.width + 24, t.height + 14, 0x000000, 0.8).setDepth(59);
    this.tweens.add({ targets: [t, bg], alpha: 0, delay: 1800, duration: 400, onComplete: () => (t.destroy(), bg.destroy()) });
  }
}
