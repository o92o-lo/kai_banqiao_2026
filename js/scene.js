// 場景：一張背景圖＋透明熱區（D40）。桌機顯示整張；手機裁切政見板＋辦公桌＋貓，上下用牆色／地板色補滿（D45）。
// 熱區與疊加物都用百分比放在 #world 裡，跟著圖一起縮放。HUD（標籤、泡泡）在不縮放的另一層。
import { ACTIVE_SCENE, SCENES, HOTSPOTS, TOOLBAR } from './layout.js';
import { h, reducedMotion } from './util.js';

export const SCENE = SCENES[ACTIVE_SCENE];
export const DEBUG = new URLSearchParams(location.search).get('debug') === '1';

const TOPBAR = 44;   // 手機頂部細條高（px）
const TOOLBAR_H = 68; // 手機底部工具列高（px）
const MAX_FLOWERS = 2; // D63：背景圖已畫 4 盆，畫面總數最多 6 盆

let stage, clip, world, hud, tag, onAction;
let mode = null;
let worldRect = { x: 0, y: 0, w: 1, h: 1 };
const spots = {};      // id → button
const texts = {};      // name → 疊加文字元素
const overlayEls = {}; // id → 補上的角色圖
let flowerLayer, flowerCount = 0;
let suppressClick = false;

export const ui = {};  // HUD 元素：bubble、topbar、toolbar、catalogBtn、live

function pct(el, r) {
  el.style.left = `${r.x}%`;
  el.style.top = `${r.y}%`;
  if (r.w != null) el.style.width = `${r.w}%`;
  if (r.h != null) el.style.height = `${r.h}%`;
  return el;
}

export function pictureEl(src, cls, alt = '') {
  return h('picture', { class: cls },
    h('source', { type: 'image/webp', srcset: `${src}.webp` }),
    h('img', { src: `${src}.jpg`, alt, draggable: 'false', decoding: 'async' }));
}

function buildWorld() {
  world.append(pictureEl(SCENE.src, 'scene-img'));

  // 政見板畫框內換成板橋版畫面（D53）
  if (SCENE.boardInner) world.append(pct(pictureEl('assets/scene/board-inner', 'ov ov-boardInner'), SCENE.boardInner));
  // 背板封面照：符合寬度、不裁切（D48）
  if (SCENE.cover) {
    world.append(pct(h('div', { class: 'ov ov-cover', 'aria-hidden': 'true' },
      h('img', { src: 'assets/cover-kai.jpg', alt: '', draggable: 'false' })), SCENE.cover));
  }
  for (const name of ['title', 'banner', 'plaque', 'station', 'nameplate', 'ballot', 'donateNote', 'eventNote', 'flowerSign']) {
    if (!SCENE[name]) continue;
    texts[name] = pct(h('div', { class: `ov ov-text ov-${name}`, 'aria-hidden': 'true' }), SCENE[name]);
    world.append(texts[name]);
  }
  for (const [id, o] of Object.entries(SCENE.overlays || {})) {
    overlayEls[id] = pct(h('img', { class: `ov ov-char ov-${id}`, src: o.src, alt: '', draggable: 'false' }), { x: o.x, y: o.y, w: o.w });
    if (o.talk) new Image().src = o.talk; // 先載好說話格
    world.append(overlayEls[id]);
  }
  flowerLayer = h('div', { class: 'ov ov-flowers', 'aria-hidden': 'true' });
  world.append(flowerLayer);

  for (const def of HOTSPOTS) {
    const r = SCENE.hotspots[def.id];
    if (!r) continue;
    const btn = pct(h('button', {
      type: 'button', class: `hot hot-${def.id}`, 'aria-label': def.ariaLabel || def.label, 'data-id': def.id,
    }, def.arrow ? h('span', { class: 'arrow', 'aria-hidden': 'true' }) : null,
       DEBUG ? h('span', { class: 'debug-id' }, def.id) : null), r);
    btn._def = def;
    btn.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      hideTag();
      onAction(def.action, btn);
    });
    btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showTag(btn); });
    btn.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hideTag(); });
    btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) showTag(btn); });
    btn.addEventListener('blur', hideTag);
    addLongPress(btn);
    spots[def.id] = btn;
    world.append(btn);
  }
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

function toolIcon(icon) {
  if (icon === 'lai') return h('span', { class: 'tool-ico lai-face', 'aria-hidden': 'true' });
  const el = h('span', { class: 'tool-ico', 'aria-hidden': 'true' });
  el.style.backgroundImage = `url(assets/sprites/${icon}.png)`;
  return el;
}

function buildHud() {
  tag = h('div', { class: 'tag', role: 'tooltip', hidden: true });
  ui.bubble = h('div', { class: 'bubble', hidden: true }, h('p', { class: 'bubble-text' }));
  ui.catalogBtn = h('button', { type: 'button', class: 'hud-btn catalog-btn', onclick: (e) => onAction('catalog', e.currentTarget) },
    h('span', { class: 'ico-menu', 'aria-hidden': 'true' }), '目錄');
  ui.topbar = h('div', { class: 'topbar' }, h('p', { class: 'tb-count' }), h('p', { class: 'tb-ballot' }));
  ui.toolbar = h('nav', { class: 'toolbar', 'aria-label': '功能' }, TOOLBAR.map((b) => h('button', {
    type: 'button', class: 'tool', onclick: (e) => onAction(b.action, e.currentTarget),
  }, toolIcon(b.icon), h('span', {}, b.text))));
  ui.live = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  hud.append(ui.bubble, ui.topbar, ui.toolbar, ui.catalogBtn, tag, ui.live);
  if (DEBUG) {
    ui.debug = h('div', { class: 'debug-readout' }, '?debug=1');
    hud.append(ui.debug);
    window.addEventListener('pointermove', (e) => {
      const x = ((e.clientX - worldRect.x) / worldRect.w) * 100;
      const y = ((e.clientY - worldRect.y) / worldRect.h) * 100;
      ui.debug.textContent = `x ${x.toFixed(1)}%  y ${y.toFixed(1)}%`;
    });
  }
}

export function initScene(handler) {
  onAction = handler;
  stage = document.getElementById('stage');
  clip = document.getElementById('clip');
  world = document.getElementById('world');
  hud = document.getElementById('hud');
  document.body.classList.toggle('debug', DEBUG);
  buildWorld();
  buildHud();
  layout();
  window.addEventListener('resize', layout);
}

export function getText(name) { return texts[name] || null; }
export function getMode() { return mode; }

function layout() {
  const vw = window.innerWidth, vh = window.innerHeight;
  mode = vw / vh >= 1 ? 'desktop' : 'mobile';
  document.body.dataset.layout = mode;
  const mobile = mode === 'mobile';
  const crop = mobile ? SCENE.mobileCrop : { x: 0, y: 0, w: 100, h: 100 };
  const area = mobile ? { y: TOPBAR, w: vw, h: vh - TOPBAR - TOOLBAR_H } : { y: 0, w: vw, h: vh };

  const cw = (crop.w / 100) * SCENE.w, ch = (crop.h / 100) * SCENE.h;
  const s = Math.min(area.w / cw, area.h / ch);
  const box = { w: Math.round(cw * s), h: Math.round(ch * s) };
  box.x = Math.round((vw - box.w) / 2);
  box.y = Math.round(area.y + (area.h - box.h) / 2);
  Object.assign(clip.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });

  const W = SCENE.w * s, H = SCENE.h * s;
  const wx = -(crop.x / 100) * W, wy = -(crop.y / 100) * H;
  Object.assign(world.style, { width: `${W}px`, height: `${H}px`, left: `${wx}px`, top: `${wy}px` });
  world.style.setProperty('--u', `${W / 100}px`);
  worldRect = { x: box.x + wx, y: box.y + wy, w: W, h: H };

  // 上下補色：裁切框中線以上牆色、以下地板色（D45：不能有黑帶）
  const mid = box.y + box.h / 2;
  stage.style.background = `linear-gradient(to bottom, ${SCENE.wall} ${mid}px, ${SCENE.floor} ${mid}px)`;

  for (const [id, btn] of Object.entries(spots)) {
    btn.hidden = mobile && !btn._def.mobile;
    if (overlayEls[id]) overlayEls[id].hidden = btn.hidden;
  }
  ui.topbar.hidden = !mobile;
  ui.toolbar.hidden = !mobile;
  hideTag();
  positionBubble();
}

// 背景圖百分比座標 → 螢幕 px
function toScreen(xPct, yPct) {
  return { x: worldRect.x + (xPct / 100) * worldRect.w, y: worldRect.y + (yPct / 100) * worldRect.h };
}

function positionBubble() {
  const b = ui.bubble;
  const box = mode === 'mobile' ? SCENE.bubbleMobile : SCENE.bubbleDesktop;
  b.classList.toggle('bubble-side', !!box);
  b.classList.toggle('tail-left', !!box && box.tail === 'left');
  if (box) {
    // 放在不壓政見板的框裡；字放不下就縮
    const p = toScreen(box.x, box.y);
    const w = (box.w / 100) * worldRect.w, hgt = (box.h / 100) * worldRect.h;
    Object.assign(b.style, { left: `${p.x}px`, top: `${p.y}px`, width: `${w}px`, maxWidth: '', maxHeight: `${hgt}px`, fontSize: '' });
    for (let fs = 14; fs >= 11 && b.scrollHeight > hgt + 1; fs -= 1) b.style.fontSize = `${fs}px`;
    return;
  }
  Object.assign(b.style, { width: '', maxHeight: '', fontSize: '' });
  if (!SCENE.bubble) return;
  const p = toScreen(SCENE.bubble.x, SCENE.bubble.y);
  const maxW = Math.min(mode === 'mobile' ? window.innerWidth - 24 : 320, window.innerWidth - 16);
  ui.bubble.style.maxWidth = `${maxW}px`;
  ui.bubble.style.top = `${p.y - 6}px`;
  clampX(ui.bubble, p.x);
}

// 浮動框不超出畫面左右（cx＝中心點）
function clampX(el, cx) {
  const w = el.offsetWidth;
  const min = 8 + w / 2, max = window.innerWidth - 8 - w / 2;
  el.style.left = `${Math.max(min, Math.min(max, cx))}px`;
}

function spotTop(btn) {
  const r = btn.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top };
}

function placeAbove(el, btn) {
  const p = spotTop(btn);
  el.style.top = `${Math.max(mode === 'mobile' ? TOPBAR + 4 : 4, p.y - 8)}px`;
  clampX(el, p.x);
}

function showTag(btn) {
  tag.textContent = btn._def.label;
  tag.hidden = false;
  placeAbove(tag, btn);
}

function hideTag() { tag.hidden = true; }

// 手機第一次進站：可見熱區的標籤全部閃現
export function flashLabels(ms = 3000) {
  const tags = Object.values(spots).filter((b) => !b.hidden).map((b) => {
    const t = h('div', { class: 'tag tag-flash', 'aria-hidden': 'true' }, b._def.label);
    hud.append(t);
    placeAbove(t, b);
    return t;
  });
  setTimeout(() => tags.forEach((t) => t.remove()), ms);
}

// 物件旁的短暫文字（茶杯、點心）
export function toast(text, btn, ms = 2500) {
  if (!text) return;
  const t = h('div', { class: 'toast' }, text);
  hud.append(t);
  placeAbove(t, btn);
  ui.live.textContent = text;
  setTimeout(() => t.remove(), ms);
}

export function hint(text, ms = 3000) {
  const t = h('div', { class: 'hint' }, text);
  hud.append(t);
  const y = mode === 'mobile' ? window.innerHeight - TOOLBAR_H - 64 : worldRect.y + worldRect.h * 0.5;
  t.style.top = `${y}px`;
  clampX(t, window.innerWidth / 2);
  setTimeout(() => t.remove(), ms);
}

// 祝福卡（D62）：畫面上永遠只有一張。已經有卡就換字、重新計時；太快的提示也用同一張
// 桌機在花籃區右側地板（不壓布告欄、背板、政見板），手機在工具列上方
let blessCard = null, blessTimer = null;
export function card(node, ms = 3000) {
  if (!blessCard) {
    blessCard = h('div', { class: 'bless-card', role: 'status' });
    hud.append(blessCard);
  }
  const c = blessCard;
  c.replaceChildren(node);
  c.classList.toggle('from-bottom', mode === 'mobile');
  // 重新播放出現動畫
  c.style.animation = 'none';
  void c.offsetWidth;
  c.style.animation = '';
  if (mode === 'mobile') {
    c.style.top = `${window.innerHeight - TOOLBAR_H - 12}px`;
    clampX(c, window.innerWidth / 2);
  } else {
    const a = SCENE.blessCard || { x: 24, y: 74 };
    const p = toScreen(a.x, a.y);
    c.style.top = `${p.y}px`;
    clampX(c, p.x);
  }
  clearTimeout(blessTimer);
  blessTimer = setTimeout(() => { c.remove(); blessCard = null; }, ms);
}

// 送花籃：在花籃區旁疊一個新花籃（最多 6 個）
// 款式依序 a→b→c，第 4 盆起重新輪（D50）
export function addFlower() {
  const slots = SCENE.flowerSlots || [];
  if (flowerCount >= Math.min(MAX_FLOWERS, slots.length)) return;
  const v = 'abc'[flowerCount % 3];
  const slot = slots[flowerCount];
  const img = h('img', { class: `ov-flower${reducedMotion() ? '' : ' pop'}`, src: `assets/scene/flower-${v}.png`, alt: '', draggable: 'false' });
  Object.assign(img.style, { left: `${slot.x}%`, top: `${slot.y}%`, height: `${slot.h}%` });
  flowerLayer.append(img);
  flowerCount += 1;
}

export function announce(text) { ui.live.textContent = text; }

// 小賴：開聊天時換說話格（D46）
export function setLaiTalking(on) {
  const o = SCENE.overlays && SCENE.overlays.lai;
  if (o && overlayEls.lai) overlayEls.lai.src = on && o.talk ? o.talk : o.src;
}

export { positionBubble };
