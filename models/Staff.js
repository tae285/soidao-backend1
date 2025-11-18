// models/Staff.js
import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema({
  name: String,
  position: String,
  department: String,
  image: String,
}, { timestamps: true });

export default mongoose.model("Staff", StaffSchema);
