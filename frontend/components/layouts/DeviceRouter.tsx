'use client';
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

    const handleSelectCategory = (cat: string) => {
        const url = cat === 'Latest' ? '/' : `/?category=${encodeURIComponent(cat)}`;
        router.push(url);
    };

    if (!isHydrated) {
        // SSR Default: Render DesktopLayout cleanly during server hydration
        return <DesktopLayout articles={articles} trending={trending} category={category} />;
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
