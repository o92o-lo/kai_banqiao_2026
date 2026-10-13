// 場景：依 layout.js 建物件、縮放、版面切換（只換座標不重載）、滑鼠移入標籤、HUD 浮動文字
import { SPRITES, OBJECTS, LAYOUTS, FLOWER_SLOTS, FLOWER_SPRITES, TOOLBAR } from './layout.js';
import { h, reducedMotion } from './util.js';

const SPRITE_DIR = 'assets/sprites/';

let scene, hud, tag, onAction;
let mode = null;
let scale = 1, origin = { x: 0, y: 0 };
const objEls = {};          // id → button
const textEls = {};         // name → element（notes 是陣列）
const decorEls = { desktop: [], mobile: [] };
let flowerCount = 3;
let suppressClick = false;

export const ui = {};       // HUD 元素，給 main 用：bubble、topbar 欄位等

export function spriteUrl(name) {
  return `${SPRITE_DIR}${name}.png`;
}

export function allSpriteUrls() {
  return Object.keys(SPRITES).map(spriteUrl);
}

// 一個 sprite＝一個 span，背景圖；多格的用 background-position 切換
function spriteEl(name, extraClass = '') {
  const s = SPRITES[name];
  const el = h('span', { class: `sprite ${s.anim ? `anim-${s.anim}` : ''} ${extraClass}`.trim(), 'aria-hidden': 'true' });
  el.style.backgroundImage = `url(${spriteUrl(name)})`;
  el.dataset.sprite = name;
  return el;
}

// left/top 已是場景座標（px）；k 只放大圖本身
function sizeSprite(el, left, top, k) {
  const s = SPRITES[el.dataset.sprite];
  const f = s.frames || 1;
  Object.assign(el.style, {
    left: `${left}px`, top: `${top}px`,
    width: `${s.w * k}px`, height: `${s.h * k}px`,
    backgroundSize: `${s.w * f * k}px ${s.h * k}px`,
  });
  el.style.setProperty('--sw', `${s.w * k}px`);
}

function place(el, r) {
  Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
}

function buildObjects() {
  for (const [id, def] of Object.entries(OBJECTS)) {
    const btn = h('button', {
      type: 'button',
      class: `obj obj-${id}${def.policy ? ' obj-icon' : ''}`,
      'aria-label': def.ariaLabel || def.label,
      'data-id': id,
    });
    btn._parts = def.parts.map((p) => {
      const sp = spriteEl(p.sprite);
      btn.append(sp);
      return { el: sp, ...p };
    });
    if (def.arrow) btn.append(h('span', { class: 'arrow', 'aria-hidden': 'true' }));
    if (def.zzz) btn.append(h('span', { class: 'zzz', 'aria-hidden': 'true' }, 'Z', h('span', {}, 'z'), h('span', {}, 'z')));

    btn.addEventListener('click', (e) => {
      if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
      hideTag();
      onAction(def.action, btn);
    });
    btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showTag(btn); });
    btn.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hideTag(); });
    btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) showTag(btn); });
    btn.addEventListener('blur', hideTag);
    addLongPress(btn);
    objEls[id] = btn;
  }
  // 花籃區：花籃是動態加的
  objEls.flowers._flowers = h('span', { class: 'flower-set', 'aria-hidden': 'true' });
  objEls.flowers.prepend(objEls.flowers._flowers);
  // Tab 順序＝OBJECTS 順序
  scene.append(...Object.values(objEls));
}

// 手機：長按顯示標籤
function addLongPress(btn) {
  let timer = null;
  btn.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    timer = setTimeout(() => { suppressClick = true; showTag(btn); }, 500);
  });
  const clear = () => {
    clearTimeout(timer);
    if (suppressClick) setTimeout(hideTag, 1500);
  };
  btn.addEventListener('pointerup', clear);
  btn.addEventListener('pointercancel', clear);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

function buildTexts() {
  const t = (name, cls) => (textEls[name] = h('div', { class: `stext ${cls}`, 'aria-hidden': 'true' }));
  t('backdrop', 'st-backdrop');
  t('donateNote', 'st-donate');
  textEls.notes = [0, 1, 2].map(() => h('div', { class: 'stext st-note', 'aria-hidden': 'true' }));
  t('plaque', 'st-plaque');
  t('station', 'st-station');
  t('ballot', 'st-ballot');
  t('flowerSign', 'st-flowersign');
  t('flowerCount', 'st-flowercount');
  for (const [name, el] of Object.entries(textEls)) {
    if (name === 'notes') scene.append(...el);
    else scene.append(el);
  }
}

function buildDecor() {
  for (const m of ['desktop', 'mobile']) {
    for (const d of LAYOUTS[m].decor) {
      const el = spriteEl(d.sprite, 'decor');
      el._pos = d;
      decorEls[m].push(el);
      scene.prepend(el);
    }
  }
  ui.bg = spriteEl('bg-desktop', 'bg');
  scene.prepend(ui.bg);
}

function buildHud() {
  tag = h('div', { class: 'tag', role: 'tooltip', hidden: true });
  ui.bubble = h('div', { class: 'bubble', hidden: true, 'aria-live': 'off' }, h('p', { class: 'bubble-text' }));
  ui.catalogBtn = h('button', { type: 'button', class: 'hud-btn catalog-btn', onclick: (e) => onAction('catalog', e.currentTarget) },
    h('span', { class: 'ico-menu', 'aria-hidden': 'true' }), '目錄');
  ui.topbar = h('div', { class: 'topbar' },
    h('p', { class: 'tb-count' }), h('p', { class: 'tb-ballot' }));
  ui.toolbar = h('nav', { class: 'toolbar', 'aria-label': '功能' }, TOOLBAR.map((b) => h('button', {
    type: 'button', class: 'tool', onclick: (e) => onAction(b.action, e.currentTarget),
  }, b.icon ? h('span', { class: 'tool-ico lai-face', 'aria-hidden': 'true' }) : h('span', { class: `tool-ico ico-${b.action}`, 'aria-hidden': 'true' }), h('span', {}, b.text))));
  ui.live = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  hud.append(ui.bubble, ui.topbar, ui.toolbar, ui.catalogBtn, tag, ui.live);
}

export function initScene(handler) {
  onAction = handler;
  scene = document.getElementById('scene');
  hud = document.getElementById('hud');
  buildDecor();
  buildObjects();
  buildTexts();
  buildHud();
  renderFlowers(flowerCount);
  layout();
  window.addEventListener('resize', layout);
  window.visualViewport?.addEventListener('resize', layout);
}

export function getText(name) { return textEls[name]; }
export function getMode() { return mode; }

function layout() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const next = vw / vh >= 1 ? 'desktop' : 'mobile';
  if (next !== mode) applyMode(next);
  const L = LAYOUTS[mode];
  let s = Math.min(vw / L.w, vh / L.h);
  if (s >= 3) s = Math.floor(s); // 3 倍以上取整數，像素銳利
  scale = s;
  origin = { x: Math.round((vw - L.w * s) / 2), y: Math.round((vh - L.h * s) / 2) };
  Object.assign(scene.style, {
    width: `${L.w}px`, height: `${L.h}px`,
    transform: `translate(${origin.x}px, ${origin.y}px) scale(${s})`,
  });
  document.documentElement.style.setProperty('--s', s);
  positionHud();
}

function applyMode(m) {
  mode = m;
  const L = LAYOUTS[m];
  const k = L.k;
  document.body.dataset.layout = m;
  scene.style.setProperty('--k', k);
  hideTag();

  sizeSprite(ui.bg, L.bg.x, L.bg.y, k);

  for (const mm of ['desktop', 'mobile']) {
    for (const el of decorEls[mm]) {
      el.hidden = mm !== m;
      if (mm === m) sizeSprite(el, el._pos.x, el._pos.y, k);
    }
  }

  for (const [id, btn] of Object.entries(objEls)) {
    const pos = L.objects[id];
    btn.hidden = !pos;
    if (!pos) continue;
    const def = OBJECTS[id];
    btn._rect = { x: pos.x, y: pos.y, w: def.w * k, h: def.h * k };
    place(btn, btn._rect);
    for (const p of btn._parts) sizeSprite(p.el, p.x * k, p.y * k, k);
  }
  if (!objEls.flowers.hidden) renderFlowers(flowerCount);

  for (const [name, el] of Object.entries(textEls)) {
    const els = name === 'notes' ? el : [el];
    const rects = L.texts[name];
    els.forEach((e, i) => {
      const r = Array.isArray(rects) ? rects[i] : rects;
      e.hidden = !r;
      if (r) place(e, r);
    });
  }
}

// HUD（不縮放的那層）：標籤、泡泡、目錄鈕、手機上下列
function toScreen(x, y) {
  return { x: origin.x + x * scale, y: origin.y + y * scale };
}

function positionHud() {
  const L = LAYOUTS[mode];
  const W = L.w * scale, H = L.h * scale;
  const mobile = mode === 'mobile';
  ui.topbar.hidden = !mobile;
  ui.toolbar.hidden = !mobile;
  if (mobile) {
    Object.assign(ui.topbar.style, { left: `${origin.x}px`, top: `${origin.y}px`, width: `${W}px`, height: `${L.topbar * scale}px` });
    Object.assign(ui.toolbar.style, { left: `${origin.x}px`, top: `${origin.y + (L.h - L.toolbar) * scale}px`, width: `${W}px`, height: `${L.toolbar * scale}px` });
    const barH = L.topbar * scale;
    Object.assign(ui.catalogBtn.style, { left: '', right: `${window.innerWidth - origin.x - W + 4}px`, top: `${origin.y + (barH - Math.max(barH - 4, 28)) / 2}px`, height: `${Math.max(barH - 4, 28)}px` });
  } else {
    Object.assign(ui.catalogBtn.style, { left: '', right: `${window.innerWidth - origin.x - W + 8}px`, top: `${origin.y + 8}px`, height: '' });
  }
  positionBubble();
  if (!tag.hidden && tag._for) showTag(tag._for);
}

function positionBubble() {
  const desk = objEls.desk;
  if (!desk || desk.hidden) return;
  const kai = desk._parts[0];
  const k = LAYOUTS[mode].k;
  const r = desk._rect;
  const cx = r.x + (kai.x + SPRITES['char-kai'].w / 2) * k;
  const p = toScreen(cx, r.y + kai.y * k);
  const maxW = Math.min(mode === 'mobile' ? LAYOUTS[mode].w * scale - 24 : 280, window.innerWidth - 16);
  ui.bubble.style.maxWidth = `${maxW}px`;
  ui.bubble.style.left = `${p.x}px`;
  ui.bubble.style.top = `${p.y - 4}px`;
  clampX(ui.bubble, p.x);
}

// 讓浮動框不超出畫面左右（以中心點 cx 為準）
function clampX(el, cx) {
  const w = el.offsetWidth;
  const min = 8 + w / 2, max = window.innerWidth - 8 - w / 2;
  el.style.left = `${Math.max(min, Math.min(max, cx))}px`;
}

function objScreenTop(btn) {
  const r = btn._rect;
  return toScreen(r.x + r.w / 2, r.y);
}

function showTag(btn) {
  const def = OBJECTS[btn.dataset.id];
  tag.textContent = def.label;
  tag.hidden = false;
  tag._for = btn;
  const p = objScreenTop(btn);
  tag.style.top = `${Math.max(4, p.y - 6)}px`;
  clampX(tag, p.x);
}

function hideTag() {
  tag.hidden = true;
  tag._for = null;
}

// 手機第一次進站：全部標籤閃現（政見圖示除外，避免 6 個一樣的字擠在一起）
export function flashLabels(ms = 3000) {
  const tags = Object.values(objEls)
    .filter((b) => !b.hidden && !b.classList.contains('obj-icon'))
    .map((b) => {
      const t = h('div', { class: 'tag tag-flash', 'aria-hidden': 'true' }, OBJECTS[b.dataset.id].label);
      hud.append(t);
      const p = objScreenTop(b);
      t.style.top = `${Math.max(4, p.y - 6)}px`;
      clampX(t, p.x);
      return t;
    });
  setTimeout(() => tags.forEach((t) => t.remove()), ms);
}

// 物件旁的短暫文字（茶杯、點心）
export function toast(text, btn, ms = 2500) {
  if (!text) return;
  const t = h('div', { class: 'toast' }, text);
  hud.append(t);
  const p = objScreenTop(btn);
  t.style.top = `${Math.max(4, p.y - 6)}px`;
  clampX(t, p.x);
  ui.live.textContent = text;
  setTimeout(() => t.remove(), ms);
}

// 置中提示（第一次進站）；at＝'top'|'bottom'
export function hint(text, ms = 3000) {
  const t = h('div', { class: 'hint' }, text);
  hud.append(t);
  const L = LAYOUTS[mode];
  const y = mode === 'mobile' ? (L.h - L.toolbar - 40) * scale : L.h * 0.42 * scale;
  t.style.top = `${origin.y + y}px`;
  clampX(t, origin.x + (L.w * scale) / 2);
  setTimeout(() => t.remove(), ms);
}

// 祝福卡：桌機在花籃區上方，手機從底部工具列上方彈出
export function card(node, ms = 3200) {
  const L = LAYOUTS[mode];
  const c = h('div', { class: `bless-card${mode === 'mobile' ? ' from-bottom' : ''}`, role: 'status' }, node);
  hud.append(c);
  if (mode === 'mobile') {
    c.style.top = `${origin.y + (L.h - L.toolbar - 8) * scale}px`;
    clampX(c, origin.x + (L.w * scale) / 2);
  } else {
    const p = objScreenTop(objEls.flowers);
    c.style.top = `${p.y}px`;
    clampX(c, p.x + 20 * scale);
  }
  setTimeout(() => c.remove(), ms);
}

export function renderFlowers(n, animateLast = false) {
  flowerCount = Math.min(n, FLOWER_SLOTS.length);
  const set = objEls.flowers._flowers;
  const k = LAYOUTS[mode || 'desktop'].k;
  set.replaceChildren();
  for (let i = 0; i < flowerCount; i++) {
    const el = spriteEl(FLOWER_SPRITES[i % FLOWER_SPRITES.length], animateLast && i === flowerCount - 1 && !reducedMotion() ? 'pop' : '');
    sizeSprite(el, FLOWER_SLOTS[i].x * k, FLOWER_SLOTS[i].y * k, k);
    set.append(el);
  }
}

export function addFlower() {
  if (flowerCount < FLOWER_SLOTS.length) renderFlowers(flowerCount + 1, true);
}

export function announce(text) {
  ui.live.textContent = text;
}
