/**
 * 华夏器道 · 天青泥火 — WebGL 东方美学三维意境背景引擎 (Three.js r128+)
 * 模块定位：固定底层氛围画布 (#webgl-ambient-bg)，与前景文博内容和谐共生
 * 核心层次：
 * 1. GLSL 流体千里江山波纹曲面：自定义顶点波形调制 + 天青/青绿/鎏金等高线光晕渐变 + 点击水墨脉冲波
 * 2. 北宋浑天璇玑三维光环系统：3 组不同倾角与转速的精细轨道配二十八宿发光星节点
 * 3. 景深浮金玉屑粒子场：AdditiveBlending 柔和散景粒子，随深度呼吸闪烁与交互微涌
 * 4. 完整性能分级 (high/medium/low)、45 帧滑窗动态降级、上下文丢失恢复与降级兼容
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'huaxia_bg_motion';
    const RESIZE_DEBOUNCE_MS = 150;
    const FPS_WINDOW_SIZE = 45;
    const LOW_FPS_THRESHOLD = 24;
    const MAX_PARTICLE_CAPACITY = 850;

    // 三档设备分级配置表
    const TIERS = {
        high: {
            name: 'high',
            dprCap: 1.5,
            targetFps: 60,
            particles: 850,
            segX: 44,
            segZ: 28,
            ringSegments: 128,
            antialias: true
        },
        medium: {
            name: 'medium',
            dprCap: 1.25,
            targetFps: 45,
            particles: 420,
            segX: 30,
            segZ: 18,
            ringSegments: 96,
            antialias: true
        },
        low: {
            name: 'low',
            dprCap: 1.0,
            targetFps: 30,
            particles: 200,
            segX: 20,
            segZ: 12,
            ringSegments: 64,
            antialias: false
        }
    };

    // 保留旧版全局备选引用，供不支持 WebGL 或降级时无缝衔接
    const prevTriggerShockwave = typeof window.triggerOrientalShockwave === 'function'
        ? window.triggerOrientalShockwave
        : null;
    const prevSetPaused = typeof window.setOrientalAmbientPaused === 'function'
        ? window.setOrientalAmbientPaused
        : null;

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

        // 脉冲状态
        pulseOriginX: 0.5,
        pulseOriginY: 0.5,
        pulseTime: -10.0,
        pulseStrength: 0.0
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

    /* ==========================================================================
       工具函数：环境探测、存储读写、状态同步
       ========================================================================== */

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function readMotionPreference() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw === null || raw === '') return true;
            const normalized = String(raw).trim().toLowerCase();
            if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'disabled') {
                return false;
            }
            return true;
        } catch (err) {
            return true;
        }
    }

    function writeMotionPreference(enabled) {
        try {
            localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
        } catch (err) {
            // 隐私模式下忽略存储异常
        }
    }

    function syncStoreBgEnabled(enabled) {
        const store = appContext.store || window.AppStore;
        if (!store) return;
        try {
            if (typeof store.set === 'function') {
                store.set('bgEnabled', !!enabled);
            } else if (typeof store.setState === 'function') {
                store.setState({ bgEnabled: !!enabled });
            } else if (typeof store.update === 'function') {
                store.update(function (prev) {
                    return Object.assign({}, prev, { bgEnabled: !!enabled });
                });
            } else if (store.state && typeof store.state === 'object') {
                store.state.bgEnabled = !!enabled;
            }
        } catch (err) {
            // 不因 Store 实现差异中断背景模块
        }
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
        const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
        const mem = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4;
        const saveData = !!(navigator.connection && navigator.connection.saveData);

        if (saveData || vw < 768 || cores <= 2 || mem <= 2 || (cores <= 4 && mem <= 4)) {
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

    function checkWebGLSupport(targetCanvas) {
        if (typeof THREE === 'undefined') return false;
        try {
            const opts = { alpha: true, powerPreference: 'high-performance' };
            const gl = targetCanvas.getContext('webgl2', opts)
                || targetCanvas.getContext('webgl', opts)
                || targetCanvas.getContext('experimental-webgl', opts);
            return !!gl;
        } catch (err) {
            return false;
        }
    }

    /* ==========================================================================
       GLSL 着色器定义：千里江山波纹曲面、浑天璇玑环轨、星宿与浮金散景粒子
       ========================================================================== */

    const MOUNTAIN_VERTEX_SHADER = [
        'uniform float uTime;',
        'uniform float uScrollProgress;',
        'uniform vec2 uMouse;',
        'uniform vec2 uPulseOrigin;',
        'uniform float uPulseTime;',
        'uniform float uPulseStrength;',
        'uniform vec2 uResolution;',
        '',
        'varying vec2 vUv;',
        'varying float vElevation;',
        'varying float vPulseWave;',
        'varying float vDepthFactor;',
        '',
        'float hash21(vec2 p) {',
        '    p = fract(p * vec2(123.34, 456.21));',
        '    p += dot(p, p + 45.32);',
        '    return fract(p.x * p.y);',
        '}',
        '',
        'float noise2D(vec2 p) {',
        '    vec2 i = floor(p);',
        '    vec2 f = fract(p);',
        '    vec2 u = f * f * (3.0 - 2.0 * f);',
        '    float a = hash21(i);',
        '    float b = hash21(i + vec2(1.0, 0.0));',
        '    float c = hash21(i + vec2(0.0, 1.0));',
        '    float d = hash21(i + vec2(1.0, 1.0));',
        '    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
        '}',
        '',
        'float fbmMountain(vec2 p) {',
        '    float v = 0.0;',
        '    float amp = 0.55;',
        '    for (int i = 0; i < 4; i++) {',
        '        v += amp * noise2D(p);',
        '        p = p * 2.03 + vec2(1.7, 9.2);',
        '        amp *= 0.5;',
        '    }',
        '    return v;',
        '}',
        '',
        'void main() {',
        '    vUv = uv;',
        '    vec3 pos = position;',
        '',
        '    // 远景山势隆起与近景江波荡漾',
        '    float horizonMask = smoothstep(0.05, 0.92, uv.y);',
        '    float ridgeBase = fbmMountain(vec2(pos.x * 0.11 + uTime * 0.035 + uScrollProgress * 0.45, pos.y * 0.14 - uTime * 0.02));',
        '    float ripple = sin(pos.x * 0.32 + uTime * 0.72 + pos.y * 0.18) * 0.38',
        '                 + cos(pos.y * 0.42 - uTime * 0.56 + pos.x * 0.12) * 0.28;',
        '    float peak = pow(ridgeBase, 1.35) * (1.8 + 4.2 * horizonMask);',
        '    float mouseSwell = exp(-length(uv - (uMouse * 0.4 + 0.5)) * 4.5) * 0.55;',
        '',
        '    float elevation = peak + ripple * (0.45 + 0.55 * horizonMask) + mouseSwell;',
        '    pos.z += elevation;',
        '',
        '    // 投射到屏幕空间计算点击水墨能量涟漪',
        '    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
        '    vec4 clipPos = projectionMatrix * mvPos;',
        '    vec2 screenUv = (clipPos.xy / max(clipPos.w, 0.0001)) * 0.5 + 0.5;',
        '    float aspect = max(uResolution.x / max(uResolution.y, 1.0), 0.5);',
        '    vec2 diff = (screenUv - uPulseOrigin) * vec2(aspect, 1.0);',
        '    float pulseDist = length(diff);',
        '    float pulseAge = max(0.0, uTime - uPulseTime);',
        '    float waveFront = pulseAge * 0.85;',
        '    float ringBand = exp(-pow((pulseDist - waveFront) * 6.5, 2.0));',
        '    float pulseFade = exp(-pulseAge * 1.15) * uPulseStrength;',
        '    float pulseWave = ringBand * pulseFade * sin((pulseDist - waveFront) * 28.0);',
        '',
        '    pos.z += pulseWave * 1.15;',
        '    vElevation = elevation + pulseWave * 0.65;',
        '    vPulseWave = ringBand * pulseFade;',
        '    vDepthFactor = clamp((-mvPos.z - 8.0) / 38.0, 0.0, 1.0);',
        '',
        '    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
        '}'
    ].join('\n');

    const MOUNTAIN_FRAGMENT_SHADER = [
        'uniform float uTime;',
        'uniform float uThemeMix;',
        'uniform float uScrollProgress;',
        'uniform float uBrightness;',
        '',
        'varying vec2 vUv;',
        'varying float vElevation;',
        'varying float vPulseWave;',
        'varying float vDepthFactor;',
        '',
        'void main() {',
        '    // 四边自然羽化，确保曲面与页面底色无缝融合',
        '    float edgeX = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));',
        '    float edgeY = smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));',
        '    float vignette = edgeX * edgeY;',
        '    if (vignette <= 0.002) discard;',
        '',
        '    float h = clamp((vElevation + 0.4) / 5.4, 0.0, 1.0);',
        '',
        '    // 晴窗宣纸雅集色板 (天青 · 翠岚 · 雅金)',
        '    vec3 lightValley = vec3(0.835, 0.898, 0.910);',
        '    vec3 lightSlope  = vec3(0.486, 0.667, 0.706);',
        '    vec3 lightPeak   = vec3(0.227, 0.463, 0.518);',
        '    vec3 lightGold   = vec3(0.784, 0.635, 0.353);',
        '',
        '    // 夜宴深黛星金色板 (玄青 · 天青 · 流金)',
        '    vec3 darkValley  = vec3(0.055, 0.118, 0.165);',
        '    vec3 darkSlope   = vec3(0.180, 0.420, 0.486);',
        '    vec3 darkPeak    = vec3(0.545, 0.761, 0.808);',
        '    vec3 darkGold    = vec3(0.925, 0.812, 0.573);',
        '',
        '    vec3 valleyCol = mix(lightValley, darkValley, uThemeMix);',
        '    vec3 slopeCol  = mix(lightSlope, darkSlope, uThemeMix);',
        '    vec3 peakCol   = mix(lightPeak, darkPeak, uThemeMix);',
        '    vec3 goldCol   = mix(lightGold, darkGold, uThemeMix);',
        '',
        '    // 随滚动进度产生极细腻的卷轴色调流转 (天青 -> 青绿 -> 暮金)',
        '    vec3 scrollTint = mix(slopeCol, goldCol, smoothstep(0.25, 1.0, uScrollProgress) * 0.22);',
        '    vec3 baseCol = mix(valleyCol, scrollTint, smoothstep(0.08, 0.58, h));',
        '    baseCol = mix(baseCol, peakCol, smoothstep(0.52, 0.96, h));',
        '',
        '    // 千里江山等高线计算（无导数依赖，跨 WebGL1/2 绝对稳定）',
        '    float contourPhase = abs(fract(vElevation * 3.4) - 0.5);',
        '    float contourLine = 1.0 - smoothstep(0.018, 0.085, contourPhase);',
        '    float ridgeGlow = smoothstep(0.62, 0.98, h);',
        '    vec3 contourColor = mix(peakCol, goldCol, 0.35 + 0.55 * ridgeGlow);',
        '',
        '    vec3 finalCol = mix(baseCol, contourColor, contourLine * (0.42 + 0.38 * uThemeMix));',
        '    // 脉冲水墨涟漪光晕',
        '    finalCol = mix(finalCol, goldCol, clamp(vPulseWave * 0.85, 0.0, 0.85));',
        '',
        '    // 亮色模式极其轻柔通透以保障文字对比度，暗夜模式深邃绚丽',
        '    float baseAlpha = mix(0.055, 0.14, h) + contourLine * mix(0.11, 0.24, uThemeMix);',
        '    float themeGain = mix(0.76, 1.08, uThemeMix) * uBrightness;',
        '    float depthFade = mix(1.0, 0.55, vDepthFactor * 0.65);',
        '    float alpha = clamp((baseAlpha + vPulseWave * 0.28) * vignette * themeGain * depthFade, 0.0, 0.52);',
        '',
        '    gl_FragColor = vec4(finalCol, alpha);',
        '}'
    ].join('\n');

    const RING_VERTEX_SHADER = [
        'varying vec2 vUv;',
        'varying vec3 vNormalView;',
        'varying vec3 vViewPos;',
        '',
        'void main() {',
        '    vUv = uv;',
        '    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '    vViewPos = -mvPosition.xyz;',
        '    vNormalView = normalize(normalMatrix * normal);',
        '    gl_Position = projectionMatrix * mvPosition;',
        '}'
    ].join('\n');

    const RING_FRAGMENT_SHADER = [
        'uniform float uTime;',
        'uniform float uThemeMix;',
        'uniform float uScrollProgress;',
        'uniform float uPhaseOffset;',
        'uniform float uGoldBias;',
        'uniform float uOpacity;',
        '',
        'varying vec2 vUv;',
        'varying vec3 vNormalView;',
        'varying vec3 vViewPos;',
        '',
        'void main() {',
        '    vec3 lightCyan = vec3(0.227, 0.463, 0.518);',
        '    vec3 lightGold = vec3(0.740, 0.570, 0.290);',
        '    vec3 darkCyan  = vec3(0.545, 0.761, 0.808);',
        '    vec3 darkGold  = vec3(0.953, 0.851, 0.620);',
        '',
        '    vec3 cyanCol = mix(lightCyan, darkCyan, uThemeMix);',
        '    vec3 goldCol = mix(lightGold, darkGold, uThemeMix);',
        '',
        '    // 沿环轨巡游的流光脉冲',
        '    float flow = sin(vUv.x * 6.2831853 * 2.0 - uTime * 1.15 + uPhaseOffset) * 0.5 + 0.5;',
        '    float fineTick = pow(sin(vUv.x * 6.2831853 * 28.0) * 0.5 + 0.5, 4.0) * 0.25;',
        '    vec3 viewDir = normalize(vViewPos);',
        '    float fresnel = 1.0 - abs(dot(normalize(vNormalView), viewDir));',
        '',
        '    float goldWeight = clamp(uGoldBias + flow * 0.35 + uScrollProgress * 0.15, 0.0, 1.0);',
        '    vec3 col = mix(cyanCol, goldCol, goldWeight);',
        '    col += goldCol * (fineTick * 0.35 + fresnel * 0.25);',
        '',
        '    float themeAlpha = mix(0.58, 1.0, uThemeMix);',
        '    float alpha = clamp((uOpacity + flow * 0.14 + fineTick * 0.12) * themeAlpha, 0.0, 0.78);',
        '    gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    const STAR_VERTEX_SHADER = [
        'attribute float aPhase;',
        'attribute float aSize;',
        'attribute float aKind;',
        '',
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        '',
        'varying float vPhase;',
        'varying float vKind;',
        'varying float vTwinkle;',
        '',
        'void main() {',
        '    vPhase = aPhase;',
        '    vKind = aKind;',
        '    vTwinkle = 0.72 + 0.28 * sin(uTime * 1.9 + aPhase);',
        '    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '    float dist = max(1.0, -mvPos.z);',
        '    gl_PointSize = clamp((aSize * 210.0 / dist) * uPixelRatio * vTwinkle, 3.0, 32.0);',
        '    gl_Position = projectionMatrix * mvPos;',
        '}'
    ].join('\n');

    const STAR_FRAGMENT_SHADER = [
        'uniform float uThemeMix;',
        '',
        'varying float vPhase;',
        'varying float vKind;',
        'varying float vTwinkle;',
        '',
        'void main() {',
        '    vec2 p = gl_PointCoord - vec2(0.5);',
        '    float d = length(p);',
        '    if (d > 0.5) discard;',
        '',
        '    // 中心星核 + 柔和晕光 + 十字星芒',
        '    float core = exp(-d * 9.5);',
        '    float halo = smoothstep(0.5, 0.04, d) * 0.55;',
        '    float crossRays = (exp(-abs(p.x) * 26.0) + exp(-abs(p.y) * 26.0)) * smoothstep(0.48, 0.0, d) * 0.35;',
        '    float intensity = clamp(core + halo + crossRays, 0.0, 1.0);',
        '',
        '    vec3 lightGold = vec3(0.784, 0.620, 0.320);',
        '    vec3 darkGold  = vec3(0.970, 0.870, 0.620);',
        '    vec3 lightCyan = vec3(0.240, 0.510, 0.580);',
        '    vec3 darkCyan  = vec3(0.580, 0.820, 0.880);',
        '',
        '    vec3 goldCol = mix(lightGold, darkGold, uThemeMix);',
        '    vec3 cyanCol = mix(lightCyan, darkCyan, uThemeMix);',
        '    vec3 col = mix(cyanCol, goldCol, vKind);',
        '',
        '    float themeAlpha = mix(0.46, 0.92, uThemeMix);',
        '    gl_FragColor = vec4(col, intensity * vTwinkle * themeAlpha);',
        '}'
    ].join('\n');

    const PARTICLE_VERTEX_SHADER = [
        'attribute float aPhase;',
        'attribute float aScale;',
        'attribute float aKind;',
        'attribute vec3 aDrift;',
        '',
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        'uniform float uScrollProgress;',
        'uniform vec2 uPulseOrigin;',
        'uniform float uPulseTime;',
        'uniform float uPulseStrength;',
        'uniform vec2 uResolution;',
        '',
        'varying float vKind;',
        'varying float vAlpha;',
        '',
        'void main() {',
        '    vKind = aKind;',
        '    vec3 pos = position;',
        '',
        '    // 景深空间缓慢飘浮与优雅循环回绕',
        '    float ySpan = 22.0;',
        '    pos.y = mod(pos.y + uTime * aDrift.y + 11.0, ySpan) - 11.0;',
        '    pos.x += sin(uTime * aDrift.x + aPhase) * 0.85;',
        '    pos.z += cos(uTime * aDrift.z + aPhase * 1.3) * 0.75 + uScrollProgress * 1.6;',
        '',
        '    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
        '    vec4 clipPos = projectionMatrix * mvPos;',
        '    vec2 screenUv = (clipPos.xy / max(clipPos.w, 0.0001)) * 0.5 + 0.5;',
        '    float aspect = max(uResolution.x / max(uResolution.y, 1.0), 0.5);',
        '    vec2 diff = (screenUv - uPulseOrigin) * vec2(aspect, 1.0);',
        '    float dist = length(diff);',
        '    float pulseAge = max(0.0, uTime - uPulseTime);',
        '    float waveFront = pulseAge * 0.85;',
        '    float pulseBoost = exp(-pow((dist - waveFront) * 5.5, 2.0)) * exp(-pulseAge * 1.2) * uPulseStrength;',
        '',
        '    // 脉冲经过时微粒轻盈外推与点亮',
        '    vec2 pushDir = dist > 0.0001 ? normalize(diff) : vec2(0.0);',
        '    pos.x += pushDir.x * pulseBoost * 1.4;',
        '    pos.y += pushDir.y * pulseBoost * 1.1;',
        '',
        '    mvPos = modelViewMatrix * vec4(pos, 1.0);',
        '    float camDist = max(2.0, -mvPos.z);',
        '    float depthBokeh = clamp(1.0 - (camDist - 10.0) / 34.0, 0.25, 1.0);',
        '    float twinkle = 0.62 + 0.38 * sin(uTime * 1.45 + aPhase);',
        '',
        '    vAlpha = depthBokeh * twinkle * (0.72 + pulseBoost * 0.65);',
        '    gl_PointSize = clamp((aScale * 185.0 / camDist) * uPixelRatio * (1.0 + pulseBoost * 0.45), 2.0, 26.0);',
        '    gl_Position = projectionMatrix * mvPos;',
        '}'
    ].join('\n');

    const PARTICLE_FRAGMENT_SHADER = [
        'uniform float uThemeMix;',
        'uniform float uScrollProgress;',
        '',
        'varying float vKind;',
        'varying float vAlpha;',
        '',
        'void main() {',
        '    vec2 uv = gl_PointCoord - vec2(0.5);',
        '    float r = length(uv);',
        '    if (r > 0.5) discard;',
        '',
        '    // 圆形柔和散景光斑',
        '    float softDisc = smoothstep(0.5, 0.06, r);',
        '    float innerGlow = exp(-r * 7.2) * 0.65;',
        '    float shape = softDisc * 0.55 + innerGlow;',
        '',
        '    // 天青玉屑 vs 流金星芒',
        '    vec3 lightJade = vec3(0.400, 0.620, 0.665);',
        '    vec3 darkJade  = vec3(0.545, 0.785, 0.840);',
        '    vec3 lightGold = vec3(0.760, 0.590, 0.300);',
        '    vec3 darkGold  = vec3(0.953, 0.845, 0.590);',
        '',
        '    vec3 jadeCol = mix(lightJade, darkJade, uThemeMix);',
        '    vec3 goldCol = mix(lightGold, darkGold, uThemeMix);',
        '    vec3 baseCol = mix(jadeCol, goldCol, step(0.45, vKind));',
        '    baseCol = mix(baseCol, goldCol, uScrollProgress * 0.14);',
        '',
        '    // AdditiveBlending 下亮色宣纸严格控光，避免刺眼过曝',
        '    float themeGain = mix(0.24, 0.78, uThemeMix);',
        '    gl_FragColor = vec4(baseCol, clamp(shape * vAlpha * themeGain, 0.0, 0.85));',
        '}'
    ].join('\n');

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
            armillaryGroup.scale.setScalar(1.0);
        } else if (w >= 768) {
            armillaryGroup.position.set(2.2, 1.6, -3.6);
            armillaryGroup.scale.setScalar(0.86);
        } else {
            armillaryGroup.position.set(0.0, 2.0, -4.6);
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

        // 主题与交互参数阻尼平滑插值
        const damp = 1 - Math.exp(-6.5 * dtSec);
        state.themeMix += (state.targetThemeMix - state.themeMix) * damp;
        state.smoothMouseX += (state.mouseX - state.smoothMouseX) * damp;
        state.smoothMouseY += (state.mouseY - state.smoothMouseY) * damp;
        state.scrollProgress += (state.targetScrollProgress - state.scrollProgress) * damp;

        // 脉冲能量衰减
        if (state.pulseStrength > 0.001) {
            const pulseAge = state.elapsedTime - state.pulseTime;
            if (pulseAge > 3.2) {
                state.pulseStrength = 0;
            }
        }

        if (sharedUniforms) {
            sharedUniforms.uTime.value = state.elapsedTime;
            sharedUniforms.uThemeMix.value = state.themeMix;
            sharedUniforms.uScrollProgress.value = state.scrollProgress;
            sharedUniforms.uMouse.value.set(state.smoothMouseX, state.smoothMouseY);
            sharedUniforms.uPulseOrigin.value.set(state.pulseOriginX, state.pulseOriginY);
            sharedUniforms.uPulseTime.value = state.pulseTime;
            sharedUniforms.uPulseStrength.value = state.pulseStrength;
        }

        // 相机视差与纵深推移
        if (camera) {
            const camX = state.smoothMouseX * 1.45;
            const camY = 3.2 - state.smoothMouseY * 0.85 - state.scrollProgress * 0.95;
            const camZ = 22.5 - state.scrollProgress * 2.8;
            camera.position.set(camX, camY, camZ);
            camera.lookAt(state.smoothMouseX * 0.35, -0.4 - state.scrollProgress * 0.45, 0);
        }

        // 浑天璇玑三维光环旋转与随滚动仰角微调
        if (armillaryGroup) {
            armillaryGroup.rotation.x = 0.14 + state.scrollProgress * 0.28 - state.smoothMouseY * 0.14;
            armillaryGroup.rotation.y = state.smoothMouseX * 0.22;

            for (let i = 0; i < armillaryRings.length; i++) {
                const item = armillaryRings[i];
                item.pivot.rotation.y += item.speedY * dtSec;
                item.pivot.rotation.z += item.speedZ * dtSec * 0.45;
                if (item.innerLineMat) {
                    item.innerLineMat.opacity = 0.13 + 0.14 * state.themeMix;
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

    function handleReducedMotionChange(e) {
        state.reducedMotion = !!(e && e.matches);
        syncLoopState();
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
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('pointerdown', handlePointerDown, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        if (canvas) {
            canvas.addEventListener('webglcontextlost', handleContextLost, false);
            canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        }

        if (window.matchMedia) {
            reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            state.reducedMotion = !!reducedMotionQuery.matches;
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
        const bus = appContext.bus || window.AppBus;
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
        if (state.fallbackActive) {
            if (prevTriggerShockwave) {
                try { prevTriggerShockwave(x, y); } catch (err) {}
            }
            return;
        }
        if (!state.webglAvailable || !state.enabled || state.reducedMotion) return;

        const w = Math.max(1, state.width || window.innerWidth || 1280);
        const h = Math.max(1, state.height || window.innerHeight || 720);
        const px = typeof x === 'number' ? x : w * 0.5;
        const py = typeof y === 'number' ? y : h * 0.5;

        state.pulseOriginX = clamp(px / w, 0, 1);
        state.pulseOriginY = clamp(1 - py / h, 0, 1);
        state.pulseTime = state.elapsedTime;
        state.pulseStrength = 1.0;
    }

    function setPausedExternal(paused) {
        state.externalPaused = !!paused;
        if (state.fallbackActive) {
            if (prevSetPaused) {
                try { prevSetPaused(!!paused); } catch (err) {}
            }
            return;
        }
        syncLoopState();
    }

    function setEnabled(bool) {
        const next = !!bool;
        state.enabled = next;
        writeMotionPreference(next);
        syncStoreBgEnabled(next);

        if (state.fallbackActive && prevSetPaused) {
            try { prevSetPaused(!next); } catch (err) {}
        }

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

        if (typeof window.initOrientalFallbackAmbient === 'function') {
            try {
                window.initOrientalFallbackAmbient();
            } catch (err) {
                // 静默降级，不向页面抛错
            }
        }
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
        canvas.style.position = 'fixed';
        canvas.style.inset = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.display = state.enabled ? 'block' : 'none';

        if (!existingCanvas && document.body) {
            document.body.prepend(canvas);
        }

        // 检查 Three.js 与 WebGL 可用性，不满足则优雅降级
        if (!checkWebGLSupport(canvas)) {
            activateFallback();
            return;
        }

        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: tierCfg.antialias,
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
    }

    // 对外兼容暴露现有全局控制函数
    window.triggerOrientalShockwave = triggerShockwave;
    window.setOrientalAmbientPaused = setPausedExternal;

    // 注册至应用模块调度中心
    const moduleDefinition = {
        id: 'webgl-bg',
        phase: 1,
        init: init,
        onThemeChange: onThemeChange,
        publicApi: {
            setEnabled: setEnabled,
            isEnabled: isEnabled,
            getStats: getStats
        }
    };

    if (window.AppRegistry && typeof window.AppRegistry.register === 'function') {
        window.AppRegistry.register(moduleDefinition);
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init({});
        });
    } else {
        init({});
    }
})();
