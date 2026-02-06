'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAuthToken, removeAuthToken, makeAuthenticatedRequest } from '@/lib/auth';

interface UserProfile {
  id: string;
  email: string;
  provider: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_login: string | null;
  profile_picture?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  theme_preference?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuthStatus: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for user profile to avoid repeated API calls
let userProfileCache: UserProfile | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchUserProfileWithRetry = async (maxRetries = 3, delay = 1000) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';
        const response = await makeAuthenticatedRequest(`${apiUrl}/auth/me`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Update cache
          userProfileCache = userData;
          cacheTimestamp = Date.now();
          console.log('Successfully fetched user profile:', userData);
          return userData;
        } else {
          console.error(`Failed to fetch user profile (attempt ${attempt + 1}/${maxRetries + 1}):`, response.status, response.statusText);
          if (attempt === maxRetries) {
            // If all retries failed, try to decode from token as fallback
            const token = getAuthToken();
            if (token) {
              try {
                const parts = token.split('.');
                if (parts.length === 3) {
                  const payload = parts[1];
                  let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                  const missingPadding = base64.length % 4;
                  if (missingPadding !== 0) {
                    base64 += '='.repeat(4 - missingPadding);
                  }

                  const decodedPayload = atob(base64);
                  const parsedPayload = JSON.parse(decodedPayload);

                  const fallbackUser = {
                    id: parsedPayload.sub,
                    email: parsedPayload.email || 'Email not available',
                    provider: parsedPayload.provider || 'email',
                    first_name: parsedPayload.first_name || parsedPayload.name || '',
                    last_name: parsedPayload.last_name || ''
                  } as UserProfile;

                  setUser(fallbackUser);
                  return fallbackUser;
                }
              } catch (tokenError) {
                console.error('Token decode error after retries:', tokenError);
              }
            }
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error(`Error fetching user profile (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

        if (attempt === maxRetries) {
          // If all retries failed, try to decode from token as fallback
          const token = getAuthToken();
          if (token) {
            try {
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = parts[1];
                let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                const missingPadding = base64.length % 4;
                if (missingPadding !== 0) {
                  base64 += '='.repeat(4 - missingPadding);
                }

                const decodedPayload = atob(base64);
                const parsedPayload = JSON.parse(decodedPayload);

                const fallbackUser = {
                  id: parsedPayload.sub,
                  email: parsedPayload.email || 'Email not available',
                  provider: parsedPayload.provider || 'email',
                  first_name: parsedPayload.first_name || parsedPayload.name || '',
                  last_name: parsedPayload.last_name || ''
                } as UserProfile;

                setUser(fallbackUser);
                return fallbackUser;
              }
            } catch (tokenError) {
              console.error('Token decode error after retries:', tokenError);
            }
          }
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt))); // Exponential backoff
        }
      }
    }
  };

  const checkAuthStatus = async () => {
    if (typeof window === 'undefined') {
      // Don't run on server side
      return;
    }

    if (isAuthenticated()) {
      const token = getAuthToken();
      if (token) {
        try {
          // Set initial user data from token (optimistic update)
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = parts[1];
            let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const missingPadding = base64.length % 4;
            if (missingPadding !== 0) {
              base64 += '='.repeat(4 - missingPadding);
            }

            const decodedPayload = atob(base64);
            const parsedPayload = JSON.parse(decodedPayload);

            // Update user with data from token immediately
            const tokenUserData = {
              id: parsedPayload.sub,
              email: parsedPayload.email || 'Email not available',
              provider: parsedPayload.provider || 'email',
              first_name: parsedPayload.first_name || parsedPayload.name || '',
              last_name: parsedPayload.last_name || ''
            } as UserProfile;

            setUser(tokenUserData);
            // Don't wait for profile fetch to complete
            setLoading(false);

            // Fetch complete profile in background without blocking
            fetchUserProfileWithRetry().catch(profileError => {
              console.error('Background profile fetch failed:', profileError);
            });
          }
        } catch (error) {
          console.error('Token decode error:', error);
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  };

  // Initialize auth state on client side only
  useEffect(() => {
    // Try to get user from cache first
    if (userProfileCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setUser(userProfileCache);
      setLoading(false);
      return;
    }

    // Try to get basic user info from token if available
    const token = getAuthToken();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = parts[1];
          let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const missingPadding = base64.length % 4;
          if (missingPadding !== 0) {
            base64 += '='.repeat(4 - missingPadding);
          }

          const decodedPayload = atob(base64);
          const parsedPayload = JSON.parse(decodedPayload);

          const tokenUser = {
            id: parsedPayload.sub,
            email: parsedPayload.email || 'Email not available',
            provider: parsedPayload.provider || 'email',
            first_name: parsedPayload.first_name || '',
            last_name: parsedPayload.last_name || ''
          } as UserProfile;

          setUser(tokenUser);

          // Fetch complete profile in background without blocking
          fetchUserProfileWithRetry().catch(profileError => {
            console.error('Background profile fetch failed:', profileError);
          });
        }
      } catch (error) {
        console.error('Token decode error during initialization:', error);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []); // Only run on client side after component mounts

  const refreshUserProfile = async () => {
    if (isAuthenticated()) {
      try {
        await fetchUserProfileWithRetry();
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    }
  };

  const login = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    // Clear cache on login
    userProfileCache = null;
    cacheTimestamp = null;
    checkAuthStatus(); // Don't await to avoid blocking
  };

  const logout = () => {
    removeAuthToken();
    // Clear cache on logout
    userProfileCache = null;
    cacheTimestamp = null;
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuthStatus, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
