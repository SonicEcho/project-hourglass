import type { AssetEntry } from '../data';

// クレジットの画面に出す一覧を、素材台帳から作る（段階15）。Phaser に依存しない

export interface CreditSection {
  heading: string;
  items: { title: string; lines: string[] }[];
}

const SOURCE_LABEL: Record<AssetEntry['source']['type'], string> = {
  self: '自作',
  free: 'フリー素材',
  ai: 'AI で作成',
  library: 'ライブラリ',
};

function sourceText(a: AssetEntry): string {
  const s = a.source;
  if (s.type === 'free') return `フリー素材：${s.site}`;
  if (s.type === 'ai') return `AI で作成：${s.service}（${s.plan}）`;
  if (s.type === 'library') return `ライブラリ：${s.npm}`;
  return SOURCE_LABEL[s.type];
}

/** 素材（絵・音・フォント）とライブラリに分けて並べる。debug なら仮／本番と入手元も出す */
export function buildCredits(assets: AssetEntry[], debug = false): CreditSection[] {
  const item = (a: AssetEntry) => {
    const lines = [`作者：${a.author}`, `ライセンス：${a.license}`];
    if (a.credit) lines.push(a.credit);
    if (debug) lines.push(`［${a.status === 'final' ? '本番' : '仮'}］${sourceText(a)}`);
    return { title: a.title, lines };
  };
  const media = assets.filter((a) => a.kind !== 'library');
  const libs = assets.filter((a) => a.kind === 'library');
  return [
    { heading: '素材（絵・音・フォント）', items: media.map(item) },
    { heading: 'ソフトウェア', items: libs.map(item) },
  ];
}
