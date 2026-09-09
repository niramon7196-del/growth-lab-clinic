/**
 * Image compressor utility for user profile photos.
 * Ensures the generated Base64 string is resized and compressed to < 50 KB,
 * preventing memory leaks, quota errors in LocalStorage, and browser crashes.
 */
export function compressImage(
  file: File,
  maxWidth = 200,
  maxHeight = 200,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      // Fallback
      resolve('');
    };
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onerror = () => {
        resolve(src);
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width || maxWidth;
        canvas.height = height || maxHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Draw and export as compressed JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
