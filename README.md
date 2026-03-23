# Antigravity Extension

Antigravity 的 VS Code / IDE 插件骨架，用状态栏入口承载后续的 CDP 控制能力。

> 当前 MVP 只支持 macOS，并且只连接 `127.0.0.1` 上的固定 CDP 端口。

## 当前阶段

当前仓库已完成：

- TypeScript 扩展骨架
- `AG Perf` 状态栏入口
- 全局 QuickPick 菜单
- 单窗口菜单与 `Refresh This Window`
- 命令面板恢复 `Off`
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

集成测试使用受控 fake CDP harness，专门覆盖多窗口同步、混合状态和部分失败聚合。

## 发布 `.vsix` 到 GitHub Release

仓库现在使用 **`master` + tag 发版**：

```bash
npm ci
npm test
npm version patch
git push origin master --follow-tags
```

- `npm version patch` 会同时更新 `package.json` 版本号并创建 `vX.Y.Z` tag
- push 到 `master` 后，`v*` tag 会触发 GitHub Actions 打包 `.vsix`
- 打包产物会自动上传到对应的 GitHub Release

如需本地先验包，可运行：

```bash
npm run package:vsix -- --out antigravity-extention-v$(node -p "require('./package.json').version").vsix
```

## 当前命令

- 启动完成后会自动显示右下角状态栏入口 `AG Perf`
- `AG Perf: Open Menu`
- `AG Perf: Recover Off`

## 当前全局菜单顺序

- `Apply to All: Full`
- `Apply to All: Light`
- `Apply to All: Off`
- `Apply to All: Close Tabs`
- `Select Window…`
- `Refresh`

## 单窗口动作

- `Full`
- `Light`
- `Off`
- `Close Tabs`
- `Refresh This Window`

更多操作说明见 `docs/user-guide.md`。

## CDP 约束

- 只扫描固定端口：`9000`、`9001`、`9002`、`9003`、`9222`
- 只连接 `127.0.0.1`
- 发现或连接失败时会跳过问题端口，不阻塞其他端口

## 说明

- 当前版本只提供稳定脚手架和占位激活逻辑。
- 后续实现会保持命令 ID 稳定，避免文档与行为漂移。

## 启动示例（macOS）

```bash
open -a "Antigravity" --args --remote-debugging-port=9000
```
