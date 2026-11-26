"""Cut-out jumpscares ("greenscreen"): only the entity, on a transparent background, lunging at a standing camera.
The game lays these over whatever room you are in when an entity that came looking for you catches you.
usage: python3 cut.py -- out.png SAMPLES --who=kumot|malikmata|kalansing|silip|barang --light=warm|cold|dark --frame=0..7
       python3 cut.py -- out.png SAMPLES --who=... --stand      (full figure standing, for the doorway warning)"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import mathutils
sc = reset()
A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = A[0] if A else '/tmp/cut.png'
sc.cycles.samples = int(A[1]) if len(A) > 1 and A[1].isdigit() else 48
OPT = dict(a[2:].split('=', 1) if '=' in a else (a[2:], '1') for a in A if a.startswith('--'))
WHO = OPT.get('who', 'kumot'); LIGHT = OPT.get('light', 'warm'); STAND = 'stand' in OPT
f = max(0, min(7, int(OPT.get('frame', 0))))
sc.render.film_transparent = True
sc.render.image_settings.color_mode = 'RGBA'
from entities import build_kumot_batibat, build_tiyanak, build_kalansing, build_manananggal, add_aswang_tongue
from entities2 import build_barang, group_at

PROG = [0.0, 0.05, 0.16, 0.34, 0.56, 0.76, 0.92, 1.0]
SIDE = [0.0, 0.05, -0.04, 0.03, -0.03, 0.02, -0.015, 0.0]
TILT = [0, 4, -6, 5, -8, 6, -4, 0]
k = PROG[f]

# --- the entity, built at the origin facing -y (toward the camera)
before = set(o.name for o in bpy.data.objects)
Z0 = 0.0; LEAP = 0.0; BEND = 0
if WHO == 'kumot':       build_kumot_batibat(0, 0); FL = (0, -0.5, 2.12); BEND = 0 if (f < 2 or STAND) else 22 * k   # a slight stoop; she ducks to your face
elif WHO == 'malikmata': build_tiyanak(0, 0, 0.0, crawl=True); FL = (0, -0.34, 0.6); LEAP = 0.95
elif WHO == 'kalansing': build_kalansing(0, 0); add_aswang_tongue(0, 0); FL = (0, -0.66, 1.0); LEAP = 0.55
elif WHO == 'silip':     build_manananggal(0, 0, 0, wing=0.8 if (f < 2 or STAND) else 0.5); FL = (0, -0.1, 0.66); Z0 = 1.05
elif WHO == 'barang':    build_barang((0, 0, 0), 0.0, stage=4, glow=1.0); FL = (0, -0.23, 1.45)

def bend_pt(p, a, hip=1.1, band=0.45):   # (as in bed1.py) bend forward at the waist, the turn easing in over a band
    dz = p[2] - hip
    if dz <= 0 or not a: return mathutils.Vector(p)
    t = min(1.0, dz / band); t = t * t * (3 - 2 * t); g_ = math.radians(a) * t
    return mathutils.Vector((p[0], p[1] * math.cos(g_) - dz * math.sin(g_), hip + dz * math.cos(g_) + p[1] * math.sin(g_)))
if BEND:
    for o in bpy.data.objects:
        if o.name in before or o.type != 'MESH': continue
        mw = o.matrix_world.copy(); inv = mw.inverted()
        for v in o.data.vertices: v.co = inv @ bend_pt(bend_pt(mw @ v.co, -0.85 * BEND, 1.92, 0.12), BEND)
    FL = tuple(bend_pt(bend_pt(FL, -0.85 * BEND, 1.92, 0.12), BEND))
e = group_at(before, (0, 0, 0), 0.0)

# --- the camera: a standing player, as in the room views
C = mathutils.Vector((0, 0, 1.55))
if STAND:   # a full-length portrait for the doorway warning (cropped to the figure afterwards)
    hgt = {'kumot': 2.45, 'malikmata': 0.8, 'kalansing': 1.3, 'silip': 1.0, 'barang': 1.65}[WHO]
    zc = Z0 + hgt / 2 if WHO != 'silip' else Z0 + 0.2
    camera((0, -9.0, zc), (0, 0, zc), lens=120)
    e.location = (0, 0, Z0)
    F = mathutils.Vector((0, -0.3, zc))
else:
    cam = camera(tuple(C), (0, 3.0, 1.45), lens=22); lens0 = 22
    fwd0 = (mathutils.Vector((0, 3.0, 1.45)) - C).normalized()
    FLv = mathutils.Vector(FL)
    F0 = mathutils.Vector((0, 2.6, Z0)) + FLv
    F1 = C + mathutils.Vector((0, 0.5, 0))
    if WHO in ('malikmata', 'kalansing'): F1.z = min(C.z + 0.04, FLv.z + LEAP)   # it leaps at your face
    else: F1.z = C.z + 0.04
    F = F0.lerp(F1, k) + mathutils.Vector((SIDE[f], 0, 0))
    o_ = F - FLv
    if WHO in ('malikmata', 'kalansing') and o_.z < 0: o_.z = 0
    # (no floor in a cut-out: close up, whatever is below the frame simply is not seen)
    e.location = o_
    # the camera stays put (the room picture behind does not move); the game zooms and shakes the whole picture

# --- light: your flashlight from the camera, the room's own colour round it, a rim behind
COL = {'warm': (1.0, 0.72, 0.45), 'cold': (0.55, 0.72, 1.0), 'dark': (0.6, 0.62, 0.7)}[LIGHT]
fill = {'warm': 16, 'cold': 16, 'dark': 7}[LIGHT]
src = (C if not STAND else mathutils.Vector((0, -3.0, F.z))) + mathutils.Vector((0.1, 0, -0.12))
spot('torch', tuple(src), (F - src).to_track_quat('-Z', 'Y').to_euler(), (34 + 50 * k), angle=math.radians(40), color=(1.0, 0.93, 0.82), blend=0.6)
area('fill', (1.6, F.y - 0.6, F.z + 1.4), (math.radians(-40), math.radians(35), 0), fill, size=(1.5, 1.5), color=COL)
point('rim', (-0.6, F.y + 1.2, F.z + 0.8), 10 if LIGHT != 'dark' else 4, color=COL, radius=0.3)
render(out)
