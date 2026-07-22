'use client';
import { useEffect } from 'react';
import { useViewport } from '../../hooks/useViewport';
import type { Article } from '../../app/page';
import MobileLayout from './MobileLayout';
import TabletLayout from './TabletLayout';
import DesktopLayout from './DesktopLayout';
import { useRouter } from 'next/navigation';

interface DeviceRouterProps {
    articles: Article[];
    trending: { topic: string; article_count: number }[];
    category?: string;
}

export default function DeviceRouter({ articles, trending, category }: DeviceRouterProps) {
    const { device, isHydrated } = useViewport();
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const auditOverflow = () => {
                const overflowing = [...document.querySelectorAll('*')].filter(
                    el => el.getBoundingClientRect().right > window.innerWidth + 1
                );
                if (overflowing.length > 0) {
                    console.warn('[Layout Audit] Horizontal overflowing elements detected:');
                    console.table(
                        overflowing.map(el => ({
                            element: el.tagName,
                            class: el.className,
                            right: el.getBoundingClientRect().right,
                            viewportWidth: window.innerWidth
                        }))
                    );
                }
            };
            const timer = setTimeout(auditOverflow, 1000);
            return () => clearTimeout(timer);
        }
    }, [device]);

    const handleSelectCategory = (cat: string) => {
        const url = cat === 'Latest' ? '/' : `/?category=${encodeURIComponent(cat)}`;
        router.push(url);
    };

    // SSR & Pre-Hydration Protection: Use CSS breakpoint containers during initial render.
    // This prevents Next.js SSR hydration mismatches that cause double-rendering or DOM text collisions.
    if (!isHydrated) {
        return (
            <>
                <div className="block md:hidden">
                    <MobileLayout
                        articles={articles}
                        category={category}
                        onSelectCategory={handleSelectCategory}
                    />
                </div>
                <div className="hidden md:block lg:hidden">
                    <TabletLayout
                        articles={articles}
                        category={category}
                    />
                </div>
                <div className="hidden lg:block">
                    <DesktopLayout
                        articles={articles}
                        trending={trending}
                        category={category}
                    />
                </div>
            </>
        );
    }

    if (device === 'mobile') {
        return (
            <MobileLayout
                articles={articles}
                category={category}
                onSelectCategory={handleSelectCategory}
            />
        );
    }

    if (device === 'tablet') {
        return (
            <TabletLayout
                articles={articles}
                category={category}
            />
        );
    }

    // Desktop Tier (1024px+)
    return (
        <DesktopLayout
            articles={articles}
            trending={trending}
            category={category}
        />
    );
}
