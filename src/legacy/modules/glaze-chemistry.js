/**
 * 模块：东方传统古瓷色谱 & 釉料化学配比实时实验室 (glaze-chemistry)
 */
(function (global) {
    'use strict';

    let chemState = {
        fe: 1.8,
        cu: 0.0,
        co: 0.0,
        agate: 18,
        atmosphere: 'reduction'
    };

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function renderTraditionalColors() {
        const container = document.getElementById('traditional-colors-grid');
        if (!container || typeof traditionalColors === 'undefined') return;

        container.innerHTML = traditionalColors.map(c => `
            <div class="feature-card p-5 flex flex-col justify-between group hover-lift text-left">
                <div>
                    <div class="aspect-[16/9] rounded-xl mb-3.5 shadow-inner relative overflow-hidden flex items-end justify-between p-3 cursor-pointer border border-white/15" style="background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.38), transparent 65%), ${c.hex};" data-action="previewColorIn3D('${c.glazeKey || 'tianqing'}')">
                        <span class="text-[10px] text-white bg-black/55 backdrop-blur-sm px-2.5 py-0.5 rounded font-mono">${c.hex}</span>
                        <span class="text-[10px] text-white bg-black/55 backdrop-blur-sm px-2.5 py-0.5 rounded font-mono">RGB(${c.rgb})</span>
                    </div>
                    <div class="flex items-baseline justify-between mb-1">
                        <h4 class="text-lg font-serif-cn font-semibold text-text-title">${tr(c.name)}</h4>
                        <span class="text-[11px] text-text-muted font-serif-cn">${c.pinyin}</span>
                    </div>
                    <span class="text-[11px] text-tianqing-deep block mb-1.5 font-medium">${tr(c.dynasty)}</span>
                    <div class="text-[10px] font-mono text-amber-400 bg-bg-main px-2.5 py-1 rounded border border-border-light mb-2 truncate" title="${tr(c.oxide || '')}">
                        <i class="fa-solid fa-atom mr-1" aria-hidden="true"></i>${tr(c.oxide || 'Fe₂O₃ 高温还原显色')}
                    </div>
                    <p class="text-xs text-amber-200 italic mb-2 font-serif-cn">“${tr(c.quote)}”</p>
                    <p class="text-xs text-text-body font-light leading-relaxed">${tr(c.desc)}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-xs">
                    <button data-action="copyColorCode('${c.hex}')" class="text-text-muted hover:text-tianqing-deep transition-colors text-[11px]">
                        <i class="fa-regular fa-copy mr-1" aria-hidden="true"></i>${tr('复制色值')}
                    </button>
                    <button data-action="previewColorIn3D('${c.glazeKey || 'tianqing'}')" class="text-tianqing-deep font-medium hover:underline text-[11px] font-serif-cn">
                        ${tr('同步至 3D 展厅试烧')} <i class="fa-solid fa-cube text-[9px] ml-0.5" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function previewColorIn3D(glazeKey) {
        if (typeof global.switchGlaze === 'function') global.switchGlaze(glazeKey);
        const el = document.getElementById('3d-gallery');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function copyColorCode(hex) {
        navigator.clipboard.writeText(hex).then(() => {
            if (global.ToastService) global.ToastService.show(`🎨 ${tr('已成功复制传统古瓷釉色色值：')}${hex}`);
        }).catch(() => {
            if (global.ToastService) global.ToastService.show(`${tr('色值：')}${hex}`);
        });
    }

    function setGlazeChemAtmosphere(atm) {
        chemState.atmosphere = atm;
        document.querySelectorAll('.chem-atm-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.atm === atm);
        });
        updateGlazeChemistrySimulation();
        if (typeof global.playCrackleSound === 'function') global.playCrackleSound();
    }

    function applyChemPreset(presetKey) {
        if (presetKey === 'ru') {
            chemState = { fe: 1.8, cu: 0.0, co: 0.0, agate: 26, atmosphere: 'reduction' };
        } else if (presetKey === 'ding') {
            chemState = { fe: 0.4, cu: 0.0, co: 0.0, agate: 5, atmosphere: 'oxidation' };
        } else if (presetKey === 'jun') {
            chemState = { fe: 1.5, cu: 0.8, co: 0.0, agate: 22, atmosphere: 'reduction' };
        } else if (presetKey === 'jian') {
            chemState = { fe: 8.6, cu: 0.0, co: 0.0, agate: 8, atmosphere: 'reduction' };
        } else if (presetKey === 'qinghua') {
            chemState = { fe: 1.2, cu: 0.0, co: 1.4, agate: 10, atmosphere: 'reduction' };
        }
        const feIn = document.getElementById('chem-fe-slider');
        const cuIn = document.getElementById('chem-cu-slider');
        const coIn = document.getElementById('chem-co-slider');
        const agIn = document.getElementById('chem-agate-slider');
        if (feIn) feIn.value = chemState.fe;
        if (cuIn) cuIn.value = chemState.cu;
        if (coIn) coIn.value = chemState.co;
        if (agIn) agIn.value = chemState.agate;
        setGlazeChemAtmosphere(chemState.atmosphere);
    }

    function updateGlazeChemistrySimulation() {
        const feIn = document.getElementById('chem-fe-slider');
        const cuIn = document.getElementById('chem-cu-slider');
        const coIn = document.getElementById('chem-co-slider');
        const agIn = document.getElementById('chem-agate-slider');

        if (feIn) chemState.fe = parseFloat(feIn.value);
        if (cuIn) chemState.cu = parseFloat(cuIn.value);
        if (coIn) chemState.co = parseFloat(coIn.value);
        if (agIn) chemState.agate = parseFloat(agIn.value);

        const feVal = document.getElementById('chem-fe-val');
        const cuVal = document.getElementById('chem-cu-val');
        const coVal = document.getElementById('chem-co-val');
        const agVal = document.getElementById('chem-agate-val');
        if (feVal) feVal.textContent = `${chemState.fe.toFixed(1)}%`;
        if (cuVal) cuVal.textContent = `${chemState.cu.toFixed(1)}%`;
        if (coVal) coVal.textContent = `${chemState.co.toFixed(1)}%`;
        if (agVal) agVal.textContent = `${chemState.agate}%`;

        let glazeTitle = '北宋汝官窑 · 雨过天青玛瑙釉';
        let equation = 'Fe₂O₃ + CO (1250℃ 强还原焰) → 2FeO (二价铁青瓷显色) + CO₂↑';
        let mechanism = '微量二价铁离子（Fe²⁺）在硅酸盐网络中吸收红光波段，配合玛瑙隐晶质瑞利散射，呈现温润失透的天青玉色。';
        let targetGlazeKey = 'tianqing';
        let colorStops = ['#c5e6ec', '#87b5be', '#3e6870'];

        if (chemState.co >= 0.5) {
            glazeTitle = '明宣德御窑 · 苏麻离青钴蓝釉相';
            equation = 'CoO + Al₂O₃ (1300℃ 柴窑还原) → CoAl₂O₄ (尖晶石深邃钴蓝) + Fe₃O₄ (铁锈结晶斑)';
            mechanism = '进口高铁低锰苏麻离青钴料在高温下形成稳定的钴铝尖晶石结构，浓重处过饱和铁氧化物析出银黑色磁铁矿结晶斑。';
            targetGlazeKey = 'qinghua';
            colorStops = ['#dce9f5', '#2a589e', '#11264a'];
        } else if (chemState.cu >= 0.35) {
            if (chemState.atmosphere === 'reduction') {
                glazeTitle = '河南禹州钧官窑 · 玫瑰紫海棠红窑变釉';
                equation = '2CuO + CO (1280℃ 还原分相) → Cu₂O / Cu⁰ (纳米金属铜胶体粒子) + CO₂↑';
                mechanism = '还原焰下铜离子还原为纳米级胶体铜粒子（表面等离子体共振吸收绿光显紫红），与二液分相天蓝乳光交融出晚霞万彩。';
                targetGlazeKey = 'junhong';
                colorStops = ['#e078a8', '#822b56', '#2e1642'];
            } else {
                glazeTitle = '高温铜绿釉 · 氧化焰翡翠绿相';
                equation = 'CuO + O₂ (1260℃ 氧化气氛) → Cu²⁺ (二价铜离子配位吸收红光显翠绿)';
                mechanism = '在富氧氧化焰中，铜以二价离子（Cu²⁺）形态溶解于釉玻璃相，无法生成红紫胶体铜，故呈现清澈翠绿色。';
                targetGlazeKey = 'fenqing';
                colorStops = ['#a8e0c2', '#4c9972', '#22523a'];
            }
        } else if (chemState.fe >= 6.0) {
            glazeTitle = '福建建阳建窑 · 乌金兔毫曜变黑釉';
            equation = '3Fe₂O₃ + CO (1310℃ 析晶还原) → 2Fe₃O₄ (乌金底釉) + ε-Fe₂O₃ (兔毫/曜变微晶析出)';
            mechanism = '超8%高含铁量使釉层深邃如墨，高温降温阶段过饱和铁质沿流釉方向析出针状赤铁矿与磁铁矿微晶，产生薄膜干涉虹彩。';
            targetGlazeKey = 'jianhei';
            colorStops = ['#6b82a6', '#241e20', '#090708'];
        } else if (chemState.fe < 0.8) {
            if (chemState.atmosphere === 'oxidation') {
                glazeTitle = '河北曲阳定窑 · 象牙白温润暖釉';
                equation = 'Al₂O₃-SiO₂ + 微量 TiO₂/Fe³⁺ (1320℃ 氧化焰) → 象牙暖白透明钙镁釉';
                mechanism = '极低含铁量配合氧化焰气氛，微量三价铁与钛离子赋予白瓷柔和的象牙米白暖调，褪去冷白刺目之感。';
                targetGlazeKey = 'dingbai';
                colorStops = ['#fffdf7', '#ebe0ca', '#b5a88e'];
            } else {
                glazeTitle = '宋官钧/景德镇 · 月白莹霜冷韵釉';
                equation = '低铁硅酸盐釉 + CO (弱还原焰) → 极淡 Fe²⁺ 月白莹霜玉相';
                mechanism = '微量二价铁在还原气氛下消除黄色调，呈现白中泛冷青的中秋月白光泽。';
                targetGlazeKey = 'yuebai';
                colorStops = ['#f7fbfc', '#cedde3', '#7f959e'];
            }
        } else {
            if (chemState.atmosphere === 'oxidation') {
                glazeTitle = '越窑/耀州窑系 · 氧化焰艾叶青黄釉';
                equation = '4FeO + O₂ (氧化气氛) → 2Fe₂O₃ (三价铁 Fe³⁺ 显琵琶黄/艾青色)';
                mechanism = '当窑门密封不严或采用氧化焰烧制时，二价铁被氧化为三价铁（Fe³⁺），青瓷即由天青转为温润的艾叶青黄或琵琶色。';
                targetGlazeKey = 'fenqing';
                colorStops = ['#d6dec2', '#8e9c6b', '#4d5736'];
            } else if (chemState.fe >= 2.4) {
                glazeTitle = '南宋龙泉/修内司官窑 · 梅子青与粉青厚釉';
                equation = 'Fe₂O₃ (2.5%+) + CO (还原焰) + CaO-K₂O 石灰碱釉 → 翠玉粉青相';
                mechanism = '较高二价铁浓度配合高粘度石灰碱厚釉与微气泡散射，呈现饱满欲滴的粉青与梅子青玉质光泽。';
                targetGlazeKey = 'fenqing';
                colorStops = ['#bce3d2', '#75ab95', '#3d6957'];
            }
        }

        const discCanvas = document.getElementById('glaze-chem-disc-canvas');
        if (discCanvas) {
            const ctx = discCanvas.getContext('2d');
            const w = discCanvas.width;
            const h = discCanvas.height;
            const cx = w / 2, cy = h / 2;
            ctx.clearRect(0, 0, w, h);

            const g = ctx.createRadialGradient(cx - 28, cy - 28, 12, cx, cy, 98);
            g.addColorStop(0, colorStops[0]);
            g.addColorStop(0.58, colorStops[1]);
            g.addColorStop(1, colorStops[2]);

            ctx.beginPath();
            ctx.arc(cx, cy, 95, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(212, 175, 106, 0.55)';
            ctx.stroke();

            const dotCount = Math.floor(chemState.agate * 2.5);
            for (let i = 0; i < dotCount; i++) {
                const ang = i * 2.4;
                const rad = 28 + ((i * 19) % 62);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
                ctx.beginPath();
                ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.fillStyle = '#0B1015';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(212, 175, 106, 0.65)';
            ctx.stroke();
        }

        const titleEl = document.getElementById('chem-result-title');
        const eqEl = document.getElementById('chem-result-equation');
        const mechEl = document.getElementById('chem-result-desc');
        const applyBtn = document.getElementById('chem-apply-3d-btn');

        if (titleEl) titleEl.textContent = tr(glazeTitle);
        if (eqEl) eqEl.textContent = tr(equation);
        if (mechEl) mechEl.textContent = tr(mechanism);
        if (applyBtn) {
            applyBtn.onclick = () => previewColorIn3D(targetGlazeKey);
        }
    }

    function exportGlazeFormulaCard() {
        const disc = document.getElementById('glaze-chem-disc-canvas');
        const titleEl = document.getElementById('chem-result-title');
        const eqEl = document.getElementById('chem-result-equation');
        const descEl = document.getElementById('chem-result-desc');
        const out = document.createElement('canvas');
        out.width = 960;
        out.height = 540;
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#F4F1E8';
        ctx.fillRect(0, 0, 960, 540);
        ctx.strokeStyle = '#3A7684';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, 920, 500);
        ctx.strokeStyle = '#C8A25A';
        ctx.lineWidth = 1;
        ctx.strokeRect(28, 28, 904, 484);

        if (disc) ctx.drawImage(disc, 60, 120, 260, 260);
        ctx.fillStyle = '#142029';
        ctx.font = 'bold 26px "Noto Serif SC", serif';
        ctx.fillText('天青泥火 · 釉料配比实验研学卡', 360, 88);
        ctx.font = 'bold 22px "Noto Serif SC", serif';
        ctx.fillStyle = '#224E59';
        ctx.fillText(titleEl ? titleEl.textContent : '古瓷釉料试烧方案', 360, 145);

        ctx.fillStyle = '#3E4E5C';
        ctx.font = '15px monospace';
        ctx.fillText(`Fe₂O₃ ${chemState.fe.toFixed(1)}% · CuO ${chemState.cu.toFixed(1)}% · CoO ${chemState.co.toFixed(1)}% · 玛瑙粉 ${chemState.agate}% · ${chemState.atmosphere === 'reduction' ? '还原焰' : '氧化焰'}`, 360, 185);
        ctx.fillText(eqEl ? eqEl.textContent : '', 360, 222);

        ctx.font = '14px "Noto Serif SC", sans-serif';
        const desc = (descEl ? descEl.textContent : '') + '（教学示意模型，文献出处：李家治 1998；Nigel Wood 1999）';
        let line = '', y = 272;
        for (const ch of desc) {
            line += ch;
            if (ctx.measureText(line).width > 520) {
                ctx.fillText(line, 360, y);
                line = '';
                y += 24;
            }
        }
        if (line) ctx.fillText(line, 360, y);

        ctx.fillStyle = '#A8322D';
        ctx.fillRect(830, 420, 72, 72);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px "Noto Serif SC", serif';
        ctx.fillText('釉色', 848, 452);
        ctx.fillText('研学', 848, 476);

        const a = document.createElement('a');
        a.download = `天青泥火_釉方研学卡_${Date.now()}.png`;
        a.href = out.toDataURL('image/png');
        a.click();
        if (global.AppBus) global.AppBus.emit('study:glaze-complete', { state: { ...chemState } });
        if (global.ToastService) global.ToastService.show('已导出《釉料配比实验研学卡》并记录研学进度');
    }

    function refreshAll() {
        renderTraditionalColors();
        updateGlazeChemistrySimulation();
    }

    global.AppRegistry.register({
        id: 'glaze-chemistry',
        phase: 3,
        init: refreshAll,
        onLangChange: refreshAll,
        getSearchItems: function () {
            if (typeof traditionalColors === 'undefined') return [];
            return traditionalColors.map(c => ({
                type: tr('东方古瓷釉色'),
                icon: 'fa-palette',
                title: `${tr(c.name)} (${c.hex})`,
                sub: `${tr(c.dynasty)} · ${tr(c.oxide || c.quote)}`,
                action: () => previewColorIn3D(c.glazeKey)
            }));
        },
        publicApi: {
            renderTraditionalColors,
            previewColorIn3D,
            copyColorCode,
            setGlazeChemAtmosphere,
            applyChemPreset,
            updateGlazeChemistrySimulation,
            exportGlazeFormulaCard
        },
        globalBindings: {
            copyColorCode,
            previewColorIn3D,
            setGlazeChemAtmosphere,
            applyChemPreset,
            updateGlazeChemistrySimulation,
            exportGlazeFormulaCard
        }
    });
})(window);
