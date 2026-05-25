# 迁移指南

从 `reactflow`（v11）或 `react-flow-renderer`（v10）升级到 `@xyflow/react`（v12+）的完整步骤。

## 版本对照

| 版本 | 包名 | 导入方式 |
|------|------|---------|
| v10 及以下 | `react-flow-renderer` | `import ReactFlow from 'react-flow-renderer'` |
| v11 | `reactflow` | `import ReactFlow from 'reactflow'` |
| **v12+（当前）** | `@xyflow/react` | `import { ReactFlow } from '@xyflow/react'` |

---

## 第一步：替换包

```bash
# 卸载旧包
npm uninstall reactflow
# 或：npm uninstall react-flow-renderer

# 安装新包
npm install @xyflow/react
```

**注意**：不要同时保留 `reactflow` 和 `@xyflow/react`，会导致 Zustand context 冲突（两套 React Flow 实例）。

---

## 第二步：全局替换导入

```typescript
// v11（旧）
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

// v12（新）—— 命名导出，非默认导出
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Tailwind / 自定义样式框架时使用 base.css
import '@xyflow/react/dist/base.css';
```

**全局查找替换清单**：
- `from 'reactflow'` → `from '@xyflow/react'`
- `from 'react-flow-renderer'` → `from '@xyflow/react'`
- `import ReactFlow` (默认) → `import { ReactFlow }` (命名)
- `'reactflow/dist/style.css'` → `'@xyflow/react/dist/style.css'`
- 删除所有 `@reactflow/*` 子包（`@reactflow/core`、`@reactflow/background` 等），全部合并进 `@xyflow/react`

---

## 第三步：修复节点 computed 属性

v11 直接在节点上存储 `width`、`height`、`positionAbsolute`；v12 改存到 `node.measured`：

```typescript
// v11
console.log(node.width, node.height);
console.log(node.positionAbsolute);

// v12
console.log(node.measured?.width, node.measured?.height);
console.log(node.positionAbsoluteX, node.positionAbsoluteY); // NodeProps 中

// v12 中 width/height 成为可选输入字段（用于 SSR 预设尺寸）
const node: Node = {
  id: '1',
  position: { x: 0, y: 0 },
  data: {},
  width: 150,   // 可选：提前指定尺寸（SSR/SSG 用）
  height: 50,
};
```

---

## 第四步：修复状态更新（不可变更新）

v11 容忍对象 mutation；v12 要求不可变更新：

```typescript
// v11（旧）—— mutation 可能侥幸工作
setNodes((nds) =>
  nds.map((node) => {
    node.hidden = true;   // ❌ 直接修改
    return node;
  }),
);

// v12（新）—— 必须创建新对象
setNodes((nds) =>
  nds.map((node) => ({
    ...node,
    hidden: true,         // ✅ 展开新对象
  })),
);

// v12 推荐：使用 updateNode / updateNodeData
const { updateNode, updateNodeData } = useReactFlow();
updateNode('node-1', { hidden: true });
updateNodeData('node-1', { label: '新标签' });
```

---

## 第五步：修复自定义节点 Props

```typescript
// v11（旧）
function CustomNode({ xPos, yPos }: NodeProps) {
  console.log(xPos, yPos);
}

// v12（新）
function CustomNode({ positionAbsoluteX, positionAbsoluteY }: NodeProps) {
  console.log(positionAbsoluteX, positionAbsoluteY);
}
```

---

## 第六步：修复 TypeScript 类型

v12 引入了更强大的泛型判别联合模式：

```typescript
// v11（旧）—— data 泛型直接传给 Node
import { Node } from 'reactflow';
type MyNode = Node<{ label: string; value: number }>;

// v12（新）—— 判别联合 + 类型字符串
import { type Node, type BuiltInNode } from '@xyflow/react';

type CounterNode = Node<{ count: number }, 'counter'>;
type LabelNode   = Node<{ text: string }, 'label'>;
type AppNode     = BuiltInNode | CounterNode | LabelNode;

// 应用于 hooks 和回调
const { getNodes } = useReactFlow<AppNode>();
const onNodesChange: OnNodesChange<AppNode> = useCallback(...);
```

---

## 第七步：修复重命名的 Hook 和方法

| v11 | v12 | 说明 |
|-----|-----|------|
| `useHandleConnections` | `useNodeConnections` | 重命名（旧名仍可用但已废弃） |
| `reactFlow.project()` | `reactFlow.screenToFlowPosition()` | 重命名 |
| `reactFlow.setTransform()` | `reactFlow.setViewport()` | 重命名（v10→v12） |
| `getTransformForBounds()` | `getViewportForBounds()` | 重命名 |
| `getRectOfNodes()` | `getNodesBounds()` | 重命名 |
| `getMarkerEndId()` | 已移除 | — |
| `onEdgeUpdate` | `onReconnect` | 重命名 |
| `onEdgeUpdateStart` | `onReconnectStart` | 重命名 |
| `onEdgeUpdateEnd` | `onReconnectEnd` | 重命名 |
| `updateEdge()` | `reconnectEdge()` | 工具函数重命名 |
| `node.parentNode` | `node.parentId` | 字段重命名 |
| `node.computed` | `node.measured` | 字段重命名（next.13 变更） |

v12 新增（v11 无对应）：
- `useNodesData(nodeIds)` — 细粒度订阅节点 data
- `useNodeConnections({ handleType?, handleId? })` — 订阅节点连接
- `useUpdateNodeInternals()` — 刷新动态 Handle
- `updateNode()` / `updateNodeData()` — 实例方法
- `deleteElements()` 返回已删除的节点和边
- `colorMode` prop — 明暗主题切换

---

## 第八步：修复 `node.parentNode` 引用

```typescript
// v11
{ id: 'child', parentNode: 'group-1', ... }

// v12
{ id: 'child', parentId: 'group-1', ... }
```

---

## 逐步迁移检查清单

```
□ npm uninstall reactflow && npm install @xyflow/react
□ 全局替换所有 import 来源字符串
□ 将默认导入改为命名导入（import { ReactFlow }）
□ 更新 CSS 路径
□ 删除 @reactflow/* 子包
□ 审查自定义节点 Props：xPos/yPos → positionAbsoluteX/positionAbsoluteY
□ 审查 node.width/height/positionAbsolute → node.measured.*
□ 审查 setNodes/setEdges 中的 mutation → 展开新对象
□ 更新 TypeScript 类型为判别联合模式
□ 重命名废弃 hook：useHandleConnections → useNodeConnections
□ 重命名废弃方法：project → screenToFlowPosition
□ 重命名边重连事件：onEdgeUpdate* → onReconnect*
□ 将 node.parentNode → node.parentId
□ 确认应用可渲染（排查空白画布）
```

---

## 常见迁移问题

### 空白画布

最常见原因：CSS 未更新路径，或 `reactflow` 和 `@xyflow/react` 同时安装。

```bash
# 检查是否同时安装
cat package.json | grep -E 'reactflow|@xyflow'
# 应只有 @xyflow/react
```

### Zustand context 警告

```
Warning: useStore must be used within a Provider
```

原因：安装了两个版本的包，产生两套 Zustand store。删除旧包、清除 node_modules 重装：

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 编译错误

大多数 TS 错误来自泛型变更。快速修复：

```typescript
// 临时：允许任意类型（不推荐长期使用）
const reactFlow = useReactFlow<any, any>();

// 正确：按第六步定义 AppNode / AppEdge 联合类型
```

---

## Do / Don't

- ✅ 在 `package.json` 中全局搜索 `reactflow` 和 `react-flow-renderer`，确保替换完整。
- ✅ 更新 TypeScript 泛型为新的判别联合模式，类型安全性更强。
- ✅ 检查 Zustand store 中是否存在 mutation（最常见的静默迁移错误）。
- ❌ 不要同时保留 `reactflow` 和 `@xyflow/react`。
- ❌ 不要继续使用 `@reactflow/*` 子包。
- ❌ 不要忽略 `node.measured` 变更——凡读取 `node.width/height` 的地方都要检查。
