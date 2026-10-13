// 大背板：標語、倒數；投票資訊彈窗（號次牌也用這個）
import { h, daysUntil, shortDate, longDate } from '../util.js';
import { openModal } from '../modal.js';

// 手機頂部細條用的短版
export function countdownShort(s) {
  const n = daysUntil(s.vote_date);
  return n == null ? '' : `距投票 ${n} 天`;
}

export function countdownText(s) {
  const n = daysUntil(s.vote_date);
  return n == null ? '' : `距離 ${shortDate(s.vote_date)} 投票還有 ${n} 天`;
}

// 號次：抽籤前顯示 ballot_placeholder（01-spec §3.4 歡迎桌）
export function ballotText(s) {
  return s.ballot_number ? `凱勛 ${s.ballot_number} 號` : s.ballot_placeholder || '';
}

export function renderBackdrop(data, box) {
  const s = data.settings;
  box.replaceChildren(
    h('p', { class: 'bd-main' }, s.slogan_main || ''),
    h('p', { class: 'bd-sub' }, s.slogan_sub || ''),
    h('p', { class: 'bd-count' }, countdownText(s)),
  );
}

export function voteContent(data) {
  const s = data.settings;
  const rows = [
    ['投票日', longDate(s.vote_date)],
    ['投票時間', s.vote_time],
    ['號次', s.ballot_number ? `${s.ballot_number} 號` : s.ballot_placeholder],
    ['選區', s.district],
  ].filter(([, v]) => v);
  return [
    h('p', { class: 'big-count' }, countdownText(s)),
    h('dl', { class: 'info' }, rows.map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
  ];
}

export function openVote(data) {
  openModal({ title: '投票資訊', body: voteContent(data) });
}
