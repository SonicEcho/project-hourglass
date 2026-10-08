import Phaser from 'phaser';
import type { GridCell, GridMap } from '../core';
import { findPath, nearestWalkable, parseGrid } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { hasImage } from '../assets/loader';
import { playBgm, playSe } from '../audio/sound';
import type { ProtoMapDef, ProtoMapKey } from '../data';
import { PROTO_ENEMY_STEP_MS, PROTO_MAPS, PROTO_STEP_MS, PROTO_TILE, SE } from '../data';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';

const T = PROTO_TILE;

interface Enemy {
  sprite: Phaser.GameObjects.Container;
  /** 行き来する道（マスの並び。最後まで行ったら最初に戻る） */
  route: GridCell[];
  index: number;
  /** 触れた後、しばらく「遭遇！」を出さない */
  quietUntil: number;
}

/**
 * 探索の試作（段階16）。エンジンを決めるために、区画の移動を小さく試す。本編では使わない。
 * 画面をタップすると、その場所まで最短の道を歩く。宝箱・チェックポイント・敵の印は、触れると文字を出すだけ
 * 段階18b：縁日の見下ろしの絵の上を歩く地図も選べる（見えないマス目は「マス目」のボタンで見える）
 */
export class ProtoExploreScene extends Phaser.Scene {
  private map!: GridMap;
  /** 今の地図（図形の地図か、縁日の絵の地図か） */
  private def: ProtoMapDef = PROTO_MAPS.shapes;
  private player!: Phaser.GameObjects.Container;
  private playerCell: GridCell = [0, 0];
  /** これから歩くマス */
  private route: GridCell[] = [];
  /** 今、歩いて向かっている途中のマス */
  private nextCell: GridCell | null = null;
  private walking = false;
  private enemies: Enemy[] = [];
  private chests = new Map<string, Phaser.GameObjects.Rectangle>();
  private marker!: Phaser.GameObjects.Arc;
  private message!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  private messageTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('ProtoExplore');
  }

  init(data: { map?: ProtoMapKey }): void {
    this.def = PROTO_MAPS[data.map ?? 'shapes'];
  }

  create(): void {
    if (this.def.bgm) playBgm(this, this.def.bgm);
    const layout = this.def.layout;
    this.map = parseGrid(layout);
    this.route = [];
    this.walking = false;
    this.nextCell = null;
    this.enemies = [];
    this.chests = new Map();
    const world = this.add.container(0, 0);
    const ui = this.add.container(0, 0);

    // 地図：絵があれば絵を敷く（歩ける場所は見えないマス目）。なければ壁と通路を1枚の図形に描く
    if (this.def.image && hasImage(this, this.def.image)) {
      world.add(this.add.image(0, 0, this.def.image).setOrigin(0).setDisplaySize(this.map.cols * T, this.map.rows * T));
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x0b1118, 1).fillRect(0, 0, this.map.cols * T, this.map.rows * T);
      layout.forEach((line, r) => {
        [...line].forEach((ch, c) => {
          if (ch === '#') return;
          g.fillStyle((c + r) % 2 === 0 ? 0x22303f : 0x1f2c3a, 1).fillRect(c * T, r * T, T, T);
        });
      });
      world.add(g);
    }

    // 見えないマス目（「マス目」のボタンで、通れないマスを赤く見せる）
    const gridView = this.add.graphics().setVisible(false);
    layout.forEach((line, r) => {
      [...line].forEach((ch, c) => {
        gridView.lineStyle(1, 0xffffff, 0.15).strokeRect(c * T, r * T, T, T);
        if (ch === '#') gridView.fillStyle(0xff3030, 0.3).fillRect(c * T, r * T, T, T);
      });
    });
    world.add(gridView);

    // 宝箱・チェックポイント・ボスの印
    layout.forEach((line, r) => {
      [...line].forEach((ch, c) => {
        const x = c * T + T / 2;
        const y = r * T + T / 2;
        if (ch === 'C') {
          const box = this.add.rectangle(x, y, T * 0.7, T * 0.55, 0x9a6a2f).setStrokeStyle(2, 0xffd84a);
          this.chests.set(`${c},${r}`, box);
          world.add(box);
        } else if (ch === 'P') {
          world.add(this.add.circle(x, y, T * 0.35).setStrokeStyle(3, 0x6bc8ff));
        } else if (ch === 'B') {
          world.add(this.add.circle(x, y, T * 0.7, 0x8a4fbf).setStrokeStyle(2, 0xffffff));
          world.add(addText(this, x, y, '歪', { size: 16, bold: true }).setOrigin(0.5));
        } else if (ch === 'S') {
          this.playerCell = [c, r];
        }
      });
    });

    // タップした所の印
    this.marker = this.add.circle(0, 0, 6, 0xffd84a, 0.8).setVisible(false);
    world.add(this.marker);

    // 敵の印（決まった道を行き来する）
    for (const points of this.def.patrols) {
      const route: GridCell[] = [points[0]];
      for (let i = 0; i < points.length; i++) {
        const from = points[i];
        const to = points[(i + 1) % points.length];
        route.push(...(findPath(this.map, from, to) ?? []));
      }
      route.pop(); // 最後は最初のマスと同じ
      const sprite = this.add.container(points[0][0] * T + T / 2, points[0][1] * T + T / 2);
      sprite.add(this.add.rectangle(0, 0, T * 0.6, T * 0.6, COLORS.enemy).setAngle(45));
      world.add(sprite);
      const enemy: Enemy = { sprite, route, index: 0, quietUntil: 0 };
      this.enemies.push(enemy);
      this.stepEnemy(enemy);
    }

    // 仲間（ハルト）：立ち絵があれば、小さくした顔を足元の影の上に置く（歩くアニメーションは作らない。docs/ART.md）
    this.player = this.add.container(this.playerCell[0] * T + T / 2, this.playerCell[1] * T + T / 2);
    if (hasImage(this, 'portrait.hero.normal')) {
      this.player.add(this.add.ellipse(0, T * 0.35, T * 0.8, T * 0.3, 0x000000, 0.35));
      const face = this.add.image(0, T * 0.4, 'portrait.hero.normal').setOrigin(0.5, 1);
      face.setScale((T * 1.4) / face.height);
      this.player.add(face);
    } else {
      this.player.add(this.add.circle(0, 0, T * 0.42, COLORS.ally).setStrokeStyle(2, 0xffffff));
      this.player.add(addText(this, 0, 0, 'ハ', { size: 14, bold: true }).setOrigin(0.5));
    }
    world.add(this.player);

    // カメラ：地図用は仲間について動く。画面の文字とボタン用は別のカメラで、動かさない
    const cam = this.cameras.main;
    cam.setZoom(RENDER_SCALE).setBounds(0, 0, this.map.cols * T, this.map.rows * T).startFollow(this.player, true, 0.2, 0.2);
    const uiCam = this.cameras.add(0, 0, cam.width, cam.height).setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    cam.ignore(ui);
    uiCam.ignore(world);

    // 画面の文字とボタン
    ui.add(this.add.rectangle(0, 0, GAME_WIDTH, 64, 0x000000, 0.55).setOrigin(0));
    ui.add(addText(this, GAME_WIDTH / 2, 20, this.def.title, { size: 15, bold: true }).setOrigin(0.5, 0));
    this.fpsText = addText(this, GAME_WIDTH - 10, 22, 'FPS --', { size: 13, color: COLORS.accentText }).setOrigin(1, 0);
    ui.add(this.fpsText);
    addButton(this, ui, 46, 32, 76, 44, '戻る', { onTap: () => this.scene.start('Title') }, { size: 14 });
    addButton(this, ui, 46, 84, 76, 36, 'マス目', { onTap: () => gridView.setVisible(!gridView.visible) }, { size: 13 });
    this.message = addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 120, 'タップした場所まで歩きます', {
      size: 15,
      align: 'center',
      wrap: GAME_WIDTH - 40,
    }).setOrigin(0.5);
    ui.add(this.add.rectangle(0, GAME_HEIGHT - 160, GAME_WIDTH, 80, 0x000000, 0.55).setOrigin(0));
    ui.add(this.message);

    this.time.addEvent({ delay: 500, loop: true, callback: () => this.fpsText.setText(`FPS ${Math.round(this.game.loop.actualFps)}`) });

    // タップ（ボタンの上は除く）
    this.input.on('pointerup', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0) return;
      if (p.getDistance() > 12) return; // ドラッグは無視
      const pt = p.positionToCamera(cam) as Phaser.Math.Vector2;
      this.walkTo([Math.floor(pt.x / T), Math.floor(pt.y / T)]);
    });
  }

  update(): void {
    // 敵の印に触れたか
    const now = this.time.now;
    for (const e of this.enemies) {
      if (now < e.quietUntil) continue;
      if (Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, this.player.x, this.player.y) < T * 0.6) {
        e.quietUntil = now + 2000;
        this.say('遭遇！（試作なので戦闘には入らない）');
        playSe(this, SE.encounter);
        this.cameras.main.shake(150, 0.004);
      }
    }
  }

  /** タップしたマスへ歩く。壁なら近くの通れるマスへ */
  private walkTo(target: GridCell): void {
    const goal = nearestWalkable(this.map, target);
    if (!goal) return;
    // 歩いている途中なら、今向かっているマスから道を探し直す
    const from = this.nextCell ?? this.playerCell;
    const path = findPath(this.map, from, goal);
    if (!path) return;
    this.marker.setPosition(goal[0] * T + T / 2, goal[1] * T + T / 2).setVisible(true);
    this.route = path;
    if (!this.walking) this.step();
  }

  private step(): void {
    const next = this.route.shift();
    if (!next) {
      this.walking = false;
      this.nextCell = null;
      this.marker.setVisible(false);
      return;
    }
    this.walking = true;
    this.nextCell = next;
    this.tweens.add({
      targets: this.player,
      x: next[0] * T + T / 2,
      y: next[1] * T + T / 2,
      duration: PROTO_STEP_MS,
      onComplete: () => {
        this.playerCell = next;
        this.nextCell = null;
        this.arrive(next);
        this.step();
      },
    });
  }

  /** マスに着いた時の出来事 */
  private arrive([c, r]: GridCell): void {
    const ch = this.def.layout[r][c];
    const chest = this.chests.get(`${c},${r}`);
    if (chest && chest.fillColor !== 0x4a3a28) {
      chest.setFillStyle(0x4a3a28).setStrokeStyle(2, 0x6b5a40);
      playSe(this, SE.chest);
      this.say('宝箱を開けた！ 素材を手に入れた（試作なので持ち物には入らない）');
    } else if (ch === 'P') {
      this.say('チェックポイント：ここで記録した（試作なので保存はしない）');
    } else if (ch === 'B') {
      this.say('区画の奥のボスの印（試作では表示だけ）');
    }
  }

  private stepEnemy(e: Enemy): void {
    e.index = (e.index + 1) % e.route.length;
    const [c, r] = e.route[e.index];
    this.tweens.add({
      targets: e.sprite,
      x: c * T + T / 2,
      y: r * T + T / 2,
      duration: PROTO_ENEMY_STEP_MS,
      onComplete: () => this.stepEnemy(e),
    });
  }

  private say(text: string): void {
    this.message.setText(text).setAlpha(1);
    this.messageTimer?.remove();
    this.messageTimer = this.time.delayedCall(2500, () => this.tweens.add({ targets: this.message, alpha: 0.4, duration: 300 }));
  }
}
