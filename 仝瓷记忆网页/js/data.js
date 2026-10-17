/**
 * 华夏器道 · 仝瓷记忆 — 中国古代传统文化与古瓷数字化研鉴空间
 * 核心学术数据库 (通史长卷、七十二工、文人四艺、传统色谱、传世名品典藏、名窑山川图谱)
 */

const historyPeriods = [
    {
        id: 'ancient',
        year: '新石器时代 (约前5000–前2000)',
        label: { zh: '远古曙光', en: 'Neolithic Era' },
        title: { zh: '泥与火的初鸣 · 仰韶与马家窑彩陶', en: 'Dawn of Clay & Fire' },
        desc: {
            zh: '中华先民在新石器时代发明了陶器，从仰韶文化的鱼纹彩陶盆到马家窑文化的旋涡纹彩陶瓮，泥土在烈火中获得新生，开创了华夏造物艺术的辉煌源头。',
            en: 'Neolithic pottery marks the dawn of Chinese craftsmanship, from Yangshao fish basins to Majiayao swirling urns.'
        },
        img: './images/4.jpg'
    },
    {
        id: 'shangzhou',
        year: '商周秦汉 (前1600–公元220)',
        label: { zh: '商周秦汉', en: 'Shang, Zhou & Han' },
        title: { zh: '原始青瓷肇始 · 由陶向瓷的历史飞跃', en: 'Origin of Proto-Celadon' },
        desc: {
            zh: '商代中晚期，中国先民烧制出胎质致密、表面施高温石灰釉的“原始青瓷”，完成了从陶到瓷的质的飞跃。东汉晚期，成熟青瓷在浙江越窑诞生，瑞兽盖罐古朴威严。',
            en: 'Proto-celadon emerged during Shang-Zhou, culminating in mature porcelain at Yue Kiln in Eastern Han.'
        },
        img: './images/7.jpg'
    },
    {
        id: 'tang',
        year: '隋唐五代 (581–960)',
        label: { zh: '隋唐盛世', en: 'Tang Dynasty' },
        title: { zh: '南青北白 · 越窑秘色与大唐气象', en: 'Southern Celadon & Northern White' },
        desc: {
            zh: '大唐盛世形成了“南青北白”的格局：南方越窑青瓷“如冰类玉”，五代法门寺地宫出土的“秘色瓷”更如天青落水；北方邢窑白瓷“如银类雪”，尽显大唐万国来朝之风骨。',
            en: 'The Tang era established Southern Green and Northern White porcelains, celebrated for jade-like glazes.'
        },
        img: './images/8.jpg'
    },
    {
        id: 'song',
        year: '宋代 (960–1279)',
        label: { zh: '两宋之巅', en: 'Song Dynasty' },
        title: { zh: '五大名窑 · 极简美学与天人合一', en: 'Zenith of Five Great Kilns' },
        desc: {
            zh: '中国美学最高峰。宋代追求“天人合一、素雅清逸”，诞生了汝、官、哥、钧、定五大名窑。汝瓷天青如梦，官瓷紫口铁足，哥瓷金丝铁线，钧瓷窑变灿烂，定瓷牙白如玉，器以载道，空灵超尘。',
            en: 'Song Dynasty represents the pinnacle of Chinese aesthetics: Ru, Guan, Ge, Jun, and Ding kilns celebrated restrained elegance.'
        },
        img: './images/13.jpg'
    },
    {
        id: 'yuan',
        year: '元代 (1271–1368)',
        label: { zh: '元代广袤', en: 'Yuan Dynasty' },
        title: { zh: '枢府卵白与天青余韵 · 丝路远航', en: 'Silk Road Ceramic Maritime Trade' },
        desc: {
            zh: '元代景德镇设立浮梁瓷局，一方面承袭两宋单色釉之温润玉质，一方面创烧成熟青花瓷与枢府卵白釉，随海上丝绸之路远销亚欧非三大洲。',
            en: 'Yuan Jingdezhen inherited Song celadon jade-like glazes while pioneering blue-and-white along the Maritime Silk Road.'
        },
        img: './images/10.jpg'
    },
    {
        id: 'ming',
        year: '明代 (1368–1644)',
        label: { zh: '大明御窑', en: 'Ming Imperial' },
        title: { zh: '御器厂定鼎 · 宣青成彩之风神', en: 'Ming Imperial Zenith' },
        desc: {
            zh: '明初在景德镇设立御器厂。永乐宣德之苏麻离青花深沉苍润，成化斗彩柔和雅致，德化白瓷“中国白”名动西欧，中国瓷器成为世界流通的文明符号。',
            en: 'Ming Dynasty established imperial workshops, famed for Xuande blue-and-white, Chenghua doucai, and Blanc de Chine.'
        },
        img: './images/15.jpg'
    },
    {
        id: 'qing',
        year: '清代 (1644–1912)',
        label: { zh: '清代华章', en: 'Qing Dynasty' },
        title: { zh: '集大成时代 · 康雍乾官窑工艺巅峰', en: 'Technical Perfection of Qing' },
        desc: {
            zh: '康熙之刚健挺拔，雍正之雅致清丽，乾隆之繁盛富丽。刻花、镂空转心、玲珑瓷与仿宋单色釉技术登峰造极，尽显盛世督陶官唐英之匠心。',
            en: 'Kangxi, Yongzheng, and Qianlong brought porcelain technique to historic heights with carved relief and monochrome glazes.'
        },
        img: './images/11.jpg'
    },
    {
        id: 'modern',
        year: '当代 (1912–今)',
        label: { zh: '当代新篇', en: 'Contemporary' },
        title: { zh: '文脉长青 · 数字化研鉴与智能传承', en: 'Digital Renaissance' },
        desc: {
            zh: '在数字时代，通过三维物理渲染（PBR）、WebGL 全息展厅与智能图像特征研鉴，古老的华夏瓷道脱胎换骨。打破展柜与时空阻隔，让传世器物永恒新生。',
            en: 'Modern digital preservation and WebGL rendering re-illuminate timeless ceramic heritage for the world.'
        },
        img: './images/6.jpg'
    }
];

const workshopSteps = [
    {
        id: 1,
        category: '土之篇 · 采土选料',
        icon: 'fa-mountain-sun',
        title: { zh: '采土取石', en: 'Mining Kaolin & Stone' },
        desc: {
            zh: '深入深山采撷上乘高岭土与瓷石，严格甄选二氧化硅与氧化铝比例适宜的原矿，这是瓷器筋骨之根本。',
            en: 'Mining premium kaolin and petuntse to ensure optimal silica and alumina mineral balance.'
        },
        img: './images/5.jpg'
    },
    {
        id: 2,
        category: '土之篇 · 淘洗陈腐',
        icon: 'fa-water',
        title: { zh: '水磨陈腐', en: 'Purification & Aging' },
        desc: {
            zh: '水碓舂粉，多次淘洗澄淀去杂质，随后将泥料置于避光阴湿窑窖中陈腐数月乃至数年，使泥性柔韧如膏。',
            en: 'Water-powered pulverizing, fine elutriation, and months of dark cellar aging to enhance clay plasticity.'
        },
        img: './images/3.jpg'
    },
    {
        id: 3,
        category: '水之篇 · 百炼成泥',
        icon: 'fa-hand',
        title: { zh: '揉泥排气', en: 'Clay Kneading' },
        desc: {
            zh: '运用“菊花揉”与“羊角揉”手法，经数百次手工推揉折叠，彻底排出微小气泡，确保受热不炸裂。',
            en: 'Manual kneading in chrysanthemum patterns to eliminate microscopic air bubbles and guarantee stability.'
        },
        img: './images/4.jpg'
    },
    {
        id: 4,
        category: '器之篇 · 旋转生形',
        icon: 'fa-circle-notch',
        title: { zh: '轮盘拉坯', en: 'Wheel Throwing' },
        desc: {
            zh: '在飞速旋转的陶轮上，匠人以十指感知泥料厚薄，一呼一吸间提拉出瓶、尊、盘、碗之曼妙曲线。',
            en: 'Master potters shape vessels on spinning wheels by fingertip intuition, commanding line and volume.'
        },
        img: './images/8.jpg'
    },
    {
        id: 5,
        category: '器之篇 · 削骨雕琢',
        icon: 'fa-pen-nib',
        title: { zh: '修光利坯', en: 'Trimming & Carving' },
        desc: {
            zh: '待坯体半干阴凉后，以锋利竹刀或钢刀修削内外壁、刻划莲瓣玲珑纹，使器物薄厚如一、重心平稳。',
            en: 'Precision trimming and lotus carving of leather-hard bodies to achieve uniform walls and calibrated balance.'
        },
        img: './images/9.jpg'
    },
    {
        id: 6,
        category: '火之篇 · 低温定骨',
        icon: 'fa-temperature-low',
        title: { zh: '阴干素烧', en: 'Drying & Bisque Firing' },
        desc: {
            zh: '修好的生坯需在通风木架上缓缓阴干，随后入窑经800℃低温素烧，提高坯体机械强度，以便厚施矿物釉。',
            en: 'Gentle shade-drying followed by low-temperature 800°C bisque firing to solidify structure for glazing.'
        },
        img: './images/11.jpg'
    },
    {
        id: 7,
        category: '器之篇 · 翠色成衣',
        icon: 'fa-brush',
        title: { zh: '荡釉浸釉', en: 'Glaze Application' },
        desc: {
            zh: '以松木灰配合长石、玛瑙末调配天然矿物釉，采用荡釉、浸釉、吹釉多道工序，确保釉层厚如凝脂。',
            en: 'Applying natural mineral and agate glazes through dipping, swirling, and blowing for jade-like density.'
        },
        img: './images/10.jpg'
    },
    {
        id: 8,
        category: '火之篇 · 烈焰涅槃',
        icon: 'fa-fire-flame-curved',
        title: { zh: '龙窑柴烧', en: 'High-Temperature Firing' },
        desc: {
            zh: '器物入匣钵叠放，以松柴经1300℃高温还原焰烧造。出窑降温时胎釉应力交织，诞生天青冰裂与金丝铁线。',
            en: 'Protected by saggers in dragon kilns at 1300°C reduction flame, creating celestial glazes and crackle networks.'
        },
        img: './images/13.jpg'
    }
];

const traditionalColors = [
    {
        name: '雨过天青',
        pinyin: 'Tiān Qīng',
        hex: '#8FB8C0',
        glazeKey: 'tianqing',
        rgb: '143, 184, 192',
        dynasty: '北宋 · 汝官窑',
        quote: '雨过天青云破处，这般颜色做将来',
        desc: '淡雅纯澈，蓝中含绿，宛如暴雨初霁后的晴空，宋徽宗推崇的道家清静无为至高色。'
    },
    {
        name: '粉青如翠',
        pinyin: 'Fěn Qīng',
        hex: '#7EAF9B',
        glazeKey: 'fenqing',
        rgb: '126, 175, 155',
        dynasty: '南宋 · 龙泉窑/官窑',
        quote: '巧剜明月染春水，轻旋薄冰盛绿云',
        desc: '青绿温润，失透如脂，如初春江南新柳，代表了南宋审美对翡翠玉质感的极致追求。'
    },
    {
        name: '月白莹霜',
        pinyin: 'Yuè Bái',
        hex: '#D2DFE5',
        glazeKey: 'yuebai',
        rgb: '210, 223, 229',
        dynasty: '宋代 · 官窑/钧窑',
        quote: '素娥梳洗新妆罢，一捧霜辉映碧霄',
        desc: '白中隐现极淡的天蓝与冷青，如中秋冰轮洒落清光，高洁素雅，冷冽幽然。'
    },
    {
        name: '定窑牙白',
        pinyin: 'Yá Bái',
        hex: '#EDE4D1',
        glazeKey: 'dingbai',
        rgb: '237, 228, 209',
        dynasty: '北宋 · 定窑',
        quote: '白如玉，明如镜，薄如纸，声如磬',
        desc: '温润的米白与象牙色，非现代纯白之冷硬，泛有羊脂暖光，内蕴谦谦君子之风。'
    },
    {
        name: '玫瑰紫霞',
        pinyin: 'Méi Guī Zǐ',
        hex: '#7A2E53',
        glazeKey: 'junhong',
        rgb: '122, 46, 83',
        dynasty: '宋元 · 禹州钧窑',
        quote: '绿翠泛红霞万缕，晓峰突现紫云翻',
        desc: '铜元素在高温还原气氛下的瑰丽窑变，如夕阳晚霞坠入深潭，红紫交相辉映，万千气象。'
    },
    {
        name: '曜变建黑',
        pinyin: 'Yào Biàn Hēi',
        hex: '#1B1718',
        glazeKey: 'jianhei',
        rgb: '27, 23, 24',
        dynasty: '宋代 · 建窑',
        quote: '兔毫紫瓯新，蟹眼清泉煮',
        desc: '深邃无底的铁胎黑釉，流淌出金银兔毫与曜变光斑，宋代文人点茶斗茶最宜衬托白色汤花。'
    },
    {
        name: '幽菁青花',
        pinyin: 'Qīng Huā',
        hex: '#22487A',
        glazeKey: 'qinghua',
        rgb: '34, 72, 122',
        dynasty: '元明 · 景德镇御窑',
        quote: '白釉青花一火成，花从釉里透分明',
        desc: '苏麻离青料发色幽深苍翠，浓聚处微凹下陷为铁锈斑，青白相映，为华夏瓷器之世界名片。'
    },
    {
        name: '茶叶末釉',
        pinyin: 'Chá Yè Mò',
        hex: '#5E5839',
        glazeKey: 'fenqing',
        rgb: '94, 88, 57',
        dynasty: '清雍正乾隆 · 御窑',
        quote: '蟹甲清绿隐微芒，秋深草木露如霜',
        desc: '铁镁质结晶黄绿交错，温润似沉香古木，古朴深沉，极富文人案头雅意。'
    }
];

const literatiArts = [
    {
        id: 'incense',
        title: '焚香 · 氤氲道境',
        icon: 'fa-smog',
        vessel: '宋官窑弦纹鬲式炉 / 钧窑三足香炉',
        quote: '红袖添香夜读书，闲坐幽室悟浮生',
        desc: '宋人焚香不仅为馥郁嗅觉，更旨在涤荡心胸。官窑香炉胎骨沉着、釉色含蓄，置于书斋琴室，香雾缭绕间尽显“格物致知”与静虑深思。'
    },
    {
        id: 'tea',
        title: '点茶 · 击拂雪涛',
        icon: 'fa-mug-hot',
        vessel: '建阳水吉兔毫盏 / 定窑白釉划花茶盏',
        quote: '矮纸闲行极草草，晴窗细乳戏分茶',
        desc: '两宋茶道以点茶、斗茶为极雅。以茶筅击拂茶汤直至乳白雪浪，黑如玄漆的建窑兔毫盏最能衬显白沫，黑白相竞，文人雅士借此照见天地本真。'
    },
    {
        id: 'flower',
        title: '插花 · 一枝见春',
        icon: 'fa-seedling',
        vessel: '定窑白釉梅瓶 / 哥窑贯耳胆瓶',
        quote: '忽见寒梅一枝发，雪中芳意寄谁人',
        desc: '不同于繁复堆砌，宋代瓶花尚“简古孤峭”。梅瓶小口修颈，最聚水气；胆瓶下垂如胆，稳健淡雅，插折枝梅兰竹石，满室生春。'
    },
    {
        id: 'painting',
        title: '挂画 · 幽游心印',
        icon: 'fa-scroll',
        vessel: '汝窑天青水仙盆 / 青瓷笔洗镇纸',
        quote: '远山含黛树笼雾，虚室明窗对古图',
        desc: '书房素壁悬挂宋元水墨册页，案头置天青笔洗、月白印泥盒与青瓷水盂相伴，文人造境，器文互映，此即华夏士人安顿心灵的精神故乡。'
    }
];

const archivePorcelains = [
    {
        id: 1,
        modelIdx: 3,
        name: '北宋 · 汝官窑天青釉开片玉壶春/胆瓶',
        kiln: '河南宝丰清凉寺汝窑 / 北宋官窑',
        level: '国宝级传世标准器',
        size: '高 20.6 cm · 口径 6.2 cm · 足径 6.8 cm',
        img: './images/10.jpg',
        tags: ['雨过天青', '蝉翼蟹爪纹', '玛瑙入釉'],
        desc: '敞口细颈，垂腹饱满，通体满施天青釉，釉面温润如羊脂美玉，隐现清雅蟹爪开片纹，光影流转间静穆超尘。'
    },
    {
        id: 2,
        modelIdx: 0,
        name: '南宋 · 官窑天青冰裂纹盘口长腹瓶',
        kiln: '杭州修内司官窑 / 郊坛下官窑',
        level: '国家特级典藏标准器',
        size: '高 22.8 cm · 口径 6.4 cm · 足径 7.2 cm',
        img: './images/13.jpg',
        tags: ['紫口铁足', '百极碎冰裂', '薄胎厚釉'],
        desc: '盘口短颈，丰肩修腹，底部圈足露紫黑铁胎（铁足），通体层层施粉青厚釉，冰裂纹如寒江碎玉，立体感极强。'
    },
    {
        id: 3,
        modelIdx: 2,
        name: '宋代 · 龙泉/定窑葵口旋纹梅瓶',
        kiln: '浙江龙泉金村窑 / 曲阳定窑',
        level: '宋韵极简线条典范',
        size: '高 24.5 cm · 口径 5.8 cm · 足径 6.6 cm',
        img: './images/8.jpg',
        tags: ['葵瓣花口', '斜旋水波棱', '粉青玉质'],
        desc: '五瓣葵花式撇口，器腹斜旋起棱如春水微澜，胎骨坚白，釉色清翠莹润，尽显宋人尚简尚雅之造物高度。'
    },
    {
        id: 4,
        modelIdx: 1,
        name: '宋韵 · 粉青镂空玲珑茶器水洗组',
        kiln: '江南官样名窑',
        level: '文人雅集茶席重器',
        size: '通高 18.2 cm · 盘径 21.0 cm',
        img: './images/9.jpg',
        tags: ['鬼工镂空', '冰心玉壶', '点茶清供'],
        desc: '融合高超的镂空雕琢与粉青厚釉工艺，光线穿透锦地纹孔隙，器物如冰雕翠玉般玲珑剔透。'
    },
    {
        id: 5,
        modelIdx: 4,
        name: '宋代 · 青瓷刻花缠枝牡丹纹瓶',
        kiln: '耀州窑 / 龙泉窑刻花代表',
        level: '宫廷陈设花器',
        size: '高 26.0 cm · 口径 5.2 cm · 足径 8.4 cm',
        img: './images/11.jpg',
        tags: ['半刀泥刻花', '缠枝牡丹', '翠峰浮雕'],
        desc: '小口细长颈，圆腹丰满。腹部以犀利“半刀泥”技法深刻缠枝牡丹，釉汁随刻痕深浅积聚，层次分明如水墨画卷。'
    },
    {
        id: 6,
        modelIdx: 6,
        name: '明宣德 · 御窑青花山水云纹赏瓶',
        kiln: '江西景德镇御器厂',
        level: '明代青花巅峰神品',
        size: '高 28.5 cm · 口径 7.8 cm · 足径 10.2 cm',
        img: './images/15.jpg',
        tags: ['苏麻离青', '分水皴染', '苍翠深沉'],
        desc: '以进口苏麻离青料于素胎之上绘层峦叠嶂与流云水波，高温一次烧成，青白相映，意境悠远。'
    }
];

const scholarNotes = [
    {
        title: '浅论宋代官窑“紫口铁足”之矿物成因与美学隐喻',
        date: '2026年研考札记',
        category: '材料与成型物理',
        excerpt: '宋代官窑胎料中含有高达 3.5%–5% 的氧化铁（Fe2O3）。在利坯成型时，口沿锐角处釉药在1300℃高温下因重力和表面张力自然下垂变薄，微透出深褐胎色，此为“紫口”；而圈足刮釉露胎，经窑炉余温二次氧化呈现铁黑色，称“铁足”。这一因工艺局限而生的偶然，却恰好暗合了宋儒“外柔内刚、返璞归真”的至高美学。'
    },
    {
        title: '金丝铁线与冰裂纹：古瓷冷却热应力开裂动力学解析',
        date: '2026年研考札记',
        category: '数字几何与物理仿真',
        excerpt: '陶瓷开片本质是胎与釉的热膨胀系数失配。硅酸盐胎的膨胀系数小于石灰碱釉时，窑炉降温阶段釉层受到双轴张应力作用，当拉伸应力超过釉面抗拉强度时，微观晶格断裂形成主干粗裂纹（铁线）；出窑后置于常温常湿环境中，残余应力在数月数年间缓慢释放，衍生出次级网状细裂纹（金丝）。'
    },
    {
        title: '器以载道：为何当代人仍需宋代单色釉的极简慰藉',
        date: '2026年研考札记',
        category: '东方美学与哲学思考',
        excerpt: '在现代数字工业铺天盖地的繁冗声色中，宋瓷的纯净单色釉宛如一剂清凉散。它不尚镂雕、不事浓丽，以一条内敛的S曲线、一汪澄澈的天青，将自然宇宙的呼吸封存于泥火之中。它是中国传统文化献给全人类的心灵归处。'
    }
];

const kilnGeographyData = [
    {
        id: 'ru',
        modelIdx: 1,
        name: '汝窑 · 宝丰清凉寺',
        province: '河南 · 平顶山宝丰',
        x: 45, y: 44,
        capitalTarget: [61, 38],
        era: '北宋晚期 (哲宗、徽宗朝)',
        mineral: '汝州盛产天然玛瑙矿与优质高岭土，以玛瑙微末入釉，使天青釉质失透如凝脂，晶润似玉。',
        masterpiece: '汝窑天青无纹水仙盆、天青釉莲花式温碗',
        status: '宋代五大名窑之首 · 冠绝古今'
    },
    {
        id: 'guan-bei',
        modelIdx: 0,
        name: '北宋官窑 · 汴京御窑',
        province: '河南 · 开封汴梁',
        x: 61, y: 38,
        capitalTarget: [61, 38],
        era: '北宋政和、宣和年间',
        mineral: '黄河故道沉积黏土，含铁量适宜，烧制出沉稳之紫口铁足，专供宋徽宗内廷祭祀陈设。',
        masterpiece: '官窑八方弦纹贯耳瓶、穿带壶',
        status: '皇家御用至尊 · 北宋大内礼器'
    },
    {
        id: 'ding',
        modelIdx: 2,
        name: '定窑 · 曲阳涧磁村',
        province: '河北 · 保定曲阳',
        x: 57, y: 22,
        capitalTarget: [61, 38],
        era: '唐至金代 (北宋鼎盛)',
        mineral: '太行山麓优质长石与超细高岭土，胎薄坚白如玉，创烧“覆烧法”与芒口镶金银铜扣。',
        masterpiece: '定窑白釉划花莲纹梅瓶、孩儿枕',
        status: '宋五大名窑唯一白瓷 · 刻花刚劲流利'
    },
    {
        id: 'jun',
        modelIdx: 4,
        name: '钧窑 · 禹州神垕钧台',
        province: '河南 · 许昌禹州',
        x: 53, y: 53,
        capitalTarget: [61, 38],
        era: '北宋晚期至金元',
        mineral: '禹州神垕镇特有的孔雀石与红铜矿石，经还原焰窑变析出红、蓝、紫微晶，万彩纷呈。',
        masterpiece: '钧窑玫瑰紫出戟海棠尊、鼓钉洗',
        status: '窑变艺术之冠 · 入窑一色出窑万彩'
    },
    {
        id: 'guan-nan',
        modelIdx: 0,
        name: '南宋官窑 · 临安修内司',
        province: '浙江 · 杭州凤凰山/乌龟山',
        x: 76, y: 55,
        capitalTarget: [76, 55],
        era: '南宋 (1127–1279)',
        mineral: '杭州凤凰山紫金土含铁量高达5%，形成典型薄胎厚釉与紫黑铁足，釉层达三至四层之多。',
        masterpiece: '修内司官窑八方贯耳瓶、冰裂纹盘口瓶',
        status: '南渡文脉正统 · 极简宫廷规制'
    },
    {
        id: 'ge',
        modelIdx: 3,
        name: '哥窑 · 龙泉/临安传世窑',
        province: '浙江 · 龙泉大窑与临安',
        x: 76, y: 68,
        capitalTarget: [76, 55],
        era: '宋代 (公元 960–1279)',
        mineral: '深铁褐色高含铁量胎土，配合高膨胀系数石灰碱釉，形成大黑小黄的“金丝铁线”开片绝艺。',
        masterpiece: '哥窑金丝铁线胆式瓶、双鱼耳炉',
        status: '宋代五大名窑之一 · 天工开裂之美'
    },
    {
        id: 'jingdezhen',
        modelIdx: 6,
        name: '御窑 · 景德镇珠山御器厂',
        province: '江西 · 景德镇昌江',
        x: 63, y: 64,
        capitalTarget: [76, 55],
        era: '宋元明清历代名窑',
        mineral: '麻仓高岭土与瑶里瓷石“二元配方”，耐1300℃高温不变形，苏麻离青发色浓艳苍翠。',
        masterpiece: '明宣德青花缠枝莲玉壶春瓶、宋影青梅瓶',
        status: '天下瓷都 · 汇聚华夏制瓷万象'
    },
    {
        id: 'jian',
        modelIdx: 5,
        name: '建窑 · 建阳水吉芦花坪',
        province: '福建 · 南平建阳',
        x: 70, y: 80,
        capitalTarget: [76, 55],
        era: '宋代 (公元 960–1279)',
        mineral: '富屯溪流域深黑铁红土，含铁量达8%以上，耐急冷骤热，最宜宋代文人点茶斗茶。',
        masterpiece: '曜变天目茶盏、银兔毫斗茶盏',
        status: '宋代茶道第一圣器 · 海上丝路名品'
    }
];

const microscopePresets = [
    {
        id: 'guan',
        name: '宋代官窑 · 聚沫攒珠相',
        subtitle: '粉青厚釉 · 大中小立体气泡如珠交叠',
        bgGradient: 'radial-gradient(circle at 45% 45%, #9ec3cb 0%, #57858f 70%, #2f4e56 100%)',
        bubbleCount: 16,
        cracks: [
            { top: '35%', left: '20%', deg: 32, len: '150px' },
            { top: '65%', left: '40%', deg: -40, len: '120px' }
        ],
        desc: '官窑采用多次厚施釉，釉层肥厚如脂，未逸出之小气泡密聚如泡沫，大气泡稀疏浮现，宛如露珠重叠，故称“聚沫攒珠”。深部微晶体与自然老化的深褐色破泡（死气泡）形成典型岁月特征。',
        authenticity: '仿品多用化学助熔剂，气泡分布过于单层扁平，无纵深层次，且缺乏古瓷独有的老化褐斑。'
    },
    {
        id: 'ru',
        name: '北宋汝窑 · 寥若晨星相',
        subtitle: '天青玛瑙釉 · 稀疏明净如晓星沉水',
        bgGradient: 'radial-gradient(circle at 45% 45%, #b2d5d8 0%, #76a7af 70%, #3e636b 100%)',
        bubbleCount: 7,
        cracks: [
            { top: '48%', left: '15%', deg: 18, len: '180px' },
            { top: '30%', left: '55%', deg: -25, len: '130px' },
            { top: '70%', left: '30%', deg: 55, len: '110px' }
        ],
        desc: '汝窑釉内掺入天然玛瑙粉末，玻化程度极高，釉质清澈如初晨之湖水。气泡极少，且细小均匀，稀疏如清晨之残星，古人赞誉“寥若晨星”，隐现蟹爪纹微裂纹理。',
        authenticity: '真品汝窑微观气泡极难寻觅，周边伴有冰裂蟹爪纹隐现；若气泡密如蜂窝者必为后世臆造之仿品。'
    },
    {
        id: 'ge',
        name: '宋代哥窑 · 金丝铁线微裂相',
        subtitle: '米黄炒米色 · 粗黑细黄两层矿物渗析',
        bgGradient: 'radial-gradient(circle at 45% 45%, #dfd5be 0%, #a99a7e 70%, #5a4f3d 100%)',
        bubbleCount: 12,
        cracks: [
            { top: '25%', left: '10%', deg: 42, len: '200px', heavy: true },
            { top: '55%', left: '25%', deg: -35, len: '170px', heavy: true },
            { top: '40%', left: '60%', deg: 75, len: '90px', gold: true },
            { top: '68%', left: '45%', deg: -15, len: '110px', gold: true }
        ],
        desc: '哥窑出窑降温时，由于胎与釉热膨胀系数剧烈差异导致多次开裂。粗大主裂纹吸附矿物发黑（铁线），细小次生纹如金丝走网，显微镜下可见断层面矿物质历经百年沉淀的晶体包浆。',
        authenticity: '真品金丝铁线自然深浅分明，色入胎骨；电炉仿品多用墨汁或红茶后期人工热煮染色，断面浮光刺目。'
    }
];

const porcelainComparisonData = [
    {
        id: 0,
        name: '南宋官窑八方贯耳瓶',
        kiln: '南宋官窑 · 杭州修内司/郊坛下',
        dynasty: '南宋 (1127–1279)',
        bodyType: '紫金土黑灰铁胎 (含铁3.5%–5%)',
        glazeType: '粉青/天青多次厚施乳浊釉 (聚沫攒珠)',
        crackle: '大冰裂纹 / 蟹爪纹',
        temperature: '约 1230℃–1250℃ (还原焰)',
        firingMethod: '垫饼托烧或支钉结合，底足刮釉露胎',
        rimFoot: '紫口铁足 (口沿垂釉显紫褐，圈足露铁黑)',
        soundFrequency: 2420,
        historicalRarity: '南宋内廷礼制重器，多归两岸故宫与大英博物馆典藏'
    },
    {
        id: 1,
        name: '北宋汝窑天青椭圆水仙盆',
        kiln: '汝窑 · 河南宝丰清凉寺',
        dynasty: '北宋晚期 (徽宗朝)',
        bodyType: '香灰胎 (灰白微黄致密)',
        glazeType: '玛瑙入釉纯天青色 (寥若晨星)',
        crackle: '极细鱼子纹或无纹 (台北故宫存唯一无纹水仙盆)',
        temperature: '约 1200℃–1220℃',
        firingMethod: '满釉裹足支钉烧造 (五至六枚芝麻细钉)',
        rimFoot: '四如意云头足，底留细小如针芝麻支钉痕',
        soundFrequency: 2580,
        historicalRarity: '全球传世汝瓷不足百件，无纹水仙盆更属举世孤品'
    },
    {
        id: 2,
        name: '北宋定窑牙白划花莲纹梅瓶',
        kiln: '定窑 · 河北曲阳涧磁村',
        dynasty: '北宋早期至盛期',
        bodyType: '极白极坚澄泥细胎',
        glazeType: '象牙白透明钙镁釉 (外见“蜡泪痕”)',
        crackle: '无开片，竹刀半刀泥深刻莲瓣浮雕',
        temperature: '约 1320℃ (高温氧化焰)',
        firingMethod: '阶梯支圈覆烧法 (创烧芒口镶金铜扣工艺)',
        rimFoot: '芒口镶鎏金铜扣，底足平削规整',
        soundFrequency: 2850,
        historicalRarity: '宋五大名窑中唯一白瓷，以潇洒刻花与声如清磬闻世'
    },
    {
        id: 3,
        name: '传世哥窑金丝铁线胆式瓶',
        kiln: '哥窑 · 浙江龙泉/临安',
        dynasty: '宋代 (960–1279)',
        bodyType: '深黑灰铁骨胎',
        glazeType: '米黄/粉青失透酥油厚釉',
        crackle: '金丝铁线 (深黑主裂纹与金黄次生细纹交织)',
        temperature: '约 1240℃',
        firingMethod: '垫饼仰烧，圈足露铁胎',
        rimFoot: '紫口铁足显著，百极碎纹深入肌理',
        soundFrequency: 2180,
        historicalRarity: '文人书斋案头插花清供至宝，尽显残缺天成之美'
    },
    {
        id: 4,
        name: '北宋钧官窑玫瑰紫出戟海棠尊',
        kiln: '钧窑 · 河南禹州钧台窑',
        dynasty: '北宋晚期',
        bodyType: '深灰坚致胎骨 (底刷芝麻酱护胎釉)',
        glazeType: '铜红还原乳浊窑变釉 (玫瑰紫/海棠红/天蓝)',
        crackle: '蚯蚓走泥纹 (高温流釉愈合曲纹)',
        temperature: '约 1280℃ (还原焰窑变)',
        firingMethod: '单件匣钵精烧，底部刻一至十数字编号',
        rimFoot: '四瓣海棠式圈足，四方附齿状出戟',
        soundFrequency: 2310,
        historicalRarity: '皇家宫廷花器重宝，“纵有家财万贯，不如钧瓷一片”'
    },
    {
        id: 5,
        name: '宋代建窑曜变兔毫天目茶盏',
        kiln: '建窑 · 福建建阳水吉镇',
        dynasty: '宋代 (11–13世纪)',
        bodyType: '含铁量8%+深黑粗砂铁胎',
        glazeType: '高铁草木灰黑釉 (析出金银兔毫与曜变光晕)',
        crackle: '铁系微晶自然析出，无胎裂',
        temperature: '约 1310℃ (高温重还原焰)',
        firingMethod: '仰烧法，下腹垂流形成“釉泪垂珠”',
        rimFoot: '束口注汤槽，浅圈足修刀古拙露黑铁底',
        soundFrequency: 1980,
        historicalRarity: '宋代点茶斗茶第一圣器，传世完整曜变建盏仅存三件半'
    },
    {
        id: 6,
        name: '明宣德御窑青花缠枝莲玉壶春瓶',
        kiln: '御窑 · 江西景德镇珠山御器厂',
        dynasty: '明宣德 (1426–1435)',
        bodyType: '麻仓高岭土+瓷石“二元配方”洁白胎',
        glazeType: '鸭蛋青肥厚透明亮釉 (微泛橘皮棕眼)',
        crackle: '无开片，进口苏麻离青浓聚处呈铁锈结晶斑',
        temperature: '约 1300℃ (柴窑高温还原)',
        firingMethod: '一器一匣钵御窑严选烧造',
        rimFoot: '喇叭撇口，外撇圈足内书“大明宣德年制”双圈款',
        soundFrequency: 2720,
        historicalRarity: '明代青花瓷之冠，青花浓艳苍翠，器型柔美如水滴'
    }
];

const pentatonicNotesData = [
    {
        key: 'gong',
        note: '宫',
        pinyin: 'Gōng',
        frequency: 261.63,
        harmonics: [1046.5, 2093.0],
        element: '土 · 敦厚',
        vessel: '宋钧窑出戟尊 · 沉稳如钟',
        desc: '其声敦厚广大，如大地回春，余音绵长悠扬。'
    },
    {
        key: 'shang',
        note: '商',
        pinyin: 'Shāng',
        frequency: 293.66,
        harmonics: [1174.64, 2349.3],
        element: '金 · 清肃',
        vessel: '宋定窑白瓷瓶 · 刚劲清脆',
        desc: '其声清冷肃穆，如击玉石冰泉，高亢空灵。'
    },
    {
        key: 'jue',
        note: '角',
        pinyin: 'Jué',
        frequency: 329.63,
        harmonics: [1318.51, 2637.0],
        element: '木 · 和畅',
        vessel: '宋龙泉青瓷洗 · 苍翠明润',
        desc: '其声和畅生发，如空山新雨后的翠竹微响。'
    },
    {
        key: 'zhi',
        note: '徵',
        pinyin: 'Zhǐ',
        frequency: 392.00,
        harmonics: [1568.0, 3136.0],
        element: '火 · 欢快',
        vessel: '明青花玉壶春 · 活泼灵动',
        desc: '其声欢畅飞扬，如窑火初开时的烈焰跳跃。'
    },
    {
        key: 'yu',
        note: '羽',
        pinyin: 'Yǔ',
        frequency: 440.00,
        harmonics: [1760.0, 3520.0],
        element: '水 · 空灵',
        vessel: '宋汝窑天青洗 · 天人合一',
        desc: '其声空灵清旷，若叩晨雾琼玉，飘逸出尘。'
    }
];

if (typeof window !== 'undefined') {
    window.historyPeriods = historyPeriods;
    window.kilnGeographyData = kilnGeographyData;
    window.workshopSteps = workshopSteps;
    window.traditionalColors = traditionalColors;
    window.literatiArts = literatiArts;
    window.archivePorcelains = archivePorcelains;
    window.scholarNotes = scholarNotes;
    window.microscopePresets = microscopePresets;
    window.porcelainComparisonData = porcelainComparisonData;
    window.pentatonicNotesData = pentatonicNotesData;
}
