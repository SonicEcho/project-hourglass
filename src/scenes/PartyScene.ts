import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { CharacterDef } from '../core';
import { PARTY_PHOTO } from '../data';
import { hasImage } from '../assets/loader';
import { SIDE_PADDING } from '../ui/layout';
import { addWindow, enterScreen, popIn } from '../ui/skin';
import { FRAME, FRAME_COLORS, frameBg, frameHeader, GOLD_BUTTON } from '../ui/frame';
import { COLORS, FONT_HEADING, RENDER_SCALE } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { currentParty, hubBack, partyChoice, setHubReturn, setParty } from './run';

// 戦闘の並び（段階91a）。仲間が戦闘に出られる人数より多い時に、出る人を選ぶ。探索のチェックポイントの星図と、拠点から開く。
// 外せない仲間（ハルト。物語でその時だけ外せない仲間）は、はじめから選ばれていて外せない。選んだ順に、戦闘の枠に左から並ぶ。
// 選ばなかった仲間も、星図・武器・ムーブメントでは育てられる。
// 段階143：見た目は「思い出のアルバム」（docs/ART.md の 5-9）。暗い机の上に開いたアルバムに、仲間のポラロイド写真を貼る

/** 机の色 */
const DESK = { top: 0x2e1e12, bottom: 0x0c0705 } as const;
/** アルバムの場所（ページの中の紙） */
const ALBUM = { x: 22, y: 92, w: GAME_WIDTH - 44, h: 628 } as const;
const ALBUM_COLORS = { paper: 0xe9e1d2, rule: 0xd6ccb8, cover: 0x5a2418 } as const;
/** ポラロイド写真の大きさと並べ方（2枚ずつ。dx は真ん中からのずれ、rowH は段の間） */
const PHOTO = { w: 150, h: 186, photoH: 138, dx: 82, top: 16, rowH: 202 } as const;
/** 写真の傾き（1枚ずつ少しずつ違う） */
const PHOTO_TILT = [-2, 1.5, -1.2, 2, -1.5, 1];
/** 外せない人の判子の色 */
const STAMP_RED = 0xb0303a;

export class PartyScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private picked: string[] = [];
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Party');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.picked = [...partyChoice().chosen];
    this.render();
  }

  private toggle(id: string): void {
    const { lineup, fixed } = partyChoice();
    if (fixed.includes(id)) return;
    const size = lineup.size ?? lineup.members.length;
    if (this.picked.includes(id)) this.picked = this.picked.filter((x) => x !== id);
    else if (this.picked.length < size) this.picked = [...this.picked, id];
    this.render();
  }

  private render(): void {
    this.root.removeAll(true);
    const { lineup, fixed } = partyChoice();
    const size = lineup.size ?? lineup.members.length;
    const cx = GAME_WIDTH / 2;
    this.root.add(frameBg(this, DESK.top, DESK.bottom));
    // 見出し（段階141：共通の枠）。右上に、選んだ人数
    frameHeader(this, this.root, 'album', '並び', { label: '出る', value: `${this.picked.length}/${size}` });
    this.root.add(addText(this, cx, 72, `戦闘に出る${size}人を選ぶ（選んだ順に左から並ぶ）`, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    this.drawAlbum();
    const members = currentParty(lineup);
    members.forEach((c, i) => this.drawPhoto(c, i, members.length, fixed.includes(c.id)));

    // 下：決める（ちょうど size 人の時だけ）
    const ready = this.picked.length === size;
    const back = hubBack();
    addButton(
      this,
      this.root,
      cx,
      FRAME.backY,
      GAME_WIDTH - SIDE_PADDING * 2 - 8,
      FRAME.backH,
      ready ? `この並びで決める（${back?.label ?? '星図へ戻る'}）` : `あと${size - this.picked.length}人選ぶ`,
      {
        onTap: () => {
          setParty(this.picked);
          if (!back) {
            this.scene.start('Growth');
            return;
          }
          setHubReturn(null);
          this.scene.start(back.key, back.data);
        },
      },
      ready ? { ...GOLD_BUTTON, size: 15 } : { enabled: false, size: 15 },
    );
  }

  /** 開いたアルバム：生成りの罫線の紙、紅の表紙のふち、真ん中の綴じ目 */
  private drawAlbum(): void {
    const { x, y, w, h } = ALBUM;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.55).fillRoundedRect(x + 3, y + 10, w, h, 8);
    g.fillStyle(ALBUM_COLORS.cover, 1).fillRoundedRect(x - 6, y - 6, w + 12, h + 12, 10);
    g.lineStyle(1.5, FRAME_COLORS.gold, 0.6).strokeRoundedRect(x - 3, y - 3, w + 6, h + 6, 8);
    g.fillStyle(ALBUM_COLORS.paper, 1).fillRect(x, y, w, h);
    g.lineStyle(1, ALBUM_COLORS.rule, 1);
    for (let ly = y + 28; ly < y + h; ly += 28) g.lineBetween(x + 6, ly, x + w - 6, ly);
    // 綴じ目（真ん中の影）
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.18, 0, 0.18);
    g.fillRect(x + w / 2 - 8, y, 8, h);
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.18, 0, 0.18, 0);
    g.fillRect(x + w / 2, y, 8, h);
    this.root.add(g);
  }

  /** 仲間1人のポラロイド写真（2枚ずつ並べ、最後の1枚は真ん中）。出る人は金の番号、外せない人は赤い判子、休む人は白黒 */
  private drawPhoto(c: CharacterDef, i: number, n: number, locked: boolean): void {
    const order = this.picked.indexOf(c.id);
    const on = order >= 0;
    const row = Math.floor(i / 2);
    const alone = i === n - 1 && n % 2 === 1;
    const cx = alone ? GAME_WIDTH / 2 : GAME_WIDTH / 2 + (i % 2 === 0 ? -1 : 1) * PHOTO.dx;
    const cy = ALBUM.y + PHOTO.top + row * PHOTO.rowH + PHOTO.h / 2;
    const card = this.add.container(cx, cy).setAngle(PHOTO_TILT[i % PHOTO_TILT.length]);
    const { w, h } = PHOTO;
    card.add(this.add.rectangle(2, 4, w, h, 0x000000, 0.3));
    card.add(this.add.rectangle(0, 0, w, h, 0xfdfbf6));
    // 写真（立ち絵の顔と肩）。立ち絵がない人は影
    const pw = w - 14;
    const ph = PHOTO.photoH;
    const px = -pw / 2;
    const py = -h / 2 + 7;
    const id = PARTY_PHOTO[c.id];
    if (id && hasImage(this, id)) {
      const src = this.textures.get(id).getSourceImage();
      const scale = pw / src.width;
      const top = src.height * 0.04;
      const img = this.add.image(px, py - top * scale, id).setOrigin(0).setScale(scale).setCrop(0, top, src.width, ph / scale);
      card.add(this.add.rectangle(px, py, pw, ph, 0xd8d0c0).setOrigin(0));
      if (!on) img.preFX?.addColorMatrix().grayscale(1);
      card.add(img.setAlpha(on ? 1 : 0.8));
    } else {
      card.add(this.add.rectangle(px, py, pw, ph, on ? 0x6a5a44 : 0x5a5650).setOrigin(0));
      card.add(this.add.circle(0, py + ph * 0.42, ph * 0.18, 0x000000, 0.35));
      card.add(this.add.ellipse(0, py + ph, pw * 0.7, ph * 0.5, 0x000000, 0.35).setOrigin(0.5, 1));
    }
    // 名前（写真の下の白い所）
    const name = addText(this, -w / 2 + 10, h / 2 - 21, c.name, { size: 15, bold: true, color: on ? '#2d2a26' : '#8a847a' }).setOrigin(0, 0.5);
    card.add(name.setFontFamily(FONT_HEADING));
    // マスキングテープ
    card.add(this.add.rectangle(0, -h / 2, 54, 16, 0xf2d48a, 0.7).setAngle(-4));
    // 出る順の番号（金）
    if (on) {
      const bx = w / 2 - 22;
      const by = py + ph - 4;
      card.add(this.add.circle(bx, by, 15, FRAME_COLORS.gold).setStrokeStyle(2, 0x5a3a12));
      card.add(addText(this, bx, by, String(order + 1), { size: 16, bold: true, color: FRAME_COLORS.goldInk }).setOrigin(0.5));
    }
    // 外せない人の赤い判子
    if (locked) {
      const stamp = this.add.container(px + 36, py + 16).setAngle(-8);
      const t = addText(this, 0, 0, '外せない', { size: 11, bold: true, color: '#b0303a' }).setOrigin(0.5);
      stamp.add(this.add.rectangle(0, 0, t.width + 10, t.height + 4, 0xffffff, 0.6).setStrokeStyle(1.5, STAMP_RED));
      stamp.add(t);
      card.add(stamp);
    }
    this.root.add(card);
    // タップで出る・休むを切り替え、長押しで能力値（写真の上の透明な四角で受ける）
    const hit = this.add.rectangle(cx, cy, w, h, 0x000000, 0.001);
    this.root.add(hit);
    makePressable(hit, {
      onTap: locked ? undefined : () => this.toggle(c.id),
      onLongPress: () => this.showStats(c),
    });
  }

  /** 長押し：その仲間の能力値の窓（写真には文字を出さないので、ここで見る） */
  private showStats(c: CharacterDef): void {
    this.overlay?.destroy(true);
    const o = this.add.container(0, 0).setDepth(100);
    this.overlay = o;
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
    o.add(shade);
    const top = 320;
    o.add(addWindow(this, 30, top, GAME_WIDTH - 60, 140, FRAME_COLORS.gold, FRAME_COLORS.panel));
    o.add(addText(this, 50, top + 20, c.name, { size: 18, bold: true, color: FRAME_COLORS.goldText }));
    const s = c.stats;
    o.add(addText(this, 50, top + 54, `HP ${s.hp}　MP ${s.mp}　攻撃 ${s.atk}\n魔力 ${s.mag}　防御 ${s.def}　速さ ${s.spd}`, { size: 14, color: COLORS.text }));
    o.add(addText(this, GAME_WIDTH / 2, top + 118, 'タップで閉じる', { size: 11, color: COLORS.subText }).setOrigin(0.5));
    makePressable(shade, {
      onTap: () => {
        o.destroy(true);
        this.overlay = undefined;
      },
    });
    popIn(this, o);
  }
}
