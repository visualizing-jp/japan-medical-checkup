/**
 * 配信 cube の健全性チェック。
 *
 *   npm run verify
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CubeView, type CubeJson, type DictEntry } from "../src/app/data/cube.ts";

const DATA = resolve(import.meta.dirname, "../public/data");

let failed = 0;

function ok(label: string, cond: boolean, detail = ""): void {
  console.log(`${cond ? "OK" : "NG"}  ${label}${detail ? `: ${detail}` : ""}`);
  if (!cond) failed += 1;
}

function near(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

interface CheckupFile extends CubeJson {
  items: DictEntry[];
  sexes: DictEntry[];
  ages: DictEntry[];
  areas: DictEntry[];
  year: number;
}

const geoRaw = JSON.parse(await readFile(resolve(DATA, "geo.json"), "utf8")) as CheckupFile;
const ageRaw = JSON.parse(await readFile(resolve(DATA, "age.json"), "utf8")) as CheckupFile;
const geo = new CubeView(geoRaw);
const age = new CubeView(ageRaw);

ok("年は 2023", geoRaw.year === 2023 && ageRaw.year === 2023);
ok("項目は 16", geoRaw.items.length === 16);
ok("性は男女", geo.codes("sex").join(",") === "male,female");
ok(
  "年齢は 7 階級と中計",
  geo.codes("age").join(",") === "a40,a45,a50,a55,a60,a65,a70,total",
);
ok("地域は全国・47県・判別不可", geo.codes("area").length === 49);
ok("先頭は全国", geoRaw.areas[0]?.code === "00" && geoRaw.areas[0]?.label === "全国");
ok(
  "末尾は判別不可",
  geoRaw.areas.at(-1)?.code === "unk",
);
ok("北海道は 01", geoRaw.areas[1]?.code === "01" && geoRaw.areas[1]?.label === "北海道");
ok("沖縄は 47", geoRaw.areas.find((a) => a.label === "沖縄県")?.code === "47");

const cell = { item: "bmi", sex: "male", age: "total", area: "01" };
const hokkaido = geo.at("mean", cell);
ok(
  "北海道 BMI 男 中計≈24.6523",
  hokkaido !== null && near(hokkaido, 24.6523, 0.0001),
  String(hokkaido),
);

const national = geo.at("mean", { ...cell, area: "00" });
ok(
  "全国 BMI 男 中計≈24.2488",
  national !== null && near(national, 24.2488, 0.0001),
  String(national),
);

const okinawaRel = geo.at("relative", { ...cell, area: "47" });
ok(
  "沖縄 BMI 男 中計の全国比≈1.0397",
  okinawaRel !== null && near(okinawaRel, 1.0397, 0.0001),
  String(okinawaRel),
);

ok(
  "全国行の全国比は 1",
  geo.at("relative", { ...cell, area: "00" }) === 1,
);

const masked = geo.at("mean", { item: "hb", sex: "male", age: "a40", area: "unk" });
ok("判別不可のヘモグロビン 0 は欠測", masked === null);

ok(
  "age.json の平均は geo と一致",
  age.at("mean", cell) === hokkaido,
);

const mean = geoRaw.measures["mean"] ?? [];
const relative = geoRaw.measures["relative"] ?? [];
ok("mean の長さ", mean.length === 16 * 2 * 8 * 49, String(mean.length));
ok("relative の長さ", relative.length === mean.length);
ok(
  "欠測は平均も比も null",
  mean.every((v, i) => (v === null) === (relative[i] === null)),
);
ok("0 の平均は残していない", mean.every((v) => v !== 0));
ok("NaN は無い", mean.every((v) => v === null || Number.isFinite(v)));
ok(
  "age.json は比を持たない",
  ageRaw.measures["relative"] === undefined && ageRaw.measures["mean"]?.length === mean.length,
);

interface EraFile extends CubeJson {
  items: DictEntry[];
  sexes: DictEntry[];
  years: DictEntry[];
  age: string;
  area: string;
}

/** 全国の中計。2013年度から2023年度。男女は別系列。 */
const NATIONAL: Record<string, Record<string, number[]>> = {
  bmi: {
    male: [23.8512, 23.8636, 23.8917, 23.9595, 24.039, 24.1164, 24.1847, 24.3031, 24.2792, 24.2611, 24.2488],
    female: [22.2275, 22.2062, 22.2159, 22.2586, 22.3212, 22.3792, 22.4252, 22.5103, 22.4665, 22.4099, 22.3959],
  },
  waist: {
    male: [84.7703, 84.8041, 84.8783, 85.0464, 85.2403, 85.4934, 85.7035, 86.0039, 85.9706, 85.9247, 85.9158],
    female: [79.5797, 79.5297, 79.5384, 79.6065, 79.7034, 79.8597, 79.9711, 80.0855, 79.9822, 79.8414, 79.7976],
  },
  sbp: {
    male: [126.2263, 126.3012, 126.2735, 126.3661, 126.533, 126.5865, 126.6353, 127.7392, 127.3255, 127.1875, 127.0334],
    female: [121.4507, 121.4262, 121.2965, 121.1971, 121.2742, 121.2875, 121.3227, 122.7085, 122.4845, 122.3538, 122.0431],
  },
  hba1c: {
    male: [5.6547, 5.6786, 5.6917, 5.6979, 5.7103, 5.7083, 5.7102, 5.7054, 5.7064, 5.7086, 5.7248],
    female: [5.5739, 5.5979, 5.6075, 5.6116, 5.6192, 5.6126, 5.6102, 5.6023, 5.5987, 5.6052, 5.6176],
  },
};

const eraRaw = JSON.parse(await readFile(resolve(DATA, "era.json"), "utf8")) as EraFile;
const era = new CubeView(eraRaw);

ok("時代は全国の中計", eraRaw.age === "total" && eraRaw.area === "00");
ok("時代の年は 2013–2023", era.codes("year").join(",") === "2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023");
ok("時代の性は男女", era.codes("sex").join(",") === "male,female");
ok("時代の項目は 16", eraRaw.items.length === 16);
ok("時代の長さ", eraRaw.measures["mean"]?.length === 16 * 2 * 11);

for (const item of ["bmi", "waist", "sbp", "hba1c"] as const) {
  const bySex: Record<string, (number | null)[]> = {};
  for (const sex of ["male", "female"] as const) {
    const series = era.series("mean", "year", { item, sex });
    bySex[sex] = series;
    const expected = NATIONAL[item]?.[sex] ?? [];
    const matched = series.every((value, i) => value !== null && near(value, expected[i] ?? NaN, 0.0001));
    ok(`${item} ${sex} の全国中計`, matched, series.join(","));
  }
  const maleSeries = bySex["male"] ?? [];
  const femaleSeries = bySex["female"] ?? [];
  ok(
    `${item} は男女を足していない`,
    maleSeries.some((value, i) => value !== femaleSeries[i]),
  );
  const male2023 = era.at("mean", { item, sex: "male", year: "2023" });
  const female2023 = era.at("mean", { item, sex: "female", year: "2023" });
  ok(
    `2023 ${item} は geo の全国中計と一致`,
    male2023 === geo.at("mean", { item, sex: "male", age: "total", area: "00" }) &&
      female2023 === geo.at("mean", { item, sex: "female", age: "total", area: "00" }),
  );
}

for (const item of ["hdl", "ldl", "ast", "alt", "gtp"] as const) {
  ok(
    `2013 ${item} は数値`,
    era.at("mean", { item, sex: "male", year: "2013" }) !== null &&
      era.at("mean", { item, sex: "female", year: "2013" }) !== null,
  );
}

for (const item of ["cbg", "cre", "egfr"] as const) {
  for (const year of ["2013", "2014", "2015", "2016", "2017"]) {
    ok(
      `${year} ${item} は null`,
      era.at("mean", { item, sex: "male", year }) === null &&
        era.at("mean", { item, sex: "female", year }) === null,
    );
  }
  ok(
    `2023 ${item} は数値`,
    era.at("mean", { item, sex: "male", year: "2023" }) !== null &&
      era.at("mean", { item, sex: "female", year: "2023" }) !== null,
  );
}

const eraMean = eraRaw.measures["mean"] ?? [];
ok("時代に NaN は無い", eraMean.every((v) => v === null || Number.isFinite(v)));
ok("時代に 0 は残していない", eraMean.every((v) => v !== 0));

if (failed > 0) {
  console.error(`verify failed: ${failed}`);
  process.exit(1);
}
console.log("verify passed");
