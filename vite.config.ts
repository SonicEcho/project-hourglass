import { execSync } from 'node:child_process';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// GitHub Pages のサブパス（https://<user>.github.io/project-hourglass/）で動かすため
const REPO_NAME = 'project-hourglass';

function shortCommitId(): string {
  const sha = process.env.GITHUB_SHA;
  if (sha) return sha.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  base: `/${REPO_NAME}/`,
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_ID__: JSON.stringify(shortCommitId()),
  },
  plugins: [
    // 端末にしまう（段階70。docs/design/tech.md の 7.）：一度開いたら、ゲーム全部を裏で端末にしまい、2回目からすぐ起動し、オフラインでも遊べる。
    // 新しい版を公開した後は、変わったファイルだけを読み直し、次に開いた時から新しい版になる
    VitePWA({
      registerType: 'autoUpdate',
      // 登録は src/assets/serviceWorker.ts で自分でする（段階76。開いた時と裏から戻った時に、新しい版があるかを確かめるため）
      injectRegister: false,
      // ホーム画面に追加するための設定ファイルは public/manifest.webmanifest（自分で書いたもの）を使う
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,mp3,woff2,webmanifest}'],
        // まばたき・口パクの元の絵（画面では使わない）は、しまわない
        globIgnores: ['**/*_src.webp'],
        // BGM は1曲2MB ほど
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // BGM は版の印（?v=）を付けて読むので、その印は無視して同じファイルとみなす。?debug=1 などで開いた時も、しまったページを出す
        ignoreURLParametersMatching: [/^v$/, /^debug$/, /^seed$/],
        cleanupOutdatedCaches: true,
        // 新しい版は読み終えたらすぐ切り替わり、開いているページも引き継ぐ（段階76。これがないと、古い版のページを全部閉じるまで待機したままになる）
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  build: {
    // Phaser 本体が大きいため警告の閾値を上げる
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
