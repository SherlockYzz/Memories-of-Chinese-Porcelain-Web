/**
 * 模块：文物 1:1 真实体量标尺对比台 (scale-ruler-modal)
 * 职责：独立插件，在同一厘米刻度坐标系中按真实毫米级尺度渲染 15 尊馆藏名瓷与日常参照物轮廓。
 */
(function (global) {
    'use strict';

    const SPECIMENS = [
        { idx: 0, name: '南宋官窑·八方贯耳瓶', en: 'Song Guan Octagonal Vase', h: 22.8, w: 11.4, shape: 'vase', color: '#7AA8B2' },
        { idx: 1, name: '北宋汝窑·莲花式温碗', en: 'Song Ru Lotus Bowl', h: 10.4, w: 16.2, shape: 'bowl', color: '#8BBAC4' },
        { idx: 2, name: '北宋定窑·刻花白釉梅瓶', en: 'Song Ding Carved Meiping', h: 36.2, w: 16.5, shape: 'meiping', color: '#ECE3D0' },
        { idx: 3, name: '宋代哥窑·百圾碎贯耳扁瓶', en: 'Song Ge Crackle Bottle', h: 20.9, w: 12.9, shape: 'vase', color: '#D6C8A9' },
        { idx: 4, name: '北宋钧窑·玫瑰紫出戟尊', en: 'Song Jun Chuji Zun', h: 25.8, w: 20.2, shape: 'zun', color: '#9E4B78' },
        { idx: 5, name: '元代青花·双龙耳大罐', en: 'Yuan Blue-White Jar', h: 28.4, w: 30.0, shape: 'jar', color: '#3B6CB0' },
        { idx: 6, name: '明宣德·宝石红僧帽壶', en: 'Ming Xuande Monk Cap Ewer', h: 23.9, w: 20.4, shape: 'ewer', color: '#A83238' },
        { idx: 7, name: '清乾隆·洋彩透雕转心瓶', en: 'Qing Qianlong Revolving Vase', h: 31.2, w: 17.7, shape: 'vase', color: '#D6B16A' },
        { idx: 8, name: '宋景德镇·影青净水瓶', en: 'Song Qingbai Water Bottle', h: 20.8, w: 10.2, shape: 'bottle', color: '#B5DCE0' },
        { idx: 9, name: '金元磁州·铁锈花修身瓶', en: 'Jin-Yuan Cizhou Bottle', h: 22.4, w: 11.2, shape: 'bottle', color: '#7D6048' },
        { idx: 10, name: '南宋龙泉·双系圆腹罐', en: 'Song Longquan Double-Lug Jar', h: 16.5, w: 14.8, shape: 'jar', color: '#71A592' },
        { idx: 11, name: '唐邢窑·透影白瓷长颈瓶', en: 'Tang Xing White Vase', h: 21.5, w: 12.0, shape: 'bottle', color: '#F5F2EA' },
        { idx: 12, name: '汉代彩绘·双耳汲水陶壶', en: 'Han Double-Eared Pottery Jar', h: 24.2, w: 18.5, shape: 'jar', color: '#9C836E' },
        { idx: 13, name: '南宋建窑·曜变天目束口盏', en: 'Song Jian Yaobian Tea Bowl', h: 6.8, w: 12.2, shape: 'tea_bowl', color: '#395A82' },
        { idx: 14, name: '南宋龙泉·粉青凤耳纸槌瓶', en: 'Song Longquan Phoenix Vase', h: 25.5, w: 10.6, shape: 'phoenix_vase', color: '#78AD9B' }
    ];

    const REFERENCES = [
        { id: 'cup', name: '现代标准茶杯', en: 'Standard Tea Cup', h: 9.0, w: 7.5 },
        { id: 'hand', name: '成年人手掌高度', en: 'Adult Hand Span', h: 18.0, w: 9.5 },
        { id: 'a4', name: 'A4 竖向标准纸张', en: 'A4 Paper Height', h: 29.7, w: 21.0 }
    ];

    let selectedIdxs = [0, 1, 13, 14];
    let activeRefId = 'hand';

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function isEn() {
        return (global.AppStore && global.AppStore.get('lang')) === 'en';
    }

    function ensureModalDom() {
        if (document.getElementById('scale-ruler-modal')) return;
        const wrap = document.createElement('div');
        wrap.id = 'scale-ruler-modal';
        wrap.className = 'modal-backdrop';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-labelledby', 'scale-ruler-title');
        wrap.onclick = function (e) { if (e.target === wrap) closeScaleRulerModal(); };
        wrap.innerHTML = `
            <div class="modal-content-lg max-w-4xl text-left">
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-light">
                    <h3 id="scale-ruler-title" class="font-serif-cn text-base sm:text-lg font-semibold text-text-title flex items-center gap-2">
                        <i class="fa-solid fa-ruler-vertical text-tianqing-deep" aria-hidden="true"></i>
                        <span id="scale-ruler-heading"></span>
                    </h3>
                    <button type="button" onclick="closeScaleRulerModal()" class="w-8 h-8 rounded-full hover:bg-yuebai flex items-center justify-center transition-colors" aria-label="Close scale ruler">
                        <i class="fa-solid fa-xmark text-text-body" aria-hidden="true"></i>
                    </button>
                </div>
                <div id="scale-ruler-body" class="space-y-4"></div>
            </div>
        `;
        document.body.appendChild(wrap);
        if (global.ModalManager) {
            global.ModalManager.registerOverlayCloser('scale-ruler-modal', closeScaleRulerModal);
        }
    }

    function buildSilhouettePath(shape, cx, baseY, pxW, pxH) {
        const hw = pxW / 2;
        const topY = baseY - pxH;
        if (shape === 'bowl' || shape === 'tea_bowl') {
            return `M ${cx - hw},${topY} Q ${cx - hw * 0.85},${baseY - pxH * 0.2} ${cx - hw * 0.36},${baseY} L ${cx + hw * 0.36},${baseY} Q ${cx + hw * 0.85},${baseY - pxH * 0.2} ${cx + hw},${topY} Z`;
        }
        if (shape === 'meiping') {
            return `M ${cx - hw * 0.25},${topY} L ${cx + hw * 0.25},${topY} C ${cx + hw * 1.15},${topY + pxH * 0.22} ${cx + hw * 0.85},${topY + pxH * 0.55} ${cx + hw * 0.52},${baseY} L ${cx - hw * 0.52},${baseY} C ${cx - hw * 0.85},${topY + pxH * 0.55} ${cx - hw * 1.15},${topY + pxH * 0.22} ${cx - hw * 0.25},${topY} Z`;
        }
        if (shape === 'zun') {
            return `M ${cx - hw * 0.95},${topY} Q ${cx - hw * 0.45},${topY + pxH * 0.32} ${cx - hw * 0.8},${topY + pxH * 0.58} Q ${cx - hw * 0.5},${topY + pxH * 0.85} ${cx - hw * 0.65},${baseY} L ${cx + hw * 0.65},${baseY} Q ${cx + hw * 0.5},${topY + pxH * 0.85} ${cx + hw * 0.8},${topY + pxH * 0.58} Q ${cx + hw * 0.45},${topY + pxH * 0.32} ${cx + hw * 0.95},${topY} Z`;
        }
        if (shape === 'jar') {
            return `M ${cx - hw * 0.52},${topY} C ${cx - hw * 1.05},${topY + pxH * 0.28} ${cx - hw * 0.98},${topY + pxH * 0.72} ${cx - hw * 0.58},${baseY} L ${cx + hw * 0.58},${baseY} C ${cx + hw * 0.98},${topY + pxH * 0.72} ${cx + hw * 1.05},${topY + pxH * 0.28} ${cx + hw * 0.52},${topY} Z`;
        }
        if (shape === 'phoenix_vase' || shape === 'bottle') {
            return `M ${cx - hw * 0.42},${topY} L ${cx - hw * 0.3},${topY + pxH * 0.44} L ${cx - hw * 0.9},${topY + pxH * 0.52} L ${cx - hw * 0.86},${baseY - pxH * 0.08} L ${cx - hw * 0.64},${baseY} L ${cx + hw * 0.64},${baseY} L ${cx + hw * 0.86},${baseY - pxH * 0.08} L ${cx + hw * 0.9},${topY + pxH * 0.52} L ${cx + hw * 0.3},${topY + pxH * 0.44} L ${cx + hw * 0.42},${topY} Z`;
        }
        if (shape === 'ewer') {
            return `M ${cx - hw * 0.42},${topY} L ${cx + hw * 0.35},${topY + pxH * 0.14} Q ${cx + hw * 0.88},${topY + pxH * 0.48} ${cx + hw * 0.54},${baseY} L ${cx - hw * 0.54},${baseY} Q ${cx - hw * 0.88},${topY + pxH * 0.45} ${cx - hw * 0.42},${topY} Z`;
        }
        // 默认官窑/哥窑瓶形
        return `M ${cx - hw * 0.42},${topY} Q ${cx - hw * 0.32},${topY + pxH * 0.35} ${cx - hw * 0.85},${topY + pxH * 0.62} Q ${cx - hw * 0.75},${topY + pxH * 0.88} ${cx - hw * 0.52},${baseY} L ${cx + hw * 0.52},${baseY} Q ${cx + hw * 0.75},${topY + pxH * 0.88} ${cx + hw * 0.85},${topY + pxH * 0.62} Q ${cx + hw * 0.32},${topY + pxH * 0.35} ${cx + hw * 0.42},${topY} Z`;
    }

    function renderScaleRuler() {
        const heading = document.getElementById('scale-ruler-heading');
        const body = document.getElementById('scale-ruler-body');
        if (!body) return;
        const en = isEn();
        if (heading) {
            heading.textContent = en
                ? '1:1 True-Scale Ceramic Dimension Comparator (cm)'
                : '馆藏国宝 1:1 真实体量标尺对比台 (单位: cm)';
        }

        const activeSpecs = selectedIdxs.map(i => SPECIMENS.find(s => s.idx === i)).filter(Boolean);
        const refObj = REFERENCES.find(r => r.id === activeRefId) || REFERENCES[1];
        const maxCm = Math.max(38, refObj.h + 4, ...activeSpecs.map(s => s.h + 4));

        const svgW = 760;
        const svgH = 310;
        const padLeft = 56;
        const baseY = 264;
        const pxPerCm = (baseY - 26) / maxCm;
        const itemsToDraw = [...activeSpecs, { ...refObj, isRef: true }];
        const slotW = (svgW - padLeft - 24) / Math.max(1, itemsToDraw.length);

        const ticks = [];
        for (let cm = 0; cm <= Math.ceil(maxCm / 5) * 5; cm += 5) {
            const y = baseY - cm * pxPerCm;
            if (y < 14) break;
            ticks.push(`
                <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${svgW - 14}" y2="${y.toFixed(1)}" stroke="rgba(139,194,206,${cm % 10 === 0 ? 0.25 : 0.1})" stroke-dasharray="${cm === 0 ? 'none' : '4,4'}"/>
                <text x="${padLeft - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end" fill="#8fa3ad" font-size="10" font-family="monospace">${cm}</text>
            `);
        }

        const shapesSvg = itemsToDraw.map((item, idx) => {
            const cx = padLeft + slotW * (idx + 0.5);
            const pxH = item.h * pxPerCm;
            const pxW = Math.min(slotW * 0.72, item.w * pxPerCm);
            const label = en ? item.en : item.name;
            if (item.isRef) {
                const topY = baseY - pxH;
                return `
                    <g>
                        <rect x="${(cx - pxW / 2).toFixed(1)}" y="${topY.toFixed(1)}" width="${pxW.toFixed(1)}" height="${pxH.toFixed(1)}" rx="6" fill="rgba(214,177,106,0.12)" stroke="#D6B16A" stroke-width="1.5" stroke-dasharray="4,3"/>
                        <text x="${cx.toFixed(1)}" y="${(topY - 6).toFixed(1)}" text-anchor="middle" fill="#D6B16A" font-size="10.5" font-family="monospace">${item.h.toFixed(1)} cm</text>
                        <text x="${cx.toFixed(1)}" y="${baseY + 16}" text-anchor="middle" fill="#D6B16A" font-size="10.5">${label}</text>
                        <text x="${cx.toFixed(1)}" y="${baseY + 30}" text-anchor="middle" fill="#8fa3ad" font-size="9.5">${en ? 'Daily Reference' : '日常参照物'}</text>
                    </g>
                `;
            }
            const path = buildSilhouettePath(item.shape, cx, baseY, pxW, pxH);
            const topY = baseY - pxH;
            return `
                <g>
                    <path d="${path}" fill="${item.color}" fill-opacity="0.72" stroke="#E5C888" stroke-width="1.4"/>
                    <line x1="${(cx - pxW * 0.55).toFixed(1)}" y1="${topY.toFixed(1)}" x2="${(cx + pxW * 0.55).toFixed(1)}" y2="${topY.toFixed(1)}" stroke="rgba(229,200,136,0.45)" stroke-width="1"/>
                    <text x="${cx.toFixed(1)}" y="${(topY - 6).toFixed(1)}" text-anchor="middle" fill="#e2eef0" font-size="10.5" font-family="monospace">${item.h.toFixed(1)} cm</text>
                    <text x="${cx.toFixed(1)}" y="${baseY + 16}" text-anchor="middle" fill="#e2eef0" font-size="10">${label.slice(0, 12)}</text>
                    <text x="${cx.toFixed(1)}" y="${baseY + 30}" text-anchor="middle" fill="#8fa3ad" font-size="9.5">${en ? `W ${item.w}cm` : `宽 ${item.w}cm`}</text>
                </g>
            `;
        }).join('');

        body.innerHTML = `
            <p class="text-xs text-text-muted leading-relaxed">
                ${en
                    ? 'Compare up to 4 museum vessels side-by-side in an exact centimeter coordinate system alongside everyday objects to grasp authentic physical proportions.'
                    : '在同一精确厘米标尺坐标系下同台比对最多 4 件传世国宝与日常参照物，直观打破“屏幕视觉等大”错觉，感知宋元明清器物的真实体量。'}
            </p>
            <div class="rounded-2xl overflow-hidden border border-border-light bg-[#0b1318] p-2">
                <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full h-auto block" role="img" aria-label="${en ? '1:1 ceramic scale comparison chart' : '古瓷 1:1 真实体量对比图'}">
                    <text x="${padLeft - 8}" y="16" text-anchor="end" fill="#8fa3ad" font-size="9.5" font-family="monospace">cm</text>
                    <line x1="${padLeft}" y1="16" x2="${padLeft}" y2="${baseY}" stroke="rgba(139,194,206,0.45)" stroke-width="1.2"/>
                    ${ticks.join('')}
                    ${shapesSvg}
                </svg>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-text-muted">${en ? 'Reference:' : '日常参照：'}</span>
                    ${REFERENCES.map(r => `
                        <button type="button" onclick="setScaleReference('${r.id}')" class="px-2.5 py-1 rounded-full border text-[11px] transition-colors ${activeRefId === r.id ? 'bg-tianqing-deep text-white border-tianqing' : 'bg-yuebai text-text-body border-border-light'}">
                            ${en ? r.en : r.name} (${r.h}cm)
                        </button>
                    `).join('')}
                </div>
                <span class="text-[11px] text-text-muted">${en ? `Selected ${selectedIdxs.length}/4` : `已选 ${selectedIdxs.length}/4 件`}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pt-1">
                ${SPECIMENS.map(s => {
                    const checked = selectedIdxs.includes(s.idx);
                    return `
                        <button type="button" onclick="toggleScaleSpecimen(${s.idx})" class="px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition-all flex items-center justify-between gap-1 ${checked ? 'bg-tianqing-deep text-white border-amber-400/60' : 'bg-bg-main text-text-body border-border-light hover:border-tianqing'}">
                            <span class="truncate">${en ? s.en : s.name}</span>
                            <span class="font-mono text-[10px] opacity-80 shrink-0">${s.h}cm</span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    function openScaleRulerModal() {
        ensureModalDom();
        const cur = global.AppStore ? global.AppStore.get('modelIndex') : 0;
        if (typeof cur === 'number' && !selectedIdxs.includes(cur)) {
            selectedIdxs = [cur, ...selectedIdxs.slice(0, 3)];
        }
        renderScaleRuler();
        const modal = document.getElementById('scale-ruler-modal');
        if (global.ModalManager) global.ModalManager.open(modal);
        else if (modal) modal.classList.add('active');
    }

    function closeScaleRulerModal() {
        const modal = document.getElementById('scale-ruler-modal');
        if (!modal) return;
        if (global.ModalManager) global.ModalManager.close(modal);
        else modal.classList.remove('active');
    }

    function toggleScaleSpecimen(idx) {
        const pos = selectedIdxs.indexOf(idx);
        if (pos >= 0) {
            if (selectedIdxs.length > 1) selectedIdxs.splice(pos, 1);
        } else {
            if (selectedIdxs.length >= 4) selectedIdxs.shift();
            selectedIdxs.push(idx);
        }
        renderScaleRuler();
    }

    function setScaleReference(refId) {
        activeRefId = refId;
        renderScaleRuler();
    }

    global.AppRegistry.register({
        id: 'scale-ruler',
        phase: 3,
        init: function () {},
        onLangChange: function () {
            const modal = document.getElementById('scale-ruler-modal');
            if (modal && modal.classList.contains('active')) renderScaleRuler();
        },
        getSearchItems: function (lang) {
            const en = lang === 'en';
            return [{
                type: en ? '3D Tool' : '体量考据工具',
                icon: 'fa-ruler-vertical',
                title: en ? '1:1 True-Scale Dimension Comparator' : '文物 1:1 真实体量标尺对比台',
                sub: en ? 'Compare 15 vessels in centimeter scale' : '同台比对 15 尊国宝与日常参照物真实厘米高度',
                action: openScaleRulerModal
            }];
        },
        publicApi: { openScaleRulerModal, closeScaleRulerModal, toggleScaleSpecimen, setScaleReference },
        globalBindings: { openScaleRulerModal, closeScaleRulerModal, toggleScaleSpecimen, setScaleReference }
    });
})(window);
