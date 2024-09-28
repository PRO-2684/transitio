<img src="./icons/icon.svg" align="right" style="width: 6em; height: 6em;"></img>

# Transitio

> [!NOTE]
> 此插件 `1.0.0` 版本及以上最低支持 LiteLoaderQQNT 1.0.0，之前版本的 LiteLoaderQQNT 请使用 `1.0.0` 之前的 Release

[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT) 插件，用于为 QQNT 加载任意用户样式。

你可能也感兴趣：[Scriptio](https://github.com/PRO-2684/Scriptio)，自定义渲染层 JavaScript 脚本加载器。

## 🪄 具体功能

- 导入/搜索/查看/删除用户样式
- 启用/禁用/配置/重置用户样式
- 开发者模式：监控文件更改，实时预览效果
- 立即重载：立即重载所有用户样式

## 🖼️ 截图

> 演示中使用了 [MSpring-Theme](https://github.com/MUKAPP/LiteLoaderQQNT-MSpring-Theme)，主题色为 `#74A9F6`。

![Transitio settings](./attachments/settings.jpg)

## 📥 安装

### 稳定版

下载 Release 中的 `transitio-release.zip`，解压后放入[数据目录](https://github.com/mo-jinran/LiteLoaderQQNT-Plugin-Template/wiki/1.%E4%BA%86%E8%A7%A3%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84#liteloader%E7%9A%84%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95)下的 `plugins/transitio` 文件夹中即可。(若没有该文件夹请自行创建)

### CI 版

若想体验最新的 CI 功能，需要下载源码后安装要求的 NPM 依赖 (`npm i`)。

## 🤔 使用方法

> [!WARNING]
> 所有不是通过配置界面进行的更改，除非打开了 *开发者模式*，都只在双击 *导入用户样式* 这行字或重启 QQ 后生效。

- 导入样式：在配置界面导入用户样式文件，或将之放入 `data/transitio/styles/` 文件夹。
    - 样式的编写请参考 [Wiki](https://github.com/PRO-2684/transitio/wiki)。
    - 可以在此文件夹下创建多层目录，插件会自动扫描所有支持的用户样式文件，但是设置界面导入的还是默认直接放在 `data/transitio/styles/` 下
- 搜索样式：在设置界面搜索框中输入关键词即可。
    - 未聚焦到其它输入框时可以直接按下 `Enter` 键或 `Ctrl+F` 聚焦到搜索框
    - 根据空格将输入分解为多个关键词，所有关键词均大小写不敏感
    - 可以通过 `#` 符号根据预处理器的 Hashtag 搜索样式，例如 `#none`, `#transitio`, `#stylus` 等
    - 搜索结果展示匹配 **所有普通关键词** 以及 **任一 Hashtag 关键词** (若有) 的样式
- 查看样式
    - 鼠标悬停在样式标题上时，会显示其绝对路径。
    - 鼠标悬停在样式上时，会展示 "在文件夹中显示" 按钮。
- 删除样式：鼠标悬停在样式上并点击删除 `🗑️` 按钮，或进入 `data/transitio/styles/` 文件夹删除对应文件。
- 启用/禁用样式：打开插件设置界面，将对应的样式开关打开/关闭，即时生效。
    - 若点击各个开关速度过快，可能会导致错位等情况，此时请双击 "导入用户样式" 来重载。
- 配置样式：鼠标悬停在样式上并点击设置 `⚙️` 按钮。
- 重置样式：右键 `⚙️` 按钮，即可将样式的配置重置为默认值。
- 更新样式：重新导入、禁用后启用或重载样式即可。

## 💻 调试

- 开发者模式 (不推荐)：若您想要调试 **您的用户样式的效果**，可以在插件设置界面打开*开发者模式*，此时插件会监控 `data/transitio/styles/` 文件夹，当发生更改时，会自动重载。
- Debug 模式：若您想要调试 **此插件本身以及您的用户样式中的错误**，可以使用 `--transitio-debug` 参数启动 QQNT，此时插件会在控制台输出调试信息。

## 📜 用户样式列表

访问 [此网址](https://pro-2684.github.io/?page=transitio_userstyles) 查看用户样式列表。

## ⭐ Star History

[![Stargazers over time](https://starchart.cc/PRO-2684/transitio.svg?variant=adaptive)](https://starchart.cc/PRO-2684/transitio)
