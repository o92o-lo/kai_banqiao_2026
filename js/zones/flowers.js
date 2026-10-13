// 花籃區：按一下 → 隨機祝福語＋多一個花籃。Sprint 2 接 api.flower() 寫入 Sheet、計數 +1。
import { h, pick, storageGet, storageSet } from '../util.js';

const KEY = 'kai.flowerAt';

export function flowerCountText(n) {
  return `已有 ${n} 位鄉親送花籃`;
}

// 回傳 { ok, blessing, wait }；wait＝還要等幾秒
export function sendFlower(data) {
  const cooldown = (Number(data.settings.flower_cooldown_seconds) || 30) * 1000;
  const last = Number(storageGet(KEY)) || 0;
  const now = Date.now();
  if (now - last < cooldown) return { ok: false, wait: Math.ceil((cooldown - (now - last)) / 1000) };
  storageSet(KEY, String(now));
  const b = pick(data.blessings || []);
  // 還沒接後台：計數不加（04 §3.4 失敗時的行為）
  return { ok: true, blessing: b ? b.text : '' };
}

export function blessingCard(text) {
  return h('div', { class: 'card-inner' }, h('p', {}, text));
}
