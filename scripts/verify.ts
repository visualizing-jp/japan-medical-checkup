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

if (failed > 0) {
  console.error(`verify failed: ${failed}`);
  process.exit(1);
}
console.log("verify passed");
