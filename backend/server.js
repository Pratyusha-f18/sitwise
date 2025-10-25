import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import studentRoutes from "./routes/studentRoutes.js"; // Import routes

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// 2. Route Middleware
app.use("/api/students", studentRoutes);

// 3. Simple root route
app.get("/", (req, res) => {
  res.send("Backend running...");
});

// 4. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));