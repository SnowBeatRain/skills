# 自定义节点

自定义节点使用 `NodeProps<T>` 泛型模式，通过 `nodeTypes` prop 注册后即可在图中使用。

## 基本结构

```typescript
import { Node, NodeProps, Handle, Position } from '@xyflow/react';

// 1. 定义节点类型（数据 + 类型字符串）
export type ProcessNode = Node<
  {
    label: string;
    status: 'idle' | 'running' | 'done' | 'error';
  },
  'process' // 节点类型字符串，与 nodeTypes key 对应
>;

// 2. 实现节点组件
function ProcessNodeComponent({ data, selected }: NodeProps<ProcessNode>) {
  const statusColor = {
    idle: '#94a3b8',
    running: '#3b82f6',
    done: '#22c55e',
    error: '#ef4444',
  }[data.status];

  return (
    <div
      style={{
        padding: '8px 16px',
        border: `2px solid ${selected ? '#6366f1' : statusColor}`,
        borderRadius: 8,
        background: '#fff',
        minWidth: 120,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <div style={{ fontSize: 12, color: statusColor }}>{data.status}</div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// 3. 在组件外定义 nodeTypes（避免每次渲染重建）
export const nodeTypes = {
  process: ProcessNodeComponent,
};

// 4. 使用
function Flow() {
  return <ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={edges} />;
}
```

## NodeProps 完整类型

```typescript
type NodeProps<T extends Node = Node> = {
  id: string;
  data: T['data'];
  type?: string;
  selected: boolean;
  isConnectable: boolean;
  zIndex: number;
  positionAbsoluteX: number;
  positionAbsoluteY: number;
  dragging: boolean;
  deletable?: boolean;
  selectable?: boolean;
  // 父节点相关
  parentId?: string;
};
```

## Handle 连接点

### 单 Handle

```typescript
// 顶部接收，底部发出（最常见）
<Handle type="target" position={Position.Top} />
<Handle type="source" position={Position.Bottom} />

// 左右连接
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
```

### 多 Handle（需要 id）

同一节点有多个同类型 Handle 时，必须通过 `id` 区分，边的 `sourceHandle` / `targetHandle` 需指定对应 ID：

```typescript
function RouterNode({ data }: NodeProps) {
  return (
    <div style={{ padding: 10 }}>
      <Handle type="target" position={Position.Left} />

      {/* 多个 source Handle，用 style 调整位置 */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-true"
        style={{ top: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output-false"
        style={{ top: '70%' }}
      />

      <div>{data.label}</div>
    </div>
  );
}

// 对应边需指定 sourceHandle
const edge: Edge = {
  id: 'e1',
  source: 'router-1',
  sourceHandle: 'output-true',
  target: 'node-2',
};
```

### 动态 Handle

动态增减 Handle 后必须调用 `useUpdateNodeInternals`：

```typescript
import { useUpdateNodeInternals, Handle, Position, NodeProps } from '@xyflow/react';
import { useState, useEffect } from 'react';

function DynamicHandleNode({ id, data }: NodeProps) {
  const [outputCount, setOutputCount] = useState(data.outputCount ?? 1);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    // 每次 outputCount 变化后通知 React Flow
    updateNodeInternals(id);
  }, [id, outputCount, updateNodeInternals]);

  return (
    <div style={{ padding: 10 }}>
      <Handle type="target" position={Position.Top} />
      <div>输出数量: {outputCount}</div>
      <button
        className="nodrag"
        onClick={() => setOutputCount((c) => c + 1)}
      >
        + 添加输出
      </button>
      {Array.from({ length: outputCount }, (_, i) => (
        <Handle
          key={i}
          type="source"
          position={Position.Bottom}
          id={`output-${i}`}
          style={{ left: `${((i + 1) / (outputCount + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}
```

## 防止拖拽和平移

节点内的可交互元素需要阻止事件冒泡到画布：

```typescript
function InteractiveNode({ data }: NodeProps) {
  return (
    <div>
      {/* nodrag: 防止触发节点拖拽 */}
      <input className="nodrag" type="text" defaultValue={data.label} />

      {/* nodrag + nopan: 同时防止画布平移 */}
      <button className="nodrag nopan" onClick={() => alert('clicked')}>
        操作
      </button>

      {/* 滚动容器 */}
      <div className="nodrag nopan" style={{ overflow: 'auto', maxHeight: 100 }}>
        {data.items?.map((item: string) => <div key={item}>{item}</div>)}
      </div>
    </div>
  );
}
```

## 节点尺寸

React Flow 默认在节点首次渲染后测量其尺寸。如果需要在渲染前就确定尺寸（例如布局算法需要），可以显式设置：

```typescript
const nodes: Node[] = [
  {
    id: '1',
    data: { label: '节点' },
    position: { x: 0, y: 0 },
    width: 150,   // 显式设置宽度
    height: 50,   // 显式设置高度
  },
];
```

## 节点工具栏（NodeToolbar）

在节点上方显示浮动操作栏：

```typescript
import { NodeToolbar, Position } from '@xyflow/react';

function ToolbarNode({ data }: NodeProps) {
  return (
    <>
      <NodeToolbar isVisible={data.toolbarVisible} position={Position.Top}>
        <button>编辑</button>
        <button>删除</button>
      </NodeToolbar>
      <div>{data.label}</div>
    </>
  );
}
```

## 节点大小调整（NodeResizer）

允许用户拖拽调整节点尺寸：

```typescript
import { NodeResizer } from '@xyflow/react';

function ResizableNode({ selected, data }: NodeProps) {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={50}
        onResize={(_event, { width, height }) => {
          console.log('新尺寸:', width, height);
        }}
      />
      <div style={{ padding: 10 }}>{data.label}</div>
    </>
  );
}
```

## 子流程（分组节点）

将节点放入父节点中实现分组：

```typescript
const nodes: Node[] = [
  {
    id: 'group-1',
    type: 'group',
    position: { x: 0, y: 0 },
    style: { width: 300, height: 200, background: '#f8fafc' },
    data: {},
  },
  {
    id: 'child-1',
    parentId: 'group-1',      // 指定父节点
    extent: 'parent',         // 限制在父节点内拖拽
    position: { x: 50, y: 50 }, // 相对于父节点的坐标
    data: { label: '子节点' },
  },
];
```

## Tailwind 样式示例

```typescript
function TailwindNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        rounded-lg border-2 bg-white px-4 py-3 shadow-sm
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-indigo-400"
      />
      <p className="text-sm font-semibold text-slate-800">{data.label}</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-indigo-400"
      />
    </div>
  );
}
```
