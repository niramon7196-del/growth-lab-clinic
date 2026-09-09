import fs from 'fs';

const file = 'src/components/ClinicProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

const newProcessImage = `  const processImageFile = (file: File, onComplete: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      triggerLocalFeedback('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP)', 'error');
      return;
    }
    // Limit to 5MB before compression
    if (file.size > 5 * 1024 * 1024) {
      triggerLocalFeedback('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Image Compression Logic
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            onComplete(compressedDataUrl);
          } else {
            onComplete(result); // Fallback
          }
        };
        img.onerror = () => {
          onComplete(result); // Fallback
        }
        img.src = result;
      }
    };
    reader.onerror = () => {
      triggerLocalFeedback('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ', 'error');
    };
    reader.readAsDataURL(file);
  };`;

content = content.replace(/  const processImageFile = \(file: File, onComplete: \(dataUrl: string\) => void\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\n  \};/, newProcessImage);

fs.writeFileSync(file, content);
