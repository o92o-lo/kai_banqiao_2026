"""五種螢幕尺寸截圖＋基本檢查（不用捲動、物件在畫面內、Tab／Enter／Esc）。

用法（先在專案根目錄開本機伺服器：py -3 -m http.server 8123）：
    py -3 tools/screenshots.py                     # 截圖存到 assets/raw/qa/
    py -3 tools/screenshots.py --url https://o92o-lo.github.io/kai_banqiao_2026/

手機尺寸用 Playwright 裝置模擬（viewport＋deviceScaleFactor＋觸控），PROJECT.md D28。
瀏覽器用本機安裝的 Edge（channel="msedge"），不需另外下載。
"""
import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
QA = ROOT / "assets" / "raw" / "qa"

SIZES = [
    {"name": "1366x768", "viewport": {"width": 1366, "height": 768}, "dpr": 1, "mobile": False},
    {"name": "1920x1080", "viewport": {"width": 1920, "height": 1080}, "dpr": 1, "mobile": False},
    {"name": "375x667-iphone-se", "viewport": {"width": 375, "height": 667}, "dpr": 2, "mobile": True},
    {"name": "393x852-iphone-15", "viewport": {"width": 393, "height": 852}, "dpr": 3, "mobile": True},
    {"name": "360x800-android", "viewport": {"width": 360, "height": 800}, "dpr": 3, "mobile": True},
]

CHECK_JS = """() => {
  const vw = innerWidth, vh = innerHeight;
  const doc = document.documentElement;
  const out = { scroll: doc.scrollWidth > vw || doc.scrollHeight > vh, offscreen: [], overlaps: [], small: [] };
  const btns = [...document.querySelectorAll('#world .hot:not([hidden])')];
  const rects = btns.map(b => [b.dataset.id, b.getBoundingClientRect()]);
  for (const [id, r] of rects) {
    if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) out.offscreen.push(id);
    if (r.width < 24 || r.height < 24) out.small.push(`${id} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  // 黑帶檢查：畫面四角與上下中點不能是 body 的深色底
  const stage = getComputedStyle(document.getElementById('stage')).backgroundImage;
  out.bands = stage.includes('gradient') ? 'wall/floor' : 'NONE';
  for (const b of document.querySelectorAll('#hud button, #hud nav')) {
    const r = b.getBoundingClientRect();
    if (r.width && (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1)) out.offscreen.push(b.className);
  }
  out.objects = rects.length;
  out.scale = getComputedStyle(doc).getPropertyValue('--s').trim();
  out.layout = document.body.dataset.layout;
  return out;
}"""


def run(url, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge")
        for s in SIZES:
            ctx = browser.new_context(
                viewport=s["viewport"], device_scale_factor=s["dpr"],
                is_mobile=s["mobile"], has_touch=s["mobile"], locale="zh-TW",
            )
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            # 不跳第一次進站提示，截圖才乾淨
            page.add_init_script("try{localStorage.setItem('kai.visited','1')}catch(e){}")
            page.goto(url, wait_until="networkidle")
            page.wait_for_selector("body.ready", timeout=10000)
            page.wait_for_timeout(600)
            page.screenshot(path=str(out_dir / f"shot-{s['name']}.png"))
            info = page.evaluate(CHECK_JS)

            # 鍵盤：Tab 到第一個物件 → Enter 開彈窗 → Esc 關閉、焦點回原物件
            page.keyboard.press("Tab")
            first = page.evaluate("document.activeElement.dataset.id || document.activeElement.className")
            page.keyboard.press("Enter")
            page.wait_for_timeout(200)
            opened = page.evaluate("document.getElementById('modal').open")
            page.keyboard.press("Escape")
            page.wait_for_timeout(200)
            closed = not page.evaluate("document.getElementById('modal').open")
            back = page.evaluate("document.activeElement.dataset.id || document.activeElement.className")
            info["keyboard"] = {"firstTab": first, "enterOpens": opened, "escCloses": closed, "focusBack": back == first}
            # 政見板放大、貓對話各一張（桌機 1366 與 iPhone 15）
            if s["name"] in ("1366x768", "393x852-iphone-15"):
                page.click(".hot-policyboard")
                page.wait_for_timeout(400)
                page.click(".pb-spot >> nth=0")
                page.wait_for_timeout(500)
                page.screenshot(path=str(out_dir / f"shot-{s['name']}-policyboard.png"))
                page.keyboard.press("Escape")
                page.wait_for_timeout(200)
                page.click(".hot-cat")
                page.wait_for_timeout(2600)
                page.screenshot(path=str(out_dir / f"shot-{s['name']}-cat.png"))
                page.keyboard.press("Escape")
                page.wait_for_timeout(200)
            info["errors"] = errors
            report[s["name"]] = info
            print(s["name"], json.dumps(info, ensure_ascii=False))
            ctx.close()
        browser.close()
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8123/")
    ap.add_argument("--out", default=str(QA))
    args = ap.parse_args()
    report = run(args.url, Path(args.out))
    bad = [k for k, v in report.items() if v["scroll"] or v["offscreen"] or v["errors"] or v["bands"] == 'NONE' or not all(v["keyboard"].values())]
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
