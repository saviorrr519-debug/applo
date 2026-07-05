import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportPhotoGalleryProps {
  photoUrl: string;
  photoUrls?: string[];
  projectName: string;
  onZoom: (url: string) => void;
}

export default function ReportPhotoGallery({
  photoUrl,
  photoUrls,
  projectName,
  onZoom,
}: ReportPhotoGalleryProps) {
  const photos = photoUrls && photoUrls.length > 0 ? photoUrls : [photoUrl];
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const currentPhoto = photos[currentIndex] || photoUrl;

  return (
    <div className="w-full md:w-48 flex flex-col gap-2 shrink-0" id="report-gallery-root">
      {/* Main Image View */}
      <div
        className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 shadow-inner group cursor-pointer"
        onClick={() => onZoom(currentPhoto)}
        id="report-gallery-main-view"
      >
        {/* Image with slide-fade transition */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={currentPhoto}
            alt={`${projectName} - Foto ${currentIndex + 1}`}
            initial={{ opacity: 0.6, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.6, x: -5 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </AnimatePresence>

        {/* Hover Zoom overlay */}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-950/90 p-2 rounded-full text-slate-800 dark:text-slate-200 shadow-md">
            <ZoomIn className="w-4 h-4" />
          </div>
        </div>

        {/* Click to zoom helper badge */}
        <span className="absolute bottom-2 left-2 bg-black/60 text-[8px] font-bold text-white px-1.5 py-0.5 rounded backdrop-blur-sm uppercase tracking-wider">
          Klik Perbesar
        </span>

        {/* Counter Badge */}
        {photos.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1">
            <ImageIcon className="w-2.5 h-2.5" />
            <span>{currentIndex + 1}/{photos.length}</span>
          </div>
        )}

        {/* Left/Right Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1 rounded-full transition-all opacity-0 group-hover:opacity-100"
              title="Sebelumnya"
              id="gallery-prev-btn"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1 rounded-full transition-all opacity-0 group-hover:opacity-100"
              title="Berikutnya"
              id="gallery-next-btn"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Bottom indicator dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1 bg-black/30 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={`w-1 h-1 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniature Thumbnails Row */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700" id="report-gallery-thumbs">
          {photos.map((url, idx) => (
            <button
              key={idx}
              onClick={(e) => handleThumbnailClick(idx, e)}
              className={`relative w-10 h-8 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex
                  ? 'border-blue-500 scale-105 shadow-sm'
                  : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              id={`thumb-btn-${idx}`}
            >
              <img
                src={url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
