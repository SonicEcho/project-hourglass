// 段階294（docs/milestones/M3_explore_feel.md の 15.）：3Dらしい見た目の試し。
// 灯りを光源にし（人物も通ると照らされる）、物の影・画面の効果（周りを暗く・灯りのにじみ・上下のぼかし）・手前を横切る提灯のひも・光の粒を足す。
import Phaser from 'phaser';
import { A11_LOOK } from '../data';

type Look = typeof A11_LOOK;

/** 背景を抜いた時に残る、ほとんど透明なもやを取り除いた絵（暗くした地面の上で四角く浮かないように） */
function cleanAlpha(scene: Phaser.Scene, key: string): string {
  const out = `look.clean.${key}`;
  if (scene.textures.exists(out)) return out;
  if (!scene.textures.exists(key)) return key;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return key;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < 48) img.data[i] = 0;
  ctx.putImageData(img, 0, 0);
  scene.textures.addCanvas(out, canvas);
  return out;
}

/** 地図の絵（画像・スプライト）に光源を効かせる。入れ物の中もたどる */
function lightUp(obj: Phaser.GameObjects.GameObject, selfLit: readonly string[]): void {
  if (obj instanceof Phaser.GameObjects.Container) {
    for (const c of obj.list) lightUp(c, selfLit);
    return;
  }
  if (obj instanceof Phaser.GameObjects.Image && selfLit.includes(obj.texture.key)) {
    // 自分で光っている物は、灯りの効果をかけず、薄いもやだけ取り除く
    const w = obj.displayWidth;
    const h = obj.displayHeight;
    obj.setTexture(cleanAlpha(obj.scene, obj.texture.key));
    obj.setDisplaySize(w, h);
    return;
  }
  if ((obj instanceof Phaser.GameObjects.Image || obj instanceof Phaser.GameObjects.Sprite) && !obj.getData('noLight') && !obj.texture.key.startsWith('look.') && obj.pipeline?.name !== 'Light2D') {
    obj.setPipeline('Light2D');
  }
}

/** ぼかした丸い影の絵（真ん中ほど濃い） */
function blobTexture(scene: Phaser.Scene): string {
  const key = 'look.blob';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 128, 64);
  const ctx = tex?.getContext();
  if (tex && ctx) {
    ctx.save();
    ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.75)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    ctx.restore();
    tex.refresh();
  }
  return key;
}

export interface LookParts {
  world: Phaser.GameObjects.Container;
  sortLayer: Phaser.GameObjects.Container;
  cam: Phaser.Cameras.Scene2D.Camera;
  uiCam: Phaser.Cameras.Scene2D.Camera;
  T: number;
}

/** 前の部屋の灯りを消す（部屋を移るたびに、この画面は作り直される） */
export function resetLook(scene: Phaser.Scene): void {
  scene.lights.shutdown();
  scene.lights.disable();
  scene.cameras.main.postFX?.clear();
}

/** 試しの見た目をかける。WebGL でない時は何もしない */
export function applyLook(scene: Phaser.Scene, p: LookParts, look: Look = A11_LOOK): void {
  if (!(scene.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  const { world, sortLayer, cam, uiCam, T } = p;

  // 物の影：足もとに、ぼかした丸い影。一番近い灯りと反対の側へ少しずらす（歩く人は、影もついて行く）
  const shadows = scene.add.container(0, 0);
  world.addAt(shadows, world.getIndex(sortLayer));
  const away = (x: number, y: number): number => {
    let best = look.lights[0];
    let bd = Infinity;
    for (const l of look.lights) {
      const d = (l.x * T - x) ** 2 + (l.y * T - y) ** 2;
      if (d < bd) [bd, best] = [d, l];
    }
    return Math.sign(x - best.x * T) || 1;
  };
  const blob = blobTexture(scene);
  for (const o of sortLayer.list) {
    if (!(o instanceof Phaser.GameObjects.Image) || o.getData('foot') === -1) continue;
    const dir = away(o.x, o.y);
    const big = o.displayHeight >= look.shadow.small * T;
    const w = o.displayWidth * (big ? 1.05 : 0.8);
    const h = big ? T * 1.1 : T * 0.4;
    const e = scene.add.image(0, 0, blob).setAlpha(look.shadow.alpha).setDisplaySize(w, h);
    e.setData('noLight', true);
    const place = () => e.setPosition(o.x + dir * (big ? look.shadow.shift : 0.1) * T, o.y - (big ? T * 0.2 : 2));
    place();
    shadows.add(e);
    if (!big) scene.events.on('update', place);
  }

  // 灯り
  scene.lights.enable().setAmbientColor(look.ambient);
  for (const l of look.lights) {
    const light = scene.lights.addLight(l.x * T, l.y * T, l.r * T, l.color, l.power);
    scene.tweens.add({ targets: light, intensity: l.power * (1 - look.flicker.amount), yoyo: true, repeat: -1, duration: look.flicker.ms + Math.random() * 400, ease: 'Sine.easeInOut', delay: Math.random() * 500 });
  }
  lightUp(world, look.selfLit);
  // 後から出る物（湧いた砂嵐・開けた宝箱など）にも
  scene.time.addEvent({ delay: 500, loop: true, callback: () => lightUp(world, look.selfLit) });

  // 光の粒（灯りのまわりを、ゆっくりただよう）
  if (!scene.textures.exists('look.mote')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffe2a8, 1).fillCircle(4, 4, 4);
    g.generateTexture('look.mote', 8, 8);
    g.destroy();
  }
  for (const l of look.lights) {
    const em = scene.add.particles(l.x * T, l.y * T, 'look.mote', {
      lifespan: 4200,
      frequency: 4200 / look.motes,
      speedY: { min: -6, max: -14 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.35, end: 0.1 },
      alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD',
      emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, l.r * T * 0.5) as Phaser.Types.GameObjects.Particles.RandomZoneSource },
    });
    world.add(em);
  }

  // 手前を横切る提灯のひも：地面より速く動かす（カメラとの間に空間があるように）。
  // y マスの所が画面の下の方（下から15%）に来た時に、ちょうどその場所に見え、カメラが動くとそれより速くずれる
  if (scene.textures.exists('part.string_lanterns')) {
    const key = cleanAlpha(scene, 'part.string_lanterns');
    for (const f of look.foreground) {
      const im = scene.add.image(f.x * T, f.y * T, key).setOrigin(0, 0.5).setTint(0x6a6070);
      im.setDisplaySize(f.w * T, (f.w * T * im.height) / im.width);
      im.setData('noLight', true);
      world.add(im);
      const place = () => {
        const ref = f.y * T - cam.worldView.height * 0.85;
        im.setY(f.y * T - (cam.worldView.y - ref) * (f.speed - 1));
        world.bringToTop(im);
      };
      place();
      scene.events.on('update', place);
    }
  }

  // 画面の上と下に、夜気のかすみ（ピントが真ん中に合っているように見せる）
  if (look.fx.haze > 0) {
    if (!scene.textures.exists('look.haze')) {
      const tex = scene.textures.createCanvas('look.haze', 4, 256);
      const ctx = tex?.getContext();
      if (tex && ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, 'rgba(24,22,48,1)');
        grad.addColorStop(1, 'rgba(24,22,48,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 4, 256);
        tex.refresh();
      }
    }
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    const top = scene.add.image(0, 0, 'look.haze').setOrigin(0, 0).setScrollFactor(0).setDepth(60).setAlpha(look.fx.haze);
    top.setDisplaySize(vw, vh * 0.3);
    const bottom = scene.add.image(0, vh, 'look.haze').setOrigin(0, 0).setFlipY(true).setScrollFactor(0).setDepth(60).setAlpha(look.fx.haze * 0.8);
    bottom.setDisplaySize(vw, vh * 0.2);
    bottom.setY(vh - vh * 0.2);
    uiCam.ignore([top, bottom]);
  }

  // 画面の効果
  const fx = cam.postFX;
  if (fx) {
    if (look.fx.bloom > 0) fx.addBloom(0xffffff, 1, 1, 1, look.fx.bloom, 4);
    if (look.fx.tilt > 0) fx.addTiltShift(look.fx.tilt, 1, 0.2, 1, 1, 1);
    fx.addVignette(0.5, 0.55, 0.9, look.fx.vignette);
  }
}
