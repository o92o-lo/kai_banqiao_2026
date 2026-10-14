// 場景設定：一張完整背景圖＋透明熱區（D40）。只有資料，沒有邏輯。
// 座標一律是「相對背景圖的百分比」：x、y＝左上角，w、h＝寬高（0–100）。
// 換背景圖：tools/build_assets.py 產生 assets/scene/scene-<名稱>.webp/.jpg，
// 在 SCENES 加一組（可先複製再用 ?debug=1 對位），改 ACTIVE_SCENE 即可。

export const ACTIVE_SCENE = 'p0';

// 可點區。label＝滑鼠移入標籤（01-spec §3.3、附錄 A）；陣列順序＝Tab 順序。
// mobile: true 的才出現在手機版裁切畫面。
export const HOTSPOTS = [
  // D59：布告欄拆兩個熱區（左：小額捐款紅紙、右：近日活動便條）
  { id: 'donate', action: 'bulletin:donate', label: '小額捐款', ariaLabel: '布告欄紅紙：小額捐款', arrow: true },
  { id: 'events', action: 'bulletin:events', label: '最新行程', ariaLabel: '布告欄便條：近日活動' },
  { id: 'backdrop', action: 'vote', label: '投票倒數・投票資訊', ariaLabel: '大背板：投票倒數與投票資訊', arrow: true },
  { id: 'policyboard', action: 'policyboard', label: '看看我的政見', ariaLabel: '政見板：理想板橋，看所有政見', arrow: true, mobile: true },
  { id: 'kai', action: 'profile', label: '候選人資料', ariaLabel: '凱勛：候選人資料', arrow: true, mobile: true },
  { id: 'cat', action: 'cat', label: '擼一下貓', ariaLabel: '貓：擼一下貓（毛孩友善政見）', mobile: true },
  { id: 'lai', action: 'lai', label: '跟小賴聊聊', ariaLabel: '小賴：虛擬服務處助理，常見問題', arrow: true },
  { id: 'cup', action: 'tea:cup', label: '喝杯茶吧', ariaLabel: '茶杯' },
  { id: 'cup2', action: 'tea:cup', label: '喝杯茶吧', ariaLabel: '茶杯' },
  { id: 'snack', action: 'tea:snack', label: '吃些點心', ariaLabel: '點心' }, // D60
  { id: 'kid', action: 'kid', label: '一起玩積木', ariaLabel: '小孩：一起玩積木（親子友善政見）' },
  { id: 'flowers', action: 'flower', label: '送花籃祝福凱勛', ariaLabel: '花籃區：送花籃祝福凱勛', arrow: true },
  { id: 'flyers', action: 'downloads', label: '下載文宣', ariaLabel: '歡迎桌文宣：下載文宣', arrow: true },
  { id: 'numbersign', action: 'vote', label: '投票資訊', ariaLabel: '號次牌：投票資訊' },
  { id: 'sidedesk', action: 'downloads', label: '下載文宣', ariaLabel: '邊桌：下載文宣' },
];

export const SCENES = {
  // P0 風格稿（P0 v2 到之前的暫用版）。P0 裡沒有貓、小孩、板橋版政見板，所以貓和小孩用疊圖補上
  p0: {
    src: 'assets/scene/scene-p0', // .webp＋.jpg
    w: 1920, h: 1072,
    wall: '#C0DDFB', floor: '#F3E6D5',
    hotspots: {
      donate:      { x: 15.0, y: 9.0, w: 6.4, h: 13.6 },
      events:      { x: 21.5, y: 8.8, w: 6.6, h: 15.4 },
      backdrop:    { x: 35.9, y: 7.5, w: 28.2, h: 37.5 },
      policyboard: { x: 72.6, y: 5.1, w: 23.8, h: 25.7 },
      kai:         { x: 74.7, y: 32.2, w: 18.0, h: 37.3 },
      cat:         { x: 82.0, y: 70.5, w: 7.3, h: 8.3 },
      lai:         { x: 51.6, y: 41.5, w: 8.4, h: 16.8 },
      cup:         { x: 39.8, y: 63.3, w: 3.5, h: 5.2 },
      cup2:        { x: 53.2, y: 58.6, w: 3.5, h: 5.0 },
      snack:       { x: 48.4, y: 63.5, w: 5.1, h: 6.0 },
      kid:         { x: 31.6, y: 35.2, w: 8.0, h: 20.2 },
      flowers:     { x: 0.5, y: 22.9, w: 16.9, h: 56.9 },
      flyers:      { x: 3.5, y: 79.0, w: 18.5, h: 10.0 },
      numbersign:  { x: 24.1, y: 85.1, w: 6.4, h: 13.8 },
      sidedesk:    { x: 76.3, y: 85.8, w: 16.4, h: 14.2 },
    },
    // 疊加物
    title:  { x: 36.4, y: 8.0, w: 27.2, h: 6.6 },                    // 背板上方標題（scene_title，D48）
    cover:  { x: 35.9, y: 14.9, w: 28.2, h: 19.2 },                  // 封面照：符合寬度、不裁切（D48）
    banner: { x: 36.1, y: 35.3, w: 27.8, h: 4.4 },                   // 倒數紅布條：拉滿背板寬、文字置中（D56）
    boardInner: { x: 73.7, y: 7.7, w: 21.6, h: 20.66 },              // 政見板畫框內：疊板橋版畫面（D53）
    plaque: { x: 79.6, y: 3.6, w: 9.8, h: 3.2 },                     // 「理想板橋」木牌
    station: { x: 83.2, y: 14.9, w: 2.6, h: 1.6 },                   // 「板橋」小站牌（對到車站）
    nameplate: { x: 77.0, y: 61.3, w: 13.6, h: 6.6 },                // 辦公桌前緣桌牌（nameplate_text，D49）
    ballot: { x: 24.9, y: 86.6, w: 4.3, h: 8.6 },                    // 號次牌牌面
    donateNote: { x: 15.5, y: 10.6, w: 5.8, h: 10.0 },               // 布告欄左半：紅紙「小額捐款」（D51、D59）
    eventNote: { x: 21.9, y: 10.0, w: 5.8, h: 13.4 },                // 布告欄右半：「近日活動」便條（D59）
    flowerSign: { x: 1.0, y: 18.2, w: 12.0, h: 3.6 },                // 「送花籃祝福凱勛」小牌（計數 ≥10 時多一行）
    // 凱勛泡泡：放在不壓政見板的框裡（tail＝尾巴朝哪邊指向凱勛）
    bubbleDesktop: { x: 89.4, y: 31.3, w: 10.3, h: 14.0, tail: 'left' }, // 桌機：凱勛右邊（書櫃上方）
    bubbleMobile: { x: 70.5, y: 31.2, w: 10.3, h: 15.0, tail: 'right' }, // 手機：凱勛左邊的牆面
    kaiFace: { x: 81.0, y: 32.0, w: 8.6, h: 17.5 },                  // 資料卡像素頭像取這塊
    // D63：背景已畫 4 盆，只再疊 2 盆（排在原本那列的右側，不擋窗戶與布告欄）
    flowerSlots: [{ x: 16.5, y: 34, h: 27 }, { x: 12.5, y: 44, h: 27 }],
    blessCard: { x: 25, y: 76 }, // 祝福卡錨點（卡片底邊中點）：花籃區右側地板
    // 疊在場景上的角色圖（P0 沒畫或要換掉的）。talk＝開聊天時換的圖
    overlays: {
      cat: { src: 'assets/scene/cat.png', x: 82.0, y: 70.5, w: 7.3 },
      kid: { src: 'assets/scene/kid.png', x: 31.6, y: 35.2, w: 8.0 }, // D64：背板左側盆栽前、盆栽底部與茶桌左側椅子之間
      // 小賴（D46）：蓋住 P0 原本的小賴，下緣切齊茶桌桌面（y 58.3%）
      lai: { src: 'assets/scene/lai-idle.png', talk: 'assets/scene/lai-talk.png', x: 51.6, y: 41.5, w: 8.4 },
    },
    // 手機版裁切（政見板＋凱勛辦公桌＋貓）
    mobileCrop: { x: 70, y: 0, w: 30, h: 80 },
  },
};

// D58＋D65：拿掉 P0 小賴的背景（assets/raw/p0-scene-nolai.jpg）到了以後用這組：
// 跑 `py -3 tools/build_assets.py scene` → 用 ?debug=1 檢查座標 → 把 ACTIVE_SCENE 改成 'p0nolai'。
// 小賴移到茶桌後方「左邊那張空椅子」：身體在椅背前、桌面後，下緣切齊桌面（y 58.3%），大小不變
SCENES.p0nolai = {
  ...SCENES.p0,
  src: 'assets/scene/scene-p0nolai',
  hotspots: { ...SCENES.p0.hotspots, lai: { x: 40.8, y: 41.5, w: 8.4, h: 16.8 } },
  overlays: { ...SCENES.p0.overlays, lai: { ...SCENES.p0.overlays.lai, x: 40.8, y: 41.5 } },
};

// 政見板放大圖（D43）。熱區＝圖中 6 個元素，座標相對 policyboard 圖
export const POLICY_BOARD = {
  src: 'assets/scene/policyboard', // .webp＋.jpg
  w: 1600, h: 837,
  plaque: { x: 40.6, y: 1.5, w: 18.8, h: 8.2 },
  station: { x: 45.9, y: 43.0, w: 8.2, h: 3.9 },
  // short＝常駐小標籤（D52）
  spots: [
    { code: 'transit', x: 44.0, y: 67.5, w: 15.5, h: 10.0, short: '交通' },
    { code: 'family',  x: 8.0,  y: 70.5, w: 18.5, h: 17.5, short: '親子' },
    { code: 'elder',   x: 16.6, y: 56.0, w: 5.6,  h: 13.5, short: '樂齡' },
    { code: 'pet',     x: 66.6, y: 79.0, w: 6.6,  h: 10.5, short: '毛孩' },
    { code: 'tourism', x: 68.0, y: 44.5, w: 19.0, h: 26.0, short: '觀光' },
    { code: 'housing', x: 50.4, y: 17.0, w: 17.0, h: 27.0, short: '安居' },
  ],
};

// 手機底部工具列（01-spec §3.2）
export const TOOLBAR = [
  { action: 'bulletin', text: '行程・捐款', icon: 'obj-bulletin' },
  { action: 'vote', text: '投票資訊', icon: 'obj-numbersign' },
  { action: 'lai', text: '跟小賴聊', icon: 'lai' },
  { action: 'flower', text: '送花籃', icon: 'obj-flower-a' },
  { action: 'downloads', text: '文宣', icon: 'obj-flyers' },
];

// Sheet「網站設定」沒填時的預設值
export const SETTING_DEFAULTS = {
  cat_greeting: '喵～｜（貓咪蹭了蹭你的手）', // 多句用｜分隔
  kid_greeting: '哈囉！要不要一起玩積木？',
  scene_title: '板橋區市議員參選人 鄧凱勛｜虛擬競選總部',
  nameplate_text: '板橋區市議員參選人 鄧凱勛',
};
