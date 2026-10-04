/**
 * ビルド日時（ISO 文字列）とコミットの短いIDを、画面右下に出す1行の文字列にする。
 * 日時は日本時間（JST）で表示する。
 */
export function formatBuildInfo(buildTimeIso: string, commitId: string): string {
  const date = new Date(buildTimeIso);
  if (Number.isNaN(date.getTime())) return `build ? (${commitId})`;
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ymd = `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`;
  const hm = `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
  return `${ymd} ${hm} JST (${commitId})`;
}
