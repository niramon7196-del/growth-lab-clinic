import fs from 'fs';

const file = 'src/components/ClinicProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

// Use regex to replace handleSaveAllClinicInfo
const regex = /const handleSaveAllClinicInfo = \(e\?: React\.FormEvent\) => \{[\s\S]*?triggerLocalFeedback\('✓ บันทึกข้อมูลแพทย์และคลินิกเรียบร้อยแล้ว', 'success'\);\n  \};/m;

const newFunc = `const handleSaveAllClinicInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Removed strict validation to allow partial saves without errors
    const constructedDocName = doctorForm.doctorPrefix 
      ? \`\${doctorForm.doctorPrefix} \${doctorForm.doctorFullName.trim()}\`.trim()
      : doctorForm.doctorFullName.trim();

    const finalDoctorName = constructedDocName || doctorForm.doctorName.trim() || settings.doctorName || 'ทันตแพทย์หญิง นภาพร วรรณษา';

    const updated: ClinicSettings = {
      ...settings,
      clinicName: clinicForm.clinicName.trim() || settings.clinicName || 'Growth Lab Dental & Orthodontics',
      clinicNameEn: clinicForm.clinicNameEn.trim() || settings.clinicNameEn || 'Growth Lab Dental & Growth Center',
      address: clinicForm.address.trim() || settings.address || '',
      phone: clinicForm.phone.trim() || settings.phone || '',
      email: clinicForm.email.trim() || settings.email || '',
      website: clinicForm.website.trim() || settings.website || '',
      additionalInfo: clinicForm.additionalInfo.trim() || settings.additionalInfo || '',
      clinicLogoUrl: clinicForm.clinicLogoUrl.trim() || settings.clinicLogoUrl || '',
      doctorName: finalDoctorName,
      doctorTitlePosition: doctorForm.doctorTitlePosition.trim() || settings.doctorTitlePosition || '',
      doctorLicenseNo: doctorForm.doctorLicenseNo.trim() || settings.doctorLicenseNo || '',
      doctorSpecialty: doctorForm.doctorSpecialty.trim() || settings.doctorSpecialty || '',
      doctorBio: doctorForm.doctorBio.trim() || settings.doctorBio || '',
      doctorPhotoUrl: doctorForm.doctorPhotoUrl.trim() || settings.doctorPhotoUrl || ''
    };

    try {
      localStorage.setItem('growthlab_clinic_info', JSON.stringify(updated));
      localStorage.setItem('growth_lab_settings', JSON.stringify(updated));
      
      if (onUpdateSettings) {
        onUpdateSettings(updated);
      }
  
      setShowEditClinicModal(false);
      setShowEditDoctorModal(false);
      triggerLocalFeedback('✓ บันทึกข้อมูลคลินิกและแพทย์เรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.warn('[ClinicProfile] Error saving to localStorage:', err);
      triggerLocalFeedback('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง (QuotaExceeded)', 'error');
    }
  };`;

if (regex.test(content)) {
    content = content.replace(regex, newFunc);
    fs.writeFileSync(file, content);
    console.log('Successfully replaced handleSaveAllClinicInfo');
} else {
    console.log('Regex did not match!');
}
