import Phaser from 'phaser';
import type { ActionDef, AllyUnit, BattleState, CardInstance, ComboDef, EnemyUnit, ForecastEntry, LinkDef, PartState, TargetScope } from '../core';
import { BASIC_ATTACK, CARDS, GUARD, HAND_MAX, HOLD_DRAW, WEIGHT_LABELS } from '../data';
import { weightLabel } from './labels';
import { availableCombos, batonTargets, canUseLink, comboCards, comboProgress, ctDelay, currentAlly, findUnit } from '../core';
import { GAME_WIDTH } from '../config';
import { describeAction, formatWeight, mainDamageType } from './describe';
import { columnX, LAYOUT, MIN_TAP, SIDE_PADDING } from './layout';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, ENEMY_COLOR, toCss } from './theme';
import { addBar, addButton, addText, makePressable } from './widgets';

export type Panel = 'none' | 'skills' | 'other' | 'discard';

export interface ViewModel {
  state: BattleState;
  forecast: ForecastEntry[];
  /** 行動順の予告位置（-1 なら出さない） */
  predictedIndex: number;
  /** 選んでいる行動の対象範囲（選んでいなければ null） */
  scope: TargetScope | null;
  selectedCardUid?: number;
  selectedSkillId?: string;
  selectedComboId?: string;
  /** 選んだコンボの材料のカード */
  comboCardUids: number[];
  selectedTarget?: { kind: 'enemy' | 'ally'; id: string; partId?: string };
  batonMode: boolean;
  panel: Panel;
  message: string;
  /** 決定ボタンを出すか */
  showFooter: boolean;
  canConfirm: boolean;
  /** 操作を受け付けるか（演出中や敵の手番は false） */
  interactive: boolean;
}

export interface ViewHandlers {
  tapBackground(): void;
  tapEnemy(id: string, partId?: string): void;
  tapAlly(id: string): void;
  tapCard(uid: number): void;
  tapCombo(id: string): void;
  tapSkill(id: string): void;
  tapBasic(kind: 'attack' | 'guard'): void;
  tapDiscard(uid: number): void;
  tapCommand(kind: 'skills' | 'baton' | 'link' | 'other'): void;
  confirm(): void;
  cancel(): void;
  detail(title: string, body: string): void;
}

export function drawBattle(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  // 何もない所をタップしたら選び直し
  const bg = scene.add.rectangle(0, 0, GAME_WIDTH, 844, COLORS.bg).setOrigin(0);
  root.add(bg);
  if (vm.interactive) makePressable(bg, { onTap: () => h.tapBackground() });

  drawTurnOrder(scene, root, vm, h);
  drawEnemies(scene, root, vm, h);
  drawMessage(scene, root, vm);
  drawAllies(scene, root, vm, h);
  if (vm.panel === 'skills') drawSkillPanel(scene, root, vm, h);
  else if (vm.panel === 'other') drawOtherPanel(scene, root, vm, h);
  else if (vm.panel === 'discard') drawDiscardPanel(scene, root, vm, h);
  else drawHand(scene, root, vm, h);
  drawCommands(scene, root, vm, h);
  if (vm.showFooter) drawFooter(scene, root, vm, h);
}

// ① 行動順
function drawTurnOrder(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.turnOrder;
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, height, COLORS.panel).setOrigin(0));
  const n = 8;
  const slot = (GAME_WIDTH - SIDE_PADDING * 2) / n;
  vm.forecast.slice(0, n).forEach((entry, i) => {
    const unit = findUnit(vm.state, entry.id);
    if (!unit) return;
    const cx = SIDE_PADDING + slot * i + slot / 2;
    const cy = y + height / 2;
    const isCurrent = i === 0 && vm.state.turn?.actorId === entry.id;
    const isPredicted = i === vm.predictedIndex;
    const r = isCurrent ? 21 : 17;
    const color = unit.side === 'ally' ? (ALLY_COLOR[unit.defId] ?? COLORS.ally) : (ENEMY_COLOR[unit.defId] ?? COLORS.enemy);
    const circle = scene.add.circle(cx, cy, r, color);
    circle.setStrokeStyle(isCurrent ? 3 : isPredicted ? 3 : 1, isCurrent ? 0xffffff : isPredicted ? COLORS.accent : COLORS.border);
    if (unit.side === 'enemy') circle.setFillStyle(color, 0.85);
    const label = addText(scene, cx, cy, unit.name.slice(0, 1), { size: isCurrent ? 16 : 13, bold: true, align: 'center' }).setOrigin(0.5);
    root.add([circle, label]);
    if (unit.side === 'enemy') {
      root.add(addText(scene, cx + r - 4, cy - r + 2, '敵', { size: 9, color: '#ffb0b0' }).setOrigin(0.5));
    }
    if (isPredicted) {
      root.add(addText(scene, cx, y + height - 6, '次', { size: 10, color: COLORS.accentText, bold: true }).setOrigin(0.5));
    }
    // 長押しで詳細（タップできる大きさを確保する）
    const hit = scene.add.rectangle(cx, cy, Math.max(slot, MIN_TAP), MIN_TAP, 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onLongPress: () => h.detail(unit.name, `${i === 0 && isCurrent ? '今の行動者' : `${i + 1}番目の手番`}\n${unitSummary(unit)}`),
    });
  });

  // 連携技が使える時は、2人の手番を金色の線でつなぐ
  const s = vm.state;
  const link = vm.interactive ? s.links.find((l) => canUseLink(s, l.id)) : undefined;
  if (link && s.turn) {
    const partner = link.members.find((id) => id !== s.turn!.actorId)!;
    const j = vm.forecast.findIndex((e, k) => k > 0 && e.id === partner);
    if (j > 0 && j < n) {
      const x0 = SIDE_PADDING + slot / 2;
      const x1 = SIDE_PADDING + slot * j + slot / 2;
      const ly = y + height - 3;
      root.add(scene.add.rectangle((x0 + x1) / 2, ly, x1 - x0, 3, COLORS.accent));
    }
  }
}

// ② 敵
/** 敵1体ごとの配置。部位を持つ敵が1体だけ（ボス）の時は、本体を大きく、部位を下に並べる */
function enemyGeometry(s: BattleState, i: number) {
  const n = s.enemies.length;
  const withParts = n === 1 && s.enemies[0].parts.length > 0;
  return {
    cx: columnX(i, n),
    colW: GAME_WIDTH / n,
    bodyY: withParts ? LAYOUT.enemies.y + 98 : LAYOUT.enemies.y + 120,
    radius: withParts ? 52 : 42,
    withParts,
  };
}

const PART_ROW_Y = LAYOUT.enemies.y + LAYOUT.enemies.h - 30;
const PART_H = 50;

function partX(index: number, count: number): number {
  const w = (GAME_WIDTH - SIDE_PADDING * 2) / count;
  return SIDE_PADDING + w * index + w / 2;
}

/** 画面上の各キャラ（と部位）の位置（演出の文字を出す場所） */
export function unitPosition(s: BattleState, id: string, partId?: string): { x: number; y: number } {
  const ei = s.enemies.findIndex((e) => e.uid === id);
  if (ei >= 0) {
    const g = enemyGeometry(s, ei);
    const parts = s.enemies[ei].parts;
    const pi = partId === undefined ? -1 : parts.findIndex((p) => p.id === partId);
    if (g.withParts && pi >= 0) return { x: partX(pi, parts.length), y: PART_ROW_Y };
    return { x: g.cx, y: g.bodyY };
  }
  const ai = s.allies.findIndex((a) => a.uid === id);
  return { x: columnX(Math.max(0, ai), s.allies.length), y: LAYOUT.allies.y + LAYOUT.allies.h / 2 };
}

function drawEnemies(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const s = vm.state;
  s.enemies.forEach((enemy, i) => {
    const g = enemyGeometry(s, i);
    const { cx, colW, bodyY, radius } = g;
    const alive = enemy.hp > 0;
    const targetable = alive && vm.interactive && vm.scope === 'enemy';
    const sel = vm.selectedTarget;
    const selected = sel?.kind === 'enemy' && sel.id === enemy.uid && sel.partId === undefined;
    const color = ENEMY_COLOR[enemy.defId] ?? COLORS.enemy;

    // 判明した弱点
    const known = enemy.knownWeaknesses;
    known.forEach((el, k) => {
      const ix = cx + (k - (known.length - 1) / 2) * 30;
      const iy = LAYOUT.enemies.y + 22;
      const icon = scene.add.rectangle(ix, iy, 26, 20, ELEMENT_COLOR[el]).setStrokeStyle(1, 0xffffff);
      const t = addText(scene, ix, iy, ELEMENT_LABEL[el], { size: 11, bold: true, color: '#101820', align: 'center' }).setOrigin(0.5);
      root.add([icon, t]);
    });
    if (known.length > 0) {
      root.add(addText(scene, cx, LAYOUT.enemies.y + 40, '弱点', { size: 9, color: COLORS.subText }).setOrigin(0.5));
    }

    // 本体をタップする領域（ボスは部位の列を除く）
    const hitTop = LAYOUT.enemies.y + 4;
    const hitBottom = g.withParts ? PART_ROW_Y - PART_H / 2 - 4 : LAYOUT.enemies.y + LAYOUT.enemies.h - 4;
    const hit = scene.add.rectangle(cx, (hitTop + hitBottom) / 2, colW - 4, hitBottom - hitTop, 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onTap: vm.interactive ? () => h.tapEnemy(enemy.uid) : undefined,
      onLongPress: () => h.detail(enemy.name, enemyDetail(enemy)),
    });

    const body = scene.add.circle(cx, bodyY, radius, color, alive ? 1 : 0.15);
    body.setStrokeStyle(selected ? 4 : targetable ? 2 : 1, selected ? COLORS.select : targetable ? COLORS.accent : COLORS.border);
    root.add(body);
    if (enemy.down && alive) {
      root.add(addText(scene, cx, bodyY, 'DOWN', { size: 18, bold: true, color: COLORS.weak }).setOrigin(0.5).setAngle(-12));
    }
    if (!alive) root.add(addText(scene, cx, bodyY, '撃破', { size: 14, color: COLORS.dimText }).setOrigin(0.5));

    const nameY = bodyY + radius + 16;
    root.add(addText(scene, cx, nameY, enemy.name, { size: 13, align: 'center', color: alive ? COLORS.text : COLORS.dimText }).setOrigin(0.5));
    const barW = g.withParts ? 220 : Math.min(110, colW - 16);
    addBar(scene, root, cx - barW / 2, nameY + 18, barW, 8, enemy.hp / enemy.maxHp, enemy.hp / enemy.maxHp < 0.3 ? COLORS.hpLow : COLORS.hp);
    root.add(addText(scene, cx, nameY + 32, `${enemy.hp}/${enemy.maxHp}`, { size: 11, color: COLORS.subText }).setOrigin(0.5));

    if (g.withParts) drawParts(scene, root, vm, h, enemy);
  });
}

function drawParts(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers, enemy: EnemyUnit): void {
  const count = enemy.parts.length;
  const w = (GAME_WIDTH - SIDE_PADDING * 2) / count - 6;
  enemy.parts.forEach((part, i) => {
    const x = partX(i, count);
    const usable = !part.broken && enemy.hp > 0;
    const targetable = usable && vm.interactive && vm.scope === 'enemy';
    const sel = vm.selectedTarget;
    const selected = sel?.kind === 'enemy' && sel.id === enemy.uid && sel.partId === part.id;
    const rect = scene.add.rectangle(x, PART_ROW_Y, w, PART_H, usable ? COLORS.panel : 0x161d25);
    rect.setStrokeStyle(selected ? 4 : targetable ? 2 : 1, selected ? COLORS.select : targetable ? COLORS.accent : COLORS.border);
    root.add(rect);
    const left = x - w / 2 + 8;
    root.add(addText(scene, left, PART_ROW_Y - 19, `部位：${part.name}`, { size: 12, bold: true, color: usable ? COLORS.text : COLORS.dimText }));
    if (part.broken) {
      root.add(addText(scene, x + w / 2 - 8, PART_ROW_Y - 18, '破壊', { size: 12, bold: true, color: COLORS.accentText }).setOrigin(1, 0));
    } else {
      root.add(addText(scene, x + w / 2 - 8, PART_ROW_Y - 18, `${part.hp}/${part.maxHp}`, { size: 11, color: COLORS.subText }).setOrigin(1, 0));
    }
    addBar(scene, root, left, PART_ROW_Y + 12, w - 16, 7, part.hp / part.maxHp, 0xe0a040);
    makePressable(rect, {
      onTap: vm.interactive ? () => h.tapEnemy(enemy.uid, part.id) : undefined,
      onLongPress: () => h.detail(`${enemy.name}の${part.name}`, partDetail(enemy, part)),
    });
  });
}

function drawMessage(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel): void {
  const { y, h: height } = LAYOUT.message;
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, height, 0x0b1118).setOrigin(0));
  root.add(
    addText(scene, GAME_WIDTH / 2, y + height / 2, vm.message, { size: vm.message.length > 56 ? 10 : 12, align: 'center', wrap: GAME_WIDTH - 12 }).setOrigin(0.5),
  );
}

// ③ 味方
function drawAllies(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const s = vm.state;
  const n = s.allies.length;
  const colW = GAME_WIDTH / n;
  const { y, h: height } = LAYOUT.allies;
  const batonIds = new Set(batonTargets(s).map((a) => a.uid));
  s.allies.forEach((ally, i) => {
    const cx = columnX(i, n);
    const x0 = cx - colW / 2 + 3;
    const w = colW - 6;
    const alive = ally.hp > 0;
    const isCurrent = s.turn?.actorId === ally.uid;
    const targetable = vm.interactive && ((vm.scope === 'ally' && alive) || (vm.batonMode && batonIds.has(ally.uid)));
    const selected = vm.selectedTarget?.kind === 'ally' && vm.selectedTarget.id === ally.uid;
    const panel = scene.add.rectangle(x0, y + 2, w, height - 4, alive ? COLORS.panel : 0x161d25).setOrigin(0);
    panel.setStrokeStyle(
      selected ? 4 : isCurrent || targetable ? 2 : 1,
      selected ? COLORS.select : targetable ? COLORS.accent : isCurrent ? 0xffffff : COLORS.border,
    );
    root.add(panel);
    const color = toCss(ALLY_COLOR[ally.defId] ?? COLORS.ally);
    root.add(addText(scene, x0 + 6, y + 8, ally.name, { size: 13, bold: true, color: alive ? color : COLORS.dimText }));
    const status = [ally.guarding ? '防御' : '', ally.batonBoost ? 'バトン' : '', alive ? '' : '戦闘不能'].filter(Boolean).join(' ');
    if (status) root.add(addText(scene, x0 + w - 6, y + 9, status, { size: 10, color: COLORS.accentText }).setOrigin(1, 0));
    const barW = w - 12;
    addBar(scene, root, x0 + 6, y + 36, barW, 7, ally.hp / ally.maxHp, ally.hp / ally.maxHp < 0.3 ? COLORS.hpLow : COLORS.hp);
    root.add(addText(scene, x0 + 6, y + 41, `HP ${ally.hp}/${ally.maxHp}`, { size: 10, color: COLORS.subText }));
    addBar(scene, root, x0 + 6, y + 60, barW, 5, ally.mp / ally.maxMp, COLORS.mp);
    root.add(addText(scene, x0 + 6, y + 64, `MP ${ally.mp}/${ally.maxMp}`, { size: 10, color: COLORS.subText }));
    makePressable(panel, {
      onTap: vm.interactive ? () => h.tapAlly(ally.uid) : undefined,
      onLongPress: () => h.detail(ally.name, allyDetail(ally)),
    });
  });
}

// ④ 手札
const COMBO_STRIP_H = 26;

function drawHand(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.hand;
  const s = vm.state;
  const hand = s.hand;
  root.add(addText(scene, SIDE_PADDING, y + 2, `手札 ${hand.length}　山札 ${s.deck.length}　捨て札 ${s.discard.length}`, { size: 10, color: COLORS.subText }));
  // 次の手番で手札がどうなるか
  const next = s.handRefreshPending ? '次の手番：手札を入れ替え' : `次の手番：手札を残して+${HOLD_DRAW}枚（最大${HAND_MAX}）`;
  const nextText = addText(scene, GAME_WIDTH - SIDE_PADDING, y + 2, next, {
    size: 10,
    bold: s.handRefreshPending,
    color: s.handRefreshPending ? COLORS.accentText : COLORS.subText,
  }).setOrigin(1, 0);
  root.add(nextText);
  makePressable(nextText, { onLongPress: () => h.detail('手札のルール', HAND_RULE_TEXT) });
  drawComboStrip(scene, root, vm, h, y + 16);

  // 使えるコンボの材料になっているカード
  const comboUids = new Set(availableCombos(s).flatMap((c) => (comboCards(s, c) ?? []).map((x) => x.uid)));
  const n = Math.max(5, hand.length);
  const gap = 4;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const top = y + 18 + COMBO_STRIP_H;
  const cardH = height - (top - y) - 2;
  const actor = currentAlly(s);
  hand.forEach((card, i) => {
    const x = SIDE_PADDING + i * (w + gap) + w / 2;
    drawCard(scene, root, card, x, top + cardH / 2, w, cardH, {
      selected: vm.selectedCardUid === card.uid || vm.comboCardUids.includes(card.uid),
      inCombo: comboUids.has(card.uid),
      interactive: vm.interactive,
      actor,
      h,
    });
  });
}

/** 手札の上の帯：使えるコンボと、あと1枚でそろうコンボ */
function drawComboStrip(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers, y: number): void {
  const s = vm.state;
  const entries = s.combos
    .map((c) => ({ combo: c, ...comboProgress(s, c) }))
    .filter((e) => e.have === e.need || (e.have > 0 && e.need - e.have === 1))
    .sort((a, b) => b.have / b.need - a.have / a.need)
    .slice(0, 3);
  const cy = y + COMBO_STRIP_H / 2;
  // 帯全体の長押しでコンボの一覧
  const strip = scene.add.rectangle(GAME_WIDTH / 2, cy, GAME_WIDTH - SIDE_PADDING * 2, COMBO_STRIP_H, 0x0b1118).setStrokeStyle(1, 0x2a3b4e);
  root.add(strip);
  makePressable(strip, { onLongPress: () => h.detail('コンボ一覧', comboListText(s)) });
  if (entries.length === 0) {
    root.add(addText(scene, GAME_WIDTH / 2, cy, 'コンボ：カードの組み合わせで大技（ここを長押しで一覧）', { size: 10, color: COLORS.dimText }).setOrigin(0.5));
    return;
  }
  const gap = 4;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - 4 - gap * 2) / 3;
  entries.forEach((e, i) => {
    const ready = e.have === e.need;
    const x = SIDE_PADDING + 2 + i * (w + gap) + w / 2;
    const selected = vm.selectedComboId === e.combo.id;
    const chip = scene.add.rectangle(x, cy, w, COMBO_STRIP_H - 4, ready ? 0x5a4a10 : COLORS.panel);
    chip.setStrokeStyle(selected ? 3 : 1, selected ? COLORS.select : ready ? COLORS.accent : COLORS.border);
    const label = ready ? `★${e.combo.name}` : `${e.combo.name} あと1枚`;
    root.add(chip);
    root.add(addText(scene, x, cy, label, { size: 10, bold: ready, color: ready ? COLORS.accentText : COLORS.subText, align: 'center', wrap: w - 4 }).setOrigin(0.5));
    makePressable(chip, {
      onTap: ready && vm.interactive ? () => h.tapCombo(e.combo.id) : undefined,
      onLongPress: () => h.detail(e.combo.name, comboDetail(e.combo, currentAlly(s))),
    });
  });
}

function cardColor(def: ActionDef): number {
  const t = mainDamageType(def);
  if (t) return ELEMENT_COLOR[t];
  if (def.effects.some((e) => e.kind === 'heal')) return 0x4cd07d;
  return 0xa98be0;
}

/** 重さの目盛り（4段階） */
function drawWeightGauge(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, weight: number): void {
  const level = WEIGHT_LABELS.findIndex((w) => weight <= w.max + 1e-9);
  const n = WEIGHT_LABELS.length;
  const pip = 6;
  for (let i = 0; i < n; i++) {
    const px = x + (i - (n - 1) / 2) * (pip + 2);
    root.add(scene.add.rectangle(px, y, pip, 4, i <= level ? 0xffb347 : 0x2a3b4e));
  }
}

interface CardOptions {
  selected: boolean;
  inCombo: boolean;
  interactive: boolean;
  actor?: AllyUnit;
  h: ViewHandlers;
}

function drawCard(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  card: CardInstance,
  x: number,
  cy: number,
  w: number,
  hgt: number,
  o: CardOptions,
): void {
  const def = card.card;
  const color = cardColor(def);
  const rect = scene.add.rectangle(x, cy, w, hgt, COLORS.panel).setStrokeStyle(o.selected ? 4 : 2, o.selected ? COLORS.select : color);
  const band = scene.add.rectangle(x, cy - hgt / 2 + 12, w - 4, 20, color, 0.9);
  const type = mainDamageType(def);
  const typeLabel = type ? ELEMENT_LABEL[type] : def.effects.some((e) => e.kind === 'heal') ? '回復' : '補助';
  root.add([rect, band]);
  root.add(addText(scene, x, cy - hgt / 2 + 12, typeLabel, { size: 11, bold: true, color: '#101820' }).setOrigin(0.5));
  if (o.inCombo) {
    const bx = x + w / 2 - 8;
    const by = cy - hgt / 2 + 32;
    root.add(scene.add.circle(bx, by, 7, COLORS.accent));
    root.add(addText(scene, bx, by, 'C', { size: 9, bold: true, color: '#101820' }).setOrigin(0.5));
  }
  root.add(addText(scene, x, cy - 6, def.name, { size: def.name.length > 5 ? 11 : 12, bold: true, align: 'center', wrap: w - 4 }).setOrigin(0.5));
  root.add(addText(scene, x, cy + hgt / 2 - 24, weightLabel(def.weight), { size: 11, color: COLORS.subText }).setOrigin(0.5));
  drawWeightGauge(scene, root, x, cy + hgt / 2 - 10, def.weight);
  makePressable(rect, {
    onTap: o.interactive ? () => o.h.tapCard(card.uid) : undefined,
    onLongPress: () =>
      o.h.detail(
        def.name,
        `カード（MP不要）\n${describeAction(def)}\n${
          def.keepsHand ? '使っても手札は入れ替わらない' : '使うと、次の手番で手札がすべて入れ替わる'
        }\n\n${weightHelp(def.weight, o.actor)}`,
      ),
  });
}

/** 重さの説明（長押しの詳細に出す） */
export function weightHelp(weight: number, actor?: AllyUnit): string {
  const lines = [
    `重さ：${weightLabel(weight)}（${formatWeight(weight)}）`,
    '重さは、行動してから次の手番が来るまでの長さ。重いほど次の手番が遅くなる。',
  ];
  if (actor) lines.push(`${actor.name}が使うと、待ち時間 +${ctDelay(actor.spd, weight)}（速いキャラほど短い）`);
  lines.push('対象を選ぶと、行動順に自分の次の位置が「次」で出る。');
  return lines.join('\n');
}

function comboDetail(combo: ComboDef, actor?: AllyUnit): string {
  const names = combo.cards.map((id) => CARD_NAME[id] ?? id).join(' ＋ ');
  return [`材料：${names}`, describeAction(combo), '材料のカードはすべて捨て札へ', '', weightHelp(combo.weight, actor)].join('\n');
}

function comboListText(s: BattleState): string {
  return [
    '手札に材料のカードがそろうと、まとめて使える大技。カードを使わずに手札を残すと1枚ずつ増えるので、材料がそろうのを待つこともできる。ドロー・すりかえ・シャッフルでも集められる。',
    '',
    ...s.combos.map((c) => {
      const p = comboProgress(s, c);
      return `${c.name}（${p.have}/${p.need}）\n　${c.cards.map((id) => CARD_NAME[id] ?? id).join(' ＋ ')}\n　${describeAction(c)}`;
    }),
  ].join('\n');
}

const HAND_RULE_TEXT = [
  'カード（コンボ含む）を使うと、次の味方の手番の始めに手札をすべて捨てて、新しく5枚引く。',
  `カードを使わずに魔法・スキルや通常攻撃だけで済ませると、手札を残したまま${HOLD_DRAW}枚引く（最大${HAND_MAX}枚）。`,
  'ワンモアやバトンタッチで手番が続く間は、同じ手札を使い続けられる。',
  'ドローは使っても手札が入れ替わらない。',
  '',
  '今のカードを使うか、残してコンボを待つかを選ぼう。',
].join('\n');

const CARD_NAME: Record<string, string> = Object.fromEntries(Object.values(CARDS).map((c) => [c.id, c.name]));

function panelBackground(scene: Phaser.Scene, root: Phaser.GameObjects.Container, title: string): void {
  const { y, h: height } = LAYOUT.hand;
  root.add(scene.add.rectangle(SIDE_PADDING, y, GAME_WIDTH - SIDE_PADDING * 2, height, COLORS.panel).setOrigin(0).setStrokeStyle(1, COLORS.border));
  root.add(addText(scene, SIDE_PADDING + 8, y + 4, title, { size: 11, color: COLORS.subText }));
}

function drawSkillPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const actor = currentAlly(vm.state);
  panelBackground(scene, root, `魔法・スキル（${actor?.name ?? ''}　MP ${actor?.mp ?? 0}）`);
  if (!actor) return;
  const { y } = LAYOUT.hand;
  const rowH = 46;
  actor.skills.forEach((skill, i) => {
    const enough = actor.mp >= skill.mp;
    const selected = vm.selectedSkillId === skill.id;
    const type = mainDamageType(skill);
    const label = `${skill.name}　MP${skill.mp}　${type ? ELEMENT_LABEL[type] : ''}　${weightLabel(skill.weight)}`;
    addButton(
      scene,
      root,
      GAME_WIDTH / 2,
      y + 24 + rowH / 2 + i * (rowH + 4),
      GAME_WIDTH - SIDE_PADDING * 2 - 16,
      rowH,
      label,
      {
        onTap: () => h.tapSkill(skill.id),
        onLongPress: () => h.detail(skill.name, `MP ${skill.mp}\n${describeAction(skill)}\n\n${weightHelp(skill.weight, actor)}`),
      },
      { enabled: enough && vm.interactive, stroke: selected ? COLORS.select : COLORS.border, strokeWidth: selected ? 3 : 1, size: 13 },
    );
  });
}

function drawOtherPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  panelBackground(scene, root, 'その他');
  const { y } = LAYOUT.hand;
  const rowH = 50;
  const actor = currentAlly(vm.state);
  const items: { kind: 'attack' | 'guard'; label: string; detail: string }[] = [BASIC_ATTACK, GUARD].map((def) => ({
    kind: def.id === 'guard' ? 'guard' : 'attack',
    label: `${def.name}　${describeAction(def)}　${weightLabel(def.weight)}`,
    detail: `${describeAction(def)}\n\n${weightHelp(def.weight, actor)}`,
  }));
  items.forEach((item, i) => {
    addButton(
      scene,
      root,
      GAME_WIDTH / 2,
      y + 24 + rowH / 2 + i * (rowH + 6),
      GAME_WIDTH - SIDE_PADDING * 2 - 16,
      rowH,
      item.label,
      { onTap: () => h.tapBasic(item.kind), onLongPress: () => h.detail(item.label.split('　')[0], item.detail) },
      { enabled: vm.interactive, size: 12 },
    );
  });
}

function drawDiscardPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  panelBackground(scene, root, 'すりかえ：手札に加えるカードを選ぶ');
  const { y } = LAYOUT.hand;
  const cols = 4;
  const gap = 4;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - 16 - gap * (cols - 1)) / cols;
  const rowH = 44;
  vm.state.discard.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = SIDE_PADDING + 8 + col * (w + gap) + w / 2;
    const cy = y + 24 + rowH / 2 + row * (rowH + 3);
    addButton(
      scene,
      root,
      x,
      cy,
      w,
      rowH,
      card.card.name,
      { onTap: () => h.tapDiscard(card.uid), onLongPress: () => h.detail(card.card.name, describeAction(card.card)) },
      { stroke: cardColor(card.card), size: 11 },
    );
  });
}

// ⑤ コマンド
function drawCommands(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.commands;
  const s = vm.state;
  const isAllyTurn = !!currentAlly(s) && vm.interactive;
  const batonOk = isAllyTurn && batonTargets(s).length > 0;
  const link = s.links[0];
  const linkOk = isAllyTurn && s.links.some((l) => canUseLink(s, l.id));
  const n = 4;
  const gap = 6;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const items: { kind: 'skills' | 'baton' | 'link' | 'other'; label: string; enabled: boolean; lit?: boolean; active: boolean }[] = [
    { kind: 'skills', label: '魔法・\nスキル', enabled: isAllyTurn, active: vm.panel === 'skills' },
    { kind: 'baton', label: 'バトン\nタッチ', enabled: batonOk, lit: batonOk, active: vm.batonMode },
    { kind: 'link', label: linkOk && link ? `連携技\n${link.name}` : '連携技', enabled: linkOk, lit: linkOk, active: false },
    { kind: 'other', label: 'その他', enabled: isAllyTurn, active: vm.panel === 'other' },
  ];
  items.forEach((item, i) => {
    const x = SIDE_PADDING + i * (w + gap) + w / 2;
    addButton(
      scene,
      root,
      x,
      y + height / 2,
      w,
      height - 20,
      item.label,
      {
        onTap: () => h.tapCommand(item.kind),
        // 連携技は光っていなくても長押しで説明が見られる
        onLongPress: item.kind === 'link' && link ? () => h.detail(`連携技：${link.name}`, linkDetail(s, link)) : undefined,
      },
      {
        enabled: item.enabled,
        fill: item.lit ? 0x5a4a10 : COLORS.panelLight,
        stroke: item.active ? COLORS.select : item.lit ? COLORS.accent : COLORS.border,
        strokeWidth: item.active || item.lit ? 3 : 1,
        textColor: item.lit ? COLORS.accentText : COLORS.text,
        size: item.kind === 'link' && item.lit ? 12 : 14,
        bold: true,
      },
    );
  });
}

function linkDetail(s: BattleState, link: LinkDef): string {
  const [a, b] = link.members.map((id) => findUnit(s, id)?.name ?? id);
  return [
    `${a}と${b}の2人技`,
    describeAction(link),
    '',
    `使える条件：${a}か${b}の手番で、行動順の表示でもう一人の手番が敵を挟まずに続いていること（仲間が間に入るのはよい）。`,
    '条件を満たすとボタンが光り、行動順の2人が金色の線でつながる。',
    `使うと2人の手番をまとめて使い、2人とも重さ「${weightLabel(link.weight)}」の待ち時間が入る。ワンモア中は使えない。`,
  ].join('\n');
}

function drawFooter(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.footer;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - 8) / 2;
  addButton(scene, root, SIDE_PADDING + w / 2, y + height / 2, w, height - 12, 'キャンセル', { onTap: () => h.cancel() }, { size: 15 });
  addButton(
    scene,
    root,
    GAME_WIDTH - SIDE_PADDING - w / 2,
    y + height / 2,
    w,
    height - 12,
    '実行',
    { onTap: () => h.confirm() },
    { enabled: vm.canConfirm, fill: 0x2f6b3f, stroke: 0x6dff9e, size: 16, bold: true },
  );
}

// ---- 詳細の文字 ----

function unitSummary(u: AllyUnit | EnemyUnit): string {
  return `HP ${u.hp}/${u.maxHp}　速さ ${u.spd}`;
}

function enemyDetail(e: EnemyUnit): string {
  const weak = e.knownWeaknesses.length > 0 ? e.knownWeaknesses.map((w) => ELEMENT_LABEL[w]).join('・') : '？';
  const lines = [
    `HP ${e.hp}/${e.maxHp}`,
    `攻撃 ${e.atk}　魔力 ${e.mag}　防御 ${e.def}　速さ ${e.spd}`,
    `弱点 ${weak}`,
    `行動 ${e.actions.map((a) => a.name).join('、')}`,
  ];
  for (const p of e.parts) lines.push(`部位 ${p.name}：${p.broken ? '破壊' : `${p.hp}/${p.maxHp}`}`);
  if (e.down) lines.push('ダウン中（次の手番は立ち上がりに使う）');
  return lines.join('\n');
}

function partDetail(e: EnemyUnit, p: PartState): string {
  const sealed = e.actions.filter((a) => a.requiresPart === p.id).map((a) => `「${a.name}」`);
  const lines = [
    p.broken ? '破壊済み' : `HP ${p.hp}/${p.maxHp}`,
    'タップして攻撃すると、部位HPに全額、本体HPに半分のダメージ',
  ];
  if (sealed.length > 0) lines.push(`破壊すると${sealed.join('、')}が使えなくなる`);
  lines.push(`破壊すると素材「${p.material}」が手に入る（表示のみ）`);
  return lines.join('\n');
}

function allyDetail(a: AllyUnit): string {
  const lines = [
    `HP ${a.hp}/${a.maxHp}　MP ${a.mp}/${a.maxMp}`,
    `攻撃 ${a.atk}　魔力 ${a.mag}　防御 ${a.def}　速さ ${a.spd}`,
    `魔法・スキル：${a.skills.map((k) => k.name).join('、')}`,
  ];
  if (a.guarding) lines.push('防御中（受けるダメージ半減）');
  if (a.batonBoost) lines.push('バトンを受けた（次の行動のダメージ・回復量1.25倍）');
  return lines.join('\n');
}
