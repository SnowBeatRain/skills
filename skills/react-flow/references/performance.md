# 性能优化

React Flow 在数百节点时通常表现良好，但超过一定规模时需要主动优化。

## 性能基准参考

| 节点数量 | 建议策略 |
|----------|---------|
| < 100 | 默认配置，无需优化 |
| 100 ~ 500 | 对自定义节点组件应用 `React.memo` |
| 500 ~ 2000 | `memo` + 细粒度 hooks + `nodeExtent` 剪裁 |
| > 2000 | 考虑虚拟化、分层渲染或数据分页 |

---

## 1. React.memo 包裹自定义节点

自定义节点组件在任何节点状态变化时都会重渲染，`React.memo` 可以跳过不必要的渲染：

```typescript
import { memo } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';

const ExpensiveNode = memo(({ data, selected }: NodeProps) => {
  // 只在 data 或 selected 变化时重渲染
  return (
    <div className={selected ? 'selected' : ''}>
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

ExpensiveNode.displayName = 'ExpensiveNode';

export default ExpensiveNode;
```

---

## 2. 稳定的 nodeTypes / edgeTypes

**最常见的性能陷阱**：每次渲染创建新的 `nodeTypes` / `edgeTypes` 对象会导致所有节点卸载重挂载。

```typescript
// ❌ 错误：组件内定义，每次渲染都创建新对象
function Flow() {
  const nodeTypes = { custom: CustomNode }; // 每次都是新引用！
  return <ReactFlow nodeTypes={nodeTypes} />;
}

// ✅ 正确方式 1：组件外定义（推荐）
const nodeTypes = { custom: CustomNode };

function Flow() {
  return <ReactFlow nodeTypes={nodeTypes} />;
}

// ✅ 正确方式 2：useMemo（当类型需要动态计算时）
function Flow() {
  const nodeTypes = useMemo(
    () => ({ custom: CustomNode, special: SpecialNode }),
    [], // 空依赖 = 只创建一次
  );
  return <ReactFlow nodeTypes={nodeTypes} />;
}
```

---

## 3. 细粒度 Hooks 减少订阅范围

避免在自定义节点中使用 `useNodes()` / `useEdges()`（订阅全量变化），改用细粒度 hooks：

```typescript
// ❌ 性能差：任何节点变化都触发此组件重渲染
function NodeWithOtherData({ id }: NodeProps) {
  const nodes = useNodes(); // 全量订阅
  const otherNode = nodes.find(n => n.id === 'other-node');
  return <div>{otherNode?.data.value}</div>;
}

// ✅ 性能好：只订阅需要的节点数据
function NodeWithOtherData({ id }: NodeProps) {
  const otherData = useNodesData('other-node'); // 只订阅 other-node
  return <div>{otherData?.value}</div>;
}
```

---

## 4. updateNodeData 替代全量 setNodes

```typescript
// ❌ 性能差：遍历全量节点创建新数组
const { setNodes } = useReactFlow();
setNodes((nodes) =>
  nodes.map((n) => (n.id === targetId ? { ...n, data: { ...n.data, value: 42 } } : n))
);

// ✅ 性能好：只更新目标节点
const { updateNodeData } = useReactFlow();
updateNodeData(targetId, { value: 42 });
```

---

## 5. nodeExtent / translateExtent

限制画布范围，减少 React Flow 对离屏节点的计算：

```typescript
<ReactFlow
  // 限制节点可放置的范围（flow 坐标）
  nodeExtent={[[-2000, -2000], [2000, 2000]]}

  // 限制视口平移范围
  translateExtent={[[-2000, -2000], [2000, 2000]]}
/>
```

---

## 6. 避免在节点渲染中创建新引用

```typescript
// ❌ 每次渲染都创建新的样式对象
function SlowNode({ data }: NodeProps) {
  return (
    <div style={{ padding: 10, border: '1px solid #333' }}> {/* 每次新对象 */}
      {data.label}
    </div>
  );
}

// ✅ 在组件外定义常量样式
const nodeStyle: CSSProperties = { padding: 10, border: '1px solid #333' };

const FastNode = memo(({ data }: NodeProps) => (
  <div style={nodeStyle}>{data.label}</div>
));
```

---

## 7. 批量更新节点

大批量更新时避免逐一调用 `updateNode`，改用 `setNodes` 批量更新：

```typescript
const { setNodes } = useReactFlow();

// 批量更新所有节点状态（单次 setState）
const updateAllStatus = (status: string) => {
  setNodes((nodes) => nodes.map((n) => ({ ...n, data: { ...n.data, status } })));
};
```

---

## 8. 大规模图的虚拟化方案

当节点数量超过 2000 时，可考虑只渲染视口内的节点：

```typescript
import { useReactFlow, useOnViewportChange } from '@xyflow/react';
import { useState, useCallback } from 'react';

function useVirtualizedNodes(allNodes: Node[]) {
  const { getViewport } = useReactFlow();
  const [visibleNodes, setVisibleNodes] = useState<Node[]>(allNodes.slice(0, 200));

  const updateVisible = useCallback(() => {
    const vp = getViewport();
    // 根据视口范围过滤节点（简化示例）
    const viewBounds = {
      left: -vp.x / vp.zoom,
      top: -vp.y / vp.zoom,
      right: (-vp.x + window.innerWidth) / vp.zoom,
      bottom: (-vp.y + window.innerHeight) / vp.zoom,
    };

    const visible = allNodes.filter(
      (n) =>
        n.position.x >= viewBounds.left - 200 &&
        n.position.x <= viewBounds.right + 200 &&
        n.position.y >= viewBounds.top - 200 &&
        n.position.y <= viewBounds.bottom + 200,
    );

    setVisibleNodes(visible);
  }, [allNodes, getViewport]);

  useOnViewportChange({ onChange: updateVisible });

  return visibleNodes;
}
```

---

## 9. 选项性能调优

```typescript
<ReactFlow
  // 禁用不需要的功能
  nodesDraggable={false}      // 禁止节点拖拽（只读图）
  nodesConnectable={false}    // 禁止创建连接
  elementsSelectable={false}  // 禁止选择

  // 降低事件触发频率
  onlyRenderVisibleElements={true} // 只渲染视口内元素（实验性）

  // 关闭自动适应（首次渲染无动画）
  fitView={false}
/>
```

---

## 10. 开发工具诊断

使用 React DevTools Profiler 定位重渲染原因：

1. 在 React DevTools 中启用 "Highlight updates when components render"。
2. 操作图（拖拽节点、滚动）观察哪些组件在非预期时刻高亮。
3. 常见原因：`nodeTypes` 每次重建、`useNodes()` 全量订阅、内联样式对象。
