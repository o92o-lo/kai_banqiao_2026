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
      h('img', { class: 'photo', src: p.photo_url || 'assets/photo-kai.jpg', alt: `${p.name || ''}照片`, loading: 'lazy' }),
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

// 每 bubble_seconds 秒換一句；{days} 換成倒數天數
export function startBubble(data, el, onChange = () => {}) {
  const lines = data.lines || [];
  if (!lines.length) { el.hidden = true; return; }
  const sec = Math.max(3, Number(data.settings.bubble_seconds) || 6);
  const days = daysUntil(data.settings.vote_date);
  const fill = (t) => t.replaceAll('{days}', days ?? '');
  let i = 0;
  const text = el.querySelector('.bubble-text');
  text.textContent = fill(lines[0]);
  el.hidden = false;
  onChange();
  if (lines.length < 2) return;
  setInterval(() => {
    i = (i + 1) % lines.length;
    if (reducedMotion()) { text.textContent = fill(lines[i]); onChange(); return; }
    el.classList.add('fade');
    setTimeout(() => { text.textContent = fill(lines[i]); onChange(); el.classList.remove('fade'); }, 400);
  }, sec * 1000);
}
