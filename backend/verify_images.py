import sqlite3

conn = sqlite3.connect('news.db')
cur = conn.cursor()

# Check Environment section specifically
cur.execute("""
    SELECT id, title, 
           CASE 
               WHEN image_url LIKE 'data:image%' THEN 'PLACEHOLDER'
               WHEN image_url LIKE 'http%' THEN 'REAL IMAGE'
               ELSE 'NO IMAGE'
           END as image_type
    FROM articles 
    WHERE category = 'Environment'
    LIMIT 20
""")

print("=== Environment Section Image Status ===\n")
results = cur.fetchall()
placeholder_count = sum(1 for r in results if r[2] == 'PLACEHOLDER')
real_image_count = sum(1 for r in results if r[2] == 'REAL IMAGE')
no_image_count = sum(1 for r in results if r[2] == 'NO IMAGE')

print(f"Total articles checked: {len(results)}")
print(f"✅ Real images: {real_image_count}")
print(f"🎨 Placeholder images: {placeholder_count}")
print(f"❌ No images: {no_image_count}\n")

if no_image_count > 0:
    print("Articles still missing images:")
    for r in results:
        if r[2] == 'NO IMAGE':
            print(f"  - ID {r[0]}: {r[1][:60]}")

# Check all categories
print("\n=== All Categories Image Summary ===\n")
cur.execute("""
    SELECT category,
           SUM(CASE WHEN image_url LIKE 'data:image%' THEN 1 ELSE 0 END) as placeholders,
           SUM(CASE WHEN image_url LIKE 'http%' THEN 1 ELSE 0 END) as real_images,
           SUM(CASE WHEN image_url IS NULL OR image_url = '' THEN 1 ELSE 0 END) as no_images
    FROM articles
    GROUP BY category
""")

for row in cur.fetchall():
    cat, placeholders, real, none = row
    total = placeholders + real + none
    print(f"{cat:20} | Total: {total:3} | Real: {real:3} | Placeholder: {placeholders:2} | Missing: {none:2}")

conn.close()
