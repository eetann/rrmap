# Roadmap

このツール（rrmap）自体を作るためのロードマップ。

対象読者はrrmapの開発者（人間・AI）であり、rrmapがいずれ管理することになる「利用者のロードマップ」とは別物である。解決したい課題の詳細は[mvp.md](./mvp.md)を参照。

## マイルストーン

### データモデル・ファイル設計

- [x] タスクを表すMarkdownファイルのフォーマットを決める（フロントマターに載せる項目: id・タイトル・ステータスなど） → [task-format.md](./task-format.md)
- [x] タスクファイルの保存先ディレクトリ構成を決める → [directory-structure.md](./directory-structure.md)
- [x] 「何をするか」「現在の状態」「方針・意思決定」をタスクファイル内でどう区切るか決める → 自由なMarkdown（[task-format.md](./task-format.md)参照）
- [x] Knowledgeドキュメントの保存先・フォーマットを決める（ロードマップやADRとは別枠として） → `docs/knowledge/`に自由なMarkdownで配置（[directory-structure.md](./directory-structure.md)参照）

### CLIの最小実装

- [x] タスクの作成・一覧・詳細表示・ステータス変更ができるコマンドを実装 → `gunshi`で実装（`src/cli.ts`, `create`/`list`/`show`/`edit`）
- [x] Markdownを直接編集された場合でもCLIが正しく読み込めるようにする（パース処理） → `src/task.ts`の`parseTask`でフロントマターをバリデーション

### 意思決定・Knowledge分離の仕組み

- [ ] タスクへ「方針・意思決定」を追記する導線を用意
- [ ] ADRにすべきと判断したときに既存のADR作成の仕組み（adr-creator skill）へつなぐ導線を用意
- [ ] 一般的な知識・制約・ハマりどころをロードマップに書かせず、Knowledgeドキュメントとして分離保存する仕組みを用意（Skillが判断する想定）

### マイルストーン管理の仕組み

- [x] マイルストーンをタスクのデータモデルにどう表現するか決める → `.rrmap/milestones/`に1マイルストーン1 Markdownファイルとして管理（[milestone-format.md](./milestone-format.md)参照。タスク側は`milestone`フィールドで参照、[task-format.md](./task-format.md)参照）
- [x] マイルストーンの作成・一覧・ステータス変更ができるCLIコマンドを実装 → `rrmap milestone create/list/show/edit`（`src/commands/milestone*.ts`）
- [x] タスクのパース処理が`milestone`フィールドを読み込めるようにする → `src/task.ts`の`parseTask`でバリデーション、`create`/`list`/`show`コマンドも`--milestone`に対応

既存の`docs/roadmap.md`上のマイルストーン構造（この見出し単位の構成）を、上記データモデルへ移行する対応は当面行わない。新規のマイルストーンからこの仕組みに乗せる想定。

### Web UI（React + shadcn）

- [x] Bun.serve + HTML importsでフロントエンドを起動できるようにする → `src/web/server.ts`（`bun run dev`で起動、TailwindCSS/shadcn/ui導入済み）
- [x] タスク一覧・詳細をビジュアルに表示し、雑にメモできるUIを用意 → `src/web/app.tsx` + `src/web/components/task-table.tsx`（TanStack Table）。詳細表示・メモ編集は未実装
- [x] タスク一覧をマイルストーンごとにグループ化して表示できるようにする（テーブル表示、Notionのグループ化に近いイメージ） → マイルストーンごとにセクション分けして表示、未所属タスクは「未分類」セクション
- [x] UIからタスクの作成・編集・ステータス変更ができるようにする → `POST /api/tasks`・`PATCH /api/tasks/:id`（`src/web/server.ts`）、`create-task-dialog.tsx`・`edit-task-dialog.tsx`

### AI連携の強化

- [x] AIエージェントがCLI経由で扱いやすいよう、サブコマンド設計・出力フォーマットを整備する → タスク/マイルストーンの本文はMarkdownを直接編集してよいことを`--help`（EXAMPLES）とREADMEに明記（`src/commands/edit.ts`・`src/commands/milestone-edit.ts`・`src/commands/list.ts`）
- [x] 必要に応じてMCPサーバー化やSkill化を検討する → MCPサーバーは不要と判断し、Skill化した → `.claude/skills/rrmap/SKILL.md`（agent-skills-nixでの配布も想定）

## セルフホスティングへの移行

rrmapが最低限動くようになった段階で、rrmap自身の開発ロードマップ（このファイル）の管理をrrmap自体の機能へ移行する。

以後、rrmapの開発タスクはrrmapのタスク管理機能を使って書き直し・運用していく想定。`docs/mvp.md`・`docs/roadmap.md`もその時点でrrmap管理下のタスクへ移行し、このファイルは役目を終える。
