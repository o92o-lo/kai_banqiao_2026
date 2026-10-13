// 凱勛辦公桌：泡泡台詞輪播；候選人資料卡
import { h, daysUntil, reducedMotion } from '../util.js';
import { openModal } from '../modal.js';
import { socialContent } from './bulletin.js';

export function profileContent(data) {
  const p = data.profile || {};
  return [
    h('div', { class: 'profile-head' },
      h('div', { class: 'avatar', 'aria-hidden': 'true' }),
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
export function startBubble(data, el) {
  const lines = data.lines || [];
  if (!lines.length) { el.hidden = true; return; }
  const sec = Math.max(3, Number(data.settings.bubble_seconds) || 6);
  const days = daysUntil(data.settings.vote_date);
  const fill = (t) => t.replaceAll('{days}', days ?? '');
  let i = 0;
  const text = el.querySelector('.bubble-text');
  text.textContent = fill(lines[0]);
  el.hidden = false;
  if (lines.length < 2) return;
  setInterval(() => {
    i = (i + 1) % lines.length;
    if (reducedMotion()) { text.textContent = fill(lines[i]); return; }
    el.classList.add('fade');
    setTimeout(() => { text.textContent = fill(lines[i]); el.classList.remove('fade'); }, 400);
  }, sec * 1000);
}
