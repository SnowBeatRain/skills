# TypeScript

TypeScript 在 React Flow 中的泛型模式、联合类型、类型守卫和完整类型安全配置。

## 核心类型导入

```typescript
import {
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type OnNodeDrag,
  type OnDelete,
  type OnBeforeDelete,
  type FitViewOptions,
  type DefaultEdgeOptions,
  type BuiltInNode,
  type BuiltInEdge,
  type Connection,
  type Viewport,
  type XYPosition,
  type ReactFlowInstance,
  type NodeChange,
  type EdgeChange,
  type HandleConnection,
  type NodeConnection,
  type ReactFlowState,
} from '@xyflow/react';
```

> **使用 `type` 而非 `interface`**：React Flow 的联合类型判别器要求使用 `type`，`interface` 不支持判别联合。

---

## 节点类型定义

### 基本写法

```typescript
// 泛型签名: Node<TData, TType>
// TData: 节点 data 的形状
// TType: 类型字符串，对应 nodeTypes 的 key

type NumberNode = Node<{ value: number }, 'number'>;
type TextNode   = Node<{ text: string; multiline?: boolean }, 'text'>;
type GroupNode  = Node<{ title: string }, 'group'>;

// 应用级联合类型（包含内置类型）
import { type BuiltInNode } from '@xyflow/react';
type AppNode = BuiltInNode | NumberNode | TextNode | GroupNode;
```

### 带类型判别的自定义节点组件

```typescript
import { type NodeProps, Handle, Position } from '@xyflow/react';

function NumberNodeComponent({ data, selected }: NodeProps<NumberNode>) {
  // data 类型被精确推断为 { value: number }
  return (
    <div className={selected ? 'ring-2' : ''}>
      <Handle type="target" position={Position.Top} />
      <span>{data.value.toFixed(2)}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### 节点 props 中新增字段（v12.4+）

`NodeProps` 中 `selected`、`selectable`、`deletable`、`draggable`、`parentId` 均为必须字段，不再是 `undefined`：

```typescript
function MyNode({
  id,
  data,
  selected,      // boolean（v12.4+ 起保证非 undefined）
  draggable,     // boolean
  deletable,     // boolean
  selectable,    // boolean
  parentId,      // string | undefined
  positionAbsoluteX,
  positionAbsoluteY,
}: NodeProps<MyNode>) { ... }
```

---

## 边类型定义

```typescript
type WeightedEdge = Edge<{ weight: number; label?: string }, 'weighted'>;
type AnimatedEdge = Edge<{ speed: 'fast' | 'slow' }, 'animated'>;

import { type BuiltInEdge } from '@xyflow/react';
type AppEdge = BuiltInEdge | WeightedEdge | AnimatedEdge;
```

### 自定义边组件

```typescript
import { type EdgeProps, BaseEdge, getBezierPath } from '@xyflow/react';

function WeightedEdgeComponent({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  data,
  selected,
}: EdgeProps<WeightedEdge>) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{ strokeWidth: selected ? 2 : 1, stroke: data?.weight > 5 ? '#ef4444' : '#94a3b8' }}
    />
  );
}
```

---

## 回调类型

```typescript
// onNodesChange 带泛型
const onNodesChange: OnNodesChange<AppNode> = useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  [],
);

// onEdgesChange 带泛型
const onEdgesChange: OnEdgesChange<AppEdge> = useCallback(
  (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
  [],
);

// onConnect（无需泛型）
const onConnect: OnConnect = useCallback(
  (connection) => setEdges((eds) => addEdge(connection, eds)),
  [],
);

// onNodeDrag 带类型收窄
const onNodeDrag: OnNodeDrag<AppNode> = useCallback((event, node) => {
  if (node.type === 'number') {
    // TypeScript 知道 node.data.value 是 number
    console.log(node.data.value);
  }
}, []);

// onDelete
const onDelete: OnDelete = useCallback(({ nodes, edges }) => {
  console.log('Deleted', nodes.length, 'nodes and', edges.length, 'edges');
}, []);
```

---

## Hook 泛型

```typescript
// useReactFlow 带泛型 — 所有方法都完全类型化
const reactFlow = useReactFlow<AppNode, AppEdge>();

const nodes: AppNode[] = reactFlow.getNodes();
const node: AppNode | undefined = reactFlow.getNode('node-1');

// useNodesData — 订阅特定节点的 data，支持类型收窄（v12.10.1+）
const data = useNodesData<AppNode>('node-1');
// 返回 { id: string; type: AppNode['type']; data: AppNode['data'] } | undefined

// useStore 带类型化 selector
import { type ReactFlowState } from '@xyflow/react';

const nodeCount = useStore((state: ReactFlowState<AppNode>) => state.nodes.length);
```

---

## 类型守卫

```typescript
function isNumberNode(node: AppNode): node is NumberNode {
  return node.type === 'number';
}

function isTextNode(node: AppNode): node is TextNode {
  return node.type === 'text';
}

// 使用
const numberNodes = nodes.filter(isNumberNode); // 类型: NumberNode[]
const textNodes   = nodes.filter(isTextNode);   // 类型: TextNode[]

// onNodeDrag 中使用
nodes.forEach((node) => {
  if (isNumberNode(node)) {
    console.log(node.data.value); // 安全访问
  }
});
```

---

## ReactFlow 组件泛型

将泛型传给 `<ReactFlow>` 以获得完整的属性类型检查：

```typescript
<ReactFlow<AppNode, AppEdge>
  nodes={nodes}          // AppNode[]
  edges={edges}          // AppEdge[]
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  fitView
/>
```

---

## Zustand Store 类型化

```typescript
import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';

type FlowStore = {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  updateNodeValue: (id: string, value: number) => void;
};

const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  updateNodeValue: (id, value) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && isNumberNode(n) ? { ...n, data: { ...n.data, value } } : n,
      ),
    }),
}));
```

---

## 完整类型化示例

```typescript
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeProps,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type BuiltInNode,
  type BuiltInEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- 类型定义 ---
type ColorNode = Node<{ color: string; label: string }, 'color'>;
type AppNode   = BuiltInNode | ColorNode;
type AppEdge   = BuiltInEdge;

// --- 节点组件（组件外定义 nodeTypes）---
function ColorNodeComponent({ data, selected }: NodeProps<ColorNode>) {
  return (
    <div
      style={{
        background: data.color,
        padding: 10,
        borderRadius: 8,
        border: selected ? '2px solid #6366f1' : '1px solid #e2e8f0',
      }}
    >
      {data.label}
    </div>
  );
}

const nodeTypes = { color: ColorNodeComponent };

// --- 初始数据 ---
const initialNodes: AppNode[] = [
  { id: '1', type: 'color', position: { x: 0, y: 0 }, data: { color: '#fca5a5', label: 'Red' } },
  { id: '2', type: 'color', position: { x: 200, y: 100 }, data: { color: '#93c5fd', label: 'Blue' } },
];
const initialEdges: AppEdge[] = [
  { id: 'e1-2', source: '1', target: '2' },
];

// --- 组件 ---
export default function TypedFlow() {
  const [nodes, setNodes] = useState<AppNode[]>(initialNodes);
  const [edges, setEdges] = useState<AppEdge[]>(initialEdges);

  const onNodesChange: OnNodesChange<AppNode> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange: OnEdgesChange<AppEdge> = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [],
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow<AppNode, AppEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

---

## 常见类型错误

| 错误 | 原因 | 修复 |
|------|------|------|
| 使用 `interface` 定义节点类型 | 接口不支持判别联合 | 改用 `type` |
| 未给 `<ReactFlow>` 传泛型 | 属性类型为 `Node<any>` | 添加 `<ReactFlow<AppNode, AppEdge>>` |
| 不做类型守卫直接访问 `data` | 联合类型 `data` 不确定 | 先检查 `node.type` 或用类型守卫函数 |
| `useReactFlow` 无泛型 | 方法返回 `Node<any>` | `useReactFlow<AppNode, AppEdge>()` |
| `useNodesData` 返回 `unknown` data | 未传泛型 | `useNodesData<AppNode>(id)` |

---

## Do / Don't

- ✅ 用 `type`（非 `interface`）定义所有自定义节点和边类型。
- ✅ 创建应用级联合类型 `AppNode = BuiltInNode | ...`，在整个应用中统一使用。
- ✅ 给 `useReactFlow`、`<ReactFlow>`、回调函数传递泛型参数。
- ✅ 编写类型守卫函数进行运行时类型收窄。
- ✅ Zustand store 使用与 React Flow 一致的联合类型。
- ❌ 不要对节点/边 data 使用 `any` 或 `unknown`。
- ❌ 不要假设 `node.data` 的形状而不先检查 `node.type`。
