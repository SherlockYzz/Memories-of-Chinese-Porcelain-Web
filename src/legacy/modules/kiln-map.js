/**
 * 模块：九州名窑地理舆图与 XRF 矿物档案 (kiln-map)
 */
(function (global) {
    'use strict';

    let selectedKilnId = 'ru';
    let activeMapLayer = 'all';

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function switchKilnMapLayer(layerKey) {
        activeMapLayer = layerKey;
        document.querySelectorAll('.map-layer-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layer === layerKey);
        });
        renderKilnGeographyMap();
    }

    function renderKilnGeographyMap() {
        const svgBgContainer = document.getElementById('kiln-map-svg-bg');
        const spotsContainer = document.getElementById('kiln-map-spots');
        const infoContainer = document.getElementById('kiln-map-info');
        if (!spotsContainer || !infoContainer || typeof kilnGeographyData === 'undefined') return;

        const k = kilnGeographyData.find(item => item.id === selectedKilnId) || kilnGeographyData[0];

        if (svgBgContainer) {
            const capX = k.capitalTarget ? k.capitalTarget[0] * 10 : 570;
            const capY = k.capitalTarget ? k.capitalTarget[1] * 4.6 : 193;
            const expX = k.exportTarget ? k.exportTarget[0] * 10 : 850;
            const expY = k.exportTarget ? k.exportTarget[1] * 4.6 : 300;
            const curX = k.x * 10;
            const curY = k.y * 4.6;
            const midX = (curX + capX) / 2 - 22;
            const midY = (curY + capY) / 2 - 28;

            const showTribute = activeMapLayer === 'all' || activeMapLayer === 'tribute';
            const showMaritime = activeMapLayer === 'all' || activeMapLayer === 'maritime';

            svgBgContainer.innerHTML = `
                <svg viewBox="0 0 1000 460" preserveAspectRatio="xMidYMid slice" class="w-full h-full" aria-hidden="true">
                    <defs>
                        <radialGradient id="mapGlow" cx="58%" cy="48%" r="52%">
                            <stop offset="0%" stop-color="rgba(124, 170, 180, 0.24)"/>
                            <stop offset="60%" stop-color="rgba(22, 38, 48, 0.12)"/>
                            <stop offset="100%" stop-color="rgba(10, 16, 22, 0)"/>
                        </radialGradient>
                        <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="rgba(124, 170, 180, 0.12)"/>
                            <stop offset="55%" stop-color="rgba(139, 194, 206, 0.65)"/>
                            <stop offset="100%" stop-color="rgba(212, 175, 106, 0.45)"/>
                        </linearGradient>
                    </defs>
                    <g stroke="rgba(143, 184, 192, 0.06)" stroke-width="1">
                        ${[80,160,240,320,400,480,560,640,720,800,880].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="460"/>`).join('')}
                        ${[65,130,195,260,325,390].map(y => `<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`).join('')}
                    </g>
                    <rect width="1000" height="460" fill="url(#mapGlow)"/>
                    <path d="M 120,160 L 185,115 L 285,120 L 380,95 L 490,85 L 580,52 L 665,38 L 725,65 L 690,108 L 625,118 L 615,148 L 668,142 L 698,162 L 665,192 L 732,225 L 775,265 L 762,315 L 718,365 L 642,398 L 560,415 L 480,395 L 365,405 L 250,365 L 165,290 L 115,220 Z"
                          fill="rgba(124, 170, 180, 0.09)" stroke="rgba(143, 184, 192, 0.38)" stroke-width="2"/>
                    <ellipse cx="792" cy="352" rx="12" ry="26" transform="rotate(15 792 352)" fill="rgba(124, 170, 180, 0.14)" stroke="rgba(143, 184, 192, 0.4)" stroke-width="1.4"/>
                    <ellipse cx="578" cy="434" rx="18" ry="11" transform="rotate(-12 578 434)" fill="rgba(124, 170, 180, 0.14)" stroke="rgba(143, 184, 192, 0.4)" stroke-width="1.4"/>
                    <g fill="rgba(143, 184, 192, 0.14)" stroke="rgba(143, 184, 192, 0.30)" stroke-width="1.2">
                        <path d="M 505,155 L 525,118 L 548,155 L 568,125 L 590,155 Z"/>
                        <path d="M 410,215 L 438,178 L 465,215 L 488,186 L 512,215 Z"/>
                        <path d="M 635,335 L 658,298 L 682,335 L 705,305 L 728,335 Z"/>
                    </g>
                    <path d="M 210,245 Q 290,210 345,148 L 415,148 L 425,208 L 535,198 Q 595,182 632,145" fill="none" stroke="url(#riverGrad)" stroke-width="2.8" stroke-linecap="round"/>
                    <text x="348" y="138" fill="rgba(143,184,192,0.58)" font-size="11" font-family="serif">${tr('九曲黄河')}</text>
                    <path d="M 195,315 Q 325,305 435,282 Q 535,305 615,275 Q 685,265 748,248" fill="none" stroke="url(#riverGrad)" stroke-width="3.2" stroke-linecap="round"/>
                    <text x="415" y="274" fill="rgba(143,184,192,0.58)" font-size="11" font-family="serif">${tr('万里长江')}</text>
                    <path d="M 570,193 Q 645,228 710,280" fill="none" stroke="rgba(229, 200, 136, 0.32)" stroke-width="1.8" stroke-dasharray="4,4"/>
                    <text x="642" y="224" fill="rgba(229,200,136,0.55)" font-size="10" font-family="serif">${tr('汴河御漕')}</text>
                    <g>
                        <circle cx="570" cy="193" r="5" fill="#E5C888" stroke="#A8383B" stroke-width="2"/>
                        <text x="580" y="190" fill="#F7D89C" font-size="11" font-weight="bold" font-family="serif">★ ${tr('东京汴梁')}</text>
                        <circle cx="710" cy="280" r="5" fill="#E5C888" stroke="#A8383B" stroke-width="2"/>
                        <text x="720" y="278" fill="#F7D89C" font-size="11" font-weight="bold" font-family="serif">★ ${tr('行在临安')}</text>
                    </g>
                    ${showMaritime ? `
                    <path d="M 745,265 Q 845,250 915,195" fill="none" stroke="rgba(139, 194, 206, 0.45)" stroke-width="1.6" stroke-dasharray="5,5"/>
                    <path d="M 735,345 Q 835,385 885,435" fill="none" stroke="rgba(139, 194, 206, 0.45)" stroke-width="1.6" stroke-dasharray="5,5"/>
                    <path d="M ${curX},${curY} Q ${(curX + expX)/2},${(curY + expY)/2 - 20} ${expX},${expY}" fill="none" stroke="rgba(139, 194, 206, 0.55)" stroke-width="1.8" stroke-dasharray="3,5"/>
                    <text x="825" y="242" fill="rgba(139,194,206,0.7)" font-size="10" font-family="serif">${tr('海上丝路·东洋航线')}</text>
                    <text x="805" y="418" fill="rgba(139,194,206,0.7)" font-size="10" font-family="serif">${tr('海上丝路·西洋航线')}</text>
                    ` : ''}
                    ${showTribute ? `
                    <path d="M ${curX},${curY} Q ${midX},${midY} ${capX},${capY}" fill="none" stroke="#F5B841" stroke-width="2.8" stroke-dasharray="7,4"/>
                    ` : ''}
                </svg>
            `;
        }

        spotsContainer.innerHTML = kilnGeographyData.map(item => `
            <button class="kiln-map-spot ${item.id === selectedKilnId ? 'active' : ''}" style="top:${item.y}%; left:${item.x}%;" data-action="selectKilnSpot('${item.id}')" title="${tr(item.name)}" aria-label="${tr(item.name)}">
                <span class="spot-ping"></span>
                <span class="spot-dot"></span>
                <span class="spot-label">${tr(item.shortName || item.name.split(' · ')[0])}</span>
            </button>
        `).join('');

        const comp = k.composition || { SiO2: 65, Al2O3: 18, Fe2O3: 2.5, CaO: 8 };

        infoContainer.innerHTML = `
            <div class="space-y-4">
                <div class="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-border-light">
                    <div>
                        <span class="badge bg-tianqing-deep text-white text-xs mb-1.5">${tr(k.status)}</span>
                        <h3 class="text-xl font-serif-cn text-text-title font-semibold">${tr(k.name)}</h3>
                        <p class="text-xs text-tianqing-deep font-medium mt-0.5"><i class="fa-solid fa-location-dot mr-1" aria-hidden="true"></i>${tr(k.province)} · ${tr(k.era)}</p>
                    </div>
                </div>

                <div class="p-3.5 rounded-xl bg-bg-main border border-border-light text-xs text-text-body space-y-2.5">
                    <div>
                        <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-gem text-amber-400 mr-1" aria-hidden="true"></i>【${tr('天然矿脉与水土禀赋')}】</strong>
                        <p class="font-light mt-1 leading-relaxed">${tr(k.mineral)}</p>
                    </div>
                    <div class="pt-2 border-t border-border-light">
                        <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-route text-tianqing-deep mr-1" aria-hidden="true"></i>【${tr('皇家御贡漕运脉络')}】</strong>
                        <p class="text-amber-400 mt-1 font-serif-cn">${tr(k.tributeRoute || '水陆联运直达京师大内')}</p>
                    </div>
                    <div class="pt-2 border-t border-border-light">
                        <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-crown text-tianqing-deep mr-1" aria-hidden="true"></i>【${tr('传世代表标准器')}】</strong>
                        <p class="text-tianqing-deep mt-1 font-medium">${tr(k.masterpiece)}</p>
                    </div>
                </div>

                <div class="p-3.5 rounded-xl bg-yuebai/40 border border-border-light space-y-2 text-xs">
                    <div class="flex items-center justify-between font-serif-cn text-text-title font-medium">
                        <span><i class="fa-solid fa-flask-vial text-tianqing-deep mr-1" aria-hidden="true"></i>${tr('典型胎釉氧化物配比 (XRF 实测均值)')}</span>
                        <span class="text-[10px] font-mono text-text-muted">wt%</span>
                    </div>
                    <div class="grid grid-cols-4 gap-2 text-center pt-1">
                        <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                            <span class="text-[10px] text-text-muted block">SiO₂ ${tr('硅')}</span>
                            <strong class="font-mono text-tianqing-deep">${comp.SiO2}%</strong>
                        </div>
                        <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                            <span class="text-[10px] text-text-muted block">Al₂O₃ ${tr('铝')}</span>
                            <strong class="font-mono text-text-title">${comp.Al2O3}%</strong>
                        </div>
                        <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                            <span class="text-[10px] text-text-muted block">Fe₂O₃ ${tr('铁')}</span>
                            <strong class="font-mono text-amber-400">${comp.Fe2O3}%</strong>
                        </div>
                        <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                            <span class="text-[10px] text-text-muted block">CaO ${tr('钙助熔')}</span>
                            <strong class="font-mono text-text-body">${comp.CaO}%</strong>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                    <span class="text-text-muted text-[11px]">*${tr('金色虚线为御贡漕运路线，青色虚线为海上丝路')}</span>
                    <button data-action="loadComparisonModelTo3D(${k.modelIdx || 0})" class="px-4 py-2 rounded-full bg-tianqing-deep text-white font-serif-cn hover:bg-tianqing transition-colors flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-cube text-[10px]" aria-hidden="true"></i>
                        <span>${tr('调入3D展厅观摩')}</span>
                    </button>
                </div>
            </div>
        `;
    }

    function selectKilnSpot(id) {
        selectedKilnId = id;
        renderKilnGeographyMap();
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2760);
    }

    global.AppRegistry.register({
        id: 'kiln-map',
        phase: 2,
        init: renderKilnGeographyMap,
        onLangChange: renderKilnGeographyMap,
        getSearchItems: function () {
            if (typeof kilnGeographyData === 'undefined') return [];
            return kilnGeographyData.map(k => ({
                type: tr('九州名窑舆图'),
                icon: 'fa-map-location-dot',
                title: tr(k.name),
                sub: `${tr(k.province)} · ${tr(k.masterpiece)}`,
                action: () => {
                    selectKilnSpot(k.id);
                    const el = document.getElementById('kiln-map-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
            }));
        },
        publicApi: { renderKilnGeographyMap, selectKilnSpot, switchKilnMapLayer },
        globalBindings: { renderKilnGeographyMap, selectKilnSpot, switchKilnMapLayer }
    });
})(window);
