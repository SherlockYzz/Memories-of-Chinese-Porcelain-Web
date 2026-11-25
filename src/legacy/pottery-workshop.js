/**
 * 华夏器道 · 天青泥火 — 3D光影指尖拉坯、自由青花手绘、底款篆刻与1300℃龙窑温控曲线仿真引擎
 * 核心升级：
 * 1. 48层高密度曲面切片 + Blinn-Phong 3D法线高光 + 实时计算器高(cm)、口径(cm)、腹径(cm)、容积(mL)与宋韵美学评分
 * 2. 五大造物交互手法：向内收束 / 向外鼓腹 / 竹刀修光 / 深刻弦纹 / 【青花自由手绘笔刷 (指尖直接在旋转坯体上绘青花环带)】
 * 3. 皇家底款印章定制：支持“大宋宣和”、“修内司窑”、“河大文博”、“天青雅制”四方篆刻落款
 * 4. 1300℃ 龙窑柴烧实时升温曲线图 (#kiln-curve-canvas) 物理仿真与《专属数字藏品收藏证书》高清海报生成
 * 5. Web Audio API 物理泛音合成：名瓷叩击声、冰裂开片声、古代五声瓷编磬与宋代古琴泛音雅乐
 */

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.ellipse) {
    CanvasRenderingContext2D.prototype.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
        this.save();
        this.translate(x, y);
        this.rotate(rotation);
        this.scale(radiusX, radiusY);
        this.arc(0, 0, 1, startAngle, endAngle, anticlockwise);
        this.restore();
    };
}

// ================================================================
// 一、Web Audio API 纯代码程序化陶瓷与古琴音效合成器
// ================================================================
let audioCtx = null;
let soundEnabled = true;
let ambientGuqinTimer = null;
let isAmbientPlaying = false;

function initAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playPorcelainChime(freq = 2400) {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.988, now + 1.25);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
    } catch (e) {}
}

function playCrackleSound() {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4200 + Math.random() * 900, now);
        osc.frequency.exponentialRampToValueAtTime(1150, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    } catch (e) {}
}

function playPentatonicChime(freq = 261.63, harmonics = [523.25, 1046.5]) {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.26, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.995, now + 2.0);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 2.15);

        if (harmonics && harmonics.length) {
            harmonics.forEach((hFreq, idx) => {
                const hOsc = audioCtx.createOscillator();
                const hGain = audioCtx.createGain();
                hOsc.type = 'triangle';
                hOsc.frequency.setValueAtTime(hFreq, now);
                hGain.gain.setValueAtTime(0.07 / (idx + 1), now);
                hGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
                hOsc.connect(hGain);
                hGain.connect(audioCtx.destination);
                hOsc.start(now);
                hOsc.stop(now + 1.35);
            });
        }
        gain.connect(audioCtx.destination);
    } catch (e) {}
}

/**
 * 宋代古琴与空灵瓷音背景雅乐合成器开关
 */
function toggleAmbientGuqin() {
    isAmbientPlaying = !isAmbientPlaying;
    const btn = document.getElementById('ambient-music-btn');
    const icon = document.getElementById('ambient-music-icon');

    if (ambientGuqinTimer) {
        clearInterval(ambientGuqinTimer);
        ambientGuqinTimer = null;
    }

    if (isAmbientPlaying) {
        initAudioContext();
        if (btn) btn.classList.add('ring-2');
        if (icon) icon.className = 'fa-solid fa-music text-amber-400 animate-pulse';
        const scale = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        let step = 0;
        const playNote = () => {
            if (!isAmbientPlaying) return;
            const f = scale[(step * 3 + Math.floor(Math.random() * 2)) % scale.length];
            playPentatonicChime(f, [f * 2, f * 3]);
            step++;
        };
        playNote();
        ambientGuqinTimer = setInterval(playNote, 2600);
        if (typeof showToast === 'function') {
            showToast('🎵 已开启【宋韵古琴与瓷磬空灵雅乐】合成器');
        }
    } else {
        if (btn) btn.classList.remove('ring-2');
        if (icon) icon.className = 'fa-solid fa-volume-xmark text-text-muted';
        if (typeof showToast === 'function') {
            showToast('已暂停背景古琴雅乐');
        }
    }
}

// ================================================================
// 二、3D 光影指尖拉坯、自由手绘青花与 1300℃ 温控曲线烧窑系统
// ================================================================
let potCanvas, potCtx;
let potAnimId = null;
let isInteractingPot = false;
let potToolMode = 'push'; // 'push' | 'pull' | 'smooth' | 'brush'
let brushStyle = 'outline'; // 'outline' | 'wash' | 'iron' | 'erase'
let brushSize = 'md'; // 'sm' | 'md' | 'lg'
let wheelPaused = false;
let currentPotPattern = 'none'; // 'none' | 'lotus' | 'qinghua' | 'goldring'
let currentPotSeal = '大宋宣和';

const UV_W = 512;
const UV_H = 256;
const HEMI_W = 256;
const HEMI_H = 256;
const HEMI_STRIPS = 32;

const paintUVCanvas = document.createElement('canvas');
paintUVCanvas.width = UV_W;
paintUVCanvas.height = UV_H;
const paintUVCtx = paintUVCanvas.getContext('2d');

const presetUVCanvas = document.createElement('canvas');
presetUVCanvas.width = UV_W;
presetUVCanvas.height = UV_H;
const presetUVCtx = presetUVCanvas.getContext('2d');

const uvTiledCanvas = document.createElement('canvas');
uvTiledCanvas.width = UV_W * 2;
uvTiledCanvas.height = UV_H;
const uvTiledCtx = uvTiledCanvas.getContext('2d');

const hemiCanvas = document.createElement('canvas');
hemiCanvas.width = HEMI_W;
hemiCanvas.height = HEMI_H;
const hemiCtx = hemiCanvas.getContext('2d');

let uvDirty = true;
let lastBrushUV = null;

const potteryHistory = [];
const MAX_POT_HISTORY = 30;

function savePotterySnapshot() {
    if (!targetRadii || !targetRadii.length) return;
    let paintData = null;
    try {
        paintData = paintUVCtx.getImageData(0, 0, UV_W, UV_H);
    } catch (_) {
        paintData = null;
    }
    potteryHistory.push({
        radii: [...targetRadii],
        paintData,
        pattern: currentPotPattern,
        glaze: currentClayGlaze,
        fired: isFired
    });
    if (potteryHistory.length > MAX_POT_HISTORY) potteryHistory.shift();
}

function undoPotteryAction() {
    if (!potteryHistory.length) {
        if (typeof showToast === 'function') showToast('已在最初造物状态');
        return;
    }
    const prev = potteryHistory.pop();
    if (prev) {
        targetRadii = [...prev.radii];
        clayRadii = [...prev.radii];
        if (prev.paintData) {
            paintUVCtx.putImageData(prev.paintData, 0, 0);
        } else {
            paintUVCtx.clearRect(0, 0, UV_W, UV_H);
        }
        currentPotPattern = prev.pattern || 'none';
        currentClayGlaze = prev.glaze || 'tianqing';
        isFired = !!prev.fired;
        renderPresetPatternUV();
        uvDirty = true;
        updatePotteryLiveMetrics();
        ensurePotteryRender();
        if (typeof showToast === 'function') showToast('↶ 已撤销上一步塑形与青花笔触');
    }
}

function setBrushStyle(style) {
    brushStyle = style;
    document.querySelectorAll('.brush-style-btn').forEach(btn => {
        if (btn.dataset.style === style) {
            btn.classList.add('bg-tianqing-deep', 'text-white');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
}

function setBrushSize(size) {
    brushSize = size;
    document.querySelectorAll('.brush-size-btn').forEach(btn => {
        if (btn.dataset.size === size) {
            btn.classList.add('bg-tianqing-deep', 'text-white');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
}

function updateWheelSpeedLabel() {
    const el = document.getElementById('pottery-metrics-label');
    if (!el) return;
    if (wheelPaused) el.textContent = '已定格 · 0 RPM';
    else if (potToolMode === 'brush') el.textContent = '转速 32 RPM · 慢速绘青花';
    else el.textContent = '转速 120 RPM';
}

function toggleWheelPause() {
    wheelPaused = !wheelPaused;
    const btn = document.getElementById('pot-wheel-pause-btn');
    if (btn) {
        btn.textContent = wheelPaused ? '恢复转盘' : '暂停转盘';
        btn.classList.toggle('bg-tianqing-deep', wheelPaused);
        btn.classList.toggle('text-white', wheelPaused);
        btn.classList.toggle('bg-yuebai', !wheelPaused);
        btn.classList.toggle('text-text-body', !wheelPaused);
    }
    updateWheelSpeedLabel();
    ensurePotteryRender();
    if (typeof showToast === 'function') {
        showToast(wheelPaused ? '已定格陶轮，适合精细勾画缠枝花叶与题款' : '陶轮已恢复匀速旋转，适合拉圈绘带');
    }
}

function clearQinghuaPaint() {
    savePotterySnapshot();
    paintUVCtx.clearRect(0, 0, UV_W, UV_H);
    uvDirty = true;
    ensurePotteryRender();
    if (typeof showToast === 'function') {
        showToast('已清空坯体手绘青花料迹');
    }
}

const SLICE_COUNT = 44;
let clayRadii = [];
let targetRadii = [];
let clayRotationAngle = 0;
let isFired = false;
let currentClayGlaze = 'tianqing';
let splashParticles = [];
let pointerPos = { x: -100, y: -100, active: false };

const vesselPresets = {
    meiping: [
        0.34, 0.35, 0.37, 0.39, 0.41, 0.44, 0.48, 0.52, 0.56, 0.61, 0.66,
        0.71, 0.76, 0.81, 0.85, 0.89, 0.92, 0.95, 0.97, 0.98, 0.99, 0.99,
        0.99, 0.98, 0.96, 0.93, 0.89, 0.84, 0.77, 0.68, 0.57, 0.45, 0.34,
        0.27, 0.24, 0.23, 0.24, 0.26, 0.29, 0.32, 0.34, 0.34, 0.32, 0.30
    ],
    vase: [
        0.42, 0.44, 0.41, 0.38, 0.41, 0.48, 0.58, 0.69, 0.79, 0.87, 0.92,
        0.95, 0.97, 0.96, 0.93, 0.89, 0.83, 0.76, 0.68, 0.60, 0.52, 0.45,
        0.40, 0.36, 0.32, 0.29, 0.27, 0.27, 0.27, 0.28, 0.30, 0.33, 0.37,
        0.42, 0.47, 0.53, 0.59, 0.65, 0.70, 0.74, 0.76, 0.77, 0.77, 0.75
    ],
    gourd: [
        0.38, 0.40, 0.44, 0.52, 0.64, 0.76, 0.86, 0.92, 0.95, 0.96, 0.94,
        0.89, 0.82, 0.72, 0.59, 0.46, 0.36, 0.31, 0.30, 0.33, 0.41, 0.51,
        0.61, 0.70, 0.76, 0.78, 0.78, 0.75, 0.69, 0.60, 0.50, 0.39, 0.30,
        0.24, 0.21, 0.19, 0.19, 0.19, 0.20, 0.21, 0.22, 0.22, 0.22, 0.21
    ],
    bowl: [
        0.28, 0.30, 0.29, 0.32, 0.37, 0.43, 0.49, 0.55, 0.61, 0.66, 0.71,
        0.76, 0.80, 0.84, 0.87, 0.90, 0.93, 0.95, 0.96, 0.97, 0.98, 0.98,
        0.97, 0.96, 0.96, 0.98, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99,
        0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99
    ]
};

let isPotteryVisible = true;
function ensurePotteryRender() {
    if (!potCanvas || document.hidden) return;
    isPotteryVisible = true;
    if (!potAnimId) potAnimLoop();
}

function setupPotteryVisibilityObserver() {
    if (!potCanvas) return;
    const resumeIfReady = () => {
        if (isPotteryVisible && !document.hidden) {
            if (potAnimId) cancelAnimationFrame(potAnimId);
            potAnimId = null;
            potAnimLoop();
        }
    };
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            const wasVisible = isPotteryVisible;
            isPotteryVisible = entries[0].isIntersecting;
            if (!wasVisible && isPotteryVisible) resumeIfReady();
        }, { threshold: 0.01, rootMargin: '240px 0px' });
        observer.observe(potCanvas);
    }
    if (!potCanvas.dataset.potVisBound) {
        potCanvas.dataset.potVisBound = '1';
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (potAnimId) { cancelAnimationFrame(potAnimId); potAnimId = null; }
            } else {
                resumeIfReady();
            }
        });
    }
}

function initPotteryWorkshop() {
    potCanvas = document.getElementById('pottery-canvas');
    if (!potCanvas || potCanvas.dataset.potInit === '1') return;
    potCanvas.dataset.potInit = '1';
    potCtx = potCanvas.getContext('2d');

    const kilnOverlay = document.getElementById('kiln-fire-overlay');
    if (kilnOverlay) kilnOverlay.classList.add('hidden');

    resetClay(true);
    bindPotteryEvents();
    setupPotteryVisibilityObserver();

    if (potAnimId) cancelAnimationFrame(potAnimId);
    potAnimLoop();
}

function resetClay(silent = false) {
    savePotterySnapshot();
    clayRadii = [];
    targetRadii = [];
    paintUVCtx.clearRect(0, 0, UV_W, UV_H);
    renderPresetPatternUV();
    uvDirty = true;
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        const t = i / (SLICE_COUNT - 1);
        const r = 0.45 + (1 - t) * 0.04;
        clayRadii.push(r);
        targetRadii.push(r);
    }
    updateFiringBadge('高岭土湿坯 · 旋转塑形中');
    updatePotteryLiveMetrics();
    if (!silent) ensurePotteryRender();
    if (!silent && typeof showToast === 'function') {
        showToast('已重置为标准高岭土泥料，可自由向内收束或向外拉伸！');
    }
}

function updatePotteryLiveMetrics() {
    if (!targetRadii.length) return;
    const mouthR = targetRadii[SLICE_COUNT - 1];
    const maxR = Math.max(...targetRadii);
    const footR = targetRadii[0];

    const heightCm = (21.5 + (maxR - 0.5) * 6.2).toFixed(1);
    const mouthCm = (mouthR * 16.5).toFixed(1);
    const bellyCm = (maxR * 22.0).toFixed(1);

    let sumArea = 0;
    for (let i = 0; i < SLICE_COUNT; i++) {
        sumArea += targetRadii[i] * targetRadii[i];
    }
    const volMl = Math.round((sumArea / SLICE_COUNT) * 1450);

    // 计算平滑度作为宋韵美学评分
    let smoothness = 0;
    for (let i = 1; i < SLICE_COUNT - 1; i++) {
        const d2 = Math.abs(targetRadii[i + 1] - 2 * targetRadii[i] + targetRadii[i - 1]);
        smoothness += d2;
    }
    const score = Math.max(88, Math.min(99, Math.round(99 - smoothness * 18)));

    const mEl = document.getElementById('pottery-live-specs');
    if (mEl) {
        mEl.innerHTML = `
            <span>器高 <strong>${heightCm}cm</strong></span>
            <span>口径 <strong>${mouthCm}cm</strong></span>
            <span>腹径 <strong>${bellyCm}cm</strong></span>
            <span>容积 <strong>${volMl}mL</strong></span>
            <span class="text-amber-400">宋韵器型分 <strong>${score}</strong></span>
        `;
    }
    return { heightCm, mouthCm, bellyCm, footCm: (footR * 16.5).toFixed(1), volMl, score };
}

function applyPresetVessel(presetName) {
    const preset = vesselPresets[presetName];
    if (!preset) return;
    savePotterySnapshot();
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        targetRadii[i] = preset[i] !== undefined ? preset[i] : 0.45;
    }
    const names = { meiping: '宋定窑梅瓶', vase: '明青花玉壶春瓶', gourd: '大吉葫芦瓶', bowl: '建窑斗茶盏' };
    updateFiringBadge(`经典器型 · ${names[presetName] || '生坯'}塑形`);
    updatePotteryLiveMetrics();
    ensurePotteryRender();
    playPorcelainChime(1720);
    if (typeof showToast === 'function') {
        showToast(`✨ 已辅助拉出【${names[presetName]}】黄金比例胎骨曲线！`);
    }
}

function setPotPattern(patternKey) {
    currentPotPattern = patternKey;
    document.querySelectorAll('.pot-pattern-btn').forEach(btn => {
        if (btn.dataset.pattern === patternKey) {
            btn.classList.add('bg-tianqing-deep', 'text-white');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
    renderPresetPatternUV();
    uvDirty = true;
    ensurePotteryRender();
    playPorcelainChime(2150);
    const pNames = {
        none: '素面玉肌 (极简无纹)',
        lotus: '定窑浮雕划花莲瓣纹',
        qinghua: '宣德苏麻离青缠枝宝相花',
        goldring: '南宋官窑凸弦鎏金瑞纹'
    };
    if (typeof showToast === 'function') {
        showToast(`🖌️ 已施以器身纹饰：【${pNames[patternKey] || patternKey}】`);
    }
}

/** 绘制景德镇青花预设柱面 UV 贴图（口沿双弦 + 如意云肩 + 缠枝宝相莲 + 仰莲足纹） */
function renderPresetQinghuaUV(ctx, W, H) {
    const drawBand = (yRatio, lw = 1.7, alpha = 0.88) => {
        ctx.save();
        ctx.strokeStyle = `rgba(17, 48, 118, ${alpha})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(0, yRatio * H);
        ctx.lineTo(W, yRatio * H);
        ctx.stroke();
        ctx.restore();
    };

    // 1. 口沿与肩部双弦纹 + 辅助分隔双弦纹
    drawBand(0.035, 2.0, 0.92);
    drawBand(0.055, 1.2, 0.78);
    drawBand(0.195, 1.8, 0.88);
    drawBand(0.215, 1.1, 0.72);
    drawBand(0.765, 1.4, 0.82);
    drawBand(0.785, 2.0, 0.90);
    drawBand(0.955, 2.2, 0.92);

    // 2. 如意云头肩纹（8组无缝垂挂）
    const collarCount = 8;
    const collarStep = W / collarCount;
    for (let i = -1; i <= collarCount; i++) {
        const cx = (i + 0.5) * collarStep;
        const topY = 0.062 * H;
        const botY = 0.184 * H;
        const halfW = collarStep * 0.44;
        ctx.save();
        const grad = ctx.createLinearGradient(cx, topY, cx, botY);
        grad.addColorStop(0, 'rgba(34, 78, 162, 0.48)');
        grad.addColorStop(1, 'rgba(18, 52, 126, 0.18)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'rgba(16, 44, 110, 0.88)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - halfW, topY);
        ctx.bezierCurveTo(cx - halfW * 0.95, topY + (botY - topY) * 0.55, cx - halfW * 0.42, botY - 4, cx, botY);
        ctx.bezierCurveTo(cx + halfW * 0.42, botY - 4, cx + halfW * 0.95, topY + (botY - topY) * 0.55, cx + halfW, topY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 云头内卷小 trefoil 留白线刻
        ctx.strokeStyle = 'rgba(15, 40, 102, 0.78)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(cx, topY + (botY - topY) * 0.44, 4.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(28, 22, 24, 0.85)';
        ctx.beginPath();
        ctx.arc(cx, botY - 3, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 3. 主腹缠枝蔓藤（连续正弦 S-曲线贯穿 0..W）
    ctx.save();
    ctx.strokeStyle = 'rgba(18, 50, 122, 0.88)';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const midY = 0.49 * H;
    const amp = 0.145 * H;
    for (let x = 0; x <= W; x += 4) {
        const y = midY + Math.sin((x / W) * Math.PI * 4) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 副枝卷草嫩叶（顺蔓滋生）
    const drawLeaf = (lx, ly, angle, len) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);
        const lGrad = ctx.createLinearGradient(0, 0, len, 0);
        lGrad.addColorStop(0, 'rgba(18, 48, 118, 0.90)');
        lGrad.addColorStop(0.6, 'rgba(42, 82, 165, 0.65)');
        lGrad.addColorStop(1, 'rgba(20, 48, 115, 0.85)');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.45, -len * 0.34, len, -len * 0.08);
        ctx.quadraticCurveTo(len * 0.55, len * 0.24, 0, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(14, 38, 96, 0.88)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
    };

    const leafSites = 16;
    for (let i = 0; i < leafSites; i++) {
        const x = (i + 0.35) * (W / leafSites);
        const phase = (x / W) * Math.PI * 4;
        const y = midY + Math.sin(phase) * amp;
        const dir = i % 2 === 0 ? -1 : 1;
        drawLeaf(x, y, dir * 0.72 - 0.15, 19);
        drawLeaf(x + 8, y + dir * 2, dir * 1.18, 13);
    }
    ctx.restore();

    // 4. 四朵宣德宝相缠枝莲花（等距分布 360°，分水浓淡过渡 + 苏麻离青铁斑）
    const drawBaoxiangLotus = (cx, cy, scale) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const outerPetals = 8;
        for (let p = 0; p < outerPetals; p++) {
            const a = (p / outerPetals) * Math.PI * 2;
            ctx.save();
            ctx.rotate(a);
            const pGrad = ctx.createRadialGradient(0, -18, 2, 0, -18, 14);
            pGrad.addColorStop(0, 'rgba(54, 96, 178, 0.32)');
            pGrad.addColorStop(0.75, 'rgba(20, 56, 134, 0.78)');
            pGrad.addColorStop(1, 'rgba(14, 38, 96, 0.92)');
            ctx.fillStyle = pGrad;
            ctx.strokeStyle = 'rgba(14, 38, 96, 0.95)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(-5.5, -10);
            ctx.quadraticCurveTo(-9.5, -24, 0, -30);
            ctx.quadraticCurveTo(9.5, -24, 5.5, -10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // 内层重瓣莲蓬
        ctx.fillStyle = 'rgba(22, 58, 136, 0.82)';
        ctx.strokeStyle = 'rgba(14, 36, 92, 0.95)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 莲心留白圈与莲子点染
        ctx.fillStyle = 'rgba(240, 245, 250, 0.88)';
        ctx.beginPath();
        ctx.arc(0, 0, 5.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(18, 34, 72, 0.95)';
        for (let s = 0; s < 5; s++) {
            const sa = (s / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(sa) * 3.1, Math.sin(sa) * 3.1, 1.0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 苏麻离青铁锈结晶斑点
        ctx.fillStyle = 'rgba(26, 20, 22, 0.78)';
        for (let f = 0; f < 6; f++) {
            const fa = f * 1.05 + 0.3;
            ctx.beginPath();
            ctx.arc(Math.cos(fa) * 20, Math.sin(fa) * 20, 1.25, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };

    const flowerCount = 4;
    for (let f = -1; f <= flowerCount; f++) {
        const fx = (f + 0.25) * (W / flowerCount);
        const fy = midY + (f % 2 === 0 ? -0.10 : 0.10) * H;
        drawBaoxiangLotus(fx, fy, 1.05);
    }

    // 5. 近足仰莲瓣纹（12瓣等距环绕）
    const footCount = 12;
    const footStep = W / footCount;
    for (let i = -1; i <= footCount; i++) {
        const cx = (i + 0.5) * footStep;
        const yBot = 0.945 * H;
        const yTop = 0.805 * H;
        const halfW = footStep * 0.42;
        ctx.save();
        const fGrad = ctx.createLinearGradient(cx, yTop, cx, yBot);
        fGrad.addColorStop(0, 'rgba(42, 82, 165, 0.28)');
        fGrad.addColorStop(1, 'rgba(16, 46, 114, 0.72)');
        ctx.fillStyle = fGrad;
        ctx.strokeStyle = 'rgba(15, 42, 106, 0.90)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(cx - halfW, yBot);
        ctx.quadraticCurveTo(cx - halfW * 0.8, yTop + 6, cx, yTop);
        ctx.quadraticCurveTo(cx + halfW * 0.8, yTop + 6, cx + halfW, yBot);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(18, 48, 118, 0.65)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(cx - halfW * 0.52, yBot - 2);
        ctx.quadraticCurveTo(cx, yTop + 8, cx + halfW * 0.52, yBot - 2);
        ctx.stroke();
        ctx.restore();
    }
}

/** 重绘预设纹饰柱面 UV 层 */
function renderPresetPatternUV() {
    presetUVCtx.clearRect(0, 0, UV_W, UV_H);
    if (currentPotPattern === 'qinghua') {
        renderPresetQinghuaUV(presetUVCtx, UV_W, UV_H);
    } else if (currentPotPattern === 'lotus') {
        // 定窑半刀泥划花莲瓣纹（双勾阳起线 + 凹刻暗影）
        const count = 10;
        const step = UV_W / count;
        for (let i = -1; i <= count; i++) {
            const cx = (i + 0.5) * step;
            const yTop = 0.28 * UV_H;
            const yBot = 0.82 * UV_H;
            const hw = step * 0.42;
            presetUVCtx.save();
            presetUVCtx.strokeStyle = 'rgba(45, 38, 30, 0.42)';
            presetUVCtx.lineWidth = 2.6;
            presetUVCtx.beginPath();
            presetUVCtx.moveTo(cx - hw, yBot);
            presetUVCtx.quadraticCurveTo(cx, yTop - 10, cx + hw, yBot);
            presetUVCtx.stroke();

            presetUVCtx.strokeStyle = 'rgba(255, 252, 245, 0.55)';
            presetUVCtx.lineWidth = 1.4;
            presetUVCtx.beginPath();
            presetUVCtx.moveTo(cx - hw + 2.5, yBot);
            presetUVCtx.quadraticCurveTo(cx + 2, yTop - 7, cx + hw - 2.5, yBot);
            presetUVCtx.stroke();
            presetUVCtx.restore();
        }
    } else if (currentPotPattern === 'goldring') {
        // 南宋官窑凸弦鎏金纹
        presetUVCtx.save();
        [0.18, 0.34, 0.56, 0.78].forEach(yr => {
            const y = yr * UV_H;
            const g = presetUVCtx.createLinearGradient(0, y - 3, 0, y + 3);
            g.addColorStop(0, 'rgba(175, 132, 48, 0.90)');
            g.addColorStop(0.5, 'rgba(250, 224, 138, 0.96)');
            g.addColorStop(1, 'rgba(165, 120, 42, 0.90)');
            presetUVCtx.strokeStyle = g;
            presetUVCtx.lineWidth = 4.2;
            presetUVCtx.beginPath();
            presetUVCtx.moveTo(0, y);
            presetUVCtx.lineTo(UV_W, y);
            presetUVCtx.stroke();
        });
        presetUVCtx.restore();
    }
    uvDirty = true;
}

function selectPotGlaze(glazeKey) {
    currentClayGlaze = glazeKey;
    document.querySelectorAll('.pot-glaze-btn').forEach(btn => {
        if (btn.dataset.glaze === glazeKey) {
            btn.classList.add('ring-2', 'scale-105');
        } else {
            btn.classList.remove('ring-2', 'scale-105');
        }
    });
    playCrackleSound();
    ensurePotteryRender();
    const gNames = {
        tianqing: '雨过天青釉',
        fenqing: '龙泉粉青釉',
        yuebai: '官窑月白釉',
        qinghua_white: '景德镇永宣甜白釉',
        junhong: '钧窑玫瑰紫窑变釉',
        jianhei: '建盏乌金兔毫釉'
    };
    if (typeof showToast === 'function') {
        showToast(`🎨 已选配秘制矿物釉：【${gNames[glazeKey] || glazeKey}】`);
    }
}

function selectPotSeal(sealText) {
    currentPotSeal = sealText;
    document.querySelectorAll('.pot-seal-btn').forEach(btn => {
        if (btn.dataset.seal === sealText) {
            btn.classList.add('bg-tianqing-deep', 'text-white');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
    playPorcelainChime(2480);
    ensurePotteryRender();
    if (typeof showToast === 'function') {
        showToast(`💮 已镌刻专属器底篆刻落款：【${sealText}制】`);
    }
}

function firePotInKiln() {
    const kilnOverlay = document.getElementById('kiln-fire-overlay');
    const kilnTempText = document.getElementById('kiln-temp-text');
    const kilnStageText = document.getElementById('kiln-stage-text');
    const curveCanvas = document.getElementById('kiln-curve-canvas');
    if (!kilnOverlay || !kilnTempText) return;

    kilnOverlay.classList.remove('hidden');
    let temp = 25;
    const tempHistory = [25];

    const interval = setInterval(() => {
        temp += 48;
        tempHistory.push(Math.min(1300, temp));

        if (kilnStageText) {
            if (temp < 450) kilnStageText.textContent = '阶段一 (25–450℃)：低温烘坯排湿 · 吸附水蒸发';
            else if (temp < 850) kilnStageText.textContent = '阶段二 (573–850℃)：α-β石英晶型转化 · 高岭石脱羟基素烧';
            else if (temp < 1120) kilnStageText.textContent = '阶段三 (980–1120℃)：封门投松柴 · CO强还原焰使Fe³⁺转化为Fe²⁺';
            else kilnStageText.textContent = '阶段四 (1250–1300℃)：莫来石针状晶网交织 · 玛瑙石英熔融成玉';
        }

        // 实时绘制龙窑升温曲线
        if (curveCanvas) {
            const cCtx = curveCanvas.getContext('2d');
            const cw = curveCanvas.width;
            const ch = curveCanvas.height;
            cCtx.clearRect(0, 0, cw, ch);
            cCtx.fillStyle = 'rgba(0,0,0,0.45)';
            cCtx.fillRect(0, 0, cw, ch);

            cCtx.strokeStyle = 'rgba(255,255,255,0.15)';
            cCtx.lineWidth = 1;
            cCtx.beginPath();
            cCtx.moveTo(0, ch * 0.3); cCtx.lineTo(cw, ch * 0.3);
            cCtx.moveTo(0, ch * 0.65); cCtx.lineTo(cw, ch * 0.65);
            cCtx.stroke();

            cCtx.strokeStyle = '#F7D89C';
            cCtx.lineWidth = 2.5;
            cCtx.beginPath();
            tempHistory.forEach((tVal, idx) => {
                const x = (idx / 28) * cw;
                const y = ch - (tVal / 1350) * (ch - 14) - 6;
                if (idx === 0) cCtx.moveTo(x, y);
                else cCtx.lineTo(x, y);
            });
            cCtx.stroke();
        }

        if (temp >= 1300) {
            temp = 1300;
            clearInterval(interval);
            setTimeout(() => {
                kilnOverlay.classList.add('hidden');
                isFired = true;
                updateFiringBadge('1300℃ 柴窑涅槃 · 官瓷玉成');
                ensurePotteryRender();
                if (window.AppBus) {
                    window.AppBus.emit('study:pottery-fired', {
                        glaze: currentClayGlaze,
                        pattern: currentPotPattern
                    });
                }
                playPorcelainChime(2680);
                setTimeout(playCrackleSound, 320);
                setTimeout(playCrackleSound, 750);
                setTimeout(playCrackleSound, 1320);
                setTimeout(playCrackleSound, 1980);
                if (typeof showToast === 'function') {
                    showToast('🔥 开窑大吉！胎骨致密如金石、釉泛温润玉光，可导出专属数字藏品证书！');
                }
            }, 600);
        }
        kilnTempText.textContent = `${temp} ℃`;
    }, 50);
}

function updateFiringBadge(text) {
    const badge = document.getElementById('pottery-status-badge');
    if (badge) badge.textContent = text;
}

/** 将自由手绘青花笔触绘制到 360° 无缝柱面 UV 画布（支持连续插值、分水晕染与铁锈点斑） */
function stampBrushUV(u, v) {
    const sizeScale = brushSize === 'sm' ? 0.58 : (brushSize === 'lg' ? 1.72 : 1.0);
    const baseR = (brushStyle === 'wash' ? 11.5 : brushStyle === 'erase' ? 10.5 : brushStyle === 'iron' ? 7.0 : 4.2) * sizeScale;
    const cx = u * UV_W;
    const cy = v * UV_H;

    // 跨接缝同步绘制 [-UV_W, 0, +UV_W]，保证 360° 旋转零接缝
    [-UV_W, 0, UV_W].forEach(shiftX => {
        const px = cx + shiftX;
        if (px + baseR < -4 || px - baseR > UV_W + 4) return;

        paintUVCtx.save();
        if (brushStyle === 'erase') {
            paintUVCtx.globalCompositeOperation = 'destination-out';
            const eGrad = paintUVCtx.createRadialGradient(px, cy, 0, px, cy, baseR);
            eGrad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
            eGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            paintUVCtx.fillStyle = eGrad;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, baseR, 0, Math.PI * 2);
            paintUVCtx.fill();
        } else if (brushStyle === 'wash') {
            // 分水晕染：边缘柔化透明钴蓝水彩积淀
            const wGrad = paintUVCtx.createRadialGradient(px, cy, baseR * 0.1, px, cy, baseR);
            wGrad.addColorStop(0, 'rgba(42, 88, 175, 0.24)');
            wGrad.addColorStop(0.65, 'rgba(26, 66, 146, 0.14)');
            wGrad.addColorStop(1, 'rgba(22, 58, 132, 0)');
            paintUVCtx.fillStyle = wGrad;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, baseR, 0, Math.PI * 2);
            paintUVCtx.fill();
        } else if (brushStyle === 'iron') {
            // 苏麻离青铁锈斑点染：深沉暗褐金属晶斑群 + 钴晕
            const halo = paintUVCtx.createRadialGradient(px, cy, 0, px, cy, baseR * 1.15);
            halo.addColorStop(0, 'rgba(22, 34, 68, 0.55)');
            halo.addColorStop(1, 'rgba(18, 44, 110, 0)');
            paintUVCtx.fillStyle = halo;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, baseR * 1.15, 0, Math.PI * 2);
            paintUVCtx.fill();

            const speckCount = 4;
            for (let k = 0; k < speckCount; k++) {
                const a = Math.random() * Math.PI * 2;
                const d = Math.random() * baseR * 0.65;
                const sr = (0.75 + Math.random() * 1.15) * sizeScale;
                paintUVCtx.fillStyle = k % 2 === 0 ? 'rgba(28, 19, 18, 0.88)' : 'rgba(12, 26, 58, 0.84)';
                paintUVCtx.beginPath();
                paintUVCtx.arc(px + Math.cos(a) * d, cy + Math.sin(a) * d, sr, 0, Math.PI * 2);
                paintUVCtx.fill();
            }
        } else {
            // 浓青勾线：饱满圆润中锋笔道
            const oGrad = paintUVCtx.createRadialGradient(px, cy, baseR * 0.25, px, cy, baseR);
            oGrad.addColorStop(0, 'rgba(14, 40, 102, 0.94)');
            oGrad.addColorStop(0.75, 'rgba(20, 56, 136, 0.82)');
            oGrad.addColorStop(1, 'rgba(22, 62, 142, 0)');
            paintUVCtx.fillStyle = oGrad;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, baseR, 0, Math.PI * 2);
            paintUVCtx.fill();
        }
        paintUVCtx.restore();
    });
    uvDirty = true;
}

function strokeBrushUV(u0, v0, u1, v1) {
    let du = u1 - u0;
    if (du > 0.5) du -= 1;
    if (du < -0.5) du += 1;
    const dv = v1 - v0;
    const distPx = Math.hypot(du * UV_W, dv * UV_H);
    const stepPx = brushStyle === 'iron' ? 4.5 : 2.2;
    const steps = Math.max(1, Math.min(48, Math.ceil(distPx / stepPx)));
    for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const u = (((u0 + du * t) % 1) + 1) % 1;
        const v = Math.max(0.01, Math.min(0.99, v0 + dv * t));
        stampBrushUV(u, v);
    }
}

function bindPotteryEvents() {
    if (!potCanvas) return;

    const handlePointerAction = (e) => {
        if (!isInteractingPot) return;
        isPotteryVisible = true;
        if (isFired) {
            isFired = false;
            updateFiringBadge('高岭土湿坯 · 随指塑形中');
        }

        const rect = potCanvas.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        if (clientX === null || clientY === null) return;

        const scaleX = potCanvas.width / (rect.width || potCanvas.width);
        const scaleY = potCanvas.height / (rect.height || potCanvas.height);
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;

        pointerPos = { x: canvasX, y: canvasY, active: true };

        const bottomY = potCanvas.height * 0.85;
        const totalHeight = potCanvas.height * 0.67;
        const topY = bottomY - totalHeight;
        const normalizedY = (bottomY - canvasY) / totalHeight;
        const sliceIndex = Math.floor(normalizedY * SLICE_COUNT);

        if (sliceIndex >= 0 && sliceIndex < SLICE_COUNT) {
            const centerX = potCanvas.width / 2;
            const currentDist = Math.abs(canvasX - centerX);
            const maxRadiusPx = potCanvas.width * 0.34;
            const distRatio = Math.max(0.12, Math.min(0.98, currentDist / maxRadiusPx));

            if (potToolMode === 'brush') {
                // 360° 柱面反投影手绘青花：勾线 / 分水 / 点斑 / 刮料
                const sliceRx = Math.max(10, (clayRadii[sliceIndex] || 0.45) * maxRadiusPx);
                const nx = Math.max(-0.96, Math.min(0.96, (canvasX - centerX) / sliceRx));
                const alpha = Math.asin(nx);
                const theta = clayRotationAngle + alpha;
                const u = (((theta / (Math.PI * 2)) % 1) + 1) % 1;
                const v = Math.max(0.01, Math.min(0.99, (canvasY - topY) / totalHeight));
                if (lastBrushUV) {
                    strokeBrushUV(lastBrushUV.u, lastBrushUV.v, u, v);
                } else {
                    stampBrushUV(u, v);
                }
                lastBrushUV = { u, v };
            } else {
                lastBrushUV = null;
                // 造物塑形模式：收束 / 鼓腹 / 跟随修光揉搓
                const influenceRange = 5;
                for (let offset = -influenceRange; offset <= influenceRange; offset++) {
                    const idx = sliceIndex + offset;
                    if (idx >= 0 && idx < SLICE_COUNT) {
                        const weight = Math.cos((offset / (influenceRange + 0.5)) * (Math.PI / 2));
                        if (potToolMode === 'push') {
                            targetRadii[idx] = Math.max(0.15, targetRadii[idx] - 0.042 * weight);
                        } else if (potToolMode === 'pull') {
                            targetRadii[idx] = Math.min(0.98, targetRadii[idx] + 0.042 * weight);
                        } else {
                            targetRadii[idx] += (distRatio - targetRadii[idx]) * 0.32 * weight;
                            targetRadii[idx] = Math.max(0.15, Math.min(0.98, targetRadii[idx]));
                        }
                    }
                }
                updatePotteryLiveMetrics();
            }

            if (potToolMode !== 'brush') {
                for (let p = 0; p < 2; p++) {
                    splashParticles.push({
                        x: canvasX + (Math.random() - 0.5) * 14,
                        y: canvasY + (Math.random() - 0.5) * 10,
                        vx: (canvasX > centerX ? 1 : -1) * (1.5 + Math.random() * 2.5),
                        vy: -1.5 - Math.random() * 2.2,
                        r: 1.5 + Math.random() * 2.5,
                        alpha: 0.85
                    });
                }
            }
        }
    };

    potCanvas.addEventListener('mousedown', (e) => {
        savePotterySnapshot();
        isInteractingPot = true;
        lastBrushUV = null;
        initAudioContext();
        handlePointerAction(e);
    });
    window.addEventListener('mousemove', (e) => {
        if (isInteractingPot) handlePointerAction(e);
    });
    window.addEventListener('mouseup', () => {
        isInteractingPot = false;
        lastBrushUV = null;
        pointerPos.active = false;
    });

    potCanvas.addEventListener('touchstart', (e) => {
        savePotterySnapshot();
        isInteractingPot = true;
        lastBrushUV = null;
        initAudioContext();
        handlePointerAction(e);
        if (e.cancelable) e.preventDefault();
    }, { passive: false });
    potCanvas.addEventListener('touchmove', (e) => {
        if (isInteractingPot) handlePointerAction(e);
        if (e.cancelable) e.preventDefault();
    }, { passive: false });
    potCanvas.addEventListener('touchend', () => {
        isInteractingPot = false;
        lastBrushUV = null;
        pointerPos.active = false;
    });
}

function setPotTool(mode) {
    potToolMode = mode;
    document.querySelectorAll('.pot-tool-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('bg-tianqing-deep', 'text-white');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
    const brushGroup = document.getElementById('pot-brush-style-group');
    if (brushGroup) {
        brushGroup.classList.toggle('hidden', mode !== 'brush');
    }
    updateWheelSpeedLabel();
    ensurePotteryRender();
    const toasts = {
        push: '🖐️ 已切换至【向内收束】：在泥坯表面拖拽使器身向内收拢',
        pull: '🖐️ 已切换至【向外鼓腹】：在泥坯表面拖拽使器腹向外丰满饱满',
        smooth: '✨ 已切换至【跟随修光】：指尖揉搓泥胚，器型实时顺滑贴合',
        brush: '🖌️ 已切换至【手绘青花】：直接在旋转坯体表面绘制青花弦纹'
    };
    if (typeof showToast === 'function') {
        showToast(toasts[mode] || '已切换造物工具');
    }
}

let lastPotTick = 0;
function potAnimLoop(now) {
    if (!isPotteryVisible || document.hidden) {
        potAnimId = null;
        return;
    }
    potAnimId = requestAnimationFrame(potAnimLoop);
    if (!potCtx || !potCanvas) return;

    const w = potCanvas.width;
    const h = potCanvas.height;
    potCtx.clearRect(0, 0, w, h);

    for (let i = 0; i < SLICE_COUNT; i++) {
        clayRadii[i] += (targetRadii[i] - clayRadii[i]) * 0.14;
    }
    if (!wheelPaused) {
        const spinSpeed = potToolMode === 'brush' ? (isInteractingPot ? 0.004 : 0.015) : 0.055;
        clayRotationAngle += spinSpeed;
    }

    const centerX = w / 2;
    const bottomY = h * 0.85;
    const totalHeight = h * 0.67;
    const stepH = totalHeight / (SLICE_COUNT - 1);
    const maxRadiusPx = w * 0.34;

    // 1. 博物馆聚光背景与黄金比例测绘标尺网格
    const bgGlow = potCtx.createRadialGradient(centerX, h * 0.45, 20, centerX, h * 0.45, w * 0.48);
    bgGlow.addColorStop(0, isFired ? 'rgba(143, 184, 192, 0.22)' : 'rgba(197, 160, 89, 0.12)');
    bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    potCtx.fillStyle = bgGlow;
    potCtx.fillRect(0, 0, w, h);

    // 对称中轴线与测绘刻度虚线
    potCtx.save();
    potCtx.strokeStyle = 'rgba(212, 175, 106, 0.15)';
    potCtx.setLineDash([4, 4]);
    potCtx.beginPath();
    potCtx.moveTo(centerX, h * 0.12);
    potCtx.lineTo(centerX, bottomY + 15);
    potCtx.stroke();
    potCtx.restore();

    // 2. 檀木鎏金陶轮
    potCtx.save();
    potCtx.fillStyle = '#14100d';
    potCtx.beginPath();
    potCtx.ellipse(centerX, bottomY + 18, maxRadiusPx * 1.18, 28, 0, 0, Math.PI * 2);
    potCtx.fill();

    const wheelGrad = potCtx.createLinearGradient(centerX - maxRadiusPx, 0, centerX + maxRadiusPx, 0);
    wheelGrad.addColorStop(0, '#2a2019');
    wheelGrad.addColorStop(0.5, '#4b3a2c');
    wheelGrad.addColorStop(1, '#241b15');
    potCtx.fillStyle = wheelGrad;
    potCtx.beginPath();
    potCtx.ellipse(centerX, bottomY + 10, maxRadiusPx * 1.14, 25, 0, 0, Math.PI * 2);
    potCtx.fill();

    potCtx.strokeStyle = 'rgba(212, 175, 106, 0.38)';
    potCtx.lineWidth = 1.4;
    [0.45, 0.78, 1.04].forEach(rScale => {
        potCtx.beginPath();
        potCtx.ellipse(centerX, bottomY + 10, maxRadiusPx * rScale, 25 * rScale, 0, 0, Math.PI * 2);
        potCtx.stroke();
    });
    potCtx.restore();

    // 3. 构建器物左右平滑边界点
    const leftPts = [];
    const rightPts = [];
    for (let i = 0; i < SLICE_COUNT; i++) {
        const y = bottomY - i * stepH;
        const rx = clayRadii[i] * maxRadiusPx;
        leftPts.push({ x: centerX - rx, y, rx });
        rightPts.push({ x: centerX + rx, y, rx });
    }

    // 4. 绘制器物本体 3D 圆柱高光渐变
    potCtx.save();
    const bodyGrad = potCtx.createLinearGradient(centerX - maxRadiusPx, 0, centerX + maxRadiusPx, 0);

    if (!isFired) {
        bodyGrad.addColorStop(0.0, '#443e38');
        bodyGrad.addColorStop(0.24, '#7d756c');
        bodyGrad.addColorStop(0.42, '#b5aca2');
        bodyGrad.addColorStop(0.68, '#69625a');
        bodyGrad.addColorStop(1.0, '#36312c');
    } else {
        if (currentClayGlaze === 'tianqing') {
            bodyGrad.addColorStop(0.0, '#46676e');
            bodyGrad.addColorStop(0.28, '#8fb8c0');
            bodyGrad.addColorStop(0.44, '#d6eef2');
            bodyGrad.addColorStop(0.74, '#689199');
            bodyGrad.addColorStop(1.0, '#314c52');
        } else if (currentClayGlaze === 'fenqing') {
            bodyGrad.addColorStop(0.0, '#3d5e50');
            bodyGrad.addColorStop(0.28, '#7eaf9b');
            bodyGrad.addColorStop(0.44, '#cceee0');
            bodyGrad.addColorStop(0.74, '#598775');
            bodyGrad.addColorStop(1.0, '#2c463b');
        } else if (currentClayGlaze === 'yuebai') {
            bodyGrad.addColorStop(0.0, '#72828a');
            bodyGrad.addColorStop(0.28, '#c8d8de');
            bodyGrad.addColorStop(0.44, '#ffffff');
            bodyGrad.addColorStop(0.74, '#9eb0b8');
            bodyGrad.addColorStop(1.0, '#516066');
        } else if (currentClayGlaze === 'qinghua_white') {
            bodyGrad.addColorStop(0.0, '#9aa3a8');
            bodyGrad.addColorStop(0.26, '#eef2f3');
            bodyGrad.addColorStop(0.44, '#ffffff');
            bodyGrad.addColorStop(0.74, '#dce2e6');
            bodyGrad.addColorStop(1.0, '#7d858a');
        } else if (currentClayGlaze === 'junhong') {
            bodyGrad.addColorStop(0.0, '#3e1229');
            bodyGrad.addColorStop(0.28, '#8a2f5d');
            bodyGrad.addColorStop(0.45, '#d978a8');
            bodyGrad.addColorStop(0.72, '#542c6e');
            bodyGrad.addColorStop(1.0, '#280a1c');
        } else {
            bodyGrad.addColorStop(0.0, '#0c0a0b');
            bodyGrad.addColorStop(0.30, '#2e2729');
            bodyGrad.addColorStop(0.45, '#6e5c46');
            bodyGrad.addColorStop(0.72, '#1d181a');
            bodyGrad.addColorStop(1.0, '#080607');
        }
    }

    potCtx.beginPath();
    potCtx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < leftPts.length; i++) {
        const xc = (leftPts[i].x + leftPts[i - 1].x) / 2;
        const yc = (leftPts[i].y + leftPts[i - 1].y) / 2;
        potCtx.quadraticCurveTo(leftPts[i - 1].x, leftPts[i - 1].y, xc, yc);
    }
    const topIdx = SLICE_COUNT - 1;
    potCtx.lineTo(leftPts[topIdx].x, leftPts[topIdx].y);
    potCtx.ellipse(centerX, leftPts[topIdx].y, leftPts[topIdx].rx, 9, 0, Math.PI, 0, true);

    for (let i = rightPts.length - 1; i >= 1; i--) {
        const xc = (rightPts[i].x + rightPts[i - 1].x) / 2;
        const yc = (rightPts[i].y + rightPts[i - 1].y) / 2;
        potCtx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, xc, yc);
    }
    potCtx.lineTo(rightPts[0].x, rightPts[0].y);
    potCtx.ellipse(centerX, bottomY, rightPts[0].rx, 11, 0, 0, Math.PI, false);
    potCtx.closePath();

    potCtx.fillStyle = bodyGrad;
    potCtx.fill();
    potCtx.clip();

    // 纵向曲率平滑渐变明暗（按 stopT 升序排布并收敛甜白釉暗影阈值）
    const topY = leftPts[topIdx].y;
    const vertGrad = potCtx.createLinearGradient(0, topY, 0, bottomY);
    const isSweetWhite = isFired && currentClayGlaze === 'qinghua_white';
    const maxLight = isSweetWhite ? 0.12 : (isFired ? 0.16 : 0.20);
    const maxDark = isSweetWhite ? 0.08 : (isFired ? 0.13 : 0.20);
    for (let i = SLICE_COUNT - 1; i >= 0; i -= 4) {
        const stopT = Math.max(0, Math.min(1, (SLICE_COUNT - 1 - i) / (SLICE_COUNT - 1)));
        const prev = clayRadii[Math.max(0, i - 1)];
        const next = clayRadii[Math.min(SLICE_COUNT - 1, i + 1)];
        const dr = next - prev;
        if (dr > 0.008) {
            vertGrad.addColorStop(stopT, `rgba(255, 255, 255, ${Math.min(maxLight, dr * 1.4)})`);
        } else if (dr < -0.008) {
            vertGrad.addColorStop(stopT, `rgba(0, 0, 0, ${Math.min(maxDark, -dr * 1.3)})`);
        } else {
            vertGrad.addColorStop(stopT, 'rgba(0, 0, 0, 0)');
        }
    }
    vertGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    potCtx.fillStyle = vertGrad;
    potCtx.fillRect(centerX - maxRadiusPx, topY, maxRadiusPx * 2, totalHeight + 2);

    // 旋转拉坯旋纹（成瓷甜白釉面柔化旋纹以突出釉下青花）
    if (!isFired || currentClayGlaze !== 'qinghua_white') {
        potCtx.strokeStyle = isFired ? 'rgba(255, 255, 255, 0.07)' : 'rgba(30, 22, 16, 0.14)';
        potCtx.lineWidth = 1.0;
        for (let i = 2; i < SLICE_COUNT - 1; i += 2) {
            const y = leftPts[i].y;
            const rx = leftPts[i].rx;
            potCtx.beginPath();
            potCtx.ellipse(centerX, y, rx * 0.98, 7, 0, 0, Math.PI);
            potCtx.stroke();
        }
    }

    // 4.5 柱面 UV 透视重投影：将预设纹饰 + 手绘青花包裹贴合到 44 层可变曲率器腹
    if (uvDirty) {
        uvTiledCtx.clearRect(0, 0, UV_W * 2, UV_H);
        uvTiledCtx.drawImage(presetUVCanvas, 0, 0);
        uvTiledCtx.drawImage(paintUVCanvas, 0, 0);
        uvTiledCtx.drawImage(presetUVCanvas, UV_W, 0);
        uvTiledCtx.drawImage(paintUVCanvas, UV_W, 0);
        uvDirty = false;
    }

    hemiCtx.clearRect(0, 0, HEMI_W, HEMI_H);
    for (let s = 0; s < HEMI_STRIPS; s++) {
        const nx0 = -1 + (2 * s) / HEMI_STRIPS;
        const nx1 = -1 + (2 * (s + 1)) / HEMI_STRIPS;
        const alpha0 = Math.asin(nx0);
        const alpha1 = Math.asin(nx1);
        const u0 = (((clayRotationAngle + alpha0) / (Math.PI * 2)) % 1 + 1) % 1;
        const du = (alpha1 - alpha0) / (Math.PI * 2);
        const sx = u0 * UV_W;
        const sw = Math.max(0.5, du * UV_W);
        const dx0 = Math.round((nx0 + 1) * 0.5 * HEMI_W);
        const dx1 = Math.round((nx1 + 1) * 0.5 * HEMI_W);
        const dw = Math.max(1, dx1 - dx0);
        hemiCtx.drawImage(uvTiledCanvas, sx, 0, sw, UV_H, dx0, 0, dw, HEMI_H);
    }

    // 生坯态钴料呈灰褐青色，高温窑烧后还原呈浓艳宝蓝并自带釉下融合深度
    if (!isFired && currentPotPattern !== 'goldring') {
        hemiCtx.save();
        hemiCtx.globalCompositeOperation = 'source-atop';
        hemiCtx.fillStyle = 'rgba(72, 66, 58, 0.54)';
        hemiCtx.fillRect(0, 0, HEMI_W, HEMI_H);
        hemiCtx.restore();
    }

    potCtx.save();
    if (isFired && currentPotPattern !== 'goldring') {
        potCtx.globalCompositeOperation = 'multiply';
        potCtx.globalAlpha = currentClayGlaze === 'jianhei' ? 0.45 : 0.94;
    } else {
        potCtx.globalCompositeOperation = 'source-over';
        potCtx.globalAlpha = isFired ? 0.94 : 0.82;
    }
    for (let i = 0; i < SLICE_COUNT - 1; i++) {
        const yBotPx = i === 0 ? Math.ceil(leftPts[i].y) : Math.round(leftPts[i].y);
        const yTopPx = i === SLICE_COUNT - 2 ? Math.floor(leftPts[i + 1].y) : Math.round(leftPts[i + 1].y);
        const sliceH = Math.max(1, yBotPx - yTopPx);
        const rxRow = Math.max(leftPts[i].rx, leftPts[i + 1].rx) * 1.025;
        const vTop = (SLICE_COUNT - 1 - (i + 1)) / (SLICE_COUNT - 1);
        const vBot = (SLICE_COUNT - 1 - i) / (SLICE_COUNT - 1);
        const sy = vTop * HEMI_H;
        const sh = Math.max(1, (vBot - vTop) * HEMI_H);
        potCtx.drawImage(
            hemiCanvas,
            0, sy, HEMI_W, sh,
            centerX - rxRow, yTopPx, rxRow * 2, sliceH
        );
    }
    potCtx.restore();

    if (isFired) {
        // 仅宋代哥/汝/官/粉青名釉保留标志性开片冰裂纹，景德镇甜白釉保持洁净无开片玉感
        if (currentClayGlaze === 'tianqing' || currentClayGlaze === 'fenqing' || currentClayGlaze === 'yuebai') {
            potCtx.strokeStyle = 'rgba(40, 32, 26, 0.22)';
            potCtx.lineWidth = 1.0;
            for (let c = 0; c < 14; c++) {
                const si = (c * 3 + 2) % (SLICE_COUNT - 4);
                const y1 = leftPts[si].y;
                const y2 = leftPts[si + 3].y;
                const x1 = centerX + Math.sin(c * 1.7 + clayRotationAngle * 0.2) * leftPts[si].rx * 0.7;
                const x2 = x1 + Math.cos(c * 2.3) * 28;
                potCtx.beginPath();
                potCtx.moveTo(x1, y1);
                potCtx.lineTo(x2, y2);
                potCtx.stroke();
            }
        }

        const specGrad = potCtx.createLinearGradient(centerX - maxRadiusPx * 0.55, 0, centerX - maxRadiusPx * 0.15, 0);
        specGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.36)');
        specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        potCtx.fillStyle = specGrad;
        potCtx.fillRect(centerX - maxRadiusPx, 0, maxRadiusPx * 2, h);
    }

    potCtx.restore();

    // 5. 口沿与内膛
    potCtx.save();
    const mouthY = leftPts[topIdx].y;
    const mouthRx = leftPts[topIdx].rx;

    potCtx.strokeStyle = isFired ? 'rgba(255, 255, 255, 0.58)' : 'rgba(180, 170, 158, 0.5)';
    potCtx.lineWidth = 3.5;
    potCtx.beginPath();
    potCtx.ellipse(centerX, mouthY, mouthRx, 9, 0, 0, Math.PI * 2);
    potCtx.stroke();

    const innerGrad = potCtx.createLinearGradient(centerX - mouthRx, mouthY, centerX + mouthRx, mouthY);
    innerGrad.addColorStop(0, '#12100e');
    innerGrad.addColorStop(0.65, isFired ? '#3a5258' : '#3d3732');
    innerGrad.addColorStop(1, '#1a1714');
    potCtx.fillStyle = innerGrad;
    potCtx.beginPath();
    potCtx.ellipse(centerX, mouthY, Math.max(4, mouthRx - 3), 7.5, 0, 0, Math.PI * 2);
    potCtx.fill();
    potCtx.restore();

    // 6. 右上角实时渲染定制底款朱文篆刻印章
    potCtx.save();
    const sealX = w - 68;
    const sealY = 22;
    potCtx.fillStyle = 'rgba(168, 56, 59, 0.88)';
    potCtx.fillRect(sealX, sealY, 48, 48);
    potCtx.strokeStyle = '#F5EFE2';
    potCtx.lineWidth = 1.5;
    potCtx.strokeRect(sealX + 3, sealY + 3, 42, 42);
    potCtx.fillStyle = '#FFFFFF';
    potCtx.font = 'bold 14px "Noto Serif SC", "Songti SC", serif';
    potCtx.fillText(currentPotSeal.slice(0, 2), sealX + 9, sealY + 21);
    potCtx.fillText(currentPotSeal.slice(2, 4), sealX + 9, sealY + 39);
    potCtx.restore();

    // 7. 飞溅微粒
    for (let i = splashParticles.length - 1; i >= 0; i--) {
        const p = splashParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
            splashParticles.splice(i, 1);
            continue;
        }
        potCtx.fillStyle = isFired ? `rgba(229, 200, 136, ${p.alpha})` : `rgba(195, 182, 168, ${p.alpha})`;
        potCtx.beginPath();
        potCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        potCtx.fill();
    }

    if (pointerPos.active) {
        potCtx.strokeStyle = 'rgba(229, 200, 136, 0.85)';
        potCtx.lineWidth = 1.5;
        potCtx.beginPath();
        potCtx.arc(pointerPos.x, pointerPos.y, 12, 0, Math.PI * 2);
        potCtx.stroke();
    }
}

/**
 * 导出带编号、器型参数与底款印章的《专属造物数字藏品证书》高清海报
 */
function downloadPotteryArtwork() {
    if (!potCanvas) return;
    const metrics = updatePotteryLiveMetrics() || { heightCm: '24.2', mouthCm: '6.8', bellyCm: '15.6', volMl: 860, score: 96 };
    const gNames = { tianqing: '北宋汝窑雨过天青釉', fenqing: '南宋龙泉粉青如玉釉', yuebai: '宋官窑月白莹霜釉', qinghua_white: '景德镇永宣甜白青花釉', junhong: '禹州钧窑玫瑰紫窑变釉', jianhei: '建阳建窑乌金兔毫釉' };
    const pNames = { none: '素面玉肌', lotus: '定窑半刀泥浮雕莲瓣', qinghua: '宣德苏麻离青缠枝莲', goldring: '南宋官窑凸弦鎏金纹' };

    const poster = document.createElement('canvas');
    poster.width = 880;
    poster.height = 1060;
    const ctx = poster.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1060);
    bgGrad.addColorStop(0, '#0B1015');
    bgGrad.addColorStop(1, '#141E28');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 880, 1060);

    // 鎏金双边框
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 832, 1012);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, 816, 996);

    // 顶部博物院藏品抬头
    ctx.fillStyle = '#E5C888';
    ctx.font = 'bold 28px "Noto Serif SC", "Songti SC", serif';
    ctx.fillText('华夏器道 · 天青泥火 — 陶然天成造物典藏证书', 56, 86);
    ctx.fillStyle = '#8BC2CE';
    ctx.font = '14px monospace';
    ctx.fillText(`STUDIO ARCHIVE ID: #TC-${Date.now().toString().slice(-6)}   |   1300℃ DRAGON KILN CERTIFIED`, 56, 114);

    // 居中绘制拉坯作品画布
    ctx.drawImage(potCanvas, 160, 140, 560, 450);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.strokeRect(160, 140, 560, 450);

    // 作品参数档案区
    ctx.fillStyle = '#EEF4F7';
    ctx.font = 'bold 24px "Noto Serif SC", serif';
    ctx.fillText(`造物雅名：【${currentPotSeal} · ${gNames[currentClayGlaze] || '天青釉'}雅器】`, 56, 645);

    ctx.fillStyle = '#B0C0CC';
    ctx.font = '16px "Noto Serif SC", sans-serif';
    ctx.fillText(`• 秘制矿物釉相：${gNames[currentClayGlaze] || '雨过天青釉'} (${isFired ? '1300℃ 松柴还原焰已玉成' : '陈腐高岭土生坯'})`, 64, 690);
    ctx.fillText(`• 器身装饰工艺：${pNames[currentPotPattern] || '素面玉肌'}`, 64, 724);
    ctx.fillText(`• 实测三维规制：通高 ${metrics.heightCm} cm · 口径 ${metrics.mouthCm} cm · 腹径 ${metrics.bellyCm} cm · 容积 ${metrics.volMl} mL`, 64, 758);
    ctx.fillText(`• 宋韵美学评级：${metrics.score} 分 (黄金曲率与重心稳定度优等)`, 64, 792);
    ctx.fillText(`• 器底篆刻落款：「${currentPotSeal}」御制方印`, 64, 826);

    // 大朱文收藏印章
    ctx.fillStyle = '#A8383B';
    ctx.fillRect(700, 840, 108, 108);
    ctx.strokeStyle = '#F5EFE2';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(707, 847, 94, 94);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px "Noto Serif SC", serif';
    ctx.fillText(currentPotSeal.slice(0, 2), 726, 886);
    ctx.fillText(currentPotSeal.slice(2, 4), 726, 924);

    ctx.fillStyle = '#768999';
    ctx.font = '14px "Noto Serif SC", serif';
    ctx.fillText('“雨过天青云破处，这般颜色做将来。” —— 华夏器道 · 天青泥火数字造物工坊监制', 56, 965);

    const link = document.createElement('a');
    link.download = `华夏器道_数字藏品证书_${currentPotSeal}_${Date.now()}.png`;
    link.href = poster.toDataURL('image/png');
    link.click();
    if (typeof showToast === 'function') {
        showToast('🎉 已为您生成并导出《专属数字藏品收藏证书》高清海报！');
    }
}

window.initPotteryWorkshop = initPotteryWorkshop;
window.resetClay = resetClay;
window.applyPresetVessel = applyPresetVessel;
window.setPotPattern = setPotPattern;
window.selectPotGlaze = selectPotGlaze;
window.selectPotSeal = selectPotSeal;
window.firePotInKiln = firePotInKiln;
window.setPotTool = setPotTool;
window.downloadPotteryArtwork = downloadPotteryArtwork;
window.undoPotteryAction = undoPotteryAction;
window.setBrushStyle = setBrushStyle;
window.setBrushSize = setBrushSize;
window.toggleWheelPause = toggleWheelPause;
window.clearQinghuaPaint = clearQinghuaPaint;

window.playPorcelainChime = playPorcelainChime;
window.playCrackleSound = playCrackleSound;
window.playPentatonicChime = playPentatonicChime;
window.toggleAmbientGuqin = toggleAmbientGuqin;

window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const studio = document.getElementById('pottery-studio');
        if (studio) {
            const rect = studio.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                e.preventDefault();
                undoPotteryAction();
            }
        }
    }
});
