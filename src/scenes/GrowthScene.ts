import Phaser from 'phaser';
import type { CharacterDef, GrowthNodeDef, StatKey } from '../core';
import { findNode, getOpenError, isOpened, neighbors, nodeCost, openableNodes, openNode, piecePosition } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { CAMPAIGN, GROWTH_MAP, PARTY, SKILLS } from '../data';
import { describeAction } from '../ui/describe';
import { weightLabel } from '../ui/labels';
import { SIDE_PADDING } from '../ui/layout';
import { ALLY_COLOR, COLORS, RENDER_SCALE, toCss } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { currentParty, run } from './run';

// 成長マップの画面（段階7）。縦持ち 390×844 に、マップ（7×9）と操作を1画面で収める

const CELL = 48;
const MAP_X = (GAME_WIDTH - CELL * GROWTH_MAP.cols) / 2;
const MAP_Y = 58;
const NODE_R = 17;

const STAT_LABEL: Record<StatKey, string> = { hp: 'HP', mp: 'MP', atk: '攻撃', mag: '魔力', def: '防御', spd: '速さ' };
const STAT_SHORT: Record<StatKey, string> = { hp: 'HP', mp: 'MP', atk: '攻', mag: '魔', def: '防', spd: '速' };
const STAT_COLOR: Record<StatKey, number> = {
  hp: 0x4cd07d,
  mp: 0x5aa8ff,
  atk: 0xff6b4a,
  mag: 0xc58bff,
  def: 0x9aa5b1,
  spd: 0xffc83a,
};
/** マスに書く魔法・スキルの短い名前 */
const SKILL_SHORT: Record<string, string> = {
  fire: 'ファイア',
  fira: 'ファイラ',
  ice: 'アイス',
  blizzara: 'ブリザラ',
  thunder: 'サンダー',
  thundara: 'サンダラ',
  care: 'ケア',
  cure: 'ケアル',
  doubleSlash: 'Wスラ',
  inspiration: 'ひらめき',
};

const nodeCenter = (n: GrowthNodeDef) => ({ x: MAP_X + n.col * CELL + CELL / 2, y: MAP_Y + n.row * CELL + CELL / 2 });

export class GrowthScene extends Phaser.Scene {
  private charId = 'hero';
  private selected: string | null = null;
  private message = '';
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Growth');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.selected = null;
    this.message = '';
    this.render();
  }

  /** デバッグメニューから記憶ポイントが変わった時に描き直す */
  refresh(): void {
    if (this.scene.isActive()) this.render();
  }

  private base(id = this.charId): CharacterDef {
    return PARTY.find((c) => c.id === id)!;
  }

  private tapNode(nodeId: string): void {
    const err = getOpenError(GROWTH_MAP, run.growth, this.base(), nodeId);
    if (this.selected === nodeId && !err) {
      this.open(nodeId);
      return;
    }
    this.selected = nodeId;
    this.message = '';
    this.render();
  }

  private open(nodeId: string): void {
    const node = findNode(GROWTH_MAP, nodeId)!;
    run.growth = openNode(GROWTH_MAP, run.growth, this.base(), nodeId);
    this.message = `${this.base().name}：${nodeTitle(node, this.base())}を開けた`;
    console.log('[growth]', this.charId, nodeId, `points=${run.growth.points}`);
    this.selected = null;
    this.render();
  }

  // ---- 描画 ----

  private render(): void {
    this.root.removeAll(true);
    const g = run.growth;
    const base = this.base();
    const party = currentParty();
    const color = ALLY_COLOR[this.charId] ?? COLORS.ally;

    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0));

    // 上：見出しと記憶ポイント
    const next = CAMPAIGN[run.stage];
    this.root.add(addText(this, SIDE_PADDING, 8, '成長マップ', { size: 17, bold: true }));
    this.root.add(
      addText(this, SIDE_PADDING, 32, `次：${next ? `${next.name}（${next.enemies.map((e) => e.name).join('・')}）` : 'なし'}`, {
        size: 11,
        color: COLORS.subText,
      }),
    );
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING, 6, '記憶ポイント', { size: 10, color: COLORS.subText }).setOrigin(1, 0));
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING, 20, `${g.points}`, { size: 24, bold: true, color: COLORS.accentText }).setOrigin(1, 0));

    // マップの道
    const openable = new Set(openableNodes(GROWTH_MAP, g, this.charId).map((n) => n.id));
    const lines = this.add.graphics();
    for (const n of GROWTH_MAP.nodes) {
      for (const nb of neighbors(GROWTH_MAP, n.id)) {
        if (nb.id < n.id) continue;
        const both = isOpened(g, this.charId, n.id) && isOpened(g, this.charId, nb.id);
        lines.lineStyle(both ? 4 : 2, both ? color : 0x2a3b4e, 1);
        const a = nodeCenter(n);
        const b = nodeCenter(nb);
        lines.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
    this.root.add(lines);

    // マス
    for (const n of GROWTH_MAP.nodes) this.drawNode(n, openable.has(n.id));

    // 駒（今のキャラは大きく）
    PARTY.forEach((c, i) => {
      const p = nodeCenter(findNode(GROWTH_MAP, piecePosition(g, c.id))!);
      const offset = [
        { x: -NODE_R + 2, y: -NODE_R + 2 },
        { x: NODE_R - 2, y: -NODE_R + 2 },
        { x: 0, y: NODE_R - 1 },
      ][i];
      const current = c.id === this.charId;
      const r = current ? 9 : 6;
      const piece = this.add.circle(p.x + offset.x, p.y + offset.y, r, ALLY_COLOR[c.id] ?? COLORS.ally).setStrokeStyle(current ? 2 : 1, 0xffffff);
      this.root.add(piece);
      if (current) this.root.add(addText(this, p.x + offset.x, p.y + offset.y, c.name.slice(0, 1), { size: 9, bold: true }).setOrigin(0.5));
    });

    this.drawInfo(base, party.find((c) => c.id === this.charId)!);
    this.drawTabs(party);

    // 下：次の戦闘へ
    addButton(
      this,
      this.root,
      GAME_WIDTH / 2,
      792,
      GAME_WIDTH - SIDE_PADDING * 2,
      52,
      next ? `${next.name}へ` : '結果へ',
      { onTap: () => this.scene.start('Battle', { stage: run.stage }) },
      { fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2, size: 17, bold: true },
    );
  }

  private drawNode(n: GrowthNodeDef, openable: boolean): void {
    const g = run.growth;
    const { x, y } = nodeCenter(n);
    const opened = isOpened(g, this.charId, n.id);
    const selected = this.selected === n.id;
    const alpha = opened ? 1 : openable ? 0.75 : 0.28;
    let shape: Phaser.GameObjects.Shape;
    let label = '';
    let labelSize = 10;
    if (n.kind === 'skill') {
      shape = this.add.rectangle(x, y, 26, 26, 0xd9a520, alpha).setAngle(45);
      label = SKILL_SHORT[n.skillId] ?? n.skillId;
      labelSize = 8;
    } else if (n.kind === 'start') {
      shape = this.add.circle(x, y, NODE_R, ALLY_COLOR[n.owner] ?? COLORS.ally, alpha);
      label = '出発';
      labelSize = 9;
    } else {
      shape = this.add.circle(x, y, n.kind === 'statBig' ? NODE_R : NODE_R - 3, STAT_COLOR[n.stat], alpha);
      label = `${STAT_SHORT[n.stat]}${n.amount}`;
      labelSize = n.kind === 'statBig' ? 10 : 9;
    }
    shape.setStrokeStyle(selected ? 4 : openable ? 3 : n.kind === 'statBig' ? 2 : 1, selected ? COLORS.select : openable ? COLORS.accent : n.kind === 'statBig' ? 0xffffff : COLORS.border);
    this.root.add(shape);
    this.root.add(
      addText(this, x, y, label, { size: labelSize, bold: true, color: opened || openable ? '#101820' : '#9fb3c8', align: 'center' }).setOrigin(0.5),
    );
    // 他のキャラが開けたマスに小さな印
    PARTY.forEach((c, i) => {
      if (c.id === this.charId || !isOpened(g, c.id, n.id)) return;
      this.root.add(this.add.circle(x - 6 + i * 6, y + NODE_R + 3, 2.5, ALLY_COLOR[c.id] ?? COLORS.ally));
    });
    const hit = this.add.rectangle(x, y, CELL - 2, CELL - 2, 0xffffff, 0.001);
    this.root.add(hit);
    makePressable(hit, {
      onTap: () => this.tapNode(n.id),
      onLongPress: () => this.showDetail(nodeTitle(n, this.base()), nodeDetail(n, this.base())),
    });
  }

  /** 選んだマスの説明と「開ける」ボタン */
  private drawInfo(base: CharacterDef, grown: CharacterDef): void {
    const top = MAP_Y + CELL * GROWTH_MAP.rows + 6;
    const h = 120;
    this.root.add(this.add.rectangle(SIDE_PADDING, top, GAME_WIDTH - SIDE_PADDING * 2, h, COLORS.panel).setOrigin(0).setStrokeStyle(1, COLORS.border));
    const n = this.selected ? findNode(GROWTH_MAP, this.selected) : undefined;
    if (!n) {
      const lines = [
        this.message || `${base.name}の駒を進める。黄色い枠のマス（開けられるマス）をタップ`,
        '記憶ポイントは3人共通。誰にどう使うかを選ぼう',
        `${base.name}：HP ${grown.stats.hp}　MP ${grown.stats.mp}　攻撃 ${grown.stats.atk}　魔力 ${grown.stats.mag}　防御 ${grown.stats.def}　速さ ${grown.stats.spd}`,
      ];
      this.root.add(addText(this, SIDE_PADDING + 10, top + 10, lines.join('\n'), { size: 12, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 20 }));
      return;
    }
    const cost = nodeCost(GROWTH_MAP, run.growth, base, n.id);
    const err = getOpenError(GROWTH_MAP, run.growth, base, n.id);
    const opened = isOpened(run.growth, base.id, n.id);
    const status = opened
      ? '開けた'
      : err === 'not enough memory points'
        ? `記憶ポイントが足りない（${cost}pt）`
        : err
          ? 'まだ届かない（開けたマスの隣だけ開けられる）'
          : `${cost}pt で開けられる`;
    this.root.add(addText(this, SIDE_PADDING + 10, top + 8, nodeTitle(n, base), { size: 15, bold: true, color: COLORS.accentText }));
    this.root.add(addText(this, SIDE_PADDING + 10, top + 32, nodeDetail(n, base), { size: 11, wrap: GAME_WIDTH - 150 }));
    this.root.add(addText(this, SIDE_PADDING + 10, top + h - 22, status, { size: 11, color: COLORS.subText }));
    addButton(
      this,
      this.root,
      GAME_WIDTH - SIDE_PADDING - 62,
      top + h / 2,
      108,
      56,
      opened ? '開けた' : `開ける\n${cost}pt`,
      { onTap: () => this.open(n.id) },
      { enabled: !err, fill: 0x2f6b3f, stroke: 0x6dff9e, size: 14, bold: true },
    );
  }

  /** キャラの切り替え */
  private drawTabs(party: CharacterDef[]): void {
    const top = MAP_Y + CELL * GROWTH_MAP.rows + 134;
    const n = party.length;
    const gap = 6;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
    party.forEach((c, i) => {
      const x = SIDE_PADDING + i * (w + gap);
      const active = c.id === this.charId;
      const rect = this.add.rectangle(x, top, w, 72, active ? COLORS.panelLight : COLORS.panel).setOrigin(0);
      rect.setStrokeStyle(active ? 3 : 1, active ? 0xffffff : COLORS.border);
      this.root.add(rect);
      this.root.add(addText(this, x + 8, top + 6, c.name, { size: 14, bold: true, color: toCss(ALLY_COLOR[c.id] ?? COLORS.ally) }));
      const learned = c.skills.length - this.base(c.id).skills.length;
      this.root.add(
        addText(this, x + 8, top + 28, `HP${c.stats.hp} 攻${c.stats.atk}\n魔${c.stats.mag} 速${c.stats.spd}${learned > 0 ? ` 技+${learned}` : ''}`, {
          size: 10,
          color: COLORS.subText,
        }),
      );
      makePressable(rect, {
        onTap: () => {
          this.charId = c.id;
          this.selected = null;
          this.message = '';
          this.render();
        },
        onLongPress: () => this.showDetail(c.name, characterDetail(c, this.base(c.id))),
      });
    });
  }

  private closeOverlay(): void {
    this.overlay?.destroy(true);
    this.overlay = undefined;
  }

  private showDetail(title: string, body: string): void {
    this.closeOverlay();
    const c = this.add.container(0, 0).setDepth(200);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);
    c.add(shade);
    const w = GAME_WIDTH - 40;
    const text = addText(this, 0, 0, body, { size: 14, wrap: w - 32 });
    const h = text.height + 90;
    const y = GAME_HEIGHT / 2 - h / 2;
    const panel = this.add.rectangle(20, y, w, h, COLORS.panel).setOrigin(0).setStrokeStyle(2, COLORS.accent);
    const titleText = addText(this, 36, y + 14, title, { size: 17, bold: true, color: COLORS.accentText });
    text.setPosition(36, y + 44);
    const hint = addText(this, GAME_WIDTH / 2, y + h - 16, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([panel, titleText, text, hint]);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    this.overlay = c;
  }
}

// ---- マスとキャラの説明 ----

function nodeTitle(n: GrowthNodeDef, base: CharacterDef): string {
  if (n.kind === 'start') return n.owner === base.id ? `${base.name}の出発点` : `${PARTY.find((c) => c.id === n.owner)?.name ?? ''}の出発点`;
  if (n.kind === 'skill') return SKILLS[n.skillId as keyof typeof SKILLS]?.name ?? n.skillId;
  return `${STAT_LABEL[n.stat]}+${n.amount}${n.kind === 'statBig' ? '（大）' : ''}`;
}

function nodeDetail(n: GrowthNodeDef, base: CharacterDef): string {
  if (n.kind === 'start') return n.owner === base.id ? 'ここから駒を進める' : '他のキャラの出発点。通るだけ（効果なし）';
  if (n.kind === 'skill') {
    const def = SKILLS[n.skillId as keyof typeof SKILLS];
    if (!def) return '';
    const known = currentParty()
      .find((c) => c.id === base.id)
      ?.skills.some((k) => k.id === def.id);
    return `${known ? '（もう覚えている。通るだけ）\n' : ''}MP${def.mp}　${describeAction(def)}　${weightLabel(def.weight)}`;
  }
  return `${base.name}の${STAT_LABEL[n.stat]}が${n.amount}上がる`;
}

function characterDetail(c: CharacterDef, base: CharacterDef): string {
  const diff = (k: StatKey) => (c.stats[k] > base.stats[k] ? `（+${c.stats[k] - base.stats[k]}）` : '');
  const keys: StatKey[] = ['hp', 'mp', 'atk', 'mag', 'def', 'spd'];
  return [
    keys.map((k) => `${STAT_LABEL[k]} ${c.stats[k]}${diff(k)}`).join('　'),
    '',
    `魔法・スキル：${c.skills.map((k) => k.name).join('、')}`,
  ].join('\n');
}
