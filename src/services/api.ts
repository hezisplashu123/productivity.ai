import { API_BASE_URL } from '../config/api';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'ProductivityAI-Mobile',
  };
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  if (text.trim().startsWith('<')) {
    console.log('🛑 BLOCKED HTML RESPONSE:', text.substring(0, 200));
    throw new Error('Server Error: Endpoint returned HTML. Check API URL.');
  }
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) errorMessage = json.error;
    } catch (e) {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return text ? JSON.parse(text) : null;
};

export const apiService = {
  async register(userData: any) {
    return fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    }).then(handleResponse);
  },

  async login(credentials: any) {
    return fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    }).then(handleResponse);
  },

  async socialLogin(data: { 
    email?: string | null; 
    name?: string | null; 
    provider: 'google' | 'apple';
    socialId?: string | null;
    onboardingData?: any;
  }) {
    return fetch(`${API_BASE_URL}/auth/social`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  async getUserProfile(email: string) {
    return fetch(`${API_BASE_URL}/users/${email}`, {
      method: 'GET',
      headers: getHeaders(),
    }).then(handleResponse);
  },

  // --- NEW: Update User ---
  async updateUser(email: string, updates: any) {
    return fetch(`${API_BASE_URL}/users/${email}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    }).then(handleResponse);
  },

  async createGoal(email: string, title: string) {
    return fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, userEmail: email }),
    }).then(handleResponse);
  },

  async updateGoal(goalId: string, updates: any) {
    return fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    }).then(handleResponse);
  },

  async addTasksToGoal(goalId: string, tasks: any[]) {
    return fetch(`${API_BASE_URL}/goals/${goalId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tasks }),
    }).then(handleResponse);
  },

  async updateTask(taskId: string, updates: any) {
    return fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    }).then(handleResponse);
  },

  async getLeaderboard() {
    return fetch(`${API_BASE_URL}/leaderboard`, {
      method: 'GET',
      headers: getHeaders(),
    }).then(handleResponse);
  }
};