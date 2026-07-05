import { Project, ProjectProgressReport, NotificationAlert, SchedulerSettings, CompiledWeeklySummary } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Pembangunan Gedung Kantor Sudirman',
    location: 'Kuningan, Jakarta Selatan',
    targetCompletion: '15 Des 2026',
    budget: 'Rp 45.000.000.000',
    overallProgress: 68,
    manager: 'Ir. Budi Hermawan',
    status: 'Aktif',
    description: 'Proyek pembangunan gedung perkantoran ramah lingkungan setinggi 12 lantai dengan sertifikasi Green Building.',
    lat: -6.229728,
    lng: 106.829555
  },
  {
    id: 'proj-2',
    name: 'Renovasi Jembatan Layang Pasupati',
    location: 'Bandung, Jawa Barat',
    targetCompletion: '30 Sep 2026',
    budget: 'Rp 12.500.000.000',
    overallProgress: 42,
    manager: 'Siti Rahmawati, M.T.',
    status: 'Aktif',
    description: 'Perbaikan struktur beton, pembaruan aspal penutup, dan pemasangan lampu dekoratif pintar (smart lighting).',
    lat: -6.901174,
    lng: 107.611100
  },
  {
    id: 'proj-3',
    name: 'Instalasi Elektrikal Mall Nusantara',
    location: 'Surabaya, Jawa Timur',
    targetCompletion: '10 Nov 2026',
    budget: 'Rp 8.200.000.000',
    overallProgress: 85,
    manager: 'Agus Salim, S.T.',
    status: 'Aktif',
    description: 'Pekerjaan sistem tata udara central (Chiller), kelistrikan gedung utama, serta instalasi sistem pencegah kebakaran.',
    lat: -7.257472,
    lng: 112.752088
  },
  {
    id: 'proj-4',
    name: 'Finishing Apartemen Sentosa Regency',
    location: 'Medan, Sumatera Utara',
    targetCompletion: '20 Okt 2026',
    budget: 'Rp 18.000.000.000',
    overallProgress: 92,
    manager: 'Ir. Hendra Wijaya',
    status: 'Aktif',
    description: 'Pekerjaan interior, pengecatan dinding luar, pemasangan keramik koridor, dan instalasi sanitasi kamar mandi.',
    lat: 3.595196,
    lng: 98.672223
  }
];

export const INITIAL_REPORTS: ProjectProgressReport[] = [
  {
    id: 'rep-1',
    projectId: 'proj-1',
    projectName: 'Pembangunan Gedung Kantor Sudirman',
    location: 'Kuningan, Jakarta Selatan',
    reporterName: 'Hendra Prasetyo',
    reporterRole: 'Pengawas',
    date: '2026-07-04',
    progressPercentage: 70,
    description: 'Pengecoran plat lantai tingkat 9 telah selesai dikerjakan dengan hasil uji beton K-350 sesuai standar. Dilanjutkan persiapan bekisting untuk kolom lantai 10.',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
    photoUrls: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80'
    ],
    category: 'Struktur',
    status: 'Sedang Berjalan',
    timestamp: Date.now() - 3600000 * 4, // 4 hours ago
    approvalStatus: 'Disetujui',
    managementFeedback: 'Kerja bagus, pengerjaan plat lantai rapi dan sesuai jadwal.'
  },
  {
    id: 'rep-2',
    projectId: 'proj-3',
    projectName: 'Instalasi Elektrikal Mall Nusantara',
    location: 'Surabaya, Jawa Timur',
    reporterName: 'Dian Nugroho',
    reporterRole: 'Pekerja Lapangan',
    date: '2026-07-04',
    progressPercentage: 85,
    description: 'Pemasangan kabel utama (main feeder) dari ruang MDP ke SDP lantai dasar telah selesai 100%. Uji kontinuitas kabel menunjukkan hasil aman tanpa korsleting.',
    photoUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80',
    photoUrls: [
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'
    ],
    category: 'Mekanikal & Elektrikal',
    status: 'Selesai',
    timestamp: Date.now() - 3600000 * 8, // 8 hours ago
    approvalStatus: 'Disetujui',
    managementFeedback: 'Laporan pengujian lengkap. Terima kasih atas ketelitian pengujian kontinuitas.'
  },
  {
    id: 'rep-3',
    projectId: 'proj-2',
    projectName: 'Renovasi Jembatan Layang Pasupati',
    location: 'Bandung, Jawa Barat',
    reporterName: 'Irwan Setiawan',
    reporterRole: 'Pengawas',
    date: '2026-07-03',
    progressPercentage: 45,
    description: 'Pengupasan aspal lama pada lajur kiri (Arah Pasteur) mengalami keterlambatan dikarenakan cuaca hujan deras berturut-turut di sore hari. Tim menambah shift malam untuk mengejar target.',
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    photoUrls: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'
    ],
    category: 'Struktur',
    status: 'Tertunda',
    timestamp: Date.now() - 3600000 * 24, // 24 hours ago
    approvalStatus: 'Perlu Revisi',
    managementFeedback: 'Harap lampirkan foto pengerjaan shift malam dan detail estimasi keterlambatan dalam jam kerja.'
  },
  {
    id: 'rep-4',
    projectId: 'proj-4',
    projectName: 'Finishing Apartemen Sentosa Regency',
    location: 'Medan, Sumatera Utara',
    reporterName: 'Ari Wibowo',
    reporterRole: 'Pekerja Lapangan',
    date: '2026-07-03',
    progressPercentage: 95,
    description: 'Pengecatan dinding luar tower A sisi timur hampir rampung. Menggunakan cat weather-shield kualitas utama untuk ketahanan cuaca ekstrem.',
    photoUrl: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
    photoUrls: [
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'
    ],
    category: 'Finishing',
    status: 'Sedang Berjalan',
    timestamp: Date.now() - 3600000 * 30, // 30 hours ago
    approvalStatus: 'Pending'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationAlert[] = [
  {
    id: 'notif-1',
    title: 'Progress Diperbarui: Gedung Sudirman',
    message: 'Pengawas Hendra Prasetyo melaporkan penyelesaian pengecoran plat lantai 9 (Progress: 70%).',
    type: 'success',
    timestamp: Date.now() - 3600000 * 4,
    read: false,
    reportId: 'rep-1'
  },
  {
    id: 'notif-2',
    title: 'Laporan Selesai: Elektrikal Mall Nusantara',
    message: 'Pekerjaan kabel utama dari MDP ke SDP selesai dipasang oleh tim lapangan.',
    type: 'success',
    timestamp: Date.now() - 3600000 * 8,
    read: true,
    reportId: 'rep-2'
  },
  {
    id: 'notif-3',
    title: 'Keterlambatan: Jembatan Pasupati',
    message: 'Pengupasan aspal tertunda karena kendala cuaca hujan deras.',
    type: 'warning',
    timestamp: Date.now() - 3600000 * 24,
    read: true,
    reportId: 'rep-3'
  }
];

export const INITIAL_SCHEDULER_SETTINGS: SchedulerSettings = {
  enabled: true,
  frequency: 'weekly',
  dayOfWeek: 1, // Senin
  time: '08:00',
  recipientEmail: 'manajemen@pmo-protrack.co.id',
  includePdf: true,
  includeSheets: true
};

export const INITIAL_COMPILED_SUMMARIES: CompiledWeeklySummary[] = [
  {
    id: 'sum-mock-1',
    title: 'Laporan Mingguan Otomatis - Periode Akhir Juni',
    startDate: '22 Jun 2026',
    endDate: '28 Jun 2026',
    compiledAt: '08:00 WIB',
    totalReports: 6,
    averageProgress: 71,
    progressGained: 4.8,
    isAutoGenerated: true,
    pendingApprovals: 0,
    categoryBreakdown: [
      { category: 'Struktur', count: 3 },
      { category: 'Mekanikal & Elektrikal', count: 2 },
      { category: 'Finishing', count: 1 }
    ],
    projectBreakdown: [
      {
        projectId: 'proj-1',
        projectName: 'Pembangunan Gedung Kantor Sudirman',
        reportCount: 2,
        startingProgress: 64,
        currentProgress: 68,
        progressGained: 4,
        status: 'Aktif'
      },
      {
        projectId: 'proj-2',
        projectName: 'Renovasi Jembatan Layang Pasupati',
        reportCount: 1,
        startingProgress: 38,
        currentProgress: 42,
        progressGained: 4,
        status: 'Aktif'
      },
      {
        projectId: 'proj-3',
        projectName: 'Instalasi Elektrikal Mall Nusantara',
        reportCount: 2,
        startingProgress: 80,
        currentProgress: 85,
        progressGained: 5,
        status: 'Aktif'
      },
      {
        projectId: 'proj-4',
        projectName: 'Finishing Apartemen Sentosa Regency',
        reportCount: 1,
        startingProgress: 86,
        currentProgress: 92,
        progressGained: 6,
        status: 'Aktif'
      }
    ],
    keyHighlights: [
      'Pembangunan Gedung Kantor Sudirman: Mencatat kemajuan kolom utama lantai 9 berjalan lancar.',
      'Renovasi Jembatan Layang Pasupati: Pekerjaan aspal beton jembatan lajur kanan selesai tepat waktu.',
      'Instalasi Elektrikal Mall Nusantara: Uji continuitas kabel feeder utama disetujui pengawas.',
      'Finishing Apartemen Sentosa Regency: Pemasangan keramik pada koridor tower A dilaporkan selesai.'
    ]
  },
  {
    id: 'sum-mock-2',
    title: 'Laporan Mingguan Otomatis - Periode Pertengahan Juni',
    startDate: '15 Jun 2026',
    endDate: '21 Jun 2026',
    compiledAt: '08:00 WIB',
    totalReports: 8,
    averageProgress: 66,
    progressGained: 5.2,
    isAutoGenerated: true,
    pendingApprovals: 0,
    categoryBreakdown: [
      { category: 'Struktur', count: 4 },
      { category: 'Mekanikal & Elektrikal', count: 2 },
      { category: 'Finishing', count: 2 }
    ],
    projectBreakdown: [
      {
        projectId: 'proj-1',
        projectName: 'Pembangunan Gedung Kantor Sudirman',
        reportCount: 3,
        startingProgress: 59,
        currentProgress: 64,
        progressGained: 5,
        status: 'Aktif'
      },
      {
        projectId: 'proj-2',
        projectName: 'Renovasi Jembatan Layang Pasupati',
        reportCount: 2,
        startingProgress: 32,
        currentProgress: 38,
        progressGained: 6,
        status: 'Aktif'
      },
      {
        projectId: 'proj-3',
        projectName: 'Instalasi Elektrikal Mall Nusantara',
        reportCount: 1,
        startingProgress: 75,
        currentProgress: 80,
        progressGained: 5,
        status: 'Aktif'
      },
      {
        projectId: 'proj-4',
        projectName: 'Finishing Apartemen Sentosa Regency',
        reportCount: 2,
        startingProgress: 81,
        currentProgress: 86,
        progressGained: 5,
        status: 'Aktif'
      }
    ],
    keyHighlights: [
      'Stabilitas K3 & Operasional: Seluruh pekerjaan di lapangan berjalan aman dan memenuhi indikator K3 (Zero Accident).',
      'Pembangunan Gedung Kantor Sudirman: Pengecoran plat lantai 8 diselesaikan secara aman.',
      'Renovasi Jembatan Layang Pasupati: Pembongkaran pilar samping jembatan dilakukan sesuai standar teknik.',
      'Finishing Apartemen Sentosa Regency: Interior pengecatan koridor lantai 5 dimulai dengan hasil rapi.'
    ]
  }
];


/**
 * Optimizes an uploaded image file by drawing it to a canvas and scaling it down
 * to save space in LocalStorage/IndexedDB.
 */
export function compressAndResizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress quality to 75%
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string || '');
        }
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
