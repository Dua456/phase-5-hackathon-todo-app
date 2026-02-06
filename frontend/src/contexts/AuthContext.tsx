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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';
      const response = await makeAuthenticatedRequest(`${apiUrl}/auth/me`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('Successfully fetched user profile:', userData);
      } else {
        console.error('Failed to fetch user profile:', response.status, response.statusText);
        // Log the response body for debugging
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.error('Error response body:', errorBody);
        } catch (textError) {
          console.error('Could not read error response body:', textError);
        }

        // Fallback to basic user data from token if profile fetch fails
        const token = getAuthToken();
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = parts[1];
              // Add padding if needed for base64 decoding
              let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
              const missingPadding = base64.length % 4;
              if (missingPadding !== 0) {
                base64 += '='.repeat(4 - missingPadding);
              }

              const decodedPayload = atob(base64);
              const parsedPayload = JSON.parse(decodedPayload);
              setUser({
                id: parsedPayload.sub,
                email: parsedPayload.email || '', // Use email from token if available
                provider: parsedPayload.provider || 'email',
                first_name: parsedPayload.first_name || '',
                last_name: parsedPayload.last_name || ''
              } as UserProfile);
            }
          } catch (error) {
            console.error('Token decode error:', error);
            // Set minimal user data as last resort
            setUser({
              id: 'unknown',
              email: 'Email not available',
              provider: 'unknown'
            } as UserProfile);
          }
        }
      }
    } catch (error) {
      console.error('Network error fetching user profile:', error);
      // If the request failed completely, try to decode token as fallback
      const token = getAuthToken();
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = parts[1];
            // Add padding if needed for base64 decoding
            let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const missingPadding = base64.length % 4;
            if (missingPadding !== 0) {
              base64 += '='.repeat(4 - missingPadding);
            }

            const decodedPayload = atob(base64);
            const parsedPayload = JSON.parse(decodedPayload);
            setUser({
              id: parsedPayload.sub,
              email: parsedPayload.email || '', // Use email from token if available
              provider: parsedPayload.provider || 'email',
              first_name: parsedPayload.first_name || '',
              last_name: parsedPayload.last_name || ''
            } as UserProfile);
          }
        } catch (tokenError) {
          console.error('Token decode error:', tokenError);
          // Set minimal user data as last resort
          setUser({
            id: 'unknown',
            email: 'Email not available',
            provider: 'unknown'
          } as UserProfile);
        }
      }
    }
  };

  const checkAuthStatus = async () => {
    if (isAuthenticated()) {
      const token = getAuthToken();
      if (token) {
        try {
          // First decode token to get basic user info
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = parts[1];
            // Add padding if needed for base64 decoding
            let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const missingPadding = base64.length % 4;
            if (missingPadding !== 0) {
              base64 += '='.repeat(4 - missingPadding);
            }

            const decodedPayload = atob(base64);
            const parsedPayload = JSON.parse(decodedPayload);

            // Set initial user data from token (optimistic update)
            setUser({
              id: parsedPayload.sub,
              email: '', // Will fetch from profile API
              provider: parsedPayload.provider || 'email'
            } as UserProfile);

            // Then fetch complete user profile in background without blocking
            setTimeout(async () => {
              try {
                await fetchUserProfile();
              } catch (profileError) {
                console.error('Failed to fetch profile, keeping basic token info:', profileError);
              }
            }, 0); // Non-blocking execution
          }
        } catch (error) {
          console.error('Token decode error:', error);
          setUser(null);
        }
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const refreshUserProfile = async () => {
    if (isAuthenticated()) {
      try {
        await fetchUserProfile();
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
        // Keep the basic user info from token if profile fetch fails
      }
    }
  };

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    await checkAuthStatus(); // Changed to async to ensure profile is loaded
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    // Set loading to true initially
    setLoading(true);
    checkAuthStatus();
  }, []);

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
