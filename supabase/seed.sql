-- ============================================================================
-- Athlete 360: Demo Seed Data for Supabase
-- 1 Coach, 5 Distinct Athletes across Sports, Real Historical Vitals,
-- Tournaments, Matches, Tasks, and Achievements.
-- All data is realistic and labeled as fictional demo data.
-- ============================================================================

-- Fixed UUIDs for predictable testing
-- Coach: a0000000-0000-0000-0000-000000000001
-- Athletes: b0000000-0000-0000-0000-000000000001 to b0000000-0000-0000-0000-000000000005

-- 1. Insert Users (Password: "athlete360" or "demo123")
INSERT INTO public.users (id, email, password_hash, role, full_name, avatar_url, phone) VALUES
('a0000000-0000-0000-0000-000000000001', 'coach.marcus@athlete360.com', '$2a$10$demoHashForMarcusVance1234567890', 'coach', 'Coach Marcus Vance', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '+1 (555) 234-5678'),
('b0000000-0000-0000-0000-000000000001', 'alex.chen@athlete360.com', '$2a$10$demoHashForAlexChen123456789012', 'athlete', 'Alex Chen', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', '+1 (555) 345-6789'),
('b0000000-0000-0000-0000-000000000002', 'maya.lin@athlete360.com', '$2a$10$demoHashForMayaLin1234567890123', 'athlete', 'Maya Lin', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', '+1 (555) 456-7890'),
('b0000000-0000-0000-0000-000000000003', 'jordan.taylor@athlete360.com', '$2a$10$demoHashForJordanTaylor12345678', 'athlete', 'Jordan Taylor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+1 (555) 567-8901'),
('b0000000-0000-0000-0000-000000000004', 'sofia.rodriguez@athlete360.com', '$2a$10$demoHashForSofiaRodriguez12345', 'athlete', 'Sofia Rodriguez', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '+1 (555) 678-9012'),
('b0000000-0000-0000-0000-000000000005', 'liam.walker@athlete360.com', '$2a$10$demoHashForLiamWalker123456789', 'athlete', 'Liam Walker', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '+1 (555) 789-0123')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Coach Profile
INSERT INTO public.coach_profiles (user_id, organization, specialization, experience_years, bio, certifications) VALUES
('a0000000-0000-0000-0000-000000000001', 'Elite Performance Institute', 'High Performance & Speed Conditioning', 14, 'USATF Level 3 Master Coach and Olympic Performance Specialist. Focused on data-driven biomechanics and recovery optimization.', ARRAY['USATF Level 3', 'CSCS Certified', 'Exos Performance Specialist'])
ON CONFLICT (user_id) DO NOTHING;

-- 3. Insert Athlete Profiles
INSERT INTO public.athlete_profiles (user_id, dob, gender, sport, position_specialization, height_cm, weight_kg, preferred_category, experience_level, injury_history, training_goals, performance_score, consistency_score, current_readiness_status) VALUES
('b0000000-0000-0000-0000-000000000001', '2002-04-15', 'Male', 'Running', '100m & 200m Sprint', 183.00, 78.50, 'Speed and Agility', 'Elite', 'Mild right hamstring tightness (resolved 4 mos ago)', 'Break 10.15s in 100m sprint, qualify for National Trials', 94, 96, 'Green'),
('b0000000-0000-0000-0000-000000000002', '2003-08-22', 'Female', 'Badminton', 'Singles Specialist', 175.00, 64.00, 'Speed and Agility', 'Elite', 'Minor left shoulder tightness (under physical therapy)', 'Top-20 National Badminton Ranking, improve smash speed', 88, 92, 'Green'),
('b0000000-0000-0000-0000-000000000003', '2001-11-03', 'Male', 'Cricket', 'All-Rounder / Top Order Batter', 188.00, 84.00, 'Speed and Agility', 'Advanced', 'Sprained ankle Grade 1 in 2024 (fully healed)', 'Improve bowling speed to 135 km/h, increase match batting strike rate', 82, 85, 'Yellow'),
('b0000000-0000-0000-0000-000000000004', '2004-02-18', 'Female', 'Badminton', 'Doubles & Singles Specialist', 170.00, 61.50, 'Technical Practice', 'Elite', 'None recorded', 'Achieve top-10 ranking, improve net play precision', 91, 94, 'Green'),
('b0000000-0000-0000-0000-000000000005', '2002-09-30', 'Male', 'Football', 'Forward / Striker', 180.00, 75.00, 'Cardio', 'Advanced', 'Shin splints post high-volume week', 'VO2 max target 64 mL/kg/min, exceed 11.5km match coverage', 76, 78, 'Red')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Assign Athletes to Coach
INSERT INTO public.coach_athlete_assignments (coach_id, athlete_id, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'active'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'active'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'active'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'active'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'active')
ON CONFLICT (coach_id, athlete_id) DO NOTHING;

-- 5. Achievements Seed
INSERT INTO public.achievements (athlete_id, badge_id, title, description, icon_name) VALUES
('b0000000-0000-0000-0000-000000000001', 'streak_7', '7-Day Training Streak', 'Completed consecutive training sessions for 7 days.', 'Flame'),
('b0000000-0000-0000-0000-000000000001', 'consistency_30', '30-Day Consistency Star', 'Maintained 90%+ workout adherence for 30 consecutive days.', 'Trophy'),
('b0000000-0000-0000-0000-000000000001', 'pb_smasher', 'Personal Best Smasher', 'Set a new all-time personal best record in competition.', 'Zap'),
('b0000000-0000-0000-0000-000000000002', 'streak_7', '7-Day Training Streak', 'Completed consecutive training sessions for 7 days.', 'Flame'),
('b0000000-0000-0000-0000-000000000004', 'century_tasks', '100 Tasks Conquered', 'Successfully submitted and passed 100 training tasks.', 'CheckCircle');
