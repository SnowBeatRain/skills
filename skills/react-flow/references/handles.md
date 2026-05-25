# Handle 连接点

Handle 是节点上的连接热点，用户可以从 source Handle 拖拽连线到 target Handle 建立 Edge。

## 基础用法

```typescript
import { Handle, Position } from '@xyflow/react';

// type: 'source'（发出连接）或 'target'（接收连接）
// position: Top | Right | Bottom | Left

<Handle type="target" position={Position.Top} />
<Handle type="source" position={Position.Bottom} />
```

## Handle Props 完整列表

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'source' \| 'target'` | — | **必填**，连接方向 |
| `position` | `Position` | — | **必填**，位置 |
| `id` | `string` | — | 同节点多 Handle 时**必填** |
| `isConnectable` | `boolean` | `true` | 是否允许连接 |
| `isConnectableStart` | `boolean` | `true` | 是否可作为连线起点 |
| `isConnectableEnd` | `boolean` | `true` | 是否可作为连线终点 |
| `isValidConnection` | `(connection: Connection) => boolean` | — | Handle 级别连接校验 |
| `style` | `CSSProperties` | — | 内联样式（位置微调） |
| `className` | `string` | — | CSS 类名 |
| `onConnect` | `(connection: Connection) => void` | — | Handle 级别连接回调 |

## 多 Handle 定位

同一位置多个 Handle 时，用 `style` 的 `top`/`left` 属性调整位置：

```typescript
function MultiOutputNode({ data }: NodeProps) {
  return (
    <div style={{ padding: 10, width: 120 }}>
      <Handle type="target" position={Position.Top} />

      <div>{data.label}</div>

      {/* 底部两个 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="left-out"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="right-out"
        style={{ left: '70%' }}
      />
    </div>
  );
}
```

## 连接限制

### 限制每个 Handle 的最大连接数

```typescript
import { Handle, Position, useHandleConnections } from '@xyflow/react';

function LimitedConnectionNode({ id }: NodeProps) {
  const connections = useHandleConnections({
    type: 'target',
    nodeId: id,
  });

  // 最多允许 1 条连接
  const isConnectable = connections.length < 1;

  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div>最多 1 条输入连接</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### Handle 级别连接校验

```typescript
<Handle
  type="target"
  position={Position.Left}
  isValidConnection={(connection) => {
    // 只接受来自 'dataSource' 类型节点的连接
    const sourceNode = getNode(connection.source);
    return sourceNode?.type === 'dataSource';
  }}
/>
```

## 隐藏 Handle（用于布局占位）

某些场景下需要连接点存在但不可见（例如树形图的分支节点）：

```typescript
<Handle
  type="source"
  position={Position.Bottom}
  style={{ opacity: 0, width: 1, height: 1 }}
/>
```

## useHandleConnections Hook

订阅指定 Handle 的连接状态：

```typescript
import { useHandleConnections } from '@xyflow/react';

function PortStatus({ nodeId, handleId }: { nodeId: string; handleId: string }) {
  const connections = useHandleConnections({
    type: 'source',
    nodeId,
    id: handleId,
  });

  return (
    <div style={{ fontSize: 10, color: connections.length > 0 ? 'green' : 'gray' }}>
      {connections.length > 0 ? '已连接' : '未连接'}
    </div>
  );
}
```

## 动态 Handle 注意事项

```typescript
import { useUpdateNodeInternals } from '@xyflow/react';
import { useEffect } from 'react';

function DynamicNode({ id, data }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    // 每当 handle 数量变化，通知 React Flow 重新计算
    updateNodeInternals(id);
  }, [id, data.handleCount, updateNodeInternals]);

  return (
    <div>
      {Array.from({ length: data.handleCount }, (_, i) => (
        <Handle
          key={`h-${i}`}
          id={`h-${i}`}
          type="source"
          position={Position.Right}
          style={{ top: `${(i + 1) * (100 / (data.handleCount + 1))}%` }}
        />
      ))}
    </div>
  );
}
```

## Handle 样式定制

通过 className 或全局 CSS 定制 Handle 外观：

```css
/* 覆盖默认 Handle 样式 */
.react-flow__handle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6366f1;
  border: 2px solid white;
}

.react-flow__handle-connecting {
  background: #f59e0b; /* 连线进行中 */
}

.react-flow__handle-valid {
  background: #22c55e; /* 有效连接目标 */
}
```

```typescript
// 或通过 className prop（适合 Tailwind）
<Handle
  type="source"
  position={Position.Bottom}
  className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-indigo-500"
/>
```

## Connection 对象结构

连接建立时产生的 `Connection` 对象：

```typescript
type Connection = {
  source: string;      // 源节点 ID
  target: string;      // 目标节点 ID
  sourceHandle: string | null; // 源 Handle ID
  targetHandle: string | null; // 目标 Handle ID
};
```
