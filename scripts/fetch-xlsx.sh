#!/usr/bin/env bash
# 特定健診の平均値ブックを data/raw/ に置く。API キーは不要。
# 第11回の ZIP は地域・年齢の cube 用。第1–10回の xlsx と、同じ第11回ブックの写しは時代の cube 用。
# 第12回に特定健診は無い。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/data/raw/ndb"
ERA="$RAW/era"
mkdir -p "$ERA"

# 健診年度。第1回は2013年度、第11回は2023年度。レセプト年度より1年早い。
# 第1回は「年度末年齢での集計」（分析サイトが第1回として載せる方）。
# 受診時年齢の 0000141440.xlsx は取らない。
# 第6–10回は検査項目の都道府県別。詳細情報レコードの同名ブックは取らない。
YEARS=(2013 2014 2015 2016 2017 2018 2019 2020 2021 2022)
URLS=(
  "https://www.mhlw.go.jp/file/06-Seisakujouhou-12400000-Hokenkyoku/0000187793.xlsx"
  "https://www.mhlw.go.jp/file/06-Seisakujouhou-12400000-Hokenkyoku/0000178651.xlsx"
  "https://www.mhlw.go.jp/content/12400000/000347810.xlsx"
  "https://www.mhlw.go.jp/content/12400000/000711996.xlsx"
  "https://www.mhlw.go.jp/content/12400000/000539824.xlsx"
  "https://www.mhlw.go.jp/content/12400000/000821834.xlsx"
  "https://www.mhlw.go.jp/content/12400000/001262387.xlsx"
  "https://www.mhlw.go.jp/content/12400000/001123242.xlsx"
  "https://www.mhlw.go.jp/content/12400000/001258741.xlsx"
  "https://www.mhlw.go.jp/content/12400000/001495696.xlsx"
)

for i in "${!YEARS[@]}"; do
  year="${YEARS[$i]}"
  echo "fetch era ${year}"
  curl -fsSL -A "Mozilla/5.0" -o "$ERA/${year}.xlsx" "${URLS[$i]}"
done

ZIP="$RAW/001711940.zip"
echo "fetch ndb checkup zip"
curl -fsSL -A "Mozilla/5.0" -o "$ZIP" \
  "https://www.mhlw.go.jp/content/12400000/001711940.zip"

# ファイル名の区切りは全角空白。二次医療圏と詳細情報は展開しない。
MEAN="各項目の平均値　都道府県別性年齢階級別分布.xlsx"
unzip -o -j "$ZIP" \
  "07_特定健診_検査項目/${MEAN}" \
  -d "$RAW"
cp "$RAW/$MEAN" "$ERA/2023.xlsx"

echo "done"
