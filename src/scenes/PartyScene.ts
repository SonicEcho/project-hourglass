import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SIDE_PADDING } from '../ui/layout';
import { enterScreen, screenBg } from '../ui/skin';
import { ALLY_COLOR, COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { currentParty, hubBack, partyChoice, setHubReturn, setParty } from './run';

// 戦闘の並び（段階91a）。仲間が戦闘に出られる人数より多い時に、出る人を選ぶ。探索のチェックポイントの星図と、拠点から開く。
// 外せない仲間（ハルト。物語でその時だけ外せない仲間）は、はじめから選ばれていて外せない。選んだ順に、戦闘の枠に左から並ぶ。
// 選ばなかった仲間も、星図・武器・ムーブメントでは育てられる

const ROW_Y = 150;
const ROW_H = 92;

export class PartyScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private picked: string[] = [];

  constructor() {
    super('Party');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
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
    this.root.add(screenBg(this));
    this.root.add(addText(this, cx, 40, '並び', { size: 20, bold: true }).setOrigin(0.5));
    this.root.add(
      addText(this, cx, 86, `戦闘に出る${size}人を選ぶ（選んだ順に、左から並ぶ）\n選ばなかった仲間も、星図・武器・ムーブメントで育てられる`, {
        size: 12,
        color: COLORS.subText,
        align: 'center',
        wrap: GAME_WIDTH - SIDE_PADDING * 2,
      }).setOrigin(0.5),
    );
    const members = currentParty(lineup);
    const w = GAME_WIDTH - SIDE_PADDING * 2;
    members.forEach((c, i) => {
      const y = ROW_Y + i * ROW_H;
      const order = this.picked.indexOf(c.id);
      const on = order >= 0;
      const locked = fixed.includes(c.id);
      const color = ALLY_COLOR[c.id] ?? COLORS.accent;
      const box = this.add.rectangle(cx, y + ROW_H / 2 - 6, w, ROW_H - 12, on ? 0x1e2a4a : COLORS.panel, on ? 1 : 0.6).setRounded(10);
      box.setStrokeStyle(on ? 3 : 1, on ? color : COLORS.border);
      this.root.add(box);
      // 選んだ順の番号（選んでいなければ空の丸）
      const nx = SIDE_PADDING + 34;
      const ny = y + ROW_H / 2 - 6;
      this.root.add(this.add.circle(nx, ny, 20, on ? color : 0x000000, on ? 1 : 0.25).setStrokeStyle(2, color));
      this.root.add(addText(this, nx, ny, on ? String(order + 1) : c.name.slice(0, 1), { size: on ? 18 : 15, bold: true, color: on ? '#101820' : COLORS.subText }).setOrigin(0.5));
      this.root.add(addText(this, nx + 34, ny - 22, c.name, { size: 17, bold: true, color: on ? COLORS.text : COLORS.subText }));
      this.root.add(
        addText(this, nx + 34, ny + 4, `HP ${c.stats.hp}　攻撃 ${c.stats.atk}　魔力 ${c.stats.mag}　速さ ${c.stats.spd}`, { size: 12, color: COLORS.subText }),
      );
      const tag = locked ? '外せない' : on ? '出る' : '休む';
      this.root.add(addText(this, SIDE_PADDING + w - 12, ny - 22, tag, { size: 12, bold: true, color: locked ? COLORS.accentText : on ? COLORS.text : COLORS.dimText }).setOrigin(1, 0));
      if (!locked) makePressable(box, { onTap: () => this.toggle(c.id) });
    });

    // 下：決める（ちょうど size 人の時だけ）
    const ready = this.picked.length === size;
    const back = hubBack();
    addButton(
      this,
      this.root,
      cx,
      800,
      w,
      52,
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
      ready ? { fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2, size: 15, bold: true } : { enabled: false, size: 15 },
    );
  }
}
