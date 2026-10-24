import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Clock,
  Calendar,
  Play,
  CheckCircle2,
  Star,
  ExternalLink,
  X,
  Dumbbell,
  Paperclip,
  Activity,
  AlertCircle
} from 'lucide-react';

export const AssignedTasksView: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Complete workout modal state
  const [activeTaskToComplete, setActiveTaskToComplete] = useState<any | null>(null);
  const [durationMins, setDurationMins] = useState(50);
  const [repsOrDist, setRepsOrDist] = useState('');
  const [rpeScore, setRpeScore] = useState(8);
  const [proofUrl, setProofUrl] = useState('');
  const [athleteNotes, setAthleteNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getAthleteTasks(user.id);
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  // Start Task
  const handleStartTask = async (taskId: string) => {
    if (!user) return;
    try {
      await api.startTask(user.id, taskId);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to start task');
    }
  };

  // Complete Task
  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeTaskToComplete) return;

    try {
      setSubmitting(true);
      await api.completeTask(user.id, activeTaskToComplete.task_id, {
        actual_duration_mins: Number(durationMins),
        metrics: {
          metrics_logged: repsOrDist,
          rpe: Number(rpeScore)
        },
        proof_url: proofUrl,
        athlete_notes: athleteNotes
      });

      // Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      setActiveTaskToComplete(null);
      setAthleteNotes('');
      setProofUrl('');
      setRepsOrDist('');
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to submit workout');
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Progress Bar */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-cyan-400" />
              Assigned Training Workouts
            </h2>
            <p className="text-xs text-slate-400">
              Execute coach prescribed regimens, track biometric metrics, and submit proof for review.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase">Workout Adherence</span>
            <div className="text-2xl font-black text-cyan-400">{progressPct}% Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5 text-xs font-semibold overflow-x-auto">
        {(['all', 'Pending', 'In Progress', 'Completed', 'Overdue'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === tab
                ? 'bg-cyan-500 text-black font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'all' ? `All Tasks (${tasks.length})` : `${tab} (${tasks.filter(t => t.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* TASKS LIST */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading training tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-white/5 text-slate-400 text-xs">
          No tasks found matching current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'Completed';
            const isInProgress = task.status === 'In Progress';

            return (
              <div
                key={task.completion_id}
                className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10 hover:border-cyan-500/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                          {task.category}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.estimated_duration_mins} mins
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{task.title}</h3>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isInProgress
                          ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{task.description}</p>

                  {/* Instructions */}
                  {task.instructions && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300 mb-3">
                      <span className="font-bold text-cyan-400 block mb-1">Execution Protocol:</span>
                      {task.instructions}
                    </div>
                  )}

                  {/* Coach Feedback if available */}
                  {task.coach_feedback && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 mb-3">
                      <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                        <span>Coach Feedback ({task.coach_name || 'Marcus Vance'})</span>
                        {task.coach_rating && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{task.coach_rating}/5</span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-200 italic">"{task.coach_feedback}"</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-medium">
                    Due: {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/5">
                  {!isCompleted && !isInProgress && (
                    <button
                      onClick={() => handleStartTask(task.task_id)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Workout Session</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => setActiveTaskToComplete(task)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Log Completion & Metrics</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Completed & Verified
                      </span>
                      {task.proof_url && (
                        <a
                          href={task.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View Proof
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LOG COMPLETION MODAL */}
      {activeTaskToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Log Workout Completion</h3>
              <button onClick={() => setActiveTaskToComplete(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteTask} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Actual Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    value={durationMins}
                    onChange={e => setDurationMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Perceived Exertion (RPE 1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={rpeScore}
                    onChange={e => setRpeScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Performance Metrics (Reps / Distance / Splits)</label>
                <input
                  type="text"
                  placeholder="e.g. 4 sets @ 165kg deadlift or 5x60m splits: 6.82s avg"
                  value={repsOrDist}
                  onChange={e => setRepsOrDist(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Proof Attachment (Image URL or Video link)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or uploaded photo link"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Personal Workout Notes for Coach</label>
                <textarea
                  rows={3}
                  placeholder="How did you feel? Any tightness or biomechanical feedback..."
                  value={athleteNotes}
                  onChange={e => setAthleteNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTaskToComplete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold shadow-lg shadow-emerald-500/20"
                >
                  {submitting ? 'Submitting...' : 'Submit to Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
