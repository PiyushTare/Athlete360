import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Tournament, Match } from '../../types';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Award,
  X,
  UserPlus,
  FileCheck
} from 'lucide-react';

export const TournamentManagement: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Live' | 'Completed' | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAthleteToRegister, setSelectedAthleteToRegister] = useState('');
  const [matchScoreModal, setMatchScoreModal] = useState<Match | null>(null);
  const [scoreResult, setScoreResult] = useState<'Win' | 'Loss' | 'Draw'>('Win');
  const [scoreDisplay, setScoreDisplay] = useState('');
  const [matchNotes, setMatchNotes] = useState('');

  // New Tournament state
  const [newTourn, setNewTourn] = useState({
    name: '',
    sport: 'Court Athletics',
    venue: '',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: 'State Championship / Invitational',
    status: 'Upcoming' as const,
    description: '',
    prize_or_tier: 'National Tier 1'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, aRes] = await Promise.all([
        api.getTournaments(),
        user ? api.getCoachAthletes(user.id) : Promise.resolve({ athletes: [] })
      ]);
      setTournaments(tRes.tournaments || []);
      setAthletes(aRes.athletes || []);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Create Tournament
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.createTournament({
        ...newTourn,
        coach_id: user.id
      });
      setIsCreateModalOpen(false);
      setNewTourn({
        name: '',
        sport: 'Court Athletics',
        venue: '',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'State Championship / Invitational',
        status: 'Upcoming',
        description: '',
        prize_or_tier: 'National Tier 1'
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create tournament');
    }
  };

  // Handle Register Athlete
  const handleRegisterAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !selectedAthleteToRegister) return;
    try {
      await api.registerForTournament(selectedTournament.id, selectedAthleteToRegister);
      setIsAssignModalOpen(false);
      setSelectedAthleteToRegister('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register athlete');
    }
  };

  // Handle Record Match Result
  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchScoreModal) return;
    try {
      // Find athlete associated
      const athleteId = athletes[0]?.id || 'athlete-1';
      await api.recordMatchResult(matchScoreModal.id, {
        athlete_id: athleteId,
        result: scoreResult,
        score_display: scoreDisplay,
        notes: matchNotes
      });
      setMatchScoreModal(null);
      setScoreDisplay('');
      setMatchNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record match score');
    }
  };

  // Filter tournaments
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Tournament & Championship Management
          </h2>
          <p className="text-xs text-slate-400">
            Organize competition calendars, register squad athletes, track seeded brackets, and record official results.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5 text-xs font-semibold">
          {(['All', 'Upcoming', 'Live', 'Completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === tab
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-slate-400 hover:text-white'
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
            placeholder="Search tournament name or venue..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* TOURNAMENTS CARDS */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading tournaments...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-white/5 text-slate-400 text-xs">
          No tournaments found matching the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(tournament => {
            const regs = tournament.registrations || [];
            const matches = tournament.matches || [];

            return (
              <div
                key={tournament.id}
                className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10 hover:border-amber-500/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                          {tournament.sport}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400 font-medium">{tournament.category}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{tournament.name}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        tournament.status === 'Live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : tournament.status === 'Upcoming'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{tournament.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{tournament.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{tournament.start_date}</span>
                    </div>
                  </div>

                  {/* Registered Athletes List */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        Registered Athletes ({regs.length})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setIsAssignModalOpen(true);
                        }}
                        className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Enroll Athlete
                      </button>
                    </div>

                    {regs.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No squad athletes registered yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {regs.map(reg => (
                          <div
                            key={reg.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-white"
                          >
                            <img
                              src={reg.athlete_avatar}
                              alt={reg.athlete_name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-semibold text-[11px]">{reg.athlete_name}</span>
                            {reg.seed_number && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 font-bold">
                                Seed #{reg.seed_number}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Matches */}
                  {matches.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Match Schedule & Outcomes:
                      </span>
                      <div className="space-y-1.5">
                        {matches.map(match => (
                          <div
                            key={match.id}
                            className="p-2.5 rounded-lg bg-slate-900 border border-white/5 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-white">{match.round}</div>
                              <div className="text-[11px] text-slate-400">vs {match.opponent_name} ({match.venue_court})</div>
                              {match.result && (
                                <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                  Result: {match.result.result} - {match.result.score_display}
                                </div>
                              )}
                            </div>

                            {!match.result && (
                              <button
                                onClick={() => setMatchScoreModal(match)}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black text-[11px] font-bold transition"
                              >
                                Record Score
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Prize: {tournament.prize_or_tier || 'Official Tournament'}</span>
                  <span className="text-emerald-400 font-semibold">Sanctioned Meet</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Create New Tournament
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tournament Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Court Trophy 2026"
                  value={newTourn.name}
                  onChange={e => setNewTourn({ ...newTourn, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Competition Category *</label>
                  <select
                    value={newTourn.sport}
                    onChange={e => setNewTourn({ ...newTourn, sport: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Court Athletics">Court Athletics</option>
                    <option value="Singles Championship">Singles Championship</option>
                    <option value="Doubles Championship">Doubles Championship</option>
                    <option value="Invitational Open">Invitational Open</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={newTourn.status}
                    onChange={e => setNewTourn({ ...newTourn, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Venue / Arena *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hayward Field, Eugene, OR"
                  value={newTourn.venue}
                  onChange={e => setNewTourn({ ...newTourn, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newTourn.start_date}
                    onChange={e => setNewTourn({ ...newTourn, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={newTourn.end_date}
                    onChange={e => setNewTourn({ ...newTourn, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Competition Category</label>
                <input
                  type="text"
                  placeholder="e.g. Olympic Qualifier / Tier 1"
                  value={newTourn.category}
                  onChange={e => setNewTourn({ ...newTourn, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold"
                >
                  Save Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLL ATHLETE MODAL */}
      {isAssignModalOpen && selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Enroll Athlete: {selectedTournament.name}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAthlete} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Squad Athlete</label>
                <select
                  required
                  value={selectedAthleteToRegister}
                  onChange={e => setSelectedAthleteToRegister(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="">-- Choose Athlete --</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.sport})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD MATCH SCORE MODAL */}
      {matchScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Record Match Score</h3>
              <button onClick={() => setMatchScoreModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordResult} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Match Outcome</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Win', 'Loss', 'Draw'] as const).map(res => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setScoreResult(res)}
                      className={`py-2 rounded-lg font-bold border transition ${
                        scoreResult === res
                          ? res === 'Win'
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : res === 'Loss'
                            ? 'bg-red-500 text-white border-red-400'
                            : 'bg-amber-500 text-black border-amber-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Official Score / Clock Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10.14s (1st Place) or 6-4, 7-5"
                  value={scoreDisplay}
                  onChange={e => setScoreDisplay(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Match Tactical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key tactical observations, split execution, or adjustments..."
                  value={matchNotes}
                  onChange={e => setMatchNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setMatchScoreModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  Save Score & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
