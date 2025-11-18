// backend/routes/ita.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Ita from "../models/Ita.js";

const itaRouter = express.Router();

// === โฟลเดอร์เก็บไฟล์ ITA ===
const uploadDir = path.join(process.cwd(), "uploads", "ita");
fs.mkdirSync(uploadDir, { recursive: true });

// === Multer config ===
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// ❗ ใช้ .any() เพื่อให้รับ field ชื่ออะไรก็ได้ (รวม items[0][file] ด้วย)
const upload = multer({ storage }).any();

/**
 * แปลง req.body + req.files -> items[]
 * รองรับ 2 แบบ:
 *   1) body.items = [ { text, url }, ... ]
 *   2) field name = items[0][text], items[0][url], items[0][file]
 */
function buildItemsFromReq(req) {
  let items = [];

  // 🔹 กรณี 1: body.items เป็น array อยู่แล้ว (ตาม log ที่คุณส่งมา)
  if (Array.isArray(req.body.items)) {
    items = req.body.items.map((it) => ({
      text: it?.text || "",
      url: it?.url || "",
    }));
  } else {
    // 🔹 กรณี 2: ใช้ชื่อ field แบบ items[0][text]
    const bodyEntries = Object.entries(req.body || {});
    for (const [key, value] of bodyEntries) {
      const m = key.match(/^items\[(\d+)]\[(text|url)]$/);
      if (!m) continue;
      const idx = parseInt(m[1], 10);
      const field = m[2]; // text | url
      if (!items[idx]) items[idx] = {};
      items[idx][field] = value;
    }
  }

  // 🔹 ผูกไฟล์ PDF จาก fieldname = items[0][file]
  for (const file of req.files || []) {
    const m = file.fieldname.match(/^items\[(\d+)]\[file]$/);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    if (!items[idx]) items[idx] = {};
    items[idx].url = `/uploads/ita/${file.filename}`;
  }

  // 🔹 ตัดตัวที่ไม่มี text ทิ้ง เพราะ schema บังคับ text: required
  return items.filter((it) => it && it.text);
}

function toYear(value) {
  if (!value) return new Date().getFullYear() + 543;
  const n = Number(value);
  if (Number.isNaN(n)) return new Date().getFullYear() + 543;
  return n;
}

// === GET /api/ita ===
itaRouter.get("/", async (req, res) => {
  try {
    const list = await Ita.find().sort({ year: -1, moit: 1 });
    res.json(list);
  } catch (err) {
    console.error("GET /ita error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === POST /api/ita ===
itaRouter.post("/", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("MULTER /api/ita error:", err);
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log("POST /api/ita body =", req.body);
      console.log(
        "POST /api/ita files =",
        req.files?.map((f) => f.fieldname)
      );

      const { year, moit, title } = req.body;
      const items = buildItemsFromReq(req);

      const ita = await Ita.create({
        year: toYear(year),
        moit,
        title,
        items,
      });

      res.status(201).json(ita);
    } catch (e) {
      console.error("POST /ita error:", e);
      res.status(500).json({ message: e.message || "Server error" });
    }
  });
});

// === PUT /api/ita/:id ===
itaRouter.put("/:id", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("MULTER PUT /api/ita error:", err);
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log("PUT /api/ita/:id body =", req.body);
      console.log(
        "PUT /api/ita/:id files =",
        req.files?.map((f) => f.fieldname)
      );

      const { year, moit, title } = req.body;
      const items = buildItemsFromReq(req);

      const ita = await Ita.findByIdAndUpdate(
        req.params.id,
        {
          year: toYear(year),
          moit,
          title,
          items,
        },
        { new: true }
      );

      res.json(ita);
    } catch (e) {
      console.error("PUT /ita/:id error:", e);
      res.status(500).json({ message: e.message || "Server error" });
    }
  });
});

// === DELETE /api/ita/:id ===
itaRouter.delete("/:id", async (req, res) => {
  try {
    await Ita.findByIdAndDelete(req.params.id);
    res.json({ message: "deleted" });
  } catch (err) {
    console.error("DELETE /ita/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export { itaRouter };
