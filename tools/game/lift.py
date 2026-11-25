# Game copies of the renders: lift dark shadows on the raw render, then a light film grade (the game adds its own grain).
import sys, glob, os, numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/render'); from post import grade
G = {'ext': 'night', 'bedroom': 'warm', 'under': 'warm', 'hallway': 'warm', 'living': 'cold', 'kitchen': 'sick', 'cabinet': 'sick', 'curtain': 'night',
     'c1': 'warm', 'menu': 'warm', 'menu_living_off_lit': 'cold', 'menu_morning': 'none', 'hero_barang': 'sick', 'c1_scare_barang': 'red',
     'hero_kumot': 'warm', 'hero_malikmata': 'cold', 'hero_kalansing': 'sick', 'hero_silip': 'night', 'scare_kumot': 'red', 'scare_malikmata': 'cold', 'scare_kalansing': 'red', 'scare_silip': 'red'}
os.makedirs('dist/assets/img', exist_ok=True)
KEEP_DARK = ('menu_bed_off', 'menu_hall_off', 'menu_kitchen_off', 'c1_door_open')
for src in sorted(glob.glob('/home/claude/render/out/final/*.png')):
    k = os.path.basename(src)[:-4]; f = 'dist/assets/img/' + k + '.jpg'
    if os.path.exists(f) and os.path.getmtime(f) > os.path.getmtime(src): continue
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    lum = (a @ np.array([0.2126, 0.7152, 0.0722])).mean()
    target = 0.09 if k.startswith(('scare', 'hero', 'ext')) else 0.15
    if lum < target and k not in KEEP_DARK:
        a = a ** max(np.log(target) / np.log(max(lum, 1e-3)), 0.5)
    tmp = '/tmp/lift_' + k + '.png'
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(tmp)
    grade(tmp, f, G.get(k) or G.get(k.split('_')[0], 'warm'), seed=7, strength=0.45)
    Image.open(f).convert('RGB').save(f, quality=84, optimize=True, progressive=True)
    print(f'{k:24s} mean {lum:.3f}')
