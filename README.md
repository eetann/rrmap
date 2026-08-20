# rrmap

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/cli.ts --help
```

## AIエージェント向けのヒント

タスク・マイルストーンは`.rrmap/tasks/`・`.rrmap/milestones/`配下のMarkdownファイルとして保存されている（フォーマットは`rrmap format`で確認できる。このリポジトリの設計の背景は[docs/task-format.md](./docs/task-format.md)・[docs/milestone-format.md](./docs/milestone-format.md)を参照）。CLIを経由しなくても、これらのファイルは直接編集してよい。特に本文（方針・意思決定など）はCLIから編集する手段がないため、直接編集が前提になっている。

CLIはID採番や一覧表示など、直接編集より便利な場面で使う想定。

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
