const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-3d8a1.up.railway.app';

// Cache for API responses to avoid duplicate requests
class ApiCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key); // Remove expired entry
    return null;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  hasPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  getPending(key: string): Promise<any> | undefined {
    return this.pendingRequests.get(key);
  }

  setPending(key: string, promise: Promise<any>): void {
    this.pendingRequests.set(key, promise);
  }

  clearPending(key: string): void {
    this.pendingRequests.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const apiCache = new ApiCache();

class ApiClient {
  private async requestWithTimeout(url: string, options: RequestInit, timeout: number = 15000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    maxRetries: number = 3
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.requestWithTimeout(url, options, 15000);

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - likely token expired
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
            throw new Error('Unauthorized - please login again');
          }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error: any) {
        lastError = error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff: wait longer between attempts
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    throw lastError;
  }

  async get<T>(endpoint: string): Promise<T> {
    // Check cache first
    const cached = apiCache.get(endpoint);
    if (cached) {
      return cached;
    }

    // Check if there's already a pending request for this endpoint
    if (apiCache.hasPending(endpoint)) {
      return apiCache.getPending(endpoint)!;
    }

    // Only proceed if we're in the browser environment
    if (typeof window === 'undefined') {
      throw new Error('API calls can only be made in browser environment');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    // Create the request promise and store it to prevent duplicate requests
    const requestPromise = this.requestWithRetry<T>(endpoint, options);
    apiCache.setPending(endpoint, requestPromise);

    try {
      const result = await requestPromise;
      // Cache successful responses
      apiCache.set(endpoint, result);
      return result;
    } finally {
      // Clean up pending request
      apiCache.clearPending(endpoint);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    // Don't cache POST requests
    // Only proceed if we're in the browser environment
    if (typeof window === 'undefined') {
      throw new Error('API calls can only be made in browser environment');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    return this.requestWithRetry<T>(endpoint, options);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    // Don't cache PUT requests
    // Only proceed if we're in the browser environment
    if (typeof window === 'undefined') {
      throw new Error('API calls can only be made in browser environment');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const options = {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    return this.requestWithRetry<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    // Don't cache PATCH requests
    // Only proceed if we're in the browser environment
    if (typeof window === 'undefined') {
      throw new Error('API calls can only be made in browser environment');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const options = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    return this.requestWithRetry<T>(endpoint, options);
  }

  async delete(endpoint: string): Promise<void> {
    // Don't cache DELETE requests
    // Only proceed if we're in the browser environment
    if (typeof window === 'undefined') {
      throw new Error('API calls can only be made in browser environment');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const options = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };

    await this.requestWithRetry<any>(endpoint, options);
  }
}

export const api = new ApiClient();

// Task-specific functions with improved error handling
export const fetchTasks = async () => {
  return api.get<any[]>('/api/tasks');
};

export const createTask = async (taskData: any) => {
  return api.post<any>('/api/tasks', taskData);
};

export const updateTask = async (taskId: string, taskData: any) => {
  return api.put<any>(`/api/tasks/${taskId}`, taskData);
};

export const deleteTask = async (taskId: string) => {
  return api.delete(`/api/tasks/${taskId}`);
};

export const toggleTaskCompletion = async (taskId: string) => {
  return api.patch<any>(`/api/tasks/${taskId}/complete`, {});
};