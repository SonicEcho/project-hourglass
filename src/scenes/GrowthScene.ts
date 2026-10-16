import Phaser from 'phaser';
import type { CharacterDef, GrowthNodeDef, StatKey } from '../core';
import { canEvolveAny, chapterLocked, claimRewardParts, countOf, findBattle, findBugs, findNode, getOpenError, hasSpare, isOpened, nodeCost, openableNodes, openNode, piecePosition, spareSnaps } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { AREAS, GROWTH_FRONTIER, GROWTH_MAP, GROWTH_STAR_NAMES, NAVI_REWARD_PICKS, PARTY, SKILLS, STORY, WEAPON_DATA } from '../data';
import { describeAction } from '../ui/describe';
import { describePart, partKindText } from '../ui/naviText';
import { drawPartShape } from '../ui/naviViews';
import { weightLabel } from '../ui/labels';
import { SIDE_PADDING } from '../ui/layout';
import { ALLY_COLOR, COLORS, RENDER_SCALE, toCss } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { maybeShowTip } from '../ui/tipPanel';
import { battleAt, currentNaviData, currentParty, getHubReturn, growthChapter, hubLineup, lineupBase, run, saveRun, setHubReturn, setStoryVars } from './run';
import { addWindow, countText, enterScreen, fadeOutAndDestroy, popIn, screenBg } from '../ui/skin';
import { addIcon } from '../ui/icons';

// 星図の画面（段階7）。縦持ち 390×844 に、星図と操作を1画面で収める。
// 段階56：星図は夏の大三角のまわりの本物の星座の形（src/data/growthMap.ts）。画面より大きいので、枠の中を指でずらして見る。
// 星のタップ・長押し・ドラッグは、画面の入力で見分ける（星図は描き直しても、ずらした位置を覚えておく）

/** 星図を見せる枠（画面の座標） */
const VIEW = { x: 0, y: 50, w: GAME_WIDTH, h: 440 } as const;
/** 下の説明の枠と、キャラの切り替えの位置 */
const INFO_TOP = VIEW.y + VIEW.h + 6;
const TABS_TOP = INFO_TOP + 128;
/** 星をタップしたと見なす近さ・ドラッグと見なす動き・長押しの時間 */
const TAP_RANGE = 24;
const DRAG_SLOP = 10;
const LONG_PRESS_MS = 500;
/** 出発点の星の大きさ（駒を並べる位置に使う） */
const NODE_R = 12;
/** 星図の夜空（段階32a 調整2）：またたく星の数、星がきらめく間（ミリ秒） */
const SKY = { stars: 70, twinkleMs: 1300 } as const;

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
  doubleSlash: 'Wスラッシュ',
  inspiration: 'ひらめき',
};


export class GrowthScene extends Phaser.Scene {
  private charId = 'hero';
  private selected: string | null = null;
  /** 前に出した星の砂の数（段階32a 調整1） */
  private shownPoints: number | null = null;
  private message = '';
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  /** 勝利の報酬で選んでいるギアの候補の番号 */
  private rewardChosen: number[] = [];
  /** 星図（枠の外は隠す。段階56） */
  private mapLayer!: Phaser.GameObjects.Container;
  /** 星図をずらした量（描き直しても覚えておく） */
  private pan = { x: 0, y: 0 };

  constructor() {
    super('Growth');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.shownPoints = null;
    this.makeNightSky();
    this.root = this.add.container(0, 0);
    this.overlay = undefined;
    this.selected = null;
    this.message = '';
    this.rewardChosen = [];
    // パーティにいない仲間を選んでいたら、先頭の仲間にする（段階26）
    const members = lineupBase(hubLineup());
    if (!members.some((c) => c.id === this.charId)) this.charId = members[0].id;
    this.noticeGrownMap();
    // 星図の入れ物：枠の外は隠す。はじめは今のキャラの駒が見えるように
    this.mapLayer = this.add.container(0, 0).setDepth(1);
    this.mapLayer.setMask(this.make.graphics({}).fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h).createGeometryMask());
    this.centerOn(piecePosition(run.growth, this.charId));
    this.setupMapInput();
    this.render();
    // ギアの報酬は試作の5戦だけ（ムーブメントが閉じている間は出さない）
    if (run.pendingReward !== null && hubLineup().unlocks.navi) this.showReward();
    else maybeShowTip(this, ['growth_star']);
  }

  /** 章が進んで星図の区域が増えていたら、初めて開いた時に一度だけ知らせる（段階49。見たことは物語の値に覚える） */
  private noticeGrownMap(): void {
    const now = growthChapter(hubLineup());
    if (!Number.isFinite(now)) return;
    const chapters = [...new Set(GROWTH_MAP.nodes.flatMap((n) => (n.chapter !== undefined && n.chapter <= now ? [n.chapter] : [])))];
    const fresh = chapters.filter((c) => run.vars[`星図:広がった:${c}`] !== '1');
    if (fresh.length === 0) return;
    this.message = '星図が広がった！　上の方に、新しい星が現れた';
    setStoryVars({ ...run.vars, ...Object.fromEntries(fresh.map((c) => [`星図:広がった:${c}`, '1'])) });
  }

  /** デバッグメニューから星の砂が変わった時に描き直す */
  refresh(): void {
    if (this.scene.isActive()) this.render();
  }

  private base(id = this.charId): CharacterDef {
    return PARTY.find((c) => c.id === id)!;
  }

  private tapNode(nodeId: string): void {
    const err = getOpenError(GROWTH_MAP, run.growth, this.base(), nodeId, growthChapter(hubLineup()));
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
    run.growth = openNode(GROWTH_MAP, run.growth, this.base(), nodeId, growthChapter(hubLineup()));
    this.message = `${this.base().name}：${nodeTitle(node, this.base())}を開けた`;
    console.log('[growth]', this.charId, nodeId, `points=${run.growth.points}`);
    this.selected = null;
    this.render();
  }

  // ---- 描画 ----

  private render(): void {
    // 変えたら描き直すので、ここで自動セーブする（中身が同じなら書き込まない）
    saveRun();
    this.root.removeAll(true);
    const g = run.growth;
    const base = this.base();
    const lineup = hubLineup();
    const members = lineupBase(lineup);
    const party = currentParty(lineup);
    const back = getHubReturn();
    this.root.add(screenBg(this));

    // 上：見出しと星の砂
    const next = back ? null : battleAt(run.progress);
    const area = run.explore ? AREAS[run.explore.area] : undefined;
    // 見出しのアイコン（段階32a 調整2）
    this.root.add(addIcon(this, 'star', SIDE_PADDING + 9, 20, 18, COLORS.accent));
    this.root.add(addText(this, SIDE_PADDING + 24, 8, '星図', { size: 17, bold: true }));
    this.root.add(
      addText(this, SIDE_PADDING, 32, back ? `${area?.name ?? ''}のチェックポイント` : `次：${next ? `${next.name}（${next.enemies.map((e) => e.name).join('・')}）` : 'なし'}`, {
        size: 11,
        color: COLORS.subText,
      }),
    );
    this.root.add(addText(this, GAME_WIDTH - SIDE_PADDING, 6, '星の砂', { size: 10, color: COLORS.subText }).setOrigin(1, 0));
    const pointsText = addText(this, GAME_WIDTH - SIDE_PADDING, 20, `${g.points}`, { size: 24, bold: true, color: COLORS.accentText }).setOrigin(1, 0);
    this.root.add(pointsText);
    // マスを開けて減った時などは、前の数から数えるように動く（段階32a 調整1）
    countText(this, pointsText, this.shownPoints ?? g.points, g.points, (v) => `${v}`);
    this.shownPoints = g.points;

    this.drawMap(members);

    this.drawInfo(base, party.find((c) => c.id === this.charId)!);
    this.drawTabs(party);

    // ムーブメントと武器へ（並べる。開いているものだけ。段階26）。アルバムは、入れ替えられるスナップがある時だけ（探索のチェックポイント。段階41）
    // 3つ並ぶ時は幅が狭いので、アイコンを省いて文字を短く・小さくする
    const subs: ((x: number, w: number, compact: boolean) => void)[] = [];
    if (lineup.unlocks.navi) {
      subs.push((x, w, compact) => {
        const naviBugs = members.reduce((sum, c) => sum + findBugs(currentNaviData(), run.navi, c.id).length, 0);
        const loose = run.navi.parts.filter((p) => !p.placement).length;
        const label = compact
          ? `ムーブメント\nはめていない${loose}${naviBugs > 0 ? ` 狂い${naviBugs}` : ''}`
          : `ムーブメント\nはめていない ${loose}${naviBugs > 0 ? `・狂い ${naviBugs}` : ''}`;
        addButton(this, this.root, x, 733, w, 44, label, { onTap: () => this.scene.start('Navi') }, {
          fill: 0x1e3a5a,
          stroke: 0x5aa8ff,
          strokeWidth: 2,
          size: compact ? 10 : 12,
          bold: true,
        });
        if (!compact) this.root.add(addIcon(this, 'gear', x - w / 2 + 18, 733, 16, 0x5aa8ff));
      });
    }
    if (lineup.unlocks.weapon) {
      subs.push((x, w, compact) => {
        const fragments = Object.values(run.armory.fragments).reduce((sum, n) => sum + n, 0);
        const items = Object.values(run.armory.items).reduce((sum, n) => sum + n, 0);
        const evolvable = members.some((c) => canEvolveAny(WEAPON_DATA, run.armory, c.id));
        const stock = compact ? `素材${items}・欠片${fragments}` : `素材 ${items}・記憶の欠片 ${fragments}`;
        addButton(
          this,
          this.root,
          x,
          733,
          w,
          44,
          `武器\n${evolvable ? '進化できる！' : stock}`,
          { onTap: () => this.scene.start('Weapon') },
          evolvable
            ? { fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 3, size: compact ? 10 : 12, bold: true, textColor: COLORS.accentText }
            : { fill: 0x4a2a1e, stroke: 0xff9a5a, strokeWidth: 2, size: compact ? 10 : 12, bold: true },
        );
        if (!compact) this.root.add(addIcon(this, 'weapon', x - w / 2 + 18, 733, 16, evolvable ? COLORS.accent : 0xff9a5a));
      });
    }
    if (back && hasSpare(run.album)) {
      subs.push((x, w, compact) => {
        const spare = countOf(spareSnaps(run.album));
        addButton(this, this.root, x, 733, w, 44, `アルバム\n入れていない ${spare}枚`, { onTap: () => this.scene.start('Album') }, {
          fill: 0x3a2a5a,
          stroke: 0xa98be0,
          strokeWidth: 2,
          size: compact ? 10 : 12,
          bold: true,
        });
        if (!compact) this.root.add(addIcon(this, 'support', x - w / 2 + 18, 733, 16, 0xa98be0));
      });
    }
    // 1つだけなら横いっぱいに
    const gap = 6;
    const subW = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (subs.length - 1)) / Math.max(1, subs.length);
    subs.forEach((draw, i) => draw(SIDE_PADDING + subW / 2 + i * (subW + gap), subW, subs.length >= 3));

    // 下：次の戦闘へ
    addButton(
      this,
      this.root,
      GAME_WIDTH / 2,
      792,
      GAME_WIDTH - SIDE_PADDING * 2,
      52,
      back ? '探索へ戻る' : next ? `${next.name}へ` : '結果へ',
      {
        onTap: () => {
          if (!back) {
            this.scene.start('Battle', { progress: run.progress });
            return;
          }
          setHubReturn(null);
          this.scene.start(back.key, back.data);
        },
      },
      { fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2, size: 17, bold: true },
    );
  }

  /**
   * 星図の後ろの夜空（段階32a 調整2）：小さな星がまたたき、開けたマスがときどききらめく。
   * 画面を開いた時に1回だけ作る（マスを開けるたびの描き直しでは作り直さない）
   */
  private makeNightSky(): void {
    for (let i = 0; i < SKY.stars; i++) {
      const star = this.add.circle(Phaser.Math.Between(4, GAME_WIDTH - 4), Phaser.Math.Between(VIEW.y, VIEW.y + VIEW.h), Math.random() < 0.15 ? 1.4 : 0.8, 0xffffff, 0.2);
      star.setDepth(-50);
      this.tweens.add({ targets: star, alpha: { from: 0.15, to: 0.85 }, duration: Phaser.Math.Between(900, 2600), delay: Phaser.Math.Between(0, 2000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.time.addEvent({
      delay: SKY.twinkleMs,
      loop: true,
      callback: () => {
        const opened = GROWTH_MAP.nodes.filter((n) => isOpened(run.growth, this.charId, n.id));
        const n = opened[Math.floor(Math.random() * opened.length)];
        if (!n || this.overlay) return;
        // 星図の上の位置を画面の位置にする（枠の外の星はきらめかせない）
        const x = n.x + this.mapLayer.x;
        const y = n.y + this.mapLayer.y;
        if (x < VIEW.x || x > VIEW.x + VIEW.w || y < VIEW.y || y > VIEW.y + VIEW.h) return;
        // 4つの角の光を、大きくしてから小さくする（形を描き直して動かす）
        const gx = x + 6;
        const gy = y - 6;
        const glint = this.add.graphics().setDepth(50);
        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 520,
          onUpdate: (t) => {
            const r = 7 * Math.sin(Math.PI * (t.getValue() ?? 1));
            const w = r * 0.22;
            if (!glint.active) return;
            glint.clear().fillStyle(0xffffff, 0.95);
            glint.fillPoints([gx, gy - r, gx + w, gy - w, gx + r, gy, gx + w, gy + w, gx, gy + r, gx - w, gy + w, gx - r, gy, gx - w, gy - w].reduce<Phaser.Math.Vector2[]>((ps, v, i, a) => (i % 2 ? ps : [...ps, new Phaser.Math.Vector2(v, a[i + 1])]), []), true);
          },
          onComplete: () => glint.destroy(),
        });
      },
    });
  }

  /** 星図をずらした量を、範囲の中に収めて入れ物に反映する */
  private applyPan(): void {
    this.pan.x = Phaser.Math.Clamp(this.pan.x, Math.min(0, VIEW.w - GROWTH_MAP.width), 0);
    this.pan.y = Phaser.Math.Clamp(this.pan.y, Math.min(0, VIEW.h - GROWTH_MAP.height), 0);
    this.mapLayer.setPosition(VIEW.x + this.pan.x, VIEW.y + this.pan.y);
  }

  /** その星が枠の真ん中あたり（少し上）に来るように、ずらす */
  private centerOn(nodeId: string): void {
    const n = findNode(GROWTH_MAP, nodeId);
    if (!n) return;
    this.pan = { x: VIEW.w / 2 - n.x, y: VIEW.h * 0.55 - n.y };
    this.applyPan();
  }

  /** 星図の上の指：ドラッグでずらす、タップで星を選ぶ、長押しで星の説明（段階56） */
  private setupMapInput(): void {
    let start: { x: number; y: number; px: number; py: number; at: number } | null = null;
    let moved = false;
    let longTimer: Phaser.Time.TimerEvent | undefined;
    const inView = (p: Phaser.Input.Pointer) => {
      const at = this.cameras.main.getWorldPoint(p.x, p.y);
      return at.x >= VIEW.x && at.x <= VIEW.x + VIEW.w && at.y >= VIEW.y && at.y <= VIEW.y + VIEW.h ? at : null;
    };
    /** 指の位置に一番近い、見えている星（TAP_RANGE より遠ければ null） */
    const starAt = (x: number, y: number) => {
      const mx = x - this.mapLayer.x;
      const my = y - this.mapLayer.y;
      let best: GrowthNodeDef | null = null;
      let bestD = TAP_RANGE;
      for (const n of GROWTH_MAP.nodes) {
        if (chapterLocked(n, growthChapter(hubLineup()))) continue;
        const d = Math.hypot(n.x - mx, n.y - my);
        if (d <= bestD) {
          best = n;
          bestD = d;
        }
      }
      return best;
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      const at = inView(p);
      if (!at || this.overlay || over.length > 0) return;
      start = { x: at.x, y: at.y, px: this.pan.x, py: this.pan.y, at: this.time.now };
      moved = false;
      longTimer?.remove();
      longTimer = this.time.delayedCall(LONG_PRESS_MS, () => {
        if (!start || moved) return;
        const n = starAt(start.x, start.y);
        start = null;
        if (n) this.showDetail(nodeTitle(n, this.base()), nodeDetail(n, this.base()));
      });
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!start || !p.isDown) return;
      const at = this.cameras.main.getWorldPoint(p.x, p.y);
      const dx = at.x - start.x;
      const dy = at.y - start.y;
      if (!moved && Math.hypot(dx, dy) > DRAG_SLOP) moved = true;
      if (!moved) return;
      this.pan = { x: start.px + dx, y: start.py + dy };
      this.applyPan();
    });
    this.input.on('pointerup', () => {
      longTimer?.remove();
      if (!start) return;
      const was = start;
      start = null;
      if (moved) return;
      const n = starAt(was.x, was.y);
      if (n) this.tapNode(n.id);
    });
  }

  /** 星図：天の川、星座の名前、道、星、駒（段階56。まだ章が来ていない区域は描かない） */
  private drawMap(members: CharacterDef[]): void {
    const layer = this.mapLayer;
    layer.removeAll(true);
    const g = run.growth;
    const chapter = growthChapter(hubLineup());
    const shown = (n: GrowthNodeDef) => !chapterLocked(n, chapter);
    const color = ALLY_COLOR[this.charId] ?? COLORS.ally;
    const byId = new Map(GROWTH_MAP.nodes.map((n) => [n.id, n]));

    // 星図の空（触れる範囲が分かるように、うっすら塗る）と、小さな飾りの星（いつも同じ並び）
    layer.add(this.add.rectangle(0, 0, GROWTH_MAP.width, GROWTH_MAP.height, 0x0a0f2c, 0.35).setOrigin(0));
    const deco = this.add.graphics();
    for (let i = 0; i < 260; i++) {
      const h = (k: number) => Math.abs(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
      deco.fillStyle(0xffffff, 0.15 + h(3) * 0.4).fillCircle(h(1) * GROWTH_MAP.width, h(2) * GROWTH_MAP.height, 0.5 + h(4) * 1.1);
    }
    layer.add(deco);
    // 天の川：はくちょう座の背骨から、や座を通って、わし座の西へ（本物の位置）
    const river = ['deneb', 'sadr', 'etaCyg', 'albireo', 'alphaSge', 'deltaAql', 'lambdaAql'].map((id) => byId.get(id)).filter((n): n is GrowthNodeDef => !!n);
    // 道に沿って薄い円を重ね、ぼんやりした帯にする
    const band = this.add.graphics();
    for (let i = 0; i + 1 < river.length; i++) {
      const [a, b] = [river[i], river[i + 1]];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6);
      for (let k = 0; k < steps; k++) {
        const t = k / steps;
        const [x, y] = [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
        band.fillStyle(0x9fb8ff, 0.006).fillCircle(x, y, 84);
        band.fillStyle(0x9fb8ff, 0.008).fillCircle(x, y, 60);
        band.fillStyle(0xb8c8ff, 0.01).fillCircle(x, y, 36);
      }
    }
    layer.add(band);

    // 星座の名前（その星座の星が1つでも見えていれば）
    for (const [con, c] of Object.entries(GROWTH_MAP.constellations ?? {})) {
      if (!GROWTH_MAP.nodes.some((n) => n.con === con && shown(n))) continue;
      layer.add(addText(this, c.x, c.y, c.name, { size: 12, color: '#c8d4ff' }).setOrigin(0.5).setAlpha(0.6).setLetterSpacing(3));
    }

    // 道：開けた道は今のキャラの色で光らせる。星座と星座をつなぐ橋は点線
    const openable = new Set(openableNodes(GROWTH_MAP, g, this.charId).map((n) => n.id));
    const lines = this.add.graphics();
    for (const [ia, ib] of GROWTH_MAP.edges) {
      const a = byId.get(ia);
      const b = byId.get(ib);
      if (!a || !b || !shown(a) || !shown(b)) continue;
      const lit = isOpened(g, this.charId, a.id) && isOpened(g, this.charId, b.id);
      if (lit) {
        lines.lineStyle(10, color, 0.16).lineBetween(a.x, a.y, b.x, b.y);
        lines.lineStyle(3, color, 1).lineBetween(a.x, a.y, b.x, b.y);
      } else if (a.con !== b.con) dashedLine(lines, a.x, a.y, b.x, b.y, 0x9fb8e8, 0.5, 5, 4);
      else lines.lineStyle(1.2, 0x9fb8e8, 0.45).lineBetween(a.x, a.y, b.x, b.y);
    }
    // 将来の星座へつなぐ場所：外へ向かう薄い点線と「？」
    for (const f of GROWTH_FRONTIER) {
      const n = byId.get(f.node);
      if (!n || !shown(n)) continue;
      const len = Math.hypot(f.dx, f.dy);
      const [ex, ey] = [n.x + (f.dx / len) * 46, n.y + (f.dy / len) * 46];
      dashedLine(lines, n.x, n.y, ex, ey, 0x9fb8e8, 0.4, 2, 5);
      layer.add(addText(this, ex + (f.dx / len) * 9, ey + (f.dy / len) * 9, '？', { size: 12, color: '#c8d4ff' }).setOrigin(0.5).setAlpha(0.55));
    }
    layer.add(lines);

    // 星
    for (const n of GROWTH_MAP.nodes) if (shown(n)) this.drawStar(n, openable.has(n.id));

    // 駒（今のキャラは大きく）。パーティにいない仲間の駒は出さない
    members.forEach((c, i) => {
      const p = byId.get(piecePosition(g, c.id))!;
      // 星の右に、真ん中・下・上の順に（上と左は、星の名前や隣の星の文字と重なりやすい）
      const offset = [
        { x: NODE_R + 10, y: 0 },
        { x: NODE_R + 10, y: 16 },
        { x: NODE_R + 10, y: -16 },
      ][i];
      const current = c.id === this.charId;
      const r = current ? 9 : 6;
      layer.add(this.add.circle(p.x + offset.x, p.y + offset.y, r, ALLY_COLOR[c.id] ?? COLORS.ally).setStrokeStyle(current ? 2 : 1, 0xffffff));
      if (current) layer.add(addText(this, p.x + offset.x, p.y + offset.y, c.name.slice(0, 1), { size: 10, bold: true }).setOrigin(0.5));
    });
  }

  /** 星：能力値は色つきの光（大は輪つき）、魔法・スキルは金の四つ角の星、出発点は仲間の色の大きな星（段階56） */
  private drawStar(n: GrowthNodeDef, openable: boolean): void {
    const layer = this.mapLayer;
    const g = run.growth;
    const { x, y } = n;
    const opened = isOpened(g, this.charId, n.id);
    const selected = this.selected === n.id;
    const alpha = opened ? 1 : openable ? 0.9 : 0.55;
    let color = 0xffffff;
    let r = 6;
    let label = '';
    if (n.kind === 'start') {
      color = ALLY_COLOR[n.owner] ?? COLORS.ally;
      r = NODE_R;
      label = PARTY.find((c) => c.id === n.owner)?.name ?? '';
    } else if (n.kind === 'skill') {
      color = 0xffd76a;
      r = 10;
      label = SKILL_SHORT[n.skillId] ?? n.skillId;
    } else {
      color = STAT_COLOR[n.stat];
      r = n.kind === 'statBig' ? 8.5 : 6;
      label = `${STAT_SHORT[n.stat]}${n.amount}`;
    }
    const shape = this.add.graphics();
    // まわりの光
    shape.fillStyle(color, (opened ? 0.3 : 0.12) * alpha).fillCircle(x, y, r * 2.4);
    shape.fillStyle(color, (opened ? 0.25 : 0.1) * alpha).fillCircle(x, y, r * 1.6);
    if (n.kind === 'skill') {
      const a = r * 1.5;
      const w = r * 0.35;
      shape.fillStyle(color, alpha).fillPoints(
        [[x, y - a], [x + w, y - w], [x + a, y], [x + w, y + w], [x, y + a], [x - w, y + w], [x - a, y], [x - w, y - w]].map(([px, py]) => new Phaser.Math.Vector2(px, py)),
        true,
      );
    } else {
      shape.fillStyle(color, alpha).fillCircle(x, y, r);
      shape.fillStyle(0xffffff, alpha).fillCircle(x, y, r * 0.45);
    }
    if (n.kind === 'statBig') shape.lineStyle(1, 0xffffff, 0.6 * alpha).strokeCircle(x, y, r + 3);
    // 開けられる星は点線の輪、選んだ星は太い輪
    if (openable && !selected) dashedCircle(shape, x, y, r + 7, COLORS.accent, 1, 16);
    if (selected) shape.lineStyle(3, COLORS.select, 1).strokeCircle(x, y, r + 7);
    layer.add(shape);
    layer.add(
      addText(this, x, y + r + 11, label, {
        size: n.kind === 'start' || n.kind === 'skill' ? 11 : 10,
        bold: opened || openable,
        color: opened || openable ? '#e8eefc' : '#a9bbd0',
      }).setOrigin(0.5).setAlpha(Math.max(0.7, alpha)),
    );
    // 有名な星の名前（小さく）
    const name = GROWTH_STAR_NAMES[n.id];
    if (name && n.name) {
      const [dx, dy, side] = name;
      layer.add(addText(this, x + dx, y + dy, n.name, { size: 9, color: '#c8d4ff' }).setOrigin(side === 'right' ? 1 : side === 'center' ? 0.5 : 0, 0.5).setAlpha(0.75));
    }
    // 他のキャラが開けた星に小さな印
    lineupBase(hubLineup()).forEach((c, i) => {
      if (c.id === this.charId || !isOpened(g, c.id, n.id)) return;
      layer.add(this.add.circle(x - 6 + i * 6, y + r + 22, 2.5, ALLY_COLOR[c.id] ?? COLORS.ally));
    });
  }

  /** 選んだマスの説明と「開ける」ボタン */
  private drawInfo(base: CharacterDef, grown: CharacterDef): void {
    const top = INFO_TOP;
    const h = 120;
    this.root.add(this.add.rectangle(SIDE_PADDING, top, GAME_WIDTH - SIDE_PADDING * 2, h, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(1, COLORS.border));
    const n = this.selected ? findNode(GROWTH_MAP, this.selected) : undefined;
    if (!n) {
      const lines = [
        this.message || `${base.name}の駒を進める。点線の輪の星（開けられる星）をタップ。星図は指でずらせる`,
        `星の砂は${lineupBase(hubLineup()).length}人共通。誰にどう使うかを選ぼう`,
        `${base.name}：HP ${grown.stats.hp}　MP ${grown.stats.mp}　攻撃 ${grown.stats.atk}　魔力 ${grown.stats.mag}　防御 ${grown.stats.def}　速さ ${grown.stats.spd}`,
      ];
      this.root.add(addText(this, SIDE_PADDING + 10, top + 10, lines.join('\n'), { size: 12, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 20 }));
      return;
    }
    const cost = nodeCost(GROWTH_MAP, run.growth, base, n.id);
    const err = getOpenError(GROWTH_MAP, run.growth, base, n.id, growthChapter(hubLineup()));
    const opened = isOpened(run.growth, base.id, n.id);
    const status = opened
      ? '開けた'
      : err === 'not enough memory points'
        ? `星の砂が足りない（${cost}pt）`
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
    const top = TABS_TOP;
    const n = party.length;
    const gap = 6;
    const w = (GAME_WIDTH - SIDE_PADDING * 2 - gap * (n - 1)) / n;
    party.forEach((c, i) => {
      const x = SIDE_PADDING + i * (w + gap);
      const active = c.id === this.charId;
      const rect = this.add.rectangle(x, top, w, 72, active ? COLORS.panelLight : COLORS.panel).setRounded(8).setOrigin(0);
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
          // 切り替えたキャラの駒が見えるように
          this.centerOn(piecePosition(run.growth, c.id));
          this.render();
        },
        onLongPress: () => this.showDetail(c.name, characterDetail(c, this.base(c.id))),
      });
    });
  }

  /** 勝利の報酬：ギアの候補から決まった数を選ぶ（選ぶまで閉じない） */
  private showReward(): void {
    this.closeOverlay();
    const battleId = run.pendingReward;
    if (battleId === null) return;
    const candidates = findBattle(STORY, battleId)?.naviReward ?? [];
    const picks = Math.min(NAVI_REWARD_PICKS, candidates.length);
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0).setInteractive());
    const top = 150;
    const itemH = 104;
    const h = 120 + candidates.length * (itemH + 8) + 70;
    c.add(addWindow(this, 14, top, GAME_WIDTH - 28, h));
    c.add(addText(this, GAME_WIDTH / 2, top + 16, 'ギアを手に入れた！', { size: 20, bold: true, color: COLORS.accentText }).setOrigin(0.5, 0));
    c.add(
      addText(this, GAME_WIDTH / 2, top + 50, `${candidates.length}つの中から${picks}つ選ぶ（${this.rewardChosen.length}/${picks}）
ムーブメントではめると効く`, {
        size: 13,
        align: 'center',
        color: COLORS.subText,
      }).setOrigin(0.5, 0),
    );
    candidates.forEach((id, i) => {
      const def = currentNaviData().parts[id];
      const y = top + 104 + i * (itemH + 8);
      const chosen = this.rewardChosen.includes(i);
      const rect = this.add.rectangle(26, y, GAME_WIDTH - 52, itemH, chosen ? 0x2f4f3a : COLORS.panelLight).setRounded(8).setOrigin(0);
      rect.setStrokeStyle(chosen ? 3 : 1, chosen ? 0x6dff9e : COLORS.border);
      c.add(rect);
      drawPartShape(this, c, def, 0, 38, y + 14, 16);
      c.add(addText(this, 110, y + 10, `${chosen ? '✔ ' : ''}${def.name}`, { size: 16, bold: true, color: chosen ? '#6dff9e' : COLORS.text }));
      c.add(addText(this, 110, y + 36, `${describePart(def)}
${partKindText(def)}`, { size: 11, wrap: GAME_WIDTH - 150 }));
      makePressable(rect, {
        onTap: () => {
          if (chosen) this.rewardChosen = this.rewardChosen.filter((x) => x !== i);
          else if (this.rewardChosen.length < picks) this.rewardChosen = [...this.rewardChosen, i];
          this.showReward();
        },
      });
    });
    addButton(
      this,
      c,
      GAME_WIDTH / 2,
      top + h - 40,
      240,
      52,
      '受け取る',
      {
        onTap: () => {
          run.navi = claimRewardParts(run.navi, candidates, this.rewardChosen, picks);
          console.log('[navi] reward', this.rewardChosen.map((x) => candidates[x]).join(','));
          run.pendingReward = null;
          this.rewardChosen = [];
          this.closeOverlay();
          this.message = 'ギアを受け取った。「ムーブメント」ではめよう';
          this.render();
        },
      },
      { enabled: this.rewardChosen.length === picks, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2, size: 17, bold: true },
    );
    this.overlay = c;
    popIn(this, c);
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

// ---- マスとキャラの説明 ----

function nodeTitle(n: GrowthNodeDef, base: CharacterDef): string {
  if (n.kind === 'start') {
    if (n.owner === base.id) return `${base.name}の出発点`;
    // まだパーティにいない仲間の名前は出さない（段階26）
    const owner = lineupBase(hubLineup()).find((c) => c.id === n.owner);
    return owner ? `${owner.name}の出発点` : 'まだいない仲間の出発点';
  }
  if (n.kind === 'skill') return SKILLS[n.skillId as keyof typeof SKILLS]?.name ?? n.skillId;
  return `${STAT_LABEL[n.stat]}+${n.amount}${n.kind === 'statBig' ? '（大）' : ''}`;
}

function nodeDetail(n: GrowthNodeDef, base: CharacterDef): string {
  if (n.kind === 'start') return n.owner === base.id ? 'ここから駒を進める' : '他のキャラの出発点。通るだけ（効果なし）';
  if (n.kind === 'skill') {
    const def = SKILLS[n.skillId as keyof typeof SKILLS];
    if (!def) return '';
    const known = currentParty(hubLineup())
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

/** 点線（段階56。星座と星座をつなぐ橋、将来の星座への道） */
function dashedLine(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, color: number, alpha: number, dash: number, gap: number): void {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
  g.lineStyle(1.2, color, alpha);
  for (let d = 0; d < len; d += dash + gap) {
    const e = Math.min(len, d + dash);
    g.lineBetween(x1 + ux * d, y1 + uy * d, x1 + ux * e, y1 + uy * e);
  }
}

/** 点線の輪（段階56。開けられる星） */
function dashedCircle(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha: number, pieces: number): void {
  g.lineStyle(1.8, color, alpha);
  const step = (Math.PI * 2) / pieces;
  for (let i = 0; i < pieces; i++) {
    g.beginPath();
    g.arc(x, y, r, i * step, i * step + step * 0.55);
    g.strokePath();
  }
}
