import { API_BASE_URL } from '../config/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'User-Agent': 'Hezi-Mobile',
  'ngrok-skip-browser-warning': 'true',
});

const handleResponse = async (response: Response) => {
  const text = await response.text();

  if (text.trim().startsWith('<')) {
    throw new Error('Server Error: Endpoint returned HTML. Check your API URL.');
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) errorMessage = json.error;
    } catch {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return text ? JSON.parse(text) : null;
};

const fetchWithTimeout = async (url: string, options: any = {}) => {
  const { timeout = 25000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: Could not reach server.');
    }
    throw error;
  }
};

export const apiService = {
  async syncUser(userData: { email: string; name?: string; socialId?: string; provider?: string }) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async getUserProfile(email: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/users/${email}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteUser(email: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/users/${email}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async ensureProfile(userId: string, seedWeights?: Record<string, number>) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/profile/ensure`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, seedWeights }),
    });
    return handleResponse(res);
  },

  // UPDATED METHOD: Returns an array of prompts
  async getNextPrompts(profileId: string, count: number = 2) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/profile/next-prompt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ profileId, count }),
      timeout: 35000,
    });
    return handleResponse(res);
  },

  async recordSwipe(profileId: string, promptId: string, swipedLeft: boolean) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/profile/${profileId}/swipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ promptId, swipedLeft }),
    });
    return handleResponse(res);
  },

  async resetProfileWeights(profileId: string, seedWeights: Record<string, number>) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/profile/${profileId}/reset-weights`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ seedWeights }),
    });
    return handleResponse(res);
  },
};