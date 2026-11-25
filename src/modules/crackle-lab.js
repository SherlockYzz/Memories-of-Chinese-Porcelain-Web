/**
 * 模块：开片过程模拟器 (crackle-lab)
 * 调节胎釉热膨胀系数差 Δα、釉厚与冷却速度，实时绘制双尺度 Voronoi 冰裂纹，
 * 并用 Web Audio API 合成清脆“冰裂声”，导出《我的开片标本卡》PNG。
 */
import { defineModule, data, bus, toast, html, setHTML } from '@core';

let cfg = null;
let state = { deltaAlpha: 1.8, thickness: 1.6, coolRate: 55, staining: 'tea', glazeHex: '#739ca4', progress: 1.0 };
let animTimer = 0;

function seeded(seed0) {
    let s = seed0 >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function playIceCrackAudio(count = 3) {
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        for (let i = 0; i < count; i++) {
            const delay = i * 0.08 + Math.random() * 0.05;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2200 + Math.random() * 1400, ctx.currentTime + delay);
            osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + delay + 0.045);
            gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.055);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.06);
        }
        setTimeout(() => ctx.close().catch(() => {}), 800);
    } catch {}
}

function nearestKilnAnalogy() {
    const stress = state.deltaAlpha * (0.65 + state.thickness * 0.35) * (0.75 + state.coolRate / 220);
    if (stress < 0.7) return { name: '龙泉粉青（无纹素釉）', desc: '胎釉膨胀匹配，残余拉应力低于断裂阈值，釉面光润无片。' };
    if (stress < 1.9) return { name: '北宋汝窑（鱼鳞/细冰裂）', desc: '轻微热应力形成疏朗斜裂的细碎冰裂，开而不张。' };
    if (stress < 3.1) return { name: '南宋官窑（蟹爪冰裂）', desc: '厚釉配中等膨胀差，主裂斜穿交错，纹内微渗茶褐。' };
    return { name: '传世哥窑（金丝铁线 / 百圾碎）', desc: '强应力先爆粗黑铁线，随后亚临界细裂吸附茶黄成金丝。' };
}

function drawCrackleCanvas() {
    const canvas = document.getElementById('crackle-sim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.43;

    ctx.clearRect(0, 0, w, h);

    // 圆形瓷片试样底座
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    const grad = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, 12, cx, cy, R);
    grad.addColorStop(0, '#eef5f7');
    grad.addColorStop(0.22, state.glazeHex);
    grad.addColorStop(1, '#26383e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 根据 Δα 与釉厚计算主裂与次裂密度
    const densityFactor = Math.max(0, state.deltaAlpha - 0.35) * (0.7 + state.thickness * 0.35);
    const primaryN = Math.min(90, Math.round(densityFactor * 22));
    const secondaryN = Math.min(180, Math.round(densityFactor * (state.coolRate / 28) * 18));

    const rand = seeded(10802);
    const drawVoronoiNet = (ptsCount, strokeStyle, lineWidth, limitRatio) => {
        if (ptsCount < 3 || limitRatio <= 0.02) return;
        const pts = [];
        for (let i = 0; i < ptsCount; i++) {
            pts.push({ x: cx - R + rand() * R * 2, y: cy - R + rand() * R * 2 });
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        const maxDraw = Math.floor(pts.length * limitRatio);
        for (let i = 0; i < maxDraw; i++) {
            // 连接最近邻域生成多边形网裂近似
            const dists = [];
            for (let j = i + 1; j < pts.length; j++) {
                const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
                if (d < (R * 3.1) / Math.sqrt(ptsCount)) dists.push([j, d]);
            }
            dists.sort((a, b) => a[1] - b[1]);
            for (const [j] of dists.slice(0, 3)) {
                const mx = (pts[i].x + pts[j].x) * 0.5 + (rand() - 0.5) * 10;
                const my = (pts[i].y + pts[j].y) * 0.5 + (rand() - 0.5) * 10;
                ctx.beginPath();
                ctx.moveTo(pts[i].x, pts[i].y);
                ctx.quadraticCurveTo(mx, my, pts[j].x, pts[j].y);
                ctx.stroke();
            }
        }
    };

    const inkAlpha = state.staining === 'none' ? 0.14 : (state.staining === 'subtle' ? 0.25 : 0.65);
    const goldAlpha = state.staining === 'ink-tea' ? 0.55 : (state.staining === 'tea' ? 0.32 : 0.15);
    drawVoronoiNet(primaryN, `rgba(38, 28, 22, ${inkAlpha})`, 1.6, Math.min(1, state.progress * 1.3));
    if (state.progress > 0.35) {
        drawVoronoiNet(secondaryN, `rgba(176, 128, 56, ${goldAlpha})`, 0.9, (state.progress - 0.35) / 0.65);
    }

    // 镜面玻璃清漆高光
    const shine = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.38, 4, cx - R * 0.38, cy - R * 0.38, R * 0.45);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 紫口/铁胎试片外缘圈
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3c2e28';
    ctx.stroke();

    const analogy = nearestKilnAnalogy();
    const outTitle = document.getElementById('crackle-analogy-name');
    const outDesc = document.getElementById('crackle-analogy-desc');
    if (outTitle) outTitle.textContent = analogy.name;
    if (outDesc) outDesc.textContent = analogy.desc;
}

function playGrowthAnimation() {
    clearInterval(animTimer);
    state.progress = 0.08;
    playIceCrackAudio(4);
    animTimer = setInterval(() => {
        state.progress = Math.min(1, state.progress + 0.12);
        drawCrackleCanvas();
        if (state.progress >= 1) clearInterval(animTimer);
    }, 85);
}

function exportCrackleCard() {
    const sim = document.getElementById('crackle-sim-canvas');
    if (!sim) return;
    const out = document.createElement('canvas');
    out.width = 900;
    out.height = 500;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#F4F1E8';
    ctx.fillRect(0, 0, 900, 500);
    ctx.strokeStyle = '#3A7684';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 860, 460);
    ctx.drawImage(sim, 50, 95, 310, 310);

    const analogy = nearestKilnAnalogy();
    ctx.fillStyle = '#142029';
    ctx.font = 'bold 26px "Noto Serif SC", serif';
    ctx.fillText('天青泥火 · 我的开片标本卡', 395, 105);
    ctx.fillStyle = '#224E59';
    ctx.font = 'bold 20px "Noto Serif SC", serif';
    ctx.fillText(`类比窑口：${analogy.name}`, 395, 165);
    ctx.fillStyle = '#3E4E5C';
    ctx.font = '15px monospace';
    ctx.fillText(`Δα = ${state.deltaAlpha.toFixed(1)} ×10⁻⁶ K⁻¹ · 釉厚 ${state.thickness.toFixed(1)} mm · 冷速 ${state.coolRate}`, 395, 210);
    ctx.font = '14px "Noto Serif SC", serif';
    ctx.fillText(analogy.desc, 395, 260, 450);
    ctx.fillStyle = '#6E808F';
    ctx.font = '12px sans-serif';
    ctx.fillText('注：教学简化断裂力学模型（Kingery & Vandiver 1986；李家治 1998）', 395, 380);

    ctx.fillStyle = '#A8322D';
    ctx.fillRect(780, 375, 68, 68);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Noto Serif SC", serif';
    ctx.fillText('开片', 796, 405);
    ctx.fillText('标本', 796, 429);

    const a = document.createElement('a');
    a.download = `天青泥火_开片标本卡_${Date.now()}.png`;
    a.href = out.toDataURL('image/png');
    a.click();
    bus.emit('study:crackle-complete', { kiln: analogy.name });
    toast.show('已导出《我的开片标本卡》并点亮研学护照印章');
}

function render() {
    const mount = document.getElementById('crackle-lab-mount');
    if (!mount) return;
    cfg = data.get('crackle-lab');
    setHTML(
        mount,
        html`
        <div class="feature-card p-6 sm:p-8 space-y-6">
            <div class="flex flex-wrap gap-2">
                ${cfg.presets.map((p) => html`
                    <button type="button" class="lab-pill" data-crackle-preset="${p.id}" data-action="applyCracklePreset('${p.id}')">${p.name}</button>
                `)}
            </div>

            <div class="lab-grid">
                <div class="lab-canvas-box p-4 flex flex-col items-center">
                    <canvas id="crackle-sim-canvas" width="380" height="380" aria-label="瓷釉开片过程模拟画布"></canvas>
                    <p class="text-[11px] text-white/75 mt-2 font-serif-cn">实时渲染：一级铁线主裂 + 二级金丝次裂</p>
                </div>

                <div class="space-y-4 text-left">
                    <div class="p-3.5 rounded-xl bg-bg-main border border-border-light space-y-1.5 text-xs">
                        <div class="flex justify-between font-serif-cn">
                            <span>① 胎釉热膨胀系数差 Δα (×10⁻⁶ K⁻¹)</span>
                            <strong id="crackle-da-val" class="font-mono text-tianqing-deep">${state.deltaAlpha.toFixed(1)}</strong>
                        </div>
                        <input id="crackle-da-slider" type="range" min="0.2" max="3.0" step="0.1" value="${state.deltaAlpha}" data-action-input="updateCrackleSim()" class="w-full" aria-label="胎釉热膨胀系数差">
                    </div>

                    <div class="p-3.5 rounded-xl bg-bg-main border border-border-light space-y-1.5 text-xs">
                        <div class="flex justify-between font-serif-cn">
                            <span>② 施釉厚度 (mm)</span>
                            <strong id="crackle-th-val" class="font-mono text-tianqing-deep">${state.thickness.toFixed(1)} mm</strong>
                        </div>
                        <input id="crackle-th-slider" type="range" min="0.4" max="2.4" step="0.1" value="${state.thickness}" data-action-input="updateCrackleSim()" class="w-full" aria-label="施釉厚度">
                    </div>

                    <div class="p-3.5 rounded-xl bg-bg-main border border-border-light space-y-1.5 text-xs">
                        <div class="flex justify-between font-serif-cn">
                            <span>③ 降温速率 / 应力腐蚀强度</span>
                            <strong id="crackle-cool-val" class="font-mono text-amber-400">${state.coolRate}</strong>
                        </div>
                        <input id="crackle-cool-slider" type="range" min="15" max="100" step="5" value="${state.coolRate}" data-action-input="updateCrackleSim()" class="w-full" aria-label="降温速率">
                    </div>

                    <div class="p-4 rounded-xl bg-yuebai/50 border border-border-light space-y-1.5">
                        <div class="text-[11px] text-text-muted">当前参数最接近的窑口特征</div>
                        <h4 id="crackle-analogy-name" class="text-base font-serif-cn font-semibold text-text-title"></h4>
                        <p id="crackle-analogy-desc" class="text-xs text-text-body leading-relaxed"></p>
                    </div>

                    <div class="flex flex-wrap gap-2.5">
                        <button type="button" class="btn btn--primary text-xs" data-action="animateCrackleGrowth()">
                            <i class="fa-solid fa-snowflake" aria-hidden="true"></i>
                            <span>模拟开片生长与冰裂声</span>
                        </button>
                        <button type="button" class="btn btn--ghost text-xs" data-action="exportCrackleCard()">
                            <i class="fa-solid fa-download" aria-hidden="true"></i>
                            <span>生成我的开片标本卡</span>
                        </button>
                    </div>

                    <p class="text-[11px] text-text-muted leading-relaxed pt-2 border-t border-border-light">${cfg.disclaimer.zh}</p>
                </div>
            </div>
        </div>`
    );
    drawCrackleCanvas();
}

export default defineModule({
    id: 'crackle-lab',
    phase: 3,
    init() {
        render();
    },
    destroy() {
        clearInterval(animTimer);
        const mount = document.getElementById('crackle-lab-mount');
        if (mount) setHTML(mount, '');
    },
    actions: {
        applyCracklePreset(_ctx, id) {
            const p = (cfg.presets || []).find((x) => x.id === id);
            if (!p) return;
            state = { ...state, deltaAlpha: p.deltaAlpha, thickness: p.thickness, coolRate: p.coolRate, staining: p.staining, glazeHex: p.glazeHex, progress: 1.0 };
            const s1 = document.getElementById('crackle-da-slider');
            const s2 = document.getElementById('crackle-th-slider');
            const s3 = document.getElementById('crackle-cool-slider');
            if (s1) s1.value = p.deltaAlpha;
            if (s2) s2.value = p.thickness;
            if (s3) s3.value = p.coolRate;
            document.getElementById('crackle-da-val').textContent = p.deltaAlpha.toFixed(1);
            document.getElementById('crackle-th-val').textContent = `${p.thickness.toFixed(1)} mm`;
            document.getElementById('crackle-cool-val').textContent = String(p.coolRate);
            document.querySelectorAll('[data-crackle-preset]').forEach((b) => b.classList.toggle('is-active', b.dataset.cracklePreset === id));
            playGrowthAnimation();
        },
        updateCrackleSim() {
            const s1 = document.getElementById('crackle-da-slider');
            const s2 = document.getElementById('crackle-th-slider');
            const s3 = document.getElementById('crackle-cool-slider');
            if (s1) state.deltaAlpha = parseFloat(s1.value);
            if (s2) state.thickness = parseFloat(s2.value);
            if (s3) state.coolRate = parseInt(s3.value, 10);
            document.getElementById('crackle-da-val').textContent = state.deltaAlpha.toFixed(1);
            document.getElementById('crackle-th-val').textContent = `${state.thickness.toFixed(1)} mm`;
            document.getElementById('crackle-cool-val').textContent = String(state.coolRate);
            state.progress = 1.0;
            drawCrackleCanvas();
        },
        animateCrackleGrowth: playGrowthAnimation,
        exportCrackleCard
    }
});
