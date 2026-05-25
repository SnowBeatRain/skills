# 内置组件

React Flow 提供一系列开箱即用的 UI 组件，作为 `<ReactFlow>` 的子节点使用。

## 概览

```typescript
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeToolbar,
  NodeResizer,
  EdgeToolbar,
} from '@xyflow/react';

function Flow() {
  return (
    <ReactFlow nodes={nodes} edges={edges}>
      <Background />
      <Controls />
      <MiniMap />
      <Panel position="top-right">自定义面板</Panel>
    </ReactFlow>
  );
}
```

---

## Background（背景）

渲染画布背景图案。

```typescript
import { Background, BackgroundVariant } from '@xyflow/react';

// 点状背景（默认）
<Background />

// 网格线背景
<Background variant={BackgroundVariant.Lines} />

// 十字背景
<Background variant={BackgroundVariant.Cross} />

// 自定义参数
<Background
  variant={BackgroundVariant.Dots}
  gap={16}          // 图案间距（px）
  size={1.5}        // 图案元素尺寸
  color="#e2e8f0"   // 图案颜色
  bgColor="#f8fafc" // 画布背景色
/>
```

---

## Controls（控制栏）

提供放大、缩小、适应视口、锁定等控制按钮。

```typescript
import { Controls, ControlButton } from '@xyflow/react';

// 基础用法
<Controls />

// 自定义位置和显示项
<Controls
  position="bottom-left"
  showZoom={true}
  showFitView={true}
  showInteractive={true}     // 显示锁定/解锁按钮
  fitViewOptions={{ padding: 0.2 }}
/>

// 添加自定义按钮
<Controls>
  <ControlButton onClick={() => alert('custom')} title="自定义操作">
    🔧
  </ControlButton>
</Controls>
```

---

## MiniMap（小地图）

在角落显示整个图的缩略图。

```typescript
import { MiniMap } from '@xyflow/react';

// 基础用法
<MiniMap />

// 自定义样式
<MiniMap
  position="bottom-right"
  style={{ background: '#f1f5f9' }}
  nodeColor={(node) => {
    switch (node.type) {
      case 'input': return '#22c55e';
      case 'output': return '#ef4444';
      default: return '#6366f1';
    }
  }}
  nodeStrokeColor="#fff"
  nodeStrokeWidth={2}
  nodeBorderRadius={4}
  maskColor="rgba(0,0,0,0.1)"  // 视口遮罩颜色
  zoomable   // 允许在小地图上滚轮缩放
  pannable   // 允许在小地图上拖拽视口
/>
```

---

## Panel（自定义面板）

在画布上固定位置放置自定义 UI（工具栏、图例等）。

```typescript
import { Panel } from '@xyflow/react';

// 可选位置：top-left | top-center | top-right
//           bottom-left | bottom-center | bottom-right

<Panel position="top-left">
  <div style={{ background: 'white', padding: 8, borderRadius: 6 }}>
    <button onClick={addNode}>+ 添加节点</button>
    <button onClick={clearAll}>清空</button>
  </div>
</Panel>

<Panel position="bottom-center">
  <span style={{ fontSize: 12, color: '#94a3b8' }}>
    节点数: {nodes.length}
  </span>
</Panel>
```

---

## NodeToolbar（节点工具栏）

在节点上方（或指定位置）显示浮动操作按钮，**只能在自定义节点组件内使用**。

```typescript
import { NodeToolbar, Position } from '@xyflow/react';

function ToolbarNode({ id, data, selected }: NodeProps) {
  return (
    <>
      <NodeToolbar
        isVisible={selected}           // 选中时显示
        position={Position.Top}        // 显示位置
        offset={8}                     // 离节点的距离
        align="center"                 // start | center | end
      >
        <button onClick={() => editNode(id)}>✏️ 编辑</button>
        <button onClick={() => deleteNode(id)}>🗑️ 删除</button>
      </NodeToolbar>

      <Handle type="target" position={Position.Top} />
      <div className="node-content">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
```

---

## NodeResizer（节点大小调整）

允许用户拖拽调整节点尺寸，**只能在自定义节点组件内使用**。

```typescript
import { NodeResizer, NodeResizerControl } from '@xyflow/react';

function ResizableNode({ selected, data }: NodeProps) {
  return (
    <>
      <NodeResizer
        isVisible={selected}  // 选中时显示调整手柄
        minWidth={80}
        minHeight={40}
        maxWidth={400}
        maxHeight={300}
        onResize={(_event, { width, height, x, y }) => {
          console.log('新尺寸:', { width, height });
        }}
        onResizeEnd={(_event, params) => {
          // 持久化新尺寸
        }}
      />
      <div style={{ padding: 10 }}>{data.label}</div>
    </>
  );
}

// 只有某个方向的调整手柄
function VerticalResizeOnly({ selected }: NodeProps) {
  return (
    <>
      <NodeResizerControl position="bottom" />
      <NodeResizerControl position="top" />
      <div>只允许垂直调整</div>
    </>
  );
}
```

---

## EdgeToolbar（边工具栏）

在边的特定位置显示浮动 UI，**只能在自定义边组件内使用**。

```typescript
import { EdgeToolbar, EdgeProps, getBezierPath } from '@xyflow/react';

function ToolbarEdge({ id, ...props }: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath(props);

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeToolbar
        edgeId={id}
        x={labelX}
        y={labelY}
      >
        <button onClick={() => deleteEdge(id)}>×</button>
      </EdgeToolbar>
    </>
  );
}
```

---

## ViewportPortal

将内容渲染到跟随视口变换的层中（随画布缩放平移），适合需要固定在流坐标系的自定义覆盖层：

```typescript
import { ViewportPortal } from '@xyflow/react';

function Flow() {
  return (
    <ReactFlow nodes={nodes} edges={edges}>
      <ViewportPortal>
        {/* 这里的内容跟随画布缩放和平移 */}
        <div style={{ position: 'absolute', left: 100, top: 100 }}>
          流坐标系中的标注
        </div>
      </ViewportPortal>
    </ReactFlow>
  );
}
```

---

## 组件位置参数

所有支持 `position` 的组件接受以下值：

```typescript
type PanelPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
```
