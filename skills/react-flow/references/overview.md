# 总览与安装

React Flow（`@xyflow/react`）是用于构建节点图、工作流编辑器和交互式流程图的 React 库。v12 对包名和内部 API 做了重大重构，与旧版 `reactflow`（v11）不兼容。

## 版本说明

| 版本 | 包名 | 状态 |
|------|------|------|
| v12（当前） | `@xyflow/react` | 推荐，积极维护 |
| v11（旧版） | `reactflow` | 维护模式，不推荐新项目 |
| v10 及以下 | `react-flow-renderer` | 已废弃 |

**v12 主要变化**
- 包名从 `reactflow` 改为 `@xyflow/react`
- Node 类型变为泛型 `Node<TData, TType>`（之前 `data` 为 `Record<string, unknown>`）
- 新增 `useNodesData`、`useNodeConnections`、`useHandleConnections` 细粒度 hooks
- `updateNode` / `updateNodeData` 替代手动 `setNodes` 遍历更新
- `onReconnect` 替代旧版 `onEdgeUpdate`

## 安装

```bash
# npm
npm install @xyflow/react

# pnpm
pnpm add @xyflow/react

# yarn
yarn add @xyflow/react
```

## CSS 引入（必须）

React Flow 的节点、边、控件默认样式依赖此 CSS 文件。**必须在应用入口或全局布局中引入**，否则节点布局错乱、Handle 不可见。

```typescript
// src/main.tsx 或 src/app/layout.tsx
import '@xyflow/react/dist/style.css';
```

如果只需要基础结构样式（不需要默认主题），可用：

```typescript
import '@xyflow/react/dist/base.css';
```

## 最小可运行示例

```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', type: 'input', data: { label: '开始' }, position: { x: 250, y: 0 } },
  { id: '2', data: { label: '处理' }, position: { x: 250, y: 100 } },
  { id: '3', type: 'output', data: { label: '结束' }, position: { x: 250, y: 200 } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
];

export default function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

## 容器尺寸要求

`<ReactFlow />` 容器的父元素**必须有明确的宽高**，否则画布无法渲染。

```typescript
// ✅ 正确：父容器有明确尺寸
<div style={{ width: '100vw', height: '100vh' }}>
  <ReactFlow ... />
</div>

// ❌ 错误：父容器无高度，画布高度为 0
<div>
  <ReactFlow ... />
</div>
```

## SSR 处理

React Flow 依赖浏览器 DOM API，在 SSR 框架（Next.js、Remix）中需动态导入：

```typescript
// Next.js App Router
import dynamic from 'next/dynamic';

const Flow = dynamic(() => import('./Flow'), { ssr: false });
```

## 官方资源

- 文档：https://reactflow.dev/learn
- API 参考：https://reactflow.dev/api-reference
- 示例：https://reactflow.dev/examples
- GitHub：https://github.com/xyflow/xyflow
- Discord：https://discord.gg/Bqt6xrs
