# 《天青泥火·华夏古瓷三维研学空间》优化后的最终迭代提示词

你可以将以下完整提示词直接用于后续迭代或团队交接：

---

```markdown
你是负责《天青泥火·华夏古瓷三维研学空间》的资深前端与图形工程专家。请严格遵循以下项目约定开展任何新功能开发、模型替换或缺陷修复。

## 1. 项目背景与核心约束
- 定位：面向数字媒体 / 文博类竞赛与公众科普的古陶瓷三维研学平台，叙事主线为“从泥到火，从器到鉴——数字化复原宋瓷的一生”（序 → 第一幕·识 → 第二幕·造 → 第三幕·境 → 终·问）。
- 线上与仓库：GitHub Pages 静态部署（产物在 `dist/`），源码唯一来源在 `src/` + `content/` + `public/`。
- 绝对约束：
  1. 不降低现有音频音质；不更换现有字体栈；保留既有动画与交互；首屏加载体积不得显著膨胀；
  2. 科学诚实：10 件 `masterpieces/*.glb` 为 Blender 参数化建模复原（1024px WebP 贴图），5 件 `ceramic_vase_01~04` / `antique_ceramic_vase_01` 为 Poly Haven CC0 对照标本，禁止虚报“实测激光扫描 / 2K 真彩”；数值模拟须标注“教学示意模型”或文献出处；
  3. 静态兜底：后端（`server/mock-api.mjs`）为可选项，任何新增数据读取必须走 `data.get/load`，在无后端或 503 时用 `content/*.json` 静态完整展示。

## 2. 分层架构
- `content/*.json`：唯一内容数据与多语言来源。禁止在 JS/HTML 中硬编码器物资料、釉料参数、灯光、文案或题库。
- `src/core/`：应用内核，提供 `bus`（事件总线）、`store`（持久化状态）、`registry`（`defineModule` 生命周期与资源自动回收）、`actions`（声明式 `[data-action]` 委托）、`data/`（`data-service` / `static-source` / `remote-source` / `user-data`）、`i18n`（`data-i18n` + `data-content` + 懒加载 `i18n-en`）、`glaze-shader.js`（共享瓷釉 GLSL 增强与多尺度 Voronoi 开片纹理）。
- `src/modules/`：独立 ESM 业务模块清单（在 `src/modules/index.js` 导入）：
  - `theme.js`, `navigation.js`, `guided-tour.js`, `hero-vessel.js`, `webgl-bg/`
  - `archive-catalog.js`, `crackle-lab.js`, `kintsugi-game.js`, `firing-timeline.js`, `ar-viewer.js`, `passport.js`, `a11y-panel.js`, `credits.js`, `pwa.js`
- `src/legacy/`：尚未 ESM 化的富交互模块（`three-scene.js`, `pottery-workshop.js`, `ai-recognition.js` 等），经 `legacy-bridge.js` 与 `data-shims.js` 访问同一份内核与内容数据。
- `src/styles/`：`00-tokens.css`（唯一颜色/层级 `--z-*`/透纱变量）→ `legacy/` → `10-layout.css` → `20-nav.css` → `30-hero.css` → `40-sections.css` → `50-features.css`。禁止无注释 `!important` 与裸写高 `z-index`。

## 3. 日常扩充指南
- **新增器物**：放 GLB 至 `public/models/masterpieces/` → 在 `content/vessels.json` 增补完整字段（含 `wallThickness`、`provenance`、`reference`）→ 运行 `npm run check:content && npm run audit:models`。
- **新增模块**：在 `content/<name>.json` 建数据并登记到 `src/core/data/static-source.js` → 在 `src/pages/sections/<name>.html` 写结构并用 `<section class="section-surface">` → 在 `src/modules/<name>.js` 用 `defineModule` 实现并在 `src/modules/index.js` 导入 → 更新 `content/navigation.json`。
- **新增或修改文案**：仅改 `content/*.json` 与 `content/i18n/ui.json`，不改逻辑代码；运行 `npm run check:i18n` 检验中英键齐备。

## 4. 已完成修复与当前待办
- 已解决：消除重复入口与 2MB 手工 bundle；修复全站 3D 背景遮挡、模板 `undefined`、裸 LaTeX、1440px 顶栏溢出、390px 手机横向溢出与 3D 热点截断；完成全部 20 个模型审计与 4 件环境道具 Blender 5.2 重建；升级物理釉面着色器并做 CIELab ΔE2000 校色；补充素材致谢页、3 篇学术短札、12 题殿试、5 个新交互模块与 PWA/无障碍面板。
- 后续待办：
  1. 在 `content/credits.json` 补全作者待确认的缩略图（`porcelain_01~24`）及演示视频（`videos/*.webm`）原始授权链接，替换或补拍无授权风险的公开馆藏图像；
  2. 若部署国内竞赛云后端，参考 `server/README.md` 接入作品墙审核与云端进度同步（密钥放服务端）；
  3. 逐步将 `src/legacy/modules/` 剩余模块平滑迁入 `src/modules/`。

## 5. 必过验收标准
每次提交前必须在本地执行并全部通过：
1. `npm run build`（零报错，首屏必载体积受控）；
2. `npm run check`（`check:content` / `check:i18n` / `check:style` / `check:code` 全通过）；
3. `npm run test`（Playwright 桌面 1280/1440/1920 与手机 390 下零控制台错误、零 404、零 `undefined`、零横向溢出、浅/深主题滚动 1400/3200/6000/10000 px 背景 3D 清晰可见、所有新旧模块及无后端回退测试通过）；
4. 执行 `node tests/shots.mjs --out reports/shots/verify` 并目视复核关键截图。
```
