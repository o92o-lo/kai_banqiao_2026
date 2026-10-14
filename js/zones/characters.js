// 貓、小孩（D44）：對話畫面。左邊大頭像、右邊對話框逐字打出台詞，打完出現該議題政見＋「看所有政見」。
import { h, reducedMotion, setting } from '../util.js';
import { openModal } from '../modal.js';
import { policyItems, openPolicyBoard } from './policy.js';

const WHO = {
  cat: { title: '擼一下貓', img: 'assets/scene/cat.png', alt: '打盹的橘白貓', code: 'pet', key: 'cat_greeting' },
  kid: { title: '一起玩積木', img: 'assets/scene/kid.png', alt: '玩積木的小孩', code: 'family', key: 'kid_greeting' },
};

const CHAR_MS = 70;   // 每個字
const LINE_MS = 500;  // 句與句之間

// 台詞：Sheet 網站設定有值就用，沒有用預設；多句用｜分隔
// 貓：附錄 A 規定「喵～」之後接「（貓咪蹭了蹭你的手）」；cat_greeting 只填一句時自動補上
const CAT_ACTION = '（貓咪蹭了蹭你的手）';

export function greetingLines(data, who) {
  const lines = setting(data, WHO[who].key).split('｜').map((t) => t.trim()).filter(Boolean);
  if (who === 'cat' && lines.length === 1) lines.push(CAT_ACTION);
  return lines;
}

export function openTalk(data, who) {
  const w = WHO[who];
  const lines = greetingLines(data, who);
  const policy = (data.policies || []).find((p) => p.code === w.code);

  const speech = h('div', { class: 'talk-speech', 'aria-hidden': 'true' });
  const full = h('p', { class: 'sr-only' }, lines.join(' '));
  const after = h('section', { class: 'talk-policy', hidden: true },
    policy ? [h('h3', {}, policy.title), policyItems(policy)] : null,
    h('button', { type: 'button', class: 'btn', onclick: () => openPolicyBoard(data) }, '看所有政見'));

  let timer = null, done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    speech.replaceChildren(...lines.map((t) => h('p', {}, t)));
    after.hidden = false;
  };
  // 點對話框可以直接看完
  speech.addEventListener('click', finish);

  openModal({
    title: w.title,
    variant: 'talk',
    body: [
      h('div', { class: `talk talk-${who}` },
        h('div', { class: 'talk-face' }, h('img', { src: w.img, alt: w.alt })),
        h('div', { class: 'talk-box' }, speech, full)),
      after,
    ],
  });

  if (reducedMotion()) { finish(); return; }
  // 逐字打出
  let li = 0, ci = 0, p = null;
  const step = () => {
    if (done) return;
    if (li >= lines.length) { finish(); return; }
    if (!p) { p = h('p', {}); speech.append(p); }
    ci += 1;
    p.textContent = [...lines[li]].slice(0, ci).join('');
    if (ci >= [...lines[li]].length) { li += 1; ci = 0; p = null; timer = setTimeout(step, LINE_MS); }
    else timer = setTimeout(step, CHAR_MS);
  };
  timer = setTimeout(step, 250);
}
