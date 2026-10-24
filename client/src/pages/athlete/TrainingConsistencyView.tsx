import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Zap,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const TrainingConsistencyView: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConsistency() {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.getConsistency(user.id);
        setData(res);
      } catch (err) {
        console.error('Failed to load consistency data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConsistency();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading training consistency heatmap...</div>;
  }

  const currentStreak = data?.currentStreak || 14;
  const longestStreak = data?.longestStreak || 28;
  const consistencyPct = data?.consistencyPercentage || 94;
  const monthlyMinutes = data?.monthlyActivityMinutes || 1480;
  const heatmap = data?.heatmap || [];
  const badges = data?.badges || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Flame className="w-3.5 h-3.5" />
          Discipline & Periodization Tracker
        </div>
        <h2 className="text-2xl font-black text-white">
          Training Consistency, Streaks & Heatmap
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Consistent execution drives competitive breakthroughs. Track your active daily streak, monthly activity minutes, and unlock performance milestones without rest day penalties.
        </p>
      </div>

      {/* STREAK & CONSISTENCY HERO TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181310] to-[#0f121a] border border-orange-500/30">
          <div className="flex items-center justify-center gap-1.5 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 fill-orange-400" /> Current Streak
          </div>
          <div className="text-4xl font-black text-orange-400">{currentStreak} Days</div>
          <span className="text-[10px] text-slate-400 font-medium">🔥 Active consecutive training</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-white/5">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Longest Streak</div>
          <div className="text-4xl font-black text-white">{longestStreak} Days</div>
          <span className="text-[10px] text-emerald-400 font-medium">Personal Best Streak</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-white/5">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Monthly Adherence</div>
          <div className="text-4xl font-black text-emerald-400">{consistencyPct}%</div>
          <span className="text-[10px] text-slate-400 font-medium">Rest days normalized</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-white/5">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Activity Minutes</div>
          <div className="text-4xl font-black text-cyan-400">{monthlyMinutes}m</div>
          <span className="text-[10px] text-slate-400 font-medium">~24.6 Total Hours</span>
        </div>
      </div>

      {/* CALENDAR HEATMAP (GitHub Style) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              30-Day Training Intensity Heatmap
            </h3>
            <p className="text-[11px] text-slate-400">Color density corresponds to workout duration & perceived exertion</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Rest Day</span>
            <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block"></span>
            <span className="w-3 h-3 rounded-sm bg-emerald-950 border border-emerald-800 inline-block"></span>
            <span className="w-3 h-3 rounded-sm bg-emerald-700 inline-block"></span>
            <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></span>
            <span>Max Effort</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2.5 pt-2">
          {heatmap.map((day: any, idx: number) => {
            let bgClass = 'bg-slate-800/80 border border-white/5';
            if (day.isRestDay) {
              bgClass = 'bg-slate-900/40 border border-dashed border-slate-700/60';
            } else if (day.completed) {
              if (day.intensity === 3) bgClass = 'bg-emerald-400 text-black border border-emerald-300 shadow-sm';
              else if (day.intensity === 2) bgClass = 'bg-emerald-600 text-white';
              else bgClass = 'bg-emerald-800 text-white';
            }

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl text-center flex flex-col justify-between h-20 transition transform hover:scale-105 cursor-pointer ${bgClass}`}
                title={`${day.date}: ${day.isRestDay ? 'Scheduled Rest Day' : `${day.minutes} mins training`}`}
              >
                <div className="text-[10px] font-bold opacity-80">{day.day}</div>
                <div className="text-xs font-black">{day.date.slice(8)}</div>
                <div className="text-[9px] font-semibold opacity-90 truncate">
                  {day.isRestDay ? 'Rest' : `${day.minutes}m`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Smart Streak Logic:</strong> Scheduled rest days set by Coach Marcus do NOT break your active streak or reduce your consistency percentage.
          </span>
        </div>
      </div>

      {/* MILESTONE BADGES */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Consistency Milestones & Badges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-orange-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
              <Flame className="w-6 h-6 fill-orange-400" />
            </div>
            <div className="text-xs font-bold text-white">7-Day Streak</div>
            <p className="text-[10px] text-slate-400">Completed 7 continuous days of sessions.</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">Unlocked</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-xs font-bold text-white">30-Day Consistency</div>
            <p className="text-[10px] text-slate-400">Maintained &gt;90% workout adherence.</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">Unlocked</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="text-xs font-bold text-white">Century Club (100)</div>
            <p className="text-[10px] text-slate-400">100 training workouts completed.</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">Unlocked</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-xs font-bold text-white">PB Smasher</div>
            <p className="text-[10px] text-slate-400">New all-time personal best benchmark.</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">Unlocked</span>
          </div>
        </div>
      </div>
    </div>
  );
};
