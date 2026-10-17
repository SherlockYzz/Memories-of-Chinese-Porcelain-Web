# 华夏器道 · 仝瓷记忆 (Memories of Chinese Porcelain) — V3.0 旗舰全量尊享版

> **器以载道 · 格物致知 · 旗舰级中国古代传统文化与宋韵古陶瓷 3D 数字化交互研鉴空间**  
> *A Flagship WebGL 3D Interactive Heritage & Digital Connoisseurship Space for Ancient Chinese Ceramics*

[![Version](https://img.shields.io/badge/Version-v3.0.0_Flagship-255460.svg?style=flat-square)](https://github.com/SherlockYzz/Memories-of-Chinese-Porcelain-Web)
[![Three.js](https://img.shields.io/badge/Three.js-r128_WebGL-E5C888.svg?style=flat-square)](https://threejs.org/)
[![Computer Vision](https://img.shields.io/badge/Computer_Vision-Sobel_Kernel_Pure_Frontend-5A9CA8.svg?style=flat-square)](https://github.com/SherlockYzz/Memories-of-Chinese-Porcelain-Web)
[![Web Audio](https://img.shields.io/badge/Web_Audio-Oriental_Soundscapes-8FB8C0.svg?style=flat-square)](https://github.com/SherlockYzz/Memories-of-Chinese-Porcelain-Web)
[![Offline Ready](https://img.shields.io/badge/Offline-100%25_Zero_External_CDN-success.svg?style=flat-square)](https://github.com/SherlockYzz/Memories-of-Chinese-Porcelain-Web)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🌐 快速在线预览与直达

- **GitHub Pages 官方在线展馆**：[https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/](https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/)
- **本地极速直开**：直接双击根目录下的 [`index.html`](./index.html) 或 [`主代码.html`](./主代码.html)，100% 纯本地离线运行，0 毫秒秒开，零外网依赖。

---

## 🎉 V3.0 重大版本升级日志 (What's New in V3.0)

本次 **V3.0 (旗舰全量尊享版)** 是项目立项以来规模最大、维度最全的里程碑式飞跃。彻底告别传统 3D 展位单一 CAD 几何体的“虚空感”，全方位升维为涵盖“**实体物理室内场景、AI 计算机视觉鉴宝、文博原声语音导览、4K 非遗影像、古法拉坯工坊与宋代点茶百戏**”的完整数字人文殿堂：

### 1. 🏛️ 真实 3D 物理室内场景与三大意境空间 (Realistic 3D Interior)
- **告别虚空浮游，构筑 $18\text{m} \times 18\text{m}$ 实体物理空间**：
  - **三款程序化 PBR 物理地面**：宋代青石地砖（砖缝与磨损包浆）、故宫墨黑镜面金砖（桐油润泽高反光）、御窑耐火青砖（粗粝耐火杂色），均由原生 Canvas 离屏动态解算。
  - **三折紫檀山水木插屏**：立于器物后方形成高雅景深背景，紫檀精雕外框附抱鼓石座底，画心内嵌宋代**米友仁米氏云山水墨图**（淡墨远山重重、中景云雾迷蒙、近景古松怪石与篆书题跋、朱红印章）。
  - **宋代直棂木质轩窗**：左侧墙壁嵌入 12 根竖棂与 4 根横带构成的实体立体花格窗，窗内透出微白窗纸光晕与修竹淡影。
  - **明清老红木雕花束腰四方几案**：桌面厚板、内凹束腰结构、卷云纹牙条托腮、四条内翻马蹄实木方腿与连结四面的罗锅枨，中央覆以宋代宫廷深蓝织金宝相花席垫。
  - **物理级柔和接触投影 (Contact Soft Shadow)**：足底与几案贴合处、几案腿与地面之间内嵌余弦衰减的接触阴影面片，配合 Three.js `PCFSoftShadowMap`，器物落地稳健，彻底消弭漂浮感。
  - **轩窗斜射丁达尔体积光束 (Volumetric God-Rays)**：从直棂花窗斜向倾泻而下，3 道半透明光柱随天光云影微弱呼吸起伏。
  - **博山香炉缕缕青烟与 160 颗悬浮微尘**：几案右侧设宋式青铜博山香炉，炉盖小孔不断升腾 75 颗随气流旋转扩散、徐徐淡出的轻烟微粒；空气中漫游 160 颗金色/银白微尘。
  - **视口内三大意境一键切换**：【🌿 宋代雨后雅室】、【🏛️ 国家文博特展殿堂】、【🔥 御窑秘境窑火幽室】，并支持一键隐藏场景切换极简纯色展位。

### 2. 🎙️ 博物馆资深讲解员原声导览引擎 (12 尊名瓷音频库)
- **专属高清音频库**：新增 `audio/vessel_01.mp3` 至 `vessel_12.mp3`，涵盖馆藏全部 12 尊名瓷的沉浸式专业讲解。
- **双模语音驱动**：内置小米 MiMo TTS（`mimo-v2.5-tts`）历史博物馆馆长级大模型接口，具备文脉温度与历史厚重感；脱网时无缝降级为本地 Web Speech API 与纯前端音频播放，确保 100% 可用。

### 3. 🎥 陶埏天工视听研学展映厅与 4K 超清影像 (Video Theatre & Soundscapes)
- **非遗工艺双影像展映**：内置 `videos/ceramic_making.webm` 与 `videos/potter_wheel.webm` 两部超清实录短片，全景展现轮盘拉坯、利坯修足、荡釉浸釉与龙窑柴烧实况。
- **四大东方意境环境音景实时合成 (Web Audio API)**：
  - 🔥 龙窑松柴烈火噼啪声（物理滤波噪点合成）
  - 💧 山泉水磨澄泥潺潺声（双二阶带通调制）
  - 🎵 古琴五音清冷泛音（泛音加法物理建模）
  - 🔔 叩瓷如玉清亮鸣磬（按器型壁厚共振基频触发）
  - 支持多轨自由叠加与音量独立滑杆调节。

### 4. 🏺 十二大 3D 全息馆藏重器矩阵 (7 尊高精建模 + 5 尊实测三维扫描真品)
- **0~6 号传世标准器**：南宋官窑八方贯耳弦纹瓶、北宋汝窑天青椭圆四足水仙盆、北宋定窑白釉划花莲纹梅瓶、宋哥窑金丝铁线胆式瓶、宋钧窑玫瑰紫海棠出戟尊、宋建窑兔毫曜变天目茶盏、明宣德青花缠枝莲纹玉壶春瓶（128段高精双壁样条曲面建模，支持 X 光 180° 纵向胎壁剖面透视）。
- **7~11 号实测点云扫描真品 (CC0 结构光 1:1)**：景德镇窑影青撇口净水瓶、宋元金石铁锈花修身瓶、宋元龙泉双系圆腹罐、明宣德白釉长颈瓶、汉唐古拙双耳陶罐（4.06MB 纯内存内联，无外网下载延迟）。

### 5. 🔬 纯前端计算机视觉与数字光谱研学工作站 (AI Recognition)
- **Sobel 高频开片裂隙梯度卷积**：纯前端无后端实时计算冰裂、蟹爪、百圾碎开片应力网络，并在画布上绘制边缘特征图。
- **64 通道 RGB/HSL 色相直方图**：实时绘制色彩分布曲线，精准识别汝窑天青、建盏曜变等色相区间。
- **五维雷达诊断图谱**：器型比例、釉质温润度、开片密度、时代风格、工艺复杂度综合评分。
- **《古陶瓷数字化研鉴证书》一键导出**：生成具备数字防伪标、学术分析、特征图与主理人朱印的研学证书。
- **WebRTC 实时摄像头取景识瓷**：支持调用设备摄像头进行激光扫一扫定格鉴宝。

### 6. 🏺 陶然天成 · 44层泥料 3D 指尖拉坯与青花手绘工坊
- 44 层泥料旋转实体网格，手势或鼠标触控拉坯开孔、拔高、修颈、压肩。
- 实时解算器高、口径、腹径、容积与造型美学评分。
- 3D 曲面实时绘制青花缠枝莲纹或刻划纹样，支持大明宣德、大清康熙等御用篆刻底款及 25℃~1300℃ 升温曲线。

### 7. 🍵 文人四艺与宋代建盏点茶百戏模拟器
- 宋徽宗《大观茶论》非遗七汤点茶模拟：以茶筅回环击拂，模拟注水、击拂起沫、乳花咬盏与水丹青（清风疎竹、雪夜寒梅、瑞鹤凌云）茶百戏雅画。

### 8. 🗺️ 九州名窑山川地理与三大航线贡道矢量舆图
- 配准黄河、长江、大运河水系与海上丝路外销航线，涵盖十六大华夏名窑总谱，支持山川地理层、窑系亲缘层、运河与外销贡道层即时切换。

### 9. 🚀 工程架构扁平化与 0 配置 GitHub Pages 部署
- 彻底移除过往仓库内冗余的子目录嵌套，资源全部归位于根目录，所有资源路径均采用标准相对路径，确保在 GitHub Pages 各种二级路径下开箱即用 0 报错。

---

## 📂 工程目录结构

```
Memories-of-Chinese-Porcelain-Web/
├── index.html                 # 数字化研鉴主入口 (V3.0 旗舰全量版)
├── 主代码.html                # index.html 100% 镜像同步版本
├── README.md                  # 本文档 (V3.0 工程架构与功能详解)
├── LICENSE                    # MIT 开源许可证
├── audio/                     # 12 尊名瓷资深讲解员原声导览音频库 (MP3)
│   ├── vessel_01.mp3 ~ vessel_12.mp3
├── videos/                    # 非遗拉坯制瓷与窑火高清影像库 (WebM)
│   ├── ceramic_making.webm    # 传统手工制瓷拉坯与施釉高清实况循环
│   └── potter_wheel.webm      # 陶轮修坯与拉坯慢速特写实录
├── css/
│   ├── style.css              # 宣纸/玄夜双主题系统、3D真实场景控制、高定毛玻璃
│   └── font-awesome.min.css   # Font Awesome 6 本地字体图标库
├── js/
│   ├── three.min.js           # Three.js 核心三维渲染引擎 (r128)
│   ├── GLTFLoader.js          # Three.js 官方 GLTF 2.0 解析器
│   ├── three-scene.js         # 真实3D物理室内空间、几案插屏、PBR双层釉料、12尊重器
│   ├── scanned-models-data.js # 5款实测3D扫描模型 Base64 纯内存内联库 (4.06MB)
│   ├── museum-audio-data.js   # 博物馆语音导览核心数据与词典 (4.51MB)
│   ├── oriental-ambient.js    # Web Audio 东方环境音景发生器 (琴/火/水/磬)
│   ├── ai-recognition.js      # Sobel卷积边缘、64通道光谱直方图、五维雷达图谱
│   ├── pottery-workshop.js    # 44层泥料 3D 指尖拉坯与青花手绘工坊
│   ├── data.js                # 24件典藏、16名窑、16色谱、款识图典与殿试考题库
│   ├── i18n.js                # 中英文双语全词典国际化支持系统
│   └── app.js                 # 全局事件调度、山川舆图、点茶百戏、主题切换
├── images/                    # 24件典藏图录超清图库 (CC0) 与纹理贴图
├── models/                    # GLTF 格式古代瓷瓶真品点云模型及贴图
└── webfonts/                  # Font Awesome 本地离线字体文件
```

---

## 🛠️ 本地启动与部署方式

### 方式一：双击直接打开（极简推荐）
无需配置任何服务器或安装依赖，直接双击根目录下的 `index.html` 或 `主代码.html`，即可在现代浏览器（Chrome、Edge、Firefox、Safari）中完整畅玩所有 3D 与 AI 研学功能。

### 方式二：本地 HTTP 静态服务器
如果希望体验完整的视频流媒体与更佳的音频流式加载：
```bash
# 使用 Python 启动
python -m http.server 8080

# 或使用 Node.js npx 启动
npx serve . -p 8080
```
然后在浏览器中访问 `http://127.0.0.1:8080/` 即可。

### 方式三：GitHub Pages 在线部署
1. 将本仓库 Fork 或 Push 至您的 GitHub；
2. 进入仓库 **Settings -> Pages**；
3. **Branch** 选择 `main` 分支，目录选择 `/(root)`，点击 **Save**；
4. 约 1 分钟后即可通过 `https://<your-username>.github.io/<repo-name>/` 全球即刻访问！

---

## 📜 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。馆藏摄影图录与 3D 点云扫描模型基于 CC0 1.0 Universal 公共领域贡献协议。
