import Phaser from 'phaser';
import type { Cell, CharacterDef, OwnedPart, Placement, Rotation } from '../core';
import { boardParts, boardPassives, boardStats, findBugs, getPlaceError, isPartActive, placedCells, placePart, removePart, rotateCells } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BUG_HP_RATE, PARTY } from '../data';
import { SIDE_PADDING } from '../ui/layout';
import { describePart, PART_COLOR_LABEL, partKindText, STAT_LABEL, summarizePassives } from '../ui/naviText';
import { drawPartShape, PART_COLOR, PART_SHORT } from '../ui/naviViews';
import { ALLY_COLOR, COLORS, RENDER_SCALE, toCss } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { currentNaviData, hubLineup, lineupBase, run, saveRun } from './run';
import { addWindow, enterScreen, fadeOutAndDestroy, popIn, screenBg } from '../ui/skin';

// ムーブメントの画面（段階8）。縦持ち 390×844 に、盤・説明・ギアの一覧・操作を1画面で収める
//
// 操作：一覧のギアをタップ → 盤のマスをタップで影（仮置き）→「回転」→「はめる」（影をもう一度タップでも決定）
// 盤にはまっているギアをタップすると選ばれ、「外す」で一覧に戻る

/** 盤の1マスの大きさ（盤が広い時は画面に収まるよう縮める） */
const MAX_CELL = 56;
const BOARD_TOP = 92;
const BOARD_H = MAX_CELL * 4;
const LIST_TOP = 520;
const LIST_COLS = 4;
/** 一覧の下の端（「戻る」ボタンの上） */
const LIST_BOTTOM = 766;
const CHIP_H = 50;
const CHIP_GAP = 6;

const key = ([c, r]: Cell) => `${c},${r}`;

export class NaviScene extends Phaser.Scene {
  private charId = 'hero';
  private selectedUid: number | null = null;
  private rotation: Rotation = 0;
  /** 仮置きの位置（影） */
  private ghost: { col: number; row: number } | null = null;
  private message = '';
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private cell = MAX_CELL;

  constructor() {
    super('Navi');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.clearSelection();
    const members = lineupBase(hubLineup());
    if (!members.some((c) => c.id === this.charId)) this.charId = members[0].id;
    this.render();
  }

  /** デバッグメニューからギアが増えた時に描き直す */
  refresh(): void {
    if (this.scene.isActive()) this.render();
  }

  private board() {
    return currentNaviData().boards[this.charId];
  }

  private selectedPart(): OwnedPart | undefined {
    return this.selectedUid === null ? undefined : run.navi.parts.find((p) => p.uid === this.selectedUid);
  }

  private ghostPlacement(): Placement | null {
    return this.ghost ? { charId: this.charId, col: this.ghost.col, row: this.ghost.row, rotation: this.rotation } : null;
  }

  private clearSelection(): void {
    this.selectedUid = null;
    this.rotation = 0;
    this.ghost = null;
  }

  private select(part: OwnedPart): void {
    this.selectedUid = part.uid;
    this.rotation = part.placement?.rotation ?? 0;
    this.ghost = null;
    this.message = '';
  }

  // ---- 操作 ----

  private tapChip(part: OwnedPart): void {
    if (this.selectedUid === part.uid) this.clearSelection();
    else this.select(part);
    this.render();
  }

  private tapCell(col: number, row: number): void {
    const sel = this.selectedPart();
    const ghost = this.ghostPlacement();
    // 影をもう一度タップしたら、はめる
    if (sel && ghost && placedCells(currentNaviData().parts[sel.partId], ghost).some((c) => key(c) === key([col, row]))) {
      if (!getPlaceError(currentNaviData(), run.navi, sel.uid, ghost)) {
        this.place();
        return;
      }
    }
    // 他のギアがはまっているマスなら、そのギアを選ぶ（影がない時）
    const occupant = this.partAt(col, row);
    if (occupant && occupant.uid !== this.selectedUid && !ghost) {
      this.select(occupant);
      this.render();
      return;
    }
    if (!sel) {
      this.message = '先に下の一覧からギアを選ぶ';
      this.render();
      return;
    }
    this.ghost = this.clampGhost(col, row);
    this.message = '';
    this.render();
  }

  /** 影の左上を、なるべく盤の中に収まるように決める */
  private clampGhost(col: number, row: number): { col: number; row: number } {
    const sel = this.selectedPart()!;
    const cells = rotateCells(currentNaviData().parts[sel.partId].cells, this.rotation);
    const w = Math.max(...cells.map(([c]) => c)) + 1;
    const h = Math.max(...cells.map(([, r]) => r)) + 1;
    const b = this.board();
    return { col: Math.max(0, Math.min(col, b.cols - w)), row: Math.max(0, Math.min(row, b.rows - h)) };
  }

  private rotate(): void {
    const sel = this.selectedPart();
    if (!sel) return;
    this.rotation = ((this.rotation + 1) % 4) as Rotation;
    // 今の盤にはまっているギアは、その位置で回した影を出す
    if (!this.ghost && sel.placement?.charId === this.charId) this.ghost = { col: sel.placement.col, row: sel.placement.row };
    if (this.ghost) this.ghost = this.clampGhost(this.ghost.col, this.ghost.row);
    this.render();
  }

  private place(): void {
    const sel = this.selectedPart();
    const ghost = this.ghostPlacement();
    if (!sel || !ghost || getPlaceError(currentNaviData(), run.navi, sel.uid, ghost)) return;
    run.navi = placePart(currentNaviData(), run.navi, sel.uid, ghost);
    const def = currentNaviData().parts[sel.partId];
    const placed = run.navi.parts.find((p) => p.uid === sel.uid)!;
    this.message = `${def.name}をはめた${def.kind === 'effect' && !isPartActive(currentNaviData(), placed) ? '（ブリッジに乗っていないので効かない）' : ''}`;
    console.log('[navi] place', this.charId, sel.partId, JSON.stringify(ghost));
    this.clearSelection();
    this.render();
  }

  private remove(): void {
    const sel = this.selectedPart();
    if (!sel?.placement) return;
    run.navi = removePart(run.navi, sel.uid);
    this.message = `${currentNaviData().parts[sel.partId].name}を外した`;
    console.log('[navi] remove', sel.partId);
    this.clearSelection();
    this.render();
  }

  private partAt(col: number, row: number): OwnedPart | undefined {
    return boardParts(run.navi, this.charId).find((p) =>
      placedCells(currentNaviData().parts[p.partId], p.placement!).some((c) => key(c) === key([col, row])),
    );
  }

  // ---- 描画 ----

  private render(): void {
    // 変えたら描き直すので、ここで自動セーブする（中身が同じなら書き込まない）
    saveRun();
    this.root.removeAll(true);
    this.cell = Math.min(MAX_CELL, Math.floor((GAME_WIDTH - SIDE_PADDING * 2 - 12) / this.board().cols));
    this.root.add(screenBg(this));
    this.root.add(addText(this, SIDE_PADDING, 8, 'ムーブメント', { size: 17, bold: true }));
    this.root.add(
      addText(this, GAME_WIDTH - SIDE_PADDING, 12, '光る帯＝ブリッジ', { size: 11, color: COLORS.accentText }).setOrigin(1, 0),
    );
    this.drawTabs();
    this.drawBoard();
    this.drawStatus();
    this.drawInfo();
    this.drawList();
    addButton(
      this,
      this.root,
      GAME_WIDTH / 2,
      800,
      GAME_WIDTH - SIDE_PADDING * 2,
      52,
      '星図へ戻る',
      { onTap: () => this.scene.start('Growth') },
      { size: 16, bold: true },
    );
  }

  private drawTabs(): void {
    const top = 36;
    // パーティにいる仲間の盤だけ（段階26）
    const members = lineupBase(hubLineup());
    const n = members.length;
    const gap = 6;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
    members.forEach((c, i) => {
      const x = SIDE_PADDING + i * (w + gap);
      const active = c.id === this.charId;
      const rect = this.add.rectangle(x, top, w, 46, active ? COLORS.panelLight : COLORS.panel).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(active ? 3 : 1, active ? 0xffffff : COLORS.border);
      this.root.add(rect);
      const bugs = findBugs(currentNaviData(), run.navi, c.id).length;
      const count = boardParts(run.navi, c.id).length;
      this.root.add(addText(this, x + 8, top + 5, c.name, { size: 14, bold: true, color: toCss(ALLY_COLOR[c.id] ?? COLORS.ally) }));
      this.root.add(
        addText(this, x + 8, top + 26, `ギア${count}${bugs > 0 ? `　狂い${bugs}` : ''}`, { size: 10, color: bugs > 0 ? '#ff8a7a' : COLORS.subText }),
      );
      makePressable(rect, {
        onTap: () => {
          this.charId = c.id;
          // 選んでいるギアはそのまま（別の盤へ移せる）。影だけ消す
          this.ghost = null;
          this.message = '';
          this.render();
        },
      });
    });
  }

  private boardOrigin(): { x: number; y: number } {
    const b = this.board();
    return { x: (GAME_WIDTH - this.cell * b.cols) / 2, y: BOARD_TOP + (BOARD_H - this.cell * b.rows) / 2 };
  }

  private drawBoard(): void {
    const b = this.board();
    const o = this.boardOrigin();
    const cellSet = new Set(b.cells.map(key));

    // ブリッジ（光る帯）
    this.root.add(
      this.add.rectangle(o.x - 6, o.y + b.commandRow * this.cell - 3, this.cell * b.cols + 12, this.cell + 6, COLORS.accent, 0.28).setOrigin(0).setStrokeStyle(2, COLORS.accent),
    );

    // マス
    for (let row = 0; row < b.rows; row++) {
      for (let col = 0; col < b.cols; col++) {
        if (!cellSet.has(key([col, row]))) continue;
        const x = o.x + col * this.cell;
        const y = o.y + row * this.cell;
        const rect = this.add.rectangle(x + 1, y + 1, this.cell - 2, this.cell - 2, row === b.commandRow ? 0x3a3a1e : COLORS.panel).setRounded(8).setOrigin(0);
        rect.setStrokeStyle(1, COLORS.border);
        this.root.add(rect);
        makePressable(rect, {
          onTap: () => this.tapCell(col, row),
          onLongPress: () => {
            const p = this.partAt(col, row);
            if (p) this.showPartDetail(p);
          },
        });
      }
    }

    // はまっているギア
    for (const p of boardParts(run.navi, this.charId)) {
      const def = currentNaviData().parts[p.partId];
      const active = isPartActive(currentNaviData(), p);
      const selected = p.uid === this.selectedUid;
      const cells = placedCells(def, p.placement!);
      cells.forEach(([c, r], i) => {
        const x = o.x + c * this.cell;
        const y = o.y + r * this.cell;
        const rect = this.add.rectangle(x + 3, y + 3, this.cell - 6, this.cell - 6, PART_COLOR[def.color], active ? 1 : 0.35).setOrigin(0);
        rect.setStrokeStyle(selected ? 4 : def.kind === 'effect' ? 2 : 0, selected ? COLORS.select : 0xffffff, 1);
        this.root.add(rect);
        // マスのタップは下のマスで受ける
        if (i === 0) {
          this.root.add(
            addText(this, x + this.cell / 2, y + this.cell / 2, PART_SHORT[def.id] ?? '', { size: 16, bold: true, color: active ? '#101820' : '#dddddd' }).setOrigin(0.5),
          );
        }
      });
      // 同じギアのマスどうしをつなぐ（1つのギアだと分かるように）
      const set = new Set(cells.map(key));
      for (const [c, r] of cells) {
        if (set.has(key([c + 1, r]))) this.root.add(this.add.rectangle(o.x + (c + 1) * this.cell - 4, o.y + r * this.cell + 14, 8, this.cell - 28, PART_COLOR[def.color], active ? 1 : 0.35).setOrigin(0));
        if (set.has(key([c, r + 1]))) this.root.add(this.add.rectangle(o.x + c * this.cell + 14, o.y + (r + 1) * this.cell - 4, this.cell - 28, 8, PART_COLOR[def.color], active ? 1 : 0.35).setOrigin(0));
      }
    }

    // 狂い：接している辺を赤く光らせる
    const g = this.add.graphics();
    g.lineStyle(5, 0xff3030, 1);
    for (const [ua, ub] of findBugs(currentNaviData(), run.navi, this.charId)) {
      const pa = run.navi.parts.find((p) => p.uid === ua)!;
      const pb = run.navi.parts.find((p) => p.uid === ub)!;
      const bCells = new Set(placedCells(currentNaviData().parts[pb.partId], pb.placement!).map(key));
      for (const [c, r] of placedCells(currentNaviData().parts[pa.partId], pa.placement!)) {
        const x = o.x + c * this.cell;
        const y = o.y + r * this.cell;
        if (bCells.has(key([c + 1, r]))) g.lineBetween(x + this.cell, y + 4, x + this.cell, y + this.cell - 4);
        if (bCells.has(key([c - 1, r]))) g.lineBetween(x, y + 4, x, y + this.cell - 4);
        if (bCells.has(key([c, r + 1]))) g.lineBetween(x + 4, y + this.cell, x + this.cell - 4, y + this.cell);
        if (bCells.has(key([c, r - 1]))) g.lineBetween(x + 4, y, x + this.cell - 4, y);
      }
    }
    this.root.add(g);

    // 影（仮置き）
    const sel = this.selectedPart();
    const ghost = this.ghostPlacement();
    if (sel && ghost) {
      const ok = !getPlaceError(currentNaviData(), run.navi, sel.uid, ghost);
      for (const [c, r] of placedCells(currentNaviData().parts[sel.partId], ghost)) {
        const shadow = this.add.rectangle(o.x + c * this.cell + 4, o.y + r * this.cell + 4, this.cell - 8, this.cell - 8, ok ? PART_COLOR[currentNaviData().parts[sel.partId].color] : 0xff3030, 0.5).setOrigin(0);
        shadow.setStrokeStyle(3, ok ? 0x6dff9e : 0xff3030);
        this.root.add(shadow);
        // 影のマスのタップは下のマスで受ける（影がはみ出している所は受けない）
        if (!this.board().cells.some((x) => key(x) === key([c, r]))) continue;
        makePressable(shadow, { onTap: () => this.tapCell(c, r) });
      }
    }
  }

  /** 盤の下：今の盤で効いている効果、能力値、狂い */
  private drawStatus(): void {
    const top = BOARD_TOP + BOARD_H + 8;
    const passives = boardPassives(currentNaviData(), run.navi, this.charId);
    const effects = summarizePassives(passives.filter((p) => p.kind !== 'bug'));
    const bugs = passives.filter((p) => p.kind === 'bug').length;
    const stats = Object.entries(boardStats(currentNaviData(), run.navi, this.charId)).map(([k, v]) => `${STAT_LABEL[k as keyof typeof STAT_LABEL]}+${v}`);
    const lines = [
      `能力値：${stats.length > 0 ? stats.join('　') : 'なし'}`,
      `効果：${effects.length > 0 ? effects.join('／') : 'なし'}`,
    ];
    this.root.add(addText(this, SIDE_PADDING + 4, top, lines.join('\n'), { size: 11, color: COLORS.subText, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 8 }));
    if (bugs > 0) {
      this.root.add(
        addText(this, SIDE_PADDING + 4, top + 36, `狂い×${bugs}：毎ラウンドの始めに最大HPの${Math.round(bugs * BUG_HP_RATE * 100)}%を失う`, {
          size: 11,
          color: '#ff8a7a',
          wrap: GAME_WIDTH - SIDE_PADDING * 2 - 8,
        }),
      );
    }
  }

  /** 選んだギアの説明と、回転・はめる・外す */
  private drawInfo(): void {
    const top = 392;
    const h = 120;
    this.root.add(this.add.rectangle(SIDE_PADDING, top, GAME_WIDTH - SIDE_PADDING * 2, h, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(1, COLORS.border));
    const sel = this.selectedPart();
    const textW = GAME_WIDTH - SIDE_PADDING * 2 - 128;
    if (!sel) {
      const text = this.message || '下の一覧からギアを選び、ムーブメントのマスをタップして置き場所を決める。同じ色を隣に置くと狂いになる';
      this.root.add(addText(this, SIDE_PADDING + 10, top + 10, text, { size: 12, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 20 }));
      return;
    }
    const def = currentNaviData().parts[sel.partId];
    const ghost = this.ghostPlacement();
    const err = ghost ? getPlaceError(currentNaviData(), run.navi, sel.uid, ghost) : null;
    const owner = sel.placement ? PARTY.find((c) => c.id === sel.placement!.charId)?.name : undefined;
    const status = ghost
      ? err
        ? err === 'overlaps another part'
          ? '他のギアと重なっている'
          : 'ムーブメントからはみ出している'
        : '「はめる」か、影をもう一度タップで決定'
      : owner
        ? `${owner}のムーブメントにはまっている`
        : 'ムーブメントのマスをタップして置き場所を決める';
    drawPartShape(this, this.root, def, this.rotation, SIDE_PADDING + 10, top + 12, 12);
    this.root.add(addText(this, SIDE_PADDING + 62, top + 8, def.name, { size: 15, bold: true, color: COLORS.accentText }));
    this.root.add(
      addText(this, SIDE_PADDING + 62, top + 30, `${describePart(def)}\n${def.kind === 'stat' ? '能力値（どこでも効く）' : '効果（ブリッジで効く）'}　${PART_COLOR_LABEL[def.color]}`, {
        size: 11,
        wrap: textW - 54,
      }),
    );
    this.root.add(addText(this, SIDE_PADDING + 10, top + h - 22, this.message || status, { size: 11, color: err ? '#ff8a7a' : COLORS.subText, wrap: textW }));

    // ボタン（右側に縦に3つ）
    const bx = GAME_WIDTH - SIDE_PADDING - 60;
    addButton(this, this.root, bx, top + 20, 108, 34, '回転', { onTap: () => this.rotate() }, { size: 13, bold: true });
    addButton(
      this,
      this.root,
      bx,
      top + 60,
      108,
      34,
      'はめる',
      { onTap: () => this.place() },
      { enabled: !!ghost && !err, fill: 0x2f6b3f, stroke: 0x6dff9e, size: 13, bold: true },
    );
    addButton(this, this.root, bx, top + 100, 108, 34, '外す', { onTap: () => this.remove() }, { enabled: !!sel.placement, size: 13 });
  }

  /** 持っているギアの一覧 */
  private drawList(): void {
    const parts = run.navi.parts;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - CHIP_GAP * (LIST_COLS - 1)) / LIST_COLS;
    this.root.add(addText(this, SIDE_PADDING, LIST_TOP, `持っているギア（${parts.length}）　長押しで詳細`, { size: 11, color: COLORS.subText }));
    // 多い時は1つの高さを詰めて収める
    const rows = Math.max(1, Math.ceil(parts.length / LIST_COLS));
    const chipH = Math.min(CHIP_H, (LIST_BOTTOM - LIST_TOP - 18 - CHIP_GAP * (rows - 1)) / rows);
    const compact = chipH < 40;
    parts.forEach((p, i) => {
      const def = currentNaviData().parts[p.partId];
      const x = SIDE_PADDING + (i % LIST_COLS) * (w + CHIP_GAP);
      const y = LIST_TOP + 18 + Math.floor(i / LIST_COLS) * (chipH + CHIP_GAP);
      const selected = p.uid === this.selectedUid;
      const rect = this.add.rectangle(x, y, w, chipH, p.placement ? COLORS.panel : COLORS.panelLight).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(selected ? 3 : 1, selected ? COLORS.select : COLORS.border);
      this.root.add(rect);
      if (!compact) drawPartShape(this, this.root, def, 0, x + 5, y + 6, 8, p.placement ? 0.5 : 1);
      this.root.add(addText(this, x + 4, y + chipH - 16, def.name, { size: 10, color: p.placement ? COLORS.subText : COLORS.text }));
      if (p.placement) {
        const owner = p.placement.charId;
        const name = PARTY.find((c) => c.id === owner)?.name.slice(0, 1) ?? '';
        const cy = compact ? y + chipH / 2 : y + 12;
        this.root.add(this.add.circle(x + w - 11, cy, 9, ALLY_COLOR[owner] ?? COLORS.ally));
        this.root.add(addText(this, x + w - 11, cy, name, { size: 10, bold: true }).setOrigin(0.5));
      }
      makePressable(rect, { onTap: () => this.tapChip(p), onLongPress: () => this.showPartDetail(p) });
    });
  }

  private showPartDetail(p: OwnedPart): void {
    const def = currentNaviData().parts[p.partId];
    const owner: CharacterDef | undefined = p.placement ? PARTY.find((c) => c.id === p.placement!.charId) : undefined;
    const lines = [describePart(def), partKindText(def), `色：${PART_COLOR_LABEL[def.color]}（同じ色を隣に置くと狂い）`, `大きさ：${def.cells.length}マス`];
    if (owner) {
      lines.push('', `${owner.name}のムーブメントにはまっている`);
      if (def.kind === 'effect' && !isPartActive(currentNaviData(), p)) lines.push('ブリッジに乗っていないので、今は効かない');
    }
    this.showDetail(def.name, lines.join('\n'));
  }

  private closeOverlay(): void {
    fadeOutAndDestroy(this, this.overlay);
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
    const panel = addWindow(this, 20, y, w, h);
    const titleText = addText(this, 36, y + 14, title, { size: 17, bold: true, color: COLORS.accentText });
    text.setPosition(36, y + 44);
    const hint = addText(this, GAME_WIDTH / 2, y + h - 16, 'タップで閉じる', { size: 12, color: COLORS.subText }).setOrigin(0.5);
    c.add([panel, titleText, text, hint]);
    makePressable(shade, { onTap: () => this.closeOverlay() });
    this.overlay = c;
    popIn(this, c);
  }
}
