import Student from "../models/Student.js";
import BlockConfig from "../models/BlockConfig.js";

// --- Seating Configuration Data ---
const initialBlockData = [
  { blockName: 'A', floors: 4, roomsPerFloor: 15 },
  { blockName: 'B', floors: 3, roomsPerFloor: 5 },
  { blockName: 'C', floors: 3, roomsPerFloor: 10 },
  { blockName: 'D', floors: 5, roomsPerFloor: 12 },
  { blockName: 'E', floors: 6, roomsPerFloor: 12 },
  { blockName: 'H', floors: 7, roomsPerFloor: 12 },
  { blockName: 'I', floors: 4, roomsPerFloor: 11 },
];

// Department Code Mapping based on your rule (105 for CSE, 106 for AI, 107 for AIML)
const deptCodeMapping = {
  '105': 'CSE',
  '106': 'AI',
  '107': 'AIML',
  '110': 'DS',   // NEW: 110 maps to Data Science
  '111': 'ECE',  // NEW: 111 maps to ECE
  '112': 'IT',
};

// Helper: Seed or Fetch Block Data from MongoDB
const getBlockConfiguration = async () => {
  let config = await BlockConfig.find({});
  
  if (config.length === 0) {
    console.log("Block configuration not found. Seeding initial data into MongoDB...");
    await BlockConfig.insertMany(initialBlockData);
    config = initialBlockData; 
  }

  // Convert array to map { 'A': { floors: 4, roomsPerFloor: 15 }, ... }
  return config.reduce((acc, item) => {
    acc[item.blockName] = { floors: item.floors, roomsPerFloor: item.roomsPerFloor };
    return acc;
  }, {});
};

// Helper: Generates a batch of mock students for testing/setup
const generateMockStudents = () => {
  const students = [];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const rollNumCount = 30; 
  const deptCodes = ['105', '106', '107', '110', '111', '112']; 

  for (const deptCode of deptCodes) {
    const department = deptCodeMapping[deptCode];
    for (const section of sections) {
      for (let i = 1; i <= rollNumCount; i++) {
        const rollNumSuffix = i.toString().padStart(2, '0');
        // Roll number format: YY-Indicator-DeptCode-Section-RollNum
        const rollNo = `23EG${deptCode}${section}${rollNumSuffix}`; 
        
        students.push({
          rollNo: rollNo,
          name: `Student ${rollNo}`,
          department: department,
          year: 2023,
          section: section
        });
      }
    }
  }
  return students;
};

// --- Controller 1: Assign Seats (Static Assignment) ---
export const assignSeats = async (req, res) => {
  try {
    // 1. Fetch live config from MongoDB
    const blockInfo = await getBlockConfiguration(); 

    // 2. Generate room iterator based on fetched config
    function* roomIterator() {
      for (const block in blockInfo) {
        for (let f = 1; f <= blockInfo[block].floors; f++) {
          for (let r = 1; r <= blockInfo[block].roomsPerFloor; r++) {
            yield { block: block, floor: f, room: r };
          }
        }
      }
    }
    let currentRoom = roomIterator();
    let currentSeatNo = 1;

    // 3. Generate and prepare students
    const mockStudents = generateMockStudents();
    mockStudents.sort((a, b) => a.rollNo.localeCompare(b.rollNo));
    await Student.deleteMany({}); // Clear existing student seating data
    
    // 4. Assign seats sequentially
    const assignedStudents = mockStudents.map(student => {
      let nextRoom = currentRoom.next();
      if (nextRoom.done) {
        return { ...student, examHall: 'FULL', seatNo: 'N/A' };
      }
      
      const { block, floor, room } = nextRoom.value;
      const examHall = `${block}-F${floor}-R${room}`; // e.g., A-F1-R1

      return {
        ...student,
        examHall: examHall, 
        seatNo: `S${currentSeatNo++}`, 
      };
    });

    // 5. Save all assigned students (Roll Numbers) to MongoDB
    await Student.insertMany(assignedStudents);

    res.status(200).json({ message: `Seats assigned successfully for ${assignedStudents.length} students. Seating is now static.` });
  } catch (error) {
    res.status(500).json({ message: "Error assigning seats", error: error.message });
  }
};

// --- Controller 2: Get Seating for Roll No ---
export const getStudentSeating = async (req, res) => {
  try {
    const rollNo = req.params.rollNo.toUpperCase(); 
    
    // Fetch the static assignment for the roll number from MongoDB
    const student = await Student.findOne({ rollNo: rollNo }); 

    if (!student) {
      return res.status(404).json({ message: `Roll Number ${rollNo} not found.` });
    }

    // Extract Block, Floor, and Room from the stored 'examHall' string
    const parts = student.examHall.split('-');
    const blockNum = parts[0];
    const floorNum = parts[1].replace('F', '');
    const roomNum = parts[2].replace('R', '');

    res.status(200).json({
      rollNo: student.rollNo,
      name: student.name,
      blockNum: blockNum, // Block Number
      floorNum: floorNum, // Floor Number
      roomNum: roomNum,   // Room Number
      seatNo: student.seatNo,
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching seating details", error: error.message });
  }
};