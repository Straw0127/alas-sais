"""Shared helpers for ALAS-SAIS pre-rendered scenes (Blender bpy)."""
import bpy, math
from mathutils import Vector

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 40
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 3
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 4
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    import os; sc.render.resolution_percentage = int(os.environ.get('RES_PCT', '100'))
    sc.render.image_settings.file_format = 'PNG'
    try:
        sc.view_settings.view_transform = 'AgX'
        sc.view_settings.look = 'AgX - Punchy'
    except Exception:
        try: sc.view_settings.view_transform = 'Filmic'
        except Exception: pass
    w = bpy.data.worlds.new('W'); sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.002, 0.003, 0.006, 1); bg.inputs[1].default_value = 1
    return sc

def _n(nt, t, loc=(0, 0)):
    n = nt.nodes.new(t); n.location = loc; return n

def mat_basic(name, color, rough=0.8, metal=0.0, emit=None, emit_str=0.0, alpha=1.0, trans=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if trans: b.inputs['Transmission Weight'].default_value = trans
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_str
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m

def mat_noise(name, c1, c2, scale=8.0, rough=0.85, bump=0.15, detail=8.0):
    """Aged surface: two-tone noise colour + bump."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    tc = _n(nt, 'ShaderNodeTexCoord'); nz = _n(nt, 'ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = detail
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = _n(nt, 'ShaderNodeValToRGB')
    cr.color_ramp.elements[0].color = (*c1, 1); cr.color_ramp.elements[1].color = (*c2, 1)
    cr.color_ramp.elements[0].position = 0.35; cr.color_ramp.elements[1].position = 0.7
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
    g = _n(nt, 'ShaderNodeTexNoise'); g.inputs['Scale'].default_value = 0.9; g.inputs['Detail'].default_value = 10
    nt.links.new(tc.outputs['Object'], g.inputs['Vector'])
    gr = _n(nt, 'ShaderNodeValToRGB'); gr.color_ramp.elements[0].color = (0.62, 0.56, 0.48, 1); gr.color_ramp.elements[0].position = 0.4
    gr.color_ramp.elements[1].position = 0.65
    nt.links.new(g.outputs['Fac'], gr.inputs['Fac'])
    mx = _n(nt, 'ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
    nt.links.new(cr.outputs['Color'], mx.inputs['A']); nt.links.new(gr.outputs['Color'], mx.inputs['B'])
    nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    bp = _n(nt, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def mat_planks(name, c1, c2, mortar=(0.03, 0.02, 0.012), scale=1.0, rough=0.55):
    """Wood planks using brick texture + wave grain."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    tc = _n(nt, 'ShaderNodeTexCoord')
    br = _n(nt, 'ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = scale
    br.inputs['Mortar Size'].default_value = 0.004
    br.inputs['Brick Width'].default_value = 1.6; br.inputs['Row Height'].default_value = 0.18
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1)
    br.inputs['Mortar'].default_value = (*mortar, 1)
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    wv = _n(nt, 'ShaderNodeTexWave'); wv.inputs['Scale'].default_value = 14.0
    wv.inputs['Distortion'].default_value = 14.0; wv.inputs['Detail'].default_value = 6
    nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
    mx = _n(nt, 'ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
    mx.inputs['Factor'].default_value = 0.3
    nt.links.new(br.outputs['Color'], mx.inputs['A']); nt.links.new(wv.outputs['Color'], mx.inputs['B'])
    nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    bp = _n(nt, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.25
    nt.links.new(br.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def mat_floral(name, base, spot1, spot2, scale=14.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = 0.95
    try: b.inputs['Sheen Weight'].default_value = 0.6
    except Exception: pass
    tc = _n(nt, 'ShaderNodeTexCoord')
    v = _n(nt, 'ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value = scale
    nt.links.new(tc.outputs['Object'], v.inputs['Vector'])
    cr = _n(nt, 'ShaderNodeValToRGB'); e = cr.color_ramp.elements
    e[0].color = (*spot2, 1); e[0].position = 0.08
    e[1].color = (*base, 1); e[1].position = 0.32
    e.new(0.16).color = (*spot1, 1)
    nt.links.new(v.outputs['Distance'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], b.inputs['Base Color'])
    nz = _n(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40
    bp = _n(nt, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.2
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def box(name, size, loc, mat=None, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        md = o.modifiers.new('bv', 'BEVEL'); md.width = bevel; md.segments = 2
    if mat: o.data.materials.append(mat)
    return o

def cyl(name, r, depth, loc, mat=None, rot=(0, 0, 0), verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object; o.name = name
    if mat: o.data.materials.append(mat)
    return o

def sphere(name, r, loc, mat=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.active_object; o.name = name; o.scale = scale
    bpy.ops.object.shade_smooth()
    if mat: o.data.materials.append(mat)
    return o

def plane(name, size, loc, rot=(0, 0, 0), mat=None):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = (size[0], size[1], 1)
    bpy.ops.object.transform_apply(scale=True)
    if mat: o.data.materials.append(mat)
    return o

def point(name, loc, power, kelvin=None, color=(1, 0.8, 0.5), radius=0.05):
    ld = bpy.data.lights.new(name, 'POINT'); ld.energy = power; ld.shadow_soft_size = radius
    ld.color = color
    o = bpy.data.objects.new(name, ld); o.location = loc
    bpy.context.collection.objects.link(o); return o

def area(name, loc, rot, power, size=(1, 1), color=(0.5, 0.6, 1.0)):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = power; ld.shape = 'RECTANGLE'
    ld.size = size[0]; ld.size_y = size[1]; ld.color = color
    o = bpy.data.objects.new(name, ld); o.location = loc; o.rotation_euler = rot
    bpy.context.collection.objects.link(o); return o

def spot(name, loc, rot, power, angle=0.6, color=(1, 0.95, 0.85), blend=0.4, radius=0.02):
    ld = bpy.data.lights.new(name, 'SPOT'); ld.energy = power; ld.spot_size = angle
    ld.spot_blend = blend; ld.color = color; ld.shadow_soft_size = radius
    o = bpy.data.objects.new(name, ld); o.location = loc; o.rotation_euler = rot
    bpy.context.collection.objects.link(o); return o

def camera(loc, look_at, lens=22):
    cd = bpy.data.cameras.new('Cam'); cd.lens = lens
    o = bpy.data.objects.new('Cam', cd); o.location = loc
    bpy.context.collection.objects.link(o)
    d = Vector(look_at) - Vector(loc)
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = o
    return o

def room(w, d, h, wall_mat, floor_mat, ceil_mat, t=0.1):
    """Box room centred on x, from y=0 (camera side) to y=d."""
    box('Floor', (w, d, t), (0, d / 2, -t / 2), floor_mat)
    box('Ceil', (w, d, t), (0, d / 2, h + t / 2), ceil_mat)
    box('WallBack', (w, t, h), (0, d + t / 2, h / 2), wall_mat)
    box('WallL', (t, d, h), (-w / 2 - t / 2, d / 2, h / 2), wall_mat)
    box('WallR', (t, d, h), (w / 2 + t / 2, d / 2, h / 2), wall_mat)
    box('WallFront', (w, t, h), (0, -1.2, h / 2), wall_mat)

def cut(target, cutter):
    md = target.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

def render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
