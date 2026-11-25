"""Main-menu scene: Lola's house seen from the yard, matching the interiors.
Front (left to right): living-room window (TV glow, Malikmata on the sill), front door with the red floral curtain (Kumot behind it),
bedroom window with iron grill + red curtain (Barang's eyes in the gap, Silip hovering outside). Right side: kitchen jalousie (Kalansing).
usage: python3 menu.py -- out.png SAMPLES [--layer=bg|silip]   (also writes out_pos.json with screen positions for the UI)"""
import sys, os, math, random, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from pinoy import *
from entities import build_kumot_batibat, build_tiyanak, build_kalansing, add_aswang_tongue, build_manananggal, skin_body
from entities2 import build_barang, group_at
import mathutils
sc = reset()
A = sys.argv[sys.argv.index('--') + 1:]
out = A[0]; sc.cycles.samples = int(A[1]) if len(A) > 1 else 48
LAYER = 'bg'
for a in A:
    if a.startswith('--layer='): LAYER = a.split('=')[1]
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.004, 0.005, 0.011, 1)

# ---------------------------------------------------------------- yard
yard = mat_noise('yard', (0.02, 0.022, 0.014), (0.055, 0.05, 0.035), scale=3, bump=0.5)
box('ground', (60, 60, 0.1), (0, 8, -0.05), yard)
hb = mat_hollowblock('hb'); tb = mat_tabla('tabla', paint=(0.19, 0.24, 0.2))
wood = mat_planks('wd', (0.07, 0.035, 0.015), (0.1, 0.05, 0.02), scale=3, rough=0.45)
# ---------------------------------------------------------------- the house (front faces -y at y=FY)
HX, FY, HW, HD = 0.0, 6.0, 9.0, 6.0
low = box('houseLow', (HW, HD, 1.2), (HX, FY + HD / 2, 0.6), hb)
up = box('houseUp', (HW, HD, 1.75), (HX, FY + HD / 2, 2.075), tb)
for x_ in (-HW / 2, HW / 2):
    box('post%d' % int(x_), (0.14, 0.14, 2.95), (x_, FY - 0.02, 1.48), wood)
box('beltBeam', (HW + 0.1, 0.08, 0.1), (HX, FY - 0.03, 1.22), wood)
# roof: GI sheets with rust streaks
yero = mat_noise('yero', (0.1, 0.085, 0.07), (0.3, 0.2, 0.13), scale=4, rough=0.5, bump=0.3)
yero.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.55
for s_ in (-1, 1):
    r = box('roof%d' % s_, (HW + 0.8, HD / 2 + 0.9, 0.03), (HX, FY + HD / 2 + s_ * (HD / 4 + 0.15), 3.55), yero, rot=(math.radians(s_ * -22), 0, 0))
    wv = r.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('corr%d' % s_, 'WOOD'); t.wood_type = 'BANDS'; t.noise_basis_2 = 'SIN'; t.noise_scale = 0.03
    sb = r.modifiers.new('sub', 'SUBSURF'); sb.levels = 3; sb.subdivision_type = 'SIMPLE'; r.modifiers.move(1, 0)
    wv.texture = t; wv.strength = 0.03
box('fascia', (HW + 0.8, 0.04, 0.18), (HX, FY - 0.86, 3.03), wood)
for i, x_ in enumerate((-3.2, 0.6, 2.9)):   # old tyres + hollow blocks holding the roof down
    cyl('tyre%d' % i, 0.28, 0.16, (x_, FY + 0.5, 3.6), mat_basic('rubber', (0.01, 0.01, 0.01), 0.7), rot=(math.radians(22), 0, 0))
# stains running down the walls
for i in range(7):
    decal('wallStain%d' % i, mat_stain('ws%d' % i, (0.03, 0.025, 0.015), scale=random.Random(i).uniform(2, 4), seed=i * 3.1), (random.Random(i).uniform(-4, 4), FY - 0.006, 1.6), (random.Random(i + 9).uniform(0.6, 1.4), 2.2), '-y')

def cut_wall(x, z, w, h, depth=0.5):
    for o in (low, up):
        cut(o, box('cut', (w, depth, h), (x, FY, z)))

# --- living-room window (left): sliding capiz half open, blue TV light inside
LX = -2.9
cut_wall(LX, 1.75, 1.3, 1.0)
inner = mat_basic('innerDark', (0.012, 0.01, 0.008), 0.9)
box('livBack', (3.0, 0.1, 2.6), (LX, FY + 1.6, 1.4), inner)
tvglow = emission('tvGlow', (0.45, 0.75, 1.0), 5.0)
box('tvScreen', (0.5, 0.05, 0.38), (LX + 0.35, FY + 1.5, 1.2), tvglow)
area('tvLight', (LX + 0.35, FY + 1.3, 1.25), (math.radians(90), 0, 0), 40, size=(0.5, 0.4), color=(0.45, 0.75, 1.0))
capiz = mat_basic('capiz', (0.8, 0.76, 0.64), 0.4)
_nt = capiz.node_tree; _tl = _nt.nodes.new('ShaderNodeBsdfTranslucent'); _tl.inputs['Color'].default_value = (0.9, 0.85, 0.7, 1)
_mx = _nt.nodes.new('ShaderNodeMixShader'); _mx.inputs['Fac'].default_value = 0.6
_nt.links.new(_nt.nodes['Principled BSDF'].outputs[0], _mx.inputs[1]); _nt.links.new(_tl.outputs[0], _mx.inputs[2])
_nt.links.new(_mx.outputs[0], _nt.nodes['Material Output'].inputs['Surface'])
for j in range(3):
    for i in range(2):
        box('lcz%d%d' % (i, j), (0.28, 0.01, 0.28), (LX - 0.48 + i * 0.31, FY - 0.03, 1.4 + j * 0.31), capiz)
box('lSash', (0.03, 0.03, 1.0), (LX - 0.15, FY - 0.04, 1.75), wood)
box('lSill', (1.45, 0.16, 0.05), (LX, FY - 0.06, 1.23), wood)
# --- front door (center) with the red floral curtain hanging in it
DX = 0.25
cut_wall(DX, 1.0, 0.95, 2.0)
box('hallBack', (2.0, 0.1, 2.6), (DX, FY + 2.5, 1.3), inner)
point('hallBulb', (DX - 0.2, FY + 1.6, 2.4), 5, color=(1.0, 0.6, 0.3), radius=0.05)
box('doorStep', (1.3, 0.5, 0.12), (DX, FY - 0.25, 0.06), mat_cement('step'))
curt = mat_floral('frontCurtain', (0.45, 0.12, 0.14), (0.6, 0.45, 0.3), (0.3, 0.05, 0.08), scale=10)
for s_, w_, off in ((-1, 0.42, -0.24), (1, 0.32, 0.31)):   # parted: a gap left of center
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=40, y_subdivisions=6, size=1, location=(0, 0, 0))
    c = bpy.context.active_object; c.scale = (w_, 1.9, 1); bpy.ops.object.transform_apply(scale=True)
    t = bpy.data.textures.new('fc%d' % s_, 'WOOD'); t.wood_type = 'BANDS'; t.noise_basis_2 = 'SIN'; t.noise_scale = 0.05
    dm = c.modifiers.new('d', 'DISPLACE'); dm.texture = t; dm.strength = 0.05; dm.texture_coords = 'OBJECT'
    c.modifiers.new('s', 'SOLIDIFY').thickness = 0.004; c.data.materials.append(curt)
    c.rotation_euler = (math.radians(90), 0, 0); c.location = (DX + off, FY + 0.05, 1.02)
cyl('doorRod', 0.012, 1.1, (DX, FY + 0.03, 1.98), mat_basic('brass', (0.6, 0.42, 0.15), 0.3, metal=1.0), rot=(0, math.radians(90), 0), verts=10)
# --- bedroom window (right): iron grill, red curtain inside parted a little
BX = 2.75
cut_wall(BX, 1.55, 1.2, 1.1)
box('bedBack', (3.0, 0.1, 2.6), (BX, FY + 2.2, 1.4), inner)
point('bedBulb', (BX - 0.4, FY + 1.5, 2.5), 7, color=(1.0, 0.6, 0.3), radius=0.04)
iron = mat_noise('iron', (0.03, 0.025, 0.022), (0.12, 0.06, 0.03), scale=30, rough=0.55, bump=0.2)
for k in range(9):
    cyl('gbar%d' % k, 0.009, 1.1, (BX - 0.53 + k * 0.133, FY - 0.08, 1.55), iron, verts=10)
for z_ in (1.3, 1.78):
    box('gbarH%d' % int(z_ * 100), (1.2, 0.012, 0.03), (BX, FY - 0.08, z_), iron)
bcurt = mat_floral('bedCurtain', (0.45, 0.12, 0.14), (0.6, 0.45, 0.3), (0.3, 0.05, 0.08), scale=10)
for s_, w_, off in ((-1, 0.5, -0.33), (1, 0.55, 0.32)):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=40, y_subdivisions=6, size=1, location=(0, 0, 0))
    c = bpy.context.active_object; c.scale = (w_, 1.2, 1); bpy.ops.object.transform_apply(scale=True)
    t = bpy.data.textures.new('bc%d' % s_, 'WOOD'); t.wood_type = 'BANDS'; t.noise_basis_2 = 'SIN'; t.noise_scale = 0.06
    dm = c.modifiers.new('d', 'DISPLACE'); dm.texture = t; dm.strength = 0.05; dm.texture_coords = 'OBJECT'
    c.modifiers.new('s', 'SOLIDIFY').thickness = 0.004; c.data.materials.append(bcurt)
    c.rotation_euler = (math.radians(90), 0, 0); c.location = (BX + off, FY + 0.12, 1.55)
box('bSill', (1.35, 0.18, 0.05), (BX, FY - 0.07, 0.98), wood)
# --- kitchen jalousie on the right side wall
KY = FY + 3.9
for o in (low, up): cut(o, box('kcut', (0.5, 1.0, 0.8), (HW / 2, KY, 1.75)))
box('kBack', (0.1, 2.0, 2.4), (HW / 2 - 1.2, KY, 1.4), inner)
point('kBulb', (HW / 2 - 0.8, KY, 2.3), 4, color=(0.75, 1.0, 0.6), radius=0.05)
glass = mat_basic('jal', (0.3, 0.35, 0.3), 0.08, trans=0.6)
for j in range(6):
    box('jal%d' % j, (0.1, 0.95, 0.01), (HW / 2 + 0.02, KY, 1.42 + j * 0.13), glass, rot=(0, math.radians(-35), 0))

# ---------------------------------------------------------------- yard dressing: talisay tree, fence, electric post, clothesline, gate
bark = mat_noise('bark', (0.03, 0.022, 0.015), (0.08, 0.06, 0.04), scale=12, bump=0.5)
tx, ty = 7.6, 4.2
skin_body('trunk', [(tx, ty, -0.1), (tx + 0.1, ty + 0.1, 1.8), (tx - 0.1, ty + 0.2, 3.3), (tx + 0.2, ty + 0.1, 4.6)], [(0, 1), (1, 2), (2, 3)], [0.28, 0.22, 0.16, 0.09], bark, sub=2)
skin_body('br1', [(tx, ty + 0.1, 2.0), (tx - 1.3, ty + 0.9, 2.8), (tx - 2.4, ty + 1.3, 3.4)], [(0, 1), (1, 2)], [0.11, 0.07, 0.03], bark, sub=2)
leaf = mat_noise('leaves', (0.006, 0.012, 0.006), (0.02, 0.035, 0.015), scale=14, bump=0.6)
rnd = random.Random(5)
for i in range(12):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=rnd.uniform(0.8, 1.3), location=(tx + rnd.uniform(-2.2, 1.0), ty + rnd.uniform(-0.6, 1.6), rnd.uniform(3.6, 5.0)))
    lo = bpy.context.active_object; dm = lo.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('lf%d' % i, 'CLOUDS'); t.noise_scale = 0.35; dm.texture = t; dm.strength = 0.6
    lo.data.materials.append(leaf)
box('fenceL', (0.2, 12, 1.9), (-6.6, 6, 0.95), hb); box('fenceB', (14, 0.2, 1.9), (0, 13.5, 0.95), hb)
cyl('ePost', 0.13, 7.5, (-5.6, 2.2, 3.75), mat_noise('postC', (0.1, 0.1, 0.1), (0.18, 0.17, 0.16), scale=6))
box('ePostX', (1.5, 0.1, 0.1), (-5.6, 2.2, 7.0), wood)
wire = mat_basic('wire', (0.01, 0.01, 0.01), 0.6)
for k in (-0.6, 0.6):
    p0 = mathutils.Vector((-5.6 + k, 2.2, 6.9)); p1 = mathutils.Vector((HW / 2 - 0.3 if k > 0 else -HW / 2 + 0.3, FY - 0.3, 3.1))
    d = p1 - p0; w_ = cyl('wire%d' % int(k * 10), 0.007, d.length, tuple((p0 + p1) / 2), wire, verts=6); w_.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
clothesline(-5.5, -3.8, 3.6, 1.9, n=4, seed=8)
batya(-3.9, 4.9); galon(-3.4, 5.1)
monobloc(-1.6, 4.7, rotz=math.radians(200))

# ---------------------------------------------------------------- entities, each where it lives
POS = {}
def mark(name, p): POS[name] = p
if LAYER == 'bg':
    before = set(o.name for o in bpy.data.objects); build_kumot_batibat(0, 0, peer=False); group_at(before, (DX + 0.12, FY + 0.55, 0), 0)
    point('kumotKey', (DX - 0.1, FY - 0.9, 2.2), 5, color=(1.0, 0.65, 0.4), radius=0.3)
    before = set(o.name for o in bpy.data.objects); build_tiyanak(0, 0, 0.0, crawl=True); group_at(before, (LX + 0.35, FY - 0.12, 1.26), math.radians(15))
    # Barang: only her eyes in the gap of the bedroom curtain, and a grey hand on its edge
    build_barang((BX - 0.02, FY + 0.55, 0.0), rotz=0.0, stage=2, glow=2.2)
    before = set(o.name for o in bpy.data.objects); build_kalansing(0, 0); add_aswang_tongue(0, 0); group_at(before, (HW / 2 + 0.35, KY - 0.6, 0.0), math.radians(-70))
    point('kalKey', (HW / 2 + 1.6, FY + 1.8, 1.6), 30, color=(0.7, 1.0, 0.65), radius=0.3)
if LAYER in ('bg', 'silip'):
    pass
SIL = (BX + 1.2, FY - 1.1, 2.9)
if LAYER == 'silip':
    # only Silip, on a transparent background, so the menu can let her hover
    for o in list(bpy.data.objects):
        if o.type == 'MESH': o.hide_render = True
    sc.render.film_transparent = True
    before = set(o.name for o in bpy.data.objects); build_manananggal(0, 0, 0, wing=1.05)
    for o in bpy.data.objects:
        if o.name.startswith('wing') and o.type == 'MESH' and o.data.materials:
            b = o.data.materials[0].node_tree.nodes['Principled BSDF']; b.inputs['Transmission Weight'].default_value = 0.0
            try: b.inputs['Subsurface Weight'].default_value = 0.05
            except Exception: pass
    group_at(before, SIL, math.radians(-15))
    point('silKey', (BX + 0.2, FY - 2.6, 2.8), 14, color=(0.6, 0.7, 1.0), radius=0.4)

# moon: sun lamp + disc behind the tree
ld = bpy.data.lights.new('moon', 'SUN'); ld.energy = 1.4; ld.color = (0.5, 0.62, 1.0); ld.angle = 0.03
mo = bpy.data.objects.new('moon', ld); mo.rotation_euler = (math.radians(62), 0, math.radians(28)); bpy.context.collection.objects.link(mo)
sphere('moonDisc', 1.3, (16, 44, 18), emission('moonDisc', (0.85, 0.88, 0.95), 2.5))
point('yardFill', (2.0, 0.5, 3.0), 40, color=(0.55, 0.65, 1.0), radius=1.5)
sc.view_settings.exposure = 0.45
cam = camera((5.2, -0.4, 1.4), (0.6, 7.2, 2.1), lens=20)
bpy.context.view_layer.update()
from bpy_extras.object_utils import world_to_camera_view
def scr(p):
    v = world_to_camera_view(sc, cam, mathutils.Vector(p)); return [round(v[0], 4), round(1 - v[1], 4)]
pts = {'eye_kumot': (DX + 0.12, FY + 0.38, 1.6), 'eye_malikmata': (LX + 0.3, FY - 0.3, 1.5), 'eye_barang': (BX - 0.02, FY + 0.48, 1.47),
       'eye_kalansing': (HW / 2 + 0.6, KY - 1.3, 1.0), 'silip': SIL,
       'tv_tl': (LX - 0.65, FY, 2.25), 'tv_br': (LX + 0.65, FY, 1.25), 'bed_tl': (BX - 0.6, FY, 2.1), 'bed_br': (BX + 0.6, FY, 1.0),
       'door_tl': (DX - 0.48, FY, 2.0), 'door_br': (DX + 0.48, FY, 0.0), 'kit_tl': (HW / 2, KY - 0.5, 2.15), 'kit_br': (HW / 2, KY + 0.5, 1.35)}
json.dump({k: scr(p) for k, p in pts.items()}, open(out.rsplit('.', 1)[0] + '_pos.json', 'w'))
render(out)
