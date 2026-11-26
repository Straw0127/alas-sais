"""Phone screens, battery icons and timer digits drawn in Python (no HTML text on the phone).
Writes to out/words/: phone_<state>_<lang>.png (the rendered handset with its call screen), bat_<0-5>.png, dg_<c>.png
usage: python3 phone_ui.py"""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(HERE, 'fonts'); OUT = os.path.join(HERE, 'out', 'words')
os.makedirs(OUT, exist_ok=True)
PHONE = Image.open(os.path.join(HERE, 'out', 'ui', 'ui_phone.png')).convert('RGBA')
BOX = (60, 76, 540, 1124)     # the glass, from the mask render
def font(w, s): return ImageFont.truetype(os.path.join(F, 'Inter-%s.ttf' % w), s)
TXT = {'en': {'ring': 'Incoming call', 'talk': 'On call', 'end': 'Call ended', 'mobile': 'Mobile · Smart', 'slide': 'Tap to answer'},
       'fil': {'ring': 'Papasok na tawag', 'talk': 'Kausap', 'end': 'Tapos na ang tawag', 'mobile': 'Mobile · Smart', 'slide': 'I-tap para sagutin'}}
GREEN, RED, CREAM = (52, 168, 83), (217, 48, 37), (238, 233, 222)

def handset_icon(d, cx, cy, r, color=(255, 255, 255), down=False):
    # a classic receiver drawn from two rounded ends and a curved grip
    ang = 135 if down else -45
    im = Image.new('RGBA', (r * 4, r * 4), (0, 0, 0, 0)); g = ImageDraw.Draw(im); c = r * 2
    g.arc((c - r, c - r, c + r, c + r), 200, 340, fill=color, width=max(3, r // 3))
    for a in (200, 340):
        x = c + r * math.cos(math.radians(a)); y = c + r * math.sin(math.radians(a))
        g.ellipse((x - r * 0.38, y - r * 0.2, x + r * 0.38, y + r * 0.42), fill=color)
    im = im.rotate(ang if down else 0, resample=Image.BICUBIC)
    return im, (cx - r * 2, cy - r * 2)

def status_bar(d, x0, y0, x1, bars=4, batt=0.8):
    f = font('600', 22); d.text((x0 + 26, y0 + 18), '12:00', font=f, fill=(230, 230, 230))
    # signal bars, wifi-less, battery outline
    bx = x1 - 140
    for k in range(4):
        h = 6 + k * 5; d.rectangle((bx + k * 9, y0 + 40 - h, bx + k * 9 + 5, y0 + 40), fill=(230, 230, 230) if k < bars else (90, 90, 90))
    bx2 = x1 - 82; d.rounded_rectangle((bx2, y0 + 22, bx2 + 44, y0 + 42), 5, outline=(230, 230, 230), width=2)
    d.rectangle((bx2 + 44, y0 + 28, bx2 + 48, y0 + 36), fill=(230, 230, 230))
    d.rectangle((bx2 + 4, y0 + 26, bx2 + 4 + int(36 * batt), y0 + 38), fill=(230, 230, 230))

def screen(state, lang, both=True):
    x0, y0, x1, y1 = BOX; w, h = x1 - x0, y1 - y0
    scr = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(scr)
    # wallpaper: a dark green-to-black gradient with a soft glow behind the caller
    for yy in range(h):
        t = yy / h; c = (int(18 * (1 - t) + 4 * t), int(34 * (1 - t) + 7 * t), int(24 * (1 - t) + 5 * t))
        d.line((0, yy, w, yy), fill=c + (255,))
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse((w * 0.15, h * 0.14, w * 0.85, h * 0.5), fill=(224, 162, 74, 70))
    scr.alpha_composite(glow.filter(ImageFilter.GaussianBlur(60)))
    d = ImageDraw.Draw(scr)
    status_bar(d, 0, 0, w)
    T = TXT[lang]
    label = T[state]; f = font('400', 26); tw = d.textlength(label, font=f)
    d.text(((w - tw) / 2, h * 0.11), label, font=f, fill=(150, 220, 150) if state == 'ring' else (200, 200, 200))
    # avatar: an initial in a warm circle with a thin ring
    cx, cy, r = w / 2, h * 0.27, 92
    d.ellipse((cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6), outline=(224, 162, 74, 110), width=3)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(58, 44, 30))
    fa = font('600', 96); a = 'C'; aw = d.textlength(a, font=fa); d.text((cx - aw / 2, cy - 62), a, font=fa, fill=(224, 162, 74))
    fn = font('600', 50); n = 'Tita Cora'; nw = d.textlength(n, font=fn); d.text(((w - nw) / 2, h * 0.41), n, font=fn, fill=CREAM)
    fm = font('400', 26); m = '0917 ••• 6262'; mw = d.textlength(m, font=fm); d.text(((w - mw) / 2, h * 0.47), m, font=fm, fill=(150, 160, 150))
    if state != 'talk':
        mm = T['mobile']; mmw = d.textlength(mm, font=font('400', 22)); d.text(((w - mmw) / 2, h * 0.505), mm, font=font('400', 22), fill=(110, 120, 110))
    by = h * 0.83; br = 54
    if state == 'ring':
        spots = [(w * 0.27, RED, False), (w * 0.73, GREEN, True)] if both else [(w * 0.5, GREEN, True)]
        for bx, col, down in spots:
            d.ellipse((bx - br - 14, by - br - 14, bx + br + 14, by + br + 14), fill=col + (40,))
            d.ellipse((bx - br, by - br, bx + br, by + br), fill=col)
            ic, pos = handset_icon(d, int(bx), int(by), 24, down=down); scr.alpha_composite(ic, (int(pos[0]), int(pos[1])))
        hint = T['slide']; fh = font('400', 22); hw = d.textlength(hint, font=fh); d.text(((w - hw) / 2, by + br + 30), hint, font=fh, fill=(150, 160, 150))
    elif state == 'talk':
        # mute / keypad / speaker row, then the red end button
        fi = font('400', 20)
        for k, (lbl, sym) in enumerate((('mute', 'M'), ('keypad', '#'), ('speaker', 'S'))):
            bx = w * (0.22 + 0.28 * k); yy = h * 0.62
            d.ellipse((bx - 44, yy - 44, bx + 44, yy + 44), fill=(255, 255, 255, 26))
            if sym == '#':
                for gx in range(3):
                    for gy in range(3): d.ellipse((bx - 18 + gx * 18 - 3, yy - 18 + gy * 18 - 3, bx - 18 + gx * 18 + 3, yy - 18 + gy * 18 + 3), fill=(230, 230, 230))
            elif sym == 'M':
                d.rounded_rectangle((bx - 9, yy - 22, bx + 9, yy + 6), 9, fill=(230, 230, 230)); d.arc((bx - 16, yy - 10, bx + 16, yy + 16), 0, 180, fill=(230, 230, 230), width=3); d.line((bx, yy + 16, bx, yy + 24), fill=(230, 230, 230), width=3)
            else:
                d.polygon([(bx - 18, yy - 8), (bx - 8, yy - 8), (bx + 4, yy - 20), (bx + 4, yy + 20), (bx - 8, yy + 8), (bx - 18, yy + 8)], fill=(230, 230, 230))
                for rr in (10, 18): d.arc((bx + 4 - rr, yy - rr, bx + 4 + rr, yy + rr), -50, 50, fill=(230, 230, 230), width=3)
        d.ellipse((w / 2 - br, by - br, w / 2 + br, by + br), fill=RED)
        ic, pos = handset_icon(d, int(w / 2), int(by), 24, down=False); scr.alpha_composite(ic, (int(pos[0]), int(pos[1])))
    else:   # ended: the red button greyed
        d.ellipse((w / 2 - br, by - br, w / 2 + br, by + br), fill=(80, 40, 36))
        ic, pos = handset_icon(d, int(w / 2), int(by), 24, color=(200, 180, 180), down=False); scr.alpha_composite(ic, (int(pos[0]), int(pos[1])))
    # an emissive screen: bright text and icons bleed a little light, plus a whisper of sensor grain
    import numpy as np
    from PIL import ImageChops
    al = scr.split()[3]; rgb = scr.convert('RGB')
    bl = rgb.filter(ImageFilter.GaussianBlur(7)).point(lambda v: int(max(0, v - 40) * 0.55))
    rgb = ImageChops.screen(rgb, bl)
    n = (np.random.default_rng(7).normal(0, 2.2, (h, w, 1))).repeat(3, 2)
    rgb = Image.fromarray(np.clip(np.asarray(rgb).astype(float) + n, 0, 255).astype('uint8'))
    scr = rgb.convert('RGBA'); scr.putalpha(al)
    # rounded corners to fit the glass, a soft sheen from the top-left
    mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), 40, fill=255)
    sheen = Image.new('RGBA', (w, h), (0, 0, 0, 0)); sd = ImageDraw.Draw(sheen)
    pass
    out = PHONE.copy(); scr.putalpha(Image.fromarray(__import__('numpy').minimum(__import__('numpy').asarray(scr.split()[3]), __import__('numpy').asarray(mask)))) if False else None
    scr2 = Image.new('RGBA', (w, h), (0, 0, 0, 0)); scr2.paste(scr, (0, 0), mask)
    out.alpha_composite(scr2, (x0, y0))
    # the hairline crack and punch-hole sit on top of the screen
    top = PHONE.crop(BOX); hole = Image.new('L', (w, h), 0); hd = ImageDraw.Draw(hole)
    hd.ellipse((w / 2 - 16, 24 - 16 + 6, w / 2 + 16, 24 + 16 + 6), fill=255)
    out.paste(top, (x0, y0), hole)
    return out

for lang in ('en', 'fil'):
    for st in ('ring', 'talk', 'end'):
        screen(st, lang).save(os.path.join(OUT, 'phone_%s_%s.png' % (st, lang)))
    screen('ring', lang, both=False).save(os.path.join(OUT, 'phone_ringA_%s.png' % lang))

# the glass of the rendered handset (reflections, smudges, the crack): screen-blended over the live screen at runtime
g = Image.new('RGBA', PHONE.size, (0, 0, 0, 0)); g.paste(PHONE.crop(BOX).convert('RGB'), BOX[:2]); g.save(os.path.join(OUT, 'phone_glass.png'))
# call-timer digits: one sprite strip, fixed-width cells so the clock never shifts as it counts; lit on black
# (drawn additively onto the screen), with the same soft bloom as the rest of the screen
CW, CC, CH = 30, 15, 58
sh = Image.new('RGB', (CW * 10 + CC, CH), (0, 0, 0)); d = ImageDraw.Draw(sh); f = font('400', 44)
for k in range(11):
    ch = ':' if k == 10 else str(k); x = k * CW; cw = CC if k == 10 else CW
    tw = d.textlength(ch, font=f); d.text((x + (cw - tw) / 2, 3), ch, font=f, fill=CREAM)
from PIL import ImageChops
sh = ImageChops.screen(sh, sh.filter(ImageFilter.GaussianBlur(5)).point(lambda v: int(v * 0.5)))
sh.save(os.path.join(OUT, 'phone_digits.png'))

# phone battery icon with five bars (the flashlight is the phone's)
for n in range(6):
    im = Image.new('RGBA', (150, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((4, 6, 126, 58), 10, fill=(10, 10, 10, 170), outline=(233, 223, 203), width=4)
    d.rounded_rectangle((128, 22, 140, 42), 3, fill=(233, 223, 203))
    col = (233, 223, 203) if n > 1 else (224, 80, 60)
    for k in range(n): d.rounded_rectangle((13 + k * 22.5, 15, 13 + k * 22.5 + 17, 49), 3, fill=col)
    im.save(os.path.join(OUT, 'bat_%d.png' % n))
print('ok')
