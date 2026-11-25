"""Organic entity builders for ALAS-SAIS (skin-modifier bodies, cloth, props)."""
import bpy, bmesh, math, random
from mathutils import Vector
from lib import *

def skin_body(name, verts, edges, radii, mat, sub=2, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata([Vector(v) for v in verts], edges, [])
    o = bpy.data.objects.new(name, me); o.location = loc
    bpy.context.collection.objects.link(o)
    sk = o.modifiers.new('skin', 'SKIN')
    for i, r in enumerate(radii):
        rr = r if isinstance(r, (tuple, list)) else (r, r)
        me.skin_vertices[0].data[i].radius = rr
    me.skin_vertices[0].data[0].use_root = True
    sb = o.modifiers.new('sub', 'SUBSURF'); sb.levels = sub; sb.render_levels = sub
    for p in me.polygons: p.use_smooth = True
    if mat: me.materials.append(mat)
    o.data.materials.append(mat) if mat and not me.materials else None
    return o

def apply_mods(o):
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)

def mat_skin(name, c1, c2, sss=0.15, rough=0.55):
    m = mat_noise(name, c1, c2, scale=25, rough=rough, bump=0.25)
    b = m.node_tree.nodes['Principled BSDF']
    try:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.6, 0.25, 0.15)
        b.inputs['Subsurface Scale'].default_value = 0.02
    except Exception: pass
    return m

def emission(name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*color, 1); e.inputs['Strength'].default_value = strength
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m

def drape_cloth(name, body_objs, size, loc, mat, frames=45, subdiv=46, thick=0.012):
    """Drop a square cloth onto collision objects and bake the result."""
    for b in body_objs:
        b.modifiers.new('col', 'COLLISION')
        b.collision.thickness_outer = 0.02
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=subdiv, y_subdivisions=subdiv, size=size, location=loc)
    c = bpy.context.active_object; c.name = name
    cl = c.modifiers.new('cloth', 'CLOTH')
    cl.settings.quality = 6; cl.settings.mass = 0.4
    cl.settings.tension_stiffness = 12; cl.settings.compression_stiffness = 12; cl.settings.bending_stiffness = 0.6
    cl.collision_settings.use_self_collision = False
    cl.collision_settings.distance_min = 0.008
    sc = bpy.context.scene; sc.frame_start = 1; sc.frame_end = frames
    cl.point_cache.frame_end = frames
    for f in range(1, frames + 1):
        sc.frame_set(f)
    bpy.context.view_layer.objects.active = c
    bpy.ops.object.modifier_apply(modifier=cl.name)
    so = c.modifiers.new('sol', 'SOLIDIFY'); so.thickness = thick
    sb = c.modifiers.new('sub', 'SUBSURF'); sb.levels = 1; sb.render_levels = 2
    bpy.ops.object.shade_smooth()
    c.data.materials.append(mat)
    for b in body_objs:
        for m in list(b.modifiers):
            if m.type == 'COLLISION': b.modifiers.remove(m)
    sc.frame_set(frames)
    return c

# ---------------------------------------------------------------- KUMOT
def build_kumot(x=0, y=0, cloth_frames=70, peer=False):
    """2.3 m figure under a stained flower-print blanket, grey fingers, one eye in a moth hole."""
    skin = mat_skin('kSkin', (0.28, 0.27, 0.25), (0.42, 0.4, 0.37), sss=0.1)
    # skeleton: hunched spine, long neck bent forward, backward knees
    v = [(0, 0, 1.15), (0, 0.02, 1.55), (0, 0.06, 1.9), (0, -0.05, 2.12), (0, -0.2, 2.22),  # 0-4 spine/neck/head
    ] if not peer else [(0, 0, 1.15), (0, 0.02, 1.5), (0, 0.04, 1.82), (0, -0.12, 1.98), (0, -0.3, 1.9)]
    v += [
         (-0.12, 0.0, 1.1), (-0.13, 0.12, 0.62), (-0.12, -0.02, 0.08),
         (0.12, 0.0, 1.1), (0.13, 0.12, 0.62), (0.12, -0.02, 0.08),                      # 8-10 right leg
         (-0.2, 0.05, 1.85), (-0.3, -0.05, 1.45), (-0.26, -0.28, 1.2),                    # 11-13 left arm
         (0.2, 0.05, 1.85), (0.3, -0.05, 1.45), (0.24, -0.3, 1.25)]                       # 14-16 right arm
    e = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (0, 8), (8, 9), (9, 10),
         (2, 11), (11, 12), (12, 13), (2, 14), (14, 15), (15, 16)]
    r = [0.17, 0.15, 0.13, 0.05, 0.12, 0.07, 0.05, 0.045, 0.07, 0.05, 0.045, 0.05, 0.035, 0.03, 0.05, 0.035, 0.03]
    body = skin_body('kumotBody', v, e, r, skin, loc=(x, y, 0))
    apply_mods(body)
    # blanket: draped from above
    blanket = mat_floral('kumotBlanket', (0.17, 0.05, 0.04), (0.33, 0.22, 0.09), (0.1, 0.11, 0.05), scale=7)
    nt = blanket.node_tree; b = nt.nodes['Principled BSDF']
    link = [l for l in nt.links if l.to_socket == b.inputs['Base Color']][0]; src = link.from_socket; nt.links.remove(link)
    tc = nt.nodes.new('ShaderNodeTexCoord'); st = nt.nodes.new('ShaderNodeTexNoise'); st.inputs['Scale'].default_value = 2.2; st.inputs['Detail'].default_value = 10
    nt.links.new(tc.outputs['Object'], st.inputs['Vector'])
    sr = nt.nodes.new('ShaderNodeValToRGB'); sr.color_ramp.elements[0].position = 0.45; sr.color_ramp.elements[0].color = (0.12, 0.08, 0.05, 1); sr.color_ramp.elements[1].position = 0.6
    nt.links.new(st.outputs['Fac'], sr.inputs['Fac'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
    nt.links.new(src, mx.inputs['A']); nt.links.new(sr.outputs['Color'], mx.inputs['B']); nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    cloth = drape_cloth('kumotCloth', [body], 3.4, (x, y - 0.1, 2.42), blanket, frames=cloth_frames, subdiv=56)
    hp = (x, y - 0.22, 2.2) if not peer else (x, y - 0.33, 1.88)
    wrap = sphere('kHeadWrap', 0.15, hp, blanket, scale=(1.0, 1.1, 1.25))
    if peer: wrap.rotation_euler = (math.radians(20), math.radians(70), 0)
    dmw = wrap.modifiers.new('d', 'DISPLACE'); tw = bpy.data.textures.new('wrapT', 'CLOUDS'); tw.noise_scale = 0.035; dmw.texture = tw; dmw.strength = 0.07
    wrap.modifiers.new('sub', 'SUBSURF').levels = 2
    # moth hole eye + lid
    eyeM = mat_basic('kEye', (0.75, 0.62, 0.5), 0.15, emit=(0.6, 0.45, 0.35), emit_str=0.6)
    ez = 2.15 if not peer else 1.86; ey = -0.405 if not peer else -0.5
    sphere('kEyeBall', 0.02, (x - 0.02, y + ey, ez), eyeM)
    pupil = mat_basic('kPupil', (0, 0, 0), 0.2)
    sphere('kPupil', 0.006, (x - 0.025, y + ey - 0.019, ez + 0.002), pupil)
    # long grey fingers emerging at the front hem
    for s in (-1, 1):
        for i in range(4):
            fv = [(0, 0, 0), (0.012 * i - 0.02, -0.07, -0.08), (0.018 * i - 0.03, -0.1, -0.26), (0.024 * i - 0.03, -0.08, -0.42), (0.026 * i - 0.03, -0.05, -0.47)]
            fo = skin_body('kFinger%d%d' % (s, i), fv, [(0, 1), (1, 2), (2, 3), (3, 4)], [0.012, 0.011, 0.008, 0.005, 0.002], skin, sub=1,
                           loc=(x + s * 0.26 + 0.025 * i * s, y - 0.32, 1.28))
    return body, cloth

# ---------------------------------------------------------------- MALIKMATA
def mat_static(name, flecks=0.66, color=(0.55, 0.95, 1.0), strength=1.6, scale=320):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = flecks; cr.color_ramp.elements[1].position = flecks + 0.06
    cr.color_ramp.elements[0].color = (0, 0, 0, 1); cr.color_ramp.elements[1].color = (*color, 1)
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = strength
    nt.links.new(cr.outputs['Color'], em.inputs['Color'])
    # thin glossy layer so the TV light rims the silhouette
    gl = nt.nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Color'].default_value = (0.05, 0.07, 0.08, 1); gl.inputs['Roughness'].default_value = 0.35
    ad = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(em.outputs[0], ad.inputs[0]); nt.links.new(gl.outputs[0], ad.inputs[1])
    nt.links.new(ad.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m

def build_malikmata(x=0, y=0, rotz=0.0):
    st = mat_static('malikStatic')
    v = [(0, 0, 1.05), (0, 0.01, 1.4), (0, 0.03, 1.72), (0.03, 0.0, 1.88), (0.07, -0.02, 2.02),     # 0-4
         (-0.1, 0, 1.0), (-0.11, 0.02, 0.55), (-0.1, 0.0, 0.05),                                    # 5-7
         (0.1, 0, 1.0), (0.12, -0.03, 0.55), (0.13, 0.0, 0.05),                                    # 8-10
         (-0.21, 0.03, 1.7), (-0.33, 0.0, 1.25), (-0.38, -0.08, 0.82), (-0.4, -0.12, 0.5),          # 11-14 long arm
         (0.21, 0.03, 1.7), (0.3, -0.06, 1.3), (0.35, -0.18, 0.92), (0.33, -0.24, 0.62)]            # 15-18
    e = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (0, 8), (8, 9), (9, 10),
         (2, 11), (11, 12), (12, 13), (13, 14), (2, 15), (15, 16), (16, 17), (17, 18)]
    r = [0.14, 0.15, 0.14, 0.05, (0.13, 0.15), 0.07, 0.05, 0.04, 0.07, 0.05, 0.04,
         0.045, 0.035, 0.028, 0.02, 0.045, 0.035, 0.028, 0.02]
    body = skin_body('malikBody', v, e, r, st, loc=(x, y, 0))
    body.rotation_euler = (0, 0, rotz)
    # smile: wide thin emissive arc, too wide for the face
    sm = emission('malikSmile', (0.7, 0.98, 1.0), 4.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.085, minor_radius=0.005, location=(x + 0.07, y - 0.125, 2.0), rotation=(math.radians(90), 0, 0))
    smile = bpy.context.active_object; smile.scale = (1.4, 1, 0.45); smile.data.materials.append(sm)
    cb = box('smCut', (0.5, 0.4, 0.25), (x + 0.07, y - 0.125, 2.1)); cut(smile, cb)
    # teeth ticks
    for i in range(9):
        t = box('tooth%d' % i, (0.005, 0.004, 0.018), (x + 0.07 - 0.1 + i * 0.025, y - 0.128, 1.99 - 0.03 * math.sin(i / 8 * math.pi)), sm)
    # loose VHS tape ribbons hanging from arms
    tape = mat_basic('tape', (0.03, 0.02, 0.015), 0.25)
    random.seed(11)
    for i in range(7):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x + random.uniform(-0.4, 0.4), y + random.uniform(-0.1, 0.1), random.uniform(0.6, 1.5)))
        p = bpy.context.active_object; p.scale = (0.012, 1, 1); p.scale.z = 1
        p.dimensions = (0.012, 0.001, random.uniform(0.4, 0.9)) if False else p.dimensions
        p.rotation_euler = (math.radians(90), random.uniform(-0.3, 0.3), random.uniform(-1, 1))
        p.scale = (0.012, random.uniform(0.35, 0.8), 1)
        tw = p.modifiers.new('tw', 'SIMPLE_DEFORM'); tw.deform_method = 'TWIST'; tw.angle = random.uniform(1, 3)
        p.data.materials.append(tape)
    eyeS = emission('malikEyes', (0.6, 0.95, 1.0), 3.0)
    for ex in (-0.035, 0.045):
        sphere('mEye%d' % int(ex * 1000), 0.009, (x + 0.07 + ex, y - 0.125, 2.06), eyeS)
    return body

# ---------------------------------------------------------------- KALANSING
def build_kalansing(x=0, y=0):
    skin = mat_skin('kalSkin', (0.07, 0.055, 0.045), (0.14, 0.1, 0.08), sss=0.05, rough=0.75)
    # crawling: torso low and long, limbs splayed like a spider, head pushed forward
    v = [(0, 0.25, 0.75), (0, 0.0, 0.85), (0, -0.25, 0.9), (0, -0.42, 0.98), (0, -0.55, 1.02),      # 0-4 spine->neck
         (-0.18, -0.2, 0.85), (-0.45, -0.38, 0.6), (-0.55, -0.62, 0.05),                             # 5-7 front L
         (0.18, -0.2, 0.85), (0.45, -0.38, 0.6), (0.55, -0.62, 0.05),                                # 8-10 front R
         (-0.16, 0.25, 0.72), (-0.42, 0.35, 0.75), (-0.5, 0.42, 0.05),                               # 11-13 back L
         (0.16, 0.25, 0.72), (0.42, 0.35, 0.75), (0.5, 0.42, 0.05)]                                  # 14-16 back R
    e = [(0, 1), (1, 2), (2, 3), (3, 4), (2, 5), (5, 6), (6, 7), (2, 8), (8, 9), (9, 10),
         (0, 11), (11, 12), (12, 13), (0, 14), (14, 15), (15, 16)]
    r = [0.24, 0.26, 0.23, 0.1, 0.08, 0.075, 0.055, 0.025, 0.075, 0.055, 0.025, 0.075, 0.06, 0.03, 0.075, 0.06, 0.03]
    body = skin_body('kalBody', v, e, r, skin, loc=(x, y, 0))
    # rice-sack head with stitched mouth
    sack = mat_noise('sack', (0.13, 0.1, 0.06), (0.24, 0.19, 0.12), scale=90, bump=0.8, rough=0.95)
    head = sphere('kalHead', 0.22, (x, y - 0.66, 1.0), sack, scale=(1.0, 1.05, 0.8)); head.rotation_euler = (math.radians(15), math.radians(12), 0)
    dm = head.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('sackT', 'CLOUDS'); t.noise_scale = 0.08; dm.texture = t; dm.strength = 0.03
    tie = mat_basic('twine', (0.35, 0.28, 0.15), 0.9)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.012, location=(x, y - 0.52, 1.03), rotation=(math.radians(80), 0, 0))
    bpy.context.active_object.data.materials.append(tie)
    thread = mat_basic('thread', (0.12, 0.05, 0.04), 0.8)
    wire = mat_basic('wire', (0.25, 0.25, 0.24), 0.4, metal=1)
    for i in range(7):
        box('stitch%d' % i, (0.008, 0.016, 0.08), (x - 0.09 + i * 0.03, y - 0.875, 0.99), thread, rot=(0, math.radians(8 * (i - 3)), 0))
    box('mouthSeam', (0.21, 0.012, 0.008), (x, y - 0.877, 0.99), thread)
    tooth = mat_basic('tooth', (0.62, 0.55, 0.4), 0.35)
    for i in range(9):
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.009, radius2=0.0, depth=0.04, location=(x - 0.09 + i * 0.022, y - 0.88, 0.99 + (0.012 if i % 2 else -0.012)), rotation=(math.radians(180 if i % 2 else 0), 0, 0))
        bpy.context.active_object.data.materials.append(tooth)
    blade = mat_basic('blade', (0.55, 0.55, 0.53), 0.18, metal=1)
    for k, (kx, kz) in enumerate(((-0.2, 0.7), (0.18, 0.66), (0.05, 0.62), (-0.08, 0.68))):
        cyl('knifeW%d' % k, 0.0025, 0.2, (x + kx, y - 0.3 - k * 0.08, kz + 0.25), wire, verts=6)
        box('knifeH%d' % k, (0.02, 0.012, 0.1), (x + kx, y - 0.3 - k * 0.08, kz + 0.1), mat_basic('kh%d' % k, (0.05, 0.03, 0.02), 0.6))
        box('knifeB%d' % k, (0.035, 0.003, 0.2), (x + kx, y - 0.3 - k * 0.08, kz - 0.05), blade)
    metal = mat_noise('tin', (0.35, 0.35, 0.33), (0.6, 0.6, 0.57), scale=30, rough=0.3, bump=0.1)
    metal.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 1.0
    rust = mat_noise('rust', (0.18, 0.07, 0.03), (0.35, 0.16, 0.06), scale=25, rough=0.8)
    wire = mat_basic('wire', (0.25, 0.25, 0.24), 0.4, metal=1)
    random.seed(5)
    for i in range(70):
        t = random.uniform(0, 1); side = random.choice((-1, 1))
        py = y + 0.25 - t * 0.7; pz = 0.98 + random.uniform(-0.05, 0.1)
        px = x + side * random.uniform(0.05, 0.32)
        L = random.uniform(0.1, 0.42)
        cyl('wire%d' % i, 0.0025, L, (px, py, pz - L / 2), wire, verts=6)
        z = pz - L; kind = i % 4
        m = metal if random.random() > 0.3 else rust
        if kind == 0:
            cyl('can%d' % i, 0.05, 0.1, (px, py, z - 0.035), m, verts=18)
        elif kind == 1:
            cyl('ladleH%d' % i, 0.006, 0.22, (px, py, z - 0.11), m, verts=8)
            sphere('ladleC%d' % i, 0.06, (px, py, z - 0.24), m, scale=(1, 1, 0.55))
        elif kind == 2:
            box('spoon%d' % i, (0.012, 0.004, 0.13), (px, py, z - 0.065), m, rot=(0, random.uniform(-0.3, 0.3), 0))
            sphere('spoonB%d' % i, 0.02, (px, py, z - 0.14), m, scale=(0.7, 0.3, 1.2))
        else:
            cyl('cup%d' % i, 0.055, 0.1, (px, py, z - 0.04), m, verts=18)
    # spoon-tipped fingers on front limbs
    for s in (-1, 1):
        for k in range(3):
            box('fspoon%d%d' % (s, k), (0.012, 0.004, 0.1), (x + s * (0.55 + 0.03 * (k - 1)), y - 0.7, 0.04), metal, rot=(math.radians(70), 0, 0))
    return body

# ---------------------------------------------------------------- SILIP
def build_silip(x=0, y=0):
    skin = mat_skin('silSkin', (0.5, 0.48, 0.44), (0.62, 0.6, 0.55), sss=0.25, rough=0.5)
    v = [(0, 0, 0.95), (0, 0.0, 1.25), (0, 0.02, 1.5), (0, 0.0, 1.62), (0, -0.03, 1.74),
         (-0.08, 0, 0.92), (-0.09, 0.02, 0.48), (-0.09, 0, 0.04),
         (0.08, 0, 0.92), (0.09, 0.02, 0.48), (0.09, 0, 0.04),
         (-0.16, 0.02, 1.47), (-0.22, 0.0, 1.05), (-0.25, -0.03, 0.62), (-0.26, -0.05, 0.3),
         (0.16, 0.02, 1.47), (0.22, 0.0, 1.05), (0.25, -0.03, 0.62), (0.26, -0.05, 0.3)]
    e = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (0, 8), (8, 9), (9, 10),
         (2, 11), (11, 12), (12, 13), (13, 14), (2, 15), (15, 16), (16, 17), (17, 18)]
    r = [0.12, 0.11, 0.11, 0.04, 0.1, 0.055, 0.04, 0.03, 0.055, 0.04, 0.03, 0.035, 0.025, 0.02, 0.016, 0.035, 0.025, 0.02, 0.016]
    body = skin_body('silipBody', v, e, r, skin, loc=(x, y, 0))
    # raincoat: flared cone with folds, hood
    coat = mat_noise('raincoat', (0.6, 0.42, 0.06), (0.78, 0.6, 0.12), scale=6, rough=0.28, bump=0.15)
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.36, radius2=0.14, depth=0.95, location=(x, y, 1.02))
    c = bpy.context.active_object; c.name = 'coat'
    c.modifiers.new('sol', 'SOLIDIFY').thickness = 0.01
    dm = c.modifiers.new('d', 'DISPLACE'); t = bpy.data.textures.new('coatT', 'WOOD'); t.wood_type = 'BANDS'; t.noise_scale = 0.06
    dm.texture = t; dm.strength = 0.025; dm.texture_coords = 'OBJECT'
    c.modifiers.new('sub', 'SUBSURF').levels = 2
    bpy.ops.object.shade_smooth(); c.data.materials.append(coat)
    hood = sphere('hood', 0.15, (x, y + 0.02, 1.76), coat, scale=(1.0, 1.05, 1.2))
    hc = box('hc', (0.3, 0.2, 0.36), (x, y - 0.14, 1.74)); cut(hood, hc)
    for s in (-1, 1):
        sl = cyl('sleeve%d' % s, 0.05, 0.5, (x + s * 0.2, y + 0.01, 1.25), coat, rot=(0, math.radians(s * 8), 0), verts=20)
    # capiz-shell face: translucent pearly pane with cracks, one eye behind
    m = bpy.data.materials.new('capizFace'); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.85, 0.82, 0.74, 1); b.inputs['Roughness'].default_value = 0.25
    b.inputs['Transmission Weight'].default_value = 0.45
    b.inputs['Emission Color'].default_value = (0.9, 0.88, 0.8, 1); b.inputs['Emission Strength'].default_value = 0.15
    vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'; vo.inputs['Scale'].default_value = 9
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = 0.0; cr.color_ramp.elements[1].position = 0.03
    cr.color_ramp.elements[0].color = (0.05, 0.04, 0.03, 1)
    nt.links.new(vo.outputs['Distance'], cr.inputs['Fac'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
    mx.inputs['A'].default_value = (0.85, 0.82, 0.74, 1)
    nt.links.new(cr.outputs['Color'], mx.inputs['B']); nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    face = box('capizFace', (0.17, 0.012, 0.21), (x, y - 0.1, 1.74), m, bevel=0.03)
    face.modifiers.new('sub', 'SUBSURF').levels = 2
    eye = mat_basic('silEye', (0.02, 0.02, 0.02), 0.1)
    white = mat_basic('silEyeW', (0.8, 0.78, 0.7), 0.3)
    sphere('silEyeW', 0.024, (x - 0.035, y - 0.085, 1.76), white)
    sphere('silEyeP', 0.011, (x - 0.035, y - 0.107, 1.76), eye)
    # long wet hair strands under the hood edge
    hair = mat_basic('hair', (0.01, 0.01, 0.01), 0.3)
    import random as _r; _r.seed(9)
    for i in range(26):
        L = _r.uniform(0.35, 0.75); hx = x - 0.11 + i * 0.0088 + _r.uniform(-0.004, 0.004)
        front = i % 3 == 0
        cyl('hair%d' % i, 0.0035, L, (hx, y - (0.12 if front else 0.07), 1.82 - L / 2), hair, verts=5)
    for s_ in (-1, 1):
        for f in range(4):
            cyl('sFinger%d%d' % (s_, f), 0.006, 0.16, (x + s_ * (0.26 + 0.012 * f), y - 0.05 + 0.01 * f, 0.22), skin, verts=6)
    return body

# ================================================================ FOLKLORE PASS
def build_kumot_batibat(x=0, y=0, peer=False):
    """Kumot as a Batibat: old woman under a white lamay shroud, long white hair, rosary in grey fingers."""
    body, cloth = build_kumot(x, y, peer=peer)
    shroud = mat_noise('shroud', (0.42, 0.4, 0.34), (0.6, 0.57, 0.5), scale=5, bump=0.25)
    nt = shroud.node_tree; b = nt.nodes['Principled BSDF']
    try: b.inputs['Sheen Weight'].default_value = 0.4
    except Exception: pass
    # damp yellow-brown stains on the shroud
    st = mat_stain('shroudStain', (0.2, 0.14, 0.07), scale=3)
    cloth.data.materials.clear(); cloth.data.materials.append(shroud)
    w = bpy.data.objects.get('kHeadWrap')
    if w: w.data.materials.clear(); w.data.materials.append(shroud)
    # long white hair spilling from under the shroud at the face
    hair = mat_basic('whiteHair', (0.55, 0.53, 0.5), 0.45)
    hx, hy, hz = (x, y - 0.33, 2.02) if not peer else (x, y - 0.42, 1.74)
    import random as _r; _r.seed(13)
    for i in range(34):
        L = _r.uniform(0.45, 1.0); ox = _r.uniform(-0.12, 0.12)
        h = cyl('wHair%d' % i, 0.0028, L, (hx + ox, hy + _r.uniform(-0.03, 0.03), hz - L / 2 + 0.1), hair, verts=5)
        h.rotation_euler = (_r.uniform(-0.15, 0.15), _r.uniform(-0.1, 0.1), 0)
    # black mourning ribbon (luksa) pinned on the shroud
    blk = mat_basic('luksa', (0.01, 0.01, 0.01), 0.5)
    box('luksa', (0.05, 0.01, 0.09), (x + 0.12, y - 0.28, 1.6 if not peer else 1.5), blk, rot=(0, 0, 0.3))
    # rosary hanging from the right fingers
    bead = mat_basic('rosBead', (0.06, 0.04, 0.03), 0.3)
    for i in range(18):
        a_ = i / 18 * math.pi
        sphere('rb%d' % i, 0.009, (x + 0.29 + 0.05 * math.sin(a_), y - 0.4, 0.88 - 0.2 * math.sin(a_ / 2) - 0.012 * i), bead)
    box('rosCrossV', (0.008, 0.006, 0.05), (x + 0.3, y - 0.4, 0.62), mat_basic('rosC', (0.5, 0.42, 0.25), 0.3, metal=1))
    box('rosCrossH', (0.03, 0.006, 0.008), (x + 0.3, y - 0.4, 0.635), mat_basic('rosC2', (0.5, 0.42, 0.25), 0.3, metal=1))
    return body, cloth

def build_tiyanak(x=0, y=0, z=0.0, crawl=True):
    """Malikmata as a Tiyanak: baby-sized, grey wrinkled old man's face, needle teeth, static flecks."""
    skin = mat_skin('tySkin', (0.26, 0.21, 0.17), (0.4, 0.32, 0.26), sss=0.25, rough=0.55)
    # add static flecks
    nt = skin.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 260
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = 0.68; cr.color_ramp.elements[1].position = 0.72
    cr.color_ramp.elements[0].color = (0, 0, 0, 1); cr.color_ramp.elements[1].color = (0.5, 0.9, 1.0, 1)
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = 0.5
    if crawl:   # on all fours, head up
        v = [(0, 0.15, 0.3), (0, -0.05, 0.33), (0, -0.2, 0.38), (0, -0.28, 0.5),
             (-0.09, -0.15, 0.32), (-0.14, -0.28, 0.16), (-0.13, -0.36, 0.02),
             (0.09, -0.15, 0.32), (0.14, -0.28, 0.16), (0.13, -0.36, 0.02),
             (-0.08, 0.15, 0.28), (-0.15, 0.05, 0.12), (-0.14, -0.02, 0.02),
             (0.08, 0.15, 0.28), (0.15, 0.05, 0.12), (0.14, -0.02, 0.02)]
        e = [(0, 1), (1, 2), (2, 3), (1, 4), (4, 5), (5, 6), (1, 7), (7, 8), (8, 9), (0, 10), (10, 11), (11, 12), (0, 13), (13, 14), (14, 15)]
        r = [0.11, 0.12, 0.08, 0.05, 0.045, 0.035, 0.02, 0.045, 0.035, 0.02, 0.05, 0.04, 0.025, 0.05, 0.04, 0.025]
        head = (0, -0.34, 0.6)
    else:
        v = [(0, 0, 0.3), (0, 0, 0.5), (0, 0, 0.62), (-0.07, 0, 0.28), (-0.08, 0, 0.02), (0.07, 0, 0.28), (0.08, 0, 0.02),
             (-0.12, 0, 0.58), (-0.2, -0.05, 0.38), (0.12, 0, 0.58), (0.2, -0.05, 0.38)]
        e = [(0, 1), (1, 2), (0, 3), (3, 4), (0, 5), (5, 6), (1, 7), (7, 8), (1, 9), (9, 10)]
        r = [0.12, 0.13, 0.05, 0.05, 0.03, 0.05, 0.03, 0.04, 0.025, 0.04, 0.025]
        head = (0, -0.02, 0.76)
    body = skin_body('tyBody', v, e, r, skin, loc=(x, y, z))
    hx, hy, hz = x + head[0], y + head[1], z + head[2]
    hd = sphere('tyHead', 0.12, (hx, hy, hz), skin, scale=(1.0, 0.95, 1.08))
    d = hd.modifiers.new('wr', 'DISPLACE'); t = bpy.data.textures.new('wrinkles', 'STUCCI'); t.noise_scale = 0.025; d.texture = t; d.strength = 0.022
    hd.modifiers.new('sub', 'SUBSURF').levels = 2
    eyeW = mat_basic('tyEyeW', (0.6, 0.55, 0.4), 0.15); pupil = emission('tyPupil', (0.6, 0.95, 1.0), 4)
    for s_ in (-1, 1):
        sphere('tyEye%d' % s_, 0.02, (hx + s_ * 0.045, hy - 0.1, hz + 0.02), eyeW)
        sphere('tyPup%d' % s_, 0.008, (hx + s_ * 0.045, hy - 0.118, hz + 0.02), pupil)
    # mouth: dark slit with needle teeth
    box('tyMouth', (0.13, 0.012, 0.035), (hx, hy - 0.112, hz - 0.055), mat_basic('tyMouthM', (0.02, 0.0, 0.0), 0.4))
    tooth = mat_basic('tyTooth', (0.8, 0.75, 0.6), 0.3)
    for i in range(10):
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.004, depth=0.028, location=(hx - 0.045 + i * 0.01, hy - 0.118, hz - 0.055 + (0.008 if i % 2 else -0.008)), rotation=(math.radians(180 if i % 2 else 0), 0, 0))
        bpy.context.active_object.data.materials.append(tooth)
    return body

def build_manananggal(x=0, y=0, z=1.35, wing=1.0):
    """Silip as a Manananggal: severed upper torso hovering, bat wings, entrails, long hair, cracked capiz-mask face."""
    skin = mat_skin('mnSkin', (0.24, 0.2, 0.17), (0.34, 0.28, 0.24), sss=0.3, rough=0.45)
    v = [(0, 0, 0), (0, 0.01, 0.28), (0, 0.0, 0.42), (0, -0.02, 0.52),
         (-0.17, 0.01, 0.38), (-0.32, -0.08, 0.12), (-0.38, -0.2, -0.18), (-0.36, -0.3, -0.36),
         (0.17, 0.01, 0.38), (0.32, -0.08, 0.12), (0.38, -0.2, -0.18), (0.36, -0.3, -0.36)]
    e = [(0, 1), (1, 2), (2, 3), (1, 4), (4, 5), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10), (10, 11)]
    r = [0.12, 0.13, 0.05, 0.04, 0.045, 0.03, 0.022, 0.012, 0.045, 0.03, 0.022, 0.012]
    body = skin_body('mnBody', v, e, r, skin, loc=(x, y, z))
    # head with long wet hair and a cracked capiz mask (kept from the Silip design)
    hz = z + 0.66
    sphere('mnHead', 0.11, (x, y, hz), skin, scale=(0.9, 1.0, 1.15))
    m = bpy.data.materials.new('mnCapiz'); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.8, 0.77, 0.68, 1); b.inputs['Roughness'].default_value = 0.25
    b.inputs['Emission Color'].default_value = (0.8, 0.78, 0.7, 1); b.inputs['Emission Strength'].default_value = 0.12
    vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'; vo.inputs['Scale'].default_value = 8
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[1].position = 0.03; cr.color_ramp.elements[0].color = (0.03, 0.02, 0.02, 1)
    nt.links.new(vo.outputs['Distance'], cr.inputs['Fac'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1; mx.inputs['A'].default_value = (0.8, 0.77, 0.68, 1)
    nt.links.new(cr.outputs['Color'], mx.inputs['B']); nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    f = sphere('mnMask', 0.1, (x, y - 0.085, hz), m, scale=(0.78, 0.22, 1.0))
    sphere('mnEyeW', 0.02, (x - 0.03, y - 0.085, hz + 0.02), mat_basic('mnEW', (0.75, 0.2, 0.15), 0.3))
    sphere('mnEyeP', 0.009, (x - 0.03, y - 0.105, hz + 0.02), mat_basic('mnEP', (0, 0, 0), 0.2))
    hair = mat_basic('mnHair', (0.008, 0.008, 0.008), 0.25)
    import random as _r; _r.seed(17)
    for i in range(40):
        L = _r.uniform(0.5, 1.05); a_ = _r.uniform(-1.3, 1.3)
        hx = x + 0.1 * math.sin(a_); hy = y + 0.06 * math.cos(a_) - (0.05 if abs(a_) < 0.5 and i % 4 == 0 else 0)
        cyl('mnHairS%d' % i, 0.003, L, (hx, hy, hz + 0.08 - L / 2), hair, verts=5)
    # entrails hanging from the severed waist
    gut = mat_skin('mnGut', (0.25, 0.04, 0.035), (0.4, 0.08, 0.06), sss=0.4, rough=0.25)
    for i in range(7):
        px = x + _r.uniform(-0.08, 0.08); py = y + _r.uniform(-0.05, 0.05)
        L = _r.uniform(0.35, 0.9)
        pts = [(0, 0, 0)] + [(_r.uniform(-0.04, 0.04) * k, _r.uniform(-0.04, 0.04) * k, -L * k / 4) for k in range(1, 5)]
        skin_body('gut%d' % i, pts, [(k, k + 1) for k in range(4)], [0.03, 0.025, 0.022, 0.018, 0.012], gut, sub=2, loc=(px, py, z - 0.02))
    # bat wings: membrane planes stretched between finger bones
    bone = mat_basic('wingBone', (0.08, 0.06, 0.05), 0.5)
    mem = mat_skin('wingMem', (0.06, 0.04, 0.035), (0.12, 0.08, 0.06), sss=0.5, rough=0.5)
    mem.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.15
    for s_ in (-1, 1):
        root = Vector((x + s_ * 0.14, y + 0.06, z + 0.4))
        tips = [Vector((x + s_ * 1.0 * wing, y + 0.25, z + 0.95)), Vector((x + s_ * 1.25 * wing, y + 0.3, z + 0.45)), Vector((x + s_ * 1.05 * wing, y + 0.28, z - 0.05)), Vector((x + s_ * 0.55 * wing, y + 0.15, z - 0.25))]
        for k, tp in enumerate(tips):
            d = tp - root; o = cyl('wb%d%d' % (s_, k), 0.012 - k * 0.002, d.length, tuple((root + tp) / 2), bone, verts=8)
            o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        me = bpy.data.meshes.new('wing%d' % s_)
        verts = [root] + tips + [Vector((x + s_ * 0.2, y + 0.05, z - 0.05))]
        faces = [(0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 5)]
        me.from_pydata([tuple(p) for p in verts], [], faces)
        wo = bpy.data.objects.new('wing%d' % s_, me); bpy.context.collection.objects.link(wo)
        wo.modifiers.new('sol', 'SOLIDIFY').thickness = 0.004
        sb = wo.modifiers.new('sub', 'SUBSURF'); sb.levels = 2
        dm = wo.modifiers.new('d', 'DISPLACE'); tx = bpy.data.textures.new('wingT%d' % s_, 'CLOUDS'); tx.noise_scale = 0.15; dm.texture = tx; dm.strength = 0.05
        me.materials.append(mem)
    return body

def add_aswang_tongue(x, y):
    """Long thin tongue through Kalansing's stitched mouth (aswang)."""
    tg = mat_skin('aswTongue', (0.22, 0.05, 0.05), (0.35, 0.1, 0.08), sss=0.3, rough=0.2)
    pts = [(0, 0, 0), (0.01, -0.12, -0.08), (0.03, -0.22, -0.3), (0.0, -0.28, -0.6), (-0.02, -0.3, -0.85)]
    return skin_body('aswTongue', pts, [(k, k + 1) for k in range(4)], [0.012, 0.011, 0.009, 0.007, 0.003], tg, sub=2, loc=(x, y - 0.88, 0.99))
