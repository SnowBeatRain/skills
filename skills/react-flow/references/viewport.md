# 视口控制

React Flow 通过 `useReactFlow()` hook 提供完整的视口编程控制。

## useReactFlow 视口方法

```typescript
import { useReactFlow } from '@xyflow/react';

function ViewportControls() {
  const {
    fitView,           // 适应所有节点
    zoomIn,            // 放大
    zoomOut,           // 缩小
    zoomTo,            // 缩放到指定级别
    getZoom,           // 获取当前缩放比例
    setViewport,       // 直接设置视口
    getViewport,       // 获取当前视口
    setCenter,         // 将视口中心移到指定坐标
    screenToFlowPosition, // 屏幕坐标 → 流坐标
    flowToScreenPosition, // 流坐标 → 屏幕坐标
    getNodesBounds,    // 获取节点集合的包围盒
    viewportInitialized, // 视口是否已初始化
  } = useReactFlow();
}
```

## fitView

适应画布内所有（或指定）节点：

```typescript
const { fitView } = useReactFlow();

// 基础用法
await fitView();

// 带参数
await fitView({
  padding: 0.2,              // 边距比例（0.2 = 20% 留白）
  duration: 400,             // 动画时长 ms（0 = 无动画）
  maxZoom: 1,                // 最大缩放（防止过度放大）
  minZoom: 0.1,              // 最小缩放
  includeHiddenNodes: false, // 是否包含隐藏节点
  nodes: [{ id: 'node-1' }], // 只聚焦指定节点
});

// 聚焦选中节点
const fitSelectedNodes = async () => {
  const selected = getNodes().filter(n => n.selected);
  if (selected.length > 0) {
    await fitView({ nodes: selected, padding: 0.3, duration: 300 });
  }
};
```

## 缩放控制

```typescript
const { zoomIn, zoomOut, zoomTo, getZoom } = useReactFlow();

zoomIn();                         // 放大一级
zoomIn({ duration: 300 });        // 带动画

zoomOut({ duration: 300 });       // 缩小一级

zoomTo(1.5);                      // 缩放到 1.5x
zoomTo(1.5, { duration: 500 });   // 带动画

const currentZoom = getZoom();    // 获取当前缩放（数值）
```

## setViewport / getViewport

直接读写视口位置和缩放：

```typescript
import { Viewport } from '@xyflow/react';

const { setViewport, getViewport } = useReactFlow();

// 读取
const viewport: Viewport = getViewport();
// { x: number, y: number, zoom: number }

// 写入（带动画）
setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });

// 相对移动
const current = getViewport();
setViewport({ ...current, x: current.x + 100 });
```

## setCenter

将视口中心对准指定的流坐标点：

```typescript
const { setCenter, getNode } = useReactFlow();

// 中心对准坐标 (250, 250)，缩放到 1.5
setCenter(250, 250, { zoom: 1.5, duration: 500 });

// 中心对准某个节点
const panToNode = (nodeId: string) => {
  const node = getNode(nodeId);
  if (node) {
    const centerX = node.position.x + (node.measured?.width ?? 150) / 2;
    const centerY = node.position.y + (node.measured?.height ?? 40) / 2;
    setCenter(centerX, centerY, { zoom: 1.2, duration: 500 });
  }
};
```

## 坐标转换

```typescript
const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();

// 屏幕坐标 → 流坐标（用于鼠标事件）
const handlePaneClick = (event: React.MouseEvent) => {
  const flowPos = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });
  console.log('流坐标:', flowPos); // { x, y }
};

// 流坐标 → 屏幕坐标（用于定位浮层）
const screenPos = flowToScreenPosition({ x: 100, y: 200 });
```

## 视口持久化

```typescript
import { useReactFlow, Viewport } from '@xyflow/react';
import { useCallback } from 'react';

const STORAGE_KEY = 'flow-viewport';

function useViewportPersist() {
  const { getViewport, setViewport } = useReactFlow();

  const save = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getViewport()));
  }, [getViewport]);

  const restore = useCallback(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setViewport(JSON.parse(raw) as Viewport, { duration: 300 });
    }
  }, [setViewport]);

  return { save, restore };
}
```

## 受控视口

通过外部 state 完全控制视口（适合撤销/重做场景）：

```typescript
import { useState, useCallback } from 'react';
import { ReactFlow, Viewport } from '@xyflow/react';

function ControlledViewportFlow() {
  const [viewport, setViewportState] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  const onViewportChange = useCallback((vp: Viewport) => {
    setViewportState(vp);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      viewport={viewport}            // 受控
      onViewportChange={onViewportChange}
    />
  );
}
```

## useOnViewportChange Hook

在视口变化时执行副作用（不需要受控视口）：

```typescript
import { useOnViewportChange, Viewport } from '@xyflow/react';

function ViewportSyncComponent() {
  useOnViewportChange({
    onStart: (vp: Viewport) => { /* 视口开始变化 */ },
    onChange: (vp: Viewport) => { /* 变化中，频繁触发 */ },
    onEnd: (vp: Viewport) => {
      // 变化结束，适合持久化
      localStorage.setItem('vp', JSON.stringify(vp));
    },
  });
  return null;
}
```

## getNodesBounds

获取节点集合的包围盒（用于自定义 fitView 逻辑）：

```typescript
const { getNodesBounds, getNodes, setViewport } = useReactFlow();

const fitToSelected = () => {
  const selected = getNodes().filter(n => n.selected);
  if (selected.length === 0) return;

  const bounds = getNodesBounds(selected);
  console.log(bounds); // { x, y, width, height }
};
```

## 视口约束

限制用户可拖拽/缩放的范围：

```typescript
<ReactFlow
  // 限制可平移范围（flow 坐标系）
  translateExtent={[[-1000, -1000], [2000, 2000]]}

  // 限制缩放范围
  minZoom={0.1}
  maxZoom={4}

  // 禁用用户交互
  panOnDrag={false}      // 禁止拖拽平移
  zoomOnScroll={false}   // 禁止滚轮缩放
  zoomOnPinch={false}    // 禁止触控板缩放
  zoomOnDoubleClick={false} // 禁止双击缩放

  // 锁定视口（完全禁止平移和缩放）
  preventScrolling={true}
/>
```

## viewportInitialized 标志

在视口初始化完成前调用 `fitView` 等方法无效：

```typescript
function SafeFitView() {
  const { viewportInitialized, fitView } = useReactFlow();

  useEffect(() => {
    if (viewportInitialized) {
      fitView({ duration: 300 });
    }
  }, [viewportInitialized, fitView]);

  return null;
}
```
