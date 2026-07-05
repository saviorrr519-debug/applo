import React from 'react';
import { Volume2, VolumeX, Play, Check, ShieldCheck, AlertTriangle, Music, HelpCircle } from 'lucide-react';
import { SoundProfileId, APPROVED_SOUND_PROFILES, REVISION_SOUND_PROFILES, playNotificationSound } from '../lib/audio';
import { motion } from 'motion/react';

interface SoundSettingsHubProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  approvedSoundProfile: SoundProfileId;
  setApprovedSoundProfile: (profile: SoundProfileId) => void;
  revisionSoundProfile: SoundProfileId;
  setRevisionSoundProfile: (profile: SoundProfileId) => void;
}

export default function SoundSettingsHub({
  soundEnabled,
  setSoundEnabled,
  approvedSoundProfile,
  setApprovedSoundProfile,
  revisionSoundProfile,
  setRevisionSoundProfile,
}: SoundSettingsHubProps) {

  const handleTestSound = (profileId: SoundProfileId) => {
    // Play sound regardless of general soundEnabled, so user can hear/test what they are configuring
    playNotificationSound(profileId);
  };

  const handleSelectApproved = (id: SoundProfileId) => {
    setApprovedSoundProfile(id);
    localStorage.setItem('protrack_approved_sound_profile', id);
    // Play as confirmation
    playNotificationSound(id);
  };

  const handleSelectRevision = (id: SoundProfileId) => {
    setRevisionSoundProfile(id);
    localStorage.setItem('protrack_revision_sound_profile', id);
    // Play as confirmation
    playNotificationSound(id);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4" id="sound-settings-hub">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl text-blue-600 dark:text-blue-400">
            <Music className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              Preferensi Suara Notifikasi
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              Tim Manajemen (K3 & Review)
            </span>
          </div>
        </div>

        {/* Master Sound Toggle */}
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            localStorage.setItem('protrack_sound_enabled', String(next));
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
          }`}
          title={soundEnabled ? 'Matikan semua audio' : 'Aktifkan semua audio'}
          id="sound-settings-master-toggle"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Aktif</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Senyap</span>
            </>
          )}
        </button>
      </div>

      {!soundEnabled && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400 text-[11px] leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong>Suara dinonaktifkan:</strong> Anda tidak akan mendengar dering saat laporan disetujui atau memerlukan revisi. Klik tombol di atas untuk mengaktifkan kembali.
          </span>
        </div>
      )}

      {/* Profile Selector for Disetujui (Approved) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Nada Laporan Disetujui
          </span>
        </div>

        <div className="space-y-1.5">
          {APPROVED_SOUND_PROFILES.map((profile) => {
            const isSelected = approvedSoundProfile === profile.id;
            return (
              <div
                key={profile.id}
                onClick={() => handleSelectApproved(profile.id)}
                className={`group p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-500/60'
                    : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 hover:bg-slate-100/40 dark:hover:bg-slate-800/40'
                }`}
                id={`sound-profile-approved-${profile.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {profile.name}
                    </span>
                    {isSelected && (
                      <span className="bg-emerald-500 text-white p-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 truncate">
                    {profile.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestSound(profile.id);
                  }}
                  className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 shadow-sm transition-colors cursor-pointer shrink-0"
                  title="Putar uji coba nada"
                  id={`play-test-approved-${profile.id}`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Selector for Perlu Revisi (Needs Revision) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-1.5 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Nada Laporan Perlu Revisi
          </span>
        </div>

        <div className="space-y-1.5">
          {REVISION_SOUND_PROFILES.map((profile) => {
            const isSelected = revisionSoundProfile === profile.id;
            return (
              <div
                key={profile.id}
                onClick={() => handleSelectRevision(profile.id)}
                className={`group p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500 dark:border-amber-500/60'
                    : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 hover:bg-slate-100/40 dark:hover:bg-slate-800/40'
                }`}
                id={`sound-profile-revision-${profile.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {profile.name}
                    </span>
                    {isSelected && (
                      <span className="bg-amber-500 text-white p-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 truncate">
                    {profile.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestSound(profile.id);
                  }}
                  className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 shadow-sm transition-colors cursor-pointer shrink-0"
                  title="Putar uji coba nada"
                  id={`play-test-revision-${profile.id}`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advisory Note */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-left leading-normal flex gap-1 items-start bg-slate-50/50 dark:bg-slate-950/10 p-2 rounded-xl">
        <HelpCircle className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
        <span>
          Gunakan headphone atau speaker perangkat Anda untuk mendengar nada yang berbeda saat status disetujui (nada positif/tinggi) vs memerlukan revisi (nada peringatan).
        </span>
      </div>
    </div>
  );
}
