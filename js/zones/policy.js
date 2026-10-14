// 政見板（D43）：點擊開大彈窗，放大板橋版政見板；圖中 6 個元素是熱區，
// 點了在同一彈窗下半部顯示該議題標題＋3 點政見（原樣顯示 Sheet），可上一個／下一個。
import { h } from '../util.js';
import { openModal } from '../modal.js';
import { POLICY_BOARD } from '../layout.js';
import { pictureEl, DEBUG } from '../scene.js';

export function policyItems(p) {
  return h('ol', { class: 'policy' }, p.items.map((it) => h('li', {},
    h('p', { class: 'p-head' }, it.head),
    h('p', { class: 'p-body' }, it.body),
  )));
}

function pct(el, r) {
  Object.assign(el.style, { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` });
  return el;
}

// code：一打開就顯示哪個議題（不給就顯示議題列表）
export function openPolicyBoard(data, code = null) {
  const list = data.policies || [];
  const byCode = Object.fromEntries(list.map((p) => [p.code, p]));
  const detail = h('section', { class: 'pb-detail', 'aria-live': 'polite' });
  const tip = h('div', { class: 'pb-tip', hidden: true, 'aria-hidden': 'true' });
  const spotEls = {};

  const figure = h('div', { class: 'pb-figure' }, pictureEl(POLICY_BOARD.src, 'pb-img', '理想板橋：板橋地標組成的小鎮圖'));
  figure.style.aspectRatio = `${POLICY_BOARD.w} / ${POLICY_BOARD.h}`;
  if (POLICY_BOARD.plaque) figure.append(pct(h('div', { class: 'pb-plaque', 'aria-hidden': 'true' }, '理想板橋'), POLICY_BOARD.plaque));
  if (POLICY_BOARD.station) figure.append(pct(h('div', { class: 'pb-station', 'aria-hidden': 'true' }, '板橋'), POLICY_BOARD.station));
  for (const s of POLICY_BOARD.spots) {
    const p = byCode[s.code];
    if (!p) continue;
    const btn = pct(h('button', {
      type: 'button', class: 'pb-spot', 'aria-label': p.title, 'aria-controls': 'pb-detail',
      onclick: () => show(s.code),
      onpointerenter: () => showTip(btn, p.title),
      onpointerleave: () => { tip.hidden = true; },
      onfocus: () => showTip(btn, p.title),
      onblur: () => { tip.hidden = true; },
    }, DEBUG ? h('span', { class: 'debug-id' }, s.code) : null), s);
    spotEls[s.code] = btn;
    figure.append(btn);
  }
  figure.append(tip);
  detail.id = 'pb-detail';

  function showTip(btn, text) {
    tip.textContent = text;
    tip.hidden = false;
    tip.style.left = `${parseFloat(btn.style.left) + parseFloat(btn.style.width) / 2}%`;
    tip.style.top = btn.style.top;
  }

  function show(c) {
    const i = list.findIndex((p) => p.code === c);
    if (i < 0) return showIndex();
    const p = list[i];
    const prev = list[(i - 1 + list.length) % list.length];
    const next = list[(i + 1) % list.length];
    Object.entries(spotEls).forEach(([k, el]) => el.classList.toggle('active', k === c));
    detail.replaceChildren(
      h('h3', { class: 'pb-title' }, p.title),
      policyItems(p),
      h('div', { class: 'pb-nav' },
        h('button', { type: 'button', class: 'btn', onclick: () => show(prev.code) }, '◀ 上一個議題'),
        h('button', { type: 'button', class: 'btn', onclick: () => show(next.code) }, '下一個議題 ▶')),
    );
    if (detail.isConnected) detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function showIndex() {
    Object.values(spotEls).forEach((el) => el.classList.remove('active'));
    detail.replaceChildren(h('ul', { class: 'policy-index' }, list.map((p) => h('li', {},
      h('button', { type: 'button', class: 'btn btn-wide', onclick: () => show(p.code) }, p.title)))));
  }

  if (code) show(code); else showIndex();
  openModal({ title: '理想板橋', variant: 'wide', body: [figure, detail] });
  if (code) requestAnimationFrame(() => detail.scrollIntoView({ block: 'nearest' }));
}
