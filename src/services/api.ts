import { API_BASE_URL } from '../config/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'User-Agent': 'Hezi-Mobile',
  'ngrok-skip-browser-warning': 'true',
});

const handleResponse = async (response: Response) => {
  const text = await response.text();
  
  if (text.trim().startsWith('<')) {
    console.error('🛑 BLOCKED HTML RESPONSE:', text.substring(0, 200));
    throw new Error('Server Error: Endpoint returned HTML. Check your API URL and Connection.');
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) {
        // We include the status code in the message so AppContext can catch it
        errorMessage = `[${response.status}] ${json.error}`;
        if (json.details) {
          errorMessage += ` | Details: ${json.details}`;
        }
      }
    } catch (e) {
      errorMessage = text || errorMessage;
    }
    console.error("❌ API ERROR:", errorMessage);
    throw new Error(errorMessage);
  }
  return text ? JSON.parse(text) : null;
};

const fetchWithTimeout = async (url: string, options: any = {}) => {
  const { timeout = 25000 } = options; 
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
      throw new Error(`Timeout: Could not reach server. Check your internet connection.`);
    }
    throw error;
  }
};

export const apiService = {
  async syncUser(userData: any) {
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

  async updateUser(email: string, updates: any) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/users/${email}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
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

  // --- SOCIAL FEATURES ---
  async getLeaderboard(mode: 'global' | 'friends' = 'global', userId?: string) {
    let url = `${API_BASE_URL}/leaderboard?mode=${mode}`;
    if (userId) url += `&userId=${userId}`;
    
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getPublicProfile(id: string, viewerId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/social/profile/${id}?viewerId=${viewerId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async toggleFollow(followerId: string, followingId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/social/follow`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ followerId, followingId }),
    });
    return handleResponse(res);
  },

  async reportUser(reporterId: string, reportedUserId: string, reason: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/social/report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reporterId, reportedUserId, reason }),
    });
    return handleResponse(res);
  },

  async searchUsers(query: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getFriends(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/social/friends/${userId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getFriendRequests(userId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/social/requests/${userId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async respondToRequest(requestId: string, action: 'accept' | 'decline') {
    const res = await fetchWithTimeout(`${API_BASE_URL}/social/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ requestId, action }),
    });
    return handleResponse(res);
  },

  // --- GAME SESSIONS ---
  async createSession(hostId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/session/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ hostId }),
    });
    return handleResponse(res);
  },

  async joinSession(roomCode: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/session/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roomCode }),
    });
    return handleResponse(res);
  },

  async getNextPrompt(sessionId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/session/next-prompt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId }),
      timeout: 35000,
    });
    return handleResponse(res);
  },

  async recordSwipe(sessionId: string, promptId: string, swipedLeft: boolean) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/session/${sessionId}/swipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ promptId, swipedLeft }),
    });
    return handleResponse(res);
  },

  async boostCategory(sessionId: string, category: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/session/${sessionId}/more-like-this`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ category }),
    });
    return handleResponse(res);
  },

  async pivotSession(sessionId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/session/${sessionId}/pivot`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return handleResponse(res);
  },

  // --- Legacy AI & Goals (deprecated; kept for profile compatibility) ---
  async analyzeGoal(goal: string, clarification: string = "", question: string = "") {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/analyze-goal`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ goal, clarification, question }),
    });
    return handleResponse(res);
  },

  async getClarifyingQuestion(email: string, goal: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/clarify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, goal }),
    });
    return handleResponse(res);
  },

  async generateAiPlan(email: string, goal: string, clarification: string = "", dailyMinutes: number = 0) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/generate-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, goal, clarification, dailyMinutes }),
      timeout: 30000, 
    });
    return handleResponse(res);
  },

  async refineTask(email: string, taskId: string, feedback: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/refine-task`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, taskId, feedback }),
    });
    return handleResponse(res);
  },

  async generateDailyPlan(email: string, goalTitle: string, dayNumber: number, totalDays: number, dailyMinutes: number) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/daily-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, goalTitle, dayNumber, totalDays, dailyMinutes }),
    });
    return handleResponse(res);
  },

  // --- GOALS & TASKS ---
  async createGoal(email: string, title: string, type: string = 'project', targetDate?: Date, dailyMinutes: number = 45) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, userEmail: email, type, targetDate, dailyMinutes }),
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

  async deleteGoal(goalId: string) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'DELETE',
      headers: getHeaders(),
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
};