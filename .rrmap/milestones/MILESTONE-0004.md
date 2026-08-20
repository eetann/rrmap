---
id: MILESTONE-0004
title: npmパッケージとして公開する
status: planned
---

## 目的

rrmapをnpmパッケージとして公開し、`npx rrmap`や`npm install -g rrmap`で
誰でも使えるようにする。

## スコープ

- 開発ではBunを使っているが、配布物はNode.jsだけでも動くことを基本方針とする
  （Bun専用APIをテスト以外で使っていないか要確認・要対応）
- package.jsonの公開向け整備、配布形式（ビルド/バンドル）の決定、
  publish手順・CIの整備、ドキュメント整備までを含む

