import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";

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
   CORS
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

/* Static uploads */
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
   START SERVER
───────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
