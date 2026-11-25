"""
Blender 5.2 离线重建展厅环境道具脚本：
严格对齐现有包围盒尺寸与 Y=0 接地原点，提升几何细节并烘入 PBR 纹理（WebP 压缩）。
用法: F:\\Apps\\Blender\\blender.exe --background --python tools/blender/rebuild_env_props.py
"""
import os
import math
import bpy
import bmesh
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT_DIR = os.path.join(ROOT, 'public', 'models', 'environment')
os.makedirs(OUT_DIR, exist_ok=True)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def export_glb(filename):
    out_path = os.path.join(OUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
        export_image_quality=82,
        export_yup=True,
        export_apply=True
    )
    print(f'[blender] 导出完成: {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)')


def add_bevel(obj, width=0.006, segments=2):
    mod = obj.modifiers.new('Bevel', 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(32)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()


def make_rosewood_material(name='M_Rosewood'):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value = 0.0
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = 0.35
        bsdf.inputs['Coat Roughness'].default_value = 0.22

    # 烘焙木纹贴图（确保 GLTF 导出器直接打包图像，不丢失节点程序纹理）
    img_col = bpy.data.images.new(name + '_Diff', 512, 512)
    img_rgh = bpy.data.images.new(name + '_Rough', 512, 512)
    px_col = [0.0] * (512 * 512 * 4)
    px_rgh = [0.0] * (512 * 512 * 4)
    for y in range(512):
        for x in range(512):
            u = x / 512.0
            v = y / 512.0
            grain = math.sin((v * 42.0 + math.sin(u * 6.28318 * 2.0) * 1.4 + math.sin(u * 18.8 + v * 9.0) * 0.35))
            fine = math.sin(v * 180.0 + u * 25.0) * 0.15
            t = 0.5 + 0.38 * grain + 0.12 * fine
            t = max(0.0, min(1.0, t))
            # 深紫檀红棕色调
            r = 0.14 + 0.16 * t
            g = 0.045 + 0.055 * t
            b = 0.032 + 0.035 * t
            idx = (y * 512 + x) * 4
            px_col[idx:idx + 4] = [r, g, b, 1.0]
            rv = 0.26 + 0.22 * (1.0 - t)
            px_rgh[idx:idx + 4] = [rv, rv, rv, 1.0]
    img_col.pixels.foreach_set(px_col)
    img_rgh.pixels.foreach_set(px_rgh)
    img_col.pack()
    img_rgh.pack()

    tex_col = nt.nodes.new('ShaderNodeTexImage')
    tex_col.image = img_col
    tex_rgh = nt.nodes.new('ShaderNodeTexImage')
    tex_rgh.image = img_rgh
    tex_rgh.image.colorspace_settings.name = 'Non-Color'

    nt.links.new(tex_col.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(tex_rgh.outputs['Color'], bsdf.inputs['Roughness'])
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


def make_brass_material(name='M_AgedBrass', patinated=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')

    img_col = bpy.data.images.new(name + '_Diff', 512, 512)
    img_rgh = bpy.data.images.new(name + '_Rough', 512, 512)
    px_col = [0.0] * (512 * 512 * 4)
    px_rgh = [0.0] * (512 * 512 * 4)
    for y in range(512):
        for x in range(512):
            u, v = x / 512.0, y / 512.0
            n = 0.5 + 0.5 * math.sin(u * 31.0 + math.cos(v * 23.0) * 2.1) * math.cos(v * 41.0)
            idx = (y * 512 + x) * 4
            if patinated:
                # 铜绿包浆与古铜底色交织
                pat = max(0.0, (n - 0.58) * 2.2)
                r = 0.24 * (1 - pat) + 0.14 * pat
                g = 0.17 * (1 - pat) + 0.28 * pat
                b = 0.09 * (1 - pat) + 0.21 * pat
                rv = 0.34 + 0.32 * pat
            else:
                r = 0.55 + 0.12 * n
                g = 0.41 + 0.09 * n
                b = 0.18 + 0.05 * n
                rv = 0.24 + 0.12 * n
            px_col[idx:idx + 4] = [r, g, b, 1.0]
            px_rgh[idx:idx + 4] = [rv, rv, rv, 1.0]
    img_col.pixels.foreach_set(px_col)
    img_rgh.pixels.foreach_set(px_rgh)
    img_col.pack()
    img_rgh.pack()

    tex_c = nt.nodes.new('ShaderNodeTexImage')
    tex_c.image = img_col
    tex_r = nt.nodes.new('ShaderNodeTexImage')
    tex_r.image = img_rgh
    tex_r.image.colorspace_settings.name = 'Non-Color'
    bsdf.inputs['Metallic'].default_value = 0.78 if patinated else 0.88
    nt.links.new(tex_c.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(tex_r.outputs['Color'], bsdf.inputs['Roughness'])
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


def make_silk_landscape_material(name='M_SilkLandscape'):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.68
    bsdf.inputs['Metallic'].default_value = 0.0

    w, h = 1024, 512
    img = bpy.data.images.new(name + '_Diff', w, h)
    px = [0.0] * (w * h * 4)
    for y in range(h):
        v = y / float(h)  # 0 bottom -> 1 top
        for x in range(w):
            u = x / float(w)
            # 绢本底色（青黛玄墨渐变）
            r = 0.07 + 0.06 * v
            g = 0.11 + 0.08 * v
            b = 0.13 + 0.07 * v
            # 丝绢经纬细纹
            weave = (math.sin(u * 900.0) * 0.008 + math.sin(v * 700.0) * 0.008)
            r += weave; g += weave; b += weave

            # 四重千里江山青绿叠嶂
            layers = [
                (0.56, 0.14, 2.2, 0.11, 0.24, 0.25),
                (0.42, 0.12, 3.6, 0.14, 0.34, 0.32),
                (0.29, 0.10, 5.1, 0.10, 0.28, 0.26),
                (0.18, 0.06, 7.2, 0.06, 0.15, 0.16),
            ]
            for base_h, amp, freq, cr, cg, cb in layers:
                ridge = base_h + amp * (0.6 * math.sin(u * 6.28318 * freq + base_h * 9.0) + 0.4 * math.cos(u * 6.28318 * freq * 1.7 + 1.2))
                if v < ridge:
                    depth = min(1.0, (ridge - v) * 8.0)
                    rim = max(0.0, 1.0 - (ridge - v) * 32.0)  # 青绿山脊高光金边
                    r = cr * (0.6 + 0.4 * depth) + rim * 0.22
                    g = cg * (0.65 + 0.35 * depth) + rim * 0.20
                    b = cb * (0.65 + 0.35 * depth) + rim * 0.10

            # 一轮淡月/微光在右上方
            d_moon = math.hypot((u - 0.72) * 2.0, v - 0.76)
            if d_moon < 0.28:
                glow = math.exp(-d_moon * d_moon * 48.0) * 0.28
                r += glow * 1.05; g += glow * 0.95; b += glow * 0.72

            idx = (y * w + x) * 4
            px[idx:idx + 4] = [max(0.0, min(1.0, r)), max(0.0, min(1.0, g)), max(0.0, min(1.0, b)), 1.0]
    img.pixels.foreach_set(px)
    img.pack()

    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


def create_box(name, size, center_world, mat, bevel=0.004):
    # Note: in Blender Z-up before glTF Y-up export: center_world = (x, y_depth, z_height)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=center_world)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    if bevel > 0:
        add_bevel(obj, bevel, 2)
    return obj


def build_rosewood_table():
    """明清苏作束腰马蹄腿紫檀案：精确宽 1.60 (-0.8..0.8), 深 0.82 (-0.41..0.41), 高 0.783 (Z: 0..0.783)"""
    clear_scene()
    wood = make_rosewood_material()
    brass = make_brass_material('M_TableBrass', patinated=False)
    objs = []

    # 1. 案面大边（冰盘沿：总高 0.056，顶面严格在 Z = 0.783）
    objs.append(create_box('Table_Top', (1.60, 0.82, 0.044), (0, 0, 0.783 - 0.022), wood, bevel=0.008))
    objs.append(create_box('Table_Waist', (1.46, 0.68, 0.032), (0, 0, 0.783 - 0.044 - 0.016), wood, bevel=0.004))

    # 2. 牙板与罗锅枨（四面围合）
    objs.append(create_box('Apron_Front', (1.36, 0.028, 0.068), (0, -0.34, 0.672), wood, bevel=0.004))
    objs.append(create_box('Apron_Back', (1.36, 0.028, 0.068), (0, 0.34, 0.672), wood, bevel=0.004))
    objs.append(create_box('Apron_Left', (0.028, 0.64, 0.068), (-0.70, 0, 0.672), wood, bevel=0.004))
    objs.append(create_box('Apron_Right', (0.028, 0.64, 0.068), (0.70, 0, 0.672), wood, bevel=0.004))

    # 3. 攒接横枨（低位拉结 + 侧面双枨）
    objs.append(create_box('Stretcher_Back', (1.40, 0.026, 0.026), (0, 0.34, 0.18), wood, bevel=0.003))
    objs.append(create_box('Stretcher_Left', (0.026, 0.68, 0.026), (-0.70, 0, 0.22), wood, bevel=0.003))
    objs.append(create_box('Stretcher_Right', (0.026, 0.68, 0.026), (0.70, 0, 0.22), wood, bevel=0.003))

    # 4. 四条微收分马蹄腿 + 黄铜包脚（Z=0 精确着地）
    leg_positions = [(-0.70, -0.34), (0.70, -0.34), (-0.70, 0.34), (0.70, 0.34)]
    for idx, (lx, ly) in enumerate(leg_positions):
        # 腿柱本体 Z: 0.04 .. 0.72
        objs.append(create_box(f'Leg_{idx}', (0.062, 0.062, 0.68), (lx, ly, 0.38), wood, bevel=0.006))
        # 马蹄回勾底垫 + 黄铜包脚 Z: 0.00 .. 0.042
        objs.append(create_box(f'LegFoot_{idx}', (0.072, 0.072, 0.036), (lx, ly, 0.018), wood, bevel=0.005))
        objs.append(create_box(f'LegBrass_{idx}', (0.068, 0.068, 0.016), (lx, ly, 0.045), brass, bevel=0.002))

    # 5. 桌面中心嵌玉/云石小垫盘轮廓框（视觉引导器物居中落座）
    objs.append(create_box('Inlay_Border', (0.58, 0.58, 0.003), (0, 0, 0.7818), brass, bevel=0.001))

    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = 'Imperial_Rosewood_Table_Master'
    export_glb('rosewood_table.glb')


def build_scholar_screen():
    """宋式三折青绿山水围屏：总宽 ~2.60m, 总高 2.45m (Z: 0..2.45)"""
    clear_scene()
    wood = make_rosewood_material('M_ScreenWood')
    silk = make_silk_landscape_material('M_ScreenSilk')
    brass = make_brass_material('M_ScreenBrass', patinated=False)
    parts = []

    def make_panel(prefix, width, height, cx, cy, yaw_rad):
        panel_objs = []
        frame_t = 0.055
        # 绢画芯板
        panel_objs.append(create_box(prefix + '_Silk', (width - frame_t * 2, 0.016, height - 0.24), (0, 0, height * 0.5 + 0.05), silk, bevel=0.0))
        # 四框立柱与横枋
        panel_objs.append(create_box(prefix + '_L', (frame_t, 0.048, height - 0.08), (-width * 0.5 + frame_t * 0.5, 0, height * 0.5 + 0.04), wood, bevel=0.005))
        panel_objs.append(create_box(prefix + '_R', (frame_t, 0.048, height - 0.08), (width * 0.5 - frame_t * 0.5, 0, height * 0.5 + 0.04), wood, bevel=0.005))
        panel_objs.append(create_box(prefix + '_Top', (width, 0.052, 0.068), (0, 0, height - 0.034), wood, bevel=0.006))
        panel_objs.append(create_box(prefix + '_Mid', (width - frame_t * 1.4, 0.044, 0.052), (0, 0, 0.24), wood, bevel=0.004))
        panel_objs.append(create_box(prefix + '_Bot', (width - frame_t * 1.4, 0.046, 0.048), (0, 0, 0.09), wood, bevel=0.004))
        # 底座墩脚（Z=0 着地）
        panel_objs.append(create_box(prefix + '_FootL', (0.09, 0.24, 0.075), (-width * 0.5 + frame_t * 0.5, 0, 0.0375), wood, bevel=0.006))
        panel_objs.append(create_box(prefix + '_FootR', (0.09, 0.24, 0.075), (width * 0.5 - frame_t * 0.5, 0, 0.0375), wood, bevel=0.006))
        # 铜合页装饰
        for hz in (0.45, 1.25, 2.05):
            panel_objs.append(create_box(prefix + f'_Hinge_{hz}', (0.022, 0.056, 0.08), (-width * 0.5, 0, hz), brass, bevel=0.002))

        for o in panel_objs:
            o.select_set(True)
        bpy.ops.object.select_all(action='DESELECT')
        for o in panel_objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = panel_objs[0]
        bpy.ops.object.join()
        grp = panel_objs[0]
        grp.rotation_euler = (0, 0, yaw_rad)
        grp.location = (cx, cy, 0)
        bpy.ops.object.transform_apply(location=True, rotation=True)
        return grp

    parts.append(make_panel('Center', 1.38, 2.45, 0.0, 0.0, 0.0))
    parts.append(make_panel('LeftWing', 0.68, 2.34, -0.96, -0.18, math.radians(-26)))
    parts.append(make_panel('RightWing', 0.68, 2.34, 0.96, -0.18, math.radians(26)))

    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    parts[0].name = 'Imperial_Scholar_Screen_Master'
    export_glb('scholar_screen.glb')


def build_bronze_censer():
    """宋仿古三足双耳铜博山炉：高 0.41m (Z: 0..0.41)，径 ~0.26m"""
    clear_scene()
    bronze = make_brass_material('M_BronzePatina', patinated=True)
    wood = make_rosewood_material('M_CenserBase')
    objs = []

    # 1. 紫檀底座垫盘 (Z: 0..0.025)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.115, depth=0.024, location=(0, 0, 0.012))
    base = bpy.context.active_object
    base.data.materials.append(wood)
    add_bevel(base, 0.003, 2)
    objs.append(base)

    # 2. 三乳足 (Z: 0.024..0.088)
    for k in range(3):
        ang = k * (2 * math.pi / 3) + math.pi / 6
        fx, fy = math.cos(ang) * 0.072, math.sin(ang) * 0.072
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=0.024, location=(fx, fy, 0.056))
        foot = bpy.context.active_object
        foot.scale = (0.85, 0.85, 1.45)
        bpy.ops.object.transform_apply(scale=True)
        foot.data.materials.append(bronze)
        bpy.ops.object.shade_smooth()
        objs.append(foot)

    # 3. 旋转炉身与炉盖 (Z: 0.065..0.41)
    profile = [
        (0.0, 0.07), (0.075, 0.075), (0.115, 0.115), (0.125, 0.165),
        (0.112, 0.215), (0.095, 0.238), (0.106, 0.252), (0.092, 0.262),
        # 博山层峦镂空盖
        (0.096, 0.268), (0.082, 0.305), (0.062, 0.342), (0.036, 0.376),
        (0.016, 0.398), (0.0, 0.41)
    ]
    bm = bmesh.new()
    segs = 48
    rings = []
    for r, z in profile:
        if r == 0.0:
            v = bm.verts.new((0, 0, z))
            rings.append([v])
        else:
            ring = []
            for s in range(segs):
                a = 2 * math.pi * s / segs
                # 盖身山峰微起伏
                dz = 0.008 * math.sin(a * 6.0) if (0.28 < z < 0.39) else 0.0
                ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z + dz)))
            rings.append(ring)
    for i in range(len(rings) - 1):
        r0, r1 = rings[i], rings[i + 1]
        if len(r0) == 1:
            for s in range(segs):
                bm.faces.new((r0[0], r1[s], r1[(s + 1) % segs]))
        elif len(r1) == 1:
            for s in range(segs):
                bm.faces.new((r0[s], r0[(s + 1) % segs], r1[0]))
        else:
            for s in range(segs):
                ns = (s + 1) % segs
                bm.faces.new((r0[s], r0[ns], r1[ns], r1[s]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('CenserBody')
    bm.to_mesh(mesh)
    bm.free()
    body = bpy.data.objects.new('CenserBody', mesh)
    bpy.context.collection.objects.link(body)
    body.data.materials.append(bronze)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.shade_smooth()
    objs.append(body)

    # 4. 双冲耳（左右环状耳）
    for side in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(
            major_segments=28, minor_segments=12,
            major_radius=0.036, minor_radius=0.009,
            location=(side * 0.108, 0, 0.256),
            rotation=(math.radians(90), 0, 0)
        )
        ear = bpy.context.active_object
        ear.scale = (0.75, 1.0, 1.25)
        bpy.ops.object.transform_apply(scale=True)
        ear.data.materials.append(bronze)
        bpy.ops.object.shade_smooth()
        objs.append(ear)

    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = 'Imperial_Bronze_Censer_Master'
    export_glb('bronze_censer.glb')


def build_hologram_pedestal():
    """文博八角须弥座展台：总高 0.902m (Z: 0..0.902), 径 ~1.0m"""
    clear_scene()
    wood = make_rosewood_material('M_PedestalWood')
    brass = make_brass_material('M_PedestalBrass', patinated=False)
    objs = []

    tiers = [
        (0.508, 0.095, 0.0475, wood),
        (0.470, 0.080, 0.135, wood),
        (0.415, 0.540, 0.445, wood),  # 束腰柱体
        (0.475, 0.085, 0.7575, wood),
        (0.500, 0.075, 0.8375, wood),
        (0.495, 0.027, 0.8885, wood),
    ]
    for idx, (r, h, cz, mat) in enumerate(tiers):
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=r, depth=h, location=(0, 0, cz), rotation=(0, 0, math.pi / 8))
        o = bpy.context.active_object
        o.data.materials.append(mat)
        add_bevel(o, 0.005, 2)
        objs.append(o)

    # 顶缘与束腰黄铜压边
    for r, h, cz in [(0.502, 0.012, 0.896), (0.422, 0.014, 0.180), (0.422, 0.014, 0.710)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=r, depth=h, location=(0, 0, cz), rotation=(0, 0, math.pi / 8))
        b = bpy.context.active_object
        b.data.materials.append(brass)
        add_bevel(b, 0.002, 1)
        objs.append(b)

    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = 'Imperial_Hologram_Pedestal_Master'
    export_glb('hologram_pedestal.glb')


if __name__ == '__main__':
    build_rosewood_table()
    build_scholar_screen()
    build_bronze_censer()
    build_hologram_pedestal()
    print('[blender] 全部环境道具重建完毕。')
