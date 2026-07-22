'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LogoAnimationProps {
  reducedMotion?: boolean;
  isVisible?: boolean;
}

interface Particle {
  left: number;
  top: number;
  size: number;
}

export default function LogoAnimation({ reducedMotion, isVisible }: LogoAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const generated = Array.from({ length: 6 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 4 + Math.random() * 8,
    }));
    setParticles(generated);
  }, []);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative">
        <img
          src="/logo.png"
          alt="Indicore Originals Logo"
          className="w-16 h-16 object-contain"
        />

        <div className="absolute inset-0 rounded-full bg-orange-400/30 blur-xl animate-pulse" />

        {mounted &&
          particles.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-yellow-300 opacity-40"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
              animate={
                reducedMotion ? {} : { opacity: [0.4, 1, 0.4] }
              }
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
      </div>
    </motion.div>
  );
}