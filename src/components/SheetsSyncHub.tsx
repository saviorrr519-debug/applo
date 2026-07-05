import React, { useState } from 'react';
import { ProjectProgressReport, Project } from '../types';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  LogOut,
  Settings,
  CloudLightning,
  Clock,
  ArrowRight,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createSpreadsheet, populateSpreadsheet } from '../lib/googleSheets';

interface SheetsSyncHubProps {
  reports: ProjectProgressReport[];
  projects: Project[];
  isOnline: boolean;
  soundEnabled: boolean;
  triggerNotification: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error', reportId: string) => void;
  
  // Google Auth & Sheet state from App.tsx
  googleUser: any;
  googleToken: string | null;
  isGoogleLoading: boolean;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;

  linkedSpreadsheetId: string | null;
  setLinkedSpreadsheetId: (id: string | null) => void;
  linkedSpreadsheetUrl: string | null;
  setLinkedSpreadsheetUrl: (url: string | null) => void;
  isAutoSyncEnabled: boolean;
  setIsAutoSyncEnabled: (enabled: boolean) => void;
  
  syncLogs: Array<{ id: string; time: string; text: string; type: 'success' | 'error' | 'info' }>;
  addSyncLog: (text: string, type: 'success' | 'error' | 'info') => void;
  onForceSync: () => Promise<void>;
}

export default function SheetsSyncHub({
  reports,
  projects,
  isOnline,
  soundEnabled,
  triggerNotification,
  googleUser,
  googleToken,
  isGoogleLoading,
  onGoogleLogin,
  onGoogleLogout,
  linkedSpreadsheetId,
  setLinkedSpreadsheetId,
  linkedSpreadsheetUrl,
  setLinkedSpreadsheetUrl,
  isAutoSyncEnabled,
  setIsAutoSyncEnabled,
  syncLogs,
  addSyncLog,
  onForceSync,
}: SheetsSyncHubProps) {
  const [manualIdInput, setManualIdInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isLinkingManual, setIsLinkingManual] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // Stats for executive summary in sheets
  const stats = React.useMemo(() => {
    const total = reports.length;
    if (total === 0) {
      return { total: 0, avgProgress: 0, approved: 0, pending: 0, revision: 0 };
    }
    const sum = reports.reduce((acc, curr) => acc + curr.progressPercentage, 0);
    const avgProgress = Math.round(sum / total);
    const approved = reports.filter((r) => r.approvalStatus === 'Disetujui').length;
    const pending = reports.filter((r) => !r.approvalStatus || r.approvalStatus === 'Pending').length;
    const revision = reports.filter((r) => r.approvalStatus === 'Perlu Revisi').length;
    return { total, avgProgress, approved, pending, revision };
  }, [reports]);

  const activeFiltersDesc = {
    project: 'Semua Proyek',
    category: 'Semua Kategori',
    status: 'Semua Status',
    approval: 'Semua Persetujuan',
  };

  // Create a new sheet and link it
  const handleCreateAndLinkSheet = async () => {
    if (!googleToken) {
      setErrorText('Token Google tidak aktif. Silakan login kembali.');
      return;
    }
    setIsCreatingSheet(true);
    setErrorText(null);
    try {
      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
      const title = `PT Konstruksi Nusantara - Laporan Progres (${dateStr})`;

      addSyncLog('Membuat Google Spreadsheet baru...', 'info');
      const sheet = await createSpreadsheet(googleToken, title);
      
      addSyncLog('Mengisi spreadsheet dengan data laporan lapangan...', 'info');
      await populateSpreadsheet(googleToken, sheet.spreadsheetId, reports, stats, activeFiltersDesc);

      setLinkedSpreadsheetId(sheet.spreadsheetId);
      setLinkedSpreadsheetUrl(sheet.spreadsheetUrl);

      addSyncLog(`Google Sheet berhasil ditautkan: "${title}"`, 'success');
      triggerNotification(
        'Google Sheets Ditautkan',
        'Laporan progress konstruksi sekarang terhubung secara real-time ke Google Spreadsheet Anda.',
        'success',
        'sheets-sync'
      );

      // Play successful sound chime
      if (soundEnabled) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          }
        } catch (e) {
          console.log(e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Gagal membuat Google Spreadsheet.');
      addSyncLog(`Gagal membuat spreadsheet: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Link an existing sheet via ID or URL
  const handleLinkManualSheet = async () => {
    if (!manualIdInput.trim()) return;
    setErrorText(null);
    setIsLinkingManual(true);

    // Extract sheet ID from URL if user pasted the entire URL
    let sheetId = manualIdInput.trim();
    if (sheetId.includes('docs.google.com/spreadsheets/d/')) {
      const parts = sheetId.split('/d/');
      if (parts[1]) {
        sheetId = parts[1].split('/')[0];
      }
    }

    try {
      addSyncLog(`Menghubungkan ke Spreadsheet ID: ${sheetId}...`, 'info');
      // Test writing or populating immediately to verify permission
      if (googleToken) {
        await populateSpreadsheet(googleToken, sheetId, reports, stats, activeFiltersDesc);
      }

      setLinkedSpreadsheetId(sheetId);
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      setLinkedSpreadsheetUrl(url);

      addSyncLog(`Spreadsheet eksternal berhasil ditautkan dan disinkronkan.`, 'success');
      triggerNotification(
        'Google Sheets Ditautkan',
        'Berhasil menautkan spreadsheet eksternal. Sinkronisasi otomatis kini aktif.',
        'success',
        'sheets-sync'
      );
      
      setManualIdInput('');
      setShowManualInput(false);
    } catch (err: any) {
      console.error(err);
      setErrorText('Gagal menautkan spreadsheet. Pastikan ID benar dan akun Google Anda memiliki akses edit.');
      addSyncLog('Gagal menautkan spreadsheet eksternal. Cek permission akun.', 'error');
    } finally {
      setIsLinkingManual(false);
    }
  };

  const handleUnlinkSheet = () => {
    if (window.confirm('Apakah Anda yakin ingin mematikan sinkronisasi dan memutuskan tautan Google Spreadsheet saat ini?')) {
      setLinkedSpreadsheetId(null);
      setLinkedSpreadsheetUrl(null);
      addSyncLog('Tautan spreadsheet diputuskan oleh pengguna.', 'info');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-5 space-y-4 text-left" id="sheets-sync-hub-card">
      
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Integrasi Google Sheets
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
            Sinkronisasi otomatis laporan progres ke Google Spreadsheet Anda secara real-time.
          </p>
        </div>
        <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg shrink-0">
          <CloudLightning className={`w-4 h-4 ${isOnline && linkedSpreadsheetId && isAutoSyncEnabled ? 'animate-bounce text-emerald-500' : 'text-slate-400'}`} />
        </span>
      </div>

      {/* Google Authentication Box */}
      {!googleUser ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Hubungkan akun Google Anda untuk mengaktifkan pemutakhiran spreadsheet otomatis setiap ada laporan baru dari pekerja lapangan atau tinjauan dari manajemen.
          </p>
          <button
            onClick={onGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer dark:bg-slate-950 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-900 text-xs disabled:opacity-50"
            id="google-hub-login-btn"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <span>Hubungkan Google Drive &amp; Sheets</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          
          {/* Linked Account Details */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName}
                  className="w-6.5 h-6.5 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6.5 h-6.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                  {googleUser.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {googleUser.displayName || 'Akun Google'}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate leading-none mt-0.5">
                  {googleUser.email}
                </p>
              </div>
            </div>
            <button
              onClick={onGoogleLogout}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              title="Putuskan Akun Google"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Spreadsheet Connection Status */}
          {linkedSpreadsheetId ? (
            <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-3.5">
              
              {/* Active Connection Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-black tracking-widest uppercase">
                    AKTIF TERHUBUNG
                  </span>
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1.5 leading-snug">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    Laporan Tersinkronisasi Otomatis
                  </p>
                </div>
                <button
                  onClick={handleUnlinkSheet}
                  className="text-[9px] font-extrabold uppercase text-slate-400 hover:text-rose-500 tracking-wider cursor-pointer"
                  title="Putuskan Tautan"
                >
                  Putus Tautan
                </button>
              </div>

              {/* Action Link & Manual Force Sync */}
              <div className="flex flex-col sm:flex-row gap-2">
                {linkedSpreadsheetUrl && (
                  <a
                    href={linkedSpreadsheetUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-emerald-500/10 text-center"
                  >
                    Buka Spreadsheet
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                
                <button
                  onClick={onForceSync}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync Manual
                </button>
              </div>

              {/* Auto Sync Toggle State */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-100/40 dark:border-emerald-900/10">
                <div className="space-y-0.5 text-left">
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                    Auto-Sync Real-Time
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Otomatis update sheet jika ada input/update.
                  </p>
                </div>
                <button
                  onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  title={isAutoSyncEnabled ? 'Matikan Auto Sync' : 'Aktifkan Auto Sync'}
                >
                  {isAutoSyncEnabled ? (
                    <ToggleRight className="w-9 h-9 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300 dark:text-slate-700" />
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* No Spreadsheet Connected */
            <div className="p-3.5 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/15 dark:border-amber-900/30 rounded-xl space-y-3">
              
              <div className="flex items-start gap-2 text-amber-800 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black">
                    Belum Ada Spreadsheet Ditautkan
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Hubungkan spreadsheet untuk mulai menyinkronkan laporan Anda ke Google Drive.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleCreateAndLinkSheet}
                  disabled={isCreatingSheet}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  id="create-auto-sheet-btn"
                >
                  {isCreatingSheet ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Membuat Sheet Premium...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      Buat &amp; Tautkan Spreadsheet Baru
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-[9px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wide cursor-pointer decoration-dotted underline underline-offset-2"
                  >
                    {showManualInput ? 'Batal Tautkan Manual' : 'Tautkan ID Spreadsheet Manual'}
                  </button>
                </div>

                {showManualInput && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      Tempel URL spreadsheet atau ID spreadsheet yang Anda miliki di bawah ini:
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Tempel ID atau URL spreadsheet..."
                        value={manualIdInput}
                        onChange={(e) => setManualIdInput(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-[10px] font-medium rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        id="manual-sheet-id-input"
                      />
                      <button
                        onClick={handleLinkManualSheet}
                        disabled={isLinkingManual || !manualIdInput.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {isLinkingManual ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {errorText && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-lg text-[10px] font-semibold border border-rose-100 dark:border-rose-900/30 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Activity Log console */}
          <div className="space-y-1.5 pt-2 border-t border-slate-50 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span>Konsol Aktivitas Sync</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live
              </span>
            </div>
            <div className="bg-slate-950 text-slate-300 font-mono text-[9px] rounded-lg p-2.5 h-[95px] overflow-y-auto custom-scrollbar space-y-1 text-left select-none border border-slate-900 leading-normal">
              {syncLogs.length === 0 ? (
                <div className="text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  Belum ada riwayat aktivitas sync.
                </div>
              ) : (
                syncLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="flex gap-1.5 items-start">
                    <span className="text-slate-600 shrink-0 font-sans">[{log.time}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'error' ? 'text-rose-400 font-bold' :
                      'text-sky-300'
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
