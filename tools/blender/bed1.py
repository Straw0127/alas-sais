"""Chapter 1 bedroom (Lola's room): door, curtained window with iron grill, old aparador, bed.
usage: python3 bed1.py -- out.png SAMPLES --view=hub|door|window|cabinet [--curtain=open|closed] [--door=ajar|open|closed]
       [--silip=0..3] [--barang=0..4] [--kumot]"""
import sys, os, math, random; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
sc = reset()
A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = A[0] if A else '/tmp/bed1.png'
sc.cycles.samples = int(A[1]) if len(A) > 1 and A[1].isdigit() else 48
OPT = dict(a[2:].split('=', 1) if '=' in a else (a[2:], '1') for a in A if a.startswith('--'))
VIEW = OPT.get('view', 'hub'); CURT = OPT.get('curtain', 'closed'); DOOR = OPT.get('door', 'ajar')
SIL = int(OPT.get('silip', 0)); BAR = int(OPT.get('barang', 0)); KUMOT = 'kumot' in OPT

W, D, H = 4.0, 4.4, 2.75
from pinoy import *
from entities2 import build_barang, scatter_beetles, beetle_mat, group_at
plaster = mat_tabla('tablaBed', paint=(0.2, 0.27, 0.22))
floor = mat_planks('floor', (0.16, 0.08, 0.035), (0.22, 0.12, 0.05), scale=1.2)
room(W, D, H, plaster, floor, mat_plywood('plyBed'))
wood_dark = mat_planks('wood_dark', (0.07, 0.035, 0.015), (0.1, 0.05, 0.02), scale=3, rough=0.45)
narra = mat_planks('narra', (0.13, 0.05, 0.022), (0.2, 0.08, 0.035), scale=4, rough=0.35)
box('skirtB', (W, 0.02, 0.12), (0, D - 0.01, 0.06), wood_dark)
box('skirtL', (0.02, D, 0.12), (-W / 2 + 0.01, D / 2, 0.06), wood_dark)

# ---------------------------------------------------------------- door to the hallway (back wall)
dx = -0.35
cut(bpy.data.objects['WallBack'], box('c', (0.92, 0.5, 2.1), (dx, D, 1.05)))
box('jambL', (0.06, 0.16, 2.14), (dx - 0.49, D, 1.07), wood_dark)
box('jambR', (0.06, 0.16, 2.14), (dx + 0.49, D, 1.07), wood_dark)
box('jambT', (1.04, 0.16, 0.07), (dx, D, 2.14), wood_dark)
dim = mat_noise('hall', (0.035, 0.032, 0.03), (0.07, 0.06, 0.055), scale=3)
box('hallFloor', (3, 4, 0.1), (dx, D + 2.0, -0.05), floor)
box('hallBack', (3, 0.1, 2.8), (dx, D + 3.8, 1.4), dim)
box('hallL', (0.1, 4, 2.8), (dx - 0.9, D + 2.0, 1.4), dim)
box('hallR', (0.1, 4, 2.8), (dx + 0.9, D + 2.0, 1.4), dim)
box('hallC', (3, 4, 0.1), (dx, D + 2.0, 2.8), dim)
point('hallGlow', (dx + 0.7, D + 3.3, 2.2), 2.5, color=(0.6, 0.7, 1.0), radius=0.3)
door_mat = mat_planks('door', (0.2, 0.1, 0.045), (0.24, 0.13, 0.06), scale=2.5, rough=0.5)
bpy.ops.object.empty_add(location=(dx - 0.45, D - 0.05, 0)); hinge = bpy.context.active_object
parts = [box('doorPanel', (0.88, 0.045, 2.06), (dx - 0.01, D - 0.05, 1.03), door_mat, bevel=0.005)]
for i, z in enumerate((1.55, 0.6)):
    parts.append(box('panel%d' % i, (0.62, 0.02, 0.7), (dx - 0.01, D - 0.075, z), wood_dark, bevel=0.01))
brass = mat_basic('brass', (0.6, 0.42, 0.15), 0.3, metal=1.0)
parts.append(sphere('knob', 0.03, (dx + 0.35, D - 0.1, 1.0), brass))
scr = mat_stain('scratch', (0.02, 0.012, 0.006), scale=40, lo=0.55, hi=0.6)
parts.append(decal('scratchesDoor', scr, (dx + 0.1, D - 0.076, 1.25), (0.3, 0.6), '-y'))
for p in parts: p.parent = hinge; p.matrix_parent_inverse = hinge.matrix_world.inverted()
hinge.rotation_euler = (0, 0, math.radians({'ajar': -34, 'open': -80, 'closed': 0}[DOOR]))
sw = mat_basic('sw', (0.75, 0.7, 0.6), 0.5)
box('switch', (0.08, 0.02, 0.12), (dx + 0.75, D - 0.01, 1.3), sw, bevel=0.005)

# ---------------------------------------------------------------- wall dressing: calendar, crucifix, family photos
paper = mat_noise('paper', (0.62, 0.57, 0.46), (0.75, 0.7, 0.58), scale=20, bump=0.02)
box('cal', (0.34, 0.01, 0.48), (-1.35, D - 0.01, 1.55), paper)
box('calTop', (0.34, 0.012, 0.12), (-1.35, D - 0.012, 1.74), mat_basic('red', (0.4, 0.05, 0.03), 0.7))
box('crossV', (0.03, 0.02, 0.28), (0.75, D - 0.015, 1.95), wood_dark)
box('crossH', (0.16, 0.02, 0.03), (0.75, D - 0.015, 2.02), wood_dark)
bead = mat_basic('bead', (0.05, 0.03, 0.02), 0.4)
for i in range(22):
    a = i / 22 * 2 * math.pi
    sphere('b%d' % i, 0.011, (0.75 + 0.09 * math.sin(a), D - 0.02, 1.62 + 0.14 * math.cos(a)), bead)
def sepia(name, seed):
    m = mat_noise(name, (0.05, 0.035, 0.025), (0.2, 0.16, 0.11), scale=6 + seed, bump=0.0)
    return m
for i, (px, pz, w, h) in enumerate([(0.55, 1.35, 0.2, 0.26), (0.9, 1.4, 0.16, 0.2), (0.72, 1.08, 0.24, 0.18)]):
    framed('photo%d' % i, (px, D - 0.012, pz), (w, h), '-y', sepia('sep%d' % i, i))
# Lola's portrait above the bed, tilted, one corner of the glass broken
lola = mat_noise('lolaPhoto', (0.03, 0.022, 0.015), (0.15, 0.11, 0.08), scale=3, bump=0.0)
framed('lolaPortrait', (-W / 2 + 0.012, 1.6, 1.75), (0.42, 0.55), '+x', lola)
framed('lastSupper', (-W / 2 + 0.01, 3.1, 1.85), (1.0, 0.5), '+x', mat_last_supper())

# ---------------------------------------------------------------- bed with kulambo (left)
box('bedFrame', (1.1, 2.0, 0.35), (-1.4, 1.4, 0.2), wood_dark, bevel=0.01)
box('headboard', (1.1, 0.06, 1.0), (-1.4, 2.42, 0.5), wood_dark, bevel=0.01)
box('mattress', (1.0, 1.9, 0.2), (-1.4, 1.4, 0.47), mat_basic('matt', (0.55, 0.5, 0.42), 0.9), bevel=0.04)
bl = box('blanket', (1.16, 1.5, 0.08), (-1.4, 1.15, 0.6), mat_floral('blanket', (0.22, 0.05, 0.045), (0.42, 0.26, 0.08), (0.12, 0.14, 0.06)), bevel=0.04)
bl.modifiers.new('sub', 'SUBSURF').levels = 2
sphere('pillow', 0.22, (-1.4, 2.2, 0.64), mat_basic('pillow', (0.62, 0.58, 0.5), 0.95), scale=(1.6, 0.6, 0.4))
kulambo(-1.4, 1.4, 1.12, 2.0, 1.25)

# ---------------------------------------------------------------- window on the right wall: slid-open capiz, iron grill
WY, WZ0, WZ1, WWID = 2.15, 0.95, 2.05, 1.2
cut(bpy.data.objects['WallR'], box('cw', (0.5, WWID, WZ1 - WZ0), (W / 2, WY, (WZ0 + WZ1) / 2)))
box('wSill', (0.24, WWID + 0.12, 0.05), (W / 2 - 0.02, WY, WZ0 - 0.02), wood_dark)
box('wHead', (0.2, WWID + 0.12, 0.06), (W / 2, WY, WZ1 + 0.03), wood_dark)
for s in (-1, 1): box('wJamb%d' % s, (0.2, 0.05, WZ1 - WZ0), (W / 2, WY + s * (WWID / 2 + 0.02), (WZ0 + WZ1) / 2), wood_dark)
capiz = mat_basic('capiz', (0.85, 0.82, 0.7), 0.35)
_nt = capiz.node_tree; _tl = _nt.nodes.new('ShaderNodeBsdfTranslucent'); _tl.inputs['Color'].default_value = (0.9, 0.86, 0.75, 1)
_mx = _nt.nodes.new('ShaderNodeMixShader'); _mx.inputs['Fac'].default_value = 0.65
_nt.links.new(_nt.nodes['Principled BSDF'].outputs[0], _mx.inputs[1]); _nt.links.new(_tl.outputs[0], _mx.inputs[2])
_nt.links.new(_mx.outputs[0], _nt.nodes['Material Output'].inputs['Surface'])
# one capiz sash slid over the right part of the opening (the other is hidden in the wall)
for i in range(2):
    for j in range(4):
        box('cz%d%d' % (i, j), (0.01, 0.13, 0.25), (W / 2 + 0.05, WY + WWID / 2 - 0.08 - i * 0.15, WZ0 + 0.16 + j * 0.27), capiz)
box('sashV', (0.03, 0.025, WZ1 - WZ0), (W / 2 + 0.05, WY + WWID / 2 - 0.31, (WZ0 + WZ1) / 2), wood_dark)
iron = mat_noise('iron', (0.03, 0.025, 0.022), (0.12, 0.06, 0.03), scale=30, rough=0.55, bump=0.2)
iron.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.6
for k in range(9):
    cyl('bar%d' % k, 0.009, WZ1 - WZ0, (W / 2 + 0.11, WY - WWID / 2 + 0.07 + k * 0.133, (WZ0 + WZ1) / 2), iron, verts=10)
for z in (WZ0 + 0.3, WZ0 + 0.78):
    box('barH%d' % int(z * 100), (0.012, WWID, 0.03), (W / 2 + 0.11, WY, z), iron)
# the night yard outside: dirt, a talisay tree, hollow-block fence, a far house, an electric post
yard = mat_noise('yard', (0.02, 0.022, 0.015), (0.06, 0.06, 0.04), scale=4, bump=0.3)
box('yardGround', (14, 22, 0.1), (W / 2 + 7, 2, -0.45), yard)
box('fence', (0.2, 18, 1.9), (W / 2 + 5.2, 2.5, 0.5), mat_hollowblock('hbYard'))
bark = mat_noise('bark', (0.03, 0.022, 0.015), (0.08, 0.06, 0.04), scale=12, bump=0.5)
tx, ty = W / 2 + 2.7, 3.6
skin_pts = [(tx, ty, -0.4), (tx - 0.05, ty - 0.1, 1.4), (tx + 0.1, ty - 0.2, 2.6), (tx - 0.2, ty - 0.3, 3.6)]
from entities import skin_body
skin_body('trunk', skin_pts, [(0, 1), (1, 2), (2, 3)], [0.2, 0.16, 0.13, 0.08], bark, sub=2)
skin_body('branchLow', [(tx - 0.05, ty - 0.1, 1.25), (tx - 0.6, ty - 0.9, 1.35), (tx - 1.1, ty - 1.3, 1.55)], [(0, 1), (1, 2)], [0.09, 0.06, 0.03], bark, sub=2)
skin_body('branchHi', [(tx + 0.1, ty - 0.2, 2.3), (tx + 0.4, ty - 1.4, 2.9), (tx + 0.2, ty - 2.4, 3.2)], [(0, 1), (1, 2)], [0.08, 0.05, 0.025], bark, sub=2)
leaf = mat_noise('leaves', (0.006, 0.012, 0.006), (0.02, 0.035, 0.015), scale=14, bump=0.6)
rnd = random.Random(5)
for i in range(9):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=rnd.uniform(0.6, 1.0), location=(tx + rnd.uniform(-1.2, 1.0), ty + rnd.uniform(-2.6, 0.8), rnd.uniform(2.6, 3.9)))
    lo = bpy.context.active_object; dm = lo.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('lf%d' % i, 'CLOUDS'); t.noise_scale = 0.35; dm.texture = t; dm.strength = 0.5
    lo.data.materials.append(leaf)
far = mat_noise('farHouse', (0.02, 0.02, 0.022), (0.04, 0.04, 0.045), scale=3)
box('farHouse', (3, 4, 3), (W / 2 + 10, 0.5, 1.0), far)
box('farWin', (0.02, 0.5, 0.6), (W / 2 + 8.49, 0.2, 1.3), emission('farWinE', (1.0, 0.55, 0.25), 1.2))
cyl('post', 0.12, 7, (W / 2 + 7.5, 5.8, 3.0), mat_noise('postC', (0.1, 0.1, 0.1), (0.18, 0.17, 0.16), scale=6))
box('postX', (0.1, 1.4, 0.1), (W / 2 + 7.5, 5.8, 6.2), wood_dark)
wire = mat_basic('wire', (0.01, 0.01, 0.01), 0.6)
for k in (-0.6, 0.6):
    w_ = cyl('wire%d' % int(k * 10), 0.008, 16, (W / 2 + 7.5, 5.8 + k, 5.9), wire, rot=(0, math.radians(90), 0), verts=6)
ld = bpy.data.lights.new('moonSun', 'SUN'); ld.energy = 0.35; ld.color = (0.5, 0.62, 1.0); ld.angle = math.radians(2)
mo = bpy.data.objects.new('moonSun', ld); mo.rotation_euler = (math.radians(55), 0, math.radians(110)); bpy.context.collection.objects.link(mo)
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.003, 0.004, 0.009, 1)
skyM = bpy.data.materials.new('skyDrop'); skyM.use_nodes = True; _n2 = skyM.node_tree
_n2.nodes.remove(_n2.nodes['Principled BSDF']); _em = _n2.nodes.new('ShaderNodeEmission'); _em.inputs['Strength'].default_value = 1.0
_gr = _n2.nodes.new('ShaderNodeTexGradient'); _tc = _n2.nodes.new('ShaderNodeTexCoord'); _ramp = _n2.nodes.new('ShaderNodeValToRGB')
_n2.links.new(_tc.outputs['Generated'], _gr.inputs['Vector'])
_mp = _n2.nodes.new('ShaderNodeMapping'); _mp.inputs['Rotation'].default_value = (0, math.radians(-90), 0)
_n2.links.new(_tc.outputs['Generated'], _mp.inputs['Vector']); _n2.links.new(_mp.outputs['Vector'], _gr.inputs['Vector'])
_ramp.color_ramp.elements[0].color = (0.035, 0.045, 0.08, 1); _ramp.color_ramp.elements[1].color = (0.004, 0.005, 0.012, 1)
_n2.links.new(_gr.outputs['Fac'], _ramp.inputs['Fac']); _n2.links.new(_ramp.outputs['Color'], _em.inputs['Color'])
_n2.links.new(_em.outputs[0], _n2.nodes['Material Output'].inputs['Surface'])
sky = plane('skyDrop', (60, 30), (W / 2 + 26, 2, 6), (math.radians(90), 0, math.radians(90)), skyM); sky.visible_shadow = False
# the moon behind the window: small sharp area light so things outside cast hard shadows on the curtain
area('moonWin', (W / 2 + 3.4, WY - 0.1, 1.75), (0, math.radians(84), 0), 1000, size=(0.12, 0.12), color=(0.5, 0.62, 1.0))
area('roomSpill', (W / 2 - 1.0, WY, 1.75), (0, math.radians(-80), 0), 6, size=(0.8, 0.8), color=(1.0, 0.65, 0.35))

# curtains: thin floral cloth, moonlight shows through it
def curtain_mat():
    m = mat_floral('winCurtain', (0.45, 0.12, 0.14), (0.6, 0.45, 0.3), (0.3, 0.05, 0.08), scale=10)
    nt = m.node_tree; tl = nt.nodes.new('ShaderNodeBsdfTranslucent'); tl.inputs['Color'].default_value = (0.55, 0.2, 0.18, 1)
    mx = nt.nodes.new('ShaderNodeMixShader'); mx.inputs['Fac'].default_value = 0.72
    nt.links.new(nt.nodes['Principled BSDF'].outputs[0], mx.inputs[1]); nt.links.new(tl.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m
cm = curtain_mat()
def curtain_panel(name, yc, width, folds):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=60, y_subdivisions=6, size=1, location=(0, 0, 0))
    c = bpy.context.active_object; c.name = name; c.scale = (width, 1.3, 1); bpy.ops.object.transform_apply(scale=True)
    t = bpy.data.textures.new(name + 'T', 'WOOD'); t.wood_type = 'BANDS'; t.noise_basis_2 = 'SIN'; t.noise_scale = width / folds
    dm = c.modifiers.new('d', 'DISPLACE'); dm.texture = t; dm.strength = 0.06; dm.direction = 'Z'; dm.texture_coords = 'OBJECT'
    c.modifiers.new('s', 'SOLIDIFY').thickness = 0.004
    c.data.materials.append(cm)
    c.rotation_euler = (math.radians(90), 0, math.radians(90)); c.location = (W / 2 - 0.1, yc, 1.48)
    bpy.ops.object.shade_smooth()
cyl('rod', 0.012, WWID + 0.6, (W / 2 - 0.1, WY, 2.16), brass, rot=(math.radians(90), 0, 0), verts=12)
if CURT == 'closed':
    curtain_panel('curtL', WY - WWID / 4 - 0.04, WWID / 2 + 0.16, 7); curtain_panel('curtR', WY + WWID / 4 + 0.04, WWID / 2 + 0.16, 7)
else:
    curtain_panel('curtL', WY - WWID / 2 - 0.12, 0.3, 6); curtain_panel('curtR', WY + WWID / 2 + 0.12, 0.3, 6)

# ---------------------------------------------------------------- Lola's aparador (right wall, back corner)
AX, AY, AW, AD, AH = W / 2 - 0.3, 3.62, 1.0, 0.56, 1.85
fx = AX - AD / 2                              # front plane (faces -x, into the room)
z0 = 0.1
box('apBack', (0.03, AW, AH), (AX + AD / 2 - 0.015, AY, z0 + AH / 2), narra)
for s in (-1, 1): box('apSide%d' % s, (AD, 0.03, AH), (AX, AY + s * (AW / 2 - 0.015), z0 + AH / 2), narra)
box('apTop', (AD + 0.06, AW + 0.06, 0.05), (AX, AY, z0 + AH + 0.025), narra, bevel=0.01)
box('apCrown', (0.04, AW + 0.04, 0.12), (fx - 0.01, AY, z0 + AH - 0.02), narra, bevel=0.01)
box('apBottom', (AD, AW, 0.05), (AX, AY, z0 + 0.025), narra)
for s in (-1, 1):
    for t in (-1, 1): box('apLeg%d%d' % (s, t), (0.05, 0.05, 0.1), (AX + t * (AD / 2 - 0.04), AY + s * (AW / 2 - 0.04), 0.05), narra)
interior = mat_basic('apInside', (0.012, 0.008, 0.006), 0.9)
box('apInterior', (0.01, AW - 0.06, AH - 0.1), (AX + AD / 2 - 0.04, AY, z0 + AH / 2), interior)
cyl('apRod', 0.01, AW - 0.08, (AX + 0.05, AY, z0 + AH - 0.2), brass, rot=(math.radians(90), 0, 0), verts=8)
dress = [mat_noise('dr%d' % i, c1, c2, scale=10, rough=0.9, bump=0.1) for i, (c1, c2) in enumerate([((0.1, 0.06, 0.05), (0.18, 0.1, 0.08)), ((0.05, 0.06, 0.08), (0.09, 0.1, 0.13)), ((0.12, 0.11, 0.08), (0.2, 0.19, 0.14))])]
for i in range(5):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(AX + 0.05, AY - 0.38 + i * 0.19, z0 + AH - 0.75))
    p = bpy.context.active_object; p.scale = (0.4, 1, 1.1); p.rotation_euler = (math.radians(90), 0, math.radians(80 + i * 5))
    t = bpy.data.textures.new('drT%d' % i, 'WOOD'); t.wood_type = 'BANDS'; t.noise_scale = 0.08
    sb = p.modifiers.new('sub', 'SUBSURF'); sb.levels = 4; sb.subdivision_type = 'SIMPLE'
    dm = p.modifiers.new('d', 'DISPLACE'); dm.texture = t; dm.strength = 0.05; dm.texture_coords = 'OBJECT'
    p.data.materials.append(dress[i % 3])
# doors: right door hinged at the back-right edge, swings toward the room as Barang pushes it
DH = AH - 0.12
mirror = mat_basic('apMirror', (0.55, 0.57, 0.6), 0.06, metal=1.0)
silver = mat_stain('mirrorRot', (0.08, 0.07, 0.05), scale=7, lo=0.45, hi=0.62)
def ap_door(name, hy, sign, angle):
    bpy.ops.object.empty_add(location=(fx - 0.015, hy, 0)); e = bpy.context.active_object
    cy = hy - sign * (AW / 4)
    ps = [box(name + 'P', (0.025, AW / 2 - 0.01, DH), (fx - 0.015, cy, z0 + 0.06 + DH / 2), narra, bevel=0.006),
          box(name + 'Frame', (0.012, AW / 2 - 0.08, DH - 0.12), (fx - 0.03, cy, z0 + 0.06 + DH / 2), wood_dark, bevel=0.01),
          sphere(name + 'Knob', 0.016, (fx - 0.045, hy - sign * (AW / 2 - 0.06), z0 + 0.95), brass)]
    if sign > 0:
        ps.append(box(name + 'Mirror', (0.006, AW / 2 - 0.16, 1.05), (fx - 0.04, cy, z0 + 1.0), mirror))
        ps.append(decal(name + 'Rot', silver, (fx - 0.044, cy, z0 + 1.15), (0.3, 0.6), '-x'))
    for p in ps: p.parent = e; p.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, 0, math.radians(angle))
ang = {0: 0, 1: 6, 2: 14, 3: 26, 4: 62}[BAR]
ap_door('apDoorR', AY + AW / 2, 1, -ang)
ap_door('apDoorL', AY - AW / 2, -1, 9 if BAR >= 4 else 0)
from pinoy import santo_nino
santo_nino(AX, AY - 0.2, z0 + AH + 0.05)
if BAR >= 1:   # beetles creeping out of the gap onto the door
    bm = beetle_mat()
    scatter_beetles('gap', (fx - 0.035, AY + 0.04, 1.0), (0.12, 0.9), {1: 5, 2: 16, 3: 26, 4: 40}[BAR], 'x', seed=21, mat=bm)
    if BAR >= 2: scatter_beetles('floorB', (fx - 0.3, AY, 0.012), (0.5, 0.6), {2: 4, 3: 10, 4: 18}[BAR], 'z', seed=8, mat=bm, s=1.1)
if BAR >= 2:
    build_barang((AX - 0.02, AY + 0.15, 0), rotz=math.radians(-90), stage=BAR, right_hand=False)
if BAR >= 3:
    # long grey fingers curled around the free edge of the closed door, coming from inside the gap
    from entities import skin_body, mat_skin
    fskin = mat_skin('brFing', (0.12, 0.1, 0.075), (0.24, 0.2, 0.15), sss=0.15, rough=0.7)
    nailm = mat_basic('brNail2', (0.06, 0.05, 0.035), 0.3)
    ey = AY                                  # free edge of the closed door
    for i, z in enumerate((1.02, 1.065, 1.11, 1.155)):
        L = 1.0 if i in (1, 2) else 0.85
        pts = [(fx + 0.09, ey + 0.05, z - 0.01), (fx + 0.03, ey + 0.012, z), (fx - 0.012, ey - 0.002, z), (fx - 0.03, ey - 0.03 * L, z + 0.002), (fx - 0.033, ey - 0.07 * L, z - 0.004)]
        skin_body('brFinger%d' % i, pts, [(k, k + 1) for k in range(4)], [0.012, 0.0105, 0.0095, 0.008, 0.006], fskin, sub=2)
        tip = (fx - 0.034, ey - 0.07 * L - 0.012, z - 0.006)
        sphere('brNailT%d' % i, 0.007, tip, nailm, scale=(0.5, 1.6, 0.5))
    skin_body('brWrist', [(fx + 0.25, ey + 0.12, 1.0), (fx + 0.09, ey + 0.05, 1.08)], [(0, 1)], [0.03, 0.026], fskin, sub=2)

# ---------------------------------------------------------------- room props
cord = mat_basic('cord', (0.02, 0.02, 0.02), 0.6)
cyl('cord', 0.006, 0.55, (0.1, 2.3, H - 0.275), cord)
glass = mat_basic('bulbGlass', (1, 0.85, 0.6), 0.1, emit=(1.0, 0.62, 0.28), emit_str=18)
bb = sphere('bulb', 0.055, (0.1, 2.3, H - 0.6), glass, scale=(1, 1, 1.25)); bb.visible_shadow = False
point('bulbLight', (0.1, 2.3, H - 0.62), 44, color=(1.0, 0.62, 0.3), radius=0.04)
point('fill', (0.0, 0.4, 2.2), 2.5, color=(1.0, 0.7, 0.45), radius=0.8)
gi_roof(W, D, H)
monobloc(0.9, 0.9, rotz=math.radians(160))
clothesline(-1.95, -0.9, D - 0.25, 2.05, n=3)
wire_run([(dx + 0.75, D - 0.02, 1.36), (dx + 0.75, D - 0.02, H - 0.02), (0.1, D - 0.02, H - 0.02), (0.1, 2.3, H - 0.02)])
# (the rolled banig read as a white pipe on the floor, removed)
metal = mat_basic('fanmetal', (0.08, 0.09, 0.1), 0.35, metal=0.6)
cyl('fanBase', 0.2, 0.04, (1.45, 0.55, 0.02), metal); cyl('fanPole', 0.02, 1.1, (1.45, 0.55, 0.57), metal)
cage = cyl('fanCage', 0.24, 0.14, (1.45, 0.55, 1.2), metal, rot=(math.radians(90), 0, math.radians(35)), verts=24)
cage.modifiers.new('w', 'WIREFRAME').thickness = 0.006
grime(W, D, H, seed=3, n=12)
# claw scratches on the floor in front of the aparador, and a dark stain by the window
decal('floorScratch', scr, (fx - 0.35, AY - 0.1, 0.003), (0.4, 0.3), 'z')
decal('winStain', mat_stain('winStain', (0.05, 0.03, 0.02), scale=3), (W / 2 - 0.006, WY, 0.6), (0.9, 0.7), '-x')

# ---------------------------------------------------------------- entities
from entities import build_manananggal
def silip_at(loc, rotz, wing):
    before = set(o.name for o in bpy.data.objects)
    build_manananggal(0, 0, 0, wing=wing)
    for o in bpy.data.objects:   # darker, less glowing wing membranes
        if o.name.startswith('wing') and o.type == 'MESH' and o.data.materials:
            b = o.data.materials[0].node_tree.nodes['Principled BSDF']
            b.inputs['Transmission Weight'].default_value = 0.0
            try: b.inputs['Subsurface Weight'].default_value = 0.05
            except Exception: pass
    return group_at(before, loc, rotz)
if SIL == 1:     # far: hovering above the fence line
    silip_at((W / 2 + 5.0, WY + 0.7, 1.65), math.radians(-90), 1.0)
    point('silKey1', (W / 2 + 4.0, WY + 0.2, 2.2), 4, color=(0.6, 0.7, 1.0), radius=0.3)
elif SIL == 2:   # in the talisay tree, close
    silip_at((tx + 0.3, ty - 1.3, 1.95), math.radians(-100), 0.8)
    point('silKey2', (tx - 1.3, ty - 1.4, 2.5), 2.5, color=(0.6, 0.7, 1.0), radius=0.3)
elif SIL == 3:   # at the window grill
    silip_at((W / 2 + 0.55, WY, 1.12), math.radians(-90), 0.55)
if KUMOT:
    from entities import build_kumot_batibat
    build_kumot_batibat(-0.2, 3.45)

if 'morning' in OPT:   # 6:00 AM: bulb off, sun through the open window, the yard bright
    for n_ in ('bulbLight', 'fill', 'hallGlow', 'roomSpill'): bpy.data.objects[n_].data.energy = 0
    bpy.data.objects['bulb'].active_material.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0
    sun = bpy.data.objects['moonSun']; sun.data.energy = 4.5; sun.data.color = (1.0, 0.82, 0.6); sun.rotation_euler = (math.radians(70), 0, math.radians(95))
    bpy.data.objects['moonWin'].data.energy = 0
    area('dawnWin', (W / 2 + 0.6, WY, 1.7), (0, math.radians(100), 0), 2200, size=(1.1, 1.0), color=(1.0, 0.8, 0.55))
    area('dawnFill', (0.0, 2.0, H - 0.15), (0, 0, 0), 160, size=(2.5, 2.5), color=(1.0, 0.86, 0.7))
    sc.view_settings.exposure = 0.25
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.45, 0.6, 1); sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.8
    skyN = bpy.data.materials['skyDrop'].node_tree.nodes
    for n_ in skyN:
        if n_.type == 'VALTORGB': n_.color_ramp.elements[0].color = (1.0, 0.75, 0.5, 1); n_.color_ramp.elements[1].color = (0.45, 0.6, 0.85, 1)
        if n_.type == 'EMISSION': n_.inputs['Strength'].default_value = 3.0
# ---------------------------------------------------------------- cameras
if VIEW == 'hub':
    camera((0.25, -0.15, 1.6), (0.75, 4.4, 1.28), lens=17)
elif VIEW == 'door':
    camera((dx + 0.08, D - 1.25, 1.56), (dx, D + 3.6, 1.42), lens=24)
    point('viewFill', (dx + 0.5, D - 1.6, 1.9), 5, color=(1.0, 0.65, 0.35), radius=0.3)
elif VIEW == 'window':
    camera((0.15, WY - 0.05, 1.52), (W / 2 + 1, WY, 1.48), lens=22)
elif VIEW == 'scare':
    camera((fx - 0.85, AY + 0.05, 1.4), (fx + 0.1, AY + 0.14, 1.36), lens=30); OPT['lit'] = '1'
elif VIEW == 'hero':
    camera((fx - 1.15, AY - 0.15, 1.35), (fx, AY + 0.12, 1.3), lens=34); OPT['lit'] = '1'
elif VIEW == 'cabinet':
    camera((-0.35, AY - 0.45, 1.55), (W / 2, AY + 0.3, 1.1), lens=26)
    point('viewFill', (0.0, AY - 0.6, 2.0), 9, color=(1.0, 0.65, 0.35), radius=0.4)
if 'lit' in OPT:   # the player's flashlight, from the camera
    import mathutils
    cam = bpy.context.scene.camera; src = cam.location.copy() + mathutils.Vector((0.15, -0.1, -0.15))
    tgt = {'scare': (fx, AY + 0.14, 1.4), 'hero': (fx, AY + 0.12, 1.3), 'cabinet': (fx, AY + 0.1, 1.25), 'door': (dx, D + 1.5, 1.3), 'hub': (0.3, 3.8, 1.2), 'window': (W / 2 + 0.6, WY, 1.45)}[VIEW]
    spot('flash', tuple(src), (mathutils.Vector(tgt) - src).to_track_quat('-Z', 'Y').to_euler(), 160, angle=math.radians(44), color=(1.0, 0.93, 0.8), blend=0.75) if VIEW != 'scare' else spot('flash', (fx - 0.55, AY - 0.25, 0.85), (mathutils.Vector((fx, AY + 0.12, 1.45)) - mathutils.Vector((fx - 0.55, AY - 0.25, 0.85))).to_track_quat('-Z', 'Y').to_euler(), 14, angle=math.radians(40), color=(1.0, 0.8, 0.65), blend=0.8)
render(out)
