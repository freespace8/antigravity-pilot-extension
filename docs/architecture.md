# Architecture Notes

## 插件骨架

当前扩展采用 TypeScript + Jest 脚手架：

- `src/extension.ts`：扩展激活、状态栏入口、命令注册
- `src/cdp/`：本地 CDP 发现与传输层
- `src/test-support/`：单元测试所需的 VS Code mock

## 固定端口发现

MVP 只扫描以下本地端口：

- `9000`
- `9001`
- `9002`
- `9003`
- `9222`

发现阶段只请求 `http://127.0.0.1:<port>/json`，不会连接远程主机。

## localhost-only 安全边界

- 仅接受 `ws://127.0.0.1:...` 的 `webSocketDebuggerUrl`
- 非 `127.0.0.1` 目标会在 discovery 阶段被过滤
- 超时、请求失败、无效 JSON 只记录为 discovery 错误，不阻塞其他端口

## CDP 传输层

- `connectCDP` 负责建立单个本地 page target 的 WebSocket 连接
- 连接建立后自动启用 `Runtime.enable`
- 传输层会跟踪 `Runtime.executionContextCreated / Destroyed / Cleared`
- 上层服务通过 `call(method, params)` 发送 CDP 指令

## 简化动作与状态真相

- `src/cdp/actions/simplify.ts` 统一负责 `Full / Light / Off`
- `src/cdp/actions/closeTabs.ts` 统一负责 `Close Tabs`
- `src/state/probe.ts` 负责把页面状态探测为 `off / light / full / unknown`
- 状态探测不依赖 UI 缓存，而是读取 DOM marker：
  - style id: `ag-perf-simplify`
  - mode attribute: `data-ag-perf-mode`
- 任一上下文探测失败时允许降级为 `unknown`，避免把探测异常误报为 `off`

## 刷新编排与单一状态真相

- `src/services/refreshService.ts` 是窗口快照的唯一写入点
- 刷新流程：discovery → connect → probe → assemble snapshot → 原子替换 cache
- 旧 refresh 结果不会覆盖更新的 refresh 结果，避免 stale cache 反向写回
- `src/services/actionRunner.ts` 负责批量或单窗口动作执行，并统一返回 `成功 N / 失败 M` 的聚合结果
- UI 层后续只消费 refresh snapshot 和 action aggregate result，不再自行拼装状态
