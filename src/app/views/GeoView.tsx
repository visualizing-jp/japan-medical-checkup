/**
 * 地域ビュー。選んだ項目・性・年齢の、県の平均 / 全国の平均。
 * 既定は BMI・男・中計。
 */

import { use, useMemo, useState } from "react";
import { loadGeo } from "../data/chunks.ts";
import { formatMean, itemDigits, PICKER_ORDER, withUnit } from "../data/format.ts";
import { ItemList, type ItemRow } from "../components/ItemList.tsx";
import { TileMap, type Tile } from "../components/TileMap.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const AGE_UI = ["total", "a40", "a45", "a50", "a55", "a60", "a65", "a70"] as const;

const one = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Headline({ ranked }: { ranked: (Tile & { relative: number })[] }) {
  const top = ranked[0];
  const bottom = ranked.at(-1);
  if (top === undefined || bottom === undefined) {
    return <span className="text-muted">この条件の県別平均は無い。</span>;
  }
  if (top.code === bottom.code) {
    return (
      <span className="text-muted">
        全国比{" "}
        <span className="font-semibold text-ink">
          {top.label} {one.format(top.relative)}
        </span>
      </span>
    );
  }
  return (
    <span className="text-muted">
      最も高い{" "}
      <span className="font-semibold text-ink">
        {top.label} {one.format(top.relative)}
      </span>
      {"  ／  最も低い "}
      <span className="font-semibold text-ink">
        {bottom.label} {one.format(bottom.relative)}
      </span>
    </span>
  );
}

export function GeoView() {
  const { items, sexes, ages, areas, cube } = use(loadGeo());
  const prefectures = useMemo(
    () => areas.filter((a) => a.code !== "00" && a.code !== "unk"),
    [areas],
  );

  const [item, setItem] = useUrlState<string>(
    "item",
    "bmi",
    (v) => items.some((i) => i.code === v),
  );
  const [sex, setSex] = useUrlState<string>(
    "sex",
    "male",
    (v) => sexes.some((s) => s.code === v),
    { keepDefault: true },
  );
  const [age, setAge] = useUrlState<string>(
    "age",
    "total",
    (v) => ages.some((a) => a.code === v),
  );
  const [area, setArea] = useUrlState<string>(
    "area",
    "",
    (v) => v === "" || areas.some((a) => a.code === v && a.code !== "unk"),
  );
  const [hovered, setHovered] = useState<string | null>(null);

  const current = items.find((i) => i.code === item) ?? items[0]!;
  const sexLabel = sexes.find((s) => s.code === sex)?.label ?? sex;
  const ageLabel = ages.find((a) => a.code === age)?.label ?? age;
  const digits = itemDigits(current);

  const picker = useMemo((): ItemRow[] => {
    const byCode = new Map(items.map((i) => [i.code, i]));
    return PICKER_ORDER.flatMap((code) => {
      const meta = byCode.get(code);
      if (meta === undefined) return [];
      const value = cube.at("mean", { item: code, sex, age, area: "00" });
      return [
        {
          code,
          label: meta.label,
          display: withUnit(meta, formatMean(itemDigits(meta), value)),
        },
      ];
    });
  }, [items, cube, sex, age]);

  const tiles = useMemo(
    (): Tile[] =>
      prefectures.map((a) => ({
        code: a.code,
        label: a.label,
        relative: cube.at("relative", { item, sex, age, area: a.code }),
        mean: cube.at("mean", { item, sex, age, area: a.code }),
      })),
    [prefectures, cube, item, sex, age],
  );

  const ranked = useMemo(
    () =>
      tiles
        .filter((t): t is Tile & { relative: number } => t.relative !== null)
        .sort((a, b) => b.relative - a.relative),
    [tiles],
  );
  const rankOf = useMemo(() => new Map(ranked.map((t, i) => [t.code, i + 1])), [ranked]);

  const national = cube.at("mean", { item, sex, age, area: "00" });
  const focusCode = hovered ?? (area === "" || area === "00" ? null : area);
  const focus = focusCode === null ? undefined : tiles.find((t) => t.code === focusCode);

  const ageOptions = AGE_UI.flatMap((code) => {
    const meta = ages.find((a) => a.code === code);
    return meta === undefined ? [] : [meta];
  });

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[300px] shrink-0 max-lg:w-full lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:self-start">
        <h2 className="flex items-baseline justify-between px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
          <span>検査項目</span>
          <span className="font-normal">全国の平均</span>
        </h2>
        <div className="mb-2 flex flex-col gap-2 px-2">
          <Segmented
            label="性"
            value={sex}
            onChange={setSex}
            options={sexes.map((s) => ({ value: s.code, label: s.label }))}
          />
          <div role="radiogroup" aria-label="年齢" className="grid grid-cols-4 gap-1">
            {ageOptions.map((a) => (
              <button
                key={a.code}
                type="button"
                role="radio"
                aria-checked={a.code === age}
                onClick={() => setAge(a.code)}
                className={`cursor-pointer rounded px-1 py-1 text-[11px] transition-colors duration-150 active:scale-[0.97] ${
                  a.code === age
                    ? "bg-ink/[0.08] font-semibold text-ink"
                    : "text-muted hover:bg-ink/[0.04] hover:text-ink"
                }`}
              >
                {a.code === "total" ? "中計" : a.label.replace("歳", "")}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ItemList rows={picker} selected={item} onSelect={setItem} />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3">
          <div>
            <h1 className="text-[19px] font-semibold tracking-tight">
              {current.label}
              <span className="ml-2 text-[13px] font-normal text-muted">
                {sexLabel}・{ageLabel}・2023年度
              </span>
            </h1>
            <p className="pt-1 text-[12.5px]">
              <Headline ranked={ranked} />
            </p>
          </div>
          <p className="tnum text-right text-[12px] text-muted">
            {focus ? (
              <>
                {focus.label}
                <span className="ml-2 font-semibold text-ink">
                  {withUnit(current, formatMean(digits, focus.mean))}
                </span>
                <span className="ml-2 text-faint">
                  全国比 {focus.relative === null ? "—" : one.format(focus.relative)}
                  {rankOf.has(focus.code) ? ` · ${rankOf.get(focus.code)}位` : ""}
                </span>
              </>
            ) : (
              <>
                全国
                <span className="ml-2 font-semibold text-ink">
                  {withUnit(current, formatMean(digits, national))}
                </span>
              </>
            )}
          </p>
        </header>

        <TileMap
          tiles={tiles}
          hovered={hovered}
          onHover={setHovered}
          pinned={area === "" || area === "00" ? null : area}
          onPin={(code) => setArea(code ?? "")}
        />

        <p className="mt-6 border-t border-rule pt-4 text-[11.5px] leading-relaxed text-faint">
          升目は県の平均を、同じ性・年齢・項目の全国平均で割った比。年齢調整は出していない。
          都道府県判別不可は升目にしない。
        </p>
      </main>
    </div>
  );
}
