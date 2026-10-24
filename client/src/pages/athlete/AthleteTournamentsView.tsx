import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Tournament } from '../../types';
import {
  Trophy,
  Calendar,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  UserPlus
} from 'lucide-react';

export const AthleteTournamentsView: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Live' | 'Completed'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const res = await api.getTournaments();
      setTournaments(res.tournaments || []);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleRegister = async (tournId: string) => {
    if (!user) return;
    try {
      await api.registerForTournament(tournId, user.id);
      loadTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to register for tournament');
    }
  };

  const filtered = tournaments.filter(t => {
    const matchesTab = activeTab === 'All' || t.status === activeTab;
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.venue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Competitions, Meets & Tournaments
        </h2>
        <p className="text-xs text-slate-400">
          Explore upcoming sanctioned tournaments, register for events, view match brackets, and review results.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5 text-xs font-semibold">
          {(['All', 'Upcoming', 'Live', 'Completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === tab ? 'bg-amber-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tournament, venue, or sport..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* TOURNAMENT CARDS */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading tournaments...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-white/5 text-slate-400 text-xs">
          No tournaments found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(t => {
            const isRegistered = t.registrations?.some(r => r.athlete_id === user?.id);
            const myRegistration = t.registrations?.find(r => r.athlete_id === user?.id);

            return (
              <div
                key={t.id}
                className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10 hover:border-amber-500/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                          {t.sport}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400">{t.category}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{t.name}</h3>
                    </div>

                    <span
                      className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        t.status === 'Live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : t.status === 'Upcoming'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{t.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{t.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{t.start_date}</span>
                    </div>
                  </div>

                  {/* Scheduled Matches in this Tournament */}
                  {t.matches && t.matches.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Match Draws & Scores:
                      </span>
                      {t.matches.map(m => (
                        <div key={m.id} className="p-2.5 rounded-lg bg-slate-900 border border-white/5 text-xs">
                          <div className="flex justify-between font-bold text-white">
                            <span>{m.round}</span>
                            <span className="text-slate-400 text-[11px]">{m.venue_court}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">vs {m.opponent_name}</div>
                          {m.result && (
                            <div className="text-[10px] text-emerald-400 font-bold mt-1">
                              Result: {m.result.result} - {m.result.score_display}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  {isRegistered ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registered (Seed #{myRegistration?.seed_number || 1})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(t.id)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register / Request Entry</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
