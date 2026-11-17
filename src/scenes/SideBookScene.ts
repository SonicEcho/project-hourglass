import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { SideEvent } from '../core';
import { isSeen, sideChainStatus } from '../core';
import { BACKDROPS, SCREEN_COACH, SIDE_CHAINS, SIDE_EVENTS, TOWN } from '../data';
import { drawBackdrop } from '../ui/backdrop';
import { backButton, frameCoachRect, frameHeader } from '../ui/frame';
import { SIDE_PADDING } from '../ui/layout';
import { startScreenCoach } from '../ui/screenCoach';
import { ScrollArea } from '../ui/scrollArea';
import { addWindow, enterScreen } from '../ui/skin';
import { COLORS, RENDER_SCALE, STYLE } from '../ui/theme';
import { addSlant, addText, makePressable } from '../ui/widgets';
import type { DialogueData } from './DialogueScene';
import { run, setStoryVars } from './run';

// 寄り道の帳面（段階240。docs/milestones/M3_side_events.md）：拠点から開く。寄り道の連作ごとに、見た話と、次の話がいつ・どこで出るか。
// 見た話はタップすると読み返せる（読み返しても、何も変わらない）

const LIST_TOP = 64;
const MSG_Y = 702;
const MSG_H = 60;
const LIST_BOTTOM = MSG_Y - 8;
const CARD_GAP = 10;
const HEAD_H = 40;
const ROW_H = 30;

export class SideBookScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private list!: ScrollArea;

  constructor() {
    super('SideBook');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
    this.list = new ScrollArea(this);
    this.render();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    startScreenCoach(this, 'side_book', SCREEN_COACH.side_book, (t) =>
      t === 'cards' ? { x: 4, y: LIST_TOP - 4, w: GAME_WIDTH - 8, h: Math.min(LIST_BOTTOM - LIST_TOP + 8, HEAD_H + 3 * ROW_H + 16) } : frameCoachRect(t),
    );
  }

  private render(): void {
    this.root.removeAll(true);
    const root = this.root;
    drawBackdrop(this, root, BACKDROPS.shopping_street, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0));
    const chains = Object.entries(SIDE_EVENTS);
    const heights = chains.map(([, events]) => HEAD_H + events.length * ROW_H + 10);
    const content = heights.reduce((a, h) => a + h + CARD_GAP, 0) - CARD_GAP;
    const layer = this.list.build(root, LIST_TOP, LIST_BOTTOM, content);
    let y = LIST_TOP;
    chains.forEach(([id, events], i) => {
      this.drawCard(layer, id, events, y, heights[i]);
      y += heights[i] + CARD_GAP;
    });
    const all = chains.flatMap(([, e]) => e);
    frameHeader(this, root, 'support', '寄り道の帳面', { label: '見た話', value: `${all.filter((e) => isSeen(run.vars, e.id)).length}/${all.length}` });
    root.add(addWindow(this, SIDE_PADDING, MSG_Y, GAME_WIDTH - SIDE_PADDING * 2, MSG_H, STYLE.red, STYLE.ink, 0.92));
    const msg = addText(this, SIDE_PADDING + 14, MSG_Y + MSG_H / 2, '寄り道は、昼の町に「？」の印で出ます。見た話は、題をタップすると読み返せます。', { size: 12, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 28 }).setOrigin(0, 0.5);
    root.add(msg);
    backButton(this, root, 'レストピアへ戻る', () => this.scene.start('Hub', { seen: undefined }));
  }

  /** 連作の札：名前・今の様子・話の一覧（見た話は題と ✓、まだの話は ？？？） */
  private drawCard(layer: Phaser.GameObjects.Container, id: string, events: readonly SideEvent[], top: number, h: number): void {
    const x = SIDE_PADDING;
    const w = GAME_WIDTH - SIDE_PADDING * 2;
    const today = run.progress.day;
    const st = sideChainStatus(events, run.vars, today, (place) => TOWN[place]?.name ?? place);
    const done = st.tone === 'done';
    layer.add(this.add.rectangle(x, top, w, h, STYLE.ink, 0.93).setOrigin(0).setStrokeStyle(st.tone === 'today' ? 2 : 1, st.tone === 'today' ? STYLE.yellow : 0x2e2c34));
    layer.add(this.add.rectangle(x, top, 4, h, st.tone === 'today' ? STYLE.yellow : done ? 0x3a3840 : STYLE.red).setOrigin(0));
    const name = addText(this, x + 16, top + 20, SIDE_CHAINS[id]?.name ?? id, { size: 16, bold: true }).setOrigin(0, 0.5);
    name.setFontStyle('bold italic');
    layer.add(name);
    const tone = { today: { fill: STYLE.yellow, ink: '#0b0a0c' }, later: { fill: 0xffffff, ink: '#0b0a0c' }, seen: { fill: STYLE.red, ink: '#ffffff' }, done: { fill: 0x4a4850, ink: '#c8c6cc' } }[st.tone];
    const tagT = addText(this, 0, top + 20, st.label, { size: 9, bold: true, color: tone.ink }).setOrigin(0.5);
    const tagW = tagT.width + 16;
    const tagX = x + w - 10 - tagW / 2;
    layer.add(addSlant(this, tagX, top + 20, tagW, 16, tone.fill));
    tagT.setX(tagX);
    layer.add(tagT);
    const nameMax = tagX - tagW / 2 - 8 - (x + 16);
    if (name.width > nameMax) name.setScale(nameMax / name.width, 1);
    events.forEach((e, i) => {
      const ry = top + HEAD_H + i * ROW_H;
      const seen = isSeen(run.vars, e.id);
      const row = this.add.rectangle(x + 10, ry, w - 20, ROW_H - 4, seen ? 0x1c1a22 : 0x111014, 0.95).setOrigin(0);
      layer.add(row);
      layer.add(addText(this, x + 20, ry + (ROW_H - 4) / 2, `第${i + 1}話`, { size: 10, color: COLORS.subText }).setOrigin(0, 0.5));
      layer.add(addText(this, x + 66, ry + (ROW_H - 4) / 2, seen ? e.title : '？？？', { size: 13, bold: seen, color: seen ? COLORS.text : COLORS.dimText }).setOrigin(0, 0.5));
      if (seen) {
        layer.add(addText(this, x + w - 22, ry + (ROW_H - 4) / 2, '読み返す ▶', { size: 10, bold: true, color: STYLE.yellowText }).setOrigin(1, 0.5));
        makePressable(row, { onTap: this.list.guard(() => this.replay(e)) });
      }
    });
  }

  /** 見た話を読み返す（物語の値は変えない） */
  private replay(e: SideEvent): void {
    const talk: DialogueData = { scene: e.id, vars: run.vars, seed: run.seed, next: { key: 'SideBook', data: {} }, onVars: (vars) => setStoryVars(vars) };
    this.scene.start('Dialogue', talk);
  }
}
