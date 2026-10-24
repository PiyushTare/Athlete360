import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Trophy,
  Activity,
  Zap,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  XCircle,
  FileEdit,
  Sliders,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface MatchStatsViewProps {
  onNavigateToManualEntry?: () => void;
}

export const MatchStatsView: React.FC<MatchStatsViewProps> = ({ onNavigateToManualEntry }) => {
  const { user } = useAuth();
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.getMatchStats(user.id);
        setMatchData(res);
      } catch (err) {
        console.error('Failed to load match statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-cyan-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold uppercase tracking-wider">Loading Match Statistics...</span>
        </div>
      </div>
    );
  }

  const totalMatches = matchData?.total_matches || 0;
  const wins = matchData?.wins || 0;
  const losses = matchData?.losses || 0;
  const winRate = matchData?.win_rate || (totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0);
  const rawMatches = matchData?.matches || [];

  // Format matches for chronological chart
  const chartPoints = [...rawMatches].reverse().map((m: any, idx: number) => ({
    matchIndex: `M${idx + 1}`,
    opponent: m.opponent_name || m.opponent || `Opponent ${idx + 1}`,
    rating: m.court_movement_rating || (m.result === 'Win' ? 8.8 : 6.8),
    won: m.result === 'Win' ? 1 : 0
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0d111a] border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3 h-3" />
              Court Match Intelligence
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-semibold">Competitive Records & Benchmarks</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Court Match Statistics</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Review win/loss ratios, court movement efficiency ratings, deciding set endurance, and competitive match logs across all tournament and simulation events.
          </p>
        </div>

        {onNavigateToManualEntry && (
          <button
            onClick={onNavigateToManualEntry}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-500/20"
          >
            <FileEdit className="w-4 h-4" />
            <span>Log Match Performance</span>
          </button>
        )}
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Win Rate</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{winRate}%</div>
          <div className="text-[10px] text-slate-400">
            {wins} Won • {losses} Lost ({totalMatches} Total)
          </div>
        </div>

        {/* Court Movement Index */}
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Movement Rating</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">8.6<span className="text-xs text-slate-500">/10</span></div>
          <div className="text-[10px] text-cyan-400 font-semibold">Tier 1 Footwork Execution</div>
        </div>

        {/* Reaction Benchmark */}
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Reaction Speed</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">182<span className="text-xs text-slate-500"> ms</span></div>
          <div className="text-[10px] text-amber-400 font-semibold">Elite Front-Court Reaction</div>
        </div>

        {/* Deciding Sets Won */}
        <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Deciding Set Stamina</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">83%</div>
          <div className="text-[10px] text-purple-400 font-semibold">High Endurance in 3-Set Clashes</div>
        </div>
      </div>

      {/* Movement Rating Trend Chart */}
      <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Court Movement Efficiency Across Matches
            </h3>
            <p className="text-[11px] text-slate-400">Movement and tactical rating trajectory over time</p>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
            Efficiency Rating (1-10)
          </span>
        </div>

        <div className="h-56 w-full">
          {chartPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="movementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2433" vertical={false} />
                <XAxis dataKey="matchIndex" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[4, 10]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '10px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#movementGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-4 rounded-xl bg-slate-950/60 border border-white/5 text-slate-400 text-xs">
              No match movement records available yet. Log matches using Manual Data Entry to populate analytics.
            </div>
          )}
        </div>
      </div>

      {/* Match History Table */}
      <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Competitive Match Log</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {rawMatches.length} match{rawMatches.length === 1 ? '' : 'es'} recorded
          </span>
        </div>

        {rawMatches.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/50 border border-white/5 text-center space-y-2">
            <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No match records logged yet.</p>
            <p className="text-[11px] text-slate-500">
              Record match results, scores, and court footwork feedback through the Manual Data Entry tab.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rawMatches.map((m: any, i: number) => {
              const isWin = m.result === 'Win' || m.winner_id === user?.id;
              const dateDisplay = m.match_date || m.date || 'Recent Match';
              const opponentName = m.opponent_name || m.opponent || 'Competitive Opponent';

              return (
                <div
                  key={m.id || `match-${i}`}
                  className="p-4 rounded-xl bg-slate-900/80 border border-white/5 hover:border-amber-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {isWin ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isWin ? 'Win' : 'Loss'}
                      </span>

                      <span className="text-xs font-bold text-white">vs. {opponentName}</span>

                      {m.source === 'MANUAL_ENTRY' && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          MANUAL ENTRY
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Date: <strong className="text-slate-300">{dateDisplay}</strong></span>
                      {m.score && (
                        <span>Score: <strong className="text-cyan-400">{m.score}</strong></span>
                      )}
                      {m.court_movement_rating && (
                        <span>Movement Rating: <strong className="text-amber-300">{m.court_movement_rating}/10</strong></span>
                      )}
                    </div>

                    {m.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5 max-w-xl">
                        "{m.notes}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">Verified Match</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
