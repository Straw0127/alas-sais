"""Chapter 1 entities: TIKTIK (window/curtain) and BARANG (wardrobe). Built facing -y at the origin, then grouped."""
import bpy, math, random
from mathutils import Vector
from lib import *
from entities import skin_body, mat_skin, emission


def group_at(before, loc=(0, 0, 0), rotz=0.0):
    """Parent everything built (at the origin) since `before` to an empty, rotate it about the origin, then move it to loc."""
    bpy.ops.object.empty_add(location=(0, 0, 0)); e = bpy.context.active_object
    for o in bpy.data.objects:
        if o.name not in before and o is not e and o.parent is None and o.type not in ('CAMERA', 'LIGHT'):
            mw = o.matrix_world.copy(); o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted(); o.matrix_world = mw
    e.rotation_euler = (0, 0, rotz); e.location = loc
    return e


def _bone(name, a, b, r, mat):
    a, b = Vector(a), Vector(b); d = b - a
    o = cyl(name, r, d.length, tuple((a + b) / 2), mat, verts=8)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    return o


def _claws(prefix, wrist, dirv, mat, n=4, L=0.17, spread=0.035, curl=-0.05):
    """Long thin fingers ending in hooked nails."""
    nail = mat_basic(prefix + 'Nail', (0.05, 0.04, 0.03), 0.25)
    w = Vector(wrist); d = Vector(dirv).normalized()
    side = d.cross(Vector((0, 0, 1)))
    if side.length < 1e-3: side = Vector((1, 0, 0))
    side.normalize()
    for i in range(n):
        off = side * ((i - (n - 1) / 2) * spread)
        p0 = w + off; p1 = p0 + d * L * 0.55 + Vector((0, 0, curl * 0.3)); p2 = p1 + d * L * 0.45 + Vector((0, 0, curl))
        skin_body('%sF%d' % (prefix, i), [tuple(p0), tuple(p1), tuple(p2)], [(0, 1), (1, 2)], [0.011, 0.009, 0.006], mat, sub=1)
        tip = p2 + (p2 - p1).normalized() * 0.04 + Vector((0, 0, -0.02))
        _bone('%sN%d' % (prefix, i), tuple(p2), tuple(tip), 0.004, nail)


def build_tiktik(loc=(0, 0, 0), rotz=0.0, pose='perch', glow=1.0):
    """Gaunt crouching bird-thing: long hairless skull, hooked beak-jaw, pin eyes, proboscis tongue,
    folded leather wings, clawed hands gripping whatever is in front of it (fence, window grill)."""
    before = set(o.name for o in bpy.data.objects)
    skin = mat_skin('tkSkin', (0.075, 0.064, 0.058), (0.15, 0.125, 0.11), sss=0.2, rough=0.5)
    # body: crouched, leaning forward
    v = [(0, 0, 0), (0, -0.06, 0.24), (0, -0.14, 0.44), (0, -0.22, 0.58), (0, -0.28, 0.66),       # 0-4 spine/neck
         (-0.1, 0.0, -0.02), (-0.2, -0.24, 0.12), (-0.17, 0.04, -0.28), (-0.17, -0.12, -0.34),       # 5-8 left leg
         (0.1, 0.0, -0.02), (0.2, -0.24, 0.12), (0.17, 0.04, -0.28), (0.17, -0.12, -0.34),            # 9-12 right leg
         (-0.13, -0.15, 0.48), (-0.3, -0.12, 0.22), (-0.24, -0.38, 0.14),                            # 13-15 left arm
         (0.13, -0.15, 0.48), (0.3, -0.12, 0.22), (0.24, -0.38, 0.14)]                                # 16-18 right arm
    if pose == 'grill':   # hands up on the bars, face pushed forward
        v[15] = (-0.2, -0.46, 0.55); v[14] = (-0.3, -0.25, 0.42); v[18] = (0.2, -0.46, 0.6); v[17] = (0.3, -0.25, 0.45)
        v[3] = (0, -0.3, 0.6); v[4] = (0, -0.38, 0.66)
    if pose == 'scare':   # lunging, arms wide
        v[15] = (-0.45, -0.55, 0.5); v[14] = (-0.35, -0.3, 0.45); v[18] = (0.45, -0.55, 0.5); v[17] = (0.35, -0.3, 0.45)
        v[3] = (0, -0.32, 0.6); v[4] = (0, -0.42, 0.64)
    e = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (7, 8), (0, 9), (9, 10), (10, 11), (11, 12),
         (2, 13), (13, 14), (14, 15), (2, 16), (16, 17), (17, 18)]
    r = [0.1, 0.095, 0.11, 0.035, 0.04, 0.05, 0.03, 0.022, 0.015, 0.05, 0.03, 0.022, 0.015, 0.035, 0.022, 0.016, 0.035, 0.022, 0.016]
    skin_body('tkBody', v, e, r, skin)
    # ribs showing through the chest
    for i in range(5):
        z = 0.3 + i * 0.045
        for s in (-1, 1):
            _bone('tkRib%d%d' % (i, s), (0, -0.2 + i * 0.01, z), (s * 0.1, -0.17, z - 0.04), 0.006, skin)
    hx, hy, hz = v[4]
    # long skull, pointed back, sunken cheeks
    sk = sphere('tkSkull', 0.1, (hx, hy + 0.06, hz + 0.05), skin, scale=(0.75, 1.6, 0.85))
    sk.rotation_euler = (math.radians(-12), 0, 0)
    # hooked beak-jaw (upper and lower), open
    beak = mat_skin('tkBeak', (0.035, 0.028, 0.025), (0.08, 0.06, 0.05), sss=0.05, rough=0.3)
    skin_body('tkUpper', [(hx, hy - 0.05, hz + 0.07), (hx, hy - 0.2, hz + 0.05), (hx, hy - 0.32, hz - 0.02), (hx, hy - 0.35, hz - 0.08)],
              [(0, 1), (1, 2), (2, 3)], [0.05, 0.03, 0.015, 0.004], beak, sub=2)
    skin_body('tkLower', [(hx, hy - 0.05, hz - 0.0), (hx, hy - 0.17, hz - 0.08), (hx, hy - 0.26, hz - 0.14)],
              [(0, 1), (1, 2)], [0.04, 0.022, 0.006], beak, sub=2)
    mouth = mat_basic('tkMouth', (0.08, 0.01, 0.01), 0.2)
    sphere('tkGullet', 0.03, (hx, hy - 0.1, hz + 0.02), mouth, scale=(0.8, 1.6, 0.6))
    # needle teeth
    tooth = mat_basic('tkTooth', (0.55, 0.5, 0.4), 0.3)
    for i in range(7):
        t = i / 6
        _bone('tkT%d' % i, (hx + (t - 0.5) * 0.04, hy - 0.08 - t * 0.12, hz + 0.045 - t * 0.04), (hx + (t - 0.5) * 0.04, hy - 0.085 - t * 0.12, hz + 0.0 - t * 0.04), 0.0025, tooth)
    # pin-point eyes, deep in the sockets
    sock = mat_basic('tkSocket', (0.0, 0.0, 0.0), 0.6)
    eye = emission('tkEye', (1.0, 0.78, 0.35), 6.0 * glow)
    for s in (-1, 1):
        sphere('tkSock%d' % s, 0.026, (hx + s * 0.045, hy - 0.04, hz + 0.1), sock, scale=(1, 0.6, 0.8))
        sphere('tkEye%d' % s, 0.0075, (hx + s * 0.045, hy - 0.058, hz + 0.1), eye)
    # proboscis tongue: thin, glistening, curling out of the beak
    tongue = mat_skin('tkTongue', (0.25, 0.06, 0.07), (0.4, 0.12, 0.1), sss=0.4, rough=0.15)
    if pose == 'grill':
        tp = [(hx, hy - 0.2, hz - 0.04), (hx + 0.02, hy - 0.42, hz - 0.08), (hx - 0.03, hy - 0.62, hz - 0.02), (hx + 0.02, hy - 0.8, hz - 0.12), (hx + 0.06, hy - 0.92, hz - 0.3)]
    elif pose == 'scare':
        tp = [(hx, hy - 0.2, hz - 0.04), (hx + 0.03, hy - 0.4, hz + 0.0), (hx - 0.02, hy - 0.55, hz - 0.05), (hx, hy - 0.62, hz - 0.12)]
    else:
        tp = [(hx, hy - 0.2, hz - 0.04), (hx + 0.02, hy - 0.3, hz - 0.15), (hx - 0.02, hy - 0.33, hz - 0.3), (hx + 0.01, hy - 0.3, hz - 0.42)]
    skin_body('tkTongue', tp, [(k, k + 1) for k in range(len(tp) - 1)], [0.012] + [0.009] * (len(tp) - 3) + [0.006, 0.002], tongue, sub=2)
    # claws on both hands and feet
    _claws('tkHL', v[15], (Vector(v[15]) - Vector(v[14])), skin, n=4, L=0.17, curl=-0.06)
    _claws('tkHR', v[18], (Vector(v[18]) - Vector(v[17])), skin, n=4, L=0.17, curl=-0.06)
    _claws('tkFL', v[8], (0, -1, -0.2), skin, n=3, L=0.12, curl=-0.05)
    _claws('tkFR', v[12], (0, -1, -0.2), skin, n=3, L=0.12, curl=-0.05)
    # folded leather wings rising behind the shoulders
    mem = mat_skin('tkWing', (0.04, 0.032, 0.03), (0.09, 0.07, 0.06), sss=0.5, rough=0.5)
    mem.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.1
    bonem = mat_basic('tkWB', (0.06, 0.05, 0.045), 0.5)
    for s in (-1, 1):
        root = Vector((s * 0.1, 0.04, 0.46)); tip = Vector((s * 0.3, 0.22, 0.98)); el = Vector((s * 0.36, 0.1, 0.62)); low = Vector((s * 0.16, 0.12, 0.02))
        _bone('tkWb%d' % s, tuple(root), tuple(el), 0.012, bonem); _bone('tkWc%d' % s, tuple(el), tuple(tip), 0.009, bonem)
        me = bpy.data.meshes.new('tkWingM%d' % s)
        me.from_pydata([tuple(root), tuple(el), tuple(tip), tuple(low)], [], [(0, 1, 2), (0, 2, 3)])
        wo = bpy.data.objects.new('tkWing%d' % s, me); bpy.context.collection.objects.link(wo)
        wo.modifiers.new('sol', 'SOLIDIFY').thickness = 0.004
        sb = wo.modifiers.new('sub', 'SUBSURF'); sb.levels = 2
        dm = wo.modifiers.new('d', 'DISPLACE'); tx = bpy.data.textures.new('tkWT%d' % s, 'CLOUDS'); tx.noise_scale = 0.12; dm.texture = tx; dm.strength = 0.04
        me.materials.append(mem)
    return group_at(before, loc, rotz)


def _beetle(name, loc, rot, mat, s=1.0):
    b = sphere(name, 0.0075 * s, loc, mat, scale=(0.7, 1.2, 0.45)); b.rotation_euler = rot
    return b


def beetle_mat():
    m = bpy.data.materials.new('brBeetle'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.012, 0.008, 0.005, 1); b.inputs['Roughness'].default_value = 0.3; b.inputs['Metallic'].default_value = 0.3
    try: b.inputs['Coat Weight'].default_value = 0.6
    except Exception: pass
    return m


def scatter_beetles(prefix, center, size, n, normal_axis='x', seed=1, s=1.0, mat=None):
    """Scatter beetles on a flat patch. center=(x,y,z), size=(a,b) across the two axes perpendicular to normal_axis."""
    mat = mat or beetle_mat(); rnd = random.Random(seed)
    cx, cy, cz = center
    for i in range(n):
        a = rnd.gauss(0, size[0] / 2.5); b = rnd.gauss(0, size[1] / 2.5)
        if normal_axis == 'x': loc = (cx, cy + a, cz + b); rot = (rnd.uniform(0, 6.3), math.radians(90), 0)
        elif normal_axis == 'y': loc = (cx + a, cy, cz + b); rot = (math.radians(90), rnd.uniform(0, 6.3), 0)
        else: loc = (cx + a, cy + b, cz); rot = (0, 0, rnd.uniform(0, 6.3))
        _beetle('%sB%d' % (prefix, i), loc, rot, mat, s * rnd.uniform(0.7, 1.3))


def build_barang(loc=(0, 0, 0), rotz=0.0, stage=4, glow=1.0):
    """Barang: what the mambabarang left in Lola's aparador. A withered woman folded among the hanging dresses,
    skin split and crawling with black beetles; eyes are holes where the beetles come out. Built facing -y.
    stage 2: only eyes in the dark; stage 3: face + one hand on the edge; stage 4: leaning out, mouth open, both hands."""
    before = set(o.name for o in bpy.data.objects)
    skin = mat_skin('brSkin', (0.12, 0.1, 0.075), (0.26, 0.22, 0.16), sss=0.15, rough=0.7)
    skin.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.75
    bm = beetle_mat()
    lean = {2: 0.0, 3: -0.06, 4: -0.18}.get(stage, 0.0)
    hx, hy, hz = 0.0, -0.05 + lean, 1.45
    if stage >= 3:
        # gaunt face: long skull with wrinkled, cracked skin, deep sockets, brow ridge, collapsed nose
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=0.1, location=(hx, hy, hz))
        f = bpy.context.active_object; f.name = 'brHead'; f.scale = (0.8, 0.86, 1.22)
        for nm, kind, st, ns in (('w', 'STUCCI', 0.006, 0.02), ('c', 'VORONOI', 0.01, 0.05)):
            t = bpy.data.textures.new('brHeadT' + nm, kind); t.noise_scale = ns
            dm = f.modifiers.new(nm, 'DISPLACE'); dm.texture = t; dm.strength = st
        bpy.ops.object.shade_smooth(); f.data.materials.append(skin)
        sphere('brBrow', 0.05, (hx, hy - 0.06, hz + 0.055), skin, scale=(1.6, 0.6, 0.45))
        skin_body('brNose', [(hx, hy - 0.08, hz + 0.03), (hx, hy - 0.1, hz - 0.02), (hx, hy - 0.095, hz - 0.035)], [(0, 1), (1, 2)], [0.012, 0.014, 0.01], skin, sub=1)
        for s in (-1, 1):
            sphere('brCheek%d' % s, 0.032, (hx + s * 0.058, hy - 0.055, hz - 0.035), mat_basic('brHollow', (0.02, 0.014, 0.01), 0.85), scale=(0.6, 0.45, 1.3))
            sphere('brCheekB%d' % s, 0.022, (hx + s * 0.07, hy - 0.065, hz + 0.0), skin, scale=(0.8, 0.6, 0.7))
        tooth = mat_basic('brTooth', (0.32, 0.27, 0.18), 0.4)
        hair = mat_basic('brHair', (0.35, 0.33, 0.3), 0.6)   # thin grey hair, Lola's
        rnd = random.Random(4)
        for i in range(60):
            L = rnd.uniform(0.3, 0.8); a = rnd.uniform(-1.5, 1.5); front = i % 5 == 0
            cyl('brHairS%d' % i, 0.0022, L, (hx + 0.09 * math.sin(a), hy - (0.1 if front else -0.05 * math.cos(a) - 0.02), hz + 0.1 - L / 2), hair, verts=5)
        # neck and body inside the dark, wrapped in an old daster dress
        dress = mat_noise('brDress', (0.05, 0.04, 0.035), (0.1, 0.08, 0.06), scale=12, rough=0.95, bump=0.1)
        skin_body('brBody', [(hx, hy + 0.08, hz - 0.15), (hx, hy + 0.12, hz - 0.45), (hx, hy + 0.15, hz - 1.0)], [(0, 1), (1, 2)], [0.04, 0.16, 0.2], dress, sub=2)
        # mouth: open, black, beetles spilling (stage 4)
        mouth = mat_basic('brMouth', (0.01, 0.005, 0.004), 0.6)
        sphere('brMouth', 0.03, (hx, hy - 0.075, hz - 0.085), mouth, scale=(0.75, 0.5, 2.0 if stage >= 4 else 0.7))
        for i in range(5):
            t_ = (i - 2) / 2
            _bone('brTth%d' % i, (hx + t_ * 0.018, hy - 0.088, hz - 0.03 - abs(t_) * 0.006), (hx + t_ * 0.02, hy - 0.09, hz - 0.05 - (i % 2) * 0.012), 0.0035, tooth)
        if stage >= 4:
            scatter_beetles('brM', (hx, hy - 0.09, hz - 0.14), (0.05, 0.12), 14, 'y', seed=7, mat=bm)
        # skin cracks with beetles crawling out of the cheeks and brow
        scatter_beetles('brF', (hx, hy - 0.08, hz + 0.02), (0.15, 0.22), 18 if stage == 3 else 34, 'y', seed=3, mat=bm)
    # eye holes: black with a faint wet glint deep inside
    hole = mat_basic('brHole', (0.0, 0.0, 0.0), 0.9)
    glint = emission('brGlint', (0.85, 0.9, 0.6), 2.5 * glow)
    for s in (-1, 1):
        ex = hx + s * 0.038
        if stage >= 3: sphere('brHole%d' % s, 0.022, (ex, hy - 0.075, hz + 0.02), hole, scale=(1, 0.5, 0.8))
        sphere('brGlint%d' % s, 0.005, (ex, hy - 0.09 if stage >= 3 else hy - 0.02, hz + 0.022), glint)
    # hands: long grey fingers over the edge of the flap
    if stage >= 3:
        _claws('brHR', (0.2, hy - 0.06, 1.12), (0.05, -0.6, -0.2), skin, n=4, L=0.2, spread=0.03, curl=-0.08)
        skin_body('brArmR', [(0.1, hy + 0.15, 1.0), (0.2, hy - 0.06, 1.12)], [(0, 1)], [0.03, 0.02], skin, sub=1)
        scatter_beetles('brHRb', (0.22, hy - 0.12, 1.1), (0.08, 0.06), 6, 'z', seed=11, mat=bm)
    if stage >= 4:
        _claws('brHL', (-0.22, hy - 0.08, 1.25), (-0.1, -0.6, -0.1), skin, n=4, L=0.22, spread=0.03, curl=-0.06)
        skin_body('brArmL', [(-0.12, hy + 0.15, 1.1), (-0.22, hy - 0.08, 1.25)], [(0, 1)], [0.03, 0.02], skin, sub=1)
    return group_at(before, loc, rotz)
