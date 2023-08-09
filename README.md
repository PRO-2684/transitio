<img src="./icon.png" align="right" style="width: 6em; height: 6em;"></img>

# Transitio

[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT) 插件，用于为 QQNT 提供一些丝滑的过渡动画 (`transition 0.2s ease-in-out`)。

## 演示

![Transitio gif](./attachments/transitio.gif)

[Video](./attachments/transitio.mp4)

> 演示中使用了 [MSpring-Theme](https://github.com/MUKAPP/LiteLoaderQQNT-MSpring-Theme)，主题色为 `#74A9F6`。

## 使用方法

### 插件商店

在插件商店中找到 Transitio 并安装。(目前暂未上架，请尝试[手动安装](#手动安装))

### 手动安装

- 稳定版: 下载 Release 中的 `transitio-release.zip`，解压后放入[数据目录](https://github.com/mo-jinran/LiteLoaderQQNT-Plugin-Template/wiki/1.%E4%BA%86%E8%A7%A3%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84#liteloader%E7%9A%84%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95)下的 `plugins/transitio` 文件夹中即可。(若没有该文件夹请自行创建)
- CI 版: 若想体验最新的 CI 功能，可以下载源码后同上安装。(仅需下载下面列出的文件)

完成后的目录结构应该如下:

```
plugins
└── transitio
    ├── manifest.json
    ├── renderer.js
    └── icon.png
```
