# 状态管理

React Flow 支持多种状态管理方式：内置 hooks、外部 store（Zustand/Redux）以及混合模式。

## 内置 Hooks

### useNodesState / useEdgesState

最常用的状态管理方式，封装了节点/边的增删改逻辑：

```typescript
import { useNodesState, useEdgesState, addEdge, OnConnect } from '@xyflow/react';
import { useCallback } from 'react';

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // onNodesChange 处理：选择、拖拽移动、删除等内置变更
  // onEdgesChange 处理：选择、删除等内置变更

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    />
  );
}
```

### useReactFlow

在 `<ReactFlow />` 内部组件中访问 flow 实例，提供读写节点/边和视口的能力：

```typescript
import { useReactFlow } from '@xyflow/react';

function FlowToolbar() {
  const {
    // 读取
    getNodes,
    getEdges,
    getNode,
    getEdge,
    // 写入
    setNodes,
    setEdges,
    addNodes,
    addEdges,
    updateNode,
    updateNodeData,
    updateEdge,
    deleteElements,
    // 视口
    fitView,
    zoomIn,
    zoomOut,
    setCenter,
    setViewport,
    getViewport,
    screenToFlowPosition,
    flowToScreenPosition,
    // 其他
    getNodesBounds,
    getIntersectingNodes,
    isNodeIntersecting,
  } = useReactFlow();
}
```

### updateNode / updateNodeData（v12 新增）

替代手动 `setNodes` 遍历，更新单个节点：

```typescript
const { updateNode, updateNodeData } = useReactFlow();

// 更新节点整体（浅合并）
updateNode('node-1', { selected: true });
updateNode('node-1', (node) => ({ ...node, position: { x: 100, y: 200 } }));

// 只更新 data（浅合并）
updateNodeData('node-1', { label: '新标签' });
updateNodeData('node-1', (node) => ({ ...node.data, count: node.data.count + 1 }));
```

### 细粒度数据 Hooks（v12，减少重渲染）

只订阅所需数据，避免无关变更触发重渲染：

```typescript
import {
  useNodesData,      // 订阅指定节点的 data
  useNodeConnections, // 订阅节点连接关系
  useHandleConnections, // 订阅指定 Handle 的连接
  useEdges,           // 订阅所有边
  useNodes,           // 订阅所有节点（谨慎使用，任何节点变化都触发）
} from '@xyflow/react';

// 只在 node-1 的 data 变化时重渲染
function NodeDataDisplay({ nodeId }: { nodeId: string }) {
  const data = useNodesData(nodeId);
  return <div>{data?.label}</div>;
}

// 订阅多个节点的 data
function MultiNodeDisplay() {
  const nodesData = useNodesData(['node-1', 'node-2']);
  // nodesData: Array<{ id: string; type?: string; data: TData } | undefined>
}

// 订阅节点的连接关系
function NodeConnectionInfo({ nodeId }: { nodeId: string }) {
  const connections = useNodeConnections({ nodeId });
  // connections: Array<{ source, target, sourceHandle, targetHandle, ... }>
}

// 订阅指定 Handle 的连接
function HandleInfo({ nodeId, handleId }: { nodeId: string; handleId: string }) {
  const connections = useHandleConnections({ type: 'source', nodeId, id: handleId });
}
```

---

## Zustand 集成（推荐的外部 store 方案）

适合需要跨组件共享 flow 状态、或与业务逻辑深度集成的场景。

### Store 定义

```typescript
import { create } from 'zustand';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
};

const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));
```

### 组件使用

```typescript
function Flow() {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    />
  );
}
```

---

## applyNodeChanges / applyEdgeChanges

React Flow 内部的变更应用函数，可在自定义 reducer 中使用：

```typescript
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

// NodeChange 类型：
// - { type: 'position', id, position, dragging }  — 拖拽移动
// - { type: 'dimensions', id, dimensions }         — 尺寸变化
// - { type: 'select', id, selected }               — 选中状态
// - { type: 'remove', id }                         — 删除
// - { type: 'add', item }                          — 添加

function reducer(nodes: Node[], changes: NodeChange[]): Node[] {
  return applyNodeChanges(changes, nodes);
}
```

---

## ReactFlowProvider

当 `useReactFlow()` 需要在 `<ReactFlow />` 组件外部使用时，必须包裹 `<ReactFlowProvider>`：

```typescript
import { ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';

// 此组件在 ReactFlow 外部，但需要访问 flow 实例
function Sidebar() {
  const { fitView, getNodes } = useReactFlow();
  return <button onClick={() => fitView()}>适应视口</button>;
}

function App() {
  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, height: '100vh' }}>
          <ReactFlow nodes={nodes} edges={edges} />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
```

> **注意**：`<ReactFlow />` 自身已内置 Provider，只有在其外部的组件才需要手动包裹。

---

## 状态持久化

```typescript
import { useReactFlow, Node, Edge } from '@xyflow/react';

function usePersistFlow(key: string) {
  const { getNodes, getEdges, setNodes, setEdges, setViewport } = useReactFlow();

  const save = () => {
    const flow = {
      nodes: getNodes(),
      edges: getEdges(),
      viewport: useReactFlow().getViewport(),
    };
    localStorage.setItem(key, JSON.stringify(flow));
  };

  const restore = () => {
    const stored = localStorage.getItem(key);
    if (!stored) return;
    const { nodes, edges, viewport } = JSON.parse(stored);
    setNodes(nodes);
    setEdges(edges);
    setViewport(viewport);
  };

  return { save, restore };
}
```

---

## 不可变更新要求

React Flow 通过引用比较检测变更，**必须**创建新对象，mutation 不会被检测到：

```typescript
// ❌ 错误：mutation 不被检测
const node = get().nodes.find((n) => n.id === id);
node!.data.label = '更新';
set({ nodes: get().nodes }); // 引用未变，React Flow 不重渲染

// ✅ 正确：创建新对象
set({
  nodes: get().nodes.map((n) =>
    n.id === id ? { ...n, data: { ...n.data, label: '更新' } } : n,
  ),
});

// ✅ 更简洁：使用 useReactFlow().updateNodeData
const { updateNodeData } = useReactFlow();
updateNodeData(id, { label: '更新' });
```

---

## toObject 序列化

`useReactFlow().toObject()` 返回完整流状态，可直接 JSON 序列化：

```typescript
import { useReactFlow, type ReactFlowJsonObject } from '@xyflow/react';

function useSaveRestore() {
  const { toObject, setNodes, setEdges, setViewport } = useReactFlow();

  const save = () => {
    const flow: ReactFlowJsonObject = toObject();
    // { nodes: Node[], edges: Edge[], viewport: { x, y, zoom } }
    localStorage.setItem('flow', JSON.stringify(flow));
  };

  const restore = () => {
    const raw = localStorage.getItem('flow');
    if (!raw) return;
    const { nodes, edges, viewport } = JSON.parse(raw) as ReactFlowJsonObject;
    setNodes(nodes);
    setEdges(edges);
    setViewport(viewport);
  };

  return { save, restore };
}
```

---

## useStore 细粒度订阅

用 selector + `shallow` 减少重渲染：

```typescript
import { useStore } from '@xyflow/react';
import { shallow } from 'zustand/shallow';

// ❌ 任何 store 变化都触发重渲染
const state = useStore((s) => s);

// ✅ 只在选中节点 ID 列表变化时重渲染
const selectedIds = useStore(
  (s) => s.nodes.filter((n) => n.selected).map((n) => n.id),
  shallow,
);

// ✅ 只在节点数量变化时重渲染
const nodeCount = useStore((s) => s.nodes.length);

// ✅ useStoreApi：按需读取，不订阅
const storeApi = useStoreApi();
const getNodeCount = () => storeApi.getState().nodes.length;
```

---

## 选择状态管理

```typescript
import { useReactFlow } from '@xyflow/react';

function SelectionControls() {
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();

  // 全选
  const selectAll = () => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: true })));
  };

  // 取消全选
  const deselectAll = () => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
  };

  // 获取选中节点
  const getSelectedNodes = () => getNodes().filter((n) => n.selected);

  return (
    <div>
      <button onClick={selectAll}>全选</button>
      <button onClick={deselectAll}>取消选择</button>
    </div>
  );
}
```
