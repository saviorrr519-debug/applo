import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { Project } from '../types';
import { MapPin, Key, ExternalLink, HardHat, TrendingUp, User, Calendar, AlertCircle } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY.trim() !== '' && API_KEY !== 'YOUR_API_KEY';

interface ProjectMapProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

// Controller component to programmatically pan/zoom map based on selected project
function MapController({ selectedProject }: { selectedProject: Project | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedProject || selectedProject.lat === undefined || selectedProject.lng === undefined) return;
    map.panTo({ lat: selectedProject.lat, lng: selectedProject.lng });
    map.setZoom(13);
  }, [map, selectedProject]);

  return null;
}

// Subcomponent for each Project Marker with styled InfoWindow
function ProjectMarker({
  project,
  isSelected,
  onSelect,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  key?: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);

  // Keep info window in sync with card selection
  useEffect(() => {
    setInfoWindowOpen(isSelected);
  }, [isSelected]);

  if (project.lat === undefined || project.lng === undefined) return null;

  // Pin styling based on project progress / status
  const getPinColors = () => {
    if (project.overallProgress >= 80) {
      return { background: '#10b981', glyphColor: '#ffffff', borderColor: '#047857' }; // Green
    }
    if (project.overallProgress >= 50) {
      return { background: '#2563eb', glyphColor: '#ffffff', borderColor: '#1d4ed8' }; // Blue
    }
    return { background: '#f43f5e', glyphColor: '#ffffff', borderColor: '#be123c' }; // Red
  };

  const colors = getPinColors();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: project.lat, lng: project.lng }}
        onClick={() => {
          onSelect();
          setInfoWindowOpen(true);
        }}
        title={project.name}
      >
        <Pin
          background={colors.background}
          glyphColor={colors.glyphColor}
          borderColor={colors.borderColor}
          scale={isSelected ? 1.2 : 1.0}
        />
      </AdvancedMarker>

      {infoWindowOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => {
            setInfoWindowOpen(false);
          }}
        >
          <div className="p-1 max-w-xs text-slate-800 font-sans" id={`info-window-${project.id}`}>
            <span className="inline-block text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md mb-1.5">
              ID: {project.id}
            </span>
            <h4 className="text-xs font-black text-slate-900 leading-tight">
              {project.name}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{project.location}</span>
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-blue-600" /> Progress
                </span>
                <span className="font-black text-slate-900">{project.overallProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${project.overallProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[9px] text-slate-500 font-semibold">
              <div className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{project.manager.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-1 justify-end truncate">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{project.targetCompletion}</span>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function ProjectMap({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectMapProps) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  // If no Google Maps Platform API key is available, render a fully compliant, gorgeous splash configuration panel.
  if (!hasValidKey) {
    return (
      <div
        className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row gap-6 items-center"
        id="maps-setup-required-container"
      >
        <div className="flex-1 space-y-4">
          <div className="inline-flex p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Key className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100 tracking-tight uppercase">
              Google Maps API Key Diperlukan
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sistem membutuhkan kunci API Google Maps Platform yang valid untuk memetakan koordinat geografis proyek secara interaktif.
            </p>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex items-start gap-2.5 text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-600/30 text-blue-400 font-bold rounded-full text-[10px] mt-0.5 shrink-0">1</span>
              <div>
                <a
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Dapatkan API Key Gratis <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-600/30 text-blue-400 font-bold rounded-full text-[10px] mt-0.5 shrink-0">2</span>
              <p className="leading-relaxed">
                Salin Kunci API Anda, buka <strong>Settings</strong> (ikon gerigi di kanan atas layar ini), pilih <strong>Secrets</strong>, tambahkan <code>GOOGLE_MAPS_PLATFORM_KEY</code>, lalu tekan <strong>Enter</strong>.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-3">
            * Aplikasi akan memuat ulang secara otomatis setelah Anda menyimpan kunci rahasia.
          </p>
        </div>

        <div className="w-full md:w-56 shrink-0 bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <HardHat className="w-10 h-10 text-blue-500 opacity-80 mb-3" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Peta Konstruksi</span>
          <p className="text-[10px] text-slate-500 mt-1">
            Mendukung pelacakan koordinat GPS real-time & integrasi visual kemajuan proyek.
          </p>
        </div>
      </div>
    );
  }

  // Initial map state centered around West-Central Indonesia/Java to capture all pins naturally
  const defaultCenter = { lat: -2.548926, lng: 118.0148634 };
  const defaultZoom = 5;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col" id="google-map-panel">
      {/* Map Header */}
      <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4.5 h-4.5 text-blue-600" />
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Peta Geografis Proyek Konstruksi
          </h3>
        </div>
        {selectedProject && (
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full animate-pulse">
            Fokus: {selectedProject.name}
          </span>
        )}
      </div>

      {/* Map Container - Explicit height to prevent collapse (Rule CF2) */}
      <div className="w-full h-[320px] relative" id="gmp-map-element-container">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            mapId="PROTRACK_MAP_ID_1"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={false}
            gestureHandling="cooperative"
          >
            {projects.map((proj) => (
              <ProjectMarker
                key={proj.id}
                project={proj}
                isSelected={selectedProjectId === proj.id}
                onSelect={() => onSelectProject(proj.id)}
              />
            ))}
            <MapController selectedProject={selectedProject} />
          </Map>
        </APIProvider>
      </div>

      {/* Mini Legend Footer */}
      <div className="bg-slate-50/30 dark:bg-slate-950/20 px-5 py-2.5 border-t border-slate-50 dark:border-slate-800/80 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
            &gt;= 80% (Kemajuan Baik)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
            50-79% (Sedang)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" />
            &lt; 50% (Perlu Perhatian)
          </span>
        </div>
        <div className="text-slate-400 dark:text-slate-500">
          Klik pin untuk membuka detail koordinat
        </div>
      </div>
    </div>
  );
}
