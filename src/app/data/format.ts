import type { DictEntry } from "./cube.ts";

/** 見出しだけで読める4つを先に、残りは同じブックの順。 */
export const PICKER_ORDER = [
  "bmi",
  "waist",
  "sbp",
  "hba1c",
  "fpg",
  "dbp",
  "tg",
  "hdl",
  "ldl",
  "ast",
  "alt",
  "gtp",
  "hb",
  "cbg",
  "cre",
  "egfr",
] as const;

export const FEATURED_COUNT = 4;

export function formatMean(digits: number, value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function itemDigits(item: DictEntry | undefined): number {
  return item?.digits ?? 1;
}

export function withUnit(item: DictEntry | undefined, text: string): string {
  if (item?.unit === undefined || item.unit === "") return text;
  return `${text} ${item.unit}`;
}
