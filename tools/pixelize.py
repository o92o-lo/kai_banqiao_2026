"""美術後製：assets/raw/*.jpg|png → assets/sprites/*.png

規格見 docs/04-engineering-brief.md §3.6、docs/03-art-brief.md §1–§2。

用法：
    py -3 tools/pixelize.py                 # 處理全部
    py -3 tools/pixelize.py char-kai icon-pet
    py -3 tools/pixelize.py --preview       # 另外輸出 4 倍預覽到 assets/raw/qa/

步驟：去綠底 → 裁透明邊 → 每個像素先對到 31 色調色盤 → 區塊取眾數縮到目標尺寸
（等比例、放進目標框內）→ alpha 二值化（區塊內透明超過一半就全透明）。
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets" / "sprites"
QA = RAW / "qa"

# 03-art-brief.md §1，共 31 色
PALETTE_HEX = """
DDEEFD C2E2FC A5CAFA 6F9FE0 3D6FB8 264B85
23252E 3B3F4C 6A7080 A3A8B5 D9DCE3 F5F6F9 FFFFFF
4E3221 74492C A06D45 CC9A68 E8C79B
EFE6D8 D9CBB6
2E6B3A 4C9A55 8BCB7D
B3122D E14B58 F5A3A8
E9B23F FFE08A
F3CBA6 DDA27E B97A5A
""".split()
PALETTE = np.array([[int(h[i:i + 2], 16) for i in (0, 2, 4)] for h in PALETTE_HEX], dtype=np.int32)
TRANSPARENT = len(PALETTE)  # 透明的索引

# 目標尺寸（03-art-brief.md §2）。frames=2 表示左右兩格；crop_top 只留上方比例（桌面以上）
SPECS = {
    "bg-desktop":      {"size": (480, 270), "key": False},
    "obj-bulletin":    {"size": (96, 64)},
    "obj-backdrop":    {"size": (168, 72)},
    "obj-policyboard": {"size": (128, 80)},
    "icon-transit":    {"size": (32, 32)},
    "icon-family":     {"size": (32, 32)},
    "icon-elder":      {"size": (32, 32)},
    "icon-pet":        {"size": (32, 32)},
    "icon-tourism":    {"size": (32, 32)},
    "icon-housing":    {"size": (32, 32)},
    "obj-desk":        {"size": (88, 48)},
    "char-kai":        {"size": (40, 48), "frames": 2, "crop_top": 0.68},
    "obj-teatable":    {"size": (144, 64)},
    "obj-cup":         {"size": (12, 12)},
    "obj-snack":       {"size": (16, 12)},
    "char-lai":        {"size": (36, 44), "frames": 2, "crop_top": 0.62},
    "obj-flower-a":    {"size": (28, 48)},
    "obj-flower-b":    {"size": (28, 48)},
    "obj-flower-c":    {"size": (28, 48)},
    "obj-welcome":     {"size": (96, 44)},
    "obj-flyers":      {"size": (20, 12)},
    "obj-numbersign":  {"size": (28, 36)},
    "ui-frame":        {"size": (48, 48)},
    "char-cat":        {"size": (28, 18), "frames": 2},
    "char-kid":        {"size": (24, 28), "frames": 2},
    "obj-sidedesk":    {"size": (56, 40)},
}


def green_mask(rgb):
    """True＝背景。#00FF00 去背；JPG 雜訊與綠邊也要吃掉。

    植物的綠（#4C9A55 等）g 比 max(r,b) 只高約 70，背景綠高 200 以上，所以用 85 當界線。
    """
    r, g, b = (rgb[..., i].astype(np.int32) for i in range(3))
    dom = g - np.maximum(r, b)
    bg = dom > 85
    # 綠邊：貼著背景、還偏綠的像素也去掉（擴張 2 次）
    spill = dom > 40
    for _ in range(2):
        near = np.zeros_like(bg)
        near[1:, :] |= bg[:-1, :]
        near[:-1, :] |= bg[1:, :]
        near[:, 1:] |= bg[:, :-1]
        near[:, :-1] |= bg[:, 1:]
        bg = bg | (near & spill)
    return bg


def opaque_bbox(opaque, min_count=4):
    """忽略零星雜點：一列／一欄至少 min_count 個不透明像素才算。"""
    rows = np.where(opaque.sum(axis=1) >= min_count)[0]
    cols = np.where(opaque.sum(axis=0) >= min_count)[0]
    if len(rows) == 0 or len(cols) == 0:
        raise ValueError("整張都是透明的")
    return cols[0], rows[0], cols[-1] + 1, rows[-1] + 1


def to_palette_index(rgb):
    """每個像素對到最近的調色盤顏色（不抖色）。"""
    flat = rgb.reshape(-1, 3).astype(np.int32)
    out = np.empty(len(flat), dtype=np.int32)
    step = 200_000
    for i in range(0, len(flat), step):
        d = ((flat[i:i + step, None, :] - PALETTE[None, :, :]) ** 2).sum(axis=2)
        out[i:i + step] = d.argmin(axis=1)
    return out.reshape(rgb.shape[:2])


def block_mode(idx, tw, th):
    """區塊取眾數縮圖。透明佔一半以上 → 透明；否則取不透明顏色的眾數。"""
    h, w = idx.shape
    ys = (np.arange(h) * th // h)
    xs = (np.arange(w) * tw // w)
    cell = ys[:, None] * tw + xs[None, :]
    n = TRANSPARENT + 1
    counts = np.bincount((cell * n + idx).ravel(), minlength=tw * th * n).reshape(th * tw, n)
    total = counts.sum(axis=1)
    clear = counts[:, TRANSPARENT] * 2 > total
    best = counts[:, :TRANSPARENT].argmax(axis=1)
    best[clear] = TRANSPARENT
    return best.reshape(th, tw)


def index_to_rgba(idx):
    rgba = np.zeros(idx.shape + (4,), dtype=np.uint8)
    solid = idx != TRANSPARENT
    rgba[solid, :3] = PALETTE[idx[solid]]
    rgba[solid, 3] = 255
    return Image.fromarray(rgba)


def fit(box_w, box_h, w, h):
    """等比例放進目標框，回傳整數尺寸。"""
    s = min(box_w / w, box_h / h)
    return max(1, round(w * s)), max(1, round(h * s))


def process_background(img, size):
    tw, th = size
    w, h = img.size
    # 裁成目標比例（置中），再縮
    target_ratio = tw / th
    if w / h > target_ratio:
        nw = round(h * target_ratio)
        img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / target_ratio)
        img = img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    rgb = np.asarray(img.convert("RGB"))
    return index_to_rgba(block_mode(to_palette_index(rgb), tw, th))


def process_object(img, spec):
    tw, th = spec["size"]
    frames = spec.get("frames", 1)
    rgb_all = np.asarray(img.convert("RGB"))
    H, W = rgb_all.shape[:2]
    fw_src = W // frames
    halves = [rgb_all[:, i * fw_src:(i + 1) * fw_src] for i in range(frames)]
    masks = [~green_mask(h) for h in halves]

    # 各格用同一個裁切框（各格 bbox 的聯集），動畫才不會晃
    boxes = [opaque_bbox(m) for m in masks]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    if "crop_top" in spec:
        y1 = y0 + round((y1 - y0) * spec["crop_top"])
        # 只取上半身後，重新收緊左右邊界
        sub = np.zeros(masks[0][y0:y1, x0:x1].shape[1], dtype=np.int64)
        for m in masks:
            sub += m[y0:y1, x0:x1].sum(axis=0)
        cols = np.where(sub >= 4)[0]
        x0, x1 = x0 + cols[0], x0 + cols[-1] + 1

    ow, oh = fit(tw, th, x1 - x0, y1 - y0)
    sheet = Image.new("RGBA", (ow * frames, oh), (0, 0, 0, 0))
    for i, (half, mask) in enumerate(zip(halves, masks)):
        idx = to_palette_index(half[y0:y1, x0:x1])
        idx[~mask[y0:y1, x0:x1]] = TRANSPARENT
        sheet.paste(index_to_rgba(block_mode(idx, ow, oh)), (i * ow, 0))
    return sheet


def checker(size, cell=8):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    on = ((yy // cell + xx // cell) % 2).astype(bool)
    a = np.where(on[..., None], [205, 205, 205], [235, 235, 235]).astype(np.uint8)
    return Image.fromarray(a)


def preview(name, sprite):
    big = sprite.resize((sprite.width * 4, sprite.height * 4), Image.NEAREST)
    bg = checker(big.size).convert("RGBA")
    bg.alpha_composite(big)
    QA.mkdir(parents=True, exist_ok=True)
    bg.convert("RGB").save(QA / f"preview-{name}.png")
    return bg


def contact_sheet(items):
    """全部預覽拼成一張，方便 PM 一次看。"""
    pad, label_h, max_w = 16, 18, 2000
    from PIL import ImageDraw
    rows, row, x, row_h = [], [], pad, 0
    for name, im in items:
        if x + im.width + pad > max_w and row:
            rows.append((row, row_h)); row, x, row_h = [], pad, 0
        row.append((name, im, x)); x += im.width + pad; row_h = max(row_h, im.height + label_h)
    if row:
        rows.append((row, row_h))
    total_h = sum(h + pad for _, h in rows) + pad
    sheet = Image.new("RGB", (max_w, total_h), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    y = pad
    for row, h in rows:
        for name, im, x in row:
            d.text((x, y), name, fill=(0, 0, 0))
            sheet.paste(im.convert("RGB"), (x, y + label_h))
        y += h + pad
    sheet.save(QA / "preview-all.png")


def find_source(name):
    for ext in (".png", ".jpg", ".jpeg"):
        p = RAW / f"{name}{ext}"
        if p.exists():
            return p
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("names", nargs="*", help="只處理這些（檔名不含副檔名）")
    ap.add_argument("--preview", action="store_true", help="輸出 4 倍預覽到 assets/raw/qa/")
    args = ap.parse_args()

    names = args.names or list(SPECS)
    OUT.mkdir(parents=True, exist_ok=True)
    sizes, previews = {}, []
    for name in names:
        if name.startswith("p0"):
            continue  # 參考圖不處理
        spec = SPECS.get(name)
        if spec is None:
            print(f"略過 {name}：SPECS 裡沒有目標尺寸", file=sys.stderr)
            continue
        src = find_source(name)
        if src is None:
            print(f"缺圖 {name}", file=sys.stderr)
            continue
        img = Image.open(src)
        if spec.get("key", True):
            sprite = process_object(img, spec)
        else:
            sprite = process_background(img, spec["size"])
        sprite.save(OUT / f"{name}.png", optimize=True)
        frames = spec.get("frames", 1)
        sizes[name] = {"w": sprite.width // frames, "h": sprite.height, "frames": frames}
        print(f"{name}: {sprite.width // frames}×{sprite.height}" + (f" ×{frames} 格" if frames > 1 else ""))
        if args.preview:
            previews.append((name, preview(name, sprite)))

    if args.preview and previews:
        contact_sheet(previews)
    # 尺寸表給工程對座標用（不給網站讀）
    manifest = QA / "sprite-sizes.json"
    QA.mkdir(parents=True, exist_ok=True)
    old = json.loads(manifest.read_text(encoding="utf-8")) if manifest.exists() else {}
    old.update(sizes)
    manifest.write_text(json.dumps(old, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
