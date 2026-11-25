# Game copies of the renders: lift dark shadows on the raw render, then a light film grade (the game adds its own grain).
import sys, glob, os, numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/render'); from post import grade
G = {'ext': 'night', 'bedroom': 'warm', 'under': 'warm', 'hallway': 'warm', 'living': 'cold', 'kitchen': 'sick', 'cabinet': 'sick', 'curtain': 'night',
     'hero_kumot': 'warm', 'hero_malikmata': 'cold', 'hero_kalansing': 'sick', 'hero_silip': 'night', 'scare_kumot': 'red', 'scare_malikmata': 'cold', 'scare_kalansing': 'red', 'scare_silip': 'red'}
for f in glob.glob('dist/assets/img/*.jpg'):
    k = os.path.basename(f)[:-4]
    a = np.asarray(Image.open('/home/claude/render/out/final/' + k + '.png').convert('RGB')).astype(np.float32) / 255
    lum = (a @ np.array([0.2126, 0.7152, 0.0722])).mean()
    target = 0.09 if k.startswith(('scare', 'hero', 'ext')) else 0.15
    if lum < target:
        a = a ** max(np.log(target) / np.log(max(lum, 1e-3)), 0.5)
    tmp = '/tmp/lift_' + k + '.png'
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(tmp)
    grade(tmp, f, G.get(k) or G.get(k.split('_')[0], 'warm'), seed=7, strength=0.45)
    print(f'{k:24s} mean {lum:.3f}')
