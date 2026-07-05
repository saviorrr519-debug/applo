import React, { useState, useRef } from 'react';
import { Project, ProjectProgressReport, ReportCategory, ReportStatus, ActiveRole } from '../types';
import { compressAndResizeImage } from '../data';
import { PlusCircle, UploadCloud, CheckCircle2, Image as ImageIcon, Sparkles, HardHat, AlertTriangle, FileText, Trash2, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportFormProps {
  projects: Project[];
  activeRole: ActiveRole;
  onAddReport: (newReport: ProjectProgressReport) => void;
  triggerNotification: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error', reportId: string) => void;
  soundEnabled: boolean;
}

// Quick select presets for effortless testing inside the preview iframe
const PHOTO_PRESETS = [
  {
    name: 'Pondasi Beton',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
    category: 'Struktur' as ReportCategory
  },
  {
    name: 'Rangka Baja',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
    category: 'Struktur' as ReportCategory
  },
  {
    name: 'Sistem Kabel & ME',
    url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80',
    category: 'Mekanikal & Elektrikal' as ReportCategory
  },
  {
    name: 'Cat & Interior Finishing',
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
    category: 'Finishing' as ReportCategory
  }
];

export default function ReportForm({
  projects,
  activeRole,
  onAddReport,
  triggerNotification,
  soundEnabled,
}: ReportFormProps) {
  // Form State
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [reporterName, setReporterName] = useState('Budi Setiawan');
  const [category, setCategory] = useState<ReportCategory>('Struktur');
  const [progressPercentage, setProgressPercentage] = useState(50);
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [status, setStatus] = useState<ReportStatus>('Sedang Berjalan');

  // Interactive UI State
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input (Voice-to-Text) State and Logic
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  const playMicBeep = (type: 'start' | 'stop') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      if (type === 'start') {
        osc.frequency.setValueAtTime(660, ctx.currentTime); // High pitch
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // Lower pitch
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      }
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio Context could not play mic beep', e);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerNotification(
        'Fitur Suara Tidak Didukung',
        'Browser Anda tidak mendukung fitur perekaman suara (Speech Recognition).',
        'error',
        `speech-err-${Date.now()}`
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'id-ID';

      recognition.onstart = () => {
        setIsListening(true);
        playMicBeep('start');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript) {
          setDescription((prev) => {
            const space = prev ? (prev.endsWith(' ') ? '' : ' ') : '';
            return prev + space + transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          triggerNotification(
            'Akses Mikrofon Ditolak',
            'Harap izinkan akses mikrofon pada browser Anda untuk menggunakan fitur input suara.',
            'warning',
            `speech-err-${Date.now()}`
          );
        } else if (event.error !== 'aborted') {
          triggerNotification(
            'Error Input Suara',
            `Terjadi kesalahan pada input suara: ${event.error}`,
            'error',
            `speech-err-${Date.now()}`
          );
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        playMicBeep('stop');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Play a soft synthetic audio chime to represent real-time alerts
  const playNotificationChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Soft double beep
      const osc1 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5 note
      
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      
      osc1.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio Context could not start', e);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        await processImageFile(e.dataTransfer.files[i]);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        await processImageFile(e.target.files[i]);
      }
    }
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan.');
      return;
    }
    
    setIsUploading(true);
    try {
      const optimizedBase64 = await compressAndResizeImage(file);
      setPhotoUrls((prev) => [...prev, optimizedBase64]);
      setPhotoNames((prev) => [...prev, file.name]);
    } catch (err) {
      console.error('Gagal mengoptimasi gambar:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const selectPresetPhoto = (preset: typeof PHOTO_PRESETS[0]) => {
    if (photoUrls.includes(preset.url)) return;
    setPhotoUrls((prev) => [...prev, preset.url]);
    setPhotoNames((prev) => [...prev, `Preset: ${preset.name}`]);
    setCategory(preset.category);
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
    setPhotoNames((prev) => prev.filter((_, i) => i !== index));
  };

  const clearPhotos = () => {
    setPhotoUrls([]);
    setPhotoNames([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !reporterName || !description || photoUrls.length === 0) {
      alert('Harap isi semua kolom form dan upload minimal satu foto lapangan.');
      return;
    }

    const selectedProject = projects.find(p => p.id === projectId);
    const projectName = selectedProject ? selectedProject.name : 'Proyek';
    const projectLocation = selectedProject ? selectedProject.location : 'Lapangan';

    const newReportId = `rep-${Date.now()}`;
    const newReport: ProjectProgressReport = {
      id: newReportId,
      projectId,
      projectName,
      location: projectLocation,
      reporterName,
      reporterRole: activeRole === 'Pekerja Lapangan' ? 'Pekerja Lapangan' : 'Pengawas',
      date: new Date().toISOString().split('T')[0],
      progressPercentage,
      description,
      photoUrl: photoUrls[0] || '',
      photoUrls: photoUrls,
      category,
      status,
      timestamp: Date.now(),
      approvalStatus: 'Pending'
    };

    // Trigger report callback
    onAddReport(newReport);

    // Audio chime
    playNotificationChime();

    // Trigger automatic notification alert
    triggerNotification(
      `Laporan Progress Baru: ${projectName}`,
      `${activeRole} ${reporterName} mengirim update untuk kategori ${category} (${progressPercentage}%).`,
      status === 'Tertunda' ? 'warning' : status === 'Butuh Tindakan' ? 'error' : 'success',
      newReportId
    );

    // Reset Form (except reporter name)
    setDescription('');
    setPhotoUrls([]);
    setPhotoNames([]);
    setProgressPercentage(50);
    
    // Show beautiful success overlay
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 relative" id="report-form-container">
      {/* Alert banner for role check */}
      {activeRole !== 'Pekerja Lapangan' && (
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <HardHat className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Anda sedang dalam mode manajemen. Namun, Anda tetap bisa mensimulasikan input laporan sebagai Pengawas Lapangan.</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <PlusCircle className="w-5.5 h-5.5 text-blue-600" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Kirim Laporan Progress Proyek
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" id="progress-report-form">
        {/* Project & Category Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pilih Proyek Lapangan
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              required
              id="form-select-project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kategori Pekerjaan
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              id="form-select-category"
            >
              <option value="Struktur">Struktur Beton / Baja</option>
              <option value="Arsitektur">Arsitektur / Tata Ruang</option>
              <option value="Mekanikal & Elektrikal">Mekanikal & Elektrikal (MEP)</option>
              <option value="Finishing">Finishing / Pengecatan</option>
              <option value="Kesehatan & Keselamatan (K3)">Kesehatan & Keselamatan (K3)</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Reporter Name & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nama Pelapor Lapangan
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              required
              id="form-input-reporter"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status Lapangan Saat Ini
            </label>
            <div className="grid grid-cols-3 gap-2" id="status-option-grid">
              {(['Sedang Berjalan', 'Selesai', 'Tertunda'] as ReportStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    status === st
                      ? st === 'Selesai'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        : st === 'Tertunda'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-400'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  id={`form-status-btn-${st.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time photo upload container */}
        <div className="space-y-2 text-left" id="photo-upload-container">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Upload Foto Lapangan Real-Time <span className="text-rose-500">*</span>
          </label>

          {/* Preset Construction Images to make Testing Extremely Seamless */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2.5">
              💡 Cepat: Pilih contoh foto konstruksi di bawah untuk demo instan
            </span>
            <div className="grid grid-cols-4 gap-2" id="preset-photo-grid">
              {PHOTO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectPresetPhoto(preset)}
                  className="group relative h-16 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800 hover:border-blue-500 shadow-sm transition-all text-left"
                  title={`Gunakan ${preset.name}`}
                  id={`preset-photo-btn-${idx}`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-end p-1">
                    <span className="text-[9px] font-semibold text-white truncate w-full">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/20'
                : photoUrls.length > 0
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/5 dark:bg-emerald-950/5'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
            }`}
            id="drag-drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
              id="file-upload-input"
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-4" id="upload-loading-indicator">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Mengompres & memproses foto...
                </span>
              </div>
            ) : photoUrls.length > 0 ? (
              <div className="space-y-4" id="uploaded-photos-gallery-container">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {photoUrls.length} Foto berhasil dimuat
                  </p>
                  <button
                    type="button"
                    onClick={clearPhotos}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="group relative h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Hapus foto ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-[8px] font-medium text-white truncate text-center">
                        {photoNames[index] || `Foto ${index + 1}`}
                      </div>
                    </div>
                  ))}
                  {/* Append photo button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <PlusCircle className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Tambah</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center py-3"
              >
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full mb-3 shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Seret & taruh foto disini, atau <span className="text-blue-600 dark:text-blue-400 hover:underline">cari file</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Mendukung kamera smartphone, bisa memilih beberapa foto sekaligus
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Slider (Percentage) */}
        <div className="space-y-2 text-left" id="progress-slider-container">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kemajuan Pekerjaan (Progress)
            </label>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg">
              {progressPercentage}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progressPercentage}
            onChange={(e) => setProgressPercentage(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            id="form-range-progress"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
            <span>0% (Persiapan)</span>
            <span>50% (Tengah Jalan)</span>
            <span>100% (Selesai Kerja)</span>
          </div>
        </div>

        {/* Activity Description */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Detail Laporan Pekerjaan & Kendala Lapangan
            </label>
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/70'
              }`}
              title={isListening ? 'Hentikan perekaman suara' : 'Mulai perekaman suara (Voice-to-Text)'}
              id="voice-input-btn"
            >
              {isListening ? (
                <>
                  <MicOff className="w-3 h-3 text-white" />
                  <span>Selesai Bicara</span>
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Input Suara (id-ID)</span>
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan progress pengerjaan saat ini. Tuliskan kendala bahan/cuaca jika ada agar ditinjau oleh tim manajemen..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all leading-relaxed"
              required
              id="form-textarea-desc"
            />
            {isListening && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                <span>Perekaman Suara Aktif...</span>
              </div>
            )}
            <div className="absolute right-3 bottom-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {description.length} p_char
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          id="submit-report-btn"
        >
          <Sparkles className="w-5 h-5 text-white" />
          Kirim Laporan & Notifikasi Manajemen
        </button>
      </form>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center"
            id="success-overlay"
          >
            <motion.div
              initial={{ scale: 0.8, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 10 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-full mb-4 shadow-sm"
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Laporan Berhasil Terkirim!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed">
              Notifikasi push telah dipancarkan secara otomatis ke panel tim manajemen di kantor pusat.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
