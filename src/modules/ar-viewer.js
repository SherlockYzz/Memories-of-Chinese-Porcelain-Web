/**
 * 模块：AR 看瓷 / 桌面 1:1 实尺预览台 (ar-viewer)
 * 优先检测设备 WebXR (`immersive-ar`) 支持；桌面及不支持设备自动降级为
 * “1:1 桌面实尺参照物比例台”（与手机 15 cm、茶盏 7 cm、30 cm 标尺同台比较，可切换案面并导出分享图）。
 */
import { defineModule, data, modal, toast, bus, html, setHTML } from '@core';

let modalEl = null;
let bgMode = 'wood'; // 'wood' | 'stone' | 'linen'
let refItem = 'phone'; // 'phone' | 'cup' | 'ruler'
let xrSupported = false;
let currentVesselIdx = 0;

function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'ar-viewer-modal';
    modalEl.className = 'modal-backdrop';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'ar-viewer-title');
    modalEl.setAttribute('data-action-self', 'closeArViewer()');
    document.body.appendChild(modalEl);
    modal.registerCloser('ar-viewer-modal', closeArViewer);
    return modalEl;
}

function parseHeightCm(v) {
    const m = /(?:通?高)\s*([\d.]+)\s*cm/.exec((v && v.dimensions) || '');
    return m ? parseFloat(m[1]) : 22.8;
}

function drawPreview() {
    const c = document.getElementById('ar-scale-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width;
    const h = c.height;
    const vessels = data.get('vessels');
    const v = vessels[currentVesselIdx] || vessels[0];
    const hCm = parseHeightCm(v);

    // 桌面背景
    const bgs = {
        wood: ['#3d271c', '#24140d'],
        stone: ['#2a333b', '#14191e'],
        linen: ['#dfd7c8', '#c6bcab']
    };
    const pal = bgs[bgMode] || bgs.wood;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal[0]);
    g.addColorStop(1, pal[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 透视桌面线
    const baseY = h - 76;
    ctx.strokeStyle = bgMode === 'linen' ? 'rgba(20,32,41,0.22)' : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24, baseY);
    ctx.lineTo(w - 24, baseY);
    ctx.stroke();

    // 统一比例尺：假设画面高度容下 48 cm
    const pxPerCm = (baseY - 56) / 46;
    const vesselPxH = Math.max(48, hCm * pxPerCm);
    const vesselW = vesselPxH * 0.48;
    const vx = w * 0.38;

    // 器物剪影与釉色渐变
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(vx, baseY + 4, vesselW * 0.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    const vg = ctx.createLinearGradient(vx - vesselW * 0.5, baseY - vesselPxH, vx + vesselW * 0.5, baseY);
    vg.addColorStop(0, '#9cc0c7');
    vg.addColorStop(0.5, '#68939c');
    vg.addColorStop(1, '#37545b');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.moveTo(vx - vesselW * 0.28, baseY);
    ctx.bezierCurveTo(vx - vesselW * 0.6, baseY - vesselPxH * 0.42, vx - vesselW * 0.24, baseY - vesselPxH * 0.72, vx - vesselW * 0.24, baseY - vesselPxH);
    ctx.lineTo(vx + vesselW * 0.24, baseY - vesselPxH);
    ctx.bezierCurveTo(vx + vesselW * 0.24, baseY - vesselPxH * 0.72, vx + vesselW * 0.6, baseY - vesselPxH * 0.42, vx + vesselW * 0.28, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 高度标尺线
    const textCol = bgMode === 'linen' ? '#142029' : '#f2f6f9';
    ctx.strokeStyle = '#d6b16a';
    ctx.fillStyle = '#d6b16a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vx - vesselW * 0.75, baseY);
    ctx.lineTo(vx - vesselW * 0.75, baseY - vesselPxH);
    ctx.stroke();
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${hCm} cm`, vx - vesselW * 0.75 - 56, baseY - vesselPxH * 0.5);

    // 右侧实尺参照物
    const rx = w * 0.73;
    ctx.fillStyle = textCol;
    if (refItem === 'phone') {
        const ph = 15.0 * pxPerCm;
        const pw = 7.2 * pxPerCm;
        ctx.fillStyle = '#1b242c';
        ctx.strokeStyle = '#9aa8b4';
        ctx.fillRect(rx - pw / 2, baseY - ph, pw, ph);
        ctx.strokeRect(rx - pw / 2, baseY - ph, pw, ph);
        ctx.fillStyle = textCol;
        ctx.font = '12px sans-serif';
        ctx.fillText('智能手机 (高 15 cm)', rx - 52, baseY + 24);
    } else if (refItem === 'cup') {
        const ch = 6.8 * pxPerCm;
        const cw = 11.5 * pxPerCm;
        ctx.fillStyle = '#2d2420';
        ctx.beginPath();
        ctx.moveTo(rx - cw * 0.5, baseY - ch);
        ctx.lineTo(rx + cw * 0.5, baseY - ch);
        ctx.lineTo(rx + cw * 0.25, baseY);
        ctx.lineTo(rx - cw * 0.25, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = textCol;
        ctx.font = '12px sans-serif';
        ctx.fillText('宋代茶盏 (口径 11.5 cm)', rx - 62, baseY + 24);
    } else {
        const rh = 30.0 * pxPerCm;
        ctx.fillStyle = '#d6b16a';
        ctx.fillRect(rx - 14, baseY - rh, 28, rh);
        ctx.fillStyle = textCol;
        ctx.font = '12px sans-serif';
        ctx.fillText('30 cm 标准米尺', rx - 44, baseY + 24);
    }

    ctx.fillStyle = textCol;
    ctx.font = 'bold 15px "Noto Serif SC", serif';
    ctx.fillText(v.name, 26, 32);
    ctx.font = '12px monospace';
    ctx.fillText(`${v.dimensions} (${v.dimensionsBasis === 'illustrative' ? '教学参考尺度' : '资产标称'})`, 26, 52);
}

function renderModal() {
    const host = ensureModal();
    const vessels = data.get('vessels');
    setHTML(
        host,
        html`
        <div class="modal-content-lg max-w-3xl text-left space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-border-light">
                <div>
                    <h3 id="ar-viewer-title" class="font-serif-cn text-lg font-semibold text-text-title">
                        <i class="fa-solid fa-vr-cardboard text-tianqing-deep mr-1.5" aria-hidden="true"></i>
                        <span>AR 看瓷 / 桌面 1:1 实尺比例台</span>
                    </h3>
                    <p class="text-[11px] text-text-muted">${xrSupported ? '检测到本设备支持 WebXR AR 空间放置。' : '当前浏览器不支持 WebXR AR，已启用“桌面 1:1 实尺比例对照”降级模式。'}</p>
                </div>
                <button type="button" data-action="closeArViewer()" class="w-8 h-8 rounded-full hover:bg-yuebai flex items-center justify-center" aria-label="关闭实尺预览">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <select id="ar-vessel-select" data-action-change="setArVessel($number)" aria-label="选择实尺预览器物" class="px-3 py-1.5 rounded-lg bg-bg-main border border-border-light text-text-title font-serif-cn">
                    ${vessels.map((v, i) => html`<option value="${i}" ${i === currentVesselIdx ? 'selected' : ''}>${v.name}</option>`)}
                </select>
                <div class="flex flex-wrap gap-1.5">
                    <button type="button" class="lab-pill ${refItem === 'phone' ? 'is-active' : ''}" data-action="setArRef('phone')">手机 15cm</button>
                    <button type="button" class="lab-pill ${refItem === 'cup' ? 'is-active' : ''}" data-action="setArRef('cup')">茶盏 6.8cm</button>
                    <button type="button" class="lab-pill ${refItem === 'ruler' ? 'is-active' : ''}" data-action="setArRef('ruler')">标尺 30cm</button>
                    <button type="button" class="lab-pill" data-action="cycleArBg()">切换桌案背景</button>
                </div>
            </div>

            <canvas id="ar-scale-canvas" width="760" height="420" class="ar-stage-canvas"></canvas>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-light">
                <span class="text-[11px] text-text-muted">按器物标注通高与日常物品同比例并列，方便直观感受实物大小。</span>
                <button type="button" class="btn btn--primary text-xs" data-action="exportArPoster()">
                    <i class="fa-solid fa-camera" aria-hidden="true"></i>
                    <span>保存 1:1 实尺对比海报</span>
                </button>
            </div>
        </div>`
    );
    drawPreview();
}

async function openArViewer() {
    xrSupported = !!(navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)));
    renderModal();
    modal.open(modalEl, '#ar-vessel-select');
}

function closeArViewer() {
    if (modalEl) modal.close(modalEl);
}

function exportPoster() {
    const c = document.getElementById('ar-scale-canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.download = `天青泥火_实尺对比海报_${Date.now()}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
    toast.show('已保存《1:1 实尺对比海报》');
}

export default defineModule({
    id: 'ar-viewer',
    phase: 3,
    init(ctx) {
        ctx.subscribe('model:selected', (p) => {
            if (p && typeof p.index === 'number') currentVesselIdx = p.index;
        });
    },
    destroy() {
        if (modalEl) modalEl.remove();
        modalEl = null;
    },
    actions: {
        openArViewer,
        closeArViewer,
        setArVessel(_ctx, idx) {
            currentVesselIdx = Number(idx) || 0;
            drawPreview();
        },
        setArRef(_ctx, key) {
            refItem = key;
            renderModal();
        },
        cycleArBg() {
            const order = ['wood', 'stone', 'linen'];
            bgMode = order[(order.indexOf(bgMode) + 1) % order.length];
            drawPreview();
        },
        exportArPoster: exportPoster
    }
});
