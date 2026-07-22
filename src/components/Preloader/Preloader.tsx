'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import LogoAnimation from './LogoAnimation';
import LoadingIndicator from './LoadingIndicator';

export default function Preloader() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [prefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 2800);
    return () => clearTimeout(timer);
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
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-yellow-400 to-transparent opacity-40"
            animate={{
              x: prefersReducedMotion ? '100%' : ['100%', '110%'],
            }}
            transition={{ duration: 1.5, ease: 'linear', repeat: Infinity, repeatDelay: 1 }}
          />

          <motion.div
            className="relative"
            animate={{ y: prefersReducedMotion ? 0 : [-4, 4, -4] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <LogoAnimation reducedMotion={prefersReducedMotion} isVisible={showPreloader} />
          </motion.div>

          <LoadingIndicator reducedMotion={prefersReducedMotion} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}