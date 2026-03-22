# Antigravity Extension

Antigravity 的 VS Code / IDE 插件骨架，用状态栏入口承载后续的 CDP 控制能力。

## 当前阶段

当前仓库已完成：

- TypeScript 扩展骨架
- `AG Perf` 状态栏入口
- 命令面板恢复命令占位
- Jest 单元 / 集成测试脚手架

后续任务会继续接入：

- 固定端口 CDP 发现
- 多窗口状态探测
- `Full / Light / Off / Close Tabs / Refresh`

## 开发命令

```bash
npm install
npm run typecheck
npm run test:unit -- --runInBand
npm run test:integration -- --runInBand
```

## 当前命令

- `AG Perf: Open Menu`
- `AG Perf: Recover Off`

## 说明

- 当前版本只提供稳定脚手架和占位激活逻辑。
- 后续实现会保持命令 ID 稳定，避免文档与行为漂移。
