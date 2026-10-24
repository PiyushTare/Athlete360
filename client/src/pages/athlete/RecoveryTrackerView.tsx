import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Moon,
  Heart,
  Droplets,
  Smile,
  ShieldCheck,
  TrendingDown,
  Activity,
  CheckCircle2,
  Sparkles,
  Zap,
  Wind
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const RecoveryTrackerView: React.FC = () => {
  const { user } = useAuth();
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecovery() {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.getRecovery(user.id);
        setRecoveryData(res);
      } catch (err) {
        console.error('Failed to load recovery data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecovery();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading recovery & fatigue trends...</div>;
  }

  const trends = recoveryData?.trends || [];
  const latestVitals = recoveryData?.latestVitals || {};
  const latestAssessment = recoveryData?.latestAssessment || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Moon className="w-3.5 h-3.5" />
          Fatigue Diagnostics & Regeneration
        </div>
        <h2 className="text-2xl font-black text-white">
          Recovery & Neurological Fatigue Tracker
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Monitor autonomic nervous system regeneration, track sleep debt against baseline targets, and view targeted cellular recovery protocols.
        </p>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <Moon className="w-3.5 h-3.5 text-cyan-400" /> Sleep Duration
          </div>
          <div className="text-2xl font-black text-white">
            {latestVitals.sleep_hours ? `${latestVitals.sleep_hours}h` : <span className="text-xs text-slate-500 font-normal">No data available</span>}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">
            {latestVitals.sleep_quality ? `Quality: ${latestVitals.sleep_quality}/5 ★` : 'Awaiting sync'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <Heart className="w-3.5 h-3.5 text-red-400" /> Resting Heart Rate
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {latestVitals.resting_heart_rate ? `${latestVitals.resting_heart_rate} BPM` : <span className="text-xs text-slate-500 font-normal">No data available</span>}
          </div>
          <span className="text-[10px] text-slate-400">
            {latestVitals.resting_heart_rate ? 'Baseline: 52 BPM' : 'Awaiting watch sync'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" /> Fatigue Level
          </div>
          <div className="text-2xl font-black text-amber-400">
            {latestVitals.fatigue_level !== undefined && latestVitals.fatigue_level !== null ? `${latestVitals.fatigue_level}/10` : <span className="text-xs text-slate-500 font-normal">No data available</span>}
          </div>
          <span className="text-[10px] text-slate-400">
            {latestVitals.fatigue_level !== undefined ? 'CNS Fatigue Score' : 'Awaiting check-in'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <Droplets className="w-3.5 h-3.5 text-blue-400" /> Hydration State
          </div>
          <div className="text-2xl font-black text-blue-400">
            {latestVitals.hydration_level || <span className="text-xs text-slate-500 font-normal">No data available</span>}
          </div>
          <span className="text-[10px] text-slate-400">
            {latestVitals.hydration_level ? 'Electrolyte balance' : 'Awaiting check-in'}
          </span>
        </div>
      </div>

      {/* TREND CHART */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              Recovery Index vs Fatigue Curve (Last 7 Days)
            </h3>
            <p className="text-[11px] text-slate-400">Inverse relationship between sleep recovery and subjective fatigue</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222736" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '12px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="readiness_score" stroke="#00f59b" strokeWidth={2.5} name="Readiness Score" />
              <Line type="monotone" dataKey="fatigue" stroke="#f59e0b" strokeWidth={1.5} name="Fatigue Level (1-10)" />
              <Line type="monotone" dataKey="sleep_hours" stroke="#0ea5e9" strokeWidth={1.5} name="Sleep (Hours)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI RECOVERY PROTOCOLS */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Evidence-Based Recovery Interventions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
            <span className="font-bold text-cyan-400 uppercase text-[10px] block">Hydrotherapy Protocol</span>
            <div className="font-bold text-white">Contrast Water Immersion</div>
            <p className="text-slate-300 leading-relaxed">
              3 rounds of 1 min cold plunge (10°C) alternating with 3 min hot immersion (38°C) to stimulate peripheral vasoconstriction and lymphatic drainage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
            <span className="font-bold text-purple-400 uppercase text-[10px] block">Myofascial Care</span>
            <div className="font-bold text-white">Active Mobility & Flossing</div>
            <p className="text-slate-300 leading-relaxed">
              15 minutes of lower extremity banded joint mobilization and pneumatic compression boots (Normatec) set to Level 5.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
            <span className="font-bold text-emerald-400 uppercase text-[10px] block">Circadian Optimization</span>
            <div className="font-bold text-white">Sleep Hygiene Target</div>
            <p className="text-slate-300 leading-relaxed">
              Maintain room temperature at 18.5°C with zero blue-light exposure 45 minutes prior to sleep onset to maximize growth hormone release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
