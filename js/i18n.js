/**
 * 华夏器道 · 国际化多语言引擎 (中 / EN)
 * 职责：
 *   1. 管理 data-i18n / data-i18n-attr 属性翻译与语言持久化 (AppStore lang / localStorage huaxia_lang)
 *   2. 记忆原始中文 (WeakMap / 属性备份)，切回中文时 100% 无损还原
 *   3. 联合 i18n-en-pack.js (I18N_ZH_EN_EXACT / I18N_ZH_EN_PHRASES) 自动翻译所有静态与动态 DOM 文本/属性
 *   4. 在英文模式下通过 MutationObserver 自动翻译异步懒加载或弹窗动态注入的新内容
 */

var currentLang = (function () {
    try {
        var s = localStorage.getItem('huaxia_lang');
        if (s === 'en' || s === 'zh') return s;
    } catch (e) {}
    return 'zh';
})();

if (typeof window !== 'undefined') {
    window.currentLang = currentLang;
}

const translations = {
    zh: {
        "brand": "华夏器道",
        "tagline": "中国古代传统文化与古陶瓷数字化研鉴空间",
        "loading": "正在载入华夏器物美学长卷...",
        "nav.home": "首页 · 器道序厅",
        "nav.3d": "3D数字展馆",
        "nav.ai": "AI视觉研鉴",
        "nav.history": "陶瓷通史",
        "nav.workshop": "天工七十二工",
        "nav.fourarts": "文人四艺与点茶",
        "nav.videotheatre": "视听研学",
        "nav.colors": "釉色化学与色谱",
        "nav.archive": "名品典藏图录",
        "nav.notes": "博古殿试",
        "nav.about": "主理人致辞",
        "nav.kilnmap": "九州窑系舆图",
        "nav.pottery": "3D拉坯工坊",
        "hero.badge": "真实 3D 物理室内雅室 · 1:1实测三维扫描孪生 · 纯前端 CV 视觉鉴宝 · 语音导览与非遗工坊",
        "hero.title": "器以载道 · 格物致知",
        "hero.subtitle": "中国古代传统文化与宋韵古陶瓷 3D 数字化交互研鉴空间",
        "hero.desc": "雨过天青云破处，这般颜色做将来。融合 1:1 实测古瓷三维扫描孪生、程序化 HDR 穹顶光影、双层玻璃相清漆着色器、Voronoi 热应力冰裂开片与 X 光胎骨剖面解构，邀您步入虚实交融的千年名窑殿堂。",
        "hero.cta1": "单器 360° 精鉴台",
        "hero.cta2": "AI 视觉识瓷鉴宝",
        "hero.scroll": "顺流而下 · 纵览文脉",
        "quick.3d": "3D全景数字展厅",
        "quick.ai": "AI视觉光谱鉴宝",
        "quick.history": "八千载陶瓷通史",
        "quick.workshop": "天工七十二道工序",
        "quick.colors": "古瓷釉色化学实验室",
        "quick.archive": "传世国宝与官窑款识",
        "3d.sectionTitle": "传世名瓷 · 3D全息数字文博馆",
        "3d.sectionSub": "集成【10尊历代名瓷三维高精孪生 + 5尊1:1实测激光扫描真品】· 支持单器精鉴、全景展厅漫游与X光胎骨剖面",
        "ai.sectionTitle": "AI智能识瓷 · 多维计算机视觉与光谱研考中心",
        "ai.sectionSub": "融合传统器物学目鉴法门与纯前端像素级 RGB/HSL 光谱直方图、Sobel 高频开片裂隙梯度卷积算子",
        "history.sectionTitle": "文脉回响 · 华夏陶瓷八千年通史长卷",
        "history.sectionSub": "自新石器仰韶彩陶、东汉成熟青瓷、两宋五大名窑至明清御器厂 · 纵览泥与火的文明演进",
        "workshop.sectionTitle": "天工开物 · 景德镇与官窑七十二道核心制瓷工序",
        "workshop.sectionSub": "水碓舂石、澄泥陈腐、菊花揉泥、飞轮拉坯、半刀泥刻花、苏麻离青分水、松柴龙窑 1300℃ 还原涅槃",
        "colors.sectionTitle": "东方色谱 · 古瓷传统釉色美学与矿物化学实验室",
        "colors.sectionSub": "雨过天青、粉青如玉、月白莹霜、玫瑰紫变、曜变乌金 · 实时模拟铁铜钴矿物配比与窑炉气氛呈色机理",
        "fourarts.sectionTitle": "文人四艺 · 宋代雅集生活与建盏点茶百戏",
        "fourarts.sectionSub": "焚香、点茶、插花、挂画 · 亲手体验宋徽宗《大观茶论》“七汤击拂、盏面作画”之风雅",
        "video.sectionTitle": "视听研学 · 陶埏天工技艺展映",
        "video.sectionSub": "四大传统核心工序高清实况展映 · 融合 Web Audio API 东方意境环境音景实时发生器",
        "archive.sectionTitle": "名器考据 · 传世国宝典藏库与历代官窑款识大辞典",
        "archive.sectionSub": "精选两宋五大名窑与明清御窑标准器档案 · 附历代帝王纪年官窑底款篆刻图谱与一键 3D 检视",
        "notes.sectionTitle": "格物致知 · 独立学术札记与“文博殿试”互动考卷",
        "notes.sectionSub": "探究胎釉热膨胀失配动力学、紫口铁足矿物学成因，参与博古殿试赢取“文博翰林”数字荣誉勋章",
        "about.title": "研鉴空间主理人寄语 · 河南大学数字人文文博工程",
        "about.desc": "器以载道，道由心悟。中国陶瓷绝非冰冷的硅酸盐熔融物，而是数千年来东方先民安顿性命、体悟天人合一的精神舟楫。",
        "footer.copyright": "© 2026 天青泥火 · 华夏古瓷三维孪生博物空间",
        "footer.slogan": "器以载道 · 格物致知 · 以数字科技传薪中华千年造物文明。"
    },
    en: {
        "brand": "Vessels of China",
        "tagline": "Digital Museum & Research Space for Ancient Chinese Ceramics",
        "loading": "Loading Chinese Ceramic Heritage...",
        "nav.home": "Home",
        "nav.3d": "3D Museum",
        "nav.ai": "AI Vision",
        "nav.history": "Chronology",
        "nav.workshop": "72 Craft Steps",
        "nav.fourarts": "Literati & Tea",
        "nav.videotheatre": "Audio-Visual",
        "nav.colors": "Glaze Lab",
        "nav.archive": "Archives",
        "nav.notes": "Quiz & Notes",
        "nav.about": "Curator Note",
        "nav.kilnmap": "Kiln Atlas",
        "nav.pottery": "3D Pottery",
        "hero.badge": "Real 3D Interior Chamber · 1:1 3D Scanned Twins · Frontend CV Appraisal · Audio Guide & Studio",
        "hero.title": "Vessels of the Way · Quest for Truth",
        "hero.subtitle": "3D Interactive Digital Museum & Research Space for Song & Ming Imperial Ceramics",
        "hero.desc": "Where the sky clears after rain among broken clouds—capture that celestial hue in porcelain. Integrating 1:1 3D scanned museum twins, procedural HDR dome lighting, dual-layer glass clearcoat shaders, Voronoi thermal stress crackle normals, and X-ray cross-sectioning.",
        "hero.cta1": "360° Vessel Inspector",
        "hero.cta2": "AI Vision Appraisal",
        "hero.scroll": "Scroll Down to Explore",
        "quick.3d": "3D Virtual Rotunda",
        "quick.ai": "AI Spectral Vision",
        "quick.history": "8,000-Year Chronology",
        "quick.workshop": "72 Craft Procedures",
        "quick.colors": "Glaze Chemistry Lab",
        "quick.archive": "Treasures & Marks",
        "3d.sectionTitle": "Masterpieces · 3D Holographic Digital Museum",
        "3d.sectionSub": "Featuring 10 Masterwork PBR Twins & 5 1:1 Laser-Scanned Relics with Virtual Rotunda & X-Ray Cutaway",
        "ai.sectionTitle": "AI Porcelain Identifier · Computer Vision & Spectral Center",
        "ai.sectionSub": "Combining traditional connoisseurship with real-time RGB/HSL spectral histograms and Sobel crackle edge convolution",
        "history.sectionTitle": "Echo of Civilization · 8,000-Year Ceramic Chronology",
        "history.sectionSub": "From Neolithic Yangshao painted pottery and Song Five Great Kilns to Ming & Qing imperial workshops",
        "workshop.sectionTitle": "Tiangong Kaiwu · 72 Imperial Porcelain Procedures",
        "workshop.sectionSub": "Kaolin elutriation, chrysanthemum kneading, wheel throwing, relief carving, cobalt painting, and 1300°C dragon kiln firing",
        "colors.sectionTitle": "Eastern Palette · Glaze Aesthetics & Mineral Chemistry Lab",
        "colors.sectionSub": "Sky Blue, Powder Celadon, Moonlight White, Jun Rose Purple & Jian Tenmoku · Interactive Oxide & Flame Simulator",
        "fourarts.sectionTitle": "Four Literati Arts · Song Aesthetics & Whisked Tea Art",
        "fourarts.sectionSub": "Incense, Whisked Tea, Flower Arrangement, and Scroll Painting · Interactive Song Dynasty Tea-Whisking Experience",
        "video.sectionTitle": "Audio-Visual Theatre · Ceramic Artistry",
        "video.sectionSub": "4 Core Traditional Craftsmanship Documentaries & Real-time Web Audio Ambient Soundscapes",
        "archive.sectionTitle": "Masterpiece Archives & Imperial Reign Marks Compendium",
        "archive.sectionSub": "Standard museum vessels from the Five Great Kilns & Ming-Qing Imperial Workshops with Reign Mark Seals",
        "notes.sectionTitle": "Scholarly Monographs & Imperial Connoisseurship Examination",
        "notes.sectionSub": "Thermal stress fracture mechanics, Purple-Rim & Iron-Foot mineral genesis, and interactive scholar quiz",
        "about.title": "Curator's Statement · Digital Humanities & Heritage Engineering",
        "about.desc": "Chinese porcelain is the crystallization of earth, water, fire, and philosophical contemplation.",
        "footer.copyright": "© 2026 Vessels of China · Tianqing Nihuo Digital Ceramic Museum",
        "footer.slogan": "Embodying the Way through vessels, illuminating ancient wisdom with digital technology."
    }
};

const CJK_RE = /[\u4e00-\u9fa5]/;
const origTextMap = new WeakMap();
const origAttrMap = new WeakMap();
const origI18nHtmlMap = new WeakMap();
const translateCache = new Map();
let i18nObserver = null;
let isApplyingDom = false;

function t(key) {
    const lang = (typeof window !== 'undefined' && window.AppStore)
        ? window.AppStore.get('lang')
        : currentLang;
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    return key;
}

function translateToEnglish(raw) {
    if (typeof raw !== 'string') return raw;
    const str = raw;
    if (!CJK_RE.test(str)) return str;
    if (translateCache.has(str)) return translateCache.get(str);

    const exact = (typeof window !== 'undefined' && window.I18N_ZH_EN_EXACT) || {};
    const trimmed = str.replace(/\s+/g, ' ').trim();
    if (exact[str]) {
        translateCache.set(str, exact[str]);
        return exact[str];
    }
    if (exact[trimmed]) {
        const res = str.replace(trimmed, exact[trimmed]);
        translateCache.set(str, res);
        return res;
    }

    let out = str;
    const phrases = (typeof window !== 'undefined' && window.I18N_ZH_EN_PHRASES) || [];
    for (let i = 0; i < phrases.length; i++) {
        const pair = phrases[i];
        if (!pair || !pair[0]) continue;
        if (out.indexOf(pair[0]) !== -1) {
            out = out.split(pair[0]).join(pair[1]);
            if (!CJK_RE.test(out)) break;
        }
    }
    // 清理中式标点残余
    if (!CJK_RE.test(out)) {
        out = out
            .replace(/【\s*/g, '[').replace(/\s*】/g, ']')
            .replace(/《/g, '"').replace(/》/g, '"')
            .replace(/（/g, ' (').replace(/）/g, ')')
            .replace(/：/g, ': ').replace(/、/g, ', ').replace(/，/g, ', ').replace(/。/g, '. ')
            .replace(/\s{2,}/g, ' ').trim();
    }
    if (translateCache.size < 6000) translateCache.set(str, out);
    return out;
}

function tText(str) {
    const lang = (typeof window !== 'undefined' && window.AppStore)
        ? window.AppStore.get('lang')
        : currentLang;
    if (lang !== 'en') return str;
    return translateToEnglish(str);
}

const SKIP_ATTR_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);
const SKIP_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
const ATTRS_TO_TRANSLATE = ['title', 'alt', 'aria-label', 'placeholder'];
let origDocTitle = '';

function isLangToggleNode(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.id === 'lang-toggle') return true;
    return !!(el.closest && el.closest('#lang-toggle'));
}

function shouldSkipAttrElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (SKIP_ATTR_TAGS.has(el.tagName)) return true;
    return isLangToggleNode(el);
}

function shouldSkipTextElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (SKIP_TEXT_TAGS.has(el.tagName)) return true;
    return isLangToggleNode(el);
}

function applyDomTranslations(lang, rootNode) {
    if (typeof document === 'undefined' || isApplyingDom) return;
    const targetRoot = rootNode || document.body;
    if (!targetRoot) return;
    isApplyingDom = true;
    try {
        // 1. 优先处理显式 data-i18n 属性节点（只更新文本节点而不丢内部图标）
        const i18nEls = (rootNode ? [rootNode, ...rootNode.querySelectorAll('[data-i18n]')] : document.querySelectorAll('[data-i18n]'));
        i18nEls.forEach((el) => {
            if (!el || !el.getAttribute) return;
            const key = el.getAttribute('data-i18n');
            if (!key || !translations[lang] || !translations[lang][key]) return;
            if (el.children.length === 0) {
                el.textContent = translations[lang][key];
            } else {
                // 保留前置图标元素，替换纯文本节点
                if (!origI18nHtmlMap.has(el)) origI18nHtmlMap.set(el, el.innerHTML);
                const iconClone = el.querySelector('i');
                if (iconClone && lang === 'en') {
                    el.innerHTML = iconClone.outerHTML + ' ' + translations[lang][key];
                } else if (lang === 'zh' && origI18nHtmlMap.has(el)) {
                    el.innerHTML = origI18nHtmlMap.get(el);
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });

        // 2. 遍历元素属性 (title, alt, aria-label, placeholder)
        const allEls = [targetRoot, ...targetRoot.querySelectorAll('*')];
        for (let i = 0; i < allEls.length; i++) {
            const el = allEls[i];
            if (!el || el.nodeType !== 1 || shouldSkipAttrElement(el)) continue;
            let attrCache = origAttrMap.get(el);
            for (let j = 0; j < ATTRS_TO_TRANSLATE.length; j++) {
                const attr = ATTRS_TO_TRANSLATE[j];
                if (!el.hasAttribute(attr)) continue;
                const val = el.getAttribute(attr);
                if (lang === 'en') {
                    if (CJK_RE.test(val)) {
                        if (!attrCache) { attrCache = {}; origAttrMap.set(el, attrCache); }
                        if (!(attr in attrCache)) attrCache[attr] = val;
                        const translated = translateToEnglish(val);
                        if (translated !== val) el.setAttribute(attr, translated);
                    }
                } else if (attrCache && (attr in attrCache)) {
                    el.setAttribute(attr, attrCache[attr]);
                }
            }
        }

        // 3. 遍历文本节点进行可逆双语替换
        const walker = document.createTreeWalker(targetRoot, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
            const parent = node.parentElement;
            if (!parent || shouldSkipTextElement(parent)) continue;
            if (parent.hasAttribute('data-i18n')) continue;
            const raw = node.nodeValue;
            if (!raw || !raw.trim()) continue;
            if (lang === 'en') {
                if (CJK_RE.test(raw)) {
                    if (!origTextMap.has(node)) origTextMap.set(node, raw);
                    const translated = translateToEnglish(raw);
                    if (translated !== raw) node.nodeValue = translated;
                }
            } else if (origTextMap.has(node)) {
                node.nodeValue = origTextMap.get(node);
            }
        }
    } finally {
        if (i18nObserver && typeof i18nObserver.takeRecords === 'function') {
            i18nObserver.takeRecords();
        }
        isApplyingDom = false;
    }
}

function ensureDomObserver() {
    if (i18nObserver || typeof MutationObserver === 'undefined' || !document.body) return;
    i18nObserver = new MutationObserver((mutations) => {
        if (currentLang !== 'en' || isApplyingDom) return;
        const targets = new Set();
        for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];
            if (m.type === 'childList' && m.addedNodes.length > 0) {
                for (let j = 0; j < m.addedNodes.length; j++) {
                    const n = m.addedNodes[j];
                    if (n.nodeType === 1 && !shouldSkipAttrElement(n)) {
                        targets.add(n);
                    } else if (n.nodeType === 3 && n.parentElement && !shouldSkipTextElement(n.parentElement)) {
                        targets.add(n.parentElement);
                    }
                }
            } else if (m.type === 'characterData' && m.target && m.target.parentElement && !shouldSkipTextElement(m.target.parentElement)) {
                targets.add(m.target.parentElement);
            } else if (m.type === 'attributes' && m.target && m.target.nodeType === 1 && !shouldSkipAttrElement(m.target)) {
                targets.add(m.target);
            }
        }
        if (targets.size === 0) return;
        targets.forEach((el) => {
            if (el && el.isConnected) applyDomTranslations('en', el);
        });
    });
    i18nObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS_TO_TRANSLATE
    });
}

function switchLanguage(lang) {
    currentLang = (lang === 'en') ? 'en' : 'zh';
    if (typeof window !== 'undefined') {
        window.currentLang = currentLang;
        if (window.AppStore) window.AppStore.set('lang', currentLang);
    }
    try { localStorage.setItem('huaxia_lang', currentLang); } catch (e) {}

    if (typeof document !== 'undefined') {
        document.documentElement.lang = (currentLang === 'zh') ? 'zh-CN' : 'en';
        document.documentElement.setAttribute('data-lang', currentLang);

        if (!origDocTitle && CJK_RE.test(document.title || '')) {
            origDocTitle = document.title;
        }
        const titleZh = origDocTitle || '天青泥火 · 华夏古瓷三维研学空间 (v7.0)';
        const titleEn = 'Vessels of China · 3D Digital Museum for Ancient Chinese Ceramics (v7.0)';
        document.title = (currentLang === 'zh') ? titleZh : titleEn;

        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) {
            if (!descMeta._origDesc) descMeta._origDesc = descMeta.getAttribute('content') || '';
            descMeta.setAttribute('content', (currentLang === 'zh') ? descMeta._origDesc : translateToEnglish(descMeta._origDesc));
        }

        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.innerHTML = `<i class="fa-solid fa-language text-amber-400 mr-1" aria-hidden="true"></i>${(currentLang === 'zh') ? '中 / EN' : 'EN / 中'}`;
            langBtn.setAttribute('aria-label', currentLang === 'zh' ? '切换中英文语言' : 'Switch Language (Chinese / English)');
            langBtn.setAttribute('title', currentLang === 'zh' ? '切换中英文语言' : 'Switch Language (Chinese / English)');
        }
    }

    isApplyingDom = true;
    try {
        if (typeof window !== 'undefined' && window.AppBus) {
            window.AppBus.emit('lang:changed', { lang: currentLang });
        } else {
            if (typeof renderHistoryTimeline === 'function') renderHistoryTimeline();
            if (typeof renderWorkshopGrid === 'function') renderWorkshopGrid();
            if (typeof renderArchiveGrid === 'function') renderArchiveGrid();
        }
    } finally {
        if (i18nObserver && typeof i18nObserver.takeRecords === 'function') {
            i18nObserver.takeRecords();
        }
        isApplyingDom = false;
    }

    if (typeof document !== 'undefined') {
        applyDomTranslations(currentLang);
        ensureDomObserver();
    }
}

function toggleLanguage() {
    switchLanguage(currentLang === 'zh' ? 'en' : 'zh');
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        ensureDomObserver();
        try {
            const savedLang = localStorage.getItem('huaxia_lang');
            if (savedLang === 'en') {
                setTimeout(() => switchLanguage('en'), 140);
            }
        } catch (e) {}
    });
}

if (typeof window !== 'undefined') {
    window.t = t;
    window.tText = tText;
    window.applyDomTranslations = applyDomTranslations;
    window.switchLanguage = switchLanguage;
    window.toggleLanguage = toggleLanguage;
    window.currentLang = currentLang;
    window.translations = translations;
}
