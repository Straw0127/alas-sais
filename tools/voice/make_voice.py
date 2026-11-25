"""Builds Tita Cora's Tagalog phone-call voice lines (runs on GitHub Actions, which can reach the TTS service).
Output: assets/voice/n{night}_{i:02d}.mp3, plus a phone-line EQ so it sounds like an old cellphone."""
import asyncio, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'voice')
os.makedirs(OUT, exist_ok=True)
data = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))

async def edge(text, path):
    import edge_tts
    c = edge_tts.Communicate(text, data['voice'], rate='-6%', pitch='-3Hz')
    await c.save(path)

def phone(src, dst):
    # band-limit like a cheap phone, soft saturation, a little room
    af = 'highpass=f=280,lowpass=f=3600,acompressor=threshold=-18dB:ratio=3,aecho=0.8:0.5:22:0.12,volume=1.6'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '24000', '-ac', '1', '-b:a', '48k', dst], check=True)

async def main():
    for night, lines in data['calls'].items():
        for i, ln in enumerate(lines):
            raw = os.path.join('/tmp', 'raw_%s_%02d.mp3' % (night, i))
            await edge(ln['fil'], raw)
            phone(raw, os.path.join(OUT, 'n%s_%02d.mp3' % (night, i)))
            print('ok', night, i, flush=True)

asyncio.run(main())
