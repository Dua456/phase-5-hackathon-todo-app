'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, isDarkMode } = useTheme();

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme as 'light' | 'dark' | 'auto');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-black/30 border border-white/20 text-white hover:bg-white/10 transition-colors"
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}