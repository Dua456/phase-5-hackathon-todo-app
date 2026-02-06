// Example frontend code for making authenticated requests to the chat API
// This demonstrates proper token handling for the /api/chat endpoint

/**
 * Makes an authenticated request to the chat API
 * @param message - The message to send to the chat API
 * @param token - The JWT token for authentication
 * @returns Promise containing the API response
 */
export async function sendChatMessage(message: string, token: string) {
  try {
    // Ensure we have a valid token
    if (!token) {
      throw new Error('No authentication token provided');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/chat?message=${encodeURIComponent(message)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // This is crucial - token must be in Authorization header
      },
      // Note: The message is passed as a query parameter in the URL, not in the request body
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error - possibly token expired
        const errorData = await response.json().catch(() => ({ detail: 'Authentication failed. Please log in again.' }));
        throw new Error(errorData.detail || 'Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Request failed: ${response.status} - ${errorData.detail || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Alternative approach using axios (if you prefer axios over fetch)
 */
export async function sendChatMessageWithAxios(message: string, token: string) {
  const axios = await import('axios').catch(() => {
    throw new Error('Axios is not available. Please install it or use fetch instead.');
  });

  try {
    const response = await axios.default.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/chat`,
      {}, // Empty body since message is in query param
      {
        params: { message }, // Send message as query parameter
        headers: {
          'Authorization': `Bearer ${token}`, // Essential for authentication
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      const errorDetail = error.response.data?.detail || 'Authentication failed. Please log in again.';
      throw new Error(errorDetail);
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. Please check your permissions.');
    } else {
      const errorMessage = error.response?.data?.detail || error.message || 'Request failed';
      throw new Error(errorMessage);
    }
  }
}

/**
 * Utility function to get token from localStorage and send chat message
 */
export async function sendAuthenticatedChatMessage(message: string) {
  // Get token from localStorage (or however you store it)
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  return sendChatMessage(message, token);
}

/**
 * Example usage in a React component:
 *
 * import { useState } from 'react';
 * import { sendAuthenticatedChatMessage } from '../lib/api-chat';
 *
 * const ChatComponent = () => {
 *   const [message, setMessage] = useState('');
 *   const [response, setResponse] = useState('');
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState('');
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     setLoading(true);
 *     setError('');
 *
 *     try {
 *       const result = await sendAuthenticatedChatMessage(message);
 *       setResponse(result.response);
 *       setMessage(''); // Clear input after successful submission
 *     } catch (err: any) {
 *       console.error('Error:', err);
 *       setError(err.message || 'An error occurred while processing your request.');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <form onSubmit={handleSubmit}>
 *         <input
 *           value={message}
 *           onChange={(e) => setMessage(e.target.value)}
 *           placeholder="Type your message..."
 *           disabled={loading}
 *         />
 *         <button type="submit" disabled={loading}>
 *           {loading ? 'Sending...' : 'Send'}
 *         </button>
 *       </form>
 *
 *       {error && <div className="error">{error}</div>}
 *       {response && <div className="response">{response}</div>}
 *     </div>
 *   );
 * };
 */

export default {
  sendChatMessage,
  sendChatMessageWithAxios,
  sendAuthenticatedChatMessage
};