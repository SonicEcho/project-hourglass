import Phaser from 'phaser';
import type { ActionDef, AllyUnit, BattleState, CardInstance, ComboDef, EnemyUnit, LinkDef, OrderEntry, PartState, TargetScope } from '../core';
import { actionSpeed, availableCombos, basicAttackFor, batonTargets, chargingAction, comboCards, comboProgress, findUnit, linkReady, skillMpCost } from '../core';
import { BASIC_ATTACK, CARDS, GUARD, HAND_SIZE, LINK_GAUGE_MAX, ONE_MORE_DRAW, SUPPORT_PER_ROUND, WEIGHT_LABELS } from '../data';
import { GAME_WIDTH } from '../config';
import { describeAction, formatWeight, mainDamageType } from './describe';
import { weightLabel } from './labels';
import { summarizePassives } from './naviText';
import { columnX, LAYOUT, MIN_TAP, SIDE_PADDING } from './layout';
import { skillPanelLayout } from './skillLayout';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, ENEMY_COLOR, toCss } from './theme';
import { addBar, addButton, addText, makePressable } from './widgets';

export type Panel = 'none' | 'skills' | 'other' | 'discard' | 'search';

/** 下の決定ボタンの出し方 */
export type FooterMode =
  /** 行動を選んでいる最中：キャンセル／決定 */
  | 'select'
  /** 計画中で何も選んでいない：実行 */
  | 'execute'
  | 'none';

export interface ViewModel {
  state: BattleState;
  /** このラウンドの行動順（計画中は予告、実行中は残りの順番） */
  order: OrderEntry[];
  /** 行動順の予告位置（-1 なら出さない） */
  predictedIndex: number;
  /** 行動を選んでいる仲間（計画中の仲間、または追加行動の仲間） */
  actor?: AllyUnit;
  /** 今の仲間が使ってよい手札 */
  pool: CardInstance[];
  /** スナップを確保している仲間の名前（uid → 名前） */
  reservedBy: Map<number, string>;
  /** 仲間ごとの、決めた行動の短い説明 */
  planLabels: Record<string, string>;
  /** 選んでいる行動の対象範囲（選んでいなければ null） */
  scope: TargetScope | null;
  selectedCardUid?: number;
  selectedSkillId?: string;
  /** 魔法・スキルの一覧のページ（技が多い時） */
  skillPage: number;
  selectedComboId?: string;
  /** 選んでいる連携技（段階26の調整2） */
  selectedLinkId?: string;
  /** 選んだコンボの材料のスナップ */
  comboCardUids: number[];
  selectedTarget?: { kind: 'enemy' | 'ally'; id: string; partId?: string };
  batonMode: boolean;
  panel: Panel;
  message: string;
  footer: FooterMode;
  canConfirm: boolean;
  /** 全員の行動が決まっている */
  planComplete: boolean;
  /** 操作を受け付けるか（演出中は false） */
  interactive: boolean;
}

export interface ViewHandlers {
  tapBackground(): void;
  tapEnemy(id: string, partId?: string): void;
  tapAlly(id: string): void;
  tapCard(uid: number): void;
  tapCombo(id: string): void;
  tapSkill(id: string): void;
  /** 魔法・スキルの一覧の次のページ */
  nextSkillPage(): void;
  tapBasic(kind: 'attack' | 'guard' | 'decline'): void;
  tapDiscard(uid: number): void;
  tapSearch(uid: number): void;
  tapCommand(kind: 'skills' | 'baton' | 'link' | 'other'): void;
  confirm(): void;
  cancel(): void;
  execute(): void;
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
  else if (vm.panel === 'search') drawSearchPanel(scene, root, vm, h);
  else drawHand(scene, root, vm, h);
  drawCommands(scene, root, vm, h);
  drawFooter(scene, root, vm, h);
}

// ① 行動順
function drawTurnOrder(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.turnOrder;
  const s = vm.state;
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, height, COLORS.panel).setOrigin(0));
  root.add(addText(scene, SIDE_PADDING, y + 4, `R${s.round}`, { size: 10, bold: true, color: COLORS.subText }));
  const left = SIDE_PADDING + 22;
  const n = Math.max(6, vm.order.length);
  const slot = (GAME_WIDTH - left - SIDE_PADDING) / n;
  const executing = s.phase === 'execute' || s.phase === 'extra';
  vm.order.forEach((entry, i) => {
    const units = entry.ids.map((id) => findUnit(s, id)).filter((u): u is NonNullable<typeof u> => !!u);
    if (units.length === 0) return;
    const unit = units[0];
    const cx = left + slot * i + slot / 2;
    const cy = y + height / 2 - 2;
    const isCurrent = executing && i === 0;
    const isPredicted = i === vm.predictedIndex;
    const isActor = !executing && !!vm.actor && entry.ids.includes(vm.actor.uid);
    const r = isCurrent ? 19 : 16;
    const color = unit.side === 'ally' ? (ALLY_COLOR[unit.defId] ?? COLORS.ally) : (ENEMY_COLOR[unit.defId] ?? COLORS.enemy);
    const circle = scene.add.circle(cx, cy, r, color, entry.tentative ? 0.45 : unit.side === 'enemy' ? 0.85 : 1);
    circle.setStrokeStyle(
      isCurrent || isPredicted || isActor ? 3 : 1,
      isCurrent ? 0xffffff : isPredicted ? COLORS.accent : isActor ? 0xffffff : COLORS.border,
    );
    const label = units.map((u) => u.name.slice(0, 1)).join('');
    root.add([circle, addText(scene, cx, cy, label, { size: label.length > 1 ? 11 : 13, bold: true, align: 'center' }).setOrigin(0.5)]);
    if (unit.side === 'enemy') root.add(addText(scene, cx + r - 4, cy - r + 2, '敵', { size: 9, color: '#ffb0b0' }).setOrigin(0.5));
    const charging = unit.side === 'enemy' && !!unit.charging;
    const tag = entry.guard ? '防' : entry.precede ? '先' : entry.tentative ? '?' : charging ? '大技' : '';
    if (tag) root.add(addText(scene, cx, y + height - 7, tag, { size: 9, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    if (isPredicted && !tag) root.add(addText(scene, cx, y + height - 7, 'ここ', { size: 9, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    const hit = scene.add.rectangle(cx, cy, Math.max(slot, MIN_TAP), MIN_TAP, 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onLongPress: () =>
        h.detail(
          units.map((u) => u.name).join('と'),
          `このラウンドの${i + 1}番目${entry.tentative ? '（行動がまだ決まっていないので仮の位置）' : ''}\n${units.map(unitSummary).join('\n')}\n\n行動の速さ = 速さ ÷ 重さ。速い順に動く。防御は最初、クイックステップを使った仲間はその次。`,
        ),
    });
  });
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
    // 大技の予告：力をためている
    const charged = alive ? chargingAction(enemy) : undefined;
    if (charged) {
      const label = `ため：${charged.name}${charged.target === 'allies' ? '（全体）' : ''}`;
      const ty = bodyY - radius - 12;
      const bg = scene.add.rectangle(cx, ty, Math.min(colW - 8, label.length * 12 + 16), 20, 0x7a2a10, 0.95).setStrokeStyle(1, 0xff9a5a);
      root.add([bg, addText(scene, cx, ty, label, { size: 11, bold: true, color: '#ffd0a0' }).setOrigin(0.5)]);
    }

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
    const isActor = vm.actor?.uid === ally.uid;
    const targetable = vm.interactive && ((vm.scope === 'ally' && alive) || (vm.batonMode && batonIds.has(ally.uid)));
    const selected = vm.selectedTarget?.kind === 'ally' && vm.selectedTarget.id === ally.uid;
    const panel = scene.add.rectangle(x0, y + 2, w, height - 4, isActor ? COLORS.panelLight : alive ? COLORS.panel : 0x161d25).setOrigin(0);
    panel.setStrokeStyle(
      selected ? 4 : isActor ? 3 : targetable ? 2 : 1,
      selected ? COLORS.select : targetable ? COLORS.accent : isActor ? 0xffffff : COLORS.border,
    );
    root.add(panel);
    const color = toCss(ALLY_COLOR[ally.defId] ?? COLORS.ally);
    root.add(addText(scene, x0 + 6, y + 6, ally.name, { size: 13, bold: true, color: alive ? color : COLORS.dimText }));
    const status = [
      isActor && s.phase === 'extra' ? (s.extra?.boost ? 'バトン' : '追加') : '',
      s.precedeIds.includes(ally.uid) ? '先制' : '',
      ally.guarding ? '防御中' : '',
      alive ? '' : '戦闘不能',
    ]
      .filter(Boolean)
      .join(' ');
    if (status) root.add(addText(scene, x0 + w - 5, y + 7, status, { size: 10, color: COLORS.accentText }).setOrigin(1, 0));
    // 決めた行動
    const plan = vm.planLabels[ally.uid];
    const planText = s.phase === 'plan' && alive ? (plan ? `▶${plan}` : isActor ? '▶選択中…' : '▶未定') : '';
    if (planText) {
      // 1行に収まらない時は「…」で切る
      const max = 11;
      const shown = planText.length > max ? `${planText.slice(0, max - 1)}…` : planText;
      root.add(addText(scene, x0 + 6, y + 25, shown, { size: 10, bold: !!plan, color: plan ? COLORS.text : COLORS.dimText }));
    }
    const barW = w - 12;
    addBar(scene, root, x0 + 6, y + 46, barW, 6, ally.hp / ally.maxHp, ally.hp / ally.maxHp < 0.3 ? COLORS.hpLow : COLORS.hp);
    root.add(addText(scene, x0 + 6, y + 50, `HP ${ally.hp}/${ally.maxHp}`, { size: 10, color: COLORS.subText }));
    addBar(scene, root, x0 + 6, y + 66, barW, 4, ally.mp / ally.maxMp, COLORS.mp);
    root.add(addText(scene, x0 + w - 6, y + 50, `MP ${ally.mp}`, { size: 10, color: COLORS.subText }).setOrigin(1, 0));
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
  const supportText = s.supportUsed ? 'サポート：このラウンドは使用済み' : `サポート：あと${SUPPORT_PER_ROUND}枚使える`;
  const rule = addText(scene, GAME_WIDTH - SIDE_PADDING, y + 2, supportText, { size: 10, color: s.supportUsed ? COLORS.dimText : COLORS.subText }).setOrigin(1, 0);
  root.add(rule);
  makePressable(rule, { onLongPress: () => h.detail('手札のルール', HAND_RULE_TEXT) });
  drawComboStrip(scene, root, vm, h, y + 16);

  // 使えるコンボの材料になっているスナップ
  const comboUids = new Set(availableCombos(s, vm.pool).flatMap((c) => (comboCards(c, vm.pool) ?? []).map((x) => x.uid)));
  const poolUids = new Set(vm.pool.map((c) => c.uid));
  const n = Math.max(5, hand.length);
  const gap = 4;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const top = y + 18 + COMBO_STRIP_H;
  const cardH = height - (top - y) - 2;
  hand.forEach((card, i) => {
    const x = SIDE_PADDING + i * (w + gap) + w / 2;
    drawCard(scene, root, card, x, top + cardH / 2, w, cardH, {
      selected: vm.selectedCardUid === card.uid || vm.comboCardUids.includes(card.uid),
      inCombo: comboUids.has(card.uid),
      reservedBy: poolUids.has(card.uid) ? undefined : vm.reservedBy.get(card.uid),
      interactive: vm.interactive,
      actor: vm.actor,
      h,
    });
  });
}

/** 手札の上の帯：使えるコンボと、あと1枚でそろうコンボ */
function drawComboStrip(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers, y: number): void {
  const s = vm.state;
  const entries = s.combos
    .map((c) => ({ combo: c, ...comboProgress(c, vm.pool) }))
    .filter((e) => e.have === e.need || (e.have > 0 && e.need - e.have === 1))
    .sort((a, b) => b.have / b.need - a.have / a.need)
    .slice(0, 3);
  const cy = y + COMBO_STRIP_H / 2;
  const strip = scene.add.rectangle(GAME_WIDTH / 2, cy, GAME_WIDTH - SIDE_PADDING * 2, COMBO_STRIP_H, 0x0b1118).setStrokeStyle(1, 0x2a3b4e);
  root.add(strip);
  makePressable(strip, { onLongPress: () => h.detail('コンボ一覧', comboListText(s, vm.pool)) });
  if (entries.length === 0) {
    root.add(addText(scene, GAME_WIDTH / 2, cy, 'コンボ：スナップの組み合わせで大技（ここを長押しで一覧）', { size: 10, color: COLORS.dimText }).setOrigin(0.5));
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
      onLongPress: () => h.detail(e.combo.name, comboDetail(e.combo, vm.actor)),
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
  /** 他の仲間が使う予定（その仲間の名前） */
  reservedBy?: string;
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
  const dim = !!o.reservedBy;
  const rect = scene.add.rectangle(x, cy, w, hgt, dim ? 0x141c25 : COLORS.panel).setStrokeStyle(o.selected ? 4 : 2, o.selected ? COLORS.select : color);
  const band = scene.add.rectangle(x, cy - hgt / 2 + 12, w - 4, 20, color, dim ? 0.35 : 0.9);
  const type = mainDamageType(def);
  const typeLabel = def.support ? 'サポート' : type ? ELEMENT_LABEL[type] : def.effects.some((e) => e.kind === 'heal') ? '回復' : '補助';
  root.add([rect, band]);
  root.add(addText(scene, x, cy - hgt / 2 + 12, typeLabel, { size: def.support ? 9 : 11, bold: true, color: '#101820' }).setOrigin(0.5));
  if (o.inCombo && !dim) {
    const bx = x + w / 2 - 8;
    const by = cy - hgt / 2 + 32;
    root.add(scene.add.circle(bx, by, 7, COLORS.accent));
    root.add(addText(scene, bx, by, 'C', { size: 9, bold: true, color: '#101820' }).setOrigin(0.5));
  }
  root.add(
    addText(scene, x, cy - 6, def.name, { size: def.name.length > 5 ? 11 : 12, bold: true, align: 'center', wrap: w - 4, color: dim ? COLORS.dimText : COLORS.text }).setOrigin(0.5),
  );
  if (o.reservedBy) {
    root.add(addText(scene, x, cy + hgt / 2 - 18, `${o.reservedBy}が使う`, { size: 9, bold: true, color: COLORS.accentText, align: 'center', wrap: w - 2 }).setOrigin(0.5));
  } else if (def.support) {
    root.add(addText(scene, x, cy + hgt / 2 - 18, '行動枠なし', { size: 9, color: COLORS.subText }).setOrigin(0.5));
  } else {
    root.add(addText(scene, x, cy + hgt / 2 - 24, weightLabel(def.weight), { size: 11, color: COLORS.subText }).setOrigin(0.5));
    drawWeightGauge(scene, root, x, cy + hgt / 2 - 10, def.weight);
  }
  makePressable(rect, {
    onTap: o.interactive ? () => o.h.tapCard(card.uid) : undefined,
    onLongPress: () =>
      o.h.detail(
        def.name,
        def.support
          ? `サポートスナップ（MP不要・行動枠を使わない）\n${supportText(def)}\n\n計画の途中でその場で使う。1ラウンドにチーム全体で${SUPPORT_PER_ROUND}枚まで。`
          : `スナップ（MP不要）\n${describeAction(def)}\n\n${weightHelp(def.weight, o.actor)}`,
      ),
  });
}

function supportText(def: ActionDef): string {
  const e = def.effects[0];
  if (e?.kind === 'precede') return '仲間1人を選ぶ。その仲間のこのラウンドの行動が、一番最初に来る（防御の次）';
  if (e?.kind === 'search') return `山札の上から${e.count}枚を見て、1枚を手札に加える。残りは山札の一番下へ`;
  return describeAction(def);
}

/** 重さの説明（長押しの詳細に出す） */
export function weightHelp(weight: number, actor?: AllyUnit): string {
  const lines = [
    `重さ：${weightLabel(weight)}（${formatWeight(weight)}）`,
    '行動の速さ = 速さ ÷ 重さ。速い順に動くので、重い行動ほどラウンドの中で後回しになる。',
  ];
  if (actor) lines.push(`${actor.name}（速さ${actor.spd}）が使うと、行動の速さ ${actionSpeed(actor.spd, weight).toFixed(1)}`);
  lines.push('敵より先に弱点を突いてダウンさせると、その敵はこのラウンド動けない（割り込み）。');
  return lines.join('\n');
}

function comboDetail(combo: ComboDef, actor?: AllyUnit): string {
  const names = combo.cards.map((id) => CARD_NAME[id] ?? id).join(' ＋ ');
  return [`材料：${names}`, describeAction(combo), '材料のスナップはすべて、使う仲間が確保する', '', weightHelp(combo.weight, actor)].join('\n');
}

function comboListText(s: BattleState, pool: CardInstance[]): string {
  return [
    '手札に材料のスナップがそろうと、1人の行動としてまとめて使える大技。使わなかったスナップは次のラウンドに残るので、材料を集めて狙える。',
    '',
    ...s.combos.map((c) => {
      const p = comboProgress(c, pool);
      return `${c.name}（${p.have}/${p.need}）\n　${c.cards.map((id) => CARD_NAME[id] ?? id).join(' ＋ ')}\n　${describeAction(c)}`;
    }),
  ].join('\n');
}

const HAND_RULE_TEXT = [
  `ラウンドの始めに、手札を${HAND_SIZE}枚まで補充する。使わなかったスナップは次のラウンドに残る。`,
  '計画でスナップを仲間に割り当てると、そのスナップは他の仲間には使えない（スナップに「○○が使う」と出る）。',
  `延長になると、手札を${ONE_MORE_DRAW}枚引いてから追加行動を選べる。`,
  `ドロー・サーチ・クイックステップはサポートスナップ。計画中にその場で使い、行動枠を使わない（1ラウンドにチーム全体で${SUPPORT_PER_ROUND}枚まで）。`,
].join('\n');

const CARD_NAME: Record<string, string> = Object.fromEntries(Object.values(CARDS).map((c) => [c.id, c.name]));

function panelBackground(scene: Phaser.Scene, root: Phaser.GameObjects.Container, title: string): void {
  const { y, h: height } = LAYOUT.hand;
  root.add(scene.add.rectangle(SIDE_PADDING, y, GAME_WIDTH - SIDE_PADDING * 2, height, COLORS.panel).setOrigin(0).setStrokeStyle(1, COLORS.border));
  root.add(addText(scene, SIDE_PADDING + 8, y + 4, title, { size: 11, color: COLORS.subText }));
}

function drawSkillPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const actor = vm.actor;
  const left = SIDE_PADDING + 8;
  const width = GAME_WIDTH - SIDE_PADDING * 2 - 16;
  const layout = skillPanelLayout(actor?.skills.length ?? 0, width, vm.skillPage);
  const pageText = layout.pages > 1 ? `　${layout.page + 1}/${layout.pages}ページ` : '';
  panelBackground(scene, root, `魔法・スキル（${actor?.name ?? ''}　MP ${actor?.mp ?? 0}）${pageText}`);
  if (!actor) return;
  const { y } = LAYOUT.hand;
  for (const slot of layout.slots) {
    const cx = left + slot.x + slot.w / 2;
    const cy = y + slot.y + slot.h / 2;
    if (slot.index < 0) {
      addButton(scene, root, cx, cy, slot.w, slot.h, `次のページ ▶\n（${layout.page + 1}/${layout.pages}）`, { onTap: () => h.nextSkillPage() }, { enabled: vm.interactive, size: 12 });
      continue;
    }
    const skill = actor.skills[slot.index];
    const cost = skillMpCost(actor, skill);
    const enough = actor.mp >= cost;
    const selected = vm.selectedSkillId === skill.id;
    const type = mainDamageType(skill);
    const info = `MP${cost}　${type ? `${ELEMENT_LABEL[type]}　` : ''}${weightLabel(skill.weight)}`;
    const label = layout.cols === 1 ? `${skill.name}　${info}` : `${skill.name}\n${info}`;
    addButton(
      scene,
      root,
      cx,
      cy,
      slot.w,
      slot.h,
      label,
      {
        onTap: () => h.tapSkill(skill.id),
        onLongPress: () => h.detail(skill.name, `MP ${cost}${cost < skill.mp ? `（MPセーブで${skill.mp}→${cost}）` : ''}\n${describeAction(skill)}\n\n${weightHelp(skill.weight, actor)}`),
      },
      { enabled: enough && vm.interactive, stroke: selected ? COLORS.select : COLORS.border, strokeWidth: selected ? 3 : 1, size: layout.cols === 1 ? 13 : 12 },
    );
  }
}

function drawOtherPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  panelBackground(scene, root, 'その他');
  const { y } = LAYOUT.hand;
  const rowH = 44;
  const items: { kind: 'attack' | 'guard' | 'decline'; label: string; detail: string }[] = [vm.actor ? basicAttackFor(vm.actor) : BASIC_ATTACK, GUARD].map((def) => ({
    kind: def.id === 'guard' ? ('guard' as const) : ('attack' as const),
    label: def.id === 'guard' ? '防御　このラウンドの間、受けるダメージ半減（最初に効く）' : `${def.name}　${describeAction(def)}　${weightLabel(def.weight)}`,
    detail: def.id === 'guard' ? '行動の速さに関係なく、ラウンドの最初に効く。ラウンドの終わりに解ける。' : `${describeAction(def)}\n\n${weightHelp(def.weight, vm.actor)}`,
  }));
  if (vm.state.phase === 'extra') items.push({ kind: 'decline', label: '追加行動を見送る', detail: '追加行動をしないで、ラウンドの残りを続ける。' });
  items.forEach((item, i) => {
    addButton(
      scene,
      root,
      GAME_WIDTH / 2,
      y + 24 + rowH / 2 + i * (rowH + 5),
      GAME_WIDTH - SIDE_PADDING * 2 - 16,
      rowH,
      item.label,
      { onTap: () => h.tapBasic(item.kind), onLongPress: () => h.detail(item.label.split('　')[0], item.detail) },
      { enabled: vm.interactive, size: 12 },
    );
  });
}

function cardGrid(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  cards: CardInstance[],
  onTap: (uid: number) => void,
  h: ViewHandlers,
): void {
  const { y } = LAYOUT.hand;
  const cols = 4;
  const gap = 4;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - 16 - gap * (cols - 1)) / cols;
  const rowH = 44;
  cards.forEach((card, i) => {
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
      { onTap: () => onTap(card.uid), onLongPress: () => h.detail(card.card.name, card.card.support ? supportText(card.card) : describeAction(card.card)) },
      { stroke: cardColor(card.card), size: 11 },
    );
  });
}

function drawDiscardPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  panelBackground(scene, root, 'すりかえ：手札に加えるスナップを選ぶ');
  cardGrid(scene, root, vm.state.discard, (uid) => h.tapDiscard(uid), h);
}

function drawSearchPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  panelBackground(scene, root, 'サーチ：手札に加えるスナップを1枚選ぶ（残りは山札の下へ）');
  cardGrid(scene, root, vm.state.searchChoice ?? [], (uid) => h.tapSearch(uid), h);
}

// ⑤ コマンド
function drawCommands(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.commands;
  const s = vm.state;
  const canAct = !!vm.actor && vm.interactive && !s.searchChoice;
  const batonOk = canAct && s.phase === 'extra' && batonTargets(s).length > 0;
  // 連携技：今の仲間が組めるもの（選んでいればそれ）。つながりゲージが満タンの時だけ使える（段階26の調整2）
  const mine = vm.actor ? actorLinks(s, vm.actor.uid) : [];
  const link = mine.find((l) => l.id === vm.selectedLinkId) ?? mine[0] ?? s.links[0];
  const ready = linkReady(s);
  const linkOk = canAct && s.phase === 'plan' && ready && mine.length > 0;
  const gaugePct = Math.round((s.linkGauge / LINK_GAUGE_MAX) * 100);
  const linkLabel = s.links.length === 0 ? '連携技' : linkOk && link ? `連携技\n${link.name}${mine.length > 1 ? ' ⇄' : ''}` : ready ? '連携技\n準備OK' : `連携技\nつながり ${gaugePct}%`;
  const n = 4;
  const gap = 6;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const items: { kind: 'skills' | 'baton' | 'link' | 'other'; label: string; enabled: boolean; lit?: boolean; active: boolean }[] = [
    { kind: 'skills', label: '魔法・\nスキル', enabled: canAct, active: vm.panel === 'skills' },
    { kind: 'baton', label: 'バトン\nタッチ', enabled: batonOk, lit: batonOk, active: vm.batonMode },
    { kind: 'link', label: linkLabel, enabled: linkOk, lit: linkOk, active: !!vm.selectedLinkId },
    { kind: 'other', label: 'その他', enabled: canAct, active: vm.panel === 'other' },
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
  if (s.links.length > 0) {
    // つながりゲージ：連携技のボタンの下の端に、貯まった分だけ光る帯
    const x = SIDE_PADDING + 2 * (w + gap) + 6;
    const bw = w - 12;
    const by = y + height - 18;
    root.add(scene.add.rectangle(x, by, bw, 5, 0x000000, 0.5).setOrigin(0, 0.5));
    if (gaugePct > 0) root.add(scene.add.rectangle(x, by, bw * (gaugePct / 100), 5, ready ? COLORS.accent : 0xff9a5a).setOrigin(0, 0.5));
  }
}

/** その仲間が組める連携技（相方も生きているもの） */
export function actorLinks(s: BattleState, actorId: string): LinkDef[] {
  return s.links.filter((l) => l.members.includes(actorId) && l.members.every((id) => (findUnit(s, id)?.hp ?? 0) > 0));
}

function linkDetail(s: BattleState, link: LinkDef): string {
  const [a, b] = link.members.map((id) => findUnit(s, id)?.name ?? id);
  return [
    `${a}と${b}の2人技`,
    describeAction(link),
    '',
    `つながりゲージ：${s.linkGauge}/${LINK_GAUGE_MAX}。弱点を突く・ダウンさせる・バトンタッチ・部位破壊・攻撃を受けると貯まる。満タンで連携技を1回使え、使うと0に戻る。`,
    `使い方：ゲージが満タンの時、計画で${a}か${b}の行動を選ぶ時に「連携技」を押す。2人分の行動をまとめて使う（組める技が2つある時は、もう一度押すと切り替わる）。`,
    `行動の速さは、2人のうち遅い方の速さ ÷ 重さ${formatWeight(link.weight)}（${weightLabel(link.weight)}）。`,
    '延長やバトンの追加行動では使えない。',
  ].join('\n');
}

function drawFooter(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.footer;
  if (vm.footer === 'select') {
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - 8) / 2;
    addButton(scene, root, SIDE_PADDING + w / 2, y + height / 2, w, height - 12, 'キャンセル', { onTap: () => h.cancel() }, { size: 15 });
    addButton(scene, root, GAME_WIDTH - SIDE_PADDING - w / 2, y + height / 2, w, height - 12, '決定', { onTap: () => h.confirm() }, {
      enabled: vm.canConfirm,
      fill: 0x2f6b3f,
      stroke: 0x6dff9e,
      size: 16,
      bold: true,
    });
  } else if (vm.footer === 'execute') {
    const left = vm.state.allies.filter((a) => a.hp > 0 && !vm.planLabels[a.uid]).length;
    addButton(
      scene,
      root,
      GAME_WIDTH / 2,
      y + height / 2,
      GAME_WIDTH - SIDE_PADDING * 2,
      height - 12,
      vm.planComplete ? '実行' : `実行（あと${left}人の行動を選ぶ）`,
      { onTap: () => h.execute() },
      { enabled: vm.planComplete && vm.interactive, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2, size: 17, bold: true },
    );
  }
}

// ---- 詳細の文字 ----

/**
 * ためている大技の止め方（その時に本当に使える手だけ）。
 * 部位破壊で解けるのは、その部位を使う大技だけ。ダウンは弱点が分かっている時だけ書く
 */
export function chargeCounterText(e: EnemyUnit): string {
  const a = chargingAction(e);
  if (!a) return '';
  const ways: string[] = [];
  if (e.knownWeaknesses.length > 0) ways.push(`弱点（${e.knownWeaknesses.map((w) => ELEMENT_LABEL[w]).join('・')}）でダウンさせる`);
  const part = a.requiresPart ? e.parts.find((p) => p.id === a.requiresPart && !p.broken) : undefined;
  if (part) ways.push(`${part.name}を壊す`);
  ways.push('防御でしのぐ');
  return `止め方：${ways.join('／')}`;
}

function unitSummary(u: AllyUnit | EnemyUnit): string {
  return `${u.name}　HP ${u.hp}/${u.maxHp}　速さ ${u.spd}`;
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
  const charged = chargingAction(e);
  if (charged) lines.push(`力をためている：次の行動で「${charged.name}」`, chargeCounterText(e));
  if (e.down) lines.push('ダウン中（次の手番は立ち上がりに使う）');
  if (e.enraged) lines.push('怒っている：ためを崩されたので、立ち上がった次の行動ではためずに攻撃する（その攻撃まではダウンしない）');
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
  if (a.passives.length > 0) lines.push('', 'ムーブメントの効果：', ...summarizePassives(a.passives).map((t) => `・${t}`));
  if (a.guarding) lines.push('防御中（このラウンドの間、受けるダメージ半減）');
  return lines.join('\n');
}
