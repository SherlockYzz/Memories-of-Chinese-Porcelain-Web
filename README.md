# 🏺 慧眼识瓷 — 宋代官瓷 3D 数字化体验平台

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.0.0-c8a97e?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/3D_Engine-Three.js%20%2B%20WebGL-black?style=for-the-badge&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/Domain-非遗数字化%20%C3%97%20AI识瓷-8B4513?style=for-the-badge" alt="Domain" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

> **「器以载道，AI 赋能非遗技艺数字化传承」**  
> 🌐 **在线 3D 展馆直连体验（GitHub Pages）**：[**https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/**](https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/)  
> 📦 **离线完整发行版下载（GitHub Releases）**：[**点击下载 v1.0.0 独立打包版（ZIP）**](https://github.com/SherlockYzz/Memories-of-Chinese-Porcelain-Web/releases)

---

## 📖 一、项目背景与简介

**「慧眼识瓷」** 是由 **河南大学「仝瓷记忆」团队**（于子倬、邢雅静等）研发的宋代官瓷数字化交互体验平台。平台以宋代美学与水墨画卷为视觉基底，结合 **Three.js / WebGL 三维实时渲染、AR 增强现实预览、AI 智能器型与釉色识别** 等数字技术，将千年宋代官瓷的烧造工艺、经典器型与文化脉络进行高精度数字化还原。

---

## ✨ 二、核心功能模块

| 模块名称 | 核心技术实现 | 功能亮点与交互体验 |
| :--- | :--- | :--- |
| **🏛️ 3D 数字化官瓷展馆** | `Three.js` + `WebGLRenderer` + 多光源 PBR 釉面反射 | 支持 360° 自由旋转、缩放审视宋代官瓷经典器型，还原“紫口铁足、釉厚如脂、冰裂蟹爪纹”质感 |
| **🔍 AI 慧眼识瓷鉴赏** | 图像特征提取 + 智能器型/年代辅助识别 | 上传或拍摄瓷器图像，智能分析器型特征、开片纹理与工艺流派 |
| **📱 AR 虚实融合预览** | WebRTC 移动端摄像头流 + 空间姿态映射 | 将虚拟宋代官瓷置于真实桌面空间，零距离感受古器物空间美学 |
| **📜 千年官瓷文化长卷** | 宋韵水墨响应式 UI + 历史脉络交互时间轴 | 沉浸式呈现宋代官窑72道烧造工序、历史渊源与非遗传承人故事 |

---

## 🛠️ 三、技术架构与工程目录

```text
Memories-of-Chinese-Porcelain-Web/
├── index.html                        # GitHub Pages 在线入口（自动引导进入展馆主程序）
├── README.md                         # 项目架构与使用文档
├── LICENSE                           # MIT 开源许可证
└── 仝瓷记忆网页/                      # 核心前端工程目录
    ├── 主代码.html                    # 平台主页面（集成展馆、识瓷、工艺长卷）
    ├── css/
    │   └── style.css                 # 宋韵水墨定制样式系统与响应式布局
    ├── js/
    │   ├── main.js                   # 页面交互控制、导航状态机与模块调度
    │   ├── three-scene.js            # Three.js 3D 场景、相机控制器与 PBR 光照渲染
    │   └── ai-recognition.js         # AI 识瓷交互逻辑与结果可视化
    └── assets/                       # 官瓷模型、高清纹饰演示图与水墨视觉素材
```

---

## 🚀 四、快速运行方式

1. **浏览器在线直接体验（无需下载）**：  
   直接点击打开 👉 [**https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/**](https://sherlockyzz.github.io/Memories-of-Chinese-Porcelain-Web/)
2. **下载 Release 发行包本地运行**：  
   在 [Releases 页面](https://github.com/SherlockYzz/Memories-of-Chinese-Porcelain-Web/releases) 下载 `HuiYanShiCi-Porcelain-3D-Web-v1.0.0.zip`，解压后双击 `index.html` 或 `仝瓷记忆网页/主代码.html` 即可在 Chrome / Edge 浏览器中运行。

---

## 📄 五、开源协议

本项目采用 [MIT License](./LICENSE) 开源协议。
