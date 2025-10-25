import express from "express";
import Student from "../models/Student.js";

const router = express.Router();

/**
 * 📍 GET /api/students/:rollNo
 * Fetch seat info by roll number
 */
router.get("/:rollNo", async (req, res) => {
  try {
    const rollNo = req.params.rollNo.toUpperCase();
    const student = await Student.findOne({ rollNo });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 📍 POST /api/students/assign-seats
 * Auto assign random seats to all students
 */
router.post("/assign-seats", async (req, res) => {
  try {
    await Student.deleteMany(); // Clear old assignments

    const departments = {
      105: { name: "CSE", sections: 16 },
      106: { name: "AI", sections: 5 },
      107: { name: "AIML", sections: 6 },
      110: { name: "DS", sections: 5 },
      111: { name: "ECE", sections: 6 },
      112: { name: "IT", sections: 5 },
    };

    const sectionLetters = ["A", "B", "C", "D", "E", "F"];
    const students = [];

    // Generate all roll numbers dynamically
    for (const deptCode in departments) {
      const { sections } = departments[deptCode];
      for (let s = 0; s < sections; s++) {
        const section = sectionLetters[s] || String.fromCharCode(65 + s);
        for (let roll = 1; roll <= 66; roll++) {
          const rollStr = roll.toString().padStart(2, "0");
          students.push(`23EG${deptCode}${section}${rollStr}`);
        }
      }
    }

    const blocks = {
      A: { floors: 4, roomsPerFloor: 20 },
      B: { floors: 3, roomsPerFloor: 5 },
      C: { floors: 3, roomsPerFloor: 10 },
      D: { floors: 5, roomsPerFloor: 12 },
      E: { floors: 7, roomsPerFloor: 12 },
      H: { floors: 7, roomsPerFloor: 15 },
      I: { floors: 4, roomsPerFloor: 15 },
    };

    const blockKeys = Object.keys(blocks);
    const assigned = [];

    students.forEach((rollNo) => {
      const block = blockKeys[Math.floor(Math.random() * blockKeys.length)];
      const floor = Math.floor(Math.random() * blocks[block].floors) + 1;
      const room = Math.floor(Math.random() * blocks[block].roomsPerFloor) + 1;
      const roomStr = `${block}${floor}${room.toString().padStart(2, "0")}`;

      assigned.push({
        rollNo,
        blockNum: block,
        floorNum: floor.toString(),
        roomNum: roomStr,
      });
    });

    await Student.insertMany(assigned);

    res.json({
      message: "✅ Random seating assignment completed for all departments!",
      totalStudents: assigned.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error assigning seats" });
  }
});

export default router;
