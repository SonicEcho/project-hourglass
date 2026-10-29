import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { DailyHub, DailyPlace, DailySpot, SpotMark } from '../core';
import { addParts, allSpots, blockers, bondGauge, bondPoints, huntableAreas, spotGears, finishesAfter, isSeen, markVisited, picksLeft, requiredLeft, resolveHub, returnDays, spotState, visitsFor } from '../core';
import { AREAS, BACKDROPS, BGM, BOND_EVENTS, BOND_PARTNER_NAMES, BOND_POINTS, DAILY_HUBS, HUB_FROM_CHAPTER, HUB_SPOT, NAVI_DATA, RETURN_VISITS, SLICE_FLOW, TOWN } from '../data';
import { drawBackdrop } from '../ui/backdrop';
import { COLORS, RENDER_SCALE, toCss } from '../ui/theme';
import { addButton, addText, makePressable } from '../ui/widgets';
import { playBgm, startAmbience, stopAmbience } from '../audio/sound';
import { openOptions } from '../ui/options';
import type { DialogueData } from './DialogueScene';
import { run, saveRun, setStoryVars, storyLineup } from './run';

// 昼の日常（段階24）：地図から場所を選び、場所の絵に出ている印をタップして出来事を見る。
// プロローグの屋台めぐりも同じ画面（場所が1つ、画面の下に「けいかくひょう」、4つ見ると次へ）。
// 見た印は、物語で覚えた値（run.vars）に入れてセーブする。日常を終えたら、物語の流れへ done で戻る。
// 段階35：昼に選べる回数（絆の出来事と小話）と、相手ごとの絆の出来事。画面を開くたびに、今の値で日常を組み立てる（resolveHub）
// 段階36：返した翌日に持ち主に会う出来事（RETURN_VISITS）も、返した記録から組み立てる
// 段階50：返した区画があれば、時計屋にレストピアの拠点の入口（HUB_SPOT。段階43の狩りの入口から替えた）。回数を使わず、拠点の画面へ

/** Phaser はデータを渡さずに開くと前のデータを使い回すので、この画面を開く時は必ず全部渡す（なければ undefined を書く） */
export interface DailyData {
  /** 物語の流れの出来事の id（DAILY_HUBS の id） */
  event: string;
  /** 開く場所（なければ地図。場所が1つの時は、その場所） */
  place?: string;
  /** 見終えて戻ってきた印 */
  finished?: string;
}

/** 印の色と、中に書く字 */
// word は記号に添える短い言葉（段階98。レビューの E3：記号だけでは意味が分かりにくかった）
const MARK_STYLE: Record<SpotMark, { color: number; icon: string; word: string }> = {
  main: { color: 0xe0563e, icon: '！', word: '必ず見る' },
  bond: { color: 0xe07aa0, icon: '♥', word: '絆' },
  talk: { color: 0x5aa8ff, icon: '…', word: '小話' },
  stall: { color: 0xf0a040, icon: '★', word: '屋台' },
  go: { color: 0xd9ae62, icon: '→', word: '夕暮れへ' },
  hub: { color: 0x7a5ad0, icon: '扉', word: '拠点' },
};
/** 「保存しました」を出した昼（段階98。同じ昼の中で場所を行き来するたびには出さない） */
let savedNoticeFor: string | null = null;
/** 地図の場所の丸の大きさ（段階98。レビューの F4 で 46 から大きくした） */
const PLACE_RADIUS = 52;

/** 今の値で、その日の日常を組み立てる（絆の出来事と、返した翌日の出来事を足す） */
function build(data: DailyHub): DailyHub {
  const visits = visitsFor(data, RETURN_VISITS, returnDays(SLICE_FLOW, run.event, run.returned));
  // レストピアの拠点の入口（段階50）：返した区画が1つでもあり、2章から（段階60。1章は物語に集中する）
  const hub = (storyLineup().chapter ?? 1) >= HUB_FROM_CHAPTER && huntableAreas(AREAS, run.returned).length > 0 ? HUB_SPOT : undefined;
  return resolveHub(data, run.vars, BOND_EVENTS, TOWN, visits, hub);
}

export class DailyScene extends Phaser.Scene {
  private hub!: DailyHub;
  private eventId = '';

  constructor() {
    super('Daily');
  }

  create(data: DailyData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.eventId = data.event;
    const data0 = DAILY_HUBS[data.event];
    if (!data0) throw new Error(`no daily hub ${data.event}`);
    // 町の昼（何日目かがある日常）は日常の曲。重い場面を無音や別の曲にした後でも、昼に戻ると日常の曲になる（段階73）。屋台めぐりはプロローグの曲のまま
    if (data0.day !== undefined) playBgm(this, BGM.daily);
    let gearNote = '';
    if (data.finished) {
      const hub = build(data0);
      const spot = hub.places.flatMap((p) => p.spots).find((s) => s.id === data.finished);
      if (spot) {
        // ごほうびのギア（段階39。返した翌日に持ち主がくれる物）
        const gears = spotGears(hub, run.vars, spot);
        if (gears.length > 0) {
          run.navi = addParts(run.navi, gears);
          gearNote = `ギアを手に入れた！　${gears.map((g) => NAVI_DATA.parts[g]?.name ?? g).join('、')}`;
        }
        const end = finishesAfter(hub, run.vars, spot);
        setStoryVars(markVisited(hub, run.vars, spot));
        if (end) {
          this.finish();
          return;
        }
      }
    }
    const hub = build(data0);
    this.hub = hub;
    const place = hub.places.find((p) => p.id === data.place) ?? (hub.places.length === 1 ? hub.places[0] : null);
    if (place) this.showPlace(place);
    else this.showMap();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    // 段階98（レビューの D2）：その日の昼に初めて入った時だけ、保存したことを小さく知らせる（ここでやめても、この昼から始められる）。
    // 段階124（レビューの項目1）：実際に保存できた時だけ「保存しました」と言う。書き込めない時は、上の「未保存」の印（ui/saveNotice.ts）と一緒に知らせる
    const saved = saveRun();
    if (gearNote) this.toast(gearNote);
    else if (data0.day !== undefined && savedNoticeFor !== data.event) {
      if (saved === 'failed') this.toast('保存できませんでした（ここでやめると、前に保存した所から）。上の印をタップすると、もう一度保存する', true);
      else if (saved !== 'skipped') this.toast('保存しました（ここでやめても、この昼から始められる）');
    }
    savedNoticeFor = data.event;
  }

  /** 日常を終えて、物語の次の出来事へ */
  private finish(): void {
    this.scene.start('Flow', { done: true });
  }

  private reopen(place?: string): void {
    const data: DailyData = { event: this.eventId, place, finished: undefined };
    this.scene.restart(data);
  }

  private header(root: Phaser.GameObjects.Container, title: string): void {
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, 96, 0x000000, 0.55).setOrigin(0));
    // 左上はオプション（音の設定と「タイトルへ戻る」。段階32b 調整4）。題は画面の真ん中に
    addButton(this, root, 52, 36, 84, 44, 'オプション', {
      onTap: () => openOptions(this, { depth: 100, links: [{ label: 'タイトルへ戻る', onTap: () => this.scene.start('Title') }] }),
    }, { size: 12 });
    root.add(addText(this, GAME_WIDTH / 2, 22, this.hub.time, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    root.add(addText(this, GAME_WIDTH / 2, 50, title, { size: 18, bold: true }).setOrigin(0.5));
    // 昼に選べる回数（段階35）
    const left = picksLeft(this.hub, run.vars);
    if (Number.isFinite(left)) root.add(addText(this, GAME_WIDTH / 2, 80, `昼に選べるのは、あと${left}回`, { size: 12, color: COLORS.accentText }).setOrigin(0.5));
  }

  /** 地図：場所を選ぶ。まだ見ていない印がある場所には、その印を添える */
  private showMap(): void {
    stopAmbience();
    const root = this.add.container(0, 0);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1712).setOrigin(0));
    // 町の地図（仮）：格子の道と、場所の円（段階35：場所の位置は町じゅうで同じ。data/daily.ts の TOWN）
    const g = this.add.graphics();
    g.fillStyle(0x2a241c, 1).fillRoundedRect(20, 120, GAME_WIDTH - 40, 560, 16);
    g.lineStyle(14, 0x4a4030, 1);
    const xs = [...new Set(Object.values(TOWN).map((p) => p.mapX))];
    const ys = [...new Set(Object.values(TOWN).map((p) => p.mapY))];
    for (const x of xs) g.lineBetween(x, Math.min(...ys), x, Math.max(...ys));
    for (const y of ys) g.lineBetween(Math.min(...xs), y, Math.max(...xs), y);
    root.add(g);
    const places = this.hub.places;
    this.header(root, 'どこへ行く？');
    for (const place of places) {
      const open = place.spots.filter((s) => spotState(this.hub, run.vars, s) === 'open' && !s.ends && s.mark !== 'hub');
      const fill = place.spots.some((s) => s.ends) ? 0x6a5420 : 0x30465c;
      const circle = this.add.circle(place.mapX, place.mapY, PLACE_RADIUS, fill).setStrokeStyle(3, COLORS.accent);
      root.add(circle);
      root.add(addText(this, place.mapX, place.mapY, place.name, { size: 17, bold: true }).setOrigin(0.5));
      makePressable(circle, { onTap: () => this.reopen(place.id) });
      open.forEach((s, i) => {
        const st = MARK_STYLE[s.mark];
        const bx = place.mapX + 38 + i * 22;
        root.add(this.add.circle(bx, place.mapY - 42, 13, st.color).setStrokeStyle(2, 0xffffff));
        root.add(addText(this, bx, place.mapY - 42, st.icon, { size: 13, bold: true }).setOrigin(0.5));
      });
      // 丸の下に、見られる出来事の種類を言葉で（段階98。「絆・小話」など）
      const words = [...new Set(open.map((s) => MARK_STYLE[s.mark].word))];
      if (words.length > 0) root.add(addText(this, place.mapX, place.mapY + PLACE_RADIUS + 12, words.join('・'), { size: 11, color: COLORS.accentText }).setOrigin(0.5));
    }
    const left = requiredLeft(this.hub, run.vars);
    const lines = [left.length > 0 ? `必ず見る：${left.map((s) => s.label).join('、')}` : '印のある場所で出来事が見られる。時計屋へ行くと、夕暮れになる'];
    // 段階125（レビューの項目48）：拠点の扉も回数を使わない
    const hasHub = allSpots(this.hub).some((s) => s.mark === 'hub');
    if (this.hub.picks !== undefined) lines.push(`昼に選べるのは${this.hub.picks}回（♥絆と…小話）。！${hasHub ? 'と扉' : ''}は数えない`);
    // 段階83：相手のいる小話は、その日に見ると♥が半分増える。段階125（レビューの項目49）：後から拠点で読んでも増えないので「その日に見た時だけ」と書く
    if (this.hub.picks !== undefined && allSpots(this.hub).some((s) => s.with)) lines.push('…小話は、その日に見た時だけ絆の帯が半分進む');
    root.add(addText(this, GAME_WIDTH / 2, 730, lines.join('\n'), { size: 13, color: COLORS.subText, align: 'center', wrap: GAME_WIDTH - 50 }).setOrigin(0.5));
    this.drawBonds(root, 790);
  }

  /**
   * 絆の深さ（段階35。段階83 から、その日に見た小話の半分も数える）。段階110：♥を並べると増えた時に見づらいので、
   * 相手ごとに「Lv」（絆の出来事の分）と、次の Lv までの短い帯（小話の半分）で見せる
   */
  private drawBonds(root: Phaser.GameObjects.Container, y: number): void {
    const partners = this.hub.partners ?? [];
    if (partners.length === 0) return;
    const colW = Math.min(118, (GAME_WIDTH - 40) / partners.length);
    const x0 = GAME_WIDTH / 2 - (colW * partners.length) / 2;
    root.add(addText(this, x0 - 6, y, '絆', { size: 13, bold: true, color: toCss(MARK_STYLE.bond.color) }).setOrigin(1, 0.5));
    partners.forEach((p, i) => {
      const { level, progress } = bondGauge(bondPoints(run.vars, p, BOND_EVENTS, DAILY_HUBS, BOND_POINTS), BOND_POINTS);
      const x = x0 + i * colW + 4;
      const name = addText(this, x, y - 8, BOND_PARTNER_NAMES[p] ?? p, { size: 12, bold: true }).setOrigin(0, 0.5);
      root.add(name);
      root.add(addText(this, x + colW - 12, y - 8, `Lv${level}`, { size: 12, bold: true, color: COLORS.accentText }).setOrigin(1, 0.5));
      const barW = colW - 16;
      root.add(this.add.rectangle(x, y + 8, barW, 6, 0x2a3b4e).setOrigin(0, 0.5));
      if (progress > 0) root.add(this.add.rectangle(x, y + 8, barW * progress, 6, MARK_STYLE.bond.color).setOrigin(0, 0.5));
    });
  }

  /** 場所の絵と、そこに出ている印 */
  private showPlace(place: DailyPlace): void {
    const root = this.add.container(0, 0);
    const def = BACKDROPS[place.backdrop] ?? BACKDROPS.black;
    // 屋台の並ぶ参道などは、人混みの音を小さく鳴らし続ける（段階32b 調整3）
    if (def.ambienceSe) startAmbience(this, def.ambienceSe);
    else stopAmbience();
    drawBackdrop(this, root, def, 0, GAME_HEIGHT, true);
    this.header(root, place.name);
    for (const spot of place.spots) this.drawSpot(root, place, spot);
    if (this.hub.places.length > 1) {
      addButton(this, root, GAME_WIDTH / 2, 780, 200, 52, '地図へ戻る', { onTap: () => this.reopen(undefined) }, { size: 15 });
    }
    if (this.hub.plan) this.drawPlan(root);
  }

  private drawSpot(root: Phaser.GameObjects.Container, place: DailyPlace, spot: DailySpot): void {
    const state = spotState(this.hub, run.vars, spot);
    const st = MARK_STYLE[spot.mark];
    const holder = this.add.container(spot.x, spot.y);
    const color = state === 'open' ? st.color : 0x55606a;
    const circle = this.add.circle(0, 0, 30, color).setStrokeStyle(3, state === 'open' ? 0xffffff : 0x8090a0);
    holder.add(circle);
    holder.add(addText(this, 0, 0, state === 'seen' ? '✓' : st.icon, { size: 22, bold: true }).setOrigin(0.5));
    // 記号の上に、出来事の種類を言葉で（段階98）
    holder.add(addText(this, 0, -44, st.word, { size: 11, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    const label = addText(this, 0, 46, spot.label, { size: 14, bold: true, align: 'center', wrap: 300 }).setOrigin(0.5);
    holder.add(this.add.rectangle(0, 46, label.width + 16, label.height + 8, 0x000000, 0.6));
    holder.add(label);
    root.add(holder);
    if (state === 'open') {
      // 見られる印は、ゆっくり脈打つ
      this.tweens.add({ targets: circle, scale: 1.12, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    }
    makePressable(circle, { onTap: () => this.tapSpot(place, spot) });
  }

  private tapSpot(place: DailyPlace, spot: DailySpot): void {
    if (spot.mark === 'hub') {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(260, () => this.scene.start('Hub', { seen: undefined }));
      return;
    }
    const state = spotState(this.hub, run.vars, spot);
    if (state === 'locked') {
      this.toast(`先に見ておきたい出来事がある：${blockers(this.hub, run.vars, spot).map((s) => s.label).join('、')}`);
      return;
    }
    if (state === 'seen') {
      this.toast('ここは、もう見た');
      return;
    }
    if (state === 'spent') {
      this.toast(`今日は、もう時間がない（昼に選べるのは${this.hub.picks ?? 0}回まで）`);
      return;
    }
    const go = () => {
      if (!spot.scene) {
        this.finish();
        return;
      }
      const data: DialogueData = {
        scene: spot.scene,
        vars: run.vars,
        seed: run.seed,
        next: { key: 'Daily', data: { event: this.eventId, place: place.id, finished: spot.id } satisfies DailyData },
        onVars: (vars) => setStoryVars(vars),
      };
      this.scene.start('Dialogue', data);
    };
    if (spot.confirm) this.confirm(spot.confirm, go);
    else go();
  }

  /**
   * 屋台めぐりの「けいかくひょう」：子どものりくの字で、回る屋台の一覧。回った屋台に赤い丸。
   * 子どもの手書き風の書体で、1文字ずつ少し傾け、大きさと高さをそろえずに書く（段階32b 調整3）
   */
  private drawPlan(root: Phaser.GameObjects.Container): void {
    const spots = this.hub.places.flatMap((p) => p.spots).filter((s) => s.required);
    const w = GAME_WIDTH - 48;
    const h = 200;
    // 紙ごと少し傾ける（中の字も一緒に傾く）
    const paper = this.add.container(GAME_WIDTH / 2, 590 + h / 2).setAngle(-1.5);
    root.add(paper);
    const left = -w / 2;
    const top = -h / 2;
    paper.add(this.add.rectangle(0, 0, w, h, 0xf4ecd8, 0.95).setStrokeStyle(2, 0x8a6a2a));
    this.scribble(paper, left + 18, top + 28, this.hub.plan ?? '', 24, 1);
    // 右の列は、長い名前（きんぎょすくい）のために少し広く
    const cols = [
      { left, w: w * 0.46 },
      { left: left + w * 0.46, w: w * 0.54 },
    ];
    spots.forEach((s, i) => {
      const { left: colLeft, w: colW } = cols[i % 2];
      const cy = top + 84 + Math.floor(i / 2) * 58;
      const boxX = colLeft + 20;
      const textX = boxX + 22;
      // 長い名前は、赤い丸ごと列に収まるよう、字を小さくする
      const room = colLeft + colW - 26 - textX;
      let size = 18;
      let written = this.scribble(paper, textX, cy, s.planLabel ?? s.label, size, i + 2);
      while (written.width > room && size > 12) {
        written.holder.destroy();
        size -= 1;
        written = this.scribble(paper, textX, cy, s.planLabel ?? s.label, size, i + 2);
      }
      const textW = written.width;
      if (isSeen(run.vars, s.id)) {
        // 回った屋台に、赤い丸（りくの字）。丸は字の幅に合わせ、紙（その列）からはみ出さないように収める
        const ringW = Math.min(textW + 22, colLeft + colW - 12 - (boxX + 12));
        const ringX = Math.min(textX + textW / 2, colLeft + colW - 12 - ringW / 2);
        paper.add(this.add.ellipse(ringX, cy, ringW, 42).setStrokeStyle(3, 0xc8402f).setAngle(-5));
        paper.add(addText(this, boxX, cy, '✓', { size: 22, bold: true, color: '#c8402f' }).setOrigin(0.5));
      } else {
        paper.add(addText(this, boxX, cy, '□', { size: 20, color: '#3a2a20' }).setOrigin(0.5));
      }
    });
  }

  /**
   * 子どもの字で1行書く（左の端 x、行の真ん中 y）。1文字ずつ、傾き・大きさ・高さ・字間を少しずつ変える。
   * 揺れ方は seed で決まる（開くたびに字が変わらないように）。字を入れた入れ物と、書いた幅を返す
   */
  private scribble(parent: Phaser.GameObjects.Container, x: number, y: number, text: string, size: number, seed: number): { holder: Phaser.GameObjects.Container; width: number } {
    // 1文字ずつ置くので、全文は入れ物に書いておく（通しの自動確認が文で探せるように）
    const holder = this.add.container(0, 0).setData('text', text);
    parent.add(holder);
    let cx = x;
    [...text].forEach((ch, i) => {
      // 小さな決まった乱数（-1〜1）
      const r = (k: number) => Math.sin((seed * 31 + i * 7 + k) * 12.9898) % 1;
      const t = addText(this, 0, 0, ch, { size: Math.round(size * (1 + r(1) * 0.1)), color: '#3a2a20', hand: true }).setOrigin(0, 0.5);
      t.setPosition(cx, y + r(2) * 2.5).setAngle(r(3) * 7);
      holder.add(t);
      cx += t.width * 0.94 + r(4) * 1.5;
    });
    return { holder, width: cx - x };
  }

  private confirm(text: string, onYes: () => void): void {
    const cx = GAME_WIDTH / 2;
    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(this.add.rectangle(cx, 420, 320, 220, COLORS.panel).setRounded(8).setStrokeStyle(1, COLORS.border));
    panel.add(addText(this, cx, 370, text, { size: 15, align: 'center', wrap: 280 }).setOrigin(0.5));
    addButton(this, panel, cx - 75, 470, 130, 52, 'はい', { onTap: onYes }, { size: 16, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 });
    addButton(this, panel, cx + 75, 470, 130, 52, 'いいえ', { onTap: () => panel.destroy(true) }, { size: 16 });
  }

  private toast(text: string, warn = false): void {
    const t = addText(this, GAME_WIDTH / 2, 130, text, { size: 13, align: 'center', wrap: GAME_WIDTH - 40, color: warn ? COLORS.allyDamage : undefined }).setOrigin(0.5).setDepth(60);
    const bg = this.add.rectangle(GAME_WIDTH / 2, 130, t.width + 24, t.height + 14, 0x000000, 0.8).setDepth(59);
    this.tweens.add({ targets: [t, bg], alpha: 0, delay: 1800, duration: 400, onComplete: () => (t.destroy(), bg.destroy()) });
  }
}
