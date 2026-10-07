import type { GrowthMap, GrowthNodeDef, StatKey } from '../core/growth';
import { SKILLS } from './skills';

// 星図（段階7）。数値はすべて仮。
//
// 7列×9行の格子。上下左右に隣り合うマスが道でつながる。
//   . 空き
//   @ ハルトの出発点　& あかりの出発点　% みおの出発点
//   h HP　p MP　a 攻撃　m 魔力　d 防御　s 速さ（小文字は小、大文字は大）
//   数字 魔法・スキル（下の SKILL_SLOTS）
//
// 出発点のまわりは、そのキャラの得意分野（ハルト：下の中央・攻撃とHP、あかり：左・魔力とMP、みお：右・速さ）。
// 上の段は大きな能力値と強い魔法。
const LAYOUT = [
  'P7M8A9S',
  'm.h.d.s',
  'pmD.Hss',
  '4.a.h.6',
  'mpahdss',
  '&.m.a.%',
  '3pahds5',
  '2.a.h.s',
  'p.1@0.s',
];

const SKILL_SLOTS: Record<string, string> = {
  '7': SKILLS.blizzara.id,
  '8': SKILLS.fira.id,
  '9': SKILLS.thundara.id,
  '4': SKILLS.ice.id,
  '3': SKILLS.care.id,
  '2': SKILLS.cure.id,
  '6': SKILLS.thunder.id,
  '5': SKILLS.inspiration.id,
  '1': SKILLS.doubleSlash.id,
  '0': SKILLS.fire.id,
};

const STARTS: Record<string, string> = { '@': 'hero', '&': 'akari', '%': 'mio' };

/** 能力値マスの上がり幅（小）。大はこの2倍 */
export const STAT_STEP: Record<StatKey, number> = { hp: 12, mp: 6, atk: 2, mag: 2, def: 1, spd: 1 };

const STAT_CHARS: Record<string, StatKey> = { h: 'hp', p: 'mp', a: 'atk', m: 'mag', d: 'def', s: 'spd' };

/** マスを開けるのに必要な星の砂 */
export const GROWTH_COST = {
  stat: 1,
  statBig: 2,
  skill: 3,
  /** もう覚えている魔法・スキルのマスと、他のキャラの出発点は、通るだけ */
  passThrough: 1,
};

function parseLayout(): GrowthNodeDef[] {
  const nodes: GrowthNodeDef[] = [];
  LAYOUT.forEach((line, row) => {
    [...line].forEach((ch, col) => {
      if (ch === '.') return;
      const id = `n${row}_${col}`;
      if (STARTS[ch]) {
        nodes.push({ id, col, row, kind: 'start', owner: STARTS[ch] });
      } else if (SKILL_SLOTS[ch]) {
        nodes.push({ id, col, row, kind: 'skill', skillId: SKILL_SLOTS[ch] });
      } else {
        const stat = STAT_CHARS[ch.toLowerCase()];
        if (!stat) throw new Error(`unknown growth map cell: ${ch}`);
        const big = ch !== ch.toLowerCase();
        nodes.push({ id, col, row, kind: big ? 'statBig' : 'stat', stat, amount: STAT_STEP[stat] * (big ? 2 : 1) });
      }
    });
  });
  return nodes;
}

export const GROWTH_MAP: GrowthMap = {
  cols: 7,
  rows: 9,
  nodes: parseLayout(),
  costs: GROWTH_COST,
};

/** 周回の始めに持っている星の砂 */
export const START_MEMORY_POINTS = 3;
/** 部位を1つ壊すごとにもらえる星の砂 */
export const PART_BREAK_POINTS = 2;
