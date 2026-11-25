"""Game lettering rendered in Blender: worn, painted 3D letters on a transparent background.
usage: blender -b -P words.py -- <jobs.json> [samples]
jobs.json: [{"text": "...", "out": "file.png", "style": "logo"|"menu"|"title"}, ...]"""
import sys, os, json, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
a = sys.argv[sys.argv.index('--') + 1:]
jobs = json.load(open(a[0])); SAMPLES = int(a[1]) if len(a) > 1 else 48
FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')

def paint(name, base, worn, rust, chips=0.56):
    """Old enamel paint: base colour, chipped to bare metal in a grungy noise, a little rust in the chips."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 9; n1.inputs['Detail'].default_value = 12; n1.inputs['Roughness'].default_value = 0.65
    nt.links.new(tc.outputs['Object'], n1.inputs['Vector'])
    chip = nt.nodes.new('ShaderNodeValToRGB'); chip.color_ramp.elements[0].position = chips; chip.color_ramp.elements[1].position = chips + 0.04
    nt.links.new(n1.outputs['Fac'], chip.inputs['Fac'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs[6].default_value = (*base, 1); mix.inputs[7].default_value = (*worn, 1)
    nt.links.new(chip.outputs['Color'], mix.inputs[0])
    n2 = nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 40; nt.links.new(tc.outputs['Object'], n2.inputs['Vector'])
    mix2 = nt.nodes.new('ShaderNodeMix'); mix2.data_type = 'RGBA'; mix2.inputs[7].default_value = (*rust, 1)
    rr = nt.nodes.new('ShaderNodeMath'); rr.operation = 'MULTIPLY'; nt.links.new(chip.outputs['Color'], rr.inputs[0]); nt.links.new(n2.outputs['Fac'], rr.inputs[1])
    nt.links.new(rr.outputs['Value'], mix2.inputs[0]); nt.links.new(mix.outputs[2], mix2.inputs[6])
    nt.links.new(mix2.outputs[2], bs.inputs['Base Color'])
    rough = nt.nodes.new('ShaderNodeMapRange'); rough.inputs[3].default_value = 0.55; rough.inputs[4].default_value = 0.3
    nt.links.new(chip.outputs['Color'], rough.inputs[0]); nt.links.new(rough.outputs[0], bs.inputs['Roughness'])
    bs.inputs['Metallic'].default_value = 0.15
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.35
    nt.links.new(chip.outputs['Color'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], bs.inputs['Normal'])
    return m

for j in jobs:
    sc = reset(); sc.cycles.samples = SAMPLES; sc.render.film_transparent = True
    style = j.get('style', 'menu')
    font = bpy.data.fonts.load(os.path.join(FONTS, 'Oswald-Bold.ttf' if style in ('logo', 'title') else 'Oswald-Medium.ttf'))
    bpy.ops.object.text_add(location=(0, 0, 0)); t = bpy.context.active_object; t.data.body = j['text']; t.data.font = font
    t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'; t.data.space_character = 1.06 if style != 'logo' else 1.02
    t.data.extrude = 0.06 if style == 'logo' else 0.035; t.data.bevel_depth = 0.012 if style == 'logo' else 0.006; t.data.bevel_resolution = 3
    if style == 'logo': t.data.materials.append(paint('p', (0.62, 0.58, 0.5), (0.05, 0.045, 0.04), (0.25, 0.02, 0.015)))
    elif style == 'title': t.data.materials.append(paint('p', (0.66, 0.62, 0.54), (0.06, 0.05, 0.045), (0.25, 0.02, 0.015)))
    else: t.data.materials.append(paint('p', (0.7, 0.66, 0.58), (0.08, 0.07, 0.06), (0.22, 0.03, 0.02), chips=0.64))
    bpy.ops.object.convert(target='MESH'); t = bpy.context.active_object
    t.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.view_layer.update()
    bb = [t.matrix_world @ mathutils.Vector(c) for c in t.bound_box] if 'mathutils' in globals() else None
    import mathutils
    bb = [t.matrix_world @ mathutils.Vector(c) for c in t.bound_box]
    xs = [v.x for v in bb]; zs = [v.z for v in bb]; w_ = max(xs) - min(xs); h_ = max(zs) - min(zs)
    # light: a cold key from upper left, a red-orange glow from below (the menu's failing bulb), rim behind
    area('key', (-5, -2.5, 4), (math.radians(50), 0, math.radians(-60)), 700, size=(1.2, 1.2), color=(0.85, 0.9, 1.0))
    area('under', (0.5, -2.5, -2.2), (math.radians(130), 0, math.radians(10)), 70 if style == 'logo' else 35, size=(3, 1), color=(1.0, 0.45, 0.25))
    area('fill', (3, -4, 0.5), (math.radians(80), 0, math.radians(35)), 25, size=(2, 2), color=(1.0, 0.85, 0.7))
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.02
    # orthographic camera framed on the word, a hair of perspective tilt for depth on the logo
    cam = camera((0, -10, 0), (0, 0, 0), lens=50); cam.data.type = 'ORTHO'
    pad = 1.08; ratio = w_ / h_
    px_h = 160 if style == 'menu' else 360
    sc.render.resolution_y = px_h; sc.render.resolution_x = int(px_h * ratio * pad / 1.25); sc.render.resolution_percentage = 100
    cam.data.ortho_scale = max(w_ * pad, h_ * 1.25 * sc.render.resolution_x / sc.render.resolution_y)
    os.environ['RES_PCT'] = '100'
    render(j['out'])
    print('word', j['out'])
