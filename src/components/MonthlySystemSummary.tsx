import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Sparkles, 
  BarChart2, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Users, 
  CheckCircle2, 
  Clock, 
  Baby, 
  Info,
  Layers,
  Inbox
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Patient } from '../types';
import { 
  calculateTimeframeSeriesData, 
  calculateAgeSummary, 
  calculateActivityStatusDonut,
  formatYearMonthThai,
  getAvailableMonthsList,
  getCurrentYearMonth
} from '../utils/systemSummaryCalculations';

interface MonthlySystemSummaryProps {
  patients: Patient[];
}

type TimeframeOption = '1M' | '3M' | '6M' | '12M';

export default function MonthlySystemSummary({ patients }: MonthlySystemSummaryProps) {
  // Timeframe selector state (default 6 months)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('6M');
  const [selectedMonthForSingle, setSelectedMonthForSingle] = useState<string>(getCurrentYearMonth());
  
  // Selected month detail state for Graph 2 bar click
  const [selectedBarMonth, setSelectedBarMonth] = useState<string | null>(null);

  const monthsCount = useMemo(() => {
    switch (timeframe) {
      case '1M': return 1;
      case '3M': return 3;
      case '6M': return 6;
      case '12M': return 12;
      default: return 6;
    }
  }, [timeframe]);

  // Available month dropdown options
  const monthOptions = useMemo(() => {
    return getAvailableMonthsList(patients);
  }, [patients]);

  // Main timeframe data calculation
  const seriesData = useMemo(() => {
    if (timeframe === '1M') {
      // Calculate single month series or recent months ending at selected month
      return calculateTimeframeSeriesData(patients, 1);
    }
    return calculateTimeframeSeriesData(patients, monthsCount);
  }, [patients, timeframe, monthsCount]);

  // Activity Status Donut data
  const activityDonutData = useMemo(() => {
    return calculateActivityStatusDonut(patients);
  }, [patients]);

  // Age Summary Data
  const ageSummary = useMemo(() => {
    return calculateAgeSummary(patients);
  }, [patients]);

  const ageDonutData = useMemo(() => {
    return [
      { name: 'เด็กเล็ก (อายุ 1–6 ปี)', value: ageSummary.youngKidsCount, percent: ageSummary.youngKidsPercent, color: '#8B5CF6' },
      { name: 'เด็กโต (อายุ 7–18 ปี)', value: ageSummary.olderKidsCount, percent: ageSummary.olderKidsPercent, color: '#6366F1' }
    ];
  }, [ageSummary]);

  // Selected Bar detail item for Graph 2
  const barDetailItem = useMemo(() => {
    if (!selectedBarMonth) return seriesData[seriesData.length - 1] || null;
    return seriesData.find(s => s.yearMonth === selectedBarMonth) || seriesData[seriesData.length - 1] || null;
  }, [selectedBarMonth, seriesData]);

  const hasData = patients.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 text-left max-w-7xl mx-auto pb-12"
    >
      {/* 1. HEADER SECTION (Section 3 Requirement) */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-0.5 rounded-full text-xs font-black tracking-wide border border-purple-200 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Analytics & System Trends
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#252536] leading-tight flex items-center gap-2">
              <span>📊 สรุปยอดรวมระบบ</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              วิเคราะห์สถิติการใช้งาน Growth Lab รายเดือน
            </p>
          </div>

          {/* TIMEFRAME SELECTOR (เดือน | 3 เดือน | 6 เดือน | 12 เดือน) */}
          <div className="shrink-0 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ช่วงเวลาในการวิเคราะห์
            </label>
            <div className="inline-flex items-center p-1 bg-purple-50 rounded-2xl border border-purple-200/80 shadow-2xs">
              <button
                onClick={() => setTimeframe('1M')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  timeframe === '1M'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-800 hover:bg-purple-100/70'
                }`}
              >
                1 เดือน
              </button>
              <button
                onClick={() => setTimeframe('3M')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  timeframe === '3M'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-800 hover:bg-purple-100/70'
                }`}
              >
                3 เดือน
              </button>
              <button
                onClick={() => setTimeframe('6M')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  timeframe === '6M'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-800 hover:bg-purple-100/70'
                }`}
              >
                6 เดือน
              </button>
              <button
                onClick={() => setTimeframe('12M')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  timeframe === '12M'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-800 hover:bg-purple-100/70'
                }`}
              >
                12 เดือน
              </button>
            </div>
          </div>
        </div>

        {/* Selected Timeframe Status Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-3.5 rounded-2xl border border-purple-100 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-bold text-slate-700">
              ช่วงเวลารายงาน: <span className="text-purple-900 font-black">{timeframe === '1M' ? '1 เดือนล่าสุด' : `ย้อนหลัง ${monthsCount} เดือน`}</span>
            </span>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-white px-3 py-0.5 rounded-xl border border-purple-200 hidden sm:inline-block">
            ข้อมูลจริงจาก Data Layer
          </span>
        </div>
      </section>

      {!hasData ? (
        /* Section 10: Empty State Rule */
        <div className="bg-white rounded-3xl p-12 border border-purple-200/80 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600">
            <Inbox className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-800">ยังไม่มีข้อมูลในช่วงเวลานี้</h2>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            กราฟและสถิติจะถูกสร้างขึ้นโดยอัตโนมัติเมื่อมีการลงทะเบียนหรือ Check-in ในระบบ
          </p>
        </div>
      ) : (
        /* GRAPHS CONTAINER */
        <div className="space-y-6">

          {/* 2. GRAPH 1 — แนวโน้มผู้ใช้งาน (User Trend) */}
          <section className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#252536] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span>แนวโน้มผู้ใช้งานรายเดือน (User Growth & Activity Trend)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  แสดงเปรียบเทียบผู้ใช้งานทั้งหมด, ผู้ใช้ใหม่ และผู้ที่กลับมาเช็กอินในแต่ละเดือน
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seriesData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', borderColor: '#DDD6FE', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any, name: any) => [
                      `${value} คน`,
                      name === 'totalUsers' ? 'ผู้ใช้งานทั้งหมด' : name === 'newUsers' ? 'ผู้ใช้ใหม่' : 'ผู้ที่กลับมาใช้งาน'
                    ]}
                    labelFormatter={(label) => `เดือน: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }}
                    formatter={(value) => value === 'totalUsers' ? 'ผู้ใช้งานทั้งหมด' : value === 'newUsers' ? 'ผู้ใช้ใหม่' : 'ผู้ที่กลับมาใช้งาน'}
                  />
                  <Area type="monotone" dataKey="totalUsers" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="newUsers" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNew)" />
                  <Area type="monotone" dataKey="returningUsers" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReturning)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 3. GRAPH 2 — CHECK-IN (Monthly Check-in Bar Chart with Click Detail) */}
          <section className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#252536] flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-600" />
                  <span>จำนวน Check-in รายเดือน (Monthly Check-ins)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  คลิกที่แท่งกราฟของเดือนใดเพื่อดูรายละเอียดสรุปของเดือนนั้น
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 shrink-0">
                คลิกที่แท่งกราฟเพื่อดูรายละเอียด
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seriesData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', borderColor: '#DDD6FE', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} ครั้ง`, 'จำนวน Check-in']}
                    labelFormatter={(label) => `เดือน: ${label}`}
                  />
                  <Bar 
                    dataKey="checkIns" 
                    fill="#8B5CF6" 
                    radius={[10, 10, 0, 0]}
                    onClick={(data: any) => {
                      if (data && data.yearMonth) {
                        setSelectedBarMonth(data.yearMonth);
                      }
                    }}
                    cursor="pointer"
                  >
                    {seriesData.map((entry) => (
                      <Cell 
                        key={entry.yearMonth} 
                        fill={selectedBarMonth === entry.yearMonth ? '#6D28D9' : '#8B5CF6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Clicked Month Detail Panel (No individual names) */}
            {barDetailItem && (
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4.5 h-4.5 text-purple-600 shrink-0" />
                  <span className="font-bold text-slate-800">
                    รายละเอียดเดือน <span className="text-purple-900 font-black">{barDetailItem.fullLabel}</span>:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-slate-700 font-medium">
                  <span>Check-in รวม: <strong className="text-purple-900 font-black text-sm">{barDetailItem.checkIns}</strong> ครั้ง</span>
                  <span>•</span>
                  <span>ผู้กลับมาเช็กอิน: <strong className="text-purple-900 font-black text-sm">{barDetailItem.returningUsers}</strong> คน</span>
                  <span>•</span>
                  <span>ผู้ใช้ใหม่: <strong className="text-indigo-900 font-black text-sm">{barDetailItem.newUsers}</strong> คน</span>
                </div>
              </div>
            )}
          </section>

          {/* 4. GRAPH 3 & GRAPH 4 (2 COLUMNS: STATUS DONUT & AGE DONUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* GRAPH 3 — สถานะการใช้งาน (Donut Chart) */}
            <section className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <h3 className="text-base font-black text-[#252536] flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  <span>สถานะการใช้งาน (User Activity Status)</span>
                </h3>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {activityDonutData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', borderColor: '#E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any, name: any, item: any) => [
                        `${value} คน (${item.payload.percent}%)`,
                        item.payload.name
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Percentages Breakdown List */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {activityDonutData.map((item) => (
                  <div key={item.key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-black text-slate-900 shrink-0 ml-1">
                      {item.value} คน ({item.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* GRAPH 4 — ช่วงอายุ (Donut Chart / Bar Breakdown) */}
            <section className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <h3 className="text-base font-black text-[#252536] flex items-center gap-2">
                  <Baby className="w-5 h-5 text-purple-600" />
                  <span>สัดส่วนตามช่วงอายุ (Age Demographic)</span>
                </h3>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ageDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {ageDonutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', borderColor: '#E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any, name: any, item: any) => [
                        `${value} คน (${item.payload.percent}%)`,
                        item.payload.name
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Age Demographic Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 space-y-1">
                  <span className="font-extrabold text-purple-900 block">เด็กเล็ก (อายุ 1–6 ปี)</span>
                  <span className="text-xl font-black text-purple-950 block">{ageSummary.youngKidsCount} คน</span>
                  <span className="text-[11px] font-bold text-purple-700 block">คิดเป็น {ageSummary.youngKidsPercent}%</span>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-1">
                  <span className="font-extrabold text-indigo-900 block">เด็กโต (อายุ 7–18 ปี)</span>
                  <span className="text-xl font-black text-indigo-950 block">{ageSummary.olderKidsCount} คน</span>
                  <span className="text-[11px] font-bold text-indigo-700 block">คิดเป็น {ageSummary.olderKidsPercent}%</span>
                </div>
              </div>
            </section>
          </div>

          {/* 5. GRAPH 5 — MONTHLY OVERVIEW (Grouped Comparison Chart) */}
          <section className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#252536] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <span>ภาพรวมการใช้งานรายเดือน (Grouped Monthly Comparison)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  เปรียบเทียบสัดส่วน: จำนวนผู้ใช้ทั้งหมด, จำนวนผู้ใช้ใหม่ และจำนวน Check-in ในแต่ละเดือน
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seriesData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', borderColor: '#DDD6FE', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any, name: any) => [
                      name === 'checkIns' ? `${value} ครั้ง` : `${value} คน`,
                      name === 'totalUsers' ? 'จำนวนผู้ใช้ทั้งหมด' : name === 'newUsers' ? 'จำนวนผู้ใช้ใหม่' : 'จำนวน Check-in'
                    ]}
                    labelFormatter={(label) => `เดือน: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }}
                    formatter={(value) => value === 'totalUsers' ? 'จำนวนผู้ใช้ทั้งหมด' : value === 'newUsers' ? 'จำนวนผู้ใช้ใหม่' : 'จำนวน Check-in'}
                  />
                  <Bar dataKey="totalUsers" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="newUsers" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="checkIns" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 6. MONTHLY SUMMARY TABLE (Section 9 Requirement) */}
          <section className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="text-base font-black text-[#252536] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>ตารางสรุปข้อมูลรายเดือน (Monthly Summary Table)</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                ตรวจสอบตัวเลขจากกราฟ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-50/80 text-purple-900 border-b border-purple-100 font-extrabold text-[11px]">
                    <th className="py-3 px-4 rounded-l-xl">เดือน</th>
                    <th className="py-3 px-4 text-center">ผู้ใช้งาน</th>
                    <th className="py-3 px-4 text-center">ผู้ใช้ใหม่</th>
                    <th className="py-3 px-4 text-center">Check-in</th>
                    <th className="py-3 px-4 text-center text-emerald-700">สม่ำเสมอ (&le;30d)</th>
                    <th className="py-3 px-4 text-center text-amber-700">ขาดช่วง (31–90d)</th>
                    <th className="py-3 px-4 text-center text-rose-700 rounded-r-xl">Inactive (&gt;90d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/60 font-medium text-slate-700">
                  {seriesData.map((row) => (
                    <tr key={row.yearMonth} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{row.fullLabel}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-900">{row.totalUsers} คน</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-900">{row.newUsers} คน</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-900">{row.checkIns} ครั้ง</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">{row.activeCount} คน</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700">{row.atRiskCount + row.dormantCount} คน</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">{row.inactiveCount} คน</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      )}
    </motion.div>
  );
}
