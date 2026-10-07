import { Suspense } from "react";
import { AgeView } from "./views/AgeView.tsx";
import { GeoView } from "./views/GeoView.tsx";
import { useUrlState } from "./hooks/useUrlState.ts";
import { SeriesBar, SeriesFooter } from "./components/Brand.tsx";

const VIEWS = [
  { id: "region", label: "地域", hint: "47都道府県" },
  { id: "age", label: "年齢", hint: "5歳階級" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export function App() {
  const [view, setView] = useUrlState<ViewId>("view", "region", (v) =>
    VIEWS.some((x) => x.id === v),
  );

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-paper/85 backdrop-blur-sm">
        <SeriesBar />
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-end justify-between gap-4 px-6 pt-5">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">
              日本人の健診の数値はどこで違っているか
            </h1>
            <p className="text-[11px] text-muted">
              厚生労働省「NDBオープンデータ」第11回・特定健診（2023年度）
            </p>
          </div>
          <nav className="flex gap-1 -mb-px" aria-label="ビュー">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-current={view === v.id ? "page" : undefined}
                className={`cursor-pointer border-b-2 px-3 pt-1 pb-2 text-[13px] transition-colors duration-150 ${
                  view === v.id
                    ? "border-accent font-semibold text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {v.label}
                <span className="ml-1.5 text-[10px] font-normal text-faint">{v.hint}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <Suspense key={view} fallback={<Loading />}>
        {view === "region" && <GeoView />}
        {view === "age" && <AgeView />}
      </Suspense>

      <footer className="mx-auto w-full max-w-[1240px] px-6 pt-2 pb-10 text-[11px] leading-relaxed text-faint">
        <ul className="flex flex-col gap-1">
          <li>2023年度に特定健診を受けた40–74歳の平均。住民全員の分布ではない。</li>
          <li>同じ第11回のレセプトは令和6年度で、年が1つ新しい。</li>
          <li>県の色は全国を1とした比。年齢調整は第1版では出さない。</li>
          <li>
            表の閲覧は
            <a
              href="https://www.mhlw.go.jp/ndb/opendatasite/index.html"
              className="underline decoration-rule underline-offset-2 transition-colors duration-150 hover:text-ink"
            >
              公式の分析サイト
            </a>
            にある。このページはその写しではない。
          </li>
        </ul>
        <p className="pt-3">
          出典: 厚生労働省「NDBオープンデータ」第11回・特定健診（2023年度）、
          「各項目の平均値　都道府県別性年齢階級別分布」。
          患者調査（受療率）とは母集団が違う。
        </p>
        <SeriesFooter />
      </footer>
    </div>
  );
}

function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-16 text-[12px] text-faint">
      読み込み中
    </div>
  );
}
