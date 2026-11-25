set -e
cd /home/claude/game
python3 - <<'PY'
src=open('src/index.html').read()
css=open('src/style.css').read()
import json
calls=json.load(open('/home/claude/alas-sais/tools/voice/lines.json',encoding='utf-8'))['calls']
js='var CALLS = '+json.dumps(calls,ensure_ascii=False)+';\n'+'\n'.join(open('src/'+f).read() for f in ('i18n.js','logic.js','ui.js'))
open('dist/index.html','w').write(src.replace('/*CSS*/',css).replace('/*JS*/',js))
PY
rm -rf dist/assets/anim; mkdir -p dist/assets/img dist/assets/sfx dist/assets/voice
for k in $(python3 -c "import re;s=open('src/ui.js').read();m=re.search(r\"var IMG = \[(.*?)\];\",s,re.S);print(' '.join(re.findall(r\"'(\w+)'\",m.group(1))))"); do
  if [ -f /home/claude/render/out/jpg/$k.jpg ]; then cp /home/claude/render/out/jpg/$k.jpg dist/assets/img/; else echo "MISSING IMG $k"; fi
done
for k in $(python3 -c "import re;s=open('src/ui.js').read();m=re.search(r\"var SFX = \[(.*?)\];\",s,re.S);print(' '.join(re.findall(r\"'(\w+)'\",m.group(1))))"); do
  if [ -f /home/claude/sfx/out/$k.mp3 ]; then cp -u /home/claude/sfx/out/$k.mp3 dist/assets/sfx/; else echo "MISSING SFX $k"; fi
done
cp /home/claude/alas-sais/assets/voice/*.mp3 dist/assets/voice/ 2>/dev/null || echo 'no voice files yet'
python3 lift.py > /tmp/lift.log
du -sh dist
