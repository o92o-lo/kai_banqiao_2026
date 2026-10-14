// 彈窗系統：一個 <dialog>，開啟時焦點移入，關閉時回到原物件；Esc、✕、點背景都能關
import { h } from './util.js';

let dialog, titleEl, subEl, bodyEl, footEl, opener = null;

export function initModal() {
  dialog = document.getElementById('modal');
  titleEl = dialog.querySelector('.modal-title');
  subEl = dialog.querySelector('.modal-sub');
  bodyEl = dialog.querySelector('.modal-body');
  footEl = dialog.querySelector('.modal-foot');
  dialog.querySelector('.modal-close').addEventListener('click', () => closeModal());
  // 點對話框外的背景（事件目標是 dialog 本身）就關閉
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeModal(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    const back = opener;
    opener = null;
    if (back && document.contains(back) && back.offsetParent !== null) back.focus();
  });
}

// openModal({ title, sub, body: Node|Node[], foot: Node|Node[] }, openerEl)
// variant：'wide'＝政見板大圖、'talk'＝角色對話
export function openModal({ title, sub = '', body = [], foot = [], variant = '' }, from = document.activeElement) {
  if (!dialog.open) opener = from instanceof HTMLElement ? from : null;
  dialog.className = variant ? `modal-${variant}` : '';
  titleEl.textContent = title;
  subEl.textContent = sub;
  subEl.hidden = !sub;
  bodyEl.replaceChildren(...[body].flat(Infinity).filter(Boolean));
  footEl.replaceChildren(...[foot].flat(Infinity).filter(Boolean));
  footEl.hidden = !footEl.childElementCount;
  bodyEl.scrollTop = 0;
  if (!dialog.open) {
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  // 焦點放在標題，讀屏會先念標題；鍵盤再 Tab 進內容
  titleEl.focus();
}

export function closeModal() {
  if (dialog.open) dialog.close();
}

// 分頁元件（布告欄用）
export function tabs(list, initial = 0) {
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const panel = h('div', { class: 'tab-panel', role: 'tabpanel' });
  const buttons = list.map((t, i) => h('button', {
    type: 'button', role: 'tab', class: 'tab', id: `tab-${i}`,
    onclick: () => select(i),
    onkeydown: (e) => {
      if (e.key === 'ArrowRight') { select((i + 1) % list.length); buttons[(i + 1) % list.length].focus(); }
      if (e.key === 'ArrowLeft') { select((i - 1 + list.length) % list.length); buttons[(i - 1 + list.length) % list.length].focus(); }
    },
  }, t.label));
  function select(i) {
    buttons.forEach((b, j) => {
      b.setAttribute('aria-selected', String(i === j));
      b.tabIndex = i === j ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${i}`);
    panel.replaceChildren(...[list[i].render()].flat(Infinity).filter(Boolean));
  }
  bar.append(...buttons);
  select(initial);
  return [bar, panel];
}
