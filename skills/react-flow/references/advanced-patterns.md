# 高级模式

撤销/重做、复制/粘贴、计算流、动态 Handle、协作编辑、上下文缩放等高级实现模式。

## 撤销 / 重做

### 方案 A：Zustand + Zundo（推荐）

[Zundo](https://github.com/charkour/zundo) 是 Zustand 的时间旅行中间件，React Flow 内部也使用 Zustand，天然契合。

```bash
npm install zustand zundo immer
```

```typescript
import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
};

const useFlowStore = create<FlowState>()(
  temporal(
    immer((set, get) => ({
      nodes: [] as Node[],
      edges: [] as Edge[],
      onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
      onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
      onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
    })),
    {
      // 只追踪节点和边，不追踪回调函数
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    },
  ),
);
```

绑定键盘快捷键：

```typescript
import { useEffect } from 'react';
import { useTemporalStore } from 'zundo';

function UndoRedoHandler() {
  const { undo, redo } = useTemporalStore((s) => s);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  return null;
}
```

### 方案 B：手动快照栈

```typescript
import { useCallback, useRef } from 'react';
import { type Node, type Edge } from '@xyflow/react';

type Snapshot = { nodes: Node[]; edges: Edge[] };

export function useUndoRedo(maxHistory = 100) {
  const past   = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);

  // 在有意义的操作前调用（拖拽开始、连接前、删除前）
  // 不要在每次 onNodesChange 时调用——会把中间拖拽状态也记录进去
  const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    past.current = past.current.slice(-maxHistory);
    past.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });
    future.current = []; // 新操作清空重做栈
  }, [maxHistory]);

  const undo = useCallback((
    currentNodes: Node[], currentEdges: Edge[],
    setNodes: (n: Node[]) => void, setEdges: (e: Edge[]) => void,
  ) => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push({ nodes: structuredClone(currentNodes), edges: structuredClone(currentEdges) });
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, []);

  const redo = useCallback((
    currentNodes: Node[], currentEdges: Edge[],
    setNodes: (n: Node[]) => void, setEdges: (e: Edge[]) => void,
  ) => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ nodes: structuredClone(currentNodes), edges: structuredClone(currentEdges) });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, []);

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: () => past.current.length > 0,
    canRedo: () => future.current.length > 0,
  };
}
```

**快照时机**：`onNodeDragStart`、`onBeforeDelete`、`onConnect` 之前。不要在每个中间拖拽位置都快照。

---

## 复制 / 粘贴

```typescript
import { useCallback, useRef } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';

let idCounter = 0;
const newId = () => `pasted_${Date.now()}_${idCounter++}`;

export function useCopyPaste() {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const clipboard = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const copy = useCallback(() => {
    const selectedNodes   = getNodes().filter((n) => n.selected);
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    // 只复制两端都被选中的边
    const selectedEdges = getEdges().filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );
    clipboard.current = {
      nodes: structuredClone(selectedNodes),
      edges: structuredClone(selectedEdges),
    };
  }, [getNodes, getEdges]);

  const paste = useCallback((offset = { x: 50, y: 50 }) => {
    if (!clipboard.current) return;
    const { nodes: copied, edges: copiedEdges } = clipboard.current;

    // 旧 ID → 新 ID 映射
    const idMap = new Map(copied.map((n) => [n.id, newId()]));

    const newNodes = copied.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: { x: n.position.x + offset.x, y: n.position.y + offset.y },
      selected: true,
      dragging: false,
      ...(n.parentId && idMap.has(n.parentId) ? { parentId: idMap.get(n.parentId)! } : {}),
    }));

    const newEdges = copiedEdges.map((e) => ({
      ...e,
      id: newId(),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }));

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setEdges((eds) => [...eds.map((e) => ({ ...e, selected: false })), ...newEdges]);
  }, [setNodes, setEdges]);

  const cut = useCallback(() => {
    copy();
    const selectedIds = new Set(getNodes().filter((n) => n.selected).map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
  }, [copy, getNodes, setNodes, setEdges]);

  return { copy, cut, paste };
}
```

绑定键盘：

```typescript
const { copy, cut, paste } = useCopyPaste();

useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    // 输入框内不触发
    if ((e.target as HTMLElement).closest('input, textarea, select')) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') copy();
    if ((e.metaKey || e.ctrlKey) && e.key === 'x') cut();
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') paste();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [copy, cut, paste]);
```

---

## 计算流（响应式数据管道）

三个 hook 配合使用，实现节点间数据自动流转：

| Hook | 用途 |
|------|------|
| `useNodeConnections({ handleType })` | 发现连接到当前节点的节点 |
| `useNodesData(nodeIds)` | 订阅连接节点的数据变化 |
| `updateNodeData(id, data)` | 将计算结果写回节点 |

### 输入节点（写入数据）

```typescript
import { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';

type TextNode = Node<{ text: string }, 'text'>;

const TextInputNode = memo(({ id, data }: NodeProps<TextNode>) => {
  const { updateNodeData } = useReactFlow();
  return (
    <div>
      <input
        className="nodrag"
        value={data.text}
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
```

### 转换节点（读取输入，写入输出）

```typescript
import { memo, useEffect } from 'react';
import { Handle, Position, useReactFlow, useNodeConnections, useNodesData } from '@xyflow/react';

const UppercaseNode = memo(({ id }: NodeProps) => {
  const { updateNodeData } = useReactFlow();
  const connections = useNodeConnections({ handleType: 'target' });
  const sourceData   = useNodesData(connections.map((c) => c.source));

  useEffect(() => {
    const input = sourceData[0]?.data?.text ?? '';
    updateNodeData(id, { text: input.toUpperCase() });
  }, [sourceData, id, updateNodeData]);

  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <span>UPPERCASE</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
```

### 聚合节点（读取多个来源）

```typescript
const SumNode = memo(({ id }: NodeProps) => {
  const { updateNodeData } = useReactFlow();
  const connections = useNodeConnections({ handleType: 'target' });
  const nodesData   = useNodesData(connections.map((c) => c.source));

  useEffect(() => {
    const sum = nodesData.reduce((acc, d) => acc + (d?.data?.value ?? 0), 0);
    updateNodeData(id, { result: sum });
  }, [nodesData, id, updateNodeData]);

  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <span>∑</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
```

---

## 动态 Handle

动态增减 Handle 后，必须在渲染后调用 `useUpdateNodeInternals`：

```typescript
import { useCallback, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';

function DynamicHandleNode({ id }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [outputs, setOutputs] = useState(['out-0']);

  const addHandle = useCallback(() => {
    setOutputs((prev) => {
      const next = [...prev, `out-${prev.length}`];
      // requestAnimationFrame 保证 DOM 已更新后再刷新
      requestAnimationFrame(() => updateNodeInternals(id));
      return next;
    });
  }, [id, updateNodeInternals]);

  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <button className="nodrag" onClick={addHandle}>+ 输出</button>
      {outputs.map((hId, i) => (
        <Handle
          key={hId}
          type="source"
          position={Position.Right}
          id={hId}
          style={{ top: `${((i + 1) / (outputs.length + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}
```

### 数据驱动的 Handle

```typescript
function SchemaNode({ id, data }: NodeProps<Node<{ fields: string[] }>>) {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.fields, id, updateNodeInternals]);

  return (
    <div>
      <Handle type="target" position={Position.Left} />
      {data.fields.map((field) => (
        <div key={field} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
          <span>{field}</span>
          <Handle type="source" position={Position.Right} id={field} />
        </div>
      ))}
    </div>
  );
}
```

---

## 连接数量限制

```typescript
import { Handle, useNodeConnections, type HandleProps } from '@xyflow/react';

function LimitedHandle({
  maxConnections = 1,
  ...props
}: HandleProps & { maxConnections?: number }) {
  const connections = useNodeConnections({
    handleType: props.type,
    handleId: props.id,
  });

  return (
    <Handle
      {...props}
      isConnectable={connections.length < maxConnections}
    />
  );
}

// 使用
<LimitedHandle type="target" position={Position.Left} maxConnections={1} />
<LimitedHandle type="source" position={Position.Right} maxConnections={3} />
```

---

## 上下文缩放（按缩放级别显示细节）

用 `useStore` selector 监听缩放阈值，只在阈值改变时重渲染：

```typescript
import { memo } from 'react';
import { useStore, type ReactFlowState } from '@xyflow/react';

// 在组件外定义 selector，保持引用稳定
const showDetailSelector = (state: ReactFlowState) => state.transform[2] >= 0.75;

const ZoomAwareNode = memo(({ data }: NodeProps) => {
  const showDetail = useStore(showDetailSelector);

  return (
    <div style={{ padding: 8, minWidth: 80 }}>
      {showDetail ? (
        // 高缩放：完整内容
        <div>
          <h4>{data.label}</h4>
          <p style={{ fontSize: 11 }}>{data.description}</p>
        </div>
      ) : (
        // 低缩放：占位符
        <div style={{ textAlign: 'center', fontSize: 10 }}>{data.label}</div>
      )}
    </div>
  );
});
```

---

## 协作编辑

### 状态分类

| 类别 | 字段 | 同步策略 |
|------|------|---------|
| **持久** | `id`, `type`, `data`, `position`, `source`, `target` | 始终同步 + 持久化 |
| **临时** | `dragging`, `resizing`, 光标位置 | 同步（体验）但不持久化 |
| **不同步** | `selected`, `measured`, `width`/`height`（计算值） | 每用户本地状态 |

### Yjs（CRDT）架构

```bash
npm install yjs y-webrtc
```

```typescript
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useEffect, useCallback } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';

const ydoc    = new Y.Doc();
const provider = new WebrtcProvider('my-flow-room', ydoc);
const yNodes  = ydoc.getMap<Node>('nodes');
const yEdges  = ydoc.getArray<Edge>('edges');

function useYjsSync() {
  const { setNodes, setEdges } = useReactFlow();

  // Yjs → React Flow
  useEffect(() => {
    const syncNodes = () => setNodes(Array.from(yNodes.values()));
    const syncEdges = () => setEdges(yEdges.toArray());

    yNodes.observe(syncNodes);
    yEdges.observe(syncEdges);
    syncNodes();
    syncEdges();

    return () => {
      yNodes.unobserve(syncNodes);
      yEdges.unobserve(syncEdges);
    };
  }, [setNodes, setEdges]);

  // React Flow → Yjs
  const updateNode = useCallback((id: string, updates: Partial<Node>) => {
    const existing = yNodes.get(id);
    if (existing) yNodes.set(id, { ...existing, ...updates });
  }, []);

  return { updateNode };
}
```

### 协作方案对比

| 方案 | 类型 | 离线支持 | 冲突处理 |
|------|------|---------|---------|
| **Yjs** | CRDT | ✅ | 自动合并 |
| **Automerge** | CRDT | ✅ | 自动合并 |
| **Liveblocks** | 服务器权威 | 有限 | 服务端管理 |
| **Supabase Realtime** | 服务器权威 | ❌ | 手动（最后写入胜出） |

CRDT（Yjs/Automerge）更适合流程编辑器——节点位置冲突可自动合并。

---

## Do / Don't

- ✅ 撤销/重做：使用 Zustand + Zundo，最符合 React Flow 内部架构。
- ✅ 在操作**前**快照（拖拽开始、删除前），不要在每次 `onNodesChange` 时快照。
- ✅ 粘贴时重新生成所有 ID，边的 source/target 也要映射到新 ID。
- ✅ 调用 `updateNodeInternals` 时用 `requestAnimationFrame` 等待 DOM 更新。
- ✅ 在组件外定义 `useStore` selector，保持引用稳定。
- ✅ 协作编辑前先分类状态（持久/临时/不同步）。
- ❌ 不要在每个中间拖拽位置都调用 `takeSnapshot`，会淹没历史记录。
- ❌ 不要同步 `selected` 或 `measured` 属性——这是每用户的本地状态。
- ❌ 不要在热路径（每次渲染）中使用 `structuredClone`，仅用于创建快照。
