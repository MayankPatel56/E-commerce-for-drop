'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import LogoAnimation from './LogoAnimation';

export default function Preloader() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [prefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const hidePreloader = () => {
      if (isMounted) {
        setShowPreloader(false);
      }
    };

    // Min 0.5s (to avoid flash on fast connections)
    const minDelay = 500;
    // Max 2.2s safety cap (so it doesn't get stuck on slow connections)
    const maxDelay = 2200;

    const startTime = Date.now();

    // Wait for window load event
    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDelay - elapsed);

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(hidePreloader, remaining);
    };

    // Safety timeout - max cap
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        hidePreloader();
      }
    }, maxDelay);

    // If window is already loaded, check immediately
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(safetyTimeout);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <AnimatePresence>
      {showPreloader && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(5px)' }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
          style={{ overflow: 'hidden' }}
        >
          {/* Subtle gradient sweep - cleaner than before */}
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-yellow-400/20 via-transparent to-yellow-400/20"
            animate={{
              x: prefersReducedMotion ? '100%' : ['-100%', '200%'],
            }}
            transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
          />

          <motion.div className="relative">
            <LogoAnimation reducedMotion={prefersReducedMotion} isVisible={showPreloader} />
          </motion.div>

          {/* Clean loading text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-sm text-gray-400 font-light tracking-wider"
          >
            Loading...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}