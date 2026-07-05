import React from 'react';
import { Project, ProjectProgressReport, ReportCategory } from '../types';
import { Layers, Activity, PieChart, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import ProjectTrendChart from './ProjectTrendChart';

interface ProjectStatsProps {
  projects: Project[];
  reports: ProjectProgressReport[];
  selectedCategory: string;
  onSelectCategory?: (category: string) => void;
}

export default function ProjectStats({ 
  projects, 
  reports, 
  selectedCategory, 
  onSelectCategory 
}: ProjectStatsProps) {
  // 1. Calculate Category Distributions
  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<ReportCategory, number>);

  const categories: ReportCategory[] = [
    'Struktur',
    'Arsitektur',
    'Mekanikal & Elektrikal',
    'Finishing',
    'Kesehatan & Keselamatan (K3)',
    'Lainnya',
  ];

  const categoryColors: Record<ReportCategory, string> = {
    'Struktur': '#3b82f6', // Blue
    'Arsitektur': '#6366f1', // Indigo
    'Mekanikal & Elektrikal': '#8b5cf6', // Purple
    'Finishing': '#10b981', // Emerald
    'Kesehatan & Keselamatan (K3)': '#f43f5e', // Rose
    'Lainnya': '#64748b', // Slate
  };

  const totalReports = reports.length || 1;

  // Dynamically calculate project overallProgress if a category filter is selected
  const displayProjects = React.useMemo(() => {
    if (selectedCategory === 'Semua') return projects;
    return projects.map((proj) => {
      const projReports = reports
        .filter((r) => r.projectId === proj.id && r.category === selectedCategory)
        .sort((a, b) => b.timestamp - a.timestamp);
      const categoryProgress = projReports.length > 0 ? projReports[0].progressPercentage : 0;
      return {
        ...proj,
        overallProgress: categoryProgress,
      };
    });
  }, [projects, reports, selectedCategory]);

  // 2. High-level averages based on displayProjects
  const completedProjectsCount = displayProjects.filter(p => p.overallProgress >= 100).length;
  const averageProgress = Math.round(
    displayProjects.reduce((acc, p) => acc + p.overallProgress, 0) / (displayProjects.length || 1)
  );

  return (
    <div className="space-y-6" id="stats-dashboard-container">
      {/* Kategori Pekerjaan Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="dashboard-category-filter">
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Filter Dasbor: Kategori Pekerjaan
          </h3>
          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
            {selectedCategory === 'Semua' 
              ? 'Menampilkan Progres Keseluruhan Semua Proyek' 
              : `Menampilkan Progres Khusus Pekerjaan: ${selectedCategory}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" id="dashboard-category-pills">
          {['Semua', ...categories].map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory?.(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
                }`}
              >
                {cat === 'Semua' ? 'Semua Pekerjaan' : cat === 'Mekanikal & Elektrikal' ? 'MEP' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. TOP ROW: Trend Progress Fisik Proyek (2/3) & Efisiensi Lapangan (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="stats-top-row">
        {/* Trend Progress Fisik Proyek - Left (2/3 width) */}
        <div className="lg:col-span-2" id="top-row-trend">
          <ProjectTrendChart projects={displayProjects} reports={reports} selectedCategory={selectedCategory} />
        </div>

        {/* Efisiensi Lapangan - Right (1/3 width) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between lg:col-span-1" id="chart-gauge-categories">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Efisiensi Lapangan
              </h3>
            </div>

            {/* Circular progress SVG */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2" id="circular-gauge">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-blue-600"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - averageProgress / 100) }}
                  transition={{ duration: 1 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                  {averageProgress}%
                </span>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">
                  Rata-Rata
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Tingkat Kelancaran</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Optimal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              {selectedCategory === 'Semua'
                ? `Berdasarkan ${reports.length} Laporan dari Lapangan, Proyek Berjalan Lancar dengan Rata-Rata Kemajuan Fisik ${averageProgress}%.`
                : `Berdasarkan Laporan Pekerjaan ${selectedCategory}, Proyek Berjalan Lancar dengan Rata-Rata Kemajuan Fisik Kategori Ini Adalah ${averageProgress}%.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM ROW: Perbandingan Progress per Proyek (2/3) & Distribusi Aktivitas per Kategori (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="stats-bottom-row">
        {/* Card 1: Custom SVG Progress Comparison Bar Chart (2/3 width) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 text-left" id="chart-progress-comparison">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Perbandingan Progress per Proyek (%)
            </h3>
          </div>

          {/* SVG Bar Chart container */}
          <div className="space-y-4">
            {displayProjects.map((proj) => (
              <div key={proj.id} className="space-y-1.5" id={`stat-bar-${proj.id}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                    {proj.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">Target: 100%</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                      Aktual: {proj.overallProgress}%
                    </span>
                  </div>
                </div>

                {/* Styled Progress Channel Bar */}
                <div className="relative w-full h-7 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden flex items-center px-2 shadow-inner">
                  {/* Progress background glow fill */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${proj.overallProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`absolute left-0 top-0 bottom-0 rounded-l-lg opacity-85 ${
                      proj.overallProgress >= 80
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : proj.overallProgress >= 50
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                        : 'bg-gradient-to-r from-rose-400 to-rose-500'
                    }`}
                  />
                  
                  {/* Float text inside progress bar */}
                  <span className="relative z-10 text-[10px] font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm ml-1">
                    {proj.overallProgress > 15 ? `${proj.overallProgress}% Terpasang` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            <span>Status Data: Real-Time dari Lapangan</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                &gt;= 80% (Baik)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
                50-79% (Sedang)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Horizontal Kategori Distribution Bar Plot (1/3 width) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left lg:col-span-1" id="chart-category-distribution">
          <div className="flex items-center gap-2 mb-5">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Distribusi Kategori Laporan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3" id="categories-grid-breakdown">
            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const percentage = Math.round((count / totalReports) * 100);
              const color = categoryColors[cat];

              return (
                <div
                  key={cat}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4"
                  id={`cat-breakdown-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate" title={cat}>
                      {cat}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {count} Laporan
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Circle Badge count */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white"
                    style={{ backgroundColor: color }}
                  >
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
