/**
 * 時代ビュー。BMI・腹囲・収縮期血圧・HbA1C の、全国中計の年次。
 * 選んだ性だけを描く。男女は平均しない。欠けた年で線を切る。
 */

import { use, useMemo } from "react";
import { loadEra } from "../data/chunks.ts";
import { FEATURED_COUNT, formatMean, itemDigits, PICKER_ORDER, withUnit } from "../data/format.ts";
import { ItemList, type ItemRow } from "../components/ItemList.tsx";
import { EraChart, type EraPoint } from "../components/EraChart.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const ERA_ITEMS = PICKER_ORDER.slice(0, FEATURED_COUNT);

export function EraView() {
  const { items, sexes, years, cube } = use(loadEra());

  const [item, setItem] = useUrlState<string>(
    "item",
    "bmi",
    (v) => ERA_ITEMS.some((code) => code === v),
  );
  const [sex, setSex] = useUrlState<string>(
    "sex",
    "male",
    (v) => sexes.some((s) => s.code === v),
    { keepDefault: true },
  );

  const current = items.find((i) => i.code === item) ?? items[0]!;
  const sexLabel = sexes.find((s) => s.code === sex)?.label ?? sex;
  const digits = itemDigits(current);
  const format = (value: number | null) => formatMean(digits, value);
  const latest = years.at(-1)?.code ?? "2023";
  const strokeSex = sex === "female" ? "female" : "male";

  const picker = useMemo((): ItemRow[] => {
    const byCode = new Map(items.map((i) => [i.code, i]));
    return ERA_ITEMS.flatMap((code) => {
      const meta = byCode.get(code);
      if (meta === undefined) return [];
      const value = cube.at("mean", { item: code, sex, year: latest });
      return [
        {
          code,
          label: meta.label,
          display: withUnit(meta, formatMean(itemDigits(meta), value)),
        },
      ];
    });
  }, [items, cube, sex, latest]);

  const points = useMemo((): EraPoint[] => {
    return years.map((year) => ({
      code: year.code,
      label: year.label,
      value: cube.at("mean", { item, sex, year: year.code }),
    }));
  }, [years, cube, item, sex]);

  const first = years[0]?.label ?? "";
  const last = years.at(-1)?.label ?? "";

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[300px] shrink-0 max-lg:w-full lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:self-start">
        <h2 className="flex items-baseline justify-between px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
          <span>検査項目</span>
          <span className="font-normal">全国・{sexLabel}の中計</span>
        </h2>
        <div className="mb-2 flex flex-col gap-2 px-2">
          <Segmented
            label="性"
            value={sex}
            onChange={setSex}
            options={sexes.map((s) => ({ value: s.code, label: s.label }))}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ItemList rows={picker} selected={item} onSelect={setItem} />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="pb-4">
          <h1 className="text-[19px] font-semibold tracking-tight">
            {current.label}
            <span className="ml-2 text-[13px] font-normal text-muted">
              {sexLabel}・全国の中計
            </span>
          </h1>
          <p className="pt-1 text-[12.5px] text-muted">
            {first}–{last}
            <span className="ml-2 tnum font-semibold text-ink">
              {withUnit(current, format(points.at(-1)?.value ?? null))}
            </span>
          </p>
        </header>

        <EraChart
          points={points}
          sex={strokeSex}
          format={format}
          label={`${sexLabel}の${current.label}、全国の中計`}
        />

        <table className="mt-4 w-full max-w-[420px] text-[12px]">
          <thead>
            <tr className="border-b border-rule text-left text-faint">
              <th className="py-1 pr-3 font-normal">年度</th>
              <th className="py-1 text-right font-normal">{sexLabel}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.code} className="border-b border-rule/70">
                <th className="py-1 pr-3 text-left font-normal text-muted">{p.label}</th>
                <td className="tnum py-1 text-right">{format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-6 border-t border-rule pt-4 text-[11.5px] leading-relaxed text-faint">
          全国の中計だけ。男と女は人数が無いので足さない。項目の無い年、または「‐」の年は線を切る。
          後から増えた検査は、ここには描かない。
        </p>
      </main>
    </div>
  );
}
