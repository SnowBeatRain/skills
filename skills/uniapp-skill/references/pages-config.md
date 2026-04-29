# pages.json 配置详解

官方文档：https://uniapp.dcloud.net.cn/collocation/pages.html

## globalStyle（全局窗口样式）

```json
{
  "globalStyle": {
    "navigationBarTitleText": "页面标题",
    "navigationBarBackgroundColor": "#007AFF",
    "navigationBarTextStyle": "white",           // white | black
    "navigationStyle": "default",                // default | custom（自定义导航栏）
    "backgroundColor": "#F8F8F8",
    "backgroundTextStyle": "dark",               // light | dark（下拉 loading 样式）
    "enablePullDownRefresh": false,
    "onReachBottomDistance": 50,                 // 触底距离（px）
    "usingComponents": {},
    "rpxCalcMaxDeviceWidth": 960,
    "rpxCalcBaseDeviceWidth": 375,
    "pageOrientation": "portrait"                // portrait | landscape
  }
}
```

## pages（页面配置）

```json
{
  "pages": [
    {
      "path": "pages/index/index",              // 必填，相对于项目根目录
      "style": {
        "navigationBarTitleText": "首页",
        "enablePullDownRefresh": true,
        "navigationStyle": "custom",            // 自定义导航栏
        "disableScroll": false,                 // 禁止页面整体滚动
        "app-plus": {                           // App 平台专属
          "titleNView": {
            "buttons": [{ "text": "按钮", "fontSize": "16px" }]
          }
        },
        "mp-weixin": {                          // 微信小程序专属
          "usingComponents": {}
        },
        "h5": {                                 // H5 专属
          "pullToRefresh": { "color": "#007AFF" }
        }
      }
    }
  ]
}
```

## tabBar（底部/顶部导航栏）

```json
{
  "tabBar": {
    "color": "#7A7E83",                         // 未选中文字颜色
    "selectedColor": "#007AFF",                 // 选中文字颜色
    "borderStyle": "black",                     // black | white（边框颜色）
    "backgroundColor": "#ffffff",
    "position": "bottom",                       // bottom | top（top 仅微信小程序支持）
    "fontSize": "10px",
    "iconWidth": "24px",
    "spacing": "3px",
    "height": "50px",
    "midButton": {                              // 中间突出按钮（App/H5）
      "width": "80px",
      "height": "50px",
      "text": "发布",
      "iconPath": "static/plus.png",
      "iconWidth": "24px",
      "backgroundImage": "static/mid-bg.png"
    },
    "list": [
      {
        "pagePath": "pages/index/index",        // 必须是 pages 中已注册的页面
        "text": "首页",
        "iconPath": "static/tab/home.png",      // 图标路径（81×81px 推荐）
        "selectedIconPath": "static/tab/home-active.png",
        "iconfont": {                           // 字体图标（与 iconPath 二选一）
          "text": "\ue102",
          "selectedText": "\ue103",
          "fontSize": "24px",
          "color": "#7A7E83",
          "selectedColor": "#007AFF"
        },
        "visible": true                         // 是否显示（App 3.2.10+）
      }
    ]
  }
}
```

> tabBar 页面跳转只能用 `uni.switchTab()`，`navigateTo` / `redirectTo` 无效。

## subPackages（分包加载）

```json
{
  "subPackages": [
    {
      "root": "subpkg-user",                    // 分包根目录
      "pages": [
        { "path": "profile/profile" },
        { "path": "settings/settings" }
      ]
    },
    {
      "root": "subpkg-order",
      "pages": [
        { "path": "list/list" },
        { "path": "detail/detail" }
      ]
    }
  ],
  "preloadRule": {                              // 分包预加载
    "pages/index/index": {
      "network": "all",                         // all | wifi
      "packages": ["subpkg-user"]
    }
  }
}
```

> 主包放 tabBar 页面和公共资源；分包用于按需加载，减小首屏包体积。
> App 端分包需在 manifest.json 中额外开启。

## easycom（自动引入组件）

```json
{
  "easycom": {
    "autoscan": true,                           // 默认 true，自动扫描 components 目录
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue",
      "^my-(.*)": "@/components/my-$1/my-$1.vue",
      "^van-(.*)": "vant-weapp/dist/$1/index"
    }
  }
}
```

easycom 规则：组件符合 `components/comp-name/comp-name.vue` 目录结构即可自动引入，无需 import / components 声明。

## condition（启动模式配置，仅开发期间）

```json
{
  "condition": {
    "current": 0,
    "list": [
      {
        "name": "调试详情页",
        "path": "pages/detail/detail",
        "query": "id=123"
      }
    ]
  }
}
```

## networkTimeout（网络超时）

```json
{
  "networkTimeout": {
    "request": 60000,
    "connectSocket": 60000,
    "uploadFile": 60000,
    "downloadFile": 60000
  }
}
```

## leftWindow / topWindow / rightWindow（宽屏适配）

uni-app 2.9+ 新增，用于解决 H5 宽屏适配问题。在手机应用的 mainWindow 基础上，可以在左/上/右追加额外窗口。

```json
{
  "topWindow": {
    "path": "responsive/top-window.vue",
    "style": { "height": "44px" }
  },
  "leftWindow": {
    "path": "responsive/left-window.vue",
    "style": { "width": "300px" }
  },
  "rightWindow": {
    "path": "responsive/right-window.vue",
    "style": { "width": "300px" },
    "matchMedia": { "minWidth": 768 }
  },
  "pages": [
    {
      "path": "pages/login/login",
      "style": {
        "topWindow": false,   // 当前页面不显示 topWindow
        "leftWindow": false,
        "rightWindow": false
      }
    }
  ]
}
```

**matchMedia**：通过 `minWidth` 控制何时显示该窗口，默认 768px。

**隐藏导航栏**：存在 topWindow 时自动隐藏大部分页面导航栏：
```css
.uni-app--showtopwindow uni-page-head { display: none; }
```

## globalStyle 补充字段

```json
{
  "globalStyle": {
    "animationType": "pop-in",          // App 窗口显示动画，默认 pop-in
    "animationDuration": 300,           // App 动画时长（ms）
    "backgroundColorTop": "#ffffff",    // iOS 顶部窗口背景色
    "backgroundColorBottom": "#ffffff", // iOS 底部窗口背景色
    "titleImage": "https://...",        // 导航栏图片标题（支付宝/H5/App）
    "transparentTitle": "none",         // 导航栏透明：always/auto/none（支付宝/H5/App）
    "titlePenetrate": "NO",             // 导航栏点击穿透（支付宝/H5）
    "rpxCalcMaxDeviceWidth": 960,       // rpx 计算最大设备宽度
    "rpxCalcBaseDeviceWidth": 375,      // rpx 计算基准设备宽度
    "rpxCalcIncludeWidth": 750,         // rpx 特殊处理值
    "dynamicRpx": false,                // 动态 rpx（nvue vue3 自动启用）
    "maxWidth": 1200                    // H5 最大宽度，超出时两侧留白
  }
}
```

## 页面 style 补充字段

```json
{
  "pages": [{
    "path": "pages/index/index",
    "style": {
      "animationType": "slide-in-right",  // 仅 App 平台
      "animationDuration": 300,           // 仅 App 平台
      "disableSwipeBack": false,          // 禁用滑动返回（App-iOS 3.4.0+）
      "navigationBarShadow": {            // 导航栏阴影
        "colorType": "grey",              // grey | blue | green | orange | red | yellow
        "color": "#cccccc"
      },
      "disableScroll": false,             // 禁止页面整体滚动
      "needLogin": false,                 // 需要登录才可访问（配合 uniIdRouter）
      "h5": {
        "pullToRefresh": { "color": "#007AFF" },  // H5 下拉刷新样式
        "navigationStyle": "default"
      }
    }
  }]
}
```

## uniIdRouter（自动路由守卫）

```json
{
  "uniIdRouter": {
    "loginPage": "pages/login/login",     // 登录页路径
    "needLogin": [                        // 需要登录的页面（匹配前缀）
      "pages/user/",
      "pages/order/"
    ],
    "resToLogin": true                    // 云对象返回 code=10 时自动跳登录
  }
}
```

配合页面 `needLogin: true` 使用，未登录时自动跳转。

## entryPagePath（默认启动首页）

```json
{
  "entryPagePath": "pages/home/home"      // 小程序/鸿蒙元服务启动首页
}
```

## 完整 pages.json 模板

```json
{
  "globalStyle": {
    "navigationBarTitleText": "应用名",
    "navigationBarBackgroundColor": "#007AFF",
    "navigationBarTextStyle": "white",
    "animationType": "pop-in",
    "animationDuration": 300
  },
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } }
  ],
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#007AFF",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "static/home.png", "selectedIconPath": "static/home-active.png" }
    ]
  },
  "subPackages": [{ "root": "subpkg", "pages": [{ "path": "detail/detail" }] }],
  "preloadRule": { "pages/index/index": { "network": "all", "packages": ["subpkg"] } },
  "easycom": { "autoscan": true, "custom": { "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue" } },
  "condition": { "current": 0, "list": [{ "name": "调试", "path": "pages/detail/detail", "query": "id=1" }] },
  "networkTimeout": { "request": 60000 }
}
```
