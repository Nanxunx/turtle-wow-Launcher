# UI / 功能界面目录

## 启动时流程
1. `initContext()`：取默认目录；创建客户端目录；检查 Data。
2. 首次使用：语言 + 下载镜像。
3. Linux：要求填写启动命令（Wine/PortProton 模板）。
4. 首次 Config：Performance / Fidelity / 不套预设；自动侦测显示器分辨率；可启用推荐 DLL。
5. 版本变化：What’s New + migrations。
6. 认证：保存账号选择、账号/Region 登录、密码、2FA code。
7. 进入主界面后并行执行 Patcher、Updater verify、Addon verify。

## 主导航
- News：Twitter/新闻 feed、Radio 大组件、节目 Calendar、changelog feed。
- Tweaks：Auto Loot、Nameplate Range、FOV、Render Distance、Clutter Distance、Camera Distance、Background Sounds。
- Addons：已安装/可用、搜索、Git 安装、更新全部、忽略更新、分支、remote 修复/替换、依赖、README/TOC、删除/打开目录。
- Mods：官方提供 DLL Mods、任意自定义 DLL、Custom MPQ、Patch.toc 标题/版本/网站/备注、启停；Dev 模式出现开发补丁区。

## Dev Patch
- 自动发现 `Data/patch-X/` 目录。
- Git status/pull/push/branch。
- 可选 Open in VS Code。
- Build MPQ；若 WoW 正在运行可强制关闭，Build 后按条件重启。
- Override、Untrack。
- Extract MPQ 到目录。

## 顶栏/托盘
- Language、Settings、Minimize、Quit。
- Minimize-to-tray 后托盘：Launch、四个 Tab、Radio Play/Pause、Live、Quit。
- 关闭时若更新进行中，`Window.close()` 会阻止关闭。

## LaunchPanel 状态机
`verifying` / `serverUnreachable` / `launcherOutdated` / `updateAvailable` / `updating` / `upToDate` / `gameRunning` / `failed`。

## Settings
- Download mirror（当前构建用实时下载速度而非单纯 ping 展示）
- Client directory
- Language
- Clean WDB each launch
- Minimize to tray
- Close launcher on launch
- Beta launcher/mod updates
- Linux launch args
- Changelog / Config preset reset 等入口

## 隐藏 Developer Settings
右下角低透明度 Turtle 入口：Dev token、Server URL、client version override、unpublished changes、Open in VS Code button。
