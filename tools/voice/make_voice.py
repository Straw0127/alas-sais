"""Builds Tita Cora's Tagalog phone-call voice lines (runs on GitHub Actions, which can reach the TTS service).
Output: assets/voice/<group>_<i>.mp3

To sound less like a machine reading a script, each line is spoken sentence by sentence: every sentence gets its own
pace and pitch (a little faster when she is worried, slower when she remembers, questions lifted at the end), real
pauses and a soft breath go between sentences, and the whole thing then goes down a narrowband phone line with her
room behind her: a faint hiss, the codec's thinness, a slight wobble in level."""
import asyncio, json, os, random, re, subprocess, zlib
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'assets', 'voice')
TMP = '/tmp/vo'; os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
data = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
VOICE = data['voice']

def sentences(text):
    parts = re.findall(r'[^.?!…]+[.?!…]*', text)
    return [p.strip() for p in parts if p.strip()]

async def say(text, path, rate, pitch, volume='+0%'):
    import edge_tts
    c = edge_tts.Communicate(text, VOICE, rate='%+d%%' % rate, pitch='%+dHz' % pitch, volume=volume)
    await c.save(path)

def run(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)

def silence(path, sec):
    run('-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '%.3f' % sec, '-c:a', 'pcm_s16le', path)

def breath(path, sec):
    # a short, quiet intake of air: band-passed noise with a swell
    run('-f', 'lavfi', '-i', 'anoisesrc=color=pink:r=24000:a=0.08', '-t', '%.3f' % sec,
        '-af', 'highpass=f=900,lowpass=f=5200,afade=t=in:d=%.3f,afade=t=out:st=%.3f:d=%.3f,volume=0.55' % (sec * 0.55, sec * 0.55, sec * 0.45),
        '-ac', '1', '-c:a', 'pcm_s16le', path)

def to_wav(src, dst): run('-i', src, '-ar', '24000', '-ac', '1', '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse', '-c:a', 'pcm_s16le', dst)

def phone_line(src, dst, seed):
    rnd = random.Random(seed)
    # narrowband codec (8 kHz), cheap-phone EQ, gentle level wobble, a faint line hiss underneath, then loudness-normalised
    af = ('aresample=8000,aresample=24000,highpass=f=300,lowpass=f=3400,equalizer=f=1800:t=q:w=1.2:g=3,'
          'acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=3,'
          'tremolo=f=%.2f:d=0.04,aecho=0.8:0.3:14:0.05' % rnd.uniform(0.3, 0.7))
    run('-i', src, '-f', 'lavfi', '-i', 'anoisesrc=color=brown:r=24000:a=0.004',
        '-filter_complex', '[0:a]%s[v];[1:a]highpass=f=300,lowpass=f=3400[n];[v][n]amix=inputs=2:duration=first:weights=1 1,loudnorm=I=-14:TP=-1.5:LRA=9' % af,
        '-ar', '24000', '-ac', '1', '-b:a', '48k', dst)

async def line(key, i, text):
    rnd = random.Random(zlib.crc32((key + str(i)).encode()))
    parts = sentences(text); pieces = []
    for j, s in enumerate(parts):
        q = s.endswith('?'); long_ = len(s) > 70
        rate = rnd.randint(-11, -2) if long_ else rnd.randint(-6, 5)       # stories slower, short remarks quicker
        pitch = rnd.randint(-5, 1) + (3 if q else 0)
        raw = os.path.join(TMP, '%s_%02d_%d.mp3' % (key, i, j)); wav = raw[:-4] + '.wav'
        await say(s, raw, rate, pitch)
        to_wav(raw, wav)
        if j:   # the gap between sentences: a pause, sometimes she breathes in first
            gap = os.path.join(TMP, '%s_%02d_%d_gap.wav' % (key, i, j))
            if rnd.random() < 0.45: breath(gap, rnd.uniform(0.28, 0.42))
            else: silence(gap, rnd.uniform(0.22, 0.5))
            pieces.append(gap)
        pieces.append(wav)
    lead = os.path.join(TMP, '%s_%02d_lead.wav' % (key, i)); silence(lead, 0.12)
    lst = os.path.join(TMP, '%s_%02d.txt' % (key, i))
    open(lst, 'w').write(''.join("file '%s'\n" % p for p in [lead] + pieces))
    joined = os.path.join(TMP, '%s_%02d_join.wav' % (key, i))
    run('-f', 'concat', '-safe', '0', '-i', lst, '-c:a', 'pcm_s16le', joined)
    phone_line(joined, os.path.join(OUT, '%s_%02d.mp3' % (key, i)), zlib.crc32((key + str(i) + "l").encode()))

async def main():
    groups = dict(data.get('calls', {})); groups.update({'pro_' + k: v for k, v in data.get('prologue', {}).items()})
    for key, lines in groups.items():
        for i, ln in enumerate(lines):
            await line(key, i, ln['fil']); print('ok', key, i, flush=True)

asyncio.run(main())
