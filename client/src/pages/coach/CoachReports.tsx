import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Shield,
  Sparkles
} from 'lucide-react';

export const CoachReports: React.FC = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    async function loadReports() {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.getCoachReports(user.id);
        setReportData(res.report_data || []);
      } catch (err) {
        console.error('Failed to load coach report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [user]);

  // Download CSV function
  const downloadCSV = () => {
    if (reportData.length === 0) return;

    const headers = [
      'Athlete Name',
      'Sport',
      'Specialization',
      'Performance Score',
      'Consistency Score',
      'Readiness Status',
      'Tasks Assigned',
      'Tasks Completed',
      'Completion Rate %',
      'Weekly Hours',
      'Streak Days',
      'Injury Record'
    ];

    const rows = reportData.map(r => [
      `"${r.name}"`,
      `"${r.sport}"`,
      `"${r.position}"`,
      r.performance_score,
      `${r.consistency_score}%`,
      r.readiness_status,
      r.assigned_tasks_count,
      r.completed_tasks_count,
      `${r.completion_rate_pct}%`,
      r.weekly_training_hours,
      r.streak_days,
      `"${r.injury_status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Athlete360_Squad_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print to PDF
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Performance & Compliance Reporting Suite
          </h2>
          <p className="text-xs text-slate-400">
            Export comprehensive training consistency, attendance compliance, and tournament records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Spreadsheet</span>
          </button>

          <button
            onClick={triggerPrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/10 flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Apex High Performance Squad Roster Audit</h3>
              <p className="text-[11px] text-slate-400">Supervising Coach: Coach Marcus Vance • Generated {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Verified Biometric Data
          </span>
        </div>

        {/* Report Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Generating report data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#11141e] text-slate-400 uppercase text-[10px] tracking-wider border-y border-white/5">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Sport / Specialization</th>
                  <th className="py-3 px-4 text-center">Performance Score</th>
                  <th className="py-3 px-4 text-center">Consistency</th>
                  <th className="py-3 px-4 text-center">Readiness Status</th>
                  <th className="py-3 px-4 text-center">Task Completion</th>
                  <th className="py-3 px-4 text-center">Weekly Hours</th>
                  <th className="py-3 px-4">Injury Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{row.name}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{row.sport}</div>
                      <div className="text-[10px] text-slate-500">{row.position}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">{row.performance_score}/100</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">{row.consistency_score}%</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          row.readiness_status === 'Green'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : row.readiness_status === 'Yellow'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {row.readiness_status} ({row.readiness_score})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-white">{row.completion_rate_pct}%</div>
                      <div className="text-[10px] text-slate-500">
                        {row.completed_tasks_count}/{row.assigned_tasks_count} tasks
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-cyan-400">
                      {row.weekly_training_hours}h
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">
                      {row.injury_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
