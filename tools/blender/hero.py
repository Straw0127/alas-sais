"""Entity portraits (hero), close-ups (scare) and jumpscare frames.
usage: blender -b -P hero.py -- <who> <out.png> [samples] [--close] [--frame=N]
--frame=N (0..7): the jumpscare. The camera stays where it stood; the entity lurches at it. 0-1: it is there, twitching;
2-7: the lunge (the scream lands on frame 2), 7 = the face filling the screen (the old --close framing)."""
import sys, os, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from entities import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:]
if a[0].endswith('.png'):   # CI form: -- <out.png> <samples> --who=<entity> [--frame=N]
    out = a[0]; which = next(x.split('=')[1] for x in a if x.startswith('--who='))
    sc.cycles.samples = int(a[1]) if len(a) > 1 and a[1].isdigit() else 48
else:
    which, out = a[0], a[1]
    sc.cycles.samples = int(a[2]) if len(a) > 2 and a[2].isdigit() else 48
CLOSE = '--close' in a
FRAME = next((int(x.split('=')[1]) for x in a if x.startswith('--frame=')), None)
# how far along the lunge each frame is, and a sideways twitch (metres) for the jitter
PROG = [0.0, 0.05, 0.16, 0.34, 0.56, 0.76, 0.92, 1.0]
SIDE = [0.0, 0.05, -0.04, 0.03, -0.03, 0.02, -0.015, 0.0]
TILT = [0, 4, -6, 5, -8, 6, -4, 0]   # degrees of head-roll on the camera: the world lurches as it hits

pal = {'kumot': ((1.0, 0.6, 0.3), (0.5, 0.6, 1.0)), 'malikmata': ((0.5, 0.9, 1.0), (0.4, 0.8, 1.0)),
       'kalansing': ((0.8, 1.0, 0.75), (1.0, 0.7, 0.4)), 'silip': ((0.6, 0.72, 1.0), (1.0, 0.9, 0.75)),
       'barang': ((0.75, 0.85, 0.55), (1.0, 0.55, 0.3))}[which]
# (far camera, far target, far lens, close camera, close target, close lens)
CAMS = {'kumot': ((0.35, -3.3, 1.45), (0, 0.1, 1.55), 30, (0.12, -1.05, 1.9), (0, -0.3, 2.12), 34),
        'malikmata': ((0.4, -1.9, 0.75), (0, -0.1, 0.4), 30, (0.05, -0.62, 0.62), (0, -0.14, 0.6), 32),
        'kalansing': ((-0.8, -2.8, 1.25), (0, -0.1, 0.75), 28, (-0.05, -1.25, 1.12), (0, -0.36, 1.0), 32),
        'silip': ((0.25, -3.6, 1.5), (0, 0.25, 1.45), 28, (0.05, -0.75, 1.86), (0, 0.1, 1.86), 34),
        'barang': ((0.3, -3.0, 1.4), (0, 0.0, 1.35), 30, (0.04, -0.72, 1.45), (0, -0.2, 1.45), 34)}[which]

floor = mat_planks('floor', (0.1, 0.06, 0.03), (0.14, 0.08, 0.04), scale=1.2)
wall = mat_noise('wall', (0.12, 0.11, 0.1), (0.2, 0.18, 0.16), scale=3, bump=0.06)
box('floor', (12, 12, 0.1), (0, 0, -0.05), floor)
box('wall', (12, 0.1, 5), (0, 2.2, 2.5), wall)

before = set(o.name for o in bpy.data.objects)
if which == 'kumot':
    build_kumot_batibat(0, 0.2)
elif which == 'malikmata':
    build_tiyanak(0, 0.2, 0.0, crawl=True)
elif which == 'kalansing':
    build_kalansing(0, 0.3); add_aswang_tongue(0, 0.3)
elif which == 'silip':
    build_manananggal(0, 0.2, 1.2)
elif which == 'barang':
    from entities2 import build_barang
    build_barang((0, 0.2, 0), 0.0, stage=4, glow=1.0)
ENT = [o for o in bpy.data.objects if o.name not in before]

if which == 'kumot':
    point('bulb', (0.4, -1.2, 2.6), 60, color=pal[0], radius=0.05)
    area('rim', (-0.6, 1.8, 2.2), (math.radians(-60), 0, math.radians(180)), 80, size=(0.6, 0.6), color=pal[1])
elif which == 'malikmata':
    crt = mat_basic('crt', (0.03, 0.03, 0.03), 0.5)
    box('crt', (0.7, 0.5, 0.55), (-1.1, 0.9, 0.75), crt, bevel=0.04)
    box('cab', (1.2, 0.5, 0.5), (-1.1, 0.9, 0.25), mat_basic('cab', (0.06, 0.03, 0.015), 0.5))
    box('scr', (0.55, 0.01, 0.42), (-1.1, 0.64, 0.77), emission('scr', (0.55, 0.9, 1.0), 2.0))
    area('tv', (-1.1, 0.5, 0.8), (math.radians(90), 0, math.radians(-25)), 60, size=(0.55, 0.42), color=pal[0])
    area('rim', (0.9, 1.6, 2.4), (math.radians(-55), 0, math.radians(150)), 40, size=(0.5, 0.5), color=pal[1])
elif which == 'kalansing':
    point('bulb', (0.3, -1.3, 2.2), 90, color=pal[0], radius=0.05)
    area('rim', (0.8, 1.7, 1.8), (math.radians(-60), 0, math.radians(160)), 70, size=(0.6, 0.6), color=pal[1])
elif which == 'silip':
    ld = bpy.data.lights.new('moon', 'SUN'); ld.energy = 3.0; ld.color = pal[0]
    mo = bpy.data.objects.new('moon', ld); mo.rotation_euler = (math.radians(50), 0, math.radians(160)); bpy.context.collection.objects.link(mo)
    spot('flash', (0.2, -2.6, 1.5), (math.radians(86), 0, math.radians(-4)), 160, angle=math.radians(34), color=pal[1], blend=0.5)
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.002, 0.003, 0.006, 1)
elif which == 'barang':
    point('bulb', (0.5, -1.4, 2.3), 45, color=pal[0], radius=0.05)
    point('under', (0.0, -0.9, 0.5), 12, color=pal[1], radius=0.1)   # a low, sick light from beneath the face
    area('rim', (-0.7, 1.7, 2.0), (math.radians(-60), 0, math.radians(200)), 60, size=(0.6, 0.6), color=(0.5, 0.6, 1.0))

fp, ft, fl, cp, ct, cl = CAMS
if FRAME is None:
    camera(cp if CLOSE else fp, ct if CLOSE else ft, lens=cl if CLOSE else fl)
else:
    import mathutils
    f = max(0, min(7, FRAME)); k = PROG[f]
    # the entity travels so that at k=1 it stands to the far camera as it stood to the close one
    shift = mathutils.Vector(fp) - mathutils.Vector(cp)
    for o in ENT + [bpy.data.objects[n] for n in ('bulb', 'under') if n in bpy.data.objects]:   # its key light comes with it
        if o.parent is None: o.location += shift * k + mathutils.Vector((SIDE[f], 0, 0))
    if f >= 3:   # the player's own flashlight catches the face as it arrives
        spot('torch', fp, (0, 0, 0), 20 + 40 * k, angle=math.radians(40), color=(1.0, 0.92, 0.8), blend=0.6)
        t_ = bpy.data.objects['torch']; d_ = (mathutils.Vector(ct) + shift - mathutils.Vector(fp)).normalized()
        t_.rotation_euler = d_.to_track_quat('-Z', 'Y').to_euler()
    # aim between the far and close targets (moved with the entity) so the face stays framed
    tgt = mathutils.Vector(ft).lerp(mathutils.Vector(ct) + shift, k)
    cam_ = camera(fp, tuple(tgt), lens=fl + (cl - fl) * k)
    fwd = (tgt - mathutils.Vector(fp)).normalized()
    cam_.rotation_euler = (mathutils.Quaternion(fwd, math.radians(TILT[f])) @ fwd.to_track_quat('-Z', 'Y')).to_euler()
    # the light stutters as it comes: frames alternate a little brighter/darker
    for o in bpy.data.objects:
        if o.type == 'LIGHT' and o.name not in ('moon',): o.data.energy *= (1.25 if f % 2 else 0.8) if f >= 2 else 1.0
render(out)
