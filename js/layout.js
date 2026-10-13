// 桌機／手機兩組座標。只有資料，沒有邏輯。
// 單位＝邏輯像素。k＝放大倍數（手機版 2 倍）。
// sprite 尺寸由 tools/pixelize.py 產生（見 assets/raw/qa/sprite-sizes.json）。

export const SPRITES = {
  'bg-desktop':      { w: 480, h: 270 },
  'obj-bulletin':    { w: 96, h: 60 },
  'obj-backdrop':    { w: 148, h: 72 },
  'obj-policyboard': { w: 128, h: 67 },
  'icon-transit':    { w: 32, h: 27 },
  'icon-family':     { w: 32, h: 30 },
  'icon-elder':      { w: 23, h: 32 },
  'icon-pet':        { w: 32, h: 28 },
  'icon-tourism':    { w: 32, h: 30 },
  'icon-housing':    { w: 29, h: 32 },
  'obj-desk':        { w: 65, h: 48 },
  'char-kai':        { w: 33, h: 48, frames: 2, anim: 'blink' },
  'obj-teatable':    { w: 95, h: 64 },
  'obj-cup':         { w: 9, h: 12 },
  'obj-snack':       { w: 14, h: 12 },
  'char-lai':        { w: 36, h: 41, frames: 2, anim: 'talk' },
  'obj-flower-a':    { w: 25, h: 48 },
  'obj-flower-b':    { w: 22, h: 48 },
  'obj-flower-c':    { w: 22, h: 48 },
  'obj-welcome':     { w: 63, h: 44 },
  'obj-flyers':      { w: 14, h: 12 },
  'obj-numbersign':  { w: 25, h: 36 },
  'char-cat':        { w: 28, h: 17, frames: 2, anim: 'breathe' },
  'char-kid':        { w: 21, h: 28, frames: 2, anim: 'play' },
  'obj-sidedesk':    { w: 47, h: 40 },
};

// 可點物件。label＝滑鼠移入標籤（01-spec §3.3），ariaLabel 給讀屏。
// parts：由哪些 sprite 組成（相對座標）；w/h：可點範圍。
// 陣列順序＝Tab 順序。
export const OBJECTS = {
  bulletin:    { action: 'bulletin', label: '最新行程・小額捐款', ariaLabel: '布告欄：活動行程與小額捐款', w: 96, h: 60, parts: [{ sprite: 'obj-bulletin', x: 0, y: 0 }], arrow: true },
  backdrop:    { action: 'vote', label: '投票倒數・投票資訊', ariaLabel: '大背板：投票倒數與投票資訊', w: 148, h: 72, parts: [{ sprite: 'obj-backdrop', x: 0, y: 0 }], arrow: true },
  policyboard: { action: 'policyIndex', label: '看看我的政見', ariaLabel: '政見板：理想板橋，看所有政見', w: 128, h: 67, parts: [{ sprite: 'obj-policyboard', x: 0, y: 0 }], arrow: true },
  'icon-elder':   { action: 'policy:elder', label: '看看我的政見', policy: 'elder', w: 23, h: 32, parts: [{ sprite: 'icon-elder', x: 0, y: 0 }] },
  'icon-housing': { action: 'policy:housing', label: '看看我的政見', policy: 'housing', w: 29, h: 32, parts: [{ sprite: 'icon-housing', x: 0, y: 0 }] },
  'icon-tourism': { action: 'policy:tourism', label: '看看我的政見', policy: 'tourism', w: 32, h: 30, parts: [{ sprite: 'icon-tourism', x: 0, y: 0 }] },
  'icon-family':  { action: 'policy:family', label: '看看我的政見', policy: 'family', w: 32, h: 30, parts: [{ sprite: 'icon-family', x: 0, y: 0 }] },
  'icon-transit': { action: 'policy:transit', label: '看看我的政見', policy: 'transit', w: 32, h: 27, parts: [{ sprite: 'icon-transit', x: 0, y: 0 }] },
  'icon-pet':     { action: 'policy:pet', label: '看看我的政見', policy: 'pet', w: 32, h: 28, parts: [{ sprite: 'icon-pet', x: 0, y: 0 }] },
  desk:        { action: 'profile', label: '候選人資料', ariaLabel: '凱勛辦公桌：候選人資料', w: 65, h: 84, parts: [{ sprite: 'char-kai', x: 16, y: 0 }, { sprite: 'obj-desk', x: 0, y: 36 }], arrow: true },
  cat:         { action: 'policy:pet', label: '毛孩友善政見', ariaLabel: '打盹的貓：毛孩友善政見', w: 28, h: 17, parts: [{ sprite: 'char-cat', x: 0, y: 0 }], zzz: true },
  lai:         { action: 'lai', label: '跟小賴聊聊', ariaLabel: '小賴：虛擬服務處助理，常見問題', w: 36, h: 41, parts: [{ sprite: 'char-lai', x: 0, y: 0 }], arrow: true },
  cup:         { action: 'tea:cup', label: '喝杯茶吧', ariaLabel: '茶杯', w: 16, h: 16, parts: [{ sprite: 'obj-cup', x: 3, y: 2 }] },
  snack:       { action: 'tea:snack', label: '喝杯茶吧', ariaLabel: '點心', w: 16, h: 16, parts: [{ sprite: 'obj-snack', x: 1, y: 2 }] },
  kid:         { action: 'policy:family', label: '親子友善政見', ariaLabel: '玩積木的小孩：親子友善政見', w: 21, h: 28, parts: [{ sprite: 'char-kid', x: 0, y: 0 }] },
  flowers:     { action: 'flower', label: '送花籃祝福凱勛', ariaLabel: '花籃區：送花籃祝福凱勛', w: 117, h: 84, parts: [], arrow: true },
  flyers:      { action: 'downloads', label: '下載文宣', ariaLabel: '文宣：下載文宣', w: 16, h: 16, parts: [{ sprite: 'obj-flyers', x: 1, y: 2 }], arrow: true },
  numbersign:  { action: 'vote', label: '投票資訊', ariaLabel: '號次牌：投票資訊', w: 25, h: 36, parts: [{ sprite: 'obj-numbersign', x: 0, y: 0 }] },
  sidedesk:    { action: 'downloads', label: '下載文宣', ariaLabel: '邊桌：下載文宣', w: 47, h: 40, parts: [{ sprite: 'obj-sidedesk', x: 0, y: 0 }] },
};

// 花籃位置（相對花籃區）；一開始放 3 個，送一次多一個，最多 5 個
export const FLOWER_SLOTS = [
  { x: 4, y: 4 }, { x: 26, y: 12 }, { x: 48, y: 20 }, { x: 70, y: 28 }, { x: 92, y: 36 },
];
export const FLOWER_SPRITES = ['obj-flower-a', 'obj-flower-b', 'obj-flower-c'];

export const LAYOUTS = {
  desktop: {
    w: 480, h: 270, k: 1,
    bg: { sprite: 'bg-desktop', x: 0, y: 0 },
    decor: [
      { sprite: 'obj-teatable', x: 192, y: 138 },
      { sprite: 'obj-welcome', x: 14, y: 214 },
    ],
    objects: {
      bulletin: { x: 52, y: 14 },
      backdrop: { x: 166, y: 34 },
      policyboard: { x: 344, y: 12 },
      'icon-elder': { x: 354, y: 16 },
      'icon-housing': { x: 397, y: 15 },
      'icon-tourism': { x: 437, y: 17 },
      'icon-family': { x: 351, y: 46 },
      'icon-transit': { x: 395, y: 49 },
      'icon-pet': { x: 437, y: 48 },
      desk: { x: 390, y: 92 },
      cat: { x: 404, y: 180 },
      lai: { x: 221, y: 118 },
      cup: { x: 207, y: 160 },
      snack: { x: 253, y: 162 },
      kid: { x: 298, y: 190 },
      flowers: { x: 8, y: 104 },
      flyers: { x: 23, y: 210 },
      numbersign: { x: 86, y: 222 },
      sidedesk: { x: 424, y: 224 },
    },
    // HTML 文字疊在圖上（01-spec §2.4）
    texts: {
      backdrop: { x: 184, y: 38, w: 112, h: 62 },
      donateNote: { x: 60, y: 19, w: 25, h: 33 },
      notes: [{ x: 109, y: 21, w: 14, h: 15 }, { x: 92, y: 44, w: 14, h: 14 }, { x: 119, y: 41, w: 15, h: 13 }],
      plaque: { x: 386, y: 9, w: 44, h: 10 },
      station: { x: 382, y: 40, w: 14, h: 8 },
      ballot: { x: 88, y: 225, w: 21, h: 19 },
      flowerSign: { x: 24, y: 94, w: 54, h: 10 },
      flowerCount: { x: 4, y: 190, w: 110, h: 8 },
    },
  },
  mobile: {
    w: 270, h: 480, k: 2,
    // P1 局部特寫：取背景右半邊（避開窗戶）放大 2 倍
    bg: { sprite: 'bg-desktop', x: -670, y: 0 },
    decor: [],
    objects: {
      policyboard: { x: 7, y: 28 },
      'icon-elder': { x: 27, y: 36 },
      'icon-housing': { x: 113, y: 34 },
      'icon-tourism': { x: 193, y: 38 },
      'icon-family': { x: 21, y: 96 },
      'icon-transit': { x: 109, y: 102 },
      'icon-pet': { x: 193, y: 100 },
      desk: { x: 70, y: 226 },
      cat: { x: 196, y: 392 },
    },
    texts: {
      plaque: { x: 91, y: 22, w: 88, h: 20 },
      station: { x: 83, y: 84, w: 28, h: 16 },
    },
    topbar: 22,
    toolbar: 48,
  },
};

// 手機底部工具列（01-spec §3.2）
export const TOOLBAR = [
  { action: 'bulletin', text: '行程・捐款' },
  { action: 'vote', text: '投票資訊' },
  { action: 'lai', text: '跟小賴聊', icon: 'char-lai' },
  { action: 'flower', text: '送花籃' },
  { action: 'downloads', text: '文宣' },
];
