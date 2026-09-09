import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\s*activeTab === 'ติดตามการรักษา'.*?\}\s*\)\s*\}/s;

const newTreatmentBlock = `{activeTab === 'ติดตามการรักษา' && !isPatient && (
            activeModule === 'records' ? (
              <div className="space-y-4">
                <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  ← ย้อนกลับ
                </button>
                <TreatmentRecords 
                  patients={scopedPatients}
                  logs={scopedLogs}
                  onAddLog={handleAddLog}
                  onDeleteLog={handleDeleteLog}
                  selectedPatientId={selectedPatientId}
                  onSelectPatient={setSelectedPatientId}
                />
              </div>
            ) : activeModule === 'ef' ? (
              <ExerciseTrainer 
                patients={scopedPatients}
                patientId={selectedPatientId || 'demo'} 
                onBack={() => setActiveModule(null)}
                userRole={userRole}
              />
            ) : activeModule === 'gns' ? (
              <div className="space-y-4">
                <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  ← ย้อนกลับ
                </button>
                <GrowthNutritionScore 
                  patients={scopedPatients}
                  selectedPatientId={selectedPatientId}
                  onUpdatePatientNutrition={(patientId, log) => {
                    const patient = patients.find(p => p.id === patientId);
                    if (patient) {
                      const updatedLogs = [...(patient.nutritionLogs || []), log];
                      const updatedPatient = { ...patient, nutritionLogs: updatedLogs };
                      handleEditPatient(updatedPatient);
                    }
                  }}
                />
              </div>
            ) : activeModule === 'beforeafter' ? (
              <BeforeAfter onBack={() => setActiveModule(null)} />
            ) : activeModule === 'progress' ? (
              <HomeworkProgress 
                onBack={() => setActiveModule(null)}
                patientId={selectedPatientId || 'demo'}
              />
            ) : (
              <ModuleSkeleton 
                title="การติดตามการรักษา" 
                icon={ClipboardList}
                sections={[
                  { id: 'records', title: 'ประวัติทางคลินิก', description: 'บันทึกการรักษาที่คลินิก', items: ['Session Logs', 'Clinical Notes'] },
                  { id: 'ef', title: 'EF / OMT', description: 'แบบฝึกกล้ามเนื้อและสมอง', items: ['Myofunctional Therapy', 'วิดีโอสาธิต'] },
                  { id: 'progress', title: 'การบ้านและ Progress', description: 'ติดตามการฝึกที่บ้าน', items: ['การบ้านรายสัปดาห์', 'กราฟพัฒนาการ'] },
                  { id: 'beforeafter', title: 'Before / After', description: 'เปรียบเทียบพัฒนาการทางกายภาพ', items: ['ภาพใบหน้า', 'ช่องปาก'] },
                  { id: 'gns', title: 'GNS โภชนาการ', description: 'บันทึกโภชนาการและการเติบโต', items: ['บันทึกมื้ออาหาร', 'กราฟน้ำหนัก/ส่วนสูง'] }
                ]}
                onActivate={(id) => {
                  setActiveModule(id);
                }}
              />
            )
          )}`;

const updatedContent = content.replace(regex, newTreatmentBlock);
fs.writeFileSync('src/App.tsx', updatedContent, 'utf8');
