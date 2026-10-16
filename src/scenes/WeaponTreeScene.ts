import Phaser from 'phaser';
import type { EvolutionDef, EvolutionVisibility, WeaponState } from '../core';
import { evolutionChecks, evolutionTier, evolutionVisibility, findEvolution, weaponName } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { itemHint, WEAPON_DATA } from '../data';
import { addIcon } from '../ui/icons';
import { SIDE_PADDING } from '../ui/layout';
import { addWindow, enterScreen, screenBg } from '../ui/skin';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, RENDER_SCALE, toCss } from '../ui/theme';
import { maybeShowTip } from '../ui/tipPanel';
import { describeCondition, describeDirection, describeEvolution, describeStyle, evolutionLine } from '../ui/weaponText';
import { addButton, addText } from '../ui/widgets';
import { hubLineup, lineupBase, run, weaponDataFor } from './run';

// 進化ツリーの画面（段階42。docs/design/growth.md の 8-2・8-3）。
// 上に元の武器、下へ枝分かれ。今の武器からの近さで見せるものを変える（次は全部、2段先は系統と手がかり、その先は影、一番先は言い伝え）。
// ツリーはスマホの幅に収まらないので、枠の中をドラッグして上下左右に動かす（開いた時は今の武器を真ん中に）。節をタップすると下に説明

/** 武器のデータ。画面を開く時に、章のレベルの上限で切った物にする（段階49） */
let D = WEAPON_DATA;

/** ツリーの枠 */
const FRAME_TOP = 66;
const FRAME_BOTTOM = 540;
/** 節の大きさと間隔 */
const NODE_W = 76;
const NODE_H = 46;
const COL_W = 86;
const ROW_H = 72;
/** これより指が動いたら、タップではなくドラッグ */
const DRAG_SLOP = 10;

const LINE_COLOR: Record<ReturnType<typeof evolutionLine>, number> = {
  physical: ELEMENT_COLOR.physical,
  fire: ELEMENT_COLOR.fire,
  ice: ELEMENT_COLOR.ice,
  thunder: ELEMENT_COLOR.thunder,
  support: 0x9fe08a,
};

interface Laid {
  /** 元の武器は null */
  evo: EvolutionDef | null;
  x: number;
  y: number;
}

export class WeaponTreeScene extends Phaser.Scene {
  private charId = 'hero';
  /** 説明を出している節（元の武器は ''） */
  private selected: string | null = null;
  private tree!: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Container;
  private laid: Laid[] = [];

  constructor() {
    super('WeaponTree');
  }

  init(data: { charId?: string }): void {
    if (data?.charId) this.charId = data.charId;
    this.selected = null;
  }

  create(): void {
    D = weaponDataFor(hubLineup());
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    screenBg(this);
    const w = this.weapon();
    const owner = lineupBase(hubLineup()).find((c) => c.id === this.charId);
    addIcon(this, 'weapon', SIDE_PADDING + 9, 20, 18, COLORS.accent);
    addText(this, SIDE_PADDING + 24, 8, '進化ツリー', { size: 17, bold: true });
    addText(this, GAME_WIDTH - SIDE_PADDING, 10, `${owner?.name ?? ''}の${weaponName(D, w)}`, {
      size: 13,
      bold: true,
      color: toCss(ALLY_COLOR[this.charId] ?? COLORS.ally),
    }).setOrigin(1, 0);
    addText(this, SIDE_PADDING, 38, '枠の中をドラッグで動かす。タップで説明', { size: 11, color: COLORS.subText });

    // ツリーの枠と、中身（枠の外は隠す）
    const frame = this.add.rectangle(SIDE_PADDING, FRAME_TOP, GAME_WIDTH - SIDE_PADDING * 2, FRAME_BOTTOM - FRAME_TOP, 0x000000, 0.25).setOrigin(0);
    frame.setStrokeStyle(1, COLORS.border);
    this.tree = this.add.container(0, 0);
    const mask = this.make.graphics({}).fillRect(SIDE_PADDING, FRAME_TOP, GAME_WIDTH - SIDE_PADDING * 2, FRAME_BOTTOM - FRAME_TOP);
    this.tree.setMask(mask.createGeometryMask());
    this.layout();
    this.drawTree();
    this.setupPan();

    this.detail = this.add.container(0, 0);
    this.drawDetail();
    addButton(this, this.add.container(0, 0), GAME_WIDTH / 2, 800, GAME_WIDTH - SIDE_PADDING * 2, 52, '武器へ戻る', { onTap: () => this.scene.start('Weapon') }, {
      size: 16,
      bold: true,
    });
    maybeShowTip(this, ['growth_tree']);
  }

  private weapon(): WeaponState {
    return run.armory.weapons[this.charId];
  }

  /** 節を並べる：葉を左から順に1列ずつ、親は子の真ん中。段（何回目の進化か）で上から下へ */
  private layout(): void {
    const def = D.weapons[this.weapon().defId];
    // ムーブメントが閉じている間は、傾向が条件の進化先とその先を出さない（段階26）
    const navi = hubLineup().unlocks.navi;
    const shown = def.evolutions.filter((e) => navi || !hasTendencyAbove(def.evolutions, e));
    const children = (parent: string | undefined) => shown.filter((e) => e.from === parent);
    this.laid = [];
    let leaf = 0;
    const place = (evo: EvolutionDef | null): number => {
      const kids = children(evo?.id);
      const tier = evo ? evolutionTier(def, evo.id) : 0;
      let x: number;
      if (kids.length === 0) x = leaf++ * COL_W;
      else {
        const xs = kids.map((k) => place(k));
        x = (Math.min(...xs) + Math.max(...xs)) / 2;
      }
      this.laid.push({ evo, x, y: tier * ROW_H });
      return x;
    };
    place(null);
    // 枠の左の余白
    for (const n of this.laid) n.x += SIDE_PADDING + 12 + NODE_W / 2;
    for (const n of this.laid) n.y += FRAME_TOP + 16 + NODE_H / 2;
  }

  private drawTree(): void {
    const w = this.weapon();
    const g = this.add.graphics();
    this.tree.add(g);
    const pos = new Map(this.laid.map((n) => [n.evo?.id ?? '', n]));
    // 枝（親の下の辺から子の上の辺へ）。通った道は金色
    for (const n of this.laid) {
      if (!n.evo) continue;
      const parent = pos.get(n.evo.from ?? '');
      if (!parent) continue;
      const passed = w.path.some((s) => s.id === n.evo!.id);
      const vis = evolutionVisibility(D, w, n.evo.id);
      g.lineStyle(passed ? 3 : 2, passed ? COLORS.accent : 0xffffff, passed ? 1 : vis === 'unreachable' ? 0.12 : 0.35);
      const midY = (parent.y + NODE_H / 2 + n.y - NODE_H / 2) / 2;
      g.beginPath();
      g.moveTo(parent.x, parent.y + NODE_H / 2);
      g.lineTo(parent.x, midY);
      g.lineTo(n.x, midY);
      g.lineTo(n.x, n.y - NODE_H / 2);
      g.strokePath();
    }
    for (const n of this.laid) this.drawNode(n);
  }

  private drawNode(n: Laid): void {
    const w = this.weapon();
    const left = n.x - NODE_W / 2;
    const top = n.y - NODE_H / 2;
    const selected = this.selected === (n.evo?.id ?? '');
    if (!n.evo) {
      // 元の武器
      const rect = this.add.rectangle(left, top, NODE_W, NODE_H, w.path.length === 0 ? 0x3a3214 : COLORS.panel).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(selected ? 3 : 2, selected ? COLORS.select : COLORS.accent);
      this.tree.add(rect);
      this.tree.add(addText(this, n.x, n.y, D.weapons[w.defId].name, { size: 11, bold: true, wrap: NODE_W - 6, color: COLORS.accentText }).setOrigin(0.5));
      return;
    }
    const evo = n.evo;
    const vis = evolutionVisibility(D, w, evo.id);
    const current = w.path[w.path.length - 1]?.id === evo.id;
    const ready = vis === 'next' && evolutionChecks(D, w, evo, run.armory.items).every((c) => c.ok);
    const fill = vis === 'passed' ? 0x3a3214 : vis === 'next' ? COLORS.panelLight : vis === 'hint' ? COLORS.panel : 0x15181e;
    const alpha = vis === 'unreachable' ? 0.35 : 1;
    const rect = this.add.rectangle(left, top, NODE_W, NODE_H, fill, alpha).setRounded(8).setOrigin(0);
    const stroke = selected ? COLORS.select : current || ready ? COLORS.accent : vis === 'next' ? 0xffffff : COLORS.border;
    rect.setStrokeStyle(selected || current || ready ? 3 : 1, stroke, alpha);
    this.tree.add(rect);
    // 寄り道の札は、影だけの時も付ける（8-1b）
    if (evo.detour) this.tree.add(addText(this, left + 2, top - 13, '寄り道', { size: 9, bold: true, color: '#ffb070' }).setAlpha(alpha));
    const known = vis === 'passed' || vis === 'next' || (vis === 'unreachable' && wasOffered(w, evo));
    if (known) {
      const step = w.path.find((s) => s.id === evo.id);
      const style = step ? evo.styles?.[step.style] : undefined;
      const name = `${evo.name}${style ? `・${style.name}` : ''}`;
      this.tree.add(addText(this, n.x, n.y, name, { size: 10, bold: true, wrap: NODE_W - 6, color: vis === 'passed' ? COLORS.accentText : COLORS.text }).setOrigin(0.5).setAlpha(alpha));
      if (ready) this.tree.add(addText(this, left + NODE_W - 4, top + 2, '！', { size: 11, bold: true, color: COLORS.accentText }).setOrigin(1, 0));
    } else if (vis === 'hint') {
      const line = evolutionLine(evo);
      this.tree.add(addIcon(this, line === 'support' ? 'support' : line, n.x - 22, n.y - 8, 12, LINE_COLOR[line]));
      this.tree.add(addText(this, n.x - 12, n.y - 15, '？？？', { size: 10, bold: true, color: COLORS.subText }));
      this.tree.add(addText(this, n.x, n.y + 10, describeDirection(evo), { size: 9, color: toCss(LINE_COLOR[line]) }).setOrigin(0.5));
    } else if (vis === 'legend') {
      // 一番先：影と、言い伝えがあることの印
      this.tree.add(this.add.star(n.x, n.y - 4, 5, 5, 11, 0x6a6f7a, 0.8));
      this.tree.add(addText(this, n.x, n.y + 13, '言い伝え', { size: 9, color: COLORS.dimText }).setOrigin(0.5));
    } else {
      // 影だけ
      this.tree.add(this.add.ellipse(n.x, n.y, 30, 22, 0x2a2e36, alpha));
    }
  }

  /** 枠の中のドラッグで動かし、ほとんど動かさずに離したらタップ（節を選ぶ） */
  private setupPan(): void {
    const xs = this.laid.map((n) => n.x);
    const ys = this.laid.map((n) => n.y);
    const contentW = Math.max(...xs) + NODE_W / 2 + 12;
    const contentH = Math.max(...ys) + NODE_H / 2 + 16;
    const viewW = GAME_WIDTH - SIDE_PADDING;
    const minX = Math.min(0, viewW - contentW);
    const minY = Math.min(0, FRAME_BOTTOM - contentH);
    // 開いた時は、今の武器を真ん中に（8-3）
    const w = this.weapon();
    const cur = this.laid.find((n) => (n.evo?.id ?? undefined) === w.path[w.path.length - 1]?.id) ?? this.laid.find((n) => !n.evo)!;
    this.tree.x = Phaser.Math.Clamp(GAME_WIDTH / 2 - cur.x, minX, 0);
    this.tree.y = Phaser.Math.Clamp((FRAME_TOP + FRAME_BOTTOM) / 2 - cur.y - ROW_H, minY, 0);

    let start: { x: number; y: number; tx: number; ty: number } | null = null;
    let moved = false;
    const toWorld = (p: Phaser.Input.Pointer) => this.cameras.main.getWorldPoint(p.x, p.y);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const at = toWorld(p);
      if (at.y < FRAME_TOP || at.y > FRAME_BOTTOM) return;
      start = { x: at.x, y: at.y, tx: this.tree.x, ty: this.tree.y };
      moved = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!start || !p.isDown) return;
      const at = toWorld(p);
      const dx = at.x - start.x;
      const dy = at.y - start.y;
      if (Math.hypot(dx, dy) > DRAG_SLOP) moved = true;
      if (!moved) return;
      this.tree.x = Phaser.Math.Clamp(start.tx + dx, minX, 0);
      this.tree.y = Phaser.Math.Clamp(start.ty + dy, minY, 0);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!start) return;
      const was = start;
      start = null;
      if (moved) return;
      const at = toWorld(p);
      const lx = at.x - was.tx;
      const ly = at.y - was.ty;
      const hit = this.laid.find((n) => Math.abs(lx - n.x) <= NODE_W / 2 && Math.abs(ly - n.y) <= NODE_H / 2);
      if (!hit) return;
      this.selected = hit.evo?.id ?? '';
      this.redrawTree();
      this.drawDetail();
    });
  }

  private redrawTree(): void {
    const { x, y } = this.tree;
    this.tree.removeAll(true);
    this.drawTree();
    this.tree.setPosition(x, y);
  }

  /** 下の説明。見せるものは今の武器からの近さで変わる（8-2） */
  private drawDetail(): void {
    this.detail.removeAll(true);
    const top = FRAME_BOTTOM + 10;
    const h = 760 - top;
    this.detail.add(addWindow(this, SIDE_PADDING, top, GAME_WIDTH - SIDE_PADDING * 2, h));
    const { title, body } = this.detailText();
    this.detail.add(addText(this, SIDE_PADDING + 14, top + 12, title, { size: 15, bold: true, color: COLORS.accentText }));
    this.detail.add(addText(this, SIDE_PADDING + 14, top + 38, body, { size: 11, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 28 }));
  }

  private detailText(): { title: string; body: string } {
    const w = this.weapon();
    const ext = hubLineup().unlocks.navi ? D.boardExtension : 0;
    if (this.selected === null) {
      return {
        title: '節をタップすると説明',
        body: [
          '金色が通った道と今の武器。白い枠が次の進化先（！は今すぐ進化できる）。',
          '「？？？」は2段先：名前は分からないが、伸びる方向と鍵の手がかりが見える。その先は影だけ。',
          '進化は武器の画面の「進化」から。',
        ].join('\n'),
      };
    }
    if (this.selected === '') return { title: D.weapons[w.defId].name, body: '元の武器。ここから枝分かれしていく' };
    const evo = findEvolution(D, w, this.selected);
    if (!evo) return { title: '', body: '' };
    const vis: EvolutionVisibility = evolutionVisibility(D, w, evo.id);
    const detour = evo.detour ? '（寄り道）' : '';
    switch (vis) {
      case 'passed': {
        const step = w.path.find((s) => s.id === evo.id)!;
        const style = evo.styles?.[step.style];
        return { title: `${evo.name}${style ? `・${style.name}` : ''}${detour}`, body: [describeEvolution(evo), style ? `型 ${describeStyle(style, ext)}` : ''].filter(Boolean).join('\n') };
      }
      case 'next': {
        const checks = evolutionChecks(D, w, evo, run.armory.items);
        return {
          title: `${evo.name}${detour}`,
          body: [
            describeEvolution(evo),
            `型：${(evo.styles ?? []).map((s) => describeStyle(s, ext)).join(' ／ ')}`,
            `条件：${checks.map((c) => `${c.ok ? '✓' : '✗'}${describeCondition(c.condition, D)}`).join('　')}`,
            ...evo.conditions.flatMap((c) => (c.kind === 'key' ? [`鍵「${D.items[c.item]?.name}」：${itemHint(c.item)}`] : [])),
          ].join('\n'),
        };
      }
      case 'hint':
        return {
          title: `？？？${detour}`,
          body: [
            `伸びる方向：${describeDirection(evo) || '―'}`,
            ...evo.conditions.flatMap((c) => (c.kind === 'key' ? [`鍵の手がかり：${itemHint(c.item)}`] : [])),
            '名前と力は、1つ手前まで進化すると分かる',
          ].join('\n'),
        };
      case 'legend':
        return { title: '言い伝え', body: `「${evo.legend}」\n\nずっと先の姿。どの武器が、こうなったのだろう` };
      case 'shadow':
        return { title: `影${detour}`, body: evo.sealed ? 'まだ見えない先。物語が進むと、続きが見えてくる' : 'まだ遠くて見えない。近くまで進化すると分かる' };
      case 'unreachable':
        return {
          title: wasOffered(w, evo) ? `${evo.name}${detour}` : `影${detour}`,
          body: '今の武器からは行けない。同じ種類の武器をもう1本育てれば目指せる（2本目の武器は、まだ手に入らない）',
        };
    }
  }
}

/** 前に次の進化先として名前が見えていたか（親が通った道か、元の武器） */
function wasOffered(w: WeaponState, evo: EvolutionDef): boolean {
  return !evo.from || w.path.some((s) => s.id === evo.from);
}

/** その節か、その親のどれかが、ギアの傾向を条件に持つか */
function hasTendencyAbove(all: EvolutionDef[], evo: EvolutionDef): boolean {
  let cur: EvolutionDef | undefined = evo;
  while (cur) {
    if (cur.conditions.some((c) => c.kind === 'tendency')) return true;
    cur = cur.from ? all.find((e) => e.id === cur!.from) : undefined;
  }
  return false;
}
