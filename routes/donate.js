// backend/routes/donate.js
import express from "express"
import multer from "multer"
import path from "path"

const router = express.Router()

// ===== Multer Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads/activities")) // เก็บในโฟลเดอร์ activities
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname
    cb(null, uniqueName)
  }
})
const upload = multer({ storage })

// เก็บข้อมูลผู้บริจาคแบบง่าย ๆ ใน memory (ทีหลังค่อยต่อ DB)
let donors = [
  {
    id: 1,
    name: "ผู้บริจาคตัวอย่าง",
    amount: 1000,
    item: "หน้ากากอนามัย",
    date: "2025-10-06",
    image: "/uploads/activities/donor1.jpg"
  }
]

// ✅ GET: ดึงรายการผู้บริจาคทั้งหมด
router.get("/", (req, res) => {
  res.json(donors)
})

// ✅ POST: เพิ่มผู้บริจาคใหม่ (พร้อมอัปโหลดไฟล์)
router.post("/", upload.single("image"), (req, res) => {
  const { name, amount, item, date } = req.body
  const imagePath = req.file ? `/uploads/activities/${req.file.filename}` : null

  const newDonor = {
    id: donors.length + 1,
    name,
    amount: Number(amount),
    item,
    date,
    image: imagePath
  }

  donors.push(newDonor)
  res.json(newDonor)
})

// ✅ DELETE: ลบผู้บริจาค
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id)
  donors = donors.filter(d => d.id !== id)
  res.json({ success: true })
})

export default router
