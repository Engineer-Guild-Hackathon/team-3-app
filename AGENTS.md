# Global Agent Guidelines

---

## 1. Logging & Language

- **ログ出力**は **英語（English）** のみで行ってください。
- コード内の**コメントやドキュストリング**は **日本語** を使用してください。
- 回答の際は、**日本語**で簡潔かつ丁寧に回答してください。

---

## 2. Commit & PR Format

- **コミットメッセージ**は Conventional Commits に従ってください（例： `feat:`、`fix:`、`docs:`…）。
- **PR タイトル**は、`<scope>: <short summary>` の形式を推奨します。

---

## 3. Code Style & Testing (Default)

- ビルドやテストに失敗した場合は、**自己修正のためのPR**や**箇条書きの改善案**を生成してください。

---

## 4. File & Directory Rules

- 生成されるコードは**既存のテストを壊さないよう**にしてください。
- 機密データ（APIキー、パスワードなど）はプロジェクトに含めず、**事前にignore**してください（例： `.env` や `credentials/` ディレクトリなど）。

---

## 5. Safety & Validation

- **AGENTS.md**, `.codex/config.toml` 等の設定ファイルを変更する前に、**Dry‐run 形式の提案**を生成してください。
- 不確かな変更（特にセキュリティ／依存関係に関わるもの）には、**要確認**の注釈を含めてください。

---

## 6. Tooling & MCP

- Codex のツール呼び出し戦略は Tool-First を遵守してください。
- MCP サーバは、プロジェクト固有の設定がない限り、**ユーザー ~/.codex/config.toml に従います**。
- グローバルな MCP ツール設定の上書きは避け、**プロジェクトごとに .codex/config.toml があればそれを優先してください**。

---

## 7. Agent Behavior Priorities

Codex 実行時に複数の AGENTS.md が存在する場合、優先順位は以下の通りです :contentReference[oaicite:1]{index=1}：

1. `~/.codex/AGENTS.md` — グローバル指針  
2. プロジェクトのルート `AGENTS.md` — リポジトリ固有ルール  
3. サブディレクトリの `AGENTS.md` — 特定フォルダ用指針

---

## 8. References & Links

- **README.md** に一般的なプロジェクト概要やセットアップ手順を記述し、本ファイルは**機械向けガイドライン**に特化して使ってください。
- 詳細なコード構造や設計意図は README や Wiki 等へのリンクで補完してください。

---

## 9. Maintenance Advice

- プロジェクト固有のルールを追加する際は、**プロジェクトルートに別の AGENTS.md** を作成してください。
- 本ファイルを更新した場合は、他の開発環境（同僚のマシンなど）でも共有されるように注意してください。

---

（例）

```text
# ~/.codex/AGENTS.md
# English logs, Japanese comments/docstrings.
...
