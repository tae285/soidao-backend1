import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// เก็บไฟล์ใน backend/uploads/news เป็นค่า default
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ใช้ query param เช่น ?type=news เพื่อเลือกโฟลเดอร์
    const type = req.query.type || "news"; 
    cb(null, `uploads/${type}/`);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 📌 API อัปโหลดรูป
router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "ไม่พบไฟล์" });

  res.json({
    message: "อัปโหลดสำเร็จ",
    fileUrl: `/uploads/${req.query.type || "news"}/${req.file.filename}`
  });
});

export default router;
