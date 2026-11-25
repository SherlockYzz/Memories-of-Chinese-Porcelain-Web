# 可选后端接入与静态兜底规范

## 1. 设计原则
- **静态优先，永远可用**：所有核心展示数据（`content/*.json`）均打入前端静态包（`src/core/data/static-source.js`），后端不可用、超时或未配置时，前端 `data-service.js` 自动回退到静态快照，确保竞赛现场断网或海外访问不稳时展示零中断。
- **密钥零前端暴露**：若后续接入大模型讲解员代理或作品审核接口，API Key 与数据库凭证**严禁**写入 `src/` 或 `content/`。

## 2. 轻量参考接口 (`server/mock-api.mjs`)
运行 `node server/mock-api.mjs` 启动本地示例服务（默认端口 `4188`）：
- `GET /api/health` -> `{ ok: true }`
- `GET /api/content/:collection` -> 返回与 `content/<collection>.json` 同构的数据
- `POST /api/passport/sync` -> 模拟研学护照印章同步（含基础字段长度校验与敏感词过滤占位）
- `POST /api/feedback` -> 模拟用户研学反馈接收

## 3. 国内可访问部署建议
- **静态托管**：国内竞赛演示建议同步镜像至国内 CDN / 腾讯云 EdgeOne / 阿里云 OSS，避免评审现场 GitHub Pages 访问抖动；配合站点内置 PWA (`public/sw.js`)，首次打开后可离线演示。
- **后端升级路径**：若上云函数与数据库（如腾讯云 CloudBase / 阿里云函数计算 FC + MongoDB/MySQL），需提前完成域名 ICP 备案；所有用户投稿与手记壁须经过内容安全审核接口并遵循最小化隐私收集原则（仅存匿名昵称与进度）。
