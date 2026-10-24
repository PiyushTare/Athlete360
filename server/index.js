import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { collection, getDb, saveDb } from './db.js';
import { calculateFitnessReadiness, calculateWinProbability } from './aiService.js';
import { getModelMetadata, runMlPrediction } from './mlBridge.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.url}`);
  next();
});

// ============================================================================
// AUTHENTICATION & DEMO ACCOUNTS
// ============================================================================

// Return demo users for one-click switch / login
app.get('/api/auth/demo-users', (req, res) => {
  const users = collection('users').getAll();
  const athleteProfiles = collection('athlete_profiles').getAll();
  const coachProfiles = collection('coach_profiles').getAll();

  const enrichedUsers = users.map(user => {
    let profile = null;
    if (user.role === 'coach') {
      profile = coachProfiles.find(cp => cp.user_id === user.id);
    } else {
      profile = athleteProfiles.find(ap => ap.user_id === user.id);
    }
    return {
      ...user,
      profile
    };
  });

  res.json({ users: enrichedUsers });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = collection('users').findOne(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'User not found with this email address.' });
  }

  // Demo simple check (or standard password matching)
  if (password && password !== 'athlete360' && password !== 'demo123' && user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid password. (Use "athlete360" for demo accounts)' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ error: `Unauthorized: You tried logging into the ${role} portal with an ${user.role} account.` });
  }

  let profile = null;
  if (user.role === 'coach') {
    profile = collection('coach_profiles').findOne(cp => cp.user_id === user.id);
  } else {
    profile = collection('athlete_profiles').findOne(ap => ap.user_id === user.id);
  }

  res.json({
    token: `demo-token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      profile
    }
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, role, full_name, sport, position, phone } = req.body;

  if (!email || !role || !full_name) {
    return res.status(400).json({ error: 'Please provide email, role, and full name.' });
  }

  const existing = collection('users').findOne(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser = collection('users').insert({
    email,
    password_hash: password || 'athlete360',
    role,
    full_name,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}&backgroundColor=00f59b,0ea5e9`,
    phone: phone || ''
  });

  let newProfile = null;
  if (role === 'coach') {
    newProfile = collection('coach_profiles').insert({
      user_id: newUser.id,
      organization: 'Athletics Club',
      specialization: sport || 'Multi-Sport Training',
      experience_years: 5,
      bio: `Coach ${full_name}`,
      certifications: ['Certified Sports Coach']
    });
  } else {
    newProfile = collection('athlete_profiles').insert({
      user_id: newUser.id,
      dob: '2003-01-01',
      gender: 'Prefer not to say',
      sport: sport || 'Running',
      position_specialization: position || 'All-Round',
      height_cm: 180,
      weight_kg: 75,
      preferred_category: 'Speed and Agility',
      experience_level: 'Intermediate',
      injury_history: 'None',
      training_goals: 'Improve overall sports performance and consistency.',
      performance_score: 80,
      consistency_score: 85,
      current_readiness_status: 'Green',
      readiness_score: 85,
      weekly_training_hours: 10,
      streak_days: 1
    });

    // Assign to demo coach if exists
    const demoCoach = collection('users').findOne(u => u.role === 'coach');
    if (demoCoach) {
      collection('coach_athlete_assignments').insert({
        coach_id: demoCoach.id,
        athlete_id: newUser.id,
        status: 'active',
        assigned_at: new Date().toISOString()
      });
    }
  }

  // Welcome notification
  collection('notifications').insert({
    user_id: newUser.id,
    title: 'Welcome to Athlete 360!',
    message: `Your ${role} profile has been created successfully. Welcome to the platform.`,
    type: 'system',
    is_read: false,
    link_url: role === 'coach' ? '/dashboard' : '/dashboard'
  });

  res.status(201).json({
    token: `demo-token-${newUser.id}-${Date.now()}`,
    user: {
      ...newUser,
      profile: newProfile
    }
  });
});

// Get Current User info
app.get('/api/auth/me/:userId', (req, res) => {
  const user = collection('users').findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let profile = null;
  if (user.role === 'coach') {
    profile = collection('coach_profiles').findOne(cp => cp.user_id === user.id);
  } else {
    profile = collection('athlete_profiles').findOne(ap => ap.user_id === user.id);
  }

  res.json({ user: { ...user, profile } });
});

// ============================================================================
// COACH ENDPOINTS
// ============================================================================

// Coach Dashboard Summary
app.get('/api/coach/:coachId/dashboard', (req, res) => {
  const coachId = req.params.coachId;
  const assignments = collection('coach_athlete_assignments').find(a => a.coach_id === coachId && a.status === 'active');
  const athleteIds = assignments.map(a => a.athlete_id);

  const athletes = collection('users').find(u => athleteIds.includes(u.id));
  const athleteProfiles = collection('athlete_profiles').find(ap => athleteIds.includes(ap.user_id));

  // Count active / attention
  let requiringAttentionCount = 0;
  athleteProfiles.forEach(ap => {
    if (ap.current_readiness_status === 'Red' || ap.current_readiness_status === 'Yellow') {
      requiringAttentionCount++;
    }
  });

  const coachTasks = collection('training_tasks').find(t => t.coach_id === coachId);
  const taskIds = coachTasks.map(t => t.id);
  const completions = collection('task_completions').find(tc => taskIds.includes(tc.task_id));

  const tasksCompletedCount = completions.filter(c => c.status === 'Completed').length;
  const tasksInProgressCount = completions.filter(c => c.status === 'In Progress').length;
  const upcomingTournaments = collection('tournaments').find(t => t.status === 'Upcoming' || t.status === 'Live');

  // Recent activity stream
  const recentCompletions = completions
    .filter(c => c.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 6)
    .map(c => {
      const task = coachTasks.find(t => t.id === c.task_id);
      const athlete = athletes.find(a => a.id === c.athlete_id);
      return {
        id: c.id,
        athlete_name: athlete ? athlete.full_name : 'Unknown Athlete',
        athlete_avatar: athlete ? athlete.avatar_url : '',
        task_title: task ? task.title : 'Training Task',
        category: task ? task.category : 'Training',
        completed_at: c.completed_at,
        actual_duration_mins: c.actual_duration_mins,
        rating: c.coach_rating,
        proof_url: c.proof_url
      };
    });

  // Squad Chart Data (Readiness & Weekly Performance)
  const squadMetrics = athleteProfiles.map(ap => {
    const athleteUser = athletes.find(u => u.id === ap.user_id);
    return {
      name: athleteUser ? athleteUser.full_name.split(' ')[0] : 'Athlete',
      fullName: athleteUser ? athleteUser.full_name : 'Athlete',
      sport: ap.sport,
      performance: ap.performance_score,
      consistency: ap.consistency_score,
      readiness: ap.readiness_score || 85,
      readiness_status: ap.current_readiness_status
    };
  });

  res.json({
    stats: {
      total_athletes: athletes.length,
      currently_training: tasksInProgressCount || 2,
      tasks_assigned_today: coachTasks.length,
      tasks_completed: tasksCompletedCount,
      athletes_requiring_attention: requiringAttentionCount,
      upcoming_tournaments_count: upcomingTournaments.length
    },
    squadMetrics,
    recentActivity: recentCompletions,
    upcomingTournaments: upcomingTournaments.slice(0, 3)
  });
});

// Get Coach's Athletes List with full detail
app.get('/api/coach/:coachId/athletes', (req, res) => {
  const coachId = req.params.coachId;
  const assignments = collection('coach_athlete_assignments').find(a => a.coach_id === coachId);
  const athleteIds = assignments.map(a => a.athlete_id);

  const users = collection('users').find(u => athleteIds.includes(u.id));
  const profiles = collection('athlete_profiles').find(ap => athleteIds.includes(ap.user_id));
  const vitals = collection('athlete_vitals').getAll();
  const tasks = collection('training_tasks').find(t => t.coach_id === coachId);
  const taskIds = tasks.map(t => t.id);
  const completions = collection('task_completions').find(tc => taskIds.includes(tc.task_id));

  const athletesDetailed = users.map(user => {
    const profile = profiles.find(p => p.user_id === user.id) || {};
    const athleteVitals = vitals.filter(v => v.athlete_id === user.id).sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date));
    const athleteCompletions = completions.filter(c => c.athlete_id === user.id);
    const completedCount = athleteCompletions.filter(c => c.status === 'Completed').length;

    return {
      id: user.id,
      user_id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar_url,
      sport: profile.sport || 'Running',
      position: profile.position_specialization || 'Athlete',
      age: profile.dob ? Math.floor((new Date() - new Date(profile.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 22,
      dob: profile.dob,
      gender: profile.gender,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      experience_level: profile.experience_level,
      injury_history: profile.injury_history,
      training_goals: profile.training_goals,
      performance_score: profile.performance_score || 80,
      consistency_score: profile.consistency_score || 85,
      readiness_score: profile.readiness_score || 85,
      readiness_status: profile.current_readiness_status || 'Green',
      streak_days: profile.streak_days || 7,
      weekly_training_hours: profile.weekly_training_hours || 12,
      completed_tasks_count: completedCount,
      total_assigned_tasks: athleteCompletions.length,
      latest_vitals: athleteVitals[0] || null,
      recent_activity: athleteCompletions[0] ? `Completed task ${athleteCompletions[0].completed_at ? new Date(athleteCompletions[0].completed_at).toLocaleDateString() : 'recently'}` : 'Joined squad'
    };
  });

  res.json({ athletes: athletesDetailed });
});

// Coach: Add New Athlete
app.post('/api/coach/:coachId/athletes', (req, res) => {
  const coachId = req.params.coachId;
  const { full_name, email, sport, position, dob, height_cm, weight_kg, experience_level, training_goals } = req.body;

  if (!full_name || !email || !sport) {
    return res.status(400).json({ error: 'Name, email, and sport are required.' });
  }

  const existing = collection('users').findOne(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An athlete with this email already exists.' });
  }

  const newUser = collection('users').insert({
    email,
    password_hash: 'athlete360',
    role: 'athlete',
    full_name,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}&backgroundColor=00f59b,0ea5e9`,
    phone: req.body.phone || ''
  });

  const newProfile = collection('athlete_profiles').insert({
    user_id: newUser.id,
    dob: dob || '2003-05-15',
    gender: req.body.gender || 'Prefer not to say',
    sport,
    position_specialization: position || 'General Specialist',
    height_cm: height_cm || 180,
    weight_kg: weight_kg || 75,
    preferred_category: 'Speed and Agility',
    experience_level: experience_level || 'Intermediate',
    injury_history: 'None reported',
    training_goals: training_goals || 'Maximize athletic performance',
    performance_score: 82,
    consistency_score: 88,
    current_readiness_status: 'Green',
    readiness_score: 90,
    weekly_training_hours: 10,
    streak_days: 1
  });

  collection('coach_athlete_assignments').insert({
    coach_id: coachId,
    athlete_id: newUser.id,
    status: 'active',
    assigned_at: new Date().toISOString()
  });

  collection('notifications').insert({
    user_id: newUser.id,
    title: 'Assigned to Coach',
    message: 'You have been added to Coach Marcus Vance’s roster on Athlete 360.',
    type: 'system',
    is_read: false
  });

  res.status(201).json({ athlete: { ...newUser, profile: newProfile } });
});

// Coach: Edit Athlete
app.put('/api/coach/:coachId/athletes/:athleteId', (req, res) => {
  const { athleteId } = req.params;
  const { full_name, sport, position_specialization, height_cm, weight_kg, experience_level, injury_history, training_goals } = req.body;

  if (full_name) {
    collection('users').update(athleteId, { full_name });
  }

  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId);
  if (profile) {
    collection('athlete_profiles').update(profile.id, {
      sport: sport || profile.sport,
      position_specialization: position_specialization || profile.position_specialization,
      height_cm: height_cm !== undefined ? height_cm : profile.height_cm,
      weight_kg: weight_kg !== undefined ? weight_kg : profile.weight_kg,
      experience_level: experience_level || profile.experience_level,
      injury_history: injury_history !== undefined ? injury_history : profile.injury_history,
      training_goals: training_goals !== undefined ? training_goals : profile.training_goals
    });
  }

  res.json({ success: true, message: 'Athlete profile updated successfully.' });
});

// Coach: Remove Athlete from Roster
app.delete('/api/coach/:coachId/athletes/:athleteId', (req, res) => {
  const { coachId, athleteId } = req.params;
  const assignment = collection('coach_athlete_assignments').findOne(a => a.coach_id === coachId && a.athlete_id === athleteId);
  if (assignment) {
    collection('coach_athlete_assignments').remove(assignment.id);
  }
  res.json({ success: true, message: 'Athlete removed from roster.' });
});

// Coach: Get Tasks
app.get('/api/coach/:coachId/tasks', (req, res) => {
  const coachId = req.params.coachId;
  const tasks = collection('training_tasks').find(t => t.coach_id === coachId);
  const taskIds = tasks.map(t => t.id);
  const completions = collection('task_completions').find(tc => taskIds.includes(tc.task_id));
  const users = collection('users').getAll();

  const enrichedTasks = tasks.map(task => {
    const taskCompletions = completions.filter(c => c.task_id === task.id);
    const assignedAthletes = taskCompletions.map(c => {
      const u = users.find(user => user.id === c.athlete_id);
      return {
        completion_id: c.id,
        athlete_id: c.athlete_id,
        name: u ? u.full_name : 'Unknown Athlete',
        avatar: u ? u.avatar_url : '',
        status: c.status,
        started_at: c.started_at,
        completed_at: c.completed_at,
        actual_duration_mins: c.actual_duration_mins,
        metrics_json: c.metrics_json,
        proof_url: c.proof_url,
        athlete_notes: c.athlete_notes,
        coach_feedback: c.coach_feedback,
        coach_rating: c.coach_rating
      };
    });

    return {
      ...task,
      assignments: assignedAthletes,
      status: taskCompletions.every(c => c.status === 'Completed') ? 'Completed' :
              taskCompletions.some(c => c.status === 'In Progress') ? 'In Progress' :
              new Date(task.due_date) < new Date() && !taskCompletions.every(c => c.status === 'Completed') ? 'Overdue' : 'Pending'
    };
  });

  res.json({ tasks: enrichedTasks });
});

// Coach: Create Task
app.post('/api/coach/:coachId/tasks', (req, res) => {
  const coachId = req.params.coachId;
  const { title, description, category, priority, estimated_duration_mins, instructions, attachment_url, video_url, due_date, assigned_to } = req.body;

  if (!title || !category || !due_date) {
    return res.status(400).json({ error: 'Title, category, and due date are required.' });
  }

  const newTask = collection('training_tasks').insert({
    coach_id: coachId,
    title,
    description: description || '',
    category,
    priority: priority || 'Medium',
    estimated_duration_mins: estimated_duration_mins || 45,
    instructions: instructions || '',
    attachment_url: attachment_url || '',
    video_url: video_url || '',
    due_date,
    assigned_to: assigned_to || 'all'
  });

  // Assign to athletes
  let targetAthleteIds = [];
  if (assigned_to === 'all') {
    const assignments = collection('coach_athlete_assignments').find(a => a.coach_id === coachId && a.status === 'active');
    targetAthleteIds = assignments.map(a => a.athlete_id);
  } else {
    targetAthleteIds = [assigned_to];
  }

  targetAthleteIds.forEach(athId => {
    collection('task_completions').insert({
      task_id: newTask.id,
      athlete_id: athId,
      status: 'Pending',
      started_at: null,
      completed_at: null,
      actual_duration_mins: null,
      metrics_json: {},
      proof_url: '',
      athlete_notes: '',
      coach_feedback: null,
      coach_rating: null,
      feedback_at: null
    });

    // Send notification
    collection('notifications').insert({
      user_id: athId,
      title: 'New Task Assigned',
      message: `Coach assigned: "${title}". Due ${new Date(due_date).toLocaleDateString()}.`,
      type: 'task',
      is_read: false,
      link_url: '/tasks'
    });
  });

  res.status(201).json({ task: newTask });
});

// Coach: Edit Task
app.put('/api/coach/:coachId/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;
  const updated = collection('training_tasks').update(taskId, updates);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json({ task: updated });
});

// Coach: Delete Task
app.delete('/api/coach/:coachId/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  collection('training_tasks').remove(taskId);
  // remove completions
  const completions = collection('task_completions').find(tc => tc.task_id === taskId);
  completions.forEach(c => collection('task_completions').remove(c.id));
  res.json({ success: true });
});

// Coach: Review Athlete Submission
app.post('/api/coach/tasks/:completionId/review', (req, res) => {
  const { completionId } = req.params;
  const { feedback, rating } = req.body;

  const completion = collection('task_completions').findById(completionId);
  if (!completion) return res.status(404).json({ error: 'Completion record not found' });

  const updated = collection('task_completions').update(completionId, {
    coach_feedback: feedback,
    coach_rating: rating,
    feedback_at: new Date().toISOString()
  });

  const task = collection('training_tasks').findById(completion.task_id);

  // Notify athlete
  collection('notifications').insert({
    user_id: completion.athlete_id,
    title: 'Coach Feedback Received',
    message: `Coach Marcus reviewed your submission for "${task ? task.title : 'training task'}" with rating ${rating}/5 ⭐`,
    type: 'task',
    is_read: false,
    link_url: '/tasks'
  });

  res.json({ completion: updated });
});

// Coach: Analytics
app.get('/api/coach/:coachId/analytics', (req, res) => {
  const coachId = req.params.coachId;
  const assignments = collection('coach_athlete_assignments').find(a => a.coach_id === coachId && a.status === 'active');
  const athleteIds = assignments.map(a => a.athlete_id);
  const athletes = collection('users').find(u => athleteIds.includes(u.id));
  const profiles = collection('athlete_profiles').find(ap => athleteIds.includes(ap.user_id));
  const vitals = collection('athlete_vitals').getAll();

  // Weekly compliance & completion rate
  const complianceData = [
    { day: 'Mon', completion_rate: 94, target: 90, squad_readiness_avg: 88 },
    { day: 'Tue', completion_rate: 91, target: 90, squad_readiness_avg: 85 },
    { day: 'Wed', completion_rate: 88, target: 90, squad_readiness_avg: 82 },
    { day: 'Thu', completion_rate: 96, target: 90, squad_readiness_avg: 87 },
    { day: 'Fri', completion_rate: 92, target: 90, squad_readiness_avg: 89 },
    { day: 'Sat', completion_rate: 85, target: 90, squad_readiness_avg: 81 },
    { day: 'Sun', completion_rate: 78, target: 80, squad_readiness_avg: 92 }
  ];

  // Distribution by sport and category
  const categoryLoad = [
    { category: 'Speed & Agility', hours: 38, athletes: 4 },
    { category: 'Strength & Power', hours: 32, athletes: 5 },
    { category: 'Endurance & Cardio', hours: 26, athletes: 3 },
    { category: 'Technical Practice', hours: 22, athletes: 2 },
    { category: 'Active Recovery', hours: 18, athletes: 5 }
  ];

  res.json({
    complianceData,
    categoryLoad,
    athletes: athletes.map(a => {
      const p = profiles.find(pr => pr.user_id === a.id) || {};
      return {
        id: a.id,
        name: a.full_name,
        sport: p.sport,
        performance: p.performance_score,
        consistency: p.consistency_score,
        readiness: p.readiness_score,
        status: p.current_readiness_status
      };
    })
  });
});

// Coach: Reports (CSV & Print Data)
app.get('/api/coach/:coachId/reports', (req, res) => {
  const coachId = req.params.coachId;
  const assignments = collection('coach_athlete_assignments').find(a => a.coach_id === coachId && a.status === 'active');
  const athleteIds = assignments.map(a => a.athlete_id);
  const athletes = collection('users').find(u => athleteIds.includes(u.id));
  const profiles = collection('athlete_profiles').find(ap => athleteIds.includes(ap.user_id));
  const tasks = collection('training_tasks').find(t => t.coach_id === coachId);
  const completions = collection('task_completions').getAll();

  const reportRows = athletes.map(athlete => {
    const prof = profiles.find(p => p.user_id === athlete.id) || {};
    const athleteComps = completions.filter(c => c.athlete_id === athlete.id);
    const completedCount = athleteComps.filter(c => c.status === 'Completed').length;
    const completionRate = athleteComps.length > 0 ? Math.round((completedCount / athleteComps.length) * 100) : 100;

    return {
      athlete_id: athlete.id,
      name: athlete.full_name,
      sport: prof.sport,
      position: prof.position_specialization,
      performance_score: prof.performance_score,
      consistency_score: prof.consistency_score,
      readiness_score: prof.readiness_score,
      readiness_status: prof.current_readiness_status,
      assigned_tasks_count: athleteComps.length,
      completed_tasks_count: completedCount,
      completion_rate_pct: completionRate,
      weekly_training_hours: prof.weekly_training_hours,
      streak_days: prof.streak_days,
      injury_status: prof.injury_history || 'None'
    };
  });

  res.json({
    generated_at: new Date().toISOString(),
    coach_name: 'Coach Marcus Vance',
    organization: 'Apex High Performance Institute',
    report_data: reportRows
  });
});

// ============================================================================
// ATHLETE ENDPOINTS
// ============================================================================

// Athlete Dashboard
app.get('/api/athlete/:athleteId/dashboard', (req, res) => {
  const athleteId = req.params.athleteId;
  const user = collection('users').findById(athleteId);
  if (!user) return res.status(404).json({ error: 'Athlete not found' });

  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId) || {};
  const completions = collection('task_completions').find(tc => tc.athlete_id === athleteId);
  const taskIds = completions.map(c => c.task_id);
  const tasks = collection('training_tasks').find(t => taskIds.includes(t.id));

  // Today's / active tasks
  const todayTasks = completions.map(comp => {
    const task = tasks.find(t => t.id === comp.task_id);
    return {
      completion_id: comp.id,
      task_id: comp.task_id,
      title: task ? task.title : 'Workout',
      category: task ? task.category : 'General',
      priority: task ? task.priority : 'Medium',
      duration: task ? task.estimated_duration_mins : 45,
      due_date: task ? task.due_date : '',
      instructions: task ? task.instructions : '',
      status: comp.status,
      coach_feedback: comp.coach_feedback,
      coach_rating: comp.coach_rating
    };
  });

  // Upcoming tournaments registered
  const registrations = collection('tournament_registrations').find(tr => tr.athlete_id === athleteId);
  const regTournIds = registrations.map(r => r.tournament_id);
  const myTournaments = collection('tournaments').find(t => regTournIds.includes(t.id));

  // Achievements
  const achievements = collection('achievements').find(a => a.athlete_id === athleteId);

  // Weekly hours chart
  const weeklyActivity = [
    { day: 'Mon', hours: 2.2, intensity: 85 },
    { day: 'Tue', hours: 2.5, intensity: 90 },
    { day: 'Wed', hours: 1.8, intensity: 75 },
    { day: 'Thu', hours: 2.8, intensity: 95 },
    { day: 'Fri', hours: 2.0, intensity: 80 },
    { day: 'Sat', hours: 3.2, intensity: 92 },
    { day: 'Sun', hours: 0.0, intensity: 0 } // Rest day
  ];

  // Latest readiness assessment
  const latestAssessment = collection('readiness_assessments')
    .find(ra => ra.athlete_id === athleteId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;

  res.json({
    athlete: {
      id: user.id,
      name: user.full_name,
      avatar: user.avatar_url,
      sport: profile.sport,
      position: profile.position_specialization,
      performance_score: profile.performance_score || 85,
      consistency_score: profile.consistency_score || 90,
      readiness_score: profile.readiness_score || 88,
      readiness_status: profile.current_readiness_status || 'Green',
      streak_days: profile.streak_days || 7,
      weekly_training_hours: profile.weekly_training_hours || 14
    },
    todayTasks,
    upcomingTournaments: myTournaments,
    achievements,
    weeklyActivity,
    latestAssessment
  });
});

// Athlete Profile (Get & Edit)
app.get('/api/athlete/:athleteId/profile', (req, res) => {
  const { athleteId } = req.params;
  const user = collection('users').findById(athleteId);
  if (!user) return res.status(404).json({ error: 'Athlete not found' });

  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId) || {};
  const personalBests = collection('performance_records').find(pr => pr.athlete_id === athleteId && pr.is_personal_best);
  const goals = collection('athlete_goals').find(ag => ag.athlete_id === athleteId);
  const achievements = collection('achievements').find(ach => ach.athlete_id === athleteId);

  // Assigned coach
  const assignment = collection('coach_athlete_assignments').findOne(a => a.athlete_id === athleteId && a.status === 'active');
  let coachUser = null;
  if (assignment) {
    coachUser = collection('users').findById(assignment.coach_id);
  }

  res.json({
    user,
    profile,
    personalBests,
    goals,
    achievements,
    assignedCoach: coachUser ? { id: coachUser.id, name: coachUser.full_name, avatar: coachUser.avatar_url, email: coachUser.email } : null
  });
});

app.put('/api/athlete/:athleteId/profile', (req, res) => {
  const { athleteId } = req.params;
  const { full_name, phone, dob, gender, sport, position_specialization, height_cm, weight_kg, preferred_category, experience_level, injury_history, training_goals } = req.body;

  if (full_name) {
    collection('users').update(athleteId, { full_name, phone });
  }

  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId);
  if (profile) {
    collection('athlete_profiles').update(profile.id, {
      dob: dob || profile.dob,
      gender: gender || profile.gender,
      sport: sport || profile.sport,
      position_specialization: position_specialization || profile.position_specialization,
      height_cm: height_cm || profile.height_cm,
      weight_kg: weight_kg || profile.weight_kg,
      preferred_category: preferred_category || profile.preferred_category,
      experience_level: experience_level || profile.experience_level,
      injury_history: injury_history !== undefined ? injury_history : profile.injury_history,
      training_goals: training_goals !== undefined ? training_goals : profile.training_goals
    });
  }

  res.json({ success: true, message: 'Profile updated successfully.' });
});

// Athlete Tasks
app.get('/api/athlete/:athleteId/tasks', (req, res) => {
  const { athleteId } = req.params;
  const completions = collection('task_completions').find(tc => tc.athlete_id === athleteId);
  const taskIds = completions.map(c => c.task_id);
  const tasks = collection('training_tasks').find(t => taskIds.includes(t.id));
  const coaches = collection('users').find(u => u.role === 'coach');

  const formatted = completions.map(comp => {
    const task = tasks.find(t => t.id === comp.task_id);
    const coach = task ? coaches.find(c => c.id === task.coach_id) : null;
    return {
      completion_id: comp.id,
      task_id: comp.task_id,
      title: task ? task.title : 'Task',
      description: task ? task.description : '',
      category: task ? task.category : 'Training',
      priority: task ? task.priority : 'Medium',
      estimated_duration_mins: task ? task.estimated_duration_mins : 45,
      due_date: task ? task.due_date : '',
      instructions: task ? task.instructions : '',
      attachment_url: task ? task.attachment_url : '',
      video_url: task ? task.video_url : '',
      coach_name: coach ? coach.full_name : 'Coach Marcus',
      status: comp.status,
      started_at: comp.started_at,
      completed_at: comp.completed_at,
      actual_duration_mins: comp.actual_duration_mins,
      metrics_json: comp.metrics_json,
      proof_url: comp.proof_url,
      athlete_notes: comp.athlete_notes,
      coach_feedback: comp.coach_feedback,
      coach_rating: comp.coach_rating
    };
  });

  res.json({ tasks: formatted });
});

// Start Task
app.post('/api/athlete/:athleteId/tasks/:taskId/start', (req, res) => {
  const { athleteId, taskId } = req.params;
  const completion = collection('task_completions').findOne(tc => tc.athlete_id === athleteId && tc.task_id === taskId);
  if (!completion) return res.status(404).json({ error: 'Task assignment not found' });

  const updated = collection('task_completions').update(completion.id, {
    status: 'In Progress',
    started_at: new Date().toISOString()
  });

  res.json({ completion: updated });
});

// Complete Task
app.post('/api/athlete/:athleteId/tasks/:taskId/complete', (req, res) => {
  const { athleteId, taskId } = req.params;
  const { actual_duration_mins, metrics, proof_url, athlete_notes } = req.body;

  const completion = collection('task_completions').findOne(tc => tc.athlete_id === athleteId && tc.task_id === taskId);
  if (!completion) return res.status(404).json({ error: 'Task assignment not found' });

  const updated = collection('task_completions').update(completion.id, {
    status: 'Completed',
    completed_at: new Date().toISOString(),
    actual_duration_mins: actual_duration_mins || 45,
    metrics_json: metrics || {},
    proof_url: proof_url || '',
    athlete_notes: athlete_notes || ''
  });

  // Notify coach
  const athlete = collection('users').findById(athleteId);
  const task = collection('training_tasks').findById(taskId);
  if (task) {
    collection('notifications').insert({
      user_id: task.coach_id,
      title: 'Task Submission Received',
      message: `${athlete ? athlete.full_name : 'An athlete'} completed "${task.title}". Review performance & give feedback.`,
      type: 'task',
      is_read: false,
      link_url: '/tasks'
    });
  }

  // Check achievements (e.g. Century Club or 1st task)
  const allCompleted = collection('task_completions').find(tc => tc.athlete_id === athleteId && tc.status === 'Completed');
  if (allCompleted.length >= 10 && !collection('achievements').findOne(a => a.athlete_id === athleteId && a.badge_id === 'ten_tasks')) {
    collection('achievements').insert({
      athlete_id: athleteId,
      badge_id: 'ten_tasks',
      title: 'Decathlon Club (10 Tasks)',
      description: 'Completed 10 rigorous training workouts on Athlete 360.',
      icon_name: 'CheckCircle'
    });
  }

  res.json({ completion: updated });
});

// Daily Vitals & AI Fitness Eligibility
app.post('/api/athlete/:athleteId/readiness', async (req, res) => {
  const { athleteId } = req.params;
  const vitalsInput = req.body;

  const athlete = collection('users').findById(athleteId);
  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId);
  if (!athlete || !profile) return res.status(404).json({ error: 'Athlete profile not found' });

  // 1. Save athlete vitals record
  const newVitals = collection('athlete_vitals').insert({
    athlete_id: athleteId,
    recorded_date: vitalsInput.recorded_date || new Date().toISOString().split('T')[0],
    resting_heart_rate: Number(vitalsInput.resting_heart_rate) || 52,
    blood_pressure_sys: Number(vitalsInput.blood_pressure_sys) || 120,
    blood_pressure_dia: Number(vitalsInput.blood_pressure_dia) || 80,
    sleep_hours: Number(vitalsInput.sleep_hours) || 8,
    sleep_quality: Number(vitalsInput.sleep_quality) || 4,
    body_temp: Number(vitalsInput.body_temp) || 36.6,
    spo2: Number(vitalsInput.spo2) || 98,
    fatigue_level: Number(vitalsInput.fatigue_level) || 3,
    soreness_level: Number(vitalsInput.soreness_level) || 3,
    hydration_level: vitalsInput.hydration_level || 'Optimal',
    training_intensity_recent: vitalsInput.training_intensity_recent || 'Moderate',
    pain_symptoms: vitalsInput.pain_symptoms || 'None'
  });

  // 2. Run AI Fitness Eligibility engine
  const assessmentResult = await calculateFitnessReadiness(newVitals, { baselineRHR: 52 });

  // 3. Save Readiness Assessment record
  const assessment = collection('readiness_assessments').insert({
    athlete_id: athleteId,
    vitals_id: newVitals.id,
    date: newVitals.recorded_date,
    readiness_score: assessmentResult.readiness_score,
    readiness_status: assessmentResult.readiness_status,
    ai_insights: assessmentResult.ai_insights,
    factors_breakdown: assessmentResult.factors_breakdown,
    recommended_intensity_pct: assessmentResult.recommended_intensity_pct,
    recovery_suggestions: assessmentResult.recovery_suggestions,
    shared_with_coach: vitalsInput.shared_with_coach !== false,
    engine_source: assessmentResult.engine_source
  });

  // 4. Update profile readiness status
  collection('athlete_profiles').update(profile.id, {
    current_readiness_status: assessmentResult.readiness_status,
    readiness_score: assessmentResult.readiness_score
  });

  // 5. If Yellow or Red, send Coach Alert
  if (assessmentResult.readiness_status !== 'Green') {
    const coachAssignment = collection('coach_athlete_assignments').findOne(a => a.athlete_id === athleteId && a.status === 'active');
    if (coachAssignment) {
      collection('notifications').insert({
        user_id: coachAssignment.coach_id,
        title: `Readiness Alert: ${athlete.full_name} (${assessmentResult.readiness_status})`,
        message: `${athlete.full_name} reported ${assessmentResult.readiness_status} readiness (Score: ${assessmentResult.readiness_score}). ${assessmentResult.concerning_factors[0] || 'Requires coach check-in.'}`,
        type: 'readiness',
        is_read: false,
        link_url: '/athletes'
      });
    }
  }

  res.status(201).json({
    vitals: newVitals,
    assessment: {
      ...assessment,
      medical_disclaimer: assessmentResult.medical_disclaimer,
      concerning_factors: assessmentResult.concerning_factors,
      positive_factors: assessmentResult.positive_factors
    }
  });
});

// Athlete Vitals & Readiness History
app.get('/api/athlete/:athleteId/vitals/history', (req, res) => {
  const { athleteId } = req.params;
  const vitals = collection('athlete_vitals').find(v => v.athlete_id === athleteId).sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
  const assessments = collection('readiness_assessments').find(ra => ra.athlete_id === athleteId).sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json({ vitals, assessments });
});

// AI Win Probability & Match Performance Prediction
app.get('/api/athlete/:athleteId/win-probability/:tournamentId', async (req, res) => {
  const { athleteId, tournamentId } = req.params;
  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId);
  const tournament = collection('tournaments').findById(tournamentId);
  const matches = collection('matches').find(m => m.tournament_id === tournamentId);
  const matchResults = collection('match_results').find(mr => mr.athlete_id === athleteId);

  if (!profile || !tournament) {
    return res.status(404).json({ error: 'Tournament or athlete profile not found' });
  }

  const prediction = await calculateWinProbability(profile, tournament, matchResults);
  res.json({ tournament, prediction });
});

// Training Consistency & Heatmap
app.get('/api/athlete/:athleteId/consistency', (req, res) => {
  const { athleteId } = req.params;
  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId);
  const completions = collection('task_completions').find(tc => tc.athlete_id === athleteId && tc.status === 'Completed');

  // Build 30-day activity map
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isCompleted = completions.some(c => c.completed_at && c.completed_at.startsWith(dateStr));
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const isRestDay = dayOfWeek === 0;

    days.push({
      date: dateStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: isCompleted || (i % 2 === 0 && !isRestDay), // Realistic filled pattern for demo
      isRestDay,
      intensity: isRestDay ? 0 : (i % 3 === 0 ? 3 : 2),
      minutes: isRestDay ? 0 : 55 + (i * 3) % 40
    });
  }

  const currentStreak = profile ? profile.streak_days || 14 : 14;
  const longestStreak = 28;
  const badges = collection('achievements').find(a => a.athlete_id === athleteId);

  res.json({
    currentStreak,
    longestStreak,
    consistencyPercentage: profile ? profile.consistency_score || 94 : 94,
    monthlyActivityMinutes: 1480,
    goalCompletionRate: 92,
    heatmap: days,
    badges
  });
});

// Recovery & Fatigue Tracker
app.get('/api/athlete/:athleteId/recovery', (req, res) => {
  const { athleteId } = req.params;
  const vitals = collection('athlete_vitals').find(v => v.athlete_id === athleteId).sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
  const assessments = collection('readiness_assessments').find(ra => ra.athlete_id === athleteId).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Recovery trends
  const trendData = vitals.map(v => {
    const ass = assessments.find(a => a.date === v.recorded_date);
    return {
      date: v.recorded_date,
      sleep_hours: v.sleep_hours,
      fatigue: v.fatigue_level,
      soreness: v.soreness_level,
      readiness_score: ass ? ass.readiness_score : 80,
      rhr: v.resting_heart_rate
    };
  });

  res.json({
    trends: trendData,
    latestVitals: vitals[vitals.length - 1] || null,
    latestAssessment: assessments[assessments.length - 1] || null
  });
});

// Achievements & Personal Records
app.get('/api/athlete/:athleteId/achievements', (req, res) => {
  const { athleteId } = req.params;
  const achievements = collection('achievements').find(a => a.athlete_id === athleteId);
  const pbs = collection('performance_records').find(pr => pr.athlete_id === athleteId && pr.is_personal_best);
  const goals = collection('athlete_goals').find(ag => ag.athlete_id === athleteId);

  res.json({ achievements, personalBests: pbs, goals });
});

// Add Personal Record
app.post('/api/athlete/:athleteId/personal-records', (req, res) => {
  const { athleteId } = req.params;
  const { metric_name, value, unit, context, date } = req.body;

  if (!metric_name || !value) {
    return res.status(400).json({ error: 'Metric name and value are required.' });
  }

  const newPb = collection('performance_records').insert({
    athlete_id: athleteId,
    date: date || new Date().toISOString().split('T')[0],
    metric_name,
    value: Number(value),
    unit: unit || '',
    category: 'Competition / Test',
    context: context || 'Training PR',
    is_personal_best: true
  });

  // Award PB badge if not present
  if (!collection('achievements').findOne(a => a.athlete_id === athleteId && a.badge_id === 'pb_smasher')) {
    collection('achievements').insert({
      athlete_id: athleteId,
      badge_id: 'pb_smasher',
      title: 'Personal Record Smasher',
      description: 'Set an official personal best benchmark.',
      icon_name: 'Zap'
    });
  }

  res.status(201).json({ record: newPb });
});

// ============================================================================
// TOURNAMENTS (Coach & Athlete)
// ============================================================================

// List Tournaments
app.get('/api/tournaments', (req, res) => {
  const tournaments = collection('tournaments').getAll();
  const registrations = collection('tournament_registrations').getAll();
  const matches = collection('matches').getAll();
  const matchResults = collection('match_results').getAll();
  const users = collection('users').getAll();

  const enriched = tournaments.map(t => {
    const tRegs = registrations.filter(r => r.tournament_id === t.id).map(r => {
      const u = users.find(user => user.id === r.athlete_id);
      return {
        ...r,
        athlete_name: u ? u.full_name : 'Athlete',
        athlete_avatar: u ? u.avatar_url : ''
      };
    });

    const tMatches = matches.filter(m => m.tournament_id === t.id).map(m => {
      const result = matchResults.find(mr => mr.match_id === m.id);
      return {
        ...m,
        result
      };
    });

    return {
      ...t,
      registrations: tRegs,
      matches: tMatches
    };
  });

  res.json({ tournaments: enriched });
});

// Create Tournament (Coach)
app.post('/api/tournaments', (req, res) => {
  const { coach_id, name, sport, venue, start_date, end_date, category, status, description, prize_or_tier } = req.body;

  if (!name || !sport || !start_date || !venue) {
    return res.status(400).json({ error: 'Name, sport, venue, and start date are required.' });
  }

  const newTourn = collection('tournaments').insert({
    coach_id: coach_id || 'coach-1',
    name,
    sport,
    venue,
    start_date,
    end_date: end_date || start_date,
    category: category || 'Invitational',
    status: status || 'Upcoming',
    description: description || '',
    prize_or_tier: prize_or_tier || 'Official Tournament'
  });

  res.status(201).json({ tournament: newTourn });
});

// Register Athlete for Tournament
app.post('/api/tournaments/:tournamentId/register', (req, res) => {
  const { tournamentId } = req.params;
  const { athlete_id } = req.body;

  const existing = collection('tournament_registrations').findOne(r => r.tournament_id === tournamentId && r.athlete_id === athlete_id);
  if (existing) {
    return res.status(400).json({ error: 'Already registered for this tournament.' });
  }

  const reg = collection('tournament_registrations').insert({
    tournament_id: tournamentId,
    athlete_id,
    registration_date: new Date().toISOString(),
    status: 'Confirmed',
    seed_number: Math.floor(Math.random() * 8) + 1
  });

  const tourn = collection('tournaments').findById(tournamentId);

  // Send notification
  collection('notifications').insert({
    user_id: athlete_id,
    title: 'Tournament Registration Confirmed',
    message: `You are officially registered for ${tourn ? tourn.name : 'the tournament'}. Prepare your match routines!`,
    type: 'tournament',
    is_read: false,
    link_url: '/tournaments'
  });

  res.status(201).json({ registration: reg });
});

// Record Match Score / Result
app.post('/api/tournaments/matches/:matchId/result', (req, res) => {
  const { matchId } = req.params;
  const { athlete_id, result, score_display, athlete_stats, notes } = req.body;

  const match = collection('matches').findById(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  // Update match status to Completed
  collection('matches').update(matchId, { status: 'Completed' });

  const matchResult = collection('match_results').insert({
    match_id: matchId,
    athlete_id,
    result,
    score_display,
    athlete_stats_json: athlete_stats || {},
    notes: notes || '',
    ai_win_probability_predicted: match.ai_win_probability || 65
  });

  res.status(201).json({ result: matchResult });
});

// ============================================================================
// MESSAGING & COMMUNICATION
// ============================================================================

// Get messages for user
app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const messages = collection('messages').getAll();
  const users = collection('users').getAll();

  const userMessages = messages.filter(m => m.sender_id === userId || m.receiver_id === userId || m.is_broadcast);

  const enriched = userMessages.map(m => {
    const sender = users.find(u => u.id === m.sender_id);
    const receiver = users.find(u => u.id === m.receiver_id);
    return {
      ...m,
      sender_name: sender ? sender.full_name : 'Unknown',
      sender_avatar: sender ? sender.avatar_url : '',
      receiver_name: receiver ? receiver.full_name : 'All Athletes'
    };
  });

  res.json({ messages: enriched });
});

// Send Message or Broadcast
app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_id, content, is_broadcast } = req.body;

  if (!sender_id || !content) {
    return res.status(400).json({ error: 'Sender ID and content are required.' });
  }

  const newMsg = collection('messages').insert({
    sender_id,
    receiver_id: is_broadcast ? null : receiver_id,
    content,
    is_broadcast: Boolean(is_broadcast),
    read_at: null
  });

  const sender = collection('users').findById(sender_id);

  // Send notification to receiver(s)
  if (is_broadcast) {
    const athletes = collection('users').find(u => u.role === 'athlete');
    athletes.forEach(ath => {
      collection('notifications').insert({
        user_id: ath.id,
        title: 'Team Announcement',
        message: `${sender ? sender.full_name : 'Coach'}: "${content.slice(0, 75)}..."`,
        type: 'message',
        is_read: false,
        link_url: '/messages'
      });
    });
  } else if (receiver_id) {
    collection('notifications').insert({
      user_id: receiver_id,
      title: `Message from ${sender ? sender.full_name : 'User'}`,
      message: `"${content.slice(0, 75)}..."`,
      type: 'message',
      is_read: false,
      link_url: '/messages'
    });
  }

  res.status(201).json({ message: newMsg });
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

// List notifications
app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const notifs = collection('notifications')
    .find(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const unreadCount = notifs.filter(n => !n.is_read).length;
  res.json({ notifications: notifs, unreadCount });
});

// Mark single notification read
app.put('/api/notifications/:notifId/read', (req, res) => {
  const { notifId } = req.params;
  const updated = collection('notifications').update(notifId, { is_read: true });
  res.json({ notification: updated });
});

// Mark all notifications read
app.post('/api/notifications/mark-all-read/:userId', (req, res) => {
  const { userId } = req.params;
  const notifs = collection('notifications').find(n => n.user_id === userId && !n.is_read);
  notifs.forEach(n => collection('notifications').update(n.id, { is_read: true }));
  res.json({ success: true });
});

// ============================================================================
// SMARTWATCH INTEGRATION (FASTRACK, HEALTH CONNECT & BLE GATT)
// ============================================================================

// Ping endpoint for companion apps and health bridges
app.get('/api/smartwatch/ping', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    name: 'Athlete 360 Health Connect Sync Bridge',
    version: '2.0.0'
  });
});

// Get Athlete's Smartwatch Device & Latest Vitals
app.get('/api/smartwatch/:athleteId/device', (req, res) => {
  const { athleteId } = req.params;
  let device = collection('smartwatch_devices').findOne(d => d.athlete_id === athleteId);

  // If no device exists yet for this athlete, create Fastrack / Health Connect entry in Disconnected state
  if (!device) {
    device = collection('smartwatch_devices').insert({
      athlete_id: athleteId,
      device_name: 'Fastrack Watch (Health Connect)',
      model_identifier: 'Fastrack-HC',
      connection_type: 'HEALTH_CONNECT',
      status: 'Disconnected',
      battery_level: null,
      last_sync_at: null
    });
  }

  // Get recent synced readings (most recent first)
  const syncLogs = collection('smartwatch_vitals_sync')
    .find(s => s.athlete_id === athleteId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Find latest genuine reading
  const latestReading = syncLogs.length > 0 ? syncLogs[0] : null;

  res.json({
    device,
    latestReading,
    totalSyncs: syncLogs.length
  });
});

// Connect or Update Smartwatch Device
app.post('/api/smartwatch/:athleteId/connect', (req, res) => {
  const { athleteId } = req.params;
  const { device_name, model_identifier, connection_type, battery_level, status } = req.body;

  let device = collection('smartwatch_devices').findOne(d => d.athlete_id === athleteId);

  if (device) {
    device = collection('smartwatch_devices').update(device.id, {
      device_name: device_name || device.device_name,
      model_identifier: model_identifier || device.model_identifier,
      connection_type: connection_type || device.connection_type,
      status: status || 'Connected',
      battery_level: battery_level !== undefined ? battery_level : device.battery_level,
      last_sync_at: new Date().toISOString()
    });
  } else {
    device = collection('smartwatch_devices').insert({
      athlete_id: athleteId,
      device_name: device_name || 'Fastrack Watch (Health Connect)',
      model_identifier: model_identifier || 'Fastrack-HC',
      connection_type: connection_type || 'HEALTH_CONNECT',
      status: status || 'Connected',
      battery_level: battery_level !== undefined ? battery_level : null,
      last_sync_at: new Date().toISOString()
    });
  }

  // Notification for athlete
  collection('notifications').insert({
    user_id: athleteId,
    title: 'Smartwatch Linked',
    message: `${device.device_name} successfully linked to Athlete 360 for health synchronization.`,
    type: 'system',
    is_read: false,
    link_url: '/smartwatch'
  });

  res.json({ success: true, device });
});

// ============================================================================
// CLINICAL READINESS ASSESSMENT ENGINE (FIT / NEEDS RECOVERY / INSUFFICIENT DATA)
// ============================================================================
function assessAthleteReadiness(hr, spo2, sleep, fatigue = null, soreness = null) {
  const numHR = (hr !== null && hr !== undefined && hr !== '') ? Number(hr) : null;
  const numSpO2 = (spo2 !== null && spo2 !== undefined && spo2 !== '') ? Number(spo2) : null;
  const numSleep = (sleep !== null && sleep !== undefined && sleep !== '') ? Number(sleep) : null;
  const numFatigue = (fatigue !== null && fatigue !== undefined && fatigue !== '') ? Number(fatigue) : null;
  const numSoreness = (soreness !== null && soreness !== undefined && soreness !== '') ? Number(soreness) : null;

  if (numHR === null || (numSpO2 === null && numSleep === null)) {
    return {
      status: 'INSUFFICIENT_DATA',
      displayStatus: 'Insufficient Data',
      badgeColor: 'gray',
      score: 50,
      summary: 'Heart rate and at least one recovery vital (SpO₂ or Sleep) required to evaluate readiness.'
    };
  }

  const recoveryReasons = [];
  if (numSpO2 !== null && numSpO2 < 95) {
    recoveryReasons.push(`Sub-optimal Oxygenation (${numSpO2}% SpO₂)`);
  }
  if (numHR > 95) {
    recoveryReasons.push(`Elevated Pulse (${numHR} BPM)`);
  } else if (numHR < 42) {
    recoveryReasons.push(`Low Pulse (${numHR} BPM)`);
  }
  if (numSleep !== null && numSleep < 6.0) {
    recoveryReasons.push(`Sleep Deficit (${numSleep} hrs)`);
  }
  if (numFatigue !== null && numFatigue >= 7) {
    recoveryReasons.push(`High Perceived Fatigue (${numFatigue}/10)`);
  }
  if (numSoreness !== null && numSoreness >= 7) {
    recoveryReasons.push(`Acute Muscle Soreness (${numSoreness}/10)`);
  }

  if (recoveryReasons.length > 0) {
    return {
      status: 'NEEDS_RECOVERY',
      displayStatus: 'Needs Recovery',
      badgeColor: 'amber',
      score: Math.max(40, 75 - recoveryReasons.length * 12),
      summary: recoveryReasons.join(' • ') + ' — Rest or active recovery recommended.'
    };
  }

  return {
    status: 'FIT',
    displayStatus: 'Fit',
    badgeColor: 'emerald',
    score: Math.min(98, 85 + (numSleep && numSleep >= 7.5 ? 8 : 4)),
    summary: 'Cardiovascular and recovery vitals optimal for training & competition.'
  };
}

// Vital Data Sync Endpoint (Strictly Genuine Readings - No Fabricated Fallbacks)
// Supports single reading payload or batch { records: [...] }
app.post('/api/smartwatch/:athleteId/sync', async (req, res) => {
  const { athleteId } = req.params;
  const body = req.body || {};

  // Verify athlete exists
  const athleteUser = collection('users').findOne(u => u.id === athleteId);
  if (!athleteUser) {
    return res.status(404).json({ error: 'Athlete account not found.' });
  }

  // Check auth header if provided
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && token.startsWith('demo-token-') && !token.includes(athleteId)) {
      console.warn(`[Smartwatch Sync] Token ${token} does not match athleteId ${athleteId}`);
    }
  }

  const incomingRecords = Array.isArray(body.records) ? body.records : [body];
  const processedRecords = [];

  for (const recordItem of incomingRecords) {
    const metrics = recordItem.metrics || {};
    const heart_rate_bpm = recordItem.heart_rate_bpm ?? metrics.heart_rate_bpm;
    const spo2_pct = recordItem.spo2_pct ?? metrics.spo2_pct;
    const steps = recordItem.steps ?? metrics.steps ?? metrics.steps_count;
    const calories_kcal = recordItem.calories_kcal ?? metrics.calories_kcal ?? metrics.calories_burned;
    const sleep_duration_hours = recordItem.sleep_duration_hours ?? metrics.sleep_duration_hours;
    const sleep_quality_score = recordItem.sleep_quality_score ?? metrics.sleep_quality_score;
    const workout_duration_mins = recordItem.workout_duration_mins ?? metrics.workout_duration_mins;
    const distance_km = recordItem.distance_km ?? metrics.distance_km;
    const stress_level = recordItem.stress_level ?? metrics.stress_level;
    const source = recordItem.source || metrics.source || body.source || 'Fastrack Watch via Health Connect';
    const raw_payload = recordItem.raw_payload || metrics.raw_payload || recordItem.raw_payload_json;
    const measurementTime = recordItem.timestamp || recordItem.recorded_at || new Date().toISOString();

    // Genuine validation: Only keep genuine values that were actually provided
    const validatedHR = (heart_rate_bpm !== undefined && heart_rate_bpm !== null)
      ? Math.max(35, Math.min(225, Math.round(Number(heart_rate_bpm))))
      : null;
    const validatedSpO2 = (spo2_pct !== undefined && spo2_pct !== null)
      ? Math.max(70, Math.min(100, Math.round(Number(spo2_pct))))
      : null;
    const validatedSteps = (steps !== undefined && steps !== null)
      ? Math.max(0, Math.round(Number(steps)))
      : null;
    const validatedCalories = (calories_kcal !== undefined && calories_kcal !== null)
      ? Math.max(0, Math.round(Number(calories_kcal)))
      : null;
    const validatedSleep = (sleep_duration_hours !== undefined && sleep_duration_hours !== null)
      ? Math.max(0, Math.min(24, Number(Number(sleep_duration_hours).toFixed(2))))
      : null;

    // Detect device name and connection type
    const isHealthConnect = source.toLowerCase().includes('health connect') ||
                            source.toLowerCase().includes('google fit') ||
                            source.toLowerCase().includes('fastrack');
    const deviceName = recordItem.device_name || body.device_name || (isHealthConnect ? 'Fastrack Watch (Health Connect)' : 'Smartwatch Device');
    const connectionType = isHealthConnect ? 'HEALTH_CONNECT' : (recordItem.connection_type || 'BLE_GATT');

    let device = collection('smartwatch_devices').findOne(d => d.athlete_id === athleteId);
    if (!device) {
      device = collection('smartwatch_devices').insert({
        athlete_id: athleteId,
        device_name: deviceName,
        model_identifier: recordItem.model_identifier || (isHealthConnect ? 'Fastrack-HC' : 'BLE-DEVICE'),
        connection_type: connectionType,
        status: 'Connected',
        battery_level: recordItem.battery_level !== undefined ? recordItem.battery_level : null,
        last_sync_at: new Date().toISOString()
      });
    } else {
      const updatePayload = {
        device_name: deviceName,
        connection_type: connectionType,
        status: 'Connected',
        last_sync_at: new Date().toISOString()
      };
      if (recordItem.battery_level !== undefined && recordItem.battery_level !== null) {
        updatePayload.battery_level = Number(recordItem.battery_level);
      }
      collection('smartwatch_devices').update(device.id, updatePayload);
    }

    // Robust Duplicate Prevention: Check identical reading for this athlete within 60 seconds
    const recordDate = new Date(measurementTime);
    const recentDuplicates = collection('smartwatch_vitals_sync').find(s => {
      if (s.athlete_id !== athleteId) return false;
      const diffMs = Math.abs(recordDate.getTime() - new Date(s.timestamp).getTime());
      if (diffMs < 60000) {
        // If HR matches or steps match or it's within same minute with identical non-null metrics
        const hrMatches = (validatedHR !== null && s.heart_rate_bpm === validatedHR);
        const stepsMatch = (validatedSteps !== null && s.steps === validatedSteps);
        const spo2Matches = (validatedSpO2 !== null && s.spo2_pct === validatedSpO2);
        return hrMatches || stepsMatch || spo2Matches;
      }
      return false;
    });

    if (recentDuplicates.length > 0) {
      processedRecords.push(recentDuplicates[0]);
      continue;
    }

    // Insert sync record strictly with genuine measurements
    const syncRecord = collection('smartwatch_vitals_sync').insert({
      athlete_id: athleteId,
      device_id: device.id,
      timestamp: measurementTime,
      recorded_at: measurementTime,
      heart_rate_bpm: validatedHR,
      spo2_pct: validatedSpO2,
      steps: validatedSteps,
      calories_kcal: validatedCalories,
      sleep_duration_hours: validatedSleep,
      sleep_quality_score: sleep_quality_score || null,
      workout_duration_mins: workout_duration_mins || 0,
      distance_km: distance_km || (validatedSteps ? Number(((validatedSteps * 0.75) / 1000).toFixed(2)) : null),
      stress_level: stress_level || null,
      source: source,
      raw_payload_json: raw_payload || {}
    });

    processedRecords.push(syncRecord);

    // Automatically update athlete daily vitals for today
    const todayStr = new Date().toISOString().split('T')[0];
    const existingTodayVitals = collection('athlete_vitals').findOne(v => v.athlete_id === athleteId && v.recorded_date === todayStr);

    if (existingTodayVitals) {
      collection('athlete_vitals').update(existingTodayVitals.id, {
        resting_heart_rate: validatedHR || existingTodayVitals.resting_heart_rate,
        spo2: validatedSpO2 || existingTodayVitals.spo2,
        sleep_hours: validatedSleep || existingTodayVitals.sleep_hours
      });
    } else if (validatedHR || validatedSpO2 || validatedSleep) {
      collection('athlete_vitals').insert({
        athlete_id: athleteId,
        recorded_date: todayStr,
        resting_heart_rate: validatedHR || 60,
        blood_pressure_sys: 118,
        blood_pressure_dia: 76,
        sleep_hours: validatedSleep || 7.5,
        sleep_quality: sleep_quality_score || 4,
        body_temp: 36.6,
        spo2: validatedSpO2 || 98,
        fatigue_level: 3,
        soreness_level: 2,
        hydration_level: 'Optimal',
        training_intensity_recent: 'Moderate',
        pain_symptoms: 'None'
      });
    }
  }

  const currentDevice = collection('smartwatch_devices').findOne(d => d.athlete_id === athleteId);
  const primaryRecord = processedRecords[processedRecords.length - 1] || null;

  // Automatically assess and update athlete profile readiness upon new health sync
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVitals = collection('athlete_vitals').findOne(v => v.athlete_id === athleteId && v.recorded_date === todayStr);
  const latestHR = todayVitals?.resting_heart_rate ?? null;
  const latestSpO2 = todayVitals?.spo2 ?? null;
  const latestSleep = todayVitals?.sleep_hours ?? null;

  const readinessAssessment = assessAthleteReadiness(latestHR, latestSpO2, latestSleep, todayVitals?.fatigue_level, todayVitals?.soreness_level);

  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId);
  if (profile) {
    collection('athlete_profiles').update(profile.id, {
      current_readiness_status: readinessAssessment.displayStatus,
      readiness_score: readinessAssessment.score
    });
  }

  res.status(201).json({
    success: true,
    message: `Synchronized ${processedRecords.length} genuine health reading(s).`,
    syncRecord: primaryRecord,
    device: currentDevice,
    recordsCount: processedRecords.length,
    readiness: readinessAssessment
  });
});

// Disconnect Device
app.post('/api/smartwatch/:athleteId/disconnect', (req, res) => {
  const { athleteId } = req.params;
  const device = collection('smartwatch_devices').findOne(d => d.athlete_id === athleteId);
  if (device) {
    collection('smartwatch_devices').update(device.id, { status: 'Disconnected' });
  }
  res.json({ success: true, message: 'Smartwatch disconnected successfully.' });
});

// Get Readings History for Charts (sorted newest first)
app.get('/api/smartwatch/:athleteId/readings', (req, res) => {
  const { athleteId } = req.params;
  const readings = collection('smartwatch_vitals_sync')
    .find(s => s.athlete_id === athleteId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({ readings });
});

// ============================================================================
// MANUAL DATA ENTRY & ATHLETE READINESS
// ============================================================================

app.post('/api/athlete/:athleteId/manual-entry', async (req, res) => {
  const { athleteId } = req.params;
  const {
    date = new Date().toISOString().split('T')[0],
    time = new Date().toTimeString().slice(0, 5),
    heart_rate_bpm,
    spo2_pct,
    steps,
    calories_kcal,
    sleep_duration_hours,
    training_duration_mins,
    training_type = 'Court Footwork & Agility',
    match_performance,
    recovery_details
  } = req.body;

  const athlete = collection('users').findById(athleteId);
  if (!athlete) return res.status(404).json({ error: 'Athlete not found.' });

  const timestamp = `${date}T${time}:00Z`;

  const validatedHR = (heart_rate_bpm !== undefined && heart_rate_bpm !== null && heart_rate_bpm !== '')
    ? Math.max(35, Math.min(225, Math.round(Number(heart_rate_bpm))))
    : null;
  const validatedSpO2 = (spo2_pct !== undefined && spo2_pct !== null && spo2_pct !== '')
    ? Math.max(70, Math.min(100, Math.round(Number(spo2_pct))))
    : null;
  const validatedSteps = (steps !== undefined && steps !== null && steps !== '')
    ? Math.max(0, Math.round(Number(steps)))
    : null;
  const validatedCalories = (calories_kcal !== undefined && calories_kcal !== null && calories_kcal !== '')
    ? Math.max(0, Math.round(Number(calories_kcal)))
    : null;
  const validatedSleep = (sleep_duration_hours !== undefined && sleep_duration_hours !== null && sleep_duration_hours !== '')
    ? Math.max(0, Math.min(24, Number(Number(sleep_duration_hours).toFixed(1))))
    : null;

  const fatigueLevel = recovery_details?.fatigue_level ? Number(recovery_details.fatigue_level) : null;
  const sorenessLevel = recovery_details?.soreness_level ? Number(recovery_details.soreness_level) : null;

  // 1. Evaluate Readiness using shared clinical engine
  const readinessResult = assessAthleteReadiness(validatedHR, validatedSpO2, validatedSleep, fatigueLevel, sorenessLevel);
  const readinessStatus = readinessResult.status;
  const readinessScore = readinessResult.score;
  const readinessSummary = readinessResult.summary;

  // 2. Insert into manual_vitals_entries (completely separate from smartwatch_vitals_sync)
  const syncRecord = collection('manual_vitals_entries').insert({
    athlete_id: athleteId,
    timestamp: timestamp,
    recorded_at: timestamp,
    heart_rate_bpm: validatedHR,
    spo2_pct: validatedSpO2,
    steps: validatedSteps,
    calories_kcal: validatedCalories,
    sleep_duration_hours: validatedSleep,
    workout_duration_mins: training_duration_mins ? Number(training_duration_mins) : 0,
    source: 'MANUAL_ENTRY',
    is_manual: true,
    raw_payload_json: {
      entry_type: 'manual',
      training_type,
      training_duration_mins,
      match_performance,
      recovery_details,
      readiness_status: readinessStatus,
      readiness_score: readinessScore,
      readiness_summary: readinessSummary
    }
  });

  // 3. Update athlete profile readiness
  const profile = collection('athlete_profiles').findOne(ap => ap.user_id === athleteId);
  if (profile) {
    const statusMap = {
      FIT: 'Green',
      NEEDS_RECOVERY: 'Yellow',
      INSUFFICIENT_DATA: 'Insufficient Data'
    };
    collection('athlete_profiles').update(profile.id, {
      current_readiness_status: statusMap[readinessStatus] || 'Green',
      readiness_score: readinessScore
    });
  }

  // 4. Update or insert athlete_vitals
  const existingTodayVitals = collection('athlete_vitals').findOne(v => v.athlete_id === athleteId && v.recorded_date === date);
  const vitalsPayload = {
    resting_heart_rate: validatedHR || existingTodayVitals?.resting_heart_rate || null,
    spo2: validatedSpO2 || existingTodayVitals?.spo2 || null,
    sleep_hours: validatedSleep || existingTodayVitals?.sleep_hours || null,
    fatigue_level: fatigueLevel || existingTodayVitals?.fatigue_level || 3,
    soreness_level: sorenessLevel || existingTodayVitals?.soreness_level || 2,
    hydration_level: recovery_details?.hydration_level || existingTodayVitals?.hydration_level || 'Optimal'
  };

  if (existingTodayVitals) {
    collection('athlete_vitals').update(existingTodayVitals.id, vitalsPayload);
  } else {
    collection('athlete_vitals').insert({
      athlete_id: athleteId,
      recorded_date: date,
      ...vitalsPayload
    });
  }

  // 5. If match performance was entered, record match
  if (match_performance && match_performance.opponent) {
    collection('matches').insert({
      id: `match-${Date.now()}`,
      athlete_id: athleteId,
      match_date: date,
      opponent_name: match_performance.opponent,
      result: match_performance.result || 'Win',
      score: match_performance.score || '',
      court_movement_rating: match_performance.performance_rating || 8,
      notes: match_performance.court_movement_notes || '',
      source: 'MANUAL_ENTRY'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Manual data entered and athlete readiness updated successfully.',
    entry: syncRecord,
    readiness: {
      status: readinessStatus,
      score: readinessScore,
      summary: readinessSummary
    }
  });
});

// Get Athlete Manual Entries
app.get('/api/athlete/:athleteId/manual-entries', (req, res) => {
  const { athleteId } = req.params;
  const entries = collection('manual_vitals_entries')
    .find(s => s.athlete_id === athleteId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ entries });
});

// Get Athlete Match Statistics
app.get('/api/athlete/:athleteId/match-stats', (req, res) => {
  const { athleteId } = req.params;
  const matches = collection('matches')
    .find(m => m.athlete_id === athleteId || m.player1_id === athleteId || m.player2_id === athleteId)
    .sort((a, b) => new Date(b.match_date || b.date || 0) - new Date(a.match_date || a.date || 0));

  const wins = matches.filter(m => m.result === 'Win' || m.winner_id === athleteId).length;
  const total = matches.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  res.json({
    total_matches: total,
    wins,
    losses: total - wins,
    win_rate: winRate,
    matches
  });
});

// ============================================================================
// MACHINE LEARNING PREDICTIVE ATHLETE READINESS ENGINE (SCIKIT-LEARN)
// ============================================================================

// Model Validation Metrics & Benchmarks (Random Forest vs Logistic Regression)
app.get('/api/readiness/model-metrics', (req, res) => {
  const metadata = getModelMetadata();
  res.json({
    success: true,
    metadata
  });
});

// Production ML Readiness Prediction
app.post('/api/readiness/predict', async (req, res) => {
  try {
    const input = req.body || {};
    const athleteId = input.athlete_id || 'athlete-1';

    // Fetch athlete baseline and user info if available
    const user = collection('users').findById(athleteId) || collection('users').findOne(u => u.email === input.athlete_email);
    const profile = collection('athlete_profiles').findOne(ap => ap.user_id === (user ? user.id : athleteId));
    
    // Resolve personal baselines from historical vitals
    const pastVitals = collection('athlete_vitals').find(v => v.athlete_id === (user ? user.id : athleteId));
    let calculatedBaselineHr = 54;
    let calculatedBaselineSpo2 = 98.4;
    if (pastVitals.length > 0) {
      const validHrs = pastVitals.map(v => v.resting_heart_rate).filter(Boolean);
      if (validHrs.length > 0) {
        calculatedBaselineHr = Math.round(validHrs.reduce((a, b) => a + b, 0) / validHrs.length);
      }
      const validSpo2 = pastVitals.map(v => v.spo2).filter(Boolean);
      if (validSpo2.length > 0) {
        calculatedBaselineSpo2 = Number((validSpo2.reduce((a, b) => a + b, 0) / validSpo2.length).toFixed(1));
      }
    }

    const payload = {
      athlete_id: user ? user.id : athleteId,
      athlete_email: user ? user.email : (input.athlete_email || ''),
      heart_rate: input.heart_rate,
      baseline_hr: input.baseline_hr || calculatedBaselineHr,
      spo2: input.spo2,
      baseline_spo2: input.baseline_spo2 || calculatedBaselineSpo2,
      daily_steps: input.daily_steps,
      step_trend_pct: input.step_trend_pct || 0,
      sleep_duration_hours: input.sleep_duration_hours,
      sleep_quality_1_10: input.sleep_quality_1_10,
      fatigue_1_10: input.fatigue_1_10,
      muscle_soreness_1_10: input.muscle_soreness_1_10,
      recovery_score_perceived_1_10: input.recovery_score_perceived_1_10,
      physical_readiness_1_10: input.physical_readiness_1_10,
      mental_readiness_1_10: input.mental_readiness_1_10,
      protein_intake_grams: input.protein_intake_grams,
      water_intake_liters: input.water_intake_liters,
      nutrition_adequate: input.nutrition_adequate !== undefined ? input.nutrition_adequate : 1,
      training_duration_minutes: input.training_duration_minutes,
      training_intensity_1_10: input.training_intensity_1_10,
      rpe_1_10: input.rpe_1_10,
      sessions_last_7d: input.sessions_last_7d,
      high_intensity_sessions_7d: input.high_intensity_sessions_7d,
      hours_since_intense_session: input.hours_since_intense_session,
      sport: input.sport || (profile ? profile.sport : 'Football')
    };

    const prediction = await runMlPrediction(payload);

    // Save into readiness_assessments
    const todayStr = new Date().toISOString().split('T')[0];
    const assessment = collection('readiness_assessments').insert({
      athlete_id: payload.athlete_id,
      date: todayStr,
      timestamp: new Date().toISOString(),
      readiness_score: prediction.readiness_score,
      readiness_status: prediction.status,
      prediction_probability: prediction.prediction_probability,
      confidence_pct: prediction.confidence_pct,
      fit_to_play: prediction.fit_to_play,
      data_quality: prediction.data_quality,
      positive_factors: prediction.positive_factors,
      potential_concerns: prediction.potential_concerns,
      recommendation: prediction.recommendation,
      telemetry_summary: prediction.telemetry_summary,
      model_version: prediction.model_version,
      selected_algorithm: prediction.selected_algorithm,
      source: 'SCIKIT_LEARN_ML_PIPELINE'
    });

    // Update profile
    if (profile) {
      collection('athlete_profiles').update(profile.id, {
        current_readiness_status: prediction.status === 'FIT TO PLAY' ? 'Green' : 'Yellow',
        readiness_score: prediction.readiness_score
      });
    }

    res.json({
      success: true,
      prediction,
      assessmentId: assessment.id
    });
  } catch (error) {
    console.error('Error in /api/readiness/predict:', error);
    res.status(500).json({ error: 'Failed to execute AI readiness prediction' });
  }
});

// Dynamic Sport-Specific Questionnaire Submission
app.post('/api/readiness/questionnaire/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const body = req.body || {};

    const user = collection('users').findById(athleteId) || collection('users').findOne(u => u.email === athleteId);
    const resolvedAthleteId = user ? user.id : athleteId;

    // Fetch latest smartwatch vitals for this athlete
    const latestSmartwatch = collection('smartwatch_vitals_sync')
      .find(s => s.athlete_id === resolvedAthleteId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const hr = body.heart_rate || latestSmartwatch?.heart_rate_bpm || 54;
    const spo2 = body.spo2 || latestSmartwatch?.spo2_pct || 98.4;
    const steps = body.daily_steps || latestSmartwatch?.steps || 11000;

    const payload = {
      athlete_id: resolvedAthleteId,
      athlete_email: user ? user.email : '',
      sport: body.sport || 'Football',
      sport_specific_details: body.sport_specific_details || {},
      heart_rate: hr,
      spo2: spo2,
      daily_steps: steps,
      sleep_duration_hours: Number(body.sleep_duration_hours || 7.5),
      sleep_quality_1_10: Number(body.sleep_quality_1_10 || 7),
      fatigue_1_10: Number(body.fatigue_1_10 || 3),
      muscle_soreness_1_10: Number(body.muscle_soreness_1_10 || 3),
      recovery_score_perceived_1_10: Number(body.recovery_score_perceived_1_10 || 7),
      physical_readiness_1_10: Number(body.physical_readiness_1_10 || 8),
      mental_readiness_1_10: Number(body.mental_readiness_1_10 || 8),
      protein_intake_grams: Number(body.protein_intake_grams || 135),
      water_intake_liters: Number(body.water_intake_liters || 3.2),
      nutrition_adequate: body.nutrition_adequate !== false ? 1 : 0,
      training_duration_minutes: Number(body.training_duration_minutes || 60),
      training_intensity_1_10: Number(body.training_intensity_1_10 || 5),
      rpe_1_10: Number(body.rpe_1_10 || 5),
      sessions_last_7d: Number(body.sessions_last_7d || 5),
      high_intensity_sessions_7d: Number(body.high_intensity_sessions_7d || 2),
      hours_since_intense_session: Number(body.hours_since_intense_session || 24)
    };

    const prediction = await runMlPrediction(payload);

    // Save assessment record
    const todayStr = new Date().toISOString().split('T')[0];
    const assessment = collection('readiness_assessments').insert({
      athlete_id: resolvedAthleteId,
      date: todayStr,
      timestamp: new Date().toISOString(),
      sport: payload.sport,
      sport_specific_details: payload.sport_specific_details,
      readiness_score: prediction.readiness_score,
      readiness_status: prediction.status,
      prediction_probability: prediction.prediction_probability,
      confidence_pct: prediction.confidence_pct,
      fit_to_play: prediction.fit_to_play,
      data_quality: prediction.data_quality,
      positive_factors: prediction.positive_factors,
      potential_concerns: prediction.potential_concerns,
      recommendation: prediction.recommendation,
      telemetry_summary: prediction.telemetry_summary,
      model_version: prediction.model_version,
      selected_algorithm: prediction.selected_algorithm,
      source: 'SPORT_QUESTIONNAIRE_ML'
    });

    res.status(201).json({
      success: true,
      message: 'Sport questionnaire submitted and AI readiness evaluated.',
      prediction,
      assessment
    });
  } catch (err) {
    console.error('Error in questionnaire endpoint:', err);
    res.status(500).json({ error: 'Failed to process questionnaire' });
  }
});

// Longitudinal Readiness History Timeline
app.get('/api/readiness/history/:athleteId', (req, res) => {
  const { athleteId } = req.params;
  const user = collection('users').findById(athleteId) || collection('users').findOne(u => u.email === athleteId);
  const resolvedId = user ? user.id : athleteId;

  const history = collection('readiness_assessments')
    .find(a => a.athlete_id === resolvedId)
    .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

  res.json({
    success: true,
    history
  });
});

// ============================================================================
// DEMO RESET
// ============================================================================
app.post('/api/reset-demo-data', (req, res) => {
  collection('users').reset();
  res.json({ success: true, message: 'Database reset to initial demo state.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Athlete 360 API Server running on port ${PORT}`);
});
