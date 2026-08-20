---
name: rrmap
description: |
  rrmapのCLIでタスク・マイルストーンを操作するスキル。rrmapは雑なロードマップをタスク単位のMarkdownファイル
  （.rrmap/tasks/, .rrmap/milestones/）として管理するツール。リポジトリに.rrmap/ディレクトリがある場合や、
  「タスクを作って」「タスク一覧を見せて」「ロードマップに追加して」「タスクのステータスを変更して」
  「マイルストーンを作って」などの指示で使用する。
---

# rrmap

雑なロードマップをタスク単位のMarkdownファイルで管理するCLIツール。タスク・マイルストーンはそれぞれ
`.rrmap/tasks/TASK-XXXX.md`・`.rrmap/milestones/MILESTONE-XXXX.md`として保存される。

## 使い方の原則: 本文はMarkdownを直接編集してよい

- ステータス・タイトルの変更やID採番など、構造化されたフィールドの操作は下記CLIコマンドを使う
- 本文（何をするか・現在の状態・方針や意思決定など）を書く手段はCLIに用意されていない。
  `.rrmap/tasks/TASK-XXXX.md`・`.rrmap/milestones/MILESTONE-XXXX.md`を直接開いて編集してよい（むしろ推奨）
- 新規作成もCLIが基本（IDを自動採番してくれるため）。ファイルを直接作る場合は既存ファイルの最大番号+1のIDを使い、
  重複させないこと

## コマンド一覧

プロジェクトルートで `rrmap <サブコマンド>` を実行する（このリポジトリ自身の開発時は
`bun run rrmap <サブコマンド>` = `bun run src/cli.ts <サブコマンド>`）。各コマンドの詳細は `--help` で確認できる。

### タスク

| コマンド | 用途 |
|---|---|
| `rrmap list [--status <status>] [--parent <id>] [--milestone <id>]` | タスク一覧を表示 |
| `rrmap show <id>` | タスクの詳細（本文込み）を表示 |
| `rrmap create <title> [--parent <id>] [--milestone <id>]` | タスクを作成（IDは自動採番） |
| `rrmap edit <id> [--status <status>] [--title <title>]` | status/titleを変更 |
| `rrmap format` | タスク・マイルストーンのMarkdownフォーマットを表示 |

`status`: `draft`（雑に書いた） / `refined`（分割済み・実装を見据えて整理済み） / `in_progress` / `done` / `cancelled`

### マイルストーン

| コマンド | 用途 |
|---|---|
| `rrmap milestone list [--status <status>]` | マイルストーン一覧を表示 |
| `rrmap milestone show <id>` | マイルストーンの詳細（本文込み）を表示 |
| `rrmap milestone create <title>` | マイルストーンを作成（IDは自動採番） |
| `rrmap milestone edit <id> [--status <status>] [--title <title>]` | status/titleを変更 |

`status`: `planned` / `active` / `completed`

厳密な最新フォーマットは`rrmap format`でも確認できる（このSKILL.mdの内容と食い違う場合はコマンドの出力を正とする）。

## タスクファイルのフロントマター

```yaml
---
id: TASK-0001
title: タスクのタイトル
status: draft
parent: null       # 分割元の親タスクid（TASK-XXXX形式）。トップレベルなら null。親子関係は1階層のみ
milestone: null    # 所属するマイルストーンid（MILESTONE-XXXX形式）。どこにも属さなければ null
---
```

本文は自由なMarkdown。テンプレートは強制しないが、「何をするか」「現在の状態」「方針・意思決定」に
触れておくと後から見返しやすい。

## マイルストーンファイルのフロントマター

```yaml
---
id: MILESTONE-0001
title: マイルストーンのタイトル
status: planned
---
```

本文は自由なMarkdown。目的・スコープなど残しておきたいことを書く。
