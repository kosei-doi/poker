import { describe, expect, it } from 'vitest';
import {
  ALLOWED_LICENSES,
  getSpotPhoto,
  getTownPhoto,
  PHOTO_CREDITS,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_WIDTH,
  photoId,
  photoTargetLabel,
  type PhotoTarget,
} from './photos';
import { SPOTS } from './spots';
import { TOWNS } from './towns';

// 要件 N5・基本設計 13.11 / 13.13。写真は src/assets/photos/ に23枚（町6・スポット17）

// @types/node を入れていないので、使う分だけ型を書いて node:fs を読み込む
interface Fs {
  existsSync(path: URL): boolean;
  readdirSync(path: URL): string[];
  readFileSync(path: URL): Uint8Array;
}
const fsModule = 'node:fs';
const fs = (await import(/* @vite-ignore */ fsModule)) as Fs;

const PHOTO_DIR = new URL('../assets/photos/', import.meta.url);
const readPhoto = (file: string) => fs.readFileSync(new URL(file, PHOTO_DIR));
const assetFiles = () => (fs.existsSync(PHOTO_DIR) ? fs.readdirSync(PHOTO_DIR).filter((f) => f.endsWith('.webp')) : []);

const TARGETS: { target: PhotoTarget; name: string }[] = [
  ...TOWNS.map((t) => ({ target: { kind: 'town', id: t.id } as PhotoTarget, name: t.name })),
  ...SPOTS.map((s) => ({ target: { kind: 'spot', id: s.id } as PhotoTarget, name: s.name })),
];

/** WebP のヘッダーから幅と高さを読む（VP8 / VP8L / VP8X）。WebP でなければ null */
export function readWebpSize(b: Uint8Array): { width: number; height: number } | null {
  const ascii = (at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));
  if (b.length < 30 || ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') return null;
  const le16 = (at: number) => b[at] | (b[at + 1] << 8);
  const le24 = (at: number) => b[at] | (b[at + 1] << 8) | (b[at + 2] << 16);
  const d = 20; // 最初のチャンクのデータの先頭
  switch (ascii(12, 4)) {
    case 'VP8 ': {
      // フレームタグ3バイト → 開始コード 9d 01 2a → 幅・高さ（各14ビット＋拡大率2ビット）
      if (b[d + 3] !== 0x9d || b[d + 4] !== 0x01 || b[d + 5] !== 0x2a) return null;
      return { width: le16(d + 6) & 0x3fff, height: le16(d + 8) & 0x3fff };
    }
    case 'VP8L': {
      // 署名 0x2f → 幅-1（14ビット）・高さ-1（14ビット）をリトルエンディアンのビット列で
      if (b[d] !== 0x2f) return null;
      const bits = (b[d + 1] | (b[d + 2] << 8) | (b[d + 3] << 16) | (b[d + 4] << 24)) >>> 0;
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    case 'VP8X':
      // フラグ4バイト → キャンバスの幅-1（24ビット）・高さ-1（24ビット）
      return { width: le24(d + 4) + 1, height: le24(d + 7) + 1 };
    default:
      return null;
  }
}

/** テスト用に最小の WebP を組み立てる（チャンクのデータだけを渡す） */
function webp(fourCC: string, data: number[]): Uint8Array {
  const bytes = [...'RIFF'].map((c) => c.charCodeAt(0));
  const size = 4 + 8 + data.length;
  bytes.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
  bytes.push(...[...`WEBP${fourCC}`].map((c) => c.charCodeAt(0)));
  bytes.push(data.length & 0xff, (data.length >> 8) & 0xff, 0, 0);
  bytes.push(...data, ...new Array(16).fill(0));
  return Uint8Array.from(bytes);
}

describe('readWebpSize（WebP のヘッダーの読み取り）', () => {
  it('VP8（非可逆）の幅と高さを読める', () => {
    // 1200 = 0x04b0、800 = 0x0320。上位2ビットの拡大率は無視する
    const b = webp('VP8 ', [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, 0xb0, 0x04 | 0x40, 0x20, 0x03 | 0x80]);
    expect(readWebpSize(b)).toEqual({ width: 1200, height: 800 });
  });

  it('VP8L（可逆）の幅と高さを読める', () => {
    // 幅-1 = 1199、高さ-1 = 799 を 14ビットずつ詰める
    const bits = 1199 | (799 << 14);
    const b = webp('VP8L', [0x2f, bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, (bits >>> 24) & 0xff]);
    expect(readWebpSize(b)).toEqual({ width: 1200, height: 800 });
  });

  it('VP8X（拡張）のキャンバスの幅と高さを読める', () => {
    // 幅-1 = 1199 = 0x0004af、高さ-1 = 799 = 0x00031f
    const b = webp('VP8X', [0x10, 0, 0, 0, 0xaf, 0x04, 0x00, 0x1f, 0x03, 0x00]);
    expect(readWebpSize(b)).toEqual({ width: 1200, height: 800 });
  });

  it('WebP でないもの・開始コードや署名が違うものは null', () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, ...new Array(40).fill(0)]);
    expect(readWebpSize(png)).toBeNull();
    expect(readWebpSize(webp('VP8 ', [0, 0, 0, 0x00, 0x01, 0x2a, 0, 0, 0, 0]))).toBeNull();
    expect(readWebpSize(webp('VP8L', [0x00, 0, 0, 0, 0]))).toBeNull();
    expect(readWebpSize(webp('ALPH', [0, 0, 0, 0]))).toBeNull();
  });
});

// 差し替えの写真を選び直している対象（そろったら空にする）。ここにある対象は代わりの表示になる（N5-6）
const PENDING = ['town-hitachi', 'spot-hitachi-kamine', 'spot-hitachi-station'];
const EXPECTED = TARGETS.filter(({ target }) => !PENDING.includes(photoId(target)));

describe('写真と出典がそろっている', () => {
  it('町6・スポット17のすべてに出典があり、id と target が一致する', () => {
    const missing: string[] = [];
    for (const { target } of EXPECTED) {
      const c = PHOTO_CREDITS.find((p) => p.id === photoId(target));
      if (!c) missing.push(photoId(target));
      else expect(c.target).toEqual(target);
    }
    expect(missing).toEqual([]);
  });

  it('出典は23件ちょうどで、存在しない町・スポットを指すものがない', () => {
    expect(TOWNS).toHaveLength(6);
    expect(SPOTS).toHaveLength(17);
    expect(PHOTO_CREDITS).toHaveLength(23 - PENDING.length);
    const ids = new Set(TARGETS.map(({ target }) => photoId(target)));
    expect(PHOTO_CREDITS.filter((c) => !ids.has(c.id)).map((c) => c.id)).toEqual([]);
    expect(PHOTO_CREDITS.filter((c) => c.id !== photoId(c.target)).map((c) => c.id)).toEqual([]);
  });

  it('getTownPhoto / getSpotPhoto がすべての町・スポットで写真を返し、alt が「{名前}のイメージ写真」', () => {
    for (const { target, name } of EXPECTED) {
      const p = target.kind === 'town' ? getTownPhoto(target.id) : getSpotPhoto(target.id);
      expect(p, photoId(target)).not.toBeNull();
      expect(p!.src).not.toBe('');
      expect(p!.alt).toBe(`${name}のイメージ写真`);
      expect(p!.credit.id).toBe(photoId(target));
    }
  });
});

describe('写真のファイル', () => {
  it('出典に載っているファイルが src/assets/photos/ に実在する', () => {
    const files = new Set(assetFiles());
    expect(PHOTO_CREDITS.filter((c) => !files.has(c.file)).map((c) => c.file)).toEqual([]);
  });

  it('assets の .webp はすべて出典に載っている（孤立ファイルがない）', () => {
    const files = assetFiles();
    expect(files).toHaveLength(23 - PENDING.length);
    const listed = new Set(PHOTO_CREDITS.map((c) => c.file));
    expect(files.filter((f) => !listed.has(f))).toEqual([]);
  });

  it('1枚 150KB 以下で、bytes が実ファイルの大きさと一致する', () => {
    for (const c of PHOTO_CREDITS) {
      const size = readPhoto(c.file).length;
      expect(size, c.file).toBeLessThanOrEqual(PHOTO_MAX_BYTES);
      expect(c.bytes, c.file).toBe(size);
    }
  });

  it('WebP のヘッダーから読んだ幅が 1200 以下で、width / height と一致する', () => {
    for (const c of PHOTO_CREDITS) {
      const size = readWebpSize(readPhoto(c.file));
      expect(size, c.file).not.toBeNull();
      expect(size!.width, c.file).toBeLessThanOrEqual(PHOTO_MAX_WIDTH);
      expect(size, c.file).toEqual({ width: c.width, height: c.height });
    }
  });
});

describe('出典の内容', () => {
  const allowed = new Set<string>(ALLOWED_LICENSES);

  it('ライセンスが許可リストにあり、licenseUrl・sourceUrl が https', () => {
    for (const c of PHOTO_CREDITS) {
      expect(allowed.has(c.license), `${c.id}: ${c.license}`).toBe(true);
      expect(c.licenseUrl, c.id).toMatch(/^https:\/\//);
      expect(c.sourceUrl, c.id).toMatch(/^https:\/\//);
    }
  });

  it('撮影者・入手元が空でない（CC BY 系はとくに撮影者が必須）', () => {
    for (const c of PHOTO_CREDITS) {
      expect(c.author.trim(), c.id).not.toBe('');
      expect(c.sourceUrl.trim(), c.id).not.toBe('');
      if (c.license.startsWith('CC BY')) expect(c.author.trim(), c.id).not.toBe('');
    }
  });

  it('changes が空でなく、retrievedAt が YYYY-MM-DD', () => {
    for (const c of PHOTO_CREDITS) {
      expect(c.changes.trim(), c.id).not.toBe('');
      expect(c.retrievedAt, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(c.retrievedAt)), c.id).toBe(false);
    }
  });

  it('同じファイル・同じ入手元・同じ id を2回使っていない', () => {
    const dup = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
    expect(dup(PHOTO_CREDITS.map((c) => c.file))).toEqual([]);
    expect(dup(PHOTO_CREDITS.map((c) => c.sourceUrl))).toEqual([]);
    expect(dup(PHOTO_CREDITS.map((c) => c.id))).toEqual([]);
  });
});

describe('photoTargetLabel・存在しない id', () => {
  it('町は町名、スポットは「町名 / スポット名」', () => {
    expect(photoTargetLabel({ kind: 'town', id: 'hitachiota' })).toBe('常陸太田市');
    expect(photoTargetLabel({ kind: 'spot', id: 'hitachiota-bamboo' })).toBe('常陸太田市 / 西山の竹林の小径');
    for (const s of SPOTS) {
      const town = TOWNS.find((t) => t.id === s.townId)!;
      expect(photoTargetLabel({ kind: 'spot', id: s.id })).toBe(`${town.name} / ${s.name}`);
    }
  });

  it('存在しない townId / spotId では null', () => {
    expect(getTownPhoto('no-such-town')).toBeNull();
    expect(getSpotPhoto('no-such-spot')).toBeNull();
  });
});
