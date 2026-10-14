// 大茶桌：小賴（Sprint 1 先放常見問題，AI 對話 Sprint 3）；茶杯、點心趣味文字
import { h, pick } from '../util.js';
import { openModal } from '../modal.js';

export function faqContent(data, { buttons = true } = {}) {
  const faq = data.faq || [];
  if (!buttons) {
    return h('dl', { class: 'faq' }, faq.map((f) => [
      h('dt', {}, f.q),
      h('dd', {}, f.a, f.source ? h('span', { class: 'source' }, `出處：${f.source}`) : null),
    ]));
  }
  const log = h('div', { class: 'chat-log', 'aria-live': 'polite' });
  const list = h('div', { class: 'faq-buttons' }, faq.map((f) => h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      log.append(
        h('p', { class: 'msg msg-user' }, f.q),
        h('p', { class: 'msg msg-lai' }, f.a, f.source ? h('span', { class: 'source' }, `出處：${f.source}`) : null),
      );
      log.lastElementChild.scrollIntoView({ block: 'nearest' });
    },
  }, f.q)));
  return [list, log];
}

export function openLai(data, onClose) {
  const s = data.settings;
  openModal({
    title: `${s.assistant_title || ''} ${s.assistant_name || ''}`.trim(),
    sub: '我是 AI 助理，不是凱勛本人。回答以官方資料為準。',
    body: faqContent(data),
    onClose,
  });
}

export function teaLine(data, kind) {
  return pick((data.tea && data.tea[kind]) || []);
}
