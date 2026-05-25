---
name: react-flow
description: 用于基于 @xyflow/react（React Flow v12）构建节点图、工作流编辑器和交互式流程图；当用户提到 ReactFlow、@xyflow/react、节点图、流程图、DAG、工作流 UI、自定义节点/边、Handle、NodeProps、EdgeProps、useReactFlow、fitView、MiniMap、Controls 时使用。不用于纯 SVG 绘图、Canvas 图表或与 React Flow 无关的图表库（ECharts、D3、Chart.js 等）。
---

# React Flow Skill

## 意图

帮助 Agent 独立完成基于 `@xyflow/react`（React Flow v12）的节点图 UI 工程：初始化配置、自定义节点与边、Handle 连接、视口控制、状态管理、事件处理、布局算法、性能优化和常见交互模式。

本 skill **只负责 React Flow 图层本身**。样式系统（Tailwind、CSS Modules）、状态库（Zustand、Redux）、路由、服务端渲染等由用户另行指定；本 skill 不主动耦合其他 skill。

## 触发场景

- 构建流程图、DAG、Pipeline 编辑器、思维导图、网络拓扑图、白板类应用。
- 自定义节点（`NodeProps<T>`）、自定义边（`EdgeProps<T>`）、多 Handle、动态 Handle。
- 连接验证（`isValidConnection`）、连接事件、边重连（`onReconnect`）。
- 视口控制：`fitView`、`zoomIn/Out`、`setCenter`、`screenToFlowPosition`。
- 状态管理：`useNodesState`、`useEdgesState`、`useReactFlow`、外部 store 集成。
- 布局：dagre、elkjs、d3-hierarchy 等算法与 React Flow 的集成。
- 性能优化：大规模节点渲染、`memo`、`nodeExtent`、懒加载。
- 迁移：从 `reactflow`（v11）升级到 `@xyflow/react`（v12）。

## 非目标

- 不负责非 React Flow 的图表库（ECharts、D3、Chart.js、Recharts）。
- 不负责纯 SVG/Canvas 绘制或不使用 React Flow 组件的流程图。
- 不编写完整应用骨架；细节按需读取 references。

## 核心原则

1. 先确认版本：`@xyflow/react`（v12）与旧版 `reactflow`（v11）API 有破坏性变更，不混用。
2. `import '@xyflow/react/dist/style.css'` 必须在应用入口或布局层引入，缺少会导致样式错乱。
3. `nodeTypes` / `edgeTypes` 必须在组件外定义或用 `useMemo` 记忆，避免每次渲染重建对象引发无限重渲染。
4. 凡需在 `<ReactFlow />` 组件外调用 `useReactFlow()`，必须将外层包裹 `<ReactFlowProvider>`。
5. 自定义节点内可交互元素（input、button）需加 `className="nodrag"` 防止触发拖拽；需同时禁止画布平移时加 `nopan`。
6. 动态增减 Handle 后必须调用 `useUpdateNodeInternals(nodeId)` 通知 React Flow 重新计算连接点。
7. 连接验证逻辑放在 `isValidConnection` 回调中，不在 `onConnect` 里做后置过滤。
8. 大规模节点场景必须评估 `React.memo`、虚拟化、`nodeExtent` 裁剪和批量更新策略。
9. 不把 `position` 坐标单位与屏幕像素混用；`screenToFlowPosition` 做坐标转换。
10. 布局算法（dagre/elkjs）输出的坐标需通过 `setNodes` / `setEdges` 写回，并在布局完成后调用 `fitView`。

## 工作流

### 1. 环境与版本确认

读取 `references/overview.md`。

1. 确认使用 `@xyflow/react`（v12）还是旧版 `reactflow`（v11）。
2. 确认 React 版本（v18+ 推荐）、TypeScript 版本和打包工具。
3. 确认 CSS 引入方式（全局 CSS、CSS-in-JS、Tailwind）。
4. 确认运行环境是否含 SSR（Next.js、Remix）——React Flow 依赖浏览器 DOM，需做动态导入处理。

### 2. 基础图结构设计

读取 `references/core-concepts.md`、`references/state-management.md`。

1. 定义 Node 数据结构（`id`、`type`、`position`、`data`）和 Edge 结构（`id`、`source`、`target`）。
2. 选择状态管理方式：受控模式（`useNodesState` + `useEdgesState`）或外部 store（Zustand/Redux）。
3. 明确节点类型集合（`nodeTypes` map）和边类型集合（`edgeTypes` map）。
4. 确定初始布局：手动坐标、算法自动布局还是 `fitView` 自适应。

### 3. 自定义节点与边

按需读取 `references/custom-nodes.md`、`references/custom-edges.md`、`references/handles.md`。

1. 用 `Node<TData, TType>` 定义类型，`NodeProps<T>` 作为组件 props 类型。
2. Handle 位置、数量、`id` 命名，动态 Handle 需搭配 `useUpdateNodeInternals`。
3. 用 `Edge<TData, TType>` + `EdgeProps<T>` + path 工具函数（`getBezierPath` 等）实现自定义边。
4. 交互元素加 `nodrag` / `nopan` 类名；复杂 HTML 标签放在 `EdgeLabelRenderer` 中。

### 4. 连接与事件

读取 `references/events.md`、`references/connections.md`。

1. `onConnect` + `addEdge` 处理新连接；`isValidConnection` 做前置校验。
2. 节点/边的点击、双击、右键菜单、悬停事件挂载到 `<ReactFlow>` props。
3. 删除事件：`onNodesDelete`、`onEdgesDelete`、`onBeforeDelete`（可异步确认）。
4. `onConnectStart` / `onConnectEnd` 处理连线开始/结束（用于拖拽添加节点等高级场景）。

### 5. 视口控制

读取 `references/viewport.md`。

1. `useReactFlow()` 获取 `fitView`、`zoomIn/Out`、`setCenter`、`setViewport`。
2. 坐标转换：`screenToFlowPosition`（鼠标位置→流坐标）、`flowToScreenPosition`（反向）。
3. 视口持久化：`getViewport` + `setViewport` + localStorage。
4. `fitView` 选项：`padding`、`duration`、`nodes`（聚焦指定节点子集）。

### 6. 布局算法

读取 `references/layout.md`。

1. 简单场景：手动坐标或 dagre（层级图、树形）。
2. 复杂场景：elkjs（多种布局算法）、d3-hierarchy（树/集群）。
3. 布局函数异步执行后用 `setNodes` / `setEdges` 写回坐标，触发 `fitView({ duration })`。
4. 子流程（sub-flow）内嵌布局需单独处理父节点尺寸。

### 7. 性能优化

读取 `references/performance.md`。

1. 超过 200 节点时评估 `React.memo` 包裹自定义节点组件。
2. 使用 `useNodesData` / `useNodeConnections` 等细粒度 hook 替代整体 `useNodes()`，减少重渲染。
3. `nodeExtent` / `translateExtent` 限制可视范围，减少离屏节点参与计算。
4. 避免在节点渲染函数中创建新对象/函数引用。

## References

| 场景 | 读取 |
|---|---|
| 总览与安装 | `references/overview.md` |
| 核心概念（Node/Edge/Handle） | `references/core-concepts.md` |
| 状态管理 | `references/state-management.md` |
| 自定义节点 | `references/custom-nodes.md` |
| Handle 连接点 | `references/handles.md` |
| 自定义边 | `references/custom-edges.md` |
| 连接与校验 | `references/connections.md` |
| 事件处理 | `references/events.md` |
| 视口控制 | `references/viewport.md` |
| 布局算法 | `references/layout.md` |
| 性能优化 | `references/performance.md` |
| 内置组件 | `references/built-in-components.md` |
| 常用模式与配方 | `references/common-recipes.md` |
| 避坑指南 | `references/pitfalls.md` |
| 官方文档索引 | `references/official-docs-map.md` |

## 交付检查清单

- [ ] 已确认使用 `@xyflow/react` v12（非旧版 `reactflow`），API 无混用。
- [ ] 已在应用入口引入 `@xyflow/react/dist/style.css`。
- [ ] `nodeTypes` / `edgeTypes` 已在组件外定义或 `useMemo` 记忆，无每渲染重建。
- [ ] 凡在 `<ReactFlow />` 外使用 `useReactFlow()`，已包裹 `<ReactFlowProvider>`。
- [ ] 自定义节点内可交互元素已添加 `nodrag` / `nopan` 类名。
- [ ] 动态 Handle 场景已调用 `useUpdateNodeInternals`。
- [ ] 连接校验在 `isValidConnection` 中完成，非 `onConnect` 后置过滤。
- [ ] 已评估节点数量级并决定是否需要性能优化措施。
- [ ] SSR 场景已做动态导入处理（`next/dynamic` 或 `React.lazy`）。
- [ ] 布局算法场景已在布局完成后调用 `fitView`。
