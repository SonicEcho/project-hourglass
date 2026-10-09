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
  | {
      kind: 'damage';
      type: DamageType;
      power: number;
      partMultiplier?: number;
      /** 耐性を無視する（連携技など） */
      ignoreResist?: boolean;
      /** 対象ごとに、この中から一番効く属性を選ぶ（弱点があれば弱点を突く） */
      bestOf?: Element[];
      /** 当てる時にダウンしている敵へのダメージの倍率（連携技。段階26の調整2） */
      downBonus?: number;
    }
  /** 回復。allies なら行動の対象にかかわらず味方全体（敵を攻撃した後に回復する連携技など） */
  | { kind: 'heal'; power: number; allies?: boolean }
  /** 手札を count 枚引く */
  | { kind: 'draw'; count: number }
  /** 手札をすべて捨て、count 枚引き直す */
  | { kind: 'redraw'; count: number }
  /** 捨て札から好きなスナップを1枚手札に加える */
  | { kind: 'retrieve' }
  /** このラウンドの間、受けるダメージを減らす */
  | { kind: 'guard' }
  /** 山札の上から count 枚を見て、1枚を手札に加える（残りは山札の下へ） */
  | { kind: 'search'; count: number }
  /** 選んだ仲間のこのラウンドの行動を、最初に実行する */
  | { kind: 'precede' };

/** 味方の行動（スナップ、魔法・スキル、基本行動、連携技）の共通定義 */
export interface ActionDef {
  id: string;
  name: string;
  /** 行動の重さ。行動の速さ = 速さ ÷ 重さ。重いほど後回しになる */
  weight: number;
  target: TargetScope;
  effects: Effect[];
}

export interface SkillDef extends ActionDef {
  mp: number;
}

export interface CardDef extends ActionDef {
  /** サポートスナップ。計画中にその場で使い、行動枠を使わない（1ラウンドにチーム全体で1枚まで） */
  support?: boolean;
}

/**
 * コンボ。手札に決まった組み合わせのスナップがそろうと、まとめて使える大技。
 * cards はスナップの id（同じスナップを複数枚求める時は同じ id を並べる）
 */
export interface ComboDef extends ActionDef {
  cards: string[];
}

/** 2人の連携技 */
export interface LinkDef extends ActionDef {
  members: [string, string];
}

/**
 * キャラの特性（段階8：ムーブメントの効果ギアや狂い）。戦闘中ずっと効く。
 * 同じ種類が複数あれば足し合わせる
 */
export type PassiveEffect =
  /** その属性のダメージを rate 割増し（0.25 で +25%） */
  | { kind: 'elementBoost'; element: Element; rate: number }
  /** 部位へのダメージを rate 割増し */
  | { kind: 'partBoost'; rate: number }
  /** 延長の時に引く枚数を増やす */
  | { kind: 'oneMoreDraw'; count: number }
  /** バトンを受けた時の倍率に足す */
  | { kind: 'batonBoost'; rate: number }
  /** このキャラが使うコンボのダメージ・回復量を rate 割増し */
  | { kind: 'comboBoost'; rate: number }
  /** ラウンドの始めに最大HPの rate を回復 */
  | { kind: 'regen'; rate: number }
  /** 魔法・スキルのMP消費を減らす（最低1） */
  | { kind: 'mpSave'; amount: number }
  /** 戦闘の最初のラウンド、行動が先制になる */
  | { kind: 'startDash' }
  /** 狂い：ラウンドの始めに最大HPの rate を失う（HPは1未満にならない） */
  | { kind: 'bug'; rate: number };

export interface CharacterDef {
  id: string;
  name: string;
  stats: Stats;
  skills: SkillDef[];
  /** 特性（ムーブメント・武器で付く） */
  passives?: PassiveEffect[];
  /** 通常攻撃の属性（武器の進化で変わる。なければ物理） */
  attackElement?: Element;
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
  /** 大技。使う前に1回「力をためる」（その間は攻撃しない）。次の自分の行動で放つ */
  charge?: boolean;
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
  /** 倒すと落とす素材（段階9）の id */
  drops?: string[];
}

export interface BattleSetup {
  allies: CharacterDef[];
  enemies: EnemyDef[];
  /** アルバム（山札）。枚数分を並べたもの */
  deck: CardDef[];
  links?: LinkDef[];
  combos?: ComboDef[];
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
  /** このラウンドの間、受けるダメージが減る */
  guarding: boolean;
}

export interface AllyUnit extends UnitBase {
  side: 'ally';
  maxMp: number;
  mp: number;
  skills: SkillDef[];
  passives: PassiveEffect[];
  /** 通常攻撃の属性 */
  attackElement: Element;
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
  /** 立ち上がった後、まだ行動していない（この間はダウンしない） */
  standUpGuard: boolean;
  /** 力をためている大技の id（次の自分の行動で放つ）。ダウンや部位破壊で解ける */
  charging: string | null;
  /**
   * ためをダウンで崩されて怒っている。立ち上がった次の行動では、ためずにすぐ攻撃する（大技もためずに放つ）。
   * その行動を終えるまではダウンしない（立ち上がりの歯止めが続く）
   */
  enraged: boolean;
  actions: EnemyActionDef[];
  parts: PartState[];
  ai: EnemyAi;
  /** ボスの「n回に1回は全体攻撃」の数え上げ */
  aiCounter: number;
  /** 倒すと落とす素材の id */
  drops: string[];
}

export type Unit = AllyUnit | EnemyUnit;

export interface CardInstance {
  uid: number;
  card: CardDef;
}

/** 計画した行動。連携技は2人で1つ */
export interface Plan {
  actorIds: string[];
  action: PlayerAction;
  /** この行動のために確保したスナップ（スナップ・コンボの材料）。他の仲間には割り当てられない */
  cardUids: number[];
  /** 実行済み（または取り消し済み） */
  done: boolean;
}

/** 実行の順番待ち */
export type QueueEntry = { kind: 'ally'; planIndex: number } | { kind: 'enemy'; enemyId: string };

/** 延長・バトンの追加行動を選んでいる最中 */
export interface ExtraTurn {
  actorId: string;
  /** この連鎖でバトンを受け渡した仲間（渡し返しはできない） */
  chain: string[];
  /** バトンを受けた（ダメージ・回復量が上がる） */
  boost: boolean;
}

/**
 * 戦闘の局面
 * - plan: 3人の行動を選ぶ
 * - execute: 行動を速さ順に実行している
 * - extra: 延長・バトンの追加行動を選んでいる
 * - ended: 勝敗がついた
 */
export type Phase = 'plan' | 'execute' | 'extra' | 'ended';

export type Outcome = 'ongoing' | 'victory' | 'defeat';

export type LogEvent =
  | { type: 'battleStart'; seed: number }
  | { type: 'roundStart'; round: number }
  | { type: 'roundEnd'; round: number }
  /** actorIds: 行動した者（連携技は2人）。extra: 延長・バトンの追加行動 */
  | { type: 'action'; actorIds: string[]; actionId: string; name: string; extra: boolean }
  /** 自分の番が来る前に倒れた、MPが足りないなどで行動できなかった */
  | { type: 'cancel'; actorIds: string[]; reason: 'dead' | 'mp' }
  | { type: 'support'; cardUid: number; name: string; targetId?: string }
  | { type: 'search'; shownUids: number[]; pickedUid: number }
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
  | { type: 'standUp'; enemyId: string }
  /** ためを崩されて怒った敵が、ためずに攻撃する（この後に action が続く） */
  | { type: 'enraged'; enemyId: string }
  /** 敵が大技の力をためた（次の自分の行動で放つ） */
  | { type: 'charge'; enemyId: string; actionId: string; name: string }
  /** ためが解けた（ダウンした、または部位が壊れて大技が封じられた） */
  | { type: 'chargeBroken'; enemyId: string; reason: 'down' | 'sealed' }
  | { type: 'oneMore'; actorId: string }
  | { type: 'baton'; fromId: string; toId: string }
  /** つながりゲージが満タンになった（連携技を使える） */
  | { type: 'linkReady' }
  | { type: 'guard'; actorId: string }
  /** ラウンドの始めの、特性によるHPの増減（狂いで減る・ファーストエイドで回復） */
  | { type: 'passiveHp'; allyId: string; source: 'bug' | 'regen'; amount: number; hpAfter: number }
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
  combos: ComboDef[];
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  round: number;
  phase: Phase;
  /** このラウンドの計画 */
  plans: Plan[];
  /** クイックステップで先制する仲間 */
  precedeIds: string[];
  /** このラウンドにサポートスナップを使った */
  supportUsed: boolean;
  /** サーチで見ているスナップ（1枚選ぶまで計画を進められない） */
  searchChoice: CardInstance[] | null;
  /** 実行の順番待ち（先頭から実行する） */
  queue: QueueEntry[];
  extra: ExtraTurn | null;
  /** 連携技のつながりゲージ（0〜LINK_GAUGE_MAX。満タンで連携技を使える。段階26の調整2） */
  linkGauge: number;
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
  | { type: 'link'; linkId: string }
  | { type: 'combo'; comboId: string; target?: TargetRef };
