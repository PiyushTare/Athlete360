import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  Layers,
  ArrowRightLeft,
  Heart,
  Moon,
  Zap,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export const PerformanceAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Comparison Tool State
  const [selectedAthlete1, setSelectedAthlete1] = useState<string>('athlete-1');
  const [selectedAthlete2, setSelectedAthlete2] = useState<string>('athlete-2');

  useEffect(() => {
    async function loadAnalytics() {
      if (!user) return;
      try {
        const res = await api.getCoachAnalytics(user.id);
        setData(res);
      } catch (err) {
        console.error('Failed to load coach analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading squad telemetry...</div>;
  }

  const complianceData = data?.complianceData || [];
  const categoryLoad = data?.categoryLoad || [];
  const athletes = data?.athletes || [];

  // Athlete Comparison Profiles
  const ath1 = athletes.find((a: any) => a.id === selectedAthlete1) || athletes[0];
  const ath2 = athletes.find((a: any) => a.id === selectedAthlete2) || athletes[1];

  // Head-to-Head Comparison Chart Data
  const comparisonData = [
    { metric: 'Performance Score', [ath1?.name || 'Athlete 1']: ath1?.performance || 90, [ath2?.name || 'Athlete 2']: ath2?.performance || 85 },
    { metric: 'Consistency Rate %', [ath1?.name || 'Athlete 1']: ath1?.consistency || 95, [ath2?.name || 'Athlete 2']: ath2?.consistency || 90 },
    { metric: 'Morning Readiness', [ath1?.name || 'Athlete 1']: ath1?.readiness || 92, [ath2?.name || 'Athlete 2']: ath2?.readiness || 88 },
    { metric: 'Workout Volume', [ath1?.name || 'Athlete 1']: 88, [ath2?.name || 'Athlete 2']: 82 },
    { metric: 'Recovery Index', [ath1?.name || 'Athlete 1']: 94, [ath2?.name || 'Athlete 2']: 86 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Squad Telemetry & Performance Analytics
        </h2>
        <p className="text-xs text-slate-400">
          In-depth biomechanical adherence, weekly workload volume, and head-to-head comparison modeling.
        </p>
      </div>

      {/* TOP ROW: Weekly Compliance & Training Category Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Adherence Curve */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Weekly Squad Task Compliance & Readiness Curve
              </h3>
              <p className="text-[11px] text-slate-400">Completion rate vs squad mean readiness</p>
            </div>
            <div className="text-[10px] font-semibold text-emerald-400">Mean: 91.5%</div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f59b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f59b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222736" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" domain={[60, 100]} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '12px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="completion_rate" stroke="#00f59b" strokeWidth={2} fillOpacity={1} fill="url(#compGrad)" name="Completion %" />
                <Area type="monotone" dataKey="squad_readiness_avg" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#readGrad)" name="Readiness Index" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Volume Breakdown */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Training Load Hours by Category
            </h3>
            <p className="text-[11px] text-slate-400">Total hours logged across 7 training modalities</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryLoad} layout="vertical" margin={{ top: 5, right: 15, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222736" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="hours" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={14} name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* HEAD-TO-HEAD COMPARISON TOOL */}
      <div className="glass-panel p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" /> Coach Intelligence Tool
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Head-to-Head Athlete Performance Comparison
            </h3>
            <p className="text-xs text-slate-400">Select two athletes to compare performance metrics, consistency, and recovery capacity.</p>
          </div>

          {/* Athlete Selectors */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedAthlete1}
              onChange={e => setSelectedAthlete1(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 text-xs font-semibold focus:outline-none"
            >
              {athletes.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.sport})
                </option>
              ))}
            </select>

            <span className="text-slate-500 text-xs font-bold">VS</span>

            <select
              value={selectedAthlete2}
              onChange={e => setSelectedAthlete2(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 text-xs font-semibold focus:outline-none"
            >
              {athletes.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.sport})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222736" />
              <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" domain={[0, 100]} fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '12px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey={ath1?.name || 'Athlete 1'} fill="#00f59b" radius={[4, 4, 0, 0]} barSize={22} />
              <Bar dataKey={ath2?.name || 'Athlete 2'} fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">{ath1?.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">{ath1?.status || 'Green'}</span>
            </div>
            <p className="text-xs text-slate-300">
              High acceleration power profile. Consistency score of {ath1?.consistency}% indicates reliable execution across competition cycles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">{ath2?.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold uppercase">{ath2?.status || 'Green'}</span>
            </div>
            <p className="text-xs text-slate-300">
              Superior endurance capacity and aerobic stroke/pace economy. Performance benchmark rated at {ath2?.performance}/100.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
