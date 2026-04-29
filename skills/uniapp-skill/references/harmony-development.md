# 鸿蒙核心开发

官方文档：https://uniapp.dcloud.net.cn/tutorial/harmony/intro.html
UTS 文档：https://doc.dcloud.net.cn/uni-app-x/uts/

> 相关文档：`references/harmony-basics.md`（基础与快速参考）、`references/harmony-advanced.md`（进阶功能与发布）、`references/harmony-migration.md`（适配与迁移实战）

---

## 一、UTS 插件开发（鸿蒙）

UTS 插件是调用鸿蒙原生能力的唯一方式。JS 层无法直接调用鸿蒙原生 API（4.31+ JSVM 架构）。

### 1.1 插件目录结构

```
uni_modules/
└── my-harmony-plugin/
    ├── package.json              # 插件配置（必须 arkts: true）
    ├── utssdk/
    │   ├── interface.uts         # 跨平台接口定义
    │   └── app-harmony/
    │       ├── index.uts         # 鸿蒙实现
    │       ├── config.json       # 鸿蒙配置
    │       └── *.ets             # 鸿蒙原生组件（可选）
    └── readme.md
```

### 1.2 package.json 配置

```json
{
  "uni_modules": {
    "uni-ext-api": {
      "uni": {
        "openAppProduct": {
          "name": "openAppProduct",
          "app": {
            "js": false,
            "kotlin": false,
            "swift": false,
            "arkts": true
          }
        }
      }
    }
  }
}
```

关键：`"arkts": true` 启用鸿蒙支持。

### 1.3 接口定义（interface.uts）

```typescript
export interface Uni {
    openAppProduct(options: OpenAppProductOptions): void;
}

export type OpenAppProductSuccess = { errMsg: string };
export type OpenAppProductFail = { errMsg: string };
export type OpenAppProductSuccessCallback = (result: OpenAppProductSuccess) => void;
export type OpenAppProductFailCallback = (result: OpenAppProductFail) => void;

export type OpenAppProductOptions = {
    success?: OpenAppProductSuccessCallback | null,
    fail?: OpenAppProductFailCallback | null,
    complete?: ((result: any) => void) | null
};
```

### 1.4 鸿蒙实现（app-harmony/index.uts）

```typescript
import { productViewManager } from '@kit.StoreKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import type { common, Want } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';

export function openAppProduct(options: OpenAppProductOptions) {
    try {
        const request: Want = {
            parameters: {
                bundleName: bundleManager.getBundleInfoForSelfSync(
                    bundleManager.BundleFlag.GET_BUNDLE_INFO_DEFAULT).name
            }
        };
        productViewManager.loadProduct(getContext() as common.UIAbilityContext, request, {
            onError: (err: BusinessError) => {
                options?.fail?.({ errMsg: err.message });
                options?.complete?.({ errMsg: err.message });
            }
        } as productViewManager.ProductViewCallback);
    } catch (err) {
        options?.fail?.({ errMsg: String(err) });
    }
}
```

### 1.5 页面中使用

**方式一：挂载到 uni 全局对象**

```vue
<script lang="uts">
// 在任意页面 import 一次（注册到 uni 对象）
import "@/uni_modules/my-harmony-plugin"

export default {
    methods: {
        doSomething() {
            uni.openAppProduct({
                success: (res) => { console.log(JSON.stringify(res)); },
                fail: (err) => { console.error(JSON.stringify(err)); }
            });
        }
    }
}
</script>
```

**方式二：直接导入**

```vue
<script lang="uts">
import { openAppProduct } from "@/uni_modules/my-harmony-plugin"

export default {
    methods: {
        doSomething() {
            openAppProduct({ success: (res) => { console.log(res); } });
        }
    }
}
</script>
```

### 1.6 使用鸿蒙第三方库（ohpm）

HBuilderX 4.25+ 支持在 UTS 插件中导入 ohpm 包：

```typescript
// 在 /uni_modules/*/utssdk/app-harmony/*.uts 中
import { Pay } from '@cashier_alipay/cashiersdk'

export function requestPayment(options: RequestPaymentOptions) {
    return new Pay().pay(options.orderInfo, true)
}
```

**限制：不能在项目页面中直接使用 ohpm 包，必须通过 UTS 插件中转。**

### 1.7 混编 ArkTS/ETS 文件

```
utssdk/
└── app-harmony/
    ├── index.uts              # UTS 入口
    └── NativeHelper.ets       # ArkTS 文件（直接混编）
```

```typescript
// index.uts 中导入
import { NativeHelper } from './NativeHelper.ets'
```

### 1.8 UniError 规范

```typescript
// 基础错误
let error = new UniError("uni-apidName", 60000, "Custom uni error");
error.data = { "dataName": "custom data value" };

// 包装第三方 SDK 错误
let sourceError = new SourceError("Third SDK error message");
error.cause = sourceError;

// 多个源错误
let aggregateError = new UniAggregateError([
    new SourceError("First error"),
    new SourceError("Second error")
]);
error.cause = aggregateError;
```

错误码范围：跨平台 6xx / Android 7xx / iOS 8xx / Web 9xx / **鸿蒙 5xx**

---

## 二、鸿蒙原生组件嵌入（HBuilderX 4.62+）

通过 UTS 插件注册鸿蒙原生组件，在 WebView 中实现同层渲染。

### 2.1 注册 API

```typescript
interface NativeEmbedBuilderOptions {
  width: number;
  height: number;
  on?: Map<string, (event?: NativeEmbedEvent) => void>;
}

function defineNativeEmbed<T extends NativeEmbedBuilderOptions>(
  tag: string,
  options: DefineNativeEmbedOptions<T>
): void;
```

### 2.2 注册示例（button.ets）

```typescript
import { NativeEmbedBuilderOptions, defineNativeEmbed } from "@dcloudio/uni-app-runtime"

interface ButtonBuilderOptions extends NativeEmbedBuilderOptions {
  label: string
}

@Component
struct ButtonComponent {
  @Prop label: string
  onButtonClick?: Function

  build() {
    Button(this.label)
      .width('100%')
      .height('100%')
      .onClick(() => {
        if (this.onButtonClick) {
          this.onButtonClick({ detail: { text: 'test' } })
        }
      })
  }
}

@Builder
function ButtonBuilder(options: ButtonBuilderOptions) {
  ButtonComponent({
    label: options.label,
    onButtonClick: options?.on?.get('buttonclick')
  })
    .width(options.width)
    .height(options.height)
}

defineNativeEmbed('button', {
  builder: ButtonBuilder
})
```

### 2.3 在 index.uts 中导入

```typescript
import './button.ets'
```

### 2.4 Vue 页面中使用

```vue
<template>
    <embed
      class="native-button"
      tag="button"
      :options="{ width: 200, height: 40, label: '点击' }"
      @buttonclick="onClick"
    ></embed>
</template>
```

### 2.5 组件显示在 WebView 层之上

```typescript
import { NodeRenderType } from '@kit.ArkUI'
defineNativeEmbed('button', {
  builder: ButtonBuilder,
  nodeRenderType: NodeRenderType.RENDER_TYPE_DISPLAY
})
```

**注意：`defineNativeEmbed` 的 `tag` 参数必须全小写，不能用驼峰。**

---

## 三、华为账号登录

### 3.1 鸿蒙 App 华为登录

**前置配置：**

1. AGC 后台添加公钥指纹（绑定 bundleName）
2. 在 `harmony-configs/entry/src/main/module.json5` 中配置 Client ID
3. manifest.json → App 模块配置 → OAuth → 勾选"华为登录" → 填写 client_id
4. 配置 Scope 权限（发布版必填，调试版可选）

**API 使用：**

```js
// 检查可用登录方式
const providers = uni.getProviderSync({ service: 'oauth' })
// providers.providerIds 包含 'huawei'

// 登录
uni.login({
  provider: 'huawei',
  success(res) {
    // res: { code, idToken, openID, unionID, errMsg: "login:ok" }
  }
})

// 获取用户信息
uni.getUserInfo({
  provider: 'huawei',
  success(res) {
    // res.userInfo: { nickName, avatarUrl, openId }
  }
})
```

### 3.2 元服务登录

**两种方式：**

1. **静默登录**：获取 UnionID，无需额外权限
2. **手机号登录**：需敏感权限审批

**前端登录：**

```js
uni.login({
  provider: 'huawei',
  success(res) {
    // res: { code, idToken, openID, unionID }
  }
})
```

**手机号快速登录：**

```html
<button open-type="getPhoneNumber" @getphonenumber="quickLogin">
  手机号登录
</button>
```

返回 `{ phoneNumberCode: "xxx" }`，需服务端解析获取手机号。

---

## 四、打开其他应用 / URL Scheme

### 4.1 Deep Linking

**配置**（`harmony-configs/entry/src/main/module.json5`）：

```json5
{
  "module": {
    "abilities": [{
      "skills": [{
        "actions": ["ohos.want.action.viewData"],
        "uris": [{ "scheme": "hellouniapp", "host": "router" }]
      }]
    }],
    "querySchemes": ["hellouniapp"]  // 最多 50 个
  }
}
```

**使用：**

```typescript
import { openSchema, canOpenURL } from "@/uni_modules/uts-openSchema";

if (canOpenURL("hellouniapp://router")) {
  openSchema("hellouniapp://router/path/1?v=2");
}
```

### 4.2 App Linking（类似 Universal Links）

1. AGC 后台启用 App Linking
2. 域名根目录创建 `.well-known/applinking.json`
3. 在 AGC 创建 App Link
4. 配置 skills：

```json5
{
  "entities": ["entity.system.browsable"],
  "actions": ["ohos.want.action.viewData"],
  "uris": [{
    "scheme": "https",
    "host": "uniapp.dcloud.net.cn",
    "pathStartWith": "tutorial/harmony/runbuild.html"
  }],
  "domainVerify": true
}
```

### 4.3 接收跳转参数

```typescript
import { Want } from "@kit.AbilityKit";

// 冷启动
UTSHarmony.onAppAbilityCreate((want: Want) => {
  let uri = want?.uri;
});

// 热启动
UTSHarmony.onAppAbilityNewWant((want: Want) => {
  console.log("onNewWant", want);
});

// 也可直接使用
const launchOptions = uni.getLaunchOptionsSync();
```

### 4.4 打开元服务

```typescript
import { common, AtomicServiceOptions } from '@kit.AbilityKit';

export const openAtomicService = () => {
  const appId = ''; // 元服务 APPID
  const options: AtomicServiceOptions = { displayId: 0 };
  return new Promise((resolve, reject) => {
    UTSHarmony.getUIAbilityContext().openAtomicService(appId, options)
      .then((result) => resolve(''))
      .catch((err) => reject(err.message));
  });
};
```
