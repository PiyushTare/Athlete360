import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Tournament } from '../../types';
import {
  Brain,
  Sparkles,
  Trophy,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Target,
  Clock,
  ArrowRight
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

export const PerformanceInsightsView: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournId, setSelectedTournId] = useState<string>('tourn-1');
  const [predictionData, setPredictionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournaments() {
      try {
        const res = await api.getTournaments();
        setTournaments(res.tournaments || []);
        if (res.tournaments?.length > 0) {
          setSelectedTournId(res.tournaments[0].id);
        }
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      }
    }
    loadTournaments();
  }, []);

  useEffect(() => {
    async function fetchPrediction() {
      if (!user || !selectedTournId) return;
      try {
        setLoading(true);
        const res = await api.getWinProbability(user.id, selectedTournId);
        setPredictionData(res);
      } catch (err) {
        console.error('Failed to load win probability prediction:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, [user, selectedTournId]);

  const pred = predictionData?.prediction;
  const targetTourn = predictionData?.tournament;

  // Prediction accuracy history mock data
  const predictionHistory = [
    { match: 'Invitational QF', predicted: 68, actualResult: 'Win (Gold)', accuracy: 'High' },
    { match: 'Regional Semi', predicted: 72, actualResult: 'Win (10.18s)', accuracy: 'High' },
    { match: 'Pan-Pacific Heat', predicted: 62, actualResult: 'Win (56.42s)', accuracy: 'High' },
    { match: 'Metro Open R1', predicted: 78, actualResult: 'Win (6-2, 6-4)', accuracy: 'High' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Brain className="w-3.5 h-3.5" />
          Predictive Athletic Modeling
        </div>
        <h2 className="text-2xl font-black text-white">
          AI Match Win Probability & Tactical Outlook
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Our validated statistical model combines 30-day training adherence, peak power metrics, match history, and match-day physiological readiness to calculate an objective performance outlook.
        </p>
      </div>

      {/* TOURNAMENT SELECTOR */}
      <div className="p-4 rounded-xl bg-slate-900 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">Select Competition for Predictive Outlook:</span>
        </div>

        <select
          value={selectedTournId}
          onChange={e => setSelectedTournId(e.target.value)}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
        >
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.sport})
            </option>
          ))}
        </select>
      </div>

      {/* PREDICTION DISPLAY */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Computing statistical win probability...</div>
      ) : pred?.status === 'insufficient_data' ? (
        <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Insufficient Match Data for Win Probability %</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {pred.message}
          </p>
          <div className="p-3 bg-slate-900 rounded-xl inline-block text-xs font-bold text-emerald-400 border border-emerald-500/20">
            Current Performance Readiness: {pred.readiness_indicator}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Win Probability Tile */}
          <div className="glass-panel p-6 rounded-2xl border-cyan-500/30 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 text-center md:border-r border-white/10 md:pr-6">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Estimated Match Win Probability
                </span>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight">
                  {pred?.win_probability_pct}%
                </div>
                <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase">
                  Confidence: {pred?.confidence_level}
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Form: {pred?.performance_trend}
                </div>
              </div>

              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Target Event: {targetTourn?.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">{targetTourn?.sport} • {targetTourn?.venue}</span>
                </div>

                {/* Factors that influenced the estimate */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Influencing Variables Weight:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {pred?.influencing_factors?.map((f: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">{f.name}</span>
                        <span className="text-emerald-400 font-bold">{f.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STRENGTHS & VULNERABILITIES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Key Competitive Strengths
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {pred?.strengths?.map((str: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Vulnerabilities & Risk Mitigations
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {pred?.vulnerabilities?.map((vul: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span>{vul}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tactical Recommendations */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Tactical Game-Day Recommendations
            </h3>
            <div className="space-y-2">
              {pred?.tactical_recommendations?.map((rec: string, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MANDATORY ESTIMATE DISCLAIMER */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300 block mb-0.5">Statistical Estimate Notice:</strong>
            {pred?.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
