# UTS 结果映射

本文件自包含 UTS 插件对外返回约束：只返回可序列化 DTO，不返回 cursor、statement、connection 或平台专属对象。

## 返回结构

```ts
export interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  columns: string[]
  elapsedMs: number
}
```

## 类型约束

- NULL 返回 `null`。
- INTEGER 默认返回 number；超过安全整数范围时返回 string，并在文档注明。
- REAL 返回 number。
- TEXT 返回 string。
- BLOB 选择一种稳定格式：优先 Uint8Array/ArrayBuffer；若三端桥接不稳定，则返回 base64 并明确说明。

## UTS 边界

三端桥接时避免返回平台专属对象、cursor、statement、store。所有结果必须是可序列化 DTO。

## 大结果集

插件 API 应鼓励分页。对没有 limit 的 query，可以：

- 文档要求业务必须传 limit。
- 或提供默认最大行数并返回 truncated 标记。
- 或提供 cursor/iterator 高级接口，但三端一致性成本更高。

