/**
 * 選んだ県・項目の、男と女の5歳階級。時系列にはしない。
 */

import { ticks } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { useWidth } from "../hooks/useWidth.ts";

const MALE = "#2c3330";
const FEMALE = "#b0392a";

export interface AgePoint {
  code: string;
  label: string;
  male: number | null;
  female: number | null;
}

export function AgeProfile({
  points,
  format,
}: {
  points: AgePoint[];
  format: (value: number | null) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const height = 300;
  const margin = { top: 16, right: 12, bottom: 36, left: 52 };
  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;

  const values = points.flatMap((p) => [p.male, p.female]).filter((v): v is number => v !== null);
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

  const pathFor = (key: "male" | "female") =>
    line<AgePoint>()
      .defined((d) => d[key] !== null)
      .x((d) => x(d.code) ?? 0)
      .y((d) => y(d[key] ?? 0))
      .curve(curveMonotoneX)(points) ?? "";

  const yTicks = ticks(lo - pad, hi + pad, 4);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="男と女の年齢別平均"
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
              d={pathFor("male")}
              fill="none"
              stroke={MALE}
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={pathFor("female")}
              fill="none"
              stroke={FEMALE}
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p) => (
              <g key={p.code}>
                {p.male !== null && (
                  <circle cx={x(p.code)} cy={y(p.male)} r={3.5} fill={MALE}>
                    <title>{`男 ${p.label} ${format(p.male)}`}</title>
                  </circle>
                )}
                {p.female !== null && (
                  <circle cx={x(p.code)} cy={y(p.female)} r={3.5} fill={FEMALE}>
                    <title>{`女 ${p.label} ${format(p.female)}`}</title>
                  </circle>
                )}
                <text
                  x={x(p.code)}
                  y={innerH + 22}
                  textAnchor="middle"
                  className="fill-muted text-[11px]"
                >
                  {p.label.replace("歳", "")}
                </text>
              </g>
            ))}
          </g>
        </svg>
      )}
      <div className="flex gap-4 pt-1 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4" style={{ background: MALE }} />
          男
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4" style={{ background: FEMALE }} />
          女
        </span>
      </div>
    </div>
  );
}
