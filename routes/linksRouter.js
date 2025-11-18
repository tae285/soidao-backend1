import express from "express";
import multer from "multer";
import Links from "../models/Links.js";

const router = express.Router();

// 📌 ตั้งค่าอัปโหลดรูป
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/links"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// =========================
// 📌 GET — ดึงลิงก์ทั้งหมด
// =========================
router.get("/", async (req, res) => {
  const data = await Links.find().sort({ createdAt: -1 });
  res.json(data);
});

// =========================
// 📌 POST — เพิ่มลิงก์ใหม่
// =========================
router.post("/", upload.single("image"), async (req, res) => {
  const { title, url } = req.body;

  const newLink = new Links({
    title,
    url,
    image: req.file ? "/uploads/links/" + req.file.filename : null,
  });

  await newLink.save();
  res.json({ message: "เพิ่มลิงก์สำเร็จ", newLink });
});

// =========================
// 📌 PUT — อัปเดตลิงก์
// =========================
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;

  const updateData = { title, url };

  if (req.file) {
    updateData.image = "/uploads/links/" + req.file.filename;
  }

  const updated = await Links.findByIdAndUpdate(id, updateData, { new: true });
  res.json(updated);
});

// =========================
// 📌 DELETE — ลบลิงก์
// =========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await Links.findByIdAndDelete(id);
  res.json({ message: "ลบสำเร็จ" });
});

export default router;
