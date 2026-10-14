// 啟動：用現有資料立刻顯示場景 → 背景向後台要最新資料，回來就無聲更新（D54）
import { initialData, refreshData } from './api.js';
import { initModal } from './modal.js';
import { initScene, SCENE, getText, getMode, ui, toast, hint, card, flashLabels, addFlower, announce, positionBubble, setLaiTalking } from './scene.js';
import { storageGet, storageSet, h, setting } from './util.js';
import { openCatalog } from './catalog.js';
import { renderDonateNote, openBulletin } from './zones/bulletin.js';
import { renderBanner, openVote, countdownShort, ballotText } from './zones/backdrop.js';
import { openPolicyBoard } from './zones/policy.js';
import { openProfile, startBubble, renderNameplate } from './zones/desk.js';
import { openLai, teaLine } from './zones/teatable.js';
import { openTalk } from './zones/characters.js';
import { sendFlower, canSend, TOO_FAST, blessingCard, renderFlowerSign } from './zones/flowers.js';
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
  if (getText('title')) getText('title').textContent = setting(data, 'scene_title');
  renderNameplate(getText('nameplate'), setting(data, 'nameplate_text'));
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
  let sent = 0; // 這次瀏覽送出的盆數：款式 a→b→c 輪流
  return async (action, from) => {
    const [name, arg] = action.split(':');
    switch (name) {
      case 'bulletin': return openBulletin(data);
      case 'vote': return openVote(data);
      case 'policyboard': return openPolicyBoard(data);
      case 'profile': return openProfile(data);
      case 'cat': return openTalk(data, 'cat');
      case 'kid': return openTalk(data, 'kid');
      case 'lai':
        setLaiTalking(true);
        return openLai(data, () => setLaiTalking(false));
      case 'tea': return toast(teaLine(data, arg), from);
      case 'flower': {
        if (!canSend()) { card(blessingCard(TOO_FAST)); announce(TOO_FAST); return; }
        const variant = 'abc'[sent % 3];
        sent += 1;
        if (getMode() === 'desktop') addFlower();
        const r = await sendFlower(data, variant);
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
  const [data] = await Promise.all([initialData(), loadScene()]);
  bar.style.width = '100%';
  initModal();
  initScene(makeHandler(data));
  fillTexts(data);
  const refreshBubble = startBubble(data, ui.bubble, positionBubble);

  // 背景更新：同一個 data 物件原地換內容，按鈕、彈窗之後讀到的都是新的
  refreshData().then((fresh) => {
    if (!fresh) return;
    for (const k of Object.keys(data)) delete data[k];
    Object.assign(data, fresh);
    fillTexts(data);
    refreshBubble();
  });
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
