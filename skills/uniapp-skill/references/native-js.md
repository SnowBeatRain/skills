# Native.js (NJS) 深度参考

Native.js（NJS）是将操作系统原生对象映射为 JS 对象的技术，允许在 JS 中直接调用 Android/iOS 原生 API，无需编写原生插件。

官方文档：https://uniapp.dcloud.net.cn/tutorial/native-js.html

## 核心概念

### 工作原理

NJS 将原生对象/类/方法映射为 JS 对象，通过 `plus.android.*` 和 `plus.ios.*` API 进行操作：

```
Android: plus.android.importClass("完整包名.类名")
iOS:     plus.ios.importClass("类名")
```

### 类型转换

| Java/Objective-C | JavaScript |
|-----------------|------------|
| byte/short/int/long/float/double | Number |
| String | String |
| NSArray / ArrayList | InstanceObject |
| Class | ClassObject |
| 对象实例 | InstanceObject |
| nil/null | null |

### 平台判断

```js
function judgePlatform() {
  switch (plus.os.name) {
    case "Android":
      // plus.android.*
      break;
    case "iOS":
      // plus.ios.*
      break;
  }
}
```

## 常用 API

### Android 端

#### plus.android.importClass(classname)

导入 Java 类对象，之后可通过 `.` 操作符调用静态方法/常量：

```js
var AlertDialog = plus.android.importClass("android.app.AlertDialog");
var dlg = new AlertDialog.Builder(plus.android.runtimeMainActivity());
dlg.setTitle("原生标题");
dlg.setMessage("原生内容");
dlg.setPositiveButton("确定", null);
dlg.show();
```

#### plus.android.runtimeMainActivity()

获取主 Activity 实例对象，Android 应用全局环境：

```js
var main = plus.android.runtimeMainActivity();
```

#### plus.android.newObject(classname, ...args)

**不导入类**直接创建实例对象（性能优于 importClass）：

```js
var intent = plus.android.newObject("android.content.Intent");
```

#### plus.android.invoke(obj, methodName, ...args)

**不导入类**调用方法（配合 newObject 使用）：

```js
var dlg = plus.android.newObject("android.app.AlertDialog$Builder", main);
plus.android.invoke(dlg, "setTitle", "原生标题");
plus.android.invoke(dlg, "setMessage", "原生内容");
plus.android.invoke(dlg, "setPositiveButton", "确定", null);
plus.android.invoke(dlg, "show");
```

#### plus.android.getAttribute(obj, name) / plus.android.setAttribute(obj, name, value)

不导入类获取/设置属性值。obj 可以是类名字符串、ClassObject 或 InstanceObject。

#### plus.android.implements(interfaceName, obj)

实现 Java 接口，用于回调/监听：

```js
var hevent = plus.android.implements("io.dcloud.NjsHelloEvent", {
  "onEventInvoked": function(name) {
    console.log("回调: " + name);
  }
});
```

#### plus.android.currentWebview()

获取当前 WebView 的原生对象：

```js
var wv = plus.android.currentWebview();
```

### iOS 端

#### plus.ios.importClass(classname)

导入 Objective-C 类对象：

```js
var UIAlertView = plus.ios.importClass("UIAlertView");
var view = new UIAlertView();
view.initWithTitlemessagedelegatecancelButtonTitleotherButtonTitles(
  "原生标题", "原生内容", null, "确定", null
);
view.show();
```

> **注意**：OC 方法名中的 `:` 在 NJS 中会被自动删除。如 `setPositionX:Y:` 变为 `setPositionXY`。

#### plus.ios.newObject(classname, ...args)

不导入类直接创建实例对象：

```js
var view = plus.ios.newObject("UIAlertView");
plus.ios.invoke(view, "initWithTitle:message:delegate:cancelButtonTitle:otherButtonTitles:",
  "原生标题", "原生内容", null, "确定", null);
plus.ios.invoke(view, "show");
```

> **注意**：iOS 端使用 `plus.ios.invoke` 时，方法名**必须保留 `:` 字符**。

#### plus.ios.implements(protocolName, obj)

实现 Objective-C 协议（Protocol），用于代理回调：

```js
var hevent = plus.ios.implements("NjsHelloEvent", {
  "onEventInvoked:": function(name) {
    console.log("回调: " + name);
  }
});
```

#### plus.ios.deleteObject(obj)

释放 NJS 实例对象中映射的原生对象，及时释放资源：

```js
plus.ios.deleteObject(hello);
```

#### plus.ios.invoke(obj, methodName, ...args)

不导入类调用方法。iOS 端方法名**必须包含 `:` 字符**：

```js
plus.ios.invoke(view, "updateName:", "Tester");
```

## 实用场景

### 创建 Android 桌面快捷方式

```js
var Intent = null, BitmapFactory = null;
var main = null;

document.addEventListener("plusready", function() {
  if (plus.os.name == "Android") {
    Intent = plus.android.importClass("android.content.Intent");
    BitmapFactory = plus.android.importClass("android.graphics.BitmapFactory");
    main = plus.android.runtimeMainActivity();
  }
}, false);

function createShortcut() {
  var shortcut = new Intent("com.android.launcher.action.INSTALL_SHORTCUT");
  shortcut.putExtra(Intent.EXTRA_SHORTCUT_NAME, "我的应用");
  shortcut.putExtra("duplicate", false);
  var iconPath = plus.io.convertLocalFileSystemURL("/static/icon.png");
  var bitmap = BitmapFactory.decodeFile(iconPath);
  shortcut.putExtra(Intent.EXTRA_SHORTCUT_ICON, bitmap);
  var action = new Intent(Intent.ACTION_MAIN);
  action.setClassName(main.getPackageName(), 'io.dcloud.PandoraEntry');
  shortcut.putExtra(Intent.EXTRA_SHORTCUT_INTENT, action);
  main.sendBroadcast(shortcut);
}
```

manifest.json 中添加权限：
```json
"app-plus": {
  "distribute": {
    "android": {
      "permissions": [
        "<uses-permission android:name=\"com.android.launcher.permission.INSTALL_SHORTCUT\"/>"
      ]
    }
  }
}
```

### 拨打电话

```js
var Intent = plus.android.importClass("android.content.Intent");
var Uri = plus.android.importClass("android.net.Uri");
var main = plus.android.runtimeMainActivity();
var uri = Uri.parse("tel:10086");
var call = new Intent("android.intent.action.CALL", uri);
main.startActivity(call);
```

### iOS Game Center 登录

```js
var GKLocalPlayer = null, NSNotificationCenter = null;
var delegate = null;

document.addEventListener("plusready", function() {
  if (plus.os.name == "iOS") {
    GKLocalPlayer = plus.ios.importClass("GKLocalPlayer");
    NSNotificationCenter = plus.ios.importClass("NSNotificationCenter");
    loginGamecenter();
  }
}, false);

function loginGamecenter() {
  var nc = NSNotificationCenter.defaultCenter();
  delegate = plus.ios.implements("NSObject", {
    "authenticationChanged:": function(notification) {
      var player = notification.plusGetAttribute("object");
      if (player.plusGetAttribute("isAuthenticated")) {
        alert(player.plusGetAttribute("displayName") + " 已登录！");
      } else {
        alert("请登录");
      }
      plus.ios.deleteObject(player);
    }
  });
  nc.addObserverselectornameobject(delegate,
    plus.ios.newObject("@selector", "authenticationChanged:"),
    "GKPlayerAuthenticationDidChangeNotificationName", null);

  var localplayer = GKLocalPlayer.localPlayer();
  if (localplayer.isAuthenticated()) {
    // 已登录
  } else {
    localplayer.authenticateWithCompletionHandler(null);
  }
  plus.ios.deleteObject(localplayer);
  plus.ios.deleteObject(nc);
}
```

## 性能优化

### 1. 在 plusready 事件中预导入类

首次导入类有 ~0.5s 延迟，应在 plusready 中提前导入：

```js
var AlertDialog = null, main = null;
document.addEventListener("plusready", function() {
  if (plus.os.name == "Android") {
    main = plus.android.runtimeMainActivity();
    AlertDialog = plus.android.importClass("android.app.AlertDialog");
  }
}, false);
```

### 2. 使用高级 API 减少 importClass

导入类对象消耗系统资源，以下情况应使用高级 API（newObject + invoke）：
- 导入的类特别复杂、继承层次多
- 仅为了实例化作为参数传递给其他 API
- 同一页面导入了太多类

```js
// 低效：导入类
var AlertDialog = plus.android.importClass("android.app.AlertDialog");
var dlg = new AlertDialog.Builder(main);

// 高效：不导入类
var dlg = plus.android.newObject("android.app.AlertDialog$Builder", main);
plus.android.invoke(dlg, "setTitle", "标题");
plus.android.invoke(dlg, "show");
```

### 3. 避免短时间内高频调用 NJS

JS 与原生之间的数据交换效率低于纯 JS 内部运算，应避免短时间内并发触发 NJS 代码。

## 重要注意事项

1. **uni-app 不推荐 NJS**：官方文档明确指出 `Uni-app不推荐使用Native.js`，优先使用 uni.* API 或 UTS 插件
2. **uni-app x 不支持 NJS**：uni-app x 使用 UTS 语言开发原生插件
3. **不支持 UI 操作**：uni-app 中 NJS 不能执行 UI 相关操作及 WebView 相关 API
4. **调试**：可通过 Chrome/Safari 开发者工具查看原生对象属性方法
5. **鸿蒙平台**：`plus` 对象不可用，统一使用 `uni.*` API 或通过 UTS 插件调用原生 API

## 开发资源

- [HTML5+ API - Native.js for Android](http://www.html5plus.org/doc/zh_cn/android.html)
- [HTML5+ API - Native.js for iOS](http://www.html5plus.org/doc/zh_cn/ios.html)
- [iOS 官方文档](https://developer.apple.com/documentation/)
- [Android 官方文档](https://developer.android.com/reference/)
- [NJS 代码示例合集](http://ask.dcloud.net.cn/article/114)
