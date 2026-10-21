import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { areaChapter, dayAt, enterFade, eventPassed, fadeLevel, fadeRate, hasSpare, huntableAreas, huntRewardRate, isSeen, markSeen, startExplore } from '../core';
import { AREAS, BACKDROPS, BGM, HUB_SCENES, HUNT_OLD_AREA_RATE, ITEMS, MEMORY_FADE_LABELS, MEMORY_FADE_RATES, POUCH_MAX, POUCH_ORDER, SLICE_FLOW } from '../data';
import { playBgm, stopAmbience } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { addWindow, enterScreen, popIn } from '../ui/skin';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import type { DailyData } from './DailyScene';
import type { DialogueData } from './DialogueScene';
import type { ExploreData } from './ExploreScene';
import { notePlayCount } from './playRecord';
import { archivedTalks } from './TalkArchiveScene';
import { currentEvent, run, setHubReturn, setStoryVars, startHunt, storyLineup } from './run';

// レストピアの拠点（段階50。docs/design/economy.md の 4.）：昼の時計屋の奥から入る、蔵書の棚。
// 狩り（返した時間へ）と育成（星図・ムーブメント・武器・アルバム）、交換所（段階52）を1つの画面から開く。落とし物の棚（段階53）もここ。
// 日も昼の回数も使わない。拠点にいることはセーブしない（閉じたら昼の日常から）

/** 育成の画面から拠点へ戻る時の戻り先（育成の画面の戻るボタンと見出しに使う） */
const BACK_TO_HUB = { key: 'Hub', data: { seen: undefined }, label: 'レストピアへ戻る', place: 'レストピア（蔵書の棚）' };

export class HubScene extends Phaser.Scene {
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Hub');
  }

  create(data: { seen?: string } = {}): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.overlay = undefined;
    // 拠点の会話（段階50）：見終えて戻ってきたら覚える。まだ見ていない会話があれば、先に見る
    if (data.seen) setStoryVars(markSeen(run.vars, data.seen));
    const pending = HUB_SCENES.find(
      (h) =>
        !isSeen(run.vars, h.scene) &&
        (!h.after || eventPassed(SLICE_FLOW, run.event, h.after)) &&
        (!h.before || (!eventPassed(SLICE_FLOW, run.event, h.before) && run.event !== h.before)),
    );
    if (pending) {
      const talk: DialogueData = {
        scene: pending.scene,
        vars: run.vars,
        seed: run.seed,
        next: { key: 'Hub', data: { seen: pending.scene } },
        onVars: (vars) => setStoryVars(vars),
      };
      this.scene.start('Dialogue', talk);
      return;
    }
    enterScreen(this);
    // 育成の画面から戻ってきた（または昼から来た）ので、育成の戻り先は忘れる
    setHubReturn(null);
    stopAmbience();
    playBgm(this, BGM.library);
    const root = this.add.container(0, 0);
    drawBackdrop(this, root, BACKDROPS.library, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, 96, 0x000000, 0.55).setOrigin(0));
    root.add(addText(this, GAME_WIDTH / 2, 30, 'レストピア', { size: 20, bold: true }).setOrigin(0.5));
    root.add(addText(this, GAME_WIDTH / 2, 62, '蔵書の棚　― 時間は進まない ―', { size: 12, color: COLORS.subText }).setOrigin(0.5));

    const cx = GAME_WIDTH / 2;
    const w = GAME_WIDTH - 60;
    const strong = { size: 17, bold: true, fill: 0x2f4f3a, stroke: 0x6fe0a0, strokeWidth: 2 };
    // 狩り
    const hunts = huntableAreas(AREAS, run.returned);
    addButton(this, root, cx, 180, w, 62, '記憶をたどる', { onTap: () => this.pickHunt() }, { ...strong, enabled: hunts.length > 0 });
    // ポーチの中身（段階51）。絵の上でも読めるよう、暗い下地に白い字（2026-10-16 開発者の指摘：見にくかった）
    const pouch = POUCH_ORDER.map((id) => `${ITEMS[id as keyof typeof ITEMS].name} ${run.armory.items[id] ?? 0}`).join('　');
    root.add(this.add.rectangle(cx, 237, w, 44, 0x0b0f22, 0.85).setRounded(8).setStrokeStyle(1, COLORS.border));
    root.add(addText(this, cx, 225, `ポーチ（1種類${POUCH_MAX}個まで）`, { size: 11, color: COLORS.subText }).setOrigin(0.5));
    root.add(addText(this, cx, 245, pouch, { size: 14, bold: true, color: COLORS.text }).setOrigin(0.5));
    // 育成（今の章で開いているものだけ）
    const unlocks = storyLineup().unlocks;
    const grow: [string, string][] = [];
    if (unlocks.growth) grow.push(['星図', 'Growth']);
    if (unlocks.navi) grow.push(['ムーブメント', 'Navi']);
    if (unlocks.weapon) grow.push(['武器', 'Weapon']);
    if (hasSpare(run.album)) grow.push(['アルバム', 'Album']);
    const gap = 8;
    const per = Math.min(3, grow.length);
    const bw = (w - gap * (per - 1)) / Math.max(1, per);
    grow.forEach(([label, key], i) => {
      const row = Math.floor(i / per);
      const col = i % per;
      addButton(this, root, 30 + bw / 2 + col * (bw + gap), 290 + row * 64, bw, 54, label, { onTap: () => this.openGrowth(key) }, {
        size: 15,
        bold: true,
        fill: 0x1e3a5a,
        stroke: 0x6bc8ff,
        strokeWidth: 2,
      });
    });
    const below = 290 + Math.ceil(grow.length / Math.max(1, per)) * 64 + 30;
    // 交換所（段階52）と落とし物の棚（段階53）
    addButton(this, root, cx, below + 20, w, 54, '交換所', { onTap: () => this.openExchange() }, { size: 15, bold: true, fill: 0x24384a, stroke: 0x6bc8ff, strokeWidth: 2 });
    addButton(this, root, cx, below + 84, w, 54, '落とし物の棚', { onTap: () => this.openLost() }, { size: 15, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 });
    // 町の小話（段階82）：過ぎた日の小話を後から見る。過ぎた日の小話がある時だけ
    const talks = archivedTalks();
    if (talks.length > 0) {
      const unseen = talks.filter((t) => !t.seen).length;
      addButton(this, root, cx, below + 148, w, 54, unseen > 0 ? `町の小話（まだ ${unseen}）` : '町の小話', { onTap: () => this.openTalks() }, { size: 15, bold: true, fill: 0x3a2a4a, stroke: 0xc8a0ff, strokeWidth: 2 });
    }
    // 昼へ戻る
    addButton(this, root, cx, 780, w, 56, '時計屋へ戻る', { onTap: () => this.leave() }, { size: 17, bold: true });
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  /** 育成の画面を開く。閉じると拠点に戻る */
  private openGrowth(key: string): void {
    if (this.overlay) return;
    setHubReturn({ ...BACK_TO_HUB, data: { seen: undefined } });
    this.scene.start(key);
  }

  /** 交換所を開く（段階52。初めてなら、ペトラの会話から） */
  private openExchange(): void {
    if (this.overlay) return;
    this.scene.start('Exchange', { seen: undefined });
  }

  /** 落とし物の棚を開く（段階53。初めてなら、棚の会話から） */
  private openLost(): void {
    if (this.overlay) return;
    this.scene.start('Lost', { seen: undefined, got: undefined });
  }

  /** 町の小話を開く（段階82） */
  private openTalks(): void {
    if (this.overlay) return;
    this.scene.start('TalkArchive', { seen: undefined, page: 0 });
  }

  /** 昼の時計屋へ戻る（昼の日常の途中でなければ、物語の流れへ） */
  private leave(): void {
    run.hunt = null;
    const data: DailyData = { event: run.event, place: 'clockshop', finished: undefined };
    if (currentEvent().kind === 'daily') this.scene.start('Daily', data);
    else this.scene.start('Flow', { done: false });
  }

  /** 狩りに入る区画を選ぶ（段階43。段階50で昼の時計屋からここへ移した）。前の章の区画は、星の砂と経験値が半分 */
  private pickHunt(): void {
    if (this.overlay) return;
    const areas = huntableAreas(AREAS, run.returned);
    const cx = GAME_WIDTH / 2;
    const h = 150 + areas.length * 60;
    const top = Math.round((GAME_HEIGHT - h) / 2);
    const panel = this.add.container(0, 0).setDepth(50);
    this.overlay = panel;
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(addWindow(this, cx - 165, top, 330, h));
    panel.add(addText(this, cx, top + 30, 'どの記憶をたどる？', { size: 17, bold: true }).setOrigin(0.5));
    panel.add(addText(this, cx, top + 58, '砂嵐の名残とぬしから素材を集める\n同じ記憶を続けてたどると薄れる（1日で戻る）', { size: 12, color: COLORS.subText, align: 'center', wrap: 300 }).setOrigin(0.5));
    const now = storyLineup().chapter;
    const today = dayAt(SLICE_FLOW, run.event);
    areas.forEach((area, i) => {
      const half = huntRewardRate(areaChapter(SLICE_FLOW, area.id), now, HUNT_OLD_AREA_RATE) < 1;
      // 記憶の濃さ（段階57）：同じ記憶を続けてたどるほど薄れ、使い切るとその日は入れない
      const level = fadeLevel(run.vars, area.id, today);
      const rate = fadeRate(MEMORY_FADE_RATES, level);
      const fade = rate === null ? '今日はもう、かすれて見えない' : rate < 1 ? `記憶が${MEMORY_FADE_LABELS[level]}（実入り${Math.round(rate * 10)}割）` : '記憶は濃い';
      const note = [fade, half && rate !== null ? '星の砂と経験値は半分' : ''].filter(Boolean).join('・');
      addButton(this, panel, cx, top + 106 + i * 60, 290, 50, `${area.name}\n${note}`, { onTap: () => this.enterHunt(area.id) }, { size: 12, enabled: rate !== null });
    });
    addButton(this, panel, cx, top + h - 34, 150, 44, 'やめる', {
      onTap: () => {
        panel.destroy(true);
        this.overlay = undefined;
      },
    }, { size: 14 });
    popIn(this, panel);
  }

  /** 狩りに入る（入るたびに新しい中身。狩りの途中はセーブしない） */
  private enterHunt(areaId: string): void {
    const area = AREAS[areaId];
    if (!area) return;
    // 記憶の薄れ（段階57）：入るたびに1段階薄れる（今日はもう入れなければ何もしない）
    const fade = enterFade(run.vars, areaId, dayAt(SLICE_FLOW, run.event), MEMORY_FADE_RATES);
    if (!fade) return;
    setStoryVars(fade.vars);
    notePlayCount('hunt');
    startHunt(startExplore(area), fade.rate);
    const data: ExploreData = { area: areaId, won: undefined, lost: undefined, seen: undefined, hunt: true };
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => this.scene.start('Explore', data));
  }
}
