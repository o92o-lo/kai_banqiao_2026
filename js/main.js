// 啟動：載入背景圖與資料 → 建場景 → 填疊加文字 → 綁動作
import { bootstrap } from './api.js';
import { initModal } from './modal.js';
import { initScene, SCENE, getText, getMode, ui, toast, hint, card, flashLabels, addFlower, announce, positionBubble } from './scene.js';
import { storageGet, storageSet, h } from './util.js';
import { openCatalog } from './catalog.js';
import { renderDonateNote, openBulletin } from './zones/bulletin.js';
import { renderBanner, openVote, countdownShort, ballotText } from './zones/backdrop.js';
import { openPolicyBoard } from './zones/policy.js';
import { openProfile, startBubble } from './zones/desk.js';
import { openLai, teaLine } from './zones/teatable.js';
import { openTalk } from './zones/characters.js';
import { sendFlower, cooldownLeft, blessingCard, renderFlowerSign } from './zones/flowers.js';
import { openDownloads } from './zones/welcome.js';

const bar = document.querySelector('.loader-bar');

// 等背景圖（瀏覽器會挑 webp 或 jpg）載完再顯示
function loadScene() {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const webp = document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
    img.onload = img.onerror = resolve;
    img.src = `${SCENE.src}.${webp ? 'webp' : 'jpg'}`;
    bar.style.width = '40%';
  });
}

function fillTexts(data) {
  const s = data.settings;
  renderBanner(data, getText('banner'));
  renderDonateNote(getText('donateNote'));
  if (getText('plaque')) getText('plaque').textContent = '理想板橋';
  if (getText('station')) getText('station').textContent = '板橋';
  if (getText('ballot')) getText('ballot').textContent = ballotText(s);
  renderFlowerSign(getText('flowerSign'), data.flowerCount ?? 0);
  ui.topbar.querySelector('.tb-count').textContent = countdownShort(s);
  ui.topbar.querySelector('.tb-ballot').textContent = ballotText(s);
}

function makeHandler(data) {
  let sending = false;
  return async (action, from) => {
    const [name, arg] = action.split(':');
    switch (name) {
      case 'bulletin': return openBulletin(data);
      case 'vote': return openVote(data);
      case 'policyboard': return openPolicyBoard(data);
      case 'profile': return openProfile(data);
      case 'cat': return openTalk(data, 'cat');
      case 'kid': return openTalk(data, 'kid');
      case 'lai': return openLai(data);
      case 'tea': return toast(teaLine(data, arg), from);
      case 'flower': {
        const wait = cooldownLeft(data);
        if (wait || sending) { announce(`${wait || 1} 秒後可以再送一次`); return; }
        sending = true;
        if (getMode() === 'desktop') addFlower(null);
        const r = await sendFlower(data);
        sending = false;
        card(blessingCard(r.blessing));
        announce(r.blessing);
        if (r.count != null) {
          data.flowerCount = r.count;
          renderFlowerSign(getText('flowerSign'), r.count);
        }
        return;
      }
      case 'downloads': return openDownloads(data);
      case 'catalog': return openCatalog(data);
    }
  };
}

async function start() {
  const [data] = await Promise.all([bootstrap(), loadScene()]);
  bar.style.width = '100%';
  initModal();
  initScene(makeHandler(data));
  fillTexts(data);
  startBubble(data, ui.bubble, positionBubble);
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
