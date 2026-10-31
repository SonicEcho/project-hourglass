import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { AREAS, BACKDROPS } from '../data';
import { drawBackdrop } from '../ui/backdrop';
import { backButton, frameBg, frameHeader } from '../ui/frame';
import { addTileRows } from '../ui/gallery';
import { enterScreen } from '../ui/skin';
import { RENDER_SCALE } from '../ui/theme';
import { addPouchLine, growthTiles } from './growthMenu';
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
    const left = 14;
    const w = GAME_WIDTH - left * 2;
    const gap = 8;
    let y = addPouchLine(this, root, left, 62, w) + gap + 4;
    // 一番上の星図は大きく、ほかは段に並べる（拠点の「記憶をたどる」の場所に、星図）
    const tiles = growthTiles((key) => this.open(key));
    const [first, ...rest] = tiles;
    if (first) {
      addTileRows(this, root, [first], left, y, w, gap);
      y += 150 + gap;
    }
    addTileRows(this, root, rest, left, y, w, gap);
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
