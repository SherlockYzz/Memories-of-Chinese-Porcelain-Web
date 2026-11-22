/**
 * 模块：宋韵数字藏品明信片一键生成器 (collector-card)
 * 职责：结合当前 3D 展台高清快照、器物档案、朱红篆印与窑口参数生成 1200x1600 收藏明信片 PNG（双语自适应）。
 */
(function (global) {
    'use strict';

    let lastCardDataUrl = '';
    let lastCardTitle = 'vessel_card';

    function isEn() {
        return (global.AppStore && global.AppStore.get('lang')) === 'en';
    }

    function ensureCardModal() {
        if (document.getElementById('collector-card-modal')) return;
        const wrap = document.createElement('div');
        wrap.id = 'collector-card-modal';
        wrap.className = 'modal-backdrop';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-labelledby', 'collector-card-modal-title');
        wrap.onclick = function (e) { if (e.target === wrap) closeCollectorCardModal(); };
        wrap.innerHTML = `
            <div class="modal-content-lg max-w-xl text-center">
                <div class="flex items-center justify-between mb-3 pb-3 border-b border-border-light">
                    <h3 id="collector-card-modal-title" class="font-serif-cn text-base sm:text-lg font-semibold text-text-title flex items-center gap-2">
                        <i class="fa-solid fa-stamp text-amber-400" aria-hidden="true"></i>
                        <span id="collector-card-heading"></span>
                    </h3>
                    <button type="button" onclick="closeCollectorCardModal()" class="w-8 h-8 rounded-full hover:bg-yuebai flex items-center justify-center" aria-label="Close card preview">
                        <i class="fa-solid fa-xmark text-text-body" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="rounded-2xl overflow-hidden border border-border-light bg-[#0b1318] mb-4 max-h-[60vh] flex items-center justify-center">
                    <img id="collector-card-preview-img" src="" alt="Collector Postcard" class="max-h-[58vh] w-auto object-contain">
                </div>
                <div class="flex flex-wrap items-center justify-center gap-3">
                    <button type="button" onclick="downloadGeneratedCollectorCard()" class="px-6 py-2.5 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn hover:bg-tianqing transition-colors shadow-md flex items-center gap-2">
                        <i class="fa-solid fa-download" aria-hidden="true"></i>
                        <span id="collector-card-dl-label"></span>
                    </button>
                    <button type="button" onclick="closeCollectorCardModal()" class="px-5 py-2.5 rounded-full bg-yuebai text-text-body text-xs font-serif-cn">
                        <span id="collector-card-close-label"></span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
        if (global.ModalManager) {
            global.ModalManager.registerOverlayCloser('collector-card-modal', closeCollectorCardModal);
        }
    }

    function wrapLines(ctx, text, maxW, maxLines) {
        const chars = Array.from(String(text || ''));
        const lines = [];
        let cur = '';
        for (let i = 0; i < chars.length; i++) {
            const test = cur + chars[i];
            if (ctx.measureText(test).width > maxW && cur) {
                lines.push(cur);
                cur = chars[i];
                if (lines.length >= maxLines) break;
            } else {
                cur = test;
            }
        }
        if (cur && lines.length < maxLines) lines.push(cur);
        return lines;
    }

    function generateCollectorCard() {
        ensureCardModal();
        const en = isEn();
        const modelIdx = (global.AppStore && typeof global.AppStore.get('modelIndex') === 'number')
            ? global.AppStore.get('modelIndex')
            : (typeof global.currentModelIndex === 'number' ? global.currentModelIndex : 0);

        const dataList = (typeof global.porcelainModelsData !== 'undefined') ? global.porcelainModelsData : [];
        const model = dataList[modelIdx] || dataList[0] || {
            name: '南宋修内司官窑·八方贯耳弦纹瓶',
            english: 'Song Guan Ware Octagonal Vase',
            period: '南宋 (1127–1279)',
            kiln: '杭州凤凰山修内司官窑',
            dimensions: '通高 22.8 cm · 口径 6.2 cm',
            desc: '雨过天青云破处，这般颜色做将来。',
            acousticFreq: 2420
        };

        const threeCanvas = document.getElementById('three-canvas');
        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = 1200;
        cardCanvas.height = 1600;
        const ctx = cardCanvas.getContext('2d');

        // 1. 宣纸墨韵装裱背景
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1600);
        if (isDark) {
            bgGrad.addColorStop(0, '#0B1319');
            bgGrad.addColorStop(0.55, '#122029');
            bgGrad.addColorStop(1, '#080E12');
        } else {
            bgGrad.addColorStop(0, '#F7F2E8');
            bgGrad.addColorStop(0.6, '#EFE8D8');
            bgGrad.addColorStop(1, '#E6DEC9');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1200, 1600);

        // 2. 双重鎏金与天青装裱边框
        ctx.strokeStyle = 'rgba(214, 177, 106, 0.72)';
        ctx.lineWidth = 3;
        ctx.strokeRect(42, 42, 1116, 1516);
        ctx.strokeStyle = 'rgba(90, 156, 168, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(58, 58, 1084, 1484);

        // 3. 顶部馆徽标题
        ctx.fillStyle = isDark ? '#8BC2CE' : '#255460';
        ctx.font = 'bold 28px Georgia, "Noto Serif SC", serif';
        ctx.fillText(en ? 'VESSELS OF CHINA · DIGITAL HERITAGE ARCHIVE' : '天青泥火 · 华夏古瓷三维孪生数字藏品卡', 92, 116);

        ctx.fillStyle = '#D6B16A';
        ctx.font = '20px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`ARCHIVE #${String(modelIdx + 1).padStart(2, '0')} / 15`, 1108, 114);
        ctx.textAlign = 'left';

        // 4. 3D 器物快照视窗
        const boxX = 92, boxY = 152, boxW = 1016, boxH = 820;
        const stageGrad = ctx.createRadialGradient(600, 520, 60, 600, 560, 580);
        stageGrad.addColorStop(0, '#263942');
        stageGrad.addColorStop(1, '#091015');
        ctx.fillStyle = stageGrad;
        ctx.fillRect(boxX, boxY, boxW, boxH);

        if (threeCanvas && threeCanvas.width > 0 && threeCanvas.height > 0) {
            try {
                const srcRatio = threeCanvas.width / threeCanvas.height;
                const dstRatio = boxW / boxH;
                let dw = boxW, dh = boxH, dx = boxX, dy = boxY;
                if (srcRatio > dstRatio) {
                    dh = boxW / srcRatio;
                    dy = boxY + (boxH - dh) / 2;
                } else {
                    dw = boxH * srcRatio;
                    dx = boxX + (boxW - dw) / 2;
                }
                ctx.drawImage(threeCanvas, dx, dy, dw, dh);
            } catch (e) {}
        }

        ctx.strokeStyle = 'rgba(214, 177, 106, 0.78)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // 5. 朱红篆刻印章
        ctx.save();
        ctx.translate(1022, 900);
        ctx.rotate(-0.04);
        ctx.fillStyle = '#A83230';
        ctx.fillRect(-52, -52, 104, 104);
        ctx.strokeStyle = 'rgba(255, 232, 196, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-45, -45, 90, 90);
        ctx.fillStyle = '#FBEED4';
        ctx.font = 'bold 30px "STKaiti", "KaiTi", serif';
        ctx.textAlign = 'center';
        ctx.fillText('天青', 0, -6);
        ctx.fillText('泥火', 0, 32);
        ctx.restore();

        // 6. 器物标题与学术参数
        const tr = (s) => (typeof global.tText === 'function' ? global.tText(s) : s);
        const titleStr = en ? (model.english || tr(model.name)) : model.name;
        ctx.fillStyle = isDark ? '#F2F6F9' : '#162028';
        ctx.font = 'bold 42px Georgia, "Noto Serif SC", serif';
        ctx.fillText(titleStr, 92, 1052, 960);

        ctx.fillStyle = isDark ? '#D6B16A' : '#8B5A12';
        ctx.font = '24px Georgia, "Noto Serif SC", serif';
        ctx.fillText(`${tr(model.period)}  ·  ${tr(model.kiln)}`, 92, 1102, 1000);

        ctx.fillStyle = isDark ? '#8BC2CE' : '#255460';
        ctx.font = '21px monospace';
        ctx.fillText(`${en ? 'Dimensions:' : '实测规制：'} ${tr(model.dimensions)}  |  ${en ? 'Resonance:' : '叩瓷主频：'} ${model.acousticFreq || 2420} Hz`, 92, 1148, 1000);

        // 7. 学术摘要正文
        ctx.strokeStyle = 'rgba(214, 177, 106, 0.45)';
        ctx.beginPath();
        ctx.moveTo(92, 1178);
        ctx.lineTo(1108, 1178);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#B4C4D0' : '#32424D';
        ctx.font = '24px Georgia, "Noto Serif SC", serif';
        const descText = tr(model.desc || '');
        const descLines = wrapLines(ctx, descText, 1016, 4);
        descLines.forEach((ln, idx) => {
            ctx.fillText(ln, 92, 1228 + idx * 42);
        });

        // 8. 页脚防伪与日期
        ctx.fillStyle = isDark ? '#7C90A0' : '#586A76';
        ctx.font = '18px monospace';
        const stamp = new Date().toISOString().slice(0, 10);
        ctx.fillText(`DIGITAL HERITAGE SPECIMEN · VERIFIED ${stamp}`, 92, 1498);
        ctx.textAlign = 'right';
        ctx.fillText('WebGL PBR Dual-Clearcoat Twin', 1108, 1498);
        ctx.textAlign = 'left';

        lastCardDataUrl = cardCanvas.toDataURL('image/png');
        lastCardTitle = titleStr.replace(/[^\w\u4e00-\u9fa5-]+/g, '_').slice(0, 32);

        const headingEl = document.getElementById('collector-card-heading');
        const previewImg = document.getElementById('collector-card-preview-img');
        const dlLabel = document.getElementById('collector-card-dl-label');
        const closeLabel = document.getElementById('collector-card-close-label');

        if (headingEl) headingEl.textContent = en ? 'Song Aesthetics Digital Collector Card' : '宋韵数字藏品明信片 · 装裱预览';
        if (previewImg) previewImg.src = lastCardDataUrl;
        if (dlLabel) dlLabel.textContent = en ? 'Download PNG Postcard' : '下载高清装裱明信片 (PNG)';
        if (closeLabel) closeLabel.textContent = en ? 'Close' : '关闭';

        const modal = document.getElementById('collector-card-modal');
        if (global.ModalManager) global.ModalManager.open(modal);
        else if (modal) modal.classList.add('active');
    }

    function downloadGeneratedCollectorCard() {
        if (!lastCardDataUrl) return;
        const a = document.createElement('a');
        a.href = lastCardDataUrl;
        a.download = `${lastCardTitle}_collector_card.png`;
        a.click();
        if (global.ToastService) global.ToastService.show('📜 已下载高清宋韵数字藏品明信片！');
    }

    function closeCollectorCardModal() {
        const modal = document.getElementById('collector-card-modal');
        if (!modal) return;
        if (global.ModalManager) global.ModalManager.close(modal);
        else modal.classList.remove('active');
    }

    global.AppRegistry.register({
        id: 'collector-card',
        phase: 3,
        init: function () {},
        getSearchItems: function (lang) {
            const en = lang === 'en';
            return [{
                type: en ? '3D Tool' : '数字文博藏品卡',
                icon: 'fa-stamp',
                title: en ? 'Generate Song Collector Postcard' : '生成宋韵数字藏品明信片',
                sub: en ? 'Export framed 3D vessel snapshot & seal' : '一键装裱当前 3D 器物快照、朱红篆印与学术档案',
                action: generateCollectorCard
            }];
        },
        publicApi: { generateCollectorCard, downloadGeneratedCollectorCard, closeCollectorCardModal },
        globalBindings: { generateCollectorCard, downloadGeneratedCollectorCard, closeCollectorCardModal }
    });
})(window);
