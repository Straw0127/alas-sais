set -e
cd /home/claude/game
python3 - <<'PY'
src=open('src/index.html').read()
css=open('src/style.css').read()
import json
calls=json.load(open('/home/claude/alas-sais/tools/voice/lines.json',encoding='utf-8'))['calls']
vo=json.load(open('/home/claude/alas-sais/tools/voice/lines.json',encoding='utf-8'))
js='var CALLS = '+json.dumps(vo['calls'],ensure_ascii=False)+';\nvar PROLOGUE = '+json.dumps(vo.get('prologue',{}),ensure_ascii=False)+';\n'+'\n'.join(open('src/'+f).read() for f in ('i18n.js','logic.js','logic1.js','ui.js'))
open('dist/index.html','w').write(src.replace('/*CSS*/',css).replace('/*JS*/',js))
PY
rm -rf dist/assets/anim; mkdir -p dist/assets/img dist/assets/sfx dist/assets/voice
for k in $(python3 -c "import re;s=open('src/ui.js').read();m=re.search(r\"var SFX = \[(.*?)\];\",s,re.S);print(' '.join(re.findall(r\"'(\w+)'\",m.group(1))))"); do
  if [ -f /home/claude/sfx/out/$k.mp3 ]; then cp -u /home/claude/sfx/out/$k.mp3 dist/assets/sfx/; else echo "MISSING SFX $k"; fi
done
rm -f dist/assets/voice/*.mp3; cp /home/claude/alas-sais/assets/voice/*.mp3 dist/assets/voice/ 2>/dev/null || echo 'no voice files yet'
python3 lift.py > /tmp/lift.log
# Lettering and the phone, rendered in Blender (render/words.py, render/phone.py): trimmed, transparent WebP
mkdir -p dist/assets/ui dist/assets/fonts; cp -u fonts/*.woff2 dist/assets/fonts/
python3 - <<'PY'
import os
from PIL import Image
W = '/home/claude/render/out/words'; D = 'dist/assets/ui'
for f in os.listdir(W):
    if not f.endswith('.png') or f == 't_menu.png': continue
    b = os.path.join(D, f[:-4] + '.webp'); a = os.path.join(W, f)
    if os.path.exists(b) and os.path.getmtime(b) > os.path.getmtime(a): continue
    im = Image.open(a)
    if not f.startswith(('phone_', 'tex_')): im = im.crop(im.getbbox())   # phone screens keep the handset's frame, textures their tile
    im.save(b, 'WEBP', quality=88 if not f.startswith('phone_') else 92, method=6)
a = '/home/claude/render/out/ui/ui_phone.png'; b = os.path.join(D, 'phone.webp')
if os.path.exists(a) and (not os.path.exists(b) or os.path.getmtime(b) < os.path.getmtime(a)):
    Image.open(a).save(b, 'WEBP', quality=90, method=6)
PY
# Low graphics: half-size copies of every picture (faster on old phones, and visibly softer)
python3 - <<'PY'
import os, re
from PIL import Image
src, dst = 'dist/assets/img', 'dist/assets/img_lo'; os.makedirs(dst, exist_ok=True)
for f in os.listdir(src):
    if f.startswith(('js_', 'hubx_', 'sofa_', 'c1_under')) or re.search(r'_sw\d+\.', f): continue   # seen for a moment: full size on every setting
    a, b = os.path.join(src, f), os.path.join(dst, f)
    if os.path.exists(b) and os.path.getmtime(b) > os.path.getmtime(a): continue
    im = Image.open(a); im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
    if f.endswith('.webp'): im.save(b, 'WEBP', quality=70, method=6)
    else: im.convert('RGB').save(b, quality=72, optimize=True, progressive=True)
for f in os.listdir(dst):
    if f.startswith(('js_', 'hubx_', 'sofa_', 'c1_under')) or re.search(r'_sw\d+\.', f) or not os.path.exists(os.path.join(src, f)): os.remove(os.path.join(dst, f))
PY
du -sh dist
# Turnable views: every picture wider than 16:9 goes into the PANO table; the Chapter 3 door's box in its panorama
# is measured from the open/closed renders (for the swing cut-out)
python3 - <<'PY'
import os, json, numpy as np
from PIL import Image
D = 'dist/assets/img'; P = {}
for f in sorted(os.listdir(D)):
    if not f.endswith('.jpg'): continue
    w, h = Image.open(os.path.join(D, f)).size
    if w / h > 1.85: P[f[:-4]] = round(w / h, 4)
door = None
a, b = os.path.join(D, 'c3_bed.jpg'), os.path.join(D, 'c3_bed_closed.jpg')
if 'c3_bed' in P and os.path.exists(b):
    A = np.asarray(Image.open(a).convert('L')).astype(int); B = np.asarray(Image.open(b).convert('L')).astype(int)
    d = np.abs(A - B) > 18; H, W = d.shape; d[:, :int(W * 0.25)] = False; d[:, int(W * 0.55):] = False
    ys, xs = np.nonzero(d)
    if len(xs) > 200:
        x0, x1 = np.percentile(xs, 1), np.percentile(xs, 99); y0, y1 = np.percentile(ys, 1), np.percentile(ys, 99)
        door = {'x': round(x0 / W, 4), 'y': round(y0 / H, 4), 'w': round((x1 - x0) / W, 4), 'h': round((y1 - y0) / H, 4)}
s = open('dist/index.html', encoding='utf-8').read()
s = s.replace('/*PANO*/{}', '/*PANO*/' + json.dumps(P))
open('dist/index.html', 'w', encoding='utf-8').write(s)
print('panoramas:', len(P))
PY

# Walking clips: graded frame by frame like the room each frame is in (so the walk matches the pictures it leaves and
# reaches), then encoded small for phones. Sources: /home/claude/render/out/walk/<name>.mp4 + .json (from the walk workflow)
python3 - <<'PY'
import os, json, glob, subprocess, shutil, numpy as np, sys
from PIL import Image
sys.path.insert(0, '/home/claude/render'); from post import grade
SRC = '/home/claude/render/out/walk' if os.environ.get('WALK_VIDEO') else '/nonexistent'; DST = 'dist/assets/walk'   # walking clips are off (stills + camera move instead)
shutil.rmtree(DST, ignore_errors=True); os.makedirs(DST, exist_ok=True)
GR = {'bedroom': 'warm', 'hallway': 'warm', 'living': 'cold', 'kitchen': 'sick', 'curtain': 'night', 'c1': 'warm'}
man = {}
for js in sorted(glob.glob(SRC + '/*.json')):
    n = os.path.basename(js)[:-5]; info = json.load(open(js)); src = SRC + '/' + n + '.mp4'; out = DST + '/' + n + '.mp4'
    if not os.path.exists(src): continue
    man[n] = info['dur']
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(src): continue
    tmp = '/tmp/wk_' + n; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', src, tmp + '/f_%04d.png'], check=True)
    fr = sorted(glob.glob(tmp + '/f_*.png')); rooms = info.get('rooms') or ['c1'] * len(fr)
    lums = [float((np.asarray(Image.open(f).convert('L')).astype(np.float32) / 255).mean()) for f in fr]
    for i, f in enumerate(fr):
        lum = float(np.mean(lums[max(0, i - 6): i + 7]))   # steady exposure: the lift follows a moving average
        a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32) / 255
        if lum < 0.15: a = a ** max(np.log(0.15) / np.log(max(lum, 1e-3)), 0.5)
        Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f)
        grade(f, f, GR.get(rooms[min(i, len(rooms) - 1)], 'warm'), seed=7, strength=0.45)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(info['fps']), '-i', tmp + '/f_%04d.png', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print('walk', n, info['dur'], round(os.path.getsize(out) / 1024), 'KB')
s = open('dist/index.html', encoding='utf-8').read()
s = s.replace('/*WALKV*/{}', '/*WALKV*/' + json.dumps(man))
open('dist/index.html', 'w', encoding='utf-8').write(s)
print('walk clips:', len(man))
PY
