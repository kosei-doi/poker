// イメージ写真を取得・検証して WebP に変換し、出典（photo-credits.json）を書き出す（基本設計 13.11.3）。
// 入力: scripts/photo-sources.json。出力: src/assets/photos/<id>.webp と src/data/photo-credits.json
// 実行: frontend/ で `npm run photos`。1件だけ取り直すときは `npm run photos -- --only spot-xxx`
// 入出力先は環境変数 PHOTO_SOURCES・PHOTO_OUT_DIR・PHOTO_CREDITS_OUT で差し替えられる（試験用）
// ライセンスが許可リスト外・AI 生成・150KB に収まらない、などのときは何も書かずに exit 1

import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = path.resolve(process.env.PHOTO_SOURCES ?? path.join(FRONTEND, 'scripts/photo-sources.json'));
const OUT_DIR = path.resolve(process.env.PHOTO_OUT_DIR ?? path.join(FRONTEND, 'src/assets/photos'));
const CREDITS_OUT = path.resolve(process.env.PHOTO_CREDITS_OUT ?? path.join(FRONTEND, 'src/data/photo-credits.json'));

const USER_AGENT = 'anaba-poc-photos/0.1 (sample photo fetcher for a local PoC)';
const API = 'https://commons.wikimedia.org/w/api.php';
// 150KB を 1000 バイト単位で数えても 1024 バイト単位で数えても超えないよう、小さいほうに合わせる
const MAX_BYTES = 150_000;
const QUALITIES = [72, 64, 56, 50];
const OUT_W = 1200;
const WIDTHS = [OUT_W, 1080, 960, 840];
const CHANGES = 'リサイズ・3:2 に切り抜き・WebP に変換';

const COMMONS_LICENSES = ['CC0', 'Public domain', 'CC BY 2.0', 'CC BY 2.5', 'CC BY 3.0', 'CC BY 4.0'];
const MANUAL_LICENSES = [...COMMONS_LICENSES, 'Unsplash License', 'Pexels License'];
// Public domain のうち、国や条件を限らないものだけ通す。
// License の値は国限定でも 'pd' になることがあるので、ファイルページのテンプレートで判定する
const PD_OK = new Set(['pd', 'pd-self', 'pd-author', 'pd-user', 'cc0', 'pdm']);
const PD_TEMPLATES_OK = ['PD-self', 'PD-author', 'PD-user', 'PD-release', 'CC-zero', 'PDM'].map((t) => `template:${t.toLowerCase()}`);
const PD_TEMPLATES_HELPER = new Set(['template:pd-layout']); // 表示用の部品で、ライセンスではない
// 上以外の PD-*（PD-US*・PD-Japan*・PD-old*・PD-art*・PD-scan* など国や条件を限るもの）があれば止める
const PD_TEMPLATE_RE = /^template:pd-/;
const AI_RE = /AI[- ]generated|Midjourney|Stable Diffusion|DALL-?E|generative AI/i;
const CROP = { center: 'centre', top: 'top', bottom: 'bottom' };

class Stop extends Error {}
const stop = (msg) => { throw new Stop(msg); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, as) {
  let last;
  // Commons は短い間隔で続けて呼ぶと 429 を返すので、呼ぶたびに少し待ち、429 のときは Retry-After（なければ長め）だけ待つ
  let wait = 0;
  for (let i = 0; i < 5; i++) {
    await sleep(i === 0 ? 500 : wait || 2000 * i);
    wait = 0;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.status === 429) wait = (Number(res.headers.get('retry-after')) || 10 * (i + 1)) * 1000;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return as === 'json' ? await res.json() : Buffer.from(await res.arrayBuffer());
    } catch (e) {
      last = e;
    }
  }
  stop(`取得に失敗（5回）: ${url}: ${last?.message}`);
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
const stripHtml = (html) => decodeEntities(String(html ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

function absUrl(u) {
  if (!u) return null;
  u = decodeEntities(u);
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `https://commons.wikimedia.org${u}`;
  return u.replace(/^http:\/\//, 'https://');
}

function normalizeLicense(name) {
  const s = String(name ?? '').trim().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').toUpperCase();
  if (/^CC0( 1\.0)?$/.test(s) || s === 'CC ZERO') return 'CC0';
  if (s === 'PUBLIC DOMAIN' || s === 'PD') return 'Public domain';
  const m = s.match(/^CC BY (\d\.\d)$/);
  if (m) return `CC BY ${m[1]}`;
  return String(name ?? '').trim();
}

function defaultLicenseUrl(license) {
  if (license === 'CC0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (license === 'Public domain') return 'https://commons.wikimedia.org/wiki/Help:Public_domain';
  const m = license.match(/^CC BY (\d\.\d)$/);
  if (m) return `https://creativecommons.org/licenses/by/${m[1]}/`;
  if (license === 'Unsplash License') return 'https://unsplash.com/license';
  if (license === 'Pexels License') return 'https://www.pexels.com/license/';
  return null;
}

const rowId = (row) => `${row.target?.kind}-${row.target?.id}`;

function precheck(rows) {
  const errors = [];
  if (!Array.isArray(rows)) return ['photo-sources.json は配列にする'];
  const ids = new Set();
  const titles = new Set();
  rows.forEach((row, i) => {
    const where = `${i + 1}行目（${rowId(row)}）`;
    if (!['town', 'spot'].includes(row.target?.kind) || !row.target?.id) errors.push(`${where}: target が不正`);
    const id = rowId(row);
    if (ids.has(id)) errors.push(`${where}: id が重複`);
    ids.add(id);
    if (!!row.commonsTitle === !!row.manual) errors.push(`${where}: commonsTitle と manual のどちらか一方だけを書く`);
    if (row.commonsTitle) {
      if (!row.commonsTitle.startsWith('File:')) errors.push(`${where}: commonsTitle は File: で始める`);
      if (titles.has(row.commonsTitle)) errors.push(`${where}: commonsTitle が重複（${row.commonsTitle}）`);
      titles.add(row.commonsTitle);
    }
    if (row.manual) {
      for (const k of ['url', 'imageUrl', 'title', 'author', 'license', 'licenseUrl']) {
        if (!String(row.manual[k] ?? '').trim()) errors.push(`${where}: manual.${k} が空`);
      }
    }
    if (row.crop !== undefined && !CROP[row.crop]) errors.push(`${where}: crop は center・top・bottom のどれか`);
    if (!String(row.checkedBy ?? '').trim()) errors.push(`${where}: checkedBy が空`);
  });
  return errors;
}

async function commonsMeta(title) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', titles: title,
    prop: 'imageinfo|categories|templates', cllimit: 'max', tlnamespace: '10', tllimit: 'max',
    iiprop: 'url|size|extmetadata', iiurlwidth: '1600',
  });
  const json = await fetchRetry(`${API}?${q}`, 'json');
  const page = Object.values(json?.query?.pages ?? {})[0];
  if (!page || 'missing' in page || !page.imageinfo?.[0]) stop(`Commons にファイルがない: ${title}`);
  const info = page.imageinfo[0];
  const ext = info.extmetadata ?? {};
  const val = (k) => ext[k]?.value ?? '';

  const license = normalizeLicense(stripHtml(val('LicenseShortName')));
  if (!COMMONS_LICENSES.includes(license)) stop(`許可リスト外のライセンス: ${license || '（なし）'}`);
  if (license === 'Public domain') {
    const pd = stripHtml(val('License')).toLowerCase();
    if (!PD_OK.has(pd)) stop(`国や条件を限ったパブリックドメイン: License=${pd || '（なし）'}`);
    const tpls = (page.templates ?? []).map((t) => t.title.toLowerCase());
    if (!tpls.some((t) => PD_TEMPLATES_OK.includes(t))) stop('パブリックドメインだが PD-self・PD-author・PD-user・PD-release・CC-zero・PDM のテンプレートがない');
    const bad = (page.templates ?? []).map((t) => t.title)
      .filter((t) => PD_TEMPLATE_RE.test(t.toLowerCase()) && !PD_TEMPLATES_OK.includes(t.toLowerCase()) && !PD_TEMPLATES_HELPER.has(t.toLowerCase()));
    if (bad.length) stop(`国や条件を限ったパブリックドメイン: ${bad.join(', ')}`);
  }

  const cats = [...(page.categories ?? []).map((c) => c.title), stripHtml(val('Categories'))].join(' | ');
  const aiHit = [cats, stripHtml(val('ImageDescription'))].find((t) => AI_RE.test(t));
  if (aiHit) stop(`AI 生成の可能性（${aiHit.match(AI_RE)[0]}）`);

  const artist = val('Artist');
  const author = stripHtml(artist);
  if (!author) stop('撮影者（Artist）が空');
  const href = String(artist).match(/<a\s[^>]*href\s*=\s*["']([^"']+)["']/i)?.[1];

  const useOriginal = !info.thumburl || info.width < 1600;
  return {
    imageUrl: useOriginal ? info.url : info.thumburl,
    credit: {
      title: title.replace(/^File:/, '').replace(/\.[^.]+$/, ''),
      author,
      authorUrl: absUrl(href),
      sourceUrl: info.descriptionurl,
      license,
      licenseUrl: absUrl(stripHtml(val('LicenseUrl'))) || defaultLicenseUrl(license),
    },
  };
}

async function convert(input, crop) {
  const meta = await sharp(input).rotate().metadata();
  // EXIF の向きで幅と高さが入れ替わる場合がある
  const [iw, ih] = (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  // 拡大はしない。元が小さければ元の大きさのまま 3:2 に切る
  const maxW = Math.min(OUT_W, iw, Math.floor((ih * 3) / 2));
  // 葉や岩の細かい写真は quality を下げても 150KB を超えるので、そのときは幅を縮める（要件は「幅 1200px 以下」）
  for (const w of WIDTHS.filter((x) => x <= maxW).concat(WIDTHS.some((x) => x <= maxW) ? [] : [maxW])) {
    const h = Math.round((w * 2) / 3);
    for (const quality of QUALITIES) {
      const out = await sharp(input)
        .rotate()
        .resize(w, h, { fit: 'cover', position: CROP[crop ?? 'center'], withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer({ resolveWithObject: true });
      if (out.info.size <= MAX_BYTES) return { buffer: out.data, width: out.info.width, height: out.info.height, bytes: out.info.size, quality };
    }
  }
  stop(`幅 ${WIDTHS.at(-1)}px・quality ${QUALITIES.at(-1)} でも ${MAX_BYTES / 1000}KB を超える`);
}

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function processRow(row, retrievedAt) {
  const id = rowId(row);
  let imageUrl, meta;
  if (row.commonsTitle) {
    ({ imageUrl, credit: meta } = await commonsMeta(row.commonsTitle));
  } else {
    const m = row.manual;
    const license = normalizeLicense(m.license);
    if (!MANUAL_LICENSES.includes(license)) stop(`許可リスト外のライセンス: ${m.license}`);
    imageUrl = m.imageUrl;
    meta = { title: m.title, author: m.author.trim(), authorUrl: m.authorUrl ?? null, sourceUrl: m.url, license, licenseUrl: m.licenseUrl };
  }
  const img = await convert(await fetchRetry(imageUrl, 'buffer'), row.crop);
  console.log(`  ${id}  ${meta.license}  ${img.width}×${img.height}  ${(img.bytes / 1000).toFixed(1)}KB  q${img.quality}`);
  const { title, author, authorUrl, sourceUrl, license, licenseUrl } = meta;
  return {
    buffer: img.buffer,
    credit: {
      id, target: row.target, file: `${id}.webp`,
      width: img.width, height: img.height, bytes: img.bytes,
      title, author, authorUrl, sourceUrl, license, licenseUrl,
      changes: CHANGES, retrievedAt,
    },
  };
}

async function main() {
  const { values } = parseArgs({ options: { only: { type: 'string' } } });
  const rows = JSON.parse(await readFile(SOURCES, 'utf8'));
  const errors = precheck(rows);
  if (errors.length) stop(`photo-sources.json の事前チェックに失敗:\n  ${errors.join('\n  ')}`);

  const targets = values.only ? rows.filter((r) => rowId(r) === values.only) : rows;
  if (values.only && targets.length === 0) stop(`--only の id が photo-sources.json にない: ${values.only}`);

  // 全行を先にメモリ上で作り、1件でも止まったら何も書かない
  const retrievedAt = localDate();
  const results = [];
  for (const row of targets) {
    try {
      results.push(await processRow(row, retrievedAt));
    } catch (e) {
      if (e instanceof Stop) e.message = `${rowId(row)}: ${e.message}`;
      throw e;
    }
  }

  let credits = results.map((r) => r.credit);
  if (values.only) {
    // 既存の出典を読み、該当行だけ差し替える（順番は photo-sources.json の順）
    let old = [];
    try { old = JSON.parse(await readFile(CREDITS_OUT, 'utf8')); } catch { /* まだ無い */ }
    const byId = new Map(old.map((c) => [c.id, c]));
    byId.set(credits[0].id, credits[0]);
    credits = rows.map((r) => byId.get(rowId(r))).filter(Boolean);
  }

  await mkdir(OUT_DIR, { recursive: true });
  for (const r of results) await writeFile(path.join(OUT_DIR, r.credit.file), r.buffer);
  await mkdir(path.dirname(CREDITS_OUT), { recursive: true });
  await writeFile(CREDITS_OUT, `${JSON.stringify(credits, null, 2)}\n`);

  // photo-sources.json に無い古い .webp を消す
  const keep = new Set(rows.map((r) => `${rowId(r)}.webp`));
  for (const f of await readdir(OUT_DIR)) {
    if (f.endsWith('.webp') && !keep.has(f)) {
      await unlink(path.join(OUT_DIR, f));
      console.log(`  削除: ${f}`);
    }
  }

  const total = results.reduce((s, r) => s + r.credit.bytes, 0);
  console.log(`完了: ${results.length}枚・合計 ${(total / 1000).toFixed(1)}KB → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e instanceof Stop ? `停止: ${e.message}` : e);
  process.exit(1);
});
