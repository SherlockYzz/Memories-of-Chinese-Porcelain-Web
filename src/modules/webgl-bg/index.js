/**
 * 华夏器道 · 天青泥火 — WebGL 东方美学三维意境背景引擎 (Three.js r128+)
 * 模块定位：固定底层氛围画布 (#webgl-ambient-bg)，与前景文博内容和谐共生
 * 核心层次：
 * 1. GLSL 流体千里江山波纹曲面：自定义顶点波形调制 + 天青/青绿/鎏金等高线光晕渐变 + 点击水墨脉冲波
 * 2. 北宋浑天璇玑三维光环系统：3 组不同倾角与转速的精细轨道配二十八宿发光星节点
 * 3. 景深浮金玉屑粒子场：AdditiveBlending 柔和散景粒子，随深度呼吸闪烁与交互微涌
 * 4. 完整性能分级 (high/medium/low)、45 帧滑窗动态降级、上下文丢失恢复与降级兼容
 */


/* global THREE */
import { defineModule, data, store, storage, KEYS, lazy, legacy } from '@core';
import {
    MOUNTAIN_VERTEX_SHADER, MOUNTAIN_FRAGMENT_SHADER, RING_VERTEX_SHADER, RING_FRAGMENT_SHADER,
    STAR_VERTEX_SHADER, STAR_FRAGMENT_SHADER, PARTICLE_VERTEX_SHADER, PARTICLE_FRAGMENT_SHADER
} from './shaders.js';

const RESIZE_DEBOUNCE_MS = 150;
const FPS_WINDOW_SIZE = 45;
const LOW_FPS_THRESHOLD = 24;
const MAX_PARTICLE_CAPACITY = 850;

// 三档设备分级（粒子数、网格密度、像素比上限、目标帧率）同样来自 content/scene.json
const TIERS = data.get('scene').background.tiers;

// 可调参数全部来自 content/scene.json（对比度增益、滚动联动幅度、各板块的氛围差异）
const CFG = data.get('scene').background;
const lerp = (a, b, k) => a + (b - a) * k;

// 运行时核心状态
const state = {
    initialized: false,
    webglAvailable: false,
    fallbackActive: false,
    enabled: true,
    reducedMotion: false,
    contextLost: false,

    // 暂停源细分，避免弹窗或全屏结束时误覆盖用户手动关闭状态
    hiddenPaused: false,
    modalOpenCount: 0,
    fullscreenPaused: false,
    externalPaused: false,

    // 设备分级与动态降级指标
    initialTier: 'high',
    tier: 'high',
    effectiveFps: 60,
    downgrades: 0,
    currentFps: 60,
    avgFrameMs: 16.7,

    // 主题与交互状态
    theme: 'light',
    themeMix: 0,
    targetThemeMix: 0,
    mouseX: 0,
    mouseY: 0,
    smoothMouseX: 0,
    smoothMouseY: 0,
    scrollProgress: 0,
    targetScrollProgress: 0,

    // 当前板块的氛围参数（由 section:changed 事件驱动，逐帧平滑过渡）
    sectionIndex: 0,
    section: { warm: 0, armillary: 1, mountains: 1, cameraX: 0, spin: 0 },
    sectionTarget: { warm: 0, armillary: 1, mountains: 1, cameraX: 0, spin: 0 },

    // 视口与渲染状态
    width: 0,
    height: 0,
    dpr: 1,
    rafId: null,
    lastLoopTime: 0,
    lastRenderTime: 0,
    elapsedTime: 0,
    frameWindow: [],
    downgradeCooldownUntil: 0,

    // 脉冲状态与自动律动计时器
    pulseOriginX: 0.5,
    pulseOriginY: 0.5,
    pulseTime: -10.0,
    pulseStrength: 0.0,
    nextAutoPulseAt: 0.65
};

// Three.js 与 DOM 对象引用
let canvas = null;
let renderer = null;
let scene = null;
let camera = null;
let mountainMesh = null;
let mountainMaterial = null;
let armillaryGroup = null;
let armillaryRings = [];
let armillaryMaterials = [];
let particlePoints = null;
let particleGeometry = null;
let particleMaterial = null;
let sharedUniforms = null;

// 监听器与定时器引用
let resizeTimer = null;
let themeObserver = null;
let reducedMotionQuery = null;
let busCleanups = [];
let appContext = {};
let themedBlendMaterials = [];
let domCleanups = [];

/* ==========================================================================
   工具函数：环境探测、存储读写、状态同步
   ========================================================================== */

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function readMotionPreference() {
    return storage.getRaw(KEYS.bgMotion) !== 'false';
}

function syncStoreBgEnabled(enabled) {
    store.set('bgEnabled', !!enabled); // store 负责持久化
}

function detectThemeFromDom() {
    const attr = document.documentElement.getAttribute('data-theme');
    return attr === 'dark' ? 'dark' : 'light';
}

/**
 * 基于硬件核心数、设备内存、视口宽度与省流标志判定三档性能等级
 * @returns {'high'|'medium'|'low'}
 */
function classifyDeviceTier() {
    const vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    const vh = window.innerHeight || document.documentElement.clientHeight || 720;
    const isTouch = (navigator.maxTouchPoints || 0) > 0;
    const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
    const mem = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4;
    const saveData = !!(navigator.connection && navigator.connection.saveData);

    if (saveData || vw < 768 || (isTouch && Math.min(vw, vh) < 900) || cores <= 2 || mem <= 2 || (cores <= 4 && mem <= 4)) {
        return 'low';
    }
    if (vw < 1024 || cores <= 6 || mem <= 4) {
        return 'medium';
    }
    return 'high';
}

function getTierConfig(tierName) {
    return TIERS[tierName] || TIERS.medium;
}

function isAnyPaused() {
    return !!(
        !state.enabled ||
        state.hiddenPaused ||
        state.modalOpenCount > 0 ||
        state.fullscreenPaused ||
        state.externalPaused ||
        state.contextLost
    );
}

function getPauseReasons() {
    const reasons = [];
    if (!state.enabled) reasons.push('disabled');
    if (state.hiddenPaused) reasons.push('document_hidden');
    if (state.modalOpenCount > 0) reasons.push('modal_open');
    if (state.fullscreenPaused) reasons.push('stage_fullscreen');
    if (state.externalPaused) reasons.push('external_pause');
    if (state.contextLost) reasons.push('webgl_context_lost');
    if (state.reducedMotion) reasons.push('prefers_reduced_motion');
    return reasons;
}

function checkWebGLSupport() {
    return typeof THREE !== 'undefined' && typeof WebGLRenderingContext !== 'undefined';
}


/* ==========================================================================
   3D 场景构建与资源释放
   ========================================================================== */

function createMountainMesh(segX, segZ) {
    const geometry = new THREE.PlaneGeometry(60, 34, segX, segZ);
    if (!mountainMaterial) {
        mountainMaterial = new THREE.ShaderMaterial({
            vertexShader: MOUNTAIN_VERTEX_SHADER,
            fragmentShader: MOUNTAIN_FRAGMENT_SHADER,
            uniforms: sharedUniforms,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }
    const mesh = new THREE.Mesh(geometry, mountainMaterial);
    mesh.rotation.x = -Math.PI * 0.43;
    mesh.position.set(0, -4.4, -4.2);
    return mesh;
}

function createArmillarySystem(ringSegments) {
    const root = new THREE.Group();
    armillaryRings = [];
    armillaryMaterials = [];

    // 3 个不同倾角与转速的精细环形轨道（赤道环、黄道倾角环、白道子午环）
    const ringSpecs = [
        {
            radius: 4.55,
            tube: 0.021,
            tilt: [0.18, 0.0, -0.10],
            speedY: 0.085,
            speedZ: 0.018,
            phaseOffset: 0.0,
            goldBias: 0.25,
            opacity: 0.34,
            starCount: 10
        },
        {
            radius: 5.25,
            tilt: [0.46, 0.14, 0.31],
            tube: 0.025,
            speedY: -0.064,
            speedZ: -0.022,
            phaseOffset: 2.1,
            goldBias: 0.78,
            opacity: 0.38,
            starCount: 10
        },
        {
            radius: 3.85,
            tube: 0.018,
            tilt: [-0.58, 0.12, 0.68],
            speedY: 0.112,
            speedZ: 0.026,
            phaseOffset: 4.2,
            goldBias: 0.52,
            opacity: 0.30,
            starCount: 8
        }
    ];

    ringSpecs.forEach(function (spec, ringIdx) {
        const pivot = new THREE.Group();
        pivot.rotation.set(spec.tilt[0], spec.tilt[1], spec.tilt[2]);

        const ringUniforms = {
            uTime: sharedUniforms.uTime,
            uThemeMix: sharedUniforms.uThemeMix,
            uScrollProgress: sharedUniforms.uScrollProgress,
            uGainRing: sharedUniforms.uGainRing,
            uWarm: sharedUniforms.uWarm,
            uPhaseOffset: { value: spec.phaseOffset },
            uGoldBias: { value: spec.goldBias },
            uOpacity: { value: spec.opacity }
        };

        const ringMat = new THREE.ShaderMaterial({
            vertexShader: RING_VERTEX_SHADER,
            fragmentShader: RING_FRAGMENT_SHADER,
            uniforms: ringUniforms,
            transparent: true,
            depthWrite: false
        });
        armillaryMaterials.push(ringMat);

        const torusGeo = new THREE.TorusGeometry(spec.radius, spec.tube, 8, ringSegments);
        const torusMesh = new THREE.Mesh(torusGeo, ringMat);
        // TorusGeometry 默认处于 X-Y 平面，旋至赤道 X-Z 平面以呈现天仪立体纵深
        torusMesh.rotation.x = Math.PI * 0.5;
        pivot.add(torusMesh);

        // 内圈细刻线圆环（辅助天文刻度质感）
        const innerPts = [];
        const innerRadius = spec.radius * 0.94;
        for (let i = 0; i < ringSegments; i++) {
            const theta = (i / ringSegments) * Math.PI * 2;
            innerPts.push(Math.cos(theta) * innerRadius, 0, Math.sin(theta) * innerRadius);
        }
        const innerGeo = new THREE.BufferGeometry();
        innerGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerPts, 3));
        const innerLineMat = new THREE.LineBasicMaterial({
            color: spec.goldBias > 0.5 ? 0xd6b16a : 0x7caab4,
            transparent: true,
            opacity: 0.22,
            depthWrite: false
        });
        armillaryMaterials.push(innerLineMat);
        const innerLoop = new THREE.LineLoop(innerGeo, innerLineMat);
        pivot.add(innerLoop);

        // 二十八宿发光星节点 (10 + 10 + 8 = 28 宿)
        const starCount = spec.starCount;
        const starPos = new Float32Array(starCount * 3);
        const starPhase = new Float32Array(starCount);
        const starSize = new Float32Array(starCount);
        const starKind = new Float32Array(starCount);

        for (let s = 0; s < starCount; s++) {
            const angle = (s / starCount) * Math.PI * 2 + ringIdx * 0.37;
            starPos[s * 3] = Math.cos(angle) * spec.radius;
            starPos[s * 3 + 1] = ((s % 2 === 0 ? 1 : -1) * 0.04);
            starPos[s * 3 + 2] = Math.sin(angle) * spec.radius;
            starPhase[s] = s * 0.85 + ringIdx * 1.7;
            // 四象关键主星略大泛鎏金，其余星宿泛天青
            const isMajor = (s % 3 === 0);
            starSize[s] = isMajor ? 1.55 : 1.05;
            starKind[s] = isMajor ? 1.0 : (spec.goldBias > 0.6 ? 0.65 : 0.15);
        }

        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhase, 1));
        starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
        starGeo.setAttribute('aKind', new THREE.BufferAttribute(starKind, 1));

        const starMat = new THREE.ShaderMaterial({
            vertexShader: STAR_VERTEX_SHADER,
            fragmentShader: STAR_FRAGMENT_SHADER,
            uniforms: {
                uTime: sharedUniforms.uTime,
                uThemeMix: sharedUniforms.uThemeMix,
                uGainParticle: sharedUniforms.uGainParticle,
                uPixelRatio: sharedUniforms.uPixelRatio
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        armillaryMaterials.push(starMat);

        const stars = new THREE.Points(starGeo, starMat);
        pivot.add(stars);

        root.add(pivot);
        armillaryRings.push({
            pivot: pivot,
            innerLineMat: innerLineMat,
            goldBias: spec.goldBias,
            speedY: spec.speedY,
            speedZ: spec.speedZ
        });
    });

    updateArmillaryLayout();
    return root;
}

function createParticleField(activeCount) {
    const positions = new Float32Array(MAX_PARTICLE_CAPACITY * 3);
    const phases = new Float32Array(MAX_PARTICLE_CAPACITY);
    const scales = new Float32Array(MAX_PARTICLE_CAPACITY);
    const kinds = new Float32Array(MAX_PARTICLE_CAPACITY);
    const drifts = new Float32Array(MAX_PARTICLE_CAPACITY * 3);

    for (let i = 0; i < MAX_PARTICLE_CAPACITY; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 38;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 2;

        phases[i] = Math.random() * Math.PI * 2;
        scales[i] = 0.55 + Math.random() * 1.15;
        kinds[i] = Math.random();

        drifts[i * 3] = 0.25 + Math.random() * 0.45;
        drifts[i * 3 + 1] = 0.14 + Math.random() * 0.34;
        drifts[i * 3 + 2] = 0.20 + Math.random() * 0.40;
    }

    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    particleGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    particleGeometry.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
    particleGeometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 3));
    particleGeometry.setDrawRange(0, activeCount);

    particleMaterial = new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERTEX_SHADER,
        fragmentShader: PARTICLE_FRAGMENT_SHADER,
        uniforms: sharedUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    return new THREE.Points(particleGeometry, particleMaterial);
}

function updateArmillaryLayout() {
    if (!armillaryGroup) return;
    const w = state.width || window.innerWidth || 1280;
    if (w >= 1024) {
        // 桌面端偏右上方留白构图，避开左侧标题主视区
        armillaryGroup.position.set(4.6, 1.5, -2.6);
        state.armillaryBaseX = 4.6;
        state.armillaryBaseY = 1.5;
        armillaryGroup.scale.setScalar(1.0);
    } else if (w >= 768) {
        armillaryGroup.position.set(2.2, 1.6, -3.6);
        state.armillaryBaseX = 2.2;
        state.armillaryBaseY = 1.6;
        armillaryGroup.scale.setScalar(0.86);
    } else {
        armillaryGroup.position.set(0.0, 2.0, -4.6);
        state.armillaryBaseX = 0.0;
        state.armillaryBaseY = 2.0;
        armillaryGroup.scale.setScalar(0.72);
    }
}

function buildScene() {
    const tierCfg = getTierConfig(state.tier);

    sharedUniforms = {
        uTime: { value: 0 },
        uThemeMix: { value: state.themeMix },
        uScrollProgress: { value: state.scrollProgress },
        uBrightness: { value: 1.0 },
        uGainFill: { value: 1.0 },
        uGainLine: { value: 1.0 },
        uGainRing: { value: 1.0 },
        uGainParticle: { value: 1.0 },
        uWarm: { value: 0.0 },
        uPixelRatio: { value: state.dpr },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(state.width, state.height) },
        uPulseOrigin: { value: new THREE.Vector2(0.5, 0.5) },
        uPulseTime: { value: -10.0 },
        uPulseStrength: { value: 0.0 }
    };

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(46, Math.max(1, state.width) / Math.max(1, state.height), 0.1, 140);
    camera.position.set(0, 3.2, 22.5);
    camera.lookAt(0, -0.4, 0);

    mountainMesh = createMountainMesh(tierCfg.segX, tierCfg.segZ);
    scene.add(mountainMesh);

    armillaryGroup = createArmillarySystem(tierCfg.ringSegments);
    scene.add(armillaryGroup);

    particlePoints = createParticleField(tierCfg.particles);
    scene.add(particlePoints);

    // 叠加混合在浅色底上等于“加白”，粒子与星点会消失；浅色主题改用普通混合。
    themedBlendMaterials = [];
    scene.traverse(function (obj) {
        if (obj.material && obj.material.blending === THREE.AdditiveBlending) themedBlendMaterials.push(obj.material);
    });
    applyBlendingForTheme();
}

function applyBlendingForTheme() {
    const mode = state.theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending;
    themedBlendMaterials.forEach(function (mat) {
        if (mat.blending !== mode) {
            mat.blending = mode;
            mat.needsUpdate = true;
        }
    });
}

/** 把板块参数立即对齐到目标值（静帧模式下没有逐帧过渡）。 */
function snapSectionState() {
    Object.assign(state.section, state.sectionTarget);
    state.scrollProgress = state.targetScrollProgress;
}

function setActiveSection(id, index) {
    const spec = (CFG.sections && CFG.sections[id]) || CFG.sections.hero;
    state.sectionIndex = typeof index === 'number' ? index : 0;
    state.sectionTarget.warm = spec.warm;
    state.sectionTarget.armillary = spec.armillary;
    state.sectionTarget.mountains = spec.mountains;
    state.sectionTarget.cameraX = spec.cameraX;
    state.sectionTarget.spin = state.sectionIndex * CFG.scroll.ringSpinPerSection;
    if (!state.webglAvailable) return;
    if (state.reducedMotion || state.rafId === null) {
        // 减少动效 / 已暂停：不做动画，但换板块时重绘一帧，让背景仍随内容变化。
        snapSectionState();
        if (state.enabled && !state.contextLost && !state.hiddenPaused) {
            stepSimulation(0);
            renderSingleFrame();
        }
    }
}

function rebuildMountainForTier(tierCfg) {
    if (!scene || !mountainMesh) return;
    const oldGeo = mountainMesh.geometry;
    scene.remove(mountainMesh);
    mountainMesh = createMountainMesh(tierCfg.segX, tierCfg.segZ);
    scene.add(mountainMesh);
    if (oldGeo && typeof oldGeo.dispose === 'function') {
        oldGeo.dispose();
    }
}

function applyTierConfig(tierName, rebuildGeometry) {
    const cfg = getTierConfig(tierName);
    state.tier = cfg.name;
    state.effectiveFps = cfg.targetFps;
    state.dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);

    if (renderer) {
        renderer.setPixelRatio(state.dpr);
        renderer.setSize(state.width, state.height, false);
    }
    if (sharedUniforms) {
        sharedUniforms.uPixelRatio.value = state.dpr;
    }
    if (particleGeometry && typeof particleGeometry.setDrawRange === 'function') {
        particleGeometry.setDrawRange(0, cfg.particles);
    }
    if (rebuildGeometry) {
        rebuildMountainForTier(cfg);
    }
}

/* ==========================================================================
   运行时动态 FPS 降级保护 (45 帧滑窗 < 24 FPS 自动降档或降频)
   ========================================================================== */

function recordFrameAndCheckDowngrade(now, deltaMs) {
    // 刚恢复或系统卡顿单帧尖峰不计入污染滑窗
    if (deltaMs <= 0 || deltaMs > 250) return;
    if (now < state.downgradeCooldownUntil) return;

    state.frameWindow.push(deltaMs);
    if (state.frameWindow.length > FPS_WINDOW_SIZE) {
        state.frameWindow.shift();
    }

    if (state.frameWindow.length < FPS_WINDOW_SIZE) return;

    let total = 0;
    for (let i = 0; i < state.frameWindow.length; i++) {
        total += state.frameWindow[i];
    }
    const avgMs = total / state.frameWindow.length;
    const avgFps = 1000 / Math.max(1, avgMs);
    state.avgFrameMs = Number(avgMs.toFixed(2));
    state.currentFps = Number(avgFps.toFixed(1));

    if (avgFps < LOW_FPS_THRESHOLD) {
        state.frameWindow.length = 0;
        state.downgradeCooldownUntil = now + 2500;

        if (state.tier === 'high') {
            state.downgrades += 1;
            applyTierConfig('medium', true);
        } else if (state.tier === 'medium') {
            state.downgrades += 1;
            applyTierConfig('low', true);
        } else if (state.effectiveFps > 20) {
            state.downgrades += 1;
            state.effectiveFps = 20;
            if (renderer) {
                state.dpr = 1.0;
                renderer.setPixelRatio(1.0);
                renderer.setSize(state.width, state.height, false);
            }
        }
    }
}

/* ==========================================================================
   核心渲染与交互步进
   ========================================================================== */

function updateScrollProgress() {
    const doc = document.documentElement;
    const maxScroll = Math.max(1, (doc ? doc.scrollHeight : 0) - (window.innerHeight || 1));
    const y = window.scrollY || window.pageYOffset || 0;
    state.targetScrollProgress = clamp(y / maxScroll, 0, 1);
}

function stepSimulation(dtSec) {
    state.elapsedTime += dtSec;
    const t = state.elapsedTime;

    // 自主利萨茹律动漂移 + 微震呼吸：无鼠标操作时背景也保持鲜活律动与细微震颤，鼠标移动实时叠加响应
    const autoX = Math.sin(t * 0.42) * 0.48 + Math.sin(t * 1.15) * 0.14;
    const autoY = Math.cos(t * 0.34) * 0.38 + Math.cos(t * 0.92) * 0.12;
    const vibeX = Math.sin(t * 3.8) * 0.045;
    const vibeY = Math.cos(t * 4.4) * 0.035;

    // 主题与交互参数阻尼平滑插值
    const damp = 1 - Math.exp(-6.5 * dtSec);
    state.themeMix += (state.targetThemeMix - state.themeMix) * damp;
    state.smoothMouseX += (state.mouseX - state.smoothMouseX) * damp;
    state.smoothMouseY += (state.mouseY - state.smoothMouseY) * damp;
    state.scrollProgress += (state.targetScrollProgress - state.scrollProgress) * damp;
    const activeX = clamp(autoX + state.smoothMouseX * 0.85, -1.25, 1.25);
    const activeY = clamp(autoY + state.smoothMouseY * 0.85, -1.25, 1.25);

    const sDamp = 1 - Math.exp(-2.4 * dtSec);
    const sec = state.section;
    const tgt = state.sectionTarget;
    sec.warm += (tgt.warm - sec.warm) * sDamp;
    sec.armillary += (tgt.armillary - sec.armillary) * sDamp;
    sec.mountains += (tgt.mountains - sec.mountains) * sDamp;
    sec.cameraX += (tgt.cameraX - sec.cameraX) * sDamp;
    sec.spin += (tgt.spin - sec.spin) * sDamp;
    const L = CFG.lightTheme;
    const D = CFG.darkTheme;
    const gainRing = lerp(L.ringOpacityBoost, D.ringOpacityBoost, state.themeMix) * sec.armillary;

    // 自动周期脉冲震动（每 3.4 秒从自主热点释放一圈水墨等高线涟漪，与点击交互叠加）
    if (!state.reducedMotion && t >= state.nextAutoPulseAt) {
        state.pulseOriginX = clamp(0.5 + autoX * 0.28, 0.15, 0.85);
        state.pulseOriginY = clamp(0.45 - autoY * 0.22, 0.18, 0.82);
        state.pulseTime = t;
        state.pulseStrength = 0.72;
        state.nextAutoPulseAt = t + 3.4;
    }

    // 脉冲能量衰减
    if (state.pulseStrength > 0.001) {
        const pulseAge = t - state.pulseTime;
        if (pulseAge > 3.2) {
            state.pulseStrength = 0;
        }
    }

    if (sharedUniforms) {
        sharedUniforms.uTime.value = t;
        sharedUniforms.uThemeMix.value = state.themeMix;
        sharedUniforms.uScrollProgress.value = state.scrollProgress;
        sharedUniforms.uGainFill.value = lerp(L.fillOpacityBoost, D.fillOpacityBoost, state.themeMix) * sec.mountains;
        sharedUniforms.uGainLine.value = lerp(L.lineOpacityBoost, D.lineOpacityBoost, state.themeMix) * sec.mountains;
        sharedUniforms.uGainRing.value = gainRing;
        sharedUniforms.uGainParticle.value = lerp(L.particleOpacityBoost, D.particleOpacityBoost, state.themeMix);
        sharedUniforms.uWarm.value = sec.warm;
        sharedUniforms.uMouse.value.set(activeX, activeY);
        sharedUniforms.uPulseOrigin.value.set(state.pulseOriginX, state.pulseOriginY);
        sharedUniforms.uPulseTime.value = state.pulseTime;
        sharedUniforms.uPulseStrength.value = state.pulseStrength;
    }

    // 相机视差、自主摆动与纵深推移
    if (camera) {
        const S = CFG.scroll;
        const camX = activeX * 1.55 + vibeX + sec.cameraX;
        const camY = 3.2 - activeY * 0.9 + vibeY - state.scrollProgress * S.cameraTravelY;
        const camZ = 22.5 + Math.sin(t * 0.55) * 0.45 - state.scrollProgress * S.cameraTravelZ;
        camera.position.set(camX, camY, camZ);
        camera.lookAt(activeX * 0.4 + sec.cameraX * S.lookAtFollow, -0.4 + vibeY * 0.5 - state.scrollProgress * S.lookAtTravelY, 0);
    }

    // 浑天璇玑三维光环自主公转、节律微震与鼠标视差叠加
    if (armillaryGroup) {
        const breath = 1 + Math.sin(t * 1.8) * 0.018 + (state.pulseStrength > 0 ? Math.sin((t - state.pulseTime) * 9.0) * 0.025 * state.pulseStrength : 0);
        armillaryGroup.scale.setScalar(breath);
        armillaryGroup.rotation.x = 0.14 + Math.sin(t * 0.48) * 0.06 + state.scrollProgress * 0.28 - activeY * 0.16;
        armillaryGroup.rotation.y = activeX * 0.28 + t * 0.12 + sec.spin;
        // 浑天仪随板块在画面左右两侧交替，位移幅度与镜头横移相反，形成视差。
        armillaryGroup.position.x = state.armillaryBaseX - sec.cameraX * CFG.scroll.armillaryShift + vibeX * 0.8;
        armillaryGroup.position.y = state.armillaryBaseY + Math.sin(t * 0.85) * 0.18 - state.scrollProgress * CFG.scroll.armillaryDropY;

        for (let i = 0; i < armillaryRings.length; i++) {
            const item = armillaryRings[i];
            item.pivot.rotation.y += item.speedY * dtSec * 1.45;
            item.pivot.rotation.z += item.speedZ * dtSec * 0.68;
            if (item.innerLineMat) {
                item.innerLineMat.opacity = Math.min(0.92, (0.15 + 0.16 * state.themeMix) * gainRing);
            }
        }
    }
}

function renderSingleFrame() {
    if (!renderer || !scene || !camera || state.contextLost) return;
    try {
        renderer.render(scene, camera);
    } catch (err) {
        // 防御异常状态下渲染报错中断页面
    }
}

function animationLoop(now) {
    state.rafId = null;

    if (isAnyPaused() || state.reducedMotion) {
        return;
    }

    const frameDt = state.lastLoopTime ? (now - state.lastLoopTime) : 16.67;
    state.lastLoopTime = now;

    // 目标帧率节流保护
    const minInterval = 1000 / Math.max(15, state.effectiveFps);
    const sinceLastRender = now - state.lastRenderTime;
    if (state.lastRenderTime === 0 || sinceLastRender >= minInterval * 0.92) {
        const stepDtMs = state.lastRenderTime ? Math.min(sinceLastRender, 100) : 16.67;
        state.lastRenderTime = now;

        stepSimulation(stepDtMs * 0.001);
        renderSingleFrame();
        recordFrameAndCheckDowngrade(now, frameDt);
    }

    state.rafId = requestAnimationFrame(animationLoop);
}

function startLoop() {
    if (!state.webglAvailable || state.fallbackActive) return;
    if (isAnyPaused()) return;

    if (state.reducedMotion) {
        // 降动效模式下仅渲染一帧静态东方意境画面
        stepSimulation(0);
        renderSingleFrame();
        return;
    }

    if (state.rafId !== null) return;
    state.lastLoopTime = 0;
    state.lastRenderTime = 0;
    state.frameWindow.length = 0;
    state.rafId = requestAnimationFrame(animationLoop);
}

function stopLoop() {
    if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }
    state.lastLoopTime = 0;
    state.frameWindow.length = 0;
}

function syncLoopState() {
    if (canvas) {
        canvas.style.display = state.enabled ? 'block' : 'none';
    }
    if (isAnyPaused()) {
        stopLoop();
        return;
    }
    if (state.reducedMotion) {
        stopLoop();
        stepSimulation(0);
        renderSingleFrame();
        return;
    }
    startLoop();
}

/* ==========================================================================
   事件处理：鼠标、点击脉冲、滚动、Resize、主题、总线与上下文恢复
   ========================================================================== */

function handleMouseMove(e) {
    const w = Math.max(1, state.width || window.innerWidth);
    const h = Math.max(1, state.height || window.innerHeight);
    state.mouseX = clamp((e.clientX / w - 0.5) * 2, -1, 1);
    state.mouseY = clamp((e.clientY / h - 0.5) * 2, -1, 1);
}

function handlePointerDown(e) {
    if (typeof e.button === 'number' && e.button !== 0) return;
    triggerShockwave(e.clientX, e.clientY);
}

function handleScroll() {
    updateScrollProgress();
}

function handleResizeImmediate() {
    if (!renderer || !camera) return;
    state.width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1280);
    state.height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 720);

    const cfg = getTierConfig(state.tier);
    state.dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);

    camera.aspect = state.width / state.height;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(state.dpr);
    renderer.setSize(state.width, state.height, false);

    if (sharedUniforms) {
        sharedUniforms.uPixelRatio.value = state.dpr;
        sharedUniforms.uResolution.value.set(state.width, state.height);
    }

    updateArmillaryLayout();

    if (state.reducedMotion && state.enabled && !isAnyPaused()) {
        renderSingleFrame();
    }
}

function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResizeImmediate, RESIZE_DEBOUNCE_MS);
}

function handleVisibilityChange() {
    state.hiddenPaused = !!document.hidden;
    syncLoopState();
}

function refreshReducedMotion() {
    const os = !!(reducedMotionQuery && reducedMotionQuery.matches);
    const user = document.documentElement.hasAttribute('data-reduce-motion');
    state.reducedMotion = os || user;
    if (state.reducedMotion) snapSectionState();
    syncLoopState();
}

function handleReducedMotionChange() {
    refreshReducedMotion();
}

function handleContextLost(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    state.contextLost = true;
    stopLoop();
}

function handleContextRestored() {
    state.contextLost = false;
    handleResizeImmediate();
    syncLoopState();
}

function bindDomEvents() {
    const listen = function (target, type, fn, opts) {
        target.addEventListener(type, fn, opts);
        domCleanups.push(function () { target.removeEventListener(type, fn, opts); });
    };
    listen(window, 'mousemove', handleMouseMove, { passive: true });
    listen(window, 'pointerdown', handlePointerDown, { passive: true });
    listen(window, 'scroll', handleScroll, { passive: true });
    listen(window, 'resize', handleResize, { passive: true });
    listen(document, 'visibilitychange', handleVisibilityChange);

    if (canvas) {
        listen(canvas, 'webglcontextlost', handleContextLost, false);
        listen(canvas, 'webglcontextrestored', handleContextRestored, false);
    }

    if (window.matchMedia) {
        reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        state.reducedMotion = !!reducedMotionQuery.matches || document.documentElement.hasAttribute('data-reduce-motion');
        if (typeof reducedMotionQuery.addEventListener === 'function') {
            reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
        } else if (typeof reducedMotionQuery.addListener === 'function') {
            reducedMotionQuery.addListener(handleReducedMotionChange);
        }
    }

    // 兜底监听 <html data-theme> 变化，配合 AppRegistry onThemeChange 双重同步
    if (typeof MutationObserver !== 'undefined') {
        themeObserver = new MutationObserver(function () {
            onThemeChange(detectThemeFromDom());
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
}

function bindBusEvents() {
    const bus = appContext.bus;
    if (!bus || typeof bus.on !== 'function') return;

    const sub = function (eventName, handler) {
        const ret = bus.on(eventName, handler);
        if (typeof ret === 'function') {
            busCleanups.push(ret);
        } else if (typeof bus.off === 'function') {
            busCleanups.push(function () {
                bus.off(eventName, handler);
            });
        }
    };

    sub('modal:opened', function () {
        state.modalOpenCount += 1;
        syncLoopState();
    });

    sub('modal:closed', function () {
        state.modalOpenCount = Math.max(0, state.modalOpenCount - 1);
        syncLoopState();
    });

    sub('stage:fullscreen', function (payload) {
        const isFs = typeof payload === 'boolean'
            ? payload
            : !!(payload && (payload.fullscreen || payload.active || payload.isFullscreen));
        state.fullscreenPaused = isFs;
        syncLoopState();
    });

    sub('section:changed', function (payload) {
        if (payload && payload.id) setActiveSection(payload.id, payload.index);
    });

    sub('a11y:changed', function () {
        refreshReducedMotion();
    });

    sub('theme:changed', function (payload) {
        const nextTheme = typeof payload === 'string'
            ? payload
            : (payload && payload.theme) || detectThemeFromDom();
        onThemeChange(nextTheme);
    });
}

/* ==========================================================================
   公共 API 与向后兼容全局接口
   ========================================================================== */

function triggerShockwave(x, y) {
    if (state.fallbackActive) return;
    if (!state.webglAvailable || !state.enabled || state.reducedMotion) return;

    const w = Math.max(1, state.width || window.innerWidth || 1280);
    const h = Math.max(1, state.height || window.innerHeight || 720);
    const px = typeof x === 'number' ? x : w * 0.5;
    const py = typeof y === 'number' ? y : h * 0.5;

    state.pulseOriginX = clamp(px / w, 0, 1);
    state.pulseOriginY = clamp(1 - py / h, 0, 1);
    state.pulseTime = state.elapsedTime;
    state.pulseStrength = 1.0;
    state.nextAutoPulseAt = state.elapsedTime + 3.4;
}

function setPausedExternal(paused) {
    state.externalPaused = !!paused;
    if (state.fallbackActive) return;
    syncLoopState();
}

function setEnabled(bool) {
    const next = !!bool;
    state.enabled = next;
    syncStoreBgEnabled(next);

    if (state.webglAvailable) {
        syncLoopState();
    }
    return state.enabled;
}

function isEnabled() {
    return !!state.enabled;
}

function getStats() {
    const cfg = getTierConfig(state.tier);
    return {
        initialized: state.initialized,
        webglAvailable: state.webglAvailable,
        fallback: state.fallbackActive,
        enabled: state.enabled,
        paused: isAnyPaused(),
        pauseReasons: getPauseReasons(),
        reducedMotion: state.reducedMotion,
        contextLost: state.contextLost,
        tier: state.tier,
        initialTier: state.initialTier,
        targetFps: cfg.targetFps,
        effectiveFps: state.effectiveFps,
        currentFps: state.currentFps,
        avgFrameMs: state.avgFrameMs,
        dpr: state.dpr,
        particleCount: cfg.particles,
        mountainSegments: cfg.segX + 'x' + cfg.segZ,
        downgrades: state.downgrades,
        theme: state.theme
    };
}

function onThemeChange(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    state.theme = normalized;
    state.targetThemeMix = normalized === 'dark' ? 1.0 : 0.0;
    applyBlendingForTheme();

    if (!state.webglAvailable) return;

    // 静态模式或尚未开始插值时立即更新色彩
    if (state.reducedMotion || state.rafId === null) {
        state.themeMix = state.targetThemeMix;
        if (sharedUniforms) {
            sharedUniforms.uThemeMix.value = state.themeMix;
        }
        if (state.enabled && !isAnyPaused()) {
            renderSingleFrame();
        }
    }
}

function activateFallback() {
    state.webglAvailable = false;
    state.fallbackActive = true;

    if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvas = null;
    }

    // 无 WebGL：标记降级状态（CSS 提供静态水墨底纹），并按需加载 Canvas 2D 版背景作为替代。
    document.documentElement.setAttribute('data-bg-fallback', '');
    lazy.load('legacy-ambient-2d').then(function () {
        legacy.call('initOrientalFallbackAmbient');
    }).catch(function () { /* 静态底纹已足够 */ });
}

function init(context) {
    if (state.initialized) return;
    state.initialized = true;
    appContext = context && typeof context === 'object' ? context : {};

    state.enabled = readMotionPreference();
    syncStoreBgEnabled(state.enabled);

    state.theme = (appContext.theme === 'dark' || appContext.theme === 'light')
        ? appContext.theme
        : detectThemeFromDom();
    state.themeMix = state.theme === 'dark' ? 1.0 : 0.0;
    state.targetThemeMix = state.themeMix;

    state.width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1280);
    state.height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 720);
    state.initialTier = classifyDeviceTier();
    state.tier = state.initialTier;

    const tierCfg = getTierConfig(state.tier);
    state.effectiveFps = tierCfg.targetFps;
    state.dpr = Math.min(window.devicePixelRatio || 1, tierCfg.dprCap);
    state.hiddenPaused = !!document.hidden;

    // 创建固定底层画布
    const existingCanvas = document.getElementById('webgl-ambient-bg');
    canvas = existingCanvas || document.createElement('canvas');
    canvas.id = 'webgl-ambient-bg';
    canvas.setAttribute('aria-hidden', 'true');
    // 定位、尺寸与层级由样式表负责（.ambient-bg-canvas，层级见 00-tokens.css 的 --z-bg）
    canvas.className = 'ambient-bg-canvas';
    canvas.style.display = state.enabled ? 'block' : 'none';

    if (!existingCanvas && document.body) {
        document.body.prepend(canvas);
    }

    // 检查 Three.js 与 WebGL 能力声明，不满足则优雅降级
    if (!checkWebGLSupport()) {
        activateFallback();
        return;
    }

    const tierCfgNow = tierCfg;
    let bgFallbackTimer = null;
    const bootRenderer = () => {
        clearTimeout(bgFallbackTimer);
        if (!state.initialized || !canvas || renderer) return;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: tierCfgNow.antialias,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: false
            });
            renderer.setClearColor(0x000000, 0);
            renderer.setPixelRatio(state.dpr);
            renderer.setSize(state.width, state.height, false);
        } catch (err) {
            renderer = null;
            activateFallback();
            return;
        }

        state.webglAvailable = true;
        state.fallbackActive = false;

        // 若页面曾存在旧版 2D 画布，隐去避免双层叠加损耗性能
        const legacyCanvas = document.getElementById('oriental-ambient-canvas');
        if (legacyCanvas && legacyCanvas !== canvas) {
            legacyCanvas.style.display = 'none';
        }

        buildScene();
        updateScrollProgress();
        state.scrollProgress = state.targetScrollProgress;

        bindDomEvents();
        bindBusEvents();

        // 若关闭了背景动效，确保状态一致；否则启动或渲染单帧
        if (!state.enabled) {
            syncLoopState();
        } else {
            stepSimulation(0);
            renderSingleFrame();
            syncLoopState();
        }
    };

    // 待首屏 Hero3D 完成首次渲染或 5.5s 兜底后再启动全屏背景 WebGL，保证首屏器物独占 GPU 管线秒开
    bgFallbackTimer = setTimeout(bootRenderer, 5500);
    let bgDelayTimer = 0;
    if (appContext.bus && typeof appContext.bus.on === 'function') {
        const offHero = appContext.bus.on('hero:ready', () => {
            offHero();
            clearTimeout(bgFallbackTimer);
            bgDelayTimer = setTimeout(bootRenderer, 40);
        });
        busCleanups.push(() => {
            clearTimeout(bgFallbackTimer);
            clearTimeout(bgDelayTimer);
            offHero();
        });
    } else {
        busCleanups.push(() => clearTimeout(bgFallbackTimer));
    }
}


/** 释放全部资源：事件监听、动画帧、几何体 / 材质 / 渲染器。销毁后可再次 init。 */
function destroy() {
    stopLoop();
    clearTimeout(resizeTimer);
    domCleanups.splice(0).forEach(function (fn) { fn(); });
    busCleanups.splice(0).forEach(function (fn) { fn(); });
    if (themeObserver) { themeObserver.disconnect(); themeObserver = null; }
    if (reducedMotionQuery) {
        if (typeof reducedMotionQuery.removeEventListener === 'function') reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        reducedMotionQuery = null;
    }
    if (scene) {
        scene.traverse(function (obj) {
            if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose();
            if (obj.material && typeof obj.material.dispose === 'function') obj.material.dispose();
        });
    }
    if (renderer) {
        renderer.dispose();
        if (typeof renderer.forceContextLoss === 'function') renderer.forceContextLoss();
    }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = renderer = scene = camera = null;
    mountainMesh = mountainMaterial = armillaryGroup = particlePoints = particleGeometry = particleMaterial = sharedUniforms = null;
    armillaryRings = [];
    armillaryMaterials = [];
    themedBlendMaterials = [];
    state.initialized = false;
    state.webglAvailable = false;
    state.rafId = null;
}

export default defineModule({
    id: 'webgl-bg',
    phase: 1,
    init: function (ctx) {
        init({ bus: ctx.bus, store: ctx.store, theme: ctx.store.get('theme') });
        setActiveSection(ctx.store.get('activeSection') || 'hero', 0);
        // 旧脚本（首屏展柜、弹窗）仍通过这两个事件请求“水墨脉冲”与“暂停背景”。
        busCleanups.push(ctx.bus.on('bg:pulse', function (p) { triggerShockwave(p && p.x, p && p.y); }));
        busCleanups.push(ctx.bus.on('bg:pause', function (p) { setPausedExternal(!!(p && p.paused)); }));
    },
    destroy: destroy,
    onThemeChange: onThemeChange,
    actions: {
        toggleWebGLBackgroundMotion: function () {
            const next = !isEnabled();
            setEnabled(next);
            return next;
        }
    },
    api: { setEnabled: setEnabled, isEnabled: isEnabled, getStats: getStats, setPaused: setPausedExternal, pulse: triggerShockwave }
});
