# 自定义边

自定义边使用 `EdgeProps<T>` 泛型模式和路径工具函数，通过 `edgeTypes` prop 注册后使用。

## 基本结构

```typescript
import { Edge, EdgeProps, BaseEdge, getBezierPath } from '@xyflow/react';

// 1. 定义边类型
export type StatusEdge = Edge<
  { status: 'normal' | 'warning' | 'error'; label?: string },
  'status'
>;

// 2. 实现边组件
function StatusEdgeComponent({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps<StatusEdge>) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const strokeColor = {
    normal: '#94a3b8',
    warning: '#f59e0b',
    error: '#ef4444',
  }[data?.status ?? 'normal'];

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: strokeColor,
        strokeWidth: selected ? 2 : 1,
      }}
    />
  );
}

// 3. 在组件外定义 edgeTypes
export const edgeTypes = {
  status: StatusEdgeComponent,
};
```

## EdgeProps 完整类型

```typescript
type EdgeProps<T extends Edge = Edge> = {
  id: string;
  type?: string;
  source: string;
  target: string;
  // 坐标（由 React Flow 自动计算）
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  // 数据与状态
  data?: T['data'];
  selected?: boolean;
  animated?: boolean;
  // 样式
  style?: CSSProperties;
  markerStart?: string;
  markerEnd?: string;
  label?: ReactNode;
  labelStyle?: CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  interactionWidth?: number;
};
```

## 路径工具函数

### getBezierPath（贝塞尔曲线）

```typescript
import { getBezierPath } from '@xyflow/react';

const [edgePath, labelX, labelY, offsetX, offsetY] = getBezierPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  curvature: 0.25, // 可选，控制曲率（默认 0.25）
});
```

### getStraightPath（直线）

```typescript
import { getStraightPath } from '@xyflow/react';

const [edgePath, labelX, labelY] = getStraightPath({
  sourceX, sourceY,
  targetX, targetY,
});
```

### getSmoothStepPath（正交折线）

```typescript
import { getSmoothStepPath } from '@xyflow/react';

const [edgePath, labelX, labelY] = getSmoothStepPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  borderRadius: 8,  // 圆角半径（0 = 直角，即 step 效果）
  offset: 20,       // 转折点离节点的距离
});
```

所有路径函数返回：`[path, labelX, labelY, offsetX, offsetY]`
- `path`：SVG path d 字符串
- `labelX / labelY`：路径中点坐标（用于放置标签）

## BaseEdge 组件

渲染边路径的基础组件：

```typescript
import { BaseEdge } from '@xyflow/react';

<BaseEdge
  id={id}                      // 必填，与 SVG marker 关联
  path={edgePath}              // 必填，SVG path d 字符串
  style={{ stroke: '#333' }}   // 路径样式
  markerEnd={markerEnd}        // 末端箭头
  markerStart={markerStart}    // 起始箭头
  interactionWidth={20}        // 点击区域宽度（px）
/>
```

## EdgeLabelRenderer（HTML 标签）

用 React Portal 将 HTML 元素渲染到边的标签层，支持点击等交互：

```typescript
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from '@xyflow/react';

function ButtonEdge({ id, data, ...props }: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath(props);

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            // 将标签中心对齐到路径中点
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all', // 启用点击等交互
          }}
          className="nodrag nopan"  // 防止触发画布拖拽/平移
        >
          <button
            onClick={() => console.log('edge action', id)}
            style={{ fontSize: 12, padding: '2px 8px' }}
          >
            {data?.label ?? '操作'}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

## 动画边

### 虚线流动动画

```typescript
const animatedStyle: CSSProperties = {
  strokeDasharray: '5 5',
  animation: 'dash 0.5s linear infinite',
};

// 全局 CSS：
// @keyframes dash {
//   to { stroke-dashoffset: -10; }
// }

function AnimatedDashEdge(props: EdgeProps) {
  const [edgePath] = getBezierPath(props);
  return <BaseEdge id={props.id} path={edgePath} style={animatedStyle} />;
}
```

### 沿路径移动的圆点

```typescript
function MovingDotEdge(props: EdgeProps) {
  const [edgePath] = getBezierPath(props);

  return (
    <>
      <BaseEdge id={props.id} path={edgePath} />
      <circle r="4" fill="#6366f1">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}
```

## SVG 文字标签

适合简单文字，无需交互：

```typescript
function TextEdge({ id, data, ...props }: EdgeProps) {
  const [edgePath] = getBezierPath(props);

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <text>
        <textPath
          href={`#${id}`}
          startOffset="50%"
          textAnchor="middle"
          style={{ fontSize: 11, fill: '#64748b' }}
        >
          {data?.label}
        </textPath>
      </text>
    </>
  );
}
```

## 可重连边

允许用户拖拽边端点重新连接到其他节点：

```typescript
import { ReactFlow, OnReconnect, reconnectEdge } from '@xyflow/react';
import { useCallback, useRef } from 'react';

function Flow() {
  const [edges, setEdges] = useEdgesState(initialEdges);
  const edgeReconnectSuccessful = useRef(true);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect: OnReconnect = useCallback((oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
  }, []);

  const onReconnectEnd = useCallback((_: unknown, edge: Edge) => {
    // 如果重连失败（拖到空白处），删除原边
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeReconnectSuccessful.current = true;
  }, []);

  return (
    <ReactFlow
      edges={edges}
      onReconnect={onReconnect}
      onReconnectStart={onReconnectStart}
      onReconnectEnd={onReconnectEnd}
      edgesReconnectable
    />
  );
}
```

## 默认边选项

为所有边设置默认属性：

```typescript
import { DefaultEdgeOptions, MarkerType } from '@xyflow/react';

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { strokeWidth: 1.5, stroke: '#94a3b8' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#94a3b8',
  },
};

<ReactFlow defaultEdgeOptions={defaultEdgeOptions} />
```

## EdgeText 组件

带背景的定位文字标签（轻量替代方案）：

```typescript
import { BaseEdge, EdgeText, getSmoothStepPath, EdgeProps } from '@xyflow/react';

function LabeledEdge({ id, data, ...props }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeText
        x={labelX}
        y={labelY}
        label={data?.label ?? ''}
        labelBgStyle={{ fill: 'white', fillOpacity: 0.8 }}
        labelStyle={{ fill: '#475569', fontSize: 11 }}
      />
    </>
  );
}
```
