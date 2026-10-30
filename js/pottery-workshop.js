/**
 * 华夏器道 · 天青泥火 — 3D光影指尖拉坯、自由青花手绘、底款篆刻与1300℃龙窑温控曲线仿真引擎
 * 核心升级：
 * 1. 48层高密度曲面切片 + Blinn-Phong 3D法线高光 + 实时计算器高(cm)、口径(cm)、腹径(cm)、容积(mL)与宋韵美学评分
 * 2. 五大造物交互手法：向内收束 / 向外鼓腹 / 竹刀修光 / 深刻弦纹 / 【青花自由手绘笔刷 (指尖直接在旋转坯体上绘青花环带)】
 * 3. 皇家底款印章定制：支持“大宋宣和”、“修内司窑”、“河大文博”、“仝瓷雅制”四方篆刻落款
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
let brushStyle = 'outline'; // 'outline' | 'wash' | 'erase'
let currentPotPattern = 'none'; // 'none' | 'lotus' | 'qinghua' | 'goldring'
let currentPotSeal = '大宋宣和';

const potteryHistory = [];
const MAX_POT_HISTORY = 30;

function savePotterySnapshot() {
    if (!targetRadii || !targetRadii.length) return;
    potteryHistory.push({
        radii: [...targetRadii],
        brush: [...(customBrushRings || [])],
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
        customBrushRings = [...prev.brush];
        currentPotPattern = prev.pattern || 'none';
        currentClayGlaze = prev.glaze || 'tianqing';
        isFired = !!prev.fired;
        updatePotteryLiveMetrics();
        if (typeof showToast === 'function') showToast('↶ 已撤销上一步塑形操作');
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

const SLICE_COUNT = 44;
let clayRadii = [];
let targetRadii = [];
let customBrushRings = []; // 记录用户在每个切片高度手绘的青花/鎏金浓度 [0~1]
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
function setupPotteryVisibilityObserver() {
    if (!potCanvas || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
        const wasVisible = isPotteryVisible;
        isPotteryVisible = entries[0].isIntersecting;
        if (!wasVisible && isPotteryVisible) {
            if (potAnimId) cancelAnimationFrame(potAnimId);
            potAnimLoop();
        }
    }, { threshold: 0.05 });
    observer.observe(potCanvas);
}

function initPotteryWorkshop() {
    potCanvas = document.getElementById('pottery-canvas');
    if (!potCanvas) return;
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
    customBrushRings = new Array(SLICE_COUNT).fill(0);
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        const t = i / (SLICE_COUNT - 1);
        const r = 0.45 + (1 - t) * 0.04;
        clayRadii.push(r);
        targetRadii.push(r);
    }
    updateFiringBadge('高岭土湿坯 · 旋转塑形中');
    updatePotteryLiveMetrics();
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
    const gNames = { tianqing: '雨过天青釉', fenqing: '龙泉粉青釉', yuebai: '官窑月白釉', junhong: '钧窑玫瑰紫窑变釉', jianhei: '建盏乌金兔毫釉' };
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
                updateFiringBadge('🔥 1300℃ 柴窑涅槃 · 官瓷玉成');
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
        const normalizedY = (bottomY - canvasY) / totalHeight;
        const sliceIndex = Math.floor(normalizedY * SLICE_COUNT);

        if (sliceIndex >= 0 && sliceIndex < SLICE_COUNT) {
            const centerX = potCanvas.width / 2;
            const currentDist = Math.abs(canvasX - centerX);
            const maxRadiusPx = potCanvas.width * 0.34;
            const distRatio = Math.max(0.12, Math.min(0.98, currentDist / maxRadiusPx));

            if (potToolMode === 'brush') {
                // 自由手绘青花/描金笔刷模式 (支持勾线/分水/修胚)
                for (let offset = -2; offset <= 2; offset++) {
                    const idx = sliceIndex + offset;
                    if (idx >= 0 && idx < SLICE_COUNT) {
                        if (brushStyle === 'erase') {
                            customBrushRings[idx] = Math.max(0, (customBrushRings[idx] || 0) - 0.45);
                        } else if (brushStyle === 'wash') {
                            customBrushRings[idx] = Math.min(1.0, (customBrushRings[idx] || 0) + 0.18);
                        } else {
                            customBrushRings[idx] = Math.min(1.0, (customBrushRings[idx] || 0) + 0.45);
                        }
                    }
                }
            } else {
                // 五大造物塑形模式：收束 / 鼓腹 / 跟随修光揉搓
                const influenceRange = 5;
                for (let offset = -influenceRange; offset <= influenceRange; offset++) {
                    const idx = sliceIndex + offset;
                    if (idx >= 0 && idx < SLICE_COUNT) {
                        const weight = Math.cos((offset / (influenceRange + 0.5)) * (Math.PI / 2));
                        if (potToolMode === 'push') {
                            // 向内收束：手指或竹刀由外向内压塑
                            targetRadii[idx] = Math.max(0.15, targetRadii[idx] - 0.042 * weight);
                        } else if (potToolMode === 'pull') {
                            // 向外鼓腹：手指自内膛向外顶出饱满曲线
                            targetRadii[idx] = Math.min(0.98, targetRadii[idx] + 0.042 * weight);
                        } else {
                            // 跟随修光 / 指尖揉搓：泥体边缘实时柔顺跟随指尖拖拽
                            targetRadii[idx] += (distRatio - targetRadii[idx]) * 0.32 * weight;
                            targetRadii[idx] = Math.max(0.15, Math.min(0.98, targetRadii[idx]));
                        }
                    }
                }
                updatePotteryLiveMetrics();
            }

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
    };

    potCanvas.addEventListener('mousedown', (e) => {
        savePotterySnapshot();
        isInteractingPot = true;
        initAudioContext();
        handlePointerAction(e);
    });
    window.addEventListener('mousemove', (e) => {
        if (isInteractingPot) handlePointerAction(e);
    });
    window.addEventListener('mouseup', () => {
        isInteractingPot = false;
        pointerPos.active = false;
    });

    potCanvas.addEventListener('touchstart', (e) => {
        savePotterySnapshot();
        isInteractingPot = true;
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
    if (!isPotteryVisible) return;
    potAnimId = requestAnimationFrame(potAnimLoop);
    if (!potCtx || !potCanvas) return;

    const w = potCanvas.width;
    const h = potCanvas.height;
    potCtx.clearRect(0, 0, w, h);

    for (let i = 0; i < SLICE_COUNT; i++) {
        clayRadii[i] += (targetRadii[i] - clayRadii[i]) * 0.14;
    }
    clayRotationAngle += 0.055;

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

    // 纵向曲率明暗
    for (let i = 1; i < SLICE_COUNT - 1; i++) {
        const dr = clayRadii[i + 1] - clayRadii[i - 1];
        const y = leftPts[i].y;
        if (dr > 0.01) {
            potCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.22, dr * 1.6)})`;
            potCtx.fillRect(centerX - maxRadiusPx, y - stepH * 0.6, maxRadiusPx * 2, stepH * 1.2);
        } else if (dr < -0.01) {
            potCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.22, -dr * 1.4)})`;
            potCtx.fillRect(centerX - maxRadiusPx, y - stepH * 0.6, maxRadiusPx * 2, stepH * 1.2);
        }
    }

    // 旋转拉坯旋纹
    potCtx.strokeStyle = isFired ? 'rgba(255, 255, 255, 0.10)' : 'rgba(30, 22, 16, 0.16)';
    potCtx.lineWidth = 1.1;
    for (let i = 2; i < SLICE_COUNT - 1; i += 2) {
        const y = leftPts[i].y;
        const rx = leftPts[i].rx;
        potCtx.beginPath();
        potCtx.ellipse(centerX, y, rx * 0.98, 7, 0, 0, Math.PI);
        potCtx.stroke();
    }

    // 用户自由手绘的青花环带与花叶纹
    for (let i = 1; i < SLICE_COUNT - 1; i++) {
        const intensity = customBrushRings[i] || 0;
        if (intensity > 0.05) {
            const y = leftPts[i].y;
            const rx = leftPts[i].rx;
            potCtx.strokeStyle = `rgba(24, 62, 136, ${Math.min(0.88, intensity)})`;
            potCtx.lineWidth = 3.2;
            potCtx.beginPath();
            potCtx.ellipse(centerX, y, rx, 6.5, 0, 0, Math.PI);
            potCtx.stroke();
        }
    }

    // 预设纹饰
    if (currentPotPattern === 'lotus') {
        potCtx.strokeStyle = isFired ? 'rgba(255, 255, 255, 0.55)' : 'rgba(55, 45, 35, 0.45)';
        potCtx.lineWidth = 2.0;
        const midStart = Math.floor(SLICE_COUNT * 0.25);
        const midEnd = Math.floor(SLICE_COUNT * 0.72);
        const yTop = leftPts[midEnd].y;
        const yBot = leftPts[midStart].y;
        const petalCount = 8;
        for (let p = 0; p < petalCount; p++) {
            const ang = (clayRotationAngle * 0.5 + (p / petalCount) * Math.PI * 2) % (Math.PI * 2);
            if (Math.sin(ang) > -0.2) {
                const xOffset = Math.cos(ang) * leftPts[Math.floor((midStart + midEnd) / 2)].rx * 0.85;
                potCtx.beginPath();
                potCtx.moveTo(centerX + xOffset - 18, yBot);
                potCtx.quadraticCurveTo(centerX + xOffset, yTop - 12, centerX + xOffset + 18, yBot);
                potCtx.stroke();
            }
        }
    } else if (currentPotPattern === 'qinghua') {
        const qColor = isFired ? 'rgba(22, 58, 128, 0.85)' : 'rgba(38, 62, 98, 0.62)';
        potCtx.strokeStyle = qColor;
        potCtx.fillStyle = qColor;
        [6, 8, 18, 28, 35, 38].forEach(idx => {
            if (leftPts[idx]) {
                potCtx.lineWidth = 2.2;
                potCtx.beginPath();
                potCtx.ellipse(centerX, leftPts[idx].y, leftPts[idx].rx, 6, 0, 0, Math.PI);
                potCtx.stroke();
            }
        });
        const midIdx = Math.floor(SLICE_COUNT * 0.48);
        const midY = leftPts[midIdx].y;
        const midRx = leftPts[midIdx].rx;
        for (let f = 0; f < 6; f++) {
            const ang = (clayRotationAngle * 0.6 + (f / 6) * Math.PI * 2) % (Math.PI * 2);
            if (Math.sin(ang) > 0) {
                const fx = centerX + Math.cos(ang) * midRx * 0.82;
                const fy = midY + Math.sin(ang * 2) * 8;
                const scaleX = Math.max(0.3, Math.sin(ang));
                potCtx.save();
                potCtx.translate(fx, fy);
                potCtx.scale(scaleX, 1);
                potCtx.beginPath();
                potCtx.arc(0, 0, 14, 0, Math.PI * 2);
                potCtx.stroke();
                for (let pet = 0; pet < 6; pet++) {
                    const pa = (pet / 6) * Math.PI * 2;
                    potCtx.beginPath();
                    potCtx.arc(Math.cos(pa) * 18, Math.sin(pa) * 18, 5, 0, Math.PI * 2);
                    potCtx.fill();
                }
                potCtx.restore();
            }
        }
    } else if (currentPotPattern === 'goldring') {
        potCtx.strokeStyle = 'rgba(225, 185, 95, 0.90)';
        potCtx.lineWidth = 3.2;
        [10, 17, 24, 33].forEach(idx => {
            if (leftPts[idx]) {
                potCtx.beginPath();
                potCtx.ellipse(centerX, leftPts[idx].y, leftPts[idx].rx, 7, 0, 0, Math.PI);
                potCtx.stroke();
            }
        });
    }

    if (isFired) {
        potCtx.strokeStyle = 'rgba(40, 32, 26, 0.30)';
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
    const gNames = { tianqing: '北宋汝窑雨过天青釉', fenqing: '南宋龙泉粉青如玉釉', yuebai: '宋官窑月白莹霜釉', junhong: '禹州钧窑玫瑰紫窑变釉', jianhei: '建阳建窑乌金兔毫釉' };
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
    ctx.fillText('华夏器道 · 天青泥火 — 陶然天成数字藏品证书', 56, 86);
    ctx.fillStyle = '#8BC2CE';
    ctx.font = '14px monospace';
    ctx.fillText(`DIGITAL TWIN NFT ID: #TC-${Date.now().toString().slice(-6)}   |   1300℃ DRAGON KILN CERTIFIED`, 56, 114);

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
