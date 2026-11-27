// 段階295（docs/milestones/M3_explore_feel.md の 15.）：探索の地図の上下のぼかし。
// Phaser の TiltShift（点ごとに周りを100回読む）はスマホで重いので、周りを12回だけ読む軽いぼかしを書いた。
// 画面の真ん中の帯はくっきり、上下の端ほどぼける（ジオラマのように、主人公のまわりにピントが合って見える）
import Phaser from 'phaser';
import { MAP_BLUR } from '../data';

const FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uRes;
uniform float uBand;
uniform float uFocus;
uniform float uStrength;
varying vec2 outTexCoord;
// 点ごとに少し回す（読む点の並びが同じだと、ぼけの境目に筋が出るため）
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = outTexCoord;
  float d = clamp((abs(uv.y - uFocus) - uBand) / (0.5 - uBand), 0.0, 1.0);
  vec4 c = texture2D(uMainSampler, uv);
  if (d <= 0.0) { gl_FragColor = c; return; }
  float r = uStrength * (0.35 + 0.65 * d);
  float a0 = hash(gl_FragCoord.xy) * 6.2832;
  vec4 acc = c;
  float n = 1.0;
  for (int k = 0; k < 12; k++) {
    float fk = float(k);
    float a = a0 + fk * 2.39996;
    float rr = r * sqrt((fk + 0.5) / 12.0);
    acc += texture2D(uMainSampler, uv + vec2(cos(a), sin(a)) * rr / uRes);
    n += 1.0;
  }
  // くっきりした絵とぼかした絵を、なめらかに混ぜる（急に切り替わる線が出ないように）
  gl_FragColor = mix(c, acc / n, smoothstep(0.0, 1.0, d));
}`;

/** ピントの中心（画面の上から測った高さの割合）。探索の画面が毎フレーム主人公に合わせる（段階297） */
let focus = 0.5 + MAP_BLUR.offset;

/** ピントの中心を、主人公の画面の高さ（上から測った割合）に、なめらかに近づける。first の時はすぐ合わせる */
export function followMapBlur(playerY: number, first = false): void {
  const want = Phaser.Math.Clamp(playerY + MAP_BLUR.offset, MAP_BLUR.min, MAP_BLUR.max);
  focus = first ? want : focus + (want - focus) * MAP_BLUR.follow;
}

class MapBlur extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: 'MapBlur', fragShader: FRAG });
  }

  onPreRender(): void {
    this.set2f('uRes', this.renderer.width, this.renderer.height);
    this.set1f('uBand', MAP_BLUR.band);
    // 絵の中の高さは下から測るので、上から測った割合を返す
    this.set1f('uFocus', 1 - focus);
    // 画面の点の数に合わせる（高解像度の画面でも、見た目のぼけ方が同じになるように）
    this.set1f('uStrength', MAP_BLUR.strength * (this.renderer.height / 844));
  }
}

/** 地図のカメラに、上下のぼかしをかける（WebGL でない時は何もしない） */
export function applyMapBlur(scene: Phaser.Scene, cam: Phaser.Cameras.Scene2D.Camera, on: boolean): void {
  // 部屋を移るたびに重ならないよう、いったん外してからかける
  cam.resetPostPipeline();
  if (!on) return;
  const r = scene.renderer;
  if (!(r instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  if (!r.pipelines.getPostPipeline('MapBlur')) r.pipelines.addPostPipeline('MapBlur', MapBlur);
  cam.setPostPipeline('MapBlur');
}
