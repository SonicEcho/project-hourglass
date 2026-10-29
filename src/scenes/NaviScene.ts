import Phaser from 'phaser';
import { maybeShowTip } from '../ui/tipPanel';
import type { Cell, CharacterDef, NaviState, OwnedPart, Placement, Rotation } from '../core';
import { boardParts, boardPassives, boardStats, bugHpLoss, findBugs, passiveRate, getPlaceError, isPartActive, placedCells, placePart, removePart, rotateCells } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { PARTY } from '../data';
import { SIDE_PADDING } from '../ui/layout';
import { describePart, PART_COLOR_LABEL, partKindText, STAT_LABEL, summarizePassives } from '../ui/naviText';
import { drawPartShape, PART_COLOR, PART_SHORT } from '../ui/naviViews';
import { ALLY_COLOR, COLORS, RENDER_SCALE, toCss } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { currentNaviData, currentParty, hubBack, hubLineup, lineupBase, run, saveRun, setHubReturn } from './run';
import { addWindow, enterScreen, fadeOutAndDestroy, popIn, screenBg } from '../ui/skin';
import { addIcon } from '../ui/icons';

// ムーブメントの画面（段階8）。縦持ち 390×844 に、盤・説明・ギアの一覧・操作を1画面で収める
//
// 操作：一覧のギアをタップ → 盤のマスをタップで影（仮置き）→「回転」→「はめる」（影をもう一度タップでも決定）
// 盤にはまっているギアをタップすると選ばれ、「外す」で一覧に戻る

/** 盤の1マスの大きさ（盤が広い時は画面に収まるよう縮める） */
const MAX_CELL = 56;
const BOARD_TOP = 92;
const BOARD_H = MAX_CELL * 4;
/** 選んだギアの説明の窓の上の端 */
const INFO_TOP = 392;
const LIST_TOP = 520;
const LIST_COLS = 4;
/** 一覧の下の端（「戻る」ボタンの上） */
const LIST_BOTTOM = 766;
const CHIP_H = 50;
const CHIP_GAP = 6;
/** これだけ指が動いたら、タップではなく一覧をずらしたことにする */
const DRAG_THRESHOLD = 8;

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
  /** 一覧をずらした量（段階127。描き直しても残す） */
  private listScroll = 0;
  private listLayer?: Phaser.GameObjects.Container;
  private listBar?: Phaser.GameObjects.Rectangle;
  private listMask?: Phaser.GameObjects.Graphics;
  /** 一覧を指でずらし始めた所 */
  private listDrag: { y: number; scroll: number } | null = null;
  /** 今の指の押し下げで、一覧をずらしたか（ずらした時はギアを選ばない） */
  private listDragged = false;

  constructor() {
    super('Navi');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.clearSelection();
    this.listScroll = 0;
    this.listMask = undefined;
    this.listDrag = null;
    this.listDragged = false;
    this.setupListDrag();
    const members = lineupBase(hubLineup());
    if (!members.some((c) => c.id === this.charId)) this.charId = members[0].id;
    this.render();
    // 初めて開いた時の説明（段階38。2-1 の銭湯の前で、ムーブメントが開いた後）
    maybeShowTip(this, ['growth_navi']);
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

  /**
   * 仮置きの影が置ける時、はめた後の盤（段階126。レビューの項目5：はめる前に、効く効果・狂いを見せる）。
   * 置けない時・影がない時は null
   */
  private previewNavi(): NaviState | null {
    const sel = this.selectedPart();
    const ghost = this.ghostPlacement();
    if (!sel || !ghost || getPlaceError(currentNaviData(), run.navi, sel.uid, ghost)) return null;
    return placePart(currentNaviData(), run.navi, sel.uid, ghost);
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
    const b = this.board();
    // 段階42：型で盤が下にも伸びるので、高さにも収める
    this.cell = Math.min(MAX_CELL, Math.floor((GAME_WIDTH - SIDE_PADDING * 2 - 12) / b.cols), Math.floor(BOARD_H / b.rows));
    this.root.add(screenBg(this));
    // 見出しのアイコン（段階32a 調整2）
    this.root.add(addIcon(this, 'gear', SIDE_PADDING + 9, 20, 18, COLORS.accent));
    this.root.add(addText(this, SIDE_PADDING + 24, 8, 'ムーブメント', { size: 17, bold: true }));
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
      hubBack()?.label ?? '星図へ戻る',
      { onTap: () => this.leave() },
      { size: 16, bold: true },
    );
  }

  /** 戻る：拠点から開いた時は拠点へ（段階45）、それ以外は星図へ */
  private leave(): void {
    const hub = hubBack();
    if (!hub) {
      this.scene.start('Growth');
      return;
    }
    setHubReturn(null);
    this.scene.start(hub.key, hub.data);
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
      this.add.rectangle(o.x + b.commandCol * this.cell - 3, o.y - 6, this.cell + 6, this.cell * b.rows + 12, COLORS.accent, 0.28).setOrigin(0).setStrokeStyle(2, COLORS.accent),
    );

    // マス
    for (let row = 0; row < b.rows; row++) {
      for (let col = 0; col < b.cols; col++) {
        if (!cellSet.has(key([col, row]))) continue;
        const x = o.x + col * this.cell;
        const y = o.y + row * this.cell;
        const rect = this.add.rectangle(x + 1, y + 1, this.cell - 2, this.cell - 2, col === b.commandCol ? 0x3a3a1e : COLORS.panel).setRounded(8).setOrigin(0);
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
          // 段階126（レビューの項目35）：ブリッジの外で効かない効果ギアは、暗さだけでなく × の印でも分かるように
          if (def.kind === 'effect' && !active) {
            this.root.add(this.add.circle(x + this.cell - 11, y + 11, 8, 0x401010).setStrokeStyle(1, 0xff8a7a));
            this.root.add(addText(this, x + this.cell - 11, y + 11, '×', { size: 11, bold: true, color: '#ff8a7a' }).setOrigin(0.5));
          }
        }
      });
      // 同じギアのマスどうしをつなぐ（1つのギアだと分かるように）
      const set = new Set(cells.map(key));
      for (const [c, r] of cells) {
        if (set.has(key([c + 1, r]))) this.root.add(this.add.rectangle(o.x + (c + 1) * this.cell - 4, o.y + r * this.cell + 14, 8, this.cell - 28, PART_COLOR[def.color], active ? 1 : 0.35).setOrigin(0));
        if (set.has(key([c, r + 1]))) this.root.add(this.add.rectangle(o.x + c * this.cell + 14, o.y + (r + 1) * this.cell - 4, this.cell - 28, 8, PART_COLOR[def.color], active ? 1 : 0.35).setOrigin(0));
      }
    }

    // 狂い：接している辺を赤く光らせる。置ける影がある時は、はめた後の形で出す（段階126）
    const nv = this.previewNavi() ?? run.navi;
    const g = this.add.graphics();
    g.lineStyle(5, 0xff3030, 1);
    for (const [ua, ub] of findBugs(currentNaviData(), nv, this.charId)) {
      const pa = nv.parts.find((p) => p.uid === ua)!;
      const pb = nv.parts.find((p) => p.uid === ub)!;
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
      // 段階126：効果ギアの影に、その位置で効くかを出す
      const def = currentNaviData().parts[sel.partId];
      const preview = this.previewNavi();
      if (preview && def.kind === 'effect') {
        const on = isPartActive(currentNaviData(), preview.parts.find((p) => p.uid === sel.uid)!);
        const [c, r] = placedCells(def, ghost)[0];
        const tag = addText(this, o.x + c * this.cell + this.cell / 2, o.y + r * this.cell + this.cell - 12, on ? '効く' : '効かない', {
          size: 10,
          bold: true,
          color: on ? '#6dff9e' : '#ff8a7a',
        }).setOrigin(0.5).setStroke('#0b1018', 3);
        this.root.add(tag);
      }
    }
  }

  /**
   * 盤の下：今の盤で効いている効果、能力値、効かない効果ギア、狂い。
   * 段階126（レビューの項目5・35・36）：置ける影がある時は、はめた後の盤の結果を「置いた時」として出す。狂いは戦闘と同じ計算で HP の量も出す
   */
  private drawStatus(): void {
    const top = BOARD_TOP + BOARD_H + 6;
    const preview = this.previewNavi();
    const nv = preview ?? run.navi;
    const data = currentNaviData();
    const passives = boardPassives(data, nv, this.charId);
    const effects = summarizePassives(passives.filter((p) => p.kind !== 'bug'));
    const bugs = findBugs(data, nv, this.charId).length;
    const stats = Object.entries(boardStats(data, nv, this.charId)).map(([k, v]) => `${STAT_LABEL[k as keyof typeof STAT_LABEL]}+${v}`);
    const idle = boardParts(nv, this.charId).filter((p) => data.parts[p.partId].kind === 'effect' && !isPartActive(data, p));
    const lines: { text: string; color: string }[] = [];
    lines.push({ text: `${preview ? '置いた時▶ ' : ''}能力値：${stats.length > 0 ? stats.join('　') : 'なし'}`, color: preview ? COLORS.accentText : COLORS.subText });
    lines.push({ text: `効果：${effects.length > 0 ? effects.join('／') : 'なし'}`, color: COLORS.subText });
    if (idle.length > 0) lines.push({ text: `効かない：${idle.map((p) => data.parts[p.partId].name).join('、')}（ブリッジの外）`, color: '#ffb070' });
    if (bugs > 0) {
      const ch = currentParty(hubLineup(), nv).find((c) => c.id === this.charId);
      const maxHp = ch?.stats.hp ?? 0;
      const loss = ch ? bugHpLoss(maxHp, ch.passives) : 0;
      const rate = Math.round(passiveRate({ passives: ch?.passives }, 'bug') * 100);
      lines.push({ text: `狂い×${bugs}：毎ラウンドの始めに HP−${loss}（最大HP ${maxHp}×${rate}%、切り捨て）`, color: '#ff8a7a' });
    }
    // 説明の窓（drawInfo の top）の上に収める。収まらない時は字を1段小さくする
    const draw = (size: number) => {
      let y = top;
      const texts = lines.map((l) => {
        const t = addText(this, SIDE_PADDING + 4, y, l.text, { size, color: l.color, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 8, ja: true });
        y += t.height;
        return t;
      });
      return { texts, bottom: y };
    };
    let r = draw(11);
    if (r.bottom > INFO_TOP - 2) {
      r.texts.forEach((t) => t.destroy());
      r = draw(10);
    }
    this.root.add(r.texts);
  }

  /** 選んだギアの説明と、回転・はめる・外す */
  private drawInfo(): void {
    const top = INFO_TOP;
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

  /** 一覧の見える範囲（段階127。ギアが多い時は、この中を上下にずらす） */
  private listView(): { top: number; bottom: number } {
    return { top: LIST_TOP + 18, bottom: LIST_BOTTOM };
  }

  /** 一覧をずらせる最大の量 */
  private maxListScroll(): number {
    const rows = Math.max(1, Math.ceil(run.navi.parts.length / LIST_COLS));
    const content = rows * (CHIP_H + CHIP_GAP) - CHIP_GAP;
    const v = this.listView();
    return Math.max(0, content - (v.bottom - v.top));
  }

  /**
   * 持っているギアの一覧。
   * 段階127（開発者の選んだ案B）：前はギアが多いと枠を詰めて形の絵を消していた。枠の大きさと形の絵はそのままにし、多い時は指で上下にずらす
   */
  private drawList(): void {
    const parts = run.navi.parts;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - CHIP_GAP * (LIST_COLS - 1)) / LIST_COLS;
    const v = this.listView();
    const max = this.maxListScroll();
    this.listScroll = Math.max(0, Math.min(this.listScroll, max));
    this.root.add(addText(this, SIDE_PADDING, LIST_TOP, `持っているギア（${parts.length}）　長押しで詳細${max > 0 ? '・上下にずらせる' : ''}`, { size: 11, color: COLORS.subText }));
    const layer = this.add.container(0, -this.listScroll);
    this.root.add(layer);
    this.listLayer = layer;
    this.listMask?.destroy();
    this.listMask = this.make.graphics({}).fillRect(0, v.top - 2, GAME_WIDTH, v.bottom - v.top + 4);
    layer.setMask(this.listMask.createGeometryMask());
    parts.forEach((p, i) => {
      const def = currentNaviData().parts[p.partId];
      const x = SIDE_PADDING + (i % LIST_COLS) * (w + CHIP_GAP);
      const y = v.top + Math.floor(i / LIST_COLS) * (CHIP_H + CHIP_GAP);
      const selected = p.uid === this.selectedUid;
      const rect = this.add.rectangle(x, y, w, CHIP_H, p.placement ? COLORS.panel : COLORS.panelLight).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(selected ? 3 : 1, selected ? COLORS.select : COLORS.border);
      layer.add(rect);
      drawPartShape(this, layer, def, 0, x + 5, y + 6, 8, p.placement ? 0.5 : 1);
      layer.add(addText(this, x + 4, y + CHIP_H - 16, def.name, { size: 10, color: p.placement ? COLORS.subText : COLORS.text }));
      if (p.placement) {
        const owner = p.placement.charId;
        const name = PARTY.find((c) => c.id === owner)?.name.slice(0, 1) ?? '';
        layer.add(this.add.circle(x + w - 11, y + 12, 9, ALLY_COLOR[owner] ?? COLORS.ally));
        layer.add(addText(this, x + w - 11, y + 12, name, { size: 10, bold: true }).setOrigin(0.5));
      }
      // ずらした時と、見えていない所（一覧の外）を押した時は、選ばない
      makePressable(rect, {
        onTap: () => this.chipPressOk() && this.tapChip(p),
        onLongPress: () => this.chipPressOk() && this.showPartDetail(p),
      });
    });
    // ずらせる時は、右の端に今どのあたりかの帯
    this.listBar = undefined;
    if (max > 0) {
      const h = v.bottom - v.top;
      const barH = Math.max(24, (h * h) / (h + max));
      this.root.add(this.add.rectangle(GAME_WIDTH - 3, v.top, 3, h, 0xffffff, 0.08).setOrigin(0.5, 0));
      this.listBar = this.add.rectangle(GAME_WIDTH - 3, v.top, 3, barH, COLORS.accent, 0.8).setOrigin(0.5, 0);
      this.root.add(this.listBar);
      this.moveListBar();
    }
  }

  private moveListBar(): void {
    if (!this.listBar) return;
    const v = this.listView();
    const max = this.maxListScroll();
    this.listBar.y = v.top + (max > 0 ? (this.listScroll / max) * (v.bottom - v.top - this.listBar.height) : 0);
  }

  /** 一覧のギアを押してよいか（ずらしていない、かつ一覧の見える範囲の中） */
  private chipPressOk(): boolean {
    if (this.listDragged) return false;
    const p = this.input.activePointer;
    const y = this.cameras.main.getWorldPoint(p.x, p.y).y;
    const v = this.listView();
    return y >= v.top && y <= v.bottom;
  }

  /** 一覧を指で上下にずらす（段階127） */
  private setupListDrag(): void {
    const world = (p: Phaser.Input.Pointer) => this.cameras.main.getWorldPoint(p.x, p.y);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.listDragged = false;
      const y = world(p).y;
      const v = this.listView();
      this.listDrag = !this.overlay && y >= v.top && y <= v.bottom && this.maxListScroll() > 0 ? { y, scroll: this.listScroll } : null;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.listDrag || !p.isDown) return;
      const dy = world(p).y - this.listDrag.y;
      if (!this.listDragged && Math.abs(dy) < DRAG_THRESHOLD) return;
      this.listDragged = true;
      this.listScroll = Math.max(0, Math.min(this.listDrag.scroll - dy, this.maxListScroll()));
      if (this.listLayer) this.listLayer.y = -this.listScroll;
      this.moveListBar();
    });
    this.input.on('pointerup', () => (this.listDrag = null));
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
