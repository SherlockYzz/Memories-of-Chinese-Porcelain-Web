/**
 * 华夏器道 · 仝瓷记忆 — 3D光影指尖拉坯、刻花彩绘与1300℃窑火仿真引擎 (Pottery Studio & Web Audio Engine)
 * 核心升级：
 * 1. 48层高密度曲面切片 + 逐层3D法线高光计算 (Blinn-Phong Specular Shading)
 * 2. 四大器身纹饰工艺实时渲染：素面玉肌 / 定窑浮雕划花莲瓣 / 宣德苏麻离青缠枝 / 官窑凸弦鎏金瑞纹
 * 3. 指尖塑形水雾泥点飞溅粒子 + 烧成后自然金丝铁线冰裂纹生成
 * 4. Web Audio API 物理泛音合成：两宋名瓷叩击声、冰裂开片声、古代五声瓷编磬
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
// 一、Web Audio API 纯代码程序化陶瓷音效合成器
// ================================================================
let audioCtx = null;
let soundEnabled = true;

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
        osc.frequency.exponentialRampToValueAtTime(freq * 0.985, now + 1.2);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
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

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    } catch (e) {}
}

function playPentatonicChime(freq = 261.63, harmonics = [1046.5, 2093.0]) {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.994, now + 1.8);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 1.9);

        if (harmonics && harmonics[0]) {
            const hOsc1 = audioCtx.createOscillator();
            const hGain1 = audioCtx.createGain();
            hOsc1.type = 'triangle';
            hOsc1.frequency.setValueAtTime(harmonics[0], now);
            hGain1.gain.setValueAtTime(0.08, now);
            hGain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
            hOsc1.connect(hGain1);
            hGain1.connect(audioCtx.destination);
            hOsc1.start(now);
            hOsc1.stop(now + 1.3);
        }
        gain.connect(audioCtx.destination);
    } catch (e) {}
}

// ================================================================
// 二、3D 光影指尖拉坯、纹饰雕刻与烧窑系统
// ================================================================
let potCanvas, potCtx;
let potAnimId = null;
let isInteractingPot = false;
let potToolMode = 'push';
let currentPotPattern = 'none'; // 'none' | 'lotus' | 'qinghua' | 'goldring'

const SLICE_COUNT = 40;
let clayRadii = [];
let targetRadii = [];
let clayRotationAngle = 0;
let isFired = false;
let currentClayGlaze = 'tianqing';
let splashParticles = [];
let pointerPos = { x: -100, y: -100, active: false };

// 四大经典宋明器型模板 (40层高度采样，从底足0到口沿39)
const vesselPresets = {
    meiping: [
        0.34, 0.36, 0.38, 0.40, 0.43, 0.46, 0.50, 0.54, 0.59, 0.64,
        0.69, 0.74, 0.79, 0.84, 0.88, 0.92, 0.95, 0.97, 0.98, 0.99,
        0.99, 0.98, 0.96, 0.93, 0.89, 0.84, 0.77, 0.68, 0.57, 0.45,
        0.34, 0.27, 0.24, 0.23, 0.25, 0.29, 0.33, 0.35, 0.34, 0.31
    ],
    vase: [
        0.42, 0.44, 0.41, 0.38, 0.43, 0.52, 0.64, 0.75, 0.84, 0.91,
        0.95, 0.97, 0.96, 0.93, 0.88, 0.81, 0.73, 0.64, 0.56, 0.48,
        0.42, 0.37, 0.33, 0.30, 0.28, 0.27, 0.27, 0.28, 0.30, 0.33,
        0.37, 0.42, 0.48, 0.54, 0.60, 0.66, 0.71, 0.75, 0.77, 0.76
    ],
    gourd: [
        0.38, 0.40, 0.44, 0.54, 0.68, 0.80, 0.89, 0.94, 0.96, 0.94,
        0.89, 0.81, 0.70, 0.56, 0.43, 0.34, 0.30, 0.31, 0.37, 0.47,
        0.58, 0.68, 0.75, 0.78, 0.78, 0.74, 0.67, 0.57, 0.46, 0.35,
        0.27, 0.22, 0.20, 0.19, 0.19, 0.20, 0.21, 0.22, 0.22, 0.21
    ],
    bowl: [
        0.28, 0.30, 0.29, 0.33, 0.39, 0.45, 0.51, 0.57, 0.63, 0.68,
        0.73, 0.78, 0.82, 0.86, 0.89, 0.92, 0.94, 0.96, 0.97, 0.98,
        0.98, 0.97, 0.95, 0.96, 0.98, 0.99, 0.99, 0.99, 0.99, 0.99,
        0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99
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

    // 确保烧窑红屏遮罩初始处于隐藏状态
    const kilnOverlay = document.getElementById('kiln-fire-overlay');
    if (kilnOverlay) kilnOverlay.classList.add('hidden');

    resetClay(true);
    bindPotteryEvents();
    setupPotteryVisibilityObserver();

    if (potAnimId) cancelAnimationFrame(potAnimId);
    potAnimLoop();
}

function resetClay(silent = false) {
    clayRadii = [];
    targetRadii = [];
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        // 默认赋予微具宋韵弧度的温润泥坯柱
        const t = i / (SLICE_COUNT - 1);
        const r = 0.44 + Math.sin(t * Math.PI) * 0.22 - t * 0.08;
        clayRadii.push(r);
        targetRadii.push(r);
    }
    updateFiringBadge('高岭土湿坯 · 旋转塑形中');
    if (!silent && typeof showToast === 'function') {
        showToast('已安放新陈腐高岭土泥料，请在转盘上推拉塑形！');
    }
}

function applyPresetVessel(presetName) {
    const preset = vesselPresets[presetName];
    if (!preset) return;
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        targetRadii[i] = preset[i] !== undefined ? preset[i] : 0.45;
    }
    const names = { meiping: '宋定窑梅瓶', vase: '明青花玉壶春瓶', gourd: '大吉葫芦瓶', bowl: '建窑斗茶盏' };
    updateFiringBadge(`经典器型 · ${names[presetName] || '生坯'}塑形`);
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

function firePotInKiln() {
    const kilnOverlay = document.getElementById('kiln-fire-overlay');
    const kilnTempText = document.getElementById('kiln-temp-text');
    const kilnStageText = document.getElementById('kiln-stage-text');
    if (!kilnOverlay || !kilnTempText) return;

    kilnOverlay.classList.remove('hidden');
    let temp = 25;

    const interval = setInterval(() => {
        temp += 55;
        if (kilnStageText) {
            if (temp < 600) kilnStageText.textContent = '阶段一：低温排湿 · 高岭土结晶水析出';
            else if (temp < 980) kilnStageText.textContent = '阶段二：800℃ 素烧定骨 · 莫来石晶相初生';
            else kilnStageText.textContent = '阶段三：1300℃ 松柴强还原焰 · 玛瑙矿物熔融成玉';
        }
        if (temp >= 1300) {
            temp = 1300;
            clearInterval(interval);
            setTimeout(() => {
                kilnOverlay.classList.add('hidden');
                isFired = true;
                updateFiringBadge('🔥 1300℃ 柴窑涅槃 · 官瓷玉成');
                playPorcelainChime(2680);
                setTimeout(playCrackleSound, 380);
                setTimeout(playCrackleSound, 820);
                if (typeof showToast === 'function') {
                    showToast('🔥 开窑大吉！胎骨致密如金石、釉泛温润玉光，恭喜成器！');
                }
            }, 550);
        }
        kilnTempText.textContent = `${temp} ℃`;
    }, 45);
}

function updateFiringBadge(text) {
    const badge = document.getElementById('pottery-status-badge');
    if (badge) badge.textContent = text;
}

function bindPotteryEvents() {
    if (!potCanvas) return;

    const handlePointerAction = (e) => {
        if (!isInteractingPot) return;
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
        const totalHeight = potCanvas.height * 0.68;
        const normalizedY = (bottomY - canvasY) / totalHeight;
        const sliceIndex = Math.floor(normalizedY * SLICE_COUNT);

        if (sliceIndex >= 0 && sliceIndex < SLICE_COUNT) {
            const centerX = potCanvas.width / 2;
            const distFromCenter = Math.abs(canvasX - centerX) / (potCanvas.width * 0.36);

            for (let offset = -4; offset <= 4; offset++) {
                const idx = sliceIndex + offset;
                if (idx >= 0 && idx < SLICE_COUNT) {
                    const weight = Math.cos((offset / 4.5) * (Math.PI / 2));
                    if (potToolMode === 'push') {
                        targetRadii[idx] = Math.max(0.16, targetRadii[idx] - 0.022 * weight);
                    } else if (potToolMode === 'pull') {
                        targetRadii[idx] = Math.min(0.98, targetRadii[idx] + 0.022 * weight);
                    } else {
                        targetRadii[idx] += (Math.max(0.16, Math.min(0.98, distFromCenter)) - targetRadii[idx]) * 0.18 * weight;
                    }
                }
            }

            // 生成水雾泥浆飞溅微粒
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
}

/**
 * 3D 光影拉坯主渲染循环 (包含体积光照、立体内膛、器表纹饰与水雾微粒)
 */
let lastPotTick = 0;
function potAnimLoop(now) {
    if (!isPotteryVisible) return;
    potAnimId = requestAnimationFrame(potAnimLoop);
    if (now && now - lastPotTick < 28) return;
    lastPotTick = now || 0;
    if (!potCtx || !potCanvas) return;

    const w = potCanvas.width;
    const h = potCanvas.height;
    potCtx.clearRect(0, 0, w, h);

    // 1. 物理半径阻尼逼近
    for (let i = 0; i < SLICE_COUNT; i++) {
        clayRadii[i] += (targetRadii[i] - clayRadii[i]) * 0.14;
    }
    clayRotationAngle += 0.055;

    const centerX = w / 2;
    const bottomY = h * 0.85;
    const totalHeight = h * 0.67;
    const stepH = totalHeight / (SLICE_COUNT - 1);
    const maxRadiusPx = w * 0.34;

    // 2. 绘制博物馆聚光背景光晕
    const bgGlow = potCtx.createRadialGradient(centerX, h * 0.45, 20, centerX, h * 0.45, w * 0.48);
    bgGlow.addColorStop(0, isFired ? 'rgba(143, 184, 192, 0.18)' : 'rgba(197, 160, 89, 0.10)');
    bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    potCtx.fillStyle = bgGlow;
    potCtx.fillRect(0, 0, w, h);

    // 3. 绘制下方高速旋转古法檀木鎏金陶轮 (3D Perspective Wheel)
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

    // 陶轮旋转刻度与鎏金同心环
    potCtx.strokeStyle = 'rgba(212, 175, 106, 0.38)';
    potCtx.lineWidth = 1.4;
    [0.45, 0.78, 1.04].forEach(rScale => {
        potCtx.beginPath();
        potCtx.ellipse(centerX, bottomY + 10, maxRadiusPx * rScale, 25 * rScale, 0, 0, Math.PI * 2);
        potCtx.stroke();
    });

    // 旋转辐条感
    for (let sp = 0; sp < 8; sp++) {
        const ang = clayRotationAngle * 0.8 + (sp / 8) * Math.PI * 2;
        potCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        potCtx.beginPath();
        potCtx.moveTo(centerX + Math.cos(ang) * 20, bottomY + 10 + Math.sin(ang) * 5);
        potCtx.lineTo(centerX + Math.cos(ang) * maxRadiusPx * 1.05, bottomY + 10 + Math.sin(ang) * 22);
        potCtx.stroke();
    }
    potCtx.restore();

    // 4. 构建器物左右平滑边界点
    const leftPts = [];
    const rightPts = [];
    for (let i = 0; i < SLICE_COUNT; i++) {
        const y = bottomY - i * stepH;
        const rx = clayRadii[i] * maxRadiusPx;
        leftPts.push({ x: centerX - rx, y, rx });
        rightPts.push({ x: centerX + rx, y, rx });
    }

    // 5. 绘制器物本体 3D 圆柱高光渐变与垂直曲率明暗
    potCtx.save();
    let bodyGrad = potCtx.createLinearGradient(centerX - maxRadiusPx, 0, centerX + maxRadiusPx, 0);

    if (!isFired) {
        // 湿润陈腐高岭土色（带陶工水泽高光）
        bodyGrad.addColorStop(0.0, '#443e38');
        bodyGrad.addColorStop(0.24, '#7d756c');
        bodyGrad.addColorStop(0.42, '#b0a79d');
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
            // 建盏乌金兔毫
            bodyGrad.addColorStop(0.0, '#0c0a0b');
            bodyGrad.addColorStop(0.30, '#2e2729');
            bodyGrad.addColorStop(0.45, '#6e5c46');
            bodyGrad.addColorStop(0.72, '#1d181a');
            bodyGrad.addColorStop(1.0, '#080607');
        }
    }

    // 创建器物闭合裁剪路径
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

    // 在裁剪区域内绘制 3D 纵向曲率高光、拉坯旋纹与器身纹饰
    potCtx.clip();

    // 5.1 纵向法线明暗立体感叠加
    for (let i = 1; i < SLICE_COUNT - 1; i++) {
        const dr = clayRadii[i + 1] - clayRadii[i - 1];
        const y = leftPts[i].y;
        if (dr > 0.01) {
            // 向上外扩的面受顶光更亮
            potCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.22, dr * 1.6)})`;
            potCtx.fillRect(centerX - maxRadiusPx, y - stepH * 0.6, maxRadiusPx * 2, stepH * 1.2);
        } else if (dr < -0.01) {
            potCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.22, -dr * 1.4)})`;
            potCtx.fillRect(centerX - maxRadiusPx, y - stepH * 0.6, maxRadiusPx * 2, stepH * 1.2);
        }
    }

    // 5.2 旋转拉坯旋纹
    potCtx.strokeStyle = isFired ? 'rgba(255, 255, 255, 0.10)' : 'rgba(30, 22, 16, 0.16)';
    potCtx.lineWidth = 1.1;
    for (let i = 2; i < SLICE_COUNT - 1; i += 2) {
        const y = leftPts[i].y;
        const rx = leftPts[i].rx;
        potCtx.beginPath();
        potCtx.ellipse(centerX, y, rx * 0.98, 7, 0, 0, Math.PI);
        potCtx.stroke();
    }

    // 5.3 器身纹饰雕刻与青花/描金实时旋转绘制
    if (currentPotPattern === 'lotus') {
        // 定窑浮雕划花莲瓣纹
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
        // 宣德苏麻离青缠枝莲纹
        const qColor = isFired ? 'rgba(22, 58, 128, 0.82)' : 'rgba(38, 62, 98, 0.58)';
        potCtx.strokeStyle = qColor;
        potCtx.fillStyle = qColor;
        // 上下青花双弦纹
        [6, 8, 18, 28, 33, 35].forEach(idx => {
            if (leftPts[idx]) {
                potCtx.lineWidth = 2.2;
                potCtx.beginPath();
                potCtx.ellipse(centerX, leftPts[idx].y, leftPts[idx].rx, 6, 0, 0, Math.PI);
                potCtx.stroke();
            }
        });
        // 腹部旋转青花宝相莲花头
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
        // 官窑凸弦鎏金瑞纹
        potCtx.strokeStyle = 'rgba(225, 185, 95, 0.88)';
        potCtx.lineWidth = 3.2;
        [10, 16, 22, 30].forEach(idx => {
            if (leftPts[idx]) {
                potCtx.beginPath();
                potCtx.ellipse(centerX, leftPts[idx].y, leftPts[idx].rx, 7, 0, 0, Math.PI);
                potCtx.stroke();
            }
        });
    }

    // 5.4 若已烧成，绘制金丝铁线冰裂纹与高光玉泽
    if (isFired) {
        potCtx.strokeStyle = 'rgba(40, 32, 26, 0.28)';
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

        // 左侧强玉脂高光带
        const specGrad = potCtx.createLinearGradient(centerX - maxRadiusPx * 0.55, 0, centerX - maxRadiusPx * 0.15, 0);
        specGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.34)');
        specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        potCtx.fillStyle = specGrad;
        potCtx.fillRect(centerX - maxRadiusPx, 0, maxRadiusPx * 2, h);
    }

    potCtx.restore();

    // 6. 绘制器物顶部立体口沿与深邃内膛阴影
    potCtx.save();
    const mouthY = leftPts[topIdx].y;
    const mouthRx = leftPts[topIdx].rx;

    // 外唇厚边
    potCtx.strokeStyle = isFired ? 'rgba(255, 255, 255, 0.55)' : 'rgba(180, 170, 158, 0.5)';
    potCtx.lineWidth = 3.5;
    potCtx.beginPath();
    potCtx.ellipse(centerX, mouthY, mouthRx, 9, 0, 0, Math.PI * 2);
    potCtx.stroke();

    // 内膛渐变景深
    const innerGrad = potCtx.createLinearGradient(centerX - mouthRx, mouthY, centerX + mouthRx, mouthY);
    innerGrad.addColorStop(0, '#12100e');
    innerGrad.addColorStop(0.65, isFired ? '#3a5258' : '#3d3732');
    innerGrad.addColorStop(1, '#1a1714');
    potCtx.fillStyle = innerGrad;
    potCtx.beginPath();
    potCtx.ellipse(centerX, mouthY, Math.max(4, mouthRx - 3), 7.5, 0, 0, Math.PI * 2);
    potCtx.fill();
    potCtx.restore();

    // 7. 渲染指尖水雾泥点飞溅微粒
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

    // 8. 若正在交互，绘制指尖对称辅助光标环
    if (pointerPos.active) {
        potCtx.strokeStyle = 'rgba(229, 200, 136, 0.85)';
        potCtx.lineWidth = 1.5;
        potCtx.beginPath();
        potCtx.arc(pointerPos.x, pointerPos.y, 12, 0, Math.PI * 2);
        potCtx.stroke();
    }
}

function downloadPotteryArtwork() {
    if (!potCanvas) return;
    const link = document.createElement('a');
    link.download = `华夏器道-指尖拉坯雅作-${Date.now()}.png`;
    link.href = potCanvas.toDataURL('image/png');
    link.click();
    if (typeof showToast === 'function') {
        showToast('🎉 已成功导出并保存您的专属宋瓷造物作品！');
    }
}

window.initPotteryWorkshop = initPotteryWorkshop;
window.resetClay = resetClay;
window.applyPresetVessel = applyPresetVessel;
window.setPotPattern = setPotPattern;
window.selectPotGlaze = selectPotGlaze;
window.firePotInKiln = firePotInKiln;
window.setPotTool = setPotTool;
window.downloadPotteryArtwork = downloadPotteryArtwork;
window.playPorcelainChime = playPorcelainChime;
window.playCrackleSound = playCrackleSound;
window.playPentatonicChime = playPentatonicChime;
