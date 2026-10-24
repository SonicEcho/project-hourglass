import Phaser from 'phaser';
import type { ActionDef, AllyUnit, BattleState, CardDef, CardInstance, ComboDef, EnemyUnit, LinkDef, OrderEntry, PartState, TargetScope } from '../core';
import { actionSpeed, availableCombos, basicAttackFor, batonTargets, chargingAction, comboCards, comboProgress, findUnit, linkReady, planOf, pouchLeft, skillMpCost } from '../core';
import { ALLY_FACE, BASIC_ATTACK, ENEMY_ART, ENEMY_PART_SPOTS, CARD_ART, CARD_NAME_LINES, CARDS, FACE_CROP, FACE_CROPS, GUARD, HAND_SIZE, LINK_GAUGE_MAX, ONE_MORE_DRAW, SUPPORT_PER_ROUND, WEIGHT_LABELS } from '../data';
import { GAME_WIDTH } from '../config';
import { describeAction, formatWeight, mainDamageType } from './describe';
import { weightLabel } from './labels';
import { summarizePassives } from './naviText';
import { columnX, FILM_LAYOUT, LAYOUT, MIN_TAP, SIDE_PADDING } from './layout';
import { skillPanelLayout } from './skillLayout';
import { ALLY_COLOR, COLORS, ELEMENT_COLOR, ELEMENT_LABEL, ENEMY_COLOR, STAGE, toCss } from './theme';
import { hasImage } from '../assets/loader';
import { addBar, addButton, addText, makePressable } from './widgets';
import { countText, screenBg } from './skin';
import { addIcon, type IconKind } from './icons';

export type Panel = 'none' | 'skills' | 'other' | 'discard' | 'search';

/** 下の決定ボタンの出し方 */
export type FooterMode =
  /** 行動を選んでいる最中：キャンセル／決定 */
  | 'select'
  /** 計画中で何も選んでいない：オート／早送り／実行 */
  | 'execute'
  /** オートで進めている（段階29）：どこかをタップすると手動に戻る */
  | 'auto'
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
  /** 仲間ごとの、決めた行動に使う札（スナップ・コンボの1枚目）の id。新しい画面のフィルムのコマに写真を入れる（段階102b） */
  planCards: Record<string, string>;
  /** 選んでいる行動の対象範囲（選んでいなければ null） */
  scope: TargetScope | null;
  selectedCardUid?: number;
  selectedSkillId?: string;
  /** 選んでいるポーチの消費アイテム（段階51） */
  selectedItemId?: string;
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
  /** オートを使える戦闘か（ボス戦では使えない。段階29） */
  autoAvailable: boolean;
  /** 演出の速さ（1・2・3倍） */
  speed: number;
  /** オート中の作戦の名前 */
  autoName: string;
}

export interface ViewHandlers {
  tapBackground(): void;
  tapEnemy(id: string, partId?: string): void;
  tapAlly(id: string): void;
  tapCard(uid: number): void;
  tapCombo(id: string): void;
  tapSkill(id: string): void;
  /** ポーチの消費アイテムを選ぶ（段階51） */
  tapItem(itemId: string): void;
  /** 魔法・スキルの一覧の次のページ */
  nextSkillPage(): void;
  tapBasic(kind: 'attack' | 'guard' | 'decline'): void;
  tapDiscard(uid: number): void;
  tapSearch(uid: number): void;
  tapCommand(kind: 'skills' | 'baton' | 'link' | 'other'): void;
  confirm(): void;
  cancel(): void;
  execute(): void;
  /** オートの作戦を選ぶ（段階29） */
  openAuto(): void;
  /** 早送りの速さを切り替える */
  toggleSpeed(): void;
  detail(title: string, body: string): void;
}

/** 前に出した HP・MP（段階32a 調整1。描き直す時に、前の値から数えるように動かすため）。戦闘の始めに空にする */
const shownValues = new Map<string, number>();

export function resetShownValues(): void {
  shownValues.clear();
}

/** 前に出した値を返し、今の値を覚える（初めてなら今の値） */
function previousValue(key: string, now: number): number {
  const prev = shownValues.get(key) ?? now;
  shownValues.set(key, now);
  return prev;
}

export function drawBattle(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  // 何もない所をタップしたら選び直し
  const bg = screenBg(scene);
  root.add(bg);
  if (vm.interactive) makePressable(bg, { onTap: () => h.tapBackground() });
  if (FILM_UI) {
    drawFilmBattle(scene, root, vm, h);
    return;
  }

  drawTurnOrder(scene, root, vm, h);
  drawStage(scene, root);
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
    root.add(circle);
    // 立ち絵がある仲間は顔の絵（段階32a 調整1）。2人並んで動く時と敵は名前の1文字
    const faceId = unit.side === 'ally' && units.length === 1 ? ALLY_FACE[unit.defId] : undefined;
    if (faceId && hasImage(scene, faceId)) {
      root.add(faceImage(scene, faceId, cx, cy, r - 1, FACE_CROPS[unit.defId]).setAlpha(entry.tentative ? 0.45 : 1));
      root.add(scene.add.circle(cx, cy, r).setStrokeStyle(circle.lineWidth, circle.strokeColor));
    } else root.add(addText(scene, cx, cy, label, { size: label.length > 1 ? 11 : 13, bold: true, align: 'center' }).setOrigin(0.5));
    if (unit.side === 'enemy') root.add(addText(scene, cx + r - 4, cy - r + 2, '敵', { size: 10, color: '#ffb0b0' }).setOrigin(0.5));
    const charging = unit.side === 'enemy' && !!unit.charging;
    const tag = entry.guard ? '防' : entry.precede ? '先' : entry.tentative ? '?' : charging ? '大技' : '';
    if (tag) root.add(addText(scene, cx, y + height - 7, tag, { size: 10, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    if (isPredicted && !tag) root.add(addText(scene, cx, y + height - 7, 'ここ', { size: 10, bold: true, color: COLORS.accentText }).setOrigin(0.5));
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
/**
 * 敵1体ごとの配置。部位を持つ敵が1体だけ（ボス）の時は、本体を大きく出し、部位はその体の上に印で出す
 * （段階89。前は部位を絵の下にパネルで並べていて、ボスと小さい敵2体の3対1に見えた）
 */
function enemyGeometry(s: BattleState, i: number) {
  const n = s.enemies.length;
  const withParts = n === 1 && s.enemies[0].parts.length > 0;
  return {
    cx: columnX(i, n),
    colW: GAME_WIDTH / n,
    bodyY: withParts ? BOSS_ART_BOTTOM - BOSS_ART_SIZE / 2 : LAYOUT.enemies.y + 120,
    radius: withParts ? 74 : 42,
    withParts,
    // 敵の絵の大きさと中心の高さ。ボス（部位あり）は、名前と HP を絵の足もとに重ねて、部位の列の上いっぱいに大きく出す（2026-10-15、開発者の指摘で大きくした）
    artSize: withParts ? BOSS_ART_SIZE : 0,
    artY: withParts ? BOSS_ART_BOTTOM - BOSS_ART_SIZE / 2 : LAYOUT.enemies.y + 120 - 42 * 0.12,
  };
}

/** ボスの絵の一辺と、絵の下の端（段階89：部位の列をやめたので、敵の場所の下いっぱいまで大きくした） */
const BOSS_ART_SIZE = 250;
const BOSS_ART_BOTTOM = LAYOUT.enemies.y + LAYOUT.enemies.h - 6;
/** 部位の印の半径（直径がタップできる大きさ） */
const PART_SPOT_R = 22;

/** 部位の印の位置（段階89）。絵の中の割合（ENEMY_PART_SPOTS）を、ボスの絵の四角の上の座標にする。書いていない部位は体の上のほうに横に並べる */
function partSpot(enemy: EnemyUnit, index: number, cx: number): { x: number; y: number } {
  const part = enemy.parts[index];
  const n = enemy.parts.length;
  const [fx, fy] = ENEMY_PART_SPOTS[enemy.defId]?.[part.id] ?? [0.5 + (index - (n - 1) / 2) * 0.34, 0.4];
  return { x: cx + (fx - 0.5) * BOSS_ART_SIZE, y: BOSS_ART_BOTTOM - BOSS_ART_SIZE + fy * BOSS_ART_SIZE };
}

/** 部位のひびの段階（段階89）：0 無傷・1 ひび・2 割れかけ・3 破壊。HP の数字は見せず、この段階だけで見せる */
export function crackStage(part: PartState): 0 | 1 | 2 | 3 {
  if (part.broken || part.hp <= 0) return 3;
  const r = part.hp / part.maxHp;
  return r > 2 / 3 ? 0 : r > 1 / 3 ? 1 : 2;
}

/** 画面上の各キャラ（と部位）の位置（演出の文字を出す場所） */
export function unitPosition(s: BattleState, id: string, partId?: string): { x: number; y: number } {
  const ei = s.enemies.findIndex((e) => e.uid === id);
  if (ei >= 0) {
    const g = enemyGeometry(s, ei);
    const parts = s.enemies[ei].parts;
    const pi = partId === undefined ? -1 : parts.findIndex((p) => p.id === partId);
    if (g.withParts && pi >= 0) return partSpot(s.enemies[ei], pi, g.cx);
    return { x: g.cx, y: g.bodyY };
  }
  const ai = s.allies.findIndex((a) => a.uid === id);
  if (FILM_UI) {
    // 新しい画面（段階102a）：仲間のタブの真ん中
    const n = s.allies.length;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - 6 * (n - 1)) / n;
    return { x: SIDE_PADDING + Math.max(0, ai) * (w + 6) + w / 2, y: FILM_LAYOUT.tabs.y + FILM_LAYOUT.tabs.h / 2 };
  }
  return { x: columnX(Math.max(0, ai), s.allies.length), y: LAYOUT.allies.y + LAYOUT.allies.h / 2 };
}

/** 立ち絵から顔を丸く切り出した絵（中心 cx, cy、半径 r） */
function faceImage(scene: Phaser.Scene, id: string, cx: number, cy: number, r: number, crop: { x: number; y: number; size: number } = FACE_CROP): Phaser.GameObjects.Image {
  const src = scene.textures.get(id).getSourceImage();
  const size = src.width * crop.size;
  const sx = src.width * crop.x;
  const sy = src.height * crop.y;
  const img = scene.add.image(cx, cy, id).setCrop(sx, sy, size, size);
  img.setOrigin((sx + size / 2) / src.width, (sy + size / 2) / src.height).setScale((r * 2) / size);
  const shape = scene.make.graphics({}, false).fillStyle(0xffffff).fillCircle(cx, cy, r);
  img.setMask(shape.createGeometryMask());
  img.once(Phaser.GameObjects.Events.DESTROY, () => shape.destroy());
  return img;
}

/** 敵のいる場所の舞台（段階32a 調整1）：奥の地平の線と、手前ほど暗くなる地面の帯 */
function drawStage(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
  const { y, h: height } = LAYOUT.enemies;
  // 地平は敵の足元の少し上（敵が地面に立って見えるように）
  const horizon = y + height * 0.6;
  const g = scene.add.graphics();
  g.fillGradientStyle(STAGE.floorTop, STAGE.floorTop, STAGE.floorBottom, STAGE.floorBottom, 0, 0, 0.75, 0.75);
  g.fillRect(0, horizon, GAME_WIDTH, y + height - horizon);
  g.lineStyle(1, COLORS.accent, 0.18).lineBetween(0, horizon, GAME_WIDTH, horizon);
  root.add(g);
}

function drawEnemies(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const s = vm.state;
  s.enemies.forEach((enemy, i) => {
    const g = enemyGeometry(s, i);
    const { cx, colW, bodyY, radius } = g;
    const art = ENEMY_ART[enemy.defId];
    const withArt = !!art && hasImage(scene, art);
    // ボスの絵は大きく出すので、影・光・足もとの輪も絵の大きさに合わせる
    const bigArt = withArt && g.artSize > 0;
    const footY = bigArt ? BOSS_ART_BOTTOM - 8 : bodyY + radius * 0.92;
    const footW = bigArt ? g.artSize * 0.75 : radius * 1.7;
    const alive = enemy.hp > 0;
    const targetable = alive && vm.interactive && vm.scope === 'enemy';
    const sel = vm.selectedTarget;
    const selected = sel?.kind === 'enemy' && sel.id === enemy.uid && sel.partId === undefined;
    const color = ENEMY_COLOR[enemy.defId] ?? COLORS.enemy;

    // 判明した弱点
    const known = enemy.knownWeaknesses;
    // ボスの絵は大きいので、弱点は絵の頭に重ねず左上に出す
    const weakX = g.withParts ? SIDE_PADDING + 14 + ((known.length - 1) / 2) * 30 : cx;
    known.forEach((el, k) => {
      const ix = weakX + (k - (known.length - 1) / 2) * 30;
      const iy = LAYOUT.enemies.y + 22;
      const icon = scene.add.rectangle(ix, iy, 26, 20, ELEMENT_COLOR[el]).setRounded(6).setStrokeStyle(1, 0xffffff);
      root.add([icon, addIcon(scene, el, ix, iy, 14, 0x101820)]);
    });
    if (known.length > 0) {
      root.add(addText(scene, weakX, LAYOUT.enemies.y + 40, '弱点', { size: 10, color: COLORS.subText }).setOrigin(0.5));
    }

    // 本体をタップする領域（ボスの部位の印は、この上に重ねる）
    const hitTop = LAYOUT.enemies.y + 4;
    const hitBottom = LAYOUT.enemies.y + LAYOUT.enemies.h - 4;
    const hit = scene.add.rectangle(cx, (hitTop + hitBottom) / 2, colW - 4, hitBottom - hitTop, 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onTap: vm.interactive ? () => h.tapEnemy(enemy.uid) : undefined,
      onLongPress: () => h.detail(enemy.name, enemyDetail(enemy)),
    });

    // 足元の影と、後ろのほのかな光（段階32a 調整1）
    root.add(scene.add.ellipse(cx, footY, footW, 14, 0x000000, alive ? 0.4 : 0.15));
    if (alive) {
      const glowY = bigArt ? g.artY : bodyY;
      const glowR = bigArt ? g.artSize * 0.42 : radius;
      for (let k = 3; k >= 1; k--) root.add(scene.add.circle(cx, glowY, glowR + k * 9, color, 0.05));
    }
    if (withArt) {
      // 敵の絵（段階37）：丸の代わりに、丸より少し大きく出す（列の幅に収める）。選べる時・選んだ時は、足もとに輪
      if (selected || targetable) {
        const ring = scene.add.ellipse(cx, footY, bigArt ? footW * 1.2 : radius * 2.1, 22, 0x000000, 0);
        ring.setStrokeStyle(selected ? 4 : 2, selected ? COLORS.select : COLORS.accent);
        root.add(ring);
      }
      const img = scene.add.image(cx, g.artY, art);
      img.setScale(Math.min(bigArt ? g.artSize : radius * 2.6, colW - 8) / Math.max(img.width, img.height));
      if (!alive) img.setAlpha(0.2).setTint(0x606060);
      root.add(img);
    } else {
      const body = scene.add.circle(cx, bodyY, radius, color, alive ? 1 : 0.15);
      body.setStrokeStyle(selected ? 4 : targetable ? 2 : 1, selected ? COLORS.select : targetable ? COLORS.accent : COLORS.border);
      root.add(body);
      // 丸い体の、左上の照り（敵の絵がない敵の図形を、少し立体に見せる）
      if (alive) root.add(scene.add.ellipse(cx - radius * 0.32, bodyY - radius * 0.38, radius * 0.7, radius * 0.45, 0xffffff, 0.18));
    }
    // ボスの DOWN・体勢崩れは、部位の印と重ならないよう、絵の上のほうに出す（段階89）
    const stateY = g.withParts ? BOSS_ART_BOTTOM - BOSS_ART_SIZE + 34 : bodyY;
    if (enemy.down && alive) {
      root.add(addText(scene, cx, stateY, 'DOWN', { size: 18, bold: true, color: COLORS.weak }).setOrigin(0.5).setAngle(-12));
    } else if (enemy.standUpGuard && alive) {
      // 立ち上がったばかりで、まだ動いていない（体勢が崩れている。連携技が2倍で当たる）
      root.add(addText(scene, cx, stateY, '体勢崩れ', { size: 14, bold: true, color: COLORS.weak }).setOrigin(0.5).setAngle(-12));
    }
    if (!alive) root.add(addText(scene, cx, bodyY, '撃破', { size: 14, color: COLORS.dimText }).setOrigin(0.5));
    // 大技の予告：力をためている
    const charged = alive ? chargingAction(enemy) : undefined;
    if (charged) {
      const label = `ため：${charged.name}${charged.target === 'allies' ? '（全体）' : ''}`;
      const ty = bodyY - radius - 12;
      const bg = scene.add.rectangle(cx, ty, Math.min(colW - 8, label.length * 12 + 16), 20, 0x7a2a10, 0.95).setRounded(8).setStrokeStyle(1, 0xff9a5a);
      root.add([bg, addText(scene, cx, ty, label, { size: 11, bold: true, color: '#ffd0a0' }).setOrigin(0.5)]);
    }

    // ボスの大きな絵では、名前と HP を絵の足もとに重ねる（名前は縁取りで読めるように）
    const nameY = bigArt ? BOSS_ART_BOTTOM - 36 : bodyY + radius + 16;
    const nameText = addText(scene, cx, nameY, enemy.name, { size: 13, align: 'center', color: alive ? COLORS.text : COLORS.dimText }).setOrigin(0.5);
    if (bigArt) nameText.setStroke('#0b1018', 4);
    root.add(nameText);
    const barW = g.withParts ? 220 : Math.min(110, colW - 16);
    const hpFrom = previousValue(`${enemy.uid}:hp`, enemy.hp);
    addBar(scene, root, cx - barW / 2, nameY + 18, barW, 8, enemy.hp / enemy.maxHp, enemy.hp / enemy.maxHp < 0.3 ? COLORS.hpLow : COLORS.hp, hpFrom / enemy.maxHp);
    const hpText = addText(scene, cx, nameY + 32, `${enemy.hp}/${enemy.maxHp}`, { size: 11, color: COLORS.subText }).setOrigin(0.5);
    if (bigArt) hpText.setStroke('#0b1018', 3);
    root.add(hpText);
    countText(scene, hpText, hpFrom, enemy.hp, (v) => `${v}/${enemy.maxHp}`);

    if (g.withParts) drawParts(scene, root, vm, h, enemy);
  });
}

/** ひびの線（部位の中心からの、ずらし。マスは画面の点）。ボスの絵の上に、ガラスが割れたように走る（段階89 の調整1） */
const CRACKS: [number, number][][] = [
  [[0, 0], [6, -9], [4, -18], [11, -27], [9, -36]],
  [[0, 0], [-9, -4], [-17, 1], [-26, -3]],
  [[0, 0], [8, 7], [15, 6], [22, 14], [30, 13]],
  [[0, 0], [-5, 9], [-12, 14], [-14, 24]],
  [[4, -18], [13, -16], [19, -21]],
  [[-17, 1], [-21, 9]],
];
/** 照準の色：ふだんは金、選んだ部位は赤、壊れた跡は灰 */
const RETICLE = { gold: 0xf2c45a, select: COLORS.select, broken: 0x8a8090 };

/** ひびの線を描く（stage 1 はひび、2 は割れかけ）。光る縁を下に重ね、割れかけは中心が赤く光る */
function drawCracks(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, stage: 1 | 2): void {
  const count = stage === 1 ? 2 : CRACKS.length;
  const scale = stage === 1 ? 0.65 : 1;
  const g = scene.add.graphics();
  const lines = CRACKS.slice(0, count).map((path) => path.map(([dx, dy]) => new Phaser.Math.Vector2(x + dx * scale, y + dy * scale)));
  if (stage === 2) g.fillStyle(0xff7a3a, 0.35).fillCircle(x, y, 9).fillStyle(0xffb070, 0.6).fillCircle(x, y, 4);
  g.lineStyle(stage === 1 ? 4 : 5, stage === 1 ? 0xffe0a0 : 0xff9a5a, 0.35);
  for (const pts of lines) g.strokePoints(pts, false);
  g.lineStyle(stage === 1 ? 1.4 : 2, 0xfff6e0, 0.95);
  for (const pts of lines) g.strokePoints(pts, false);
  root.add(g);
}

/** 部位の名前の札：照準の右上（side が left なら左上）へ細い線で引き出す */
function drawPartTag(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, text: string, color: number, side: 'left' | 'right'): void {
  const dir = side === 'left' ? -1 : 1;
  const label = addText(scene, 0, 0, text, { size: 11, bold: true, color: '#f3e2b8' });
  const w = label.width + 14;
  const ex = x + dir * 34;
  const ey = y - 30;
  // 札が画面の外に出ないように
  const left = Phaser.Math.Clamp(dir > 0 ? ex + 8 : ex - 8 - w, 4, GAME_WIDTH - 4 - w);
  const g = scene.add.graphics();
  g.lineStyle(1, color, 0.85).strokePoints([new Phaser.Math.Vector2(x + dir * 20, y - 14), new Phaser.Math.Vector2(ex, ey), new Phaser.Math.Vector2(ex + dir * 8, ey)], false);
  g.fillStyle(0x0a0e1c, 0.8).fillRoundedRect(left, ey - 10, w, 19, 3);
  g.lineStyle(0.8, color, 0.6).strokeRoundedRect(left, ey - 10, w, 19, 3);
  root.add(g);
  label.setPosition(left + w / 2, ey).setOrigin(0.5);
  root.add(label);
}

/** 時計の文字盤の照準（金の輪、点線の内輪、目盛り12本、中心の点）。狙える時は目盛りがゆっくり回り、輪が明るくなったり暗くなったりする */
function drawReticle(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, selected: boolean, live: boolean): void {
  const color = selected ? RETICLE.select : RETICLE.gold;
  const r = selected ? 16 : 19;
  const halo = scene.add.circle(x, y, 27, color, 0.1);
  const ring = scene.add.graphics();
  ring.fillStyle(0x080c18, 0.3).fillCircle(x, y, r);
  ring.lineStyle(1.6, color, 1).strokeCircle(x, y, r);
  // 点線の内輪
  ring.lineStyle(0.8, color, 0.55);
  for (let k = 0; k < 16; k++) {
    const a0 = (Math.PI * 2 * k) / 16;
    ring.beginPath().arc(x, y, r - 6, a0, a0 + Math.PI / 24).strokePath();
  }
  ring.fillStyle(color, 1).fillCircle(x, y, 2);
  // 目盛り（照準の中心で回すため、目盛りだけ別の絵にして、その中心に置く）
  const ticks = scene.add.graphics({ x, y });
  for (let k = 0; k < 12; k++) {
    const a = (Math.PI * 2 * k) / 12;
    const long = k % 3 === 0;
    const r1 = 19;
    const r2 = long ? 25 : 22.5;
    ticks.lineStyle(long ? 1.8 : 1, color, 1).lineBetween(r1 * Math.sin(a), -r1 * Math.cos(a), r2 * Math.sin(a), -r2 * Math.cos(a));
  }
  ticks.setAngle(selected ? 0 : 15);
  root.add([halo, ring, ticks]);
  // 選んだ部位：四隅に照準の角
  if (selected) {
    const corners = scene.add.graphics();
    corners.lineStyle(2, color, 1);
    for (const t of [Math.PI / 4, (Math.PI * 3) / 4, (Math.PI * 5) / 4, (Math.PI * 7) / 4]) {
      const cx = x + 29 * Math.cos(t);
      const cy = y + 29 * Math.sin(t);
      const ax = -5 * Math.cos(t);
      const ay = -5 * Math.sin(t);
      corners.strokePoints([new Phaser.Math.Vector2(cx + ax + 4 * Math.sin(t), cy + ay - 4 * Math.cos(t)), new Phaser.Math.Vector2(cx, cy), new Phaser.Math.Vector2(cx + ax - 4 * Math.sin(t), cy + ay + 4 * Math.cos(t))], false);
    }
    root.add(corners);
  }
  if (live) {
    // 画面を描き直すと消える絵なので、消える時に動きも止める
    const spin = scene.tweens.add({ targets: ticks, angle: ticks.angle + 360, duration: 12000, repeat: -1 });
    const pulse = scene.tweens.add({ targets: [halo, ring], alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ticks.once(Phaser.GameObjects.Events.DESTROY, () => spin.remove());
    ring.once(Phaser.GameObjects.Events.DESTROY, () => pulse.remove());
  }
}

/** 壊れた部位の跡：輪が砕けて暗い穴、欠けた破片、そこから砂がこぼれ続ける */
function drawBrokenPart(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number): void {
  const g = scene.add.graphics();
  g.fillStyle(0x10131c, 0.45).fillCircle(x, y, 23);
  g.fillStyle(0x080a12, 0.7).fillCircle(x, y, 17);
  g.fillStyle(0x05070c, 0.85).fillCircle(x, y, 11);
  // 砕けた輪（ところどころ欠けた弧）
  g.lineStyle(1.4, 0x7a7060, 1);
  for (const a0 of [20, 140, 250]) g.beginPath().arc(x, y, 19, Phaser.Math.DegToRad(a0 - 90), Phaser.Math.DegToRad(a0 - 20)).strokePath();
  // 欠けた破片
  g.fillStyle(0x3a3340, 1).lineStyle(0.6, 0x8a8090, 1);
  for (const [px, py] of [[-8, -6], [7, -9], [2, 8], [-10, 6]] as const) {
    const pts = [new Phaser.Math.Vector2(x + px, y + py), new Phaser.Math.Vector2(x + px + 4, y + py - 3), new Phaser.Math.Vector2(x + px + 7, y + py + 1), new Phaser.Math.Vector2(x + px + 2, y + py + 3)];
    g.fillPoints(pts, true).strokePoints(pts, true);
  }
  // こぼれた砂の山
  g.fillStyle(0xd8b46a, 0.5).fillEllipse(x, y + 62, 22, 6);
  root.add(g);
  // 落ち続ける砂の粒
  for (let k = 0; k < 10; k++) {
    const grain = scene.add.circle(x + ((k % 3) - 1) * 1.6, y + 14, 1.8 - (k % 3) * 0.3, 0xe0c080, 0.95);
    root.add(grain);
    const fall = scene.tweens.add({ targets: grain, y: y + 60, alpha: 0.15, duration: 1100, delay: k * 110, repeat: -1, ease: 'Quad.easeIn' });
    grain.once(Phaser.GameObjects.Events.DESTROY, () => fall.remove());
  }
}

/**
 * ボスの部位（段階89。段階89 の調整1で、時計の文字盤の照準に）：体の上のその部位の所に照準を出す。HP の数字とバーは出さず、
 * ひびはボスの絵の上に走る線で見せる。照準をタップすると、その部位を狙う。壊れた部位は、暗い穴と、こぼれ続ける砂の跡になる（狙えない）
 */
function drawParts(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers, enemy: EnemyUnit): void {
  const g = enemyGeometry(vm.state, 0);
  enemy.parts.forEach((part, i) => {
    const { x, y } = partSpot(enemy, i, g.cx);
    const stage = crackStage(part);
    const usable = stage < 3 && enemy.hp > 0;
    const targetable = usable && vm.interactive && vm.scope === 'enemy';
    const sel = vm.selectedTarget;
    const selected = sel?.kind === 'enemy' && sel.id === enemy.uid && sel.partId === part.id;
    const side = ENEMY_PART_SPOTS[enemy.defId]?.[part.id]?.[2] ?? 'right';
    if (stage === 3) {
      drawBrokenPart(scene, root, x, y);
      drawPartTag(scene, root, x, y, `${part.name}（破壊）`, RETICLE.broken, side);
    } else {
      if (stage > 0) drawCracks(scene, root, x, y, stage as 1 | 2);
      drawReticle(scene, root, x, y, selected, targetable && !selected);
      drawPartTag(scene, root, x, y, part.name, selected ? RETICLE.select : RETICLE.gold, side);
    }
    // 照準は少し大きくタップできる（指で押しやすく）
    const hit = scene.add.circle(x, y, Math.max(PART_SPOT_R + 8, MIN_TAP / 2), 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onTap: vm.interactive && usable ? () => h.tapEnemy(enemy.uid, part.id) : undefined,
      onLongPress: () => h.detail(`${enemy.name}の${part.name}`, partDetail(enemy, part)),
    });
  });
}

function drawMessage(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel): void {
  const { y, h: height } = LAYOUT.message;
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, height, COLORS.barBg, 0.8).setOrigin(0));
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
    const panel = scene.add.rectangle(x0, y + 2, w, height - 4, isActor ? COLORS.panelLight : alive ? COLORS.panel : 0x161d25).setRounded(8).setOrigin(0);
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
    const hpFrom = previousValue(`${ally.uid}:hp`, ally.hp);
    const mpFrom = previousValue(`${ally.uid}:mp`, ally.mp);
    addBar(scene, root, x0 + 6, y + 46, barW, 6, ally.hp / ally.maxHp, ally.hp / ally.maxHp < 0.3 ? COLORS.hpLow : COLORS.hp, hpFrom / ally.maxHp);
    // HP・MP は文字の札で出す（段階32b。ハートとしずくのアイコンより分かりやすい、と開発者の確認）
    const hpLabel = addText(scene, x0 + 6, y + 50, 'HP', { size: 10, bold: true, color: toCss(COLORS.hp) });
    root.add(hpLabel);
    const hpText = addText(scene, x0 + 10 + hpLabel.width, y + 50, `${ally.hp}/${ally.maxHp}`, { size: 10, color: COLORS.subText });
    root.add(hpText);
    countText(scene, hpText, hpFrom, ally.hp, (v) => `${v}/${ally.maxHp}`);
    addBar(scene, root, x0 + 6, y + 66, barW, 4, ally.mp / ally.maxMp, COLORS.mp, mpFrom / ally.maxMp);
    const mpText = addText(scene, x0 + w - 6, y + 50, `${ally.maxMp}`, { size: 10, color: COLORS.subText }).setOrigin(1, 0);
    root.add(addText(scene, x0 + w - 10 - mpText.width, y + 50, 'MP', { size: 10, bold: true, color: toCss(COLORS.mp) }).setOrigin(1, 0));
    mpText.setText(`${ally.mp}`);
    root.add(mpText);
    countText(scene, mpText, mpFrom, ally.mp, (v) => `${v}`);
    makePressable(panel, {
      onTap: vm.interactive ? () => h.tapAlly(ally.uid) : undefined,
      onLongPress: () => h.detail(ally.name, allyDetail(ally)),
    });
  });
}

// ④ 手札
const COMBO_STRIP_H = 26;

/**
 * 段階102a：新しい戦闘の画面（フィルム。段階101 で決めた組み合わせ案）。できるまでは `?debug=1&battleUi=film` の時だけ出し、いつもの画面は変えない。
 * 段階102d で、いつもの画面にする
 */
export const FILM_UI: boolean = (() => {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  return q.get('debug') === '1' && q.get('battleUi') === 'film';
})();
function handArea(): { y: number; h: number } {
  return FILM_UI ? FILM_LAYOUT.hand : LAYOUT.hand;
}
/** 手札の名前の字の大きさ（長い名前は1小さく） */
const CARD_NAME_SIZE = FILM_UI ? 14 : 12;

/** 手札の上の帯に出す、使えるコンボと、あと1枚でそろうコンボ */
function comboEntries(vm: ViewModel) {
  return vm.state.combos
    .map((c) => ({ combo: c, ...comboProgress(c, vm.pool) }))
    .filter((e) => e.have === e.need || (e.have > 0 && e.need - e.have === 1))
    .sort((a, b) => b.have / b.need - a.have / a.need)
    .slice(0, 3);
}

function drawHand(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = handArea();
  const s = vm.state;
  const hand = s.hand;
  root.add(addText(scene, SIDE_PADDING, y + 2, `手札 ${hand.length}　山札 ${s.deck.length}　捨て札 ${s.discard.length}`, { size: 10, color: COLORS.subText }));
  const supportText = s.supportUsed ? 'サポート：このラウンドは使用済み' : `サポート：あと${SUPPORT_PER_ROUND}枚使える`;
  const rule = addText(scene, GAME_WIDTH - SIDE_PADDING, y + 2, supportText, { size: 10, color: s.supportUsed ? COLORS.dimText : COLORS.subText }).setOrigin(1, 0);
  root.add(rule);
  makePressable(rule, { onLongPress: () => h.detail('手札のルール', HAND_RULE_TEXT) });
  // 新しい画面（段階102a）：そろいそうなコンボがない時は帯を出さず、その分だけ手札を高くする
  const strip = !FILM_UI || comboEntries(vm).length > 0;
  if (strip) drawComboStrip(scene, root, vm, h, y + 16);

  // 使えるコンボの材料になっているスナップ
  const comboUids = new Set(availableCombos(s, vm.pool).flatMap((c) => (comboCards(c, vm.pool) ?? []).map((x) => x.uid)));
  const poolUids = new Set(vm.pool.map((c) => c.uid));
  if (FILM_UI) {
    // 写真のカード（段階102b）：大きさは枚数で変えず、入りきらない時は重ねる。選んだカードは一番上に
    const top = y + 18 + (strip ? COMBO_STRIP_H : 0);
    const areaW = GAME_WIDTH - SIDE_PADDING * 2;
    const cardW = Math.floor((areaW - PHOTO_CARD_GAP * (HAND_SIZE - 1)) / HAND_SIZE);
    const cardH = Math.min(Math.round(cardW * PHOTO_CARD_TALL), height - (top - y) - 8);
    const xs = photoHandLayout(hand.length, areaW, cardW);
    const cy = top + (height - (top - y)) / 2;
    const isSelected = (c: CardInstance) => vm.selectedCardUid === c.uid || vm.comboCardUids.includes(c.uid);
    const order = hand.map((_, i) => i).sort((a, b) => Number(isSelected(hand[a])) - Number(isSelected(hand[b])));
    for (const i of order) {
      const card = hand[i];
      drawCard(scene, root, card, xs[i], cy, cardW, cardH, {
        selected: isSelected(card),
        inCombo: comboUids.has(card.uid),
        reservedBy: poolUids.has(card.uid) ? undefined : vm.reservedBy.get(card.uid),
        interactive: vm.interactive,
        actor: vm.actor,
        h,
      });
    }
    return;
  }
  const n = Math.max(5, hand.length);
  const gap = 4;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const top = y + 18 + (strip ? COMBO_STRIP_H : 0);
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
  const entries = comboEntries(vm);
  const cy = y + COMBO_STRIP_H / 2;
  const strip = scene.add.rectangle(GAME_WIDTH / 2, cy, GAME_WIDTH - SIDE_PADDING * 2, COMBO_STRIP_H, 0x0b1118).setRounded(8).setStrokeStyle(1, 0x2a3b4e);
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
    const chip = scene.add.rectangle(x, cy, w, COMBO_STRIP_H - 4, ready ? 0x5a4a10 : COLORS.panel).setRounded(8);
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

/** どの属性にもなるスナップ（ジョーカー。段階41）：一番効く属性を自動で選ぶ */
function isWild(def: ActionDef): boolean {
  return def.effects.some((e) => e.kind === 'damage' && !!e.bestOf);
}

/** スナップの帯の見た目（属性の名前・アイコン・色）。戦闘の手札とアルバムの画面で使う（段階41） */
export function snapLook(def: CardDef): { label: string; icon: IconKind; color: number } {
  const type = mainDamageType(def);
  const wild = isWild(def);
  const label = def.support ? 'サポート' : wild ? '万能' : type ? ELEMENT_LABEL[type] : def.effects.some((e) => e.kind === 'heal') ? '回復' : '補助';
  const icon: IconKind = def.support ? 'support' : wild ? 'star' : type ?? (label === '回復' ? 'heal' : 'support');
  return { label, icon, color: cardColor(def) };
}

function cardColor(def: ActionDef): number {
  if (isWild(def)) return COLORS.accent;
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

/** 選んだカードが浮き上がる高さ（段階32a 調整1） */
const CARD_LIFT = 6;

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
  if (FILM_UI) {
    drawPhotoCard(scene, root, card, x, cy, w, hgt, o);
    return;
  }
  const yy = o.selected ? cy - CARD_LIFT : cy;
  const def = card.card;
  const color = cardColor(def);
  const dim = !!o.reservedBy;
  // 選んだカードは少し浮き上がり、下に影が落ちる（段階32a 調整1）
  if (o.selected) root.add(scene.add.rectangle(x, cy + 4, w, hgt, 0x000000, 0.45).setRounded(8));
  const rect = scene.add.rectangle(x, yy, w, hgt, dim ? 0x141c25 : COLORS.panel).setRounded(8).setStrokeStyle(o.selected ? 4 : 2, o.selected ? COLORS.select : color);
  const band = scene.add.rectangle(x, yy - hgt / 2 + 12, w - 4, 20, color, dim ? 0.35 : 0.9).setRounded(6);
  // 下の端に属性の色をうっすら（カードの縁取り）
  const foot = scene.add.rectangle(x, yy + hgt / 2 - 4, w - 10, 3, color, dim ? 0.15 : 0.55).setRounded(1.5);
  const { label: typeLabel, icon: iconKind } = snapLook(def);
  root.add([rect, band, foot]);
  // 属性のアイコンと名前を並べて、帯の真ん中に置く（段階32a 調整2）
  const typeText = addText(scene, x, yy - hgt / 2 + 12, typeLabel, { size: def.support ? 10 : 11, bold: true, color: '#101820' }).setOrigin(0.5);
  const left = x - (12 + 2 + typeText.width) / 2;
  root.add(addIcon(scene, iconKind, left + 6, yy - hgt / 2 + 12, 12, 0x101820, dim ? 0.5 : 1));
  typeText.setX(left + 14 + typeText.width / 2);
  root.add(typeText);
  if (o.inCombo && !dim) {
    const bx = x + w / 2 - 8;
    const by = yy - hgt / 2 + 32;
    root.add(scene.add.circle(bx, by, 7, COLORS.accent));
    root.add(addText(scene, bx, by, 'C', { size: 10, bold: true, color: '#101820' }).setOrigin(0.5));
  }
  root.add(
    // 長い名前は言葉の切れ目で2行に分ける（段階32b。data の CARD_NAME_LINES）
    CARD_NAME_LINES[def.id]
      ? addText(scene, x, yy - 6, CARD_NAME_LINES[def.id] ?? '', { size: CARD_NAME_SIZE, bold: true, align: 'center', color: dim ? COLORS.dimText : COLORS.text }).setOrigin(0.5).setLineSpacing(2)
      : addText(scene, x, yy - 6, def.name, { size: def.name.length > 5 ? CARD_NAME_SIZE - 1 : CARD_NAME_SIZE, bold: true, align: 'center', wrap: w - 4, color: dim ? COLORS.dimText : COLORS.text }).setOrigin(0.5),
  );
  if (o.reservedBy) {
    root.add(addText(scene, x, yy + hgt / 2 - 18, `${o.reservedBy}が使う`, { size: 10, bold: true, color: COLORS.accentText, align: 'center', wrap: w - 2 }).setOrigin(0.5));
  } else if (def.support) {
    // 新しい画面（段階102a）では、意味の分かる言葉に（計画の途中で、その場で使う札）
    root.add(addText(scene, x, yy + hgt / 2 - 18, FILM_UI ? 'その場で使う' : '行動枠なし', { size: 10, color: COLORS.subText }).setOrigin(0.5));
  } else {
    root.add(addText(scene, x, yy + hgt / 2 - 24, weightLabel(def.weight), { size: 11, color: COLORS.subText }).setOrigin(0.5));
    drawWeightGauge(scene, root, x, yy + hgt / 2 - 10, def.weight);
  }
  makePressable(rect, cardHandlers(card, o));
}

/** 手札のカードを押した時（タップで選ぶ、長押しで説明） */
function cardHandlers(card: CardInstance, o: CardOptions): { onTap?: () => void; onLongPress: () => void } {
  const def = card.card;
  return {
    onTap: o.interactive ? () => o.h.tapCard(card.uid) : undefined,
    onLongPress: () =>
      o.h.detail(
        def.name,
        def.support
          ? `サポートスナップ（MP不要・行動枠を使わない）\n${supportText(def)}\n\n計画の途中でその場で使う。1ラウンドにチーム全体で${SUPPORT_PER_ROUND}枚まで。`
          : `スナップ（MP不要）\n${describeAction(def)}\n\n${weightHelp(def.weight, o.actor)}`,
      ),
  };
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
  const { y, h: height } = handArea();
  root.add(scene.add.rectangle(SIDE_PADDING, y, GAME_WIDTH - SIDE_PADDING * 2, height, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(1, COLORS.border));
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
  const { y } = handArea();
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
  const { y } = handArea();
  const left = SIDE_PADDING + 8;
  const width = GAME_WIDTH - SIDE_PADDING * 2 - 16;
  const gap = 5;
  // 1段目：通常攻撃・防御（追加行動の時は「見送る」も）。長押しで説明
  const basics: { kind: 'attack' | 'guard' | 'decline'; label: string; title: string; detail: string }[] = [vm.actor ? basicAttackFor(vm.actor) : BASIC_ATTACK, GUARD].map((def) =>
    def.id === 'guard'
      ? { kind: 'guard' as const, label: '防御\n受けるダメージ半減', title: '防御', detail: 'このラウンドの間、受けるダメージ半減。行動の速さに関係なく、ラウンドの最初に効く。ラウンドの終わりに解ける。' }
      : { kind: 'attack' as const, label: `${def.name}\n${weightLabel(def.weight)}`, title: def.name, detail: `${describeAction(def)}\n\n${weightHelp(def.weight, vm.actor)}` },
  );
  if (vm.state.phase === 'extra') basics.push({ kind: 'decline', label: '追加行動を\n見送る', title: '追加行動を見送る', detail: '追加行動をしないで、ラウンドの残りを続ける。' });
  const bw = (width - gap * (basics.length - 1)) / basics.length;
  const rowH = 44;
  basics.forEach((b, i) => {
    addButton(scene, root, left + bw / 2 + i * (bw + gap), y + 24 + rowH / 2, bw, rowH, b.label, { onTap: () => h.tapBasic(b.kind), onLongPress: () => h.detail(b.title, b.detail) }, { enabled: vm.interactive, size: 12 });
  });
  // 2段目：ポーチ（段階51）。残りの数と、この戦闘で使える残りの回数
  const top = y + 24 + rowH + 8;
  const pouch = vm.state.pouch;
  const except = vm.actor && vm.state.phase === 'plan' ? [vm.actor.uid, ...(planOf(vm.state, vm.actor.uid)?.actorIds ?? [])] : [];
  const uses = pouch.length > 0 ? pouchLeft(vm.state, pouch[0].item.id, except).uses : vm.state.pouchUsesLeft;
  root.add(addText(scene, left, top, pouch.length > 0 ? `ポーチ（この戦闘で、あと${uses}回使える）` : 'ポーチは空（宝箱や勝利で手に入る）', { size: 11, color: COLORS.subText }));
  if (pouch.length === 0) return;
  const pw = (width - gap * 2) / 3;
  pouch.forEach((p, i) => {
    const left2 = pouchLeft(vm.state, p.item.id, except);
    const selected = vm.selectedItemId === p.item.id;
    addButton(
      scene,
      root,
      left + pw / 2 + i * (pw + gap),
      top + 20 + rowH / 2,
      pw,
      rowH,
      `${p.item.name}\n残り${left2.count}`,
      { onTap: () => h.tapItem(p.item.id), onLongPress: () => h.detail(p.item.name, `${describeAction(p.item)}\n\n手番を1つ使う。1つの戦闘で使えるのは${vm.state.pouchUsesLeft + pouch.reduce((n, x) => n + x.used, 0)}回まで。倒れた仲間には使えない。`) },
      { enabled: vm.interactive && left2.count > 0 && left2.uses > 0, stroke: selected ? COLORS.select : COLORS.border, strokeWidth: selected ? 3 : 1, size: 11 },
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
  const { y } = handArea();
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
  const all: { kind: 'skills' | 'baton' | 'link' | 'other'; label: string; enabled: boolean; lit?: boolean; active: boolean }[] = [
    { kind: 'skills', label: '魔法・\nスキル', enabled: canAct, active: vm.panel === 'skills' },
    { kind: 'baton', label: 'バトン\nタッチ', enabled: batonOk, lit: batonOk, active: vm.batonMode },
    { kind: 'link', label: linkLabel, enabled: linkOk, lit: linkOk, active: !!vm.selectedLinkId },
    { kind: 'other', label: 'その他', enabled: canAct, active: vm.panel === 'other' },
  ];
  const items = all;
  const n = items.length;
  const gap = 6;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
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
    const x = SIDE_PADDING + items.findIndex((it) => it.kind === 'link') * (w + gap) + 6;
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
    '必ずラウンドの最初に動く（防御の次）。体勢が崩れた敵（ダウン中か、立ち上がったばかりでまだ動いていない敵）には大きく効く。',
    '狙い目：敵をダウンさせた次のラウンドに連携技を選ぶと、敵が動く前に、崩れた体勢へ当たる。',
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
    // 左から オート（雑魚戦だけ）・早送り・実行（段階29）
    const left = vm.state.allies.filter((a) => a.hp > 0 && !vm.planLabels[a.uid]).length;
    const gap = 6;
    const autoW = vm.autoAvailable ? 76 : 0;
    const speedW = 56;
    const execW = GAME_WIDTH - SIDE_PADDING * 2 - speedW - gap - (autoW ? autoW + gap : 0);
    let x = SIDE_PADDING;
    const cy = y + height / 2;
    if (autoW) {
      addButton(scene, root, x + autoW / 2, cy, autoW, height - 12, 'オート', { onTap: () => h.openAuto() }, { enabled: vm.interactive, size: 15, bold: true });
      x += autoW + gap;
    }
    addButton(scene, root, x + speedW / 2, cy, speedW, height - 12, `×${vm.speed}`, { onTap: () => h.toggleSpeed() }, { enabled: vm.interactive, size: 15, bold: true });
    x += speedW + gap;
    addButton(
      scene,
      root,
      x + execW / 2,
      cy,
      execW,
      height - 12,
      vm.planComplete ? '実行' : `実行（あと${left}人）`,
      { onTap: () => h.execute() },
      { enabled: vm.planComplete && vm.interactive, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2, size: 17, bold: true },
    );
  } else if (vm.footer === 'auto') {
    const w = GAME_WIDTH - SIDE_PADDING * 2;
    root.add(scene.add.rectangle(GAME_WIDTH / 2, y + height / 2, w, height - 12, 0x1d3b5a).setRounded(8).setStrokeStyle(2, 0x7fc4ff));
    root.add(addText(scene, GAME_WIDTH / 2, y + height / 2, `オート（${vm.autoName}）×${vm.speed}\nどこかをタップすると手動に戻る`, { size: 14, bold: true, align: 'center' }).setOrigin(0.5));
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
  else if (e.standUpGuard) lines.push('体勢が崩れている：立ち上がったばかりで、まだ動いていない（ダウンはしないが、連携技が大きく効く）');
  if (e.enraged) lines.push('怒っている：ためを崩されたので、立ち上がった次の行動ではためずに攻撃する（その攻撃まではダウンしない）');
  return lines.join('\n');
}

function partDetail(e: EnemyUnit, p: PartState): string {
  const sealed = e.actions.filter((a) => a.requiresPart === p.id).map((a) => `「${a.name}」`);
  const lines = [
    ['無傷', 'ひびが入っている', '今にも割れそう', '壊れた'][crackStage(p)],
    'この印をタップして攻撃すると、部位に全部、本体に半分のダメージ。壊すと、ぬしがよろける（ダウン）',
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

// ---- 段階102a：新しい戦闘の画面（フィルム）。FILM_UI の時だけ ----

/** 新しい画面の差し色（REC の赤） */
const FILM_RED = 0xff2d55;
/** 斜めの形のずれ（上の辺を右へずらす幅） */
const SKEW = 8;

/** 斜めの箱（平行四辺形）。左上が (x, y) */
function skewBox(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill: number, alpha = 1, stroke?: { width: number; color: number; alpha?: number }): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const pts = [new Phaser.Math.Vector2(x + SKEW, y), new Phaser.Math.Vector2(x + w, y), new Phaser.Math.Vector2(x + w - SKEW, y + h), new Phaser.Math.Vector2(x, y + h)];
  g.fillStyle(fill, alpha).fillPoints(pts, true);
  if (stroke) g.lineStyle(stroke.width, stroke.color, stroke.alpha ?? 1).strokePoints(pts, true);
  return g;
}

/** 斜めの字（太字の斜体。差し色の影） */
function slantText(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = '#ffffff', shadow = '#ff2d55'): Phaser.GameObjects.Text {
  const t = addText(scene, x, y, text, { size, bold: true, color });
  t.setFontStyle('bold italic');
  if (shadow) t.setShadow(2, 2, shadow, 0, false, true);
  return t;
}

/** 斜めのボタン（新しい画面の下の1段・上の帯） */
function filmButton(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  handlers: { onTap?: () => void; onLongPress?: () => void },
  o: { fill?: number; textColor?: string; enabled?: boolean; size?: number; active?: boolean } = {},
): void {
  const enabled = o.enabled ?? true;
  root.add(skewBox(scene, x, y, w, h, o.fill ?? 0x222222, enabled ? 1 : 0.45, { width: o.active ? 3 : 2, color: o.active ? COLORS.select : 0xffffff, alpha: enabled ? 1 : 0.35 }));
  const t = addText(scene, x + w / 2, y + h / 2, label, { size: o.size ?? 13, bold: true, align: 'center', color: o.textColor ?? COLORS.text }).setOrigin(0.5);
  t.setFontStyle('bold italic');
  if (!enabled) t.setAlpha(0.45);
  root.add(t);
  const hit = scene.add.rectangle(x + w / 2, y + h / 2, w, Math.max(h, MIN_TAP), 0xffffff, 0.001);
  root.add(hit);
  makePressable(hit, { onTap: enabled ? handlers.onTap : undefined, onLongPress: handlers.onLongPress });
}

/** 新しい画面を描く（drawBattle から） */
function drawFilmBattle(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  drawStage(scene, root);
  drawEnemies(scene, root, vm, h);
  drawFilmHeader(scene, root, vm, h);
  drawFilmMessage(scene, root, vm);
  drawFilmStrip(scene, root, vm, h);
  drawFilmTabs(scene, root, vm, h);
  if (vm.panel === 'skills') drawSkillPanel(scene, root, vm, h);
  else if (vm.panel === 'other') drawOtherPanel(scene, root, vm, h);
  else if (vm.panel === 'discard') drawDiscardPanel(scene, root, vm, h);
  else if (vm.panel === 'search') drawSearchPanel(scene, root, vm, h);
  else drawHand(scene, root, vm, h);
  drawFilmButtons(scene, root, vm, h);
}

/** 上の帯：● REC と ROUND、右にオート（雑魚戦だけ）と早送り */
function drawFilmHeader(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y } = FILM_LAYOUT.header;
  root.add(scene.add.circle(SIDE_PADDING + 6, y + 16, 5, FILM_RED));
  root.add(addText(scene, SIDE_PADDING + 15, y + 8, 'REC', { size: 12, bold: true, color: toCss(FILM_RED) }));
  root.add(slantText(scene, SIDE_PADDING + 52, y + 9, 'ROUND', 11, '#ffffff', ''));
  root.add(slantText(scene, SIDE_PADDING + 98, y + 1, String(vm.state.round).padStart(2, '0'), 24));
  if (vm.footer !== 'execute') return;
  const bw = 54;
  const bh = 30;
  let x = GAME_WIDTH - SIDE_PADDING - bw;
  filmButton(scene, root, x, y + 7, bw, bh, `×${vm.speed}`, { onTap: () => h.toggleSpeed() }, { enabled: vm.interactive, size: 14 });
  if (vm.autoAvailable) {
    x -= 74 + 6;
    filmButton(scene, root, x, y + 7, 74, bh, 'オート', { onTap: () => h.openAuto() }, { enabled: vm.interactive, size: 14 });
  }
}

/** 状況とプレビューの文字：斜めの黒い帯 */
function drawFilmMessage(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel): void {
  const { y, h: height } = FILM_LAYOUT.message;
  root.add(skewBox(scene, 6, y, GAME_WIDTH - 12, height, 0x000000, 0.85, { width: 1, color: 0xffffff, alpha: 0.6 }));
  root.add(addText(scene, GAME_WIDTH / 2, y + height / 2, vm.message, { size: vm.message.length > 36 ? 10 : 12, bold: true, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5));
}

/** 行動順のコマの長押しの説明（前の行動順の顔の列と同じ） */
function orderDetail(s: BattleState, entry: OrderEntry, i: number): { title: string; body: string } {
  const units = entry.ids.map((id) => findUnit(s, id)).filter((u): u is NonNullable<typeof u> => !!u);
  return {
    title: units.map((u) => u.name).join('と'),
    body: `このラウンドの${i + 1}番目${entry.tentative ? '（行動がまだ決まっていないので仮の位置）' : ''}\n${units.map(unitSummary).join('\n')}\n\n行動の速さ = 速さ ÷ 重さ。速い順に動く。防御は最初、クイックステップを使った仲間はその次。`,
  };
}

/** フィルム：行動順をコマで見せる。今の番のコマは赤い枠で顔を大きく「▶ 選んでいる」 */
function drawFilmStrip(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = FILM_LAYOUT.film;
  const s = vm.state;
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, height, 0x111111).setOrigin(0));
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, 2, 0xffffff).setOrigin(0));
  root.add(scene.add.rectangle(0, y + height - 2, GAME_WIDTH, 2, 0xffffff).setOrigin(0));
  // フィルムの穴
  for (let hx = 6; hx < GAME_WIDTH; hx += 22) {
    root.add(scene.add.rectangle(hx, y + 5, 9, 7, 0xe8e0d0, 0.85).setOrigin(0));
    root.add(scene.add.rectangle(hx, y + height - 12, 9, 7, 0xe8e0d0, 0.85).setOrigin(0));
  }
  const n = Math.max(1, vm.order.length);
  const gap = 6;
  const x0 = SIDE_PADDING;
  const fy = y + 16;
  const fh = height - 32;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const executing = s.phase === 'execute' || s.phase === 'extra';
  vm.order.forEach((entry, i) => {
    const units = entry.ids.map((id) => findUnit(s, id)).filter((u): u is NonNullable<typeof u> => !!u);
    if (units.length === 0) return;
    const unit = units[0];
    const fx = x0 + i * (w + gap);
    const isActor = !executing && !!vm.actor && entry.ids.includes(vm.actor.uid);
    const isCurrent = executing && i === 0;
    const enemy = unit.side === 'enemy';
    const fill = enemy ? 0x3a0812 : 0x2b2420;
    const frame = skewBox(scene, fx, fy, w, fh, fill, entry.tentative && !isActor ? 0.55 : 1,
      isActor ? { width: 3, color: FILM_RED } : isCurrent ? { width: 3, color: 0xffd700 } : { width: 1, color: 0x000000 });
    root.add(frame);
    const cx = fx + w / 2;
    // 決めた行動がスナップ（コンボ）なら、その札の写真を薄く入れる（段階102b）
    const planCard = !enemy && !isActor ? vm.planCards[unit.uid] : undefined;
    const art = planCard ? CARD_ART[planCard as keyof typeof CARD_ART] : undefined;
    if (art && hasImage(scene, art.asset)) {
      const pts = skewPoints(fx, fy, w, fh, SKEW);
      root.add(photoImage(scene, art.asset, fx, fy, w, fh, art, pts).setAlpha(isCurrent ? 0.9 : 0.6));
      if (isCurrent) root.add(skewBox(scene, fx, fy, w, fh, 0x000000, 0, { width: 3, color: 0xffd700 }));
    }
    // 顔：今の番は大きく、ほかは右上に小さく
    const faceId = !enemy && units.length === 1 ? ALLY_FACE[unit.defId] : undefined;
    if (faceId && hasImage(scene, faceId)) {
      const r = isActor ? Math.min(w, fh) / 2 - 8 : 11;
      const fcx = isActor ? cx : fx + w - 15;
      const fcy = isActor ? fy + fh / 2 - 6 : fy + 14;
      root.add(faceImage(scene, faceId, fcx, fcy, r, FACE_CROPS[unit.defId]).setAlpha(entry.tentative && !isActor ? 0.6 : 1));
      root.add(scene.add.circle(fcx, fcy, r).setStrokeStyle(2, 0xffffff));
    }
    root.add(slantText(scene, fx + SKEW + 2, fy + 1, String(i + 1).padStart(2, '0'), 14));
    // 下の札：決めた行動。今の番は「▶ 選んでいる」
    const charging = enemy && !!(unit as EnemyUnit).charging;
    const plan = !enemy ? vm.planLabels[unit.uid] : undefined;
    const tag = entry.guard ? '防御' : entry.precede ? '先制' : '';
    const label = isActor
      ? '▶ 選んでいる'
      : enemy
        ? `${unit.name}${charging ? ' ⚡大技' : ''}`
        : plan
          ? `${tag ? `${tag} ` : ''}${plan}`
          : entry.tentative
            ? `${unit.name}：未定`
            : unit.name;
    const maxChars = Math.max(3, Math.floor((w - 6) / 10));
    const shown = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
    root.add(skewBox(scene, fx, fy + fh - 18, w, 18, isActor ? FILM_RED : 0x000000, isActor ? 1 : 0.8));
    root.add(addText(scene, cx, fy + fh - 9, shown, { size: 10, bold: true, align: 'center' }).setOrigin(0.5));
    const hit = scene.add.rectangle(cx, fy + fh / 2, w, fh, 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onLongPress: () => {
        const d = orderDetail(s, entry, i);
        h.detail(d.title, d.body);
      },
    });
  });
}

/** 仲間のタブ（斜め）：HP・MP と顔。今の番は仲間の色の縁、ねらえる時は金の縁 */
function drawFilmTabs(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = FILM_LAYOUT.tabs;
  const s = vm.state;
  const n = s.allies.length;
  const gap = 6;
  const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
  const batonIds = new Set(batonTargets(s).map((a) => a.uid));
  s.allies.forEach((ally, i) => {
    const x = SIDE_PADDING + i * (w + gap);
    const alive = ally.hp > 0;
    const color = ALLY_COLOR[ally.defId] ?? COLORS.ally;
    const isActor = vm.actor?.uid === ally.uid;
    const targetable = vm.interactive && ((vm.scope === 'ally' && alive) || (vm.batonMode && batonIds.has(ally.uid)));
    const selected = vm.selectedTarget?.kind === 'ally' && vm.selectedTarget.id === ally.uid;
    const stroke = selected ? { width: 3, color: COLORS.select } : targetable ? { width: 2, color: COLORS.accent } : isActor ? { width: 2, color } : { width: 1, color: 0xffffff, alpha: 0.35 };
    root.add(skewBox(scene, x, y, w, height, 0x000000, alive ? 0.85 : 0.6, stroke));
    root.add(scene.add.rectangle(x, y + height - 4, w - SKEW, 4, color, alive ? 1 : 0.4).setOrigin(0));
    // 顔は右に薄く
    const faceId = ALLY_FACE[ally.defId];
    if (faceId && hasImage(scene, faceId)) root.add(faceImage(scene, faceId, x + w - 24, y + height / 2 - 2, 20, FACE_CROPS[ally.defId]).setAlpha(alive ? (isActor ? 0.9 : 0.5) : 0.2));
    root.add(addText(scene, x + SKEW + 4, y + 5, ally.name, { size: 12, bold: true, color: alive ? toCss(color) : COLORS.dimText }));
    const status = [s.phase === 'extra' && isActor ? (s.extra?.boost ? 'バトン' : '追加') : '', s.precedeIds.includes(ally.uid) ? '先制' : '', ally.guarding ? '防御' : '', alive ? '' : '不能']
      .filter(Boolean)
      .join(' ');
    if (status) root.add(addText(scene, x + w - 50, y + 5, status, { size: 9, bold: true, color: COLORS.accentText }).setOrigin(1, 0));
    const barW = w - 62;
    const hpFrom = previousValue(`${ally.uid}:hp`, ally.hp);
    const mpFrom = previousValue(`${ally.uid}:mp`, ally.mp);
    addBar(scene, root, x + SKEW + 4, y + 24, barW, 5, ally.hp / ally.maxHp, ally.hp / ally.maxHp < 0.3 ? COLORS.hpLow : COLORS.hp, hpFrom / ally.maxHp);
    const hpText = addText(scene, x + SKEW + 4, y + 31, `${ally.hp}`, { size: 10, bold: true, color: COLORS.text });
    root.add(hpText);
    countText(scene, hpText, hpFrom, ally.hp, (v) => `${v}`);
    const mpText = addText(scene, x + SKEW + 4 + barW, y + 31, `MP ${ally.mp}`, { size: 10, color: toCss(COLORS.mp) }).setOrigin(1, 0);
    root.add(mpText);
    countText(scene, mpText, mpFrom, ally.mp, (v) => `MP ${v}`);
    const hit = scene.add.rectangle(x + w / 2, y + height / 2, w, height, 0xffffff, 0.001);
    root.add(hit);
    makePressable(hit, {
      onTap: vm.interactive ? () => h.tapAlly(ally.uid) : undefined,
      onLongPress: () => h.detail(ally.name, allyDetail(ally)),
    });
  });
}

/** 下の1段のボタン：魔法・スキル／その他／連携技／実行。選んでいる最中は キャンセル・決定、追加行動では バトンタッチ・見送る */
function drawFilmButtons(scene: Phaser.Scene, root: Phaser.GameObjects.Container, vm: ViewModel, h: ViewHandlers): void {
  const { y, h: height } = FILM_LAYOUT.bottom;
  const s = vm.state;
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, height, 0x000000).setOrigin(0));
  root.add(scene.add.rectangle(0, y, GAME_WIDTH, 3, 0xffffff).setOrigin(0));
  if (vm.footer === 'auto') {
    root.add(addText(scene, GAME_WIDTH / 2, y + height / 2, `オート（${vm.autoName}）×${vm.speed}\nどこかをタップすると手動に戻る`, { size: 14, bold: true, align: 'center' }).setOrigin(0.5));
    return;
  }
  const canAct = !!vm.actor && vm.interactive && !s.searchChoice;
  const gap = 6;
  const by = y + 10;
  const bh = height - 20;
  const ws = [1, 1, 1, 1.3];
  const total = ws.reduce((a, b) => a + b, 0);
  const unit = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (ws.length - 1)) / total;
  const xs: number[] = [];
  let x = SIDE_PADDING;
  for (const k of ws) {
    xs.push(x);
    x += k * unit + gap;
  }
  const wOf = (i: number) => ws[i] * unit;
  filmButton(scene, root, xs[0], by, wOf(0), bh, '魔法・スキル', { onTap: () => h.tapCommand('skills') }, { enabled: canAct, active: vm.panel === 'skills', size: 11 });
  filmButton(scene, root, xs[1], by, wOf(1), bh, 'その他', { onTap: () => h.tapCommand('other') }, { enabled: canAct, active: vm.panel === 'other' });
  if (vm.footer === 'select') {
    filmButton(scene, root, xs[2], by, wOf(2), bh, 'キャンセル', { onTap: () => h.cancel() }, { size: 12 });
    filmButton(scene, root, xs[3], by, wOf(3), bh, '決定', { onTap: () => h.confirm() }, { enabled: vm.canConfirm, fill: 0x2f6b3f, size: 16 });
    return;
  }
  if (s.phase === 'extra') {
    const batonOk = canAct && batonTargets(s).length > 0;
    filmButton(scene, root, xs[2], by, wOf(2), bh, 'バトン\nタッチ', { onTap: () => h.tapCommand('baton') }, { enabled: batonOk, fill: batonOk ? 0x5a4a10 : 0x222222, active: vm.batonMode, size: 12 });
    filmButton(scene, root, xs[3], by, wOf(3), bh, '見送る', { onTap: () => h.tapBasic('decline') }, { enabled: canAct });
    return;
  }
  // 連携技：つながりゲージが満タンで、今の仲間が組める時だけ光る（長押しで説明）
  const mine = vm.actor ? actorLinks(s, vm.actor.uid) : [];
  const link = mine.find((l) => l.id === vm.selectedLinkId) ?? mine[0] ?? s.links[0];
  const ready = linkReady(s);
  const linkOk = canAct && s.phase === 'plan' && ready && mine.length > 0;
  const pct = Math.round((s.linkGauge / LINK_GAUGE_MAX) * 100);
  const linkLabel = s.links.length === 0 ? '連携技' : linkOk && link ? `${link.name}${mine.length > 1 ? ' ⇄' : ''}` : ready ? '連携技\n準備OK' : `連携技\n${pct}%`;
  filmButton(scene, root, xs[2], by, wOf(2), bh, linkLabel, { onTap: () => h.tapCommand('link'), onLongPress: link ? () => h.detail(`連携技：${link.name}`, linkDetail(s, link)) : undefined }, {
    enabled: linkOk,
    fill: linkOk ? 0xffd700 : 0x222222,
    textColor: linkOk ? '#000000' : COLORS.text,
    active: !!vm.selectedLinkId,
    size: 12,
  });
  if (s.links.length > 0 && !linkOk && pct > 0) root.add(scene.add.rectangle(xs[2] + 4, by + bh - 5, (wOf(2) - SKEW - 8) * (pct / 100), 3, ready ? COLORS.accent : 0xff9a5a).setOrigin(0));
  if (vm.footer === 'execute') {
    const left = s.allies.filter((a) => a.hp > 0 && !vm.planLabels[a.uid]).length;
    filmButton(scene, root, xs[3], by, wOf(3), bh, vm.planComplete ? '● 実行' : `実行（あと${left}人）`, { onTap: () => h.execute() }, {
      enabled: vm.planComplete && vm.interactive,
      fill: FILM_RED,
      size: vm.planComplete ? 17 : 12,
    });
  } else filmButton(scene, root, xs[3], by, wOf(3), bh, '再生中', {}, { enabled: false });
}

/** 平行四辺形の4つの角（上の辺を右へ skew だけずらす）。左上が (x, y) */
function skewPoints(x: number, y: number, w: number, h: number, skew: number): Phaser.Math.Vector2[] {
  return [new Phaser.Math.Vector2(x + skew, y), new Phaser.Math.Vector2(x + w, y), new Phaser.Math.Vector2(x + w - skew, y + h), new Phaser.Math.Vector2(x, y + h)];
}

/**
 * 写真（段階102b）：台帳の画像を (x, y, w, h) の箱いっぱいに切り抜いて置き、points の形で切る。
 * focus は切り抜く中心（絵の幅・高さに対する割合）
 */
function photoImage(scene: Phaser.Scene, id: string, x: number, y: number, w: number, h: number, focus: { x: number; y: number }, points: Phaser.Math.Vector2[]): Phaser.GameObjects.Image {
  const src = scene.textures.get(id).getSourceImage();
  const scale = Math.max(w / src.width, h / src.height);
  const cw = w / scale;
  const ch = h / scale;
  const sx = Phaser.Math.Clamp(focus.x * src.width - cw / 2, 0, src.width - cw);
  const sy = Phaser.Math.Clamp(focus.y * src.height - ch / 2, 0, src.height - ch);
  const img = scene.add.image(x - sx * scale, y - sy * scale, id).setOrigin(0).setScale(scale).setCrop(sx, sy, cw, ch);
  const shape = scene.make.graphics({}, false).fillStyle(0xffffff).fillPoints(points, true);
  img.setMask(shape.createGeometryMask());
  img.once(Phaser.GameObjects.Events.DESTROY, () => shape.destroy());
  return img;
}

/** 写真のカード（段階102b）の高さは幅の何倍か（インスタント写真に近い形）。幅は、ふだんの手札（HAND_SIZE 枚）が重ならずに並ぶ幅 */
const PHOTO_CARD_TALL = 1.6;
const PHOTO_CARD_GAP = 6;

/**
 * 新しい画面の手札の並び（段階102b）：カードの大きさは枚数で変えず、入りきらない時は少しずつ重ねる。
 * 左から順に描き、選んだカードは一番上に重ねる
 */
export function photoHandLayout(n: number, areaW: number, cardW: number): number[] {
  if (n <= 0) return [];
  const full = n * cardW + (n - 1) * PHOTO_CARD_GAP;
  const step = full <= areaW ? cardW + PHOTO_CARD_GAP : (areaW - cardW) / Math.max(1, n - 1);
  const used = cardW + step * (n - 1);
  const x0 = (GAME_WIDTH - used) / 2 + cardW / 2;
  return Array.from({ length: n }, (_, i) => x0 + i * step);
}

/**
 * 写真のカード（段階102b。新しい画面の手札）：白い枠・太い黒の縁・属性の色の影。写真らしく少し傾ける。
 * 上に写真、左上に属性の札、下の白い所に名前と重さ
 */
function drawPhotoCard(
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
  // カードごとに決まった小さな傾き（選んだカードはまっすぐにして浮かせる）
  const angle = o.selected ? 0 : (((card.uid * 37) % 7) - 3) * 0.5;
  const c = scene.add.container(x, o.selected ? cy - CARD_LIFT : cy).setAngle(angle);
  root.add(c);
  const L = -w / 2;
  const T = -hgt / 2;
  c.add(scene.add.rectangle(4, 4, w, hgt, o.selected ? FILM_RED : color, dim ? 0.3 : 1));
  c.add(scene.add.rectangle(0, 0, w, hgt, dim ? 0x8c8c8c : 0xffffff).setStrokeStyle(3, o.selected ? FILM_RED : 0x000000));
  // 写真
  const inset = 6;
  const pw = w - inset * 2;
  const ph = Math.round(hgt * 0.43);
  const art = CARD_ART[def.id as keyof typeof CARD_ART];
  if (art && hasImage(scene, art.asset)) {
    const img = photoCrop(scene, art.asset, L + inset, T + inset, pw, ph, art);
    if (dim) img.setTint(0x777777).setAlpha(0.6);
    c.add(img);
  } else {
    c.add(scene.add.rectangle(L + inset, T + inset, pw, ph, color, dim ? 0.3 : 0.8).setOrigin(0));
  }
  c.add(scene.add.rectangle(L + inset, T + inset, pw, ph).setOrigin(0).setStrokeStyle(1, 0x000000, 0.5));
  // 属性の札（写真の左上）
  const { label: typeLabel, icon: iconKind } = snapLook(def);
  const tag = addText(scene, 0, 0, typeLabel, { size: 9, bold: true, color: '#ffffff' });
  const tagW = tag.width + 20;
  c.add(scene.add.rectangle(L + inset, T + inset, tagW, 15, color, dim ? 0.5 : 1).setOrigin(0));
  c.add(addIcon(scene, iconKind, L + inset + 8, T + inset + 7.5, 10, 0xffffff, dim ? 0.5 : 1));
  tag.setPosition(L + inset + 15, T + inset + 7.5).setOrigin(0, 0.5);
  c.add(tag);
  if (o.inCombo && !dim) {
    const bx = L + inset + pw - 9;
    const by = T + inset + 9;
    c.add(scene.add.circle(bx, by, 8, COLORS.accent).setStrokeStyle(2, 0x000000));
    c.add(addText(scene, bx, by, 'C', { size: 10, bold: true, color: '#101820' }).setOrigin(0.5));
  }
  // 名前（黒の太字）
  const footY = hgt / 2 - 13;
  const nameY = (T + inset + ph + footY - 8) / 2;
  const nameColor = dim ? '#444444' : '#101010';
  const lines = CARD_NAME_LINES[def.id];
  c.add(
    lines
      ? addText(scene, 0, nameY, lines, { size: CARD_NAME_SIZE, bold: true, align: 'center', color: nameColor }).setOrigin(0.5).setLineSpacing(1)
      : addText(scene, 0, nameY, def.name, { size: def.name.length > 5 ? CARD_NAME_SIZE - 1 : CARD_NAME_SIZE, bold: true, align: 'center', wrap: w - 8, color: nameColor }).setOrigin(0.5),
  );
  // 下：使う人・その場で使う・重さ
  if (o.reservedBy) {
    c.add(scene.add.rectangle(0, footY, w - 8, 18, 0x000000, 0.85));
    c.add(addText(scene, 0, footY, `${o.reservedBy}が使う`, { size: 10, bold: true, color: COLORS.accentText, align: 'center' }).setOrigin(0.5));
  } else if (def.support) {
    c.add(addText(scene, 0, footY, 'その場で使う', { size: 10, bold: true, color: '#6a4fb0' }).setOrigin(0.5));
  } else {
    // 重さの名前と目盛りを1行に並べる
    const wl = addText(scene, 0, footY, weightLabel(def.weight), { size: 10, bold: true, color: '#444444' }).setOrigin(0, 0.5);
    const n = WEIGHT_LABELS.length;
    const start = -(wl.width + 4 + n * 7) / 2;
    wl.setX(start);
    c.add(wl);
    const level = WEIGHT_LABELS.findIndex((wt) => def.weight <= wt.max + 1e-9);
    for (let i = 0; i < n; i++) c.add(scene.add.rectangle(start + wl.width + 4 + i * 7, footY, 5, 4, i <= level ? 0xffb347 : 0x9aa3ad).setOrigin(0, 0.5));
  }
  const hit = scene.add.rectangle(0, 0, w, hgt, 0xffffff, 0.001);
  c.add(hit);
  makePressable(hit, cardHandlers(card, o));
}

/** 写真（段階102b）：台帳の画像を (x, y, w, h) の箱いっぱいに切り抜いて置く（四角なので、切り抜きだけで形を作る） */
function photoCrop(scene: Phaser.Scene, id: string, x: number, y: number, w: number, h: number, focus: { x: number; y: number }): Phaser.GameObjects.Image {
  const src = scene.textures.get(id).getSourceImage();
  const scale = Math.max(w / src.width, h / src.height);
  const cw = w / scale;
  const ch = h / scale;
  const sx = Phaser.Math.Clamp(focus.x * src.width - cw / 2, 0, src.width - cw);
  const sy = Phaser.Math.Clamp(focus.y * src.height - ch / 2, 0, src.height - ch);
  return scene.add.image(x - sx * scale, y - sy * scale, id).setOrigin(0).setScale(scale).setCrop(sx, sy, cw, ch);
}
