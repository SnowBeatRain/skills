---
name: react-flow
description: 用于基于 @xyflow/react（React Flow v12）构建节点图、工作流编辑器和交互式流程图；当用户提到 ReactFlow、@xyflow/react、节点图、流程图、DAG、工作流 UI、自定义节点/边、Handle、NodeProps、EdgeProps、useReactFlow、fitView、MiniMap、Controls 时使用。不用于纯 SVG 绘图、Canvas 图表或与 React Flow 无关的图表库（ECharts、D3、Chart.js 等）。
---

# React Flow Skill

## Agent 行为契约（始终遵守）

1. **只从 `@xyflow/react` 导入**——从不使用旧版 `reactflow` 或 `react-flow-renderer`。
2. **CSS 必须引入**：`import '@xyflow/react/dist/style.css'`（Tailwind 项目用 `base.css`）。
3. **父容器必须有明确宽高**——空白画布的第一排查原因。
4. **`nodeTypes` / `edgeTypes` 在组件外定义或 `useMemo`**——组件内定义会造成每渲染卸载重挂载。
5. **优先使用自定义节点**——React Flow 官方也推荐此做法，不推荐纯靠内置节点。
6. **节点内可交互元素加 `nodrag`**——防止 input/button 触发节点拖拽。
7. **节点内滚动容器加 `nowheel`**——防止滚轮被画布缩放劫持。
8. **隐藏 Handle 用 `opacity:0` 或 `visibility:hidden`，不用 `display:none`**——`display:none` 破坏位置计算，导致边错位。
9. **同一节点多个同类型 Handle 必须加唯一 `id`**。
10. **动态增减 Handle 后调用 `useUpdateNodeInternals`**——在渲染后调用（`requestAnimationFrame`）。
11. **state 更新必须不可变**——始终展开创建新对象，mutation 不被检测。
12. **受控流连线三件套**：`onNodesChange`、`onEdgesChange`、`onConnect` 必须全部挂载。

---

## 快速分诊（First 60s）

**先确认版本**：`@xyflow/react`（v12）还是旧版 `reactflow`（v11）？

**快速收集信息**：
- TypeScript 还是 JavaScript？
- 状态管理：本地 state / Zustand / Redux？
- 预期节点数量（影响性能策略）？
- 样式方案：CSS / Tailwind / styled-components？
- 是否 SSR（Next.js、Remix）？

**按症状路由**：

| 症状 | 原因 | 处理 |
|------|------|------|
| 空白画布无报错 | 父容器无高度 | 设置 `height: 100vh` 或等效 |
| 节点渲染但样式错乱 | 未引入 CSS | 加 `import '@xyflow/react/dist/style.css'` |
| 边不显示 | 无 Handle / CSS 未引入 / Handle 用了 `display:none` | 检查三者 |
| 拖拽后节点回弹 | `onNodesChange` 未连接或未 apply changes | 检查 handler |
| 连线划出但无边生成 | `onConnect` 未连接 | 添加 `onConnect` handler |
| `nodeTypes` 警告 + 重挂载 | `nodeTypes` 在组件内定义 | 移到组件外 |
| Zustand context 报错 | 同时安装了两个版本 / 缺少 Provider | 移除旧包或添加 Provider |
| 子节点渲染在父节点后面 | nodes 数组中父节点未在子节点前 | 排序：父节点先于子节点 |
| 从 v11 迁移后类型错误 | 泛型 API 变更 | 读 `references/migration.md` |
| 需要测试 | Playwright E2E | 读 `references/e2e-testing.md` |

---

## 意图

帮助 Agent 独立完成基于 `@xyflow/react`（React Flow v12）的节点图 UI 工程：初始化配置、自定义节点与边、Handle 连接、视口控制、状态管理、事件处理、布局算法、性能优化、TypeScript 类型安全、E2E 测试和常见交互模式。

本 skill **只负责 React Flow 图层本身**。样式系统（Tailwind、CSS Modules）、状态库（Zustand、Redux）、路由、服务端渲染等由用户另行指定；本 skill 不主动耦合其他 skill。

---

## 触发场景

- 构建流程图、DAG、Pipeline 编辑器、思维导图、网络拓扑图、白板类应用。
- 自定义节点（`NodeProps<T>`）、自定义边（`EdgeProps<T>`）、多 Handle、动态 Handle。
- 连接验证（`isValidConnection`）、连接事件、边重连（`onReconnect`）。
- 视口控制：`fitView`、`zoomIn/Out`、`setCenter`、`screenToFlowPosition`。
- 状态管理：`useNodesState`、`useEdgesState`、`useReactFlow`、外部 store 集成。
- 布局：dagre、elkjs、d3-hierarchy 等算法与 React Flow 的集成。
- 性能优化：大规模节点渲染、`memo`、`nodeExtent`、懒加载。
- TypeScript：联合类型、类型守卫、泛型 hooks。
- E2E 测试：Playwright 选择器、拖拽模拟、视口断言。
- 高级模式：撤销/重做、复制/粘贴、计算流、协作编辑。
- 迁移：从 `reactflow`（v11）升级到 `@xyflow/react`（v12）。

---

## 工作流

### 1. 环境与版本确认

读取 `references/overview.md`、`references/migration.md`（若从 v11 迁移）。

1. 确认使用 `@xyflow/react`（v12）还是旧版 `reactflow`（v11）。
2. 确认 React 版本（v18+ 推荐）、TypeScript 版本和打包工具。
3. 确认 CSS 引入方式（全局 CSS、CSS-in-JS、Tailwind → `base.css`）。
4. 确认运行环境是否含 SSR（Next.js、Remix）——React Flow 依赖浏览器 DOM，需做动态导入处理。

### 2. 基础图结构设计

读取 `references/core-concepts.md`、`references/state-management.md`。

1. 定义 Node 数据结构（`id`、`type`、`position`、`data`）和 Edge 结构。
2. 选择状态管理方式：受控模式（`useNodesState` + `useEdgesState`）或外部 store。
3. 明确 `nodeTypes` / `edgeTypes` map。
4. 确定初始布局：手动坐标、算法自动布局还是 `fitView` 自适应。

### 3. TypeScript 类型设计

读取 `references/typescript.md`。

1. 定义判别联合类型 `AppNode = BuiltInNode | MyNode1 | MyNode2`。
2. 定义 `AppEdge` 类型。
3. 将泛型传给 `useReactFlow<AppNode, AppEdge>`、`<ReactFlow<AppNode, AppEdge>>`、回调类型。
4. 编写类型守卫函数。

### 4. 自定义节点与边

按需读取 `references/custom-nodes.md`、`references/custom-edges.md`、`references/handles.md`。

1. 用 `Node<TData, TType>` 定义类型，`NodeProps<T>` 作为组件 props 类型。
2. Handle 位置、数量、`id` 命名，动态 Handle 需搭配 `useUpdateNodeInternals`。
3. 用 `Edge<TData, TType>` + `EdgeProps<T>` + path 工具函数实现自定义边。
4. 可交互元素加 `nodrag` / `nopan`；滚动容器加 `nowheel`；HTML 标签放在 `EdgeLabelRenderer` 中。

### 5. 连接与事件

读取 `references/events.md`、`references/connections.md`。

1. `onConnect` + `addEdge`；`isValidConnection` 做前置校验；`getOutgoers` 做 DAG 校验。
2. 节点/边的点击、拖拽、右键菜单事件。
3. `onBeforeDelete` 确认删除；`onConnectEnd` 处理拖到空白处创建节点。

### 6. 视口控制

读取 `references/viewport.md`。

1. `fitView`、`zoomIn/Out`、`setCenter`、`setViewport`。
2. 坐标转换：`screenToFlowPosition`（鼠标→流坐标）。
3. 视口持久化：`getViewport` + `setViewport` + localStorage。

### 7. 布局算法

读取 `references/layout.md`。

1. 简单场景：dagre；复杂场景：elkjs；树形：d3-hierarchy。
2. 布局函数在 `useNodesInitialized` 后执行，完成后调用 `fitView({ duration })`。

### 8. 性能与样式

读取 `references/performance-and-styling.md`。

1. `React.memo` 包裹节点组件；稳定 `nodeTypes` 引用。
2. CSS 变量定制主题；`colorMode` 暗色模式；Tailwind 用 `base.css`。

### 9. 高级模式（按需）

读取 `references/advanced-patterns.md`。

- 撤销/重做：Zustand + Zundo。
- 复制/粘贴：重新生成 ID，映射边 source/target。
- 计算流：`useNodeConnections` + `useNodesData` + `updateNodeData`。
- E2E 测试：读取 `references/e2e-testing.md`。

---

## References

| 场景 | 读取 |
|---|---|
| 版本/安装/SSR | `references/overview.md` |
| v11→v12 迁移 | `references/migration.md` |
| Node/Edge/Handle 核心概念 | `references/core-concepts.md` |
| TypeScript 类型系统 | `references/typescript.md` |
| 状态管理 | `references/state-management.md` |
| 自定义节点 | `references/custom-nodes.md` |
| Handle 连接点 | `references/handles.md` |
| 自定义边 | `references/custom-edges.md` |
| 连接与校验 | `references/connections.md` |
| 事件处理 | `references/events.md` |
| 视口控制 | `references/viewport.md` |
| 布局算法 | `references/layout.md` |
| 性能优化与样式 | `references/performance-and-styling.md` |
| 内置组件与 Hooks | `references/built-in-components.md` |
| 常用模式与配方 | `references/common-recipes.md` |
| 高级模式（undo/redo/computed/collab） | `references/advanced-patterns.md` |
| E2E 测试（Playwright） | `references/e2e-testing.md` |
| 避坑指南 | `references/pitfalls.md` |
| 官方文档索引 | `references/official-docs-map.md` |

---

## 交付检查清单

- [ ] 已确认使用 `@xyflow/react` v12（非旧版 `reactflow`），API 无混用。
- [ ] 已在应用入口引入 CSS（`style.css` 或 `base.css`）。
- [ ] `nodeTypes` / `edgeTypes` 已在组件外定义或 `useMemo`，无每渲染重建。
- [ ] 父容器有明确宽高（不依赖隐式高度）。
- [ ] 自定义节点内可交互元素已添加 `nodrag`；滚动容器已添加 `nowheel`。
- [ ] 隐藏 Handle 使用 `opacity:0` 或 `visibility:hidden`，不使用 `display:none`。
- [ ] 多 Handle 场景每个 Handle 有唯一 `id`；动态 Handle 调用了 `useUpdateNodeInternals`。
- [ ] 连接校验在 `isValidConnection` 完成（含自环、重复边、DAG 校验）。
- [ ] 受控流三件套全部挂载：`onNodesChange`、`onEdgesChange`、`onConnect`。
- [ ] state 更新创建新对象（无 mutation）。
- [ ] TypeScript 项目已定义 `AppNode`/`AppEdge` 判别联合类型并传递泛型。
- [ ] SSR 场景已做动态导入处理（`next/dynamic` 或 `React.lazy`）。
- [ ] 布局算法场景已在布局完成后调用 `fitView`。
- [ ] 凡在 `<ReactFlow />` 外使用 `useReactFlow()`，已包裹 `<ReactFlowProvider>`。
