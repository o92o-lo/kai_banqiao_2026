// 跟 Apps Script 溝通；失敗就用 data/fallback.json（04 §3.4）
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

export async function bootstrap() {
  if (!API_URL) return fallback();
  try {
    const data = await fetchJson(`${API_URL}?action=bootstrap`, BOOTSTRAP_TIMEOUT);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.warn('bootstrap 失敗，改用 fallback', err);
    return fallback();
  }
}

// POST 一律用 text/plain，避免 CORS 預檢（06 §3.2）
async function post(body, ms) {
  if (!API_URL) throw new Error('API_URL 未設定');
  return fetchJson(API_URL, ms, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
}

export function flower() {
  return post({ action: 'flower', client: clientId() }, 8000);
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
