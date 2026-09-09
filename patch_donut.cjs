const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const oldStats = `  const stats = useMemo(() => {
    const total = patients.length;
    const completedToday = patientOperationalList.filter(item => item.isDoneToday).length;
    const checkedInToday = patientOperationalList.filter(item => item.isCheckedInToday).length;
    const urgentCases = patientOperationalList.filter(item => item.isUrgent).length;
    const todayAppointments = appointments.filter(a => a.date === todayStr).length;

    const completionRate = total > 0 ? Math.round((completedToday / total) * 100) : 0;

    return {
      total,
      completedToday,
      checkedInToday,
      urgentCases,
      todayAppointments,
      completionRate
    };
  }, [patients, patientOperationalList, appointments, todayStr]);`;

const newStats = `  const stats = useMemo(() => {
    const total = patients.length;
    const completedToday = patientOperationalList.filter(item => item.isDoneToday).length;
    const checkedInOnlyToday = patientOperationalList.filter(item => item.isCheckedInToday && !item.isDoneToday).length;
    const checkedInToday = patientOperationalList.filter(item => item.isCheckedInToday).length;
    const urgentCases = patientOperationalList.filter(item => item.isUrgent).length;
    const pendingCases = Math.max(0, total - completedToday - checkedInOnlyToday - urgentCases);
    const todayAppointments = appointments.filter(a => a.date === todayStr).length;

    const completionRate = total > 0 ? Math.round((completedToday / total) * 100) : 0;

    const greenPct = total > 0 ? (completedToday / total) * 100 : 0;
    const amberPct = total > 0 ? (checkedInOnlyToday / total) * 100 : 0;
    const bluePct = total > 0 ? (pendingCases / total) * 100 : 0;
    const redPct = total > 0 ? (urgentCases / total) * 100 : 0;

    return {
      total,
      completedToday,
      checkedInOnlyToday,
      checkedInToday,
      urgentCases,
      pendingCases,
      todayAppointments,
      completionRate,
      donut: { greenPct, amberPct, bluePct, redPct }
    };
  }, [patients, patientOperationalList, appointments, todayStr]);`;

content = content.replace(oldStats, newStats);

const oldGrid = `{/* 2. STATS 4 CARDS (Perfect Fit-to-Container Grid) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full">`;

const newGrid = `{/* 2. STATS 5 CARDS (Perfect Fit-to-Container Grid) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full">`;

content = content.replace(oldGrid, newGrid);

// Find Card 2 and insert the Donut card before it
const oldCard2 = `          {/* Card 2: Completed Today */}`;

const donutCard = `          {/* Card Donut: Homework Status */}
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                <PieChart className="w-3 h-3 text-slate-500" />
                สถานะการบ้าน
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                  {/* Background ring */}
                  <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                  
                  {/* Green segment (Completed) */}
                  {stats.donut.greenPct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" strokeWidth="6" 
                      strokeDasharray={\`\${stats.donut.greenPct} \${100 - stats.donut.greenPct}\`} 
                      strokeDashoffset="100" />
                  )}
                  
                  {/* Amber segment (Checked In) */}
                  {stats.donut.amberPct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" strokeWidth="6" 
                      strokeDasharray={\`\${stats.donut.amberPct} \${100 - stats.donut.amberPct}\`} 
                      strokeDashoffset={\`\${100 - stats.donut.greenPct}\`} />
                  )}

                  {/* Blue segment (Pending) */}
                  {stats.donut.bluePct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="6" 
                      strokeDasharray={\`\${stats.donut.bluePct} \${100 - stats.donut.bluePct}\`} 
                      strokeDashoffset={\`\${100 - stats.donut.greenPct - stats.donut.amberPct}\`} />
                  )}

                  {/* Red segment (Urgent) */}
                  {stats.donut.redPct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f43f5e" strokeWidth="6" 
                      strokeDasharray={\`\${stats.donut.redPct} \${100 - stats.donut.redPct}\`} 
                      strokeDashoffset={\`\${100 - stats.donut.greenPct - stats.donut.amberPct - stats.donut.bluePct}\`} />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-[11px] font-black text-slate-800 leading-none">{stats.completionRate}%</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-0.5 justify-center flex-1">
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-slate-600">ทำแล้ว</span></div>
                  <span className="font-bold text-slate-900">{stats.completedToday}</span>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div><span className="text-slate-600">เช็กอิน</span></div>
                  <span className="font-bold text-slate-900">{stats.checkedInOnlyToday}</span>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-slate-600">รอทำ</span></div>
                  <span className="font-bold text-slate-900">{stats.pendingCases}</span>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div><span className="text-slate-600">ขาดหาย</span></div>
                  <span className="font-bold text-slate-900">{stats.urgentCases}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Completed Today */}`;

content = content.replace(oldCard2, donutCard);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Patched');
