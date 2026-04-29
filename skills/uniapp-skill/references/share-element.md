# share-element 共享元素过渡

`<share-element>` 用于在页面切换时创建共享元素过渡动画，让列表项到详情页等场景有平滑的过渡体验。

## 基本用法

```html
<!-- 列表页 -->
<template>
  <view v-for="item in list" :key="item.id">
    <share-element :ident="item.id" class="thumb">
      <image :src="item.thumb" />
    </share-element>
    <text @click="goDetail(item)">{{ item.title }}</text>
  </view>
</template>

<script setup>
const goDetail = (item) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${item.id}&transition=share-element`
  })
}
</script>
```

```html
<!-- 详情页 -->
<template>
  <view>
    <share-element :ident="id" class="thumb-detail">
      <image :src="detail.thumb" />
    </share-element>
    <text>{{ detail.title }}</text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const id = ref('')
const detail = ref({})

onLoad((options) => {
  id.value = options.id
  // 加载详情数据
})
</script>
```

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| ident | String | 共享元素的唯一标识，两页的 ident 必须相同 |
| transition | Object | 过渡动画配置 |

## transition 配置

```html
<share-element
  :ident="item.id"
  :transition="{
    duration: 300,
    timingFunction: 'ease-in-out'
  }"
>
  <image :src="item.thumb" />
</share-element>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| duration | Number | 300 | 动画时长（ms） |
| timingFunction | String | ease-in-out | 动画缓动函数 |

## 使用要点

1. **ident 必须一致**：两个页面的 `<share-element>` 使用相同的 `ident` 值
2. **页面跳转必须用** `uni.navigateTo`，且 URL 中携带 `transition=share-element`
3. **图片等元素**：共享元素内的内容在动画过程中会从起始位置平滑过渡到目标位置
4. **数据加载**：详情页数据可能异步加载，在数据加载完成前可以先用占位内容

## 列表到详情完整示例

```html
<!-- pages/list/list.vue -->
<template>
  <scroll-view scroll-y class="list">
    <view v-for="item in list" :key="item.id" class="list-item" @click="goDetail(item)">
      <share-element :ident="item.id" class="item-thumb">
        <image :src="item.image" mode="aspectFill" />
      </share-element>
      <view class="item-info">
        <text class="item-title">{{ item.title }}</text>
        <text class="item-desc">{{ item.desc }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref } from 'vue'
const list = ref([
  { id: '1', title: '项目1', desc: '描述1', image: '/static/img1.jpg' },
  { id: '2', title: '项目2', desc: '描述2', image: '/static/img2.jpg' }
])

const goDetail = (item) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${item.id}&transition=share-element`
  })
}
</script>
```

```html
<!-- pages/detail/detail.vue -->
<template>
  <scroll-view scroll-y class="detail">
    <share-element :ident="id" class="detail-thumb">
      <image :src="detail.image" mode="aspectFill" />
    </share-element>
    <view class="detail-content">
      <text class="detail-title">{{ detail.title }}</text>
      <text class="detail-desc">{{ detail.desc }}</text>
      <text class="detail-body">{{ detail.body }}</text>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const id = ref('')
const detail = ref({})

onLoad(async (options) => {
  id.value = options.id
  const res = await uni.request({ url: `/api/detail/${options.id}` })
  detail.value = res.data
})
</script>
```

## 注意事项

1. 仅支持 App 和 H5 端，小程序不支持
2. `ident` 必须是字符串类型，且在两页间保持一致
3. 共享元素动画依赖 `uni.navigateTo` 的页面转场
4. 如果详情页数据异步加载，建议先展示骨架屏或占位图
