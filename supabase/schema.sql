-- ============================================================================
-- Athlete 360: AI-Powered Athlete Management & Performance Tracking Platform
-- Complete Database Schema (Supabase PostgreSQL)
-- 18 Comprehensive Tables with Foreign Keys, Constraints, Indexes & RLS Policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('coach', 'athlete', 'admin')),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COACH PROFILES
CREATE TABLE IF NOT EXISTS public.coach_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    organization TEXT,
    specialization TEXT,
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    certifications TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ATHLETE PROFILES
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dob DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other')),
    sport TEXT NOT NULL,
    position_specialization TEXT,
    height_cm NUMERIC(5, 2),
    weight_kg NUMERIC(5, 2),
    preferred_category TEXT,
    experience_level TEXT CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite', 'Professional')),
    injury_history TEXT, -- Private to athlete & assigned coach
    training_goals TEXT,
    performance_score INTEGER DEFAULT 80 CHECK (performance_score BETWEEN 0 AND 100),
    consistency_score INTEGER DEFAULT 85 CHECK (consistency_score BETWEEN 0 AND 100),
    current_readiness_status TEXT DEFAULT 'Green' CHECK (current_readiness_status IN ('Green', 'Yellow', 'Red')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COACH-ATHLETE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.coach_athlete_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE (coach_id, athlete_id)
);

-- 5. TRAINING TASKS
CREATE TABLE IF NOT EXISTS public.training_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'Strength Training',
        'Cardio',
        'Endurance',
        'Speed and Agility',
        'Technical Practice',
        'Recovery',
        'Match Preparation'
    )),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    estimated_duration_mins INTEGER DEFAULT 45,
    instructions TEXT,
    attachment_url TEXT,
    video_url TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TASK COMPLETIONS
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.training_tasks(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    actual_duration_mins INTEGER,
    metrics_json JSONB DEFAULT '{}'::jsonb, -- e.g. { reps: 50, distance_km: 5.2, weight_kg: 85, rpe: 7 }
    proof_url TEXT,
    athlete_notes TEXT,
    coach_feedback TEXT,
    coach_rating INTEGER CHECK (coach_rating BETWEEN 1 AND 5),
    feedback_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (task_id, athlete_id)
);

-- 7. ATHLETE VITALS
CREATE TABLE IF NOT EXISTS public.athlete_vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    resting_heart_rate INTEGER NOT NULL, -- bpm (e.g. 52)
    blood_pressure_sys INTEGER, -- mmHg (e.g. 118)
    blood_pressure_dia INTEGER, -- mmHg (e.g. 76)
    sleep_hours NUMERIC(3, 1) NOT NULL, -- e.g. 7.5
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
    body_temp NUMERIC(4, 1), -- Celsius (e.g. 36.6)
    spo2 INTEGER CHECK (spo2 BETWEEN 70 AND 100), -- SpO2 % (e.g. 98)
    fatigue_level INTEGER NOT NULL CHECK (fatigue_level BETWEEN 1 AND 10),
    soreness_level INTEGER NOT NULL CHECK (soreness_level BETWEEN 1 AND 10),
    hydration_level TEXT CHECK (hydration_level IN ('Optimal', 'Adequate', 'Low', 'Dehydrated')),
    training_intensity_recent TEXT CHECK (training_intensity_recent IN ('Rest Day', 'Light', 'Moderate', 'High', 'Maximum/Competition')),
    pain_symptoms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. READINESS ASSESSMENTS
CREATE TABLE IF NOT EXISTS public.readiness_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vitals_id UUID REFERENCES public.athlete_vitals(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
    readiness_status TEXT NOT NULL CHECK (readiness_status IN ('Green', 'Yellow', 'Red')),
    ai_insights TEXT NOT NULL,
    factors_breakdown JSONB DEFAULT '{}'::jsonb,
    recommended_intensity_pct INTEGER DEFAULT 100,
    recovery_suggestions JSONB DEFAULT '[]'::jsonb,
    shared_with_coach BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PERFORMANCE RECORDS
CREATE TABLE IF NOT EXISTS public.performance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_name TEXT NOT NULL,
    value NUMERIC(8, 2) NOT NULL,
    unit TEXT NOT NULL,
    category TEXT,
    context TEXT,
    is_personal_best BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TRAINING SESSIONS (Log of all workouts)
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_name TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    rpe_score INTEGER CHECK (rpe_score BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    calories_burned INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TOURNAMENTS
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    venue TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Live', 'Completed', 'Cancelled')),
    description TEXT,
    prize_or_tier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TOURNAMENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Withdrawn', 'Waitlisted')),
    seed_number INTEGER,
    UNIQUE (tournament_id, athlete_id)
);

-- 13. MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round TEXT NOT NULL, -- e.g. "Quarter-Finals", "Finals", "Matchday 4"
    scheduled_time TIMESTAMPTZ NOT NULL,
    opponent_name TEXT NOT NULL,
    venue_court TEXT,
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Live', 'Completed', 'Postponed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MATCH RESULTS
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('Win', 'Loss', 'Draw')),
    score_display TEXT NOT NULL, -- e.g. "6-4, 7-5" or "10.12s (1st Place)"
    ai_win_probability_predicted NUMERIC(5, 2), -- predicted % prior to match
    athlete_stats_json JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('task', 'tournament', 'message', 'readiness', 'achievement', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL if broadcast
    content TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT DEFAULT 'Award',
    unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ATHLETE GOALS
CREATE TABLE IF NOT EXISTS public.athlete_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE,
    metric_target TEXT,
    current_value TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR FAST PERFORMANCE & FILTERING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_assignments_coach ON public.coach_athlete_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_assignments_athlete ON public.coach_athlete_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_tasks_coach ON public.training_tasks(coach_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.training_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comp_athlete ON public.task_completions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_task_comp_status ON public.task_completions(status);
CREATE INDEX IF NOT EXISTS idx_vitals_athlete_date ON public.athlete_vitals(athlete_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_readiness_athlete_date ON public.readiness_assessments(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_perf_athlete_metric ON public.performance_records(athlete_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_sessions_athlete_date ON public.training_sessions(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_athlete_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_goals ENABLE ROW LEVEL SECURITY;

-- Basic RLS Rules:
-- 1. Users can view their own profile; coaches can view their assigned athletes
CREATE POLICY "Users can view self" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 2. Athletes can view & update their own vitals
CREATE POLICY "Athletes manage vitals" ON public.athlete_vitals
    FOR ALL USING (auth.uid() = athlete_id);

-- 3. Coaches can view vitals of assigned athletes
CREATE POLICY "Coaches view assigned athlete vitals" ON public.athlete_vitals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_assignments
            WHERE coach_id = auth.uid() AND athlete_id = public.athlete_vitals.athlete_id AND status = 'active'
        )
    );

-- 4. Tasks: Coach can manage, Athlete can view assigned
CREATE POLICY "Coaches manage tasks" ON public.training_tasks
    FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Athletes view assigned tasks" ON public.training_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.task_completions
            WHERE task_id = public.training_tasks.id AND athlete_id = auth.uid()
        )
    );

-- 19. SMARTWATCH DEVICES
CREATE TABLE IF NOT EXISTS public.smartwatch_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    model_identifier TEXT,
    connection_type TEXT NOT NULL CHECK (connection_type IN ('BLE_GATT', 'HEALTH_CONNECT', 'CREST_API', 'MANUAL_IMPORT')),
    status TEXT NOT NULL DEFAULT 'Disconnected' CHECK (status IN ('Connected', 'Syncing', 'Disconnected', 'Permission Required', 'Device Not Supported')),
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (athlete_id, device_name)
);

-- 20. SMARTWATCH VITALS SYNC
CREATE TABLE IF NOT EXISTS public.smartwatch_vitals_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.smartwatch_devices(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    heart_rate_bpm INTEGER,
    spo2_pct INTEGER CHECK (spo2_pct BETWEEN 70 AND 100),
    steps INTEGER DEFAULT 0,
    calories_kcal INTEGER DEFAULT 0,
    sleep_duration_hours NUMERIC(4, 2),
    sleep_quality_score INTEGER CHECK (sleep_quality_score BETWEEN 1 AND 5),
    workout_duration_mins INTEGER DEFAULT 0,
    distance_km NUMERIC(6, 2) DEFAULT 0.00,
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 100),
    source TEXT NOT NULL,
    raw_payload_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smartwatch_athlete_sync ON public.smartwatch_vitals_sync(athlete_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_smartwatch_devices_athlete ON public.smartwatch_devices(athlete_id);

ALTER TABLE public.smartwatch_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartwatch_vitals_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage their smartwatch devices" ON public.smartwatch_devices
    FOR ALL USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes manage their smartwatch vitals sync" ON public.smartwatch_vitals_sync
    FOR ALL USING (auth.uid() = athlete_id);

CREATE POLICY "Coaches view assigned athlete smartwatch vitals" ON public.smartwatch_vitals_sync
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_assignments
            WHERE coach_id = auth.uid() AND athlete_id = public.smartwatch_vitals_sync.athlete_id AND status = 'active'
        )
    );

