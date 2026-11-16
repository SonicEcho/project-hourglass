import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { AREAS, BACKDROPS, HUB_TILE_ART, HUB_TILE_TALL, SCREEN_COACH } from '../data';
import { startScreenCoach } from '../ui/screenCoach';
import { drawBackdrop } from '../ui/backdrop';
import { backButton, frameBg, frameCoachRect, frameHeader } from '../ui/frame';
import { addSlantTile } from '../ui/gallery';
import { waitImages } from '../ui/waitImages';
import { enterScreen } from '../ui/skin';
import { RENDER_SCALE } from '../ui/theme';
import { growthTiles } from './growthMenu';
import { getCampReturn, run, setCampReturn, setHubReturn } from './run';

// 探索の休憩所（段階147）：チェックポイントで「休憩する」と開く、拠点（レストピア）と同じ形のメニュー。
// 星図・武器・ムーブメント・アルバム・並びを1枚絵のタイルで並べ、開いた画面を閉じるとここへ戻る。「探索へ戻る」で、立っていたチェックポイントへ。
// 時間も進まず、セーブもしない（閉じたら探索の画面から続く）

/** 休憩所から開いた育成の画面の戻り先（育成の画面の戻るボタンに使う） */
const BACK_TO_CAMP = { key: 'Camp', data: {}, label: '休憩所へ戻る', place: '休憩所' };

export class CampScene extends Phaser.Scene {
  constructor() {
    super('Camp');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    // 育成の画面から戻ってきたので、育成の戻り先は忘れる
    setHubReturn(null);
    const root = this.add.container(0, 0);
    // 地：今いる区画の景色をうっすら（なければ暗い地）
    const area = run.explore ? AREAS[run.explore.area] : undefined;
    const view = area?.memory ? BACKDROPS[area.memory] : undefined;
    root.add(frameBg(this));
    if (view) {
      drawBackdrop(this, root, view, 0, GAME_HEIGHT, false);
      root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0705, 0.8).setOrigin(0));
    }
    frameHeader(this, root, 'hourglass', '休憩所', { label: area ? area.name : '', value: '' });
    // 段階235：拠点と同じ、斜めに切った絵のタイル。いちばん上の星図は大きく、ほかは3列（絵を待ってから描く）
    const tiles = growthTiles((key) => this.open(key));
    const art = [...new Set([...Object.values(HUB_TILE_TALL), ...Object.values(HUB_TILE_ART).flat()])];
    const layer = this.add.container(0, 0);
    root.add(layer);
    waitImages(this, art, () => {
      const left = 12;
      const [first, ...rest] = tiles;
      let top = 64;
      if (first) {
        addSlantTile(this, layer, left + 2, top, GAME_WIDTH - left * 2 - 4, 150, first, true);
        top += 150 + 12;
      }
      const cols = 3;
      const gap = 8;
      const bottom = 768;
      const rows = Math.max(1, Math.ceil(rest.length / cols));
      const tw = (GAME_WIDTH - left * 2 - gap * (cols - 1)) / cols;
      const th = Math.min(260, (bottom - top - gap * (rows - 1)) / rows);
      rest.forEach((t, i) => addSlantTile(this, layer, left + (i % cols) * (tw + gap), top + Math.floor(i / cols) * (th + gap), tw, th, t));
      // 段階236：初めての時は、照らす案内（戦闘と同じ形）
      startScreenCoach(this, 'camp_intro', SCREEN_COACH.camp_intro, (t) => (t === 'tiles' ? { x: 6, y: 58, w: GAME_WIDTH - 12, h: 768 - 58 + 6 } : frameCoachRect(t)));
    });
    backButton(this, root, '探索へ戻る', () => this.leave());
  }

  /** 育成の画面を開く。閉じるとここへ戻る */
  private open(key: string): void {
    setHubReturn(BACK_TO_CAMP);
    this.scene.start(key);
  }

  /** 立っていたチェックポイントへ戻る */
  private leave(): void {
    const back = getCampReturn();
    setCampReturn(null);
    setHubReturn(null);
    if (back) this.scene.start(back.key, back.data);
    else this.scene.start('Title');
  }
}
