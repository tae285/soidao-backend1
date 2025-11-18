// backend/models/Ita.js
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  text: { type: String, required: true },  // ข้อความหัวข้อย่อย
  url:  { type: String, default: "" },     // path PDF เช่น /uploads/ita/xxx.pdf
});

const ItaSchema = new mongoose.Schema(
  {
    year:  { type: Number, required: true },   // ปี พ.ศ.
    moit:  { type: String, required: true },   // MOIT 1, 2, ...
    title: { type: String, required: true },   // ชื่อหัวข้อใหญ่
    items: [ItemSchema],                       // array ของหัวข้อย่อย
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Ita = mongoose.model("Ita", ItaSchema);
export default Ita;
