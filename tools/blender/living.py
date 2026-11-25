import sys, math; sys.path.insert(0, '/home/claude/render')
from lib import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = a[0] if a else '/home/claude/render/out/living.png'
sc.cycles.samples = int(a[1]) if len(a) > 1 else 40
MALIK = '--malik' in a
LIGHTS = '--lights' in a

W, D, H = 5.0, 4.6, 2.8
from pinoy import *
plaster = mat_hollowblock()
ceil = mat_plywood('plyLiv')
tile = mat_cement()
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

grime(W, D, H, seed=5, n=11, color=(0.03, 0.04, 0.035))
gi_roof(W, D, H)
framed('lastSupperLiv', (1.85, D - 0.01, 2.15), (0.9, 0.45), '-y', mat_last_supper('ls2'))
plastic_wardrobe(-2.05, 1.4, color=(0.12, 0.08, 0.06), rotz=math.radians(-90))
doily(0, D - 0.33, 1.165, 0.2)
monobloc(-0.9, 1.6, rotz=math.radians(160)); monobloc(-1.5, 2.2, rotz=math.radians(120))
santo_nino(-1.8, D - 0.25, 1.9)
galon(2.1, D - 0.4)
wire_run([(0.95, D - 0.02, 1.36), (0.95, D - 0.02, H - 0.02), (0, D - 0.02, H - 0.02), (0, 2.6, H - 0.02)])
if MALIK:
    from entities import build_tiyanak
    build_tiyanak(0.15, D - 0.75, 0.0, crawl=True)
    point('tyKey', (0.15, D - 1.6, 0.6), 4, color=(0.55, 0.9, 1.0), radius=0.2)

camera((-0.35, 1.0, 1.55), (0.25, D, 1.1), lens=22)
render(out)
