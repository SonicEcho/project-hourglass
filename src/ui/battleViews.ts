import Phaser from 'phaser';
import type { ActionDef, AllyUnit, BattleState, CardInstance, EnemyUnit, ForecastEntry, TargetScope } from '../core';
import { batonTargets, canUseLink, currentAlly, findUnit } from '../core';
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
  selectedTarget?: { kind: 'enemy' | 'ally'; id: string };
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
  tapEnemy(id: string): void;
  tapAlly(id: string): void;
  tapCard(uid: number): void;
  tapSkill(id: string): void;
  tapBasic(kind: 'attack' | 'guard'): void;
  tapDiscard(uid: number): void;
  tapCommand(kind: 'skills' | 'baton' | 'link' | 'other'): void;
  confirm(): void;
  cancel(): void;
  detail(title: string, body: string): void;
}

/** 画面上の各キャラの位置（演出の文字を出す場所） */
export function unitPosition(s: BattleState, id: string): { x: number; y: number } {
  const ei = s.enemies.findIndex((e) => e.uid === id);
  if (ei >= 0) return { x: columnX(ei, s.enemies.length), y: ENEMY_BODY_Y };
  const ai = s.allies.findIndex((a) => a.uid === id);
  return { x: columnX(Math.max(0, ai), s.allies.length), y: LAYOUT.allies.y + LAYOUT.allies.h / 2 };
}

const ENEMY_BODY_Y = LAYOUT.enemies.y + 120;

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
}

// ② 敵
function drawEnemies(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const s = vm.state;
  const n = s.enemies.length;
  const colW = GAME_WIDTH / n;
  s.enemies.forEach((enemy, i) => {
    const cx = columnX(i, n);
    const alive = enemy.hp > 0;
    const targetable = alive && vm.interactive && vm.scope === 'enemy';
    const selected = vm.selectedTarget?.kind === 'enemy' && vm.selectedTarget.id === enemy.uid;
    const color = ENEMY_COLOR[enemy.defId] ?? COLORS.enemy;

    // 判明した弱点
    const known = enemy.knownWeaknesses;
    known.forEach((el, k) => {
      const ix = cx + (k - (known.length - 1) / 2) * 30;
      const iy = LAYOUT.enemies.y + 30;
      const icon = scene.add.rectangle(ix, iy, 26, 20, ELEMENT_COLOR[el]).setStrokeStyle(1, 0xffffff);
      const t = addText(scene, ix, iy, ELEMENT_LABEL[el], { size: 11, bold: true, color: '#101820', align: 'center' }).setOrigin(0.5);
      root.add([icon, t]);
    });
    if (known.length > 0) {
      root.add(addText(scene, cx, LAYOUT.enemies.y + 48, '弱点', { size: 9, color: COLORS.subText }).setOrigin(0.5));
    }

    const body = scene.add.circle(cx, ENEMY_BODY_Y, 42, color, alive ? 1 : 0.15);
    body.setStrokeStyle(selected ? 4 : targetable ? 2 : 1, selected ? COLORS.select : targetable ? COLORS.accent : COLORS.border);
    root.add(body);
    if (enemy.down && alive) {
      root.add(addText(scene, cx, ENEMY_BODY_Y, 'DOWN', { size: 18, bold: true, color: COLORS.weak }).setOrigin(0.5).setAngle(-12));
    }
    if (!alive) root.add(addText(scene, cx, ENEMY_BODY_Y, '撃破', { size: 14, color: COLORS.dimText }).setOrigin(0.5));

    const nameY = ENEMY_BODY_Y + 58;
    root.add(addText(scene, cx, nameY, enemy.name, { size: 13, align: 'center', color: alive ? COLORS.text : COLORS.dimText }).setOrigin(0.5));
    const barW = Math.min(110, colW - 16);
    addBar(scene, root, cx - barW / 2, nameY + 18, barW, 8, enemy.hp / enemy.maxHp, enemy.hp / enemy.maxHp < 0.3 ? COLORS.hpLow : COLORS.hp);
    root.add(addText(scene, cx, nameY + 32, `${enemy.hp}/${enemy.maxHp}`, { size: 11, color: COLORS.subText }).setOrigin(0.5));

    // 列全体をタップ領域にする
    const hit = scene.add.rectangle(cx, LAYOUT.enemies.y + LAYOUT.enemies.h / 2, colW - 4, LAYOUT.enemies.h - 8, 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onTap: vm.interactive ? () => h.tapEnemy(enemy.uid) : undefined,
      onLongPress: () => h.detail(enemy.name, enemyDetail(enemy)),
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
function drawHand(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = LAYOUT.hand;
  const s = vm.state;
  const hand = s.hand;
  root.add(addText(scene, SIDE_PADDING, y + 2, `手札 ${hand.length}　山札 ${s.deck.length}　捨て札 ${s.discard.length}`, { size: 10, color: COLORS.subText }));
  const n = Math.max(5, hand.length);
  const gap = 4;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const cardH = height - 26;
  hand.forEach((card, i) => {
    const selected = vm.selectedCardUid === card.uid;
    const x = SIDE_PADDING + i * (w + gap) + w / 2;
    const cy = y + 18 + cardH / 2;
    drawCard(scene, root, card, x, cy, w, cardH, selected, vm.interactive, h);
  });
}

function cardColor(def: ActionDef): number {
  const t = mainDamageType(def);
  if (t) return ELEMENT_COLOR[t];
  if (def.effects.some((e) => e.kind === 'heal')) return 0x4cd07d;
  return 0xa98be0;
}

function drawCard(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  card: CardInstance,
  x: number,
  cy: number,
  w: number,
  hgt: number,
  selected: boolean,
  interactive: boolean,
  h: ViewHandlers,
): void {
  const def = card.card;
  const color = cardColor(def);
  const rect = scene.add.rectangle(x, cy, w, hgt, COLORS.panel).setStrokeStyle(selected ? 4 : 2, selected ? COLORS.select : color);
  const band = scene.add.rectangle(x, cy - hgt / 2 + 12, w - 4, 20, color, 0.9);
  const type = mainDamageType(def);
  const typeLabel = type ? ELEMENT_LABEL[type] : def.effects.some((e) => e.kind === 'heal') ? '回復' : '補助';
  root.add([rect, band]);
  root.add(addText(scene, x, cy - hgt / 2 + 12, typeLabel, { size: 11, bold: true, color: '#101820' }).setOrigin(0.5));
  root.add(addText(scene, x, cy - 8, def.name, { size: def.name.length > 5 ? 11 : 12, bold: true, align: 'center', wrap: w - 4 }).setOrigin(0.5));
  root.add(addText(scene, x, cy + hgt / 2 - 14, `重さ ${formatWeight(def.weight)}`, { size: 10, color: COLORS.subText }).setOrigin(0.5));
  makePressable(rect, {
    onTap: interactive ? () => h.tapCard(card.uid) : undefined,
    onLongPress: () => h.detail(def.name, `カード（MP不要）\n${describeAction(def)}\n重さ ${formatWeight(def.weight)}`),
  });
}

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
    const label = `${skill.name}　MP${skill.mp}　${type ? ELEMENT_LABEL[type] : ''}　重さ${formatWeight(skill.weight)}`;
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
        onLongPress: () => h.detail(skill.name, `MP ${skill.mp}\n${describeAction(skill)}\n重さ ${formatWeight(skill.weight)}`),
      },
      { enabled: enough && vm.interactive, stroke: selected ? COLORS.select : COLORS.border, strokeWidth: selected ? 3 : 1, size: 13 },
    );
  });
}

function drawOtherPanel(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  panelBackground(scene, root, 'その他');
  const { y } = LAYOUT.hand;
  const rowH = 50;
  const items: { kind: 'attack' | 'guard'; label: string; detail: string }[] = [
    { kind: 'attack', label: '通常攻撃　物理・威力20　重さ1.0', detail: '敵単体に物理・威力20\n重さ 1.0' },
    { kind: 'guard', label: '防御　重さ0.6', detail: '次の自分の手番まで受けるダメージ半減\n重さ 0.6' },
  ];
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
      { enabled: vm.interactive, size: 13 },
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
  const linkOk = isAllyTurn && s.links.some((l) => canUseLink(s, l.id));
  const n = 4;
  const gap = 6;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const items: { kind: 'skills' | 'baton' | 'link' | 'other'; label: string; enabled: boolean; lit?: boolean; active: boolean }[] = [
    { kind: 'skills', label: '魔法・\nスキル', enabled: isAllyTurn, active: vm.panel === 'skills' },
    { kind: 'baton', label: 'バトン\nタッチ', enabled: batonOk, lit: batonOk, active: vm.batonMode },
    { kind: 'link', label: '連携技', enabled: linkOk, lit: linkOk, active: false },
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
      { onTap: () => h.tapCommand(item.kind) },
      {
        enabled: item.enabled,
        fill: item.lit ? 0x5a4a10 : COLORS.panelLight,
        stroke: item.active ? COLORS.select : item.lit ? COLORS.accent : COLORS.border,
        strokeWidth: item.active || item.lit ? 3 : 1,
        textColor: item.lit ? COLORS.accentText : COLORS.text,
        size: 14,
        bold: true,
      },
    );
  });
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
  if (e.down) lines.push('ダウン中（次の手番は立ち上がりに使う）');
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
