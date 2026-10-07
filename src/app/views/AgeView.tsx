/**
 * 年齢ビュー。選んだ県・項目について、男と女の5歳階級の平均。
 * 左の検査項目は、選んだ性の全国中計。男女を平均しない。
 */

import { use, useMemo } from "react";
import { loadAge } from "../data/chunks.ts";
import { formatMean, itemDigits, PICKER_ORDER, withUnit } from "../data/format.ts";
import { ItemList, type ItemRow } from "../components/ItemList.tsx";
import { AgeProfile, type AgePoint } from "../components/AgeProfile.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const BANDS = ["a40", "a45", "a50", "a55", "a60", "a65", "a70"] as const;

export function AgeView() {
  const { items, sexes, ages, areas, cube } = use(loadAge());
  const choices = useMemo(
    () => areas.filter((a) => a.code !== "unk"),
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
  );
  const [area, setArea] = useUrlState<string>("area", "13", (v) =>
    choices.some((a) => a.code === v),
  );

  const current = items.find((i) => i.code === item) ?? items[0]!;
  const sexLabel = sexes.find((s) => s.code === sex)?.label ?? sex;
  const areaMeta = choices.find((a) => a.code === area) ?? choices[0]!;
  const digits = itemDigits(current);
  const format = (value: number | null) => formatMean(digits, value);

  const picker = useMemo((): ItemRow[] => {
    const byCode = new Map(items.map((i) => [i.code, i]));
    return PICKER_ORDER.flatMap((code) => {
      const meta = byCode.get(code);
      if (meta === undefined) return [];
      const value = cube.at("mean", { item: code, sex, age: "total", area: "00" });
      return [
        {
          code,
          label: meta.label,
          display: withUnit(meta, formatMean(itemDigits(meta), value)),
        },
      ];
    });
  }, [items, cube, sex]);

  const points = useMemo((): AgePoint[] => {
    return BANDS.flatMap((code) => {
      const meta = ages.find((a) => a.code === code);
      if (meta === undefined) return [];
      return [
        {
          code,
          label: meta.label,
          male: cube.at("mean", { item, sex: "male", age: code, area }),
          female: cube.at("mean", { item, sex: "female", age: code, area }),
        },
      ];
    });
  }, [ages, cube, item, area]);

  const maleTotal = cube.at("mean", { item, sex: "male", age: "total", area });
  const femaleTotal = cube.at("mean", { item, sex: "female", age: "total", area });

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
        <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h1 className="text-[19px] font-semibold tracking-tight">
              {current.label}
              <span className="ml-2 text-[13px] font-normal text-muted">
                {areaMeta.label}・2023年度
              </span>
            </h1>
            <p className="pt-1 text-[12.5px] text-muted">
              中計 男{" "}
              <span className="font-semibold text-ink">
                {withUnit(current, format(maleTotal))}
              </span>
              {"  ／  女 "}
              <span className="font-semibold text-ink">
                {withUnit(current, format(femaleTotal))}
              </span>
            </p>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-muted">
            県
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="cursor-pointer rounded border border-rule bg-surface px-2 py-1 text-[13px] text-ink"
            >
              {choices.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <AgeProfile points={points} format={format} />

        <table className="mt-4 w-full max-w-[640px] text-[12px]">
          <thead>
            <tr className="border-b border-rule text-left text-faint">
              <th className="py-1 pr-3 font-normal">年齢</th>
              <th className="py-1 pr-3 text-right font-normal">男</th>
              <th className="py-1 text-right font-normal">女</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.code} className="border-b border-rule/70">
                <th className="py-1 pr-3 text-left font-normal text-muted">{p.label}</th>
                <td className="tnum py-1 pr-3 text-right">{format(p.male)}</td>
                <td className="tnum py-1 text-right">{format(p.female)}</td>
              </tr>
            ))}
            <tr>
              <th className="py-1 pr-3 text-left font-normal text-muted">中計</th>
              <td className="tnum py-1 pr-3 text-right font-medium">{format(maleTotal)}</td>
              <td className="tnum py-1 text-right font-medium">{format(femaleTotal)}</td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}
