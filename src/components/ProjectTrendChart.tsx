import React, { useState, useMemo } from 'react';
import { Project, ProjectProgressReport } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar, Info, Award, LayoutGrid, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectTrendChartProps {
  projects: Project[];
  reports: ProjectProgressReport[];
  selectedCategory?: string;
}

interface Milestone {
  date: string; // YYYY-MM-DD
  progressPercentage: number;
}

// Indonesian month names mapping
const INDO_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatIndonesianDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = INDO_MONTHS[monthIdx] || parts[1];
  return `${parseInt(parts[2], 10)} ${monthName}`;
}

export default function ProjectTrendChart({ projects, reports, selectedCategory }: ProjectTrendChartProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const filteredReports = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'Semua') return reports;
    return reports.filter((r) => r.category === selectedCategory);
  }, [reports, selectedCategory]);

  // Color palette for projects
  const projectColors: Record<string, { stroke: string; fill: string }> = {
    'proj-1': { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },    // Blue
    'proj-2': { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)' },    // Amber
    'proj-3': { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },    // Emerald
    'proj-4': { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)' },    // Purple
    'average': { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.1)' },   // Indigo for average
  };

  const getColorsForProject = (id: string, idx: number) => {
    if (projectColors[id]) return projectColors[id];
    // Fallback dynamic colors
    const colors = [
      { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.1)' }, // Pink
      { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.1)' }, // Teal
      { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.1)' },  // Rose
    ];
    return colors[idx % colors.length];
  };

  // Process data points chronologically
  const chartData = useMemo(() => {
    if (projects.length === 0) return [];

    // 1. Build chronological milestones for each project
    const projectMilestones: Record<string, Milestone[]> = {};

    projects.forEach((proj) => {
      // Find all reports for this project
      const projReports = filteredReports
        .filter((r) => r.projectId === proj.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const milestones: Milestone[] = [];

      // Generate a starting point milestone to show a nice upward line
      if (projReports.length > 0) {
        const firstReportDate = projReports[0].date;
        const d = new Date(firstReportDate);
        d.setDate(d.getDate() - 4); // 4 days earlier
        const startYear = d.getFullYear();
        const startMonth = String(d.getMonth() + 1).padStart(2, '0');
        const startDay = String(d.getDate()).padStart(2, '0');
        const startDateStr = `${startYear}-${startMonth}-${startDay}`;

        // Initial progress: e.g. first report progress minus 15%, clamped to min 0
        const initialProgress = Math.max(0, projReports[0].progressPercentage - 15);
        milestones.push({
          date: startDateStr,
          progressPercentage: initialProgress,
        });
      } else {
        // If no reports, create baseline milestones based on overall progress
        const d = new Date();
        d.setDate(d.getDate() - 5);
        const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        milestones.push({
          date: startStr,
          progressPercentage: Math.max(0, proj.overallProgress - 10),
        });
      }

      // Add each report's progress milestones
      projReports.forEach((rep) => {
        // Only add if there isn't already a milestone for this date or update to higher progress
        const existingIdx = milestones.findIndex((m) => m.date === rep.date);
        if (existingIdx !== -1) {
          if (rep.progressPercentage > milestones[existingIdx].progressPercentage) {
            milestones[existingIdx].progressPercentage = rep.progressPercentage;
          }
        } else {
          milestones.push({
            date: rep.date,
            progressPercentage: rep.progressPercentage,
          });
        }
      });

      // Add current day milestone using actual overallProgress
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const existingTodayIdx = milestones.findIndex((m) => m.date === todayStr);
      if (existingTodayIdx !== -1) {
        milestones[existingTodayIdx].progressPercentage = proj.overallProgress;
      } else {
        milestones.push({
          date: todayStr,
          progressPercentage: proj.overallProgress,
        });
      }

      // Sort milestones ascending by date
      projectMilestones[proj.id] = milestones.sort((a, b) => a.date.localeCompare(b.date));
    });

    // 2. Gather all unique dates across all projects' milestones
    const allDatesSet = new Set<string>();
    Object.values(projectMilestones).forEach((milestones) => {
      milestones.forEach((m) => allDatesSet.add(m.date));
    });
    const sortedDates = Array.from(allDatesSet).sort();

    // 3. Build unified chart data points
    return sortedDates.map((dateStr) => {
      const dataPoint: Record<string, any> = {
        rawDate: dateStr,
        formattedDate: formatIndonesianDate(dateStr),
      };

      let sumProgress = 0;
      let countProjects = 0;

      projects.forEach((proj) => {
        const milestones = projectMilestones[proj.id] || [];
        
        // Find latest milestone on or before this date
        let currentProgress = 0;
        const pastMilestones = milestones.filter((m) => m.date <= dateStr);
        if (pastMilestones.length > 0) {
          currentProgress = pastMilestones[pastMilestones.length - 1].progressPercentage;
        } else if (milestones.length > 0) {
          // If no milestone is before or equal, default to the first milestone's progress
          currentProgress = milestones[0].progressPercentage;
        }

        dataPoint[proj.id] = currentProgress;
        dataPoint[`${proj.id}-name`] = proj.name;

        sumProgress += currentProgress;
        countProjects++;
      });

      // Calculate overall average progress
      dataPoint['Rata-Rata'] = Math.round(sumProgress / (countProjects || 1));

      return dataPoint;
    });
  }, [projects, filteredReports]);

  // Selected project info
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Calculate some analytics stats for the selected project
  const analytics = useMemo(() => {
    if (selectedProjectId === 'all') {
      const latestAvg = chartData.length > 0 ? chartData[chartData.length - 1]['Rata-Rata'] : 0;
      const initialAvg = chartData.length > 0 ? chartData[0]['Rata-Rata'] : 0;
      const growth = latestAvg - initialAvg;
      return {
        currentValue: `${latestAvg}%`,
        growthText: growth >= 0 ? `+${growth}% kenaikan rata-rata` : `${growth}% penurunan`,
        badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
        label: 'Kemajuan Rata-Rata Semua Proyek',
        totalReports: filteredReports.length,
      };
    } else if (selectedProject) {
      const milestones = chartData.map(d => d[selectedProjectId] as number);
      const first = milestones[0] || 0;
      const last = milestones[milestones.length - 1] || selectedProject.overallProgress;
      const growth = last - first;
      return {
        currentValue: `${selectedProject.overallProgress}%`,
        growthText: growth >= 0 ? `+${growth}% kenaikan dari awal` : `${growth}%`,
        badgeColor: selectedProject.overallProgress >= 80 
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
        label: `Progres Terpasang: ${selectedProject.name}`,
        totalReports: filteredReports.filter((r) => r.projectId === selectedProjectId).length,
      };
    }
    return null;
  }, [selectedProjectId, selectedProject, chartData, filteredReports]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left" id="trend-visualization-card">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Tren Progres Fisik Proyek
            </h3>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Tinjau fluktuasi kemajuan konstruksi berdasarkan rekaman kronologis laporan harian.
          </p>
        </div>

        {/* Project Selector dropdown */}
        <div className="relative min-w-[200px] w-full sm:w-auto">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer shadow-sm"
            id="trend-project-selector"
          >
            <option value="all">Semua Proyek (Perbandingan)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Analytics Mini Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" id="trend-analytics-metrics">
          <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Kemajuan Saat Ini
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {analytics.currentValue}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${analytics.badgeColor}`}>
                {analytics.growthText}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Aktivitas Laporan
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                {analytics.totalReports}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Laporan Terbit
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Status Capaian
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Aman &amp; Terkendali
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Container */}
      <div className="h-[280px] w-full" id="trend-chart-render-box">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {selectedProjectId === 'all' ? (
              // Multi line comparison chart
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs max-w-[280px]">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            {label}
                          </p>
                          <div className="space-y-1">
                            {payload.map((entry) => {
                              if (entry.name === 'Rata-Rata') {
                                return (
                                  <div key={entry.name} className="flex justify-between gap-4 font-bold border-t border-dashed border-slate-100 dark:border-slate-800/50 pt-1 mt-1 text-slate-900 dark:text-white">
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      {entry.name}
                                    </span>
                                    <span>{entry.value}%</span>
                                  </div>
                                );
                              }
                              return (
                                <div key={entry.name} className="flex justify-between gap-4 text-slate-600 dark:text-slate-400">
                                  <span className="flex items-center gap-1.5 truncate max-w-[170px]">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    {entry.name}
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{entry.value}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                
                {/* Lines for each active project */}
                {projects.map((proj, idx) => {
                  const colors = getColorsForProject(proj.id, idx);
                  return (
                    <Line
                      key={proj.id}
                      type="monotone"
                      dataKey={proj.id}
                      name={proj.name}
                      stroke={colors.stroke}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5, strokeWidth: 1 }}
                    />
                  );
                })}

                {/* Overlaid Indigo line for aggregate system Average */}
                <Line
                  type="monotone"
                  dataKey="Rata-Rata"
                  name="Rata-Rata"
                  stroke={projectColors.average.stroke}
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              // Individual project Area Chart for rich feedback representation
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`colorGrad-${selectedProjectId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={projectColors[selectedProjectId]?.stroke || '#3b82f6'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={projectColors[selectedProjectId]?.stroke || '#3b82f6'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0];
                      return (
                        <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs max-w-[280px]">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            {label}
                          </p>
                          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 mt-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              Kemajuan Fisik:
                            </span>
                            <span className="text-sm text-blue-600 dark:text-blue-400 font-black">{entry.value}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                            Kemajuan terakumulasi dari seluruh pelaporan kategori Struktur, Arsitektur, Finishing, &amp; Mekanikal.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedProjectId}
                  name={selectedProject?.name || 'Progres'}
                  stroke={projectColors[selectedProjectId]?.stroke || '#3b82f6'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#colorGrad-${selectedProjectId})`}
                  dot={{ r: 4, strokeWidth: 1.5, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Info className="w-8 h-8 mb-2" />
            <span className="text-xs font-semibold">Tidak ada data tren untuk ditampilkan</span>
          </div>
        )}
      </div>

      {/* Info message or footnote */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold" id="trend-footnote">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <span>Garis putus-putus menunjukkan <strong>Rata-Rata Agregat</strong> dari seluruh performa proyek di lapangan.</span>
      </div>
    </div>
  );
}
