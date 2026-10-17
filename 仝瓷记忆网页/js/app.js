/**
 * 华夏器道 · 中国古代传统文化与古瓷数字化研鉴空间
 * 前端综合调度主控制器 (App Controller)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 3D 展馆
    if (typeof initThreeJS === 'function') {
        initThreeJS();
    }

    // 2. 初始化 AI 识瓷研鉴系统
    if (typeof initAiRecognition === 'function') {
        initAiRecognition();
    }

    // 3. 初始化指尖拉坯交互工坊
    if (typeof initPotteryWorkshop === 'function') {
        initPotteryWorkshop();
    }

    // 4. 渲染各文化模块与新增学术交互功能
    renderHistoryTimeline();
    renderKilnGeographyMap();
    renderWorkshopGrid();
    renderTraditionalColors();
    renderLiteratiArts();
    renderArchiveGrid();
    renderScholarNotes();

    // 新增四大文化与研鉴功能初始化
    initPorcelainComparison();
    renderPentatonicPanel();
    initStudyNotebook();
    renderMicroscopeLens();

    // 5. 初始化页面交互组件与高性能节流滚动
    setupNavAndScroll();
    setupMobileMenu();
    setupFadeObserver();

    // 6. 语言切换按钮
    const langToggleBtn = document.getElementById('lang-toggle');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', toggleLanguage);
    }

    // 7. 关闭初始加载屏
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 400);
});

// ================================================================
// 一、华夏陶瓷通史长卷渲染
// ================================================================
let currentHistoryId = 'song';

function renderHistoryTimeline() {
    const navContainer = document.getElementById('history-nav-nodes');
    const displayContainer = document.getElementById('history-active-display');
    if (!navContainer || !displayContainer) return;

    // 渲染历史朝代横向标签
    navContainer.innerHTML = historyPeriods.map(p => `
        <button class="history-node-btn px-4 py-2 rounded-full text-xs font-serif-cn transition-all shrink-0 ${p.id === currentHistoryId ? 'bg-tianqing-deep text-white shadow-sm' : 'bg-yuebai text-text-body hover:bg-tianqing/20'}" onclick="selectHistoryPeriod('${p.id}')">
            <span>${p.label[currentLang]}</span>
            <span class="text-[10px] opacity-75 ml-1">(${p.year.split(' ')[0]})</span>
        </button>
    `).join('');

    // 当前选定朝代的深度考据大卡片
    const p = historyPeriods.find(item => item.id === currentHistoryId) || historyPeriods[3];
    displayContainer.innerHTML = `
        <div class="feature-card p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 fade-up">
            <div class="w-full md:w-1/2 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-md shrink-0 bg-bg-main relative">
                <img src="${p.img}" alt="${p.title[currentLang]}" class="w-full h-full object-cover">
                <div class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-serif-cn">
                    ${p.year}
                </div>
            </div>
            <div class="flex-1 space-y-4 text-left">
                <span class="badge bg-tianqing-deep text-white text-xs px-3 py-1 rounded-full">${p.label[currentLang]}</span>
                <h3 class="text-2xl font-serif-cn text-text-title font-medium leading-snug">${p.title[currentLang]}</h3>
                <p class="text-sm text-text-body leading-relaxed font-light">${p.desc[currentLang]}</p>
                <div class="pt-2 flex items-center gap-3 text-xs text-text-muted">
                    <i class="fa-solid fa-scroll text-tianqing-deep"></i>
                    <span>点击上方各历史朝代，研读自远古彩陶至明清御窑之文明脉络</span>
                </div>
            </div>
        </div>
    `;
}

function selectHistoryPeriod(id) {
    currentHistoryId = id;
    renderHistoryTimeline();
}

// ================================================================
// 一点五、华夏名窑地理图谱交互
// ================================================================
let selectedKilnId = 'ru';

function renderKilnGeographyMap() {
    const spotsContainer = document.getElementById('kiln-map-spots');
    const infoContainer = document.getElementById('kiln-map-info');
    if (!spotsContainer || !infoContainer) return;

    // 渲染地图上的光点
    spotsContainer.innerHTML = kilnGeographyData.map(k => `
        <button class="kiln-map-spot ${k.id === selectedKilnId ? 'active' : ''}" style="top:${k.y}%; left:${k.x}%;" onclick="selectKilnSpot('${k.id}')" title="${k.name}">
            <span class="spot-ping"></span>
            <span class="spot-dot"></span>
            <span class="spot-label">${k.name.split(' · ')[0]}</span>
        </button>
    `).join('');

    // 渲染右侧窑口档案卡
    const k = kilnGeographyData.find(item => item.id === selectedKilnId) || kilnGeographyData[0];
    infoContainer.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start justify-between">
                <div>
                    <span class="badge bg-tianqing-deep text-white text-xs mb-1.5 inline-block">${k.status}</span>
                    <h3 class="text-xl font-serif-cn text-text-title font-medium">${k.name}</h3>
                    <p class="text-xs text-tianqing-deep font-medium mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>${k.province}</p>
                </div>
                <span class="text-xs text-text-muted font-serif-cn bg-yuebai px-3 py-1 rounded-full">${k.era}</span>
            </div>
            
            <div class="p-3.5 rounded-xl bg-bg-main border border-border-light text-xs text-text-body space-y-2">
                <div><strong class="text-text-title font-medium">【矿料与地质优势】</strong><br><span class="font-light">${k.mineral}</span></div>
                <div class="pt-1.5 border-t border-border-light/60"><strong class="text-text-title font-medium">【传世代表珍品】</strong><br><span class="text-tianqing-deep">${k.masterpiece}</span></div>
            </div>

            <div class="flex items-center justify-between text-xs pt-1">
                <span class="text-text-muted text-[11px]">*点击左侧名窑交互地图各光点，可随时查阅核心窑系</span>
                <a href="#3d-gallery" class="text-tianqing-deep font-medium hover:underline text-[11px] flex items-center gap-1">
                    <span>观摩该窑 3D 器物</span>
                    <i class="fa-solid fa-arrow-right text-[9px]"></i>
                </a>
            </div>
        </div>
    `;
}

function selectKilnSpot(id) {
    selectedKilnId = id;
    renderKilnGeographyMap();
    if (typeof playPorcelainChime === 'function') {
        playPorcelainChime(2800);
    }
}

// ================================================================
// 二、天工开物 · 七十二工核心工序网格
// ================================================================
function renderWorkshopGrid() {
    const container = document.getElementById('workshop-grid-container');
    if (!container) return;

    container.innerHTML = workshopSteps.map((step, idx) => `
        <div class="feature-card p-5 group cursor-pointer hover-lift fade-up" onclick="openStepDetailModal(${step.id})">
            <div class="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-bg-main relative">
                <img src="${step.img}" alt="${step.title[currentLang]}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <span class="absolute top-2.5 left-2.5 bg-black/55 backdrop-blur-sm text-white text-[10px] px-2.5 py-0.5 rounded-full font-serif-cn">
                    ${step.category}
                </span>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <div class="w-7 h-7 rounded-full bg-yuebai flex items-center justify-center shrink-0">
                    <i class="fa-solid ${step.icon} text-tianqing-deep text-xs"></i>
                </div>
                <h4 class="text-base font-serif-cn text-text-title font-medium">${step.title[currentLang]}</h4>
            </div>
            <p class="text-xs text-text-body line-clamp-2 font-light leading-relaxed">${step.desc[currentLang]}</p>
            <div class="mt-3 pt-2.5 border-t border-border-light flex items-center justify-between text-[11px] text-tianqing-deep">
                <span>工序研核 #${step.id}</span>
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

    modalTitle.textContent = `${step.category} · ${step.title[currentLang]}`;
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="aspect-video rounded-xl overflow-hidden shadow-sm bg-bg-main">
                <img src="${step.img}" alt="${step.title[currentLang]}" class="w-full h-full object-cover">
            </div>
            <div class="flex items-center gap-2">
                <span class="badge bg-tianqing-deep text-white text-xs px-2.5 py-1 rounded-full">${step.category}</span>
                <span class="text-xs text-text-muted">72道官窑烧造秘籍第 ${step.id} 步</span>
            </div>
            <p class="text-sm text-text-body leading-relaxed font-light">${step.desc[currentLang]}</p>
            <div class="p-4 rounded-xl bg-yuebai/60 text-xs text-text-body leading-relaxed border border-border-light">
                <strong class="font-medium text-text-title block mb-1">【古法格物技艺精髓】</strong>
                此道工序要求制瓷匠人顺应天时物候。若有毫厘之差，在后续1300℃松柴烈火中必致胎体变形开裂或釉面失色。古人云“一窑生一窑死”，恰在日常每一道细节之极致苛求。
            </div>
        </div>
    `;
    modal.classList.add('active');
}

// ================================================================
// 三、东方传统古瓷色谱渲染与交互
// ================================================================
function renderTraditionalColors() {
    const container = document.getElementById('traditional-colors-grid');
    if (!container) return;

    container.innerHTML = traditionalColors.map(c => `
        <div class="color-card p-4 rounded-2xl border border-border-light bg-white hover:shadow-lg transition-all text-left flex flex-col justify-between group fade-up">
            <div>
                <div class="aspect-[16/9] rounded-xl mb-3.5 shadow-inner relative overflow-hidden flex items-end p-2.5" style="background-color: ${c.hex};">
                    <span class="text-[10px] text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded font-mono">${c.hex}</span>
                </div>
                <div class="flex items-baseline justify-between mb-1">
                    <h4 class="text-lg font-serif-cn font-medium text-text-title">${c.name}</h4>
                    <span class="text-[11px] text-text-muted font-serif-cn">${c.pinyin}</span>
                </div>
                <span class="text-[11px] text-tianqing-deep block mb-2 font-medium">${c.dynasty}</span>
                <p class="text-xs text-text-muted italic mb-2 font-serif-cn">“${c.quote}”</p>
                <p class="text-xs text-text-body font-light leading-relaxed line-clamp-3">${c.desc}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-xs">
                <button onclick="copyColorCode('${c.hex}')" class="text-text-muted hover:text-tianqing-deep transition-colors text-[11px]">
                    <i class="fa-regular fa-copy mr-1"></i>复制色值
                </button>
                <a href="#3d-gallery" class="text-tianqing-deep font-medium hover:underline text-[11px]">
                    3D 釉面预览 <i class="fa-solid fa-arrow-up-right-from-square text-[9px] ml-0.5"></i>
                </a>
            </div>
        </div>
    `).join('');
}

function copyColorCode(hex) {
    navigator.clipboard.writeText(hex).then(() => {
        showToast(`已成功复制色值：${hex}`);
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
        <div class="feature-card p-6 rounded-2xl hover-lift fade-up">
            <div class="w-12 h-12 rounded-2xl bg-yuebai flex items-center justify-center mb-4 text-tianqing-deep text-xl">
                <i class="fa-solid ${art.icon}"></i>
            </div>
            <h4 class="text-xl font-serif-cn text-text-title font-medium mb-1">${art.title}</h4>
            <span class="text-xs text-tianqing-deep font-medium block mb-2">对应器皿：${art.vessel}</span>
            <p class="text-xs text-text-muted italic mb-3 font-serif-cn">“${art.quote}”</p>
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
        <div class="feature-card p-5 group cursor-pointer hover-lift fade-up relative" onclick="openArchiveDetailModal(${item.id})">
            <div class="aspect-square rounded-xl overflow-hidden mb-4 bg-bg-main relative">
                <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <span class="absolute top-2.5 right-2.5 bg-tianqing-deep text-white text-[10px] px-2.5 py-0.5 rounded-full font-serif-cn shadow-sm">
                    ${item.level}
                </span>
                <button onclick="event.stopPropagation(); toggleArchiveBookmark(${item.id});" class="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center hover:bg-tianqing-deep transition-colors" title="${isFav ? '从研学集移除' : '收录入研学集'}">
                    <i class="${isFav ? 'fa-solid text-amber-400' : 'fa-regular'} fa-bookmark text-xs"></i>
                </button>
            </div>
            <h4 class="text-base font-serif-cn text-text-title font-medium mb-1 truncate">${item.name}</h4>
            <p class="text-xs text-tianqing-deep font-medium mb-1">${item.kiln}</p>
            <p class="text-[11px] text-text-muted mb-2 font-mono">${item.size}</p>
            <div class="flex flex-wrap gap-1.5 mb-3">
                ${item.tags.map(t => `<span class="bg-yuebai text-text-body text-[10px] px-2 py-0.5 rounded">${t}</span>`).join('')}
            </div>
            <p class="text-xs text-text-body font-light line-clamp-2 leading-relaxed">${item.desc}</p>
            <div class="mt-3 pt-2.5 border-t border-border-light text-[11px] text-tianqing-deep flex items-center justify-between">
                <span>查阅数字化研考档案</span>
                <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
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
        <div class="space-y-4">
            <div class="aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-sm bg-bg-main">
                <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover">
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-3">
                <div>
                    <span class="text-xs text-text-muted">窑口归属：</span>
                    <strong class="text-sm font-medium text-text-title font-serif-cn">${item.kiln}</strong>
                </div>
                <span class="badge bg-tianqing-deep text-white text-xs px-3 py-1 rounded-full">${item.level}</span>
            </div>
            <div class="text-xs text-text-body space-y-2 font-light">
                <p><strong>实测规制：</strong>${item.size}</p>
                <p><strong>典型器型特征：</strong>${item.desc}</p>
            </div>
            <div class="p-4 rounded-xl bg-yuebai/60 text-xs text-text-body leading-relaxed border border-border-light">
                <strong class="font-medium text-text-title block mb-1">【个人数字化研考按语】</strong>
                此器物造型沉穆端庄，其釉汁层层厚施，微观显微镜下可见细密如沫之小气泡，胎釉交界处由于矿物氧化析出微紫发黑之晕散。属于两宋时期极高标准的皇家典范器物。
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

    container.innerHTML = scholarNotes.map((note, idx) => `
        <div class="feature-card p-6 rounded-2xl hover-lift fade-up">
            <div class="flex items-center justify-between mb-3">
                <span class="badge bg-yuebai text-tianqing-deep text-xs px-2.5 py-0.5 rounded-full font-medium">${note.category}</span>
                <span class="text-xs text-text-muted font-mono">${note.date}</span>
            </div>
            <h4 class="text-lg font-serif-cn text-text-title font-medium mb-3">${note.title}</h4>
            <p class="text-xs text-text-body font-light leading-relaxed">${note.excerpt}</p>
        </div>
    `).join('');
}

// ================================================================
// 通用弹窗关闭
// ================================================================
function closeUniversalModal() {
    const modal = document.getElementById('universal-modal');
    if (modal) modal.classList.remove('active');
}

// ================================================================
// 导航、平滑滚动与移动端折叠菜单
// ================================================================
function setupNavAndScroll() {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('back-to-top');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                if (navbar) {
                    if (scrollY > 50) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                }
                if (backToTop) {
                    if (scrollY > 400) {
                        backToTop.classList.add('visible');
                    } else {
                        backToTop.classList.remove('visible');
                    }
                }
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
        document.body.classList.add('no-scroll');
    };

    const closeMenu = () => {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    };

    if (hamburger) hamburger.addEventListener('click', openMenu);
    if (mobileClose) mobileClose.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // 点击菜单内链接自动平滑收起
    document.querySelectorAll('#mobile-menu a').forEach(a => {
        a.addEventListener('click', closeMenu);
    });
}

// ================================================================
// IntersectionObserver 渐显
// ================================================================
function setupFadeObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ================================================================
// ================================================================
// 七、新增特色一：名瓷双物并照 · 学术对比台 (Dual Porcelain Comparison)
// ================================================================
let comparisonSpecimenA = 0; // 默认汝窑贯耳瓶
let comparisonSpecimenB = 4; // 默认官窑出戟尊

function initPorcelainComparison() {
    renderPorcelainComparison();
}

function switchComparisonSpecimen(which, id) {
    id = parseInt(id, 10);
    if (which === 'A') {
        comparisonSpecimenA = id;
    } else {
        comparisonSpecimenB = id;
    }
    renderPorcelainComparison();
    if (typeof playPorcelainChime === 'function') {
        playPorcelainChime(2300);
    }
}

function renderPorcelainComparison() {
    const container = document.getElementById('porcelain-comparison-display');
    if (!container || typeof porcelainComparisonData === 'undefined') return;

    const itemA = porcelainComparisonData.find(d => d.id === comparisonSpecimenA) || porcelainComparisonData[0];
    const itemB = porcelainComparisonData.find(d => d.id === comparisonSpecimenB) || porcelainComparisonData[4];

    // 生成选择器选项
    const generateOptions = (selectedId) => {
        return porcelainComparisonData.map(item => `
            <option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>
                ${item.name} (${item.dynasty.split(' ')[0]})
            </option>
        `).join('');
    };

    container.innerHTML = `
        <div class="space-y-6">
            <!-- 标本选择器控制栏 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-white border border-border-light shadow-sm flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="badge bg-tianqing-deep text-white text-[11px] px-2.5 py-0.5 rounded-full">对照标本 A</span>
                        <button onclick="loadComparisonModelTo3D(${itemA.id})" class="text-xs text-tianqing-deep hover:underline flex items-center gap-1 font-medium">
                            <i class="fa-solid fa-cube"></i>载入 3D 展台
                        </button>
                    </div>
                    <select onchange="switchComparisonSpecimen('A', this.value)" class="w-full bg-yuebai border border-border-light rounded-lg px-3 py-2 text-xs font-serif-cn text-text-title outline-none focus:border-tianqing">
                        ${generateOptions(itemA.id)}
                    </select>
                </div>

                <div class="p-4 rounded-xl bg-white border border-border-light shadow-sm flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="badge bg-amber-700 text-white text-[11px] px-2.5 py-0.5 rounded-full">对照标本 B</span>
                        <button onclick="loadComparisonModelTo3D(${itemB.id})" class="text-xs text-amber-700 hover:underline flex items-center gap-1 font-medium">
                            <i class="fa-solid fa-cube"></i>载入 3D 展台
                        </button>
                    </div>
                    <select onchange="switchComparisonSpecimen('B', this.value)" class="w-full bg-yuebai border border-border-light rounded-lg px-3 py-2 text-xs font-serif-cn text-text-title outline-none focus:border-tianqing">
                        ${generateOptions(itemB.id)}
                    </select>
                </div>
            </div>

            <!-- 学术考据对比表 -->
            <div class="overflow-x-auto rounded-2xl border border-border-light bg-white shadow-sm">
                <table class="w-full text-xs text-left">
                    <thead>
                        <tr class="bg-yuebai/70 border-b border-border-light text-text-title font-serif-cn">
                            <th class="py-3 px-4 font-medium w-28">鉴别维度</th>
                            <th class="py-3 px-4 font-medium text-tianqing-deep border-r border-border-light/60 w-1/2">${itemA.name}</th>
                            <th class="py-3 px-4 font-medium text-amber-800 w-1/2">${itemB.name}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border-light/60 text-text-body font-light">
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">窑口与时代</td>
                            <td class="py-2.5 px-4 border-r border-border-light/60">${itemA.kiln} · ${itemA.dynasty}</td>
                            <td class="py-2.5 px-4">${itemB.kiln} · ${itemB.dynasty}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">胎骨质地</td>
                            <td class="py-2.5 px-4 border-r border-border-light/60 font-medium text-text-title">${itemA.bodyType}</td>
                            <td class="py-2.5 px-4 font-medium text-text-title">${itemB.bodyType}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">釉面特质</td>
                            <td class="py-2.5 px-4 border-r border-border-light/60">${itemA.glazeType}</td>
                            <td class="py-2.5 px-4">${itemB.glazeType}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">开片纹理</td>
                            <td class="py-2.5 px-4 border-r border-border-light/60">${itemA.crackle}</td>
                            <td class="py-2.5 px-4">${itemB.crackle}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">烧成规制</td>
                            <td class="py-2.5 px-4 border-r border-border-light/60">${itemA.temperature} · ${itemA.firingMethod}</td>
                            <td class="py-2.5 px-4">${itemB.temperature} · ${itemB.firingMethod}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">底足与修足</td>
                            <td class="py-2.5 px-4 border-r border-border-light/60">${itemA.rimFoot}</td>
                            <td class="py-2.5 px-4">${itemB.rimFoot}</td>
                        </tr>
                        <tr>
                            <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20">存世与评价</td>
                            <td class="py-2.5 px-4 border-r border-border-light/60 text-text-muted italic">${itemA.historicalRarity}</td>
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
        if (galleryEl) {
            galleryEl.scrollIntoView({ behavior: 'smooth' });
        }
        showToast('已同步将该器物载入 3D 展馆！');
    }
}

// ================================================================
// 八、新增特色二：宋瓷 100x 显微镜微观观察窗多标本与调焦升级
// ================================================================
let currentMicroPreset = 'guan';
let currentMicroFocus = 100; // 100% 为清晰

function selectMicroscopePreset(presetId) {
    currentMicroPreset = presetId;
    renderMicroscopeLens();
    if (typeof playCrackleSound === 'function') {
        playCrackleSound();
    }
}

function adjustMicroscopeFocus(val) {
    currentMicroFocus = parseInt(val, 10);
    const lensContent = document.getElementById('microscope-bubbles-layer');
    if (lensContent) {
        // 偏移 100 越远模糊度越大
        const diff = Math.abs(currentMicroFocus - 100);
        const blurPx = (diff / 25).toFixed(1);
        lensContent.style.filter = `blur(${blurPx}px)`;
    }
    const focusValText = document.getElementById('microscope-focus-value');
    if (focusValText) {
        focusValText.textContent = `${currentMicroFocus}%`;
    }
}

function renderMicroscopeLens() {
    const lensViewport = document.querySelector('.microscope-lens-viewport');
    const descContainer = document.getElementById('microscope-desc-card');
    const tabsContainer = document.getElementById('microscope-preset-tabs');
    if (!lensViewport || typeof microscopePresets === 'undefined') return;

    const p = microscopePresets.find(item => item.id === currentMicroPreset) || microscopePresets[0];

    // 更新背景梯度
    lensViewport.style.background = p.bgGradient;

    // 渲染微观气泡与晶相
    let bubblesHtml = '<div id="microscope-bubbles-layer" class="w-full h-full relative transition-all duration-200">';
    
    // 生成随机但可重现的气泡分布
    for (let i = 0; i < p.bubbleCount; i++) {
        const size = Math.floor(14 + (i * 3.5) % 36);
        const top = Math.floor(20 + ((i * 37) % 65));
        const left = Math.floor(20 + ((i * 49) % 65));
        const isDeadBubble = i === 1 || i === 5; // 老化死气泡
        const deadStyle = isDeadBubble ? 'background: radial-gradient(circle at 40% 40%, rgba(90,60,40,0.9) 0%, rgba(50,30,20,0.95) 70%, #150d0a 100%); border: 1px solid rgba(130,80,50,0.6);' : '';
        bubblesHtml += `
            <div class="micro-bubble" style="width:${size}px; height:${size}px; top:${top}%; left:${left}%; ${deadStyle}"></div>
        `;
    }

    // 渲染裂隙
    if (p.cracks) {
        p.cracks.forEach(c => {
            const crackColor = c.gold ? 'rgba(180, 140, 60, 0.85)' : (c.heavy ? 'rgba(30, 20, 15, 0.9)' : 'rgba(50, 40, 35, 0.65)');
            const crackWidth = c.heavy ? '2.5px' : '1.5px';
            bubblesHtml += `
                <div class="micro-crack" style="top:${c.top}; left:${c.left}; width:${c.len}; height:${crackWidth}; background:${crackColor}; transform:rotate(${c.deg}deg);"></div>
            `;
        });
    }
    bubblesHtml += '</div>';
    lensViewport.innerHTML = bubblesHtml;

    // 重新应用调焦滤镜
    adjustMicroscopeFocus(currentMicroFocus);

    // 更新下方学术卡片
    if (descContainer) {
        descContainer.innerHTML = `
            <div><strong class="text-text-title font-medium">【微观晶相学术释义】</strong>：${p.desc}</div>
            <div class="pt-1.5 border-t border-border-light/60"><strong class="text-text-title font-medium">【古董鉴伪要领】</strong>：${p.authenticity}</div>
        `;
    }

    // 更新标本切换药丸高亮
    if (tabsContainer) {
        tabsContainer.innerHTML = microscopePresets.map(item => `
            <button onclick="selectMicroscopePreset('${item.id}')" class="px-3 py-1 rounded-full text-xs font-serif-cn transition-all ${item.id === currentMicroPreset ? 'bg-tianqing-deep text-white shadow-sm' : 'bg-yuebai text-text-body hover:bg-tianqing/20'}">
                ${item.name.split(' · ')[1]}
            </button>
        `).join('');
    }
}

// ================================================================
// 九、新增特色三：空灵瓷韵 · 五声音阶古编磬 (Web Audio API 合成)
// ================================================================
function renderPentatonicPanel() {
    const container = document.getElementById('pentatonic-keys-container');
    if (!container || typeof pentatonicNotesData === 'undefined') return;

    container.innerHTML = pentatonicNotesData.map((note, idx) => `
        <button onclick="strikeAncientChime('${note.key}')" class="chime-key-card p-3 rounded-2xl bg-white border border-border-light hover:border-tianqing hover:shadow-md transition-all flex flex-col items-center justify-between text-center group active:scale-95">
            <span class="text-[10px] text-text-muted font-mono bg-yuebai px-2 py-0.5 rounded-full mb-1">键盘 ${idx + 1}</span>
            <div class="w-12 h-12 rounded-full bg-yuebai group-hover:bg-tianqing-deep flex items-center justify-center transition-colors shadow-inner my-1">
                <span class="font-serif-cn text-xl font-bold text-tianqing-deep group-hover:text-white transition-colors">${note.note}</span>
            </div>
            <div>
                <h5 class="text-xs font-serif-cn font-medium text-text-title">${note.pinyin} (${note.element})</h5>
                <p class="text-[10px] text-text-muted truncate mt-0.5">${note.vessel.split(' · ')[0]}</p>
            </div>
        </button>
    `).join('');

    // 绑定键盘 1-5 数字键敲击
    window.addEventListener('keydown', (e) => {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= 5) {
            const targetNote = pentatonicNotesData[keyNum - 1];
            if (targetNote) {
                strikeAncientChime(targetNote.key);
            }
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
            <span class="text-tianqing-deep font-medium font-serif-cn">${note.note}音 · ${note.element}</span>：
            ${note.desc} <span class="text-text-muted">（对应器物：${note.vessel}，主频 ${note.frequency}Hz）</span>
        `;
    }
}

// ================================================================
// 十、新增特色四：个人研学手记与典藏收藏夹 (LocalStorage 持久化)
// ================================================================
let studyBookmarks = [];

function initStudyNotebook() {
    try {
        const saved = localStorage.getItem('huaxia_study_bookmarks');
        if (saved) {
            studyBookmarks = JSON.parse(saved);
        }
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
        showToast('已从研学手记中移除该名瓷');
    } else {
        studyBookmarks.push(id);
        if (typeof playPorcelainChime === 'function') {
            playPorcelainChime(2500);
        }
        showToast('已收录入个人研学手记！');
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
                <i class="fa-regular fa-bookmark text-2xl text-border-light block mb-2"></i>
                尚未收录任何传世名瓷。请在「传世名品典藏库」卡片点击书签即可收录入研学集。
            </div>
        `;
    } else {
        const favItems = archivePorcelains.filter(item => studyBookmarks.includes(item.id));
        container.innerHTML = favItems.map(item => `
            <div class="p-3 rounded-xl bg-yuebai/50 border border-border-light flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3">
                    <img src="${item.img}" class="w-10 h-10 rounded-lg object-cover" alt="${item.name}">
                    <div>
                        <h5 class="font-serif-cn font-medium text-text-title">${item.name}</h5>
                        <p class="text-[11px] text-tianqing-deep">${item.kiln} · ${item.level}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="openArchiveDetailModal(${item.id})" class="text-tianqing-deep hover:underline text-[11px]">研读档案</button>
                    <button onclick="toggleArchiveBookmark(${item.id}); openStudyNotebook();" class="text-red-500 hover:text-red-700 text-xs px-1" title="移除"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `).join('');
    }

    modal.classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeStudyNotebook() {
    const modal = document.getElementById('study-notebook-modal');
    if (modal) modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

function saveStudyNotes() {
    const notesInput = document.getElementById('study-notebook-textarea');
    if (!notesInput) return;
    try {
        localStorage.setItem('huaxia_study_user_notes', notesInput.value);
        showToast('研学笔记已实时保存至本地！');
    } catch (e) {}
}

function exportStudyNotes() {
    const notesInput = document.getElementById('study-notebook-textarea');
    const userNotes = notesInput ? notesInput.value : '';
    const favItems = archivePorcelains.filter(item => studyBookmarks.includes(item.id));

    let content = `# 华夏器道 · 个人古瓷研学手记\n\n`;
    content += `> 研学记录时间：${new Date().toLocaleString()}\n\n`;
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

// 挂载全局方法
window.selectHistoryPeriod = selectHistoryPeriod;
window.selectKilnSpot = selectKilnSpot;
window.renderKilnGeographyMap = renderKilnGeographyMap;
window.openStepDetailModal = openStepDetailModal;
window.copyColorCode = copyColorCode;
window.openArchiveDetailModal = openArchiveDetailModal;
window.closeUniversalModal = closeUniversalModal;
window.showToast = showToast;

// 挂载新增特色方法
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


