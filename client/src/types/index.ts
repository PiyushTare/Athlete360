export type UserRole = 'coach' | 'athlete' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
  profile?: AthleteProfile | CoachProfile;
}

export interface CoachProfile {
  id?: string;
  user_id: string;
  organization: string;
  specialization: string;
  experience_years: number;
  bio: string;
  certifications: string[];
}

export interface AthleteProfile {
  id?: string;
  user_id: string;
  dob?: string;
  gender?: string;
  sport: string;
  position_specialization?: string;
  height_cm?: number;
  weight_kg?: number;
  preferred_category?: string;
  experience_level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite' | 'Professional';
  injury_history?: string;
  training_goals?: string;
  performance_score: number;
  consistency_score: number;
  current_readiness_status: 'Green' | 'Yellow' | 'Red';
  readiness_score?: number;
  weekly_training_hours?: number;
  streak_days?: number;
}

export type TaskCategory =
  | 'Strength Training'
  | 'Cardio'
  | 'Endurance'
  | 'Speed and Agility'
  | 'Technical Practice'
  | 'Recovery'
  | 'Match Preparation';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface TrainingTask {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_duration_mins: number;
  instructions: string;
  attachment_url?: string;
  video_url?: string;
  due_date: string;
  assigned_to?: string;
  created_at?: string;
  assignments?: Array<{
    completion_id: string;
    athlete_id: string;
    name: string;
    avatar?: string;
    status: TaskStatus;
    completed_at?: string | null;
    actual_duration_mins?: number | null;
    metrics_json?: Record<string, any>;
    proof_url?: string;
    athlete_notes?: string;
    coach_feedback?: string | null;
    coach_rating?: number | null;
  }>;
  status?: TaskStatus;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  athlete_id: string;
  status: TaskStatus;
  started_at?: string | null;
  completed_at?: string | null;
  actual_duration_mins?: number | null;
  metrics_json?: Record<string, any>;
  proof_url?: string;
  athlete_notes?: string;
  coach_feedback?: string | null;
  coach_rating?: number | null;
  feedback_at?: string | null;
}

export interface AthleteVitals {
  id?: string;
  athlete_id: string;
  recorded_date: string;
  resting_heart_rate: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  sleep_hours: number;
  sleep_quality: number;
  body_temp: number;
  spo2: number;
  fatigue_level: number;
  soreness_level: number;
  hydration_level: 'Optimal' | 'Adequate' | 'Low' | 'Dehydrated';
  training_intensity_recent: 'Rest Day' | 'Light' | 'Moderate' | 'High' | 'Maximum/Competition';
  pain_symptoms?: string;
}

export interface ReadinessAssessment {
  id?: string;
  athlete_id: string;
  vitals_id?: string;
  date: string;
  readiness_score: number;
  readiness_status: 'Green' | 'Yellow' | 'Red';
  ai_insights: string;
  engine_source?: string;
  factors_breakdown: {
    cardiovascular_autonomic?: number;
    sleep_cellular_recovery?: number;
    neuromuscular_soreness?: number;
    systemic_fatigue?: number;
    respiratory_spo2?: number;
    [key: string]: any;
  };
  recommended_intensity_pct: number;
  recovery_suggestions: string[];
  shared_with_coach: boolean;
  medical_disclaimer?: string;
  positive_factors?: string[];
  concerning_factors?: string[];
}

export interface PerformanceRecord {
  id: string;
  athlete_id: string;
  date: string;
  metric_name: string;
  value: number;
  unit: string;
  category?: string;
  context?: string;
  is_personal_best: boolean;
}

export interface Tournament {
  id: string;
  coach_id?: string;
  name: string;
  sport: string;
  venue: string;
  start_date: string;
  end_date: string;
  category: string;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
  description?: string;
  prize_or_tier?: string;
  registrations?: Array<{
    id: string;
    athlete_id: string;
    athlete_name: string;
    athlete_avatar?: string;
    status: string;
    seed_number?: number;
  }>;
  matches?: Match[];
}

export interface Match {
  id: string;
  tournament_id: string;
  round: string;
  scheduled_time: string;
  opponent_name: string;
  venue_court?: string;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Postponed';
  ai_win_probability?: number;
  result?: {
    id: string;
    athlete_id: string;
    result: 'Win' | 'Loss' | 'Draw';
    score_display: string;
    ai_win_probability_predicted?: number;
    athlete_stats_json?: Record<string, any>;
    notes?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task' | 'tournament' | 'message' | 'readiness' | 'achievement' | 'system';
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string | null;
  sender_name?: string;
  sender_avatar?: string;
  receiver_name?: string;
  content: string;
  is_broadcast: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  athlete_id: string;
  badge_id: string;
  title: string;
  description: string;
  icon_name: string;
  unlocked_at?: string;
}

export interface AthleteGoal {
  id: string;
  athlete_id: string;
  title: string;
  target_date?: string;
  metric_target?: string;
  current_value?: string;
  status: 'active' | 'achieved' | 'paused';
}

export type SmartwatchStatus = 'Connected' | 'Syncing' | 'Disconnected' | 'Permission Required' | 'Device Not Supported';

export interface SmartwatchDevice {
  id?: string;
  athlete_id: string;
  device_name: string;
  model?: string;
  model_identifier?: string;
  connection_type: 'BLE_GATT' | 'HEALTH_CONNECT' | 'CREST_API' | 'MANUAL_IMPORT';
  status: SmartwatchStatus;
  connection_status?: SmartwatchStatus;
  battery_level?: number;
  last_sync_at?: string | null;
  created_at?: string;
}

export interface SmartwatchVitalsSync {
  id?: string;
  athlete_id: string;
  device_id?: string;
  timestamp: string;
  recorded_at?: string;
  heart_rate_bpm?: number | null;
  spo2_pct?: number | null;
  steps?: number;
  steps_count?: number;
  calories_kcal?: number;
  calories_burned?: number;
  sleep_duration_hours?: number | null;
  sleep_quality_score?: number | null;
  workout_duration_mins?: number;
  distance_km?: number;
  stress_level?: number | null;
  source: string;
  raw_payload_json?: Record<string, any>;
}

