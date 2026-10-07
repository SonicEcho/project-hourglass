# project-hourglass

スマホ向けターン制RPG「RESTOPIA」。今の仕組みは [docs/design/](docs/design/README.md)、作業の一覧は [docs/milestones/](docs/milestones/M0.md)、試作の記録は [docs/SPEC.md](docs/SPEC.md)。

- 公開URL: https://sonicecho.github.io/project-hourglass/ （`?debug=1` でデバッグ有効）

```sh
npm install
npm run dev     # 開発サーバ
npm test        # テスト
npm run build   # 本番ビルド（dist/）
npm run measure # 自動対戦で戦闘ごとの勝率を測る（-- --runs 200 --seed 1）
npm run data:tables # src/data から docs/data/ の一覧表を作り直す
```
