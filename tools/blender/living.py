import sys, os, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = a[0] if a else 'out/living.png'
sc.cycles.samples = int(a[1]) if len(a) > 1 else 40
MALIK = '--malik' in a
LIGHTS = '--lights' in a

W, D, H = 5.0, 4.6, 2.8
plaster = mat_noise('plaster', (0.25, 0.3, 0.27), (0.38, 0.43, 0.38), scale=3, bump=0.06)
ceil = mat_noise('ceil', (0.3, 0.3, 0.28), (0.45, 0.45, 0.42), scale=2)
tile = mat_planks('tiles', (0.28, 0.24, 0.2), (0.33, 0.29, 0.24), mortar=(0.05, 0.05, 0.045), scale=0.6, rough=0.35)
room(W, D, H, plaster, tile, ceil)
wood = mat_planks('wood', (0.08, 0.04, 0.018), (0.11, 0.055, 0.025), scale=3, rough=0.4)

# TV cabinet + CRT
box('tvCab', (1.3, 0.5, 0.6), (0, D - 0.3, 0.3), wood, bevel=0.01)
crt = mat_basic('crt', (0.04, 0.035, 0.03), 0.45)
box('crtBody', (0.74, 0.55, 0.56), (0, D - 0.33, 0.88), crt, bevel=0.04)
m = bpy.data.materials.new('static'); m.use_nodes = True; nt = m.node_tree
nt.nodes.remove(nt.nodes['Principled BSDF'])
em = nt.nodes.new('ShaderNodeEmission'); tc = nt.nodes.new('ShaderNodeTexCoord')
nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 260; nz.inputs['Detail'].default_value = 2
nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (0.05, 0.12, 0.14, 1); cr.color_ramp.elements[1].color = (0.75, 1.0, 1.0, 1)
cr.color_ramp.elements[0].position = 0.4; cr.color_ramp.elements[1].position = 0.6
nt.links.new(nz.outputs['Fac'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], em.inputs['Color'])
em.inputs['Strength'].default_value = 1.1
nt.links.new(em.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
scr = box('screen', (0.58, 0.01, 0.44), (0, D - 0.605, 0.9), m, bevel=0.03)
area('tvLight', (0, D - 0.7, 0.9), (math.radians(90), 0, 0), 40, size=(0.55, 0.42), color=(0.55, 0.9, 1.0))
knob = mat_basic('knob', (0.2, 0.2, 0.19), 0.4, metal=0.5)
for i, z in enumerate((1.02, 0.9)):
    cyl('knob%d' % i, 0.03, 0.03, (0.33, D - 0.61, z), knob, rot=(math.radians(90), 0, 0))
ant = mat_basic('ant', (0.5, 0.5, 0.5), 0.3, metal=1)
cyl('antL', 0.005, 0.6, (-0.12, D - 0.33, 1.38), ant, rot=(0, math.radians(-30), 0), verts=8)
cyl('antR', 0.005, 0.6, (0.12, D - 0.33, 1.38), ant, rot=(0, math.radians(30), 0), verts=8)

# glass cabinet with santo figures (left)
box('cabinet', (1.0, 0.45, 1.9), (-1.8, D - 0.25, 0.95), wood, bevel=0.01)
glass = mat_basic('glass', (0.9, 0.95, 0.95), 0.02, trans=1.0)
box('cabGlass', (0.9, 0.01, 1.2), (-1.8, D - 0.48, 1.2), glass)
santo = mat_noise('santo', (0.55, 0.45, 0.35), (0.7, 0.6, 0.48), scale=10)
robe = mat_basic('robe', (0.25, 0.05, 0.05), 0.6)
for i, x in enumerate((-2.1, -1.8, -1.5)):
    cyl('robe%d' % i, 0.07, 0.32, (x, D - 0.25, 1.2 + 0.16), robe, verts=16)
    sphere('santoHead%d' % i, 0.045, (x, D - 0.25, 1.58), santo)
    cyl('robeB%d' % i, 0.06, 0.26, (x + 0.05, D - 0.3, 0.72 + 0.13), robe, verts=16)
for z in (0.6, 1.15, 1.75):
    box('shelf%.2f' % z, (0.9, 0.4, 0.02), (-1.8, D - 0.25, z), wood)

# wall clock
cyl('clock', 0.17, 0.05, (1.2, D - 0.03, 2.0), wood, rot=(math.radians(90), 0, 0))
face = mat_basic('face', (0.75, 0.7, 0.6), 0.6)
cyl('clockFace', 0.14, 0.01, (1.2, D - 0.06, 2.0), face, rot=(math.radians(90), 0, 0))
hand = mat_basic('hand', (0.02, 0.02, 0.02), 0.5)
box('hand1', (0.01, 0.005, 0.1), (1.2, D - 0.07, 2.04), hand)
box('hand2', (0.07, 0.005, 0.01), (1.23, D - 0.07, 2.0), hand)

# jalousie window, right wall
wr = bpy.data.objects['WallR']
c = box('c', (0.5, 1.5, 1.2), (W / 2, 2.6, 1.6)); cut(wr, c)
jal = mat_basic('jal', (0.6, 0.65, 0.65), 0.15, trans=0.6)
for j in range(10):
    box('slat%d' % j, (0.02, 1.48, 0.11), (W / 2, 2.6, 1.06 + j * 0.12), jal, rot=(math.radians(25), 0, 0))
area('moon', (W / 2 + 1.0, 2.6, 2.0), (0, math.radians(-75), 0), 50, size=(1.5, 1.2), color=(0.4, 0.55, 1.0))

# light switch on back wall + fluorescent tube
box('switch', (0.08, 0.02, 0.12), (0.95, D - 0.01, 1.3), mat_basic('sw', (0.7, 0.68, 0.6), 0.5), bevel=0.005)
tube_on = LIGHTS
tm = mat_basic('tube', (0.9, 0.95, 0.9), 0.3, emit=(0.85, 1.0, 0.9), emit_str=12 if tube_on else 0)
cyl('tube', 0.02, 1.2, (0, 2.6, H - 0.06), tm, rot=(0, math.radians(90), 0))
if tube_on:
    area('tubeL', (0, 2.6, H - 0.1), (0, 0, 0), 120, size=(1.2, 0.1), color=(0.85, 1.0, 0.9))

# plastic-covered sofa in foreground right (we stand beside it)
fabric = mat_floral('sofa', (0.2, 0.16, 0.08), (0.3, 0.22, 0.1), (0.12, 0.1, 0.05), scale=6)
plastic = mat_basic('plastic', (0.95, 0.95, 0.95), 0.05, trans=0.9)
s1 = box('sofaSeat', (1.9, 0.8, 0.45), (1.3, 1.2, 0.25), fabric, bevel=0.06)
s2 = box('sofaBack', (1.9, 0.22, 0.85), (1.3, 0.78, 0.45), fabric, bevel=0.06)
box('sofaArm', (0.22, 0.8, 0.6), (0.36, 1.2, 0.32), fabric, bevel=0.06)
pc = box('sofaPlastic', (1.96, 0.86, 0.5), (1.3, 1.2, 0.26), plastic, bevel=0.06)

# rug
rug = mat_floral('rug', (0.18, 0.06, 0.04), (0.3, 0.2, 0.1), (0.08, 0.1, 0.12), scale=5)
box('rug', (2.0, 1.4, 0.01), (-0.2, 2.6, 0.005), rug)

if MALIK:
    st = bpy.data.materials.new('malik'); st.use_nodes = True; nt = st.node_tree
    bs = nt.nodes['Principled BSDF']; bs.inputs['Base Color'].default_value = (0.0005, 0.0008, 0.001, 1); bs.inputs['Roughness'].default_value = 1.0; bs.inputs['Specular IOR Level'].default_value = 0.0
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz2 = nt.nodes.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = 300
    nt.links.new(tc.outputs['Object'], nz2.inputs['Vector'])
    cr2 = nt.nodes.new('ShaderNodeValToRGB'); cr2.color_ramp.elements[0].position = 0.62; cr2.color_ramp.elements[1].position = 0.7
    cr2.color_ramp.elements[0].color = (0, 0, 0, 1); cr2.color_ramp.elements[1].color = (0.5, 0.9, 1.0, 1)
    nt.links.new(nz2.outputs['Fac'], cr2.inputs['Fac']); nt.links.new(cr2.outputs['Color'], bs.inputs['Emission Color'])
    bs.inputs['Emission Strength'].default_value = 1.5
    emn = nt.nodes.new('ShaderNodeEmission'); emn.inputs['Strength'].default_value = 1.4
    nt.links.new(cr2.outputs['Color'], emn.inputs['Color'])
    nt.links.new(emn.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    x0, y0 = 0.62, D - 0.85
    torso = cyl('mTorso', 0.17, 0.9, (x0, y0, 1.35), st, verts=24); torso.scale = (1, 0.6, 1)
    cyl('mHips', 0.13, 0.25, (x0, y0, 0.85), st, verts=24)
    for s in (-1, 1):
        cyl('mLeg%d' % s, 0.055, 0.85, (x0 + s * 0.08, y0, 0.42), st, verts=12)
        arm = cyl('mArm%d' % s, 0.035, 1.3, (x0 + s * 0.27, y0 - 0.05, 1.08), st, rot=(math.radians(-10), math.radians(s * 11), 0), verts=12)
        bd = arm.modifiers.new('bd', 'SIMPLE_DEFORM'); bd.deform_method = 'BEND'; bd.angle = math.radians(s * 35); bd.deform_axis = 'Y'
        sphere('mHand%d' % s, 0.05, (x0 + s * 0.39, y0 - 0.1, 0.45), st, scale=(0.5, 0.4, 2.2))
    head = sphere('mHead', 0.14, (x0 + 0.03, y0, 1.98), st, scale=(0.95, 0.85, 1.15))
    head.rotation_euler = (math.radians(-12), math.radians(32), 0); head.location.x += 0.08
    sm = mat_basic('smile', (0.6, 0.9, 0.95), 0.3, emit=(0.6, 0.95, 1.0), emit_str=2.2)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.11, minor_radius=0.005, location=(x0 + 0.1, y0 - 0.125, 1.95), rotation=(math.radians(90), 0, 0))
    smile = bpy.context.active_object; smile.scale = (1.25, 1, 0.45); smile.rotation_euler = (math.radians(90), math.radians(-25), 0); smile.data.materials.append(sm)
    cb = box('smileCut', (0.4, 0.4, 0.2), (x0 + 0.1, y0 - 0.125, 2.03)); cut(smile, cb)

camera((-0.35, 1.0, 1.55), (0.25, D, 1.1), lens=22)
render(out)
