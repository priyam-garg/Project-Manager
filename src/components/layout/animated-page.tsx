'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type AnimatedPageProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function AnimatedPage({ children, className, delay = 0 }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        delay,
        duration: 0.48,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('page-scaffold min-h-full', className)}
    >
      <div className="page-ambient" />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
