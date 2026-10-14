// 花籃區：按一下 → 疊一個新花籃＋祝福語卡片＋計數 +1（寫入 Sheet「花籃紀錄」）
// 失敗時從本地 blessings 隨機抽一句，計數不加（04 §3.4）
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

// 回傳 { blessing, count|null }。variant＝這盆的款式（a→b→c 輪流），一起記到後台
export async function sendFlower(data, variant) {
  storageSet(KEY, JSON.stringify([...recentTimes(), Date.now()]));
  try {
    const r = await postFlower(variant);
    if (r && !r.error && r.blessing) return { blessing: r.blessing, count: Number(r.count) };
    if (r && r.error) console.info('花籃沒有記錄：', r.error);
  } catch (err) {
    console.info('送花籃連不到後台，改用本地祝福語', err.message || err);
  }
  const b = pick(data.blessings || []);
  return { blessing: b ? b.text : '', count: null };
}

export function blessingCard(text) {
  return h('div', { class: 'card-inner' }, h('p', {}, text));
}
