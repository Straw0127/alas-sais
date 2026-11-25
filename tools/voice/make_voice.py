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
    # telephone band, gentle saturation, short room, then loudness-normalised so the voice sits above the house ambience
    af = 'highpass=f=260,lowpass=f=3700,acompressor=threshold=-20dB:ratio=3:makeup=3,aecho=0.8:0.4:18:0.08,loudnorm=I=-14:TP=-1.5:LRA=7'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '24000', '-ac', '1', '-b:a', '48k', dst], check=True)

async def main():
    groups = dict(data.get('calls', {})); groups.update({'pro_' + k: v for k, v in data.get('prologue', {}).items()})
    for key, lines in groups.items():
        for i, ln in enumerate(lines):
            raw = os.path.join('/tmp', 'raw_%s_%02d.mp3' % (key, i))
            await edge(ln['fil'], raw)
            phone(raw, os.path.join(OUT, '%s_%02d.mp3' % (key, i)))
            print('ok', key, i, flush=True)

asyncio.run(main())
