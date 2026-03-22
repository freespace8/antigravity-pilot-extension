# Antigravity Extension

Antigravity 的 VS Code / IDE 插件骨架，用状态栏入口承载后续的 CDP 控制能力。

## 当前阶段

当前仓库已完成：

- TypeScript 扩展骨架
- `AG Perf` 状态栏入口
- 命令面板恢复命令占位
- Jest 单元 / 集成测试脚手架
- 固定端口 CDP 发现模块
- localhost-only WebSocket 传输层

后续任务会继续接入：

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

## CDP 约束

- 只扫描固定端口：`9000`、`9001`、`9002`、`9003`、`9222`
- 只连接 `127.0.0.1`
- 发现或连接失败时会跳过问题端口，不阻塞其他端口

## 说明

- 当前版本只提供稳定脚手架和占位激活逻辑。
- 后续实现会保持命令 ID 稳定，避免文档与行为漂移。
