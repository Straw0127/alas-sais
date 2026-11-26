"""Worn-paint texture for HTML lettering (matches the Blender menu lettering): tiling RGBA, transparent except for
chips, specks and faint scratches; drawn over a paint-colour gradient and clipped to the text.
usage: python3 paint_tex.py  -> out/words/tex_paint.png, tex_rust.png"""
import os, numpy as np
from PIL import Image, ImageFilter
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'words'); os.makedirs(OUT, exist_ok=True)
N = 384; rng = np.random.default_rng(11)
def tile_noise(scale, seed):
    r = np.random.default_rng(seed); g = r.random((N // scale, N // scale))
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)
    # wrap-around: blend with a rolled copy so the edges match
    a = np.asarray(im).astype(float); b = np.roll(np.roll(a, N // 2, 0), N // 2, 1)
    w = np.minimum(np.minimum(np.arange(N), N - 1 - np.arange(N)) / (N / 2), 1)
    m = np.outer(w, w); return (a * m + b * (1 - m)) / 255
def fbm(seed): return sum(tile_noise(s, seed + i) * k for i, (s, k) in enumerate(((48, .5), (16, .3), (6, .2))))
def build(chip_col, chip_thr, speck_n, name):
    rgba = np.zeros((N, N, 4), float)
    mottle = fbm(3)                      # soft light / dark variation of the paint itself
    rgba[..., :3] = np.where(mottle[..., None] > 0.5, 255, 0); rgba[..., 3] = np.abs(mottle - 0.5) * 2 * 70
    chips = fbm(21)                      # paint flaked off: dark chips with ragged edges
    cm = np.clip((chips - chip_thr) * 14, 0, 1)
    for c in range(3): rgba[..., c] = rgba[..., c] * (1 - cm) + chip_col[c] * cm
    rgba[..., 3] = np.maximum(rgba[..., 3], cm * 235)
    for _ in range(speck_n):             # pin specks
        x, y = rng.integers(0, N, 2); r_ = rng.uniform(0.6, 1.8)
        yy, xx = np.ogrid[:N, :N]; d = np.hypot((xx - x + N / 2) % N - N / 2, (yy - y + N / 2) % N - N / 2)
        m = np.clip(r_ - d + 0.5, 0, 1); rgba[..., :3] = rgba[..., :3] * (1 - m[..., None]) + np.array(chip_col) * m[..., None]; rgba[..., 3] = np.maximum(rgba[..., 3], m * 220)
    im = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')
    im.save(os.path.join(OUT, name)); return im
build((28, 20, 16), 0.71, 160, 'tex_paint.png')      # grey-beige lettering: dark chips (menu items)
build((92, 10, 6), 0.66, 120, 'tex_rust.png')        # the logo's dried-blood spatter
build((28, 20, 16), 0.93, 90, 'tex_lite.png')        # reading text (subtitles, notes): the same paint, hardly any chips
print('ok')
