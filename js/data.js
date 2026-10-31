﻿﻿﻿/**
 * 华夏器道 · 天青泥火 — 中国古代传统文化与古瓷数字化研鉴空间
 * 学术研考、文博档案、历史通史与非遗工序全景核心数据库
 */

const historyPeriods = [
    {
        "id": "ancient",
        "year": "新石器时代 (约前6000–前2000)",
        "temp": "750℃ – 950℃",
        "porosity": "12% – 18% (陶胎多孔)",
        "glazeSystem": "无釉素胎 · 天然赤铁矿/锰矿彩绘",
        "kilnType": "横穴窑 / 竖穴窑 (氧化焰)",
        "label": {
            "zh": "远古曙光",
            "en": "Neolithic Era"
        },
        "title": {
            "zh": "泥与火的初鸣 · 仰韶彩陶与龙山黑陶",
            "en": "Dawn of Clay & Fire: Yangshao & Longshan"
        },
        "desc": {
            "zh": "中华先民在黄河与长江流域发明了陶器。从中原仰韶文化的人面鱼纹彩陶盆、马家窑文化的旋涡纹彩陶瓮，到山东龙山文化“黑如漆、亮如镜、薄如蛋壳、硬如瓷”的蛋壳黑陶高柄杯，先民掌握了淘洗澄泥、慢轮修整与封窑渗碳还原技术，奠定了华夏硅酸盐热工文明的万年基石。",
            "en": "Neolithic potters mastered clay levigation, wheel-finishing, and carburization reduction, creating Yangshao painted pottery and paper-thin Longshan blackware."
        },
        "quote": "“神农耕而作陶，埏埴以为器，当其无，有器之用。” ——《周书》/《老子》",
        "img": "./images/4.jpg",
        "modelIdx": 0
    },
    {
        "id": "shangzhou",
        "year": "商周秦汉 (前1600–公元220)",
        "temp": "1150℃ – 1260℃",
        "porosity": "0.8% – 3.0% (胎质致密玻化)",
        "glazeSystem": "草木灰高温钙质青釉 (Fe₂O₃ 呈色)",
        "kilnType": "江南依山龙窑 (高温还原焰)",
        "label": {
            "zh": "商周秦汉",
            "en": "Shang, Zhou & Han"
        },
        "title": {
            "zh": "原始青瓷肇始 · 越窑成熟青瓷的历史飞跃",
            "en": "Proto-Celadon to Mature Yue Ware"
        },
        "desc": {
            "zh": "商周时期中国率先使用瓷石（高硅低铝矿物）并施以草木灰高温石灰釉，烧制出“原始青瓷”。至东汉晚期（公元2世纪），浙江上虞曹娥江流域的越窑借助依山而建的长条形“龙窑”，将窑温推升至1260℃以上，胎体完全烧结致密、釉面莹润不开裂，标志着人类历史上真正意义上的成熟瓷器正式诞生。",
            "en": "During the Eastern Han, Yue Kiln in Zhejiang utilized climbing dragon kilns to reach 1260°C, birthing the world's first fully vitrified mature celadon."
        },
        "quote": "“南山烈火煅青膏，百炼始成千峰翠。” —— 东汉越窑青瓷铭考",
        "img": "./images/7.jpg",
        "modelIdx": 7
    },
    {
        "id": "tang",
        "year": "隋唐五代 (581–960)",
        "temp": "1230℃ – 1300℃",
        "porosity": "< 0.6% (高玻化度)",
        "glazeSystem": "南青(石灰釉) · 北白(高铝低铁透明釉)",
        "kilnType": "南方龙窑 / 北方马蹄形馒头窑",
        "label": {
            "zh": "隋唐盛世",
            "en": "Sui, Tang & Five Dynasties"
        },
        "title": {
            "zh": "南青北白 · 法门寺秘色瓷与邢窑盈雪",
            "en": "Southern Celadon & Northern White"
        },
        "desc": {
            "zh": "唐代制瓷业形成陆羽《茶经》所载“南青北白”双峰并峙格局：南方越窑青瓷“类玉类冰”，五代吴越国钱氏进贡的“秘色瓷”采用瓷质匣钵加釉封口精烧，呈现“千峰翠色、如天青落水”之绝境；北方邢窑白瓷“类银类雪”，无色透明釉下胎白如玉，更有长沙窑釉下彩绘与唐三彩辉映丝绸之路。",
            "en": "Tang ceramics established the \"Southern Celadon, Northern White\" duality: Yue mise celadon rivaled jade and ice, while Xing white porcelain gleamed like silver and snow."
        },
        "quote": "“九秋风露越窑开，夺得千峰翠色来。” —— 唐 · 陆龟蒙《秘色越器》",
        "img": "./images/8.jpg",
        "modelIdx": 2
    },
    {
        "id": "song",
        "year": "两宋盛世 (960–1279)",
        "temp": "1220℃ – 1310℃",
        "porosity": "< 0.3% (玉质感微晶釉)",
        "glazeSystem": "石灰碱釉 / 分相乳浊釉 (玛瑙与钙磷微晶)",
        "kilnType": "官窑匣钵精烧 / 阶梯覆烧 / 龙窑",
        "label": {
            "zh": "两宋之巅",
            "en": "Song Dynasty Zenith"
        },
        "title": {
            "zh": "五大名窑 · 极简主义美学与理学造物巅峰",
            "en": "Five Great Kilns & Minimalist Aesthetics"
        },
        "desc": {
            "zh": "中国器物美学的至高巅峰。宋人尚理重道，追求“天人合一、大巧若拙”，摒弃繁复雕饰而专注于单色釉的玉质光泽与曼妙弧线。汝窑天青如梦、玛瑙入釉；官窑紫口铁足、蟹爪冰裂；哥窑金丝铁线、残缺天成；钧窑铜红窑变、万彩流霞；定窑牙白划花、声如清磬；建窑曜变兔毫，独步点茶雅集。",
            "en": "Song Dynasty represents the zenith of Chinese aesthetics: Ru, Guan, Ge, Jun, and Ding kilns elevated monochrome glazes, subtle curves, and natural crackles to philosophical art."
        },
        "quote": "“雨过天青云破处，这般颜色做将来。” —— 相传北宋徽宗赵佶御批",
        "img": "./images/13.jpg",
        "modelIdx": 0
    },
    {
        "id": "yuan",
        "year": "元代 (1271–1368)",
        "temp": "1280℃ – 1320℃",
        "porosity": "< 0.25% (二元配方坚致大器)",
        "glazeSystem": "苏麻离青钴料釉下彩 · 枢府卵白釉",
        "kilnType": "景德镇葫芦形窑 (柴烧还原)",
        "label": {
            "zh": "元代宏阔",
            "en": "Yuan Dynasty"
        },
        "title": {
            "zh": "二元配方革命 · 元青花与海上丝路远航",
            "en": "Binary Formula & Yuan Blue-and-White"
        },
        "desc": {
            "zh": "元代景德镇匠人首创“高岭土 + 瓷石”二元配方，将胎体中氧化铝（Al₂O₃）含量提高至20%以上，使大型器物在1300℃高温下挺立不塌，并设立“浮梁瓷局”。波斯进口“苏麻离青”高铁低锰钴料与景德镇影青白胎结合，诞生了气势磅礴的元代青花瓷，随泉州港远销亚欧非四十余国。",
            "en": "Yuan Jingdezhen pioneered the Kaolin-Petuntse binary clay formula, enabling monumental blue-and-white vessels painted with imported Persian cobalt."
        },
        "quote": "“白釉青花一火成，花从釉里透分明。” —— 景德镇古窑歌诀",
        "img": "./images/10.jpg",
        "modelIdx": 6
    },
    {
        "id": "ming",
        "year": "明代 (1368–1644)",
        "temp": "1290℃ – 1330℃",
        "porosity": "< 0.15% (御器厂甜白与宣青)",
        "glazeSystem": "永宣苏麻离青 · 成化斗彩 · 德化象牙白",
        "kilnType": "景德镇珠山御器厂 · 德化阶级窑",
        "label": {
            "zh": "大明御窑",
            "en": "Ming Imperial"
        },
        "title": {
            "zh": "珠山御器厂定鼎 · 永宣青花与成化斗彩",
            "en": "Ming Imperial Kilns: Xuande & Chenghua"
        },
        "desc": {
            "zh": "明洪武二年于景德镇珠山设立御器厂，实行“官搭民烧、百选一二”之严苛御贡规制。永乐甜白温润如脂，宣德青花苍翠欲滴、铁锈斑深入胎骨，成化斗彩鸡缸杯轻灵隽永，嘉万五彩热烈奔放，福建德化白瓷更以“中国白（Blanc de Chine）”倾倒欧洲王室。",
            "en": "Ming Imperial Workshops at Zhushan perfected sweet-white glazes, Xuande blue-and-white with iron crystalline spots, Chenghua doucai, and Dehua Blanc de Chine."
        },
        "quote": "“宣德年制青花色，浓淡分水若墨禅。” ——《陶雅》",
        "img": "./images/15.jpg",
        "modelIdx": 6
    },
    {
        "id": "qing",
        "year": "清代 (1644–1912)",
        "temp": "1300℃ – 1350℃ (兼备750℃釉上彩炉)",
        "porosity": "< 0.10% (极致致密精胎)",
        "glazeSystem": "郎窑红/豇豆红 · 珐琅彩/粉彩 · 仿宋名釉",
        "kilnType": "景德镇镇窑 (蛋形柴窑，一窑万器)",
        "label": {
            "zh": "清代华章",
            "en": "Qing Zenith"
        },
        "title": {
            "zh": "集历代之大成 · 唐英督陶与转心镂空绝技",
            "en": "Kangxi, Yongzheng & Qianlong Perfection"
        },
        "desc": {
            "zh": "清代康雍乾三朝在臧应选、郎廷极、年希尧、唐英等督陶官主持下，制瓷技术登峰造极。不仅全面复烧汝、官、哥、钧、定宋代五大名窑单色釉，更创烧郎窑红、珊瑚红、茶叶末、粉彩与宫廷造办处珐琅彩；乾隆朝镂空转心瓶集拉坯、利坯、镂雕、套烧于一身，巧夺天工。",
            "en": "Under supervisor Tang Ying, Qing imperial kilns mastered monochrome reproductions, famille rose, falangcai, and revolving reticulated vases."
        },
        "quote": "“汇千古名窑之神魂，极鬼斧天工之巧思。” —— 清 · 唐英《陶人心语》",
        "img": "./images/11.jpg",
        "modelIdx": 8
    },
    {
        "id": "modern",
        "year": "当代 (1912–2026)",
        "temp": "数字化全域光谱与热力学仿真",
        "porosity": "三维亚毫米级点云与双层微晶 PBR",
        "glazeSystem": "WebGL 着色器 · 高光谱成像 · 非遗数字孪生",
        "kilnType": "智能温控还原窑 / 数字文博云空间",
        "label": {
            "zh": "数字新篇",
            "en": "Digital Renaissance"
        },
        "title": {
            "zh": "文脉长青 · 三维数字孪生与智能研鉴传承",
            "en": "3D Digital Twin & AI Heritage Preservation"
        },
        "desc": {
            "zh": "迈入数字文明时代，古陶瓷保护与传播迎来范式跃迁。通过激光结构光三维扫描、WebGL 双层微晶物理渲染（PBR）、X射线断层剖面透视与计算机视觉开片应力算子，千年名瓷突破博物馆玻璃展柜的物理阻隔，化作人人可触、可听、可造、可鉴的活态数字文化基因。",
            "en": "Integrating 3D photogrammetry, WebGL PBR clearcoat rendering, and computer vision, ancient ceramic heritage transcends museum glass into living digital culture."
        },
        "quote": "“器以载道，借数字之光，照见华夏文明不灭薪火。” —— 华夏器道·天青泥火",
        "img": "./images/6.jpg",
        "modelIdx": 0
    }
];

const kilnGeographyData = [
    {
        "id": "ru",
        "modelIdx": 1,
        "name": "汝窑 · 宝丰清凉寺",
        "province": "河南 · 平顶山宝丰",
        "x": 45,
        "y": 44,
        "capitalTarget": [
            61,
            38
        ],
        "era": "北宋晚期 (哲宗、徽宗朝)",
        "mineral": "汝州盛产天然玛瑙矿与优质高岭土，以玛瑙微末入釉，使天青釉质失透如凝脂，晶润似玉。",
        "masterpiece": "汝窑天青无纹水仙盆、天青釉莲花式温碗",
        "status": "宋代五大名窑之首 · 冠绝古今"
    },
    {
        "id": "guan-bei",
        "modelIdx": 0,
        "name": "北宋官窑 · 汴京御窑",
        "province": "河南 · 开封汴梁",
        "x": 61,
        "y": 38,
        "capitalTarget": [
            61,
            38
        ],
        "era": "北宋政和、宣和年间",
        "mineral": "黄河故道沉积黏土，含铁量适宜，烧制出沉稳之紫口铁足，专供宋徽宗内廷祭祀陈设。",
        "masterpiece": "官窑八方弦纹贯耳瓶、穿带壶",
        "status": "皇家御用 · 北宋大内礼器"
    },
    {
        "id": "ding",
        "modelIdx": 2,
        "name": "定窑 · 曲阳涧磁村",
        "province": "河北 · 保定曲阳",
        "x": 57,
        "y": 22,
        "capitalTarget": [
            61,
            38
        ],
        "era": "唐至金代 (北宋鼎盛)",
        "mineral": "太行山麓优质长石与超细高岭土，胎薄坚白如玉，创烧“覆烧法”与芒口镶金银铜扣。",
        "masterpiece": "定窑白釉划花莲纹梅瓶、孩儿枕",
        "status": "宋五大名窑唯一白瓷 · 刻花刚劲流利"
    },
    {
        "id": "jun",
        "modelIdx": 4,
        "name": "钧窑 · 禹州神垕钧台",
        "province": "河南 · 许昌禹州",
        "x": 53,
        "y": 53,
        "capitalTarget": [
            61,
            38
        ],
        "era": "北宋晚期至金元",
        "mineral": "禹州神垕镇特有的孔雀石与红铜矿石，经还原焰窑变析出红、蓝、紫微晶，万彩纷呈。",
        "masterpiece": "钧窑玫瑰紫出戟海棠尊、鼓钉洗",
        "status": "窑变艺术之冠 · 入窑一色出窑万彩"
    },
    {
        "id": "guan-nan",
        "modelIdx": 0,
        "name": "南宋官窑 · 临安修内司",
        "province": "浙江 · 杭州凤凰山/乌龟山",
        "x": 76,
        "y": 55,
        "capitalTarget": [
            76,
            55
        ],
        "era": "南宋 (1127–1279)",
        "mineral": "杭州凤凰山紫金土含铁量高达5%，形成典型薄胎厚釉与紫黑铁足，釉层达三至四层之多。",
        "masterpiece": "修内司官窑八方贯耳瓶、冰裂纹盘口瓶",
        "status": "南渡文脉正统 · 极简宫廷规制"
    },
    {
        "id": "ge",
        "modelIdx": 3,
        "name": "哥窑 · 龙泉/临安传世窑",
        "province": "浙江 · 龙泉大窑与临安",
        "x": 76,
        "y": 68,
        "capitalTarget": [
            76,
            55
        ],
        "era": "宋代 (公元 960–1279)",
        "mineral": "深铁褐色高含铁量胎土，配合高膨胀系数石灰碱釉，形成大黑小黄的“金丝铁线”开片绝艺。",
        "masterpiece": "哥窑金丝铁线胆式瓶、双鱼耳炉",
        "status": "宋代五大名窑之一 · 天工开裂之美"
    },
    {
        "id": "jingdezhen",
        "modelIdx": 6,
        "name": "御窑 · 景德镇珠山御器厂",
        "province": "江西 · 景德镇昌江",
        "x": 63,
        "y": 64,
        "capitalTarget": [
            76,
            55
        ],
        "era": "宋元明清历代名窑",
        "mineral": "麻仓高岭土与瑶里瓷石“二元配方”，耐1300℃高温不变形，苏麻离青发色浓艳苍翠。",
        "masterpiece": "明宣德青花缠枝莲玉壶春瓶、宋影青梅瓶",
        "status": "天下瓷都 · 汇聚华夏制瓷万象"
    },
    {
        "id": "jian",
        "modelIdx": 5,
        "name": "建窑 · 建阳水吉芦花坪",
        "province": "福建 · 南平建阳",
        "x": 70,
        "y": 80,
        "capitalTarget": [
            76,
            55
        ],
        "era": "宋代 (公元 960–1279)",
        "mineral": "富屯溪流域深黑铁红土，含铁量达8%以上，耐急冷骤热，最宜宋代文人点茶斗茶。",
        "masterpiece": "曜变天目茶盏、银兔毫斗茶盏",
        "status": "宋代茶道第一圣器 · 海上丝路名品"
    },
    {
        "id": "yaozhou",
        "modelIdx": 1,
        "name": "耀州窑 · 铜川黄堡镇",
        "province": "陕西 · 铜川黄堡",
        "x": 36,
        "y": 38,
        "capitalTarget": [
            61,
            38
        ],
        "era": "唐至金代 (北宋极盛)",
        "mineral": "漆水河流域富铝黏土，釉面呈透明度极高的橄榄青色，半刀泥刻花犀利刚劲。",
        "masterpiece": "耀州窑青釉刻花缠枝牡丹纹碗、倒装壶",
        "status": "北方青瓷之冠 · 巧夺天工刻花第一"
    },
    {
        "id": "cizhou",
        "modelIdx": 8,
        "name": "磁州窑 · 邯郸磁县观台",
        "province": "河北 · 邯郸磁县",
        "x": 54,
        "y": 28,
        "capitalTarget": [
            61,
            38
        ],
        "era": "北宋至金元",
        "mineral": "太行山麓大黑黏土，创制白色化妆土护胎，以铁黑料直接绘水墨书画。",
        "masterpiece": "磁州窑白地黑花人物故事枕、龙凤纹梅瓶",
        "status": "古代北方民窑集大成 · 水墨瓷画之祖"
    },
    {
        "id": "jizhou",
        "modelIdx": 5,
        "name": "吉州窑 · 吉安永和镇",
        "province": "江西 · 吉安永和",
        "x": 62,
        "y": 72,
        "capitalTarget": [
            76,
            55
        ],
        "era": "晚唐五代至宋元",
        "mineral": "赣江流域砂质红土，创造性将天然木叶与民间剪纸烧入黑釉之中。",
        "masterpiece": "吉州窑木叶纹天目盏、剪纸贴花三凤纹碗",
        "status": "禅宗天目绝艺 · 木叶飞花千年长青"
    },
    {
        "id": "dehua",
        "modelIdx": 10,
        "name": "德化窑 · 泉州德化",
        "province": "福建 · 泉州德化",
        "x": 75,
        "y": 78,
        "capitalTarget": [
            76,
            55
        ],
        "era": "宋元明清",
        "mineral": "高白度氧化钾软质高岭土，烧出乳白温润如象牙之“中国白 (Blanc de Chine)”。",
        "masterpiece": "何朝宗制白釉观音坐像、达摩渡海像",
        "status": "东方艺术明珠 · 欧洲王室竞相典藏"
    },
    {
        "id": "yue",
        "modelIdx": 7,
        "name": "越窑 · 绍兴上虞/慈溪",
        "province": "浙江 · 绍兴慈溪上林湖",
        "x": 78,
        "y": 56,
        "capitalTarget": [
            76,
            55
        ],
        "era": "东汉至宋代 (晚唐五代鼎盛)",
        "mineral": "曹娥江流域富铁硅酸盐，高温还原焰烧出如冰似玉之“秘色瓷”。",
        "masterpiece": "法门寺地宫出土秘色瓷八棱净水瓶、越窑青瓷瓜棱壶",
        "status": "青瓷始祖 · 九秋风露越窑开"
    },
    {
        "id": "xing",
        "modelIdx": 11,
        "name": "邢窑 · 邢台内丘/临城",
        "province": "河北 · 邢台内丘",
        "x": 55,
        "y": 24,
        "capitalTarget": [
            61,
            38
        ],
        "era": "隋唐五代",
        "mineral": "内丘优质高硅透光瓷土，大唐盛世确立“南青北白”之北方白瓷领袖。",
        "masterpiece": "邢窑白瓷“盈”字款执壶、卷唇带把执壶",
        "status": "大唐白瓷发祥地 · 如银类雪天下尊"
    },
    {
        "id": "changsha",
        "modelIdx": 11,
        "name": "长沙窑 · 望城铜官镇",
        "province": "湖南 · 长沙铜官",
        "x": 48,
        "y": 68,
        "capitalTarget": [
            76,
            55
        ],
        "era": "中晚唐五代",
        "mineral": "湘江河滩红黏土，首创釉下褐绿彩绘与诗文题字，黑石号沉船外销主力。",
        "masterpiece": "黑石号沉船出水釉下彩绘执壶、诗文瓷壶",
        "status": "海上丝路外销之王 · 釉下彩绘始祖"
    },
    {
        "id": "yixing",
        "modelIdx": 8,
        "name": "宜兴窑 · 无锡宜兴丁蜀",
        "province": "江苏 · 无锡宜兴",
        "x": 74,
        "y": 50,
        "capitalTarget": [
            76,
            55
        ],
        "era": "明代至今",
        "mineral": "黄龙山特有紫泥、本山绿泥、红泥，透气不透水，最宜聚茶香。",
        "masterpiece": "供春树瘿壶、时大彬紫砂提梁壶",
        "status": "天下紫砂第一名都 · 文人文人壶道极峰"
    }
];

const workshopSteps = [
    {
        "id": 1,
        "category": "土之篇 · 采土选料",
        "icon": "fa-mountain-sun",
        "title": {
            "zh": "深山穿石 · 采土选料",
            "en": "Mining Kaolin & Stone"
        },
        "desc": {
            "zh": "深入深山矿脉采撷上乘高岭土与瓷石，严格甄选二氧化硅与氧化铝比例适宜的原矿，这是瓷器筋骨之根本。",
            "en": "Mining premium kaolin and petuntse to ensure optimal silica and alumina mineral balance."
        },
        "img": "./images/5.jpg"
    },
    {
        "id": 2,
        "category": "水之篇 · 水车舂粉",
        "icon": "fa-gears",
        "title": {
            "zh": "水碓舂粉 · 碎石成面",
            "en": "Water-Powered Pulverizing"
        },
        "desc": {
            "zh": "引清冽溪水驱动巨型木水碓，日夜不停舂砸坚硬瓷石成极细石粉，不耗人力而力透千钧。",
            "en": "Harnessing mountain water flow to drive wooden stamp mills, pulverizing stones into powder."
        },
        "img": "./images/3.jpg"
    },
    {
        "id": 3,
        "category": "水之篇 · 淘洗澄淀",
        "icon": "fa-water",
        "title": {
            "zh": "淘洗澄淀 · 阴窖陈腐",
            "en": "Purification & Aging"
        },
        "desc": {
            "zh": "多次经水池淘洗澄淀去杂质，随后将泥料置于避光阴湿窑窖中陈腐数月乃至数年，使泥性柔韧如膏。",
            "en": "Multiple elutriation baths followed by cellar aging to enhance clay plasticity."
        },
        "img": "./images/4.jpg"
    },
    {
        "id": 4,
        "category": "土之篇 · 百炼成泥",
        "icon": "fa-hand",
        "title": {
            "zh": "菊花推揉 · 彻底排气",
            "en": "Clay Kneading"
        },
        "desc": {
            "zh": "运用“菊花揉”与“羊角揉”手法，经数百次手工推揉折叠，彻底排出微小气泡，确保受热不炸裂。",
            "en": "Manual kneading in chrysanthemum patterns to eliminate microscopic air bubbles."
        },
        "img": "./images/8.jpg"
    },
    {
        "id": 5,
        "category": "器之篇 · 旋转生形",
        "icon": "fa-circle-notch",
        "title": {
            "zh": "轮盘拉坯 · 指尖乾坤",
            "en": "Wheel Throwing"
        },
        "desc": {
            "zh": "在飞速旋转的陶轮上，匠人以十指感知泥料厚薄，一呼一吸间提拉出瓶、尊、盘、碗之曼妙曲线。",
            "en": "Master potters shape vessels on spinning wheels by fingertip intuition."
        },
        "img": "./images/9.jpg"
    },
    {
        "id": 6,
        "category": "器之篇 · 阴干定骨",
        "icon": "fa-temperature-low",
        "title": {
            "zh": "自然阴干 · 稳固定型",
            "en": "Gentle Shade Drying"
        },
        "desc": {
            "zh": "成形生坯不可曝晒，须置于阴凉通风木架上缓缓自然阴干，待水分匀速蒸发至半干革质状态。",
            "en": "Gradual shaded drying to avoid structural warping and prepare for trimming."
        },
        "img": "./images/10.jpg"
    },
    {
        "id": 7,
        "category": "器之篇 · 削骨雕琢",
        "icon": "fa-pen-nib",
        "title": {
            "zh": "修光利坯 · 削泥如玉",
            "en": "Trimming & Smoothing"
        },
        "desc": {
            "zh": "以锋利刀具修削内外壁、挖削底足，使器物薄厚如一、重心极稳，口沿锐利规整。",
            "en": "Precision trimming of leather-hard bodies to achieve uniform walls and calibrated balance."
        },
        "img": "./images/11.jpg"
    },
    {
        "id": 8,
        "category": "器之篇 · 半刀刻画",
        "icon": "fa-paintbrush",
        "title": {
            "zh": "刻划剔花 · 半刀泥韵",
            "en": "Carving & Sgraffito"
        },
        "desc": {
            "zh": "以斜锋竹刀在坯体上深刻牡丹、莲瓣、婴戏纹，深浅有致，施釉后积釉处青翠立体如水墨。",
            "en": "Carving and incising lotus petals and motifs, creating depth under translucent glazes."
        },
        "img": "./images/13.jpg"
    },
    {
        "id": 9,
        "category": "器之篇 · 翠色成衣",
        "icon": "fa-brush",
        "title": {
            "zh": "荡釉浸釉 · 矿浆成衣",
            "en": "Glaze Application"
        },
        "desc": {
            "zh": "以松木灰配合长石、玛瑙末调配天然矿物釉，采用荡釉、浸釉、吹釉多道工序，确保釉层厚如凝脂。",
            "en": "Applying mineral and agate glazes through dipping, swirling, and blowing."
        },
        "img": "./images/15.jpg"
    },
    {
        "id": 10,
        "category": "火之篇 · 入匣封窑",
        "icon": "fa-box-archive",
        "title": {
            "zh": "入匣叠装 · 隔烟保洁",
            "en": "Sagger Stacking"
        },
        "desc": {
            "zh": "将施釉坯体装入特制耐火泥匣钵中，一器一钵密封叠放，隔绝松柴飞灰烟火，保证釉面光洁无瑕。",
            "en": "Sealing glazed wares into individual refractory saggers to prevent ash contamination."
        },
        "img": "./images/2.jpg"
    },
    {
        "id": 11,
        "category": "火之篇 · 烈焰涅槃",
        "icon": "fa-fire-flame-curved",
        "title": {
            "zh": "龙窑柴烧 · 还原千度",
            "en": "Dragon Kiln Firing"
        },
        "desc": {
            "zh": "依山构筑数十米龙窑，投松柴经1300℃高温还原焰烧造三日三夜，铁元素在缺氧气氛中化为幽雅青翠。",
            "en": "Wood-firing at 1300°C reduction flame inside dragon kilns for days and nights."
        },
        "img": "./images/7.jpg"
    },
    {
        "id": 12,
        "category": "火之篇 · 出窑开片",
        "icon": "fa-gem",
        "title": {
            "zh": "退温出窑 · 冰裂惊绝",
            "en": "Cooling & Crackle Formation"
        },
        "desc": {
            "zh": "窑门微开降温时，胎釉膨胀应力激烈交织，釉层在静夜中传来清脆冰裂声，金丝铁线自然天成。",
            "en": "Sudden temperature drop triggers thermal stress, producing celestial crackle sounds and patterns."
        },
        "img": "./images/1.jpg"
    }
];

const traditionalColors = [
    {
        "name": "雨过天青",
        "pinyin": "Tiān Qīng",
        "hex": "#8FB8C0",
        "glazeKey": "tianqing",
        "rgb": "143, 184, 192",
        "dynasty": "北宋 · 汝官窑",
        "quote": "雨过天青云破处，这般颜色做将来",
        "desc": "淡雅纯澈，蓝中含绿，宛如暴雨初霁后的晴空，宋徽宗推崇的道家清静无为至高色。"
    },
    {
        "name": "粉青如翠",
        "pinyin": "Fěn Qīng",
        "hex": "#7EAF9B",
        "glazeKey": "fenqing",
        "rgb": "126, 175, 155",
        "dynasty": "南宋 · 龙泉窑/官窑",
        "quote": "巧剜明月染春水，轻旋薄冰盛绿云",
        "desc": "青绿温润，失透如脂，如初春江南新柳，代表了南宋审美对翡翠玉质感的极致追求。"
    },
    {
        "name": "梅子青翠",
        "pinyin": "Méi Zǐ Qīng",
        "hex": "#5E977E",
        "glazeKey": "fenqing",
        "rgb": "94, 151, 126",
        "dynasty": "南宋 · 龙泉名窑",
        "quote": "雾散江南青滴翠，梅子熟时水如碧",
        "desc": "南宋龙泉窑青瓷釉色巅峰。多次施釉并在窑炉中精准强还原，釉层厚如凝脂，青翠欲滴。"
    },
    {
        "name": "月白莹霜",
        "pinyin": "Yuè Bái",
        "hex": "#D2DFE5",
        "glazeKey": "yuebai",
        "rgb": "210, 223, 229",
        "dynasty": "宋代 · 官窑/钧窑",
        "quote": "素娥梳洗新妆罢，一捧霜辉映碧霄",
        "desc": "白中隐现极淡的天蓝与冷青，如中秋冰轮洒落清光，高洁素雅，冷冽幽然。"
    },
    {
        "name": "定窑牙白",
        "pinyin": "Yá Bái",
        "hex": "#EDE4D1",
        "glazeKey": "dingbai",
        "rgb": "237, 228, 209",
        "dynasty": "北宋 · 定窑",
        "quote": "白如玉，明如镜，薄如纸，声如磬",
        "desc": "温润的米白与象牙色，非现代纯白之冷硬，泛有羊脂暖光，内蕴谦谦君子之风。"
    },
    {
        "name": "永乐甜白",
        "pinyin": "Tián Bái",
        "hex": "#F7F4EB",
        "glazeKey": "dingbai",
        "rgb": "247, 244, 235",
        "dynasty": "明永乐 · 御窑",
        "quote": "白如凝脂，素犹积雪，抚之怡神",
        "desc": "永乐御窑创烧的半脱胎白瓷极品。白糖般温润甘甜，迎光透视如红霞微映，名动天下。"
    },
    {
        "name": "玫瑰紫霞",
        "pinyin": "Méi Guī Zǐ",
        "hex": "#7A2E53",
        "glazeKey": "junhong",
        "rgb": "122, 46, 83",
        "dynasty": "宋元 · 禹州钧窑",
        "quote": "绿翠泛红霞万缕，晓峰突现紫云翻",
        "desc": "铜元素在高温还原气氛下的瑰丽窑变，如夕阳晚霞坠入深潭，红紫交相辉映，万千气象。"
    },
    {
        "name": "曜变建黑",
        "pinyin": "Yào Biàn Hēi",
        "hex": "#1B1718",
        "glazeKey": "jianhei",
        "rgb": "27, 23, 24",
        "dynasty": "宋代 · 建窑",
        "quote": "兔毫紫瓯新，蟹眼清泉煮",
        "desc": "深邃无底的铁胎黑釉，流淌出金银兔毫与曜变光斑，宋代文人点茶斗茶最宜衬托白色汤花。"
    },
    {
        "name": "幽菁青花",
        "pinyin": "Qīng Huā",
        "hex": "#22487A",
        "glazeKey": "qinghua",
        "rgb": "34, 72, 122",
        "dynasty": "元明 · 景德镇御窑",
        "quote": "白釉青花一火成，花从釉里透分明",
        "desc": "苏麻离青料发色幽深苍翠，浓聚处微凹下陷为铁锈斑，青白相映，为华夏瓷器之世界名片。"
    },
    {
        "name": "弘治娇黄",
        "pinyin": "Jiāo Huáng",
        "hex": "#E8B943",
        "glazeKey": "dingbai",
        "rgb": "232, 185, 67",
        "dynasty": "明弘治 · 御窑",
        "quote": "娇黄如蒸栗，至纯皇家色",
        "desc": "以氧化铁为着色剂在素胎上浇淋低温烧成，鸡油黄般鲜亮娇嫩，历朝黄釉中以弘治为冠。"
    },
    {
        "name": "宣德祭蓝",
        "pinyin": "Jì Lán",
        "hex": "#1C315E",
        "glazeKey": "qinghua",
        "rgb": "28, 49, 94",
        "dynasty": "明宣德 · 御窑",
        "quote": "一泓海水澄如练，祭天礼神穆且严",
        "desc": "高温钴蓝单色釉，色泽深沉幽雅宛如浩瀚深海，釉面不流不裂，为明清皇家祭天典礼重器。"
    },
    {
        "name": "豇豆红韵",
        "pinyin": "Jiāng Dòu Hóng",
        "hex": "#B8585D",
        "glazeKey": "junhong",
        "rgb": "184, 88, 93",
        "dynasty": "清康熙 · 御窑",
        "quote": "绿如春水初生日，红似朝霞欲上时",
        "desc": "铜红名品，红中微隐绿苔黑斑，宛若红豇豆之皮，又称“美人醉”，极其名贵。"
    },
    {
        "name": "郎窑深红",
        "pinyin": "Láng Yáo Hóng",
        "hex": "#8C1D24",
        "glazeKey": "junhong",
        "rgb": "140, 29, 36",
        "dynasty": "清康熙 · 督陶官郎廷极",
        "quote": "明如镜，润如玉，赤如血",
        "desc": "仿明宣德宝石红创烧。釉色深艳如初凝牛血，透亮清澈，口沿出白线（灯草口），底足不过足。"
    },
    {
        "name": "雍正胭脂",
        "pinyin": "Yān Zhi Shuǐ",
        "hex": "#C94B69",
        "glazeKey": "junhong",
        "rgb": "201, 75, 105",
        "dynasty": "清雍正 · 御窑",
        "quote": "胭脂一抹微匀透，不施粉黛胜桃花",
        "desc": "引进西洋黄金为着色剂的金红釉。娇美柔嫩，如仕女脸庞薄施胭脂水，为雍正朝独绝名品。"
    },
    {
        "name": "茶叶末釉",
        "pinyin": "Chá Yè Mò",
        "hex": "#5E5839",
        "glazeKey": "fenqing",
        "rgb": "94, 88, 57",
        "dynasty": "清雍正乾隆 · 御窑",
        "quote": "蟹甲清绿隐微芒，秋深草木露如霜",
        "desc": "铁镁质结晶黄绿交错，温润似沉香古木，古朴深沉，极富文人案头雅意。"
    },
    {
        "name": "孔雀翠绿",
        "pinyin": "Kǒng Què Lǜ",
        "hex": "#1E6F74",
        "glazeKey": "tianqing",
        "rgb": "30, 111, 116",
        "dynasty": "清康熙 · 御窑",
        "quote": "法翠生华光艳烈，翠屏展羽映青漪",
        "desc": "铜中低温碱性釉，色如孔雀之羽毛翠亮明艳，玻璃质感强烈，开细密鱼子碎纹，光彩照人。"
    }
];

const literatiArts = [
    {
        "id": "incense",
        "title": "焚香 · 氤氲道境",
        "icon": "fa-smog",
        "vessel": "南宋官窑弦纹三足鬲式炉 / 汝窑天青奉华尊",
        "quote": "红袖添香夜读书，闲坐幽室悟浮生",
        "classicSource": "陈敬《陈氏香谱》· 宋代隔火熏香制",
        "desc": "宋人焚香摒弃唐代直烧浓烈，崇尚“隔火煎香”——以银叶或云母片隔绝炭火，炙烤沉水香、龙脑香，但见缕缕幽香而不见烟火。官窑鬲式炉紫口铁足、釉润如玉，置于琴案之侧，香雾升腾间涤荡尘虑、格物致知。"
    },
    {
        "id": "tea",
        "title": "点茶 · 击拂雪涛",
        "icon": "fa-mug-hot",
        "vessel": "建阳水吉曜变兔毫盏 / 北宋定窑白釉茶盏",
        "quote": "矮纸闲行极草草，晴窗细乳戏分茶",
        "classicSource": "宋徽宗赵佶《大观茶论》· 七汤点茶法",
        "desc": "两宋茶道以团茶碾罗、汤瓶注水、茶筅击拂为极雅。茶汤随手腕运筅渐生“咬盏”雪沫乳花，高明者更以水痕汤花在黑釉建盏中幻化出山水飞禽，谓之“茶百戏（水丹青）”。玄黑兔毫盏与纯白汤花相映成趣，见天地黑白本真。"
    },
    {
        "id": "flower",
        "title": "插花 · 一枝见春",
        "icon": "fa-seedling",
        "vessel": "北宋定窑划花梅瓶 / 传世哥窑金丝铁线胆瓶",
        "quote": "忽见寒梅一枝发，雪中芳意寄谁人",
        "classicSource": "欧阳修《洛阳牡丹记》· 理念花清供",
        "desc": "不同于唐代富丽堂皇的牡丹满插，宋代文人插花尚“清、疏、瘦、雅”之理念花。梅瓶小口修颈以敛水气，胆瓶垂腹稳重以承斜枝，仅取寒梅一枝、翠竹两叶斜逸而出，于书斋素壁投下疏影横斜，万物静观皆自得。"
    },
    {
        "id": "painting",
        "title": "挂画 · 幽游心印",
        "icon": "fa-scroll",
        "vessel": "汝窑天青椭圆水仙盆 / 官窑八方贯耳瓶",
        "quote": "远山含黛树笼雾，虚室明窗对古图",
        "classicSource": "郭熙《林泉高致》· 可行可望可游可居",
        "desc": "宋代雅集之中，主宾围坐品评前贤水墨山水手卷与法帖。案头陈设天青笔洗、粉青水盂与哥窑镇纸，画中云林烟岫与案上青瓷冰裂纹相映成趣，不出户牖而坐穷泉壑，构建了东方士人超然物外的精神桃花源。"
    }
];

const archivePorcelains = [
    {
        "id": 1,
        "dynastyKey": "song",
        "modelIdx": 0,
        "name": "南宋 · 官窑天青冰裂纹长颈瓶",
        "kiln": "南宋官窑 · 杭州修内司/郊坛下",
        "level": "国家一级甲等典藏神品",
        "size": "通高 34.0 cm · 口径 8.5 cm · 腹径 21.6 cm",
        "img": "./images/collection/porcelain_01.jpg",
        "tags": [
            "紫口铁足",
            "百极碎冰裂",
            "薄胎厚釉",
            "南宋大内礼器"
        ],
        "desc": "盘口修颈，腹部丰满下垂，底部圈足露紫黑铁胎。通体层层施粉青厚釉，冰裂纹如寒江碎玉，立体感极强，为大都会艺术博物馆珍藏之宋代官窑标准器。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "26.292.74"
    },
    {
        "id": 2,
        "dynastyKey": "song",
        "modelIdx": 2,
        "name": "北宋 · 定窑牙白划花萱草纹葵口盘",
        "kiln": "定窑 · 河北曲阳涧磁村",
        "level": "宋韵白瓷极简典范",
        "size": "高 3.2 cm · 口径 16.8 cm · 足径 5.8 cm",
        "img": "./images/collection/porcelain_02.jpg",
        "tags": [
            "覆烧芒口",
            "象牙白暖釉",
            "竹刀划花",
            "金扣镶沿"
        ],
        "desc": "六瓣葵花口，敞口斜壁。胎白坚致如玉，器内以竹刀流利刻划萱草纹，釉色温润泛象牙黄，外壁微见泪痕垂流，尽显北宋文人内敛之雅。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "1991.253.18"
    },
    {
        "id": 3,
        "dynastyKey": "song",
        "modelIdx": 4,
        "name": "北宋 · 钧官窑天蓝釉鼓钉三足洗",
        "kiln": "钧窑 · 河南禹州神垕钧台",
        "level": "宋代五大名窑瑰宝",
        "size": "高 6.5 cm · 口径 10.5 cm",
        "img": "./images/collection/porcelain_03.jpg",
        "tags": [
            "天蓝乳浊",
            "蚯蚓走泥",
            "窑变微晶",
            "宫廷陈设"
        ],
        "desc": "敛口深腹，施乳浊天蓝厚釉，釉面莹润失透如静夜碧空。胎体厚重坚实，釉汁在高温熔融流动中自然形成“蚯蚓走泥纹”，古朴沉穆。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "20.170.1"
    },
    {
        "id": 4,
        "dynastyKey": "song",
        "modelIdx": 9,
        "name": "南宋 · 龙泉窑粉青釉金缮胆瓶",
        "kiln": "龙泉窑 · 浙江龙泉大窑",
        "level": "宋代青瓷极品传世重器",
        "size": "通高 29.7 cm · 口径 5.6 cm · 足径 8.2 cm",
        "img": "./images/collection/porcelain_04.jpg",
        "tags": [
            "粉青如翠",
            "金缮惜物",
            "出筋露白",
            "海上丝路"
        ],
        "desc": "直口修颈，垂腹稳重。通体施厚润粉青釉，玉质感极强。器口与腹部经百年传世带有古金缮修复金线，天工与人工交相辉映，尽显惜物美学。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "1992.165.18"
    },
    {
        "id": 5,
        "dynastyKey": "song",
        "modelIdx": 5,
        "name": "宋代 · 建窑黑釉兔毫斗茶盏",
        "kiln": "建窑 · 福建建阳水吉芦花坪",
        "level": "宋代茶道第一圣器",
        "size": "高 6.4 cm · 口径 11.7 cm · 足径 4.0 cm",
        "img": "./images/collection/porcelain_05.jpg",
        "tags": [
            "银兔毫",
            "重铁黑胎",
            "束口注汤",
            "釉泪垂珠"
        ],
        "desc": "束口深腹，露黑色含铁重胎。深邃黑釉中自然析出如根根银兔毫之结晶条纹，宋代文人点茶斗茶最宜衬托白色茶沫（汤花），为茶禅一味之具象化体现。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "29.100.226"
    },
    {
        "id": 6,
        "dynastyKey": "song",
        "modelIdx": 5,
        "name": "宋代 · 吉州窑剪纸贴花梅花纹天目盏",
        "kiln": "吉州窑 · 江西吉安永和镇",
        "level": "民间窑变与剪纸巧思之极",
        "size": "高 6.7 cm · 口径 12.7 cm",
        "img": "./images/collection/porcelain_06.jpg",
        "tags": [
            "剪纸贴花",
            "玳瑁斑",
            "木叶禅心",
            "民间天工"
        ],
        "desc": "敞口斜壁小圈足。巧妙运用民间剪纸艺术，在黑釉之上以草木灰釉贴饰梅花纹样，经窑火烧造显现出黄褐相间的梅花绽放之姿，空灵超尘。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "29.100.228"
    },
    {
        "id": 7,
        "dynastyKey": "song",
        "modelIdx": 8,
        "name": "金元 · 磁州窑白地黑花道家人物山水八角枕",
        "kiln": "磁州窑 · 河北磁县观台镇",
        "level": "北方民窑水墨文人意趣巅峰",
        "size": "高 15.9 cm · 宽 18.7 cm · 长 43.5 cm",
        "img": "./images/collection/porcelain_07.jpg",
        "tags": [
            "白地黑花",
            "水墨画风",
            "道家纳凉",
            "磁州开阔"
        ],
        "desc": "八角如意形陶枕，通身以白色化妆土为底，用铁黑料挥洒水墨画虎与道家人物泛舟山水，线条刚健洒脱，既是生活实用清凉夏枕，又是民间文博墨宝。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "2009.288"
    },
    {
        "id": 8,
        "dynastyKey": "song",
        "modelIdx": 1,
        "name": "北宋 · 耀州窑青釉印花婴戏缠枝纹碗",
        "kiln": "耀州窑 · 陕西铜川黄堡镇",
        "level": "北方刻花青瓷冠绝天下之器",
        "size": "高 6.0 cm · 口径 18.1 cm",
        "img": "./images/collection/porcelain_08.jpg",
        "tags": [
            "橄榄青翠",
            "印花婴戏",
            "半刀泥刻花",
            "犀利刚劲"
        ],
        "desc": "撇口小足，通体满施晶莹剔透之橄榄青釉。碗内以精工模印缠枝牡丹与嬉戏双童，纹饰立体浮突，积釉处青翠欲滴，刻纹锐利如刀削。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "11.165.1"
    },
    {
        "id": 9,
        "dynastyKey": "song",
        "modelIdx": 7,
        "name": "北宋 · 景德镇湖田窑影青镂雕执壶",
        "kiln": "景德镇窑 · 江西景德镇湖田窑",
        "level": "宋代影青温润如玉标准器",
        "size": "高 18.1 cm · 腹径 11.7 cm",
        "img": "./images/collection/porcelain_09.jpg",
        "tags": [
            "温润影青",
            "薄胎透光",
            "流线执柄",
            "宋人酌酒"
        ],
        "desc": "小口带盖，细长弯流如凤颈，弓形执柄挺拔。通体施青白釉，光致透影，白中含青，青中泛白，宛若雨后青天微云，宋人雅集斟酒宴饮之绝品。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "16.50"
    },
    {
        "id": 10,
        "dynastyKey": "yuan",
        "modelIdx": 6,
        "name": "元代 · 景德镇窑青花花鸟缠枝纹大罐",
        "kiln": "御器厂前身 · 浮梁瓷局",
        "level": "元青花丝路航海雄浑代表",
        "size": "高 34.3 cm · 腹径 28.9 cm · 口径 14.3 cm",
        "img": "./images/collection/porcelain_10.jpg",
        "tags": [
            "苏麻离青",
            "铁锈结晶",
            "元代浑厚",
            "海上丝绸之路"
        ],
        "desc": "唇口短颈，溜肩圆腹。器身以进口苏麻离青钴料大写意绘制缠枝花卉与灵动虫鸟，青花发色浓烈苍翠，凝聚处深入胎骨呈现金属锡光斑，气魄恢弘。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "2005.15"
    },
    {
        "id": 11,
        "dynastyKey": "ming",
        "modelIdx": 6,
        "name": "明崇祯 · 景德镇青花人物故事图观音尊",
        "kiln": "景德镇民窑巅峰 · 文人瓷画",
        "level": "明末清初文人青花神品",
        "size": "高 44.5 cm · 口径 12.2 cm",
        "img": "./images/collection/porcelain_11.jpg",
        "tags": [
            "分水皴染",
            "戏曲故事",
            "翠毛蓝发色",
            "文人意象"
        ],
        "desc": "撇口束颈，丰肩长筒腹。以高超的“分水五色”青花皴染技法通景通绘传统戏曲故事人物与洞石修竹，青花深浅五色分明，宛若水墨宣纸画卷。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "2010.429"
    },
    {
        "id": 12,
        "dynastyKey": "ming",
        "modelIdx": 10,
        "name": "明成化 · 景德镇御窑斗彩折枝花鸟杯",
        "kiln": "景德镇御器厂 · 成化御制",
        "level": "大明御窑彩瓷极高美学",
        "size": "高 4.5 cm · 口径 7.2 cm",
        "img": "./images/collection/porcelain_12.jpg",
        "tags": [
            "成化斗彩",
            "填彩温和",
            "差紫凝霞",
            "掌心至宝"
        ],
        "desc": "小巧玲珑，胎薄如蝉翼。釉下以幽雅青花勾勒轮廓线，釉上填施红、绿、黄、赭多色软彩，色彩雅致柔和，抚之如婴儿肌肤，历代藏家推崇备至。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "2010.429.2"
    },
    {
        "id": 13,
        "dynastyKey": "ming",
        "modelIdx": 10,
        "name": "明代 · 德化窑白釉达摩坐像 (何朝宗风范)",
        "kiln": "德化窑 · 福建泉州德化",
        "level": "东方艺术瑰宝 · 中国白 (Blanc de Chine)",
        "size": "高 29.8 cm · 宽 19.0 cm · 进深 14.0 cm",
        "img": "./images/collection/porcelain_13.jpg",
        "tags": [
            "中国白",
            "象牙白玉质",
            "衣褶如行云",
            "一代瓷圣"
        ],
        "desc": "达摩祖师广额深目，双手抱膝盘坐，神态入定沉穆。通体施纯净象牙白厚釉，胎釉浑然一体，衣纹折转如吴带当风，将硬质瓷土转化为柔滑丝绸。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "63.176"
    },
    {
        "id": 14,
        "dynastyKey": "tang",
        "modelIdx": 11,
        "name": "唐代 · 盛唐三彩胡人骑马俑",
        "kiln": "巩义窑 / 西安长安南郊窑",
        "level": "大唐万国来朝盛世见证",
        "size": "高 38.1 cm · 宽 10.8 cm · 长 33.7 cm",
        "img": "./images/collection/porcelain_14.jpg",
        "tags": [
            "唐三彩",
            "盛唐气象",
            "丝路文明",
            "低温铅釉窑变"
        ],
        "desc": "陶土烧胎，施黄、绿、白三色铅釉。战马体魄矫健，四蹄驻立，马上骑士深目高鼻、戴幞头，釉彩自然交融流淌，定格大唐丝路万国交融之浩瀚气象。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "54.112"
    },
    {
        "id": 15,
        "dynastyKey": "tang",
        "modelIdx": 11,
        "name": "唐代 · 邢窑白瓷圆唇丰肩短颈罐",
        "kiln": "邢窑 · 河北邢台临城/内丘",
        "level": "“如银似雪”北方白瓷祖庭标准器",
        "size": "高 19.4 cm · 腹径 19.7 cm · 口径 10.2 cm",
        "img": "./images/collection/porcelain_15.jpg",
        "tags": [
            "如银类雪",
            "透影白瓷",
            "南青北白",
            "唐代贡瓷"
        ],
        "desc": "短颈卷唇，丰肩鼓腹，平底无足。胎体细白致密，施纯白透明亮釉，表面光洁如冰雪覆照，与南方越窑青瓷并称“天下无贵贱通用之”。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "2013.921"
    },
    {
        "id": 16,
        "dynastyKey": "qing",
        "modelIdx": 0,
        "name": "清康熙 · 御窑豇豆红釉暗刻蟠螭纹太白尊",
        "kiln": "景德镇御窑 · 康熙藏春书屋文房",
        "level": "清代官窑单色釉最高名品",
        "size": "高 8.7 cm · 腹径 12.9 cm",
        "img": "./images/collection/porcelain_16.jpg",
        "tags": [
            "豇豆红",
            "美人醉",
            "绿苔点点",
            "三团螭龙纹"
        ],
        "desc": "小口微侈，半球形腹如倒扣金钟，底部三团暗刻蟠螭纹。铜红釉在还原气氛中偶泛出微小的天然翠绿苔点，红绿相映，柔和若红霞晨曦，极难烧造。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "91.1.258"
    },
    {
        "id": 17,
        "dynastyKey": "qing",
        "modelIdx": 0,
        "name": "清康熙 · 御窑豇豆红釉文房笔洗",
        "kiln": "景德镇御窑厂",
        "level": "八大码文房案头御供重器",
        "size": "高 3.8 cm · 口径 11.5 cm",
        "img": "./images/collection/porcelain_17.jpg",
        "tags": [
            "案头雅玩",
            "桃花片",
            "大清康熙年制款",
            "铜红胶体微晶"
        ],
        "desc": "敛口宽底，浅圈足平削。全器满施高温铜红胶体釉，色泽粉润如桃花瓣，口沿隐现极细一线白胎（灯草口），底书青花“大清康熙年制”楷书六字款。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "24.80.252"
    },
    {
        "id": 18,
        "dynastyKey": "qing",
        "modelIdx": 2,
        "name": "清康熙 · 御窑五彩穿花龙纹大盘",
        "kiln": "景德镇御窑厂",
        "level": "康熙硬彩五彩皇家重器",
        "size": "口径 32.5 cm · 高 6.2 cm",
        "img": "./images/collection/porcelain_18.jpg",
        "tags": [
            "康熙五彩",
            "硬彩刚健",
            "云龙戏珠",
            "矾红翠绿"
        ],
        "desc": "大口折沿，圈足深厚。盘心以纯正五彩料绘腾云驾雾之五爪云龙戏珠，用笔挺拔刚劲，黑料勾线如铁，矾红与水绿亮丽沉着，盛清皇家威仪跃然盘上。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "14.40.117"
    },
    {
        "id": 19,
        "dynastyKey": "qing",
        "modelIdx": 4,
        "name": "清乾隆 · 御制诗文粉彩山水轿瓶",
        "kiln": "景德镇御器厂 · 督陶官唐英承造",
        "level": "乾隆帝御乘随行陈设珍器",
        "size": "通高 22.9 cm · 宽 11.4 cm · 厚 7.0 cm",
        "img": "./images/collection/porcelain_19.jpg",
        "tags": [
            "御制诗文",
            "乾隆粉彩",
            "御辇挂瓶",
            "金彩锦地"
        ],
        "desc": "背面扁平带穿孔以便悬于皇家轿壁，正面以精细洋彩粉彩绘依山傍水之江南烟岚，中央以金彩与黑料书乾隆御制诗《咏轿瓶》，器物与帝王诗意互构。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "79.2.1157"
    },
    {
        "id": 20,
        "dynastyKey": "qing",
        "modelIdx": 4,
        "name": "清乾隆 · 御窑柠檬黄釉兽首衔环尊",
        "kiln": "景德镇御窑厂",
        "level": "清代宫廷祭地纯色礼器",
        "size": "高 26.5 cm · 口径 14.2 cm",
        "img": "./images/collection/porcelain_20.jpg",
        "tags": [
            "柠檬黄",
            "锑黄低温釉",
            "兽首双耳",
            "清代礼乐"
        ],
        "desc": "仿古青铜尊造型，肩贴双兽面衔环。全器施低温锑黄釉，色泽鲜嫩纯正如新鲜柠檬，釉面极薄而均匀，专用于紫禁城地坛皇家大祭，明亮夺目。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "2019.261"
    },
    {
        "id": 21,
        "dynastyKey": "qing",
        "modelIdx": 2,
        "name": "清乾隆 · 御窑粉彩牡丹草虫图折沿盘",
        "kiln": "景德镇御器厂",
        "level": "清宫造办处画样典范",
        "size": "口径 20.8 cm · 高 4.1 cm",
        "img": "./images/collection/porcelain_21.jpg",
        "tags": [
            "洋彩粉彩",
            "没骨画法",
            "富贵牡丹",
            "宫廷造办处"
        ],
        "desc": "盘面以玻璃白打底，融汇西洋光影明暗技法渲染双色重瓣牡丹与翻飞蜻蜓，花瓣层层晕染，质感立体娇艳欲滴，代表清代彩瓷工艺之极境。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "24.80.198"
    },
    {
        "id": 22,
        "dynastyKey": "ming",
        "modelIdx": 2,
        "name": "明永乐 · 景德镇御窑甜白釉暗花牡丹纹梅瓶",
        "kiln": "景德镇御器厂 · 永乐御制",
        "level": "大明甜白釉冠绝万代之尊",
        "size": "通高 31.8 cm · 口径 5.4 cm · 足径 10.2 cm",
        "img": "./images/collection/porcelain_22.jpg",
        "tags": [
            "甜白釉",
            "半脱胎",
            "暗花划花",
            "永乐国色"
        ],
        "desc": "小口短颈丰肩。胎体极度洁白轻灵，施温润乳白厚釉，有如白糖之晶莹莹洁，腹部暗刻细若蛛丝之缠枝牡丹纹，迎光透视隐现粉红肉光，美如幻梦。",
        "museum": "克利夫兰艺术博物馆 (CMA)",
        "accessionNo": "1947.62"
    },
    {
        "id": 23,
        "dynastyKey": "song",
        "modelIdx": 0,
        "name": "南宋 · 修内司官窑粉青葵瓣口盘",
        "kiln": "南宋官窑 · 杭州凤凰山",
        "level": "南宋行在内廷极品",
        "size": "高 3.5 cm · 口径 17.5 cm",
        "img": "./images/collection/porcelain_23.jpg",
        "tags": [
            "葵瓣折沿",
            "聚沫攒珠",
            "澄泥铁胎",
            "临安内廷"
        ],
        "desc": "葵瓣式折沿撇口，胎薄如纸，釉厚如玉。釉质泛出深邃冷青色，微带稀疏金黄开片，口沿微露紫黑胎色，足底支钉痕清晰，具宋代士大夫超尘风姿。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "25.69.53"
    },
    {
        "id": 24,
        "dynastyKey": "song",
        "modelIdx": 4,
        "name": "北宋 · 钧官窑天蓝釉红斑双系扁壶",
        "kiln": "钧窑 · 河南禹州神垕",
        "level": "宋代窑变极品神物",
        "size": "高 21.2 cm · 腹宽 15.5 cm",
        "img": "./images/collection/porcelain_24.jpg",
        "tags": [
            "双系穿带",
            "红蓝相映",
            "铜红飞霞",
            "钧台极品"
        ],
        "desc": "双系扁圆腹，器身在天蓝纯净底釉之上天然泼洒氧化铜红微晶，出窑时蓝如晴空万里、红似夕阳晚霞飞流直下，展现大自然烈火神工不可预测之天成造化。",
        "museum": "大都会艺术博物馆 (The Met)",
        "accessionNo": "14.60.9"
    }
];

const imperialReignMarks = [
    {
        "id": "ru-fenghua",
        "era": "北宋 · 南宋宫廷后刻",
        "title": "汝窑“奉华”楷书刻款 & 五枚芝麻支钉",
        "type": "宫廷殿阁刻铭 · 满釉支烧",
        "sealText": [
            "奉",
            "华"
        ],
        "style": "carved",
        "color": "#8FB8C0",
        "desc": "北宋汝官窑多满釉裹足支烧，器底仅留三至六枚细小如芝麻的支钉痕，微露香灰胎。南宋高宗刘贵妃居德寿宫“奉华堂”，命内侍于钟爱的北宋汝官窑器底镌刻“奉华”二字并填红，成为衡量清宫旧藏顶级汝瓷的千古铁证。"
    },
    {
        "id": "jun-numeral",
        "era": "北宋晚期 · 禹州钧台官窑",
        "title": "官钧窑“一”至“十”底部数字刻款",
        "type": "皇家陈设器形体大小编号制",
        "sealText": [
            "壹",
            "号"
        ],
        "style": "incised",
        "color": "#8c2d5c",
        "desc": "北宋钧官窑海棠尊、出戟尊、鼓钉洗等皇家花器底部，常刷一层褐色护胎“芝麻酱釉”，并在烧前刻划“一”至“十”汉字数字。数字越小器型越宏大（“一”号最大，“十”号最小），体现北宋内廷严密的模件化烧造标准。"
    },
    {
        "id": "yongle-seal",
        "era": "明永乐 (1403–1424)",
        "title": "“永乐年制”四字篆书椎拱暗款",
        "type": "中国首个帝王年号官窑款识",
        "sealText": [
            "永乐",
            "年制"
        ],
        "style": "seal-round",
        "color": "#c9372c",
        "desc": "明成祖朱棣永乐朝开创了在御窑瓷器上题写本朝帝王年号之先河。常见于甜白釉压手杯内底心，由大明书法第一才子沈度题写四字篆书，字体圆润典雅，开启了明清两代五百年官窑纪年款之规制。"
    },
    {
        "id": "xuande-mark",
        "era": "明宣德 (1426–1435)",
        "title": "“大明宣德年制”双圈六字楷书青花款",
        "type": "宣德款遍器身 · 苏麻离青写款",
        "sealText": [
            "大明宣",
            "德年制"
        ],
        "style": "blue-circle",
        "color": "#1e4682",
        "desc": "古谚云“宣德款识满器身”，依器型不同书于底足、口沿、肩部或内心。以进口苏麻离青料书写颜体楷书，笔力刚劲雄浑，“德”字心上常省去一横，浓笔处伴有天然铁锈结晶斑，后世历朝争相摹写。"
    },
    {
        "id": "chenghua-mark",
        "era": "明成化 (1465–1487)",
        "title": "“大明成化年制”双方框六字楷书款",
        "type": "宪宗御笔稚拙体 · 平等青写款",
        "sealText": [
            "大明成",
            "化年制"
        ],
        "style": "blue-square",
        "color": "#2b5b9e",
        "desc": "成化斗彩鸡缸杯、三秋杯底部专用双方框六字款。相传出自成化帝朱见深御笔（一说少年碗款），“大”字尖头平捺，“成”字末笔直立如戈，“制”字上丰下俭，看似稚拙却韵味无穷，有“成化款，铁画银钩最难仿”之誉。"
    },
    {
        "id": "qianlong-seal",
        "era": "清雍正 · 乾隆 (1723–1795)",
        "title": "“大清乾隆年制”六字三行篆书图书印款",
        "type": "唐英督陶 · 青花/金彩/蓝料图章款",
        "sealText": [
            "大清乾",
            "隆年制"
        ],
        "style": "cinnabar-square",
        "color": "#b52b24",
        "desc": "清代康雍乾盛世官窑专设“写款良工”，乾隆朝尤重六字三行铁线篆书方印款，结构严整如九叠皇室宝玺。除釉下青花款外，珐琅彩与粉彩重器多施蓝料彩或胭脂红料款，仿宋汝官哥名器则镌刻乾隆御制诗文。"
    }
];

const scholarNotes = [
    {
        "id": "note-1",
        "title": "浅论宋代官窑“紫口铁足”之矿物成因与美学隐喻",
        "date": "2026年研考专论 · 第01期",
        "author": "华夏器道数字文博实验室 · 硅酸盐物理组",
        "category": "材料与成型物理",
        "readTime": "6 分钟深读",
        "excerpt": "宋代官窑胎料中含有高达 3.5%–5% 的氧化铁（Fe₂O₃）。在利坯成型时，口沿锐角处釉药在1300℃高温下因重力和表面张力自然下垂变薄，微透出深褐胎色，此为“紫口”；而圈足刮釉露胎，经窑炉余温二次氧化呈现铁黑色，称“铁足”。",
        "fullText": "\n            <p class=\"mb-3\"><strong>一、地质矿物背景：杭州凤凰山紫金土的高铁特性</strong><br>两宋之交，南宋朝廷在临安（今杭州）修内司与郊坛下重建官窑。与北方曲阳定窑洁白高铝胎土截然不同，江南临安一带盛产富含赤铁矿与褐铁矿的“紫金土”。经X射线荧光光谱（XRF）实测，南宋官窑黑灰胎中三氧化二铁（Fe₂O₃）的质量分数普遍高达 <strong>3.5% 至 5.2%</strong>，部分标本甚至接近6%。</p>\n            <p class=\"mb-3\"><strong>二、高温流体力学与表面张力：“紫口”的形成机理</strong><br>官窑追求“薄胎厚釉”之玉质感，往往采用素烧后三至四次浸釉、吹釉工艺，器腹釉层厚度可达 1.5–2.2 mm（甚至超过胎壁厚度）。当窑温升至 1230℃–1260℃ 时，石灰碱釉熔融为高粘度硅酸盐液相。在器物口沿曲率半径极小的锐角处，受重力垂流与熔体表面张力（Surface Tension）双重驱动，口沿釉层减薄至 0.2–0.3 mm，高温还原生成的深灰褐胎骨透过半透明青釉隐隐显露，遂成温润含蓄之“紫口”。</p>\n            <p><strong>三、二次氧化与宋儒哲学：“铁足”的审美升华</strong><br>为防止厚釉器物在高温下与匣钵粘连，修内司官窑多采用垫饼托烧并刮去圈足底端釉药。停火开窑降温阶段，空气（O₂）重新进入窑室，滚烫露胎圈足表面的二价铁（FeO）发生剧烈二次氧化生成磁铁矿（Fe₃O₄）与赤铁矿（Fe₂O₃），呈现苍劲如生铁之黑褐色。这一源于材料局限的物理现象，被宋代士大夫赋予“外柔如玉、内刚如铁”的君子人格隐喻。</p>\n        "
    },
    {
        "id": "note-2",
        "title": "金丝铁线与冰裂纹：古瓷冷却热应力开裂动力学解析",
        "date": "2026年研考专论 · 第02期",
        "author": "华夏器道数字文博实验室 · 计算几何组",
        "category": "数字几何与断裂力学",
        "readTime": "8 分钟深读",
        "excerpt": "陶瓷开片本质是胎与釉的热膨胀系数（CTE）失配。当釉层的热膨胀系数大于硅酸盐胎骨时，窑炉降温阶段釉面承受显著双轴拉伸应力，引发主干铁线断裂与次生金丝延迟扩展，构建出天然的 Voronoi 几何应力网格。",
        "fullText": "\n            <p class=\"mb-3\"><strong>一、热膨胀系数失配（CTE Mismatch）定量模型</strong><br>设瓷胎线性热膨胀系数为 $\\alpha_b$，瓷釉线性热膨胀系数为 $\\alpha_g$。在宋代哥窑与官窑体系中，钙钠钾质瓷釉的 $\\alpha_g \\approx 7.2 \\times 10^{-6}\\text{ K}^{-1}$，而紫金土高硅胎骨的 $\\alpha_b \\approx 5.4 \\times 10^{-6}\\text{ K}^{-1}$。当瓷器从 700℃（釉层玻璃化转变温度 $T_g$）冷却至室温 $T_0$ 时，釉层试图比胎体收缩更多，从而在釉层内部积累双轴残余拉应力：$\\sigma_g = \\frac{E_g}{1 - \\nu_g}(\\alpha_g - \\alpha_b)(T_g - T_0)$。</p>\n            <p class=\"mb-3\"><strong>二、一级主裂纹（铁线）与二级亚临界裂纹（金丝）的分时演化</strong><br>当残余拉应力 $\\sigma_g$ 突破硅酸盐玻璃相的断裂韧性阈值 $K_{IC}$ 时，在降温至 220℃–120℃ 区间，釉层瞬间发生脆性贯穿开裂，发出清脆如击冰磬之声，形成贯通器表的粗大一级裂纹网络；古人趁器物尚有余温，浸入炭墨汁或铁盐水，形成深黑沉着之<strong>“铁线”</strong>。出窑后数日至数月间，空气中水分子对裂尖硅氧键（Si-O-Si）产生应力腐蚀，诱发次生微细网纹缓慢扩展并吸附茶汁或黄土铁离子，终成金黄细密之<strong>“金丝”</strong>。</p>\n            <p><strong>三、计算图形学仿真：Voronoi 与格林函数应力松弛</strong><br>在本平台 3D 展馆中，我们通过双层 Voronoi 距离场与一阶凹凸法线贴图（Bump/Normal Mapping），在 WebGL 着色器层真实还原了粗黑主脉与金黄支脉的正交交汇几何特征。</p>\n        "
    },
    {
        "id": "note-3",
        "title": "器以载道：为何当代数字人居仍需宋代单色釉的极简慰藉",
        "date": "2026年研考专论 · 第03期",
        "author": "华夏器道数字文博实验室 · 东方美学组",
        "category": "东方美学与设计哲学",
        "readTime": "5 分钟深读",
        "excerpt": "在信息过载与视觉喧嚣的当代工业社会，宋代单色釉瓷器以其“绚烂之极归于平淡”的克制色彩与黄金曲率，构建了跨越千年的心灵疗愈场域。从汝窑天青到定窑牙白，极简并非匮乏，而是包罗万象后的澄明。",
        "fullText": "\n            <p class=\"mb-3\"><strong>一、色彩的退让与质感的凸显</strong><br>现代工业标准色卡追求高饱和度与绝对均一，而宋代单色釉（雨过天青、粉青、月白、牙白）主动降低了色相饱和度，将视觉焦点让位于光在双层半透明微晶釉层内部的漫反射（Subsurface Scattering）。正如苏轼所言：“发纤秾于简古，寄至味于淡泊。”</p>\n            <p class=\"mb-3\"><strong>二、一条曲线里的宇宙秩序</strong><br>剥离了繁复彩绘的宋瓷，将全部审美张力凝练于器物轮廓的一条S型样条曲线之中：梅瓶如高士独立，玉壶春如水滴将坠，水仙盆如平湖秋月。其高宽比、肩腹比无不暗合黄金分割与流体力学稳定律。</p>\n            <p><strong>三、数字文博的使命：从“隔柜静观”到“格物共鸣”</strong><br>我们研发“华夏器道·天青泥火”平台，正是希望借助 3D 交互、指尖拉坯与五声瓷磬，让当代青年学子与公众亲手触摸八千年前先民指尖的温度，在泥与火的淬炼中寻回内心的定力与从容。</p>\n        "
    }
];

const microscopePresets = [
    {
        "id": "guan",
        "name": "南宋官窑 · 聚沫攒珠相",
        "subtitle": "粉青石灰碱厚釉 · 层次丰腴的大中小立体气泡如堆积白露",
        "dynasty": "南宋 · 修内司 / 郊坛下官窑",
        "magnification": "100x",
        "scaleUm": 100,
        "baseHue": "#618b95",
        "brightfield": {
            "bg": "radial-gradient(circle at 48% 48%, #a4cbcf 0%, #68969e 60%, #3a5c63 100%)",
            "bubbleBorder": "rgba(40, 65, 70, 0.75)",
            "bubbleGlint": "rgba(255, 255, 255, 0.85)"
        },
        "darkfield": {
            "bg": "radial-gradient(circle at 48% 48%, #122126 0%, #0a1418 60%, #04090b 100%)",
            "bubbleBorder": "rgba(120, 195, 210, 0.65)",
            "bubbleGlint": "rgba(229, 200, 136, 0.95)"
        },
        "layers": {
            "surface": { "count": 8, "sizeRange": [24, 46], "deadRate": 0.25 },
            "middle": { "count": 28, "sizeRange": [10, 22], "deadRate": 0.10 },
            "deep": { "count": 45, "sizeRange": [4, 11], "deadRate": 0.02 }
        },
        "cracks": [
            { "x1": 0.15, "y1": 0.35, "x2": 0.85, "y2": 0.62, "width": 2.2, "heavy": true },
            { "x1": 0.45, "y1": 0.10, "x2": 0.30, "y2": 0.90, "width": 1.4, "gold": true },
            { "x1": 0.60, "y1": 0.40, "x2": 0.90, "y2": 0.20, "width": 1.0, "gold": false }
        ],
        "crystals": [
            { "x": 0.32, "y": 0.45, "r": 3.5, "type": "quartz" },
            { "x": 0.68, "y": 0.58, "r": 4.2, "type": "iron_halo" },
            { "x": 0.52, "y": 0.22, "r": 2.8, "type": "quartz" }
        ],
        "desc": "南宋官窑开创多次素烧多次施釉工艺，石灰碱釉在高温下粘度极大，窑火中逸出不尽的微小气泡被层层封锁于厚釉之中。显微镜下宛若漫天泡沫翻涌，大气泡浮于表层、中小气泡密布底层，互不粘连而层叠交错，古人誉为“聚沫攒珠”。破裂之死气泡经八百年水土侵蚀，边缘自然形成黑褐色氧化铁沉淀圈。",
        "authenticity": "【真伪铁律】：真官窑必有纵深三层以上的清晰立体景深，大泡周围包裹极细密白沫，死气泡边缘呈铁锈褐晕；现代气窑仿品多为单层分布，气泡大小过于齐整，且无自然老化析晶圈。"
    },
    {
        "id": "ru",
        "name": "北宋汝窑 · 寥若晨星相",
        "subtitle": "天青玛瑙釉 · 稀疏纯净如晓星沉水，伴微晶云雾",
        "dynasty": "北宋 · 宝丰清凉寺汝官窑",
        "magnification": "100x",
        "scaleUm": 100,
        "baseHue": "#87b2b8",
        "brightfield": {
            "bg": "radial-gradient(circle at 48% 48%, #c5e3e5 0%, #87b2b8 60%, #466970 100%)",
            "bubbleBorder": "rgba(45, 75, 80, 0.65)",
            "bubbleGlint": "rgba(255, 255, 255, 0.92)"
        },
        "darkfield": {
            "bg": "radial-gradient(circle at 48% 48%, #142226 0%, #0c171a 60%, #050a0c 100%)",
            "bubbleBorder": "rgba(145, 220, 230, 0.6)",
            "bubbleGlint": "rgba(240, 215, 150, 0.95)"
        },
        "layers": {
            "surface": { "count": 4, "sizeRange": [28, 52], "deadRate": 0.30 },
            "middle": { "count": 8, "sizeRange": [12, 24], "deadRate": 0.12 },
            "deep": { "count": 16, "sizeRange": [4, 9], "deadRate": 0.0 }
        },
        "cracks": [
            { "x1": 0.10, "y1": 0.50, "x2": 0.90, "y2": 0.42, "width": 1.2, "gold": true },
            { "x1": 0.35, "y1": 0.15, "x2": 0.65, "y2": 0.85, "width": 0.9, "gold": false }
        ],
        "crystals": [
            { "x": 0.28, "y": 0.36, "r": 6.5, "type": "agate_halo" },
            { "x": 0.72, "y": 0.64, "r": 5.8, "type": "agate_halo" },
            { "x": 0.48, "y": 0.75, "r": 4.5, "type": "quartz" }
        ],
        "desc": "北宋汝窑胎质细腻，釉中掺入名贵天然玛瑙末。在100x目镜下，最震撼的特征是：大气泡极度稀少，往往整个视场仅见三五颗孤立存在，如破晓长空中疏朗散落的残星，故得名“寥若晨星”。未完全熔融的玛瑙微粒形成絮状云雾晕，对光线产生强烈的瑞利散射，造就了汝窑“雨过天晴云破处”的神品天青色。",
        "authenticity": "【真伪铁律】：汝窑微观严禁“气泡密集”。凡微观下气泡如沸水翻滚密密麻麻者，一概非汝；真品必呈温润乳浊云雾状，偶见斜向极薄的蝉翼纹，星芒微露。"
    },
    {
        "id": "ge",
        "name": "传世哥窑 · 金丝铁线双重微裂相",
        "subtitle": "黑褐色大裂缝深透胎骨，金黄色细裂隙浮于釉面",
        "dynasty": "宋代 · 传世哥窑",
        "magnification": "100x",
        "scaleUm": 100,
        "baseHue": "#c8b896",
        "brightfield": {
            "bg": "radial-gradient(circle at 48% 48%, #ebe1cc 0%, #c4b595 60%, #7d6e4d 100%)",
            "bubbleBorder": "rgba(75, 60, 40, 0.75)",
            "bubbleGlint": "rgba(255, 255, 255, 0.82)"
        },
        "darkfield": {
            "bg": "radial-gradient(circle at 48% 48%, #1f1a14 0%, #120e0a 60%, #080604 100%)",
            "bubbleBorder": "rgba(215, 185, 130, 0.65)",
            "bubbleGlint": "rgba(255, 220, 140, 0.9)"
        },
        "layers": {
            "surface": { "count": 10, "sizeRange": [18, 38], "deadRate": 0.35 },
            "middle": { "count": 22, "sizeRange": [8, 18], "deadRate": 0.15 },
            "deep": { "count": 30, "sizeRange": [3, 8], "deadRate": 0.05 }
        },
        "cracks": [
            { "x1": 0.08, "y1": 0.20, "x2": 0.88, "y2": 0.78, "width": 3.8, "heavy": true },
            { "x1": 0.30, "y1": 0.85, "x2": 0.80, "y2": 0.15, "width": 3.2, "heavy": true },
            { "x1": 0.20, "y1": 0.60, "x2": 0.60, "y2": 0.40, "width": 1.2, "gold": true },
            { "x1": 0.50, "y1": 0.70, "x2": 0.90, "y2": 0.50, "width": 1.0, "gold": true }
        ],
        "crystals": [
            { "x": 0.35, "y": 0.30, "r": 4.0, "type": "iron_deposit" },
            { "x": 0.65, "y": 0.72, "r": 3.5, "type": "iron_deposit" }
        ],
        "desc": "哥窑开片乃胎釉热膨胀系数失配之神化。显微镜下可清晰观测到“金丝”与“铁线”的两次生成阶次：先裂者为“铁线”，缝隙粗深并深入黑色胎骨，千百年来被炭素与氧化铁彻底渗透染成深墨色；后裂者为“金丝”，网纹细密浮浅，缝隙被茶汁或铁质微弱沁染成天然金黄或赭黄。",
        "authenticity": "【真伪铁律】：真品哥窑开片边缘有微米级的锯齿状应力拉扯撕裂痕，且铁线与金丝色差绝然不同；化学药水作旧者，缝隙颜色单调发黑发死，边缘光滑无应力阶梯。"
    },
    {
        "id": "xuande",
        "name": "明宣德御窑 · 苏麻离青铁锈斑沉降相",
        "subtitle": "进口苏料锡光下沉入骨，青花气泡如繁星闪耀",
        "dynasty": "明宣德 · 景德镇御器厂",
        "magnification": "100x",
        "scaleUm": 100,
        "baseHue": "#2b4c7e",
        "brightfield": {
            "bg": "radial-gradient(circle at 48% 48%, #eef5fa 0%, #bcd2e8 50%, #466d9b 100%)",
            "bubbleBorder": "rgba(25, 45, 80, 0.8)",
            "bubbleGlint": "rgba(255, 255, 255, 0.95)"
        },
        "darkfield": {
            "bg": "radial-gradient(circle at 48% 48%, #0f1c2e 0%, #08101c 60%, #03060a 100%)",
            "bubbleBorder": "rgba(100, 160, 240, 0.75)",
            "bubbleGlint": "rgba(210, 230, 255, 0.95)"
        },
        "layers": {
            "surface": { "count": 12, "sizeRange": [20, 42], "deadRate": 0.18 },
            "middle": { "count": 32, "sizeRange": [9, 20], "deadRate": 0.08 },
            "deep": { "count": 50, "sizeRange": [4, 9], "deadRate": 0.0 }
        },
        "cracks": [],
        "crystals": [
            { "x": 0.40, "y": 0.48, "r": 9.5, "type": "tin_crystal" },
            { "x": 0.62, "y": 0.38, "r": 7.0, "type": "tin_crystal" },
            { "x": 0.28, "y": 0.65, "r": 5.5, "type": "tin_crystal" }
        ],
        "desc": "宣德青花采用郑和下西洋带回的南洋“苏麻离青”高铁低锰钴料。在高温烧造中，高铁成分在釉中局部过度饱和，冷却时以氧化铁磁铁矿形式结晶析出，下沉陷入胎骨，形成如锡块熔融般的银黑色金属锡光。显微镜下可见结晶斑呈羽状、松针状向外扩散，周围气泡群落被青料浸润呈现纯净幽蓝宝光。",
        "authenticity": "【真伪铁律】：真宣德铁锈斑触手凹凸不平，微观下具金属光泽并伴放射状针状晶丛（锡光下沉）；后世仿品多用人工加铁粉点染，显微镜下无晶体析出结构，仅为平板黑色色块。"
    },
    {
        "id": "ding",
        "name": "北宋定窑 · 牙白竹丝微晶透骨相",
        "subtitle": "高铝白瓷胎骨 · 几乎不见气泡，微显竹丝拉坯刷痕与晶润泪痕",
        "dynasty": "北宋 · 曲阳定窑",
        "magnification": "100x",
        "scaleUm": 100,
        "baseHue": "#dfd7c2",
        "brightfield": {
            "bg": "radial-gradient(circle at 48% 48%, #fbf9f2 0%, #eae3d2 60%, #b8ab8e 100%)",
            "bubbleBorder": "rgba(70, 65, 55, 0.55)",
            "bubbleGlint": "rgba(255, 255, 255, 0.95)"
        },
        "darkfield": {
            "bg": "radial-gradient(circle at 48% 48%, #1c1a16 0%, #100f0c 60%, #060504 100%)",
            "bubbleBorder": "rgba(235, 225, 200, 0.65)",
            "bubbleGlint": "rgba(255, 245, 210, 0.9)"
        },
        "layers": {
            "surface": { "count": 2, "sizeRange": [15, 25], "deadRate": 0.1 },
            "middle": { "count": 5, "sizeRange": [6, 12], "deadRate": 0.0 },
            "deep": { "count": 10, "sizeRange": [2, 5], "deadRate": 0.0 }
        },
        "cracks": [],
        "crystals": [
            { "x": 0.35, "y": 0.50, "r": 3.0, "type": "teardrop_glaze" },
            { "x": 0.65, "y": 0.40, "r": 4.5, "type": "brush_mark" }
        ],
        "desc": "定窑采用氧化焰高温烧成，高岭土淘洗极纯，氧化钛微量发色呈现标志性的温暖牙白（暖象牙色）。由于透气排气极其彻底，显微镜下釉面极其平滑纯净，“气泡罕见”，仅偶尔在釉厚处见微量极细小气泡。反而在透光检视下能清晰分辨窑工修坯留下的竹丝刷丝纹与釉汁自然垂流凝结如泪珠的“泪痕”微晶相。",
        "authenticity": "【真伪铁律】：定窑微观“无大泡，有泪痕，显竹丝”。现代仿品用化学氧化铝釉，颜色死白冰冷，微观下气泡如网，缺乏定窑千百年来由内部透出的羊脂玉般油脂光泽。"
    },
    {
        "id": "modern_fake",
        "name": "现代气窑仿品 · 均质单层死气泡相 (对比鉴伪)",
        "subtitle": "机械化工配料 · 气泡大小均一、平整单层、无自然老化析晶",
        "dynasty": "现代 · 化学仿古作坊",
        "magnification": "100x",
        "scaleUm": 100,
        "baseHue": "#8fa8af",
        "brightfield": {
            "bg": "radial-gradient(circle at 48% 48%, #b8d2d8 0%, #8ca9af 60%, #4b666c 100%)",
            "bubbleBorder": "rgba(30, 45, 50, 0.6)",
            "bubbleGlint": "rgba(255, 255, 255, 0.7)"
        },
        "darkfield": {
            "bg": "radial-gradient(circle at 48% 48%, #10181a 0%, #090e10 60%, #030506 100%)",
            "bubbleBorder": "rgba(100, 150, 160, 0.5)",
            "bubbleGlint": "rgba(180, 210, 220, 0.7)"
        },
        "layers": {
            "surface": { "count": 28, "sizeRange": [16, 20], "deadRate": 0.0 },
            "middle": { "count": 30, "sizeRange": [15, 19], "deadRate": 0.0 },
            "deep": { "count": 0, "sizeRange": [0, 0], "deadRate": 0.0 }
        },
        "cracks": [
            { "x1": 0.2, "y1": 0.3, "x2": 0.8, "y2": 0.7, "width": 1.0, "chemical": true }
        ],
        "crystals": [],
        "desc": "现代化学工业仿古瓷的典型显微切片。因使用现代球磨机细磨泥釉、液化气或电炉恒温快速烧成，窑内升降温极快。显微镜下最直观特征是：所有气泡几乎处在同一个二维平面上，气泡直径惊人地一致（均在 16~20μm 之间），排列机械呆板；且釉内完全找不到未溶石英晶核包裹体，气泡壁透明单薄无水色，开片缝隙颜色浮于表面。",
        "authenticity": "【鉴伪警示】：若在微观下观察到气泡如同工业圆规绘制般整齐划一，且死气泡无任何周边铁锈褐斑包浆者，99.9% 为当代流水线化学仿品，不可不察！"
    }
];

const porcelainComparisonData = [
    {
        "id": 0,
        "name": "南宋官窑八方贯耳瓶",
        "kiln": "南宋官窑 · 杭州修内司/郊坛下",
        "dynasty": "南宋 (1127–1279)",
        "bodyType": "紫金土黑灰铁胎 (Fe₂O₃ 3.5%–5.0%)",
        "glazeType": "粉青/天青多次厚施石灰碱釉 (聚沫攒珠)",
        "crackle": "立体大冰裂纹 / 蟹爪纹",
        "temperature": "约 1230℃–1260℃ (松柴强还原焰)",
        "firingMethod": "垫饼托烧或支钉结合，底足刮釉露胎",
        "rimFoot": "紫口铁足 (口沿垂釉显紫褐，圈足露铁黑)",
        "soundFrequency": 2420,
        "historicalRarity": "南宋内廷礼制重器，多归两岸故宫与大英博物馆典藏"
    },
    {
        "id": 1,
        "name": "北宋汝窑十瓣莲花温碗",
        "kiln": "汝窑 · 河南宝丰清凉寺",
        "dynasty": "北宋晚期 (徽宗朝)",
        "bodyType": "香灰胎 (极其纯净灰白致密胎骨)",
        "glazeType": "玛瑙入釉天青厚釉 (寥若晨星，如羊脂美玉)",
        "crackle": "极细隐性蟹爪纹，失透如酥",
        "temperature": "约 1200℃–1230℃ (还原焰)",
        "firingMethod": "满釉裹足支钉烧造 (五枚如粟微小芝麻支钉)",
        "rimFoot": "高深直圈足微敛，底留五枚芝麻状支钉痕",
        "soundFrequency": 2580,
        "historicalRarity": "台北故宫镇院之宝，世所罕见的汝窑巅峰绝品"
    },
    {
        "id": 2,
        "name": "北宋定窑白釉刻花梅瓶",
        "kiln": "定窑 · 河北曲阳涧磁村",
        "dynasty": "北宋早期至盛期",
        "bodyType": "高铝极白极坚澄泥细胎 (Al₂O₃ > 28%)",
        "glazeType": "象牙白透明钙镁釉 (外壁垂流“蜡泪痕”)",
        "crackle": "无开片，竹刀半刀泥深刻翻卷缠枝莲花",
        "temperature": "约 1320℃ (高温氧化焰)",
        "firingMethod": "阶梯支圈覆烧法 (创烧芒口镶皇家鎏金铜扣工艺)",
        "rimFoot": "芒口镶皇家鎏金铜扣，浅切隐圈足露白坚胎",
        "soundFrequency": 2850,
        "historicalRarity": "宋五大名窑中唯一白瓷，以刚健刻花与声如清磬闻世"
    },
    {
        "id": 3,
        "name": "宋代哥窑百圾碎贯耳扁瓶",
        "kiln": "传世哥窑",
        "dynasty": "宋代 (960–1279)",
        "bodyType": "深黑灰坚致铁骨胎 (含铁量高)",
        "glazeType": "米黄失透酥油厚釉",
        "crackle": "密不透风百圾碎 (深黑主脉与金黄细纹交织)",
        "temperature": "约 1240℃ (还原焰)",
        "firingMethod": "垫饼仰烧，圈足露深褐生铁色",
        "rimFoot": "紫口铁足显著，泥鳅背圈足打磨圆润",
        "soundFrequency": 2180,
        "historicalRarity": "文人书斋案头清供至宝，尽显残缺天成之意"
    },
    {
        "id": 4,
        "name": "北宋钧窑玫瑰紫出戟尊",
        "kiln": "钧台官窑 · 河南禹州神垕",
        "dynasty": "北宋晚期至金代",
        "bodyType": "香灰色夹砂胎 (质地厚重坚致)",
        "glazeType": "铜红还原乳浊釉 (红蓝紫晚霞窑变交融)",
        "crackle": "蚯蚓走泥纹与月白蓝紫流淌交织",
        "temperature": "约 1280℃ (强还原还原焰)",
        "firingMethod": "支烧平切，底涂芝麻酱护胎釉",
        "rimFoot": "海棠形宽圈足，底足刻汉字数字编号",
        "soundFrequency": 2350,
        "historicalRarity": "宋徽宗宫廷花器陈设，钧瓷无双之巅峰"
    },
    {
        "id": 5,
        "name": "元代青花牡丹双龙耳罐",
        "kiln": "景德镇浮梁瓷局",
        "dynasty": "元代 (1271–1368)",
        "bodyType": "麻仓土与瓷石二元配方胎 (坚实致密泛微火石红)",
        "glazeType": "鸭蛋青微青亮透明白釉",
        "crackle": "无开片，苏麻离青浓翠沉入胎骨",
        "temperature": "约 1300℃ (松柴还原焰)",
        "firingMethod": "正烧平垫砂，糙底露胎",
        "rimFoot": "宽矮大圈足斜削，颈肩堆塑透雕双螭龙耳",
        "soundFrequency": 2150,
        "historicalRarity": "元青花丝路航海雄浑巨制，大写意缠枝牡丹"
    },
    {
        "id": 6,
        "name": "明宣德宝石红僧帽壶",
        "kiln": "景德镇御器厂",
        "dynasty": "明宣德 (1426–1435)",
        "bodyType": "御用精淘白润高岭胎",
        "glazeType": "名贵高温纯铜红釉 (宝石红/霁红)",
        "crackle": "无开片，纯净深沉，口沿显白草边",
        "temperature": "约 1280℃ (精准气氛微氧化弱还原)",
        "firingMethod": "特制匣钵正烧，足底施亮青釉",
        "rimFoot": "圈足精细滚圆泥鳅背，足内青花六字年款",
        "soundFrequency": 2680,
        "historicalRarity": "明代红釉传世极品，藏传佛教萨迦僧帽造型"
    },
    {
        "id": 7,
        "name": "清乾隆金地洋彩转心瓶",
        "kiln": "景德镇御窑厂 (唐英督陶)",
        "dynasty": "清乾隆盛期",
        "bodyType": "御用极纯极白坚致高岭胎",
        "glazeType": "金地珐琅洋彩锦上添花",
        "crackle": "外瓶透雕镂空开光，内胆同心旋转",
        "temperature": "多次入窑 (1300℃高温胎体 + 800℃低温彩烧)",
        "firingMethod": "精密榫卯同心机械套烧",
        "rimFoot": "子母套足施松石绿釉，底红彩篆书官款",
        "soundFrequency": 2920,
        "historicalRarity": "督陶官唐英巧夺天工机械套瓶，制瓷工业奇迹"
    }
];

const pentatonicNotesData = [
    {
        "key": "gong",
        "note": "宫",
        "pinyin": "Gōng (Do)",
        "frequency": 261.63,
        "harmonics": [
            523.25,
            1046.5,
            2093
        ],
        "element": "土 · 敦厚中正",
        "vessel": "宋钧窑出戟尊 · 沉稳如钟",
        "desc": "五音之首，其声敦厚广大，如大地载物、春回河洛，余音绵长悠扬。"
    },
    {
        "key": "shang",
        "note": "商",
        "pinyin": "Shāng (Re)",
        "frequency": 293.66,
        "harmonics": [
            587.33,
            1174.66,
            2349.3
        ],
        "element": "金 · 清肃铿锵",
        "vessel": "宋定窑白瓷梅瓶 · 刚劲如磬",
        "desc": "其声清冷肃穆，如叩击太行白玉、冰泉落石，高亢穿云。"
    },
    {
        "key": "jue",
        "note": "角",
        "pinyin": "Jué (Mi)",
        "frequency": 329.63,
        "harmonics": [
            659.25,
            1318.51,
            2637
        ],
        "element": "木 · 和畅生发",
        "vessel": "宋龙泉粉青洗 · 苍翠明润",
        "desc": "其声和畅生发，如空山新雨后括苍山间的翠竹微吟。"
    },
    {
        "key": "zhi",
        "note": "徵",
        "pinyin": "Zhǐ (Sol)",
        "frequency": 392,
        "harmonics": [
            783.99,
            1568,
            3136
        ],
        "element": "火 · 炽烈欢畅",
        "vessel": "明宣德青花玉壶春 · 灵动飞扬",
        "desc": "其声欢畅飞扬，如龙窑千三百度的松柴烈焰腾跃生辉。"
    },
    {
        "key": "yu",
        "note": "羽",
        "pinyin": "Yǔ (La)",
        "frequency": 440,
        "harmonics": [
            880,
            1760,
            3520
        ],
        "element": "水 · 空灵澄澈",
        "vessel": "宋汝窑天青水仙盆 · 天人合一",
        "desc": "其声空灵清旷，若雨过天青云破处之晨露滴落琼玉，飘逸出尘。"
    }
];

const scholarQuizData = [
    {
        "id": 1,
        "question": "北宋汝官窑“雨过天青”釉色在 100 倍显微镜下呈现的典型气泡分布特征，被古陶瓷鉴藏界称作什么？",
        "options": [
            "A. 聚沫攒珠（大小气泡密集交叠如泡沫）",
            "B. 寥若晨星（玛瑙入釉玻化浑融，大气泡极少如晓星）",
            "C. 金丝铁线（深黑主裂纹与金黄细裂纹交织）",
            "D. 蚯蚓走泥（高温粘度变化形成的曲折流釉痕）"
        ],
        "answer": 1,
        "explanation": "【解析】汝窑以天然玛瑙末入釉，釉内石英微晶丰富而大气泡极少，微观下稀疏如破晓残星，故称“寥若晨星”；而“聚沫攒珠”为南宋官窑与哥窑特征。"
    },
    {
        "id": 2,
        "question": "南宋修内司与郊坛下官窑名瓷常呈现“紫口铁足”特征，其核物理与矿物学成因是什么？",
        "options": [
            "A. 匠人在口沿涂抹紫金水、在圈足镶嵌生铁圈",
            "B. 杭州凤凰山紫金土胎含铁高达3.5%–5%，口沿釉薄透胎呈紫褐，圈足露胎二次氧化呈铁黑",
            "C. 釉料中含有高浓度氧化铜与氧化钴在口部富集",
            "D. 覆烧法导致口沿无釉并镶嵌紫铜扣"
        ],
        "answer": 1,
        "explanation": "【解析】南宋官窑采用杭州凤凰山高铁紫金土（Fe₂O₃ 达3.5%–5%），高温下口沿釉药垂流变薄透出深褐胎骨（紫口），圈足刮釉露胎经停火后空气二次氧化成黑铁色（铁足）。"
    },
    {
        "id": 3,
        "question": "宋代五大名窑中，唯一烧造白瓷、首创“支圈覆烧法”并常在芒口处镶嵌金银铜扣的窑口是？",
        "options": [
            "A. 河南宝丰汝窑",
            "B. 河南禹州钧窑",
            "C. 河北曲阳定窑",
            "D. 浙江龙泉哥窑"
        ],
        "answer": 2,
        "explanation": "【解析】河北曲阳定窑是宋代五大名窑中唯一的白瓷名窑，胎薄坚白、声如清磬，为提高产量并防止器物变形首创“覆烧法”，口沿无釉处称“芒口”，宫廷常镶金银铜扣以增华贵。"
    },
    {
        "id": 4,
        "question": "河南禹州钧窑实现“入窑一色，出窑万彩（玫瑰紫、海棠红）”的呈色金属氧化物与窑炉气氛是？",
        "options": [
            "A. 氧化铁（Fe₂O₃）在高温氧化焰中烧成",
            "B. 氧化铜（CuO）与含磷分相釉在 1280℃ 还原焰中还原为胶体铜纳米粒子",
            "C. 进口苏麻离青钴料（CoO）在低温素烧中显色",
            "D. 二氧化钛（TiO₂）在电炉中性气氛中析晶"
        ],
        "answer": 1,
        "explanation": "【解析】钧窑是中国古代铜红釉的伟大创举。微量氧化铜（CuO）在还原焰中还原为纳米级金属铜胶体粒子（Cu⁰）及氧化亚铜（Cu₂O），与液-液分相天蓝乳光交融出绚丽的玫瑰紫与海棠红。"
    },
    {
        "id": 5,
        "question": "元代与明初景德镇制瓷工艺发生了一次里程碑式的原料革命，使大件瓷器在 1300℃ 高温下挺立不塌，这一技术被称为？",
        "options": [
            "A. 高岭土 + 瓷石“二元配方”",
            "B. 玛瑙末入釉支钉满烧法",
            "C. 封窑渗碳蛋壳黑陶法",
            "D. 铅钡低温三彩挂釉法"
        ],
        "answer": 0,
        "explanation": "【解析】元代景德镇匠人将富含氧化铝的高岭土（瓷骨）与瓷石（瓷肉）按比例混合，创立“二元配方”，大幅提升了胎体的耐火温度与高温抗蠕变强度。"
    },
    {
        "id": 6,
        "question": "明代永乐、宣德御窑青花瓷色泽浓艳苍翠，浓聚处常有自然下凹的银黑色“铁锈结晶斑”，这是因为使用了哪种青料？",
        "options": [
            "A. 江西乐平产“平等青”（高锰低铁）",
            "B. 浙江产“浙料”",
            "C. 西域波斯进口“苏麻离青”（高铁低锰钴土矿）",
            "D. 云南产“珠明料”"
        ],
        "answer": 2,
        "explanation": "【解析】永宣青花采用郑和下西洋及丝路贸易传入的“苏麻离青”（Smalt），其化学特征为高铁低锰，高温还原下氧化铁在浓笔处过饱和析出磁铁矿微晶，形成深入胎骨的铁锈斑。"
    }
];

if (typeof window !== 'undefined') {
    window.historyPeriods = historyPeriods;
    window.kilnGeographyData = kilnGeographyData;
    window.workshopSteps = workshopSteps;
    window.traditionalColors = traditionalColors;
    window.literatiArts = literatiArts;
    window.archivePorcelains = archivePorcelains;
    window.imperialReignMarks = imperialReignMarks;
    window.scholarNotes = scholarNotes;
    window.microscopePresets = microscopePresets;
    window.porcelainComparisonData = porcelainComparisonData;
    window.pentatonicNotesData = pentatonicNotesData;
    window.scholarQuizData = scholarQuizData;
}
