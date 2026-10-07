#!/usr/bin/env bash
# 第11回 NDB 特定健診（検査）の ZIP を data/raw/ に置き、平均値ブックだけ展開する。API キーは不要。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/data/raw/ndb"
mkdir -p "$RAW"

ZIP="$RAW/001711940.zip"
echo "fetch ndb checkup zip"
curl -fsSL -A "Mozilla/5.0" -o "$ZIP" \
  "https://www.mhlw.go.jp/content/12400000/001711940.zip"

# ファイル名の区切りは全角空白。二次医療圏と詳細情報は展開しない。
unzip -o -j "$ZIP" \
  "07_特定健診_検査項目/各項目の平均値　都道府県別性年齢階級別分布.xlsx" \
  -d "$RAW"

echo "done"
