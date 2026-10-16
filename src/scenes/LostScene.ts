import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { LostItemDef } from '../core';
import { acceptLost, activeLostCount, addParts, capItems, deliverLost, gainSnaps, getAcceptError, getDeliverError, isSeen, lostStatus, markSeen, shelfLost } from '../core';
import { BACKDROPS, BGM, CARDS, FRAGMENTS, LOST_ACTIVE_MAX, LOST_ITEMS, NAVI_PARTS, SE, WEAPON_DATA } from '../data';
import { playBgm, playSe } from '../audio/sound';
import { drawBackdrop } from '../ui/backdrop';
import { addWindow, enterScreen, popIn } from '../ui/skin';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import type { DialogueData } from './DialogueScene';
import { notePlayCount } from './playRecord';
import { run, saveRun, setStoryVars } from './run';

// 落とし物の棚（段階53。docs/design/economy.md の 5-3）：拠点で、記憶の中の落とし物を受けて、今の持ち主に届ける。
// 初めて開いた時は会話（lost_intro）を先に見る。届ける時は、ごほうびを先に受け取ってから届ける会話を見る（途中で閉じても失わない）

const INTRO = 'lost_intro';

export interface LostSceneData {
  /** 見終えた会話 */
  seen?: string;
  /** 届けて受け取ったごほうびの文（届ける会話から戻った時） */
  got?: string;
}

/** ごほうびの文 */
function rewardText(d: LostItemDef): string {
  const r = d.reward;
  const parts = [
    ...(r.items ?? []).map((id) => WEAPON_DATA.items[id]?.name ?? id),
    ...(r.fragments?.length ? [`記憶の欠片×${r.fragments.length}（${[...new Set(r.fragments)].map((id) => FRAGMENTS[id as keyof typeof FRAGMENTS]?.name ?? id).join('・')}）`] : []),
    ...(r.gears ?? []).map((id) => `ギア「${NAVI_PARTS[id as keyof typeof NAVI_PARTS]?.name ?? id}」`),
    ...(r.snaps ?? []).map((id) => `スナップ「${CARDS[id as keyof typeof CARDS]?.name ?? id}」`),
    ...(r.points ? [`星の砂 ${r.points}`] : []),
  ];
  return parts.join('、');
}

/** 今の様子の文 */
function statusText(d: LostItemDef): string {
  switch (lostStatus(run.vars, d.id)) {
    case 'none':
      return 'まだ受けていない';
    case 'accepted':
      return d.kind === 'find' ? '記憶をたどって探す' : `集める：${WEAPON_DATA.items[d.bring!.item]?.name ?? ''} ${Math.min(run.armory.items[d.bring!.item] ?? 0, d.bring!.count)}/${d.bring!.count}`;
    case 'found':
      return '見つけた（届けられる）';
    case 'delivered':
      return '届けた';
  }
}

export class LostScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private message = '';

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
    this.message = data.got ? `届けた！　受け取った物：${data.got}` : '記憶の中の、あの時は気づかなかった小さなこと';
    if (data.got) playSe(this, SE.chest);
    this.root = this.add.container(0, 0);
    this.render();
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  private talk(scene: string, back: LostSceneData): void {
    const talk: DialogueData = { scene, vars: run.vars, seed: run.seed, next: { key: 'Lost', data: back }, onVars: (vars) => setStoryVars(vars) };
    this.scene.start('Dialogue', talk);
  }

  private render(): void {
    this.root.removeAll(true);
    const root = this.root;
    drawBackdrop(this, root, BACKDROPS.library, 0, GAME_HEIGHT, false);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0));
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, 96, 0x000000, 0.55).setOrigin(0));
    root.add(addText(this, GAME_WIDTH / 2, 28, '落とし物の棚', { size: 20, bold: true }).setOrigin(0.5));
    root.add(addText(this, GAME_WIDTH / 2, 62, `受けている：${activeLostCount(LOST_ITEMS, run.vars)}/${LOST_ACTIVE_MAX}（同時に受けられるのは${LOST_ACTIVE_MAX}つまで）`, { size: 12, color: COLORS.subText }).setOrigin(0.5));
    const list = shelfLost(LOST_ITEMS, run.returned);
    if (list.length === 0) root.add(addText(this, GAME_WIDTH / 2, 200, 'まだ落とし物はない\n（時間を返すと、その記憶の落とし物が届く）', { size: 14, align: 'center', color: COLORS.subText }).setOrigin(0.5));
    list.forEach((d, i) => {
      const st = lostStatus(run.vars, d.id);
      const ready = getDeliverError(d, run.vars, run.armory.items) === null;
      addButton(this, root, GAME_WIDTH / 2, 150 + i * 70, GAME_WIDTH - 40, 60, `${d.name}　→ ${d.owner}さん\n${statusText(d)}`, { onTap: () => this.detail(d) }, {
        size: 13,
        fill: ready ? 0x5a4a10 : st === 'delivered' ? COLORS.panel : 0x24384a,
        stroke: ready ? COLORS.accent : st === 'delivered' ? COLORS.border : 0x6bc8ff,
        strokeWidth: ready ? 2 : 1,
        textColor: st === 'delivered' ? COLORS.dimText : COLORS.text,
      });
    });
    // 案内は絵の上でも読めるよう、暗い下地に（段階45）
    root.add(this.add.rectangle(GAME_WIDTH / 2, 690, GAME_WIDTH - 24, 60, 0x0b0f22, 0.85).setRounded(8).setStrokeStyle(1, COLORS.border));
    root.add(addText(this, GAME_WIDTH / 2, 690, this.message, { size: 13, align: 'center', wrap: GAME_WIDTH - 44 }).setOrigin(0.5));
    addButton(this, root, GAME_WIDTH / 2, 780, GAME_WIDTH - 60, 56, 'レストピアへ戻る', { onTap: () => this.scene.start('Hub', { seen: undefined }) }, { size: 17, bold: true });
  }

  /** 落とし物の窓：説明・ごほうび・受ける／届ける */
  private detail(d: LostItemDef): void {
    if (this.overlay) return;
    const cx = GAME_WIDTH / 2;
    const st = lostStatus(run.vars, d.id);
    const top = 200;
    const h = 380;
    const panel = this.add.container(0, 0).setDepth(50);
    this.overlay = panel;
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(addWindow(this, cx - 170, top, 340, h));
    panel.add(addText(this, cx, top + 28, d.name, { size: 18, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    panel.add(addText(this, cx - 150, top + 56, `${d.text}\n\n届ける相手：${d.owner}さん\nごほうび：${rewardText(d)}\n今：${statusText(d)}`, { size: 13, wrap: 300 }));
    const close = () => {
      panel.destroy(true);
      this.overlay = undefined;
    };
    const by = top + h - 40;
    addButton(this, panel, cx - 78, by, 140, 48, '閉じる', { onTap: close }, { size: 15 });
    if (st === 'none') {
      const err = getAcceptError(LOST_ITEMS, run.vars, d.id, LOST_ACTIVE_MAX);
      addButton(this, panel, cx + 78, by, 140, 48, err === 'too many accepted' ? `受けられる\nのは${LOST_ACTIVE_MAX}つまで` : '受ける', { onTap: () => { close(); this.accept(d); } }, { size: 14, bold: true, enabled: err === null, fill: 0x24384a, stroke: 0x6bc8ff, strokeWidth: 2 });
    } else if (st === 'accepted' || st === 'found') {
      const err = getDeliverError(d, run.vars, run.armory.items);
      addButton(this, panel, cx + 78, by, 140, 48, '届ける', { onTap: () => { close(); this.deliver(d); } }, { size: 15, bold: true, enabled: err === null, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 });
    }
    popIn(this, panel);
  }

  private accept(d: LostItemDef): void {
    setStoryVars(acceptLost(LOST_ITEMS, run.vars, d.id, LOST_ACTIVE_MAX));
    this.message = d.kind === 'find' ? `「${d.name}」を受けた。「記憶をたどる」で、金色に光る所を探す` : `「${d.name}」を受けた。「記憶をたどる」で、${WEAPON_DATA.items[d.bring!.item]?.name ?? ''}を${d.bring!.count}つ集める`;
    this.render();
  }

  /** 届ける：ごほうびを先に受け取ってから、届ける会話を見る */
  private deliver(d: LostItemDef): void {
    if (getDeliverError(d, run.vars, run.armory.items)) return;
    const r = deliverLost(d, run.vars, run.armory);
    run.armory = capItems(WEAPON_DATA, { ...run.armory, items: r.items, fragments: r.fragments }).armory;
    if (d.reward.gears?.length) run.navi = addParts(run.navi, d.reward.gears);
    if (d.reward.snaps?.length) run.album = gainSnaps(run.album, d.reward.snaps);
    if (d.reward.points) run.growth = { ...run.growth, points: run.growth.points + d.reward.points };
    setStoryVars(r.vars);
    saveRun();
    notePlayCount('lost');
    this.talk(d.deliverScene, { seen: undefined, got: rewardText(d) });
  }
}
