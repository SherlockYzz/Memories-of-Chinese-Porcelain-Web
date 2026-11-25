/**
 * 模块：金缮修复小游戏 (kintsugi-game)
 * 阶段 1：拖动或点击碎片吸附拼回原位（带“一键对位辅助”无障碍降级）；
 * 阶段 2：选择金粉/银泥/朱漆沿着裂隙描金涂绘；
 * 完成态：导出《金缮修复完工证书》PNG 并点亮研学护照印章。
 */
import { defineModule, data, bus, toast, html, setHTML } from '@core';

let cfg = null;
let vesselIdx = 0;
let finishIdx = 0;
let stage = 'assemble'; // 'assemble' | 'gild' | 'done'
let shards = [];
let seams = [];
let activeDragId = -1;
let dragOffX = 0;
let dragOffY = 0;
let gildedSeamCount = 0;

function makeJaggedPath(x1, y1, x2, y2, seed) {
    const pts = [[x1, y1]];
    const segs = 5;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const jitter = Math.sin(seed * 7.3 + i * 2.9) * 5.2;
        pts.push([x1 + dx * t + nx * jitter, y1 + dy * t + ny * jitter]);
    }
    pts.push([x2, y2]);
    return pts;
}

function initVesselPuzzle() {
    stage = 'assemble';
    gildedSeamCount = 0;
    const cx = 230;
    const cy = 175;
    // 四块关键碎片初始打散在画布四角附近，目标均在中心点 (0, 0) 偏移
    shards = [
        { id: 0, label: '口沿残片', dx: -115, dy: -72, poly: [[-48, -95], [48, -95], [38, -28], [-35, -35]], fixed: false },
        { id: 1, label: '左腹瓷片', dx: -128, dy: 45, poly: [[-35, -35], [5, -30], [-6, 52], [-72, 34]], fixed: false },
        { id: 2, label: '右腹瓷片', dx: 118, dy: -36, poly: [[5, -30], [38, -28], [72, 32], [-6, 52]], fixed: false },
        { id: 3, label: '圈足底片', dx: 108, dy: 76, poly: [[-72, 34], [-6, 52], [72, 32], [44, 102], [-44, 102]], fixed: false }
    ].map((s) => ({ ...s, tx: cx, ty: cy }));

    seams = [
        { x1: cx - 35, y1: cy - 35, x2: cx + 38, y2: cy - 28, gilded: false },
        { x1: cx + 5, y1: cy - 30, x2: cx - 6, y2: cy + 52, gilded: false },
        { x1: cx - 72, y1: cy + 34, x2: cx - 6, y2: cy + 52, gilded: false },
        { x1: cx - 6, y1: cy + 52, x2: cx + 72, y2: cy + 32, gilded: false }
    ].map((sm, idx) => ({ ...sm, pts: makeJaggedPath(sm.x1, sm.y1, sm.x2, sm.y2, idx + 1) }));
    drawKintsugi();
    syncStatus();
}

function drawShard(ctx, s, vessel) {
    ctx.save();
    ctx.translate(s.tx + s.dx, s.ty + s.dy);
    ctx.beginPath();
    s.poly.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();

    const g = ctx.createLinearGradient(-70, -90, 70, 90);
    g.addColorStop(0, vessel.rimHex);
    g.addColorStop(0.5, vessel.bodyHex);
    g.addColorStop(1, vessel.footHex);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = s.fixed ? 1.4 : 2.2;
    ctx.strokeStyle = s.fixed ? 'rgba(24, 34, 42, 0.42)' : '#e6c173';
    ctx.stroke();

    // 瓷片微光高光线增加立体厚重感
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function drawKintsugi() {
    const canvas = document.getElementById('kintsugi-canvas');
    if (!canvas || !cfg) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const vessel = cfg.vessels[vesselIdx] || cfg.vessels[0];
    const fin = cfg.finishes[finishIdx] || cfg.finishes[0];

    ctx.clearRect(0, 0, w, h);

    // 淡灰器型底图虚影（拼合对照基准）
    ctx.save();
    ctx.translate(230, 175);
    ctx.strokeStyle = 'rgba(200, 162, 90, 0.35)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-48, -95); ctx.lineTo(48, -95); ctx.lineTo(38, -28); ctx.lineTo(72, 32);
    ctx.lineTo(44, 102); ctx.lineTo(-44, 102); ctx.lineTo(-72, 34); ctx.lineTo(-35, -35);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 绘制碎片（未定位的在顶层）
    shards.filter((s) => s.fixed).forEach((s) => drawShard(ctx, s, vessel));
    shards.filter((s) => !s.fixed).forEach((s) => drawShard(ctx, s, vessel));

    // 绘制自然折线大漆金缮描金线与洒金微粒
    if (stage === 'gild' || stage === 'done') {
        seams.forEach((sm, idx) => {
            const pts = sm.pts || [[sm.x1, sm.y1], [sm.x2, sm.y2]];
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));

            if (sm.gilded) {
                // 先绘深褐色大漆底衬，再覆流金金属光芒与细碎洒金微粒
                ctx.strokeStyle = 'rgba(72, 38, 18, 0.72)';
                ctx.lineWidth = 6.2;
                ctx.stroke();

                ctx.shadowColor = fin.glow;
                ctx.shadowBlur = 9;
                ctx.strokeStyle = fin.color;
                ctx.lineWidth = 3.6;
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff5cf';
                pts.forEach(([px, py], pi) => {
                    if (pi === 0 || pi === pts.length - 1) return;
                    ctx.beginPath();
                    ctx.arc(px + ((idx + pi) % 2 ? 1.8 : -1.8), py - 1.2, 1.4, 0, Math.PI * 2);
                    ctx.fill();
                });
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 2.4;
                ctx.stroke();
            }
            ctx.restore();
        });
    }
}

function syncStatus() {
    const fixedCount = shards.filter((s) => s.fixed).length;
    const statusEl = document.getElementById('kintsugi-stage-status');
    const hintEl = document.getElementById('kintsugi-hint');
    if (stage === 'assemble') {
        if (statusEl) statusEl.textContent = `第一步：拼合瓷片 (${fixedCount} / ${shards.length})`;
        if (hintEl) hintEl.textContent = '拖动碎片至虚线轮廓中心，松手自动吸附；或点“辅助归位”依次拼合。';
        if (fixedCount === shards.length) {
            stage = 'gild';
            drawKintsugi();
            syncStatus();
            toast.show('瓷片已严丝合缝！请点击或沿白色虚线裂隙涂绘大漆金粉。');
        }
    } else if (stage === 'gild') {
        gildedSeamCount = seams.filter((s) => s.gilded).length;
        if (statusEl) statusEl.textContent = `第二步：大漆描金 (${gildedSeamCount} / ${seams.length} 道裂隙)`;
        if (hintEl) hintEl.textContent = '在画布上沿虚线裂隙滑动或点击涂抹金漆；也可点“一键描金”快速体验。';
        if (gildedSeamCount === seams.length) {
            stage = 'done';
            drawKintsugi();
            syncStatus();
            bus.emit('study:kintsugi-complete', { vessel: cfg.vessels[vesselIdx].name, finish: cfg.finishes[finishIdx].name });
            toast.show('金缮修复完工！可导出修复证书并点亮研学护照印章。');
        }
    } else {
        if (statusEl) statusEl.textContent = '修复完工 · 器韵再生';
        if (hintEl) hintEl.textContent = '“残缺之处以金缮补之，反成独一无二之器纹。” 可下载完工证书留念。';
    }
}

function ptDistToSeg(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function bindCanvasEvents(ctxMod) {
    const canvas = document.getElementById('kintsugi-canvas');
    if (!canvas) return;
    const toLocal = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    };

    ctxMod.listen(canvas, 'pointerdown', (e) => {
        const pt = toLocal(e);
        if (stage === 'assemble') {
            for (let i = shards.length - 1; i >= 0; i--) {
                const s = shards[i];
                if (s.fixed) continue;
                const cx = s.tx + s.dx;
                const cy = s.ty + s.dy;
                if (Math.hypot(pt.x - cx, pt.y - cy) < 62) {
                    activeDragId = s.id;
                    dragOffX = pt.x - s.dx;
                    dragOffY = pt.y - s.dy;
                    canvas.setPointerCapture(e.pointerId);
                    break;
                }
            }
        } else if (stage === 'gild') {
            seams.forEach((sm) => {
                if (ptDistToSeg(pt.x, pt.y, sm.x1, sm.y1, sm.x2, sm.y2) < 28) sm.gilded = true;
            });
            drawKintsugi();
            syncStatus();
        }
    });

    ctxMod.listen(canvas, 'pointermove', (e) => {
        const pt = toLocal(e);
        if (stage === 'assemble' && activeDragId >= 0) {
            const s = shards.find((x) => x.id === activeDragId);
            if (!s) return;
            s.dx = pt.x - dragOffX;
            s.dy = pt.y - dragOffY;
            if (Math.hypot(s.dx, s.dy) < 28) {
                s.dx = 0;
                s.dy = 0;
                s.fixed = true;
                activeDragId = -1;
            }
            drawKintsugi();
            syncStatus();
        } else if (stage === 'gild' && e.buttons > 0) {
            seams.forEach((sm) => {
                if (ptDistToSeg(pt.x, pt.y, sm.x1, sm.y1, sm.x2, sm.y2) < 28) sm.gilded = true;
            });
            drawKintsugi();
            syncStatus();
        }
    });

    ctxMod.listen(canvas, 'pointerup', () => {
        activeDragId = -1;
    });
}

function exportCertificate() {
    const canvas = document.getElementById('kintsugi-canvas');
    if (!canvas) return;
    const v = cfg.vessels[vesselIdx];
    const f = cfg.finishes[finishIdx];
    const out = document.createElement('canvas');
    out.width = 900;
    out.height = 500;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#F4F1E8';
    ctx.fillRect(0, 0, 900, 500);
    ctx.strokeStyle = '#C8A25A';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 860, 460);

    ctx.fillStyle = '#121c22';
    ctx.fillRect(48, 80, 360, 340);
    ctx.drawImage(canvas, 48, 80, 360, 340);

    ctx.fillStyle = '#142029';
    ctx.font = 'bold 26px "Noto Serif SC", serif';
    ctx.fillText('天青泥火 · 金缮修复完工证书', 440, 115);
    ctx.fillStyle = '#224E59';
    ctx.font = 'bold 20px "Noto Serif SC", serif';
    ctx.fillText(`修复器物：${v.name}`, 440, 175);
    ctx.fillStyle = '#3E4E5C';
    ctx.font = '16px "Noto Serif SC", serif';
    ctx.fillText(`缮饰工艺：${f.name}`, 440, 220);
    ctx.fillText(`拼合碎片：${shards.filter((s) => s.fixed).length} / ${shards.length} 片`, 440, 260);
    ctx.fillText(`修复日期：${new Date().toLocaleDateString()}`, 440, 300);

    ctx.fillStyle = '#A8322D';
    ctx.fillRect(770, 375, 70, 70);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Noto Serif SC", serif';
    ctx.fillText('金缮', 787, 405);
    ctx.fillText('合璧', 787, 429);

    const a = document.createElement('a');
    a.download = `天青泥火_金缮修复证书_${Date.now()}.png`;
    a.href = out.toDataURL('image/png');
    a.click();
    toast.show('已下载《金缮修复完工证书》');
}

function render(ctxMod) {
    const mount = document.getElementById('kintsugi-game-mount');
    if (!mount) return;
    cfg = data.get('kintsugi');
    setHTML(
        mount,
        html`
        <div class="feature-card p-6 sm:p-8 space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-light">
                <div class="flex flex-wrap gap-2">
                    ${cfg.vessels.map((v, i) => html`
                        <button type="button" class="lab-pill ${i === vesselIdx ? 'is-active' : ''}" data-action="selectKintsugiVessel(${i})">${v.name}</button>
                    `)}
                </div>
                <span id="kintsugi-stage-status" class="badge bg-tianqing-deep text-white text-xs"></span>
            </div>

            <div class="lab-grid">
                <div class="lab-canvas-box p-3">
                    <canvas id="kintsugi-canvas" width="460" height="350" style="touch-action: none;" aria-label="金缮拼合与描金交互画布"></canvas>
                </div>

                <div class="space-y-4 text-left">
                    <div>
                        <h4 class="text-xs font-serif-cn font-semibold text-text-title mb-2">选择大漆与缮饰材料</h4>
                        <div class="flex flex-wrap gap-2">
                            ${cfg.finishes.map((f, i) => html`
                                <button type="button" class="lab-pill ${i === finishIdx ? 'is-active' : ''}" data-action="selectKintsugiFinish(${i})">
                                    <span class="w-3 h-3 rounded-full inline-block border border-white/40" style="background:${f.color}"></span>
                                    <span>${f.name}</span>
                                </button>
                            `)}
                        </div>
                    </div>

                    <div class="p-4 rounded-xl bg-bg-main border border-border-light space-y-1.5">
                        <div class="text-xs font-serif-cn font-semibold text-tianqing-deep">操作指引</div>
                        <p id="kintsugi-hint" class="text-xs text-text-body leading-relaxed"></p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <button type="button" class="btn btn--primary text-xs" data-action="assistKintsugiStep()">
                            <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
                            <span>辅助对位 / 描金</span>
                        </button>
                        <button type="button" class="btn btn--ghost text-xs" data-action="exportKintsugiCert()">
                            <i class="fa-solid fa-stamp" aria-hidden="true"></i>
                            <span>生成金缮完工证书</span>
                        </button>
                        <button type="button" class="lab-pill" data-action="resetKintsugiGame()">重新破器重修</button>
                    </div>

                    <p class="text-[11px] text-text-muted pt-2 border-t border-border-light">${cfg.reference}</p>
                </div>
            </div>
        </div>`
    );
    initVesselPuzzle();
    bindCanvasEvents(ctxMod);
}

let savedCtx = null;

export default defineModule({
    id: 'kintsugi-game',
    phase: 3,
    init(ctxMod) {
        savedCtx = ctxMod;
        render(ctxMod);
    },
    destroy() {
        const mount = document.getElementById('kintsugi-game-mount');
        if (mount) setHTML(mount, '');
        savedCtx = null;
    },
    actions: {
        selectKintsugiVessel(_ctx, idx) {
            vesselIdx = Number(idx) || 0;
            if (savedCtx) render(savedCtx);
        },
        selectKintsugiFinish(_ctx, idx) {
            finishIdx = Number(idx) || 0;
            document.querySelectorAll('[data-action^="selectKintsugiFinish"]').forEach((b, i) => b.classList.toggle('is-active', i === finishIdx));
            drawKintsugi();
        },
        assistKintsugiStep() {
            if (stage === 'assemble') {
                const next = shards.find((s) => !s.fixed);
                if (next) {
                    next.dx = 0;
                    next.dy = 0;
                    next.fixed = true;
                }
            } else if (stage === 'gild') {
                seams.forEach((s) => (s.gilded = true));
            }
            drawKintsugi();
            syncStatus();
        },
        resetKintsugiGame: initVesselPuzzle,
        exportKintsugiCert: exportCertificate
    }
});
