import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildDataTables } from '../src/tools/dataTables';

// docs/data/ の一覧表が、今のデータから作ったものと同じか（段階17）。
// 失敗したら、データを変えた後に表を作り直し忘れている：npm run data:tables を実行してコミットする

const DIR = join(__dirname, '..', 'docs', 'data');

describe('データの一覧表（docs/data/）', () => {
  const built = buildDataTables();

  it('作るファイルと、置いてあるファイルが同じ', () => {
    const onDisk = readdirSync(DIR).filter((f) => f.endsWith('.md')).sort();
    expect(onDisk).toEqual(Object.keys(built).sort());
  });

  it.each(Object.keys(built))('%s が今のデータと同じ（違えば npm run data:tables で作り直す）', (name) => {
    expect(readFileSync(join(DIR, name), 'utf-8')).toBe(built[name]);
  });
});
