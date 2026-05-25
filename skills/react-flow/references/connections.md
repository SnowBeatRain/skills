# 连接与校验

连接（Connection）是用户拖拽 Handle 创建边的过程。React Flow 提供多个钩子控制连接行为。

## 基础连接处理

```typescript
import { ReactFlow, addEdge, OnConnect, useEdgesState } from '@xyflow/react';
import { useCallback } from 'react';

function Flow() {
  const [edges, setEdges] = useEdgesState([]);

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // connection: { source, target, sourceHandle, targetHandle }
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  return <ReactFlow onConnect={onConnect} />;
}
```

## 连接时添加边属性

`addEdge` 第一个参数可以合并额外属性：

```typescript
const onConnect: OnConnect = useCallback(
  (connection) =>
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          data: { weight: 1 },
        },
        eds,
      ),
    ),
  [setEdges],
);
```

## 连接校验

### isValidConnection（推荐）

在连线建立**之前**校验，无效连接不会触发 `onConnect`，Handle 会显示红色提示：

```typescript
import { Connection, useReactFlow } from '@xyflow/react';

function Flow() {
  const { getNode } = useReactFlow();

  const isValidConnection = useCallback(
    (connection: Connection) => {
      // 1. 禁止自环
      if (connection.source === connection.target) return false;

      // 2. 类型检查：只允许 'producer' 连接到 'consumer'
      const sourceNode = getNode(connection.source);
      const targetNode = getNode(connection.target);
      if (sourceNode?.type === 'producer' && targetNode?.type !== 'consumer') {
        return false;
      }

      // 3. 防止重复边
      const existingEdge = getEdges().find(
        (e) => e.source === connection.source && e.target === connection.target,
      );
      if (existingEdge) return false;

      return true;
    },
    [getNode],
  );

  return <ReactFlow isValidConnection={isValidConnection} />;
}
```

### 防止循环依赖（DAG 校验）

```typescript
import { Connection, Node, Edge, useReactFlow } from '@xyflow/react';

function isAcyclic(nodes: Node[], edges: Edge[], connection: Connection): boolean {
  // 用 DFS 检测是否存在从 target 到 source 的路径
  const visited = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (nodeId === connection.source) return true; // 发现环
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);

    const outgoing = edges.filter((e) => e.source === nodeId);
    return outgoing.some((e) => dfs(e.target));
  }

  return !dfs(connection.target);
}

// 在组件中使用
const isValidConnection = useCallback(
  (connection: Connection) => {
    const nodes = getNodes();
    const edges = getEdges();
    return isAcyclic(nodes, edges, connection);
  },
  [getNodes, getEdges],
);
```

## 连接生命周期事件

```typescript
import {
  OnConnectStart,
  OnConnectEnd,
  ConnectionState,
} from '@xyflow/react';

// 连线开始（鼠标按下 Handle）
const onConnectStart: OnConnectStart = (event, { nodeId, handleId, handleType }) => {
  console.log('连线开始，源节点:', nodeId);
  console.log('Handle:', handleId, '类型:', handleType);
};

// 连线结束（鼠标松开）
const onConnectEnd: OnConnectEnd = (event, connectionState: ConnectionState) => {
  console.log('连线结束');
  console.log('是否成功:', connectionState.isValid);
  console.log('源节点:', connectionState.fromNode?.id);
  console.log('目标节点:', connectionState.toNode?.id);

  // 高级场景：拖到空白处时创建新节点
  if (!connectionState.isValid && connectionState.fromNode) {
    const position = screenToFlowPosition({
      x: (event as MouseEvent).clientX,
      y: (event as MouseEvent).clientY,
    });
    // addNodes(...)
  }
};

<ReactFlow
  onConnectStart={onConnectStart}
  onConnectEnd={onConnectEnd}
/>
```

## useConnection Hook

在连线进行过程中实时获取连接状态（用于自定义 ConnectionLine）：

```typescript
import { useConnection } from '@xyflow/react';

function ConnectionStatus() {
  const connection = useConnection();

  if (!connection.inProgress) return null;

  return (
    <div>
      正在连接: {connection.fromNode?.id} → {connection.toNode?.id ?? '...'}
    </div>
  );
}
```

## 自定义连接线

拖拽连线时显示的预览路径：

```typescript
import {
  ConnectionLineComponent,
  ConnectionLineType,
  getBezierPath,
} from '@xyflow/react';

const CustomConnectionLine: ConnectionLineComponent = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionLineStyle,
}) => {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#6366f1"
        strokeWidth={2}
        strokeDasharray="5 5"
        d={edgePath}
        style={connectionLineStyle}
      />
      <circle cx={toX} cy={toY} r={4} fill="#6366f1" />
    </g>
  );
};

<ReactFlow
  connectionLineComponent={CustomConnectionLine}
  connectionLineType={ConnectionLineType.Bezier} // 或 SmoothStep / Straight
/>
```

## 连接模式

```typescript
import { ConnectionMode } from '@xyflow/react';

// 默认：只允许 source → target 连接
<ReactFlow connectionMode={ConnectionMode.Strict} />

// 宽松：允许 source → source、target → target（无方向限制）
<ReactFlow connectionMode={ConnectionMode.Loose} />
```

## 删除边

### 键盘删除

React Flow 默认支持选中后按 `Backspace` 或 `Delete` 键删除：

```typescript
// 自定义删除键
<ReactFlow deleteKeyCode="Delete" />            // 单键
<ReactFlow deleteKeyCode={['Delete', 'Backspace']} /> // 多键
```

### 编程删除

```typescript
const { deleteElements } = useReactFlow();

// 删除指定边
deleteElements({ edges: [{ id: 'e1' }] });

// 删除指定节点（同时删除关联边）
deleteElements({ nodes: [{ id: 'node-1' }] });
```

### onBeforeDelete（确认删除）

```typescript
import { OnBeforeDelete } from '@xyflow/react';

const onBeforeDelete: OnBeforeDelete = async ({ nodes, edges }) => {
  // 返回 true 允许删除，返回 false 取消
  const confirmed = await showConfirmDialog(`删除 ${nodes.length} 个节点？`);
  return confirmed;
};

<ReactFlow onBeforeDelete={onBeforeDelete} />
```
