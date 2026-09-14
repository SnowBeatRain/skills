# Liquid Glass 实现检查清单

本清单已按三档 Tokens 更新。固定“60% 透明度 / 150% 饱和度”只是旧模板配方，不是 Apple 官方规范，不再作为验收条件。

- [ ] 平台路由正确：Apple 26+ SDK 优先系统 API，其他平台明确近似边界
- [ ] 背景有实际可见内容，配色克制，无霓虹/彩虹描边/多重发光
- [ ] 默认中性灰阶，彩色底色有用户或品牌依据；无自动生成的红紫蓝光球/循环渐变
- [ ] 从 `../assets/tokens.json` 选 subtle / medium / strong，默认 medium
- [ ] Web blur + saturate 成对，分别 12px/140%、24px/180%、36px/220%
- [ ] 1px 半透明亮边，边框 α .20/.35/.50，至少顶部 inset 高光与柔和外阴影
- [ ] 圆角 ≥16px、通常 24/32px，药丸与贴边导航例外明确
- [ ] 同屏目标 ≤3、上限 5；嵌套目标 1、上限 3；无列表逐项模糊
- [ ] 指针 rAF 合并更新绘制变量；触摸单次定位；卸载、离开和偏好改变时清理
- [ ] 深色 α .06、边框 α .18 等规则覆盖强度类，不被局部默认值盖掉
- [ ] readable 遮罩与语义文字色匹配；正文对比度 ≥4.5:1，大字 ≥3:1，附估算或采样
- [ ] 降低透明度用真正实底；减弱动态停止扫光/跟踪/视差；无滤镜能力时高不透明度纯色
- [ ] forced-colors、键盘焦点、弹窗焦点管理、200% 缩放与读屏已验证或标待验证
- [ ] 已运行静态检查；未把其通过等同于编译、性能或完整无障碍通过
- [ ] 已说明 Web 无法复刻 Apple 官方实时折射

令牌与实现见 [Web 指南](web-implementation.md)，行为检查见 [无障碍](accessibility.md)，性能见 [性能指南](performance.md)。card.html、navbar.html、modal.html、liquid-glass-demo.html、liquid-glass-comparison.html 均可直接打开；React TSX 需构建环境。演示与对比统一使用三档 Tokens。
