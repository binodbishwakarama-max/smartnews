'use client';
import { useSyncExternalStore, useState, useEffect } from 'react';

export type DeviceTier = 'mobile' | 'tablet' | 'desktop';

function subscribe(callback: () => void) {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('resize', callback, { passive: true });
    return () => window.removeEventListener('resize', callback);
}

function getSnapshot(): DeviceTier {
    if (typeof window === 'undefined') return 'mobile';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w >= 768 && w < 1024) return 'tablet';
    return 'desktop';
}

function getServerSnapshot(): DeviceTier {
    // Default server snapshot to 'mobile' (90% of traffic is mobile)
    return 'mobile';
}

export function useViewport() {
    const device = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return {
        device,
        isMobile: device === 'mobile',
        isTablet: device === 'tablet',
        isDesktop: device === 'desktop',
        isHydrated
    };
}
