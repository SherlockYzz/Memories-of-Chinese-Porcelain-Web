/**
 * 华夏器道 · 中国古代传统文化与古瓷数字化研鉴空间
 * 国际化多语言词条模块 (中/EN)
 */

var currentLang = 'zh';
if (typeof window !== 'undefined') {
    window.currentLang = currentLang;
}

const translations = {
    zh: {
        brand: '华夏器道',
        tagline: '中国古代传统文化与古陶瓷数字化研鉴空间',
        loading: '正在载入华夏器物美学长卷...',
        'nav.home': '首页',
        'nav.3d': '3D研鉴馆',
        'nav.ai': 'AI智能识瓷',
        'nav.history': '陶瓷通史',
        'nav.workshop': '天工七十二工',
        'nav.fourarts': '文人四艺',
        'nav.colors': '东方色谱',
        'nav.archive': '传世典藏',
        'nav.notes': '研考手记',
        'nav.about': '主理人致辞',
        'hero.badge': '个人学术与数字文博专栏 · 独立研鉴',
        'hero.title': '器以载道 · 格物致知',
        'hero.subtitle': '中国古代传统文化与宋韵古陶瓷 3D 数字化交互研鉴空间',
        'hero.desc': '以现代三维渲染与图像智能算法，探寻宋代官瓷“紫口铁足、天青如玉”之千古幽绝。虽单骑独行，亦当以数字科技守护华夏造物文脉。',
        'hero.cta1': '进入3D研鉴馆',
        'hero.cta2': 'AI智能识图鉴宝',
        'hero.scroll': '顺流而下 · 纵览文脉',
        'quick.3d': '3D交互展馆',
        'quick.ai': 'AI识图研鉴',
        'quick.history': '华夏陶瓷通史',
        'quick.workshop': '制瓷工序大观',
        'quick.colors': '传统釉色色谱',
        'quick.archive': '名物典藏档案',
        '3d.sectionTitle': '传世名瓷 · 3D交互研鉴馆',
        '3d.sectionSub': '360° 无死角审视宋代经典器型 · PBR物理釉面与动态金丝铁线',
        'ai.sectionTitle': 'AI智能识瓷 · 古陶瓷图像研考',
        'ai.sectionSub': '基于色彩直方图与高频纹理开片检测算法的纯前端古物诊断体系',
        'history.sectionTitle': '文脉回响 · 华夏陶瓷通史长卷',
        'history.sectionSub': '从新石器彩陶至当代数字文博 · 贯穿万年的泥火史诗',
        'workshop.sectionTitle': '天工开物 · 古代制瓷核心工序',
        'workshop.sectionSub': '采石淘泥、百炼成膏、旋转生形、柴窑涅槃',
        'colors.sectionTitle': '东方色谱 · 传统古瓷釉色美学',
        'colors.sectionSub': '雨过天青、粉青如玉、月白莹霜、玫瑰紫变、曜变乌金',
        'fourarts.sectionTitle': '文人四艺 · 传统器物哲学生活',
        'fourarts.sectionSub': '焚香、点茶、插花、挂画 · 器文互映的心灵净土',
        'archive.sectionTitle': '名器考据 · 传世古陶瓷典藏库',
        'archive.sectionSub': '精选两宋五大名窑与明清御窑标准器研鉴档案',
        'notes.sectionTitle': '研鉴札记 · 独立学术手记',
        'notes.sectionSub': '关于胎釉热膨胀应力、紫口铁足矿物成因的深度观察',
        'about.title': '独立研鉴人寄语',
        'about.desc': '本数字空间由我个人独立设计、研发并长久维护。因对华夏传统造物智慧与宋代极简美学之无限痴迷，我不惜投入大量心血，纯前端构建了此套 3D 古瓷仿真与智能识图系统。器物有形而道韵无涯，愿与海内外每一位热爱中华传统文化的朋友，共赏东方素雅之美。',
        'footer.copyright': '华夏器道 · 中国古代传统文化与古瓷数字化研鉴空间. 个人独立研制保留所有权利.',
        'footer.slogan': '器以载道，以数字科技传承东方文明之光。'
    },
    en: {
        brand: 'Vessels of China',
        tagline: 'Chinese Traditional Culture & Porcelain Digital Research Space',
        loading: 'Loading Chinese Aesthetic Heritage...',
        'nav.home': 'Home',
        'nav.3d': '3D Gallery',
        'nav.ai': 'AI Identifier',
        'nav.history': 'Ceramic History',
        'nav.workshop': 'Craftsmanship',
        'nav.fourarts': 'Literati Arts',
        'nav.colors': 'Traditional Colors',
        'nav.archive': 'Collections',
        'nav.notes': 'Research Notes',
        'nav.about': 'Scholar Note',
        'hero.badge': 'Independent Digital Heritage & Research Column',
        'hero.title': 'Vessels of the Way · Quest for Truth',
        'hero.subtitle': '3D Interactive Research Space for Ancient Chinese Ceramics',
        'hero.desc': 'Exploring the celestial celadon glazes and crackle aesthetics of Song imperial kilns through cutting-edge 3D rendering and image recognition.',
        'hero.cta1': 'Explore 3D Gallery',
        'hero.cta2': 'AI Porcelain Identifier',
        'hero.scroll': 'Scroll Down to Explore',
        'quick.3d': '3D Research Gallery',
        'quick.ai': 'AI Image Appraisal',
        'quick.history': 'Ceramic History',
        'quick.workshop': '72 Craft Steps',
        'quick.colors': 'Color Aesthetic',
        'quick.archive': 'Classic Treasures',
        '3d.sectionTitle': 'Classic Treasures · 3D Interactive Gallery',
        '3d.sectionSub': '360° inspection of classic Song vessels with PBR glazes and procedural crackles',
        'ai.sectionTitle': 'AI Porcelain Identifier · Digital Appraisal',
        'ai.sectionSub': 'Pure frontend diagnostics using color histograms and high-frequency crackle texture analysis',
        'history.sectionTitle': 'Echo of Civilization · Ceramic Chronology',
        'history.sectionSub': '10,000 years of clay and fire from Neolithic pottery to modern digital heritage',
        'workshop.sectionTitle': 'Tiangong Kaiwu · Imperial Craftsmanship',
        'workshop.sectionSub': 'Mining, kneading, wheel throwing, and reduction firing in wood kilns',
        'colors.sectionTitle': 'Eastern Colors · Classical Ceramic Glazes',
        'colors.sectionSub': 'Sky Blue, Powder Green, Moonlight White, Rose Purple, and Obsidian Black',
        'fourarts.sectionTitle': 'Four Literati Arts · Philosophy of Vessels',
        'fourarts.sectionSub': 'Incense, Whisked Tea, Flower Arrangement, and Painting Hanging',
        'archive.sectionTitle': 'Archaeological Archives · Masterpieces',
        'archive.sectionSub': 'Curated standard pieces from the Five Great Kilns of the Song Dynasty',
        'notes.sectionTitle': 'Scholar Notes · Research Monograph',
        'notes.sectionSub': 'Deep insights on thermal stress crackles and iron foot mineral genesis',
        'about.title': 'Independent Scholar\'s Statement',
        'about.desc': 'This digital space is independently designed, developed, and maintained by myself. Dedicated to the eternal spirit of Chinese aesthetic heritage.',
        'footer.copyright': 'Vessels of China · Independent Ceramic Heritage Project. All rights reserved.',
        'footer.slogan': 'Embodying the Way through vessels, illuminating ancient wisdom with digital technology.'
    }
};

function t(key) {
    if (translations[currentLang] && translations[currentLang][key]) {
        return translations[currentLang][key];
    }
    return key;
}

function switchLanguage(lang) {
    currentLang = lang;
    if (typeof window !== 'undefined') window.currentLang = lang;
    if (typeof document !== 'undefined') {
        document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'en';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.textContent = (lang === 'zh') ? '中 / EN' : 'EN / 中';
        }
    }

    // 重新渲染依赖语言的动态列表
    if (typeof renderHistoryTimeline === 'function') renderHistoryTimeline();
    if (typeof renderWorkshopGrid === 'function') renderWorkshopGrid();
    if (typeof renderArchiveGrid === 'function') renderArchiveGrid();
}

function toggleLanguage() {
    switchLanguage(currentLang === 'zh' ? 'en' : 'zh');
}

if (typeof window !== 'undefined') {
    window.t = t;
    window.switchLanguage = switchLanguage;
    window.toggleLanguage = toggleLanguage;
    window.currentLang = currentLang;
    window.translations = translations;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { t, switchLanguage, toggleLanguage, currentLang, translations };
}

