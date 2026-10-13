// 政見板：6 個議題；貓咪（pet）、小孩（family）也開這裡。文字原樣顯示 Sheet。
import { h } from '../util.js';
import { openModal } from '../modal.js';

export function policyItems(p) {
  return h('ol', { class: 'policy' }, p.items.map((it) => h('li', {},
    h('p', { class: 'p-head' }, it.head),
    h('p', { class: 'p-body' }, it.body),
  )));
}

// from：'board'＝從政見板點（上一個／下一個）；'pet'／'kid'＝從角色點（看所有政見）
export function openPolicy(data, code, from = 'board') {
  const list = data.policies || [];
  const i = list.findIndex((p) => p.code === code);
  if (i < 0) return openPolicyIndex(data);
  const p = list[i];
  const foot = [];
  if (from === 'board') {
    const prev = list[(i - 1 + list.length) % list.length];
    const next = list[(i + 1) % list.length];
    foot.push(
      h('button', { type: 'button', class: 'btn', onclick: () => openPolicy(data, prev.code) }, '◀ 上一個議題'),
      h('button', { type: 'button', class: 'btn', onclick: () => openPolicy(data, next.code) }, '下一個議題 ▶'),
    );
  } else {
    foot.push(h('button', { type: 'button', class: 'btn', onclick: () => openPolicyIndex(data) }, '看所有政見'));
  }
  openModal({ title: p.title, body: policyItems(p), foot });
}

export function openPolicyIndex(data) {
  openModal({
    title: '理想板橋',
    body: h('ul', { class: 'policy-index' }, (data.policies || []).map((p) => h('li', {},
      h('button', { type: 'button', class: 'btn btn-wide', onclick: () => openPolicy(data, p.code) }, p.title),
    ))),
  });
}
