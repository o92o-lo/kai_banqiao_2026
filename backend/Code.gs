/** @OnlyCurrentDoc */
/**
 * 鄧凱勛虛擬競選總部｜網站後台 Apps Script
 * 規格：docs/06-backend-sheet.md §3.2；部署步驟：docs/deploy-apps-script.md
 *
 * GET  ?action=bootstrap            網站開啟時讀一次（快取 60 秒）
 * POST {"action":"flower","client","variant"} 送花籃，寫一列到「花籃紀錄」（同 client 10 秒最多 3 盆）
 * POST {"action":"chat",...}        Sprint 3 才開放，目前回 {"error":"disabled"}
 *
 * 這份檔案不含任何金鑰。Gemini 金鑰只放「專案設定 → 指令碼屬性」GEMINI_API_KEY（Sprint 3 用）。
 */

var TZ = 'Asia/Taipei';
var CACHE_SECONDS = 60;
var FLOWER_CLIENT_WINDOW_MS = 10000; // D50：同一 client 10 秒內
var FLOWER_CLIENT_MAX = 3;           //       最多 3 盆
var FLOWER_SITE_PER_MINUTE = 120; // 全站每分鐘上限
var POLICY_ORDER = ['transit', 'family', 'elder', 'pet', 'tourism', 'housing'];

// ───── 進入點 ─────

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'bootstrap') return json_(bootstrap_());
    return json_({ error: 'unknown_action' });
  } catch (err) {
    console.error(err);
    return json_({ error: 'server' });
  }
}

function doPost(e) {
  try {
    var body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return json_({ error: 'bad_request' }); }
    if (body.action === 'flower') return json_(flower_(body));
    if (body.action === 'chat') return json_({ error: 'disabled' }); // Sprint 3
    return json_({ error: 'unknown_action' });
  } catch (err) {
    console.error(err);
    return json_({ error: 'server' });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ───── bootstrap ─────

function bootstrap_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('bootstrap');
  if (hit) return JSON.parse(hit);
  var data = buildBootstrap_();
  try { cache.put('bootstrap', JSON.stringify(data), CACHE_SECONDS); } catch (x) { /* 超過 100KB 就不快取 */ }
  return data;
}

function buildBootstrap_() {
  var ss = SpreadsheetApp.getActive();
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

  // 網站設定：以 key 讀取，不靠列順序；全部轉成字串（含 cat_greeting、kid_greeting、vote_reminder 等新 key）
  var settings = {};
  rows_(ss, '網站設定').forEach(function (r) {
    var k = str_(r['key']);
    if (k) settings[k] = str_(r['value']);
  });

  var events = rows_(ss, '活動行程')
    .filter(function (r) { return yes_(r['顯示']); })
    .map(function (r) {
      return {
        date: dateStr_(r['日期']), start: timeStr_(r['開始時間']), end: timeStr_(r['結束時間']),
        title: str_(r['標題']), place: str_(r['地點']), desc: str_(r['說明']), url: str_(r['連結'])
      };
    })
    .filter(function (e) { return e.date && e.date >= today; })
    .sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });

  var lines = rows_(ss, '泡泡台詞').filter(enabled_).map(function (r) { return str_(r['台詞']); }).filter(Boolean);

  var blessings = rows_(ss, '祝福語').filter(enabled_)
    .map(function (r) { return { id: num_(r['編號']), text: str_(r['祝福語']) }; })
    .filter(function (b) { return b.text; });

  var tea = { cup: [], snack: [] };
  rows_(ss, '茶點文字').filter(enabled_).forEach(function (r) {
    var t = str_(r['文字']);
    if (!t) return;
    var kind = str_(r['類型']);
    if (kind === '茶杯') tea.cup.push(t);
    else if (kind === '點心') tea.snack.push(t);
  });

  var faq = rows_(ss, '常見問題').filter(enabled_)
    .sort(function (a, b) { return num_(a['排序']) - num_(b['排序']); })
    .map(function (r) { return { q: str_(r['問題']), a: str_(r['回答']), source: str_(r['出處']) }; })
    .filter(function (f) { return f.q && f.a; });

  // 政見：依議題代號分組，點次排序；文字原樣
  var byCode = {};
  rows_(ss, '政見').filter(enabled_).forEach(function (r) {
    var code = str_(r['議題代號']);
    if (!code) return;
    if (!byCode[code]) byCode[code] = { code: code, title: str_(r['議題標題']), items: [] };
    byCode[code].items.push({ n: num_(r['點次']), head: str_(r['小標']), body: str_(r['內文']) });
  });
  var codes = Object.keys(byCode).sort(function (a, b) {
    var ia = POLICY_ORDER.indexOf(a), ib = POLICY_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  var policies = codes.map(function (c) {
    var p = byCode[c];
    p.items.sort(function (a, b) { return a.n - b.n; });
    return p;
  });

  // 候選人資料：education_N → education[]、quote_N → quotes[]，其他 key 原樣（含 photo_url）
  var profile = { education: [], quotes: [] };
  var edu = [], quotes = [];
  rows_(ss, '候選人資料').forEach(function (r) {
    var k = str_(r['key']), v = str_(r['value']);
    if (!k || !v) return;
    var m;
    if ((m = /^education_(\d+)$/.exec(k))) edu.push([+m[1], v]);
    else if ((m = /^quote_(\d+)$/.exec(k))) quotes.push([+m[1], v]);
    else profile[k] = v;
  });
  var byN = function (a, b) { return a[0] - b[0]; };
  profile.education = edu.sort(byN).map(function (x) { return x[1]; });
  profile.quotes = quotes.sort(byN).map(function (x) { return x[1]; });

  var career = rows_(ss, '經歷').filter(enabled_)
    .sort(function (a, b) { return num_(a['排序']) - num_(b['排序']); })
    .map(function (r) { return { year: str_(r['年份']), text: str_(r['經歷']) }; })
    .filter(function (c) { return c.text; });

  var downloads = rows_(ss, '文宣下載').filter(enabled_)
    .map(function (r) { return { title: str_(r['標題']), desc: str_(r['說明']), url: str_(r['檔案連結']) }; })
    .filter(function (d) { return d.title && d.url; });

  return {
    settings: settings, events: events, lines: lines, blessings: blessings, tea: tea, faq: faq,
    policies: policies, profile: profile, career: career, downloads: downloads,
    flowerCount: flowerCount_(ss),
    updatedAt: Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
}

// ───── flower ─────

function flower_(body) {
  var client = str_(body.client).slice(0, 64);
  if (!client) return { error: 'bad_request' };

  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { error: 'busy' };
  try {
    // 同一 client 10 秒內最多 3 盆（D50）
    var ckey = 'fc:' + client;
    var now = Date.now();
    var recent = [];
    try { recent = JSON.parse(cache.get(ckey) || '[]'); } catch (x) { recent = []; }
    recent = recent.filter(function (t) { return now - t < FLOWER_CLIENT_WINDOW_MS; });
    if (recent.length >= FLOWER_CLIENT_MAX) return { error: 'too_fast' };
    // 全站每分鐘上限
    var mkey = 'fm:' + Math.floor(Date.now() / 60000);
    var n = Number(cache.get(mkey) || 0);
    if (n >= FLOWER_SITE_PER_MINUTE) return { error: 'busy' };

    var ss = SpreadsheetApp.getActive();
    var list = rows_(ss, '祝福語').filter(enabled_)
      .map(function (r) { return { id: num_(r['編號']), text: str_(r['祝福語']) }; })
      .filter(function (b) { return b.text; });
    if (!list.length) return { error: 'no_blessing' };
    var b = list[Math.floor(Math.random() * list.length)];
    // 款式由網站依序給 a→b→c；沒給或不對就隨機
    var variant = /^[abc]$/.test(str_(body.variant)) ? str_(body.variant) : ['a', 'b', 'c'][Math.floor(Math.random() * 3)];

    var sheet = ss.getSheetByName('花籃紀錄');
    sheet.appendRow([new Date(), b.id, variant]);
    SpreadsheetApp.flush();

    recent.push(now);
    cache.put(ckey, JSON.stringify(recent), Math.ceil(FLOWER_CLIENT_WINDOW_MS / 1000));
    cache.put(mkey, String(n + 1), 120);
    return { blessing: b.text, variant: variant, count: flowerCount_(ss) };
  } finally {
    lock.releaseLock();
  }
}

function flowerCount_(ss) {
  var sheet = ss.getSheetByName('花籃紀錄');
  return sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
}

// ───── 小工具 ─────

// 讀整張分頁，第一列當欄名，回傳物件陣列；略過整列空白
function rows_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var head = values[0].map(function (h) { return String(h).trim(); });
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.every(function (v) { return v === '' || v === null; })) continue;
    var o = {};
    head.forEach(function (h, j) { if (h) o[h] = row[j]; });
    out.push(o);
  }
  return out;
}

function str_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return dateStr_(v);
  return String(v).trim();
}

function num_(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function yes_(v) { return str_(v) === '是'; }
function enabled_(r) { return yes_(r['啟用']); }

// 試算表可能把日期、時間存成 Date 物件
function dateStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v || '').trim();
}

function timeStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'HH:mm');
  return String(v || '').trim();
}

// 手動測試用：在 Apps Script 編輯器選這個函式按「執行」，看執行紀錄
function testBootstrap() {
  CacheService.getScriptCache().remove('bootstrap');
  var d = buildBootstrap_();
  console.log(JSON.stringify(d).slice(0, 2000));
  console.log('政見議題數：' + d.policies.length + '，花籃數：' + d.flowerCount);
}
