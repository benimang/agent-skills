---
name: autobeni-db
description: 当用户提到 autobeni 数据库、竞品监控、亚马逊汽车配件数据查询，或需要查询/更新 autobeni.db 数据库时使用此技能。包括：查看竞品价格、按品牌/颜色筛选竞品、统计分析竞品数据、添加/修改/删除竞品或自有产品。数据库位于当前工作目录下 autobeni.db
---

# autobeni-db

管理 autobeni.db SQLite 数据库的技能，用于竞品监控数据的查询和更新。

## 运行环境

**操作系统**: Windows
**Shell**: PowerShell 5.1
**数据库**: SQLite（通过 Python sqlite3 模块访问）
**数据库路径**: `autobeni.db`（当前工作目录下）

## 执行策略

**强制使用 Python 脚本执行所有数据库操作**。禁止通过 sqlite3 CLI 在 shell 中直接执行 SQL。

### 操作流程

1. **生成脚本**：将 SQL 操作写入临时 Python 脚本，存放在 `.py/` 目录下
2. **执行脚本**：通过 `python .py/<script_name>.py [args]` 执行
3. **展示结果**：读取脚本输出并格式化展示给用户

### 脚本目录

```
C:\projects\autobeni\.py\    # 临时脚本存放目录（执行时自动创建）
```

### 执行示例

```python
# .py/query_all.py
import sqlite3, sys, os

db_path = os.path.join(os.path.dirname(__file__), '..', 'autobeni.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
    SELECT pm.id, pm.asin, b.name AS brand, c.name AS color,
           col.name AS collection, pm.price, pm.datetime
    FROM product_match pm
    JOIN brand b ON pm.brand_id = b.id
    JOIN color c ON pm.color_id = c.id
    JOIN collection col ON pm.collection_id = col.id
    ORDER BY pm.id
""")
results = cursor.fetchall()
conn.close()

for row in results:
    print(row)
```

```powershell
# 执行命令
python .py/query_all.py
```

### 参数传递

脚本通过 `sys.argv[1:]` 接收查询条件：

```python
# .py/query_by_color.py
import sys
color = sys.argv[1] if len(sys.argv) > 1 else 'BK'
```

```powershell
python .py/query_by_color.py BK
```

### 禁止事项

- **禁止**在 PowerShell 中直接运行 `sqlite3 autobeni.db "SELECT ..."`
- **禁止**在 bash/powershell 中直接执行多行 SQL 语句
- 所有数据库操作必须通过 Python 脚本执行

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

所有脚本使用以下连接方式：

```python
import sqlite3, os

db_path = os.path.join(os.path.dirname(__file__), '..', 'autobeni.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
```

> 注意：临时脚本存放在 `.py/` 目录，因此使用 `os.path.dirname(__file__)` 配合 `'..'` 定位到项目根目录的 `autobeni.db`

## 查询操作

### 查看所有竞品
```sql
SELECT pm.id, pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
ORDER BY pm.id;
```
<!-- 执行：python .py/query_all.py -->

### 按颜色筛选竞品
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE c.name = 'BK'
ORDER BY pm.price;
```
<!-- 执行：python .py/query_by_color.py BK -->

### 按品牌筛选竞品
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE b.name = 'AKMOTOR'
ORDER BY pm.price;
```
<!-- 执行：python .py/query_by_brand.py AKMOTOR -->

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
<!-- 执行：python .py/stats_by_brand.py -->

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
<!-- 执行：python .py/stats_by_color.py -->

### 查找特定ASIN
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE pm.asin = 'B0DFCLW3N4';
```
<!-- 执行：python .py/query_by_asin.py B0DFCLW3N4 -->

### 价格区间筛选
```sql
SELECT pm.asin, b.name AS brand, c.name AS color, pm.price
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
WHERE pm.price BETWEEN 25 AND 35
ORDER BY pm.price;
```
<!-- 执行：python .py/query_by_price_range.py 25 35 -->

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
<!-- 执行：python .py/query_competitors.py B0DFCLW3N4 -->

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
<!-- 执行：python .py/query_same_color.py B0DFCLW3N4 -->

## 插入操作

### 添加竞品
```sql
INSERT INTO product_match (asin, brand_id, color_id, collection_id, price, datetime)
VALUES ('B0XXXXXXX', 3, 2, 1, 29.99, date('now'));
```
<!-- 执行：python .py/insert_competitor.py B0XXXXXXX 3 2 1 29.99 -->

### 添加自有产品
```sql
INSERT INTO product (asin, sku, brand_id, color_id, collection_id, price)
VALUES ('B0XXXXXXX', 'SKU001', 1, 2, 1, 39.99);
```
<!-- 执行：python .py/insert_product.py B0XXXXXXX SKU001 1 2 1 39.99 -->

### 批量添加自有产品
从 stdin 读取多行数据，每行包含 ASIN 和 SKU，自动解析 color_id 和 collection_id。

**逻辑规则**：
- `brand_id = 1`（固定）
- `price = 99.99`（固定）
- `color_id`：SKU 用 `-` 分割后取最后一个字符串作为颜色代码，查 color 表，不存在则自动创建
- `collection_id`：SKU 去掉最后一个 `-` 及后面内容，查 collection 表，不存在则自动创建

**输入格式**：每行 `ASIN SKU`，空格分隔

```bash
# 方式1：管道输入
"B0DFCLW3N4 SKU-001-BK`nB0AAA11111 SKU-002-BK" | python .py/add_own_product.py

# 方式2：heredoc
python .py/add_own_product.py <<EOF
B0DFCLW3N4 SKU-001-BK
B0AAA11111 SKU-002-BK
EOF
```

**示例**：SKU `SKU-001-BK` → color_code = `BK`，collection_name = `SKU-001`

## 更新操作

### 更新竞品价格
```sql
UPDATE product_match SET price = 29.99 WHERE id = 5;
```
<!-- 执行：python .py/update_price.py 5 29.99 -->

### 更新竞品ASIN
```sql
UPDATE product_match SET asin = 'B0YYYYYYY' WHERE id = 5;
```
<!-- 执行：python .py/update_asin.py 5 B0YYYYYYY -->

## 删除操作

### 删除竞品
```sql
DELETE FROM product_match WHERE id = 5;
```
<!-- 执行：python .py/delete_competitor.py 5 -->

### 删除特定ASIN的竞品
```sql
DELETE FROM product_match WHERE asin = 'B0XXXXXXX';
```
<!-- 执行：python .py/delete_by_asin.py B0XXXXXXX -->

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

| 用户说 | 识别意图 | 执行的脚本 |
|--------|----------|------------|
| "查看所有竞品" | 查询全部 | `python .py/query_all.py` |
| "黑色竞品有哪些" | 按颜色筛选 | `python .py/query_by_color.py BK` |
| "AKMOTOR品牌的价格" | 按品牌筛选 | `python .py/query_by_brand.py AKMOTOR` |
| "平均价格是多少" | 聚合统计 | `python .py/stats_by_brand.py` |
| "添加一个竞品" | INSERT | `python .py/insert_competitor.py <args>` |
| "添加自己的产品" | 批量添加自有产品 | `python .py/add_own_product.py` (stdin) |
| "更新价格" | UPDATE | `python .py/update_price.py <args>` |
| "删除这条" | DELETE | `python .py/delete_competitor.py <id>` |
| "查找 B0XXXXXXX 的竞品" | ASIN识别查找竞品 | `python .py/query_competitors.py B0XXXXXXX` |
| "B0XXXXXXX 同色的竞品" | ASIN识别同色竞品 | `python .py/query_same_color.py B0XXXXXXX` |
| "SKU-XXX 的竞品有哪些" | SKU识别查找竞品 | `python .py/query_competitors.py SKU-XXX` |
| "按价格排序" | 变更排序 | 修改 ORDER BY 子句 |
| "按日期排序" | 变更排序 | 修改 ORDER BY 子句 |

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
