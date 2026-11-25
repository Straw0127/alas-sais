"""The player's phone: a worn budget Android, seen straight on, transparent background.
usage: blender -b -P phone.py -- <out.png> [samples] [--mask]   (--mask: screen white, everything else black, for the UI screen box)"""
import sys, os, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
sc = reset()
a = sys.argv[sys.argv.index('--') + 1:]
out = a[0]; sc.cycles.samples = int(a[1]) if len(a) > 1 and a[1].isdigit() else 64
MASK = '--mask' in a
sc.render.resolution_x, sc.render.resolution_y = 600, 1200; sc.render.resolution_percentage = 100
sc.render.film_transparent = True

W, H, T = 0.074, 0.158, 0.0095          # body (m)
SW, SH = 0.0665, 0.1455                  # glass opening
def rounded(name, w, h, d, r, loc, mat, segs=10):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name
    o.scale = (w, h, d); bpy.ops.object.transform_apply(scale=True)
    bv = o.modifiers.new('b', 'BEVEL'); bv.width = r; bv.segments = segs; bv.affect = 'EDGES'
    bpy.ops.object.modifier_apply(modifier='b')
    o.data.materials.append(mat); return o

if MASK:
    black = emission('mBlack', (0, 0, 0), 0); white = emission('mWhite', (1, 1, 1), 1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0
    rounded('body', W, H, T, 0.0085, (0, 0, 0), black)
    rounded('screen', SW, SH, 0.0012, 0.0055, (0, 0, T / 2 + 0.0004), white, 8)
else:
    # dark graphite plastic frame with wear on the edges, scuffed glass
    frame = mat_basic('frame', (0.045, 0.047, 0.05), 0.32, metal=0.7)
    rounded('body', W, H, T, 0.0085, (0, 0, 0), frame)
    rounded('bezel', W - 0.0016, H - 0.0016, 0.0004, 0.0078, (0, 0, T / 2 + 0.0001), mat_basic('bezelM', (0.006, 0.006, 0.007), 0.5))
    glass = bpy.data.materials.new('glass'); glass.use_nodes = True
    nt = glass.node_tree; bs = nt.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (0.004, 0.005, 0.006, 1)
    bs.inputs['Roughness'].default_value = 0.08
    bs.inputs['Coat Weight'].default_value = 0.6; bs.inputs['Coat Roughness'].default_value = 0.03
    # smudges: roughness rises in finger-sized patches
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 22; n.inputs['Detail'].default_value = 3
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = 0.45; cr.color_ramp.elements[1].position = 0.7
    cr.color_ramp.elements[0].color = (0.07, 0.07, 0.07, 1); cr.color_ramp.elements[1].color = (0.16, 0.16, 0.16, 1)
    nt.links.new(n.outputs['Fac'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], bs.inputs['Roughness'])
    rounded('glassTop', W - 0.0026, H - 0.0026, 0.0008, 0.0078, (0, 0, T / 2 + 0.0002), glass)
    # the screen panel itself (black, the UI is drawn over it) and its thin bezel ring
    # punch-hole camera, earpiece slit, side buttons
    cam = mat_basic('camlens', (0.01, 0.012, 0.02), 0.05, metal=0.3)
    cyl('punch', 0.0019, 0.0006, (0, SH / 2 - 0.0045, T / 2 + 0.0012), cam, verts=24)
    box('ear', (0.011, 0.0007, 0.0003), (0, H / 2 - 0.0022, T / 2 + 0.0011), mat_basic('grill', (0.02, 0.02, 0.02), 0.6), bevel=0.0003)
    btn = mat_basic('btn', (0.05, 0.052, 0.055), 0.35, metal=0.6)
    box('pwr', (0.0012, 0.012, 0.003), (W / 2 + 0.0004, 0.022, 0), btn, bevel=0.0005)
    box('vol', (0.0012, 0.022, 0.003), (W / 2 + 0.0004, 0.045, 0), btn, bevel=0.0005)
    # a hairline crack across the lower corner of the glass
    crack = mat_basic('crack', (0.16, 0.17, 0.18), 0.2)
    pts = [(-0.033, -0.058), (-0.024, -0.062), (-0.017, -0.069), (-0.006, -0.071)]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        L = math.hypot(x1 - x0, y1 - y0)
        box('crack%d' % i, (L, 0.00018, 0.00005), ((x0 + x1) / 2, (y0 + y1) / 2, T / 2 + 0.0007), crack, rot=(0, 0, math.atan2(y1 - y0, x1 - x0)))
    # a soft room key from the upper left, a warm bounce from below (the bedroom bulb), a rim for the frame edge
    area('key', (-0.18, 0.25, 0.35), (math.radians(-30), math.radians(-25), 0), 9, size=(0.25, 0.25), color=(1.0, 0.92, 0.82))
    area('bounce', (0.1, -0.3, 0.2), (math.radians(50), math.radians(15), 0), 3, size=(0.3, 0.3), color=(1.0, 0.7, 0.45))
    area('rim', (0.25, 0.1, -0.02), (0, math.radians(95), 0), 20, size=(0.1, 0.4), color=(0.75, 0.82, 1.0))
    area('rimL', (-0.25, 0.05, -0.02), (0, math.radians(-95), 0), 10, size=(0.1, 0.4), color=(1.0, 0.8, 0.6)); bpy.data.objects['rimL'].visible_camera = False
    # a long thin strip reflected diagonally in the glass
    for n_ in ('key', 'bounce', 'rim'): bpy.data.objects[n_].visible_camera = False; bpy.data.objects[n_].visible_glossy = (n_ == 'rim')
    # what the glass reflects: a dim room, brighter toward the top (the ceiling bulb far away)
    wn = sc.world.node_tree; bg_ = wn.nodes['Background']
    grad = wn.nodes.new('ShaderNodeTexGradient'); grad.gradient_type = 'LINEAR'; tc = wn.nodes.new('ShaderNodeTexCoord'); mp = wn.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (0, math.radians(-90), math.radians(20))
    ramp = wn.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (0.004, 0.004, 0.005, 1); ramp.color_ramp.elements[1].color = (0.26, 0.22, 0.18, 1)
    wn.links.new(tc.outputs['Generated'], mp.inputs['Vector']); wn.links.new(mp.outputs['Vector'], grad.inputs['Vector'])
    wn.links.new(grad.outputs['Fac'], ramp.inputs['Fac']); wn.links.new(ramp.outputs['Color'], bg_.inputs['Color']); bg_.inputs['Strength'].default_value = 1.0

cam_ = camera((0, 0, 0.9), (0, 0, 0), lens=200)   # long lens: almost no perspective, so the UI fits the glass
sc.render.resolution_x, sc.render.resolution_y = 600, 1200
cam_.data.sensor_fit = 'VERTICAL'; cam_.data.sensor_height = 36 * (H * 1.06) / (0.9 * 36 / 200)
render(out)
