# NDB特定健診データから見る、血圧・血糖・BMIなどの地域差

厚生労働省「NDBオープンデータ」の特定健診から、検査の平均が都道府県・性・年齢でどこに寄るか、全国の中計が2013年度から2023年度までどう動いたかを見る。地域と年齢は第11回（2023年度）。時代は第1回（2013年度、年度末年齢）から第11回。

特定健診を受けた40–74歳の平均である。住民全体でも、患者調査（japan-data の `disease`）の推計患者でもない。母集団が違うので、受療率と並べて病気の増減には読まない。

visualizing.jp スタンドアロン。

想定URL: https://japan-medical-checkup.visualizing.jp

## ビュー

| ビュー | 内容 |
| --- | --- |
| 地域 | 選んだ項目・性・年齢の、県の平均 / 全国の平均。既定は BMI・男・中計 |
| 年齢 | 選んだ県・項目について、男と女の5歳階級の平均 |
| 時代 | 全国の中計の年次。BMI・腹囲・収縮期血圧・HbA1C。2013–2023年度。欠けた年は線を切る |

## 開発

```bash
npm install
npm run fetch && npm run data && npm run verify
npm run dev
```

Excel は `data/raw/` に置く（git 管理外）。配信用 JSON は `public/data/` を追跡する。API キーは不要。

| スクリプト | 内容 |
| --- | --- |
| `npm run fetch` | 第11回 ZIP と、第1–10回の平均値ブックの取得 |
| `npm run data` | 配信用 cube 構築（Python / openpyxl） |
| `npm run verify` | 健全性チェック |
| `npm run dev` | Vite 開発サーバ（5311） |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | TypeScript 検査 |

データ設計の正本は [`docs/data-sources.md`](docs/data-sources.md)。

## GitHub Pages / DNS

- `.github/workflows/pages.yml` で Pages にデプロイする。
- カスタムドメイン `japan-medical-checkup.visualizing.jp` は、Pages 設定と visualizing.jp 側 DNS（既存シリーズと同じ運用）で登録する。
