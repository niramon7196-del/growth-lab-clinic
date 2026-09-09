import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  ChevronRight, 
  Award, 
  Smile, 
  Wind, 
  Moon, 
  Activity, 
  Dumbbell, 
  Apple, 
  Brain,
  ArrowRight,
  Info,
  HelpCircle,
  AlertTriangle,
  X,
  Clock,
  Check,
  Flame,
  Share2,
  Stethoscope,
  Lightbulb,
  Search,
  CheckCheck
} from 'lucide-react';

export interface KnowledgeCardData {
  id: string;
  categoryKey: 'ef' | 'omt' | 'breathing' | 'gns' | 'habits' | 'faq';
  number: string;
  emoji: string;
  categoryLabel: string;
  title: string;
  subtitle: string;
  themeColor: {
    gradient: string;
    bgLight: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconText: string;
    accent: string;
  };
  summaryPoints: string[];
  popupDetail: {
    quickBadge: string;
    overview: string;
    quickSummary30s: string[];
    visualInfographicSteps?: Array<{
      stepNumber: string;
      title: string;
      description: string;
      iconEmoji: string;
      highlight?: string;
    }>;
    dosAndDonts?: {
      dos: string[];
      donts: string[];
    };
    faqList?: Array<{
      question: string;
      answer: string;
    }>;
    clinicalNote: string;
    checklistItems: string[];
  };
}

export const KNOWLEDGE_CARDS: KnowledgeCardData[] = [
  {
    id: 'k_ef_trainer',
    categoryKey: 'ef',
    number: '01',
    emoji: '🦷',
    categoryLabel: 'อุปกรณ์ EF Trainer',
    title: 'คู่มือใส่อุปกรณ์ EF Trainer',
    subtitle: 'เทคนิคการสวมใส่ ทำความสะอาด และวิธีใส่ไม่ให้หลุดตอนนอน',
    themeColor: {
      gradient: 'from-sky-500 via-blue-600 to-indigo-700',
      bgLight: 'bg-sky-50/70 hover:bg-sky-50/90',
      border: 'border-sky-200 hover:border-sky-400',
      text: 'text-sky-950',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      badgeText: 'text-sky-800',
      iconBg: 'bg-sky-600 text-white',
      iconText: 'text-sky-700',
      accent: 'bg-sky-600 hover:bg-sky-700 text-white'
    },
    summaryPoints: [
      'วิธีใส่ที่ถูกต้อง: ร่องฟันสบพอดี วางลิ้นบนปุ่ม Tongue Tag และปิดปากสนิท',
      'วิธีล้างทำความสะอาด: ล้างน้ำสะอาด/สบู่อ่อน ห้ามใช้น้ำร้อนลวกเด็ดขาด',
      'ใส่อย่างไรไม่ให้หลุดตอนนอน: ฝึกใส่ตอนกลางวัน 1-2 ชม. สร้างความคุ้นเคย'
    ],
    popupDetail: {
      quickBadge: '⚡ สรุปเข้าใจใน 30 วินาที • คู่มือ EF Trainer',
      overview: 'อุปกรณ์ EF Trainer ออกแบบมาเพื่อปรับการทำงานของกล้ามเนื้อรอบช่องปาก และนำทางขากรรไกรให้อยู่ในตำแหน่งที่เหมาะสมตามธรรมชาติ',
      quickSummary30s: [
        'วางลิ้นบนปุ่มยกเพดาน (Tongue Tag) ด้านบนของอุปกรณ์เสมอ',
        'สบฟันลงในร่องทั้งฟันบนและฟันล่างเบาๆ โดยไม่ขบเคี้ยว',
        'ปิดริมฝีปากให้สนิทตลอดเวลา หายใจเข้า-ออกทางจมูก 100%'
      ],
      visualInfographicSteps: [
        {
          stepNumber: '1',
          title: 'จับทิศทางอุปกรณ์ให้ถูกด้าน',
          description: 'หงายปุ่ม Tongue Tag (จุดนูนสำหรับลิ้น) ให้อยู่ด้านบนหันเข้าหาเพดานปาก',
          iconEmoji: '🔍',
          highlight: 'ปุ่มลิ้นชี้ขึ้นด้านบน'
        },
        {
          stepNumber: '2',
          title: 'สวมเข้าช่องปากเบาๆ',
          description: 'วางฟันหน้าบนและล่างลงในร่องยาง ปิดริมฝีปากสนิท ไม่กัดเคี้ยวเล่น',
          iconEmoji: '👄',
          highlight: 'สบฟันนุ่มนวล ห้ามเคี้ยว'
        },
        {
          stepNumber: '3',
          title: 'เทคนิคแก้หลุดตอนนอน',
          description: 'ใส่ตอนทำการบ้านหรือดูทีวีตอนกลางวัน 1-2 ชม. กล้ามเนื้อจะจำและไม่หลุดยามค่ำคืน',
          iconEmoji: '🌙',
          highlight: 'ฝึกกลางวัน = หลับกลางคืนไม่หลุด'
        }
      ],
      dosAndDonts: {
        dos: [
          'ล้างด้วยน้ำอุณหภูมิห้องหรือน้ำสบู่อ่อนๆ หลังใช้งานทุกครั้ง',
          'เก็บในกล่องระบายอากาศที่แห้งสะอาด',
          'แปรงฟันให้สะอาดก่อนใส่อุปกรณ์เข้านอน'
        ],
        donts: [
          'ห้ามต้มหรือลวกด้วยน้ำร้อน เพราะจะทำให้ซิลิโคนเสียรูปทรง',
          'ห้ามใช้ยาสีฟันขัดถูแรงๆ เพราะจะทำให้ผิวอุปกรณ์เป็นรอยสะสมเชื้อโรค',
          'ห้ามกัดหรือเคี้ยวเล่นขณะใส่อุปกรณ์'
        ]
      },
      clinicalNote: 'ข้อแนะนำจากทันตแพทย์: หากช่วง 2-3 วันแรกมีน้ำลายไหลมากกว่าปกติหรือรู้สึกตึงฟัน ถือเป็นปฏิกิริยาการปรับตัวตามธรรมชาติของร่างกาย',
      checklistItems: [
        'ตรวจดูปุ่ม Tongue Tag อยู่ด้านบน',
        'ริมฝีปากปิดสนิท หายใจทางจมูก',
        'ล้างน้ำสะอาดและผึ่งแห้งในกล่องทุกเช้า'
      ]
    }
  },
  {
    id: 'k_omt_muscles',
    categoryKey: 'omt',
    number: '02',
    emoji: '👅',
    categoryLabel: 'พลังกล้ามเนื้อปาก & ลิ้น (OMT)',
    title: 'พลังกล้ามเนื้อปาก & ลิ้น (OMT)',
    subtitle: 'เทคนิคตำแหน่งลิ้นแตะเพดาน The Spot, ฝึกปิดปากสนิท และกลืนไม่ดุนฟัน',
    themeColor: {
      gradient: 'from-purple-600 via-indigo-600 to-purple-800',
      bgLight: 'bg-purple-50/70 hover:bg-purple-50/90',
      border: 'border-purple-200 hover:border-purple-400',
      text: 'text-purple-950',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      badgeText: 'text-purple-800',
      iconBg: 'bg-purple-600 text-white',
      iconText: 'text-purple-700',
      accent: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    summaryPoints: [
      'ตำแหน่งลิ้นแตะเพดาน (The Spot): แตะปุ่มกระดูกหลังฟันหน้าบนตลอดเวลา',
      'ฝึกปิดปากสนิท (Lip Seal): สร้างแรงพยุงฟันหน้า ป้องกันฟันยื่นเหยิน',
      'การกลืนไม่ดุนฟัน (Correct Swallow): กลืนด้วยแรงลิ้น คางไม่เกร็งเป็นรอยบุ๋ม'
    ],
    popupDetail: {
      quickBadge: '⚡ สรุปเข้าใจใน 30 วินาที • เคล็ดลับ OMT',
      overview: 'ลิ้นคือเฝือกจัดฟันธรรมชาติที่ทรงพลังที่สุด เมื่อลิ้นยกแนบเพดานบน จะสร้างแรงผลักช่วยขยายขากรรไกรบนให้กว้างและเปิดทางเดินหายใจ',
      quickSummary30s: [
        'The Spot: แตะปลายลิ้นที่ปุ่มเหงือกด้านหลังฟันหน้าบน (ห้ามแตะโดนตัวฟัน)',
        'Lip Seal: ริมฝีปากบนและล่างประกบสนิทเบาๆ เป็นธรรมชาติยามพัก',
        'No Chin Wrinkle: เวลาดื่มน้ำหรือกลืนอาหาร คางต้องเรียบ ไม่ย่นเป็นเปลือกส้ม'
      ],
      visualInfographicSteps: [
        {
          stepNumber: '1',
          title: 'หาจุด The Spot',
          description: 'ออกเสียง "เหนอะ" หรือ "N" ปลายลิ้นจะแตะที่ปุ่มเหงือกพอดี นั่นคือตำแหน่งพักที่ถูกต้อง',
          iconEmoji: '🎯',
          highlight: 'แตะหลังฟันหน้า ห้ามดันโดนฟัน'
        },
        {
          stepNumber: '2',
          title: 'ดูดแผ่นลิ้นแนบเพดาน (Cave Suck)',
          description: 'ดูดลิ้นทั้งหมดแนบติดเพดานปากเหมือนมีสุญญากาศ แล้วอ้าปากให้ลิ้นตึงเบาๆ',
          iconEmoji: '👅',
          highlight: 'ขยายขากรรไกรบนรูปตัว U'
        },
        {
          stepNumber: '3',
          title: 'กลืนน้ำลายแบบถูกต้อง',
          description: 'ยิ้มยิงฟันเล็กน้อย วางลิ้นที่ The Spot แล้วกลืนโดยไม่ให้ริมฝีปากขยับหรือเกร็งคาง',
          iconEmoji: '💧',
          highlight: 'ใช้แรงโคนลิ้น คางราบเรียบ'
        }
      ],
      dosAndDonts: {
        dos: [
          'ฝึกแตะลิ้นที่ The Spot ทุกครั้งที่นึกได้ เช่น ขณะอ่านหนังสือ ดูทีวี',
          'ฝึกบริหารกล้ามเนื้อ OMT ตามคลิปวันละ 5-10 นาที อย่างสม่ำเสมอ',
          'เช็กหน้ากระจกว่าคางไม่เกร็งย่นขณะกลืน'
        ],
        donts: [
          'ห้ามวางลิ้นตกอยู่ที่พื้นปากหรือสอดลิ้นระหว่างฟัน',
          'ห้ามอ้าปากหายใจหรือปล่อยริมฝีปากเผยอ',
          'ห้ามใช้ลิ้นดุนฟันเล่นขณะฟันแท้กำลังขึ้น'
        ]
      },
      clinicalNote: 'ข้อแนะนำจากทันตแพทย์: แรงกดจากลิ้นขณะกลืนมีมากถึง 500 กรัม หากกลืนผิดวิธีฟันจะล้มและยื่น การฝึก OMT จึงเป็นหัวใจสำคัญของการจัดฟันที่ยั่งยืน',
      checklistItems: [
        'ลิ้นแตะ The Spot ตลอดเวลา',
        'ริมฝีปากปิดสนิทเป็นธรรมชาติ',
        'กลืนน้ำลายโดยคางไม่ย่น'
      ]
    }
  },
  {
    id: 'k_breathing',
    categoryKey: 'breathing',
    number: '03',
    emoji: '🫁',
    categoryLabel: 'หายใจทางจมูก 100%',
    title: 'หายใจทางจมูก 100% (Nasal Power)',
    subtitle: 'ปรับโครงสร้างใบหน้าให้สมดุล หลับลึก เพิ่มออกซิเจน และลดภูมิแพ้',
    themeColor: {
      gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
      bgLight: 'bg-emerald-50/70 hover:bg-emerald-50/90',
      border: 'border-emerald-200 hover:border-emerald-400',
      text: 'text-emerald-950',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeText: 'text-emerald-800',
      iconBg: 'bg-emerald-600 text-white',
      iconText: 'text-emerald-700',
      accent: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    summaryPoints: [
      'ปรับรูปหน้าให้สวยงาม: ขากรรไกรเจริญเติบโตเต็มที่ คางไม่สั้น ไม่ถอยหลัง',
      'หลับลึกขึ้น (Deep Sleep): เพิ่มออกซิเจนเลี้ยงสมอง ตื่นมาสดชื่น สมาธิดี',
      'ลดภูมิแพ้ & ดักจับฝุ่น: โพรงจมูกกรองอากาศและผลิต Nitric Oxide ฆ่าเชื้อ'
    ],
    popupDetail: {
      quickBadge: '⚡ สรุปเข้าใจใน 30 วินาที • พลังการหายใจทางจมูก',
      overview: 'การหายใจทางจมูกคือตัวแปรหลักที่กำหนดความสวยงามของโครงสร้างใบหน้า คุณภาพการนอนหลับ และระบบภูมิคุ้มกันของเด็กตลอดช่วงการเติบโต',
      quickSummary30s: [
        'จมูกมีไว้หายใจ ปากมีไว้รับประทานอาหารและพูด',
        'การหายใจทางจมูกช่วยดึง Nitric Oxide เข้าปอด เพิ่มการดูดซึมออกซิเจน 18%',
        'ป้องกันภาวะคางถอย เพดานปากแคบ และฟันซ้อนเกได้อย่างมีประสิทธิภาพ'
      ],
      visualInfographicSteps: [
        {
          stepNumber: '1',
          title: 'ระบบกรองอากาศธรรมชาติ',
          description: 'ขนจมูกและเยื่อบุช่วยกรองฝุ่น PM2.5 ปรับอุณหภูมิและความชื้นของอากาศก่อนเข้าสู่ปอด',
          iconEmoji: '🛡️',
          highlight: 'ลดภูมิแพ้และหวัดเรื้อรัง'
        },
        {
          stepNumber: '2',
          title: 'ผลิต Nitric Oxide บำรุงสมอง',
          description: 'โพรงไซนัสจะปล่อยก๊าซ Nitric Oxide ช่วยขยายหลอดเลือดและส่งออกซิเจนไปเลี้ยงสมอง',
          iconEmoji: '🧠',
          highlight: 'สมาธิดี ตื่นเช้าสดใส'
        },
        {
          stepNumber: '3',
          title: 'รูปหน้าสมดุล (Facial Symmetry)',
          description: 'การปิดปากหายใจทางจมูกจะกระตุ้นให้ขากรรไกรบน-ล่างเติบโตมาข้างหน้าอย่างสวยงาม',
          iconEmoji: '✨',
          highlight: 'โครงหน้าคมชัด คางไม่ถอย'
        }
      ],
      dosAndDonts: {
        dos: [
          'ฝึกสูดหายใจเข้า-ออกช้าๆ ลึกๆ ทางจมูกตลอดทั้งวัน',
          'ล้างจมูกด้วยน้ำเกลือเมื่อมีน้ำมูกหรือคัดจมูก เพื่อเปิดทางเดินหายใจ',
          'นั่งหลังตรง อกผาย ไหล่ผ่อนคลายขณะหายใจ'
        ],
        donts: [
          'ห้ามนอนอ้าปาก หรือนั่งอ้าปากดูหน้าจอมือถือ/ทีวี',
          'อย่าปล่อยให้เป็นหวัดคัดจมูกเรื้อรังโดยไม่ดูแลรักษา',
          'หลีกเลี่ยงการก้มหน้าเล่นมือถือเป็นเวลานานจนทางเดินหายใจพับงอ'
        ]
      },
      clinicalNote: 'ข้อแนะนำจากทันตแพทย์: เด็กที่หายใจทางปากต่อเนื่องเกิน 6 เดือน จะเริ่มมีลักษณะ Adenoid Face (หน้ายาว ตาโรย คางถอย) การแก้ตั้งแต่เนิ่นๆ จะคืนรูปหน้าที่สวยงามได้อย่างสมบูรณ์',
      checklistItems: [
        'ปากปิดสนิทขณะทำกิจกรรมต่างๆ',
        'หายใจเงียบ ไร้เสียงฟืดฟาด',
        'ตื่นนอนเช้ามาคอไม่แห้ง'
      ]
    }
  },
  {
    id: 'k_gns_nutrition',
    categoryKey: 'gns',
    number: '04',
    emoji: '🥦',
    categoryLabel: 'โภชนาการเสริมความสูง (GNS)',
    title: 'โภชนาการเสริมการเติบโต (GNS)',
    subtitle: 'แคลเซียมเพิ่มมวลกระดูก โปรตีนเสริมความสูง และงดหวานหลัง 2 ทุ่ม',
    themeColor: {
      gradient: 'from-amber-500 via-orange-500 to-amber-700',
      bgLight: 'bg-amber-50/70 hover:bg-amber-50/90',
      border: 'border-amber-200 hover:border-amber-400',
      text: 'text-amber-950',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeText: 'text-amber-800',
      iconBg: 'bg-amber-500 text-slate-950 font-black',
      iconText: 'text-amber-800',
      accent: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
    },
    summaryPoints: [
      'แคลเซียม & D3/K2: ดื่มนม ทานปลาเล็กปลาน้อย งาดำ เสริมความหนาแน่นกระดูก',
      'โปรตีนเสริมความสูง: ไข่วันละ 1-2 ฟอง เนื้อสัตว์ไม่ติดมัน สร้างเซลล์กระดูกอ่อน',
      'งดหวานหลัง 2 ทุ่ม: น้ำตาลกระตุ้นอินซูลินซึ่งไปบล็อกการหลั่ง Growth Hormone'
    ],
    popupDetail: {
      quickBadge: '⚡ สรุปเข้าใจใน 30 วินาที • หลักโภชนาการ GNS',
      overview: 'การเติบโตของกระดูกและความสูงต้องอาศัย 3 องค์ประกอบหลัก: วัตถุดิบสร้างกระดูก (แคลเซียม+โปรตีน), แรงเคี้ยวกระตุ้นเซลล์, และฮอร์โมนการเจริญเติบโต',
      quickSummary30s: [
        'กินอาหารที่มีแรงต้านเคี้ยว (Fiber/Crunchy) เพื่อกระตุ้นกระดูกขากรรไกร',
        'เสริมโปรตีน 1.2-1.5 กรัม ต่อน้ำหนักตัว 1 กก. เพื่อสร้างข้อต่อกระดูก',
        'หลีกเลี่ยงขนมหวานและน้ำอัดลมช่วงค่ำ เพื่อเปิดทางให้ Growth Hormone หลั่งสูงสุด'
      ],
      visualInfographicSteps: [
        {
          stepNumber: '1',
          title: 'สามประสานกระดูกแข็งแรง',
          description: 'แคลเซียม (สร้างเนื้อกระดูก) + วิตามิน D3 (ช่วยดูดซึม) + วิตามิน K2 (ดึงแคลเซียมเข้ากระดูก)',
          iconEmoji: '🥛',
          highlight: 'นมสด, ปลาตัวเล็ก, ไข่แดง'
        },
        {
          stepNumber: '2',
          title: 'แรงเคี้ยวกระตุ้นขากรรไกร (Chewing Power)',
          description: 'การเคี้ยวอาหารกรอบสด เช่น ฝรั่ง แอปเปิ้ล แครอท ส่งสัญญาณขยายกระดูกใบหน้า',
          iconEmoji: '🍎',
          highlight: 'เคี้ยวละเอียดทั้งสองข้าง'
        },
        {
          stepNumber: '3',
          title: 'กฎทองหลัง 2 ทุ่ม',
          description: 'งดขนมหวาน ขนมขบเคี้ยว นมหวาน ก่อนนอน 2 ชั่วโมง เพื่อให้อินซูลินลดต่ำยามหลับลึก',
          iconEmoji: '🌙',
          highlight: 'Growth Hormone หลั่งพุ่งสูง'
        }
      ],
      dosAndDonts: {
        dos: [
          'ทานไข่วันละ 1-2 ฟอง เสริมกรดอะมิโนจำเป็น',
          'ดื่มน้ำเปล่าให้เพียงพอ 1.5 - 2 ลิตรต่อวัน',
          'ออกไปรับแสงแดดอ่อนๆ ตอนเช้าเพื่อสังเคราะห์วิตามิน D'
        ],
        donts: [
          'หลีกเลี่ยงน้ำหวาน ชานม น้ำอัดลม และขนมกรุบกรอบรสเค็มจัด',
          'ไม่ทานมื้อดึกใกล้เวลาเข้านอน เพราะทำให้นอนหลับไม่สนิท',
          'หลีกเลี่ยงอาหารแปรรูป (Ultra-processed foods) ไส้กรอก บะหมี่กึ่งสำเร็จรูป'
        ]
      },
      clinicalNote: 'ข้อแนะนำจากทันตแพทย์: เด็กยุคปัจจุบันทานแต่อาหารนิ่มละเอียด ทำให้ขากรรไกรไม่พัฒนา การฝึกให้เคี้ยวผักผลไม้สดทุกวันจะช่วยให้ฟันแท้มีพื้นที่ขึ้น ไม่ซ้อนเก',
      checklistItems: [
        'ทานโปรตีนและไข่ทุกวัน',
        'ดื่มนมจืดหรือเสริมแคลเซียม',
        'งดขนมหวานหลัง 20:00 น.'
      ]
    }
  },
  {
    id: 'k_bad_habits',
    categoryKey: 'habits',
    number: '05',
    emoji: '🚫',
    categoryLabel: 'พฤติกรรมที่ต้องระวัง',
    title: 'พฤติกรรมที่ต้องระวัง & ปรับแก้',
    subtitle: 'บอกลาการดูดนิ้ว กัดเล็บ กัดปาก เท้าคาง และนอนตะแคงทับหน้า',
    themeColor: {
      gradient: 'from-rose-500 via-pink-600 to-rose-700',
      bgLight: 'bg-rose-50/70 hover:bg-rose-50/90',
      border: 'border-rose-200 hover:border-rose-400',
      text: 'text-rose-950',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeText: 'text-rose-800',
      iconBg: 'bg-rose-600 text-white',
      iconText: 'text-rose-700',
      accent: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    summaryPoints: [
      'บอกลาการดูดนิ้ว: ป้องกันฟันหน้าสบเปิด (Open Bite) และเพดานปากลึกแคบ',
      'หยุดกัดเล็บ & กัดริมฝีปาก: ลดแรงกดผิดธรรมชาติที่ทำให้ฟันหน้าบิ่นและยื่น',
      'เลิกเท้าคาง & นอนทับหน้า: ป้องกันขากรรไกรล่างเอียงเบี้ยวเสียสมดุล'
    ],
    popupDetail: {
      quickBadge: '⚡ สรุปเข้าใจใน 30 วินาที • ปรับพฤติกรรมเสี่ยง',
      overview: 'พฤติกรรมความเคยชินเพียงเล็กน้อย แต่ทำซ้ำๆ ทุกวัน สามารถสร้างแรงบิดเบือนที่ทำให้กระดูกขากรรไกรและแนวฟันผิดรูปได้อย่างคาดไม่ถึง',
      quickSummary30s: [
        'การดูดนิ้วเพียงวันละ 6 ชม. สามารถเคลื่อนฟันหน้าให้ยื่นเหยินได้',
        'การเท้าคางถ่ายน้ำหนักศีรษะลงข้อต่อขากรรไกร ทำให้ใบหน้าสองข้างไม่เท่ากัน',
        'ชื่นชมและให้กำลังใจเมื่อน้องไม่ทำพฤติกรรมเสี่ยง แทนการดุด่าว่ากล่าว'
      ],
      visualInfographicSteps: [
        {
          stepNumber: '1',
          title: 'อันตรายจากการดูดนิ้ว (Thumb Sucking)',
          description: 'นิ้วจะดันฟันบนให้ยื่น และกดฟันล่างให้ล้มเข้าด้านใน เกิดช่องว่างฟันหน้าไม่สบกัน',
          iconEmoji: '👍',
          highlight: 'ฟันสบเปิด เพดานปากแหลม'
        },
        {
          stepNumber: '2',
          title: 'การกัดเล็บ / กัดดินสอ',
          description: 'ทำให้ขอบฟันหน้าบิ่น แตก สึกหรอ และเชื้อโรคเข้าสู่ช่องปากได้ง่าย',
          iconEmoji: '✏️',
          highlight: 'เคลือบฟันสึก ฟันบิ่น'
        },
        {
          stepNumber: '3',
          title: 'การเท้าคาง & นอนคว่ำทับหน้า',
          description: 'แรงกดทับด้านเดียวทำให้ขากรรไกรล่างเอียงเบี้ยว ส่งผลให้รูปหน้าไม่สมมาตร',
          iconEmoji: '💆',
          highlight: 'หน้าเบี้ยว ข้อต่อขากรรไกรมีเสียง'
        }
      ],
      dosAndDonts: {
        dos: [
          'หากิจกรรมที่ใช้สองมือ เช่น ปั้นดินน้ำมัน เล่นดนตรี วาดรูป เมื่อรู้สึกเบื่อหรือกังวล',
          'เตือนตัวเองอย่างอ่อนโยน หรือให้คุณพ่อคุณแม่ช่วยเตือนด้วยคำพูดเชิงบวก',
          'ใช้อุปกรณ์ EF Trainer ช่วยทดแทนความต้องการดูดนิ้วยามนอน'
        ],
        donts: [
          'อย่าลงโทษหรือดุว่ารุนแรง เพราะอาจยิ่งทำให้เด็กเกิดความเครียดและดูดนิ้วมากขึ้น',
          'หลีกเลี่ยงการเท้าคางขณะนั่งเรียนหรือทำการบ้าน',
          'อย่านอนคว่ำหน้ากดทับหมอนเป็นประจำ'
        ]
      },
      clinicalNote: 'ข้อแนะนำจากทันตแพทย์: หากเลิกพฤติกรรมดูดนิ้วได้ก่อนอายุ 6-8 ขวบ กระดูกและฟันมีโอกาสกลับคืนสู่ตำแหน่งปกติได้เองสูงมากโดยไม่ต้องจัดฟันซับซ้อน',
      checklistItems: [
        'ไม่ดูดนิ้วทั้งกลางวันและกลางคืน',
        'ไม่กัดเล็บหรือแทะของแข็ง',
        'นั่งตัวตรง ไม่เท้าคาง'
      ]
    }
  },
  {
    id: 'k_parent_faq',
    categoryKey: 'faq',
    number: '06',
    emoji: '💡',
    categoryLabel: 'Q&A คำถามพบบ่อย',
    title: 'Q&A สำหรับผู้ปกครอง',
    subtitle: 'ปรับตัวอย่างไรช่วงสัปดาห์แรก ฟันโยกปกติไหม และวิธีสร้างวินัย',
    themeColor: {
      gradient: 'from-amber-400 via-yellow-500 to-amber-600',
      bgLight: 'bg-yellow-50/70 hover:bg-yellow-50/90',
      border: 'border-yellow-200 hover:border-yellow-400',
      text: 'text-amber-950',
      badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      badgeText: 'text-yellow-900',
      iconBg: 'bg-yellow-400 text-slate-950 font-black',
      iconText: 'text-yellow-900',
      accent: 'bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black'
    },
    summaryPoints: [
      'ปรับตัวช่วงสัปดาห์แรก: อาจมีน้ำลายไหลหรือตึงฟันเล็กน้อย 3-5 วันแรก ถือเป็นปกติ',
      'ฟันโยกเป็นเรื่องปกติไหม: ฟันน้ำนมจะโยกตามธรรมชาติเมื่อฟันแท้พร้อมขึ้น',
      'ใส่อุปกรณ์แล้วพูดไม่ชัด: ฝึกใส่ขณะทำกิจกรรมเงียบๆ เช่น อ่านหนังสือ ทำการบ้าน'
    ],
    popupDetail: {
      quickBadge: '⚡ สรุปเข้าใจใน 30 วินาที • ไขข้อข้องใจผู้ปกครอง',
      overview: 'รวมคำถามยอดฮิตและข้อสงสัยทางการแพทย์ที่ผู้ปกครองถามบ่อยที่สุด พร้อมคำตอบที่เข้าใจง่ายและแนวทางปฏิบัติจริง',
      quickSummary30s: [
        'สัปดาห์แรกเน้นสร้างความคุ้นเคย ค่อยๆ เพิ่มเวลาใส่',
        'ความรู้สึกตึงเบาๆ แปลว่ากล้ามเนื้อและกระดูกกำลังตอบสนองต่อการฝึก',
        'การให้รางวัลเล็กๆ น้อยๆ และชื่นชมความสม่ำเสมอคือกุญแจสู่ความสำเร็จ'
      ],
      faqList: [
        {
          question: 'Q: สัปดาห์แรกน้องบ่นเจ็บหรือตึงฟัน ควรทำอย่างไร?',
          answer: 'A: เป็นเรื่องปกติมากค่ะ เพราะอุปกรณ์กำลังส่งแรงปรับตำแหน่งขากรรไกร อาการตึงจะค่อยๆ หายไปใน 3-5 วัน แนะนำให้ใส่ช่วงสั้นๆ วันละ 30-60 นาทีก่อน แล้วค่อยเพิ่มเวลาเมื่อคุ้นเคย'
        },
        {
          question: 'Q: น้องใส่อุปกรณ์นอนแล้วตื่นมาพบว่าหลุดบ่อยมาก ทำอย่างไรดี?',
          answer: 'A: ในช่วง 1-2 สัปดาห์แรก กล้ามเนื้อปากยังไม่แข็งแรงพอจึงอาจหลายหลุดได้ แก้ไขโดยให้ฝึกใส่ตอนกลางวันขณะดูทีวีหรืออ่านหนังสือ 1-2 ชั่วโมง เมื่อกล้ามเนื้อ Lip Seal ชิน จะไม่หลุดตอนนอนค่ะ'
        },
        {
          question: 'Q: ถ้าฟันน้ำนมเริ่มโยก ยังใส่อุปกรณ์ต่อได้ไหม?',
          answer: 'A: สามารถใส่ต่อได้ตามปกติค่ะ วัสดุยืดหยุ่นของ EF Trainer ได้รับการออกแบบมาเพื่อรองรับฟันที่กำลังผลัดเปลี่ยนโดยไม่ขัดขวางการขึ้นของฟันแท้'
        },
        {
          question: 'Q: ต้องใส่ต่อเนื่องนานแค่ไหนถึงจะเห็นผลชัดเจน?',
          answer: 'A: หากใส่และฝึก OMT สม่ำเสมอทุกวัน จะเริ่มเห็นการเปลี่ยนแปลงของรูปหน้าและทางเดินหายใจใน 3-6 เดือน และแผนการรักษาครบวงจรอยู่ที่ประมาณ 12-18 เดือนค่ะ'
        }
      ],
      clinicalNote: 'ข้อแนะนำจากทันตแพทย์หญิง นภาพร วรรณษา: ความสม่ำเสมอวันละ 10-15 นาที มีค่ามากกว่าการบังคับน้องทำนานๆ แบบหักโหม ชวนน้องเล่นเป็นภารกิจประจำวัน จะทำให้น้องมีความสุขในการฝึกค่ะ',
      checklistItems: [
        'ติดตามบันทึก Check-in ทุกวัน',
        'สังเกตพฤติกรรมการหายใจเวลานอน',
        'นำอุปกรณ์มาตรวจเช็กทุกครั้งที่นัดหมาย'
      ]
    }
  }
];

interface KnowledgeHubProps {
  onNavigate?: (tab: string) => void;
}

export default function KnowledgeHub({ onNavigate }: KnowledgeHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<KnowledgeCardData | null>(null);

  const filteredCards = useMemo(() => {
    return KNOWLEDGE_CARDS.filter(card => {
      const matchCat = selectedCategory === 'all' || card.categoryKey === selectedCategory;
      const matchQuery = !searchQuery.trim() || 
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.summaryPoints.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 text-left pb-10">
      {/* ========================================================================= */}
      {/* 1. Header Banner                                                          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-purple-400/20 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-purple-200 border border-white/15 text-[11px] font-bold">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Patient Knowledge Hub • คลังความรู้ & เคล็ดลับการฝึก</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>📚 คลังความรู้สุขภาพ & เคล็ดลับการเติบโต</span>
            </h1>
            <p className="text-purple-200 text-xs font-medium max-w-xl leading-relaxed">
              สรุปองค์ความรู้ 6 หมวดหมู่ อ่านเข้าใจง่ายใน 30 วินาที โดย ทันตแพทย์หญิง นภาพร วรรณษา (Growth Lab Clinic)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('หน้าหลัก')}
                className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🏠 กลับหน้าหลัก</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Search & Category Filter Pills                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-purple-100 shadow-2xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'ทั้งหมด (6 หมวด)' },
            { id: 'ef', label: '🦷 EF Trainer' },
            { id: 'omt', label: '👅 OMT ลิ้น&ปาก' },
            { id: 'breathing', label: '🫁 หายใจจมูก' },
            { id: 'gns', label: '🥦 โภชนาการ GNS' },
            { id: 'habits', label: '🚫 ระวังพฤติกรรม' },
            { id: 'faq', label: '💡 Q&A ผู้ปกครอง' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'bg-slate-100/80 hover:bg-purple-50 text-slate-700 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาความรู้/เคล็ดลับ..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Visual Cards Grid (Bite-sized Infographics)                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            onClick={() => setSelectedCard(card)}
            className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-2xs group relative overflow-hidden ${card.themeColor.bgLight} ${card.themeColor.border}`}
          >
            {/* Top Bar: Icon + Category Badge + Number */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-2xs ${card.themeColor.iconBg}`}>
                    <span>{card.emoji}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wide ${card.themeColor.badgeBg}`}>
                    {card.categoryLabel}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-400 font-mono">
                  #{card.number}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className={`text-base font-black tracking-tight group-hover:text-purple-700 transition-colors ${card.themeColor.text}`}>
                  {card.title}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">
                  {card.subtitle}
                </p>
              </div>

              {/* Bite-sized 3 Bullet Points */}
              <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/70 space-y-1.5 text-left shadow-2xs">
                {card.summaryPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                    <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                    <span className="text-[11px] leading-snug font-medium line-clamp-2">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Button Action */}
            <div className="pt-1">
              <button
                type="button"
                className="w-full py-2 px-3 bg-white hover:bg-purple-600 group-hover:bg-purple-600 text-purple-900 group-hover:text-white font-black text-xs rounded-xl border border-purple-200/80 group-hover:border-purple-600 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>📖 แตะอ่านสรุป & รูปภาพ</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <p className="text-2xl">🔍</p>
          <p className="text-sm font-bold text-slate-700">ไม่พบเนื้อหาที่ตรงกับคำค้นหา "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
          >
            ล้างคำค้นหา
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Interactive Card Popup (30-second Bite-sized Infographic Modal)         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCard && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs prevent-pull-refresh" 
            style={{ overscrollBehaviorY: 'contain' }}
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-2xl rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-left max-h-[92vh] overflow-y-auto custom-scrollbar border border-purple-100"
            >
              {/* Header inside popup */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs ${selectedCard.themeColor.iconBg}`}>
                    <span>{selectedCard.emoji}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${selectedCard.themeColor.badgeBg}`}>
                      {selectedCard.categoryLabel}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {selectedCard.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 30-Second Quick Summary Box */}
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-3.5 rounded-2xl border border-purple-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-xs text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{selectedCard.popupDetail.quickBadge}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {selectedCard.popupDetail.overview}
                </p>
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {selectedCard.popupDetail.quickSummary30s.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-purple-950 font-bold bg-white/80 p-2 rounded-xl border border-purple-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Infographic Steps (if available) */}
              {selectedCard.popupDetail.visualInfographicSteps && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>📌 ขั้นตอนปฏิบัติ & เทคนิคสำคัญ:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedCard.popupDetail.visualInfographicSteps.map((st, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center">
                              {st.stepNumber}
                            </span>
                            <span className="text-base">{st.iconEmoji}</span>
                          </div>
                          <p className="text-xs font-black text-slate-900 leading-snug">{st.title}</p>
                          <p className="text-[11px] text-slate-600 leading-tight">{st.description}</p>
                        </div>
                        {st.highlight && (
                          <div className="pt-1">
                            <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[9px] font-bold">
                              {st.highlight}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Do's and Don'ts Comparison (if available) */}
              {selectedCard.popupDetail.dosAndDonts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* DOs */}
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>สิ่งที่ควรทำ (Do's) ✅</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-emerald-950 font-medium">
                      {selectedCard.popupDetail.dosAndDonts.dos.map((d, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DONTs */}
                  <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>สิ่งที่ไม่ควรทำ (Don'ts) ❌</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-rose-950 font-medium">
                      {selectedCard.popupDetail.dosAndDonts.donts.map((d, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ List (for Q&A Card) */}
              {selectedCard.popupDetail.faqList && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800">💡 คำถาม-คำตอบที่พบบ่อย:</h4>
                  <div className="space-y-2">
                    {selectedCard.popupDetail.faqList.map((faq, i) => (
                      <div key={i} className="bg-yellow-50/60 p-3 rounded-xl border border-yellow-200/80 space-y-1">
                        <p className="text-xs font-black text-amber-950">{faq.question}</p>
                        <p className="text-[11px] text-slate-700 leading-relaxed pl-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Note from Doctor */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                  <span>คำแนะนำจากแพทย์ (Clinical Insight):</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {selectedCard.popupDetail.clinicalNote}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  ✓ เข้าใจแล้ว • ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
