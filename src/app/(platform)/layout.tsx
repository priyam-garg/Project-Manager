'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();
  const pathname = usePathname();

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'relative flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300',
          sidebarOpen ? 'ml-72' : 'ml-0'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_6%_-8%,hsl(var(--primary)/0.14),transparent_40%),radial-gradient(700px_circle_at_95%_0%,hsl(var(--accent)/0.22),transparent_45%)]" />

        {/* Header */}
        <Header />

        {/* Page Content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(5px)' }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 overflow-auto soft-scrollbar"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
