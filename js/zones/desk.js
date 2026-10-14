// 凱勛辦公桌：泡泡台詞輪播；候選人資料卡
import { h, daysUntil, reducedMotion } from '../util.js';
import { openModal } from '../modal.js';
import { socialContent } from './bulletin.js';
import { SCENE } from '../scene.js';

// 像素頭像：直接從場景圖裁凱勛那一塊（layout.js 的 kaiFace）
function pixelFace() {
  const r = SCENE.kaiFace;
  const el = h('div', { class: 'avatar', 'aria-hidden': 'true' });
  if (!r) return el;
  Object.assign(el.style, {
    backgroundImage: `url(${SCENE.src}.jpg)`,
    backgroundSize: `${(100 / r.w) * 100}% auto`,
    backgroundPosition: `${(r.x / (100 - r.w)) * 100}% ${(r.y / (100 - r.h)) * 100}%`,
    aspectRatio: `${(r.w * SCENE.w) / (r.h * SCENE.h)}`,
  });
  return el;
}

export function profileContent(data) {
  const p = data.profile || {};
  return [
    h('div', { class: 'profile-head' },
      // photo_url 要是網址才用（Sheet 上可能填「（先留空）」之類的說明文字）
      h('img', { class: 'photo', src: /^https?:\/\//.test(p.photo_url || '') ? p.photo_url : 'assets/photo-kai.jpg', alt: `${p.name || ''}照片`, loading: 'lazy' }),
      pixelFace(),
      h('div', {},
        h('p', { class: 'pf-name' }, p.name || ''),
        p.identity ? h('p', { class: 'pf-id' }, p.identity) : null,
      ),
    ),
    p.intro ? h('p', {}, p.intro) : null,
    p.education?.length ? [h('h3', {}, '學歷'), h('ul', {}, p.education.map((t) => h('li', {}, t)))] : null,
    data.career?.length ? [h('h3', {}, '經歷'), h('ol', { class: 'timeline' }, data.career.map((c) => h('li', {},
      c.year ? h('span', { class: 'tl-year' }, c.year) : null,
      h('span', { class: 'tl-text' }, c.text),
    )))] : null,
  ];
}

export function openProfile(data) {
  openModal({ title: '候選人資料', body: [...profileContent(data), ...socialContent(data)] });
}

// 桌牌（D49）：nameplate_text 原樣顯示；最後一段（通常是名字）放大
export function renderNameplate(el, text) {
  if (!el) return;
  const t = (text || '').trim();
  const i = Math.max(t.lastIndexOf(' '), t.lastIndexOf('　'));
  el.replaceChildren(...(i > 0
    ? [h('span', { class: 'np-small' }, t.slice(0, i)), h('span', { class: 'np-big' }, t.slice(i + 1))]
    : [h('span', { class: 'np-big' }, t)]));
}

// 每 bubble_seconds 秒換一句；{days} 換成倒數天數。每次都讀 data.lines（後台資料回來會更新）
export function startBubble(data, el, onChange = () => {}) {
  const text = el.querySelector('.bubble-text');
  let i = 0;
  const show = () => {
    const lines = data.lines || [];
    if (!lines.length) { el.hidden = true; return; }
    const days = daysUntil(data.settings.vote_date);
    text.textContent = lines[i % lines.length].replaceAll('{days}', days ?? '');
    el.hidden = false;
    onChange();
  };
  const tick = () => {
    i += 1;
    if (reducedMotion()) show();
    else {
      el.classList.add('fade');
      setTimeout(() => { show(); el.classList.remove('fade'); }, 400);
    }
    const sec = Math.max(3, Number(data.settings.bubble_seconds) || 6);
    setTimeout(tick, sec * 1000);
  };
  show();
  setTimeout(tick, Math.max(3, Number(data.settings.bubble_seconds) || 6) * 1000);
  return show; // 後台資料更新後呼叫，立刻換成新內容
}
