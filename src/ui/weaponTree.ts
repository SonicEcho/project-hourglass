import Phaser from 'phaser';
import type { EvolutionDef, EvolutionVisibility, WeaponData, WeaponState } from '../core';
import { evolutionChecks, evolutionTier, evolutionVisibility, findEvolution } from '../core';
import { itemHint } from '../data';
import { FRAME_COLORS } from './frame';
import { addText } from './widgets';
import { describeCondition, describeDirection, describeEvolution, describeStyle } from './weaponText';

// 武器の画面の「紅の系譜」（段階145。docs/ART.md の 5-9）：進化の木を、黒地に銀の八角の紋章で全面に描く。
// 下が元の武器で、上へ枝分かれ。通った道は紅い光の線、今の姿は紅い大きな紋章、次の姿は紅いふち（すぐ進化できる時は金に光る）。
// 今の武器からの近さで見せるものを変える（docs/design/growth.md の 8-2。前の WeaponTreeScene と同じ）

/** 紋章の大きさと並べ方 */
export const TREE = { colW: 64, rowH: 86, r: 15, currentR: 22 } as const;

/** 紅（系譜の線と紋章。ART.md 5-9：紅は武器の系譜だけに使う） */
export const CRIMSON = 0xe8203a;
const CRIMSON_DARK = 0x3a0a12;
const SILVER = 0xb8bcc4;

export interface TreeNode {
  /** 元の武器は null */
  evo: EvolutionDef | null;
  x: number;
  y: number;
}

/**
 * 紋章を並べる：葉を左から順に1列ずつ、親は子の真ん中。段（何回目の進化か）で下から上へ。
 * ムーブメントが閉じている間は、傾向が条件の進化先とその先を出さない（段階26）。左上が (0, 0) になるように返す
 */
export function layoutTree(D: WeaponData, w: WeaponState, navi: boolean): TreeNode[] {
  const def = D.weapons[w.defId];
  const shown = def.evolutions.filter((e) => navi || !hasTendencyAbove(def.evolutions, e));
  const children = (parent: string | undefined) => shown.filter((e) => e.from === parent);
  const laid: TreeNode[] = [];
  let leaf = 0;
  const place = (evo: EvolutionDef | null): number => {
    const kids = children(evo?.id);
    const tier = evo ? evolutionTier(def, evo.id) : 0;
    let x: number;
    if (kids.length === 0) x = leaf++ * TREE.colW;
    else {
      const xs = kids.map((k) => place(k));
      x = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    laid.push({ evo, x, y: -tier * TREE.rowH });
    return x;
  };
  place(null);
  const minY = Math.min(...laid.map((n) => n.y));
  for (const n of laid) n.y -= minY;
  return laid;
}

/** 木の中身の大きさ */
export function treeSize(laid: TreeNode[]): { w: number; h: number } {
  return { w: Math.max(...laid.map((n) => n.x)), h: Math.max(...laid.map((n) => n.y)) };
}

/** 今の姿の紋章（進化していなければ元の武器） */
export function currentNode(laid: TreeNode[], w: WeaponState): TreeNode {
  const cur = w.path[w.path.length - 1]?.id;
  return laid.find((n) => (n.evo?.id ?? undefined) === cur) ?? laid.find((n) => !n.evo)!;
}

/** 木を描く（c の中に。座標は layoutTree のまま）。ready は今すぐ進化できる次の姿の id */
export function drawTree(scene: Phaser.Scene, c: Phaser.GameObjects.Container, D: WeaponData, w: WeaponState, laid: TreeNode[], items: Record<string, number>, baseName: string): void {
  const g = scene.add.graphics();
  c.add(g);
  const pos = new Map(laid.map((n) => [n.evo?.id ?? '', n]));
  const current = currentNode(laid, w);
  // 枝（親の上から子の下へ、ゆるい曲線）。通った道は紅く光らせる
  for (const n of laid) {
    if (!n.evo) continue;
    const parent = pos.get(n.evo.from ?? '');
    if (!parent) continue;
    const passed = w.path.some((s) => s.id === n.evo!.id);
    const vis = evolutionVisibility(D, w, n.evo.id);
    const curve = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(parent.x, parent.y),
      new Phaser.Math.Vector2(parent.x, parent.y - TREE.rowH * 0.55),
      new Phaser.Math.Vector2(n.x, n.y + TREE.rowH * 0.55),
      new Phaser.Math.Vector2(n.x, n.y),
    );
    if (passed) {
      g.lineStyle(9, CRIMSON, 0.18);
      curve.draw(g, 24);
      g.lineStyle(3, CRIMSON, 1);
      curve.draw(g, 24);
    } else {
      g.lineStyle(1.2, SILVER, vis === 'unreachable' ? 0.12 : vis === 'next' ? 0.6 : 0.3);
      curve.draw(g, 24);
    }
  }
  for (const n of laid) drawEmblem(scene, c, D, w, n, n === current, items, baseName);
}

/** 八角形の頂点 */
function octagon(x: number, y: number, r: number): Phaser.Math.Vector2[] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return new Phaser.Math.Vector2(x + Math.cos(a) * r, y + Math.sin(a) * r);
  });
}

function drawEmblem(scene: Phaser.Scene, c: Phaser.GameObjects.Container, D: WeaponData, w: WeaponState, n: TreeNode, current: boolean, items: Record<string, number>, baseName: string): void {
  const g = scene.add.graphics();
  const { x, y } = n;
  const vis: EvolutionVisibility | 'root' = n.evo ? evolutionVisibility(D, w, n.evo.id) : 'root';
  const ready = vis === 'next' && evolutionChecks(D, w, n.evo!, items).every((ch) => ch.ok);
  if (current) {
    // 今の姿：紅い大きな紋章と、まわりの光
    g.fillStyle(CRIMSON, 0.16).fillCircle(x, y, TREE.currentR * 1.7);
    g.fillStyle(CRIMSON, 1).fillPoints(octagon(x, y, TREE.currentR), true);
    g.lineStyle(2, 0xffffff, 0.9).strokePoints(octagon(x, y, TREE.currentR), true);
    // 真ん中の白い十字の印
    g.fillStyle(0xffffff, 1).fillRect(x - 2, y - 9, 4, 18).fillRect(x - 9, y - 2, 18, 4);
    g.lineStyle(1.5, CRIMSON, 1).strokeRect(x - 5, y - 5, 10, 10);
  } else {
    const r = TREE.r;
    const pts = octagon(x, y, r);
    if (vis === 'root' || vis === 'passed') {
      g.fillStyle(CRIMSON_DARK, 1).fillPoints(pts, true);
      g.lineStyle(2, CRIMSON, 1).strokePoints(pts, true);
    } else if (vis === 'next') {
      if (ready) {
        g.fillStyle(FRAME_COLORS.gold, 0.22).fillCircle(x, y, r * 1.9);
        g.lineStyle(2, FRAME_COLORS.gold, 1).strokeCircle(x, y, r + 6);
      }
      g.fillStyle(0x1a0a0e, 1).fillPoints(pts, true);
      g.lineStyle(2.5, CRIMSON, 1).strokePoints(pts, true);
    } else if (vis === 'hint') {
      g.fillStyle(0x1a1c20, 1).fillPoints(pts, true);
      g.lineStyle(1.5, SILVER, 0.7).strokePoints(pts, true);
    } else if (vis === 'legend') {
      g.fillStyle(0x15161a, 1).fillPoints(octagon(x, y, r * 0.8), true);
      g.lineStyle(1, SILVER, 0.35).strokePoints(octagon(x, y, r * 0.8), true);
    } else {
      // 影・行けない先
      const a = vis === 'unreachable' ? 0.3 : 0.6;
      g.fillStyle(0x15161a, a).fillPoints(octagon(x, y, r * 0.7), true);
      g.lineStyle(1, SILVER, 0.25 * a).strokePoints(octagon(x, y, r * 0.7), true);
    }
  }
  c.add(g);
  if (vis === 'hint') c.add(addText(scene, x, y, '?', { size: 12, bold: true, color: '#c8ccd4' }).setOrigin(0.5));
  if (vis === 'legend') c.add(scene.add.star(x, y, 5, 3, 7, 0x8a8f9a, 0.8));
  if (n.evo?.detour) c.add(addText(scene, x, y - TREE.r - 9, '寄り道', { size: 8, bold: true, color: '#ffb070' }).setOrigin(0.5));
  // 名前（分かっている姿だけ）
  const evo = n.evo;
  const known = !evo || vis === 'passed' || vis === 'next' || (vis === 'unreachable' && wasOffered(w, evo));
  if (!known) return;
  const step = evo ? w.path.find((s) => s.id === evo.id) : undefined;
  const style = step && evo ? evo.styles?.[step.style] : undefined;
  const name = evo ? `${evo.name}${style ? `・${style.name}` : ''}` : baseName;
  const color = current ? '#ffffff' : vis === 'next' ? (ready ? FRAME_COLORS.goldText : '#e8dfe0') : vis === 'unreachable' ? '#5a5e66' : '#ff8a9a';
  const t = addText(scene, x, y + (current ? TREE.currentR : TREE.r) + 9, name, { size: current ? 11 : 9, bold: true, color, align: 'center', wrap: TREE.colW + 6 });
  c.add(t.setOrigin(0.5, 0).setShadow(0, 1, '#000000', 3, false, true));
}

/** 紋章の説明（長押し・次の姿以外のタップ）。見せるものは今の武器からの近さで変わる（8-2） */
export function treeDetail(D: WeaponData, w: WeaponState, id: string, items: Record<string, number>, ext: number): { title: string; body: string } {
  if (id === '') return { title: D.weapons[w.defId].name, body: '元の武器。ここから枝分かれしていく' };
  const evo = findEvolution(D, w, id);
  if (!evo) return { title: '', body: '' };
  const vis = evolutionVisibility(D, w, evo.id);
  const detour = evo.detour ? '（寄り道）' : '';
  switch (vis) {
    case 'passed': {
      const step = w.path.find((s) => s.id === evo.id)!;
      const style = evo.styles?.[step.style];
      return { title: `${evo.name}${style ? `・${style.name}` : ''}${detour}`, body: [describeEvolution(evo), style ? `型 ${describeStyle(style, ext)}` : ''].filter(Boolean).join('\n') };
    }
    case 'next': {
      const checks = evolutionChecks(D, w, evo, items);
      return {
        title: `${evo.name}${detour}`,
        body: [
          describeEvolution(evo),
          `型：${(evo.styles ?? []).map((s) => describeStyle(s, ext)).join(' ／ ')}`,
          `条件：${checks.map((ch) => `${ch.ok ? '✓' : '✗'}${describeCondition(ch.condition, D)}`).join('　')}`,
          ...evo.conditions.flatMap((ch) => (ch.kind === 'key' ? [`鍵「${D.items[ch.item]?.name}」：${itemHint(ch.item)}`] : [])),
        ].join('\n'),
      };
    }
    case 'hint':
      return {
        title: `？？？${detour}`,
        body: [
          `伸びる方向：${describeDirection(evo) || '―'}`,
          ...evo.conditions.flatMap((ch) => (ch.kind === 'key' ? [`鍵の手がかり：${itemHint(ch.item)}`] : [])),
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

/** 前に次の進化先として名前が見えていたか（親が通った道か、元の武器） */
function wasOffered(w: WeaponState, evo: EvolutionDef): boolean {
  return !evo.from || w.path.some((s) => s.id === evo.from);
}

/** その節か、その親のどれかが、ギアの傾向を条件に持つか */
function hasTendencyAbove(all: EvolutionDef[], evo: EvolutionDef): boolean {
  let cur: EvolutionDef | undefined = evo;
  while (cur) {
    if (cur.conditions.some((ch) => ch.kind === 'tendency')) return true;
    cur = cur.from ? all.find((e) => e.id === cur!.from) : undefined;
  }
  return false;
}
