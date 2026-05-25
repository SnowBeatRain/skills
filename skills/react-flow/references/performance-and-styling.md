# 性能优化与样式

渲染优化、主题定制、CSS 变量、暗色模式、Tailwind 集成和无障碍配置。

## 性能优化

### 1. React.memo 包裹自定义节点组件

自定义节点在任何节点状态变化时都会重渲染，`React.memo` 可跳过不必要的渲染：

```typescript
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

const CustomNode = memo(function CustomNode({ data, selected }: NodeProps) {
  return (
    <div style={{ border: selected ? '2px solid #6366f1' : '1px solid #e2e8f0', padding: 8 }}>
      <Handle type="target" position={Position.Top} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
export default CustomNode;
```

### 2. 稳定的 nodeTypes / edgeTypes 引用

**最常见性能陷阱**：每次渲染创建新对象会卸载重挂载所有节点。

```typescript
// ❌ 错误：组件内定义，每次渲染都是新对象
function Flow() {
  const nodeTypes = { custom: CustomNode }; // 每次都是新引用！
  return <ReactFlow nodeTypes={nodeTypes} />;
}

// ✅ 组件外定义（推荐）
const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

function Flow() {
  return <ReactFlow nodeTypes={nodeTypes} edgeTypes={edgeTypes} />;
}

// ✅ 动态类型时用 useMemo
const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
```

### 3. 稳定化回调和 object props

```typescript
const onNodeClick = useCallback((event, node) => {
  console.log('clicked', node.id);
}, []);

// defaultEdgeOptions 每次渲染重建会触发所有边重渲染
const defaultEdgeOptions = useMemo(
  () => ({ animated: true, style: { stroke: '#6366f1' } }),
  [],
);

const snapGrid = useMemo(() => [15, 15] as [number, number], []);

<ReactFlow
  onNodeClick={onNodeClick}
  defaultEdgeOptions={defaultEdgeOptions}
  snapGrid={snapGrid}
/>
```

### 4. 细粒度 hooks 替代全量订阅

```typescript
// ❌ 订阅全量变化，任何节点变化都触发重渲染
const nodes = useNodes();

// ✅ 只订阅需要的节点数据
const data = useNodesData('node-1');

// ✅ 只订阅当前节点的连接
const connections = useNodeConnections({ handleType: 'target' });

// ✅ useReactFlow：按需读取，不产生订阅
const { getNodes, getEdges } = useReactFlow();
const handleSave = () => {
  const nodes = getNodes(); // 读取时才计算，无重渲染
};
```

### 5. useStore selector + shallow 比较

```typescript
import { useStore } from '@xyflow/react';
import { shallow } from 'zustand/shallow';

// ❌ 任意 store 变化都触发
const state = useStore((s) => s);

// ✅ 只在选中 ID 列表变化时重渲染
const selectedNodeIds = useStore(
  (s) => s.nodes.filter((n) => n.selected).map((n) => n.id),
  shallow,
);

// ✅ 按缩放阈值渲染不同内容（selector 在组件外定义保持引用稳定）
const showDetailSelector = (s: ReactFlowState) => s.transform[2] >= 0.75;
const showDetail = useStore(showDetailSelector);
```

### 6. onlyRenderVisibleElements

超大型图（500+ 节点）时启用视口裁剪：

```typescript
<ReactFlow onlyRenderVisibleElements={true} />
```

跳过渲染视口外节点/边。会降低画布外节点的边缘体验，按需权衡。

### 7. 隐藏子树

折叠大型节点树时用 `hidden` 属性，而非删除：

```typescript
const { setNodes, setEdges, getNodes } = useReactFlow();

const collapseChildren = (parentId: string) => {
  const childIds = new Set(
    getNodes().filter((n) => n.parentId === parentId).map((n) => n.id),
  );
  setNodes((nds) =>
    nds.map((n) => childIds.has(n.id) ? { ...n, hidden: !n.hidden } : n),
  );
  setEdges((eds) =>
    eds.map((e) => {
      const affected = childIds.has(e.source) || childIds.has(e.target);
      return affected ? { ...e, hidden: !e.hidden } : e;
    }),
  );
};
```

### 8. 节点样式简化

复杂 CSS 在大量节点时性能影响显著：

```typescript
// ❌ 大量节点时避免
{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)', filter: 'blur()', backdropFilter: '...' }

// ✅ 简化节点样式
{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }
```

### 9. 规格参考

| 节点数量 | 建议策略 |
|---------|---------|
| < 100 | 默认配置，无需优化 |
| 100 ~ 500 | `React.memo` 包裹自定义节点 |
| 500 ~ 2000 | `memo` + 细粒度 hooks + `nodeExtent` 裁剪 |
| > 2000 | 考虑 `onlyRenderVisibleElements` + 虚拟化 |

---

## 主题与样式

### CSS 引入方式

```typescript
// 完整样式（推荐大多数项目）
import '@xyflow/react/dist/style.css';

// 只要结构样式（推荐 Tailwind / styled-components）
import '@xyflow/react/dist/base.css';
```

### 颜色模式（v12+）

```typescript
// 亮色（默认）
<ReactFlow colorMode="light" />

// 暗色
<ReactFlow colorMode="dark" />

// 跟随系统偏好
<ReactFlow colorMode="system" />
```

`colorMode` 在 `.react-flow` 根容器上添加 `light` / `dark` 类名，配合 CSS 变量生效。

### CSS 变量完整列表

在 `.react-flow` 或 `:root` 上覆盖：

```css
.react-flow {
  /* 节点 */
  --xy-node-background-color-default:   #fff;
  --xy-node-border-default:             1px solid #1a192b;
  --xy-node-border-radius-default:      3px;
  --xy-node-color-default:              #222;
  --xy-node-boxshadow-hover-default:    0 1px 4px 1px rgba(0,0,0,0.08);
  --xy-node-boxshadow-selected-default: 0 0 0 0.5px #1a192b;

  /* Handle */
  --xy-handle-background-color-default: #1a192b;
  --xy-handle-border-color-default:     #fff;

  /* 边 */
  --xy-edge-stroke-default:          #b1b1b7;
  --xy-edge-stroke-width-default:    1;
  --xy-edge-stroke-selected-default: #555;

  /* 连接线 */
  --xy-connectionline-stroke-default:       #b1b1b7;
  --xy-connectionline-stroke-width-default: 1;

  /* 选择框 */
  --xy-selection-background-color-default: rgba(0,89,220,0.08);
  --xy-selection-border-default:           1px dotted rgba(0,89,220,0.8);

  /* Controls */
  --xy-controls-button-background-color-default:       #fefefe;
  --xy-controls-button-background-color-hover-default: #f4f4f4;
  --xy-controls-button-color-default:                  inherit;
  --xy-controls-button-border-color-default:           #eee;

  /* MiniMap */
  --xy-minimap-background-color-default:      #fff;
  --xy-minimap-mask-background-color-default: rgb(240,240,240,0.6);
  --xy-minimap-node-background-color-default: #e2e2e2;
  --xy-minimap-node-stroke-color-default:     transparent;

  /* Background */
  --xy-background-color-default:         #fff;
  --xy-background-pattern-color-default: #81818a;

  /* Attribution */
  --xy-attribution-background-color-default: rgba(255,255,255,0.5);
}
```

### 暗色主题示例

```css
.react-flow.dark {
  --xy-node-background-color-default:   #1e1e1e;
  --xy-node-border-default:             1px solid #444;
  --xy-node-color-default:              #eee;
  --xy-edge-stroke-default:             #666;
  --xy-background-color-default:        #121212;
  --xy-background-pattern-color-default: #333;
  --xy-controls-button-background-color-default: #2a2a2a;
  --xy-controls-button-border-color-default:     #444;
  --xy-minimap-background-color-default: #1e1e1e;
}
```

### CSS 类名目标

| 选择器 | 说明 |
|--------|------|
| `.react-flow__node` | 所有节点 |
| `.react-flow__node.selected` | 选中节点 |
| `.react-flow__edge` | 所有边 |
| `.react-flow__edge.selected` | 选中边 |
| `.react-flow__edge-path` | 边 SVG 路径 |
| `.react-flow__handle` | 所有 Handle |
| `.react-flow__handle-connecting` | 连接进行中的 Handle |
| `.react-flow__handle-valid` | 有效连接目标 Handle |
| `.react-flow__connection` | 进行中的连接线 |
| `.react-flow__attribution` | 归因链接 |

---

## Tailwind CSS 集成

### 配置

使用 `base.css` 避免 Tailwind 与 React Flow 默认样式冲突：

```typescript
import '@xyflow/react/dist/base.css'; // 不引入 style.css
```

### 自定义节点

```typescript
import { Handle, Position, type NodeProps } from '@xyflow/react';

function TailwindNode({ data, selected }: NodeProps) {
  return (
    <div className={`
      rounded-lg border-2 bg-white px-4 py-3 shadow-sm min-w-[120px]
      ${selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}
    `}>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-indigo-400"
      />
      <p className="text-sm font-semibold text-slate-800">{data.label}</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-indigo-400"
      />
    </div>
  );
}
```

**注意**：覆盖 React Flow 默认 Handle 样式时，Tailwind 类需加 `!` 前缀（important）。

### 实用工具类

| 类名 | 效果 |
|------|------|
| `nodrag` | 阻止节点拖拽 |
| `nowheel` | 阻止缩放（滚轮/触控板） |
| `nopan` | 阻止画布平移 |

```typescript
// 组合使用
<input className="nodrag nopan border rounded px-2 py-1" />
<div className="nodrag nowheel" style={{ overflow: 'auto', maxHeight: 150 }}>
  {/* 可滚动内容 */}
</div>
```

---

## 无障碍（Accessibility）

### 内置功能

- 节点和边支持 Tab 键聚焦
- 方向键移动选中节点
- Enter/Space 激活选中
- Escape 取消选中
- 节点获得焦点时自动平移视口（`autoPanOnNodeFocus`，v12.7+）

### 配置

```typescript
<ReactFlow
  nodesFocusable={true}         // Tab 循环聚焦节点
  edgesFocusable={true}         // Tab 循环聚焦边
  disableKeyboardA11y={false}   // 保持键盘导航
  autoPanOnNodeFocus={true}     // 节点聚焦时自动平移（v12.7+）
  ariaLabelConfig={{            // 自定义 ARIA 文本（v12.7+）
    // 参考官方文档的配置项
  }}
/>
```

### 节点 ariaLabel

```typescript
const nodes: Node[] = [
  {
    id: '1',
    data: { label: '开始' },
    position: { x: 0, y: 0 },
    ariaLabel: '流程开始节点',
    ariaRole: 'treeitem',       // v12.7+，自定义 ARIA role
  },
];
```

---

## Do / Don't

- ✅ 自定义节点/边组件用 `React.memo` 包裹。
- ✅ `nodeTypes`、`edgeTypes`、回调和 object props 都要稳定引用（组件外定义或 `useMemo`）。
- ✅ 超过 100 节点时启用 `onlyRenderVisibleElements`。
- ✅ 使用 Tailwind 时引入 `base.css` 而非 `style.css`。
- ✅ 用 CSS 变量定制主题，而非全局覆盖 CSS 类。
- ✅ 需要暗色模式时使用 `colorMode` prop，不要自己维护类名切换逻辑。
- ❌ 不要订阅完整 `nodes`/`edges` 数组，改用细粒度 hooks。
- ❌ 不要在大量节点上使用复杂 CSS 效果（阴影、模糊、动画）。
- ❌ 覆盖 React Flow Handle 默认样式时，Tailwind 类不加 `!` 会无效。
