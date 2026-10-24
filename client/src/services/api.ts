import {
  User,
  TrainingTask,
  AthleteVitals,
  ReadinessAssessment,
  Tournament,
  Notification,
  Message,
  Achievement,
  PerformanceRecord
} from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      errorMsg = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  getDemoUsers: () => request<{ users: User[] }>('/auth/demo-users'),
  login: (credentials: { email: string; password?: string; role?: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: any) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: (userId: string) => request<{ user: User }>(`/auth/me/${userId}`),

  // Coach
  getCoachDashboard: (coachId: string) => request<any>(`/coach/${coachId}/dashboard`),
  getCoachAthletes: (coachId: string) => request<{ athletes: any[] }>(`/coach/${coachId}/athletes`),
  addAthlete: (coachId: string, data: any) =>
    request<{ athlete: any }>(`/coach/${coachId}/athletes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAthlete: (coachId: string, athleteId: string, data: any) =>
    request<{ success: boolean; message: string }>(`/coach/${coachId}/athletes/${athleteId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAthlete: (coachId: string, athleteId: string) =>
    request<{ success: boolean; message: string }>(`/coach/${coachId}/athletes/${athleteId}`, {
      method: 'DELETE',
    }),
  getCoachTasks: (coachId: string) => request<{ tasks: TrainingTask[] }>(`/coach/${coachId}/tasks`),
  createTask: (coachId: string, data: Partial<TrainingTask>) =>
    request<{ task: TrainingTask }>(`/coach/${coachId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (coachId: string, taskId: string, data: Partial<TrainingTask>) =>
    request<{ task: TrainingTask }>(`/coach/${coachId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (coachId: string, taskId: string) =>
    request<{ success: boolean }>(`/coach/${coachId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),
  reviewTask: (completionId: string, feedback: string, rating: number) =>
    request<{ completion: any }>(`/coach/tasks/${completionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ feedback, rating }),
    }),
  getCoachAnalytics: (coachId: string) => request<any>(`/coach/${coachId}/analytics`),
  getCoachReports: (coachId: string) => request<any>(`/coach/${coachId}/reports`),

  // Athlete
  getAthleteDashboard: (athleteId: string) => request<any>(`/athlete/${athleteId}/dashboard`),
  getAthleteProfile: (athleteId: string) => request<any>(`/athlete/${athleteId}/profile`),
  updateAthleteProfile: (athleteId: string, data: any) =>
    request<{ success: boolean }>(`/athlete/${athleteId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getAthleteTasks: (athleteId: string) => request<{ tasks: any[] }>(`/athlete/${athleteId}/tasks`),
  startTask: (athleteId: string, taskId: string) =>
    request<{ completion: any }>(`/athlete/${athleteId}/tasks/${taskId}/start`, {
      method: 'POST',
    }),
  completeTask: (athleteId: string, taskId: string, data: any) =>
    request<{ completion: any }>(`/athlete/${athleteId}/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitVitalsAndReadiness: (athleteId: string, vitals: Partial<AthleteVitals>) =>
    request<{ vitals: AthleteVitals; assessment: ReadinessAssessment }>(`/athlete/${athleteId}/readiness`, {
      method: 'POST',
      body: JSON.stringify(vitals),
    }),
  submitManualEntry: (athleteId: string, data: any) =>
    request<{ success: boolean; entry: any; readiness: any }>(`/athlete/${athleteId}/manual-entry`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getManualEntries: (athleteId: string) =>
    request<{ entries: any[] }>(`/athlete/${athleteId}/manual-entries`),
  getMatchStats: (athleteId: string) =>
    request<{ total_matches: number; wins: number; losses: number; win_rate: number; matches: any[] }>(`/athlete/${athleteId}/match-stats`),
  getVitalsHistory: (athleteId: string) =>
    request<{ vitals: AthleteVitals[]; assessments: ReadinessAssessment[] }>(`/athlete/${athleteId}/vitals/history`),
  getWinProbability: (athleteId: string, tournamentId: string) =>
    request<{ tournament: Tournament; prediction: any }>(`/athlete/${athleteId}/win-probability/${tournamentId}`),
  getConsistency: (athleteId: string) => request<any>(`/athlete/${athleteId}/consistency`),
  getRecovery: (athleteId: string) => request<any>(`/athlete/${athleteId}/recovery`),
  getAchievements: (athleteId: string) =>
    request<{ achievements: Achievement[]; personalBests: PerformanceRecord[]; goals: any[] }>(
      `/athlete/${athleteId}/achievements`
    ),
  addPersonalRecord: (athleteId: string, data: any) =>
    request<{ record: PerformanceRecord }>(`/athlete/${athleteId}/personal-records`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tournaments
  getTournaments: () => request<{ tournaments: Tournament[] }>('/tournaments'),
  createTournament: (data: Partial<Tournament>) =>
    request<{ tournament: Tournament }>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registerForTournament: (tournamentId: string, athleteId: string) =>
    request<{ registration: any }>(`/tournaments/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify({ athlete_id: athleteId }),
    }),
  recordMatchResult: (matchId: string, data: any) =>
    request<{ result: any }>(`/tournaments/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Messages
  getMessages: (userId: string) => request<{ messages: Message[] }>(`/messages/${userId}`),
  sendMessage: (data: { sender_id: string; receiver_id?: string | null; content: string; is_broadcast?: boolean }) =>
    request<{ message: Message }>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: (userId: string) =>
    request<{ notifications: Notification[]; unreadCount: number }>(`/notifications/${userId}`),
  markNotificationRead: (notifId: string) =>
    request<{ notification: Notification }>(`/notifications/${notifId}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: (userId: string) =>
    request<{ success: boolean }>(`/notifications/mark-all-read/${userId}`, {
      method: 'POST',
    }),

  // Smartwatch Integration (boAt BLE & Health Connect)
  getSmartwatchDevice: (athleteId: string) =>
    request<{ device: any; latestReading: any; totalSyncs: number }>(`/smartwatch/${athleteId}/device`),
  connectSmartwatch: (athleteId: string, data: any) =>
    request<{ success: boolean; device: any }>(`/smartwatch/${athleteId}/connect`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  syncSmartwatchVitals: (athleteId: string, vitals: any) =>
    request<{ success: boolean; syncRecord: any; reading?: any; device: any }>(`/smartwatch/${athleteId}/sync`, {
      method: 'POST',
      body: JSON.stringify(vitals),
    }),
  disconnectSmartwatch: (athleteId: string) =>
    request<{ success: boolean; message: string }>(`/smartwatch/${athleteId}/disconnect`, {
      method: 'POST',
    }),
  getSmartwatchReadings: (athleteId: string) =>
    request<{ readings: any[] }>(`/smartwatch/${athleteId}/readings`),

  // Reset demo
  resetDemoData: () => request<{ success: boolean; message: string }>('/reset-demo-data', { method: 'POST' }),
};

