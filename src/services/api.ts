import { API_BASE_URL } from '../config/api';

// 1. HEADERS
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'ProductivityAI-Mobile',
  };
};

// 2. IMPROVED RESPONSE HANDLER
const handleResponse = async (response: Response) => {
  const text = await response.text();

  // Check for HTML response (Ngrok error page, 404 page, etc.)
  if (text.trim().startsWith('<')) {
    // Log the first 200 characters of the HTML to help debug
    console.log('🛑 BLOCKED HTML RESPONSE. Preview:', text.substring(0, 200));
    
    // Throw a clear error
    if (text.includes('ngrok')) {
        throw new Error('Ngrok Tunnel Error. The URL in src/config/api.ts might be expired.');
    }
    
    throw new Error(`API Error: Endpoint returned HTML instead of JSON. Check API_BASE_URL. Status: ${response.status}`);
  }

  // If response is NOT ok (like 400, 401, 500)
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      // Try to parse the backend JSON error: { error: "Invalid email..." }
      const json = JSON.parse(text);
      if (json.error) {
        errorMessage = json.error; // Use the specific message from backend
      }
    } catch (e) {
      // If parsing fails, use the raw text or status code
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return text ? JSON.parse(text) : null;
};

export const apiService = {
  // Auth
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

  // User Profile
  async getUserProfile(email: string) {
    return fetch(`${API_BASE_URL}/users/${email}`, {
      method: 'GET',
      headers: getHeaders(),
    }).then(handleResponse);
  },

  // Goals
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

  // Tasks
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

  // Leaderboard
  async getLeaderboard() {
    return fetch(`${API_BASE_URL}/leaderboard`, {
      method: 'GET',
      headers: getHeaders(),
    }).then(handleResponse);
  }
};