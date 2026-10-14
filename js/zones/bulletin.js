// 布告欄：紅便條「小額捐款」；彈窗三個分頁
import { h, longDate, taipeiToday } from '../util.js';
import { openModal, tabs } from '../modal.js';

export function upcoming(data) {
  const today = taipeiToday();
  return (data.events || []).filter((e) => !e.date || e.date >= today);
}

export function renderDonateNote(el) {
  if (el) el.textContent = '小額捐款';
}

export function eventsContent(data) {
  const list = upcoming(data);
  if (!list.length) return [h('p', { class: 'empty' }, '近期行程整理中，歡迎先追蹤 FB／IG！'), ...socialContent(data)];
  return [h('ol', { class: 'events' }, list.map((e) => h('li', {},
    h('p', { class: 'ev-when' }, longDate(e.date), e.start ? `　${e.start}${e.end ? `–${e.end}` : ''}` : ''),
    h('p', { class: 'ev-title' }, e.title),
    e.place ? h('p', { class: 'ev-place' }, `地點：${e.place}`) : null,
    e.desc ? h('p', {}, e.desc) : null,
    e.url ? h('p', {}, h('a', { href: e.url, target: '_blank', rel: 'noopener' }, '活動連結')) : null,
  )))];
}

export function donateContent(data) {
  const s = data.settings;
  const rows = [['戶名', s.donate_account_name], ['銀行', s.donate_bank], ['帳號', s.donate_account]].filter(([, v]) => v);
  const notes = (s.donate_notes || '').split('｜').map((t) => t.trim()).filter(Boolean);
  return [
    s.donate_url ? h('p', {}, h('a', { class: 'btn btn-red', href: s.donate_url, target: '_blank', rel: 'noopener' }, '前往線上小額捐款')) : null,
    rows.length ? h('h3', {}, '銀行轉帳') : null,
    rows.length ? h('dl', { class: 'info' }, rows.map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])) : null,
    notes.length ? h('h3', {}, '注意事項') : null,
    notes.length ? h('ul', { class: 'notes' }, notes.map((t) => h('li', {}, t))) : null,
  ];
}

export function socialContent(data) {
  const s = data.settings;
  return [h('ul', { class: 'links' },
    s.fb_url ? h('li', {}, h('a', { class: 'btn', href: s.fb_url, target: '_blank', rel: 'noopener' }, 'Facebook 粉絲專頁')) : null,
    s.ig_url ? h('li', {}, h('a', { class: 'btn', href: s.ig_url, target: '_blank', rel: 'noopener' }, 'Instagram')) : null,
  )];
}

export function openBulletin(data, tab = 0) {
  openModal({
    title: '布告欄',
    body: tabs([
      { label: '活動行程', render: () => eventsContent(data) },
      { label: '小額捐款', render: () => donateContent(data) },
      { label: 'FB／IG', render: () => socialContent(data) },
    ], tab),
  });
}
