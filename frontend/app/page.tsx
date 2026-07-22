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

interface ArticlesResponse {
  articles?: Article[];
}

async function getArticles(category?: string): Promise<Article[]> {
  try {
    const url = new URL(API_ENDPOINTS.ARTICLES);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('limit', '20');

    const res = await fetch(url.toString(), {
      next: { revalidate: 120 },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.error('Failed to fetch articles:', res.status, res.statusText);
      return [];
    }

    const data: ArticlesResponse | Article[] = await res.json();
    return Array.isArray(data) ? data : data.articles || [];
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

async function getTrending(): Promise<{ topic: string, article_count: number }[]> {
  try {
    const res = await fetch(API_ENDPOINTS.TRENDING, {
      next: { revalidate: 300 },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return [];

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch trending topics:', error);
    return [];
  }
}

import { Suspense } from 'react';
import TrendingSidebar from '@/components/TrendingSidebar';

function CategoryRowSkeleton({ category }: { category: string }) {
  return (
    <section className="py-12 border-t border-border animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-border/40 w-48 rounded" />
        <div className="h-4 bg-border/30 w-24 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[16/10] bg-border/20 w-full" />
            <div className="h-4 bg-border/30 w-3/4 rounded" />
            <div className="h-3 bg-border/20 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

import DeviceRouter from '@/components/layouts/DeviceRouter';

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
    <DeviceRouter
      articles={articles}
      trending={trending}
      category={category}
    />
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
