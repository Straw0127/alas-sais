import sys, os, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = a[0] if a else 'out/kitchen.png'
sc.cycles.samples = int(a[1]) if len(a) > 1 else 40
KAL = '--kal' in a

W, D, H = 4.4, 4.0, 2.7
plaster = mat_noise('plaster', (0.28, 0.3, 0.24), (0.4, 0.42, 0.34), scale=3, bump=0.06)
ceil = mat_noise('ceil', (0.22, 0.22, 0.2), (0.36, 0.36, 0.33), scale=2)
floor = mat_planks('floorTile', (0.14, 0.16, 0.13), (0.18, 0.2, 0.16), mortar=(0.04, 0.04, 0.035), scale=0.8, rough=0.3)
room(W, D, H, plaster, floor, ceil)
tiles = mat_planks('wallTile', (0.32, 0.38, 0.33), (0.36, 0.42, 0.36), mortar=(0.12, 0.12, 0.1), scale=2.2, rough=0.15)
box('backsplash', (2.6, 0.02, 0.7), (-0.9, D - 0.01, 1.25), tiles)
wood = mat_planks('cab', (0.12, 0.07, 0.03), (0.16, 0.09, 0.04), scale=3, rough=0.5)
counter = mat_noise('counter', (0.25, 0.25, 0.23), (0.35, 0.35, 0.32), scale=12, rough=0.4)

# lower cabinets + counter along back wall (left part)
box('lowerCab', (2.6, 0.6, 0.85), (-0.9, D - 0.3, 0.425), wood, bevel=0.01)
box('counter', (2.7, 0.65, 0.05), (-0.9, D - 0.32, 0.875), counter)
brass = mat_basic('handle', (0.5, 0.4, 0.2), 0.35, metal=1)
for i, x in enumerate((-1.95, -1.35, -0.75, -0.15)):
    box('door%d' % i, (0.56, 0.02, 0.75), (x + 0.3, D - 0.61, 0.43), wood, bevel=0.005)
    box('h%d' % i, (0.015, 0.02, 0.1), (x + 0.52, D - 0.63, 0.65), brass)
# stove + kettle
iron = mat_basic('iron', (0.06, 0.06, 0.06), 0.5, metal=0.7)
box('stove', (0.6, 0.45, 0.1), (-1.6, D - 0.35, 0.95), iron, bevel=0.01)
alum = mat_basic('alum', (0.6, 0.6, 0.58), 0.35, metal=1)
k = sphere('kettle', 0.13, (-1.6, D - 0.35, 1.1), alum, scale=(1, 1, 0.8))
cyl('spout', 0.015, 0.16, (-1.47, D - 0.35, 1.15), alum, rot=(0, math.radians(55), 0), verts=10)
# sink + faucet
box('sink', (0.6, 0.45, 0.06), (-0.4, D - 0.35, 0.88), mat_basic('sinkM', (0.5, 0.5, 0.5), 0.2, metal=1))
cyl('faucet', 0.015, 0.3, (-0.4, D - 0.1, 1.05), alum, verts=10)
cyl('faucetArm', 0.013, 0.2, (-0.4, D - 0.2, 1.2), alum, rot=(math.radians(90), 0, 0), verts=10)
# hanging rail with EMPTY hooks
cyl('rail', 0.01, 1.8, (-0.9, D - 0.05, 1.85), alum, rot=(0, math.radians(90), 0), verts=10)
for i in range(7):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.025, minor_radius=0.004, location=(-1.7 + i * 0.27, D - 0.06, 1.81), rotation=(math.radians(90), 0, 0))
    bpy.context.active_object.data.materials.append(alum)
# one ladle left on the rail
cyl('ladle', 0.006, 0.3, (-0.35, D - 0.07, 1.65), alum, verts=8)
sphere('ladleCup', 0.04, (-0.35, D - 0.07, 1.48), alum, scale=(1, 1, 0.6))

# doorway (back wall right) to dark hall
wall = bpy.data.objects['WallBack']
c = box('c', (0.9, 0.5, 2.1), (1.3, D, 1.05)); cut(wall, c)
dark = mat_noise('dark', (0.02, 0.02, 0.02), (0.05, 0.05, 0.05), scale=3)
box('hallBack', (2, 0.1, 2.6), (1.3, D + 1.5, 1.3), dark)
box('hallFloor', (2, 2, 0.1), (1.3, D + 0.8, -0.05), dark)

# fridge right wall, door ajar with interior light
fr = mat_noise('fridge', (0.25, 0.3, 0.25), (0.4, 0.45, 0.38), scale=6, rough=0.4)
box('fridge', (0.7, 0.7, 1.6), (W / 2 - 0.4, 1.8, 0.8), fr, bevel=0.04)
bpy.ops.object.empty_add(location=(W / 2 - 0.75, 1.45, 0)); hg = bpy.context.active_object
fd = box('fridgeDoor', (0.05, 0.7, 1.55), (W / 2 - 0.775, 1.8, 0.8), fr, bevel=0.02)
fd.parent = hg; fd.matrix_parent_inverse = hg.matrix_world.inverted(); hg.rotation_euler = (0, 0, math.radians(-28))
point('fridgeLight', (W / 2 - 0.5, 1.8, 1.2), 12, color=(0.75, 1.0, 0.75), radius=0.2)
# breaker box
box('breaker', (0.04, 0.3, 0.4), (W / 2 - 0.02, 3.0, 1.6), mat_basic('brk', (0.3, 0.33, 0.3), 0.5, metal=0.4), bevel=0.01)
# table with plastic cover, foreground left
cover = mat_floral('tablecloth', (0.4, 0.35, 0.28), (0.55, 0.1, 0.08), (0.2, 0.35, 0.15), scale=7)
box('table', (1.1, 0.8, 0.04), (-1.4, 1.2, 0.76), cover, bevel=0.01)
for sx in (-1, 1):
    for sy in (-1, 1):
        box('leg', (0.05, 0.05, 0.74), (-1.4 + sx * 0.48, 1.2 + sy * 0.33, 0.37), wood)
cyl('bottle', 0.035, 0.24, (-1.2, 1.25, 0.9), mat_basic('bottleG', (0.1, 0.35, 0.15), 0.05, trans=0.9), verts=16)
cyl('cap', 0.016, 0.01, (-1.2, 1.25, 1.025), alum, verts=12)

# bare bulb
gl = mat_basic('bulb', (1, 1, 0.9), 0.1, emit=(0.95, 1.0, 0.8), emit_str=8)
b = sphere('bulb', 0.05, (-0.3, 2.2, H - 0.45), gl); b.visible_shadow = False
cyl('cord', 0.005, 0.4, (-0.3, 2.2, H - 0.2), mat_basic('cord', (0.02, 0.02, 0.02), 0.6))
point('bulbL', (-0.3, 2.2, H - 0.47), 22, color=(0.95, 1.0, 0.82), radius=0.04)

if KAL:
    sack = mat_noise('sack', (0.32, 0.26, 0.16), (0.45, 0.37, 0.24), scale=60, bump=0.4)
    skin = mat_basic('kalBody', (0.05, 0.04, 0.035), 0.8)
    x0, y0 = 1.3, D + 0.35
    torso = sphere('kTorso', 0.35, (x0, y0, 0.95), skin, scale=(0.9, 0.7, 1.1))
    torso.rotation_euler = (math.radians(-35), 0, 0)
    head = sphere('kHead', 0.16, (x0 + 0.05, y0 - 0.32, 1.35), sack, scale=(1, 1.1, 0.9))
    thread = mat_basic('thread', (0.55, 0.45, 0.3), 0.8)
    for i in range(5):
        box('stitch%d' % i, (0.006, 0.01, 0.05), (x0 - 0.05 + i * 0.025, y0 - 0.49, 1.29), thread)
    for s in (-1, 1):
        cyl('kArm%d' % s, 0.035, 0.85, (x0 + s * 0.32, y0 - 0.25, 0.5), skin, rot=(math.radians(20), math.radians(s * 12), 0), verts=10)
    import random; random.seed(3)
    for i in range(16):
        ang = random.uniform(-1.2, 1.2); r = random.uniform(0.22, 0.34)
        px = x0 + math.sin(ang) * r; py = y0 - 0.2 - math.cos(ang) * 0.15; pz = random.uniform(0.75, 1.15)
        L = random.uniform(0.12, 0.3)
        cyl('w%d' % i, 0.003, L, (px, py, pz - L / 2), alum, verts=6)
        if i % 3 == 0:
            cyl('can%d' % i, 0.035, 0.06, (px, py, pz - L - 0.03), alum, verts=14)
        elif i % 3 == 1:
            sphere('cup%d' % i, 0.035, (px, py, pz - L - 0.02), alum, scale=(1, 1, 0.6))
        else:
            box('spoon%d' % i, (0.015, 0.004, 0.12), (px, py, pz - L - 0.06), alum)
    point('kalRim', (x0 + 0.3, y0 + 0.7, 1.7), 14, color=(0.7, 0.8, 0.7), radius=0.2)

camera((-0.2, 0.15, 1.55), (0.1, D, 1.05), lens=21)
render(out)
