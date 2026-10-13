// 啟動：載入圖片與資料 → 建場景 → 填文字 → 綁動作
import { bootstrap } from './api.js';
import { initModal } from './modal.js';
import { initScene, getText, getMode, ui, allSpriteUrls, toast, hint, card, flashLabels, addFlower, announce } from './scene.js';
import { storageGet, storageSet, h } from './util.js';
import { openCatalog } from './catalog.js';
import { renderNotes, openBulletin } from './zones/bulletin.js';
import { renderBackdrop, openVote, countdownShort, ballotText } from './zones/backdrop.js';
import { openPolicy, openPolicyIndex } from './zones/policy.js';
import { openProfile, startBubble } from './zones/desk.js';
import { openLai, teaLine } from './zones/teatable.js';
import { sendFlower, blessingCard, flowerCountText } from './zones/flowers.js';
import { openDownloads } from './zones/welcome.js';

const bar = document.querySelector('.loader-bar');

function preload(urls) {
  let done = 0;
  return Promise.all(urls.map((u) => new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      done += 1;
      bar.style.width = `${Math.round((done / urls.length) * 80)}%`;
      resolve();
    };
    img.src = u;
  })));
}

function fillTexts(data) {
  const s = data.settings;
  renderBackdrop(data, getText('backdrop'));
  renderNotes(data, getText('donateNote'), getText('notes'));
  getText('plaque').textContent = '理想板橋';
  getText('station').textContent = '板橋';
  getText('ballot').textContent = ballotText(s);
  getText('flowerSign').textContent = '送花籃祝福凱勛';
  getText('flowerCount').textContent = flowerCountText(data.flowerCount ?? 0);
  ui.topbar.querySelector('.tb-count').textContent = countdownShort(s);
  ui.topbar.querySelector('.tb-ballot').textContent = ballotText(s);
}

function makeHandler(data) {
  return (action, from) => {
    const [name, arg] = action.split(':');
    switch (name) {
      case 'bulletin': return openBulletin(data);
      case 'vote': return openVote(data);
      case 'policyIndex': return openPolicyIndex(data);
      case 'policy': {
        const via = from?.dataset.id === 'cat' ? 'pet' : from?.dataset.id === 'kid' ? 'kid' : 'board';
        return openPolicy(data, arg, via);
      }
      case 'profile': return openProfile(data);
      case 'lai': return openLai(data);
      case 'tea': return toast(teaLine(data, arg), from);
      case 'flower': {
        const r = sendFlower(data);
        if (!r.ok) { announce(`${r.wait} 秒後可以再送一次`); return; }
        if (getMode() === 'desktop') addFlower();
        card(blessingCard(r.blessing));
        announce(r.blessing);
        return;
      }
      case 'downloads': return openDownloads(data);
      case 'catalog': return openCatalog(data);
    }
  };
}

async function start() {
  const [data] = await Promise.all([bootstrap(), preload(allSpriteUrls())]);
  bar.style.width = '100%';
  initModal();
  initScene(makeHandler(data));
  fillTexts(data);
  startBubble(data, ui.bubble);
  document.body.classList.add('ready');
  document.getElementById('loader').remove();

  // 第一次進站：提示 3 秒；手機另外閃現全部標籤
  if (!storageGet('kai.visited')) {
    storageSet('kai.visited', '1');
    hint('點點看房間裡的東西！');
    if (getMode() === 'mobile') flashLabels(3000);
  }
}

start().catch((err) => {
  console.error(err);
  document.getElementById('loader').replaceChildren(h('p', { class: 'load-error' }, '載入失敗，請重新整理頁面。'));
});
