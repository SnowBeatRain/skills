# 结果集映射

跨宿主 SQLite wrapper 最大的差异之一是结果集形态：有的返回数组对象，有的返回 cursor，有的区分 column type，有的把整数、BLOB、NULL 映射得不稳定。设计 Adapter 时必须显式定义映射规则。

## 推荐返回形态

查询接口返回结构化对象：

```ts
export interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  columns?: string[]
  elapsedMs?: number
}

export interface ExecuteResult {
  rowsAffected: number
  lastInsertRowid?: number | string
  elapsedMs?: number
}
```

大结果集不要默认无限返回。提供 `LIMIT`、游标分页、keyset pagination 或流式/迭代能力。

## 类型映射

| SQLite storage class | 常见宿主值 | 建议 |
|---|---|---|
| NULL | `null` | 不要转成空字符串 |
| INTEGER | number / bigint / string | 超过 JS 安全整数时返回 string 或显式 bigint |
| REAL | number | 金额和高精度小数不要依赖 REAL |
| TEXT | string | 约定时间、JSON、枚举格式 |
| BLOB | Uint8Array / ArrayBuffer / base64 | API 文档必须写清楚 |

## 列名冲突

JOIN 查询中避免重复列名覆盖：

```sql
SELECT
  users.id AS user_id,
  users.name AS user_name,
  orders.id AS order_id
FROM users
JOIN orders ON orders.user_id = users.id;
```

Adapter 不应静默覆盖同名列。若 wrapper 只能返回对象，应要求 SQL 使用 alias。

## 时间字段

移动端和同步场景推荐统一以下之一：

- `INTEGER` epoch milliseconds：排序、比较和增量同步简单。
- `TEXT` ISO-8601 UTC：可读性好，但必须统一时区和格式。

不要混用本地时区字符串、秒级时间戳和毫秒级时间戳。

## JSON 字段

JSON 字段适合扩展信息，不适合替代核心 schema。需要查询、排序、过滤、约束的字段应独立成列。使用 JSON1/JSONB 前必须能力探测。

