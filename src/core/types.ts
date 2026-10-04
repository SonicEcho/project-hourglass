/** 属性。物理・火・氷・雷の4種類 */
export type Element = 'physical' | 'fire' | 'ice' | 'thunder';

/**
 * ダメージの種類。属性4種に加えて、属性を持たない「魔法」（魔力で計算し、相性の影響を受けない）
 */
export type DamageType = Element | 'magic';

export type Affinity = 'weak' | 'normal' | 'resist';

export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  mag: number;
  def: number;
  spd: number;
}

/**
 * 行動の対象範囲
 * - enemy: 敵単体（部位も選べる） / enemies: 敵全体
 * - ally: 味方単体 / allies: 味方全体
 * - self: 自分（または対象なし）
 */
export type TargetScope = 'enemy' | 'enemies' | 'ally' | 'allies' | 'self';

export type Effect =
  /** ダメージ。partMultiplier は部位を狙った時の部位ダメージ倍率 */
  | { kind: 'damage'; type: DamageType; power: number; partMultiplier?: number }
  | { kind: 'heal'; power: number }
  /** 手札を count 枚引く */
  | { kind: 'draw'; count: number }
  /** 手札をすべて捨て、count 枚引き直す */
  | { kind: 'redraw'; count: number }
  /** 捨て札から好きなカードを1枚手札に加える */
  | { kind: 'retrieve' }
  /** 次の自分の手番まで受けるダメージを減らす */
  | { kind: 'guard' };

/** 味方の行動（カード、魔法・スキル、基本行動、連携技）の共通定義 */
export interface ActionDef {
  id: string;
  name: string;
  /** 行動の重さ。待ち時間 = ceil(100 ÷ 速さ × 重さ) */
  weight: number;
  target: TargetScope;
  effects: Effect[];
}

export interface SkillDef extends ActionDef {
  mp: number;
}

export type CardDef = ActionDef;

/** 2人の連携技 */
export interface LinkDef extends ActionDef {
  members: [string, string];
}

export interface CharacterDef {
  id: string;
  name: string;
  stats: Stats;
  skills: SkillDef[];
}

export interface EnemyActionDef {
  id: string;
  name: string;
  target: 'ally' | 'allies';
  type: DamageType;
  power: number;
  weight: number;
  /** この部位が壊れると使えなくなる */
  requiresPart?: string;
}

export interface PartDef {
  id: string;
  name: string;
  hp: number;
  /** 破壊で手に入るはずの素材（結果画面に表示するだけ） */
  material: string;
  /** 破壊すると本体に露出する弱点 */
  revealsWeakness?: Element[];
}

export type EnemyAi =
  /** 使える行動からランダム */
  | { type: 'random' }
  /** HPが maxHp × lowHpRatio を下回ったら、allTargetInterval 回に1回は全体攻撃を選ぶ */
  | { type: 'boss'; lowHpRatio: number; allTargetInterval: number };

export interface EnemyDef {
  id: string;
  name: string;
  stats: Omit<Stats, 'mp'>;
  weaknesses: Element[];
  resistances: DamageType[];
  actions: EnemyActionDef[];
  parts?: PartDef[];
  ai: EnemyAi;
}

export interface BattleSetup {
  allies: CharacterDef[];
  enemies: EnemyDef[];
  /** フォルダ（山札）。枚数分を並べたもの */
  deck: CardDef[];
  links?: LinkDef[];
  seed: number;
}

// ---- 戦闘中の状態 ----

interface UnitBase {
  uid: string;
  defId: string;
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  mag: number;
  def: number;
  spd: number;
  /** 次に行動する時刻（待ち時間の累計）。小さい者から行動する */
  ct: number;
  guarding: boolean;
}

export interface AllyUnit extends UnitBase {
  side: 'ally';
  maxMp: number;
  mp: number;
  skills: SkillDef[];
  /** バトンタッチを受けた。次の行動のダメージ・回復量が上がる */
  batonBoost: boolean;
}

export interface PartState {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  broken: boolean;
  material: string;
  revealsWeakness: Element[];
}

export interface EnemyUnit extends UnitBase {
  side: 'enemy';
  weaknesses: Element[];
  resistances: DamageType[];
  /** 判明した弱点（一度突くか、部位破壊で露出すると判明） */
  knownWeaknesses: Element[];
  down: boolean;
  actions: EnemyActionDef[];
  parts: PartState[];
  ai: EnemyAi;
  /** ボスの「n回に1回は全体攻撃」の数え上げ */
  aiCounter: number;
}

export type Unit = AllyUnit | EnemyUnit;

export interface CardInstance {
  uid: number;
  card: CardDef;
}

export interface TurnState {
  actorId: string;
  /** ワンモアの行動中（待ち時間を加算しない。バトンタッチを選べる） */
  oneMoreActive: boolean;
  /** この手番でワンモアを使った */
  oneMoreUsed: boolean;
  /** この手番に至るまでにバトンを渡した仲間（渡し返しはできない） */
  batonChain: string[];
}

export type Outcome = 'ongoing' | 'victory' | 'defeat';

export interface CtChange {
  unitId: string;
  before: number;
  after: number;
}

export type LogEvent =
  | { type: 'battleStart'; seed: number }
  | { type: 'turnStart'; actorId: string; ct: number }
  /** ct: 待ち時間が変わった者（連携技では2人）。ワンモアの行動では変化なし */
  | { type: 'action'; actorId: string; actionId: string; name: string; ct: CtChange[] }
  | {
      type: 'damage';
      sourceId: string;
      targetId: string;
      partId?: string;
      amount: number;
      partAmount?: number;
      affinity: Affinity;
      hpAfter: number;
    }
  | { type: 'heal'; sourceId: string; targetId: string; amount: number; hpAfter: number }
  | { type: 'weaknessFound'; enemyId: string; element: Element }
  | { type: 'down'; enemyId: string }
  | { type: 'standUp'; enemyId: string; ct: CtChange[] }
  | { type: 'oneMore'; actorId: string }
  | { type: 'baton'; fromId: string; toId: string }
  | { type: 'guard'; actorId: string }
  | { type: 'partBreak'; enemyId: string; partId: string }
  | { type: 'defeated'; unitId: string }
  | { type: 'draw'; cardUids: number[] }
  | { type: 'discardHand'; cardUids: number[] }
  | { type: 'retrieve'; cardUid: number }
  | { type: 'reshuffle'; count: number }
  | { type: 'battleEnd'; outcome: Exclude<Outcome, 'ongoing'> };

export interface BattleState {
  seed: number;
  /** 乱数の内部状態 */
  rng: number;
  allies: AllyUnit[];
  enemies: EnemyUnit[];
  links: LinkDef[];
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  /** 今の手番。手番と手番の間は null */
  turn: TurnState | null;
  outcome: Outcome;
  log: LogEvent[];
}

// ---- 味方の行動の指定 ----

export type TargetRef = { kind: 'enemy'; id: string; partId?: string } | { kind: 'ally'; id: string };

export type PlayerAction =
  | { type: 'attack'; target: TargetRef }
  | { type: 'guard' }
  | { type: 'card'; cardUid: number; target?: TargetRef; pickCardUid?: number }
  | { type: 'skill'; skillId: string; target?: TargetRef; pickCardUid?: number }
  | { type: 'baton'; toAllyId: string }
  | { type: 'link'; linkId: string };
