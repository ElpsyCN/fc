# 红白机 FC

[![GitHub Pages](https://github.com/ElpsyCN/fc/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/ElpsyCN/fc/actions/workflows/gh-pages.yml)

> 预览地址: <https://fc.elpsy.cn>
> 开发版预览: <https://fc.yunyoujun.cn>

使用 Vue 3 + Vite + TypeScript 重构的在线 FC/NES 模拟器，重构自 [dafeiyu/jsnes](https://gitee.com/feiyu22/jsnes)。

ROM 基于 [JSNES](https://github.com/bfirsh/jsnes) 运行。

## 技术栈

- Vue 3（`<script setup>` + 组合式 API）
- Vite + TypeScript
- Vitest + @vue/test-utils（单元 / 组件测试）
- ESLint（[@antfu/eslint-config](https://github.com/antfu/eslint-config)）

## Usage

```bash
# 安装依赖
pnpm i

# 启动开发服务器 http://localhost:5173
pnpm dev

# 构建生产产物
pnpm build

# 运行测试
pnpm test

# 代码检查 / 自动修复
pnpm lint
pnpm lint:fix
```

### 按键

#### PC 端

| 游戏按键 | 键盘             |
| -------- | ---------------- |
| 上下左右 | 方向键           |
| START    | <kbd>Enter</kbd> |
| SELECT   | <kbd>Space</kbd> |
| A        | <kbd>A</kbd>     |
| B        | <kbd>S</kbd>     |

## Features

- 使用 Vue 3 + Vite + TypeScript 重构，组件全部采用 `<script setup>`
- 复古增强：像素字体（Press Start 2P）、CRT 扫描线 + 屏幕辉光、像素级（`pixelated`）画面渲染
- 支持跟随系统的暗色模式（`prefers-color-scheme`）
- 无障碍：键盘焦点可见、`aria-label` 标签、尊重 `prefers-reduced-motion`
- 键盘绑定基于 `KeyboardEvent.code`，兼容 qwerty / azerty / dvorak 布局
- 点击按钮时的样式反馈与按钮名称
- 使用新版的 [JSNES](https://jsnes.org/) 以 npm 模块方式打包

## Todo

- [ ] 将音频从已废弃的 `ScriptProcessorNode` 迁移到 `AudioWorklet`
- [ ] 支持手柄自定义按键 / 第二玩家
- [ ] 游戏存档（save state）
