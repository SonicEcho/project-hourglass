import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { DailyHub, DailyPlace, DailySpot, SpotMark } from '../core';
import { addParts, allSpots, blockers, bondGauge, bondPoints, expireBondEvents, spotGears, finishesAfter, isSeen, markVisited, picksLeft, requiredLeft, resolveHub, returnDays, spotState, visitsFor } from '../core';
import { ALLY_FACE, BACKDROPS, BGM, FACE_CROPS, BOND_EVENTS, BOND_PARTNER_NAMES, BOND_POINTS, DAILY_HUBS, HUB_FROM_CHAPTER, HUB_SPOT, NAVI_DATA, RETURN_VISITS, SIDE_EVENTS, SLICE_FLOW, TOWN } from '../data';
import { drawBackdrop } from '../ui/backdrop';
import { COLORS, RENDER_SCALE, toCss, STYLE } from '../ui/theme';
import { addButton, addSlant, addText, makePressable } from '../ui/widgets';
import { addWindow } from '../ui/skin';
import { backButton } from '../ui/frame';
import { faceImage } from '../ui/portrait';
import { hasImage } from '../assets/loader';
import { playBgm, startAmbience, stopAmbience } from '../audio/sound';
import { openOptions } from '../ui/options';
import { startWithImages } from '../ui/waitImages';
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
  // 段階239：寄り道（サブイベント）。昼に選べる回数は使わない
  side: { color: 0x3fbf8a, icon: '？', word: '寄り道' },
};
/** 「保存しました」を出した昼（段階98。同じ昼の中で場所を行き来するたびには出さない） */
let savedNoticeFor: string | null = null;
/** 町の地図の絵を置く所（段階246。見出しと説明の窓の間。絵は 2:3） */
const MAP_TOP = 68;
const MAP_H = 585;
/** 地図の場所をタップで拾う丸の大きさ（段階246。いちばん近い商店街とパン屋は 44 離れている） */
const PLACE_HIT = 22;
/** 説明の窓の上の端（段階246） */
const LEGEND_TOP = 662;

/** 今の値で、その日の日常を組み立てる（絆の出来事と、返した翌日の出来事を足す） */
function build(data: DailyHub): DailyHub {
  const visits = visitsFor(data, RETURN_VISITS, returnDays(SLICE_FLOW, run.event, run.returned));
  // レストピアの拠点の入口（段階50）：返した区画が1つでもあり、2章から（段階60。1章は物語に集中する）
  // 段階213：狩りを外したので、返した区画があれば出す（前は狩りに入れる区画がある時）
  const hub = (storyLineup().chapter ?? 1) >= HUB_FROM_CHAPTER && run.returned.length > 0 ? HUB_SPOT : undefined;
  // 段階239：寄り道の連作（昼に選べる回数は使わない）
  return resolveHub(data, run.vars, BOND_EVENTS, TOWN, visits, hub, SIDE_EVENTS);
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
    // 段階153：「何日目まで」を過ぎた絆の出来事は、飛ばした印を付ける（出さずに、絆の点だけ入れる）
    if (data0.day !== undefined) {
      const expired = expireBondEvents(run.vars, BOND_EVENTS, data0.day);
      if (expired !== run.vars) setStoryVars(expired);
    }
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
      else if (saved !== 'skipped' && saved !== 'stale') this.toast('保存しました（ここでやめても、この昼から始められる）');
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

  /**
   * 見出し（段階246：ほかの画面と同じ形。左にオプション、時間帯と斜体の題。右上に「昼に選べる あと2」）
   */
  private header(root: Phaser.GameObjects.Container, title: string): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.9, 0.9, 0.55, 0.55);
    g.fillRect(0, 0, GAME_WIDTH, MAP_TOP);
    root.add(g);
    // 左上はオプション（音の設定と「タイトルへ戻る」。段階32b 調整4）
    addButton(this, root, 42, 34, 70, 34, 'オプション', {
      onTap: () => openOptions(this, { depth: 100, links: [{ label: 'タイトルへ戻る', onTap: () => this.scene.start('Title') }] }),
    }, { size: 11 });
    root.add(addText(this, 88, 12, this.hub.time, { size: 11, color: COLORS.subText }));
    const t = addText(this, 88, 26, title, { size: 21, bold: true });
    t.setFontStyle('bold italic').setShadow(3, 3, STYLE.redText, 0, false, true);
    root.add(t);
    // 昼に選べる回数（段階35）
    const left = picksLeft(this.hub, run.vars);
    if (Number.isFinite(left)) {
      const rx = GAME_WIDTH - 14;
      root.add(addText(this, rx, 10, '昼に選べる', { size: 10, color: COLORS.subText }).setOrigin(1, 0));
      const v = addText(this, rx, 22, `あと ${left}`, { size: 24, bold: true, color: STYLE.yellowText }).setOrigin(1, 0);
      v.setFontStyle('bold italic');
      root.add(v);
    }
  }

  /**
   * 地図（段階246。M3_ui_polish.md の 18-2 の案 D-1）：町の見下ろしの絵を少し暗く敷き、場所は建物の位置に小さな点。
   * 印のある場所だけ、光・名前・印の丸を出し、絆の出来事の相手の顔を添える。点のまわりをタップすると、その場所へ
   */
  private showMap(): void {
    stopAmbience();
    const root = this.add.container(0, 0);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, STYLE.ink).setOrigin(0));
    if (hasImage(this, 'map.town')) root.add(this.add.image(0, MAP_TOP, 'map.town').setOrigin(0).setDisplaySize(GAME_WIDTH, MAP_H));
    else root.add(this.add.rectangle(0, MAP_TOP, GAME_WIDTH, MAP_H, 0x2a2630).setOrigin(0));
    // 町は少し暗くして、行ける所の光を目立たせる
    root.add(this.add.rectangle(0, MAP_TOP, GAME_WIDTH, MAP_H, 0x000000, 0.4).setOrigin(0));
    const places = this.hub.places;
    const lit = places.map((place) => {
      const open = place.spots.filter((s) => spotState(this.hub, run.vars, s) === 'open' && !s.ends);
      return { place, open, on: open.length > 0 || place.spots.some((s) => s.ends) };
    });
    // 暗い場所を先に、光る場所を後に描く（名前と印が上に来るように）
    for (const { place, open, on } of [...lit.filter((l) => !l.on), ...lit.filter((l) => l.on)]) {
      const { mapX: x, mapY: y } = place;
      if (on) {
        const glow = this.add.circle(x, y, 26, STYLE.yellow, 0.22);
        root.add(glow);
        this.tweens.add({ targets: glow, scale: 1.25, alpha: 0.1, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
        root.add(this.add.circle(x, y, 6, 0xffffff).setStrokeStyle(2, STYLE.red));
        const name = addText(this, x, y + 16, place.name, { size: 12, bold: true }).setOrigin(0.5);
        name.setFontStyle('bold italic').setStroke('#000000', 3).setShadow(2, 2, STYLE.redText, 0, false, true);
        root.add(name);
      } else {
        root.add(this.add.circle(x, y, 4.5, 0xffffff, 0.85).setStrokeStyle(1.5, 0x000000, 0.7));
      }
      open.forEach((s, i) => {
        const st = MARK_STYLE[s.mark];
        const bx = x + 16 + i * 24;
        root.add(this.add.circle(bx, y - 16, 11, st.color).setStrokeStyle(2, 0xffffff));
        root.add(addText(this, bx, y - 16, st.icon, { size: 11, bold: true, color: '#111111' }).setOrigin(0.5));
      });
      // 絆の出来事の相手の顔（その日に、その場所で会える）
      const partners = [...new Set(open.map((s) => s.partner).filter((p): p is string => !!p))];
      partners.forEach((p, i) => {
        const fx = x - 30 - i * 30;
        root.add(this.add.circle(fx, y - 12, 16, MARK_STYLE.bond.color));
        const id = ALLY_FACE[p];
        if (id && hasImage(this, id)) root.add(faceImage(this, id, fx, y - 12, 14, FACE_CROPS[p]));
        else root.add(addText(this, fx, y - 12, (BOND_PARTNER_NAMES[p] ?? p).slice(0, 1), { size: 13, bold: true }).setOrigin(0.5));
      });
      const hit = this.add.circle(x, y, PLACE_HIT, 0x000000, 0.001);
      root.add(hit);
      makePressable(hit, { onTap: () => this.reopen(place.id) });
    }
    this.header(root, 'どこへ行く？');
    this.drawLegend(root);
    this.drawBonds(root, 800);
  }

  /**
   * 説明の窓（段階246）：今日ある印を色の札で並べ、決まりを1文に1つ書く（ゲームのルール説明の口調）
   */
  private drawLegend(root: Phaser.GameObjects.Container): void {
    const spots = allSpots(this.hub);
    const marks = (['main', 'bond', 'talk', 'side', 'hub'] as SpotMark[]).filter((m) => spots.some((s) => s.mark === m));
    const left = requiredLeft(this.hub, run.vars);
    const lines: string[] = [];
    if (left.length > 0) lines.push(`！必ず見る：${left.map((s) => s.label).join('、')}`);
    else lines.push('印のある場所で、出来事を見られます。時計屋へ行くと、夕暮れになります。');
    if (this.hub.picks !== undefined) {
      lines.push(`♥絆・…小話は、昼に${this.hub.picks}つまで選べます。`);
      // 段階125（レビューの項目48）・段階239：必ず見る・寄り道・拠点の扉は、選べる数に入らない
      const free = ['！', ...(marks.includes('side') ? ['？'] : []), ...(marks.includes('hub') ? ['扉'] : [])];
      lines.push(`${free.join('・')}は、選べる数に入りません。`);
      // 段階83・段階125（レビューの項目49）：相手のいる小話は、その日に見た時だけ絆の帯が進む
      if (spots.some((s) => s.with)) lines.push('…小話をその日に見ると、絆の帯が少し進みます。');
    }
    const body = addText(this, 26, 0, lines.join('\n'), { size: 11, color: COLORS.text, wrap: GAME_WIDTH - 60, ja: true });
    body.setLineSpacing(3);
    const chipsH = marks.length > 0 ? 24 : 0;
    const h = 14 + chipsH + body.height + 12;
    root.add(addWindow(this, 10, LEGEND_TOP, GAME_WIDTH - 20, h));
    let cx = 26;
    for (const m of marks) {
      const st = MARK_STYLE[m];
      const label = addText(this, 0, LEGEND_TOP + 20, `${st.icon} ${m === 'hub' ? 'レストピア' : st.word}`, { size: 10, bold: true, color: '#111111' }).setOrigin(0, 0.5);
      const w = label.width + 14;
      root.add(addSlant(this, cx + w / 2, LEGEND_TOP + 20, w, 16, st.color));
      root.add(label.setX(cx + 7));
      cx += w + 4;
    }
    root.add(body.setY(LEGEND_TOP + 12 + chipsH));
  }

  /**
   * 絆の深さ（段階35。段階83 から、その日に見た小話の半分も数える）。段階110：相手ごとに「Lv」（絆の出来事の分）と、次の Lv までの短い帯（小話の半分）。
   * 段階246：相手の顔・名前・Lv・帯を、2人までなら横に並べる
   */
  private drawBonds(root: Phaser.GameObjects.Container, y: number): void {
    const partners = this.hub.partners ?? [];
    if (partners.length === 0) return;
    // 右下の設定の歯車（どの画面にも出る）に重ならないよう、右を空ける
    const colW = (GAME_WIDTH - 28 - 36) / partners.length;
    partners.forEach((p, i) => {
      const { level, progress } = bondGauge(bondPoints(run.vars, p, BOND_EVENTS, DAILY_HUBS, BOND_POINTS), BOND_POINTS);
      const x = 14 + i * colW;
      const id = ALLY_FACE[p];
      root.add(this.add.circle(x + 15, y, 15, MARK_STYLE.bond.color));
      if (id && hasImage(this, id)) root.add(faceImage(this, id, x + 15, y, 13, FACE_CROPS[p]));
      const right = x + colW - 10;
      root.add(addText(this, x + 36, y - 8, BOND_PARTNER_NAMES[p] ?? p, { size: 12, bold: true }).setOrigin(0, 0.5));
      root.add(addText(this, right, y - 8, `♥ Lv${level}`, { size: 11, bold: true, color: toCss(MARK_STYLE.bond.color) }).setOrigin(1, 0.5));
      const barW = right - (x + 36);
      root.add(this.add.rectangle(x + 36, y + 8, barW, 6, 0x333338).setOrigin(0, 0.5));
      if (progress > 0) root.add(this.add.rectangle(x + 36, y + 8, barW * progress, 6, MARK_STYLE.bond.color).setOrigin(0, 0.5));
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
      backButton(this, root, '地図へ戻る', () => this.reopen(undefined));
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
    // 段階246：記号の上の言葉を、地図の説明と同じ色の札に
    const word = addText(this, 0, -46, spot.mark === 'side' ? '寄り道・時間を使わない' : st.word, { size: 10, bold: true, color: '#111111' }).setOrigin(0.5);
    holder.add(addSlant(this, 0, -46, word.width + 16, 17, state === 'open' ? st.color : 0x8a8a92));
    holder.add(word);
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
      this.time.delayedCall(260, () => startWithImages(this, 'Hub', { seen: undefined }));
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
    if (spot.confirm) this.confirm([spot.confirm, ...this.leftNotes()].join('\n\n'), go);
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

  /**
   * 夕暮れへ行く前の確認に添える、昼の残りの回数（段階133。レビューの項目50）。残っていなければ空。
   * まだ見ていない場所は地図の印で見えるので、重ねて書かない（開発者と決めた：判断の直前の1行だけ）
   */
  private leftNotes(): string[] {
    const left = picksLeft(this.hub, run.vars);
    return Number.isFinite(left) && left > 0 ? [`昼にあと${left}回選べる`] : [];
  }

  private confirm(text: string, onYes: () => void): void {
    const cx = GAME_WIDTH / 2;
    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    // 段階133：残っているものを添えると文が長くなるので、窓の高さを文に合わせる
    const body = addText(this, cx, 0, text, { size: 15, align: 'center', wrap: 280 }).setOrigin(0.5, 0);
    const h = Math.max(220, body.height + 130);
    const top = 420 - h / 2;
    panel.add(this.add.rectangle(cx, 420, 320, h, COLORS.panel).setRounded(8).setStrokeStyle(1, COLORS.border));
    panel.add(body.setY(top + 30));
    addButton(this, panel, cx - 75, top + h - 50, 130, 52, 'はい', { onTap: onYes }, { size: 16, bold: true, fill: STYLE.red, stroke: 0xffffff, strokeWidth: 2, italic: true });
    addButton(this, panel, cx + 75, top + h - 50, 130, 52, 'いいえ', { onTap: () => panel.destroy(true) }, { size: 16 });
  }

  private toast(text: string, warn = false): void {
    const t = addText(this, GAME_WIDTH / 2, 130, text, { size: 13, align: 'center', wrap: GAME_WIDTH - 40, color: warn ? COLORS.allyDamage : undefined }).setOrigin(0.5).setDepth(60);
    const bg = this.add.rectangle(GAME_WIDTH / 2, 130, t.width + 24, t.height + 14, 0x000000, 0.8).setDepth(59);
    this.tweens.add({ targets: [t, bg], alpha: 0, delay: 1800, duration: 400, onComplete: () => (t.destroy(), bg.destroy()) });
  }
}
