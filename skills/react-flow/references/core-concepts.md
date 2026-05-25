# 核心概念

React Flow 的三个基本构建块：**Node（节点）**、**Edge（边）** 和 **Handle（连接点）**。

## Node（节点）

### 类型定义

```typescript
import { Node } from '@xyflow/react';

// 泛型：Node<TData, TType>
type MyNode = Node<{ label: string; value: number }, 'myType'>;
```

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 全局唯一标识符 |
| `position` | `{ x: number; y: number }` | 节点左上角在画布中的坐标 |
| `data` | `TData` | 自定义数据，传入节点组件 |

### 常用可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 节点类型，对应 `nodeTypes` map 的 key |
| `style` | `CSSProperties` | 内联样式 |
| `className` | `string` | CSS 类名 |
| `width` / `height` | `number` | **可选输入**：预设尺寸（SSR/SSG）；实测尺寸存在 `node.measured` |
| `initialWidth` / `initialHeight` | `number` | 测量前的占位尺寸（渲染时立即使用，无需等测量） |
| `selected` | `boolean` | 是否选中 |
| `draggable` | `boolean` | 是否可拖拽（默认 `true`） |
| `connectable` | `boolean` | 是否可连接（默认 `true`） |
| `deletable` | `boolean` | 是否可删除（默认 `true`） |
| `hidden` | `boolean` | 是否隐藏（节点和关联边都隐藏） |
| `parentId` | `string` | 父节点 ID（子流程/分组场景） |
| `extent` | `'parent' \| CoordinateExtent` | 限制节点在父节点内或指定范围内拖拽 |
| `expandParent` | `boolean` | 拖拽到父节点边缘时自动扩展父节点 |
| `zIndex` | `number` | 层叠顺序 |
| `origin` | `[number, number]` | 节点原点（默认 `[0, 0]` 即左上角，`[0.5, 0.5]` 为中心） |
| `sourcePosition` | `Position` | 默认 source Handle 位置（省略时为 `Bottom`） |
| `targetPosition` | `Position` | 默认 target Handle 位置（省略时为 `Top`） |
| `dragHandle` | `string` | 拖拽手柄 CSS 选择器（如 `'.my-drag-handle'`） |
| `ariaLabel` | `string` | 无障碍标签 |
| `domAttributes` | `Record<string, string>` | 任意 DOM 属性（v12.7+） |
| `ariaRole` | `string` | ARIA role（v12.7+，默认 `'treeitem'`） |

### 内置节点类型

| type | 说明 |
|------|------|
| `'default'`（省略时） | 上下各一个 Handle |
| `'input'` | 只有底部 source Handle，无 target |
| `'output'` | 只有顶部 target Handle，无 source |
| `'group'` | 用于包含其他节点的容器，本身无 Handle |

```typescript
const nodes: Node[] = [
  {
    id: 'node-1',
    type: 'input',
    data: { label: '输入节点' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'node-2',
    data: { label: '默认节点' },
    position: { x: 0, y: 120 },
    style: { background: '#f0f4ff', border: '1px solid #6366f1' },
  },
  {
    id: 'group-1',
    type: 'group',
    data: { label: '分组' },
    position: { x: -20, y: -20 },
    style: { width: 200, height: 160 },
  },
];
```

---

## Edge（边）

### 类型定义

```typescript
import { Edge } from '@xyflow/react';

// 泛型：Edge<TData, TType>
type MyEdge = Edge<{ weight: number }, 'weighted'>;
```

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 全局唯一标识符 |
| `source` | `string` | 源节点 ID |
| `target` | `string` | 目标节点 ID |

### 常用可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 边类型，对应 `edgeTypes` map 的 key |
| `sourceHandle` | `string` | 指定源节点的 Handle ID（多 Handle 时必填） |
| `targetHandle` | `string` | 指定目标节点的 Handle ID |
| `label` | `ReactNode` | 边标签 |
| `labelStyle` | `CSSProperties` | 标签样式 |
| `animated` | `boolean` | 是否显示流动动画 |
| `style` | `CSSProperties` | 边路径样式 |
| `markerEnd` | `EdgeMarkerType` | 末端箭头 |
| `markerStart` | `EdgeMarkerType` | 起始箭头 |
| `selected` | `boolean` | 是否选中 |
| `deletable` | `boolean` | 是否可删除 |
| `hidden` | `boolean` | 是否隐藏 |
| `interactionWidth` | `number` | 可点击区域宽度（默认 20px） |
| `zIndex` | `number` | 层叠顺序 |
| `reconnectable` | `boolean \| 'source' \| 'target'` | 是否允许重新连接 |

### 内置边类型

| type | 说明 |
|------|------|
| `'default'`（省略时） | 贝塞尔曲线 |
| `'straight'` | 直线 |
| `'step'` | 正交折线（直角） |
| `'smoothstep'` | 正交折线（圆角） |
| `'simplebezier'` | 简化贝塞尔曲线（无控制点偏移） |

```typescript
const edges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    label: '流转',
    style: { stroke: '#6366f1', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];
```

### 箭头标记

```typescript
import { MarkerType } from '@xyflow/react';

const edge: Edge = {
  id: 'e1',
  source: '1',
  target: '2',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1',
    width: 20,
    height: 20,
  },
  markerStart: {
    type: MarkerType.Arrow, // 非填充箭头
  },
};
```

---

## Handle（连接点）

Handle 是节点上的连接热点。`type="source"` 用于发出连接，`type="target"` 用于接收连接。

```typescript
import { Handle, Position } from '@xyflow/react';

function CustomNode() {
  return (
    <div className="custom-node">
      {/* 接收连接的 Handle，位于顶部 */}
      <Handle type="target" position={Position.Top} />

      <div>节点内容</div>

      {/* 发出连接的 Handle，位于底部 */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### Position 枚举

```typescript
import { Position } from '@xyflow/react';

Position.Top    // 顶部
Position.Right  // 右侧
Position.Bottom // 底部
Position.Left   // 左侧
```

### Handle Props

| Prop | 类型 | 说明 |
|------|------|------|
| `type` | `'source' \| 'target'` | Handle 类型（必填） |
| `position` | `Position` | Handle 位置（必填） |
| `id` | `string` | Handle 唯一 ID（同节点多 Handle 时必填） |
| `isConnectable` | `boolean` | 是否允许连接（默认 `true`） |
| `isConnectableStart` | `boolean` | 是否允许从此 Handle 开始连接 |
| `isConnectableEnd` | `boolean` | 是否允许连接到此 Handle |
| `style` | `CSSProperties` | 内联样式（用于位置微调） |
| `className` | `string` | CSS 类名 |
| `onConnect` | `(connection: Connection) => void` | Handle 级别连接回调 |

---

## 受控模式 vs 非受控模式

### 受控模式（推荐）

节点和边的状态由 React 管理，使用 `useNodesState` / `useEdgesState`：

```typescript
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
/>
```

### 非受控模式

节点和边由 React Flow 内部管理，适合简单展示场景：

```typescript
<ReactFlow
  defaultNodes={initialNodes}
  defaultEdges={initialEdges}
/>
```

> **注意**：非受控模式下无法从外部读取或修改节点/边状态，不适合需要持久化或与外部状态同步的场景。

---

## 节点与边的关系约束

- 一条边的 `source` 和 `target` 必须对应已存在的节点 ID。
- 多 Handle 场景中，`sourceHandle` / `targetHandle` 必须对应节点中实际渲染的 Handle `id`。
- 删除节点时，React Flow 默认同时删除与该节点相关的所有边（可通过 `onBeforeDelete` 覆盖）。
