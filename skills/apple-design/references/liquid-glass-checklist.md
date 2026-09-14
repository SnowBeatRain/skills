# Liquid Glass 检查入口

以 [SKILL.md](../SKILL.md) 和 [官方定义](official-liquid-glass.md) 为准，不再按固定 blur、白边或阴影数量判断是否像 Apple。

- [ ] 原生 / Web 光学 / 基础降级路线明确，背景可采样合同明确。
- [ ] 用于导航与功能控件；没有把文章/任务/普通内容卡片当作 Liquid Glass。
- [ ] 素净配色保留；测试背景有足够细节能揭示折射。
- [ ] 同位置 A/B 中，边缘背景确有位移；中央仍透出来源内容。
- [ ] 按钮展开或相关状态切换保持同一材质的几何连续性。
- [ ] 没有全区域厚白/厚黑遮罩掩盖材质，也没有通过重复无关背景假冒折射。
- [ ] 背景变化、Resize、DPR 与 DOM 对齐经过检查。
- [ ] 键盘、焦点、输入取消、动态与透明度降级有效。
- [ ] 每个证据对应当前文件哈希；未测平台和帧率明确标未测。
- [ ] 静态通过只记静态通过；未完成视觉验证不声称理想效果已实现。

执行方式、截图条件与验收记录见 [visual-validation.md](visual-validation.md)。首选示例是 [optical-reference.html](../examples/optical-reference.html)；其余旧 CSS 卡片示例仅为 basic。
