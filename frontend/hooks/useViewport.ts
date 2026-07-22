'use client';
import { useState, useEffect } from 'react';

export type DeviceTier = 'mobile' | 'tablet' | 'desktop';

export function useViewport() {
    const [device, setDevice] = useState<DeviceTier>('desktop');
    const [width, setWidth] = useState<number>(1280);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);

        function handleResize() {
            const currentWidth = window.innerWidth;
            setWidth(currentWidth);

            if (currentWidth < 768) {
                setDevice('mobile');
            } else if (currentWidth >= 768 && currentWidth < 1024) {
                setDevice('tablet');
            } else {
                setDevice('desktop');
            }
        }

        // Set initial viewport
        handleResize();

        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        device,
        width,
        isMobile: isHydrated && device === 'mobile',
        isTablet: isHydrated && device === 'tablet',
        isDesktop: !isHydrated || device === 'desktop',
        isHydrated
    };
}
