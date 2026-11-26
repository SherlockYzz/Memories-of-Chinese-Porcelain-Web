/**
 * 华夏器道 · 天青泥火 — 华夏古瓷三维数字文博展馆与 PBR 物理研鉴引擎 (Three.js WebGL National Award Flagship Engine)
 * 核心升级：
 * 1. 九大传世馆藏：7尊128段高精度双壁程序化标准器 + 2尊1:1实测结构光三维扫描真品 (GLTF 1K PBR 贴图)
 * 2. 博物馆级暗调金碧水墨屏风背景，彻底解决前景青瓷/白瓷过曝问题，凸显双层清漆 (Clearcoat) 玉质感
 * 3. 四大展览模式：【单器360°精鉴台】、【3D全景九柜博物馆漫游】、【X光胎骨可调剖面透视】、【策展人语音自动巡礼】
 * 4. 实时 PBR 光学实验室：支持动态调节釉层清漆厚度 (Clearcoat)、微晶粗糙度 (Roughness)、折射率 (IOR) 与剖切深度
 * 5. 器物声学共振示波器 (叩瓷听音实时声波曲线) + 馆藏级带印章水印 3D 快照导出
 */

let scene, camera, renderer, currentGroup;
let pedestalGroup, hallGroup, particleSystem, dimensionGroup;
let lightMain, lightFill, lightRim, ambientLight, topSpotLight;
let envMapTexture = null;
let clipPlane = null;
let clipOffset = 0.0;

// 真实 3D 空间与物理环境场景
let realisticRoomGroup = null;
let currentRoomEnv = 'studio'; // 'studio' | 'palace' | 'kiln'
let showRealisticScene = true;
let incenseSmokeSystem = null;
let volumetricGodRays = null;
let roomFloorMesh = null;
let roomScreenMesh = null;
let roomWallMesh = null;
let roomWindowMesh = null;
let roomTableMesh = null;
let contactShadowMesh = null;

// 交互与展览状态
let autoRotate = true;
let isWireframe = false;
let showCrackle = true;
let showDimensions = false;
let showHotspots = true;
let exhibitionMode = 'inspector'; // 'inspector' | 'hall' | 'cutaway'
let curatorialTourActive = false;
let tourTimer = null;
let currentModelIndex = 0;

/**
 * -------------------------------------------------------------
 * 华夏古瓷 3D 展馆升华：双器并列同台比对 (Dual Vessel Comparison) 与 纯净沉浸观赏 (Zen Mode)
 * -------------------------------------------------------------
 */
let compareRightModelIndex = 1;
let compareRightGroup = null;
let compareRightPedestal = null;
let isZenMode = false;

function toggleZenMode() {
    isZenMode = !isZenMode;
    const stage = document.getElementById('three-stage-container');
    const zenBtn = document.getElementById('btn-zen-mode');
    if (stage) {
        stage.classList.toggle('zen-mode-active', isZenMode);
    }
    if (zenBtn) {
        zenBtn.classList.toggle('active', isZenMode);
        zenBtn.innerHTML = isZenMode
            ? '<i class="fa-solid fa-eye-slash text-amber-400"></i><span>退出纯净</span>'
            : '<i class="fa-solid fa-eye text-tianqing-light"></i><span>纯净沉浸</span>';
    }
    if (typeof showToast === 'function') {
        showToast(isZenMode ? '🌿 已开启【纯净沉浸观赏】：已隐去所有辅助面板，专心领略古瓷泥火与光影' : '已恢复标准展馆交互面板');
    }
}

let currentGlazeIndex = 'tianqing';
let useScannedOriginalTex = true; // 针对第7、8号实测扫描模型，默认展示真实扫描纹理，也可切换PBR釉色试烧

// 实时可调 PBR 参数覆盖
let customPbrOverride = {
    clearcoat: null,
    roughness: null,
    ior: null
};

// 实测扫描 GLTF 模型缓存
const scannedModelCache = {};

// 相机平滑插值目标
let camPosTarget = { x: 0, y: 0.95, z: 3.55 };
let camLookTarget = { x: 0, y: -0.05, z: 0 };
let camLookCurrent = { x: 0, y: -0.05, z: 0 };
let userOrbitAngles = { theta: 0, phi: 0.26, radius: 3.55 };
let isUserDragging = false;
let vesselVibration = 0;

// 器物资料、底足考据、模型元数据与釉色参数已迁至 content/vessels.json 与 content/glazes.json，
// 经 src/legacy/data-shims.js 以同名常量提供（porcelainModelsData / bottomConnoisseurshipData /
// masterTreasuresMeta / scannedModelsMeta / glazePalettes）。本文件不再内嵌内容数据。

const IS_MOBILE_PERF = (typeof window !== 'undefined') && (
    window.innerWidth < 768 ||
    ((navigator.maxTouchPoints || 0) > 0 && Math.min(window.innerWidth, window.innerHeight || 900) < 900)
);

/** 创建器物贴图画布：桌面端全尺寸 1024×512，移动端 0.5x（512×256）提升绘制与显存上传速度 4 倍 */
function createPorcelainTexCanvas(logicalW = 1024, logicalH = 512) {
    const scale = IS_MOBILE_PERF ? 0.5 : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(logicalW * scale);
    canvas.height = Math.round(logicalH * scale);
    const ctx = canvas.getContext('2d');
    if (scale !== 1) ctx.scale(scale, scale);
    return { canvas, ctx, W: logicalW, H: logicalH };
}

// --- 模型队列与加载控制器 (移动端限并发 2 / 桌面端 3，优先调度主器物，与环境道具分离错峰) ---
const MAX_CONCURRENT_MODELS = IS_MOBILE_PERF ? 2 : 3;
const MODEL_TIMEOUT_MS = 18000; // 跨境访问 GitHub Pages 适当放宽下载超时，避免大体积 GLB 中途被误杀
const MAX_MODEL_RETRIES = 3;

const masterTreasuresCache = {};
const masterTreasuresLoading = {};
const masterTreasureCallbacks = {};
const masterTreasureRetries = {};

let activeLoadingCount = 0;
const modelTaskQueue = []; // [{ idx, isPriority }]
let stageLoaderWatchdog = null;

/**
 * 展台浮动状态胶囊提示 (非阻断式微交互)
 */
function showStageLoadingToast(show, text = '') {
    let toast = document.getElementById('three-model-loading-pill');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'three-model-loading-pill';
        toast.className = 'three-model-loading-pill';
        const container = document.getElementById('three-stage-container');
        if (container) container.appendChild(toast);
    }
    if (show) {
        toast.innerHTML = `<span class="pulse-celadon-ring"></span><span>${text}</span>`;
        toast.style.display = 'flex';
        toast.style.opacity = '1';
    } else {
        toast.style.opacity = '0';
        setTimeout(() => { if (toast) toast.style.display = 'none'; }, 300);
    }
}

function updateThreeStageLoader(text, percent = null) {
    const formatted = percent !== null ? `${text} (${percent}%)` : text;
    const stageLoader = document.getElementById('three-stage-loader');
    if (stageLoader) {
        const textEl = stageLoader.querySelector('.loader-text');
        if (textEl) {
            textEl.textContent = formatted;
        }
    }
    showStageLoadingToast(true, formatted);
}

function hideThreeStageLoader() {
    if (stageLoaderWatchdog) {
        clearTimeout(stageLoaderWatchdog);
        stageLoaderWatchdog = null;
    }
    const stagePoster = document.getElementById('three-stage-poster');
    if (stagePoster && stagePoster.style.display !== 'none') {
        stagePoster.style.opacity = '0';
        setTimeout(() => {
            if (stagePoster) stagePoster.style.display = 'none';
        }, 450);
    }
    const stageLoader = document.getElementById('three-stage-loader');
    if (stageLoader && stageLoader.style.display !== 'none') {
        stageLoader.style.transition = 'opacity 0.35s ease-out';
        stageLoader.style.opacity = '0';
        setTimeout(() => {
            if (stageLoader) stageLoader.style.display = 'none';
        }, 350);
    }
    showStageLoadingToast(false);
}

function showThreeStageLoader(text = '器物三维数据载入中...', autoHideMs = 2800) {
    const stageLoader = document.getElementById('three-stage-loader');
    if (stageLoader) {
        stageLoader.style.display = 'flex';
        stageLoader.style.opacity = '1';
        const textEl = stageLoader.querySelector('.loader-text');
        if (textEl) {
            textEl.textContent = text;
        }
    }
    showStageLoadingToast(true, text);

    // 强行安全看门狗：任何网络挂起或异常，最多 2.8s 必须自动解除遮罩，绝不允许锁死展厅视口
    if (stageLoaderWatchdog) clearTimeout(stageLoaderWatchdog);
    stageLoaderWatchdog = setTimeout(() => {
        hideThreeStageLoader();
    }, autoHideMs);
}

function processModelQueue() {
    if (activeLoadingCount >= MAX_CONCURRENT_MODELS || modelTaskQueue.length === 0) return;

    // 优先提取最高优先级的任务
    const task = modelTaskQueue.shift();
    if (!task) return;
    const { idx } = task;

    if (masterTreasuresCache[idx]) {
        // 已有缓存，立即触发回调并继续处理后续队列
        const cbs = masterTreasureCallbacks[idx] || [];
        delete masterTreasureCallbacks[idx];
        cbs.forEach(cb => { try { cb(masterTreasuresCache[idx]); } catch (e) { console.error(e); } });
        if (idx === currentModelIndex) {
            hideThreeStageLoader();
        }
        processModelQueue();
        return;
    }

    if (masterTreasuresLoading[idx]) {
        processModelQueue();
        return;
    }

    activeLoadingCount++;
    masterTreasuresLoading[idx] = true;

    const meta = masterTreasuresMeta[idx];
    if (!meta) {
        activeLoadingCount--;
        masterTreasuresLoading[idx] = false;
        processModelQueue();
        return;
    }

    const loader = new THREE.GLTFLoader();
    let isFinished = false;

    // 停滞超时断流控制器（只要仍有下载进度就重置计时）
    const onModelTimeout = () => {
        if (isFinished) return;
        isFinished = true;
        activeLoadingCount--;
        masterTreasuresLoading[idx] = false;

        masterTreasureRetries[idx] = (masterTreasureRetries[idx] || 0) + 1;
        if (masterTreasureRetries[idx] <= MAX_MODEL_RETRIES) {
            console.warn(`[国宝加载超时重试] ${meta.name} (第 ${masterTreasureRetries[idx]} 次重试)`);
            if (idx === currentModelIndex) {
                updateThreeStageLoader(`网络重试中 (${masterTreasureRetries[idx]}/${MAX_MODEL_RETRIES})`);
            }
            modelTaskQueue.unshift({ idx, isPriority: true });
        } else {
            console.warn(`[国宝加载最终超时] ${meta.name}，启用高精度几何兜底`);
            if (idx === currentModelIndex) {
                hideThreeStageLoader();
                if (typeof showToast === 'function') {
                    showToast(`提示：【${meta.name}】网络响应较慢，已先载入几何轮廓`);
                }
            }
        }
        processModelQueue();
    };
    let timeoutTimer = setTimeout(onModelTimeout, MODEL_TIMEOUT_MS);

    const onGlbSuccess = (gltf) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutTimer);
        activeLoadingCount--;
        masterTreasuresLoading[idx] = false;

        if (gltf && gltf.scene) {
            gltf.scene.traverse(c => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                    // GLB 已自带高精法线时不再强制重算（避免阻塞主线程及抹平烘焙折痕）
                    if (c.geometry && !c.geometry.attributes.normal) {
                        c.geometry.computeVertexNormals();
                    }
                }
            });
            masterTreasuresCache[idx] = gltf.scene;

            const cbs = masterTreasureCallbacks[idx] || [];
            delete masterTreasureCallbacks[idx];
            cbs.forEach(cb => { try { cb(gltf.scene); } catch (e) { console.error(e); } });

            if (currentModelIndex === idx) {
                hideThreeStageLoader();
                if (currentGroup && exhibitionMode !== 'hall' && cbs.length === 0) {
                    loadPorcelainModel(idx, true);
                }
            }

            if (exhibitionMode === 'hall') {
                updateHallVitrineModel(idx);
            }
        }
        processModelQueue();
    };

    const onGlbError = (err) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutTimer);
        activeLoadingCount--;
        masterTreasuresLoading[idx] = false;
        console.warn('[国宝模型载入异常] ' + meta.name + ':', err);

        masterTreasureRetries[idx] = (masterTreasureRetries[idx] || 0) + 1;
        if (masterTreasureRetries[idx] <= MAX_MODEL_RETRIES) {
            modelTaskQueue.unshift({ idx, isPriority: true });
        } else if (idx === currentModelIndex) {
            hideThreeStageLoader();
        }
        processModelQueue();
    };

    const fetchShared = window.__TQ__ && window.__TQ__.core && window.__TQ__.core.fetchGlbBuffer;
    if (fetchShared && /\.glb(\?|$)/i.test(meta.path)) {
        fetchShared(meta.path)
            .then((buf) => loader.parse(buf.slice(0), '', onGlbSuccess, onGlbError))
            .catch(onGlbError);
    } else {
        loader.load(
            meta.path,
            onGlbSuccess,
            (xhr) => {
                if (isFinished) return;
                clearTimeout(timeoutTimer);
                timeoutTimer = setTimeout(onModelTimeout, MODEL_TIMEOUT_MS);
                if (xhr.lengthComputable && xhr.total > 0 && idx === currentModelIndex) {
                    const percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
                    updateThreeStageLoader('器物模型载入中', percent);
                }
            },
            onGlbError
        );
    }
}

function loadSingleMasterTreasure(idx, callback, isPriority = false) {
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') return;
    if (masterTreasuresCache[idx]) {
        if (callback) {
            try { callback(masterTreasuresCache[idx]); } catch (e) { console.error(e); }
        }
        if (idx === currentModelIndex) {
            hideThreeStageLoader();
        }
        return;
    }

    if (!masterTreasureCallbacks[idx]) masterTreasureCallbacks[idx] = [];
    if (callback) masterTreasureCallbacks[idx].push(callback);

    const existingIndex = modelTaskQueue.findIndex(t => t.idx === idx);
    if (isPriority) {
        if (existingIndex > -1) modelTaskQueue.splice(existingIndex, 1);
        modelTaskQueue.unshift({ idx, isPriority: true });
    } else if (existingIndex === -1 && !masterTreasuresLoading[idx]) {
        modelTaskQueue.push({ idx, isPriority: false });
    }

    processModelQueue();
}

function preloadMasterTreasures(callback) {
    // 优先拉取当前展示的 0 号器物
    loadSingleMasterTreasure(0, (scene) => {
        hideThreeStageLoader();
        if (callback) callback(scene);
    }, true);
}

const textureCache = {};

/**
 * 0.1 宋代青石板地面贴图
 */
function getRealisticStoneFloorTexture() { return null; }
function getRealisticGoldBrickTexture() { return null; }
function getRealisticKilnBrickTexture() { return null; }
function getScreenPaintingTexture() { return null; }
function getRosewoodTexture() { return null; }
function getBrocadeMatTexture() { return null; }
function getContactShadowTexture() { return null; }
function getWindowLatticeTexture() { return null; }

function createStudioEnvironment() {
    if (envMapTexture) return envMapTexture;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
        baseGrad.addColorStop(0.0, '#1c2a35');
        baseGrad.addColorStop(0.45, '#101820');
        baseGrad.addColorStop(0.55, '#090e13');
        baseGrad.addColorStop(1.0, '#141e26');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, 512, 512);

        // 顶部大型环形博物馆柔光箱
        const topLight = ctx.createRadialGradient(256, 70, 8, 256, 70, 210);
        topLight.addColorStop(0, 'rgba(255, 252, 242, 0.96)');
        topLight.addColorStop(0.4, 'rgba(200, 232, 240, 0.45)');
        topLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topLight;
        ctx.fillRect(0, 0, 512, 320);

        // 左侧宋代轩窗暖白格栅天光条 (在瓷器腹部形成玉质竖向高光带)
        ctx.fillStyle = 'rgba(255, 248, 235, 0.90)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(110 + i * 26, 110, 16, 180);
        }

        // 右侧天青色漫射辅光窗
        const sideLight = ctx.createRadialGradient(410, 210, 12, 410, 210, 130);
        sideLight.addColorStop(0, 'rgba(168, 218, 228, 0.85)');
        sideLight.addColorStop(0.6, 'rgba(124, 170, 180, 0.28)');
        sideLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sideLight;
        ctx.fillRect(280, 40, 232, 340);

        // 鎏金环境地平线微反射
        const goldBand = ctx.createLinearGradient(0, 280, 0, 330);
        goldBand.addColorStop(0, 'rgba(197, 160, 89, 0)');
        goldBand.addColorStop(0.5, 'rgba(197, 160, 89, 0.32)');
        goldBand.addColorStop(1, 'rgba(197, 160, 89, 0)');
        ctx.fillStyle = goldBand;
        ctx.fillRect(0, 280, 512, 50);

        const equirectTex = new THREE.CanvasTexture(canvas);
        equirectTex.mapping = THREE.EquirectangularReflectionMapping;

        envMapTexture = equirectTex;
        return envMapTexture;
    } catch (e) {
        return null;
    }
}

/**
 * 2. 生成多尺度双层 Voronoi 开片贴图（复用共享着色器模块）
 */
function getCrackleTextureBundle(glazeKey = currentGlazeIndex) {
    const cfg = glazePalettes[glazeKey] || glazePalettes.tianqing || {};
    const opt = cfg.optics || {};
    const g = window.__TQ__ && window.__TQ__.core && window.__TQ__.core.glaze;
    if (g && typeof g.getMultiScaleCrackleMaps === 'function') {
        return g.getMultiScaleCrackleMaps({
            inkColor: opt.crackleInkColor || '#3c3127',
            goldColor: opt.crackleGoldColor || '#9b7440',
            scale: opt.crackleScale || 1.8,
            strength: typeof opt.crackleOpacity === 'number' ? opt.crackleOpacity : 0.36
        });
    }
    if (textureCache.crackleBundle) return textureCache.crackleBundle;

    const cCanvas = document.createElement('canvas');
    const bCanvas = document.createElement('canvas');
    cCanvas.width = bCanvas.width = 512;
    cCanvas.height = bCanvas.height = 512;
    const cCtx = cCanvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');

    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = 'rgb(200, 200, 200)';
    bCtx.fillRect(0, 0, 512, 512);

    // 微表面橘皮棕眼与玉脂云絮噪点
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 4 + Math.random() * 16;
        cCtx.fillStyle = i % 2 === 0 ? 'rgba(232, 244, 246, 0.16)' : 'rgba(210, 228, 232, 0.12)';
        cCtx.beginPath(); cCtx.arc(x, y, r, 0, Math.PI * 2); cCtx.fill();

        bCtx.fillStyle = i % 2 === 0 ? 'rgba(218, 218, 218, 0.2)' : 'rgba(178, 178, 178, 0.2)';
        bCtx.beginPath(); bCtx.arc(x, y, r * 0.8, 0, Math.PI * 2); bCtx.fill();
    }

    // 确定性伪随机生成 Voronoi 金丝铁线裂网
    let seed = 108;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    const nodes = [];
    const gridN = 8;
    const cellW = 512 / gridN;
    for (let gx = 0; gx < gridN; gx++) {
        for (let gy = 0; gy < gridN; gy++) {
            nodes.push({
                x: (gx + 0.18 + rand() * 0.64) * cellW,
                y: (gy + 0.18 + rand() * 0.64) * cellW
            });
        }
    }

    cCtx.lineCap = bCtx.lineCap = 'round';
    cCtx.lineJoin = bCtx.lineJoin = 'round';

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (d < 92) {
                const mx = (nodes[i].x + nodes[j].x) * 0.5 + (rand() - 0.5) * 16;
                const my = (nodes[i].y + nodes[j].y) * 0.5 + (rand() - 0.5) * 16;

                // 金丝细脉 (极淡茶金色微裂，融于厚釉，绝不用死黑粗线)
                cCtx.strokeStyle = 'rgba(175, 140, 88, 0.12)';
                cCtx.lineWidth = 0.6;
                cCtx.beginPath();
                cCtx.moveTo(nodes[i].x, nodes[i].y);
                cCtx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
                cCtx.stroke();

                bCtx.strokeStyle = 'rgb(75, 75, 75)';
                bCtx.lineWidth = 1.8;
                bCtx.beginPath();
                bCtx.moveTo(nodes[i].x, nodes[i].y);
                bCtx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
                bCtx.stroke();

                // 金丝次级细网 (极微游丝)
                if (rand() > 0.40) {
                    const bx = mx + (rand() - 0.5) * 48;
                    const by = my + (rand() - 0.5) * 48;
                    cCtx.strokeStyle = 'rgba(186, 150, 92, 0.08)';
                    cCtx.lineWidth = 0.5;
                    cCtx.beginPath();
                    cCtx.moveTo(mx, my);
                    cCtx.lineTo(bx, by);
                    cCtx.stroke();

                    bCtx.strokeStyle = 'rgb(125, 125, 125)';
                    bCtx.lineWidth = 1.0;
                    bCtx.beginPath();
                    bCtx.moveTo(mx, my);
                    bCtx.lineTo(bx, by);
                    bCtx.stroke();
                }
            }
        }
    }

    const map = new THREE.CanvasTexture(cCanvas);
    const bumpMap = new THREE.CanvasTexture(bCanvas);
    map.wrapS = map.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);
    bumpMap.repeat.set(2, 2);

    textureCache.crackleBundle = { map, bumpMap };
    return textureCache.crackleBundle;
}

/**
 * 3. 定窑白瓷划花莲瓣浮雕凹凸贴图
 */
function getDingCarvedBundle() {
    if (textureCache.dingBundle) return textureCache.dingBundle;
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 512;
    bCanvas.height = 512;
    const ctx = bCanvas.getContext('2d');

    ctx.fillStyle = 'rgb(180, 180, 180)';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgb(252, 252, 252)';
    ctx.lineWidth = 3.5;
    for (let row = 0; row < 3; row++) {
        const baseY = 120 + row * 150;
        for (let i = 0; i < 12; i++) {
            const cx = (i / 12) * 512 + 24;
            ctx.beginPath();
            ctx.moveTo(cx - 24, baseY + 45);
            ctx.quadraticCurveTo(cx - 28, baseY - 30, cx, baseY - 55);
            ctx.quadraticCurveTo(cx + 28, baseY - 30, cx + 24, baseY + 45);
            ctx.stroke();

            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, baseY + 40);
            ctx.lineTo(cx, baseY - 40);
            ctx.stroke();
            ctx.lineWidth = 3.5;
        }
    }

    const bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    textureCache.dingBundle = { bumpMap };
    return textureCache.dingBundle;
}

/**
 * 4. 禹州钧窑海棠绛紫与月白流釉窑变贴图（1024×512 沉稳馆藏质感）
 */
function getJunYaobianTexture() {
    if (textureCache.junTex) return textureCache.junTex;
    const { canvas, ctx, W, H } = createPorcelainTexCanvas(1024, 512);

    // 沉稳海棠绛紫 / 茄皮紫底色渐变（绝不用亮粉与荧光蓝）
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0.0, '#624838'); // 出戟口沿微露酱褐胎骨
    grad.addColorStop(0.08, '#4e2438');
    grad.addColorStop(0.38, '#5f2c44');
    grad.addColorStop(0.72, '#431e31');
    grad.addColorStop(0.92, '#3a1a2b');
    grad.addColorStop(1.0, '#5a4435');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    let s = 20264;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

    // 1. 重力流淌的乳浊天青 / 月白灰蓝流釉条带（丝绒交融）
    for (let i = 0; i < 90; i++) {
        const x = rand() * W;
        const y = rand() * H * 0.72;
        const len = 110 + rand() * 260;
        const rx = 18 + rand() * 44;
        [-W, 0, W].forEach(shift => {
            const px = x + shift;
            if (px + rx < -10 || px - rx > W + 10) return;
            const g = ctx.createLinearGradient(px, y, px, y + len);
            if (i % 3 === 0) {
                g.addColorStop(0, 'rgba(138, 168, 184, 0)');
                g.addColorStop(0.35, 'rgba(130, 158, 174, 0.24)');
                g.addColorStop(0.75, 'rgba(110, 138, 156, 0.16)');
                g.addColorStop(1, 'rgba(110, 138, 156, 0)');
            } else if (i % 3 === 1) {
                g.addColorStop(0, 'rgba(92, 42, 68, 0)');
                g.addColorStop(0.45, 'rgba(118, 48, 76, 0.28)');
                g.addColorStop(1, 'rgba(68, 28, 48, 0)');
            } else {
                g.addColorStop(0, 'rgba(152, 174, 186, 0)');
                g.addColorStop(0.5, 'rgba(156, 178, 190, 0.18)');
                g.addColorStop(1, 'rgba(156, 178, 190, 0)');
            }
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(px, y + len * 0.5, rx, len * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 2. 钧窑标志性“蚯蚓走泥纹”（含蓄曲折的乳浊暗白流脉）
    ctx.lineCap = 'round';
    for (let k = 0; k < 46; k++) {
        let x = rand() * W;
        let y = 36 + rand() * (H - 140);
        ctx.strokeStyle = k % 2 === 0 ? 'rgba(176, 192, 202, 0.22)' : 'rgba(42, 20, 32, 0.26)';
        ctx.lineWidth = 1.4 + rand() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let step = 0; step < 6; step++) {
            x += (rand() - 0.5) * 26;
            y += 14 + rand() * 20;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.junTex = tex;
    return tex;
}

/**
 * 5. 建窑乌金兔毫与曜变天目星空贴图
 */
function getJianYaobianTexture() {
    if (textureCache.jianTex) return textureCache.jianTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#120f10';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 42; i++) {
        const x = Math.random() * 512;
        const y = 80 + Math.random() * 380;
        const r = 16 + Math.random() * 42;
        const g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, 'rgba(230, 200, 125, 0.88)');
        g.addColorStop(0.35, 'rgba(65, 150, 235, 0.58)');
        g.addColorStop(0.7, 'rgba(115, 65, 185, 0.35)');
        g.addColorStop(1, 'rgba(20, 17, 18, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    for (let i = 0; i < 480; i++) {
        const x = Math.random() * 512;
        const y = 30 + Math.random() * 420;
        const h = 45 + Math.random() * 160;
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(212, 168, 92, 0.82)');
        g.addColorStop(0.5, 'rgba(135, 182, 218, 0.68)');
        g.addColorStop(1, 'rgba(20, 17, 18, 0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.7 + Math.random() * 1.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 6, y + h);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.jianTex = tex;
    return tex;
}

/**
 * 6. 元明苏麻离青五段式缠枝牡丹宝相花青花釉贴图（1024×512 高清馆藏级）
 */
function getQinghuaTexture() {
    if (textureCache.qinghuaTex) return textureCache.qinghuaTex;
    const { canvas, ctx, W, H } = createPorcelainTexCanvas(1024, 512);

    const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
    baseGrad.addColorStop(0.0, '#e3e9ec');
    baseGrad.addColorStop(0.5, '#ecf0f2');
    baseGrad.addColorStop(1.0, '#d8dfe3');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    const cobaltMain = 'rgba(19, 52, 118, 0.92)';
    const cobaltMid = 'rgba(32, 72, 146, 0.72)';
    const cobaltLight = 'rgba(64, 108, 178, 0.34)';
    const ironSpot = 'rgba(24, 20, 22, 0.86)';

    const drawBand = (y, lw) => {
        ctx.strokeStyle = cobaltMain;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    };
    drawBand(22, 3.6); drawBand(32, 2.0);
    drawBand(106, 3.2); drawBand(116, 2.0);
    drawBand(396, 2.2); drawBand(406, 3.4);
    drawBand(488, 3.8);

    // 颈部如意云肩（8组）
    const cN = 8;
    for (let i = -1; i <= cN; i++) {
        const cx = (i + 0.5) * (W / cN);
        const hw = (W / cN) * 0.44;
        ctx.save();
        const cg = ctx.createLinearGradient(cx, 36, cx, 100);
        cg.addColorStop(0, cobaltLight);
        cg.addColorStop(1, 'rgba(22, 56, 128, 0.14)');
        ctx.fillStyle = cg;
        ctx.strokeStyle = cobaltMain;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx - hw, 36);
        ctx.bezierCurveTo(cx - hw * 0.9, 72, cx - hw * 0.35, 96, cx, 100);
        ctx.bezierCurveTo(cx + hw * 0.35, 96, cx + hw * 0.9, 72, cx + hw, 36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, 66, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // 主腹 S-曲线缠枝蔓藤与叶片
    const midY = 256;
    const amp = 74;
    ctx.strokeStyle = cobaltMain;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 6) {
        const y = midY + Math.sin((x / W) * Math.PI * 4) * amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
        const lx = (i + 0.35) * (W / 16);
        const ly = midY + Math.sin((lx / W) * Math.PI * 4) * amp;
        const dir = i % 2 === 0 ? -1 : 1;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(dir * 0.75);
        ctx.fillStyle = cobaltMid;
        ctx.strokeStyle = cobaltMain;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(18, -13, 38, -2);
        ctx.quadraticCurveTo(20, 11, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // 4朵苏麻离青缠枝宝相牡丹花
    for (let f = -1; f <= 4; f++) {
        const fx = (f + 0.25) * (W / 4);
        const fy = midY + (f % 2 === 0 ? -48 : 48);
        ctx.save();
        ctx.translate(fx, fy);
        for (let p = 0; p < 8; p++) {
            ctx.save();
            ctx.rotate((p / 8) * Math.PI * 2);
            const pg = ctx.createRadialGradient(0, -32, 4, 0, -32, 26);
            pg.addColorStop(0, cobaltLight);
            pg.addColorStop(0.75, cobaltMid);
            pg.addColorStop(1, cobaltMain);
            ctx.fillStyle = pg;
            ctx.strokeStyle = cobaltMain;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-10, -16);
            ctx.quadraticCurveTo(-17, -42, 0, -54);
            ctx.quadraticCurveTo(17, -42, 10, -16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.fillStyle = cobaltMain;
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ecf0f2';
        ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = ironSpot;
        for (let k = 0; k < 6; k++) {
            const a = k * 1.05;
            ctx.beginPath(); ctx.arc(Math.cos(a) * 34, Math.sin(a) * 34, 2.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    // 胫部仰莲瓣纹（12瓣）
    const fN = 12;
    for (let i = -1; i <= fN; i++) {
        const cx = (i + 0.5) * (W / fN);
        const hw = (W / fN) * 0.41;
        ctx.save();
        ctx.fillStyle = cobaltLight;
        ctx.strokeStyle = cobaltMain;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx - hw, 482);
        ctx.quadraticCurveTo(cx - hw * 0.75, 422, cx, 412);
        ctx.quadraticCurveTo(cx + hw * 0.75, 422, cx + hw, 482);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.qinghuaTex = tex;
    return tex;
}

/**
 * 7. 明宣德宝石红霁红釉与灯草白口沿贴图（1024×512 凝脂深赤红）
 */
function getXuandeJihongTexture() {
    if (textureCache.jihongTex) return textureCache.jihongTex;
    const { canvas, ctx, W, H } = createPorcelainTexCanvas(1024, 512);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0.0, '#e8e4da');  // 宣德霁红经典“灯草边”口沿白釉
    grad.addColorStop(0.045, '#8c282b');
    grad.addColorStop(0.18, '#6e161a'); // 鲜丽凝脂宝石红
    grad.addColorStop(0.65, '#591014'); // 垂流积釉深红
    grad.addColorStop(0.92, '#430b0e');
    grad.addColorStop(1.0, '#62483b');  // 底足圈足胎线
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 微橘皮铜红窑变深度层次（沉稳含蓄）
    let s = 31415;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < 65; i++) {
        const x = rand() * W;
        const y = 40 + rand() * (H - 80);
        const r = 30 + rand() * 90;
        const g = ctx.createRadialGradient(x, y, 4, x, y, r);
        g.addColorStop(0, i % 2 === 0 ? 'rgba(130, 26, 30, 0.24)' : 'rgba(65, 10, 14, 0.26)');
        g.addColorStop(1, 'rgba(90, 16, 20, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.jihongTex = tex;
    return tex;
}

/**
 * 8. 清乾隆御窑明黄锦地开光洋彩莲纹贴图（1024×512 皇家雅丽珐琅彩）
 */
function getQianlongYangcaiTexture() {
    if (textureCache.yangcaiTex) return textureCache.yangcaiTex;
    const { canvas, ctx, W, H } = createPorcelainTexCanvas(1024, 512);

    // 明黄锦地底色渐变
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0.0, '#b58d34');
    bg.addColorStop(0.25, '#cfa648');
    bg.addColorStop(0.65, '#c2973a');
    bg.addColorStop(1.0, '#9e7626');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 细密锦上添花暗凤尾卷草纹
    ctx.strokeStyle = 'rgba(145, 102, 24, 0.34)';
    ctx.lineWidth = 1.4;
    for (let y = 24; y < H; y += 32) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) {
            const wy = y + Math.sin((x / W) * Math.PI * 16 + y) * 7;
            if (x === 0) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
        }
        ctx.stroke();
    }

    // 上下松石绿 + 描金如意云肩边饰
    const drawTrim = (y, h, invert) => {
        const step = W / 12;
        for (let i = -1; i <= 12; i++) {
            const cx = (i + 0.5) * step;
            ctx.save();
            ctx.fillStyle = i % 2 === 0 ? '#3f838b' : '#b24b64';
            ctx.strokeStyle = '#f2da8e';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            if (!invert) {
                ctx.moveTo(cx - step * 0.45, y);
                ctx.quadraticCurveTo(cx, y + h, cx + step * 0.45, y);
            } else {
                ctx.moveTo(cx - step * 0.45, y + h);
                ctx.quadraticCurveTo(cx, y, cx + step * 0.45, y + h);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    };
    drawTrim(24, 58, false);
    drawTrim(H - 82, 58, true);

    // 4处描金双线开光 + 御窑粉彩重瓣牡丹缠枝叶
    for (let k = 0; k < 4; k++) {
        const kx = (k + 0.5) * (W / 4);
        const ky = H * 0.5;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.fillStyle = '#f6f2e8';
        ctx.strokeStyle = '#e7c66c';
        ctx.lineWidth = 6.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 86, 114, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 内圈精细朱红描金细线框
        ctx.strokeStyle = 'rgba(176, 56, 78, 0.72)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, 76, 104, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 缠枝青绿茎蔓与锯齿卷草叶
        ctx.strokeStyle = '#2d6a49';
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-36, 76);
        ctx.bezierCurveTo(-18, 28, 22, 16, 16, -54);
        ctx.moveTo(-8, 24);
        ctx.quadraticCurveTo(36, 22, 46, -8);
        ctx.moveTo(-2, -14);
        ctx.quadraticCurveTo(-42, -26, -46, -56);
        ctx.stroke();

        const drawJadeLeaf = (lx, ly, ang, len) => {
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(ang);
            const lg = ctx.createLinearGradient(0, 0, len, 0);
            lg.addColorStop(0, '#2a6244');
            lg.addColorStop(0.65, '#4c946b');
            lg.addColorStop(1, '#26583d');
            ctx.fillStyle = lg;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(len * 0.45, -len * 0.36, len, -len * 0.06);
            ctx.quadraticCurveTo(len * 0.52, len * 0.28, 0, 0);
            ctx.fill();
            ctx.restore();
        };
        drawJadeLeaf(-14, 38, -0.5, 34);
        drawJadeLeaf(12, 18, 0.28, 32);
        drawJadeLeaf(-16, -24, -2.5, 30);
        drawJadeLeaf(18, -36, -0.7, 26);

        // 重瓣粉彩宝相牡丹：外 8 瓣 + 内 6 瓣 + 金蕊
        for (let p = 0; p < 8; p++) {
            ctx.save();
            ctx.rotate((p / 8) * Math.PI * 2);
            const pg = ctx.createRadialGradient(0, -32, 3, 0, -32, 24);
            pg.addColorStop(0, '#f8e2e8');
            pg.addColorStop(0.58, '#cc627d');
            pg.addColorStop(1, '#8c2845');
            ctx.fillStyle = pg;
            ctx.strokeStyle = 'rgba(130, 34, 60, 0.85)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-9, -12);
            ctx.quadraticCurveTo(-16, -42, 0, -52);
            ctx.quadraticCurveTo(16, -42, 9, -12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        for (let p = 0; p < 6; p++) {
            ctx.save();
            ctx.rotate((p / 6) * Math.PI * 2 + 0.25);
            ctx.fillStyle = 'rgba(244, 198, 210, 0.92)';
            ctx.strokeStyle = 'rgba(155, 48, 76, 0.72)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.ellipse(0, -18, 7, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.fillStyle = '#e5bd5a';
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9a6816';
        for (let s = 0; s < 6; s++) {
            const sa = (s / 6) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(Math.cos(sa) * 5.5, Math.sin(sa) * 5.5, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.yangcaiTex = tex;
    return tex;
}

/**
 * 生成当前器物与釉色对应的物理材质 (支持实时 PBR 光学调校与动态剖切)
 */
function getPorcelainMaterial(glazeKey = currentGlazeIndex, isTieZu = false) {
    const activePlanes = (exhibitionMode === 'cutaway' && clipPlane) ? [clipPlane] : [];

    if (isTieZu) {
        return new THREE.MeshStandardMaterial({
            color: 0x32241b,
            roughness: 0.88,
            metalness: 0.12,
            wireframe: isWireframe,
            side: THREE.DoubleSide,
            clippingPlanes: activePlanes
        });
    }

    const cfg = glazePalettes[glazeKey] || glazePalettes.tianqing;
    const opt = cfg.optics || {};
    const gHelper = window.__TQ__ && window.__TQ__.core && window.__TQ__.core.glaze;
    const matOptions = {
        color: cfg.color,
        emissive: cfg.emissive,
        roughness: customPbrOverride.roughness !== null ? customPbrOverride.roughness : cfg.roughness,
        metalness: cfg.metalness,
        clearcoat: customPbrOverride.clearcoat !== null ? customPbrOverride.clearcoat : cfg.clearcoat,
        clearcoatRoughness: cfg.clearcoatRoughness,
        ior: customPbrOverride.ior !== null ? customPbrOverride.ior : cfg.ior,
        reflectivity: cfg.reflectivity,
        envMap: envMapTexture,
        envMapIntensity: 0.96,
        wireframe: isWireframe,
        side: THREE.DoubleSide,
        clippingPlanes: activePlanes,
        clipShadows: true
    };

    if (glazeKey === 'qinghua') {
        matOptions.map = getQinghuaTexture();
    } else if (glazeKey === 'jianhei') {
        matOptions.map = getJianYaobianTexture();
    } else if (glazeKey === 'junhong') {
        matOptions.map = getJunYaobianTexture();
    } else if (glazeKey === 'dingbai') {
        const ding = getDingCarvedBundle();
        matOptions.bumpMap = ding.bumpMap;
        matOptions.bumpScale = 0.016;
    }

    if (showCrackle && !['qinghua', 'jianhei'].includes(glazeKey)) {
        const crackle = getCrackleTextureBundle(glazeKey);
        if (crackle) {
            if (crackle.colorMap && ['tianqing', 'geyao', 'fenqing', 'yuebai'].includes(glazeKey)) {
                matOptions.map = crackle.colorMap;
            }
            matOptions.bumpMap = crackle.bumpMap;
            matOptions.bumpScale = (glazeKey === 'geyao') ? 0.022 : 0.013;
        }
    }
    if (gHelper && !matOptions.normalMap && opt.orangePeelStrength) {
        matOptions.normalMap = gHelper.getOrangePeelNormalMap();
        const s = opt.orangePeelStrength;
        matOptions.normalScale = new THREE.Vector2(s, s);
    }

    const mat = new THREE.MeshPhysicalMaterial(matOptions);
    if (gHelper) gHelper.enhancePorcelainMaterial(mat, opt, { minY: 0, height: 2.15 });
    return mat;
}

/**
 * 辅助函数：通过控制点生成高密度平滑样条双壁旋转几何体
 */
function createSmoothVesselLathe(outerPts, RadialModFn = null, radialSegments = 64) {
    const fullPts = [...outerPts];
    const wallThickness = 0.038;

    for (let i = outerPts.length - 2; i >= 1; i--) {
        const pt = outerPts[i];
        const innerR = Math.max(0.02, pt.x - wallThickness * (1 + (1 - i / outerPts.length) * 0.45));
        fullPts.push(new THREE.Vector2(innerR, pt.y + 0.02));
    }
    fullPts.push(new THREE.Vector2(0.0, outerPts[0].y + 0.05));

    const spline = new THREE.SplineCurve(fullPts);
    const sampledPoints = spline.getPoints(54);
    const geo = new THREE.LatheGeometry(sampledPoints, radialSegments);

    if (typeof RadialModFn === 'function') {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            const angle = Math.atan2(z, x);
            const r = Math.hypot(x, z);
            const factor = RadialModFn(angle, y, r);
            pos.setX(i, x * factor);
            pos.setZ(i, z * factor);
        }
        geo.computeVertexNormals();
    }

    return geo;
}

/**
 * 展馆加载与点云装载微提示
 */
function showStageLoadingToast(show, text = '') {
    let toast = document.getElementById('three-model-loading-pill');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'three-model-loading-pill';
        toast.className = 'three-model-loading-pill';
        const container = document.getElementById('three-stage-container');
        if (container) container.appendChild(toast);
    }
    if (show) {
        toast.innerHTML = `<span class="pulse-celadon-ring"></span><span>${text}</span>`;
        toast.style.display = 'flex';
        toast.style.opacity = '1';
    } else {
        toast.style.opacity = '0';
        setTimeout(() => { if (toast) toast.style.display = 'none'; }, 300);
    }
}

/**
 * 按需加载对照标本模型（Poly Haven CC0 glTF，独立文件，按需请求）
 */
const scannedModelLoading = {};
function loadSingleScannedGLTFOnDemand(key, modelIndex) {
    const meta = scannedModelsMeta[modelIndex];
    if (!meta || scannedModelCache[key] || scannedModelLoading[key]) return;
    scannedModelLoading[key] = true;
    showStageLoadingToast(true, '正在载入对照标本模型…');
    const loader = new THREE.GLTFLoader();
    loader.load(meta.path, (gltf) => {
        scannedModelLoading[key] = false;
        showStageLoadingToast(false);
        if (gltf && gltf.scene) {
            scannedModelCache[key] = gltf.scene;
            if (currentModelIndex === modelIndex) loadPorcelainModel(currentModelIndex, true);
        }
    }, undefined, (err) => {
        scannedModelLoading[key] = false;
        showStageLoadingToast(false);
        console.warn('[对照标本模型加载失败] ' + key + ':', err);
    });
}

/**
 * 闲时后台温和预热其余扫描模型，彻底避免主线程丢帧
 */
/**
 * 展厅模式下动态无缝升级展柜中的瓷器网格
 */
function updateHallVitrineModel(targetIdx) {
    if (!hallGroup || exhibitionMode !== 'hall') return;
    hallGroup.children.forEach(booth => {
        if (booth.userData && booth.userData.vitrineIndex === targetIdx) {
            const oldMeshGroups = [];
            booth.children.forEach(c => {
                if (c.userData && c.userData.vitrineIndex === targetIdx && c !== booth && c.type === 'Group') {
                    oldMeshGroups.push(c);
                }
            });
            oldMeshGroups.forEach(og => {
                booth.remove(og);
                disposeGroup(og);
            });
            const mData = porcelainModelsData[targetIdx];
            const newGroup = buildGeometry(targetIdx, mData ? mData.defaultGlaze : null);
            newGroup.scale.set(0.50, 0.50, 0.50);
            newGroup.position.y = 0.12;
            newGroup.traverse(c => { c.userData = { vitrineIndex: targetIdx }; });
            booth.add(newGroup);
        }
    });
}

/**
 * 闲时后台温和预热全部国宝三维资产到缓存，彻底实现点击 0ms 秒切无感知
 */
function scheduleBackgroundModelPreload() {
    const preloadList = [1, 2, 3, 4, 5, 6, 7];
    let pos = 0;

    function preloadStep() {
        if (pos >= preloadList.length) return;
        const targetIdx = preloadList[pos++];
        if (masterTreasuresCache[targetIdx]) {
            preloadStep();
            return;
        }
        loadSingleMasterTreasure(targetIdx, () => {
            if (exhibitionMode === 'hall') {
                updateHallVitrineModel(targetIdx);
            }
            setTimeout(preloadStep, 100);
        }, false);
    }

    // 延迟 600ms 等待首屏主画面完全渲染并稳定后，空闲时自动排队拉取
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => { setTimeout(preloadStep, 600); });
    } else {
        setTimeout(preloadStep, 900);
    }
}

/**
 * 兼容旧接口：温和调用后台调度
 */
function preloadScannedGLTFModels() {
    scheduleBackgroundModelPreload();
}

/**
 * 为国宝三维资产打造文博级温润玉质 PBR 物理材质 (杜绝塑料感，还原双层清漆与立体纹样)
 */
function createMuseumMasterpieceMaterial(childMesh, typeIndex, customGlaze, activePlanes, getGlazeMat) {
    const origMaterial = childMesh.material;
    const isCutaway = activePlanes && activePlanes.length > 0;

    // 如果用户手动在左侧釉色盘选择了自选釉色 (如雨过天青/玫瑰紫/曜变黑)
    if (customGlaze || !useScannedOriginalTex || !origMaterial) {
        const mat = getGlazeMat().clone();
        mat.side = isCutaway ? THREE.DoubleSide : THREE.FrontSide;
        mat.shadowSide = THREE.FrontSide;
        mat.clippingPlanes = activePlanes;
        mat.clipShadows = isCutaway;
        return mat;
    }

    // 优先基于原模型内嵌的 2K 文保级真彩贴图构建高阶 MeshPhysicalMaterial
    const pbrOptions = {
        roughness: customPbrOverride.roughness !== null
            ? customPbrOverride.roughness
            : (typeIndex === 3 ? 0.16 : (typeIndex === 6 ? 0.08 : (typeIndex === 5 ? 0.10 : 0.14))),
        metalness: 0.0, // 严格绝缘介电体，彻底杜绝塑料与金属感
        clearcoat: customPbrOverride.clearcoat !== null ? customPbrOverride.clearcoat : 1.0,
        clearcoatRoughness: 0.03,
        ior: customPbrOverride.ior !== null ? customPbrOverride.ior : 1.54,
        reflectivity: 0.65,
        transmission: 0.0, // 彻底关闭透射，杜绝黑色背景折射穿透与塑料玩具感
        envMap: envMapTexture,
        envMapIntensity: 1.15,
        wireframe: isWireframe,
        side: THREE.DoubleSide,
        shadowSide: THREE.FrontSide,
        clippingPlanes: activePlanes,
        clipShadows: isCutaway
    };

    // 绑定并校正原生真彩贴图 (启用 sRGBEncoding 与各向异性过滤)
    if (origMaterial.map) {
        const tex = origMaterial.map;
        tex.encoding = THREE.sRGBEncoding;
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        if (typeof renderer !== 'undefined' && renderer && renderer.capabilities) {
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
        tex.needsUpdate = true;
        pbrOptions.map = tex;
    }

    // 继承或注入法线/微观开片凹凸贴图
    if (origMaterial.normalMap) {
        pbrOptions.normalMap = origMaterial.normalMap;
        pbrOptions.normalScale = origMaterial.normalScale || new THREE.Vector2(1, 1);
    } else {
        // 针对官窑、汝窑、哥窑、定窑注入立体微观开片或刀刻凹凸
        if (typeIndex === 0 || typeIndex === 3) {
            // 官窑/哥窑：金丝铁线百圾碎立体凹凸
            const crackle = getCrackleTextureBundle();
            pbrOptions.bumpMap = crackle.bumpMap;
            pbrOptions.bumpScale = (typeIndex === 3) ? 0.026 : 0.016;
        } else if (typeIndex === 1) {
            // 汝窑：蟹爪冰裂
            const crackle = getCrackleTextureBundle();
            pbrOptions.bumpMap = crackle.bumpMap;
            pbrOptions.bumpScale = 0.012;
        } else if (typeIndex === 2) {
            // 定窑：刻花浅浮雕刀痕
            const ding = getDingCarvedBundle();
            pbrOptions.bumpMap = ding.bumpMap;
            pbrOptions.bumpScale = 0.022;
        }
    }

    return new THREE.MeshPhysicalMaterial(pbrOptions);
}

/**
 * 构建十二大传世馆藏高精度 3D 模型 (0~6 程序化建模，7~11 实测三维扫描 GLTF 模型)
 */
function buildGeometry(typeIndex, customGlaze = null) {
    const group = new THREE.Group();
    const gKey = customGlaze || currentGlazeIndex;

    // 材质懒加载辅助：针对 0~7 号内嵌 2K 真彩贴图国宝，彻底跳过主线程昂贵的 Voronoi 冰裂纹 Canvas 循环
    let _glazeMat = null;
    const getGlazeMat = () => {
        if (!_glazeMat) _glazeMat = getPorcelainMaterial(gKey, false);
        return _glazeMat;
    };
    let _tiezuMat = null;
    const getTiezuMat = () => {
        if (!_tiezuMat) _tiezuMat = getPorcelainMaterial(gKey, true);
        return _tiezuMat;
    };
    const activePlanes = (exhibitionMode === 'cutaway' && clipPlane) ? [clipPlane] : [];
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af6a,
        roughness: 0.25,
        metalness: 0.88,
        clippingPlanes: activePlanes
    });

    // 优先分发处理传世国宝 1:1 三维高精烘焙资产 (0~7 与 13~14)
    if (masterTreasuresMeta[typeIndex]) {
        const meta = masterTreasuresMeta[typeIndex];
        const cachedScene = masterTreasuresCache[typeIndex];
        if (cachedScene) {
            const cloned = cachedScene.clone(true);
            cloned.scale.set(meta.scale, meta.scale, meta.scale);
            // 原点严格锁定底足接地中心 (0, 0, 0)，直接置于几案 Y=0
            cloned.position.set(0, 0, 0);

            cloned.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // 保留原装高精法线，避免强制重算导致硬折棱线发黑撕裂
                    if (!child.geometry || !child.geometry.attributes.normal) {
                        if (child.geometry) child.geometry.computeVertexNormals();
                    }

                    if (child.material) {
                        // 优先保护并使用 GLB 内嵌的真彩烘焙贴图，同时叠加物理釉层着色器增强（积釉、紫口铁足、虹彩、橘皮）
                        if (!customGlaze && (child.material.map || child.material.name.includes('M_') || child.material.name.includes('True') || child.material.name.includes('Master') || child.material.name.includes('Ultra') || child.material.name.includes('Porcelain') || child.material.name.includes('GuanYao') || child.material.name.includes('RuYao') || child.material.name.includes('JunYao') || child.material.name.includes('Xuande') || child.material.name.includes('Qianlong') || child.material.name.includes('QingHua') || child.material.name.includes('JianYao') || child.material.name.includes('Longquan'))) {
                            const gHelper = window.__TQ__ && window.__TQ__.core && window.__TQ__.core.glaze;
                            const mInfo = porcelainModelsData[typeIndex] || {};
                            const gCfg = glazePalettes[mInfo.defaultGlaze || 'tianqing'] || {};
                            const opt = gCfg.optics || {};
                            const matName = (child.material.name || '').toLowerCase();
                            const isMetalPart = matName.includes('gold') || matName.includes('metal');

                            // 为 4~7 号原贴图失真器物（钧窑迷彩/元青花蓝点/霁红塑料/洋彩贴块）替换博物馆级高清物理贴图
                            if (!isMetalPart && (typeIndex === 4 || typeIndex === 5 || typeIndex === 6 || typeIndex === 7)) {
                                const museumMap = typeIndex === 4
                                    ? getJunYaobianTexture()
                                    : typeIndex === 5
                                        ? getQinghuaTexture()
                                        : typeIndex === 6
                                            ? getXuandeJihongTexture()
                                            : getQianlongYangcaiTexture();
                                if (museumMap) {
                                    museumMap.flipY = false;
                                    museumMap.needsUpdate = true;
                                    child.material.map = museumMap;
                                    if (child.material.color) child.material.color.setHex(0xffffff);
                                }
                            }

                            child.material.envMap = envMapTexture;
                            child.material.envMapIntensity = 0.88;
                            if (child.material.roughnessMap && typeIndex < 4) {
                                child.material.roughness = 0.95;
                            } else {
                                child.material.roughness = typeof gCfg.roughness === 'number' ? gCfg.roughness : 0.14;
                            }
                            if (child.material.normalMap) {
                                child.material.normalScale.set(0.95, 0.95);
                            } else if (gHelper && !isMetalPart && opt.orangePeelStrength) {
                                child.material.normalMap = gHelper.getOrangePeelNormalMap();
                                child.material.normalScale = new THREE.Vector2(opt.orangePeelStrength, opt.orangePeelStrength);
                            }
                            if (!isMetalPart) {
                                child.material.metalness = 0.0;
                            }
                            child.material.clearcoat = isMetalPart ? 0.5 : (typeof gCfg.clearcoat === 'number' ? gCfg.clearcoat : 0.96);
                            child.material.clearcoatRoughness = typeof gCfg.clearcoatRoughness === 'number' ? gCfg.clearcoatRoughness : 0.06;
                            child.material.clippingPlanes = activePlanes;
                            child.material.clipShadows = true;
                            child.material.side = THREE.DoubleSide;
                            if (gHelper && !isMetalPart && child.geometry) {
                                if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                                const bb = child.geometry.boundingBox;
                                gHelper.enhancePorcelainMaterial(child.material, opt, {
                                    minY: bb ? bb.min.y : 0,
                                    height: bb ? Math.max(0.05, bb.max.y - bb.min.y) : 0.23
                                });
                            }
                            child.material.needsUpdate = true;
                        } else {
                            // 用户手动切换釉色实验时，按当前器物本地坐标范围注入积釉与紫口铁足
                            const mat = getGlazeMat().clone();
                            const gHelper = window.__TQ__ && window.__TQ__.core && window.__TQ__.core.glaze;
                            const opt = (glazePalettes[gKey] && glazePalettes[gKey].optics) || {};
                            mat.side = THREE.DoubleSide;
                            mat.clippingPlanes = activePlanes;
                            mat.clipShadows = true;
                            if (gHelper && child.geometry) {
                                if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                                const bb = child.geometry.boundingBox;
                                gHelper.enhancePorcelainMaterial(mat, opt, {
                                    minY: bb ? bb.min.y : 0,
                                    height: bb ? Math.max(0.05, bb.max.y - bb.min.y) : 0.23
                                });
                            }
                            child.material = mat;
                        }
                    }
                }
            });
            group.add(cloned);
        } else {
            // 彻底杜绝遮罩阻断与转圈等待：0ms 瞬间生成文博级程序化器物孪生体上台渲染！
            loadSingleMasterTreasure(typeIndex, (cachedScene) => {
                if (currentModelIndex === typeIndex && exhibitionMode !== 'hall') {
                    loadPorcelainModel(typeIndex, true);
                    hideThreeStageLoader();
                }
            }, (typeIndex === currentModelIndex));

            // 根据器物特征生成对应的程序化温润骨架
            let fbPts;
            if (typeIndex === 1 || typeIndex === 13) { // 莲花碗 / 建盏茶碗
                fbPts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.42, 0), new THREE.Vector2(0.72, 0.45), new THREE.Vector2(0.95, 0.95)];
            } else if (typeIndex === 2) { // 梅瓶
                fbPts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.35, 0), new THREE.Vector2(0.55, 1.2), new THREE.Vector2(0.68, 1.8), new THREE.Vector2(0.30, 2.2), new THREE.Vector2(0.20, 2.35)];
            } else if (typeIndex === 4) { // 出戟尊
                fbPts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.45, 0), new THREE.Vector2(0.58, 0.8), new THREE.Vector2(0.42, 1.4), new THREE.Vector2(0.70, 2.2)];
            } else if (typeIndex === 5) { // 青花罐
                fbPts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.48, 0), new THREE.Vector2(0.78, 0.8), new THREE.Vector2(0.85, 1.3), new THREE.Vector2(0.55, 1.85)];
            } else { // 0号八方贯耳瓶及标准立件
                fbPts = [
                    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.32, 0),
                    new THREE.Vector2(0.48, 0.6), new THREE.Vector2(0.36, 1.5),
                    new THREE.Vector2(0.28, meta.targetHeight || 2.15)
                ];
            }
            const fbGeo = createSmoothVesselLathe(fbPts, (typeIndex === 0 ? (a, y) => 1.0 + Math.cos(a * 8) * 0.04 : null), 48);
            const fbMesh = new THREE.Mesh(fbGeo, getGlazeMat());
            fbMesh.castShadow = fbMesh.receiveShadow = true;
            group.add(fbMesh);
        }
    } else if (typeIndex >= 8 && typeIndex <= 12) {
        // 对照标本：第三方 CC0 glTF 模型（归一化尺寸并落在展台上）
        const sKey = (scannedModelsMeta[typeIndex] || {}).key;
        const cachedScene = scannedModelCache[sKey];
        if (cachedScene) {
            const cloned = cachedScene.clone(true);
            const box = new THREE.Box3().setFromObject(cloned);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetHeight = 2.25;
            const scaleFactor = (maxDim > 0) ? (targetHeight / maxDim) : 5.0;
            cloned.scale.set(scaleFactor, scaleFactor, scaleFactor);

            const scaledBox = new THREE.Box3().setFromObject(cloned);
            const center = new THREE.Vector3();
            scaledBox.getCenter(center);
            cloned.position.x = -center.x;
            cloned.position.z = -center.z;
            cloned.position.y = -scaledBox.min.y;

            cloned.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = child.receiveShadow = true;
                    if (!child.geometry || !child.geometry.attributes.normal) {
                        if (child.geometry) child.geometry.computeVertexNormals();
                    }
                    child.material = createMuseumMasterpieceMaterial(child, typeIndex, customGlaze, activePlanes, getGlazeMat);
                }
            });
            group.add(cloned);
        } else {
            loadSingleScannedGLTFOnDemand(sKey, typeIndex);
            const fallbackPts = [
                new THREE.Vector2(0.0, 0.0), new THREE.Vector2(0.32, 0.0),
                new THREE.Vector2(0.38, 0.30), new THREE.Vector2(0.56, 0.94),
                new THREE.Vector2(0.52, 1.47), new THREE.Vector2(0.26, 1.84),
                new THREE.Vector2(0.34, 2.10), new THREE.Vector2(0.30, 2.12)
            ];
            const fbGeo = createSmoothVesselLathe(fallbackPts, null, 48);
            const fbMesh = new THREE.Mesh(fbGeo, getGlazeMat());
            fbMesh.castShadow = fbMesh.receiveShadow = true;
            group.add(fbMesh);
        }
    }

    // X光胎骨剖面模式下叠加半透明结构网格
    if (exhibitionMode === 'cutaway') {
        const xrayMat = new THREE.MeshBasicMaterial({
            color: 0xd4af6a,
            wireframe: true,
            transparent: true,
            opacity: 0.18
        });
        const meshesToClone = [];
        group.traverse((child) => {
            if (child.isMesh && child.geometry) meshesToClone.push(child);
        });
        meshesToClone.forEach(child => {
            const ghost = new THREE.Mesh(child.geometry.clone(), xrayMat);
            ghost.scale.copy(child.scale);
            ghost.position.copy(child.position);
            ghost.rotation.copy(child.rotation);
            if (child.parent && child.parent !== group) {
                ghost.scale.multiply(child.parent.scale);
                ghost.position.add(child.parent.position);
            }
            group.add(ghost);
        });
    }

    // --- 空间几何基准对齐：GLB 大师资产模型原点已锁定在底足接地圈最底面正中心 ---
    if (masterTreasuresMeta[typeIndex]) {
        group.userData.bottomOffset = 0;
        const b = new THREE.Box3().setFromObject(group);
        group.userData.vesselHeight = (isFinite(b.max.y) && isFinite(b.min.y)) ? (b.max.y - b.min.y) : 2.2;
    } else {
        group.updateMatrixWorld(true);
        const overallBox = new THREE.Box3().setFromObject(group);
        if (isFinite(overallBox.min.y) && isFinite(overallBox.max.y)) {
            const bottomY = overallBox.min.y;
            group.children.forEach(c => {
                c.position.y -= bottomY;
            });
            group.userData.bottomOffset = bottomY;
            group.userData.vesselHeight = overallBox.max.y - overallBox.min.y;
        }
    }

    return group;
}

/**
 * 构建真实 3D 室内环境场景 (宋代玄青金碧屏风 + 紫檀束腰几案 + 博山香炉青烟 + 轩窗丁达尔光束)
 */
const envLoader = new THREE.GLTFLoader();

let roomStudioGroup = null; // 宋代雅室专属构件 (紫檀束腰几案 + 青铜博山炉香薰 + 千里江山泥金围屏)
let roomPalaceGroup = null; // 文博殿堂专属构件 (现代国家级特展微晶展台)
let roomKilnGroup = null;   // 御窑幽室专属构件 (粗砺青砖古窑原址展台)
roomFloorMesh = null;
roomTableMesh = null;
let roomCenserMesh = null;
roomScreenMesh = null;
let roomPalacePedestal = null;
let roomKilnPedestal = null;

const TABLE_SURFACE_Y = -1.125; // 严格锁定器物底座与几案/展台表面基准线 (绝对杜绝穿模与悬空)

function createRealistic3DEnvironment() {
    if (realisticRoomGroup) {
        scene.remove(realisticRoomGroup);
        disposeGroup(realisticRoomGroup);
    }
    realisticRoomGroup = new THREE.Group();
    realisticRoomGroup.name = 'Realistic3DRoom';

    // 0. 展厅地面 (基准地面位于几案脚底 Y = -1.908)
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x141a1e, roughness: 0.82, metalness: 0.08 });
    roomFloorMesh = new THREE.Mesh(floorGeo, floorMat);
    roomFloorMesh.rotation.x = -Math.PI / 2;
    roomFloorMesh.position.y = TABLE_SURFACE_Y - 0.783; // -1.908
    roomFloorMesh.receiveShadow = true;
    realisticRoomGroup.add(roomFloorMesh);

    // ========================================================
    // 场景 A：【宋代雅室】专属构件组（延后与主展器物错峰加载，保障首屏带宽优先级）
    // ========================================================
    roomStudioGroup = new THREE.Group();
    roomStudioGroup.name = 'StudioEnvGroup';

    let envPropsStarted = false;
    window._loadStudioEnvProps = () => {
        if (envPropsStarted) return;
        envPropsStarted = true;
        envLoader.load('models/environment/rosewood_table.glb', (gltf) => {
            const table = gltf.scene;
            table.position.set(0, TABLE_SURFACE_Y - 0.783, 0);
            table.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = !IS_MOBILE_PERF;
                    child.receiveShadow = !IS_MOBILE_PERF;
                }
            });
            roomStudioGroup.add(table);
            roomTableMesh = table;
        });

        // 移动端跳过 300KB/7k面的装饰香炉以释放弱网带宽与移动 GPU 顶点预算；桌面保持完整雅室道具
        if (!IS_MOBILE_PERF) {
            envLoader.load('models/environment/bronze_censer.glb', (gltf) => {
                const censer = gltf.scene;
                censer.position.set(-0.55, TABLE_SURFACE_Y, -0.22);
                censer.scale.set(0.85, 0.85, 0.85);
                censer.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                roomStudioGroup.add(censer);
                roomCenserMesh = censer;
            });
        }

        if (!(window.VisualFX && window.VisualFX.screen)) {
            envLoader.load('models/environment/scholar_screen.glb', (gltf) => {
                const screen = gltf.scene;
                screen.position.set(0, TABLE_SURFACE_Y - 0.783, -1.85);
                screen.scale.set(1.22, 1.22, 1.22);
                screen.traverse((child) => {
                    if (child.isMesh) {
                        child.receiveShadow = true;
                    }
                });
                roomStudioGroup.add(screen);
                roomScreenMesh = screen;
            });
        }
    };

    realisticRoomGroup.add(roomStudioGroup);

    // ========================================================
    // 场景 B：【文博殿堂】专属构件组 (现代国家特展高级微晶石八角柱展台，顶端 Y = -1.125)
    // ========================================================
    roomPalaceGroup = new THREE.Group();
    roomPalaceGroup.name = 'PalaceEnvGroup';

    // 现代特展微晶黑石柱展台 (高 0.783，顶表面 Y = -1.125，底 Y = -1.908)
    const palacePedGeo = new THREE.CylinderGeometry(0.72, 0.76, 0.783, 8);
    const palacePedMat = new THREE.MeshStandardMaterial({
        color: 0x12151a,
        roughness: 0.22,
        metalness: 0.15
    });
    roomPalacePedestal = new THREE.Mesh(palacePedGeo, palacePedMat);
    roomPalacePedestal.position.set(0, TABLE_SURFACE_Y - 0.783 / 2, 0); // 中心在 -1.5165，顶端在 -1.125
    roomPalacePedestal.receiveShadow = true;
    roomPalacePedestal.castShadow = true;

    // 顶部哑光香槟金包边
    const palaceGoldRim = new THREE.Mesh(
        new THREE.RingGeometry(0.68, 0.725, 8),
        new THREE.MeshStandardMaterial({ color: 0xd4af6a, roughness: 0.32, metalness: 0.85 })
    );
    palaceGoldRim.rotation.x = -Math.PI / 2;
    palaceGoldRim.position.set(0, TABLE_SURFACE_Y + 0.001, 0);
    roomPalaceGroup.add(roomPalacePedestal);
    roomPalaceGroup.add(palaceGoldRim);

    realisticRoomGroup.add(roomPalaceGroup);

    // ========================================================
    // 场景 C：【御窑幽室】专属构件组 (粗砺青砖窑台，顶端 Y = -1.125)
    // ========================================================
    roomKilnGroup = new THREE.Group();
    roomKilnGroup.name = 'KilnEnvGroup';

    const kilnPedGeo = new THREE.BoxGeometry(1.35, 0.783, 1.35);
    const kilnPedMat = new THREE.MeshStandardMaterial({
        color: 0x1e100b,
        roughness: 0.88,
        metalness: 0.05
    });
    roomKilnPedestal = new THREE.Mesh(kilnPedGeo, kilnPedMat);
    roomKilnPedestal.position.set(0, TABLE_SURFACE_Y - 0.783 / 2, 0);
    roomKilnPedestal.receiveShadow = true;
    roomKilnPedestal.castShadow = true;
    roomKilnGroup.add(roomKilnPedestal);

    realisticRoomGroup.add(roomKilnGroup);

    scene.add(realisticRoomGroup);
    switchRealisticSceneEnv(currentRoomEnv, false);
}

function createInspectorStage() {
    pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);
    createRealistic3DEnvironment();

    // 柔和地面接触阴影，让器物扎实落在几案/展台上
    contactShadowMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.68, 48),
        new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: 'varying vec2 vUv; void main(){ float d = distance(vUv, vec2(0.5)) * 2.0; float a = smoothstep(1.0, 0.12, d) * 0.52; gl_FragColor = vec4(0.02, 0.03, 0.04, a); }'
        })
    );
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.set(0, TABLE_SURFACE_Y + 0.002, 0);
    scene.add(contactShadowMesh);

    const pCount = 120;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
        const r = 0.8 + Math.random() * 3.8;
        const theta = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = -1.2 + Math.random() * 4.2;
        positions[i * 3 + 2] = Math.sin(theta) * r;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0xe5c888,
        size: 0.03,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);
}

function switchRealisticSceneEnv(envKey, showNotice = true) {
    currentRoomEnv = envKey;
    if (!scene || !realisticRoomGroup) return;
    const lightLabel = document.getElementById('light-preset-name');
    const envCfg = (gallerySceneConfig && gallerySceneConfig.environments && gallerySceneConfig.environments[envKey]) || null;
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

    // 核心场景独立隔离：只有【宋代雅室】显示紫檀束腰几案与博山炉，殿堂与御窑切换专属展台
    if (roomStudioGroup) roomStudioGroup.visible = (envKey === 'studio');
    if (roomPalaceGroup) roomPalaceGroup.visible = (envKey === 'palace');
    if (roomKilnGroup) roomKilnGroup.visible = (envKey === 'kiln');

    if (envCfg) {
        if (renderer && envCfg.exposure) {
            renderer.toneMappingExposure = isDarkTheme ? envCfg.exposure.dark : envCfg.exposure.light;
        }
        if (ambientLight && envCfg.ambient) {
            ambientLight.color.set(envCfg.ambient.color);
            ambientLight.intensity = envCfg.ambient.intensity;
        }
        if (lightMain && envCfg.key) {
            lightMain.color.set(envCfg.key.color);
            lightMain.intensity = envCfg.key.intensity;
            if (Array.isArray(envCfg.key.position)) lightMain.position.set(...envCfg.key.position);
        }
        if (lightFill && envCfg.fill) {
            lightFill.color.set(envCfg.fill.color);
            lightFill.intensity = envCfg.fill.intensity;
            if (Array.isArray(envCfg.fill.position)) lightFill.position.set(...envCfg.fill.position);
        }
        if (lightRim && envCfg.rim) {
            lightRim.color.set(envCfg.rim.color);
            lightRim.intensity = envCfg.rim.intensity;
            if (Array.isArray(envCfg.rim.position)) lightRim.position.set(...envCfg.rim.position);
        }
        if (topSpotLight) {
            topSpotLight.intensity = envKey === 'palace' ? 0.62 : 0.38;
        }
        if (lightLabel && envCfg.label) {
            lightLabel.textContent = envCfg.label.zh || envKey;
        }
    }

    if (envKey === 'studio') {
        scene.background = new THREE.Color(0x1b272d);
        if (scene.fog) scene.fog.color.setHex(0x162026);
        if (roomFloorMesh) {
            roomFloorMesh.material.color.setHex(0x182126);
            roomFloorMesh.material.roughness = 0.82;
            roomFloorMesh.material.metalness = 0.08;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (showNotice && typeof showToast === 'function') {
            showToast('已切换至【宋代雅室】展陈灯光');
        }
    } else if (envKey === 'palace') {
        scene.background = new THREE.Color(0x070b10);
        if (scene.fog) scene.fog.color.setHex(0x070b10);
        if (roomFloorMesh) {
            roomFloorMesh.material.color.setHex(0x090c10);
            roomFloorMesh.material.roughness = 0.16;
            roomFloorMesh.material.metalness = 0.22;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (showNotice && typeof showToast === 'function') {
            showToast('已切换至【文博殿堂】特展聚光灯');
        }
    } else if (envKey === 'kiln') {
        scene.background = new THREE.Color(0x140704);
        if (scene.fog) scene.fog.color.setHex(0x140704);
        if (roomFloorMesh) {
            roomFloorMesh.material.color.setHex(0x1a0906);
            roomFloorMesh.material.roughness = 0.88;
            roomFloorMesh.material.metalness = 0.04;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (showNotice && typeof showToast === 'function') {
            showToast('已切换至【御窑幽室】柴窑暖光');
        }
    }

    ['studio', 'palace', 'kiln'].forEach(k => {
        const btn = document.getElementById(`scene-env-btn-${k}`);
        if (btn) btn.classList.toggle('active', k === envKey);
    });
}

function toggleRealisticScene() {
    showRealisticScene = !showRealisticScene;
    if (realisticRoomGroup) {
        realisticRoomGroup.visible = showRealisticScene && (exhibitionMode !== 'hall');
    }
    const btn = document.getElementById('btn-room-scene-toggle');
    if (btn) btn.classList.toggle('active', showRealisticScene);
    if (typeof showToast === 'function') {
        showToast(showRealisticScene ? '🏛️ 已开启【3D 真实室内环境场景】' : '已切换为【极简暗夜独立展台】');
    }
}

/**
 * 构建【3D 全景数字博物馆九柜大展厅】
 */
function buildVirtualMuseumHall() {
    if (hallGroup) {
        scene.remove(hallGroup);
        disposeGroup(hallGroup);
    }
    hallGroup = new THREE.Group();
    hallGroup.visible = (exhibitionMode === 'hall');

    const floorGeo = new THREE.CylinderGeometry(14.5, 14.5, 0.1, 96);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0b1015, roughness: 0.16, metalness: 0.38 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -1.45;
    floorMesh.receiveShadow = true;
    hallGroup.add(floorMesh);

    const compassGold = new THREE.MeshStandardMaterial({ color: 0xc5a059, roughness: 0.3, metalness: 0.85 });
    [2.8, 6.2, 9.4, 12.2].forEach(rad => {
        const rMesh = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.02, 12, 96), compassGold);
        rMesh.rotation.x = Math.PI / 2;
        rMesh.position.y = -1.39;
        hallGroup.add(rMesh);
    });

    const colGeo = new THREE.CylinderGeometry(0.22, 0.25, 6.4, 24);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x18222a, roughness: 0.4, metalness: 0.3 });
    for (let c = 0; c < 12; c++) {
        const ang = (c / 12) * Math.PI * 2;
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(Math.cos(ang) * 11.2, 1.75, Math.sin(ang) * 11.2);
        hallGroup.add(col);
    }

    const arcRadius = 6.2;
    const totalCount = porcelainModelsData.length;
    for (let idx = 0; idx < totalCount; idx++) {
        const mData = porcelainModelsData[idx];
        const angle = ((idx - (totalCount - 1) / 2) / (totalCount - 1)) * (Math.PI * 1.32);
        const vx = Math.sin(angle) * arcRadius;
        const vz = -Math.cos(angle) * arcRadius + 2.0;

        const booth = new THREE.Group();
        booth.position.set(vx, 0, vz);
        booth.lookAt(0, 0, 2.5);
        booth.userData = { vitrineIndex: idx };

        const podium = new THREE.Mesh(
            new THREE.CylinderGeometry(0.78, 0.88, 0.9, 48),
            new THREE.MeshStandardMaterial({ color: 0x141c24, roughness: 0.3, metalness: 0.25 })
        );
        podium.position.y = -0.95;
        podium.userData = { vitrineIndex: idx };
        booth.add(podium);

        const podiumGold = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.015, 12, 48), compassGold);
        podiumGold.rotation.x = Math.PI / 2;
        podiumGold.position.y = -0.50;
        booth.add(podiumGold);

        const glassBell = new THREE.Mesh(
            new THREE.CylinderGeometry(0.75, 0.75, 1.85, IS_MOBILE_PERF ? 20 : 36, 1, true),
            IS_MOBILE_PERF
                ? new THREE.MeshStandardMaterial({
                    color: 0xd8f0f5,
                    transparent: true,
                    opacity: 0.14,
                    roughness: 0.16,
                    metalness: 0.05
                })
                : new THREE.MeshPhysicalMaterial({
                    color: 0xd8f0f5,
                    transparent: true,
                    opacity: 0.13,
                    roughness: 0.05,
                    metalness: 0.05,
                    clearcoat: 1.0
                })
        );
        glassBell.position.y = 0.42;
        glassBell.userData = { vitrineIndex: idx };
        booth.add(glassBell);

        const vBeam = new THREE.Mesh(
            new THREE.ConeGeometry(0.88, 3.2, 24, 1, true),
            new THREE.MeshBasicMaterial({
                color: idx === currentModelIndex ? 0xe5c888 : 0x8fb8c0,
                transparent: true,
                opacity: idx === currentModelIndex ? 0.09 : 0.035,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        vBeam.position.y = 1.6;
        booth.add(vBeam);

        const vesselMeshGroup = buildGeometry(idx, mData.defaultGlaze);
        vesselMeshGroup.scale.set(0.50, 0.50, 0.50);
        vesselMeshGroup.position.y = 0.12;
        vesselMeshGroup.traverse(c => { c.userData = { vitrineIndex: idx }; });
        booth.add(vesselMeshGroup);

        hallGroup.add(booth);
    }

    scene.add(hallGroup);
}

/**
 * 初始化 3D 研鉴展馆
 */
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b1116);
        scene.fog = new THREE.FogExp2(0x0b1116, 0.042);

        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 580;
        camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        camera.position.set(0, 0.95, 3.55);

        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !IS_MOBILE_PERF,
            alpha: false,
            preserveDrawingBuffer: !IS_MOBILE_PERF, // 桌面支持快照直接读取；移动端释放 TBDR 帧缓冲回写，导出前同步重绘一帧
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_MOBILE_PERF ? 1.1 : 1.5));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.98;
        renderer.shadowMap.enabled = !IS_MOBILE_PERF;
        if (!IS_MOBILE_PERF) {
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        renderer.localClippingEnabled = false;

        clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipOffset);

        const cubeEnvFn = window.__TQ__ && window.__TQ__.core && window.__TQ__.core.glaze && window.__TQ__.core.glaze.createStudioCubeEnv;
        const fastEnv = typeof cubeEnvFn === 'function' ? cubeEnvFn() : createStudioEnvironment();
        if (fastEnv) {
            envMapTexture = fastEnv;
            scene.environment = envMapTexture;
        }

        ambientLight = new THREE.AmbientLight(0xdbe8ec, IS_MOBILE_PERF ? 0.85 : 0.72);
        scene.add(ambientLight);

        lightMain = new THREE.DirectionalLight(0xfff6e8, IS_MOBILE_PERF ? 2.0 : 1.85);
        lightMain.position.set(3.2, 5.2, 4.0);
        lightMain.castShadow = !IS_MOBILE_PERF;
        if (!IS_MOBILE_PERF) {
            lightMain.shadow.mapSize.width = 1024;
            lightMain.shadow.mapSize.height = 1024;
            lightMain.shadow.bias = -0.0002;
            lightMain.shadow.normalBias = 0.035;
        }
        scene.add(lightMain);

        lightFill = new THREE.DirectionalLight(0x88b8c8, IS_MOBILE_PERF ? 1.05 : 0.95);
        lightFill.position.set(-3.8, 2.2, -2.5);
        scene.add(lightFill);

        // 移动端省略 PointLight / SpotLight 以削减片元循环光照 Shader 编译耗时，依托 CubeTexture 与双主灯保证质感
        lightRim = new THREE.PointLight(0xffe4b5, 0.95, 14);
        lightRim.position.set(0, 3.8, -3.2);
        topSpotLight = new THREE.SpotLight(0xffffff, 1.35, 15, Math.PI / 5, 0.65, 1.5);
        topSpotLight.position.set(0, 5.5, 0.5);
        if (!IS_MOBILE_PERF) {
            scene.add(lightRim);
            scene.add(topSpotLight);
        }

        createInspectorStage();
        let envPropsQueued = false;
        const triggerEnvProps = () => {
            if (envPropsQueued) return;
            if (IS_MOBILE_PERF && typeof isCanvasVisible !== 'undefined' && !isCanvasVisible) return;
            envPropsQueued = true;
            if (typeof window._loadStudioEnvProps === 'function') window._loadStudioEnvProps();
        };
        if (IS_MOBILE_PERF) {
            // 移动端只在停留 3D 展馆后延后拉取环境道具，优先把带宽留给页面图片
            preloadMasterTreasures(() => setTimeout(triggerEnvProps, 2200));
        } else {
            preloadMasterTreasures(triggerEnvProps);
            setTimeout(triggerEnvProps, 4500);
        }
        loadPorcelainModel(0);
        // 彻底取消首屏并发争抢：其余模型由鼠标意图悬停与空闲低频调度按需装载
        // scheduleBackgroundModelPreload();

        setupControls(canvas);
        window.addEventListener('resize', handleThreeResize);
        setupVisibilityObserver(canvas);

        canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            isCanvasVisible = false;
            const stage = document.getElementById('three-stage-container');
            if (stage && !stage.querySelector('.webgl-lost-banner')) {
                const banner = document.createElement('div');
                banner.className = 'webgl-lost-banner';
                banner.setAttribute('role', 'status');
                banner.innerHTML = '<span>WebGL 三维图形上下文已暂停，正在等待恢复…</span>' +
                    '<button type="button" data-action="reloadPage()">重新加载展台</button>';
                stage.appendChild(banner);
            }
        });

        canvas.addEventListener('webglcontextrestored', () => {
            const stage = document.getElementById('three-stage-container');
            const banner = stage && stage.querySelector('.webgl-lost-banner');
            if (banner) banner.remove();
            isCanvasVisible = !document.hidden;
            if (isCanvasVisible) {
                requestAnimationFrame(typeof window.animate === 'function' ? window.animate : animate);
            }
        });

        const stageLoader = document.getElementById('three-stage-loader');
        if (stageLoader) {
            stageLoader.style.opacity = '0';
            setTimeout(() => { stageLoader.style.display = 'none'; }, 400);
        }

        animate();
    } catch (err) {
        console.warn('[ThreeJS 研鉴空间] 初始化异常:', err);
    }
}


/**
 * 设置右侧对比器物
 */
function setCompareRightModel(index) {
    compareRightModelIndex = parseInt(index, 10);
    if (exhibitionMode === 'comparison') {
        loadComparisonVessels();
    }
}

/**
 * 交换左右对比器物
 */
function swapComparisonVessels() {
    const temp = currentModelIndex;
    currentModelIndex = compareRightModelIndex;
    compareRightModelIndex = temp;
    loadComparisonVessels();
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2500);
}

/**
 * 加载并渲染双器并列舞台
 */
function loadComparisonVessels() {
    if (!scene) return;

    // 清理旧的右器物和副底座
    if (compareRightGroup) {
        disposeGroup(compareRightGroup);
        scene.remove(compareRightGroup);
        compareRightGroup = null;
    }
    if (compareRightPedestal) {
        scene.remove(compareRightPedestal);
        compareRightPedestal = null;
    }

    // 重新加载并定位左器物
    loadPorcelainModel(currentModelIndex, true);
    if (currentGroup) {
        currentGroup.position.x = -1.35;
    }
    if (pedestalGroup) {
        pedestalGroup.position.x = -1.35;
    }

    // 构建右器物并定位
    const rightGlaze = (porcelainModelsData[compareRightModelIndex] && porcelainModelsData[compareRightModelIndex].defaultGlaze) || 'tianqing';
    compareRightGroup = buildGeometry(compareRightModelIndex, rightGlaze);
    compareRightGroup.position.x = 1.35;
    compareRightGroup.position.y = -1.125;
    scene.add(compareRightGroup);

    // 复制副底座给右器物
    if (pedestalGroup) {
        compareRightPedestal = pedestalGroup.clone(true);
        compareRightPedestal.position.x = 1.35;
        scene.add(compareRightPedestal);
    }

    // 设置对比广角透视视角：抬升仰角，使双器完整显露于视窗中上部，器底与底座彻底避开下方控制卡片
    camPosTarget = { x: 0, y: 1.15, z: 5.35 };
    camLookTarget = { x: 0, y: 0.35, z: 0 };

    renderComparisonPanelDOM();
}

/**
 * 叩击对比器物声音 (左或右)
 */
function strikeComparisonVesselSound(side) {
    const idx = (side === 'left') ? currentModelIndex : compareRightModelIndex;
    const m = porcelainModelsData[idx] || porcelainModelsData[0];
    const freq = m.acousticFreq || 2420;
    if (typeof playPorcelainChime === 'function') {
        playPorcelainChime(freq);
    }
    vesselVibration = 1.0;
    if (typeof showToast === 'function') {
        showToast(`🔔 叩击【${m.name.split('·')[1] || m.name}】：声学共振基频 ${freq} Hz`);
    }
}

let isComparisonDockCollapsed = false;

function toggleComparisonDockCollapse(forceState) {
    isComparisonDockCollapsed = (forceState !== undefined) ? forceState : !isComparisonDockCollapsed;
    renderComparisonPanelDOM();
}

/**
 * 渲染双器文博学术对比仪表盘 DOM
 */
function renderComparisonPanelDOM() {
    let panel = document.getElementById('vessel-comparison-panel');
    if (!panel) {
        const stage = document.getElementById('three-stage-container');
        if (!stage) return;
        panel = document.createElement('div');
        panel.id = 'vessel-comparison-panel';
        panel.className = 'vessel-comparison-dock';
        stage.appendChild(panel);
    }

    const leftData = (typeof porcelainComparisonData !== 'undefined') ? (porcelainComparisonData[currentModelIndex] || porcelainComparisonData[0]) : null;
    const rightData = (typeof porcelainComparisonData !== 'undefined') ? (porcelainComparisonData[compareRightModelIndex] || porcelainComparisonData[1]) : null;

    if (!leftData || !rightData) return;

    const leftModel = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
    const rightModel = porcelainModelsData[compareRightModelIndex] || porcelainModelsData[1];

    panel.classList.toggle('dock-collapsed', isComparisonDockCollapsed);

    if (isComparisonDockCollapsed) {
        panel.innerHTML = `
            <div class="flex items-center justify-between gap-2 text-xs font-serif-cn">
                <div class="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                    <i class="fa-solid fa-code-compare text-amber-400 shrink-0"></i>
                    <span class="text-text-title font-semibold shrink-0 hidden sm:inline">双器同台</span>
                    <span class="text-tianqing truncate font-medium max-w-[130px] sm:max-w-[200px]" title="${leftModel.name}">左: ${leftModel.name.split('·')[1] || leftModel.name}</span>
                    <span class="text-text-muted shrink-0">vs</span>
                    <span class="text-amber-400 truncate font-medium max-w-[130px] sm:max-w-[200px]" title="${rightModel.name}">右: ${rightModel.name.split('·')[1] || rightModel.name}</span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button data-action="swapComparisonVessels()" class="px-2.5 py-1 rounded-full bg-yuebai/90 dark:bg-black/60 border border-border-light text-[11px] font-serif-cn hover:border-tianqing transition-colors flex items-center gap-1 text-text-title" title="互换左右对比器物">
                        <i class="fa-solid fa-right-left text-amber-400"></i>
                        <span class="hidden sm:inline">互换</span>
                    </button>
                    <button data-action="toggleComparisonDockCollapse(false)" class="px-2.5 py-1 rounded-full bg-yuebai/90 dark:bg-black/60 border border-amber-400/50 text-[11px] font-serif-cn text-amber-300 hover:border-amber-400 transition-colors flex items-center gap-1" title="展开学术档案与器物参数">
                        <i class="fa-solid fa-chevron-up text-amber-400"></i>
                        <span>展开参数</span>
                    </button>
                    <button data-action="switchExhibitionMode('inspector')" class="px-2.5 py-1 rounded-full bg-tianqing-deep text-white text-[11px] font-serif-cn hover:bg-tianqing transition-colors" title="退出对比，返回单器精鉴台">
                        返回单器
                    </button>
                </div>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <div class="flex items-center justify-between pb-2 border-b border-border-light text-xs font-serif-cn gap-2">
                <div class="flex items-center gap-2 overflow-hidden">
                    <i class="fa-solid fa-code-compare text-amber-400 shrink-0"></i>
                    <span class="text-text-title font-semibold truncate">双器并列文博学术同台鉴赏</span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button data-action="swapComparisonVessels()" class="px-2.5 py-1 rounded-full bg-yuebai/90 dark:bg-black/60 border border-border-light text-[11px] font-serif-cn hover:border-tianqing transition-colors flex items-center gap-1 text-text-title" title="互换左右对比器物">
                        <i class="fa-solid fa-right-left text-amber-400"></i>
                        <span class="hidden sm:inline">互换左右</span>
                    </button>
                    <button data-action="toggleComparisonDockCollapse(true)" class="px-2.5 py-1 rounded-full bg-yuebai/90 dark:bg-black/60 border border-border-light text-[11px] font-serif-cn hover:border-amber-400 transition-colors flex items-center gap-1 text-text-title" title="收起面板，获得无遮挡全景视野">
                        <i class="fa-solid fa-chevron-down text-amber-400"></i>
                        <span>收起面板避让</span>
                    </button>
                    <button data-action="switchExhibitionMode('inspector')" class="px-2.5 py-1 rounded-full bg-tianqing-deep text-white text-[11px] font-serif-cn hover:bg-tianqing transition-colors">
                        返回单器精鉴
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-serif-cn">
                <!-- 左侧器物学术规格卡 -->
                <div class="p-2.5 rounded-xl bg-bg-main/90 border border-tianqing/30 space-y-1.5 shadow-sm">
                    <div class="flex items-center justify-between gap-1">
                        <div class="flex items-center gap-1.5 font-medium text-text-title">
                            <span class="w-2 h-2 rounded-full bg-tianqing shrink-0"></span>
                            <span class="text-[11px] text-tianqing font-semibold">左展位器物</span>
                        </div>
                        <button data-action="strikeComparisonVesselSound('left')" class="px-2 py-0.5 rounded bg-yuebai/90 dark:bg-black/50 hover:bg-tianqing hover:text-white text-[10px] transition-colors border border-border-light flex items-center gap-1 shrink-0 text-text-title" title="叩击听左器声学泛音">
                            <i class="fa-solid fa-bell text-amber-400"></i>
                            <span>叩瓷 ${leftData.soundFrequency || 2420}Hz</span>
                        </button>
                    </div>
                    <div>
                        <select data-action-change="loadPorcelainModel($number); loadComparisonVessels()" class="w-full bg-bg-light/95 dark:bg-black/60 font-medium text-text-title text-[11px] outline-none cursor-pointer border border-border-light rounded-lg px-2 py-1 truncate">
                            ${porcelainModelsData.map((m, i) => `<option value="${i}" ${i === currentModelIndex ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
                        <p class="text-text-muted truncate" title="${leftData.dynasty} · ${leftData.kiln}"><strong>窑代：</strong>${leftData.dynasty}·${leftData.kiln}</p>
                        <p class="text-text-body truncate" title="${leftData.bodyType}"><strong>胎骨：</strong>${leftData.bodyType}</p>
                        <p class="text-text-body truncate" title="${leftData.firingMethod}"><strong>装烧：</strong>${leftData.firingMethod}</p>
                        <p class="text-text-body truncate" title="${leftData.glazeType} · ${leftData.crackle}"><strong>釉相：</strong>${leftData.glazeType}</p>
                    </div>
                </div>

                <!-- 右侧器物学术规格卡 -->
                <div class="p-2.5 rounded-xl bg-bg-main/90 border border-amber-400/30 space-y-1.5 shadow-sm">
                    <div class="flex items-center justify-between gap-1">
                        <div class="flex items-center gap-1.5 font-medium text-text-title">
                            <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                            <span class="text-[11px] text-amber-400 font-semibold">右展位器物</span>
                        </div>
                        <button data-action="strikeComparisonVesselSound('right')" class="px-2 py-0.5 rounded bg-yuebai/90 dark:bg-black/50 hover:bg-tianqing hover:text-white text-[10px] transition-colors border border-border-light flex items-center gap-1 shrink-0 text-text-title" title="叩击听右器声学泛音">
                            <i class="fa-solid fa-bell text-amber-400"></i>
                            <span>叩瓷 ${rightData.soundFrequency || 2580}Hz</span>
                        </button>
                    </div>
                    <div>
                        <select data-action-change="setCompareRightModel($value)" class="w-full bg-bg-light/95 dark:bg-black/60 font-medium text-text-title text-[11px] outline-none cursor-pointer border border-border-light rounded-lg px-2 py-1 truncate">
                            ${porcelainModelsData.map((m, i) => `<option value="${i}" ${i === compareRightModelIndex ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
                        <p class="text-text-muted truncate" title="${rightData.dynasty} · ${rightData.kiln}"><strong>窑代：</strong>${rightData.dynasty}·${rightData.kiln}</p>
                        <p class="text-text-body truncate" title="${rightData.bodyType}"><strong>胎骨：</strong>${rightData.bodyType}</p>
                        <p class="text-text-body truncate" title="${rightData.firingMethod}"><strong>装烧：</strong>${rightData.firingMethod}</p>
                        <p class="text-text-body truncate" title="${rightData.glazeType} · ${rightData.crackle}"><strong>釉相：</strong>${rightData.glazeType}</p>
                    </div>
                </div>
            </div>
        `;
    }
    panel.classList.remove('hidden');
}

function switchExhibitionMode(mode) {
    if (!renderer) return;
    exhibitionMode = mode;

    ['inspector', 'hall', 'cutaway', 'comparison'].forEach(m => {
        const btn = document.getElementById(`mode-btn-${m}`);
        if (btn) btn.classList.toggle('active', m === mode);
    });

    const stage = document.getElementById('three-stage-container');
    if (stage) {
        stage.classList.toggle('comparison-mode-active', mode === 'comparison');
    }

    if (isBottomInspectionMode) {
        toggleBottomView(false);
    }

    const compPanel = document.getElementById('vessel-comparison-panel');
    if (compPanel && mode !== 'comparison') {
        compPanel.classList.add('hidden');
    }

    const cutawayControls = document.getElementById('cutaway-slider-bar');
    if (cutawayControls) {
        cutawayControls.classList.toggle('hidden', mode !== 'cutaway');
    }

    if (mode === 'hall') {
        renderer.localClippingEnabled = false;
        if (currentGroup) currentGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = false;
        if (realisticRoomGroup) realisticRoomGroup.visible = false;
        if (compareRightGroup) {
            disposeGroup(compareRightGroup);
            scene.remove(compareRightGroup);
            compareRightGroup = null;
        }
        if (compareRightPedestal) {
            scene.remove(compareRightPedestal);
            compareRightPedestal = null;
        }
        if (pedestalGroup) pedestalGroup.position.x = 0;
        if (currentGroup) currentGroup.position.x = 0;
        buildVirtualMuseumHall();
        if (hallGroup) hallGroup.visible = true;
        focusVitrineInHall(currentModelIndex);
        if (typeof showToast === 'function') {
            showToast('🏛️ 已步入【3D 全景数字博物馆九柜大展厅】！点击任意展柜或下方器型即可漫游观摩');
        }
    } else if (mode === 'comparison') {
        renderer.localClippingEnabled = false;
        if (hallGroup) hallGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = true;
        if (realisticRoomGroup) realisticRoomGroup.visible = showRealisticScene;
        loadComparisonVessels();
        if (typeof showToast === 'function') {
            showToast('⚖️ 已开启【双器同台并列比对】：两尊国宝清朗并列，可自由旋转、对比造型与釉色');
        }
    } else if (mode === 'cutaway') {
        renderer.localClippingEnabled = true;
        if (hallGroup) hallGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = true;
        if (realisticRoomGroup) realisticRoomGroup.visible = showRealisticScene;
        if (compareRightGroup) {
            disposeGroup(compareRightGroup);
            scene.remove(compareRightGroup);
            compareRightGroup = null;
        }
        if (compareRightPedestal) {
            scene.remove(compareRightPedestal);
            compareRightPedestal = null;
        }
        if (pedestalGroup) {
            pedestalGroup.position.x = 0;
        }
        loadPorcelainModel(currentModelIndex, true);
        if (currentGroup) {
            currentGroup.position.x = 0;
        }
        camPosTarget = { x: 0.18, y: 0.55, z: 3.15 };
        camLookTarget = { x: 0, y: -0.05, z: 0 };
        if (typeof showToast === 'function') {
            showToast('🔬 已开启【X光胎骨剖面透视】！可拖动剖切滑块审视“薄胎厚釉、口薄底厚”的内部力学构造');
        }
    } else {
        renderer.localClippingEnabled = false;
        if (hallGroup) hallGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = true;
        if (realisticRoomGroup) realisticRoomGroup.visible = showRealisticScene;
        if (compareRightGroup) {
            disposeGroup(compareRightGroup);
            scene.remove(compareRightGroup);
            compareRightGroup = null;
        }
        if (compareRightPedestal) {
            scene.remove(compareRightPedestal);
            compareRightPedestal = null;
        }
        if (pedestalGroup) pedestalGroup.position.x = 0;
        if (currentGroup) currentGroup.position.x = 0;
        loadPorcelainModel(currentModelIndex, true);
        camPosTarget = { x: 0, y: 0.95, z: 3.55 };
        camLookTarget = { x: 0, y: -0.05, z: 0 };
        if (typeof showToast === 'function') {
            showToast('✨ 已切换至【单器 360° 微距精鉴台】');
        }
    }
    render3DHotspotsDOM();
}

function setCutawayOffset(val) {
    clipOffset = parseFloat(val);
    if (clipPlane) {
        clipPlane.constant = clipOffset;
    }
    const label = document.getElementById('cutaway-offset-val');
    if (label) {
        label.textContent = `${Math.round(clipOffset * 100)}%`;
    }
}

function setPbrParam(param, val) {
    const num = parseFloat(val);
    customPbrOverride[param] = num;
    const valEl = document.getElementById(`pbr-val-${param}`);
    if (valEl) {
        valEl.textContent = param === 'ior' ? num.toFixed(2) : `${Math.round(num * 100)}%`;
    }
    if (currentGroup) {
        const prevRotY = currentGroup.rotation.y;
        useScannedOriginalTex = false;
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        currentGroup = buildGeometry(currentModelIndex);
        currentGroup.rotation.y = prevRotY;
        currentGroup.visible = (exhibitionMode !== 'hall');
        scene.add(currentGroup);
    }
}

function resetPbrParams() {
    customPbrOverride = { clearcoat: null, roughness: null, ior: null };
    useScannedOriginalTex = true;
    const cSlider = document.getElementById('pbr-slider-clearcoat');
    const rSlider = document.getElementById('pbr-slider-roughness');
    const iSlider = document.getElementById('pbr-slider-ior');
    if (cSlider) cSlider.value = 0.98;
    if (rSlider) rSlider.value = 0.14;
    if (iSlider) iSlider.value = 1.54;
    const cVal = document.getElementById('pbr-val-clearcoat');
    const rVal = document.getElementById('pbr-val-roughness');
    const iVal = document.getElementById('pbr-val-ior');
    if (cVal) cVal.textContent = '98%';
    if (rVal) rVal.textContent = '14%';
    if (iVal) iVal.textContent = '1.54';
    loadPorcelainModel(currentModelIndex, true);
    if (typeof showToast === 'function') showToast('已恢复标准御窑物理光学参数');
}

function focusVitrineInHall(index) {
    const arcRadius = 6.2;
    const totalCount = porcelainModelsData.length;
    const angle = ((index - (totalCount - 1) / 2) / (totalCount - 1)) * (Math.PI * 1.32);
    const vx = Math.sin(angle) * arcRadius;
    const vz = -Math.cos(angle) * arcRadius + 2.0;

    const camDist = 2.25;
    camPosTarget = {
        x: vx - Math.sin(angle) * camDist,
        y: 0.58,
        z: vz + Math.cos(angle) * camDist
    };
    camLookTarget = { x: vx, y: 0.08, z: vz };
}

function toggleCuratorialTour() {
    curatorialTourActive = !curatorialTourActive;
    const btn = document.getElementById('mode-btn-tour');
    const label = document.getElementById('tour-btn-label');
    if (btn) btn.classList.toggle('active', curatorialTourActive);
    if (label) label.textContent = curatorialTourActive ? '停止巡礼' : '策展自动巡礼';

    if (tourTimer) {
        clearInterval(tourTimer);
        tourTimer = null;
    }

    if (curatorialTourActive) {
        if (exhibitionMode !== 'hall') {
            switchExhibitionMode('hall');
        }
        if (typeof showToast === 'function') {
            showToast('🎬 已开启【策展人自动巡礼】，镜头将依次带您漫游馆藏九大传世名瓷展柜');
        }
        tourTimer = setInterval(() => {
            const nextIdx = (currentModelIndex + 1) % porcelainModelsData.length;
            loadPorcelainModel(nextIdx);
            if (typeof playPorcelainChime === 'function') {
                playPorcelainChime(2100 + nextIdx * 110);
            }
        }, 4200);
    } else {
        if (typeof showToast === 'function') {
            showToast('已暂停策展自动巡礼，您可自由旋转或点选观摩');
        }
    }
}

function loadPorcelainModel(index, keepMode = false) {
    stopCuratorAudio();
    currentModelIndex = index;
    if (porcelainModelsData[index] && porcelainModelsData[index].defaultGlaze && !keepMode) {
        currentGlazeIndex = porcelainModelsData[index].defaultGlaze;
        useScannedOriginalTex = true;
    }

    // 若目标器物已有三维缓存，立即关闭所有加载遮罩
    if (masterTreasuresCache[index] || (index >= 8 && index <= 12 && scannedModelCache[(scannedModelsMeta[index] || {}).key])) {
        hideThreeStageLoader();
    }

    if (currentGroup) {
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
    }

    currentGroup = buildGeometry(index);
    currentGroup.visible = (exhibitionMode !== 'hall');
    scene.add(currentGroup);

    if (showDimensions) {
        if (dimensionGroup) scene.remove(dimensionGroup);
        dimensionGroup = createDimensionLines();
        scene.add(dimensionGroup);
    }

    if (exhibitionMode === 'hall') {
        buildVirtualMuseumHall();
        focusVitrineInHall(index);
    } else if (exhibitionMode === 'comparison') {
        if (!keepMode) {
            loadComparisonVessels();
        }
    } else if (!keepMode) {
        userOrbitAngles = { theta: 0, phi: 0.26, radius: 3.55 };
        camPosTarget = { x: 0, y: 0.95, z: 3.55 };
        camLookTarget = { x: 0, y: -0.05, z: 0 };
    }

    updateModelInfoCard(index);
    if (window.AppStore) window.AppStore.set('modelIndex', index);
    if (window.AppBus) window.AppBus.emit('model:selected', { index: index });
    highlightActiveModelBtn(index);
    highlightActiveGlazeBtn(currentGlazeIndex);
    render3DHotspotsDOM();
}

function render3DHotspotsDOM() {
    const layer = document.getElementById('three-hotspots-layer');
    if (!layer) return;

    if (!showHotspots || exhibitionMode === 'hall' || exhibitionMode === 'comparison') {
        layer.innerHTML = '';
        return;
    }

    const m = porcelainModelsData[currentModelIndex];
    if (!m || !m.hotspots) {
        layer.innerHTML = '';
        return;
    }

    const compact = window.innerWidth < 640;
    layer.innerHTML = m.hotspots.map((h, i) => {
        const rawLabel = h && h.label ? String(h.label) : `特征点 ${i + 1}`;
        const shortLabel = compact ? rawLabel.split(/[·：:]/)[0].trim() : rawLabel;
        return `
        <button class="vessel-3d-hotspot" id="vessel-hotspot-${i}" data-action="focusHotspot(${i})" title="${rawLabel}">
            <span class="pulse-dot"></span>
            <span>${shortLabel}</span>
        </button>`;
    }).join('');
}

function focusHotspot(hotspotIdx) {
    const m = porcelainModelsData[currentModelIndex];
    if (!m || !m.hotspots || !m.hotspots[hotspotIdx]) return;
    const h = m.hotspots[hotspotIdx];
    setCameraView(h.view || 'front');
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2680);
    if (typeof showToast === 'function') {
        showToast(`🔍 特写聚焦：【${h.label}】`);
    }
}

function toggle3DHotspots() {
    showHotspots = !showHotspots;
    const btn = document.getElementById('btn-hotspots-toggle');
    if (btn) btn.classList.toggle('active', showHotspots);
    render3DHotspotsDOM();
    if (typeof showToast === 'function') {
        showToast(showHotspots ? '已开启【3D器物解剖锚点】' : '已隐藏 3D 解剖锚点');
    }
}

function updateHotspotsScreenProjection() {
    if (!showHotspots || exhibitionMode === 'hall' || exhibitionMode === 'comparison' || !currentGroup || !camera) return;
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;
    const m = porcelainModelsData[currentModelIndex];
    if (!m || !m.hotspots) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padX = Math.min(82, Math.max(44, Math.round(w * 0.14)));
    const padYTop = w < 640 ? 64 : 52;
    const padYBottom = w < 640 ? 64 : 56;
    const bOffset = (currentGroup.userData && currentGroup.userData.bottomOffset !== undefined)
        ? currentGroup.userData.bottomOffset : 0;

    m.hotspots.forEach((spot, i) => {
        const el = document.getElementById(`vessel-hotspot-${i}`);
        if (!el) return;
        const vec = new THREE.Vector3(spot.pos[0], spot.pos[1] - bOffset, spot.pos[2]);
        currentGroup.localToWorld(vec);
        vec.project(camera);

        const sx = (vec.x * 0.5 + 0.5) * w;
        const sy = (-(vec.y * 0.5) + 0.5) * h;

        if (vec.z < 1.0 && sx > 6 && sx < w - 6 && sy > 10 && sy < h - 10) {
            const cx = Math.max(padX, Math.min(w - padX, sx));
            const cy = Math.max(padYTop, Math.min(h - padYBottom, sy));
            el.style.left = `${cx.toFixed(1)}px`;
            el.style.top = `${cy.toFixed(1)}px`;
            el.style.opacity = '1';
        } else {
            el.style.opacity = '0';
        }
    });
}

function setStudioLighting(preset) {
    if (preset === 'palace') {
        switchRealisticSceneEnv('studio');
    } else if (preset === 'museum') {
        switchRealisticSceneEnv('palace');
    } else if (preset === 'kiln') {
        switchRealisticSceneEnv('kiln');
    } else if (preset === 'candle') {
        scene.background = new THREE.Color(0x120a05);
        if (scene.fog) scene.fog.color.setHex(0x120a05);
        if (lightMain) { lightMain.color.setHex(0xffb258); lightMain.intensity = 1.95; }
        if (lightFill) { lightFill.color.setHex(0x8a4c28); lightFill.intensity = 0.78; }
        if (lightRim) { lightRim.color.setHex(0xff8c26); lightRim.intensity = 1.15; }
        const label = document.getElementById('light-preset-name');
        if (label) label.textContent = '宫廷夜宴烛火';
        if (typeof showToast === 'function') {
            showToast('🕯️ 已切换展厅光影氛围：【宫廷夜宴烛火】');
        }
    }
}

function rotateMainLight(deg) {
    if (!lightMain) return;
    const rad = (parseFloat(deg) * Math.PI) / 180;
    lightMain.position.set(Math.cos(rad) * 4.5, 5.2, Math.sin(rad) * 4.5);
}

function toggle3DFullscreen() {
    const container = document.getElementById('three-stage-container');
    const icon = document.getElementById('fullscreen-icon');
    if (!container) return;

    container.classList.toggle('fullscreen-mode');
    const isFull = container.classList.contains('fullscreen-mode');
    if (icon) {
        icon.className = isFull ? 'fa-solid fa-compress text-amber-400' : 'fa-solid fa-expand text-tianqing-light';
    }
    if (window.AppBus) window.AppBus.emit('stage:fullscreen', { active: isFull });
    setTimeout(handleThreeResize, 60);
    if (typeof showToast === 'function') {
        showToast(isFull ? '已进入【全屏沉浸式 3D 展馆】，再次点击右上角按钮可退出' : '已退出全屏展览模式');
    }
}

function switchGlaze(glazeKey) {
    if (!glazePalettes[glazeKey]) return;
    currentGlazeIndex = glazeKey;
    useScannedOriginalTex = false; // 主动点击釉色时，允许在实测3D模型上试烧不同釉色
    if (currentGroup) {
        const prevRotY = currentGroup.rotation.y;
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        currentGroup = buildGeometry(currentModelIndex, glazeKey);
        currentGroup.rotation.y = prevRotY;
        currentGroup.visible = (exhibitionMode !== 'hall');
        scene.add(currentGroup);
    }
    highlightActiveGlazeBtn(glazeKey);
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2450);
    if (typeof showToast === 'function') {
        showToast(`✨ 已切换 PBR 双层微晶釉色：【${glazePalettes[glazeKey].name}】`);
    }
}

function restoreScannedTexture() {
    useScannedOriginalTex = true;
    loadPorcelainModel(currentModelIndex, true);
    if (typeof showToast === 'function') {
        showToast('📷 已恢复实测三维扫描文物原始 1K PBR 纹理贴图');
    }
}

function toggleCrackle() {
    showCrackle = !showCrackle;
    loadPorcelainModel(currentModelIndex, true);
    const btn = document.getElementById('btn-crackle-toggle');
    if (btn) btn.classList.toggle('active', showCrackle);
    if (typeof showToast === 'function') {
        showToast(showCrackle ? '已开启【开片冰裂金丝铁线凹凸法线】' : '已切换为【无纹素净玉面】');
    }
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    loadPorcelainModel(currentModelIndex, true);
    const btn = document.getElementById('btn-wireframe-toggle');
    if (btn) btn.classList.toggle('active', isWireframe);
    if (typeof showToast === 'function') {
        showToast(isWireframe ? '已开启【三维拓扑网格力学透视】' : '已恢复【PBR 物理釉面渲染】');
    }
}

function toggleAutoRotate() {
    autoRotate = !autoRotate;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.toggle('active', autoRotate);
}


/**
 * -------------------------------------------------------------
 * 华夏古瓷 3D 鉴赏升华：翻转鉴底 (Bottom Inspection) 与 强光照胎 (Torch Inspection)
 * -------------------------------------------------------------
 */
let isBottomInspectionMode = false;
let isTorchMode = false;
let torchLight = null;
let vesselTiltTargetX = 0;
let vesselLiftTargetY = 0;
let vesselTiltCurrentX = 0;
let vesselLiftCurrentY = 0;
let savedMaterialParams = null;

/**
 * 翻转审视底足与款识
 */
function toggleBottomView(forceState) {
    if (exhibitionMode === 'hall') {
        switchExhibitionMode('inspector');
    }
    const targetState = forceState !== undefined ? forceState : !isBottomInspectionMode;
    isBottomInspectionMode = targetState;

    const btn = document.getElementById('btn-bottom-inspect-toggle');
    const bottomCard = document.getElementById('vessel-bottom-connoisseur-card');

    if (isBottomInspectionMode) {
        autoRotate = false;
        const rotateBtn = document.getElementById('btn-rotate-toggle');
        if (rotateBtn) rotateBtn.classList.remove('active');

        // 器身平滑向前仰起 82 度，底足正对视线，略微抬升避开底座
        vesselTiltTargetX = Math.PI * 0.46;
        vesselLiftTargetY = 0.38;
        camPosTarget = { x: 0, y: 0.12, z: 2.85 };
        camLookTarget = { x: 0, y: -0.12, z: 0 };

        if (btn) btn.classList.add('active');

        // 呈现底足考据卡片
        if (bottomCard) {
            const data = bottomConnoisseurshipData[currentModelIndex] || bottomConnoisseurshipData[0];
            bottomCard.innerHTML = `
                <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-border-light">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-shoe-prints text-amber-400 text-xs"></i>
                        <h4 class="font-serif-cn text-xs font-semibold text-text-title">${data.name} · 底足与款识精鉴</h4>
                    </div>
                    <button data-action="toggleBottomView(false)" class="text-text-muted hover:text-text-title text-xs p-1">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="space-y-1.5 text-[11px] font-light leading-relaxed text-text-body font-serif-cn">
                    <p><strong class="text-amber-400 font-medium">【底足形制】</strong>${data.footType}</p>
                    <p><strong class="text-amber-400 font-medium">【烧造工艺】</strong>${data.firingCraft}</p>
                    <p><strong class="text-amber-400 font-medium">【胎骨特征】</strong>${data.clayBody}</p>
                    <p><strong class="text-amber-400 font-medium">【款识铭记】</strong>${data.reignMark}</p>
                    <p class="pt-1 text-tianqing-deep border-t border-border-light/60"><strong class="font-medium">【鉴赏要诀】</strong>${data.tips}</p>
                </div>
                <button data-action="toggleBottomView(false)" class="mt-2 w-full py-1 text-center text-[10px] rounded bg-yuebai hover:bg-tianqing hover:text-white transition-colors font-serif-cn border border-border-light">
                    ↩️ 复位正视器身
                </button>
            `;
            bottomCard.classList.remove('hidden');
        }

        if (typeof playPorcelainChime === 'function') playPorcelainChime(2380);
        if (typeof showToast === 'function') {
            showToast('🏺 已托起器身翻转底足！细看芝麻支钉痕、铁足露胎与官窑款识');
        }
    } else {
        // 复位器身
        vesselTiltTargetX = 0;
        vesselLiftTargetY = 0;
        resetCamera();
        if (btn) btn.classList.remove('active');
        if (bottomCard) bottomCard.classList.add('hidden');
    }
}

/**
 * 强光探照照胎骨 (透光检视模式)
 */
function toggleTransilluminationTorch() {
    if (exhibitionMode === 'hall') {
        switchExhibitionMode('inspector');
    }
    isTorchMode = !isTorchMode;
    const btn = document.getElementById('btn-torch-inspect-toggle');
    const container = document.getElementById('three-stage-container');

    if (!torchLight && scene) {
        torchLight = new THREE.SpotLight(0xfff6dd, 0, 10, Math.PI / 8, 0.75, 1.2);
        torchLight.position.set(0, 0, 3.2);
        scene.add(torchLight);
        scene.add(torchLight.target);
    }

    if (isTorchMode) {
        if (btn) btn.classList.add('active');
        if (container) container.classList.add('torch-cursor-mode');
        if (torchLight) {
            torchLight.intensity = 6.8;
            torchLight.color.setHex(0xfff3d6);
        }

        // 调整器物材质为玉质微透光
        if (currentGroup) {
            currentGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    if (!savedMaterialParams) {
                        savedMaterialParams = {
                            transmission: child.material.transmission || 0,
                            thickness: child.material.thickness || 0,
                            roughness: child.material.roughness,
                            ior: child.material.ior || 1.5
                        };
                    }
                    child.material.transmission = 0.55;
                    child.material.thickness = 1.35;
                    child.material.roughness = 0.11;
                    child.material.ior = 1.48;
                    child.material.needsUpdate = true;
                }
            });
        }

        if (typeof playPorcelainChime === 'function') playPorcelainChime(2820);
        if (typeof showToast === 'function') {
            showToast('🔦 已开启【强光透光照胎】！移动鼠标以强光探照瓷胎透光与玉质感');
        }
    } else {
        if (btn) btn.classList.remove('active');
        if (container) container.classList.remove('torch-cursor-mode');
        if (torchLight) torchLight.intensity = 0;

        // 还原材质
        if (currentGroup && savedMaterialParams) {
            currentGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.transmission = savedMaterialParams.transmission;
                    child.material.thickness = savedMaterialParams.thickness;
                    child.material.roughness = savedMaterialParams.roughness;
                    child.material.ior = savedMaterialParams.ior;
                    child.material.needsUpdate = true;
                }
            });
            savedMaterialParams = null;
        }
        if (typeof showToast === 'function') {
            showToast('已关闭强光透光模式');
        }
    }
}

function setCameraView(viewType) {
    if (exhibitionMode === 'hall') {
        switchExhibitionMode('inspector');
    }
    autoRotate = false;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.remove('active');
    if (currentGroup) currentGroup.rotation.set(0, 0, 0);

    switch (viewType) {
        case 'front':
            camPosTarget = { x: 0, y: 0.08, z: 3.35 };
            break;
        case 'top':
            camPosTarget = { x: 0, y: 3.7, z: 0.25 };
            break;
        case 'bottom':
            toggleBottomView(true);
            return;
        default:
            camPosTarget = { x: 0, y: 0.95, z: 3.55 };
            break;
    }
    camLookTarget = { x: 0, y: -0.05, z: 0 };
}

function resetCamera() {
    if (exhibitionMode === 'hall') {
        camPosTarget = { x: 0, y: 1.8, z: 5.2 };
        camLookTarget = { x: 0, y: 0.2, z: -2.5 };
        return;
    }
    if (exhibitionMode === 'comparison') {
        camPosTarget = { x: 0, y: 1.15, z: 5.35 };
        camLookTarget = { x: 0, y: 0.35, z: 0 };
        if (currentGroup) currentGroup.rotation.set(0, 0, 0);
        if (compareRightGroup) compareRightGroup.rotation.set(0, 0, 0);
        autoRotate = true;
        const btn = document.getElementById('btn-rotate-toggle');
        if (btn) btn.classList.add('active');
        return;
    }
    camPosTarget = { x: 0, y: 0.95, z: 3.55 };
    camLookTarget = { x: 0, y: -0.05, z: 0 };
    if (currentGroup) currentGroup.rotation.set(0, 0, 0);
    autoRotate = true;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.add('active');
}

function toggleDimensionLines() {
    showDimensions = !showDimensions;
    if (dimensionGroup) {
        scene.remove(dimensionGroup);
        dimensionGroup = null;
    }
    if (showDimensions && currentGroup) {
        dimensionGroup = createDimensionLines();
        scene.add(dimensionGroup);
    }
    const btn = document.getElementById('btn-dimensions-toggle');
    if (btn) btn.classList.toggle('active', showDimensions);
    if (typeof showToast === 'function') {
        showToast(showDimensions ? '📏 已开启【器物考古测绘标定线】' : '已关闭测绘标线');
    }
}

function createDimensionLines() {
    const group = new THREE.Group();
    if (!currentGroup) return group;
    const lineMat = new THREE.LineDashedMaterial({ color: 0xe5c888, dashSize: 0.05, gapSize: 0.025 });

    const addSeg = (p1, p2) => {
        const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const line = new THREE.Line(geo, lineMat);
        line.computeLineDistances();
        group.add(line);
    };

    currentGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(currentGroup);
    const xGuide = (box.max.x || 0.6) + 0.35;
    const minY = isFinite(box.min.y) ? box.min.y : -1.125;
    const maxY = isFinite(box.max.y) ? box.max.y : 1.05;

    addSeg(new THREE.Vector3(xGuide, minY, 0), new THREE.Vector3(xGuide, maxY, 0));
    addSeg(new THREE.Vector3((box.max.x || 0.6) * 0.4, maxY, 0), new THREE.Vector3(xGuide + 0.1, maxY, 0));
    addSeg(new THREE.Vector3((box.max.x || 0.6) * 0.4, minY, 0), new THREE.Vector3(xGuide + 0.1, minY, 0));
    return group;
}

function openMicroscopeView() {
    if (typeof window.renderMicroscopeLens === 'function') window.renderMicroscopeLens();
    const modal = document.getElementById('microscope-modal');
    if (modal) {
        modal.classList.add('active');
        if (typeof window.manageModalOpen === 'function') window.manageModalOpen(modal);
    }
    if (typeof playCrackleSound === 'function') playCrackleSound();
}

function closeMicroscopeView() {
    const modal = document.getElementById('microscope-modal');
    if (modal) {
        modal.classList.remove('active');
        if (typeof window.manageModalClose === 'function') window.manageModalClose(modal);
    }
}

/**
 * 叩瓷听音与声学共振波形实时绘制
 */
let acousticAnimId = null;
function strike3DVesselSound() {
    const m = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
    const freq = m.acousticFreq || 2420;
    if (typeof playPorcelainChime === 'function') {
        playPorcelainChime(freq);
    }
    vesselVibration = 1.0;

    const waveCanvas = document.getElementById('vessel-acoustic-canvas');
    if (!waveCanvas) return;
    const ctx = waveCanvas.getContext('2d');
    let env = 1.0;
    let phase = 0;

    if (acousticAnimId) cancelAnimationFrame(acousticAnimId);
    function drawWave() {
        const w = waveCanvas.width;
        const h = waveCanvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(139, 194, 206, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        ctx.strokeStyle = '#E5C888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const normX = x / w;
            const win = Math.sin(normX * Math.PI);
            const y = h / 2 + Math.sin(normX * (freq / 95) + phase) * (h * 0.38) * env * win;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        phase += 0.42;
        env *= 0.945;
        if (env > 0.02) {
            acousticAnimId = requestAnimationFrame(drawWave);
        }
    }
    drawWave();
    if (typeof showToast === 'function') {
        showToast(`🔔 叩击【${m.name}】· 共振基频 ${freq} Hz，声如清磬！`);
    }
}

/**
 * 语音策展讲解 (Web Speech API)
 */
/**
 * 馆藏讲解语音导览控制器
 */
let currentCuratorAudio = null;
let isCuratorAudioPlaying = false;
let currentPlayingVesselName = null;

function stopCuratorAudio() {
    if (currentCuratorAudio) {
        try {
            currentCuratorAudio.pause();
            currentCuratorAudio.currentTime = 0;
        } catch (e) {}
        currentCuratorAudio = null;
    }
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    isCuratorAudioPlaying = false;
    currentPlayingVesselName = null;
    updateCuratorAudioUI(false);
    if (window.AppBus) window.AppBus.emit('media:curator-active', { active: false });
}

function updateCuratorAudioUI(playing, title = '', subtitleText = '') {
    const btn = document.getElementById('btn-speak-vessel');
    const subtitleEl = document.getElementById('curator-subtitle-bar');
    if (btn) {
        if (playing) {
            btn.innerHTML = `<span class="inline-flex items-center gap-0.5 mr-1 h-3"><span class="w-0.5 h-3 bg-amber-400 animate-pulse"></span><span class="w-0.5 h-2 bg-amber-400 animate-pulse" style="animation-delay: 0.15s"></span><span class="w-0.5 h-3.5 bg-amber-400 animate-pulse" style="animation-delay: 0.3s"></span></span> 停止解说`;
            btn.classList.add('border-amber-400', 'bg-amber-400/10', 'text-amber-500');
        } else {
            btn.innerHTML = `<i class="fa-solid fa-volume-high text-amber-400 mr-1"></i>语音解说`;
            btn.classList.remove('border-amber-400', 'bg-amber-400/10', 'text-amber-500');
        }
    }
    if (subtitleEl) {
        if (playing && subtitleText) {
            subtitleEl.innerHTML = `
                <div class="flex items-center justify-between gap-3 max-w-5xl mx-auto px-4 py-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-bold font-serif-cn shrink-0 shadow-sm">
                            <i class="fa-solid fa-microphone mr-1"></i>AI 合成语音
                        </span>
                        <span class="text-xs text-text-title font-serif-cn truncate font-medium">
                            《${title}》${subtitleText}
                        </span>
                    </div>
                    <button data-action="stopCuratorAudio()" class="text-xs text-text-muted hover:text-amber-500 shrink-0 font-serif-cn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
            subtitleEl.classList.remove('hidden');
        } else {
            subtitleEl.classList.add('hidden');
        }
    }
}

function speakVesselCommentary() {
    const m = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
    const text = `${m.name}。年代：${m.period}，窑口：${m.kiln}。尺寸：${m.dimensions}。${m.desc}`;

    // 如果当前正在播放同一件器物，点击则优雅停止
    if (isCuratorAudioPlaying && currentPlayingVesselName === m.name) {
        stopCuratorAudio();
        if (typeof showToast === 'function') showToast('已停止语音讲解');
        return;
    }

    // 先彻底停止上一段音频
    stopCuratorAudio();

    // 有预先合成的讲解音频（content/vessels.json 的 audio 字段）时直接播放原文件，否则用浏览器语音合成。
    const prebaked = m.audio && m.audio.file ? m.audio : null;

    if (prebaked) {
        try {
            const audioSrc = prebaked.file;
            const audio = new Audio(audioSrc);
            currentCuratorAudio = audio;
            isCuratorAudioPlaying = true;
            currentPlayingVesselName = m.name;
            updateCuratorAudioUI(true, m.name, m.desc);
            if (window.AppBus) window.AppBus.emit('media:curator-active', { active: true });

            audio.onended = () => {
                stopCuratorAudio();
            };
            audio.onerror = (e) => {
                console.warn('本地音频读取异常，无缝降级:', e);
                fallbackSpeechSynthesis(text, m.name);
            };

            audio.play().catch(err => {
                console.warn('浏览器自动播放限制:', err);
                fallbackSpeechSynthesis(text, m.name);
            });

            if (typeof showToast === 'function') {
                showToast(`正在播放《${m.name}》的 AI 合成语音讲解`);
            }
            return;
        } catch (err) {
            console.warn('音频实例启动异常:', err);
        }
    }

    // 备用降级为本地 Web Speech API
    fallbackSpeechSynthesis(text, m.name);
}

function fallbackSpeechSynthesis(text, name) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 0.92;
        utter.pitch = 0.96;
        utter.onend = () => stopCuratorAudio();
        isCuratorAudioPlaying = true;
        currentPlayingVesselName = name;
        updateCuratorAudioUI(true, name, text);
        if (window.AppBus) window.AppBus.emit('media:curator-active', { active: true });
        window.speechSynthesis.speak(utter);
        if (typeof showToast === 'function') {
            showToast(`正在用浏览器语音合成播报《${name}》`);
        }
    }
}

function capture3DSnapshot() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer) return;
    renderer.render(scene, camera);

    const m = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 1200;
    outCanvas.height = 860;
    const ctx = outCanvas.getContext('2d');

    ctx.fillStyle = '#0B1015';
    ctx.fillRect(0, 0, 1200, 860);

    // 绘制 3D 渲染画面
    ctx.drawImage(canvas, 40, 40, 1120, 680);

    // 外框鎏金线
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 1128, 688);

    // 底部博物馆典藏题签栏
    ctx.fillStyle = '#EEF4F7';
    ctx.font = 'bold 26px "Noto Serif SC", "Songti SC", serif';
    ctx.fillText(`华夏器道 · 天青泥火 — ${m.name}`, 45, 775);

    ctx.fillStyle = '#8BC2CE';
    ctx.font = '16px "Noto Serif SC", sans-serif';
    ctx.fillText(`${m.period} | ${m.kiln} | 实测规制：${m.dimensions}`, 45, 812);

    // 朱文印章
    ctx.fillStyle = '#A8383B';
    ctx.fillRect(1080, 748, 72, 72);
    ctx.strokeStyle = '#F5EFE2';
    ctx.lineWidth = 2;
    ctx.strokeRect(1085, 753, 62, 62);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Noto Serif SC", serif';
    ctx.fillText('器道', 1096, 780);
    ctx.fillText('珍藏', 1096, 806);

    const link = document.createElement('a');
    link.download = `华夏器道_3D典藏快照_${m.name}_${Date.now()}.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
    if (typeof showToast === 'function') {
        showToast('📸 已导出带博物馆朱印题签的 3D 典藏高清快照！');
    }
}

function setupControls(canvas) {
    let prevX = 0, prevY = 0;
    let pointerDownPos = { x: 0, y: 0 };
    let initialPinchDist = null;
    let initialCamZ = 3.55;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    canvas.addEventListener('pointerdown', (e) => {
        isUserDragging = true;
        prevX = pointerDownPos.x = e.clientX;
        pointerDownPos.y = prevY = e.clientY;
        autoRotate = false;
        const btn = document.getElementById('btn-rotate-toggle');
        if (btn) btn.classList.remove('active');
    });

    window.addEventListener('pointermove', (e) => {
        if (!isUserDragging) return;
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;

        if (exhibitionMode === 'hall') {
            camLookTarget.x -= deltaX * 0.015;
            camLookTarget.y = Math.max(-0.8, Math.min(1.8, camLookTarget.y + deltaY * 0.01));
        } else {
            if (currentGroup) {
                currentGroup.rotation.y += deltaX * 0.0085;
                currentGroup.rotation.x = Math.max(-Math.PI / 2.6, Math.min(Math.PI / 2.6, currentGroup.rotation.x + deltaY * 0.0085));
            }
            if (exhibitionMode === 'comparison' && compareRightGroup) {
                compareRightGroup.rotation.y += deltaX * 0.0085;
                compareRightGroup.rotation.x = Math.max(-Math.PI / 2.6, Math.min(Math.PI / 2.6, compareRightGroup.rotation.x + deltaY * 0.0085));
            }
        }
    });

    window.addEventListener('pointerup', (e) => {
        if (!isUserDragging) return;
        isUserDragging = false;

        const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (moveDist < 6) {
            if (exhibitionMode === 'hall' && hallGroup) {
                const rect = canvas.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObjects(hallGroup.children, true);
                for (let hit of hits) {
                    if (hit.object && hit.object.userData && hit.object.userData.vitrineIndex !== undefined) {
                        const targetIdx = hit.object.userData.vitrineIndex;
                        loadPorcelainModel(targetIdx);
                        if (typeof playPorcelainChime === 'function') playPorcelainChime(2500);
                        break;
                    }
                }
            } else {
                strike3DVesselSound();
            }
        }
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * 0.0028;
        camPosTarget.z = Math.max(1.75, Math.min(6.8, camPosTarget.z + delta));
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialCamZ = camPosTarget.z;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialPinchDist) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scale = initialPinchDist / dist;
            camPosTarget.z = Math.max(1.75, Math.min(6.8, initialCamZ * scale));
        }
    }, { passive: true });

    canvas.addEventListener('dblclick', resetCamera);
}

function disposeGroup(grp) {
    if (!grp) return;
    const sharedGeos = new Set();
    const sharedMats = new Set();
    const sharedTexs = new Set();
    if (typeof envMapTexture !== 'undefined' && envMapTexture) sharedTexs.add(envMapTexture);
    if (typeof textureCache !== 'undefined') {
        Object.values(textureCache).forEach((entry) => {
            if (!entry) return;
            if (entry.isTexture) sharedTexs.add(entry);
            else Object.values(entry).forEach(v => { if (v && v.isTexture) sharedTexs.add(v); });
        });
    }
    const collectCache = (cacheObj) => {
        if (!cacheObj) return;
        Object.values(cacheObj).forEach((root) => {
            if (!root || !root.traverse) return;
            root.traverse((o) => {
                if (!o.isMesh) return;
                if (o.geometry) sharedGeos.add(o.geometry);
                if (o.material) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach((m) => {
                        sharedMats.add(m);
                        ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap', 'emissiveMap', 'alphaMap'].forEach((k) => {
                            if (m[k] && m[k].isTexture) sharedTexs.add(m[k]);
                        });
                    });
                }
            });
        });
    };
    collectCache(masterTreasuresCache);
    collectCache(scannedModelCache);

    const disposeMat = (m) => {
        if (!m || sharedMats.has(m)) return;
        ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap', 'emissiveMap', 'alphaMap'].forEach((k) => {
            const tex = m[k];
            if (tex && tex.isTexture && !sharedTexs.has(tex)) {
                tex.dispose();
            }
        });
        m.dispose();
    };

    grp.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry && !sharedGeos.has(child.geometry)) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(disposeMat);
                else disposeMat(child.material);
            }
        }
    });
}

let isCanvasVisible = true;
let isViewportVisible = true;
let isContentSkipped = false;
function setupVisibilityObserver(canvas) {
    if (!canvas) return;
    const syncVisibilityAndResume = () => {
        const wasActive = isCanvasVisible;
        isCanvasVisible = isViewportVisible && !isContentSkipped && !document.hidden;
        if (!wasActive && isCanvasVisible) {
            requestAnimationFrame(typeof window.animate === 'function' ? window.animate : animate);
        }
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            isViewportVisible = entries[0].isIntersecting;
            syncVisibilityAndResume();
        }, { threshold: 0.04 });
        observer.observe(canvas);
    }

    const gallerySection = document.getElementById('3d-gallery');
    if (gallerySection) {
        gallerySection.addEventListener('contentvisibilityautostatechange', (e) => {
            isContentSkipped = !!e.skipped;
            syncVisibilityAndResume();
        });
    }

    document.addEventListener('visibilitychange', syncVisibilityAndResume);
}

let lastFrameTime = 0;
function animate(now) {
    if (!isCanvasVisible || document.hidden) return;
    requestAnimationFrame(animate);

    camera.position.x += (camPosTarget.x - camera.position.x) * 0.08;
    camera.position.y += (camPosTarget.y - camera.position.y) * 0.08;
    camera.position.z += (camPosTarget.z - camera.position.z) * 0.08;

    camLookCurrent.x += (camLookTarget.x - camLookCurrent.x) * 0.08;
    camLookCurrent.y += (camLookTarget.y - camLookCurrent.y) * 0.08;
    camLookCurrent.z += (camLookTarget.z - camLookCurrent.z) * 0.08;
    camera.lookAt(camLookCurrent.x, camLookCurrent.y, camLookCurrent.z);

    if (currentGroup && exhibitionMode !== 'hall') {
        if (autoRotate && !isBottomInspectionMode) {
            currentGroup.rotation.y += 0.0055;
            if (exhibitionMode === 'comparison' && compareRightGroup) {
                compareRightGroup.rotation.y += 0.0055;
            }
        }
        vesselTiltCurrentX += (vesselTiltTargetX - vesselTiltCurrentX) * 0.08;
        vesselLiftCurrentY += (vesselLiftTargetY - vesselLiftCurrentY) * 0.08;
        currentGroup.rotation.x = vesselTiltCurrentX;
        currentGroup.position.y = -1.125 + vesselLiftCurrentY;

        const baseX = (exhibitionMode === 'comparison') ? -1.35 : 0;
        if (vesselVibration > 0.01) {
            currentGroup.position.x = baseX + Math.sin(Date.now() * 0.08) * 0.012 * vesselVibration;
            vesselVibration *= 0.90;
        } else {
            currentGroup.position.x = baseX;
        }
    }
    if (hallGroup && exhibitionMode === 'hall') {
        hallGroup.children.forEach(child => {
            if (child.userData && child.userData.vitrineIndex !== undefined) {
                const vGroup = child.children[child.children.length - 1];
                if (vGroup) vGroup.rotation.y += 0.006;
            }
        });
    }

    if (particleSystem) {
        particleSystem.rotation.y += 0.0012;
        const pos = particleSystem.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let py = pos.getY(i) + 0.0025;
            if (py > 2.8) py = -1.2;
            pos.setY(i, py);
        }
        pos.needsUpdate = true;
    }

    if (incenseSmokeSystem && incenseSmokeSystem.visible && realisticRoomGroup && realisticRoomGroup.visible) {
        const sPos = incenseSmokeSystem.geometry.attributes.position;
        const sSeeds = incenseSmokeSystem.geometry.userData.seeds;
        if (sSeeds) {
            for (let i = 0; i < sPos.count; i++) {
                let py = sPos.getY(i) + sSeeds[i * 3 + 1];
                sSeeds[i * 3] += 0.025;
                const px = 0.62 + Math.sin(sSeeds[i * 3]) * 0.025 * (py - (-0.95));
                const pz = -0.42 + Math.cos(sSeeds[i * 3]) * 0.025 * (py - (-0.95));
                if (py > -0.25) py = -0.92;
                sPos.setX(i, px);
                sPos.setY(i, py);
                sPos.setZ(i, pz);
            }
            sPos.needsUpdate = true;
        }
    }

    updateHotspotsScreenProjection();
    renderer.render(scene, camera);
}

function handleThreeResize() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer || !camera) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

/**
 * 更新右侧器物研鉴详情档案卡 (含叩瓷声波示波器、语音讲解、快照导出与实测纹理切换)
 */
function updateModelInfoCard(index) {
    const infoEl = document.getElementById('3d-model-info');
    if (!infoEl) return;
    const m = porcelainModelsData[index];
    if (!m) return;

    const scannedBadge = m.group === 'reference' ? `
        <div class="p-2.5 rounded-xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-between text-xs">
            <span class="text-amber-200 font-serif-cn"><i class="fa-solid fa-circle-info mr-1.5"></i>第三方 CC0 模型 · 现代器物对照标本</span>
            <button data-action="restoreScannedTexture()" class="px-2.5 py-1 rounded-full bg-amber-700 text-white text-[11px] hover:bg-tianqing transition-colors">
                恢复模型原贴图
            </button>
        </div>
    ` : '';

    infoEl.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-light">
                <span class="badge bg-tianqing-deep text-white text-xs shrink-0">${m.period}</span>
                <span class="text-xs text-tianqing-deep bg-yuebai px-3 py-1 rounded-full font-medium shrink-0 border border-border-light">${m.kiln}</span>
            </div>

            <div>
                <h3 class="text-xl font-serif-cn text-text-title font-semibold leading-snug">${m.name || '未命名器物'}</h3>
                <p class="text-[11px] text-text-muted mt-0.5 font-serif-cn">${m.english || ''}</p>
                <div class="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-amber-400">
                    <span><i class="fa-solid fa-ruler-combined mr-1"></i>${m.dimensions || '尺寸待考'}</span>
                    <span><i class="fa-solid fa-layer-group mr-1"></i>${m.wallThickness || '胎壁参考待补'}</span>
                </div>
            </div>

            ${scannedBadge}

            <p class="text-xs sm:text-sm text-text-body leading-relaxed font-light">${m.desc || ''}</p>

            <!-- 器物叩击声学共振示波器与多媒体导览条 -->
            <div class="p-3 rounded-xl bg-bg-main border border-border-light space-y-2">
                <div class="flex items-center justify-between text-xs">
                    <span class="font-serif-cn text-text-title font-medium flex items-center gap-1.5">
                        <i class="fa-solid fa-wave-square text-amber-400"></i>
                        <span>叩瓷听音 · 声学共振谱 (${m.acousticFreq || 2420} Hz)</span>
                    </span>
                    <div class="flex items-center gap-1.5">
                        <button data-action="strike3DVesselSound()" class="px-2.5 py-1 rounded-lg bg-tianqing-deep text-white text-[11px] font-serif-cn hover:bg-tianqing transition-colors">
                            <i class="fa-solid fa-bell mr-1"></i>叩击听音
                        </button>
                        <button id="btn-speak-vessel" data-action="speakVesselCommentary()" class="px-2.5 py-1 rounded-lg bg-yuebai text-text-title border border-border-light text-[11px] font-serif-cn hover:border-tianqing transition-colors">
                            <i class="fa-solid fa-volume-high text-amber-400 mr-1"></i>语音解说
                        </button>
                        <button data-action="capture3DSnapshot()" class="px-2.5 py-1 rounded-lg bg-yuebai text-text-title border border-border-light text-[11px] font-serif-cn hover:border-tianqing transition-colors" title="导出带印章水印的3D典藏快照">
                            <i class="fa-solid fa-camera text-tianqing-deep"></i>
                        </button>
                    </div>
                </div>
                <canvas id="vessel-acoustic-canvas" width="380" height="42" class="w-full h-10 rounded bg-black/40 block"></canvas>
            </div>

            <div class="border-t border-border-light pt-3">
                <h4 class="text-xs text-text-title font-medium mb-2 tracking-wider flex items-center justify-between">
                    <span>【三维器物学与物理鉴藏要领】</span>
                    <button data-action="openMicroscopeView()" class="text-tianqing-deep hover:underline text-[11px] font-normal flex items-center gap-1">
                        <i class="fa-solid fa-microscope"></i>
                        <span>100x晶相观察</span>
                    </button>
                </h4>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    ${m.features.map(f => `
                        <div class="flex items-center gap-1.5 text-text-body bg-bg-main p-2 rounded-lg border border-border-light">
                            <i class="fa-solid fa-check text-amber-400 text-[10px]"></i>
                            <span>${f}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="pt-1 flex items-center justify-between gap-2 text-xs">
                <button data-action="switchExhibitionMode('${exhibitionMode === 'cutaway' ? 'inspector' : 'cutaway'}')" class="flex-1 py-2.5 px-3 rounded-xl bg-yuebai hover:bg-tianqing hover:text-white text-text-title font-serif-cn transition-colors flex items-center justify-center gap-1.5 border border-border-light">
                    <i class="fa-solid fa-layer-group text-tianqing-deep"></i>
                    <span>${exhibitionMode === 'cutaway' ? '退出X光剖面' : 'X光胎壁剖面'}</span>
                </button>
                <button data-action="switchExhibitionMode('${exhibitionMode === 'hall' ? 'inspector' : 'hall'}')" class="flex-1 py-2.5 px-3 rounded-xl bg-tianqing-deep text-white hover:bg-tianqing font-serif-cn transition-colors flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-building-columns text-amber-200"></i>
                    <span>${exhibitionMode === 'hall' ? '返回单器精鉴' : '步入全景展厅'}</span>
                </button>
            </div>
        </div>
    `;

    // 初始化默认静态声波线
    setTimeout(() => {
        const waveCanvas = document.getElementById('vessel-acoustic-canvas');
        if (waveCanvas) {
            const ctx = waveCanvas.getContext('2d');
            ctx.strokeStyle = 'rgba(229, 200, 136, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let x = 0; x < waveCanvas.width; x++) {
                const normX = x / waveCanvas.width;
                const y = 21 + Math.sin(normX * 28) * 11 * Math.sin(normX * Math.PI) * Math.exp(-normX * 2.2);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }, 30);
}

function highlightActiveModelBtn(index) {
    document.querySelectorAll('.model-btn').forEach((btn, i) => {
        const m = /loadPorcelainModel\((\d+)/.exec(btn.getAttribute('data-action') || '');
        const btnIdx = m ? parseInt(m[1], 10) : i;
        if (btnIdx === index) {
            btn.classList.add('bg-tianqing-deep', 'text-white', 'ring-2');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white', 'ring-2');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
}

function highlightActiveGlazeBtn(glazeKey) {
    document.querySelectorAll('.glaze-btn').forEach(btn => {
        if (btn.dataset.glaze === glazeKey) {
            btn.classList.add('ring-2', 'scale-105');
        } else {
            btn.classList.remove('ring-2', 'scale-105');
        }
    });
}

window.preloadMasterTreasures = preloadMasterTreasures;
window.masterTreasuresMeta = masterTreasuresMeta;
window.initThreeJS = initThreeJS;
window.loadPorcelainModel = loadPorcelainModel;
window.switchGlaze = switchGlaze;
window.restoreScannedTexture = restoreScannedTexture;
window.toggleCrackle = toggleCrackle;
window.toggleWireframe = toggleWireframe;
window.toggleDimensionLines = toggleDimensionLines;
window.toggleAutoRotate = toggleAutoRotate;
window.setCameraView = setCameraView;
window.resetCamera = resetCamera;
window.openMicroscopeView = openMicroscopeView;
window.closeMicroscopeView = closeMicroscopeView;
window.switchExhibitionMode = switchExhibitionMode;
window.setCutawayOffset = setCutawayOffset;
window.setPbrParam = setPbrParam;
window.resetPbrParams = resetPbrParams;
window.toggleCuratorialTour = toggleCuratorialTour;
window.toggle3DHotspots = toggle3DHotspots;
window.focusHotspot = focusHotspot;
window.setStudioLighting = setStudioLighting;
window.rotateMainLight = rotateMainLight;
window.toggle3DFullscreen = toggle3DFullscreen;
window.switchRealisticSceneEnv = switchRealisticSceneEnv;
window.toggleRealisticScene = toggleRealisticScene;
window.strike3DVesselSound = strike3DVesselSound;
window.speakVesselCommentary = speakVesselCommentary;
window.capture3DSnapshot = capture3DSnapshot;
window.toggleBottomView = toggleBottomView;
window.setCompareRightModel = setCompareRightModel;
window.swapComparisonVessels = swapComparisonVessels;
window.strikeComparisonVesselSound = strikeComparisonVesselSound;
window.toggleZenMode = toggleZenMode;

window.toggleTransilluminationTorch = toggleTransilluminationTorch;
window.bottomConnoisseurshipData = bottomConnoisseurshipData;

if (typeof window !== 'undefined' && window.AppBus) {
    window.AppBus.on('lang:changed', () => {
        if (typeof updateModelInfoCard === 'function') {
            updateModelInfoCard(typeof currentModelIndex === 'number' ? currentModelIndex : 0);
        }
        const card = document.getElementById('vessel-bottom-connoisseur-card');
        if (card && !card.classList.contains('hidden') && typeof isBottomFlipped !== 'undefined' && isBottomFlipped) {
            toggleBottomView(true);
        }
    });
}


