import type { ActionDef, CharacterDef, EnemyDef, GrowthNodeDef, NaviPartDef, Stats } from '../core';
import { allBattles } from '../core';
import {
  AREA_BATTLES,
  itemSources,
  BOSS_PART_REWARDS,
  CARDS,
  COMBOS,
  FOLDER,
  GROWTH_MAP,
  ITEMS,
  LINKS,
  NAVI_BOARDS,
  NAVI_PARTS,
  NAVI_REWARD_PICKS,
  PART_BREAK_POINTS,
  PARTY,
  SKILLS,
  START_MEMORY_POINTS,
  START_NAVI_PARTS,
  STORY,
  WEAPON_DATA,
} from '../data';
import { describeAction, formatWeight } from '../ui/describe';
import { ELEMENT_LABEL, weightLabel } from '../ui/labels';
import { describePart, PART_COLOR_LABEL, STAT_LABEL } from '../ui/naviText';
import { describeCondition, describeDecompose, describeEvolution, describeFragment, describeGains, RARITY_LABEL } from '../ui/weaponText';

// データの一覧表（段階17）。src/data から docs/data/ の Markdown を作る。手で書き換えない。
// 作る命令は npm run data:tables。表が今のデータと同じかは tests/dataTables.test.ts が確かめる

const HEADER = '<!-- このファイルは npm run data:tables で src/data から自動で作る。手で書き換えない -->';

/** 表の1マスに入れる文字（| と改行を表の中で使える形に） */
function cell(v: string | number): string {
  return String(v).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function table(head: string[], rows: (string | number)[][]): string {
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
}

function page(title: string, intro: string, sections: [string, string][]): string {
  return [HEADER, '', `# ${title}`, '', intro, '', ...sections.flatMap(([h, body]) => [`## ${h}`, '', body, ''])].join('\n');
}

const STAT_KEYS: (keyof Stats)[] = ['hp', 'mp', 'atk', 'mag', 'def', 'spd'];
const charName = (id: string) => PARTY.find((c) => c.id === id)?.name ?? id;
const itemName = (id: string) => (ITEMS as Record<string, { name: string }>)[id]?.name ?? id;
const partName = (id: string) => (NAVI_PARTS as Record<string, NaviPartDef>)[id]?.name ?? id;
const cardName = (id: string) => (CARDS as Record<string, { name: string }>)[id]?.name ?? id;
const actionRow = (a: ActionDef) => [a.name, describeAction(a), `${weightLabel(a.weight)}（${formatWeight(a.weight)}）`];

function charactersPage(): string {
  const skillOwner = (id: string) => PARTY.filter((c: CharacterDef) => c.skills.some((s) => s.id === id)).map((c) => c.name);
  const skillNodes = (id: string) => GROWTH_MAP.nodes.filter((n) => n.kind === 'skill' && n.skillId === id).length;
  return page('仲間と魔法・スキル', '正は `src/data/characters.ts`・`src/data/skills.ts`。仕組みは `docs/design/battle.md`・`docs/design/growth.md`。', [
    ['仲間', table(['名前', ...STAT_KEYS.map((k) => STAT_LABEL[k]), '最初の魔法・スキル'], PARTY.map((c) => [c.name, ...STAT_KEYS.map((k) => c.stats[k]), c.skills.map((s) => s.name).join('、')]))],
    [
      '魔法・スキル',
      table(
        ['名前', 'MP', '効果', '重さ', '最初から持っている', '星図のマス'],
        Object.values(SKILLS).map((s) => {
          const [name, effect, weight] = actionRow(s);
          return [name, s.mp, effect, weight, skillOwner(s.id).join('、') || '―', skillNodes(s.id) || '―'];
        }),
      ),
    ],
  ]);
}

function snapsPage(): string {
  const total = FOLDER.reduce((n, f) => n + f.count, 0);
  return page('スナップ・コンボ・連携技', '正は `src/data/cards.ts`・`src/data/combos.ts`・`src/data/links.ts`。仕組みは `docs/design/battle.md`。', [
    [
      `アルバム（${total}枚）`,
      table(
        ['スナップ', '枚数', '効果', '重さ', '種類'],
        FOLDER.map(({ card, count }) => [card.name, count, describeAction(card), card.support ? '―' : `${weightLabel(card.weight)}（${formatWeight(card.weight)}）`, card.support ? 'サポート（行動枠を使わない）' : '行動']),
      ),
    ],
    ['コンボ', table(['コンボ', '材料', '効果', '重さ'], COMBOS.map((c) => [c.name, c.cards.map(cardName).join('＋'), ...actionRow(c).slice(1)]))],
    ['連携技', table(['連携技', '2人', '効果', '重さ'], LINKS.map((l) => [l.name, l.members.map(charName).join('×'), ...actionRow(l).slice(1)]))],
  ]);
}

/** 区画（探索）と周回に出てくる敵（強化版を含む。同じ名前は1回） */
function campaignEnemies(): EnemyDef[] {
  const seen = new Map<string, EnemyDef>();
  for (const b of [...Object.values(AREA_BATTLES), ...allBattles(STORY)]) for (const e of b.enemies) if (!seen.has(e.name)) seen.set(e.name, e);
  return [...seen.values()];
}

function enemiesPage(): string {
  const enemies = campaignEnemies();
  const elements = (list: string[]) => list.map((e) => ELEMENT_LABEL[e as keyof typeof ELEMENT_LABEL]).join('・') || '―';
  const actions = (e: EnemyDef) =>
    e.actions
      .map((a) => {
        const notes = [a.charge ? '大技（ためてから放つ）' : '', a.requiresPart ? `${e.parts?.find((p) => p.id === a.requiresPart)?.name ?? a.requiresPart}を使う` : ''].filter(Boolean);
        return `${a.name}（${a.target === 'allies' ? '全体' : '単体'}・${ELEMENT_LABEL[a.type]}・威力${a.power}${notes.length ? `・${notes.join('・')}` : ''}）`;
      })
      .join('\n');
  const parts = enemies.flatMap((e) =>
    (e.parts ?? []).map((p) => [e.name, p.name, p.hp, actions({ ...e, actions: e.actions.filter((a) => a.requiresPart === p.id) }) || '―', p.revealsWeakness ? elements(p.revealsWeakness) : '―', p.material, BOSS_PART_REWARDS[p.id] ? partName(BOSS_PART_REWARDS[p.id]) : '―']),
  );
  const battles = STORY.flatMap((c) => c.areas.flatMap((a) => a.battles.map((b) => ({ c, a, b }))));
  return page('敵と周回の戦闘', '正は `src/data/festivalEnemies.ts`・`src/data/enemies.ts`・`src/data/areas.ts`・`src/data/campaign.ts`・`src/data/story.ts`。仕組みは `docs/design/battle.md`・`docs/design/run.md`。', [
    [
      '敵（区画と試作の周回に出てくるもの。+ は強化版）',
      table(
        ['名前', 'HP', '攻撃', '魔力', '防御', '速さ', '弱点', '耐性', '行動', '落とす素材'],
        enemies.map((e) => [e.name, e.stats.hp, e.stats.atk, e.stats.mag, e.stats.def, e.stats.spd, elements(e.weaknesses), elements(e.resistances), actions(e), [...(e.dropTable ? [`いつも ${itemName(e.dropTable.common)}`, e.dropTable.uncommon && `珍しい ${itemName(e.dropTable.uncommon)}`, e.dropTable.rare && `レア ${itemName(e.dropTable.rare)}`] : []), ...(e.drops ?? []).map((d) => `必ず ${itemName(d)}`)].filter(Boolean).join('、') || '―']),
      ),
    ],
    [
      '区画の戦闘（探索。段階25・27）',
      table(
        ['戦闘（id）', '敵', '星の砂', 'アイテム'],
        Object.values(AREA_BATTLES).map((b) => [`${b.name}（${b.id}）${b.boss ? '★ボス' : ''}`, b.enemies.map((e) => e.name).join('、'), b.boss ? '―' : b.reward, b.item ? itemName(b.item) : '―']),
      ),
    ],
    ['部位', parts.length ? table(['敵', '部位', 'HP', '壊すと封じる行動', '壊すと露出する弱点', '素材（表示のみ）', 'ギア（表示のみ）'], parts) : 'なし'],
    [
      '試作の周回の戦闘（デバッグメニューの「試作の5戦」）',
      [
        `最初の星の砂：${START_MEMORY_POINTS}。部位を1つ壊すごとに +${PART_BREAK_POINTS}。ギアは候補から${NAVI_REWARD_PICKS}つ選ぶ。`,
        '',
        table(
          ['章', '区画', '戦闘（id）', '敵', '星の砂', 'アイテム', 'ギアの候補'],
          battles.map(({ c, a, b }) => [c.name, a.name, `${b.name}（${b.id}）${b.boss ? '★ボス' : ''}`, b.enemies.map((e) => e.name).join('、'), b.boss ? '―' : b.reward, b.item ? itemName(b.item) : '―', (b.naviReward ?? []).map(partName).join('、') || '―']),
        ),
      ].join('\n'),
    ],
  ]);
}

function growthPage(): string {
  const kinds: [GrowthNodeDef['kind'], string, number | string][] = [
    ['start', '出発点', '―'],
    ['stat', '能力値（小）', GROWTH_MAP.costs.stat],
    ['statBig', '能力値（大）', GROWTH_MAP.costs.statBig],
    ['skill', '魔法・スキル', GROWTH_MAP.costs.skill],
  ];
  const statCounts = STAT_KEYS.map((k) => {
    const small = GROWTH_MAP.nodes.filter((n) => n.kind === 'stat' && n.stat === k);
    const big = GROWTH_MAP.nodes.filter((n) => n.kind === 'statBig' && n.stat === k);
    const amount = small[0]?.kind === 'stat' ? small[0].amount : big[0]?.kind === 'statBig' ? big[0].amount / 2 : 0;
    return [STAT_LABEL[k], `+${amount}`, small.length, big.length];
  });
  const boards = PARTY.map((c) => {
    const b = NAVI_BOARDS[c.id];
    const shape: string[] = [];
    for (let r = 0; r < b.rows; r++) {
      let line = '';
      for (let col = 0; col < b.cols; col++) line += b.cells.some(([x, y]) => x === col && y === r) ? (r === b.commandRow ? '◆' : '■') : '・';
      shape.push(line);
    }
    return [c.name, `${b.cols}×${b.rows}`, b.cells.length, b.cells.filter(([, y]) => y === b.commandRow).length, shape.join('\n')];
  });
  return page('星図とムーブメント', '正は `src/data/growthMap.ts`・`src/data/navi.ts`。仕組みは `docs/design/growth.md`。', [
    [
      `星図（${GROWTH_MAP.cols}×${GROWTH_MAP.rows}、${GROWTH_MAP.nodes.length}マス）`,
      [
        table(['マスの種類', '数', '費用（星の砂）'], kinds.map(([k, label, cost]) => [label, GROWTH_MAP.nodes.filter((n) => n.kind === k).length, cost])),
        '',
        `もう覚えている魔法・スキルのマスと、他のキャラの出発点は「通るだけ」で ${GROWTH_MAP.costs.passThrough}。`,
        '',
        table(['能力値', '小のマス1つで', '小のマス', '大のマス（小の2倍）'], statCounts),
      ].join('\n'),
    ],
    [
      'ギア',
      [
        `周回の始めに持っているもの：${START_NAVI_PARTS.map(partName).join('、')}`,
        '',
        table(['ギア', '色', 'マス数', '種類', '効果'], Object.values(NAVI_PARTS as Record<string, NaviPartDef>).map((p) => [p.name, PART_COLOR_LABEL[p.color], p.cells.length, p.kind === 'stat' ? '能力値' : '効果（ブリッジ）', describePart(p)])),
      ].join('\n'),
    ],
    ['盤（◆ がブリッジ、・ は置けないマス）', table(['仲間', '大きさ', 'マス数', 'ブリッジのマス', '形'], boards)],
  ]);
}

function weaponsPage(): string {
  const D = WEAPON_DATA;
  const evolutions = Object.values(D.weapons).flatMap((w) =>
    w.evolutions.map((e) => [w.name, charName(w.owner), e.name, [`Lv${D.evolveLevel}`, ...e.conditions.map((c) => describeCondition(c, D))].join('、'), describeEvolution(e, D.boardExtension)]),
  );
  return page(
    '武器・素材・記憶の欠片',
    `正は \`src/data/weapons.ts\`。仕組みは \`docs/design/growth.md\`。経験値 ${D.levelExp.map((e, i) => `${e} で Lv${i + 2}`).join('、')}。属性値1につき、その属性のダメージ +${Math.round(D.elementRate * 100)}%。`,
    [
      ['武器と進化先', table(['武器', '持ち主', '進化先', '条件', '効果'], evolutions)],
      [
        '素材・アイテム（段階27b：素材は直接吸わせる。吸わせ枠を1つ使う）',
        [
          `吸わせ枠（累計）：${D.slotsPerLevel.map((n, i) => `Lv${i + 1} で ${n}`).join('、')}。時分解は${D.decomposeCost}つで記憶の欠片1つ。`,
          '',
          table(['名前', '種類', '吸わせると', '時分解すると', '手に入れ方'], Object.values(ITEMS).map((it) => [
            it.name,
            it.kind === 'material' ? RARITY_LABEL[it.rarity ?? 'common'] : 'アイテム',
            it.kind === 'material' ? describeGains(it.gains) : '（吸わせられない）',
            describeDecompose(D, it),
            itemSources(it.id).join('、') || '―',
          ])),
        ].join('\n'),
      ],
      ['記憶の欠片', table(['名前', '1つ吸わせると'], Object.values(D.fragments).map((f) => [f.name, describeFragment(f)]))],
    ],
  );
}

function readmePage(): string {
  return [
    HEADER,
    '',
    '# データの一覧表',
    '',
    'ゲームのデータ（`src/data/`）から自動で作った一覧表。GitHub で読むためのもので、ここを書き換えてもゲームは変わらない。数値を変える時は `src/data/` を変え、`npm run data:tables` で作り直す（作り直し忘れはテストが見つける）。',
    '',
    table(['ファイル', '中身'], [
      ['[characters.md](characters.md)', '仲間と魔法・スキル'],
      ['[snaps.md](snaps.md)', 'スナップ（アルバム）・コンボ・連携技'],
      ['[enemies.md](enemies.md)', '敵、部位、周回の戦闘'],
      ['[growth.md](growth.md)', '星図、ギア、盤'],
      ['[weapons.md](weapons.md)', '武器と進化先、素材・アイテム、記憶の欠片'],
    ]),
    '',
  ].join('\n');
}

/** docs/data/ に置くファイル（ファイル名 → 中身） */
export function buildDataTables(): Record<string, string> {
  return {
    'README.md': readmePage(),
    'characters.md': charactersPage(),
    'snaps.md': snapsPage(),
    'enemies.md': enemiesPage(),
    'growth.md': growthPage(),
    'weapons.md': weaponsPage(),
  };
}
