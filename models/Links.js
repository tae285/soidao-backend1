import mongoose from "mongoose";

const LinksSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  image: { type: String }, // เก็บ path เช่น /uploads/xxxx.png
}, { timestamps: true });

export default mongoose.model("Links", LinksSchema);
