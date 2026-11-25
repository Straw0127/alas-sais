import sys, os, math, random; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from pinoy import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:]
out = a[0]; sc.cycles.samples = int(a[1]) if len(a) > 1 else 40
w = sc.world.node_tree.nodes['Background']; w.inputs[0].default_value = (0.0015, 0.002, 0.004, 1)

# ground + dirt yard
box('ground', (60, 60, 0.1), (0, 10, -0.05), mat_noise('yard', (0.02, 0.025, 0.015), (0.05, 0.045, 0.03), scale=3, bump=0.5))
# the house: hollow-block lower half, wooden upper half, GI-sheet roof
hb = mat_hollowblock('hbExt'); tb = mat_tabla('tablaExt', paint=(0.2, 0.22, 0.2))
HX, HY = 0.0, 9.0
box('houseLow', (8, 6, 1.4), (HX, HY, 0.7), hb)
box('houseUp', (8, 6, 1.6), (HX, HY, 2.2), tb)
roofM = mat_noise('yero', (0.12, 0.1, 0.08), (0.28, 0.2, 0.14), scale=4, rough=0.5, bump=0.3)
for s_ in (-1, 1):
    r = box('roof%d' % s_, (8.6, 3.6, 0.04), (HX, HY + s_ * 1.55, 3.55), roofM, rot=(math.radians(s_ * -24), 0, 0))
    wv = r.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('corr%d' % s_, 'WOOD'); t.wood_type = 'BANDS'; t.noise_basis_2 = 'SIN'; t.noise_scale = 0.03
    wv.texture = t; wv.strength = 0.03
gable = mat_tabla('gable', paint=(0.16, 0.15, 0.13))
bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=3.6, depth=0.1, location=(HX, HY - 3.0, 3.4), rotation=(math.radians(90), 0, 0))
g = bpy.context.active_object; g.scale = (1.15, 0.45, 1); g.data.materials.append(gable)
# windows: capiz (dim, warm), one curtained window glowing red with a figure behind it
capiz = mat_basic('capizExt', (0.85, 0.8, 0.65), 0.4, emit=(1.0, 0.7, 0.4), emit_str=0.6)
for i, x in enumerate((-2.6, -1.3)):
    box('win%d' % i, (0.9, 0.05, 0.9), (HX + x, HY - 3.01, 2.25), capiz)
    for k in range(4):
        box('wg%d%d' % (i, k), (0.02, 0.06, 0.9), (HX + x - 0.45 + k * 0.3, HY - 3.02, 2.25), mat_basic('wgM', (0.03, 0.02, 0.01), 0.7))
red = mat_basic('redWin', (0.5, 0.08, 0.05), 0.6, emit=(0.9, 0.18, 0.08), emit_str=2.2)
box('redWin', (1.1, 0.05, 1.1), (HX + 1.9, HY - 3.01, 2.2), red)
sil = mat_basic('sil', (0.0, 0.0, 0.0), 1.0)
sphere('silHead', 0.12, (HX + 1.95, HY - 3.03, 2.42), sil, scale=(1, 0.2, 1.2))
box('silBody', (0.26, 0.02, 0.7), (HX + 1.95, HY - 3.03, 1.95), sil)
box('silArmL', (0.03, 0.02, 0.6), (HX + 1.78, HY - 3.03, 1.85), sil); box('silArmR', (0.03, 0.02, 0.6), (HX + 2.12, HY - 3.03, 1.85), sil)
point('redSpill', (HX + 1.9, HY - 3.6, 2.2), 25, color=(1.0, 0.25, 0.1), radius=0.4)
box('door', (1.0, 0.05, 2.0), (HX - 0.1, HY - 3.01, 1.0), mat_planks('doorExt', (0.06, 0.035, 0.015), (0.08, 0.045, 0.02), scale=3))
# mango tree, left
bark = mat_noise('bark', (0.02, 0.015, 0.01), (0.05, 0.04, 0.03), scale=20, bump=0.6)
leaf = mat_noise('leaf', (0.004, 0.01, 0.005), (0.015, 0.03, 0.012), scale=8, bump=0.5)
cyl('trunk', 0.35, 5, (-6.0, 6.5, 2.5), bark, verts=16)
random.seed(2)
for i in range(12):
    s_ = sphere('fol%d' % i, random.uniform(1.4, 2.2), (-6.0 + random.uniform(-2.5, 2.5), 6.5 + random.uniform(-1.5, 1.5), 5.5 + random.uniform(-0.8, 1.2)), leaf)
    d = s_.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('fl%d' % i, 'CLOUDS'); t.noise_scale = 0.5; d.texture = t; d.strength = 0.7
# rusty gate in the foreground
iron = mat_noise('gateIron', (0.02, 0.015, 0.012), (0.08, 0.04, 0.02), scale=30, rough=0.7)
for i in range(26):
    cyl('bar%d' % i, 0.02, 2.1, (-5.0 + i * 0.4, 1.2, 1.05), iron, verts=8)
box('gateTop', (10.5, 0.06, 0.06), (0, 1.2, 2.05), iron); box('gateMid', (10.5, 0.06, 0.06), (0, 1.2, 1.0), iron)
# moon + rim
ld = bpy.data.lights.new('moon', 'SUN'); ld.energy = 0.3; ld.color = (0.5, 0.62, 1.0); ld.angle = 0.03
mo = bpy.data.objects.new('moon', ld); mo.rotation_euler = (math.radians(62), 0, math.radians(150)); bpy.context.collection.objects.link(mo)
moonM = emission('moonDisc', (0.85, 0.88, 0.9), 2.5)
sphere('moonDisc', 1.2, (14, 40, 16), moonM)
sc.view_settings.exposure = -0.2
camera((0.4, -3.2, 1.55), (0.3, 9, 2.2), lens=28)
render(out)
