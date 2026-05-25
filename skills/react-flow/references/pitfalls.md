# 避坑指南

React Flow 开发中最常见的错误和解决方案。

## 1. 忘记引入 CSS

**症状**：节点渲染错乱、Handle 不可见、边无法点击、控件样式缺失。

**原因**：React Flow 的默认样式依赖 CSS 文件，未引入时组件结构存在但无样式。

```typescript
// ❌ 忘记引入
import { ReactFlow } from '@xyflow/react';

// ✅ 在应用入口引入（全局只需一次）
import '@xyflow/react/dist/style.css';
import { ReactFlow } from '@xyflow/react';
```

---

## 2. nodeTypes / edgeTypes 在组件内定义

**症状**：节点反复闪烁重建；控制台出现 "Nodes have been registered for a changed nodeType" 警告；切换节点状态时出现无限重渲染。

**原因**：每次组件渲染创建新的对象引用，React Flow 判断类型变化后卸载重挂载所有节点。

```typescript
// ❌ 错误：组件内定义，每次渲染都是新对象
function Flow() {
  const nodeTypes = { custom: CustomNode }; // 引用每次变化
  return <ReactFlow nodeTypes={nodeTypes} />;
}

// ✅ 正确：组件外定义常量
const nodeTypes = { custom: CustomNode };

function Flow() {
  return <ReactFlow nodeTypes={nodeTypes} />;
}

// ✅ 正确：动态类型时用 useMemo
function Flow({ enableSpecial }: { enableSpecial: boolean }) {
  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
      ...(enableSpecial ? { special: SpecialNode } : {}),
    }),
    [enableSpecial],
  );
  return <ReactFlow nodeTypes={nodeTypes} />;
}
```

---

## 3. 父容器无高度

**症状**：画布空白不显示；控制台报错 "ResizeObserver loop limit exceeded" 或 error code "002"。

**原因**：`<ReactFlow>` 使用 100% 宽高填充父容器，父容器高度为 0 时画布尺寸为零。

```typescript
// ❌ 父容器无高度
<div>
  <ReactFlow nodes={nodes} edges={edges} />
</div>

// ✅ 父容器有明确高度
<div style={{ width: '100%', height: '100vh' }}>
  <ReactFlow nodes={nodes} edges={edges} />
</div>

// ✅ CSS 类方案
// .flow-container { width: 100%; height: 600px; }
<div className="flow-container">
  <ReactFlow nodes={nodes} edges={edges} />
</div>
```

---

## 4. 在 ReactFlow 外使用 useReactFlow

**症状**：运行时报错 "Invariant failed: Could not find React Flow context"。

**原因**：`useReactFlow()` 必须在 `<ReactFlow />` 的子组件中调用，或在 `<ReactFlowProvider>` 内。

```typescript
// ❌ 错误：在 ReactFlow 外使用
function Sidebar() {
  const { fitView } = useReactFlow(); // Error!
  return <button onClick={() => fitView()}>适应视口</button>;
}

function App() {
  return (
    <div>
      <Sidebar />
      <ReactFlow ... />
    </div>
  );
}

// ✅ 正确：包裹 ReactFlowProvider
function App() {
  return (
    <ReactFlowProvider>
      <Sidebar />         {/* 现在可以使用 useReactFlow */}
      <ReactFlow ... />
    </ReactFlowProvider>
  );
}
```

---

## 5. 节点内可交互元素触发拖拽

**症状**：在节点内的输入框输入时，节点跟着拖动；点击按钮时节点移动。

**原因**：鼠标事件冒泡到 React Flow 的拖拽处理器。

```typescript
// ❌ 输入框会触发节点拖拽
<div>
  <input type="text" />
  <button>点击</button>
</div>

// ✅ 添加 nodrag 类名阻止拖拽
<div>
  <input type="text" className="nodrag" />
  <button className="nodrag nopan">点击</button>
  {/* nopan 同时阻止画布平移 */}
</div>
```

---

## 6. 动态 Handle 后位置错误

**症状**：动态添加/删除 Handle 后，连接点位置与实际 Handle 位置不符；已有边连接到错误位置。

**原因**：React Flow 缓存了 Handle 的布局信息，动态变化后需手动通知刷新。

```typescript
// ❌ 忘记调用 updateNodeInternals
function DynamicNode({ id, data }: NodeProps) {
  const [count, setCount] = useState(1);

  const addHandle = () => setCount(c => c + 1); // Handle 位置会错误！

  return <div>...</div>;
}

// ✅ 变更后调用 updateNodeInternals
function DynamicNode({ id, data }: NodeProps) {
  const [count, setCount] = useState(1);
  const updateNodeInternals = useUpdateNodeInternals();

  const addHandle = () => {
    const newCount = count + 1;
    setCount(newCount);
    // 通知 React Flow 重新计算 Handle 位置
    updateNodeInternals(id);
  };

  return <div>...</div>;
}
```

---

## 7. SSR 报错（Next.js 等）

**症状**：构建或运行时报错 "window is not defined" 或 "document is not defined"。

**原因**：React Flow 访问浏览器专属 API，在 SSR 环境中无法执行。

```typescript
// ✅ Next.js App Router
import dynamic from 'next/dynamic';

const Flow = dynamic(() => import('./Flow'), {
  ssr: false,
  loading: () => <div>加载中...</div>,
});

// ✅ Next.js Pages Router
export default function Page() {
  return <Flow />;
}
```

---

## 8. fitView 在初始化前调用无效

**症状**：`fitView()` 调用后无任何效果；节点不在视口中心。

**原因**：视口尚未初始化时 `fitView` 是空操作。

```typescript
// ❌ 在 useEffect 中直接调用（视口可能未就绪）
useEffect(() => {
  fitView(); // 可能无效
}, []);

// ✅ 监听 viewportInitialized
const { viewportInitialized, fitView } = useReactFlow();

useEffect(() => {
  if (viewportInitialized) {
    fitView({ duration: 300 });
  }
}, [viewportInitialized, fitView]);

// ✅ 或使用 ReactFlow 的 fitView prop（首次渲染后自动执行）
<ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.2 }} />
```

---

## 9. 边的 sourceHandle / targetHandle 不匹配

**症状**：边连接到节点但位置错误；控制台出现 Handle 找不到的警告。

**原因**：边的 `sourceHandle` / `targetHandle` 值与节点中 Handle 的 `id` 不一致。

```typescript
// ❌ Handle id 与边的 sourceHandle 不一致
<Handle type="source" position={Position.Right} id="output" />

const edge = { source: 'node-1', target: 'node-2', sourceHandle: 'out' }; // 不匹配！

// ✅ 确保 id 一致
<Handle type="source" position={Position.Right} id="output" />

const edge = { source: 'node-1', target: 'node-2', sourceHandle: 'output' }; // 匹配
```

---

## 10. 混用 v11 和 v12 API

**症状**：TypeScript 编译报错；运行时节点类型不符；某些事件/方法不存在。

**原因**：`reactflow`（v11）和 `@xyflow/react`（v12）有多处破坏性变更。

**主要差异：**

| 功能 | v11 (`reactflow`) | v12 (`@xyflow/react`) |
|------|------|------|
| 包名 | `reactflow` | `@xyflow/react` |
| Node 数据类型 | `Record<string, unknown>` | 泛型 `Node<TData, TType>` |
| 更新节点数据 | 手动 `setNodes` 遍历 | `updateNode` / `updateNodeData` |
| 边重连 | `onEdgeUpdate` | `onReconnect` |
| 细粒度 hooks | 无 | `useNodesData`, `useNodeConnections` 等 |

```typescript
// ❌ 混用
import { ReactFlow } from 'reactflow';         // v11 包
import { useReactFlow } from '@xyflow/react';   // v12 包

// ✅ 统一使用 v12
import { ReactFlow, useReactFlow } from '@xyflow/react';
```
