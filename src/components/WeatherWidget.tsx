import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  Wind,
  Thermometer,
  Droplets,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Ban,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WeatherWidgetProps {
  project: Project;
  isOnline: boolean;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export default function WeatherWidget({ project, isOnline }: WeatherWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const fetchWeather = async () => {
    if (!project.lat || !project.lng) {
      setError('Koordinat lokasi proyek tidak tersedia.');
      return;
    }

    if (!isOnline) {
      setError('Koneksi offline. Tidak dapat memuat cuaca real-time.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${project.lat}&longitude=${project.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Gagal menghubungi stasiun cuaca meteorologi.');
      }
      const data = await res.json();
      
      if (data && data.current) {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: Math.round(data.current.relative_humidity_2m),
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDir: Math.round(data.current.wind_direction_10m),
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
          time: new Date(data.current.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        throw new Error('Format data respons cuaca tidak didukung.');
      }
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Gagal memuat data cuaca real-time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [project.id, isOnline]);

  // Decode Weather Code (WMO codes)
  const getWeatherMeta = (code: number) => {
    if (code === 0) {
      return { text: 'Cerah', icon: Sun, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
    }
    if ([1, 2, 3].includes(code)) {
      return { text: 'Cerah Berawan', icon: CloudSun, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' };
    }
    if ([45, 48].includes(code)) {
      return { text: 'Kabut / Fog', icon: CloudFog, color: 'text-slate-400 bg-slate-100 dark:bg-slate-800/30' };
    }
    if ([51, 53, 55].includes(code)) {
      return { text: 'Gerimis Ringan', icon: CloudDrizzle, color: 'text-blue-400 bg-blue-50/50 dark:bg-blue-950/10' };
    }
    if ([61, 63, 65, 66, 67].includes(code)) {
      return { text: 'Hujan Terbuka', icon: CloudRain, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' };
    }
    if ([80, 81, 82].includes(code)) {
      return { text: 'Hujan Lebat / Showers', icon: CloudRain, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20 animate-pulse' };
    }
    if ([95, 96, 99].includes(code)) {
      return { text: 'Badai Petir', icon: CloudLightning, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 animate-pulse' };
    }
    return { text: 'Berawan Tebal', icon: Cloud, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800/30' };
  };

  // Evaluate Site Safety for Outdoor Work
  const evaluateSafety = (w: WeatherData) => {
    const isRaining = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(w.weatherCode);
    const isSevereStorm = [95, 96, 99].includes(w.weatherCode);
    
    if (isSevereStorm) {
      return {
        level: 'STOP',
        title: 'KERJA LUAR RUANGAN DITUNDA (K3)',
        desc: 'Bahaya Badai Petir & Angin Ekstrem. Hentikan seluruh crane, pengelasan, dan pekerjaan struktural tinggi segera.',
        color: 'border-rose-500 bg-rose-500/5 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400',
        icon: Ban
      };
    }

    if (isRaining) {
      return {
        level: 'WARNING',
        title: 'PREVENTIF / CUACA HUJAN',
        desc: 'Kurangi pengerjaan finishing dinding luar atau pengecoran terbuka. Siapkan penutup terpal dan periksa kelistrikan luar.',
        color: 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400',
        icon: AlertTriangle
      };
    }

    if (w.windSpeed > 25) {
      return {
        level: 'WARNING',
        title: 'ANGIN KENCANG / WASPADA TINGGI',
        desc: 'Kecepatan angin melebih batas aman crane standar. Batasi pengerjaan scaffolding & ketinggian.',
        color: 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400',
        icon: AlertTriangle
      };
    }

    if (w.temp >= 36) {
      return {
        level: 'WARNING',
        title: 'SUHU EKSTREM / CEGAH DEHIDRASI',
        desc: 'Panas ekstrem dapat membahayakan fisik pekerja. Berikan jeda hidrasi ekstra setiap 45 menit untuk kru lapangan.',
        color: 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400',
        icon: AlertTriangle
      };
    }

    return {
      level: 'SAFE',
      title: 'KONDISI AMAN UNTUK AKTIVITAS',
      desc: 'Suhu, kecepatan angin, dan tingkat kelembapan sangat kondusif untuk pekerjaan struktur beton tinggi, pengelasan, dan finishing.',
      color: 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400',
      icon: ShieldCheck
    };
  };

  const weatherMeta = weather ? getWeatherMeta(weather.weatherCode) : null;
  const safety = weather ? evaluateSafety(weather) : null;
  const WeatherIcon = weatherMeta ? weatherMeta.icon : Sun;
  const SafetyIcon = safety ? safety.icon : ShieldCheck;

  return (
    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 space-y-4" id={`weather-widget-${project.id}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase">
            STASIUN METEOROLOGI SITE
          </span>
          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Kondisi Cuaca Lapangan Real-Time
          </h5>
        </div>
        
        <button
          onClick={fetchWeather}
          disabled={loading}
          className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          title="Segarkan data cuaca"
          id={`refresh-weather-btn-${project.id}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4 flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Menghubungkan ke Stasiun Cuaca...
            </span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg flex items-start gap-2 text-rose-600 dark:text-rose-400"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="space-y-0.5 text-left">
              <p className="text-[10px] font-black uppercase">Gagal Memuat Cuaca</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{error}</p>
            </div>
          </motion.div>
        ) : weather && weatherMeta && safety ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3.5"
          >
            {/* Primary Temp & Condition Showcase */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${weatherMeta.color}`}>
                  <WeatherIcon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                      {weather.temp}°C
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      Feels like {weather.feelsLike}°C
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                    {weatherMeta.text}
                  </span>
                </div>
              </div>

              {/* Wind & Humidity Details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-left bg-white dark:bg-slate-900/60 p-2 border border-slate-100 dark:border-slate-800/40 rounded-xl shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">
                    Kecepatan Angin
                  </span>
                  <div className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      {weather.windSpeed} km/h
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">
                    Kelembapan
                  </span>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      {weather.humidity}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Site Safety Advisory Alert */}
            <div className={`border rounded-xl p-3 text-left space-y-1.5 ${safety.color}`}>
              <div className="flex items-center gap-1.5">
                <SafetyIcon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black tracking-wide uppercase">
                  {safety.title}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed font-semibold">
                {safety.desc}
              </p>
            </div>

            {/* Last update metadata */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Diperbarui pada: {weather.time} WIB
              </span>
              <span className="flex items-center gap-0.5">
                GPS: {project.lat?.toFixed(4)}, {project.lng?.toFixed(4)}
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="text-[10px] text-slate-400 text-center py-2">
            Klik segarkan untuk memuat cuaca proyek.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
