import sys, os, math, random; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from pinoy import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:]
out = a[0]; sc.cycles.samples = int(a[1]) if len(a) > 1 else 32
WHO = a[2] if len(a) > 2 else ''
SALATV = '--salatv' in a
if SALATV: a = [x for x in a if x != '--salatv']; WHO = a[2] if len(a) > 2 else ''

# narrow hallway, camera at the bedroom end looking toward the living room
W, D, H = 1.3, 6.5, 2.7
wall = mat_tabla('tablaHall', paint=(0.3, 0.26, 0.2))
room(W, D, H, wall, mat_cement('cementHall'), mat_plywood('plyHall'))
grime(W, D, H, seed=21, n=12)
wood = mat_planks('frame', (0.07, 0.035, 0.015), (0.1, 0.05, 0.02), scale=3, rough=0.45)
# side doorways (dark) and a doorway at the end
for side, y in ((-1, 2.2), (1, 3.6)):
    c = box('c', (0.4, 0.85, 2.05), (side * W / 2, y, 1.02)); cut(bpy.data.objects['WallL' if side < 0 else 'WallR'], c)
    box('beyond%d' % side, (0.1, 1.2, 2.6), (side * (W / 2 + 0.6), y, 1.3), mat_basic('void', (0.005, 0.005, 0.005), 0.9) if not (SALATV and side > 0) else mat_hollowblock('salaHB'))
if SALATV:   # the TV in the living room has been switched on: its flicker spills out of the right doorway
    box('salaFl', (1.2, 1.4, 0.1), (W / 2 + 0.6, 3.6, -0.05), mat_cement('salaCem'))
    area('tvGlow', (W / 2 + 0.55, 3.75, 0.95), (0, math.radians(90), 0), 220, size=(0.56, 0.42), color=(0.5, 0.8, 1.0))
    point('tvSpill', (W / 2 + 0.25, 3.6, 1.0), 30, color=(0.5, 0.8, 1.0), radius=0.3)
c = box('c', (0.85, 0.5, 2.05), (0, D, 1.02)); cut(bpy.data.objects['WallBack'], c)
# the back door near the start of the hall, with the same red floral curtain as the bedroom window
cut(bpy.data.objects['WallR'], box('cbd', (0.4, 0.85, 2.05), (W / 2, 1.0, 1.02)))
bcm = mat_floral('backCurtain', (0.45, 0.12, 0.14), (0.6, 0.45, 0.3), (0.3, 0.05, 0.08), scale=10)
for s_ in (-1, 1):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=40, y_subdivisions=6, size=1, location=(0, 0, 0))
    cc = bpy.context.active_object; cc.scale = (0.46, 1.9, 1); bpy.ops.object.transform_apply(scale=True)
    tt = bpy.data.textures.new('bct%d' % s_, 'WOOD'); tt.wood_type = 'BANDS'; tt.noise_basis_2 = 'SIN'; tt.noise_scale = 0.06
    dmm = cc.modifiers.new('d', 'DISPLACE'); dmm.texture = tt; dmm.strength = 0.05; dmm.texture_coords = 'OBJECT'
    cc.modifiers.new('s', 'SOLIDIFY').thickness = 0.004; cc.data.materials.append(bcm)
    cc.rotation_euler = (math.radians(90), 0, math.radians(90)); cc.location = (W / 2 - 0.02, 1.0 + s_ * 0.21, 1.02)
box('endroom', (3, 0.1, 2.7), (0, D + 1.5, 1.35), mat_hollowblock('hbEnd'))
box('endfloor', (3, 3, 0.1), (0, D + 1.0, -0.05), mat_cement('cementEnd'))
# family photos on the left wall, one turned face-down
photo = mat_noise('photo', (0.1, 0.09, 0.08), (0.35, 0.3, 0.25), scale=25)
random.seed(4)
for i, (y, z) in enumerate(((0.9, 1.6), (1.3, 1.75), (1.35, 1.35), (4.4, 1.6), (4.9, 1.55))):
    f = box('pf%d' % i, (0.02, 0.26, 0.32), (-W / 2 + 0.015, y, z), wood, rot=(math.radians(random.uniform(-6, 6)), 0, 0))
    box('pp%d' % i, (0.005, 0.2, 0.26), (-W / 2 + 0.028, y, z), photo if i != 2 else wood, rot=f.rotation_euler)
# a rosary and a calendar on the right wall
cal = mat_noise('cal', (0.6, 0.56, 0.46), (0.72, 0.68, 0.56), scale=20)
box('cal', (0.01, 0.3, 0.45), (W / 2 - 0.01, 2.3, 1.5), cal)
box('calTop', (0.012, 0.3, 0.1), (W / 2 - 0.012, 2.3, 1.68), mat_basic('calR', (0.4, 0.05, 0.03), 0.7))
wire_run([(W / 2 - 0.02, 0.4, H - 0.02), (W / 2 - 0.02, D - 0.4, H - 0.02)])
# one dim bulb halfway down, a stronger one in the far room
gl = mat_basic('bulb', (1, 0.85, 0.6), 0.1, emit=(1.0, 0.6, 0.3), emit_str=6)
b = sphere('bulb', 0.045, (0, 3.2, H - 0.4), gl); b.visible_shadow = False
point('bulbL', (0, 3.2, H - 0.42), 14, color=(1.0, 0.6, 0.3), radius=0.04)
point('farL', (0.6, D + 1.0, 2.2), 30, color=(0.5, 0.65, 1.0), radius=0.2)
if WHO == 'kumot':
    from entities import build_kumot_batibat
    build_kumot_batibat(0.1, D - 0.6)
elif WHO == 'malik':
    from entities import build_malikmata
    build_malikmata(0.0, D + 0.4)
camera((0.1, 0.2, 1.58), (0.0, D, 1.35), lens=24)
render(out)
