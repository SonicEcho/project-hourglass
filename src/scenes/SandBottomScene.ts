import Phaser from 'phaser';
import type { DigDir, DigEvent, DigState, DigTile, DigToolId, DigWorldDef } from '../core';
import type { DigLoreDef, DigLoreKind, DigOwned, DigRuleId } from '../data';
import { addItems, addParts, chapterOfEvent, gainSnaps, nextRandom, clearNest, hearLostVoice, huntGearKey, isDigGuardRow, takeRelic, useDigSkill, useDigTool, clearGuard, clearRoamer, createDig, digBackCost, digEntrance, digLayerAt, goHome, loseDig, recordLibraryFinds, stepDig, swapChest, takeChest } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { AREA_BATTLES, SCREEN_COACH, CHAIN_SNAPS, DIG_LORE, DIG_RULES, digLoreVar, digAfterDive, digFullDepth, DIG_FULL_VAR, digRuleFor, parseRare, pickDigRare, SAND_BOTTOM_FEATURES, withRareRelic, withRule, DIG_HEAL_SKILL_RATE, DIG_SKILLS, DIG_TOOL_OWN_MAX, DIG_TOOLS, digRewardRate, digToolVar, HUNT_OLD_AREA_RATE, LOST_ITEMS, NAVI_DATA, parseRelic, PARTY, relicGears, SAND_BOTTOM_COLORS, SAND_BOTTOM_DEEPEST_VAR, SAND_BOTTOM_DIGGER_VAR, SAND_BOTTOM_DIGGERS, SAND_BOTTOM_METERS_PER_ROW, sandBottomFor, SLICE_FLOW, WEAPON_DATA, withDigger, diggerStats, ALLY_FACE, FACE_CROPS } from '../data';
import { startScreenCoach } from '../ui/screenCoach';
import { battleImages, commonImages } from '../assets/screenImages';
import { dialogueImages, waitImages } from '../ui/waitImages';
import type { DialogueData } from './DialogueScene';
import { isSettled, hasImage } from '../assets/loader';
import { COLORS, RENDER_SCALE, STYLE, ALLY_COLOR, toCss } from '../ui/theme';
import { addButton, addText, addSlant } from '../ui/widgets';
import type { DigHeroSprite } from './digArt';
import { digArtId, DIG_CRACK_FRAME, DIG_SURFACE_FRAME, DIG_TILE, ensureDigHero, ensureDigRoamer, ensureDigTiles, isSolid, ROAMER_ANIM, ROAMER_TEXTURE, tileFrame } from './digArt';
import { currentParty, run, saveRun, setStoryVars, storyBattleLineup, storyLineup } from './run';
import { faceImage } from '../ui/portrait';

// 砂の底を掘る（段階207 試作1・段階208 試作2・段階209 本編の入口。docs/milestones/M3_sand_bottom.md）。横から見た地面を、1マスずつ掘り進む。
// 動かし方は、下の大きな十字のボタン（長押しで続けて進む）か、自分の上下左右のマス（枠が出る）をタップ。自分と砂嵐はマスの間をなめらかに動く。
// 砂時計の砂は掘る手数で減る（空洞を歩くのは減らない）。宝箱・鉱脈の素材はかばん（10個）へ。層の境目の番人と、動く砂嵐（空洞に稀に湧く）はいつもの戦闘。
// 「上へ戻る」で持ち帰る。潜っている途中はセーブしない（閉じたら潜る前から）
// 段階210（S2）：ブロック・宝箱・番人・砂嵐をコードで描いた絵にし、自分は二頭身のハルト（スコップで掘ってから歩いて進む。絵は digArt.ts）

export interface SandBottomData {
  /** 番人に勝って戻った（番人のマス） */
  wonGuard?: number;
  /** 動く砂嵐に勝って戻った（砂嵐の番号） */
  wonRoamer?: number;
  /** ぬしの巣のぬしに勝って戻った（巣のマス。段階213） */
  wonNest?: number;
  /** 戦闘に負けて戻った */
  lost?: boolean;
}

type FoeKind = 'guard' | 'roamer' | 'nest';

const T = DIG_TILE;
const COLS = 15;
const GRID_Y = 96;
const ROWS = 18;
const PANEL_Y = GRID_Y + ROWS * T;
/** 十字のボタン（段階209：大きく）。真ん中の位置と、1つの大きさ */
const PAD = { x: GAME_WIDTH - 118, y: PANEL_Y + 176, w: 72, h: 58, gap: 6 };
/** 1マス動くのにかける時間（ミリ秒）と、長押しで次へ進むまでの間 */
const MOVE_MS = 130;
const REPEAT_MS = 60;
/** 帰り道の砂の余りがこれを下回ったら警告する（段階214）。段階215 の続き：その前に、黄色の注意（もう少し早めに） */
const SAND_WARN = 15;
const SAND_CAUTION = 45;
/** 道具袋の枠に出す1文字（段階214） */
const TOOL_MARK: Record<DigToolId, string> = { blast: '爆', ladder: '縄', bell: '鈴', shard: '砂', lantern: '灯', needle: '針' };
/** 暗がりの暗さ（段階216：もっと暗く）。一度見えた所はうっすら地形が分かる程度、見たことのない所はほぼ真っ暗 */
const DARK_SEEN = 0.8;
const DARK_UNSEEN = 0.97;
/** 毒の砂で減る HP の割合（段階215） */
const POISON_RATE = 0.1;

/** 掘る時に、その場でスコップを振る時間（段階210。振り終わってから歩いて進む） */
const DIG_MS = 150;

/** 掘ったブロック（崩れる動きを出す） */
interface DigAnim {
  x: number;
  y: number;
  tile: DigTile;
  dir: DigDir;
}

/** 潜った回数を覚える、物語で覚えた値の名前（段階209） */
const DIVE_COUNT_VAR = 'dig:count';

const itemName = (id: string) => WEAPON_DATA.items[id]?.name ?? id;
const rarityMark = (id: string) => {
  const r = WEAPON_DATA.items[id]?.rarity;
  return r === 'rare' ? '★' : r === 'uncommon' ? '◆' : '・';
};
const DIR_STEP: Record<DigDir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** 今の章の砂の底（砂時計の砂が章で変わる） */
function currentDef() {
  return withRule(sandBottomFor(chapterOfEvent(SLICE_FLOW, run.event)?.id, run.vars), run.dig?.rule);
}

/** 次に潜る回の特別ルール（段階217。潜った回数とシードで決まる） */
function nextRule(): DigRuleId {
  return digRuleFor(run.seed, fullDives() + 1);
}

/** ちゃんと潜った回数（段階218。特別ルール・珍品はこれで決める。潜ってすぐ戻っても進まない） */
function fullDives(): number {
  return Number(run.vars[DIG_FULL_VAR] ?? 0);
}

export class SandBottomScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private message = '';
  /** なめらかに動いている間（次の手を受け付けない） */
  private moving = false;
  /** 長押ししている向き */
  private held: DigDir | null = null;
  private holdTimer?: Phaser.Time.TimerEvent;
  /** 掘る人の向き（左右。上下に動いても変えない） */
  private facing: 'left' | 'right' = 'right';
  private hero!: DigHeroSprite;
  /** 最後に動いた（掘ろうとした）向き（段階214。技の向き） */
  private lastDir: DigDir = 'down';
  /** 帰り道の砂の警告を出した（段階214。下回った時に1度だけ画面を光らせる） */
  private warned = false;

  constructor() {
    super('SandBottom');
  }

  private get s(): DigState {
    return run.dig!.state;
  }

  private set s(v: DigState) {
    run.dig = { ...run.dig!, state: v };
  }

  /** 掘る人の特徴を入れた砂の底（段階211） */
  /** 潜っている間の砂の底（章・掘る人・物語の値から。段階213：開くたびに1度だけ作る。中で毎回作ると重いため） */
  private world?: DigWorldDef;

  private get def(): DigWorldDef {
    if (!this.world) this.world = withDigger(currentDef(), run.dig?.digger ?? 'hero');
    return this.world;
  }

  /** 入った時の砂時計の砂（砂の棒の長さの元） */
  private get sandMax(): number {
    return run.dig?.max ?? this.def.sand;
  }

  create(data: SandBottomData = {}): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f22).setOrigin(0);
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.world = undefined;
    this.message = '';
    this.moving = false;
    this.held = null;
    this.holdTimer = undefined;
    this.facing = 'right';
    this.lastDir = 'down';
    ensureDigTiles(this);
    ensureDigRoamer(this);
    this.input.on('pointerup', () => this.release());
    if (!run.dig || run.dig.state.outcome !== 'diving') {
      // 潜る前に、掘る人を選ぶ（段階211）
      this.openPicker();
      return;
    }
    this.hero = ensureDigHero(this, run.dig.digger);
    if (data.wonGuard !== undefined) {
      this.s = clearGuard(this.def, this.s, data.wonGuard);
      this.message = `番人を倒しました！ 下の層へ進めます（砂時計 −${this.def.cost.battle}）`;
    }
    if (data.wonRoamer !== undefined) {
      this.s = clearRoamer(this.def, this.s, data.wonRoamer);
      this.message = `砂嵐を倒しました！（砂時計 −${this.def.cost.battle}）`;
    }
    if (data.wonNest !== undefined) {
      this.s = clearNest(this.def, this.s, data.wonNest);
      this.message = `ぬしを倒しました！（砂時計 −${this.def.cost.battle}）`;
    }
    if (data.wonGuard !== undefined || data.wonRoamer !== undefined || data.wonNest !== undefined) this.healAfterWin();
    if (data.lost) {
      this.s = loseDig(this.def, this.s);
      run.dig = { ...run.dig!, vitals: {} };
    }
    this.render();
    if (this.s.outcome !== 'diving') this.showResult();
    this.waitDiggerArt();
  }

  /**
   * 掘る人の絵がまだ読めていなければ（デバッグの入口から入った時・裏の読み込みが間に合わない時）、ここで待って描き直す。
   * 待つ間は、読み込みの画面が上に出る（段階210。開発者の声：はじめに仮の絵が出た）。まだ届いていない人の絵は、待たずに仮の絵
   */
  private waitDiggerArt(): void {
    const who = run.dig?.digger ?? 'hero';
    const art = digArtId(who);
    if (isSettled(this, art)) return;
    waitImages(this, [art], () => {
      this.hero = ensureDigHero(this, who);
      if (!this.overlay) this.render();
    });
  }

  /** 今の章の仲間（掘る人に選べる人）。特徴のある人だけ */
  private diggers(): string[] {
    return storyLineup().members.filter((id) => SAND_BOTTOM_DIGGERS[id]);
  }

  /** 「誰が掘る？」の前に、仲間の掘る絵を待つ（段階214。絵が動く札にするため） */
  private openPicker(): void {
    const arts = this.diggers().map((id) => digArtId(id));
    waitImages(this, arts, () => this.showPicker());
  }

  /**
   * 潜る前に「誰が掘る？」（段階211。段階214：華やかに）。人ごとの色の札に、動く二頭身・名前・特徴・技。
   * 前に選んだ人の札は金色の縁
   */
  private showPicker(): void {
    const o = this.openOverlay(0.94);
    const list = this.diggers();
    const last = run.vars[SAND_BOTTOM_DIGGER_VAR];
    const chosen = last && list.includes(last) ? last : list[0];
    o.add(addText(this, GAME_WIDTH / 2, 64, '誰が掘る？', { size: 24, bold: true }).setOrigin(0.5).setFontStyle('bold italic').setShadow(3, 3, STYLE.redText, 0, false, true));
    o.add(addText(this, GAME_WIDTH / 2, 94, '掘る人で、得意なことと技が変わります（戦闘はいつもの並び）', { size: 11, color: COLORS.subText }).setOrigin(0.5));
    // 段階217：今回の地層の特別ルール（潜るたびに変わる）
    const rule = DIG_RULES[nextRule()];
    // 段階230（見た目の決まり）：今回の地層は、黒い帯に白い枠・左に紅の帯
    o.add(this.add.rectangle(14, 108, GAME_WIDTH - 28, 30, STYLE.ink, 0.95).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.7));
    o.add(this.add.rectangle(14, 108, 5, 30, STYLE.red).setOrigin(0));
    o.add(addText(this, GAME_WIDTH / 2 + 2, 123, `今回の地層：${rule.name}（${rule.note}）`, { size: 12, bold: true }).setOrigin(0.5));
    const top = 146;
    const bottom = GAME_HEIGHT - 86;
    const gap = 8;
    const h = Math.min(132, Math.floor((bottom - top - gap * (list.length - 1)) / list.length));
    list.forEach((id, i) => {
      const d = SAND_BOTTOM_DIGGERS[id];
      const skill = DIG_SKILLS[d.skill];
      const y = top + i * (h + gap);
      const x = 14;
      const w = GAME_WIDTH - 28;
      const card = this.add.container(0, 0);
      o.add(card);
      // 段階230（開発者の声：文だけで単調）：人ごとの色から黒へ横に移る札に、名前・特徴のひとこと・4つの数の枠・技を整理して出す
      const on = id === chosen;
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.7).fillRect(x + 4, y + 4, w, h);
      bg.fillGradientStyle(d.color, STYLE.ink, d.color, STYLE.ink, 1, 1, 1, 1).fillRect(x, y, w, h);
      bg.lineStyle(on ? 3 : 1.5, on ? 0xffffff : 0x5a5a62, 1).strokeRect(x, y, w, h);
      card.add(bg);
      // 動く二頭身（歩く）
      const hero = ensureDigHero(this, id);
      const sprite = this.add.sprite(x + 52, y + h - 6, hero.key, hero.idleFrame).setOrigin(hero.originX, hero.originY).setScale(hero.scale * Math.min(2.4, (h - 16) / (T * 1.5)));
      sprite.play(hero.anim('walk'));
      // 段階215 の続き（開発者の声：足の動きが速すぎる）：札では、ゆっくり歩く
      sprite.anims.timeScale = 0.4;
      card.add(sprite);
      const name = PARTY.find((c) => c.id === id)?.name ?? id;
      const tx = x + 104;
      const tw = w - 114;
      const nameT = addText(this, tx, y + 6, name, { size: 19, bold: true }).setFontStyle('bold italic').setShadow(2, 2, '#000000', 0, false, true);
      card.add(nameT);
      // 特徴のひとこと（白い斜めの札）
      const tagT = addText(this, 0, 0, d.tag, { size: 10, bold: true, color: '#111111' });
      const tagW = tagT.width + 16;
      card.add(addSlant(this, tx + tagW / 2, y + 40, tagW, 16, 0xffffff));
      card.add(tagT.setOrigin(0.5).setPosition(tx + tagW / 2, y + 40));
      // 選んでいる人
      if (on) {
        card.add(addSlant(this, x + w - 40, y + 14, 60, 18, STYLE.red));
        card.add(addText(this, x + w - 40, y + 14, '選択中', { size: 10, bold: true }).setOrigin(0.5).setFontStyle('bold italic'));
      }
      // 4つの数の枠（ふつうより得意な所は黄）
      const stats = diggerStats(id);
      const cw = (tw - 3 * 4) / 4;
      const sy = y + 52;
      stats.forEach((st, k) => {
        const cx = tx + k * (cw + 4);
        card.add(this.add.rectangle(cx, sy, cw, 30, 0x000000, 0.55).setOrigin(0).setStrokeStyle(1, st.up ? STYLE.yellow : 0xffffff, st.up ? 1 : 0.25));
        card.add(addText(this, cx + cw / 2, sy + 7, st.label, { size: 8, color: COLORS.subText }).setOrigin(0.5));
        const v = addText(this, cx + cw / 2, sy + 20, st.value, { size: 13, bold: true, color: st.up ? STYLE.yellowText : '#ffffff' }).setOrigin(0.5);
        if (v.width > cw - 4) v.setScale((cw - 4) / v.width);
        card.add(v);
      });
      // 技（紅の札「技」と、名前・ひとこと）
      const ky = sy + 38;
      card.add(addSlant(this, tx + 14, ky + 8, 28, 16, STYLE.red));
      card.add(addText(this, tx + 14, ky + 8, '技', { size: 10, bold: true }).setOrigin(0.5));
      card.add(addText(this, tx + 34, ky, skill.name, { size: 12, bold: true }));
      card.add(addText(this, tx + 34, ky + 16, skill.note, { size: 9, color: '#dddddd', wrap: tw - 34, ja: true }));
      const hit = this.add.rectangle(x, y, w, h, 0xffffff, 0.001).setOrigin(0).setInteractive();
      hit.on('pointerup', () => this.showToolPicker(id));
      card.add(hit);
    });
    addButton(this, o, GAME_WIDTH / 2 - 84, GAME_HEIGHT - 50, 150, 44, '拾った記録', { onTap: () => this.showRecords() }, { size: 13 });
    addButton(this, o, GAME_WIDTH / 2 + 84, GAME_HEIGHT - 50, 150, 44, 'やめる', { onTap: () => this.scene.start(run.active ? 'Hub' : 'Title') }, { size: 14 });
    // 段階236：初めての時は、照らす案内（戦闘と同じ形）
    startScreenCoach(this, 'dig_pick', SCREEN_COACH.dig_pick, (t) => this.coachRect(t, h));
  }

  /** 照らす所（段階236）：「誰が掘る？」の特別ルールと札、掘る画面の上の帯・地層・十字のボタン・戻るボタン */
  private coachRect(t: string, cardH = 132): { x: number; y: number; w: number; h: number } | null {
    if (t === 'rule') return { x: 10, y: 104, w: GAME_WIDTH - 20, h: 38 };
    if (t === 'cards') return { x: 10, y: 142, w: GAME_WIDTH - 20, h: cardH + 8 };
    if (t === 'hud') return { x: 0, y: 0, w: GAME_WIDTH, h: GRID_Y - 2 };
    if (t === 'grid') return { x: 0, y: GRID_Y, w: GAME_WIDTH, h: ROWS * T };
    if (t === 'pad') return { x: PAD.x - PAD.w * 1.5 - PAD.gap - 4, y: PAD.y - PAD.h * 1.5 - PAD.gap - 4, w: PAD.w * 3 + PAD.gap * 2 + 8, h: PAD.h * 3 + PAD.gap * 2 + 8 };
    if (t === 'exit') {
      const leftW = PAD.x - PAD.w * 1.5 - PAD.gap - 20;
      return { x: 6, y: GAME_HEIGHT - 36 - 31, w: leftW + 12, h: 62 };
    }
    return null;
  }

  /** 拾った記録（段階217）：りくのメモと誰かの日記を、番号順に。見つけていない所は「？」 */
  private showRecords(kind: DigLoreKind = 'riku'): void {
    const o = this.openOverlay(0.95);
    o.add(addText(this, GAME_WIDTH / 2, 60, '拾った記録', { size: 22, bold: true }).setOrigin(0.5).setFontStyle('bold italic').setShadow(3, 3, STYLE.redText, 0, false, true));
    const tabs: [DigLoreKind, string][] = [
      ['riku', 'りくのメモ'],
      ['diary', '誰かの日記'],
    ];
    tabs.forEach(([k, label], i) => addButton(this, o, GAME_WIDTH / 2 + (i === 0 ? -80 : 80), 104, 150, 38, label, { onTap: () => this.showRecords(k) }, k === kind ? { fill: STYLE.red, italic: true, size: 13 } : { size: 13 }));
    const list = DIG_LORE.filter((d) => d.kind === kind).sort((a, b) => a.no - b.no);
    const per = Math.min(list.length, 12);
    list.slice(0, per).forEach((d, i) => {
      const found = !!run.vars[digLoreVar(d.id)];
      const y = 150 + i * 46;
      const label = found ? `${d.no}. ${d.text.slice(0, 18)}……` : `${d.no}. ？`;
      addButton(this, o, GAME_WIDTH / 2, y, 330, 40, label, { onTap: () => (found ? this.showLore(d, () => this.showRecords(kind)) : undefined) }, { size: 11, enabled: found });
    });
    addButton(this, o, GAME_WIDTH / 2, GAME_HEIGHT - 50, 200, 44, '戻る', { onTap: () => this.showPicker() }, { size: 14 });
  }

  /** 読み物を読む（段階217） */
  private showLore(d: DigLoreDef, back?: () => void): void {
    const o = this.openOverlay(0.95);
    const title = d.kind === 'riku' ? `りくのメモ ${d.no}` : `誰かの日記 ${d.no}`;
    o.add(addText(this, GAME_WIDTH / 2, 150, title, { size: 20, bold: true, color: d.kind === 'riku' ? '#9fd0ff' : '#ffd0a0' }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 180, `（${d.note}）`, { size: 11, color: COLORS.subText }).setOrigin(0.5));
    o.add(this.add.rectangle(30, 206, GAME_WIDTH - 60, 300, 0xf4ecd8, 1).setOrigin(0).setStrokeStyle(2, 0x8a7a5a));
    o.add(addText(this, 46, 222, d.text, { size: 14, color: '#2a2018', wrap: GAME_WIDTH - 92, ja: true }).setLineSpacing(6));
    addButton(this, o, GAME_WIDTH / 2, 560, 200, 46, back ? '戻る' : '閉じる', { onTap: () => (back ? back() : this.closeOverlay()) }, { size: 14 });
  }

  /** 持っている道具の数（段階214。物語で覚えた値） */
  private stockOf(id: string): number {
    return Number(run.vars[digToolVar(id)] ?? 0);
  }

  /** 持ち込む道具を選ぶ（段階214）。持っている道具がなければ、そのまま潜る */
  private showToolPicker(digger: string, picked: string[] = []): void {
    const tools = Object.values(DIG_TOOLS).filter((t) => this.stockOf(t.id) > 0);
    if (tools.length === 0) {
      this.startDive(digger, []);
      return;
    }
    const max = this.def.toolMax ?? 3;
    const o = this.openOverlay(0.94);
    o.add(addText(this, GAME_WIDTH / 2, 90, '持ち込む道具', { size: 22, bold: true }).setOrigin(0.5).setFontStyle('bold italic').setShadow(3, 3, STYLE.redText, 0, false, true));
    o.add(addText(this, GAME_WIDTH / 2, 120, `道具袋に ${max} つまで。帰れば残りは戻る。負けると失う`, { size: 11, color: COLORS.subText }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 150, `道具袋：${picked.length > 0 ? picked.map((t) => DIG_TOOLS[t as DigToolId].name).join('・') : '（空）'}`, { size: 13, bold: true }).setOrigin(0.5));
    tools.forEach((t, i) => {
      const left = this.stockOf(t.id) - picked.filter((p) => p === t.id).length;
      const can = left > 0 && picked.length < max;
      addButton(this, o, GAME_WIDTH / 2, 206 + i * 66, 330, 58, `${t.name}（あと ${left}）\n${t.note}`, { onTap: () => this.showToolPicker(digger, [...picked, t.id]) }, { size: 12, enabled: can });
    });
    const y = 206 + tools.length * 66 + 20;
    if (picked.length > 0) addButton(this, o, GAME_WIDTH / 2 - 84, y, 150, 44, '入れ直す', { onTap: () => this.showToolPicker(digger, []) }, { size: 13 });
    addButton(this, o, GAME_WIDTH / 2 + (picked.length > 0 ? 84 : 0), y, 150, 44, '潜る', { onTap: () => this.startDive(digger, picked) }, { fill: STYLE.red, italic: true, size: 15 });
    addButton(this, o, GAME_WIDTH / 2, y + 60, 150, 40, '戻る', { onTap: () => this.showPicker() }, { size: 12 });
  }

  /** 選んだ人で潜り始める。持ち込んだ道具は、持っている数から減らす（段階214） */
  private startDive(digger: string, tools: string[]): void {
    // 潜った回数はセーブに残す（シードをずらす。開き直しても同じ地面にならないように。乱数はシードから決まる）
    const count = Number(run.vars[DIVE_COUNT_VAR] ?? 0) + 1;
    const stock = Object.fromEntries(tools.map((t) => [digToolVar(t), String(this.stockOf(t) - tools.filter((x) => x === t).length)]));
    setStoryVars({ ...run.vars, ...stock, [DIVE_COUNT_VAR]: String(count), [SAND_BOTTOM_DIGGER_VAR]: digger });
    // 段階217：その回の特別ルールと、珍品（埋めるかどうか・中身は、潜る前に決める。掘り当てるまで秘密）
    // 段階218：特別ルールと珍品は、ちゃんと潜った回数で決める（すぐ戻る選び直しを防ぐ）
    const full = fullDives() + 1;
    const rule = digRuleFor(run.seed, full);
    const chapter = chapterOfEvent(SLICE_FLOW, run.event)?.id;
    let def = withRule(sandBottomFor(chapter, run.vars), rule);
    let r = (run.seed ^ Math.imul(full + 11, 40503)) >>> 0;
    const rand = () => {
      const [v, n] = nextRandom(r);
      r = n;
      return v;
    };
    const owned: DigOwned = {
      item: (id) => run.library.items.includes(id) || (run.armory.items[id] ?? 0) > 0,
      snap: (id) => run.library.snaps.includes(id) || (run.chainAlbum.owned[id] ?? 0) > 0,
      gear: (id) => run.navi.parts.some((p) => p.partId === id),
    };
    const rare = pickDigRare(chapter, run.vars, owned, rule, rand);
    if (rare) def = withRareRelic(def, rare, rand);
    this.world = undefined;
    const state = createDig(withDigger(def, digger), (run.seed + count * 7919) >>> 0);
    run.dig = { state: { ...state, tools: [...tools] }, vitals: {}, count, max: def.sand, digger, rule, rare, rareFound: false };
    this.hero = ensureDigHero(this, digger);
    this.warned = false;
    this.message = '十字のボタンか、まわりの枠をタップすると掘れます（長押しで続けて掘れます）。空洞を歩くと砂を1、掘ると砂を3使います';
    this.closeOverlay();
    this.waitDiggerArt();
    // 段階236：初めて潜った時は、照らす案内（戦闘と同じ形）
    this.time.delayedCall(350, () => {
      if (!this.overlay) startScreenCoach(this, 'dig_play', SCREEN_COACH.dig_play, (t) => this.coachRect(t));
    });
  }

  /** あかりが掘る時：砂嵐に勝つたびに、みんなの HP が戻る（段階211） */
  private healAfterWin(): void {
    const heal = SAND_BOTTOM_DIGGERS[run.dig?.digger ?? '']?.heal;
    if (!heal || !run.dig) return;
    const vitals = { ...run.dig.vitals };
    for (const c of currentParty(storyBattleLineup())) {
      const v = vitals[c.id];
      if (v) vitals[c.id] = { ...v, hp: Math.min(c.stats.hp, v.hp + Math.round(c.stats.hp * heal)) };
    }
    run.dig = { ...run.dig, vitals };
    this.message += `　あかりの手当てで、HP が ${Math.round(heal * 100)}% 戻った`;
  }

  /**
   * 描き直す。before を渡すと、自分と砂嵐を前の位置から今の位置へ動かす（見える範囲がずれる時は、地面ごとずらして戻す）。
   * dig を渡すと、先にその場でブロックを掘る動きを出す。動きにかかる時間（ミリ秒）を返す
   */
  private render(before?: DigState, dig?: DigAnim): number {
    this.tweens.killAll();
    this.root.removeAll(true);
    const ms = this.drawGrid(before, dig);
    this.drawHud();
    this.drawPanel();
    return ms;
  }

  /** 見える範囲の上の行（自分が上から7行目あたりに来るように） */
  private viewTopOf(s: DigState): number {
    return Phaser.Math.Clamp(s.y - 6, 0, Math.max(0, s.height - ROWS));
  }

  private drawGrid(before?: DigState, dig?: DigAnim): number {
    const s = this.s;
    const top = this.viewTopOf(s);
    // 地面と動く物は1つの入れ物に入れる（見える範囲がずれた時に、まとめてずらす）
    const layer = this.add.container(0, 0);
    this.root.add(layer);
    const tileAt = (x: number, y: number) => (x < 0 || x >= s.width || y < 1 || y >= s.height ? undefined : s.tiles[y * s.width + x]);
    const img = (f: { key: string; frame: string }, px: number, py: number) => this.add.image(px, py, f.key, f.frame).setOrigin(0).setScale(1 / RENDER_SCALE);
    // 境目の影（空洞の天井の下は暗く、土の上の面は明るい縁）
    const g = this.add.graphics();
    const labels: Phaser.GameObjects.Text[] = [];
    // 見える範囲の上下に1行ずつ余分に描く（ずらしている間の隙間を埋める）
    for (let r = -1; r <= ROWS && top + r < s.height; r++) {
      const y = top + r;
      if (y < 0) continue;
      const lay = digLayerAt(this.def, Math.max(1, y));
      for (let x = 0; x < COLS; x++) {
        const px = x * T;
        const py = GRID_Y + r * T;
        if (y === 0) {
          layer.add(img(DIG_SURFACE_FRAME, px, py));
          continue;
        }
        const tile = s.tiles[y * s.width + x];
        layer.add(img(tileFrame(lay.id, tile, x, y), px, py));
        const above = y === 1 ? 'air' : tileAt(x, y - 1);
        if (isSolid(tile)) {
          if (!isSolid(above)) g.fillStyle(0xffffff, 0.16).fillRect(px, py, T, 2);
          if (!isSolid(tileAt(x, y + 1)) && y + 1 < s.height) g.fillStyle(0x000000, 0.3).fillRect(px, py + T - 2, T, 2);
        } else {
          if (isSolid(above)) g.fillStyle(0x000000, 0.4).fillRect(px, py, T, 3).fillStyle(0x000000, 0.18).fillRect(px, py + 3, T, 4);
          if (isSolid(tileAt(x - 1, y))) g.fillStyle(0x000000, 0.22).fillRect(px, py, 3, T);
          if (isSolid(tileAt(x + 1, y))) g.fillStyle(0x000000, 0.22).fillRect(px + T - 3, py, 3, T);
        }
      }
      // 層の始まり（と見える範囲のいちばん上）に層の名前（段階212。帯の名前は出さない）
      const prevLay = y > 1 ? digLayerAt(this.def, y - 1) : undefined;
      if (r >= 0 && r < ROWS && y > 0 && (r === 0 || prevLay?.group !== lay.group)) {
        const t = addText(this, 8, GRID_Y + r * T + 11, lay.name, { size: 10, bold: true, color: '#ffd76a' }).setOrigin(0, 0.5);
        g.fillStyle(0x000000, 0.55).fillRoundedRect(4, GRID_Y + r * T + 3, t.width + 8, 16, 4);
        labels.push(t);
      }
    }
    layer.add(g);
    layer.add(labels);
    if (top === 0) layer.add(addText(this, digEntrance(this.def) * T + T / 2, GRID_Y + 2, '入口', { size: 9, bold: true, color: '#ffd76a' }).setOrigin(0.5, 0));
    const cellX = (x: number) => x * T + T / 2;
    const cellY = (y: number) => GRID_Y + (y - top) * T + T / 2;
    // 掘っている間（DIG_MS）はその場でスコップを振り、それから歩いて進む。砂嵐と見える範囲も、歩き出すのに合わせて動く
    const delay = dig ? DIG_MS : 0;
    const moved = !!before && (before.x !== s.x || before.y !== s.y);
    // 掘ったブロック：前の絵を揺らして崩し、かけらを飛ばす
    if (dig) {
      const lay = digLayerAt(this.def, Math.max(1, dig.y));
      const bx = cellX(dig.x);
      const by = cellY(dig.y);
      const f = tileFrame(lay.id, dig.tile, dig.x, dig.y);
      const block = this.add.container(bx, by);
      block.add(this.add.image(0, 0, f.key, f.frame).setScale(1 / RENDER_SCALE));
      block.add(this.add.image(0, 0, DIG_CRACK_FRAME.key, DIG_CRACK_FRAME.frame).setScale(1 / RENDER_SCALE).setAlpha(0));
      layer.add(block);
      const crack = block.list[1] as Phaser.GameObjects.Image;
      this.tweens.add({ targets: crack, alpha: 1, duration: DIG_MS * 0.5, delay: DIG_MS * 0.3 });
      this.tweens.add({ targets: block, x: bx + 1.5, duration: 30, yoyo: true, repeat: 2, delay: DIG_MS * 0.4 });
      this.tweens.add({ targets: block, scale: 0.5, alpha: 0, duration: 110, delay: DIG_MS });
      const color = SAND_BOTTOM_COLORS[lay.id];
      const chip = dig.tile === 'rock' ? color.rock : dig.tile === 'clay' ? color.clay : dig.tile === 'loose' ? color.loose : dig.tile === 'ore' || dig.tile === 'grain' ? 0xffd76a : color.sand;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const piece = this.add.rectangle(bx, by, 3, 3, chip).setAlpha(0);
        layer.add(piece);
        this.tweens.add({ targets: piece, alpha: { from: 1, to: 0 }, x: bx + Math.cos(a) * 12, y: by + Math.sin(a) * 8 + 8, angle: 180, duration: 320, delay: DIG_MS * 0.8, ease: 'Quad.easeOut' });
      }
    }
    // 動く砂嵐（渦巻く砂。追っている時は「！」）。前の位置からなめらかに
    for (const m of s.roamers) {
      if (m.y - top < -1 || m.y - top > ROWS) continue;
      const foe = this.add.container(cellX(m.x), cellY(m.y));
      foe.add(this.add.sprite(0, 0, ROAMER_TEXTURE, 'r0').setScale(1 / RENDER_SCALE).play(ROAMER_ANIM));
      if (m.chasing) foe.add(addText(this, 0, -T / 2 - 2, '！', { size: 14, bold: true, color: '#ff8a7a' }).setOrigin(0.5, 1));
      layer.add(foe);
      const was = before?.roamers.find((o) => o.id === m.id);
      if (before && was && (was.x !== m.x || was.y !== m.y)) {
        foe.setPosition(cellX(was.x), cellY(was.y));
        this.tweens.add({ targets: foe, x: cellX(m.x), y: cellY(m.y), duration: MOVE_MS, delay });
      } else if (before && !was) {
        // 湧いた砂嵐は、ふわっと出る
        foe.setScale(0.2).setAlpha(0);
        this.tweens.add({ targets: foe, scale: 1, alpha: 1, duration: MOVE_MS * 2, delay });
      }
    }
    // 自分（二頭身のハルト。右向きの絵を、左へ行く時は左右を返す）。足もとをマスの下の端に
    const hero = this.hero;
    const footY = (y: number) => cellY(y) + T / 2 - 1;
    const me = this.add.sprite(cellX(s.x), footY(s.y), hero.key, hero.idleFrame).setOrigin(hero.originX, hero.originY).setScale(hero.scale).setFlipX(this.facing === 'left');
    layer.add(me);
    if (dig) {
      me.setPosition(cellX(before?.x ?? s.x), footY(before?.y ?? s.y)).play(hero.anim(dig.dir === 'down' ? 'digDown' : dig.dir === 'up' ? 'climb' : 'digSide'));
      if (!moved) me.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => me.setFrame(hero.idleFrame));
    }
    if (before && moved) {
      me.setPosition(cellX(before.x), footY(before.y));
      this.tweens.add({
        targets: me,
        x: cellX(s.x),
        y: footY(s.y),
        duration: MOVE_MS,
        delay,
        onStart: () => me.play(hero.anim(s.y < before.y ? 'climb' : 'walk')),
        onComplete: () => me.stop().setFrame(hero.idleFrame),
      });
    }
    // 見える範囲がずれた時：地面ごと前の位置に置いて、今の位置へずらす
    if (before) {
      const was = this.viewTopOf(before);
      if (was !== top) {
        layer.y = (top - was) * T;
        this.tweens.add({ targets: layer, y: 0, duration: MOVE_MS, delay });
      }
    }
    // 暗がり（段階215）：深い章の層は、自分のまわりと光る苔のまわりしか見えない。一度見えた所は薄暗く残る
    layer.add(this.drawDark(top));
    // 層の名前は、暗がりの上に出す
    for (const t of labels) layer.bringToTop(t);
    // 動ける上下左右のマスに枠（タップで、そのマスへ）
    if (s.outcome === 'diving') {
      for (const dir of Object.keys(DIR_STEP) as DigDir[]) {
        const [dx, dy] = DIR_STEP[dir];
        const nx = s.x + dx;
        const ny = s.y + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= s.height || ny - top < 0 || ny - top >= ROWS) continue;
        if (s.tiles[ny * s.width + nx] === 'rock' && (this.def.rockCost === undefined || isDigGuardRow(this.def, ny))) continue;
        const frame = this.add.rectangle(nx * T + 1, GRID_Y + (ny - top) * T + 1, T - 2, T - 2, 0xffffff, 0.08).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.75);
        frame.setInteractive();
        frame.on('pointerup', () => this.tryStep(dir));
        this.root.add(frame);
      }
    }
    return delay + (moved ? MOVE_MS : 0);
  }

  /**
   * 上の帯（段階230。開発者の声：デバッグの画面のように質素）：砂は斜めの板に大きな数字と区切りの帯、帰り道の砂は黄の札。
   * 深さは大きな斜体の数字に紅の影、今の層は紅の札
   */
  private drawHud(): void {
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GRID_Y, STYLE.ink).setOrigin(0));
    this.root.add(this.add.rectangle(0, GRID_Y - 2, GAME_WIDTH, 2, STYLE.red, 0.9).setOrigin(0));
    const s = this.s;
    // 砂の板
    const plate = addSlant(this, 118, 30, 212, 42, 0x16141a);
    plate.setStrokeStyle(1.5, 0xffffff, 1);
    this.root.add(plate);
    this.root.add(addText(this, 28, 30, '⏳', { size: 20 }).setOrigin(0, 0.5));
    const num = addText(this, 58, 30, String(s.sand), { size: 24, bold: true }).setOrigin(0, 0.5).setFontStyle('bold italic');
    this.root.add(num);
    this.root.add(addText(this, 64 + num.width, 33, `/ ${this.sandMax}　砂時計`, { size: 10, color: COLORS.subText }).setOrigin(0, 0.5));
    // 区切りの帯（20こ）
    const rate = Phaser.Math.Clamp(s.sand / this.sandMax, 0, 1);
    const segs = 20;
    const lit = Math.ceil(rate * segs);
    const low = rate < 0.25;
    for (let k = 0; k < segs; k++) this.root.add(addSlant(this, 22 + k * 11, 63, 9, 9, k < lit ? (low ? 0xff6a5a : 0xe8c784) : 0x333038));
    // 帰り道に要る砂（黄の札。足りない時は赤）
    const back = digBackCost(this.def, s);
    const short = s.sand < back;
    const backT = addText(this, 0, 0, `帰り道 砂 ${back}${short ? '（足りない！）' : ''}`, { size: 10, bold: true, color: short ? '#ffffff' : '#000000' });
    const bw = backT.width + 18;
    this.root.add(addSlant(this, 18 + bw / 2, 82, bw, 16, short ? 0xff4a3a : STYLE.yellow));
    this.root.add(backT.setOrigin(0.5).setPosition(18 + bw / 2, 82));
    // 深さ（大きな斜体）と、今の層の札
    const record = Number(run.vars[SAND_BOTTOM_DEEPEST_VAR] ?? 0);
    const unit = addText(this, GAME_WIDTH - 12, 40, 'm', { size: 16, bold: true }).setOrigin(1, 1).setFontStyle('bold italic');
    this.root.add(unit);
    this.root.add(addText(this, GAME_WIDTH - 14 - unit.width, 44, String(s.y * SAND_BOTTOM_METERS_PER_ROW), { size: 36, bold: true }).setOrigin(1, 1).setFontStyle('bold italic').setShadow(3, 3, STYLE.redText, 0, false, true));
    const layerT = addText(this, 0, 0, s.y > 0 ? digLayerAt(this.def, s.y).name : '地上', { size: 10, bold: true });
    const lw = layerT.width + 18;
    this.root.add(addSlant(this, GAME_WIDTH - 12 - lw / 2, 58, lw, 16, STYLE.red));
    this.root.add(layerT.setOrigin(0.5).setPosition(GAME_WIDTH - 12 - lw / 2, 58));
    this.root.add(addText(this, GAME_WIDTH - 12, 76, `今回 ${s.deepest * SAND_BOTTOM_METERS_PER_ROW} m・記録 ${record * SAND_BOTTOM_METERS_PER_ROW} m`, { size: 9, color: COLORS.subText }).setOrigin(1, 0));
  }

  /**
   * 暗がりを描く（段階215）。見えている所は何もかけない。一度見えた所（run.dig.seen）は薄く、見たことのない所は真っ暗。
   * 見えている所：暗がりのない層、自分から（その層の見える広さ＋ランタン）以内、光る苔から2マス以内
   */
  private drawDark(top: number): Phaser.GameObjects.Graphics {
    const s = this.s;
    const g = this.add.graphics();
    const seen = new Set(run.dig?.seen ?? []);
    const added: number[] = [];
    const lit = (x: number, y: number) => {
      const d = digLayerAt(this.def, Math.max(1, y)).dark;
      if (d === undefined || y === 0) return true;
      const r = d + s.light;
      return (x - s.x) ** 2 + (y - s.y) ** 2 <= (r + 0.5) ** 2;
    };
    // 光る苔のまわり
    const moss = new Set<number>();
    for (let y = Math.max(1, top - 3); y < Math.min(s.height, top + ROWS + 3); y++)
      for (let x = 0; x < COLS; x++)
        if (s.tiles[y * s.width + x] === 'moss')
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) moss.add((y + dy) * s.width + x + dx);
    for (let r = -1; r <= ROWS && top + r < s.height; r++) {
      const y = top + r;
      if (y < 1) continue;
      for (let x = 0; x < COLS; x++) {
        const cell = y * s.width + x;
        if (lit(x, y) || moss.has(cell)) {
          if (!seen.has(cell)) {
            seen.add(cell);
            added.push(cell);
          }
          continue;
        }
        g.fillStyle(0x000000, seen.has(cell) ? DARK_SEEN : DARK_UNSEEN).fillRect(x * T, GRID_Y + r * T, T, T);
      }
    }
    if (added.length > 0 && run.dig) run.dig = { ...run.dig, seen: [...(run.dig.seen ?? []), ...added] };
    return g;
  }

  /** 帰り道の砂の余り（今の砂 − 帰り道に要る砂。段階214） */
  private margin(): number {
    return this.s.sand - digBackCost(this.def, this.s);
  }

  private drawPanel(): void {
    // 段階230（見た目の決まり）：下の板は黒、上の境に紅の線
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, GAME_HEIGHT - PANEL_Y, STYLE.ink).setOrigin(0));
    this.root.add(this.add.rectangle(0, PANEL_Y, GAME_WIDTH, 2, STYLE.red, 0.9).setOrigin(0));
    const s = this.s;
    // 段階230（開発者の声：デバッグの画面のように質素）：紅の見出し「かばん」「道具」、かばんは珍しさの色の斜めの枠、
    // 仲間は顔と HP の帯で出す
    const label = (x: number, y: number, text: string) => {
      const t = addText(this, 0, 0, text, { size: 9, bold: true });
      const w = t.width + 16;
      this.root.add(addSlant(this, x + w / 2, y, w, 14, STYLE.red));
      this.root.add(t.setOrigin(0.5).setPosition(x + w / 2, y).setFontStyle('bold italic'));
    };
    label(12, PANEL_Y + 11, `かばん ${s.bag.length}/${this.def.bagMax}`);
    for (let i = 0; i < this.def.bagMax; i++) {
      const x = 12 + i * 36 + 15;
      const id = s.bag[i];
      const mark = id ? rarityMark(id) : '';
      const color = mark === '★' ? STYLE.yellow : mark === '◆' ? 0x6dd0ff : id ? 0xffffff : 0x4a4852;
      const slot = addSlant(this, x, PANEL_Y + 32, 30, 24, 0x16141a);
      slot.setStrokeStyle(id ? 1.5 : 1, color, 1);
      this.root.add(slot);
      if (id) this.root.add(addText(this, x, PANEL_Y + 32, mark, { size: 13, bold: true, color: toCss(color) }).setOrigin(0.5));
    }
    // 左の列：掘る人・仲間の HP・道具袋・技・上へ戻る。右：十字のボタン
    const leftW = PAD.x - PAD.w * 1.5 - PAD.gap - 20;
    const party = currentParty(storyBattleLineup());
    // 掘る人と特徴のひとこと（段階211・230）
    const digger = run.dig?.digger ?? 'hero';
    const diggerName = PARTY.find((c) => c.id === digger)?.name ?? digger;
    this.root.add(addText(this, 12, PANEL_Y + 48, `掘る人：`, { size: 10, color: COLORS.subText }));
    this.root.add(addText(this, 52, PANEL_Y + 48, `${diggerName}（${SAND_BOTTOM_DIGGERS[digger]?.tag ?? ''}）`, { size: 10, bold: true, color: STYLE.yellowText }));
    // 仲間：顔と HP の帯
    party.forEach((c, k) => {
      const y = PANEL_Y + 72 + k * 16;
      const faceId = ALLY_FACE[c.id];
      if (faceId && hasImage(this, faceId)) {
        this.root.add(this.add.circle(20, y, 8, 0x000000));
        this.root.add(faceImage(this, faceId, 20, y, 7, FACE_CROPS[c.id]));
      } else this.root.add(this.add.circle(20, y, 7, ALLY_COLOR[c.id] ?? COLORS.ally));
      this.root.add(this.add.circle(20, y, 8).setStrokeStyle(1.2, 0xffffff));
      const hp = Math.round(run.dig?.vitals[c.id]?.hp ?? c.stats.hp);
      const rate = Phaser.Math.Clamp(hp / c.stats.hp, 0, 1);
      const bw = leftW - 74;
      this.root.add(addSlant(this, 34 + bw / 2, y, bw, 6, 0x333038));
      if (rate > 0) this.root.add(addSlant(this, 34 + (bw * rate) / 2, y, bw * rate, 6, rate < 0.3 ? 0xff6a4a : 0x4cd07d));
      this.root.add(addText(this, 38 + bw, y, `${hp}/${c.stats.hp}`, { size: 9, color: '#dddddd' }).setOrigin(0, 0.5));
    });
    const diving = s.outcome === 'diving';
    // 道具袋（段階214）：3つの枠。タップで説明と「使う」
    // 左の列の下の方は、画面の下から決める（「地上へ出る」のボタンと重ならないように）
    const skillY = GAME_HEIGHT - 86;
    const toolY = skillY - 17 - 6 - 36;
    label(12, toolY - 9, '道具');
    const max = this.def.toolMax ?? 3;
    for (let i = 0; i < max; i++) {
      const x = 12 + i * 46;
      const t = s.tools[i] as DigToolId | undefined;
      const slot = addSlant(this, x + 20, toolY + 18, 40, 36, t ? 0x3a2a5a : 0x16141a);
      slot.setStrokeStyle(1.5, t ? 0xc8a0ff : 0x4a4852, 1);
      this.root.add(slot);
      if (!t) continue;
      this.root.add(addText(this, x + 20, toolY + 18, TOOL_MARK[t], { size: 18, bold: true, color: '#ffe9ff' }).setOrigin(0.5));
      if (!diving) continue;
      const hit = this.add.rectangle(x, toolY, 40, 36, 0xffffff, 0.001).setOrigin(0).setInteractive();
      hit.on('pointerup', () => this.confirmTool(t));
      this.root.add(hit);
    }
    // 技（段階214）
    const skill = DIG_SKILLS[SAND_BOTTOM_DIGGERS[digger]?.skill ?? 'stop'];
    addButton(this, this.root, 12 + leftW / 2, skillY, leftW, 34, `技「${skill.name}」　残り ${s.skillLeft}`, { onTap: () => this.confirmSkill() }, { size: 10, enabled: diving && s.skillLeft > 0 });
    this.drawPad(diving);
    const back = digBackCost(this.def, s);
    addButton(this, this.root, 12 + leftW / 2, GAME_HEIGHT - 36, leftW, 50, s.y === 0 ? '地上へ出る\n（持ち帰る）' : `上へ戻る\n（砂 −${back}）`, { onTap: () => this.goBack() }, { fill: STYLE.red, italic: true, size: 13 });
    // 知らせの文は、地面の下の端に重ねる（段階214。左の列を道具と技に使うため）
    if (this.message) {
      const t = addText(this, 10, PANEL_Y - 6, this.message, { size: 11, bold: true, color: '#ffe9a8', wrap: GAME_WIDTH - 20, ja: true }).setOrigin(0, 1);
      this.root.add(this.add.rectangle(0, PANEL_Y - 10 - t.height, GAME_WIDTH, t.height + 10, 0x000000, 0.65).setOrigin(0));
      this.root.add(t);
    }
    // 帰り道の砂の警告（段階214。開発者の声）：余りが少ない・足りない時は、地面の上の端に赤い知らせ
    const m = this.margin();
    if (diving && s.y > 0 && m < SAND_CAUTION && m >= SAND_WARN) {
      const bar = this.add.rectangle(0, GRID_Y, GAME_WIDTH, 22, 0x6a5010, 0.85).setOrigin(0);
      const label = addText(this, GAME_WIDTH / 2, GRID_Y + 11, `そろそろ帰り道を考えよう（帰り道の砂の余り ${m}）`, { size: 11, bold: true, color: '#ffe9a8' }).setOrigin(0.5);
      this.root.add([bar, label]);
    }
    if (diving && s.y > 0 && m < SAND_WARN) {
      const text = m < 0 ? 'このままでは帰れない！ 上へ戻ると、かばんの半分を失う' : `帰り道の砂が残りわずか！（余り ${m}）`;
      const bar = this.add.rectangle(0, GRID_Y, GAME_WIDTH, 24, 0x8a1020, 0.9).setOrigin(0);
      const label = addText(this, GAME_WIDTH / 2, GRID_Y + 12, text, { size: 12, bold: true, color: '#ffffff' }).setOrigin(0.5);
      this.root.add([bar, label]);
      this.tweens.add({ targets: bar, alpha: 0.45, duration: 420, yoyo: true, repeat: -1 });
      if (!this.warned) {
        this.warned = true;
        this.cameras.main.flash(300, 255, 60, 60);
      }
    } else if (m >= SAND_WARN) this.warned = false;
  }

  /** 道具の説明と「使う」（段階214） */
  private confirmTool(tool: DigToolId): void {
    if (this.overlay || this.moving) return;
    this.release();
    const t = DIG_TOOLS[tool];
    const o = this.openOverlay();
    o.add(addText(this, GAME_WIDTH / 2, 260, t.name, { size: 22, bold: true, color: '#e8c8ff' }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 300, t.note, { size: 13, align: 'center', wrap: GAME_WIDTH - 60, ja: true }).setOrigin(0.5, 0));
    addButton(this, o, GAME_WIDTH / 2, 400, 220, 52, '使う', { onTap: () => this.applyUse(useDigTool(this.def, this.s, tool), t.name) }, { fill: STYLE.red, italic: true, size: 16 });
    addButton(this, o, GAME_WIDTH / 2, 464, 220, 44, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
  }

  /** 技の説明と「使う」（段階214）。向きは最後に動いた向き */
  private confirmSkill(): void {
    if (this.overlay || this.moving) return;
    this.release();
    const id = SAND_BOTTOM_DIGGERS[run.dig?.digger ?? 'hero']?.skill ?? 'stop';
    const k = DIG_SKILLS[id];
    const dirName = { up: '上', down: '下', left: '左', right: '右' }[this.lastDir];
    const o = this.openOverlay();
    o.add(addText(this, GAME_WIDTH / 2, 260, `技「${k.name}」`, { size: 22, bold: true, color: '#9fd0ff' }).setOrigin(0.5));
    const aim = id === 'rush' || id === 'slash' ? `\n（今は ${dirName} 向き。最後に動いた向きに使う）` : '';
    o.add(addText(this, GAME_WIDTH / 2, 300, `${k.note}${aim}\n残り ${this.s.skillLeft} 回`, { size: 13, align: 'center', wrap: GAME_WIDTH - 60, ja: true }).setOrigin(0.5, 0));
    addButton(this, o, GAME_WIDTH / 2, 410, 220, 52, '使う', { onTap: () => this.applyUse(useDigSkill(this.def, this.s, id, this.lastDir), k.name, id === 'heal') }, { fill: STYLE.red, italic: true, size: 16 });
    addButton(this, o, GAME_WIDTH / 2, 474, 220, 44, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
  }

  /** 毒の砂（段階215）：みんなの HP が最大の rate だけ減る（1より下にはならない） */
  private hurtParty(rate: number): void {
    if (!run.dig) return;
    const vitals = { ...run.dig.vitals };
    for (const c of currentParty(storyBattleLineup())) {
      const v = vitals[c.id] ?? { hp: c.stats.hp, mp: c.stats.mp };
      vitals[c.id] = { ...v, hp: Math.max(1, v.hp - Math.round(c.stats.hp * rate)) };
    }
    run.dig = { ...run.dig, vitals };
  }

  /** 探し針（段階215）：いちばん近い宝箱・光る物・ぬしの巣を2つ照らし、向きを知らせる */
  private useNeedle(): string {
    const s = this.s;
    const marks = [
      ...Object.keys(s.chests).map((c) => ({ cell: Number(c), name: '宝箱' })),
      ...Object.keys(s.relics).map((c) => ({ cell: Number(c), name: '光る物' })),
      ...Object.keys(s.nests).map((c) => ({ cell: Number(c), name: 'ぬしの巣' })),
    ]
      .map((m) => ({ ...m, x: m.cell % s.width, y: Math.floor(m.cell / s.width) }))
      .sort((a, b) => Math.abs(a.x - s.x) + Math.abs(a.y - s.y) - (Math.abs(b.x - s.x) + Math.abs(b.y - s.y)))
      .slice(0, 2);
    if (marks.length === 0 || !run.dig) return '探し針は、何も指さなかった';
    const add: number[] = [];
    for (const m of marks) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) add.push((m.y + dy) * s.width + m.x + dx);
    run.dig = { ...run.dig, seen: [...(run.dig.seen ?? []), ...add] };
    const dirOf = (m: { x: number; y: number }) => `${m.y > s.y ? '下' : m.y < s.y ? '上' : ''}${m.x > s.x ? '右' : m.x < s.x ? '左' : ''}` || 'すぐそこ';
    return marks.map((m) => `${m.name}：${dirOf(m)} ${Math.abs(m.x - s.x) + Math.abs(m.y - s.y)}マス`).join('、');
  }

  /** 道具・技の結果を受ける（段階214）。heal は応急手当（HP を戻す） */
  private applyUse(r: { state: DigState; event: DigEvent }, name: string, heal = false): void {
    this.closeOverlay(false);
    const before = this.s;
    const e = r.event;
    if (e.type === 'blocked') {
      this.message = e.reason === 'sand' ? `砂が足りなくて、${name}を使えなかった` : `ここでは、${name}を使えなかった（掘れる所がない）`;
      this.render();
      return;
    }
    this.s = r.state;
    if (heal && run.dig) {
      const vitals = { ...run.dig.vitals };
      for (const c of currentParty(storyBattleLineup())) {
        const v = vitals[c.id];
        if (v) vitals[c.id] = { ...v, hp: Math.min(c.stats.hp, v.hp + Math.round(c.stats.hp * DIG_HEAL_SKILL_RATE)) };
      }
      run.dig = { ...run.dig, vitals };
    }
    const got = e.type === 'used' && e.items.length > 0 ? `（${e.items.map(itemName).join('・')} をかばんへ）` : '';
    this.message = `${name}！${got}`;
    if (e.type === 'used' && e.what === 'needle') this.message = `探し針！ ${this.useNeedle()}`;
    if (e.type === 'trap') this.message = `${name}！ ${this.eventText(e)}`;
    if (e.type === 'roamer') {
      this.render(before);
      this.time.delayedCall(MOVE_MS + 40, () => this.showFoe('roamer', e.id, e.battle, true));
      return;
    }
    this.moving = true;
    const ms = this.render(before);
    this.time.delayedCall(ms + REPEAT_MS, () => (this.moving = false));
  }

  /** 大きな十字のボタン（段階209）。押すと1マス、押したままだと続けて進む */
  private drawPad(enabled: boolean): void {
    const pads: [DigDir, number, number, string][] = [
      ['up', 0, -1, '▲'],
      ['left', -1, 0, '◀'],
      ['right', 1, 0, '▶'],
      ['down', 0, 1, '▼'],
    ];
    for (const [dir, ox, oy, label] of pads) {
      const x = PAD.x + ox * (PAD.w + PAD.gap);
      const y = PAD.y + oy * (PAD.h + PAD.gap);
      const pressed = this.held === dir;
      // 段階230（見た目の決まり）：十字のボタンは黒い地に白い枠（押している間は紅）。押しやすさのため形は四角のまま
      if (enabled) this.root.add(this.add.rectangle(x + 3, y + 3, PAD.w, PAD.h, 0x000000, 0.6));
      const rect = this.add.rectangle(x, y, PAD.w, PAD.h, pressed ? STYLE.red : 0x16141a, enabled ? 1 : 0.4).setStrokeStyle(2, 0xffffff, enabled ? 0.9 : 0.3);
      this.root.add(rect);
      this.root.add(addText(this, x, y, label, { size: 24, bold: true, color: !enabled ? '#667' : pressed ? '#ffffff' : STYLE.redText }).setOrigin(0.5));
      if (!enabled) continue;
      rect.setInteractive();
      rect.on('pointerdown', () => this.press(dir));
    }
    // 真ん中の砂時計の丸（段階230）
    this.root.add(this.add.circle(PAD.x, PAD.y, 24, STYLE.ink).setStrokeStyle(2, STYLE.red, 1));
    this.root.add(addText(this, PAD.x, PAD.y, '⏳', { size: 18 }).setOrigin(0.5));
  }

  private press(dir: DigDir): void {
    if (this.overlay) return;
    this.held = dir;
    this.holdTimer?.remove();
    this.tryStep(dir);
  }

  private release(): void {
    this.held = null;
    this.holdTimer?.remove();
    this.holdTimer = undefined;
  }

  /** 動いている間は受け付けない（動き終わったら moving を戻す。押したままなら update が次へ進める） */
  private tryStep(dir: DigDir): void {
    if (this.overlay || this.moving || this.s.outcome !== 'diving') return;
    const ms = this.step(dir);
    if (!this.moving) return;
    this.time.delayedCall(ms + REPEAT_MS, () => (this.moving = false));
  }

  update(): void {
    if (this.held && !this.moving && !this.overlay) this.tryStep(this.held);
  }

  /** 1手進める。動きにかかる時間（ミリ秒）を返す（動かない時は 0） */
  private step(dir: DigDir): number {
    const before = this.s;
    this.lastDir = dir;
    if (dir === 'left' || dir === 'right') this.facing = dir;
    const r = stepDig(this.def, before, dir);
    const e = r.event;
    if (e.type === 'chest') {
      this.release();
      this.render();
      this.showChest(e.cell);
      return 0;
    }
    if (e.type === 'guard') {
      this.release();
      this.render();
      this.showFoe('guard', e.cell, e.battle, false);
      return 0;
    }
    if (e.type === 'nest') {
      this.release();
      this.render();
      this.showFoe('nest', e.cell, e.battle, false);
      return 0;
    }
    if (e.type === 'relic') {
      this.release();
      this.takeRelicAt(e.cell, e.id);
      return 0;
    }
    // 掘ったか（行き先のブロックが、この手で変わった）
    const [dx, dy] = DIR_STEP[dir];
    const tx = before.x + dx;
    const ty = before.y + dy;
    const cell = ty * before.width + tx;
    const was = before.tiles[cell];
    const dig: DigAnim | undefined = r.state !== before && isSolid(was) && r.state.tiles[cell] !== was ? { x: tx, y: ty, tile: was, dir } : undefined;
    if (e.type === 'roamer') {
      this.release();
      // 自分から入った時は戻れる。追いつかれた時（動いた後）は戦うしかない
      const caught = r.state !== before;
      this.s = r.state;
      const ms = this.render(before, dig);
      this.moving = true;
      this.time.delayedCall(ms + 40, () => {
        this.moving = false;
        this.showFoe('roamer', e.id, e.battle, caught);
      });
      return ms + 40;
    }
    this.s = r.state;
    this.message = this.eventText(e);
    if (e.type === 'trap' && e.trap === 'poison') this.hurtParty(POISON_RATE);
    // 層に入った時に、その層の特徴を知らせる（段階215 の続き。開発者の案）
    const fromGroup = before.y > 0 ? digLayerAt(this.def, before.y).group : undefined;
    const toGroup = r.state.y > 0 ? digLayerAt(this.def, r.state.y).group : undefined;
    const f = toGroup ? SAND_BOTTOM_FEATURES[toGroup] : undefined;
    if (toGroup !== fromGroup && f) this.message = `${f.name}：${f.feature}${this.message ? `　${this.message}` : ''}`;
    if (e.type === 'blocked') {
      this.release();
      this.render();
      return 0;
    }
    this.moving = true;
    return this.render(before, dig);
  }

  private eventText(e: DigEvent): string {
    if (e.type === 'blocked') return e.reason === 'rock' ? (this.def.rockCost !== undefined ? '層の境目の岩は割れない。番人の所から下りる' : '岩だ。掘れない（ほかの道を探す）') : e.reason === 'sand' ? '砂時計の砂が足りない。上へ戻ろう' : '';
    if (e.type === 'dig' && !e.through) return '固い土だ。もう一度掘る';
    if (e.type === 'ore') return e.item ? (e.kept ? `鉱脈から ${itemName(e.item)} を掘り出した` : `かばんがいっぱいで、${itemName(e.item)} は砂に戻った`) : '鉱脈は空だった';
    if (e.type === 'grain') return `砂時計の砂粒！ 砂 +${e.sand}`;
    // 段階215：仕掛け
    if (e.type === 'trap') {
      if (e.trap === 'pit') return e.fall ? `落とし穴だ！ ${e.fall}マス落ちた` : '落とし穴だった（下が固くて、落ちずにすんだ）';
      if (e.trap === 'poison') return `毒の砂だ！ みんなの HP が ${Math.round(POISON_RATE * 100)}% 減った`;
      if (e.trap === 'whirl') return '流砂の渦に引き込まれた！ 砂時計の砂 −8';
      if (e.trap === 'spring') return e.jump ? `ばねで ${e.jump}マス跳ね上がった！` : 'ばねだ（上がふさがっていて跳ねられない）';
      if (e.trap === 'fossil') return e.items?.length ? `化石だ！ ${e.items.map(itemName).join('・')} をかばんへ` : '化石だ！（かばんがいっぱいで、何も持てない）';
    }
    const chasing = this.s.roamers.some((m) => m.chasing);
    return chasing ? '砂嵐がこちらに気づいた！' : '';
  }

  /**
   * 光る物を掘り当てた（段階213）。記憶の宝箱はギアがすぐ手に入る（かばんを使わない。負けても失わない）。
   * 落とし物は見つけた印を付け、声の会話があれば見てから砂の底へ戻る
   */
  private takeRelicAt(cell: number, id: string): void {
    const relic = parseRelic(id);
    // 珍品（段階217）
    if (relic?.kind === 'rare') {
      this.takeRare(cell, relic.ref);
      return;
    }
    // 道具の包み（段階214）：道具袋へ。いっぱいなら拾えない（その場に残る）
    if (relic?.kind === 'tool') {
      const t = DIG_TOOLS[relic.ref as DigToolId];
      if (this.s.tools.length >= (this.def.toolMax ?? 3)) {
        this.message = `${t?.name ?? '道具'}の包みです。道具袋がいっぱいなので、拾えません`;
        this.render();
        return;
      }
      this.s = { ...takeRelic(this.s, cell), tools: [...this.s.tools, relic.ref] };
      this.message = `道具の包み！ ${t?.name ?? relic.ref}を道具袋に入れました`;
      this.render();
      return;
    }
    this.s = takeRelic(this.s, cell);
    if (relic?.kind === 'gear') {
      const gears = relicGears(relic.ref);
      if (gears.length > 0) run.navi = addParts(run.navi, gears);
      setStoryVars({ ...run.vars, [huntGearKey(relic.ref)]: '1' });
      this.message = `記憶の宝箱！ ギアを手に入れました：${gears.map((g) => NAVI_DATA.parts[g]?.name ?? g).join('、')}`;
      this.render();
      return;
    }
    if (relic?.kind === 'lost') {
      // 段階220：声のかけら。掘り当てるたびに、写しの声を1つ聞く。全部聞くと、届けられる
      const def = LOST_ITEMS.find((d) => d.id === relic.ref);
      if (!def) {
        this.render();
        return;
      }
      const r = hearLostVoice(def, run.vars);
      setStoryVars(r.vars);
      this.cameras.main.flash(250, 200, 230, 255);
      this.message =
        r.no >= r.total
          ? `声のかけら（${r.no}/${r.total}）。「${def.name}」の声がそろった（拠点の落とし物の棚から、${def.owner}さんに届けられる）`
          : `声のかけら（${r.no}/${r.total}）。「${def.name}」の次のかけらは、また潜った時に埋まっている`;
      this.render();
      if (r.scene) this.openFindScene(r.scene);
      return;
    }
    this.render();
  }

  /** 珍品を掘り当てた（段階217）。素材はかばんへ（いっぱいなら残る）、スナップ・ギア・読み物はすぐ手に入る */
  private takeRare(cell: number, ref: string): void {
    const r = parseRare(ref);
    if (!r || !run.dig) return;
    if ((r.kind === 'item' || r.kind === 'oldItem') && this.s.bag.length >= this.def.bagMax) {
      this.message = '珍品が光っています。かばんがいっぱいなので、何かを捨ててから、もう一度掘ってください';
      this.render();
      return;
    }
    this.s = takeRelic(this.s, cell);
    run.dig = { ...run.dig, rareFound: true };
    this.cameras.main.flash(250, 255, 230, 160);
    if (r.kind === 'item' || r.kind === 'oldItem') {
      this.s = { ...this.s, bag: [...this.s.bag, r.id] };
      this.message = r.kind === 'item' ? `珍品！ ${itemName(r.id)}（砂の底でしか見つからない物）` : `物語のどこかで見かけた物が、砂に埋まっていました：${itemName(r.id)}`;
    } else if (r.kind === 'oldSnap' || r.kind === 'snap') {
      run.chainAlbum = gainSnaps(run.chainAlbum, [r.id]);
      run.library = recordLibraryFinds(run.library, { snaps: [r.id] });
      const name = CHAIN_SNAPS[r.id]?.name ?? r.id;
      this.message = r.kind === 'snap' ? `珍品！ レアスナップ「${name}」（砂の底でしか見つからない札）` : `物語のどこかで見かけたスナップが、砂に埋まっていました：${name}`;
    } else if (r.kind === 'oldGear' || r.kind === 'gear') {
      run.navi = addParts(run.navi, [r.id]);
      const name = NAVI_DATA.parts[r.id]?.name ?? r.id;
      this.message = r.kind === 'gear' ? `珍品！ レアギア「${name}」（砂の底でしか見つからないギア）` : `物語のどこかで見かけたギアが、砂に埋まっていました：${name}`;
    } else {
      const d = DIG_LORE.find((x) => x.id === r.id);
      setStoryVars({ ...run.vars, [digLoreVar(r.id)]: '1' });
      this.message = d?.kind === 'riku' ? '珍品！ りくの字のメモが、砂に埋まっていました' : '珍品！ 誰かの日記の切れ端が、砂に埋まっていました';
      this.render();
      if (d) this.showLore(d);
      return;
    }
    this.render();
  }

  /** 依頼の声のかけらの会話を見て、砂の底へ戻る（潜っている状態はそのまま） */
  private openFindScene(sceneId: string): void {
    const data: DialogueData = { scene: sceneId, vars: run.vars, seed: run.seed, next: { key: 'SandBottom', data: {} }, onVars: (vars) => setStoryVars(vars) };
    waitImages(this, dialogueImages([sceneId]), () => this.scene.start('Dialogue', data));
  }

  /** 宝箱：中身を見せて、かばんに入れる。いっぱいなら、かばんの1つと入れ替えるか、持たない */
  private showChest(cell: number): void {
    const o = this.openOverlay();
    const items = this.s.chests[cell] ?? [];
    const room = this.def.bagMax - this.s.bag.length;
    o.add(addText(this, GAME_WIDTH / 2, 150, '宝箱を見つけた', { size: 20, bold: true }).setOrigin(0.5).setFontStyle('bold italic').setShadow(3, 3, STYLE.redText, 0, false, true));
    items.forEach((id, i) => o.add(addText(this, GAME_WIDTH / 2, 190 + i * 24, `${rarityMark(id)} ${itemName(id)}`, { size: 16, bold: true }).setOrigin(0.5)));
    if (room >= items.length) {
      addButton(this, o, GAME_WIDTH / 2, 300, 240, 52, 'かばんに入れる', { onTap: () => this.take(cell) }, { fill: STYLE.red, italic: true, size: 16 });
      return;
    }
    if (room > 0) addButton(this, o, GAME_WIDTH / 2, 290, 260, 48, `入るだけ入れる（あと${room}個）`, { onTap: () => this.take(cell) }, { fill: STYLE.red, italic: true, size: 14 });
    o.add(addText(this, GAME_WIDTH / 2, 330, room > 0 ? '全部は入らない。入れ替えるなら、捨てる物を選ぶ' : 'かばんがいっぱい。入れ替えるなら、捨てる物を選ぶ', { size: 12, color: '#ff8a7a', bold: true }).setOrigin(0.5));
    const want = items[0];
    o.add(addText(this, GAME_WIDTH / 2, 352, `（${itemName(want)} と入れ替える）`, { size: 11, color: COLORS.subText }).setOrigin(0.5));
    this.s.bag.forEach((id, i) => {
      const y = 380 + i * 34;
      addButton(this, o, GAME_WIDTH / 2, y, 300, 30, `${rarityMark(id)} ${itemName(id)} を捨てる`, { onTap: () => this.swap(cell, i, want) }, { size: 12 });
    });
    addButton(this, o, GAME_WIDTH / 2, 380 + this.s.bag.length * 34 + 16, 200, 44, '今は持たない', { onTap: () => this.closeOverlay() }, { size: 14 });
  }

  private take(cell: number): void {
    this.s = takeChest(this.def, this.s, cell).state;
    this.message = 'かばんに入れました';
    this.closeOverlay();
  }

  private swap(cell: number, bagIndex: number, item: string): void {
    const dropped = this.s.bag[bagIndex];
    this.s = swapChest(this.s, cell, bagIndex, item);
    this.message = `${itemName(dropped)}を捨てて、${itemName(item)}を入れました`;
    this.closeOverlay();
  }

  /** 番人・砂嵐：戦うか、やめるか（追いつかれた時は戦うしかない） */
  private showFoe(kind: FoeKind, ref: number, battle: string, forced: boolean): void {
    const o = this.openOverlay();
    // 段階212：番人は稀に、その層の章のぬし
    const lord = kind === 'guard' && !!AREA_BATTLES[battle]?.boss;
    const title =
      kind === 'nest' ? `${AREA_BATTLES[battle]?.name ?? 'ぬし'}の巣だ` : lord ? `${AREA_BATTLES[battle].name}が、番人として現れた！` : kind === 'guard' ? '層の番人だ' : forced ? '砂嵐に追いつかれた！' : '砂嵐だ';
    const note = kind === 'guard' ? 'この番人を倒さないと、下へは行けない。\n' : kind === 'nest' ? '部位を壊すと、進化の鍵の素材が手に入る。\n' : '';
    const half = this.rewardRateOf(kind, ref) < 1 ? '\n（上の層なので、星の砂と経験値は半分）' : '';
    o.add(addText(this, GAME_WIDTH / 2, 200, title, { size: 22, bold: true, color: '#ff8a7a' }).setOrigin(0.5));
    o.add(
      addText(this, GAME_WIDTH / 2, 240, `${note}戦うと、砂時計の砂が ${this.def.cost.battle} 減る。\nHP・MP は、潜っている間ずっと持ち越す。\n負けると地上へ戻され、かばんの半分を失う${half}`, { size: 13, align: 'center', wrap: GAME_WIDTH - 60, ja: true }).setOrigin(0.5, 0),
    );
    addButton(this, o, GAME_WIDTH / 2, 400, 240, 52, '戦う', { onTap: () => this.fight(kind, ref, battle) }, { fill: STYLE.red, italic: true, size: 16 });
    if (!forced) addButton(this, o, GAME_WIDTH / 2, 464, 240, 44, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
  }

  /**
   * その戦闘の星の砂と経験値の割合（段階213）：いちばん深い章の層は満額、上の層は半分。
   * 番人は上の層（番人の行の1つ上）の物、ぬしの巣と砂嵐はいる所の層の物
   */
  private rewardRateOf(kind: FoeKind, ref: number): number {
    const s = this.s;
    const y = kind === 'roamer' ? (s.roamers.find((m) => m.id === ref)?.y ?? s.y) : Math.floor(ref / s.width) - (kind === 'guard' ? 1 : 0);
    return digRewardRate(this.def, digLayerAt(this.def, Math.max(1, y)).id, HUNT_OLD_AREA_RATE);
  }

  private fight(kind: FoeKind, ref: number, battle: string): void {
    const won = kind === 'guard' ? { wonGuard: ref } : kind === 'nest' ? { wonNest: ref } : { wonRoamer: ref };
    const data = {
      encounter: { battle, win: { key: 'SandBottom', data: won }, lose: { key: 'SandBottom', data: { lost: true } }, hunt: true, dig: true, rewardRate: this.rewardRateOf(kind, ref), seedShift: (run.dig?.count ?? 0) * 31 + this.s.steps },
    };
    // 敵の絵を読んでから戦闘へ
    this.cameras.main.flash(250, 255, 255, 255);
    waitImages(this, [...battleImages([battle]), ...commonImages()], () => this.scene.start('ChainBattle', data));
  }

  private goBack(): void {
    if (this.overlay || this.moving) return;
    this.release();
    const back = digBackCost(this.def, this.s);
    if (this.s.sand < back) {
      const o = this.openOverlay();
      o.add(addText(this, GAME_WIDTH / 2, 220, `帰り道に要る砂（${back}）が足りない。\n戻ると、かばんの半分を失う`, { size: 15, bold: true, align: 'center', color: '#ff8a7a' }).setOrigin(0.5));
      addButton(this, o, GAME_WIDTH / 2, 320, 240, 52, 'それでも戻る', { onTap: () => this.finishDive() }, { fill: STYLE.red, italic: true, size: 15 });
      addButton(this, o, GAME_WIDTH / 2, 384, 240, 44, 'やめる', { onTap: () => this.closeOverlay() }, { size: 14 });
      return;
    }
    this.finishDive();
  }

  private finishDive(): void {
    this.closeOverlay();
    this.s = goHome(this.def, this.s);
    this.render();
    this.showResult();
  }

  /** 帰った：持ち帰った物を受け取る。いちばん深い記録を超えたら「新記録」 */
  private showResult(): void {
    const s = this.s;
    const o = this.openOverlay(0.85);
    const record = Number(run.vars[SAND_BOTTOM_DEEPEST_VAR] ?? 0);
    const newRecord = s.deepest > record;
    const title = s.outcome === 'home' ? '砂の底から帰った' : s.outcome === 'late' ? '砂が落ちきった……' : '砂嵐に負けて、戻された';
    o.add(addText(this, GAME_WIDTH / 2, 120, title, { size: 22, bold: true, color: s.outcome === 'home' ? '#ffffff' : '#ff8a7a' }).setOrigin(0.5));
    o.add(addText(this, GAME_WIDTH / 2, 156, `いちばん深く：${s.deepest * SAND_BOTTOM_METERS_PER_ROW} m${newRecord ? '（新記録！）' : `（記録 ${record * SAND_BOTTOM_METERS_PER_ROW} m）`}`, { size: 13, bold: newRecord, color: newRecord ? '#ffd76a' : COLORS.subText }).setOrigin(0.5));
    if (s.outcome !== 'home') o.add(addText(this, GAME_WIDTH / 2, 176, `かばんの半分は、砂に戻った${s.tools.length > 0 ? '（道具袋の物も失った）' : ''}`, { size: 12, color: '#ff8a7a' }).setOrigin(0.5));
    const counts = new Map<string, number>();
    for (const id of s.bag) counts.set(id, (counts.get(id) ?? 0) + 1);
    const lines = [...counts].map(([id, n]) => `${rarityMark(id)} ${itemName(id)}${n > 1 ? ` ×${n}` : ''}`);
    o.add(addText(this, GAME_WIDTH / 2, 206, lines.length ? lines.join('\n') : '（何も持ち帰れなかった）', { size: 15, bold: true, align: 'center' }).setOrigin(0.5, 0).setLineSpacing(6));
    addButton(this, o, GAME_WIDTH / 2, GAME_HEIGHT - 120, 260, 52, '受け取る', { onTap: () => this.receive() }, { fill: STYLE.red, stroke: 0xffffff, strokeWidth: 2, italic: true, size: 16 });
  }

  private receive(): void {
    const s = this.s;
    run.armory = addItems(run.armory, s.bag);
    run.library = recordLibraryFinds(run.library, { items: s.bag });
    // 珍品の確率の覚え（段階217）：取った → 下がる、取らなかった → 外れた回数 +1
    // 段階218：ちゃんと潜った回（いちばん浅い章の層の宝の帯まで）だけ、回数と外れを進める
    setStoryVars(digAfterDive(run.vars, s.deepest >= digFullDepth(this.def), !!run.dig?.rareFound));
    // 道具袋に残った道具は、帰れば持ち物へ戻る（負けた・砂が尽きた時は失う。段階214）
    if (s.outcome === 'home' && s.tools.length > 0) {
      const back = Object.fromEntries([...new Set(s.tools)].map((t) => [digToolVar(t), String(Math.min(DIG_TOOL_OWN_MAX, this.stockOf(t) + s.tools.filter((x) => x === t).length))]));
      setStoryVars({ ...run.vars, ...back });
    }
    const record = Number(run.vars[SAND_BOTTOM_DEEPEST_VAR] ?? 0);
    run.dig = null;
    // いちばん深い記録をセーブに残す（段階209）
    if (s.deepest > record) setStoryVars({ ...run.vars, [SAND_BOTTOM_DEEPEST_VAR]: String(s.deepest) });
    saveRun();
    this.scene.start(run.active ? 'Hub' : 'Title');
  }

  private openOverlay(alpha = 0.7): Phaser.GameObjects.Container {
    this.closeOverlay(false);
    const o = this.add.container(0, 0).setDepth(50);
    o.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, alpha).setOrigin(0).setInteractive());
    this.overlay = o;
    return o;
  }

  private closeOverlay(redraw = true): void {
    const had = !!this.overlay;
    this.overlay?.destroy();
    this.overlay = undefined;
    if (had && redraw) this.render();
  }
}
