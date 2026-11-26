# Game copies of the renders: lift dark shadows on the raw render, then a light film grade (the game adds its own grain).
import sys, glob, os, numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/render'); from post import grade
G = {'js': 'red', 'ext': 'night', 'bedroom': 'warm', 'under': 'warm', 'hallway': 'warm', 'living': 'cold', 'kitchen': 'sick', 'cabinet': 'sick', 'curtain': 'night',
     'c1': 'warm', 'menu': 'warm', 'menu_living_off_lit': 'cold', 'menu_morning': 'none', 'hero_barang': 'sick', 'c1_scare_barang': 'red',
     'hero_kumot': 'warm', 'hero_malikmata': 'cold', 'hero_kalansing': 'sick', 'hero_silip': 'night', 'scare_kumot': 'red', 'scare_malikmata': 'cold', 'scare_kalansing': 'red', 'scare_silip': 'red'}
os.makedirs('dist/assets/img', exist_ok=True)
KEEP_DARK = ('menu_bed_off', 'menu_hall_off', 'menu_kitchen_off', 'c1_door_open')
from PIL import ImageFilter
R = '/home/claude/render/out/final/'
def graded_png(k, gamma_from=None):   # the lifted + graded frame as a lossless PNG (overlays are cut from these)
    a = np.asarray(Image.open(R + k + '.png').convert('RGB')).astype(np.float32) / 255
    b = np.asarray(Image.open(R + (gamma_from or k) + '.png').convert('RGB')).astype(np.float32) / 255
    lum = (b @ np.array([0.2126, 0.7152, 0.0722])).mean()
    if lum < 0.15: a = a ** max(np.log(0.15) / np.log(max(lum, 1e-3)), 0.5)
    tmp = '/tmp/lift_' + k + '.png'; out = '/tmp/graded_' + k + '.png'
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(tmp)
    grade(tmp, out, 'warm', seed=7, strength=0.45)
    return np.asarray(Image.open(out).convert('RGB')).astype(np.int16)
# hub overlays: each entity state is the difference from the empty room, cut out with a soft edge (transparent WebP)
for src in sorted(glob.glob(R + 'hubx_*.png')):
    k = os.path.basename(src)[:-4]; base = {'o': 'c1_hub_open', 'l': 'c3_bed', 'n': 'c3_bed_c'}.get(k[-1], 'c1_hub'); f = 'dist/assets/img/' + k + '.webp'
    if os.path.exists(f) and os.path.getmtime(f) > max(os.path.getmtime(src), os.path.getmtime(R + base + '.png')): continue
    v = graded_png(k, base); b = graded_png(base)
    d = np.abs(v - b).max(axis=2).astype(np.uint8)
    H_, W_ = d.shape; box_ = {'k': (0.29, 0.50), 's': (0.59, 0.86), 'b': (0.50, 0.67)}[k[5]]   # panorama columns   # each entity only changes its own part of the room
    reg = np.zeros_like(d); reg[:, int(box_[0] * W_):int(box_[1] * W_)] = 1; d = d * reg
    m = Image.fromarray(((d > (4 if k.endswith('n') else 9)) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(10))
    rgba = Image.fromarray(v.astype(np.uint8)).convert('RGBA'); rgba.putalpha(m)
    rgba.save(f, 'WEBP', quality=82, method=6)
    print(f'{k:24s} overlay {np.count_nonzero(np.asarray(m) > 128) / d.size:.1%} of frame')
import re
def family_base(k):
    """States of one view share one exposure, so nothing jumps in brightness when an entity appears, a curtain opens or a door swings.
    Flashlight layers (_cl, _lit) and lights-on states keep their own."""
    if 'lights' in k or k.endswith('_lit') and not k.startswith('c1_cab'): return k
    suf = '_cl' if k.endswith('_cl') else '_c' if k.endswith('_c') else ''
    fam = {'curtain': 'curtain_closed', 'hallway': 'hallway_empty', 'kitchen': 'kitchen_empty', 'living': 'living_empty', 'cabinet': 'cabinet_empty'}
    pre = k.split('_')[0]
    if pre in fam: b = fam[pre] + suf
    elif re.match(r'c1_win_', k): b = 'c1_win_closed'
    elif re.match(r'c1_cab_\d_lit$', k): b = 'c1_cab_0_lit'
    elif re.match(r'c1_cab_\d$', k): b = 'c1_cab_0'
    elif re.match(r'c1_door_(ajar|k\d|sw\d+|closed)$', k): b = 'c1_door_sw46'
    elif k.startswith('c1_peek_'): b = 'c1_peek_0'
    elif k in ('c1_hub', 'c1_hub_open', 'c1_hub_kumot'): b = 'c1_hub'
    elif re.match(r'c3_bed(_closed|_kumot)?(_c|_cl)?$', k): b = 'c3_bed' + suf
    elif k.startswith('c3_look'): b = 'c3_look'
    else: b = k
    return b if os.path.exists(R + b + '.png') else k
FORCE = os.environ.get('FORCE') == '1'
for src in sorted(glob.glob(R + '*.png')):
    k = os.path.basename(src)[:-4]; f = 'dist/assets/img/' + k + '.jpg'
    if k.startswith('hubx_'): continue
    fb = family_base(k)
    if not FORCE and os.path.exists(f) and os.path.getmtime(f) > max(os.path.getmtime(src), os.path.getmtime(R + fb + '.png')): continue
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    a_b = np.asarray(Image.open(R + fb + '.png').convert('RGB')).astype(np.float32) / 255 if fb != k else a
    lum = (a_b @ np.array([0.2126, 0.7152, 0.0722])).mean()
    target = 0.09 if k.startswith(('scare', 'hero', 'ext', 'js_')) else 0.15
    if lum < target and k not in KEEP_DARK:
        a = a ** max(np.log(target) / np.log(max(lum, 1e-3)), 0.5)
    tmp = '/tmp/lift_' + k + '.png'
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(tmp)
    grade(tmp, f, G.get(k) or G.get(k.split('_')[0], 'warm'), seed=7, strength=0.45)
    Image.open(f).convert('RGB').save(f, quality=84, optimize=True, progressive=True)
    print(f'{k:24s} mean {lum:.3f}')
