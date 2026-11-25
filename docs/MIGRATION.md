# 渐进式重构迁移进度表与回归验证记录

## 1. 模块与资产迁移状态

| 模块 / 领域 | 迁移前状态 | 当前状态 | 所在位置 / 方案 | 风险与备注 |
| --- | --- | --- | --- | --- |
| 构建与单源码收敛 | 根目录重复 HTML + 手工 2MB `bundle-core.js` | **已完成** | `tools/build.mjs` + `esbuild` -> `dist/` | 已删除重复入口与 base64 包 |
| 内核与统一数据接口 | 模块靠 `window.xxx` 与内置数据紧耦合 | **已完成** | `src/core/` + `content/*.json` | 支持可选后端 + 静态自动兜底 |
| 主题 / 导航 / 导览 / 首屏 3D | 散落 legacy、无四幕结构、缺降级 | **已完成** | `src/modules/{theme,navigation,guided-tour,hero-vessel}.js` | 低配自动先给图再按需开启 3D |
| 3D 背景遮挡与联动 (P0) | `.bg-white` 高遮挡、浅色无对比 | **已完成** | `00-tokens.css` + `10-layout.css` + `webgl-bg/` | 板块透明度 0.16–0.26，1400~10000px 清晰透出 |
| 全站 `undefined` 与公式 (P0) | `wallThickness` 缺失、裸 LaTeX | **已完成** | `content/vessels.json` + `notes.json` + `three-scene.js` | `tests/run.mjs` 扫描全站 0 异常文本 |
| 桌面/手机溢出与 3D 锚点 (P0) | 1440 顶栏溢出、390 横滚 425px、锚点截断 | **已完成** | `20-nav.css` + `40-sections.css` + `three-scene.js` | 1280/1440/1920/390 全零溢出 |
| 模型审计与道具重建 | 宣传“2K扫描”、环境道具 48–1428 面无贴图 | **已完成** | `tools/audit-models.mjs` + `rebuild_env_props.py` | 4 件环境道具已用 Blender 5.2 重建并附 PBR 贴图 |
| 物理釉面与 Lab 色差验证 | 官窑发粉白、均匀线网开片 | **已完成** | `src/core/glaze-shader.js` + `glazes.json` + `verify-glaze-colors.mjs` | 注入积釉、紫口铁足、多尺度 Voronoi 与虹彩 |
| 典藏图录 & 素材致谢页 | 宣称未核实、无版权溯源页 | **已完成** | `src/modules/{archive-catalog,credits}.js` | 逐条标注核验状态、作者与授权协议 |
| 创新研学模块 & PWA/无障碍 | 缺少互动完成态与离线/适老支持 | **已完成** | `crackle-lab` / `kintsugi` / `firing-timeline` / `ar-viewer` / `passport` / `a11y-panel` / `pwa` | 均有入口、出处、PNG 成果与降级 |
| 剩余 legacy 富交互模块 | `three-scene.js`, `pottery-workshop.js`, `ai-recognition.js` 等 | **兼容过渡中** | `src/legacy/` 经 `legacy-bridge.js` 与 `data-shims.js` 接入 | 数据已全量外置 `content/`；按需分块不占首屏；未来可继续逐块 ESM 化 |

## 2. 回归验证里程碑指标对比

| 阶段快照目录 | 桌面(1440) 溢出 | 手机(390) 溢出 | 顶栏 scroll/client | 异常文本 (`undefined`) | 控制台错误 / 404 | 背景 3D 滚动可见 |
| --- | --- | --- | --- | --- | --- | --- |
| `02-core`（接手时） | 否 | **是 (425/390)** | **1549 / 1280 (溢出)** | **有 (`undefined`)** | 0 / 0 | 遮挡不可见 |
| `03-p0-fixed` | 否 (1440/1440) | **否 (390/390)** | **1344 / 1344 (正常)** | **0** | 0 / 0 | 浅/深主题全程可见 |
| `04-3d-upgraded` | 否 (1440/1440) | **否 (390/390)** | **1344 / 1344 (正常)** | **0** | 0 / 0 | 釉面/道具升级后稳定 |
| `05-final`（终极全量） | 否 (1440/1440) | **否 (390/390)** | **1344 / 1344 (正常)** | **0** | 0 / 0 | 全站新旧板块完整（浅/深主题全程可见） |
