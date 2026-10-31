﻿﻿/**
 * ============================================================================
 * 天青泥火 · three-fx.js  —— 3D 展馆「画面升华」增强层 (v7.0 Visual Overhaul)
 * ----------------------------------------------------------------------------
 * 加载位置：index.html 中 three-scene.js 之后、ai-recognition.js 之前。
 *
 * 设计原则（接口锁定）：
 *   1. 不删除、不重命名 three-scene.js 中任何函数 / DOM ID / 全局变量；
 *      仅通过「同名函数包装 (wrap)」或「同名函数替换」追加视觉能力；
 *   2. 原函数签名、参数、返回值 100% 向后兼容
 *      (initThreeJS / animate / handleThreeResize / switchRealisticSceneEnv /
 *       setStudioLighting / switchExhibitionMode / loadPorcelainModel /
 *       buildGeometry / createStudioEnvironment / createSmoothVesselLathe /
 *       updateHotspotsScreenProjection / strike3DVesselSound)；
 *   3. 删除本文件的 <script> 标签即可完整回退到旧版画面。
 *
 * 本文件提供：
 *   A. 电影级环境反射贴图（宋式轩窗格栅 + 柔光箱 + 天青辅光，2:1 等距柱状）
 *   B. 四套「氛围档案」：背景渐变 / 雾 / 曝光 / 光比，彻底消除地平线硬切
 *   C. 接触阴影 (Contact Shadow) + 2048 级主光阴影 + 地面羽化
 *   D. 轩窗丁达尔体积光 (God Rays) 呼吸动效
 *   E. 柔焦悬浮微尘 + 博山炉青烟（真实上升、扩散、渐隐）
 *   F. 程序化「千里江山」泥金青绿六曲屏风（替换纯色平板屏风）
 *   G. 相机导演：帧率无关阻尼 + 大跨度运镜 easeInOutQuart + 开场推镜 + 拖拽惯性
 *   H. 瓷器材质升级：GLB 的 Standard 材质 → Physical 双层清漆（玉质温润）
 *   I. 自适应视口 (竖屏 FOV 补偿 / ResizeObserver / 动态像素比降级)
 *   J. 热点标签外向排布、声学共振示波器 (DPR 清晰 + 多谐波 + 辉光)
 * ============================================================================
 */
(function () {
    'use strict';
    if (typeof THREE === 'undefined') return;

    const FX = (window.VisualFX = { t: 0, env: 'studio', ready: false });

    const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const IS_TOUCH = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const TAU = Math.PI * 2;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const damp = (cur, tgt, k, dt) => cur + (tgt - cur) * (1 - Math.exp(-k * dt)); // 帧率无关阻尼
    const easeInOutQuart = (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
    const easeOutBack = (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

    // 带种子的伪随机数，保证山水/金箔每次生成一致
    function rng(seed) {
        let s = seed >>> 0 || 1;
        return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }

    function makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return [c, c.getContext('2d')];
    }

    /* ======================================================================
     * A. 电影级环境贴图：覆盖 three-scene.js 中的 createStudioEnvironment
     *    原版 512×512 非 2:1 等距柱状图，反射会被纵向拉伸；改为 1024×512。
     * ==================================================================== */
    window.createStudioEnvironment = function createStudioEnvironment() {
        if (typeof envMapTexture !== 'undefined' && envMapTexture) return envMapTexture;
        try {
            const W = 1024, H = 512;
            const [cv, ctx] = makeCanvas(W, H);

            // 暗调文人雅室基底：顶部微亮、地平线最暗、地面泛暖
            const base = ctx.createLinearGradient(0, 0, 0, H);
            base.addColorStop(0.00, '#22333b');
            base.addColorStop(0.42, '#101a21');
            base.addColorStop(0.50, '#070b0f');
            base.addColorStop(0.58, '#0d1216');
            base.addColorStop(1.00, '#1d1812');
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, W, H);

            // 椭圆柔光辅助函数：在等距柱状图上画不被拉扁的柔光斑
            const softBox = (cx, cy, rx, ry, inner, outer) => {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(rx, ry);
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
                g.addColorStop(0, inner);
                g.addColorStop(0.55, outer);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
                ctx.restore();
            };

            // 1) 顶部大型环形柔光箱 —— 在瓷肩形成一条长而柔的高光带
            softBox(512, 62, 330, 78, 'rgba(255,250,236,1.0)', 'rgba(210,232,238,0.42)');

            // 2) 左侧宋式轩窗：暖白天光 + 十字窗格（反射到瓶腹形成"玉窗"倒影）
            const wx = 150, wy = 150, ww = 190, wh = 190;
            const wg = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
            wg.addColorStop(0, 'rgba(255,244,222,0.98)');
            wg.addColorStop(1, 'rgba(255,226,186,0.86)');
            ctx.fillStyle = wg;
            ctx.fillRect(wx, wy, ww, wh);
            ctx.fillStyle = '#0a0f13';                       // 窗棂
            for (let i = 1; i < 4; i++) {
                ctx.fillRect(wx + (ww / 4) * i - 3, wy, 6, wh);
                ctx.fillRect(wx, wy + (wh / 4) * i - 3, ww, 6);
            }
            ctx.strokeStyle = '#0a0f13'; ctx.lineWidth = 9; ctx.strokeRect(wx, wy, ww, wh);
            softBox(wx + ww / 2, wy + wh / 2, 230, 200, 'rgba(255,230,190,0.30)', 'rgba(255,214,160,0.10)');

            // 3) 右侧天青色长条辅光窗 —— 勾勒瓷器右缘冷色轮廓
            const sg = ctx.createLinearGradient(0, 0, 70, 0);
            sg.addColorStop(0, 'rgba(150,215,228,0.0)');
            sg.addColorStop(0.5, 'rgba(176,228,238,0.92)');
            sg.addColorStop(1, 'rgba(150,215,228,0.0)');
            ctx.fillStyle = sg;
            ctx.fillRect(700, 120, 70, 230);
            softBox(735, 235, 150, 210, 'rgba(140,205,220,0.38)', 'rgba(110,170,185,0.12)');

            // 4) 背后一条极细的暖金轮廓光 —— 瓷器边缘"勾金边"
            const rg = ctx.createLinearGradient(0, 0, 40, 0);
            rg.addColorStop(0, 'rgba(255,214,140,0)');
            rg.addColorStop(0.5, 'rgba(255,224,160,0.85)');
            rg.addColorStop(1, 'rgba(255,214,140,0)');
            ctx.fillStyle = rg;
            ctx.fillRect(950, 150, 40, 170);
            ctx.fillRect(14, 170, 40, 130);

            // 5) 地平线鎏金微反射 + 几案暖色底光
            const gb = ctx.createLinearGradient(0, 270, 0, 340);
            gb.addColorStop(0, 'rgba(197,160,89,0)');
            gb.addColorStop(0.5, 'rgba(197,160,89,0.30)');
            gb.addColorStop(1, 'rgba(197,160,89,0)');
            ctx.fillStyle = gb;
            ctx.fillRect(0, 270, W, 70);
            softBox(512, 470, 420, 70, 'rgba(120,84,48,0.55)', 'rgba(70,48,28,0.18)');

            const tex = new THREE.CanvasTexture(cv);
            tex.mapping = THREE.EquirectangularReflectionMapping;
            tex.minFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
            envMapTexture = tex;
            return envMapTexture;
        } catch (e) {
            console.warn('[three-fx] 环境贴图生成失败，回退无环境光：', e);
            return null;
        }
    };

    /* ======================================================================
     * B. 氛围档案：背景渐变 / 雾 / 曝光 / 光比
     *    关键修复：原版日间背景为米色 (0xF5F2E9) 而地面与雾为深色，
     *    在镜头地平线处形成一刀切的"硬横线"。现统一为同色系渐变 + 地面羽化。
     * ==================================================================== */
    const PROFILES = {
        studio: { // 宋代雨后雅室：暗青墨 + 轩窗暖光
            top: '#2b3d44', mid: '#16232a', bot: '#0b1317', glow: 'rgba(255,214,150,0.16)',
            fog: 0x111c22, fogD: 0.030, exposure: 1.10,
            amb: 0.38, main: 2.05, mainC: 0xfff1da, fill: 0.78, fillC: 0x8fbfcc, rim: 1.55, rimC: 0xffe0b0, spot: 1.15,
            floor: 0x1b262b, floorR: 0.62, floorM: 0.10, ray: 0xffdfb0, rayOp: 0.085, dust: 0xf3dba6
        },
        palace: { // 国家文博殿堂：冷黑 + 聚光
            top: '#162331', mid: '#0a1119', bot: '#04070a', glow: 'rgba(170,215,240,0.14)',
            fog: 0x070b10, fogD: 0.034, exposure: 1.06,
            amb: 0.30, main: 2.30, mainC: 0xf4f9ff, fill: 0.80, fillC: 0x9dc6dc, rim: 1.45, rimC: 0xe8f4ff, spot: 1.45,
            floor: 0x0a0d11, floorR: 0.20, floorM: 0.30, ray: 0xbfe0ff, rayOp: 0.065, dust: 0xcfe6f2
        },
        kiln: { // 御窑幽室：赤砖 + 窑火
            top: '#2e120a', mid: '#190a06', bot: '#080302', glow: 'rgba(255,120,50,0.22)',
            fog: 0x140704, fogD: 0.040, exposure: 1.02,
            amb: 0.26, main: 2.35, mainC: 0xff7a35, fill: 0.95, fillC: 0xc43816, rim: 1.45, rimC: 0xffa834, spot: 0.9,
            floor: 0x1a0906, floorR: 0.86, floorM: 0.05, ray: 0xff8a40, rayOp: 0.050, dust: 0xffa050
        },
        candle: { // 宫廷夜宴烛火
            top: '#2c1a0d', mid: '#150c05', bot: '#070402', glow: 'rgba(255,170,80,0.22)',
            fog: 0x120a05, fogD: 0.038, exposure: 1.05,
            amb: 0.30, main: 2.05, mainC: 0xffb258, fill: 0.70, fillC: 0x8a4c28, rim: 1.35, rimC: 0xff8c26, spot: 0.8,
            floor: 0x160c06, floorR: 0.70, floorM: 0.06, ray: 0xffb060, rayOp: 0.06, dust: 0xffc070
        },
        hall: { // 九柜大展厅
            top: '#1a2833', mid: '#0c141b', bot: '#05080b', glow: 'rgba(200,220,235,0.10)',
            fog: 0x090f14, fogD: 0.020, exposure: 1.12,
            amb: 0.46, main: 1.7, mainC: 0xf4f9ff, fill: 0.9, fillC: 0x9dc6dc, rim: 1.0, rimC: 0xe8f4ff, spot: 1.2,
            floor: 0x0b1015, floorR: 0.16, floorM: 0.38, ray: 0xbfe0ff, rayOp: 0.0, dust: 0xcfe6f2
        }
    };
    const bgCache = {};
    function gradientBackground(key) {
        if (bgCache[key]) return bgCache[key];
        const p = PROFILES[key];
        const [cv, ctx] = makeCanvas(8, 512);
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0.00, p.top);
        g.addColorStop(0.52, p.mid);
        g.addColorStop(1.00, p.bot);
        ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 512);
        const tex = new THREE.CanvasTexture(cv);
        tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
        bgCache[key] = tex;
        return tex;
    }

    FX.exposureTarget = 1.1;
    FX.applyEnv = function applyEnv(key) {
        const p = PROFILES[key] || PROFILES.studio;
        FX.env = key;
        if (!scene || !renderer) return;

        scene.background = gradientBackground(PROFILES[key] ? key : 'studio');
        if (!scene.fog) scene.fog = new THREE.FogExp2(p.fog, p.fogD);
        scene.fog.color.setHex(p.fog);
        scene.fog.density = p.fogD;
        FX.exposureTarget = p.exposure;

        // 光比重塑：降低环境填充光 → 提升明暗反差，勾出"玉质"体积
        if (ambientLight) ambientLight.intensity = p.amb;
        if (lightMain) { lightMain.color.setHex(p.mainC); lightMain.intensity = p.main; }
        if (lightFill) { lightFill.color.setHex(p.fillC); lightFill.intensity = p.fill; }
        if (lightRim) { lightRim.color.setHex(p.rimC); lightRim.intensity = p.rim; }
        if (topSpotLight) topSpotLight.intensity = p.spot;

        if (roomFloorMesh && roomFloorMesh.material) {
            const m = roomFloorMesh.material;
            m.color.setHex(p.floor); m.roughness = p.floorR; m.metalness = p.floorM;
            m.envMapIntensity = key === 'palace' ? 1.0 : 0.55;
            m.needsUpdate = true;
        }
        if (FX.rays) {
            FX.rays.userData.baseOp = p.rayOp;
            FX.rays.children.forEach(m => m.material.color.setHex(p.ray));
        }
        if (particleSystem && particleSystem.material) particleSystem.material.color.setHex(p.dust);
        const st = document.getElementById('three-stage-container');
        if (st) st.dataset.env = key;
        FX.syncVisibility();
    };

    FX.syncVisibility = function () {
        const hall = typeof exhibitionMode !== 'undefined' && exhibitionMode === 'hall';
        const roomOn = typeof showRealisticScene !== 'undefined' ? showRealisticScene : true;
        if (FX.rays) FX.rays.visible = !hall && roomOn && (FX.env === 'studio' || FX.env === 'palace' || FX.env === 'kiln' || FX.env === 'candle');
        if (FX.smoke) FX.smoke.visible = !hall && roomOn && FX.env === 'studio';
        if (FX.shadows) FX.shadows.forEach(s => { s.visible = !hall; });
    };

    /* ======================================================================
     * C. 接触阴影（Contact Shadow）—— 足底与几案之间的柔和闭塞暗部
     * ==================================================================== */
    function makeContactShadowTexture() {
        const [cv, ctx] = makeCanvas(256, 256);
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0.00, 'rgba(0,0,0,0.82)');
        g.addColorStop(0.28, 'rgba(0,0,0,0.58)');
        g.addColorStop(0.60, 'rgba(0,0,0,0.20)');
        g.addColorStop(1.00, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(cv);
        t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
        return t;
    }
    function makeShadowMesh(tex) {
        const m = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9, fog: false })
        );
        m.rotation.x = -Math.PI / 2;
        m.renderOrder = 2;
        return m;
    }

    /** 每帧：让接触阴影跟随器物位置，随展台浮升淡出 */
    function updateContactShadows() {
        if (!FX.shadows) return;
        const targets = [currentGroup, (typeof compareRightGroup !== 'undefined') ? compareRightGroup : null];
        FX.shadows.forEach((sm, i) => {
            const g = targets[i];
            if (!g || !g.visible || !sm.parent) { sm.visible = false; return; }
            if (sm.userData.gid !== g.uuid) {          // 器物更换 → 重算足印
                sm.userData.gid = g.uuid;
                const b = new THREE.Box3().setFromObject(g);
                const size = b.getSize(new THREE.Vector3());
                const span = Math.max(size.x, size.z);
                sm.userData.size = clamp(span * 1.05, 0.95, 2.1);
            }
            const lift = (g === currentGroup && typeof vesselLiftCurrentY !== 'undefined') ? vesselLiftCurrentY : 0;
            const sz = sm.userData.size * (1 + lift * 0.4);
            sm.scale.set(sz, sz, 1);
            sm.position.set(g.position.x, TABLE_SURFACE_Y + 0.004, g.position.z);
            sm.material.opacity = clamp(0.92 - lift * 1.4, 0.2, 0.92);
            sm.visible = (exhibitionMode !== 'hall');
        });
    }

    /* ======================================================================
     * D. 轩窗丁达尔体积光 (God Rays)
     * ==================================================================== */
    function makeRayTexture() {
        const [cv, ctx] = makeCanvas(128, 512);
        const h = ctx.createLinearGradient(0, 0, 128, 0);
        h.addColorStop(0.0, 'rgba(255,255,255,0)');
        h.addColorStop(0.5, 'rgba(255,255,255,1)');
        h.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = h; ctx.fillRect(0, 0, 128, 512);
        ctx.globalCompositeOperation = 'destination-in';
        const v = ctx.createLinearGradient(0, 0, 0, 512);
        v.addColorStop(0.0, 'rgba(0,0,0,1)');
        v.addColorStop(0.55, 'rgba(0,0,0,0.45)');
        v.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = v; ctx.fillRect(0, 0, 128, 512);
        const t = new THREE.CanvasTexture(cv);
        t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
        return t;
    }
    function buildGodRays() {
        const grp = new THREE.Group();
        grp.name = 'FX_GodRays';
        const tex = makeRayTexture();
        // 4 道光束：宽度/朝向/相位各异，避免"贴片感"
        const specs = [
            { x: -2.6, y: 2.2, z: -1.2, w: 1.5, h: 7.0, ry: 0.55, rz: -0.52, ph: 0.0 },
            { x: -3.3, y: 2.0, z: -0.2, w: 0.9, h: 7.5, ry: 0.80, rz: -0.55, ph: 1.7 },
            { x: -1.7, y: 2.6, z: -2.1, w: 1.1, h: 7.0, ry: 0.35, rz: -0.48, ph: 3.1 },
            { x: -2.9, y: 2.4, z: 0.9,  w: 0.7, h: 6.5, ry: 1.00, rz: -0.58, ph: 4.4 }
        ];
        specs.forEach(s => {
            const m = new THREE.Mesh(
                new THREE.PlaneGeometry(s.w, s.h),
                new THREE.MeshBasicMaterial({
                    map: tex, color: 0xffdfb0, transparent: true, opacity: 0.0,
                    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false
                })
            );
            m.position.set(s.x, s.y, s.z);
            m.rotation.set(0, s.ry, s.rz, 'YXZ');
            m.userData = { ph: s.ph, w: s.w };
            m.renderOrder = 3;
            grp.add(m);
        });
        grp.userData.baseOp = 0.085;
        return grp;
    }

    /* ======================================================================
     * E. 悬浮微尘 (柔焦圆点 + 随机漂移) 与 博山炉青烟
     * ==================================================================== */
    function makeSpriteTexture(soft) {
        const [cv, ctx] = makeCanvas(64, 64);
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0.0, 'rgba(255,255,255,1)');
        g.addColorStop(soft, 'rgba(255,255,255,0.55)');
        g.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
        const t = new THREE.CanvasTexture(cv);
        t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
        return t;
    }

    function buildDust() {
        if (particleSystem) {                       // 移除旧版 120 个方形硬点
            scene.remove(particleSystem);
            if (particleSystem.geometry) particleSystem.geometry.dispose();
            if (particleSystem.material) particleSystem.material.dispose();
        }
        const N = IS_TOUCH ? 110 : 200;
        const pos = new Float32Array(N * 3);
        const base = new Float32Array(N * 3);
        const seed = new Float32Array(N * 3);
        const rand = rng(20261031);
        for (let i = 0; i < N; i++) {
            const r = 0.5 + Math.pow(rand(), 0.7) * 3.6;
            const a = rand() * TAU;
            base[i * 3] = Math.cos(a) * r;
            base[i * 3 + 1] = -1.2 + rand() * 4.2;
            base[i * 3 + 2] = Math.sin(a) * r;
            seed[i * 3] = rand() * TAU; seed[i * 3 + 1] = 0.012 + rand() * 0.03; seed[i * 3 + 2] = 0.4 + rand() * 0.9;
        }
        pos.set(base);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.userData = { base, seed };
        const mat = new THREE.PointsMaterial({
            color: 0xf3dba6, size: 0.052, map: makeSpriteTexture(0.25), transparent: true, opacity: 0.55,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false
        });
        particleSystem = new THREE.Points(geo, mat);
        particleSystem.frustumCulled = false;
        scene.add(particleSystem);
    }
    function updateDust(dt) {
        if (!particleSystem || REDUCED) return;
        const ud = particleSystem.geometry && particleSystem.geometry.userData;
        if (!ud || !ud.seed || !ud.base) return;
        const { base, seed } = ud;
        const pos = particleSystem.geometry.attributes.position;
        if (!pos) return;
        const t = FX.t, H = 4.4, y0 = -1.2;
        for (let i = 0; i < pos.count; i++) {
            const k = i * 3, ph = seed[k], vy = seed[k + 1], amp = seed[k + 2];
            const y = ((base[k + 1] - y0 + t * vy) % H + H) % H + y0;
            pos.setXYZ(i,
                base[k] + Math.sin(t * 0.21 * amp + ph) * 0.22,
                y,
                base[k + 2] + Math.cos(t * 0.17 * amp + ph * 1.3) * 0.22);
        }
        pos.needsUpdate = true;
        particleSystem.rotation.y += 0.015 * dt;
        // 微尘随光束"呼吸"明灭
        particleSystem.material.opacity = 0.42 + Math.sin(t * 0.7) * 0.1;
    }

    function buildSmoke() {
        const N = 46;
        const pos = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const age = new Float32Array(N), sd = new Float32Array(N);
        const rand = rng(77);
        for (let i = 0; i < N; i++) { age[i] = i / N; sd[i] = rand() * TAU; }
        geo.userData = { age, sd };
        const mat = new THREE.PointsMaterial({
            size: 0.30, map: makeSpriteTexture(0.1), vertexColors: true, transparent: true, opacity: 1,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false
        });
        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;
        pts.name = 'FX_IncenseSmoke';
        pts.userData.origin = null;
        return pts;
    }
    function updateSmoke(dt) {
        const s = FX.smoke;
        if (!s || !s.visible) return;
        if (!s.userData.origin) {                   // 博山炉 GLB 异步载入后，取其炉口位置
            if (typeof roomCenserMesh === 'undefined' || !roomCenserMesh) return;
            const b = new THREE.Box3().setFromObject(roomCenserMesh);
            if (!isFinite(b.max.y)) return;
            const c = b.getCenter(new THREE.Vector3());
            s.userData.origin = new THREE.Vector3(c.x, b.max.y - 0.02, c.z);
        }
        const o = s.userData.origin;
        const ud = s.geometry && s.geometry.userData;
        if (!ud || !ud.age || !ud.sd) return;
        const { age, sd } = ud;
        const pos = s.geometry.attributes.position, col = s.geometry.attributes.color;
        if (!pos || !col) return;
        const RISE = 1.25, LIFE = 6.0;
        for (let i = 0; i < pos.count; i++) {
            age[i] += dt / LIFE;
            if (age[i] > 1) age[i] -= 1;
            const a = age[i];
            const sway = Math.sin(a * 7.0 + sd[i] + FX.t * 0.6) * (0.015 + a * 0.16);
            const sway2 = Math.cos(a * 5.5 + sd[i] * 1.7 + FX.t * 0.45) * (0.012 + a * 0.13);
            pos.setXYZ(i, o.x + sway, o.y + a * RISE, o.z + sway2);
            const f = Math.pow(Math.sin(a * Math.PI), 1.35) * 0.20;  // 先显后隐
            col.setXYZ(i, 0.80 * f, 0.88 * f, 0.92 * f);
        }
        pos.needsUpdate = true; col.needsUpdate = true;
    }

    /* ======================================================================
     * F. 程序化「千里江山」泥金青绿六曲屏风
     *    原屏风 GLB 仅 3.7KB（纯色平板），在深色背景里呈两块深棕色板片。
     * ==================================================================== */
    function paintQianliJiangshan(W, H) {
        const [cv, ctx] = makeCanvas(W, H);
        const rand = rng(1113);

        // 1. 暗绢底（青黑 → 墨绿）+ 绢丝纹
        const silk = ctx.createLinearGradient(0, 0, 0, H);
        silk.addColorStop(0, '#102a30'); silk.addColorStop(0.55, '#0d2025'); silk.addColorStop(1, '#091418');
        ctx.fillStyle = silk; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.05; ctx.strokeStyle = '#9fd0d8';
        for (let y = 0; y < H; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.globalAlpha = 1;

        // 2. 泥金云气（流动金色带，在山峦之间穿插）
        const cloud = (y, amp, a) => {
            const g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
            g.addColorStop(0, 'rgba(214,177,106,0)');
            g.addColorStop(0.5, `rgba(226,190,120,${a})`);
            g.addColorStop(1, 'rgba(214,177,106,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(0, y - 60);
            for (let x = 0; x <= W; x += 24) ctx.lineTo(x, y - 40 + Math.sin(x * 0.006 + y) * amp);
            for (let x = W; x >= 0; x -= 24) ctx.lineTo(x, y + 40 + Math.sin(x * 0.005 + y * 2) * amp);
            ctx.closePath(); ctx.fill();
        };

        // 3. 日轮（月金色光晕）
        const sx = W * 0.72, sy = H * 0.26;
        const sun = ctx.createRadialGradient(sx, sy, 10, sx, sy, 260);
        sun.addColorStop(0, 'rgba(255,230,170,0.95)'); sun.addColorStop(0.18, 'rgba(240,200,130,0.55)');
        sun.addColorStop(1, 'rgba(240,200,130,0)');
        ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);

        // 4. 远 → 近 五层山峦：青金石蓝 → 孔雀石绿，山脊泥金勾线
        const layers = [
            { base: 0.50, amp: 0.13, c1: '#2f6a7a', c2: '#1d4a58', a: 0.55, line: 0.30 },
            { base: 0.60, amp: 0.16, c1: '#2b7f86', c2: '#1a5760', a: 0.70, line: 0.35 },
            { base: 0.71, amp: 0.15, c1: '#2f8a78', c2: '#1a5a50', a: 0.82, line: 0.40 },
            { base: 0.82, amp: 0.12, c1: '#256f62', c2: '#123f3a', a: 0.92, line: 0.45 },
            { base: 0.92, amp: 0.08, c1: '#1c5048', c2: '#0b2a27', a: 1.00, line: 0.50 }
        ];
        layers.forEach((L, li) => {
            const f = [rand() * 9, rand() * 9, rand() * 9];
            const ridge = (x) => {
                const n = x / W;
                return H * (L.base - L.amp * (
                    0.55 * Math.abs(Math.sin(n * 5.2 + f[0])) +
                    0.30 * Math.abs(Math.sin(n * 11.7 + f[1])) +
                    0.15 * Math.abs(Math.sin(n * 23.3 + f[2])) - 0.35));
            };
            const g = ctx.createLinearGradient(0, H * (L.base - L.amp), 0, H);
            g.addColorStop(0, L.c1); g.addColorStop(1, L.c2);
            ctx.globalAlpha = L.a; ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(0, H);
            for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridge(x));
            ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = L.line; ctx.strokeStyle = '#e3c27c'; ctx.lineWidth = 2.4;
            ctx.beginPath();
            for (let x = 0; x <= W; x += 8) { const y = ridge(x); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
            ctx.stroke(); ctx.globalAlpha = 1;
            if (li < layers.length - 1) cloud(H * (L.base + 0.05), 14, 0.16);
            // 青绿石色点苔
            ctx.fillStyle = li % 2 ? 'rgba(120,200,170,0.35)' : 'rgba(90,170,200,0.32)';
            for (let k = 0; k < 140; k++) {
                const x = rand() * W, y = ridge(x) + rand() * H * 0.1 + 6;
                ctx.fillRect(x, y, 2 + rand() * 4, 1.5 + rand() * 2.5);
            }
        });

        // 5. 近景松影
        ctx.fillStyle = '#071816';
        for (let k = 0; k < 16; k++) {
            const x = rand() * W, y = H * (0.88 + rand() * 0.08), s = 26 + rand() * 40;
            for (let j = 0; j < 4; j++) {
                ctx.beginPath(); ctx.moveTo(x, y - j * s * 0.5);
                ctx.lineTo(x - s * (1 - j * 0.18), y - j * s * 0.5 + s * 0.5);
                ctx.lineTo(x + s * (1 - j * 0.18), y - j * s * 0.5 + s * 0.5); ctx.fill();
            }
            ctx.fillRect(x - 3, y + s * 0.4, 6, s * 0.9);
        }

        // 6. 泥金碎箔
        for (let k = 0; k < 900; k++) {
            ctx.fillStyle = `rgba(235,200,130,${0.05 + rand() * 0.22})`;
            ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 3, 1 + rand() * 3);
        }
        // 7. 天际暗角，令屏风中部更沉静、不与前景瓷器争夺视线
        const vg = ctx.createRadialGradient(W / 2, H * 0.62, H * 0.15, W / 2, H * 0.62, H * 0.95);
        vg.addColorStop(0, 'rgba(3,8,10,0.62)'); vg.addColorStop(1, 'rgba(2,5,7,0.74)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

        // 8. 题款与朱印（竖排）
        ctx.save();
        ctx.fillStyle = 'rgba(232,198,126,0.82)';
        ctx.font = `600 ${Math.round(H * 0.045)}px "Noto Serif SC","Songti SC","STSong",serif`;
        ctx.textAlign = 'center';
        '千里江山'.split('').forEach((ch, i) => ctx.fillText(ch, W * 0.085, H * (0.15 + i * 0.062)));
        ctx.restore();
        ctx.fillStyle = '#a8322d';
        ctx.fillRect(W * 0.07, H * 0.42, 38, 38);
        ctx.fillStyle = '#f6e3b8';
        ctx.font = '600 24px "Noto Serif SC","Songti SC",serif'; ctx.textAlign = 'center';
        ctx.fillText('瓷', W * 0.07 + 19, H * 0.42 + 28);
        return cv;
    }

    function buildFoldingScreen() {
        const grp = new THREE.Group();
        grp.name = 'FX_FoldingScreen';
        const PANELS = 5, PW = 1.06, PH = 3.5, A = 0.30;       // 曲折角 ≈ 17°
        const tex = new THREE.CanvasTexture(paintQianliJiangshan(2560, 1760));
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.minFilter = THREE.LinearMipmapLinearFilter;

        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1d0e09, roughness: 0.5, metalness: 0.10 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a25c, roughness: 0.34, metalness: 0.85 });
        const paintMat = new THREE.MeshStandardMaterial({
            map: tex, roughness: 0.78, metalness: 0.0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.10
        });

        // 折页铰点坐标（锯齿形）
        const hinge = [];
        for (let k = 0; k <= PANELS; k++) hinge.push({ x: (k - PANELS / 2) * PW * Math.cos(A), z: (k % 2) * -PW * Math.sin(A) });

        for (let i = 0; i < PANELS; i++) {
            const h0 = hinge[i], h1 = hinge[i + 1];
            const panel = new THREE.Group();
            panel.position.set((h0.x + h1.x) / 2, 0, (h0.z + h1.z) / 2);
            panel.rotation.y = -Math.atan2(h1.z - h0.z, h1.x - h0.x);

            const geo = new THREE.PlaneGeometry(PW - 0.12, PH - 0.14);
            const uv = geo.attributes.uv;                       // 画心跨六曲连续
            for (let v = 0; v < uv.count; v++) uv.setX(v, (i + uv.getX(v)) / PANELS);
            const paint = new THREE.Mesh(geo, paintMat);
            paint.position.set(0, PH / 2, 0.012);
            paint.receiveShadow = true;
            panel.add(paint);

            // 紫檀边框 + 金线
            const bars = [
                [PW, 0.08, 0.05, 0, 0.04],               // 下框
                [PW, 0.08, 0.05, 0, PH - 0.04],          // 上框
                [0.07, PH, 0.05, -PW / 2 + 0.035, PH / 2],
                [0.07, PH, 0.05, PW / 2 - 0.035, PH / 2]
            ];
            bars.forEach(b => {
                const m = new THREE.Mesh(new THREE.BoxGeometry(b[0], b[1], b[2]), frameMat);
                m.position.set(b[3], b[4], 0); m.castShadow = true; m.receiveShadow = true; panel.add(m);
            });
            const gl = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.14, 0.012, 0.01), goldMat);
            gl.position.set(0, PH - 0.095, 0.02); panel.add(gl);
            const gl2 = gl.clone(); gl2.position.y = 0.095; panel.add(gl2);
            grp.add(panel);
        }
        return grp;
    }

    /* ======================================================================
     * G. 相机导演：帧率无关阻尼 + 大跨度运镜 + 开场推镜 + 拖拽惯性
     * ==================================================================== */
    const cam = {
        lastPos: null, lastLook: null, tween: null,
        spinVel: 0, lastSpinX: 0, intro: true
    };
    function d3(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }

    function updateCamera(dt, nowMs) {
        const pT = camPosTarget, lT = camLookTarget;
        if (!cam.lastPos) { cam.lastPos = { ...pT }; cam.lastLook = { ...lT }; }

        // 检测「大跨度」目标跳变（切换模式 / 九柜聚焦 / 视角预设）→ 启动缓动运镜
        const jump = d3(pT, cam.lastPos) > 0.55 || d3(lT, cam.lastLook) > 0.45;
        if (jump && !REDUCED) {
            const dist = Math.max(d3(pT, camera.position), d3(lT, camLookCurrent));
            cam.tween = {
                t0: nowMs, dur: clamp(0.85 + dist * 0.16, 0.9, 1.8) * 1000,
                fp: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
                fl: { x: camLookCurrent.x, y: camLookCurrent.y, z: camLookCurrent.z },
                lift: Math.min(0.45, dist * 0.05)
            };
        }
        cam.lastPos = { ...pT }; cam.lastLook = { ...lT };

        if (cam.tween) {
            const tw = cam.tween;
            const p = clamp((nowMs - tw.t0) / tw.dur, 0, 1);
            const e = easeInOutQuart(p);
            camera.position.x = lerp(tw.fp.x, pT.x, e);
            camera.position.y = lerp(tw.fp.y, pT.y, e) + Math.sin(Math.PI * e) * tw.lift;   // 弧线微抬升
            camera.position.z = lerp(tw.fp.z, pT.z, e);
            camLookCurrent.x = lerp(tw.fl.x, lT.x, easeInOutQuart(clamp(p * 1.08, 0, 1)));
            camLookCurrent.y = lerp(tw.fl.y, lT.y, easeInOutQuart(clamp(p * 1.08, 0, 1)));
            camLookCurrent.z = lerp(tw.fl.z, lT.z, easeInOutQuart(clamp(p * 1.08, 0, 1)));
            if (p >= 1) cam.tween = null;
        } else {
            // 小幅变化（滚轮缩放、微调）使用阻尼，手感更跟手
            const k = 7.0;
            camera.position.x = damp(camera.position.x, pT.x, k, dt);
            camera.position.y = damp(camera.position.y, pT.y, k, dt);
            camera.position.z = damp(camera.position.z, pT.z, k, dt);
            camLookCurrent.x = damp(camLookCurrent.x, lT.x, k, dt);
            camLookCurrent.y = damp(camLookCurrent.y, lT.y, k, dt);
            camLookCurrent.z = damp(camLookCurrent.z, lT.z, k, dt);
        }

        // 静止时的"呼吸"：极轻微的视点漂移，令画面不死板
        let bx = 0, by = 0;
        if (!REDUCED && !isUserDragging && exhibitionMode !== 'hall') {
            bx = Math.sin(FX.t * 0.35) * 0.012; by = Math.sin(FX.t * 0.27 + 1.2) * 0.008;
        }
        camera.lookAt(camLookCurrent.x + bx, camLookCurrent.y + by, camLookCurrent.z);
    }

    // 拖拽惯性：监听指针速度，松手后继续缓慢旋转并衰减
    function installInertia() {
        window.addEventListener('pointermove', (e) => {
            if (!isUserDragging || exhibitionMode === 'hall') return;
            const dx = e.clientX - cam.lastSpinX;
            cam.lastSpinX = e.clientX;
            if (Math.abs(dx) < 60) cam.spinVel = lerp(cam.spinVel, dx * 0.0085 * 60, 0.35);  // rad/s
        }, { passive: true });
        window.addEventListener('pointerdown', (e) => { cam.lastSpinX = e.clientX; cam.spinVel = 0; }, { passive: true });
        // 原版缺少 pointercancel 处理：移动端系统手势打断后会一直"卡在拖拽中"
        window.addEventListener('pointercancel', () => { isUserDragging = false; }, { passive: true });
    }

    /* ======================================================================
     * I. 视口自适应：竖屏 FOV 补偿 / ResizeObserver / 动态像素比
     * ==================================================================== */
    function fovFor(aspect) {
        // 横屏 48°；越窄越大（竖屏手机上让器物完整入镜）
        return clamp(48 + Math.max(0, 1.25 - aspect) * 30, 48, 66);
    }
    let _lw = 0, _lh = 0;
    window.handleThreeResize = function handleThreeResize() {
        const canvas = document.getElementById('three-canvas');
        if (!canvas || !renderer || !camera) return;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h || (w === _lw && h === _lh)) return;
        _lw = w; _lh = h;
        camera.aspect = w / h;
        camera.fov = fovFor(camera.aspect);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);   // false：不写入内联 px 尺寸，交给 CSS，杜绝移动端地址栏伸缩造成的抖动
    };

    // 动态分辨率：持续掉帧时逐级降低像素比，保证文物细节与流畅度的平衡
    const perf = { acc: 0, n: 0, dpr: 0, min: 1 };
    function adaptiveQuality(dt) {
        perf.acc += dt; perf.n++;
        if (perf.acc < 2.0) return;
        const avg = perf.acc / perf.n;
        perf.acc = 0; perf.n = 0;
        const cur = renderer.getPixelRatio();
        if (avg > 0.030 && cur > perf.min + 0.01) {
            renderer.setPixelRatio(Math.max(perf.min, cur - 0.25));
            _lw = 0; window.handleThreeResize();
        } else if (avg < 0.0185 && cur < perf.dpr - 0.01) {
            renderer.setPixelRatio(Math.min(perf.dpr, cur + 0.25));
            _lw = 0; window.handleThreeResize();
        }
    }

    /* ======================================================================
     * H. 瓷器材质升级：Standard → Physical 双层清漆
     *    three-scene.js 中对 GLB 材质设置 clearcoat 对 MeshStandardMaterial 无效
     *    (GLTFLoader 默认产出 Standard)，因此"清漆玉质"实际从未生效。
     * ==================================================================== */
    function toPhysical(m) {
        if (!m || m.isMeshPhysicalMaterial || !m.isMeshStandardMaterial) return m;
        if (m.metalness > 0.5) return m;                           // 金属件（金扣、鎏金）保持原样
        const p = new THREE.MeshPhysicalMaterial({
            name: m.name, color: m.color.clone(),
            map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, metalnessMap: m.metalnessMap,
            aoMap: m.aoMap, aoMapIntensity: m.aoMapIntensity, emissive: m.emissive.clone(), emissiveMap: m.emissiveMap,
            emissiveIntensity: m.emissiveIntensity, roughness: m.roughness, metalness: m.metalness,
            envMap: m.envMap || envMapTexture, envMapIntensity: m.envMapIntensity,
            side: m.side, wireframe: m.wireframe, transparent: m.transparent, opacity: m.opacity,
            alphaMap: m.alphaMap, alphaTest: m.alphaTest, vertexColors: m.vertexColors,
            clippingPlanes: m.clippingPlanes, clipShadows: m.clipShadows
        });
        if (m.normalScale) p.normalScale.copy(m.normalScale);
        p.shadowSide = m.shadowSide;
        p.userData = m.userData;
        return p;
    }
    const GLAZE_LOOK = { clearcoat: 1.0, clearcoatRoughness: 0.035, envMapIntensity: 1.35 };
    FX.polish = function polish(group) {
        if (!group) return group;
        const maxA = Math.min(4, renderer && renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 4);
        group.traverse((o) => {
            if (!o.isMesh || !o.material || o.material.isMeshBasicMaterial) return;
            const apply = (m) => {
                const pm = toPhysical(m);
                if (pm.isMeshPhysicalMaterial && pm.metalness < 0.5) {
                    pm.clearcoat = Math.max(pm.clearcoat || 0, GLAZE_LOOK.clearcoat);
                    pm.clearcoatRoughness = Math.min(pm.clearcoatRoughness || GLAZE_LOOK.clearcoatRoughness, GLAZE_LOOK.clearcoatRoughness);
                    pm.envMapIntensity = Math.max(pm.envMapIntensity || 0, GLAZE_LOOK.envMapIntensity);
                    if (!pm.envMap) pm.envMap = envMapTexture;
                }
                ['map', 'normalMap', 'roughnessMap', 'aoMap', 'bumpMap'].forEach(k => {
                    if (pm[k] && pm[k].anisotropy !== maxA) { pm[k].anisotropy = maxA; pm[k].needsUpdate = true; }
                });
                if (pm !== m) pm.needsUpdate = true;
                return pm;
            };
            o.material = Array.isArray(o.material) ? o.material.map(apply) : apply(o.material);
        });
        return group;
    };

    /* ======================================================================
     * J. 热点标签外向排布 + 声学共振示波器
     * ==================================================================== */
    window.updateHotspotsScreenProjection = function updateHotspotsScreenProjection() {
        if (!showHotspots || exhibitionMode === 'hall' || !currentGroup || !camera) return;
        const canvas = document.getElementById('three-canvas');
        if (!canvas) return;
        const m = porcelainModelsData[currentModelIndex];
        if (!m || !m.hotspots) return;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        const bOffset = (currentGroup.userData && currentGroup.userData.bottomOffset !== undefined) ? currentGroup.userData.bottomOffset : 0;
        // 器物中轴线的屏幕 x，用来判断标签应向左还是向右"外挂"
        const c = new THREE.Vector3(0, 0, 0); currentGroup.localToWorld(c); c.project(camera);
        const cx = (c.x * 0.5 + 0.5) * w;
        const v = new THREE.Vector3();
        m.hotspots.forEach((spot, i) => {
            const el = document.getElementById(`vessel-hotspot-${i}`);
            if (!el) return;
            v.set(spot.pos[0], spot.pos[1] - bOffset, spot.pos[2]);
            currentGroup.localToWorld(v); v.project(camera);
            const sx = (v.x * 0.5 + 0.5) * w, sy = (-(v.y * 0.5) + 0.5) * h;
            if (v.z < 1.0 && sx > 20 && sx < w - 20 && sy > 56 && sy < h - 70) {
                el.style.left = `${sx.toFixed(1)}px`; el.style.top = `${sy.toFixed(1)}px`;
                // 永远向远离器身的一侧外挂（不压瓶身）；该侧放不下（窄屏）则收成纯光点，点按/悬停展开文字
                const left = sx < cx;
                const bw = el.offsetWidth || 120;
                const fits = left ? (sx - bw + 12 > 6) : (sx - 12 + bw < w - 6);
                const compact = !fits;
                if (el.classList.contains('hs-left') !== left) { el.classList.toggle('hs-left', left); el.classList.toggle('hs-right', !left); }
                if (el.classList.contains('hs-compact') !== compact) el.classList.toggle('hs-compact', compact);
                el.style.opacity = '1';
            } else {
                el.style.opacity = '0';
            }
        });
    };

    window.strike3DVesselSound = function strike3DVesselSound() {
        const m = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
        const freq = m.acousticFreq || 2420;
        if (typeof playPorcelainChime === 'function') playPorcelainChime(freq);
        vesselVibration = 1.0;

        const waveCanvas = document.getElementById('vessel-acoustic-canvas');
        if (waveCanvas) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const cssW = waveCanvas.clientWidth || waveCanvas.width, cssH = waveCanvas.clientHeight || waveCanvas.height;
            if (waveCanvas.width !== Math.round(cssW * dpr)) { waveCanvas.width = Math.round(cssW * dpr); waveCanvas.height = Math.round(cssH * dpr); }
            const ctx = waveCanvas.getContext('2d');
            const t0 = performance.now();
            if (acousticAnimId) cancelAnimationFrame(acousticAnimId);
            const f1 = clamp(freq / 380, 4, 12);                 // 视觉基频（不等于真实频率，仅作示意）
            (function draw() {
                const t = (performance.now() - t0) / 1000;
                const w = waveCanvas.width, h = waveCanvas.height, mid = h / 2;
                ctx.clearRect(0, 0, w, h);
                // 刻度网格
                ctx.strokeStyle = 'rgba(139,194,206,0.10)'; ctx.lineWidth = 1 * dpr;
                for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo((w / 8) * i, 0); ctx.lineTo((w / 8) * i, h); ctx.stroke(); }
                ctx.strokeStyle = 'rgba(139,194,206,0.22)';
                ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
                // 三个谐波，衰减速率不同：高次谐波先消失，余音留基频，近似真实磬音
                const e1 = Math.exp(-t * 2.4), e2 = Math.exp(-t * 4.6) * 0.55, e3 = Math.exp(-t * 7.5) * 0.32;
                const grad = ctx.createLinearGradient(0, 0, w, 0);
                grad.addColorStop(0, '#8fd0dc'); grad.addColorStop(0.5, '#E5C888'); grad.addColorStop(1, '#8fd0dc');
                ctx.strokeStyle = grad; ctx.lineWidth = 2 * dpr; ctx.lineJoin = 'round';
                ctx.shadowColor = 'rgba(229,200,136,0.75)'; ctx.shadowBlur = 8 * dpr;
                ctx.beginPath();
                for (let x = 0; x <= w; x += 2) {
                    const n = x / w, win = Math.pow(Math.sin(n * Math.PI), 0.8);
                    const ph = n * Math.PI * 2 * f1 - t * 38;
                    const y = mid + (Math.sin(ph) * e1 + Math.sin(ph * 2.01 + 0.6) * e2 + Math.sin(ph * 3.02 + 1.1) * e3) * h * 0.30 * win;
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke(); ctx.shadowBlur = 0;
                if (e1 > 0.015) acousticAnimId = requestAnimationFrame(draw);
            })();
        }
        if (typeof showToast === 'function') showToast(`🔔 叩击【${m.name}】· 共振基频 ${freq} Hz，声如清磬！`);
    };

    /* ======================================================================
     * 瓷器建模：程序化占位器型提高细分，避免加载期出现棱角
     * ==================================================================== */
    const _origLathe = window.createSmoothVesselLathe;
    window.createSmoothVesselLathe = function createSmoothVesselLathe(outerPts, RadialModFn, radialSegments) {
        const seg = Math.max(radialSegments || 64, 128);
        const fullPts = [...outerPts];
        const wall = 0.038;
        for (let i = outerPts.length - 2; i >= 1; i--) {
            const pt = outerPts[i];
            fullPts.push(new THREE.Vector2(Math.max(0.02, pt.x - wall * (1 + (1 - i / outerPts.length) * 0.45)), pt.y + 0.02));
        }
        fullPts.push(new THREE.Vector2(0.0, outerPts[0].y + 0.05));
        // CatmullRom 样条比 SplineCurve 更贴合控制点，并将采样提高到 180 点
        const spline = new THREE.SplineCurve(fullPts);
        const geo = new THREE.LatheGeometry(spline.getPoints(180), seg);
        if (typeof RadialModFn === 'function') {
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                const f = RadialModFn(Math.atan2(z, x), y, Math.hypot(x, z));
                pos.setX(i, x * f); pos.setZ(i, z * f);
            }
        }
        geo.computeVertexNormals();
        return geo;
    };


    /* ======================================================================
     * K. 性能层 (v7.1)：加载 / 切换提速
     *  1) 后台串行预取其余 7 件国宝（一次只占 1 路，且让位于用户点选的优先任务）
     *  2) 预取完成后在空闲时把纹理预上传 GPU，首次切换不再卡顿
     *  3) disposeGroup 不再释放「缓存共享」几何体 / 材质 → 切回器物无需重传、无需重编译着色器
     *  4) 展厅：已建成且数据未变化时不再整厅重建；展厅内器物关闭投影
     *  5) loadPorcelainModel 去重：模型加载完成时原逻辑会连续重建 2 次
     *  6) 接触阴影足印按器型缓存，避免每次切换对高模做 Box3 全顶点遍历
     * ==================================================================== */
    const keepGeo = new WeakSet();
    function registerCachedGeometries() {
        [masterTreasuresCache, scannedModelCache].forEach((cache) => {
            Object.keys(cache).forEach((k) => {
                const sc = cache[k];
                if (!sc || sc.userData.__fxReg) return;
                sc.userData.__fxReg = true;
                sc.traverse((o) => { if (o.isMesh && o.geometry) keepGeo.add(o.geometry); });
            });
        });
    }
    window.disposeGroup = function disposeGroup(grp) {
        if (!grp) return;
        registerCachedGeometries();
        grp.traverse((child) => {
            if (!child.isMesh) return;
            // 几何体：缓存共享的保留（重复 dispose 会让下次渲染再次上传整套顶点缓冲）
            if (child.geometry && !keepGeo.has(child.geometry)) child.geometry.dispose();
            // 材质：不立即 dispose —— 立刻释放会令着色器程序引用计数归零，下一件器物要重新编译（单次可卡 100~300ms）
        });
    };

    const _buildHall = window.buildVirtualMuseumHall;
    let hallSig = '';
    window.buildVirtualMuseumHall = function buildVirtualMuseumHall() {
        const sig = Object.keys(masterTreasuresCache).length + '|' + Object.keys(scannedModelCache).length;
        if (hallGroup && sig === hallSig) {                 // 数据未变：复用已建成的展厅
            hallGroup.visible = (exhibitionMode === 'hall');
            if (hallGroup.parent !== scene) scene.add(hallGroup);
            return;
        }
        hallSig = sig;
        const r = _buildHall.apply(this, arguments);
        if (hallGroup) hallGroup.traverse((o) => { if (o.isMesh) o.castShadow = false; });   // 九器同屏不投影：省一整个阴影 Pass
        return r;
    };

    // 连续重复调用去重（模型下载完成时，原逻辑会先后触发两次重建）
    const _loadModel2 = window.loadPorcelainModel;
    let lastLoad = { idx: -1, keep: false, t: 0 };
    window.loadPorcelainModel = function loadPorcelainModel(index, keepMode) {
        const now = performance.now();
        if (keepMode === true && index === lastLoad.idx && lastLoad.keep === true && now - lastLoad.t < 80 && currentGroup) return;
        lastLoad = { idx: index, keep: keepMode === true, t: now };
        return _loadModel2.apply(this, arguments);
    };

    // 后台串行预取
    const conn = navigator.connection || {};
    const slowNet = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
    function nextToPrefetch() {
        const n = Object.keys(masterTreasuresMeta).length;
        for (let d = 1; d < n; d++) {                         // 以当前器物为中心，向两侧由近及远
            for (const idx of [(currentModelIndex + d) % n, (currentModelIndex - d + n) % n]) {
                if (!masterTreasuresCache[idx] && !masterTreasuresLoading[idx]) return idx;
            }
        }
        return -1;
    }
    FX.prefetchTick = function () {
        if (slowNet || document.hidden) return;
        if (!masterTreasuresCache[0] && !masterTreasuresCache[currentModelIndex]) return;   // 首件未就绪，先不抢带宽
        if (activeLoadingCount > 0 || modelTaskQueue.length > 0) return;
        const idx = nextToPrefetch();
        if (idx < 0) { clearInterval(FX._pf); FX._pf = null; return; }
        loadSingleMasterTreasure(idx, () => warmTextures(idx), false);
    };
    function warmTextures(idx) {
        const sc = masterTreasuresCache[idx];
        if (!sc || !renderer || !renderer.initTexture) return;
        const texs = [];
        sc.traverse((o) => {
            if (!o.isMesh || !o.material) return;
            (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
                ['map', 'normalMap', 'roughnessMap', 'aoMap'].forEach((k) => { if (m[k] && texs.indexOf(m[k]) < 0) texs.push(m[k]); });
            });
        });
        const maxA = renderer.capabilities.getMaxAnisotropy();
        const idle = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 8 }), 60));
        (function step() {
            const tx = texs.shift();
            if (!tx) return;
            idle(() => { try { tx.anisotropy = maxA; renderer.initTexture(tx); } catch (_) { } step(); });   // 每次空闲只传 1 张，避免掉帧
        })();
    }
    FX.warmTextures = warmTextures;

    // 接触阴影足印缓存（覆盖 C 节逐次 Box3 全顶点遍历）
    const footprint = {};
    updateContactShadows = function () {
        if (!FX.shadows) return;
        const idxs = [currentModelIndex, (typeof compareRightModelIndex !== 'undefined') ? compareRightModelIndex : -1];
        const targets = [currentGroup, (typeof compareRightGroup !== 'undefined') ? compareRightGroup : null];
        FX.shadows.forEach((sm, i) => {
            const g = targets[i];
            if (!g || !g.visible || !sm.parent || exhibitionMode === 'hall') { sm.visible = false; return; }
            if (sm.userData.gid !== g.uuid) {
                sm.userData.gid = g.uuid;
                if (footprint[idxs[i]] === undefined) {
                    const b = new THREE.Box3().setFromObject(g);
                    const sz = b.getSize(new THREE.Vector3());
                    footprint[idxs[i]] = clamp(Math.max(sz.x, sz.z) * 1.05, 0.95, 2.1);
                }
                sm.userData.size = footprint[idxs[i]];
            }
            const lift = (g === currentGroup && typeof vesselLiftCurrentY !== 'undefined') ? vesselLiftCurrentY : 0;
            const sz = sm.userData.size * (1 + lift * 0.4);
            sm.scale.set(sz, sz, 1);
            sm.position.set(g.position.x, TABLE_SURFACE_Y + 0.004, g.position.z);
            sm.material.opacity = clamp(0.92 - lift * 1.4, 0.2, 0.92);
            sm.visible = true;
        });
    };

    /* ======================================================================
     * 函数包装：不改动原函数，只在其前后追加视觉处理
     * ==================================================================== */
    const _buildGeometry = window.buildGeometry;
    window.buildGeometry = function buildGeometry(typeIndex, customGlaze) {
        return FX.polish(_buildGeometry.call(this, typeIndex, customGlaze));
    };

    const _switchEnv = window.switchRealisticSceneEnv;
    window.switchRealisticSceneEnv = function switchRealisticSceneEnv(envKey, showNotice) {
        const r = _switchEnv.apply(this, arguments);
        FX.applyEnv(envKey);
        return r;
    };

    const _setStudioLighting = window.setStudioLighting;
    window.setStudioLighting = function setStudioLighting(preset) {
        const r = _setStudioLighting.apply(this, arguments);
        if (preset === 'candle') FX.applyEnv('candle');
        return r;
    };

    const _switchMode = window.switchExhibitionMode;
    window.switchExhibitionMode = function switchExhibitionMode(mode) {
        const r = _switchMode.apply(this, arguments);
        FX.applyEnv(mode === 'hall' ? 'hall' : (currentRoomEnv || 'studio'));
        FX.syncVisibility();
        return r;
    };

    const _loadModel = window.loadPorcelainModel;
    window.loadPorcelainModel = function loadPorcelainModel() {
        const r = _loadModel.apply(this, arguments);
        FX.popAt = performance.now();                 // 新器物落座：轻微"落定"动效
        return r;
    };

    const _init = window.initThreeJS;
    window.initThreeJS = function initThreeJS() {
        // 在原初始化之前就绪的部分：环境贴图在 createStudioEnvironment 内已被替换
        const r = _init.apply(this, arguments);
        try { FX.boot(); } catch (e) { console.warn('[three-fx] boot 失败，已回退原版画面：', e); }
        return r;
    };

    /* ======================================================================
     * 启动：渲染器参数 / 阴影 / 光源 / 场景附加物
     * ==================================================================== */
    FX.boot = function boot() {
        if (!scene || !renderer || !camera || FX.ready) return;

        // —— 渲染器 ——
        perf.dpr = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 2 : 2.5);
        perf.min = 1;
        renderer.setPixelRatio(perf.dpr);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // —— 主光阴影：2048 贴图 + 收紧视锥 → 阴影边缘更细腻、足底接地更实 ——
        if (lightMain) {
            const s = lightMain.shadow;
            s.mapSize.set(1024, 1024);
            const sc = s.camera;
            sc.left = -2.4; sc.right = 2.4; sc.top = 2.8; sc.bottom = -2.2; sc.near = 2; sc.far = 14;
            sc.updateProjectionMatrix();
            s.bias = -0.00012; s.normalBias = 0.022;
            if (s.map) { s.map.dispose(); s.map = null; }
        }

        // —— 地面羽化：圆形 + 径向 alphaMap，边缘融入背景渐变，彻底消除地平线硬切 ——
        if (roomFloorMesh) {
            const [fc, fx] = makeCanvas(256, 256);
            const fg = fx.createRadialGradient(128, 128, 20, 128, 128, 128);
            fg.addColorStop(0.0, '#fff'); fg.addColorStop(0.45, '#cfcfcf'); fg.addColorStop(1.0, '#000');
            fx.fillStyle = fg; fx.fillRect(0, 0, 256, 256);
            roomFloorMesh.geometry.dispose();
            roomFloorMesh.geometry = new THREE.CircleGeometry(7.5, 72);
            roomFloorMesh.material.alphaMap = new THREE.CanvasTexture(fc);
            roomFloorMesh.material.transparent = true;
            roomFloorMesh.material.needsUpdate = true;
            roomFloorMesh.renderOrder = -1;
        }

        // —— 接触阴影（左器 / 右器各一枚） ——
        const sTex = makeContactShadowTexture();
        FX.shadows = [makeShadowMesh(sTex), makeShadowMesh(sTex)];
        FX.shadows.forEach(s => scene.add(s));

        // —— 丁达尔光 / 微尘 / 青烟 ——
        FX.rays = buildGodRays(); scene.add(FX.rays);
        buildDust();
        FX.smoke = buildSmoke(); scene.add(FX.smoke);

        // —— 泥金山水屏风（替换原平板屏风） ——
        try {
            FX.screen = buildFoldingScreen();
            FX.screen.position.set(0, TABLE_SURFACE_Y - 0.783, -2.15);
            if (typeof roomStudioGroup !== 'undefined' && roomStudioGroup) roomStudioGroup.add(FX.screen);
            else scene.add(FX.screen);
        } catch (e) { console.warn('[three-fx] 屏风生成失败：', e); }

        // —— 取消对 GLTF 屏风的依赖：载入后隐藏 ——
        FX.hideOldScreen = () => {
            if (typeof roomScreenMesh !== 'undefined' && roomScreenMesh && roomScreenMesh.visible) { roomScreenMesh.visible = false; }
        };

        installInertia();
        if ('ResizeObserver' in window) {
            const host = document.getElementById('three-stage-container');
            if (host) new ResizeObserver(() => window.handleThreeResize()).observe(host);
        }

        // —— 开场推镜：从远处缓缓推入展台 ——
        _lw = 0; window.handleThreeResize();
        if (!REDUCED) {
            camera.position.set(0.9, 1.7, 6.4);
            cam.lastPos = { ...camPosTarget }; cam.lastLook = { ...camLookTarget };
            cam.tween = {
                t0: performance.now() + 60, dur: 850,
                fp: { x: 0.35, y: 1.25, z: 4.4 }, fl: { ...camLookCurrent }, lift: 0.08
            };
        }

        FX.ready = true;
        FX.applyEnv(currentRoomEnv || 'studio');
        // 彻底根绝首屏网络风暴与标签页无限转圈：推迟至页面完全加载稳定后，在系统空闲时单线程低频拉取
        setTimeout(() => {
            const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1000));
            idle(() => {
                if (!FX._pf) FX._pf = setInterval(FX.prefetchTick, 2800);
            });
        }, 4000);
    };

    /* ======================================================================
     * 主循环：替换 animate（逻辑等价，全面改为 dt 驱动，高刷屏/低帧率速度一致）
     * ==================================================================== */
    let lastNow = performance.now();
    window.animate = function animate(now) {
        if (!isCanvasVisible) { lastNow = performance.now(); return; }
        requestAnimationFrame(animate);
        now = now || performance.now();
        const dt = clamp((now - lastNow) / 1000, 0.001, 0.05);
        lastNow = now; FX.t += dt;

        // 曝光平滑过渡（切换氛围时不"闪"）
        renderer.toneMappingExposure = damp(renderer.toneMappingExposure, FX.exposureTarget, 2.2, dt);

        updateCamera(dt, now);

        if (currentGroup && exhibitionMode !== 'hall') {
            if (autoRotate && !isBottomInspectionMode) {
                const w = 0.33 * dt;                                    // 原 0.0055 rad/帧 @60fps = 0.33 rad/s
                currentGroup.rotation.y += w;
                if (exhibitionMode === 'comparison' && compareRightGroup) compareRightGroup.rotation.y += w;
            } else if (!isUserDragging && Math.abs(cam.spinVel) > 0.01) {
                currentGroup.rotation.y += cam.spinVel * dt;            // 拖拽惯性
                cam.spinVel *= Math.exp(-dt * 3.2);
            }
            vesselTiltCurrentX = damp(vesselTiltCurrentX, vesselTiltTargetX, 5.0, dt);
            vesselLiftCurrentY = damp(vesselLiftCurrentY, vesselLiftTargetY, 5.0, dt);
            currentGroup.rotation.x = vesselTiltCurrentX;
            currentGroup.position.y = -1.125 + vesselLiftCurrentY;

            // 叩击微震：衰减正弦，x 位移 + 微小绕 z 轴颤动（瓷体"嗡鸣"）
            if (vesselVibration > 0.01) {
                const s = Math.sin(now * 0.075) * vesselVibration;
                currentGroup.position.x = s * 0.011;
                currentGroup.rotation.z = Math.sin(now * 0.062 + 1.3) * vesselVibration * 0.004;
                vesselVibration *= Math.exp(-dt * 5.8);
            } else {
                currentGroup.position.x = 0; currentGroup.rotation.z = 0;
            }

            // 器物"落定"弹性缩放
            if (FX.popAt) {
                const p = clamp((now - FX.popAt) / 650, 0, 1);
                const sc = p >= 1 ? 1 : 0.94 + 0.06 * easeOutBack(p);
                if (currentGroup.userData.fxScaled !== false || p < 1) currentGroup.scale.setScalar(sc);
                if (p >= 1) FX.popAt = 0;
            }
        }

        if (hallGroup && exhibitionMode === 'hall') {
            hallGroup.children.forEach(child => {
                if (child.userData && child.userData.vitrineIndex !== undefined) {
                    const vGroup = child.children[child.children.length - 1];
                    if (vGroup) vGroup.rotation.y += 0.36 * dt;
                    // 当前展柜的光锥更亮，形成视觉焦点
                    const beam = child.children.find(c => c.geometry && c.geometry.type === 'ConeGeometry');
                    if (beam) {
                        const on = child.userData.vitrineIndex === currentModelIndex;
                        beam.material.opacity = damp(beam.material.opacity, on ? 0.12 : 0.035, 4, dt);
                        beam.material.color.setHex(on ? 0xe5c888 : 0x8fb8c0);
                    }
                }
            });
        }

        // 氛围元素
        if (FX.ready) {
            FX.hideOldScreen && FX.hideOldScreen();
            updateContactShadows();
            updateDust(dt);
            updateSmoke(dt);
            if (FX.rays && FX.rays.visible) {
                const base = FX.rays.userData.baseOp || 0.08;
                FX.rays.children.forEach((m, i) => {
                    const br = 0.72 + 0.28 * Math.sin(FX.t * 0.55 + m.userData.ph) + 0.08 * Math.sin(FX.t * 1.7 + i);
                    m.material.opacity = base * clamp(br, 0.3, 1.1);
                    m.position.x += Math.sin(FX.t * 0.12 + m.userData.ph) * 0.0006;
                });
            }
            adaptiveQuality(dt);
        }

        updateHotspotsScreenProjection();
        renderer.render(scene, camera);
    };
})();
