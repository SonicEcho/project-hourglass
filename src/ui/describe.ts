import type { ActionDef, Effect, TargetScope } from '../core';
import { ELEMENT_LABEL } from './labels';

const SCOPE_LABEL: Record<TargetScope, string> = {
  enemy: '敵単体',
  enemies: '敵全体',
  ally: '味方単体',
  allies: '味方全体',
  self: '自分',
};

export function describeEffect(effect: Effect, scope: TargetScope): string {
  switch (effect.kind) {
    case 'damage': {
      const element = effect.bestOf
        ? `一番効く属性（${effect.bestOf.map((e) => ELEMENT_LABEL[e]).join('・')}から自動で選ぶ）`
        : ELEMENT_LABEL[effect.type];
      let text = `${SCOPE_LABEL[scope]}に${element}・威力${effect.power}`;
      if (effect.partMultiplier && effect.partMultiplier !== 1) text += `。部位へのダメージ${effect.partMultiplier}倍`;
      if (effect.ignoreResist) text += '（耐性を無視）';
      if (effect.downBonus && effect.downBonus !== 1) text += `。体勢が崩れた敵（ダウン中・立ち上がったばかり）には${effect.downBonus}倍`;
      return text;
    }
    case 'heal':
      return `${effect.allies ? '味方全体' : scope === 'self' ? '自分' : SCOPE_LABEL[scope]}を回復・威力${effect.power}`;
    case 'draw':
      return `手札を${effect.count}枚引く`;
    case 'redraw':
      return `手札をすべて捨て、${effect.count}枚引き直す`;
    case 'retrieve':
      return '捨て札から好きなスナップを1枚手札に加える';
    case 'guard':
      return 'このラウンドの間、受けるダメージ半減';
    case 'search':
      return `山札の上から${effect.count}枚を見て、1枚を手札に加える`;
    case 'precede':
      return '選んだ仲間のこのラウンドの行動が最初に来る';
    case 'encore':
      return 'このラウンドに最後に使われたスナップを、同じ相手にもう一度使う（まだ誰も使っていなければ不発）';
    case 'restore':
      return [effect.hp ? `HP を${effect.hp}回復` : '', effect.mp ? `MP を${effect.mp}回復` : ''].filter(Boolean).join('・') + `（${SCOPE_LABEL[scope]}）`;
  }
}

export function describeAction(def: ActionDef): string {
  if (def.effects.length === 0) return '何もしない';
  // 同じ効果が続く時（連続攻撃）は「×回数」でまとめる
  const parts: string[] = [];
  for (const e of def.effects) {
    const text = describeEffect(e, def.target);
    const last = parts[parts.length - 1];
    const m = last?.match(/^(.*?)(?: ×(\d+)回)?$/);
    if (m && m[1] === text) parts[parts.length - 1] = `${text} ×${Number(m[2] ?? 1) + 1}回`;
    else parts.push(text);
  }
  const text = parts.join('。その後、');
  // 先に動くスナップ（ピンチヒッター。段階41）
  return 'precede' in def && def.precede ? `${text}。使う仲間は、このラウンドの最初に動く` : text;
}

/** スナップやスキルの主な属性（色分け用） */
export function mainDamageType(def: ActionDef) {
  const dmg = def.effects.find((e) => e.kind === 'damage');
  return dmg && dmg.kind === 'damage' ? dmg.type : undefined;
}

export function formatWeight(w: number): string {
  return w.toFixed(1);
}

/**
 * 相手が先に倒れた時にどうなるか（段階125。レビューの項目19。戦闘の長押しの説明に添える）。
 * 敵単体の攻撃は残っている敵へ向け直し、味方単体の回復は不発（使ったスナップ・MP は戻らない）。src/core/battle.ts の retarget・heal と合わせる
 */
export function targetNote(def: ActionDef): string {
  if (def.target === 'enemy' && def.effects.some((e) => e.kind === 'damage')) return '狙った敵が先に倒れた時は、残っている敵に向け直す（壊れた部位をねらっていた時は本体へ）';
  if (def.target === 'ally' && def.effects.some((e) => e.kind === 'heal' && !e.allies)) return '回復する相手が、この行動の番より前に倒れると回復しない（使ったスナップ・MPは戻らない）';
  return '';
}
