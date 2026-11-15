import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { chapterOfEvent, eventPassed, isSeen, lostStatus, markSeen, nextKeeperTalk, shelfLost } from '../core';
import { BACKDROPS, BGM, HUB_SCENES, canEnterSandBottom, KEEPER_TALKS, LOST_ITEMS, SLICE_FLOW } from '../data';
import { playBgm, stopAmbience } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { startWithImages } from '../ui/waitImages';
import { enterScreen } from '../ui/skin';
import { backButton, frameHeader } from '../ui/frame';
import { RENDER_SCALE } from '../ui/theme';
import { addGalleryTile, addTileRows, type GalleryTile } from '../ui/gallery';
import { growthTiles } from './growthMenu';
import type { DailyData } from './DailyScene';
import type { DialogueData } from './DialogueScene';
import { archivedTalks } from './TalkArchiveScene';
import { currentEvent, run, setHubReturn, setStoryVars } from './run';

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
    // 一番上の大きなタイル：砂の底（段階213。前は狩り「記憶をたどる」。狩りは砂の底に置き換えた。2章から）
    const digOpen = canEnterSandBottom(chapterOfEvent(SLICE_FLOW, run.event)?.id);
    let y = 62;
    addGalleryTile(this, root, left, y, w, 168, { id: 'sandBottom', label: '砂の底', sub: digOpen ? '返した記憶の地層を掘る' : '2章から', enabled: digOpen, onTap: () => this.openSandBottom() });
    y += 168 + 6;
    // ポーチの中身（段階51）。1行で
    // 育成（今の章で開いているものだけ）
    y = addTileRows(this, root, growthTiles((key) => this.openGrowth(key)), left, y, w, gap);
    // 交換所（段階52）・落とし物の棚（段階53）・町の小話（段階82。過ぎた日の小話がある時だけ）
    const lostReady = shelfLost(LOST_ITEMS, run.returned).filter((d) => lostStatus(run.vars, d.id) === 'found').length;
    const petraTalk = isSeen(run.vars, 'exchange_intro') && nextKeeperTalk(KEEPER_TALKS, (id) => eventPassed(SLICE_FLOW, run.event, id), (scene) => isSeen(run.vars, scene));
    const misc: GalleryTile[] = [
      // 段階152（テストプレイのメモ 2 の 7）：ペトラと話せる時は、タイルに札
      { id: 'exchange', label: '交換所', badge: petraTalk ? '話がある' : undefined, onTap: () => this.openExchange() },
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

  /** 砂の底へ潜る（段階209） */
  private openSandBottom(): void {
    if (this.overlay) return;
    startWithImages(this, 'SandBottom', {});
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
    const data: DailyData = { event: run.event, place: 'clockshop', finished: undefined };
    if (currentEvent().kind === 'daily') this.scene.start('Daily', data);
    else this.scene.start('Flow', { done: false });
  }
}
