// 砂の音の材料（段階32b の直し）。Phaser を使わないので、テストで中身を確かめられる。
// 「さらさら」に聞こえるよう、ごく短く弱い粒をたくさん散らし、ゆらぐ「さーっ」という音を下に敷く。
// 粒が長く強いと、1粒ずつの「チリッ」が聞こえてザラザラになる（2026-10-10 開発者の感想）

/** 粒の音の形 */
export interface SandGrainShape {
  /** 1粒の長さ（秒） */
  grainSec: number;
  /** 粒の強さの幅（いちばん弱い・いちばん強い） */
  ampMin: number;
  ampMax: number;
}

/** 下に敷く「さーっ」の形 */
export interface SandHissShape {
  /** 大きさ */
  amp: number;
  /** ゆらぎの深さ（0 でゆらがない。1 で大きさが 0 まで下がる） */
  flutterDepth: number;
  /** ゆらぎの速さ（Hz）。いくつかの速さを重ねて、規則的に聞こえないようにする */
  flutterHz: readonly number[];
}

/**
 * 粒を count 個、ばらばらの時に置いて data に足す。
 * place は 0〜1 の乱数を、置く位置（0〜1。音の始めから終わり）に変える（密度を変えたい時に使う。省くと一様）
 */
export function addSandGrains(
  data: Float32Array,
  sampleRate: number,
  count: number,
  shape: SandGrainShape,
  rand: () => number = Math.random,
  place: (u: number) => number = (u) => u,
): void {
  const grainLen = Math.max(1, Math.floor(sampleRate * shape.grainSec));
  const room = data.length - grainLen;
  if (room <= 0) return;
  for (let k = 0; k < count; k++) {
    const at = Math.min(room, Math.max(0, Math.floor(place(rand()) * room)));
    const amp = shape.ampMin + rand() * (shape.ampMax - shape.ampMin);
    for (let i = 0; i < grainLen; i++) {
      // 立ち上がりも少しなだらかにして、「プチッ」という角を丸める
      const x = i / grainLen;
      const env = Math.sin(Math.PI * Math.min(1, x * 4) * 0.5) * Math.pow(1 - x, 2);
      data[at + i] += (rand() * 2 - 1) * amp * env;
    }
  }
}

/** ゆらぐ「さーっ」を data に足す */
export function addSandHiss(data: Float32Array, sampleRate: number, shape: SandHissShape, rand: () => number = Math.random): void {
  const phases = shape.flutterHz.map(() => rand() * Math.PI * 2);
  const n = shape.flutterHz.length || 1;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    let s = 0;
    shape.flutterHz.forEach((hz, k) => (s += Math.sin(2 * Math.PI * hz * t + phases[k])));
    // s / n は -1〜1。ゆらぎの深さぶん、大きさを下げる
    const level = 1 - shape.flutterDepth * (0.5 + 0.5 * (s / n));
    data[i] += (rand() * 2 - 1) * shape.amp * level;
  }
}
