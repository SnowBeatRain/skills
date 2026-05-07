# 插件结构

目标是让 `uni_modules` 中的公共 API 清楚，平台实现隔离，测试和示例可以复用。

## 推荐目录

```text
uni_modules/sqlite-uniapp-uts/
├── package.json
├── changelog.md
├── readme.md
├── utssdk/
│   ├── index.uts
│   ├── interface.uts
│   ├── common/
│   │   ├── errors.uts
│   │   ├── types.uts
│   │   └── validators.uts
│   ├── app-android/
│   │   └── index.uts
│   ├── app-ios/
│   │   └── index.uts
│   └── app-harmony/
│       ├── index.uts
│       └── helpers/
└── example/
```

实际目录以当前 DCloud / HBuilderX 版本规范为准。生成代码前先检查项目已有 `uni_modules` 风格。

## 文件职责

| 文件 | 职责 |
|---|---|
| `interface.uts` | 公共类型、Options、Result、Error |
| `index.uts` | 对外导出 API，转发到平台实现 |
| `common/errors.uts` | 错误码、错误映射、脱敏辅助 |
| `common/validators.uts` | SQL 参数、数据库名、路径等基础校验 |
| `app-android/index.uts` | Android SQLite adapter |
| `app-ios/index.uts` | iOS SQLite adapter |
| `app-harmony/index.uts` | HarmonyOS adapter 门面 |
| `app-harmony/helpers/` | ArkTS/ETS 状态机或复杂 helper |

## 条件编译

页面或业务 DAO 调用插件时使用平台条件编译提供降级：

```ts
// #ifdef APP
// 调用 sqlite-uniapp-uts
// #endif

// #ifndef APP
// 提示当前平台不支持本地 SQLite 插件
// #endif
```

鸿蒙 App 使用 `APP-HARMONY`。不要把 `APP-PLUS` 当作包含鸿蒙。

