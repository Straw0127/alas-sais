import os
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
# ---------------------------------------------------------------- the rest of the house: ONE house for every view
# The kitchen and the living room are built first (so their scripts find their own walls by name), renamed with a
# prefix, and placed once the hallway below is laid out. --hall=lit: the house lights are on (Chapter 2/3).
from rooms import build_kitchen, build_living
HOUSE_LIT = OPT.get('hall', 'dark') == 'lit'
SALA = OPT.get('sala', 'dark')
def _built(fn, prefix, **kw):
    before = set(o.name for o in bpy.data.objects)
    dims = fn(**kw)
    objs = [o for o in bpy.data.objects if o.name not in before]
    for o in objs: o.name = prefix + o.name
    bpy.ops.object.empty_add(location=(0, 0, 0)); e = bpy.context.active_object; e.name = prefix + 'root'
    for o in objs:
        if o.parent is None: o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    return e, dims
KIT, KDIM = _built(build_kitchen, 'k_', KAL='kal' in OPT, LIT=HOUSE_LIT, KALIN='kalin' in OPT)
LIV, LDIM = _built(build_living, 'l_', MALIK='malik' in OPT and OPT.get('view') != 'sofa', LIGHTS=SALA == 'lights' or 'lights' in OPT, TVOFF=not (SALA == 'tv' or 'tv' in OPT), LIT=HOUSE_LIT)
bpy.data.objects.remove(bpy.data.objects['l_WallFront'], do_unlink=True)      # the hallway wall is the living room's front wall
bpy.data.objects['l_WallL'].location.x += 0.1                                  # back to back with the kitchen wall, not overlapping
bpy.data.objects['k_WallFront'].location.y = -0.05
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
# The hallway, matching the hallway scene of the house: the bedroom door is on its left wall. Leaning out of the bedroom,
# the hall runs to the kitchen at the end; the sala door is on the opposite wall a little further down, seen at an angle;
# the back door with the red curtain is behind you.
hallW = mat_tabla('tablaHallB', paint=(0.3, 0.26, 0.2))
def HXP(sv): return dx - sv            # distance along the hall from the bedroom door (toward the kitchen) -> x
HY0, HY1 = D, D + 1.3; CY = (HY0 + HY1) / 2
XK, XB = HXP(4.3), HXP(-2.2)           # kitchen end, back end
box('hallFloor', (XB - XK, HY1 - HY0, 0.1), ((XK + XB) / 2, CY, -0.05), mat_cement('hallCem'))
box('hallCeil', (XB - XK, HY1 - HY0, 0.1), ((XK + XB) / 2, CY, 2.7), mat_plywood('hallPly'))
opp = box('hallOpp', (XB - XK, 0.1, 2.7), ((XK + XB) / 2, HY1 + 0.05, 1.35), hallW)
LX = HXP(1.4); CX = HXP(-1.2)          # sala door and the curtained back door, both on the opposite wall
cut(opp, box('salaDoor', (0.85, 0.5, 2.05), (LX, HY1 + 0.05, 1.02))); cut(opp, box('backDoor', (0.85, 0.5, 2.05), (CX, HY1 + 0.05, 1.02)))
box('hallNearL', ((-W / 2) - XK, 0.1, 2.7), ((XK - W / 2) / 2, HY0 - 0.05, 1.35), hallW)
box('hallNearR', (XB - W / 2, 0.1, 2.7), ((XB + W / 2) / 2, HY0 - 0.05, 1.35), hallW)
box('hallEndB', (0.1, HY1 - HY0, 2.7), (XB + 0.05, CY, 1.35), hallW)
frame = mat_planks('hframe', (0.07, 0.035, 0.015), (0.1, 0.05, 0.02), scale=3, rough=0.45)
photo = mat_noise('hphoto', (0.1, 0.09, 0.08), (0.35, 0.3, 0.25), scale=25)
rr = random.Random(4)
for i_, (sv, z) in enumerate(((2.2, 1.6), (2.7, 1.55))):     # family photos on the bedroom-side wall, further down
    f_ = box('hpf%d' % i_, (0.26, 0.02, 0.32), (HXP(sv), HY0 + 0.015, z), frame, rot=(0, math.radians(rr.uniform(-6, 6)), 0))
    box('hpp%d' % i_, (0.2, 0.005, 0.26), (HXP(sv), HY0 + 0.028, z), photo, rot=f_.rotation_euler)
gl = mat_basic('hbulb', (1, 0.85, 0.6), 0.1, emit=(1.0, 0.6, 0.3), emit_str=6)
# Chapter 1: the rest of the house is dark, only the bedroom light spills out and the flashlight finds the rest.
# --hall=lit (Chapter 3, nights 1-4): the hall bulb, and the moon in the kitchen and sala windows
HALL_LIT = OPT.get('hall', 'dark') == 'lit'
hb = sphere('hallBulb', 0.045, (HXP(1.0), CY, 2.3), gl if HALL_LIT else mat_basic('hbDead', (0.5, 0.45, 0.35), 0.1)); hb.visible_shadow = False
if HALL_LIT: point('hallBulbL', (HXP(1.0), CY, 2.28), 10, color=(1.0, 0.6, 0.3), radius=0.04)
wire_run([(XB, HY1 - 0.02, 2.68), (XK, HY1 - 0.02, 2.68)])
if 'tv' in OPT or SALA == 'tv':   # the TV's flicker spills out of the living room door into the hall
    point('tvSpill', (LX, HY1 + 0.7, 1.0), 30, color=(0.5, 0.78, 1.0), radius=0.35)
# place the real kitchen (its hall doorway on the hall's axis) and the real living room (behind the sala door)
KIT.rotation_euler = (0, 0, math.radians(-90)); KIT.location = (XK - KDIM[1] - 0.1, CY + 1.3, 0)
LIV.location = (LX - 0.4, HY1 + 0.1, 0)
def KW(kx, ky, z):   # kitchen-local (as in kitchen.py) -> house
    return (ky + XK - KDIM[1] - 0.1, -kx + CY + 1.3, z)
def LW(lx, ly, z):   # living-local (as in living.py) -> house
    return (lx + LX - 0.4, ly + HY1 + 0.1, z)
# the back door with the same red floral curtain as the bedroom window (behind you when you lean out)
bcm = mat_floral('backCurtain', (0.45, 0.12, 0.14), (0.6, 0.45, 0.3), (0.3, 0.05, 0.08), scale=10)
_bn = bcm.node_tree; _bt = _bn.nodes.new('ShaderNodeBsdfTranslucent'); _bt.inputs['Color'].default_value = (0.55, 0.2, 0.18, 1)   # same see-through cloth as the bedroom curtain
_bm = _bn.nodes.new('ShaderNodeMixShader'); _bm.inputs['Fac'].default_value = 0.72
_bn.links.new(_bn.nodes['Principled BSDF'].outputs[0], _bm.inputs[1]); _bn.links.new(_bt.outputs[0], _bm.inputs[2]); _bn.links.new(_bm.outputs[0], _bn.nodes['Material Output'].inputs['Surface'])
for s_ in (-1, 1):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=40, y_subdivisions=6, size=1, location=(0, 0, 0))
    cc = bpy.context.active_object; cc.scale = (0.46, 1.9, 1); bpy.ops.object.transform_apply(scale=True)
    tt = bpy.data.textures.new('bct%d' % s_, 'WOOD'); tt.wood_type = 'BANDS'; tt.noise_basis_2 = 'SIN'; tt.noise_scale = 0.06
    dmm = cc.modifiers.new('d', 'DISPLACE'); dmm.texture = tt; dmm.strength = 0.05; dmm.texture_coords = 'OBJECT'
    cc.modifiers.new('s', 'SOLIDIFY').thickness = 0.004; cc.data.materials.append(bcm); cc.name = 'bcCurtain%d' % s_
    cc.rotation_euler = (math.radians(90), 0, 0); cc.location = (CX + s_ * 0.21, HY1 - 0.02, 1.02)
    if OPT.get('hcurtain', 'closed') == 'open': cc.scale = (0.45, 1, 1); cc.location.x = CX + s_ * 0.52   # drawn aside
# the back door itself: a jalousie-glass door, shut; beyond it the back yard (Chapter 2: Silip comes from there)
jal_ = mat_basic('bdJal', (0.55, 0.6, 0.62), 0.05, trans=1.0)
for _in in ('Specular IOR Level', 'Specular'):   # see-through without mirroring the torch or the lamps
    if _in in jal_.node_tree.nodes['Principled BSDF'].inputs: jal_.node_tree.nodes['Principled BSDF'].inputs[_in].default_value = 0.0
bdf_ = mat_planks('bdFrame', (0.18, 0.12, 0.07), (0.22, 0.15, 0.09), scale=3)
for sx_ in (-1, 1): box('bdStile%d' % sx_, (0.07, 0.05, 2.04), (CX + sx_ * 0.39, HY1 + 0.08, 1.02), bdf_)
box('bdRailT', (0.85, 0.05, 0.08), (CX, HY1 + 0.08, 2.0), bdf_); box('bdRailB', (0.85, 0.05, 0.5), (CX, HY1 + 0.08, 0.25), bdf_)
for j_ in range(11): box('bdSlat%d' % j_, (0.72, 0.012, 0.12), (CX, HY1 + 0.08, 0.6 + j_ * 0.125), jal_, rot=(math.radians(-20), 0, 0))
box('yard', (16, 14, 0.1), (CX + 1.0, HY1 + 7.2, -0.08), mat_noise('yardDirt', (0.05, 0.045, 0.035), (0.09, 0.08, 0.06), scale=4, bump=0.3))
bam_ = mat_planks('bakod', (0.18, 0.15, 0.08), (0.24, 0.2, 0.11), scale=6)
box('bakod', (16, 0.06, 1.7), (CX + 1.0, HY1 + 9.5, 0.85), bam_)
cyl('yardTrunk', 0.18, 4.2, (CX - 2.2, HY1 + 7.0, 2.1), mat_noise('yTrunk', (0.05, 0.04, 0.03), (0.09, 0.07, 0.05), scale=6), verts=12)
sphere('yardCanopy', 1.8, (CX - 2.2, HY1 + 7.0, 4.6), mat_noise('yLeaves', (0.02, 0.04, 0.02), (0.04, 0.07, 0.03), scale=3), scale=(1.3, 1.1, 0.8))
area('yardMoon', (CX + 3.5, HY1 + 6.0, 5.0), (math.radians(-40), 0, math.radians(235)), 45, size=(4, 4), color=(0.45, 0.58, 1.0))
door_mat = mat_planks('door', (0.2, 0.1, 0.045), (0.24, 0.13, 0.06), scale=2.5, rough=0.5)
bpy.ops.object.empty_add(location=(dx - 0.45, D - 0.05, 0)); hinge = bpy.context.active_object   # hung on the left jamb (seen from the room)
parts = [box('doorPanel', (0.88, 0.045, 2.06), (dx + 0.01, D - 0.05, 1.03), door_mat, bevel=0.005)]
for i, z in enumerate((1.55, 0.6)):
    parts.append(box('panel%d' % i, (0.62, 0.02, 0.7), (dx + 0.01, D - 0.075, z), wood_dark, bevel=0.01))
brass = mat_basic('brass', (0.6, 0.42, 0.15), 0.3, metal=1.0)
parts.append(sphere('knob', 0.03, (dx + 0.35, D - 0.1, 1.0), brass))
scr = mat_stain('scratch', (0.02, 0.012, 0.006), scale=40, lo=0.55, hi=0.6)
parts.append(decal('scratchesDoor', scr, (dx + 0.1, D - 0.076, 1.25), (0.3, 0.6), '-y'))
for p in parts: p.parent = hinge; p.matrix_parent_inverse = hinge.matrix_world.inverted()
PEEK = int(OPT.get('peek', -1))
if PEEK >= 0: DOOR = 'peek'
SWING = 0 if DOOR == 'closed' and VIEW == 'door' else (int(DOOR[2:]) if DOOR.startswith('sw') else None)
# closing the door is one continuous move: you step back from the doorway into the room as the real door swings shut
# in front of you. Each frame name is a step of that move: camera spot, door angle, and how far the gaze has turned to the door.
SW_ANG = {80: 70, 62: 56, 46: 42, 32: 28, 18: 14, 0: 0}   # the closing frames (names kept for the game): door angle
hinge.rotation_euler = (0, 0, -math.radians(SW_ANG[SWING] if SWING is not None else {'ajar': 84, 'gap': 84, 'peek': 84, 'open': 92, 'closed': 0}[DOOR]))
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
if VIEW == 'under':   # an open bed frame you can lie under: legs, rails, slats
    for lx_ in (-1.92, -0.88):
        for ly_ in (0.43, 2.37): box('bedLeg%d%d' % (int(lx_ * 10), int(ly_ * 10)), (0.06, 0.06, 0.38), (lx_, ly_, 0.19), wood_dark)
    for lx_ in (-1.93, -0.87): box('bedRail%d' % int(lx_ * 10), (0.04, 2.0, 0.12), (lx_, 1.4, 0.32), wood_dark)
    for k_ in range(9): box('slat%d' % k_, (1.06, 0.09, 0.02), (-1.4, 0.5 + k_ * 0.23, 0.37), mat_planks('slatW', (0.1, 0.06, 0.03), (0.14, 0.08, 0.04), scale=4))
    box('mattUnder', (1.0, 1.9, 0.04), (-1.4, 1.4, 0.4), mat_basic('mattU', (0.3, 0.27, 0.22), 0.95))
    # the blanket hanging down over the open side
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=50, y_subdivisions=8, size=1, location=(0, 0, 0))
    hb_ = bpy.context.active_object; hb_.scale = (1.7, 0.42, 1); bpy.ops.object.transform_apply(scale=True)
    t_ = bpy.data.textures.new('hangT', 'WOOD'); t_.wood_type = 'BANDS'; t_.noise_basis_2 = 'SIN'; t_.noise_scale = 0.12
    dm_ = hb_.modifiers.new('d', 'DISPLACE'); dm_.texture = t_; dm_.strength = 0.04; dm_.texture_coords = 'OBJECT'
    hb_.rotation_euler = (math.radians(90), 0, math.radians(90)); hb_.location = (-0.84, 1.25, 0.43)
    hb_.data.materials.append(mat_floral('blanketHang', (0.22, 0.05, 0.045), (0.42, 0.26, 0.08), (0.12, 0.14, 0.06)))
    scatter = mat_noise('dust', (0.05, 0.04, 0.03), (0.09, 0.07, 0.05), scale=30)
    if False: box('slipperU', (0.1, 0.26, 0.03), (-0.5, 2.0, 0.015), mat_basic('slipU', (0.32, 0.26, 0.2), 0.9), rot=(0, 0, 0.6), bevel=0.02)
else:
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
ang = {0: 0, 1: 22, 2: 42, 3: 64, 4: 88}[BAR]   # wide enough to see from the middle of the room
ap_door('apDoorR', AY + AW / 2, 1, -ang)
ap_door('apDoorL', AY - AW / 2, -1, 9 if BAR >= 4 else 0)
from pinoy import santo_nino
santo_nino(AX, AY - 0.2, z0 + AH + 0.05)
if BAR >= 1:   # beetles creeping out of the gap onto the door
    bm = beetle_mat()
    scatter_beetles('gap', (fx - 0.035, AY + 0.04, 1.0), (0.12, 0.9), {1: 5, 2: 16, 3: 26, 4: 40}[BAR], 'x', seed=21, mat=bm)
    if BAR >= 2: scatter_beetles('floorB', (fx - 0.3, AY, 0.012), (0.5, 0.6), {2: 4, 3: 10, 4: 18}[BAR], 'z', seed=8, mat=bm, s=1.1)
if BAR >= 2 and not OPT.get('js'):
    build_barang((AX - 0.02, AY + 0.15, 0), rotz=math.radians(-90), stage=BAR, right_hand=False)
if BAR >= 3 and not OPT.get('js'):
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
HS = int(OPT.get('hsilip', 0))
if HS:
    hp_ = {1: ((CX + 0.6, HY1 + 9.2, 2.3), 1.0), 2: ((CX - 0.9, HY1 + 5.2, 1.7), 1.0), 3: ((CX + 0.25, HY1 + 2.3, 1.45), 1.0), 4: ((CX + 0.05, HY1 + 0.45, 1.25), 0.8)}[HS]
    silip_at(hp_[0], 0.0, hp_[1])
    if OPT.get('hcurtain', 'closed') == 'open': hk_ = point('hsKey', (hp_[0][0] + 0.5, hp_[0][1] - 0.9 if HS < 4 else HY1 + 0.15, hp_[0][2] + 0.6), 5 if HS < 4 else 2, color=(0.6, 0.7, 1.0), radius=0.3); hk_.visible_glossy = False
    elif HS >= 3: hb_ = point('hsBack', (CX + 0.05, hp_[0][1] + 1.1, 1.45), 260, color=(0.55, 0.65, 1.0), radius=0.02); hb_.visible_glossy = False   # her shadow on the curtain
if SIL == 1:     # far: hovering above the fence line
    silip_at((W / 2 + 5.0, WY + 0.7, 1.65), math.radians(-90), 1.0)
    point('silKey1', (W / 2 + 4.0, WY + 0.2, 2.2), 4, color=(0.6, 0.7, 1.0), radius=0.3)
elif SIL == 2:   # in the talisay tree, close
    silip_at((tx + 0.3, ty - 1.3, 1.95), math.radians(-100), 0.8)
    point('silKey2', (tx - 1.3, ty - 1.4, 2.5), 2.5, color=(0.6, 0.7, 1.0), radius=0.3)
elif SIL == 3:   # at the window grill
    silip_at((W / 2 + 0.55, WY, 1.12), math.radians(-90), 0.55)
KPOS = PEEK if PEEK > 0 else int(OPT.get('kpos', 0))   # --kpos: she is in the hall but no flashlight, only the dim hall light shows her
if KPOS > 0:   # what the flashlight finds down the hallway
    from entities import build_kumot_batibat
    before = set(o.name for o in bpy.data.objects)
    build_kumot_batibat(0, 0, peer=(KPOS == 3))
    kp = {1: ((HXP(3.85), CY, 0), 90), 2: ((dx - 0.75, D + 0.9, 0), 25) if VIEW == 'door' else ((HXP(1.7), CY + 0.1, 0), 90), 3: ((dx - 0.15, D + 0.5, 0), 12)}[KPOS]
    group_at(before, kp[0], math.radians(kp[1]))
KST = OPT.get('kumot', '1')
if KUMOT:
    from entities import build_kumot_batibat
    if VIEW == 'under':
        if KST == 'in':     # just inside the doorway: from under the bed you see her from the waist down
            build_kumot_batibat(0.3, 3.0)
        elif KST == 'lift':   # down on the floor at the edge of the bed, the blanket lifted: her face at the gap
            before_ = set(o.name for o in bpy.data.objects); build_kumot_batibat(0, 0)
            group_at(before_, (-0.15, 1.75, 0), math.radians(-52))   # standing right at the gap, the blanket up (clear of the bed frame)
            point('liftKey', (-0.4, 1.1, 0.3), 2.5, color=(1.0, 0.7, 0.45), radius=0.1)
        else: build_kumot_batibat(-0.15, 2.0)   # standing right beside the bed, searching (clear of the frame)
    else: build_kumot_batibat(-0.6, 3.1)
if VIEW == 'under' and ((KUMOT and KST == 'lift') or OPT.get('js') == 'kumotu'):   # the hanging blanket is lifted
    for o_ in bpy.data.objects:
        if o_.data and getattr(o_.data, 'materials', None) and any(m_ and m_.name.startswith('blanketHang') for m_ in o_.data.materials):
            o_.location.z = 0.78; o_.rotation_euler.x += math.radians(-25)
if VIEW == 'sofa' and 'malik' in OPT and not OPT.get('js'):   # half of her shows past the end of the sofa
    from entities import build_tiyanak
    before_ = set(o.name for o in bpy.data.objects); build_tiyanak(0, 0, 0.0, crawl=True)
    group_at(before_, LW(0.3, 2.15, 0), math.radians(-8))
    point('tyKeyS', LW(0.1, 2.9, 0.8), 2.5, color=(0.55, 0.9, 1.0), radius=0.2)

if VIEW == 'hub' and CURT == 'open' and 'morning' not in OPT:   # from the middle of the room the moon patch read as a ghost: keep it soft
    bpy.data.objects['moonWin'].data.energy *= 0.35; bpy.data.objects['moonWin'].data.size = 0.35; bpy.data.objects['moonWin'].data.size_y = 0.35
if 'morning' in OPT:   # 6:00 AM: bulb off, sun through the open window, the yard bright
    for n_ in ('bulbLight', 'fill', 'hallGlow', 'roomSpill', 'tvGlow', 'tvSpill'):
        if n_ in bpy.data.objects: bpy.data.objects[n_].data.energy = 0
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
# ---------------------------------------------------------------- Chapter 3 nights 6-7: a real brownout, three candles
if 'candles' in OPT:
    os.environ['LIGHTS_OFF'] = '1'            # every bulb and tube off (lib.render)
    for n_ in ('k_fridgeLight', 'tvSpill', 'curtainFill'):
        if n_ in bpy.data.objects: bpy.data.objects[n_].data.energy = 0
    for n_ in ('k_kalRim', 'k_kalKey'):   # the entity accent lights stay faint by candlelight
        if n_ in bpy.data.objects: bpy.data.objects[n_].data.energy = min(bpy.data.objects[n_].data.energy, 5)
    wax_ = mat_basic('wax', (0.85, 0.82, 0.7), 0.4)
    flame_ = mat_basic('flame', (1.0, 0.7, 0.3), 0.5, emit=(1.0, 0.55, 0.15), emit_str=40)
    def candle(name, x, y, z):
        cyl(name + 'Wax', 0.018, 0.13, (x, y, z + 0.065), wax_, verts=12)
        cyl(name + 'Dish', 0.05, 0.012, (x, y, z + 0.006), mat_basic(name + 'DishM', (0.4, 0.4, 0.38), 0.3, metal=0.8), verts=16)
        f_ = sphere(name + 'Flame', 0.011, (x, y, z + 0.15), flame_, scale=(1, 1, 2.2)); f_.visible_shadow = False
        point(name + 'L', (x, y, z + 0.17), 6, color=(1.0, 0.55, 0.2), radius=0.01)
    box('bangkito', (0.32, 0.32, 0.4), (-0.75, 2.75, 0.2), wood_dark, bevel=0.01)      # a stool by the head of the bed
    candle('candleBed', -0.75, 2.75, 0.4)
    candle('candleLiv', *LW(0.5, LDIM[1] - 0.3, 0.6)[:2], 0.6)                         # on the TV cabinet
    candle('candleKit', *KW(-0.4, 1.1, 0.78)[:2], 0.78)                                 # on the kitchen table
# lamps light the house but are never seen as glowing shapes themselves (the bulbs are their own meshes)
for o_ in bpy.data.objects:
    if o_.type == 'LIGHT' and o_.data.type in ('AREA', 'POINT', 'SPOT') and o_.name != 'moonWin': o_.visible_camera = False
# ---------------------------------------------------------------- cameras
if VIEW == 'hall':          # Chapter 2 hub: standing at the back-door end of the hall, looking to the kitchen
    camera((HXP(-2.0), D + 0.75, 1.58), (HXP(4.3), D + 0.62, 1.35), lens=24)
elif VIEW == 'kitchen':     # in the kitchen doorway area looking at the counter wall (the hall door on the right)
    camera(KW(-0.2, 0.15, 1.55), KW(0.1, KDIM[1], 1.05), lens=21)
elif VIEW == 'kitchen_hide':   # inside the low cabinet on the kitchen's side wall: the hall door is on the left
    camera(KW(-2.0, 2.55, 1.32), KW(1.3, 2.95, 1.05), lens=20)
elif VIEW == 'curtain':     # facing the back door at the start of the hall
    if 'candles' not in OPT:   # the hall bulb's spill on the cloth and wall, open or shut (never seen in the glass)
        cf_ = point('curtainFill', (CX + 0.1, D + 0.35, 2.2), 6, color=(1.0, 0.62, 0.32), radius=0.25); cf_.visible_glossy = False; cf_.visible_transmission = False
    camera((CX + 0.02, D + 0.12, 1.5), (CX - 0.03, HY1 + 4.0, 1.4), lens=19)
elif VIEW == 'living':
    if 'pano' in OPT:   # turnable view from beside the sofa's far end: the sofa to hide behind on the left, the TV on the right
        camera(LW(2.05, 2.35, 1.55), LW(-2.5, 2.7, 1.2), lens=22)
    else: camera(LW(-0.35, 1.0, 1.55), LW(0.25, LDIM[1], 1.1), lens=22)
elif VIEW == 'sofa':   # hiding: lying on the floor behind the left end of the sofa (the hall door behind you), the TV ahead
    c_ = camera(LW(0.08, 0.36, 0.2), LW(-0.02, LDIM[1] - 0.33, 0.62), lens=24)
    import mathutils
    c_.rotation_euler = (c_.rotation_euler.to_quaternion() @ mathutils.Quaternion((0, 0, 1), math.radians(-5))).to_euler()   # head on the floor
    point('sofaFill', LW(0.5, 0.5, 0.9), 1.2, color=(1.0, 0.65, 0.4), radius=0.2)
    if not ('lights' in OPT or SALA == 'lights'): point('sofaAmb', LW(-0.2, 3.1, 2.4), 35 if 'candles' not in OPT else 6, color=(0.5, 0.6, 0.95), radius=0.5)   # the street light's spill, so the TV and the floor still read
elif VIEW == 'plan':   # debug: the whole house from above, cut at ceiling height
    c_ = camera((dx - 2.0, D + 0.8, 12), (dx - 2.0, D + 0.8, 0), lens=30)
    c_.data.type = 'ORTHO'; c_.data.ortho_scale = 15; c_.data.clip_start = 9.5
    bpy.context.view_layer.update()
    import mathutils
    for o_ in bpy.data.objects:
        if o_.type == 'MESH' and min((o_.matrix_world @ mathutils.Vector(c)).z for c in o_.bound_box) > 2.5: o_.hide_render = True
    sun_ = bpy.data.lights.new('planSun', 'SUN'); sun_.energy = 3; o_ = bpy.data.objects.new('planSun', sun_); bpy.context.collection.objects.link(o_)
elif VIEW == 'hub':
    camera((0.25, -0.15, 1.6), (0.75, 4.4, 1.28), lens=17)
elif VIEW == 'door':
    # FNAF4-style: you stand a step inside the room, a little to the right, looking out through the doorway and down the
    # hall toward the kitchen. The door hangs on the left jamb: open, it rests against the wall on the left; held, it swings
    # across the opening in front of you (sw80..sw18, closed). The flashlight (peek) lights this same view.
    import mathutils
    cpos = mathutils.Vector((dx + 0.5, D - 1.55, 1.55)); ctg = mathutils.Vector((dx - 0.2, D + 1.2, 1.25))   # right at the door: it shuts at arm's length
    cam_ = camera(tuple(cpos), tuple(ctg), lens=17)
    if PEEK >= 0:
        src_ = cpos + mathutils.Vector((0.12, 0.15, -0.2)); tg_ = mathutils.Vector((dx - 0.4, D + 0.85, 1.1))
        spot('peekTorch', tuple(src_), (tg_ - src_).to_track_quat('-Z', 'Y').to_euler(), 520, angle=math.radians(38), color=(1.0, 0.93, 0.8), blend=0.9)
    point('doorFill', (dx + 0.5, D - 1.7, 2.2), 6, color=(1.0, 0.7, 0.42), radius=0.4)
    point('viewFill', (dx + 0.9, D - 1.2, 1.9), 3, color=(1.0, 0.65, 0.35), radius=0.3)
elif VIEW == 'sleep':   # lying in Lola's bed, head on the pillow, looking down past your feet
    camera((-1.4, 2.05, 0.86), (-1.4, -0.2, 1.05), lens=22)
    point('sleepFill', (-0.9, 1.0, 2.0), 3, color=(1.0, 0.6, 0.32), radius=0.3)
elif VIEW == 'window':
    camera((0.15, WY - 0.05, 1.52), (W / 2 + 1, WY, 1.48), lens=22)
elif VIEW == 'under':
    camera((-1.45, 0.75, 0.15), (0.6, 3.4, 0.32), lens=20)
    point('underFill', (-0.6, 1.3, 0.25), 3, color=(1.0, 0.65, 0.35), radius=0.2)
elif VIEW == 'scare':
    camera((fx - 0.85, AY + 0.05, 1.4), (fx + 0.1, AY + 0.14, 1.36), lens=30); OPT['lit'] = '1'
elif VIEW == 'hero':
    camera((fx - 1.15, AY - 0.15, 1.35), (fx, AY + 0.12, 1.3), lens=34); OPT['lit'] = '1'
elif VIEW == 'cabinet':
    camera((-0.35, AY - 0.45, 1.55), (W / 2, AY + 0.3, 1.1), lens=26)
    point('viewFill', (0.0, AY - 0.6, 2.0), 9, color=(1.0, 0.65, 0.35), radius=0.4)

JS = OPT.get('js')
if JS:
    # IN-PLACE JUMPSCARE (FNAF4): the room you were in when it got you stays the background; the entity lunges from where
    # it was at your eyes. --js=<who> --frame=0..7 (0-1 there, twitching; 2-7 the lunge; the scream lands on frame 2).
    import mathutils
    from entities import build_kumot_batibat, build_tiyanak, build_kalansing, build_manananggal, add_aswang_tongue
    from entities2 import build_barang
    PROG = [0.0, 0.05, 0.16, 0.34, 0.56, 0.76, 0.92, 1.0]
    SIDE = [0.0, 0.05, -0.04, 0.03, -0.03, 0.02, -0.015, 0.0]
    TILT = [0, 4, -6, 5, -8, 6, -4, 0]
    f = max(0, min(7, int(OPT.get('frame', 0)))); k = PROG[f]
    # who: (builder, start position, its face relative to its origin when facing -y, how close the face ends up)
    before = set(o.name for o in bpy.data.objects)
    WPS = []; BREAK = (); LEAP = 0.0; WG = 0.8 if f < 2 else 0.22   # wings spread outside, folded to come through
    DROP = 0.3; OP = None; LENS1 = 30; AIM0 = 0.0; BEND = 0; AIMS = None; HEADK = 0.85
    if JS == 'kumot':   # she does not fit through the door: she stays in the hall and leans in through the doorway, right to your face
        build_kumot_batibat(0, 0); P0 = (dx - 0.06, D + 0.72, 0); FL = (0, -0.5, 2.12)
        BEND = 0 if f < 2 else 42 + 22 * k   # she steps into the doorway bending at the waist under the lintel, her face at yours
        OP = [(0.0, (dx - 0.06, D + 0.72, 0), 0, 1, 0.68), (0.16, (dx - 0.06, D + 0.55, 0), 0, 1, 0.68), (1.0, (dx - 0.06, D + 0.15, 0), 0, 1, 0.68)]   # ducks under the lintel
    elif JS == 'malikmata':
        build_tiyanak(0, 0, 0.0, crawl=True); P0 = LW(0.35, LDIM[1] - 1.0, 0); FL = (0, -0.34, 0.6)   # leaps up over the stand fan in front of you and comes down at your face
        OP = [(0.0, LW(0.35, LDIM[1] - 1.0, 0), 0, 1), (0.16, LW(0.1, 2.9, 0), 0, 1), (0.34, LW(-0.15, 2.3, 0.5), 0, 1), (0.56, LW(-0.3, 2.0, 1.5), 0, 1), (1.0, LW(-0.35, 1.8, 1.5), 0, 1)]
    elif JS == 'kalansing':   # from the counter end she leaps onto the table (the bottle goes flying) and lunges off its edge
        build_kalansing(0, 0); add_aswang_tongue(0, 0); FL = (0, -0.66, 1.0); P0 = KW(0.35, 2.75, 0); BREAK = ('k_bottle', 'k_cap')
        OP = [(0.0, KW(0.35, 2.75, 0), 0, 1), (0.16, KW(0.15, 2.5, 0.95), 0, 1), (0.34, KW(-0.35, 1.75, 0.85), 0, 1), (0.56, KW(-0.6, 1.5, 0.82), 0, 1), (1.0, KW(-0.6, 1.35, 0.82), 0, 1)]
    elif JS == 'kalh':     build_kalansing(0, 0); add_aswang_tongue(0, 0); P0 = KW(-0.75, 2.35, 0); FL = (0, -0.66, 1.0); DC = 0.75; LEAP = 0.3; BREAK = ('k_pamSlat', 'k_pamMid', 'k_pamKnob')   # tears the slatted doors off
    elif JS == 'silip':    # dives through the window head first (her body pitched flat, wings folded, entrails trailing), then rises at you
        build_manananggal(0, 0, 0, wing=WG); P0 = (W / 2 + 0.6, WY, 1.05); FL = (0, -0.1, 0.66); BREAK = ('bar', 'barH', 'cz', 'sashV')
        OP = [(0.0, (W / 2 + 0.6, WY, 1.05), 0, 1), (0.16, (W / 2 + 0.55, WY, 1.5), 80, 1), (0.34, (W / 2 - 0.3, WY, 1.5), 80, 1), (0.56, (1.2, WY - 0.05, 1.3), 35, 1), (1.0, (1.0, WY - 0.05, 0.95), 0, 1)]
    elif JS == 'silipc':   # smashes the jalousie door in (door and curtain gone), wings folded to fit the frame, then down the hall at you
        WG = 0.6 if f < 2 else 0.22
        build_manananggal(0, 0, 0, wing=WG); P0 = (CX + 0.35, HY1 + 0.9, 1.0); FL = (0, -0.1, 0.66); BREAK = ('bdStile', 'bdRail', 'bdSlat', 'bcCurtain')
        OP = [(0.0, (CX + 0.35, HY1 + 0.9, 1.0), 0, 1), (0.16, (CX + 0.1, HY1 + 0.7, 1.0), 0, 1), (0.34, (CX, HY1, 1.0), 0, 1), (0.56, (CX + 0.01, HY1 - 0.5, 1.05), 0, 1), (1.0, (CX + 0.02, HY0 + 0.87, 1.0), 0, 1)]
    elif JS == 'bangungot':   # beside the bed; then she is on it, hunched over you (the kulambo torn down), creeping up to your face
        build_kumot_batibat(0, 0); P0 = (0.0, 0.6, 0.0); FL = (0, -0.5, 2.12); BREAK = ('kulambo',)
        OP = [(0.0, (0.0, 0.6, 0), 0, 1), (0.16, (0.95, 2.0, 0), 55, 1), (1.0, (0.84, 2.0, 0), 62, 1)]; AIM0 = 0.75   # she comes from the side: you turn to her at once   # from the side of the bed she bends right over you
    elif JS == 'kumotu':   # at the gap under the bed; once she has dragged you out she bends over you at the waist, looking down
        build_kumot_batibat(0, 0); P0 = (-0.15, 1.75, 0); FL = (0, -0.5, 2.12); DC = 0.42
        if f >= 2: q_ = (f - 2) / 5.0; BEND = 78 * (1 - (1 - q_) ** 2); HEADK = 0.25
    elif JS == 'malikh':   build_tiyanak(0, 0, 0.0, crawl=True); P0 = LW(0.3, 2.15, 0); FL = (0, -0.34, 0.6); DC = 0.42   # round the end of the sofa
    elif JS == 'barang':   build_barang((0, 0, 0), 0.0, stage=4, glow=1.0); P0 = (fx - 0.45, AY + 0.1, 0); FL = (0, -0.23, 1.45); DC = 0.42
    # Kumot bends at the waist (her legs stay standing): every point above the hip turns forward round the hip, the turn
    # easing in over a band, so the body curves instead of tipping over like a plank
    def bend_pt(p, a, hip=1.1, band=0.45):
        dz = p[2] - hip
        if dz <= 0 or not a: return mathutils.Vector(p)
        t = min(1.0, dz / band); t = t * t * (3 - 2 * t); g_ = math.radians(a) * t
        return mathutils.Vector((p[0], p[1] * math.cos(g_) - dz * math.sin(g_), hip + dz * math.cos(g_) + p[1] * math.sin(g_)))
    if JS == 'kumot':   # her hem clears the threshold strip as she steps in
        import bmesh as _bm
        cl_ = bpy.data.objects.get('kumotCloth')
        if cl_:
            _b = _bm.new(); _b.from_mesh(cl_.data); mw_ = cl_.matrix_world
            _bm.ops.delete(_b, geom=[v for v in _b.verts if (mw_ @ v.co).z < 0.14], context='VERTS'); _b.to_mesh(cl_.data); _b.free()
    if BEND:
        for o in bpy.data.objects:
            if o.name in before or o.type != 'MESH': continue
            mw = o.matrix_world.copy(); inv = mw.inverted()
            for v in o.data.vertices: v.co = inv @ bend_pt(bend_pt(mw @ v.co, -HEADK * BEND, 1.92, 0.12), BEND)   # the head tips back up so she looks at you
        FL = tuple(bend_pt(bend_pt(FL, -HEADK * BEND, 1.92, 0.12), BEND))
    e = group_at(before, (0, 0, 0), 0.0)
    def aim(cam_, F_, tilt_, lens_):   # turn the camera to the face (with a lurch) and narrow the lens
        fwd_ = (F_ - cam_.location).normalized()
        cam_.rotation_euler = (mathutils.Quaternion(fwd_, math.radians(tilt_)) @ fwd_.to_track_quat('-Z', 'Y')).to_euler(); cam_.data.lens = lens_
    HEM = -0.2 if JS in ('kumot', 'kumotu', 'bangungot') else 0.0   # the shroud's hem sits 0.2 under its origin by design
    def settle():   # bending forward lifts it off the floor (a ghost floats); it never sinks into the floor
        bpy.context.view_layer.update()
        def kids(o): return [o] + [c for ch in o.children for c in kids(ch)]
        mz = min((o.matrix_world @ mathutils.Vector(c)).z for o in kids(e) if o.type == 'MESH' for c in o.bound_box)
        if e.location.z < 0.05 and mz < HEM - 0.01: e.location.z += HEM - mz
    def face_at():
        settle(); bpy.context.view_layer.update(); return e.matrix_world @ mathutils.Vector(FL)
    if JS == 'kumotu':
        # Caught under the bed. She stands right at the gap with the blanket up; then she drags you out by the ankles (you
        # slide out along the floor, under the rail) and bends down over you. Nothing goes through the bed or the floor.
        cam = bpy.context.scene.camera; C0 = cam.location.copy(); lens0 = cam.data.lens; fwd0 = cam.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, -1))
        KA = mathutils.Vector((-0.15, 1.75, 0)); KB = mathutils.Vector((-0.15, 2.5, 0)); C1 = mathutils.Vector((0.05, 0.7, 0.24))   # she steps back as she bends; you end 1.8 m from her feet
        if f < 2:
            e.location = (-0.15 + SIDE[f], 1.75, 0); e.rotation_euler = (0, 0, math.radians(-52))
            aim(cam, C0 + fwd0 * 3, 0, lens0); F = face_at()
        else:
            q = (f - 2) / 5.0; qe = 1 - (1 - q) ** 2
            cam.location = C0.lerp(C1, min(1.0, qe * 1.3))
            KP = KA.lerp(KB, min(1.0, qe * 1.5)); d_ = C1 - KP; e.location = KP; e.rotation_euler = (0, 0, math.atan2(d_.x, -d_.y))
            F = face_at(); aim(cam, (cam.location + fwd0 * 3).lerp(F, min(1, 0.35 + qe)), TILT[f], lens0 + (30 - lens0) * qe)
        point('jsKey', tuple(F + mathutils.Vector((0.2, 0.15, 0.45))), 6 + 12 * k, color=(1.0, 0.75, 0.55), radius=0.15)
    if OP is None and JS == 'malikh':   # behind the sofa: it goes round to the front, hops onto the seat and looms over the back at you
        # it crawls along the floor between the sofa's end and the stand fan (over the fan's flat base) toward you, keeping
        # low; the view only swings onto it when it is close
        OP = [(0.0, LW(0.3, 2.15, 0), 0, 1), (0.16, LW(0.12, 2.0, 0), 0, 1), (0.34, LW(0.03, 1.6, 0.05), 5, 1), (0.56, LW(0.03, 1.4, 0.0), 10, 0.9), (0.76, LW(0.03, 1.3, 0.0), 15, 0.8), (1.0, LW(0.03, 1.25, 0.0), 20, 0.75)]; LENS1 = 36; AIMS = 0.3
    if OP is not None:   # a path of (k, origin, pitch, height scale); it always faces you
        cam = bpy.context.scene.camera; C = cam.location.copy(); lens0 = cam.data.lens; fwd0 = cam.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, -1))
        for i_ in range(len(OP) - 1):
            if k <= OP[i_ + 1][0] or i_ == len(OP) - 2: a0, a1 = OP[i_], OP[i_ + 1]; break
        u = max(0.0, min(1.0, (k - a0[0]) / max(1e-6, a1[0] - a0[0])))
        if f < 2: a0, a1, u = OP[0], OP[0], 0.0   # frames 0-1: still where it was (only the twitch)
        O = mathutils.Vector(a0[1]).lerp(mathutils.Vector(a1[1]), u); pit = a0[2] + (a1[2] - a0[2]) * u; zs = a0[3] + (a1[3] - a0[3]) * u
        xs = (a0[4] if len(a0) > 4 else 1) + ((a1[4] if len(a1) > 4 else 1) - (a0[4] if len(a0) > 4 else 1)) * u
        vv = C - O; yaw = math.atan2(vv.x, -vv.y)
        side_ = mathutils.Vector((math.cos(yaw), math.sin(yaw), 0)) * SIDE[f]
        e.location = O + side_; e.rotation_euler = (math.radians(pit), 0, yaw); e.scale = (xs, 1, zs)
        af = min(1, (AIM0 if f >= 2 else 0) + k * 1.4) if AIMS is None else max(0.0, min(1.0, (k - AIMS) / (1 - AIMS))) ** 0.7
        F = face_at(); aim(cam, (C + fwd0 * 3).lerp(F, af), TILT[f] * (0.4 if AIMS is not None and k < AIMS else 1), lens0 + (LENS1 - lens0) * k)
        point('jsKey', tuple(F + mathutils.Vector((0.2, 0.2, 0.45))), 5 + 9 * k, color=(1.0, 0.75, 0.55), radius=0.15)
        if f >= 2 and BREAK:
            for o in bpy.data.objects:
                if o.name.startswith(BREAK): o.hide_render = True
    if (JS == 'kumotu' or OP is not None) and f >= 3:
        src = cam.location + mathutils.Vector((0.05, 0, -0.05)); spot('jsTorch', tuple(src), (F - src).to_track_quat('-Z', 'Y').to_euler(), 5 + 12 * k, angle=math.radians(38), color=(1.0, 0.92, 0.8), blend=0.6)
    if JS != 'kumotu' and OP is None:
        # The lunge never goes through anything: it follows waypoints round furniture (WPS), what it breaks through is
        # gone from frame 2 (BREAK), wings fold to pass an opening, and a walker stays on the floor and bends toward you
        # instead of sinking into it (a leaper may leave the floor a little).
        cam = bpy.context.scene.camera; C = cam.location.copy(); bpy.context.view_layer.update()
        fwd0 = cam.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, -1)); lens0 = cam.data.lens
        FLv = mathutils.Vector(FL); GROUND = P0[2] <= 0.001
        def face_rot(F):   # turn so its front (-y) faces the camera
            v = C - F; return math.atan2(-v.x, v.y) + math.pi
        def place(F):
            r = face_rot(F); a_ = 0.0
            if GROUND and F.z < FLv.z:   # bend forward from the feet until the face is at that height
                lo, hi = 0.0, math.radians(85)
                for _ in range(40):
                    mid = (lo + hi) / 2
                    if FLv.y * math.sin(mid) + FLv.z * math.cos(mid) > F.z: lo = mid
                    else: hi = mid
                a_ = (lo + hi) / 2
            loc = mathutils.Vector((0, FLv.y * math.cos(a_) - FLv.z * math.sin(a_), FLv.y * math.sin(a_) + FLv.z * math.cos(a_)))
            e.rotation_euler = (a_, 0, r); e.location = F - mathutils.Matrix.Rotation(r, 3, 'Z') @ loc
            if GROUND and e.location.z < 0: e.location.z = 0
        r0 = face_rot(mathutils.Vector(P0) + FLv); F0 = mathutils.Vector(P0) + mathutils.Matrix.Rotation(r0, 3, 'Z') @ FLv
        pts = [F0] + [mathutils.Vector(w_) for w_ in WPS]
        d = (pts[-1] - C); dh = mathutils.Vector((d.x, d.y, 0)).normalized()
        F1 = C + dh * DC + mathutils.Vector((0, 0, 0.04))
        if GROUND: F1.z = max(FLv.z - DROP, min(F1.z, FLv.z + LEAP))   # a walker bends a little at most, a leaper leaves the floor a little
        pts.append(F1)
        segs = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]; tot = sum(segs) or 1; t_ = k * tot
        for i, L_ in enumerate(segs):
            if t_ <= L_ or i == len(segs) - 1: F = pts[i].lerp(pts[i + 1], min(1, t_ / max(L_, 1e-6))); break
            t_ -= L_
        side = mathutils.Vector((-dh.y, dh.x, 0)) * SIDE[f]
        F = F + side; place(F)
        if f >= 2 and BREAK:   # what it smashes through
            for o in bpy.data.objects:
                if o.name.startswith(BREAK): o.hide_render = True
        # a sick key light rides with it; from frame 3 your own light catches the face
        point('jsKey', tuple(F + mathutils.Vector((0.25, 0, 0.55))), 6 + 10 * k, color=(1.0, 0.75, 0.55), radius=0.15)
        if f >= 3:
            src = C + mathutils.Vector((0.1, 0, -0.15)); spot('jsTorch', tuple(src), (F - src).to_track_quat('-Z', 'Y').to_euler(), 25 + 45 * k, angle=math.radians(38), color=(1.0, 0.92, 0.8), blend=0.6)
        # the camera does not move: it only turns toward the face (and the world lurches) and narrows a little
        tgt = (C + fwd0 * 3).lerp(F, min(1, k * 1.4))
        fwd = (tgt - C).normalized()
        cam.rotation_euler = (mathutils.Quaternion(fwd, math.radians(TILT[f])) @ fwd.to_track_quat('-Z', 'Y')).to_euler()
        cam.data.lens = lens0 + (30 - lens0) * k
    settle()
    for o in bpy.data.objects:   # the bulb stutters as it comes
        if o.type == 'LIGHT' and f >= 2: o.data.energy *= (1.25 if f % 2 else 0.8)
if 'lit' in OPT:   # the player's flashlight, from the camera
    import mathutils
    cam = bpy.context.scene.camera; src = cam.location.copy() + mathutils.Vector((0.15, -0.1, -0.15))
    tgt = {'scare': (fx, AY + 0.14, 1.4), 'hero': (fx, AY + 0.12, 1.3), 'cabinet': (fx, AY + 0.1, 1.25), 'door': (dx, D + 1.5, 1.3), 'hub': (0.3, 3.8, 1.2), 'window': (W / 2 + 0.6, WY, 1.45)}[VIEW]
    if 'pano' in OPT: point('flash', tuple(src), 55, color=(1.0, 0.93, 0.8), radius=0.04)   # a turnable view: the torch has to reach wherever you face
    elif VIEW != 'scare': spot('flash', tuple(src), (mathutils.Vector(tgt) - src).to_track_quat('-Z', 'Y').to_euler(), 160, angle=math.radians(44), color=(1.0, 0.93, 0.8), blend=0.75)
    else: spot('flash', (fx - 0.55, AY - 0.25, 0.85), (mathutils.Vector((fx, AY + 0.12, 1.45)) - mathutils.Vector((fx - 0.55, AY - 0.25, 0.85))).to_track_quat('-Z', 'Y').to_euler(), 14, angle=math.radians(40), color=(1.0, 0.8, 0.65), blend=0.8)

if VIEW == 'walk':
    # WALKING / RUNNING BETWEEN ROOMS, as video. --route=<from>-<to>; rooms: hall (the hub at the back-door end),
    # bedroom, living, kitchen, curtain (Chapters 2-3), and c1center, c1door, c1window, c1cabinet (inside Lola's room).
    # You turn toward where you are going, walk (head bob, a little sway), and turn to face the way that room's view
    # faces. Going back the other way you turn round first, so the hallway is seen from the other side.
    import mathutils, json
    V2 = lambda x, y: mathutils.Vector((x, y))
    EYE = 1.58; SPEED = 2.2 if not OPT.get('route', '').startswith('c1') else 2.0
    def head(a, b): d = V2(b[0] - a[0], b[1] - a[1]); return d.normalized()
    ROOMS = {   # camera spot, the way that room's view faces, path from the hall's centreline into the spot
        'hall':    {'at': (HXP(-2.0), D + 0.75), 'look': (HXP(4.3), D + 0.62), 'in': [(HXP(-1.6), CY)]},
        'bedroom': {'at': (0.25, -0.15), 'look': (0.75, 4.4), 'in': [(dx, CY), (dx, D + 0.15), (dx + 0.05, D - 0.6), (0.2, D - 1.8)]},
        'living':  {'at': LW(2.05, 2.35, 0)[:2], 'look': LW(-2.5, 2.7, 0)[:2], 'in': [(LX, CY), (LX, HY1 + 0.35), (LX + 0.5, HY1 + 1.3)]},
        'kitchen': {'at': KW(-0.2, 0.15, 0)[:2], 'look': KW(0.1, KDIM[1], 0)[:2], 'in': [(XK + 0.3, CY), (XK - 0.5, CY), (XK - 2.2, CY + 0.6)]},
        'curtain': {'at': (CX + 0.02, D + 0.12), 'look': (CX - 0.03, HY1 + 4.0), 'in': [(CX + 0.3, CY - 0.1)]},
        'c1center': {'at': (0.25, -0.15)}, 'c1door': {'at': (dx + 0.5, D - 1.55), 'look': (dx - 0.2, D + 1.2)},
        'c1window': {'at': (0.15, WY - 0.05), 'look': (W / 2 + 1, WY)}, 'c1cabinet': {'at': (-0.35, AY - 0.45), 'look': (W / 2, AY + 0.3)},
    }
    C1FACE = {'c1door': (dx, D), 'c1window': (W / 2, WY), 'c1cabinet': (fx, AY)}   # from the middle of the room you face what you went to / came from
    a_, b_ = OPT['route'].split('-')
    A, B = ROOMS[a_], ROOMS[b_]
    if a_.startswith('c1'):
        pts = [A['at'], B['at']]
        h0 = head(A['at'], A['look']) if 'look' in A else head(A['at'], C1FACE[b_])
        h1 = head(B['at'], B['look']) if 'look' in B else head(B['at'], C1FACE[a_])
    else:
        pts = [A['at']] + list(reversed(A['in'])) + B['in'] + [B['at']]
        h0, h1 = head(A['at'], A['look']), head(B['at'], B['look'])
    pts = [V2(*p) for p in pts]
    # drop points that double back on themselves (both rooms enter the hall at nearly the same spot)
    clean = [pts[0]]
    for p in pts[1:]:
        if (p - clean[-1]).length > 0.15: clean.append(p)
    pts = clean
    seg = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]; L = sum(seg)
    def at_s(sv):   # position at arc length sv
        for i, l in enumerate(seg):
            if sv <= l or i == len(seg) - 1: return pts[i].lerp(pts[i + 1], max(0, min(1, sv / l if l else 0)))
            sv -= l
    def ang(u, v): return math.degrees(math.atan2(u.x * v.y - u.y * v.x, u.dot(v)))
    d0, d1 = (pts[1] - pts[0]).normalized(), (pts[-1] - pts[-2]).normalized()
    tA = abs(ang(h0, d0)) / 200.0; tB = 0.25                           # turn round on the spot first (200 deg/s); the arriving turn happens while walking
    ACC = 0.35                                                          # speeding up / slowing down
    tW = L / SPEED + ACC
    T = tA + tW + tB + 0.1
    FPS = int(OPT.get('fps', 24)); N = max(2, int(round(T * FPS)))
    sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = N
    sc.render.resolution_x, sc.render.resolution_y = int(OPT.get('w', 854)), int(OPT.get('h', 480)); sc.render.resolution_percentage = 100
    sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.45
    cam = camera((pts[0].x, pts[0].y, EYE), (pts[0].x + h0.x, pts[0].y + h0.y, EYE - 0.08), lens=20)
    def rot_to(hv, pitch_deg, roll_deg):
        f = mathutils.Vector((hv.x, hv.y, math.tan(math.radians(pitch_deg)))).normalized()
        q = f.to_track_quat('-Z', 'Y'); return (mathutils.Quaternion(f, math.radians(roll_deg)) @ q).to_euler()
    def slerp2(u, v, k):   # rotate u toward v by fraction k
        a = math.radians(ang(u, v)) * k; c, s_ = math.cos(a), math.sin(a)
        return V2(u.x * c - u.y * s_, u.x * s_ + u.y * c)
    def ease(x): return x * x * (3 - 2 * x)
    for fr in range(1, N + 1):
        t = (fr - 1) / FPS
        if t < tA:   # turn toward the way out
            pos, hv, walking = pts[0], slerp2(h0, d0, ease(t / tA) if tA else 1), 0
        elif t < tA + tW:   # walk (trapezoid speed profile)
            u = t - tA
            if u < ACC: sv = SPEED * u * u / (2 * ACC)
            elif u > tW - ACC: w_ = tW - u; sv = L - SPEED * w_ * w_ / (2 * ACC)
            else: sv = SPEED * ACC / 2 + SPEED * (u - ACC)
            sv = max(0, min(L, sv)); pos = at_s(sv)
            ahead = at_s(min(L, sv + 1.1)); dv = (ahead - pos)
            hv = dv.normalized() if dv.length > 0.05 else d1
            rem = L - sv   # over the last stretch you already turn toward the way you will face (no staring into a wall)
            if rem < 1.6: hv = slerp2(hv, h1, ease(1 - rem / 1.6))
            walking = min(1, u / ACC, (tW - u) / ACC)
        else:   # settle, facing the way this room's view looks
            pos, hv, walking = pts[-1], h1, 0
        ph = t * 2 * math.pi * 1.9   # step rhythm
        bob = 0.028 * walking * abs(math.sin(ph)); sway = 0.012 * walking * math.sin(ph / 2)
        side = mathutils.Vector((-hv.y, hv.x, 0))
        cam.location = mathutils.Vector((pos.x, pos.y, EYE - 0.02 + bob)) + side * sway
        cam.rotation_euler = rot_to(hv, -4 + 1.2 * walking * math.sin(ph), 1.4 * walking * math.sin(ph / 2))
        cam.keyframe_insert('location', frame=fr); cam.keyframe_insert('rotation_euler', frame=fr)
    # the moon patch on the bedroom's back wall reads as a cold white slab when you walk past it: keep it soft and warm it
    if 'moonWin' in bpy.data.objects: bpy.data.objects['moonWin'].data.energy *= 0.22
    # which room each frame is in (the game grades every frame like that room's pictures)
    def room_of(p):
        if a_.startswith('c1'): return 'c1'
        if p.y < D - 0.05: return 'bedroom'
        if p.y > HY1 + 0.05: return 'living' if abs(p.x - LX) < 3.5 else 'curtain'
        if p.x < XK - 0.1: return 'kitchen'
        return 'hallway'
    ROOMF = []
    for fr in range(1, N + 1):
        bpy.context.scene.frame_set(fr); ROOMF.append(room_of(mathutils.Vector((cam.location.x, cam.location.y))))
    # the room's own light follows you a little (so a dark hall is not black): a faint torch-less fill at the eye
    fill = point('walkFill', (pts[0].x, pts[0].y, 2.2), 2.5, color=(1.0, 0.75, 0.5), radius=0.3)
    for fr in range(1, N + 1, 4):
        sc.frame_set(fr); fill.location = (cam.location.x, cam.location.y, 2.3); fill.keyframe_insert('location', frame=fr)
    out_ = A_[0] if (A_ := [a for a in sys.argv if a.endswith('.png')]) else '/tmp/walk.png'
    base_ = out_[:-4]
    json.dump({'route': OPT['route'], 'frames': N, 'fps': FPS, 'dur': round(N / FPS, 3), 'len': round(L, 2), 'rooms': ROOMF}, open(base_ + '.json', 'w'))
    if os.environ.get('WALK_INFO'): print('WALK', OPT['route'], round(L, 2), round(T, 2)); raise SystemExit
    sc.render.filepath = base_ + '_'; sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 92
    bpy.ops.render.render(animation=True)
    raise SystemExit
if 'pano' in OPT and VIEW in ('hub', 'living', 'kitchen'):
    # Room views you can turn in (slide left / right in the game): a level equirectangular panorama around the same
    # spot, centred on the same heading, its vertical range shifted to keep the old downward tilt.
    import mathutils
    cam = bpy.context.scene.camera; bpy.context.view_layer.update()
    fwd = cam.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, -1))
    yaw = math.atan2(fwd.y, fwd.x); pitch = math.asin(max(-1, min(1, fwd.z)))
    LON, LAT = {'hub': (152, 44), 'living': (150, 46), 'kitchen': (150, 48)}[VIEW]
    cam.rotation_euler = mathutils.Vector((math.cos(yaw), math.sin(yaw), 0)).to_track_quat('-Z', 'Y').to_euler()
    cd = cam.data; cd.type = 'PANO'; cd.panorama_type = 'EQUIRECTANGULAR'
    cd.longitude_min = math.radians(-LON / 2); cd.longitude_max = math.radians(LON / 2)
    cd.latitude_min = pitch + math.radians(-LAT / 2); cd.latitude_max = pitch + math.radians(LAT / 2)
    sc_ = bpy.context.scene; sc_.render.resolution_y = 720; sc_.render.resolution_x = int(round(720 * LON / LAT / 2) * 2)

    if os.environ.get('PROBE'):
        cw = cam.matrix_world.copy(); inv = cw.inverted(); bpy.context.view_layer.update(); cw = cam.matrix_world.copy(); inv = cw.inverted()
        def pp(v):
            l = inv @ v; lon = math.degrees(math.atan2(l.x, -l.z)); lat = math.degrees(math.atan2(l.y, math.hypot(l.x, l.z)))
            return ((lon + LON / 2) / LON * 100, (math.degrees(pitch) + LAT / 2 - lat) / LAT * 100)
        for pt_ in [p for p in os.environ.get('PROBEPT', '').split(';') if p]:
            print('PT', pt_, [round(v, 2) for v in pp(mathutils.Vector([float(c) for c in pt_.split(',')]))])
        if os.environ['PROBE'] == 'list':
            for o in bpy.data.objects:
                if o.type == 'MESH': print('OBJ', o.name)
        for pat in os.environ['PROBE'].split(','):
            pts = []
            for o in bpy.data.objects:
                if o.type == 'MESH' and pat.lower() in o.name.lower() and o.visible_get():
                    pts += [pp(o.matrix_world @ mathutils.Vector(c)) for c in o.bound_box]
            if pts:
                xs = [a for a, b in pts]; ys = [b for a, b in pts]
                print('PROBE', pat, [round(min(xs), 1), round(min(ys), 1), round(max(xs) - min(xs), 1), round(max(ys) - min(ys), 1)])
        raise SystemExit

if os.environ.get('PROBEPT') and 'pano' not in OPT:   # flat view: where world points land on screen (%)
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update(); cam_ = bpy.context.scene.camera
    for pt_ in [p for p in os.environ['PROBEPT'].split(';') if p]:
        v_ = world_to_camera_view(bpy.context.scene, cam_, mathutils.Vector([float(c) for c in pt_.split(',')]) if 'mathutils' in dir() else __import__('mathutils').Vector([float(c) for c in pt_.split(',')]))
        print('PT', pt_, [round(v_.x * 100, 2), round((1 - v_.y) * 100, 2)])
    raise SystemExit
if os.environ.get('CHECK') and JS:   # does the entity go through anything this frame? (instead of rendering)
    import mathutils
    from mathutils.bvhtree import BVHTree
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    def kids(o): return [o] + [c for ch in o.children for c in kids(ch)]
    ent = [o for o in kids(e) if o.type == 'MESH' and not o.hide_render]
    def aabb(o):
        vs = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
        return [min(v[i] for v in vs) for i in range(3)], [max(v[i] for v in vs) for i in range(3)]
    def ov(a, b, m=0.0): return all(a[0][i] - m <= b[1][i] and b[0][i] - m <= a[1][i] for i in range(3))
    FLOORS = ('floor', 'hallfloor', 'yard', 'rug')
    stat = [o for o in bpy.data.objects if o.type == 'MESH' and o not in ent and not o.hide_render and o.visible_get() and not any(o.name.lower().endswith(x) or o.name.lower() == x for x in FLOORS)]
    ebox = {o.name: aabb(o) for o in ent}; hits = set(); minz = min(b[0][2] for b in ebox.values())
    def bvh(o):
        oe = o.evaluated_get(dg); me = oe.to_mesh(); me.transform(o.matrix_world)
        t = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [tuple(p.vertices) for p in me.polygons]); oe.to_mesh_clear(); return t
    cache = {}
    for so in stat:
        sb = aabb(so)
        cand = [o for o in ent if ov(ebox[o.name], sb)]
        if not cand: continue
        try: ts = bvh(so)
        except Exception: continue
        for o in cand:
            if o.name not in cache: cache[o.name] = bvh(o)
            if cache[o.name].overlap(ts): hits.add(so.name + ('<' + o.name if os.environ.get('CHECK') == '2' else ''))
    print('CHECK', JS, OPT.get('frame'), 'minz %.2f' % minz, sorted(hits))
    raise SystemExit
if OPT.get("pct"): bpy.context.scene.render.resolution_percentage = int(OPT["pct"])
render(out)
