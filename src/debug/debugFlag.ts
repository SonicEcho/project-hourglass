/** URL のクエリに `debug=1` がある時だけデバッグ機能を有効にする */
export function isDebugEnabled(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1';
}
