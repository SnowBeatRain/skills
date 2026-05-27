# 移动端风格

## 平台惯例

| 平台 | 设计语言 | 导航模式 | 常见手势 |
|------|----------|----------|----------|
| iOS | Human Interface | Tab Bar（底部） | 左滑返回、下拉刷新 |
| Android | Material Design 3 | Navigation Bar（底部） | 返回键、抽屉 |
| 跨端 | 上述任一或混合 | 取决于框架 | 两者兼顾 |

## 风格选择

| 场景 | 推荐风格 | 说明 |
|------|----------|------|
| 社交/生活类 | 温暖友好、圆角大 | 参考 Notion、Airbnb |
| 工具/效率类 | 极简、功能优先 | 参考 Apple Settings |
| 金融/支付 | 专业、信任感 | 参考 Stripe、Alipay |
| 媒体/音乐 | 暗色 + Glassmorphism | 参考 Apple Music |
| 游戏/儿童 | Claymorphism、鲜艳 | 参考 Duolingo |

## 关键尺寸

- 触摸目标最小 44px x 44px（iOS）/ 48px x 48px（Material）。
- 安全区域：顶部 44px（刘海）、底部 34px（Home Indicator）。
- 内容区域两侧留白 16px ~ 20px。
- 卡片间距 12px ~ 16px。
- 底部 Tab Bar 高度 49px + 安全区域。
