const fs = require('fs');
let code = fs.readFileSync('src/components/ExerciseTracker.tsx', 'utf8');
code = code.replace(/\{\/\* Render Active Tab Content \*\/\}[\s\S]*?<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">/, 
`{/* Render Active Tab Content */}
      <OriginalReferenceModal
        isOpen={showOriginalRef}
        onClose={() => setShowOriginalRef(false)}
        title="ข้อมูลต้นฉบับ: แบบประเมินการออกกำลังกาย"
        imageSrc="/assets/images/exercise_movement.jpg"
      />
      {activeTab === 'assessment' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">`);
fs.writeFileSync('src/components/ExerciseTracker.tsx', code);
