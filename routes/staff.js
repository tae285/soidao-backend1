// backend/routes/staff.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Staff from "../models/Staff.js";

const router = express.Router();

// 📁 โฟลเดอร์เก็บรูป staff
const uploadDir = path.join(process.cwd(), "uploads", "staff");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 📌 Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* ============================
   📌 GET staff ทั้งหมด
============================= */
router.get("/", async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   📌 POST เพิ่ม staff
============================= */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newStaff = await Staff.create({
      name: req.body.name,
      position: req.body.position,
      department: req.body.department,
      image: req.file ? "/uploads/staff/" + req.file.filename : ""
    });

    res.json(newStaff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   📌 PUT แก้ไข staff
============================= */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: "ไม่พบข้อมูล" });

    // อัปเดตฟิลด์
    staff.name = req.body.name;
    staff.position = req.body.position;
    staff.department = req.body.department;

    // ถ้ามีการอัปโหลดรูปใหม่
    if (req.file) {
      if (staff.image) {
        const oldPath = path.join(process.cwd(), staff.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      staff.image = "/uploads/staff/" + req.file.filename;
    }

    await staff.save();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   📌 DELETE ลบ staff
============================= */
router.delete("/:id", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: "ไม่พบข้อมูล" });

    // ลบรูปเก่า
    if (staff.image) {
      const oldPath = path.join(process.cwd(), staff.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await Staff.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
