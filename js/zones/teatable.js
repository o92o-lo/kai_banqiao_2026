// 大茶桌：茶杯、點心趣味文字；常見問題清單（目錄模式用）。小賴對話在 js/chat.js
import { h, pick } from '../util.js';

export function faqContent(data, { buttons = true } = {}) {
  // D71：button=false 只給小賴看，不在畫面上列出
  const faq = (data.faq || []).filter((f) => f.button !== false);
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

export function teaLine(data, kind) {
  return pick((data.tea && data.tea[kind]) || []);
}
