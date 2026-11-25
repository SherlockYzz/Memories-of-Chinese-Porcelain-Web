/**
 * 华夏器道 · 天青泥火 — 真 3D WebGL 指尖拉坯、工笔青花手绘、底款篆刻与 1300℃ 温控曲线仿真引擎
 * 核心架构：
 * 1. Three.js LatheGeometry 88层 Catmull-Rom 平滑实体曲面（含口沿壁厚与真实内膛，彻底消除分层锯齿）
 * 2. MeshPhysicalMaterial 双层清漆物理釉面 + PMREM 棚拍柔光反射贴图 + 拉坯细旋纹凹凸贴图
 * 3. 1024×512 高清柱面 UV 贴图 + Raycaster 精准 3D 曲面落笔 + 运笔速度压感毛笔 + 4/6重对称环绘 + 工笔青花印章
 * 4. 1300℃ 龙窑柴烧实时升温曲线图与《专属造物典藏证书》高清海报生成
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
            showToast('已开启【宋韵古琴与瓷磬空灵雅乐】合成器');
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
// 二、真 3D Three.js 拉坯塑形、高清柱面 UV 青花与 1300℃ 窑烧系统
// ================================================================
let potCanvas = null;
let potCtx = null; // 仅在无 WebGL 时启用 2D 兜底
let potAnimId = null;
let isInteractingPot = false;
let isOrbitDragging = false;
let orbitStart = { x: 0, y: 0, pitch: 0.14 };

let potToolMode = 'push'; // 'push' | 'pull' | 'smooth' | 'brush'
let brushStyle = 'outline'; // 'outline' | 'wash' | 'iron' | 'stamp' | 'erase'
let brushSize = 'md'; // 'sm' | 'md' | 'lg'
let brushSymmetry = 1; // 1 | 4 | 6
let brushStamp = 'lotus'; // 'lotus' | 'plum' | 'cloud' | 'band'
let wheelPaused = false;
let currentPotPattern = 'none'; // 'none' | 'lotus' | 'qinghua' | 'goldring'
let currentPotSeal = '大宋宣和';

const SLICE_COUNT = 44;
let clayRadii = [];
let targetRadii = [];
let clayRotationAngle = 0;
let isFired = false;
let currentClayGlaze = 'tianqing';
let potCamPitch = 0.14;

// 高清 1024×512 柱面 UV 贴图管线
const UV_W = 1024;
const UV_H = 512;

const presetUVCanvas = document.createElement('canvas');
presetUVCanvas.width = UV_W;
presetUVCanvas.height = UV_H;
const presetUVCtx = presetUVCanvas.getContext('2d');

const paintUVCanvas = document.createElement('canvas');
paintUVCanvas.width = UV_W;
paintUVCanvas.height = UV_H;
const paintUVCtx = paintUVCanvas.getContext('2d');

const cobaltTempCanvas = document.createElement('canvas');
cobaltTempCanvas.width = UV_W;
cobaltTempCanvas.height = UV_H;
const cobaltTempCtx = cobaltTempCanvas.getContext('2d');

const albedoCanvas = document.createElement('canvas');
albedoCanvas.width = UV_W;
albedoCanvas.height = UV_H;
const albedoCtx = albedoCanvas.getContext('2d');

let textureDirty = true;
let lastBrushUV = null;
let lastBrushTime = 0;
let lastStampUV = null;

// 历史记录栈（同步保存泥坯曲率与高清画布快照）
const potteryHistory = [];
const MAX_POT_HISTORY = 18;

// Three.js 真 3D 状态
let useWebGL = false;
let potRenderer = null;
let potScene = null;
let potCamera = null;
let potGroup = null;
let potVesselMesh = null;
let potWheelGroup = null;
let potOuterMat = null;
let potInnerMat = null;
let potAlbedoTex = null;
let potBumpTex = null;
let potEnvMap = null;
let potRaycaster = null;
let lastMeshRadii = null;

const POT_BOTTOM_Y = -1.36;
const POT_HEIGHT = 2.76;
const POT_RADIUS_SCALE = 1.24;
const OUTER_SEGMENTS = 88;
const LATHE_RADIAL_SEGMENTS = 80;

// 经典宋明官样器型模板
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

// 秘制釉色物理配色定义
const GLAZE_PROFILES = {
    tianqing: {
        name: '雨过天青釉',
        baseHex: '#73a5af',
        gradTop: '#6497a1',
        gradMid: '#82b4be',
        gradBot: '#53828c',
        innerHex: 0x456b73,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRough: 0.08,
        hasCrackle: true,
        crackleAlpha: 0.28,
        cobaltAlpha: 0.94
    },
    fenqing: {
        name: '龙泉粉青釉',
        baseHex: '#699e88',
        gradTop: '#5b8f7a',
        gradMid: '#77ad97',
        gradBot: '#4c7966',
        innerHex: 0x3f6756,
        roughness: 0.17,
        clearcoat: 1.0,
        clearcoatRough: 0.08,
        hasCrackle: true,
        crackleAlpha: 0.18,
        cobaltAlpha: 0.92
    },
    yuebai: {
        name: '官窑月白釉',
        baseHex: '#c6d6dc',
        gradTop: '#b8c9d0',
        gradMid: '#d6e3e8',
        gradBot: '#9eb2ba',
        innerHex: 0x7c939c,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRough: 0.07,
        hasCrackle: true,
        crackleAlpha: 0.28,
        cobaltAlpha: 0.96
    },
    qinghua_white: {
        name: '景德镇永宣甜白釉',
        baseHex: '#ebede9',
        gradTop: '#e3e6e2',
        gradMid: '#f2f4f0',
        gradBot: '#d3d7d2',
        innerHex: 0xb8bfbe,
        roughness: 0.13,
        clearcoat: 1.0,
        clearcoatRough: 0.05,
        hasCrackle: false,
        crackleAlpha: 0,
        cobaltAlpha: 1.0
    },
    junhong: {
        name: '钧窑玫瑰紫窑变釉',
        baseHex: '#9d436f',
        gradTop: '#763b69',
        gradMid: '#b55686',
        gradBot: '#57203f',
        innerHex: 0x451a34,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRough: 0.07,
        hasCrackle: false,
        crackleAlpha: 0,
        cobaltAlpha: 0.82
    },
    jianhei: {
        name: '建盏乌金兔毫釉',
        baseHex: '#252122',
        gradTop: '#3e332a',
        gradMid: '#241f20',
        gradBot: '#151213',
        innerHex: 0x161213,
        roughness: 0.18,
        clearcoat: 0.96,
        clearcoatRough: 0.09,
        hasCrackle: false,
        crackleAlpha: 0,
        cobaltAlpha: 0.55
    }
};

function ensurePotteryRender() {
    if (!potCanvas || document.hidden) return;
    isPotteryVisible = true;
    if (!potAnimId) potAnimLoop();
}

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
        textureDirty = true;
        updatePotteryMaterial();
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
    const stampPicker = document.getElementById('pot-stamp-picker');
    if (stampPicker) {
        stampPicker.classList.toggle('hidden', style !== 'stamp');
    }
    if (style === 'stamp' && typeof showToast === 'function') {
        showToast('在瓷坯表面轻点或划过，即可按对称角度印下工笔青花纹饰');
    }
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

function setBrushSymmetry(n) {
    brushSymmetry = [1, 4, 6].includes(Number(n)) ? Number(n) : 1;
    document.querySelectorAll('.brush-sym-btn').forEach(btn => {
        if (Number(btn.dataset.sym) === brushSymmetry) {
            btn.classList.add('bg-tianqing-deep', 'text-white');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
    if (typeof showToast === 'function') {
        showToast(brushSymmetry === 1 ? '已切换至【单笔手绘】模式' : `已开启【${brushSymmetry}重旋转对称】环绘，一笔成团花`);
    }
}

function setBrushStamp(kind) {
    brushStamp = kind;
    document.querySelectorAll('.pot-stamp-btn').forEach(btn => {
        if (btn.dataset.stamp === kind) {
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
    else if (potToolMode === 'brush') el.textContent = '转速 24 RPM · 慢速绘青花';
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
        showToast(wheelPaused ? '已定格陶轮，适合精细勾画缠枝花叶与点印' : '陶轮已恢复匀速旋转，适合拉圈绘带');
    }
}

function clearQinghuaPaint() {
    savePotterySnapshot();
    paintUVCtx.clearRect(0, 0, UV_W, UV_H);
    textureDirty = true;
    ensurePotteryRender();
    if (typeof showToast === 'function') {
        showToast('已清空坯体手绘青花料迹');
    }
}

// ================================================================
// 三、1024×512 高清青花与预设纹饰 UV 绘制 + 窑烧质感合成
// ================================================================
function drawBaoxiangLotusCore(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const outerPetals = 8;
    for (let p = 0; p < outerPetals; p++) {
        const a = (p / outerPetals) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        const pGrad = ctx.createRadialGradient(0, -34, 4, 0, -34, 28);
        pGrad.addColorStop(0, 'rgba(42, 86, 168, 0.42)');
        pGrad.addColorStop(0.72, 'rgba(18, 52, 126, 0.85)');
        pGrad.addColorStop(1, 'rgba(12, 32, 86, 0.96)');
        ctx.fillStyle = pGrad;
        ctx.strokeStyle = 'rgba(12, 32, 84, 0.98)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-11, -18);
        ctx.quadraticCurveTo(-18, -46, 0, -58);
        ctx.quadraticCurveTo(18, -46, 11, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 花瓣内弧留白水线
        ctx.strokeStyle = 'rgba(240, 245, 250, 0.42)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6, -24);
        ctx.quadraticCurveTo(0, -44, 6, -24);
        ctx.stroke();
        ctx.restore();
    }

    // 莲房中心
    ctx.fillStyle = 'rgba(26, 62, 134, 0.82)';
    ctx.strokeStyle = 'rgba(17, 40, 94, 0.94)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(242, 246, 250, 0.88)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(20, 36, 76, 0.92)';
    for (let s = 0; s < 5; s++) {
        const sa = (s / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * 5.6, Math.sin(sa) * 5.6, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // 苏麻离青铁锈结晶斑
    ctx.fillStyle = 'rgba(32, 22, 22, 0.72)';
    for (let f = 0; f < 8; f++) {
        const fa = f * 0.78 + 0.25;
        ctx.beginPath();
        ctx.arc(Math.cos(fa) * 37, Math.sin(fa) * 37, 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function renderPresetQinghuaUV(ctx, W, H) {
    const drawBand = (yRatio, lw = 3.2, alpha = 0.88) => {
        ctx.save();
        ctx.strokeStyle = `rgba(21, 52, 118, ${alpha})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(0, yRatio * H);
        ctx.lineTo(W, yRatio * H);
        ctx.stroke();
        ctx.restore();
    };

    // 1. 口沿、肩部与近足双弦分水线
    drawBand(0.036, 3.6, 0.92);
    drawBand(0.056, 2.2, 0.76);
    drawBand(0.195, 3.4, 0.88);
    drawBand(0.215, 2.0, 0.72);
    drawBand(0.765, 2.4, 0.82);
    drawBand(0.785, 3.6, 0.90);
    drawBand(0.955, 3.8, 0.92);

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
        grad.addColorStop(0, 'rgba(42, 84, 165, 0.44)');
        grad.addColorStop(1, 'rgba(22, 56, 128, 0.16)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'rgba(20, 48, 112, 0.88)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx - halfW, topY);
        ctx.bezierCurveTo(cx - halfW * 0.95, topY + (botY - topY) * 0.55, cx - halfW * 0.42, botY - 8, cx, botY);
        ctx.bezierCurveTo(cx + halfW * 0.42, botY - 8, cx + halfW * 0.95, topY + (botY - topY) * 0.55, cx + halfW, topY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(18, 44, 106, 0.78)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, topY + (botY - topY) * 0.44, 8.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(32, 22, 24, 0.80)';
        ctx.beginPath();
        ctx.arc(cx, botY - 6, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 3. 主腹缠枝蔓藤与卷草嫩叶
    ctx.save();
    ctx.strokeStyle = 'rgba(22, 54, 124, 0.86)';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const midY = 0.49 * H;
    const amp = 0.145 * H;
    for (let x = 0; x <= W; x += 6) {
        const y = midY + Math.sin((x / W) * Math.PI * 4) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const drawLeaf = (lx, ly, angle, len) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);
        const lGrad = ctx.createLinearGradient(0, 0, len, 0);
        lGrad.addColorStop(0, 'rgba(22, 52, 120, 0.88)');
        lGrad.addColorStop(0.6, 'rgba(48, 88, 168, 0.62)');
        lGrad.addColorStop(1, 'rgba(22, 50, 118, 0.84)');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.45, -len * 0.34, len, -len * 0.08);
        ctx.quadraticCurveTo(len * 0.55, len * 0.24, 0, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(18, 42, 100, 0.86)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
    };

    const leafSites = 16;
    for (let i = 0; i < leafSites; i++) {
        const x = (i + 0.35) * (W / leafSites);
        const phase = (x / W) * Math.PI * 4;
        const y = midY + Math.sin(phase) * amp;
        const dir = i % 2 === 0 ? -1 : 1;
        drawLeaf(x, y, dir * 0.72 - 0.15, 36);
        drawLeaf(x + 14, y + dir * 4, dir * 1.18, 25);
    }
    ctx.restore();

    // 4. 四朵宣德宝相缠枝莲花
    const flowerCount = 4;
    for (let f = -1; f <= flowerCount; f++) {
        const fx = (f + 0.25) * (W / flowerCount);
        const fy = midY + (f % 2 === 0 ? -0.10 : 0.10) * H;
        drawBaoxiangLotusCore(ctx, fx, fy, 1.04);
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
        fGrad.addColorStop(0, 'rgba(48, 88, 168, 0.26)');
        fGrad.addColorStop(1, 'rgba(20, 50, 118, 0.70)');
        ctx.fillStyle = fGrad;
        ctx.strokeStyle = 'rgba(18, 46, 108, 0.90)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx - halfW, yBot);
        ctx.quadraticCurveTo(cx - halfW * 0.8, yTop + 12, cx, yTop);
        ctx.quadraticCurveTo(cx + halfW * 0.8, yTop + 12, cx + halfW, yBot);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(22, 52, 120, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx - halfW * 0.52, yBot - 4);
        ctx.quadraticCurveTo(cx, yTop + 16, cx + halfW * 0.52, yBot - 4);
        ctx.stroke();
        ctx.restore();
    }
}

function renderPresetPatternUV() {
    presetUVCtx.clearRect(0, 0, UV_W, UV_H);
    if (currentPotPattern === 'qinghua') {
        renderPresetQinghuaUV(presetUVCtx, UV_W, UV_H);
    } else if (currentPotPattern === 'lotus') {
        const count = 12;
        const step = UV_W / count;
        for (let i = -1; i <= count; i++) {
            const cx = (i + 0.5) * step;
            const yTop = 0.28 * UV_H;
            const yBot = 0.84 * UV_H;
            const hw = step * 0.42;
            presetUVCtx.save();
            presetUVCtx.strokeStyle = 'rgba(45, 38, 30, 0.42)';
            presetUVCtx.lineWidth = 5.0;
            presetUVCtx.beginPath();
            presetUVCtx.moveTo(cx - hw, yBot);
            presetUVCtx.quadraticCurveTo(cx, yTop - 18, cx + hw, yBot);
            presetUVCtx.stroke();

            presetUVCtx.strokeStyle = 'rgba(255, 252, 245, 0.62)';
            presetUVCtx.lineWidth = 2.6;
            presetUVCtx.beginPath();
            presetUVCtx.moveTo(cx - hw + 5, yBot);
            presetUVCtx.quadraticCurveTo(cx + 4, yTop - 12, cx + hw - 5, yBot);
            presetUVCtx.stroke();
            presetUVCtx.restore();
        }
    } else if (currentPotPattern === 'goldring') {
        presetUVCtx.save();
        [0.18, 0.34, 0.56, 0.78].forEach(yr => {
            const y = yr * UV_H;
            const g = presetUVCtx.createLinearGradient(0, y - 5, 0, y + 5);
            g.addColorStop(0, 'rgba(175, 132, 48, 0.92)');
            g.addColorStop(0.5, 'rgba(252, 226, 138, 0.98)');
            g.addColorStop(1, 'rgba(165, 120, 42, 0.92)');
            presetUVCtx.strokeStyle = g;
            presetUVCtx.lineWidth = 7.5;
            presetUVCtx.beginPath();
            presetUVCtx.moveTo(0, y);
            presetUVCtx.lineTo(UV_W, y);
            presetUVCtx.stroke();
        });
        presetUVCtx.restore();
    }
    textureDirty = true;
}

/** 合成完整 1024×512 表面颜色贴图（结合生坯/烧成状态、矿物釉底色、微冰裂与釉下青花晕散） */
function rebuildAlbedoTexture() {
    const profile = GLAZE_PROFILES[currentClayGlaze] || GLAZE_PROFILES.tianqing;
    albedoCtx.clearRect(0, 0, UV_W, UV_H);

    // 1. 坯体或高温釉面垂向基色渐变
    const baseGrad = albedoCtx.createLinearGradient(0, 0, 0, UV_H);
    if (!isFired) {
        baseGrad.addColorStop(0.0, '#aba297');
        baseGrad.addColorStop(0.5, '#b6ada2');
        baseGrad.addColorStop(1.0, '#9a9085');
    } else {
        baseGrad.addColorStop(0.0, profile.gradTop);
        baseGrad.addColorStop(0.45, profile.gradMid);
        baseGrad.addColorStop(1.0, profile.gradBot);
    }
    albedoCtx.fillStyle = baseGrad;
    albedoCtx.fillRect(0, 0, UV_W, UV_H);

    // 2. 宋代名窑特有精细冰裂开片（生坯与甜白釉保持洁净）
    if (isFired && profile.hasCrackle) {
        albedoCtx.save();
        albedoCtx.strokeStyle = `rgba(38, 30, 24, ${profile.crackleAlpha})`;
        albedoCtx.lineWidth = 1.3;
        let seed = 13579;
        const rand = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
        const nodes = [];
        const cols = 12;
        const rows = 6;
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                nodes.push({
                    x: ((c + 0.15 + rand() * 0.7) / cols) * UV_W,
                    y: ((r + (r === 0 || r === rows ? 0 : (rand() - 0.5) * 0.5)) / rows) * UV_H
                });
            }
        }
        albedoCtx.beginPath();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const n0 = nodes[r * cols + c];
                const nR = nodes[r * cols + ((c + 1) % cols)];
                const nD = nodes[(r + 1) * cols + c];
                const dxR = nR.x >= n0.x ? nR.x : nR.x + UV_W;
                albedoCtx.moveTo(n0.x, n0.y);
                albedoCtx.lineTo(dxR, nR.y);
                albedoCtx.moveTo(n0.x, n0.y);
                albedoCtx.lineTo(nD.x, nD.y);
            }
        }
        albedoCtx.stroke();
        albedoCtx.restore();
    }

    // 3. 合成青花/雕纹层：cobaltTempCanvas
    cobaltTempCtx.clearRect(0, 0, UV_W, UV_H);
    cobaltTempCtx.drawImage(presetUVCanvas, 0, 0);
    cobaltTempCtx.drawImage(paintUVCanvas, 0, 0);

    // 生坯未烧时氧化钴料呈哑光灰褐色；烧成后呈醇正釉下宝蓝并带微量高温弥散晕边
    if (!isFired && currentPotPattern !== 'goldring') {
        cobaltTempCtx.save();
        cobaltTempCtx.globalCompositeOperation = 'source-atop';
        cobaltTempCtx.fillStyle = 'rgba(72, 66, 60, 0.62)';
        cobaltTempCtx.fillRect(0, 0, UV_W, UV_H);
        cobaltTempCtx.restore();

        albedoCtx.save();
        albedoCtx.globalCompositeOperation = 'source-over';
        albedoCtx.globalAlpha = 0.85;
        albedoCtx.drawImage(cobaltTempCanvas, 0, 0);
        albedoCtx.restore();
    } else if (currentPotPattern === 'goldring') {
        // 鎏金部分直接金属覆盖，用户手绘依然按釉下融合
        albedoCtx.save();
        albedoCtx.globalCompositeOperation = 'multiply';
        albedoCtx.globalAlpha = profile.cobaltAlpha;
        albedoCtx.drawImage(paintUVCanvas, 0, 0);
        albedoCtx.restore();
        albedoCtx.drawImage(presetUVCanvas, 0, 0);
    } else {
        // 先敷极微高温液相晕散光晕，再叠加主青花层
        albedoCtx.save();
        albedoCtx.globalCompositeOperation = 'multiply';
        albedoCtx.globalAlpha = 0.16;
        try {
            albedoCtx.filter = 'blur(2px)';
            albedoCtx.drawImage(cobaltTempCanvas, 0, 0);
            albedoCtx.filter = 'none';
        } catch (_) {}
        albedoCtx.globalAlpha = profile.cobaltAlpha;
        albedoCtx.drawImage(cobaltTempCanvas, 0, 0);
        albedoCtx.restore();
    }

    if (potAlbedoTex) potAlbedoTex.needsUpdate = true;
    textureDirty = false;
}

// ================================================================
// 四、毛笔速度压感引擎 + 4/6重对称环绘 + 工笔青花印章
// ================================================================
function paintSymmetryCopies(u, drawAtPixelFn) {
    const count = Math.max(1, brushSymmetry);
    for (let k = 0; k < count; k++) {
        const uk = (((u + k / count) % 1) + 1) % 1;
        const cx = uk * UV_W;
        [-UV_W, 0, UV_W].forEach(shiftX => {
            const px = cx + shiftX;
            if (px < -120 || px > UV_W + 120) return;
            drawAtPixelFn(px);
        });
    }
}

function stampBrushAtUV(u, v, radiusPx) {
    const cy = v * UV_H;
    paintSymmetryCopies(u, (px) => {
        paintUVCtx.save();
        if (brushStyle === 'erase') {
            paintUVCtx.globalCompositeOperation = 'destination-out';
            const eGrad = paintUVCtx.createRadialGradient(px, cy, 0, px, cy, radiusPx);
            eGrad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
            eGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            paintUVCtx.fillStyle = eGrad;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, radiusPx, 0, Math.PI * 2);
            paintUVCtx.fill();
        } else if (brushStyle === 'wash') {
            // 典雅分水：低透明度柔和水彩，越叠加越有古瓷深浅层次
            const wGrad = paintUVCtx.createRadialGradient(px, cy, radiusPx * 0.1, px, cy, radiusPx);
            wGrad.addColorStop(0, 'rgba(42, 80, 158, 0.12)');
            wGrad.addColorStop(0.65, 'rgba(28, 64, 136, 0.065)');
            wGrad.addColorStop(1, 'rgba(22, 52, 118, 0)');
            paintUVCtx.fillStyle = wGrad;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, radiusPx, 0, Math.PI * 2);
            paintUVCtx.fill();
        } else if (brushStyle === 'iron') {
            // 苏麻离青铁锈斑：天然微米结晶斑点群
            const halo = paintUVCtx.createRadialGradient(px, cy, 0, px, cy, radiusPx * 1.1);
            halo.addColorStop(0, 'rgba(24, 38, 72, 0.34)');
            halo.addColorStop(1, 'rgba(18, 44, 108, 0)');
            paintUVCtx.fillStyle = halo;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, radiusPx * 1.1, 0, Math.PI * 2);
            paintUVCtx.fill();

            for (let m = 0; m < 4; m++) {
                const ang = Math.random() * Math.PI * 2;
                const d = Math.random() * radiusPx * 0.6;
                const sr = (1.1 + Math.random() * 1.8);
                paintUVCtx.fillStyle = m % 2 === 0 ? 'rgba(30, 20, 19, 0.84)' : 'rgba(14, 30, 68, 0.78)';
                paintUVCtx.beginPath();
                paintUVCtx.arc(px + Math.cos(ang) * d, cy + Math.sin(ang) * d, sr, 0, Math.PI * 2);
                paintUVCtx.fill();
            }
        } else {
            // 典雅工笔勾线：双层（外微晕 + 内实芯），避免生硬色块
            const oGrad = paintUVCtx.createRadialGradient(px, cy, radiusPx * 0.25, px, cy, radiusPx);
            oGrad.addColorStop(0, 'rgba(18, 46, 110, 0.90)');
            oGrad.addColorStop(0.72, 'rgba(28, 64, 138, 0.65)');
            oGrad.addColorStop(1, 'rgba(32, 70, 145, 0)');
            paintUVCtx.fillStyle = oGrad;
            paintUVCtx.beginPath();
            paintUVCtx.arc(px, cy, radiusPx, 0, Math.PI * 2);
            paintUVCtx.fill();
        }
        paintUVCtx.restore();
    });
    textureDirty = true;
}

/** 印制工笔青花纹饰印章 */
function stampMotifAtUV(u, v) {
    const sizeScale = brushSize === 'sm' ? 0.62 : (brushSize === 'lg' ? 1.38 : 0.95);
    const cy = v * UV_H;

    paintSymmetryCopies(u, (px) => {
        if (brushStamp === 'plum') {
            // 折枝冰梅花（五瓣圆润梅瓣 + 花蕊 + 细枝）
            paintUVCtx.save();
            paintUVCtx.translate(px, cy);
            paintUVCtx.scale(sizeScale, sizeScale);

            paintUVCtx.strokeStyle = 'rgba(20, 48, 112, 0.88)';
            paintUVCtx.lineWidth = 2.6;
            paintUVCtx.lineCap = 'round';
            paintUVCtx.beginPath();
            paintUVCtx.moveTo(-36, 26);
            paintUVCtx.quadraticCurveTo(-8, 10, 28, -14);
            paintUVCtx.moveTo(6, -1);
            paintUVCtx.quadraticCurveTo(22, 6, 36, 2);
            paintUVCtx.stroke();

            for (let p = 0; p < 5; p++) {
                const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
                const petX = Math.cos(a) * 14;
                const petY = Math.sin(a) * 14;
                const g = paintUVCtx.createRadialGradient(petX, petY, 1, petX, petY, 11);
                g.addColorStop(0, 'rgba(62, 102, 178, 0.25)');
                g.addColorStop(0.75, 'rgba(24, 58, 132, 0.72)');
                g.addColorStop(1, 'rgba(17, 42, 98, 0.92)');
                paintUVCtx.fillStyle = g;
                paintUVCtx.strokeStyle = 'rgba(17, 42, 98, 0.94)';
                paintUVCtx.lineWidth = 1.6;
                paintUVCtx.beginPath();
                paintUVCtx.arc(petX, petY, 9.5, 0, Math.PI * 2);
                paintUVCtx.fill();
                paintUVCtx.stroke();
            }
            paintUVCtx.fillStyle = 'rgba(242, 246, 250, 0.92)';
            paintUVCtx.beginPath();
            paintUVCtx.arc(0, 0, 5.2, 0, Math.PI * 2);
            paintUVCtx.fill();
            paintUVCtx.fillStyle = 'rgba(28, 22, 24, 0.88)';
            paintUVCtx.beginPath();
            paintUVCtx.arc(0, 0, 2.0, 0, Math.PI * 2);
            paintUVCtx.fill();
            paintUVCtx.restore();
        } else if (brushStamp === 'cloud') {
            // 明式青花如意云纹
            paintUVCtx.save();
            paintUVCtx.translate(px, cy);
            paintUVCtx.scale(sizeScale, sizeScale);
            const g = paintUVCtx.createRadialGradient(0, -4, 4, 0, -4, 34);
            g.addColorStop(0, 'rgba(54, 96, 174, 0.48)');
            g.addColorStop(1, 'rgba(20, 50, 118, 0.16)');
            paintUVCtx.fillStyle = g;
            paintUVCtx.strokeStyle = 'rgba(18, 46, 108, 0.92)';
            paintUVCtx.lineWidth = 2.4;
            paintUVCtx.beginPath();
            paintUVCtx.moveTo(-34, 8);
            paintUVCtx.bezierCurveTo(-36, -12, -16, -22, 0, -14);
            paintUVCtx.bezierCurveTo(16, -24, 38, -10, 32, 8);
            paintUVCtx.bezierCurveTo(20, 16, 10, 4, 0, 10);
            paintUVCtx.bezierCurveTo(-12, 16, -24, 16, -34, 8);
            paintUVCtx.closePath();
            paintUVCtx.fill();
            paintUVCtx.stroke();

            // 飘逸云尾
            paintUVCtx.beginPath();
            paintUVCtx.moveTo(0, 10);
            paintUVCtx.bezierCurveTo(10, 22, 24, 24, 38, 18);
            paintUVCtx.stroke();
            paintUVCtx.restore();
        } else if (brushStamp === 'band') {
            // 双弦环带纹（自动跨周回绕，适合瞬间装饰颈肩腰腹）
            paintUVCtx.save();
            paintUVCtx.strokeStyle = 'rgba(20, 50, 116, 0.90)';
            paintUVCtx.lineWidth = 3.2 * sizeScale;
            paintUVCtx.beginPath();
            paintUVCtx.moveTo(px - 44 * sizeScale, cy - 6 * sizeScale);
            paintUVCtx.lineTo(px + 44 * sizeScale, cy - 6 * sizeScale);
            paintUVCtx.stroke();

            paintUVCtx.lineWidth = 1.8 * sizeScale;
            paintUVCtx.beginPath();
            paintUVCtx.moveTo(px - 44 * sizeScale, cy + 5 * sizeScale);
            paintUVCtx.lineTo(px + 44 * sizeScale, cy + 5 * sizeScale);
            paintUVCtx.stroke();
            paintUVCtx.restore();
        } else {
            // 默认：宣德宝相莲花
            drawBaoxiangLotusCore(paintUVCtx, px, cy, sizeScale * 0.72);
        }
    });
    textureDirty = true;
}

function strokeBrushUV(u0, v0, u1, v1, dtMs = 16) {
    let du = u1 - u0;
    if (du > 0.5) du -= 1;
    if (du < -0.5) du += 1;
    const dv = v1 - v0;
    const distPx = Math.hypot(du * UV_W, dv * UV_H);

    // 速度压感：运笔快略收细露锋，慢顿略蓄墨圆润
    const speed = distPx / Math.max(8, dtMs);
    const pressureFactor = Math.max(0.68, Math.min(1.22, 1.18 - speed * 0.14));
    const sizeScale = (brushSize === 'sm' ? 0.56 : (brushSize === 'lg' ? 1.68 : 1.0)) * pressureFactor;
    const baseR = (brushStyle === 'wash' ? 20 : brushStyle === 'erase' ? 18 : brushStyle === 'iron' ? 12 : 6.4) * sizeScale;

    if (brushStyle === 'stamp') {
        const minSpacing = 48 * (brushSize === 'sm' ? 0.65 : (brushSize === 'lg' ? 1.3 : 1.0));
        if (!lastStampUV) {
            stampMotifAtUV(u1, v1);
            lastStampUV = { u: u1, v: v1 };
        } else {
            let sdu = u1 - lastStampUV.u;
            if (sdu > 0.5) sdu -= 1;
            if (sdu < -0.5) sdu += 1;
            const sd = Math.hypot(sdu * UV_W, (v1 - lastStampUV.v) * UV_H);
            if (sd >= minSpacing) {
                stampMotifAtUV(u1, v1);
                lastStampUV = { u: u1, v: v1 };
            }
        }
        return;
    }

    const stepPx = brushStyle === 'iron' ? 7.5 : 3.0;
    const steps = Math.max(1, Math.min(64, Math.ceil(distPx / stepPx)));
    for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const u = (((u0 + du * t) % 1) + 1) % 1;
        const v = Math.max(0.015, Math.min(0.985, v0 + dv * t));
        stampBrushAtUV(u, v, baseR);
    }
}

// ================================================================
// 五、Three.js 真 3D 场景构建、88层平滑几何生成与物理釉面
// ================================================================
function buildPotteryBumpTexture() {
    const bw = 256;
    const bh = 256;
    const c = document.createElement('canvas');
    c.width = bw;
    c.height = bh;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, bw, bh);
    for (let y = 0; y < bh; y++) {
        const v = Math.round(128 + Math.sin(y * 0.42) * 14 + Math.sin(y * 1.1) * 5);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(0, y, bw, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function buildStudioEnvMap(renderer) {
    try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x1e1915);

        const stripMat1 = new THREE.MeshBasicMaterial({ color: 0xfff8ec });
        const strip1 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 11), stripMat1);
        strip1.position.set(-5.2, 2.2, 4.8);
        strip1.lookAt(0, 0, 0);
        envScene.add(strip1);

        const stripMat2 = new THREE.MeshBasicMaterial({ color: 0xcbe6ef });
        const strip2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 10), stripMat2);
        strip2.position.set(5.8, 1.5, 3.2);
        strip2.lookAt(0, 0, 0);
        envScene.add(strip2);

        const domeMat = new THREE.MeshBasicMaterial({ color: 0xffe4be });
        const dome = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), domeMat);
        dome.position.set(0, 7.5, 0);
        dome.rotation.x = Math.PI / 2;
        envScene.add(dome);

        const rt = pmrem.fromScene(envScene, 0.04);
        pmrem.dispose();
        strip1.geometry.dispose();
        stripMat1.dispose();
        strip2.geometry.dispose();
        stripMat2.dispose();
        dome.geometry.dispose();
        domeMat.dispose();
        return rt.texture;
    } catch (_) {
        return null;
    }
}

function createWoodWheelGroup() {
    const group = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x2a1f18,
        roughness: 0.45,
        metalness: 0.08
    });
    const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.48, 0.14, 64), baseMat);
    baseCyl.position.y = POT_BOTTOM_Y - 0.07;
    group.add(baseCyl);

    const subShadow = new THREE.Mesh(
        new THREE.CylinderGeometry(1.50, 1.50, 0.03, 64),
        new THREE.MeshBasicMaterial({ color: 0x090706 })
    );
    subShadow.position.y = POT_BOTTOM_Y - 0.155;
    group.add(subShadow);

    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd9b56e,
        roughness: 0.35,
        metalness: 0.72
    });
    [0.58, 0.98, 1.32].forEach(r => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 64), goldMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = POT_BOTTOM_Y + 0.002;
        group.add(ring);
    });
    return group;
}

/** 根据当前 44 层半径生成 Catmull-Rom 88层平滑实心壁厚 LatheGeometry，并拆分成[外壁]与[口沿内膛]双材质组 */
function buildSmoothPotteryGeometry(radii) {
    const curvePts = [];
    for (let i = 0; i < SLICE_COUNT; i++) {
        const t = i / (SLICE_COUNT - 1);
        const r = Math.max(0.12, radii[i] || 0.45) * POT_RADIUS_SCALE;
        const y = POT_BOTTOM_Y + t * POT_HEIGHT;
        curvePts.push(new THREE.Vector3(r, y, 0));
    }
    const outerCurve = new THREE.CatmullRomCurve3(curvePts, false, 'catmullrom', 0.5);

    const profile = [];
    const outerStartIdx = 1; // 索引 0 为足底中心 (0, POT_BOTTOM_Y)
    profile.push(new THREE.Vector2(0, POT_BOTTOM_Y));

    // 外壁：OUTER_SEGMENTS + 1 个点
    for (let s = 0; s <= OUTER_SEGMENTS; s++) {
        const t = s / OUTER_SEGMENTS;
        const p = outerCurve.getPoint(t);
        profile.push(new THREE.Vector2(Math.max(0.10, p.x), p.y));
    }
    const outerEndIdx = outerStartIdx + OUTER_SEGMENTS;

    // 圆润口沿收口 + 内部膛壁向下收底
    const mouthR = profile[outerEndIdx].x;
    const mouthY = profile[outerEndIdx].y;
    const rimThick = Math.min(0.085, Math.max(0.048, mouthR * 0.14));
    profile.push(new THREE.Vector2(Math.max(0.06, mouthR - rimThick * 0.35), mouthY + 0.022));
    profile.push(new THREE.Vector2(Math.max(0.05, mouthR - rimThick * 0.85), mouthY + 0.012));

    const innerSamples = 18;
    for (let k = 1; k <= innerSamples; k++) {
        const u = k / innerSamples;
        const tOuter = 1 - u * 0.90;
        const pOut = outerCurve.getPoint(tOuter);
        const rIn = Math.max(0.03, pOut.x - rimThick);
        profile.push(new THREE.Vector2(rIn, pOut.y));
    }
    profile.push(new THREE.Vector2(0, POT_BOTTOM_Y + POT_HEIGHT * 0.10));

    const geo = new THREE.LatheGeometry(profile, LATHE_RADIAL_SEGMENTS);
    geo.computeVertexNormals();

    // 重新校准 UV 并拆分为 Group 0（外壁）与 Group 1（内膛/足底）
    const pCount = profile.length;
    const uvAttr = geo.attributes.uv;
    for (let seg = 0; seg <= LATHE_RADIAL_SEGMENTS; seg++) {
        const uCoord = seg / LATHE_RADIAL_SEGMENTS;
        for (let j = 0; j < pCount; j++) {
            const vIdx = seg * pCount + j;
            if (j >= outerStartIdx && j <= outerEndIdx) {
                const vOuter = (j - outerStartIdx) / OUTER_SEGMENTS;
                // 添加微小上下安全内缩避免接缝溢出，v=0 底，v=1 顶
                uvAttr.setXY(vIdx, uCoord, 0.015 + vOuter * 0.97);
            } else {
                uvAttr.setXY(vIdx, uCoord, 0.01);
            }
        }
    }
    uvAttr.needsUpdate = true;

    const oldIndex = geo.getIndex().array;
    const outerTris = [];
    const innerTris = [];
    const stride = pCount;
    for (let t = 0; t < oldIndex.length; t += 3) {
        const a = oldIndex[t];
        const b = oldIndex[t + 1];
        const c = oldIndex[t + 2];
        const ja = a % stride;
        const jb = b % stride;
        const jc = c % stride;
        if (ja >= outerStartIdx && ja <= outerEndIdx && jb >= outerStartIdx && jb <= outerEndIdx && jc >= outerStartIdx && jc <= outerEndIdx) {
            outerTris.push(a, b, c);
        } else {
            innerTris.push(a, b, c);
        }
    }
    const newIndex = new Uint32Array(outerTris.length + innerTris.length);
    newIndex.set(outerTris, 0);
    newIndex.set(innerTris, outerTris.length);
    geo.setIndex(new THREE.BufferAttribute(newIndex, 1));
    geo.clearGroups();
    geo.addGroup(0, outerTris.length, 0);
    geo.addGroup(outerTris.length, innerTris.length, 1);

    return geo;
}

function updatePotteryGeometryNow(force = false) {
    if (!useWebGL || !potVesselMesh) return;
    if (!force && lastMeshRadii) {
        let diff = 0;
        for (let i = 0; i < SLICE_COUNT; i++) {
            diff = Math.max(diff, Math.abs((clayRadii[i] || 0) - lastMeshRadii[i]));
        }
        if (diff < 0.00045) return;
    }
    lastMeshRadii = [...clayRadii];
    const nextGeo = buildSmoothPotteryGeometry(clayRadii);
    const oldGeo = potVesselMesh.geometry;
    potVesselMesh.geometry = nextGeo;
    if (oldGeo) oldGeo.dispose();
}

function updatePotteryMaterial() {
    textureDirty = true;
    if (!useWebGL || !potOuterMat || !potInnerMat) return;
    const profile = GLAZE_PROFILES[currentClayGlaze] || GLAZE_PROFILES.tianqing;

    if (!isFired) {
        potOuterMat.roughness = 0.86;
        potOuterMat.clearcoat = 0.0;
        potOuterMat.clearcoatRoughness = 0.65;
        potOuterMat.reflectivity = 0.25;
        potOuterMat.envMapIntensity = 0.24;
        potOuterMat.bumpScale = 0.012;

        potInnerMat.color.setHex(0x6e665c);
        potInnerMat.roughness = 0.90;
        potInnerMat.clearcoat = 0.0;
        potInnerMat.envMapIntensity = 0.16;
    } else {
        potOuterMat.roughness = profile.roughness;
        potOuterMat.clearcoat = profile.clearcoat;
        potOuterMat.clearcoatRoughness = profile.clearcoatRough;
        potOuterMat.reflectivity = 0.92;
        potOuterMat.envMapIntensity = 0.82;
        potOuterMat.bumpScale = currentClayGlaze === 'qinghua_white' ? 0.0018 : 0.0045;

        potInnerMat.color.setHex(profile.innerHex);
        potInnerMat.roughness = Math.min(0.24, profile.roughness + 0.04);
        potInnerMat.clearcoat = profile.clearcoat;
        potInnerMat.clearcoatRoughness = profile.clearcoatRough + 0.03;
        potInnerMat.envMapIntensity = 0.56;
    }
    potOuterMat.needsUpdate = true;
    potInnerMat.needsUpdate = true;
}

function initThreePottery() {
    if (typeof THREE === 'undefined' || !potCanvas) return false;
    try {
        potRenderer = new THREE.WebGLRenderer({
            canvas: potCanvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        potRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        potRenderer.setSize(potCanvas.width, potCanvas.height, false);
        potRenderer.outputEncoding = THREE.sRGBEncoding;
        potRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        potRenderer.toneMappingExposure = 0.94;

        potScene = new THREE.Scene();
        potCamera = new THREE.PerspectiveCamera(35, potCanvas.width / potCanvas.height, 0.1, 30);
        potCamera.position.set(0, 0.72, 6.25);
        potCamera.lookAt(0, -0.05, 0);

        potEnvMap = buildStudioEnvMap(potRenderer);

        // 博物馆棚拍三点光源（侧主光拉出明暗层次，不发白过曝）
        const hemiLight = new THREE.HemisphereLight(0xfffaf0, 0x2a221c, 0.44);
        potScene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xfff4e0, 0.95);
        keyLight.position.set(-4.0, 3.6, 4.0);
        potScene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xbcdce6, 0.62);
        rimLight.position.set(4.4, 1.5, -2.6);
        potScene.add(rimLight);

        const fillLight = new THREE.DirectionalLight(0xeef5f8, 0.24);
        fillLight.position.set(1.8, -0.5, 4.0);
        potScene.add(fillLight);

        potGroup = new THREE.Group();
        potScene.add(potGroup);

        potWheelGroup = createWoodWheelGroup();
        potGroup.add(potWheelGroup);

        potAlbedoTex = new THREE.CanvasTexture(albedoCanvas);
        potAlbedoTex.encoding = THREE.sRGBEncoding;
        potAlbedoTex.wrapS = THREE.RepeatWrapping;
        potAlbedoTex.wrapT = THREE.ClampToEdgeWrapping;
        potAlbedoTex.anisotropy = Math.min(8, potRenderer.capabilities.getMaxAnisotropy());

        potBumpTex = buildPotteryBumpTexture();

        potOuterMat = new THREE.MeshPhysicalMaterial({
            map: potAlbedoTex,
            bumpMap: potBumpTex,
            bumpScale: 0.012,
            envMap: potEnvMap,
            roughness: 0.86,
            metalness: 0.02,
            clearcoat: 0.0,
            clearcoatRoughness: 0.6,
            reflectivity: 0.25
        });

        potInnerMat = new THREE.MeshPhysicalMaterial({
            color: 0x6e665c,
            envMap: potEnvMap,
            roughness: 0.90,
            metalness: 0.02,
            clearcoat: 0.0,
            clearcoatRoughness: 0.6,
            side: THREE.DoubleSide
        });

        const initGeo = buildSmoothPotteryGeometry(clayRadii);
        potVesselMesh = new THREE.Mesh(initGeo, [potOuterMat, potInnerMat]);
        potGroup.add(potVesselMesh);

        potRaycaster = new THREE.Raycaster();
        updatePotteryMaterial();
        return true;
    } catch (_) {
        potRenderer = null;
        return false;
    }
}

// ================================================================
// 六、初始化、器型预设、釉色、底款印章、窑烧动画与指针射线交互
// ================================================================
let isPotteryVisible = true;
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

function syncSealBadgeDOM() {
    const sealEl = document.getElementById('pottery-seal-badge');
    if (sealEl) {
        sealEl.innerHTML = `<span>${currentPotSeal.slice(0, 2)}</span><span>${currentPotSeal.slice(2, 4)}</span>`;
    }
}

function initPotteryWorkshop() {
    potCanvas = document.getElementById('pottery-canvas');
    if (!potCanvas || potCanvas.dataset.potInit === '1') return;
    potCanvas.dataset.potInit = '1';

    const kilnOverlay = document.getElementById('kiln-fire-overlay');
    if (kilnOverlay) kilnOverlay.classList.add('hidden');

    resetClay(true);
    useWebGL = initThreePottery();
    if (!useWebGL) {
        potCtx = potCanvas.getContext('2d');
    }

    syncSealBadgeDOM();
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
    textureDirty = true;
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        const t = i / (SLICE_COUNT - 1);
        const r = 0.45 + (1 - t) * 0.04;
        clayRadii.push(r);
        targetRadii.push(r);
    }
    updateFiringBadge('高岭土湿坯 · 旋转塑形中');
    updatePotteryMaterial();
    updatePotteryGeometryNow(true);
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
            <span class="text-amber-600 font-semibold">宋韵器型分 ${score}</span>
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
    updatePotteryMaterial();
    updatePotteryLiveMetrics();
    ensurePotteryRender();
    playPorcelainChime(1720);
    if (typeof showToast === 'function') {
        showToast(`已辅助拉出【${names[presetName]}】黄金比例胎骨曲线`);
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
    textureDirty = true;
    ensurePotteryRender();
    playPorcelainChime(2150);
    const pNames = {
        none: '素面玉肌 (极简无纹)',
        lotus: '定窑浮雕划花莲瓣纹',
        qinghua: '宣德苏麻离青缠枝宝相花',
        goldring: '南宋官窑凸弦鎏金瑞纹'
    };
    if (typeof showToast === 'function') {
        showToast(`已施以器身纹饰：【${pNames[patternKey] || patternKey}】`);
    }
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
    textureDirty = true;
    updatePotteryMaterial();
    playCrackleSound();
    ensurePotteryRender();
    const prof = GLAZE_PROFILES[glazeKey];
    if (typeof showToast === 'function') {
        showToast(`已选配秘制矿物釉：【${prof ? prof.name : glazeKey}】`);
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
    syncSealBadgeDOM();
    playPorcelainChime(2480);
    ensurePotteryRender();
    if (typeof showToast === 'function') {
        showToast(`已镌刻专属器底篆刻落款：【${sealText}制】`);
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
                updatePotteryMaterial();
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
                if (typeof showToast === 'function') {
                    showToast('开窑大吉！胎骨致密如金石、釉泛温润玉光，可导出专属造物典藏证书');
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

function getPointerNDC(clientX, clientY) {
    const rect = potCanvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / (rect.width || potCanvas.width)) * 2 - 1;
    const y = -(((clientY - rect.top) / (rect.height || potCanvas.height)) * 2 - 1);
    return { x, y, rect };
}

function bindPotteryEvents() {
    if (!potCanvas) return;

    const getClientCoords = (e) => {
        const cx = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        const cy = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        return cx === null || cy === null ? null : { x: cx, y: cy };
    };

    const handlePointerAction = (e, isDown = false) => {
        const pt = getClientCoords(e);
        if (!pt) return;

        // 空白处视角微调俯仰
        if (isOrbitDragging) {
            const dy = pt.y - orbitStart.y;
            potCamPitch = Math.max(-0.22, Math.min(0.45, orbitStart.pitch + dy * 0.004));
            ensurePotteryRender();
            return;
        }

        if (!isInteractingPot) return;
        isPotteryVisible = true;
        if (isFired && potToolMode !== 'brush') {
            isFired = false;
            updateFiringBadge('高岭土湿坯 · 随指塑形中');
            updatePotteryMaterial();
        } else if (isFired && potToolMode === 'brush') {
            isFired = false;
            updateFiringBadge('补釉重绘中 · 需再入窑固化');
            updatePotteryMaterial();
        }

        const now = performance.now();
        const dtMs = lastBrushTime ? Math.max(8, now - lastBrushTime) : 16;
        lastBrushTime = now;

        if (useWebGL && potRaycaster && potCamera && potVesselMesh) {
            const { x: ndcX, y: ndcY } = getPointerNDC(pt.x, pt.y);
            potRaycaster.setFromCamera({ x: ndcX, y: ndcY }, potCamera);

            if (potToolMode === 'brush') {
                const hits = potRaycaster.intersectObject(potVesselMesh, false);
                if (hits.length > 0 && hits[0].face && hits[0].face.materialIndex === 0 && hits[0].uv) {
                    const u = ((hits[0].uv.x % 1) + 1) % 1;
                    // Canvas y=0 是顶部（对应 uv.y = 1），反缩放回 [0..1]
                    const vRaw = 1 - hits[0].uv.y;
                    const v = Math.max(0.015, Math.min(0.985, vRaw));
                    if (isDown || !lastBrushUV) {
                        strokeBrushUV(u, v, u, v, dtMs);
                    } else {
                        strokeBrushUV(lastBrushUV.u, lastBrushUV.v, u, v, dtMs);
                    }
                    lastBrushUV = { u, v };
                } else {
                    lastBrushUV = null;
                }
                ensurePotteryRender();
                return;
            }

            // 塑形模式：射线求交垂直平面 y = 器身高度
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            const hitPt = new THREE.Vector3();
            if (potRaycaster.ray.intersectPlane(plane, hitPt)) {
                const normY = (hitPt.y - POT_BOTTOM_Y) / POT_HEIGHT;
                const sliceIndex = Math.floor(normY * SLICE_COUNT);
                if (sliceIndex >= 0 && sliceIndex < SLICE_COUNT) {
                    const distRatio = Math.max(0.14, Math.min(0.96, Math.abs(hitPt.x) / POT_RADIUS_SCALE));
                    const influenceRange = 5;
                    for (let offset = -influenceRange; offset <= influenceRange; offset++) {
                        const idx = sliceIndex + offset;
                        if (idx >= 0 && idx < SLICE_COUNT) {
                            const weight = Math.cos((offset / (influenceRange + 0.5)) * (Math.PI / 2));
                            if (potToolMode === 'push') {
                                targetRadii[idx] = Math.max(0.15, targetRadii[idx] - 0.042 * weight);
                            } else if (potToolMode === 'pull') {
                                targetRadii[idx] = Math.min(0.96, targetRadii[idx] + 0.042 * weight);
                            } else {
                                targetRadii[idx] += (distRatio - targetRadii[idx]) * 0.34 * weight;
                                targetRadii[idx] = Math.max(0.15, Math.min(0.96, targetRadii[idx]));
                            }
                        }
                    }
                    updatePotteryLiveMetrics();
                }
            }
            ensurePotteryRender();
            return;
        }

        // 2D 兼容兜底
        const rect = potCanvas.getBoundingClientRect();
        const scaleX = potCanvas.width / (rect.width || potCanvas.width);
        const scaleY = potCanvas.height / (rect.height || potCanvas.height);
        const canvasX = (pt.x - rect.left) * scaleX;
        const canvasY = (pt.y - rect.top) * scaleY;
        const bottomY = potCanvas.height * 0.85;
        const totalHeight = potCanvas.height * 0.67;
        const topY = bottomY - totalHeight;
        const normalizedY = (bottomY - canvasY) / totalHeight;
        const sliceIndex = Math.floor(normalizedY * SLICE_COUNT);
        if (sliceIndex >= 0 && sliceIndex < SLICE_COUNT) {
            const centerX = potCanvas.width / 2;
            const maxRadiusPx = potCanvas.width * 0.34;
            const distRatio = Math.max(0.12, Math.min(0.96, Math.abs(canvasX - centerX) / maxRadiusPx));
            if (potToolMode === 'brush') {
                const sliceRx = Math.max(10, (clayRadii[sliceIndex] || 0.45) * maxRadiusPx);
                const nx = Math.max(-0.96, Math.min(0.96, (canvasX - centerX) / sliceRx));
                const theta = clayRotationAngle + Math.asin(nx);
                const u = (((theta / (Math.PI * 2)) % 1) + 1) % 1;
                const v = Math.max(0.015, Math.min(0.985, (canvasY - topY) / totalHeight));
                strokeBrushUV(lastBrushUV ? lastBrushUV.u : u, lastBrushUV ? lastBrushUV.v : v, u, v, dtMs);
                lastBrushUV = { u, v };
            } else {
                const influenceRange = 5;
                for (let offset = -influenceRange; offset <= influenceRange; offset++) {
                    const idx = sliceIndex + offset;
                    if (idx >= 0 && idx < SLICE_COUNT) {
                        const weight = Math.cos((offset / (influenceRange + 0.5)) * (Math.PI / 2));
                        if (potToolMode === 'push') targetRadii[idx] = Math.max(0.15, targetRadii[idx] - 0.042 * weight);
                        else if (potToolMode === 'pull') targetRadii[idx] = Math.min(0.96, targetRadii[idx] + 0.042 * weight);
                        else targetRadii[idx] = Math.max(0.15, Math.min(0.96, targetRadii[idx] + (distRatio - targetRadii[idx]) * 0.34 * weight));
                    }
                }
                updatePotteryLiveMetrics();
            }
        }
        ensurePotteryRender();
    };

    const startInteraction = (e) => {
        const pt = getClientCoords(e);
        if (!pt) return;
        initAudioContext();
        lastBrushUV = null;
        lastStampUV = null;
        lastBrushTime = performance.now();

        if (useWebGL && potRaycaster && potCamera && potVesselMesh && potToolMode === 'brush') {
            const { x: ndcX, y: ndcY } = getPointerNDC(pt.x, pt.y);
            potRaycaster.setFromCamera({ x: ndcX, y: ndcY }, potCamera);
            const hits = potRaycaster.intersectObject(potVesselMesh, false);
            if (!hits.length) {
                isOrbitDragging = true;
                orbitStart = { x: pt.x, y: pt.y, pitch: potCamPitch };
                return;
            }
        }
        savePotterySnapshot();
        isInteractingPot = true;
        handlePointerAction(e, true);
    };

    potCanvas.addEventListener('mousedown', startInteraction);
    window.addEventListener('mousemove', (e) => {
        if (isInteractingPot || isOrbitDragging) handlePointerAction(e, false);
    });
    window.addEventListener('mouseup', () => {
        isInteractingPot = false;
        isOrbitDragging = false;
        lastBrushUV = null;
        lastStampUV = null;
    });

    potCanvas.addEventListener('touchstart', (e) => {
        startInteraction(e);
        if (e.cancelable) e.preventDefault();
    }, { passive: false });
    potCanvas.addEventListener('touchmove', (e) => {
        if (isInteractingPot || isOrbitDragging) handlePointerAction(e, false);
        if (e.cancelable) e.preventDefault();
    }, { passive: false });
    potCanvas.addEventListener('touchend', () => {
        isInteractingPot = false;
        isOrbitDragging = false;
        lastBrushUV = null;
        lastStampUV = null;
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
    if (potCanvas) {
        potCanvas.style.cursor = mode === 'brush' ? 'crosshair' : 'ew-resize';
    }
    updateWheelSpeedLabel();
    ensurePotteryRender();
    const toasts = {
        push: '已切换至【向内收束】：在瓷坯表面拖拽使器身向内收拢',
        pull: '已切换至【向外鼓腹】：在瓷坯表面拖拽使器腹向外丰满饱满',
        smooth: '已切换至【跟随修光】：指尖揉搓泥胚，器型实时顺滑贴合',
        brush: '已切换至【手绘青花】：直接在 3D 器表精准勾画、分水或点印青花'
    };
    if (typeof showToast === 'function') {
        showToast(toasts[mode] || '已切换造物工具');
    }
}

// ================================================================
// 七、主渲染循环（真 3D Three.js + 平滑 2D Fallback）
// ================================================================
function potAnimLoop() {
    if (!isPotteryVisible || document.hidden) {
        potAnimId = null;
        return;
    }
    potAnimId = requestAnimationFrame(potAnimLoop);
    if (!potCanvas) return;

    for (let i = 0; i < SLICE_COUNT; i++) {
        clayRadii[i] += (targetRadii[i] - clayRadii[i]) * 0.16;
    }
    if (!wheelPaused) {
        const spinSpeed = potToolMode === 'brush' ? (isInteractingPot ? 0.0025 : 0.011) : 0.042;
        clayRotationAngle += spinSpeed;
    }

    if (textureDirty) {
        rebuildAlbedoTexture();
    }

    if (useWebGL && potRenderer && potScene && potCamera && potGroup) {
        updatePotteryGeometryNow(false);
        potGroup.rotation.y = -clayRotationAngle;

        const camDist = 6.25;
        potCamera.position.y = Math.sin(potCamPitch) * camDist * 0.72 + 0.15;
        potCamera.position.z = Math.cos(potCamPitch) * camDist;
        potCamera.lookAt(0, -0.05, 0);

        potRenderer.render(potScene, potCamera);
        return;
    }

    // 降级：2D 平滑预览渲染（仅无 WebGL 环境）
    if (!potCtx) return;
    const w = potCanvas.width;
    const h = potCanvas.height;
    potCtx.clearRect(0, 0, w, h);
    const centerX = w / 2;
    const bottomY = h * 0.85;
    const totalHeight = h * 0.67;
    const stepH = totalHeight / (SLICE_COUNT - 1);
    const maxRadiusPx = w * 0.34;
    const prof = GLAZE_PROFILES[currentClayGlaze] || GLAZE_PROFILES.tianqing;

    const grad = potCtx.createLinearGradient(centerX - maxRadiusPx, 0, centerX + maxRadiusPx, 0);
    grad.addColorStop(0, isFired ? prof.gradBot : '#443e38');
    grad.addColorStop(0.45, isFired ? prof.gradMid : '#b5aca2');
    grad.addColorStop(1, isFired ? prof.gradBot : '#36312c');

    potCtx.beginPath();
    for (let i = 0; i < SLICE_COUNT; i++) {
        const y = bottomY - i * stepH;
        const x = centerX - clayRadii[i] * maxRadiusPx;
        if (i === 0) potCtx.moveTo(x, y); else potCtx.lineTo(x, y);
    }
    for (let i = SLICE_COUNT - 1; i >= 0; i--) {
        const y = bottomY - i * stepH;
        const x = centerX + clayRadii[i] * maxRadiusPx;
        potCtx.lineTo(x, y);
    }
    potCtx.closePath();
    potCtx.fillStyle = grad;
    potCtx.fill();
}

/**
 * 导出带编号、器型参数与底款印章的《专属造物典藏证书》高清海报
 */
function downloadPotteryArtwork() {
    if (!potCanvas) return;
    const metrics = updatePotteryLiveMetrics() || { heightCm: '24.2', mouthCm: '6.8', bellyCm: '15.6', volMl: 860, score: 96 };
    const prof = GLAZE_PROFILES[currentClayGlaze] || GLAZE_PROFILES.tianqing;
    const pNames = { none: '素面玉肌', lotus: '定窑半刀泥浮雕莲瓣', qinghua: '宣德苏麻离青缠枝莲', goldring: '南宋官窑凸弦鎏金纹' };

    if (useWebGL && potRenderer && potScene && potCamera) {
        potRenderer.render(potScene, potCamera);
    }

    const poster = document.createElement('canvas');
    poster.width = 880;
    poster.height = 1060;
    const ctx = poster.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1060);
    bgGrad.addColorStop(0, '#0B1015');
    bgGrad.addColorStop(1, '#141E28');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 880, 1060);

    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 832, 1012);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, 816, 996);

    ctx.fillStyle = '#E5C888';
    ctx.font = 'bold 28px "Noto Serif SC", "Songti SC", serif';
    ctx.fillText('华夏器道 · 天青泥火 — 陶然天成造物典藏证书', 56, 86);
    ctx.fillStyle = '#8BC2CE';
    ctx.font = '14px monospace';
    ctx.fillText(`STUDIO ARCHIVE ID: #TC-${Date.now().toString().slice(-6)}   |   1300℃ DRAGON KILN CERTIFIED`, 56, 114);

    ctx.fillStyle = '#18130F';
    ctx.fillRect(160, 140, 560, 450);
    ctx.drawImage(potCanvas, 160, 140, 560, 450);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.strokeRect(160, 140, 560, 450);

    ctx.fillStyle = '#EEF4F7';
    ctx.font = 'bold 24px "Noto Serif SC", serif';
    ctx.fillText(`造物雅名：【${currentPotSeal} · ${prof.name}雅器】`, 56, 645);

    ctx.fillStyle = '#B0C0CC';
    ctx.font = '16px "Noto Serif SC", sans-serif';
    ctx.fillText(`• 秘制矿物釉相：${prof.name} (${isFired ? '1300℃ 松柴还原焰已玉成' : '陈腐高岭土生坯'})`, 64, 690);
    ctx.fillText(`• 器身装饰工艺：${pNames[currentPotPattern] || '素面玉肌'}`, 64, 724);
    ctx.fillText(`• 实测三维规制：通高 ${metrics.heightCm} cm · 口径 ${metrics.mouthCm} cm · 腹径 ${metrics.bellyCm} cm · 容积 ${metrics.volMl} mL`, 64, 758);
    ctx.fillText(`• 宋韵美学评级：${metrics.score} 分 (黄金曲率与重心稳定度优等)`, 64, 792);
    ctx.fillText(`• 器底篆刻落款：「${currentPotSeal}」御制方印`, 64, 826);

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
    link.download = `华夏器道_造物典藏证书_${currentPotSeal}_${Date.now()}.png`;
    link.href = poster.toDataURL('image/png');
    link.click();
    if (typeof showToast === 'function') {
        showToast('已为您生成并导出《专属造物典藏证书》高清海报');
    }
}

/** 恢复拉坯默认平视视角 */
function resetPotCamera() {
    potCamPitch = 0.14;
    clayRotationAngle = 0;
    ensurePotteryRender();
    if (typeof showToast === 'function') {
        showToast('已恢复工坊默认平视鉴赏视角');
    }
}

/** 暂存当前拉坯器型、手绘青花图层与釉色配置至本机浏览器 */
function savePotteryDraft() {
    try {
        const draft = {
            radii: [...targetRadii],
            paintUrl: paintUVCanvas.toDataURL('image/png'),
            pattern: currentPotPattern,
            glaze: currentClayGlaze,
            seal: currentPotSeal,
            fired: isFired
        };
        localStorage.setItem('tq_pottery_draft_v1', JSON.stringify(draft));
        if (typeof showToast === 'function') {
            showToast('已将当前器型与青花绘稿暂存至本机');
        }
    } catch (_) {
        if (typeof showToast === 'function') showToast('暂存草稿失败');
    }
}

/** 从本机恢复上次暂存的拉坯青花草稿 */
function loadPotteryDraft() {
    try {
        const raw = localStorage.getItem('tq_pottery_draft_v1');
        if (!raw) {
            if (typeof showToast === 'function') showToast('本机暂无已保存的作品草稿');
            return;
        }
        const draft = JSON.parse(raw);
        savePotterySnapshot();
        if (Array.isArray(draft.radii) && draft.radii.length === SLICE_COUNT) {
            targetRadii = [...draft.radii];
            clayRadii = [...draft.radii];
        }
        currentPotPattern = draft.pattern || 'none';
        currentClayGlaze = draft.glaze || 'tianqing';
        currentPotSeal = draft.seal || '大宋宣和';
        isFired = !!draft.fired;

        renderPresetPatternUV();
        syncSealBadgeDOM();
        updatePotteryMaterial();
        updatePotteryGeometryNow(true);
        updatePotteryLiveMetrics();
        updateFiringBadge(isFired ? '1300℃ 柴窑涅槃 · 官瓷玉成' : '高岭土湿坯 · 已读入草稿');

        if (draft.paintUrl) {
            const img = new Image();
            img.onload = () => {
                paintUVCtx.clearRect(0, 0, UV_W, UV_H);
                paintUVCtx.drawImage(img, 0, 0, UV_W, UV_H);
                textureDirty = true;
                ensurePotteryRender();
            };
            img.src = draft.paintUrl;
        } else {
            paintUVCtx.clearRect(0, 0, UV_W, UV_H);
            textureDirty = true;
            ensurePotteryRender();
        }
        if (typeof showToast === 'function') {
            showToast('已恢复上次暂存的造物草稿');
        }
    } catch (_) {
        if (typeof showToast === 'function') showToast('读取草稿失败');
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
window.setBrushSymmetry = setBrushSymmetry;
window.setBrushStamp = setBrushStamp;
window.toggleWheelPause = toggleWheelPause;
window.clearQinghuaPaint = clearQinghuaPaint;
window.resetPotCamera = resetPotCamera;
window.savePotteryDraft = savePotteryDraft;
window.loadPotteryDraft = loadPotteryDraft;

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
