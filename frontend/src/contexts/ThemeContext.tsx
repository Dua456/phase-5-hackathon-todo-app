'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { makeAuthenticatedRequest } from '../lib/auth';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>('dark');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = () => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        // Don't run on server side
        return;
      }

      // Check for saved theme in localStorage first
      const savedTheme = localStorage.getItem('theme_preference') as 'light' | 'dark' | 'auto' | null;

      if (savedTheme) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else if (user?.theme_preference) {
        // Use theme from user profile if available
        const userTheme = user.theme_preference as 'light' | 'dark' | 'auto';
        setThemeState(userTheme);
        applyTheme(userTheme);
      } else {
        // Fallback to system preference or default
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const fallbackTheme = systemPrefersDark ? 'dark' : 'light';
        setThemeState(fallbackTheme);
        applyTheme(fallbackTheme);
      }
    };

    initializeTheme();
  }, []); // Only run on initial mount

  // Load theme preference from user profile when user changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      // Don't run on server side
      return;
    }

    const loadThemePreference = async () => {
      if (user?.id) {
        try {
          const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`);

          if (response.ok) {
            const userData = await response.json();
            const userTheme = userData.theme_preference || 'dark';

            // Update state and apply theme if it differs from current
            if (userTheme !== theme) {
              setThemeState(userTheme);
              applyTheme(userTheme);
            }
          }
        } catch (error) {
          console.error('Error loading theme preference:', error);
        }
      }
    };

    loadThemePreference();
  }, [user?.id]); // Only when user ID changes

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Don't run on server side
      return;
    }

    const html = document.documentElement;

    // Remove existing theme classes
    html.classList.remove('light', 'dark');

    let isDark: boolean;

    if (theme === 'auto') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDark = systemPrefersDark;
    } else {
      isDark = theme === 'dark';
    }

    // Apply the appropriate class
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }

    setIsDarkMode(isDark);

    // Also update localStorage for persistence
    localStorage.setItem('theme_preference', theme);
  };

  const setTheme = async (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    // Save theme preference to user profile if user is authenticated
    if (user?.id) {
      try {
        await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme_preference: newTheme,
          }),
        });
      } catch (error) {
        console.error('Error saving theme preference:', error);
        // Still keep the theme in localStorage even if API fails
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem('theme_preference', newTheme);
        }
      }
    } else {
      // If user is not authenticated, save to localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('theme_preference', newTheme);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}