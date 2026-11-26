// 段階295（docs/milestones/M3_explore_feel.md の 15.）：探索の地図の上下のぼかし。
// Phaser の TiltShift（点ごとに周りを100回読む）はスマホで重いので、周りを16回だけ読む軽いぼかしを書いた。
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
void main() {
  vec2 uv = outTexCoord;
  float d = clamp((abs(uv.y - uFocus) - uBand) / (0.5 - uBand), 0.0, 1.0);
  float r = d * d * uStrength;
  vec4 c = texture2D(uMainSampler, uv);
  if (r < 0.3) { gl_FragColor = c; return; }
  vec2 p = r / uRes;
  vec4 acc = c * 0.12;
  acc += (texture2D(uMainSampler, uv + vec2(p.x, 0.0)) + texture2D(uMainSampler, uv - vec2(p.x, 0.0)) + texture2D(uMainSampler, uv + vec2(0.0, p.y)) + texture2D(uMainSampler, uv - vec2(0.0, p.y))) * 0.07;
  acc += (texture2D(uMainSampler, uv + p * 0.7) + texture2D(uMainSampler, uv - p * 0.7) + texture2D(uMainSampler, uv + vec2(p.x, -p.y) * 0.7) + texture2D(uMainSampler, uv + vec2(-p.x, p.y) * 0.7)) * 0.06;
  vec2 q = p * 0.5;
  acc += (texture2D(uMainSampler, uv + vec2(q.x, 0.0)) + texture2D(uMainSampler, uv - vec2(q.x, 0.0)) + texture2D(uMainSampler, uv + vec2(0.0, q.y)) + texture2D(uMainSampler, uv - vec2(0.0, q.y))) * 0.06;
  acc += (texture2D(uMainSampler, uv + vec2(q.x, q.y)) + texture2D(uMainSampler, uv - vec2(q.x, q.y)) + texture2D(uMainSampler, uv + vec2(q.x, -q.y)) + texture2D(uMainSampler, uv + vec2(-q.x, q.y))) * 0.05;
  gl_FragColor = acc;
}`;

class MapBlur extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: 'MapBlur', fragShader: FRAG });
  }

  onPreRender(): void {
    this.set2f('uRes', this.renderer.width, this.renderer.height);
    this.set1f('uBand', MAP_BLUR.band);
    // 絵の中の高さは下から測るので、上から測った割合を返す
    this.set1f('uFocus', 1 - MAP_BLUR.focus);
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
