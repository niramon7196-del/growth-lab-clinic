import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, X, FileText, ShieldCheck, Download, Eye, Image as ImageIcon
} from 'lucide-react';

interface DocumentViewerProps {
  title: string;
  subtitle?: string;
  documentName: string;
  importDate?: string;
  source?: string;
  imageSrc?: string; // Optional image URL if available
  documentContent: React.ReactNode; // High-fidelity structured content rendering
}

export default function DocumentViewer({
  title,
  subtitle,
  documentName,
  importDate = '11 สิงหาคม 2569',
  source = 'แพทย์ / Clinical Reference',
  imageSrc,
  documentContent
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="w-full max-w-full mx-auto p-4 sm:p-6 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              {source}
            </span>
            <span className="text-slate-400 text-[11px] font-medium">นำเข้าเมื่อ: {importDate}</span>
          </div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            เอกสารต้นฉบับจากแพทย์: {documentName}
          </h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 75}
            title="ย่อขนาด (Zoom Out)"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-purple-300 px-2 min-w-[50px] text-center">
            {zoom}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 250}
            title="ขยายขนาด (Zoom In)"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            title="รีเซ็ตขนาด (Reset)"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-800 my-auto mx-1" />

          <button
            onClick={() => setIsFullscreen(true)}
            title="เปิดแสดงผลเต็มจอ (Fullscreen)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>ขยายเต็มจอ</span>
          </button>
        </div>
      </div>

      {/* Main Document Display Viewport */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden w-full min-h-[500px] overflow-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
        <motion.div
          animate={{ scale: zoom / 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ transformOrigin: 'top center' }}
          className="w-full max-w-full bg-white text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-8 md:p-12 border border-slate-200 select-text transition-all"
        >
          {documentContent}
        </motion.div>
      </div>

      {/* Fullscreen Overlay Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-8 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-purple-600/30 border border-purple-500/40 rounded-xl">
                  <FileText className="w-5 h-5 text-purple-300" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-white">{documentName}</h2>
                  <p className="text-xs text-slate-400">ต้นฉบับเอกสารอ้างอิงทางการแพทย์ (Clinical Document Fullscreen Viewer)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-white cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-purple-300">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-white cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Document Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start mt-4">
              <div
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-full bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 md:p-12 border border-slate-300 transition-transform duration-200"
              >
                {documentContent}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
