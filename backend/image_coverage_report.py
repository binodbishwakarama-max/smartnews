import sqlite3

conn = sqlite3.connect('news.db')
cur = conn.cursor()

print("=" * 60)
print("IMAGE COVERAGE REPORT - ALL CATEGORIES")
print("=" * 60)
print()

cur.execute("""
    SELECT category,
           COUNT(*) as total,
           SUM(CASE WHEN image_url LIKE 'http%' THEN 1 ELSE 0 END) as real_images,
           SUM(CASE WHEN image_url LIKE 'data:image%' THEN 1 ELSE 0 END) as placeholders
    FROM articles
    GROUP BY category
    ORDER BY total DESC
""")

total_articles = 0
total_with_images = 0

for row in cur.fetchall():
    cat, total, real, placeholder = row
    with_images = real + placeholder
    coverage = (with_images / total * 100) if total > 0 else 0
    
    total_articles += total
    total_with_images += with_images
    
    status = "✅" if coverage == 100 else "⚠️"
    print(f"{status} {cat:20} | {total:3} articles | {real:3} real | {placeholder:2} placeholder | {coverage:5.1f}% coverage")

print()
print("=" * 60)
overall_coverage = (total_with_images / total_articles * 100) if total_articles > 0 else 0
print(f"OVERALL: {total_with_images}/{total_articles} articles have images ({overall_coverage:.1f}% coverage)")
print("=" * 60)

conn.close()
