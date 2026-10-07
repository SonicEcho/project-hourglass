// 素材台帳（段階15）。絵・音・フォントの素材と、配布物に入るライブラリを1つずつ書く。
// クレジットの画面とテスト（tests/assets.test.ts）がこの台帳を読む。決まりは docs/ASSETS.md

export type AssetKind = 'image' | 'svg' | 'audio' | 'font' | 'library';

/** 入手元 */
export type AssetSource =
  /** 自分で作った */
  | { type: 'self' }
  /** フリー素材のサイト */
  | { type: 'free'; site: string; url: string }
  /** AI で作った。plan は使った版（無料／有料のプラン名）。prompt と settings は見た目をそろえるために残す */
  | { type: 'ai'; service: string; plan: string; prompt: string; settings?: string }
  /** npm のライブラリ */
  | { type: 'library'; npm: string; url: string };

export interface AssetEntry {
  /** 画面から使う名前。ファイルを差し替えても変えない */
  id: string;
  kind: AssetKind;
  /** 表示名（クレジットの画面に出す） */
  title: string;
  /** public/ からの場所（ライブラリはなし）。読み込みは src/assets/ */
  file?: string;
  /** 仮（試作用。公開前に差し替える）か、本番か */
  status: 'placeholder' | 'final';
  source: AssetSource;
  /** 作者（クレジットの画面に出す） */
  author: string;
  /** ライセンスの名前（自作なら「自作」） */
  license: string;
  /** 売り物（買い切りのアプリ）に使えるか */
  commercialUse: boolean;
  /** 作者名などの表示が要るか。要るなら credit にその文を書く */
  creditRequired: boolean;
  credit?: string;
  /** 改変してよいか */
  modifyAllowed: boolean;
  /** 手に入れた日（YYYY-MM-DD） */
  acquiredAt: string;
  /** 手に入れた時の利用規約・ライセンス文の控え（リポジトリの中の場所）。フリー素材とライブラリは必須 */
  termsCopy?: string;
  notes?: string;
}

export const ASSETS: AssetEntry[] = [
  {
    id: 'title.hourglass',
    kind: 'svg',
    title: 'タイトルの砂時計',
    file: 'assets/ui/hourglass.svg',
    status: 'placeholder',
    source: { type: 'self' },
    author: 'RESTOPIA 開発',
    license: '自作',
    commercialUse: true,
    creditRequired: false,
    modifyAllowed: true,
    acquiredAt: '2026-10-07',
    notes: '素材を読み込む部品を確かめるための仮の絵。今までの図形と同じ見た目',
  },
  {
    id: 'lib.phaser',
    kind: 'library',
    title: 'Phaser',
    status: 'final',
    source: { type: 'library', npm: 'phaser', url: 'https://phaser.io' },
    author: 'Richard Davey, Phaser Studio Inc.',
    license: 'MIT License',
    commercialUse: true,
    creditRequired: true,
    credit: 'Phaser — Copyright (c) 2024 Richard Davey, Phaser Studio Inc. — MIT License',
    modifyAllowed: true,
    acquiredAt: '2026-10-04',
    termsCopy: 'docs/licenses/phaser.txt',
    notes: 'ゲームの描画。MIT は売り物でも使えるが、著作権表示とライセンス文を載せる',
  },
  {
    id: 'lib.eruda',
    kind: 'library',
    title: 'eruda',
    status: 'final',
    source: { type: 'library', npm: 'eruda', url: 'https://github.com/liriliri/eruda' },
    author: 'liriliri',
    license: 'MIT License',
    commercialUse: true,
    creditRequired: true,
    credit: 'eruda — Copyright (c) 2016-present liriliri — MIT License',
    modifyAllowed: true,
    acquiredAt: '2026-10-04',
    termsCopy: 'docs/licenses/eruda.txt',
    notes: '?debug=1 の時だけ読み込むスマホ用のログ。配布物にはファイルとして入る',
  },
];
