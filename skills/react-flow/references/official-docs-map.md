# 官方文档索引

React Flow 官方文档、示例和社区资源的快速检索地图。

## 官方文档

| 主题 | URL |
|------|-----|
| 入门指南 | https://reactflow.dev/learn |
| 核心概念 | https://reactflow.dev/learn/concepts/core-concepts |
| 自定义节点 | https://reactflow.dev/learn/customization/custom-nodes |
| 自定义边 | https://reactflow.dev/learn/customization/custom-edges |
| 视口 | https://reactflow.dev/learn/concepts/the-viewport |
| 布局 | https://reactflow.dev/learn/layouting/layouting |
| 状态管理 | https://reactflow.dev/learn/advanced-use/state-management |
| TypeScript 支持 | https://reactflow.dev/learn/advanced-use/typescript |
| 性能优化 | https://reactflow.dev/learn/advanced-use/performance |
| SSR 支持 | https://reactflow.dev/learn/advanced-use/server-side-rendering |
| 测试 | https://reactflow.dev/learn/advanced-use/testing |
| 无障碍 | https://reactflow.dev/learn/advanced-use/accessibility |
| 迁移到 v12 | https://reactflow.dev/learn/troubleshooting/migrate-to-v12 |
| 常见错误 | https://reactflow.dev/learn/troubleshooting/common-errors |

## API 参考

| 主题 | URL |
|------|-----|
| `<ReactFlow />` 组件 Props | https://reactflow.dev/api-reference/react-flow |
| `<ReactFlowProvider />` | https://reactflow.dev/api-reference/react-flow-provider |
| `<Background />` | https://reactflow.dev/api-reference/components/background |
| `<Controls />` | https://reactflow.dev/api-reference/components/controls |
| `<MiniMap />` | https://reactflow.dev/api-reference/components/mini-map |
| `<Panel />` | https://reactflow.dev/api-reference/components/panel |
| `<Handle />` | https://reactflow.dev/api-reference/components/handle |
| `<NodeToolbar />` | https://reactflow.dev/api-reference/components/node-toolbar |
| `<NodeResizer />` | https://reactflow.dev/api-reference/components/node-resizer |
| `<EdgeLabelRenderer />` | https://reactflow.dev/api-reference/components/edge-label-renderer |
| `<BaseEdge />` | https://reactflow.dev/api-reference/components/base-edge |
| `useReactFlow()` | https://reactflow.dev/api-reference/hooks/use-react-flow |
| `useNodesState()` | https://reactflow.dev/api-reference/hooks/use-nodes-state |
| `useEdgesState()` | https://reactflow.dev/api-reference/hooks/use-edges-state |
| `useNodesData()` | https://reactflow.dev/api-reference/hooks/use-nodes-data |
| `useNodeConnections()` | https://reactflow.dev/api-reference/hooks/use-node-connections |
| `useHandleConnections()` | https://reactflow.dev/api-reference/hooks/use-handle-connections |
| `useOnViewportChange()` | https://reactflow.dev/api-reference/hooks/use-on-viewport-change |
| `useOnSelectionChange()` | https://reactflow.dev/api-reference/hooks/use-on-selection-change |
| `useUpdateNodeInternals()` | https://reactflow.dev/api-reference/hooks/use-update-node-internals |
| `useConnection()` | https://reactflow.dev/api-reference/hooks/use-connection |
| `useNodesInitialized()` | https://reactflow.dev/api-reference/hooks/use-nodes-initialized |
| 工具函数（addEdge 等） | https://reactflow.dev/api-reference/utils |
| TypeScript 类型 | https://reactflow.dev/api-reference/types |

## 官方示例

| 示例 | URL |
|------|-----|
| 所有示例 | https://reactflow.dev/examples |
| 自定义节点 | https://reactflow.dev/examples/nodes/custom-node |
| 动态添加节点 | https://reactflow.dev/examples/nodes/add-node-on-edge-drop |
| 拖放 | https://reactflow.dev/examples/interaction/drag-and-drop |
| 自定义边 | https://reactflow.dev/examples/edges/custom-edge |
| 边动画 | https://reactflow.dev/examples/edges/animating-edges |
| 连接校验 | https://reactflow.dev/examples/interaction/validation |
| dagre 布局 | https://reactflow.dev/examples/layout/dagre |
| elkjs 布局 | https://reactflow.dev/examples/layout/elk |
| 力导向图 | https://reactflow.dev/examples/layout/force-layout |
| 子流程 | https://reactflow.dev/examples/layout/sub-flows |
| 撤销/重做 | https://reactflow.dev/examples/interaction/undo-and-redo |
| 保存/恢复 | https://reactflow.dev/examples/interaction/save-and-restore |
| 右键菜单 | https://reactflow.dev/examples/interaction/context-menu |
| 思维导图 | https://reactflow.dev/learn/tutorials/mind-map-app |
| 幻灯片 | https://reactflow.dev/learn/tutorials/slide-show |
| Web Audio | https://reactflow.dev/learn/tutorials/web-audio-api |

## 源码仓库

| 资源 | URL |
|------|-----|
| xyflow monorepo（主仓库） | https://github.com/xyflow/xyflow |
| React Flow v12 源码 | https://github.com/xyflow/xyflow/tree/main/packages/react |
| @xyflow/system（共享核心） | https://github.com/xyflow/xyflow/tree/main/packages/system |
| 官方示例源码 | https://github.com/xyflow/xyflow/tree/main/examples |
| 变更日志 | https://github.com/xyflow/xyflow/blob/main/packages/react/CHANGELOG.md |
| v11 分支 | https://github.com/xyflow/xyflow/tree/v11 |

## 社区资源

| 资源 | URL |
|------|-----|
| Discord 社区 | https://discord.gg/Bqt6xrs |
| React Flow Pro（高级示例） | https://reactflow.dev/pro |
| xyflow 博客 | https://xyflow.com/blog |
| NPM 包页面 | https://www.npmjs.com/package/@xyflow/react |
| React Flow UI 组件库 | https://reactflow.dev/components |

## v12 迁移速查

从 `reactflow`（v11）升级到 `@xyflow/react`（v12）的关键变化：

```typescript
// 包名变更
- import { ReactFlow } from 'reactflow'
+ import { ReactFlow } from '@xyflow/react'

// CSS 路径变更
- import 'reactflow/dist/style.css'
+ import '@xyflow/react/dist/style.css'

// Node 类型变更（现在是泛型）
- type NodeData = { label: string }
- const node: Node = { id: '1', data: { label: 'text' } as NodeData }
+ type MyNode = Node<{ label: string }, 'myType'>
+ const node: MyNode = { id: '1', data: { label: 'text' }, type: 'myType' }

// 边重连事件变更
- onEdgeUpdate / onEdgeUpdateStart / onEdgeUpdateEnd
+ onReconnect / onReconnectStart / onReconnectEnd

// 新增：节点数据更新方法
+ const { updateNode, updateNodeData } = useReactFlow()
+ updateNodeData('node-1', { value: 42 })

// 新增：细粒度 hooks
+ const data = useNodesData('node-1')
+ const connections = useNodeConnections({ nodeId: 'node-1' })
```

完整迁移指南：https://reactflow.dev/learn/troubleshooting/migrate-to-v12
