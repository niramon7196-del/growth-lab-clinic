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
