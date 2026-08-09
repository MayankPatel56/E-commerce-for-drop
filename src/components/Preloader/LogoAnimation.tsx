'use client';

import { motion } from 'framer-motion';

interface LogoAnimationProps {
  reducedMotion?: boolean;
  isVisible?: boolean;
}

export default function LogoAnimation({ reducedMotion }: LogoAnimationProps) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative w-24 h-24">
        {/* Rotating ring - clean spinner like app splash screens */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: '#FBBF24', // yellow-400
            borderRightColor: '#F59E0B', // amber-500
            borderBottomColor: '#FCD34D', // yellow-300
            borderLeftColor: 'transparent',
          }}
          animate={{
            rotate: reducedMotion ? 0 : 360,
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Inner subtle ring */}
        <motion.div
          className="absolute inset-1.5 rounded-full border-2 border-yellow-400/20"
          animate={{
            rotate: reducedMotion ? 0 : -360,
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Logo with gentle breathing pulse (not bobbing) */}
        <motion.div
          className="absolute inset-2.5 flex items-center justify-center"
          animate={{
            scale: reducedMotion ? 1 : [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <img
            src="/logo.png"
            alt="Indicore Originals Logo"
            className="w-12 h-12 object-contain"
          />
        </motion.div>

        {/* Soft glow behind logo */}
        <div className="absolute -inset-2 rounded-full bg-yellow-400/10 blur-xl animate-pulse" />
      </div>
    </motion.div>
  );
}