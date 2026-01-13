from app.tasks.scraper import scrape_source_task, crawl_keywords_task

sources = ["Vogue", "Rolling Stone", "The New Yorker", "Stat News", "Fortune", "Variety"]
for s in sources:
    print(f"Triggering scrape for {s}...")
    scrape_source_task.delay(s)

print("Triggering keyword crawl...")
crawl_keywords_task.delay()
