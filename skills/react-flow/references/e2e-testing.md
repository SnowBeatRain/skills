# E2E 测试（Playwright）

用 Playwright 对 React Flow 应用编写端到端测试：选取节点/边、拖拽交互、视口断言、连接测试。

## Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## CSS 选择器速查

### 类名选择器

| 选择器 | 元素 |
|--------|------|
| `.react-flow` | 根容器 |
| `.react-flow__viewport` | 视口（CSS transform 在此） |
| `.react-flow__pane` | 背景画布（接收点击/平移事件） |
| `.react-flow__nodes` | 节点容器 |
| `.react-flow__node` | 单个节点 |
| `.react-flow__node-default` | default 类型节点 |
| `.react-flow__node-input` | input 类型节点 |
| `.react-flow__node-output` | output 类型节点 |
| `.react-flow__node-group` | group 类型节点 |
| `.react-flow__edges` | 边容器（SVG） |
| `.react-flow__edge` | 单条边 |
| `.react-flow__edge-path` | 边 SVG 路径 |
| `.react-flow__edge-interaction` | 边的宽点击区域（不可见） |
| `.react-flow__handle` | Handle 元素 |
| `.react-flow__handle-top` | 顶部 Handle |
| `.react-flow__handle-right` | 右侧 Handle |
| `.react-flow__handle-bottom` | 底部 Handle |
| `.react-flow__handle-left` | 左侧 Handle |
| `.react-flow__connection` | 进行中的连接线 |
| `.react-flow__minimap` | MiniMap |
| `.react-flow__controls` | Controls |
| `.react-flow__background` | Background |
| `.react-flow__panel` | Panel |
| `.react-flow__node-toolbar` | NodeToolbar |
| `.react-flow__selection` | 框选矩形 |
| `.react-flow__nodesselection` | 多选框 |

### 数据属性

| 属性 | 使用在 | 示例 |
|------|--------|------|
| `data-id` | 节点、边 | `[data-id="node-1"]` |
| `data-nodeid` | Handle | `[data-nodeid="node-1"]` |
| `data-handleid` | Handle | `[data-handleid="output-a"]` |
| `data-handlepos` | Handle | `[data-handlepos="right"]` |
| `data-testid` | 自定义元素 | `[data-testid="my-node"]` |

### 常用组合选择器

```typescript
// 特定节点
page.locator('.react-flow__node[data-id="node-1"]')

// 特定边
page.locator('.react-flow__edge[data-id="edge-1-2"]')

// 节点上某个 Handle
page.locator('[data-nodeid="node-1"].react-flow__handle-bottom')

// 特定 ID 的 Handle
page.locator('[data-nodeid="node-1"][data-handleid="output-a"]')

// 所有选中节点
page.locator('.react-flow__node.selected')

// 特定节点的边点击区域
page.locator('.react-flow__edge[data-id="e1-2"] .react-flow__edge-interaction')
```

---

## 测试夹具组件

确保测试从确定性初态启动：

```typescript
// tests/fixtures/TestFlow.tsx
import { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: 'node-1', position: { x: 0,   y: 0   }, data: { label: 'Node 1' } },
  { id: 'node-2', position: { x: 250, y: 100 }, data: { label: 'Node 2' } },
  { id: 'node-3', position: { x: 250, y: 250 }, data: { label: 'Node 3' } },
];
const initialEdges: Edge[] = [
  { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
];

export default function TestFlow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)), [],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
}
```

---

## 节点测试

### 点击选中节点

```typescript
import { test, expect } from '@playwright/test';

test('点击节点后变为选中状态', async ({ page }) => {
  await page.goto('/');
  const node = page.locator('.react-flow__node[data-id="node-1"]');
  await expect(node).toBeAttached();

  await node.click();
  await expect(node).toHaveClass(/selected/);
});
```

### 拖拽移动节点

**关键**：`page.mouse.move` 必须使用 `{ steps: 5 }` 或更多步数——单步移动不会触发 React Flow 内部拖拽处理器。

```typescript
test('拖拽节点改变位置', async ({ page }) => {
  await page.goto('/');
  const node = page.locator('.react-flow__node[data-id="node-1"]');
  await expect(node).toBeAttached();

  const beforeBox = await node.boundingBox();
  expect(beforeBox).not.toBeNull();

  const cx = beforeBox!.x + beforeBox!.width  / 2;
  const cy = beforeBox!.y + beforeBox!.height / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 100, cy + 50, { steps: 5 }); // ← steps 必须 >= 5
  await page.mouse.up();

  const afterBox = await node.boundingBox();
  expect(afterBox!.x).toBeGreaterThan(beforeBox!.x);
  expect(afterBox!.y).toBeGreaterThan(beforeBox!.y);
});
```

### 键盘删除节点

```typescript
test('Backspace 删除选中节点', async ({ page }) => {
  await page.goto('/');
  const nodes = page.locator('.react-flow__node');
  await expect(nodes).toHaveCount(3);

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.keyboard.press('Backspace');

  await expect(nodes).toHaveCount(2);
});
```

---

## 边测试

### 选中边（点击交互区域）

边路径很细——点击 `.react-flow__edge-interaction`（更宽的不可见区域）更可靠：

```typescript
test('点击边选中', async ({ page }) => {
  await page.goto('/');
  const edge = page.locator('.react-flow__edge[data-id="edge-1-2"]');
  await expect(edge).toBeAttached();

  await edge.locator('.react-flow__edge-interaction').click();
  await expect(edge).toHaveClass(/selected/);
});
```

### 删除边

```typescript
test('删除选中边', async ({ page }) => {
  await page.goto('/');
  const edges = page.locator('.react-flow__edge');
  await expect(edges).toHaveCount(1);

  await page
    .locator('.react-flow__edge[data-id="edge-1-2"]')
    .locator('.react-flow__edge-interaction')
    .click();
  await page.keyboard.press('Backspace');

  await expect(edges).toHaveCount(0);
});
```

---

## 连接测试

**关键**：拖拽连接同样需要 `{ steps: 5 }`。

```typescript
test('拖拽 Handle 连接两个节点', async ({ page }) => {
  await page.goto('/');
  const edges = page.locator('.react-flow__edge');
  await expect(edges).toHaveCount(1);

  const sourceHandle = page.locator('[data-nodeid="node-1"].react-flow__handle-bottom');
  const targetHandle = page.locator('[data-nodeid="node-3"].react-flow__handle-top');

  const srcBox = await sourceHandle.boundingBox();
  const tgtBox = await targetHandle.boundingBox();

  await page.mouse.move(srcBox!.x + srcBox!.width / 2, srcBox!.y + srcBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    tgtBox!.x + tgtBox!.width  / 2,
    tgtBox!.y + tgtBox!.height / 2,
    { steps: 5 },
  );
  await page.mouse.up();

  await expect(edges).toHaveCount(2);
});

test('拖拽时连接线可见', async ({ page }) => {
  await page.goto('/');
  const sourceHandle = page.locator('[data-nodeid="node-1"].react-flow__handle-bottom');
  const srcBox = await sourceHandle.boundingBox();

  await page.mouse.move(srcBox!.x + srcBox!.width / 2, srcBox!.y + srcBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(srcBox!.x + 100, srcBox!.y + 100, { steps: 5 });

  await expect(page.locator('.react-flow__connection')).toBeVisible();

  await page.mouse.up();
});
```

---

## 视口测试

### 读取视口 transform

```typescript
async function getTransform(page: import('@playwright/test').Page) {
  return page.locator('.react-flow__viewport').evaluate((el) => {
    const matrix = new DOMMatrix(window.getComputedStyle(el).transform);
    return { x: matrix.m41, y: matrix.m42, scale: matrix.a };
  });
}
```

### 平移视口

```typescript
test('拖拽画布平移视口', async ({ page }) => {
  await page.goto('/');
  const before = await getTransform(page);

  const pane = page.locator('.react-flow__pane');
  const box  = await pane.boundingBox();
  const cx = box!.x + box!.width  / 2;
  const cy = box!.y + box!.height / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 150, cy + 100, { steps: 5 });
  await page.mouse.up();

  const after = await getTransform(page);
  expect(after.x).toBeGreaterThan(before.x);
  expect(after.y).toBeGreaterThan(before.y);
});
```

### 滚轮缩放

```typescript
test('滚轮放大视口', async ({ page }) => {
  await page.goto('/');
  const before = await getTransform(page);

  const pane = page.locator('.react-flow__pane');
  const box  = await pane.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, -200); // 负 deltaY = 放大

  await page.waitForTimeout(300); // 等待缩放动画

  const after = await getTransform(page);
  expect(after.scale).toBeGreaterThan(before.scale);
});
```

### fitView 测试

```typescript
test('fitView 使所有节点可见', async ({ page }) => {
  await page.goto('/');
  const nodes = page.locator('.react-flow__node');
  const count = await nodes.count();

  for (let i = 0; i < count; i++) {
    await expect(nodes.nth(i)).toBeVisible();
  }
});
```

---

## NodeToolbar 测试

```typescript
test('选中节点时 NodeToolbar 出现', async ({ page }) => {
  await page.goto('/');
  const toolbar = page.locator('.react-flow__node-toolbar');
  await expect(toolbar).not.toBeVisible();

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await expect(toolbar).toBeVisible();
});

test('NodeToolbar 位于节点上方', async ({ page }) => {
  await page.goto('/');
  await page.locator('.react-flow__node[data-id="node-1"]').click();

  const toolbar  = page.locator('.react-flow__node-toolbar');
  const nodeBox  = await page.locator('.react-flow__node[data-id="node-1"]').boundingBox();
  const toolBox  = await toolbar.boundingBox();

  expect(toolBox!.y + toolBox!.height).toBeLessThanOrEqual(nodeBox!.y);
});
```

---

## 等待策略

| 策略 | 场景 |
|------|------|
| `await expect(locator).toBeAttached()` | 等待元素出现在 DOM（页面加载后）|
| `await expect(locator).toBeVisible()` | 等待元素可见（如 toolbar 选中后）|
| `await expect(locator).toHaveCount(n)` | 等待精确数量（连接后边数）|
| `await expect(locator).toHaveClass(/selected/)` | 等待类名变化（点击后）|
| `page.waitForTimeout(ms)` | **最后手段**——仅用于有动画、无可观测状态变化时 |

**优先使用断言等待**（带自动重试），避免 `waitForTimeout`（慢且不稳定）：

```typescript
// ❌ 不稳定：不会自动重试
const count = await page.locator('.react-flow__node').count();
expect(count).toBe(3);

// ✅ 稳定：条件满足立即通过
await expect(page.locator('.react-flow__node')).toHaveCount(3);
```

---

## 辅助工具函数

```typescript
// 拖拽辅助
async function dragFromTo(
  page: import('@playwright/test').Page,
  from: { x: number; y: number },
  to:   { x: number; y: number },
  steps = 5,
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

// 获取元素中心点
async function getCenter(locator: import('@playwright/test').Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('元素不存在或不可见');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// 连接两个节点的 Handle
async function connectHandles(
  page: import('@playwright/test').Page,
  sourceSelector: string,
  targetSelector: string,
) {
  const src = await getCenter(page.locator(sourceSelector));
  const tgt = await getCenter(page.locator(targetSelector));
  await dragFromTo(page, src, tgt);
}
```

---

## Do / Don't

- ✅ `page.mouse.move` 必须使用 `{ steps: 5 }` 或更多——单步不触发 React Flow 拖拽处理器。
- ✅ 用 `getTransform()` + `DOMMatrix` 读取视口 transform——不要手动解析 CSS 字符串。
- ✅ 点击边时用 `.react-flow__edge-interaction`——边路径太细，直接点击不可靠。
- ✅ 测试夹具使用 `fitView`——保证节点位置与屏幕尺寸无关。
- ✅ 优先用断言等待（`toHaveCount`、`toBeVisible`）替代 `waitForTimeout`。
- ✅ 位置断言用相对比较（前后对比），不要用绝对像素值。
- ❌ 不要用 `waitForTimeout` 作为主要等待策略。
- ❌ 不要在读取 `boundingBox()` 前忘记 `await expect(...).toBeAttached()`。
- ❌ 不要直接点击 `.react-flow__edge-path`——用 `.react-flow__edge-interaction`。
