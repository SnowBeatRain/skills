# 视觉验收：把效果与当前代码绑定

静态通过只说明文件、语法与实现候选存在。Liquid Glass 的主要目标包含光学与运动，必须检查实际渲染；不得用一张厚白卡片加代码扫描结果宣布完成。

## 1. 先运行不改动的基准

打开 [optical-reference.html](../examples/optical-reference.html)。页面显示“已启用像素折射”才能进入光学验收；显示基础降级时，只能评估基本可用性。

记录浏览器、视口、设备/DPR、来源与时间。不以 CSS.supports、WebGL context 对象非空或 shader 编译成功作为视觉证据。

## 2. 必查用例

| id | 检查 | 通过条件 |
|---|---|---|
| lensing | 同背景、同位置、同视口的折射开/关 A/B | 边缘网格/文字/轮廓的位置改变，外部内容对齐；不能只改变亮度或透明度 |
| transmission | 中央透光 | 能认出背后内容，玻璃内部没有被全区域白/黑遮罩抹掉 |
| morph | 选中态移动、按钮展开 | 原实例连续改变几何与采样；不是替换两张静态卡片 |
| input | 鼠标/键盘与取消 | 拖动、方向键、展开/关闭、Escape、焦点和选中语义有效；触摸未真机测时另外注明 |
| fallback | 基础兼容与实底模式 | 能力状态真实、控件可用；不能继续标记已启用折射 |
| motion | 减少动态 | 动画立即应用目标状态，没有残留弹性/循环；静态折射可以保留 |
| contrast | 前景与实际背景 | 正文 ≥4.5:1，大字 ≥3:1；提供采样或有边界的估算，说明未覆盖情形 |

光学 A/B 时暂停所有位置变化，移开鼠标，保留同样的网格和前景。截图至少包含透镜边缘与附近未受影响背景。检查控件移动后背景仍正确对齐；只在原地正确、拖动就露出另一张纹理不算通过。

展开控件时观察中间过程，或录制/采集多个中间帧。最终态截图只能证明最终形状，不能单独证明连续形变。

## 3. 验收记录

先生成文件哈希：

```sh
node scripts/validate.mjs --manifest manifest.json examples/optical-reference.html
```

该命令只记录入口与依赖，不生成“通过”。完成实际检查后，把 manifest 的 entry/files 合并到 JSON 记录：

```json
{
  "version": 1,
  "profile": "optical",
  "renderer": "webgl",
  "entry": "examples/optical-reference.html",
  "files": {},
  "testedAt": "2026-09-14T00:00:00Z",
  "environment": { "browser": "实际浏览器", "width": 1280, "height": 960 },
  "cases": [
    { "id": "lensing", "status": "not-run", "notes": "记录实际观察", "evidence": [] }
  ]
}
```

示意记录不能通过验收：files 必须来自当前 manifest，cases 必须覆盖全部七项，status 只有完成检查后才能写 pass，证据是记录同目录或子目录下的 PNG。系统/人工设置未实际验证时写进 notes 或单独的 untested 字段，不能借应用内开关的结果宣称真机系统测试通过。

```sh
node scripts/validate.mjs --profile optical --evidence references/qa/optical.json examples/optical-reference.html
```

校验器核对记录结构、必查项、截图文件和入口/依赖哈希。**它不会理解截图内容，不能代替看图或操作；手写 pass 不是证据。** 代码发生变化时旧哈希会失效，需要重新检查相应行为再生成记录。

远程媒体不在本地 import 图中，必须另记录固定版本、URL/资源哈希与采样权限。不要用可变在线图片制作可重复的基准。

## 4. 可携带性

把完整 Skill 复制到独立目录，在不同 cwd 运行校验并打开基准，确认所有资源/参考均能找到。归档只包含 Skill 本身与必要 QA 资源，不包含 .claude 会话状态、外部工作区 Demo 或宿主绝对路径。

React/Vue/原生项目接入后还要在目标环境重复验收。本包的基准通过只能作为可靠起点，不是未来所有框架/浏览器组合的保证。
