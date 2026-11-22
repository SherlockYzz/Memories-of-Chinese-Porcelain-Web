/**
 * 模块：文人四艺 & 宋代《大观茶论》建盏七汤点茶与水丹青茶百戏 (literati-tea)
 */
(function (global) {
    'use strict';

    let teaCanvas, teaCtx;
    let teaFoamLevel = 0;
    let teaMotif = 'bamboo';
    let isDrawingTea = false;
    let userTeaStrokes = [];

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function renderLiteratiArts() {
        const container = document.getElementById('four-arts-container');
        if (!container || typeof literatiArts === 'undefined') return;

        container.innerHTML = literatiArts.map(art => `
            <div class="feature-card p-6 hover-lift text-left flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 rounded-2xl bg-yuebai flex items-center justify-center text-tianqing-deep text-xl border border-border-light">
                            <i class="fa-solid ${art.icon}" aria-hidden="true"></i>
                        </div>
                        <span class="text-[10px] font-serif-cn text-text-muted bg-bg-main px-2.5 py-1 rounded-full border border-border-light">${tr(art.classicSource || '宋代雅集')}</span>
                    </div>
                    <h4 class="text-xl font-serif-cn text-text-title font-semibold mb-1">${tr(art.title)}</h4>
                    <span class="text-xs text-tianqing-deep font-medium block mb-2">${tr('雅集用器')}：${tr(art.vessel)}</span>
                    <p class="text-xs text-amber-400 italic mb-3 font-serif-cn">“${tr(art.quote)}”</p>
                    <p class="text-xs text-text-body font-light leading-relaxed">${tr(art.desc)}</p>
                </div>
            </div>
        `).join('');
    }

    function updateTeaStageBadge() {
        const badge = document.getElementById('tea-stage-badge');
        const bar = document.getElementById('tea-foam-progress');
        if (bar) bar.style.width = `${Math.round(teaFoamLevel)}%`;
        if (!badge) return;

        const soupNum = Math.max(1, Math.min(7, Math.ceil((teaFoamLevel / 100) * 7)));
        const stageNames = [
            '一汤初注 · 调膏运筅',
            '二汤击拂 · 蟹眼微生',
            '三汤回环 · 轻云渐聚',
            '四汤疾拂 · 疏星皎月',
            '五汤珠玑 · 粟文蟹眼',
            '六汤乳雾 · 盏面凝雪',
            '七汤大成 · 雪沫咬盏 (茶百戏成)'
        ];
        badge.textContent = `${tr(stageNames[soupNum - 1])} (${Math.round(teaFoamLevel)}%)`;
    }

    function drawTeaBowlCanvas() {
        if (!teaCtx || !teaCanvas) return;
        const w = teaCanvas.width;
        const h = teaCanvas.height;
        const cx = w / 2, cy = h / 2;
        const r = Math.min(w, h) * 0.44;

        teaCtx.clearRect(0, 0, w, h);

        teaCtx.beginPath();
        teaCtx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        teaCtx.fillStyle = '#1c1512';
        teaCtx.fill();
        teaCtx.lineWidth = 3;
        teaCtx.strokeStyle = '#9a6b2f';
        teaCtx.stroke();

        const jianGrad = teaCtx.createRadialGradient(cx, cy, 8, cx, cy, r);
        jianGrad.addColorStop(0, '#0a0809');
        jianGrad.addColorStop(0.65, '#1d181a');
        jianGrad.addColorStop(0.92, '#3a2b22');
        jianGrad.addColorStop(1, '#523a28');
        teaCtx.beginPath();
        teaCtx.arc(cx, cy, r, 0, Math.PI * 2);
        teaCtx.fillStyle = jianGrad;
        teaCtx.fill();

        teaCtx.save();
        teaCtx.translate(cx, cy);
        for (let i = 0; i < 72; i++) {
            const ang = (i / 72) * Math.PI * 2;
            teaCtx.strokeStyle = i % 2 === 0 ? 'rgba(168, 202, 224, 0.35)' : 'rgba(212, 175, 106, 0.28)';
            teaCtx.lineWidth = 1.2;
            teaCtx.beginPath();
            teaCtx.moveTo(Math.cos(ang) * (r * 0.25), Math.sin(ang) * (r * 0.25));
            teaCtx.lineTo(Math.cos(ang) * (r * 0.94), Math.sin(ang) * (r * 0.94));
            teaCtx.stroke();
        }
        teaCtx.restore();

        if (teaFoamLevel > 5) {
            const foamR = r * 0.88 * Math.min(1, 0.35 + (teaFoamLevel / 100) * 0.65);
            const foamAlpha = Math.min(0.95, 0.25 + (teaFoamLevel / 100) * 0.72);
            const foamGrad = teaCtx.createRadialGradient(cx, cy, foamR * 0.1, cx, cy, foamR);
            foamGrad.addColorStop(0, `rgba(248, 246, 240, ${foamAlpha})`);
            foamGrad.addColorStop(0.75, `rgba(240, 236, 225, ${foamAlpha * 0.92})`);
            foamGrad.addColorStop(1, 'rgba(235, 230, 215, 0)');

            teaCtx.beginPath();
            teaCtx.arc(cx, cy, foamR, 0, Math.PI * 2);
            teaCtx.fillStyle = foamGrad;
            teaCtx.fill();

            teaCtx.strokeStyle = 'rgba(210, 202, 185, 0.45)';
            teaCtx.lineWidth = 1.2;
            for (let ring = 18; ring < foamR * 0.85; ring += 14) {
                teaCtx.beginPath();
                teaCtx.arc(cx, cy, ring, 0, Math.PI * 1.65);
                teaCtx.stroke();
            }
        }

        if (teaFoamLevel >= 35 && teaMotif !== 'none') {
            teaCtx.save();
            teaCtx.translate(cx, cy);
            teaCtx.strokeStyle = 'rgba(42, 68, 54, 0.78)';
            teaCtx.fillStyle = 'rgba(42, 68, 54, 0.78)';
            teaCtx.lineCap = 'round';

            if (teaMotif === 'bamboo') {
                teaCtx.lineWidth = 3.5;
                teaCtx.beginPath();
                teaCtx.moveTo(-18, 55);
                teaCtx.quadraticCurveTo(-8, 0, 12, -55);
                teaCtx.stroke();
                [[-12, 20, -38, 8], [-4, -8, 28, -18], [6, -35, -24, -45]].forEach(([bx, by, tx, ty]) => {
                    teaCtx.lineWidth = 2.2;
                    teaCtx.beginPath();
                    teaCtx.moveTo(bx, by);
                    teaCtx.quadraticCurveTo((bx + tx) / 2, by - 8, tx, ty);
                    teaCtx.stroke();
                });
            } else if (teaMotif === 'plum') {
                teaCtx.lineWidth = 3.5;
                teaCtx.beginPath();
                teaCtx.moveTo(-48, 42);
                teaCtx.quadraticCurveTo(-5, 10, 42, -38);
                teaCtx.stroke();
                [[-15, 15], [12, -12], [32, -28], [-28, -8]].forEach(([px, py]) => {
                    teaCtx.fillStyle = 'rgba(168, 56, 59, 0.78)';
                    for (let p = 0; p < 5; p++) {
                        const a = (p / 5) * Math.PI * 2;
                        teaCtx.beginPath();
                        teaCtx.arc(px + Math.cos(a) * 6, py + Math.sin(a) * 6, 3.5, 0, Math.PI * 2);
                        teaCtx.fill();
                    }
                });
            } else if (teaMotif === 'crane') {
                teaCtx.lineWidth = 2.8;
                teaCtx.beginPath();
                teaCtx.moveTo(-45, 12);
                teaCtx.quadraticCurveTo(-15, -28, 0, -5);
                teaCtx.quadraticCurveTo(15, -28, 45, 12);
                teaCtx.stroke();
                teaCtx.beginPath();
                teaCtx.arc(0, -18, 16, 0, Math.PI * 2);
                teaCtx.strokeStyle = 'rgba(197, 160, 89, 0.65)';
                teaCtx.stroke();
            }
            teaCtx.restore();
        }

        teaCtx.strokeStyle = 'rgba(35, 58, 48, 0.82)';
        teaCtx.lineWidth = 3;
        teaCtx.lineCap = 'round';
        userTeaStrokes.forEach(stroke => {
            if (stroke.length < 2) return;
            teaCtx.beginPath();
            teaCtx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                teaCtx.lineTo(stroke[i].x, stroke[i].y);
            }
            teaCtx.stroke();
        });
    }

    function initTeaWhiskingSimulator() {
        teaCanvas = document.getElementById('tea-whisk-canvas');
        if (!teaCanvas || teaCanvas.dataset.teaInit === '1') return;
        teaCanvas.dataset.teaInit = '1';
        teaCtx = teaCanvas.getContext('2d');
        teaFoamLevel = 55;
        teaMotif = 'bamboo';

        const getCanvasPt = (e) => {
            const rect = teaCanvas.getBoundingClientRect();
            const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            return {
                x: (clientX - rect.left) * (teaCanvas.width / (rect.width || teaCanvas.width)),
                y: (clientY - rect.top) * (teaCanvas.height / (rect.height || teaCanvas.height))
            };
        };

        teaCanvas.addEventListener('pointerdown', (e) => {
            isDrawingTea = true;
            const pt = getCanvasPt(e);
            if (teaFoamLevel < 95) teaFoamLevel = Math.min(100, teaFoamLevel + 12);
            userTeaStrokes.push([pt]);
            drawTeaBowlCanvas();
            updateTeaStageBadge();
        });

        teaCanvas.addEventListener('pointermove', (e) => {
            if (!isDrawingTea) return;
            const pt = getCanvasPt(e);
            if (teaFoamLevel < 100) {
                teaFoamLevel = Math.min(100, teaFoamLevel + 1.2);
                updateTeaStageBadge();
            }
            const curStroke = userTeaStrokes[userTeaStrokes.length - 1];
            if (curStroke) curStroke.push(pt);
            drawTeaBowlCanvas();
        });

        global.addEventListener('pointerup', () => {
            isDrawingTea = false;
        });

        drawTeaBowlCanvas();
        updateTeaStageBadge();

        if ('IntersectionObserver' in global && teaCanvas) {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(ent => {
                    if (ent.isIntersecting) {
                        drawTeaBowlCanvas();
                        updateTeaStageBadge();
                    }
                });
            }, { threshold: 0.1 });
            obs.observe(teaCanvas);
        }
    }

    function whiskTeaStep() {
        teaFoamLevel = Math.min(100, teaFoamLevel + 25);
        if (typeof global.playCrackleSound === 'function') global.playCrackleSound();
        drawTeaBowlCanvas();
        updateTeaStageBadge();
        if (teaFoamLevel >= 100 && global.ToastService) {
            global.ToastService.show('🍵 七汤击拂大成！乳花“咬盏”如积雪，可在盏面点绘水丹青茶百戏！');
        }
    }

    function setTeaBailiMotif(motif) {
        teaMotif = motif;
        teaFoamLevel = 100;
        userTeaStrokes = [];
        drawTeaBowlCanvas();
        updateTeaStageBadge();
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2640);
        const names = { bamboo: '清风疎竹', plum: '雪夜寒梅', crane: '松鹤延年', waves: '平湖秋月' };
        if (global.ToastService) {
            global.ToastService.show(`🍵 已于建盏雪沫之上施展茶百戏：【${names[motif] || motif}】`);
        }
    }

    function resetTeaBowl() {
        teaFoamLevel = 15;
        teaMotif = 'none';
        userTeaStrokes = [];
        drawTeaBowlCanvas();
        updateTeaStageBadge();
    }

    global.AppRegistry.register({
        id: 'literati-tea',
        phase: 2,
        init: function () {
            initTeaWhiskingSimulator();
            renderLiteratiArts();
        },
        onLangChange: function () {
            renderLiteratiArts();
            updateTeaStageBadge();
        },
        publicApi: {
            renderLiteratiArts,
            initTeaWhiskingSimulator,
            whiskTeaStep,
            setTeaBailiMotif,
            resetTeaBowl
        },
        globalBindings: {
            whiskTeaStep,
            setTeaBailiMotif,
            resetTeaBowl
        }
    });
})(window);
