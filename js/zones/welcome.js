// 歡迎桌、邊桌：文宣下載
import { h } from '../util.js';
import { openModal } from '../modal.js';

export function downloadsContent(data) {
  const list = data.downloads || [];
  if (!list.length) return [h('p', { class: 'empty' }, '目前沒有可下載的文宣。')];
  return [h('ul', { class: 'downloads' }, list.map((d) => h('li', {},
    h('a', { class: 'btn btn-wide', href: d.url, target: '_blank', rel: 'noopener' }, d.title),
    d.desc ? h('p', {}, d.desc) : null,
  )))];
}

export function openDownloads(data) {
  openModal({ title: '文宣下載', body: downloadsContent(data) });
}
