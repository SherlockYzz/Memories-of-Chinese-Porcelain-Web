/**
 * 华夏器道 · 仝瓷记忆 — 旗舰级 3D 数字文博展馆与 PBR 物理研鉴引擎 (Three.js WebGL National Award Flagship Engine)
 * 核心升级：
 * 1. 九大传世馆藏：7尊128段高精度双壁程序化标准器 + 2尊1:1实测结构光三维扫描真品 (GLTF 1K PBR 贴图)
 * 2. 博物馆级暗调金碧水墨屏风背景，彻底解决前景青瓷/白瓷过曝问题，凸显双层清漆 (Clearcoat) 玉质感
 * 3. 四大展览模式：【单器360°精鉴台】、【3D全景九柜博物馆漫游】、【X光胎骨可调剖面透视】、【策展人语音自动巡礼】
 * 4. 实时 PBR 光学实验室：支持动态调节釉层清漆厚度 (Clearcoat)、微晶粗糙度 (Roughness)、折射率 (IOR) 与剖切深度
 * 5. 器物声学共振示波器 (叩瓷听音实时声波曲线) + 馆藏级带印章水印 3D 快照导出
 */

let scene, camera, renderer, currentGroup;
let pedestalGroup, hallGroup, particleSystem, dimensionGroup;
let lightMain, lightFill, lightRim, ambientLight, topSpotLight;
let envMapTexture = null;
let clipPlane = null;
let clipOffset = 0.0;

// 真实 3D 空间与物理环境场景
let realisticRoomGroup = null;
let currentRoomEnv = 'studio'; // 'studio' | 'palace' | 'kiln'
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
let useScannedOriginalTex = true; // 针对第7、8号实测扫描模型，默认展示真实扫描纹理，也可切换PBR釉色试烧

// 实时可调 PBR 参数覆盖
let customPbrOverride = {
    clearcoat: null,
    roughness: null,
    ior: null
};

// 实测扫描 GLTF 模型缓存
const scannedModelCache = {};

// 相机平滑插值目标
let camPosTarget = { x: 0, y: 0.95, z: 3.55 };
let camLookTarget = { x: 0, y: -0.05, z: 0 };
let camLookCurrent = { x: 0, y: -0.05, z: 0 };
let userOrbitAngles = { theta: 0, phi: 0.26, radius: 3.55 };
let isUserDragging = false;
let vesselVibration = 0;

// 九大馆藏古瓷器物数据字典与 3D 空间解剖锚点 (7尊程序化 + 2尊实测3D扫描)
const porcelainModelsData = [
    {
        "name": "宋官窑·八方贯耳弦纹瓶",
        "english": "Song Imperial Guan Octagonal Vase with Tubular Handles",
        "period": "南宋 (1127–1279)",
        "kiln": "杭州修内司官窑 / 郊坛下官窑",
        "dimensions": "通高 22.8 cm · 口径 5.4 cm · 足径 7.2 cm",
        "desc": "仿商周青铜礼器造型，瓶身八方起棱，口颈两侧各设一垂直中空贯耳，腹部饰凸起弦纹。胎骨含铁高达5%，呈现典型“紫口铁足”，釉厚如堆脂，蟹爪纹与金丝铁线纵横交织，尽显南宋宫廷崇尚的穆重典雅。",
        "features": [
            "八方折棱折光",
            "双贯耳穿带结构",
            "三道凸起弦纹",
            "紫口铁足露胎"
        ],
        "defaultGlaze": "tianqing",
        "hotspots": [
            {
                "label": "紫口 · 口沿釉薄透紫褐胎",
                "pos": [
                    0.32,
                    0.96,
                    0.1
                ],
                "view": "top"
            },
            {
                "label": "双贯耳 · 仿古青铜穿系礼制",
                "pos": [
                    -0.36,
                    0.65,
                    0.08
                ],
                "view": "front"
            },
            {
                "label": "蟹爪冰裂 · 厚釉多层热应力纹",
                "pos": [
                    0.58,
                    -0.25,
                    0.25
                ],
                "view": "front"
            },
            {
                "label": "铁足 · 凤凰山紫金土露胎圈足",
                "pos": [
                    0.28,
                    -1.12,
                    0.15
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 2420
    },
    {
        "name": "宋汝窑·天青椭圆四足水仙盆",
        "english": "Northern Song Ru Kiln Sky-Blue Oval Narcissus Basin",
        "period": "北宋晚期 (徽宗宣和年间)",
        "kiln": "河南宝丰清凉寺汝官窑",
        "dimensions": "高 6.7 cm · 口横 23.1 cm · 口纵 16.4 cm",
        "desc": "传世孤品级形制。盆体呈温雅椭圆形，广口卷唇，浅腹平底，下承四只雕琢精妙的如意云头矮足。玛瑙末入釉，通体满施雨过天青色釉，温润如羊脂美玉，底部留有细小如针的芝麻支钉痕。",
        "features": [
            "雨过天青玛瑙釉",
            "四如意云头短足",
            "椭圆卷唇广口",
            "五枚芝麻支钉痕"
        ],
        "defaultGlaze": "tianqing",
        "hotspots": [
            {
                "label": "卷唇敞口 · 温润凝脂玉质感",
                "pos": [
                    0.95,
                    0.18,
                    0.2
                ],
                "view": "top"
            },
            {
                "label": "如意云头足 · 四足稳承平底",
                "pos": [
                    0.68,
                    -0.32,
                    0.42
                ],
                "view": "bottom"
            },
            {
                "label": "芝麻支钉 · 满釉裹足支烧绝技",
                "pos": [
                    0,
                    -0.28,
                    0
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 2580
    },
    {
        "name": "宋定窑·白釉划花莲纹梅瓶",
        "english": "Northern Song Ding Kiln Carved Lotus White Meiping",
        "period": "北宋 (960–1127)",
        "kiln": "河北曲阳涧磁村定窑",
        "dimensions": "通高 31.5 cm · 口径 4.2 cm · 足径 9.8 cm",
        "desc": "小口翻唇，短颈丰肩，修腹渐收至胫部微扬，线条挺拔俊秀。胎骨洁白坚致，击之声如清磬；釉呈温润象牙白，口沿施鎏金铜扣（芒口镶扣），腹部以竹刀深刻流利缠枝莲纹，积釉处隐现“蜡泪痕”。",
        "features": [
            "芒口镶鎏金铜扣",
            "象牙白温润暖釉",
            "竹刀深刻缠枝莲",
            "丰肩修腹仕女姿"
        ],
        "defaultGlaze": "dingbai",
        "hotspots": [
            {
                "label": "芒口金扣 · 覆烧工艺皇家镶金口",
                "pos": [
                    0.24,
                    0.98,
                    0.1
                ],
                "view": "top"
            },
            {
                "label": "丰肩刻花 · 半刀泥深刻莲瓣浮雕",
                "pos": [
                    0.64,
                    0.38,
                    0.22
                ],
                "view": "front"
            },
            {
                "label": "牙白泪痕 · 天然石灰釉垂流聚痕",
                "pos": [
                    -0.46,
                    -0.32,
                    0.25
                ],
                "view": "front"
            }
        ],
        "acousticFreq": 2850
    },
    {
        "name": "宋哥窑·金丝铁线胆式瓶",
        "english": "Song Ge Kiln Pear-Shaped Bottle with Gold-and-Iron Crackles",
        "period": "宋代 (960–1279)",
        "kiln": "传世哥窑",
        "dimensions": "通高 20.3 cm · 口径 3.8 cm · 足径 6.5 cm",
        "desc": "直口修颈，腹部下垂饱满如悬胆，重心沉稳。釉层肥厚失透如凝脂酥油，通身布满天然开裂的“金丝铁线”——主干粗裂纹呈深铁黑色，次生细密网纹呈金黄色，百极碎纹极富文人苍古画意。",
        "features": [
            "悬胆垂腹优美弧线",
            "大开片深黑如铁",
            "细网纹金黄如丝",
            "酥油光泽温润内敛"
        ],
        "defaultGlaze": "fenqing",
        "hotspots": [
            {
                "label": "直口修颈 · 紫口微露铁胎骨",
                "pos": [
                    0.22,
                    1.02,
                    0.08
                ],
                "view": "top"
            },
            {
                "label": "金丝铁线 · 双重染色应力裂网",
                "pos": [
                    0.68,
                    -0.38,
                    0.2
                ],
                "view": "front"
            },
            {
                "label": "铁足圈足 · 垫饼托烧规整修刀",
                "pos": [
                    0.32,
                    -1.08,
                    0.12
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 2180
    },
    {
        "name": "宋钧窑·玫瑰紫海棠出戟尊",
        "english": "Northern Song Jun Kiln Rose-Purple Four-Flanged Zun",
        "period": "北宋晚期至金代",
        "kiln": "河南禹州钧台官窑",
        "dimensions": "通高 24.5 cm · 口径 18.2 cm · 足径 12.0 cm",
        "desc": "北宋皇家陈设重器。器身呈四瓣海棠花形，喇叭敞口，颈、腹、足四面各附镂空齿状出戟。釉料含微量氧化铜，经1300℃还原焰窑变，“入窑一色，出窑万彩”，玫瑰紫与海棠红交融绚烂如晚霞。",
        "features": [
            "四瓣海棠花造型",
            "四方齿状出戟",
            "铜还原玫瑰紫窑变",
            "蚯蚓走泥纹肌理"
        ],
        "defaultGlaze": "junhong",
        "hotspots": [
            {
                "label": "海棠折沿 · 四瓣花式喇叭大敞口",
                "pos": [
                    0.72,
                    0.92,
                    0.2
                ],
                "view": "top"
            },
            {
                "label": "齿状出戟 · 追摹商周青铜礼器威仪",
                "pos": [
                    0.68,
                    -0.1,
                    0
                ],
                "view": "front"
            },
            {
                "label": "玫瑰紫霞 · 氧化铜高温胶体粒子窑变",
                "pos": [
                    -0.52,
                    -0.22,
                    0.38
                ],
                "view": "front"
            }
        ],
        "acousticFreq": 2310
    },
    {
        "name": "宋建窑·兔毫曜变天目斗茶盏",
        "english": "Song Jian Kiln Hare's Fur & Yohen Tenmoku Tea Bowl",
        "period": "宋代 (960–1279)",
        "kiln": "福建建阳水吉建窑",
        "dimensions": "高 7.2 cm · 口径 12.5 cm · 足径 4.0 cm",
        "desc": "两宋点茶、斗茶之圣器。口沿设束口注汤槽，深腹斜收，下腹垂积釉泪，浅圈足露粗犷黑铁胎。高铁黑釉在窑火中析出金银兔毫结晶与曜变星斑，最宜衬托击拂如雪的白色茶汤。",
        "features": [
            "束口防溢注汤槽",
            "曜变星斑与银兔毫",
            "下腹垂珠积釉泪",
            "含铁8%重铁胎底"
        ],
        "defaultGlaze": "jianhei",
        "hotspots": [
            {
                "label": "束口暗槽 · 斗茶注汤咬盏定胜负",
                "pos": [
                    0.85,
                    0.35,
                    0.15
                ],
                "view": "top"
            },
            {
                "label": "曜变兔毫 · 铁氧化物微晶干涉光晕",
                "pos": [
                    0.15,
                    -0.15,
                    0.35
                ],
                "view": "top"
            },
            {
                "label": "铁胎浅足 · 建阳水吉高铁红土胎骨",
                "pos": [
                    0.28,
                    -0.72,
                    0.1
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 1980
    },
    {
        "name": "明宣德·青花缠枝莲纹玉壶春瓶",
        "english": "Ming Xuande Blue-and-White Lotus Yuhuchun Vase",
        "period": "明宣德 (1426–1435)",
        "kiln": "江西景德镇御器厂",
        "dimensions": "通高 28.5 cm · 口径 8.2 cm · 足径 10.4 cm",
        "desc": "撇口细颈，垂腹丰满如水滴，圈足外撇，通体曲线呈柔美S型。釉面肥厚泛鸭蛋青，以进口“苏麻离青”钴料分层绘蕉叶纹、如意云头及缠枝宝相莲纹，浓重处凝聚黑褐色铁锈结晶斑，深沉雄健。",
        "features": [
            "曼妙S型水滴曲线",
            "进口苏麻离青浓艳",
            "深入胎骨铁锈结晶斑",
            "五段式皇家官样纹饰"
        ],
        "defaultGlaze": "qinghua",
        "hotspots": [
            {
                "label": "撇口蕉叶纹 · 颈部挺拔饰青花蕉叶",
                "pos": [
                    0.35,
                    0.85,
                    0.15
                ],
                "view": "front"
            },
            {
                "label": "苏麻离青 · 高铁低锰进口钴料铁锈斑",
                "pos": [
                    0.68,
                    -0.32,
                    0.25
                ],
                "view": "front"
            },
            {
                "label": "仰莲圈足 · 景德镇麻仓土二元配方白胎",
                "pos": [
                    0.38,
                    -1.08,
                    0.12
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 2720
    },
    {
        "name": "宋景德镇窑·影青撇口净水瓶 [3D实物扫描]",
        "english": "Song Jingdezhen Qingbai Flared Bottle (3D Photogrammetry)",
        "period": "宋代 (960–1279)",
        "kiln": "江西景德镇湖田窑 / 湘湖窑",
        "dimensions": "通高 21.5 cm · 口径 4.8 cm · 足径 6.2 cm",
        "desc": "基于真实宋代古瓷高精度多视角摄影测量 3D 扫描重构。细长秀丽瓶颈，小巧撇口翻唇，腹下微垂，胎薄如纸，釉白微泛青绿，通体带有古瓷自然使用磨损微痕与岁月温润包浆。",
        "features": [
            "高精 3D 真实扫描重构",
            "1K PBR 物理双层微晶釉",
            "天然老气使用微痕",
            "薄胎透光影青光泽"
        ],
        "defaultGlaze": "tianqing",
        "isScanned": true,
        "scannedKey": "vase_01",
        "hotspots": [
            {
                "label": "撇口小沿 · 极薄胎体透光微润",
                "pos": [
                    0.18,
                    0.95,
                    0.08
                ],
                "view": "top"
            },
            {
                "label": "修腹渐敛 · 真实扫描高精曲度",
                "pos": [
                    0.38,
                    -0.15,
                    0.2
                ],
                "view": "front"
            },
            {
                "label": "平削圈足 · 垫饼支烧露纯白胎",
                "pos": [
                    0.22,
                    -0.98,
                    0.12
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 2490
    },
    {
        "name": "宋元金石·铁锈花修身赏瓶 [3D实物扫描]",
        "english": "Song-Yuan Iron-Rust Slender Vase (3D Photogrammetry)",
        "period": "宋元之交 (13世纪)",
        "kiln": "磁州窑系 / 山西介休名窑",
        "dimensions": "通高 23.2 cm · 口径 5.2 cm · 足径 7.0 cm",
        "desc": "3D 扫描真实古代陶瓷赏瓶。胎质致密坚实，通体施深褐铁红结晶彩釉，表面析出自然风化的铁锈结晶斑点，具有浓厚金石苍古韵味与文人案头清供之风骨。",
        "features": [
            "高精 3D 表面几何捕捉",
            "铁锈红自然结晶斑点",
            "古法柴窑氧化焰烧造",
            "深沉内敛金石质感"
        ],
        "defaultGlaze": "fenqing",
        "isScanned": true,
        "scannedKey": "vase_02",
        "hotspots": [
            {
                "label": "圆唇直口 · 古拙洗练刀工",
                "pos": [
                    0.22,
                    0.98,
                    0.1
                ],
                "view": "top"
            },
            {
                "label": "铁斑结晶 · 铁氧化物自然析出相",
                "pos": [
                    0.45,
                    0.12,
                    0.25
                ],
                "view": "front"
            },
            {
                "label": "敦厚圈足 · 刮釉露胎深褐色底",
                "pos": [
                    0.28,
                    -0.95,
                    0.15
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 2360
    },
    {
        "name": "宋元名品·龙泉青瓷双系圆腹罐 [3D实物扫描]",
        "english": "Song-Yuan Longquan Celadon Two-Lug Jar (3D Photogrammetry)",
        "period": "南宋至元代 (12–13世纪)",
        "kiln": "浙江龙泉大窑 / 金村窑",
        "dimensions": "通高 16.8 cm · 口径 8.5 cm · 腹径 15.2 cm",
        "desc": "3D 扫描龙泉青瓷经典双系圆腹贮酒茶罐。圆唇直口，丰肩鼓腹，肩部左右各对称附一道泥条形管系，通体施厚润粉青石灰碱釉，釉色青碧如翠玉，肩腹起棱处微露白痕（出筋）。",
        "features": [
            "对称双系穿带结构",
            "圆润饱满丰肩鼓腹",
            "出筋露白美学细节",
            "高精法线捕捉微观起伏"
        ],
        "defaultGlaze": "fenqing",
        "isScanned": true,
        "scannedKey": "vase_03",
        "hotspots": [
            {
                "label": "直口宽口 · 盛装贮藏规整修胎",
                "pos": [
                    0.38,
                    0.65,
                    0.15
                ],
                "view": "top"
            },
            {
                "label": "双系系耳 · 丝绢绳索穿结结构",
                "pos": [
                    -0.62,
                    0.32,
                    0.1
                ],
                "view": "front"
            },
            {
                "label": "出筋露白 · 釉薄处自然显露骨力",
                "pos": [
                    0.65,
                    -0.15,
                    0.25
                ],
                "view": "front"
            }
        ],
        "acousticFreq": 2240
    },
    {
        "name": "明宣德·洁白釉修身玉壶春长颈瓶 [3D实物扫描]",
        "english": "Ming Xuande Pure White Slender Bottle (3D Photogrammetry)",
        "period": "明代 (1368–1644)",
        "kiln": "江西景德镇御窑厂 / 德化窑",
        "dimensions": "通高 24.5 cm · 口径 4.5 cm · 足径 6.8 cm",
        "desc": "真实明代经典玉壶春修长造形 3D 摄影测量模型。器身修长拔萃，撇口长颈，垂腹稳重，线条流畅似仕女出尘。通身施肥厚洁白透明釉，微泛象牙暖色，极富明代御用单色白瓷静穆超拔之神髓。",
        "features": [
            "修长挺拔S型黄金比例",
            "纯净洁白失透厚釉",
            "高精度亚毫米级网格",
            "宫廷陈设插花雅器"
        ],
        "defaultGlaze": "dingbai",
        "isScanned": true,
        "scannedKey": "vase_04",
        "hotspots": [
            {
                "label": "细长挺秀瓶颈 · 优美提拉曲线",
                "pos": [
                    0.15,
                    0.82,
                    0.1
                ],
                "view": "front"
            },
            {
                "label": "垂腹温润 · 羊脂凝脂反光质感",
                "pos": [
                    0.52,
                    -0.32,
                    0.22
                ],
                "view": "front"
            },
            {
                "label": "微撇圈足 · 淘洗极细高岭胎骨",
                "pos": [
                    0.25,
                    -1.05,
                    0.12
                ],
                "view": "bottom"
            }
        ],
        "acousticFreq": 2680
    },
    {
        "name": "汉唐溯源·古拙双耳弦纹汲水陶壶 [3D实物扫描]",
        "english": "Han-Tang Ancient Pottery Two-Lug Amphora (3D Photogrammetry)",
        "period": "汉唐之交 · 华夏陶瓷源头",
        "kiln": "华夏北方古陶窑场",
        "dimensions": "通高 20.8 cm · 口径 6.0 cm · 足径 7.5 cm",
        "desc": "高精度扫描华夏古代陶器标准器。胎质含砂坚韧，表面留有泥条盘筑与旋转修削的原始旋纹，两侧设高拱桥形泥条双耳。无釉露素胎，经历千百年岁月地下土壤微矿物置换，展现华夏泥火艺术源头之苍茫拙朴。",
        "features": [
            "无釉原始素陶矿物包浆",
            "古法泥条盘筑手工弦纹",
            "粗犷苍古汉唐风骨",
            "真实微观风化粗糙度"
        ],
        "defaultGlaze": "dingbai",
        "isScanned": true,
        "scannedKey": "vase_05",
        "hotspots": [
            {
                "label": "粗朴盘口 · 早期先民汲水器型",
                "pos": [
                    0.22,
                    0.95,
                    0.1
                ],
                "view": "top"
            },
            {
                "label": "拱形双耳 · 原始系绳汲水受力点",
                "pos": [
                    -0.58,
                    0.42,
                    0.08
                ],
                "view": "front"
            },
            {
                "label": "手工旋纹 · 轮盘旋转留下的远古指印",
                "pos": [
                    0.55,
                    -0.22,
                    0.28
                ],
                "view": "front"
            }
        ],
        "acousticFreq": 1750
    }
];

// 经典东方古陶瓷釉色 PBR 参数字典
const glazePalettes = {
    tianqing: {
        name: '雨过天青',
        desc: '汝官窑典型色，玛瑙入釉，温润如羊脂美玉',
        color: 0x8bb6be,
        emissive: 0x051316,
        roughness: 0.14,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        ior: 1.54,
        reflectivity: 0.75
    },
    fenqing: {
        name: '粉青如玉',
        desc: '南宋龙泉与修内司官窑代表，青翠柔和，丰润如脂',
        color: 0x7cb099,
        emissive: 0x04120b,
        roughness: 0.16,
        metalness: 0.03,
        clearcoat: 0.96,
        clearcoatRoughness: 0.07,
        ior: 1.53,
        reflectivity: 0.70
    },
    yuebai: {
        name: '月白莹霜',
        desc: '月白微泛冷青，如皓月寒霜，冰清玉洁',
        color: 0xd0e0e5,
        emissive: 0x0a1114,
        roughness: 0.12,
        metalness: 0.02,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        ior: 1.55,
        reflectivity: 0.78
    },
    dingbai: {
        name: '定窑牙白',
        desc: '北宋曲阳定窑象牙白，泛暖玉微黄之光，内敛温雅',
        color: 0xefe7d6,
        emissive: 0x120f0a,
        roughness: 0.19,
        metalness: 0.02,
        clearcoat: 0.88,
        clearcoatRoughness: 0.10,
        ior: 1.50,
        reflectivity: 0.62
    },
    junhong: {
        name: '玫瑰紫变',
        desc: '禹州钧官窑铜还原窑变，红紫蓝交融如晚霞流云',
        color: 0xb85a88,
        emissive: 0x180511,
        roughness: 0.15,
        metalness: 0.08,
        clearcoat: 0.98,
        clearcoatRoughness: 0.06,
        ior: 1.58,
        reflectivity: 0.76
    },
    jianhei: {
        name: '建盏乌金',
        desc: '建阳水吉窑高铁黑釉，析出金银兔毫与曜变星斑',
        color: 0x262223,
        emissive: 0x050406,
        roughness: 0.22,
        metalness: 0.38,
        clearcoat: 0.94,
        clearcoatRoughness: 0.10,
        ior: 1.65,
        reflectivity: 0.85
    },
    qinghua: {
        name: '幽菁青花',
        desc: '明宣德鸭蛋青白釉底，苏麻离青浓艳深沉带铁锈斑',
        color: 0xedf4f7,
        emissive: 0x070d12,
        roughness: 0.12,
        metalness: 0.03,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        ior: 1.54,
        reflectivity: 0.75
    }
};

const textureCache = {};

/**
 * 0.1 宋代青石板地面贴图
 */
function getRealisticStoneFloorTexture() {
    if (textureCache.stoneFloor) return textureCache.stoneFloor;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#182126';
        ctx.fillRect(0, 0, 512, 512);

        const rows = 4;
        const cols = 2;
        const rh = 512 / rows;
        const cw = 512 / cols;

        for (let r = 0; r < rows; r++) {
            const offset = (r % 2) * (cw / 2);
            for (let c = -1; c <= cols; c++) {
                const x = c * cw + offset;
                const y = r * rh;
                const toneShift = (Math.sin(r * 3.7 + c * 2.1) * 6);
                const rVal = Math.max(14, Math.floor(26 + toneShift));
                const gVal = Math.max(20, Math.floor(35 + toneShift));
                const bVal = Math.max(24, Math.floor(42 + toneShift));
                ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
                ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

                for (let i = 0; i < 40; i++) {
                    const px = x + 4 + Math.random() * (cw - 8);
                    const py = y + 4 + Math.random() * (rh - 8);
                    const pr = 1 + Math.random() * 3.2;
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(212, 175, 106, 0.03)' : 'rgba(0, 0, 0, 0.12)';
                    ctx.beginPath();
                    ctx.arc(px, py, pr, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.strokeStyle = '#0c1114';
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
 * 0.2 故宫墨黑金砖地面贴图
 */
function getRealisticGoldBrickTexture() {
    if (textureCache.goldBrick) return textureCache.goldBrick;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0b0e12';
        ctx.fillRect(0, 0, 512, 512);

        const size = 256;
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                const x = c * size;
                const y = r * size;
                ctx.fillStyle = (r + c) % 2 === 0 ? '#11161c' : '#0c1014';
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

                const grad = ctx.createLinearGradient(x, y, x + size, y + size);
                grad.addColorStop(0, 'rgba(212, 175, 106, 0.06)');
                grad.addColorStop(0.5, 'rgba(139, 194, 206, 0.03)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.16)');
                ctx.fillStyle = grad;
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

                ctx.strokeStyle = '#282015';
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
 * 0.3 御窑粗粝耐火青砖地面贴图
 */
function getRealisticKilnBrickTexture() {
    if (textureCache.kilnBrick) return textureCache.kilnBrick;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#221512';
        ctx.fillRect(0, 0, 512, 512);

        for (let r = 0; r < 6; r++) {
            const rh = 512 / 6;
            const offset = (r % 2) * 64;
            for (let c = -1; c < 5; c++) {
                const cw = 128;
                const x = c * cw + offset;
                const y = r * rh;
                ctx.fillStyle = (c + r) % 3 === 0 ? '#331e19' : '#261511';
                ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

                for (let i = 0; i < 30; i++) {
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 110, 35, 0.06)' : 'rgba(0, 0, 0, 0.25)';
                    ctx.fillRect(x + Math.random() * cw, y + Math.random() * rh, 2 + Math.random() * 4, 2 + Math.random() * 3);
                }
                ctx.strokeStyle = '#120705';
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
 * 0.4 宋代三折紫檀屏风 · 玄青泥金千里江山夜宴画心
 * (采用深邃玄青古绢底色与泥金青绿山水，避免浅白背景过曝吃掉前景瓷器轮廓，极大提升国宝级视觉对比度！)
 */
function getScreenPaintingTexture() {
    if (textureCache.screenPainting) return textureCache.screenPainting;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // 深邃宋代磁青/玄青描金绢本基底
        const silkGrad = ctx.createLinearGradient(0, 0, 0, 1024);
        silkGrad.addColorStop(0.0, '#121b22');
        silkGrad.addColorStop(0.45, '#18242e');
        silkGrad.addColorStop(0.8, '#1d2932');
        silkGrad.addColorStop(1.0, '#11181f');
        ctx.fillStyle = silkGrad;
        ctx.fillRect(0, 0, 1024, 1024);

        // 绢本经纬丝光暗纹
        ctx.strokeStyle = 'rgba(212, 175, 106, 0.035)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 1024; i += 10) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
        }

        // 一轮泥金皓月
        const moonGrad = ctx.createRadialGradient(280, 210, 8, 280, 210, 110);
        moonGrad.addColorStop(0.0, 'rgba(240, 213, 156, 0.35)');
        moonGrad.addColorStop(0.45, 'rgba(197, 160, 89, 0.12)');
        moonGrad.addColorStop(1.0, 'rgba(197, 160, 89, 0.0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(280, 210, 110, 0, Math.PI * 2);
        ctx.fill();

        // 上部泥金瘦金体意境题跋與朱砂御印
        ctx.font = '26px "Noto Serif SC", "Songti SC", "STKaiti", serif';
        ctx.fillStyle = 'rgba(229, 200, 136, 0.68)';
        ctx.fillText('雨 过 天 青 云 破 处', 650, 130);
        ctx.font = '16px "Noto Serif SC", "Songti SC", serif';
        ctx.fillStyle = 'rgba(143, 184, 192, 0.52)';
        ctx.fillText('宣和殿御赏 · 千里江山泥金屏', 670, 168);

        // 朱文印章两方
        ctx.fillStyle = '#9e2a24';
        ctx.fillRect(650, 185, 24, 24);
        ctx.fillStyle = '#f5efe4';
        ctx.font = '14px serif';
        ctx.fillText('御', 655, 202);

        ctx.fillStyle = '#9e2a24';
        ctx.fillRect(682, 185, 24, 24);
        ctx.fillStyle = '#f5efe4';
        ctx.fillText('赏', 687, 202);

        // 千里江山青绿叠翠与泥金勾勒远山
        const drawMountain = (baseY, amp, seed, fillColor, strokeGold) => {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.moveTo(0, 1024);
            ctx.lineTo(0, baseY);
            for (let x = 0; x <= 1024; x += 12) {
                const y = baseY - Math.sin((x + seed) * 0.005) * amp - Math.cos((x * 2 + seed) * 0.008) * (amp * 0.42);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(1024, baseY);
            ctx.lineTo(1024, 1024);
            ctx.closePath();
            ctx.fill();

            if (strokeGold) {
                ctx.strokeStyle = strokeGold;
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                for (let x = 0; x <= 1024; x += 12) {
                    const y = baseY - Math.sin((x + seed) * 0.005) * amp - Math.cos((x * 2 + seed) * 0.008) * (amp * 0.42);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        };

        drawMountain(410, 115, 120, 'rgba(42, 74, 84, 0.35)', 'rgba(212, 175, 106, 0.25)');
        drawMountain(510, 145, 360, 'rgba(32, 58, 66, 0.52)', 'rgba(229, 200, 136, 0.38)');
        drawMountain(630, 165, 780, 'rgba(20, 36, 44, 0.72)', 'rgba(197, 160, 89, 0.45)');

        // 中景天青流云柔雾带
        const fogGrad = ctx.createLinearGradient(0, 520, 0, 740);
        fogGrad.addColorStop(0.0, 'rgba(124, 170, 180, 0.0)');
        fogGrad.addColorStop(0.5, 'rgba(124, 170, 180, 0.14)');
        fogGrad.addColorStop(1.0, 'rgba(124, 170, 180, 0.0)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 520, 1024, 220);

        // 双层泥金锦边
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
        ctx.lineWidth = 4;
        ctx.strokeRect(26, 26, 972, 972);
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
 * 0.5 明清老红木/大叶紫檀木纹贴图
 */
function getRosewoodTexture() {
    if (textureCache.rosewood) return textureCache.rosewood;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#26110c';
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 512; i += 2) {
            const alpha = 0.08 + Math.random() * 0.15;
            ctx.strokeStyle = Math.random() > 0.4 ? `rgba(14, 5, 3, ${alpha})` : `rgba(64, 26, 16, ${alpha})`;
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

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        textureCache.rosewood = tex;
        return tex;
    } catch (e) {
        return null;
    }
}

/**
 * 0.6 几案织锦席垫贴图
 */
function getBrocadeMatTexture() {
    if (textureCache.brocadeMat) return textureCache.brocadeMat;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#14222c';
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = '#c5a059';
        ctx.lineWidth = 8;
        ctx.strokeRect(24, 24, 464, 464);
        ctx.lineWidth = 2.5;
        ctx.strokeRect(38, 38, 436, 436);

        ctx.save();
        ctx.translate(256, 256);
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.42)';
        ctx.lineWidth = 2;
        for (let r = 0; r < 8; r++) {
            ctx.rotate((Math.PI * 2) / 8);
            ctx.beginPath();
            ctx.ellipse(65, 0, 48, 22, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(197, 160, 89, 0.32)';
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
 * 0.7 器物足底真实接触软投影贴图
 */
function getContactShadowTexture() {
    if (textureCache.contactShadow) return textureCache.contactShadow;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
        grad.addColorStop(0.0, 'rgba(4, 3, 2, 0.96)');
        grad.addColorStop(0.32, 'rgba(6, 5, 4, 0.75)');
        grad.addColorStop(0.68, 'rgba(6, 5, 4, 0.25)');
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
 * 0.8 宋代直棂轩窗透光纹理
 */
function getWindowLatticeTexture() {
    if (textureCache.windowLattice) return textureCache.windowLattice;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const paperGrad = ctx.createLinearGradient(0, 0, 512, 512);
        paperGrad.addColorStop(0.0, '#c8d6d9');
        paperGrad.addColorStop(0.6, '#9cb4bc');
        paperGrad.addColorStop(1.0, '#728d96');
        ctx.fillStyle = paperGrad;
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = 'rgba(32, 48, 44, 0.35)';
        for (let b = 0; b < 4; b++) {
            const bx = 85 + b * 115;
            ctx.fillRect(bx, 0, 10, 512);
            for (let l = 0; l < 8; l++) {
                const ly = l * 65 + 30;
                ctx.beginPath();
                ctx.ellipse(bx + 24, ly, 26, 5, 0.45, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(bx - 24, ly + 20, 26, 5, -0.45, 0, Math.PI * 2);
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
        grad.addColorStop(0.0, 'rgba(220, 235, 242, 0.78)');
        grad.addColorStop(0.4, 'rgba(180, 210, 222, 0.32)');
        grad.addColorStop(1.0, 'rgba(180, 210, 222, 0.0)');
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
function createStudioEnvironment() {
    if (envMapTexture) return envMapTexture;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
        baseGrad.addColorStop(0.0, '#1c2a35');
        baseGrad.addColorStop(0.45, '#101820');
        baseGrad.addColorStop(0.55, '#090e13');
        baseGrad.addColorStop(1.0, '#141e26');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, 512, 512);

        // 顶部大型环形博物馆柔光箱
        const topLight = ctx.createRadialGradient(256, 70, 8, 256, 70, 210);
        topLight.addColorStop(0, 'rgba(255, 252, 242, 0.96)');
        topLight.addColorStop(0.4, 'rgba(200, 232, 240, 0.45)');
        topLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topLight;
        ctx.fillRect(0, 0, 512, 320);

        // 左侧宋代轩窗暖白格栅天光条 (在瓷器腹部形成玉质竖向高光带)
        ctx.fillStyle = 'rgba(255, 248, 235, 0.90)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(110 + i * 26, 110, 16, 180);
        }

        // 右侧天青色漫射辅光窗
        const sideLight = ctx.createRadialGradient(410, 210, 12, 410, 210, 130);
        sideLight.addColorStop(0, 'rgba(168, 218, 228, 0.85)');
        sideLight.addColorStop(0.6, 'rgba(124, 170, 180, 0.28)');
        sideLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sideLight;
        ctx.fillRect(280, 40, 232, 340);

        // 鎏金环境地平线微反射
        const goldBand = ctx.createLinearGradient(0, 280, 0, 330);
        goldBand.addColorStop(0, 'rgba(197, 160, 89, 0)');
        goldBand.addColorStop(0.5, 'rgba(197, 160, 89, 0.32)');
        goldBand.addColorStop(1, 'rgba(197, 160, 89, 0)');
        ctx.fillStyle = goldBand;
        ctx.fillRect(0, 280, 512, 50);

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

    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = 'rgb(200, 200, 200)';
    bCtx.fillRect(0, 0, 512, 512);

    // 微表面橘皮棕眼与玉脂云絮噪点
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 4 + Math.random() * 16;
        cCtx.fillStyle = i % 2 === 0 ? 'rgba(232, 244, 246, 0.16)' : 'rgba(210, 228, 232, 0.12)';
        cCtx.beginPath(); cCtx.arc(x, y, r, 0, Math.PI * 2); cCtx.fill();

        bCtx.fillStyle = i % 2 === 0 ? 'rgba(218, 218, 218, 0.2)' : 'rgba(178, 178, 178, 0.2)';
        bCtx.beginPath(); bCtx.arc(x, y, r * 0.8, 0, Math.PI * 2); bCtx.fill();
    }

    // 确定性伪随机生成 Voronoi 金丝铁线裂网
    let seed = 108;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    const nodes = [];
    const gridN = 8;
    const cellW = 512 / gridN;
    for (let gx = 0; gx < gridN; gx++) {
        for (let gy = 0; gy < gridN; gy++) {
            nodes.push({
                x: (gx + 0.18 + rand() * 0.64) * cellW,
                y: (gy + 0.18 + rand() * 0.64) * cellW
            });
        }
    }

    cCtx.lineCap = bCtx.lineCap = 'round';
    cCtx.lineJoin = bCtx.lineJoin = 'round';

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (d < 92) {
                const mx = (nodes[i].x + nodes[j].x) * 0.5 + (rand() - 0.5) * 16;
                const my = (nodes[i].y + nodes[j].y) * 0.5 + (rand() - 0.5) * 16;

                // 铁线主脉
                cCtx.strokeStyle = 'rgba(38, 30, 24, 0.58)';
                cCtx.lineWidth = 1.6;
                cCtx.beginPath();
                cCtx.moveTo(nodes[i].x, nodes[i].y);
                cCtx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
                cCtx.stroke();

                bCtx.strokeStyle = 'rgb(55, 55, 55)';
                bCtx.lineWidth = 2.4;
                bCtx.beginPath();
                bCtx.moveTo(nodes[i].x, nodes[i].y);
                bCtx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
                bCtx.stroke();

                // 金丝次级细网
                if (rand() > 0.32) {
                    const bx = mx + (rand() - 0.5) * 58;
                    const by = my + (rand() - 0.5) * 58;
                    cCtx.strokeStyle = 'rgba(186, 136, 62, 0.52)';
                    cCtx.lineWidth = 0.95;
                    cCtx.beginPath();
                    cCtx.moveTo(mx, my);
                    cCtx.lineTo(bx, by);
                    cCtx.stroke();

                    bCtx.strokeStyle = 'rgb(105, 105, 105)';
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

    ctx.strokeStyle = 'rgb(252, 252, 252)';
    ctx.lineWidth = 3.5;
    for (let row = 0; row < 3; row++) {
        const baseY = 120 + row * 150;
        for (let i = 0; i < 12; i++) {
            const cx = (i / 12) * 512 + 24;
            ctx.beginPath();
            ctx.moveTo(cx - 24, baseY + 45);
            ctx.quadraticCurveTo(cx - 28, baseY - 30, cx, baseY - 55);
            ctx.quadraticCurveTo(cx + 28, baseY - 30, cx + 24, baseY + 45);
            ctx.stroke();

            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, baseY + 40);
            ctx.lineTo(cx, baseY - 40);
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
 * 4. 禹州钧窑玫瑰紫海棠红窑变流体贴图
 */
function getJunYaobianTexture() {
    if (textureCache.junTex) return textureCache.junTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#4a2040');
    grad.addColorStop(0.28, '#8c2d5c');
    grad.addColorStop(0.55, '#5a3b7c');
    grad.addColorStop(0.80, '#6a9ab8');
    grad.addColorStop(1.0, '#3a1a32');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 85; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 40 + Math.random() * 120;
        const g = ctx.createRadialGradient(x, y, 5, x, y, r);
        if (i % 3 === 0) {
            g.addColorStop(0, 'rgba(195, 48, 102, 0.58)');
            g.addColorStop(1, 'rgba(195, 48, 102, 0)');
        } else if (i % 3 === 1) {
            g.addColorStop(0, 'rgba(130, 195, 225, 0.48)');
            g.addColorStop(1, 'rgba(130, 195, 225, 0)');
        } else {
            g.addColorStop(0, 'rgba(95, 35, 120, 0.52)');
            g.addColorStop(1, 'rgba(95, 35, 120, 0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    ctx.strokeStyle = 'rgba(220, 175, 210, 0.42)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (let k = 0; k < 42; k++) {
        let x = Math.random() * 512;
        let y = Math.random() * 480;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
            x += (Math.random() - 0.5) * 32;
            y += 14 + Math.random() * 18;
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

    ctx.fillStyle = '#120f10';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 42; i++) {
        const x = Math.random() * 512;
        const y = 80 + Math.random() * 380;
        const r = 16 + Math.random() * 42;
        const g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, 'rgba(230, 200, 125, 0.88)');
        g.addColorStop(0.35, 'rgba(65, 150, 235, 0.58)');
        g.addColorStop(0.7, 'rgba(115, 65, 185, 0.35)');
        g.addColorStop(1, 'rgba(20, 17, 18, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    for (let i = 0; i < 480; i++) {
        const x = Math.random() * 512;
        const y = 30 + Math.random() * 420;
        const h = 45 + Math.random() * 160;
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(212, 168, 92, 0.82)');
        g.addColorStop(0.5, 'rgba(135, 182, 218, 0.68)');
        g.addColorStop(1, 'rgba(20, 17, 18, 0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.7 + Math.random() * 1.3;
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
 * 6. 明宣德苏麻离青五段式皇家青花缠枝莲纹贴图 (修正 512x512 坐标映射)
 */
function getQinghuaTexture() {
    if (textureCache.qinghuaTex) return textureCache.qinghuaTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ebf2f5';
    ctx.fillRect(0, 0, 512, 512);

    const cobaltMain = 'rgba(20, 54, 118, 0.90)';
    const cobaltLight = 'rgba(52, 96, 168, 0.58)';
    const ironSpot = 'rgba(16, 20, 32, 0.88)';

    const drawBands = (yArr) => {
        ctx.strokeStyle = cobaltMain;
        ctx.lineWidth = 3.5;
        yArr.forEach(y => {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
        });
    };
    drawBands([38, 46, 120, 128, 380, 388, 465, 474]);

    // 颈部蕉叶纹
    for (let i = 0; i < 16; i++) {
        const cx = (i + 0.5) * (512 / 16);
        ctx.strokeStyle = cobaltMain;
        ctx.fillStyle = cobaltLight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 12, 119);
        ctx.quadraticCurveTo(cx - 10, 65, cx, 50);
        ctx.quadraticCurveTo(cx + 10, 65, cx + 12, 119);
        ctx.fill();
        ctx.stroke();
    }

    // 主腹部缠枝宝相莲花纹与苏麻离青铁锈结晶斑
    ctx.strokeStyle = cobaltMain;
    ctx.lineWidth = 3.2;
    for (let row = 0; row < 2; row++) {
        const cy = 195 + row * 110;
        ctx.beginPath();
        for (let x = 0; x <= 512; x += 6) {
            const y = cy + Math.sin((x / 512) * Math.PI * 6 + row * Math.PI) * 30;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        for (let col = 0; col < 6; col++) {
            const fx = (col + 0.5) * (512 / 6);
            const fy = cy + Math.sin((fx / 512) * Math.PI * 6 + row * Math.PI) * 18;
            ctx.save();
            ctx.translate(fx, fy);

            for (let p = 0; p < 10; p++) {
                const ang = (p / 10) * Math.PI * 2;
                ctx.save();
                ctx.rotate(ang);
                ctx.fillStyle = cobaltLight;
                ctx.strokeStyle = cobaltMain;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.ellipse(15, 0, 10, 4.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            ctx.fillStyle = cobaltMain;
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = ironSpot;
            for (let s = 0; s < 4; s++) {
                ctx.beginPath();
                ctx.arc((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // 胫部仰莲瓣纹
    for (let i = 0; i < 14; i++) {
        const cx = (i + 0.5) * (512 / 14);
        ctx.strokeStyle = cobaltMain;
        ctx.fillStyle = cobaltLight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 15, 462);
        ctx.quadraticCurveTo(cx, 392, cx + 15, 462);
        ctx.fill();
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.qinghuaTex = tex;
    return tex;
}

/**
 * 生成当前器物与釉色对应的物理材质 (支持实时 PBR 光学调校与动态剖切)
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
        roughness: customPbrOverride.roughness !== null ? customPbrOverride.roughness : cfg.roughness,
        metalness: cfg.metalness,
        clearcoat: customPbrOverride.clearcoat !== null ? customPbrOverride.clearcoat : cfg.clearcoat,
        clearcoatRoughness: cfg.clearcoatRoughness,
        ior: customPbrOverride.ior !== null ? customPbrOverride.ior : cfg.ior,
        reflectivity: cfg.reflectivity,
        envMap: envMapTexture,
        envMapIntensity: 1.45,
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
        matOptions.bumpScale = 0.016;
    }

    if (showCrackle && !['qinghua', 'jianhei'].includes(glazeKey)) {
        const crackle = getCrackleTextureBundle();
        if (!matOptions.map) matOptions.map = crackle.map;
        matOptions.bumpMap = crackle.bumpMap;
        matOptions.bumpScale = 0.013;
    }

    return new THREE.MeshPhysicalMaterial(matOptions);
}

/**
 * 辅助函数：通过控制点生成高密度平滑样条双壁旋转几何体
 */
function createSmoothVesselLathe(outerPts, RadialModFn = null, radialSegments = 64) {
    const fullPts = [...outerPts];
    const wallThickness = 0.038;

    for (let i = outerPts.length - 2; i >= 1; i--) {
        const pt = outerPts[i];
        const innerR = Math.max(0.02, pt.x - wallThickness * (1 + (1 - i / outerPts.length) * 0.45));
        fullPts.push(new THREE.Vector2(innerR, pt.y + 0.02));
    }
    fullPts.push(new THREE.Vector2(0.0, outerPts[0].y + 0.05));

    const spline = new THREE.SplineCurve(fullPts);
    const sampledPoints = spline.getPoints(54);
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
 * 预解析并缓存 `window.SCANNED_MODELS_DATA` 内的两尊 1:1 实测三维扫描 GLTF 真品模型
 */
function preloadScannedGLTFModels() {
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader || !window.SCANNED_MODELS_DATA) return;
    const loader = new THREE.GLTFLoader();
    const keys = ['vase_01', 'vase_02', 'vase_03', 'vase_04', 'vase_05'];

    keys.forEach((key, idx) => {
        if (!window.SCANNED_MODELS_DATA[key] || scannedModelCache[key]) return;
        try {
            const jsonStr = JSON.stringify(window.SCANNED_MODELS_DATA[key]);
            loader.parse(jsonStr, '', (gltf) => {
                if (gltf && gltf.scene) {
                    scannedModelCache[key] = gltf.scene;
                    const modelIndex = 7 + idx;
                    if (currentModelIndex === modelIndex) {
                        loadPorcelainModel(currentModelIndex, true);
                    }
                }
            }, (err) => {
                console.warn(`[3D扫描模型解析提示] ${key}:`, err);
            });
        } catch (e) {
            console.warn(`[3D扫描模型加载异常] ${key}:`, e);
        }
    });
}

/**
 * 构建十二大传世馆藏高精度 3D 模型 (0~6 程序化建模，7~11 实测三维扫描 GLTF 模型)
 */
function buildGeometry(typeIndex, customGlaze = null) {
    const group = new THREE.Group();
    const gKey = customGlaze || currentGlazeIndex;
    const glazeMat = getPorcelainMaterial(gKey, false);
    const tiezuMat = getPorcelainMaterial(gKey, true);
    const activePlanes = (exhibitionMode === 'cutaway' && clipPlane) ? [clipPlane] : [];
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af6a,
        roughness: 0.25,
        metalness: 0.88,
        clippingPlanes: activePlanes
    });

        // 处理第 7 ~ 11 号实测三维扫描 GLTF 文物数字孪生模型
    if (typeIndex >= 7 && typeIndex <= 11) {
        const scanKeyMap = {
            7: 'vase_01',
            8: 'vase_02',
            9: 'vase_03',
            10: 'vase_04',
            11: 'vase_05'
        };
        const sKey = scanKeyMap[typeIndex] || 'vase_01';
        const cachedScene = scannedModelCache[sKey];
        if (cachedScene) {
            const cloned = cachedScene.clone(true);
            const box = new THREE.Box3().setFromObject(cloned);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetHeight = 2.25;
            const scaleFactor = (maxDim > 0) ? (targetHeight / maxDim) : 5.0;
            cloned.scale.set(scaleFactor, scaleFactor, scaleFactor);

            const scaledBox = new THREE.Box3().setFromObject(cloned);
            const center = new THREE.Vector3();
            scaledBox.getCenter(center);
            cloned.position.x = -center.x;
            cloned.position.z = -center.z;
            cloned.position.y = -scaledBox.min.y - 1.125;

            cloned.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = child.receiveShadow = true;
                    if (useScannedOriginalTex && child.material && !customGlaze) {
                        const origMat = child.material.clone();
                        origMat.side = THREE.DoubleSide;
                        origMat.envMap = envMapTexture;
                        origMat.envMapIntensity = 1.25;
                        origMat.wireframe = isWireframe;
                        origMat.clippingPlanes = activePlanes;
                        origMat.clipShadows = true;
                        child.material = origMat;
                    } else {
                        child.material = glazeMat;
                    }
                }
            });
            group.add(cloned);
        } else {
            preloadScannedGLTFModels();
            const fallbackPts = [
                new THREE.Vector2(0.0, -1.12), new THREE.Vector2(0.32, -1.12),
                new THREE.Vector2(0.38, -0.82), new THREE.Vector2(0.56, -0.18),
                new THREE.Vector2(0.52, 0.35), new THREE.Vector2(0.26, 0.72),
                new THREE.Vector2(0.34, 0.98), new THREE.Vector2(0.30, 1.00)
            ];
            const fbGeo = createSmoothVesselLathe(fallbackPts, null, 64);
            const fbMesh = new THREE.Mesh(fbGeo, glazeMat);
            fbMesh.castShadow = fbMesh.receiveShadow = true;
            group.add(fbMesh);
        }
    } else {
        switch (typeIndex) {
            case 0: {
                // 0. 南宋官窑·八方贯耳弦纹瓶
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

                const ringY = [-0.36, -0.08, 0.48];
                const ringR = [0.695, 0.638, 0.322];
                for (let r = 0; r < ringY.length; r++) {
                    const ringGeo = new THREE.TorusGeometry(ringR[r], 0.016, 20, 64);
                    const ringMesh = new THREE.Mesh(ringGeo, glazeMat);
                    ringMesh.rotation.x = Math.PI / 2;
                    ringMesh.position.y = ringY[r];
                    group.add(ringMesh);
                }

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
                // 1. 北宋汝窑·天青椭圆四足水仙盆
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
                // 2. 北宋定窑·白釉划花莲纹梅瓶
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

                const goldRim = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.015, 20, 64), goldMat);
                goldRim.rotation.x = Math.PI / 2;
                goldRim.position.y = 0.975;
                group.add(goldRim);
                break;
            }

            case 3: {
                // 3. 宋哥窑·金丝铁线胆式瓶
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
                // 4. 北宋钧窑·玫瑰紫海棠出戟尊
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
                // 5. 宋建窑·兔毫曜变天目斗茶盏
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

                for (let k = 0; k < 10; k++) {
                    const ang = (k / 10) * Math.PI * 2;
                    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 14), glazeMat);
                    drop.scale.set(0.9, 1.45, 0.9);
                    drop.position.set(Math.cos(ang) * 0.36, -0.52 + (k % 2) * 0.03, Math.sin(ang) * 0.36);
                    group.add(drop);
                }

                const footGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.14, 48);
                const footMesh = new THREE.Mesh(footGeo, tiezuMat);
                footMesh.position.y = -0.72;
                group.add(footMesh);
                break;
            }

            case 6: {
                // 6. 明宣德·青花缠枝莲纹玉壶春瓶
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
    }

    // X光胎骨剖面模式下叠加半透明结构网格
    if (exhibitionMode === 'cutaway') {
        const xrayMat = new THREE.MeshBasicMaterial({
            color: 0xd4af6a,
            wireframe: true,
            transparent: true,
            opacity: 0.18
        });
        const meshesToClone = [];
        group.traverse((child) => {
            if (child.isMesh && child.geometry) meshesToClone.push(child);
        });
        meshesToClone.forEach(child => {
            const ghost = new THREE.Mesh(child.geometry.clone(), xrayMat);
            ghost.scale.copy(child.scale);
            ghost.position.copy(child.position);
            ghost.rotation.copy(child.rotation);
            if (child.parent && child.parent !== group) {
                ghost.scale.multiply(child.parent.scale);
                ghost.position.add(child.parent.position);
            }
            group.add(ghost);
        });
    }

    return group;
}

/**
 * 构建真实 3D 室内环境场景 (宋代玄青金碧屏风 + 紫檀束腰几案 + 博山香炉青烟 + 轩窗丁达尔光束)
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
        roughness: 0.34,
        metalness: 0.15
    });

    // 1. 地面
    const floorGeo = new THREE.PlaneGeometry(18, 18, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
        map: getRealisticStoneFloorTexture(),
        roughness: 0.38,
        metalness: 0.10
    });
    roomFloorMesh = new THREE.Mesh(floorGeo, floorMat);
    roomFloorMesh.rotation.x = -Math.PI / 2;
    roomFloorMesh.position.y = -1.68;
    roomFloorMesh.receiveShadow = true;
    realisticRoomGroup.add(roomFloorMesh);

    // 2. 明清红木雕花束腰四方几案
    const tableGroup = new THREE.Group();
    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.08, 1.68), rosewoodMat);
    topPanel.position.y = -1.18;
    topPanel.castShadow = topPanel.receiveShadow = true;
    tableGroup.add(topPanel);

    const waistMesh = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.05, 1.52), rosewoodMat);
    waistMesh.position.y = -1.245;
    tableGroup.add(waistMesh);

    const apronMesh = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.06, 1.58), rosewoodMat);
    apronMesh.position.y = -1.295;
    tableGroup.add(apronMesh);

    const legGeo = new THREE.BoxGeometry(0.09, 0.38, 0.09);
    [[-0.72, -0.72], [0.72, -0.72], [-0.72, 0.72], [0.72, 0.72]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, rosewoodMat);
        leg.position.set(lx, -1.485, lz);
        tableGroup.add(leg);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), rosewoodMat);
        foot.position.set(lx, -1.66, lz);
        tableGroup.add(foot);
    });

    const matGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.015, 64);
    const brocadeMat = new THREE.MeshStandardMaterial({
        map: getBrocadeMatTexture(),
        roughness: 0.65,
        metalness: 0.12
    });
    const matMesh = new THREE.Mesh(matGeo, brocadeMat);
    matMesh.position.y = -1.132;
    matMesh.receiveShadow = true;
    tableGroup.add(matMesh);

    const goldRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.745, 0.009, 12, 64),
        new THREE.MeshStandardMaterial({ color: 0xd4af6a, roughness: 0.28, metalness: 0.85 })
    );
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = -1.13;
    tableGroup.add(goldRim);

    const shadowGeo = new THREE.PlaneGeometry(0.96, 0.96);
    const shadowMat = new THREE.MeshBasicMaterial({
        map: getContactShadowTexture(),
        transparent: true,
        opacity: 0.88,
        depthWrite: false
    });
    contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.y = -1.124;
    tableGroup.add(contactShadowMesh);

    realisticRoomGroup.add(tableGroup);
    roomTableMesh = tableGroup;

    // 3. 三折紫檀木雕千里江山泥金插屏 (深色绢本彻底凸显前景器物)
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0, -1.85);

    const screenWoodMat = rosewoodMat;
    const screenPaintMat = new THREE.MeshStandardMaterial({
        map: getScreenPaintingTexture(),
        roughness: 0.96,
        metalness: 0.0,
        envMapIntensity: 0.06
    });

    const mainScreenGroup = new THREE.Group();
    const mainPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.55), screenPaintMat);
    mainPanel.position.set(0, -0.02, 0);
    mainPanel.receiveShadow = true;
    mainScreenGroup.add(mainPanel);

    const fTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.08), screenWoodMat);
    fTop.position.set(0, 1.28, 0);
    mainScreenGroup.add(fTop);
    const fBottom = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 0.08), screenWoodMat);
    fBottom.position.set(0, -1.33, 0);
    mainScreenGroup.add(fBottom);
    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.71, 0.08), screenWoodMat);
    fLeft.position.set(-1.20, -0.02, 0);
    mainScreenGroup.add(fLeft);
    const fRight = fLeft.clone();
    fRight.position.set(1.20, -0.02, 0);
    mainScreenGroup.add(fRight);
    screenGroup.add(mainScreenGroup);

    const leftScreen = new THREE.Group();
    leftScreen.position.set(-1.25, 0, 0);
    leftScreen.rotation.y = (26 * Math.PI) / 180;
    const leftPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.38), screenPaintMat);
    leftPanel.position.set(-0.54, -0.05, 0);
    leftScreen.add(leftPanel);
    screenGroup.add(leftScreen);

    const rightScreen = new THREE.Group();
    rightScreen.position.set(1.25, 0, 0);
    rightScreen.rotation.y = (-26 * Math.PI) / 180;
    const rightPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.38), screenPaintMat);
    rightPanel.position.set(0.54, -0.05, 0);
    rightScreen.add(rightPanel);
    screenGroup.add(rightScreen);

    realisticRoomGroup.add(screenGroup);
    roomScreenMesh = screenGroup;

    // 4. 左侧宋代直棂木窗
    const windowGroup = new THREE.Group();
    windowGroup.position.set(-3.6, 0.45, -0.4);
    windowGroup.rotation.y = Math.PI / 2;

    const wallGeo = new THREE.BoxGeometry(4.8, 4.2, 0.15);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x141c22, roughness: 0.95 });
    roomWallMesh = new THREE.Mesh(wallGeo, wallMat);
    roomWallMesh.position.set(0, 0.4, -0.08);
    windowGroup.add(roomWallMesh);

    const winPaper = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 2.4),
        new THREE.MeshBasicMaterial({ map: getWindowLatticeTexture(), side: THREE.DoubleSide })
    );
    winPaper.position.set(0, 0.4, 0.01);
    windowGroup.add(winPaper);
    realisticRoomGroup.add(windowGroup);
    roomWindowMesh = windowGroup;

    // 5. 斜射丁达尔体积光束
    volumetricGodRays = new THREE.Group();
    const rayMat = new THREE.MeshBasicMaterial({
        color: 0xffecc4,
        transparent: true,
        opacity: 0.038,
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

    // 6. 博山香炉与青烟
    const deskAccGroup = new THREE.Group();
    const censerGroup = new THREE.Group();
    censerGroup.position.set(0.62, -1.13, -0.42);
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x5c6858, roughness: 0.42, metalness: 0.78 });
    const censerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.08, 32), bronzeMat);
    censerBody.position.y = 0.055;
    censerGroup.add(censerBody);
    const censerLid = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.09, 16), bronzeMat);
    censerLid.position.y = 0.14;
    censerGroup.add(censerLid);
    deskAccGroup.add(censerGroup);

    const smokeCount = 65;
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
        size: 0.06,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    incenseSmokeSystem = new THREE.Points(smokeGeo, smokeMat);
    deskAccGroup.add(incenseSmokeSystem);

    realisticRoomGroup.add(deskAccGroup);
    scene.add(realisticRoomGroup);
    switchRealisticSceneEnv(currentRoomEnv, false);
}

function createInspectorStage() {
    pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);
    createRealistic3DEnvironment();

    const pCount = 150;
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
        size: 0.03,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);
}

function switchRealisticSceneEnv(envKey, showNotice = true) {
    currentRoomEnv = envKey;
    if (!scene || !realisticRoomGroup) return;
    const lightLabel = document.getElementById('light-preset-name');

    if (envKey === 'studio') {
        scene.background = new THREE.Color(0xF5F2E9);
        if (scene.fog) scene.fog.color.setHex(0x0b1116);
        if (roomFloorMesh) {
            roomFloorMesh.material.map = getRealisticStoneFloorTexture();
            roomFloorMesh.material.roughness = 0.38;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (lightMain) { lightMain.color.setHex(0xfff5e6); lightMain.intensity = 1.85; }
        if (lightFill) { lightFill.color.setHex(0x88b8c6); lightFill.intensity = 0.95; }
        if (lightRim) { lightRim.color.setHex(0xffe4b8); lightRim.intensity = 0.95; }
        if (lightLabel) lightLabel.textContent = '宋代雨后雅室';
        if (showNotice && typeof showToast === 'function') {
            showToast('🌿 已切换至【宋代文人雨后雅室】！千里江山泥金屏风衬托天青玉光');
        }
    } else if (envKey === 'palace') {
        scene.background = new THREE.Color(0x070b10);
        if (scene.fog) scene.fog.color.setHex(0x070b10);
        if (roomFloorMesh) {
            roomFloorMesh.material.map = getRealisticGoldBrickTexture();
            roomFloorMesh.material.roughness = 0.16;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (lightMain) { lightMain.color.setHex(0xf4f9ff); lightMain.intensity = 2.05; }
        if (lightFill) { lightFill.color.setHex(0x9dc6dc); lightFill.intensity = 1.05; }
        if (lightRim) { lightRim.color.setHex(0xe8f4ff); lightRim.intensity = 1.05; }
        if (lightLabel) lightLabel.textContent = '国家文博殿堂';
        if (showNotice && typeof showToast === 'function') {
            showToast('🏛️ 已切换至【国家文博特展殿堂】！镜面金砖与高显色聚光灯束');
        }
    } else if (envKey === 'kiln') {
        scene.background = new THREE.Color(0x140704);
        if (scene.fog) scene.fog.color.setHex(0x140704);
        if (roomFloorMesh) {
            roomFloorMesh.material.map = getRealisticKilnBrickTexture();
            roomFloorMesh.material.roughness = 0.85;
            roomFloorMesh.material.needsUpdate = true;
        }
        if (lightMain) { lightMain.color.setHex(0xff6b2b); lightMain.intensity = 2.25; }
        if (lightFill) { lightFill.color.setHex(0xc43816); lightFill.intensity = 0.95; }
        if (lightRim) { lightRim.color.setHex(0xffa834); lightRim.intensity = 1.15; }
        if (lightLabel) lightLabel.textContent = '御窑秘境窑火';
        if (showNotice && typeof showToast === 'function') {
            showToast('🔥 已进入【御窑秘境窑火幽室】！1300℃龙窑火曜映照胎釉');
        }
    }

    ['studio', 'palace', 'kiln'].forEach(k => {
        const btn = document.getElementById(`scene-env-btn-${k}`);
        if (btn) btn.classList.toggle('active', k === envKey);
    });
}

function toggleRealisticScene() {
    showRealisticScene = !showRealisticScene;
    if (realisticRoomGroup) {
        realisticRoomGroup.visible = showRealisticScene && (exhibitionMode !== 'hall');
    }
    const btn = document.getElementById('btn-room-scene-toggle');
    if (btn) btn.classList.toggle('active', showRealisticScene);
    if (typeof showToast === 'function') {
        showToast(showRealisticScene ? '🏛️ 已开启【3D 真实室内环境场景】' : '已切换为【极简暗夜独立展台】');
    }
}

/**
 * 构建【3D 全景数字博物馆九柜大展厅】
 */
function buildVirtualMuseumHall() {
    if (hallGroup) {
        scene.remove(hallGroup);
        disposeGroup(hallGroup);
    }
    hallGroup = new THREE.Group();
    hallGroup.visible = (exhibitionMode === 'hall');

    const floorGeo = new THREE.CylinderGeometry(14.5, 14.5, 0.1, 96);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0b1015, roughness: 0.16, metalness: 0.38 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -1.45;
    floorMesh.receiveShadow = true;
    hallGroup.add(floorMesh);

    const compassGold = new THREE.MeshStandardMaterial({ color: 0xc5a059, roughness: 0.3, metalness: 0.85 });
    [2.8, 6.2, 9.4, 12.2].forEach(rad => {
        const rMesh = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.02, 12, 96), compassGold);
        rMesh.rotation.x = Math.PI / 2;
        rMesh.position.y = -1.39;
        hallGroup.add(rMesh);
    });

    const colGeo = new THREE.CylinderGeometry(0.22, 0.25, 6.4, 24);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x18222a, roughness: 0.4, metalness: 0.3 });
    for (let c = 0; c < 12; c++) {
        const ang = (c / 12) * Math.PI * 2;
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(Math.cos(ang) * 11.2, 1.75, Math.sin(ang) * 11.2);
        hallGroup.add(col);
    }

    const arcRadius = 6.2;
    const totalCount = porcelainModelsData.length;
    for (let idx = 0; idx < totalCount; idx++) {
        const mData = porcelainModelsData[idx];
        const angle = ((idx - (totalCount - 1) / 2) / (totalCount - 1)) * (Math.PI * 1.32);
        const vx = Math.sin(angle) * arcRadius;
        const vz = -Math.cos(angle) * arcRadius + 2.0;

        const booth = new THREE.Group();
        booth.position.set(vx, 0, vz);
        booth.lookAt(0, 0, 2.5);
        booth.userData = { vitrineIndex: idx };

        const podium = new THREE.Mesh(
            new THREE.CylinderGeometry(0.78, 0.88, 0.9, 48),
            new THREE.MeshStandardMaterial({ color: 0x141c24, roughness: 0.3, metalness: 0.25 })
        );
        podium.position.y = -0.95;
        podium.userData = { vitrineIndex: idx };
        booth.add(podium);

        const podiumGold = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.015, 12, 48), compassGold);
        podiumGold.rotation.x = Math.PI / 2;
        podiumGold.position.y = -0.50;
        booth.add(podiumGold);

        const glassBell = new THREE.Mesh(
            new THREE.CylinderGeometry(0.75, 0.75, 1.85, 36, 1, true),
            new THREE.MeshPhysicalMaterial({
                color: 0xd8f0f5,
                transparent: true,
                opacity: 0.13,
                roughness: 0.05,
                metalness: 0.05,
                clearcoat: 1.0
            })
        );
        glassBell.position.y = 0.42;
        glassBell.userData = { vitrineIndex: idx };
        booth.add(glassBell);

        const vBeam = new THREE.Mesh(
            new THREE.ConeGeometry(0.88, 3.2, 24, 1, true),
            new THREE.MeshBasicMaterial({
                color: idx === currentModelIndex ? 0xe5c888 : 0x8fb8c0,
                transparent: true,
                opacity: idx === currentModelIndex ? 0.09 : 0.035,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        vBeam.position.y = 1.6;
        booth.add(vBeam);

        const vesselMeshGroup = buildGeometry(idx, mData.defaultGlaze);
        vesselMeshGroup.scale.set(0.50, 0.50, 0.50);
        vesselMeshGroup.position.y = 0.12;
        vesselMeshGroup.traverse(c => { c.userData = { vitrineIndex: idx }; });
        booth.add(vesselMeshGroup);

        hallGroup.add(booth);
    }

    scene.add(hallGroup);
}

/**
 * 初始化 3D 研鉴展馆
 */
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b1116);
        scene.fog = new THREE.FogExp2(0x0b1116, 0.042);

        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 580;
        camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        camera.position.set(0, 0.95, 3.55);

        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true, // 支持一键导出馆藏高清3D快照
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.localClippingEnabled = false;

        clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipOffset);

        envMapTexture = createStudioEnvironment();
        if (envMapTexture) {
            scene.environment = envMapTexture;
        }

        ambientLight = new THREE.AmbientLight(0xdbe8ec, 0.72);
        scene.add(ambientLight);

        lightMain = new THREE.DirectionalLight(0xfff6e8, 1.85);
        lightMain.position.set(3.2, 5.2, 4.0);
        lightMain.castShadow = true;
        lightMain.shadow.mapSize.width = 1024;
        lightMain.shadow.mapSize.height = 1024;
        lightMain.shadow.bias = -0.0005;
        scene.add(lightMain);

        lightFill = new THREE.DirectionalLight(0x88b8c8, 0.95);
        lightFill.position.set(-3.8, 2.2, -2.5);
        scene.add(lightFill);

        lightRim = new THREE.PointLight(0xffe4b5, 0.95, 14);
        lightRim.position.set(0, 3.8, -3.2);
        scene.add(lightRim);

        topSpotLight = new THREE.SpotLight(0xffffff, 1.35, 15, Math.PI / 5, 0.65, 1.5);
        topSpotLight.position.set(0, 5.5, 0.5);
        scene.add(topSpotLight);

        preloadScannedGLTFModels();
        createInspectorStage();
        loadPorcelainModel(0);

        setupControls(canvas);
        window.addEventListener('resize', handleThreeResize);
        setupVisibilityObserver(canvas);

        animate();
    } catch (err) {
        console.warn('[ThreeJS 研鉴空间] 初始化异常:', err);
    }
}

function switchExhibitionMode(mode) {
    if (!renderer) return;
    exhibitionMode = mode;

    ['inspector', 'hall', 'cutaway'].forEach(m => {
        const btn = document.getElementById(`mode-btn-${m}`);
        if (btn) btn.classList.toggle('active', m === mode);
    });

    const cutawayControls = document.getElementById('cutaway-slider-bar');
    if (cutawayControls) {
        cutawayControls.classList.toggle('hidden', mode !== 'cutaway');
    }

    if (mode === 'hall') {
        renderer.localClippingEnabled = false;
        if (currentGroup) currentGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = false;
        if (realisticRoomGroup) realisticRoomGroup.visible = false;
        buildVirtualMuseumHall();
        if (hallGroup) hallGroup.visible = true;
        focusVitrineInHall(currentModelIndex);
        if (typeof showToast === 'function') {
            showToast('🏛️ 已步入【3D 全景数字博物馆九柜大展厅】！点击任意展柜或下方器型即可漫游观摩');
        }
    } else if (mode === 'cutaway') {
        renderer.localClippingEnabled = true;
        if (hallGroup) hallGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = true;
        if (realisticRoomGroup) realisticRoomGroup.visible = showRealisticScene;
        loadPorcelainModel(currentModelIndex, true);
        camPosTarget = { x: 0.18, y: 0.55, z: 3.15 };
        camLookTarget = { x: 0, y: -0.05, z: 0 };
        if (typeof showToast === 'function') {
            showToast('🔬 已开启【X光胎骨剖面透视】！可拖动剖切滑块审视“薄胎厚釉、口薄底厚”的内部力学构造');
        }
    } else {
        renderer.localClippingEnabled = false;
        if (hallGroup) hallGroup.visible = false;
        if (pedestalGroup) pedestalGroup.visible = true;
        if (realisticRoomGroup) realisticRoomGroup.visible = showRealisticScene;
        loadPorcelainModel(currentModelIndex, true);
        camPosTarget = { x: 0, y: 0.95, z: 3.55 };
        camLookTarget = { x: 0, y: -0.05, z: 0 };
        if (typeof showToast === 'function') {
            showToast('✨ 已切换至【单器 360° 微距精鉴台】');
        }
    }
    render3DHotspotsDOM();
}

function setCutawayOffset(val) {
    clipOffset = parseFloat(val);
    if (clipPlane) {
        clipPlane.constant = clipOffset;
    }
    const label = document.getElementById('cutaway-offset-val');
    if (label) {
        label.textContent = `${Math.round(clipOffset * 100)}%`;
    }
}

function setPbrParam(param, val) {
    const num = parseFloat(val);
    customPbrOverride[param] = num;
    const valEl = document.getElementById(`pbr-val-${param}`);
    if (valEl) {
        valEl.textContent = param === 'ior' ? num.toFixed(2) : `${Math.round(num * 100)}%`;
    }
    if (currentGroup) {
        const prevRotY = currentGroup.rotation.y;
        useScannedOriginalTex = false;
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        currentGroup = buildGeometry(currentModelIndex);
        currentGroup.rotation.y = prevRotY;
        currentGroup.visible = (exhibitionMode !== 'hall');
        scene.add(currentGroup);
    }
}

function resetPbrParams() {
    customPbrOverride = { clearcoat: null, roughness: null, ior: null };
    useScannedOriginalTex = true;
    const cSlider = document.getElementById('pbr-slider-clearcoat');
    const rSlider = document.getElementById('pbr-slider-roughness');
    const iSlider = document.getElementById('pbr-slider-ior');
    if (cSlider) cSlider.value = 0.98;
    if (rSlider) rSlider.value = 0.14;
    if (iSlider) iSlider.value = 1.54;
    const cVal = document.getElementById('pbr-val-clearcoat');
    const rVal = document.getElementById('pbr-val-roughness');
    const iVal = document.getElementById('pbr-val-ior');
    if (cVal) cVal.textContent = '98%';
    if (rVal) rVal.textContent = '14%';
    if (iVal) iVal.textContent = '1.54';
    loadPorcelainModel(currentModelIndex, true);
    if (typeof showToast === 'function') showToast('已恢复标准御窑物理光学参数');
}

function focusVitrineInHall(index) {
    const arcRadius = 6.2;
    const totalCount = porcelainModelsData.length;
    const angle = ((index - (totalCount - 1) / 2) / (totalCount - 1)) * (Math.PI * 1.32);
    const vx = Math.sin(angle) * arcRadius;
    const vz = -Math.cos(angle) * arcRadius + 2.0;

    const camDist = 2.25;
    camPosTarget = {
        x: vx - Math.sin(angle) * camDist,
        y: 0.58,
        z: vz + Math.cos(angle) * camDist
    };
    camLookTarget = { x: vx, y: 0.08, z: vz };
}

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
            showToast('🎬 已开启【策展人自动巡礼】，镜头将依次带您漫游馆藏九大传世名瓷展柜');
        }
        tourTimer = setInterval(() => {
            const nextIdx = (currentModelIndex + 1) % porcelainModelsData.length;
            loadPorcelainModel(nextIdx);
            if (typeof playPorcelainChime === 'function') {
                playPorcelainChime(2100 + nextIdx * 110);
            }
        }, 4200);
    } else {
        if (typeof showToast === 'function') {
            showToast('已暂停策展自动巡礼，您可自由旋转或点选观摩');
        }
    }
}

function loadPorcelainModel(index, keepMode = false) {
    stopCuratorAudio();
    currentModelIndex = index;
    if (porcelainModelsData[index] && porcelainModelsData[index].defaultGlaze && !keepMode) {
        currentGlazeIndex = porcelainModelsData[index].defaultGlaze;
        useScannedOriginalTex = true;
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
        dimensionGroup = createDimensionLines();
        scene.add(dimensionGroup);
    }

    if (exhibitionMode === 'hall') {
        buildVirtualMuseumHall();
        focusVitrineInHall(index);
    } else if (!keepMode) {
        userOrbitAngles = { theta: 0, phi: 0.26, radius: 3.55 };
        camPosTarget = { x: 0, y: 0.95, z: 3.55 };
        camLookTarget = { x: 0, y: -0.05, z: 0 };
    }

    updateModelInfoCard(index);
    highlightActiveModelBtn(index);
    highlightActiveGlazeBtn(currentGlazeIndex);
    render3DHotspotsDOM();
}

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

function setStudioLighting(preset) {
    if (preset === 'palace') {
        switchRealisticSceneEnv('studio');
    } else if (preset === 'museum') {
        switchRealisticSceneEnv('palace');
    } else if (preset === 'kiln') {
        switchRealisticSceneEnv('kiln');
    } else if (preset === 'candle') {
        scene.background = new THREE.Color(0x120a05);
        if (scene.fog) scene.fog.color.setHex(0x120a05);
        if (lightMain) { lightMain.color.setHex(0xffb258); lightMain.intensity = 1.95; }
        if (lightFill) { lightFill.color.setHex(0x8a4c28); lightFill.intensity = 0.78; }
        if (lightRim) { lightRim.color.setHex(0xff8c26); lightRim.intensity = 1.15; }
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

function switchGlaze(glazeKey) {
    if (!glazePalettes[glazeKey]) return;
    currentGlazeIndex = glazeKey;
    useScannedOriginalTex = false; // 主动点击釉色时，允许在实测3D模型上试烧不同釉色
    if (currentGroup) {
        const prevRotY = currentGroup.rotation.y;
        disposeGroup(currentGroup);
        scene.remove(currentGroup);
        currentGroup = buildGeometry(currentModelIndex, glazeKey);
        currentGroup.rotation.y = prevRotY;
        currentGroup.visible = (exhibitionMode !== 'hall');
        scene.add(currentGroup);
    }
    highlightActiveGlazeBtn(glazeKey);
    if (typeof playPorcelainChime === 'function') playPorcelainChime(2450);
    if (typeof showToast === 'function') {
        showToast(`✨ 已切换 PBR 双层微晶釉色：【${glazePalettes[glazeKey].name}】`);
    }
}

function restoreScannedTexture() {
    useScannedOriginalTex = true;
    loadPorcelainModel(currentModelIndex, true);
    if (typeof showToast === 'function') {
        showToast('📷 已恢复实测三维扫描文物原始 1K PBR 纹理贴图');
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
        showToast(isWireframe ? '已开启【三维拓扑网格力学透视】' : '已恢复【PBR 物理釉面渲染】');
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
            camPosTarget = { x: 0, y: 0.08, z: 3.35 };
            break;
        case 'top':
            camPosTarget = { x: 0, y: 3.7, z: 0.25 };
            break;
        case 'bottom':
            camPosTarget = { x: 0, y: -2.85, z: 1.65 };
            break;
        default:
            camPosTarget = { x: 0, y: 0.95, z: 3.55 };
            break;
    }
    camLookTarget = { x: 0, y: -0.05, z: 0 };
}

function resetCamera() {
    if (exhibitionMode === 'hall') {
        camPosTarget = { x: 0, y: 1.8, z: 5.2 };
        camLookTarget = { x: 0, y: 0.2, z: -2.5 };
        return;
    }
    camPosTarget = { x: 0, y: 0.95, z: 3.55 };
    camLookTarget = { x: 0, y: -0.05, z: 0 };
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
 * 叩瓷听音与声学共振波形实时绘制
 */
let acousticAnimId = null;
function strike3DVesselSound() {
    const m = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
    const freq = m.acousticFreq || 2420;
    if (typeof playPorcelainChime === 'function') {
        playPorcelainChime(freq);
    }
    vesselVibration = 1.0;

    const waveCanvas = document.getElementById('vessel-acoustic-canvas');
    if (!waveCanvas) return;
    const ctx = waveCanvas.getContext('2d');
    let env = 1.0;
    let phase = 0;

    if (acousticAnimId) cancelAnimationFrame(acousticAnimId);
    function drawWave() {
        const w = waveCanvas.width;
        const h = waveCanvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(139, 194, 206, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        ctx.strokeStyle = '#E5C888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const normX = x / w;
            const win = Math.sin(normX * Math.PI);
            const y = h / 2 + Math.sin(normX * (freq / 95) + phase) * (h * 0.38) * env * win;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        phase += 0.42;
        env *= 0.945;
        if (env > 0.02) {
            acousticAnimId = requestAnimationFrame(drawWave);
        }
    }
    drawWave();
    if (typeof showToast === 'function') {
        showToast(`🔔 叩击【${m.name}】· 共振基频 ${freq} Hz，声如清磬！`);
    }
}

/**
 * 语音策展讲解 (Web Speech API)
 */
/**
 * 华夏器道 · 仝瓷记忆 — 小米 MiMo 博物馆资深讲解员原声导览引擎 (双核状态机 + 零延迟秒开)
 */
let currentCuratorAudio = null;
let isCuratorAudioPlaying = false;
let currentPlayingVesselName = null;

function stopCuratorAudio() {
    if (currentCuratorAudio) {
        try {
            currentCuratorAudio.pause();
            currentCuratorAudio.currentTime = 0;
        } catch (e) {}
        currentCuratorAudio = null;
    }
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    isCuratorAudioPlaying = false;
    currentPlayingVesselName = null;
    updateCuratorAudioUI(false);
}

function updateCuratorAudioUI(playing, title = '', subtitleText = '') {
    const btn = document.getElementById('btn-speak-vessel');
    const subtitleEl = document.getElementById('curator-subtitle-bar');
    if (btn) {
        if (playing) {
            btn.innerHTML = `<span class="inline-flex items-center gap-0.5 mr-1 h-3"><span class="w-0.5 h-3 bg-amber-400 animate-pulse"></span><span class="w-0.5 h-2 bg-amber-400 animate-pulse" style="animation-delay: 0.15s"></span><span class="w-0.5 h-3.5 bg-amber-400 animate-pulse" style="animation-delay: 0.3s"></span></span> ⏹️ 停止解说`;
            btn.classList.add('border-amber-400', 'bg-amber-400/10', 'text-amber-500');
        } else {
            btn.innerHTML = `<i class="fa-solid fa-volume-high text-amber-400 mr-1"></i>语音解说`;
            btn.classList.remove('border-amber-400', 'bg-amber-400/10', 'text-amber-500');
        }
    }
    if (subtitleEl) {
        if (playing && subtitleText) {
            subtitleEl.innerHTML = `
                <div class="flex items-center justify-between gap-3 max-w-5xl mx-auto px-4 py-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-bold font-serif-cn shrink-0 shadow-sm">
                            <i class="fa-solid fa-microphone mr-1"></i>小米 MiMo 馆长原声
                        </span>
                        <span class="text-xs text-text-title font-serif-cn truncate font-medium">
                            《${title}》${subtitleText}
                        </span>
                    </div>
                    <button onclick="stopCuratorAudio()" class="text-xs text-text-muted hover:text-amber-500 shrink-0 font-serif-cn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
            subtitleEl.classList.remove('hidden');
        } else {
            subtitleEl.classList.add('hidden');
        }
    }
}

function speakVesselCommentary() {
    const m = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
    const text = `${m.name}。断代：${m.period}，所属窑口：${m.kiln}。实测规制：${m.dimensions}。${m.desc}`;

    // 如果当前正在播放同一件器物，点击则优雅停止
    if (isCuratorAudioPlaying && currentPlayingVesselName === m.name) {
        stopCuratorAudio();
        if (typeof showToast === 'function') showToast('⏹️ 已停止策展导览播报');
        return;
    }

    // 先彻底停止上一段音频
    stopCuratorAudio();

    // 优先读取 100% 离线内嵌的小米 MiMo 预合成高保真馆长原声
    const prebaked = (window.MUSEUM_AUDIO_DATA && (window.MUSEUM_AUDIO_DATA[m.name] || window.MUSEUM_AUDIO_DATA[m.name.split(' ')[0]])) || null;

    if (prebaked && (prebaked.dataUri || prebaked.file)) {
        try {
            const audioSrc = prebaked.dataUri || prebaked.file;
            const audio = new Audio(audioSrc);
            currentCuratorAudio = audio;
            isCuratorAudioPlaying = true;
            currentPlayingVesselName = m.name;
            updateCuratorAudioUI(true, m.name, m.desc);

            audio.onended = () => {
                stopCuratorAudio();
            };
            audio.onerror = (e) => {
                console.warn('本地音频读取异常，无缝降级:', e);
                fallbackSpeechSynthesis(text, m.name);
            };

            audio.play().catch(err => {
                console.warn('浏览器自动播放限制:', err);
                fallbackSpeechSynthesis(text, m.name);
            });

            if (typeof showToast === 'function') {
                showToast(`🎙️ 【小米 MiMo 资深讲解员】正在为您声情并茂解读《${m.name}》`);
            }
            return;
        } catch (err) {
            console.warn('音频实例启动异常:', err);
        }
    }

    // 备用降级为本地 Web Speech API
    fallbackSpeechSynthesis(text, m.name);
}

function fallbackSpeechSynthesis(text, name) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 0.92;
        utter.pitch = 0.96;
        utter.onend = () => stopCuratorAudio();
        isCuratorAudioPlaying = true;
        currentPlayingVesselName = name;
        updateCuratorAudioUI(true, name, text);
        window.speechSynthesis.speak(utter);
        if (typeof showToast === 'function') {
            showToast(`🎙️ 正在为您语音播报【${name}】数字策展解说`);
        }
    }
}

function capture3DSnapshot() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer) return;
    renderer.render(scene, camera);

    const m = porcelainModelsData[currentModelIndex] || porcelainModelsData[0];
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 1200;
    outCanvas.height = 860;
    const ctx = outCanvas.getContext('2d');

    ctx.fillStyle = '#0B1015';
    ctx.fillRect(0, 0, 1200, 860);

    // 绘制 3D 渲染画面
    ctx.drawImage(canvas, 40, 40, 1120, 680);

    // 外框鎏金线
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 1128, 688);

    // 底部博物馆典藏题签栏
    ctx.fillStyle = '#EEF4F7';
    ctx.font = 'bold 26px "Noto Serif SC", "Songti SC", serif';
    ctx.fillText(`华夏器道 · 仝瓷记忆 — ${m.name}`, 45, 775);

    ctx.fillStyle = '#8BC2CE';
    ctx.font = '16px "Noto Serif SC", sans-serif';
    ctx.fillText(`${m.period} | ${m.kiln} | 实测规制：${m.dimensions}`, 45, 812);

    // 朱文印章
    ctx.fillStyle = '#A8383B';
    ctx.fillRect(1080, 748, 72, 72);
    ctx.strokeStyle = '#F5EFE2';
    ctx.lineWidth = 2;
    ctx.strokeRect(1085, 753, 62, 62);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Noto Serif SC", serif';
    ctx.fillText('器道', 1096, 780);
    ctx.fillText('珍藏', 1096, 806);

    const link = document.createElement('a');
    link.download = `华夏器道_3D典藏快照_${m.name}_${Date.now()}.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
    if (typeof showToast === 'function') {
        showToast('📸 已导出带博物馆朱印题签的 3D 典藏高清快照！');
    }
}

function setupControls(canvas) {
    let prevX = 0, prevY = 0;
    let pointerDownPos = { x: 0, y: 0 };
    let initialPinchDist = null;
    let initialCamZ = 3.55;
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
            } else {
                strike3DVesselSound();
            }
        }
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * 0.0028;
        camPosTarget.z = Math.max(1.75, Math.min(6.8, camPosTarget.z + delta));
    }, { passive: false });

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

let lastFrameTime = 0;
function animate(now) {
    if (!isCanvasVisible) return;
    requestAnimationFrame(animate);
    if (now && now - lastFrameTime < 28) return;
    lastFrameTime = now || 0;

    camera.position.x += (camPosTarget.x - camera.position.x) * 0.08;
    camera.position.y += (camPosTarget.y - camera.position.y) * 0.08;
    camera.position.z += (camPosTarget.z - camera.position.z) * 0.08;

    camLookCurrent.x += (camLookTarget.x - camLookCurrent.x) * 0.08;
    camLookCurrent.y += (camLookTarget.y - camLookCurrent.y) * 0.08;
    camLookCurrent.z += (camLookTarget.z - camLookCurrent.z) * 0.08;
    camera.lookAt(camLookCurrent.x, camLookCurrent.y, camLookCurrent.z);

    if (currentGroup && exhibitionMode !== 'hall') {
        if (autoRotate) {
            currentGroup.rotation.y += 0.0055;
        }
        if (vesselVibration > 0.01) {
            currentGroup.position.x = Math.sin(Date.now() * 0.08) * 0.012 * vesselVibration;
            vesselVibration *= 0.90;
        } else {
            currentGroup.position.x = 0;
        }
    }
    if (hallGroup && exhibitionMode === 'hall') {
        hallGroup.children.forEach(child => {
            if (child.userData && child.userData.vitrineIndex !== undefined) {
                const vGroup = child.children[child.children.length - 1];
                if (vGroup) vGroup.rotation.y += 0.006;
            }
        });
    }

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

    if (incenseSmokeSystem && incenseSmokeSystem.visible && realisticRoomGroup && realisticRoomGroup.visible) {
        const sPos = incenseSmokeSystem.geometry.attributes.position;
        const sSeeds = incenseSmokeSystem.geometry.userData.seeds;
        if (sSeeds) {
            for (let i = 0; i < sPos.count; i++) {
                let py = sPos.getY(i) + sSeeds[i * 3 + 1];
                sSeeds[i * 3] += 0.025;
                const px = 0.62 + Math.sin(sSeeds[i * 3]) * 0.025 * (py - (-0.95));
                const pz = -0.42 + Math.cos(sSeeds[i * 3]) * 0.025 * (py - (-0.95));
                if (py > -0.25) py = -0.92;
                sPos.setX(i, px);
                sPos.setY(i, py);
                sPos.setZ(i, pz);
            }
            sPos.needsUpdate = true;
        }
    }

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
 * 更新右侧器物研鉴详情档案卡 (含叩瓷声波示波器、语音讲解、快照导出与实测纹理切换)
 */
function updateModelInfoCard(index) {
    const infoEl = document.getElementById('3d-model-info');
    if (!infoEl) return;
    const m = porcelainModelsData[index];
    if (!m) return;

    const scannedBadge = m.isScannedGLTF ? `
        <div class="p-2.5 rounded-xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-between text-xs">
            <span class="text-amber-200 font-serif-cn"><i class="fa-solid fa-satellite-dish mr-1.5"></i>1:1 实测三维扫描点云模型</span>
            <button onclick="restoreScannedTexture()" class="px-2.5 py-1 rounded-full bg-amber-700 text-white text-[11px] hover:bg-tianqing transition-colors">
                恢复原始扫描贴图
            </button>
        </div>
    ` : '';

    infoEl.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-light">
                <span class="badge bg-tianqing-deep text-white text-xs shrink-0">${m.period}</span>
                <span class="text-xs text-tianqing-deep bg-yuebai px-3 py-1 rounded-full font-medium shrink-0 border border-border-light">${m.kiln}</span>
            </div>

            <div>
                <h3 class="text-xl font-serif-cn text-text-title font-semibold leading-snug">${m.name}</h3>
                <p class="text-[11px] text-text-muted mt-0.5 font-serif-cn">${m.english}</p>
                <div class="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-amber-400">
                    <span><i class="fa-solid fa-ruler-combined mr-1"></i>${m.dimensions}</span>
                    <span><i class="fa-solid fa-layer-group mr-1"></i>${m.wallThickness}</span>
                </div>
            </div>

            ${scannedBadge}

            <p class="text-xs sm:text-sm text-text-body leading-relaxed font-light">${m.desc}</p>

            <!-- 器物叩击声学共振示波器与多媒体导览条 -->
            <div class="p-3 rounded-xl bg-bg-main border border-border-light space-y-2">
                <div class="flex items-center justify-between text-xs">
                    <span class="font-serif-cn text-text-title font-medium flex items-center gap-1.5">
                        <i class="fa-solid fa-wave-square text-amber-400"></i>
                        <span>叩瓷听音 · 声学共振谱 (${m.acousticFreq || 2420} Hz)</span>
                    </span>
                    <div class="flex items-center gap-1.5">
                        <button onclick="strike3DVesselSound()" class="px-2.5 py-1 rounded-lg bg-tianqing-deep text-white text-[11px] font-serif-cn hover:bg-tianqing transition-colors">
                            <i class="fa-solid fa-bell mr-1"></i>叩击听音
                        </button>
                        <button id="btn-speak-vessel" onclick="speakVesselCommentary()" class="px-2.5 py-1 rounded-lg bg-yuebai text-text-title border border-border-light text-[11px] font-serif-cn hover:border-tianqing transition-colors">
                            <i class="fa-solid fa-volume-high text-amber-400 mr-1"></i>语音解说
                        </button>
                        <button onclick="capture3DSnapshot()" class="px-2.5 py-1 rounded-lg bg-yuebai text-text-title border border-border-light text-[11px] font-serif-cn hover:border-tianqing transition-colors" title="导出带印章水印的3D典藏快照">
                            <i class="fa-solid fa-camera text-tianqing-deep"></i>
                        </button>
                    </div>
                </div>
                <canvas id="vessel-acoustic-canvas" width="380" height="42" class="w-full h-10 rounded bg-black/40 block"></canvas>
            </div>

            <div class="border-t border-border-light pt-3">
                <h4 class="text-xs text-text-title font-medium mb-2 tracking-wider flex items-center justify-between">
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

            <div class="pt-1 flex items-center justify-between gap-2 text-xs">
                <button onclick="switchExhibitionMode(exhibitionMode === 'cutaway' ? 'inspector' : 'cutaway')" class="flex-1 py-2.5 px-3 rounded-xl bg-yuebai hover:bg-tianqing hover:text-white text-text-title font-serif-cn transition-colors flex items-center justify-center gap-1.5 border border-border-light">
                    <i class="fa-solid fa-layer-group text-tianqing-deep"></i>
                    <span>${exhibitionMode === 'cutaway' ? '退出X光剖面' : 'X光胎壁剖面'}</span>
                </button>
                <button onclick="switchExhibitionMode(exhibitionMode === 'hall' ? 'inspector' : 'hall')" class="flex-1 py-2.5 px-3 rounded-xl bg-tianqing-deep text-white hover:bg-tianqing font-serif-cn transition-colors flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-building-columns text-amber-200"></i>
                    <span>${exhibitionMode === 'hall' ? '返回单器精鉴' : '步入全景展厅'}</span>
                </button>
            </div>
        </div>
    `;

    // 初始化默认静态声波线
    setTimeout(() => {
        const waveCanvas = document.getElementById('vessel-acoustic-canvas');
        if (waveCanvas) {
            const ctx = waveCanvas.getContext('2d');
            ctx.strokeStyle = 'rgba(229, 200, 136, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let x = 0; x < waveCanvas.width; x++) {
                const normX = x / waveCanvas.width;
                const y = 21 + Math.sin(normX * 28) * 11 * Math.sin(normX * Math.PI) * Math.exp(-normX * 2.2);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }, 30);
}

function highlightActiveModelBtn(index) {
    document.querySelectorAll('.model-btn').forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('bg-tianqing-deep', 'text-white', 'ring-2');
            btn.classList.remove('bg-yuebai', 'text-text-body');
        } else {
            btn.classList.remove('bg-tianqing-deep', 'text-white', 'ring-2');
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

window.initThreeJS = initThreeJS;
window.loadPorcelainModel = loadPorcelainModel;
window.switchGlaze = switchGlaze;
window.restoreScannedTexture = restoreScannedTexture;
window.toggleCrackle = toggleCrackle;
window.toggleWireframe = toggleWireframe;
window.toggleDimensionLines = toggleDimensionLines;
window.toggleAutoRotate = toggleAutoRotate;
window.setCameraView = setCameraView;
window.resetCamera = resetCamera;
window.openMicroscopeView = openMicroscopeView;
window.closeMicroscopeView = closeMicroscopeView;
window.switchExhibitionMode = switchExhibitionMode;
window.setCutawayOffset = setCutawayOffset;
window.setPbrParam = setPbrParam;
window.resetPbrParams = resetPbrParams;
window.toggleCuratorialTour = toggleCuratorialTour;
window.toggle3DHotspots = toggle3DHotspots;
window.focusHotspot = focusHotspot;
window.setStudioLighting = setStudioLighting;
window.rotateMainLight = rotateMainLight;
window.toggle3DFullscreen = toggle3DFullscreen;
window.switchRealisticSceneEnv = switchRealisticSceneEnv;
window.toggleRealisticScene = toggleRealisticScene;
window.strike3DVesselSound = strike3DVesselSound;
window.speakVesselCommentary = speakVesselCommentary;
window.capture3DSnapshot = capture3DSnapshot;
