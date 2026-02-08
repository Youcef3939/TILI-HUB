import { useEffect } from 'react';

/**
 * Hook for managing accessibility announcements
 */
export const useAccessibility = () => {
    // Create live region for announcements
    useEffect(() => {
        let liveRegion = document.getElementById('a11y-live-region');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'a11y-live-region';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        return () => {
            const region = document.getElementById('a11y-live-region');
            if (region) {
                document.body.removeChild(region);
            }
        };
    }, []);

    const announce = (message, priority = 'polite') => {
        const liveRegion = document.getElementById('a11y-live-region');
        if (liveRegion) {
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;

            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    };

    return { announce };
};

/**
 * Hook to detect if user prefers reduced motion
 */
export const useReducedMotion = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    return prefersReducedMotion.matches;
};