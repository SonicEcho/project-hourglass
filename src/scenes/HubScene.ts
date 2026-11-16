import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { canEvolveAny, chapterOfEvent, eventPassed, isSeen, lostStatus, markSeen, nextKeeperTalk, shelfLost } from '../core';
import { BACKDROPS, BGM, CAST, HUB_LINES, HUB_TILE_ART, HUB_SCENES, canEnterSandBottom, KEEPER_TALKS, LOST_ITEMS, SLICE_FLOW, WEAPON_DATA } from '../data';
import { playBgm, stopAmbience } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { startWithImages, waitImages } from '../ui/waitImages';
import { enterScreen } from '../ui/skin';
import { backButton, frameHeader } from '../ui/frame';
import { FONT, RENDER_SCALE, STYLE } from '../ui/theme';
import { addSlantTile, type GalleryTile } from '../ui/gallery';
import { hasImage } from '../assets/loader';
import { addText } from '../ui/widgets';
import { growthTiles } from './growthMenu';
import type { DailyData } from './DailyScene';
import type { DialogueData } from './DialogueScene';
import { archivedTalks } from './TalkArchiveScene';
import { currentEvent, lineupBase, run, setHubReturn, setStoryVars, storyLineup } from './run';

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
    // 段階226：右に立つ仲間の立ち絵を読んでから描く
    const partner = this.pickPartner();
    const art = this.partnerArt(partner);
    // タイルの絵（代わりの1枚絵を含む。台帳にない id はそろったものとして扱われる）も一緒に待つ
    const tileArt = [...new Set(Object.values(HUB_TILE_ART).flat())];
    waitImages(this, [...(art ? [art] : []), ...tileArt], () => this.draw(partner));
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  /** 右に立つ仲間（段階226）：今の並びの、ハルトでない仲間から日ごとに1人（いなければハルト） */
  private pickPartner(): string {
    const ids = lineupBase(storyLineup())
      .map((c) => c.id)
      .filter((id) => id !== 'hero' && HUB_LINES[id]);
    if (ids.length === 0) return 'hero';
    const n = [...run.event].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return ids[n % ids.length];
  }

  /** 仲間の立ち絵の台帳の id（表情は HUB_LINES の face） */
  private partnerArt(id: string): string {
    const name = this.castName(id);
    const def = CAST[name];
    if (!def?.portrait) return '';
    const face = HUB_LINES[id]?.face ?? def.firstFace ?? '';
    return `${def.portrait}.${def.faces[face] ?? face}`;
  }

  private castName(id: string): string {
    return { hero: 'ハルト', akari: 'あかり', mio: 'みお', sayoko: '小夜子', hayase: '早瀬' }[id] ?? 'ハルト';
  }

  /**
   * 拠点の画面（段階226。docs/milestones/M3_ui_polish.md の 8. の A）：暗く沈めた蔵書の棚、右に仲間の立ち絵と吹き出し、
   * 斜めの「砂の底へ」、メニューの絵の斜めのタイルを4列
   */
  private draw(partner: string): void {
    const root = this.add.container(0, 0);
    drawBackdrop(this, root, BACKDROPS.library, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0a0c, 0.72).setOrigin(0));
    const stripes = this.add.graphics();
    stripes.lineStyle(2, STYLE.red, 0.08);
    for (let x = -GAME_HEIGHT; x < GAME_WIDTH; x += 16) stripes.lineBetween(x, GAME_HEIGHT, x + GAME_HEIGHT * 0.58, 0);
    root.add(stripes);
    // 仲間の立ち絵（右。紅の影）と吹き出し
    const art = this.partnerArt(partner);
    if (art && hasImage(this, art)) {
      const img = this.add.image(GAME_WIDTH + 80, 64, art).setOrigin(1, 0);
      img.setScale(500 / img.height);
      const ghost = this.add.image(img.x - 8, img.y, art).setOrigin(1, 0).setScale(img.scale).setTintFill(STYLE.red);
      root.add([ghost, img]);
    }
    this.drawBubble(root, partner);

    // 知らせ（タイルの札と、吹き出しで使う）
    const lostReady = shelfLost(LOST_ITEMS, run.returned).filter((d) => lostStatus(run.vars, d.id) === 'found').length;
    const petraTalk = isSeen(run.vars, 'exchange_intro') && nextKeeperTalk(KEEPER_TALKS, (id) => eventPassed(SLICE_FLOW, run.event, id), (scene) => isSeen(run.vars, scene));

    // 一番上の大きなタイル：砂の底（段階213。2章から）
    const digOpen = canEnterSandBottom(chapterOfEvent(SLICE_FLOW, run.event)?.id);
    addSlantTile(this, root, 14, 292, 262, 112, { id: 'sandBottom', label: '砂の底へ', sub: digOpen ? '返した記憶の地層を掘る' : '2章から', enabled: digOpen, onTap: () => this.openSandBottom() }, true);

    // 育成・交換所・落とし物の棚・町の小話（段階142 のギャラリーを、斜めの絵のタイル4列に）
    const tiles: GalleryTile[] = [
      ...growthTiles((key) => this.openGrowth(key)),
      // 段階152（テストプレイのメモ 2 の 7）：ペトラと話せる時は、タイルに札
      { id: 'exchange', label: '交換所', badge: petraTalk ? '話がある' : undefined, onTap: () => this.openExchange() },
      { id: 'lost', label: '落とし物', badge: lostReady > 0 ? '届けられる' : undefined, onTap: () => this.openLost() },
    ];
    const talks = archivedTalks();
    if (talks.length > 0) {
      const unseen = talks.filter((t) => !t.seen).length;
      tiles.push({ id: 'talks', label: '町の小話', badge: unseen > 0 ? `まだ ${unseen}` : undefined, onTap: () => this.openTalks() });
    }
    const cols = 4;
    const gap = 7;
    const left = 12;
    const top = 418;
    const bottom = 768;
    const rows = Math.ceil(tiles.length / cols);
    const tw = (GAME_WIDTH - left * 2 - gap * (cols - 1)) / cols;
    const th = Math.min(rows <= 2 ? 150 : 124, (bottom - top - gap * (rows - 1)) / rows);
    tiles.forEach((t, i) => addSlantTile(this, root, left + (i % cols) * (tw + gap), top + Math.floor(i / cols) * (th + gap), tw, th, t));

    // 見出し（段階141：共通の枠）と、昼へ戻る
    frameHeader(this, root, 'hourglass', 'レストピア', { label: '蔵書の棚 ― 時間は進まない ―', value: '' });
    backButton(this, root, '時計屋へ戻る', () => this.leave());
  }

  /** 仲間の吹き出し（段階226）：知らせがあればそれを、なければ日ごとのひとこと */
  private drawBubble(root: Phaser.GameObjects.Container, partner: string): void {
    const lines = HUB_LINES[partner];
    if (!lines) return;
    const lostReady = shelfLost(LOST_ITEMS, run.returned).some((d) => lostStatus(run.vars, d.id) === 'found');
    const evolvable = lineupBase(storyLineup()).some((c) => canEvolveAny(WEAPON_DATA, run.armory, c.id, run.vars));
    const petraTalk = isSeen(run.vars, 'exchange_intro') && !!nextKeeperTalk(KEEPER_TALKS, (id) => eventPassed(SLICE_FLOW, run.event, id), (scene) => isSeen(run.vars, scene));
    const n = [...run.event].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const text = lostReady ? lines.lost : evolvable ? lines.evolve : petraTalk ? lines.talk : lines.idle[n % lines.idle.length];
    const x = 26;
    const y = 112;
    const w = 196;
    const body = addText(this, 0, 0, text, { size: 12, bold: true, color: '#111111', wrap: w - 24, ja: true });
    const h = Math.max(52, body.height + 34);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.7).fillPoints([new Phaser.Math.Vector2(x + 4, y + 4), new Phaser.Math.Vector2(x + w + 4, y + 4), new Phaser.Math.Vector2(x + w - 8 + 4, y + h + 4), new Phaser.Math.Vector2(x + 4, y + h + 4)], true);
    g.fillStyle(0xffffff, 1).fillPoints([new Phaser.Math.Vector2(x, y), new Phaser.Math.Vector2(x + w, y), new Phaser.Math.Vector2(x + w - 8, y + h), new Phaser.Math.Vector2(x, y + h)], true);
    // しっぽ（右の立ち絵の方へ）
    g.fillTriangle(x + w - 40, y + h - 1, x + w - 14, y + h - 1, x + w + 6, y + h + 16);
    root.add(g);
    root.add(addText(this, x + 12, y + 8, this.castName(partner), { size: 11, bold: true, color: STYLE.redText }).setFontFamily(FONT).setFontStyle('bold italic'));
    root.add(body.setPosition(x + 12, y + 26));
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
