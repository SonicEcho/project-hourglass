import Phaser from 'phaser';
import { currentBgm } from '../audio/sound';

// 通しの自動確認（段階20、scripts/e2e.mjs）が画面を外から調べる窓口。?debug=1 の時だけ main.ts から用意する。
// 画面は canvas に描くので、ボタンの文字の位置をここで教え、外からその位置をタップしてもらう

export interface TestHook {
  /** 動いている画面の名前 */
  scenes(): string[];
  /** 文字が pattern（正規表現）に合うものが画面に出ていれば、その文字と中心の位置（390×844 の座標）。いちばん手前のものを返す */
  findText(pattern: string): { text: string; x: number; y: number } | null;
  /** 今流れている BGM（台帳の id） */
  bgm(): string | null;
}

/** 画面に出ている文字。1文字ずつ置いた文（けいかくひょうの手書きの字）は、入れ物に data の text で全文を書いておく */
interface FoundText {
  text: string;
  getBounds(): Phaser.Geom.Rectangle;
}

function visibleTexts(list: Phaser.GameObjects.GameObject[], out: FoundText[]): void {
  for (const o of list) {
    if ('visible' in o && !(o as unknown as Phaser.GameObjects.Components.Visible).visible) continue;
    if (o instanceof Phaser.GameObjects.Container) {
      const whole = o.getData('text');
      if (typeof whole === 'string') out.push({ text: whole, getBounds: () => o.getBounds() });
      visibleTexts(o.list, out);
    } else if (o instanceof Phaser.GameObjects.Text) out.push(o);
  }
}

export function installTestHook(game: Phaser.Game): void {
  const hook: TestHook = {
    scenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
    findText: (pattern) => {
      const re = new RegExp(pattern);
      let found: { text: string; x: number; y: number } | null = null;
      for (const scene of game.scene.getScenes(true)) {
        const texts: FoundText[] = [];
        scene.children.depthSort();
        visibleTexts(scene.children.getChildren(), texts);
        for (const t of texts) {
          if (!re.test(t.text)) continue;
          const b = t.getBounds();
          found = { text: t.text, x: b.centerX, y: b.centerY };
        }
      }
      return found;
    },
    bgm: () => currentBgm(),
  };
  (window as unknown as { __restopia: TestHook }).__restopia = hook;
}
