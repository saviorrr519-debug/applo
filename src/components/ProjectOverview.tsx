import React from 'react';
import { Project } from '../types';
import { Briefcase, MapPin, Calendar, CheckCircle2, TrendingUp, AlertTriangle, User } from 'lucide-react';
import { motion } from 'motion/react';
import ProjectMap from './ProjectMap';
import WeatherWidget from './WeatherWidget';

interface ProjectOverviewProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  isOnline: boolean;
}

export default function ProjectOverview({
  projects,
  selectedProjectId,
  onSelectProject,
  isOnline,
}: ProjectOverviewProps) {
  // Compute dashboard metrics
  const totalProjects = projects.length;
  const averageProgress = Math.round(
    projects.reduce((acc, p) => acc + p.overallProgress, 0) / (totalProjects || 1)
  );

  const activeCount = projects.filter((p) => p.status === 'Aktif').length;
  const completedCount = projects.filter((p) => p.overallProgress === 100).length;
  const delayedCount = projects.filter((p) => p.overallProgress < 50 && p.status !== 'Selesai').length;

  return (
    <div className="space-y-6" id="project-overview-section">
      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4" id="kpi-grid">
        {/* KPI 1: Total Proyek */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5 sm:gap-4"
          id="kpi-total-proyek"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Briefcase className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
              Total Proyek
            </p>
            <h4 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {totalProjects}
            </h4>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md mt-1 inline-block">
              {activeCount} Aktif
            </span>
          </div>
        </motion.div>

        {/* KPI 2: Rata-rata Progress */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5 sm:gap-4"
          id="kpi-avg-progress"
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
              Rata-rata Progress
            </p>
            <h4 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {averageProgress}%
            </h4>
            {/* Tiny progress bar inside card */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Perlu Perhatian */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5 sm:gap-4"
          id="kpi-perhatian"
        >
          <div className={`p-3 rounded-xl shrink-0 ${delayedCount > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
            {delayedCount > 0 ? <AlertTriangle className="w-5.5 h-5.5 animate-pulse" /> : <CheckCircle2 className="w-5.5 h-5.5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
              Perlu Perhatian
            </p>
            <h4 className={`text-lg sm:text-2xl font-extrabold tracking-tight mt-0.5 ${delayedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {delayedCount}
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 inline-block">
              Progress &lt; 50%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Google Maps Geographic Tracker */}
      <ProjectMap
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
      />

      {/* Project selector cards */}
      <div className="space-y-3" id="project-cards-container">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Daftar Lapangan Aktif
          </h3>
          {selectedProjectId && (
            <button
              onClick={() => onSelectProject(null)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
              id="clear-project-filter"
            >
              Lihat Semua Proyek
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="project-grid-cards">
          {projects.map((project) => {
            const isSelected = selectedProjectId === project.id;
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(isSelected ? null : project.id)}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/10 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-500'
                    : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
                id={`project-card-${project.id}`}
              >
                {/* Visual marker */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
                )}

                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full mb-2">
                      ID: {project.id}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight truncate">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {project.location}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                      {project.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                {/* Progress bar info */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Progress Kumulatif</span>
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold">
                      {project.overallProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.overallProgress >= 80
                          ? 'bg-emerald-500'
                          : project.overallProgress >= 50
                          ? 'bg-blue-600'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${project.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Real-time weather site conditions */}
                {isSelected && (
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <WeatherWidget project={project} isOnline={isOnline} />
                  </div>
                )}

                {/* Meta details footer */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>PM: {project.manager}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Target: {project.targetCompletion}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
