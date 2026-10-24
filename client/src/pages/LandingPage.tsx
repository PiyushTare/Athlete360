import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Shield,
  User,
  Zap,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Brain,
  Sliders,
  ChevronRight,
  Heart,
  BarChart3,
  Dumbbell
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (role: 'coach' | 'athlete') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { demoUsers, quickDemoLogin, isAuthenticated, user } = useAuth();

  // Interactive Live Readiness Sandbox State for Landing Page WOW Factor
  const [simHR, setSimHR] = useState(52);
  const [simSleep, setSimSleep] = useState(8.0);
  const [simFatigue, setSimFatigue] = useState(3);
  const [simSoreness, setSimSoreness] = useState(2);
  const [simSpO2, setSimSpO2] = useState(99);

  // Dynamic sandbox calculation
  const simScore = Math.max(
    20,
    Math.min(
      99,
      Math.round(
        100 -
          (simHR > 55 ? (simHR - 55) * 1.5 : 0) -
          (simSleep < 7.5 ? (7.5 - simSleep) * 10 : 0) -
          (simFatigue > 3 ? (simFatigue - 3) * 4 : 0) -
          (simSoreness > 3 ? (simSoreness - 3) * 4 : 0) -
          (simSpO2 < 98 ? (98 - simSpO2) * 8 : 0)
      )
    )
  );

  const simStatus = simScore >= 78 ? 'Green' : simScore >= 55 ? 'Yellow' : 'Red';

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-grid-pattern border-b border-white/10">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[140px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Athletic Intelligence & Readiness Engine</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
              Your Performance.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Your Potential.
              </span>{' '}
              Your Future.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Athlete 360 connects elite coaches and dedicated competitors in a unified sports-tech platform.
              Automate task management, monitor biometric readiness, track multi-week training streaks, and unlock AI-assisted match win predictions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => onOpenAuth('coach')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition transform hover:-translate-y-0.5"
              >
                <Shield className="w-4 h-4" />
                <span>Coach Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth('athlete')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-white/15 hover:border-cyan-400/50 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span>Athlete Portal</span>
              </button>
            </div>

            {/* Demo Quick Logins Preview */}
            <div className="pt-8">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                ⚡ Instant 1-Click Demo Sandbox:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {demoUsers.slice(0, 6).map(u => (
                  <button
                    key={u.id}
                    onClick={() => quickDemoLogin(u.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-emerald-500/40 text-xs transition"
                  >
                    <img
                      src={u.avatar_url}
                      alt={u.full_name}
                      className="w-5 h-5 rounded-full object-cover border border-slate-600"
                    />
                    <span className="font-semibold text-slate-200">{u.full_name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-medium">
                      {u.role === 'coach' ? 'Coach' : (u.profile as any)?.sport?.split(' ')[0] || 'Athlete'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-b border-white/10 bg-[#0c0e14] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <div className="text-3xl font-black text-emerald-400 mb-1">99.4%</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Biometric Precision</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <div className="text-3xl font-black text-cyan-400 mb-1">18+ Tables</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Relational Schema</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <div className="text-3xl font-black text-emerald-400 mb-1">3-Tier Safety</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Green / Yellow / Red Flags</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <div className="text-3xl font-black text-amber-400 mb-1">&lt; 350ms</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Real-time Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PLATFORM FEATURES */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Engineered for Champions</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Comprehensive Sports-Tech Architecture
          </h2>
          <p className="text-sm text-slate-400">
            Every feature is crafted to maximize athletic output while safeguarding against overtraining and soft tissue injury.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Smart Athlete Tracking */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 group-hover:scale-110 transition">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Athlete Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Monitor daily training duration, consistency percentage, attendance logs, and workout completion rates. Roster filters identify athletes needing attention immediately.
            </p>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span>View Roster Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: AI Fitness Eligibility */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group border-emerald-500/30 bg-emerald-950/10">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-5 text-teal-400 group-hover:scale-110 transition">
              <Brain className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase mb-2">
              Core Innovation
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Fitness Eligibility</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Calculates daily readiness scores (0-100) using resting HR, sleep duration, SpO2, fatigue, soreness, and hydration. Automatic Green/Yellow/Red triage alerts coaches instantly.
            </p>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span>Try Interactive Sandbox</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Performance Analytics */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 text-cyan-400 group-hover:scale-110 transition">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Performance Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              High-resolution Recharts track progress curves, load distribution, personal bests, and squad volume balance. Compare an athlete's current form with previous competition cycles.
            </p>
            <div className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
              <span>Explore Interactive Charts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Tournament Management */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-400 group-hover:scale-110 transition">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tournament Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Create events, assign athlete rosters, track registrations, view match schedules, record competition results, and maintain official historical records.
            </p>
            <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <span>View Tournament Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5: Training Consistency & Streaks */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-5 text-orange-400 group-hover:scale-110 transition">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Training Consistency & Streaks</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              GitHub-style calendar heatmap logs daily tasks, streak counts, and activity minutes. Earn milestone badges (7-Day Streak, Century Club) while scheduled rest days protect your streak.
            </p>
            <div className="text-[11px] font-semibold text-orange-400 flex items-center gap-1">
              <span>View Consistency Heatmap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 6: Task Assignment & Verification */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-110 transition">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Task Assignment & Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Coaches assign structured workouts across 7 training categories. Athletes submit duration, repetitions, RPE, and photo proof for coach review and 5-star ratings.
            </p>
            <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
              <span>Inspect Task Workflow</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AI READINESS SANDBOX */}
      <section id="ai-readiness" className="py-16 bg-[#0c0e15] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Live Demonstration
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Experience the AI Fitness Readiness Engine
            </h2>
            <p className="text-xs text-slate-400">
              Adjust the physiological sliders below to observe real-time calculation of readiness scores, training intensity caps, and status flags.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders Input Panel */}
            <div className="lg:col-span-7 bg-[#11141e] border border-white/10 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Simulate Athlete Daily Morning Vitals
              </h3>

              {/* Slider 1: Resting HR */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Resting Heart Rate</span>
                  <span className="text-emerald-400 font-bold">{simHR} BPM</span>
                </div>
                <input
                  type="range"
                  min="42"
                  max="85"
                  value={simHR}
                  onChange={e => setSimHR(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>42 (Optimal)</span>
                  <span>60 (Normal)</span>
                  <span>85 (Tachycardia / Fatigue)</span>
                </div>
              </div>

              {/* Slider 2: Sleep Duration */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Sleep Duration</span>
                  <span className="text-cyan-400 font-bold">{simSleep} Hours</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={simSleep}
                  onChange={e => setSimSleep(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>4.0h (Severe Deficit)</span>
                  <span>8.0h (Ideal)</span>
                  <span>10.0h</span>
                </div>
              </div>

              {/* Slider 3: Fatigue Level */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Subjective Fatigue Index (1-10)</span>
                  <span className="text-amber-400 font-bold">{simFatigue} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={simFatigue}
                  onChange={e => setSimFatigue(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Slider 4: Muscle Soreness */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Musculoskeletal Soreness (1-10)</span>
                  <span className="text-orange-400 font-bold">{simSoreness} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={simSoreness}
                  onChange={e => setSimSoreness(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
              </div>

              {/* Slider 5: SpO2 */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Oxygen Saturation (SpO2)</span>
                  <span className="text-emerald-400 font-bold">{simSpO2}%</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="100"
                  value={simSpO2}
                  onChange={e => setSimSpO2(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>

            {/* Output Display Card */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#141824] to-[#0d1017] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Computed Readiness</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                    simStatus === 'Green'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : simStatus === 'Yellow'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      simStatus === 'Green' ? 'bg-emerald-400' : simStatus === 'Yellow' ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                  ></span>
                  {simStatus === 'Green' ? 'READY (100% CAPACITY)' : simStatus === 'Yellow' ? 'CAUTION (MODIFIED)' : 'STOP INTENSE LOAD'}
                </span>
              </div>

              {/* Big Gauge Display */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-800 stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={`stroke-current transition-all duration-500 ${
                        simStatus === 'Green'
                          ? 'text-emerald-400'
                          : simStatus === 'Yellow'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * simScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black text-white">{simScore}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Readiness Score</span>
                  </div>
                </div>
              </div>

              {/* Prescribed Training Cap */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Recommended Session Intensity:</span>
                  <span className="text-white font-bold">
                    {simStatus === 'Green' ? '100% (Full Capacity)' : simStatus === 'Yellow' ? '70% (Technical Only)' : '35% (Active Recovery)'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      simStatus === 'Green' ? 'bg-emerald-400 w-full' : simStatus === 'Yellow' ? 'bg-amber-400 w-[70%]' : 'bg-red-400 w-[35%]'
                    }`}
                  ></div>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                  <Brain className="w-3.5 h-3.5" /> AI Diagnostic Summary:
                </span>
                {simStatus === 'Green'
                  ? 'All autonomic markers indicate optimal neuro-muscular regeneration. Recommended for peak speed and maximum power efforts.'
                  : simStatus === 'Yellow'
                  ? 'Mild cardiovascular elevation or sleep restriction detected. Reduce maximal velocity volume; focus on mobility and hydration.'
                  : 'Critical fatigue or physiological stress index. High injury probability if maximal loading continues. Switch to non-impact recovery.'}
              </div>

              <button
                onClick={() => onOpenAuth('athlete')}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                Log Your Personal Vitals in Athlete 360
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT & SPORTS SCIENCE METHODOLOGY */}
      <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">About Athlete 360</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Bridging Physiology and Coaching Strategy
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Athlete 360 was built for performance programs that refuse to rely on guesswork. By synchronizing daily physiological biomarkers with periodized coaching programs, coaches gain real-time visibility into squad recovery states, and athletes know exactly when to push and when to adapt.
            </p>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Transparent Scoring:</strong> Every readiness score and win probability calculation provides full breakdowns of underlying factors.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Role-Based Access Control:</strong> Strict permission barriers ensure athletes only view their assigned tasks and records, while coaches manage their active rosters.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Dual AI Integration:</strong> Integrates Gemini LLM API enrichment with high-precision sports-science rule fallbacks.</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-[#121622] to-[#0c0d14] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Apex High Performance Roster</h4>
                  <p className="text-xs text-slate-400">Head Coach: Marcus Vance</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">5 Athletes Active</span>
            </div>

            <div className="space-y-3">
              {demoUsers.filter(u => u.role === 'athlete').map(athlete => {
                const prof = athlete.profile as any;
                return (
                  <div
                    key={athlete.id}
                    onClick={() => quickDemoLogin(athlete.id)}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 flex items-center justify-between transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={athlete.avatar_url}
                        alt={athlete.full_name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700 group-hover:border-emerald-400"
                      />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400">{athlete.full_name}</div>
                        <div className="text-[11px] text-slate-400">{prof?.sport} • {prof?.position_specialization}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          prof?.current_readiness_status === 'Green'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : prof?.current_readiness_status === 'Yellow'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {prof?.current_readiness_status || 'Green'} ({prof?.readiness_score || 85})
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Score: {prof?.performance_score}/100</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
