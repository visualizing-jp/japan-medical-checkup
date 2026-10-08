/**
 * 選んだ性・項目の、全国中計の年次。欠けた年で線を切る。
 */

import { ticks } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { useWidth } from "../hooks/useWidth.ts";

const STROKE = {
  male: "#2c3330",
  female: "#b0392a",
} as const;

export interface EraPoint {
  code: string;
  label: string;
  value: number | null;
}

export function EraChart({
  points,
  sex,
  format,
  label,
}: {
  points: EraPoint[];
  sex: "male" | "female";
  format: (value: number | null) => string;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const height = 300;
  const margin = { top: 16, right: 12, bottom: 36, left: 52 };
  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;
  const stroke = STROKE[sex];

  const values = points.flatMap((p) => (p.value === null ? [] : [p.value]));
  const lo = values.length === 0 ? 0 : Math.min(...values);
  const hi = values.length === 0 ? 1 : Math.max(...values);
  const pad = lo === hi ? Math.max(Math.abs(lo) * 0.05, 0.5) : (hi - lo) * 0.12;

  const x = scalePoint<string>()
    .domain(points.map((p) => p.code))
    .range([0, innerW])
    .padding(0.4);
  const y = scaleLinear()
    .domain([lo - pad, hi + pad])
    .range([innerH, 0]);

  const path =
    line<EraPoint>()
      .defined((d) => d.value !== null)
      .x((d) => x(d.code) ?? 0)
      .y((d) => y(d.value ?? 0))
      .curve(curveMonotoneX)(points) ?? "";

  const yTicks = ticks(lo - pad, hi + pad, 4);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          className="overflow-visible"
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            {yTicks.map((tick) => (
              <g key={tick} transform={`translate(0,${y(tick)})`}>
                <line x1={0} x2={innerW} stroke="var(--color-rule)" strokeWidth={1} />
                <text
                  x={-8}
                  y={4}
                  textAnchor="end"
                  className="fill-faint text-[10px]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {format(tick)}
                </text>
              </g>
            ))}
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p) => (
              <g key={p.code}>
                {p.value !== null && (
                  <circle cx={x(p.code)} cy={y(p.value)} r={3.5} fill={stroke}>
                    <title>{`${p.label} ${format(p.value)}`}</title>
                  </circle>
                )}
                <text
                  x={x(p.code)}
                  y={innerH + 22}
                  textAnchor="middle"
                  className="fill-muted text-[11px]"
                >
                  {p.code}
                </text>
              </g>
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}
