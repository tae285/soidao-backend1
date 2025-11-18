import express from "express"
import fs from "fs"
import path from "path"
import multer from "multer"

const router = express.Router()
const filePath = path.join(process.cwd(), "database/mysql/procurement.json")

// 📂 ตรวจสอบโฟลเดอร์ uploads/procurement
const uploadDir = path.join(process.cwd(), "uploads/procurement")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// ตั้งค่า multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
})
const upload = multer({ storage })

// 📌 helper: โหลดข้อมูล
function loadData() {
  if (!fs.existsSync(filePath)) return []
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    return JSON.parse(raw || "[]")
  } catch {
    return []
  }
}

// 📌 helper: บันทึกข้อมูล
function saveData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// ✅ GET procurement
router.get("/", (req, res) => {
  try {
    res.json(loadData())
  } catch {
    res.status(500).json({ error: "อ่านไฟล์ไม่สำเร็จ" })
  }
})

// ✅ DELETE procurement
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params
    let data = loadData()

    const index = data.findIndex(item => item.id === id)
    if (index === -1) {
      return res.status(404).json({ error: "ไม่พบประกาศนี้" })
    }

    // ลบไฟล์จริงทั้งหมด
    if (data[index].files && data[index].files.length > 0) {
      data[index].files.forEach(f => {
        const filePath = path.join(process.cwd(), f.replace("/uploads", "uploads"))
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      })
    }

    data.splice(index, 1)
    saveData(data)
    res.json({ message: "ลบประกาศเรียบร้อย" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "ลบไม่สำเร็จ" })
  }
})

// ✅ PUT procurement (แก้ไข)
router.put("/:id", upload.array("files"), (req, res) => {
  try {
    const { id } = req.params
    const { title, date, removedFiles } = req.body
    let data = loadData()

    const index = data.findIndex(item => item.id === id)
    if (index === -1) {
      return res.status(404).json({ error: "ไม่พบประกาศนี้" })
    }

    // อัปเดตหัวข้อ + วันที่
    data[index].title = title
    data[index].date = date || data[index].date

    // ถ้ามีไฟล์เก่าเก็บไว้
    if (!Array.isArray(data[index].files)) {
      data[index].files = []
    }

    // ✅ ลบไฟล์เก่าที่เลือก
    if (removedFiles) {
      const removedArr = JSON.parse(removedFiles)
      removedArr.forEach(f => {
        const filePath = path.join(process.cwd(), f.replace("/uploads", "uploads"))
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      })
      data[index].files = data[index].files.filter(f => !removedArr.includes(f))
    }

    // ✅ เพิ่มไฟล์ใหม่
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(f => `/uploads/procurement/${f.filename}`)
      data[index].files = [...data[index].files, ...newFiles]
    }

    saveData(data)
    res.json({ message: "แก้ไขประกาศเรียบร้อย", procurement: data[index] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "แก้ไขไม่สำเร็จ" })
  }
})

// ✅ POST procurement + upload (หลายไฟล์)
router.post("/", upload.array("files"), (req, res) => {
  try {
    const { title, date } = req.body
    const data = loadData()

    const newItem = {
      id: Date.now().toString(),
      title,
      date: date || new Date().toISOString().split("T")[0], // ถ้าไม่ส่งมาก็เก็บวันที่ปัจจุบัน
      files: req.files.map(f => `/uploads/procurement/${f.filename}`)
    }

    data.push(newItem)
    saveData(data)
    res.json({ message: "เพิ่มประกาศจัดซื้อจัดจ้างสำเร็จ", procurement: newItem })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "บันทึกไม่สำเร็จ" })
  }
})

export { router as procurementRouter }
