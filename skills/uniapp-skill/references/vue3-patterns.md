# Vue3 开发模式与组件模式

## Composition API（推荐）

### 基本用法

```vue
<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { onLoad, onShow, onReady } from '@dcloudio/uni-app'

// 响应式数据
const count = ref(0)
const form = reactive({ name: '', age: 0 })

// 计算属性（自带缓存）
const doubleCount = computed(() => count.value * 2)

// 监听器
watch(count, (newVal, oldVal) => {
  console.log('count 变化:', newVal)
})

// 深度监听对象
watch(() => form.name, (val) => {
  console.log('name 变化:', val)
}, { immediate: true })

// Vue 生命周期
onMounted(() => { console.log('组件挂载') })

// uni-app 页面生命周期
onLoad((options) => { console.log('页面加载', options) })
onShow(() => { console.log('页面显示') })
</script>
```

### 组合式函数（Composables）

```js
// composables/useRequest.js
import { ref } from 'vue'

export function useRequest(url, options = {}) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const execute = async (params) => {
    loading.value = true
    error.value = null
    try {
      const [err, res] = await uni.request({
        url,
        method: options.method || 'GET',
        data: params
      })
      if (err) throw err
      data.value = res.data
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  if (options.immediate !== false) execute(options.params)
  return { data, loading, error, execute }
}
```

```vue
<!-- 页面中使用 -->
<script setup>
import { useRequest } from '@/composables/useRequest'
const { data: userList, loading } = useRequest('/api/users')
</script>
```

## 组件通信

### Props + Emits

```vue
<!-- 父组件 -->
<template>
  <child-comp :title="title" @update="handleUpdate" />
</template>

<!-- 子组件 child-comp.vue -->
<script setup>
const props = defineProps({
  title: { type: String, required: true }
})
const emit = defineEmits(['update'])
const handleClick = () => emit('update', { id: 1 })
</script>
```

### v-model 双向绑定

```vue
<!-- 父组件 -->
<my-input v-model="keyword" v-model:placeholder="hint" />

<!-- 子组件 my-input.vue -->
<script setup>
const props = defineProps(['modelValue', 'placeholder'])
const emit = defineEmits(['update:modelValue', 'update:placeholder'])
</script>
<template>
  <input :value="modelValue" @input="emit('update:modelValue', $event.detail.value)" />
</template>
```

### provide / inject（跨层级通信）

```js
// 祖先组件
import { provide, ref } from 'vue'
const theme = ref('light')
provide('theme', theme)

// 后代组件
import { inject } from 'vue'
const theme = inject('theme', 'light')  // 第二个参数为默认值
```

### 插槽（Slots）

```vue
<!-- 父组件 -->
<my-card>
  <template #header>标题</template>
  <template #default>内容</template>
  <template #footer="{ count }">底部 {{ count }}</template>
</my-card>

<!-- 子组件 my-card.vue -->
<template>
  <view>
    <slot name="header" />
    <slot />
    <slot name="footer" :count="itemCount" />
  </view>
</template>
```

## 模板语法要点

### 列表渲染

```vue
<template>
  <!-- v-for 必须加 :key -->
  <view v-for="(item, index) in list" :key="item.id">
    {{ index }}. {{ item.name }}
  </view>

  <!-- 对象遍历 -->
  <view v-for="(value, key) in obj" :key="key">
    {{ key }}: {{ value }}
  </view>
</template>
```

### 条件渲染

```vue
<!-- v-if：条件为假时完全移除 DOM -->
<view v-if="type === 'A'">A</view>
<view v-else-if="type === 'B'">B</view>
<view v-else>其他</view>

<!-- v-show：只切换 display（频繁切换用 v-show 更好） -->
<!-- 注意：nvue 不支持 v-show，只能用 v-if -->
<view v-show="isVisible">内容</view>
```

### Class 与 Style 绑定

```vue
<!-- 对象语法 -->
<view :class="{ active: isActive, 'text-red': hasError }">
<!-- 数组语法 -->
<view :class="[activeClass, errorClass]">
<!-- 内联样式 -->
<view :style="{ color: textColor, fontSize: size + 'rpx' }">
```

## Vue2 → Vue3 迁移要点

| Vue2 | Vue3 | 说明 |
|------|------|------|
| `new Vue({}).$mount()` | `createSSRApp(App)` | 应用创建方式 |
| `Vue.prototype.$http` | `app.config.globalProperties.$http` | 全局属性 |
| `Vue.component()` | `app.component()` | 全局组件注册 |
| `VUE_APP_*` 环境变量 | `VITE_*` 环境变量 | 前缀变化 |
| `process.env.VUE_APP_*` | `import.meta.env.VITE_*` | 访问方式 |
| `require()` | `import` | 模块系统 |
| `this.$refs` | `ref()` + template ref | 引用方式 |
| `filters` | 计算属性或方法替代 | 过滤器已移除 |
| `$on/$off/$once` | 使用外部库（mitt）或 uni.$on | 事件总线 |

### Vue3 不支持的特性（uni-app 中）

- `Teleport`（小程序无 DOM 挂载点）
- `Suspense`（实验性）
- `Proxy` 在 iOS 9 / IE11 不可用（需 Vue3 兼容模式）

## Vue 3.4+ 新特性

### defineModel（Vue 3.4+）

Vue 3.4 引入 `defineModel` 宏，大幅简化 v-model 双向绑定：

```vue
<!-- 子组件 my-input.vue（Vue 3.4+） -->
<script setup>
const modelValue = defineModel({ type: String, default: '' })
// 等价于之前的 props + emit 组合

// 多个 v-model
const checked = defineModel('checked', { type: Boolean, default: false })
</script>

<template>
  <input :value="modelValue" @input="modelValue = $event.target.value" />
</template>
```

父组件用法不变：
```vue
<my-input v-model="keyword" />
<my-checkbox v-model:checked="isChecked" />
```

### useTemplateRef（Vue 3.5+）

Vue 3.5 引入的 ref 获取方式，替代 `this.$refs`：

```vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'

const editorRef = useTemplateRef('editor')

onMounted(() => {
  editorRef.value?.format('bold', true)
})
</script>

<template>
  <editor ref="editor" />
</template>
```

### defineOptions（Vue 3.3+）

在 `<script setup>` 中定义组件选项（name、inheritAttrs 等）：

```vue
<script setup>
defineOptions({
  name: 'MyComponent',
  inheritAttrs: false  // 禁止自动继承 attrs
})
</script>
```

### defineSlots（Vue 3.3+）

为插槽提供类型提示（TypeScript 场景）：

```vue
<script setup lang="ts">
defineSlots<{
  header: { title: string }
  default: {}
  footer: { count: number }
}>()
</script>
```

### 动态组件 `<component :is="...">`

```vue
<template>
  <component :is="currentTab === 'home' ? HomeComp : SettingsComp" />
</template>
```

> **注意**：小程序端不支持动态组件，需用 `v-if`/`v-show` 替代。

### onErrorCaptured（错误边界）

```vue
<script setup>
import { onErrorCaptured, ref } from 'vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  console.error('子组件错误:', err, info)
  return false  // 阻止错误继续传播
})
</script>
```

### useId（Vue 3.5+）

生成唯一 ID，适用于无障碍标签关联等场景：

```vue
<script setup>
import { useId } from 'vue'
const id = useId()  // 如 "v-0"
</script>

<template>
  <label :id="`${id}-label`" :for="`${id}-input`">用户名</label>
  <input :id="`${id}-input`" />
</template>
```

### Vue 3.4+ 版本兼容矩阵

| 特性 | 最低版本 | uni-app 支持 |
|------|---------|-------------|
| defineOptions | 3.3.0 | HBuilderX 4.0+ |
| defineSlots | 3.3.0 | HBuilderX 4.0+ |
| defineModel | 3.4.0 | HBuilderX 4.20+ |
| useTemplateRef | 3.5.0 | 需手动确认 |
| useId | 3.5.0 | 需手动确认 |
