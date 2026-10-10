import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { nextVolume } from '../core';
import { getSettings, playSe, setSettings } from '../audio/sound';
import { SE } from '../data';
import { addWindow, fadeOutAndDestroy, popIn } from './skin';
import { COLORS } from './theme';
import { addButton, addText } from './widgets';

// オプションの窓（段階32b 調整3）。タイトルと会話の画面で同じ窓を使う。
// 上に音の設定（BGM・効果音・文字音・出力先）、下にその画面だけの項目（タイトルなら説明・遊んだ記録・クレジット）。
// 項目を足す時は、音の行（SOUND_ROWS）か、開く側から渡す links に足す

/** 窓の下に並べる、ほかの画面を開く項目 */
export interface OptionsLink {
  label: string;
  onTap: () => void;
}

interface SoundRow {
  label: string;
  /** ボタンに出す今の値 */
  value: () => string;
  /** 押した時（次の値へ） */
  next: (scene: Phaser.Scene) => void;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** 音の設定の行。押すたびに次の値になり、すぐ保存する */
const SOUND_ROWS: SoundRow[] = [
  {
    label: 'BGM',
    value: () => pct(getSettings().bgmVolume),
    next: () => setSettings({ ...getSettings(), bgmVolume: nextVolume(getSettings().bgmVolume) }),
  },
  {
    label: '効果音',
    value: () => pct(getSettings().seVolume),
    next: (scene) => {
      setSettings({ ...getSettings(), seVolume: nextVolume(getSettings().seVolume) });
      // 新しい大きさで鳴らして聞かせる（ボタンの音は前の大きさで鳴っている）
      playSe(scene, SE.heal);
    },
  },
  {
    // 会話で、文字が出るたびに鳴る短い音（段階22）
    label: '文字の音',
    value: () => (getSettings().typeSound ? '入' : '切'),
    next: () => setSettings({ ...getSettings(), typeSound: !getSettings().typeSound }),
  },
  {
    // 出力先（会話の文字の音のタイミングを合わせる。段階22）
    label: '出力先',
    value: () => (getSettings().audioOut === 'wireless' ? 'Bluetooth' : 'スピーカー'),
    next: () => setSettings({ ...getSettings(), audioOut: getSettings().audioOut === 'wireless' ? 'speaker' : 'wireless' }),
  },
];

const ROW_GAP = 58;
const LINK_GAP = 56;

/** オプションの窓を開く。閉じる時に onClose を呼ぶ */
export function openOptions(scene: Phaser.Scene, opts: { links?: OptionsLink[]; depth?: number; onClose?: () => void } = {}): Phaser.GameObjects.Container {
  const links = opts.links ?? [];
  const cx = GAME_WIDTH / 2;
  const w = 320;
  const h = 96 + SOUND_ROWS.length * ROW_GAP + 34 + (links.length > 0 ? 16 + links.length * LINK_GAP : 0) + 70;
  const top = Math.round((GAME_HEIGHT - h) / 2);
  const panel = scene.add.container(0, 0).setDepth(opts.depth ?? 300);
  // 後ろのボタンを押せないよう、画面全体を覆う
  panel.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
  panel.add(addWindow(scene, cx - w / 2, top, w, h));
  panel.add(addText(scene, cx, top + 36, 'オプション', { size: 18, bold: true }).setOrigin(0.5));

  const rows = scene.add.container(0, 0);
  panel.add(rows);
  const rowTop = top + 92;
  const draw = () => {
    rows.removeAll(true);
    SOUND_ROWS.forEach((row, i) => {
      const y = rowTop + i * ROW_GAP;
      rows.add(addText(scene, cx - 130, y, row.label, { size: 15 }).setOrigin(0, 0.5));
      addButton(scene, rows, cx + 70, y, 130, 46, row.value(), {
        onTap: () => {
          row.next(scene);
          draw();
        },
      }, { size: 15 });
    });
  };
  draw();
  let y = rowTop + (SOUND_ROWS.length - 1) * ROW_GAP + 44;
  panel.add(addText(scene, cx, y, 'Bluetooth（無線）のイヤホンの時は、会話の文字の音を早めに鳴らす', { size: 11, color: COLORS.subText, align: 'center', wrap: 280 }).setOrigin(0.5));
  y += 34;
  if (links.length > 0) {
    const line = scene.add.graphics();
    line.lineStyle(1, COLORS.accent, 0.3).lineBetween(cx - w / 2 + 24, y, cx + w / 2 - 24, y);
    panel.add(line);
    y += 16 + LINK_GAP / 2;
    for (const link of links) {
      addButton(scene, panel, cx, y, w - 60, 46, link.label, { onTap: link.onTap }, { size: 15 });
      y += LINK_GAP;
    }
    y -= LINK_GAP / 2;
  }
  addButton(scene, panel, cx, y + 44, 160, 48, '閉じる', {
    onTap: () => {
      fadeOutAndDestroy(scene, panel);
      opts.onClose?.();
    },
  }, { size: 15 });
  popIn(scene, panel);
  return panel;
}
