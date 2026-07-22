'use client';

import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  reducedMotion: boolean;
}

export default function LoadingIndicator({ reducedMotion }: LoadingIndicatorProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-2 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.span
        className="inline-block w-2 h-2 bg-orange-400 rounded-full animate-bounce"
        style={{ animationDelay: reducedMotion ? '0s' : '0.2s' }}
      />
      <motion.span
        className="inline-block w-2 h-2 bg-orange-400 rounded-full animate-bounce"
        style={{ animationDelay: reducedMotion ? '0s' : '0.3s' }}
      />
      <motion.span
        className="inline-block w-2 h-2 bg-orange-400 rounded-full animate-bounce"
        style={{ animationDelay: reducedMotion ? '0s' : '0.4s' }}
      />
    </motion.div>
  );
}