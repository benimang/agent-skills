# 查询模板参考

## 基础查询

### 查询所有竞品（带品牌和颜色名称）
```sql
SELECT pm.id, pm.asin, b.name AS brand, c.name AS color, pm.price, pm.datetime
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
JOIN color c ON pm.color_id = c.id
ORDER BY pm.id;
```

### 查询所有自有产品
```sql
SELECT p.id, p.asin, p.sku, b.name AS brand, c.name AS color, p.price
FROM product p
JOIN brand b ON p.brand_id = b.id
JOIN color c ON p.color_id = c.id;
```

## 筛选查询

### 按颜色筛选
| 颜色代码 | 颜色ID |
|----------|--------|
| BG | 1 |
| BK | 2 |
| BR | 3 |
| DG | 4 |
| MA | 5 |
| NB | 6 |
| SL | 7 |

```sql
-- 筛选黑色(BK)竞品
SELECT pm.asin, b.name AS brand, pm.price
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
WHERE pm.color_id = 2
ORDER BY pm.price;
```

### 按品牌筛选
```sql
-- 筛选 AKMOTOR 品牌竞品（brand_id 需查询）
SELECT pm.asin, c.name AS color, pm.price
FROM product_match pm
JOIN color c ON pm.color_id = c.id
WHERE pm.brand_id = (SELECT id FROM brand WHERE name = 'AKMOTOR')
ORDER BY pm.price;
```

### 价格区间筛选
```sql
-- 筛选 20-30 美元区间的竞品
SELECT pm.asin, b.name AS brand, pm.price
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
WHERE pm.price BETWEEN 20 AND 30
ORDER BY pm.price;
```

## 统计分析

### 各品牌竞品数量和价格统计
```sql
SELECT b.name AS brand,
       COUNT(*) AS product_count,
       MIN(pm.price) AS min_price,
       MAX(pm.price) AS max_price,
       ROUND(AVG(pm.price), 2) AS avg_price
FROM product_match pm
JOIN brand b ON pm.brand_id = b.id
GROUP BY pm.brand_id
ORDER BY product_count DESC;
```

### 各颜色竞品分布
```sql
SELECT c.name AS color_code,
       COUNT(*) AS product_count,
       ROUND(AVG(pm.price), 2) AS avg_price
FROM product_match pm
JOIN color c ON pm.color_id = c.id
GROUP BY pm.color_id
ORDER BY product_count DESC;
```

### 整体价格分布
```sql
SELECT COUNT(*) AS total_products,
       MIN(price) AS min_price,
       MAX(price) AS max_price,
       ROUND(AVG(price), 2) AS avg_price,
       ROUND(SUM(price), 2) AS total_value
FROM product_match;
```

### 价格区间分布
```sql
SELECT CASE
    WHEN price < 20 THEN '< 20'
    WHEN price BETWEEN 20 AND 25 THEN '20-25'
    WHEN price BETWEEN 25 AND 30 THEN '25-30'
    WHEN price BETWEEN 30 AND 35 THEN '30-35'
    ELSE '> 35'
END AS price_range,
COUNT(*) AS count
FROM product_match
GROUP BY price_range
ORDER BY MIN(price);
```

## 品牌对照表

| 品牌名称 | ID |
|----------|-----|
| aligongda | 1 |
| AKMOTOR | 2 |
| Autorder | 3 |
| BLIBLIUNIT | 4 |
| CARTIST | 5 |
| DBOUNE | 6 |
| DoDowny | 7 |
| FIILINES | 8 |
| HanLanKa | 9 |
| Hex Autoparts | 10 |
| o轴 | 11 |
| ORANGECMB | 12 |
| Oxvi | 13 |
| TUPGE | 14 |

## 数据操作

### 插入新竞品
```sql
INSERT INTO product_match (asin, brand_id, color_id, collection_id, price, datetime)
VALUES ('B0NEWASIN', 3, 2, 1, 29.99, date('now'));
```

### 插入自有产品
```sql
INSERT INTO product (asin, sku, brand_id, color_id, collection_id, price)
VALUES ('B0NEWASIN', 'SKU-001', 1, 2, 1, 39.99);
```

### 更新竞品价格
```sql
UPDATE product_match SET price = 32.99 WHERE id = 10;
```

### 删除竞品
```sql
DELETE FROM product_match WHERE id = 10;
```
