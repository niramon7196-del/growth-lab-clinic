import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../services/firebase';

// Initialize Cloud Storage and get a reference to the service
// Use the initialized app from your existing firebase service
export const storage = app ? getStorage(app) : null;

/**
 * Uploads a participant evidence video to Firebase Storage.
 * Path format: participant-videos/{participantId}/{assignmentId}/{fileName}
 */
export async function uploadParticipantVideo(
  file: File,
  participantId: string,
  assignmentId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized (Missing config or initialization failed).');
  }

  // Use a timestamp and original name to ensure a unique filename if needed,
  // but since we want to possibly overwrite, using just the assignment ID as a folder
  // and a fixed or timestamped filename works.
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
  const filePath = `participant-videos/${participantId}/${assignmentId}/${fileName}`;
  const storageRef = ref(storage, filePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Video upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Deletes a participant evidence video from Firebase Storage by URL.
 */
export async function deleteParticipantVideoByUrl(videoUrl: string): Promise<boolean> {
  if (!storage || !videoUrl) return false;
  
  try {
    const videoRef = ref(storage, videoUrl);
    await deleteObject(videoRef);
    return true;
  } catch (err) {
    console.error('Failed to delete participant video:', err);
    return false;
  }
}
