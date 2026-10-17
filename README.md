# 🏺 华夏器道 — 中国古代传统文化与古瓷数字化研鉴空间

<p align="center">
  <img src="https://img.shields.io/badge/Version-v2.0.0--Personal%20Edition-8FB8C0?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/3D_Engine-Three.js%20WebGL%20PBR-black?style=for-the-badge&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/AI_Engine-Pure%20Frontend%20Image%20Analysis-5A9CA8?style=for-the-badge" alt="AI" />
  <img src="https://img.shields.io/badge/Author-Independent%20Researcher-green?style=for-the-badge" alt="Author" />
</p>

> **「器以载道，格物致知 · 传承华夏造物文脉与宋韵极简风骨」**  
> 🌐 **在线 3D 展馆与 AI 识瓷直连体验**：[**https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/**](https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/)  
> 📖 **独立学术专栏**：本空间由独立研究者/开发者全程自主设计与开发，聚焦两宋五大名窑（汝、官、哥、钧、定）及明清御窑体系的数字化复原与传统美学研考。

---

## 📖 一、空间定位与研鉴理念

「华夏器道」致力于打破传统博物馆展柜的时空界限，以现代前沿的 **Three.js WebGL 三维实时渲染、PBR 双层物理釉面光泽、动态金丝铁线/冰裂开片着色器、纯前端色彩直方图与纹理智能识瓷算法** 为技术底座，全面构建集“3D交互研鉴、AI智能识宝、华夏陶瓷通史、古代制瓷工序、东方传统色谱、文人四艺雅趣”于一体的综合数字化研学空间。

---

## ✨ 二、核心数字化研鉴系统

| 研鉴模块 | 核心技术与学术实现 | 交互体验亮点 |
| :--- | :--- | :--- |
| **🏛️ 3D 传世名瓷数字化研鉴馆** | `Three.js` + `LatheGeometry` 高精几何车削 + PBR 物理级双层微晶反射 | 7大经典古代器型（官窑贯耳瓶、汝窑水仙盆、定窑梅瓶、哥窑胆瓶、钧窑海棠尊、建窑兔毫盏、青花玉壶春）、7大传统名釉自由试烧切换、金丝铁线动态开片、线框力学结构透视、四重视角一键校准 |
| **🔍 AI 智能古瓷与传统文化识图** | HTML5 Canvas 离屏像素采样 + RGB/HSL 色彩直方图 + 高频边缘差分检测开片密度 | 支持本地图片上传拖拽、实时摄像头扫一扫取景、6张典型传世名器一键速鉴，全方位输出窑口概率、釉质特征、胎骨底足推断、微观开片应力与防伪指南 |
| **📜 文脉回响 · 华夏陶瓷通史长卷** | 模块化年代演进交互轴 + 高清文物图鉴 | 系统梳理从前五千年新石器彩陶、商周原始青瓷、唐代南青北白，到两宋五大名窑巅峰、元明清御窑繁盛的万年泥火史诗 |
| **⚒️ 天工开物 · 古代制瓷核心工序** | 72道官窑烧造规制系统归纳 | 涵盖“采石淘泥、百炼成膏、旋转生形、削骨匀胎、草木配釉、柴窑涅槃”等工艺要点及详研弹窗 |
| **🎨 东方色谱 · 传统古瓷釉色美学** | 华夏古陶瓷色谱数据图谱 | 雨过天青、粉青如玉、月白莹霜、定窑牙白、玫瑰紫霞、曜变建黑、幽菁青花等色卡，支持一键复制 HEX/RGB 并联动 3D 试色 |
| **🍵 文人四艺 · 传统器物生活哲学** | 空间叙事交互 | 焚香、点茶、插花、挂画与对应古代器物（香炉、建盏、胆瓶、文房）的器道共鸣 |
| **🏺 名器考据 · 传世古陶瓷典藏库** | 数字化文物高精标本 | 收录台北故宫、故宫博物院等传世孤品详细尺寸、形制、工艺特征及个人研学评注 |

---

## 🛠️ 三、工程架构目录

```text
Memories-of-Chinese-Porcelain-Web/
├── index.html                        # 空间入口索引（自动引导进入研鉴展馆主程序）
├── README.md                         # 空间架构与使用文档
├── LICENSE                           # MIT 开源许可证
└── 仝瓷记忆网页/                      # 核心数字化研鉴工程
    ├── 主代码.html                    # 研鉴空间主程序
    ├── css/
    │   └── style.css                 # 宋韵水墨定制样式系统、3D控制台与激光扫描动效
    ├── js/
    │   ├── three-scene.js            # Three.js 7大经典器型建模、PBR材质与金丝铁线着色器
    │   ├── ai-recognition.js         # 纯前端图像分析引擎、WebRTC扫一扫与古陶瓷学术知识库
    │   ├── data.js                   # 华夏陶瓷通史、72工序、传统色谱、典藏库学术数据库
    │   ├── i18n.js                   # 国际化多语言支持 (中/EN)
    │   └── app.js                    # 前端全局事件调度、平滑滚动与模态交互控制器
    └── images/                       # 传世古陶瓷影像、工艺工序及水墨视觉素材
```

---

## 🚀 四、运行方式

1. **直接运行**：双击打开根目录 `index.html` 或直接打开 `仝瓷记忆网页/主代码.html` 即可在现代浏览器（Chrome、Edge、Safari、Firefox）中流畅运行。
2. **本地 HTTP 服务运行（推荐）**：
   ```bash
   # 使用 Python 启动本地服务
   python -m http.server 8080
   # 浏览器访问 http://localhost:8080
   ```

---

## 📄 五、个人研鉴声明

本项目为个人独立学术研究与数字文博展示作品。代码遵循 MIT 许可证开源，愿与热爱中国古代传统文化与古陶瓷美学的朋友共同交流互鉴。
