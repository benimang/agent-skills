import sqlite3, os, sys
from datetime import date

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'autobeni.db')

def get_conn():
    return sqlite3.connect(DB_PATH)

def query_all():
    conn = get_conn()
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

def query_by_color(color):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT pm.id, pm.asin, b.name AS brand, c.name AS color,
               col.name AS collection, pm.price, pm.datetime
        FROM product_match pm
        JOIN brand b ON pm.brand_id = b.id
        JOIN color c ON pm.color_id = c.id
        JOIN collection col ON pm.collection_id = col.id
        WHERE c.name = ?
        ORDER BY pm.price
    """, (color,))
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def query_by_brand(brand):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT pm.id, pm.asin, b.name AS brand, c.name AS color,
               col.name AS collection, pm.price, pm.datetime
        FROM product_match pm
        JOIN brand b ON pm.brand_id = b.id
        JOIN color c ON pm.color_id = c.id
        JOIN collection col ON pm.collection_id = col.id
        WHERE b.name = ?
        ORDER BY pm.price
    """, (brand,))
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def query_by_asin(asin):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT pm.id, pm.asin, b.name AS brand, c.name AS color,
               col.name AS collection, pm.price, pm.datetime
        FROM product_match pm
        JOIN brand b ON pm.brand_id = b.id
        JOIN color c ON pm.color_id = c.id
        JOIN collection col ON pm.collection_id = col.id
        WHERE pm.asin = ?
    """, (asin,))
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def query_by_price_range(min_price, max_price):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT pm.id, pm.asin, b.name AS brand, c.name AS color,
               col.name AS collection, pm.price, pm.datetime
        FROM product_match pm
        JOIN brand b ON pm.brand_id = b.id
        JOIN color c ON pm.color_id = c.id
        JOIN collection col ON pm.collection_id = col.id
        WHERE pm.price BETWEEN ? AND ?
        ORDER BY pm.price
    """, (min_price, max_price))
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def query_competitors(asin_or_sku):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT pm.id, pm.asin, b.name AS brand, c.name AS color,
               col.name AS collection, pm.price, pm.datetime
        FROM product_match pm
        JOIN brand b ON pm.brand_id = b.id
        JOIN color c ON pm.color_id = c.id
        JOIN collection col ON pm.collection_id = col.id
        WHERE pm.collection_id = (
            SELECT p.collection_id FROM product p
            WHERE p.asin = ? OR p.sku = ?
        )
        ORDER BY b.name, c.name
    """, (asin_or_sku, asin_or_sku))
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def query_same_color(asin_or_sku):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT pm.id, pm.asin, b.name AS brand, c.name AS color,
               col.name AS collection, pm.price, pm.datetime
        FROM product_match pm
        JOIN brand b ON pm.brand_id = b.id
        JOIN color c ON pm.color_id = c.id
        JOIN collection col ON pm.collection_id = col.id
        WHERE pm.collection_id = (
            SELECT p.collection_id FROM product p
            WHERE p.asin = ? OR p.sku = ?
        )
        AND pm.color_id = (
            SELECT p.color_id FROM product p
            WHERE p.asin = ? OR p.sku = ?
        )
        ORDER BY b.name, c.name
    """, (asin_or_sku, asin_or_sku, asin_or_sku, asin_or_sku))
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def stats_by_brand():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.name AS brand, COUNT(*) AS count,
               MIN(pm.price) AS min_price,
               MAX(pm.price) AS max_price,
               ROUND(AVG(pm.price), 2) AS avg_price
        FROM product_match pm
        JOIN brand b ON pm.brand_id = b.id
        GROUP BY pm.brand_id
        ORDER BY avg_price DESC
    """)
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def stats_by_color():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.name AS color, COUNT(*) AS count,
               MIN(pm.price) AS min_price,
               MAX(pm.price) AS max_price,
               ROUND(AVG(pm.price), 2) AS avg_price
        FROM product_match pm
        JOIN color c ON pm.color_id = c.id
        GROUP BY pm.color_id
        ORDER BY count DESC
    """)
    results = cursor.fetchall()
    conn.close()
    for row in results:
        print(row)

def insert_competitor(asin, brand_id, color_id, collection_id, price):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO product_match (asin, brand_id, color_id, collection_id, price, datetime)
        VALUES (?, ?, ?, ?, ?, date('now'))
    """, (asin, brand_id, color_id, collection_id, price))
    conn.commit()
    print(f"Inserted: {asin}, price={price}")
    conn.close()

def insert_product(asin, sku, brand_id, color_id, collection_id, price):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO product (asin, sku, brand_id, color_id, collection_id, price)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (asin, sku, brand_id, color_id, collection_id, price))
    conn.commit()
    print(f"Inserted product: {asin}, sku={sku}")
    conn.close()

def update_price(id, new_price):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE product_match SET price = ? WHERE id = ?", (new_price, id))
    conn.commit()
    print(f"Updated id={id} to price={new_price}")
    conn.close()

def update_asin(id, new_asin):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE product_match SET asin = ? WHERE id = ?", (new_asin, id))
    conn.commit()
    print(f"Updated id={id} to asin={new_asin}")
    conn.close()

def delete_competitor(id):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM product_match WHERE id = ?", (id,))
    conn.commit()
    print(f"Deleted id={id}")
    conn.close()

def delete_by_asin(asin):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM product_match WHERE asin = ?", (asin,))
    conn.commit()
    print(f"Deleted asin={asin}")
    conn.close()

def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py <command> [args]")
        return

    cmd = sys.argv[1].lower()

    if cmd == 'query_all':
        query_all()
    elif cmd == 'query_by_color' and len(sys.argv) > 2:
        query_by_color(sys.argv[2])
    elif cmd == 'query_by_brand' and len(sys.argv) > 2:
        query_by_brand(sys.argv[2])
    elif cmd == 'query_by_asin' and len(sys.argv) > 2:
        query_by_asin(sys.argv[2])
    elif cmd == 'query_by_price_range' and len(sys.argv) > 3:
        query_by_price_range(float(sys.argv[2]), float(sys.argv[3]))
    elif cmd == 'query_competitors' and len(sys.argv) > 2:
        query_competitors(sys.argv[2])
    elif cmd == 'query_same_color' and len(sys.argv) > 2:
        query_same_color(sys.argv[2])
    elif cmd == 'stats_by_brand':
        stats_by_brand()
    elif cmd == 'stats_by_color':
        stats_by_color()
    elif cmd == 'insert_competitor' and len(sys.argv) > 6:
        insert_competitor(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]),
                         int(sys.argv[5]), float(sys.argv[6]))
    elif cmd == 'insert_product' and len(sys.argv) > 7:
        insert_product(sys.argv[2], sys.argv[3], int(sys.argv[4]),
                      int(sys.argv[5]), int(sys.argv[6]), float(sys.argv[7]))
    elif cmd == 'update_price' and len(sys.argv) > 3:
        update_price(int(sys.argv[2]), float(sys.argv[3]))
    elif cmd == 'update_asin' and len(sys.argv) > 3:
        update_asin(int(sys.argv[2]), sys.argv[3])
    elif cmd == 'delete_competitor' and len(sys.argv) > 2:
        delete_competitor(int(sys.argv[2]))
    elif cmd == 'delete_by_asin' and len(sys.argv) > 2:
        delete_by_asin(sys.argv[2])
    else:
        print(f"Unknown command: {cmd}")

if __name__ == '__main__':
    main()
