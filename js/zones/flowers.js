// 花籃區：按一下 → 疊一個新花籃＋祝福語卡片＋計數 +1（寫入 Sheet「花籃紀錄」）
// 失敗時從本地 blessings 隨機抽一句，計數不加（04 §3.4）
import { h, pick, storageGet, storageSet } from '../util.js';
import { flower as postFlower } from '../api.js';

const KEY = 'kai.flowerAt';

// D38：計數 < 10 只顯示「送花籃祝福凱勛」
export function renderFlowerSign(el, count) {
  if (!el) return;
  el.replaceChildren(h('span', {}, '送花籃祝福凱勛'));
  if (count >= 10) el.append(h('span', { class: 'fs-count' }, `已有 ${count} 位鄉親送花籃`));
}

// 冷卻中回傳還要等幾秒，否則 0
export function cooldownLeft(data) {
  const cooldown = (Number(data.settings.flower_cooldown_seconds) || 30) * 1000;
  const last = Number(storageGet(KEY)) || 0;
  const left = cooldown - (Date.now() - last);
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

// 回傳 { blessing, variant, count|null }
export async function sendFlower(data) {
  storageSet(KEY, String(Date.now()));
  try {
    const r = await postFlower();
    if (r && !r.error && r.blessing) return { blessing: r.blessing, variant: r.variant, count: Number(r.count) };
  } catch (err) {
    console.warn('送花籃失敗，改用本地祝福語', err);
  }
  const b = pick(data.blessings || []);
  return { blessing: b ? b.text : '', variant: null, count: null };
}

export function blessingCard(text) {
  return h('div', { class: 'card-inner' }, h('p', {}, text));
}
