# User Guide

## 前置条件

- 当前版本只支持 macOS
- Antigravity 需要以固定 CDP 端口之一启动：`9000`、`9001`、`9002`、`9003`、`9222`
- 插件只连接 `127.0.0.1`

### 启动示例（macOS）

```bash
open -a "Antigravity" --args --remote-debugging-port=9000
```

## 入口

- 状态栏：VS Code 启动完成后，右下角会自动显示 `AG Perf`
- 命令面板恢复命令：`AG Perf: Recover Off`
- 如果状态栏暂时没出现，可以先执行 `AG Perf: Open Menu` 触发一次扩展激活

## 全局菜单

点击 `AG Perf` 后会先自动刷新，再显示：

- `Apply to All: Full`
- `Apply to All: Light`
- `Apply to All: Off`
- `Apply to All: Close Tabs`
- `Select Window…`
- `Refresh`

## 单窗口菜单

选择 `Select Window…` 后，先选窗口，再选动作：

- `Full`
- `Light`
- `Off`
- `Close Tabs`
- `Refresh This Window`

## Close Tabs 风险提示

- `Close Tabs` 会关闭该窗口中的编辑器标签页
- 执行前必须确认
- 如果取消确认，插件不会发送任何 `Close Tabs` 指令

## 恢复路径

- 如果 `Full` 模式让状态栏入口不方便使用，请打开命令面板
- 搜索 `AG Perf: Recover Off`
- 执行后会对已发现窗口运行 `Off`

## 无窗口排障

如果菜单里出现 `No Antigravity windows found`，按这个顺序检查：

1. 确认 Antigravity 正在运行
2. 确认它使用了固定端口之一：`9000`、`9001`、`9002`、`9003`、`9222`
3. 确认端口只暴露在 `127.0.0.1`
4. 返回插件菜单并点击 `Refresh`
