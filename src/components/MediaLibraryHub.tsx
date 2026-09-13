import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PatientEducationHub from './PatientEducationHub';
import { Logo } from './Logo';
import { 
  Play, Video, BookOpen, CheckCircle2, ChevronRight, Activity, Smile, 
  ShieldCheck, ListChecks, Info, Plus, Pencil, Trash2, X, Upload, 
  Link as LinkIcon, AlertTriangle, Save, RefreshCw, Download, Image as ImageIcon,
  Maximize2, ExternalLink, Sparkles, Copy, Check, Eye
} from 'lucide-react';
import { UserRole } from '../types';
import { saveClinicConfigToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { cloudApi } from '../services/cloudApi';

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  youtubeId?: string;
  videoUrl?: string;
  imageUrl?: string;
  videoDownloadUrl?: string;
  imageDownloadUrl?: string;
  steps: string[];
}

export interface VideoCategory {
  id: string;
  title: string;
  iconName?: string;
  videos: VideoContent[];
}

// Utility to extract Google Drive File ID
export const extractDriveFileId = (url?: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return null;
};

// Utility to convert Google Drive / Web image links into direct displayable image URLs
export const resolveImageUrl = (url?: string): string => {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }
  return trimmed;
};

// Utility to determine download link or direct URL
export const resolveDownloadInfo = (url?: string): { url: string; isDirect: boolean; isDrive: boolean } => {
  if (!url || !url.trim()) return { url: '#', isDirect: false, isDrive: false };
  const trimmed = url.trim();

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return { url: trimmed, isDirect: true, isDrive: false };
  }

  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return { 
      url: `https://drive.google.com/uc?export=download&id=${driveId}`, 
      isDirect: false, 
      isDrive: true 
    };
  }

  let ytId = '';
  if (trimmed.includes('youtube.com/watch?v=')) {
    ytId = trimmed.split('v=')[1]?.split('&')[0] || '';
  } else if (trimmed.includes('youtube.com/shorts/')) {
    ytId = trimmed.split('shorts/')[1]?.split('?')[0] || '';
  } else if (trimmed.includes('youtu.be/')) {
    ytId = trimmed.split('youtu.be/')[1]?.split('?')[0] || '';
  }

  if (ytId) {
    return { url: `https://www.youtube.com/watch?v=${ytId}`, isDirect: false, isDrive: false };
  }

  return { url: trimmed, isDirect: true, isDrive: false };
};

const DEFAULT_CATEGORIES: VideoCategory[] = [
  {
    id: 'omt',
    title: 'หมวด OMT (บริหารกล้ามเนื้อช่องปาก)',
    iconName: 'Smile',
    videos: [
      {
        id: 'omt_1',
        title: 'ท่าฝึกการหายใจทางจมูก (Nasal Breathing)',
        description: 'การฝึกหายใจผ่านจมูกอย่างถูกต้อง เพื่อเสริมสร้างพัฒนาการโครงหน้าและทางเดินหายใจ',
        youtubeId: 'Pyi350fPC5c',
        videoUrl: 'https://www.youtube.com/watch?v=Pyi350fPC5c',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'นั่งหรือยืนในท่าที่ผ่อนคลาย ยืดหลังตรง',
          'ปิดริมฝีปากให้สนิท วางลิ้นแตะเพดานปากด้านบน',
          'สูดลมหายใจเข้าทางจมูกช้าๆ ลึกๆ ให้หน้าท้องขยาย',
          'ผ่อนลมหายใจออกทางจมูกช้าๆ ให้หน้าท้องแฟบลง',
          'ทำต่อเนื่อง 5-10 นาทีต่อวัน'
        ]
      },
      {
        id: 'omt_2',
        title: 'ท่าปิดริมฝีปากสนิท (Lip Seal)',
        description: 'ฝึกความแข็งแรงของกล้ามเนื้อรอบริมฝีปาก ให้อยู่ในตำแหน่งที่ปิดสนิทตลอดเวลา',
        youtubeId: 'Oq5E_y2T-A4', 
        videoUrl: 'https://www.youtube.com/watch?v=Oq5E_y2T-A4',
        imageUrl: 'https://images.unsplash.com/photo-1512290900673-35f1134a66e4?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'เม้มริมฝีปากเข้าหากันให้สนิท โดยไม่เกร็งคาง',
          'อมลมไว้ในแก้มสลับซ้าย-ขวา',
          'ใช้ไม้กดลิ้นหรือกระดุมฝึกดึงริมฝีปากเพื่อเพิ่มความแข็งแรง',
          'พยายามคงสถานะริมฝีปากปิดสนิทในชีวิตประจำวัน'
        ]
      },
      {
        id: 'omt_3',
        title: 'ท่าวางตำแหน่งลิ้นบนเพดาน (Tongue Spot)',
        description: 'ปรับตำแหน่งลิ้นที่ถูกต้องขณะพักผ่อน (Resting Posture)',
        youtubeId: 'T8XG40iO02E', 
        videoUrl: 'https://www.youtube.com/watch?v=T8XG40iO02E',
        imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'หาตำแหน่ง "Spot" ซึ่งอยู่หลังฟันหน้าบน (บริเวณรอยหยักบนเพดานปาก)',
          'วางปลายลิ้นแตะที่ตำแหน่ง Spot',
          'ดูดลิ้นส่วนที่เหลือให้แนบสนิทไปกับเพดานปาก',
          'ค้างไว้และกลืนน้ำลายโดยไม่ให้ลิ้นขยับจากเพดาน'
        ]
      },
      {
        id: 'omt_4',
        title: 'ท่าฝึกการกลืนถูกต้อง (Proper Swallowing)',
        description: 'ปรับรูปแบบการกลืนน้ำลายและอาหารอย่างถูกวิธี',
        youtubeId: '9L1mX9F5Qcw', 
        videoUrl: 'https://www.youtube.com/watch?v=9L1mX9F5Qcw',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'วางลิ้นในตำแหน่ง Tongue Spot',
          'ปิดริมฝีปากสนิท ฟันกรามสบกันเบาๆ',
          'กลืนน้ำลายโดยใช้กล้ามเนื้อคอ ไม่ใช้กล้ามเนื้อริมฝีปากหรือแก้ม',
          'สังเกตว่าคางไม่เกร็งและริมฝีปากไม่ขยับขณะกลืน'
        ]
      }
    ]
  },
  {
    id: 'posture',
    title: 'หมวดโครงสร้างร่างกาย (Postural & Growth)',
    iconName: 'Activity',
    videos: [
      {
        id: 'posture_1',
        title: 'ท่ายืนพิงผนังปรับบุคลิกภาพ (Wall Stand)',
        description: 'ปรับสมดุลแนวกระดูกสันหลังและลดอาการคอยื่น (Forward Head Posture)',
        youtubeId: 'R7Ww-g9Otyo',
        videoUrl: 'https://www.youtube.com/watch?v=R7Ww-g9Otyo',
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'ยืนพิงผนัง ให้ส้นเท้า สะโพก สะบัก และหลังศีรษะสัมผัสผนัง',
          'เก็บคางลงเล็กน้อย (Chin Tuck)',
          'เกร็งหน้าท้องเล็กน้อย ไม่ให้หลังแอ่นมากเกินไป',
          'ค้างไว้ 1-2 นาที ทำซ้ำ 3-5 รอบ'
        ]
      },
      {
        id: 'posture_2',
        title: 'ท่ากระโดดกระตุ้นการสร้างกระดูก (Bone Loading Jump)',
        description: 'การกระโดดรับแรงกระแทกเพื่อกระตุ้นมวลกระดูกและการเติบโต (Growth Plate)',
        youtubeId: 'u4_Ym04w8eE', 
        videoUrl: 'https://www.youtube.com/watch?v=u4_Ym04w8eE',
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'ยืนตัวตรง กางขาความกว้างระดับไหล่',
          'ย่อเข่าลงเล็กน้อยและกระโดดขึ้นในแนวดิ่ง',
          'ลงพื้นด้วยปลายเท้าและย่อเข่าเพื่อซับแรงกระแทก',
          'ทำเซ็ตละ 10-15 ครั้ง จำนวน 3 เซ็ต'
        ]
      },
      {
        id: 'posture_3',
        title: 'ท่าสร้างความแข็งแรงแกนกลางลำตัว',
        description: 'เพิ่มความมั่นคงของแกนกลางลำตัว (Core Plank, Bird Dog, Glute Bridge)',
        youtubeId: '61aG1U5OqP4', 
        videoUrl: 'https://www.youtube.com/watch?v=61aG1U5OqP4',
        imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'Plank: ตั้งศอกและปลายเท้า เกร็งลำตัวให้เป็นเส้นตรง ค้างไว้ 30 วินาที',
          'Bird Dog: คุกเข่า 4 มุม เหยียดแขนซ้ายและขาขวา ค้างไว้ 5 วินาที สลับข้าง',
          'Glute Bridge: นอนหงาย ชันเข่า ยกสะโพกขึ้นจนลำตัวตรง ค้างไว้ 5 วินาที'
        ]
      }
    ]
  },
  {
    id: 'ef_trainer',
    title: 'หมวดอุปกรณ์ EF Trainer',
    iconName: 'ShieldCheck',
    videos: [
      {
        id: 'ef_1',
        title: 'แนะนำขั้นตอนการใส่อุปกรณ์และวิธีดูแลรักษา',
        description: 'การใส่ EF Trainer อย่างถูกวิธี และการทำความสะอาดเพื่อยืดอายุการใช้งาน',
        youtubeId: 'zU9Q0k1gNXY',
        videoUrl: 'https://www.youtube.com/watch?v=zU9Q0k1gNXY',
        imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'ล้างมือให้สะอาดก่อนจับอุปกรณ์',
          'หันด้านที่มีเครื่องหมาย \'Up\' หรือรอยบากขึ้นด้านบน',
          'สวมอุปกรณ์เข้าในช่องปาก วางริมฝีปากปิดสนิทรอบอุปกรณ์',
          'หลังใช้งานล้างด้วยน้ำเปล่าหรือน้ำสบู่อ่อนๆ (ห้ามใช้น้ำร้อน)',
          'ผึ่งให้แห้งและเก็บในกล่องที่จัดไว้ให้'
        ]
      }
    ]
  },
  {
    id: 'gns',
    title: 'หมวดโภชนาการ GNS',
    iconName: 'BookOpen',
    videos: [
      {
        id: 'gns_1',
        title: 'ความรู้เรื่องอาหารกระตุ้นการเจริญเติบโต',
        description: 'โภชนาการที่จำเป็นสำหรับการพัฒนาโครงสร้างร่างกายและสมอง',
        youtubeId: '3eL_g6u70aY',
        videoUrl: 'https://www.youtube.com/watch?v=3eL_g6u70aY',
        imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80',
        steps: [
          'เน้นโปรตีนคุณภาพสูง (ไข่ เนื้อสัตว์ ปลา นม) เพื่อสร้างกล้ามเนื้อ',
          'รับประทานแคลเซียมและวิตามินดี ให้เพียงพอต่อการสร้างกระดูก',
          'ลดอาหารหวานและน้ำตาลที่ส่งผลเสียต่อโกรทฮอร์โมน (Growth Hormone)',
          'เคี้ยวอาหารให้ละเอียดอย่างน้อย 20-30 ครั้งต่อคำ เพื่อบริหารขากรรไกร',
          'ดื่มน้ำเปล่าให้เพียงพอตลอดวัน'
        ]
      }
    ]
  }
];

export const MEDIA_LIBRARY_CUSTOM_STORAGE_KEY = 'growthlab_media_library_custom';
const LEGACY_STORAGE_KEY = 'growth_lab_media_categories_v4';

// Extract YouTube ID from any format (watch?v=, youtu.be/, shorts/, embed/, live/, v/)
export const extractYouTubeVideoId = (urlOrId?: string | null): string | null => {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // 1. Pure 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. YouTube Patterns
  const patterns = [
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

// Formats any YouTube link into a standard https://www.youtube.com/embed/{ID} URL
export const formatYouTubeEmbedUrl = (urlOrId?: string | null): string => {
  const ytId = extractYouTubeVideoId(urlOrId);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }
  return urlOrId?.trim() || '';
};

const getCategoryIcon = (iconName?: string, catId?: string) => {
  if (catId === 'omt' || iconName === 'Smile') return Smile;
  if (catId === 'posture' || iconName === 'Activity') return Activity;
  if (catId === 'ef_trainer' || iconName === 'ShieldCheck') return ShieldCheck;
  if (catId === 'gns' || iconName === 'BookOpen') return BookOpen;
  return Video;
};

export const parseEmbedInfo = (vid?: VideoContent) => {
  if (!vid) return { isDirectVideo: false, url: '' };
  const source = (vid.videoUrl || vid.youtubeId || '').trim();
  if (!source) return { isDirectVideo: false, url: '' };

  if (
    source.startsWith('blob:') || 
    source.startsWith('data:video') || 
    source.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
  ) {
    return { isDirectVideo: true, url: source };
  }

  const driveMatch = source.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return { isDirectVideo: false, url: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  const ytId = extractYouTubeVideoId(source);
  if (ytId) {
    return { isDirectVideo: false, url: `https://www.youtube.com/embed/${ytId}?rel=0` };
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    return { isDirectVideo: false, url: source };
  }

  return { isDirectVideo: false, url: source };
};

interface MediaLibraryHubProps {
  userRole?: UserRole;
  onNavigate?: (tab: string, patientId?: string, subTab?: string) => void;
}

export const MediaLibraryHub: React.FC<MediaLibraryHubProps> = ({ userRole, onNavigate }) => {
  // Requirement 5: Patient Education Hub for Patients
  const isPatientPortalMode = userRole === 'PATIENT' || 
    (typeof window !== 'undefined' && (
      window.location.search.includes('mode=patient') || 
      window.location.search.includes('portal=patient') || 
      !!sessionStorage.getItem('growthlab_active_patient_hn')
    ));

  if (isPatientPortalMode && userRole !== 'CLINIC_OWNER' && userRole !== 'DOCTOR' && userRole !== 'ASSISTANT' && userRole !== 'ADMIN' && userRole !== 'DEVELOPER') {
    return <PatientEducationHub />;
  }

  const loadCategoriesFromStorage = (): VideoCategory[] => {
    try {
      const saved = localStorage.getItem(MEDIA_LIBRARY_CUSTOM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy)) return parsedLegacy;
      }
    } catch (e) {
      console.warn('Failed to load media categories from localStorage', e);
    }
    return DEFAULT_CATEGORIES;
  };

  const [categories, setCategories] = useState<VideoCategory[]>(loadCategoriesFromStorage);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => categories[0]?.id || 'omt');
  const [activeVideoId, setActiveVideoId] = useState<string>(() => categories[0]?.videos[0]?.id || 'omt_1');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string>(activeCategoryId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoSourceType, setVideoSourceType] = useState<'link' | 'file'>('link');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSourceType, setImageSourceType] = useState<'link' | 'file'>('link');
  const [videoDownloadUrl, setVideoDownloadUrl] = useState('');
  const [imageDownloadUrl, setImageDownloadUrl] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);

  // Lightbox Zoom Image Modal State
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Copy Feedback Toast State
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Delete Confirm Modal State
  const [deletingTarget, setDeletingTarget] = useState<{ categoryId: string; video: VideoContent } | null>(null);

  // Cross-tab and cross-component persistence synchronization
  useEffect(() => {
    const handleStorageSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCategories(e.detail);
      } else {
        setCategories(loadCategoriesFromStorage());
      }
    };
    window.addEventListener('growthlab_media_library_updated', handleStorageSync);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.removeEventListener('growthlab_media_library_updated', handleStorageSync);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  // Save categories to LocalStorage and Cloud
  const saveCategories = (updatedCategories: VideoCategory[]) => {
    setCategories(updatedCategories);
    try {
      localStorage.setItem(MEDIA_LIBRARY_CUSTOM_STORAGE_KEY, JSON.stringify(updatedCategories));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updatedCategories));
      window.dispatchEvent(new CustomEvent('growthlab_media_library_updated', { detail: updatedCategories }));

      // Synchronize to Google Sheets & Cloud Config
      const webhookUrl = getWebhookUrl();
      if (webhookUrl) {
        saveClinicConfigToGoogleSheets(webhookUrl, {
          action: 'SAVE_MEDIA_CATEGORIES',
          sheetName: 'Media_Library',
          mediaCategories: updatedCategories,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn('[MediaLibraryHub] Google Sheets sync error:', err));
      }

      cloudApi.saveClinicConfig({
        action: 'SAVE_MEDIA_CATEGORIES',
        sheetName: 'Media_Library',
        mediaCategories: updatedCategories
      }).catch(err => console.warn('[MediaLibraryHub] cloudApi sync error:', err));
    } catch (e) {
      console.warn('Failed to save media categories to localStorage', e);
    }
  };

  // Synchronize on mount from remote cloud/sheets if localStorage is empty
  useEffect(() => {
    const saved = localStorage.getItem(MEDIA_LIBRARY_CUSTOM_STORAGE_KEY);
    if (!saved) {
      cloudApi.getClinicConfig(getWebhookUrl()).then(res => {
        if (res && res.success && res.data) {
          const configData = res.data as any;
          const remoteCats = configData?.mediaCategories || configData?.payload?.mediaCategories;
          if (Array.isArray(remoteCats) && remoteCats.length > 0) {
            setCategories(remoteCats);
            localStorage.setItem(MEDIA_LIBRARY_CUSTOM_STORAGE_KEY, JSON.stringify(remoteCats));
          }
        }
      }).catch(err => console.warn('[MediaLibraryHub] Cloud fetch error:', err));
    }
  }, []);

  const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];
  const activeVideo = activeCategory?.videos?.find(v => v.id === activeVideoId) || activeCategory?.videos?.[0];

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setModalCategoryId(activeCategoryId);
    setTitle('');
    setDescription('');
    setVideoSourceType('link');
    setVideoUrl('');
    setImageUrl('');
    setImageSourceType('link');
    setVideoDownloadUrl('');
    setImageDownloadUrl('');
    setSteps(['']);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (catId: string, vid: VideoContent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideo(vid);
    setModalCategoryId(catId);
    setTitle(vid.title);
    setDescription(vid.description);
    const vSource = vid.videoUrl || vid.youtubeId || '';
    if (vSource.startsWith('blob:') || vSource.startsWith('data:')) {
      setVideoSourceType('file');
    } else {
      setVideoSourceType('link');
    }
    setVideoUrl(vSource);

    const iSource = vid.imageUrl || '';
    if (iSource.startsWith('blob:') || iSource.startsWith('data:')) {
      setImageSourceType('file');
    } else {
      setImageSourceType('link');
    }
    setImageUrl(iSource);

    setVideoDownloadUrl(vid.videoDownloadUrl || '');
    setImageDownloadUrl(vid.imageDownloadUrl || '');
    setSteps(vid.steps && vid.steps.length > 0 ? [...vid.steps] : ['']);
    setIsModalOpen(true);
  };

  // Delete Video Action
  const handleConfirmDelete = () => {
    if (!deletingTarget) return;
    const { categoryId, video } = deletingTarget;

    const updatedCategories = categories.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        videos: cat.videos.filter(v => v.id !== video.id)
      };
    });

    saveCategories(updatedCategories);

    if (activeVideoId === video.id) {
      const remainingCat = updatedCategories.find(c => c.id === categoryId);
      if (remainingCat && remainingCat.videos.length > 0) {
        setActiveVideoId(remainingCat.videos[0].id);
      } else {
        const anyCatWithVideo = updatedCategories.find(c => c.videos.length > 0);
        if (anyCatWithVideo && anyCatWithVideo.videos[0]) {
          setActiveCategoryId(anyCatWithVideo.id);
          setActiveVideoId(anyCatWithVideo.videos[0].id);
        }
      }
    }

    setDeletingTarget(null);
    setCopyFeedback(`ลบ "${video.title}" เรียบร้อยแล้ว`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Video File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 250 * 1024 * 1024) {
        alert('ไฟล์วิดีโอมีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ที่ไม่เกิน 250MB');
        return;
      }
      const fileObjectUrl = URL.createObjectURL(file);
      setVideoUrl(fileObjectUrl);
      setVideoDownloadUrl(fileObjectUrl);
    }
  };

  // Image File Upload Handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('ไฟล์รูปภาพมีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ที่ไม่เกิน 20MB');
        return;
      }
      const fileObjectUrl = URL.createObjectURL(file);
      setImageUrl(fileObjectUrl);
      setImageDownloadUrl(fileObjectUrl);
    }
  };

  // Save Video & Media Content with Auto YouTube Parser
  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('กรุณาระบุชื่อวิดีโอ/ท่าฝึก');
      return;
    }
    if (!videoUrl.trim() && !imageUrl.trim()) {
      alert('กรุณาระบุลิงก์วิดีโอหรือรูปภาพสาธิตประกอบการฝึกอย่างน้อย 1 อย่าง');
      return;
    }

    const cleanSteps = steps.map(s => s.trim()).filter(Boolean);
    const finalSteps = cleanSteps.length > 0 ? cleanSteps : ['ปฏิบัติตามวิดีโอและรูปภาพสาธิตอย่างเคร่งครัด'];

    const ytId = extractYouTubeVideoId(videoUrl.trim());
    const finalVideoUrl = ytId 
      ? `https://www.youtube.com/watch?v=${ytId}`
      : videoUrl.trim();

    const newVidObj: VideoContent = {
      id: editingVideo ? editingVideo.id : `vid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      description: description.trim() || 'สื่อสาธิตสำหรับการฝึกปฏิบัติแบบครบถ้วน',
      videoUrl: finalVideoUrl,
      youtubeId: ytId || (videoUrl.trim() ? videoUrl.trim() : undefined),
      imageUrl: imageUrl.trim(),
      videoDownloadUrl: videoDownloadUrl.trim() || undefined,
      imageDownloadUrl: imageDownloadUrl.trim() || undefined,
      steps: finalSteps
    };

    let updatedCats = [...categories];

    if (editingVideo) {
      updatedCats = updatedCats.map(cat => {
        const filteredVideos = cat.videos.filter(v => v.id !== editingVideo.id);
        if (cat.id === modalCategoryId) {
          return {
            ...cat,
            videos: [...filteredVideos, newVidObj]
          };
        }
        return { ...cat, videos: filteredVideos };
      });
    } else {
      updatedCats = updatedCats.map(cat => {
        if (cat.id === modalCategoryId) {
          return {
            ...cat,
            videos: [...cat.videos, newVidObj]
          };
        }
        return cat;
      });
    }

    saveCategories(updatedCats);
    setActiveCategoryId(modalCategoryId);
    setActiveVideoId(newVidObj.id);
    setIsModalOpen(false);
    setCopyFeedback(editingVideo ? `บันทึกการแก้ไข "${newVidObj.title}" สำเร็จ` : `เพิ่มสื่อใหม่ "${newVidObj.title}" เรียบร้อยแล้ว`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Reset to default categories
  const handleResetDefaults = () => {
    if (window.confirm('คุณต้องการรีเซ็ตคลังสื่อสาธิตให้กลับเป็นค่าเริ่มต้นหรือไม่?')) {
      saveCategories(DEFAULT_CATEGORIES);
      setActiveCategoryId(DEFAULT_CATEGORIES[0].id);
      setActiveVideoId(DEFAULT_CATEGORIES[0].videos[0].id);
    }
  };

  // Handle Download Trigger
  const triggerDownload = (rawUrl: string | undefined, explicitDownloadUrl: string | undefined, defaultFilename: string) => {
    const targetUrl = explicitDownloadUrl || rawUrl;
    if (!targetUrl || targetUrl === '#') {
      alert('ไม่พบลิงก์สำหรับดาวน์โหลด');
      return;
    }

    const downloadInfo = resolveDownloadInfo(targetUrl);

    if (downloadInfo.isDirect) {
      const a = document.createElement('a');
      a.href = downloadInfo.url;
      a.download = defaultFilename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(downloadInfo.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Copy Link Helper
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(`คัดลอก${label}เรียบร้อยแล้ว`);
      setTimeout(() => setCopyFeedback(null), 3000);
    }).catch(() => {
      alert(`ลิงก์: ${text}`);
    });
  };

  const embedInfo = parseEmbedInfo(activeVideo);
  const displayImageUrl = resolveImageUrl(activeVideo?.imageUrl);

  return (
    <div className="w-full max-w-full lg:max-w-6xl mx-auto space-y-6 pb-20 overflow-x-hidden box-border">
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{copyFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div 
        className="rounded-3xl p-5 sm:p-6 shadow-sm border border-purple-200/70 relative overflow-hidden backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 243, 255, 0.92) 50%, rgba(238, 242, 255, 0.9) 100%)'
        }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full">
          {/* Left side: Logo + Horizontal Title */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0 min-w-0">
            <Logo className="w-24 sm:w-28 h-auto shrink-0" />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 whitespace-nowrap shadow-2xs">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Clinical Exercise Media Hub
                </span>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-lg text-[10px] font-bold shrink-0 whitespace-nowrap">
                  OMT • EF • Anatomy • GNS
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 whitespace-nowrap">
                <Video className="w-6 h-6 text-purple-600 shrink-0" />
                <span>คลังวิดีโอ & ภาพสาธิตประกอบการฝึก</span>
              </h1>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">
                แหล่งรวมวิดีโอและรูปภาพสาธิต (Infographics) ประกอบการฝึกปฏิบัติ OMT, อุปกรณ์ EF และ GNS
              </p>
            </div>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap xl:flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('แบบฝึกหัดที่ได้รับมอบหมาย');
                }
              }}
              className="px-3.5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-4 h-4 text-emerald-100" />
              <span>👁️ ดูตัวอย่างแบบฝึกหัด (Preview)</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              title="คืนค่าเริ่มต้น"
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[42px] cursor-pointer border border-slate-200/80 shadow-2xs whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>รีเซ็ตค่าเดิม</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all min-h-[42px] cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวิดีโอ & ภาพสาธิต</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Content: Video Player, Demonstration Image & Steps */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeVideo ? (
              <motion.div
                key={activeVideo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* DUAL DISPLAY SECTION (Video Player + Demonstration Image Card) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Video Player Box */}
                  <div className={`bg-white p-2.5 rounded-3xl border border-slate-200 shadow-sm ${displayImageUrl ? 'md:col-span-7' : 'md:col-span-12'}`}>
                    <div className="flex items-center justify-between px-3 py-1.5 mb-2">
                      <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-purple-600" />
                        วิดีโอสาธิต
                      </span>
                      {activeVideo.videoUrl && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          HD Video
                        </span>
                      )}
                    </div>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner flex items-center justify-center">
                      {embedInfo.url ? (
                        embedInfo.isDirectVideo ? (
                          <video
                            src={embedInfo.url}
                            controls
                            controlsList="nodownload"
                            className="w-full h-full object-contain bg-black"
                          >
                            บราวเซอร์ของคุณไม่รองรับการเล่นวิดีโอนี้
                          </video>
                        ) : (
                          <iframe
                            src={embedInfo.url}
                            title={activeVideo.title}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )
                      ) : (
                        <div className="text-center p-6 text-slate-400 space-y-2">
                          <Video className="w-10 h-10 mx-auto text-slate-600 mb-1" />
                          <p className="text-xs font-bold text-slate-300">ยังไม่มีลิงก์วิดีโอสาธิต</p>
                          <p className="text-[11px] text-slate-400">
                            สามารถกดปุ่ม "แก้ไขข้อมูลสื่อ" เพื่อระบุลิงก์ YouTube, Drive หรือไฟล์วิดีโอได้
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Demonstration Image Card Section */}
                  {displayImageUrl ? (
                    <div className="md:col-span-5 bg-white p-2.5 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between px-3 py-1.5 mb-2">
                        <span className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-purple-600" />
                          ภาพสาธิตประกอบการฝึก
                        </span>
                        <button
                          onClick={() => setZoomedImageUrl(displayImageUrl)}
                          title="ขยายภาพเต็มจอ"
                          className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>ขยาย</span>
                        </button>
                      </div>

                      <div 
                        onClick={() => setZoomedImageUrl(displayImageUrl)}
                        className="relative flex-1 min-h-[180px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group cursor-pointer"
                      >
                        <img 
                          src={displayImageUrl} 
                          alt={activeVideo.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            // Fallback if image link breaks
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold backdrop-blur-[2px]">
                          <Eye className="w-4 h-4" />
                          <span>คลิกดูภาพขยาย</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="md:col-span-12 bg-purple-50/60 p-4 rounded-2xl border border-dashed border-purple-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">ยังไม่มีรูปภาพสาธิตประกอบการฝึกสำหรับคลิปนี้</p>
                          <p className="text-[11px] text-slate-500">สามารถเพิ่มลิงก์รูปภาพจาก Google Drive หรือ Google Sheets ได้ในเมนูแก้ไข</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleOpenEditModal(activeCategoryId, activeVideo, e)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shrink-0 min-h-[38px] cursor-pointer"
                      >
                        + เพิ่มรูปภาพ
                      </button>
                    </div>
                  )}
                </div>

                {/* Prominent Separate Download Action Buttons */}
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-200 block mb-0.5">
                      Media Downloads & Export
                    </span>
                    <h4 className="text-base font-extrabold text-white">ดาวน์โหลดสื่อการฝึกแยกไฟล์</h4>
                    <p className="text-xs text-purple-200 font-medium mt-0.5">
                      ดาวน์โหลดไฟล์วิดีโอและภาพสาธิตลงเครื่อง หรือก๊อปปี้ลิงก์ไปใส่ Google Sheets
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                    {/* Video Download Button */}
                    <button
                      onClick={() => triggerDownload(activeVideo.videoUrl || activeVideo.youtubeId, activeVideo.videoDownloadUrl, `${activeVideo.id}_video.mp4`)}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-purple-500 hover:bg-purple-400 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[44px]"
                    >
                      <Download className="w-4 h-4" />
                      <span>ดาวน์โหลดวิดีโอ</span>
                    </button>

                    {/* Image Download Button */}
                    {activeVideo.imageUrl && (
                      <button
                        onClick={() => triggerDownload(activeVideo.imageUrl, activeVideo.imageDownloadUrl, `${activeVideo.id}_infographic.jpg`)}
                        className="flex-1 sm:flex-initial px-4 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[44px]"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>ดาวน์โหลดภาพสาธิต</span>
                      </button>
                    )}

                    {/* Copy Link Action Button */}
                    <button
                      onClick={() => {
                        const linkToCopy = activeVideo.videoUrl || activeVideo.imageUrl || window.location.href;
                        copyToClipboard(linkToCopy, 'ลิงก์สื่อการฝึก');
                      }}
                      title="คัดลอกลิงก์สื่อสำหรับ Google Sheets"
                      className="px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center min-h-[44px] cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Video Details & Steps */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-2xl font-black text-slate-800">{activeVideo.title}</h2>
                    <button
                      onClick={(e) => handleOpenEditModal(activeCategoryId, activeVideo, e)}
                      className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>แก้ไขสื่อนี้</span>
                    </button>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Info className="inline-block w-4 h-4 text-purple-500 mr-2 -mt-0.5" />
                    {activeVideo.description}
                  </p>

                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                      <ListChecks className="w-5 h-5 text-purple-600" />
                      ขั้นตอนปฏิบัติกำกับ (Step-by-Step Instructions)
                    </h3>
                    <div className="space-y-3">
                      {activeVideo.steps && activeVideo.steps.length > 0 ? (
                        activeVideo.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <p className="text-slate-700 text-sm font-medium pt-0.5 leading-relaxed">{step}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">ไม่มีขั้นตอนระบุเฉพาะ</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
                <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-bold">ยังไม่มีรายการสื่อในหมวดหมู่นี้</p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs"
                >
                  + เพิ่มสื่อแรก
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right/Sidebar: Categories and Playlist */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden sticky top-6">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm">เลือกหมวดหมู่วิดีโอ & ภาพสาธิต</h3>
            </div>
            
            {/* Category Tab Buttons */}
            <div className="flex overflow-x-auto lg:flex-col border-b border-slate-100 scrollbar-hide">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.iconName, cat.id);
                const isActive = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategoryId(cat.id);
                      if (cat.videos && cat.videos.length > 0) {
                        setActiveVideoId(cat.videos[0].id);
                      } else {
                        setActiveVideoId('');
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3.5 text-left transition-all shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal border-b lg:border-b-0 lg:border-l-4 last:border-b-0 cursor-pointer min-h-[48px]
                      ${isActive 
                        ? 'bg-purple-50 border-purple-600 text-purple-900' 
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs sm:text-sm block truncate">{cat.title}</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">{cat.videos.length} รายการ</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Playlist Box */}
            <div className="p-4 bg-slate-50/30 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  รายการสื่อสาธิตการฝึก
                </h4>
                <button
                  onClick={handleOpenAddModal}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มคลิป</span>
                </button>
              </div>

              <div className="space-y-2">
                {activeCategory?.videos && activeCategory.videos.length > 0 ? (
                  activeCategory.videos.map((vid) => {
                    const isPlaying = activeVideoId === vid.id;
                    return (
                      <div
                        key={vid.id}
                        onClick={() => setActiveVideoId(vid.id)}
                        className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-all border group cursor-pointer
                          ${isPlaying
                            ? 'bg-white border-purple-300 shadow-md ring-1 ring-purple-100'
                            : 'bg-white/80 border-slate-100 hover:bg-white hover:border-slate-200'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0 mt-0.5">
                            <div className={`w-10 h-7 rounded-lg flex items-center justify-center ${isPlaying ? 'bg-purple-600' : 'bg-slate-300 group-hover:bg-purple-500'}`}>
                              <Play className={`w-3.5 h-3.5 ${isPlaying ? 'text-white fill-white' : 'text-white'}`} />
                            </div>
                            {isPlaying && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className={`font-bold text-xs line-clamp-2 leading-snug ${isPlaying ? 'text-purple-900' : 'text-slate-700'}`}>
                              {vid.title}
                            </h5>
                            {vid.imageUrl && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                                <ImageIcon className="w-3 h-3" /> มีภาพสาธิต
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit ✏️ and Delete 🗑️ Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEditModal(activeCategoryId, vid, e)}
                            title="แก้ไขข้อมูลสื่อ"
                            className="p-2.5 bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-700 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTarget({ categoryId: activeCategoryId, video: vid });
                            }}
                            title="ลบสื่อ"
                            className="p-2.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
                    ยังไม่มีรายการวิดีโอในหมวดนี้
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal for Demonstration Image */}
      <AnimatePresence>
        {zoomedImageUrl && (
          <div 
            onClick={() => setZoomedImageUrl(null)}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center"
            >
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => triggerDownload(zoomedImageUrl, undefined, 'exercise_infographic.jpg')}
                  className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-xs flex items-center gap-1 px-4 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดภาพนี้</span>
                </button>
                <button
                  onClick={() => setZoomedImageUrl(null)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 w-full h-full flex items-center justify-center overflow-auto max-h-[85vh]">
                <img 
                  src={zoomedImageUrl} 
                  alt="ภาพสาธิตประกอบการฝึกขยายใหญ่" 
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Video & Demonstration Image Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      {editingVideo ? 'แก้ไขวิดีโอ & ภาพสาธิต' : 'เพิ่มวิดีโอ & ภาพสาธิตใหม่'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      รองรับลิงก์จาก Google Sheets, Google Drive, YouTube หรือไฟล์ตรงในเครื่อง
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Google Sheets / Drive Tip Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed font-medium flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">รองรับลิงก์ Google Sheets & Google Drive:</span> วางลิงก์ไฟล์ภาพ/วิดีโอที่แชร์จาก Google Drive หรือ Google Sheets ในช่องด้านล่างได้ทันที ระบบจะแปลงเป็นลิงก์แสดงผลและดาวน์โหลดอัตโนมัติ
                </div>
              </div>

              <form onSubmit={handleSaveVideo} className="space-y-5">
                {/* Video Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อวิดีโอ / ท่าฝึก <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น ท่าบริหารกล้ามเนื้อช่องปาก OMT 1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    เลือกหมวดหมู่ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalCategoryId}
                    onChange={(e) => setModalCategoryId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SECTION 1: Video Source */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-purple-600" />
                      1. วิดีโอสาธิต (Video Source)
                    </label>
                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setVideoSourceType('link')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          videoSourceType === 'link' ? 'bg-purple-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        ลิงก์ URL / Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoSourceType('file')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          videoSourceType === 'file' ? 'bg-purple-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        อัปโหลด .mp4
                      </button>
                    </div>
                  </div>

                  {videoSourceType === 'link' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="วางลิงก์ YouTube (watch?v=, youtu.be, shorts), Drive หรือ URL วิดีโอ"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      />
                      {videoUrl.trim() && (
                        <div className="p-2.5 bg-purple-50/80 border border-purple-200/80 rounded-xl text-[11px] text-purple-900 space-y-1">
                          {extractYouTubeVideoId(videoUrl) ? (
                            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>ตรวจพบ YouTube Video ID: <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-mono">{extractYouTubeVideoId(videoUrl)}</code></span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-medium text-slate-600">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>ระบบพร้อมเล่นผ่านลิงก์วิดีโอ/ไฟล์ที่ระบุ</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 truncate font-mono">
                            Embed URL: {parseEmbedInfo({ id: 'preview', title: 'Preview', description: '', steps: [], videoUrl: videoUrl.trim() }).url}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-1">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700"
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 2: Demonstration Image / Infographic Source */}
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      2. รูปภาพสาธิตประกอบการฝึก (Demonstration Image)
                    </label>
                    <div className="flex items-center gap-1 p-1 bg-white border border-purple-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setImageSourceType('link')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          imageSourceType === 'link' ? 'bg-purple-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        ลิงก์ภาพ / Drive / Sheets
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSourceType('file')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          imageSourceType === 'file' ? 'bg-purple-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        อัปโหลดรูปภาพ
                      </button>
                    </div>
                  </div>

                  {imageSourceType === 'link' ? (
                    <div>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="วางลิงก์รูปภาพจาก Google Sheets, Google Drive, หรือ URL รูปภาพ (.jpg, .png)"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        ตัวอย่างลิงก์ Google Drive: https://drive.google.com/file/d/1ABC.../view
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-purple-300 rounded-xl text-center space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700"
                      />
                    </div>
                  )}

                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-3 bg-white p-2 rounded-xl border border-purple-100">
                      <img 
                        src={resolveImageUrl(imageUrl)} 
                        alt="พรีวิวภาพสาธิต" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0 flex-1 text-[11px] font-bold text-slate-700 truncate">
                        พรีวิวภาพสาธิตประกอบการฝึกพร้อมใช้งาน
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    คำอธิบาย / รายละเอียด
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="อธิบายวัตถุประสงค์ หรือประโยชน์ของสื่อสาธิตนี้..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-none"
                  />
                </div>

                {/* Steps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700">
                      ขั้นตอนปฏิบัติกำกับ (Step-by-Step)
                    </label>
                    <button
                      type="button"
                      onClick={() => setSteps([...steps, ''])}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มข้อ</span>
                    </button>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => {
                            const newSteps = [...steps];
                            newSteps[idx] = e.target.value;
                            setSteps(newSteps);
                          }}
                          placeholder={`ขั้นตอนที่ ${idx + 1}`}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                        />
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer min-h-[44px]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingVideo ? 'บันทึกการแก้ไข' : 'บันทึกสื่อสาธิต'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {deletingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">ยืนยันการลบสื่อนี้?</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">
                  "{deletingTarget.video.title}"
                </p>
                <p className="text-[11px] text-rose-500 mt-2 font-bold">
                  การดำเนินการนี้จะลบรายการออกจากระบบทันที
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingTarget(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer flex-1 min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex-1 min-h-[44px]"
                >
                  ยืนยันลบ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaLibraryHub;
