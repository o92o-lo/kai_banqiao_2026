"""網站用圖：把 assets/raw/、sources/ 的原圖壓成網站要的尺寸（D40：正常平滑縮放，不再像素化）。

用法：
    py -3 tools/build_assets.py            # 全部
    py -3 tools/build_assets.py scene      # 只做某一項（scene/policyboard/cover/photo/flowers/chars）

輸出：
    assets/scene/scene-<名稱>.webp/.jpg   場景大圖，寬 1920，各 ≤ 400KB
    assets/scene/policyboard.webp/.jpg    政見板放大圖
    assets/scene/flower-a|b|c.png         去背花籃（送花籃時疊上去）
    assets/scene/cat.png、kid.png          去背大頭像（對話畫面、舊場景補位）
    assets/cover-kai.jpg                  背板封面照
    assets/photo-kai.jpg                  資料卡真人照（寬 ≤ 480、≤ 200KB）
"""
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets" / "scene"

# 場景來源：有 P0 v2 就用它，否則先用 P0（名稱要和 js/layout.js 的 SCENES 對應）
SCENE_SOURCES = [("p0v2", RAW / "p0v2-scene.jpg"), ("p0", RAW / "p0-keyframe.jpg")]

KB = 1024


def save_under(img, path, fmt, limit, q_start=86, q_min=50, **kw):
    """逐步降品質直到檔案 ≤ limit。"""
    for q in range(q_start, q_min - 1, -4):
        buf = io.BytesIO()
        img.save(buf, fmt, quality=q, **kw)
        if buf.tell() <= limit:
            path.write_bytes(buf.getvalue())
            return q, buf.tell()
    raise SystemExit(f"{path.name} 降到品質 {q_min} 還是超過 {limit // KB}KB")


def resize_w(img, w):
    if img.width <= w:
        return img
    return img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)


def key_green(img):
    """柔邊去綠底：g 比 max(r,b) 高越多越透明；植物的綠（約 +70）保留。再把邊緣綠光壓掉。"""
    a = np.asarray(img.convert("RGB")).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dom = g - np.maximum(r, b)
    alpha = np.clip((150 - dom) / (150 - 95), 0, 1)
    # 去綠光：半透明與貼邊像素的 g 不超過 max(r,b)+一點
    spill = alpha < 1
    g2 = np.where(spill, np.minimum(g, np.maximum(r, b) + 10), g)
    out = np.dstack([r, g2, b, (alpha * 255).round()]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out)


def crop_alpha(img, pad=4, min_count=6):
    a = np.asarray(img)[..., 3] > 128
    rows = np.where(a.sum(axis=1) >= min_count)[0]
    cols = np.where(a.sum(axis=0) >= min_count)[0]
    box = (max(cols[0] - pad, 0), max(rows[0] - pad, 0),
           min(cols[-1] + 1 + pad, img.width), min(rows[-1] + 1 + pad, img.height))
    return img.crop(box)


def save_png(img, path):
    # 256 色量化（含 alpha）讓 PNG 變小
    q = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    q.save(path, optimize=True)
    return path.stat().st_size


def build_scene():
    for name, src in SCENE_SOURCES:
        if not src.exists():
            continue
        img = resize_w(Image.open(src).convert("RGB"), 1920)
        qw, sw = save_under(img, OUT / f"scene-{name}.webp", "WEBP", 400 * KB, method=6)
        qj, sj = save_under(img, OUT / f"scene-{name}.jpg", "JPEG", 400 * KB, optimize=True, progressive=True)
        print(f"scene-{name}: {img.size}  webp q{qw} {sw // KB}KB  jpg q{qj} {sj // KB}KB")
        return name
    raise SystemExit("找不到場景原圖")


def build_policyboard():
    src = Image.open(RAW / "obj-policyboard-alt.jpg")
    img = crop_alpha(key_green(src), pad=0).convert("RGB")
    img = resize_w(img, 1600)
    qw, sw = save_under(img, OUT / "policyboard.webp", "WEBP", 400 * KB, method=6)
    qj, sj = save_under(img, OUT / "policyboard.jpg", "JPEG", 400 * KB, optimize=True, progressive=True)
    print(f"policyboard: {img.size}  webp {sw // KB}KB  jpg {sj // KB}KB")


def build_cover():
    img = resize_w(Image.open(RAW / "cover-kai.png").convert("RGB"), 1400)
    q, s = save_under(img, ROOT / "assets" / "cover-kai.jpg", "JPEG", 200 * KB, optimize=True, progressive=True)
    print(f"cover-kai: {img.size}  q{q} {s // KB}KB")


def build_photo():
    img = resize_w(Image.open(ROOT / "sources" / "photos" / "kai-03-white-shirt-main.png").convert("RGB"), 480)
    q, s = save_under(img, ROOT / "assets" / "photo-kai.jpg", "JPEG", 200 * KB, q_start=90, optimize=True, progressive=True)
    print(f"photo-kai: {img.size}  q{q} {s // KB}KB")


def build_flowers():
    for v in "abc":
        img = crop_alpha(key_green(Image.open(RAW / f"obj-flower-{v}.jpg")))
        img = img.resize((round(img.width * 420 / img.height), 420), Image.LANCZOS)
        s = save_png(img, OUT / f"flower-{v}.png")
        print(f"flower-{v}: {img.size} {s // KB}KB")


def build_chars():
    # 兩格 sprite sheet：取第一格（左半）當大頭像
    for name in ("cat", "kid"):
        src = Image.open(RAW / f"char-{name}.jpg")
        half = src.crop((0, 0, src.width // 2, src.height))
        img = crop_alpha(key_green(half))
        h = 360
        img = img.resize((round(img.width * h / img.height), h), Image.LANCZOS)
        s = save_png(img, OUT / f"{name}.png")
        print(f"{name}: {img.size} {s // KB}KB")


TASKS = {
    "scene": build_scene, "policyboard": build_policyboard, "cover": build_cover,
    "photo": build_photo, "flowers": build_flowers, "chars": build_chars,
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for t in sys.argv[1:] or TASKS:
        TASKS[t]()
