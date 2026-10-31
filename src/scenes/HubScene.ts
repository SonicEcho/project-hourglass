import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { areaChapter, dayAt, enterFade, eventPassed, fadeLevel, fadeRate, huntableAreas, huntRewardRate, isSeen, lostStatus, markSeen, shelfLost, startExplore } from '../core';
import { AREAS, BACKDROPS, BGM, HUB_SCENES, HUNT_OLD_AREA_RATE, MEMORY_FADE_LABELS, MEMORY_FADE_RATES, LOST_ITEMS, SLICE_FLOW } from '../data';
import { playBgm, stopAmbience } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { addWindow, enterScreen, popIn } from '../ui/skin';
import { backButton, FRAME_COLORS, frameHeader, PLAIN_BUTTON } from '../ui/frame';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { addGalleryTile, addTileRows, type GalleryTile } from '../ui/gallery';
import { addPouchLine, growthTiles } from './growthMenu';
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
    // ギャラリーの暗い地（段階142）：蔵書の棚はうっすら見えるだけにして、タイルの絵を引き立てる
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0705, 0.78).setOrigin(0));
    // 見出し（段階141：共通の枠）
    frameHeader(this, root, 'hourglass', 'レストピア', { label: '蔵書の棚 ― 時間は進まない ―', value: '' });

    // 思い出のギャラリー（段階142。docs/ART.md の 5-9）：メニューを1枚絵のタイルにする
    const left = 14;
    const w = GAME_WIDTH - left * 2;
    const gap = 8;
    // 狩り：一番上の大きなタイル
    const hunts = huntableAreas(AREAS, run.returned);
    let y = 62;
    addGalleryTile(this, root, left, y, w, 168, { id: 'hunt', label: '記憶をたどる', sub: '返した時間へ、もう一度', enabled: hunts.length > 0, onTap: () => this.pickHunt() });
    y += 168 + 6;
    // ポーチの中身（段階51）。1行で
    y = addPouchLine(this, root, left, y, w) + gap + 4;
    // 育成（今の章で開いているものだけ）
    y = addTileRows(this, root, growthTiles((key) => this.openGrowth(key)), left, y, w, gap);
    // 交換所（段階52）・落とし物の棚（段階53）・町の小話（段階82。過ぎた日の小話がある時だけ）
    const lostReady = shelfLost(LOST_ITEMS, run.returned).filter((d) => lostStatus(run.vars, d.id) === 'found').length;
    const misc: GalleryTile[] = [
      { id: 'exchange', label: '交換所', onTap: () => this.openExchange() },
      { id: 'lost', label: '落とし物の棚', badge: lostReady > 0 ? '届けられる' : undefined, onTap: () => this.openLost() },
    ];
    const talks = archivedTalks();
    if (talks.length > 0) {
      const unseen = talks.filter((t) => !t.seen).length;
      misc.push({ id: 'talks', label: '町の小話', badge: unseen > 0 ? `まだ ${unseen}` : undefined, onTap: () => this.openTalks() });
    }
    addTileRows(this, root, misc, left, y, w, gap, 3);
    // 昼へ戻る
    backButton(this, root, '時計屋へ戻る', () => this.leave());
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
    panel.add(addWindow(this, cx - 165, top, 330, h, FRAME_COLORS.gold, FRAME_COLORS.panel));
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
      addButton(this, panel, cx, top + 106 + i * 60, 290, 50, `${area.name}\n${note}`, { onTap: () => this.enterHunt(area.id) }, { ...PLAIN_BUTTON, size: 12, enabled: rate !== null });
    });
    addButton(this, panel, cx, top + h - 34, 150, 44, 'やめる', {
      onTap: () => {
        panel.destroy(true);
        this.overlay = undefined;
      },
    }, { ...PLAIN_BUTTON, size: 14 });
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
