import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  blockNum: { type: String, required: true },
  floorNum: { type: String, required: true },
  roomNum: { type: String, required: true }
});

export default mongoose.model("Student", studentSchema);
