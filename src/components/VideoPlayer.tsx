import React, { useState } from 'react';
import { Play, Info } from 'lucide-react';
import { formatYouTubeEmbedUrl } from '../utils/exerciseMediaManager';

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  thumbnailBg?: string;
}

export default function VideoPlayer({ videoUrl, title, thumbnailBg }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-xs text-slate-300">
          <Play className="w-5 h-5 fill-current" />
        </div>
        <p className="font-bold text-sm text-slate-500">ยังไม่มีวิดีโอ</p>
        <p className="text-xs text-slate-400 mt-1">ยังไม่มีวิดีโอสาธิตสำหรับแบบฝึกนี้</p>
      </div>
    );
  }

  const embedUrl = formatYouTubeEmbedUrl(videoUrl);

  if (!isPlaying) {
    return (
      <div className={`w-full aspect-video rounded-2xl overflow-hidden relative shadow-xs flex items-center justify-center bg-gradient-to-tr ${thumbnailBg || 'from-slate-800 to-slate-900'}`}>
        <button
          onClick={() => setIsPlaying(true)}
          className="w-16 h-16 bg-white/90 text-brand rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer"
        >
          <Play className="w-8 h-8 fill-brand ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative shadow-xs">
      <iframe
        className="w-full h-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
