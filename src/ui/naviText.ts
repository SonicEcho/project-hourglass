import type { ChainPassive, GearColor, NaviPartDef, PassiveEffect, Stats } from '../core';
import { ELEMENT_LABEL } from './labels';

// ムーブメントの表示用の文字（画面に依存しない。テストからも使う）

export const STAT_LABEL: Record<keyof Stats, string> = { hp: 'HP', mp: 'MP', atk: '攻撃', mag: '魔力', def: '防御', spd: '速さ' };

/** ギアの色の名前（段階146：金属の名前。赤＝銅、青＝鋼、緑＝青銅、黄＝真鍮。docs/ART.md の 5-9） */
export const PART_COLOR_LABEL: Record<GearColor, string> = { red: '銅', blue: '鋼', green: '青銅', yellow: '真鍮', silver: '銀' };

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

/** 特性の説明 */
export function describePassive(p: PassiveEffect): string {
  switch (p.kind) {
    case 'elementBoost':
      return `${ELEMENT_LABEL[p.element]}のダメージ +${pct(p.rate)}`;
    case 'partBoost':
      return `部位へのダメージ +${pct(p.rate)}`;
    case 'oneMoreDraw':
      return `延長の時に引く枚数 +${p.count}`;
    case 'batonBoost':
      return `バトンを受けた時の倍率 +${p.rate}（1.25 → ${1.25 + p.rate}）`;
    case 'comboBoost':
      return `自分が使うコンボのダメージ・回復量 +${pct(p.rate)}`;
    case 'regen':
      return `ラウンドの始めに最大HPの${pct(p.rate)}を回復`;
    case 'mpSave':
      return `魔法・スキルのMP消費 −${p.amount}（最低1）`;
    case 'startDash':
      return '戦闘の最初のラウンド、行動が先制になる';
    case 'bug':
      return `狂い：ラウンドの始めに最大HPの${pct(p.rate)}を失う`;
  }
}

/** ギアの効果の説明 */
export function describePart(def: NaviPartDef): string {
  if (def.kind === 'stat') {
    return (Object.entries(def.stats) as [keyof Stats, number][]).map(([k, v]) => `${STAT_LABEL[k]} +${v}`).join('、');
  }
  if (def.kind === 'bond') return '3人のコンボを開く（ブリッジに乗っている時。並びにその3人がそろえば、アルバムから使える）';
  return describeTraits([def.effect]).join('、');
}

/** ギアの種類と、効く条件 */
export function partKindText(def: NaviPartDef): string {
  if (def.kind === 'bond') return '絆のギア（ブリッジに乗っている時だけ効く。狂いを起こさない）';
  return def.kind === 'stat' ? '能力値ギア（ムーブメントのどこに置いても効く）' : '効果ギア（ブリッジに乗っている時だけ効く）';
}

/** 同じ特性をまとめて「×2」のように書く */
export function summarizePassives(passives: PassiveEffect[]): string[] {
  const out: { text: string; n: number }[] = [];
  for (const p of passives) {
    const text = describePassive(p);
    const found = out.find((o) => o.text === text);
    if (found) found.n++;
    else out.push({ text, n: 1 });
  }
  return out.map((o) => (o.n > 1 ? `${o.text} ×${o.n}` : o.text));
}

/** 新しい戦闘の特性（段階197：武器の進化先と型。段階200：ギアの効果も） */
export function describeTraits(traits: ChainPassive[]): string[] {
  return traits.map((t) => {
    switch (t.kind) {
      case 'elementBoost':
        return `${ELEMENT_LABEL[t.element]}の威力 +${pct(t.rate)}`;
      case 'comboBoost':
        return `コンボの威力 +${pct(t.rate)}`;
      case 'regen':
        return `ラウンドの始めに HP ${pct(t.rate)} 回復`;
      case 'mpSave':
        return `技の MP −${t.amount}`;
      case 'partBoost':
        return `部位へのダメージ +${pct(t.rate)}`;
      case 'snapBoost':
        return `スナップの威力 +${pct(t.rate)}`;
      case 'healBoost':
        return `回復量 +${pct(t.rate)}`;
      case 'pushPlus':
        return `押す距離 +${t.count}`;
      case 'heavyBoost':
        return `重さ4以上の行動の威力 +${pct(t.rate)}`;
      case 'timeMpSave':
        return `時間の技の MP −${t.amount}`;
      case 'effectBoost':
        return `エフェクトの効き +${pct(t.rate)}`;
      case 'climaxBoost':
        return `クライマックスの威力 +${pct(t.rate)}`;
      case 'lightBoost':
        return `重さ1の行動の威力 +${pct(t.rate)}`;
      case 'fragileBoost':
        return `邪魔されなければ強い行動の威力 +${pct(t.rate)}`;
      case 'quickStart':
        return '最初のラウンドだけ、通常攻撃の重さ −1';
      case 'firstRound':
        return `最初のラウンドだけ、威力 +${pct(t.rate)}`;
      case 'bug':
        return `狂い：ラウンドの始めに最大HPの${pct(t.rate)}を失う`;
      case 'shellCrack':
        return 'バリアを最初の1発で割って、そのまま当てる';
      case 'armorPierce':
        return 'かたい敵にも減らされない';
      case 'wideShot':
        return '単体の攻撃が、盾と割り込みを無視して当たる';
      case 'splash':
        return '倒した敵の余ったダメージが、ほかの敵へ飛ぶ';
      case 'blastGuard':
        return `爆発（はじける・自爆）のダメージ −${pct(t.rate)}`;
      case 'counterGuard':
        return `反撃のダメージ −${pct(t.rate)}`;
      case 'timeKeeper':
        return 'ねばねばの敵に当てても、遅れない';
      case 'breakTime':
        return `自爆の敵と、全体攻撃を控えた敵へ +${pct(t.rate)}。予定を1マス後ろへ`;
      case 'hunter':
        return `回復役・リーダー・起こし役へ +${pct(t.rate)}`;
      case 'finder':
        return '予定隠しと弱点が、戦闘の始めから見える（味方全体）';
      case 'stopwatch':
        return `巻き戻しを、1戦に${t.count}回まで止める（味方全体）`;
      case 'bossBoost':
        return `ボス戦・ぬし戦だけ、威力 +${pct(t.rate)}`;
      case 'crowdBoost':
        return `敵が3体以上の時、全体攻撃 +${pct(t.rate)}`;
      case 'desperate':
        return `自分の HP が半分以下の時、威力 +${pct(t.rate)}`;
      case 'reckless':
        return `威力 +${pct(t.rate)}。受けるダメージ +${pct(t.taken)}`;
      case 'focus':
        return `単体の攻撃 +${pct(t.rate)}。全体の攻撃 −${pct(t.spread)}`;
      case 'handPlus':
        return `手札の上限 +${t.count}`;
      default:
        return '';
    }
  }).filter((x) => x);
}

/** 同じ特性をまとめて「×2」のように書く（段階200：新しい戦闘の特性） */
export function summarizeTraits(traits: ChainPassive[]): string[] {
  const out: { text: string; n: number }[] = [];
  for (const t of describeTraits(traits)) {
    const found = out.find((o) => o.text === t);
    if (found) found.n++;
    else out.push({ text: t, n: 1 });
  }
  return out.map((o) => (o.n > 1 ? `${o.text} ×${o.n}` : o.text));
}
