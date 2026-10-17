/**
 * 华夏器道 · 仝瓷记忆 — 旗舰级 3D 数字文博展馆与 PBR 物理研鉴引擎 (Three.js WebGL Flagship Engine)
 * 核心特性：
 * 1. 实时程序化 HDR 博物馆环境反射贴图 (PMREMGenerator + 宋代轩窗天光/柔光箱)
 * 2. 双层玻璃相清漆 PBR 材质 + Voronoi 金丝铁线凹凸法线贴图 + 钧窑窑变/建盏曜变/宣德青花五段纹饰
 * 3. 128段样条插值高精建模 + 四瓣海棠/八方棱角几何调制
 * 4. 四大展览模式：【单器360°精鉴台】、【3D全景博物馆大展厅漫游】、【X光胎骨剖面透视】、【策展人自动巡礼】
 * 5. 3D空间解剖锚点实时屏幕投影、Raycaster 点击展柜漫游、体积聚光灯束与悬浮流金粒子系统
 */

let scene, camera, renderer, currentGroup;
let pedestalGroup, hallGroup, particleSystem, spotConeMesh, dimensionGroup;
let lightMain, lightFill, lightRim, ambientLight, topSpotLight;
let envMapTexture = null;
let clipPlane = null;

// 真实 3D 空间与物理环境场景
let realisticRoomGroup = null;
let currentRoomEnv = 'studio'; // 'studio' (宋代雨后雅室) | 'palace' (国家文博展殿) | 'kiln' (御窑秘境)
let showRealisticScene = true;
let incenseSmokeSystem = null;
let volumetricGodRays = null;
let roomFloorMesh = null;
let roomScreenMesh = null;
let roomWallMesh = null;
let roomWindowMesh = null;
let roomTableMesh = null;
let contactShadowMesh = null;

// 交互与展览状态
let autoRotate = true;
let isWireframe = false;
let showCrackle = true;
let showDimensions = false;
let showHotspots = true;
let exhibitionMode = 'inspector'; // 'inspector' | 'hall' | 'cutaway'
let curatorialTourActive = false;
let tourTimer = null;
let currentModelIndex = 0;
let currentGlazeIndex = 'tianqing';

// 相机平滑插值目标 (用于展厅漫游与特写运镜)
let camPosTarget = { x: 0, y: 1.05, z: 3.65 };
let camLookTarget = { x: 0, y: 0.0, z: 0 };
let camLookCurrent = { x: 0, y: 0.0, z: 0 };
let userOrbitAngles = { theta: 0, phi: 0.28, radius: 3.65 };
let isUserDragging = false;

// 经典古瓷器物数据字典与 3D 空间解剖锚点
const porcelainModelsData = [
    {
        name: '宋官窑·八方贯耳弦纹瓶',
        english: 'Song Imperial Guan Octagonal Vase with Tubular Handles',
        period: '南宋 (1127–1279)',
        kiln: '杭州修内司官窑 / 郊坛下官窑',
        dimensions: '通高 22.8 cm · 口径 5.4 cm · 足径 7.2 cm',
        desc: '仿商周青铜礼器造型，瓶身八方起棱，口颈两侧各设一垂直中空贯耳，腹部饰凸起弦纹。胎骨含铁高达5%，呈现典型“紫口铁足”，釉厚如堆脂，蟹爪纹与金丝铁线纵横交织，尽显南宋宫廷崇尚的穆重典雅。',
        features: ['八方折棱折光', '双贯耳穿带结构', '三道凸起弦纹', '紫口铁足露胎'],
        defaultGlaze: 'tianqing',
        hotspots: [
            { label: '紫口 · 口沿釉薄透紫褐胎', pos: [0.32, 0.96, 0.1], view: 'top' },
            { label: '双贯耳 · 仿古青铜穿系礼制', pos: [-0.36, 0.65, 0.08], view: 'front' },
            { label: '蟹爪冰裂 · 厚釉多层热应力纹', pos: [0.58, -0.25, 0.25], view: 'front' },
            { label: '铁足 · 凤凰山紫金土露胎圈足', pos: [0.28, -1.12, 0.15], view: 'bottom' }
        ]
    },
    {
        name: '宋汝窑·天青椭圆四足水仙盆',
        english: 'Northern Song Ru Kiln Sky-Blue Oval Narcissus Basin',
        period: '北宋晚期 (徽宗宣和年间)',
        kiln: '河南宝丰清凉寺汝官窑',
        dimensions: '高 6.7 cm · 口横 23.1 cm · 口纵 16.4 cm',
        desc: '传世孤品级形制。盆体呈温雅椭圆形，广口卷唇，浅腹平底，下承四只雕琢精妙的如意云头矮足。玛瑙末入釉，通体满施雨过天青色釉，温润如羊脂美玉，底部留有细小如针的芝麻支钉痕。',
        features: ['雨过天青玛瑙釉', '四如意云头短足', '椭圆卷唇广口', '五枚芝麻支钉痕'],
        defaultGlaze: 'tianqing',
        hotspots: [
            { label: '卷唇敞口 · 温润凝脂玉质感', pos: [0.95, 0.18, 0.2], view: 'top' },
            { label: '如意云头足 · 四足稳承平底', pos: [0.68, -0.32, 0.42], view: 'bottom' },
            { label: '芝麻支钉 · 满釉裹足支烧绝技', pos: [0.0, -0.28, 0.0], view: 'bottom' }
        ]
    },
    {
        name: '宋定窑·白釉划花莲纹梅瓶',
        english: 'Northern Song Ding Kiln Carved Lotus White Meiping',
        period: '北宋 (960–1127)',
        kiln: '河北曲阳涧磁村定窑',
        dimensions: '通高 31.5 cm · 口径 4.2 cm · 足径 9.8 cm',
        desc: '小口翻唇，短颈丰肩，修腹渐收至胫部微扬，线条挺拔俊秀。胎骨洁白坚致，击之声如清磬；釉呈温润象牙白，口沿施鎏金铜扣（芒口镶扣），腹部以竹刀深刻流利缠枝莲纹，积釉处隐现“蜡泪痕”。',
        features: ['芒口镶鎏金铜扣', '象牙白温润暖釉', '竹刀深刻缠枝莲', '丰肩修腹仕女姿'],
        defaultGlaze: 'dingbai',
        hotspots: [
            { label: '芒口金扣 · 覆烧工艺皇家镶金口', pos: [0.24, 0.98, 0.1], view: 'top' },
            { label: '丰肩刻花 · 半刀泥深刻莲瓣浮雕', pos: [0.64, 0.38, 0.22], view: 'front' },
            { label: '牙白泪痕 · 天然石灰釉垂流聚痕', pos: [-0.46, -0.32, 0.25], view: 'front' }
        ]
    },
    {
        name: '宋哥窑·金丝铁线胆式瓶',
        english: 'Song Ge Kiln Pear-Shaped Bottle with Gold-and-Iron Crackles',
        period: '宋代 (960–1279)',
        kiln: '传世哥窑',
        dimensions: '通高 20.3 cm · 口径 3.8 cm · 足径 6.5 cm',
        desc: '直口修颈，腹部下垂饱满如悬胆，重心沉稳。釉层肥厚失透如凝脂酥油，通身布满天然开裂的“金丝铁线”——主干粗裂纹呈深铁黑色，次生细密网纹呈金黄色，百极碎纹极富文人苍古画意。',
        features: ['悬胆垂腹优美弧线', '大开片深黑如铁', '细网纹金黄如丝', '酥油光泽温润内敛'],
        defaultGlaze: 'fenqing',
        hotspots: [
            { label: '直口修颈 · 紫口微露铁胎骨', pos: [0.22, 1.02, 0.08], view: 'top' },
            { label: '金丝铁线 · 双重染色应力裂网', pos: [0.68, -0.38, 0.2], view: 'front' },
            { label: '铁足圈足 · 垫饼托烧规整修刀', pos: [0.32, -1.08, 0.12], view: 'bottom' }
        ]
    },
    {
        name: '宋钧窑·玫瑰紫海棠出戟尊',
        english: 'Northern Song Jun Kiln Rose-Purple Four-Flanged Zun',
        period: '北宋晚期至金代',
        kiln: '河南禹州钧台官窑',
        dimensions: '通高 24.5 cm · 口径 18.2 cm · 足径 12.0 cm',
        desc: '北宋皇家陈设重器。器身呈四瓣海棠花形，喇叭敞口，颈、腹、足四面各附镂空齿状出戟。釉料含微量氧化铜，经1300℃还原焰窑变，“入窑一色，出窑万彩”，玫瑰紫与海棠红交融绚烂如晚霞。',
        features: ['四瓣海棠花造型', '四方齿状出戟', '铜还原玫瑰紫窑变', '蚯蚓走泥纹肌理'],
        defaultGlaze: 'junhong',
        hotspots: [
            { label: '海棠折沿 · 四瓣花式喇叭大敞口', pos: [0.72, 0.92, 0.2], view: 'top' },
            { label: '齿状出戟 · 追摹商周青铜礼器威仪', pos: [0.68, -0.1, 0.0], view: 'front' },
            { label: '玫瑰紫霞 · 氧化铜高温胶体粒子窑变', pos: [-0.52, -0.22, 0.38], view: 'front' }
        ]
    },
    {
        name: '宋建窑·兔毫曜变天目斗茶盏',
        english: 'Song Jian Kiln Hare\'s Fur & Yohen Tenmoku Tea Bowl',
        period: '宋代 (960–1279)',
        kiln: '福建建阳水吉建窑',
        dimensions: '高 7.2 cm · 口径 12.5 cm · 足径 4.0 cm',
        desc: '两宋点茶、斗茶之圣器。口沿设束口注汤槽，深腹斜收，下腹垂积釉泪，浅圈足露粗犷黑铁胎。高铁黑釉在窑火中析出金银兔毫结晶与曜变星斑，最宜衬托击拂如雪的白色茶汤。',
        features: ['束口防溢注汤槽', '曜变星斑与银兔毫', '下腹垂珠积釉泪', '含铁8%重铁胎底'],
        defaultGlaze: 'jianhei',
        hotspots: [
            { label: '束口暗槽 · 斗茶注汤咬盏定胜负', pos: [0.85, 0.35, 0.15], view: 'top' },
            { label: '曜变兔毫 · 铁氧化物微晶干涉光晕', pos: [0.15, -0.15, 0.35], view: 'top' },
            { label: '铁胎浅足 · 建阳水吉高铁红土胎骨', pos: [0.28, -0.72, 0.1], view: 'bottom' }
        ]
    },
    {
        name: '明宣德·青花缠枝莲纹玉壶春瓶',
        english: 'Ming Xuande Blue-and-White Lotus Yuhuchun Vase',
        period: '明宣德 (1426–1435)',
        kiln: '江西景德镇御器厂',
        dimensions: '通高 28.5 cm · 口径 8.2 cm · 足径 10.4 cm',
        desc: '撇口细颈，垂腹丰满如水滴，圈足外撇，通体曲线呈柔美S型。釉面肥厚泛鸭蛋青，以进口“苏麻离青”钴料分层绘蕉叶纹、如意云头及缠枝宝相莲纹，浓重处凝聚黑褐色铁锈结晶斑，深沉雄健。',
        features: ['曼妙S型水滴曲线', '进口苏麻离青浓艳', '深入胎骨铁锈结晶斑', '五段式皇家官样纹饰'],
        defaultGlaze: 'qinghua',
        hotspots: [
            { label: '撇口蕉叶纹 · 颈部挺拔饰青花蕉叶', pos: [0.35, 0.85, 0.15], view: 'front' },
            { label: '苏麻离青 · 高铁低锰进口钴料铁锈斑', pos: [0.68, -0.32, 0.25], view: 'front' },
            { label: '仰莲圈足 · 景德镇麻仓土二元配方白胎', pos: [0.38, -1.08, 0.12], view: 'bottom' }
        ]
    }
];

// 经典东方古陶瓷釉色 PBR 参数字典
const glazePalettes = {
    tianqing: {
        name: '雨过天青',
        desc: '汝官窑典型色，玛瑙入釉，温润如羊脂美玉',
        color: 0x94b9c0,
        emissive: 0x061518,
        roughness: 0.14,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        ior: 1.54,
        reflectivity: 0.72
    },
    fenqing: {
        name: '粉青如玉',
        desc: '南宋龙泉与修内司官窑代表，青翠柔和，丰润如脂',
        color: 0x82b29c,
        emissive: 0x05140d,
        roughness: 0.17,
        metalness: 0.03,
        clearcoat: 0.96,
        clearcoatRoughness: 0.08,
        ior: 1.53,
        reflectivity: 0.68
    },
    yuebai: {
        name: '月白莹霜',
        desc: '月白微泛冷青，如皓月寒霜，冰清玉洁',
        color: 0xd8e5e8,
        emissive: 0x0f1518,
        roughness: 0.12,
        metalness: 0.02,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        ior: 1.55,
        reflectivity: 0.75
    },
    dingbai: {
        name: '定窑牙白',
        desc: '北宋曲阳定窑象牙白，泛暖玉微黄之光，内敛温雅',
        color: 0xf4eee1,
        emissive: 0x16130d,
        roughness: 0.20,
        metalness: 0.02,
        clearcoat: 0.88,
        clearcoatRoughness: 0.11,
        ior: 1.50,
        reflectivity: 0.58
    },
    junhong: {
        name: '玫瑰紫变',
        desc: '禹州钧官窑铜还原窑变，红紫蓝交融如晚霞流云',
        color: 0xb85a88,
        emissive: 0x1c0614,
        roughness: 0.16,
        metalness: 0.08,
        clearcoat: 0.98,
        clearcoatRoughness: 0.07,
        ior: 1.58,
        reflectivity: 0.74
    },
    jianhei: {
        name: '建盏乌金',
        desc: '建阳水吉窑高铁黑釉，析出金银兔毫与曜变星斑',
        color: 0x2c2829,
        emissive: 0x060508,
        roughness: 0.24,
        metalness: 0.38,
        clearcoat: 0.92,
        clearcoatRoughness: 0.12,
        ior: 1.65,
        reflectivity: 0.82
    },
    qinghua: {
        name: '幽菁青花',
        desc: '明宣德鸭蛋青白釉底，苏麻离青浓艳深沉带铁锈斑',
        color: 0xf2f6f8,
        emissive: 0x0a1016,
        roughness: 0.12,
        metalness: 0.03,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        ior: 1.54,
        reflectivity: 0.72
    }
};

// 纹理贴图缓存
const textureCache = {};

/**
 * 0.1 宋代青石板地面贴图 (具有青灰质感、凹凸砖缝与自然石材斑驳包浆)
 */
function getRealisticStoneFloorTexture() {
    if (textureCache.stoneFloor) return textureCache.stoneFloor;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 宋代文博青石地砖底色（冷青灰基调）
        ctx.fillStyle = '#263238';
        ctx.fillRect(0, 0, 512, 512);

        // 绘制交错排列的青石大方砖 (4行 x 2列交替)
        const rows = 4;
        const cols = 2;
        const rh = 512 / rows;
        const cw = 512 / cols;

        for (let r = 0; r < rows; r++) {
            const offset = (r % 2) * (cw / 2);
            for (let c = -1; c <= cols; c++) {
                const x = c * cw + offset;
                const y = r * rh;

                // 每块青石板有细微色泽变化
                const toneShift = (Math.sin(r * 3.7 + c * 2.1) * 8);
                const rVal = Math.max(20, Math.floor(38 + toneShift));
                const gVal = Math.max(30, Math.floor(48 + toneShift));
                const bVal = Math.max(35, Math.floor(54 + toneShift));
                ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
                ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

                // 石材质感颗粒与深浅包浆
                for (let i = 0; i < 45; i++) {
                    const px = x + 4 + Math.random() * (cw - 8);
                    const py = y + 4 + Math.random() * (rh - 8);
                    const pr = 1 + Math.random() * 3.5;
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.07)';
                    ctx.beginPath();
                    ctx.arc(px, py, pr, 0, Math.PI * 2);
                    ctx.fill();
                }

                // 砖缝凹槽阴影
                ctx.strokeStyle = '#12181b';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(x + 1, y + 1, cw - 2, rh - 2);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        textureCache.stoneFloor = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.2 故宫墨黑金砖地面贴图 (深沉如墨玉，平滑桐油高反光)
 */
function getRealisticGoldBrickTexture() {
    if (textureCache.goldBrick) return textureCache.goldBrick;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#101418';
        ctx.fillRect(0, 0, 512, 512);

        const size = 256;
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                const x = c * size;
                const y = r * size;
                ctx.fillStyle = (r + c) % 2 === 0 ? '#151b22' : '#0e1216';
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

                const grad = ctx.createLinearGradient(x, y, x + size, y + size);
                grad.addColorStop(0, 'rgba(212, 175, 106, 0.06)');
                grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
                ctx.fillStyle = grad;
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

                ctx.strokeStyle = '#322818';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(3, 3);
        textureCache.goldBrick = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.3 御窑粗粝耐火青砖地面贴图 (带窑火高温烟熏红褐色泽)
 */
function getRealisticKilnBrickTexture() {
    if (textureCache.kilnBrick) return textureCache.kilnBrick;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#2d1f1c';
        ctx.fillRect(0, 0, 512, 512);

        for (let r = 0; r < 6; r++) {
            const rh = 512 / 6;
            const offset = (r % 2) * 64;
            for (let c = -1; c < 5; c++) {
                const cw = 128;
                const x = c * cw + offset;
                const y = r * rh;
                ctx.fillStyle = (c + r) % 3 === 0 ? '#422822' : '#321c18';
                ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

                for (let i = 0; i < 35; i++) {
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 120, 40, 0.07)' : 'rgba(0, 0, 0, 0.22)';
                    ctx.fillRect(x + Math.random() * cw, y + Math.random() * rh, 2 + Math.random() * 4, 2 + Math.random() * 3);
                }
                ctx.strokeStyle = '#180a07';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(x + 1, y + 1, cw - 2, rh - 2);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        textureCache.kilnBrick = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.4 宋代三折紫檀屏风绢本水墨山水画心 (米芾米氏云山/千里烟云/题款印章)
 */
function getScreenPaintingTexture() {
    if (textureCache.screenPainting) return textureCache.screenPainting;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // 绢本生绢氧化古香暖黄基底
        const silkGrad = ctx.createLinearGradient(0, 0, 0, 1024);
        silkGrad.addColorStop(0.0, '#dfd3bd');
        silkGrad.addColorStop(0.5, '#d4c5a9');
        silkGrad.addColorStop(1.0, '#c7b494');
        ctx.fillStyle = silkGrad;
        ctx.fillRect(0, 0, 1024, 1024);

        // 经纬暗纹
        ctx.strokeStyle = 'rgba(140, 120, 90, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 1024; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, 0); ctx.lineTo(i, 1024);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i); ctx.lineTo(1024, i);
            ctx.stroke();
        }

        // 上部文人题款与落款印章
        ctx.font = '24px "Kaiti", "STKaiti", "楷体", serif';
        ctx.fillStyle = 'rgba(40, 30, 20, 0.72)';
        ctx.fillText('山 色 空 蒙 雨 亦 奇', 700, 120);
        ctx.font = '16px "Kaiti", "STKaiti", "楷体", serif';
        ctx.fillStyle = 'rgba(60, 45, 30, 0.55)';
        ctx.fillText('宋 · 米友仁法意 墨戏仿古', 726, 160);

        // 朱红印章两方
        ctx.fillStyle = '#a62b21';
        ctx.fillRect(702, 138, 20, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px serif';
        ctx.fillText('器', 706, 153);

        ctx.fillStyle = '#a62b21';
        ctx.fillRect(702, 190, 20, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('道', 706, 208);

        // 远山水墨峰峦
        const drawMountain = (baseY, amp, seed, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, 1024);
            ctx.lineTo(0, baseY);
            for (let x = 0; x <= 1024; x += 16) {
                const y = baseY - Math.sin((x + seed) * 0.005) * amp - Math.cos((x * 2 + seed) * 0.008) * (amp * 0.4);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(1024, baseY);
            ctx.lineTo(1024, 1024);
            ctx.closePath();
            ctx.fill();
        };

        drawMountain(380, 120, 120, 'rgba(110, 100, 85, 0.18)');
        drawMountain(460, 160, 340, 'rgba(85, 78, 65, 0.28)');
        drawMountain(580, 190, 780, 'rgba(65, 58, 48, 0.42)');

        // 中景云雾氤氲横贯江渚 (白色半透柔雾带)
        const fogGrad = ctx.createLinearGradient(0, 500, 0, 720);
        fogGrad.addColorStop(0.0, 'rgba(215, 205, 185, 0.0)');
        fogGrad.addColorStop(0.4, 'rgba(225, 218, 200, 0.78)');
        fogGrad.addColorStop(0.7, 'rgba(220, 212, 192, 0.72)');
        fogGrad.addColorStop(1.0, 'rgba(210, 200, 180, 0.0)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 500, 1024, 220);

        // 近景怪石坡陀
        ctx.fillStyle = 'rgba(45, 38, 30, 0.68)';
        ctx.beginPath();
        ctx.moveTo(0, 1024);
        ctx.lineTo(0, 780);
        ctx.bezierCurveTo(240, 750, 420, 820, 680, 760);
        ctx.bezierCurveTo(860, 720, 960, 790, 1024, 750);
        ctx.lineTo(1024, 1024);
        ctx.closePath();
        ctx.fill();

        // 米点皴 (Mi-dots)
        ctx.fillStyle = 'rgba(32, 26, 20, 0.75)';
        for (let i = 0; i < 400; i++) {
            const mx = Math.random() * 1024;
            const my = 680 + Math.random() * 320;
            ctx.beginPath();
            ctx.ellipse(mx, my, 8 + Math.random() * 12, 2.5 + Math.random() * 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 左侧苍劲古松
        ctx.strokeStyle = 'rgba(28, 22, 16, 0.88)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(180, 980);
        ctx.quadraticCurveTo(170, 820, 240, 680);
        ctx.quadraticCurveTo(280, 580, 250, 480);
        ctx.stroke();

        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(240, 680);
        ctx.quadraticCurveTo(340, 640, 420, 660);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(250, 560);
        ctx.quadraticCurveTo(140, 520, 90, 550);
        ctx.stroke();

        // 松针墨团
        ctx.fillStyle = 'rgba(24, 30, 22, 0.85)';
        const pineClusters = [
            [420, 660], [360, 630], [250, 480], [220, 440], [280, 460], [90, 550], [140, 510]
        ];
        pineClusters.forEach(c => {
            for (let p = 0; p < 28; p++) {
                ctx.beginPath();
                ctx.arc(c[0] + (Math.random() - 0.5) * 50, c[1] + (Math.random() - 0.5) * 30, 3 + Math.random() * 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 双层外边框
        ctx.strokeStyle = 'rgba(60, 45, 30, 0.45)';
        ctx.lineWidth = 4;
        ctx.strokeRect(28, 28, 968, 968);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(36, 36, 952, 952);

        const tex = new THREE.CanvasTexture(canvas);
        textureCache.screenPainting = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.5 明清老红木/大叶紫檀木纹贴图 (细腻牛毛纹与包浆微光)
 */
function getRosewoodTexture() {
    if (textureCache.rosewood) return textureCache.rosewood;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#2b130e';
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 512; i += 2) {
            const alpha = 0.08 + Math.random() * 0.15;
            ctx.strokeStyle = Math.random() > 0.4 ? `rgba(18, 7, 5, ${alpha})` : `rgba(68, 28, 18, ${alpha})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.bezierCurveTo(
                i + (Math.random() - 0.5) * 12, 170,
                i + (Math.random() - 0.5) * 18, 340,
                i + (Math.random() - 0.5) * 12, 512
            );
            ctx.stroke();
        }

        const grad = ctx.createLinearGradient(0, 0, 512, 512);
        grad.addColorStop(0, 'rgba(168, 78, 42, 0.12)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
        grad.addColorStop(1, 'rgba(128, 52, 28, 0.1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        textureCache.rosewood = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.6 几案织锦席垫贴图 (宫廷深蓝织金宝相花暗纹)
 */
function getBrocadeMatTexture() {
    if (textureCache.brocadeMat) return textureCache.brocadeMat;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#172733';
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = '#cba766';
        ctx.lineWidth = 8;
        ctx.strokeRect(24, 24, 464, 464);
        ctx.lineWidth = 2.5;
        ctx.strokeRect(38, 38, 436, 436);

        const corners = [[48, 48], [464, 48], [48, 464], [464, 464]];
        ctx.fillStyle = '#cba766';
        corners.forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.save();
        ctx.translate(256, 256);
        ctx.strokeStyle = 'rgba(203, 167, 102, 0.42)';
        ctx.lineWidth = 2;
        for (let r = 0; r < 8; r++) {
            ctx.rotate((Math.PI * 2) / 8);
            ctx.beginPath();
            ctx.ellipse(65, 0, 48, 22, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(203, 167, 102, 0.35)';
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const tex = new THREE.CanvasTexture(canvas);
        textureCache.brocadeMat = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.7 器物足底真实接触软投影贴图 (Contact Soft Shadow)
 */
function getContactShadowTexture() {
    if (textureCache.contactShadow) return textureCache.contactShadow;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
        grad.addColorStop(0.0, 'rgba(6, 5, 4, 0.95)');
        grad.addColorStop(0.28, 'rgba(8, 6, 5, 0.72)');
        grad.addColorStop(0.65, 'rgba(8, 6, 5, 0.25)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        const tex = new THREE.CanvasTexture(canvas);
        textureCache.contactShadow = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.8 宋代直棂轩窗透光纹理 (含窗外修竹水墨淡影)
 */
function getWindowLatticeTexture() {
    if (textureCache.windowLattice) return textureCache.windowLattice;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const paperGrad = ctx.createLinearGradient(0, 0, 512, 512);
        paperGrad.addColorStop(0.0, '#fffdf5');
        paperGrad.addColorStop(0.6, '#f4ece0');
        paperGrad.addColorStop(1.0, '#e8ded0');
        ctx.fillStyle = paperGrad;
        ctx.fillRect(0, 0, 512, 512);

        // 窗外竹影
        ctx.fillStyle = 'rgba(78, 92, 80, 0.22)';
        for (let b = 0; b < 4; b++) {
            const bx = 85 + b * 115;
            ctx.fillRect(bx, 0, 12, 512);
            for (let j = 0; j < 5; j++) {
                ctx.fillRect(bx - 3, j * 105 + 40, 18, 4);
            }
            for (let l = 0; l < 8; l++) {
                const ly = l * 65 + 30;
                ctx.beginPath();
                ctx.ellipse(bx + 26, ly, 28, 6, 0.45, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(bx - 26, ly + 20, 28, 6, -0.45, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        textureCache.windowLattice = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.9 香炉缕缕青烟微粒贴图
 */
function getSmokeParticleTexture() {
    if (textureCache.smokeTex) return textureCache.smokeTex;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
        grad.addColorStop(0.0, 'rgba(235, 240, 245, 0.85)');
        grad.addColorStop(0.4, 'rgba(210, 225, 235, 0.35)');
        grad.addColorStop(1.0, 'rgba(200, 220, 230, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        textureCache.smokeTex = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 1. 程序化生成高动态范围 (HDR-like) 博物馆轩窗天光环境反射贴图
 */
function createStudioEnvironment(rendererInstance) {
    if (envMapTexture) return envMapTexture;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 深邃文博馆背景基底
        const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
        baseGrad.addColorStop(0.0, '#1e2c36');
        baseGrad.addColorStop(0.45, '#121a22');
        baseGrad.addColorStop(0.55, '#0b1015');
        baseGrad.addColorStop(1.0, '#182228');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, 512, 512);

        // 顶部大型环形博物馆柔光箱 (创造圆润高光)
        const topLight = ctx.createRadialGradient(512, 90, 10, 512, 90, 260);
        topLight.addColorStop(0, 'rgba(255, 252, 242, 0.95)');
        topLight.addColorStop(0.4, 'rgba(210, 235, 242, 0.45)');
        topLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topLight;
        ctx.fillRect(0, 0, 512, 350);

        // 左侧宋代轩窗暖白格栅天光条 (在瓷器腹部形成玉质竖向高光带)
        ctx.fillStyle = 'rgba(255, 248, 235, 0.85)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(160 + i * 28, 120, 18, 190);
        }

        // 右侧天青色漫射辅光窗
        const sideLight = ctx.createRadialGradient(820, 220, 15, 820, 220, 180);
        sideLight.addColorStop(0, 'rgba(168, 215, 225, 0.8)');
        sideLight.addColorStop(0.6, 'rgba(124, 170, 180, 0.25)');
        sideLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sideLight;
        ctx.fillRect(620, 40, 380, 360);

        // 鎏金环境地平线微反射
        const goldBand = ctx.createLinearGradient(0, 290, 0, 340);
        goldBand.addColorStop(0, 'rgba(197, 160, 89, 0)');
        goldBand.addColorStop(0.5, 'rgba(197, 160, 89, 0.28)');
        goldBand.addColorStop(1, 'rgba(197, 160, 89, 0)');
        ctx.fillStyle = goldBand;
        ctx.fillRect(0, 290, 512, 50);

        const equirectTex = new THREE.CanvasTexture(canvas);
        equirectTex.mapping = THREE.EquirectangularReflectionMapping;

        envMapTexture = equirectTex;
        return envMapTexture;
    } catch (e) {
        return null;
    }
}

/**
 * 2. 生成金丝铁线/冰裂纹双通道贴图 (Color Map + 立体微凹 Bump Map)
 */
function getCrackleTextureBundle() {
    if (textureCache.crackleBundle) return textureCache.crackleBundle;

    const cCanvas = document.createElement('canvas');
    const bCanvas = document.createElement('canvas');
    cCanvas.width = bCanvas.width = 512;
    cCanvas.height = bCanvas.height = 512;
    const cCtx = cCanvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');

    // 基底：纯白无偏色（让材质自身颜色主导），Bump基底为中性灰 180
    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = 'rgb(200, 200, 200)';
    bCtx.fillRect(0, 0, 512, 512);

    // 微表面橘皮棕眼与玉脂云絮噪点
    for (let i = 0; i < 900; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 4 + Math.random() * 18;
        cCtx.fillStyle = i % 2 === 0 ? 'rgba(235, 245, 246, 0.16)' : 'rgba(215, 230, 232, 0.12)';
        cCtx.beginPath();
        cCtx.arc(x, y, r, 0, Math.PI * 2);
        cCtx.fill();

        bCtx.fillStyle = i % 2 === 0 ? 'rgba(220, 220, 220, 0.2)' : 'rgba(175, 175, 175, 0.2)';
        bCtx.beginPath();
        bCtx.arc(x, y, r * 0.8, 0, Math.PI * 2);
        bCtx.fill();
    }

    // 伪随机固定种子生成自然 Voronoi/Delaunay 铁线与金丝裂网
    const nodes = [];
    const gridN = 8;
    const cellW = 512 / gridN;
    for (let gx = 0; gx < gridN; gx++) {
        for (let gy = 0; gy < gridN; gy++) {
            nodes.push({
                x: (gx + 0.18 + Math.random() * 0.64) * cellW,
                y: (gy + 0.18 + Math.random() * 0.64) * cellW
            });
        }
    }

    // 主干铁线 (深黑铁色主裂隙 + 深度微凹槽)
    cCtx.lineCap = bCtx.lineCap = 'round';
    cCtx.lineJoin = bCtx.lineJoin = 'round';

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (d < 165) {
                const mx = (nodes[i].x + nodes[j].x) * 0.5 + (Math.random() - 0.5) * 18;
                const my = (nodes[i].y + nodes[j].y) * 0.5 + (Math.random() - 0.5) * 18;

                // Color Map 铁线晕散
                cCtx.strokeStyle = 'rgba(42, 34, 28, 0.52)';
                cCtx.lineWidth = 1.6;
                cCtx.beginPath();
                cCtx.moveTo(nodes[i].x, nodes[i].y);
                cCtx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
                cCtx.stroke();

                // Bump Map 裂纹凹槽
                bCtx.strokeStyle = 'rgb(60, 60, 60)';
                bCtx.lineWidth = 2.4;
                bCtx.beginPath();
                bCtx.moveTo(nodes[i].x, nodes[i].y);
                bCtx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
                bCtx.stroke();

                // 次级金丝分支 (金黄/浅褐细丝)
                if (Math.random() > 0.35) {
                    const bx = mx + (Math.random() - 0.5) * 65;
                    const by = my + (Math.random() - 0.5) * 65;
                    cCtx.strokeStyle = 'rgba(182, 132, 62, 0.45)';
                    cCtx.lineWidth = 0.9;
                    cCtx.beginPath();
                    cCtx.moveTo(mx, my);
                    cCtx.lineTo(bx, by);
                    cCtx.stroke();

                    bCtx.strokeStyle = 'rgb(110, 110, 110)';
                    bCtx.lineWidth = 1.2;
                    bCtx.beginPath();
                    bCtx.moveTo(mx, my);
                    bCtx.lineTo(bx, by);
                    bCtx.stroke();
                }
            }
        }
    }

    const map = new THREE.CanvasTexture(cCanvas);
    const bumpMap = new THREE.CanvasTexture(bCanvas);
    map.wrapS = map.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);
    bumpMap.repeat.set(2, 2);

    textureCache.crackleBundle = { map, bumpMap };
    return textureCache.crackleBundle;
}

/**
 * 3. 定窑白瓷划花莲瓣浮雕凹凸贴图
 */
function getDingCarvedBundle() {
    if (textureCache.dingBundle) return textureCache.dingBundle;
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 512;
    bCanvas.height = 512;
    const ctx = bCanvas.getContext('2d');

    ctx.fillStyle = 'rgb(180, 180, 180)';
    ctx.fillRect(0, 0, 512, 512);

    // 绘制连绵划花仰覆莲瓣纹与缠枝卷草 (半刀泥刀法：一侧深一侧浅)
    ctx.strokeStyle = 'rgb(250, 250, 250)';
    ctx.lineWidth = 3.5;
    for (let row = 0; row < 3; row++) {
        const baseY = 260 + row * 250;
        for (let i = 0; i < 12; i++) {
            const cx = (i / 12) * 512 + 42;
            ctx.beginPath();
            ctx.moveTo(cx - 34, baseY + 60);
            ctx.quadraticCurveTo(cx - 38, baseY - 40, cx, baseY - 75);
            ctx.quadraticCurveTo(cx + 38, baseY - 40, cx + 34, baseY + 60);
            ctx.stroke();

            // 莲瓣内叶脉
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(cx, baseY + 55);
            ctx.lineTo(cx, baseY - 55);
            ctx.stroke();
            ctx.lineWidth = 3.5;
        }
    }

    const bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    textureCache.dingBundle = { bumpMap };
    return textureCache.dingBundle;
}

/**
 * 4. 禹州钧窑玫瑰紫海棠红窑变流体贴图 (含蚯蚓走泥纹)
 */
function getJunYaobianTexture() {
    if (textureCache.junTex) return textureCache.junTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 玫瑰紫与天蓝交融渐变底
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#4a2040');
    grad.addColorStop(0.28, '#8c2d5c');
    grad.addColorStop(0.55, '#5a3b7c');
    grad.addColorStop(0.80, '#6a9ab8');
    grad.addColorStop(1.0, '#3a1a32');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 窑变紫红霞斑与天青流云
    for (let i = 0; i < 85; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 40 + Math.random() * 140;
        const g = ctx.createRadialGradient(x, y, 5, x, y, r);
        if (i % 3 === 0) {
            g.addColorStop(0, 'rgba(195, 48, 102, 0.55)');
            g.addColorStop(1, 'rgba(195, 48, 102, 0)');
        } else if (i % 3 === 1) {
            g.addColorStop(0, 'rgba(130, 195, 225, 0.45)');
            g.addColorStop(1, 'rgba(130, 195, 225, 0)');
        } else {
            g.addColorStop(0, 'rgba(95, 35, 120, 0.5)');
            g.addColorStop(1, 'rgba(95, 35, 120, 0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 蚯蚓走泥纹
    ctx.strokeStyle = 'rgba(220, 175, 210, 0.38)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (let k = 0; k < 45; k++) {
        let x = Math.random() * 512;
        let y = Math.random() * 900;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 6; s++) {
            x += (Math.random() - 0.5) * 35;
            y += 18 + Math.random() * 22;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.junTex = tex;
    return tex;
}

/**
 * 5. 建窑乌金兔毫与曜变天目星空贴图
 */
function getJianYaobianTexture() {
    if (textureCache.jianTex) return textureCache.jianTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#141112';
    ctx.fillRect(0, 0, 512, 512);

    // 曜变蓝色/紫金干涉星云光晕
    for (let i = 0; i < 42; i++) {
        const x = Math.random() * 512;
        const y = 180 + Math.random() * 680;
        const r = 18 + Math.random() * 48;
        const g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, 'rgba(220, 195, 120, 0.85)');
        g.addColorStop(0.35, 'rgba(65, 145, 225, 0.55)');
        g.addColorStop(0.7, 'rgba(110, 60, 175, 0.32)');
        g.addColorStop(1, 'rgba(20, 17, 18, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 金银兔毫结晶条纹
    for (let i = 0; i < 520; i++) {
        const x = Math.random() * 512;
        const y = 60 + Math.random() * 750;
        const h = 55 + Math.random() * 210;
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(205, 160, 88, 0.78)');
        g.addColorStop(0.5, 'rgba(130, 175, 210, 0.65)');
        g.addColorStop(1, 'rgba(20, 17, 18, 0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.7 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 6, y + h);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.jianTex = tex;
    return tex;
}

/**
 * 6. 明宣德苏麻离青五段式皇家青花缠枝莲纹贴图
 */
function getQinghuaTexture() {
    if (textureCache.qinghuaTex) return textureCache.qinghuaTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 宣德鸭蛋青白底釉
    ctx.fillStyle = '#edf3f5';
    ctx.fillRect(0, 0, 512, 512);

    const cobaltMain = 'rgba(24, 58, 122, 0.88)';
    const cobaltLight = 'rgba(56, 98, 168, 0.55)';
    const ironSpot = 'rgba(18, 22, 36, 0.85)';

    // 顶部与底部双弦青花线
    const drawBands = (yArr) => {
        ctx.strokeStyle = cobaltMain;
        ctx.lineWidth = 5;
        yArr.forEach(y => {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        });
    };
    drawBands([75, 92, 240, 255, 760, 776, 930, 945]);

    // 第一段：颈部挺拔蕉叶纹 (y: 95 ~ 238)
    for (let i = 0; i < 16; i++) {
        const cx = (i + 0.5) * (512 / 16);
        ctx.strokeStyle = cobaltMain;
        ctx.fillStyle = cobaltLight;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 22, 238);
        ctx.quadraticCurveTo(cx - 18, 130, cx, 100);
        ctx.quadraticCurveTo(cx + 18, 130, cx + 22, 238);
        ctx.fill();
        ctx.stroke();
    }

    // 第二段：主腹部缠枝宝相莲花纹与苏麻离青铁锈结晶斑 (y: 270 ~ 745)
    // 波浪缠枝主藤蔓
    ctx.strokeStyle = cobaltMain;
    ctx.lineWidth = 5;
    for (let row = 0; row < 2; row++) {
        const cy = 390 + row * 210;
        ctx.beginPath();
        for (let x = 0; x <= 512; x += 8) {
            const y = cy + Math.sin((x / 512) * Math.PI * 6 + row * Math.PI) * 58;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 宝相莲花花头
        for (let col = 0; col < 6; col++) {
            const fx = (col + 0.5) * (512 / 6);
            const fy = cy + Math.sin((fx / 512) * Math.PI * 6 + row * Math.PI) * 32;
            ctx.save();
            ctx.translate(fx, fy);

            for (let p = 0; p < 10; p++) {
                const ang = (p / 10) * Math.PI * 2;
                ctx.save();
                ctx.rotate(ang);
                ctx.fillStyle = cobaltLight;
                ctx.strokeStyle = cobaltMain;
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.ellipse(26, 0, 18, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            // 莲心与苏麻离青铁锈结晶斑
            ctx.fillStyle = cobaltMain;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = ironSpot;
            for (let s = 0; s < 4; s++) {
                ctx.beginPath();
                ctx.arc((Math.random() - 0.5) * 28, (Math.random() - 0.5) * 28, 3.5 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // 第三段：胫部仰莲瓣纹 (y: 780 ~ 925)
    for (let i = 0; i < 14; i++) {
        const cx = (i + 0.5) * (512 / 14);
        ctx.strokeStyle = cobaltMain;
        ctx.fillStyle = cobaltLight;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 28, 925);
        ctx.quadraticCurveTo(cx, 785, cx + 28, 925);
        ctx.fill();
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.qinghuaTex = tex;
    return tex;
}

/**
 * 生成当前器物与釉色对应的物理材质 (PBR + 双层清漆 + 动态剖切平面)
 */
function getPorcelainMaterial(glazeKey = currentGlazeIndex, isTieZu = false) {
    const activePlanes = (exhibitionMode === 'cutaway' && clipPlane) ? [clipPlane] : [];

    if (isTieZu) {
        return new THREE.MeshStandardMaterial({
            color: 0x32241b,
            roughness: 0.88,
            metalness: 0.12,
            wireframe: isWireframe,
            side: THREE.DoubleSide,
            clippingPlanes: activePlanes
        });
    }

    const cfg = glazePalettes[glazeKey] || glazePalettes.tianqing;
    const matOptions = {
        color: cfg.color,
        emissive: cfg.emissive,
        roughness: cfg.roughness,
        metalness: cfg.metalness,
        clearcoat: cfg.clearcoat,
        clearcoatRoughness: cfg.clearcoatRoughness,
        ior: cfg.ior,
        reflectivity: cfg.reflectivity,
        envMap: envMapTexture,
        envMapIntensity: 1.35,
        wireframe: isWireframe,
        side: THREE.DoubleSide,
        clippingPlanes: activePlanes,
        clipShadows: true
    };

    if (glazeKey === 'qinghua') {
        matOptions.map = getQinghuaTexture();
    } else if (glazeKey === 'jianhei') {
        matOptions.map = getJianYaobianTexture();
    } else if (glazeKey === 'junhong') {
        matOptions.map = getJunYaobianTexture();
    } else if (glazeKey === 'dingbai') {
        const ding = getDingCarvedBundle();
        matOptions.bumpMap = ding.bumpMap;
        matOptions.bumpScale = 0.015;
    }

    if (showCrackle && !['qinghua', 'jianhei'].includes(glazeKey)) {
        const crackle = getCrackleTextureBundle();
        if (!matOptions.map) matOptions.map = crackle.map;
        matOptions.bumpMap = crackle.bumpMap;
        matOptions.bumpScale = 0.012;
    }

    return new THREE.MeshPhysicalMaterial(matOptions);
}

/**
 * 辅助函数：通过控制点生成高密度平滑样条双壁旋转几何体 (128段圆周细分 + 特殊器型径向调制)
 */
function createSmoothVesselLathe(outerPts, RadialModFn = null, radialSegments = 64) {
    // 构造闭合的双壁轮廓点（外壁从底到口 -> 唇口圆弧 -> 内壁从口到底心闭合），使X光剖面呈现真实胎壁厚度
    const fullPts = [...outerPts];
    const topPt = outerPts[outerPts.length - 1];
    const wallThickness = 0.036;

    // 从口沿向内壁反推至器底中心
    for (let i = outerPts.length - 2; i >= 1; i--) {
        const pt = outerPts[i];
        const innerR = Math.max(0.02, pt.x - wallThickness * (1 + (1 - i / outerPts.length) * 0.45));
        fullPts.push(new THREE.Vector2(innerR, pt.y + 0.02));
    }
    fullPts.push(new THREE.Vector2(0.0, outerPts[0].y + 0.05));

    const spline = new THREE.SplineCurve(fullPts);
    const sampledPoints = spline.getPoints(52);
    const geo = new THREE.LatheGeometry(sampledPoints, radialSegments);

    if (typeof RadialModFn === 'function') {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            const angle = Math.atan2(z, x);
            const r = Math.hypot(x, z);
            const factor = RadialModFn(angle, y, r);
            pos.setX(i, x * factor);
            pos.setZ(i, z * factor);
        }
        geo.computeVertexNormals();
    }

    return geo;
}

/**
 * 构建七大传世标准器高精度 3D 模型 (支持剖面透视与X光核线)
 */
function buildGeometry(typeIndex, customGlaze = null) {
    const group = new THREE.Group();
    const gKey = customGlaze || currentGlazeIndex;
    const glazeMat = getPorcelainMaterial(gKey, false);
    const tiezuMat = getPorcelainMaterial(gKey, true);
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af6a,
        roughness: 0.25,
        metalness: 0.88,
        clippingPlanes: (exhibitionMode === 'cutaway' && clipPlane) ? [clipPlane] : []
    });

    switch (typeIndex) {
        case 0: {
            // 0. 南宋官窑·八方贯耳弦纹瓶 (八方棱面调制 + 双贯耳 + 凸弦纹 + 紫口铁足)
            const pts = [
                new THREE.Vector2(0.0, -1.14),
                new THREE.Vector2(0.26, -1.15),
                new THREE.Vector2(0.32, -1.10),
                new THREE.Vector2(0.35, -0.90),
                new THREE.Vector2(0.54, -0.68),
                new THREE.Vector2(0.69, -0.35),
                new THREE.Vector2(0.63, -0.05),
                new THREE.Vector2(0.42, 0.26),
                new THREE.Vector2(0.31, 0.52),
                new THREE.Vector2(0.31, 0.84),
                new THREE.Vector2(0.35, 0.98),
                new THREE.Vector2(0.31, 1.01)
            ];
            const octMod = (ang) => 1.0 + 0.028 * Math.cos(8 * ang);
            const bodyGeo = createSmoothVesselLathe(pts, octMod, 64);
            const bodyMesh = new THREE.Mesh(bodyGeo, glazeMat);
            bodyMesh.castShadow = bodyMesh.receiveShadow = true;
            group.add(bodyMesh);

            // 双贯耳 (精致中空管耳 + 上下如意连接梁)
            for (let side of [-1, 1]) {
                const earGroup = new THREE.Group();
                const earGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.36, 32, 1, false);
                const earMesh = new THREE.Mesh(earGeo, glazeMat);
                earGroup.add(earMesh);

                const holeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.37, 24);
                const holeMesh = new THREE.Mesh(holeGeo, tiezuMat);
                earGroup.add(holeMesh);

                earGroup.position.set(side * 0.355, 0.66, 0);
                group.add(earGroup);
            }

            // 三道凸起弦纹
            const ringY = [-0.36, -0.08, 0.48];
            const ringR = [0.695, 0.638, 0.322];
            for (let r = 0; r < ringY.length; r++) {
                const ringGeo = new THREE.TorusGeometry(ringR[r], 0.016, 20, 64);
                const ringMesh = new THREE.Mesh(ringGeo, glazeMat);
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.position.y = ringY[r];
                group.add(ringMesh);
            }

            // 紫口与铁足露胎环
            const lipMesh = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.012, 16, 64), tiezuMat);
            lipMesh.rotation.x = Math.PI / 2;
            lipMesh.position.y = 1.00;
            group.add(lipMesh);

            const footMesh = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.022, 16, 64), tiezuMat);
            footMesh.rotation.x = Math.PI / 2;
            footMesh.position.y = -1.15;
            group.add(footMesh);
            break;
        }

        case 1: {
            // 1. 北宋汝窑·天青椭圆四足水仙盆 (台北故宫国宝比例 + 四云头足 + 五枚芝麻支钉)
            const pts = [
                new THREE.Vector2(0.0, -0.27),
                new THREE.Vector2(0.45, -0.27),
                new THREE.Vector2(0.72, -0.26),
                new THREE.Vector2(0.86, -0.14),
                new THREE.Vector2(0.95, 0.04),
                new THREE.Vector2(1.02, 0.16),
                new THREE.Vector2(0.96, 0.19)
            ];
            const basinGeo = createSmoothVesselLathe(pts, null, 64);
            const basinMesh = new THREE.Mesh(basinGeo, glazeMat);
            basinMesh.scale.set(1.28, 1.0, 0.88);
            basinMesh.castShadow = basinMesh.receiveShadow = true;
            group.add(basinMesh);

            // 四只雕琢如意云头足
            const footPositions = [
                { x: 0.68, z: 0.42 }, { x: -0.68, z: 0.42 },
                { x: 0.68, z: -0.42 }, { x: -0.68, z: -0.42 }
            ];
            for (let pos of footPositions) {
                const footGeo = new THREE.CylinderGeometry(0.075, 0.048, 0.12, 24);
                const footMesh = new THREE.Mesh(footGeo, glazeMat);
                footMesh.scale.set(1.3, 1.0, 0.9);
                footMesh.position.set(pos.x, -0.32, pos.z);
                group.add(footMesh);
            }

            // 五枚芝麻花细小支钉痕
            const spurMat = new THREE.MeshStandardMaterial({ color: 0xa69f94, roughness: 0.9 });
            const spurs = [
                { x: 0, z: 0 }, { x: 0.42, z: 0.18 }, { x: -0.42, z: 0.18 },
                { x: 0.42, z: -0.18 }, { x: -0.42, z: -0.18 }
            ];
            for (let s of spurs) {
                const spur = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), spurMat);
                spur.scale.set(1.4, 0.35, 0.85);
                spur.position.set(s.x, -0.278, s.z);
                group.add(spur);
            }
            break;
        }

        case 2: {
            // 2. 北宋定窑·白釉划花莲纹梅瓶 (修长丰肩 + 芒口鎏金铜扣)
            const pts = [
                new THREE.Vector2(0.0, -1.14),
                new THREE.Vector2(0.26, -1.15),
                new THREE.Vector2(0.31, -0.92),
                new THREE.Vector2(0.39, -0.50),
                new THREE.Vector2(0.56, 0.02),
                new THREE.Vector2(0.69, 0.46),
                new THREE.Vector2(0.58, 0.70),
                new THREE.Vector2(0.21, 0.80),
                new THREE.Vector2(0.19, 0.90),
                new THREE.Vector2(0.28, 0.96),
                new THREE.Vector2(0.24, 0.99)
            ];
            const meipingGeo = createSmoothVesselLathe(pts, null, 64);
            const meipingMesh = new THREE.Mesh(meipingGeo, glazeMat);
            meipingMesh.castShadow = meipingMesh.receiveShadow = true;
            group.add(meipingMesh);

            // 定窑覆烧芒口镶皇家鎏金铜扣
            const goldRim = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.015, 20, 64), goldMat);
            goldRim.rotation.x = Math.PI / 2;
            goldRim.position.y = 0.975;
            group.add(goldRim);
            break;
        }

        case 3: {
            // 3. 宋哥窑·金丝铁线胆式瓶 (悬胆垂腹 + 紫口铁足)
            const pts = [
                new THREE.Vector2(0.0, -1.09),
                new THREE.Vector2(0.30, -1.10),
                new THREE.Vector2(0.37, -0.92),
                new THREE.Vector2(0.71, -0.46),
                new THREE.Vector2(0.67, -0.10),
                new THREE.Vector2(0.49, 0.22),
                new THREE.Vector2(0.25, 0.55),
                new THREE.Vector2(0.21, 0.85),
                new THREE.Vector2(0.23, 1.05),
                new THREE.Vector2(0.19, 1.06)
            ];
            const danGeo = createSmoothVesselLathe(pts, null, 64);
            const danMesh = new THREE.Mesh(danGeo, glazeMat);
            danMesh.castShadow = danMesh.receiveShadow = true;
            group.add(danMesh);

            const lipMesh = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.013, 16, 48), tiezuMat);
            lipMesh.rotation.x = Math.PI / 2;
            lipMesh.position.y = 1.055;
            group.add(lipMesh);

            const footMesh = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.022, 16, 48), tiezuMat);
            footMesh.rotation.x = Math.PI / 2;
            footMesh.position.y = -1.10;
            group.add(footMesh);
            break;
        }

        case 4: {
            // 4. 北宋钧窑·玫瑰紫海棠出戟尊 (四瓣海棠曲线调制 + 四方齿状出戟)
            const pts = [
                new THREE.Vector2(0.0, -1.08),
                new THREE.Vector2(0.44, -1.10),
                new THREE.Vector2(0.47, -1.02),
                new THREE.Vector2(0.37, -0.72),
                new THREE.Vector2(0.64, -0.22),
                new THREE.Vector2(0.61, 0.06),
                new THREE.Vector2(0.39, 0.36),
                new THREE.Vector2(0.67, 0.84),
                new THREE.Vector2(0.76, 0.95),
                new THREE.Vector2(0.70, 0.96)
            ];
            const begoniaMod = (ang) => 1.0 + 0.065 * Math.cos(4 * ang);
            const zunGeo = createSmoothVesselLathe(pts, begoniaMod, 64);
            const zunMesh = new THREE.Mesh(zunGeo, glazeMat);
            zunMesh.castShadow = zunMesh.receiveShadow = true;
            group.add(zunMesh);

            // 四面立体齿状出戟 (Flanges)
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const flangeGroup = new THREE.Group();
                flangeGroup.rotation.y = angle;

                const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.038), glazeMat);
                fTop.position.set(0.51, 0.56, 0);
                flangeGroup.add(fTop);

                const fMid = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.34, 0.042), glazeMat);
                fMid.position.set(0.67, -0.10, 0);
                flangeGroup.add(fMid);

                const fBot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.038), glazeMat);
                fBot.position.set(0.45, -0.88, 0);
                flangeGroup.add(fBot);

                group.add(flangeGroup);
            }
            break;
        }

        case 5: {
            // 5. 宋建窑·兔毫曜变天目斗茶盏 (束口注汤槽 + 垂珠釉滴 + 铁胎圈足)
            const pts = [
                new THREE.Vector2(0.0, -0.72),
                new THREE.Vector2(0.26, -0.74),
                new THREE.Vector2(0.31, -0.58),
                new THREE.Vector2(0.56, -0.26),
                new THREE.Vector2(0.79, 0.08),
                new THREE.Vector2(0.87, 0.26),
                new THREE.Vector2(0.84, 0.33),
                new THREE.Vector2(0.89, 0.39),
                new THREE.Vector2(0.84, 0.40)
            ];
            const bowlGeo = createSmoothVesselLathe(pts, null, 64);
            const bowlMesh = new THREE.Mesh(bowlGeo, glazeMat);
            bowlMesh.castShadow = bowlMesh.receiveShadow = true;
            group.add(bowlMesh);

            // 下腹流釉垂珠 (Glaze Tear Drops)
            for (let k = 0; k < 10; k++) {
                const ang = (k / 10) * Math.PI * 2;
                const drop = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 14), glazeMat);
                drop.scale.set(0.9, 1.45, 0.9);
                drop.position.set(Math.cos(ang) * 0.36, -0.52 + (k % 2) * 0.03, Math.sin(ang) * 0.36);
                group.add(drop);
            }

            // 粗黑铁胎足
            const footGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.14, 48);
            const footMesh = new THREE.Mesh(footGeo, tiezuMat);
            footMesh.position.y = -0.72;
            group.add(footMesh);
            break;
        }

        case 6: {
            // 6. 明宣德·青花缠枝莲纹玉壶春瓶 (曼妙水滴腹 + 喇叭撇口)
            const pts = [
                new THREE.Vector2(0.0, -1.09),
                new THREE.Vector2(0.34, -1.10),
                new THREE.Vector2(0.41, -1.02),
                new THREE.Vector2(0.45, -0.84),
                new THREE.Vector2(0.73, -0.36),
                new THREE.Vector2(0.66, 0.02),
                new THREE.Vector2(0.43, 0.34),
                new THREE.Vector2(0.25, 0.66),
                new THREE.Vector2(0.31, 0.92),
                new THREE.Vector2(0.51, 1.14),
                new THREE.Vector2(0.46, 1.15)
            ];
            const yuGeo = createSmoothVesselLathe(pts, null, 64);
            const yuMesh = new THREE.Mesh(yuGeo, glazeMat);
            yuMesh.castShadow = yuMesh.receiveShadow = true;
            group.add(yuMesh);
            break;
        }
    }

    // 若处于 X光胎骨剖面模式，叠加右侧半透明高精密结构网格与金色剖面高亮线
    if (exhibitionMode === 'cutaway') {
        const xrayMat = new THREE.MeshBasicMaterial({
            color: 0x7caab4,
            wireframe: true,
            transparent: true,
            opacity: 0.22
        });
        group.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const ghost = new THREE.Mesh(child.geometry.clone(), xrayMat);
                ghost.scale.copy(child.scale);
                ghost.position.copy(child.position);
                ghost.rotation.copy(child.rotation);
                group.add(ghost);
            }
        });
    }

    return group;
}

/**
 * 构建【真实 3D 室内环境场景 (Realistic 3D Interior Environment)】
 * 包含：宋代青石地砖/故宫金砖、三折紫檀水墨山水插屏、宋代直棂轩窗、明清红木雕花束腰四方几案、
 * 织金锦缎席垫、微距柔和接触投影、斜射丁达尔体积光束、博山香炉缕缕青烟与空气微尘
 */
function createRealistic3DEnvironment() {
    if (realisticRoomGroup) {
        scene.remove(realisticRoomGroup);
        disposeGroup(realisticRoomGroup);
    }
    realisticRoomGroup = new THREE.Group();
    realisticRoomGroup.name = 'Realistic3DRoom';

    const rosewoodTex = getRosewoodTexture();
    const rosewoodMat = new THREE.MeshStandardMaterial({
        map: rosewoodTex,
        roughness: 0.32,
        metalness: 0.15
    });

    // 1. 实体三维地面 (青石地砖 / 金砖 / 窑砖)
    const floorGeo = new THREE.PlaneGeometry(18, 18, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
        map: getRealisticStoneFloorTexture(),
        roughness: 0.38,
        metalness: 0.08
    });
    roomFloorMesh = new THREE.Mesh(floorGeo, floorMat);
    roomFloorMesh.rotation.x = -Math.PI / 2;
    roomFloorMesh.position.y = -1.68;
    roomFloorMesh.receiveShadow = true;
    realisticRoomGroup.add(roomFloorMesh);

    // 2. 明清红木雕花束腰四方几案 (Carved Rosewood Table)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);

    // 几案桌面厚板
    const topPanel = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 0.08, 1.68),
        rosewoodMat
    );
    topPanel.position.y = -1.18;
    topPanel.castShadow = topPanel.receiveShadow = true;
    tableGroup.add(topPanel);

    // 束腰内收结构
    const waistMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.52, 0.05, 1.52),
        rosewoodMat
    );
    waistMesh.position.y = -1.245;
    waistMesh.castShadow = true;
    tableGroup.add(waistMesh);

    // 托腮与牙条
    const apronMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.58, 0.06, 1.58),
        rosewoodMat
    );
    apronMesh.position.y = -1.295;
    apronMesh.castShadow = true;
    tableGroup.add(apronMesh);

    // 四只方实木腿 (带内翻回纹马蹄足)
    const legGeo = new THREE.BoxGeometry(0.09, 0.38, 0.09);
    const legOffsets = [
        [-0.72, -0.72], [0.72, -0.72],
        [-0.72, 0.72], [0.72, 0.72]
    ];
    legOffsets.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, rosewoodMat);
        leg.position.set(lx, -1.485, lz);
        leg.castShadow = true;
        tableGroup.add(leg);

        // 回纹马蹄足木雕底座
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), rosewoodMat);
        foot.position.set(lx, -1.66, lz);
        foot.castShadow = true;
        tableGroup.add(foot);
    });

    // 底部罗锅横枨
    const stretcherMat = rosewoodMat;
    const str1 = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.035, 0.035), stretcherMat);
    str1.position.set(0, -1.54, -0.72);
    tableGroup.add(str1);
    const str2 = str1.clone();
    str2.position.set(0, -1.54, 0.72);
    tableGroup.add(str2);
    const str3 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 1.44), stretcherMat);
    str3.position.set(-0.72, -1.54, 0);
    tableGroup.add(str3);
    const str4 = str3.clone();
    str4.position.set(0.72, -1.54, 0);
    tableGroup.add(str4);

    // 案顶铺设【织锦席垫】
    const matGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.015, 64);
    const brocadeMat = new THREE.MeshStandardMaterial({
        map: getBrocadeMatTexture(),
        roughness: 0.65,
        metalness: 0.12
    });
    const matMesh = new THREE.Mesh(matGeo, brocadeMat);
    matMesh.position.y = -1.132;
    matMesh.receiveShadow = true;
    tableGroup.add(matMesh);

    // 席垫边缘嵌金铜扣圈
    const goldRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.725, 0.008, 12, 64),
        new THREE.MeshStandardMaterial({ color: 0xcba766, roughness: 0.28, metalness: 0.85 })
    );
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = -1.13;
    tableGroup.add(goldRim);

    // 【接触软阴影】：器物足底与席垫接触处的深色自然投影面片 (告别浮游感)
    const shadowGeo = new THREE.PlaneGeometry(0.95, 0.95);
    const shadowMat = new THREE.MeshBasicMaterial({
        map: getContactShadowTexture(),
        transparent: true,
        opacity: 0.85,
        depthWrite: false
    });
    contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.y = -1.124;
    tableGroup.add(contactShadowMesh);

    // 几案整体落地接地柔和软阴影
    const floorShadowGeo = new THREE.PlaneGeometry(2.35, 2.35);
    const floorShadow = new THREE.Mesh(floorShadowGeo, shadowMat);
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.y = -1.675;
    tableGroup.add(floorShadow);

    realisticRoomGroup.add(tableGroup);
    roomTableMesh = tableGroup;

    // 3. 三折紫檀木雕水墨山水插屏 (Folding Screen)
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0, -1.75);

    const screenWoodMat = rosewoodMat;
    const screenPaintMat = new THREE.MeshStandardMaterial({
        map: getScreenPaintingTexture(),
        roughness: 0.82,
        metalness: 0.02
    });

    // (A) 中央主屏 (宽 2.4m, 高 2.7m)
    const mainScreenGroup = new THREE.Group();
    const mainPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.45), screenPaintMat);
    mainPanel.position.set(0, -0.05, 0);
    mainPanel.castShadow = mainPanel.receiveShadow = true;
    mainScreenGroup.add(mainPanel);

    // 实木边框
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.08), screenWoodMat);
    fTop.position.set(0, 1.22, 0);
    mainScreenGroup.add(fTop);
    const fBottom = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.08), screenWoodMat);
    fBottom.position.set(0, -1.33, 0);
    mainScreenGroup.add(fBottom);
    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.65, 0.08), screenWoodMat);
    fLeft.position.set(-1.15, -0.05, 0);
    mainScreenGroup.add(fLeft);
    const fRight = fLeft.clone();
    fRight.position.set(1.15, -0.05, 0);
    mainScreenGroup.add(fRight);

    // 屏风站牙与木座抱鼓石
    [-1.0, 1.0].forEach(bx => {
        const baseFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.48), screenWoodMat);
        baseFoot.position.set(bx, -1.54, 0);
        baseFoot.castShadow = true;
        mainScreenGroup.add(baseFoot);

        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 24), screenWoodMat);
        drum.rotation.z = Math.PI / 2;
        drum.position.set(bx, -1.42, 0);
        mainScreenGroup.add(drum);
    });
    screenGroup.add(mainScreenGroup);

    // (B) 左折屏风 (向内微折 25 度)
    const leftScreen = new THREE.Group();
    leftScreen.position.set(-1.20, 0, 0);
    leftScreen.rotation.y = (25 * Math.PI) / 180;

    const leftPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.3), screenPaintMat);
    leftPanel.position.set(-0.52, -0.08, 0);
    leftScreen.add(leftPanel);

    const lfTop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.09, 0.07), screenWoodMat);
    lfTop.position.set(-0.52, 1.12, 0);
    leftScreen.add(lfTop);
    const lfBottom = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.15, 0.07), screenWoodMat);
    lfBottom.position.set(-0.52, -1.28, 0);
    leftScreen.add(lfBottom);
    const lfSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.49, 0.07), screenWoodMat);
    lfSide.position.set(-1.05, -0.08, 0);
    leftScreen.add(lfSide);
    screenGroup.add(leftScreen);

    // (C) 右折屏风 (向内微折 -25 度)
    const rightScreen = new THREE.Group();
    rightScreen.position.set(1.20, 0, 0);
    rightScreen.rotation.y = (-25 * Math.PI) / 180;

    const rightPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.3), screenPaintMat);
    rightPanel.position.set(0.52, -0.08, 0);
    rightScreen.add(rightPanel);

    const rfTop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.09, 0.07), screenWoodMat);
    rfTop.position.set(0.52, 1.12, 0);
    rightScreen.add(rfTop);
    const rfBottom = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.15, 0.07), screenWoodMat);
    rfBottom.position.set(0.52, -1.28, 0);
    rightScreen.add(rfBottom);
    const rfSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.49, 0.07), screenWoodMat);
    rfSide.position.set(1.05, -0.08, 0);
    rightScreen.add(rfSide);
    screenGroup.add(rightScreen);

    realisticRoomGroup.add(screenGroup);
    roomScreenMesh = screenGroup;

    // 4. 左侧宋代直棂木窗与侧墙 (Song Window & Wall)
    const windowGroup = new THREE.Group();
    windowGroup.position.set(-3.6, 0.45, -0.4);
    windowGroup.rotation.y = Math.PI / 2;

    const wallGeo = new THREE.BoxGeometry(4.8, 4.2, 0.15);
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x222a30,
        roughness: 0.95,
        metalness: 0.05
    });
    roomWallMesh = new THREE.Mesh(wallGeo, wallMat);
    roomWallMesh.position.set(0, 0.4, -0.08);
    windowGroup.add(roomWallMesh);

    // 轩窗半透光窗纸
    const winPaper = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 2.4),
        new THREE.MeshBasicMaterial({
            map: getWindowLatticeTexture(),
            side: THREE.DoubleSide
        })
    );
    winPaper.position.set(0, 0.4, 0.01);
    windowGroup.add(winPaper);

    // 直棂立体木格栅
    const latticeMat = screenWoodMat;
    for (let i = -5; i <= 5; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.4, 0.05), latticeMat);
        bar.position.set(i * 0.24, 0.4, 0.035);
        windowGroup.add(bar);
    }
    for (let j = -2; j <= 2; j++) {
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 0.05), latticeMat);
        hBar.position.set(0, 0.4 + j * 0.55, 0.035);
        windowGroup.add(hBar);
    }
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.96, 2.56, 0.08), latticeMat);
    winFrame.position.set(0, 0.4, 0.04);
    windowGroup.add(winFrame);

    realisticRoomGroup.add(windowGroup);
    roomWindowMesh = windowGroup;

    // 5. 斜射丁达尔体积光束 (Volumetric God-Rays from Window)
    volumetricGodRays = new THREE.Group();
    const rayMat = new THREE.MeshBasicMaterial({
        color: 0xfff2d4,
        transparent: true,
        opacity: 0.055,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    for (let r = 0; r < 3; r++) {
        const cone = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35 + r * 0.15, 0.95 + r * 0.25, 4.8, 32, 1, true),
            rayMat.clone()
        );
        cone.position.set(-1.8 + r * 0.35, 0.25 - r * 0.1, -0.25 + r * 0.2);
        cone.rotation.z = 0.72;
        cone.rotation.y = 0.25;
        volumetricGodRays.add(cone);
    }
    realisticRoomGroup.add(volumetricGodRays);

    // 6. 文房雅玩小景 (博山香炉 + 缕缕青烟 + 研鉴手卷)
    const deskAccGroup = new THREE.Group();

    // (A) 宋式仿古青铜博山香炉
    const censerGroup = new THREE.Group();
    censerGroup.position.set(0.62, -1.13, -0.42);

    const bronzeMat = new THREE.MeshStandardMaterial({
        color: 0x4a5448,
        roughness: 0.45,
        metalness: 0.75
    });
    const censerTray = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.015, 32), bronzeMat);
    censerTray.position.y = 0.01;
    censerGroup.add(censerTray);
    const censerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.08, 32), bronzeMat);
    censerBody.position.y = 0.055;
    censerGroup.add(censerBody);
    const censerLid = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.09, 16), bronzeMat);
    censerLid.position.y = 0.14;
    censerGroup.add(censerLid);
    deskAccGroup.add(censerGroup);

    // (B) 香炉缕缕青烟微粒系统 (Incense Smoke Particles)
    const smokeCount = 75;
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeSeeds = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
        smokePositions[i * 3] = 0.62 + (Math.random() - 0.5) * 0.02;
        smokePositions[i * 3 + 1] = -0.92 + (i / smokeCount) * 0.65;
        smokePositions[i * 3 + 2] = -0.42 + (Math.random() - 0.5) * 0.02;

        smokeSeeds[i * 3] = Math.random() * Math.PI * 2;
        smokeSeeds[i * 3 + 1] = 0.002 + Math.random() * 0.003;
        smokeSeeds[i * 3 + 2] = Math.random();
    }
    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    smokeGeo.userData = { seeds: smokeSeeds };

    const smokeMat = new THREE.PointsMaterial({
        map: getSmokeParticleTexture(),
        size: 0.065,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    incenseSmokeSystem = new THREE.Points(smokeGeo, smokeMat);
    deskAccGroup.add(incenseSmokeSystem);

    // (C) 宋代宣纸研鉴手卷
    const scrollGroup = new THREE.Group();
    scrollGroup.position.set(-0.62, -1.13, 0.42);
    scrollGroup.rotation.y = 0.32;

    const paperScrollMat = new THREE.MeshStandardMaterial({
        color: 0xede4d0,
        roughness: 0.9,
        metalness: 0.0
    });
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.008, 0.34), paperScrollMat);
    sheet.position.set(0, 0.005, 0);
    scrollGroup.add(sheet);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.35, 24), screenWoodMat);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(-0.13, 0.022, 0);
    scrollGroup.add(roll);
    deskAccGroup.add(scrollGroup);

    realisticRoomGroup.add(deskAccGroup);

    scene.add(realisticRoomGroup);

    // 默认应用宋代文人雅室意境
    switchRealisticSceneEnv(currentRoomEnv, false);
}

/**
 * 构建单器精鉴台底座 + 真实 3D 室内环境 + 悬浮微尘
 */
function createInspectorStage() {
    pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);

    // 构建完整真实 3D 室内场景
    createRealistic3DEnvironment();

    // 悬浮流金与文博微尘粒子系统 (Floating Atmospheric Particles)
    const pCount = 160;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
        const r = 0.8 + Math.random() * 3.8;
        const theta = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = -1.2 + Math.random() * 4.2;
        positions[i * 3 + 2] = Math.sin(theta) * r;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0xe5c888,
        size: 0.032,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);
}

/**
 * 切换真实 3D 室内场景三大意境：
 * 'studio' (宋代雨后雅室) | 'palace' (国家文博展殿) | 'kiln' (御窑秘境窑火)
 */
function switchRealisticSceneEnv(envKey, showNotice = true) {
    currentRoomEnv = envKey;
    if (!scene || !realisticRoomGroup) return;

    const lightLabel = document.getElementById('light-preset-name');

    if (envKey === 'studio') {
        // 1. 【宋代文人雨后雅室】
        scene.background = new THREE.Color(0x131a20);
        if (scene.fog) scene.fog.color.setHex(0x131a20);

        if (roomFloorMesh) {
            roomFloorMesh.material.map = getRealisticStoneFloorTexture();
            roomFloorMesh.material.roughness = 0.38;
            roomFloorMesh.material.metalness = 0.08;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (roomWallMesh) {
            roomWallMesh.material.color.setHex(0x222a30);
            roomWallMesh.material.needsUpdate = true;
        }

        if (lightMain) {
            lightMain.color.setHex(0xfff5e6);
            lightMain.intensity = 2.1;
        }
        if (lightFill) {
            lightFill.color.setHex(0x92b8c4);
            lightFill.intensity = 1.05;
        }
        if (lightRim) {
            lightRim.color.setHex(0xffe8c8);
            lightRim.intensity = 1.1;
        }
        if (volumetricGodRays) {
            volumetricGodRays.visible = true;
            volumetricGodRays.children.forEach(c => {
                c.material.color.setHex(0xfff2d4);
                c.material.opacity = 0.055;
            });
        }
        if (particleSystem) {
            particleSystem.material.color.setHex(0xe5c888);
        }
        if (lightLabel) lightLabel.textContent = '宋代雨后雅室';
        if (showNotice && typeof showToast === 'function') {
            showToast('🌿 已置身【宋代文人雨后雅室】！青石地砖、水墨山水屏风与直棂轩窗晨光尽显高古意境');
        }
    } else if (envKey === 'palace') {
        // 2. 【国家文博特展殿堂】
        scene.background = new THREE.Color(0x0a0f16);
        if (scene.fog) scene.fog.color.setHex(0x0a0f16);

        if (roomFloorMesh) {
            roomFloorMesh.material.map = getRealisticGoldBrickTexture();
            roomFloorMesh.material.roughness = 0.16;
            roomFloorMesh.material.metalness = 0.22;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (roomWallMesh) {
            roomWallMesh.material.color.setHex(0x121720);
            roomWallMesh.material.needsUpdate = true;
        }

        if (lightMain) {
            lightMain.color.setHex(0xf4f9ff);
            lightMain.intensity = 2.4;
        }
        if (lightFill) {
            lightFill.color.setHex(0x9dc6dc);
            lightFill.intensity = 1.25;
        }
        if (lightRim) {
            lightRim.color.setHex(0xe8f4ff);
            lightRim.intensity = 1.2;
        }
        if (volumetricGodRays) {
            volumetricGodRays.visible = true;
            volumetricGodRays.children.forEach(c => {
                c.material.color.setHex(0xbfdcff);
                c.material.opacity = 0.04;
            });
        }
        if (particleSystem) {
            particleSystem.material.color.setHex(0xcbe6f5);
        }
        if (lightLabel) lightLabel.textContent = '国家文博殿堂';
        if (showNotice && typeof showToast === 'function') {
            showToast('🏛️ 已切换至【国家文博特展殿堂】！镜面金砖地面与现代高显冷光彰显国宝威仪');
        }
    } else if (envKey === 'kiln') {
        // 3. 【御窑秘境窑火幽室】
        scene.background = new THREE.Color(0x180905);
        if (scene.fog) scene.fog.color.setHex(0x180905);

        if (roomFloorMesh) {
            roomFloorMesh.material.map = getRealisticKilnBrickTexture();
            roomFloorMesh.material.roughness = 0.88;
            roomFloorMesh.material.metalness = 0.02;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (roomWallMesh) {
            roomWallMesh.material.color.setHex(0x28120c);
            roomWallMesh.material.needsUpdate = true;
        }

        if (lightMain) {
            lightMain.color.setHex(0xff6224);
            lightMain.intensity = 2.7;
        }
        if (lightFill) {
            lightFill.color.setHex(0xc43212);
            lightFill.intensity = 1.15;
        }
        if (lightRim) {
            lightRim.color.setHex(0xffa834);
            lightRim.intensity = 1.35;
        }
        if (volumetricGodRays) {
            volumetricGodRays.visible = true;
            volumetricGodRays.children.forEach(c => {
                c.material.color.setHex(0xff7a38);
                c.material.opacity = 0.065;
            });
        }
        if (particleSystem) {
            particleSystem.material.color.setHex(0xffaa44);
        }
        if (lightLabel) lightLabel.textContent = '御窑秘境窑火';
        if (showNotice && typeof showToast === 'function') {
            showToast('🔥 已进入【御窑秘境窑火幽室】！1300℃窑火红曜映照，感悟入窑一色出窑万彩之奇迹');
        }
    }

    ['studio', 'palace', 'kiln'].forEach(k => {
        const btn = document.getElementById(`scene-env-btn-${k}`);
        if (btn) btn.classList.toggle('active', k === envKey);
    });
}

/**
 * 开启/隐藏 3D 真实室内场景与几案
 */
function toggleRealisticScene() {
    showRealisticScene = !showRealisticScene;
    if (realisticRoomGroup) {
        realisticRoomGroup.visible = showRealisticScene && (exhibitionMode !== 'hall');
    }
    const btn = document.getElementById('btn-room-scene-toggle');
    if (btn) btn.classList.toggle('active', showRealisticScene);
    if (typeof showToast === 'function') {
        showToast(showRealisticScene ? '🏛️ 已开启【3D 真实室内环境场景】' : '已隐藏室内场景，切换为极简背景');
    }
}

/**
 * 构建【3D 全景数字博物馆大展厅 (Virtual Museum Rotunda Hall)】
 * 7 尊传世名瓷同时陈列于环形穹顶大展厅的独立玻璃展柜内，支持点击漫游巡礼！
 */
function buildVirtualMuseumHall() {
    if (hallGroup) {
        scene.remove(hallGroup);
        disposeGroup(hallGroup);
    }
    hallGroup = new THREE.Group();
    hallGroup.visible = (exhibitionMode === 'hall');

    // 1. 展厅玄青玉石镜面大地面与鎏金罗盘圈
    const floorGeo = new THREE.CylinderGeometry(13.5, 13.5, 0.1, 96);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0d1319,
        roughness: 0.18,
        metalness: 0.35
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -1.45;
    floorMesh.receiveShadow = true;
    hallGroup.add(floorMesh);

    const compassGold = new THREE.MeshStandardMaterial({ color: 0xc5a059, roughness: 0.3, metalness: 0.85 });
    [2.6, 5.8, 8.8, 11.5].forEach(rad => {
        const rMesh = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.02, 12, 96), compassGold);
        rMesh.rotation.x = Math.PI / 2;
        rMesh.position.y = -1.39;
        hallGroup.add(rMesh);
    });

    // 2. 环形宋式柱廊 (12根朱漆玄金立柱 + 顶部藻井天光环)
    const colGeo = new THREE.CylinderGeometry(0.22, 0.25, 6.2, 24);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x1c252e, roughness: 0.4, metalness: 0.3 });
    for (let c = 0; c < 12; c++) {
        const ang = (c / 12) * Math.PI * 2;
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(Math.cos(ang) * 10.5, 1.65, Math.sin(ang) * 10.5);
        hallGroup.add(col);

        // 柱础金环
        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 12, 32), compassGold);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.set(Math.cos(ang) * 10.5, -1.38, Math.sin(ang) * 10.5);
        hallGroup.add(baseRing);
    }

    // 穹顶藻井流光圆环
    const domeRing = new THREE.Mesh(
        new THREE.TorusGeometry(6.2, 0.06, 16, 96),
        new THREE.MeshBasicMaterial({ color: 0x8fb8c0 })
    );
    domeRing.rotation.x = Math.PI / 2;
    domeRing.position.y = 4.2;
    hallGroup.add(domeRing);

    // 3. 七座独立高定博物馆展柜 (弧形环列，每座展柜陈列一件传世名瓷标准器)
    const arcRadius = 5.6;
    for (let idx = 0; idx < porcelainModelsData.length; idx++) {
        const mData = porcelainModelsData[idx];
        // 在前方 240 度扇形弧线上均匀排布 7 座展柜
        const angle = ((idx - 3) / 6) * (Math.PI * 1.15);
        const vx = Math.sin(angle) * arcRadius;
        const vz = -Math.cos(angle) * arcRadius + 1.8;

        const booth = new THREE.Group();
        booth.position.set(vx, 0, vz);
        booth.lookAt(0, 0, 2.5);
        booth.userData = { vitrineIndex: idx };

        // 展柜乌木基座
        const podium = new THREE.Mesh(
            new THREE.CylinderGeometry(0.85, 0.95, 0.9, 48),
            new THREE.MeshStandardMaterial({ color: 0x151d26, roughness: 0.3, metalness: 0.25 })
        );
        podium.position.y = -0.95;
        podium.userData = { vitrineIndex: idx };
        booth.add(podium);

        // 展柜鎏金腰线
        const podiumGold = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.015, 12, 48), compassGold);
        podiumGold.rotation.x = Math.PI / 2;
        podiumGold.position.y = -0.50;
        booth.add(podiumGold);

        // 防眩光博物馆超白玻璃罩
        const glassBell = new THREE.Mesh(
            new THREE.CylinderGeometry(0.82, 0.82, 1.85, 36, 1, true),
            new THREE.MeshPhysicalMaterial({
                color: 0xd8f0f5,
                transparent: true,
                opacity: 0.14,
                roughness: 0.05,
                metalness: 0.05,
                clearcoat: 1.0
            })
        );
        glassBell.position.y = 0.42;
        glassBell.userData = { vitrineIndex: idx };
        booth.add(glassBell);

        // 顶部独立体积光束
        const vBeam = new THREE.Mesh(
            new THREE.ConeGeometry(0.95, 3.2, 24, 1, true),
            new THREE.MeshBasicMaterial({
                color: idx === currentModelIndex ? 0xe5c888 : 0x8fb8c0,
                transparent: true,
                opacity: idx === currentModelIndex ? 0.09 : 0.04,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        vBeam.position.y = 1.6;
        booth.add(vBeam);

        // 展柜内陈列的传世瓷器模型 (缩放至 0.52 适配展柜)
        const vesselMeshGroup = buildGeometry(idx, mData.defaultGlaze);
        vesselMeshGroup.scale.set(0.52, 0.52, 0.52);
        vesselMeshGroup.position.y = 0.12;
        vesselMeshGroup.traverse(c => { c.userData = { vitrineIndex: idx }; });
        booth.add(vesselMeshGroup);

        hallGroup.add(booth);
    }

    scene.add(hallGroup);
}

/**
 * 初始化并挂载 3D 研鉴展馆场景
 */
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
        // 1. 场景与深邃景深雾效
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x090d12);
        scene.fog = new THREE.FogExp2(0x090d12, 0.045);

        // 2. 透视相机
        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 560;
        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 1.05, 3.65);

        // 3. 高动态范围渲染器 + 局部剖切支持
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.22;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.localClippingEnabled = false;

        // 初始化X光动态剖切平面 (沿X=0纵向切开器物)
        clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.0);

        // 4. 生成程序化 HDR 博物馆环境反射贴图
        envMapTexture = createStudioEnvironment(renderer);
        if (envMapTexture) {
            scene.environment = envMapTexture;
        }

        // 5. 四点博物馆专业布光系统
        ambientLight = new THREE.AmbientLight(0xdbe8ec, 0.85);
        scene.add(ambientLight);

        lightMain = new THREE.DirectionalLight(0xfff6e8, 2.1);
        lightMain.position.set(3.2, 5.2, 4.0);
        lightMain.castShadow = true;
        lightMain.shadow.mapSize.width = 1024;
        lightMain.shadow.mapSize.height = 1024;
        lightMain.shadow.camera.near = 0.5;
        lightMain.shadow.camera.far = 15;
        lightMain.shadow.camera.left = -3;
        lightMain.shadow.camera.right = 3;
        lightMain.shadow.camera.top = 3;
        lightMain.shadow.camera.bottom = -3;
        lightMain.shadow.bias = -0.0005;
        scene.add(lightMain);

        lightFill = new THREE.DirectionalLight(0x88b8c8, 1.05);
        lightFill.position.set(-3.8, 2.2, -2.5);
        scene.add(lightFill);

        lightRim = new THREE.PointLight(0xffe4b5, 1.1, 14);
        lightRim.position.set(0, 3.8, -3.2);
        scene.add(lightRim);

        topSpotLight = new THREE.SpotLight(0xffffff, 1.6, 15, Math.PI / 5, 0.65, 1.5);
        topSpotLight.position.set(0, 5.5, 0.5);
        scene.add(topSpotLight);

        // 6. 创建单器精鉴台与全景博物馆展厅
        createInspectorStage();
        loadPorcelainModel(0);

        // 7. 绑定交互手势与 Raycaster 展柜点选
        setupControls(canvas);
        window.addEventListener('resize', handleThreeResize);
        setupVisibilityObserver(canvas);

        // 8. 启动 60FPS 渲染循环
        animate();
    } catch (err) {
        console.warn('[ThreeJS 研鉴空间] 初始化异常:', err);
    }
}

/**
 * 切换四大 3D 展览与检视模式：
 * 'inspector' (单器精鉴台) | 'hall' (3D全景展厅漫游) | 'cutaway' (X光胎骨剖面)
 */
function switchExhibitionMode(mode) {
    if (!renderer) return;
    exhibitionMode = mode;

    ['inspector', 'hall', 'cutaway'].forEach(m => {
        const btn = document.getElementById(`mode-btn-${m}`);
        if (btn) btn.classList.toggle('active', m === mode);
    });

    if (mode === 'hall') {
        // 切换至 3D 全景博物馆大展厅漫游
        renderer.localClippingEnabled = false;
        if (currentGroup) currentGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = false;
        if (realisticRoomGroup) realisticRoomGroup.visible = false;
        buildVirtualMuseumHall();
        if (hallGroup) hallGroup.visible = true;
        focusVitrineInHall(currentModelIndex);
        if (typeof showToast === 'function') {
            showToast('🏛️ 已步入【3D 全景数字博物馆大展厅】！点击任意展柜或下方器型即可漫游走近观摩');
        }
    } else if (mode === 'cutaway') {
        // 切换至 X光胎骨剖面透视模式
        renderer.localClippingEnabled = true;
        if (hallGroup) hallGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = true;
        if (realisticRoomGroup) realisticRoomGroup.visible = showRealisticScene;
        loadPorcelainModel(currentModelIndex, true);
        camPosTarget = { x: 0.2, y: 0.65, z: 3.25 };
        camLookTarget = { x: 0, y: 0, z: 0 };
        if (typeof showToast === 'function') {
            showToast('🔬 已开启【X光胎骨180°纵向剖面透视】！可直观审视宋瓷“薄胎厚釉、口薄底厚”的内部力学构造');
        }
    } else {
        // 默认：单器 360° 精鉴台
        renderer.localClippingEnabled = false;
        if (hallGroup) hallGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = true;
        if (realisticRoomGroup) realisticRoomGroup.visible = showRealisticScene;
        loadPorcelainModel(currentModelIndex, true);
        camPosTarget = { x: 0, y: 1.05, z: 3.65 };
        camLookTarget = { x: 0, y: 0, z: 0 };
        if (typeof showToast === 'function') {
            showToast('✨ 已切换至【单器 360° 微距精鉴台】');
        }
    }
    render3DHotspotsDOM();
}

/**
 * 在 3D 全景展厅中平滑运镜飞向第 index 号展柜
 */
function focusVitrineInHall(index) {
    const arcRadius = 5.6;
    const angle = ((index - 3) / 6) * (Math.PI * 1.15);
    const vx = Math.sin(angle) * arcRadius;
    const vz = -Math.cos(angle) * arcRadius + 1.8;

    // 相机停在展柜正前方 2.3 米处，略高于展柜中心
    const camDist = 2.35;
    camPosTarget = {
        x: vx - Math.sin(angle) * camDist,
        y: 0.62,
        z: vz + Math.cos(angle) * camDist
    };
    camLookTarget = { x: vx, y: 0.08, z: vz };
}

/**
 * 开启/关闭【策展人自动导览巡礼】
 */
function toggleCuratorialTour() {
    curatorialTourActive = !curatorialTourActive;
    const btn = document.getElementById('mode-btn-tour');
    const label = document.getElementById('tour-btn-label');
    if (btn) btn.classList.toggle('active', curatorialTourActive);
    if (label) label.textContent = curatorialTourActive ? '停止巡礼' : '策展自动巡礼';

    if (tourTimer) {
        clearInterval(tourTimer);
        tourTimer = null;
    }

    if (curatorialTourActive) {
        if (exhibitionMode !== 'hall') {
            switchExhibitionMode('hall');
        }
        if (typeof showToast === 'function') {
            showToast('🎬 已开启【策展人自动巡礼】，镜头将依次带您漫游馆藏七大传世名瓷展柜');
        }
        tourTimer = setInterval(() => {
            const nextIdx = (currentModelIndex + 1) % porcelainModelsData.length;
            loadPorcelainModel(nextIdx);
            if (typeof playPorcelainChime === 'function') {
                playPorcelainChime(2200 + nextIdx * 120);
            }
        }, 4200);
    } else {
        if (typeof showToast === 'function') {
            showToast('已暂停策展自动巡礼，您可自由旋转或点选观摩');
        }
    }
}

/**
 * 加载并切换指定器型
 */
function loadPorcelainModel(index, keepMode = false) {
    currentModelIndex = index;
    if (porcelainModelsData[index] && porcelainModelsData[index].defaultGlaze && !keepMode) {
        currentGlazeIndex = porcelainModelsData[index].defaultGlaze;
    }

    if (currentGroup) {
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
    }

    currentGroup = buildGeometry(index);
    currentGroup.visible = (exhibitionMode !== 'hall');
    scene.add(currentGroup);

    if (showDimensions) {
        if (dimensionGroup) scene.remove(dimensionGroup);
        dimensionGroup = createDimensionLines(index);
        scene.add(dimensionGroup);
    }

    if (exhibitionMode === 'hall') {
        buildVirtualMuseumHall();
        focusVitrineInHall(index);
    } else if (!keepMode) {
        userOrbitAngles = { theta: 0, phi: 0.28, radius: 3.65 };
        camPosTarget = { x: 0, y: 1.05, z: 3.65 };
        camLookTarget = { x: 0, y: 0, z: 0 };
    }

    updateModelInfoCard(index);
    highlightActiveModelBtn(index);
    highlightActiveGlazeBtn(currentGlazeIndex);
    render3DHotspotsDOM();
}

/**
 * 构建并更新 3D 空间器物特征解剖锚点 DOM
 */
function render3DHotspotsDOM() {
    const layer = document.getElementById('three-hotspots-layer');
    if (!layer) return;

    if (!showHotspots || exhibitionMode === 'hall') {
        layer.innerHTML = '';
        return;
    }

    const m = porcelainModelsData[currentModelIndex];
    if (!m || !m.hotspots) {
        layer.innerHTML = '';
        return;
    }

    layer.innerHTML = m.hotspots.map((h, i) => `
        <button class="vessel-3d-hotspot" id="vessel-hotspot-${i}" onclick="focusHotspot(${i})">
            <span class="pulse-dot"></span>
            <span>${h.label}</span>
        </button>
    `).join('');
}

function focusHotspot(hotspotIdx) {
    const m = porcelainModelsData[currentModelIndex];
    if (!m || !m.hotspots || !m.hotspots[hotspotIdx]) return;
    const h = m.hotspots[hotspotIdx];
    setCameraView(h.view || 'front');
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2680);
    if (typeof showToast === 'function') {
        showToast(`🔍 特写聚焦：【${h.label}】`);
    }
}

function toggle3DHotspots() {
    showHotspots = !showHotspots;
    const btn = document.getElementById('btn-hotspots-toggle');
    if (btn) btn.classList.toggle('active', showHotspots);
    render3DHotspotsDOM();
    if (typeof showToast === 'function') {
        showToast(showHotspots ? '已开启【3D器物解剖锚点】' : '已隐藏 3D 解剖锚点');
    }
}

/**
 * 实时计算 3D 解剖锚点在 2D 屏幕上的投影坐标
 */
function updateHotspotsScreenProjection() {
    if (!showHotspots || exhibitionMode === 'hall' || !currentGroup || !camera) return;
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;
    const m = porcelainModelsData[currentModelIndex];
    if (!m || !m.hotspots) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    m.hotspots.forEach((spot, i) => {
        const el = document.getElementById(`vessel-hotspot-${i}`);
        if (!el) return;
        const vec = new THREE.Vector3(spot.pos[0], spot.pos[1], spot.pos[2]);
        vec.applyEuler(currentGroup.rotation);
        vec.project(camera);

        const sx = (vec.x * 0.5 + 0.5) * w;
        const sy = (-(vec.y * 0.5) + 0.5) * h;

        if (vec.z < 1.0 && sx > 20 && sx < w - 20 && sy > 50 && sy < h - 50) {
            el.style.left = `${sx}px`;
            el.style.top = `${sy}px`;
            el.style.opacity = '1';
        } else {
            el.style.opacity = '0';
        }
    });
}

/**
 * 光影实验室：切换四大博物馆与历史场景色温光效并联动真实 3D 空间
 */
function setStudioLighting(preset) {
    if (preset === 'palace') {
        switchRealisticSceneEnv('studio');
    } else if (preset === 'museum') {
        switchRealisticSceneEnv('palace');
    } else if (preset === 'kiln') {
        switchRealisticSceneEnv('kiln');
    } else if (preset === 'candle') {
        scene.background = new THREE.Color(0x140c06);
        if (scene.fog) scene.fog.color.setHex(0x140c06);
        if (lightMain) {
            lightMain.color.setHex(0xffb258);
            lightMain.intensity = 2.2;
        }
        if (lightFill) {
            lightFill.color.setHex(0x8a4c28);
            lightFill.intensity = 0.85;
        }
        if (lightRim) {
            lightRim.color.setHex(0xff8c26);
            lightRim.intensity = 1.25;
        }
        if (volumetricGodRays) {
            volumetricGodRays.visible = true;
            volumetricGodRays.children.forEach(c => {
                c.material.color.setHex(0xff9f40);
                c.material.opacity = 0.05;
            });
        }
        const label = document.getElementById('light-preset-name');
        if (label) label.textContent = '宫廷夜宴烛火';
        if (typeof showToast === 'function') {
            showToast('🕯️ 已切换展厅光影氛围：【宫廷夜宴烛火】');
        }
    }
}

function rotateMainLight(deg) {
    if (!lightMain) return;
    const rad = (parseFloat(deg) * Math.PI) / 180;
    lightMain.position.set(Math.cos(rad) * 4.5, 5.2, Math.sin(rad) * 4.5);
}

/**
 * 全屏沉浸式观展模式
 */
function toggle3DFullscreen() {
    const container = document.getElementById('three-stage-container');
    const icon = document.getElementById('fullscreen-icon');
    if (!container) return;

    container.classList.toggle('fullscreen-mode');
    const isFull = container.classList.contains('fullscreen-mode');
    if (icon) {
        icon.className = isFull ? 'fa-solid fa-compress text-amber-400' : 'fa-solid fa-expand text-tianqing-light';
    }
    setTimeout(handleThreeResize, 60);
    if (typeof showToast === 'function') {
        showToast(isFull ? '已进入【全屏沉浸式 3D 展馆】，再次点击右上角按钮可退出' : '已退出全屏展览模式');
    }
}

/**
 * 切换釉色
 */
function switchGlaze(glazeKey) {
    if (!glazePalettes[glazeKey]) return;
    currentGlazeIndex = glazeKey;
    if (currentGroup) {
        const prevRotY = currentGroup.rotation.y;
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        currentGroup = buildGeometry(currentModelIndex);
        currentGroup.rotation.y = prevRotY;
        currentGroup.visible = (exhibitionMode !== 'hall');
        scene.add(currentGroup);
    }
    highlightActiveGlazeBtn(glazeKey);
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2450);
    if (typeof showToast === 'function') {
        showToast(`已切换 PBR 釉色：【${glazePalettes[glazeKey].name}】`);
    }
}

function toggleCrackle() {
    showCrackle = !showCrackle;
    loadPorcelainModel(currentModelIndex, true);
    const btn = document.getElementById('btn-crackle-toggle');
    if (btn) btn.classList.toggle('active', showCrackle);
    if (typeof showToast === 'function') {
        showToast(showCrackle ? '已开启【开片冰裂金丝铁线凹凸法线】' : '已切换为【无纹素净玉面】');
    }
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    loadPorcelainModel(currentModelIndex, true);
    const btn = document.getElementById('btn-wireframe-toggle');
    if (btn) btn.classList.toggle('active', isWireframe);
    if (typeof showToast === 'function') {
        showToast(isWireframe ? '已开启【128段器型力学网格透视】' : '已恢复【PBR 物理釉面渲染】');
    }
}

function toggleAutoRotate() {
    autoRotate = !autoRotate;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.toggle('active', autoRotate);
}

function setCameraView(viewType) {
    if (exhibitionMode === 'hall') {
        switchExhibitionMode('inspector');
    }
    autoRotate = false;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.remove('active');
    if (currentGroup) currentGroup.rotation.set(0, 0, 0);

    switch (viewType) {
        case 'front':
            camPosTarget = { x: 0, y: 0.1, z: 3.4 };
            break;
        case 'top':
            camPosTarget = { x: 0, y: 3.8, z: 0.25 };
            break;
        case 'bottom':
            camPosTarget = { x: 0, y: -2.9, z: 1.65 };
            break;
        default:
            camPosTarget = { x: 0, y: 1.05, z: 3.65 };
            break;
    }
    camLookTarget = { x: 0, y: 0, z: 0 };
}

function resetCamera() {
    if (exhibitionMode === 'hall') {
        camPosTarget = { x: 0, y: 1.8, z: 4.8 };
        camLookTarget = { x: 0, y: 0.2, z: -2.5 };
        return;
    }
    camPosTarget = { x: 0, y: 1.05, z: 3.65 };
    camLookTarget = { x: 0, y: 0, z: 0 };
    if (currentGroup) currentGroup.rotation.set(0, 0, 0);
    autoRotate = true;
    const btn = document.getElementById('btn-rotate-toggle');
    if (btn) btn.classList.add('active');
}

function toggleDimensionLines() {
    showDimensions = !showDimensions;
    if (dimensionGroup) {
        scene.remove(dimensionGroup);
        dimensionGroup = null;
    }
    if (showDimensions && currentGroup) {
        dimensionGroup = createDimensionLines();
        scene.add(dimensionGroup);
    }
    const btn = document.getElementById('btn-dimensions-toggle');
    if (btn) btn.classList.toggle('active', showDimensions);
    if (typeof showToast === 'function') {
        showToast(showDimensions ? '📏 已开启【器物考古测绘标定线】' : '已关闭测绘标线');
    }
}

function createDimensionLines() {
    const group = new THREE.Group();
    const lineMat = new THREE.LineDashedMaterial({ color: 0xe5c888, dashSize: 0.05, gapSize: 0.025 });

    const addSeg = (p1, p2) => {
        const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const line = new THREE.Line(geo, lineMat);
        line.computeLineDistances();
        group.add(line);
    };
    addSeg(new THREE.Vector3(1.12, -1.15, 0), new THREE.Vector3(1.12, 1.05, 0));
    addSeg(new THREE.Vector3(0.35, 1.05, 0), new THREE.Vector3(1.18, 1.05, 0));
    addSeg(new THREE.Vector3(0.35, -1.15, 0), new THREE.Vector3(1.18, -1.15, 0));
    return group;
}

function openMicroscopeView() {
    const modal = document.getElementById('microscope-modal');
    if (modal) modal.classList.add('active');
    if (typeof playCrackleSound === 'function') playCrackleSound();
}

function closeMicroscopeView() {
    const modal = document.getElementById('microscope-modal');
    if (modal) modal.classList.remove('active');
}

/**
 * 鼠标与触屏阻尼交互控制 + Raycaster 3D 展柜点击拾取
 */
function setupControls(canvas) {
    let prevX = 0, prevY = 0;
    let pointerDownPos = { x: 0, y: 0 };
    let initialPinchDist = null;
    let initialCamZ = 3.65;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    canvas.addEventListener('pointerdown', (e) => {
        isUserDragging = true;
        prevX = pointerDownPos.x = e.clientX;
        pointerDownPos.y = prevY = e.clientY;
        autoRotate = false;
        const btn = document.getElementById('btn-rotate-toggle');
        if (btn) btn.classList.remove('active');
    });

    window.addEventListener('pointermove', (e) => {
        if (!isUserDragging) return;
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;

        if (exhibitionMode === 'hall') {
            // 展厅漫游模式下拖拽环视整个圆形展馆
            camLookTarget.x -= deltaX * 0.015;
            camLookTarget.y = Math.max(-0.8, Math.min(1.8, camLookTarget.y + deltaY * 0.01));
        } else if (currentGroup) {
            currentGroup.rotation.y += deltaX * 0.0085;
            currentGroup.rotation.x = Math.max(-Math.PI / 2.6, Math.min(Math.PI / 2.6, currentGroup.rotation.x + deltaY * 0.0085));
        }
    });

    window.addEventListener('pointerup', (e) => {
        if (!isUserDragging) return;
        isUserDragging = false;

        // 判断是否为轻点 (Click) 动作
        const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (moveDist < 6) {
            if (exhibitionMode === 'hall' && hallGroup) {
                const rect = canvas.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObjects(hallGroup.children, true);
                for (let hit of hits) {
                    if (hit.object && hit.object.userData && hit.object.userData.vitrineIndex !== undefined) {
                        const targetIdx = hit.object.userData.vitrineIndex;
                        loadPorcelainModel(targetIdx);
                        if (typeof playPorcelainChime === 'function') playPorcelainChime(2500);
                        break;
                    }
                }
            } else if (typeof playPorcelainChime === 'function') {
                playPorcelainChime(2200 + Math.random() * 400);
            }
        }
    });

    // 滚轮丝滑缩放
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * 0.0028;
        camPosTarget.z = Math.max(1.75, Math.min(6.8, camPosTarget.z + delta));
    }, { passive: false });

    // 移动端双指捏合缩放
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialCamZ = camPosTarget.z;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialPinchDist) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scale = initialPinchDist / dist;
            camPosTarget.z = Math.max(1.75, Math.min(6.8, initialCamZ * scale));
        }
    }, { passive: true });

    canvas.addEventListener('dblclick', resetCamera);
}

function disposeGroup(grp) {
    if (!grp) return;
    grp.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        }
    });
}

let isCanvasVisible = true;
function setupVisibilityObserver(canvas) {
    if (!canvas || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
        const wasVisible = isCanvasVisible;
        isCanvasVisible = entries[0].isIntersecting;
        if (!wasVisible && isCanvasVisible) requestAnimationFrame(animate);
    }, { threshold: 0.04 });
    observer.observe(canvas);
}

/**
 * 主渲染循环：平滑相机阻尼插值 + 器物旋转 + 流金粒子漂浮 + 3D 锚点投影
 */
let lastFrameTime = 0;
function animate(now) {
    if (!isCanvasVisible) return;
    requestAnimationFrame(animate);
    if (now && now - lastFrameTime < 28) return;
    lastFrameTime = now || 0;

    // 1. 相机平滑阻尼追踪 (Damped Camera Interpolation)
    camera.position.x += (camPosTarget.x - camera.position.x) * 0.08;
    camera.position.y += (camPosTarget.y - camera.position.y) * 0.08;
    camera.position.z += (camPosTarget.z - camera.position.z) * 0.08;

    camLookCurrent.x += (camLookTarget.x - camLookCurrent.x) * 0.08;
    camLookCurrent.y += (camLookTarget.y - camLookCurrent.y) * 0.08;
    camLookCurrent.z += (camLookTarget.z - camLookCurrent.z) * 0.08;
    camera.lookAt(camLookCurrent.x, camLookCurrent.y, camLookCurrent.z);

    // 2. 器物与展厅内展品自转
    if (currentGroup && autoRotate && exhibitionMode !== 'hall') {
        currentGroup.rotation.y += 0.0055;
    }
    if (hallGroup && exhibitionMode === 'hall') {
        hallGroup.children.forEach(child => {
            if (child.userData && child.userData.vitrineIndex !== undefined) {
                const vGroup = child.children[child.children.length - 1];
                if (vGroup) vGroup.rotation.y += 0.006;
            }
        });
    }

    // 3. 悬浮流金微粒缓缓上升与盘旋
    if (particleSystem) {
        particleSystem.rotation.y += 0.0012;
        const pos = particleSystem.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let py = pos.getY(i) + 0.0025;
            if (py > 2.8) py = -1.2;
            pos.setY(i, py);
        }
        pos.needsUpdate = true;
    }

    // 4. 博山香炉缕缕青烟上升飘散循环
    if (incenseSmokeSystem && incenseSmokeSystem.visible && realisticRoomGroup && realisticRoomGroup.visible) {
        const sPos = incenseSmokeSystem.geometry.attributes.position;
        const sSeeds = incenseSmokeSystem.geometry.userData.seeds;
        if (sSeeds) {
            for (let i = 0; i < sPos.count; i++) {
                let py = sPos.getY(i) + sSeeds[i * 3 + 1];
                sSeeds[i * 3] += 0.025;
                const px = 0.62 + Math.sin(sSeeds[i * 3]) * 0.025 * (py - (-0.95));
                const pz = -0.42 + Math.cos(sSeeds[i * 3]) * 0.025 * (py - (-0.95));
                if (py > -0.25) {
                    py = -0.92;
                }
                sPos.setX(i, px);
                sPos.setY(i, py);
                sPos.setZ(i, pz);
            }
            sPos.needsUpdate = true;
        }
    }

    // 5. 斜射丁达尔体积光微弱呼吸起伏 (自然天光云影感)
    if (volumetricGodRays && volumetricGodRays.visible && realisticRoomGroup && realisticRoomGroup.visible) {
        const pulse = Math.sin(Date.now() * 0.0018) * 0.01;
        volumetricGodRays.children.forEach((c, idx) => {
            if (c.material) {
                c.material.opacity = Math.max(0.02, 0.055 + pulse * (idx % 2 === 0 ? 1 : -1));
            }
        });
    }

    // 6. 更新 3D 空间解剖锚点屏幕坐标
    updateHotspotsScreenProjection();

    renderer.render(scene, camera);
}

function handleThreeResize() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer || !camera) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

/**
 * 更新右侧器物研鉴详情卡片
 */
function updateModelInfoCard(index) {
    const infoEl = document.getElementById('3d-model-info');
    if (!infoEl) return;
    const m = porcelainModelsData[index];
    if (!m) return;

    infoEl.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start justify-between gap-2">
                <div>
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="badge bg-tianqing-deep text-white text-xs">${m.period}</span>
                        <span class="text-[11px] font-mono text-amber-400">${m.dimensions || ''}</span>
                    </div>
                    <h3 class="text-xl font-serif-cn text-text-title font-semibold">${m.name}</h3>
                    <p class="text-[11px] text-text-muted mt-0.5 font-serif-cn">${m.english}</p>
                </div>
                <span class="text-xs text-tianqing-deep bg-yuebai px-3 py-1 rounded-full font-medium shrink-0 border border-border-light">${m.kiln}</span>
            </div>

            <p class="text-xs sm:text-sm text-text-body leading-relaxed font-light">${m.desc}</p>

            <div class="border-t border-border-light pt-3">
                <h4 class="text-xs text-text-title font-medium mb-2.5 tracking-wider flex items-center justify-between">
                    <span>【三维器物学与物理鉴藏要领】</span>
                    <button onclick="openMicroscopeView()" class="text-tianqing-deep hover:underline text-[11px] font-normal flex items-center gap-1">
                        <i class="fa-solid fa-microscope"></i>
                        <span>100x晶相观察</span>
                    </button>
                </h4>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    ${m.features.map(f => `
                        <div class="flex items-center gap-1.5 text-text-body bg-bg-main p-2 rounded-lg border border-border-light">
                            <i class="fa-solid fa-check text-amber-400 text-[10px]"></i>
                            <span>${f}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-2 text-xs">
                <button onclick="switchExhibitionMode(exhibitionMode === 'cutaway' ? 'inspector' : 'cutaway')" class="flex-1 py-2 px-3 rounded-xl bg-yuebai hover:bg-tianqing hover:text-white text-text-title font-serif-cn transition-colors flex items-center justify-center gap-1.5 border border-border-light">
                    <i class="fa-solid fa-layer-group text-tianqing-deep"></i>
                    <span>切换 X光胎壁剖面</span>
                </button>
                <button onclick="switchExhibitionMode(exhibitionMode === 'hall' ? 'inspector' : 'hall')" class="flex-1 py-2 px-3 rounded-xl bg-tianqing-deep text-white hover:bg-tianqing font-serif-cn transition-colors flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-building-columns text-amber-200"></i>
                    <span>${exhibitionMode === 'hall' ? '返回单器精鉴' : '在全景展厅观摩'}</span>
                </button>
            </div>
        </div>
    `;
}

function highlightActiveModelBtn(index) {
    document.querySelectorAll('.model-btn').forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('bg-tianqing-deep', 'text-white');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white');
            btn.classList.add('bg-yuebai', 'text-text-body');
        }
    });
}

function highlightActiveGlazeBtn(glazeKey) {
    document.querySelectorAll('.glaze-btn').forEach(btn => {
        if (btn.dataset.glaze === glazeKey) {
            btn.classList.add('ring-2', 'scale-105');
        } else {
            btn.classList.remove('ring-2', 'scale-105');
        }
    });
}

// 挂载全局方法
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
window.switchExhibitionMode = switchExhibitionMode;
window.toggleCuratorialTour = toggleCuratorialTour;
window.toggle3DHotspots = toggle3DHotspots;
window.focusHotspot = focusHotspot;
window.setStudioLighting = setStudioLighting;
window.rotateMainLight = rotateMainLight;
window.toggle3DFullscreen = toggle3DFullscreen;
window.switchRealisticSceneEnv = switchRealisticSceneEnv;
window.toggleRealisticScene = toggleRealisticScene;
