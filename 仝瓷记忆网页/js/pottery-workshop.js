/**
 * 华夏器道 · 指尖拉坯仿真工坊与陶瓷音效引擎 (Pottery Workshop & Web Audio Engine)
 * 纯前端 Canvas 交互拉坯塑形、指纹旋纹拟真、温度还原焰烧成仿真、Web Audio 清脆瓷音
 */

// ================================================================
// 一、Web Audio API 纯代码程序化陶瓷音效合成器 (零外链音频依赖)
// ================================================================
let audioCtx = null;
let soundEnabled = true;

function initAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/**
 * 模拟古瓷“击之清脆如磬”的清亮敲击声 (两宋瓷器声学频率约 1800Hz~3200Hz)
 */
function playPorcelainChime(freq = 2400) {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // 正弦波 + 微弱金属泛音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 1.2);

        // 快速击打侵入，随后悠长指数衰减 (如磬悠扬)
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.6);
    } catch (e) {
        console.warn('Audio play failed:', e);
    }
}

/**
 * 模拟冰裂开片声 (高频微裂纹)
 */
function playCrackleSound() {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4200 + Math.random() * 800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    } catch (e) {}
}

/**
 * 模拟古代五声音阶古编磬陶瓷清音 (空灵悠扬，双谐波共振)
 */
function playPentatonicChime(freq = 261.63, harmonics = [1046.5, 2093.0]) {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        // 主频基波
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.994, now + 1.8);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 1.9);

        // 泛音 1 (金属与陶瓷高频晶莹共振)
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
    } catch (e) {
        console.warn('Pentatonic chime failed:', e);
    }
}


// ================================================================
// 二、指尖拉坯交互仿真工坊 (Canvas 实时拉坯、旋纹与烧窑系统)
// ================================================================
let potCanvas, potCtx;
let potAnimId = null;
let isInteractingPot = false;
let potToolMode = 'push'; // push (向内挤压) / pull (向外扩张) / smooth (修光修平)

// 泥料切片高度离散点 (28 个高度层，记录每一层的半径)
const SLICE_COUNT = 32;
let clayRadii = [];
let targetRadii = [];
let clayRotationAngle = 0;
let isFired = false;
let currentClayGlaze = 'tianqing';

// 预设经典器型轮廓比例
const vesselPresets = {
    meiping: [
        0.35, 0.38, 0.42, 0.48, 0.58, 0.72, 0.85, 0.95, 0.98, 0.95, 
        0.88, 0.78, 0.68, 0.58, 0.50, 0.45, 0.42, 0.40, 0.38, 0.37, 
        0.36, 0.36, 0.37, 0.39, 0.42, 0.45, 0.47, 0.46, 0.43, 0.38, 
        0.34, 0.32
    ],
    bowl: [
        0.98, 0.96, 0.92, 0.88, 0.82, 0.75, 0.68, 0.60, 0.52, 0.45, 
        0.38, 0.32, 0.28, 0.25, 0.23, 0.22, 0.21, 0.21, 0.21, 0.21, 
        0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 
        0.21, 0.21
    ],
    vase: [
        0.45, 0.48, 0.42, 0.35, 0.30, 0.28, 0.28, 0.30, 0.35, 0.45, 
        0.60, 0.75, 0.88, 0.95, 0.98, 0.95, 0.88, 0.78, 0.68, 0.58, 
        0.50, 0.44, 0.40, 0.38, 0.37, 0.38, 0.40, 0.42, 0.45, 0.47, 
        0.48, 0.45
    ]
};

/**
 * 视口节能监听：离开屏幕暂停陶轮重绘，回屏自动恢复
 */
let isPotteryVisible = true;

function setupPotteryVisibilityObserver() {
    if (!potCanvas) return;
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

/**
 * 初始化拉坯工作台
 */
function initPotteryWorkshop() {
    potCanvas = document.getElementById('pottery-canvas');
    if (!potCanvas) return;
    potCtx = potCanvas.getContext('2d');

    resetClay();
    bindPotteryEvents();
    setupPotteryVisibilityObserver();

    if (potAnimId) cancelAnimationFrame(potAnimId);
    potAnimLoop();
}

/**
 * 重置为初始圆柱泥柱
 */
function resetClay() {
    clayRadii = [];
    targetRadii = [];
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        // 初始圆柱略微下宽上窄
        const r = 0.55 - (i / SLICE_COUNT) * 0.12;
        clayRadii.push(r);
        targetRadii.push(r);
    }
    updateFiringBadge('生坯塑形中');
    showToast('已安放新高岭土泥料，请在转盘上推拉塑形！');
}

/**
 * 载入经典预设器型作为目标轮廓
 */
function applyPresetVessel(presetName) {
    const preset = vesselPresets[presetName];
    if (!preset) return;
    isFired = false;
    for (let i = 0; i < SLICE_COUNT; i++) {
        targetRadii[i] = preset[i] || 0.4;
    }
    updateFiringBadge('生坯塑形中');
    playPorcelainChime(1600);
    showToast(`已辅助拉出【${presetName === 'meiping' ? '宋代梅瓶' : (presetName === 'bowl' ? '宋代敞口盏' : '玉壶春瓶')}】经典胎骨雏形！`);
}

/**
 * 切换釉色
 */
function selectPotGlaze(glazeKey) {
    currentClayGlaze = glazeKey;
    document.querySelectorAll('.pot-glaze-btn').forEach(btn => {
        if (btn.dataset.glaze === glazeKey) {
            btn.classList.add('ring-2', 'ring-tianqing-deep', 'scale-105');
        } else {
            btn.classList.remove('ring-2', 'ring-tianqing-deep', 'scale-105');
        }
    });
    playCrackleSound();
    showToast(`已选定配釉：${glazeKey === 'tianqing' ? '天青釉' : (glazeKey === 'fenqing' ? '粉青釉' : (glazeKey === 'yuebai' ? '月白釉' : '玫瑰紫变釉'))}`);
}

/**
 * 模拟入窑 1300℃ 柴火烧造
 */
function firePotInKiln() {
    const kilnOverlay = document.getElementById('kiln-fire-overlay');
    const kilnTempText = document.getElementById('kiln-temp-text');
    if (!kilnOverlay || !kilnTempText) return;

    kilnOverlay.classList.remove('hidden');
    let temp = 20;

    const interval = setInterval(() => {
        temp += 48;
        if (temp >= 1300) {
            temp = 1300;
            clearInterval(interval);
            setTimeout(() => {
                kilnOverlay.classList.add('hidden');
                isFired = true;
                updateFiringBadge('柴窑烧造完成 · 官瓷天成');
                playPorcelainChime(2600);
                setTimeout(playCrackleSound, 400);
                setTimeout(playCrackleSound, 900);
                showToast('🔥 开窑大吉！胎骨致密、釉泛宝光，恭喜成器！');
            }, 600);
        }
        kilnTempText.textContent = `${temp} ℃`;
    }, 45);
}

function updateFiringBadge(text) {
    const badge = document.getElementById('pottery-status-badge');
    if (badge) badge.textContent = text;
}

/**
 * 绑定画布鼠标与触控事件 (移动端精准映射防偏轴 + 防误滚)
 */
function bindPotteryEvents() {
    if (!potCanvas) return;

    const handlePointerAction = (e) => {
        if (!isInteractingPot) return;
        const rect = potCanvas.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        if (clientX === null || clientY === null) return;

        // 核心精准换算：将屏幕像素坐标准确映射到 Canvas 内部逻辑画布 (520x420)
        const scaleX = potCanvas.width / (rect.width || potCanvas.width);
        const scaleY = potCanvas.height / (rect.height || potCanvas.height);
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;

        // 计算当前作用的高度层
        const normalizedY = 1 - (canvasY / potCanvas.height); // 0 (底足) ~ 1 (口沿)
        const sliceIndex = Math.floor(normalizedY * SLICE_COUNT);

        if (sliceIndex >= 0 && sliceIndex < SLICE_COUNT) {
            // 计算手指离中心轴的距离 (精准对齐中心轴)
            const centerX = potCanvas.width / 2;
            const distFromCenter = Math.abs(canvasX - centerX) / (potCanvas.width * 0.42);

            // 影响相邻层 (高斯平滑扩散)
            for (let offset = -3; offset <= 3; offset++) {
                const idx = sliceIndex + offset;
                if (idx >= 0 && idx < SLICE_COUNT) {
                    const weight = Math.cos((offset / 3.5) * (Math.PI / 2));
                    if (potToolMode === 'push') {
                        targetRadii[idx] = Math.max(0.18, targetRadii[idx] - 0.025 * weight);
                    } else if (potToolMode === 'pull') {
                        targetRadii[idx] = Math.min(0.95, targetRadii[idx] + 0.025 * weight);
                    } else {
                        // 顺滑工具：贴近手指位置
                        targetRadii[idx] += (distFromCenter - targetRadii[idx]) * 0.15 * weight;
                    }
                }
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
    });

    // 移动端触摸优化 (触控跟手，阻止页面晃动)
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
    });

    potCanvas.addEventListener('touchcancel', () => {
        isInteractingPot = false;
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
 * 陶轮拉坯主渲染循环 (节能调度：进入视口 60FPS 高拟真，脱屏暂停)
 */
function potAnimLoop() {
    if (!isPotteryVisible) return;
    potAnimId = requestAnimationFrame(potAnimLoop);
    if (!potCtx || !potCanvas) return;

    const w = potCanvas.width;
    const h = potCanvas.height;
    potCtx.clearRect(0, 0, w, h);

    // 1. 物理半径弹性平滑逼近
    for (let i = 0; i < SLICE_COUNT; i++) {
        clayRadii[i] += (targetRadii[i] - clayRadii[i]) * 0.12;
    }

    clayRotationAngle += 0.04;

    const centerX = w / 2;
    const bottomY = h * 0.88;
    const totalHeight = h * 0.72;
    const stepH = totalHeight / (SLICE_COUNT - 1);
    const maxRadiusPx = w * 0.38;

    // 2. 绘制下方旋转陶车木转盘 (Dark Wood Wheel)
    potCtx.save();
    potCtx.fillStyle = '#1c1714';
    potCtx.beginPath();
    potCtx.ellipse(centerX, bottomY + 12, maxRadiusPx * 1.15, 24, 0, 0, Math.PI * 2);
    potCtx.fill();

    potCtx.fillStyle = '#3a2d24';
    potCtx.beginPath();
    potCtx.ellipse(centerX, bottomY + 8, maxRadiusPx * 1.12, 22, 0, 0, Math.PI * 2);
    potCtx.fill();

    // 转盘同心木纹
    potCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    potCtx.lineWidth = 1.5;
    for (let r = 0.3; r < 1.0; r += 0.25) {
        potCtx.beginPath();
        potCtx.ellipse(centerX, bottomY + 8, maxRadiusPx * 1.12 * r, 22 * r, 0, 0, Math.PI * 2);
        potCtx.stroke();
    }
    potCtx.restore();

    // 3. 构建泥坯左右轮廓线
    const leftPoints = [];
    const rightPoints = [];

    for (let i = 0; i < SLICE_COUNT; i++) {
        const y = bottomY - i * stepH;
        const rx = clayRadii[i] * maxRadiusPx;
        leftPoints.push({ x: centerX - rx, y });
        rightPoints.push({ x: centerX + rx, y });
    }

    // 4. 填充器物主体渐变色彩 (未烧造为湿润麻灰高岭土色，烧造后呈现温润名瓷釉色)
    potCtx.save();
    let bodyGrad = potCtx.createLinearGradient(centerX - maxRadiusPx, 0, centerX + maxRadiusPx, 0);

    if (!isFired) {
        // 未烧造湿泥色 (高岭土暗灰色，带高光水泽)
        bodyGrad.addColorStop(0.0, '#4e4c48');
        bodyGrad.addColorStop(0.25, '#76736d');
        bodyGrad.addColorStop(0.45, '#9a9790'); // 陶工手抚水光
        bodyGrad.addColorStop(0.75, '#686560');
        bodyGrad.addColorStop(1.0, '#3e3d3a');
    } else {
        // 烧造后瓷器天青/粉青玉质色
        if (currentClayGlaze === 'tianqing') {
            bodyGrad.addColorStop(0.0, '#53757d');
            bodyGrad.addColorStop(0.3, '#8fb8c0');
            bodyGrad.addColorStop(0.5, '#badbe2'); // 极亮玉脂高光
            bodyGrad.addColorStop(0.75, '#6f97a0');
            bodyGrad.addColorStop(1.0, '#3a565d');
        } else if (currentClayGlaze === 'fenqing') {
            bodyGrad.addColorStop(0.0, '#48685b');
            bodyGrad.addColorStop(0.3, '#7eaf9b');
            bodyGrad.addColorStop(0.5, '#b4dbca');
            bodyGrad.addColorStop(0.75, '#618d7c');
            bodyGrad.addColorStop(1.0, '#344e43');
        } else if (currentClayGlaze === 'yuebai') {
            bodyGrad.addColorStop(0.0, '#78868c');
            bodyGrad.addColorStop(0.3, '#c2d2d8');
            bodyGrad.addColorStop(0.5, '#f0f6f8');
            bodyGrad.addColorStop(0.75, '#a4b7be');
            bodyGrad.addColorStop(1.0, '#5e6c72');
        } else {
            // 玫瑰紫
            bodyGrad.addColorStop(0.0, '#4a152e');
            bodyGrad.addColorStop(0.3, '#7a2e53');
            bodyGrad.addColorStop(0.5, '#b85485');
            bodyGrad.addColorStop(0.75, '#631d3f');
            bodyGrad.addColorStop(1.0, '#380c21');
        }
    }

    potCtx.fillStyle = bodyGrad;
    potCtx.beginPath();
    potCtx.moveTo(leftPoints[0].x, leftPoints[0].y);

    for (let i = 1; i < leftPoints.length; i++) {
        const xc = (leftPoints[i].x + leftPoints[i - 1].x) / 2;
        const yc = (leftPoints[i].y + leftPoints[i - 1].y) / 2;
        potCtx.quadraticCurveTo(leftPoints[i - 1].x, leftPoints[i - 1].y, xc, yc);
    }
    potCtx.lineTo(leftPoints[leftPoints.length - 1].x, leftPoints[leftPoints.length - 1].y);

    // 口沿顶圆弧
    const topIdx = SLICE_COUNT - 1;
    potCtx.ellipse(centerX, leftPoints[topIdx].y, clayRadii[topIdx] * maxRadiusPx, 8, 0, Math.PI, 0, true);

    for (let i = rightPoints.length - 1; i >= 1; i--) {
        const xc = (rightPoints[i].x + rightPoints[i - 1].x) / 2;
        const yc = (rightPoints[i].y + rightPoints[i - 1].y) / 2;
        potCtx.quadraticCurveTo(rightPoints[i].x, rightPoints[i].y, xc, yc);
    }
    potCtx.lineTo(rightPoints[0].x, rightPoints[0].y);

    // 底部圆弧
    potCtx.ellipse(centerX, bottomY, clayRadii[0] * maxRadiusPx, 10, 0, 0, Math.PI, false);
    potCtx.closePath();
    potCtx.fill();

    // 5. 绘制陶轮高速旋转拉坯旋纹 (Throwing Rib Marks)
    potCtx.strokeStyle = isFired ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
    potCtx.lineWidth = 1;
    for (let i = 2; i < SLICE_COUNT - 1; i += 2) {
        const y = bottomY - i * stepH;
        const rx = clayRadii[i] * maxRadiusPx;
        const offset = Math.sin(clayRotationAngle + i * 0.4) * 3;
        potCtx.beginPath();
        potCtx.ellipse(centerX + offset * 0.3, y, rx * 0.96, 6, 0, 0, Math.PI);
        potCtx.stroke();
    }

    // 6. 口沿圆润内口暗影
    potCtx.fillStyle = isFired ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.45)';
    potCtx.beginPath();
    potCtx.ellipse(centerX, leftPoints[topIdx].y, clayRadii[topIdx] * maxRadiusPx, 6, 0, 0, Math.PI * 2);
    potCtx.fill();

    potCtx.restore();
}

/**
 * 导出并保存用户自己的陶瓷成果卡
 */
function downloadPotteryArtwork() {
    if (!potCanvas) return;
    const link = document.createElement('a');
    link.download = `华夏器道-指尖拉坯雅作-${Date.now()}.png`;
    link.href = potCanvas.toDataURL('image/png');
    link.click();
    showToast('已成功保存您的专属宋瓷数字造物成果！');
}

// 挂载全局方法
window.initPotteryWorkshop = initPotteryWorkshop;
window.resetClay = resetClay;
window.applyPresetVessel = applyPresetVessel;
window.selectPotGlaze = selectPotGlaze;
window.firePotInKiln = firePotInKiln;
window.setPotTool = setPotTool;
window.downloadPotteryArtwork = downloadPotteryArtwork;
window.playPorcelainChime = playPorcelainChime;
window.playCrackleSound = playCrackleSound;
window.playPentatonicChime = playPentatonicChime;

