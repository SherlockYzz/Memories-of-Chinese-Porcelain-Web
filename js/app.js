/**
 * 华夏器道 · 天青泥火 — 前端综合调度主控制器 (National Award Flagship App Controller)
 * 核心涵盖：
 * 1. 首屏水墨流金粒子动态背景 (#hero-ambient-canvas) 与特展双模展柜切换
 * 2. 宣纸雅集(Light) / 玄金暗夜博物院(Dark) 双主题实时切换
 * 3. 高精度 SVG 中国山川河洛、黄河长江汴河水系与海上丝路御贡图谱 (#kiln-map-svg-bg)
 * 4. 古瓷釉料矿物化学配比与还原焰/氧化焰实时试烧实验室 (#glaze-chem-lab)
 * 5. 宋代《大观茶论》建盏七汤点茶与水丹青茶百戏交互体验 (#tea-whisk-canvas)
 * 6. 历代官窑纪年款识大辞典、博古殿试互动考卷与全局命令检索面板 (Ctrl/Cmd + K)
 */

function safeRun(taskName, fn) {
    try {
        fn();
    } catch (err) {
        console.warn(`[华夏器道-防御运行] ${taskName} 初始化异常:`, err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 阶段一：核心交互与首屏展台初始化
    safeRun('导航与滚动', setupNavAndScroll);
    safeRun('移动端菜单', setupMobileMenu);
    safeRun('首屏流金粒子', initHeroAmbientCanvas);
    safeRun('3D展馆', () => { if (typeof initThreeJS === 'function') initThreeJS(); });

    const langToggleBtn = document.getElementById('lang-toggle');
    if (langToggleBtn && typeof toggleLanguage === 'function') {
        langToggleBtn.addEventListener('click', toggleLanguage);
    }

    // 阶段二：次屏交互与主画廊 (第二帧平滑渲染)
    requestAnimationFrame(() => {
        safeRun('典藏图录', renderArchiveGrid);
        safeRun('历史通史', renderHistoryTimeline);
        safeRun('窑系地理', renderKilnGeographyMap);
        safeRun('拉坯工坊', () => { if (typeof initPotteryWorkshop === 'function') initPotteryWorkshop(); });
        safeRun('宋代点茶模拟器', initTeaWhiskingSimulator);
    });

    // 阶段三：长页面深度研学与富交互组件微任务切片 (主线程零卡顿)
    setTimeout(() => {
        safeRun('制瓷工序', renderWorkshopGrid);
        safeRun('传统色谱', renderTraditionalColors);
        safeRun('釉料化学实验室', initGlazeChemistryLab);
        safeRun('文人四艺', renderLiteratiArts);
        safeRun('历代官窑款识', renderImperialReignMarks);
        safeRun('研考手记', renderScholarNotes);
        safeRun('博古殿试考卷', initScholarQuiz);
        safeRun('名瓷对比', initPorcelainComparison);
        safeRun('五音瓷鸣', renderPentatonicPanel);
        safeRun('研习笔记', initStudyNotebook);
        safeRun('显微开片', renderMicroscopeLens);
        safeRun('全局命令面板', initCommandPalette);
        safeRun('AI识瓷', () => { if (typeof initAiRecognition === 'function') initAiRecognition(); });
        safeRun('视听研学展映', () => {
            if (typeof initVideoLazyLoader === 'function') {
                initVideoLazyLoader();
            }
        });
    }, 80);
});

// ================================================================
// 零、首屏水墨流金氛围粒子画布 & 展柜切换 & 昼夜主题切换
// ================================================================
function initHeroAmbientCanvas() {
    const canvas = document.getElementById('hero-ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = Math.max(720, window.innerHeight);

    const particles = [];
    for (let i = 0; i < 64; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 1.0 + Math.random() * 2.5,
            vx: (Math.random() - 0.5) * 0.32,
            vy: -0.22 - Math.random() * 0.42,
            gold: i % 3 === 0,
            alpha: 0.22 + Math.random() * 0.55
        });
    }

    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = Math.max(720, window.innerHeight);
    });

    let lastHeroTick = 0;
    function drawHeroParticles(now) {
        requestAnimationFrame(drawHeroParticles);
        if (now && now - lastHeroTick < 32) return;
        lastHeroTick = now || 0;
        ctx.clearRect(0, 0, w, h);
        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -10) p.y = h + 10;
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;

            ctx.fillStyle = p.gold
                ? `rgba(212, 175, 106, ${p.alpha})`
                : `rgba(143, 184, 192, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    drawHeroParticles();
}

function switchHeroShowcase(imgSrc, titleText, modelIdx, btnEl) {
    const imgEl = document.getElementById('hero-featured-img');
    if (imgEl) {
        imgEl.style.opacity = '0.2';
        imgEl.style.transform = 'scale(0.96)';
        setTimeout(() => {
            imgEl.src = imgSrc;
            imgEl.style.opacity = '1';
            imgEl.style.transform = 'scale(1)';
        }, 160);
    }
    const headerSpan = document.getElementById('hero-showcase-title');
    if (headerSpan) headerSpan.textContent = titleText;

    document.querySelectorAll('.hero-thumb-btn').forEach(b => {
        b.classList.remove('border-amber-400', 'ring-2');
        b.classList.add('border-white/10');
    });
    if (btnEl) {
        btnEl.classList.add('border-amber-400', 'ring-2');
        btnEl.classList.remove('border-white/10');
    }

    if (typeof loadPorcelainModel === 'function' && modelIdx !== undefined) {
        loadPorcelainModel(modelIdx);
    }
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2520);
}

function setMuseumTheme(theme, showToastMsg = true) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);

    // 1. 同步顶部导航栏主题按钮
    const navIcon = document.getElementById('theme-toggle-icon');
    const navLabel = document.getElementById('theme-toggle-label');

    // 2. 同步 3D 展馆 C 位显性切换胶囊
    const stageBtnDay = document.getElementById('stage-btn-day');
    const stageBtnNight = document.getElementById('stage-btn-night');

    // 3. 同步屏幕右侧常驻浮动罗盘
    const floatIcon = document.getElementById('floating-theme-icon');
    const floatTitle = document.getElementById('floating-theme-title');
    const floatSub = document.getElementById('floating-theme-sub');

    if (theme === 'dark') {
        // 暗夜模式【夜宴观瓷】
        if (navIcon) navIcon.className = 'fa-solid fa-sun text-amber-400 text-xs';
        if (navLabel) navLabel.textContent = '晴窗抚古';

        if (stageBtnDay) {
            stageBtnDay.classList.remove('active-theme-pill');
            stageBtnDay.classList.add('text-text-muted');
        }
        if (stageBtnNight) {
            stageBtnNight.classList.add('active-theme-pill');
            stageBtnNight.classList.remove('text-text-muted');
        }

        if (floatIcon) floatIcon.className = 'fa-solid fa-sun text-amber-400';
        if (floatTitle) { floatTitle.textContent = '切至白昼晴窗'; floatTitle.className = 'font-bold text-tianqing-deep'; }
        if (floatSub) floatSub.textContent = '当前：暗夜夜宴';

        if (showToastMsg && typeof showToast === 'function') {
            showToast('🌙 已切换至【夜宴观瓷 · 故宫夜巡】暗夜沉浸主题！浑天流金星轨与烛光已亮起');
        }
        if (typeof switchRealisticSceneEnv === 'function') {
            switchRealisticSceneEnv('palace', false);
        }
    } else {
        // 白昼模式【晴窗抚古】
        if (navIcon) navIcon.className = 'fa-solid fa-moon text-tianqing-deep text-xs';
        if (navLabel) navLabel.textContent = '夜宴观瓷';

        if (stageBtnDay) {
            stageBtnDay.classList.add('active-theme-pill');
            stageBtnDay.classList.remove('text-text-muted');
        }
        if (stageBtnNight) {
            stageBtnNight.classList.remove('active-theme-pill');
            stageBtnNight.classList.add('text-text-muted');
        }

        if (floatIcon) floatIcon.className = 'fa-solid fa-moon text-blue-400';
        if (floatTitle) { floatTitle.textContent = '切至暗夜夜宴'; floatTitle.className = 'font-bold text-amber-500'; }
        if (floatSub) floatSub.textContent = '当前：白昼晴窗';

        if (showToastMsg && typeof showToast === 'function') {
            showToast('☀️ 已切换至【晴窗抚古 · 澄心堂】宋韵白昼宣纸雅集主题！温润天光映照青瓷玉质');
        }
        if (typeof switchRealisticSceneEnv === 'function') {
            switchRealisticSceneEnv('studio', false);
        }
    }

    // 触发全局 3D 引力冲击波，令用户视觉震撼感知昼夜气象切换！
    if (typeof window.triggerOrientalShockwave === 'function') {
        window.triggerOrientalShockwave(window.innerWidth * 0.5, window.innerHeight * 0.5);
    }
}

function toggleMuseumTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    setMuseumTheme(next, true);
}

// ================================================================
// 一、华夏陶瓷八千年通史长卷渲染 (含热工与吸水率量化指标)
// ================================================================
var currentLang = (typeof window !== 'undefined' && window.currentLang) || 'zh';
let currentHistoryId = 'song';

function renderHistoryTimeline() {
    const navContainer = document.getElementById('history-nav-nodes');
    const displayContainer = document.getElementById('history-active-display');
    if (!navContainer || !displayContainer) return;
    const lang = (typeof window !== 'undefined' && window.currentLang) || currentLang || 'zh';

    navContainer.innerHTML = historyPeriods.map((p, idx) => `
        <button class="history-node-btn px-4 py-2.5 rounded-full text-xs font-serif-cn transition-all shrink-0 flex items-center gap-1.5 ${p.id === currentHistoryId ? 'bg-tianqing-deep text-white shadow-md ring-2' : 'bg-yuebai text-text-body hover:bg-tianqing'}" onclick="selectHistoryPeriod('${p.id}')">
            <span class="font-mono text-[10px] opacity-75">0${idx + 1}</span>
            <span>${(p.label && p.label[lang]) || (p.label && p.label['zh']) || ''}</span>
        </button>
    `).join('');

    const curIdx = historyPeriods.findIndex(item => item.id === currentHistoryId);
    const p = historyPeriods[curIdx >= 0 ? curIdx : 3];
    const prevId = historyPeriods[(curIdx - 1 + historyPeriods.length) % historyPeriods.length].id;
    const nextId = historyPeriods[(curIdx + 1) % historyPeriods.length].id;

    displayContainer.innerHTML = `
        <div class="feature-card p-6 sm:p-8 space-y-6">
            <div class="flex flex-col md:flex-row items-center gap-8">
                <div class="w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden shadow-md shrink-0 bg-black relative border border-border-light group">
                    <img src="${p.img}" alt="${(p.title && p.title[lang]) || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-amber-200 text-xs font-serif-cn border border-white/10">
                        ${p.year}
                    </div>
                    <div class="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-mono border border-white/10">
                        🔥 烧成温度：${p.temp || '1260℃'}
                    </div>
                </div>
                <div class="flex-1 space-y-4 text-left">
                    <div class="flex items-center justify-between">
                        <span class="badge bg-tianqing-deep text-white text-xs">${(p.label && p.label[lang]) || ''}</span>
                        <div class="flex items-center gap-2">
                            <button onclick="selectHistoryPeriod('${prevId}')" class="w-8 h-8 rounded-full bg-yuebai border border-border-light flex items-center justify-center text-xs hover:bg-tianqing hover:text-white transition-colors" title="上一历史时期">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <button onclick="selectHistoryPeriod('${nextId}')" class="w-8 h-8 rounded-full bg-yuebai border border-border-light flex items-center justify-center text-xs hover:bg-tianqing hover:text-white transition-colors" title="下一历史时期">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <h3 class="text-2xl font-serif-cn text-text-title font-semibold leading-snug">${(p.title && p.title[lang]) || ''}</h3>
                    <p class="text-xs text-amber-400 italic font-serif-cn">${p.quote || ''}</p>
                    <p class="text-sm text-text-body leading-relaxed font-light">${(p.desc && p.desc[lang]) || ''}</p>

                    <!-- 历史阶段四大技术量化指标 -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                        <div class="p-2.5 rounded-xl bg-bg-main border border-border-light">
                            <span class="text-[10px] text-text-muted block">核心烧结温度</span>
                            <strong class="font-mono text-amber-400">${p.temp || '1250℃'}</strong>
                        </div>
                        <div class="p-2.5 rounded-xl bg-bg-main border border-border-light">
                            <span class="text-[10px] text-text-muted block">胎体致密/吸水率</span>
                            <strong class="font-serif-cn text-tianqing-deep">${p.porosity || '< 0.5%'}</strong>
                        </div>
                        <div class="p-2.5 rounded-xl bg-bg-main border border-border-light col-span-2 sm:col-span-1">
                            <span class="text-[10px] text-text-muted block">代表窑炉制度</span>
                            <strong class="font-serif-cn text-text-title">${p.kilnType || '龙窑/馒头窑'}</strong>
                        </div>
                    </div>

                    <div class="pt-3 flex items-center justify-between text-xs text-text-muted border-t border-border-light">
                        <span><i class="fa-solid fa-flask text-tianqing-deep mr-1"></i>釉料体系：${p.glazeSystem || ''}</span>
                        <button onclick="loadComparisonModelTo3D(${p.modelIdx || 0})" class="text-tianqing-deep font-medium hover:underline font-serif-cn">
                            在3D展厅观摩此时期代表器 &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function selectHistoryPeriod(id) {
    currentHistoryId = id;
    renderHistoryTimeline();
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2350);
}

// ================================================================
// 一点五、九州名窑地理图谱 (高精度中国疆域、黄河长江汴河水系与海上丝路舆图)
// ================================================================
let selectedKilnId = 'ru';
let activeMapLayer = 'all'; // 'all' | 'tribute' | 'maritime'

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
    if (!spotsContainer || !infoContainer) return;

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
            <svg viewBox="0 0 1000 460" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
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

                <!-- 宋代《禹迹图》计里画方经纬古格网 -->
                <g stroke="rgba(143, 184, 192, 0.06)" stroke-width="1">
                    ${[80,160,240,320,400,480,560,640,720,800,880].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="460"/>`).join('')}
                    ${[65,130,195,260,325,390].map(y => `<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`).join('')}
                </g>

                <rect width="1000" height="460" fill="url(#mapGlow)"/>

                <!-- 高精度华夏神州疆域轮廓 + 山东半岛/辽东/江南海岸线 + 海南与台湾岛 -->
                <path d="M 120,160 L 185,115 L 285,120 L 380,95 L 490,85 L 580,52 L 665,38 L 725,65 L 690,108 L 625,118 L 615,148 L 668,142 L 698,162 L 665,192 L 732,225 L 775,265 L 762,315 L 718,365 L 642,398 L 560,415 L 480,395 L 365,405 L 250,365 L 165,290 L 115,220 Z"
                      fill="rgba(124, 170, 180, 0.09)" stroke="rgba(143, 184, 192, 0.38)" stroke-width="2"/>

                <!-- 台湾岛与海南岛轮廓 -->
                <ellipse cx="792" cy="352" rx="12" ry="26" transform="rotate(15 792 352)" fill="rgba(124, 170, 180, 0.14)" stroke="rgba(143, 184, 192, 0.4)" stroke-width="1.4"/>
                <ellipse cx="578" cy="434" rx="18" ry="11" transform="rotate(-12 578 434)" fill="rgba(124, 170, 180, 0.14)" stroke="rgba(143, 184, 192, 0.4)" stroke-width="1.4"/>

                <!-- 水墨山脉群 (太行山、秦岭嵩山、武夷括苍山) -->
                <g fill="rgba(143, 184, 192, 0.14)" stroke="rgba(143, 184, 192, 0.30)" stroke-width="1.2">
                    <path d="M 505,155 L 525,118 L 548,155 L 568,125 L 590,155 Z"/>
                    <path d="M 410,215 L 438,178 L 465,215 L 488,186 L 512,215 Z"/>
                    <path d="M 635,335 L 658,298 L 682,335 L 705,305 L 728,335 Z"/>
                </g>

                <!-- 九曲黄河水系 (几字湾入渤海) -->
                <path d="M 210,245 Q 290,210 345,148 L 415,148 L 425,208 L 535,198 Q 595,182 632,145"
                      fill="none" stroke="url(#riverGrad)" stroke-width="2.8" stroke-linecap="round"/>
                <text x="348" y="138" fill="rgba(143,184,192,0.58)" font-size="11" font-family="serif">九曲黄河</text>

                <!-- 万里长江水系 (入东海) -->
                <path d="M 195,315 Q 325,305 435,282 Q 535,305 615,275 Q 685,265 748,248"
                      fill="none" stroke="url(#riverGrad)" stroke-width="3.2" stroke-linecap="round"/>
                <text x="415" y="274" fill="rgba(143,184,192,0.58)" font-size="11" font-family="serif">万里长江</text>

                <!-- 宋代汴河/大运河漕运水道 (连接汴京与临安) -->
                <path d="M 570,193 Q 645,228 710,280"
                      fill="none" stroke="rgba(229, 200, 136, 0.32)" stroke-width="1.8" stroke-dasharray="4,4"/>
                <text x="642" y="224" fill="rgba(229,200,136,0.55)" font-size="10" font-family="serif">汴河御漕</text>

                <!-- 两宋双都城地标：北宋东京汴梁 & 南宋行在临安 -->
                <g>
                    <circle cx="570" cy="193" r="5" fill="#E5C888" stroke="#A8383B" stroke-width="2"/>
                    <text x="580" y="190" fill="#F7D89C" font-size="11" font-weight="bold" font-family="serif">★ 东京汴梁</text>
                    <circle cx="710" cy="280" r="5" fill="#E5C888" stroke="#A8383B" stroke-width="2"/>
                    <text x="720" y="278" fill="#F7D89C" font-size="11" font-weight="bold" font-family="serif">★ 行在临安</text>
                </g>

                ${showMaritime ? `
                <!-- 海上丝绸之路外销瓷航线 (明州/泉州/广州 -> 东亚/南洋/波斯) -->
                <path d="M 745,265 Q 845,250 915,195" fill="none" stroke="rgba(139, 194, 206, 0.45)" stroke-width="1.6" stroke-dasharray="5,5"/>
                <path d="M 735,345 Q 835,385 885,435" fill="none" stroke="rgba(139, 194, 206, 0.45)" stroke-width="1.6" stroke-dasharray="5,5"/>
                <path d="M ${curX},${curY} Q ${(curX + expX)/2},${(curY + expY)/2 - 20} ${expX},${expY}" fill="none" stroke="rgba(139, 194, 206, 0.55)" stroke-width="1.8" stroke-dasharray="3,5"/>
                <text x="825" y="242" fill="rgba(139,194,206,0.7)" font-size="10" font-family="serif">海上丝路·东洋航线</text>
                <text x="805" y="418" fill="rgba(139,194,206,0.7)" font-size="10" font-family="serif">海上丝路·西洋航线</text>
                ` : ''}

                ${showTribute ? `
                <!-- 当前选中名窑至两宋都城的动态鎏金御贡专道 -->
                <path d="M ${curX},${curY} Q ${midX},${midY} ${capX},${capY}"
                      fill="none" stroke="#F5B841" stroke-width="2.8" stroke-dasharray="7,4"/>
                ` : ''}
            </svg>
        `;
    }

    spotsContainer.innerHTML = kilnGeographyData.map(item => `
        <button class="kiln-map-spot ${item.id === selectedKilnId ? 'active' : ''}" style="top:${item.y}%; left:${item.x}%;" onclick="selectKilnSpot('${item.id}')" title="${item.name}">
            <span class="spot-ping"></span>
            <span class="spot-dot"></span>
            <span class="spot-label">${item.shortName || item.name.split(' · ')[0]}</span>
        </button>
    `).join('');

    const comp = k.composition || { SiO2: 65, Al2O3: 18, Fe2O3: 2.5, CaO: 8 };

    infoContainer.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-border-light">
                <div>
                    <span class="badge bg-tianqing-deep text-white text-xs mb-1.5">${k.status}</span>
                    <h3 class="text-xl font-serif-cn text-text-title font-semibold">${k.name}</h3>
                    <p class="text-xs text-tianqing-deep font-medium mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>${k.province} · ${k.era}</p>
                </div>
            </div>

            <div class="p-3.5 rounded-xl bg-bg-main border border-border-light text-xs text-text-body space-y-2.5">
                <div>
                    <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-gem text-amber-400 mr-1"></i>【天然矿脉与水土禀赋】</strong>
                    <p class="font-light mt-1 leading-relaxed">${k.mineral}</p>
                </div>
                <div class="pt-2 border-t border-border-light">
                    <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-route text-tianqing-deep mr-1"></i>【皇家御贡漕运脉络】</strong>
                    <p class="text-amber-400 mt-1 font-serif-cn">${k.tributeRoute || '水陆联运直达京师大内'}</p>
                </div>
                <div class="pt-2 border-t border-border-light">
                    <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-crown text-tianqing-deep mr-1"></i>【传世代表标准器】</strong>
                    <p class="text-tianqing-deep mt-1 font-medium">${k.masterpiece}</p>
                </div>
            </div>

            <!-- 胎釉核心氧化物XRF实测化学配比条 -->
            <div class="p-3.5 rounded-xl bg-yuebai/40 border border-border-light space-y-2 text-xs">
                <div class="flex items-center justify-between font-serif-cn text-text-title font-medium">
                    <span><i class="fa-solid fa-flask-vial text-tianqing-deep mr-1"></i>典型胎釉氧化物配比 (XRF 实测均值)</span>
                    <span class="text-[10px] font-mono text-text-muted">wt%</span>
                </div>
                <div class="grid grid-cols-4 gap-2 text-center pt-1">
                    <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                        <span class="text-[10px] text-text-muted block">SiO₂ 硅</span>
                        <strong class="font-mono text-tianqing-deep">${comp.SiO2}%</strong>
                    </div>
                    <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                        <span class="text-[10px] text-text-muted block">Al₂O₃ 铝</span>
                        <strong class="font-mono text-text-title">${comp.Al2O3}%</strong>
                    </div>
                    <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                        <span class="text-[10px] text-text-muted block">Fe₂O₃ 铁</span>
                        <strong class="font-mono text-amber-400">${comp.Fe2O3}%</strong>
                    </div>
                    <div class="p-1.5 rounded-lg bg-bg-main border border-border-light">
                        <span class="text-[10px] text-text-muted block">CaO 钙助熔</span>
                        <strong class="font-mono text-text-body">${comp.CaO}%</strong>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between text-xs pt-1">
                <span class="text-text-muted text-[11px]">*金色虚线为御贡漕运路线，青色虚线为海上丝路</span>
                <button onclick="loadComparisonModelTo3D(${k.modelIdx || 0})" class="px-4 py-2 rounded-full bg-tianqing-deep text-white font-serif-cn hover:bg-tianqing transition-colors flex items-center gap-1.5 shadow-sm">
                    <i class="fa-solid fa-cube text-[10px]"></i>
                    <span>调入3D展厅观摩</span>
                </button>
            </div>
        </div>
    `;
}

function selectKilnSpot(id) {
    selectedKilnId = id;
    renderKilnGeographyMap();
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2760);
}

// ================================================================
// 二、天工开物 · 七十二工核心工序网格
// ================================================================
function renderWorkshopGrid() {
    const container = document.getElementById('workshop-grid-container');
    if (!container) return;
    const lang = (typeof window !== 'undefined' && window.currentLang) || currentLang || 'zh';

    container.innerHTML = workshopSteps.map(step => `
        <div class="feature-card p-5 group cursor-pointer hover-lift flex flex-col justify-between" onclick="openStepDetailModal(${step.id})">
            <div>
                <div class="aspect-[4/3] rounded-xl overflow-hidden mb-3.5 bg-black relative border border-border-light">
                    <img src="${step.img}" alt="${(step.title && step.title[lang]) || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35"></div>
                    <span class="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-amber-200 text-[10px] px-2.5 py-1 rounded-full font-serif-cn border border-white/15 shadow-sm">
                        ${step.category}
                    </span>
                    <span class="absolute bottom-2 left-2.5 right-2.5 text-[10px] text-white/90 font-mono truncate">
                        ${step.params || ''}
                    </span>
                </div>
                <div class="flex items-center gap-2.5 mb-2">
                    <div class="w-8 h-8 rounded-full bg-yuebai flex items-center justify-center shrink-0 border border-border-light group-hover:bg-tianqing-deep transition-colors">
                        <i class="fa-solid ${step.icon} text-tianqing-deep group-hover:text-white text-xs transition-colors"></i>
                    </div>
                    <h4 class="text-base font-serif-cn text-text-title font-semibold">${(step.title && step.title[lang]) || ''}</h4>
                </div>
                <p class="text-xs text-text-body line-clamp-3 font-light leading-relaxed">${(step.desc && step.desc[lang]) || ''}</p>
            </div>
            <div class="mt-3.5 pt-2.5 border-t border-border-light flex items-center justify-between text-[11px] text-tianqing-deep">
                <span class="font-mono">《天工开物》规制 #0${step.id}</span>
                <span class="group-hover:translate-x-1 transition-transform font-serif-cn">详阅古法要略 <i class="fa-solid fa-chevron-right text-[9px]"></i></span>
            </div>
        </div>
    `).join('');
}

function openStepDetailModal(id) {
    const step = workshopSteps.find(s => s.id === id);
    if (!step) return;

    const modal = document.getElementById('universal-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalTitle || !modalBody) return;
    const lang = (typeof window !== 'undefined' && window.currentLang) || currentLang || 'zh';

    modalTitle.textContent = `${step.category} · ${(step.title && step.title[lang]) || ''}`;
    modalBody.innerHTML = `
        <div class="space-y-4 text-left">
            <div class="aspect-video rounded-xl overflow-hidden shadow-sm bg-black border border-border-light">
                <img src="${step.img}" alt="${(step.title && step.title[lang]) || ''}" class="w-full h-full object-cover">
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="badge bg-tianqing-deep text-white text-xs">${step.category}</span>
                <span class="text-xs font-mono text-amber-400">${step.params || ''}</span>
            </div>
            <div class="p-3.5 rounded-xl bg-yuebai/50 border border-border-light text-xs text-amber-400 font-serif-cn italic">
                ${step.ancientQuote || '《天工开物·陶埏》：“共计一坯工力，过手七十二，方克成器。”'}
            </div>
            <p class="text-sm text-text-body leading-relaxed font-light">${(step.desc && step.desc[lang]) || ''}</p>
            <div class="p-4 rounded-xl bg-bg-main text-xs text-text-body leading-relaxed border border-border-light">
                <strong class="font-medium text-text-title block mb-1 font-serif-cn">【非遗活态传承与热工控制要领】</strong>
                此道工序要求匠人顺应四时物候与水土秉性。若有毫厘之差，在后续 1300℃ 松柴还原烈焰中必致胎体变形开裂或釉面失色。古人云“一窑生一窑死，过手七十二方克成器”，恰在每一道工序的极致苛求。
            </div>
        </div>
    `;
    modal.classList.add('active');
}

// ================================================================
// 三、东方传统古瓷色谱 & 古瓷釉料化学配比实时实验室
// ================================================================
function renderTraditionalColors() {
    const container = document.getElementById('traditional-colors-grid');
    if (!container) return;

    container.innerHTML = traditionalColors.map(c => `
        <div class="feature-card p-5 flex flex-col justify-between group hover-lift text-left">
            <div>
                <div class="aspect-[16/9] rounded-xl mb-3.5 shadow-inner relative overflow-hidden flex items-end justify-between p-3 cursor-pointer border border-white/15" style="background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.38), transparent 65%), ${c.hex};" onclick="previewColorIn3D('${c.glazeKey || 'tianqing'}')">
                    <span class="text-[10px] text-white bg-black/55 backdrop-blur-sm px-2.5 py-0.5 rounded font-mono">${c.hex}</span>
                    <span class="text-[10px] text-white bg-black/55 backdrop-blur-sm px-2.5 py-0.5 rounded font-mono">RGB(${c.rgb})</span>
                </div>
                <div class="flex items-baseline justify-between mb-1">
                    <h4 class="text-lg font-serif-cn font-semibold text-text-title">${c.name}</h4>
                    <span class="text-[11px] text-text-muted font-serif-cn">${c.pinyin}</span>
                </div>
                <span class="text-[11px] text-tianqing-deep block mb-1.5 font-medium">${c.dynasty}</span>
                <div class="text-[10px] font-mono text-amber-400 bg-bg-main px-2.5 py-1 rounded border border-border-light mb-2 truncate" title="${c.oxide || ''}">
                    <i class="fa-solid fa-atom mr-1"></i>${c.oxide || 'Fe₂O₃ 高温还原显色'}
                </div>
                <p class="text-xs text-amber-200 italic mb-2 font-serif-cn">“${c.quote}”</p>
                <p class="text-xs text-text-body font-light leading-relaxed">${c.desc}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-xs">
                <button onclick="copyColorCode('${c.hex}')" class="text-text-muted hover:text-tianqing-deep transition-colors text-[11px]">
                    <i class="fa-regular fa-copy mr-1"></i>复制色值
                </button>
                <button onclick="previewColorIn3D('${c.glazeKey || 'tianqing'}')" class="text-tianqing-deep font-medium hover:underline text-[11px] font-serif-cn">
                    同步至 3D 展厅试烧 <i class="fa-solid fa-cube text-[9px] ml-0.5"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function previewColorIn3D(glazeKey) {
    if (typeof switchGlaze === 'function') switchGlaze(glazeKey);
    const el = document.getElementById('3d-gallery');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function copyColorCode(hex) {
    navigator.clipboard.writeText(hex).then(() => {
        showToast(`🎨 已成功复制传统古瓷釉色色值：${hex}`);
    }).catch(() => {
        showToast(`色值：${hex}`);
    });
}

// --- 古瓷釉料化学配比与窑炉气氛实时仿真实验室 ---
let chemState = {
    fe: 1.8,     // Fe2O3 (0 ~ 9.0%)
    cu: 0.0,     // CuO (0 ~ 2.0%)
    co: 0.0,     // CoO (0 ~ 2.0%)
    agate: 18,   // 玛瑙/石英分相微晶 (0 ~ 35%)
    atmosphere: 'reduction' // 'reduction' (CO强还原焰) | 'oxidation' (O2氧化焰)
};

function initGlazeChemistryLab() {
    updateGlazeChemistrySimulation();
}

function setGlazeChemAtmosphere(atm) {
    chemState.atmosphere = atm;
    document.querySelectorAll('.chem-atm-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.atm === atm);
    });
    updateGlazeChemistrySimulation();
    if (typeof playCrackleSound === 'function') playCrackleSound();
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

    // 根据氧化物配比与氧化/还原气氛计算实时釉色与物理诊断
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

    // 绘制实时试烧玉璧 Canvas
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

        // 玉璧外环
        ctx.beginPath();
        ctx.arc(cx, cy, 95, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(212, 175, 106, 0.55)';
        ctx.stroke();

        // 玛瑙乳光微晶散射点
        const dotCount = Math.floor(chemState.agate * 2.5);
        for (let i = 0; i < dotCount; i++) {
            const ang = (i * 2.4);
            const rad = 28 + ((i * 19) % 62);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.beginPath();
            ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // 玉璧中心穿孔
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

    if (titleEl) titleEl.textContent = glazeTitle;
    if (eqEl) eqEl.textContent = equation;
    if (mechEl) mechEl.textContent = mechanism;
    if (applyBtn) {
        applyBtn.onclick = () => previewColorIn3D(targetGlazeKey);
    }
}

// ================================================================
// 四、文人四艺 & 宋代《大观茶论》建盏七汤点茶·茶百戏交互体验
// ================================================================
function renderLiteratiArts() {
    const container = document.getElementById('four-arts-container');
    if (!container) return;

    container.innerHTML = literatiArts.map(art => `
        <div class="feature-card p-6 hover-lift text-left flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-yuebai flex items-center justify-center text-tianqing-deep text-xl border border-border-light">
                        <i class="fa-solid ${art.icon}"></i>
                    </div>
                    <span class="text-[10px] font-serif-cn text-text-muted bg-bg-main px-2.5 py-1 rounded-full border border-border-light">${art.classicSource || '宋代雅集'}</span>
                </div>
                <h4 class="text-xl font-serif-cn text-text-title font-semibold mb-1">${art.title}</h4>
                <span class="text-xs text-tianqing-deep font-medium block mb-2">雅集用器：${art.vessel}</span>
                <p class="text-xs text-amber-400 italic mb-3 font-serif-cn">“${art.quote}”</p>
                <p class="text-xs text-text-body font-light leading-relaxed">${art.desc}</p>
            </div>
        </div>
    `).join('');
}

// --- 宋代建盏七汤点茶与水丹青茶百戏互动模拟器 ---
let teaCanvas, teaCtx;
let teaFoamLevel = 0; // 0 ~ 100% (对应一汤至七汤咬盏)
let teaMotif = 'bamboo';
let isDrawingTea = false;
let userTeaStrokes = [];

function initTeaWhiskingSimulator() {
    teaCanvas = document.getElementById('tea-whisk-canvas');
    if (!teaCanvas) return;
    teaCtx = teaCanvas.getContext('2d');
    teaFoamLevel = 55; // 默认展示五汤乳雾成云，黑色曜变兔毫与雪白汤花完美交融
    teaMotif = 'bamboo'; // 默认浮显清风疎竹水丹青

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
        if (teaFoamLevel < 95) {
            teaFoamLevel = Math.min(100, teaFoamLevel + 12);
        }
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

    window.addEventListener('pointerup', () => {
        isDrawingTea = false;
    });

    drawTeaBowlCanvas();
    updateTeaStageBadge();
}

function whiskTeaStep() {
    teaFoamLevel = Math.min(100, teaFoamLevel + 25);
    if (typeof playCrackleSound === 'function') playCrackleSound();
    drawTeaBowlCanvas();
    updateTeaStageBadge();
    if (teaFoamLevel >= 100 && typeof showToast === 'function') {
        showToast('🍵 七汤击拂大成！乳花“咬盏”如积雪，可在盏面点绘水丹青茶百戏！');
    }
}

function setTeaBailiMotif(motif) {
    teaMotif = motif;
    teaFoamLevel = 100;
    userTeaStrokes = [];
    drawTeaBowlCanvas();
    updateTeaStageBadge();
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2640);
    const names = { bamboo: '清风疎竹', plum: '雪夜寒梅', crane: '松鹤延年', waves: '平湖秋月' };
    if (typeof showToast === 'function') {
        showToast(`🍵 已于建盏雪沫之上施展茶百戏：【${names[motif] || motif}】`);
    }
}

function resetTeaBowl() {
    teaFoamLevel = 15;
    teaMotif = 'none';
    userTeaStrokes = [];
    drawTeaBowlCanvas();
    updateTeaStageBadge();
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
    badge.textContent = `${stageNames[soupNum - 1]} (${Math.round(teaFoamLevel)}%)`;
}

function drawTeaBowlCanvas() {
    if (!teaCtx || !teaCanvas) return;
    const w = teaCanvas.width;
    const h = teaCanvas.height;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.44;

    teaCtx.clearRect(0, 0, w, h);

    // 1. 建阳水吉建盏粗黑铁胎外口沿与束口金圈
    teaCtx.beginPath();
    teaCtx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    teaCtx.fillStyle = '#1c1512';
    teaCtx.fill();
    teaCtx.lineWidth = 3;
    teaCtx.strokeStyle = '#9a6b2f';
    teaCtx.stroke();

    // 2. 建盏内部乌金银兔毫与曜变星空底釉
    const jianGrad = teaCtx.createRadialGradient(cx, cy, 8, cx, cy, r);
    jianGrad.addColorStop(0, '#0a0809');
    jianGrad.addColorStop(0.65, '#1d181a');
    jianGrad.addColorStop(0.92, '#3a2b22');
    jianGrad.addColorStop(1, '#523a28');
    teaCtx.beginPath();
    teaCtx.arc(cx, cy, r, 0, Math.PI * 2);
    teaCtx.fillStyle = jianGrad;
    teaCtx.fill();

    // 放射状银兔毫结晶条纹
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

    // 3. 击拂生成的雪白乳花汤沫层 (随 teaFoamLevel 扩展)
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

        // 旋涡状茶筅击拂纹理
        teaCtx.strokeStyle = 'rgba(210, 202, 185, 0.45)';
        teaCtx.lineWidth = 1.2;
        for (let ring = 18; ring < foamR * 0.85; ring += 14) {
            teaCtx.beginPath();
            teaCtx.arc(cx, cy, ring, 0, Math.PI * 1.65);
            teaCtx.stroke();
        }
    }

    // 4. 茶百戏水丹青图案 (在雪白汤花上显出深色茶汤或翠绿茶纹)
    if (teaFoamLevel >= 35 && teaMotif !== 'none') {
        teaCtx.save();
        teaCtx.translate(cx, cy);
        teaCtx.strokeStyle = 'rgba(42, 68, 54, 0.78)';
        teaCtx.fillStyle = 'rgba(42, 68, 54, 0.78)';
        teaCtx.lineCap = 'round';

        if (teaMotif === 'bamboo') {
            // 清风翠竹
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
            // 雪夜寒梅
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
            // 瑞鹤凌云
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

    // 5. 用户自由手绘水丹青笔迹
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

// ================================================================
// 五、传世名品典藏库 & 历代官窑纪年款识大辞典
// ================================================================
let currentArchiveFilter = 'all';

function filterArchivePorcelains(filterKey) {
    currentArchiveFilter = filterKey;
    document.querySelectorAll('.archive-filter-btn, .archive-dynasty-btn').forEach(btn => {
        const k = btn.dataset.filter || btn.dataset.dynasty;
        if (k === filterKey) {
            btn.classList.add('bg-tianqing-deep', 'text-white', 'active');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white', 'active');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
    renderArchiveGrid();
}

function renderArchiveGrid() {
    const container = document.getElementById('archive-grid-container');
    if (!container) return;

    const filtered = archivePorcelains.filter(item => {
        if (currentArchiveFilter === 'all') return true;
        if (currentArchiveFilter === 'scanned') return item.modelIdx >= 7 || (item.tags && item.tags.some(t => t.includes('扫描')));
        if (currentArchiveFilter === 'song') return item.dynastyKey === 'song' || item.name.includes('宋');
        if (currentArchiveFilter === 'ming') return item.dynastyKey === 'ming' || item.name.includes('明');
        if (currentArchiveFilter === 'qing') return item.dynastyKey === 'qing' || item.name.includes('清');
        if (currentArchiveFilter === 'tang') return item.dynastyKey === 'tang' || item.name.includes('唐') || item.period.includes('唐');
        if (currentArchiveFilter === 'yuan') return item.dynastyKey === 'yuan' || item.name.includes('元') || item.period.includes('元');
        return true;
    });

    container.innerHTML = filtered.map(item => {
        const isFav = studyBookmarks.includes(item.id);
        const dimensionText = item.specs || item.size || '';
        return `
        <div class="feature-card p-5 group cursor-pointer hover-lift relative text-left flex flex-col justify-between" onclick="openArchiveDetailModal(${item.id})">
            <div>
                <div class="aspect-square rounded-xl overflow-hidden mb-4 bg-black relative border border-border-light">
                    <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                    <span class="absolute top-2.5 right-2.5 bg-tianqing-deep text-white text-[10px] px-2.5 py-0.5 rounded-full font-serif-cn shadow-sm">
                        ${item.level}
                    </span>
                    <button onclick="event.stopPropagation(); toggleArchiveBookmark(${item.id});" class="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-black/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-tianqing-deep transition-colors" title="${isFav ? '从典藏集移除' : '收录入典藏集'}">
                        <i class="${isFav ? 'fa-solid text-amber-400' : 'fa-regular'} fa-bookmark text-xs"></i>
                    </button>
                </div>
                <h4 class="text-base font-serif-cn text-text-title font-semibold mb-1 truncate">${item.name}</h4>
                <p class="text-xs text-tianqing-deep font-medium mb-1">${item.kiln}</p>
                <p class="text-[11px] text-text-muted mb-2.5 font-mono">${dimensionText}</p>
                <div class="flex flex-wrap gap-1.5 mb-3">
                    ${(item.tags || []).map(t => `<span class="bg-yuebai text-text-body text-[10px] px-2 py-0.5 rounded border border-border-light">${t}</span>`).join('')}
                </div>
                <p class="text-xs text-text-body font-light line-clamp-2 leading-relaxed">${item.desc}</p>
            </div>
            <div class="mt-3.5 pt-2.5 border-t border-border-light text-[11px] text-tianqing-deep flex items-center justify-between">
                <span>查阅数字化研考档案</span>
                <button onclick="event.stopPropagation(); loadComparisonModelTo3D(${item.modelIdx !== undefined ? item.modelIdx : 0})" class="text-amber-400 hover:underline font-serif-cn">
                    3D全息检视 &rarr;
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function renderImperialReignMarks() {
    const container = document.getElementById('imperial-marks-grid');
    if (!container || typeof imperialReignMarks === 'undefined') return;

    container.innerHTML = imperialReignMarks.map(m => {
        const isCircle = m.style === 'blue-circle' || m.style === 'seal-round';
        const isCinnabar = m.style === 'cinnabar-square' || m.style === 'seal-round';
        const borderStyle = isCircle ? 'rounded-full border-2 border-double' : 'rounded-lg border-2';
        return `
            <div class="feature-card p-5 hover-lift text-left flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-4 mb-3.5">
                        <div class="w-16 h-16 ${borderStyle} shrink-0 flex flex-col items-center justify-center font-serif-cn font-bold text-sm leading-tight shadow-inner"
                             style="border-color: ${m.color}; color: ${ isCinnabar ? '#fff' : m.color }; background: ${ isCinnabar ? m.color : 'rgba(255,255,255,0.04)' };">
                            <span>${m.sealText[0]}</span>
                            <span>${m.sealText[1] || ''}</span>
                        </div>
                        <div>
                            <span class="text-[10px] font-mono text-amber-400 block">${m.era}</span>
                            <h4 class="text-sm sm:text-base font-serif-cn font-semibold text-text-title leading-snug mt-0.5">${m.title}</h4>
                            <span class="text-[11px] text-tianqing-deep">${m.type}</span>
                        </div>
                    </div>
                    <p class="text-xs text-text-body font-light leading-relaxed">${m.desc}</p>
                </div>
            </div>
        `;
    }).join('');
}

function openArchiveDetailModal(id) {
    const item = archivePorcelains.find(a => a.id === id);
    if (!item) return;

    const modal = document.getElementById('universal-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = item.name;
    modalBody.innerHTML = `
        <div class="space-y-4 text-left">
            <div class="aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-sm bg-black border border-border-light">
                <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover">
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-3">
                <div>
                    <span class="text-xs text-text-muted">窑口归属：</span>
                    <strong class="text-sm font-medium text-text-title font-serif-cn">${item.kiln}</strong>
                </div>
                <span class="badge bg-tianqing-deep text-white text-xs">${item.level}</span>
            </div>
            <div class="text-xs text-text-body space-y-2 font-light">
                <p><strong>实测规制：</strong>${item.size}</p>
                <p><strong>馆藏出处：</strong>${item.collection || '华夏器道数字典藏'}</p>
                <p><strong>典型器型特征：</strong>${item.desc}</p>
            </div>
            <div class="p-4 rounded-xl bg-yuebai/50 text-xs text-text-body leading-relaxed border border-border-light">
                <strong class="font-medium text-text-title block mb-1">【数字化研考按语】</strong>
                此器物造型沉穆端庄，其釉汁层层厚施，微观100倍显微镜下可见特征气泡层与矿物结晶，属两宋至明初皇家御用或数字孪生典范之作。
            </div>
            <div class="pt-2 flex justify-end">
                <button onclick="closeUniversalModal(); loadComparisonModelTo3D(${item.modelIdx !== undefined ? item.modelIdx : 0});" class="px-5 py-2 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn hover:bg-tianqing transition-colors">
                    <i class="fa-solid fa-cube mr-1"></i>调入 3D 展馆立体观摩
                </button>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

// ================================================================
// 六、独立学者研鉴札记 & “文博殿试”古陶瓷互动考卷
// ================================================================
function renderScholarNotes() {
    const container = document.getElementById('scholar-notes-container');
    if (!container) return;

    container.innerHTML = scholarNotes.map((note, idx) => `
        <div class="feature-card p-6 hover-lift text-left flex flex-col justify-between cursor-pointer" onclick="openScholarNoteModal(${idx})">
            <div>
                <div class="flex items-center justify-between mb-3">
                    <span class="badge bg-yuebai text-tianqing-deep text-xs border border-border-light">${note.category}</span>
                    <span class="text-[11px] text-amber-400 font-mono"><i class="fa-regular fa-clock mr-1"></i>${note.readTime || '6分钟'}</span>
                </div>
                <h4 class="text-lg font-serif-cn text-text-title font-semibold mb-2.5 leading-snug">${note.title}</h4>
                <p class="text-xs text-text-body font-light leading-relaxed line-clamp-3">${note.excerpt}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-xs text-tianqing-deep">
                <span class="text-text-muted text-[11px]">${note.author || '数字文博实验室'}</span>
                <span class="font-serif-cn font-medium hover:underline">展卷深读全文 &rarr;</span>
            </div>
        </div>
    `).join('');
}

function openScholarNoteModal(idx) {
    const note = scholarNotes[idx];
    if (!note) return;
    const modal = document.getElementById('universal-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = note.title;
    modalBody.innerHTML = `
        <div class="space-y-4 text-left">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-light text-xs text-text-muted">
                <span><i class="fa-solid fa-building-columns text-tianqing-deep mr-1"></i>${note.author}</span>
                <span class="font-mono text-amber-400">${note.date}</span>
            </div>
            <div class="text-xs sm:text-sm text-text-body leading-relaxed font-light space-y-3">
                ${note.fullText || `<p>${note.excerpt}</p>`}
            </div>
        </div>
    `;
    modal.classList.add('active');
}

// --- 博古殿试 · 古陶瓷非遗与材料科学互动考卷 ---
let currentQuizIdx = 0;
let quizScore = 0;
let quizAnswered = false;

function initScholarQuiz() {
    renderScholarQuizCard();
}

function renderScholarQuizCard() {
    const container = document.getElementById('scholar-quiz-container');
    if (!container || typeof scholarQuizData === 'undefined') return;

    if (currentQuizIdx >= scholarQuizData.length) {
        const rankTitle = quizScore >= 5 ? '【大宋文博翰林学士 · 奉华阁待诏】' : (quizScore >= 3 ? '【景德镇御器厂督陶司丞】' : '【格物致知·博古研习生】');
        container.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="w-16 h-16 rounded-full bg-amber-700/30 border border-amber-400 flex items-center justify-center mx-auto text-amber-400 text-2xl">
                    <i class="fa-solid fa-award"></i>
                </div>
                <span class="badge bg-tianqing-deep text-white text-xs">博古殿试圆满礼成</span>
                <h4 class="text-2xl font-serif-cn font-semibold text-text-title">您的殿试成绩：${quizScore} / ${scholarQuizData.length} 题</h4>
                <p class="text-base font-serif-cn text-amber-400 font-medium">敕授雅衔：${rankTitle}</p>
                <p class="text-xs text-text-body max-w-lg mx-auto font-light">“器以载道，格物致知。” 您已深入掌握两宋五大名窑与明清御窑的矿物化学、热应力开片及器物学精髓。</p>
                <div class="pt-2">
                    <button onclick="restartScholarQuiz()" class="px-6 py-2.5 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn hover:bg-tianqing transition-colors">
                        <i class="fa-solid fa-rotate-right mr-1"></i>重新开卷应试
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const q = scholarQuizData[currentQuizIdx];
    container.innerHTML = `
        <div class="space-y-4 text-left">
            <div class="flex items-center justify-between text-xs pb-2 border-b border-border-light">
                <span class="badge bg-tianqing-deep text-white">殿试策问 · 第 ${currentQuizIdx + 1} / ${scholarQuizData.length} 题</span>
                <span class="font-mono text-amber-400">当前累计答对：${quizScore} 题</span>
            </div>
            <h4 class="text-sm sm:text-base font-serif-cn text-text-title font-medium leading-relaxed">${q.question}</h4>
            <div class="grid sm:grid-cols-2 gap-2.5" id="quiz-options-box">
                ${q.options.map((opt, oIdx) => `
                    <button onclick="submitQuizAnswer(${oIdx})" class="quiz-opt-btn p-3 rounded-xl bg-bg-main border border-border-light hover:border-tianqing text-left text-xs text-text-body font-serif-cn transition-all">
                        ${opt}
                    </button>
                `).join('')}
            </div>
            <div id="quiz-explanation-box" class="hidden p-3.5 rounded-xl bg-yuebai/50 border border-border-light text-xs text-text-body leading-relaxed"></div>
        </div>
    `;
    quizAnswered = false;
}

function submitQuizAnswer(selectedIdx) {
    if (quizAnswered) return;
    quizAnswered = true;
    const q = scholarQuizData[currentQuizIdx];
    const isCorrect = selectedIdx === q.answer;
    if (isCorrect) {
        quizScore++;
        if (typeof playPorcelainChime === 'function') playPorcelainChime(2680);
    } else {
        if (typeof playCrackleSound === 'function') playCrackleSound();
    }

    const btns = document.querySelectorAll('.quiz-opt-btn');
    btns.forEach((btn, idx) => {
        if (idx === q.answer) {
            btn.classList.add('border-amber-400', 'bg-tianqing-deep', 'text-white');
        } else if (idx === selectedIdx && !isCorrect) {
            btn.classList.add('border-red-500', 'text-red-500');
        }
    });

    const expBox = document.getElementById('quiz-explanation-box');
    if (expBox) {
        expBox.classList.remove('hidden');
        expBox.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div>
                    <strong class="${isCorrect ? 'text-amber-400' : 'text-red-500'} font-serif-cn block mb-1">
                        ${isCorrect ? '✓ 金榜落笔·回答正确！' : '✗ 尚差毫厘·正解如左'}
                    </strong>
                    <span>${q.explanation}</span>
                </div>
                <button onclick="nextScholarQuiz()" class="px-4 py-2 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn shrink-0 hover:bg-tianqing transition-colors">
                    ${currentQuizIdx + 1 < scholarQuizData.length ? '下一策问 &rarr;' : '揭榜授衔 &rarr;'}
                </button>
            </div>
        `;
    }
}

function nextScholarQuiz() {
    currentQuizIdx++;
    renderScholarQuizCard();
}

function restartScholarQuiz() {
    currentQuizIdx = 0;
    quizScore = 0;
    renderScholarQuizCard();
}

function closeUniversalModal() {
    const modal = document.getElementById('universal-modal');
    if (modal) modal.classList.remove('active');
}

function setupNavAndScroll() {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('back-to-top');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                if (navbar) navbar.classList.toggle('scrolled', scrollY > 50);
                if (backToTop) backToTop.classList.toggle('visible', scrollY > 400);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-close');
    const overlay = document.getElementById('mobile-menu-overlay');

    const openMenu = () => {
        if (mobileMenu) mobileMenu.classList.add('active');
        if (overlay) overlay.classList.add('active');
    };
    const closeMenu = () => {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    };

    if (hamburger) hamburger.addEventListener('click', openMenu);
    if (mobileClose) mobileClose.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    document.querySelectorAll('#mobile-menu a').forEach(a => a.addEventListener('click', closeMenu));
}

// ================================================================
// 七、名瓷双物并照 · 学术对比台
// ================================================================
let comparisonSpecimenA = 0;
let comparisonSpecimenB = 7;

function initPorcelainComparison() {
    renderPorcelainComparison();
}

function switchComparisonSpecimen(which, id) {
    id = parseInt(id, 10);
    if (which === 'A') comparisonSpecimenA = id;
    else comparisonSpecimenB = id;
    renderPorcelainComparison();
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2300);
}

function renderPorcelainComparison() {
    const container = document.getElementById('porcelain-comparison-display');
    if (!container || typeof porcelainComparisonData === 'undefined') return;

    const itemA = porcelainComparisonData.find(d => d.id === comparisonSpecimenA) || porcelainComparisonData[0];
    const itemB = porcelainComparisonData.find(d => d.id === comparisonSpecimenB) || porcelainComparisonData[7];

    const generateOptions = (selectedId) => porcelainComparisonData.map(item => `
        <option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>
            ${item.name} (${item.dynasty.split(' ')[0]})
        </option>
    `).join('');

    container.innerHTML = `
        <div class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-bg-main border border-border-light flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="badge bg-tianqing-deep text-white text-[11px]">对照标本 A</span>
                        <button onclick="loadComparisonModelTo3D(${itemA.id})" class="text-xs text-tianqing-deep hover:underline flex items-center gap-1 font-medium">
                            <i class="fa-solid fa-cube"></i>调入 3D 展台
                        </button>
                    </div>
                    <select onchange="switchComparisonSpecimen('A', this.value)" class="w-full bg-yuebai border border-border-light rounded-lg px-3 py-2 text-xs font-serif-cn text-text-title outline-none">
                        ${generateOptions(itemA.id)}
                    </select>
                </div>

                <div class="p-4 rounded-xl bg-bg-main border border-border-light flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="badge bg-amber-700 text-white text-[11px]">对照标本 B</span>
                        <button onclick="loadComparisonModelTo3D(${itemB.id})" class="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium">
                            <i class="fa-solid fa-cube"></i>调入 3D 展台
                        </button>
                    </div>
                    <select onchange="switchComparisonSpecimen('B', this.value)" class="w-full bg-yuebai border border-border-light rounded-lg px-3 py-2 text-xs font-serif-cn text-text-title outline-none">
                        ${generateOptions(itemB.id)}
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-border-light bg-bg-main">
                <table class="w-full text-xs text-left">
                    <thead>
                        <tr class="bg-yuebai border-b border-border-light text-text-title font-serif-cn">
                            <th class="py-3 px-4 font-medium w-36 whitespace-nowrap">鉴别维度</th>
                            <th class="py-3 px-4 font-medium text-tianqing-deep border-r border-border-light">${itemA.name}</th>
                            <th class="py-3 px-4 font-medium text-amber-400">${itemB.name}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y text-text-body font-light">
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">窑口与时代</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.kiln} · ${itemA.dynasty}</td>
                            <td class="py-2.5 px-4">${itemB.kiln} · ${itemB.dynasty}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">胎骨质地</td>
                            <td class="py-2.5 px-4 border-r border-border-light font-medium text-text-title">${itemA.bodyType}</td>
                            <td class="py-2.5 px-4 font-medium text-text-title">${itemB.bodyType}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">釉面特质</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.glazeType}</td>
                            <td class="py-2.5 px-4">${itemB.glazeType}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">开片与纹饰</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.crackle}</td>
                            <td class="py-2.5 px-4">${itemB.crackle}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">烧成规制</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.temperature} · ${itemA.firingMethod}</td>
                            <td class="py-2.5 px-4">${itemB.temperature} · ${itemB.firingMethod}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">口沿与底足</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.rimFoot}</td>
                            <td class="py-2.5 px-4">${itemB.rimFoot}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">文博地位</td>
                            <td class="py-2.5 px-4 border-r border-border-light text-text-muted italic">${itemA.historicalRarity}</td>
                            <td class="py-2.5 px-4 text-text-muted italic">${itemB.historicalRarity}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadComparisonModelTo3D(id) {
    if (typeof loadPorcelainModel === 'function') {
        loadPorcelainModel(id);
        const galleryEl = document.getElementById('3d-gallery');
        if (galleryEl) galleryEl.scrollIntoView({ behavior: 'smooth' });
        showToast('✨ 已同步将该馆藏标准器调入 3D 展馆！');
    }
}


// ================================================================
// 八、宋明御瓷 100x 光学显微镜物理晶相与景深调焦引擎
// ================================================================
let currentMicroPreset = 'guan';
let currentMicroFocus = 100; // 60% ~ 140%
let microLightMode = 'bright'; // 'bright' | 'dark'
let showMicrometerReticle = true;
let microPanOffset = { x: 0, y: 0 };
let isMicroPanning = false;
let microPanStart = { x: 0, y: 0 };
let microSeedParticles = {}; // 缓存各标本的微粒随机数

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

    // 1. 浅层气泡 (depth: 10 ~ 45 μm)
    for (let i = 0; i < layers.surface.count; i++) {
        particles.push({
            x: (rand() * 0.76 + 0.12),
            y: (rand() * 0.76 + 0.12),
            r: (rand() * (layers.surface.sizeRange[1] - layers.surface.sizeRange[0]) + layers.surface.sizeRange[0]) * 0.5,
            depth: rand() * 35 + 10,
            isDead: rand() < layers.surface.deadRate,
            phase: rand() * Math.PI * 2
        });
    }

    // 2. 中层核心气泡 (depth: 55 ~ 95 μm)
    for (let i = 0; i < layers.middle.count; i++) {
        particles.push({
            x: (rand() * 0.82 + 0.09),
            y: (rand() * 0.82 + 0.09),
            r: (rand() * (layers.middle.sizeRange[1] - layers.middle.sizeRange[0]) + layers.middle.sizeRange[0]) * 0.5,
            depth: rand() * 40 + 55,
            isDead: rand() < layers.middle.deadRate,
            phase: rand() * Math.PI * 2
        });
    }

    // 3. 深层底层微气泡 (depth: 105 ~ 145 μm)
    for (let i = 0; i < layers.deep.count; i++) {
        particles.push({
            x: (rand() * 0.86 + 0.07),
            y: (rand() * 0.86 + 0.07),
            r: (rand() * (layers.deep.sizeRange[1] - layers.deep.sizeRange[0]) + layers.deep.sizeRange[0]) * 0.5,
            depth: rand() * 40 + 105,
            isDead: rand() < layers.deep.deadRate,
            phase: rand() * Math.PI * 2
        });
    }

    microSeedParticles[preset.id] = particles;
    return particles;
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
            ? '<i class="fa-solid fa-sun text-amber-400 mr-1"></i>明场透射'
            : '<i class="fa-solid fa-moon text-tianqing-light mr-1"></i>暗场荧光';
        btn.classList.toggle('bg-tianqing-deep', microLightMode === 'dark');
        btn.classList.toggle('text-white', microLightMode === 'dark');
    }
    drawMicroscopeCanvas();
    if (typeof showToast === 'function') {
        showToast(microLightMode === 'bright' ? '☀️ 已切换至【明场透射光】：观察气泡聚沫与自然破损' : '🌙 已切换至【暗场斜射荧光】：观察石英结晶相与苏料锡光闪烁');
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
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2560);
}

function renderMicroscopeLens() {
    const descContainer = document.getElementById('microscope-desc-card');
    const tabsContainer = document.getElementById('microscope-preset-tabs');
    if (typeof microscopePresets === 'undefined') return;

    const p = microscopePresets.find(item => item.id === currentMicroPreset) || microscopePresets[0];

    if (tabsContainer) {
        tabsContainer.innerHTML = microscopePresets.map(item => `
            <button onclick="selectMicroscopePreset('${item.id}')" class="px-3 py-1 rounded-full text-xs font-serif-cn transition-all ${item.id === currentMicroPreset ? 'bg-tianqing-deep text-white shadow-sm ring-1 ring-amber-400/50' : 'bg-yuebai text-text-body hover:border-tianqing border border-transparent'}">
                ${item.name.split(' · ')[1] || item.name}
            </button>
        `).join('');
    }

    if (descContainer) {
        descContainer.innerHTML = `
            <div class="flex items-center justify-between pb-1.5 border-b border-border-light text-[11px] text-text-muted">
                <span><strong>【标本朝代】</strong>${p.dynasty || '宋代'}</span>
                <span><strong>【光学倍率】</strong>${p.magnification || '100x'} · 标尺: ${p.scaleUm}μm</span>
            </div>
            <div class="pt-1.5"><strong class="text-text-title font-medium">【微观晶相学术释义】</strong>：${p.desc}</div>
            <div class="pt-1.5 border-t border-border-light"><strong class="text-amber-400 font-medium">【古瓷鉴伪铁律】</strong>：${p.authenticity}</div>
        `;
    }

    drawMicroscopeCanvas();
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

    // 焦平面深度 (60% ~ 140% 映射到 15μm ~ 135μm，100% 对应 75μm 中层核心)
    const focalDepth = ((currentMicroFocus - 60) / 80) * 120 + 15;

    // 1. 绘制目镜圆形视野底色 (支持明场与暗场模式)
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

    // 2. 绘制玛瑙微晶散射云雾 (Rayleigh Scattering Fog)
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

    // 3. 绘制开片冰裂隙与金丝铁线 (Cracks)
    if (p.cracks && p.cracks.length > 0) {
        p.cracks.forEach(c => {
            ctx.save();
            ctx.beginPath();
            const x1 = c.x1 * w + microPanOffset.x * 0.6;
            const y1 = c.y1 * h + microPanOffset.y * 0.6;
            const x2 = c.x2 * w + microPanOffset.x * 0.6;
            const y2 = c.y2 * h + microPanOffset.y * 0.6;

            ctx.moveTo(x1, y1);
            // 细微抖动模拟微应力撕裂
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

    // 4. 按深度由深到浅排序并绘制气泡粒子 (含高斯景深散斑)
    const sortedParticles = [...particles].sort((a, b) => b.depth - a.depth);

    sortedParticles.forEach(pt => {
        const px = pt.x * w + microPanOffset.x;
        const py = pt.y * h + microPanOffset.y;

        // 计算与焦平面的距离
        const depthDelta = Math.abs(pt.depth - focalDepth);
        const blurFactor = Math.min(6.5, depthDelta * 0.12);
        const sharpness = Math.max(0.15, 1 - depthDelta * 0.028);

        ctx.save();
        ctx.beginPath();
        const drawRadius = Math.max(2, pt.r * (1 + blurFactor * 0.18));
        ctx.arc(px, py, drawRadius, 0, Math.PI * 2);

        if (pt.isDead) {
            // 死气泡：周边自然氧化褐圈
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
            // 活气泡：物理透镜球体折射
            if (microLightMode === 'bright') {
                const bGrad = ctx.createRadialGradient(
                    px - drawRadius * 0.35, py - drawRadius * 0.35, drawRadius * 0.1,
                    px, py, drawRadius
                );
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
                // 暗场斜射荧光模式：气泡发亮白环与内壁反光点
                const bGrad = ctx.createRadialGradient(
                    px - drawRadius * 0.3, py - drawRadius * 0.3, 1,
                    px, py, drawRadius
                );
                bGrad.addColorStop(0, `rgba(255, 240, 190, ${(0.95 * sharpness).toFixed(2)})`);
                bGrad.addColorStop(0.4, `rgba(120, 200, 225, ${(0.45 * sharpness).toFixed(2)})`);
                bGrad.addColorStop(1, 'rgba(8, 18, 24, 0.1)');
                ctx.fillStyle = bGrad;
                ctx.fill();
                ctx.lineWidth = 1.4 * sharpness;
                ctx.strokeStyle = `rgba(160, 225, 240, ${(0.85 * sharpness).toFixed(2)})`;
                ctx.stroke();
            }

            // 聚焦极佳时绘制内部锐利聚光核心高光点
            if (sharpness > 0.65) {
                ctx.beginPath();
                ctx.arc(px - drawRadius * 0.35, py - drawRadius * 0.35, Math.max(1, drawRadius * 0.18), 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.fill();
            }
        }
        ctx.restore();
    });

    // 5. 绘制苏麻离青锡光结晶斑与石英析晶体
    if (p.crystals && p.crystals.length > 0) {
        p.crystals.forEach(cr => {
            const cxPt = cr.x * w + microPanOffset.x;
            const cyPt = cr.y * h + microPanOffset.y;
            ctx.save();
            if (cr.type === 'tin_crystal') {
                // 锡光结晶斑：银黑金属光泽伴羽状扩散
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
                // 石英晶核与玛瑙包裹晕
                ctx.fillStyle = (microLightMode === 'bright') ? 'rgba(255, 255, 255, 0.45)' : 'rgba(229, 200, 136, 0.7)';
                ctx.beginPath();
                ctx.arc(cxPt, cyPt, cr.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    // 6. 绘制显微镜目镜边缘暗角与景深金属光圈 (Vignetting & Eyepiece Ring)
    const ringGrad = ctx.createRadialGradient(cx, cy, r * 0.78, cx, cy, r);
    ringGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    ringGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.45)');
    ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 7. 绘制真实显微镜测微十字标尺 (Micrometer Reticle)
    if (showMicrometerReticle) {
        ctx.save();
        ctx.strokeStyle = (microLightMode === 'bright') ? 'rgba(20, 35, 40, 0.38)' : 'rgba(200, 230, 240, 0.45)';
        ctx.lineWidth = 1;

        // 十字准线
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy);
        ctx.lineTo(cx + r * 0.85, cy);
        ctx.moveTo(cx, cy - r * 0.85);
        ctx.lineTo(cx, cy + r * 0.85);
        ctx.stroke();

        // 测微毫米刻度 (0 ~ 100μm，每格 10μm)
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
            if (s === 5) {
                ctx.fillText('+50μm', sx, cy - 10);
            } else if (s === -5) {
                ctx.fillText('-50μm', sx, cy - 10);
            }
        }
        ctx.restore();
    }

    ctx.restore(); // 恢复圆形裁剪

    // 8. 视窗外缘金属目镜圆环与刻度标
    ctx.strokeStyle = '#1a2228';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.stroke();
}

function bindMicroscopeCanvasEvents() {
    const canvas = document.getElementById('microscope-canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
        isMicroPanning = true;
        microPanStart = { x: e.clientX - microPanOffset.x, y: e.clientY - microPanOffset.y };
    });

    window.addEventListener('mousemove', (e) => {
        if (!isMicroPanning) return;
        microPanOffset.x = Math.max(-80, Math.min(80, e.clientX - microPanStart.x));
        microPanOffset.y = Math.max(-80, Math.min(80, e.clientY - microPanStart.y));
        drawMicroscopeCanvas();
    });

    window.addEventListener('mouseup', () => {
        isMicroPanning = false;
    });

    // 滚轮直接微调焦距
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 3 : -3;
        const input = document.querySelector('input[oninput*="adjustMicroscopeFocus"]');
        if (input) {
            const nextVal = Math.max(60, Math.min(140, currentMicroFocus + delta));
            input.value = nextVal;
            adjustMicroscopeFocus(nextVal);
        }
    }, { passive: false });
}

window.adjustMicroscopeFocus = adjustMicroscopeFocus;
window.selectMicroscopePreset = selectMicroscopePreset;
window.toggleMicroscopeLightMode = toggleMicroscopeLightMode;
window.toggleMicrometerReticle = toggleMicrometerReticle;

// 九、空灵瓷韵 · 五声音阶古编磬
// ================================================================
function renderPentatonicPanel() {
    const container = document.getElementById('pentatonic-keys-container');
    if (!container || typeof pentatonicNotesData === 'undefined') return;

    container.innerHTML = pentatonicNotesData.map((note, idx) => `
        <button onclick="strikeAncientChime('${note.key}')" class="p-3.5 rounded-2xl bg-bg-main border border-border-light hover:border-tianqing hover:shadow-md transition-all flex flex-col items-center justify-between text-center group">
            <span class="text-[10px] text-text-muted font-mono bg-yuebai px-2 py-0.5 rounded-full mb-1">键盘 ${idx + 1} · ${note.frequency}Hz</span>
            <div class="w-12 h-12 rounded-full bg-yuebai group-hover:bg-tianqing-deep flex items-center justify-center transition-colors shadow-inner my-1.5 border border-border-light">
                <span class="font-serif-cn text-xl font-bold text-tianqing-deep group-hover:text-white transition-colors">${note.note}</span>
            </div>
            <div>
                <h5 class="text-xs font-serif-cn font-medium text-text-title">${note.pinyin} · ${note.element}</h5>
                <p class="text-[10px] text-text-muted truncate mt-0.5">${note.vessel.split(' · ')[0]}</p>
            </div>
        </button>
    `).join('');

    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement && document.activeElement.tagName)) return;
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= 5) {
            const targetNote = pentatonicNotesData[keyNum - 1];
            if (targetNote) strikeAncientChime(targetNote.key);
        }
    });
}

function strikeAncientChime(key) {
    if (typeof pentatonicNotesData === 'undefined') return;
    const note = pentatonicNotesData.find(n => n.key === key);
    if (!note) return;

    if (typeof playPentatonicChime === 'function') {
        playPentatonicChime(note.frequency, note.harmonics);
    }

    const noteDescEl = document.getElementById('pentatonic-current-desc');
    if (noteDescEl) {
        noteDescEl.innerHTML = `
            <span class="text-amber-400 font-medium font-serif-cn">${note.note}音 · ${note.element}</span>：
            ${note.desc} <span class="text-text-muted">（共鸣器物：${note.vessel} · 基频 ${note.frequency}Hz）</span>
        `;
    }
}

// ================================================================
// 十、个人研学手记与典藏收藏夹
// ================================================================
let studyBookmarks = [1, 2]; // 默认预收录两件镇馆国宝，方便展示收藏夹效果

function initStudyNotebook() {
    try {
        const saved = localStorage.getItem('huaxia_study_bookmarks');
        if (saved) studyBookmarks = JSON.parse(saved);
    } catch (e) {}
    updateBookmarkUI();
}

function toggleArchiveBookmark(id) {
    id = parseInt(id, 10);
    const idx = studyBookmarks.indexOf(id);
    if (idx >= 0) {
        studyBookmarks.splice(idx, 1);
        showToast('已从个人典藏集中移除该名瓷');
    } else {
        studyBookmarks.push(id);
        if (typeof playPorcelainChime === 'function') playPorcelainChime(2500);
        showToast('⭐ 已收录入个人古瓷研学典藏集！');
    }
    try {
        localStorage.setItem('huaxia_study_bookmarks', JSON.stringify(studyBookmarks));
    } catch (e) {}
    updateBookmarkUI();
    renderArchiveGrid();
}

function updateBookmarkUI() {
    const countBadge = document.getElementById('bookmark-count-badge');
    const mobileCountBadge = document.getElementById('mobile-bookmark-count-badge');
    if (countBadge) countBadge.textContent = studyBookmarks.length;
    if (mobileCountBadge) mobileCountBadge.textContent = studyBookmarks.length;
}

function openStudyNotebook() {
    const modal = document.getElementById('study-notebook-modal');
    const container = document.getElementById('study-notebook-list');
    const notesInput = document.getElementById('study-notebook-textarea');
    if (!modal || !container) return;

    try {
        const savedNotes = localStorage.getItem('huaxia_study_user_notes') || '';
        if (notesInput) notesInput.value = savedNotes;
    } catch (e) {}

    if (studyBookmarks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-text-muted font-light text-xs">
                <i class="fa-regular fa-bookmark text-2xl block mb-2"></i>
                尚未收录任何传世名瓷。请在「传世名品典藏库」卡片左上角点击书签即可收录。
            </div>
        `;
    } else {
        const favItems = archivePorcelains.filter(item => studyBookmarks.includes(item.id));
        container.innerHTML = favItems.map(item => `
            <div class="p-3 rounded-xl bg-yuebai/50 border border-border-light flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3">
                    <img src="${item.img}" class="w-10 h-10 rounded-lg object-cover" alt="${item.name}">
                    <div class="text-left">
                        <h5 class="font-serif-cn font-medium text-text-title">${item.name}</h5>
                        <p class="text-[11px] text-tianqing-deep">${item.kiln} · ${item.level}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="openArchiveDetailModal(${item.id})" class="text-tianqing-deep hover:underline text-[11px]">研读档案</button>
                    <button onclick="toggleArchiveBookmark(${item.id}); openStudyNotebook();" class="text-red-500 text-xs px-1" title="移除"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `).join('');
    }
    modal.classList.add('active');
}

function closeStudyNotebook() {
    const modal = document.getElementById('study-notebook-modal');
    if (modal) modal.classList.remove('active');
}

function saveStudyNotes() {
    const notesInput = document.getElementById('study-notebook-textarea');
    if (!notesInput) return;
    try {
        localStorage.setItem('huaxia_study_user_notes', notesInput.value);
    } catch (e) {}
}

function exportStudyNotes() {
    const notesInput = document.getElementById('study-notebook-textarea');
    const userNotes = notesInput ? notesInput.value : '';
    const favItems = archivePorcelains.filter(item => studyBookmarks.includes(item.id));

    let content = `# 华夏器道 · 天青泥火个人古瓷研学手记\n\n`;
    content += `> 研学导出时间：${new Date().toLocaleString()}\n\n`;
    content += `## 一、典藏标本收录清单 (${favItems.length} 件)\n\n`;
    if (favItems.length === 0) {
        content += `(暂未添加标本)\n\n`;
    } else {
        favItems.forEach((item, idx) => {
            content += `### ${idx + 1}. ${item.name}\n`;
            content += `- **窑口归属**：${item.kiln}\n`;
            content += `- **文物等级**：${item.level}\n`;
            content += `- **实测规制**：${item.size}\n`;
            content += `- **典型特征**：${item.desc}\n\n`;
        });
    }
    content += `## 二、个人学术心得与鉴赏札记\n\n`;
    content += userNotes || '（暂无自由随笔记录）\n';

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `华夏器道_研学手记_${Date.now()}.md`;
    link.click();
    showToast('已成功导出个人研学手记 Markdown 文档！');
}

// ================================================================
// 十一、全局智能检索引擎命令面板 (Ctrl/Cmd + K)
// ================================================================
function initCommandPalette() {
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openCommandPalette();
        } else if (e.key === 'Escape') {
            closeCommandPalette();
        }
    });
    renderCommandResults('');
}

function openCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('command-search-input');
    if (!modal) return;
    modal.classList.add('active');
    renderCommandResults(input ? input.value : '');
    if (input) setTimeout(() => input.focus(), 80);
}

function closeCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    if (modal) modal.classList.remove('active');
}

function renderCommandResults(query = '') {
    const listEl = document.getElementById('command-results-list');
    if (!listEl) return;
    const q = query.trim().toLowerCase();

    const allItems = [
        ...archivePorcelains.map(a => ({
            type: '3D国宝典藏',
            icon: 'fa-cube',
            title: a.name,
            sub: `${a.kiln} · ${a.size}`,
            action: () => { closeCommandPalette(); loadComparisonModelTo3D(a.modelIdx); }
        })),
        ...kilnGeographyData.map(k => ({
            type: '九州名窑舆图',
            icon: 'fa-map-location-dot',
            title: k.name,
            sub: `${k.province} · ${k.masterpiece}`,
            action: () => {
                closeCommandPalette();
                selectKilnSpot(k.id);
                const el = document.getElementById('kiln-map-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        })),
        ...traditionalColors.map(c => ({
            type: '东方古瓷釉色',
            icon: 'fa-palette',
            title: `${c.name} (${c.hex})`,
            sub: `${c.dynasty} · ${c.oxide || c.quote}`,
            action: () => { closeCommandPalette(); previewColorIn3D(c.glazeKey); }
        })),
        ...workshopSteps.map(s => ({
            type: '天工七十二工',
            icon: 'fa-hammer',
            title: `${s.category} · ${s.title.zh}`,
            sub: s.params || '',
            action: () => { closeCommandPalette(); openStepDetailModal(s.id); }
        }))
    ];

    const matched = q ? allItems.filter(it => (it.title + it.sub + it.type).toLowerCase().includes(q)) : allItems.slice(0, 10);

    if (matched.length === 0) {
        listEl.innerHTML = `<div class="py-8 text-center text-xs text-text-muted">未检索到匹配的器物、窑口或釉色，请尝试搜索“汝窑”、“苏麻离青”、“冰裂”、“贯耳瓶”</div>`;
        return;
    }

    listEl.innerHTML = matched.slice(0, 12).map((item, idx) => `
        <button onclick="triggerCommandItem(${idx}, '${q.replace(/'/g, '')}')" class="w-full p-3 rounded-xl bg-bg-main hover:bg-yuebai border border-border-light flex items-center justify-between gap-3 text-left transition-colors">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-yuebai flex items-center justify-center text-tianqing-deep shrink-0">
                    <i class="fa-solid ${item.icon} text-xs"></i>
                </div>
                <div class="min-w-0">
                    <div class="text-xs font-serif-cn font-medium text-text-title truncate">${item.title}</div>
                    <div class="text-[11px] text-text-muted truncate">${item.sub}</div>
                </div>
            </div>
            <span class="badge bg-yuebai text-tianqing-deep text-[10px] shrink-0 border border-border-light">${item.type}</span>
        </button>
    `).join('');
    window._currentCmdMatched = matched;
}

function triggerCommandItem(idx) {
    if (window._currentCmdMatched && window._currentCmdMatched[idx]) {
        window._currentCmdMatched[idx].action();
    }
}

function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

window.switchHeroShowcase = switchHeroShowcase;
window.toggleMuseumTheme = toggleMuseumTheme;
window.selectHistoryPeriod = selectHistoryPeriod;
window.selectKilnSpot = selectKilnSpot;
window.switchKilnMapLayer = switchKilnMapLayer;
window.renderKilnGeographyMap = renderKilnGeographyMap;
window.openStepDetailModal = openStepDetailModal;
window.copyColorCode = copyColorCode;
window.previewColorIn3D = previewColorIn3D;
window.setGlazeChemAtmosphere = setGlazeChemAtmosphere;
window.applyChemPreset = applyChemPreset;
window.updateGlazeChemistrySimulation = updateGlazeChemistrySimulation;
window.whiskTeaStep = whiskTeaStep;
window.setTeaBailiMotif = setTeaBailiMotif;
window.resetTeaBowl = resetTeaBowl;
window.filterArchivePorcelains = filterArchivePorcelains;
window.openArchiveDetailModal = openArchiveDetailModal;
window.openScholarNoteModal = openScholarNoteModal;
window.submitQuizAnswer = submitQuizAnswer;
window.nextScholarQuiz = nextScholarQuiz;
window.restartScholarQuiz = restartScholarQuiz;
window.closeUniversalModal = closeUniversalModal;
window.showToast = showToast;
window.switchComparisonSpecimen = switchComparisonSpecimen;
window.loadComparisonModelTo3D = loadComparisonModelTo3D;
window.selectMicroscopePreset = selectMicroscopePreset;
window.adjustMicroscopeFocus = adjustMicroscopeFocus;
window.strikeAncientChime = strikeAncientChime;
window.toggleArchiveBookmark = toggleArchiveBookmark;
window.openStudyNotebook = openStudyNotebook;
window.closeStudyNotebook = closeStudyNotebook;
window.saveStudyNotes = saveStudyNotes;
window.exportStudyNotes = exportStudyNotes;
window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;
window.renderCommandResults = renderCommandResults;
window.triggerCommandItem = triggerCommandItem;


// ================================================================
// 视听研学 · 陶埏天工技艺展映与环境音景发生器
// ================================================================
const craftVideos = [
    {
        id: 'throwing',
        title: '《陶轮拉坯 · 指尖生形》',
        subtitle: '飞轮旋转，十指感知泥料筋骨厚薄，一呼一吸间提拉出曼妙曲线',
        quote: '“陶轮一转天地开，素手揉出万象来” ——《天工开物 · 陶埏篇》',
        sourceUrl: 'videos/ceramic_making.webm',
        duration: '00:24 · 高清实景循环',
        chapter: '工序五 · 轮盘拉坯',
        desc: '陶轮拉坯是传统手工制瓷最具生命力的核心工序。匠人将练好的熟泥掷于旋转转盘中心，以双手拇指开孔，四指提拉外壁。利用离心力与指尖均匀推压，将致密泥料顺势拔高，器物之口沿、修颈、溜肩、圆腹在此一气呵成。'
    },
    {
        id: 'trimming',
        title: '《修光利坯 · 削泥如玉》',
        subtitle: '半干阴凉，以锋利钢刀修削内外，使器壁薄厚如一、重心极稳',
        quote: '“削骨定肉，毫厘无差；利坯如削玉，薄可照人” ——《景德镇陶录》',
        sourceUrl: 'videos/potter_wheel.webm',
        duration: '00:32 · 1080P慢速精修',
        chapter: '工序七 · 修光利坯',
        desc: '修光利坯决定了古瓷成品的骨相与手感。拉出的生坯阴干至半干革质后固定在辘轳车上，匠人屏气凝神，手持特制薄铁利刀自上而下旋削，消除粗糙杂余泥肉，使坯体重量、弧线、厚度达到严苛的毫米级规整，并修出规整紫黑铁足底圈。'
    },
    {
        id: 'glazing',
        title: '《矿彩荡釉 · 翠色成衣》',
        subtitle: '以天然松木灰、长石与玛瑙为浆，荡釉浸釉多重厚施如凝脂玉润',
        quote: '“雨过天青云破处，这般颜色做将来” ——《宋徽宗御批》',
        sourceUrl: 'videos/ceramic_making.webm',
        duration: '00:24 · 矿物成衣',
        chapter: '工序九 · 荡釉浸釉',
        desc: '宋代单色釉追求“如冰似玉”的质感，秘诀正在于多道厚施矿物石灰碱釉。利用天然富铁瓷土与玛瑙研磨至数百目矿浆，通过荡釉（内壁摇荡）、浸釉（外壁速浸）与吹釉结合，使釉层厚度达到坯体数倍，出窑后失透晶莹、抚之若酥油羊脂。'
    },
    {
        id: 'firing',
        title: '《龙窑柴烧 · 烈焰涅槃》',
        subtitle: '匣钵重叠密封，以松柴经1300℃高温还原焰烧造三日三夜',
        quote: '“入窑一色，出窑万彩；千度烈焰，涅槃成器” ——《古瓷考据录》',
        sourceUrl: 'videos/potter_wheel.webm',
        duration: '00:32 · 柴烧还原',
        chapter: '工序十一 · 龙窑柴烧',
        desc: '柴烧是华夏古陶瓷的灵魂涅槃之所。器物须严格装入耐火匣钵中密封叠放以防飞灰沾染。数十米依山龙窑投松木柴持续升温至1300℃以上，在关键的缺氧还原阶段，胎釉中的三氧化二铁被剥离氧原子转化为氧化亚铁，方能绽放出摄人心魄的雨过天青与秘色幽光。'
    }
];

let currentCraftVideoIndex = 0;

function switchCraftVideo(index, autoPlay = true) {
    currentCraftVideoIndex = index;
    const v = craftVideos[index];
    if (!v) return;

    const videoEl = document.getElementById('craft-main-video');
    const titleEl = document.getElementById('craft-video-title');
    const subtitleEl = document.getElementById('craft-video-subtitle');
    const quoteEl = document.getElementById('craft-video-quote');
    const descEl = document.getElementById('craft-video-desc');
    const chapterEl = document.getElementById('craft-video-chapter');
    const durationEl = document.getElementById('craft-video-duration');

    if (videoEl) {
        if (autoPlay) {
            videoEl.src = v.sourceUrl;
            videoEl.play().catch(() => {});
        } else {
            videoEl.dataset.pendingSrc = v.sourceUrl;
        }
    }
    if (titleEl) titleEl.textContent = v.title;
    if (subtitleEl) subtitleEl.textContent = v.subtitle;
    if (quoteEl) quoteEl.textContent = v.quote;
    if (descEl) descEl.textContent = v.desc;
    if (chapterEl) chapterEl.textContent = v.chapter;
    if (durationEl) durationEl.textContent = v.duration;

    document.querySelectorAll('.craft-chapter-btn').forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('border-tianqing', 'bg-tianqing-deep/15');
        } else {
            btn.classList.remove('border-tianqing', 'bg-tianqing-deep/15');
        }
    });

    if (autoPlay && typeof showToast === 'function') {
        showToast('🎬 已载入研学展映：' + v.title);
    }
}

function initVideoLazyLoader() {
    const video = document.getElementById('craft-main-video');
    if (!video) return;
    // 默认元数据仅文字更新，首屏绝对不请求 12MB 视频流
    switchCraftVideo(0, false);

    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
        // 严格当视频 50% 真正出现在视口中时才加载流
        if (entries[0] && entries[0].isIntersecting) {
            if (!video.src && video.dataset.pendingSrc) {
                video.src = video.dataset.pendingSrc;
            }
            obs.disconnect();
        }
    }, { threshold: 0.3 });
    obs.observe(video);
}

// ================================================================
// Web Audio API 环境音景发生器
// ================================================================
let ambientAudioCtx = null;
let activeAmbientNodes = {
    guqin: null,
    fire: null,
    water: null,
    chime: null
};

function getAmbientContext() {
    if (!ambientAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ambientAudioCtx = new AudioContext();
    }
    if (ambientAudioCtx.state === 'suspended') {
        ambientAudioCtx.resume();
    }
    return ambientAudioCtx;
}

function toggleAmbientSound(type) {
    const ctx = getAmbientContext();
    const btn = document.getElementById('ambient-btn-' + type);

    if (activeAmbientNodes[type]) {
        try {
            activeAmbientNodes[type].gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
            setTimeout(() => {
                if (activeAmbientNodes[type] && activeAmbientNodes[type].stop) {
                    activeAmbientNodes[type].stop();
                }
                activeAmbientNodes[type] = null;
            }, 800);
        } catch (e) {
            activeAmbientNodes[type] = null;
        }
        if (btn) btn.classList.remove('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
        if (typeof showToast === 'function') showToast('已静音环境音景');
        return;
    }

    if (type === 'fire') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            if (Math.random() < 0.0018) {
                data[i] += (Math.random() * 2 - 1) * 0.45;
            }
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 1.2);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        noise.start();

        activeAmbientNodes.fire = { stop: () => noise.stop(), gain: gainNode };
        if (btn) btn.classList.add('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
        if (typeof showToast === 'function') showToast('🔥 已开启【龙窑松柴烈火噼啪声】');
    } else if (type === 'water') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(420, ctx.currentTime);
        filter.Q.setValueAtTime(1.8, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.2);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        noise.start();

        activeAmbientNodes.water = { stop: () => noise.stop(), gain: gainNode };
        if (btn) btn.classList.add('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
        if (typeof showToast === 'function') showToast('💧 已开启【山泉水磨澄泥潺潺声】');
    } else if (type === 'guqin') {
        const guqinFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        let noteTimer = null;
        let isRunning = true;

        function playGuqinNote() {
            if (!isRunning) return;
            const f = guqinFreqs[Math.floor(Math.random() * guqinFreqs.length)];
            const osc = ctx.createOscillator();
            const oscHarm = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, ctx.currentTime);

            oscHarm.type = 'sine';
            oscHarm.frequency.setValueAtTime(f * 2, ctx.currentTime);

            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

            osc.connect(gain);
            oscHarm.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            oscHarm.start();
            osc.stop(ctx.currentTime + 3.0);
            oscHarm.stop(ctx.currentTime + 3.0);

            noteTimer = setTimeout(playGuqinNote, 2200 + Math.random() * 2000);
        }

        playGuqinNote();
        activeAmbientNodes.guqin = {
            stop: () => {
                isRunning = false;
                clearTimeout(noteTimer);
            },
            gain: { gain: { exponentialRampToValueAtTime: () => {} } }
        };
        if (btn) btn.classList.add('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
        if (typeof showToast === 'function') showToast('🎵 已开启【古琴五音泛音清境】');
    } else if (type === 'chime') {
        if (typeof playPorcelainChime === 'function') {
            playPorcelainChime(2580);
        }
        if (typeof showToast === 'function') showToast('🔔 叩瓷清越 · 声如鸣磬');
    }
}

window.switchCraftVideo = switchCraftVideo;
window.toggleAmbientSound = toggleAmbientSound;
window.setArchiveDynastyFilter = filterArchivePorcelains;


// ================================================================
// 十二、博古鉴瓷全局键盘快捷键系统与快捷键秘籍
// ================================================================
function openShortcutsHelpModal() {
    const modal = document.getElementById('shortcuts-help-modal');
    if (modal) modal.classList.add('active');
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2620);
}

function closeShortcutsHelpModal() {
    const modal = document.getElementById('shortcuts-help-modal');
    if (modal) modal.classList.remove('active');
}

function initGlobalConnoisseurShortcuts() {
    window.addEventListener('keydown', (e) => {
        // 如果当前焦点在输入框或文本域中，不拦截快捷键
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        // ? 或 H 呼出快捷键手册
        if (e.key === '?' || (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
            e.preventDefault();
            const modal = document.getElementById('shortcuts-help-modal');
            if (modal && modal.classList.contains('active')) {
                closeShortcutsHelpModal();
            } else {
                openShortcutsHelpModal();
            }
            return;
        }

        // Space: 暂停/恢复 3D 旋转
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (typeof toggleAutoRotate === 'function') toggleAutoRotate();
            return;
        }

        // B: 翻转鉴底
        if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof toggleBottomView === 'function') toggleBottomView();
            return;
        }

        // T: 强光照胎
        if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof toggleTransilluminationTorch === 'function') toggleTransilluminationTorch();
            return;
        }

        // C: 双器同台并列比对
        if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof switchExhibitionMode === 'function') {
                switchExhibitionMode(window.exhibitionMode === 'comparison' ? 'inspector' : 'comparison');
            }
            return;
        }

        // M: 100x 显微镜
        if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const microModal = document.getElementById('microscope-modal');
            if (microModal && microModal.classList.contains('active')) {
                if (typeof closeMicroscopeView === 'function') closeMicroscopeView();
            } else {
                if (typeof openMicroscopeView === 'function') openMicroscopeView();
            }
            return;
        }

        // X: X光胎骨剖面
        if (e.key.toLowerCase() === 'x' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof switchExhibitionMode === 'function') {
                switchExhibitionMode(window.exhibitionMode === 'cutaway' ? 'inspector' : 'cutaway');
            }
            return;
        }

        // D: 昼夜意境切换
        if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof toggleMuseumTheme === 'function') toggleMuseumTheme();
            return;
        }

        // Z: 纯净沉浸模式 (单按 Z)
        if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof toggleZenMode === 'function') toggleZenMode();
            return;
        }

        // 数字 1 ~ 9: 快速切换前 9 尊器型
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= 9 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof loadPorcelainModel === 'function') {
                loadPorcelainModel(num - 1);
            }
        }
    });
}

window.openShortcutsHelpModal = openShortcutsHelpModal;
window.closeShortcutsHelpModal = closeShortcutsHelpModal;
