# Datacom 数据驱动组件规范

Datacom 是 DCloud 定义的数据驱动组件规范，核心思想是**通过数据驱动组件渲染**，减少重复代码。uniCloud 的 `<unicloud-db>` 组件遵循此规范。

## Datacom 规范

遵循 Datacom 规范的组件有以下通用属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| where | String/Object | 查询条件 |
| field | String | 查询字段 |
| orderby | String | 排序字段 |
| page-data | String | 数据获取方式：'add'（追加）/ 'replace'（替换） |
| page-current | Number | 当前页码 |
| page-size | Number | 每页数量 |
| getcount | Boolean | 是否获取总数 |
| getpage | Boolean | 是否获取分页信息 |
| collection | String | 集合名称（unicloud-db） |

## unicloud-db 组件

`<unicloud-db>` 是 uniCloud 提供的数据驱动组件，可直接从云数据库获取数据并渲染。

### 基本用法

```html
<template>
  <unicloud-db
    v-slot:default="{ data, pagination, loading, hasMore, error }"
    collection="articles"
    :where="where"
    field="title,author,content,created_at"
    orderby="created_at desc"
    :page-size="10"
  >
    <view v-if="error">{{ error.message }}</view>
    <view v-else-if="loading">加载中...</view>
    <view v-else>
      <view v-for="item in data" :key="item._id" class="article-item">
        <text class="title">{{ item.title }}</text>
        <text class="author">{{ item.author }}</text>
      </view>
      <button @click="pagination.loadMore" :disabled="!hasMore">
        {{ hasMore ? '加载更多' : '没有更多了' }}
      </button>
    </view>
  </unicloud-db>
</template>

<script setup>
import { ref } from 'vue'
const where = ref({ status: 'published' })
</script>
```

### 插槽数据

`v-slot:default` 提供以下数据：

| 名称 | 类型 | 说明 |
|------|------|------|
| data | Array | 查询结果数据 |
| loading | Boolean | 是否正在加载 |
| error | Object | 错误信息 |
| pagination | Object | 分页操作对象 |
| hasMore | Boolean | 是否还有更多数据 |
| count | Number | 总记录数（需设置 getcount） |

### pagination 对象

```js
pagination.loadMore()    // 加载更多（追加数据）
pagination.refresh()     // 刷新（重置并重新加载）
pagination.loadMoreAndMore(count)  // 加载指定页码
```

### 增删改操作

```html
<unicloud-db
  v-slot:default="{ data, loading, pagination }"
  collection="articles"
>
  <view v-for="item in data" :key="item._id">
    <text>{{ item.title }}</text>
    <button @click="updateItem(item)">编辑</button>
    <button @click="deleteItem(item)">删除</button>
  </view>
</unicloud-db>
```

```js
import { ref } from 'vue'
import { onReady } from '@dcloudio/uni-app'

const db = uniCloud.database()
const dbCmd = db.command

// 更新
const updateItem = async (item) => {
  const collection = db.collection('articles')
  await collection.doc(item._id).update({
    title: '新标题'
  })
}

// 删除
const deleteItem = async (item) => {
  const { confirm } = await uni.showModal({ title: '确认删除' })
  if (!confirm) return
  const collection = db.collection('articles')
  await collection.doc(item._id).remove()
}
```

### 联表查询

```html
<unicloud-db
  v-slot:default="{ data, loading }"
  collection="articles,users"
  field="title,content,author{nickname,avatar},created_at"
  :where="where"
>
  <view v-for="item in data" :key="item._id">
    <text>{{ item.title }}</text>
    <image :src="item.author.avatar" />
    <text>{{ item.author.nickname }}</text>
  </view>
</unicloud-db>
```

### 与 uni-forms 结合

```html
<template>
  <view>
    <!-- 搜索表单 -->
    <uni-forms :model="searchForm">
      <uni-forms-item label="关键词">
        <uni-easyinput v-model="searchForm.keyword" />
      </uni-forms-item>
      <uni-forms-item label="分类">
        <uni-data-select
          collection="categories"
          field="_id as value, name as text"
          v-model="searchForm.categoryId"
        />
      </uni-forms-item>
    </uni-forms>

    <!-- 数据列表 -->
    <unicloud-db
      v-slot:default="{ data, loading, pagination }"
      collection="articles"
      :where="buildWhere()"
      field="title,category,created_at"
    >
      <view v-for="item in data" :key="item._id">
        <text>{{ item.title }}</text>
      </view>
    </unicloud-db>
  </view>
</template>

<script setup>
import { reactive } from 'vue'
const searchForm = reactive({ keyword: '', categoryId: '' })

const buildWhere = () => {
  const conditions = {}
  if (searchForm.keyword) {
    conditions.title = new RegExp(searchForm.keyword)
  }
  if (searchForm.categoryId) {
    conditions.category = searchForm.categoryId
  }
  return JSON.stringify(conditions)
}
</script>
```

## uni-data-select 组件

`<uni-data-select>` 是遵循 Datacom 规范的下拉选择组件，可从数据库动态获取选项。

```html
<uni-data-select
  collection="categories"
  field="_id as value, name as text"
  :where="{ status: 1 }"
  v-model="form.categoryId"
  label="分类"
  :clear="true"
/>
```

## uni-data-checkbox 组件

```html
<uni-data-checkbox
  collection="tags"
  field="_id as value, name as text"
  v-model="form.tagIds"
  mode="button"
  :multiple="true"
/>
```

## uni-data-picker 组件

```html
<uni-data-picker
  collection="areas"
  field="_id as value, name as text, parent_id as parent"
  v-model="form.areaId"
  placeholder="选择地区"
/>
```

## 注意事项

1. 需要 uniCloud 环境（阿里云或腾讯云）
2. 组件需要在 pages.json 的 easycom 中配置或自动扫描
3. where 条件支持 JSON 字符串格式
4. 联表查询时 field 字段用 `{}` 表示子查询
5. 云数据库操作需在云函数或前端安全规则允许的情况下进行
6. Datacom 组件默认启用前端直连数据库，生产环境建议使用云对象封装
