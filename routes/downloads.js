import express from "express"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import multer from "multer"

const router = express.Router()

// ✅ fix __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ path ของไฟล์ JSON
const downloadsFile = path.join(__dirname, "../database/mysql/downloads.json")

// 📂 ที่เก็บไฟล์จริง
const uploadDir = path.join(process.cwd(), "uploads", "downloads")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// ⚡ ตั้งค่า multer (เปลี่ยนชื่อไฟล์เป็น timestamp)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf"
    cb(null, Date.now() + ext)   // เช่น: 1759371529732.pdf
  }
})
const upload = multer({ storage })

// ✅ โหลดข้อมูล
router.get("/", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(downloadsFile, "utf8"))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: "โหลดไฟล์ไม่สำเร็จ" })
  }
})

// ✅ เพิ่มไฟล์ใหม่
router.post("/", upload.single("file"), (req, res) => {
  try {
    const { name, category } = req.body
    const data = JSON.parse(fs.readFileSync(downloadsFile, "utf8"))

    const newItem = {
      id: Date.now().toString(),
      name,
      category,
      // ✅ เก็บเป็น relative path
      url: `/uploads/downloads/${req.file.filename}`
    }

    data.push(newItem)
    fs.writeFileSync(downloadsFile, JSON.stringify(data, null, 2), "utf8")
    res.json({ message: "เพิ่มไฟล์สำเร็จ", file: newItem })
  } catch (err) {
    console.error("❌ เพิ่มไฟล์ไม่สำเร็จ:", err.message)
    res.status(500).json({ error: "เพิ่มไฟล์ไม่สำเร็จ" })
  }
})

// ✅ ลบไฟล์
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params
    let data = JSON.parse(fs.readFileSync(downloadsFile, "utf8"))
    const file = data.find(item => item.id === id)

    if (!file) {
      return res.status(404).json({ error: "ไม่พบไฟล์ในฐานข้อมูล" })
    }

    // ✅ ใช้ path.resolve เพื่อความชัวร์
    const filePath = path.resolve(process.cwd(), "." + file.url)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    } else {
      console.warn("⚠️ ไม่พบไฟล์จริงใน disk:", filePath)
    }

    // ✅ ลบจาก JSON
    data = data.filter(item => item.id !== id)
    fs.writeFileSync(downloadsFile, JSON.stringify(data, null, 2))

    res.json({ message: "ลบไฟล์สำเร็จ", success: true })
  } catch (err) {
    console.error("❌ ลบไฟล์ไม่สำเร็จ:", err)
    res.status(500).json({ error: "ลบไฟล์ไม่สำเร็จ", details: err.message })
  }
})

export default router
