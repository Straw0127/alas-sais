import sys, math; sys.path.insert(0, '/home/claude/render')
from lib import *
from entities import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:]
which, out = a[0], a[1]
sc.cycles.samples = int(a[2]) if len(a) > 2 else 48
CLOSE = '--close' in a

pal = {'kumot': ((1.0, 0.6, 0.3), (0.5, 0.6, 1.0)), 'malikmata': ((0.5, 0.9, 1.0), (0.4, 0.8, 1.0)),
       'kalansing': ((0.8, 1.0, 0.75), (1.0, 0.7, 0.4)), 'silip': ((0.6, 0.72, 1.0), (1.0, 0.9, 0.75))}[which]
floor = mat_planks('floor', (0.1, 0.06, 0.03), (0.14, 0.08, 0.04), scale=1.2)
wall = mat_noise('wall', (0.12, 0.11, 0.1), (0.2, 0.18, 0.16), scale=3, bump=0.06)
box('floor', (12, 12, 0.1), (0, 0, -0.05), floor)
box('wall', (12, 0.1, 5), (0, 2.2, 2.5), wall)

if which == 'kumot':
    build_kumot_batibat(0, 0.2)
    point('bulb', (0.4, -1.2, 2.6), 60, color=pal[0], radius=0.05)
    area('rim', (-0.6, 1.8, 2.2), (math.radians(-60), 0, math.radians(180)), 80, size=(0.6, 0.6), color=pal[1])
    tgt = (0, 0.1, 1.55) if not CLOSE else (0, -0.3, 2.12)
    camera((0.35, -3.3, 1.45) if not CLOSE else (0.12, -1.05, 1.9), tgt, lens=30 if not CLOSE else 34)
elif which == 'malikmata':
    build_tiyanak(0, 0.2, 0.0, crawl=True)
    # CRT behind-left as key light
    crt = mat_basic('crt', (0.03, 0.03, 0.03), 0.5)
    box('crt', (0.7, 0.5, 0.55), (-1.1, 0.9, 0.75), crt, bevel=0.04)
    box('cab', (1.2, 0.5, 0.5), (-1.1, 0.9, 0.25), mat_basic('cab', (0.06, 0.03, 0.015), 0.5))
    scr = emission('scr', (0.55, 0.9, 1.0), 2.0)
    box('scr', (0.55, 0.01, 0.42), (-1.1, 0.64, 0.77), scr)
    area('tv', (-1.1, 0.5, 0.8), (math.radians(90), 0, math.radians(-25)), 60, size=(0.55, 0.42), color=pal[0])
    area('rim', (0.9, 1.6, 2.4), (math.radians(-55), 0, math.radians(150)), 40, size=(0.5, 0.5), color=pal[1])
    tgt = (0, -0.1, 0.4) if not CLOSE else (0, -0.14, 0.6)
    camera((0.4, -1.9, 0.75) if not CLOSE else (0.05, -0.62, 0.62), tgt, lens=30 if not CLOSE else 32)
elif which == 'kalansing':
    build_kalansing(0, 0.3); add_aswang_tongue(0, 0.3)
    point('bulb', (0.3, -1.3, 2.2), 90, color=pal[0], radius=0.05)
    area('rim', (0.8, 1.7, 1.8), (math.radians(-60), 0, math.radians(160)), 70, size=(0.6, 0.6), color=pal[1])
    tgt = (0, -0.1, 0.75) if not CLOSE else (0, -0.36, 1.0)
    camera((-0.8, -2.8, 1.25) if not CLOSE else (-0.05, -1.25, 1.12), tgt, lens=28 if not CLOSE else 32)
elif which == 'silip':
    build_manananggal(0, 0.2, 1.2)
    ld = bpy.data.lights.new('moon', 'SUN'); ld.energy = 3.0; ld.color = pal[0]
    mo = bpy.data.objects.new('moon', ld); mo.rotation_euler = (math.radians(50), 0, math.radians(160)); bpy.context.collection.objects.link(mo)
    spot('flash', (0.2, -2.6, 1.5), (math.radians(86), 0, math.radians(-4)), 500, angle=math.radians(34), color=pal[1], blend=0.5)
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.002, 0.003, 0.006, 1)
    tgt = (0, 0.25, 1.45) if not CLOSE else (0, 0.1, 1.86)
    camera((0.25, -3.6, 1.5) if not CLOSE else (0.05, -0.75, 1.86), tgt, lens=28 if not CLOSE else 34)
render(out)
