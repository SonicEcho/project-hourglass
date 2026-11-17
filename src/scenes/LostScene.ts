import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { LostItemDef } from '../core';
import { acceptLost, activeLostCount, addParts, capItems, deliverLost, gainSnaps, recordLibraryFinds, getAcceptError, getDeliverError, isSeen, lostAfterwords, lostStatus, lostVoicesHeard, markSeen, shelfLost } from '../core';
import { BACKDROPS, BGM, BOND_PARTNER_NAMES, CHAIN_SNAPS, FRAGMENTS, LOST_ACTIVE_MAX, LOST_ITEMS, NAVI_PARTS, SCREEN_COACH, SE, WEAPON_DATA } from '../data';
import { playBgm, playSe } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { addWindow, enterScreen, popIn } from '../ui/skin';
import { COLORS, RENDER_SCALE, STYLE } from '../ui/theme';
import { addButton, addSlant, addText, makePressable } from '../ui/widgets';
import { backButton, frameCoachRect, frameHeader } from '../ui/frame';
import { startScreenCoach } from '../ui/screenCoach';
import { SIDE_PADDING } from '../ui/layout';
import { ScrollArea } from '../ui/scrollArea';
import type { DialogueData } from './DialogueScene';
import { notePlayCount } from './playRecord';
import { run, saveRun, setStoryVars } from './run';

// 落とし物の棚（段階53。docs/design/economy.md の 5-3）：拠点で、記憶の中の落とし物を受けて、今の持ち主に届ける。
// 初めて開いた時は会話（lost_intro）を先に見る。届ける時は、ごほうびを先に受け取ってから届ける会話を見る（途中で閉じても失わない）

const INTRO = 'lost_intro';

/** 段階231：札の一覧の範囲と、下の案内の窓 */
const LIST_TOP = 64;
const MSG_Y = 702;
const MSG_H = 60;
const LIST_BOTTOM = MSG_Y - 8;
const CARD_GAP = 8;

export interface LostSceneData {
  /** 見終えた会話 */
  seen?: string;
  /** 届けて受け取ったごほうびの文（届ける会話から戻った時） */
  got?: string;
}

/** 武器の持ち主の名前（段階221） */
const CAST_NAMES: Record<string, string> = { hero: 'ハルト', akari: 'あかり', mio: 'みお', sayoko: '小夜子', hayase: '早瀬' };

/** ごほうびの文 */
function rewardText(d: LostItemDef): string {
  const r = d.reward;
  const parts = [
    ...(r.items ?? []).map((id) => WEAPON_DATA.items[id]?.name ?? id),
    ...(r.fragments?.length ? [`記憶の欠片×${r.fragments.length}（${[...new Set(r.fragments)].map((id) => FRAGMENTS[id as keyof typeof FRAGMENTS]?.name ?? id).join('・')}）`] : []),
    ...(r.gears ?? []).map((id) => `ギア「${NAVI_PARTS[id as keyof typeof NAVI_PARTS]?.name ?? id}」`),
    ...(r.snaps ?? []).map((id) => `スナップ「${CHAIN_SNAPS[id]?.name ?? id}」`),
    ...(r.points ? [`星の砂 ${r.points}`] : []),
    ...(r.bond ? [`${BOND_PARTNER_NAMES[r.bond as keyof typeof BOND_PARTNER_NAMES] ?? r.bond}との絆`] : []),
    ...(d.afterwords?.length ? ['仲間のひとこと'] : []),
    // 段階221：この依頼で開く武器の寄り道③
    ...Object.values(WEAPON_DATA.weapons).flatMap((w) =>
      w.evolutions.filter((e) => e.conditions.some((c) => c.kind === 'lost' && c.lost === d.id)).map((e) => `${CAST_NAMES[w.owner] ?? w.owner}の武器の寄り道「${e.name}」`),
    ),
  ];
  return parts.join('、');
}

/** 札に出す、短いご褒美の文（段階231） */
function shortReward(d: LostItemDef): string {
  const r = d.reward;
  const parts = [
    ...(r.bond ? [`${BOND_PARTNER_NAMES[r.bond as keyof typeof BOND_PARTNER_NAMES] ?? r.bond}との絆`] : []),
    ...(d.afterwords?.length ? ['仲間のひとこと'] : []),
    ...(r.items ?? []).map((id) => WEAPON_DATA.items[id]?.name ?? id),
    ...(r.fragments?.length ? [`欠片×${r.fragments.length}`] : []),
    ...(r.gears ?? []).map((id) => NAVI_PARTS[id as keyof typeof NAVI_PARTS]?.name ?? id),
    ...(r.snaps ?? []).map((id) => `${CHAIN_SNAPS[id]?.name ?? id}のスナップ`),
    ...(r.points ? [`星の砂${r.points}`] : []),
    ...Object.values(WEAPON_DATA.weapons).flatMap((w) =>
      w.evolutions.filter((e) => e.conditions.some((c) => c.kind === 'lost' && c.lost === d.id)).map((e) => `${e.name}（${CAST_NAMES[w.owner] ?? w.owner}の寄り道）`),
    ),
  ];
  return parts.join('・');
}

/** 今の様子の文 */
function statusText(d: LostItemDef): string {
  switch (lostStatus(run.vars, d.id)) {
    case 'none':
      return 'まだ受けていません';
    case 'accepted':
      if (d.kind === 'voices') return `声をたどる：声のかけら ${lostVoicesHeard(run.vars, d.id)}/${d.voices?.length ?? 0}`;
      return d.kind === 'find' ? '記憶をたどって探しています' : `集める：${WEAPON_DATA.items[d.bring!.item]?.name ?? ''} ${Math.min(run.armory.items[d.bring!.item] ?? 0, d.bring!.count)}/${d.bring!.count}`;
    case 'found':
      return d.kind === 'voices' ? '声がそろいました（届けられます）' : '見つけました（届けられます）';
    case 'delivered':
      return '届けました';
  }
}

export class LostScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private message = '';
  private list!: ScrollArea;

  constructor() {
    super('Lost');
  }

  create(data: LostSceneData = {}): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.overlay = undefined;
    if (data.seen) setStoryVars(markSeen(run.vars, data.seen));
    if (!isSeen(run.vars, INTRO)) {
      this.talk(INTRO, { seen: INTRO, got: undefined });
      return;
    }
    enterScreen(this);
    playBgm(this, BGM.library);
    this.message = data.got ? `届けました。受け取った物：${data.got}` : '記憶の中の、あの時は気づかなかった小さなことを、今の持ち主に届けます。札をタップすると、くわしい説明が出ます。';
    if (data.got) playSe(this, SE.chest);
    this.root = this.add.container(0, 0);
    this.list = new ScrollArea(this, () => !!this.overlay);
    this.render();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    // 段階236：初めての時は、照らす案内（戦闘と同じ形）
    startScreenCoach(this, 'lost_shelf', SCREEN_COACH.lost_shelf, (t) => (t === 'cards' ? { x: 4, y: LIST_TOP - 4, w: GAME_WIDTH - 8, h: Math.min(LIST_BOTTOM, LIST_TOP + 2 * 100) - LIST_TOP + 8 } : frameCoachRect(t)));
  }

  private talk(scene: string, back: LostSceneData): void {
    const talk: DialogueData = { scene, vars: run.vars, seed: run.seed, next: { key: 'Lost', data: back }, onVars: (vars) => setStoryVars(vars) };
    this.scene.start('Dialogue', talk);
  }

  private render(): void {
    this.root.removeAll(true);
    const root = this.root;
    drawBackdrop(this, root, BACKDROPS.library, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0));
    // 段階231（見本どおり）：依頼ごとの札を、指で上下にずらせる一覧に。見出しより先に足す
    const list = shelfLost(LOST_ITEMS, run.returned);
    const heights = list.map((d) => this.cardHeight(d));
    const content = heights.reduce((a, h) => a + h + CARD_GAP, 0) - (list.length ? CARD_GAP : 0);
    const layer = this.list.build(root, LIST_TOP, LIST_BOTTOM, content);
    let y = LIST_TOP;
    list.forEach((d, i) => {
      this.drawCard(layer, d, y, heights[i]);
      y += heights[i] + CARD_GAP;
    });
    if (list.length === 0) {
      root.add(addText(this, GAME_WIDTH / 2, 200, 'まだ落とし物はありません。\n時間を返すと、その記憶の落とし物が届きます。', { size: 14, align: 'center', color: COLORS.subText }).setOrigin(0.5));
    }
    frameHeader(this, root, 'support', '落とし物の棚', { label: '受けている', value: `${activeLostCount(LOST_ITEMS, run.vars)}/${LOST_ACTIVE_MAX}` });
    // 案内は窓の形に（段階231）
    root.add(addWindow(this, SIDE_PADDING, MSG_Y, GAME_WIDTH - SIDE_PADDING * 2, MSG_H, STYLE.red, STYLE.ink, 0.92));
    const msg = addText(this, SIDE_PADDING + 14, MSG_Y + MSG_H / 2, this.message, { size: 12, wrap: GAME_WIDTH - SIDE_PADDING * 2 - 28 }).setOrigin(0, 0.5);
    if (msg.height > MSG_H - 10) msg.setScale((MSG_H - 10) / msg.height);
    root.add(msg);
    backButton(this, root, 'レストピアへ戻る', () => this.scene.start('Hub', { seen: undefined }));
  }

  /** 札の高さ：進み具合の行（声のかけら・集める数・探す）がある時は1行ぶん高い */
  private cardHeight(d: LostItemDef): number {
    return this.progressLine(d) ? 92 : 74;
  }

  /** 札の進み具合の行（受けている時だけ） */
  private progressLine(d: LostItemDef): { label: string; have: number; need: number } | { label: string; text: string } | null {
    const st = lostStatus(run.vars, d.id);
    if (st !== 'accepted' && st !== 'found') return null;
    if (d.kind === 'voices') {
      const need = d.voices?.length ?? 0;
      return { label: '声のかけら', have: st === 'found' ? need : lostVoicesHeard(run.vars, d.id), need };
    }
    if (d.kind === 'bring') return { label: WEAPON_DATA.items[d.bring!.item]?.name ?? '', have: Math.min(run.armory.items[d.bring!.item] ?? 0, d.bring!.count), need: d.bring!.count };
    return { label: '記憶', text: st === 'found' ? '見つけました' : '「砂の底」の、その記憶の層で光る所を掘ります' };
  }

  /**
   * 依頼の札（段階231 の見本）：名前・今の様子の札・届ける相手・進み具合（声のかけらのひし形など）・ご褒美。
   * 届けられる依頼は黄のふち、届けた依頼は薄く
   */
  private drawCard(layer: Phaser.GameObjects.Container, d: LostItemDef, top: number, h: number): void {
    const st = lostStatus(run.vars, d.id);
    const ready = st !== 'delivered' && getDeliverError(d, run.vars, run.armory.items) === null && st !== 'none';
    const done = st === 'delivered';
    const x = SIDE_PADDING;
    const w = GAME_WIDTH - SIDE_PADDING * 2;
    const card = this.add.rectangle(x, top, w, h, done ? 0x0c0b0e : STYLE.ink, done ? 0.8 : 0.93).setOrigin(0);
    card.setStrokeStyle(ready ? 2 : 1, ready ? STYLE.yellow : 0x2e2c34);
    layer.add(card);
    makePressable(card, { onTap: this.list.guard(() => this.detail(d)) });
    layer.add(this.add.rectangle(x, top, 4, h, ready ? STYLE.yellow : st === 'none' ? 0x5a5a62 : done ? 0x3a3840 : STYLE.red, done ? 0.6 : 1).setOrigin(0));
    const a = done ? 0.5 : 1;
    // 名前と、今の様子の札
    const name = addText(this, x + 16, top + 17, d.name, { size: 16, bold: true }).setOrigin(0, 0.5).setAlpha(a);
    name.setFontStyle('bold italic');
    layer.add(name);
    const tag = ready
      ? { label: '届けられる！', fill: STYLE.yellow, ink: '#0b0a0c' }
      : st === 'none'
        ? { label: 'まだ受けていない', fill: 0xffffff, ink: '#0b0a0c' }
        : done
          ? { label: '届けた', fill: 0x4a4850, ink: '#c8c6cc' }
          : { label: d.kind === 'voices' ? '声をたどる' : d.kind === 'find' ? '探している' : '集めている', fill: STYLE.red, ink: '#ffffff' };
    const tagT = addText(this, 0, top + 14, tag.label, { size: 9, bold: true, color: tag.ink }).setOrigin(0.5);
    const tagW = tagT.width + 16;
    const tagX = x + w - 10 - tagW / 2;
    layer.add(addSlant(this, tagX, top + 14, tagW, 15, tag.fill, done ? 0.7 : 1));
    tagT.setX(tagX);
    layer.add(tagT);
    const nameMax = tagX - tagW / 2 - 8 - (x + 16);
    if (name.width > nameMax) name.setScale(nameMax / name.width, 1);
    // 届ける相手
    const to = addText(this, x + 16, top + 38, '届ける相手：', { size: 10, color: COLORS.subText }).setOrigin(0, 0.5).setAlpha(a);
    layer.add(to);
    layer.add(addText(this, x + 16 + to.width, top + 38, `${d.owner}さん`, { size: 11, bold: true }).setOrigin(0, 0.5).setAlpha(a));
    // 進み具合
    const prog = this.progressLine(d);
    if (prog) {
      const py = top + 57;
      const label = addText(this, x + 16, py, prog.label, { size: 10, color: COLORS.subText }).setOrigin(0, 0.5);
      layer.add(label);
      if ('text' in prog) {
        layer.add(addText(this, x + 16 + label.width + 8, py, prog.text, { size: 10 }).setOrigin(0, 0.5));
      } else {
        let px = x + 16 + label.width + 14;
        for (let i = 0; i < prog.need && i < 8; i++) {
          const pip = this.add.rectangle(px, py, 9, 9, i < prog.have ? STYLE.yellow : STYLE.ink).setAngle(45);
          pip.setStrokeStyle(1.2, i < prog.have ? STYLE.yellow : 0xffffff, 0.9);
          layer.add(pip);
          px += 17;
        }
        layer.add(addText(this, px, py, `${prog.have}/${prog.need}`, { size: 10, bold: true, color: prog.have >= prog.need ? STYLE.yellowText : COLORS.text }).setOrigin(0, 0.5));
      }
    }
    // ご褒美
    const ry = top + h - 14;
    layer.add(addSlant(this, x + 38, ry, 44, 13, 0xffffff, done ? 0.5 : 0.95));
    layer.add(addText(this, x + 38, ry, 'ご褒美', { size: 8, bold: true, color: '#0b0a0c' }).setOrigin(0.5));
    const reward = addText(this, x + 66, ry, shortReward(d), { size: 10, color: COLORS.subText }).setOrigin(0, 0.5).setAlpha(a);
    const rewardMax = w - 66 - 10;
    if (reward.width > rewardMax) reward.setScale(rewardMax / reward.width, 1);
    layer.add(reward);
  }

  /** 落とし物の窓：説明・ごほうび・受ける／届ける */
  private detail(d: LostItemDef): void {
    if (this.overlay) return;
    const cx = GAME_WIDTH / 2;
    const st = lostStatus(run.vars, d.id);
    const top = 170;
    const h = 440;
    const panel = this.add.container(0, 0).setDepth(50);
    this.overlay = panel;
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(addWindow(this, cx - 170, top, 340, h));
    panel.add(addText(this, cx, top + 28, d.name, { size: 18, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    // 段階220：届けた後は、仲間のひとことを添える
    const words = lostAfterwords(d, run.vars, run.returned)
      .map((a) => `${a.speaker}「${a.text}」`)
      .join('\n');
    panel.add(addText(this, cx - 150, top + 56, `${d.text}\n\n届ける相手：${d.owner}さん\nごほうび：${rewardText(d)}\n今：${statusText(d)}${words ? `\n\n${words}` : ''}`, { size: 13, wrap: 300 }));
    const close = () => {
      panel.destroy(true);
      this.overlay = undefined;
    };
    const by = top + h - 40;
    addButton(this, panel, cx - 78, by, 140, 48, '閉じる', { onTap: close }, { size: 15 });
    if (st === 'none') {
      const err = getAcceptError(LOST_ITEMS, run.vars, d.id, LOST_ACTIVE_MAX);
      addButton(this, panel, cx + 78, by, 140, 48, err === 'too many accepted' ? `受けられる\nのは${LOST_ACTIVE_MAX}つまで` : '受ける', { onTap: () => { close(); this.accept(d); } }, { size: 14, bold: true, enabled: err === null, fill: STYLE.red, stroke: 0xffffff, strokeWidth: 2, italic: true });
    } else if (st === 'accepted' || st === 'found') {
      const err = getDeliverError(d, run.vars, run.armory.items);
      addButton(this, panel, cx + 78, by, 140, 48, '届ける', { onTap: () => { close(); this.deliver(d); } }, { size: 15, bold: true, enabled: err === null, fill: STYLE.red, stroke: 0xffffff, strokeWidth: 2, italic: true });
    }
    popIn(this, panel);
  }

  private accept(d: LostItemDef): void {
    setStoryVars(acceptLost(LOST_ITEMS, run.vars, d.id, LOST_ACTIVE_MAX));
    this.message =
      d.kind === 'voices'
        ? `「${d.name}」を受けました。「砂の底」の、その記憶の帯で光る声のかけらを掘り当てます（${d.voices?.length ?? 0}つ。1回の潜りで1つまで）。`
        : d.kind === 'find'
          ? `「${d.name}」を受けました。「砂の底」の、その記憶の層で光る所を掘り当てます。`
          : `「${d.name}」を受けました。「砂の底」で、${WEAPON_DATA.items[d.bring!.item]?.name ?? ''}を${d.bring!.count}つ集めます。`;
    this.render();
  }

  /** 届ける：ごほうびを先に受け取ってから、届ける会話を見る */
  private deliver(d: LostItemDef): void {
    if (getDeliverError(d, run.vars, run.armory.items)) return;
    const r = deliverLost(d, run.vars, run.armory);
    run.armory = capItems(WEAPON_DATA, { ...run.armory, items: r.items, fragments: r.fragments }).armory;
    if (d.reward.gears?.length) run.navi = addParts(run.navi, d.reward.gears);
    // スナップは新しい戦闘のアルバムへ（段階204。ライブラリにも記録）
    if (d.reward.snaps?.length) {
      run.chainAlbum = gainSnaps(run.chainAlbum, d.reward.snaps);
      run.library = recordLibraryFinds(run.library, { snaps: d.reward.snaps });
    }
    if (d.reward.points) run.growth = { ...run.growth, points: run.growth.points + d.reward.points };
    setStoryVars(r.vars);
    saveRun();
    notePlayCount('lost');
    this.talk(d.deliverScene, { seen: undefined, got: rewardText(d) });
  }
}
