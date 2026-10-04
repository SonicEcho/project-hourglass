import { execSync } from 'node:child_process';
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
  build: {
    // Phaser 本体が大きいため警告の閾値を上げる
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
