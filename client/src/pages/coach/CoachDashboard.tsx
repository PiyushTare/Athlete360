import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Users,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Activity,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Star,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

interface CoachDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenNewTaskModal: () => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ onNavigate, onOpenNewTaskModal }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      try {
        const res = await api.getCoachDashboard(user.id);
        setData(res);
      } catch (err) {
        console.error('Failed to load coach dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold">Loading Coach Analytics...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const squadMetrics = data?.squadMetrics || [];
  const recentActivity = data?.recentActivity || [];
  const upcomingTournaments = data?.upcomingTournaments || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#121624] via-[#10141f] to-[#0c0d14] border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" /> Squad Telemetry Active
            </div>
            <h2 className="text-2xl font-black text-white">
              Welcome Back, {user?.full_name}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              5 registered athletes active in current training block. 1 athlete flagged with red readiness (shin splints). Review completed tasks and tournament schedules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewTaskModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Assign Training Task</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold transition"
            >
              Export PDF / CSV
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Athletes */}
        <div
          onClick={() => onNavigate('athletes')}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Athletes</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total_athletes || 5}</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">Apex High Performance</div>
        </div>

        {/* Currently Training */}
        <div className="glass-panel p-4 rounded-xl border-cyan-500/20 bg-cyan-950/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Training</span>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{stats.currently_training || 2}</div>
          <div className="text-[10px] text-slate-400 mt-1">Live in-session</div>
        </div>

        {/* Tasks Assigned Today */}
        <div
          onClick={() => onNavigate('tasks')}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tasks Assigned</span>
            <Dumbbell className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.tasks_assigned_today || 4}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across 7 categories</div>
        </div>

        {/* Tasks Completed */}
        <div
          onClick={() => onNavigate('tasks')}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.tasks_completed || 3}</div>
          <div className="text-[10px] text-slate-400 mt-1">Verified with proof</div>
        </div>

        {/* Athletes Requiring Attention */}
        <div
          onClick={() => onNavigate('athletes')}
          className="glass-panel glass-panel-hover p-4 rounded-xl border-red-500/30 bg-red-950/20 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Needs Attention</span>
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
          </div>
          <div className="text-2xl font-black text-red-400">{stats.athletes_requiring_attention || 1}</div>
          <div className="text-[10px] text-red-300 font-semibold mt-1">Liam W. (High Soreness)</div>
        </div>

        {/* Upcoming Tournaments */}
        <div
          onClick={() => onNavigate('tournaments')}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tournaments</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.upcoming_tournaments_count || 3}</div>
          <div className="text-[10px] text-slate-400 mt-1">Atlanta & Court Masters</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Squad Performance & Consistency Chart */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Squad Readiness & Performance Scores (0-100)
              </h3>
              <p className="text-[11px] text-slate-400">Comparative multi-athlete telemetry</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"></span> Readiness
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block"></span> Performance
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={squadMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222736" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" domain={[0, 100]} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="readiness" fill="#00f59b" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="performance" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attention Alerts Widget */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Readiness Attention Flags
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">2 Flags</span>
            </div>

            <div className="space-y-3">
              {/* Flag 1: Liam Walker (Red) */}
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Liam Walker</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-black">RED (46/100)</span>
                </div>
                <p className="text-[11px] text-red-300">
                  Elevated resting HR (72 bpm), acute sleep debt (4.8h), and bilateral tibial shin soreness reported.
                </p>
                <div className="text-[10px] text-slate-400 font-medium">Recommendation: Halt field sprints; pool recovery.</div>
              </div>

              {/* Flag 2: Jordan Taylor (Yellow) */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Jordan Taylor</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-black">YELLOW (68/100)</span>
                </div>
                <p className="text-[11px] text-amber-300">
                  Slight ankle stiffness & late recovery post-scrimmage. Cap jump volume at 70%.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('athletes')}
            className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
          >
            <span>Review Full Squad Vitals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RECENT ATHLETE ACTIVITIES & UPCOMING TOURNAMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Stream */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Recent Task Submissions & Athlete Activity
              </h3>
              <p className="text-[11px] text-slate-400">Real-time log of athlete workout completions</p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              View All Tasks →
            </button>
          </div>

          <div className="divide-y divide-white/5 space-y-2">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={act.athlete_avatar}
                    alt={act.athlete_name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-white">{act.athlete_name}</span>
                    <span className="text-slate-400 ml-1.5">completed</span>
                    <span className="text-emerald-400 font-semibold ml-1.5">"{act.task_title}"</span>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{act.category}</span>
                      <span>•</span>
                      <span>{act.actual_duration_mins || 45} mins logged</span>
                      {act.rating && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" /> {act.rating}/5
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500">
                    {act.completed_at ? new Date(act.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </span>
                  {act.proof_url && (
                    <a
                      href={act.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[10px] text-cyan-400 hover:underline font-medium"
                    >
                      View Proof ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournaments Snapshot */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Upcoming Competitions
              </h3>
              <button
                onClick={() => onNavigate('tournaments')}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {upcomingTournaments.map((t: any) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{t.sport} • {t.venue}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Starts: {t.start_date}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('tournaments')}
            className="w-full mt-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold transition"
          >
            Create Tournament Event
          </button>
        </div>
      </div>
    </div>
  );
};
