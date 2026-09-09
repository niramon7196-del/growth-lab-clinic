import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, ArrowLeft, Video, CheckCircle2, 
  Film, Layers, Plus, Edit2, 
  Trash2, Save, X, Eye, AlertCircle, ToggleLeft, ToggleRight,
  Upload, Loader2, FileVideo, Clock, Link as LinkIcon, Sparkles, Database, Search
} from 'lucide-react';
import { VideoItem, UserRole } from '../types';
import { SEED_EXERCISES } from '../data';
import { saveMediaToStorage, getMediaFromStorage, deleteMediaFromStorage } from '../lib/mediaStorage';
import { 
  getStoredExerciseMediaMap, 
  saveExerciseMediaMap, 
  formatVideoEmbedUrl, 
  ExerciseMediaItem 
} from '../utils/exerciseMediaManager';

export const CLINICAL_VIDEOS: VideoItem[] = [
  {
    id: 'breathing_1',
    title: 'สาธิตการฝึกหายใจผ่านจมูก (Nasal Breathing)',
    subTitle: 'เทคนิคปรับการหายใจทางจมูกตามแนวทาง Growth Lab',
    category: 'การหายใจ',
    duration: '03:45 นาที',
    description: 'วิดีโอสาธิตการฝึกควบคุมลมหายใจเข้า-ออกทางรูจมูก พร้อมการจัดท่าทางร่างกายและช่องปากที่ถูกต้อง',
    steps: [
      'หุบปากให้สนิท ปลายลิ้นแตะเพดานปากส่วนหน้า',
      'สูดลมหายใจเข้าช้าๆ ทางจมูกนับ 1-6',
      'กลั้นลมหายใจค้างไว้ 3 วินาที',
      'ผ่อนลมหายใจออกช้าๆ ทางจมูกนับ 1-6'
    ],
    thumbnailBg: 'from-teal-800 to-slate-900',
    youtubeId: 'Pyi350fPC5c',
    isActive: true
  },
  {
    id: 'lips_2',
    title: 'สาธิตการบริหารริมฝีปาก (Lip Seal)',
    subTitle: 'กระชับกล้ามเนื้อรอบริมฝีปาก',
    category: 'ริมฝีปาก',
    duration: '04:50 นาที',
    description: 'สาธิตขั้นตอนอมลมแก้มป่อง ย้ายลมสลับข้าง เม้มปาก และฉีกยิ้มปรับความสมมาตรใบหน้า',
    steps: [
      'อมลมแก้มป่องค้างไว้ 5 วินาที',
      'ย้ายลมไปแก้มซ้าย แก้มขวา และริมฝีปาก',
      'เม้มริมฝีปากแน่น 5 วินาที',
      'ฉีกยิ้มกว้างกึ่งเกร็ง 5 วินาที'
    ],
    thumbnailBg: 'from-amber-800 to-slate-900',
    youtubeId: 'Pyi350fPC5c',
    isActive: true
  },
  {
    id: 'tongue_3',
    title: 'สาธิตการฝึกยกสะบักลิ้น (Tongue Posture)',
    subTitle: 'การยกฐานลิ้นแตะเพดานเพื่อกระตุ้นขากรรไกร',
    category: 'กล้ามเนื้อลิ้น',
    duration: '05:10 นาที',
    description: 'การฝึกดูดลิ้นติดเพดานปากเพื่อเพิ่มแรงกดกระดูกขากรรไกรบนและปรับโครงสร้างใบหน้าเด็ก',
    steps: [
      'อ้าปากเล็กน้อย ทาบลิ้นทั้งหมดแนบสนิทกับเพดานปากด้านบน',
      'ออกแรงดูดลิ้นให้ติดกับเพดานปากจนเกิดสุญญากาศ',
      'อ้าปากกว้างที่สุดโดยที่ลิ้นยังคงดูดติดแน่น ค้างไว้ 5-10 วินาที'
    ],
    thumbnailBg: 'from-sky-800 to-slate-900',
    youtubeId: 'Pyi350fPC5c',
    isActive: true
  },
  {
    id: 'swallowing_4',
    title: 'สาธิตการกลืนที่ถูกต้อง (Proper Swallowing)',
    subTitle: 'ฝึกกระบวนการกลืนโดยไม่ใช้ลิ้นดุนฟัน',
    category: 'การกลืน',
    duration: '04:20 นาที',
    description: 'วิดีโอสาธิตการกลืนน้ำหรืออาหารอย่างถูกต้อง โดยให้ลิ้นแตะเพดานและไม่ใช้กล้ามเนื้อใบหน้าผิดวิธี',
    steps: [
      'หุบปากให้สนิท ปลายลิ้นแตะเพดานปาก',
      'รวบรวมน้ำลายหรือน้ำไว้กลางลิ้น',
      'กลืนลงไปโดยไม่ให้ฟันกระทบกันหรือแก้มเกร็ง'
    ],
    thumbnailBg: 'from-emerald-800 to-slate-900',
    youtubeId: 'Pyi350fPC5c',
    isActive: true
  }
];

interface VideoModuleProps {
  onBack?: () => void;
  videos: VideoItem[];
  userRole?: UserRole | null;
  onAddVideo?: (video: VideoItem) => void;
  onEditVideo?: (video: VideoItem) => void;
  onDeleteVideo?: (id: string) => void;
  isPatient?: boolean;
}

export default function VideoModule({ 
  onBack, 
  videos, 
  userRole, 
  onAddVideo, 
  onEditVideo, 
  onDeleteVideo,
  isPatient 
}: VideoModuleProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [selectedPillar, setSelectedPillar] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isManageMode, setIsManageMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Partial<VideoItem>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Centralized Exercise Media State
  const [mediaMap, setMediaMap] = useState<Record<string, ExerciseMediaItem>>(() => getStoredExerciseMediaMap());
  const [isSavingHub, setIsSavingHub] = useState(false);
  const [hubSaveSuccess, setHubSaveSuccess] = useState(false);

  // File upload state for videos
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Store loaded blob/data URLs from IndexedDB for uploaded videos
  const [loadedMediaMap, setLoadedMediaMap] = useState<Record<string, string>>({});

  const categories = ['ทั้งหมด', 'การฝึกหายใจ', 'การระบายลม', 'กล้ามเนื้อลิ้น', 'กล้ามเนื้อใบหน้า', 'อื่นๆ'];
  
  const canManage = userRole === 'ADMIN' || userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'DOCTOR';

  // Load video media blobs from IndexedDB if not directly embedded in state
  useEffect(() => {
    let isMounted = true;
    videos.forEach(async (vid) => {
      if (!vid.videoSrc && !vid.youtubeId) {
        const stored = await getMediaFromStorage(vid.id);
        if (stored && isMounted) {
          setLoadedMediaMap(prev => ({ ...prev, [vid.id]: stored }));
        }
      }
    });
    return () => { isMounted = false; };
  }, [videos]);

  // Sync mediaMap changes
  useEffect(() => {
    const handleStorageUpdate = (e: any) => {
      if (e.detail) {
        setMediaMap(e.detail);
      } else {
        setMediaMap(getStoredExerciseMediaMap());
      }
    };
    window.addEventListener('growthlab_exercise_media_updated', handleStorageUpdate);
    return () => window.removeEventListener('growthlab_exercise_media_updated', handleStorageUpdate);
  }, []);

  const handleSaveCentralMediaHub = () => {
    setIsSavingHub(true);
    const success = saveExerciseMediaMap(mediaMap);
    setTimeout(() => {
      setIsSavingHub(false);
      if (success) {
        setHubSaveSuccess(true);
        setFeedbackBanner({
          text: 'บันทึกคลังสื่อวิดีโอสาธิต 5 เสาหลักเข้าสู่ระบบและเชื่อมฝั่งคนไข้เรียบร้อยแล้ว!',
          type: 'success'
        });
        setTimeout(() => setHubSaveSuccess(false), 3000);
        setTimeout(() => setFeedbackBanner(null), 5000);
      } else {
        setFeedbackBanner({
          text: 'เกิดข้อผิดพลาดในการบันทึกคลังสื่อ',
          type: 'error'
        });
      }
    }, 300);
  };

  const handleUpdateMediaLink = (exId: string, title: string, category: string, newUrl: string) => {
    const formatted = formatVideoEmbedUrl(newUrl);
    setMediaMap(prev => ({
      ...prev,
      [exId]: {
        exerciseId: exId,
        title: title,
        category: category,
        videoUrl: newUrl.trim(),
        youtubeId: formatted.youtubeId,
        updatedAt: new Date().toISOString()
      }
    }));
  };

  const filteredVideos = videos.filter((v) => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' ? true : v.category === selectedCategory;
    if (!canManage) return matchesCategory && v.isActive !== false;
    return matchesCategory;
  });

  const handleOpenAdd = () => {
    setUploadError(null);
    setEditingVideo({
      id: `vid_${Date.now()}`,
      title: '',
      subTitle: '',
      category: 'การฝึกหายใจ',
      duration: '',
      description: '',
      steps: [''],
      isActive: true,
      thumbnailBg: 'from-purple-800 to-slate-900'
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (vid: VideoItem) => {
    setUploadError(null);
    setEditingVideo({ ...vid });
    setIsEditing(true);
  };

  // Video File Selection Handler
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
      setUploadError('กรุณาเลือกไฟล์วิดีโอที่มีฟอร์แมตถูกต้อง (MP4, WebM)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์วิดีโอใหญ่เกินไป (สูงสุด 100MB)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onload = async (event) => {
      const resultUrl = event.target?.result as string;
      if (!resultUrl) {
        setUploadError('ไม่สามารถอ่านไฟล์วิดีโอได้ กรุณาลองใหม่อีกครั้ง');
        setIsUploading(false);
        return;
      }

      const formattedSize = (file.size / (1024 * 1024)).toFixed(1);
      const videoDurationLabel = `${formattedSize} MB`;

      if (editingVideo.id) {
        await saveMediaToStorage(editingVideo.id, resultUrl);
      }

      setEditingVideo(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        videoSrc: resultUrl,
        youtubeId: undefined,
        duration: prev.duration || videoDurationLabel
      }));

      setIsUploading(false);
      setUploadProgress(100);
      
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setUploadError('เกิดข้อผิดพลาดในการโหลดวิดีโอ');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editingVideo.title || !editingVideo.category) {
      setUploadError('กรุณากรอกชื่อวิดีโอและเลือกหมวดหมู่ให้ครบถ้วน');
      return;
    }

    if (!editingVideo.youtubeId && !editingVideo.videoSrc && editingVideo.id && !loadedMediaMap[editingVideo.id]) {
      setUploadError('กรุณาอัปโหลดไฟล์วิดีโอ หรือระบุ YouTube Video ID');
      return;
    }

    const finalVideo: VideoItem = {
      id: editingVideo.id || `vid_${Date.now()}`,
      title: editingVideo.title.trim(),
      subTitle: editingVideo.subTitle?.trim() || '',
      category: editingVideo.category,
      duration: editingVideo.duration?.trim() || 'วิดีโอทางคลินิก',
      description: editingVideo.description?.trim() || '',
      steps: editingVideo.steps?.filter(s => s.trim() !== '') || [],
      thumbnailBg: editingVideo.thumbnailBg || 'from-purple-800 to-slate-900',
      videoSrc: editingVideo.videoSrc,
      youtubeId: editingVideo.youtubeId?.trim(),
      isActive: editingVideo.isActive !== false
    };

    if (finalVideo.videoSrc && finalVideo.videoSrc.startsWith('data:')) {
      await saveMediaToStorage(finalVideo.id, finalVideo.videoSrc);
    }

    const exists = videos.find(v => v.id === finalVideo.id);
    if (exists) {
      onEditVideo?.(finalVideo);
    } else {
      onAddVideo?.(finalVideo);
    }

    // Also link in central media map if applicable
    if (finalVideo.id) {
      handleUpdateMediaLink(
        finalVideo.id, 
        finalVideo.title, 
        finalVideo.category, 
        finalVideo.youtubeId ? `https://www.youtube.com/watch?v=${finalVideo.youtubeId}` : (finalVideo.videoSrc || '')
      );
      saveExerciseMediaMap(mediaMap);
    }

    setIsEditing(false);
    setEditingVideo({});
    setUploadError(null);
    setFeedbackBanner({ text: `บันทึกวิดีโอ "${finalVideo.title}" เรียบร้อยแล้ว`, type: 'success' });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const confirmDelete = async (id: string) => {
    await deleteMediaFromStorage(id);
    onDeleteVideo?.(id);
    setShowDeleteConfirm(null);
    if (selectedVideo && selectedVideo.id === id) {
      setSelectedVideo(null);
    }
    setFeedbackBanner({ text: 'ลบวิดีโอออกจากระบบเรียบร้อยแล้ว', type: 'success' });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // Group seed exercises by 5 pillars
  const pillarGroupList = [
    {
      id: 'ALL',
      name: '🌟 ครบ 5 เสาหลัก (All 5 Pillars)',
      items: SEED_EXERCISES
    },
    {
      id: 'OMT',
      name: '👄 1. OMT (กล้ามเนื้อปาก)',
      items: SEED_EXERCISES.filter(ex => ex.category === 'breathing' || ex.category === 'lips' || ex.category === 'tongue' || ex.category === 'swallowing' || ex.category === 'cheek_jaw')
    },
    {
      id: 'SLEEP_EF',
      name: '😴 2. การนอน / EF (Sleep & Appliance)',
      items: SEED_EXERCISES.filter(ex => ex.category === 'appliance' || ex.category === 'sleep' || ex.id.startsWith('EFA') || ex.id.startsWith('SLP'))
    },
    {
      id: 'EXERCISE',
      name: '🏃 3. Exercise (การออกกำลังกาย & สรีระ)',
      items: SEED_EXERCISES.filter(ex => ex.category === 'posture' || ex.category === 'movement' || ex.category === 'core' || ex.id.startsWith('EX'))
    },
    {
      id: 'NUTRITION',
      name: '🥗 4. โภชนาการ (Nutrition Score)',
      items: SEED_EXERCISES.filter(ex => ex.category === 'nutrition' || ex.id.startsWith('GNS'))
    },
    {
      id: 'FAMILY',
      name: '👨‍👩‍👧 5. ครอบครัว (Family & Routine)',
      items: SEED_EXERCISES.filter(ex => ex.category === 'daily' || ex.id === 'daily_8')
    }
  ];

  const currentPillarGroup = pillarGroupList.find(p => p.id === selectedPillar) || pillarGroupList[0];

  const filteredPillarExercises = currentPillarGroup.items.filter(ex => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ex.title.toLowerCase().includes(q) || ex.id.toLowerCase().includes(q) || ex.category.toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-left">
      
      {/* Hidden File Input for Video Upload */}
      <input 
        type="file" 
        ref={videoFileInputRef}
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleVideoFileSelect}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Centralized Media Hub</span>
              </span>
              <span className="text-xs text-purple-200 font-semibold">• เชื่อมโยงฝั่งคนไข้แบบอัตโนมัติ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">🎬 คลังวิดีโอสาธิตการฝึก (Exercise Media Hub)</h1>
            <p className="text-sm text-purple-200 font-medium leading-relaxed">
              จัดการวิดีโอสาธิตการฝึกทุกเสาหลัก (YouTube / MP4 Embed) เมื่อบันทึกคลังสื่อ ระบบจะเชื่อมวิดีโอเข้ากับแบบฝึกหัดที่ได้รับมอบหมายในหน้าคนไข้โดยอัตโนมัติ
            </p>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleSaveCentralMediaHub}
                disabled={isSavingHub}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                  hubSaveSuccess 
                    ? 'bg-emerald-500 text-white shadow-emerald-900/30' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-[1.02]'
                }`}
              >
                {isSavingHub ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : hubSaveSuccess ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{hubSaveSuccess ? 'บันทึกเรียบร้อย ✓' : '💾 บันทึกคลังสื่อ'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-sm transition-all ${
          feedbackBanner.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </div>
          <button onClick={() => setFeedbackBanner(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {isEditing ? (
        /* EDITING / UPLOAD FORM */
        <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">รายละเอียดและการจัดการไฟล์วิดีโอ</h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-purple-600" />
              <span>ไฟล์วิดีโอสาธิต (Native Video Upload or YouTube)</span>
            </h4>

            {editingVideo.videoSrc || (editingVideo.id && loadedMediaMap[editingVideo.id]) ? (
              <div className="space-y-3">
                <div className="w-full h-56 md:h-64 bg-black rounded-2xl overflow-hidden relative">
                  <video 
                    src={editingVideo.videoSrc || (editingVideo.id ? loadedMediaMap[editingVideo.id] : '')}
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>อัปโหลดและสร้างพรีวิววิดีโอสำเร็จพร้อมใช้งาน</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (videoFileInputRef.current) {
                        videoFileInputRef.current.value = '';
                        videoFileInputRef.current.click();
                      }
                    }}
                    className="text-purple-700 hover:underline font-bold cursor-pointer"
                  >
                    เปลี่ยนไฟล์วิดีโอ
                  </button>
                </div>
              </div>
            ) : editingVideo.youtubeId ? (
              <div className="space-y-3">
                <div className="w-full h-56 md:h-64 bg-black rounded-2xl overflow-hidden relative">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${editingVideo.youtubeId}`}
                    title="YouTube Preview"
                    frameBorder="0"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-purple-700 bg-purple-50 p-3 rounded-xl border border-purple-200">
                  <span className="font-bold">เชื่อมต่อกับ YouTube Video ID: {editingVideo.youtubeId}</span>
                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, youtubeId: undefined })}
                    className="text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    ยกเลิก YouTube ID
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 p-8 rounded-2xl text-center space-y-4 bg-white">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-slate-800">เลือกไฟล์วิดีโอจากเครื่องของคุณ</h5>
                  <p className="text-xs text-slate-500">รองรับไฟล์ MP4, WebM (สูงสุด 100MB)</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => {
                      if (videoFileInputRef.current) {
                        videoFileInputRef.current.value = '';
                        videoFileInputRef.current.click();
                      }
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isUploading ? `กำลังอัปโหลด (${uploadProgress}%)...` : 'เลือกไฟล์วิดีโอ (Native File Picker)'}</span>
                  </button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold text-purple-800">
                  <span>กำลังประมวลผลวิดีโอ...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold">ชื่อวิดีโอ *</label>
                <input 
                  type="text" 
                  value={editingVideo.title || ''}
                  onChange={(e) => setEditingVideo({...editingVideo, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                  placeholder="เช่น 1. สาธิตการฝึกหายใจ..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold">หัวข้อย่อย / คำโปรย</label>
                <input 
                  type="text" 
                  value={editingVideo.subTitle || ''}
                  onChange={(e) => setEditingVideo({...editingVideo, subTitle: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="เช่น เทคนิคปรับการหายใจทางจมูก..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold">หมวดหมู่ *</label>
                  <select 
                    value={editingVideo.category || 'การฝึกหายใจ'}
                    onChange={(e) => setEditingVideo({...editingVideo, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    {categories.filter(c => c !== 'ทั้งหมด').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold">ความยาว / ขนาด</label>
                  <input 
                    type="text" 
                    value={editingVideo.duration || ''}
                    onChange={(e) => setEditingVideo({...editingVideo, duration: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    placeholder="เช่น 03:45 นาที"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold">YouTube Video Link / ID</label>
                <input 
                  type="text" 
                  value={editingVideo.youtubeId || ''}
                  onChange={(e) => {
                    const formatted = formatVideoEmbedUrl(e.target.value);
                    setEditingVideo({
                      ...editingVideo, 
                      youtubeId: formatted.youtubeId || e.target.value
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-xs"
                  placeholder="วางลิงก์ เช่น https://www.youtube.com/watch?v=Pyi350fPC5c"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold">คำอธิบายรายละเอียดบทเรียน</label>
                <textarea 
                  rows={3}
                  value={editingVideo.description || ''}
                  onChange={(e) => setEditingVideo({...editingVideo, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="รายละเอียดวัตถุประสงค์และประโยชน์ของการฝึก..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลวิดีโอ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all cursor-pointer min-h-[44px]"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : selectedVideo ? (
        /* DETAILED PLAYER VIEW */
        <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 px-4 py-2.5 rounded-xl transition-all cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← ย้อนกลับไปคลังสื่อ</span>
            </button>

            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {selectedVideo.category} • {selectedVideo.duration}
            </span>
          </div>

          {/* Interactive Player Screen */}
          <div className="w-full h-80 sm:h-96 md:h-[460px] bg-slate-950 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800 shadow-xl">
            {selectedVideo.youtubeId ? (
              <div className="w-full h-full relative z-20 bg-black flex flex-col items-center justify-center">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (selectedVideo.videoSrc || loadedMediaMap[selectedVideo.id]) ? (
              <video 
                src={selectedVideo.videoSrc || loadedMediaMap[selectedVideo.id]} 
                controls 
                autoPlay
                className="w-full h-full object-contain relative z-20 bg-black"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="relative z-10 text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-white/10 text-white/50 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20">
                  <Video className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 shadow-sm">ยังไม่มีวิดีโอในระบบ</h3>
                  <p className="text-sm text-slate-300 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md inline-block border border-white/10">
                    ยังไม่ได้ใส่อ้างอิงวิดีโอสำหรับบทเรียนนี้
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CENTRALIZED MEDIA HUB MATRIX VIEW */
        <div className="space-y-6">
          {/* Pillar Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            {pillarGroupList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPillar(p.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                  selectedPillar === p.id
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <span>{p.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-black">{p.items.length}</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อแบบฝึกหัด หรือรหัส (เช่น breathing_1, EF-001, EX_1)..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มบทเรียนใหม่</span>
            </button>
          </div>

          {/* Exercise Items Table / Matrix */}
          <div className="aurora-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>รายการแบบฝึกหัด 5 เสาหลัก & ลิงก์วิดีโอสื่อกลาง</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">พบ {filteredPillarExercises.length} แบบฝึกหัด</span>
            </div>

            <div className="space-y-3">
              {filteredPillarExercises.map((ex) => {
                const media = mediaMap[ex.id] || { videoUrl: ex.videoUrl || '' };
                const formatted = formatVideoEmbedUrl(media.videoUrl);

                return (
                  <div key={ex.id} className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/40 border border-slate-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Exercise Info */}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-mono text-[11px] font-bold">
                          ID: {ex.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                          {ex.category}
                        </span>
                        {formatted.isYoutube && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                            <Video className="w-3 h-3 text-rose-600" />
                            YouTube Connected
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{ex.title}</h4>
                      {ex.subTitle && <p className="text-xs text-slate-500 line-clamp-1">{ex.subTitle}</p>}
                    </div>

                    {/* Media Link Input */}
                    <div className="flex items-center gap-2 flex-1 max-w-xl">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={media.videoUrl || ''}
                          onChange={(e) => handleUpdateMediaLink(ex.id, ex.title, ex.category, e.target.value)}
                          placeholder="วาง YouTube URL / Embed Link / MP4 URL..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>

                      {media.videoUrl ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const formatted = formatVideoEmbedUrl(media.videoUrl);
                              setSelectedVideo({
                                id: ex.id,
                                title: ex.title,
                                subTitle: ex.subTitle || '',
                                category: ex.category,
                                duration: '03:00 นาที',
                                description: ex.description || '',
                                steps: ex.steps || [],
                                youtubeId: formatted.youtubeId,
                                videoSrc: !formatted.youtubeId ? media.videoUrl : undefined,
                                isActive: true
                              });
                            }}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer min-h-[38px] shadow-xs"
                            title="ดูพรีวิววิดีโอ"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ดูพรีวิว</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateMediaLink(ex.id, ex.title, ex.category, '')}
                            className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer min-h-[38px] transition-all shadow-xs"
                            title="ลบวิดีโอ / เคลียร์ลิงก์"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span className="hidden sm:inline">ลบวิดีโอ</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic shrink-0 px-2">ยังไม่มีวิดีโอ</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                * เมื่อเพิ่มหรือแก้ไขลิงก์วิดีโอ ให้กดปุ่ม "บันทึกคลังสื่อ" เพื่ออัปเดตระบบกลาง
              </span>
              <button
                type="button"
                onClick={handleSaveCentralMediaHub}
                disabled={isSavingHub}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                {isSavingHub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{hubSaveSuccess ? 'บันทึกสำเร็จ ✓' : 'บันทึกคลังสื่อ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">ต้องการลบวิดีโอนี้หรือไม่?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => confirmDelete(showDeleteConfirm)}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-rose-200 min-h-[44px]"
                >
                  ลบวิดีโอ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
