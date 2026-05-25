# 事件处理

React Flow 提供节点、边、连接、选择、视口和画布的完整事件体系。

## 节点事件

### 点击事件

```typescript
import { ReactFlow, NodeMouseHandler } from '@xyflow/react';

const onNodeClick: NodeMouseHandler = (event, node) => {
  console.log('点击节点:', node.id, node.data);
};

const onNodeDoubleClick: NodeMouseHandler = (event, node) => {
  console.log('双击节点:', node.id);
};

const onNodeContextMenu: NodeMouseHandler = (event, node) => {
  event.preventDefault();
  // 显示右键菜单
};

<ReactFlow
  onNodeClick={onNodeClick}
  onNodeDoubleClick={onNodeDoubleClick}
  onNodeContextMenu={onNodeContextMenu}
/>
```

### 拖拽事件

```typescript
import { OnNodeDrag, NodeMouseHandler } from '@xyflow/react';

const onNodeDragStart: NodeMouseHandler = (event, node) => {
  console.log('开始拖拽:', node.id);
};

const onNodeDrag: OnNodeDrag = (event, node, allDraggedNodes) => {
  console.log('拖拽中:', node.id, node.position);
  // allDraggedNodes: 多选拖拽时包含所有被拖动节点
};

const onNodeDragStop: NodeMouseHandler = (event, node) => {
  console.log('拖拽结束，最终位置:', node.position);
  // 此处适合持久化节点位置
};

<ReactFlow
  onNodeDragStart={onNodeDragStart}
  onNodeDrag={onNodeDrag}
  onNodeDragStop={onNodeDragStop}
/>
```

### 悬停事件

```typescript
const onNodeMouseEnter: NodeMouseHandler = (event, node) => {
  // 显示 tooltip
};
const onNodeMouseLeave: NodeMouseHandler = (event, node) => {
  // 隐藏 tooltip
};

<ReactFlow
  onNodeMouseEnter={onNodeMouseEnter}
  onNodeMouseLeave={onNodeMouseLeave}
/>
```

## 边事件

```typescript
import { EdgeMouseHandler, OnReconnect } from '@xyflow/react';

const onEdgeClick: EdgeMouseHandler = (event, edge) => {
  console.log('点击边:', edge.id, edge.source, '->', edge.target);
};

const onEdgeDoubleClick: EdgeMouseHandler = (event, edge) => {
  // 双击边弹出编辑界面
};

const onEdgeContextMenu: EdgeMouseHandler = (event, edge) => {
  event.preventDefault();
  // 右键菜单
};

const onEdgeMouseEnter: EdgeMouseHandler = (event, edge) => {
  // 高亮边
};

<ReactFlow
  onEdgeClick={onEdgeClick}
  onEdgeDoubleClick={onEdgeDoubleClick}
  onEdgeContextMenu={onEdgeContextMenu}
  onEdgeMouseEnter={onEdgeMouseEnter}
/>
```

## 删除事件

```typescript
import { OnNodesDelete, OnEdgesDelete, OnBeforeDelete, OnDelete } from '@xyflow/react';

const onNodesDelete: OnNodesDelete = (deletedNodes) => {
  console.log('已删除节点:', deletedNodes.map(n => n.id));
};

const onEdgesDelete: OnEdgesDelete = (deletedEdges) => {
  console.log('已删除边:', deletedEdges.map(e => e.id));
};

// 统一删除回调
const onDelete: OnDelete = ({ nodes, edges }) => {
  console.log(`删除了 ${nodes.length} 个节点和 ${edges.length} 条边`);
};

// 删除前确认（可异步）
const onBeforeDelete: OnBeforeDelete = async ({ nodes, edges }) => {
  if (nodes.some(n => n.data.locked)) {
    alert('存在锁定节点，无法删除');
    return false;
  }
  return true; // 返回 true 允许删除
};

<ReactFlow
  onNodesDelete={onNodesDelete}
  onEdgesDelete={onEdgesDelete}
  onDelete={onDelete}
  onBeforeDelete={onBeforeDelete}
/>
```

## 选择事件

### useOnSelectionChange Hook

```typescript
import { useOnSelectionChange, OnSelectionChangeParams } from '@xyflow/react';
import { useCallback } from 'react';

function SelectionTracker() {
  const onChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
    console.log('选中节点:', nodes.map(n => n.id));
    console.log('选中边:', edges.map(e => e.id));
  }, []);

  useOnSelectionChange({ onChange });
  return null;
}

// 将此组件放在 <ReactFlow> 内部
```

### 选择区域拖拽事件

```typescript
import { SelectionDragHandler } from '@xyflow/react';

const onSelectionDragStart: SelectionDragHandler = (event, nodes) => {
  console.log('开始拖拽选区，包含节点:', nodes.length);
};

const onSelectionDragStop: SelectionDragHandler = (event, nodes) => {
  console.log('选区拖拽结束');
};

const onSelectionContextMenu = (event: React.MouseEvent, nodes: Node[]) => {
  event.preventDefault();
  // 多选右键菜单
};

<ReactFlow
  onSelectionDragStart={onSelectionDragStart}
  onSelectionDragStop={onSelectionDragStop}
  onSelectionContextMenu={onSelectionContextMenu}
/>
```

## 视口事件

### useOnViewportChange Hook

```typescript
import { useOnViewportChange, Viewport } from '@xyflow/react';
import { useCallback } from 'react';

function ViewportTracker() {
  const onStart = useCallback((viewport: Viewport) => {
    console.log('视口开始变化');
  }, []);

  const onChange = useCallback((viewport: Viewport) => {
    console.log('视口变化:', viewport.x, viewport.y, viewport.zoom);
  }, []);

  const onEnd = useCallback((viewport: Viewport) => {
    // 持久化视口
    localStorage.setItem('viewport', JSON.stringify(viewport));
  }, []);

  useOnViewportChange({ onStart, onChange, onEnd });
  return null;
}
```

### onMove 事件

```typescript
import { OnMove } from '@xyflow/react';

const onMove: OnMove = (event, viewport) => {
  // 视口移动中（含缩放）
};
const onMoveEnd: OnMove = (event, viewport) => {
  // 视口停止移动
};

<ReactFlow onMove={onMove} onMoveEnd={onMoveEnd} />
```

## 画布（Pane）事件

```typescript
import { MouseEvent } from 'react';

const onPaneClick = (event: MouseEvent) => {
  // 点击画布空白处（常用于取消选择）
};

const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  // 画布右键菜单（常用于添加节点）
};

const onPaneMouseMove = (event: MouseEvent) => {
  // 鼠标在画布上移动
};

<ReactFlow
  onPaneClick={onPaneClick}
  onPaneContextMenu={onPaneContextMenu}
  onPaneMouseMove={onPaneMouseMove}
/>
```

## 初始化事件

```typescript
import { OnInit, ReactFlowInstance } from '@xyflow/react';

const onInit: OnInit = (reactFlowInstance: ReactFlowInstance) => {
  console.log('React Flow 初始化完成');
  // 初始化后执行 fitView
  reactFlowInstance.fitView({ padding: 0.2 });
};

<ReactFlow onInit={onInit} />
```

## 错误事件

```typescript
import { OnError } from '@xyflow/react';

const onError: OnError = (code, message) => {
  console.error(`React Flow Error [${code}]:`, message);
  // 常见错误码：
  // '002': 节点尺寸为 0（父容器无高度）
  // '010': Handle 渲染在节点外部
};

<ReactFlow onError={onError} />
```

## 实战：右键菜单添加节点

```typescript
import { useReactFlow } from '@xyflow/react';
import { useState, useCallback, MouseEvent } from 'react';

function FlowWithContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { screenToFlowPosition, addNodes } = useReactFlow();

  const onPaneContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      setMenu({ x: event.clientX, y: event.clientY });
    },
    [],
  );

  const addNodeAtMenu = useCallback(() => {
    if (!menu) return;
    const position = screenToFlowPosition({ x: menu.x, y: menu.y });
    addNodes({
      id: `node-${Date.now()}`,
      position,
      data: { label: '新节点' },
    });
    setMenu(null);
  }, [menu, screenToFlowPosition, addNodes]);

  return (
    <>
      <ReactFlow onPaneClick={() => setMenu(null)} onPaneContextMenu={onPaneContextMenu} />
      {menu && (
        <div
          style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 4 }}
        >
          <button onClick={addNodeAtMenu} style={{ display: 'block', padding: '6px 12px' }}>
            添加节点
          </button>
        </div>
      )}
    </>
  );
}
```
