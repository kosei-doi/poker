import type { TownSummary } from '../../types';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** 光った町のラベル（D1-2・D5）: 町名・一言・タグ（件数付き）。タグは省略しない */
export function litLabelHtml(name: string, summary: TownSummary | undefined): string {
  const tags = (summary?.tags ?? []).map((t) => `<span>#${esc(t.tag)}<small> ${t.count}</small></span>`).join('');
  return `<div class="town-label is-lit"><div class="name">${esc(name)}</div><div class="phrase">${esc(
    summary?.catchphrase ?? '',
  )}</div><div class="tags">${tags}</div></div>`;
}

export function plainLabelHtml(name: string): string {
  return `<div class="town-label"><div class="name">${esc(name)}</div></div>`;
}

export function spotPinHtml(order: number): string {
  return `<div class="spot-pin">${order}</div>`;
}

export function spotPopupHtml(name: string, kind: string): string {
  const t = `<p style="margin:2px 0 0;font-size:11px;opacity:.8">${esc(kind)}</p>`;
  return `<div style="min-width:150px"><p style="margin:0;font-weight:700">${esc(name)}</p>${t}<button type="button" data-write-voice style="margin-top:6px;border-radius:8px;background:#fbbf24;color:#1c1300;font-weight:700;padding:4px 10px;font-size:12px">感想を書く</button></div>`;
}
