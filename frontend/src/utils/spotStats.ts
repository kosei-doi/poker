import type { Spot } from '../types';

export function countFootprints(spot: Spot) {
  let local = 0;
  let visitor = 0;
  for (const fp of spot.footprints) {
    if (fp.userType === 'local') local++;
    else visitor++;
  }
  return { local, visitor, total: local + visitor };
}

/**
 * 穴場度 (0-100)。地元の人の足跡が多く、旅人の足跡がまだ少ないほど高い。
 * 「地元に愛されているのに、まだ知られていない場所」を見つけるための指標。
 */
export function hiddenGemScore(spot: Spot) {
  const { local, visitor, total } = countFootprints(spot);
  if (total === 0) return 50;
  const localRatio = local / total;
  // 旅人の足跡が増えるほど「穴場」ではなくなっていく
  const obscurity = 1 / (1 + visitor / 4);
  return Math.round((localRatio * 0.6 + obscurity * 0.4) * 100);
}

export function averageRating(spot: Spot) {
  if (spot.footprints.length === 0) return null;
  const sum = spot.footprints.reduce((acc, fp) => acc + fp.rating, 0);
  return Math.round((sum / spot.footprints.length) * 10) / 10;
}

/** 足跡を地図上でスポットの周りに少し散らすためのずらし量 */
export function jitter(base: number, meters = 120) {
  const deg = meters / 111_000;
  return base + (Math.random() - 0.5) * 2 * deg;
}

export function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
