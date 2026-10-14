// 跟 Apps Script 溝通（D54）：開站先用瀏覽器上次存的資料或 data/fallback.json 立刻顯示，
// 背景再向 Apps Script 要最新資料（最多等 15 秒），成功就存起來、無聲更新畫面。
import { API_URL, BOOTSTRAP_TIMEOUT, VERSION } from './config.js';

async function fetchJson(url, ms, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fallback() {
  const data = await fetchJson(`data/fallback.json?v=${VERSION}`, 10000);
  data.offline = true;
  return data;
}

const CACHE_KEY = 'kai.bootstrap';

function isBootstrap(d) {
  return d && typeof d === 'object' && d.settings && Array.isArray(d.policies);
}

// 立刻可用的資料：上次成功的 bootstrap（localStorage）→ 沒有就用 fallback.json
export async function initialData() {
  try {
    const d = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (isBootstrap(d)) return d;
  } catch { /* 讀不到就用 fallback */ }
  return fallback();
}

// 背景向 Apps Script 要最新資料；成功回傳資料並存進 localStorage，失敗回傳 null
export async function refreshData() {
  if (!API_URL) return null;
  try {
    const d = await fetchJson(`${API_URL}?action=bootstrap`, BOOTSTRAP_TIMEOUT);
    if (!isBootstrap(d)) throw new Error(d && d.error ? d.error : 'bad_response');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch { /* 存不了沒關係 */ }
    return d;
  } catch (err) {
    console.info('後台資料暫時拿不到，先用現有內容', err.message || err);
    return null;
  }
}

// POST 一律用 text/plain，避免 CORS 預檢（06 §3.2）
async function post(body, ms) {
  if (!API_URL) throw new Error('API_URL 未設定');
  return fetchJson(API_URL, ms, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
}

export function flower(variant, blessingId) {
  return post({ action: 'flower', client: clientId(), variant, blessingId }, 15000);
}

// 小賴：Apps Script 冷啟動可能要 6–12 秒，再加模型回答（紅隊有題目 30–36 秒），前端最多等 40 秒（D72）
export function chat(message, history) {
  return post({ action: 'chat', client: clientId(), message, history }, 40000);
}

// 每個瀏覽器一個隨機 ID；讀不到 localStorage 就每次新產生
export function clientId() {
  const make = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  try {
    let id = localStorage.getItem('kai.client');
    if (!id) { id = make(); localStorage.setItem('kai.client', id); }
    return id;
  } catch {
    return make();
  }
}
