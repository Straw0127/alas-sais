import sys, os, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
sc = reset()
out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'out/bedroom.png'
samples = int(sys.argv[sys.argv.index('--') + 2]) if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 2 else 40
KUMOT = '--kumot' in sys.argv
CLOSED = '--closed' in sys.argv
UNDER = '--under' in sys.argv
INSIDE = '--inside' in sys.argv
SCARE = '--scare' in sys.argv
sc.cycles.samples = samples

W, D, H = 4.0, 4.4, 2.75
plaster = mat_noise('plaster', (0.36, 0.30, 0.22), (0.52, 0.45, 0.33), scale=3, bump=0.08)
plaster_stain = mat_noise('ceil', (0.25, 0.22, 0.17), (0.42, 0.38, 0.30), scale=2, bump=0.05)
floor = mat_planks('floor', (0.16, 0.08, 0.035), (0.22, 0.12, 0.05), scale=1.2)
room(W, D, H, plaster, floor, plaster_stain)

# skirting board
wood_dark = mat_planks('wood_dark', (0.07, 0.035, 0.015), (0.1, 0.05, 0.02), scale=3, rough=0.45)
box('skirtB', (W, 0.02, 0.12), (0, D - 0.01, 0.06), wood_dark)
box('skirtR', (0.02, D, 0.12), (W / 2 - 0.01, D / 2, 0.06), wood_dark)

# --- door opening in back wall
dx = -0.35
wall = bpy.data.objects['WallBack']
c = box('c', (0.92, 0.5, 2.1), (dx, D, 1.05)); cut(wall, c)
box('jambL', (0.06, 0.16, 2.14), (dx - 0.49, D, 1.07), wood_dark)
box('jambR', (0.06, 0.16, 2.14), (dx + 0.49, D, 1.07), wood_dark)
box('jambT', (1.04, 0.16, 0.07), (dx, D, 2.14), wood_dark)
# hallway beyond (very dark)
dim = mat_noise('hall', (0.05, 0.045, 0.04), (0.09, 0.08, 0.07), scale=3)
box('hallFloor', (3, 3, 0.1), (dx, D + 1.6, -0.05), floor)
box('hallBack', (3, 0.1, 2.8), (dx, D + 2.6, 1.4), dim)
box('hallL', (0.1, 3, 2.8), (dx - 0.9, D + 1.6, 1.4), dim)
box('hallR', (0.1, 3, 2.8), (dx + 0.9, D + 1.6, 1.4), dim)
box('hallC', (3, 3, 0.1), (dx, D + 1.6, 2.8), dim)
point('hallGlow', (dx + 0.6, D + 2.3, 2.2), 6.0, color=(0.6, 0.7, 1.0), radius=0.3)
# slipper in the hallway, just visible
slip = mat_basic('slip', (0.32, 0.26, 0.2), 0.9)
box('slipper', (0.1, 0.26, 0.03), (dx + 0.15, D + 0.9, 0.015), slip, rot=(0, 0, 0.3), bevel=0.02)

# door panel, hinged left, swung ~38 deg into the room
door_mat = mat_planks('door', (0.2, 0.1, 0.045), (0.24, 0.13, 0.06), scale=2.5, rough=0.5)
bpy.ops.object.empty_add(location=(dx - 0.45, D - 0.05, 0))
hinge = bpy.context.active_object
dp = box('doorPanel', (0.88, 0.045, 2.06), (dx - 0.45 + 0.44, D - 0.05, 1.03), door_mat, bevel=0.005)
for i, z in enumerate((1.55, 0.6)):
    p = box('panel%d' % i, (0.62, 0.02, 0.7), (dx - 0.45 + 0.44, D - 0.075, z), wood_dark, bevel=0.01)
    p.parent = hinge; p.matrix_parent_inverse = hinge.matrix_world.inverted()
brass = mat_basic('brass', (0.6, 0.42, 0.15), 0.3, metal=1.0)
k = sphere('knob', 0.03, (dx - 0.45 + 0.8, D - 0.1, 1.0), brass)
k.parent = hinge; k.matrix_parent_inverse = hinge.matrix_world.inverted()
dp.parent = hinge; dp.matrix_parent_inverse = hinge.matrix_world.inverted()
hinge.rotation_euler = (0, 0, math.radians(0 if CLOSED else -38))

# light switch
sw = mat_basic('sw', (0.75, 0.7, 0.6), 0.5)
box('switch', (0.08, 0.02, 0.12), (dx + 0.75, D - 0.01, 1.3), sw, bevel=0.005)

# calendar
paper = mat_noise('paper', (0.62, 0.57, 0.46), (0.75, 0.7, 0.58), scale=20, bump=0.02)
red = mat_basic('red', (0.4, 0.05, 0.03), 0.7)
box('cal', (0.34, 0.01, 0.48), (-1.35, D - 0.01, 1.55), paper)
box('calTop', (0.34, 0.012, 0.12), (-1.35, D - 0.012, 1.74), red)

# crucifix + rosary on back wall right
box('crossV', (0.03, 0.02, 0.28), (1.0, D - 0.015, 1.95), wood_dark)
box('crossH', (0.16, 0.02, 0.03), (1.0, D - 0.015, 2.02), wood_dark)
bead = mat_basic('bead', (0.05, 0.03, 0.02), 0.4)
for i in range(22):
    a = i / 22 * 2 * math.pi
    sphere('b%d' % i, 0.011, (1.0 + 0.09 * math.sin(a), D - 0.02, 1.62 + 0.14 * math.cos(a)), bead)

# bed along left wall, near camera
frame = wood_dark
box('bedFrame', (1.1, 2.0, 0.35), (-1.4, 1.4, 0.2), frame, bevel=0.01)
box('headboard', (1.1, 0.06, 1.0), (-1.4, 2.42, 0.5), frame, bevel=0.01)
mattress = mat_basic('matt', (0.55, 0.5, 0.42), 0.9)
box('mattress', (1.0, 1.9, 0.2), (-1.4, 1.4, 0.47), mattress, bevel=0.04)
blanket = mat_floral('blanket', (0.22, 0.05, 0.045), (0.42, 0.26, 0.08), (0.12, 0.14, 0.06))
bl = box('blanket', (1.16, 1.5, 0.08), (-1.4, 1.15, 0.6), blanket, bevel=0.04)
bl.modifiers.new('sub', 'SUBSURF').levels = 2
bpy.ops.object.shade_smooth()
pil = mat_basic('pillow', (0.62, 0.58, 0.5), 0.95)
sphere('pillow', 0.22, (-1.4, 2.2, 0.64), pil, scale=(1.6, 0.6, 0.4))

# capiz window on right wall
wr = bpy.data.objects['WallR']
c = box('c', (0.5, 1.2, 1.1), (W / 2, 2.6, 1.55)); cut(wr, c)
capiz = mat_basic('capiz', (0.85, 0.82, 0.7), 0.35, trans=0.7)
grid = wood_dark
for i in range(4):
    for j in range(4):
        box('cz%d%d' % (i, j), (0.01, 0.27, 0.25), (W / 2, 2.6 - 0.45 + i * 0.3, 1.55 - 0.41 + j * 0.275), capiz)
for i in range(5):
    box('gv%d' % i, (0.04, 0.025, 1.12), (W / 2, 2.0 + i * 0.3, 1.55), grid)
for j in range(5):
    box('gh%d' % j, (0.04, 1.22, 0.025), (W / 2, 2.6, 1.0 + j * 0.275), grid)
area('moon', (W / 2 + 1.0, 2.6, 1.7), (0, math.radians(-90), 0), 60, size=(1.2, 1.2), color=(0.45, 0.6, 1.0))

# aparador (wardrobe) right side
box('wardrobe', (0.6, 1.1, 2.0), (W / 2 - 0.32, 3.7, 1.0), door_mat, bevel=0.01)
mirror = mat_basic('mirror', (0.6, 0.62, 0.65), 0.08, metal=1.0)
box('mirror', (0.01, 0.35, 1.2), (W / 2 - 0.625, 3.7, 1.15), mirror)

# electric fan, right foreground
metal = mat_basic('fanmetal', (0.08, 0.09, 0.1), 0.35, metal=0.6)
cyl('fanBase', 0.2, 0.04, (1.4, 1.1, 0.02), metal)
cyl('fanPole', 0.02, 1.1, (1.4, 1.1, 0.57), metal)
cage = cyl('fanCage', 0.24, 0.14, (1.4, 1.1, 1.2), metal, rot=(math.radians(90), 0, math.radians(25)), verts=24)
cage.modifiers.new('w', 'WIREFRAME').thickness = 0.006

# hanging bulb
cord = mat_basic('cord', (0.02, 0.02, 0.02), 0.6)
cyl('cord', 0.006, 0.55, (0.1, 2.3, H - 0.275), cord)
glass = mat_basic('bulbGlass', (1, 0.85, 0.6), 0.1, emit=(1.0, 0.62, 0.28), emit_str=18)
bb = sphere('bulb', 0.055, (0.1, 2.3, H - 0.6), glass, scale=(1, 1, 1.25)); bb.visible_shadow = False
point('bulbLight', (0.1, 2.3, H - 0.62), 65, color=(1.0, 0.62, 0.3), radius=0.04)
point('fill', (0.0, 0.4, 2.2), 3, color=(1.0, 0.7, 0.45), radius=0.8)

KX, KY = (dx + 0.18, D + 0.75)
if INSIDE or SCARE: KX, KY = (-0.35, 1.9)
if KUMOT or INSIDE or SCARE:
    kb = mat_floral('kumotCloth', (0.16, 0.06, 0.05), (0.3, 0.2, 0.1), (0.1, 0.1, 0.06), scale=9)
    body = cyl('kumotBody', 0.2, 2.15, (KX, KY, 1.07), kb, verts=40)
    tp = body.modifiers.new('tp', 'SIMPLE_DEFORM'); tp.deform_method = 'TAPER'; tp.factor = -0.55
    body.modifiers.new('sub', 'SUBSURF').levels = 2
    dm = body.modifiers.new('disp', 'DISPLACE'); tx = bpy.data.textures.new('folds', 'CLOUDS'); tx.noise_scale = 0.18; dm.texture = tx; dm.strength = 0.06
    bpy.ops.object.shade_smooth()
    head = sphere('kumotHead', 0.15, (KX - 0.06, KY - 0.09, 2.2), kb, scale=(1, 1.1, 1.3))
    head.rotation_euler = (math.radians(25), 0, math.radians(-20))
    eye = mat_basic('eye', (0.9, 0.85, 0.7), 0.2, emit=(0.9, 0.85, 0.7), emit_str=0.6)
    sphere('eye', 0.012 if not SCARE else 0.02, (KX - 0.12, KY - 0.23, 2.2), eye)
    fing = mat_basic('fing', (0.35, 0.33, 0.3), 0.6)
    for i in range(4):
        f = cyl('finger%d' % i, 0.008, 0.16, (KX + 0.27, KY - 0.73 + i * 0.012, 1.25 - i * 0.03), fing, rot=(0, math.radians(80), 0), verts=8)
if UNDER:
    box('bedUnderside', (1.3, 2.2, 0.04), (0.2, 1.0, 0.36), wood_dark)
    camera((0.2, 0.0, 0.14), (-0.2, 4.4, 0.25), lens=20)
elif SCARE:
    head = bpy.data.objects['kumotHead']; head.location = (KX + 0.05, KY - 0.35, 1.75); head.rotation_euler = (math.radians(70), math.radians(90), 0)
    bpy.data.objects['eye'].location = (KX + 0.05, KY - 0.5, 1.72)
    point('scareKey', (0.4, 0.6, 1.3), 20, color=(1.0, 0.6, 0.35), radius=0.1)
    camera((0.15, 0.95, 1.6), (KX + 0.05, KY - 0.35, 1.74), lens=26)
else:
    camera((0.35, 0.05, 1.58), (-0.15, 4.4, 1.25), lens=21)
render(out)
