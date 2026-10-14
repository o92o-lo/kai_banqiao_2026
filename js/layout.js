// 場景設定：一張完整背景圖＋透明熱區（D40）。只有資料，沒有邏輯。
// 座標一律是「相對背景圖的百分比」：x、y＝左上角，w、h＝寬高（0–100）。
// 換背景圖：tools/build_assets.py 產生 assets/scene/scene-<名稱>.webp/.jpg，
// 在 SCENES 加一組（可先複製再用 ?debug=1 對位），改 ACTIVE_SCENE 即可。

export const ACTIVE_SCENE = 'p0';

// 可點區。label＝滑鼠移入標籤（01-spec §3.3、附錄 A）；陣列順序＝Tab 順序。
// mobile: true 的才出現在手機版裁切畫面。
export const HOTSPOTS = [
  { id: 'bulletin', action: 'bulletin', label: '最新行程・小額捐款', ariaLabel: '布告欄：活動行程與小額捐款', arrow: true },
  { id: 'backdrop', action: 'vote', label: '投票倒數・投票資訊', ariaLabel: '大背板：投票倒數與投票資訊', arrow: true },
  { id: 'policyboard', action: 'policyboard', label: '看看我的政見', ariaLabel: '政見板：理想板橋，看所有政見', arrow: true, mobile: true },
  { id: 'kai', action: 'profile', label: '候選人資料', ariaLabel: '凱勛：候選人資料', arrow: true, mobile: true },
  { id: 'cat', action: 'cat', label: '擼一下貓', ariaLabel: '貓：擼一下貓（毛孩友善政見）', mobile: true },
  { id: 'lai', action: 'lai', label: '跟小賴聊聊', ariaLabel: '小賴：虛擬服務處助理，常見問題', arrow: true },
  { id: 'cup', action: 'tea:cup', label: '喝杯茶吧', ariaLabel: '茶杯' },
  { id: 'cup2', action: 'tea:cup', label: '喝杯茶吧', ariaLabel: '茶杯' },
  { id: 'snack', action: 'tea:snack', label: '喝杯茶吧', ariaLabel: '點心' },
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
      bulletin:    { x: 14.2, y: 6.7, w: 14.4, h: 19.7 },
      backdrop:    { x: 35.9, y: 7.5, w: 28.2, h: 37.5 },
      policyboard: { x: 72.6, y: 5.1, w: 23.8, h: 25.7 },
      kai:         { x: 74.7, y: 32.2, w: 18.0, h: 37.3 },
      cat:         { x: 82.0, y: 70.5, w: 7.3, h: 8.3 },
      lai:         { x: 52.3, y: 41.0, w: 7.1, h: 17.3 },
      cup:         { x: 39.8, y: 63.3, w: 3.5, h: 5.2 },
      cup2:        { x: 53.2, y: 58.6, w: 3.5, h: 5.0 },
      snack:       { x: 48.4, y: 63.5, w: 5.1, h: 6.0 },
      kid:         { x: 68.8, y: 69.0, w: 4.2, h: 10.5 },
      flowers:     { x: 0.5, y: 22.9, w: 16.9, h: 56.9 },
      flyers:      { x: 3.5, y: 79.0, w: 18.5, h: 10.0 },
      numbersign:  { x: 24.1, y: 85.1, w: 6.4, h: 13.8 },
      sidedesk:    { x: 76.3, y: 85.8, w: 16.4, h: 14.2 },
    },
    // 疊加物
    cover:  { x: 35.9, y: 7.5, w: 28.2, h: 35.4, focus: '52% 50%' }, // 背板白色區域
    banner: { x: 37.0, y: 38.4, w: 26.0, h: 4.4 },                   // 倒數紅布條（背板下緣）
    plaque: { x: 79.6, y: 3.6, w: 9.8, h: 3.2 },                     // 「理想板橋」木牌
    station: null,                                                   // P0 的政見板沒有車站；P0 v2 再填
    ballot: { x: 24.9, y: 86.6, w: 4.3, h: 8.6 },                    // 號次牌牌面
    donateNote: { x: 19.8, y: 14.0, w: 2.9, h: 5.1 },                // 布告欄紅便條
    flowerSign: { x: 1.0, y: 18.2, w: 12.0, h: 3.6 },                // 「送花籃祝福凱勛」小牌（計數 ≥10 時多一行）
    bubble: { x: 85.2, y: 31.5 },                                    // 凱勛泡泡的錨點（頭頂）
    kaiFace: { x: 81.0, y: 32.0, w: 8.6, h: 17.5 },                  // 資料卡像素頭像取這塊
    // 新花籃疊放位置（x、y＝左上角；h＝高，寬依圖比例）。最多 6 個
    flowerSlots: [
      { x: 15.5, y: 33, h: 27 }, { x: 12, y: 43, h: 27 }, { x: 19.5, y: 40, h: 27 },
      { x: 8.5, y: 52, h: 27 }, { x: 16, y: 50, h: 27 }, { x: 23, y: 47, h: 27 },
    ],
    // 原圖沒畫的角色用去背圖補上（P0 v2 已畫好就設成 {}）
    overlays: {
      cat: { src: 'assets/scene/cat.png', x: 82.0, y: 70.5, w: 7.3 },
      kid: { src: 'assets/scene/kid.png', x: 68.8, y: 69.0, w: 4.2 },
    },
    // 手機版裁切（政見板＋凱勛辦公桌＋貓）
    mobileCrop: { x: 70, y: 0, w: 30, h: 80 },
  },
};

// 政見板放大圖（D43）。熱區＝圖中 6 個元素，座標相對 policyboard 圖
export const POLICY_BOARD = {
  src: 'assets/scene/policyboard', // .webp＋.jpg
  w: 1600, h: 837,
  plaque: { x: 40.6, y: 1.5, w: 18.8, h: 8.2 },
  station: { x: 45.9, y: 43.0, w: 8.2, h: 3.9 },
  spots: [
    { code: 'transit', x: 44.0, y: 67.5, w: 15.5, h: 10.0 },
    { code: 'family',  x: 8.0,  y: 70.5, w: 18.5, h: 17.5 },
    { code: 'elder',   x: 16.6, y: 56.0, w: 5.6,  h: 13.5 },
    { code: 'pet',     x: 66.6, y: 79.0, w: 6.6,  h: 10.5 },
    { code: 'tourism', x: 68.0, y: 44.5, w: 19.0, h: 26.0 },
    { code: 'housing', x: 50.4, y: 17.0, w: 17.0, h: 27.0 },
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

// 角色對話畫面的預設台詞（Sheet 網站設定 cat_greeting／kid_greeting 沒填時用；多句用｜分隔）
export const GREETING_DEFAULTS = {
  cat: '喵～｜（貓咪蹭了蹭你的手）',
  kid: '哈囉！要不要一起玩積木？',
};
