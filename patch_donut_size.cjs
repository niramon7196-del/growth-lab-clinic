const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Grid
content = content.replace(
    'lg:grid-cols-5 gap-2.5 sm:gap-3',
    'lg:grid-cols-6 gap-2.5 sm:gap-4'
);

// 2. Donut Card
const oldDonut = `<div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between group">
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
          </div>`;

const newDonut = `<div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-slate-500" />
                สถานะการบ้านวันนี้
              </span>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6 justify-center sm:justify-start">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 filter drop-shadow-sm">
                  {/* Background ring */}
                  <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="7" />
                  
                  {/* Green segment (Completed) */}
                  {stats.donut.greenPct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" strokeWidth="7" 
                      strokeDasharray={\`\${stats.donut.greenPct} \${100 - stats.donut.greenPct}\`} 
                      strokeDashoffset="100" />
                  )}
                  
                  {/* Amber segment (Checked In) */}
                  {stats.donut.amberPct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" strokeWidth="7" 
                      strokeDasharray={\`\${stats.donut.amberPct} \${100 - stats.donut.amberPct}\`} 
                      strokeDashoffset={\`\${100 - stats.donut.greenPct}\`} />
                  )}

                  {/* Blue segment (Pending) */}
                  {stats.donut.bluePct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="7" 
                      strokeDasharray={\`\${stats.donut.bluePct} \${100 - stats.donut.bluePct}\`} 
                      strokeDashoffset={\`\${100 - stats.donut.greenPct - stats.donut.amberPct}\`} />
                  )}

                  {/* Red segment (Urgent) */}
                  {stats.donut.redPct > 0 && (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f43f5e" strokeWidth="7" 
                      strokeDasharray={\`\${stats.donut.redPct} \${100 - stats.donut.redPct}\`} 
                      strokeDashoffset={\`\${100 - stats.donut.greenPct - stats.donut.amberPct - stats.donut.bluePct}\`} />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-800 leading-none">{stats.completionRate}%</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">ทำสำเร็จ</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 sm:gap-2 justify-center flex-1 py-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div><span className="text-slate-600 font-semibold">ทำแล้ว</span></div>
                  <span className="font-black text-slate-900">{stats.completedToday} <span className="text-[10px] font-medium text-slate-400 ml-0.5">คน</span></span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></div><span className="text-slate-600 font-semibold">เช็กอิน</span></div>
                  <span className="font-black text-slate-900">{stats.checkedInOnlyToday} <span className="text-[10px] font-medium text-slate-400 ml-0.5">คน</span></span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div><span className="text-slate-600 font-semibold">รอทำ</span></div>
                  <span className="font-black text-slate-900">{stats.pendingCases} <span className="text-[10px] font-medium text-slate-400 ml-0.5">คน</span></span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></div><span className="text-slate-600 font-semibold">ขาดหาย</span></div>
                  <span className="font-black text-slate-900">{stats.urgentCases} <span className="text-[10px] font-medium text-slate-400 ml-0.5">คน</span></span>
                </div>
              </div>
            </div>
          </div>`;

content = content.replace(oldDonut, newDonut);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Patched donut size');
