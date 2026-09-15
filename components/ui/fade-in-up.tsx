'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface FadeInUpProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

/**
 * Animasi muncul dari bawah dengan delay sesuai urutan (index).
 *
 * Dipake di: components/shared/analytic-card.tsx.
 */
export function FadeInUp({ children, index = 0, className }: FadeInUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
