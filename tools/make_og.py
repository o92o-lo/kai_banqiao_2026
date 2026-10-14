"""分享預覽圖 assets/og-image.jpg（1200×630，< 300KB）。D73

背景圖本身沒有小賴、封面照、標題（那些是網站疊上去的），所以直接用瀏覽器把網站畫出來再裁：
1920×1080 開網站、藏起箭頭／泡泡／目錄鈕等浮動元素，裁畫面中間（大背板、茶桌、小賴、凱勛辦公桌）。

用法（先在專案根目錄開本機伺服器：py -3 -m http.server 8123）：
    py -3 tools/make_og.py
    py -3 tools/make_og.py --url https://o92o-lo.github.io/kai_banqiao_2026/
"""
import argparse
import io
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "og-image.jpg"
# 裁切範圍（相對背景圖的百分比，1200:630 比例）：從大背板左緣到凱勛辦公桌右緣
CROP = {"x": 29.0, "y": 3.2, "w": 67.0}
LIMIT = 300 * 1024


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:8123/")
    args = ap.parse_args()
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge")
        pg = b.new_page(viewport={"width": 1920, "height": 1080})
        pg.add_init_script("try{localStorage.setItem('kai.visited','1')}catch(e){}")
        pg.goto(args.url)
        pg.wait_for_selector("body.ready")
        pg.add_style_tag(content="#hud, .arrow { display: none !important; }")
        pg.wait_for_timeout(1500)
        world = pg.evaluate("(() => { const r = document.getElementById('world').getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; })()")
        png = pg.screenshot()
        b.close()
    shot = Image.open(io.BytesIO(png)).convert("RGB")
    x = world["x"] + world["w"] * CROP["x"] / 100
    y = world["y"] + world["h"] * CROP["y"] / 100
    w = world["w"] * CROP["w"] / 100
    h = w * 630 / 1200
    img = shot.crop((round(x), round(y), round(x + w), round(y + h))).resize((1200, 630), Image.LANCZOS)
    for q in range(90, 49, -5):
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        if buf.tell() <= LIMIT:
            OUT.write_bytes(buf.getvalue())
            print(f"og-image.jpg：1200×630，品質 {q}，{buf.tell() // 1024}KB")
            return
    raise SystemExit("壓不到 300KB")


if __name__ == "__main__":
    main()
