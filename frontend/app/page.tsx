import { NewsCard } from '@/components/EditorialComponents';
import ArticleFeed from '@/components/ArticleFeed';
import ForYouFeed from '@/components/ForYouFeed';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/config';

export interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  url: string;
  image_url: string;
  category: string;
  source: string;
  publish_date: string;
  quality_score?: number;
  feed_score?: number;
  other_sources?: {
    id: number;
    source: string;
    url: string;
    title: string;
    quality_score: number;
  }[];
}

const CATEGORIES = ['World', 'Business', 'Technology', 'AI & Startups', 'Science', 'Health', 'Politics', 'Culture', 'Sports', 'Environment', 'Education'];

import { apiRequest } from '@/lib/api';

interface ArticlesResponse {
  articles?: Article[];
}

async function getArticles(category?: string): Promise<Article[]> {
  try {
    const url = new URL(API_ENDPOINTS.ARTICLES);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('limit', '20');

    const data = await apiRequest<ArticlesResponse | Article[]>(url.toString(), {
      next: { revalidate: 120 },
    });

    return Array.isArray(data) ? data : data.articles || [];
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

async function getTrending(): Promise<{ topic: string, article_count: number }[]> {
  try {
    return await apiRequest<{ topic: string, article_count: number }[]>(API_ENDPOINTS.TRENDING, {
      next: { revalidate: 300 },
    });
  } catch (error) {
    console.error('Failed to fetch trending topics:', error);
    return [];
  }
}

import TrendingSidebar from '@/components/TrendingSidebar';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  // Fetch data in parallel for better performance
  const [articles, trending] = await Promise.all([
    getArticles(category),
    getTrending(),
  ]);

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
      <main className="max-w-7xl mx-auto px-6 py-10">

        {category && category !== 'For You' && (
          <div className="mb-12 border-b-4 border-black pb-4 flex justify-between items-end">
            <h2 className="text-6xl font-serif font-black tracking-tighter uppercase">{category}</h2>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">Latest Stories</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">

          <div className="flex-1 lg:max-w-4xl border-r border-border pr-12">
            {category === 'For You' ? (
              <ForYouFeed />
            ) : (
              <ArticleFeed
                initialArticles={articles}
                category={category}
                showHero={!category}
              />
            )}
          </div>

          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-12">
              <TrendingSidebar topics={trending} />

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-secondary border-b border-border pb-2">Featured Shorts</h3>
                <div className="flex flex-col divide-y divide-border">
                  {articles.slice(12, 17).map((art, idx) => (
                    <NewsCard key={art.id || idx} article={art} horizontal />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {!category && (
          <div className="mt-24 space-y-16">
            {CATEGORIES.map(cat => (
              <CategoryRow key={cat} category={cat} />
            ))}
          </div>
        )}

      </main>

      <footer className="mt-32 border-t-2 border-brand bg-card py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="col-span-1 lg:col-span-2">
            <h2 className="text-4xl font-serif font-black tracking-tighter uppercase mb-6">The Smart News<span className="text-accent">.</span></h2>
            <p className="text-secondary text-sm leading-relaxed max-w-sm">
              Next-generation journalism powered by artificial intelligence and editorial integrity.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-border pb-2">Connect</h4>
            <nav className="flex flex-col gap-4 text-sm font-medium">
              <Link href="#" className="hover:text-accent">Twitter / X</Link>
              <Link href="#" className="hover:text-accent">LinkedIn</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

async function CategoryRow({ category }: { category: string }) {
  const articles = await getArticles(category);
  if (articles.length === 0) return null;

  return (
    <section className="py-12 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-black uppercase tracking-tighter">{category}</h3>
        <Link href={`/?category=${category}`} className="text-xs font-black uppercase tracking-widest text-accent hover:underline">
          View All {category} →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {articles.slice(0, 4).map((art, idx) => (
          <NewsCard key={art.id || idx} article={art} dense />
        ))}
      </div>
    </section>
  );
}
