import React from 'react';
import { motion } from 'motion/react';
import { Apple, Info, Droplets, Utensils, Zap, Clock, Users, Tv, Heart, TrendingUp } from 'lucide-react';

export default function GNSReference() {
  const criteria = [
    {
      id: 1,
      title: 'โปรตีน (20 คะแนน)',
      description: 'โปรตีนครบ 3 มื้อ/วัน',
      points: [
        { label: 'ครบ 3 มื้อ', value: '3 คะแนน' },
        { label: 'ครบ 2 มื้อ', value: '2 คะแนน' },
        { label: 'ครบ 1 มื้อ', value: '1 คะแนน' },
        { label: 'ไม่ครบ', value: '0 คะแนน' },
      ],
      examples: 'ไข่ 1 ฟอง, ปลา/ไก่ 40-50 กรัม, เต้าหู้ 80 กรัม',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: <Utensils className="w-5 h-5" />
    },
    {
      id: 2,
      title: 'แคลเซียมและวิตามินดี (20 คะแนน)',
      description: 'ดื่มนมตามแผน + อาหารแคลเซียมสูง',
      points: [
        { label: 'ดื่มนมตามแผน', value: '2 คะแนน' },
        { label: 'แคลเซียมจากอาหารอย่างน้อย 1 มื้อ', value: '1 คะแนน' },
      ],
      examples: 'นม/โยเกิร์ต, ปลาเล็กปลาน้อย, เต้าหู้แข็ง, งาดำ, ผักใบเขียว',
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 3,
      title: 'ผักและผลไม้ (20 คะแนน)',
      description: 'ผัก ≥ 2 มื้อ และ ผลไม้ ≥ 2 ส่วน/วัน',
      points: [
        { label: 'ผัก ≥ 2 มื้อ', value: '2 คะแนน' },
        { label: 'ผลไม้ ≥ 2 ส่วน', value: '1 คะแนน' },
      ],
      examples: '1 ส่วนผลไม้ ≈ 1 กำมือ หรือ 80-100 กรัม',
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      icon: <Apple className="w-5 h-5" />
    },
    {
      id: 4,
      title: 'คุณภาพอาหาร (20 คะแนน)',
      description: 'เริ่มต้น 3 คะแนน/วัน หักคะแนนเมื่อมีพฤติกรรมต่อไปนี้ (-1 ต่อข้อ)',
      points: [
        { label: 'น้ำอัดลม', value: '-1' },
        { label: 'ชานมหวาน', value: '-1' },
        { label: 'ขนมหวานมาก', value: '-1' },
        { label: 'อาหารทอดหลายมื้อ', value: '-1' },
        { label: 'อาหารแปรรูป', value: '-1' },
      ],
      examples: 'ควรเลี่ยงอาหารที่มีน้ำตาลและไขมันทรานส์สูง',
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: <Utensils className="w-5 h-5" />
    },
    {
      id: 5,
      title: 'น้ำดื่มและความสม่ำเสมอ (20 คะแนน)',
      description: 'ดื่มน้ำเพียงพอ + กินอาหารตรงเวลา',
      points: [
        { label: 'ดื่มน้ำเพียงพอ', value: '2 คะแนน' },
        { label: 'กินอาหารตรงเวลา', value: '1 คะแนน' },
      ],
      examples: '6-8 ปี: 1.0-1.2L, 9-11 ปี: 1.2-1.6L, 12-15 ปี: 1.5-2.0L',
      color: 'bg-sky-50 text-sky-700 border-sky-100',
      icon: <Droplets className="w-5 h-5" />
    }
  ];

  const behaviorCriteria = [
    { title: 'เคี้ยวอาหารสองข้าง', icon: <Utensils className="w-4 h-4" />, points: '1 คะแนน' },
    { title: 'เคี้ยวช้าและละเอียด', icon: <Clock className="w-4 h-4" />, points: '1 คะแนน' },
    { title: 'นั่งกินโดยไม่ดูหน้าจอ', icon: <Tv className="w-4 h-4" />, points: '1 คะแนน' },
    { title: 'ดื่มน้ำเปล่าแทนน้ำหวาน', icon: <Droplets className="w-4 h-4" />, points: '1 คะแนน' },
    { title: 'กินพร้อมครอบครัวอย่างน้อย 1 มื้อ', icon: <Users className="w-4 h-4" />, points: '1 คะแนน' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-emerald-100 rounded-xl">
          <Info className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">เกณฑ์การประเมิน GNS (Reference Only)</h2>
          <p className="text-sm text-slate-500 font-medium italic">"กินดีวันนี้ เพื่อการเติบโตที่ดีที่สุดในอนาคต"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {criteria.map((item) => (
          <div key={item.id} className={`p-6 rounded-3xl border ${item.color} space-y-4 shadow-sm h-auto`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/50 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <h3 className="font-bold text-sm leading-tight pt-0.5">{item.title}</h3>
            </div>
            
            <p className="text-xs font-medium opacity-80 leading-relaxed">{item.description}</p>
            
            <div className="space-y-2 bg-white/40 p-3 rounded-2xl border border-white/50">
              {item.points.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="font-bold opacity-70">{p.label}</span>
                  <span className="font-black">{p.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1">ตัวอย่าง/แหล่งอาหาร:</span>
              <p className="text-[11px] font-medium leading-relaxed">{item.examples}</p>
            </div>
          </div>
        ))}

        {/* Eating Behavior Section */}
        <div className="p-6 rounded-3xl bg-rose-50 text-rose-700 border border-rose-100 space-y-4 shadow-sm h-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/50 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm leading-tight pt-0.5">Eating Behavior (5 คะแนน)</h3>
          </div>
          
          <p className="text-xs font-medium opacity-80">พฤติกรรมการกินเพิ่มเติม (+1 คะแนนต่อข้อ)</p>
          
          <div className="space-y-2 bg-white/40 p-3 rounded-2xl border border-white/50">
            {behaviorCriteria.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                <div className="w-5 h-5 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <span className="font-bold opacity-70 flex-1">{b.title}</span>
                <span className="font-black">{b.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>การสรุปคะแนนประจำสัปดาห์</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500">90 - 100</span>
              <span className="font-black text-emerald-600">Excellent Growth Nutrition 🌟</span>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500">80 - 89</span>
              <span className="font-black text-blue-600">Very Good ✅</span>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500">70 - 79</span>
              <span className="font-black text-amber-600">Good 😊</span>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500">60 - 69</span>
              <span className="font-black text-orange-600">Needs Improvement ⚠️</span>
            </div>
          </div>
          <div className="text-center md:text-left space-y-2">
            <p className="text-[11px] text-slate-500 font-medium">สูตรการคิดคะแนนรายสัปดาห์:</p>
            <div className="bg-emerald-600 text-white p-4 rounded-2xl font-black text-sm inline-block shadow-md">
              (คะแนนรวมรายวัน 7 วัน + 105) × 100 ÷ 210
            </div>
            <p className="text-[10px] text-slate-400 italic mt-2">* คะแนน GNS เป็นเครื่องมือประเมินพฤติกรรม ไม่ใช่การวินิจฉัยโรค</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
