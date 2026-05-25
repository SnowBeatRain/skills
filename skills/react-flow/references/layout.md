# 布局算法

React Flow 本身不内置自动布局，需要结合第三方布局库计算节点坐标后写回。

## 布局库选择

| 库 | 适用场景 | 安装 |
|---|---|---|
| `dagre` | 层级图、流程图、有向无环图（DAG） | `npm i @dagrejs/dagre` |
| `elkjs` | 复杂多算法布局（层级/力导向/正交等） | `npm i elkjs` |
| `d3-hierarchy` | 树形图、集群图、分区图 | `npm i d3-hierarchy` |
| `d3-force` | 力导向图（关系网络） | `npm i d3-force` |

---

## dagre 布局（最常用）

适合流程图、Pipeline、DAG 等层级结构。

### 安装

```bash
npm install @dagrejs/dagre
```

### 布局函数

```typescript
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB', // TB: 上→下, LR: 左→右
) {
  const g = new dagre.graphlib.Graph();

  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 50,   // 节点间水平间距
    ranksep: 80,   // 层级间垂直间距
    marginx: 20,
    marginy: 20,
  });

  // 添加节点（需要提供尺寸）
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.measured?.width ?? NODE_WIDTH,
      height: node.measured?.height ?? NODE_HEIGHT,
    });
  });

  // 添加边
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // 执行布局计算
  dagre.layout(g);

  // 将 dagre 坐标写回 React Flow 节点（dagre 坐标是节点中心，React Flow 是左上角）
  const layoutedNodes: Node[] = nodes.map((node) => {
    const position = g.node(node.id);
    return {
      ...node,
      position: {
        x: position.x - (node.measured?.width ?? NODE_WIDTH) / 2,
        y: position.y - (node.measured?.height ?? NODE_HEIGHT) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

### 在组件中使用

```typescript
import { useCallback } from 'react';
import { ReactFlow, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import { getLayoutedElements } from './layout';

function DagreFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const applyLayout = useCallback(
    (direction: 'TB' | 'LR' = 'TB') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // 布局完成后适应视口
      window.requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.2 });
      });
    },
    [nodes, edges, setNodes, setEdges, fitView],
  );

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button onClick={() => applyLayout('TB')}>纵向布局</button>
        <button onClick={() => applyLayout('LR')}>横向布局</button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      />
    </>
  );
}
```

---

## elkjs 布局

适合需要多种布局算法或复杂约束的场景。

### 安装

```bash
npm install elkjs web-worker
```

### 布局函数（异步）

```typescript
import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';

const elk = new ELK();

export type ElkLayoutOptions = {
  algorithm?: string; // 'layered' | 'force' | 'mrtree' | 'radial' | 'disco' | 'box'
  direction?: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  nodeSpacing?: number;
  layerSpacing?: number;
};

export async function getElkLayout(
  nodes: Node[],
  edges: Edge[],
  options: ElkLayoutOptions = {},
) {
  const {
    algorithm = 'layered',
    direction = 'DOWN',
    nodeSpacing = 50,
    layerSpacing = 80,
  } = options;

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': algorithm,
      'elk.direction': direction,
      'elk.spacing.nodeNode': String(nodeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: node.measured?.width ?? 150,
      height: node.measured?.height ?? 50,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layouted = await elk.layout(elkGraph);

  const layoutedNodes: Node[] = nodes.map((node) => {
    const elkNode = layouted.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

---

## d3-hierarchy 树形布局

适合组织架构图、文件树、族谱等树形结构。

```bash
npm install d3-hierarchy
```

```typescript
import { hierarchy, tree } from 'd3-hierarchy';
import { Node, Edge } from '@xyflow/react';

type TreeData = {
  id: string;
  children?: TreeData[];
  data: Record<string, unknown>;
};

export function getTreeLayout(
  rootData: TreeData,
  nodeWidth = 150,
  nodeHeight = 50,
  separation = { horizontal: 1.5, vertical: 2 },
) {
  const root = hierarchy(rootData);

  const treeLayout = tree<TreeData>()
    .nodeSize([nodeWidth * separation.horizontal, nodeHeight * separation.vertical]);

  treeLayout(root);

  const nodes: Node[] = root.descendants().map((d) => ({
    id: d.data.id,
    position: { x: d.x - nodeWidth / 2, y: d.y },
    data: d.data.data,
  }));

  const edges: Edge[] = root.links().map((link) => ({
    id: `${link.source.data.id}-${link.target.data.id}`,
    source: link.source.data.id,
    target: link.target.data.id,
    type: 'smoothstep',
  }));

  return { nodes, edges };
}
```

---

## 布局时机与注意事项

### 节点尺寸问题

布局库需要知道节点尺寸。React Flow 默认在首次渲染后测量节点尺寸（存储在 `node.measured`），因此有两种策略：

**策略 A：渲染后布局（推荐）**

```typescript
import { useNodesInitialized, useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';

function AutoLayout() {
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
  const [layoutApplied, setLayoutApplied] = useState(false);

  useEffect(() => {
    if (nodesInitialized && !layoutApplied) {
      const { nodes, edges } = getLayoutedElements(getNodes(), getEdges());
      setNodes(nodes);
      setLayoutApplied(true);
      requestAnimationFrame(() => fitView({ duration: 300 }));
    }
  }, [nodesInitialized, layoutApplied]);

  return null;
}
```

**策略 B：显式设置节点尺寸**

```typescript
const nodes: Node[] = data.map((item) => ({
  id: item.id,
  data: item,
  position: { x: 0, y: 0 }, // 先放在原点，布局后更新
  width: 150,  // 显式设置，无需等待测量
  height: 50,
}));
```

### fitView 时机

布局后调用 `fitView` 需要等待 DOM 更新：

```typescript
// 方式 1：requestAnimationFrame
setNodes(layoutedNodes);
requestAnimationFrame(() => fitView({ duration: 400 }));

// 方式 2：setTimeout
setNodes(layoutedNodes);
setTimeout(() => fitView({ duration: 400 }), 0);
```
