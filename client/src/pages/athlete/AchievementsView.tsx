import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Achievement, PerformanceRecord } from '../../types';
import confetti from 'canvas-confetti';
import {
  Award,
  Zap,
  Plus,
  Flame,
  CheckCircle2,
  Trophy,
  Calendar,
  X,
  Target
} from 'lucide-react';

export const AchievementsView: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [personalBests, setPersonalBests] = useState<PerformanceRecord[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add PB modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('seconds');
  const [context, setContext] = useState('');
  const [pbDate, setPbDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getAchievements(user.id);
      setAchievements(res.achievements || []);
      setPersonalBests(res.personalBests || []);
      setGoals(res.goals || []);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddPb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.addPersonalRecord(user.id, {
        metric_name: metricName,
        value: Number(metricValue),
        unit: metricUnit,
        context,
        date: pbDate
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setIsAddModalOpen(false);
      setMetricName('');
      setMetricValue('');
      setContext('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add personal record');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            Competitive Hall of Fame
          </div>
          <h2 className="text-2xl font-black text-white">
            Personal Records & Milestone Badges
          </h2>
          <p className="text-xs text-slate-400">
            Official benchmark telemetry, competition gold medals, and career milestones unlocked.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Personal Record</span>
        </button>
      </div>

      {/* PERSONAL BESTS TABLE */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Verified Personal Records (PRs)
        </h3>

        {personalBests.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No personal bests logged yet. Click above to add your official benchmarks.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#11141e] text-slate-400 uppercase text-[10px] tracking-wider border-y border-white/5">
                <tr>
                  <th className="py-3 px-4">Discipline / Metric</th>
                  <th className="py-3 px-4 text-center">Record Mark</th>
                  <th className="py-3 px-4">Event Context / Venue</th>
                  <th className="py-3 px-4 text-right">Date Clocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {personalBests.map(pb => (
                  <tr key={pb.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{pb.metric_name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-emerald-400 text-sm">
                      {pb.value} {pb.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{pb.context || 'Official Meet'}</td>
                    <td className="py-3 px-4 text-right text-slate-400 font-medium">{pb.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MILESTONE BADGES */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          Unlocked Badges & Career Achievements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className="p-4 rounded-xl bg-slate-900 border border-white/5 flex items-start gap-3.5 hover:border-amber-500/30 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{ach.description}</p>
                <span className="text-[9px] text-emerald-400 font-semibold block mt-1">
                  Unlocked {ach.unlocked_at ? new Date(ach.unlocked_at).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD PB MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Add Personal Record Benchmark
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPb} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Discipline / Metric Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100m Sprint or 1RM Deadlift or VO2 Max"
                  value={metricName}
                  onChange={e => setMetricName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Numerical Mark *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="10.12 or 195"
                    value={metricValue}
                    onChange={e => setMetricValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="seconds, kg, m, km/h"
                    value={metricUnit}
                    onChange={e => setMetricUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Competition Venue / Testing Lab</label>
                <input
                  type="text"
                  placeholder="e.g. Olympic Centennial Invitational, Atlanta"
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Date Achieved</label>
                <input
                  type="date"
                  value={pbDate}
                  onChange={e => setPbDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold"
                >
                  Save Personal Best
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
