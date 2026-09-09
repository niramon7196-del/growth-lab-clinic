import { useState, useEffect } from 'react';
import { cloudApi, API_URL, getApiUrl } from './services/cloudApi';

const STORAGE_KEY = 'growthlab_master_data';

export function useClinicalData() {
  const [patients, setPatients] = useState<any[]>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY + '_patients') || localStorage.getItem('growthlab_patients_master');
      return local ? JSON.parse(local) : [];
    } catch (e) { return []; }
  });

  const [appointments, setAppointments] = useState<any[]>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY + '_appointments') || localStorage.getItem('growthlab_appointments_master');
      return local ? JSON.parse(local) : [];
    } catch (e) { return []; }
  });

  const [activeToasts, setActiveToasts] = useState<any[]>([]);

  const triggerToast = (title: string, message: string) => {
    const id = Date.now();
    setActiveToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const syncFromCloud = async () => {
    try {
      const res = await cloudApi.getInitialData();
      if (res.success && res.data) {
        if (res.data.patients && Array.isArray(res.data.patients)) {
          setPatients(res.data.patients);
          localStorage.setItem(STORAGE_KEY + '_patients', JSON.stringify(res.data.patients));
        }
        if (res.data.appointments && Array.isArray(res.data.appointments)) {
          setAppointments(res.data.appointments);
          localStorage.setItem(STORAGE_KEY + '_appointments', JSON.stringify(res.data.appointments));
        }
      }
    } catch (err) {
      console.warn('[Sync] Offline or pending cloud connection', err);
    }
  };

  useEffect(() => {
    syncFromCloud();
  }, []);

  const handleAddPatient = async (newPatient: any) => {
    const updated = [newPatient, ...patients.filter(p => (p.hn || p.id) !== (newPatient.hn || newPatient.id))];
    setPatients(updated);
    localStorage.setItem(STORAGE_KEY + '_patients', JSON.stringify(updated));
    triggerToast('บันทึกสำเร็จ', `เพิ่มคนไข้ ${newPatient.name || newPatient.firstName || newPatient.hn} เรียบร้อยแล้ว`);

    try {
      await cloudApi.savePatient(newPatient);
    } catch (e) {
      console.error('[Cloud] Save patient error:', e);
    }
  };

  const handleAddAppointment = async (newAppt: any) => {
    const updated = [newAppt, ...appointments.filter(a => a.id !== newAppt.id)];
    setAppointments(updated);
    localStorage.setItem(STORAGE_KEY + '_appointments', JSON.stringify(updated));
    triggerToast('บันทึกนัดหมายสำเร็จ', `สร้างนัดหมายเรียบร้อย`);

    try {
      await cloudApi.saveAppointment(newAppt);
    } catch (e) {
      console.error('[Cloud] Save appointment error:', e);
    }
  };

  return {
    patients,
    appointments,
    activeToasts,
    triggerToast,
    handleAddPatient,
    handleAddAppointment,
    syncFromCloud
  };
}

