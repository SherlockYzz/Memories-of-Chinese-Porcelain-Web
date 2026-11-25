/**
 * 模块：首屏器物 (hero-vessel)
 * 在首屏展台里实时渲染一件器物（content/site.json 的 hero.featuredVesselId），缓慢自转，
 * 右上角用同一渲染器的第二个视口画“开片微距”。
 *
 * 降级：无 WebGL / 低配 / 省流量 / 减少动效时只显示预览图，并提供“加载实时 3D”按钮；
 * 模型加载失败同样回退到预览图。离开视口、页面隐藏、弹窗打开时暂停渲染。
 */
/* global THREE */
import { defineModule, data, i18n, html, setHTML, prefersReducedMotion, glaze, fetchGlbBuffer, $ } from '@core';

const pick = (obj) => (obj && (obj[i18n.currentLang()] || obj.zh)) || '';

let stage, canvas, renderer, scene, camera, macroCamera, pivot, envTarget;
let rafId = 0;
let running = false;
let visible = true;
let pausedByModal = false;
let dragging = false;
let lastX = 0;
let spin = 0;
let velocity = 0;
let lastTime = 0;
let resizeObserver = null;
let viewObserver = null;
let vesselHeight = 2.2;
let vesselRadius = 0.6;

function isLowEnd() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    return saveData || cores <= 2 || mem <= 2;
}

function webglAvailable() {
    // 零上下文开销检查，具体 WebGL 上下文创建失败由 start3D() 的 try/catch 兜底回退预览图
    return typeof THREE !== 'undefined' && typeof WebGLRenderingContext !== 'undefined';
}

function setState(state, text) {
    if (!stage) return;
    stage.setAttribute('data-state', state);
    const label = $('[data-hero-loader-text]', stage);
    if (label && text) label.textContent = text;
    const enable = $('[data-hero-enable]', stage);
    if (enable) enable.hidden = state !== 'poster';
}

function renderStats() {
    const host = $('[data-hero-stats]');
    if (!host) return;
    const stats = data.get('site').hero.stats;
    setHTML(host, html`${stats.map((s) => html`<div class="hero__stat"><dt>${s.value}</dt><dd>${pick(s.label)}<small>${pick(s.note)}</small></dd></div>`)}`);
}

/** 构建预模糊柔光立方体环境贴图（无需 PMREMGenerator 同步卷积，耗时 < 0.2ms）。 */
function buildEnvironment() {
    envTarget = glaze.createStudioCubeEnv();
    return envTarget;
}

function upgradeMaterial(mat, mesh, optics = {}) {
    if (!mat) return mat;
    let target = mat;
    if (mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) {
        const physical = new THREE.MeshPhysicalMaterial();
        THREE.MeshStandardMaterial.prototype.copy.call(physical, mat);
        mat.dispose();
        target = physical;
    }
    if (!target.isMeshStandardMaterial) return target;
    const isClay = /foot|clay/i.test(target.name || '');
    target.metalness = 0.0;
    target.clearcoat = isClay ? 0.08 : 0.92;
    target.clearcoatRoughness = 0.09;
    target.envMapIntensity = 0.9;
    if (!isClay && !target.normalMap) {
        target.normalMap = glaze.getOrangePeelNormalMap();
        target.normalScale = new THREE.Vector2(0.18, 0.18);
    }
    if (!isClay && mesh && mesh.geometry) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        const bb = mesh.geometry.boundingBox;
        glaze.enhancePorcelainMaterial(target, optics, {
            minY: bb ? bb.min.y : 0,
            height: bb ? Math.max(0.05, bb.max.y - bb.min.y) : 0.23
        });
    }
    return target;
}

function fitVessel(root) {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const scale = vesselHeight / Math.max(size.y, 1e-6);
    root.scale.setScalar(scale);
    const scaled = new THREE.Box3().setFromObject(root);
    const center = scaled.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= scaled.min.y;
    vesselRadius = Math.max(size.x, size.z) * scale * 0.5;
}

function resize() {
    if (!renderer || !stage) return;
    const w = Math.max(1, stage.clientWidth);
    const h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 竖构图时把镜头拉远一点，保证整件器物入画
    const dist = camera.aspect < 0.9 ? 6.6 : 5.6;
    camera.position.set(0, vesselHeight * 0.58, dist);
    camera.lookAt(0, vesselHeight * 0.5, 0);
    camera.updateProjectionMatrix();
    if (!running) renderFrame();
}

function renderFrame() {
    if (!renderer) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    renderer.render(scene, camera);

    // 第二视口：开片微距。位置与大小取自 .hero__macro 元素，CSS 改了这里自动跟随。
    const macroEl = $('[data-hero-macro]', stage);
    if (!macroEl) return;
    const size = macroEl.offsetWidth;
    if (size < 24) return;
    const x = macroEl.offsetLeft;
    const y = h - macroEl.offsetTop - size;
    renderer.setScissorTest(true);
    renderer.setScissor(x, y, size, size);
    renderer.setViewport(x, y, size, size);
    renderer.render(scene, macroCamera);
    renderer.setScissorTest(false);
}

function tick(now) {
    rafId = 0;
    if (!running) return;
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
    lastTime = now;
    if (!dragging) {
        velocity += (0.22 - velocity) * Math.min(1, dt * 1.5); // 回到匀速自转
        spin += velocity * dt;
    }
    pivot.rotation.y = spin;
    renderFrame();
    rafId = requestAnimationFrame(tick);
}

function syncLoop() {
    const should = !!renderer && visible && !pausedByModal && !document.hidden && !prefersReducedMotion() && !document.documentElement.hasAttribute('data-reduce-motion');
    if (should && !running) {
        running = true;
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
    } else if (!should && running) {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
    }
    if (!should && renderer) renderFrame();
}

function start3D(ctx) {
    if (renderer || !canvas) return;
    if (!webglAvailable()) {
        setState('fallback');
        return;
    }
    const vessel = data.byId('vessels', data.get('site').hero.featuredVesselId);
    if (!vessel || !vessel.model || !THREE.GLTFLoader) {
        setState('fallback');
        return;
    }
    setState('loading', i18n.tr('正在载入器物模型…'));
    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isLowEnd(), powerPreference: 'high-performance' });
    } catch {
        renderer = null;
        setState('fallback');
        return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, (window.innerWidth < 768 || isLowEnd()) ? 1.35 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;

    scene = new THREE.Scene();
    scene.environment = buildEnvironment();
    camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    macroCamera = new THREE.PerspectiveCamera(16, 1, 0.05, 20);
    pivot = new THREE.Group();
    scene.add(pivot);

    scene.add(new THREE.HemisphereLight(0xdfeef2, 0x1a1410, 0.55));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.25);
    key.position.set(3.2, 5.5, 4.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfe3ec, 0.7);
    rim.position.set(-4, 3, -4.5);
    scene.add(rim);

    // 展台：一片柔和的接触阴影，让器物“坐”在台面上
    const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.6, 48),
        new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: 'varying vec2 vUv; void main(){ float d = distance(vUv, vec2(0.5)) * 2.0; float a = smoothstep(1.0, 0.15, d) * 0.55; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }'
        })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    scene.add(shadow);

    const loader = new THREE.GLTFLoader();
    const loadHeroGlb = (retriesLeft) => {
        const onParsed = (gltf) => {
            if (!renderer) return; // 加载途中模块被销毁
            const root = gltf.scene;
            const glazeEntry = data.byId('glazes', vessel.defaultGlaze || 'tianqing') || {};
            const optics = glazeEntry.optics || {};
            root.traverse((o) => {
                if (o.isMesh) {
                    o.material = Array.isArray(o.material)
                        ? o.material.map((m) => upgradeMaterial(m, o, optics))
                        : upgradeMaterial(o.material, o, optics);
                }
            });
            fitVessel(root);
            pivot.add(root);
            // 微距镜头：对准器腹偏上的釉面，从侧前方近距离取景
            macroCamera.position.set(vesselRadius * 0.55, vesselHeight * 0.44, vesselRadius + 1.35);
            macroCamera.lookAt(vesselRadius * 0.2, vesselHeight * 0.42, 0);
            resize();
            setState('ready');
            notifyHeroReady('ready');
            syncLoop();
        };
        const onFail = () => {
            if (retriesLeft > 0 && renderer) {
                setTimeout(() => loadHeroGlb(retriesLeft - 1), 600);
                return;
            }
            teardown3D();
            setState('fallback');
            notifyHeroReady('fallback');
        };
        fetchGlbBuffer(vessel.model.path)
            .then((buf) => loader.parse(buf.slice(0), '', onParsed, onFail))
            .catch(onFail);
    };
    loadHeroGlb(1);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    viewObserver = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        syncLoop();
    }, { threshold: 0.05 });
    viewObserver.observe(stage);

    // 横向拖动旋转；竖向滑动留给页面滚动（canvas 的 touch-action: pan-y）。
    ctx.listen(canvas, 'pointerdown', (e) => {
        dragging = true;
        lastX = e.clientX;
        canvas.setPointerCapture(e.pointerId);
    });
    ctx.listen(canvas, 'pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        spin += dx * 0.009;
        velocity = dx * 0.5;
        if (!running) {
            pivot.rotation.y = spin;
            renderFrame();
        }
    });
    const end = () => (dragging = false);
    ctx.listen(canvas, 'pointerup', end);
    ctx.listen(canvas, 'pointercancel', end);
}

function teardown3D() {
    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (resizeObserver) resizeObserver.disconnect();
    if (viewObserver) viewObserver.disconnect();
    resizeObserver = viewObserver = null;
    if (scene) {
        scene.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
            mats.forEach((m) => {
                ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'clearcoatNormalMap'].forEach((k) => m[k] && m[k].dispose());
                m.dispose();
            });
        });
    }
    if (envTarget) envTarget.dispose();
    if (renderer) {
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
    }
    renderer = scene = camera = macroCamera = pivot = envTarget = null;
}

let moduleCtx = null;
let heroReadyEmitted = false;
function notifyHeroReady(stateName) {
    if (heroReadyEmitted) return;
    heroReadyEmitted = true;
    if (moduleCtx && moduleCtx.bus) moduleCtx.bus.emit('hero:ready', { state: stateName });
}

export default defineModule({
    id: 'hero-vessel',
    phase: 1,
    init(ctx) {
        moduleCtx = ctx;
        stage = $('[data-hero-stage]');
        canvas = stage && $('[data-hero-canvas]', stage);
        renderStats();
        if (!stage) return;
        ctx.subscribe('modal:opened', () => {
            pausedByModal = true;
            syncLoop();
        });
        ctx.subscribe('modal:closed', () => {
            pausedByModal = false;
            syncLoop();
        });
        ctx.subscribe('a11y:changed', syncLoop);
        ctx.listen(document, 'visibilitychange', syncLoop);

        if (!webglAvailable()) {
            setState('fallback');
            notifyHeroReady('fallback');
        } else if (isLowEnd() || prefersReducedMotion()) {
            setState('poster'); // 先给图，3D 由用户决定是否加载
            notifyHeroReady('poster');
        } else {
            // 双 rAF 确保浏览器先把首屏文本与 LCP 预览图提交给合成器完成首绘，再挂载 WebGL 器物
            requestAnimationFrame(() => requestAnimationFrame(() => { if (moduleCtx) start3D(moduleCtx); }));
        }
    },
    destroy() {
        teardown3D();
        stage = canvas = moduleCtx = null;
    },
    onLangChange: renderStats,
    actions: {
        enableHero3D: () => moduleCtx && start3D(moduleCtx)
    },
    api: { state: () => (stage ? stage.getAttribute('data-state') : 'none') }
});
