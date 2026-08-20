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

プロジェクトルートで `rrmap <サブコマンド>` を実行する。各コマンドの詳細は `--help` で確認できる。

### タスク

| コマンド | 用途 |
|---|---|
| `rrmap list [--status <status>] [--parent <id>] [--milestone <id>]` | タスク一覧を表示 |
| `rrmap show <id>` | タスクの詳細（本文込み）を表示 |
| `rrmap create <title> [--parent <id>] [--milestone <id>]` | タスクを作成（IDは自動採番） |
| `rrmap edit <id> [--status <status>] [--title <title>]` | status/titleを変更 |
| `rrmap format` | タスク・マイルストーンのMarkdownフォーマットを表示 |

`status`: `draft`（雑に書いた） / `refined`（分割済み・実装を見据えて整理済み） / `in_progress` / `done` / `cancelled`

`refined`を経由する必要はない。`draft`のまま着手して`in_progress`にしてよい。

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

本文は自由なMarkdown。「何をするか」「現在の状態」「方針・意思決定」を書くのは必須ではなく、
タスク着手時に埋めておく必要も、完了後にわざわざ作業内容を追記する必要もない。書くのは、
タスクを分割した（親子タスクに分けた）ときか、ユーザーから明示的に指示があったときのみでよい。

書く内容の目安:

- 一般的な知識・既知の制約・ユーザー向けガイドなど、他のドキュメント（ADR・Knowledgeドキュメント・
  ユーザー向けガイドなど）に置くべき内容はここには書かない
- 書いてよいのは、そのタスク固有で「あとから見て必要になりそうな」情報に限る。目安は次の3つ
  - 意思決定とその理由（複数の選択肢からどれを選び、なぜか）
  - 後続タスクへの引き継ぎ事項・前提条件
  - 非自明なハマりどころ・制約の発見（知らないと同じ罠を踏むもの）
- 逆に、実装の詳細や作業ログは書かない。コードやgit diffで分かる情報をタスク本文に重複させると、
  あとでgrepしたときのノイズになるだけ
  - どのファイル・関数に何を切り出したかというHow（コードを読めば分かる）
  - 実行したコマンド・確認した値など検証手順の逐一記録
- 目安として、方針・意思決定を書くなら数段落程度に収める。実装のHowを書きたくなったら、
  それは大抵タスク本文でなくコード側（コミットメッセージ・コメント）の役割

## マイルストーンファイルのフロントマター

```yaml
---
id: MILESTONE-0001
title: マイルストーンのタイトル
status: planned
---
```

本文は自由なMarkdown。目的・スコープなど残しておきたいことを書く。
