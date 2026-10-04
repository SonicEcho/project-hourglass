import type { ActionDef, Effect, TargetScope } from '../core';
import { ELEMENT_LABEL } from './theme';

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
      const base = `${SCOPE_LABEL[scope]}に${ELEMENT_LABEL[effect.type]}・威力${effect.power}`;
      return effect.partMultiplier && effect.partMultiplier !== 1 ? `${base}。部位へのダメージ${effect.partMultiplier}倍` : base;
    }
    case 'heal':
      return `${scope === 'self' ? '自分' : SCOPE_LABEL[scope]}を回復・威力${effect.power}`;
    case 'draw':
      return `手札を${effect.count}枚引く`;
    case 'redraw':
      return `手札をすべて捨て、${effect.count}枚引き直す`;
    case 'retrieve':
      return '捨て札から好きなカードを1枚手札に加える';
    case 'guard':
      return '次の自分の手番まで受けるダメージ半減';
  }
}

export function describeAction(def: ActionDef): string {
  if (def.effects.length === 0) return '何もしない代わりに、次の手番が早く来る';
  return def.effects.map((e) => describeEffect(e, def.target)).join('。その後、');
}

/** カードやスキルの主な属性（色分け用） */
export function mainDamageType(def: ActionDef) {
  const dmg = def.effects.find((e) => e.kind === 'damage');
  return dmg && dmg.kind === 'damage' ? dmg.type : undefined;
}

export function formatWeight(w: number): string {
  return w.toFixed(1);
}
