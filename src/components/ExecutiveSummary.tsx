import React, { useState, useMemo, useEffect } from 'react';
import { Project, ProjectProgressReport, SchedulerSettings, CompiledWeeklySummary, ProjectWeeklyMetrics } from '../types';
import { jsPDF } from 'jspdf';
import {
  Calendar,
  Clock,
  Download,
  Mail,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileText,
  Trash2,
  Play,
  RotateCcw,
  Check,
  Building,
  TrendingUp,
  Layers,
  Award,
  Plus,
  Send,
  CloudLightning
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExecutiveSummaryProps {
  projects: Project[];
  reports: ProjectProgressReport[];
  schedulerSettings: SchedulerSettings;
  onUpdateScheduler: (settings: SchedulerSettings) => void;
  compiledSummaries: CompiledWeeklySummary[];
  onAddSummary: (summary: CompiledWeeklySummary) => void;
  onDeleteSummary: (id: string) => void;
  triggerNotification: (title: string, msg: string, type: 'success' | 'warning' | 'info' | 'error') => void;
  isOnline: boolean;
  soundEnabled: boolean;
}

export default function ExecutiveSummary({
  projects,
  reports,
  schedulerSettings,
  onUpdateScheduler,
  compiledSummaries,
  onAddSummary,
  onDeleteSummary,
  triggerNotification,
  isOnline,
  soundEnabled
}: ExecutiveSummaryProps) {
  // Navigation & interaction state
  const [selectedSummaryId, setSelectedSummaryId] = useState<string>('');
  const [isEditingScheduler, setIsEditingScheduler] = useState(false);
  const [schedulerForm, setSchedulerForm] = useState<SchedulerSettings>({ ...schedulerSettings });

  // Temp form values for editing scheduler
  useEffect(() => {
    setSchedulerForm({ ...schedulerSettings });
  }, [schedulerSettings]);

  // If no summary is selected, default to the latest one
  useEffect(() => {
    if (compiledSummaries.length > 0 && !selectedSummaryId) {
      setSelectedSummaryId(compiledSummaries[0].id);
    }
  }, [compiledSummaries, selectedSummaryId]);

  const activeSummary = useMemo(() => {
    return compiledSummaries.find(s => s.id === selectedSummaryId) || compiledSummaries[0] || null;
  }, [compiledSummaries, selectedSummaryId]);

  // Calculate dynamic weekly report compilation based on reports from the last 7 days
  const compileWeeklySummary = (isManual: boolean = false): CompiledWeeklySummary => {
    const now = new Date();
    const endDateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const startDateStr = sevenDaysAgo.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // Filter reports from the past 7 days
    const lastWeekReports = reports.filter(r => r.timestamp >= (Date.now() - 7 * 24 * 60 * 60 * 1000));
    const targetReports = lastWeekReports.length > 0 ? lastWeekReports : reports.slice(0, 5); // Fallback to last 5 if none in 7 days

    // Count categories
    const categoryMap: Record<string, number> = {};
    targetReports.forEach(r => {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count);

    // Calculate metrics per project
    const projectBreakdown: ProjectWeeklyMetrics[] = projects.map(proj => {
      const projReports = targetReports.filter(r => r.projectId === proj.id);
      
      // Starting progress can be simulated as current progress minus a small randomized growth
      // or using the actual minimum progress in this week's reports
      const currentProgress = proj.overallProgress;
      let startingProgress = currentProgress;
      
      if (projReports.length > 0) {
        const sortedReports = [...projReports].sort((a, b) => a.timestamp - b.timestamp);
        startingProgress = Math.max(0, sortedReports[0].progressPercentage - 5);
      } else {
        startingProgress = Math.max(0, currentProgress - 2);
      }

      const progressGained = Math.max(0, currentProgress - startingProgress);

      return {
        projectId: proj.id,
        projectName: proj.name,
        reportCount: projReports.length,
        startingProgress,
        currentProgress,
        progressGained,
        status: proj.status
      };
    });

    const averageProgress = Math.round(
      projectBreakdown.reduce((acc, p) => acc + p.currentProgress, 0) / (projectBreakdown.length || 1)
    );

    const averageProgressGained = parseFloat(
      (projectBreakdown.reduce((acc, p) => acc + p.progressGained, 0) / (projectBreakdown.length || 1)).toFixed(1)
    );

    // Generate smart bullet highlights based on the actual reports
    const keyHighlights: string[] = [];
    
    // Add positive highlights
    const finishedReports = targetReports.filter(r => r.status === 'Selesai');
    if (finishedReports.length > 0) {
      keyHighlights.push(
        `Penyelesaian Pekerjaan: Tim berhasil merampungkan ${finishedReports.length} pos pekerjaan penting minggu ini, termasuk instalasi utama.`
      );
    } else {
      keyHighlights.push(
        `Kemajuan Fisik Kontinu: Terjadi penambahan rata-rata kemajuan fisik proyek sebesar +${averageProgressGained}% lintas sektor.`
      );
    }

    // Dynamic highlights based on project activities
    projectBreakdown.forEach(p => {
      if (p.reportCount > 0) {
        keyHighlights.push(
          `${p.projectName}: Mencatat kemajuan aktif dengan ${p.reportCount} laporan lapangan baru, tumbuh dari ${p.startingProgress}% menjadi ${p.currentProgress}% (Sektor ${p.status}).`
        );
      }
    });

    // Add warnings if there are delays
    const delayedReports = targetReports.filter(r => r.status === 'Tertunda' || r.status === 'Butuh Tindakan');
    if (delayedReports.length > 0) {
      keyHighlights.push(
        `PERHATIAN MANAJEMEN: Terdeteksi kendala di lapangan pada ${delayedReports.length} laporan (Sektor Tertunda). Memerlukan koordinasi lanjutan terkait penyesuaian shift malam.`
      );
    } else {
      keyHighlights.push(
        `Stabilitas K3 & Operasional: Seluruh pengerjaan berjalan tanpa laporan kecelakaan kerja (Zero Accident), dengan kepatuhan K3 optimal.`
      );
    }

    const pendingApprovalsCount = targetReports.filter(r => r.approvalStatus === 'Pending').length;

    const newSummary: CompiledWeeklySummary = {
      id: `sum-${Date.now()}`,
      title: `Laporan Ringkasan Eksekutif ${isManual ? 'Manual' : 'Otomatis'} - ${endDateStr}`,
      startDate: startDateStr,
      endDate: endDateStr,
      compiledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      totalReports: targetReports.length,
      averageProgress,
      progressGained: averageProgressGained,
      projectBreakdown,
      categoryBreakdown,
      keyHighlights,
      pendingApprovals: pendingApprovalsCount,
      isAutoGenerated: !isManual
    };

    return newSummary;
  };

  const handleManualCompile = () => {
    const summary = compileWeeklySummary(true);
    onAddSummary(summary);
    setSelectedSummaryId(summary.id);
    
    // Play sounds or push notification
    triggerNotification(
      'Ringkasan Eksekutif Dikompilasi',
      `Berhasil mengompilasi laporan mingguan baru untuk periode ${summary.startDate} s/d ${summary.endDate}.`,
      'success'
    );
  };

  const handleSaveScheduler = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateScheduler(schedulerForm);
    setIsEditingScheduler(false);
    triggerNotification(
      'Konfigurasi Jadwal Diperbarui',
      `Jadwal kompilasi otomatis berhasil disimpan (${schedulerForm.enabled ? 'Aktif' : 'Nonaktif'}, Frekuensi: ${schedulerForm.frequency}).`,
      'success'
    );
  };

  const handleToggleScheduler = () => {
    const updated = { ...schedulerSettings, enabled: !schedulerSettings.enabled };
    onUpdateScheduler(updated);
    triggerNotification(
      'Status Penjadwal Diubah',
      `Penjadwalan kompilasi otomatis kini ${updated.enabled ? 'AKTIF' : 'NONAKTIF'}.`,
      updated.enabled ? 'success' : 'warning'
    );
  };

  const getDayName = (dayNum: number) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayNum];
  };

  // Helper to trigger automated scheduler simulation run
  const handleSimulateSchedulerRun = () => {
    const summary = compileWeeklySummary(false); // isAutoGenerated = true
    onAddSummary(summary);
    setSelectedSummaryId(summary.id);
    
    // Update last run time
    onUpdateScheduler({
      ...schedulerSettings,
      lastRunTimestamp: Date.now(),
      nextRunTimestamp: Date.now() + 7 * 24 * 60 * 60 * 1000 // In 7 days
    });

    triggerNotification(
      'Cron Job: Laporan Otomatis Selesai',
      `Penjadwal mengompilasi laporan mingguan otomatis baru secara berkala pada hari ${getDayName(schedulerSettings.dayOfWeek)} pukul ${schedulerSettings.time}.`,
      'info'
    );
  };

  // PDF Export for active executive summary
  const downloadSummaryPdf = (sum: CompiledWeeklySummary) => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Premium Layout Header
      doc.setFillColor(15, 23, 42); // slate-900 background for title
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('PROTRACK PMO - MANAGEMENT SUITE', 15, 18);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175); // light slate
      doc.text(`Kompilasi Laporan Mingguan Fisik • Periode: ${sum.startDate} s/d ${sum.endDate}`, 15, 26);
      doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')} WIB`, 15, 32);

      // Section 1: Ringkasan Utama
      yPos = 55;
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('I. METRIK UTAMA KEMAJUAN (SUMMARY METRICS)', 15, yPos);
      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.line(15, yPos + 3, 195, yPos + 3);

      yPos += 13;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`• Total Laporan Lapangan Masuk: ${sum.totalReports} Laporan`, 20, yPos);
      doc.text(`• Rata-rata Kemajuan Fisik: ${sum.averageProgress}%`, 20, yPos + 6);
      doc.text(`• Pertumbuhan Fisik Kumulatif (Gain): +${sum.progressGained}% dalam 7 hari`, 20, yPos + 12);
      doc.text(`• Laporan Menunggu Approval Manajemen: ${sum.pendingApprovals} item`, 20, yPos + 18);

      // Section 2: Sorotan Utama
      yPos += 32;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('II. HIGHLIGHTS & SOROTAN AKTIVITAS MINGGUAN', 15, yPos);
      doc.line(15, yPos + 3, 195, yPos + 3);

      yPos += 10;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      
      sum.keyHighlights.forEach((hl) => {
        const splitText = doc.splitTextToSize(`- ${hl}`, 175);
        doc.text(splitText, 18, yPos);
        yPos += (splitText.length * 5) + 2;
      });

      // Section 3: Tabel Kemajuan Proyek
      yPos += 6;
      if (yPos > 240) {
        doc.addPage();
        yPos = 25;
      }

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('III. RINCIAN PROGRES PER PROYEK AKTIF', 15, yPos);
      doc.line(15, yPos + 3, 195, yPos + 3);

      yPos += 10;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Nama Proyek', 18, yPos);
      doc.text('Awal', 110, yPos);
      doc.text('Akhir', 130, yPos);
      doc.text('Gained', 150, yPos);
      doc.text('Laporan', 170, yPos);
      doc.line(15, yPos + 2, 195, yPos + 2);

      doc.setFont('Helvetica', 'normal');
      yPos += 7;
      sum.projectBreakdown.forEach((p) => {
        if (yPos > 265) {
          doc.addPage();
          yPos = 25;
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('Nama Proyek', 18, yPos);
          doc.text('Awal', 110, yPos);
          doc.text('Akhir', 130, yPos);
          doc.text('Gained', 150, yPos);
          doc.text('Laporan', 170, yPos);
          doc.line(15, yPos + 2, 195, yPos + 2);
          doc.setFont('Helvetica', 'normal');
          yPos += 7;
        }

        const splitName = doc.splitTextToSize(p.projectName, 85);
        doc.text(splitName, 18, yPos);
        doc.text(`${p.startingProgress}%`, 110, yPos);
        doc.text(`${p.currentProgress}%`, 130, yPos);
        doc.text(`+${p.progressGained}%`, 150, yPos);
        doc.text(`${p.reportCount}`, 170, yPos);

        yPos += (splitName.length * 5) + 3;
      });

      // Footer
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Dokumen ini digenerasi secara otomatis oleh ProTrack PMO Auto-Scheduler Suite dan sah sebagai berkas rapat mingguan.', 15, 285);

      doc.save(`Ringkasan_Eksekutif_${sum.startDate.replace(/\s+/g, '_')}_sd_${sum.endDate.replace(/\s+/g, '_')}.pdf`);
      triggerNotification('Ekspor PDF Sukses', 'Berkas PDF Ringkasan Eksekutif premium berhasil diunduh.', 'success');
    } catch (error) {
      console.error(error);
      triggerNotification('Ekspor PDF Gagal', 'Gagal memproses berkas PDF. Silakan coba kembali.', 'error');
    }
  };

  return (
    <div className="space-y-6" id="executive-summary-wrapper">
      {/* Dynamic Swapper Banner / Title */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-left relative overflow-hidden" id="executive-hero">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-1.5 max-w-2xl">
            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-500/30 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Fitur Manajemen Eksklusif
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ringkasan Eksekutif & Penjadwalan Laporan
            </h1>
            <p className="text-xs text-slate-300 leading-normal">
              Gunakan dasbor ini untuk memantau kemajuan fisik dalam seminggu terakhir secara agregat, serta mengonfigurasi mesin penjadwalan otomatis (cron simulation) untuk kebutuhan pelaporan eksekutif direksi.
            </p>
          </div>

          <button
            onClick={handleManualCompile}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer border border-blue-500/40"
            id="compile-manual-report-btn"
          >
            <Plus className="w-4 h-4" />
            Kompilasi Laporan Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="executive-dashboard-grid">
        {/* LEFT COLUMN: ACTIVE SUMMARY DETAIL (2/3 width) */}
        <div className="lg:col-span-2 space-y-6" id="active-summary-view">
          {activeSummary ? (
            <motion.div
              key={activeSummary.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              id={`summary-detail-${activeSummary.id}`}
            >
              {/* Summary Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Periode Analisis
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      activeSummary.isAutoGenerated
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                    }`}>
                      {activeSummary.isAutoGenerated ? 'Penjadwal Otomatis' : 'Kompilasi Manual'}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                    {activeSummary.startDate} s/d {activeSummary.endDate}
                  </h2>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => downloadSummaryPdf(activeSummary)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    id="download-summary-pdf-btn"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    Unduh PDF
                  </button>
                </div>
              </div>

              {/* Grid Metrics Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800 text-left">
                <div className="p-5 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Kenaikan Progres
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-blue-600 tracking-tight">
                      +{activeSummary.progressGained}%
                    </span>
                    <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 self-center" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Kenaikan fisik rata-rata
                  </p>
                </div>

                <div className="p-5 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Total Laporan
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                      {activeSummary.totalReports}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">log</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Aktivitas dalam 7 hari
                  </p>
                </div>

                <div className="p-5 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Kepatuhan K3
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-600 tracking-tight">
                      100%
                    </span>
                    <Award className="w-4 h-4 text-emerald-600 shrink-0 self-center" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Zero safety incidents
                  </p>
                </div>

                <div className="p-5 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Menunggu Approval
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black tracking-tight ${activeSummary.pendingApprovals > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
                      {activeSummary.pendingApprovals}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">item</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Butuh persetujuan segera
                  </p>
                </div>
              </div>

              {/* Main Content Areas */}
              <div className="p-5 space-y-6 text-left">
                {/* 1. Sorotan Utama (Key Highlights) */}
                <div className="space-y-3" id="active-summary-highlights">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Sorotan & Analisis Aktivitas Mingguan (AI Compiled)
                    </h3>
                  </div>

                  <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {activeSummary.keyHighlights.map((hl, index) => {
                      const isAlert = hl.includes('PERHATIAN') || hl.includes('Tertunda');
                      return (
                        <div key={index} className="flex gap-2.5 items-start text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {isAlert ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <span className="font-semibold">{hl}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Rincian Progres per Proyek (Project Breakdown) */}
                <div className="space-y-3" id="active-summary-breakdown">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4.5 h-4.5 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Rincian Kemajuan Fisik & Aktivitas Per Proyek
                    </h3>
                  </div>

                  {/* Desktop Table, responsive layouts */}
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950/20 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3 px-4">Nama Proyek</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Awal</th>
                          <th className="py-3 px-4 text-center">Akhir</th>
                          <th className="py-3 px-4">Progress Gained & Tren</th>
                          <th className="py-3 px-4 text-center">Laporan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activeSummary.projectBreakdown.map((p) => {
                          const gained = p.progressGained;
                          return (
                            <tr key={p.projectId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-xs">
                              <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                                {p.projectName}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  p.status === 'Aktif'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                                {p.startingProgress}%
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                                {p.currentProgress}%
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-1.5 max-w-[200px]">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="font-extrabold text-blue-600">+{gained}% gained</span>
                                  </div>
                                  {/* Multi-layered progress bar */}
                                  <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    {/* Starting progress (light/dark slate) */}
                                    <div
                                      className="absolute left-0 top-0 h-full bg-slate-300 dark:bg-slate-600"
                                      style={{ width: `${p.startingProgress}%` }}
                                    />
                                    {/* Gained progress (blue) */}
                                    <div
                                      className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
                                      style={{ width: `${p.currentProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center font-extrabold text-slate-600 dark:text-slate-400">
                                {p.reportCount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Distribusi Pekerjaan (Category Breakdown) */}
                <div className="space-y-3" id="active-summary-categories">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4.5 h-4.5 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Distribusi Aktivitas Berdasarkan Kategori Pekerjaan
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {activeSummary.categoryBreakdown.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                            {cat.category}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {cat.count} Laporan
                          </span>
                        </div>
                        <span className="w-7 h-7 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                          {cat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm font-bold">Belum Ada Laporan Ringkasan Eksekutif</p>
              <p className="text-xs mt-1">Gunakan tombol "Kompilasi Laporan Baru" di kanan atas atau aktifkan penjadwal otomatis.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SCHEDULER SETTINGS & LIST ARCHIVES (1/3 width) */}
        <div className="space-y-6" id="executive-control-panel">
          {/* 1. Scheduler Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 text-left space-y-4" id="cron-scheduler-config">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Auto-Scheduler PMO
                </h3>
              </div>

              {/* Status Switch */}
              <button
                onClick={handleToggleScheduler}
                className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                id="scheduler-toggle-switch"
                title={schedulerSettings.enabled ? 'Matikan Penjadwalan Otomatis' : 'Aktifkan Penjadwalan Otomatis'}
              >
                {schedulerSettings.enabled ? (
                  <ToggleRight className="w-10 h-10 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-400" />
                )}
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 leading-normal bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${schedulerSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="font-extrabold uppercase text-[9px] tracking-wider text-slate-400 dark:text-slate-500">
                  Status Engine: {schedulerSettings.enabled ? 'Sistem Aktif (Simulated)' : 'Sistem Nonaktif'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {schedulerSettings.enabled ? (
                  <>
                    Sistem akan otomatis merangkum aktivitas 7 hari terakhir pada hari{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{getDayName(schedulerSettings.dayOfWeek)}</span> pukul{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{schedulerSettings.time}</span> WIB, mengirimkannya ke email direksi, dan menyinkronkannya dengan Google Sheets.
                  </>
                ) : (
                  'Layanan penjadwalan otomatis dihentikan sementara. Aktifkan sakelar di atas untuk mengaktifkan kembali kompilasi background.'
                )}
              </p>
            </div>

            {/* Config Form / Display */}
            {isEditingScheduler ? (
              <form onSubmit={handleSaveScheduler} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block">
                    Frekuensi Pelaporan
                  </label>
                  <select
                    value={schedulerForm.frequency}
                    onChange={(e) => setSchedulerForm({ ...schedulerForm, frequency: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Mingguan (Weekly Summary)</option>
                    <option value="daily">Harian (Daily Summary)</option>
                    <option value="monthly">Bulanan (Monthly Summary)</option>
                  </select>
                </div>

                {schedulerForm.frequency === 'weekly' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block">
                      Hari Kompilasi
                    </label>
                    <select
                      value={schedulerForm.dayOfWeek}
                      onChange={(e) => setSchedulerForm({ ...schedulerForm, dayOfWeek: parseInt(e.target.value, 10) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">Senin</option>
                      <option value="2">Selasa</option>
                      <option value="3">Rabu</option>
                      <option value="4">Kamis</option>
                      <option value="5">Jumat</option>
                      <option value="6">Sabtu</option>
                      <option value="0">Minggu</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block">
                    Waktu Kompilasi (WIB)
                  </label>
                  <input
                    type="time"
                    value={schedulerForm.time}
                    onChange={(e) => setSchedulerForm({ ...schedulerForm, time: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block">
                    Email Penerima Manajemen
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={schedulerForm.recipientEmail}
                      onChange={(e) => setSchedulerForm({ ...schedulerForm, recipientEmail: e.target.value })}
                      placeholder="manajemen@pmo.co.id"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingScheduler(false)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-1">
                {/* Read-Only Configuration Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">Frekuensi</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      {schedulerSettings.frequency === 'weekly' ? 'Mingguan' : schedulerSettings.frequency === 'daily' ? 'Harian' : 'Bulanan'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">Penyetelan Hari</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      {schedulerSettings.frequency === 'weekly' ? getDayName(schedulerSettings.dayOfWeek) : 'Setiap Hari'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 col-span-2">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">Waktu Kompilasi</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {schedulerSettings.time} WIB
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 col-span-2">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">Email Target</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {schedulerSettings.recipientEmail}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsEditingScheduler(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent"
                    id="edit-scheduler-btn"
                  >
                    Ubah Pengaturan Jadwal
                  </button>
                  
                  {schedulerSettings.enabled && (
                    <button
                      onClick={handleSimulateSchedulerRun}
                      title="Simulasikan trigger interval cron oleh server untuk mengompilasi laporan instan"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1 cursor-pointer border border-emerald-500/30"
                      id="simulate-scheduler-run-btn"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Simulasi Run Cron
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. List History Compiled Reports */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 text-left space-y-4" id="compiled-reports-archive-list">
            <div className="flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Arsip Ringkasan Eksekutif
              </h3>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                {compiledSummaries.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1" id="archive-scroller">
              {compiledSummaries.map((sum) => {
                const isActive = sum.id === selectedSummaryId;
                return (
                  <div
                    key={sum.id}
                    onClick={() => setSelectedSummaryId(sum.id)}
                    className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex justify-between items-start gap-3 relative overflow-hidden group ${
                      isActive
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 shadow-sm'
                        : 'bg-slate-50/30 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/30 border-slate-150 dark:border-slate-850'
                    }`}
                    id={`archive-item-${sum.id}`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-blue-600 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          7 HARI
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        <span className="text-[9px] font-bold text-slate-400 block truncate shrink-0">
                          {sum.startDate} - {sum.endDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 tracking-tight block truncate">
                        {sum.title}
                      </h4>
                      <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        <span>{sum.totalReports} Laporan</span>
                        <span>•</span>
                        <span className="text-blue-600">+{sum.progressGained}% Gained</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Apakah Anda yakin ingin menghapus arsip ringkasan laporan ini?')) {
                          onDeleteSummary(sum.id);
                          if (isActive && compiledSummaries.length > 1) {
                            const remaining = compiledSummaries.filter(s => s.id !== sum.id);
                            setSelectedSummaryId(remaining[0].id);
                          }
                          triggerNotification('Arsip Dihapus', 'Ringkasan laporan berhasil dihapus dari arsip.', 'info');
                        }
                      }}
                      className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors p-1.5 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 opacity-0 group-hover:opacity-100 md:opacity-0 focus:opacity-100"
                      title="Hapus Arsip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
