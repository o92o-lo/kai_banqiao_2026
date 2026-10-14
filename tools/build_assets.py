"""網站用圖：把 assets/raw/、sources/ 的原圖壓成網站要的尺寸（D40：正常平滑縮放，不再像素化）。

用法：
    py -3 tools/build_assets.py            # 全部
    py -3 tools/build_assets.py scene      # 只做某一項（scene/policyboard/cover/photo/flowers/chars）

輸出：
    assets/scene/scene-<名稱>.webp/.jpg   場景大圖，寬 1920，各 ≤ 400KB
    assets/scene/policyboard.webp/.jpg    政見板放大圖
    assets/scene/flower-a|b|c.png         去背花籃（送花籃時疊上去）
    assets/scene/cat.png、kid.png          去背大頭像（對話畫面、舊場景補位）
    assets/scene/lai-idle.png、lai-talk.png 小賴桌面以上（D46，兩格用同一個裁切框）
    assets/scene/board-inner.webp/.jpg     板橋版政見板的畫框內畫面（D53，疊進場景政見板）
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


def build_lai():
    """char-lai 兩格（待機／說話）：同一裁切框，只取桌面以上（原圖 y < LAI_CUT_Y）。"""
    LAI_CUT_Y = 465  # 原圖座標：筆電螢幕上緣、桌面以上
    src = Image.open(RAW / "char-lai.jpg")
    halves = [src.crop((i * src.width // 2, 0, (i + 1) * src.width // 2, LAI_CUT_Y)) for i in range(2)]
    keyed = [key_green(h) for h in halves]
    boxes = []
    for k in keyed:
        a = np.asarray(k)[..., 3] > 128
        rows = np.where(a.sum(axis=1) >= 6)[0]
        cols = np.where(a.sum(axis=0) >= 6)[0]
        boxes.append((cols[0], rows[0], cols[-1] + 1, k.height))
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), LAI_CUT_Y)
    h = 300
    for name, k in zip(("idle", "talk"), keyed):
        img = k.crop(box)
        img = img.resize((round(img.width * h / img.height), h), Image.LANCZOS)
        s = save_png(img, OUT / f"lai-{name}.png")
        print(f"lai-{name}: {img.size} {s // KB}KB")

    # D61：工具列、聊天視窗用的正方形頭像（頭頂到下巴完整、臉置中、四周留邊）
    FACE = (165, 84, 492, 402)  # 原圖待機格的頭部範圍（含頭髮、耳朵、眼鏡）
    head = key_green(src.crop((0, 0, src.width // 2, src.height))).crop(FACE)
    side = max(head.size)
    pad = round(side * 0.08)
    sq = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    sq.paste(head, (pad + (side - head.width) // 2, pad + (side - head.height) // 2), head)
    sq = sq.resize((160, 160), Image.LANCZOS)
    s = save_png(sq, OUT / "lai-face.png")
    print(f"lai-face: {sq.size} {s // KB}KB")


def build_board_inner():
    """板橋版政見板畫框內的畫面（policyboard 圖的 x 4.5–95.6%、y 12–90.8%）。"""
    src = Image.open(OUT / "policyboard.jpg").convert("RGB")
    W, H = src.size
    img = src.crop((round(W * .045), round(H * .12), round(W * .956), round(H * .908)))
    img = resize_w(img, 960)
    _, sw = save_under(img, OUT / "board-inner.webp", "WEBP", 150 * KB, method=6)
    _, sj = save_under(img, OUT / "board-inner.jpg", "JPEG", 200 * KB, optimize=True, progressive=True)
    print(f"board-inner: {img.size} webp {sw // KB}KB jpg {sj // KB}KB")


def build_nolai():
    """D66：P0 去小賴版。不整張換圖，只把 p0-scene-nolai.jpg 裡「原本小賴那塊」對齊後貼回 p0-keyframe.jpg。"""
    from PIL import ImageFilter
    base = Image.open(RAW / "p0-keyframe.jpg").convert("RGB")
    src = Image.open(RAW / "p0-scene-nolai.jpg").convert("RGB")
    W, H = base.size
    # 貼回範圍（原圖座標）：小賴與身後空椅子，四周多留邊；下緣到桌面邊緣下一點
    PATCH = (1290, 555, 1590, 852)
    FEATHER = 6
    # 對位：在貼回範圍外圍一圈比對（避開小賴本身），找最佳縮放與位移
    a = np.asarray(base).astype(np.float32)
    ring = np.zeros((H, W), bool)
    ring[460:1000, 1150:1760] = True
    ring[540:870, 1280:1600] = False
    ys, xs = np.where(ring)
    best = None
    for sc in (0.996, 0.998, 1.0, 1.002, 1.004):
        sw, sh = round(W * sc), round(H * sc)
        b = np.asarray(src.resize((sw, sh), Image.LANCZOS)).astype(np.float32)
        for dy in range(-12, 13, 2):
            for dx in range(-12, 13, 2):
                yy, xx = ys + dy, xs + dx
                ok = (yy >= 0) & (yy < sh) & (xx >= 0) & (xx < sw)
                err = np.mean((a[ys[ok], xs[ok]] - b[yy[ok], xx[ok]]) ** 2)
                if best is None or err < best[0]:
                    best = (err, sc, dx, dy)
    # 細調 ±1px
    err, sc, dx0, dy0 = best
    sw, sh = round(W * sc), round(H * sc)
    b = np.asarray(src.resize((sw, sh), Image.LANCZOS)).astype(np.float32)
    for dy in range(dy0 - 1, dy0 + 2):
        for dx in range(dx0 - 1, dx0 + 2):
            yy, xx = ys + dy, xs + dx
            ok = (yy >= 0) & (yy < sh) & (xx >= 0) & (xx < sw)
            e = np.mean((a[ys[ok], xs[ok]] - b[yy[ok], xx[ok]]) ** 2)
            if e < best[0]:
                best = (e, sc, dx, dy)
    err, sc, dx, dy = best
    print(f"nolai 對位：縮放 {sc}、位移 dx={dx} dy={dy}、外圍 RMSE {err ** .5:.1f}")
    aligned = Image.fromarray(b.clip(0, 255).astype(np.uint8)).crop((dx, dy, dx + W, dy + H))
    # 羽化遮罩：貼回範圍內為白，邊緣 FEATHER px 漸層
    mask = Image.new("L", (W, H), 0)
    x0, y0, x1, y1 = PATCH
    mask.paste(255, (x0 + FEATHER, y0 + FEATHER, x1 - FEATHER, y1 - FEATHER))
    mask = mask.filter(ImageFilter.GaussianBlur(FEATHER / 2))
    merged = Image.composite(aligned, base, mask)
    # QA：貼回前後與差異
    QA = RAW / "qa"
    QA.mkdir(parents=True, exist_ok=True)
    box = (x0 - 120, y0 - 80, x1 + 120, y1 + 80)
    pair = Image.new("RGB", ((box[2] - box[0]) * 2 + 10, box[3] - box[1]), "white")
    pair.paste(base.crop(box), (0, 0))
    pair.paste(merged.crop(box), (box[2] - box[0] + 10, 0))
    pair.save(QA / "nolai-patch-before-after.png")
    img = resize_w(merged, 1920)
    qw, sw_ = save_under(img, OUT / "scene-p0nolai.webp", "WEBP", 400 * KB, method=6)
    qj, sj = save_under(img, OUT / "scene-p0nolai.jpg", "JPEG", 400 * KB, optimize=True, progressive=True)
    print(f"scene-p0nolai: {img.size}  webp {sw_ // KB}KB  jpg {sj // KB}KB")


def build_guestbook():
    """D74：茶桌上的簽名簿（綠幕去背），寬 240px（場景裡約 6% 寬）。"""
    img = crop_alpha(key_green(Image.open(RAW / "obj-guestbook.jpg")))
    img = img.resize((240, round(img.height * 240 / img.width)), Image.LANCZOS)
    s = save_png(img, OUT / "guestbook.png")
    print(f"guestbook: {img.size} {s // KB}KB")


def build_icons():
    """D73：分頁圖示（32×32）與 iPhone 主畫面圖示（180×180，實心底色，iOS 不支援透明）。"""
    face = Image.open(OUT / "lai-face.png").convert("RGBA")
    face.resize((32, 32), Image.LANCZOS).save(ROOT / "assets" / "favicon-32.png", optimize=True)
    bg = Image.new("RGBA", (180, 180), (221, 238, 253, 255))  # --sky-0
    bg.alpha_composite(face.resize((164, 164), Image.LANCZOS), (8, 10))
    bg.convert("RGB").save(ROOT / "assets" / "apple-touch-icon.png", optimize=True)
    print("icons: favicon-32.png、apple-touch-icon.png")


TASKS = {
    "scene": build_scene, "policyboard": build_policyboard, "cover": build_cover,
    "photo": build_photo, "flowers": build_flowers, "chars": build_chars,
    "lai": build_lai, "boardinner": build_board_inner, "nolai": build_nolai, "icons": build_icons, "guestbook": build_guestbook,
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for t in sys.argv[1:] or TASKS:
        TASKS[t]()
