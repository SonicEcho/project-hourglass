import Phaser from 'phaser';
import type { DigTile } from '../core';
import { SAND_BOTTOM_COLORS } from '../data';
import { hasImage } from '../assets/loader';
import { RENDER_SCALE } from '../ui/theme';

// 砂の底の絵（段階210。S2。docs/milestones/M3_sand_bottom.md）。ブロック・宝箱・番人・動く砂嵐・地上は、コードで描く（質感の絵）。
// 掘る人（二頭身のハルト）は絵を頼んでいる（docs/ART_QUEUE.md の T）。届くまでは、同じ形（4行×3列）の仮の絵をコードで描く。
// どれも1度だけ作って、画面を開き直しても使い回す。描く倍率（RENDER_SCALE）に合わせた細かさで作る

/** 1マスの大きさ（画面の座標） */
export const DIG_TILE = 26;
/** 同じ種類のブロックの柄の数（マスの位置で選ぶ） */
const VARIANTS = 3;
const TILES_KEY = 'dig-tiles';
const ROAMER_KEY = 'dig-roamer';
const HERO_PLACEHOLDER_KEY = 'dig-hero-placeholder';
/** 届いた掘る人の絵（台帳の id）。届いたら台帳に足し、砂の底に入る前に読む */
export const DIG_HERO_ART = 'sprite.dig_hero';

/** 動きの絵の行（4行×3列。docs/milestones/M3_sand_bottom.md の S2） */
export type DigPose = 'walk' | 'digSide' | 'digDown' | 'climb';
const POSE_ROW: Record<DigPose, number> = { walk: 0, digSide: 1, digDown: 2, climb: 3 };

/** ブロックの絵の種類（DigTile のうち、絵が1枚で決まる物） */
type TileArt = 'sand' | 'loose' | 'clay' | 'rock' | 'ore' | 'grain' | 'air';
const LAYER_ARTS: TileArt[] = ['sand', 'loose', 'clay', 'rock', 'ore', 'grain', 'air'];
const SINGLE_ARTS = ['surface', 'chest', 'guard', 'crack'] as const;

// ---- 色と乱数 ----

function rgb(c: number): [number, number, number] {
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

/** 明るさを変えた色（f が 1 より大きいと明るく、小さいと暗く） */
function shade(c: number, f: number, a = 1): string {
  const [r, g, b] = rgb(c).map((v) => (f >= 1 ? v + (255 - v) * (f - 1) : v * f).toFixed(0));
  return `rgba(${r},${g},${b},${a})`;
}

/** '#rrggbb' の明るさを変えた色 */
function shadeHex(hex: string, f: number): string {
  return shade(parseInt(hex.slice(1), 16), f);
}

/** 絵の柄を決める乱数（見た目だけ。毎回同じ柄になるように、種から決まる） */
function artRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- ブロックの絵（1マス DIG_TILE の座標で描く） ----

type Ctx = CanvasRenderingContext2D;
const T = DIG_TILE;

function speckles(ctx: Ctx, base: number, rand: () => number, n: number, light = 1.3, dark = 0.7): void {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rand() < 0.5 ? shade(base, light, 0.55 + rand() * 0.4) : shade(base, dark, 0.45 + rand() * 0.4);
    const s = rand() < 0.15 ? 2 : 1;
    ctx.fillRect(Math.floor(rand() * T), Math.floor(rand() * T), s, s);
  }
}

/** 薄い地層の筋（横にゆるく波打つ線） */
function strata(ctx: Ctx, base: number, rand: () => number, n: number): void {
  for (let i = 0; i < n; i++) {
    const y = 4 + rand() * (T - 8);
    ctx.strokeStyle = shade(base, rand() < 0.5 ? 0.82 : 1.12, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= T; x += 6.5) ctx.lineTo(x, y + (rand() - 0.5) * 2.2);
    ctx.stroke();
  }
}

function fillBase(ctx: Ctx, base: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, shade(base, 1.06));
  g.addColorStop(1, shade(base, 0.9));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, T, T);
}

function drawSand(ctx: Ctx, base: number, rand: () => number): void {
  fillBase(ctx, base);
  strata(ctx, base, rand, 2);
  speckles(ctx, base, rand, 55);
}

function drawLoose(ctx: Ctx, base: number, rand: () => number): void {
  fillBase(ctx, base);
  // さらさら流れる斜めの筋
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const x = rand() * T;
    const y = rand() * T;
    ctx.strokeStyle = shade(base, 1.22, 0.55);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y + 5);
    ctx.stroke();
  }
  speckles(ctx, base, rand, 70, 1.35, 0.78);
}

function pebble(ctx: Ctx, base: number, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = shade(base, 0.62);
  ctx.beginPath();
  ctx.ellipse(x + 0.6, y + 0.8, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(base, 1.28);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x - rx * 0.5, y - ry * 0.6, 1, 1);
}

function drawClay(ctx: Ctx, base: number, rand: () => number): void {
  fillBase(ctx, base);
  // 濃いしみ
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = shade(base, 0.82, 0.5);
    ctx.beginPath();
    ctx.ellipse(rand() * T, rand() * T, 2 + rand() * 4, 1.5 + rand() * 2, rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  speckles(ctx, base, rand, 30, 1.2, 0.65);
  // ひび
  ctx.strokeStyle = shade(base, 0.5, 0.75);
  ctx.lineWidth = 1;
  ctx.beginPath();
  let x = 3 + rand() * 8;
  let y = 2 + rand() * 6;
  ctx.moveTo(x, y);
  for (let i = 0; i < 4; i++) {
    x += 2 + rand() * 4;
    y += 2 + rand() * 4;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  pebble(ctx, base, 5 + rand() * 16, 6 + rand() * 14, 2.4, 1.7);
  pebble(ctx, base, 4 + rand() * 18, 4 + rand() * 18, 1.6, 1.2);
}

/** 角ばった石の塊（岩と鉱脈） */
function stone(ctx: Ctx, color: number, rand: () => number): void {
  const pts: [number, number][] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.4;
    const r = 10.5 + rand() * 2.4;
    pts.push([T / 2 + Math.cos(a) * r, T / 2 + Math.sin(a) * r]);
  }
  const path = () => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(2, 2, T - 2, T - 2);
  g.addColorStop(0, shade(color, 1.35));
  g.addColorStop(0.55, shade(color, 1));
  g.addColorStop(1, shade(color, 0.58));
  ctx.fillStyle = g;
  path();
  ctx.fill();
  // 面の切れ目
  ctx.strokeStyle = shade(color, 0.6, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[1][0], pts[1][1]);
  ctx.lineTo(T / 2 + (rand() - 0.5) * 4, T / 2 + (rand() - 0.5) * 4);
  ctx.lineTo(pts[4][0], pts[4][1]);
  ctx.stroke();
  ctx.strokeStyle = shade(color, 1.5, 0.6);
  ctx.beginPath();
  ctx.moveTo(pts[n - 2][0], pts[n - 2][1]);
  ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  ctx.lineTo(pts[0][0], pts[0][1]);
  ctx.stroke();
  ctx.strokeStyle = shade(color, 0.42, 0.9);
  path();
  ctx.stroke();
}

function drawRock(ctx: Ctx, c: (typeof SAND_BOTTOM_COLORS)[string], rand: () => number): void {
  fillBase(ctx, c.clay);
  speckles(ctx, c.clay, rand, 20, 1.15, 0.7);
  stone(ctx, c.rock, rand);
}

function crystal(ctx: Ctx, x: number, y: number, s: number, tilt: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = 'rgba(255,215,106,0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.3);
  ctx.lineTo(s * 0.6, 0);
  ctx.lineTo(0, s * 1.3);
  ctx.lineTo(-s * 0.6, 0);
  ctx.closePath();
  ctx.fillStyle = '#ffd76a';
  ctx.fill();
  ctx.strokeStyle = '#8a5a10';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#fff6d0';
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.1);
  ctx.lineTo(s * 0.35, -s * 0.1);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawOre(ctx: Ctx, c: (typeof SAND_BOTTOM_COLORS)[string], rand: () => number): void {
  fillBase(ctx, c.clay);
  speckles(ctx, c.clay, rand, 16, 1.15, 0.7);
  stone(ctx, c.rock, rand);
  crystal(ctx, 8 + rand() * 3, 9 + rand() * 3, 3, -0.4);
  crystal(ctx, 16 + rand() * 3, 15 + rand() * 3, 3.6, 0.3);
  crystal(ctx, 9 + rand() * 4, 18 + rand() * 2, 2.2, 0.1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(18, 6, 1, 3);
  ctx.fillRect(17, 7, 3, 1);
}

function drawGrain(ctx: Ctx, base: number, rand: () => number): void {
  drawSand(ctx, base, rand);
  const g = ctx.createRadialGradient(T / 2, T / 2, 1, T / 2, T / 2, 12);
  g.addColorStop(0, 'rgba(255,246,208,0.95)');
  g.addColorStop(0.35, 'rgba(255,215,106,0.6)');
  g.addColorStop(1, 'rgba(255,215,106,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, T, T);
  // 砂時計の形の光る粒
  ctx.fillStyle = '#fff2b8';
  ctx.beginPath();
  ctx.moveTo(T / 2 - 4, T / 2 - 6);
  ctx.lineTo(T / 2 + 4, T / 2 - 6);
  ctx.lineTo(T / 2, T / 2);
  ctx.lineTo(T / 2 + 4, T / 2 + 6);
  ctx.lineTo(T / 2 - 4, T / 2 + 6);
  ctx.lineTo(T / 2, T / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c8902a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(T / 2 - 0.5, T / 2 - 10, 1, 3);
  ctx.fillRect(T / 2 + 6, T / 2 + 2, 2, 1);
}

function drawAir(ctx: Ctx, base: number, rand: () => number): void {
  ctx.fillStyle = shade(base, 1);
  ctx.fillRect(0, 0, T, T);
  // 奥の土の壁：ぼんやりした明暗と、まばらな粒
  for (let i = 0; i < 3; i++) {
    const x = rand() * T;
    const y = rand() * T;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6 + rand() * 6);
    g.addColorStop(0, shade(base, 1.6, 0.35));
    g.addColorStop(1, shade(base, 1.6, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, T, T);
  }
  speckles(ctx, base, rand, 8, 1.8, 0.6);
}

function drawSurface(ctx: Ctx): void {
  const g = ctx.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, '#2a3a6a');
  g.addColorStop(0.7, '#a0587a');
  g.addColorStop(1, '#e89a5a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, T, T);
}

function drawChest(ctx: Ctx, air: number, rand: () => number): void {
  drawAir(ctx, air, rand);
  // 箱の影
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(4, T - 4, T - 7, 3);
  // ふた（丸い）と箱
  ctx.fillStyle = '#8a5222';
  ctx.beginPath();
  ctx.moveTo(4, 12);
  ctx.quadraticCurveTo(T / 2, 3, T - 4, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a8662a';
  ctx.fillRect(4, 12, T - 8, 10);
  // 板の筋
  ctx.strokeStyle = 'rgba(60,30,10,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 17);
  ctx.lineTo(T - 4, 17);
  ctx.stroke();
  // 金具
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(4, 11, T - 8, 2);
  ctx.fillRect(7, 6, 2, 16);
  ctx.fillRect(T - 9, 6, 2, 16);
  ctx.fillStyle = '#fff2b8';
  ctx.fillRect(T / 2 - 2, 12, 4, 5);
  ctx.fillStyle = '#5a3210';
  ctx.fillRect(T / 2 - 0.5, 14, 1, 2);
  ctx.strokeStyle = '#3a1e08';
  ctx.strokeRect(4.5, 12.5, T - 9, 9);
}

function drawGuard(ctx: Ctx, rand: () => number): void {
  const g = ctx.createRadialGradient(T / 2, T / 2, 2, T / 2, T / 2, T * 0.75);
  g.addColorStop(0, '#9a1a24');
  g.addColorStop(1, '#2a0408');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, T, T);
  // 砂の塊の体（盛り上がった影）
  ctx.fillStyle = '#5a2a1a';
  ctx.beginPath();
  ctx.moveTo(3, T);
  ctx.quadraticCurveTo(2, 7, T / 2, 4);
  ctx.quadraticCurveTo(T - 2, 7, T - 3, T);
  ctx.closePath();
  ctx.fill();
  speckles(ctx, 0x8a4a2a, rand, 40, 1.4, 0.6);
  // 角
  ctx.fillStyle = '#2a0a06';
  ctx.beginPath();
  ctx.moveTo(7, 8);
  ctx.lineTo(5, 1);
  ctx.lineTo(10, 6);
  ctx.moveTo(T - 7, 8);
  ctx.lineTo(T - 5, 1);
  ctx.lineTo(T - 10, 6);
  ctx.fill();
  // 光る目
  for (const ex of [9, T - 9]) {
    ctx.fillStyle = 'rgba(255,90,90,0.45)';
    ctx.beginPath();
    ctx.arc(ex, 12, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd0c0';
    ctx.beginPath();
    ctx.arc(ex, 12, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#ff4d4d';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.75, 0.75, T - 1.5, T - 1.5);
}

/** 掘っている時に重ねる、ひび */
function drawCrack(ctx: Ctx): void {
  ctx.strokeStyle = 'rgba(20,10,0,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(T / 2, T / 2);
  ctx.lineTo(4, 5);
  ctx.moveTo(T / 2, T / 2);
  ctx.lineTo(T - 3, 8);
  ctx.moveTo(T / 2, T / 2);
  ctx.lineTo(T / 2 + 3, T - 2);
  ctx.moveTo(T / 2, T / 2);
  ctx.lineTo(3, T - 6);
  ctx.moveTo(T / 2 - 6, T / 2 - 3);
  ctx.lineTo(T / 2 - 4, T / 2 + 3);
  ctx.stroke();
}

/** ブロックの絵をまとめた1枚（コマの名前は tileFrame） */
export function ensureDigTiles(scene: Phaser.Scene): void {
  if (scene.textures.exists(TILES_KEY)) return;
  const R = RENDER_SCALE;
  const S = T * R;
  // 段階212：まだ開いていない章の層の帯も、はじめから全部作る
  const layers = Object.keys(SAND_BOTTOM_COLORS);
  const rows = layers.length * LAYER_ARTS.length + 1;
  const cols = Math.max(VARIANTS, SINGLE_ARTS.length);
  const tex = scene.textures.createCanvas(TILES_KEY, cols * S, rows * S);
  if (!tex) return;
  const ctx = tex.getContext();
  const paint = (name: string, col: number, row: number, draw: (c: Ctx) => void) => {
    ctx.save();
    ctx.translate(col * S, row * S);
    ctx.scale(R, R);
    ctx.beginPath();
    ctx.rect(0, 0, T, T);
    ctx.clip();
    draw(ctx);
    ctx.restore();
    tex.add(name, 0, col * S, row * S, S, S);
  };
  layers.forEach((id, li) => {
    const c = SAND_BOTTOM_COLORS[id];
    LAYER_ARTS.forEach((art, ai) => {
      for (let v = 0; v < VARIANTS; v++) {
        const rand = artRand(li * 1000 + ai * 37 + v * 7 + 11);
        paint(`${id}:${art}:${v}`, v, li * LAYER_ARTS.length + ai, (cx) => {
          if (art === 'sand') drawSand(cx, c.sand, rand);
          else if (art === 'loose') drawLoose(cx, c.loose, rand);
          else if (art === 'clay') drawClay(cx, c.clay, rand);
          else if (art === 'rock') drawRock(cx, c, rand);
          else if (art === 'ore') drawOre(cx, c, rand);
          else if (art === 'grain') drawGrain(cx, c.sand, rand);
          else drawAir(cx, c.air, rand);
        });
      }
    });
  });
  const last = rows - 1;
  const air0 = SAND_BOTTOM_COLORS[layers[0]].air;
  paint('surface', 0, last, drawSurface);
  paint('chest', 1, last, (cx) => drawChest(cx, air0, artRand(901)));
  paint('guard', 2, last, (cx) => drawGuard(cx, artRand(902)));
  paint('crack', 3, last, drawCrack);
  tex.refresh();
}

/** そのマスの絵（ブロックの絵の1枚の、どのコマか）。宝箱・番人の下地も含めて1枚で描く */
export function tileFrame(layerId: string, tile: DigTile, x: number, y: number): { key: string; frame: string } {
  const v = ((x * 7 + y * 13) ^ (y * 3)) % VARIANTS;
  if (tile === 'chest' || tile === 'guard') return { key: TILES_KEY, frame: tile };
  const art: TileArt = tile === 'sand' || tile === 'loose' || tile === 'clay' || tile === 'rock' || tile === 'ore' || tile === 'grain' ? tile : 'air';
  return { key: TILES_KEY, frame: `${layerId}:${art}:${v}` };
}

export const DIG_SURFACE_FRAME = { key: TILES_KEY, frame: 'surface' };
export const DIG_CRACK_FRAME = { key: TILES_KEY, frame: 'crack' };

/** 掘れる土・岩（空洞との境目に影を付ける） */
export function isSolid(tile: DigTile | undefined): boolean {
  return tile === 'sand' || tile === 'clay' || tile === 'rock' || tile === 'ore' || tile === 'grain' || tile === 'loose';
}

// ---- 動く砂嵐（渦巻く砂。3コマで回る） ----

export const ROAMER_ANIM = 'dig-roamer-spin';

export function ensureDigRoamer(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ROAMER_KEY)) {
    const R = RENDER_SCALE;
    const S = T * R;
    const tex = scene.textures.createCanvas(ROAMER_KEY, S * 3, S);
    if (!tex) return;
    const ctx = tex.getContext();
    for (let f = 0; f < 3; f++) {
      ctx.save();
      ctx.translate(f * S, 0);
      ctx.scale(R, R);
      const cx = T / 2;
      const cy = T / 2;
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, T / 2);
      glow.addColorStop(0, 'rgba(255,90,70,0.55)');
      glow.addColorStop(1, 'rgba(255,90,70,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, T, T);
      // 渦の腕（3本。コマごとに少し回す）
      for (let k = 0; k < 3; k++) {
        const a0 = (k / 3) * Math.PI * 2 + (f / 3) * ((Math.PI * 2) / 3);
        ctx.strokeStyle = k === 0 ? '#ffb070' : '#d8603a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const a = a0 + i * 0.32;
          const r = 3 + i * 0.95;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r * 0.85;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      // 砂粒
      const rand = artRand(500 + f);
      for (let i = 0; i < 12; i++) {
        const a = rand() * Math.PI * 2;
        const r = 4 + rand() * 8;
        ctx.fillStyle = rand() < 0.5 ? '#ffd0a0' : '#a8402a';
        ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.2, 1.2);
      }
      // 芯と目
      ctx.fillStyle = '#3a0c0a';
      ctx.beginPath();
      ctx.arc(cx, cy, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5a4a';
      ctx.fillRect(cx - 3, cy - 1.5, 2, 2);
      ctx.fillRect(cx + 1, cy - 1.5, 2, 2);
      ctx.restore();
      tex.add(`r${f}`, 0, f * S, 0, S, S);
    }
    tex.refresh();
  }
  if (!scene.anims.exists(ROAMER_ANIM)) {
    scene.anims.create({ key: ROAMER_ANIM, frames: [0, 1, 2].map((f) => ({ key: ROAMER_KEY, frame: `r${f}` })), frameRate: 9, repeat: -1 });
  }
}

export const ROAMER_TEXTURE = ROAMER_KEY;

// ---- 掘る人（二頭身のハルト） ----

/** 仮の絵の1コマの大きさと、足もとの位置（画面の座標） */
const HW = 56;
const HH = 56;
const FOOT_X = 26;
const FOOT_Y = 44;

interface Pose {
  /** 体の上下（跳ねる・しゃがむ） */
  bob: number;
  /** 前の足・後ろの足のずれ */
  legs: [number, number];
  /** 腕の向き（度。0 が前、90 が下） */
  arm: number;
  /** スコップの向き（度） */
  tool: number;
  /** 腕の長さ（伸ばすと長い） */
  reach: number;
  /** 前かがみ */
  lean: number;
}

const POSES: Record<DigPose, Pose[]> = {
  walk: [
    { bob: 0, legs: [3, -3], arm: 70, tool: -60, reach: 5, lean: 0 },
    { bob: -1, legs: [0, 0], arm: 75, tool: -62, reach: 5, lean: 0 },
    { bob: 0, legs: [-3, 3], arm: 70, tool: -60, reach: 5, lean: 0 },
  ],
  digSide: [
    { bob: 0, legs: [2, -2], arm: 160, tool: -150, reach: 5, lean: -1 },
    { bob: 0, legs: [3, -2], arm: 30, tool: -10, reach: 6, lean: 1 },
    { bob: 1, legs: [4, -3], arm: 8, tool: 5, reach: 8, lean: 2 },
  ],
  digDown: [
    { bob: -1, legs: [1, -1], arm: -40, tool: -75, reach: 8, lean: 0 },
    { bob: 0, legs: [2, -2], arm: 35, tool: 60, reach: 6, lean: 1 },
    { bob: 2, legs: [3, -3], arm: 70, tool: 92, reach: 7, lean: 2 },
  ],
  climb: [
    { bob: 1, legs: [2, -2], arm: -45, tool: -78, reach: 8, lean: 0 },
    { bob: -2, legs: [1, -1], arm: -60, tool: -86, reach: 9, lean: 0 },
    { bob: -1, legs: [3, -3], arm: -50, tool: -80, reach: 8, lean: 0 },
  ],
};

const rad = (d: number) => (d * Math.PI) / 180;

/** 仮の二頭身の見た目（段階211。人ごとに髪と服の色を変える。届いた絵があれば使わない） */
interface Look {
  hair: string;
  /** 前髪のひと筋（ハルトの砂金色） */
  strand?: string;
  /** 長い髪（背中まで） */
  longHair?: boolean;
  /** あごひげ */
  beard?: string;
  /** 上着と袖 */
  top: string;
  sleeve: string;
  /** 前の開きから見える服・ネクタイ・裏地 */
  inner: string;
  tie?: string;
  lining?: string;
  legs: string;
  shoes: string;
}

const LOOKS: Record<string, Look> = {
  hero: { hair: '#1c1c28', strand: '#e8c060', top: '#27315c', sleeve: '#1e2648', inner: '#f2f2f6', tie: '#e0b040', lining: '#e8803a', legs: '#2c2c3e', shoes: '#f0f0f4' },
  akari: { hair: '#7a4a2a', top: '#e2cfa8', sleeve: '#c8b48c', inner: '#ffffff', tie: '#c83a4a', legs: '#3a4a6a', shoes: '#8a4a3a' },
  mio: { hair: '#b07840', strand: '#f08a30', top: '#f2c830', sleeve: '#f2c830', inner: '#f2c830', legs: '#3a5a8a', shoes: '#e8e8f0' },
  sayoko: { hair: '#14141c', longHair: true, top: '#2a2f6a', sleeve: '#2a2f6a', inner: '#f0f0f8', lining: '#b0202a', legs: '#2a2f6a', shoes: '#b0202a' },
  hayase: { hair: '#4a4a52', strand: '#a8a8b0', beard: '#5a5a62', top: '#1f2a44', sleeve: '#1a2238', inner: '#202024', legs: '#3a3a40', shoes: '#5a3a22' },
};

/** 仮の二頭身のハルト（右向き、横から少し斜め）。黒髪に砂金色のひと筋、紺のパーカー（裏地は夕焼け色）、スコップ */
function drawHero(ctx: Ctx, p: Pose, look: Look): void {
  const fx = FOOT_X + p.lean;
  const fy = FOOT_Y;
  const ink = '#241a1a';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // 足（後ろの足は暗く）
  const leg = (dx: number, back: boolean) => {
    const x = FOOT_X + dx;
    ctx.strokeStyle = back ? shadeHex(look.legs, 0.7) : look.legs;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx + (back ? -1.5 : 1.5), fy - 8 + p.bob);
    ctx.lineTo(x, fy - 2);
    ctx.stroke();
    ctx.fillStyle = back ? shadeHex(look.shoes, 0.78) : look.shoes;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(x + 1, fy - 1.2, 2.6, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  leg(p.legs[1], true);
  leg(p.legs[0], false);
  // 体（上着）
  const by = fy - 17 + p.bob;
  ctx.fillStyle = look.top;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fx - 6, by + 10);
  ctx.lineTo(fx - 5, by + 1);
  ctx.quadraticCurveTo(fx, by - 1, fx + 5, by + 1);
  ctx.lineTo(fx + 6, by + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 前の開き：中の服・ネクタイ（リボン）・裏地（帯）
  ctx.fillStyle = look.inner;
  ctx.fillRect(fx + 1.5, by + 1, 2.5, 8.5);
  if (look.tie) {
    ctx.fillStyle = look.tie;
    ctx.fillRect(fx + 2.2, by + 1.5, 1.2, 4.5);
  }
  if (look.lining) {
    ctx.fillStyle = look.lining;
    ctx.fillRect(fx + 4, by + 1.5, 1, 8);
  }
  // スコップと腕（前の腕）。上に掲げる時は、頭より手前に描く
  const arm = () => {
    const sx = fx;
    const sy = by + 2.5;
    const hx = sx + Math.cos(rad(p.arm)) * p.reach;
    const hy = sy + Math.sin(rad(p.arm)) * p.reach;
    const tx = Math.cos(rad(p.tool));
    const ty = Math.sin(rad(p.tool));
    const ex = hx + tx * 11;
    const ey = hy + ty * 11;
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(hx - tx * 3, hy - ty * 3);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = '#a06a32';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // 刃
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(rad(p.tool));
    ctx.fillStyle = '#c8ccd6';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(5, -2.6);
    ctx.quadraticCurveTo(7.5, 0, 5, 2.6);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(1, -2, 3, 1);
    ctx.restore();
    // 腕
    ctx.strokeStyle = look.sleeve;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = '#f6d7b8';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(hx, hy, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  const raised = p.arm < -20;
  if (!raised) arm();
  // 頭（大きく）
  const cx = fx + 0.5;
  const cy = fy - 26 + p.bob;
  const r = 9.5;
  // 長い髪は、頭の後ろから背中へ
  if (look.longHair) {
    ctx.fillStyle = look.hair;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r - 0.5, cy);
    ctx.quadraticCurveTo(cx - r - 3, by + 6, cx - r + 1, by + 9);
    ctx.lineTo(cx - 2, by + 7);
    ctx.lineTo(cx - 1, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#f6d7b8';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 髪（後ろ側は耳の下まで、前はぼさぼさの前髪）
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  ctx.moveTo(cx - r - 0.6, cy + 4);
  ctx.quadraticCurveTo(cx - r - 1.5, cy - r - 2, cx + 1, cy - r - 1.2);
  ctx.quadraticCurveTo(cx + r + 2, cy - r + 1, cx + r + 0.8, cy - 1);
  ctx.lineTo(cx + r - 1, cy - 2.5);
  ctx.lineTo(cx + 6.5, cy - 4);
  ctx.lineTo(cx + 5, cy - 1.5);
  ctx.lineTo(cx + 3, cy - 4.5);
  ctx.lineTo(cx + 0.5, cy - 2.5);
  ctx.lineTo(cx - 1.5, cy - 5);
  ctx.lineTo(cx - 3.5, cy - 1);
  ctx.lineTo(cx - 5, cy + 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.stroke();
  // 前髪のひと筋（ハルトの砂金色・みおの髪ゴム・早瀬の白髪）
  if (look.strand) {
    ctx.strokeStyle = look.strand;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - r);
    ctx.quadraticCurveTo(cx + 4.5, cy - 7, cx + 3.5, cy - 3.5);
    ctx.stroke();
  }
  // 耳
  ctx.fillStyle = '#f0c8a6';
  ctx.beginPath();
  ctx.ellipse(cx - 2.5, cy + 1.5, 1.6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // 目（こはく色。右向きなので右寄りに2つ）
  for (const [ex2, w] of [
    [cx + 3, 1.5],
    [cx + 7.2, 1.2],
  ] as const) {
    ctx.fillStyle = '#3a2210';
    ctx.beginPath();
    ctx.ellipse(ex2, cy + 1.5, w, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8902a';
    ctx.fillRect(ex2 - 0.5, cy + 2, 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ex2 - 0.6, cy + 0.2, 0.9, 0.9);
  }
  // ほお・口
  ctx.fillStyle = 'rgba(240,120,110,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + 3.5, cy + 5, 1.8, 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a4a3a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + 5.5, cy + 6);
  ctx.lineTo(cx + 7, cy + 5.8);
  ctx.stroke();
  if (look.beard) {
    ctx.fillStyle = look.beard;
    ctx.beginPath();
    ctx.ellipse(cx + 4.5, cy + 7.5, 3.6, 1.8, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (raised) arm();
}

/** 掘る人の絵（届いた絵があればそれ。なければ仮の絵）。どちらも4行×3列で、コマの名前は `${行}-${列}` */
export interface DigHeroSprite {
  key: string;
  /** 足もとの位置（コマの中の割合） */
  originX: number;
  originY: number;
  /** 1コマを画面に出す時の倍率 */
  scale: number;
  anim: (pose: DigPose) => string;
  idleFrame: string;
}

/** 掘る人の絵の台帳の id（段階211。ハルトは sprite.dig_hero、ほかの人は sprite.dig_<人>） */
export function digArtId(who: string): string {
  return who === 'hero' ? DIG_HERO_ART : `sprite.dig_${who}`;
}

export function ensureDigHero(scene: Phaser.Scene, who = 'hero'): DigHeroSprite {
  const R = RENDER_SCALE;
  const art = digArtId(who);
  const real = hasImage(scene, art);
  const key = real ? art : `${HERO_PLACEHOLDER_KEY}-${LOOKS[who] ? who : 'hero'}`;
  let cellH = HH * R;
  if (real) {
    // 届いた絵：マス目どおりに12に切る（白い背景は抜いてある前提）
    const tex = scene.textures.get(key);
    const src = tex.getSourceImage() as HTMLImageElement;
    const cw = Math.floor(src.width / 3);
    const ch = Math.floor(src.height / 4);
    cellH = ch;
    if (!tex.has('0-0')) for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) tex.add(`${row}-${col}`, 0, col * cw, row * ch, cw, ch);
  } else if (!scene.textures.exists(key)) {
    const S = HW * R;
    const tex = scene.textures.createCanvas(key, S * 3, HH * R * 4);
    if (tex) {
      const ctx = tex.getContext();
      (Object.keys(POSE_ROW) as DigPose[]).forEach((pose) => {
        POSES[pose].forEach((p, col) => {
          const row = POSE_ROW[pose];
          ctx.save();
          ctx.translate(col * S, row * HH * R);
          ctx.scale(R, R);
          // となりのコマにはみ出さないように
          ctx.beginPath();
          ctx.rect(0, 0, HW, HH);
          ctx.clip();
          drawHero(ctx, p, LOOKS[who] ?? LOOKS.hero);
          ctx.restore();
          tex.add(`${row}-${col}`, 0, col * S, row * HH * R, S, HH * R);
        });
      });
      tex.refresh();
    }
  }
  const anim = (pose: DigPose) => `${key}:${pose}`;
  // 歩く行：届いた絵は 立ち・左足・右足、仮の絵は 左足・立ち・右足 の順。立ちをはさんで足を交互に出す
  const stand = real ? 0 : 1;
  const walk = real ? [1, 0, 2, 0] : [0, 1, 2, 1];
  for (const pose of Object.keys(POSE_ROW) as DigPose[]) {
    if (scene.anims.exists(anim(pose))) continue;
    const row = POSE_ROW[pose];
    scene.anims.create({
      key: anim(pose),
      frames: (pose === 'walk' ? walk : [0, 1, 2]).map((col) => ({ key, frame: `${row}-${col}` })),
      frameRate: pose === 'walk' ? 14 : 20,
      repeat: pose === 'walk' ? -1 : 0,
    });
  }
  // 画面では、頭から足まで1マス半ほどの高さに出す（仮の絵は、描いた大きさのまま少し小さく）。
  // 届いた絵の足もとの位置は scripts/dig_sprite.py でそろえた所（HEAD_X・FOOT_Y）
  const scale = real ? (T * 1.5) / cellH : 0.9 / R;
  return { key, originX: real ? 0.45 : FOOT_X / HW, originY: real ? 0.93 : FOOT_Y / HH, scale, anim, idleFrame: `0-${stand}` };
}
