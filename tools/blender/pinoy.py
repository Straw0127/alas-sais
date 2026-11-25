"""Poor Filipino house materials and props for ALAS-SAIS."""
import bpy, math, random
from lib import *

def _base(name, rough=0.85):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    return m, nt, b

def mat_hollowblock(name='hollowblock'):
    """Unpainted CHB wall: grey blocks, darker mortar, cement-patch noise."""
    m, nt, b = _base(name, 0.95)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (math.radians(90), 0, 0)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    br = nt.nodes.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 2.5
    br.inputs['Brick Width'].default_value = 0.8; br.inputs['Row Height'].default_value = 0.4; br.inputs['Mortar Size'].default_value = 0.012
    br.inputs['Color1'].default_value = (0.24, 0.235, 0.22, 1); br.inputs['Color2'].default_value = (0.2, 0.195, 0.18, 1)
    br.inputs['Mortar'].default_value = (0.13, 0.125, 0.115, 1)
    nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 30; nz.inputs['Detail'].default_value = 10
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'OVERLAY'; mx.inputs['Factor'].default_value = 0.5
    nt.links.new(br.outputs['Color'], mx.inputs['A']); nt.links.new(nz.outputs['Color'], mx.inputs['B'])
    nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.5
    nt.links.new(br.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def mat_tabla(name='tabla', paint=(0.22, 0.3, 0.24), wood=(0.12, 0.07, 0.035)):
    """Vertical wooden plank wall with peeling old paint."""
    m, nt, b = _base(name, 0.8)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, 0)
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); com = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs[0]); ad0 = nt.nodes.new('ShaderNodeMath'); ad0.operation = 'ADD'
    nt.links.new(sep.outputs['X'], ad0.inputs[0]); nt.links.new(sep.outputs['Y'], ad0.inputs[1])
    nt.links.new(sep.outputs['Z'], com.inputs['X']); nt.links.new(ad0.outputs['Value'], com.inputs['Y'])
    nt.links.new(com.outputs[0], mp.inputs['Vector'])
    br = nt.nodes.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 1.0
    br.inputs['Brick Width'].default_value = 3.0; br.inputs['Row Height'].default_value = 0.16; br.inputs['Mortar Size'].default_value = 0.006
    br.offset = 0.0
    br.inputs['Color1'].default_value = (*wood, 1); br.inputs['Color2'].default_value = (wood[0] * 0.8, wood[1] * 0.8, wood[2] * 0.8, 1)
    br.inputs['Mortar'].default_value = (0.01, 0.006, 0.003, 1)
    nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    wv = nt.nodes.new('ShaderNodeTexWave'); wv.inputs['Scale'].default_value = 9; wv.inputs['Distortion'].default_value = 12
    nt.links.new(mp.outputs['Vector'], wv.inputs['Vector'])
    m1 = nt.nodes.new('ShaderNodeMix'); m1.data_type = 'RGBA'; m1.blend_type = 'MULTIPLY'; m1.inputs['Factor'].default_value = 0.35
    nt.links.new(br.outputs['Color'], m1.inputs['A']); nt.links.new(wv.outputs['Color'], m1.inputs['B'])
    # peeling paint mask
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 7; nz.inputs['Detail'].default_value = 14; nz.inputs['Roughness'].default_value = 0.7
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = 0.34; cr.color_ramp.elements[1].position = 0.37
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
    m2 = nt.nodes.new('ShaderNodeMix'); m2.data_type = 'RGBA'; m2.inputs['B'].default_value = (*paint, 1)
    nt.links.new(cr.outputs['Color'], m2.inputs['Factor']); nt.links.new(m1.outputs['Result'], m2.inputs['A'])
    nt.links.new(m2.outputs['Result'], b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.35
    ad = nt.nodes.new('ShaderNodeMath'); ad.operation = 'ADD'
    nt.links.new(br.outputs['Fac'], ad.inputs[0]); nt.links.new(cr.outputs['Color'], ad.inputs[1])
    nt.links.new(ad.outputs['Value'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def mat_sawali(name='sawali'):
    """Woven bamboo wall."""
    m, nt, b = _base(name, 0.9)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (math.radians(90), math.radians(45), 0)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    ck = nt.nodes.new('ShaderNodeTexChecker'); ck.inputs['Scale'].default_value = 7
    ck.inputs['Color1'].default_value = (0.36, 0.27, 0.14, 1); ck.inputs['Color2'].default_value = (0.31, 0.23, 0.12, 1)
    nt.links.new(mp.outputs['Vector'], ck.inputs['Vector'])
    wv = nt.nodes.new('ShaderNodeTexWave'); wv.inputs['Scale'].default_value = 25; wv.inputs['Distortion'].default_value = 2
    nt.links.new(mp.outputs['Vector'], wv.inputs['Vector'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 0.7
    nt.links.new(ck.outputs['Color'], mx.inputs['A']); nt.links.new(wv.outputs['Color'], mx.inputs['B'])
    nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.6
    nt.links.new(ck.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def mat_cement(name='cement'):
    """Cracked cement floor with old linoleum patches."""
    m, nt, b = _base(name, 0.75)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 6; nz.inputs['Detail'].default_value = 12
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (0.11, 0.105, 0.1, 1); cr.color_ramp.elements[1].color = (0.2, 0.19, 0.17, 1)
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
    vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'; vo.inputs['Scale'].default_value = 3.5; vo.inputs['Randomness'].default_value = 1.0
    nt.links.new(tc.outputs['Object'], vo.inputs['Vector'])
    ck = nt.nodes.new('ShaderNodeValToRGB'); ck.color_ramp.elements[0].position = 0.0; ck.color_ramp.elements[1].position = 0.005
    ck.color_ramp.elements[0].color = (0.02, 0.02, 0.02, 1)
    nt.links.new(vo.outputs['Distance'], ck.inputs['Fac'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
    nt.links.new(cr.outputs['Color'], mx.inputs['A']); nt.links.new(ck.outputs['Color'], mx.inputs['B'])
    # linoleum patches
    lp = nt.nodes.new('ShaderNodeTexNoise'); lp.inputs['Scale'].default_value = 0.8
    nt.links.new(tc.outputs['Object'], lp.inputs['Vector'])
    lr = nt.nodes.new('ShaderNodeValToRGB'); lr.color_ramp.elements[0].position = 0.55; lr.color_ramp.elements[1].position = 0.57
    nt.links.new(lp.outputs['Fac'], lr.inputs['Fac'])
    lc = nt.nodes.new('ShaderNodeTexChecker'); lc.inputs['Scale'].default_value = 7
    lc.inputs['Color1'].default_value = (0.2, 0.12, 0.08, 1); lc.inputs['Color2'].default_value = (0.25, 0.22, 0.16, 1)
    nt.links.new(tc.outputs['Object'], lc.inputs['Vector'])
    m2 = nt.nodes.new('ShaderNodeMix'); m2.data_type = 'RGBA'
    nt.links.new(lr.outputs['Color'], m2.inputs['Factor']); nt.links.new(mx.outputs['Result'], m2.inputs['A']); nt.links.new(lc.outputs['Color'], m2.inputs['B'])
    nt.links.new(m2.outputs['Result'], b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.3
    nt.links.new(ck.outputs['Color'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def mat_plywood(name='plywood'):
    m = mat_planks(name, (0.2, 0.15, 0.09), (0.23, 0.17, 0.1), mortar=(0.03, 0.02, 0.01), scale=0.35, rough=0.8)
    return m

def mat_white_plastic(name='monobloc'):
    return mat_basic(name, (0.62, 0.6, 0.55), 0.45)

# ---------------------------------------------------------------- props
def monobloc(x, y, rotz=0.0, mat=None):
    mat = mat or mat_white_plastic()
    bpy.ops.object.empty_add(location=(x, y, 0)); e = bpy.context.active_object
    parts = [box('mbSeat', (0.44, 0.42, 0.04), (x, y, 0.44), mat, bevel=0.02),
             box('mbBack', (0.44, 0.04, 0.42), (x, y + 0.2, 0.68), mat, bevel=0.02, rot=(math.radians(-10), 0, 0))]
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(cyl('mbLeg', 0.022, 0.44, (x + sx * 0.19, y + sy * 0.17, 0.22), mat, rot=(math.radians(-sy * 6), math.radians(sx * 6), 0), verts=10))
    for p in parts: p.parent = e; p.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, 0, rotz)
    return e

def kulambo(x, y, w, d, h, z0=0.55):
    m = bpy.data.materials.new('kulambo'); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.4, 0.4, 0.38, 1); b.inputs['Roughness'].default_value = 0.9
    ck = nt.nodes.new('ShaderNodeTexChecker'); ck.inputs['Scale'].default_value = 260
    ck.inputs['Color1'].default_value = (0.55, 0.55, 0.55, 1); ck.inputs['Color2'].default_value = (0.15, 0.15, 0.15, 1)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader'); mx.inputs['Fac'].default_value = 0.1
    nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(b.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z0 + h / 2)); o = bpy.context.active_object; o.name = 'kulambo'
    o.scale = (w, d, h); bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
    for p in o.data.polygons:
        if p.normal.z < -0.5: p.select = True
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='FACE'); bpy.ops.object.mode_set(mode='OBJECT')
    o.modifiers.new('sub', 'SUBSURF').levels = 2
    d_ = o.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('kulT', 'CLOUDS'); t.noise_scale = 0.3; d_.texture = t; d_.strength = 0.05
    o.data.materials.append(m); o.visible_shadow = False
    return o

def banig_roll(x, y, rotz=0.0):
    m = mat_floral('banig', (0.35, 0.25, 0.12), (0.4, 0.08, 0.08), (0.1, 0.2, 0.25), scale=30)
    return cyl('banig', 0.08, 1.0, (x, y, 0.08), m, rot=(0, math.radians(90), rotz))

def galon(x, y):
    m = mat_basic('galonM', (0.05, 0.2, 0.45), 0.25, trans=0.4)
    g = cyl('galon', 0.14, 0.42, (x, y, 0.21), m, verts=24)
    cyl('galonNeck', 0.04, 0.06, (x, y, 0.45), m)
    return g

def batya(x, y, color=(0.12, 0.3, 0.12)):
    m = mat_basic('batyaM', color, 0.4)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.24, radius2=0.32, depth=0.2, location=(x, y, 0.1))
    o = bpy.context.active_object; o.modifiers.new('sol', 'SOLIDIFY').thickness = 0.008
    bpy.ops.mesh.select_all if False else None
    o.data.materials.append(m)
    tabo = mat_basic('taboM', (0.55, 0.08, 0.06), 0.4)
    cyl('tabo', 0.07, 0.12, (x + 0.05, y, 0.14), tabo)
    cyl('taboH', 0.015, 0.14, (x + 0.15, y, 0.16), tabo, rot=(0, math.radians(80), 0))
    return o

def clothesline(x0, x1, y, z, n=4, seed=3):
    rope = mat_basic('rope', (0.3, 0.28, 0.22), 0.9)
    L = abs(x1 - x0)
    cyl('line', 0.004, L, ((x0 + x1) / 2, y, z), rope, rot=(0, math.radians(90), 0), verts=6)
    random.seed(seed)
    cols = [(0.35, 0.05, 0.05), (0.1, 0.15, 0.3), (0.5, 0.48, 0.42), (0.15, 0.25, 0.12), (0.4, 0.3, 0.1)]
    for i in range(n):
        cx = x0 + (i + 0.5) * L / n + random.uniform(-0.05, 0.05)
        w = random.uniform(0.3, 0.45); h = random.uniform(0.45, 0.7)
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=12, y_subdivisions=12, size=1, location=(cx, y, z - h / 2), rotation=(math.radians(90), 0, 0))
        c = bpy.context.active_object; c.scale = (w, h, 1); bpy.ops.object.transform_apply(scale=True)
        d = c.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('clT%d' % i, 'CLOUDS'); t.noise_scale = 0.2; d.texture = t; d.strength = 0.06
        c.modifiers.new('s', 'SOLIDIFY').thickness = 0.005
        c.data.materials.append(mat_noise('cloth%d' % i, cols[i % 5], tuple(v * 1.3 for v in cols[i % 5]), scale=20))

def wire_run(points):
    m = mat_basic('wire', (0.02, 0.02, 0.02), 0.5)
    for i in range(len(points) - 1):
        a = Vector(points[i]); b = Vector(points[i + 1]); mid = (a + b) / 2; d = b - a
        o = cyl('wire%d' % i, 0.005, d.length, tuple(mid), m, verts=6)
        o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()

def santo_nino(x, y, z):
    robe = mat_basic('snRobe', (0.45, 0.03, 0.03), 0.4)
    gold = mat_basic('snGold', (0.6, 0.45, 0.15), 0.3, metal=1)
    skin = mat_basic('snSkin', (0.5, 0.36, 0.25), 0.4)
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.07, radius2=0.03, depth=0.22, location=(x, y, z + 0.11))
    bpy.context.active_object.data.materials.append(robe)
    sphere('snHead', 0.03, (x, y, z + 0.25), skin)
    cyl('snCrown', 0.025, 0.04, (x, y, z + 0.29), gold, verts=12)
    sphere('snGlobe', 0.018, (x + 0.05, y - 0.03, z + 0.15), gold)

def doily(x, y, z, r=0.25):
    m = mat_basic('doily', (0.75, 0.72, 0.65), 0.9)
    return cyl('doily', r, 0.004, (x, y, z), m, verts=40)

# ---------------------------------------------------------------- photo-reference pass
def mat_last_supper(name='lastSupper'):
    """A dim framed print read as 'Huling Hapunan': a long table, white cloth, a row of figures."""
    m, nt, b = _base(name, 0.35)
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    def band(lo, hi):
        g1 = nt.nodes.new('ShaderNodeMath'); g1.operation = 'GREATER_THAN'; g1.inputs[1].default_value = lo
        g2 = nt.nodes.new('ShaderNodeMath'); g2.operation = 'LESS_THAN'; g2.inputs[1].default_value = hi
        nt.links.new(sep.outputs['Y'], g1.inputs[0]); nt.links.new(sep.outputs['Y'], g2.inputs[0])
        mm = nt.nodes.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'; nt.links.new(g1.outputs[0], mm.inputs[0]); nt.links.new(g2.outputs[0], mm.inputs[1])
        return mm
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 6; nt.links.new(tc.outputs['Generated'], nz.inputs['Vector'])
    bg = nt.nodes.new('ShaderNodeValToRGB'); bg.color_ramp.elements[0].color = (0.05, 0.035, 0.02, 1); bg.color_ramp.elements[1].color = (0.22, 0.17, 0.1, 1)
    nt.links.new(nz.outputs['Fac'], bg.inputs['Fac'])
    cloth = band(0.22, 0.4)
    m1 = nt.nodes.new('ShaderNodeMix'); m1.data_type = 'RGBA'; m1.inputs['B'].default_value = (0.5, 0.47, 0.4, 1)
    nt.links.new(cloth.outputs[0], m1.inputs['Factor']); nt.links.new(bg.outputs['Color'], m1.inputs['A'])
    fig = band(0.4, 0.72)
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 13 * 6.283
    nt.links.new(sep.outputs['X'], mul.inputs[0])
    sn = nt.nodes.new('ShaderNodeMath'); sn.operation = 'SINE'; nt.links.new(mul.outputs[0], sn.inputs[0])
    gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = -0.1; nt.links.new(sn.outputs[0], gt.inputs[0])
    fm = nt.nodes.new('ShaderNodeMath'); fm.operation = 'MULTIPLY'; nt.links.new(gt.outputs[0], fm.inputs[0]); nt.links.new(fig.outputs[0], fm.inputs[1])
    fc = nt.nodes.new('ShaderNodeTexNoise'); fc.inputs['Scale'].default_value = 25; nt.links.new(tc.outputs['Generated'], fc.inputs['Vector'])
    fr = nt.nodes.new('ShaderNodeValToRGB'); fr.color_ramp.elements[0].color = (0.25, 0.06, 0.04, 1); fr.color_ramp.elements[1].color = (0.1, 0.16, 0.22, 1)
    nt.links.new(fc.outputs['Fac'], fr.inputs['Fac'])
    m2 = nt.nodes.new('ShaderNodeMix'); m2.data_type = 'RGBA'
    nt.links.new(fm.outputs[0], m2.inputs['Factor']); nt.links.new(m1.outputs['Result'], m2.inputs['A']); nt.links.new(fr.outputs['Color'], m2.inputs['B'])
    nt.links.new(m2.outputs['Result'], b.inputs['Base Color'])
    return m

def framed(name, loc, size, normal, pic_mat):
    gold = mat_noise(name + 'Frame', (0.18, 0.12, 0.05), (0.4, 0.3, 0.12), scale=40, rough=0.35)
    gold.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.6
    off = {'-y': (0, -1, 0), '+x': (1, 0, 0), '-x': (-1, 0, 0)}[normal]
    fr = decal(name + 'F', gold, loc, (size[0] + 0.12, size[1] + 0.12), normal); fr.visible_shadow = True
    fr.location = (loc[0] + off[0] * 0.012, loc[1] + off[1] * 0.012, loc[2])
    pic = decal(name + 'P', pic_mat, (loc[0] + off[0] * 0.02, loc[1] + off[1] * 0.02, loc[2]), size, normal)
    glass = mat_basic(name + 'G', (1, 1, 1), 0.05, alpha=0.08)
    decal(name + 'Gl', glass, (loc[0] + off[0] * 0.024, loc[1] + off[1] * 0.024, loc[2]), size, normal)
    return pic

def plastic_wardrobe(x, y, w=0.75, d=0.5, h=1.55, color=(0.12, 0.42, 0.48), rotz=0.0):
    m = mat_basic('plasticW', color, 0.35); white = mat_basic('plasticBand', (0.6, 0.57, 0.5), 0.35)
    dark = mat_basic('plasticSeam', (0.02, 0.02, 0.02), 0.5)
    bpy.ops.object.empty_add(location=(x, y, 0)); e = bpy.context.active_object
    parts = [box('pwBody', (w, d, h), (x, y, h / 2), m, bevel=0.025),
             box('pwBand', (w + 0.004, d + 0.004, 0.12), (x, y, h * 0.6), white, bevel=0.01),
             box('pwSeam', (0.006, d + 0.008, h - 0.1), (x, y, h / 2), dark),
             box('pwHandleL', (0.07, 0.03, 0.05), (x - 0.06, y - d / 2 - 0.01, h * 0.6), dark, bevel=0.01),
             box('pwHandleR', (0.07, 0.03, 0.05), (x + 0.06, y - d / 2 - 0.01, h * 0.6), dark, bevel=0.01)]
    for p in parts: p.parent = e; p.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, 0, rotz)
    return e

def gi_roof(W, D, H, rise=0.9):
    """Remove the ceiling: wooden trusses + corrugated GI sheets above the hollow-block walls."""
    if 'Ceil' in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects['Ceil'], do_unlink=True)
    wood = mat_planks('truss', (0.08, 0.05, 0.025), (0.1, 0.06, 0.03), scale=3, rough=0.7)
    yero = mat_noise('yeroIn', (0.1, 0.09, 0.08), (0.3, 0.26, 0.22), scale=3, rough=0.45, bump=0.2)
    yero.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.7
    rust = mat_stain('rustIn', (0.18, 0.07, 0.02), scale=4)
    for i in range(int(D / 1.0) + 1):
        y = 0.4 + i * 1.0
        box('tie%d' % i, (W + 0.2, 0.06, 0.12), (0, y, H + 0.05), wood)
        for s_ in (-1, 1):
            r = box('raft%d%d' % (i, s_), (W / 2 + 0.3, 0.06, 0.1), (s_ * W / 4, y, H + rise / 2 + 0.05), wood, rot=(0, s_ * -math.atan(rise / (W / 2)), 0))
        box('king%d' % i, (0.06, 0.06, rise), (0, y, H + rise / 2), wood)
    for s_ in (-1, 1):
        sh = box('yero%d' % s_, (W / 2 + 0.4, D + 1.0, 0.01), (s_ * W / 4, D / 2, H + rise / 2 + 0.17), yero, rot=(0, s_ * -math.atan(rise / (W / 2)), 0))
        d = sh.modifiers.new('corr', 'DISPLACE'); t = bpy.data.textures.new('corrIn%d' % s_, 'WOOD'); t.wood_type = 'BANDS'; t.noise_basis_2 = 'SIN'; t.noise_scale = 0.03
        d.texture = t; d.strength = 0.025; d.direction = 'Z'
        sb = sh.modifiers.new('sub', 'SUBSURF'); sb.levels = 3; sb.subdivision_type = 'SIMPLE'
        sh.modifiers.move(1, 0)

def window_curtains(x, y, z, width, normal='-x', color=(0.45, 0.12, 0.14)):
    m = mat_floral('winCurtain', color, (0.6, 0.45, 0.3), (0.3, 0.05, 0.08), scale=10)
    for s_ in (-1, 1):
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=40, y_subdivisions=4, size=1, location=(0, 0, 0))
        c = bpy.context.active_object; c.scale = (0.35, 1.3, 1); bpy.ops.object.transform_apply(scale=True)
        tx = bpy.data.textures.new('wc%d' % s_, 'WOOD'); tx.wood_type = 'BANDS'; tx.noise_basis_2 = 'SIN'; tx.noise_scale = 0.03
        dm = c.modifiers.new('d', 'DISPLACE'); dm.texture = tx; dm.strength = 0.05; dm.direction = 'Z'; dm.texture_coords = 'OBJECT'
        c.modifiers.new('s', 'SOLIDIFY').thickness = 0.006
        c.data.materials.append(m)
        if normal == '-x':
            c.rotation_euler = (math.radians(90), 0, math.radians(90)); c.location = (x - 0.08, y + s_ * (width / 2 + 0.05), z)
        else:
            c.rotation_euler = (math.radians(90), 0, 0); c.location = (x + s_ * (width / 2 + 0.05), y - 0.08, z)

def asin_jar(x, y, z):
    jar = mat_basic('jar', (0.8, 0.82, 0.85), 0.05, trans=0.9)
    salt = mat_noise('salt', (0.7, 0.7, 0.68), (0.85, 0.85, 0.82), scale=80)
    cyl('saltJar', 0.06, 0.16, (x, y, z + 0.08), jar)
    cyl('salt', 0.055, 0.1, (x, y, z + 0.05), salt)
    cyl('saltLid', 0.062, 0.02, (x, y, z + 0.17), mat_basic('lid', (0.5, 0.05, 0.05), 0.4))
