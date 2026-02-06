// Authentication utilities for the Todo App

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return !!token;
  }
  return false;
};

// Get the authentication token
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Set the authentication token
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

// Remove the authentication token (logout)
export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('authProvider');
  }
};

// Get the authentication provider
export const getAuthProvider = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authProvider');
  }
  return null;
};

// Get user info from token (decode JWT payload)
export const getUserFromToken = (): { sub: string; provider: string } | null => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    // Split the token to get the payload part (middle part of JWT)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const missingPadding = base64.length % 4;
    if (missingPadding !== 0) {
      base64 += '='.repeat(4 - missingPadding);
    }

    const decodedPayload = atob(base64);
    const parsedPayload = JSON.parse(decodedPayload);

    return {
      sub: parsedPayload.sub,
      provider: parsedPayload.provider || 'email'
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Make authenticated API request
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Ensure the URL uses the correct API base URL if it's a relative path
  let fullUrl = url;
  if (!url.startsWith('http')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';
    fullUrl = `${apiUrl}${url}`;
  }

  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const authenticatedOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(fullUrl, authenticatedOptions);

  // If token is expired or invalid, redirect to login
  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
};

// Login with email and password
export const loginWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      setAuthToken(data.access_token);
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error occurred' };
  }
};

// Register with email and password
export const registerWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      setAuthToken(data.access_token);
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Registration failed' };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Network error occurred' };
  }
};

// Logout
export const logout = (): void => {
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Initiate Google OAuth flow
export const initiateGoogleAuth = (): void => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';
  if (typeof window !== 'undefined') {
    window.location.href = `${apiUrl}/auth/google`;
  }
};

// Initiate GitHub OAuth flow
export const initiateGitHubAuth = (): void => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';
  if (typeof window !== 'undefined') {
    window.location.href = `${apiUrl}/auth/github`;
  }
};