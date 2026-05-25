# 常用模式与配方

常见的 React Flow 交互场景实现方案。

## 1. 点击画布添加节点

```typescript
import { ReactFlow, useReactFlow } from '@xyflow/react';
import { MouseEvent, useCallback } from 'react';

function FlowWithAddOnClick() {
  const { screenToFlowPosition, addNodes } = useReactFlow();

  const onPaneClick = useCallback(
    (event: MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNodes({
        id: `node-${Date.now()}`,
        position,
        data: { label: '新节点' },
      });
    },
    [screenToFlowPosition, addNodes],
  );

  return <ReactFlow onPaneClick={onPaneClick} />;
}
```

---

## 2. 拖放添加节点（Drag & Drop）

```typescript
// 侧边栏可拖拽的节点项
function DraggableNodeItem({ type, label }: { type: string; label: string }) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div draggable onDragStart={onDragStart} style={{ padding: 8, cursor: 'grab' }}>
      {label}
    </div>
  );
}

// 画布区域接收拖放
function DroppableFlow() {
  const { screenToFlowPosition, addNodes } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-type');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNodes({
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type} 节点` },
      });
    },
    [screenToFlowPosition, addNodes],
  );

  return (
    <ReactFlow onDragOver={onDragOver} onDrop={onDrop} />
  );
}
```

---

## 3. 撤销/重做（Undo/Redo）

```typescript
import { create } from 'zustand';
import { temporal } from 'zundo';
import { Node, Edge } from '@xyflow/react';

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
};

// 使用 zundo 中间件实现时间旅行
const useFlowStore = create<FlowState>()(
  temporal(
    (set) => ({
      nodes: [],
      edges: [],
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
    }),
    {
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    },
  ),
);

function UndoRedoControls() {
  const { undo, redo, pastStates, futureStates } = useFlowStore.temporal.getState();

  return (
    <div>
      <button onClick={() => undo()} disabled={pastStates.length === 0}>
        ↩ 撤销
      </button>
      <button onClick={() => redo()} disabled={futureStates.length === 0}>
        ↪ 重做
      </button>
    </div>
  );
}
```

---

## 4. 节点内联编辑

```typescript
import { Node, NodeProps, Handle, Position, useReactFlow } from '@xyflow/react';
import { useState, useRef, useEffect } from 'react';

function EditableNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label as string);
  const { updateNodeData } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeData(id, { label });
  };

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      style={{ padding: 8, minWidth: 80, border: `1px solid ${selected ? '#6366f1' : '#e2e8f0'}` }}
    >
      <Handle type="target" position={Position.Top} />
      {isEditing ? (
        <input
          ref={inputRef}
          className="nodrag"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          style={{ width: '100%', border: 'none', outline: 'none' }}
        />
      ) : (
        <div>{label}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

---

## 5. 连线后弹出边标签编辑

```typescript
import { addEdge, OnConnect } from '@xyflow/react';
import { useState } from 'react';

function FlowWithEdgeEdit() {
  const [edges, setEdges] = useEdgesState([]);
  const [pendingConnection, setPendingConnection] = useState(null);

  const onConnect: OnConnect = (connection) => {
    setPendingConnection(connection); // 弹出标签输入框
  };

  const confirmEdge = (label: string) => {
    if (!pendingConnection) return;
    setEdges((eds) => addEdge({ ...pendingConnection, label }, eds));
    setPendingConnection(null);
  };

  return (
    <>
      <ReactFlow onConnect={onConnect} />
      {pendingConnection && (
        <LabelInputDialog onConfirm={confirmEdge} onCancel={() => setPendingConnection(null)} />
      )}
    </>
  );
}
```

---

## 6. 流程图持久化（完整保存/恢复）

```typescript
import { useReactFlow, ReactFlowJsonObject } from '@xyflow/react';

const STORAGE_KEY = 'react-flow-diagram';

function useDiagramPersist() {
  const { getNodes, getEdges, getViewport, setNodes, setEdges, setViewport } = useReactFlow();

  const save = () => {
    const data: ReactFlowJsonObject = {
      nodes: getNodes(),
      edges: getEdges(),
      viewport: getViewport(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  };

  const restore = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const { nodes, edges, viewport } = JSON.parse(raw) as ReactFlowJsonObject;
    setNodes(nodes);
    setEdges(edges);
    setViewport(viewport);
  };

  const exportJson = () => {
    const data = save();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return { save, restore, exportJson };
}
```

---

## 7. 连线时从空白处创建新节点

```typescript
import { OnConnectEnd, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

function FlowWithNodeOnDrop() {
  const { screenToFlowPosition, addNodes, addEdges } = useReactFlow();

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      // 只在连接到空白处（非节点）时创建
      if (connectionState.isValid || !connectionState.fromNode) return;

      const mouseEvent = event as MouseEvent;
      const position = screenToFlowPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
      });

      const newNodeId = `node-${Date.now()}`;
      addNodes({
        id: newNodeId,
        position,
        data: { label: '新节点' },
      });

      // 同时创建连线
      if (connectionState.fromNode && connectionState.fromHandle) {
        addEdges({
          id: `edge-${Date.now()}`,
          source: connectionState.fromNode.id,
          sourceHandle: connectionState.fromHandle.id,
          target: newNodeId,
        });
      }
    },
    [screenToFlowPosition, addNodes, addEdges],
  );

  return <ReactFlow onConnectEnd={onConnectEnd} />;
}
```

---

## 8. 右键上下文菜单

```typescript
import { useState, useCallback } from 'react';
import { ReactFlow, Node, NodeMouseHandler } from '@xyflow/react';

type ContextMenuState = {
  node: Node;
  x: number;
  y: number;
} | null;

function FlowWithContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const { deleteElements, updateNodeData } = useReactFlow();

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ node, x: event.clientX, y: event.clientY });
  }, []);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  return (
    <div onClick={closeMenu}>
      <ReactFlow onNodeContextMenu={onNodeContextMenu} onPaneClick={closeMenu} />

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 4,
            zIndex: 1000,
            minWidth: 150,
          }}
        >
          <button
            onClick={() => {
              updateNodeData(contextMenu.node.id, { label: '已重命名' });
              closeMenu();
            }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px' }}
          >
            ✏️ 重命名
          </button>
          <button
            onClick={() => {
              deleteElements({ nodes: [{ id: contextMenu.node.id }] });
              closeMenu();
            }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px', color: '#ef4444' }}
          >
            🗑️ 删除
          </button>
        </div>
      )}
    </div>
  );
}
```

---

---

## 10. 导出为图片

用 `html-to-image` 把画布截图为 PNG：

```bash
npm install html-to-image
```

```typescript
import { useCallback } from 'react';
import { Panel, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

const IMAGE_WIDTH  = 1024;
const IMAGE_HEIGHT = 768;

function ExportButton() {
  const { getNodes } = useReactFlow();

  const onClick = useCallback(() => {
    const nodes    = getNodes();
    const bounds   = getNodesBounds(nodes);
    // 计算将所有节点适配进目标图片尺寸的 viewport
    const viewport = getViewportForBounds(bounds, IMAGE_WIDTH, IMAGE_HEIGHT, 0.5, 2, 0.1);

    const el = document.querySelector<HTMLElement>('.react-flow__viewport');
    if (!el) return;

    toPng(el, {
      backgroundColor: '#ffffff',
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      style: {
        width:     `${IMAGE_WIDTH}px`,
        height:    `${IMAGE_HEIGHT}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      const a    = document.createElement('a');
      a.download = 'diagram.png';
      a.href     = dataUrl;
      a.click();
    });
  }, [getNodes]);

  return (
    <Panel position="top-right">
      <button onClick={onClick}>导出 PNG</button>
    </Panel>
  );
}
```

**关键**：目标是 `.react-flow__viewport`（非外层 wrapper），并手动设置 transform 以适配图片尺寸。

---

## 11. 节点详情侧边栏

```typescript
import { useState, useCallback } from 'react';
import { ReactFlow, useReactFlow, type Node, type NodeMouseHandler } from '@xyflow/react';

function FlowWithDetailPanel() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { updateNodeData } = useReactFlow();

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNode(null)}
        />
      </div>

      {selectedNode && (
        <aside style={{ width: 280, padding: 16, borderLeft: '1px solid #e2e8f0' }}>
          <h3>节点: {selectedNode.id}</h3>
          <label>
            标签:
            <input
              className="nodrag"
              value={String(selectedNode.data.label ?? '')}
              onChange={(e) => {
                updateNodeData(selectedNode.id, { label: e.target.value });
                setSelectedNode((n) => n && { ...n, data: { ...n.data, label: e.target.value } });
              }}
            />
          </label>
        </aside>
      )}
    </div>
  );
}
```

**提示**：若节点数据由计算流动态更新，在详情面板中使用 `useNodesData(selectedNode.id)` 订阅实时变化，而非依赖 `selectedNode` 快照。

```typescript
import { useCallback } from 'react';
import { NodeMouseHandler, useReactFlow } from '@xyflow/react';

function useNodeHighlight() {
  const { setNodes, setEdges, getEdges } = useReactFlow();

  const highlightConnected = useCallback((nodeId: string) => {
    const edges = getEdges();
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();

    edges.forEach((edge) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      }
    });

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: connectedNodeIds.has(n.id) || n.id === nodeId ? 1 : 0.25,
        },
      })),
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: connectedEdgeIds.has(e.id) ? 1 : 0.1,
        },
      })),
    );
  }, [setNodes, setEdges, getEdges]);

  const clearHighlight = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
    setEdges((eds) => eds.map((e) => ({ ...e, style: { ...e.style, opacity: 1 } })));
  }, [setNodes, setEdges]);

  return { highlightConnected, clearHighlight };
}
```


## 9. 高亮相关节点和边

```typescript
import { useCallback } from 'react';
import { NodeMouseHandler, useReactFlow } from '@xyflow/react';

function useNodeHighlight() {
  const { setNodes, setEdges, getEdges } = useReactFlow();

  const highlightConnected = useCallback((nodeId: string) => {
    const edges = getEdges();
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();

    edges.forEach((edge) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      }
    });

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: connectedNodeIds.has(n.id) || n.id === nodeId ? 1 : 0.25,
        },
      })),
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: connectedEdgeIds.has(e.id) ? 1 : 0.1,
        },
      })),
    );
  }, [setNodes, setEdges, getEdges]);

  const clearHighlight = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
    setEdges((eds) => eds.map((e) => ({ ...e, style: { ...e.style, opacity: 1 } })));
  }, [setNodes, setEdges]);

  return { highlightConnected, clearHighlight };
}
```
