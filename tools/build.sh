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
    im = Image.open(a); im = im.crop(im.getbbox()); im.save(b, 'WEBP', quality=88, method=6)
a = '/home/claude/render/out/ui/ui_phone.png'; b = os.path.join(D, 'phone.webp')
if os.path.exists(a) and (not os.path.exists(b) or os.path.getmtime(b) < os.path.getmtime(a)):
    Image.open(a).save(b, 'WEBP', quality=90, method=6)
PY
# Low graphics: half-size copies of every picture (faster on old phones, and visibly softer)
python3 - <<'PY'
import os
from PIL import Image
src, dst = 'dist/assets/img', 'dist/assets/img_lo'; os.makedirs(dst, exist_ok=True)
for f in os.listdir(src):
    a, b = os.path.join(src, f), os.path.join(dst, f)
    if os.path.exists(b) and os.path.getmtime(b) > os.path.getmtime(a): continue
    im = Image.open(a); im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
    if f.endswith('.webp'): im.save(b, 'WEBP', quality=70, method=6)
    else: im.convert('RGB').save(b, quality=72, optimize=True, progressive=True)
for f in os.listdir(dst):
    if not os.path.exists(os.path.join(src, f)): os.remove(os.path.join(dst, f))
PY
du -sh dist
