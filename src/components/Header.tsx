import React, { useState } from 'react';
import { Bell, HardHat, Briefcase, CheckCircle2, AlertTriangle, Info, ShieldAlert, X, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveRole, NotificationAlert } from '../types';
import { AppLogoBrand } from './AppLogo';

interface HeaderProps {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  notifications: NotificationAlert[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationAlert[]>>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  onSelectReport: (reportId: string) => void;
}

export default function Header({
  activeRole,
  setActiveRole,
  notifications,
  setNotifications,
  soundEnabled,
  setSoundEnabled,
  darkMode,
  setDarkMode,
  onSelectReport,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string, reportId?: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (reportId) {
      onSelectReport(reportId);
    }
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'error':
        return <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Baru saja';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} m yang lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam yang lalu`;
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <AppLogoBrand />

          {/* Controls & Navigation */}
          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl hidden sm:flex items-center gap-1" id="role-switcher">
              <button
                id="role-worker-btn"
                onClick={() => setActiveRole('Pekerja Lapangan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeRole === 'Pekerja Lapangan'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                Pekerja Lapangan
              </button>
              <button
                id="role-manager-btn"
                onClick={() => setActiveRole('Tim Manajemen')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeRole === 'Tim Manajemen'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Tim Manajemen
              </button>
            </div>

            {/* Mobile Role Button (Simple Toggle) */}
            <button
              onClick={() => setActiveRole(activeRole === 'Pekerja Lapangan' ? 'Tim Manajemen' : 'Pekerja Lapangan')}
              className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
              id="role-mobile-toggle"
            >
              {activeRole === 'Pekerja Lapangan' ? (
                <>
                  <HardHat className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Pekerja</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Manajemen</span>
                </>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Aktifkan Mode Terang (Light Mode)' : 'Aktifkan Mode Gelap (Dark Mode)'}
              className={`p-2 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-500 hover:bg-amber-950/60'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              id="dark-mode-toggle-btn"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              id="sound-toggle-btn"
            >
              {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-xl border transition-all ${
                  showNotifications
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                id="notification-bell-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse" id="unread-notif-count">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop to close dropdown on click outside */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-40 overflow-hidden"
                      id="notification-dropdown"
                    >
                      {/* Header Dropdown */}
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            Notifikasi Tim Manajemen
                          </h3>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            id="mark-all-read-btn"
                          >
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>

                      {/* Notif list */}
                      <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center" id="empty-notifications">
                            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Belum ada notifikasi update.
                            </p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id, notif.reportId);
                                setShowNotifications(false);
                              }}
                              className={`p-4 flex gap-3 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                                !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20 font-medium' : ''
                              }`}
                              id={`notification-item-${notif.id}`}
                            >
                              {getNotifIcon(notif.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-normal">
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block font-normal">
                                  {formatTime(notif.timestamp)}
                                </span>
                              </div>
                              <button
                                onClick={(e) => deleteNotification(notif.id, e)}
                                className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 p-1 rounded-md self-start"
                                title="Hapus"
                                id={`delete-notif-${notif.id}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer Dropdown */}
                      <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          Status Sistem: Real-time update aktif
                        </span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
