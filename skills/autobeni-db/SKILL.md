---
name: autobeni-db
description: 当用户提到 autobeni 数据库、竞品监控、亚马逊汽车配件数据查询，或需要查询/更新 autobeni.db 数据库时使用此技能。包括：查看竞品价格、按品牌/颜色筛选竞品、统计分析竞品数据、添加/修改/删除竞品或自有产品。数据库位于当前工作目录下 autobeni.db
---

# autobeni-db

管理 autobeni.db SQLite 数据库的技能，用于竞品监控数据的查询和更新。

## 数据库信息

**路径**: `autobeni.db`
**类型**: SQLite

## 表结构

### brand 表 (品牌表) - 14条记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 品牌唯一标识 |
| name | TEXT | 品牌名称 |

### collection 表 (产品系列表) - 1条记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 系列唯一标识 |
| name | TEXT | 系列名称 |

### color 表 (颜色表) - 7条记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 颜色唯一标识 |
| name | TEXT | 颜色代码 |

### product 表 (自有产品表) - 0条记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 产品唯一标识 |
| asin | TEXT | ASIN编码 |
| sku | TEXT | SKU编码 |
| brand_id | INTEGER | 品牌ID |
| color_id | INTEGER | 颜色ID |
| collection_id | INTEGER | 系列ID |
| price | REAL | 价格(美元) |

### product_match 表 (竞品数据表) - 34条记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 竞品唯一标识 |
| asin | TEXT | ASIN编码 |
| brand_id | INTEGER | 品牌ID |
| color_id | INTEGER | 颜色ID |
| collection_id | INTEGER | 系列ID |
| price | REAL | 价格(美元) |
| datetime | DATE | 抓取日期 |

## 颜色代码对照

| ID | 代码 | 中文 |
|----|------|------|
| 1 | BG | Beige/米色 |
| 2 | BK | Black/黑色 |
| 3 | BR | Brown/棕色 |
| 4 | DG | Dark Gray/灰色 |
| 5 | MA | Maroon/红色 |
| 6 | NB | Navy Blue/蓝色 |
| 7 | SL | Silver/银色 |

## 连接数据库

```python
import sqlite3

db_path = 'autobeni.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
```

## 查询操作

### 查看所有竞品
```sql
SELECT pm.id, pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
ORDER BY pm.id;
```

### 按颜色筛选竞品
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE c.name = 'BK'
ORDER BY pm.price;
```

### 按品牌筛选竞品
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE b.name = 'AKMOTOR'
ORDER BY pm.price;
```

### 价格统计（按品牌）
```sql
SELECT b.name AS brand, COUNT(*) AS count, 
       MIN(pm.price) AS min_price, 
       MAX(pm.price) AS max_price, 
       ROUND(AVG(pm.price), 2) AS avg_price
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
GROUP BY pm.brand_id
ORDER BY avg_price DESC;
```

### 价格统计（按颜色）
```sql
SELECT c.name AS color, COUNT(*) AS count,
       MIN(pm.price) AS min_price,
       MAX(pm.price) AS max_price,
       ROUND(AVG(pm.price), 2) AS avg_price
FROM product_match pm
JOIN color c ON pm.color_id = c.id
GROUP BY pm.color_id
ORDER BY count DESC;
```

### 查找特定ASIN
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE pm.asin = 'B0DFCLW3N4';
```

### 价格区间筛选
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE pm.price BETWEEN 25 AND 35
ORDER BY pm.price;
```

### 查找竞品（通过 ASIN/SKU，匹配 collection_id，默认全部颜色，按品牌+颜色排序）
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, col.name AS collection, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
JOIN collection col ON pm.collection_id = col.id
WHERE pm.collection_id = (
    SELECT p.collection_id FROM product p WHERE p.asin = 'B0DFCLW3N4' OR p.sku = 'SKU-XXX'
)
ORDER BY b.name, c.name;
```

### 查找同色竞品（通过 ASIN/SKU，匹配 collection_id + color_id，按品牌+颜色排序）
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, col.name AS collection, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
JOIN collection col ON pm.collection_id = col.id
WHERE pm.collection_id = (
    SELECT p.collection_id FROM product p WHERE p.asin = 'B0DFCLW3N4' OR p.sku = 'SKU-XXX'
)
AND pm.color_id = (
    SELECT p.color_id FROM product p WHERE p.asin = 'B0DFCLW3N4' OR p.sku = 'SKU-XXX'
)
ORDER BY b.name, c.name;
```

## 插入操作

### 添加竞品
```sql
INSERT INTO product_match (asin, brand_id, color_id, collection_id, price, datetime)
VALUES ('B0XXXXXXX', 3, 2, 1, 29.99, date('now'));
```

### 添加自有产品
```sql
INSERT INTO product (asin, sku, brand_id, color_id, collection_id, price)
VALUES ('B0XXXXXXX', 'SKU001', 1, 2, 1, 39.99);
```

## 更新操作

### 更新竞品价格
```sql
UPDATE product_match SET price = 29.99 WHERE id = 5;
```

### 更新竞品ASIN
```sql
UPDATE product_match SET asin = 'B0YYYYYYY' WHERE id = 5;
```

## 删除操作

### 删除竞品
```sql
DELETE FROM product_match WHERE id = 5;
```

### 删除特定ASIN的竞品
```sql
DELETE FROM product_match WHERE asin = 'B0XXXXXXX';
```

## 输出格式

查询结果使用表格形式展示：
```
┌──────────────┬──────────┬───────┬───────────┬────────┬────────────┐
│    ASIN      │  品牌    │ 颜色  │  系列     │ 价格   │   日期     │
├──────────────┼──────────┼───────┼───────────┼────────┼────────────┤
│ B0DFCLW3N4   │ AKMOTOR  │  BK   │ Classic   │ 28.88  │ 2026-05-21 │
└──────────────┴──────────┴───────┴───────────┴────────┴────────────┘
```

竞品查询输出字段：ASIN | 品牌 | 颜色 | 系列 | 价格 | 日期

## 常见对话模式

| 用户说 | 识别意图 | 执行的SQL |
|--------|----------|-----------|
| "查看所有竞品" | 查询全部 | SELECT * FROM product_match |
| "黑色竞品有哪些" | 按颜色筛选 | WHERE color_id = 2 |
| "AKMOTOR品牌的价格" | 按品牌筛选 | WHERE brand_id = ? |
| "平均价格是多少" | 聚合统计 | AVG(price) |
| "添加一个竞品" | INSERT | INSERT INTO |
| "更新价格" | UPDATE | UPDATE ... SET |
| "删除这条" | DELETE | DELETE FROM |
| "查找 B0XXXXXXX 的竞品" | ASIN识别查找竞品 | WHERE collection_id 子查询 |
| "B0XXXXXXX 同色的竞品" | ASIN识别同色竞品 | WHERE collection_id + color_id 子查询 |
| "SKU-XXX 的竞品有哪些" | SKU识别查找竞品 | WHERE collection_id 子查询 |
| "按价格排序" | 变更排序 | ORDER BY price |
| "按日期排序" | 变更排序 | ORDER BY datetime DESC |

## ASIN/SKU 识别规则

| 格式 | 特征 | 示例 |
|------|------|------|
| ASIN | `B` 开头 + 10位字母数字 | `B0DFCLW3N4` |
| SKU | 包含 `-`，较长 | `SKU-001-XXX` |

## 竞品查询逻辑

当用户查找竞品时，执行以下逻辑：
1. 从 `product` 表中通过 ASIN 或 SKU 找到对应产品的 `collection_id`
2. 用该 `collection_id` 在 `product_match` 表中查找匹配记录
3. 默认返回全部颜色，除非用户明确指定"同色"
4. 默认按 `brand → color` 排序，除非用户指定其他排序规则

## 注意事项

1. 插入数据前确认 brand_id、color_id、collection_id 是否存在
2. ASIN 字段在 product 和 product_match 表中有唯一索引
3. datetime 使用 `date('now')` 获取当前日期
4. 价格字段为 REAL 类型，SQLite 会自动处理精度
