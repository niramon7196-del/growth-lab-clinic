import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API routes and health check
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      app: "Growth Lab", 
      timestamp: new Date().toISOString() 
    });
  });

  app.get("/api/version", (_req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.status(200).json({
      version: "v1.1.0",
      timestamp: new Date().toISOString(),
      appName: "Growth Lab Dental & Myofunctional Therapy System"
    });
  });

  // Clean Single Fetch Endpoint for activity tracking (Check-in, Login, Exercise logs)
  app.all("/api/track-activity", async (req, res) => {
    try {
      const now = new Date();
      const bangkokDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      const bangkokTimeStr = now.toLocaleTimeString('th-TH', { 
        timeZone: 'Asia/Bangkok', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      const [hourStr] = bangkokTimeStr.split(':');
      const isPast21PM = parseInt(hourStr, 10) >= 21;

      if (req.method === 'GET') {
        return res.status(200).json({
          สถานะ: 'ปกติ (Active)',
          วันที่ปัจจุบัน: bangkokDateStr,
          เวลาปัจจุบัน: bangkokTimeStr,
          ตัดรอบ3ทุ่มแล้ว: isPast21PM
        });
      }

      const body = req.body || {};
      const { type, patientId, hn, patientName, activity, metadata, timestamp } = body;
      
      const record = {
        ประเภท: body.ประเภท || type || activity || 'เช็คอิน',
        รหัสคนไข้: body.รหัสคนไข้ || patientId || hn || 'unknown',
        รหัสประจำตัวHN: body.รหัสประจำตัวHN || hn || patientId || '',
        ชื่อผู้รับการดูแล: body.ชื่อผู้รับการดูแล || patientName || '',
        สถานะสำเร็จ: typeof body.สถานะสำเร็จ === 'boolean' ? body.สถานะสำเร็จ : (body.status === true || body.status === 'completed'),
        คะแนนความสม่ำเสมอ: Number(body.คะแนนความสม่ำเสมอ ?? body.score ?? 100),
        จำนวนแบบฝึกหัดที่ทำเสร็จ: Number(body.จำนวนแบบฝึกหัดที่ทำเสร็จ ?? metadata?.completedCount ?? 0),
        จำนวนภารกิจทั้งหมด: Number(body.จำนวนภารกิจทั้งหมด ?? metadata?.totalTasks ?? 4),
        ใส่อุปกรณ์EF: typeof body.ใส่อุปกรณ์EF === 'boolean' ? body.ใส่อุปกรณ์EF : Boolean(body.efWorn || metadata?.efWorn),
        จำนวนชั่วโมงใส่EF: Number(body.จำนวนชั่วโมงใส่EF ?? metadata?.efDurationHours ?? 0),
        วันที่: body.วันที่ || bangkokDateStr,
        เวลา: body.เวลา || bangkokTimeStr,
        หมายเหตุ: body.หมายเหตุ || metadata?.notes || '',
        receivedAt: new Date().toISOString()
      };

      console.log(`[TrackActivity API] Activity: ${record.ประเภท} for HN: ${record.รหัสประจำตัวHN || 'N/A'} (Cut-off 21:00: ${isPast21PM})`);

      // Forward to Google Apps Script if APPS_SCRIPT_URL configured
      const appsScriptUrl = process.env.APPS_SCRIPT_URL || 
                            process.env.VITE_GOOGLE_SCRIPT_URL || 
                            'https://script.google.com/macros/s/AKfycbyk_1CbD39HQcP8vOXofkPJsYeLOvgklYk608MuK-v4vt4NgUa_Ang73AHpubIO4Pbv/exec';
      if (appsScriptUrl) {
        try {
          fetch(appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'dailycheckin',
              altAction: 'logDaily',
              sheetName: 'Daily_Logs',
              targetSheet: 'Daily_Logs',
              timestamp: new Date().toISOString(),
              hn: record.รหัสประจำตัวHN,
              HN: record.รหัสประจำตัวHN,
              patientName: record.ชื่อผู้รับการดูแล,
              score: record.คะแนนความสม่ำเสมอ || 100,
              streak: 1,
              status: record.สถานะสำเร็จ ? 'completed' : 'pending',
              date: record.วันที่,
              time: record.เวลา,
              type: record.ประเภท,
              notes: record.หมายเหตุ,
              payload: record
            })
          }).catch(e => console.warn('[TrackActivity API] Apps Script background forward error:', e));
        } catch {}
      }

      return res.status(200).json({
        สำเร็จ: true,
        ข้อความ: 'บันทึกข้อมูลกิจกรรมเรียบร้อยแล้ว',
        ข้อมูลกิจกรรม: record,
        ตัดรอบ3ทุ่มแล้ว: isPast21PM
      });
    } catch (err: any) {
      console.error('[TrackActivity API] Error processing activity track:', err);
      return res.status(500).json({
        สำเร็จ: false,
        ข้อผิดพลาด: err?.message || 'Failed to track activity'
      });
    }
  });

  const publicPath = path.join(process.cwd(), "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), "dist"))
      ? path.join(process.cwd(), "dist")
      : path.join(process.cwd(), "build");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application build artifacts not found.");
      }
    });
  }

  const server = http.createServer(app);
  
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Growth Lab Server] Ready and listening on http://0.0.0.0:${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`[Growth Lab Server] Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      console.log("[Growth Lab Server] HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("[Growth Lab Server] Fatal startup error:", err);
  process.exit(1);
});
