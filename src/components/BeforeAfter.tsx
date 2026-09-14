import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, Sliders, Sparkles, ArrowLeft, Image as ImageIcon, 
  Eye, X, Plus, User, Upload, CheckCircle2, AlertCircle, 
  Trash2, Tag, FileText, Check, Download, Maximize 
} from 'lucide-react';
import { Patient } from '../types';
import { BEFORE_AFTER_SOURCE_STATUS } from '../data';
import { saveMediaToStorage, getMediaFromStorage, deleteMediaFromStorage } from '../lib/mediaStorage';

interface BeforeAfterProps {
  onBack?: () => void;
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
  selectedPatientId?: string;
}

export default function BeforeAfter({ onBack, patients, onUpdatePatient, selectedPatientId }: BeforeAfterProps) {
  // Clinical Data Gate Check
  const isVerified = BEFORE_AFTER_SOURCE_STATUS === 'VERIFIED';
  const isSourceRequired = BEFORE_AFTER_SOURCE_STATUS === 'SOURCE_REQUIRED';

  const currentPatient = selectedPatientId ? (patients || []).find(p => p.id === selectedPatientId) : undefined;
  
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'slider' | 'gallery'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  
  // Selected image for detail modal
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownloadMedia = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Delete Confirmation State
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'before' as 'before' | 'after',
    category: 'โครงสร้างช่องปาก',
    desc: '',
    patientId: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const gallery = currentPatient?.beforeAfterImages || [];
  const categories = ['ทั้งหมด', 'โครงสร้างช่องปาก', 'โครงสร้างใบหน้า', 'X-ray กระดูกข้อมือและนิ้ว', 'ภาพเอ็กซเรย์อื่น ๆ'];

  const filteredGallery = gallery.filter((img: any) =>
    selectedCategory === 'ทั้งหมด' ? true : img.category === selectedCategory
  );

  // Handle "+ เพิ่มรูปภาพ" button click
  const handleAddImageClick = () => {
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle file input selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: check image type
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif|gif)$/i)) {
      setFeedbackBanner({ text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPEG, PNG, WebP)', type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // File validation: check size (limit 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFeedbackBanner({ text: 'ขนาดไฟล์รูปภาพเกินกำหนด (สูงสุด 10MB) กรุณาเลือกรูปขนาดเล็กลง', type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFeedbackBanner(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const defaultTitle = file.name.replace(/\.[^/.]+$/, '') || 'รูปภาพทางคลินิก';
      const defaultCategory = selectedCategory !== 'ทั้งหมด' ? selectedCategory : 'โครงสร้างช่องปาก';

      setPendingPreviewUrl(dataUrl);
      setUploadForm({
        title: defaultTitle,
        type: 'before',
        category: defaultCategory,
        desc: '',
        patientId: currentPatient?.id || ''
      });
      setUploadModalOpen(true);

      // Reset file input after reading
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setFeedbackBanner({ text: 'เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ กรุณาลองใหม่อีกครั้ง', type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  // Save image to patient record
  const handleConfirmSaveImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!pendingPreviewUrl) {
      setUploadError('ไม่พบข้อมูลรูปภาพ กรุณาเลือกไฟล์ใหม่อีกครั้ง');
      return;
    }

    const targetPatientId = uploadForm.patientId || currentPatient?.id;
    const targetPatient = (patients || []).find(p => p.id === targetPatientId) || currentPatient;

    if (!targetPatient) {
      setUploadError('กรุณาเลือกผู้รับการดูแลสำหรับรูปภาพนี้');
      return;
    }

    const imageId = `img_${Date.now()}`;

    // Save image blob/Data URL to IndexedDB for persistent storage
    await saveMediaToStorage(imageId, pendingPreviewUrl);

    const newImage = {
      id: imageId,
      url: pendingPreviewUrl,
      title: uploadForm.title.trim() || 'รูปภาพบันทึกทางคลินิก',
      date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
      category: uploadForm.category,
      type: uploadForm.type,
      label: uploadForm.type === 'before' ? 'ก่อนเริ่มฝึก' : 'หลังติดตามผล',
      desc: uploadForm.desc.trim()
    };

    const updatedPatient = {
      ...targetPatient,
      beforeAfterImages: [...(targetPatient.beforeAfterImages || []), newImage]
    };

    // Save state & persist
    onUpdatePatient(updatedPatient);

    // Auto update view category & switch to gallery tab
    if (selectedCategory !== 'ทั้งหมด' && selectedCategory !== uploadForm.category) {
      setSelectedCategory(uploadForm.category);
    }
    setActiveTab('gallery');

    // Close upload modal
    setUploadModalOpen(false);
    setPendingPreviewUrl('');
    setUploadError(null);

    // Show success feedback
    setFeedbackBanner({
      text: `เพิ่มรูปภาพ "${newImage.title}" ในหมวดหมู่ "${newImage.category}" สำเร็จ!`,
      type: 'success'
    });

    setTimeout(() => {
      setFeedbackBanner(null);
    }, 5000);
  };

  // Delete image handler
  const handleDeleteImage = async (imageId: string) => {
    if (!currentPatient) return;

    await deleteMediaFromStorage(imageId);

    const updatedImages = (currentPatient.beforeAfterImages || []).filter((img: any) => img.id !== imageId);
    const updatedPatient = {
      ...currentPatient,
      beforeAfterImages: updatedImages
    };
    onUpdatePatient(updatedPatient);
    setDeletingImageId(null);
    if (selectedImage && selectedImage.id === imageId) {
      setSelectedImage(null);
    }
    setFeedbackBanner({ text: 'ลบรูปภาพออกจากระบบเรียบร้อยแล้ว', type: 'success' });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // Slider Mouse/Touch Controls
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  // Find latest uploaded 'before' and 'after' images for slider if available
  const latestBeforeImg = (gallery.filter((img: any) => img.type === 'before').slice(-1)[0])?.url || currentPatient?.photoBefore;
  const latestAfterImg = (gallery.filter((img: any) => img.type === 'after').slice(-1)[0])?.url || currentPatient?.photoAfter;

  if (!currentPatient) {
    return (
      <div className="space-y-6 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border">
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 text-3xl">
            📷
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่ได้เลือกสมาชิกผู้รับการดูแล</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            กรุณาเลือกสมาชิกผู้รับการดูแลจากรายการแถบด้านบน เพื่อเปรียบเทียบพัฒนาการ Before / After
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border">
      
      {/* Hidden File Input for Image Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Camera className="w-4 h-4" />
            <span>คลังรูปภาพและเปรียบเทียบพัฒนาการ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">เปรียบเทียบพัฒนาการ (Before / After)</h1>
          <p className="text-purple-100 text-xs sm:text-sm leading-relaxed max-w-xl">
            บันทึกรูปภาพโครงสร้างช่องปาก ใบหน้า และภาพเอ็กซเรย์ เพื่อเปรียบเทียบพัฒนาการแบบ Interactive Slider
          </p>
          
          {currentPatient && (
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-purple-200">ผู้รับการดูแลปัจจุบัน:</span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/20">
                {currentPatient.firstName.replace(/\s*\(DEMO\)/, '')} {currentPatient.lastName} (HN: {currentPatient.hn})
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddImageClick}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-md cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มรูปภาพ</span>
          </button>
        </div>
      </div>

      {!isVerified && (
        <div className={`border-2 p-4 rounded-2xl flex items-center gap-3 shadow-sm ${isSourceRequired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <AlertCircle className={`w-6 h-6 shrink-0 ${isSourceRequired ? 'text-red-500' : 'text-amber-500'}`} />
          <div>
            <p className="text-sm font-black uppercase tracking-tight">
              {isSourceRequired ? 'BEFORE/AFTER CLINICAL SOURCE = REQUIRED' : 'BEFORE/AFTER SOURCE = NOT VERIFIED'}
            </p>
            <p className="text-[11px] font-medium opacity-90">
              {isSourceRequired ? 'Original clinical physical reference images are missing. Placeholder images and galleries are currently disabled or quarantined.' : 'รูปภาพเปรียบเทียบยังไม่ได้รับการยืนยันต้นฉบับทางคลินิก'}
            </p>
          </div>
        </div>
      )}

      {/* Global Feedback Banner */}
      {feedbackBanner && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200 ${
          feedbackBanner.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button onClick={() => setFeedbackBanner(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isSourceRequired && (
        <div className="space-y-6">
          {/* View Mode Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gallery'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>คลังรูปภาพตามหมวดหมู่ ({gallery.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('slider')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'slider'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>โหมดเปรียบเทียบ (Interactive Slider)</span>
        </button>
      </div>

      {/* TAB 1: GALLERY GRID VIEW */}
      {activeTab === 'gallery' ? (
        <div className="space-y-6">
          {/* Category Filter Pills & Upload Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>หมวดหมู่:</span>
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddImageClick}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดรูปเพิ่มเข้าหมวดนี้</span>
            </button>
          </div>

          {filteredGallery.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGallery.map((img: any) => (
                <div
                  key={img.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="w-full h-52 bg-slate-950 relative flex flex-col items-center justify-center p-2 text-white text-center overflow-hidden">
                    {img.url ? (
                      <img 
                        src={img.url} 
                        alt={img.title} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-3xl mb-2">
                        {img.type === 'before' ? '👦' : '🧒'}
                      </div>
                    )}
                    
                    {/* Badge Badges Overlay */}
                    <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md ${
                        img.type === 'before' ? 'bg-amber-500/90 text-white' : 'bg-emerald-500/90 text-white'
                      }`}>
                        {img.label || (img.type === 'before' ? 'ก่อนเริ่มฝึก' : 'หลังติดตามผล')}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-900/80 text-purple-200 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                        {img.category}
                      </span>
                    </div>

                    <span className="absolute bottom-2 right-3 z-10 text-[10px] font-semibold text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {img.date}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 leading-snug line-clamp-1">{img.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">
                        {img.desc || 'ไม่มีคำอธิบายเพิ่มเติม'}
                      </p>
                    </div>
                    
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedImage(img)}
                        className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>เปิดดูรูปใหญ่</span>
                      </button>

                      <button
                        onClick={() => setDeletingImageId(img.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="ลบรูปภาพ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EMPTY GALLERY DROPZONE */
            <div className="bg-white p-10 sm:p-14 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">ยังไม่มีรูปภาพในหมวดหมู่ "{selectedCategory}"</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  กดปุ่มด้านล่างเพื่อเลือกรูปภาพจากเครื่อง (Photos / Files) และบันทึกลงสู่ประวัติการดูแลของ {currentPatient?.firstName?.replace(/\s*\(DEMO\)/, '')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddImageClick}
                className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-3 rounded-2xl transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ เลือกและอัปโหลดรูปภาพ</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: INTERACTIVE SLIDER VIEW */
        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                เคสผู้รับการดูแล: {currentPatient?.firstName?.replace(/\s*\(DEMO\)/, '')} {currentPatient?.lastName} (HN: {currentPatient?.hn})
              </h2>
              <p className="text-xs text-slate-500">เปรียบเทียบภาพโครงสร้างแบบ Interactive Split View</p>
            </div>
            <div className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-100 self-start sm:self-auto">
              ภาพที่อัปโหลดล่าสุด: {gallery.length} รูป
            </div>
          </div>

          {/* Interactive Comparison Slider Container */}
          <div 
            className="relative w-full h-[380px] md:h-[460px] rounded-3xl overflow-hidden select-none cursor-ew-resize border border-slate-200 shadow-md bg-slate-950"
            onMouseMove={handleMouseMove}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
          >
            {/* AFTER IMAGE (Background - Full Width) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-950 via-indigo-900 to-slate-900 flex flex-col items-center justify-center text-white p-6">
              {latestAfterImg ? (
                <img src={latestAfterImg} alt="After" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-3 max-w-sm relative z-10">
                  <div className="w-28 h-28 rounded-full bg-purple-600/30 border-2 border-purple-400 flex items-center justify-center text-5xl shadow-2xl mx-auto">
                    🧒
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-emerald-300">หลังติดตามผล (ปัจจุบัน)</h3>
                  <p className="text-xs text-purple-200 leading-relaxed">
                    โครงสร้างขากรรไกรเรียงตัวดีขึ้น การหายใจทางจมูกสมบูรณ์ กล้ามเนื้อรอบปากกระชับขึ้น
                  </p>
                </div>
              )}
              <span className="absolute bottom-4 right-6 z-20 bg-emerald-500/90 text-white font-bold text-xs px-3.5 py-1 rounded-full shadow-md backdrop-blur-xs">
                หลังติดตามผล (After)
              </span>
            </div>

            {/* BEFORE IMAGE (Foreground - Clip Width via sliderPosition) */}
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center text-white p-6 overflow-hidden border-r-2 border-white"
              style={{ width: `${sliderPosition}%` }}
            >
              {latestBeforeImg ? (
                <img src={latestBeforeImg} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-3 w-full max-w-xs px-2 relative z-10">
                  <div className="w-28 h-28 rounded-full bg-slate-700/50 border-2 border-slate-500 flex items-center justify-center text-5xl shadow-2xl mx-auto">
                    👦
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-amber-300">ก่อนเริ่มฝึก (เริ่มต้น)</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    มีภาวะหายใจทางปาก กล้ามเนื้อรอบปากอ่อนแรง และการสบฟันเปิดระยะเริ่มต้น
                  </p>
                </div>
              )}
              <span className="absolute bottom-4 left-6 z-20 bg-amber-600/90 text-white font-bold text-xs px-3.5 py-1 rounded-full shadow-md backdrop-blur-xs">
                ก่อนเริ่มฝึก (Before)
              </span>
            </div>

            {/* Divider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.6)] z-30 pointer-events-none flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-10 h-10 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold border border-slate-300">
                <Sliders className="w-5 h-5 text-purple-700" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>คำแนะนำ: ใช้นิ้วปัดหรือลากเมาส์ซ้าย-ขวาบนภาพเพื่อเปรียบเทียบ</span>
            </span>
            <span className="font-bold text-purple-700">ตำแหน่งเปรียบเทียบ: {sliderPosition}%</span>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 1. CUSTOM IMAGE UPLOAD & METADATA MODAL    */}
      {/* ========================================== */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-left my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-purple-200" />
                <h3 className="font-bold text-base">นำเข้ารูปภาพทางคลินิกใหม่</h3>
              </div>
              <button 
                type="button"
                onClick={() => setUploadModalOpen(false)} 
                className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmSaveImage} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Image Preview Box */}
              <div className="w-full h-52 bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-200">
                <img 
                  src={pendingPreviewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>ผูกข้อมูลกับผู้รับการดูแล:</span>
                </label>
                <select
                  value={uploadForm.patientId}
                  onChange={(e) => setUploadForm({ ...uploadForm, patientId: e.target.value })}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                >
                  {(patients || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName?.replace(/\s*\(DEMO\)/, '') || p.name || p.hn} {p.lastName || ''} (HN: {p.hn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>ชื่อรูปภาพ / หัวข้อ:</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="เช่น โครงสร้างช่องปากก่อนเริ่มฝึก..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none font-medium"
                />
              </div>

              {/* Type Selection (Before / After) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ระยะการบันทึกภาพ:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadForm({ ...uploadForm, type: 'before' })}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      uploadForm.type === 'before'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>👦</span>
                    <span>ก่อนเริ่มฝึก (Before)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadForm({ ...uploadForm, type: 'after' })}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      uploadForm.type === 'after'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🧒</span>
                    <span>หลังติดตามผล (After)</span>
                  </button>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>หมวดหมู่รูปภาพ:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['โครงสร้างช่องปาก', 'โครงสร้างใบหน้า', 'X-ray กระดูกข้อมือและนิ้ว', 'ภาพเอ็กซเรย์อื่น ๆ'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setUploadForm({ ...uploadForm, category: cat })}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        uploadForm.category === cat
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description TextArea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบายเพิ่มเติม (ทางคลินิก):
                </label>
                <textarea
                  rows={2}
                  value={uploadForm.desc}
                  onChange={(e) => setUploadForm({ ...uploadForm, desc: e.target.value })}
                  placeholder="เช่น มีการสบฟันส้น ลิ้นแตะเพดานปากต่ำ..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>

              {/* Form Error Banner */}
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ยืนยันบันทึกรูปภาพ</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
        </div>
      )}

      {/* ========================================== */}
      {/* 2. IMAGE EXPANDED DETAIL MODAL             */}
      {/* ========================================== */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-left my-auto animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm line-clamp-1">{selectedImage.title}</h3>
              <button 
                onClick={() => setSelectedImage(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="w-full h-64 bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-white p-2 relative overflow-hidden">
                {selectedImage.url ? (
                  <img src={selectedImage.url} alt={selectedImage.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-600/30 border-2 border-purple-400 flex items-center justify-center text-4xl mb-3 mx-auto">
                      {selectedImage.type === 'before' ? '👦' : '🧒'}
                    </div>
                    <span className="text-sm font-bold text-emerald-300">{selectedImage.label}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedImage.type === 'before' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedImage.label || (selectedImage.type === 'before' ? 'ก่อนเริ่มฝึก' : 'หลังติดตามผล')}
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    {selectedImage.category}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">{selectedImage.date}</span>
                </div>
                <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                  {selectedImage.desc || 'ไม่มีคำอธิบายเพิ่มเติม'}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedImage.url && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadMedia(selectedImage.url, `growthlab_${selectedImage.title}.jpg`)}
                      className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      ดาวน์โหลด
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Maximize className="w-3.5 h-3.5" />
                      ขยายเต็มจอ
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDeletingImageId(selectedImage.id);
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรูปภาพ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="flex-1 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4 text-purple-600" />
                  <span>← กลับ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2.5 FULLSCREEN ZOOM MODAL                  */}
      {/* ========================================== */}
      {isFullscreen && selectedImage && selectedImage.url && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[70] cursor-pointer"
          >
            <X className="w-8 h-8" />
          </button>
          
          <img 
            src={selectedImage.url} 
            alt={selectedImage.title} 
            className="max-w-full max-h-full object-contain select-none touch-manipulation cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadMedia(selectedImage.url, `growthlab_${selectedImage.title}.jpg`);
            }}
            className="absolute bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors z-[70] cursor-pointer shadow-lg flex items-center justify-center gap-2 font-bold shadow-emerald-900/50"
          >
            <Download className="w-5 h-5" />
            ดาวน์โหลดไฟล์ต้นฉบับ
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. DELETE CONFIRMATION DIALOG              */}
      {/* ========================================== */}
      {deletingImageId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">ยืนยันการลบรูปภาพ?</h3>
              <p className="text-xs text-slate-500">
                รูปภาพนี้จะถูกลบออกจากประวัติของ {currentPatient?.firstName?.replace(/\s*\(DEMO\)/, '')} และไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingImageId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteImage(deletingImageId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
