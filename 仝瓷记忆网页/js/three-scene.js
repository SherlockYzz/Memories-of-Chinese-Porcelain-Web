/**
 * 华夏器道 · 中国古代传统文化与古瓷数字化研鉴空间
 * 3D 传世古瓷数字化研鉴馆 (Three.js WebGL 核心引擎)
 * 纯前端高精度程序化建模、PBR 釉面玉质物理渲染、金丝铁线动态开片着色器
 */

// 全局 3D 变量
let scene, camera, renderer, currentGroup;
let lightMain, lightFill, lightRim, ambientLight;
let autoRotate = true;
let isWireframe = false;
let showCrackle = true;
let currentModelIndex = 0;
let currentGlazeIndex = 'tianqing';

// 经典古瓷器物数据字典与研鉴档案
const porcelainModelsData = [
    {
        name: '真迹3D激光测绘 · 弦纹双耳古瓶',
        english: 'Authentic 3D Relic Scan: Twin-Loop Celadon Antique Vase',
        period: '馆藏传世真迹 (实物高精度三维激光扫描)',
        kiln: '传世官制名器 (Photogrammetry 摄影测量数字孪生)',
        desc: '本件为博物馆实物真迹高精度三维扫描数字化成果（CC0开放数字遗产）。全套资产采用单反微距环绕拍摄与激光点云逆向重构，1:1 完整记录古瓷器表真实的高清照片级贴图、釉面微观凹凸法线、自然岁月风化划痕、手工拉坯不对称微澜与底足真实露胎，为真正的物理实物数字孪生。',
        features: ['实景摄影测量 1:1', '真实单反照片烘焙贴图', '实物微观凹凸法线', '器表岁月风化与手工微澜'],
        isScanned: true,
        modelUrl: 'models/ceramic_vase_01/scene.gltf',
        targetScale: 5.4,
        offsetY: -1.1
    },
    {
        name: '真迹3D激光测绘 · 窑变古陶敛口尊',
        english: 'Authentic 3D Relic Scan: Flambé Ancient Ceramic Jar',
        period: '出土真迹原器 (实物高精度三维激光扫描)',
        kiln: '古窑遗址发掘真迹 (高精扫描点云数字化)',
        desc: '本件为考古发掘出土古陶器真迹之实物三维激光扫描模型。真实还原了千年岁月在泥胎器表留下的自然土锈侵蚀、古陶粗砂微观颗粒感、手工跳刀弦纹与窑变沉淀痕迹，具有不可替代的原真学术鉴赏价值。',
        features: ['出土真迹实物测绘', '真实土锈与风化包浆', '古陶跳刀手工肌理', '原真物理点云网格'],
        isScanned: true,
        modelUrl: 'models/ceramic_vase_02/scene.gltf',
        targetScale: 7.0,
        offsetY: -1.1
    },
    {
        name: '宋汝窑·天青椭圆四足水仙盆',
        english: 'Song Ru Kiln Celadon Oval Narcissus Basin',
        period: '北宋晚期 (徽宗御定)',
        kiln: '河南宝丰清凉寺汝官窑',
        desc: '台北故宫镇馆名珍同款器型。器呈椭圆形，广口浅腹，平底微凹，下承四云头状小矮足，底留五枚细小芝麻花支钉。通体施天青失透乳浊釉，温润如凝脂美玉，融汇次表面透光与自然流釉，为中国瓷器极简审美的千古绝唱。',
        features: ['天青失透如凝脂', '四如意云头短足', '广口柔和曲线', '五枚芝麻支钉实心底'],
        defaultGlaze: 'tianqing'
    },
    {
        name: '宋官窑·八方贯耳弦纹瓶',
        english: 'Song Imperial Guan Octagonal Vase with Tubular Handles',
        period: '南宋 (1127–1279)',
        kiln: '杭州修内司官窑 / 郊坛下官窑',
        desc: '仿商周青铜礼器造型，瓶身八棱，口颈两侧各设一垂直中空贯耳，腹部起数道弦纹。胎呈灰黑紫铁之色，釉厚如堆脂，有深浅交错之蟹爪纹与金丝铁线，再现宋代“端雅穆重”的极简官样风范。',
        features: ['八方直棱轮廓', '双贯耳通气结构', '凸起弦纹起伏', '紫口铁足露胎'],
        defaultGlaze: 'tianqing'
    },
    {
        name: '宋定窑·白釉划花莲纹梅瓶',
        english: 'Song Ding Kiln Carved White-Glazed Meiping',
        period: '北宋 (960–1127)',
        kiln: '河北曲阳定窑',
        desc: '小口微卷，短颈溜肩，修腹内收，至圈足微扬。胎质坚白细腻，釉色柔润呈象牙白（定白），器身隐现流利自然的刻花莲纹。宋代文人常作插梅、存酒之雅器，姿态修长挺拔，宛若仕女。',
        features: ['小口翻唇修长', '牙白温润定色', '刀法挺拔刻花', '芒口与竹丝刷纹'],
        defaultGlaze: 'dingbai'
    },
    {
        name: '宋哥窑·金丝铁线胆式瓶',
        english: 'Song Ge Kiln Pear-Shaped Bottle with Crackle Glaze',
        period: '宋代 (960–1279)',
        kiln: '哥窑',
        desc: '直口长颈，腹部下垂如悬胆，圈足平稳。通身布满大小交织的开片纹理，粗大深黑者如“铁线”，细密浅黄者如“金丝”，网状开裂与酥油温润釉质相得益彰，天然浑成，巧夺天工。',
        features: ['悬胆式优美重心', '大开片深如墨铁', '小网纹细如金丝', '古朴百极碎韵'],
        defaultGlaze: 'fenqing'
    },
    {
        name: '宋钧窑·玫瑰紫海棠出戟尊',
        english: 'Song Jun Kiln Rose-Purple Four-Flanged Vase',
        period: '北宋晚期至金代',
        kiln: '河南禹州钧官窑',
        desc: '喇叭敞口，海棠四瓣起棱，腹部四方各附镂空透雕出戟，圈足外侈。釉料含铜、铁微量矿物，入窑经高温还原焰烧造，“入窑一色，出窑万彩”，红、蓝、紫多色晕散交错，灿若晚霞。',
        features: ['四面出戟古铜韵', '海棠起棱造型', '玫瑰紫乳浊窑变', '蚯蚓走泥纹留痕'],
        defaultGlaze: 'junhong'
    },
    {
        name: '宋建窑·兔毫曜变天目斗茶盏',
        english: 'Song Jian Kiln Hare\'s Fur Tea Bowl',
        period: '宋代 (960–1279)',
        kiln: '福建建阳水吉建窑',
        desc: '宋代“点茶、斗茶”盛事之灵魂茶器。撇口束口暗槽，斜直深壁，小高圈足。含铁量极高的乌黑釉浆在窑炉烈火中析出如野兔针毫般的条纹结晶，黑白相激，最衬宋代击拂如雪的白色茶汤。',
        features: ['束口注汤专用槽', '铁胎含铁极重', '流淌兔毫结晶', '聚温耐热宜茶'],
        defaultGlaze: 'jianhei'
    },
    {
        name: '明宣德·青花缠枝莲纹玉壶春瓶',
        english: 'Ming Xuande Blue-and-White Yuhuchun Vase',
        period: '明早期 (宣德 1426–1435)',
        kiln: '景德镇御窑厂',
        desc: '喇叭撇口，细颈柔顺，丰腹饱满如水滴，高圈足。线条呈完美曼妙之S型流线。釉面白中泛青，通体以进口苏麻离青料绘制连绵缠枝莲纹，青料浓重凝聚处有黑褐色铁锈斑，古韵盎然。',
        features: ['如滴落水珠之S弧', '苏麻离青浓艳料', '铁锈结晶斑深入胎', '橘皮棕眼肥润釉'],
        defaultGlaze: 'qinghua'
    }
];

// 经典东方古陶瓷釉色配置
const glazePalettes = {
    tianqing: {
        name: '雨过天青',
        desc: '汝官窑典型色，天青稍淡，温润如脂，失透玉质',
        color: 0x98b8b8,
        emissive: 0x051515,
        roughness: 0.18,
        metalness: 0.05,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08,
        ior: 1.52,
        reflectivity: 0.6
    },
    fenqing: {
        name: '粉青如玉',
        desc: '南宋龙泉与官窑代表，青翠柔和，似碧玉微瑕',
        color: 0x86b098,
        emissive: 0x06140b,
        roughness: 0.22,
        metalness: 0.04,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
        ior: 1.50,
        reflectivity: 0.55
    },
    yuebai: {
        name: '月白莹澈',
        desc: '月白微蓝，如皓月当空，清冷澄澈，冰清玉洁',
        color: 0xd8e4e6,
        emissive: 0x111618,
        roughness: 0.16,
        metalness: 0.03,
        clearcoat: 0.98,
        clearcoatRoughness: 0.06,
        ior: 1.54,
        reflectivity: 0.65
    },
    dingbai: {
        name: '定窑牙白',
        desc: '北宋定窑牙白色，温和内敛，泛米黄暖玉之色',
        color: 0xf3ede0,
        emissive: 0x171510,
        roughness: 0.28,
        metalness: 0.02,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
        ior: 1.48,
        reflectivity: 0.45
    },
    junhong: {
        name: '玫瑰紫变',
        desc: '禹州钧窑名品，铜还原窑变，紫红绚烂如晚霞',
        color: 0x822b52,
        emissive: 0x240616,
        roughness: 0.24,
        metalness: 0.08,
        clearcoat: 0.92,
        clearcoatRoughness: 0.1,
        ior: 1.55,
        reflectivity: 0.6
    },
    jianhei: {
        name: '建盏乌金',
        desc: '建窑黑釉兔毫，铁胎黑厚，金属光泽流淌',
        color: 0x1f1b1a,
        emissive: 0x050404,
        roughness: 0.35,
        metalness: 0.25,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        ior: 1.6,
        reflectivity: 0.7
    },
    qinghua: {
        name: '幽菁青花',
        desc: '青花地釉白微泛青，苏麻离青料幽深雅致',
        color: 0xecf0f2,
        emissive: 0x0e1215,
        roughness: 0.15,
        metalness: 0.03,
        clearcoat: 0.96,
        clearcoatRoughness: 0.07,
        ior: 1.53,
        reflectivity: 0.62
    }
};

// 内存中生成的开片、青花、兔毫、法线与展厅环境贴图缓存
let crackleTextureCache = null;
let crackleNormalCache = null;
let qinghuaTextureCache = null;
let tuhaoTextureCache = null;
let studioEnvTextureCache = null;

/**
 * 展厅级物理环境反射贴图 (IBL Environment Map)
 * 渲染宋式文雅幽暗展厅的柔光箱、冷暖补光与实木地面漫射，给瓷器釉面注入镜面清漆反射灵魂
 */
function setupStudioEnvironment(r) {
    if (!scene) return;
    try {
        if (!studioEnvTextureCache) {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 展厅幽暗主色 (深墨青木质展厅)
            const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
            bgGrad.addColorStop(0, '#101418');
            bgGrad.addColorStop(0.48, '#1e262c');
            bgGrad.addColorStop(1, '#0c0f12');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1024, 512);

            // 顶部主柔光箱 (Warm Overhead Studio Softbox)
            const softbox1 = ctx.createRadialGradient(512, 110, 8, 512, 110, 220);
            softbox1.addColorStop(0, 'rgba(255, 252, 242, 1.0)');
            softbox1.addColorStop(0.25, 'rgba(255, 240, 215, 0.75)');
            softbox1.addColorStop(0.65, 'rgba(195, 215, 230, 0.22)');
            softbox1.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = softbox1;
            ctx.fillRect(200, 0, 624, 280);

            // 左侧青冷调漫反射板 (Cool Side Fill - 勾勒青瓷冷翠轮廓)
            const softbox2 = ctx.createRadialGradient(160, 250, 5, 160, 250, 180);
            softbox2.addColorStop(0, 'rgba(205, 235, 245, 0.85)');
            softbox2.addColorStop(0.35, 'rgba(150, 195, 215, 0.35)');
            softbox2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = softbox2;
            ctx.fillRect(0, 80, 360, 340);

            // 右侧暖金调边缘轮廓光 (Warm Accent Light)
            const softbox3 = ctx.createRadialGradient(860, 220, 5, 860, 220, 160);
            softbox3.addColorStop(0, 'rgba(255, 235, 205, 0.8)');
            softbox3.addColorStop(0.4, 'rgba(215, 175, 130, 0.3)');
            softbox3.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = softbox3;
            ctx.fillRect(680, 70, 344, 300);

            // 地面微反光
            const floorGrad = ctx.createLinearGradient(0, 380, 0, 512);
            floorGrad.addColorStop(0, 'rgba(32, 44, 52, 0.45)');
            floorGrad.addColorStop(1, 'rgba(10, 13, 16, 0.95)');
            ctx.fillStyle = floorGrad;
            ctx.fillRect(0, 380, 1024, 132);

            const envTexture = new THREE.CanvasTexture(canvas);
            envTexture.mapping = THREE.EquirectangularReflectionMapping;

            if (r && typeof THREE.PMREMGenerator !== 'undefined') {
                try {
                    const pmrem = new THREE.PMREMGenerator(r);
                    pmrem.compileEquirectangularShader();
                    const envTarget = pmrem.fromEquirectangular(envTexture);
                    studioEnvTextureCache = envTarget.texture;
                    envTexture.dispose();
                    pmrem.dispose();
                } catch (e) {
                    studioEnvTextureCache = envTexture;
                }
            } else {
                studioEnvTextureCache = envTexture;
            }
        }
        scene.environment = studioEnvTextureCache;
    } catch (err) {
        console.warn('[ThreeJS 展厅环境光照] IBL 环境贴图跳过:', err);
    }
}

/**
 * 动态程序化生成具有切线空间物理微凹凸的开片/橘皮法线贴图 (Normal Map)
 */
function generateCrackleNormalMap() {
    if (crackleNormalCache) return crackleNormalCache;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 基础切线空间法线颜色：纯平面 (128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 1024, 1024);

    // 1. 绘制带有左右法线倾角的物理开片槽
    const points = [];
    for (let i = 0; i < 48; i++) {
        points.push({ x: (i * 137 + 43) % 1024, y: (i * 283 + 97) % 1024 });
    }

    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
            if (dist < 180) {
                // 左侧阳面微倾斜
                ctx.strokeStyle = 'rgb(162, 128, 255)';
                ctx.beginPath();
                ctx.moveTo(points[i].x - 1, points[i].y - 1);
                ctx.lineTo(points[j].x - 1, points[j].y - 1);
                ctx.stroke();

                // 右侧阴面微倾斜
                ctx.strokeStyle = 'rgb(94, 128, 255)';
                ctx.beginPath();
                ctx.moveTo(points[i].x + 1, points[i].y + 1);
                ctx.lineTo(points[j].x + 1, points[j].y + 1);
                ctx.stroke();
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    crackleNormalCache = texture;
    return texture;
}

/**
 * 动态程序化生成金丝铁线/冰裂纹理贴图 (HTML5 Canvas 离屏绘制)
 */
function generateCrackleTexture() {
    if (crackleTextureCache) return crackleTextureCache;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 底色微透明
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);

    // 绘制主干铁线 (粗裂纹 - 深黑铁色)
    ctx.strokeStyle = 'rgba(45, 35, 30, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = [];
    for (let i = 0; i < 48; i++) {
        points.push({
            x: Math.random() * 1024,
            y: Math.random() * 1024
        });
    }

    // 随机 Delaunay-like 网格拟合开裂
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
            if (dist < 180) {
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                const midX = (points[i].x + points[j].x) / 2 + (Math.random() - 0.5) * 16;
                const midY = (points[i].y + points[j].y) / 2 + (Math.random() - 0.5) * 16;
                ctx.quadraticCurveTo(midX, midY, points[j].x, points[j].y);
                ctx.stroke();
            }
        }
    }

    // 绘制次级金丝 (细密裂纹 - 浅金褐色)
    ctx.strokeStyle = 'rgba(175, 125, 60, 0.4)';
    ctx.lineWidth = 0.8;
    for (let k = 0; k < 120; k++) {
        const x1 = Math.random() * 1024;
        const y1 = Math.random() * 1024;
        const len = 30 + Math.random() * 80;
        const angle = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    crackleTextureCache = texture;
    return texture;
}

/**
 * 动态程序化生成青花缠枝花纹贴图
 */
function generateQinghuaTexture() {
    if (qinghuaTextureCache) return qinghuaTextureCache;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 宣德鸭蛋青白底
    ctx.fillStyle = '#eaf0f2';
    ctx.fillRect(0, 0, 1024, 1024);

    // 青花主色 (苏麻离青浓蓝)
    ctx.strokeStyle = 'rgba(28, 55, 115, 0.85)';
    ctx.fillStyle = 'rgba(28, 55, 115, 0.75)';

    // 绘制缠枝卷草纹花环
    for (let row = 0; row < 4; row++) {
        const y = 128 + row * 256;
        for (let col = 0; col < 4; col++) {
            const x = 128 + col * 256;
            ctx.save();
            ctx.translate(x, y);

            // 花头
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.stroke();

            for (let p = 0; p < 8; p++) {
                const ang = (p / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.ellipse(Math.cos(ang) * 36, Math.sin(ang) * 36, 14, 8, ang, 0, Math.PI * 2);
                ctx.fill();
            }

            // 缠枝叶
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(45, 0, 40, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();

            // 铁锈斑模拟 (晕散与结晶斑)
            ctx.fillStyle = 'rgba(20, 25, 45, 0.8)';
            ctx.beginPath();
            ctx.arc((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    qinghuaTextureCache = texture;
    return texture;
}

/**
 * 动态程序化生成建盏兔毫纹贴图
 */
function generateTuhaoTexture() {
    if (tuhaoTextureCache) return tuhaoTextureCache;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 乌金铁黑底色
    ctx.fillStyle = '#181414';
    ctx.fillRect(0, 0, 512, 1024);

    // 兔毫结晶细丝向下流淌效果
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 800;
        const h = 40 + Math.random() * 200;
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, 'rgba(180, 130, 60, 0.8)');
        gradient.addColorStop(0.5, 'rgba(120, 150, 180, 0.7)');
        gradient.addColorStop(1, 'rgba(25, 20, 20, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 4, y + h);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    tuhaoTextureCache = texture;
    return texture;
}

/**
 * 初始化并挂载 3D 研鉴展馆场景
 */
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    try {
        if (typeof THREE === 'undefined') {
            console.warn('[ThreeJS] THREE library is not loaded');
            return;
        }

        // 1. 创建场景与雾效，打造文博展厅的幽远景深
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x13181d);
        scene.fog = new THREE.FogExp2(0x13181d, 0.08);

        // 2. 摄像机 (针对移动端窄屏自适应视野与视距)
        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 600;
        const aspect = width / height;
        const isMobile = window.innerWidth < 640;
        camera = new THREE.PerspectiveCamera(isMobile ? 48 : 42, aspect, 0.1, 100);
        camera.position.set(0, 1.2, isMobile ? 4.3 : 3.8);

        // 3. 渲染器 (抗锯齿与物理色调映射)
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 3.5. 搭建文博展厅物理环境光照 (IBL Environment Map - 赋能清漆镜面与玉质反射)
        setupStudioEnvironment(renderer);

        // 4. 灯光系统 (主光、侧补光、轮廓逆光、文人雅室漫射环境光)
        ambientLight = new THREE.AmbientLight(0xdbe6ea, 0.75);
        scene.add(ambientLight);

        lightMain = new THREE.DirectionalLight(0xfff8ed, 1.8);
        lightMain.position.set(3, 5, 4);
        lightMain.castShadow = true;
        scene.add(lightMain);

        lightFill = new THREE.DirectionalLight(0x8eb3c7, 0.9);
        lightFill.position.set(-3.5, 2, -2.5);
        scene.add(lightFill);

        lightRim = new THREE.PointLight(0xffffff, 0.8, 10);
        lightRim.position.set(0, 4, -2.5);
        scene.add(lightRim);

        // 5. 展台底座与温润微阴影承托
        createPedestal();

        // 6. 初始化默认模型
        loadPorcelainModel(0);

        // 7. 绑定高质量交互手势 (阻尼旋转、滚轮多级缩放、双击视角还原)
        setupControls(canvas);

        // 8. 窗口尺寸自适应与智能视口节能监听
        window.addEventListener('resize', handleThreeResize);
        setupVisibilityObserver(canvas);

        // 9. 开启渲染循环
        animate();

        // 10. 更新 UI 研鉴卡片
        updateModelInfoCard(0);
    } catch (err) {
        console.warn('[ThreeJS 研鉴空间] WebGL 渲染器初始化异常或受设备环境限制:', err);
    }
}

/**
 * 展台底座与柔和暗影
 */
function createPedestal() {
    const baseGroup = new THREE.Group();

    // 黑色大理石雅座
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.12, 64);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1b2026,
        roughness: 0.4,
        metalness: 0.1
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.25;
    baseMesh.receiveShadow = true;
    baseGroup.add(baseMesh);

    // 底座金色铜圈装饰边缘
    const ringGeo = new THREE.TorusGeometry(1.61, 0.015, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0x9b7842,
        roughness: 0.3,
        metalness: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.19;
    baseGroup.add(ringMesh);

    scene.add(baseGroup);
}

const porcelainSkinCache = {};

/**
 * 动态程序化生成宋代名窑自然流釉、紫口铁足与聚沫攒珠气泡微观贴图
 */
function generatePorcelainSkinTexture(glazeKey) {
    const cacheKey = glazeKey + (showCrackle ? '_crackle' : '_plain');
    if (porcelainSkinCache[cacheKey]) return porcelainSkinCache[cacheKey];

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const cfg = glazePalettes[glazeKey] || glazePalettes.tianqing;
    const baseColor = new THREE.Color(cfg.color);

    // 1. 基础纯净玉质釉浆底色
    ctx.fillStyle = `#${baseColor.getHexString()}`;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. 垂直流釉与宋代“紫口铁足”自然色阶层级
    const vertGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    // 口沿 (y=0~80): 釉层自然向下淌薄，透出紫黑暗灰胎骨 (紫口出筋)
    vertGrad.addColorStop(0.0, 'rgba(40, 28, 22, 0.72)');
    vertGrad.addColorStop(0.02, 'rgba(68, 50, 42, 0.42)');
    vertGrad.addColorStop(0.06, 'rgba(110, 92, 85, 0.16)');
    vertGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0)');
    // 器身积釉转折 (y=500~800): 釉汁凝结，翠意更深
    vertGrad.addColorStop(0.55, 'rgba(10, 30, 26, 0.08)');
    vertGrad.addColorStop(0.85, 'rgba(18, 42, 38, 0.12)');
    // 足部圈足 (y=960~1024): 露铁胎黑褐干涩 (铁足)
    vertGrad.addColorStop(0.93, 'rgba(255, 255, 255, 0)');
    vertGrad.addColorStop(0.97, 'rgba(48, 32, 24, 0.68)');
    vertGrad.addColorStop(1.0, 'rgba(30, 20, 14, 0.94)');

    ctx.fillStyle = vertGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 3. 微观“聚沫攒珠”气泡点缀 (宋汝窑、官窑微观典型鉴定特征)
    for (let i = 0; i < 260; i++) {
        const bx = Math.random() * 1024;
        const by = Math.random() * 1024;
        const br = 0.8 + Math.random() * 2.0;
        const bAlpha = 0.06 + Math.random() * 0.14;
        ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha})`;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 若开启开片，叠加宋代哥窑/官窑分形自然裂纹
    if (showCrackle) {
        // 主干铁线 (粗深墨铁色)
        ctx.strokeStyle = 'rgba(38, 28, 22, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const mainPoints = [];
        for (let i = 0; i < 36; i++) {
            mainPoints.push({ x: Math.random() * 1024, y: Math.random() * 1024 });
        }
        for (let i = 0; i < mainPoints.length; i++) {
            for (let j = i + 1; j < mainPoints.length; j++) {
                const dist = Math.hypot(mainPoints[i].x - mainPoints[j].x, mainPoints[i].y - mainPoints[j].y);
                if (dist < 190) {
                    ctx.beginPath();
                    ctx.moveTo(mainPoints[i].x, mainPoints[i].y);
                    const cx = (mainPoints[i].x + mainPoints[j].x) / 2 + (Math.random() - 0.5) * 24;
                    const cy = (mainPoints[i].y + mainPoints[j].y) / 2 + (Math.random() - 0.5) * 24;
                    ctx.quadraticCurveTo(cx, cy, mainPoints[j].x, mainPoints[j].y);
                    ctx.stroke();
                }
            }
        }

        // 次生金丝 (细密金黄色小纹)
        ctx.strokeStyle = 'rgba(185, 138, 70, 0.45)';
        ctx.lineWidth = 0.9;
        for (let k = 0; k < 140; k++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const len = 25 + Math.random() * 70;
            const ang = Math.random() * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
            ctx.stroke();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    porcelainSkinCache[cacheKey] = texture;
    return texture;
}

/**
 * 生成当前选定釉色的 PBR MeshPhysicalMaterial (高仿真微观物理材质 · 次表面玉质透光)
 */
function getPorcelainMaterial(glazeKey = currentGlazeIndex, isTieZu = false) {
    // 铁足胎骨专用材质 (紫黑灰褐铁胎，粗糙干涩露胎)
    if (isTieZu) {
        return new THREE.MeshStandardMaterial({
            color: 0x2b1e17,
            roughness: 0.92,
            metalness: 0.12,
            wireframe: isWireframe
        });
    }

    const cfg = glazePalettes[glazeKey] || glazePalettes.tianqing;
    const matOptions = {
        color: cfg.color,
        emissive: cfg.emissive || 0x000000,
        roughness: cfg.roughness !== undefined ? cfg.roughness : 0.12,
        metalness: cfg.metalness !== undefined ? cfg.metalness : 0.04,
        clearcoat: cfg.clearcoat || 0.98,
        clearcoatRoughness: cfg.clearcoatRoughness || 0.03,
        ior: cfg.ior || 1.52,
        reflectivity: cfg.reflectivity || 0.88,
        // 次表面玉质散射核心参数 (光线穿透外表清漆漫射，告别塑料感)
        transmission: 0.32,
        thickness: 1.15,
        attenuationColor: new THREE.Color(cfg.color),
        attenuationDistance: 0.75,
        wireframe: isWireframe,
        envMapIntensity: 1.45
    };

    // 贴图与法线物理混合
    if (glazeKey === 'qinghua') {
        matOptions.map = generateQinghuaTexture();
        matOptions.transmission = 0.12;
        matOptions.roughness = 0.12;
        matOptions.clearcoat = 0.98;
        matOptions.clearcoatRoughness = 0.03;
    } else if (glazeKey === 'jianhei') {
        matOptions.map = generateTuhaoTexture();
        matOptions.transmission = 0.0;
        matOptions.roughness = 0.28;
        matOptions.metalness = 0.18;
        matOptions.clearcoat = 0.85;
    } else {
        // 宋代单色釉：赋予带紫口出筋与垂直流釉之高真贴图
        matOptions.map = generatePorcelainSkinTexture(glazeKey);
        if (showCrackle) {
            const normMap = generateCrackleNormalMap();
            if (normMap) {
                matOptions.normalMap = normMap;
                matOptions.normalScale = new THREE.Vector2(0.28, 0.28);
            }
        }
    }

    return new THREE.MeshPhysicalMaterial(matOptions);
}

/**
 * 核心：七大传世古代器型高精度几何体生成器
 */
function buildGeometry(typeIndex) {
    const group = new THREE.Group();
    const glazeMat = getPorcelainMaterial(currentGlazeIndex);
    const tiezuMat = getPorcelainMaterial(currentGlazeIndex, true);

    switch (typeIndex) {
        case 0: {
            // ==========================================
            // 0. 宋汝窑·天青椭圆四足水仙盆
            // ==========================================
            // 盆体主体：深腹内凹椭圆平底水仙盆（封闭实心底，彻底解决底心镂空空洞BUG）
            const points = [
                new THREE.Vector2(0.0, -0.27),   // 底部外平底中心
                new THREE.Vector2(0.40, -0.272), // 底部外平底延伸
                new THREE.Vector2(0.70, -0.28),  // 底部外边缘 (转折弧)
                new THREE.Vector2(0.84, -0.16),  // 盆腹下弧
                new THREE.Vector2(0.93, 0.02),   // 盆腹丰满外鼓
                new THREE.Vector2(0.98, 0.15),   // 广口外缘
                new THREE.Vector2(0.95, 0.18),   // 柔和微圆唇边口沿
                new THREE.Vector2(0.90, 0.17),   // 内口沿
                new THREE.Vector2(0.85, 0.02),   // 盆内壁上部
                new THREE.Vector2(0.76, -0.14),  // 盆内壁下收
                new THREE.Vector2(0.65, -0.20),  // 盆内底交界圆角
                new THREE.Vector2(0.40, -0.205), // 盆内底平展面
                new THREE.Vector2(0.0, -0.21)    // 盆内底中心！完整闭合实心盆底！
            ];
            const basinGeo = new THREE.LatheGeometry(points, 64);
            const basinMesh = new THREE.Mesh(basinGeo, glazeMat);
            // 压扁成典雅的宋代椭圆型 (长径:短径 比例约 1.25 : 0.88)
            basinMesh.scale.set(1.25, 1.0, 0.88);
            basinMesh.castShadow = true;
            basinMesh.receiveShadow = true;
            group.add(basinMesh);

            // 四只如意云头短足 (底部承托)
            const footPositions = [
                { x: 0.65, z: 0.4 },
                { x: -0.65, z: 0.4 },
                { x: 0.65, z: -0.4 },
                { x: -0.65, z: -0.4 }
            ];
            for (let pos of footPositions) {
                const footGroup = new THREE.Group();
                const footGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.10, 16);
                const footMesh = new THREE.Mesh(footGeo, glazeMat);
                footMesh.position.y = -0.02;
                footGroup.position.set(pos.x, -0.31, pos.z);
                footGroup.add(footMesh);
                group.add(footGroup);
            }

            // 汝窑官窑“芝麻花细小支钉”痕迹 (底面考据级五枚支烧痕)
            const spurPositions = [
                { x: 0.0, z: 0.0 },
                { x: 0.38, z: 0.16 },
                { x: -0.38, z: 0.16 },
                { x: 0.38, z: -0.16 },
                { x: -0.38, z: -0.16 }
            ];
            const spurMat = new THREE.MeshStandardMaterial({
                color: 0x9b958c, // 芝麻支钉露灰白胎骨
                roughness: 0.9,
                metalness: 0.05
            });
            for (let s of spurPositions) {
                const spurGeo = new THREE.SphereGeometry(0.018, 8, 8);
                const spurMesh = new THREE.Mesh(spurGeo, spurMat);
                spurMesh.scale.set(1.4, 0.35, 0.8);
                spurMesh.position.set(s.x, -0.276, s.z);
                group.add(spurMesh);
            }

            group.position.y = -0.05;
            break;
        }

        case 1: {
            // ==========================================
            // 1. 宋官窑·八方贯耳弦纹瓶
            // ==========================================
            const points = [
                new THREE.Vector2(0.0, -1.05),  // 圈足底心凹底（封闭）
                new THREE.Vector2(0.20, -1.08),
                new THREE.Vector2(0.24, -1.15), // 圈足底
                new THREE.Vector2(0.32, -1.13), // 圈足外缘
                new THREE.Vector2(0.35, -0.9),  // 圈足收口
                new THREE.Vector2(0.48, -0.75), // 瓶腹下沿
                new THREE.Vector2(0.68, -0.4),  // 瓶腹最宽
                new THREE.Vector2(0.64, -0.1),  // 瓶腹转折
                new THREE.Vector2(0.42, 0.2),   // 敛颈
                new THREE.Vector2(0.30, 0.4),   // 细颈
                new THREE.Vector2(0.30, 0.8),   // 直颈
                new THREE.Vector2(0.34, 0.95),  // 侈口
                new THREE.Vector2(0.32, 1.0),   // 口沿唇边
                new THREE.Vector2(0.26, 1.0),   // 内口沿
                new THREE.Vector2(0.24, 0.85),  // 颈内壁
                new THREE.Vector2(0.18, 0.5),
                new THREE.Vector2(0.0, 0.35)    // 瓶内颈深处封闭
            ];
            // 旋转体（32段，微带八方棱角折光感）
            const bodyGeo = new THREE.LatheGeometry(points, 32);
            const bodyMesh = new THREE.Mesh(bodyGeo, glazeMat);
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            // 颈部两只贯耳 (垂直中空圆管)
            for (let side of [-1, 1]) {
                const earGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.35, 24, 1, true);
                const earMesh = new THREE.Mesh(earGeo, glazeMat);
                earMesh.position.set(side * 0.33, 0.65, 0);
                group.add(earMesh);
            }

            // 瓶身凸起弦纹 (Torus)
            const ringY = [-0.4, -0.1, 0.5];
            const ringR = [0.685, 0.645, 0.315];
            for (let r = 0; r < ringY.length; r++) {
                const ringGeo = new THREE.TorusGeometry(ringR[r], 0.018, 16, 48);
                const ringMesh = new THREE.Mesh(ringGeo, glazeMat);
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.position.y = ringY[r];
                group.add(ringMesh);
            }

            // 紫口铁足底环 (圈足露铁胎)
            const footGeo = new THREE.TorusGeometry(0.28, 0.02, 16, 48);
            const footMesh = new THREE.Mesh(footGeo, tiezuMat);
            footMesh.rotation.x = Math.PI / 2;
            footMesh.position.y = -1.15;
            group.add(footMesh);

            group.position.y = 0.05;
            break;
        }

        case 2: {
            // ==========================================
            // 2. 宋定窑·白釉划花莲纹梅瓶
            // ==========================================
            const points = [
                new THREE.Vector2(0.24, -1.15), // 圈足底
                new THREE.Vector2(0.30, -1.12),
                new THREE.Vector2(0.32, -0.9),  // 挺拔下腹
                new THREE.Vector2(0.38, -0.5),  // 柔收腰部
                new THREE.Vector2(0.55, 0.0),   // 丰满中腹
                new THREE.Vector2(0.68, 0.45),  // 丰肩
                new THREE.Vector2(0.60, 0.68),  // 溜肩收缩
                new THREE.Vector2(0.22, 0.78),  // 极细短颈
                new THREE.Vector2(0.18, 0.88),  // 颈口
                new THREE.Vector2(0.28, 0.94),  // 小口翻唇（梯形盘口）
                new THREE.Vector2(0.27, 0.98),
                new THREE.Vector2(0.12, 0.98),  // 小口内径
                new THREE.Vector2(0.10, 0.82)
            ];
            const meipingGeo = new THREE.LatheGeometry(points, 64);
            const meipingMesh = new THREE.Mesh(meipingGeo, glazeMat);
            meipingMesh.castShadow = true;
            group.add(meipingMesh);

            // 定窑芒口露胎圈
            const mangGeo = new THREE.TorusGeometry(0.275, 0.01, 16, 48);
            const mangMesh = new THREE.Mesh(mangGeo, tiezuMat);
            mangMesh.rotation.x = Math.PI / 2;
            mangMesh.position.y = 0.96;
            group.add(mangMesh);

            group.position.y = 0.08;
            break;
        }

        case 3: {
            // ==========================================
            // 3. 宋哥窑·金丝铁线胆式瓶
            // ==========================================
            const points = [
                new THREE.Vector2(0.28, -1.1),
                new THREE.Vector2(0.36, -1.08),
                new THREE.Vector2(0.42, -0.85),
                new THREE.Vector2(0.72, -0.45), // 悬胆垂腹最低最宽处
                new THREE.Vector2(0.68, -0.1),
                new THREE.Vector2(0.52, 0.2),   // 顺滑向上收敛
                new THREE.Vector2(0.26, 0.5),   // 细长颈
                new THREE.Vector2(0.22, 0.8),
                new THREE.Vector2(0.24, 1.05),  // 直口微厚
                new THREE.Vector2(0.16, 1.05),
                new THREE.Vector2(0.15, 0.85)
            ];
            const danGeo = new THREE.LatheGeometry(points, 64);
            const danMesh = new THREE.Mesh(danGeo, glazeMat);
            danMesh.castShadow = true;
            group.add(danMesh);

            // 紫口紫褐釉口沿
            const lipGeo = new THREE.TorusGeometry(0.23, 0.015, 16, 48);
            const lipMesh = new THREE.Mesh(lipGeo, tiezuMat);
            lipMesh.rotation.x = Math.PI / 2;
            lipMesh.position.y = 1.05;
            group.add(lipMesh);

            // 铁足
            const footGeo = new THREE.TorusGeometry(0.32, 0.02, 16, 48);
            const footMesh = new THREE.Mesh(footGeo, tiezuMat);
            footMesh.rotation.x = Math.PI / 2;
            footMesh.position.y = -1.1;
            group.add(footMesh);

            group.position.y = 0.05;
            break;
        }

        case 4: {
            // ==========================================
            // 4. 宋钧窑·玫瑰紫海棠出戟尊
            // ==========================================
            const points = [
                new THREE.Vector2(0.0, -0.92),  // 高圈足内凹顶心（封闭）
                new THREE.Vector2(0.35, -1.02),
                new THREE.Vector2(0.42, -1.1),  // 外撇高圈足底
                new THREE.Vector2(0.48, -1.08),
                new THREE.Vector2(0.38, -0.75), // 圈足缩腹
                new THREE.Vector2(0.62, -0.2),  // 尊腹凸起最宽处
                new THREE.Vector2(0.60, 0.05),
                new THREE.Vector2(0.40, 0.35),  // 颈部收束
                new THREE.Vector2(0.68, 0.85),  // 大喇叭口外敞
                new THREE.Vector2(0.75, 0.95),  // 花瓣唇沿
                new THREE.Vector2(0.65, 0.95),
                new THREE.Vector2(0.35, 0.35),  // 喇叭口内壁收束
                new THREE.Vector2(0.48, -0.1),  // 腹内壁
                new THREE.Vector2(0.28, -0.4),  // 尊内腹底
                new THREE.Vector2(0.0, -0.45)   // 尊内底中心（完全封闭！）
            ];
            const zunGeo = new THREE.LatheGeometry(points, 48);
            const zunMesh = new THREE.Mesh(zunGeo, glazeMat);
            zunMesh.castShadow = true;
            group.add(zunMesh);

            // 四面立体出戟棱齿 (Flanges)
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const flangeGroup = new THREE.Group();
                flangeGroup.rotation.y = angle;

                // 颈部出戟
                const flangeTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.04), glazeMat);
                flangeTop.position.set(0.48, 0.55, 0);
                flangeGroup.add(flangeTop);

                // 腹部出戟
                const flangeMid = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.32, 0.04), glazeMat);
                flangeMid.position.set(0.65, -0.1, 0);
                flangeGroup.add(flangeMid);

                // 足部出戟
                const flangeBot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.04), glazeMat);
                flangeBot.position.set(0.44, -0.9, 0);
                flangeGroup.add(flangeBot);

                group.add(flangeGroup);
            }

            group.position.y = 0.05;
            break;
        }

        case 5: {
            // ==========================================
            // 5. 宋建窑·兔毫曜变天目斗茶盏
            // ==========================================
            const points = [
                new THREE.Vector2(0.0, -0.70),  // 盏底心外凹（封闭）
                new THREE.Vector2(0.14, -0.72),
                new THREE.Vector2(0.18, -0.75), // 极小矮圈足
                new THREE.Vector2(0.28, -0.72),
                new THREE.Vector2(0.32, -0.6),  // 铁胎露出部
                new THREE.Vector2(0.55, -0.3),  // 腹壁斜直展开
                new THREE.Vector2(0.78, 0.05),  // 扩口
                new THREE.Vector2(0.86, 0.25),  // 束口暗槽下
                new THREE.Vector2(0.84, 0.32),  // 束口内敛暗槽 (宋代点茶汤花防止溢出)
                new THREE.Vector2(0.88, 0.38),  // 盏口唇沿
                new THREE.Vector2(0.82, 0.38),  // 盏内壁
                new THREE.Vector2(0.45, -0.2),
                new THREE.Vector2(0.16, -0.55), // 盏内底心斜收
                new THREE.Vector2(0.0, -0.58)   // 盏内底心（完全封闭！）
            ];
            const bowlGeo = new THREE.LatheGeometry(points, 64);
            const bowlMesh = new THREE.Mesh(bowlGeo, glazeMat);
            bowlMesh.castShadow = true;
            group.add(bowlMesh);

            // 盏底深黑铁足露出
            const footGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.12, 32);
            const footMesh = new THREE.Mesh(footGeo, tiezuMat);
            footMesh.position.y = -0.72;
            group.add(footMesh);

            group.position.y = -0.15;
            break;
        }

        case 6: {
            // ==========================================
            // 6. 明宣德·青花缠枝莲纹玉壶春瓶
            // ==========================================
            const points = [
                new THREE.Vector2(0.32, -1.1),  // 圈足底
                new THREE.Vector2(0.42, -1.08),
                new THREE.Vector2(0.45, -0.85), // 垂腹起弧
                new THREE.Vector2(0.72, -0.35), // 最丰满水滴圆腹
                new THREE.Vector2(0.66, 0.0),
                new THREE.Vector2(0.45, 0.3),   // 细腰长颈
                new THREE.Vector2(0.26, 0.65),  // 颈部极细处
                new THREE.Vector2(0.30, 0.9),   // 喇叭形撇口起弧
                new THREE.Vector2(0.52, 1.15),  // 优美外翻大撇口
                new THREE.Vector2(0.45, 1.15),
                new THREE.Vector2(0.22, 0.65),
                new THREE.Vector2(0.35, -0.4)
            ];
            const yuGeo = new THREE.LatheGeometry(points, 64);
            const yuMesh = new THREE.Mesh(yuGeo, glazeMat);
            yuMesh.castShadow = true;
            group.add(yuMesh);

            // 圈足底青花双圈
            const footGeo = new THREE.TorusGeometry(0.38, 0.015, 16, 48);
            const footMesh = new THREE.Mesh(footGeo, tiezuMat);
            footMesh.rotation.x = Math.PI / 2;
            footMesh.position.y = -1.1;
            group.add(footMesh);

            group.position.y = 0.02;
            break;
        }

        default:
            break;
    }

    return group;
}

const loadedGltfCache = {};

/**
 * 将解析好的实物扫描 3D 模型装配入场景
 */
function applyLoadedGltfModel(model, m) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const targetScale = m.targetScale || (2.2 / (size.y || 1));
    model.scale.set(targetScale, targetScale, targetScale);

    const center = box.getCenter(new THREE.Vector3());
    model.position.x = -center.x * targetScale;
    model.position.y = (m.offsetY !== undefined ? m.offsetY : -1.1);
    model.position.z = -center.z * targetScale;

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.envMapIntensity = 1.35;
                child.material.side = THREE.DoubleSide;
                child.material.wireframe = isWireframe;
            }
        }
    });

    currentGroup = new THREE.Group();
    currentGroup.add(model);
    scene.add(currentGroup);
}

/**
 * 加载并切换指定器型 (双轨支持：馆藏实物真迹扫描 / 宋代御窑法典数字推演)
 */
function loadPorcelainModel(index) {
    if (currentGroup) {
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        currentGroup = null;
    }
    currentModelIndex = index;

    const m = porcelainModelsData[index];
    if (!m) return;

    if (m.isScanned && m.modelUrl) {
        // 馆藏实物真迹扫描模型
        if (loadedGltfCache[m.modelUrl]) {
            applyLoadedGltfModel(loadedGltfCache[m.modelUrl].clone(true), m);
        } else {
            if (typeof THREE.GLTFLoader === 'undefined') {
                console.error('GLTFLoader not ready');
                return;
            }
            const loader = new THREE.GLTFLoader();
            loader.load(m.modelUrl, (gltf) => {
                const model = gltf.scene || gltf.scenes[0];
                loadedGltfCache[m.modelUrl] = model;
                applyLoadedGltfModel(model.clone(true), m);
            }, undefined, (err) => {
                console.error('[GLTF Loader] 真迹扫描模型载入异常:', err);
                showToast('真迹扫描模型文件载入受阻，请确保本地服务正常运行');
            });
        }
    } else {
        // 宋代御窑法典数字推演器型 (启用次表面玉质透光)
        if (m.defaultGlaze) {
            currentGlazeIndex = m.defaultGlaze;
        }
        // 几何体索引为 index - 2 (前两个为实物扫描)
        const geoIndex = index - 2;
        currentGroup = buildGeometry(geoIndex);
        scene.add(currentGroup);
    }

    // 缓动平滑复位视角
    camera.position.set(0, 1.2, 3.8);
    camera.lookAt(0, 0, 0);

    // 更新信息卡片与按钮高亮
    updateModelInfoCard(index);
    highlightActiveModelBtn(index);
    if (!m.isScanned) {
        highlightActiveGlazeBtn(currentGlazeIndex);
    }
}

/**
 * 切换釉色 (实时重构物理次表面 SSS 材质)
 */
function switchGlaze(glazeKey) {
    if (!glazePalettes[glazeKey]) return;
    const m = porcelainModelsData[currentModelIndex];
    if (m && m.isScanned) {
        showToast('当前展示为【馆藏实物真迹扫描】，保留真实出土/传世摄影烘焙表面；请选择下方【御窑法典复原】器型进行釉色试烧。');
        return;
    }
    currentGlazeIndex = glazeKey;
    // 重新构建材质
    if (currentGroup) {
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        const geoIndex = currentModelIndex - 2;
        currentGroup = buildGeometry(geoIndex);
        scene.add(currentGroup);
    }
    highlightActiveGlazeBtn(glazeKey);
    showToast(`已切换釉色为：【${glazePalettes[glazeKey].name}】`);
}

/**
 * 开关开片纹理 (金丝铁线/冰裂纹)
 */
function toggleCrackle() {
    const m = porcelainModelsData[currentModelIndex];
    if (m && m.isScanned) {
        showToast('当前展示为实物真迹三维点云扫描，已记录自然岁月风化与真迹开片。');
        return;
    }
    showCrackle = !showCrackle;
    if (currentGroup) {
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        const geoIndex = currentModelIndex - 2;
        currentGroup = buildGeometry(geoIndex);
        scene.add(currentGroup);
    }
    const btn = document.getElementById('btn-crackle-toggle');
    if (btn) {
        btn.classList.toggle('active', showCrackle);
    }
    showToast(showCrackle ? '已开启【开片冰裂金丝铁线】' : '已关闭开片纹理（素净玉面）');
}

/**
 * 开关线框透视研鉴模式 (Wireframe)
 */
function toggleWireframe() {
    isWireframe = !isWireframe;
    const m = porcelainModelsData[currentModelIndex];
    if (m && m.isScanned) {
        if (currentGroup) {
            currentGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.wireframe = isWireframe;
                }
            });
        }
    } else {
        if (currentGroup) {
            disposeGroup(currentGroup);
            scene.remove(currentGroup);
            const geoIndex = currentModelIndex - 2;
            currentGroup = buildGeometry(geoIndex);
            scene.add(currentGroup);
        }
    }
    const btn = document.getElementById('btn-wireframe-toggle');
    if (btn) {
        btn.classList.toggle('active', isWireframe);
    }
    showToast(isWireframe ? '已开启【器型力学校对线框模式】' : '已恢复【PBR 物理渲染模式】');
}

/**
 * 切换自动旋转
 */
function toggleAutoRotate() {
    autoRotate = !autoRotate;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) {
        btn.classList.toggle('active', autoRotate);
    }
}

/**
 * 切换视角 (正视、俯视、底足、45度)
 */
function setCameraView(viewType) {
    autoRotate = false;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.remove('active');

    if (!currentGroup) return;
    currentGroup.rotation.set(0, 0, 0);

    switch (viewType) {
        case 'front':
            camera.position.set(0, 0, 3.6);
            break;
        case 'top':
            camera.position.set(0, 4.0, 0.1);
            break;
        case 'bottom':
            camera.position.set(0, -3.2, 1.8);
            break;
        case 'perspective':
        default:
            camera.position.set(0, 1.2, 3.8);
            break;
    }
    camera.lookAt(0, 0, 0);
}

/**
 * 鼠标与触屏阻尼交互控制
 */
/**
 * 测绘标线系统 (Dimension Measurement System)
 */
let showDimensions = false;
let dimensionGroup = null;

function toggleDimensionLines() {
    showDimensions = !showDimensions;
    if (dimensionGroup) {
        scene.remove(dimensionGroup);
        dimensionGroup = null;
    }
    if (showDimensions && currentGroup) {
        dimensionGroup = createDimensionLines(currentModelIndex);
        scene.add(dimensionGroup);
    }
    const btn = document.getElementById('btn-dimensions-toggle');
    if (btn) btn.classList.toggle('active', showDimensions);
    showToast(showDimensions ? '已开启【器物公分测绘标定线】' : '已关闭测绘标线');
}

function createDimensionLines(index) {
    const group = new THREE.Group();
    const lineMat = new THREE.LineDashedMaterial({
        color: 0x8FB8C0,
        dashSize: 0.04,
        gapSize: 0.02,
        linewidth: 1
    });

    // 绘制侧面垂直基准高线
    const heightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(1.15, -1.15, 0),
        new THREE.Vector3(1.15, 1.05, 0)
    ]);
    const heightLine = new THREE.Line(heightGeo, lineMat);
    heightLine.computeLineDistances();
    group.add(heightLine);

    // 水平指示箭头线
    const topGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.35, 1.05, 0),
        new THREE.Vector3(1.2, 1.05, 0)
    ]);
    const topLine = new THREE.Line(topGeo, lineMat);
    topLine.computeLineDistances();
    group.add(topLine);

    const botGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.35, -1.15, 0),
        new THREE.Vector3(1.2, -1.15, 0)
    ]);
    const botLine = new THREE.Line(botGeo, lineMat);
    botLine.computeLineDistances();
    group.add(botLine);

    return group;
}

/**
 * 打开宋瓷 100x 显微镜微观聚沫攒珠视图
 */
function openMicroscopeView() {
    const modal = document.getElementById('microscope-modal');
    if (!modal) return;
    modal.classList.add('active');
    if (typeof playCrackleSound === 'function') {
        playCrackleSound();
    }
}

function closeMicroscopeView() {
    const modal = document.getElementById('microscope-modal');
    if (modal) modal.classList.remove('active');
}

/**
 * 鼠标与触屏阻尼交互控制 (全面支持多指触屏缩放)
 */
function setupControls(canvas) {
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotX = 0, rotY = 0;
    let initialPinchDist = null;
    let initialCameraZ = 3.8;

    canvas.addEventListener('pointerdown', (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
        autoRotate = false;
        const btn = document.getElementById('btn-rotate-toggle');
        if (btn) btn.classList.remove('active');
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging || !currentGroup) return;
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;

        rotY += deltaX * 0.008;
        rotX += deltaY * 0.008;

        // 垂直俯仰角限制，避免翻转
        rotX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotX));

        currentGroup.rotation.y = rotY;
        currentGroup.rotation.x = rotX;

        prevX = e.clientX;
        prevY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
    });

    // 移动端双指 Pinch 捏合缩放
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialCameraZ = camera.position.z;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialPinchDist) {
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scale = initialPinchDist / currentDist;
            camera.position.z = Math.max(1.8, Math.min(6.5, initialCameraZ * scale));
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            initialPinchDist = null;
        }
    });

    // 滚轮缩放
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * 0.003;
        camera.position.z = Math.max(1.8, Math.min(6.5, camera.position.z + delta));
    }, { passive: false });

    // 单击器物发声
    canvas.addEventListener('click', () => {
        if (typeof playPorcelainChime === 'function') {
            playPorcelainChime(2200 + Math.random() * 400);
        }
    });

    // 双击还原初始视角
    canvas.addEventListener('dblclick', () => {
        resetCamera();
    });

    // 支持拖拽本地实物扫描 .glb / .gltf 文件直接投放到 3D 展台研鉴
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        canvas.style.outline = '2px dashed #5A9CA8';
        canvas.style.outlineOffset = '-6px';
    });
    canvas.addEventListener('dragleave', (e) => {
        e.preventDefault();
        canvas.style.outline = 'none';
    });
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        canvas.style.outline = 'none';
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf'))) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                parseAndDisplayGlb(ev.target.result, file.name);
            };
            reader.readAsArrayBuffer(file);
        }
    });
}

/**
 * 解析并载入外部 .glb / .gltf 瓷器扫描模型文件 (ArrayBuffer)
 */
function parseAndDisplayGlb(arrayBuffer, modelName = '实物扫描模型') {
    if (typeof THREE.GLTFLoader === 'undefined') {
        alert('GLTFLoader 正在初始化，请稍候');
        return;
    }
    const loader = new THREE.GLTFLoader();
    loader.parse(arrayBuffer, '', (gltf) => {
        const model = gltf.scene || gltf.scenes[0];
        if (!model) return;

        // 计算真实包围盒，自适应居中并缩放至标准展台尺寸
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.0 / (maxDim || 1);
        model.scale.set(targetScale, targetScale, targetScale);

        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x * targetScale;
        model.position.y = -center.y * targetScale + 0.1;
        model.position.z = -center.z * targetScale;

        // 为扫描模型中的所有网格启用阴影与展厅物理环境光照
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.envMapIntensity = 1.35;
                }
            }
        });

        if (currentGroup) {
            disposeGroup(currentGroup);
            scene.remove(currentGroup);
        }

        currentGroup = new THREE.Group();
        currentGroup.add(model);
        scene.add(currentGroup);

        // 重置视角与光照
        camera.position.set(0, 1.2, 3.8);
        camera.lookAt(0, 0, 0);

        // 更新 UI 说明卡片
        const titleEl = document.getElementById('model-detail-title');
        const descEl = document.getElementById('model-detail-desc');
        if (titleEl) titleEl.textContent = `实物真迹扫描 · ${modelName}`;
        if (descEl) descEl.textContent = '此模型为外置高精度实物三维激光扫描/摄影测量重建物体，已接入展厅 PBR 环境光照渲染与物理阴影系统。';
        if (typeof showToast === 'function') {
            showToast(`已成功载入实物扫描 3D 模型：${modelName}`);
        }
    }, (err) => {
        console.error('[GLTF Loader] 模型解析失败:', err);
        alert('所选 3D 文件解析异常，请确保为标准的 .glb 或 .gltf 文件。');
    });
}

function handleGlbFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            parseAndDisplayGlb(ev.target.result, file.name);
        };
        reader.readAsArrayBuffer(file);
    }
}

if (typeof window !== 'undefined') {
    window.parseAndDisplayGlb = parseAndDisplayGlb;
    window.handleGlbFileSelect = handleGlbFileSelect;
}

/**
 * 重置视角
 */
function resetCamera() {
    camera.position.set(0, 1.2, 3.8);
    camera.lookAt(0, 0, 0);
    if (currentGroup) currentGroup.rotation.set(0, 0, 0);
    autoRotate = true;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.add('active');
}

/**
 * 递归释放几何体与材质内存，彻底防止 WebGL 显存泄漏
 */
function disposeGroup(grp) {
    if (!grp) return;
    grp.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });
}

/**
 * 动画渲染循环 (智能视口节能：脱离视口自动暂停，入屏平滑恢复)
 */
let isCanvasVisible = true;

function setupVisibilityObserver(canvas) {
    if (!canvas || !('IntersectionObserver' in window)) {
        isCanvasVisible = true;
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        const wasVisible = isCanvasVisible;
        isCanvasVisible = entries[0].isIntersecting;
        if (!wasVisible && isCanvasVisible) {
            requestAnimationFrame(animate);
        }
    }, { threshold: 0.05 });
    observer.observe(canvas);
}

function animate() {
    if (!isCanvasVisible) return;
    requestAnimationFrame(animate);
    if (currentGroup && autoRotate) {
        currentGroup.rotation.y += 0.006;
    }
    renderer.render(scene, camera);
}

/**
 * 视口调整
 */
function handleThreeResize() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer || !camera) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    const isMobile = window.innerWidth < 640;
    camera.fov = isMobile ? 48 : 42;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

/**
 * 更新右侧/下方器物研鉴详情卡片
 */
function updateModelInfoCard(index) {
    const infoEl = document.getElementById('3d-model-info');
    if (!infoEl) return;
    const m = porcelainModelsData[index];
    if (!m) return;

    infoEl.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start justify-between">
                <div>
                    <span class="badge ${m.isScanned ? 'bg-amber-800 text-amber-100' : 'bg-tianqing-deep text-white'} text-xs mb-2 inline-block">
                        ${m.isScanned ? '★ 真实文物三维扫描数字孪生' : m.period}
                    </span>
                    <h3 class="text-xl font-serif-cn text-text-title font-medium flex items-center gap-2">
                        <span>${m.name}</span>
                        ${m.isScanned ? '<span class="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-sans font-normal border border-amber-300">真迹点云</span>' : ''}
                    </h3>
                    <p class="text-xs text-text-muted mt-1 font-serif-cn">${m.english}</p>
                </div>
                <div class="text-right">
                    <span class="text-xs ${m.isScanned ? 'text-amber-900 bg-amber-100 border border-amber-300' : 'text-tianqing-deep bg-yuebai'} px-3 py-1 rounded-full font-medium">
                        ${m.kiln}
                    </span>
                </div>
            </div>
            
            <p class="text-sm text-text-body leading-relaxed font-light">${m.desc}</p>
            
            <div class="border-t border-border-light pt-3">
                <h4 class="text-xs text-text-title font-medium mb-2 tracking-wider flex items-center justify-between">
                    <span>${m.isScanned ? '【真迹采集测绘与物理特征】' : '【研鉴要领与器物特征】'}</span>
                    <button onclick="openMicroscopeView()" class="text-tianqing-deep hover:underline text-[11px] font-normal flex items-center gap-1">
                        <i class="fa-solid fa-microscope"></i>
                        <span>100x显微镜观察</span>
                    </button>
                </h4>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    ${m.features.map(f => `
                        <div class="flex items-center gap-1.5 text-text-body ${m.isScanned ? 'bg-amber-50/80 border border-amber-100' : 'bg-bg-main'} p-2 rounded-lg">
                            <i class="fa-solid ${m.isScanned ? 'fa-certificate text-amber-600' : 'fa-check text-tianqing'} text-[10px]"></i>
                            <span>${f}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * 按钮高亮管理 (区分实物扫描真品与御窑复原)
 */
function highlightActiveModelBtn(index) {
    document.querySelectorAll('.model-btn').forEach((btn, i) => {
        const isScan = i < 2;
        if (i === index) {
            if (isScan) {
                btn.className = 'model-btn px-3.5 py-1.5 text-xs rounded-full bg-amber-800 text-white font-serif-cn transition-all shrink-0 shadow-sm flex items-center gap-1.5 ring-2 ring-amber-500';
            } else {
                btn.className = 'model-btn px-3 py-1.5 text-xs rounded-full bg-tianqing-deep text-white font-serif-cn transition-all shrink-0 shadow-sm flex items-center gap-1';
            }
        } else {
            if (isScan) {
                btn.className = 'model-btn px-3.5 py-1.5 text-xs rounded-full bg-amber-100/90 text-amber-900 border border-amber-300 font-serif-cn transition-all shrink-0 flex items-center gap-1.5 hover:bg-amber-200';
            } else {
                btn.className = 'model-btn px-3 py-1.5 text-xs rounded-full bg-yuebai text-text-body font-serif-cn transition-all shrink-0 hover:bg-tianqing/20';
            }
        }
    });
}

function highlightActiveGlazeBtn(glazeKey) {
    document.querySelectorAll('.glaze-btn').forEach(btn => {
        if (btn.dataset.glaze === glazeKey) {
            btn.classList.add('ring-2', 'ring-tianqing-deep', 'scale-105');
        } else {
            btn.classList.remove('ring-2', 'ring-tianqing-deep', 'scale-105');
        }
    });
}

// 挂载至全局，便于 HTML 事件调用
window.initThreeJS = initThreeJS;
window.loadPorcelainModel = loadPorcelainModel;
window.switchGlaze = switchGlaze;
window.toggleCrackle = toggleCrackle;
window.toggleWireframe = toggleWireframe;
window.toggleDimensionLines = toggleDimensionLines;
window.toggleAutoRotate = toggleAutoRotate;
window.setCameraView = setCameraView;
window.resetCamera = resetCamera;
window.openMicroscopeView = openMicroscopeView;
window.closeMicroscopeView = closeMicroscopeView;

