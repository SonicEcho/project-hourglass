import type { ChainAllyDef, ChainBattleDef, ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove, ChainPassive } from './chain';
import type { CharacterDef, DamageType, Element, EnemyDef, SkillDef } from './types';

// 新しい戦闘（並べてつなぐ戦闘）を本番で使うための変換（段階158。docs/milestones/M3_battle_migration.md の段階B）。
// 本番の仲間（星図・武器・ムーブメントを反映した CharacterDef）と本番の敵（EnemyDef）を、新しい戦闘の仲間と敵に変える。
// 区画ごとの敵の予定・性質・札は、段階D〜F で区画を作り直す時にデータで書く。ここは、まだ書いていない区画でも戦えるようにする仮の変換。

/** 本番の行動の重さ（1.0 前後。速さで割って順番を決めていた）を、新しい戦闘の重さ（時刻の目盛り。1〜5）に直す */
export function chainWeight(weight: number): number {
  return Math.max(1, Math.min(5, Math.round(weight * 3)));
}

function chainElement(t: DamageType): Element {
  // 「魔法」（属性なし・魔力で計算）は、新しい戦闘にはない。仮に物理にする
  return t === 'magic' ? 'physical' : t;
}

/**
 * 本番の技（星図で覚える魔法・スキル）を、新しい戦闘の技にする。MP はそのまま。
 * ダメージ（同じ属性が並ぶ物は連続攻撃に）と回復だけを変える。手札に触れる技（ひらめき・シャッフル・すりかえ）は、新しい戦闘にまだ置き場がないので null
 */
export function chainMoveFromSkill(skill: SkillDef): ChainMove | null {
  const dmg = skill.effects.filter((e) => e.kind === 'damage');
  const heal = skill.effects.find((e) => e.kind === 'heal');
  const weight = chainWeight(skill.weight);
  if (dmg.length && dmg[0].kind === 'damage') {
    const first = dmg[0];
    const element = chainElement(first.type);
    const hits = dmg.length;
    const target = skill.target === 'enemies' ? 'enemies' : 'enemy';
    const label = element === 'physical' ? '物理' : element === 'fire' ? '火' : element === 'ice' ? '氷' : '雷';
    return {
      id: skill.id,
      name: skill.name,
      type: 'attack',
      weight,
      target,
      effect: { kind: 'damage', element, power: first.power, ...(hits > 1 ? { hits } : {}) },
      text: `${target === 'enemies' ? '敵全体' : '敵1体'}に${label}${first.power}${hits > 1 ? `を${hits}回` : ''}`,
      mp: skill.mp,
    };
  }
  if (heal && heal.kind === 'heal') {
    // 新しい戦闘の回復は味方全体。1人向けの回復は、全体に直す分だけ半分に
    const power = skill.target === 'ally' ? Math.round(heal.power / 2) : heal.power;
    return { id: skill.id, name: skill.name, type: 'support', weight, target: 'allies', effect: { kind: 'heal', power }, text: `味方全体の HP を回復（${power}）`, mp: skill.mp };
  }
  return null;
}

/** 通常攻撃（どの仲間も持つ。MP なし）。武器の進化で属性が乗る */
export function chainBasicAttack(element: Element = 'physical'): ChainMove {
  const label = element === 'physical' ? '物理' : element === 'fire' ? '火' : element === 'ice' ? '氷' : '雷';
  return { id: 'basic', name: '通常攻撃', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element, power: 20 }, text: `敵1体に${label}20（MP なし）` };
}

/** 本番の特性のうち、新しい戦闘で効く物だけを移す（延長・バトン・先制は新しい戦闘にない。部位は段階D で部位を作る時に） */
export function chainPassives(c: CharacterDef): ChainPassive[] {
  const out: ChainPassive[] = [];
  for (const p of c.passives ?? []) {
    if (p.kind === 'elementBoost' || p.kind === 'comboBoost' || p.kind === 'regen' || p.kind === 'mpSave' || p.kind === 'bug') out.push({ ...p });
  }
  return out;
}

/** 本番の仲間を、新しい戦闘の仲間にする */
export function chainAllyFromCharacter(c: CharacterDef): ChainAllyDef {
  const moves = [chainBasicAttack(c.attackElement), ...c.skills.map(chainMoveFromSkill).filter((m): m is ChainMove => !!m)];
  return { id: c.id, name: c.name, hp: c.stats.hp, mp: c.stats.mp, atk: c.stats.atk, mag: c.stats.mag, def: c.stats.def, moves, passives: chainPassives(c) };
}

/**
 * 本番の敵を、新しい戦闘の敵にする。予定の癖は、使える行動を順にくり返す（1ラウンドに1回）。
 * 動く時刻は、行動の重さと並びの番号から散らす（同じ顔ぶれの敵が同じ時刻に固まらないように）。
 * ため・アンコール・切り取り・部位が要る行動は、まだ移さない（ボスは段階D〜F で作り直す）
 */
export function chainEnemyFromMain(e: EnemyDef, index = 0): ChainEnemyDef {
  const usable = e.actions.filter((a) => !a.charge && !a.encore && !a.cutsFrame && !a.requiresPart);
  const actions = usable.length ? usable : e.actions.slice(0, 1);
  const pattern: ChainEnemyMove[] = actions.map((a, i) => ({
    id: a.id,
    name: a.name,
    at: Math.min(9, 2 + ((index * 3 + i * 2 + chainWeight(a.weight)) % 8)),
    ...(a.target === 'allies' ? { all: true } : {}),
    element: chainElement(a.type),
    power: a.power,
  }));
  return {
    id: e.id,
    name: e.name,
    hp: e.stats.hp,
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: e.stats.def,
    weak: [...e.weaknesses],
    resist: e.resistances.filter((r): r is Element => r !== 'magic'),
    pattern,
  };
}

export interface MainChainBattleInput {
  id: string;
  name: string;
  party: CharacterDef[];
  enemies: EnemyDef[];
  /** アルバム（札の id の並び）と札の中身・コンボ */
  deck: string[];
  cards: Record<string, ChainMove>;
  links?: ChainLinkDef[];
  /** 負け戦：このラウンドが終わったら打ち切る */
  cutoffRounds?: number;
  gradeAt?: { high: number; mid: number };
}

/** 本番の仲間・敵・アルバムから、新しい戦闘を作る（調整17の決まり：シャッターなし・クライマックスは最後の行動だけ） */
export function buildMainChainBattle(input: MainChainBattleInput): ChainBattleDef {
  const ids = new Set(input.party.map((c) => c.id));
  return {
    id: input.id,
    name: input.name,
    allies: input.party.map(chainAllyFromCharacter),
    enemies: input.enemies.map(chainEnemyFromMain),
    // 並びにいない仲間の専用の札（スペシャル）は、山札から外す
    deck: input.deck.filter((id) => !input.cards[id]?.owner || ids.has(input.cards[id].owner!)),
    cards: input.cards,
    // 並びにいない仲間が要るコンボは外す
    links: (input.links ?? []).filter((l) => l.members.every((m) => ids.has(m))),
    noShutter: true,
    finishLast: true,
    ...(input.cutoffRounds ? { cutoff: { rounds: input.cutoffRounds } } : {}),
    ...(input.gradeAt ? { gradeAt: input.gradeAt } : {}),
  };
}
