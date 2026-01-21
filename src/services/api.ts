import { API_BASE_URL } from '../config/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'User-Agent': 'ProductivityAI-Mobile',
});

// Helper to handle server responses and catch HTML-error pages (like Ngrok expiration)
const handleResponse = async (response: Response) => {
  const text = await response.text();
  
  if (text.trim().startsWith('<')) {
    console.log('🛑 BLOCKED HTML RESPONSE:', text.substring(0, 200));
    throw new Error('Server Error: Endpoint returned HTML. Check your API URL and Connection.');
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

// Helper to timeout requests so the app doesn't spin forever on bad connections
const fetchWithTimeout = async (url: string, options: any = {}) => {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout: Could not reach server. Check your IP and Firewall.`);
    }
    throw error;
  }
};

export const apiService = {
  // ==========================================
  // 1. AUTHENTICATION & PROFILE
  // ==========================================

  async register(userData: any) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async login(credentials: any) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async socialLogin(data: any) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/social`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
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

  async updateUser(email: string, updates: any) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/users/${email}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // ==========================================
  // 2. AI STRATEGIST (THE BRAIN)
  // ==========================================

  // Step 1: Identify Ambiguity
  async getClarifyingQuestion(email: string, goal: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/clarify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, goal }),
    });
    return handleResponse(res);
  },

  // Step 2: Generate Command-Style Plan
  async generateAiPlan(email: string, goal: string, clarification: string = "") {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/generate-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, goal, clarification }),
      timeout: 20000, // Longer timeout for complex AI generation
    });
    return handleResponse(res);
  },

  // Step 3: Refine/Fix Task based on user "Report"
  async refineTask(email: string, taskId: string, feedback: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/refine-task`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, taskId, feedback }),
    });
    return handleResponse(res);
  },

  // ==========================================
  // 3. GOAL & TASK MANAGEMENT
  // ==========================================

  async createGoal(email: string, title: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, userEmail: email }),
    });
    return handleResponse(res);
  },

  async updateGoal(goalId: string, updates: any) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async addTasksToGoal(goalId: string, tasks: any[]) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/goals/${goalId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tasks }),
    });
    return handleResponse(res);
  },

  async updateTask(taskId: string, updates: any) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // ==========================================
  // 4. METRICS
  // ==========================================

  async getLeaderboard() {
    const res = await fetchWithTimeout(`${API_BASE_URL}/leaderboard`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  }
};