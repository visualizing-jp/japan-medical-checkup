/**
 * 検査項目の一覧。右端は、いまの性・年齢における全国の平均。
 */

import { useEffect, useRef } from "react";
import { FEATURED_COUNT } from "../data/format.ts";

export interface ItemRow {
  code: string;
  label: string;
  display: string;
}

export function ItemList({
  rows,
  selected,
  onSelect,
}: {
  rows: ItemRow[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <ul className="flex flex-col">
      {rows.map((row, i) => {
        const isSelected = row.code === selected;
        const divider = i === FEATURED_COUNT;
        return (
          <li
            key={row.code}
            className={divider ? "mt-1 border-t border-rule pt-1" : ""}
          >
            <button
              type="button"
              ref={isSelected ? selectedRef : null}
              onClick={() => onSelect(row.code)}
              aria-pressed={isSelected}
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-[3px] text-left transition-colors duration-150 ${
                isSelected ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
              }`}
            >
              <span
                className={`min-w-0 flex-1 truncate text-[12px] ${
                  isSelected ? "font-semibold text-ink" : "text-muted"
                }`}
                title={row.label}
              >
                {row.label}
              </span>
              <span
                className={`tnum shrink-0 text-right text-[11px] ${
                  isSelected ? "text-ink" : "text-faint"
                }`}
              >
                {row.display}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
