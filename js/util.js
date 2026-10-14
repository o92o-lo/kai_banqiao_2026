// 小工具：建 DOM、日期、亂數、Sheet 設定
import { SETTING_DEFAULTS } from './layout.js';

// Sheet「網站設定」的值；空白就用預設（layout.js SETTING_DEFAULTS）
export function setting(data, key) {
  const v = (data.settings && data.settings[key]) || '';
  return String(v).trim() || SETTING_DEFAULTS[key] || '';
}

// h('p', { class: 'x' }, '文字', child) — 文字一律用 textContent，Sheet 內容不會被當成 HTML
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// 台北時間的今天（YYYY-MM-DD）
export function taipeiToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
}

// 距離投票日還有幾天（台北日期相減）；過了就回 0
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const a = Date.parse(`${taipeiToday()}T00:00:00Z`);
  const b = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}

// 2026-11-28 → 11/28
export function shortDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  return m ? `${+m[2]}/${+m[3]}` : dateStr || '';
}

// 2026-11-28 → 2026 年 11 月 28 日（六）
export function longDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) return dateStr || '';
  const wd = '日一二三四五六'[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];
  return `${+m[1]} 年 ${+m[2]} 月 ${+m[3]} 日（${wd}）`;
}

export function pick(list) {
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* 無痕模式等情況，忽略 */ }
}
