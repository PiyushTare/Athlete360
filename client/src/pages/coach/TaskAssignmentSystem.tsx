import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TrainingTask, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  Users,
  Dumbbell,
  Paperclip
} from 'lucide-react';

export const TaskAssignmentSystem: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TrainingTask[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reviewCompletion, setReviewCompletion] = useState<any | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingVal, setRatingVal] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState<Partial<TrainingTask>>({
    title: '',
    description: '',
    category: 'Speed and Agility',
    priority: 'Medium',
    estimated_duration_mins: 45,
    instructions: '',
    attachment_url: '',
    video_url: '',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    assigned_to: 'all'
  });

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [tasksRes, athletesRes] = await Promise.all([
        api.getCoachTasks(user.id),
        api.getCoachAthletes(user.id)
      ]);
      setTasks(tasksRes.tasks || []);
      setAthletes(athletesRes.athletes || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.createTask(user.id, newTask);
      setIsCreateModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        category: 'Speed and Agility',
        priority: 'Medium',
        estimated_duration_mins: 45,
        instructions: '',
        attachment_url: '',
        video_url: '',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        assigned_to: 'all'
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this training task and all athlete assignments?')) return;
    try {
      await api.deleteTask(user.id, taskId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Submit Review & Feedback
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCompletion) return;
    try {
      setSubmittingReview(true);
      await api.reviewTask(reviewCompletion.completion_id, feedbackText, ratingVal);
      setReviewCompletion(null);
      setFeedbackText('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            Task Assignment & Verification Engine
          </h2>
          <p className="text-xs text-slate-400">
            Design targeted periodized sessions, deploy to individual athletes or entire squad, and grade submissions.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create & Assign Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks by title, category, or drill..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400"
          >
            <option value="all">All 7 Training Categories</option>
            <option value="Strength Training">Strength Training</option>
            <option value="Cardio">Cardio</option>
            <option value="Endurance">Endurance</option>
            <option value="Speed and Agility">Speed and Agility</option>
            <option value="Technical Practice">Technical Practice</option>
            <option value="Recovery">Recovery</option>
            <option value="Match Preparation">Match Preparation</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* TASKS LIST */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading training tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-white/5 text-slate-400 text-xs">
          No training tasks found matching current filters. Click "Create & Assign Task" to deploy one.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const assignments = task.assignments || [];
            const completedCount = assignments.filter(a => a.status === 'Completed').length;

            return (
              <div
                key={task.id}
                className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10 hover:border-emerald-500/30 transition"
              >
                {/* Task Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                        {task.category}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          task.priority === 'High'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : task.priority === 'Medium'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.estimated_duration_mins} mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{task.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right sm:mr-3">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Due Date</div>
                      <div className="text-xs font-bold text-white">
                        {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                {task.instructions && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-emerald-400 block mb-1">Workout Instructions:</span>
                    {task.instructions}
                  </div>
                )}

                {/* Assigned Athletes & Submissions */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Assigned Athletes ({completedCount}/{assignments.length} Completed)
                    </span>
                    <span className="text-[11px] text-emerald-400">
                      {assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0}% Adherence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {assignments.map(ass => {
                      return (
                        <div
                          key={ass.completion_id}
                          className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 truncate">
                                <img
                                  src={ass.avatar}
                                  alt={ass.name}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-700"
                                />
                                <span className="text-xs font-bold text-white truncate">{ass.name}</span>
                              </div>
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                  ass.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : ass.status === 'In Progress'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {ass.status}
                              </span>
                            </div>

                            {/* Details if completed */}
                            {ass.status === 'Completed' && (
                              <div className="text-[11px] text-slate-400 space-y-1">
                                <div>Duration: <strong className="text-white">{ass.actual_duration_mins || 45} mins</strong></div>
                                {ass.athlete_notes && (
                                  <div className="truncate italic">"{ass.athlete_notes}"</div>
                                )}
                                {ass.proof_url && (
                                  <a
                                    href={ass.proof_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View Submitted Proof
                                  </a>
                                )}
                                {ass.coach_rating && (
                                  <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                                    <Star className="w-3 h-3 fill-amber-400" /> Graded: {ass.coach_rating}/5 ⭐
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Review Button if completed */}
                          {ass.status === 'Completed' && (
                            <button
                              onClick={() => {
                                setReviewCompletion(ass);
                                setFeedbackText(ass.coach_feedback || '');
                                setRatingVal(ass.coach_rating || 5);
                              }}
                              className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-black text-white text-[11px] font-semibold transition flex items-center justify-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{ass.coach_feedback ? 'Update Grade & Review' : 'Grade & Give Feedback'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                Assign New Training Task
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5x60m Max Velocity Flys & Contrast Trap Bar Deadlift"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Primary objective and physiological adaptation focus"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Training Category *</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Speed and Agility">Speed and Agility</option>
                    <option value="Strength Training">Strength Training</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Technical Practice">Technical Practice</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Match Preparation">Match Preparation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newTask.estimated_duration_mins}
                    onChange={e => setNewTask({ ...newTask, estimated_duration_mins: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assign Target *</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="all">Entire Squad (All 5 Athletes)</option>
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.sport})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newTask.due_date}
                    onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Training Instructions & Sets/Reps</label>
                <textarea
                  rows={3}
                  placeholder="Detail warm-up protocol, sets, rest periods, split targets, and telemetry required..."
                  value={newTask.instructions}
                  onChange={e => setNewTask({ ...newTask, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reference Video / Attachment URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or https://youtube.com/..."
                  value={newTask.attachment_url}
                  onChange={e => setNewTask({ ...newTask, attachment_url: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20"
                >
                  Deploy Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW & FEEDBACK MODAL */}
      {reviewCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Review Submission: {reviewCompletion.name}</h3>
                <p className="text-xs text-slate-400">Duration logged: {reviewCompletion.actual_duration_mins || 45} mins</p>
              </div>
              <button onClick={() => setReviewCompletion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Athlete notes & proof */}
            <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Athlete Notes:</span>
              <p className="text-slate-200 italic">{reviewCompletion.athlete_notes || 'No specific notes submitted.'}</p>
              {reviewCompletion.proof_url && (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Attached Media / Proof:</span>
                  <a
                    href={reviewCompletion.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Uploaded Proof
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {/* Star Rating */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Coach Grade / Rating (1-5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-slate-600 hover:text-amber-400 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-amber-400 text-sm">{ratingVal} / 5 Stars</span>
                </div>
              </div>

              {/* Feedback text */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Coach Feedback & Technical Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Great velocity output! Bar acceleration stayed high. On rep 3 remember to keep shin angles positive."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReviewCompletion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  {submittingReview ? 'Sending Feedback...' : 'Publish Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
