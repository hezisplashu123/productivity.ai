import { API_BASE_URL } from '../config/api';

// 1. ROBUST HEADERS (To bypass Ngrok warning)
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // The standard bypass
    'User-Agent': 'ProductivityAI-Mobile', // Custom agent helps bypass browser detection
  };
};

// 2. SAFETY VALVE ERROR HANDLER
const handleResponse = async (response: Response) => {
  const text = await response.text();

  // CHECK: If the response looks like HTML (starts with <), it's an error page or Ngrok warning
  if (text.trim().startsWith('<')) {
    console.log('🛑 BLOCKED HTML RESPONSE (Likely Ngrok Warning):');
    // We throw a clean error instead of the raw HTML
    throw new Error('Connection Error: The server sent a warning page. Check your terminal URL.');
  }

  if (!response.ok) {
    let errorMessage = text;
    try {
      const json = JSON.parse(text);
      errorMessage = json.error || text;
    } catch (e) {
      // It wasn't JSON, use the raw text
    }
    throw new Error(errorMessage || `Request failed: ${response.status}`);
  }

  // If it's empty, return null, otherwise parse JSON
  return text ? JSON.parse(text) : null;
};

export const apiService = {
  // 1. Auth
  async register(userData: { email: string; name: string; password: string; onboardingData?: any }) {
    return fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    }).then(handleResponse);
  },

  async login(credentials: { email: string; password: string }) {
    return fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    }).then(handleResponse);
  },

  // 2. Goals
  async createGoal(email: string, title: string) {
    return fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, userEmail: email }),
    }).then(handleResponse);
  },

  async getGoals(email: string) {
    return fetch(`${API_BASE_URL}/users/${email}/goals`, {
      method: 'GET',
      headers: getHeaders(),
    }).then(handleResponse);
  },

  // 3. Tasks
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
  }
};