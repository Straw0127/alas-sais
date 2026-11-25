import sys, os, math, random; sys.path.insert(0, '/home/claude/render')
from lib import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = a[0] if a else '/home/claude/render/out/curtain.png'
sc.cycles.samples = int(a[1]) if len(a) > 1 else 40
OPEN = '--open' in a
SILIP = '--silip' in a
STAGE = 2
for x in a:
    if x.startswith('--stage='): STAGE = int(x.split('=')[1])

W, D, H = 3.6, 3.2, 2.7
from pinoy import *
plaster = mat_tabla('tablaCur', paint=(0.3, 0.22, 0.16))
ceil = mat_noise('ceil', (0.2, 0.18, 0.16), (0.32, 0.3, 0.27), scale=2)
floor = mat_cement('cementCur')
room(W, D, H, plaster, floor, ceil)
wood = mat_planks('wood', (0.08, 0.04, 0.018), (0.11, 0.055, 0.025), scale=3, rough=0.4)

# big window in back wall
wall = bpy.data.objects['WallBack']
c = box('c', (2.4, 0.5, 1.9), (0, D, 1.25)); cut(wall, c)
glass = mat_basic('glass', (0.92, 0.95, 0.97), 0.03, trans=1.0)
box('glass', (2.4, 0.01, 1.9), (0, D + 0.02, 1.25), glass)
for x in (-1.2, 1.2):
    box('mull%.1f' % x, (0.06, 0.08, 1.9), (x, D + 0.02, 1.25), wood)
box('sill', (2.6, 0.2, 0.06), (0, D - 0.05, 0.3), wood)
box('top', (2.6, 0.12, 0.08), (0, D, 2.22), wood)

# curtains (pleated via wave displacement)
cur = mat_floral('bedsheet', (0.36, 0.2, 0.2), (0.15, 0.25, 0.4), (0.5, 0.45, 0.3), scale=9)
def curtain(name, x, width):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=80, y_subdivisions=4, size=1, location=(x, D - 0.16, 1.22), rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object; o.name = name; o.scale = (width, 2.05, 1)
    bpy.ops.object.transform_apply(scale=True)
    tx = bpy.data.textures.new(name + 't', 'WOOD'); tx.wood_type = 'BANDS'; tx.noise_basis_2 = 'SIN'; tx.noise_scale = 0.05 if width > 1 else 0.035
    md = o.modifiers.new('d', 'DISPLACE'); md.texture = tx; md.strength = 0.08; md.direction = 'Y'; md.texture_coords = 'OBJECT'
    o.modifiers.new('s', 'SOLIDIFY').thickness = 0.01
    bpy.ops.object.shade_smooth(); o.data.materials.append(cur)
    return o
ANIM = None
for _a in a:
    if _a.startswith('--anim='): ANIM = _a.split('=')[1]
if ANIM:
    cL = curtain('curL', -0.62, 1.3); cR = curtain('curR', 0.62, 1.3)
elif OPEN:
    curtain('curL', -1.25, 0.6); curtain('curR', 1.25, 0.6)
else:
    curtain('curL', -0.62, 1.3); curtain('curR', 0.62, 1.3)
alum = mat_basic('rod', (0.4, 0.4, 0.38), 0.3, metal=1)
cyl('rod', 0.003, 2.8, (0, D - 0.16, 2.26), mat_basic('string', (0.3, 0.28, 0.22), 0.9), rot=(0, math.radians(90), 0), verts=6)

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
cyl('trunk', 0.22, 4.4, (-2.6, D + 7.5, 2.2), bark, verts=16)
random.seed(7)
for i in range(9):
    s = sphere('foliage%d' % i, random.uniform(1.0, 1.6), (-2.6 + random.uniform(-1.5, 1.2), D + 7.5 + random.uniform(-1, 1), 4.6 + random.uniform(-0.3, 0.8)), leaf)
    md = s.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('lt%d' % i, 'CLOUDS'); t.noise_scale = 0.4; md.texture = t; md.strength = 0.5
clay = mat_noise('clay', (0.12, 0.05, 0.03), (0.2, 0.09, 0.05), scale=6)
sphere('banga', 0.35, (1.25, D + 3.9, 0.32), clay, scale=(1, 1, 0.95))
cyl('bangaNeck', 0.16, 0.12, (1.25, D + 3.9, 0.68), clay)
iron = mat_basic('gate', (0.03, 0.03, 0.03), 0.6, metal=0.5)
for i in range(18):
    cyl('bar%d' % i, 0.018, 1.8, (-3.4 + i * 0.4, D + 12, 0.9), iron, verts=8)
box('gateTop', (7.2, 0.05, 0.06), (0, D + 12, 1.75), iron)
box('wallFar', (30, 0.3, 1.5), (0, D + 12.3, 0.75), mat_noise('fence', (0.05, 0.05, 0.05), (0.09, 0.09, 0.09), scale=4))
ld = bpy.data.lights.new('moon', 'SUN'); ld.energy = 2.6; ld.color = (0.45, 0.6, 1.0); ld.angle = 0.02
mo = bpy.data.objects.new('moon', ld); mo.rotation_euler = (math.radians(55), 0, math.radians(200)); bpy.context.collection.objects.link(mo)
w = sc.world.node_tree.nodes['Background']; w.inputs[0].default_value = (0.002, 0.003, 0.006, 1)

grime(W, D, H, seed=11, n=9)
if SILIP:
    pos = {1: (0.2, D + 11.3), 2: (-1.2, D + 6.4), 3: (0.62, D + 3.6), 4: (0.2, D + 0.32)}[STAGE]
    x0, y0 = pos
    from entities import build_manananggal
    build_manananggal(x0, y0, 1.25 if STAGE < 4 else 1.15, wing=0.8 if STAGE == 4 else 1.0)
    if STAGE == 4:
        smear = mat_stain('smear', (0.75, 0.78, 0.8), scale=5, rough=0.2)
        for k, (hx, hz) in enumerate(((-0.35, 1.5), (0.6, 1.42), (-0.2, 1.05), (0.45, 1.85))):
            decal('hand%d' % k, smear, (x0 + hx, D + 0.012, hz), (0.2, 0.26), '-y')
        decal('fog', mat_stain('fogM', (0.8, 0.82, 0.85), scale=1.2, rough=0.1), (x0, D + 0.011, 1.72), (0.7, 0.55), '-y')

if OPEN:
    import mathutils
    tgt = mathutils.Vector({1: (0.2, D + 11.3, 1.0), 2: (-1.2, D + 6.4, 1.0), 3: (0.62, D + 3.6, 0.9), 4: (0.2, D + 0.3, 1.7)}[STAGE])
    src = mathutils.Vector((0.15, 0.25, 1.45))
    rot = (tgt - src).to_track_quat('-Z', 'Y').to_euler()
    spot('flashlight', tuple(src), rot, 3000 if STAGE < 4 else 350, angle=math.radians(16), color=(1.0, 0.93, 0.8), blend=0.6)
sc.view_settings.exposure = 0.0
cam = camera((-0.35, 1.2, 1.45), (0.55, D + 4, 1.05), lens=24)
if ANIM:
    N = int(os.environ.get('ANIM_N', 12))
    o, c = ((1, 0.46), (N, 0.46)) if False else (None, None)
    sx = (1.0, 0.46) if ANIM == 'open' else (0.46, 1.0)
    for obj, xs in ((cL, (-0.62, -1.25)), (cR, (0.62, 1.25))):
        a0, a1 = (xs if ANIM == 'open' else xs[::-1])
        key(obj, 'location', 1, (a0, obj.location.y, obj.location.z)); key(obj, 'location', N, (a1, obj.location.y, obj.location.z))
        key(obj, 'scale', 1, (sx[0], 1, 1)); key(obj, 'scale', N, (sx[1], 1, 1))
    render_anim(out, N)
else:
    render(out)
