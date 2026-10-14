// 目錄模式：純文字列出全部內容，給長輩、讀屏、不想找東西的人
import { h } from './util.js';
import { openModal } from './modal.js';
import { profileContent } from './zones/desk.js';
import { policyItems } from './zones/policy.js';
import { eventsContent, donateContent, socialContent } from './zones/bulletin.js';
import { voteContent } from './zones/backdrop.js';
import { downloadsContent } from './zones/welcome.js';
import { faqContent } from './zones/teatable.js';

export function openCatalog(data) {
  const section = (title, ...body) => h('section', { class: 'cat-sec' }, h('h2', {}, title), ...body);
  const s = data.settings;
  openModal({
    title: '目錄',
    body: [
      section('投票資訊', ...voteContent(data)),
      section('候選人資料', ...profileContent(data), ...socialContent(data)),
      section('政見', (data.policies || []).map((p) => [h('h3', {}, p.title), policyItems(p)])),
      section('活動行程', ...eventsContent(data)),
      section('小額捐款', ...donateContent(data)),
      section('文宣下載', ...downloadsContent(data)),
      (data.faq || []).some((f) => f.button !== false) ? section(`常見問題（${s.assistant_name || ''}）`, faqContent(data, { buttons: false })) : null,
    ].filter(Boolean),
  });
}
