import sys, os, math, random; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = a[0] if a else 'out/curtain.png'
sc.cycles.samples = int(a[1]) if len(a) > 1 else 40
OPEN = '--open' in a
SILIP = '--silip' in a
STAGE = 2
for x in a:
    if x.startswith('--stage='): STAGE = int(x.split('=')[1])

W, D, H = 3.6, 3.2, 2.7
plaster = mat_noise('plaster', (0.3, 0.24, 0.2), (0.44, 0.36, 0.3), scale=3, bump=0.06)
ceil = mat_noise('ceil', (0.2, 0.18, 0.16), (0.32, 0.3, 0.27), scale=2)
floor = mat_planks('floor', (0.14, 0.07, 0.03), (0.19, 0.1, 0.045), scale=1.2)
room(W, D, H, plaster, floor, ceil)
wood = mat_planks('wood', (0.08, 0.04, 0.018), (0.11, 0.055, 0.025), scale=3, rough=0.4)

# big window in back wall
wall = bpy.data.objects['WallBack']
c = box('c', (2.4, 0.5, 1.9), (0, D, 1.25)); cut(wall, c)
glass = mat_basic('glass', (0.92, 0.95, 0.97), 0.03, trans=1.0)
box('glass', (2.4, 0.01, 1.9), (0, D + 0.02, 1.25), glass)
for x in (-1.2, 0, 1.2):
    box('mull%.1f' % x, (0.06, 0.08, 1.9), (x, D + 0.02, 1.25), wood)
box('sill', (2.6, 0.2, 0.06), (0, D - 0.05, 0.3), wood)
box('top', (2.6, 0.12, 0.08), (0, D, 2.22), wood)

# curtains (pleated via wave displacement)
cur = mat_noise('curtain', (0.28, 0.06, 0.05), (0.4, 0.1, 0.07), scale=14, bump=0.3)
def curtain(name, x, width):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=80, y_subdivisions=4, size=1, location=(x, D - 0.16, 1.22), rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object; o.name = name; o.scale = (width, 2.05, 1)
    bpy.ops.object.transform_apply(scale=True)
    tx = bpy.data.textures.new(name + 't', 'WOOD'); tx.wood_type = 'BANDS'; tx.noise_basis_2 = 'SIN'; tx.noise_scale = 0.05 if width > 1 else 0.035
    md = o.modifiers.new('d', 'DISPLACE'); md.texture = tx; md.strength = 0.08; md.direction = 'Y'; md.texture_coords = 'OBJECT'
    o.modifiers.new('s', 'SOLIDIFY').thickness = 0.01
    bpy.ops.object.shade_smooth(); o.data.materials.append(cur)
    return o
if OPEN:
    curtain('curL', -1.25, 0.6); curtain('curR', 1.25, 0.6)
else:
    curtain('curL', -0.62, 1.3); curtain('curR', 0.62, 1.3)
alum = mat_basic('rod', (0.4, 0.4, 0.38), 0.3, metal=1)
cyl('rod', 0.015, 2.8, (0, D - 0.16, 2.3), alum, rot=(0, math.radians(90), 0))

# altar table at left with candles + photo
box('altar', (0.7, 0.4, 0.9), (-1.35, 0.9, 0.45), wood, bevel=0.01)
cloth = mat_basic('altarCloth', (0.75, 0.72, 0.62), 0.9)
box('altarCloth', (0.74, 0.44, 0.02), (-1.35, 0.9, 0.91), cloth)
wax = mat_basic('wax', (0.85, 0.8, 0.65), 0.6, trans=0.3)
flame = mat_basic('flame', (1, 0.6, 0.2), 0.5, emit=(1.0, 0.45, 0.12), emit_str=40)
for i, (x, hh) in enumerate(((-1.5, 0.18), (-1.2, 0.12))):
    cyl('candle%d' % i, 0.025, hh, (x, 0.85, 0.92 + hh / 2), wax, verts=16)
    f = sphere('flame%d' % i, 0.012, (x, 0.85, 0.94 + hh), flame, scale=(1, 1, 2.2)); f.visible_shadow = False
    point('candleL%d' % i, (x, 0.85, 0.97 + hh), 9, color=(1.0, 0.5, 0.2), radius=0.02)
box('frame', (0.2, 0.02, 0.26), (-1.35, 1.05, 1.06), wood, rot=(math.radians(-12), 0, 0))
box('photo', (0.16, 0.005, 0.21), (-1.35, 1.035, 1.06), mat_noise('photoM', (0.2, 0.18, 0.15), (0.45, 0.4, 0.33), scale=30), rot=(math.radians(-12), 0, 0))

# ---- garden outside
grass = mat_noise('ground', (0.01, 0.018, 0.01), (0.03, 0.04, 0.02), scale=5, bump=0.4)
box('ground', (30, 30, 0.1), (0, D + 15, -0.05), grass)
bark = mat_noise('bark', (0.03, 0.02, 0.015), (0.06, 0.045, 0.03), scale=20, bump=0.6)
leaf = mat_noise('leaf', (0.005, 0.015, 0.006), (0.02, 0.04, 0.015), scale=8, bump=0.5)
cyl('trunk', 0.22, 3.5, (-1.8, D + 7.0, 1.75), bark, verts=16)
random.seed(7)
for i in range(9):
    s = sphere('foliage%d' % i, random.uniform(1.0, 1.6), (-1.8 + random.uniform(-1.8, 1.8), D + 7.0 + random.uniform(-1, 1), 3.8 + random.uniform(-0.6, 0.8)), leaf)
    md = s.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('lt%d' % i, 'CLOUDS'); t.noise_scale = 0.4; md.texture = t; md.strength = 0.5
clay = mat_noise('clay', (0.12, 0.05, 0.03), (0.2, 0.09, 0.05), scale=6)
sphere('banga', 0.35, (0.9, D + 3.6, 0.32), clay, scale=(1, 1, 0.95))
cyl('bangaNeck', 0.16, 0.12, (0.9, D + 3.6, 0.68), clay)
iron = mat_basic('gate', (0.03, 0.03, 0.03), 0.6, metal=0.5)
for i in range(18):
    cyl('bar%d' % i, 0.018, 1.8, (-3.4 + i * 0.4, D + 12, 0.9), iron, verts=8)
box('gateTop', (7.2, 0.05, 0.06), (0, D + 12, 1.75), iron)
box('wallFar', (30, 0.3, 1.5), (0, D + 12.3, 0.75), mat_noise('fence', (0.05, 0.05, 0.05), (0.09, 0.09, 0.09), scale=4))
ld = bpy.data.lights.new('moon', 'SUN'); ld.energy = 3.5; ld.color = (0.45, 0.6, 1.0); ld.angle = 0.02
mo = bpy.data.objects.new('moon', ld); mo.rotation_euler = (math.radians(55), 0, math.radians(200)); bpy.context.collection.objects.link(mo)
w = sc.world.node_tree.nodes['Background']; w.inputs[0].default_value = (0.02, 0.03, 0.06, 1)

if SILIP:
    pos = {1: (0.2, D + 11.3), 2: (-1.2, D + 6.4), 3: (0.55, D + 3.9), 4: (0.25, D + 0.45)}[STAGE]
    coat = mat_basic('raincoat', (0.75, 0.55, 0.08), 0.3)
    capiz = mat_basic('capizFace', (0.85, 0.83, 0.75), 0.25, emit=(0.9, 0.88, 0.8), emit_str=0.25, trans=0.3)
    x0, y0 = pos
    body = cyl('sBody', 0.2, 1.1, (x0, y0, 0.8), coat, verts=24)
    tp = body.modifiers.new('tp', 'SIMPLE_DEFORM'); tp.deform_method = 'TAPER'; tp.factor = 0.6
    body.modifiers.new('sub', 'SUBSURF').levels = 1
    sphere('sHood', 0.17, (x0, y0, 1.5), coat, scale=(1, 1, 1.15))
    f = box('sFace', (0.2, 0.02, 0.24), (x0, y0 - 0.15, 1.48), capiz, bevel=0.02)
    eye = mat_basic('sEye', (0, 0, 0), 0.2)
    sphere('sEyeL', 0.018, (x0 - 0.04, y0 - 0.165, 1.5), eye)
    skin = mat_basic('sSkin', (0.55, 0.52, 0.48), 0.6)
    for s in (-1, 1):
        cyl('sArm%d' % s, 0.022, 1.2, (x0 + s * 0.22, y0, 0.75), skin, rot=(0, math.radians(s * 6), 0), verts=10)
        cyl('sLeg%d' % s, 0.03, 0.4, (x0 + s * 0.07, y0, 0.2), skin, verts=10)
    if STAGE == 4:
        point('glassGlow', (x0, y0 - 0.4, 1.4), 1.5, color=(0.6, 0.7, 1.0), radius=0.3)

if OPEN:
    import mathutils
    tgt = mathutils.Vector({1: (0.2, D + 11.3, 1.0), 2: (-1.2, D + 6.4, 1.0), 3: (0.55, D + 3.9, 0.8), 4: (0.25, D + 0.45, 1.3)}[STAGE])
    src = mathutils.Vector((0.15, 0.25, 1.45))
    rot = (tgt - src).to_track_quat('-Z', 'Y').to_euler()
    spot('flashlight', tuple(src), rot, 1400, angle=math.radians(16), color=(1.0, 0.93, 0.8), blend=0.6)
camera((-0.45, 0.1, 1.5), (0.1, D + 4, 1.1), lens=22)
render(out)
