'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';

export function ThemeToggle() {
  const { theme, setTheme: setNextTheme } = useTheme();
  const setTheme = useUIStore((state) => state.setTheme);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    // Update both next-themes and UI store
    setNextTheme(newTheme);
    setTheme(newTheme);
  };

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="transition-transform duration-200 hover:scale-110"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 transition-all" />
      ) : (
        <Moon className="h-5 w-5 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
