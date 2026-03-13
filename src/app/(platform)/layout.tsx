'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
