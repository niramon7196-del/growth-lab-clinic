import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ModuleSkeletonProps {
  title: string;
  icon: LucideIcon;
  sections: {
    id?: string;
    title: string;
    description: string;
    items: string[];
  }[];
  onActivate?: (id: string, title: string) => void;
}

export default function ModuleSkeleton({ title, icon: Icon, sections, onActivate }: ModuleSkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 p-4 rounded-2xl">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-dark">{title}</h1>
          <p className="text-text-dark/60 text-sm">โครงสร้างระบบสำหรับการบันทึกและติดตามข้อมูล</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm">
            <h3 className="text-lg font-bold text-text-dark mb-2">{section.title}</h3>
            <p className="text-sm text-text-dark/60 mb-4">{section.description}</p>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-secondary/10 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                  <span className="text-sm font-medium text-text-dark/80">{item}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => onActivate?.(section.id || section.title, section.title)}
              className="mt-6 w-full py-2 bg-primary/5 hover:bg-primary/10 text-primary font-bold rounded-xl transition-all text-sm border border-primary/10 cursor-pointer"
            >
              เปิดใช้งาน
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
