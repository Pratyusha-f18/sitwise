import mongoose from "mongoose";

const blockConfigSchema = new mongoose.Schema({
  blockName: {
    type: String,
    required: true,
    unique: true
  },
  floors: {
    type: Number,
    required: true
  },
  roomsPerFloor: {
    type: Number,
    required: true
  }
});

export default mongoose.model("BlockConfig", blockConfigSchema);