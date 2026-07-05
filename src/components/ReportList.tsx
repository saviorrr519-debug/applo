import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProjectProgressReport, ReportCategory, ReportStatus, Project, ActiveRole } from '../types';
import { Filter, Calendar, MapPin, HardHat, CheckCircle, AlertCircle, Clock, Search, ZoomIn, X, Info, ChevronLeft, ChevronRight, AlertTriangle, ThumbsUp, MessageSquare, Download, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReportPhotoGallery from './ReportPhotoGallery';
import ReportApprovalActions from './ReportApprovalActions';
import ReportExportModal from './ReportExportModal';

interface ReportListProps {
  reports: ProjectProgressReport[];
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  highlightedReportId: string | null;
  clearHighlightedReport: () => void;
  activeRole?: ActiveRole;
  onUpdateReportStatus?: (
    reportId: string,
    approvalStatus: 'Pending' | 'Disetujui' | 'Perlu Revisi',
    feedback?: string
  ) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function ReportList({
  reports,
  projects,
  selectedProjectId,
  onSelectProject,
  highlightedReportId,
  clearHighlightedReport,
  activeRole = 'Pekerja Lapangan',
  onUpdateReportStatus,
  selectedCategory,
  onSelectCategory,
}: ReportListProps) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState<string>('Semua');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Lightbox Modal for high-res photo inspection
  const [activePhotoGroup, setActivePhotoGroup] = useState<string[] | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Ref to handle smooth scrolling to highlighted notification reports
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedReportId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Reset highlighting after 4 seconds
      const timer = setTimeout(() => {
        clearHighlightedReport();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightedReportId]);

  // Categories list for filter dropdown
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    reports.forEach(r => cats.add(r.category));
    return ['Semua', ...Array.from(cats)];
  }, [reports]);

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportDate = new Date(report.timestamp);
      const formattedDateFull = reportDate.toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).toLowerCase();
      const formattedDateShort = reportDate.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).toLowerCase();
      const formattedDateISO = reportDate.toISOString().toLowerCase();

      // Search query filter (matches project name, description, reporter name, or date)
      const matchesSearch =
        report.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedDateFull.includes(searchTerm.toLowerCase()) ||
        formattedDateShort.includes(searchTerm.toLowerCase()) ||
        formattedDateISO.includes(searchTerm.toLowerCase());

      // Project ID filter
      const matchesProject = !selectedProjectId || report.projectId === selectedProjectId;

      // Category filter
      const matchesCategory = selectedCategory === 'Semua' || report.category === selectedCategory;

      // Status filter
      const matchesStatus = selectedStatus === 'Semua' || report.status === selectedStatus;

      // Approval Status filter
      const reportApproval = report.approvalStatus || 'Pending';
      const matchesApproval = selectedApprovalFilter === 'Semua' || reportApproval === selectedApprovalFilter;

      return matchesSearch && matchesProject && matchesCategory && matchesStatus && matchesApproval;
    }).sort((a, b) => b.timestamp - a.timestamp); // Newest reports first
  }, [reports, searchTerm, selectedProjectId, selectedCategory, selectedStatus, selectedApprovalFilter]);

  const getApprovalStatusStyle = (status?: 'Pending' | 'Disetujui' | 'Perlu Revisi') => {
    const currentStatus = status || 'Pending';
    switch (currentStatus) {
      case 'Disetujui':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
          text: 'Disetujui',
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        };
      case 'Perlu Revisi':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
          text: 'Perlu Revisi',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800',
          text: 'Pending',
          icon: <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        };
    }
  };

  const getStatusStyle = (status: ReportStatus) => {
    switch (status) {
      case 'Selesai':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        };
      case 'Tertunda':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        };
      case 'Butuh Tindakan':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/40',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        };
    }
  };

  const getCategoryBadgeColor = (cat: ReportCategory) => {
    switch (cat) {
      case 'Struktur': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';
      case 'Arsitektur': return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40';
      case 'Mekanikal & Elektrikal': return 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40';
      case 'Finishing': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      case 'Kesehatan & Keselamatan (K3)': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6" id="report-list-container">
      {/* Top Header Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 dark:bg-slate-950 p-5 rounded-2xl text-white shadow-lg" id="reports-top-header-bar">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            Laporan Kemajuan Konstruksi
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Monitor, filter, dan unduh data progress fisik mingguan dari lapangan secara terstruktur.
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 w-full sm:w-auto justify-center cursor-pointer"
          id="trigger-export-modal-btn"
        >
          <Download className="w-4 h-4" />
          Ekspor &amp; Ringkasan
        </button>
      </div>

      {/* Filtering Actions Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4" id="filters-panel">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama proyek, deskripsi, pelapor, atau tanggal (cth: 04 Jul)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              id="search-reports-input"
            />
          </div>

          {/* Project Filter */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedProjectId || 'Semua'}
              onChange={(e) => onSelectProject(e.target.value === 'Semua' ? null : e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
              id="filter-project-select"
            >
              <option value="Semua">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
              id="filter-category-select"
            >
              <option value="Semua">Kategori Pekerjaan: Semua</option>
              {categoriesList.filter(c => c !== 'Semua').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

           {/* Status Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
              id="filter-status-select"
            >
              <option value="Semua">Semua Status</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Tertunda">Tertunda</option>
              <option value="Butuh Tindakan">Butuh Tindakan</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Approval Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedApprovalFilter}
              onChange={(e) => setSelectedApprovalFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
              id="filter-approval-select"
            >
              <option value="Semua">Semua Persetujuan</option>
              <option value="Pending">Pending</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Clear Filter Bar indicator */}
        {(searchTerm || selectedProjectId || selectedCategory !== 'Semua' || selectedStatus !== 'Semua' || selectedApprovalFilter !== 'Semua') && (
          <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50" id="filter-meta-indicator">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
              Menampilkan {filteredReports.length} hasil penyaringan laporan.
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                onSelectProject(null);
                onSelectCategory('Semua');
                setSelectedStatus('Semua');
                setSelectedApprovalFilter('Semua');
              }}
              className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300"
              id="clear-all-filters-btn"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Reports Timeline / List */}
      <div className="space-y-4" id="reports-feed">
        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm" id="empty-reports-state">
            <Info className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada laporan ditemukan</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba ubah filter atau lakukan pencarian baru.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isHighlighted = highlightedReportId === report.id;
            const statusStyle = getStatusStyle(report.status);

            return (
              <div
                key={report.id}
                ref={isHighlighted ? highlightedRef : null}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-500 overflow-hidden text-left shadow-sm ${
                  isHighlighted
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/10 dark:bg-blue-950/20 shadow-lg'
                    : 'border-slate-100/90 dark:border-slate-800/80'
                }`}
                id={`report-item-${report.id}`}
              >
                {/* Highlight header bar if selected */}
                {isHighlighted && (
                  <div className="bg-blue-600 text-white px-4 py-1 text-[10px] font-black text-center uppercase tracking-widest flex items-center justify-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    Update Baru Ditinjau Tim Manajemen
                  </div>
                )}

                <div className="p-5 flex flex-col md:flex-row gap-5">
                  {/* Real-time photo preview with swipeable gallery */}
                  <ReportPhotoGallery
                    photoUrl={report.photoUrl}
                    photoUrls={report.photoUrls}
                    projectName={report.projectName}
                    onZoom={(url) => {
                      const allPhotos = report.photoUrls && report.photoUrls.length > 0 ? report.photoUrls : [report.photoUrl];
                      const idx = allPhotos.indexOf(url);
                      setActivePhotoGroup(allPhotos);
                      setActivePhotoIndex(idx !== -1 ? idx : 0);
                    }}
                  />

                  {/* Text Details */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        {/* Project Name linkable */}
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                          {report.projectName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {report.location}
                        </p>
                      </div>

                      {/* Badges container */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {report.isOfflineQueued && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 bg-amber-500 text-white border border-amber-600 animate-pulse" id={`offline-badge-${report.id}`}>
                            <Clock className="w-3.5 h-3.5 text-white" />
                            Tersimpan Lokal (Antre Sync)
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeColor(report.category)}`}>
                          {report.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border ${statusStyle.bg}`}>
                          {statusStyle.icon}
                          {report.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border ${getApprovalStatusStyle(report.approvalStatus).bg}`}>
                          {getApprovalStatusStyle(report.approvalStatus).icon}
                          Persetujuan: {getApprovalStatusStyle(report.approvalStatus).text}
                        </span>
                      </div>
                    </div>

                    {/* Progress percentage bar */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span>Pencapaian Progress:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-black">{report.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${report.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Description Text */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {report.description}
                    </p>

                    {/* Management Feedback Bubble */}
                    {report.managementFeedback && (
                      <div className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all duration-300 ${
                        report.approvalStatus === 'Disetujui'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20 text-slate-700 dark:text-slate-300'
                          : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-100/60 dark:border-amber-900/20 text-slate-700 dark:text-slate-300'
                      }`} id={`feedback-bubble-${report.id}`}>
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400">
                              Feedback Manajemen:
                            </span>
                            <p className="italic">"{report.managementFeedback}"</p>
                          </div>
                        </div>
                      </div>
                    )}

                     {/* Footer / Meta Data */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <HardHat className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dilaporkan oleh:</span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">{report.reporterName}</span>
                        <span className="text-slate-400 dark:text-slate-500">({report.reporterRole})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(report.timestamp).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>

                    {/* Management Direct Actions (Visible only to 'Tim Manajemen') */}
                    {activeRole === 'Tim Manajemen' && (
                      <div className="mt-2 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                        {report.isOfflineQueued ? (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                            <span>Laporan tersimpan di perangkat lokal pelapor (offline). Hubungkan kembali simulator ke online untuk menyinkronkan laporan sebelum dapat ditinjau.</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Panel Tinjauan Manajemen
                              </span>
                            </div>
                            <ReportApprovalActions
                              report={report}
                              onUpdate={onUpdateReportStatus}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox / Enlarged Photo Modal */}
      <AnimatePresence>
        {activePhotoGroup && activePhotoGroup.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setActivePhotoGroup(null)}
            id="photo-lightbox-modal"
          >
            {/* Close button */}
            <button
              onClick={() => setActivePhotoGroup(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-rose-600 hover:text-white text-white p-2.5 rounded-full transition-all duration-200 z-50 shadow-md"
              id="close-lightbox-btn"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left navigation arrow */}
            {activePhotoGroup.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev === 0 ? activePhotoGroup.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200 z-50 shadow-md"
                title="Foto Sebelumnya"
                id="lightbox-prev-btn"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right navigation arrow */}
            {activePhotoGroup.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev === activePhotoGroup.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200 z-50 shadow-md"
                title="Foto Berikutnya"
                id="lightbox-next-btn"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden flex items-center justify-center bg-slate-950">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activePhotoIndex}
                    src={activePhotoGroup[activePhotoIndex]}
                    alt={`Foto Laporan ${activePhotoIndex + 1}`}
                    initial={{ opacity: 0.8, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-full max-h-[75vh] object-contain block"
                    id="lightbox-img"
                  />
                </AnimatePresence>
              </div>

              {/* Bottom footer bar with index info */}
              <div className="w-full p-4 bg-slate-900 text-center flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5 px-6">
                <span className="text-xs text-white/50 font-semibold tracking-wide uppercase">
                  FOTO LAPORAN KEMAJUAN LAPANGAN REAL-TIME
                </span>
                {activePhotoGroup.length > 1 && (
                  <span className="text-xs bg-white/10 text-white font-extrabold px-3 py-1 rounded-full">
                    Foto {activePhotoIndex + 1} dari {activePhotoGroup.length}
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export & Weekly Summary Modal */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reports={filteredReports}
        projects={projects}
        selectedProjectId={selectedProjectId}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        selectedApprovalFilter={selectedApprovalFilter}
      />
    </div>
  );
}
