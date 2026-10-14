// 留言板／期待牆（D74）：看期待牆＋寫留言。
// 留言一律用 textContent 顯示（util.js 的 h() 只建立文字節點，不會解析 HTML）。
import { h, storageGet, storageSet } from '../util.js';
import { openModal, tabs } from '../modal.js';
import { message as postMessage } from '../api.js';

const NAME_MAX = 12;
const TEXT_MAX = 100;
const WAIT_MS = 60000; // 同一裝置 60 秒 1 則（後台也會擋）
const KEY = 'kai.msgAt';

function wallContent(data) {
  const list = data.messages || [];
  if (!list.length) return [h('p', { class: 'empty' }, '還沒有留言，來當第一個吧！')];
  return [h('ul', { class: 'wall' }, list.map((m) => h('li', { class: 'wall-card' },
    h('p', { class: 'wall-text' }, m.text),
    h('p', { class: 'wall-meta' }, h('span', { class: 'wall-name' }, m.name || '板橋鄉親'), h('span', { class: 'wall-date' }, m.date || '')),
  )))];
}

function waitLeft() {
  const last = Number(storageGet(KEY)) || 0;
  const left = WAIT_MS - (Date.now() - last);
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

function formContent() {
  const name = h('input', { type: 'text', class: 'gb-name', maxlength: String(NAME_MAX), placeholder: '板橋鄉親', 'aria-label': '暱稱（選填）', autocomplete: 'off' });
  const text = h('textarea', { class: 'gb-text', rows: '3', maxlength: String(TEXT_MAX), 'aria-label': '留言（100 字以內）', placeholder: '想對凱勛說的話、對板橋的期待…' });
  const count = h('span', { class: 'chat-count', 'aria-live': 'polite' });
  const send = h('button', { type: 'submit', class: 'btn btn-send' }, '送出');
  const status = h('p', { class: 'gb-status', role: 'status', 'aria-live': 'polite' });
  const update = () => {
    count.textContent = `還可以輸入 ${Math.max(0, TEXT_MAX - [...text.value].length)} 字`;
    send.disabled = !text.value.trim();
  };
  text.addEventListener('input', update);
  update();

  const form = h('form', { class: 'gb-form' },
    h('label', { class: 'gb-label' }, '暱稱（選填）', name),
    h('label', { class: 'gb-label' }, '留言', text),
    count,
    h('p', { class: 'chat-note' }, '請勿留下電話、地址等個人資料。留言經 AI 與團隊審核後才會顯示。',
      h('a', { class: 'privacy-link', href: 'privacy.html', target: '_blank', rel: 'noopener' }, '隱私權說明')),
    h('div', { class: 'gb-actions' }, send),
    status);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = text.value.trim();
    if (!body) return;
    const wait = waitLeft();
    if (wait) { status.textContent = `${wait} 秒後可以再留言。`; return; }
    send.disabled = true;
    status.textContent = '送出中…';
    try {
      const r = await postMessage(name.value.trim(), body);
      if (!r || !r.ok) throw new Error((r && r.error) || 'failed');
      storageSet(KEY, String(Date.now()));
      name.value = '';
      text.value = '';
      update();
      status.textContent = '謝謝留言！團隊看過後會放上期待牆';
    } catch (err) {
      console.info('留言沒有送出', err.message || err);
      status.textContent = err.message === 'busy' ? '留言的人有點多，請稍後再試一次。' : '留言沒有送出，請稍後再試一次。';
      update();
    }
  });
  return [form];
}

// tab：0＝看期待牆、1＝寫留言
export function openGuestbook(data, tab = 0) {
  openModal({
    title: '鄉親的期待',
    body: tabs([
      { label: '看期待牆', render: () => wallContent(data) },
      { label: '寫留言', render: () => formContent() },
    ], tab),
  });
}
