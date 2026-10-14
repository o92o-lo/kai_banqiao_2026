// 花籃區：按一下 → 疊一個新花籃＋祝福語卡片＋計數 +1（寫入 Sheet「花籃紀錄」）
// D62：畫面全程不等網路——前端抽祝福語、立刻顯示卡片，背景再送後台；失敗計數不加
import { h, pick, storageGet, storageSet } from '../util.js';
import { flower as postFlower } from '../api.js';

const KEY = 'kai.flowerTimes';
const WINDOW_MS = 10000; // D50：同一裝置 10 秒內最多 3 盆
const MAX_IN_WINDOW = 3;
export const TOO_FAST = '花籃送太快了，休息一下再送吧！';

// D38：計數 < 10 只顯示「送花籃祝福凱勛」
export function renderFlowerSign(el, count) {
  if (!el) return;
  el.replaceChildren(h('span', {}, '送花籃祝福凱勛'));
  if (count >= 10) el.append(h('span', { class: 'fs-count' }, `已有 ${count} 位鄉親送花籃`));
}

function recentTimes() {
  let list = [];
  try { list = JSON.parse(storageGet(KEY) || '[]'); } catch { list = []; }
  const now = Date.now();
  return Array.isArray(list) ? list.filter((t) => typeof t === 'number' && now - t < WINDOW_MS && t <= now) : [];
}

// 這 10 秒內還能不能送
export function canSend() {
  return recentTimes().length < MAX_IN_WINDOW;
}

// D62：按下就在前端抽一句（避免和上一句相同），不等網路
let lastId = null;
export function nextBlessing(data) {
  const all = data.blessings || [];
  const pool = all.length > 1 ? all.filter((b) => b.id !== lastId) : all;
  const b = pick(pool) || { id: null, text: '' };
  lastId = b.id;
  return b;
}

// 記下這次送出的時間（10 秒 3 盆的計算用）
export function markSent() {
  storageSet(KEY, JSON.stringify([...recentTimes(), Date.now()]));
}

// 背景送到後台：記錄畫面上那句的編號；回傳後台的計數，失敗回 null（畫面不受影響）
export async function postFlowerInBackground(variant, blessingId) {
  try {
    const r = await postFlower(variant, blessingId);
    if (r && !r.error && r.count != null) return Number(r.count);
    if (r && r.error) console.info('花籃沒有記錄：', r.error);
  } catch (err) {
    console.info('送花籃連不到後台', err.message || err);
  }
  return null;
}

export function blessingCard(text) {
  return h('div', { class: 'card-inner' }, h('p', {}, text));
}
