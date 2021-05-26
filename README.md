# 红白机 FC

[![GitHub Pages](https://github.com/ElpsyCN/fc/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/ElpsyCN/fc/actions/workflows/gh-pages.yml)

> 预览地址: <https://fc.elpsy.cn>

使用 vue + vite + ts 重构 [dafeiyu / jsnes](https://gitee.com/feiyu22/jsnes)。

ROM 基于 [JSNES](https://github.com/bfirsh/jsnes) 运行。

## Usage

```bash
# 安装依赖
# yarn
pnpm i
```

```bash
# 启动 http://localhost:3000
# yarn dev
pnpm dev
```

### 按键

#### PC 端

| 游戏按键 | 键盘             |
| -------- | ---------------- |
| 上下左右 | 方向键           |
| START    | <kbd>Enter</kbd> |
| SELECT   | <kbd>Tab</kbd>   |
| A        | <kbd>A</kbd>     |
| B        | <kbd>S</kbd>     |

## Features

- 使用 Vue + Vite + TypeScript 重构
- 增加了点击按钮时的样式反馈
- 添加按钮名称
- 绑定了 PC 按钮
- 使用新版的 [JSNES](https://jsnes.org/) CDN

## Todo

- 使用 Vue + Vite + TypeScript 重构
- 添加谷歌统计
