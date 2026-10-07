/**
 * 配信データの取得。
 */

import { CubeView, type CubeJson, type DictEntry } from "./cube.ts";

export interface CheckupData {
  items: DictEntry[];
  sexes: DictEntry[];
  ages: DictEntry[];
  areas: DictEntry[];
  year: number;
  cube: CubeView;
}

interface CheckupFile extends CubeJson {
  items: DictEntry[];
  sexes: DictEntry[];
  ages: DictEntry[];
  areas: DictEntry[];
  year: number;
}

const cache = new Map<string, Promise<unknown>>();

function chunk(name: string): Promise<CheckupData> {
  const hit = cache.get(name);
  if (hit !== undefined) return hit as Promise<CheckupData>;
  const promise = fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`${name}.json の取得に失敗しました (${r.status})`);
      return r.json() as Promise<CheckupFile>;
    })
    .then((raw) => ({
      items: raw.items,
      sexes: raw.sexes,
      ages: raw.ages,
      areas: raw.areas,
      year: raw.year,
      cube: new CubeView(raw),
    }));
  cache.set(name, promise);
  return promise;
}

export function loadGeo(): Promise<CheckupData> {
  return chunk("geo");
}

export function loadAge(): Promise<CheckupData> {
  return chunk("age");
}
