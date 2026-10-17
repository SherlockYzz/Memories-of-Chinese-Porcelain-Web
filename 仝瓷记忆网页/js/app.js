/**
 * 华夏器道 · 仝瓷记忆 — 前端综合调度主控制器 (Flagship App Controller)
 * 包含：
 * 1. 首屏水墨流金粒子动态背景 (#hero-ambient-canvas) 与特展展柜切换
 * 2. 宣纸雅集(Light) / 玄夜博物馆(Dark) 双主题实时切换
 * 3. 高精度 SVG 两宋山川河洛、黄河长江水系与御贡航线图谱 (#kiln-map-svg-bg)
 * 4. 通史长卷、七十二工、传统色谱联动3D试烧、文人四艺、典藏书签、100x显微镜与五声编磬
 */

function safeRun(taskName, fn) {
    try {
        fn();
    } catch (err) {
        console.warn(`[华夏器道-防御运行] ${taskName} 初始化异常:`, err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    safeRun('首屏流金粒子', initHeroAmbientCanvas);
    safeRun('历史通史', renderHistoryTimeline);
    safeRun('窑系地理', renderKilnGeographyMap);
    safeRun('制瓷工序', renderWorkshopGrid);
    safeRun('传统色谱', renderTraditionalColors);
    safeRun('文人四艺', renderLiteratiArts);
    safeRun('典藏图录', renderArchiveGrid);
    safeRun('研考手记', renderScholarNotes);
    safeRun('名瓷对比', initPorcelainComparison);
    safeRun('五音瓷鸣', renderPentatonicPanel);
    safeRun('研习笔记', initStudyNotebook);
    safeRun('显微开片', renderMicroscopeLens);

    safeRun('3D展馆', () => { if (typeof initThreeJS === 'function') initThreeJS(); });
    safeRun('AI识瓷', () => { if (typeof initAiRecognition === 'function') initAiRecognition(); });
    safeRun('拉坯工坊', () => { if (typeof initPotteryWorkshop === 'function') initPotteryWorkshop(); });

    safeRun('导航与滚动', setupNavAndScroll);
    safeRun('移动端菜单', setupMobileMenu);

    const langToggleBtn = document.getElementById('lang-toggle');
    if (langToggleBtn && typeof toggleLanguage === 'function') {
        langToggleBtn.addEventListener('click', toggleLanguage);
    }
});

// ================================================================
// 零、首屏水墨流金氛围粒子画布 & 展柜切换 & 昼夜主题切换
// ================================================================
function initHeroAmbientCanvas() {
    const canvas = document.getElementById('hero-ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = Math.max(700, window.innerHeight);

    const particles = [];
    for (let i = 0; i < 56; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 1.0 + Math.random() * 2.6,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -0.25 - Math.random() * 0.45,
            gold: i % 3 === 0,
            alpha: 0.2 + Math.random() * 0.55
        });
    }

    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = Math.max(700, window.innerHeight);
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

function switchHeroShowcase(imgSrc, titleText, modelIdx) {
    const imgEl = document.getElementById('hero-featured-img');
    if (imgEl) {
        imgEl.style.opacity = '0.2';
        setTimeout(() => {
            imgEl.src = imgSrc;
            imgEl.style.opacity = '1';
        }, 160);
    }
    const headerSpan = document.querySelector('.hero-showcase-stage .text-amber-200 span');
    if (headerSpan) headerSpan.textContent = titleText;

    if (typeof loadPorcelainModel === 'function' && modelIdx !== undefined) {
        loadPorcelainModel(modelIdx);
    }
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2520);
}

function toggleMuseumTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);

    const icon = document.getElementById('theme-toggle-icon');
    const label = document.getElementById('theme-toggle-label');
    if (next === 'dark') {
        if (icon) icon.className = 'fa-solid fa-sun text-amber-400 text-xs';
        if (label) label.textContent = '宣纸雅集';
        showToast('🌙 已切换至【玄金暗夜博物馆】沉浸展陈主题');
    } else {
        if (icon) icon.className = 'fa-solid fa-moon text-tianqing-deep text-xs';
        if (label) label.textContent = '玄夜展馆';
        showToast('☀️ 已切换至【宋韵宣纸雅集】清雅主题');
    }
}

// ================================================================
// 一、华夏陶瓷通史长卷渲染
// ================================================================
var currentLang = (typeof window !== 'undefined' && window.currentLang) || 'zh';
let currentHistoryId = 'song';

function renderHistoryTimeline() {
    const navContainer = document.getElementById('history-nav-nodes');
    const displayContainer = document.getElementById('history-active-display');
    if (!navContainer || !displayContainer) return;
    const lang = (typeof window !== 'undefined' && window.currentLang) || currentLang || 'zh';

    navContainer.innerHTML = historyPeriods.map(p => `
        <button class="history-node-btn px-4 py-2 rounded-full text-xs font-serif-cn transition-all shrink-0 ${p.id === currentHistoryId ? 'bg-tianqing-deep text-white shadow-sm' : 'bg-yuebai text-text-body hover:bg-tianqing'}" onclick="selectHistoryPeriod('${p.id}')">
            <span>${(p.label && p.label[lang]) || (p.label && p.label['zh']) || ''}</span>
            <span class="text-[10px] opacity-75 ml-1">(${p.year.split(' ')[0]})</span>
        </button>
    `).join('');

    const p = historyPeriods.find(item => item.id === currentHistoryId) || historyPeriods[3];
    displayContainer.innerHTML = `
        <div class="feature-card p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8">
            <div class="w-full md:w-1/2 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-md shrink-0 bg-black relative border border-border-light">
                <img src="${p.img}" alt="${(p.title && p.title[lang]) || ''}" class="w-full h-full object-cover">
                <div class="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-amber-200 text-xs font-serif-cn border border-white/10">
                    ${p.year}
                </div>
            </div>
            <div class="flex-1 space-y-4 text-left">
                <span class="badge bg-tianqing-deep text-white text-xs">${(p.label && p.label[lang]) || ''}</span>
                <h3 class="text-2xl font-serif-cn text-text-title font-semibold leading-snug">${(p.title && p.title[lang]) || ''}</h3>
                <p class="text-sm text-text-body leading-relaxed font-light">${(p.desc && p.desc[lang]) || ''}</p>
                <div class="pt-2 flex items-center justify-between text-xs text-text-muted border-t border-border-light">
                    <span><i class="fa-solid fa-scroll text-amber-400 mr-1"></i>点击上方朝代节点，纵览八千年泥火演进</span>
                    <a href="#3d-gallery" class="text-tianqing-deep font-medium hover:underline">进入3D展厅观摩 &rarr;</a>
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
// 一点五、华夏名窑地理图谱 (含高精度水墨山川河洛与御贡丝路 SVG 底图)
// ================================================================
let selectedKilnId = 'ru';

function renderKilnGeographyMap() {
    const svgBgContainer = document.getElementById('kiln-map-svg-bg');
    const spotsContainer = document.getElementById('kiln-map-spots');
    const infoContainer = document.getElementById('kiln-map-info');
    if (!spotsContainer || !infoContainer) return;

    const k = kilnGeographyData.find(item => item.id === selectedKilnId) || kilnGeographyData[0];

    // 1. 绘制水墨山川河洛、黄河长江、海岸线与动态御贡航线 SVG
    if (svgBgContainer) {
        const capX = k.capitalTarget ? k.capitalTarget[0] * 10 : 580;
        const capY = k.capitalTarget ? k.capitalTarget[1] * 4.4 : 190;
        const curX = k.x * 10;
        const curY = k.y * 4.4;
        const midX = (curX + capX) / 2 - 25;
        const midY = (curY + capY) / 2 - 30;

        svgBgContainer.innerHTML = `
            <svg viewBox="0 0 1000 440" preserveAspectRatio="none" class="w-full h-full">
                <defs>
                    <radialGradient id="mapGlow" cx="62%" cy="52%" r="48%">
                        <stop offset="0%" stop-color="rgba(124, 170, 180, 0.22)"/>
                        <stop offset="65%" stop-color="rgba(25, 42, 54, 0.08)"/>
                        <stop offset="100%" stop-color="rgba(12, 20, 28, 0)"/>
                    </radialGradient>
                    <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="rgba(124, 170, 180, 0.1)"/>
                        <stop offset="50%" stop-color="rgba(139, 194, 206, 0.45)"/>
                        <stop offset="100%" stop-color="rgba(197, 160, 89, 0.3)"/>
                    </linearGradient>
                </defs>

                <!-- 经纬古舆图方格网 (计里画方) -->
                <g stroke="rgba(143, 184, 192, 0.07)" stroke-width="1">
                    ${[100,200,300,400,500,600,700,800,900].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="440"/>`).join('')}
                    ${[80,160,240,320,400].map(y => `<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`).join('')}
                </g>

                <rect width="1000" height="440" fill="url(#mapGlow)"/>

                <!-- 华夏东南海岸线与渤海/东海/南海疆域轮廓 -->
                <path d="M 640,40 Q 690,65 660,115 Q 615,135 635,165 Q 710,155 725,185 Q 685,215 745,250 Q 795,285 775,335 Q 735,385 620,415 L 40,415 L 40,40 Z"
                      fill="rgba(124, 170, 180, 0.07)" stroke="rgba(143, 184, 192, 0.28)" stroke-width="1.8" stroke-dasharray="6,4"/>

                <!-- 水墨山脉剪影 (太行山、秦岭嵩山、武夷山脉) -->
                <g fill="rgba(143, 184, 192, 0.12)" stroke="rgba(143, 184, 192, 0.25)" stroke-width="1.2">
                    <!-- 太行山脉 -->
                    <path d="M 520,145 L 545,105 L 570,145 L 590,115 L 615,145 Z"/>
                    <!-- 秦岭与嵩山 -->
                    <path d="M 420,210 L 450,170 L 480,210 L 505,180 L 530,210 Z"/>
                    <!-- 江南武夷与括苍山 -->
                    <path d="M 645,320 L 670,285 L 695,320 L 718,292 L 740,320 Z"/>
                </g>

                <!-- 黄河水系 (九曲黄河入渤海) -->
                <path d="M 180,220 Q 290,175 360,210 T 490,195 T 665,145"
                      fill="none" stroke="url(#riverGrad)" stroke-width="2.5"/>
                <text x="385" y="185" fill="rgba(143,184,192,0.45)" font-size="11" font-family="serif">黄河水系</text>

                <!-- 长江水系 (万里长江入东海) -->
                <path d="M 160,310 Q 320,295 450,275 T 620,265 T 765,248"
                      fill="none" stroke="url(#riverGrad)" stroke-width="3"/>
                <text x="455" y="292" fill="rgba(143,184,192,0.45)" font-size="11" font-family="serif">长江水系</text>

                <!-- 海上丝绸之路航线 -->
                <path d="M 755,260 Q 845,305 810,395"
                      fill="none" stroke="rgba(197, 160, 89, 0.35)" stroke-width="1.6" stroke-dasharray="5,5"/>
                <text x="815" y="345" fill="rgba(229,200,136,0.55)" font-size="11" font-family="serif">海上丝路·外销航线</text>

                <!-- 当前选中名窑至都城 (汴京/临安) 的动态鎏金御贡线 -->
                <path d="M ${curX},${curY} Q ${midX},${midY} ${capX},${capY}"
                      fill="none" stroke="#E5C888" stroke-width="2.2" stroke-dasharray="6,4"/>
                <circle cx="${capX}" cy="${capY}" r="5" fill="#C5A059"/>
            </svg>
        `;
    }

    // 2. 渲染地图上的八大名窑光点
    spotsContainer.innerHTML = kilnGeographyData.map(item => `
        <button class="kiln-map-spot ${item.id === selectedKilnId ? 'active' : ''}" style="top:${item.y}%; left:${item.x}%;" onclick="selectKilnSpot('${item.id}')" title="${item.name}">
            <span class="spot-ping"></span>
            <span class="spot-dot"></span>
            <span class="spot-label">${item.name.split(' · ')[0]}</span>
        </button>
    `).join('');

    // 3. 渲染右侧窑口档案卡
    infoContainer.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start justify-between gap-2">
                <div>
                    <span class="badge bg-tianqing-deep text-white text-xs mb-1.5">${k.status}</span>
                    <h3 class="text-xl font-serif-cn text-text-title font-semibold">${k.name}</h3>
                    <p class="text-xs text-tianqing-deep font-medium mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>${k.province}</p>
                </div>
                <span class="text-xs text-text-muted font-serif-cn bg-yuebai px-3 py-1 rounded-full border border-border-light shrink-0">${k.era}</span>
            </div>

            <div class="p-4 rounded-xl bg-bg-main border border-border-light text-xs text-text-body space-y-2.5">
                <div>
                    <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-gem text-amber-400 mr-1"></i>【天然矿脉与水土禀赋】</strong>
                    <p class="font-light mt-1 leading-relaxed">${k.mineral}</p>
                </div>
                <div class="pt-2 border-t border-border-light">
                    <strong class="text-text-title font-medium font-serif-cn"><i class="fa-solid fa-crown text-tianqing-deep mr-1"></i>【传世代表标准器】</strong>
                    <p class="text-tianqing-deep mt-1 font-medium">${k.masterpiece}</p>
                </div>
            </div>

            <div class="flex items-center justify-between text-xs pt-1">
                <span class="text-text-muted text-[11px]">*金色虚线为该窑口向两宋都城进贡御瓷之路线</span>
                <button onclick="loadComparisonModelTo3D(${k.modelIdx || 0})" class="px-3.5 py-1.5 rounded-full bg-tianqing-deep text-white font-serif-cn hover:bg-tianqing transition-colors flex items-center gap-1.5">
                    <i class="fa-solid fa-cube text-[10px]"></i>
                    <span>在3D展厅观摩该窑名器</span>
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
        <div class="feature-card p-5 group cursor-pointer hover-lift" onclick="openStepDetailModal(${step.id})">
            <div class="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-black relative border border-border-light">
                <img src="${step.img}" alt="${(step.title && step.title[lang]) || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <span class="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-sm text-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-serif-cn">
                    ${step.category}
                </span>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <div class="w-7 h-7 rounded-full bg-yuebai flex items-center justify-center shrink-0">
                    <i class="fa-solid ${step.icon} text-tianqing-deep text-xs"></i>
                </div>
                <h4 class="text-base font-serif-cn text-text-title font-medium">${(step.title && step.title[lang]) || ''}</h4>
            </div>
            <p class="text-xs text-text-body line-clamp-2 font-light leading-relaxed">${(step.desc && step.desc[lang]) || ''}</p>
            <div class="mt-3 pt-2.5 border-t border-border-light flex items-center justify-between text-[11px] text-tianqing-deep">
                <span>工序研核 #0${step.id}</span>
                <span class="group-hover:translate-x-1 transition-transform">详研要略 <i class="fa-solid fa-chevron-right text-[9px]"></i></span>
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
        <div class="space-y-4">
            <div class="aspect-video rounded-xl overflow-hidden shadow-sm bg-black">
                <img src="${step.img}" alt="${(step.title && step.title[lang]) || ''}" class="w-full h-full object-cover">
            </div>
            <div class="flex items-center gap-2">
                <span class="badge bg-tianqing-deep text-white text-xs">${step.category}</span>
                <span class="text-xs text-text-muted">《天工开物》官窑烧造规制第 ${step.id} 核心环节</span>
            </div>
            <p class="text-sm text-text-body leading-relaxed font-light">${(step.desc && step.desc[lang]) || ''}</p>
            <div class="p-4 rounded-xl bg-yuebai/50 text-xs text-text-body leading-relaxed border border-border-light">
                <strong class="font-medium text-text-title block mb-1">【古法格物技艺精髓】</strong>
                此道工序要求制瓷匠人顺应天时物候。若有毫厘之差，在后续1300℃松柴烈火中必致胎体变形开裂或釉面失色。古人云“一窑生一窑死”，恰在日常每一道细节之极致苛求。
            </div>
        </div>
    `;
    modal.classList.add('active');
}

// ================================================================
// 三、东方传统古瓷色谱渲染与 3D 联动试烧
// ================================================================
function renderTraditionalColors() {
    const container = document.getElementById('traditional-colors-grid');
    if (!container) return;

    container.innerHTML = traditionalColors.map(c => `
        <div class="feature-card p-4 flex flex-col justify-between group hover-lift">
            <div>
                <div class="aspect-[16/9] rounded-xl mb-3.5 shadow-inner relative overflow-hidden flex items-end justify-between p-2.5 cursor-pointer" style="background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 65%), ${c.hex};" onclick="previewColorIn3D('${c.glazeKey || 'tianqing'}')">
                    <span class="text-[10px] text-white/95 bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded font-mono">${c.hex}</span>
                    <span class="text-[10px] text-white/90 bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded font-serif-cn">RGB(${c.rgb})</span>
                </div>
                <div class="flex items-baseline justify-between mb-1">
                    <h4 class="text-lg font-serif-cn font-semibold text-text-title">${c.name}</h4>
                    <span class="text-[11px] text-text-muted font-serif-cn">${c.pinyin}</span>
                </div>
                <span class="text-[11px] text-tianqing-deep block mb-2 font-medium">${c.dynasty}</span>
                <p class="text-xs text-amber-400 italic mb-2 font-serif-cn">“${c.quote}”</p>
                <p class="text-xs text-text-body font-light leading-relaxed line-clamp-3">${c.desc}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-xs">
                <button onclick="copyColorCode('${c.hex}')" class="text-text-muted hover:text-tianqing-deep transition-colors text-[11px]">
                    <i class="fa-regular fa-copy mr-1"></i>复制色值
                </button>
                <button onclick="previewColorIn3D('${c.glazeKey || 'tianqing'}')" class="text-tianqing-deep font-medium hover:underline text-[11px]">
                    3D 釉面试烧 <i class="fa-solid fa-cube text-[9px] ml-0.5"></i>
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
        showToast(`已成功复制传统釉色色值：${hex}`);
    }).catch(() => {
        showToast(`色值：${hex}`);
    });
}

// ================================================================
// 四、文人四艺 (焚香、点茶、插花、挂画)
// ================================================================
function renderLiteratiArts() {
    const container = document.getElementById('four-arts-container');
    if (!container) return;

    container.innerHTML = literatiArts.map(art => `
        <div class="feature-card p-6 hover-lift text-left">
            <div class="w-12 h-12 rounded-2xl bg-yuebai flex items-center justify-center mb-4 text-tianqing-deep text-xl border border-border-light">
                <i class="fa-solid ${art.icon}"></i>
            </div>
            <h4 class="text-xl font-serif-cn text-text-title font-semibold mb-1">${art.title}</h4>
            <span class="text-xs text-tianqing-deep font-medium block mb-2">雅集用器：${art.vessel}</span>
            <p class="text-xs text-amber-400 italic mb-3 font-serif-cn">“${art.quote}”</p>
            <p class="text-xs text-text-body font-light leading-relaxed">${art.desc}</p>
        </div>
    `).join('');
}

// ================================================================
// 五、传世名品典藏库渲染
// ================================================================
function renderArchiveGrid() {
    const container = document.getElementById('archive-grid-container');
    if (!container) return;

    container.innerHTML = archivePorcelains.map(item => {
        const isFav = studyBookmarks.includes(item.id);
        return `
        <div class="feature-card p-5 group cursor-pointer hover-lift relative text-left" onclick="openArchiveDetailModal(${item.id})">
            <div class="aspect-square rounded-xl overflow-hidden mb-4 bg-black relative border border-border-light">
                <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <span class="absolute top-2.5 right-2.5 bg-tianqing-deep text-white text-[10px] px-2.5 py-0.5 rounded-full font-serif-cn shadow-sm">
                    ${item.level}
                </span>
                <button onclick="event.stopPropagation(); toggleArchiveBookmark(${item.id});" class="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm text-white flex items-center justify-center hover:bg-tianqing-deep transition-colors" title="${isFav ? '从典藏集移除' : '收录入典藏集'}">
                    <i class="${isFav ? 'fa-solid text-amber-400' : 'fa-regular'} fa-bookmark text-xs"></i>
                </button>
            </div>
            <h4 class="text-base font-serif-cn text-text-title font-semibold mb-1 truncate">${item.name}</h4>
            <p class="text-xs text-tianqing-deep font-medium mb-1">${item.kiln}</p>
            <p class="text-[11px] text-text-muted mb-2.5 font-mono">${item.size}</p>
            <div class="flex flex-wrap gap-1.5 mb-3">
                ${item.tags.map(t => `<span class="bg-yuebai text-text-body text-[10px] px-2 py-0.5 rounded border border-border-light">${t}</span>`).join('')}
            </div>
            <p class="text-xs text-text-body font-light line-clamp-2 leading-relaxed">${item.desc}</p>
            <div class="mt-3 pt-2.5 border-t border-border-light text-[11px] text-tianqing-deep flex items-center justify-between">
                <span>查阅数字化研考档案</span>
                <button onclick="event.stopPropagation(); loadComparisonModelTo3D(${item.modelIdx !== undefined ? item.modelIdx : 0})" class="text-amber-400 hover:underline font-serif-cn">
                    3D全息检视 &rarr;
                </button>
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
                <p><strong>典型器型特征：</strong>${item.desc}</p>
            </div>
            <div class="p-4 rounded-xl bg-yuebai/50 text-xs text-text-body leading-relaxed border border-border-light">
                <strong class="font-medium text-text-title block mb-1">【数字化研考按语】</strong>
                此器物造型沉穆端庄，其釉汁层层厚施，微观显微镜下可见细密如沫之气泡层，胎釉交界处由于铁元素高温还原析出微紫发黑之晕散，属两宋至明初皇家御用典范之作。
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
// 六、独立学者研鉴札记
// ================================================================
function renderScholarNotes() {
    const container = document.getElementById('scholar-notes-container');
    if (!container) return;

    container.innerHTML = scholarNotes.map(note => `
        <div class="feature-card p-6 hover-lift text-left">
            <div class="flex items-center justify-between mb-3">
                <span class="badge bg-yuebai text-tianqing-deep text-xs border border-border-light">${note.category}</span>
                <span class="text-xs text-text-muted font-mono">${note.date}</span>
            </div>
            <h4 class="text-lg font-serif-cn text-text-title font-semibold mb-3">${note.title}</h4>
            <p class="text-xs text-text-body font-light leading-relaxed">${note.excerpt}</p>
        </div>
    `).join('');
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
let comparisonSpecimenB = 4;

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
    const itemB = porcelainComparisonData.find(d => d.id === comparisonSpecimenB) || porcelainComparisonData[4];

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
                            <th class="py-3 px-4 font-medium w-28">鉴别维度</th>
                            <th class="py-3 px-4 font-medium text-tianqing-deep border-r border-border-light w-1/2">${itemA.name}</th>
                            <th class="py-3 px-4 font-medium text-amber-400 w-1/2">${itemB.name}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y text-text-body font-light">
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">窑口与时代</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.kiln} · ${itemA.dynasty}</td>
                            <td class="py-2.5 px-4">${itemB.kiln} · ${itemB.dynasty}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">胎骨质地</td>
                            <td class="py-2.5 px-4 border-r border-border-light font-medium text-text-title">${itemA.bodyType}</td>
                            <td class="py-2.5 px-4 font-medium text-text-title">${itemB.bodyType}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">釉面特质</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.glazeType}</td>
                            <td class="py-2.5 px-4">${itemB.glazeType}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">开片与纹饰</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.crackle}</td>
                            <td class="py-2.5 px-4">${itemB.crackle}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">烧成规制</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.temperature} · ${itemA.firingMethod}</td>
                            <td class="py-2.5 px-4">${itemB.temperature} · ${itemB.firingMethod}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">口沿与底足</td>
                            <td class="py-2.5 px-4 border-r border-border-light">${itemA.rimFoot}</td>
                            <td class="py-2.5 px-4">${itemB.rimFoot}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">历史地位</td>
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
        showToast('已同步将该传世标准器调入 3D 展馆！');
    }
}

// ================================================================
// 八、宋瓷 100x 显微镜微观观察窗
// ================================================================
let currentMicroPreset = 'guan';
let currentMicroFocus = 100;

function selectMicroscopePreset(presetId) {
    currentMicroPreset = presetId;
    renderMicroscopeLens();
    if (typeof playCrackleSound === 'function') playCrackleSound();
}

function adjustMicroscopeFocus(val) {
    currentMicroFocus = parseInt(val, 10);
    const lensContent = document.getElementById('microscope-bubbles-layer');
    if (lensContent) {
        const diff = Math.abs(currentMicroFocus - 100);
        lensContent.style.filter = `blur(${(diff / 25).toFixed(1)}px)`;
    }
    const focusValText = document.getElementById('microscope-focus-value');
    if (focusValText) focusValText.textContent = `${currentMicroFocus}%`;
}

function renderMicroscopeLens() {
    const lensViewport = document.querySelector('.microscope-lens-viewport');
    const descContainer = document.getElementById('microscope-desc-card');
    const tabsContainer = document.getElementById('microscope-preset-tabs');
    if (!lensViewport || typeof microscopePresets === 'undefined') return;

    const p = microscopePresets.find(item => item.id === currentMicroPreset) || microscopePresets[0];
    lensViewport.style.background = p.bgGradient;

    let bubblesHtml = '<div id="microscope-bubbles-layer" class="w-full h-full relative transition-all">';
    for (let i = 0; i < p.bubbleCount; i++) {
        const size = Math.floor(14 + (i * 3.5) % 36);
        const top = Math.floor(20 + ((i * 37) % 65));
        const left = Math.floor(20 + ((i * 49) % 65));
        const isDeadBubble = i === 1 || i === 5;
        const deadStyle = isDeadBubble ? 'background: radial-gradient(circle at 40% 40%, rgba(90,60,40,0.9) 0%, rgba(50,30,20,0.95) 70%, #150d0a 100%); border: 1px solid rgba(130,80,50,0.6);' : '';
        bubblesHtml += `<div class="micro-bubble" style="width:${size}px; height:${size}px; top:${top}%; left:${left}%; ${deadStyle}"></div>`;
    }

    if (p.cracks) {
        p.cracks.forEach(c => {
            const crackColor = c.gold ? 'rgba(195, 145, 65, 0.88)' : (c.heavy ? 'rgba(28, 20, 15, 0.92)' : 'rgba(50, 40, 35, 0.68)');
            const crackWidth = c.heavy ? '2.5px' : '1.5px';
            bubblesHtml += `<div class="micro-crack" style="top:${c.top}; left:${c.left}; width:${c.len}; height:${crackWidth}; background:${crackColor}; transform:rotate(${c.deg}deg);"></div>`;
        });
    }
    bubblesHtml += '</div>';
    lensViewport.innerHTML = bubblesHtml;
    adjustMicroscopeFocus(currentMicroFocus);

    if (descContainer) {
        descContainer.innerHTML = `
            <div><strong class="text-text-title font-medium">【微观晶相学术释义】</strong>：${p.desc}</div>
            <div class="pt-1.5 border-t border-border-light"><strong class="text-text-title font-medium">【古董鉴伪要领】</strong>：${p.authenticity}</div>
        `;
    }
    if (tabsContainer) {
        tabsContainer.innerHTML = microscopePresets.map(item => `
            <button onclick="selectMicroscopePreset('${item.id}')" class="px-3 py-1 rounded-full text-xs font-serif-cn transition-all ${item.id === currentMicroPreset ? 'bg-tianqing-deep text-white shadow-sm' : 'bg-yuebai text-text-body'}">
                ${item.name.split(' · ')[1]}
            </button>
        `).join('');
    }
}

// ================================================================
// 九、空灵瓷韵 · 五声音阶古编磬
// ================================================================
function renderPentatonicPanel() {
    const container = document.getElementById('pentatonic-keys-container');
    if (!container || typeof pentatonicNotesData === 'undefined') return;

    container.innerHTML = pentatonicNotesData.map((note, idx) => `
        <button onclick="strikeAncientChime('${note.key}')" class="p-3 rounded-2xl bg-bg-main border border-border-light hover:border-tianqing hover:shadow-md transition-all flex flex-col items-center justify-between text-center group">
            <span class="text-[10px] text-text-muted font-mono bg-yuebai px-2 py-0.5 rounded-full mb-1">按键 ${idx + 1}</span>
            <div class="w-12 h-12 rounded-full bg-yuebai group-hover:bg-tianqing-deep flex items-center justify-center transition-colors shadow-inner my-1">
                <span class="font-serif-cn text-xl font-bold text-tianqing-deep group-hover:text-white transition-colors">${note.note}</span>
            </div>
            <div>
                <h5 class="text-xs font-serif-cn font-medium text-text-title">${note.pinyin} (${note.element})</h5>
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
let studyBookmarks = [];

function initStudyNotebook() {
    try {
        const saved = localStorage.getItem('huaxia_study_bookmarks');
        if (saved) studyBookmarks = JSON.parse(saved);
    } catch (e) {
        studyBookmarks = [];
    }
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

    let content = `# 华夏器道 · 仝瓷记忆个人古瓷研学手记\n\n`;
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
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

window.switchHeroShowcase = switchHeroShowcase;
window.toggleMuseumTheme = toggleMuseumTheme;
window.selectHistoryPeriod = selectHistoryPeriod;
window.selectKilnSpot = selectKilnSpot;
window.renderKilnGeographyMap = renderKilnGeographyMap;
window.openStepDetailModal = openStepDetailModal;
window.copyColorCode = copyColorCode;
window.previewColorIn3D = previewColorIn3D;
window.openArchiveDetailModal = openArchiveDetailModal;
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
