"""Film-grade pass for ALAS-SAIS renders: bloom, colour grade, chromatic aberration, vignette, grain.
usage: python3 post.py in.png out.jpg [grade]   grade in {warm, cold, sick, red, night, none}"""
import sys, numpy as np
from PIL import Image, ImageFilter

GRADES = {  # (shadow tint, highlight tint, saturation)
    'warm':  ((0.02, 0.012, 0.0), (1.04, 0.97, 0.86), 0.85),
    'cold':  ((0.0, 0.012, 0.02), (0.9, 1.0, 1.06), 0.75),
    'sick':  ((0.006, 0.016, 0.004), (0.96, 1.03, 0.88), 0.7),
    'red':   ((0.02, 0.0, 0.0), (1.06, 0.92, 0.88), 0.85),
    'night': ((0.0, 0.006, 0.02), (0.92, 0.98, 1.08), 0.8),
    'none':  ((0, 0, 0), (1, 1, 1), 1.0),
}

def grade(path_in, path_out, g='warm', seed=0, strength=1.0):
    im = np.asarray(Image.open(path_in).convert('RGB')).astype(np.float32) / 255.0
    h, w, _ = im.shape
    # bloom: blur of the brightest areas
    bright = np.clip(im - 0.62, 0, 1) * 2.2
    b = Image.fromarray((np.clip(bright, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(w / 70))
    im = im + np.asarray(b).astype(np.float32) / 255.0 * 0.45 * strength
    # grade
    sh, hi, sat = GRADES[g]
    lum = im @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    im = lum[..., None] + (im - lum[..., None]) * sat
    im = im * np.array(hi, np.float32) + np.array(sh, np.float32) * (1 - lum[..., None])
    im = np.clip(im, 0, 1) ** 1.08  # crush blacks slightly
    # chromatic aberration (radial channel offset)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2; dx, dy = (xx - cx) / cx, (yy - cy) / cy
    k = 0.0035 * strength
    def sample(ch, s):
        sx = np.clip(xx + dx * s * w, 0, w - 1).astype(np.int32); sy = np.clip(yy + dy * s * h, 0, h - 1).astype(np.int32)
        return im[sy, sx, ch]
    im = np.stack([sample(0, k), im[..., 1], sample(2, -k)], -1)
    # vignette
    r = np.sqrt(dx ** 2 + dy ** 2) / 1.42
    im = im * (1 - 0.72 * strength * np.clip(r - 0.25, 0, 1) ** 1.6)[..., None]
    # grain (luminance-weighted, stronger in shadows)
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h, w)).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 0.25 + 0.5).clip(0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255 - 0.5
    im = im + n[..., None] * 0.09 * strength * (1.1 - np.clip(im.mean(-1, keepdims=True), 0, 1))
    Image.fromarray((np.clip(im, 0, 1) * 255).astype(np.uint8)).save(path_out, quality=88, optimize=True, progressive=True)

if __name__ == '__main__':
    grade(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'warm')
