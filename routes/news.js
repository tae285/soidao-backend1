import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import News from "../models/News.js";

const router = express.Router();

// ===============================
// 📌 ตั้งค่า multer (สำหรับอัปโหลดรูปและ PDF)
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads/news");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ===============================
// 📌 GET: ดึงข่าวทั้งหมด
// ===============================
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    console.error("❌ ดึงข่าวไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "ไม่สามารถดึงข่าวได้" });
  }
});

// ===============================
// 📌 POST: เพิ่มข่าว (รองรับหลายรูป, URL, PDF)
// ===============================
router.post(
  "/upload",
  upload.fields([{ name: "images", maxCount: 10 }, { name: "pdf", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;

      let images = [];

      // ✅ กรณีอัปโหลดไฟล์รูป
      if (req.files?.images) {
        images = req.files.images.map(f => `/uploads/news/${f.filename}`);
      }

      // ✅ กรณีส่งลิงก์รูปมาเอง
      if (imageUrl) {
        if (Array.isArray(imageUrl)) {
          images.push(...imageUrl.map(u => u.trim()).filter(Boolean));
        } else if (typeof imageUrl === "string") {
          images.push(...imageUrl.split(",").map(u => u.trim()).filter(Boolean));
        }
      }

      // ✅ กรณีอัปโหลดไฟล์ PDF
      const pdf = req.files?.pdf
        ? `/uploads/news/${req.files.pdf[0].filename}`
        : "";

      const newNews = new News({
        title,
        description,
        images,
        pdf,
        createdAt: new Date(),
      });

      await newNews.save();
      res.json({ message: "เพิ่มข่าวสำเร็จ", news: newNews });
    } catch (err) {
      console.error("❌ บันทึกข่าวไม่สำเร็จ:", err.message);
      res.status(500).json({ error: "บันทึกข่าวไม่สำเร็จ" });
    }
  }
);

// ===============================
// 📌 PUT: แก้ไขข่าว
// ===============================
router.put(
  "/:id",
  upload.fields([{ name: "images", maxCount: 10 }, { name: "pdf", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;
      const news = await News.findById(req.params.id);
      if (!news) return res.status(404).json({ error: "ไม่พบข่าว" });

      let images = news.images || [];

      // ✅ อัปโหลดรูปใหม่ → แทนที่รูปเดิม
      if (req.files?.images) {
        images = req.files.images.map(f => `/uploads/news/${f.filename}`);
      }

      // ✅ กรณีเพิ่ม URL รูป
      if (imageUrl) {
        if (Array.isArray(imageUrl)) {
          images.push(...imageUrl.map(u => u.trim()).filter(Boolean));
        } else if (typeof imageUrl === "string") {
          images.push(...imageUrl.split(",").map(u => u.trim()).filter(Boolean));
        }
      }

      // ✅ อัปโหลด PDF ใหม่ (ถ้าไม่มี ใช้ของเดิม)
      const pdf = req.files?.pdf
        ? `/uploads/news/${req.files.pdf[0].filename}`
        : news.pdf;

      // อัปเดตค่า
      news.title = title;
      news.description = description;
      news.images = images;
      news.pdf = pdf;

      await news.save();
      res.json({ message: "อัปเดตข่าวสำเร็จ", news });
    } catch (err) {
      console.error("❌ อัปเดตข่าวไม่สำเร็จ:", err.message);
      res.status(500).json({ error: "อัปเดตข่าวไม่สำเร็จ" });
    }
  }
);

// ===============================
// 📌 DELETE: ลบข่าว
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ error: "ไม่พบข่าว" });

    res.json({ message: "ลบข่าวเรียบร้อย" });
  } catch (err) {
    console.error("❌ ลบข่าวไม่สำเร็จ:", err.message);
    res.status(500).json({ error: "ลบข่าวไม่สำเร็จ" });
  }
});

export { router as newsRouter };
