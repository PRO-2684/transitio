<img src="./icons/icon.svg" align="right" style="width: 6em; height: 6em;"></img>

# Transitio

> [!NOTE]
> 此插件 `1.0.0` 版本及以上最低支持 LiteLoaderQQNT 1.0.0，之前版本的 LiteLoaderQQNT 请使用 `1.0.0` 之前的 Release

[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT) 插件，用于为 QQNT 加载任意 CSS 片段。

你可能也感兴趣：[Scriptio](https://github.com/PRO-2684/Scriptio)，自定义渲染层 JavaScript 脚本加载器。

## 🪄 具体功能

- 导入 CSS 代码片段
- 启用/禁用/配置 CSS 代码片段
- 开发者模式：监控文件更改，实时预览效果
- 立即重载：立即重载所有 CSS 代码片段

## 🖼️ 截图

> 演示中使用了 [MSpring-Theme](https://github.com/MUKAPP/LiteLoaderQQNT-MSpring-Theme)，主题色为 `#74A9F6`。

![Transitio settings](./attachments/settings.jpg)

## 📥 安装

### 稳定版

下载 Release 中的 `transitio-release.zip`，解压后放入[数据目录](https://github.com/mo-jinran/LiteLoaderQQNT-Plugin-Template/wiki/1.%E4%BA%86%E8%A7%A3%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84#liteloader%E7%9A%84%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95)下的 `plugins/transitio` 文件夹中即可。(若没有该文件夹请自行创建)

### CI 版

若想体验最新的 CI 功能，可以下载源码后同上安装。(仅需下载下面列出的文件)

完成后的目录结构应该如下:

```
plugins (所有的插件目录)
└── transitio (此插件目录)
    ├── manifest.json (插件元数据)
    ├── main.js (插件代码)
    ├── preload.js (插件代码)
    ├── renderer.js (插件代码)
    ├── settings.html (插件设置界面)
    ├── icons/ (插件用到的图标)
    └── modules/ (模块化的插件代码)
```

## 🤔 使用方法

> [!WARNING]
> 所有不是通过配置界面进行的更改，除非打开了 *开发者模式*，都只在双击 *导入 CSS* 这行字或重启 QQ 后生效。

- 启用/禁用样式：打开插件设置界面，将对应的样式开关打开/关闭，即时生效。
    - 若点击各个开关速度过快，可能会导致错位等情况，此时请双击 "导入 CSS" 来重载。
- 导入样式：在配置界面导入 CSS 文件，或将之放入 `data/transitio/styles/` 文件夹。
    - 样式的编写请参考 [Wiki](https://github.com/PRO-2684/transitio/wiki)。
    - 可以在此文件夹下创建多层目录，插件会自动扫描所有 CSS 文件，但是设置界面导入的还是默认直接放在 `data/transitio/styles/` 下
- 删除样式：鼠标悬停在样式上并点击删除 `🗑️` 按钮，或进入 `data/transitio/styles/` 文件夹删除对应文件。
- 修改样式：修改对应文件即可。
    - 鼠标悬停在样式标题上时，会显示其绝对路径。
    - 鼠标悬停在样式上时，会展示 "在文件夹中显示" 按钮。
- 配置样式：鼠标悬停在样式上并点击设置 `⚙️` 按钮。
- 搜索样式：在设置界面搜索框中输入关键字即可。(Tips: 未聚焦到其它输入框时可以直接按下 `Enter` 键或 `Ctrl+F` 聚焦到搜索框)
- 更新样式：重新导入即可。

## 💻 调试

- 开发者模式：若您想要调试**您的 CSS 片段**，可以在插件设置界面打开*开发者模式*，此时插件会监控 `data/transitio/styles/` 文件夹，当发生更改时，会自动重载。
- Debug 模式：若您想要调试**此插件本身**，可以使用 `--transitio-debug` 参数启动 QQNT，此时插件会在控制台输出调试信息。

## 📜 用户 CSS 片段

> [!NOTE]
> 以下样式均为由我/其它用户编写的 CSS 片段，不内置在插件中。
>
> 若你有愿意分享的样式，欢迎[提交 PR 或 Issue](https://github.com/PRO-2684/transitio/issues/4) 来将它们添加到这里。编写样式前推荐先阅读 [Wiki](https://github.com/PRO-2684/transitio/wiki)。

| 名称 | 用户样式 | 作者 | 说明 |
| --- | --- | --- | --- |
| [admin_s_green_hat](https://github.com/sileence114/ntqq_user_script/blob/main/README.md#admin_s_green_hat) | 🟢 | [sileence114](https://github.com/sileence114) | 让管理员戴回绿帽（将管理员头衔颜色重新改为绿色） |
| [auto-fold-chat-input-area](https://github.com/lamprose/transitio-css#auto-fold-chat-input-area) | 🔴 | [lamprose](https://github.com/lamprose) | 消息输入框默认折叠有文字输入时展开 |
| [avatar-float](https://github.com/PRO-2684/Transitio-user-css/#avatar-float) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 头像浮动 |
| [avatar-the-bubbles](https://gist.github.com/BingZi-233/bfed496741624cc2e51aa7c9cdfca78a) | 🟢 | [BingZi-233](https://github.com/BingZi-233) | 头像描边 |
| [Adjust group option width in friend info interface](https://github.com/YatFanLan/Adjust-group-option-width-in-friend-info-interface) | 🟢 | [YatFanLan](https://github.com/YatFanLan) | 调整好友界面的分组选项宽度|
| [bubble-bg-color](https://gist.github.com/EmptyDreams/e1374d3e334904f1103bee1ff9087dc5) | 🟢 | [EmptyDreams](https://github.com/EmptyDreams) | 修改自己发送的聊天气泡的背景色 |
| [customize-more-menu](https://github.com/PRO-2684/Transitio-user-css/#customize-more-menu) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 自定义隐藏主界面更多菜单中的项目 |
| [customize-settings](https://github.com/PRO-2684/Transitio-user-css/#customize-settings) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 自定义隐藏 QQNT 原生设置界面选项，默认隐藏“超级调色盘” |
| [compact-at-list](https://github.com/PRO-2684/Transitio-user-css/#compact-at-list) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 艾特建议面板更为紧凑 |
| [chat-the-bubbles](https://gist.github.com/BingZi-233/0193165fa053f6d9e61140180d9a5995) | 🟢 | [BingZi-233](https://github.com/BingZi-233) | 气泡描边 |
| [demo-mode](https://github.com/PRO-2684/Transitio-user-css/#demo-mode) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | [演示模式](https://github.com/qianxuu/LiteLoaderQQNT-Plugin-Demo-mode)的 CSS |
| [font-color](https://github.com/nogodnodevil/Transitio--font-color) | 🔴 | [nogodnodevil](https://github.com/nogodnodevil) | 自定义 QQNT 一些文字的颜色 |
| [hide-emoticon-response](https://github.com/PRO-2684/Transitio-user-css/#hide-emoticon-response) | 🟢 | [InfSein](https://github.com/InfSein) | 移除右键消息上的表情回应 |
| [hide-items](https://github.com/PRO-2684/Transitio-user-css/#hide-items) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 隐藏一些元素 |
| [hide-level](https://github.com/SoudayoWwww/transitio-hide-level#hide-level) | 🔴 | [SoudayoWwww](https://github.com/SoudayoWwww) | 隐藏群内等级 |
| [Hide certain features in the settings](https://github.com/YatFanLan/Hide-certain-features-in-the-settings) | 🟢 |[YatFanLan](https://github.com/YatFanLan) | 隐藏设置中的某些功能(隐藏安全设置,隐藏软件更新)|
| [Hide-the-Import-Phone-Album-feature-in-the-upper-right-corner-of-the-My-Phone-Chat-window](https://github.com/YatFanLan/Hide-the-Import-Phone-Album-feature-in-the-upper-right-corner-of-the-My-Phone-Chat-window) | 🟢 |[YatFanLan](https://github.com/YatFanLan) | 隐藏我的手机聊天窗口中右上角的导入手机相册功能|
| [hide-lock](https://github.com/PRO-2684/Transitio-user-css/#hide-lock) | 🟢 | [Shapaper233](https://github.com/Shapaper233) | 隐藏侧边栏 "更多" 中倒数第四个按钮 ("锁定") |
| [hide-self](https://github.com/PRO-2684/Transitio-user-css/#hide-self) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 隐藏自己的头像和昵称 |
| [ Hide-the-QQ-Space-option-on-the-Friends-Information-screen](https://github.com/YatFanLan/Hide-the-QQ-Space-option-on-the-Friends-Information-screen) | 🟢 | [YatFanLan](https://github.com/YatFanLan) |  隐藏好友信息界面的QQ空间选项|
| [highlight-at](https://github.com/PRO-2684/Transitio-user-css/#highlight-at) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 高亮艾特 |
| [image-viewer](https://github.com/PRO-2684/Transitio-user-css/#image-viewer) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 媒体查看器透明度修改 |
| [ImageSize](https://github.com/zhuoxin-lzk/transitio-ImageSize) | 🔴 | [zhuoxin-lzk](https://github.com/zhuoxin-lzk) | 限制图片和表情显示大小 |
| [input-placeholder](https://github.com/PRO-2684/Transitio-user-css/#input-placeholder) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 添加输入框提示（占位符） |
| [link-color](https://github.com/PRO-2684/Transitio-user-css/#link-color) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 链接动态颜色：悬浮/按下时显示相应颜色。 |
| [lite-tools-recall-enhancement](https://github.com/PRO-2684/Transitio-user-css/#lite-tools-recall-enhancement) | 🟢 | [Shapaper233](https://github.com/Shapaper233) | 给 lite-tools 的撤回消息加上红色增强描边 |
| [message-img-transparent](https://github.com/lamprose/transitio-css#message-img-transparent) | 🔴 | [lamprose](https://github.com/lamprose) | 包含图片消息背景透明 |
| [ng-mask](https://github.com/KelsAstell/Transitio-ng-mask) | 🔴 | [KelsAstell](https://github.com/KelsAstell) | 图片模糊（鼠标悬停查看） |
| [no-update](https://github.com/PRO-2684/Transitio-user-css/#no-update) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 隐藏更新提示框以及小红点 |
| [Private Plus](https://github.com/MapleRecall/Transitio-user-css#2-private-plus) | 🟢 | [MapleRecall](https://github.com/MapleRecall) | CSS版本高级隐私模式，优雅，实用。 |
| [qqface-fine-tune](https://github.com/PRO-2684/Transitio-user-css/#qqface-fine-tune) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | QQ 表情微调 |
| [q-tag-enhancement](https://github.com/PRO-2684/Transitio-user-css/#q-tag-enhancement) | 🟢 | [Shapaper233](https://github.com/Shapaper233) | 给 qq 的各种头衔添加对应颜色的高光 |
| [rainbow-name](https://github.com/PRO-2684/Transitio-user-css/#rainbow-name) | 🟢 | [InfSein](https://github.com/InfSein) | 让自己的名字变为彩虹色 |
| [rounded-corners](https://github.com/zhulinyv/rounded-corners) | 🟢 | [zhulinyv](https://github.com/zhulinyv) | 圆角会话列表 |
| [Sidebar Management](https://github.com/YF-Eternal/Sidebar-Management) | 🟢 | [YF-Eternal](https://github.com/YF-Eternal) | 自定义隐藏侧边栏的选项 |
| [SimSun-font](https://github.com/shiquda/Transitio-user-css/#SimSun-font.css) | 🔴 | [shiquda](https://github.com/shiquda) | 使用宋体字体 |
| [Smooth QQ](https://github.com/MapleRecall/Transitio-user-css#1-smooth-qq) | 🟢 | [MapleRecall](https://github.com/MapleRecall) | 顺滑QQ，给新消息、菜单、交互等加入动画 |
| [sr_ui_extra](https://github.com/yhzcake/Transitio-user-css/#sr_ui_extra) | 🟢 | [yhz_cake](https://github.com/yhzcake) | 针对安装[仿星穹铁道短信UI](https://github.com/SyrieYume/starrail_ui)与其他主题冲突及部分特性进行修改 |
| [Teams](https://github.com/MapleRecall/Transitio-user-css#3-teams) | 🟢 | [MapleRecall](https://github.com/MapleRecall) | `© Microsoft Teams` 主题 |
| [transition](https://github.com/PRO-2684/Transitio-user-css/#transition) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 添加过渡动画 |
| [transparent](https://github.com/PRO-2684/Transitio-user-css/#transparent) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 透明化部分元素 |
| [variable-fonts-fix](https://github.com/PRO-2684/Transitio-user-css/#variable-fonts-fix) | 🟢 | [Shapaper233](https://github.com/Shapaper233) | 给可变字体添加一定的字宽 |
| [vue-highlight](https://github.com/PRO-2684/Transitio-user-css/#vue-highlight) | 🟢 | [PRO-2684](https://github.com/PRO-2684) | 高亮 Vue components，用于开发目的 |
| [wechat-theme](https://github.com/festoney8/LiteLoaderQQNT-Wechat-Theme/) | 🔴 | [festoney8](https://github.com/festoney8) | 高仿微信风格主题 |

## ⭐ Star History

[![Stargazers over time](https://starchart.cc/PRO-2684/transitio.svg?variant=adaptive)](https://starchart.cc/PRO-2684/transitio)
