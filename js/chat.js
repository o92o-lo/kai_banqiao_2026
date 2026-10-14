// 小賴對話視窗（05、01-spec §5）：常見問題按鈕（不經 AI）＋AI 問答（Apps Script → Gemini）
// 對話只存在記憶體，重新整理就清空；同一裝置每分鐘最多 6 則（後台也會擋）
import { h } from './util.js';
import { openModal } from './modal.js';
import { chat as postChat } from './api.js';

const MAX_CHARS = 300;
const PER_MINUTE = 6;
const HISTORY = 4;
const DOWN_TEXT = '小賴去泡茶了，先看看常見問題吧！';
const THINKING_TEXT = '小賴想一下…';

const state = {
  log: [],        // { kind: 'user'|'lai'|'faq-q'|'faq-a'|'down', text, sources }
  history: [],    // 只放 AI 問答（給後台當上下文）：{ role: 'user'|'assistant', text }
  sentAt: [],     // 送出時間（每分鐘 6 則）
  down: false,    // 這次開啟遇到錯誤 → 只留常見問題
  busy: false,
};

let ui = null;

// actions：出處連結要開的彈窗 { policy(code), profile(), events(), donate(), vote() }
export function openChat(data, actions, onClose) {
  const s = data.settings;
  state.down = s.ai_enabled === '否';
  state.busy = false;

  const face = h('img', { class: 'chat-face', src: 'assets/scene/lai-idle.png', alt: '' });
  const log = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': '對話紀錄' });
  const thinking = h('p', { class: 'msg msg-lai msg-thinking', hidden: true }, THINKING_TEXT);
  const faq = h('div', { class: 'faq-buttons', role: 'group', 'aria-label': '常見問題' },
    (data.faq || []).map((f) => h('button', { type: 'button', class: 'btn', onclick: () => askFaq(f) }, f.q)));

  const input = h('textarea', {
    class: 'chat-input', rows: '2', maxlength: String(MAX_CHARS), 'aria-label': `問${s.assistant_name || '小賴'}問題`,
    placeholder: '輸入想問的問題…',
  });
  const count = h('span', { class: 'chat-count', 'aria-live': 'polite' });
  const send = h('button', { type: 'submit', class: 'btn btn-send' }, '送出');
  const form = h('form', { class: 'chat-form' },
    h('p', { class: 'chat-note' }, '請勿輸入身分證、電話等個人資料。',
      h('a', { class: 'privacy-link', href: 'privacy.html', target: '_blank', rel: 'noopener' }, '隱私權說明')),
    h('div', { class: 'chat-row' }, input, send),
    count);

  ui = { face, log, thinking, input, count, send, form, data, actions };

  const updateCount = () => {
    const n = [...input.value].length;
    count.textContent = `還可以輸入 ${Math.max(0, MAX_CHARS - n)} 字`;
    send.disabled = state.busy || !input.value.trim();
  };
  input.addEventListener('input', updateCount);
  input.addEventListener('keydown', (e) => {
    // Enter 送出、Shift+Enter 換行；中文輸入法選字中（isComposing）不送
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); askAi(input.value); });

  openModal({
    title: `${s.assistant_title || ''} ${s.assistant_name || ''}`.trim(),
    sub: '我是 AI 助理，不是凱勛本人。回答以官方資料為準。',
    icon: 'assets/scene/lai-face.png',
    variant: 'chat',
    body: h('div', { class: 'chat' },
      h('div', { class: 'chat-side', 'aria-hidden': 'true' }, face),
      h('div', { class: 'chat-main' }, faq, log, thinking)),
    foot: form,
    onClose,
  });
  renderLog();
  updateCount();
  setDown(state.down);
}

function setDown(on) {
  state.down = on;
  ui.form.hidden = on;
  if (on && !state.log.some((m) => m.kind === 'down')) {
    state.log.push({ kind: 'down', text: DOWN_TEXT });
    renderLog();
  }
}

function askFaq(f) {
  state.log.push({ kind: 'faq-q', text: f.q }, { kind: 'faq-a', text: f.a, sources: f.source ? [f.source] : [] });
  renderLog();
}

async function askAi(raw) {
  const text = raw.trim();
  if (!text || state.busy || state.down) return;
  const now = Date.now();
  state.sentAt = state.sentAt.filter((t) => now - t < 60000);
  if (state.sentAt.length >= PER_MINUTE) { setDown(true); return; }
  state.sentAt.push(now);

  const history = state.history.slice(-HISTORY);
  state.log.push({ kind: 'user', text });
  ui.input.value = '';
  ui.input.dispatchEvent(new Event('input'));
  renderLog();
  setThinking(true);
  try {
    const r = await postChat(text, history);
    if (!r || r.error || !r.answer) throw new Error((r && r.error) || 'empty');
    state.history.push({ role: 'user', text }, { role: 'assistant', text: r.answer });
    state.log.push({ kind: 'lai', text: r.answer, sources: r.sources || [] });
    renderLog();
  } catch (err) {
    console.info('小賴暫時沒辦法回答：', err.message || err);
    setDown(true);
  } finally {
    setThinking(false);
  }
}

function setThinking(on) {
  state.busy = on;
  if (!ui) return;
  ui.thinking.hidden = !on;
  ui.face.src = on ? 'assets/scene/lai-talk.png' : 'assets/scene/lai-idle.png';
  ui.send.disabled = on || !ui.input.value.trim();
  if (on) ui.thinking.scrollIntoView({ block: 'nearest' });
}

// 出處 → 可以打開的彈窗（有對應才顯示）
function linksFor(sources) {
  const { data, actions } = ui;
  const out = new Map();
  for (const src of sources) {
    if (src.includes('政見')) {
      const p = (data.policies || []).find((x) => src.includes(x.title.split('｜')[0]));
      out.set('policy', h('button', { type: 'button', class: 'src-link', onclick: () => actions.policy(p ? p.code : null) }, '看政見板'));
    } else if (/候選人|經歷|學歷|簡介/.test(src)) {
      out.set('profile', h('button', { type: 'button', class: 'src-link', onclick: actions.profile }, '看候選人資料'));
    } else if (/行程|活動/.test(src)) {
      out.set('events', h('button', { type: 'button', class: 'src-link', onclick: actions.events }, '看活動行程'));
    } else if (/捐款|募款|轉帳/.test(src)) {
      out.set('donate', h('button', { type: 'button', class: 'src-link', onclick: actions.donate }, '看小額捐款'));
    } else if (/投票|號次/.test(src)) {
      out.set('vote', h('button', { type: 'button', class: 'src-link', onclick: actions.vote }, '看投票資訊'));
    }
  }
  return [...out.values()];
}

function renderLog() {
  if (!ui) return;
  ui.log.replaceChildren(...state.log.map((m) => {
    if (m.kind === 'user' || m.kind === 'faq-q') return h('p', { class: 'msg msg-user' }, m.text);
    if (m.kind === 'down') return h('p', { class: 'msg msg-down' }, m.text);
    const sources = m.sources || [];
    const links = m.kind === 'lai' ? linksFor(sources) : [];
    return h('div', { class: 'msg msg-lai' },
      h('p', { class: 'msg-text' }, m.text),
      sources.length ? h('p', { class: 'source' }, `出處：${sources.join('、')}`) : null,
      links.length ? h('p', { class: 'src-links' }, links) : null);
  }));
  const last = ui.log.lastElementChild;
  if (last) last.scrollIntoView({ block: 'nearest' });
}
