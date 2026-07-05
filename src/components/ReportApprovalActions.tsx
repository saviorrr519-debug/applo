import React, { useState } from 'react';
import { ProjectProgressReport } from '../types';
import { Check, AlertTriangle, Clock, MessageSquare, Send } from 'lucide-react';

interface ReportApprovalActionsProps {
  report: ProjectProgressReport;
  onUpdate?: (
    reportId: string,
    approvalStatus: 'Pending' | 'Disetujui' | 'Perlu Revisi',
    feedback?: string
  ) => void;
}

export default function ReportApprovalActions({
  report,
  onUpdate,
}: ReportApprovalActionsProps) {
  const [feedback, setFeedback] = useState(report.managementFeedback || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentStatus = report.approvalStatus || 'Pending';

  const handleAction = (status: 'Pending' | 'Disetujui' | 'Perlu Revisi') => {
    setErrorMsg('');
    setSuccessMsg('');

    if (status === 'Perlu Revisi' && !feedback.trim()) {
      setErrorMsg('Harap masukkan catatan feedback agar pekerja mengetahui revisi apa saja yang diperlukan.');
      return;
    }

    if (onUpdate) {
      onUpdate(report.id, status, feedback.trim());
      
      // Show subtle action success message
      setSuccessMsg(`Status laporan berhasil diubah ke "${status}"!`);
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  };

  return (
    <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80" id={`approval-panel-${report.id}`}>
      {/* Feedback text input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase">
          <MessageSquare className="w-3.5 h-3.5" />
          Catatan / Catatan Revisi Manajemen:
        </label>
        <div className="relative">
          <textarea
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Tulis pujian atau jelaskan revisi yang harus dikerjakan secara spesifik di sini..."
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
            id={`feedback-textarea-${report.id}`}
          />
        </div>
      </div>

      {/* Validation and feedback logs */}
      {errorMsg && (
        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 animate-pulse" id={`error-msg-${report.id}`}>
          <AlertTriangle className="w-3 h-3" />
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1" id={`success-msg-${report.id}`}>
          <Check className="w-3 h-3 animate-ping" />
          {successMsg}
        </p>
      )}

      {/* Quick Status Update Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleAction('Disetujui')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 shadow-sm ${
            currentStatus === 'Disetujui'
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
          }`}
          id={`btn-approve-${report.id}`}
        >
          <Check className="w-3.5 h-3.5" />
          Setujui Laporan
        </button>

        <button
          type="button"
          onClick={() => handleAction('Perlu Revisi')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 shadow-sm ${
            currentStatus === 'Perlu Revisi'
              ? 'bg-amber-600 text-white ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/20'
          }`}
          id={`btn-reject-${report.id}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Minta Revisi
        </button>

        {currentStatus !== 'Pending' && (
          <button
            type="button"
            onClick={() => {
              setFeedback('');
              handleAction('Pending');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
            id={`btn-reset-${report.id}`}
          >
            <Clock className="w-3.5 h-3.5" />
            Setel Ke Pending
          </button>
        )}
      </div>
    </div>
  );
}
