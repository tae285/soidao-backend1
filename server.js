import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";
import { fileURLToPath } from "url";

/* ────────────────────────────────────────────
   IMPORT ROUTES
───────────────────────────────────────────── */
import linksRouter from "./routes/linksRouter.js";
import { authRouter } from "./routes/auth.js";
import { jobsRouter } from "./routes/jobs.js";
import { newsRouter } from "./routes/news.js";
import { registerActivitiesRoutes } from "./routes/activities.js";
import staffRoutes from "./routes/staff.js";
import downloadsRouter from "./routes/downloads.js";
import { procurementRouter } from "./routes/procurement.js";
import uploadRouter from "./routes/upload.js";
import donateRouter from "./routes/donate.js";
import { itaRouter } from "./routes/ita.js";

/* ────────────────────────────────────────────
   INITIAL SETUP
───────────────────────────────────────────── */
dotenv.config();

const app = express();
app.disable("x-powered-by");

/* ────────────────────────────────────────────
   SECURITY SETTINGS
───────────────────────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());

/* ────────────────────────────────────────────
   CORS (รองรับ Cloudflare Tunnel)
───────────────────────────────────────────── */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ────────────────────────────────────────────
   PARSERS
───────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ────────────────────────────────────────────
   MONGO DB CONNECT
───────────────────────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* ────────────────────────────────────────────
   UPLOAD DIRECTORY SETUP
───────────────────────────────────────────── */
const uploadRoot = path.join(process.cwd(), "uploads");
const uploadFolders = [
  "activities",
  "downloads",
  "staff",
  "news",
  "procurement",
  "ita",
];

if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot);

uploadFolders.forEach((folder) => {
  const full = path.join(uploadRoot, folder);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

/* 🟢 ให้ static files ทำงานแบบมั่นคงที่สุด */
app.use(
  "/uploads",
  express.static(uploadRoot, {
    maxAge: "1h",
    etag: true,
    lastModified: true,
    fallthrough: true,
  })
);

/* ────────────────────────────────────────────
   REGISTER ROUTES
───────────────────────────────────────────── */
registerActivitiesRoutes(app);
app.use("/api/upload", uploadRouter);
app.use("/api/auth", authRouter);
app.use("/api/news", newsRouter);
app.use("/api/procurement", procurementRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/staff", staffRoutes);
app.use("/api/downloads", downloadsRouter);
app.use("/api/donate", donateRouter);
app.use("/api/ita", itaRouter);
app.use("/api/links", linksRouter);

/* ────────────────────────────────────────────
   FRONTEND (Vite Build)
───────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../frontend-app/dist");

app.use(
  express.static(distPath, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

/* SPA fallback */
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

/* ────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});
