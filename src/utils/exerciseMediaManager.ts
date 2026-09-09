import { saveClinicConfigToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { cloudApi } from '../services/cloudApi';

export interface ExerciseMediaItem {
  exerciseId: string;
  title: string;
  category?: string;
  pillar?: string; // 5 Core Pillars
  videoUrl: string; // YouTube link, embed link, or MP4 URL
  youtubeId?: string;
  imageUrl?: string; // Exercise demonstration image / infographic URL
  videoDownloadUrl?: string; // Explicit download link for video
  imageDownloadUrl?: string; // Explicit download link for image
  description?: string;
  steps?: string[];
  updatedAt?: string;
}

export const EXERCISE_MEDIA_STORAGE_KEY = 'growthlab_exercise_media';
export const MEDIA_LIBRARY_CUSTOM_STORAGE_KEY = 'growthlab_media_library_custom';

/**
 * Extracts the 11-character YouTube video ID from any URL format
 */
export function extractYouTubeId(urlOrId: string | undefined | null): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // 1. Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Standard YouTube patterns (watch?v=, embed/, v/, shorts/, live/, youtu.be/)
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
}

export const extractYouTubeVideoId = extractYouTubeId;

/**
 * Returns formatted YouTube Embed URL or original video URL
 */
export function formatYouTubeEmbedUrl(urlOrId: string | undefined | null): string {
  const result = formatVideoEmbedUrl(urlOrId);
  return result.embedUrl;
}
export function formatVideoEmbedUrl(urlOrId: string | undefined | null): { embedUrl: string; isYoutube: boolean; youtubeId?: string } {
  if (!urlOrId) {
    return { embedUrl: '', isYoutube: false };
  }

  const trimmed = urlOrId.trim();
  const ytId = extractYouTubeId(trimmed);

  if (ytId) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      isYoutube: true,
      youtubeId: ytId
    };
  }

  // Google Drive preview URL
  const driveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      isYoutube: false
    };
  }

  // Otherwise treat as direct MP4 or video source URL
  return {
    embedUrl: trimmed,
    isYoutube: false
  };
}

/**
 * Gets the current centralized exercise media map from localStorage
 */
export function getStoredExerciseMediaMap(): Record<string, ExerciseMediaItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(EXERCISE_MEDIA_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[exerciseMediaManager] Error reading stored media:', err);
  }

  // Default seed entries for the 4 Golden Moves
  const defaultSeeds: Record<string, ExerciseMediaItem> = {
    'posture_wall_stand': {
      exerciseId: 'posture_wall_stand',
      title: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)',
      pillar: 'Posture & Airway',
      videoUrl: 'https://www.youtube.com/watch?v=Pyi350fPC5c',
      youtubeId: 'Pyi350fPC5c',
      updatedAt: new Date().toISOString()
    },
    'omt_tongue_spot': {
      exerciseId: 'omt_tongue_spot',
      title: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)',
      pillar: 'Tongue & OMT',
      videoUrl: 'https://www.youtube.com/watch?v=Pyi350fPC5c',
      youtubeId: 'Pyi350fPC5c',
      updatedAt: new Date().toISOString()
    },
    'omt_lip_seal': {
      exerciseId: 'omt_lip_seal',
      title: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)',
      pillar: 'Lips & Airway',
      videoUrl: 'https://www.youtube.com/watch?v=Pyi350fPC5c',
      youtubeId: 'Pyi350fPC5c',
      updatedAt: new Date().toISOString()
    },
    'posture_bone_loading_jump': {
      exerciseId: 'posture_bone_loading_jump',
      title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
      pillar: 'Bone & Growth',
      videoUrl: 'https://www.youtube.com/watch?v=Pyi350fPC5c',
      youtubeId: 'Pyi350fPC5c',
      updatedAt: new Date().toISOString()
    }
  };

  return defaultSeeds;
}

/**
 * Saves the centralized exercise media map to localStorage and notifies subscribers
 */
export function saveExerciseMediaMap(mediaMap: Record<string, ExerciseMediaItem>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(EXERCISE_MEDIA_STORAGE_KEY, JSON.stringify(mediaMap));
    window.dispatchEvent(new CustomEvent('growthlab_exercise_media_updated', { detail: mediaMap }));

    // Real-time sync to Google Sheets (Clinic_Config / Media_Map) & Cloud API
    const webhookUrl = getWebhookUrl();
    if (webhookUrl) {
      saveClinicConfigToGoogleSheets(webhookUrl, {
        action: 'SAVE_MEDIA_MAP',
        sheetName: 'Exercise_Media',
        exerciseMediaMap: mediaMap,
        timestamp: new Date().toISOString()
      }).catch(err => console.warn('[exerciseMediaManager] Google Sheets sync error:', err));
    }

    cloudApi.saveClinicConfig({
      action: 'SAVE_MEDIA_MAP',
      sheetName: 'Exercise_Media',
      exerciseMediaMap: mediaMap
    }).catch(err => console.warn('[exerciseMediaManager] cloudApi sync error:', err));

    return true;
  } catch (err) {
    console.error('[exerciseMediaManager] Error saving media map:', err);
    return false;
  }
}

/**
 * Looks up video details for a specific exercise ID or exercise title
 */
export function getExerciseMedia(exerciseId: string, title?: string): ExerciseMediaItem | null {
  if (!exerciseId) return null;
  const map = getStoredExerciseMediaMap();
  
  // 1. Direct ID match
  if (map[exerciseId] && map[exerciseId].videoUrl) {
    return map[exerciseId];
  }

  // 2. Case insensitive ID match
  const cleanId = exerciseId.toLowerCase().trim();
  const matchedKey = Object.keys(map).find(k => k.toLowerCase().trim() === cleanId);
  if (matchedKey && map[matchedKey]?.videoUrl) {
    return map[matchedKey];
  }

  // 3. Title fuzzy match
  if (title) {
    const cleanTitle = title.toLowerCase().trim();
    const matchedByTitle = Object.values(map).find(item => 
      item.videoUrl && item.title && item.title.toLowerCase().includes(cleanTitle)
    );
    if (matchedByTitle) return matchedByTitle;
  }

  return null;
}
