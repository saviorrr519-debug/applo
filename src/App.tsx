import React, { useState, useEffect } from 'react';
import { Project, ProjectProgressReport, NotificationAlert, ActiveRole, SchedulerSettings, CompiledWeeklySummary } from './types';
import { INITIAL_PROJECTS, INITIAL_REPORTS, INITIAL_NOTIFICATIONS, INITIAL_SCHEDULER_SETTINGS, INITIAL_COMPILED_SUMMARIES } from './data';
import Header from './components/Header';
import ProjectOverview from './components/ProjectOverview';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import ProjectStats from './components/ProjectStats';
import SheetsSyncHub from './components/SheetsSyncHub';
import ExecutiveSummary from './components/ExecutiveSummary';
import { LayoutDashboard, FileSpreadsheet, HardHat, AlertCircle, BellRing, Sparkles, X, Settings, Plus, Wifi, WifiOff, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logoutGoogle } from './lib/googleAuth';
import { db } from './lib/firebase';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import {
  saveProjectToFirestore,
  saveReportToFirestore,
  saveNotificationToFirestore,
  saveSchedulerSettingsToFirestore,
  saveCompiledSummaryToFirestore,
  deleteSummaryFromFirestore,
  seedFirestoreIfEmpty,
  clearFirestoreData
} from './lib/firestoreSync';
import { populateSpreadsheet } from './lib/googleSheets';
import SoundSettingsHub from './components/SoundSettingsHub';
import { SoundProfileId, playNotificationSound } from './lib/audio';

export default function App() {
  // --- 1. Load LocalStorage State or Defaults ---
  const [activeRole, setActiveRole] = useState<ActiveRole>(() => {
    const saved = localStorage.getItem('protrack_active_role');
    return (saved as ActiveRole) || 'Pekerja Lapangan';
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('protrack_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [reports, setReports] = useState<ProjectProgressReport[]>(() => {
    const saved = localStorage.getItem('protrack_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [notifications, setNotifications] = useState<NotificationAlert[]>(() => {
    const saved = localStorage.getItem('protrack_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('protrack_sound_enabled');
    return saved !== 'false'; // Default to true
  });

  const [approvedSoundProfile, setApprovedSoundProfile] = useState<SoundProfileId>(() => {
    return (localStorage.getItem('protrack_approved_sound_profile') as SoundProfileId) || 'standard';
  });

  const [revisionSoundProfile, setRevisionSoundProfile] = useState<SoundProfileId>(() => {
    return (localStorage.getItem('protrack_revision_sound_profile') as SoundProfileId) || 'dissonant';
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('protrack_dark_mode');
    return saved === 'true'; // Default to false
  });

  // --- Offline Sync & Connection Simulation State ---
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('protrack_is_online');
    return saved !== 'false'; // Default to true
  });

  const [offlineQueue, setOfflineQueue] = useState<ProjectProgressReport[]>(() => {
    const saved = localStorage.getItem('protrack_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // --- 2. Interactive Navigation Filters & Highlighting ---
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'summary'>('overview');
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string } | null>(null);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);

  // --- 3. Executive Summary & Auto-Scheduler States ---
  const [schedulerSettings, setSchedulerSettings] = useState<SchedulerSettings>(() => {
    const saved = localStorage.getItem('protrack_scheduler_settings');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULER_SETTINGS;
  });

  const [compiledSummaries, setCompiledSummaries] = useState<CompiledWeeklySummary[]>(() => {
    const saved = localStorage.getItem('protrack_compiled_summaries');
    return saved ? JSON.parse(saved) : INITIAL_COMPILED_SUMMARIES;
  });

  useEffect(() => {
    localStorage.setItem('protrack_scheduler_settings', JSON.stringify(schedulerSettings));
  }, [schedulerSettings]);

  useEffect(() => {
    localStorage.setItem('protrack_compiled_summaries', JSON.stringify(compiledSummaries));
  }, [compiledSummaries]);

  // --- Google Sheets Integration & Auto-Sync State ---
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [linkedSpreadsheetId, setLinkedSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('protrack_linked_spreadsheet_id') || null;
  });
  const [linkedSpreadsheetUrl, setLinkedSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('protrack_linked_spreadsheet_url') || null;
  });
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('protrack_is_auto_sync_enabled');
    return saved !== 'false'; // Default to true
  });

  const [syncLogs, setSyncLogs] = useState<Array<{ id: string; time: string; text: string; type: 'success' | 'error' | 'info' }>>([]);

  const addSyncLog = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text,
      type
    };
    setSyncLogs((prev) => [...prev, newLog]);
  };

  useEffect(() => {
    if (linkedSpreadsheetId) {
      localStorage.setItem('protrack_linked_spreadsheet_id', linkedSpreadsheetId);
    } else {
      localStorage.removeItem('protrack_linked_spreadsheet_id');
    }
  }, [linkedSpreadsheetId]);

  useEffect(() => {
    if (linkedSpreadsheetUrl) {
      localStorage.setItem('protrack_linked_spreadsheet_url', linkedSpreadsheetUrl);
    } else {
      localStorage.removeItem('protrack_linked_spreadsheet_url');
    }
  }, [linkedSpreadsheetUrl]);

  useEffect(() => {
    localStorage.setItem('protrack_is_auto_sync_enabled', String(isAutoSyncEnabled));
  }, [isAutoSyncEnabled]);

  // --- 3. Sync State with LocalStorage & Listen to Network Status ---
  useEffect(() => {
    localStorage.setItem('protrack_is_online', String(isOnline));
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem('protrack_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    const handleConnectionChange = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('protrack_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('protrack_active_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem('protrack_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('protrack_reports', JSON.stringify(reports));
  }, [reports]);

  // Listen to Google Authentication status
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        addSyncLog(`Google Account aktif: ${user.displayName || user.email}`, 'success');
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when googleUser is active
  useEffect(() => {
    if (!googleUser) return;

    let unsubProjects: () => void;
    let unsubReports: () => void;
    let unsubNotifications: () => void;
    let unsubScheduler: () => void;
    let unsubSummaries: () => void;

    const setupSync = async () => {
      try {
        // 1. Seed Firestore if it is completely empty
        await seedFirestoreIfEmpty();

        // 2. Subscribe to projects
        unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
          const list: Project[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Project);
          });
          if (list.length > 0) {
            setProjects(list);
          }
        }, (err) => {
          console.error('Error syncing projects:', err);
        });

        // 3. Subscribe to reports
        unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
          const list: ProjectProgressReport[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as ProjectProgressReport);
          });
          list.sort((a, b) => b.timestamp - a.timestamp);
          if (list.length > 0) {
            setReports(list);
          }
        }, (err) => {
          console.error('Error syncing reports:', err);
        });

        // 4. Subscribe to notifications
        unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
          const list: NotificationAlert[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as NotificationAlert);
          });
          list.sort((a, b) => b.timestamp - a.timestamp);
          if (list.length > 0) {
            setNotifications(list);
          }
        }, (err) => {
          console.error('Error syncing notifications:', err);
        });

        // 5. Subscribe to scheduler settings
        unsubScheduler = onSnapshot(doc(db, 'schedulerSettings', 'global'), (docSnap) => {
          if (docSnap.exists()) {
            setSchedulerSettings(docSnap.data() as SchedulerSettings);
          }
        }, (err) => {
          console.error('Error syncing schedulerSettings:', err);
        });

        // 6. Subscribe to compiled summaries
        unsubSummaries = onSnapshot(collection(db, 'compiledSummaries'), (snapshot) => {
          const list: CompiledWeeklySummary[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as CompiledWeeklySummary);
          });
          list.sort((a, b) => {
            const dateA = new Date(a.compiledAt).getTime();
            const dateB = new Date(b.compiledAt).getTime();
            return dateB - dateA;
          });
          if (list.length > 0) {
            setCompiledSummaries(list);
          }
        }, (err) => {
          console.error('Error syncing compiledSummaries:', err);
        });
      } catch (e) {
        console.error('Failed setting up Firestore sync:', e);
      }
    };

    setupSync();

    return () => {
      if (unsubProjects) unsubProjects();
      if (unsubReports) unsubReports();
      if (unsubNotifications) unsubNotifications();
      if (unsubScheduler) unsubScheduler();
      if (unsubSummaries) unsubSummaries();
    };
  }, [googleUser]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        addSyncLog(`Google Account berhasil dihubungkan: ${res.user.displayName}`, 'success');
      }
    } catch (err: any) {
      const isPopupClosed = err?.code === 'auth/popup-closed-by-user' || 
                            err?.message?.includes('popup-closed-by-user') ||
                            err?.code === 'auth/cancelled-popup-request';
      const isPopupBlocked = err?.code === 'auth/popup-blocked' ||
                             err?.message?.includes('popup-blocked');

      if (isPopupClosed) {
        console.warn('Sign in cancelled by user:', err);
        addSyncLog('Login dibatalkan (jendela login ditutup).', 'info');
      } else if (isPopupBlocked) {
        console.warn('Sign in popup blocked by browser:', err);
        addSyncLog('Popup masuk diblokir oleh browser. Harap izinkan popup untuk situs ini.', 'info');
      } else {
        console.error('Sign in error:', err);
        addSyncLog('Gagal login dengan Google.', 'error');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      addSyncLog('Google Account diputuskan.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    localStorage.setItem('protrack_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('protrack_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Synchronize queued reports to memory and recalculate statistics
  const syncOfflineReports = () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);

    // Simulate reliable background upload
    setTimeout(() => {
      let updatedList: ProjectProgressReport[] = [];
      setReports((prevReports) => {
        updatedList = prevReports.map((rep) => {
          if (rep.isOfflineQueued) {
            return { ...rep, isOfflineQueued: false };
          }
          return rep;
        });
        return updatedList;
      });

      // Once online, update projects' overall progress metrics
      setProjects((prevProjects) => {
        let updated = [...prevProjects];
        offlineQueue.forEach((rep) => {
          updated = updated.map((proj) => {
            if (proj.id === rep.projectId) {
              const updatedProj = { ...proj, overallProgress: rep.progressPercentage };
              if (googleUser) {
                saveProjectToFirestore(updatedProj);
              }
              return updatedProj;
            }
            return proj;
          });
        });
        return updated;
      });

      // Emit nice successful alerts
      offlineQueue.forEach((rep) => {
        triggerNotification(
          `Sync Sukses: ${rep.projectName}`,
          `Laporan progres konstruksi (${rep.category} - ${rep.progressPercentage}%) berhasil disinkronkan secara online.`,
          'success',
          rep.id
        );
        if (googleUser) {
          saveReportToFirestore({ ...rep, isOfflineQueued: false });
        }
      });

      // Play successful sync audio chime
      if (soundEnabled) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          }
        } catch (e) {
          console.log('Chime error', e);
        }
      }

      // Automatically sync reports to Google Sheets when we get back online!
      if (googleToken && linkedSpreadsheetId && isAutoSyncEnabled) {
        syncReportsToGoogleSheets(googleToken, linkedSpreadsheetId, updatedList);
      }

      setOfflineQueue([]);
      setIsSyncing(false);
    }, 1800);
  };

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isSyncing) {
      syncOfflineReports();
    }
  }, [isOnline, offlineQueue.length]);

  // --- 4. Custom Handlers & Real-Time Notification Mechanics ---
  const handleAddReport = (newReport: ProjectProgressReport) => {
    const updatedReport: ProjectProgressReport = {
      ...newReport,
      isOfflineQueued: !isOnline
    };

    if (!isOnline) {
      // Offline mode: store report locally and queue it
      setOfflineQueue((prev) => [...prev, updatedReport]);
      setReports((prev) => [updatedReport, ...prev]);

      // Emit warning notification informing user of offline persistence
      triggerNotification(
        `Offline: Laporan Tersimpan Lokal`,
        `Koneksi tidak stabil. Laporan proyek ${updatedReport.projectName} telah diantrekan secara aman dan akan sinkron otomatis saat online kembali.`,
        'warning',
        updatedReport.id
      );
    } else {
      // Normal online mode
      setReports((prev) => {
        const next = [updatedReport, ...prev];
        if (googleToken && linkedSpreadsheetId && isAutoSyncEnabled) {
          syncReportsToGoogleSheets(googleToken, linkedSpreadsheetId, next);
        }
        return next;
      });

      // Reactive overallProgress recalculation:
      setProjects((prevProjects) =>
        prevProjects.map((proj) => {
          if (proj.id === updatedReport.projectId) {
            const updatedProj = {
              ...proj,
              overallProgress: updatedReport.progressPercentage,
            };
            if (googleUser) {
              saveProjectToFirestore(updatedProj);
            }
            return updatedProj;
          }
          return proj;
        })
      );

      if (googleUser) {
        saveReportToFirestore(updatedReport);
      }
    }
  };

  const handleUpdateReportStatus = (
    reportId: string,
    approvalStatus: 'Pending' | 'Disetujui' | 'Perlu Revisi',
    feedback?: string
  ) => {
    let nextReports: ProjectProgressReport[] = [];
    setReports((prevReports) => {
      nextReports = prevReports.map((rep) => {
        if (rep.id === reportId) {
          const updated: ProjectProgressReport = {
            ...rep,
            approvalStatus,
            managementFeedback: feedback || '',
          };

          // Trigger a reactive notification
          const notifType = approvalStatus === 'Disetujui' ? 'success' : approvalStatus === 'Perlu Revisi' ? 'warning' : 'info';
          triggerNotification(
            `Status Laporan ${approvalStatus}: ${rep.projectName}`,
            `Laporan dari ${rep.reporterName} untuk ${rep.category} diubah menjadi ${approvalStatus}.${feedback ? ` Catatan: ${feedback}` : ''}`,
            notifType,
            reportId
          );

          if (googleUser) {
            saveReportToFirestore(updated);
          }

          return updated;
        }
        return rep;
      });

      if (googleToken && linkedSpreadsheetId && isAutoSyncEnabled) {
        syncReportsToGoogleSheets(googleToken, linkedSpreadsheetId, nextReports);
      }

      return nextReports;
    });
  };

  const triggerNotification = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' | 'error',
    reportId: string
  ) => {
    const newNotif: NotificationAlert = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      reportId,
    };

    // A. Push to bell notification center
    setNotifications((prev) => [newNotif, ...prev]);

    if (googleUser) {
      saveNotificationToFirestore(newNotif);
    }

    // B. If current role is Management (Tim Manajemen), show a dynamic animated screen toast immediately!
    if (activeRole === 'Tim Manajemen') {
      setActiveToast({
        id: newNotif.id,
        title,
        message,
      });
      // Clear toast after 5 seconds
      setTimeout(() => {
        setActiveToast((current) => (current?.id === newNotif.id ? null : current));
      }, 5500);
    }

    // C. Play synthesized audio alert according to settings
    if (soundEnabled) {
      if (title.includes('Disetujui')) {
        playNotificationSound(approvedSoundProfile);
      } else if (title.includes('Perlu Revisi')) {
        playNotificationSound(revisionSoundProfile);
      } else {
        // Fallback/other notifications generic sound
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          }
        } catch (e) {
          console.error('Audio could not play', e);
        }
      }
    }
  };

  const handleSelectReportFromNotification = (reportId: string) => {
    // Redirect to the reports list tab
    setActiveTab('reports');
    // Set highlighted report state to trigger scroll & animation
    setHighlightedReportId(reportId);
  };

  // Dedicated background sheet sync executor
  const syncReportsToGoogleSheets = async (targetToken: string, targetSheetId: string, reportsList: ProjectProgressReport[]) => {
    try {
      const total = reportsList.length;
      let stats = { total: 0, avgProgress: 0, approved: 0, pending: 0, revision: 0 };
      if (total > 0) {
        const sum = reportsList.reduce((acc, curr) => acc + curr.progressPercentage, 0);
        const avgProgress = Math.round(sum / total);
        const approved = reportsList.filter((r) => r.approvalStatus === 'Disetujui').length;
        const pending = reportsList.filter((r) => !r.approvalStatus || r.approvalStatus === 'Pending').length;
        const revision = reportsList.filter((r) => r.approvalStatus === 'Perlu Revisi').length;
        stats = { total, avgProgress, approved, pending, revision };
      }

      const activeFiltersDesc = {
        project: 'Semua Proyek',
        category: 'Semua Kategori',
        status: 'Semua Status',
        approval: 'Semua Persetujuan',
      };

      addSyncLog('Melakukan Sinkronisasi Otomatis ke Google Sheets...', 'info');
      await populateSpreadsheet(targetToken, targetSheetId, reportsList, stats, activeFiltersDesc);
      addSyncLog('Sinkronisasi otomatis berhasil diselesaikan.', 'success');
    } catch (err: any) {
      console.error('Error in background sheet sync:', err);
      addSyncLog(`Gagal sync otomatis: ${err.message || 'Error'}`, 'error');
    }
  };

  const handleForceSync = async () => {
    if (!googleToken || !linkedSpreadsheetId) {
      addSyncLog('Gagal sync: Google Account belum terhubung atau spreadsheet belum ditautkan.', 'error');
      return;
    }
    addSyncLog('Sinkronisasi manual dimulai...', 'info');
    try {
      await syncReportsToGoogleSheets(googleToken, linkedSpreadsheetId, reports);
      addSyncLog('Sinkronisasi manual berhasil.', 'success');
    } catch (err: any) {
      addSyncLog(`Gagal sync manual: ${err.message || 'Error'}`, 'error');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang seluruh data ke kondisi awal?')) {
      if (googleUser) {
        addSyncLog('Menghapus data di cloud...', 'info');
        try {
          await clearFirestoreData();
          await seedFirestoreIfEmpty();
          addSyncLog('Data cloud berhasil di-reset!', 'success');
        } catch (e) {
          console.error('Failed to reset Firestore:', e);
          addSyncLog('Gagal reset data di cloud.', 'error');
        }
      } else {
        setProjects(INITIAL_PROJECTS);
        setReports(INITIAL_REPORTS);
        setNotifications(INITIAL_NOTIFICATIONS);
        setSchedulerSettings(INITIAL_SCHEDULER_SETTINGS);
        setCompiledSummaries(INITIAL_COMPILED_SUMMARIES);
      }
      setSelectedProjectId(null);
      setActiveTab('overview');
      setHighlightedReportId(null);
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-slate-900 dark:selection:text-slate-100" id="app-root">
      {/* 1. Header Component */}
      <Header
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        notifications={notifications}
        setNotifications={setNotifications}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSelectReport={handleSelectReportFromNotification}
      />

      {/* Network Connectivity Status Banner & Simulator Switch */}
      <div className={`w-full transition-all duration-300 border-b ${
        isOnline 
          ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 py-2.5' 
          : 'bg-amber-500 border-amber-600 text-white py-3.5 shadow-md shadow-amber-500/10'
      }`} id="network-status-banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            {isOnline ? (
              <div className="flex items-center gap-2" id="network-online-status-indicator">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Wifi className="w-4 h-4 text-emerald-500" />
                  Koneksi Lapangan: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">Terhubung (Online)</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2" id="network-offline-status-indicator">
                <WifiOff className="w-5 h-5 text-white animate-pulse" />
                <span className="text-xs font-black tracking-tight leading-snug">
                  Koneksi Tidak Stabil (Offline): Laporan progres baru akan diantrekan secara aman di browser Anda dan otomatis terkirim saat online kembali. {offlineQueue.length > 0 && `(${offlineQueue.length} Laporan Menunggu Sync)`}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
              isOnline
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/60'
                : 'bg-white hover:bg-slate-50 text-amber-600 border border-transparent'
            }`}
            id="network-simulator-toggle-btn"
          >
            {isOnline ? (
              <>
                <WifiOff className="w-3 h-3" />
                Simulasikan Sinyal Hilang
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 animate-bounce" />
                Pulihkan Sinyal Proyek
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synchronizing Screen Header Progress Bar */}
      {isSyncing && (
        <div className="w-full bg-blue-600 text-white py-2.5 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2.5 animate-pulse" id="global-syncing-banner">
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <Clock className="w-3.5 h-3.5 text-white animate-spin" />
          Sinkronisasi Otomatis: Mengunggah {offlineQueue.length} Laporan Lapangan ke Pusat...
        </div>
      )}

      {/* 2. Main Content Page */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT & CENTER COLUMNS: Project stats, dashboards, and timeline feeds */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Mobile Sheets integration sync panel */}
            <div className="lg:hidden space-y-6">
              <SheetsSyncHub
                reports={reports}
                projects={projects}
                isOnline={isOnline}
                soundEnabled={soundEnabled}
                triggerNotification={triggerNotification}
                googleUser={googleUser}
                googleToken={googleToken}
                isGoogleLoading={isGoogleLoading}
                onGoogleLogin={handleGoogleLogin}
                onGoogleLogout={handleGoogleLogout}
                linkedSpreadsheetId={linkedSpreadsheetId}
                setLinkedSpreadsheetId={setLinkedSpreadsheetId}
                linkedSpreadsheetUrl={linkedSpreadsheetUrl}
                setLinkedSpreadsheetUrl={setLinkedSpreadsheetUrl}
                isAutoSyncEnabled={isAutoSyncEnabled}
                setIsAutoSyncEnabled={setIsAutoSyncEnabled}
                syncLogs={syncLogs}
                addSyncLog={addSyncLog}
                onForceSync={handleForceSync}
              />
              <SoundSettingsHub
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                approvedSoundProfile={approvedSoundProfile}
                setApprovedSoundProfile={setApprovedSoundProfile}
                revisionSoundProfile={revisionSoundProfile}
                setRevisionSoundProfile={setRevisionSoundProfile}
              />
            </div>

            {/* Visual tab navigation bars */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm" id="tab-navigation-bar">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'overview'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md dark:shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  id="tab-overview-btn"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dasbor Proyek & Statistik
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                    activeTab === 'reports'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md dark:shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  id="tab-reports-btn"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Laporan Kemajuan Fisik
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                    {reports.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                    activeTab === 'summary'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md dark:shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  id="tab-summary-btn"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Ringkasan Eksekutif
                  {activeRole === 'Tim Manajemen' && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </button>
              </div>

              {/* Reset simulator database tool */}
              <button
                onClick={handleResetData}
                title="Reset Database Simulator"
                className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-1 self-end sm:self-auto"
                id="reset-db-btn"
              >
                <Settings className="w-3.5 h-3.5" />
                Reset Data Demo
              </button>
            </div>

            {/* Dynamic View Swapper */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* SVG Charts section */}
                  <ProjectStats 
                    projects={projects} 
                    reports={reports} 
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />

                  {/* Overview Metrics & Project Listing */}
                  <ProjectOverview
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={setSelectedProjectId}
                    isOnline={isOnline}
                  />
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div
                  key="reports-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Timeline listing and filters */}
                  <ReportList
                    reports={reports}
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={setSelectedProjectId}
                    highlightedReportId={highlightedReportId}
                    clearHighlightedReport={() => setHighlightedReportId(null)}
                    activeRole={activeRole}
                    onUpdateReportStatus={handleUpdateReportStatus}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                </motion.div>
              )}

              {activeTab === 'summary' && (
                <motion.div
                  key="summary-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExecutiveSummary
                    projects={projects}
                    reports={reports}
                    schedulerSettings={schedulerSettings}
                    onUpdateScheduler={(newSettings) => {
                      setSchedulerSettings(newSettings);
                      if (googleUser) {
                        saveSchedulerSettingsToFirestore(newSettings);
                      }
                    }}
                    compiledSummaries={compiledSummaries}
                    onAddSummary={(newSum) => {
                      setCompiledSummaries(prev => [newSum, ...prev]);
                      if (googleUser) {
                        saveCompiledSummaryToFirestore(newSum);
                      }
                    }}
                    onDeleteSummary={(id) => {
                      setCompiledSummaries(prev => prev.filter(s => s.id !== id));
                      if (googleUser) {
                        deleteSummaryFromFirestore(id);
                      }
                    }}
                    triggerNotification={(title, msg, type) => triggerNotification(title, msg, type, '')}
                    isOnline={isOnline}
                    soundEnabled={soundEnabled}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: Real-time report upload form always handy - hidden on smaller screens, sticky on desktop */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="sticky top-22 space-y-6">
              <SheetsSyncHub
                reports={reports}
                projects={projects}
                isOnline={isOnline}
                soundEnabled={soundEnabled}
                triggerNotification={triggerNotification}
                googleUser={googleUser}
                googleToken={googleToken}
                isGoogleLoading={isGoogleLoading}
                onGoogleLogin={handleGoogleLogin}
                onGoogleLogout={handleGoogleLogout}
                linkedSpreadsheetId={linkedSpreadsheetId}
                setLinkedSpreadsheetId={setLinkedSpreadsheetId}
                linkedSpreadsheetUrl={linkedSpreadsheetUrl}
                setLinkedSpreadsheetUrl={setLinkedSpreadsheetUrl}
                isAutoSyncEnabled={isAutoSyncEnabled}
                setIsAutoSyncEnabled={setIsAutoSyncEnabled}
                syncLogs={syncLogs}
                addSyncLog={addSyncLog}
                onForceSync={handleForceSync}
              />
              <SoundSettingsHub
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                approvedSoundProfile={approvedSoundProfile}
                setApprovedSoundProfile={setApprovedSoundProfile}
                revisionSoundProfile={revisionSoundProfile}
                setRevisionSoundProfile={setRevisionSoundProfile}
              />
              <ReportForm
                projects={projects}
                activeRole={activeRole}
                onAddReport={handleAddReport}
                triggerNotification={triggerNotification}
                soundEnabled={soundEnabled}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button (FAB) for Mobile/Tablet */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileFormOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold px-5 py-4 rounded-full shadow-2xl shadow-blue-600/30 transition-all border border-blue-500/20"
          id="mobile-fab-btn"
        >
          <Plus className="w-5.5 h-5.5" />
          <span className="text-xs font-black tracking-wide uppercase">Lapor Progress</span>
        </motion.button>
      </div>

      {/* Slide-Up Bottom Drawer Sheet for Mobile */}
      <AnimatePresence>
        {isMobileFormOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFormOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              id="mobile-sheet-backdrop"
            />
            {/* Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col border-t border-slate-100 dark:border-slate-800 z-10"
              id="mobile-form-sheet"
            >
              {/* Handle Bar */}
              <div className="flex justify-center items-center py-3 border-b border-slate-50 dark:border-slate-800/40 cursor-pointer shrink-0" onClick={() => setIsMobileFormOpen(false)}>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Title Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800 shrink-0">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Kirim Laporan Lapangan
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    Lengkapi form di bawah untuk membagikan progress
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileFormOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl transition-all"
                  id="close-mobile-sheet-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-12">
                <ReportForm
                  projects={projects}
                  activeRole={activeRole}
                  onAddReport={(newReport) => {
                    handleAddReport(newReport);
                    // Beautiful feedback transition: close drawer after short timeout
                    setTimeout(() => {
                      setIsMobileFormOpen(false);
                    }, 400);
                  }}
                  triggerNotification={triggerNotification}
                  soundEnabled={soundEnabled}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Global Push Notification Screen Toast for Management Role */}
      <AnimatePresence>
        {activeToast && activeRole === 'Tim Manajemen' && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 text-white p-4.5 rounded-2xl shadow-2xl flex items-start gap-3.5"
            id="management-toast-popup"
          >
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md">
                  UPDATE REAL-TIME
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  Baru saja
                </span>
              </div>
              <p className="text-xs font-black text-slate-100 tracking-tight leading-snug mt-1.5">
                {activeToast.title}
              </p>
              <p className="text-[11px] text-slate-300 leading-normal mt-1">
                {activeToast.message}
              </p>
              <button
                onClick={() => {
                  const reportId = reports[0]?.id;
                  if (reportId) {
                    handleSelectReportFromNotification(reportId);
                  }
                  setActiveToast(null);
                }}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-0.5 uppercase tracking-wide"
                id="toast-check-link"
              >
                Tinjau Laporan Sekarang →
              </button>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              id="close-toast-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Simple Elegant Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 mt-auto" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-medium">
            &copy; 2026 APPLO - Pantau Progress Tanpa Jeda. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100/60 dark:border-slate-800/80">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500 animate-pulse" />
            <span>Sistem Pemantau Lapangan Real-Time Aktif</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
