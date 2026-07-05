import React, { useState, useMemo, useEffect } from 'react';
import { ProjectProgressReport, Project } from '../types';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  TrendingUp,
  Award,
  Users,
  LogOut,
  ExternalLink,
  CloudLightning,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from '../lib/googleAuth';
import { createSpreadsheet, populateSpreadsheet } from '../lib/googleSheets';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ProjectProgressReport[];
  projects: Project[];
  selectedProjectId: string | null;
  selectedCategory: string;
  selectedStatus: string;
  selectedApprovalFilter: string;
}

export default function ReportExportModal({
  isOpen,
  onClose,
  reports,
  projects,
  selectedProjectId,
  selectedCategory,
  selectedStatus,
  selectedApprovalFilter
}: ReportExportModalProps) {
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Google Sheets integration state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [googleExportError, setGoogleExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Initialize google auth listener
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setGoogleExportError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setGoogleExportError('Gagal melakukan autentikasi dengan Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      setSpreadsheetUrl(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportGoogleSheets = async () => {
    const token = googleToken || await getAccessToken();
    if (!token) {
      setGoogleExportError('Token akses tidak ditemukan. Silakan login kembali.');
      return;
    }

    setIsGoogleLoading(true);
    setGoogleExportError(null);
    setSpreadsheetUrl(null);

    try {
      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
      const title = `PT Konstruksi Nusantara - Laporan Progres (${dateStr})`;
      
      const sheet = await createSpreadsheet(token, title);
      await populateSpreadsheet(token, sheet.spreadsheetId, reports, stats, activeFiltersDesc);
      
      setSpreadsheetUrl(sheet.spreadsheetUrl);
    } catch (err: any) {
      console.error(err);
      setGoogleExportError(err.message || 'Gagal mengekspor laporan ke Google Sheets.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Get active filters description for the header
  const activeFiltersDesc = useMemo(() => {
    const projName = selectedProjectId
      ? projects.find((p) => p.id === selectedProjectId)?.name || 'Proyek Terpilih'
      : 'Semua Proyek';
    return {
      project: projName,
      category: selectedCategory,
      status: selectedStatus,
      approval: selectedApprovalFilter
    };
  }, [projects, selectedProjectId, selectedCategory, selectedStatus, selectedApprovalFilter]);

  // Statistics summaries
  const stats = useMemo(() => {
    const total = reports.length;
    if (total === 0) {
      return { total: 0, avgProgress: 0, approved: 0, pending: 0, revision: 0 };
    }
    const sumProgress = reports.reduce((sum, r) => sum + r.progressPercentage, 0);
    const avgProgress = Math.round(sumProgress / total);

    const approved = reports.filter((r) => r.approvalStatus === 'Disetujui').length;
    const revision = reports.filter((r) => r.approvalStatus === 'Perlu Revisi').length;
    const pending = reports.filter((r) => !r.approvalStatus || r.approvalStatus === 'Pending').length;

    return { total, avgProgress, approved, pending, revision };
  }, [reports]);

  // Format date helper
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 1. Export CSV Handler
  const handleExportCSV = () => {
    setIsExportingCsv(true);
    try {
      const headers = [
        'ID Laporan',
        'Tanggal',
        'Nama Proyek',
        'Kategori',
        'Kemajuan (%)',
        'Status Lapangan',
        'Nama Pelapor',
        'Deskripsi',
        'Status Persetujuan',
        'Feedback Manajemen',
        'Waktu Pelaporan'
      ];

      const csvRows = [headers.map(h => `"${h}"`).join(',')];

      reports.forEach((r) => {
        const row = [
          r.id,
          r.date,
          r.projectName,
          r.category,
          r.progressPercentage,
          r.status,
          r.reporterName,
          r.description.replace(/"/g, '""'), // escape quotes
          r.approvalStatus || 'Pending',
          (r.managementFeedback || '').replace(/"/g, '""'),
          formatDate(r.timestamp)
        ];
        csvRows.push(row.map(val => `"${val}"`).join(','));
      });

      // Include UTF-8 BOM so Excel opens it correctly with formatting
      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `Laporan_Progres_Fisik_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  // 2. Export PDF Handler with jsPDF
  const handleExportPDF = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 15;

        // Cover / Header Letterhead
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('PT KONSTRUKSI NUSANTARA', 15, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Sistem Monitoring Fisik & Pelaporan Kemajuan Proyek', 15, 24);
        doc.text('Email: management@konstruksinusantara.co.id | Jakarta, Indonesia', 15, 29);

        doc.setFontSize(8);
        doc.text(`Dicetak pada: ${formatDate(Date.now())}`, pageWidth - 15, 15, { align: 'right' });

        yPos = 50;

        // Document Title
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('LAPORAN RINGKASAN MINGGUAN PROGRESS FISIK', 15, yPos);
        yPos += 7;

        // Meta Filters info
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(
          `Filter: Proyek (${activeFiltersDesc.project}) | Kategori (${activeFiltersDesc.category}) | Status Lapangan (${activeFiltersDesc.status}) | Persetujuan (${activeFiltersDesc.approval})`,
          15,
          yPos
        );
        yPos += 10;

        // Summary Stats Box
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.rect(15, yPos, pageWidth - 30, 25, 'F');
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.rect(15, yPos, pageWidth - 30, 25, 'D');

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('RINGKASAN EKSEKUTIF', 20, yPos + 6);

        doc.setFont('helvetica', 'normal');
        doc.text(`Total Laporan: ${stats.total}`, 20, yPos + 13);
        doc.text(`Rata-rata Progress: ${stats.avgProgress}%`, 20, yPos + 19);

        doc.text(`Status Persetujuan:`, pageWidth / 2, yPos + 6);
        doc.text(`- Disetujui: ${stats.approved}`, pageWidth / 2, yPos + 11);
        doc.text(`- Perlu Revisi: ${stats.revision}`, pageWidth / 2, yPos + 16);
        doc.text(`- Pending: ${stats.pending}`, pageWidth / 2, yPos + 21);

        yPos += 35;

        // Table Header
        doc.setFillColor(51, 65, 85); // Slate-700
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('No', 17, yPos + 5.5);
        doc.text('Proyek / Pelapor', 25, yPos + 5.5);
        doc.text('Kategori', 75, yPos + 5.5);
        doc.text('Tgl / Progress', 115, yPos + 5.5);
        doc.text('Status Lapangan', 145, yPos + 5.5);
        doc.text('Persetujuan', 175, yPos + 5.5);

        yPos += 8;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        reports.forEach((rep, index) => {
          // Check for page overflow
          if (yPos > pageHeight - 35) {
            doc.addPage();
            // Re-render header on new page
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, pageWidth, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('PT KONSTRUKSI NUSANTARA - Laporan Progres Lanjutan', 15, 12);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(`Halaman ${doc.internal.pages.length - 1}`, pageWidth - 15, 12, { align: 'right' });

            yPos = 30;

            // Reprint small table headers
            doc.setFillColor(51, 65, 85);
            doc.rect(15, yPos, pageWidth - 30, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('No', 17, yPos + 5);
            doc.text('Proyek / Pelapor', 25, yPos + 5);
            doc.text('Kategori', 75, yPos + 5);
            doc.text('Tgl / Progress', 115, yPos + 5);
            doc.text('Status Lapangan', 145, yPos + 5);
            doc.text('Persetujuan', 175, yPos + 5);

            yPos += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
          }

          // Alternating row background
          if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, yPos, pageWidth - 30, 11, 'F');
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}`, 17, yPos + 7);
          
          // Project name (truncate if too long)
          const pName = rep.projectName.length > 25 ? `${rep.projectName.substring(0, 23)}..` : rep.projectName;
          doc.text(pName, 25, yPos + 4.5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.text(`Oleh: ${rep.reporterName}`, 25, yPos + 8.5);
          doc.setFontSize(8);

          doc.text(rep.category, 75, yPos + 7);
          
          doc.text(rep.date, 115, yPos + 4.5);
          doc.setFont('helvetica', 'bold');
          doc.text(`${rep.progressPercentage}%`, 115, yPos + 8.5);
          doc.setFont('helvetica', 'normal');

          doc.text(rep.status, 145, yPos + 7);

          // Color coded approval text
          const appr = rep.approvalStatus || 'Pending';
          if (appr === 'Disetujui') {
            doc.setTextColor(16, 185, 129); // Green
          } else if (appr === 'Perlu Revisi') {
            doc.setTextColor(245, 158, 11); // Amber
          } else {
            doc.setTextColor(100, 116, 139); // Slate
          }
          doc.setFont('helvetica', 'bold');
          doc.text(appr, 175, yPos + 7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);

          // Divider line
          doc.setDrawColor(241, 245, 249);
          doc.line(15, yPos + 11, pageWidth - 15, yPos + 11);

          yPos += 11;
        });

        // Signatures area (make sure it doesn't overflow)
        if (yPos > pageHeight - 45) {
          doc.addPage();
          doc.setFillColor(30, 41, 59);
          doc.rect(0, 0, pageWidth, 20, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('PT KONSTRUKSI NUSANTARA - Lembar Pengesahan', 15, 12);
          yPos = 35;
        } else {
          yPos += 15;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Disiapkan oleh,', 25, yPos);
        doc.text('Sistem Monitoring Konstruksi', 25, yPos + 4);

        doc.text('Disetujui oleh,', pageWidth - 70, yPos);
        doc.text('Manajer Hubungan Proyek & K3', pageWidth - 70, yPos + 4);

        doc.line(25, yPos + 22, 70, yPos + 22);
        doc.line(pageWidth - 70, yPos + 22, pageWidth - 25, yPos + 22);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('Digital Signature System', 25, yPos + 26);
        doc.text('Tim Manajemen Pusat', pageWidth - 70, yPos + 26);

        // Save PDF file
        const dateStr = new Date().toISOString().slice(0, 10);
        doc.save(`Ringkasan_Laporan_Kemajuan_${dateStr}.pdf`);
      } catch (err) {
        console.error('Error generating PDF:', err);
      } finally {
        setIsExportingPdf(false);
      }
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
            id="report-export-modal"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/10">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  Pusat Ekspor &amp; Ringkasan Laporan
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Unduh ringkasan progres dan performa lapangan untuk kebutuhan berkas &amp; koordinasi eksternal.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                id="close-export-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              
              {/* Export Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="export-actions-grid">
                
                {/* PDF Export Card */}
                <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/10 dark:from-blue-950/10 dark:to-blue-900/5 p-4 rounded-xl border border-blue-100/60 dark:border-blue-950 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg inline-block">
                      <FileText className="w-5 h-5" />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Unduh Ringkasan Resmi (PDF)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Laporan dokumen formal yang rapi dengan kop surat perusahaan, tabel terstruktur, persentase rata-rata, dan kolom tanda tangan pengesahan. Sangat cocok untuk rapat mingguan.
                    </p>
                  </div>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPdf || reports.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                    id="export-pdf-action-btn"
                  >
                    {isExportingPdf ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengompilasi PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Unduh PDF Ringkasan
                      </>
                    )}
                  </button>
                </div>

                {/* CSV Export Card */}
                <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/10 dark:from-emerald-950/10 dark:to-emerald-900/5 p-4 rounded-xl border border-emerald-100/60 dark:border-emerald-950 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg inline-block">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Data Mentah CSV (Excel)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Ekspor data tabel secara menyeluruh untuk diimpor ke aplikasi pengolah data seperti Microsoft Excel, Google Sheets, atau sistem analisis data internal perusahaan lainnya.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    disabled={isExportingCsv || reports.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                    id="export-csv-action-btn"
                  >
                    {isExportingCsv ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengekspor CSV...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Ekspor ke CSV Excel
                      </>
                    )}
                  </button>
                </div>

                {/* Google Sheets Export Card */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/10 dark:from-indigo-950/10 dark:to-indigo-900/5 p-4 rounded-xl border border-indigo-100/60 dark:border-indigo-950 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg inline-block">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Google Sheets Sync
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Ekspor langsung ke Google Drive &amp; Google Sheets Anda. Desain kop surat, ringkasan eksekutif, serta data laporan akan tersinkronisasi otomatis dengan layout premium terstruktur.
                    </p>
                  </div>

                  {googleExportError && (
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-lg text-[10px] font-semibold border border-rose-100 dark:border-rose-900/30">
                      {googleExportError}
                    </div>
                  )}

                  {spreadsheetUrl && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/30 flex flex-col gap-1.5">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Spreadsheet Berhasil Dibuat!
                      </span>
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="flex items-center justify-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                      >
                        Buka Google Sheet
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {!googleUser ? (
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading || reports.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer dark:bg-slate-950 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-900 disabled:opacity-50"
                      id="google-signin-export-btn"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      <span className="text-xs">Hubungkan Google</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          {googleUser.photoURL ? (
                            <img src={googleUser.photoURL} alt={googleUser.displayName} className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 dark:border-slate-800" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                              {googleUser.displayName?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                            {googleUser.displayName || 'Google User'}
                          </span>
                        </div>
                        <button
                          onClick={handleGoogleLogout}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Putuskan Akun"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={handleExportGoogleSheets}
                        disabled={isGoogleLoading || reports.length === 0}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                        id="export-sheets-action-btn"
                      >
                        {isGoogleLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memproses Sync...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Ekspor ke Google Sheet
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Summary Letterhead Preview Box */}
              <div className="space-y-2" id="export-preview-box">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  Pratinjau Dokumen Cetak:
                </span>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40 p-6 space-y-5 shadow-inner select-none font-sans">
                  
                  {/* Pseudo Letterhead header */}
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        PT KONSTRUKSI NUSANTARA
                      </h4>
                      <p className="text-[9px] text-slate-400">Monitoring &amp; Konstruksi Pusat</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[9px] font-bold rounded-md">
                        DOKUMEN INTERN
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">Halaman 1 dari 1</p>
                    </div>
                  </div>

                  {/* Pseudo Executive Summary metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 rounded-lg text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Total Laporan</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{stats.total} Berkas</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Rata Progress</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{stats.avgProgress}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Disetujui</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{stats.approved} Laporan</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Butuh Revisi</span>
                      <span className="font-extrabold text-amber-500">{stats.revision} Laporan</span>
                    </div>
                  </div>

                  {/* Active Filter Badges */}
                  <div className="flex flex-wrap gap-2 text-[9px] text-slate-500 font-semibold uppercase">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Proyek: {activeFiltersDesc.project}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Kategori: {activeFiltersDesc.category}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Status: {activeFiltersDesc.status}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Persetujuan: {activeFiltersDesc.approval}</span>
                  </div>

                  {/* Pseudo Data List Table Preview */}
                  <div className="space-y-1.5">
                    <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300 grid grid-cols-12 gap-1 uppercase tracking-wider">
                      <div className="col-span-1">No</div>
                      <div className="col-span-5">Proyek &amp; Kategori</div>
                      <div className="col-span-2 text-right">Progress</div>
                      <div className="col-span-2 text-center">Status</div>
                      <div className="col-span-2 text-right">Persetujuan</div>
                    </div>

                    <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                      {reports.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-[10px] font-semibold bg-white dark:bg-slate-900 border rounded-lg border-slate-100 dark:border-slate-800">
                          Tidak ada data laporan terpilih untuk diekspor.
                        </div>
                      ) : (
                        reports.map((rep, index) => (
                          <div
                            key={rep.id}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2 rounded text-[10px] text-slate-600 dark:text-slate-300 grid grid-cols-12 gap-1 items-center"
                          >
                            <div className="col-span-1 font-bold">{index + 1}</div>
                            <div className="col-span-5 font-semibold truncate">
                              {rep.projectName}
                              <span className="block text-[8px] text-slate-400 font-normal">{rep.category}</span>
                            </div>
                            <div className="col-span-2 text-right font-black text-blue-600 dark:text-blue-400">{rep.progressPercentage}%</div>
                            <div className="col-span-2 text-center truncate px-1">{rep.status}</div>
                            <div className={`col-span-2 text-right font-bold uppercase text-[9px] ${
                              rep.approvalStatus === 'Disetujui' ? 'text-emerald-500' : rep.approvalStatus === 'Perlu Revisi' ? 'text-amber-500' : 'text-slate-400'
                            }`}>
                              {rep.approvalStatus || 'Pending'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pseudo Signatures */}
                  <div className="grid grid-cols-2 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 text-[9px] text-slate-400">
                    <div>
                      <p>Sistem Informasi Monitoring Lapangan</p>
                      <p className="mt-8 font-bold text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 inline-block pt-1">
                        Digital Verification Complete
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p>Disahkan oleh Departemen K3 &amp; PMO</p>
                      <p className="mt-8 font-bold text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 inline-block pt-1 text-right">
                        Tim Manajemen PT Konstruksi Nusantara
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 flex justify-end gap-2 text-xs">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                id="close-bottom-export-btn"
              >
                Kembali
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
