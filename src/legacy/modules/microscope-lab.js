/**
 * 模块：宋明御瓷 100x 光学显微镜物理晶相与景深调焦引擎 (microscope-lab)
 */
(function (global) {
    'use strict';

    let currentMicroPreset = 'guan';
    let currentMicroFocus = 100;
    let microLightMode = 'bright';
    let showMicrometerReticle = true;
    let microPanOffset = { x: 0, y: 0 };
    let isMicroPanning = false;
    let microPanStart = { x: 0, y: 0 };
    const microSeedParticles = {};

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function initMicroscopeParticles(preset) {
        if (microSeedParticles[preset.id]) return microSeedParticles[preset.id];
        const rng = (seed) => {
            let s = seed % 2147483647;
            if (s <= 0) s += 2147483646;
            return () => (s = s * 16807 % 2147483647) / 2147483647;
        };
        const rand = rng(preset.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 101));

        const particles = [];
        const layers = preset.layers || {
            surface: { count: 8, sizeRange: [20, 40], deadRate: 0.2 },
            middle: { count: 20, sizeRange: [10, 20], deadRate: 0.1 },
            deep: { count: 35, sizeRange: [4, 10], deadRate: 0.0 }
        };

        for (let i = 0; i < layers.surface.count; i++) {
            particles.push({
                x: rand() * 0.76 + 0.12, y: rand() * 0.76 + 0.12,
                r: (rand() * (layers.surface.sizeRange[1] - layers.surface.sizeRange[0]) + layers.surface.sizeRange[0]) * 0.5,
                depth: rand() * 35 + 10, isDead: rand() < layers.surface.deadRate, phase: rand() * Math.PI * 2
            });
        }
        for (let i = 0; i < layers.middle.count; i++) {
            particles.push({
                x: rand() * 0.82 + 0.09, y: rand() * 0.82 + 0.09,
                r: (rand() * (layers.middle.sizeRange[1] - layers.middle.sizeRange[0]) + layers.middle.sizeRange[0]) * 0.5,
                depth: rand() * 40 + 55, isDead: rand() < layers.middle.deadRate, phase: rand() * Math.PI * 2
            });
        }
        for (let i = 0; i < layers.deep.count; i++) {
            particles.push({
                x: rand() * 0.86 + 0.07, y: rand() * 0.86 + 0.07,
                r: (rand() * (layers.deep.sizeRange[1] - layers.deep.sizeRange[0]) + layers.deep.sizeRange[0]) * 0.5,
                depth: rand() * 40 + 105, isDead: rand() < layers.deep.deadRate, phase: rand() * Math.PI * 2
            });
        }
        microSeedParticles[preset.id] = particles;
        return particles;
    }

    function drawMicroscopeCanvas() {
        const canvas = document.getElementById('microscope-canvas');
        if (!canvas || typeof microscopePresets === 'undefined') return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const r = Math.min(w, h) * 0.49;

        ctx.clearRect(0, 0, w, h);

        const p = microscopePresets.find(item => item.id === currentMicroPreset) || microscopePresets[0];
        const particles = initMicroscopeParticles(p);
        const focalDepth = ((currentMicroFocus - 60) / 80) * 120 + 15;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        if (microLightMode === 'bright') {
            const bgGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, r);
            bgGrad.addColorStop(0, p.brightfield ? '#d8e8ea' : '#b2d5d8');
            bgGrad.addColorStop(0.65, p.baseHue || '#618b95');
            bgGrad.addColorStop(1, '#1b3238');
            ctx.fillStyle = bgGrad;
        } else {
            const bgGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
            bgGrad.addColorStop(0, '#101d22');
            bgGrad.addColorStop(0.65, '#081013');
            bgGrad.addColorStop(1, '#020406');
            ctx.fillStyle = bgGrad;
        }
        ctx.fillRect(0, 0, w, h);

        if (p.id === 'ru' || p.id === 'guan') {
            ctx.fillStyle = (microLightMode === 'bright') ? 'rgba(255, 255, 255, 0.12)' : 'rgba(120, 200, 220, 0.08)';
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                const fx = cx + Math.sin(i * 1.3) * 65 + microPanOffset.x * 0.3;
                const fy = cy + Math.cos(i * 1.1) * 65 + microPanOffset.y * 0.3;
                ctx.arc(fx, fy, 45 + i * 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (p.cracks && p.cracks.length > 0) {
            p.cracks.forEach(c => {
                ctx.save();
                ctx.beginPath();
                const x1 = c.x1 * w + microPanOffset.x * 0.6;
                const y1 = c.y1 * h + microPanOffset.y * 0.6;
                const x2 = c.x2 * w + microPanOffset.x * 0.6;
                const y2 = c.y2 * h + microPanOffset.y * 0.6;
                ctx.moveTo(x1, y1);
                const midX = (x1 + x2) / 2 + (Math.sin(c.width * 5) * 6);
                const midY = (y1 + y2) / 2 + (Math.cos(c.width * 5) * 6);
                ctx.quadraticCurveTo(midX, midY, x2, y2);
                if (microLightMode === 'bright') {
                    ctx.strokeStyle = c.gold ? 'rgba(195, 140, 50, 0.85)' : (c.heavy ? 'rgba(28, 18, 12, 0.95)' : 'rgba(55, 45, 38, 0.7)');
                } else {
                    ctx.strokeStyle = c.gold ? 'rgba(240, 190, 90, 0.95)' : (c.heavy ? 'rgba(160, 215, 230, 0.85)' : 'rgba(100, 160, 180, 0.6)');
                }
                ctx.lineWidth = c.width || 1.5;
                ctx.stroke();
                ctx.restore();
            });
        }

        const sortedParticles = [...particles].sort((a, b) => b.depth - a.depth);
        sortedParticles.forEach(pt => {
            const px = pt.x * w + microPanOffset.x;
            const py = pt.y * h + microPanOffset.y;
            const depthDelta = Math.abs(pt.depth - focalDepth);
            const blurFactor = Math.min(6.5, depthDelta * 0.12);
            const sharpness = Math.max(0.15, 1 - depthDelta * 0.028);

            ctx.save();
            ctx.beginPath();
            const drawRadius = Math.max(2, pt.r * (1 + blurFactor * 0.18));
            ctx.arc(px, py, drawRadius, 0, Math.PI * 2);

            if (pt.isDead) {
                const deadGrad = ctx.createRadialGradient(px - drawRadius * 0.2, py - drawRadius * 0.2, 1, px, py, drawRadius);
                deadGrad.addColorStop(0, 'rgba(80, 48, 28, 0.95)');
                deadGrad.addColorStop(0.7, 'rgba(42, 22, 12, 0.95)');
                deadGrad.addColorStop(1, 'rgba(15, 8, 4, 0.95)');
                ctx.fillStyle = deadGrad;
                ctx.fill();
                ctx.lineWidth = 1.2;
                ctx.strokeStyle = 'rgba(145, 95, 45, 0.8)';
                ctx.stroke();
            } else {
                if (microLightMode === 'bright') {
                    const bGrad = ctx.createRadialGradient(px - drawRadius * 0.35, py - drawRadius * 0.35, drawRadius * 0.1, px, py, drawRadius);
                    bGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.92 * sharpness).toFixed(2)})`);
                    bGrad.addColorStop(0.5, `rgba(200, 230, 235, ${(0.35 * sharpness).toFixed(2)})`);
                    bGrad.addColorStop(0.85, `rgba(30, 50, 55, ${(0.65 * sharpness).toFixed(2)})`);
                    bGrad.addColorStop(1, `rgba(15, 28, 32, ${(0.85 * sharpness).toFixed(2)})`);
                    ctx.fillStyle = bGrad;
                    ctx.fill();
                    ctx.lineWidth = Math.max(0.8, 1.6 * sharpness);
                    ctx.strokeStyle = `rgba(20, 38, 42, ${(0.75 * sharpness).toFixed(2)})`;
                    ctx.stroke();
                } else {
                    const bGrad = ctx.createRadialGradient(px - drawRadius * 0.3, py - drawRadius * 0.3, 1, px, py, drawRadius);
                    bGrad.addColorStop(0, `rgba(255, 240, 190, ${(0.95 * sharpness).toFixed(2)})`);
                    bGrad.addColorStop(0.4, `rgba(120, 200, 225, ${(0.45 * sharpness).toFixed(2)})`);
                    bGrad.addColorStop(1, 'rgba(8, 18, 24, 0.1)');
                    ctx.fillStyle = bGrad;
                    ctx.fill();
                    ctx.lineWidth = 1.4 * sharpness;
                    ctx.strokeStyle = `rgba(160, 225, 240, ${(0.85 * sharpness).toFixed(2)})`;
                    ctx.stroke();
                }
                if (sharpness > 0.65) {
                    ctx.beginPath();
                    ctx.arc(px - drawRadius * 0.35, py - drawRadius * 0.35, Math.max(1, drawRadius * 0.18), 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.fill();
                }
            }
            ctx.restore();
        });

        if (p.crystals && p.crystals.length > 0) {
            p.crystals.forEach(cr => {
                const cxPt = cr.x * w + microPanOffset.x;
                const cyPt = cr.y * h + microPanOffset.y;
                ctx.save();
                if (cr.type === 'tin_crystal') {
                    const tinGrad = ctx.createRadialGradient(cxPt, cyPt, 1, cxPt, cyPt, cr.r * 2);
                    tinGrad.addColorStop(0, '#c8d4df');
                    tinGrad.addColorStop(0.3, '#3d4b58');
                    tinGrad.addColorStop(0.7, '#151c24');
                    tinGrad.addColorStop(1, 'rgba(8, 12, 16, 0)');
                    ctx.fillStyle = tinGrad;
                    ctx.beginPath();
                    ctx.arc(cxPt, cyPt, cr.r * 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = (microLightMode === 'bright') ? 'rgba(255, 255, 255, 0.45)' : 'rgba(229, 200, 136, 0.7)';
                    ctx.beginPath();
                    ctx.arc(cxPt, cyPt, cr.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });
        }

        const ringGrad = ctx.createRadialGradient(cx, cy, r * 0.78, cx, cy, r);
        ringGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        ringGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.45)');
        ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        if (showMicrometerReticle) {
            ctx.save();
            ctx.strokeStyle = (microLightMode === 'bright') ? 'rgba(20, 35, 40, 0.38)' : 'rgba(200, 230, 240, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.85, cy);
            ctx.lineTo(cx + r * 0.85, cy);
            ctx.moveTo(cx, cy - r * 0.85);
            ctx.lineTo(cx, cy + r * 0.85);
            ctx.stroke();

            const scaleStep = (r * 0.75) / 10;
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            for (let s = -5; s <= 5; s++) {
                if (s === 0) continue;
                const sx = cx + s * scaleStep;
                const tickH = (s % 5 === 0) ? 8 : 4;
                ctx.beginPath();
                ctx.moveTo(sx, cy - tickH);
                ctx.lineTo(sx, cy + tickH);
                ctx.stroke();
                if (s === 5) ctx.fillText('+50μm', sx, cy - 10);
                else if (s === -5) ctx.fillText('-50μm', sx, cy - 10);
            }
            ctx.restore();
        }

        ctx.restore();

        ctx.strokeStyle = '#1a2228';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    function renderMicroscopeLens() {
        const descContainer = document.getElementById('microscope-desc-card');
        const tabsContainer = document.getElementById('microscope-preset-tabs');
        if (typeof microscopePresets === 'undefined') return;

        const p = microscopePresets.find(item => item.id === currentMicroPreset) || microscopePresets[0];

        if (tabsContainer) {
            tabsContainer.innerHTML = microscopePresets.map(item => `
                <button onclick="selectMicroscopePreset('${item.id}')" class="px-3 py-1 rounded-full text-xs font-serif-cn transition-all ${item.id === currentMicroPreset ? 'bg-tianqing-deep text-white shadow-sm ring-1 ring-amber-400/50' : 'bg-yuebai text-text-body hover:border-tianqing border border-transparent'}">
                    ${tr(item.name.split(' · ')[1] || item.name)}
                </button>
            `).join('');
        }

        if (descContainer) {
            descContainer.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-border-light text-[11px] text-text-muted">
                    <span><strong>【${tr('标本朝代')}】</strong>${tr(p.dynasty || '宋代')}</span>
                    <span><strong>【${tr('光学倍率')}】</strong>${p.magnification || '100x'} · ${tr('标尺')}: ${p.scaleUm}μm</span>
                </div>
                <div class="pt-1.5"><strong class="text-text-title font-medium">【${tr('微观晶相学术释义')}】</strong>：${tr(p.desc)}</div>
                <div class="pt-1.5 border-t border-border-light"><strong class="text-amber-400 font-medium">【${tr('古瓷鉴伪铁律')}】</strong>：${tr(p.authenticity)}</div>
            `;
        }

        drawMicroscopeCanvas();
    }

    function adjustMicroscopeFocus(val) {
        currentMicroFocus = parseInt(val, 10);
        const focusValText = document.getElementById('microscope-focus-value');
        if (focusValText) focusValText.textContent = `${currentMicroFocus}%`;
        drawMicroscopeCanvas();
    }

    function toggleMicroscopeLightMode() {
        microLightMode = (microLightMode === 'bright') ? 'dark' : 'bright';
        const btn = document.getElementById('btn-micro-light-mode');
        if (btn) {
            btn.innerHTML = (microLightMode === 'bright')
                ? `<i class="fa-solid fa-sun text-amber-400 mr-1" aria-hidden="true"></i>${tr('明场透射')}`
                : `<i class="fa-solid fa-moon text-tianqing-light mr-1" aria-hidden="true"></i>${tr('暗场荧光')}`;
            btn.classList.toggle('bg-tianqing-deep', microLightMode === 'dark');
            btn.classList.toggle('text-white', microLightMode === 'dark');
        }
        drawMicroscopeCanvas();
        if (global.ToastService) {
            global.ToastService.show(microLightMode === 'bright'
                ? '☀️ 已切换至【明场透射光】：观察气泡聚沫与自然破损'
                : '🌙 已切换至【暗场斜射荧光】：观察石英结晶相与苏料锡光闪烁');
        }
    }

    function toggleMicrometerReticle() {
        showMicrometerReticle = !showMicrometerReticle;
        const btn = document.getElementById('btn-micro-reticle');
        if (btn) {
            btn.classList.toggle('bg-tianqing-deep', showMicrometerReticle);
            btn.classList.toggle('text-white', showMicrometerReticle);
        }
        drawMicroscopeCanvas();
    }

    function selectMicroscopePreset(id) {
        currentMicroPreset = id;
        microPanOffset = { x: 0, y: 0 };
        renderMicroscopeLens();
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2560);
    }

    function bindMicroscopeCanvasEvents() {
        const canvas = document.getElementById('microscope-canvas');
        if (!canvas || canvas.dataset.microBound === '1') return;
        canvas.dataset.microBound = '1';

        canvas.addEventListener('mousedown', (e) => {
            isMicroPanning = true;
            microPanStart = { x: e.clientX - microPanOffset.x, y: e.clientY - microPanOffset.y };
        });

        global.addEventListener('mousemove', (e) => {
            if (!isMicroPanning) return;
            microPanOffset.x = Math.max(-80, Math.min(80, e.clientX - microPanStart.x));
            microPanOffset.y = Math.max(-80, Math.min(80, e.clientY - microPanStart.y));
            drawMicroscopeCanvas();
        });

        global.addEventListener('mouseup', () => {
            isMicroPanning = false;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 3 : -3;
            const input = document.getElementById('microscope-focus-range');
            if (input) {
                const nextVal = Math.max(60, Math.min(140, currentMicroFocus + delta));
                input.value = nextVal;
                adjustMicroscopeFocus(nextVal);
            }
        }, { passive: false });
    }

    global.AppRegistry.register({
        id: 'microscope-lab',
        phase: 3,
        init: function () {
            renderMicroscopeLens();
            bindMicroscopeCanvasEvents();
        },
        onLangChange: renderMicroscopeLens,
        publicApi: {
            renderMicroscopeLens,
            adjustMicroscopeFocus,
            selectMicroscopePreset,
            toggleMicroscopeLightMode,
            toggleMicrometerReticle
        },
        globalBindings: {
            adjustMicroscopeFocus,
            selectMicroscopePreset,
            toggleMicroscopeLightMode,
            toggleMicrometerReticle
        }
    });
})(window);
